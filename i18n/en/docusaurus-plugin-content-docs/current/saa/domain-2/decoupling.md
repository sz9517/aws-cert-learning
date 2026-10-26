---
sidebar_position: 4
title: Decoupling (SQS & SNS)
---

# Decoupling: so one broken part doesn't take everything down

> This page shows you how to pull systems apart with SQS and SNS — one of the most-tested patterns in Domain 2 (resilience).

<Vocab title="📌 Jargon you'll see on this page (fine even if you've never touched AWS)">

- **Tightly coupled**: A calls B directly, so if B dies, A jams or errors out too — like two gears locked together.
- **Decoupling**: put a "buffer" between A and B, so even if B is temporarily down, messages are held and not lost; B processes them once it recovers.
- **SQS (Simple Queue Service)**: AWS's "**message queue**", like a **mailbox with a line** — the sender drops a message in, and the receiver comes to "pull" it out to process.
- **SNS (Simple Notification Service)**: AWS's "**notification / broadcast service**", like a **group announcement** — one message is "pushed" to all subscribers at once.

</Vocab>

:::note[💬 Reading tip]
Whenever you see a term with a <Term desc="Like this! Hover over any dotted term (tap on mobile) and a plain explanation pops up.">dotted underline</Term>, hover over it for a plain-language explanation. All terms are also collected in the [Glossary & Services](../../glossary.md).
:::

## Why decouple, in one sentence

<Scenario title="Real scenario: your shopping site crashes during a big sale">

Your checkout flow is "web page → calls directly → order-processing server". Fine on a normal day, but during a flash sale traffic spikes 10×, the order server gets overwhelmed and dies — and **that jams the web page too, so customers can't even add to cart**. That's the tight-coupling nightmare: one link breaks, the whole line collapses.

</Scenario>

**The fix**: put an <Term en="Simple Queue Service" desc="AWS's message queue — like a mailbox with a line; senders drop messages in and receivers pull them out to process.">SQS</Term> queue in the middle. The web page just "drops the order into the queue" and instantly tells the customer "got it", while the server behind pulls items out at its own pace. During a surge, the queue **holds the peak water for you** so the server isn't washed away. This is called **buffering (smoothing the peak)**.

<Analogy title="🏣 Analogy: a post-office mailbox vs. a building intercom">

- **SQS = your apartment mailbox**: the mail carrier (sender) drops a letter in and leaves; you (receiver) go downstairs to "pull" it out when you have time. The letter waits patiently and won't vanish just because you haven't collected it yet. **One-to-one, pull-based.**
- **SNS = the building intercom**: the manager announces "parcels are here!" once, and **everyone in the building hears it simultaneously**. The message is "pushed" out, notifying a whole crowd at once. **One-to-many, push-based.**

</Analogy>

## Synchronous vs asynchronous: the essence of decoupling

| | Synchronous (tightly coupled) | Asynchronous (decoupled) |
| --- | --- | --- |
| How | A calls B and waits in place for B to finish | A drops work into a queue and moves on |
| When B dies | A fails with it | Message stays in the queue; B processes it after recovery |
| Traffic surge | B gets overwhelmed, A jams too | Queue buffers; B digests at its own pace |

## SQS vs SNS: the most-tested comparison

| Item | SQS (queue) | SNS (publish/subscribe) |
| --- | --- | --- |
| Model | One-to-one; receiver **pulls** | One-to-many; **pushes** to subscribers |
| Retention | Held until collected (up to 14 days) | Gone once pushed; no subscriber = not received |
| Typical use | Buffering, peak smoothing, background job queue | Real-time notifications, fan-out, one-event-many-handlers |
| Receiver | Usually EC2/Lambda pulling | Email, SMS, Lambda, SQS… |

### Why decouple at all? What happens if you don't (plain language)

You might be thinking: "Isn't it simplest for A to just call B directly? Why stuff a queue in the middle?" This is the "why" worth getting straight.

**Not decoupling (A calls B directly) hits three problems:**

1. **One breaks, the whole line breaks**: if B crashes or slows down, A waits in place and jams too — users just watch a spinner. The damage "spreads".
2. **A single surge brings it down**: 10× requests arrive at once, B can't keep up and gets washed away, dragging A down with it.
3. **Scaling is locked together**: A's and B's pace are hard-wired together — B is slow so A must wait, and neither can scale on its own terms.

**Decoupling (a queue/topic in the middle) buys you:**

- **Fault isolation**: B is down, messages sit patiently in the queue, A still takes orders and still tells the user "got it"; B catches up after it recovers, and not a single message is lost.
- **Peak smoothing**: the queue holds the peak so B digests at its own capacity instead of being overwhelmed by the instantaneous spike.
- **Independent scaling**: A only drops, B only pulls — each side scales to its own load without blocking the other.

