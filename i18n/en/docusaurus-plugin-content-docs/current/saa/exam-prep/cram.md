---
sidebar_position: 1
title: Exam Cram Sheet
---

# Exam Cram Sheet (keyword quick reference)

This is your "**last mile**" cheat sheet for the day before the exam: you have finished all four domains, and this page distills the most-tested, most-confused points into a single page to skim before you walk in. There is only one way to use it — **spot the keyword in the question stem and map it straight to the answer direction**, no reasoning from scratch.

:::tip Exam mindset
SAA-C03 is almost all **scenario-based selection**: you get a business scenario and all four options often "technically work." What actually forces the choice is the **qualifier** in the stem (most cost-effective, least operational overhead, highly available, real-time...). Circle the qualifier first, then eliminate options — far more efficient than reading the whole scenario head-down.
:::

## One-line memory per domain + weighting

| Domain | Weight | One-line core |
|---|---|---|
| **D1 Design Secure Architectures** | **30%** | Least privilege, encrypt in transit and at rest, use roles not keys, layered network defense |
| **D2 Design Resilient (Highly Available) Architectures** | **26%** | Span multiple AZs to kill single points of failure, auto scale, decouple, self-heal |
| **D3 Design High-Performing Architectures** | **24%** | Right service for the job, add caching, scale horizontally, pick by load pattern |
| **D4 Design Cost-Optimized Architectures** | **18%** | Commit for discounts, move cold data down tiers, prefer managed and free endpoints |

:::info Weight equals time allocation
D1 Security has the highest weight (30%) and the best payoff — when reviewing, lock in IAM, encryption, and VPC security first so you do not drop points.
:::

## Qualifier → thinking map

This is the one table most worth memorizing. **When you see the word on the left, lean toward the direction on the right.**

| Qualifier in the stem | Lean toward this when you see it |
|---|---|
| **MOST cost-effective** | Pick cheap and managed: Serverless, Spot, move S3 to cold tiers, Gateway Endpoint (free), RI/Savings Plans |
| **LEAST operational overhead** | Go fully managed/serverless: Lambda, Fargate, Aurora Serverless, S3, SQS, managed services — stop babysitting servers |
| **HIGHLY available / fault-tolerant** | Multiple AZs, Multi-AZ, Auto Scaling, ELB, decoupling; eliminate single-AZ, single-instance answers first |
| **MOST secure / MOST restrictive** | Least privilege, roles over long-term keys, encryption (KMS), private subnets, tighten Security Group/NACL |
| **real-time / streaming** | Kinesis (replayable), stream processing; if it needs ordering or replay it is not SQS/SNS |
| **lowest latency** | Get close to users: CloudFront, Global Accelerator, edge locations, ElastiCache/DAX caching, nearest Region |
| **decouple** | SQS (queue) or SNS (fan-out); turn synchronous calls into asynchronous messages |
| **disaster recovery** | Cross-Region: Backup & Restore → Pilot Light → Warm Standby → Multi-Site, pick a pricier tier as RTO/RPO must drop lower |
| **serverless / no servers to manage** | Lambda, Fargate, S3, DynamoDB, Aurora Serverless, API Gateway |
| **global users / worldwide** | CloudFront, Route 53 latency routing, Global Accelerator, cross-Region replication |
| **spiky / unpredictable load** | On-demand/auto scaling: DynamoDB On-Demand, Aurora Serverless, Lambda, Auto Scaling |
| **can tolerate interruption** | Spot instances (cheapest for batch, fault-tolerant, stateless work) |
| **private connectivity to AWS** | VPC Endpoint (Gateway for S3/DynamoDB and free; Interface/PrivateLink for other services) |

## Most-confused service showdowns

For each pair, just remember the **one deciding line**.

**High availability vs read scaling**
- **Multi-AZ**: synchronous replica in another AZ, automatic failover if the primary dies — tests **high availability/fault tolerance**, does not offload read traffic.
- **Read Replica**: asynchronous replica that offloads **read** traffic — tests **scaling read performance**. See "improve availability" → Multi-AZ; see "too many reads, relieve the primary" → Read Replica.

**Load balancers: ALB vs NLB**
- **ALB**: Layer 7 (HTTP/HTTPS), routes by path/hostname — tests **web, microservices, content-based routing**.
- **NLB**: Layer 4 (TCP/UDP), ultra-high throughput, ultra-low latency, static IP support — tests **extreme performance, non-HTTP, millions of connections**.

**Messaging: SQS vs SNS vs Kinesis**
- **SQS**: queue, one-to-one consumption, decouple and buffer — tests **decoupling, peak shaving, async tasks**.
- **SNS**: pub/sub, one message **fans out** to many subscribers — tests **one-to-many broadcast notifications**.
- **Kinesis**: real-time stream, data can be **retained and replayed**, keeps order — tests **real-time analytics, streaming, replay needed**.

**VPC firewalls: Security Group vs NACL**
- **Security Group**: at the instance level, **stateful** (return traffic auto-allowed), allow rules only.
- **NACL**: at the subnet level, **stateless** (open inbound and outbound separately), can set deny rules. To "block a specific IP" use a NACL (SG cannot deny).

