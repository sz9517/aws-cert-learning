---
sidebar_position: 6
title: Backup & Disaster Recovery
---

# Backup & Disaster Recovery: get it all back even when the sky falls

> High availability (Multi-AZ) handles "one machine dies", but what if an **entire Region** hits a major earthquake or power outage? That's what backup and disaster recovery (DR) plans are for. This page teaches you two metrics to measure by, and four strategies to trade off "recovery speed" against "cost".

<Vocab title="📌 Jargon you'll see on this page (fine even if you've never touched AWS)">

- **Backup**: keeping a **separate copy** of your data so you can restore it if the original is corrupted or deleted by mistake.
- **Disaster Recovery (DR)**: the **whole plan** for bringing your system back up somewhere else when a **data-center- or Region-level** disaster strikes.
- **RPO (Recovery Point Objective)**: **how much data (in time) you can afford to lose**. RPO = 1 hour means, worst case, you lose the most recent 1 hour of data.
- **RTO (Recovery Time Objective)**: **how long you can afford to be down**. RTO = 2 hours means service must be back within 2 hours of a disaster.
- **Snapshot**: a point-in-time "**save file**" of a disk (EBS), used to restore or clone the disk.

</Vocab>

:::note[💬 Reading tip]
Hover over any <Term desc="Like this! Hover (tap on mobile) for a plain explanation.">dotted term</Term> for a plain-language explanation. Terms are also in the [Glossary & Services](../../glossary.md).
:::

## Why do disaster recovery at all? (Grasp the "why" before memorizing strategies)

Lots of people treat DR as "paying extra for insurance", cram the four strategies before the exam, and still can't say *why* you'd pick one. Get the "why" straight and the strategies stick on their own.

- **One Region-level disaster can wipe out a company.** It's not "just reboot the box". Picture an online store on its biggest sales day when the entire primary Region loses power for hours: orders stall, payments break, support is swamped. Studies estimate downtime of a critical system costs a mid-to-large company tens to hundreds of thousands of dollars *per hour* — never mind reputation and lost customers. DR exists to shield you from this "total loss" level of event.
- **High availability (Multi-AZ) does NOT cover this.** Multi-AZ spreads machines across different data centers *within the same Region*, so it survives "one data center loses power"; but if the **whole Region** goes (natural disaster, mass outage, cut undersea cable, a cascading misconfiguration), every Multi-AZ copy lives in that same Region and dies together. That's why DR's core move is **cross-Region** — putting your lifeline in another geographic location.
- **DR is fundamentally "how much money buys how fast a recovery, and how little data loss".** You can't spend infinitely, so you first quantify "how much data you can lose (RPO)" and "how long you can be down (RTO)", then pick a strategy that is *just enough* and that you can afford. That's the throughline of this whole page.

<Analogy title="🏢 Analogy: DR is like insuring your important data">

You wouldn't insure a $3 USB stick, but you'd find ways to keep several copies of "the one and only customer list" in different places. DR is the same: **the more important a system — the more it hurts when it's down — the more it's worth paying for fast recovery**; an unimportant test environment can just be rebuilt, no need to splurge. The question isn't "do DR or not", it's "what level each system deserves".

</Analogy>

## First, in one sentence: RPO vs RTO

This is the **most heavily tested** pair of concepts. One timeline makes it click:

```
        ← RPO (look back: how much data you can lose)   → RTO (look forward: how long to recover)
  ───────┬──────────────────┬──────────────────────────┬──────────→ time
     last backup         💥 disaster hits           service restored
```

- **RPO looks to the "past"**: the data between the disaster and the "last backup" is lost. **More frequent backups → smaller RPO (lose less).**
- **RTO looks to the "future"**: how long from disaster to service restored. **The more standby-ready your architecture, the shorter the RTO (less downtime).**

<Analogy title="🎮 Analogy: saving a video game">

- **RPO** = **how often you save**. Save every 5 minutes and a crash costs you at most 5 minutes of progress.
- **RTO** = **how long until you can play again** after a crash. Boot in 30 seconds = RTO 30 s; reinstall the game for 2 hours = RTO 2 h.

