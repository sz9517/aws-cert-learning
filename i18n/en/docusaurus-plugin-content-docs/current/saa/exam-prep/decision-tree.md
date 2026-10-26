---
sidebar_position: 2
title: "Service Selection Decision Trees"
---

# Service Selection Decision Trees (Pick the Service from the Requirement)

This page turns the most commonly tested **selection questions** on SAA-C03 into a set of decision trees. In the exam, spot the requirement keywords in the question stem, then walk the tree **one question at a time** to quickly land on the right service, instead of reasoning from scratch.

:::tip[How to use this page]
Every tree works the same way: **first circle the requirement keywords in the stem** (Do you need OS control? No operations? Cross-Region?), then start at the top of the tree and ask yourself one yes/no question at each branch until you reach a leaf. When you study, read each path out loud as a single sentence ("need X and Y → pick Z") so it becomes a reflex on exam day.
:::

## Compute Selection

<Term en="Compute" desc="Compute services decide where your code actually runs" />. First ask: do you need to control the operating system yourself?

- Need full OS control, long-running workloads, a special environment? → **EC2**
- Event-driven, short tasks, pay per execution, least operations? → **Lambda**
- Using containers but don't want to manage the underlying nodes? → **Fargate**
- Using containers and need cluster orchestration? → **ECS** (AWS-native) or **EKS** (if you need Kubernetes)

```text
Compute need
├─ Control OS / long-running / special env ──────→ EC2
├─ Event-driven / short tasks / no ops ──────────→ Lambda
└─ Using containers?
   ├─ Don't want to manage nodes ───────────────→ Fargate
   └─ Need orchestration ───────────────────────→ ECS / EKS
```

## Storage Selection

First ask: are you storing objects, blocks, or shared files?

- Objects, massive unstructured files, static websites? → **S3**
- Block disk dedicated to a single EC2 instance? → **EBS**
- A shared file system for many Linux instances at once? → **EFS**
- Windows shared files over the SMB protocol? → **FSx for Windows File Server**
- HPC workloads needing extremely high throughput? → **FSx for Lustre**
- Just extremely low-latency scratch space (can disappear)? → **Instance Store**

```text
Storage need
├─ Objects / massive files ──────────────────────→ S3
├─ Block disk
│  ├─ Dedicated to a single EC2 ─────────────────→ EBS
│  └─ Ultra-low-latency scratch (can vanish) ────→ Instance Store
└─ Shared files
   ├─ Shared across many Linux hosts ────────────→ EFS
   ├─ Windows / SMB ────────────────────────────→ FSx for Windows
   └─ HPC high throughput ──────────────────────→ FSx for Lustre
```

## Database Selection

First ask: do you need relational (SQL) or non-relational (NoSQL)?

- Relational, transactional (<Term en="OLTP" desc="Online Transaction Processing: fast reads and writes of individual transactions" />), standard needs? → **RDS**
- Relational, but need higher performance, higher availability, or global reach? → **Aurora**
- NoSQL, key-value, massive scale, single-digit millisecond, serverless? → **DynamoDB**
- Need an in-memory cache to relieve database load? → **ElastiCache**
- A read cache that turns DynamoDB's milliseconds into microseconds? → **DAX**
- Data warehouse, <Term en="OLAP" desc="Online Analytical Processing: aggregating and analyzing large data sets for reporting" /> analytics and reporting? → **Redshift**

```text
Database need
├─ Relational (SQL)
│  ├─ Standard transactional (OLTP) ─────────────→ RDS
│  └─ Need higher performance / global ──────────→ Aurora
├─ NoSQL key-value / massive scale ──────────────→ DynamoDB
├─ Cache
│  ├─ General in-memory cache ───────────────────→ ElastiCache
│  └─ Microsecond cache just for DynamoDB ───────→ DAX
└─ Data warehouse / OLAP reporting ──────────────→ Redshift
```

## Messaging and Integration Selection

First ask: is this point-to-point buffering, one-to-many broadcast, real-time streaming, or rule-based event routing?

- Need to decouple, buffer, absorb spikes, each message consumed once? → **SQS**
- Need one-to-many, fan the same message out to many subscribers? → **SNS**
- Need real-time streaming, retention and replay, ordering? → **Kinesis**
- Need an event bus that routes events to different targets by rules? → **EventBridge**

```text
Messaging / integration need
├─ Decouple / buffer / absorb spikes (1-to-1) ───→ SQS
├─ One-to-many broadcast (fan-out) ──────────────→ SNS
├─ Real-time streaming (replay / ordering) ──────→ Kinesis
└─ Route events by rules ────────────────────────→ EventBridge
```

## Network Connectivity Selection

First ask: are you connecting to the internet, to AWS services, to another VPC, or to on-premises?

- A private subnet needs to initiate outbound internet access (updates, external APIs)? → **NAT Gateway**
- Need free, private access to S3/DynamoDB from inside a VPC? → **Gateway Endpoint**
- Two VPCs need a private connection? → **VPC Peering**
- Many VPCs or cross-account need central connectivity? → **Transit Gateway**
- On-premises needs a stable, low-latency, high-bandwidth dedicated line? → **Direct Connect**
- On-premises needs a cheap, quick-to-set-up encrypted tunnel (over the internet)? → **Site-to-Site VPN**

```text
Connectivity need
├─ To internet (private subnet going out) ───────→ NAT Gateway
├─ To AWS services (free S3/DynamoDB from VPC) ──→ Gateway Endpoint
├─ To another VPC
│  ├─ Just two VPCs ─────────────────────────────→ VPC Peering
│  └─ Many VPCs / cross-account ─────────────────→ Transit Gateway
└─ To on-premises (hybrid cloud)
   ├─ Stable low-latency dedicated line ─────────→ Direct Connect
   └─ Cheap quick encrypted tunnel ──────────────→ Site-to-Site VPN
```