**The cost (decoupling isn't free)**: one more component to manage, messages become **asynchronous** (dropping one in gives no immediate result, so you must design how to get the outcome back), and you inherit distributed-systems problems like "messages may duplicate, order may be lost" (the mechanisms below exist to handle exactly these). So **not everything should be decoupled** — for a simple call that must return a result immediately and where B is rock-solid, a direct synchronous call is simpler.

:::info[🔑 The point in one sentence]
The essence of decoupling is swapping "**synchronous waiting**" for "**asynchronous buffering**": you pay "one more queue to manage, results arrive a bit later" to gain "no mutual drag-down, can absorb peaks, can scale independently". Whenever a question mentions **buffering, fear of overwhelming the backend, fault isolation**, SQS should pop into your head.
:::

### How do you actually choose SQS vs SNS? (the most-confused decision)

The names look alike and both "pass messages in the middle", but they solve **completely different** problems. Picking the wrong one is a common trap on the exam and in practice. One question separates them:

> **"For this message, is it enough that just ONE worker handles it, or must EVERY interested party get a copy?"**

- Just needs **someone to handle it** (one unit of work, one consumer) → **SQS**. The message is like a ticket on a to-do list; whoever picks it up and finishes it makes it disappear.
- **Every subscriber must get a copy** (same event, many systems each react) → **SNS**. The message is like a broadcast, pushed to all subscribers at once, independently.

| The effect you want | Choose | Why |
| --- | --- | --- |
| Queue work, digest slowly, afraid of overwhelming the backend | **SQS** | Messages are retained until pulled — a buffer by nature |
| One event notifies many targets at once (Email + Lambda + …) | **SNS** | One-to-many push, fans out to all subscribers in one go |
| A downstream may be temporarily down and still must not lose messages | **SQS** (or SNS+SQS) | SQS retains messages; SNS alone is "gone once pushed" |
| Just a real-time heads-up, fine if it's missed | **SNS** | Push is the lightest; no need to retain |

:::info[🔑 Often asked: why not just use SNS for everything?]
Because **SNS does not retain messages**. It delivers to whoever is subscribed **at the moment it pushes**; if there's no subscriber (or a subscriber happens to be down), that message is **never received** — it simply vanishes. The "guarantee downstream receives it and can process at its own pace" you want is something only SQS provides. This is also the fundamental reason "SNS + SQS fan-out" below exists.
:::

### The Standard vs FIFO trade-off (why not just always use FIFO?)

If FIFO "guarantees order and no duplicates", which sounds fancier, why not use it every time? Because **that guarantee has a price**:

- **Much lower throughput**: a Standard queue is practically unlimited (near-unlimited per second); FIFO has a firm cap (300 messages/sec by default without batching, higher with high-throughput batching, but still far below Standard). FIFO becomes the bottleneck when you need huge volume.
- **To guarantee order, processing gets "lined up"**: messages with the same `MessageGroupId` must be processed strictly one at a time before the next — sacrificing some parallelism.
- **Most scenarios don't actually need strict order**: for many jobs (sending email, generating thumbnails, push notifications), which goes first makes no difference; forcing FIFO just slows you down for nothing.

So the rule is: **default to Standard (cheap, fast, scales well), and only reach for FIFO when "wrong order causes a problem" or "processing the same item twice causes a problem".**

| Ask yourself | Answer | Choice |
| --- | --- | --- |
| Would out-of-order processing cause errors? | No → | **Standard** |
| Would processing the same item twice cause errors? (and you don't want to build idempotency) | No / I'll build idempotency myself → | **Standard** |
| Either of the above is "yes" | e.g. payments, inventory decrements, order state machines → | **FIFO** |

:::tip[💡 Exam key point: Standard vs FIFO keywords]
- Question stresses "**high throughput / huge volume / order doesn't matter**" → **Standard queue**.
- Question stresses "**order must be preserved / must never process twice / transactions, payments, inventory**" → **FIFO queue**.
- Note: a Standard queue is "**at-least-once**" delivery, so it **can duplicate by design**; if you use Standard and fear duplicates, the right answer is often "**make your processing idempotent**", not necessarily switch to FIFO.
:::

### Two SQS queue types: Standard vs FIFO

| | Standard queue | FIFO queue |
| --- | --- | --- |
| Order | **Not guaranteed** first-in-first-out | **Strict** first-in-first-out |
| Duplicates | Rare duplicate delivery possible (at-least-once) | **Exactly once**, no duplicates |
| Throughput | Nearly unlimited, very high | Capped (lower) |
| When to use | Order doesn't matter, need huge volume | When **order and no-duplicates matter**, e.g. payments, order IDs |

:::tip[💡 Exam key point]
- Question mentions "**buffering, smoothing the peak, background processing, afraid a surge will overwhelm the backend**" → choose **SQS**.
- Question mentions "**one event must notify many targets at once / one-to-many push / fan-out**" → choose **SNS**.
- Question wants "**broadcast AND each downstream has its own buffer so nothing is lost**" → the classic answer is **SNS + multiple SQS (fan-out pattern)**: SNS pushes once, each SQS keeps its own copy and processes at its own pace.
- Question stresses "**no duplicates, order must be preserved**" (e.g. transactions, inventory decrements) → choose **FIFO queue**.
:::

## Fan-out flow (diagram)

<div className="flow">
  <div className="flow-node">Order event</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">SNS topic</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">SQS: shipping</div>
  <div className="flow-arrow">＋</div>
  <div className="flow-node">SQS: invoice</div>
  <div className="flow-arrow">＋</div>
  <div className="flow-node">SQS: analytics</div>
</div>

*Diagram: one "order placed" event fans out through SNS; shipping, invoicing, and analytics each get their own copy, independent of one another — if any one dies, no message is lost.*

### Why SNS + SQS fan-out? (a huge favorite on the exam)

This is one of SAA's most classic combination questions — be sure you get "why stack the two together".

**Scenario**: one "order placed" must trigger three things at once — notify shipping, issue an invoice, and send to analytics. The three systems each do their own thing, and **none of them may miss an order**.

**Can SNS alone do it?** No. SNS can push to all three subscribers at once (it's great at that), but SNS **does not retain messages**: if the "invoice system" happens to be down at that moment, that push is **gone forever** for it — it can't be recovered later.

**Can SQS alone do it?** Also no. SQS is one-to-one; a message picked up by one consumer is gone, so it can't "give the same item to three systems at once". You'd have to write code to copy it three times into three queues — ugly and easy to drop.

**So the answer is SNS + SQS:**
- **SNS does the "fan-out"**: the order event is pushed once and automatically copied to every subscribed queue.
- **Each downstream gets its own SQS**: shipping, invoicing, and analytics **each have their own queue**, each receives a copy, each buffers, each processes at its own pace. If one system is down, the message sits patiently in its own queue until it recovers — **nothing is lost**.

| | SNS only | SQS only | **SNS + SQS (fan-out)** |
| --- | --- | --- | --- |
| One-to-many broadcast | ✅ | ❌ (copy it yourself) | ✅ |
| Downstream down, no message lost | ❌ (gone once pushed) | ✅ | ✅ |
| Each downstream buffers independently, own pace | ❌ | a single queue can | ✅ one line per downstream |

**When to use / when not to:**
- **Use it**: one event must trigger **multiple independent systems**, and each must **reliably receive and buffer on its own** (e-commerce checkout, IoT event distribution, landing data in multiple places).
- **Don't use it (overkill)**: only one consumer → just use SQS, no need for SNS; pure notification where a miss is fine → just use SNS, no need to attach SQS.

:::info[🔑 Remember fan-out in one line]
**SNS handles "who to distribute to", SQS handles "reliably receive and buffer"** — stack them and you get "broadcast" + "no lost messages + own pace" at once. When a question says "**one event, multiple downstreams, none may be missed, each processes on its own**", the answer is almost always SNS + multiple SQS.
:::

## Two mechanisms you must understand

- **<Term en="Visibility Timeout" desc="A period during which a message, once pulled by one receiver, is temporarily hidden from others to avoid duplicate pickup.">Visibility Timeout</Term>**: when a server pulls a message and starts processing it, the message goes "invisible" for a while so other servers don't pull and process the same one. **Too short** → the first server hasn't finished and the message becomes visible again, gets pulled by another → **duplicate processing**; **too long** → on failure it takes ages to reappear.
- **<Term en="Dead-Letter Queue" desc="A separate queue that collects messages which keep failing, so you can inspect them later and avoid a bad message retrying forever and clogging the line.">DLQ (Dead-Letter Queue)</Term>**: if a message fails many retries (e.g. malformed), move it to a dedicated "dead-letter queue" to isolate it — easy to inspect later, and it stops the bad message retrying forever and clogging the whole line.

## Real-world application: not just for the exam

<Scenario title="Real scenario: smoothing an order peak">

On a big sale day your order volume is 20× normal. You change the flow to "web page → drop into SQS → order server pulls on its own". At peak the queue buffers 500,000 orders and the server digests them at a steady rate, so **not a single order is lost and the web page stays smooth throughout**. That's the power of SQS as a buffer.

</Scenario>

### 🛠️ Hands-on: create an SQS queue and send/receive a message

1. Log in to the AWS console → type `SQS` in the search bar → open Simple Queue Service
2. Click **Create queue**, choose type **Standard**, name it `my-first-queue` → Create
3. Open the queue, top-right click **Send and receive messages**
4. In "Message body" type `Hello Queue`, click **Send message**
5. Below in the "Receive messages" area click **Poll for messages** — you'll see that message get "pulled" out

**Expected result**: after polling, a row appears in the "Receive messages" list; expand it and you'll see the `Body` is exactly the `Hello Queue` you typed. The "Messages available" counter at the top of the queue drops from 1 back to 0 (you collected the message). To see "Visibility Timeout" with your own eyes: after pulling the message, **don't delete it yet** — refresh after a few seconds and it moves from "In flight" back to "Available" and can be pulled again — that's the picture of a message reappearing when the timeout expires.

You can also use the CLI to feel that "drop" and "pull" are two separate actions:

```bash
# Drop a message into the queue (sender)
$ aws sqs send-message \
    --queue-url https://sqs.ap-northeast-1.amazonaws.com/123456789012/my-first-queue \
    --message-body "Hello Queue"

# The receiver comes to "pull" the message
$ aws sqs receive-message \
    --queue-url https://sqs.ap-northeast-1.amazonaws.com/123456789012/my-first-queue
```

**Expected result**: `send-message` returns a chunk of JSON with `MessageId` and `MD5OfMessageBody`, meaning the message is in the queue. `receive-message` returns one message containing the `Body` (`Hello Queue`) and a `ReceiptHandle`. Notice this is exactly how "SQS is **pull**-based" shows up: without running `receive-message`, the message just sits in the queue — SQS **does not push it to you**. To actually remove the message from the queue, you then call `aws sqs delete-message` with that `ReceiptHandle`; if you don't delete it, it becomes available for pickup again once the visibility timeout expires.

<Cost>

Both SQS and SNS have a **Free Tier** (1 million requests per month each), so ordinary practice costs essentially nothing. Beyond that, pricing is per-million-requests and very cheap. What to watch is the **EC2 that pulls messages** — it may incur charges, so shut it down after practice.

</Cost>

:::warning[🚑 Common pitfalls]
- **Visibility Timeout too short** → the first server is still processing, the message becomes visible again and a second server pulls it → **the same order is processed twice**. Rule: set Visibility Timeout ≥ the longest time you need to process one message.
- **No idempotency** → a Standard queue is "at-least-once" delivery by design, so **duplicates are normal, not an accident**. If your processing isn't built so that "doing the same message twice gives the same result" (e.g. de-dupe by order ID, check whether it was already processed), you'll get double charges and double shipments. Don't expect the queue to guarantee no duplicates — that's **your code's** responsibility.
- **No Dead-Letter Queue (DLQ)** → a bad message retries forever, burning resources, eating throughput, and possibly dragging down the whole queue. Always set a DLQ in production.
- **Assuming SQS pushes to you** → SQS is a **pull** model; messages won't travel to your server on their own, someone must keep calling `receive-message` / polling to fetch them. If nobody pulls, messages just sit there (and disappear after up to 14 days). For "an event triggers automatically", use a Lambda event source mapping or SNS push instead.
- **Fan-out missing permissions** → when building SNS + SQS fan-out, "subscribing" alone isn't enough: each SQS queue's **access policy** must explicitly allow that SNS topic to `SendMessage`, otherwise the fan-out push is rejected by the queue and the message **silently vanishes** — often with no obvious error, making it very hard to debug. Subscribing via the console (ticking "enable raw message delivery / configure queue policy automatically") usually fixes this for you; with CLI/IaC you must add the queue policy correctly yourself.
:::

<Refs title="📚 Official docs & further reading">

- [AWS Docs: Amazon SQS Developer Guide](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html)
- [Amazon SNS Developer Guide](https://docs.aws.amazon.com/sns/latest/dg/welcome.html)
- [SQS Visibility Timeout](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html)
- [SNS + SQS fanout scenario](https://docs.aws.amazon.com/sns/latest/dg/sns-common-scenarios.html)

</Refs>

## Next

- ⚡ Quick review: [Domain 2 Flashcards](./flashcards.md)
- ✍️ Test yourself: [Domain 2 Practice Questions](./quiz.md)
- 📖 Next page: [DNS & Traffic Routing (Route 53)](./route53.md)
