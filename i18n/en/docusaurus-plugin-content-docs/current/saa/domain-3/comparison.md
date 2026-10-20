---
sidebar_position: 7.5
title: Service Comparison & Exam Cheat Sheet
---

# Domain 3 Service Comparison & Exam Cheat Sheet

> This page collects the **most easily confused** services in Domain 3 (high-performing architectures) into comparison tables — the most efficient thing to skim right before the exam. Each table is followed by a one-line "**How to pick on the exam**" tip: spot the keyword in the question stem and map it straight to the answer.

:::tip How to use this page
High-performance questions are almost always about "**selection trade-offs**": options that all solve the problem are placed together, and a qualifier like "highest performance / lowest latency / highest throughput / least operational overhead" forces you to choose. Remember the one cell each service "alone can do" — that is your decision point.
:::

## 1. EC2 vs Lambda vs Fargate (three ways to run compute)

| Item | EC2 | Lambda | Fargate |
|---|---|---|---|
| What you manage | Whole VM (OS, patching) | Nothing | Containers, no nodes |
| Billing | Per instance time | Per invocation + runtime ms | Per container vCPU/memory usage |
| Runtime limit | None | 15 minutes max per run | None |
| Best for | Long-running, steady load, full control | Short tasks, event-driven, bursty traffic | Containerized apps, no servers to manage |
| Cold start | None | Yes (first call after idle is slower) | Almost none |

**How to pick on the exam**: stem says "**no servers to manage / pay per use / short event-driven tasks**" → **Lambda**; "**need full OS control / long-running / special software**" → **EC2**; "**already containerized but do not want to manage EC2 nodes**" → **Fargate**.

## 2. EBS vs Instance Store vs EFS vs FSx (four storage types)

| Item | EBS | Instance Store | EFS | FSx |
|---|---|---|---|---|
| Type | Block (single attach) | Block (physically attached) | File system (NFS shared) | File system (SMB/Lustre) |
| Shared by many | No (io2 multi-attach to a few) | No | **Yes (many Linux at once)** | Yes |
| Survives stop | **Yes (persistent)** | ❌ Wiped (ephemeral) | Yes | Yes |
| Performance | gp3 balanced / io2 highest IOPS | **Very high IOPS (local)** | Auto-scaling throughput | Lustre very high throughput |
| Typical use | Boot volumes, databases | Scratch cache, temp fast disk | Shared Linux files | Windows file share / HPC |

**How to pick on the exam**: "**highest IOPS for a critical database**" → **io2 Block Express**; "**large sequential files, cheap throughput**" → **st1**; "**many Linux hosts sharing files**" → **EFS**; "**Windows SMB file share**" → **FSx for Windows**; "**HPC ultra-high-throughput scratch**" → **FSx for Lustre or Instance Store**; whenever "**data must survive a stop**" appears, **do not pick Instance Store**.

## 3. RDS vs Aurora vs DynamoDB (three databases)

| Item | RDS | Aurora | DynamoDB |
|---|---|---|---|
| Data model | Relational (SQL) | Relational (MySQL/PostgreSQL-compatible) | NoSQL (key-value / document) |
| Performance | Standard | **Several times RDS, storage auto-scales** | **Single-digit ms, near-unlimited scale** |
| Scaling reads | Read Replica | Read Replica (up to 15) | Auto-partitioning + DAX cache |
| Operational overhead | Managed | Managed (more automatic) | **Serverless** |
| Typical use | General relational apps | High-performance relational, enterprise | Massive-scale, low-latency key-value |

**How to pick on the exam**: "**need standard SQL / relational / managed**" → **RDS**; "**higher-performance relational than RDS, enterprise-grade**" → **Aurora**; "**massive scale, single-digit ms, serverless elasticity**" → **DynamoDB**; "**read traffic overwhelming the primary**" → add a **Read Replica**.

## 4. ElastiCache Redis vs Memcached vs DAX (caching)

| Item | Redis | Memcached | DAX |
|---|---|---|---|
| Data structures | Rich (sorted sets, leaderboards, Pub/Sub) | Simple key-value | DynamoDB item cache |
| Persistence/replication | **Yes** | No | Managed by the service |
| Multi-threaded | No | **Yes (easy to scale out)** | — |
| Purpose | General cache, sessions, leaderboards | General object cache | **Purpose-built for DynamoDB (microseconds)** |

**How to pick on the exam**: "**need persistence / replication / leaderboards / advanced structures**" → **Redis**; "**simple, multi-threaded object cache to scale out**" → **Memcached**; "**speed up DynamoDB reads to microseconds**" → **DAX** (not plain ElastiCache).

## 5. CloudFront vs Global Accelerator (global acceleration)

| Item | CloudFront | Global Accelerator |
|---|---|---|
| What it does | **Caches content** at edge locations | Speeds up the **connection path** (AWS backbone) |
| Protocol | HTTP/HTTPS (sites, video, APIs) | **Any TCP/UDP** (gaming, VoIP, IoT) |
| Static IP | No (gives a DNS name) | **Yes (anycast static IPs)** |
| Content caching | **Yes** | No |
| Typical use | Static/dynamic site acceleration, in front of S3 | Non-HTTP low latency, fixed-IP allow-lists |

**How to pick on the exam**: "**website / video / cacheable content to accelerate globally**" → **CloudFront**; "**non-HTTP TCP/UDP, needs fixed anycast IPs, no caching**" → **Global Accelerator**; "**S3 static site, faster and cheaper on transfer**" → **S3 + CloudFront**.

## 6. Kinesis Data Streams vs Firehose vs SQS (decoupling & streaming)

| Item | Kinesis Data Streams | Kinesis Firehose | SQS |
|---|---|---|---|
| Nature | Real-time streaming | Near-real-time loading | Message queue |
| Multiple consumers read same data | **Yes** | No (delivers to destination) | No (deleted after processing) |
| Replayable | **Yes (within retention)** | No | No |
| Scaling | Shards | Fully managed, automatic | Near-unlimited, automatic |
| Typical use | Real-time analytics, clickstream, many consumers | Auto-load streams into S3/Redshift | Task queue, absorbing spikes |

**How to pick on the exam**: "**real-time streaming, multiple consumers, replay/ordering**" → **Kinesis Data Streams**; "**auto-load streams into S3/Redshift, no code**" → **Firehose**; "**simple task queue, one-time consumption, absorb spikes**" → **SQS**.

---

- ⚡ Quick review: [Domain 3 Flashcards](./flashcards.md)
- ✍️ Test yourself: [Domain 3 Practice Questions](./quiz.md)
