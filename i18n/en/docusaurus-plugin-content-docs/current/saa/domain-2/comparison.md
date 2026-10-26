---
sidebar_position: 7.5
title: Service Comparison & Exam Cheat Sheet
---

# Domain 2 Service Comparison & Exam Cheat Sheet

> This page distills the **most easily confused** services in Domain 2 (Resilience / High Availability) into comparison tables for an efficient last-minute review. Each table ends with a one-line "**How to choose on the exam**" tip — when you see the keyword in a question stem, you can map straight to the answer.

:::tip[How to use this page]
HA questions are almost always about **trade-offs in selection**: options that all solve the problem are placed together, and a qualifier like "MOST cost-effective / MOST highly available / LEAST operational overhead" forces the choice. Remember the cell that only one service can do — that is the deciding point.
:::

## 1. ALB vs NLB vs GWLB (the three load balancers)

| Item | ALB | NLB | GWLB |
|---|---|---|---|
| Layer | Layer 7 (HTTP/HTTPS) | Layer 4 (TCP/UDP) | Layer 3 (IP) |
| Routing basis | By content (path, host, header) | By IP and port | Directs traffic to third-party network appliances |
| Performance / latency | Normal | **Very high performance, ultra-low latency** | Depends on the appliance |
| Static IP | No | **Yes (static / Elastic IP)** | — |
| Typical use | Web apps, microservices, path-based routing | High-performance TCP, static-IP whitelists | Chaining firewalls / IDS security appliances |

**How to choose on the exam**: route by **URL path / host name** → **ALB**; need **very high TCP performance** or a **static IP** → **NLB**; need to chain a **third-party firewall / packet-inspection appliance** into the path → **GWLB**.

## 2. SQS vs SNS vs Kinesis Data Streams (messaging / streaming)

| Item | Amazon SQS | Amazon SNS | Kinesis Data Streams |
|---|---|---|---|
| Model | Queue, **pull (poll)** | Publish/subscribe, **push** | Real-time streaming |
| Relationship | One-to-one (one consumer per message) | One-to-many (fan-out to subscribers) | One-to-many, multiple consumers can re-read |
| Retention | 4 days by default (up to 14) | None (gone once sent) | 24 hours by default (up to 365), replayable |
| Typical use | Buffering, decoupling, smoothing spikes | Broadcast notifications, fan-out to multiple SQS | Large-scale real-time analytics, replay |

**How to choose on the exam**: need **buffering, spike smoothing, backend processing at its own pace** → **SQS**; need to **notify several downstreams from one event** → **SNS** (often with multiple SQS for fan-out); need **large real-time data with replay / multiple consumers** → **Kinesis**.

## 3. SQS Standard vs FIFO queues

| Item | Standard queue | FIFO queue |
|---|---|---|
| Ordering | Best-effort, **not guaranteed** | **Strict first-in-first-out** |
| Delivery guarantee | At-least-once (possible duplicates) | **Exactly-once**, de-duplicated |
| Throughput | **Nearly unlimited** | Lower (high-throughput mode helps) |
| Typical use | General decoupling, throughput-first | Payments, orders where order/dedup matter |

**How to choose on the exam**: a stem stressing **strict ordering** or **no duplicate processing** → **FIFO**; only needing the **highest throughput** with ordering unimportant → **Standard**.

## 4. RDS Multi-AZ vs Read Replica vs Cross-Region Replication

| Item | Multi-AZ deployment | Read Replica | Cross-Region Replication / CRR |
|---|---|---|---|
| Main purpose | **High availability (automatic failover)** | **Read scaling** | **Disaster recovery / local reads** |
| Replication | Synchronous | Asynchronous | Asynchronous (cross-Region) |
| Readable normally | **No** (standby, serves no reads) | **Yes** (replica is readable) | Yes (replica is readable) |
| On primary failure | **Automatic** failover to standby | Does not take over automatically (manual promote) | Manual promote (for DR) |

**How to choose on the exam**: "**automatic failover** on primary failure, minimize downtime" → **Multi-AZ**; "too many **read-only queries** slowing the primary" → **Read Replica**; "**cross-Region disaster recovery**" → Cross-Region Replication. Common trap: a Multi-AZ standby **does not serve reads** in normal operation.

## 5. The four disaster-recovery strategies (RPO/RTO vs cost)

| Strategy | RTO / RPO | Ongoing cost | Description |
|---|---|---|---|
| Backup & Restore | Longest (hours+) | **Lowest** | Back up normally, restore only on disaster |
| Pilot Light | Longer | Low | Core (e.g. database) always on, the rest started on disaster |
| Warm Standby | Short (minutes) | Medium | A scaled-down version always runs in another Region, scales up on disaster |
| Multi-Site (Active/Active) | **Shortest (near zero)** | **Highest** | Multiple sites run at once, sharing traffic in real time |

**How to choose on the exam**: moving down the list, **RTO/RPO shrinks and cost rises**. Read the qualifier — "**lowest cost**, tolerate several hours" → Backup & Restore; "**near-zero downtime**, cost no object" → Multi-Site; the middle "recover in minutes without paying for full active/active" → Warm Standby.

## 6. Auto Scaling policies

| Policy | Trigger | When to use |
|---|---|---|
| Target Tracking | Keep a metric at a target (e.g. CPU 50%) | **Most common**, the default choice for autoscaling |
| Step Scaling | Adjust in steps by how far the metric is breached | When you need different sizes by severity |
| Simple Scaling | A single alarm triggers a fixed change, with cooldown | Older, less used |
| Scheduled Scaling | Pre-adjust capacity by **time** | Traffic that is **regular and predictable** (e.g. spikes every workday morning) |

**How to choose on the exam**: "auto-maintain performance by load" → **Target Tracking**; "traffic is **regular and predictable**, be ready before the peak" → **Scheduled Scaling**.

## 7. Route 53 routing policies

| Policy | Basis | Typical use |
|---|---|---|
| Simple | Fixed response | A single resource, no special needs |
| Weighted | Split by ratio | A/B testing, canary releases (e.g. 90%/10%) |
| Latency | Lowest network latency | Multi-Region services seeking **best performance** |
| Failover | Health checks | Active/passive **automatic failover** |
| Geolocation | User country / region | Local content by region, compliance restrictions |
| Multivalue | Return several healthy IPs | Basic load spreading + health checks |

**How to choose on the exam**: keyword mapping — "by ratio / canary" → Weighted; "**lowest latency**" → Latency; "**auto failover on a failed health check**" → Failover; "by **user country**" → Geolocation. Note that "lowest latency" is not the same as "geographically nearest" — do not pick the wrong one.

<Refs title="📚 Official docs & further reading">

- [Compare Elastic Load Balancing types](https://docs.aws.amazon.com/elasticloadbalancing/latest/userguide/how-elastic-load-balancing-works.html)
- [Route 53 routing policies](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-policy.html)
- [Disaster recovery strategies (AWS whitepaper)](https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-options-in-the-cloud.html)
- [Auto Scaling scaling policies](https://docs.aws.amazon.com/autoscaling/ec2/userguide/scale-your-group.html)

</Refs>
