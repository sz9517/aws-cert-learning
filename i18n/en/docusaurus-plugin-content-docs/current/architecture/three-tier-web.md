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

## Why is it designed this way? (every decision in plain language)

The table above tells you *what* to use; this section tells you **why it has to be this way**. The exam loves testing these "whys", not the service names themselves.

### Why split into three tiers instead of one all-in-one machine?

The most intuitive approach is a single EC2 running the web pages, the application logic, and the database all together. It works, but the problems are serious:

- **One change breaks everything**: tweaking the frontend means a reboot that also drops the database connection. Three responsibilities welded onto one machine can't be upgraded or scaled independently.
- **You can't scale only the tier that needs it**: during a big sale, it's the **application tier's** compute that strains, while the database is usually fine. All-in-one, you can only size up the whole box, wasting money. Split apart, the app tier can grow to 10 instances while the database stays at 1 primary + 1 standby, each tuned on its own.
- **Security is wide open**: the database and the public-facing web pages running on the same machine and the same network location is like putting the vault in the lobby. The essence of layering is **"the more sensitive something is, the farther it sits from the internet"**.

:::info[🔑 Key takeaway in one line]
Layering isn't for looks — it's so **each tier can scale, upgrade, and set its security boundary independently**. A single-machine design can't do any of those three.
:::

### Why must the ALB + Auto Scaling span multiple AZs?

Think of an <Term en="Availability Zone" desc="Physically isolated data centers within a region, each with independent power and networking.">Availability Zone (AZ)</Term> as "different, physically separated data centers in the same city". Spanning AZs serves two distinct needs:

- **The ALB spans AZs for fault tolerance**: if the ALB and all the EC2 instances sat only in AZ-a, one power loss in that data center and the site vanishes entirely. Configure the ALB to straddle AZ-a / AZ-b and let Auto Scaling place a few EC2 instances in each AZ, and even a full AZ outage just makes the ALB route all traffic to the surviving AZ, with users barely noticing.
- **Auto Scaling is for elasticity + self-healing**: it does two things — add instances when traffic rises, and replace a dead EC2 automatically. Note that "adding" and "replacing" are two sides of the same coin: the Auto Scaling group always strives to keep "healthy instance count = your target".

:::tip[💡 Why "ALB + ASG" together, not just one of them?]
**ALB without ASG**: the ALB kicks out dead instances but never *launches* a replacement — over time you run low on healthy ones. **ASG without ALB**: the ASG keeps the instance count up, but nothing distributes traffic evenly and there's no single health-check entry point. You need both for the full loop of "auto-distribute + auto-replace + auto-scale".
:::

### Why enable Multi-AZ on the database?

