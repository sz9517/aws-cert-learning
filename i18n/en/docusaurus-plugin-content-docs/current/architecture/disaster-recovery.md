---
sidebar_position: 4
title: "Reference Architecture 4: Disaster Recovery"
---

# Reference Architecture 4: Disaster Recovery (DR)

> High availability (Multi-AZ) protects you from "one machine dying", but what if an **entire primary Region** goes down? This page pulls the services you've learned into a single architecture that can survive a Region-level disaster. Only two things really matter: **how long you can tolerate being down, and how much data you can tolerate losing** — then you pick a strategy that fits your budget.

## Two key metrics, in plain words

<Term en="Recovery Time Objective" desc="How long you can tolerate the system being unavailable after a disaster. A smaller RTO means downtime must be shorter.">RTO</Term> and <Term en="Recovery Point Objective" desc="How much data (in time) you can tolerate losing. A smaller RPO means less data can be lost.">RPO</Term> are the single most heavily tested pair of concepts here. One timeline makes it click:

```text
        ← RPO (looking back: how much data can be lost)   → RTO (looking forward: how fast to recover)
  ───────┬──────────────────┬──────────────────────┬────────→ time
   last replica/backup   💥 primary Region fails    service restored
```

- **RTO looks "forward"**: from the disaster to service being back up. The more a standby is ready to go, the shorter the RTO.
- **RPO looks "backward"**: everything between the disaster and the "last backup/replication" is lost. The more continuous the replication, the smaller the RPO.

<Analogy title="🎮 Everyday analogy: save files in a video game">

- **RPO** = "**how often you save**". Save every 5 minutes and, if the console crashes, you replay at most 5 minutes (lose 5 minutes of progress).
- **RTO** = "**how fast you can start playing again**" after a crash. Boot up in 30 seconds and continue = RTO 30 seconds; reinstall the game for 2 hours = RTO 2 hours.

Of course you'd love "lose almost nothing and resume instantly", but that costs more (more frequent saves plus better gear). DR strategy is simply the trade-off between those two and your budget.

</Analogy>

## The requirement: surviving a full primary-Region failure

<Scenario title="Real scenario: your boss asks 'what if all of Tokyo goes down?'">

Your whole system runs in the Tokyo Region. Your boss asks: "If Tokyo has a major incident (not one data center — the **entire Region**), how fast can we recover, and how many orders will we lose?"

That question is really about your **RTO and RPO**. What you do: (1) agree with the boss on "how long we can be down and how much we can lose", (2) continuously **replicate** core data to another Region, and (3) pick one of the four strategies below within budget, which decides "how ready the other Region needs to be in normal times".

Remember the baseline: Multi-AZ only protects against a single Availability Zone failing — it cannot save you from a Region-level disaster. **DR must be cross-Region.**

</Scenario>

## The four DR strategies (the core)

Ordered top to bottom from "cheapest but slowest" to "most expensive but fastest". The difference between them is essentially "**how ready the other Region is in normal times**":

| Strategy | RTO / RPO | Ongoing cost | How to implement | Best for |
| --- | --- | --- | --- | --- |
| **Backup & Restore** | Longest RTO & RPO (hours to days) | Lowest | Keep only backups/snapshots copied cross-Region; after a disaster rebuild from scratch with IaC and restore the data | Budget-first, can tolerate longer downtime |
| **Pilot Light** | Lower RTO & RPO (tens of minutes to hours) | Low | Core data replicates continuously and stays running (cross-Region RDS read replica / Aurora); compute sits switched off on standby and only starts on disaster | Critical data can't be lost; the rest can be spun up fast |
| **Warm Standby** | Low RTO & RPO (minutes) | Medium-high | Run a **scaled-down but always-on** full stack in another Region; scale it up and take over traffic on disaster | Production systems needing very short downtime |
| **Multi-Site Active/Active** | RTO & RPO near zero | Highest | Both Regions serve **at full capacity simultaneously**, with Route 53 distributing traffic and Aurora Global Database syncing across Regions | Can't go down; the strictest requirements |

The chart below shows the trade-off at a glance — the further down you go, the faster the recovery and the higher the cost:

```text
  cheap, slow                                           costly, fast
  ├──────────────┬──────────────┬──────────────┬──────────────┤
  Backup &       Pilot          Warm           Multi-Site
  Restore        Light          Standby         Active/Active

  readiness:   backups only → core running → full but small → both full-speed
  RTO/RPO:     hours~days   → tens min~hrs →    minutes    →   near zero
```

### Why four strategies instead of just picking one? (the trade-off, plainly)

