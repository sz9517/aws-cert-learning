---
sidebar_position: 3
title: "Database Selection: RDS / Aurora / DynamoDB"
---

# Database Selection: pick by "data model + performance needs"

> This page helps you choose between RDS, Aurora, and DynamoDB from a **performance angle**, plus how to offload read traffic with Read Replicas — the most commonly tested selection question in Domain 3.

<Vocab title="📌 Jargon you'll see on this page (fine even if you've never touched AWS)">

- **Relational Database**: data stored in "**tables with columns**" that can relate to each other, queried with standard SQL. Think of it as a supercharged spreadsheet.
- **NoSQL Database**: a database without fixed tables or enforced column consistency. The common form is "**key-value**": hand it a key, get the matching data back — extremely fast.
- **Managed**: AWS handles the chores — "**install, patch, back up, maintain hardware**" — so you just use it.
- **Read Replica**: a "**read-only clone**" of the primary database that absorbs query (read) traffic, letting the primary focus on writes.
- **Throughput**: how many requests per second the database "**can handle**".

</Vocab>

:::note[💬 Reading tip]
Whenever you see a term with a <Term desc="Like this! Hover over any dotted term (tap on mobile) and a plain explanation pops up.">dotted underline</Term>, hover over it for a plain-language explanation. All terms are also collected in the [Glossary & Services](../../glossary.md).
:::

## Why do you need it? A story that goes wrong first

Say your e-commerce site starts out on a single self-hosted MySQL. As business grows, three things blow up at once:

1. **The database needs babysitting**: you back it up at midnight, apply security patches, expand the disk when it fills, and get paged when it breaks.
2. **Read traffic crushes the primary**: masses of users "browse products and read reviews" (reads) at once, overwhelming the primary so even "placing an order" (writes) slows down.
3. **Some data just doesn't fit into tables**: shopping carts, user sessions, game leaderboards — huge volume that only needs "give a key, get one record". Forcing them into relational tables is slow and expensive.

AWS's answer: **pick the right database by data model and performance needs** — want standard SQL with less hassle, use <Term en="Relational Database Service" desc="AWS-managed relational database service supporting engines like MySQL and PostgreSQL; handles backups, patching, and maintenance for you.">RDS</Term>; want higher-performance relational, step up to <Term en="Amazon Aurora" desc="AWS's own relational engine, compatible with MySQL/PostgreSQL, with higher performance and auto-scaling storage.">Aurora</Term>; want huge-scale key-value lookups at single-digit-millisecond latency, use <Term en="Amazon DynamoDB" desc="AWS fully managed NoSQL key-value database with single-digit-millisecond latency, serverless, and auto-scaling.">DynamoDB</Term>. The too-much-read-traffic problem? Hand it to **Read Replicas**.

## In one sentence

**There's no "best" database, only the "most suitable" one**: first decide whether the data is "relational tables" or "key-value NoSQL", then size up the performance/scale needs — and it maps straight to RDS, Aurora, or DynamoDB.

<Analogy title="🍱 Analogy: think of the three databases as three restaurants">

- **RDS (managed relational)** is like a **home-style diner**: a conventional menu (standard SQL), the owner runs the place for you (AWS-managed), everything you'd expect, low barrier to open.
- **Aurora (high-performance relational)** is like **the same cuisine, but a flagship chain branch**: the menu is identical (MySQL/PostgreSQL compatible), but the kitchen is massively upgraded and seats (storage) auto-expand when full, so food arrives faster.
- **DynamoDB (NoSQL key-value)** is like an **ultra-fast pickup locker**: you punch in a number (the key), the locker goes "ding" and pops your meal out instantly (single-digit milliseconds), and it never jams no matter how many thousands grab at once — but it only does fixed "punch-a-number pickup", not complex custom orders.

</Analogy>

## How to pick between the three (the most important table)

| Type | Data model | Performance / scale | Operations | Best for |
| --- | --- | --- | --- | --- |
| **RDS** | Relational (MySQL, PostgreSQL, MariaDB, Oracle, SQL Server) | General to mid-large, can add read replicas | Managed (AWS does backups/patching) | Standard SQL, traditional apps, less ops |
| **Aurora** | Relational (MySQL / PostgreSQL compatible) | Higher than RDS (AWS claims ~5x MySQL throughput), storage auto-scales to 128 TB | Managed, with easier auto-scaling | Relational but needs higher performance / throughput |
| **DynamoDB** | NoSQL (key-value / document) | Virtually unlimited, single-digit-ms latency | Serverless, no machines to manage | Huge scale, key-value lookups, spiky traffic |

<Term en="Relational Database Service" desc="AWS-managed relational database service supporting engines like MySQL and PostgreSQL.">RDS</Term>'s strength is "**standard and hassle-free**": lift your familiar MySQL/PostgreSQL straight to the cloud, and AWS handles backups, patching, and hardware. <Term en="Amazon Aurora" desc="AWS's own relational engine, compatible with MySQL/PostgreSQL, with higher performance and auto-scaling storage.">Aurora</Term> is "**same SQL, stronger engine**": compatible with existing apps, but higher throughput and storage that grows automatically with usage — no manual expansion. <Term en="Amazon DynamoDB" desc="AWS fully managed NoSQL key-value database with single-digit-millisecond latency, serverless.">DynamoDB</Term> takes a different path: it drops complex table relationships in exchange for **steady single-digit-millisecond latency even at huge scale**, and it's **serverless**, auto-scaling through traffic spikes.