Of course you'd love "lose almost nothing AND instant restart", but that costs more (more frequent saves + better gear). DR strategy is choosing between these and your budget.

</Analogy>

## The four DR strategies (speed vs cost trade-off)

Ordered top-down from "cheapest but slowest" to "priciest but fastest":

| Strategy | In plain words | Standing cost | Recovery speed (RTO) | Good for |
| --- | --- | --- | --- | --- |
| **Backup & Restore** | Keep only backups; **rebuild from scratch** after a disaster | Lowest | Slowest (hours–days) | Budget-first, tolerant of longer downtime |
| **Pilot Light** | Core (e.g. database) runs **small and always-on** in another Region; the rest is started only on disaster | Low | Faster (tens of minutes–hours) | Critical data must be live; the rest spins up quickly |
| **Warm Standby** | A **scaled-down but always-running** full system in another Region, scaled up on disaster | Medium-high | Fast (minutes) | Production systems needing short downtime |
| **Multi-Site Active/Active** | Two Regions run **at full speed simultaneously**, both serving traffic | Highest | Near-zero downtime | Can't go down; the most demanding requirements |

:::tip[💡 Exam key point]
- Question stresses "**lowest cost / limited budget**" and tolerates longer recovery → **Backup & Restore**.
- Question wants "**near-zero downtime / highest availability / RTO near 0**" → **Multi-Site Active/Active** (then Warm Standby).
- You see **RPO** → it asks "**how much data can be lost**" → solved by **backup frequency / replication**.
- You see **RTO** → it asks "**how long can you be down**" → solved by **how standby-ready the architecture is**.
- "Core database runs small and always-on in the DR Region, everything else is off to save money" = the signature description of **Pilot Light**.
:::

### The four strategies one by one: why pick it, pros/cons, when NOT to use

The table above is a quick reference, but exams often ask "**why does this question want Pilot Light rather than Warm Standby**". Nail each strategy's signature trait and trade-off to answer precisely.

#### 1. Backup & Restore — cheapest, slowest

- **What it does**: nothing runs normally; you just back up data regularly (snapshots, AWS Backup) and **copy it to another Region**. After a disaster you start **from scratch** in the DR Region: boot machines, restore data, wire up networking, shift traffic.
- **Why pick it**: cost is basically just "snapshots sitting in S3" — the cheapest of the four. For systems where "being down for hours, even a day or two, is fine" (internal reports, non-realtime batch jobs, dev/test) it's plenty.
- **Pros**: lowest standing cost, simplest architecture, nearly zero ops.
- **Cons**: longest RTO (hours to days, depending on how much you must rebuild); everything is rebuilt "live", so error-prone — which makes **drills even more important**.
- **When NOT to use**: revenue-generating, customer-facing systems that lose money the moment they stop — don't trade hours of downtime for small savings.

#### 2. Pilot Light — keep only the "core" lit

- **What it does**: the name comes from a gas stove's **always-on small flame**. Normally you keep **only the most critical, hardest-to-rebuild part running small and long-term** in the DR Region — usually the **database** (continuously replicating data from primary). The application servers are **off** normally and started up quickly on disaster, then connect to that already-synced database.
- **Why pick it**: the database is the most time-consuming thing to rebuild and sync, so keeping it "always awake" removes the most painful part of recovery; the stateless app layer boots fast. Medium cost buys a clearly shorter RTO.
- **Pros**: data is near-live (small RPO); cheaper than Warm Standby (app layer is off normally).
- **Cons**: on disaster you still have to "bring up the app layer and scale it to production size", so RTO is still tens of minutes to hours; more complex than Backup & Restore.
- **When NOT to use**: systems needing "back in a few minutes" — app cold-start and scaling can't keep up; upgrade to Warm Standby.
- **Signature exam phrasing**: "**core database keeps syncing in the DR Region, everything else is off to save money**" = Pilot Light.

#### 3. Warm Standby — the whole thing runs, just scaled down

