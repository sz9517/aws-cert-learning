---
sidebar_position: 1
title: High Availability & Availability Zones
---

# High Availability: keep running even when one machine dies

> This is the foundation of Domain 2. Once you understand AWS's geography (Region / AZ / Edge), load balancing, auto scaling, and redundancy all click into place.

<Vocab title="📌 Jargon you'll see on this page (fine even if you've never touched AWS)">

- **Region**: a full set of data centers AWS builds in **one geographic location**, e.g. "Tokyo", "Singapore", "US East (N. Virginia)". Whichever Region you deploy to is where your data lives.
- **Availability Zone (AZ)**: a group of **physically isolated data centers** within a Region (usually 3 or more). If one AZ floods or loses power, the others are unaffected.
- **Edge Location**: small **points of presence** spread across the globe, close to users, used for content caching (CloudFront) to speed things up — not for running your servers.
- **SPOF (Single Point of Failure)**: the one component where "**if it breaks, the whole service stops**". The goal of high availability is to eliminate it.

</Vocab>

:::note[💬 Reading tip]
Whenever you see a term with a <Term desc="Like this! Hover over any dotted term (tap on mobile) and a plain explanation pops up.">dotted underline</Term>, hover over it for a plain-language explanation. All terms are also collected in the [Glossary & Services](../../glossary.md).
:::

## High availability in one sentence

**High Availability (HA)** means: **design a system that keeps serving even when one machine dies**. The core of it is a single idea — **don't put all your eggs in one basket** — and on AWS, that "basket" is the **Availability Zone (AZ)**.

<Analogy title="🍔 Analogy: think of AWS as a restaurant chain">

- **Region** = a **city** (e.g. "Taipei"). You decide to operate in Taipei, so ingredients, customers, and operations are all in Taipei.
- **Availability Zone (AZ)** = **separate branches in the same city, each with its own power and water**. If the Xinyi branch loses power, the Daan branch keeps serving.
- **Edge Location** = a **pickup locker on the street corner**, closest to customers, holding only popular items (cache) — not a kitchen.

Put your kitchen (servers) in only the Xinyi branch → one power outage stops everything. Put kitchens in both Xinyi and Daan (across AZs) → if one goes down, the other takes over. That's high availability.

</Analogy>

## Region vs AZ vs Edge: a three-tier geography

| Tier | What it is | How many | What you use it for |
| --- | --- | --- | --- |
| **Region** | A full set of data centers in one geographic area | Dozens worldwide | Pick one close to users and compliant with regulations |
| **AZ** | Physically isolated data centers within a Region | Usually 3+ per Region | **Deploy across multiple AZs** to achieve HA |
| **Edge Location** | Caching points of presence worldwide | Hundreds | Use CloudFront to cache content closest to users |

:::tip[💡 Exam key point]
- When a question says "**Highly Available**" or "**tolerate a single data-center failure**" → the answer is always to **deploy resources across multiple AZs** (Multi-AZ).
- **Deploying to a single AZ** = NOT highly available; it's a common wrong-answer choice.
- When a question stresses "**global users, reduce latency**" → the direction is **multiple Regions** or **CloudFront (Edge)**, not more AZs.
- AZs are connected by **low-latency private links**, so synchronous cross-AZ replication (e.g. database Multi-AZ) is feasible and common.
:::

## How it works (diagram)

<div className="flow">
  <div className="flow-node">User request</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Load balancer</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Server in AZ-a</div>
  <div className="flow-arrow">＋</div>
  <div className="flow-node">Server in AZ-b</div>
</div>

*Diagram: the same service runs in two AZs at once. If AZ-a fails entirely, traffic shifts automatically to AZ-b and users barely notice.*

## In plain words again: why must you span multiple AZs?

<Analogy title="🔌 Just how dangerous is a single point of failure? Think of a power strip at home">

Imagine every appliance in your home — fridge, computer, router — is plugged into **one single power strip**. The moment that strip burns out, everything loses power at once. That power strip is your **SPOF (single point of failure)**: when it breaks, everything behind it goes down, no matter how many appliances you own.

Putting all your services in one AZ is exactly like plugging every appliance into one strip. If that AZ loses power (or its network drops, or the whole building goes into maintenance), **all your EC2 instances go down together, no matter how many you run**. Spanning AZs means splitting your appliances across **two strips fed by different breaker boxes**: if one burns out, the other still holds.

</Analogy>

The point is not "how many machines you run", but "will these machines **die together**". The essence of high availability is: **find every link in the chain where "if it breaks, everything stops", and make it at least two copies, spread across different AZs**. Common hidden SPOFs include a single-instance database, a NAT Gateway in only one AZ, and a single cache node — easy to overlook, yet just as capable of taking down the whole system as a single EC2.

## Don't confuse: HA, Fault Tolerance, Disaster Recovery

| Term | In plain words | Example |
| --- | --- | --- |
| **High Availability (HA)** | Recovers **quickly and automatically**, allows a very brief interruption | Across 2 AZs; one fails, the other takes over |
| **Fault Tolerance** | **No interruption at all**, highest cost | Multiple full copies running simultaneously, zero downtime |
| **Disaster Recovery (DR)** | A **recovery plan** for a Region-level disaster | Cross-Region redundancy (see [Backup & Disaster Recovery](./backup-dr.md)) |