You might think: "Why not just pick the fastest, sturdiest active/active and be done?" The catch is that **the standby Region keeps costing money in normal times too**. The four strategies are really four notches on one scale — money on one end, downtime-plus-data-loss on the other, and you can only slide toward the middle:

- **Why not everyone picks Multi-Site?** Active/active means **running two full-speed systems**, roughly doubling cost. An internal reporting system being down for 4 hours hurts no one, so paying active/active prices for it burns budget you never use.
- **Why not everyone picks Backup & Restore?** It is the cheapest, but the price is **rebuilding from scratch after a disaster** (spin up machines, deploy, restore data), with an RTO of hours to days. Payment or order-taking systems — where every minute down costs money — can never rely on it alone.
- **Pilot Light vs Warm Standby are often confused**: both keep **core data replicating continuously**; the difference is whether the compute layer runs in normal times. Pilot Light keeps compute **switched off on standby** (started only on disaster — cheaper, but takes tens of minutes to bring up); Warm Standby keeps a **scaled-down copy always running** (just scale it up on disaster — pricier, but takes over in minutes). In one line: **it comes down to "does compute burn money on standby or not".**

:::info[🔑 Why is each tier pricier than the one above?]
Stepping down a tier always means "**making the standby Region do a bit more in normal times**": from "just store backups" → "core database always running" → "a whole scaled-down stack always running" → "both Regions full-speed". The more it does in normal times, the less you have to scramble to build at disaster time (lower RTO/RPO) — but the higher the day-to-day bill. **You are pre-paying to shorten recovery time.**
:::

### Why must DR be cross-Region? And what is good about "just backups"?

**Why cross-Region is non-negotiable**: Multi-AZ spreads machines across different data centers within the same Region, so it survives "one data center loses power, one machine dies". But if the **entire Region** goes down from a disaster, network event, or large-scale failure, all your AZs are in the same boat. DR's imagined enemy is exactly "the whole Region disappears", so the standby resources **must live in another Region** — otherwise it is pointless.

**The pros and cons of "just copy backups to another Region"**: the cheapest approach replicates snapshots/backups to another Region (Backup & Restore). That does survive a Region-level failure at the lowest cost — **but it only solves "the data still exists", not "how fast can we serve again".** At disaster time all you hold is a pile of backup files; you still have to spin up machines, deploy, and restore on the spot, and service is fully down the whole time. Investing up into Pilot Light and above means "the data is there and the environment is already half-prepared" — you spend money to buy back RTO.

:::note[🧭 When NOT to over-invest in DR]
DR is not "pricier is better" — it is about **matching business value**. Common over-investment:

- **Internal tools, reports, dev/test environments** forced onto Warm Standby or active/active — these lose almost nothing being down for hours, so Backup & Restore is plenty.
- **One single top-tier DR for every system** — the right move is to **tier by system**: high-grade for payments/ordering, low-grade for edge features.
- **Setting RTO/RPO stricter than the business actually needs** — every extra hour shaved off RTO tends to raise cost in jumps, not linearly. First ask the business "how long can we really tolerate, how much can we really lose", then spend.

In one line: **buy the RTO/RPO the business truly needs first, and don't buy more.**
:::

:::tip[💡 Exam key point: matching the strategy at a glance]
- "**Lowest cost / limited budget**" and longer recovery is acceptable → **Backup & Restore**.
- "Core database runs small and always-on in the DR Region, everything else shut off to save money" = the signature description of **Pilot Light**.
- "A scaled-down copy always running in another Region, scaled up on disaster" = **Warm Standby**.
- "**Near-zero downtime / highest availability / RTO and RPO near zero**" → **Multi-Site Active/Active**.
:::

## Services used to land this across Regions

Actually building the four strategies relies on this handful of services again and again:

| Service / feature | What it does in DR | Common strategies |
| --- | --- | --- |
| **<Term en="S3 Cross-Region Replication" desc="Automatically replicates objects from one bucket to a bucket in another Region.">S3 Cross-Region Replication (CRR)</Term>** | Auto-replicates backups and static content to another Region to survive Region-level failure | The data foundation for all strategies |
| **RDS snapshot copy / cross-Region read replica** | Copy DB snapshots cross-Region, or keep a **read replica** continuously in sync in another Region and promote it on disaster | Pilot Light, Warm Standby |
| **<Term en="Aurora Global Database" desc="One primary Region writes; data replicates to secondary Regions with very low latency, and a secondary can be promoted quickly.">Aurora Global Database</Term>** | Low-latency cross-Region replication with second-level RPO; a secondary Region can take over quickly | Warm Standby, Multi-Site |
| **<Term en="Route 53 Failover Routing" desc="With health checks, automatically directs traffic to the DR Region when the primary is unhealthy.">Route 53 failover routing</Term>** | With health checks, automatically steers user traffic to the DR Region when the primary fails | Warm Standby, Multi-Site |
| **<Term en="Infrastructure as Code" desc="Define the whole environment as code in a template so it can be recreated in one step.">CloudFormation / IaC</Term>** | Define the whole environment as a template to **rebuild** the DR Region's resources in one step | Especially Backup & Restore |

