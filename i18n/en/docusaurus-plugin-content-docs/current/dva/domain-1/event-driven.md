---
sidebar_position: 5
title: Event-Driven and Decoupling
---

# Event-Driven and Decoupling: so services never block or drag each other down

> This article takes a **developer's view** of SQS / SNS / EventBridge / Step Functions: how messages are sent, how to avoid processing them twice, what happens on failure, and how to coordinate multiple services. It is a very high-frequency topic in DVA-C03 Domain 1 (Development with AWS Services).

<Vocab title="📌 Terms you will meet here (friendly, even if this is all new)">

- **Decoupling**: putting a buffer between two services so that even if the downstream is temporarily down, data is stored and not lost, and the downstream catches up later.
- **SQS (Simple Queue Service)**: AWS's **message queue**, like a mailbox with a line: the sender drops a message in, and the receiver comes to pull it out and process it.
- **SNS (Simple Notification Service)**: AWS's **publish/subscribe notification service**, like a group announcement: one message is pushed to all subscribers at once.
- **EventBridge**: AWS's **event bus**, like a smart switchboard: events come in, it matches them against rules, and forwards each one to the right target.
- **Step Functions**: AWS's **workflow orchestrator**, using a state machine to chain multiple steps (multiple Lambdas, multiple services) into an ordered flow with branches and retries.
- **Idempotency**: processing the same message many times gives the same result as processing it once, so there is no double charge or double shipment.

</Vocab>

:::note[💬 Reading tip]
Whenever you see a term with a <Term desc="Like this! Hover over the dotted underline (tap on mobile) to see a plain-language explanation.">dotted underline</Term>, hover over it for a plain-language explanation. Every term is also collected in the [Glossary](/glossary).
:::

## First, why decouple at all

<Scenario title="Real scenario: a user uploads a photo">

Your app lets users upload a profile photo, and after the upload you need to do three things: **make a thumbnail, scan for banned content, and send a confirmation email**. The naive approach is to have the upload API do all three synchronously, and the result is that after the user hits upload they **wait 8 seconds** for a response, and if the email service is down, **the whole upload fails**.

</Scenario>

**The fix**: once the upload succeeds, just emit a single "photo uploaded" event and respond to the user immediately, then let SQS / SNS / EventBridge run the three tasks asynchronously. The user gets a success response in half a second, the three backends each run independently, and if one is temporarily down it does not drag down the upload itself. That is the core value of being **event-driven**: **fast, elastic, and one failure does not take down the whole line**.

### What happens if you do not decouple? (the plain "why")

Wiring two services **directly and synchronously** (the upstream calls the downstream and waits for a reply before continuing) looks simplest, but the price is:

- **One is slow, all are slow**: if the downstream email step takes 3 seconds, the user waits 3 extra seconds, and the experience degrades directly.
- **One is down, all are down**: if the downstream crashes, the upstream call errors out, and even "upload" (which has nothing to do with email) fails too.
- **Scaling is locked together**: at peak, if the downstream cannot keep up, the upstream can only block or drop requests, and a traffic spike avalanches.
- **Change one, touch everything**: to swap the email service, you must also change, retest, and redeploy the upstream code.

**Decoupling means putting a buffer (a queue / topic / bus) in the middle**, and it buys four concrete benefits:

| Benefit of decoupling | Plain explanation |
| --- | --- |
| **Smooth spikes** | Peak messages pile up in the queue, and the downstream works through them at a steady pace instead of being overwhelmed. |
| **Fault tolerance** | If the downstream is temporarily down, messages are retained and not lost, processed once it recovers, with the upstream unaware. |
| **Independent scaling** | Upstream and downstream each scale to their own load without constraining each other. |
| **Independent evolution** | As long as the event format stays the same, you can swap or add downstreams without touching the upstream. |

:::info[🔑 Remember "why decouple" in one line]
**Synchronous = two people tied together by one rope: if one trips, both fall. Decoupled = a mailbox in the middle: each walks at its own pace and neither drags the other down.** The price is an extra layer of "asynchronous" complexity (ordering, duplicates, latency are now yours to manage), so not everything should be decoupled, a **synchronous query that must return a result immediately (such as checking a balance) should not be forced into a queue**.
:::

<Analogy title="🏣 Everyday analogy: mailbox, loudspeaker, switchboard, assembly line">