### How do they differ? Read them through "how long down, how much lost"

These three terms are constantly mixed together on the exam. The difference comes down to **how long an interruption is allowed** and **how big a disaster it fights**:

- **High Availability (HA)** answers: "**If one component breaks, can the service hold up automatically with almost no interruption?**" It tolerates a **very brief** failover window (e.g. a database Multi-AZ failover usually takes 1-2 minutes), and fights failures at the **single-AZ / single-instance** level. How: run across multiple AZs within one Region, put a load balancer in front, enable Multi-AZ on the database.
- **Fault Tolerance** raises the bar further: "**Not even that 1-2 minute interruption is allowed; users must notice nothing at all.**" It requires **multiple full copies running at the same time**, at the highest cost. In plain words, HA is "get back up right after falling", fault tolerance is "never let you fall".
- **Disaster Recovery (DR)** is a different level entirely: it fights events like "**the entire Region is gone**" (natural disaster, large-scale outage), relying on **cross-Region** redundancy and a recovery plan. The two key metrics for DR are <Term en="Recovery Time Objective" desc="How quickly the service must recover after a disaster. Shorter is more expensive.">RTO (tolerable recovery time)</Term> and <Term en="Recovery Point Objective" desc="How much data loss is acceptable after a disaster. Shorter is more expensive.">RPO (tolerable data loss)</Term>.

:::info[🔑 One line to remember the boundary between the three]
**HA / Fault Tolerance** handle failures "**within one Region**" (spanning AZs solves them); **DR** handles "**the whole Region going down**" (must span Regions). On the exam, "**tolerate a single-AZ failure**" points to HA / Multi-AZ; "**a natural disaster hits the whole region**" or "**RTO / RPO**" points to DR / cross-Region.
:::

## Trade-off: Multi-AZ vs Multi-Region — when should you upgrade?

Spanning AZs solves the vast majority of high-availability needs, and it is **cheap, low-latency, and simple to set up**, so it should be your **default**. Multi-Region is a clearly more expensive and complex upgrade, worth it only for specific needs. They are not either-or: get Multi-AZ right first, then add Multi-Region only if you genuinely need it.

| Comparison | Multi-AZ (within one Region) | Multi-Region (across Regions) |
| --- | --- | --- |
| **Mainly solves** | Single data-center failure → **HA** | Region-wide disaster, global latency → **DR / going global** |
| **Latency** | Low-latency links between AZs, **synchronous replication possible** (e.g. RDS Multi-AZ) | High cross-Region latency (tens to hundreds of ms), usually **asynchronous replication only** |
| **Cost** | Low (small cross-AZ traffic fees) | High (cross-Region transfer fees, a full copy of resources in each location) |
| **Complexity** | Low; many services enable it with one switch (Multi-AZ) | High; you must handle data consistency, traffic routing, disaster drills |
| **Typical scenario** | Standard for most production environments | Regulatory off-site redundancy, global users needing nearby access, fighting Region-level disasters |

:::tip[💡 Exam key point: how to choose]
- The question only says "**highly available, tolerate a data-center failure**" and is cost-sensitive → choose **Multi-AZ** (do not jump to cross-Region the moment you see "highly available"; that is usually over-engineering and a cost trap).
- The question mentions "**must keep serving even if the whole region goes down**", "**regulation requires off-site data**", or "**low latency for global users**" → this is when you need **Multi-Region** (possibly with CloudFront or Route 53 latency routing).
- The question stresses "**data must sync in real time, no loss allowed**" → think **synchronous Multi-AZ replication within one Region**; cross-Region is mostly asynchronous and carries an RPO (small data loss).
:::

## Real-world application: it's not just for the exam

<Scenario title="Real scenario: the day before your shopping site launches">

Your manager asks: "If one AWS data center loses power at midnight, does our whole site go down?" — If all your EC2 instances are in the same AZ, the answer is "yes". The right approach: spread EC2 across at least 2 AZs with a load balancer in front. Below, let's first look at which AZs you have.

</Scenario>

### 🛠️ Hands-on: see which AZs your Region has

1. Log in to the AWS console → check your current **Region** in the top right (e.g. "Asia Pacific (Tokyo) ap-northeast-1")
2. Type `EC2` in the search bar → open the EC2 service
3. Click **EC2 Dashboard** at the bottom of the left menu, or expand "Network settings" when launching an instance, to see the selectable **Availability Zones** (e.g. ap-northeast-1a / 1c / 1d)
4. One line with the CLI also works:

```bash
# List all Availability Zones in the current Region
$ aws ec2 describe-availability-zones --query "AvailabilityZones[].ZoneName"
[
    "ap-northeast-1a",
    "ap-northeast-1c",
    "ap-northeast-1d"
]
```

### 🛠️ Hands-on: turn a single-point database into a highly available one (RDS Multi-AZ)

