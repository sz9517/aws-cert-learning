---
sidebar_position: 3
title: Error Handling and Retries
---

# Error Handling and Retries: The Cloud Will Always Have Transient Failures. Your Code Has to Survive Them

> This article covers error handling from a **developer's point of view**: why you retry, how to do exponential backoff with jitter, why idempotency makes retries safe, how to handle throttling errors (429 / ThrottlingException / ProvisionedThroughputExceeded), dead-letter queues (DLQ), partial batch failures (ReportBatchItemFailures), circuit breakers, and the retry behavior built into the AWS SDKs. This is a high-frequency topic in DVA-C03 Domain 4 (Troubleshooting and Optimization).

<Vocab title="📌 Terms you will meet in this article (no prior knowledge needed)">

- **Transient failure**: An error that "fixes itself in a moment" — a network blip, a service that is momentarily too busy. It is not your code being broken; retrying usually succeeds.
- **Retry**: After a call fails, you send the same request again, betting it will succeed this time.
- **Exponential backoff**: Instead of hammering immediately, you wait longer after each failure — wait 1s, 2s, 4s, 8s... — to give the downstream a chance to breathe.
- **Jitter**: Adding a bit of randomness to each wait time, so a crowd of clients do not all compute the exact same wait and retry in the same instant, overwhelming the downstream again.
- **Idempotency**: Doing the same request once or many times produces the exact same result (no double charging). This is the prerequisite for "retry-safe".
- **Throttling**: You send too fast and exceed the other side's rate limit, so it blocks you and returns a "too many requests" error asking you to slow down.
- **DLQ (Dead-Letter Queue)**: A separate queue dedicated to messages that keep failing, isolating bad messages and making them easy to investigate later.
- **Circuit breaker**: When the downstream is clearly broken, "stop knocking" — temporarily stop calling it, give it time to recover, and do not keep slamming into a wall wasting resources.

</Vocab>

:::note[💬 Reading tip]
Whenever you see a <Term desc="Like this! Hover over a term with a dotted underline (tap on mobile) and a plain-language explanation pops up.">term with a dotted underline</Term>, hover over it for a plain-language explanation. All terms are also collected in the [Glossary of Terms and Services](/glossary).
:::

## Why do you need error handling and retries? First, a fact: the cloud always has blips

In the single-machine era, calling a local function almost never "fails midway". But once you are in the cloud, every call crosses the **network** to another service (DynamoDB, S3, SQS, a third-party API...), and networks and distributed systems have an iron law: **transient failures will happen**. A packet drops, a host happens to be restarting, a service momentarily throttles you under load — none of this is "your bug"; it is the normal state of the cloud.

<Scenario title="Real scenario: a one-off 500 fails an entire order for nothing">

Your checkout API writes a record to DynamoDB. It usually works fine, but one day during a traffic spike DynamoDB returns a `ProvisionedThroughputExceededException` (capacity breached, temporarily blocking you). Your code did no retry and threw the error straight up — the user sees "order failed", when in fact **waiting 200 ms and resending once would have succeeded**. You lost an order for nothing, just because you did not survive that one blip.

</Scenario>

**Core idea: writing code in the cloud is not about "assuming calls always succeed", but about "assuming calls can fail transiently at any time, and designing what happens when they do".** Retries, backoff, idempotency, and DLQs are the survival tools that keep your application **running steadily** under this constant blipping.

## Core 1: Retries, and why you must not "retry furiously the instant it fails"

The most intuitive retry is "resend immediately on failure". But in distributed systems this is a **disaster**: the downstream blocked you precisely because it was already too busy, yet you hammer it even faster — pouring fuel on the fire and crushing it completely. This is called a <Term en="Retry Storm" desc="A large number of clients fail at once and then furiously retry at once, so traffic increases instead of decreasing, finishing off a downstream that was only temporarily overloaded.">retry storm</Term>.

The right approach is **exponential backoff**: wait longer after each failure before trying again.

```text
1st failure -> wait 1s  -> retry
2nd failure -> wait 2s  -> retry
3rd failure -> wait 4s  -> retry
4th failure -> wait 8s  -> retry (usually with a cap, e.g. max 5 retries or wait at most 20s)
```

The wait time `= base * 2^(retry count)`, growing exponentially, giving the downstream more and more breathing room.

