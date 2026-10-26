---
sidebar_position: 6.5
title: "Migration & Hybrid: Snow, Storage Gateway, DataSync, DMS"
---

# Migration & Hybrid: Move Data to the Cloud, or Let On-Prem and Cloud Coexist

> When companies move to the cloud, the thing that usually gets stuck isn't the code — it's "**how do we move all this existing data and these databases up there**", or "**we still need the on-prem data center, but we'd like it to tap into cloud storage too**". This page covers the four groups of tools the exam loves to test, plus how to choose between them: the offline **Snow family**, hybrid storage with **Storage Gateway**, online file transfer with **DataSync**, and database migration with **DMS**.

:::note[💬 Reading tip]
Whenever you see a term with a <Term desc="Like this! Hover over any dotted term (tap on mobile) and a plain explanation pops up.">dotted underline</Term>, hover over it for a plain-language explanation. All terms are also collected in the [Glossary & Services](/glossary).
:::

## First, split into two scenarios

The first step in any migration question is recognizing which case the question is really about:

- **Migration (moving house)**: move on-prem data or databases **up to the cloud**; once it's done, it's done (though it may keep syncing). Figure out whether it's an **offline** move (physical device) or an **online** move (over the network).
- **Hybrid**: the on-prem data center **stays**, but needs to **coexist long-term** with the cloud, interoperate seamlessly, and let on-prem apps use cloud storage.

<Analogy title="📦 Analogy: three ways to move house">

Imagine moving a whole warehouse of stuff to a new home (the cloud):

- Too much stuff, the network is too slow → just rent a **truck**, load it up, and drive it over (**Snow family**, offline move).
- Not that much stuff, the network is fine → have a **courier deliver daily, and automatically send only what has changed** (**DataSync**, online move).
- You're not giving up the old place; you want to plug the old cabinets straight into the new warehouse as extra space → **Storage Gateway** (hybrid storage).
- What you're moving is a whole "**ledger system**" (a database), and you also want to switch to a different ledger format → **DMS** (plus the format-conversion tool, SCT).

</Analogy>

## Snow family: the "physical-drive courier" for offline bulk data

When the data is **TB to PB scale** and **bandwidth is limited or the network transfer would take months**, instead of waiting forever for an upload, you load the data into a physical device AWS ships to you, then **ship it back to AWS to upload**. That's the Snow family — the key word is **offline**.

| Device | Capacity tier | Plain-language role |
| --- | --- | --- |
| **Snowcone** | Small (a few TB) | Smallest, most portable; can go to the field and even do edge compute |
| **Snowball Edge** | Large (tens of TB and up) | The main choice; moves **large amounts of data** and can run compute on-site |
| **Snowmobile** | EB scale (a whole shipping-container truck) | For extreme scale; **retired** — mostly just historical background on the exam |

:::tip[💡 How to remember it]
The keywords for Snow are "**offline physical device + large data volume + limited bandwidth**". Whenever a question pairs "**PB-scale data**" with "**limited network bandwidth / upload would take weeks or months**", the answer is almost always **Snowball (Edge)**.
:::

#### Why pick it? Pros/cons? When not to use it?

- **Why it's the one**: when "data volume ÷ available bandwidth" works out to weeks or even months of transfer, rather than clogging your link and dragging down normal business traffic, you load the data into a physical device and let **logistics** replace **the network**. In essence, you trade a truck's cargo capacity for the bandwidth you lack.
- **Pros**: doesn't consume your internet bandwidth; the more data, the more cost-effective; devices have built-in **hardware encryption (AES-256)**; Snowball Edge can even **run compute / Lambda on the device** (great for factories, ships, or disconnected edge sites that process data before shipping it back).
- **Cons**: there's a **physical wait** (order, receive, load, ship back, AWS-side upload — usually measured in **days to weeks**); someone has to be **on-site to plug in and move** the device; not suitable for "I need the data in the cloud right now".
- **When not to use it**: when **bandwidth is actually sufficient** (do the math — a few hours to a day or two over the network) don't use Snow; that's DataSync's job. Also avoid it when you need **ongoing, long-term** sync (Snow is a one-time move, not a standing pipeline).

