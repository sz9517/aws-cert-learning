---
sidebar_position: 7
title: Database & Storage High Availability
---

# Database & Storage: keeping your *data* online forever

> Servers can be killed and restarted anytime — but **data cannot**. This page teaches you how to keep databases and file storage running and intact even when a data center goes down. It's the closing topic of Domain 2.

<Vocab title="📌 Jargon you'll see on this page (fine even if you've never touched AWS)">

- **RDS (Relational Database Service)**: a **managed relational database** on AWS (MySQL, PostgreSQL, SQL Server, etc.). It handles backups, patching, and standby for you — no need to run a database host yourself.
- **AZ (Availability Zone)**: **physically separate data centers** within one Region. If one AZ floods or loses power, another AZ is still alive.
- **Failover**: when the primary system dies, it **automatically switches** to a standby that takes over, nearly invisible to users.
- **Replica**: **another copy** of your data. By purpose it splits into "standby" and "read-offloading" types.

</Vocab>

:::note[💬 Reading tip]
Whenever you see a term with a <Term desc="Like this! Hover over any dotted term (tap on mobile) and a plain explanation pops up.">dotted underline</Term>, hover over it for a plain-language explanation. All terms are also collected in the [Glossary & Services](../../glossary.md).
:::

## In one sentence

Data high availability has two completely different goals, which the exam loves to mix up:
- **Afraid of going down (high availability)** → use **Multi-AZ**: keep a live synchronous standby in another data center; the moment the primary falls over, it switches automatically.
- **Reads too slow (performance / scaling)** → use a **Read Replica**: keep extra copies to share the "read" traffic.

<Analogy title="🏢 Analogy: think of a database as a restaurant's ledger">

- **Primary database** = the master ledger; the manager records entries in it daily (writes).
- **Multi-AZ standby** = a **live synchronous copy** in the safe of the shop next door. When this shop catches fire (AZ failure), that copy instantly becomes the master and keeps going — this is **high availability**, and the copy is not shown to customers in normal times.
- **Read Replica** = several photocopies of the ledger placed at each counter, so many customers can "look things up" (read) at once, easing the load on the master — this is **read scaling**, but it isn't guaranteed to be instant, nor will it automatically become the master.

</Analogy>

## Multi-AZ vs Read Replica: the most tested comparison

| Comparison | Multi-AZ standby | Read Replica |
| --- | --- | --- |
| **Primary purpose** | High availability / disaster recovery | Offload read traffic, boost performance |
| **Replication** | **Synchronous** (a write completes only when both sides succeed) | **Asynchronous** (slight lag) |
| **Serves reads?** | ❌ No reads normally; pure standby | ✅ Yes; the app routes reads to the replica |
| **On failure** | **Automatic** failover to the standby AZ | Does not take over automatically (but can be manually promoted to a standalone primary) |
| **Cross-Region?** | No (cross-AZ within the same Region) | ✅ Can be cross-Region (DR + reads closer to users) |

:::tip[💡 Exam key point]
- Question mentions "**improve availability / automatic failover / no downtime**" → choose **<Term en="Multi Availability Zone" desc="A live synchronous standby in another data center in the same Region; fails over automatically when the primary dies.">Multi-AZ</Term>**.
- Question mentions "**too much read traffic / reporting queries slow the DB / reduce load on the primary**" → choose a **<Term en="Read Replica" desc="A read-only copy of a database that shares query traffic; replicates asynchronously.">Read Replica</Term>**.
- **Multi-AZ does NOT offload reads**, and a Read Replica does **not guarantee high availability** — memorize these two sentences and you've locked in an easy point.
- File storage: **<Term en="Elastic File System" desc="AWS-managed shared file system that multiple EC2 instances can mount at once, across AZs.">EFS</Term> spans multiple AZs natively and can be mounted by many instances at once**; **<Term en="Elastic Block Store" desc="A block disk attached to a single EC2, bound to one AZ.">EBS</Term> is bound to a single AZ** and cannot be mounted across AZs. For cross-AZ shared files, choose EFS.
:::

## Deep dive: why are Multi-AZ and Read Replica "two different things"?

The exam loves to mix them up because both are "replicas sitting on another machine" — they look alike. But they **solve completely different problems**, like a "spare tire" versus "adding another traffic lane": one keeps you moving **when something breaks**, the other makes you run **smoother in normal times**.

### What problem does each one solve