### Why backoff alone is not enough: add "jitter"

Imagine 1,000 clients all fail in the same second. They **use the same formula** to compute backoff, so they all "wait 1s" -> 1 second later those 1,000 all retry **at the same time** -> the downstream is slammed again in an instant -> they all fail again -> they all wait 2s together... This "everyone stepping to the same beat" effect is called the <Term en="Thundering Herd" desc="A large number of clients retry at the same instant, creating periodic traffic spikes that repeatedly crush the downstream.">thundering herd</Term>.

The fix is to **add a bit of randomness (jitter)** to the backoff time, **spreading** those 1,000 clients' retries across an interval, so the traffic is flattened out.

```python
import random

base = 0.5      # base wait seconds
cap = 20.0      # wait cap

def backoff_with_jitter(attempt):
    # Full Jitter: pick a random value between 0 and the exponential value, spreading out retries
    exp = min(cap, base * (2 ** attempt))
    return random.uniform(0, exp)
```

:::tip[💡 Exam focus: backoff and jitter always go together]
- When you see "retries crush the downstream", "periodic traffic spikes", or "thundering herd" -> the answer is **exponential backoff + jitter**, not "increase the retry count" or "shorten the interval".
- **Backoff** makes retries progressively slower and gives the downstream room; **jitter** spreads a crowd of clients' retry times so they do not all collide in the same second. You need both.
- AWS and most SDKs use strategies in the **Full Jitter / equal jitter** family.
:::

## Core 2: Idempotency, and why it makes retries safe

Retries have a hidden risk: **you think it failed, but the other side already did the work**. For example, you send "charge 100 dollars", the downstream actually succeeds, but the response is dropped on the network and you never get it -> you think it failed -> you retry -> **charged twice**.

To make retries safe, the request must be <Term en="Idempotency" desc="Executing the same request once or many times produces exactly the same result, with no duplicate side effects, so retrying is safe.">idempotent</Term>: **no matter how many times the same request is processed, the result is the same as doing it once.**

The technique is to carry a **unique idempotency key** (e.g. the order ID, or a client-generated UUID), and have the server first check "have I processed this key":

- Not processed -> process it, record the key, return the result.
- Already processed -> **return the previous result directly, with no second side effect.**

```python
# Use a DynamoDB conditional write as an "idempotency lock": each idempotency_key can only be written once
def charge_once(idempotency_key, amount):
    try:
        table.put_item(
            Item={"pk": idempotency_key, "amount": amount, "status": "DONE"},
            ConditionExpression="attribute_not_exists(pk)",  # do not overwrite if it already exists
        )
        do_real_charge(amount)   # the real charge happens only on the first time
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            return  # this item was processed before; the retry just skips, no double charge
        raise
```

:::info[🔑 Many AWS services natively support idempotency parameters]
You do not always have to build your own: many APIs provide an idempotency key parameter directly, e.g. **SQS FIFO's `MessageDeduplicationId`**, the `ClientToken` / `clientRequestToken` on many "create" APIs, and Lambda Powertools also has an **Idempotency utility** (storing processing results in DynamoDB). Prefer these over writing your own lock — they are more reliable.
:::

## Core 3: What to do about throttling errors (429 / ThrottlingException / ProvisionedThroughputExceeded)

When your request rate exceeds a service's limit, the service **throttles** you and returns an explicit error asking you to slow down:

| Common throttling error | Comes from | In plain words |
| --- | --- | --- |
| **HTTP 429 `TooManyRequestsException`** | API Gateway, synchronous Lambda invoke | You are too fast, exceeding a rate or concurrency limit. |
| **`ThrottlingException` / `Throttling`** | General throttling across most AWS services | Again, requests too fast, rate-limited. |
| **`ProvisionedThroughputExceededException`** | DynamoDB (provisioned capacity mode) | Read/write volume exceeds your provisioned RCU/WCU. |

**The handling principle is simple: throttling errors are almost always "retryable" — but always pair the retry with backoff + jitter to bring the speed down.** If you receive a 429 and retry even faster, you will only get blocked harder.

