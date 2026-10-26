---
sidebar_position: 7
title: Scalable Network & Storage Patterns
---

# Scalable Patterns: the mindset that holds up under heavy traffic

> This is Domain 3's wrap-up page. Earlier pages covered "which tool speeds things up"; this one ties them together around a deeper truth: **horizontal scaling and spreading the load is what truly sustains high performance**.

<Vocab title="📌 Jargon you'll see on this page (fine even if you've never touched AWS)">

- **Read/Write Split**: handling "reads" and "writes" on **different databases**. Heavy read traffic goes to replicas; writes go only to the primary.
- **Read Replica**: an "**auto-synced copy**" of the primary database, used purely to absorb read traffic — it can't be written to.
- **Sharding / Partitioning**: **cutting a huge pile of data into several pieces** stored in different places, so it isn't all crammed in one spot.
- **Partition Key**: the field DynamoDB uses to decide "**which piece this item goes into**"; pick it well and data spreads evenly.
- **Hot Partition**: one piece gets hammered — a flood of requests all lands on the same partition, causing a jam that drags down overall performance.
- **Prefix**: the "**part before the slash**" in an S3 object path — e.g. in `images/2026/a.jpg`, `images/2026/` is the prefix.

</Vocab>

:::note[💬 Reading tip]
Whenever you see a term with a <Term desc="Like this! Hover over any dotted term (tap on mobile) and a plain explanation pops up.">dotted underline</Term>, hover over it for a plain-language explanation. All terms are also collected in the [Glossary & Services](../../glossary.md).
:::

## Why do you need it? A story that goes wrong first

Say your site starts with a single database and one S3 bucket. While traffic is low everything is fine. But as users surge: read requests leave the database gasping, a popular product's lookups hammer one piece of DynamoDB, and users uploading big videos stall halfway across the ocean.

These problems share one solution direction: **don't let all the load pile up in one place — find a way to "spread" it out**. Too many reads? Add replicas to share them. Data too concentrated? Split it apart. Uploads too slow? Cut them into small parts and send in parallel. That's the core of "horizontal scaling" — rather than endlessly enlarging a single resource (vertical scaling, which always hits a ceiling), **flatten the load across more copies of the resource**.

## This page in one sentence

**The mindset that sustains high performance is "horizontal scaling + spreading the load"**: read/write splits ease database pressure, sharding/partitioning keeps data from concentrating, and S3 uses multiple prefixes plus multipart upload to spread requests and files out in parallel.

<Analogy title="🏢 Analogy: think of a bubble-tea shop that just went viral">

- **Read/Write Split**: there are tons of customers asking (reads), so you set up extra screens that "only show the menu and check stock" (read replicas) to share the load; actual "ordering and payment" (writes) still funnels to the cashier (primary).
- **Sharding/Partitioning**: don't stuff all ingredients into one fridge (a hot partition jams up) — sort them by type into several fridges (partition keys) so people fetch from different ones without blocking each other.
- **S3 multiple prefixes**: one serving window means a long queue; open several windows (multiple prefixes) serving at once and throughput multiplies instantly.
- **Multipart Upload**: a single huge crate is too heavy to carry — split it into several smaller boxes carried separately (Multipart), in parallel, and if one box drops you only re-carry that one.

</Analogy>

## How to use the three scaling patterns (the most important table)

| Pattern | Bottleneck it solves | How | Typical services |
| --- | --- | --- | --- |
| **Read/Write Split** | Read traffic crushes the database | Add a <Term en="Read Replica" desc="An auto-synced copy of the primary database that absorbs read traffic; cannot be written to.">Read Replica</Term> for reads, writes go to primary | RDS / Aurora Read Replica |
| **Sharding / Partitioning** | Data or requests all pile in one spot | Use a high-cardinality <Term en="Partition Key" desc="The field DynamoDB uses to decide which piece data goes into; a good one spreads data evenly.">Partition Key</Term> to spread data, avoid hot partitions | DynamoDB, sharded tables |
| **S3 performance tuning** | High request rate, big or cross-border uploads slow | Multiple <Term en="Prefix" desc="The part before the slash in an S3 object path; different prefixes each scale in parallel.">prefixes</Term> in parallel, multipart upload, transfer acceleration | S3, S3 Transfer Acceleration |