- **Multi-AZ solves "afraid of going down"**: your database is a single point for the whole system. If its data center loses power, the hardware fails, or AWS performs low-level maintenance, the whole site falls over. Multi-AZ keeps a **synchronous** standby in **another AZ** — it quietly keeps up with every write but serves no traffic; the instant the primary fails, RDS promotes the standby. The goal is one word: **survive** (high availability).
- **Read Replica solves "reads too slow"**: when queries crush the database (reports, search, lots of users reading at once), what you need is not a standby but **more machines dedicated to reading**. Read Replicas are **asynchronous** copies; the app routes the "read-only" traffic to them, and the primary breathes easier. The goal here is also one phrase: **spread the load** (read scaling).

### The key differences at a glance

- **Synchronous vs asynchronous**: Multi-AZ is **synchronous** — a write isn't done until the standby has it too, so the standby is **always identical to the primary** and promotion loses no data. A Read Replica is **asynchronous** — the primary returns success first and the replica catches up later, so a replica may serve data that is **a few seconds stale** (this is "replication lag").
- **Serves traffic vs pure standby**: a Read Replica **works all the time** (serving reads); a Multi-AZ standby **serves no traffic at all** — you cannot connect to it, it just sits on standby. That's exactly why "use Multi-AZ to offload reads" is wrong — it isn't open for you to read.
- **Automatic takeover vs no automatic takeover**: when the primary dies, the Multi-AZ standby **automatically** becomes the primary within minutes; a Read Replica **does not** take over automatically — you must **manually** promote it into a standalone primary, after which it leaves the original replication relationship and becomes a brand-new database.

### When to use which? Can you use both?

- **Only afraid of going down, no read pressure** → just enable **Multi-AZ**.
- **No HA need, purely slow reads** (e.g. running reports in a dev/test environment) → just add a **Read Replica**.
- **Production that must both stay up AND is dragged down by reads** → **use both together!** This is the most common correct answer: Multi-AZ handles HA (a synchronous standby waiting in another AZ) while 1–N Read Replicas offload queries. They each do their own job and don't conflict. When a question stresses both "high availability" **and** "read performance", the answer is **both together** — don't pick just one.

:::info[🔑 One line to remember the difference]
**Multi-AZ is "insurance" (synchronous, no reads, automatic failover); a Read Replica is "extra hands" (asynchronous, reads only, no automatic takeover).** "No downtime" → Multi-AZ; "reads too slow" → Read Replica; both asked → use both.
:::

## How it works (diagram)

<div className="flow">
  <div className="flow-node">Primary DB (AZ-a)</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">AZ-a fails entirely</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">RDS auto-failover</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Standby promoted to primary (AZ-b)</div>
</div>

*Diagram: with Multi-AZ, when the primary fails RDS automatically promotes the standby to the new primary within minutes; the connection string (Endpoint) stays the same, so the application barely notices.*

## Other HA designs you should know

- **Aurora**: AWS's own MySQL/PostgreSQL-compatible database. Data is automatically stored as **2 copies in each of 3 AZs (6 copies total) within a single Region**, making it highly durable and available. When a question stresses "the most highly available relational database", it often points here. Its HA benefits go beyond traditional RDS Multi-AZ:
  - **Self-healing on failure**: as long as a majority of the 6 copies can still be read/written, the cluster keeps running, and Aurora repairs a damaged copy in the background — you do nothing.
  - **Faster failover**: traditional RDS Multi-AZ failover usually takes 1–2 minutes; because Aurora's storage layer is shared, it typically promotes a read replica to primary in **under 30 seconds**.
  - **Serves reads and HA at once**: an Aurora read replica **doubles as the HA standby** — it serves reads normally (read scaling) and can be automatically promoted when the primary fails (high availability). It effectively merges "Multi-AZ standby" and "Read Replica" into one, the biggest difference from traditional RDS.
  - **Unified endpoints**: writes go to the **Cluster Endpoint** (always points at the current primary) and reads go to the **Reader Endpoint** (automatically spreads traffic across the read replicas); endpoints stay the same after failover, so the app notices nothing.
- **DynamoDB**: fully managed NoSQL; data spans multiple AZs by default. When you need **cross-Region** availability and low latency near users, use **<Term en="Global Tables" desc="DynamoDB setting that automatically replicates bi-directionally across multiple Regions for low-latency reads/writes everywhere.">Global Tables</Term>**.
- **S3**: durability of **99.999999999% (11 nines)**, with data stored across AZs automatically; to keep a copy in another Region (compliance or off-site DR) use **<Term en="Cross-Region Replication" desc="S3 automatically copies objects to a bucket in another Region.">Cross-Region Replication (CRR)</Term>**.
- **EFS vs EBS**: multiple EC2 instances need to share the same files across AZs → **EFS**; a single machine's system/data disk → **EBS** (remember it's bound to one AZ).

