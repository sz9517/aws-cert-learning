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

## DataSync: the "bulk-file express" that's online and automated

<Term en="DataSync" desc="AWS's online data-transfer service that moves large numbers of files to S3 / EFS / FSx automatically, incrementally, and on a schedule.">DataSync</Term> takes the **online (over the network)** route and specializes in **automated bulk file transfer**:

- The source can be on-prem **NAS / file systems**; the destination can be **S3, EFS, FSx**, and more.
- **Incremental** transfer: the first run moves everything; after that it only moves **what has changed** — fast and cheap.
- Supports **scheduling**, automatic retries, and in-transit integrity verification; much faster than scripting the move yourself.
- Good for a **one-time online migration** or **ongoing periodic syncing**.

:::info[📌 How do I tell Snow from DataSync?]
Both move large amounts of data; the difference is **offline vs online**: enough bandwidth, can go over the network → **DataSync**; limited bandwidth, data so big a network transfer would take forever → **Snow (ship a drive offline)**.
:::

## DMS: database migration with near-zero downtime

<Term en="Database Migration Service" desc="AWS's database migration service; supports homogeneous and heterogeneous migrations, with continuous replication for near-zero downtime.">DMS (Database Migration Service)</Term> specializes in moving **databases**, and its hallmark is **near-zero downtime**:

- **Homogeneous migration**: source and destination are the **same engine** (e.g. Oracle → Oracle, MySQL → RDS MySQL); move it directly.
- **Heterogeneous migration**: source and destination are **different engines** (e.g. Oracle → Aurora); table schemas and stored-procedure syntax are incompatible, so you first use the **SCT (Schema Conversion Tool)** to convert the schema, then let DMS move the data.
- **Continuous replication (CDC)**: during migration the source database **keeps running**, and DMS keeps syncing new changes to the destination; it only stops at the moment of cutover, achieving a **near-zero-downtime migration**.

:::tip[💡 Exam key point]
When a question mentions "**changing the database engine**" (e.g. Oracle / SQL Server moving to Aurora / PostgreSQL) → the answer is **DMS + SCT**; same-engine move that must "**not interrupt service during migration**" → **DMS (continuous replication)**.
:::

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

:::warning[🚑 Easy points of confusion]
- **Snow vs DataSync**: the difference is **offline vs online** (whether you have enough bandwidth).
- **DataSync vs Storage Gateway**: DataSync is about "**moving the files over**" (migration / sync); Storage Gateway is about "**on-prem keeps using** cloud storage long-term" (hybrid coexistence).
- **When does DMS need SCT**: only for **heterogeneous (engine change)** migrations; same-engine migrations don't need it.
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