- If DynamoDB keeps throttling, beyond backoff the root fix is to **switch to On-Demand capacity mode** or **raise provisioned capacity**, or **spread the partition key evenly** to avoid a hot key.
- If synchronous Lambda invokes get 429, the root fix is to **raise the concurrency limit** or set **Reserved Concurrency**, while the caller also does backoff retries.

:::tip[💡 Exam focus: these keywords should make you think "backoff retry"]
- `429` / `TooManyRequestsException` / `ThrottlingException` / `ProvisionedThroughputExceededException` -> **all throttling; the fix is exponential backoff + jitter retries**; only touch capacity/concurrency settings if it keeps recurring.
- Never treat throttling as "the code is broken" and change your logic — it is just saying "you are too fast, slow down".
:::

## Core 4: Dead-letter queue (DLQ) — catching messages that "keep failing no matter how many retries"

Some failures are not transient: the message format is inherently broken, the downstream permanently rejects it, or your code just explodes on that record. Such a message **will not succeed even after thousands of retries**, and if left alone it keeps consuming retries and jams the whole queue.

A <Term en="Dead-Letter Queue" desc="A separate queue dedicated to messages that still fail after multiple retries, isolating the bad messages to avoid infinite retries jamming the whole line, and making later investigation easy.">dead-letter queue (DLQ)</Term> exists for this: you configure "after so many failed retries, move it to a separate queue to isolate it".

- **SQS**: attach a **redrive policy** on the source queue, setting `maxReceiveCount` (e.g. after 5 receives without deletion, move it to the DLQ).
- **Lambda asynchronous invoke**: after 2 automatic retries still fail, you can send to a **DLQ or on-failure destination** to preserve the failed event.

This way the bad message is moved aside and normal messages keep flowing; later you investigate the cause in the DLQ, and after fixing it you can selectively re-deliver (redrive).

## Core 5: Partial batch failure (ReportBatchItemFailures)

When Lambda uses an **event source mapping** to pull messages in **batches** from SQS/Kinesis/DynamoDB Streams (e.g. 10 at a time), there is a classic problem: **if just 1 record in the batch fails, the whole batch is considered failed** — so the 9 that already succeeded **get retried too**, causing duplicate processing.

The fix is to enable **partial batch reporting**: after processing, Lambda returns a `batchItemFailures` list that **tells SQS only which records failed**, so the successful ones are not resent.

```python
# The SQS event source mapping must have ReportBatchItemFailures enabled in its settings
def handler(event, context):
    failures = []
    for record in event["Records"]:
        try:
            process(record)                      # process this record
        except Exception:
            failures.append({"itemIdentifier": record["messageId"]})  # record only the failed one
    return {"batchItemFailures": failures}        # only these get retried; successful ones are not resent
```

:::info[🔑 You must do both "enable the setting" and "return the correct format"]
Returning `batchItemFailures` in code alone is not enough — you must enable the **`ReportBatchItemFailures`** feature in the event source mapping settings for Lambda to honor the list you return. Miss either one and the whole batch still gets retried together.
:::

## Core 6: The circuit breaker concept

Backoff retries assume "the downstream will be fine soon". But if the downstream is **entirely down** (e.g. a third-party API major outage), every request still naively "retries 5 times with backoff", which only **wastes huge amounts of time and resources**, jamming all your own threads/Lambda concurrency waiting on timeouts, dragging yourself down too.

A <Term en="Circuit Breaker" desc="A protection mechanism: when it detects consecutive downstream failures it 'trips', temporarily letting requests fail fast without calling the downstream, giving it time to recover, then after a while letting a few requests through to probe whether it has recovered.">circuit breaker</Term> borrows the idea of an electrical fuse and has three states:

- **Closed**: normal pass-through, requests go to the downstream as usual.
- **Open**: once consecutive failures exceed a threshold it "trips" — for a while afterward requests **fail fast immediately**, never calling the downstream, saving the waste of waiting on timeouts.
- **Half-Open**: after being tripped for a while, it lets **a small number** of requests through to probe; if they succeed it returns to Closed and resumes normal, if they fail again it stays Open.

The key difference: a **retry** is "betting it will work this time", while a **circuit breaker** is "the downstream is clearly broken, so stop knocking and protect both yourself and it". Use them together: normally absorb blips with backoff retries, and when something truly stays broken, stop the bleeding with the circuit breaker.