- **SQS = an apartment mailbox**: the mail carrier drops the letter in and leaves, and you come down to collect it when you have time. One to one, pull based, and the letter waits for you.
- **SNS = a neighborhood loudspeaker**: the manager announces once that a package arrived, and the whole building hears it at the same time. One to many, push based.
- **EventBridge = a building switchboard**: all kinds of messages come in, and it looks at the rules for who each one is for and routes it to the right department. It routes by content.
- **Step Functions = a line supervisor on a factory floor**: do A first, only do B if A succeeds, retry B three times on failure, then fall back to an exception path. It governs order and flow.

</Analogy>

## SQS: the most common buffering queue

SQS fully separates the sender (producer) from the receiver (consumer): the sender drops messages in and the receiver pulls them out, with no need for both to be online at the same time.

### Standard queue vs FIFO queue

| | Standard queue | FIFO queue |
| --- | --- | --- |
| Ordering | **Not guaranteed** first-in-first-out | **Strict** first-in-first-out |
| Duplicates | May very rarely deliver twice (at-least-once) | **Exactly-once processing** (no duplicates) |
| Throughput | Nearly unlimited, very high | Lower by default (high-throughput mode available) |
| Name | Any name | Queue name **must** end in `.fifo` |
| When to use | Order does not matter, need huge volume | Payments, order status, where **order and no duplicates matter** |

:::info[🔑 How FIFO deduplication works]
FIFO uses **MessageGroupId** to decide which messages must stay in order (strict order within a group, groups run in parallel), and **MessageDeduplicationId** (or content-based dedup) to filter duplicates within a 5-minute window. These two parameters, set when a developer sends a message, are common exam points.
:::

:::tip[💡 Standard vs FIFO: do not pick FIFO just to feel safe]
FIFO's "strict ordering plus no duplicates" is not free, it has **real costs**:

- **Much lower throughput**: standard queues are nearly unlimited; FIFO defaults to **300 messages per second** (up to 3,000/sec with `SendMessageBatch`), and high-throughput mode raises it further but still far below standard.
- **Ordering is tied to MessageGroupId**: within one group processing is **single-threaded**, so you cannot run multiple consumers in parallel on the same group; to add parallelism you must split messages across more groups.
- **Slightly higher cost**: FIFO's per-million-request price is higher than standard.

**Selection rules**:

- **Default to the standard queue**, because most background work (thumbnails, email, logging) does not care about order, and standard's very high throughput plus low cost wins, as long as the **consumer is idempotent** to absorb the occasional duplicate delivery.
- **Use FIFO only when "wrong order breaks something" or "a duplicate is unacceptable"**: for example transactions for one account must run in order, or the status transitions of one order (create to pay to ship) must not be scrambled.
- If you truly need strict ordering plus high throughput, **use MessageGroupId to split unrelated entities** (such as using the account ID as the group) so different accounts run in parallel.
:::

### Visibility timeout: the one developers trip on most

When a receiver pulls a message and starts processing it, that message becomes "invisible" to other receivers for a period, and that period is the <Term en="Visibility Timeout" desc="A period during which a message pulled by one receiver is hidden from others, preventing double pickup. Default 30 seconds, max 12 hours.">visibility timeout</Term> (default 30 seconds, max 12 hours). When the receiver finishes, it must call `DeleteMessage` to remove the message; if it does **not** delete it (for example the process crashed mid-way), the message becomes visible again when the timeout expires and is pulled by the next receiver for a retry.

:::warning[🚑 The consequences of a mis-set visibility timeout (both directions bite)]
**Too short**: processing a message takes 60 seconds but the visibility timeout is only 30 seconds, so the first worker is still processing when the message becomes visible again and is pulled by a second worker, and the same record gets **processed twice** (double charge, double shipment). Rule: **visibility timeout must be greater than or equal to the longest processing time**; when the time is uncertain, call `ChangeMessageVisibility` mid-process to extend it.

**Too long**: if a consumer **crashes mid-process without deleting the message**, that message will not become visible again until your timeout (up to 12 hours) expires, so **the retry is delayed for a long time** and the message appears "stuck".

**A trap when paired with a Lambda event source mapping**: AWS recommends the **queue visibility timeout be at least 6 times the Lambda timeout**. Set it too close and the message becomes visible and re-triggers before Lambda finishes; set it far too high and retries drag.
:::

### Long polling

