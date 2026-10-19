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

<Cost>

Both SQS and SNS have a **Free Tier** (1 million requests per month each), so ordinary practice costs essentially nothing. Beyond that, pricing is per-million-requests and very cheap. What to watch is the **EC2 that pulls messages** — it may incur charges, so shut it down after practice.

</Cost>

:::warning[🚑 Common real-world mistakes]
- **Visibility Timeout too short** → the first server is still processing, the message becomes visible again and a second server pulls it → **the same order is processed twice**. Rule: set Visibility Timeout ≥ the longest time you need to process one message.
- **No Dead-Letter Queue (DLQ)** → a bad message retries forever, burning resources, eating throughput, and possibly dragging down the whole queue. Always set a DLQ in production.
- **Assuming SNS holds messages for you** → if there's no subscriber at the moment SNS pushes, the message is **gone**. To "guarantee downstream receives it and can buffer", attach an SQS.
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