## Real-world application: it's not just for the exam

<Scenario title="Real scenario: your e-commerce site crashes during a midnight sale">

During a big midnight sale, the data center (AZ) hosting your database suddenly loses power; the whole site fails to take orders and complaints flood in. The boss asks: "Why does one data center going down take the whole store with it?" — if RDS had **Multi-AZ** enabled, the standby would have taken over automatically within minutes and this disaster would never have happened. Separately, if daytime reporting queries keep dragging the database down, add a **Read Replica** to offload those queries. Let's turn Multi-AZ on below.

</Scenario>

### 🛠️ Hands-on: enable Multi-AZ high availability on RDS

1. Log in to the AWS console → search `RDS` → open the service → **Create database**
2. Choose engine **MySQL** (or PostgreSQL) → template **Dev/Test** (for practice, saves money)
3. In the "**Availability & durability**" section, choose **Create a standby instance (Multi-AZ deployment)**
4. Pick instance size `db.t3.micro` (Free Tier eligible), set credentials → **Create database**
5. Once created, open the DB details to see **Multi-AZ: Yes** and a fixed **Endpoint** — the app always connects to this endpoint and doesn't change after failover.
6. Want to test it? In the console choose **Actions › Reboot** on the DB, tick **Reboot with failover**, and watch it switch to the other AZ automatically.
   - **Expected result**: the DB status briefly shows "Rebooting", the console's "Availability Zone" field **changes from the original AZ** (e.g. `ap-northeast-1a`) **to another AZ** (e.g. `ap-northeast-1c`), while the **Endpoint string stays exactly the same**. The interruption is usually **60–120 seconds**, and `CloudWatch` logs a failover event. This is exactly how you see for yourself that "failover is automatic, but there is a brief interruption".

<Cost>

Because Multi-AZ keeps an extra standby running, it costs about **twice a single-AZ setup**. After practicing, be sure to **Delete** the test database, otherwise it keeps billing even when idle. A Read Replica is likewise "one more instance = one more bill". To really save, use single-AZ in dev and only enable Multi-AZ in production.

</Cost>

:::warning[🚑 Common traps]
- **Treating a Read Replica as a standby / fault tolerance**: it's asynchronous and won't fail over automatically; if the primary dies it **won't take over**. Its job is to "offload reads", not to "replace the primary". For HA and automatic failover, use Multi-AZ — don't confuse the two.
- **Assuming Multi-AZ can share read load**: a Multi-AZ standby **serves no traffic at all** in normal times — you can't connect to it or read from it; it just sits there synchronously standing by. To offload read traffic, add a **Read Replica**, not point your connection at the Multi-AZ standby (which you can't reach anyway).
- **Assuming failover is "zero downtime"**: failover is indeed **automatic**, but not instant or seamless — the DNS endpoint has to re-point to the new primary, typically a **60–120 second brief interruption** (Aurora is faster, within about 30 seconds). Your application must be able to **reconnect/retry automatically**; don't assume enabling Multi-AZ means not a single second of interruption.
- **Ignoring cross-Region Read Replica lag**: because a cross-Region replica must replicate across geographic distance, its **replication lag is noticeably larger than same-Region** (possibly seconds or more). Using it to read data that "must be the latest" (e.g. stock right after an order) will return stale values. Cross-Region replicas suit "reads closer to users, disaster recovery", not real-time queries with strict consistency needs.
- **Assuming EBS can be mounted across AZs**: EBS is locked to the AZ where it was created; an EC2 in another AZ simply can't attach it. For cross-AZ sharing, use EFS.
- **Thinking Multi-AZ alone is bulletproof**: Multi-AZ guards against "data-center-level" failure; it does not replace **backups** (which guard against accidental deletion and logical errors). Use both.
:::

<Refs title="📚 Official docs & further reading">

- [AWS Docs: RDS Multi-AZ deployments](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZ.html)
- [RDS Read Replicas](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ReadRepl.html)
- [Amazon EFS User Guide](https://docs.aws.amazon.com/efs/latest/ug/whatisefs.html)
- [S3 Cross-Region Replication](https://docs.aws.amazon.com/AmazonS3/latest/userguide/replication.html)

</Refs>

## Next

- ⚡ Quick review: [Domain 2 Flashcards](./flashcards.md)
- ✍️ Test yourself: [Domain 2 Practice Questions](./quiz.md)
- 📖 Next domain: [Domain 3: Design High-Performing Architectures](../domain-3/)
