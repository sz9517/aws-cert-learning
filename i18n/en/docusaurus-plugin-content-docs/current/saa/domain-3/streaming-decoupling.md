---
sidebar_position: 6
title: "High-Performance Decoupling & Data Streaming: Kinesis & SQS"
---

# Use queues and streams to "absorb spikes and sustain high throughput"

> This page takes the **performance** angle: when traffic suddenly explodes and data pours in like a firehose, how do you use SQS and Kinesis to absorb the spike and keep the backend steadily processing at high throughput? It's a commonly tested selection question in Domain 3's high-performance topics.

<Vocab title="📌 Jargon you'll see on this page (fine even if you've never touched AWS)">

- **Queue**: a "**waiting line**". Messages arrive and queue up; the backend pulls them out one at a time when it has capacity, then deletes each after processing.
- **Stream**: a "**continuously flowing river of data**". Events flow in one after another, consumers read along the river, and the data stays in the river for a retention period.
- **Producer / Consumer**: the **one putting data in** is the producer (e.g. a front-end app); the **one pulling data out to process** is the consumer (e.g. a backend service).
- **Spike**: a burst of traffic in a short window — flash sales, a stream going live, a promotion.
- **Throughput**: how many records you can process per unit of time; a bigger number means it handles more load.

</Vocab>

:::note[💬 Reading tip]
Whenever you see a term with a <Term desc="Like this! Hover over any dotted term (tap on mobile) and a plain explanation pops up.">dotted underline</Term>, hover over it for a plain-language explanation. All terms are also collected in the [Glossary & Services](../../glossary.md).
:::

## Why do you need it? A story that goes wrong first

Say your flash-sale site has the front end push every order **synchronously** straight to the backend database. Fine on a normal day — but the moment a promotion opens, **100,000 requests per second** pour in, the database gets hammered, connections choke, and the whole site slows to a crawl or crashes. The root cause: **the front end's spike speed far exceeds the backend's processing speed**, with no buffer in between.

The fix: put a **queue or stream** between front and back end as a buffer. The front end only has to "drop the message in" (fast), while the backend pulls messages out **at its own pace**, one at a time. The buffer absorbs the spike, the backend never gets crushed, and overall throughput stays high — that's "**using a queue/stream to absorb spikes**".

> 💡 For the same thing seen from the "loose coupling, fault tolerance" architecture angle, see Domain 2's [Application Decoupling](../domain-2/decoupling.md); this page focuses on the **performance** side — "absorb spikes, raise throughput".

## Both services in one sentence

**SQS (Simple Queue Service)** is a fully managed **message queue**: messages queue up, one consumer takes a message, processes it, and **deletes** it — great for task dispatch and absorbing spikes. **Kinesis** is a **real-time data streaming** platform: data flows like a river, and **multiple consumers can each read the same data repeatedly** — great for real-time analytics and telemetry.

<Analogy title="🏢 Analogy: a post office 'ticket machine' vs a TV station's 'live broadcast signal'">

- **SQS is like the post office ticket machine**: each customer pulls a numbered ticket and lines up; the counter calls a number and serves **that one person**, then the ticket is void (the message is deleted). A ticket is only ever called once.
- **Kinesis is like a TV station's live signal**: the same signal is sent to thousands of TVs **at once** (multiple consumers), each can watch on its own, and you can even use DVR to **rewind and re-watch** (replay data within the retention window). The signal doesn't vanish just because one TV saw it.
- Want "one person per ticket, done when processed" → the ticket machine (SQS). Want "everyone receives it at once and can replay" → the live signal (Kinesis).

</Analogy>

### Why are Kinesis and SQS "two different things", not two flavors of one choice?

Many people on first read assume "both just sit in the middle as a buffer, so pick one" and grab one at random — and that's the most common selection mistake. They're **two fundamentally different data models**:

- **SQS is a "queue": a message is a task, taken and gone.** One message is one to-do item; whoever grabs it first processes it and **deletes** it, and that item is gone forever. The point is "**hand work out, each done once**".
- **Kinesis is a "stream": data is a record, still there after you read it.** Data flows past like a river; a consumer just advances its "I've read up to record N" pointer, and **the data itself does not vanish because it was read** (it stays within the retention window). The point is "**the same data read repeatedly by many, and re-readable later**".