The default **short polling** returns an empty response immediately even when the queue is empty, which causes many wasted requests and higher cost. **Long polling** makes `ReceiveMessage` wait until a message arrives, or until the `WaitTimeSeconds` you set (max 20 seconds). In practice you should almost always enable long polling: **cheaper, more responsive, fewer empty responses**.

### Dead-letter queue (DLQ)

When a message keeps failing after many retries (bad format, a permanent downstream error), it should be moved to a <Term en="Dead-Letter Queue" desc="A separate queue that collects repeatedly failing messages for later investigation, so a bad message does not retry forever and clog the whole queue.">dead-letter queue</Term> for isolation. You set this up with a **redrive policy** on the source queue, specifying `maxReceiveCount` (for example, move to the DLQ after a message is received 5 times without being deleted). That way bad messages do not retry forever and clog the line, and you can investigate them later in the DLQ.

### Message size limit and idempotency

- **Message size limit is 256 KB**. For anything larger (say sending an image), use the **SQS Extended Client**: store the large payload in S3 and keep only a pointer to S3 in the queue.
- **Standard queues may deliver duplicates**, and failures trigger retries, so the **consumer must be idempotent**: use a unique key such as the order number or MessageDeduplicationId to first check "have I already processed this one", and skip it if so, to avoid double charges or shipments.

## SNS: publish/subscribe and fan-out

SNS is a **push** model: the publisher drops a message onto a **Topic**, and every target subscribed to that topic receives it at the same time. Subscribers can be Lambda, SQS, HTTP/S, Email, SMS, and more.

### Fan-out: the golden SNS + SQS combo

When one event must reach several downstreams and each downstream needs **its own buffer so no message is lost**, the standard answer is **one SNS topic plus several SQS queues**: SNS pushes once, and each SQS gets its own copy and works through it at its own pace.

<div className="flow">
  <div className="flow-node">Photo uploaded</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">SNS topic</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">SQS: thumbnail</div>
  <div className="flow-arrow">＋</div>
  <div className="flow-node">SQS: content scan</div>
  <div className="flow-arrow">＋</div>
  <div className="flow-node">SQS: send email</div>
</div>

*Figure: one "photo uploaded" event fans out through SNS, and the three downstreams each get a copy, stay independent, and none drops a message if one goes down.*

:::tip[💡 Exam point: SNS vs SNS+SQS]
- Just "real-time push, no buffering needed" (such as a mobile notification) → **SNS straight to Lambda / HTTP**.
- "Broadcast, but each downstream also needs its own buffer and must not lose messages" → **SNS + several SQS (fan-out)**.
- Remember: **a message SNS pushes is gone if the downstream does not receive it** (Lambda retries, SQS retains), so to guarantee delivery with buffering, put an SQS in the middle.
:::

### 🛠️ Hands-on: wire an SNS → SQS fan-out (including the queue permission everyone forgets)

```bash
# 1) Create the topic and queue, note the ARN/URL (replace with your returned values)
$ aws sns create-topic --name photo-uploaded
# Expected output: "TopicArn": "arn:aws:sns:ap-northeast-1:123456789012:photo-uploaded"

$ aws sqs create-queue --queue-name thumbnail-queue
# Expected output: "QueueUrl": "https://sqs.ap-northeast-1.amazonaws.com/123456789012/thumbnail-queue"

# 2) Get the queue ARN (needed for both the subscription and the policy)
$ aws sqs get-queue-attributes \
    --queue-url https://sqs.ap-northeast-1.amazonaws.com/123456789012/thumbnail-queue \
    --attribute-names QueueArn
# Expected output: "QueueArn": "arn:aws:sqs:ap-northeast-1:123456789012:thumbnail-queue"

# 3) [Most critical, most often missed] attach an access policy to the queue allowing this SNS topic to deliver
$ aws sqs set-queue-attributes \
    --queue-url https://sqs.ap-northeast-1.amazonaws.com/123456789012/thumbnail-queue \
    --attributes '{"Policy":"{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Principal\":{\"Service\":\"sns.amazonaws.com\"},\"Action\":\"sqs:SendMessage\",\"Resource\":\"arn:aws:sqs:ap-northeast-1:123456789012:thumbnail-queue\",\"Condition\":{\"ArnEquals\":{\"aws:SourceArn\":\"arn:aws:sns:ap-northeast-1:123456789012:photo-uploaded\"}}}]}"}'
# No output (success); skip this step and the publish below does NOT error, but the SQS never receives anything (silent failure)

# 4) Subscribe: attach the queue to the topic
$ aws sns subscribe \
    --topic-arn arn:aws:sns:ap-northeast-1:123456789012:photo-uploaded \
    --protocol sqs \
    --notification-endpoint arn:aws:sqs:ap-northeast-1:123456789012:thumbnail-queue
# Expected output: "SubscriptionArn": "arn:aws:sns:...:photo-uploaded:xxxxxxxx-...."

# 5) Publish an event
$ aws sns publish \
    --topic-arn arn:aws:sns:ap-northeast-1:123456789012:photo-uploaded \
    --message "photo-001 uploaded"
# Expected output: "MessageId": "abc123-...."

# 6) Pull it from SQS (proving the fan-out works)
$ aws sqs receive-message \
    --queue-url https://sqs.ap-northeast-1.amazonaws.com/123456789012/thumbnail-queue \
    --wait-time-seconds 10
# Expected: the Body is an SNS-wrapped JSON whose "Message" field is "photo-001 uploaded"
```

