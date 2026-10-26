---
sidebar_position: 2
title: "Storage Performance: EBS / Instance Store / EFS & FSx"
---

# Storage Performance: "Do you need it fast, shared, or cheap?"

> This page helps you pick between the four storage services (EBS / Instance Store / EFS / FSx) by their performance characteristics — Domain 3's favorite selection question. The exam throws keywords at you, and you must map each one instantly to the right storage service.

<Vocab title="📌 Jargon you'll see on this page (fine even if you've never touched AWS)">

- **Volume**: "**a chunk of disk space**" for one server — resize it, attach it, and start storing data.
- **IOPS (Input/Output Operations Per Second)**: how many "**small operations a disk handles per second**", like how many book pages you can flip per second. Databases (lots of tiny reads/writes) care most about this.
- **Throughput**: how much "**data volume a disk can move per second (MB/s)**", like how many boxes you can carry per second. Reading large files in big chunks cares most about this.
- **Persistence**: whether data "**survives a shutdown**". Data that disappears is temporary; data that stays is persistent.
- **File Share**: **multiple servers mounting the same space at once** and seeing the same files, like a shared company network drive.

</Vocab>

:::note[💬 Reading tip]
Whenever you see a term with a <Term desc="Like this! Hover over any dotted term (tap on mobile) and a plain explanation pops up.">dotted underline</Term>, hover over it for a plain-language explanation. All terms are also collected in the [Glossary & Services](../../glossary.md).
:::

## Why do you need it? A story where you pick wrong first

Say you need to choose a disk for a database handling "tens of thousands of transactions per second". You casually grab a cheap, large HDD — and the database grinds to a halt, because HDDs are great at "moving one big chunk at a time" but terrible at "handling tons of tiny scattered reads/writes". Or you want **five EC2s to read the same batch of assets at once**, but you pick an EBS volume that only attaches to one machine — it simply won't mount.

Picking the wrong storage isn't about running out of space — it's about the **performance characteristics not matching the need**. That's why AWS gives you several storage types, each optimized for a different situation: **ultra-high IOPS** for databases, **cheap throughput** for big data, **shared access** for many machines, **temporary but blazing-fast** scratch space for compute. This page teaches you how to match each one.

## The four storage types in one sentence

**EBS** is a network disk attached to a single EC2 (persistent); **Instance Store** is a temporary disk physically bolted onto the host (blazing fast but gone on shutdown); **EFS** is a shared network file system many Linux EC2s mount at once; **FSx** is a managed file system for Windows or high-performance computing.

<Analogy title="🏢 Analogy: think of the four as different cabinets in an office">

- <Term en="Elastic Block Store" desc="Network block storage attached to a single EC2, persistent — the most common cloud disk.">EBS</Term> **= the drawer unit by your desk**: exclusively yours (one EC2), things stay put, and it resizes up or down.
- **Instance Store = the sticky-note area on your desk**: grab it instantly, super fast — but it's wiped the moment you turn off the lights (shutdown), so only drafts go there.
- <Term en="Elastic File System" desc="A shared NFS file system that many Linux EC2s can mount at once; capacity grows automatically.">EFS</Term> **= the whole-company file room**: many people (many EC2s) walk in and grab the same data at once, and the space grows by itself.
- <Term en="Amazon FSx" desc="AWS's managed file system service, offering Windows File Server and high-performance Lustre among others.">FSx</Term> **= a specialized file room for a specific department**: one for the Windows team (SMB share), one for the supercomputer (Lustre, extreme throughput).

</Analogy>

## Why pick which? The four storage types compared

You may know all the names, but "**why does this question want EFS and not EBS?**" is where people actually freeze in the exam. Split them apart with three questions first, then look at the pros/cons table.

**Three cuts that separate them:**

1. **Block vs shared file**: EBS and Instance Store are "**block storage**" — like a raw disk you attach to one machine, format, and use yourself. EFS and FSx are "**file systems**" — built so many machines can mount at once and see the same directory of files.
2. **Single vs multiple machines**: to have **many machines read/write the same data at once**, you cannot use a normal EBS (it serves one machine at a time); use EFS (Linux) or FSx (Windows/HPC).
3. **Volatile vs persistent**: Instance Store **vanishes the moment you stop the instance** (volatile); data on EBS/EFS/FSx **survives** a shutdown (persistent).