<Analogy title="🏢 Another analogy: handing out flyers vs a radio station">

- **SQS is like handing flyers to a row of helpers**: you deal out a stack of flyers (tasks), each person takes one and goes, and once handed out that flyer is gone. You want "**get a pile of work done across everyone**".
- **Kinesis is like a radio station's program**: the same program is heard by countless radios at once, each listening on its own and able to rewind and re-listen (within the retention window). You want "**the same content heard by many at once, and replayable**".

</Analogy>

**So deciding "which to use" is just three questions:**

1. **Does this data need to be read independently by "more than one" group of consumers?** Yes → stream (Kinesis); no, you just hand work out to be done once → queue (SQS).
2. **Might you need to "re-read / replay" the same batch of data later?** (e.g. re-run with a new algorithm, after-the-fact analysis) Yes → Kinesis; no, done once and over → SQS.
3. **Do you need strict ordering of "events sharing the same key"?** (e.g. one user's action order) Yes → Kinesis (ordered within a shard) or SQS **FIFO queue**; don't care → SQS standard queue (cheapest and simplest).

#### Pros and cons at a glance (plain version)

| | **SQS (queue)** | **Kinesis Data Streams (stream)** |
| --- | --- | --- |
| **Biggest upside** | Fully managed, almost zero ops, very cheap, natural spike absorption, capacity auto-scales | One dataset read by many consumers, replayable, keeps order, handles millions of events per second |
| **Main downside** | Consume-once, **no replay**, no independent multi-consumer, ordering needs FIFO with extra limits | You must **size/manage shards yourself** (or use on-demand mode), more complex than SQS, shards charge while open |
| **When NOT to use it** | Need replay, need multiple consumers, need real-time analytics → don't use SQS | Just handing background work out to be done once → don't use Kinesis (overkill, plus shard management) |

> 💡 In one line: **use SQS for "divide work, do it once"; use Kinesis for "one dataset read by many, needs replay, needs order, needs real-time analytics".** These two lines map straight onto exam keywords.

## How to pick between the three (the most important table)

| Service | Nature | Consumption | Data retention | Best for |
| --- | --- | --- | --- | --- |
| **SQS** | Message queue | Taken by **one** consumer, **deleted** after processing (consume-once) | Default 4 days, max 14 days | Task dispatch, absorbing spikes, loosely coupled background jobs |
| **Kinesis Data Streams** | Real-time stream | **Multiple** consumers read independently, **replayable**, keeps order | Default 24 hours, max 365 days | Real-time analytics, telemetry, click-streams, needs multi-consumer/replay |
| **Kinesis Data Firehose** | Streaming load pipeline | Auto-writes **near real-time** to a destination (no consumer code) | Not retained (sent straight on) | Auto-loading stream data into S3 / Redshift / OpenSearch |

<Term en="Simple Queue Service" desc="A fully managed message queue. Messages queue up, one consumer deletes a message after processing — great for task dispatch and absorbing traffic spikes.">SQS</Term>'s point is "**consume-once, absorb spikes**": the front end floods it with messages, the backend digests them at its own pace, and each message is deleted once processed — no duplicates. <Term en="Kinesis Data Streams" desc="A real-time data streaming service. Data is retained for a period, multiple consumers can each read it repeatedly in order, and shards scale throughput.">Kinesis Data Streams</Term>'s point is "**replayable, multi-consumer, keeps order**": the same click-stream can feed a real-time dashboard, an anomaly detector, and a data warehouse — three consumer groups each reading their own way.

### How does Kinesis scale throughput? Meet the "Shard"

Kinesis Data Streams' throughput is set by its <Term en="Shard" desc="The smallest throughput unit of a Kinesis stream. Each shard has a fixed write/read limit; adding shards linearly scales the whole stream's throughput.">shards</Term>. **One shard = one small pipe of fixed throughput** (roughly 1 MB/s or 1,000 records/s of writes). When events per second grow and the pipe isn't wide enough, you **add shards** and throughput scales up linearly — that's how Kinesis handles "millions of events per second".

### Firehose: don't want to write a consumer? Let it auto-load for you

<Term en="Kinesis Data Firehose" desc="A fully managed streaming load service. It automatically batches and writes stream data near real-time into S3, Redshift, OpenSearch, etc., with no consumer code to write.">Kinesis Data Firehose</Term> solves "**the data arrived, but I can't be bothered to write code to move it into storage**". You just point the stream at Firehose, and it **near real-time** buffers, compresses, and batch-writes into S3, Redshift, or OpenSearch — zero consumer code to maintain. When the ask is "**auto-load stream data into a data lake, no code**", reach for it.

#### Data Streams vs Firehose: both are Kinesis, so what's the difference?

Both carry the name Kinesis, which is exactly why they get confused. The one-liner: **Data Streams is the stream that "lets you process the data yourself"; Firehose is the pipeline that "auto-moves the data to a destination for you".**

| | **Kinesis Data Streams** | **Kinesis Data Firehose** |
| --- | --- | --- |
| **What you do** | Write a consumer to read, process, and analyze in real time | Almost no code — just set a source and a destination |
| **Is data retained?** | **Yes**, 24 hours to 365 days, replayable, multi-consumer | **No**, once batch-delivered to the destination it is not retained (re-read from the destination instead) |
| **Latency** | Near-instant (milliseconds to seconds, as fast as you read) | **Near real-time**, with a **buffer delay** (delivers once a size or time is reached; default around 60s, tunable 0 to 900s) |
| **How it scales** | You manage the **shard count** | Fully automatic, **no shard concept**, no capacity planning |
| **Best for** | Real-time dashboards, anomaly detection, stream compute, needing multiple consumers | Auto-dumping raw stream data into S3 / Redshift / OpenSearch for storage |

**In practice they're often used together**: the same events go into **Data Streams** first (so a real-time dashboard and anomaly detection each read independently), then a **Firehose** consumer **auto-loads the raw events into S3** for later analysis — covering both real-time and long-term storage.

<Scenario title="Scenario and expected result: what picking wrong costs you">

You need to "score each transaction's risk in real time, while also storing the raw transactions in S3 for audit".

- **Firehose only**: data reaches S3, but Firehose has a **buffer delay** (default accumulates around 60s before sending a batch), so "score each one in real time" is impossible — **expected result: risk scores come out nearly a minute late, too late to block a suspicious transaction**.
- **Data Streams only**: real-time scoring is fine, but you must **write a consumer yourself** to batch-write into S3, plus handle retries and file splitting — **expected result: a pile of extra plumbing code to write and maintain**.
- **Correct answer (both together)**: Data Streams does the real-time scoring, and a Firehose consumer auto-loads the same raw data into S3 — **expected result: millisecond-level scoring plus zero-ops auto-archiving, best of both**.

</Scenario>

:::tip[💡 Exam key point]
Match the keyword straight to the answer — nearly free points:
- Question mentions **real-time streaming, multiple consumers reading the same data, replay, preserving order** → **Kinesis Data Streams**
- Question mentions **auto-loading stream data into S3 / Redshift, near real-time, no code** → **Kinesis Data Firehose**
- Question mentions **a plain task queue, one consumer deletes after processing, absorbing spikes so the backend isn't crushed** → **SQS**
- Question mentions **millions of events per second of telemetry / click-stream** → **Kinesis**
:::

## How it works (diagram)

<div className="flow">
  <div className="flow-node">Producer (front-end spike traffic)</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Queue/stream absorbs the spike (buffer)</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Backend consumer processes at its own pace</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Steady high throughput, backend never crushed</div>
</div>

*Diagram: the queue/stream in the middle acts as a buffer, absorbing the front-end spike so the backend digests at a steady high throughput — a slow or paused backend never affects data intake.*

## Real-world application: it's not just for the exam

<Scenario title="Real scenario: the second a stream goes live, the backend is crushed by interaction events">

You build a live-streaming interaction app. On a normal day a few hundred comments per second is fine, but the moment a famous streamer goes live, **hundreds of thousands per second** of comments, likes, and gift events pour in. The front end wrote straight to the database, and the instant the stream started, DB connections maxed out and everything froze. Your boss demands "**no more freezing at the go-live spike, not a single event lost, and we need to replay it later for analytics**". The answer: events go into Kinesis Data Streams first (replayable, multi-consumer), one consumer builds a real-time dashboard, and Firehose auto-loads the raw events into S3 for later analysis. Below we'll do a minimal SQS-buffer version.

</Scenario>

### 🛠️ Hands-on: use SQS as a buffer to absorb spikes

1. In the console search `SQS` → **Create queue**, type `Standard` (standard queue, high throughput), keep the rest as default.
2. Note the queue's **URL**. Have the front end (producer) `send-message` each task into the queue, and respond to the user as soon as it's dropped in — **without waiting for the backend to finish**.
3. The backend (consumer) continuously `receive-message`s to pull messages out and process them, then `delete-message`s each one after success.
4. Deliberately flood in a large batch of messages to simulate a spike: you'll see messages pile up temporarily in the queue (buffered) while the backend clears them at its own pace — **the backend is never crushed**.

```bash
# Drop a message into the queue (producer)
$ aws sqs send-message \
    --queue-url <your-queue-URL> \
    --message-body "order-12345"

# Pull a message out to process (consumer); delete it after processing
$ aws sqs receive-message --queue-url <your-queue-URL>
```

<Cost>

SQS is **billed per request**, with a large monthly free tier (millions of requests), so ordinary practice is nearly free. Kinesis Data Streams is **billed per shard-hour + data volume** — a shard **charges while it's open**, so after practicing be sure to **delete the stream / scale shards down**. Firehose is billed by data volume written. Remember to clean up the queue and stream when done so shards don't keep charging.

</Cost>

:::warning[🚑 Common pitfalls]
- **Using SQS when you need "multi-consumer replay"**: SQS messages are consume-once and deleted after processing — they can't let multiple consumer groups each read independently and rewind to replay the way Kinesis can.
- **Using Kinesis for a plain task queue**: if it's just one-person-per-ticket background work, SQS is simpler and cheaper; forcing Kinesis means managing shards for nothing.
- **Too few shards to survive the spike**: writing beyond the shard limit returns `ProvisionedThroughputExceeded` — size shards ahead of a spike or switch to on-demand mode.
- **SQS consumer forgets to delete the message**: skip `delete-message` after processing and, once the visibility timeout passes, the message reappears and gets processed again.
- **Assuming SQS can "replay" or "re-read"**: the deadliest misconception. Once anyone `delete-message`s a message in SQS, it is **gone forever** — there is no "rewind". **Expected failure**: later your boss says "re-run last week's events through the analysis", and only then do you discover the data was consumed long ago and cannot be recovered. If you need replay, the data must live in **Kinesis Data Streams** (re-readable from any position within the retention window).
- **Needing multiple consumers to each read everything, but choosing SQS**: in SQS a message is taken by exactly **one** consumer; adding a second consumer just makes it "grab what's left", not "both read everything". **Expected failure**: a real-time dashboard and an anomaly detector fight over messages and each sees only half the data. For "the same data read in full by many", use **Kinesis** (or put SNS in front of SQS for fan-out, but that is a different setup).
- **Using Firehose only but expecting "real time"**: Firehose has a **buffer delay** (delivers once a configured size or time is reached, default around 60s). **Expected failure**: you assume data is usable the instant it arrives, but it actually takes nearly a minute to land in S3, so real-time alerting or scoring is far too late. For true real-time processing, read from **Data Streams** yourself; Firehose only does "near-real-time auto-archiving".
- **Clinging to a fixed shard count and not pre-scaling for a spike**: Kinesis shards do not auto-scale; a sudden surge with no pre-added shards or on-demand mode gets writes blocked by `ProvisionedThroughputExceeded`. **Expected failure**: during the spike, masses of events fail to write and are dropped, and replay later cannot recover data that never got in. Size shards ahead of a spike or switch to **On-demand mode** so it auto-scales.
:::

<Refs title="📚 Official docs & further reading">

- [AWS Docs: Amazon SQS Developer Guide](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html)
- [Amazon Kinesis Data Streams Developer Guide](https://docs.aws.amazon.com/streams/latest/dev/introduction.html)
- [Amazon Data Firehose overview](https://docs.aws.amazon.com/firehose/latest/dev/what-is-this-service.html)
- [Kinesis Data Streams: shards and capacity](https://docs.aws.amazon.com/streams/latest/dev/key-concepts.html)
- [SQS standard vs FIFO queues](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-queue-types.html)

</Refs>

## Next

- ⚡ Quick review: [Domain 3 Flashcards](./flashcards.md)
- ✍️ Test yourself: [Domain 3 Practice Questions](./quiz.md)
- 📖 Next page: [Scalable Networking & Storage Patterns](./scalability-patterns.md)