## Content Delivery and Performance Selection

First ask: are you accelerating cacheable HTTP content, non-HTTP traffic, or simply too many reads?

- Cacheable HTTP/static content to accelerate globally? → **CloudFront**
- Non-HTTP (TCP/UDP), need a static IP, need global low latency? → **Global Accelerator**
- Database read traffic is too heavy and needs to be spread out? → **Read Replica**

```text
Delivery / performance need
├─ Cacheable HTTP global acceleration ───────────→ CloudFront
├─ Non-HTTP (TCP/UDP) static IP, global low lat. ─→ Global Accelerator
└─ Spread database reads ─────────────────────────→ Read Replica
```

:::info[Telling CloudFront and Global Accelerator apart]
See "cacheable, website, video, static content" and it's **CloudFront**; see "non-HTTP, gaming, needs a static (Anycast) IP, no caching" and it's **Global Accelerator**.
:::

## High Availability and Disaster Recovery Selection

First ask: are you surviving a single-AZ failure, or an entire Region failure?

- Survive a single-AZ failure and stay up within the same Region? → **Multi-AZ deployment**: ALB + Auto Scaling Group + RDS Multi-AZ
- Survive an entire Region failure? → Based on how strict your <Term en="RTO" desc="Recovery Time Objective: how much downtime you can accept" /> and <Term en="RPO" desc="Recovery Point Objective: how much data loss you can accept" /> are, pick a DR strategy from cheapest to most expensive:
  - RTO/RPO can be very relaxed, cheapest? → **Backup & Restore**
  - Need it faster, keep a minimal core? → **Pilot Light**
  - Need it even faster, a scaled-down environment always on standby? → **Warm Standby**
  - Near-zero downtime, near-zero data loss, most expensive? → **Multi-Site Active/Active**

```text
HA / DR need
├─ Survive single-AZ failure (same Region) ──────→ Multi-AZ + ALB + ASG + RDS Multi-AZ
└─ Survive whole Region failure (by RTO/RPO, cheap → expensive)
   ├─ Loosest RTO/RPO, cheapest ─────────────────→ Backup & Restore
   ├─ Faster ────────────────────────────────────→ Pilot Light
   ├─ Even faster (scaled-down standby) ──────────→ Warm Standby
   └─ Near-zero downtime, most expensive ─────────→ Multi-Site
```

## Migration Selection

First ask: are you moving bulk data, persistent on-prem storage, online file sync, or a database?

- Petabyte-scale data, insufficient bandwidth, too slow over the network? → **Snowball**
- On-premises wants ongoing use of cloud storage or to replace physical tapes? → **Storage Gateway**
- Need to sync large volumes of files to AWS continuously over the network? → **DataSync**
- Need to migrate a database (including heterogeneous engine changes)? → **DMS** (pair with **SCT** to convert schemas for heterogeneous migrations)

```text
Migration need
├─ PB-scale data + insufficient bandwidth ───────→ Snowball
├─ On-prem ongoing cloud storage / replace tape ─→ Storage Gateway
├─ Online bulk file sync ─────────────────────────→ DataSync
└─ Database migration
   ├─ Same engine ──────────────────────────────→ DMS
   └─ Heterogeneous (engine change) ────────────→ DMS + SCT
```

## Cost Selection

First ask: is the workload stable and long-running, interruptible batch, unknown access frequency, or long-term archive?

- Stable, predictable, long-running and want to save money? → **Reserved Instances / Savings Plans**
- Interruptible batch, fault-tolerant, stateless work that needs to be cheapest? → **Spot**
- Access frequency unknown or changing, don't want to move tiers manually? → **S3 Intelligent-Tiering**
- Long-term archive, almost never retrieved, slow retrieval acceptable? → **S3 Glacier Deep Archive**

```text
Cost need
├─ Stable long-running workload ─────────────────→ RI / Savings Plans
├─ Interruptible batch / fault-tolerant ─────────→ Spot
├─ Access frequency unknown or changing ─────────→ S3 Intelligent-Tiering
└─ Long-term archive, almost never retrieved ────→ S3 Glacier Deep Archive
```

## Security Selection

First ask: are you solving cross-account access, key management, secret rotation, or blocking attacks?

- Cross-account, need temporary credentials, don't want to spread long-term keys? → **STS AssumeRole**
- Need centralized management of encryption keys? → **KMS**
- Need to store secrets/credentials centrally and rotate them automatically? → **Secrets Manager**
- Need to block Layer 7 (application-layer) attacks (SQL injection, XSS)? → **WAF**
- Need to block DDoS attacks? → **Shield**

```text
Security need
├─ Cross-account temporary access ───────────────→ STS AssumeRole
├─ Centralized encryption key management ────────→ KMS
├─ Automatic secret / credential rotation ───────→ Secrets Manager
└─ Block attacks
   ├─ Layer 7 application attacks ────────────────→ WAF
   └─ DDoS ───────────────────────────────────────→ Shield
```

:::note[This page is just a round-up]
Decision trees are for **quickly locating a direction** in the exam. For each service's details, billing traps, and the head-to-head comparisons that trip people up, go back to the domain articles and the [exam cram notes](./cram.md). The real deciding point is always the **qualifier** in the stem (most cost-effective, least operational overhead, highly available, real-time...) — circle the qualifier first, then walk the tree.
:::

---

👉 Test yourself: [the 65-question Full Mock Exam](./mock-exam.md)
