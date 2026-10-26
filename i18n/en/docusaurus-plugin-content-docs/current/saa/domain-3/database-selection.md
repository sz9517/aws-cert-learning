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

## Step 1: how do you actually decide relational vs NoSQL?

Many people get stuck here: the three services really represent **two different worldviews**. The first cut in any selection is always "is my data relational or NoSQL" — get this wrong and everything downstream is wrong. The test is one sentence: **are your queries "flexible, impossible to fully predict" or "fixed, just a few known kinds"?**

<Analogy title="🗂️ Analogy: an all-purpose filing cabinet vs a vending machine">

- **Relational (RDS/Aurora) is like an "all-purpose filing cabinet"**: data is filed neatly into drawers (tables), and afterwards you can cross-reference it however you like — "find all female members who shopped in Taipei last month, bought product A, and also returned something" is a **flexible, multi-table-join query you thought up on the spot**, and it answers in one SQL statement. The price: at very large scale, that flexibility becomes a performance burden.
- **NoSQL (DynamoDB) is like a "vending machine"**: you insert a coin and press B3 (hand it a key), the item drops out with a "clunk" — **blazing fast, and never jams even with tens of thousands pressing at once**. But it only does "fetch-by-code" — you cannot tell the machine "give me all red items under 300 by top-ten sales"; that is not how it plays.

</Analogy>

**One decision table (your anchor for both the exam and real work):**

| Question to ask yourself | Leans relational (RDS/Aurora) | Leans NoSQL (DynamoDB) |
| --- | --- | --- |
| Query style | **Flexible queries**: conditions, reports, and cross-table joins you think of later | **Fixed access pattern**: you know up front "which key fetches which record" |
| Data relationships | Many related tables (orders to members to products) | Single primary-key lookups; few relations or flattened by design |
| Schema | Fixed columns, enforced consistency, strong transactional consistency | Flexible columns; each item can look different |
| Scale and latency | General to mid-large; hard to keep single-digit-ms at extreme scale | **Huge scale** while staying **single-digit-ms** |
| Transactions | A strength: multi-table ACID transactions are native | Supports transactions but with limits; not built for complex ones |

:::info[🔑 The single most important rule: think "access pattern" before choosing NoSQL]
Relational lets you "create tables first and figure out queries later"; **DynamoDB is the opposite — you must first nail down "how will I query this" (the access pattern) and design keys and indexes around it**. If you cannot yet say "what conditions I will query by", that itself is a strong signal: **you need relational flexibility, not DynamoDB**.
:::

## Step 2: why pick RDS vs Aurora vs DynamoDB?

Once you have decided relational vs NoSQL, drill down. Below, a fixed set of sections spells out **why it, pros, cons, and when not to use** for each service — exactly the judgment that scenario questions test.

### RDS: the "safe bet" for relational, standard, low-ops

- **Why it**: you already run an app on MySQL/PostgreSQL/Oracle/SQL Server and want it on the cloud without babysitting machines. RDS lets you move it over **almost unchanged**, with backups, patching, and Multi-AZ as checkboxes.
- **Pros**: widest compatibility (five engines), mature ecosystem and tooling, low learning curve, Free Tier for a single instance.
- **Cons**: storage must be **provisioned in advance**, a single DB's write throughput has a ceiling, vertical scaling (bigger instance) hits a limit, and failover is slower than Aurora.
- **When not to use**: you need very high throughput or auto-scaling storage (use Aurora); or it is genuinely a huge-scale key-value workload (use DynamoDB).

### Aurora: relational, but "faster, bigger, less worry"

- **Why it**: it **speaks the same SQL and is compatible with existing apps** like RDS, but AWS rewrote the storage layer — AWS claims ~5x MySQL and ~3x PostgreSQL throughput, **storage auto-scales to 128 TB**, 6 copies across 3 AZs, and failover is typically **within 30 seconds**.
- **Pros**: high performance, no manual storage expansion, fast recovery, supports **Aurora Serverless v2** (compute auto-scales with load, cost-effective for spiky traffic), and **Global Database** for cross-Region DR and low-latency reads.
- **Cons**: **pricier** than equivalent RDS; only MySQL/PostgreSQL compatible (no Oracle/SQL Server); still relational, so it does not solve the fundamental "huge-scale key-value" problem.
- **When not to use**: you are a small app with steady traffic — RDS is enough and cheaper; or you want NoSQL-style unlimited horizontal scaling (use DynamoDB).

:::info[🔑 The most common confusion: Aurora is not DynamoDB]
Aurora has a trendy name, so many assume it is "AWS's NoSQL" or "an advanced DynamoDB" — **completely wrong**. Aurora is a **relational database** (speaks SQL, has tables, can join); its rival is RDS, not DynamoDB. DynamoDB is a NoSQL key-value store — the two are **different worlds** and cannot substitute for each other. The exam loves this confusion.
:::

### DynamoDB: huge scale, fixed access, serverless elasticity

- **Why it**: when what you need is "**hand it a key, get the data back in single-digit milliseconds**", at a scale that may hit millions of requests per second with spiky traffic — relational gets crushed, while DynamoDB **auto-scales horizontally**, is virtually unlimited, and in On-Demand mode costs almost nothing when idle.
- **Pros**: serverless (no machines at all), steady latency, auto-scaling, **Global Tables** multi-Region active-active, pay-per-use billing.
- **Cons**: **no flexible querying** — ad-hoc queries across access patterns, complex joins, and aggregate reports are not its thing; schema design has a high bar (you must think through access patterns first); not suited to complex-transaction scenarios.
- **When not to use**: query conditions vary a lot, you need joins, or you need reporting/analytics (use relational or Redshift); or the data is actually small but you need flexibility (RDS is easier).