| Service | Class | How many machines | Persistence | Why pick it | Pros | Cons / when not to use |
| --- | --- | --- | --- | --- | --- | --- |
| **EBS** | Block | Single (usually) | Persistent | You need one EC2 to have a disk that keeps data and has tunable performance | Persistent, tunable IOPS/throughput, snapshot backups | No multi-machine sharing by default, tied to one AZ; do not use it for sharing |
| **Instance Store** | Block | Single | **Volatile** | You need "blazing fast but disposable" scratch (caches, intermediate files) | Highest latency/IOPS (physically on the host), no extra charge | **Gone on stop/terminate**; never put data you must keep |
| **EFS** | Shared file (NFS) | **Many Linux** | Persistent | You need a fleet of Linux EC2s to share one file set, with auto-growing capacity | Concurrent access, multi-AZ HA, elastic with no pre-provisioning | Linux only (NFS); for single-machine high IOPS it loses to EBS, do not use it as a single-machine disk |
| **FSx for Windows** | Shared file (SMB) | Many Windows | Persistent | You need native Windows file sharing with AD integration | Native SMB, AD/ACL support, fully managed | For Windows workloads; do not use it for HPC extreme throughput |
| **FSx for Lustre** | Shared file (HPC) | Many (HPC) | Persistent | You need an extreme-throughput scratch file system for HPC/ML that links to S3 | Extreme throughput/IOPS, seamless S3 dataset mount | Purpose-built for HPC/ML; do not use it for ordinary Windows file shares |

:::info[🔑 The single easiest judgment to confuse]
**"Block" or "file"** is the first fork: EBS/Instance Store are a **raw disk attached to one machine (block)**; EFS/FSx are **file systems built for many-machine sharing**. The moment a question says "**multiple EC2s accessing the same data at once**", immediately rule out EBS (unless it specifically mentions io1/io2 Multi-Attach in the same AZ) and think EFS/FSx.
:::

## How to pick EBS volume types (the most important table)

EBS itself splits into several "volume types", differing in whether they favor **IOPS (scattered small reads/writes)** or **throughput (big-chunk moves)**, and how pricey they are.

| Type | Backing | Favors | Best for | Plain English |
| --- | --- | --- | --- | --- |
| **gp3** (General Purpose SSD) | SSD | Balanced; IOPS/throughput tuned independently | Most workloads, boot volumes, general apps, small/medium databases | Default pick, great value |
| **io2 Block Express** (High-performance SSD) | SSD | Extreme IOPS, low latency | I/O-heavy production databases (Oracle/SAP), high durability needs | Most powerful and most expensive |
| **st1** (Throughput Optimized HDD) | HDD | High throughput, sequential access | Big data, log processing, data warehouses, large sequential files | Cheap, moves large volumes well |
| **sc1** (Cold HDD) | HDD | Cheapest, rarely accessed | Cold data you rarely touch, archival | Cheapest, slowest |

<Term en="General Purpose SSD gp3" desc="EBS general-purpose SSD whose IOPS and throughput can be tuned independently; the default choice for most cases.">gp3</Term> is the "when in doubt, pick this" balanced option; only truly I/O-heavy databases step up to <Term en="Provisioned IOPS SSD io2 Block Express" desc="EBS's top-tier SSD, delivering extreme IOPS and ultra-low latency for critical databases.">io2 Block Express</Term>. Meanwhile <Term en="Throughput Optimized HDD st1" desc="EBS throughput-optimized HDD, great at large sequential reads/writes and cheap, suited for big data and logs.">st1</Term> and **sc1** are HDDs — cheap and great at "moving one big chunk at a time", but **don't use them for databases** (scattered small I/O performs terribly).

**Two questions pick the right EBS type:**

1. **SSD or HDD?** Look at the shape of your I/O — "lots of scattered small reads/writes" (databases, boot volumes, general apps) needs **SSD (gp3/io2)**; "read/write one big chunk at a time" (big-data scans, logs, backups) is most economical on **HDD (st1/sc1)**. Get this layer wrong and no amount of tuning saves you later (HDD IOPS is inherently low).
2. **Pay extra for peak performance/durability?** If yes, go **io2 Block Express** (highest IOPS, lowest latency, highest durability, but priciest); if not, **gp3** (best value, baseline performance included free). Same idea on the HDD side: **st1** for frequent scans, cheaper **sc1** for cold data you rarely touch.

:::info[🔑 Why gp3 is the default pick (not the older gp2)]
gp2's performance is **tied to capacity** — to get more IOPS you must buy a bigger volume, often paying for space you never use. gp3 **decouples IOPS/throughput from capacity**, so you can "keep capacity small and add IOPS on its own", making gp3 usually **cheaper and more flexible** at the same performance. When a question says "raise IOPS without being forced to grow the volume", the answer is almost always gp3.
:::