Data is the **hardest thing to lose and the hardest thing to rebuild** in the whole system. If an EC2 dies, Auto Scaling just launches another (it's stateless anyway); but if the database dies with no live standby, the whole shop is shut. RDS Multi-AZ keeps a **synchronously replicated** standby in **another AZ**, and the moment the primary fails it **fails over automatically** — nobody has to climb out of bed at 3 a.m. to fix it.

:::warning[🚑 The most common confusion: Multi-AZ is not a Read Replica]
**Multi-AZ is for high availability**: the standby does **not** serve traffic normally; it just waits and takes over if the primary dies. **A Read Replica is for offloading read traffic**: it is reachable and queryable, but it does **not** automatically become the primary if the primary dies. When the question asks about "database high availability", pick Multi-AZ; only when it asks "reads are too slow, spread them out" do you pick a Read Replica. These two are often planted in the same question to trip you up.
:::

## Trade-offs and alternatives for each choice (why not X?)

Exams routinely place the "correct answer" next to options that "look fine but aren't right for this question". Knowing **why not X** scores more than memorizing "use Y".

| The choice here | Common alternative | Why this question picks the former, not the latter |
| --- | --- | --- |
| **ALB (layer 7)** | <Term en="Network Load Balancer" desc="A layer-4 (TCP/UDP) load balancer with very high throughput and ultra-low latency, but it does not inspect HTTP content.">NLB</Term> (layer 4) | A normal website routes by HTTP path/hostname and terminates HTTPS, so pick **ALB**. Pick NLB only for "extreme throughput, ultra-low latency, static IPs, or non-HTTP protocols (gaming, IoT)". |
| **EC2 + Auto Scaling** | A fixed number of EC2 instances | A fixed count is either too small at peak or wasteful off-peak, and dead instances are not replaced. Unless traffic is "perfectly predictable and constant", always use an **ASG**. |
| **EC2 + ASG (this page)** | <Term en="AWS Lambda" desc="Serverless compute that runs only on events, bills by usage, scales automatically, and needs no server management.">Lambda</Term> / Fargate (serverless) | For a "traditional, long-running web app that needs to stay resident", EC2 fits well. If the work decomposes into "event-driven, short tasks", serverless is less hassle (see the next architecture). This page deliberately uses EC2 to walk you through the most classic VPC layering. |
| **RDS (relational)** | <Term en="DynamoDB" desc="AWS's fully managed NoSQL database: millisecond latency, near-limitless scale, but not relational.">DynamoDB</Term> (NoSQL) | A shopping site has **relations and transactions** across orders, members, and products, so pick **RDS**. Consider DynamoDB only when data is "key-value, massive volume, needing extreme horizontal scale". |
| **RDS Multi-AZ (high availability)** | RDS Read Replica | If the goal is "the primary dies and a standby takes over", use **Multi-AZ**. If the goal is "offload reads", use a Read Replica. You can use **both** at once, but they solve different problems. |
| **NAT Gateway (private-subnet egress)** | Put EC2 in a public subnet with a public IP | A public IP is "throwing the front door wide open just so it can go out" — the attack surface explodes. The right answer is to **stay in the private subnet and go out one-way through NAT**: outbound works, inbound is blocked. |
| **CloudFront + S3 (static assets)** | Send every request to EC2 | Having EC2 serve images/CSS is slow, costly, and piles on load. Hand static assets to a **CDN + S3** and let EC2 handle only the genuinely dynamic logic. |

:::info[🧭 A general method for trade-off questions]
When you see "which option is most suitable", ask yourself three things first: **(1) Is the need high availability, elasticity, or cost? (2) Is this stateful or stateless? (3) Is the traffic predictable?** Map the question's keywords onto those three axes, eliminate the options that "solve the wrong problem", and usually only one answer remains.
:::

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

:::warning[🚑 Common pitfalls]
Drawing this diagram correctly is easy; what actually loses points are the details that **look highly available but leave one fatal gap**:

- **Living in a single AZ (single point of failure)**: if the ALB, EC2, or RDS sits in only one AZ, your "high availability" is already broken. The classic mistake is "the ALB spans AZs, but the Auto Scaling group is configured for AZ-a only" — the moment that AZ dies, there's not a single healthy instance behind the ALB. **All three tiers must span at least two AZs**, no exceptions.
- **Security groups that "allow through each layer" turn into "open at every layer"**: the point of layered security is "each layer trusts only the one above it". A common pitfall is cutting corners by opening the EC2 and RDS security groups to `0.0.0.0/0` (any source), or opening RDS to the whole VPC. The right way is to have the security groups **reference each other**: EC2 accepts only "source = the ALB's security group", and RDS accepts only "source = the EC2 security group". Specify the security group ID, not an IP range.
- **Putting the database in a public subnet**: this is the most serious pitfall. Once RDS sits in a public subnet with public access enabled, the vault is out on the street and the whole world can try to connect and brute-force it. **Always keep the database in a private subnet with public access disabled**, reachable only by the app tier's security group.
- **Session stored on a single machine (stateful EC2)**: many people keep login state or the shopping cart in one EC2's local memory. Then Auto Scaling shrinks the fleet, or the ALB routes your next request to a different instance, and the user is "mysteriously logged out, cart emptied". **Make the app tier stateless**: push session out to <Term en="ElastiCache" desc="AWS's managed in-memory cache (Redis / Memcached), often used to store sessions and hot data.">ElastiCache</Term> (e.g. Redis) or DynamoDB, so EC2 can be added, removed, and replaced at will.
:::

<Refs title="📚 Official docs & further reading">

- [AWS Architecture Center](https://aws.amazon.com/architecture/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [Well-Architected: Reliability Pillar](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html)
- [AWS Docs: RDS Multi-AZ deployments](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZ.html)

</Refs>

👉 Next architecture: [A Serverless API](./serverless-api.md)