## Read traffic too heavy? Offload with Read Replicas

When reads (queries) far outnumber writes, instead of upgrading the primary into a monster, give it a few <Term en="Read Replica" desc="A read-only clone of the primary database that absorbs read traffic so the primary can focus on writes.">Read Replicas</Term>: the primary focuses on writes while query traffic spreads across a pool of read-only clones, scaling read performance horizontally. Both RDS and Aurora support this.

:::note[📌 Difference from Domain 2's "high availability"]
Both are "replicas", but the angle differs: here a **Read Replica is for "scaling read performance"** (spreading query traffic); whereas Domain 2's **Multi-AZ is for "high availability"** (auto-failover when the primary dies). The two can be combined. The high-availability side is fully covered in [Database High Availability: Multi-AZ](/saa/domain-2/database-ha).
:::

:::tip[💡 Exam key point]
Match the keyword straight to the answer — nearly free points:
- Question mentions **relational, standard SQL wanted, managed/low-ops** → **RDS**
- Question mentions **relational but needs higher performance / throughput than RDS, auto-scaling storage** → **Aurora**
- Question mentions **huge scale, key-value lookups, single-digit-ms latency, serverless elasticity** → **DynamoDB**
- Question mentions **read traffic crushing the primary, need to scale reads** → add **Read Replicas** (note: high availability is Multi-AZ instead)
- Question mentions **global, multi-Region, low-latency reads/writes** → **DynamoDB Global Tables** or **Aurora Global Database**
:::

## How it works (diagram)

<div className="flow">
  <div className="flow-node">Application</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Writes → Primary database</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Async replication</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Reads → Read Replicas (read-only clones, multiple)</div>
</div>

*Diagram: writes all go to the primary; heavy reads spread across multiple Read Replicas, so read performance scales horizontally with the number of replicas.*

## Real-world application: it's not just for the exam

<Scenario title="Real scenario: orders get slower and slower — turns out it's 'being read to death'">

Your e-commerce primary is a single RDS for MySQL. During a promotion, users hammer "product pages, reviews, stock levels" (all reads), pinning the database CPU at 100% so even checkout (writes) stalls. Your boss says "**stop letting queries drag down ordering**". The answer isn't to blindly upgrade the primary — it's to **add 2-3 Read Replicas dedicated to read traffic**, routing queries to the replicas and keeping writes on the primary. If volume later explodes and huge-scale key-value lookups appear (like shopping carts), consider moving that piece to DynamoDB. Let's do it once below.

</Scenario>

### 🛠️ Hands-on: add a Read Replica to RDS

1. In the console search `RDS` → left menu **Databases** → open your primary DB instance.
2. Top-right **Actions** → **Create read replica**.
3. Pick the AZ/Region for the replica; a small instance size is fine for testing. Create.
4. Once created, the replica has its own **endpoint**. Point your app's "read-only query" connection string at this replica endpoint, and keep writes on the primary.
5. During a load test, watch: the primary's CPU drops noticeably and read requests are absorbed by the replica — read performance scaled horizontally.

```bash
# Check an RDS instance's status and role (primary or replica)
$ aws rds describe-db-instances \
    --db-instance-identifier <your-instance-name> \
    --query "DBInstances[].{Id:DBInstanceIdentifier,Role:ReadReplicaSourceDBInstanceIdentifier,Status:DBInstanceStatus}"
```

<Cost>

RDS/Aurora Read Replicas are **each a separately billed instance** — the more you run, the more it costs. DynamoDB instead bills on **read/write capacity and storage**, and in "On-Demand" mode costs almost nothing when idle. When you're done, remember to **delete the test replicas and DB instances**. A single RDS instance has Free Tier (`db.t3.micro`, limited hours), but replicas aren't covered, so deleting them right after is safest.

</Cost>

:::warning[🚑 Common real-world mistakes]
- **Using Read Replicas as high availability**: a replica is for "scaling reads", not auto-failover; for a dead primary to be covered automatically, that's **Multi-AZ** (see Domain 2).
- **App doesn't split reads from writes**: you add a replica but all traffic still hits the primary — pointless. Route read-only queries to the replica endpoint at the app/connection layer.
- **Expecting instant consistency on replicas**: a Read Replica uses **asynchronous replication**, so there can be brief lag (ms to seconds) — watch out for "write then immediately read it back" cases.
- **Forcing relational onto key-value workloads**: carts, sessions, leaderboards — huge-scale key-value lookups — are slow and costly in RDS; use DynamoDB instead.
:::

<Refs title="📚 Official docs & further reading">

- [AWS Docs: Amazon RDS User Guide](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Welcome.html)
- [Amazon RDS Read Replicas](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ReadRepl.html)
- [Amazon Aurora User Guide](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/CHAP_AuroraOverview.html)
- [Amazon DynamoDB Developer Guide](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html)
- [DynamoDB Global Tables](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GlobalTables.html)

</Refs>

## Next

- ⚡ Quick review: [Domain 3 Flashcards](./flashcards.md)
- ✍️ Test yourself: [Domain 3 Practice Questions](./quiz.md)
- 📖 Next page: [Caching](./caching.md)
