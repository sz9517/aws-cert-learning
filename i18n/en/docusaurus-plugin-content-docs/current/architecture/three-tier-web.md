---
sidebar_position: 1
title: "Reference Architecture 1: A Highly Available Three-Tier Web App"
---

# Reference Architecture 1: A Highly Available Three-Tier Web App

> So far you've met EC2, ALB, Auto Scaling, RDS, CloudFront one at a time. This page is about **assembling them into a complete architecture**. That's the real skill the SAA exam tests: not memorizing a single service, but knowing **how to wire them together to solve a real requirement**.

:::note[💬 How to read this page]
Start with the scenario (what we're solving), then the overall diagram, then work through each tier and *why* that service was chosen. Hover over any <Term desc="Like this! Hover over any dotted term (tap on mobile) for a plain-language explanation.">dotted term</Term> for a plain-language explanation.
:::

## The requirement

<Scenario title="Real scenario: your boss hands you a dynamic website to move to the cloud">

You're an engineer at an e-commerce company, and your boss says: "Our shopping site is moving to AWS. There are three hard requirements:

1. **Highly available**: if a data center loses power at 3 a.m., the site must not go down entirely.
2. **Scales with traffic**: quiet on weekdays, slammed during a big sale. It has to handle the spike without burning money all year round.
3. **Secure**: the database must never be exposed directly to the public internet."

No single clever service solves this. You need a **layered architecture** that composes several services together. That's the industry's most classic template: the **three-tier architecture**.

</Scenario>

<Analogy title="🏢 Analogy: think of your site as an office building with security">

- **Lobby and guard (public-facing tier)**: visitors can only come through the front door and must pass the guard; they can't barge straight into the offices. That's the ALB, the one and only way in.
- **Office staff (application tier)**: the people who actually do the work sit on inner floors; outsiders can't reach them, and they only handle jobs handed down from the lobby. That's the EC2 fleet in private subnets.
- **The vault (data tier)**: the company's most important data is locked in the innermost vault; only specific staff can open it, and visitors can't even see the door. That's RDS in private subnets.

The deeper you go, the more protected it gets — that's the spirit of "layering".

</Analogy>

## Architecture overview

Top to bottom, it works like this: a user's request first hits DNS to find the site, static assets (images, CSS, JS) are served close to the user via a CDN, and dynamic requests flow into a load balancer spanning multiple Availability Zones, which spreads them across auto-scaling servers in private subnets, which finally read and write a database that also lives in private subnets and has a standby.

```text
                      User (browser)
                            |
                            v
                  +---------------------+
                  |  Route 53 (DNS)     |  resolves the domain to the resources below
                  +---------------------+
                            |
             +--------------+--------------+
             |                             |
             v                             v
     +----------------+           +------------------+
     | CloudFront     |           | dynamic requests |
     | (CDN / edge)   |           |                  |
     +----------------+           |                  |
             |  static assets           |
             v                          |
         +-------+                      |
         |  S3   | images/CSS/JS        |
         +-------+                      |
                                        v
  ===================== VPC =============================
  |                                                     |
  |   Public subnets (across multiple AZs)              |
  |   +-----------------------------------------------+ |
  |   |   ALB (Application Load Balancer, AZ-a / AZ-b) |<--- the only way in
  |   +-----------------------------------------------+ |
  |        |                           |                |
  |        v                           v                |
  |   Private subnet AZ-a         Private subnet AZ-b   |
  |   +--------------+           +--------------+        |
  |   | EC2 (Web/App)|           | EC2 (Web/App)|  <-- Auto Scaling group
  |   +--------------+           +--------------+        |
  |        |                           |                |
  |        +-------------+-------------+                |
  |                      v                              |
  |   Data tier (private subnets, across AZs)           |
  |   +-----------------------------------------------+ |
  |   |  RDS primary (AZ-a)  --sync replicate-->  standby (AZ-b) |
  |   |                 RDS Multi-AZ                   | |
  |   +-----------------------------------------------+ |
  |                                                     |
  |   private subnets --> NAT Gateway (public) --> Internet |
  |   (how EC2 pulls updates / calls external APIs: outbound only) |
  =======================================================
```

:::info[🔑 Three things to notice in the diagram]
1. **Only CloudFront and the ALB face the internet.** Both EC2 and RDS sit in **private subnets** and are unreachable from outside.
2. **Every tier spans multiple AZs.** The ALB, the EC2 fleet (Auto Scaling), and RDS (Multi-AZ) all straddle AZ-a and AZ-b, so losing any one zone doesn't take the site down.
3. **Private subnets reach out through a NAT Gateway, one way only.** Servers can pull updates and call external APIs outbound, but nothing from outside can connect in.
:::

## Why each tier was chosen

| Tier | What it uses | Why |
| --- | --- | --- |
| **DNS** | <Term en="Amazon Route 53" desc="AWS's DNS service; resolves domains to resources and can do health checks and traffic routing.">Route 53</Term> | Points the domain at CloudFront / the ALB; supports health checks so it can fail away from an unhealthy resource |
| **Content delivery** | <Term en="Amazon CloudFront" desc="A content delivery network (CDN) that caches content at global edge locations near users.">CloudFront</Term> + <Term en="Simple Storage Service" desc="AWS's cloud file warehouse for images, videos, and static website files.">S3</Term> | Static assets (images, CSS, JS) live in S3 and are cached by the CDN close to users; fast worldwide while offloading bandwidth and load from the backend |
| **Entry point / load balancing** | <Term en="Application Load Balancer" desc="A layer-7 (HTTP/HTTPS) load balancer that spreads traffic across multiple backends.">ALB</Term> | The single public entry point, spanning multiple AZs; evenly distributes traffic, health-checks backends, and can terminate HTTPS |
| **Web / app tier** | <Term en="Elastic Compute Cloud" desc="A cloud server you rent on AWS; your program runs on it.">EC2</Term> + <Term en="Auto Scaling" desc="Automatically adds or removes servers based on traffic.">Auto Scaling</Term> | Runs the application itself in **private subnets**; an Auto Scaling group grows and shrinks the instance count with traffic, handling spikes while saving money |
| **Data tier** | <Term en="Relational Database Service" desc="A managed relational database such as MySQL or PostgreSQL.">RDS</Term> (Multi-AZ) | Managed relational database in **private subnets**; with Multi-AZ it keeps a synchronous standby in another AZ and fails over automatically if the primary dies |
| **Private subnet egress** | <Term en="NAT Gateway" desc="A managed gateway that lets private-subnet resources reach the internet one way, outbound only.">NAT Gateway</Term> | Lets private-subnet EC2 pull updates and call external APIs; it's **outbound only**, so nothing outside can initiate a connection in |
| **Network foundation** | <Term en="Virtual Private Cloud" desc="Your own private virtual network inside AWS.">VPC</Term> + public/private subnets | The base for everything; public/private subnets provide the layered isolation that the whole architecture's security rests on |

## How three Well-Architected pillars show up

AWS's [Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/) has several pillars; this one architecture demonstrates the three most commonly tested at once.

### 1. High availability (Reliability)

- **Deployed across multiple AZs**: the ALB, EC2, and RDS all span at least two AZs. If one whole AZ loses power, the site keeps serving.
- **ALB + Auto Scaling group**: the ALB only sends traffic to healthy instances; if an EC2 dies, Auto Scaling automatically launches a replacement.
- **RDS Multi-AZ**: the database keeps a synchronous standby in another AZ and **fails over automatically** on primary failure, with no human in the loop.

### 2. Security

- **Layered <Term en="Security Group" desc="A virtual firewall attached to a resource that controls inbound and outbound traffic.">security groups</Term>**: the ALB allows only inbound 443 from the internet; EC2 accepts traffic only from the ALB's security group; RDS accepts traffic only from the EC2 security group. Each layer trusts only the one above it.
- **Web / app tier in private subnets**: the EC2 instances have no public IP and can't be reached directly, shrinking the attack surface.
- **Only the ALB is public**: the whole system's exposure to the internet collapses to a single entry point, which is easy to protect centrally (for example, by putting a WAF in front).

### 3. Cost

- **Auto Scaling shrinks off-peak**: it adds servers to absorb a sale and shrinks back afterward, so you don't have to "pay for peak traffic all year long".
- **S3 + CloudFront save on transfer**: static assets are cached by the CDN and served from S3, cutting backend EC2 compute and outbound transfer costs — and it's faster, too.

:::tip[💡 Say it in one line]
**High availability comes from "multi-AZ + automatic replacement", security from "layering + hiding things in private subnets", and cost efficiency from "grow only as much as you use".** If you can say those three sentences, you've captured the soul of this diagram.
:::

## Common exam angles

The SAA loves scenario questions built on this classic architecture. Spot "which tier is this really about" and the answer direction becomes obvious.

| When the question asks | What it's really testing | Answer direction |
| --- | --- | --- |
| "How do we keep the site up through **a single-AZ failure**?" | High availability / multi-AZ | Deploy the ALB, EC2 (Auto Scaling), and RDS **across multiple AZs**; any single-AZ-only option is wrong |
| "How does the **data tier** stay highly available?" | RDS resilience | Enable **RDS Multi-AZ** (synchronous standby, automatic failover); note this is for *availability*, not for offloading reads (that's a Read Replica) |
| "Traffic spikes **overwhelm** the site; fix it without paying for it off-peak." | Elasticity / cost | **ALB + an Auto Scaling group** that scales EC2 on a metric |
| "The **database must not be exposed to the public internet** — how do you place it?" | Security / networking | Put RDS in **private subnets** and use a security group that allows connections only from the app tier |
| "How do we make the site faster for **global users** while offloading the backend?" | Delivery / cost | Serve static assets via **S3 + CloudFront (CDN)**, cached close to the user |
| "EC2 in private subnets needs to **pull updates** but must not be reachable from outside." | Networking / security | Route through a **NAT Gateway** (outbound only) |

:::info[🧭 A trick for reading these]
See "tolerate a single data-center failure" or "highly available" → think **multi-AZ**; see "overwhelmed by a spike" or "save off-peak cost" → think **Auto Scaling**; see "must not be exposed to the public internet" → think **private subnets + security groups**. Mapping keywords to tiers is the shortcut to scoring on scenario questions.
:::

<Refs title="📚 Official docs & further reading">

- [AWS Architecture Center](https://aws.amazon.com/architecture/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [Well-Architected: Reliability Pillar](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html)
- [AWS Docs: RDS Multi-AZ deployments](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZ.html)

</Refs>

👉 Next architecture: [A Serverless API](./serverless-api.md)