### Read/Write Split: more reads, more replicas

Most apps are "**reads far outnumber writes**" (a product page is viewed thousands of times, an order placed only a few). RDS/Aurora can create <Term en="Read Replica" desc="An auto-synced copy of the primary database that absorbs read traffic.">Read Replicas</Term> to route **read-only traffic** like reports and queries to the replica, so the primary focuses on writes and overall throughput jumps. Note replication is **asynchronous**, with a lag of milliseconds to seconds, so "read-your-own-write immediately" cases still need the primary.

### Sharding / Partitioning: don't concentrate data in one piece

DynamoDB spreads data across partitions by the hash of the <Term en="Partition Key" desc="The field DynamoDB uses to decide which piece data goes into.">Partition Key</Term>. If you pick it poorly (e.g. everyone shares `status=active`, or a date funnels all of today's traffic into one spot), you get a <Term en="Hot Partition" desc="A flood of requests all lands on one partition, jamming it and dragging down performance.">hot partition</Term> — one piece hammered while others idle. **The fix is to choose a "high-cardinality (many well-distributed values)" Partition Key**, such as a highly unique field like `user_id` or `order_id`, so requests spread evenly across partitions.

### S3 performance tuning: spread both requests and files in parallel

- **Multiple prefixes in parallel**: S3 now supports **3,500 writes / 5,500 reads per second per <Term en="Prefix" desc="The part before the slash in an object path.">prefix</Term>**, with no limit on the number of prefixes. Just spread objects across multiple prefixes (like `logs/a/`, `logs/b/`) and throughput adds up linearly. **(Important: you used to add a random hash to the prefix to spread load — that's no longer needed.)**
- **Multipart Upload (<Term en="Multipart Upload" desc="Splitting a big file into parts uploaded in parallel; a failure only re-sends that part.">Multipart Upload</Term>)**: split a big file into parts uploaded **in parallel** — faster, and a failure only re-sends that one part. AWS recommends using it **for anything over 100 MB**.
- **Transfer Acceleration (<Term en="S3 Transfer Acceleration" desc="Speeds up long-distance cross-border uploads via CloudFront edge locations.">S3 Transfer Acceleration</Term>)**: for cross-border, long-distance uploads, data first goes to the nearest CloudFront edge location, then rides the AWS backbone back to the bucket — a clear speed-up.

## Going deeper: why split it this way? The trade-offs

Above covered "how"; this section adds the **"why"** — what bottleneck each move solves, when to use it, and what it costs. Exams love "why pick this over that", and in real work you make these trade-offs every day.

### Vertical vs horizontal scaling: get this big-picture split first

When something "isn't powerful enough" there are usually two reflexes — be clear which road you're on:

| Direction | How | Pros | Cons / limits |
| --- | --- | --- | --- |
| **Scale Up (vertical)** | Swap the single machine for a bigger one (more CPU/memory) | Simplest, almost no code change | **A hard physical ceiling** (the biggest instance is only so big), swaps often need downtime, single point of failure, cost grows non-linearly as it gets bigger |
| **Scale Out (horizontal)** | Add more machines, spread the load across copies | Virtually no ceiling, add while running, one dies and others survive | Must handle the complexity of "how to split data, keep it synced, query across pieces" |

:::info[🔑 The trade-off in one line]
**Scaling up is "make one person stronger"; scaling out is "hire more people".** Making one person stronger always hits a limit, and if that person is off everything stops; hiring more has almost no ceiling and is more resilient — the cost is you must learn "division of labor and coordination". This page's read/write split, sharding, and S3 multiple prefixes are all concrete moves of **horizontal scaling** — which is exactly why the cloud can sustain massive traffic.
:::

### Why read/write split? It solves "reads crushing the database"

- **Why this**: most apps have far more reads than writes. When read requests pile up until the DB's CPU/connections blow up, rather than endlessly swapping the primary for a bigger box (scale up — a ceiling, and expensive), you **add replicas dedicated to reads** and let the primary handle only writes. It's the most intuitive move for "solve a read bottleneck with horizontal scaling".
- **Pros**: read throughput scales almost linearly with the number of replicas; replicas can sit across AZs/regions too, improving availability and DR along the way.
- **Cons / cost**: replicas are **asynchronous** with replication lag (usually ms to seconds); and it **does nothing for a write bottleneck** — writes still all funnel to the single primary. Each replica is another instance to pay for.
- **When NOT to use**: if the bottleneck is actually **writes** (lots of INSERT/UPDATE), a read/write split won't help — consider sharding, or a database with higher write throughput (like DynamoDB). Also, for strong-consistency "read-your-own-write immediately" cases, don't read the replica.

### Why shard/partition? It solves "data or requests all piling in one spot"

- **Why this**: when a single database/single partition can't even handle the **writes** or the **total data volume**, a read/write split can't save you (replicas still absorb every write). Now you **cut the data itself** apart, spreading it across partitions/machines so each piece carries only a portion — and writes plus capacity scale horizontally with it.
- **Pros**: write throughput and total capacity both grow with the number of shards; hot spots get spread out instead of jamming one point.
- **Cons / cost**: **cross-shard queries and transactions get hard** (data isn't in one place, so JOINs/aggregations must be stitched in the app layer or scan every shard); **pick the partition key wrong and you must re-shard**, which means a painful data move; operational complexity clearly rises.
- **When NOT to use**: while data and write volume are still comfortably within one machine, don't shard early "in case it grows someday" — you pay the complexity up front and the benefit hasn't arrived. Lean on a read/write split or cache first; shard only when you truly hit the single-machine ceiling.

:::info[🔑 Read/write split vs sharding — which first?]
**Bottleneck in reads → read/write split first (+ cache)**; **bottleneck in writes or total volume → only then shard.** They stack: shard to spread writes, then hang read replicas off each shard for reads. The usual order is "cache → read/write split → finally shard", because each later step is more complex and harder to undo.
:::

### S3 performance best practices: when to use each of the three

| Move | Solves what | When to use | Expected effect |
| --- | --- | --- | --- |
| **Multiple prefixes in parallel** | A single prefix hits its request-rate cap (3,500 writes / 5,500 reads per second) | High-request-rate reads/writes (lots of small files, logs) | Each extra prefix adds another budget; throughput scales almost linearly |
| **Multipart Upload** | Big-file uploads are slow and prone to mid-way failure | Files **>100 MB** (>5 GB forces it) | Parts upload in parallel — faster; a failure re-sends only the broken part |
| **Transfer Acceleration** | Cross-border/long-distance uploads have high latency, slow speed | Users far from the bucket, and files big enough to be worth it | Rides CloudFront edges + the AWS backbone — a clear long-distance speed-up |

:::warning[🚑 Common pitfalls]
- **Stale reads after a read/write split**: replicas are async with lag. "User just changed a setting, next page reads the replica" may well return the **old value**. For read-after-write, read the primary (or use Aurora's tooling to guarantee reading your own write).
- **Cross-shard queries get hard**: once split, "list the latest 100 orders site-wide" is no longer one SQL — you either scan every shard and merge, or build a separate aggregate table / search index. **Decide what you query most before choosing the partition key**, or you'll shard and then find your main query needs every shard.
- **Thinking "add machines = faster"**: adding replicas when **writes** are the bottleneck, or when the app still connects only to the primary, adds nothing. First measure whether the bottleneck is reads or writes, CPU or I/O, then decide what to add — not "slow, so add machines".
- **S3 hot prefix**: dumping a flood of objects under one prefix (everything in `uploads/`) hits the single-prefix cap even though S3 is powerful, yielding 503 `SlowDown`. **Spread objects across multiple prefixes** (folders by date or user ID) so requests fan out.
:::

:::tip[💡 Exam key point]
Match the keyword straight to the bottleneck and tool — nearly free points:
- Question mentions **read traffic surging, heavy database read pressure** → **Read Replica** (even better paired with ElastiCache caching)
- Question mentions **certain DynamoDB keys getting hammered, uneven throughput, throttling** → design a **high-cardinality Partition Key** to spread data and **avoid hot partitions**
- Question mentions **uploading big files to S3, or slow cross-border / long-distance uploads** → **Multipart Upload + Transfer Acceleration**
- Question mentions **S3 needing to sustain a high request rate** → **parallelize across multiple prefixes** (no more random prefix hashing needed)
:::

## "Pick the tool by the performance bottleneck" decision flow

<div className="flow">
  <div className="flow-node">Ask first: which layer is the bottleneck?</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Too many reads → Read Replica / ElastiCache</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Data concentrated → high-cardinality Partition Key</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Slow upload/transfer → Multipart + Transfer Acceleration</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Static content far away → CloudFront edge caching</div>
</div>

*Diagram: performance questions aren't about memorizing one service — first judge "where the bottleneck is", then pick a load-spreading tool from the matching layer. That's exactly Domain 3's integrated style.*

## Real-world application: it's not just for the exam

<Scenario title="Real scenario: on sale day the DB CPU hits 100% and S3 uploads keep timing out">

The moment the sale opens, monitoring alarms fire: RDS read CPU hits 100%, one DynamoDB table keeps throttling, and users' high-definition unboxing videos keep timing out on upload. You tackle them one by one: **read pressure** gets a Read Replica; the **DynamoDB hot partition** gets a redesigned Partition Key; **big uploads** switch to Multipart Upload with Transfer Acceleration enabled. Let's configure these three moves below.

</Scenario>

### 🛠️ Hands-on: three load-spreading moves

1. **Create an RDS Read Replica**: console `RDS` → select your database → **Actions** → **Create read replica**. Then point your app's "read-only queries" at the replica's endpoint; writes still use the primary.
2. **Inspect DynamoDB partition heat**: go to `DynamoDB` → **CloudWatch Contributor Insights** and see which Partition Keys are hit hardest; if concentrated on a few keys, switch to a more unique field as the Partition Key.
3. **Enable S3 Transfer Acceleration and do a multipart upload via CLI** (big files are split automatically).

```bash
# Enable Transfer Acceleration on the bucket
$ aws s3api put-bucket-accelerate-configuration \
    --bucket my-bucket \
    --accelerate-configuration Status=Enabled

# Upload a big file; aws s3 cp auto-uses multipart for large files
$ aws s3 cp big-video.mp4 s3://my-bucket/ \
    --endpoint-url https://my-bucket.s3-accelerate.amazonaws.com
```

<Cost>

A Read Replica is effectively **another database instance**, billed separately by instance-hours; DynamoDB is billed on read/write capacity, and a hot partition forces you to keep raising capacity — more expensive instead. S3 Transfer Acceleration adds a per-GB acceleration fee. When done, remember to **delete the replica and turn off acceleration** to avoid ongoing charges.

</Cost>

:::warning[🚑 Common real-world mistakes]
- **Routing writes to a Read Replica**: replicas can't be written to, and with replication lag, reading a replica right after a write may return stale data.
- **A low-cardinality Partition Key**: e.g. using `country` when most users are in one country — a direct cause of hot partitions and throttling.
- **Still adding a random prefix hash by hand**: S3 performance was upgraded long ago — each prefix already handles thousands of requests, and redundant hashing only makes paths hard to manage.
- **Not using Multipart for big files**: a single PUT caps at 5 GB and a failure means re-sending everything — always use multipart for big files.
:::

<Refs title="📚 Official docs & further reading">

- [AWS Docs: RDS Read Replicas](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ReadRepl.html)
- [DynamoDB partition key design best practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-partition-key-design.html)
- [S3 performance optimization best practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/optimizing-performance.html)
- [S3 Transfer Acceleration](https://docs.aws.amazon.com/AmazonS3/latest/userguide/transfer-acceleration.html)
- [S3 Multipart Upload](https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html)

</Refs>

## Next

- ⚡ Quick review: [Domain 3 Flashcards](./flashcards.md)
- ✍️ Test yourself: [Domain 3 Practice Questions](./quiz.md)
- 📊 Final review: [Domain 3 Comparison Cheat Sheet](./comparison.md)