:::warning[🚑 Common pitfall: estimate "how long" before deciding offline vs online]
Many people see "lots of data" and reflexively pick Snow, but **whether you have the bandwidth** is the real deciding factor. Rough formula: **time (hours) ≈ data (GB) × 8 ÷ available bandwidth (Mbps) ÷ 3600**.
- Example: **50 TB** (≈ 51200 GB) over a **1 Gbps (1000 Mbps)** link → about **114 hours ≈ 5 days** (ideal; real life is longer) → this is actually fine for **DataSync**; no need to wait for a physical device.
- Example: **500 TB** over an ordinary **100 Mbps** commercial link → about **11000 hours ≈ 460 days** → now THIS is Snowball's job.
On the exam, don't just look at "is it big" — be able to quickly weigh "data volume vs bandwidth vs acceptable time" in your head.
:::

## Storage Gateway: let on-prem apps "use cloud storage seamlessly"

<Term en="Storage Gateway" desc="An on-prem gateway that lets on-prem apps use familiar interfaces (file, block, tape) to access AWS cloud storage.">Storage Gateway</Term> is the poster child for **hybrid storage**: install a gateway on-prem, on-prem apps keep using the familiar interfaces (file, block, tape), and the data actually lands in AWS cloud storage. It comes in three types:

- **File Gateway**: on-prem reads and writes over **NFS / SMB**, just like a normal network drive, while the data actually lives in **S3**. Great for extending file shares to the cloud.
- **Volume Gateway**: provides **iSCSI block** storage, backed up to S3 (as EBS snapshots).
  - **cached mode**: the primary data lives in the cloud; on-prem keeps only a cache of frequently used data (saves on-prem space).
  - **stored mode**: the primary data stays on-prem; the cloud holds an asynchronous backup (low latency, full copy kept locally).
- **Tape Gateway**: emulates a **virtual tape library (VTL)**, so existing backup software thinks it's still writing to **tape**, while the data actually goes to S3 / S3 Glacier. Used to **replace physical tape** backup workflows.

:::tip[💡 Exam key point]
See "on-prem **existing backup software / wants to replace physical tapes**, back up to the cloud" → **Tape Gateway**; see on-prem needing **NFS / SMB file** access to S3 → **File Gateway**; see a need for **iSCSI block** devices → **Volume Gateway**.
:::

#### Why pick it? Pros/cons? When not to use it?