:::info[🔑 Why step 3 is non-negotiable]
`aws sns subscribe` only "registers" the queue as a subscriber, it does **not** automatically grant SQS delivery permission. For SNS to put a message into SQS, it relies on **that queue's own access policy**. Miss this step and `publish` still succeeds and returns a MessageId, but the message is never delivered to the queue and no error is raised, which is the most common "I thought it was wired but it was not" of fan-out. The console often adds this policy for you when creating the subscription; with CLI/IaC you must add it yourself.
:::

## EventBridge: event bus and rule matching

EventBridge is smarter than SNS: it is an **event bus** where, once an event arrives, a **rule** matches it by content (source, type, field values) and forwards only the matches to the right **target**. One event can trigger multiple targets.

- **Event pattern matching**: filter with JSON conditions, for example "only order events with `detail.status = FAILED` notify the on-call group". This content-based routing is something SNS cannot do (SNS filtering relies on message attributes and is more basic).
- **Scheduled rules**: trigger targets on a schedule with cron or rate expressions, for example run a cleanup Lambda at 2 AM daily. This is a **serverless scheduler** that replaces running cron on your own EC2.
- **Third-party/SaaS and AWS service events**: many AWS services (S3, CodePipeline, and more) and SaaS products natively emit events to EventBridge, so you do not have to poll.

:::info[🔑 How to choose EventBridge vs SNS vs SQS]
- **SQS**: I want a **buffering queue**, one to one, receiver pulls, smoothing out spikes.
- **SNS**: I want **low-latency, high-throughput one-to-many push** (fan-out) with simple targets.
- **EventBridge**: I want **complex routing/filtering by event content**, to receive AWS service events, or to **schedule**. Latency is slightly higher than SNS, but routing power is the strongest.
:::

## Step Functions: orchestrating multi-step workflows

When a flow has **order, branches, retries, and parallelism**, rather than cramming a pile of try/catch into one bloated Lambda, use a Step Functions **state machine** to split each step out and wire them with a visual flow. It has built-in retry, error handling (Catch/Retry), parallel (Parallel), and iteration (Map) states, so the flow is clear and easy to debug.

### Standard vs Express

| | Standard workflow | Express workflow |
| --- | --- | --- |
| Max duration | Up to 1 year | Up to 5 minutes |
| Execution model | Exactly-once | At-least-once |
| Pricing | By **number of state transitions** | By **number and duration of executions** |
| Execution history | Fully retained, visually replayable | Goes to CloudWatch Logs |
| When to use | Long flows, auditing, human approval | High-frequency, short, streaming/event processing |

:::tip[💡 Exam point: Step Functions]
- See "**orchestrate multiple Lambdas/services, with order and branches, and built-in retries**" → Step Functions.
- See "**very high frequency, each within seconds, huge volume, can tolerate rare duplicates**" → **Express**; "**long flow, need full execution history and auditing**" → **Standard**.
- Do not confuse "orchestration (Step Functions)" with "buffering (SQS)" or "broadcast (SNS)"; they solve different problems.
:::

## Deep dive on choosing among the four: pros, cons, and when NOT to use

Having introduced each service, this section lays them **side by side** and spells out "why pick it, its weaknesses, and when you should NOT use it". This is exactly the judgment DVA scenario questions love to test.