The most common hidden SPOF is a **single-instance database**. You can run all the EC2 instances you want, but if they all point to one database and it dies, the whole site still crashes. RDS **Multi-AZ** plugs this hole with a single switch: AWS maintains a **synchronously replicated** standby copy in **another AZ**, and fails over automatically when the primary fails.

```bash
# Enable Multi-AZ right at creation time (the key is --multi-az)
aws rds create-db-instance \
  --db-instance-identifier myapp-db \
  --db-instance-class db.t3.micro \
  --engine mysql \
  --allocated-storage 20 \
  --master-username admin \
  --master-user-password "ChangeMe123!" \
  --multi-az

# An existing single-AZ database can be converted to Multi-AZ in one line
aws rds modify-db-instance \
  --db-instance-identifier myapp-db \
  --multi-az \
  --apply-immediately
```

**Expected result**: a `describe-db-instances` query will show `"MultiAZ": true`, and the database detail page in the console will show the primary and standby in different AZs (e.g. primary in `1a`, standby in `1c`). Later, if the AZ hosting the primary fails, RDS automatically shifts traffic to the standby, and your application **connection string does not change at all** (it connects to the endpoint, not a machine IP) — this is what "one machine dies, the service keeps running" looks like for a database.

:::info[🔑 Easy mix-up: Multi-AZ is NOT a Read Replica]
A **Multi-AZ** standby exists for **high availability**: it normally cannot be read or written, just stands by, takes over on failure, and uses **synchronous** replication. A **Read Replica** exists for **read scaling / performance**: it normally **can be read**, uses **asynchronous** replication, and does **not** guarantee automatic failover. When the question asks about "high availability / automatic failover", choose Multi-AZ; when it asks about "spreading heavy read traffic", choose Read Replica. Do not conflate the two.
:::

<Cost>

**Using multiple AZs costs nothing extra by itself**, but note: **data transferred across AZs** incurs a small traffic charge. This is the "insurance premium" of high availability, and it's usually far less than the cost of a single outage. Also note: **RDS Multi-AZ costs roughly double the database price** (it maintains an extra standby copy), and **cross-Region** redundancy adds cross-Region transfer fees plus a second full set of resources on top — which is exactly why "Multi-AZ first, Multi-Region only if truly needed" is the cheaper and more practical order. Remember to **Terminate / Delete** practice EC2 and RDS resources when done, and use the **Free Tier**.

</Cost>

:::warning[🚑 Common pitfalls]
- **Thinking "running in multiple AZs" is automatically HA**: spreading instances across different AZs is **only the first step**. If there is no load balancer in front to route traffic away, the database is not Multi-AZ, and health checks are not set up, then when one AZ dies, traffic still hits the dead machines. **Multi-AZ is necessary but not sufficient** — pair it with ELB + Auto Scaling + a Multi-AZ database so that no single point exists anywhere in the chain. Only then is it truly highly available.
- **Storing state (session / files) on a single instance**: if login state or uploaded files live only on one EC2 instance's local disk, then when that instance (or its AZ) dies, the data is gone — users get logged out and files vanish, creating yet another SPOF. Move state out to a **shared, cross-AZ service**: put sessions in **ElastiCache / DynamoDB** and files in **S3**, so every EC2 instance becomes a stateless machine that can be replaced at any time.
- **A single NAT Gateway becoming a hidden single point**: many people deploy **only one** NAT Gateway in one AZ for private subnets to reach the internet. If that AZ fails, **private subnets in every AZ lose outbound access** (updates and external API calls all break), and your EC2 instances are alive yet cut off from the outside. The fix: **put one NAT Gateway in each AZ** with its own route, so one AZ cannot drag down the rest.
- **Jumping to cross-Region the moment you see "highly available"**: cross-Region is expensive and complex, and most HA needs are solved by spanning AZs. Solving a single-Region HA problem with cross-Region is **over-engineering plus a cost trap**. Only "a Region-wide disaster", "regulatory off-site redundancy", or "global low latency" truly need cross-Region.
- **Ignoring cross-Region cost and latency**: replicating data across Regions means paying **cross-Region transfer fees** and maintaining a full copy of resources in each location (often doubling cost), and cross-Region latency is high (tens to hundreds of ms), usually allowing only **asynchronous** replication — meaning a small amount of data loss in a disaster (RPO > 0). Do not treat it as a free "beefed-up Multi-AZ".
- **Treating an Edge Location as a place to run servers**: Edge only does caching/acceleration; your application runs in a Region's AZs.
:::

<Refs title="📚 Official docs & further reading">

- [AWS Docs: Regions and Availability Zones](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-regions-availability-zones.html)
- [AWS Global Infrastructure](https://aws.amazon.com/about-aws/global-infrastructure/)
- [AWS Well-Architected: Reliability Pillar](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html)

</Refs>

## Next

- ⚡ Quick review: [Domain 2 Flashcards](./flashcards.md)
- ✍️ Test yourself: [Domain 2 Practice Questions](./quiz.md)
- 📖 Next page: [Elastic Load Balancing (ELB)](./elb.md)