:::info[🔑 One key idea: replication direction and failover]
Whether the DR Region can "catch" your workload hinges on whether **data has been continuously replicated there**. Backup & Restore merely copies backups over on a schedule (larger RPO); Pilot Light and above keep the database **continuously replicating** (smaller RPO). When you actually fail over, you promote the read replica to primary and use Route 53 to shift traffic across.
:::

## How to choose: lower RTO/RPO means stepping up to a pricier strategy

The logic is simple. First nail down the RTO and RPO the business can accept, then read down the table above:

- Only care about saving money, hours of downtime is fine → **Backup & Restore**.
- Data can't be lost (small RPO) but you can tolerate some downtime → **Pilot Light** (core replicates continuously, compute on standby).
- Downtime must be squeezed to minutes → **Warm Standby** (keep a scaled-down copy running in another Region).
- Can't afford even minutes of downtime, strictest requirements → **Multi-Site Active/Active** (fastest and most expensive).

:::note[🧭 A one-line decision mantra]
**The shorter the downtime and the less data loss you need (lower RTO/RPO), step up to the next pricier strategy; the tighter the budget, step back down to the next cheaper one.** The four strategies are just points you pick along the same "speed vs cost" line.
:::

## Common exam angles

<Scenario title="Exam practice: the two most common framings">

**Framing 1: "RTO of a few minutes, but limited budget — which one?"**

A few-minutes RTO already rules out the slowest Backup & Restore; but "limited budget" tells you not to jump straight to the priciest Multi-Site. The answer usually lands on **Warm Standby** — a scaled-down copy already running in another Region that scales up to take over within minutes, at lower cost than active/active.

**Framing 2: "RPO must be near zero — which one?"**

Near-zero RPO means "data essentially can't be lost", which relies on **continuous, near-real-time cross-Region replication**. For a relational database the standard answer is **Aurora Global Database** (second-level cross-Region replication); at the architecture level that maps to **Multi-Site Active/Active** or **Warm Standby**. Plain "scheduled backup" Backup & Restore never qualifies.

</Scenario>

:::tip[💡 How to read the question]
See **RTO** (how long you can be down) → the answer depends on "**how ready the standby architecture is**" (more complete standby, shorter RTO). See **RPO** (how much you can lose) → the answer depends on "**how frequent the replication/backup is**" (more continuous replication, smaller RPO). Map the question's keywords back onto these two axes, step to the matching strategy, and you'll rarely be wrong.
:::

:::warning[🚑 Common pitfalls]
- **Backups never tested for restore**: the classic hard lesson. You back up daily, then on disaster day discover the backup is corrupt, nobody knows how to restore it, and nobody ever measured how long a restore takes. **A backup you have never test-restored is as good as no backup.** Periodically run a real "bring the system up from backup" drill, and measure the actual RTO while you are at it.
- **Mixing up RTO and RPO**: they point opposite ways — **RTO looks forward (how fast to restore service); RPO looks backward (how much data can be lost)**. A question saying "data essentially cannot be lost" is about **RPO** (needs continuous replication, e.g. Aurora Global Database); one saying "must recover within minutes" is about **RTO** (needs a standby ready enough, e.g. Warm Standby). Swap them and you pick the wrong service.
- **Thinking Multi-AZ alone is DR**: Multi-AZ protects against a single Availability Zone — not a Region-level disaster. **DR resources must sit in another Region**, or when the primary Region dies your standby goes down with it.
- **Never rehearsing failover**: you assume "Route 53 will just switch, promoting the read replica is enough", then at crunch time find the health checks were misconfigured, promotion is manual, DNS cutover has TTL delay, and the app's connection string was never updated. **Failover must be rehearsed regularly (even schedule a game day)**, verifying every step for real — not left as a diagram.
:::

<Refs title="📚 Official docs & further reading">

- [AWS Whitepaper: Disaster Recovery Options in the Cloud](https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-options-in-the-cloud.html)
- [AWS Well-Architected Reliability Pillar](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html)
- [Amazon Aurora Global Database](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-global-database.html)

</Refs>

👉 Put it to the test: [the 65-question Full Mock Exam](../saa/exam-prep/mock-exam.md)