- **What it does**: the DR Region runs a **fully functional but scaled-down** system (e.g. 10 machines in prod, 1-2 here), **always running and receiving data**. On disaster there's no "boot up" — you just **scale it up/out and shift traffic over**.
- **Why pick it**: the key difference from Pilot Light is that **the app layer is alive too**, so there's no cold-start wait; recovery is only "scale up + shift traffic", pushing RTO down to minutes.
- **Pros**: short RTO (minutes); low switchover risk (it runs all the time, so the DR environment is validated daily just by being used).
- **Cons**: you keep paying for a "scaled-down full system" all the time — pricier than Pilot Light.
- **When NOT to use**: tight budget plus tolerance for tens of minutes down (fall back to Pilot Light); or the opposite — can't be down even a few minutes (step up to Multi-Site).

#### 4. Multi-Site Active/Active — both sides serve at full speed simultaneously

- **What it does**: two (or more) Regions **run at full scale and serve real traffic at the same time**, with data synced bidirectionally/near-instantly. When one Region fails, traffic auto-routes entirely to the other and users barely notice.
- **Why pick it**: this is the only level that achieves "RTO/RPO approaching 0" — because the "DR Region" was already serving production, there's no "switch-and-start" phase at all.
- **Pros**: near-zero downtime, near-zero data loss; splitting traffic across Regions normally also serves users closer to home.
- **Cons**: **most expensive** (two full-speed environments) and **most complex** (cross-Region data consistency, conflict resolution, traffic routing are all hard problems).
- **When NOT to use**: the vast majority of systems don't need this — don't force Active/Active just for appearances and burn budget and team energy where it isn't needed.
- **Signature exam phrasing**: "**no downtime allowed / highest availability / RTO near 0**" = Multi-Site (then Warm Standby).

:::info[🔑 One line to anchor it: the four strategies are four notches on the same axis]
From Backup & Restore → Pilot Light → Warm Standby → Multi-Site, the standing cost rises and the RTO/RPO shrink (more real-time) all the way along. You're not "picking the single best one" — you're picking the notch that is *just enough* for this system and that you can afford. The selection mantra: **first ask how much data you can lose (RPO) and how long you can be down (RTO), then look at budget, and move up to the first strategy that satisfies both** — if a cheaper one works, don't use a pricier one.
:::

## How it works (diagram)

<div className="flow">
  <div className="flow-node">Primary Region serving</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">💥 Region-level disaster</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Recover in DR Region per strategy</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Traffic shifts to DR Region</div>
</div>

*Diagram: the more "standby-ready" the strategy (toward Multi-Site), the shorter this recovery window (RTO) — but the more you pay during normal times.*

## The actual backup tools

- **EBS Snapshot**: a save file of an EBS disk, **stored in S3** (managed by AWS) and **incremental** — the first one is full, after that only "what changed" is stored, saving space and money.
- **AMI (Amazon Machine Image)**: packages a whole EC2 (OS + data) into an image, so you can launch an identical new machine in one click.
- **Cross-Region copy**: copying snapshots/backups **to another Region**, which is what actually protects against a "whole-Region" disaster — a backup in the same Region as the original dies with it.
- **AWS Backup**: a service that **centrally manages** all your backups, using schedules and policies to back up EBS, RDS, DynamoDB, EFS, and more — no need to configure each service separately.

## Real-world application: it's not just for the exam

<Scenario title="Real scenario: your boss asks 'what if the data center burns down?'">

All your system's data lives in the Tokyo Region. Your boss asks: "If something major takes out the entire Tokyo Region, how long until we recover? How much order data would we lose?" — that is literally asking your **RTO and RPO**. You need to: (1) snapshot databases and disks regularly, (2) **copy snapshots to another Region**, (3) pick a DR strategy to fit the budget. Below, start with the most basic EBS snapshot and cross-Region copy.

</Scenario>

### 🛠️ Hands-on: create an EBS snapshot and copy it to another Region

1. Console → search `EC2` → left menu **Elastic Block Store › Volumes**
2. Select the volume to back up → **Actions › Create snapshot** → add a description → Create
3. Left menu **Snapshots** → watch the new snapshot turn to `completed`
4. Select it → **Actions › Copy snapshot** → choose another **Destination Region** (e.g. Tokyo → Singapore) → Copy
5. Now even if the entire Tokyo Region fails, Singapore still has a copy to restore from