### SQS: pros, cons, and when not to use

- **Why pick it**: you want the **simplest buffer**, smoothing spikes, a background job queue, one to one, with the receiver pulling. The most low-maintenance and cheapest piece of infrastructure.
- **Pros**: nearly unlimited throughput (standard), fully managed, built-in DLQ and retries, a generous free tier.
- **Cons**: the **pull model** needs a consumer to come and pull (or a Lambda event source mapping to pull on its behalf); one message goes to **only one consumer**, so it is not a broadcast by nature; no content-based routing.
- **When not to use**: need a **one-to-many broadcast** → use SNS; need **content-based routing / AWS service events / scheduling** → use EventBridge; need to **orchestrate a multi-step flow** → use Step Functions. Do not twist SQS into a broadcast (you would create N queues and send a copy to each, which is clumsy).

### SNS: pros, cons, and when not to use

- **Why pick it**: one event must notify several downstreams **at the same time** (fan-out), and you need **low-latency, high-throughput push**.
- **Pros**: one-to-many push, low latency, can push directly to Lambda/SQS/HTTP/Email/SMS; pair it with SQS to get "broadcast with a buffer per downstream".
- **Cons**: **a pushed message is gone if no one receives it right then** (SNS itself does not retain messages, add SQS for buffering); filtering relies only on message attributes and is **far more basic than EventBridge**, unable to do complex routing by payload field values.
- **When not to use**: need **complex routing/filtering by event content**, need to **receive native AWS service events (S3, CodePipeline, and more)**, or need **scheduling** → all should use EventBridge; need only one-to-one buffering → SQS is enough, do not add an SNS layer.

### EventBridge: pros, cons, and when not to use

- **Why pick it**: you want a **smart event hub**, routing and filtering by event content (source, type, field values), or ingesting native AWS/SaaS events, or scheduling.
- **Pros**: the strongest routing power (JSON event pattern), natively ingests hundreds of AWS service events, built-in scheduling (cron/rate), a schema registry, and support for multiple event buses.
- **Cons**: **latency is slightly higher than SNS**; throughput ceilings and per-second API quotas are lower than SNS/SQS; complex rules are **hard to debug**; using it for very-high-frequency pure fan-out is overkill.
- **When not to use**: **ultra-low-latency, ultra-high-throughput pure fan-out** → SNS fits better; **simple buffering** → SQS; **just an ordered multi-step flow** → Step Functions.

### Step Functions: pros, cons, and when not to use

- **Why pick it**: a flow has **clear order, branches, retries, parallelism, and human approval**, and rather than cramming it into one bloated Lambda full of try/catch, you split it out as a state machine and wire it visually.
- **Pros**: built-in retry/error handling (Retry/Catch), parallel (Parallel), iteration (Map), wait (Wait), and human approval (Task Token); the flow is visual, auditable, and easy to debug; integrates directly with 200+ AWS services (not everything has to be a Lambda).
- **Cons**: **an extra orchestration layer to design and maintain**; Standard is priced by state transitions, so **cost climbs as steps multiply**; the flow is inherently "stateful and ordered", so it is **not suited to pure fire-and-forget async**.
- **When not to use (important)**:

  - **Just need to buffer messages for a bit** → use SQS, **do not reach for Step Functions** (using a sledgehammer to crack a nut, expensive and complex).
  - **Just need a one-to-many broadcast** → SNS.
  - **Just a single-step async process** → trigger a Lambda directly from SNS/SQS, no state machine needed.
  - **Very-high-frequency simple event streams at tens of thousands per second** → even if you use Step Functions, pick **Express**, and know that it **only guarantees at-least-once, not exactly-once**.

:::tip[💡 One question shows selection: same "photo upload" scenario, change the need and the pick changes]
- "After upload, make thumbnails **slowly**, order does not matter" → **SQS** (buffer plus a Lambda pulling at its own pace).
- "After upload, **simultaneously** make thumbnails, scan, and email, each needing its own buffer with no loss" → **SNS + several SQS** (fan-out).
- "Only uploads from a **specific source bucket** or a **specific extension** should be processed" → **EventBridge** (filter by content).
- "After upload, **scan first, make thumbnails only if it passes, send to human review if flagged, and audit the whole thing**" → **Step Functions** (ordered, branching, auditable).
:::

## When to use which? A one-minute summary

