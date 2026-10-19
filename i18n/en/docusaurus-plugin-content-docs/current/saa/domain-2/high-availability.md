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

## Don't confuse: HA, Fault Tolerance, Disaster Recovery

| Term | In plain words | Example |
| --- | --- | --- |
| **High Availability (HA)** | Recovers **quickly and automatically**, allows a very brief interruption | Across 2 AZs; one fails, the other takes over |
| **Fault Tolerance** | **No interruption at all**, highest cost | Multiple full copies running simultaneously, zero downtime |
| **Disaster Recovery (DR)** | A **recovery plan** for a Region-level disaster | Cross-Region redundancy (see [Backup & Disaster Recovery](./backup-dr.md)) |

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

<Cost>

**Using multiple AZs costs nothing extra by itself**, but note: **data transferred across AZs** incurs a small traffic charge. This is the "insurance premium" of high availability, and it's usually far less than the cost of a single outage. Remember to **Terminate** practice EC2 instances when done, and use the **Free Tier**.

</Cost>

:::warning[🚑 Common real-world mistakes]
- **Cramming all EC2 and databases into one AZ**: saves a little cross-AZ traffic cost, but turns the whole system into one giant SPOF that all falls over on a single outage.
- **Thinking "just run a few more EC2s" equals HA**: if they're all in the same AZ, it's still a single point of failure. **The key is spanning AZs.**
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