```bash
# Create a snapshot
$ aws ec2 create-snapshot --volume-id vol-0abc123 --description "db-backup"

# Copy the snapshot to another Region (the key step for off-site DR)
$ aws ec2 copy-snapshot --source-region ap-northeast-1 \
    --source-snapshot-id snap-0abc123 --region ap-southeast-1
```

**Expected result**: `create-snapshot` immediately returns a JSON blob with a new `SnapshotId` (like `snap-0abc123`) and `State` initially `pending`; a few minutes later run `aws ec2 describe-snapshots --snapshot-ids snap-0abc123` and once `State` is `completed` and `Progress` reaches `100%` it's done. `copy-snapshot` returns a **new** `SnapshotId` in the **destination Region** (different from the source); switch to the Singapore Region console under **Snapshots** and you'll see it there. The thing to verify: this snapshot really lives in **another Region**, so it's unaffected when the whole Tokyo Region goes down.

:::tip[💡 It only counts if you actually run a restore drill once]
Copying the backup is only half the job. **Actually restoring once** is how you learn whether it can be recovered: use the snapshot to "create a new volume, or launch a new EC2 directly", boot in and confirm the data is intact, the service comes up, and the runbook is correct. Put this restore drill **on the calendar to run regularly** (e.g. once a quarter) and record how long it takes from "declaring a disaster" to "service restored" — that measured time is your real RTO.
:::

<Cost>

**The more standby-ready the strategy, the bigger the normal-times bill**: Backup & Restore mostly pays only for "snapshots sitting in S3" (cheapest); Multi-Site keeps two full-speed environments running long-term (priciest). Snapshots are incremental and store only changes, so they're relatively cheap — but **cross-Region data transfer and storage in the other Region cost extra**. Don't skip cross-Region to save pennies — that leaves you with no DR capability at all.

</Cost>

:::warning[🚑 Common pitfalls]
- **Backing up but never testing a restore (the deadliest)**: the backup is corrupt, permissions are wrong, or nobody knows the restore steps, and you find out "it can't be recovered" only in a real disaster — **a backup you have never test-restored is as good as no backup**. Run restore drills regularly and record the measured recovery time.
- **Mixing up RPO and RTO**: the most common thing you'll get grilled on in exams and interviews. **RPO = how much "data" you can lose (looks to the past, driven by backup frequency); RTO = how long "service" can be down (looks to the future, driven by how real-time the architecture is)**. Mnemonic: the P in R**P**O is **Point (a point of data)**; the T in R**T**O is **Time (downtime)**.
- **Keeping snapshots in the same Region as the original**: when that Region goes down entirely, the backup goes with it. **DR must be cross-Region.**
- **Cross-Region but not cross-account**: if the account is compromised, credentials leak, or someone (or ransomware) deletes every snapshot in the account, in-account backups die together too. Important backups should be **copied to another AWS account** (or use AWS Backup Vault Lock / cross-account backup) so you can recover even from an insider mistake or a breach.
- **Unencrypted snapshots**: snapshots holding customer data or PII, if EBS encryption is off, expose the data in cleartext when copied to another Region/account — an audit and compliance (e.g. privacy law) problem. **Enable encryption on the source volume before snapshotting**; you can also encrypt at copy time with `copy-snapshot --encrypted --kms-key-id`, and note that **an encrypted snapshot cannot be reverted to unencrypted**.
- **Treating HA as DR**: Multi-AZ only shields against a "single data center" failure, not a "whole Region" disaster — plan them separately.
- **Setting RPO/RTO too strict without the budget**: demanding "zero loss, instant recovery" requires Multi-Site, the most expensive option — align on budget first.
:::

<Refs title="📚 Official docs & further reading">

- [AWS Docs: Disaster Recovery Options in the Cloud](https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-options-in-the-cloud.html)
- [Amazon EBS snapshots](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/EBSSnapshots.html)
- [AWS Backup Developer Guide](https://docs.aws.amazon.com/aws-backup/latest/devguide/whatisbackup.html)

</Refs>

## Next

- ⚡ Quick review: [Domain 2 Flashcards](./flashcards.md)
- ✍️ Test yourself: [Domain 2 Practice Questions](./quiz.md)
- 📖 Next page: [Database & Storage High Availability](./database-ha.md)