- **Why it's the one**: the on-prem data center **isn't going away**, but you'd like to "tap into that nearly unlimited, cheap cloud storage too". Storage Gateway's value is that **on-prem apps don't change a single line of code** — they keep using the **familiar old interfaces** (NFS / SMB / iSCSI / tape) while the gateway quietly moves the data to S3 / Glacier behind the scenes. It's the bridge for "**cloud storage without changing existing systems**".
- **Pros**: **low-latency on-prem access** to hot data (via local cache); seamlessly gains the cloud's durability and unlimited capacity; tape workflows can be replaced with cloud **as-is**; natural off-site backup.
- **Cons**: you have to **deploy and operate a gateway** on-prem (a VM or physical appliance); performance depends on your **on-prem network and cache size**; it's a **long-term coexistence channel**, not something you tear down after one move.
- **When not to use it**: if you just want to **move files up once** (and on-prem won't need them afterward) → that's **DataSync**, don't stand up a Storage Gateway; if you're fully **cloud-native with no on-prem** to connect → just use S3 / EFS directly, no gateway needed.

## DataSync: the "bulk-file express" that's online and automated

<Term en="DataSync" desc="AWS's online data-transfer service that moves large numbers of files to S3 / EFS / FSx automatically, incrementally, and on a schedule.">DataSync</Term> takes the **online (over the network)** route and specializes in **automated bulk file transfer**:

- The source can be on-prem **NAS / file systems**; the destination can be **S3, EFS, FSx**, and more.
- **Incremental** transfer: the first run moves everything; after that it only moves **what has changed** — fast and cheap.
- Supports **scheduling**, automatic retries, and in-transit integrity verification; much faster than scripting the move yourself.
- Good for a **one-time online migration** or **ongoing periodic syncing**.

:::info[📌 How do I tell Snow from DataSync?]
Both move large amounts of data; the difference is **offline vs online**: enough bandwidth, can go over the network → **DataSync**; limited bandwidth, data so big a network transfer would take forever → **Snow (ship a drive offline)**.
:::

#### Why pick it? Pros/cons? When not to use it?

- **Why it's the one**: you have a big pile of on-prem files to move to S3 / EFS / FSx, **bandwidth is sufficient to go over the network**, but you don't want to hand-roll `rsync` / scripts, deal with reconnect retries, incremental diffs, and integrity checks yourself. DataSync **handles all of that**, and with an accelerated protocol it's often several times faster than hand-written scripts.
- **Pros**: **incremental sync** (only moves what changed); automatic retries and **in-transit integrity verification**; can be **scheduled** to run periodically; a single agent can reach roughly **10 Gbps** throughput; simple pay-per-data-moved pricing.
- **Cons**: **consumes internet bandwidth** (a big transfer can affect normal traffic — you can set a bandwidth throttle); you run a **DataSync agent** (VM) on-prem; ultimately limited by how much bandwidth you have.
- **When not to use it**: if bandwidth simply isn't enough and the data is so big a network transfer would take months → use **Snow**; if on-prem needs to **keep using it long-term as cloud storage** (rather than finishing a one-time move) → that's **Storage Gateway**.

<Scenario title="Hands-on scenario: use DataSync to sync an on-prem NAS to S3 on a schedule">

Goal: every night, sync the **changed** files on an on-prem NAS (NFS) to S3 without hurting daytime bandwidth. Rough flow and **expected results**:

1. Deploy a **DataSync agent** on-prem (VMware / Hyper-V / or EC2) → once started, the agent produces an **activation key**.
2. Use that key to **activate the agent** in the console → status showing **ONLINE** means DataSync can now drive the on-prem side.
3. Create two **locations**: the source (on-prem NFS — the agent plus the NFS path) and the destination (an S3 bucket).
4. Create a **task** with options: enable "transfer only data that has changed", enable "verify", and set a bandwidth limit (e.g. relaxed at night, throttled during the day).
5. Use an **EventBridge schedule** to trigger the task daily at 02:00.

```bash
# Manually start one transfer via CLI (to validate the setup)
aws datasync start-task-execution --task-arn arn:aws:datasync:ap-northeast-1:111122223333:task/task-0abc123

# Check this execution status (you will see LAUNCHING -> PREPARING -> TRANSFERRING -> VERIFYING -> SUCCESS)
aws datasync describe-task-execution \
  --task-execution-arn arn:aws:datasync:ap-northeast-1:111122223333:task/task-0abc123/execution/exec-0def456
```

**Expected result**: the first run moves **everything** and takes the longest; after that each run moves only **new / modified** files, and the execution summary shows numbers like `FilesTransferred` and `BytesTransferred`, ending at **SUCCESS**. In the S3 bucket you will see a directory structure matching the NAS.

</Scenario>

## DMS: database migration with near-zero downtime

<Term en="Database Migration Service" desc="AWS's database migration service; supports homogeneous and heterogeneous migrations, with continuous replication for near-zero downtime.">DMS (Database Migration Service)</Term> specializes in moving **databases**, and its hallmark is **near-zero downtime**:

- **Homogeneous migration**: source and destination are the **same engine** (e.g. Oracle → Oracle, MySQL → RDS MySQL); move it directly.
- **Heterogeneous migration**: source and destination are **different engines** (e.g. Oracle → Aurora); table schemas and stored-procedure syntax are incompatible, so you first use the **SCT (Schema Conversion Tool)** to convert the schema, then let DMS move the data.
- **Continuous replication (CDC)**: during migration the source database **keeps running**, and DMS keeps syncing new changes to the destination; it only stops at the moment of cutover, achieving a **near-zero-downtime migration**.

:::tip[💡 Exam key point]
When a question mentions "**changing the database engine**" (e.g. Oracle / SQL Server moving to Aurora / PostgreSQL) → the answer is **DMS + SCT**; same-engine move that must "**not interrupt service during migration**" → **DMS (continuous replication)**.
:::

#### Why pick it? Pros/cons? When not to use it?

- **Why it's the one**: a database isn't something you can just "copy the files over" — it's constantly being written to, so a plain export/import would **miss the changes made during migration**, or force a long downtime. DMS uses **CDC (change data capture)** to chase changes while it migrates, achieving **near-zero downtime**; paired with **SCT** it can also convert the schema across engines. It's the standard answer for "**move a database to the cloud / change engines**".
- **Pros**: **near-zero downtime** (CDC keeps syncing until the moment of cutover); supports both **homogeneous and heterogeneous** migrations; the source can be on-prem or another cloud's database; the source **keeps serving** during migration.
- **Cons**: a **heterogeneous** migration requires **converting the schema with SCT first**, and complex objects like stored procedures, triggers, and custom functions **often need manual rewrites** (SCT produces an assessment report flagging what it can't auto-convert); DMS moves the **data**, not all the logic objects for you.
- **When not to use it**: **same engine, same version** and you can tolerate brief downtime → that engine's **native backup/restore or snapshot** may be simpler; plain files rather than a database → that's DataSync / Storage Gateway, not DMS.

:::warning[🚑 Common pitfall: a heterogeneous migration with "DMS only, no SCT" gets stuck]
The exam's favorite trap: for a **Oracle → Aurora PostgreSQL** (engine-change) question, picking "migrate with DMS" alone is **incomplete** — different engines have **incompatible table schemas, data types, and stored-procedure syntax**, so you must **convert the schema with SCT first** (and handle the items SCT's report flags as non-auto-convertible), then let DMS load the data. Memory aid: **same engine needs only DMS; changing engines needs DMS + SCT**.
:::

<Scenario title="Hands-on scenario: near-zero-downtime migration of Oracle to Aurora PostgreSQL">

Goal: move an on-prem Oracle order database to Aurora PostgreSQL **without interrupting service before cutover**. Rough flow and **expected results**:

1. Use **SCT** to connect to the source Oracle and generate a **migration assessment report** → expect to see "X% auto-convertible, Y items need manual handling"; rewrite the stored procedures that can't be auto-converted accordingly.
2. SCT applies the converted **schema** to the target Aurora PostgreSQL.
3. Create a DMS **replication instance** (the worker that moves data), plus source and target **endpoints**, and **test the connection** for each → expect **successful**.
4. Create a **migration task** of type "**migrate existing data and replicate ongoing changes (full load + CDC)**".

```bash
# Start the migration task (full load + continuous replication)
aws dms start-replication-task \
  --replication-task-arn arn:aws:dms:ap-northeast-1:111122223333:task:ABCD1234 \
  --start-replication-task-type start-replication

# Watch task status and progress (check FullLoadProgressPercent and CDC latency)
aws dms describe-replication-tasks \
  --filters Name=replication-task-arn,Values=arn:aws:dms:ap-northeast-1:111122223333:task:ABCD1234
```

**Expected result**: the task first runs the **full load** (`FullLoadProgressPercent` climbs from 0 to 100), then enters **CDC** to keep syncing new orders to Aurora, with `CDCLatencySource/Target` staying very low (seconds). When traffic is low and latency is near 0, switch the application connection string to Aurora, stop the task, and the near-zero-downtime cutover is done.

</Scenario>

## Worth a mention: AWS Transfer Family

If on-prem teams or partners are used to transferring files over **SFTP / FTPS / FTP**, **AWS Transfer Family** provides **managed SFTP/FTPS/FTP endpoints**, with files landing directly in **S3** (or EFS) — no need to maintain your own file-transfer server. The exam occasionally frames this as "keep the existing SFTP workflow, but store files in S3".

## Decision table (pick the right tool at a glance)

| Your scenario | Choose this | Key reason |
| --- | --- | --- |
| Large data (TB–PB) + **limited bandwidth** + offline OK | **Snow (Snowball Edge)** | Network transfer takes too long; ship a physical device |
| On-prem data center **keeps using** cloud files / block / tape | **Storage Gateway** | Hybrid storage; on-prem interfaces plug into the cloud seamlessly |
| **Online** move / periodic sync of bulk files (NAS ↔ S3/EFS/FSx) | **DataSync** | Incremental, scheduled, automated, fast |
| Moving a **database** (especially **changing engines**) | **DMS (+ SCT)** | Handles homogeneous and heterogeneous; near-zero downtime |
| Keep an existing **SFTP / FTPS** workflow to S3 | **Transfer Family** | Managed file-transfer endpoint |

### One table: what each of the four solves, and when to use which

Line up all four and grill them with the same set of questions — it's the easiest way to remember the trade-offs:

| | **Snow family** | **Storage Gateway** | **DataSync** | **DMS** |
| --- | --- | --- | --- | --- |
| **Solves what** | Offline move of **bulk** data | On-prem **keeps using** cloud storage | Online **bulk sync** of files | **Database** migration (incl. heterogeneous) |
| **Offline / online** | Offline (ship a device) | Online (long-term channel) | Online (over the network) | Online (over the network) |
| **One-time / long-term** | One-time move | **Long-term coexistence** | One-time or periodic sync | One-time migration (tear down after cutover) |
| **What it moves** | Any files / objects | Files / block / tape | Files (NAS → S3/EFS/FSx) | Databases (tables, rows) |
| **Key phrase to spot** | "limited bandwidth + PB-scale" | "on-prem still needs it" / "replace tapes" | "periodic sync" / "online move of NAS" | "change engines" / "near-zero downtime" |
| **Common pairing** | Built-in encryption, edge compute | S3 / Glacier | EventBridge schedule | **SCT** (required when heterogeneous) |

**One-sentence selection mantra**: first ask "am I moving **files** or a **database**" — a database always points to **DMS** first; if it's files, ask "will on-prem **stop needing them after the move** or **keep using them long-term**" — long-term use is **Storage Gateway**, finish-and-done then ask "**is bandwidth enough**" — enough is **DataSync**, not enough is **Snow**.

## Real-world application: it's not just for the exam

<Scenario title="Real scenario: hitting all three migration types at once">

You take over a company's cloud project, and the boss drops three things on you: (1) there are **200TB** of historical videos in the data center to move to the cloud, and the company **only has an ordinary commercial internet link**; (2) the on-prem backup system **still uses physical tapes**, and they want to move to the cloud without changing the backup software; (3) an **Oracle** order database has to move to **Aurora**, and it **can't be down for long**.

Matching against the decision table: for (1), large data plus limited bandwidth → ship it offline with **Snowball Edge**; for (2), wanting to keep the backup software while replacing tapes → **Tape Gateway**; for (3), changing engines with minimal downtime → **DMS + SCT** with continuous replication. Each has a best answer — exactly the "match the scenario to the tool" the exam loves.

</Scenario>

## Common exam angles

| Question keywords | Correct answer |
| --- | --- |
| PB-scale data, insufficient bandwidth, upload would take months | **Snowball (Edge)** |
| On-prem backup to the cloud, **replace physical tapes**, keep existing backup software | **Tape Gateway** |
| **Periodically sync** on-prem **NFS / file systems** to S3 | **DataSync** |
| **Oracle to Aurora** (engine change, minimal downtime) | **DMS + SCT** |
| On-prem needs **NFS / SMB** access to S3 | **File Gateway** |

:::warning[🚑 Common pitfalls]
- **Enough bandwidth? Don't reflexively pick Snow**: seeing "lots of data" shouldn't trigger an automatic Snow pick — **first estimate the transfer time with "data ÷ bandwidth"**; if the network can finish in a few days, choose **DataSync**, because Snow still needs the physical device to ship back and forth and may actually be slower. The offline-vs-online dividing line is **bandwidth**, not the absolute data size.
- **DataSync vs Storage Gateway is the easiest mix-up**: both involve "on-prem files + S3", but the purpose differs — DataSync is about "**moving the files over**" (a one-time migration or periodic sync; once done, that job is over); Storage Gateway is about "**on-prem staying attached and continuously using the cloud as storage**" (hybrid coexistence that's never torn down). A prompt about "**migration / sync**" → DataSync; about "**on-prem still needs to keep using it / replace tapes**" → Storage Gateway.
- **A heterogeneous DMS migration always needs SCT**: for an **engine change** (like Oracle → Aurora), picking "migrate with DMS" alone is **wrong / incomplete** — the schema and syntax are incompatible, so **convert the schema with SCT first**, then let DMS move the data; only **same-engine** migrations skip SCT.
- **Know how to estimate migration time**: don't just say "a long time" by feel. Mentally run **time (hours) ≈ data (GB) × 8 ÷ bandwidth (Mbps) ÷ 3600**; this step is often the deciding factor for "DataSync or Snow", and when a question gives you numbers, it wants you to do the math.
:::

<Refs title="📚 Official docs & further reading">

- [AWS Snow Family](https://docs.aws.amazon.com/snowball/)
- [AWS Storage Gateway User Guide](https://docs.aws.amazon.com/storagegateway/latest/userguide/WhatIsStorageGateway.html)
- [AWS DataSync User Guide](https://docs.aws.amazon.com/datasync/latest/userguide/what-is-datasync.html)
- [AWS Database Migration Service (DMS)](https://docs.aws.amazon.com/dms/latest/userguide/Welcome.html)
- [AWS Schema Conversion Tool (SCT)](https://docs.aws.amazon.com/SchemaConversionTool/latest/userguide/CHAP_Welcome.html)
- [AWS Transfer Family](https://docs.aws.amazon.com/transfer/latest/userguide/what-is-aws-transfer-family.html)

</Refs>

## Next

- ⚡ Quick review: [Domain 2 Key Points / Flashcards](/saa/domain-2/flashcards)
- ✍️ Test yourself: [Domain 2 Practice Questions](/saa/domain-2/quiz)
- 📖 Next: [Database & Storage High Availability](/saa/domain-2/database-ha)