### How the scaling methods differ (remember in one line)

- **RDS**: mainly **vertical scaling** (bigger instance) plus Read Replicas for reads; write scaling has a ceiling.
- **Aurora**: storage **auto-scales horizontally**, reads via replicas, compute can flex with Serverless v2; but writes still go mainly to a single primary node.
- **DynamoDB**: **horizontal scaling by nature** — partitions automatically spread data and traffic across many nodes, with a practically invisible scale ceiling.

:::warning[🚑 Common pitfall: forcing relational to "scale horizontally"]
RDS/Aurora writes are **fundamentally vertical scaling** (bigger instance, single primary node), unlike DynamoDB which spreads writes across countless nodes by design. If your bottleneck is **write** volume too big for one DB, adding more Read Replicas will not help (replicas only offload **reads**). At that point you either re-architect with sharding (complex, error-prone) or you should have chosen DynamoDB in the first place. **Using relational as if it scaled horizontally is the most common dead end in database selection.**
:::

## It's not just these three: when ElastiCache / Redshift / others show up

Selection questions often throw in a scenario where the answer is "actually, not RDS/Aurora/DynamoDB", to test whether you can tell them apart. Remember these **keyword-to-service** mappings:

| Need keyword | Service to pick | Why |
| --- | --- | --- |
| **Ultra-low-latency cache, sessions, leaderboards, offload DB reads** | <Term en="Amazon ElastiCache" desc="AWS-managed in-memory cache supporting Redis/Memcached, microsecond latency, often placed in front of a database to absorb reads.">ElastiCache</Term> (Redis/Memcached) | In-memory cache, **microsecond** latency; sits in front of the DB to absorb hot reads |
| **Large historical data for analytics/reporting/OLAP, complex aggregations** | <Term en="Amazon Redshift" desc="AWS cloud data warehouse optimized for large-scale analytical (OLAP) queries, using columnar storage for complex aggregations.">Redshift</Term> | Data warehouse, columnar storage, optimized to **scan large data for analytics** (not real-time OLTP) |
| **Graph relationships: social graphs, recommendations, fraud detection** | Amazon Neptune | Graph database, built for "relationship traversal" |
| **Document-style JSON, MongoDB compatible** | Amazon DocumentDB | Document database, MongoDB compatible |
| **Time series: IoT sensors, monitoring metrics** | Amazon Timestream | Optimized for time-series data |

:::tip[💡 Exam key point: do not get locked onto the word "database"]
- See **"offload the database, ultra-low latency, cache sessions/leaderboards/hot products"** → **ElastiCache** (not adding Read Replicas, not switching to DynamoDB).
- See **"analytics, reporting, OLAP, complex aggregations over TB-PB of history"** → **Redshift** (not an OLTP transactional store like RDS/Aurora).
- Key distinction: **OLTP (online transactions, touching a few rows at a time) = RDS/Aurora/DynamoDB; OLAP (analytics, scanning huge volumes) = Redshift**.
:::

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

<Scenario title="Real scenario: same e-commerce site, three needs — which one for each?">

One e-commerce system, different modules that should really use **different databases** — this is the essence of selection:

1. **Orders, members, product catalog** (need transactional consistency, need cross-table joins for reports) → **relational**. Moderate traffic → **RDS**; if promotion throughput spikes and you want auto-scaling storage and fast failover → step up to **Aurora**.
2. **Shopping cart, user sessions, live leaderboards** (fixed access pattern, need single-digit-ms, potentially large scale) → **DynamoDB**.
3. **Home-page hot products, trending searches** (the same query hammered, want to offload DB reads) → put an **ElastiCache** cache in front; want a "past-year sales analytics report" → hand it to **Redshift**.

**Expected result**: with each module on the right tool, the transactional DB focuses on transactions, the key-value store absorbs huge-scale hotspots, the cache soaks up repeated reads, and the analytics store runs its big queries — nothing is forced to do what it is bad at, and the whole thing is both fast and cheap. That is what "no best, only most suitable" looks like in practice.

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

:::warning[🚑 Common pitfalls]
- **Using DynamoDB but then wanting complex joins / flexible queries**: DynamoDB is not built for "ad-hoc querying, cross-table joins, aggregate reports". The moment you find yourself constantly trying SQL-style flexible queries on it, it means the **selection was wrong** — you needed relational (or hand analytics to Redshift).
- **Assuming Aurora = DynamoDB**: Aurora is **relational** (SQL, tables, joins), and its rival is RDS; DynamoDB is a NoSQL key-value store. They are different worlds and cannot substitute for each other — do not be fooled by the name.
- **Forcing relational to scale horizontally**: RDS/Aurora **writes** are fundamentally vertical scaling (single primary node), so when writes overwhelm one DB, adding Read Replicas will not save you (replicas only scale reads). For massive write-scale, DynamoDB was the right call all along.
- **Choosing by "which one I know best"**: cramming everything into RDS because you can write SQL, or jumping on DynamoDB because it sounds trendy — selection must weigh **data model + access pattern + scale**, not familiarity. The cost of choosing wrong is rewriting everything later.
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