**Edge acceleration: CloudFront vs Global Accelerator**
- **CloudFront**: CDN, **caches** HTTP/static content at the edge — tests **cacheable websites/video distributed globally**.
- **Global Accelerator**: accelerates over the AWS backbone with static Anycast IPs, **no caching** — tests **non-HTTP (TCP/UDP), gaming, global low latency needing fixed IPs**.

**Compute: EC2 vs Lambda vs Fargate**
- **EC2**: full control of the OS and instance — tests **need control, long-running, special environments**.
- **Lambda**: serverless function, pay per execution, has a runtime limit — tests **event-driven, short tasks, least ops**.
- **Fargate**: serverless containers, no host to manage — tests **want containers but do not want to manage cluster nodes**.

**Databases: RDS vs Aurora vs DynamoDB**
- **RDS**: standard relational database (MySQL/PostgreSQL...) — tests **general relational needs**.
- **Aurora**: AWS high-performance relational engine, MySQL/PostgreSQL-compatible, higher performance and availability — tests **relational but needs more performance/availability**.
- **DynamoDB**: fully managed NoSQL, single-digit millisecond, unlimited scale — tests **NoSQL, key-value, massive scale, serverless**.

**Caching: ElastiCache Redis vs Memcached vs DAX**
- **Redis**: supports persistence, replication, sorting, Pub/Sub — tests **advanced features, highly available cache**.
- **Memcached**: simple, multi-threaded, easy to scale horizontally — tests **simple, shardable cache**.
- **DAX**: a cache built **specifically for DynamoDB**, turns milliseconds into microseconds — if the question mentions speeding up DynamoDB reads, pick it.

**Pricing models: On-Demand vs RI vs Savings Plans vs Spot**
- **On-Demand**: no commitment, most expensive, most flexible — short-term, temporary, uncertain.
- **RI (Reserved Instances)**: commit 1/3 years for a discount, tied to instance type/Region — steady, predictable load.
- **Savings Plans**: commit to a dollar amount for a discount, more flexible across type/Region — steady load but want to keep flexibility.
- **Spot**: up to about 90 percent off but **can be reclaimed** — interruptible batch, fault-tolerant work.

**S3 storage classes: Intelligent-Tiering vs Standard-IA vs Glacier Deep Archive**
- **Intelligent-Tiering**: access pattern **unknown or changing**, do not want to move data manually — it tiers for you automatically.
- **Standard-IA**: **infrequent access but needs it immediately**, access pattern is clear.
- **Glacier Deep Archive**: **long-term archive, rarely retrieved, cheapest**, fine with hours-long retrieval (compliance retention for years).

**Reaching out vs free access: NAT Gateway vs VPC Gateway Endpoint**
- **NAT Gateway**: lets a private subnet **reach the internet** (any service out on the internet), billed per hour + traffic.
- **VPC Gateway Endpoint**: **free** private access to **S3/DynamoDB** from inside a VPC, no NAT, no public internet. For "save NAT cost accessing S3," pick it.

**Cost tools: Cost Explorer vs Budgets vs CUR vs Cost Anomaly Detection**
- **Cost Explorer**: view trends, visualize, forecast.
- **Budgets**: set thresholds, **alert on overrun**.
- **CUR (Cost and Usage Report)**: the **finest** per-resource, hourly raw line items, drop in S3 and query with Athena.
- **Cost Anomaly Detection**: machine learning that **automatically catches anomalous** spikes.

**Security bonus points (one line each)**
- **STS AssumeRole / cross-account**: cross-account access works by **assuming a role** for temporary credentials — do not spread long-term keys.
- **KMS envelope encryption**: encrypt data with a data key, then encrypt the data key with the master key (CMK) — the standard way to encrypt large volumes of data.
- **WAF vs Shield**: **WAF** blocks Layer 7 application attacks (SQL injection, XSS, rule-based filtering); **Shield** blocks DDoS (Standard is free and automatic, Advanced is paid and enhanced).

## Exam-taking tactics

:::tip Read this one more time before you walk in
- **Grab the qualifier first, then read the options**: words like MOST/LEAST/MUST decide the correct answer — do not get lured by a pretty option that ignores the qualifier.
- **Elimination**: in a four-option question you can usually drop two obviously wrong ones first (violates HA, violates least privilege, wrong service for the job), then compare the remaining two on the qualifier.
- **Read multi-select questions carefully**: if it says "**Choose TWO**," select exactly two — no more, no less; too few or too many both count as wrong.
- **Time allocation**: 65 questions, 130 minutes, about **2 minutes per question**. Flag and skip hard ones first, bank the easy points, then come back to the hard ones at the end.
- **Passing score 720 / 1000**: you do not need every question right — secure what you know, do not agonize over individual hard ones, just clear the line overall.
- **Do not overthink**: pick the **most direct answer that fits AWS best practices** — usually not the most complex or fancy one.
:::

---

If you made it here, you have packed the decision logic for all four domains into your head. What is left is to **drill that "qualifier → answer" reflex until it is automatic** on practice questions. Take a breath — you are more ready than you think. Go do one last set!

👉 [Full Mock Exam (65 questions)](/saa/exam-prep/mock-exam)
