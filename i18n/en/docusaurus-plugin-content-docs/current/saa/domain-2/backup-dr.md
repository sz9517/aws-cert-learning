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

<Cost>

**The more standby-ready the strategy, the bigger the normal-times bill**: Backup & Restore mostly pays only for "snapshots sitting in S3" (cheapest); Multi-Site keeps two full-speed environments running long-term (priciest). Snapshots are incremental and store only changes, so they're relatively cheap — but **cross-Region data transfer and storage in the other Region cost extra**. Don't skip cross-Region to save pennies — that leaves you with no DR capability at all.

</Cost>

:::warning[🚑 Common real-world mistakes]
- **Backing up but never testing a restore**: the backup is corrupt, or nobody knows the restore steps, and you find out "it can't be recovered" only in a real disaster. **Always run restore drills regularly.**
- **Keeping snapshots in the same Region as the original**: when that Region goes down entirely, the backup goes with it. **DR must be cross-Region.**
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