:::tip[💡 Exam key point]
Match the keyword straight to the answer — nearly free points:
- Question mentions **highest IOPS production database, mission-critical, ultra-low latency** → **io2 Block Express**
- Question mentions **large sequential reads/writes, big data, logs, cheap throughput** → **st1**
- Question mentions **rarely accessed, archival, cheapest possible disk** → **sc1**
- Question mentions **multiple EC2s (Linux) sharing the same files at once** → **EFS**
- Question mentions **Windows file share, SMB protocol, Active Directory support** → **FSx for Windows File Server**
- Question mentions **HPC, machine-learning training, extreme-throughput scratch space** → **FSx for Lustre** (or **Instance Store** as scratch)
- Question mentions **data "must survive a shutdown"** → never pick **Instance Store** (it disappears on stop)
:::

## Shared and temporary: EFS, FSx, Instance Store

EBS above is "one disk attached to one machine". But many situations need **multiple machines together** or **fast-but-not-persistent** storage — that's where these three come in.

- **Instance Store**: the disk is **physically attached** to the EC2's host machine, so IOPS and latency are extreme; the downside is it lives and dies with the instance — **stop or terminate the instance and the data is gone**. Use it only as scratch (caches, temp files, intermediate compute data).
- **EFS (Elastic File System)**: an <Term en="Network File System" desc="A file-sharing protocol common on Linux, letting many machines mount the same file system.">NFS</Term> shared file system where **many Linux EC2s can mount the same data at once**. Capacity grows as you store, no pre-provisioning — ideal for a fleet of web servers sharing assets, or a content management system.
- **FSx**: a family of managed "specialized file systems"; two show up most on the exam:
  - **FSx for Windows File Server**: native <Term en="Server Message Block" desc="A file-sharing protocol common in Windows environments.">SMB</Term> file shares, integrates with Active Directory, for Windows workloads.
  - **FSx for Lustre**: an **extreme-throughput** file system built for <Term en="High Performance Computing" desc="High-performance computing that processes work in parallel across many compute nodes, e.g. simulation, genomics, ML training.">HPC</Term>, machine learning, and large-scale analytics — and it links seamlessly to S3.

## Selection flow (diagram)

<div className="flow">
  <div className="flow-node">Need multiple machines to share at once?</div>
  <div className="flow-arrow">→ Yes (Linux)</div>
  <div className="flow-node">EFS</div>
</div>

<div className="flow">
  <div className="flow-node">Shared + Windows / HPC?</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">FSx (Windows or Lustre)</div>
</div>

<div className="flow">
  <div className="flow-node">Single machine, must persist?</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">EBS (pick gp3 / io2 / st1 / sc1 by IOPS/throughput)</div>
</div>

<div className="flow">
  <div className="flow-node">Just need it fast, OK to lose on shutdown?</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Instance Store (scratch)</div>
</div>

*Diagram: first ask "shared or not", then "persistent or not", and only then pick an EBS volume type by IOPS or throughput.*

## Real-world application: it's not just for the exam

<Scenario title="Real scenario: the database floods you with latency alerts at midnight, and your boss says 'fix it'">

Your orders database sits on a **gp3** volume — fine normally, but during a sale with tens of thousands of transactions per second, latency spikes. You check monitoring: IOPS has hit the gp3 ceiling, and the disk is the bottleneck. Two options: buy more IOPS for gp3, or upgrade to **io2 Block Express** for steadier extreme IOPS and low latency. Meanwhile you notice the fleet of web servers each stores a duplicate copy of the same assets — they could instead mount one shared **EFS**, saving space and easing maintenance. Below we walk through tuning EBS performance.

</Scenario>

### 🛠️ Hands-on: raise IOPS and throughput on an EBS volume

1. In the console search `EC2` → left menu **Volumes** → select the database's volume.
2. **Actions** → **Modify Volume**.
3. Confirm the type is `gp3`; raise **IOPS** above the default 3000 (gp3 maxes at 16000), and **Throughput** above 125 MB/s (up to 1000 MB/s). The beauty of gp3 is that **the two scale independently** — you don't have to buy a bigger volume just to get a bit more IOPS.
4. If your needs far exceed gp3 (e.g. 64000+ IOPS), create a new volume as `io2` instead; larger capacity allows higher IOPS.
5. Save, then check monitoring to see latency drop.

```bash
# Tune a gp3 volume to 10000 IOPS and 500 MB/s throughput
$ aws ec2 modify-volume \
    --volume-id vol-xxxxxxxx \
    --volume-type gp3 \
    --iops 10000 \
    --throughput 500
```

**Expected result**: the command returns `ModificationState` as `modifying`, which soon becomes `optimizing` and then `completed`. gp3 changes **need no detach and cause no downtime**; your IOPS ceiling jumps right away in monitoring and latency falls.

<Scenario title="Real scenario: a web-server fleet each stores a duplicate of the same assets, and you want to share">