## Core 7: The retry behavior built into the SDK (do not reinvent the wheel)

Good news: the AWS SDK **does retries + exponential backoff for you by default!** You do not necessarily have to write your own backoff loop. Understanding its default behavior is an exam point:

- By default the SDK **automatically retries** **retryable errors** (throttling, connection timeouts, 5xx, etc.) and applies backoff.
- Newer SDKs default to the **`standard` retry mode**, and can also be configured to **`adaptive` mode** — `adaptive` dynamically adjusts the send rate based on detected throttling (client-side rate limiting), which is friendlier for heavy-throttling scenarios but more aggressive and needs testing.
- The main tunable parameters are the **maximum number of attempts** and the **retry mode**.

```python
import boto3
from botocore.config import Config

cfg = Config(
    retries={
        "max_attempts": 5,       # including the first, 5 attempts in total
        "mode": "adaptive",      # standard or adaptive (auto slows down based on throttling)
    }
)
ddb = boto3.client("dynamodb", config=cfg)
# From now on ddb will auto-backoff-retry on throttling/transient errors; you do not write the loop
```

:::info[🔑 Automatic retry does not mean "it handles everything for you"]
The SDK only auto-retries the **retryable errors** it recognizes. **Non-retryable** errors like `ValidationException` (bad parameters) or `AccessDenied` (permission error) are thrown straight to you — retrying them is pointless. Also, the SDK's automatic retries **do not guarantee idempotency**: for operations with side effects (charging, creating resources), idempotency is still your responsibility.
:::

## Retryable vs non-retryable: how to tell, and when to back off / go to DLQ / let it fail

This is the most important judgment in this article, and the core of DVA scenario questions. When you get an error, first ask yourself: **"Does trying again have a chance of succeeding?"**

### Step 1: Is this error "retryable" or "non-retryable"?

| | Retryable (transient) | Non-retryable (permanent) |
| --- | --- | --- |
| **Typical errors** | 429/ThrottlingException, ProvisionedThroughputExceeded, 5xx, connection timeout, `ServiceUnavailable` | 400 bad parameter, `ValidationException`, `AccessDenied`/403, `ResourceNotFound`, broken message format |
| **Nature** | "Fixes itself in a moment" — downstream busy, network blip | "Same result after ten thousand tries" — the request itself is wrong |
| **What to do** | **Backoff + jitter retries**; try a few more times | **Do not retry**; fail immediately or send to DLQ for manual handling |

### Step 2: Decide the strategy based on the answer

- **Retryable error -> backoff retry**: add exponential backoff + jitter to give the downstream room; most succeed within a few attempts.
- **Non-retryable error -> fail fast / go to DLQ**: retrying it only wastes resources. For a synchronous call, **return the error to the caller directly**; for async/queue scenarios, **send to the DLQ** for a human to look at.
- **Retried up to the limit and still failing -> go to DLQ**: even for retryable errors, set a **retry limit** and never try infinitely. Past the limit, treat it as "not going to recover soon" and send to the DLQ.

:::tip[💡 Trade-offs: not every error should be retried, and not every failure should go to the DLQ]
- **Retrying a non-retryable error** = pure waste, and it also delays giving the user a response that "should have failed long ago". Classify first, then decide.
- **Let it fail when it should fail**: for a synchronous user request (e.g. a data lookup) that fails, rather than making the user wait 30s while you retry, it is better to **fail fast + let the front end retry** — a better experience.
- **A DLQ is "isolate + keep evidence", not a "trash can"**: a message in the DLQ means "a human needs to take a look". A DLQ configured but never monitored is as good as no DLQ.
- **Retry responsibility differs for sync vs async**: synchronous calls (API Gateway -> Lambda, SDK `Invoke`) do **not** auto-retry; the responsibility is on the **caller**. Only async and event source mappings have platform-level automatic retries + DLQ.
:::

## In practice: the two most common hands-on scenarios

<Scenario title="Real scenario: one line of SDK config blocks DynamoDB throttling during spikes">

Your reporting service batch-writes to DynamoDB every night, occasionally blowing up with `ProvisionedThroughputExceededException` and failing the whole batch. Without changing the architecture, you just set the boto3 client to `max_attempts=8` + `mode="adaptive"`, and the SDK will automatically back off, retry, and self-throttle on hitting a limit. The next night the batch **fully succeeds**, and the throttling errors in CloudWatch drop from dozens to zero.