| Your need | Pick this |
| --- | --- |
| Buffer spikes, background job queue, one to one, receiver pulls | **SQS** |
| One event to many downstreams, low-latency one-to-many push (fan-out) | **SNS** (plus several **SQS** when buffering is needed) |
| Complex routing/filtering by event content, AWS service events, scheduling | **EventBridge** |
| Multi-step flow needing order, branches, retries, auditing | **Step Functions** |
| Order must not change, messages must not duplicate | **SQS FIFO** |

## In practice: create an SQS queue and send/receive a message

<Scenario title="Real scenario: smoothing an order spike">

A sale day drives order volume 20 times higher than usual. You change the flow to "API → drop into SQS → order-processing Lambda pulls on its own". At peak the queue buffers 500,000 orders, the Lambda works through them at a steady pace, and **not a single order is lost while the frontend API stays smooth throughout**.

</Scenario>

### 🛠️ Hands-on: use the CLI to feel that "send" and "receive" are separate

```bash
# Create a standard queue
$ aws sqs create-queue --queue-name my-first-queue

# Drop a message into the queue (sender)
$ aws sqs send-message \
    --queue-url https://sqs.ap-northeast-1.amazonaws.com/123456789012/my-first-queue \
    --message-body "Hello Queue"

# The receiver comes to pull the message (long polling, wait up to 20 seconds)
$ aws sqs receive-message \
    --queue-url https://sqs.ap-northeast-1.amazonaws.com/123456789012/my-first-queue \
    --wait-time-seconds 20

# Remember to delete it after processing, or it will be pulled again once the visibility timeout expires
$ aws sqs delete-message \
    --queue-url https://sqs.ap-northeast-1.amazonaws.com/123456789012/my-first-queue \
    --receipt-handle "<ReceiptHandle returned above>"
```

<Cost>

SQS, SNS, and EventBridge all have a **free tier** (SQS/SNS one million requests each per month, EventBridge AWS-native events are free), so typical practice generates almost no cost. Step Functions Standard is priced by state transitions and Express by number and duration of executions, and practice volumes are tiny. The real thing to watch is the **compute pulling messages or processing events** (such as an always-on EC2), so remember to shut it down after practice.

</Cost>

:::warning[🚑 Common real-world mistakes]
- **Visibility timeout too short** → the same record is processed twice. Rule: timeout must be greater than or equal to the longest processing time; when paired with Lambda, make the queue timeout at least 6 times the Lambda timeout.
- **Consumer not idempotent** → standard queue duplicates or retries cause double charges/shipments. Use a unique key (order number, and so on) to first check "have I processed this one" before processing. **Idempotency is the lifeline of the whole event-driven architecture**, not optional.
- **No DLQ** → a bad message retries forever and eats throughput. In production, always attach a redrive policy plus a DLQ.
- **Assuming SNS retains messages** → a pushed message is gone if no downstream receives it, so add an SQS for buffering.
- **Stuffing a message over 256 KB into SQS** → it is rejected. Put large payloads in S3 and keep only a pointer in the queue (SQS Extended Client).
- **Forgetting permissions on an SNS → SQS fan-out** → the message is "sent but never lands in SQS". For SNS to deliver into SQS, **that SQS queue's access policy must allow `sqs:SendMessage` for `sns.amazonaws.com`** (typically bound to the SNS topic via `aws:SourceArn`). Create only the subscription without the queue policy and the message is silently dropped, the most common silent failure of fan-out.
- **Assuming Step Functions Express is exactly-once** → Express is **at-least-once**, the flow may be rerun end to end, so every step inside an Express workflow **must be idempotent**. For "exactly-once", use **Standard**.
- **Picking FIFO blindly** → FIFO has lower throughput, higher cost, and single-threaded processing within a group. Without a hard "order must not change / no duplicates" requirement, pick a standard queue plus idempotency.
:::

<Refs title="📚 Official docs & further reading">

- [Amazon SQS Developer Guide](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html)
- [Amazon SNS Developer Guide](https://docs.aws.amazon.com/sns/latest/dg/welcome.html)
- [Amazon EventBridge User Guide](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-what-is.html)
- [AWS Step Functions Developer Guide](https://docs.aws.amazon.com/step-functions/latest/dg/welcome.html)

</Refs>

👉 Next: [AI-Assisted Development](./ai-assisted-dev.md)