You have **4 Linux EC2s**, each with its own EBS volume holding the same batch of website images and uploads; one change means syncing four machines, which is painful. You want everyone to "mount one shared copy". The keyword here is "**multiple Linux machines sharing at once**", so the answer is **EFS**, not EBS (EBS serves one machine at a time).

1. In the console search `EFS` → **Create file system**, pick your VPC.
2. On **each** EC2, install the NFS client and mount the same EFS.

```bash
# Mount the same EFS file system on every Linux EC2
$ sudo yum install -y amazon-efs-utils
$ sudo mkdir -p /mnt/shared
$ sudo mount -t efs fs-xxxxxxxx:/ /mnt/shared
$ df -h | grep shared        # confirm the mount succeeded
```

**Expected result**: all four machines see **the same directory** at `/mnt/shared` — write a file on A and B/C/D see it instantly. From now you maintain one copy, and capacity grows as you store with no pre-provisioning. Had you used EBS, the 2nd machine simply **fails to attach** (the volume is already taken by the 1st), which is exactly why "many-machine sharing needs EFS".

</Scenario>

<Cost>

**EBS is billed on "provisioned capacity + any extra IOPS/throughput you buy"**: gp3's baseline 3000 IOPS and 125 MB/s are included free, and only extra is charged — so gp3 is usually cheaper than the older gp2. **io2 is the most expensive** (you pay for extreme performance); the **HDDs st1/sc1 are the cheapest**. **EFS/FSx are billed by usage**, and EFS can auto-move rarely used files to a cheaper tier via lifecycle policy. When done practicing, remember to **delete test volumes and file systems** — EBS snapshots also keep accruing charges.

</Cost>

:::warning[🚑 Common pitfalls]
- **Putting important data on the volatile Instance Store**: this is the most painful one — Instance Store is **wiped whole the moment you stop or terminate the instance** (a reboot can also land you on a fresh host and clear it). Use it only for cache/scratch/recomputable intermediate files. Keep data must live on **EBS/EFS/FSx**. Expected result if you get this wrong: one maintenance or scaling event stops the instance and the data **does not go to any recycle bin and cannot be recovered**.
- **Locking EBS into a single Availability Zone (AZ)**: an EBS volume exists only in **the AZ it was created in** and cannot attach to an EC2 in another AZ. When designing for high availability, locking the only copy of data into one AZ means an AZ failure takes everything down. To cross AZs: use an **EBS snapshot** (stored at the Region level) to recreate the volume in another AZ, or switch to the natively multi-AZ **EFS**.
- **Using EFS as a single-machine disk**: EFS shines at "many-machine sharing", but it is accessed over the network (NFS), so its **single-machine latency and peak IOPS trail a locally attached EBS**. If you have one machine chasing very high single-machine IOPS (e.g. a single-node database), EFS is slower and pricier — use **EBS gp3/io2** instead.
- **Confusing FSx for Windows with FSx for Lustre**: both are called FSx but serve completely different jobs — **Windows File Server** is **SMB file sharing + AD integration** for Windows; **Lustre** is an **extreme-throughput** scratch file system for **HPC/machine learning** that links to S3. See "Windows/SMB/AD" pick Windows; see "HPC/ML/extreme throughput/link an S3 dataset" pick Lustre — do not swap them.
- **Running a database on HDD (st1/sc1)**: scattered small I/O performs terribly — always use SSD (gp3/io2) for databases.
- **Assuming EBS can attach to many machines at once**: a normal EBS attaches to one at a time; for shared access use EFS (Linux) or FSx (Windows). (Note: io1/io2 Multi-Attach is an exception, and limited to one AZ.)
- **Mounting EFS for Windows**: EFS is NFS, for Linux; Windows SMB shares need FSx for Windows.
:::

<Refs title="📚 Official docs & further reading">

- [AWS Docs: Amazon EBS volume types](https://docs.aws.amazon.com/ebs/latest/userguide/ebs-volume-types.html)
- [Amazon EC2 instance store](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/InstanceStorage.html)
- [Amazon EFS User Guide](https://docs.aws.amazon.com/efs/latest/ug/whatisefs.html)
- [Amazon FSx overview](https://aws.amazon.com/fsx/)
- [AWS storage service selection guide](https://docs.aws.amazon.com/decision-guides/latest/storage-on-aws-how-to-choose/choosing-aws-storage-service.html)

</Refs>

## Next

- ⚡ Quick review: [Domain 3 Flashcards](./flashcards.md)
- ✍️ Test yourself: [Domain 3 Practice Questions](./quiz.md)
- 📖 Next page: [Database Selection](./database-selection.md)