</Scenario>

### 🛠️ Hands-on A: use the SDK's built-in retries + backoff (least effort)

```python
import boto3
from botocore.config import Config

cfg = Config(retries={"max_attempts": 8, "mode": "adaptive"})
ddb = boto3.client("dynamodb", config=cfg)

ddb.put_item(
    TableName="orders",
    Item={"orderId": {"S": "A-1001"}, "amount": {"N": "100"}},
)
print("Write succeeded (if it hit throttling midway, the SDK already backed off and retried)")
```

**Expected result**: even if DynamoDB returns `ProvisionedThroughputExceededException` during a spike, the SDK automatically waits (backs off) and retries, up to 8 times; under normal conditions you will see "Write succeeded" printed, and the CloudWatch `ThrottledRequests` metric will not cause your program to fail.

### 🛠️ Hands-on B: SQS batch reports only the failed slice (so the successful ones are not reprocessed)

```bash
# Enable partial batch reporting on the Lambda SQS event source mapping
$ aws lambda update-event-source-mapping \
    --uuid <your-event-source-mapping-uuid> \
    --function-response-types ReportBatchItemFailures
# Expected output: the returned JSON contains "FunctionResponseTypes": ["ReportBatchItemFailures"]
```

Pair this with the handler from Core 5 (returning a `batchItemFailures` list).

**Expected result**: if the 3rd of 10 messages in a batch fails to process, Lambda returns `{"batchItemFailures": [{"itemIdentifier": "<messageId of the 3rd>"}]}`, so **only the 3rd** becomes visible again after the visibility timeout and gets retried, while the other 9 are deleted normally and not resent — avoiding "one bad, ten redone". Without this setting enabled, all 10 in the batch would be retried.

<Cost>

Almost everything in this article is **free of extra charge**: retries, backoff, and idempotency are logic inside your code; a DLQ is just an ordinary SQS queue (within the free tier); the SDK's built-in retries are not billed separately. Watch out for the fact that **retries themselves send extra requests** — for pay-per-use services (like DynamoDB On-Demand, or API calls), furious retries cost more money, so a **backoff + retry limit** protects not only the downstream but also your bill. Remember to clean up test queues/tables after practicing.

</Cost>

:::warning[🚑 Common pitfalls]
- **Furious retries with no backoff crush the downstream**: hammering immediately on failure piles onto an already-overloaded downstream, causing a retry storm. Always do **exponential backoff + jitter**.
- **Retrying without idempotency -> double charging / double shipping**: you think it failed but the other side finished; the retry does it a second time. Operations with side effects **must carry an idempotency key**.
- **Retrying non-retryable errors endlessly too**: bad parameters, permission errors, and broken formats give the same result after ten thousand tries, only wasting resources and delaying things. Classify **retryable vs non-retryable** first, then decide.
- **A DLQ configured but never watched**: messages silently pile into the DLQ with no alarm, so the problem is hidden. **Always set a CloudWatch alarm on the DLQ message count.**
- **Assuming the platform auto-retries synchronous calls**: for **synchronous** calls like API Gateway -> Lambda or SDK `Invoke`, Lambda does **not** auto-retry; retry responsibility is on the **caller**. Only async and event source mappings get platform-level automatic retries.
- **Not enabling ReportBatchItemFailures for batches**: one failure causes the whole batch (including the successful ones) to be retried and reprocessed. Remember to do both "enable the setting" and "return the correct format".
:::

<Refs title="📚 Official docs & further reading">

- [AWS SDK retry behavior and backoff](https://docs.aws.amazon.com/sdkref/latest/guide/feature-retry-behavior.html)
- [Exponential Backoff and Jitter (AWS Architecture Blog)](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
- [Lambda partial batch response with ReportBatchItemFailures](https://docs.aws.amazon.com/lambda/latest/dg/services-sqs-errorhandling.html)
- [Amazon SQS dead-letter queues (DLQ)](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html)
- [DynamoDB error handling and retries (incl. throttling)](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Programming.Errors.html)

</Refs>

## Next step

👉 Next: [Performance and Cost Optimization](./performance-optimization.md)
