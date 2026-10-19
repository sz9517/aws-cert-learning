---
sidebar_position: 2
title: Elastic Load Balancing (ELB)
---

# ELB: "auto-distribute traffic, survive a dead server"

> This page helps you pick between the three load balancers (ALB / NLB / GWLB) — the most commonly tested selection question in Domain 2's high-availability topics.

<Vocab title="📌 Jargon you'll see on this page (fine even if you've never touched AWS)">

- **Load Balancer**: the "**front desk**" sitting between users and your backend servers, evenly spreading incoming traffic across every server behind it.
- **AZ (Availability Zone)**: a **physically separate data center** within a Region. If one AZ loses power, another keeps running.
- **Target Group**: the "**list of servers that should receive traffic**" behind the load balancer (can be EC2 instances, IPs, or Lambda).
- **Health Check**: the load balancer periodically "**knocks to ask: are you still alive?**" — it stops sending traffic to any server that fails.

</Vocab>

:::note[💬 Reading tip]
Whenever you see a term with a <Term desc="Like this! Hover over any dotted term (tap on mobile) and a plain explanation pops up.">dotted underline</Term>, hover over it for a plain-language explanation. All terms are also collected in the [Glossary & Services](../../glossary.md).
:::

## Why do you need it? A story that goes wrong first

Say your shopping site runs on **a single** EC2. Traffic spikes during a big sale, the one instance can't cope and crashes — the whole site is down. Even under normal traffic, the day that instance's data center (AZ) loses power, your site goes dark too.

The fix: **run multiple EC2s spread across different AZs**, and put an <Term en="Elastic Load Balancing" desc="A service that sits between users and backend servers, automatically spreading traffic across multiple servers.">ELB</Term> in front as the front desk. Users only connect to the ELB, which hands each request to a healthy server. One instance dies, or a whole AZ goes down — the ELB routes around it, and users notice nothing. That's "high availability".

## ELB in one sentence

**ELB (Elastic Load Balancing)** automatically spreads incoming traffic across multiple backends and, via **health checks**, only sends traffic to healthy targets. It is AWS's gateway to high availability and horizontal scaling.

<Analogy title="🏢 Analogy: think of ELB as a restaurant's host at the door">

- The **host (ELB)** stands at the entrance and seats each guest at a table that is "currently free and working fine".
- **Multiple tables (multiple EC2s)** are spread across different rooms (different AZs); if one room's A/C breaks, the host stops seating guests there.
- **Table checks (health checks)**: the host regularly inspects each table and temporarily skips any that has a problem.
- Guests only ever deal with "the host at the door" — they never need to know which table they end up at. That's ELB hiding the backend details for you.

</Analogy>

## How to pick between the three load balancers (the most important table)

| Type | Layer | Understands | Best for | Static IP |
| --- | --- | --- | --- | --- |
| **ALB** (Application LB) | Layer 7 (application) | HTTP/HTTPS, URL paths, host names | General websites, APIs, microservices (path/host routing) | ❌ (gives a DNS name) |
| **NLB** (Network LB) | Layer 4 (transport) | TCP/UDP, connections | Ultra-high performance, low latency, gaming/finance, needs a fixed IP | ✅ (one static/Elastic IP per AZ) |
| **GWLB** (Gateway LB) | Layer 3/4 | IP packets | Chaining third-party **network security appliances** (firewalls, IDS/IPS) | — |

<Term en="Application Load Balancer" desc="A Layer 7 load balancer that understands HTTP and can route by URL path or host name.">ALB</Term>'s strength is "**smart routing**": send `/api/*` to API servers, `/images/*` to image servers, or split `shop.example.com` and `blog.example.com` by host. <Term en="Network Load Balancer" desc="A Layer 4 load balancer handling TCP/UDP with extreme performance and very low latency; can provide a fixed IP.">NLB</Term> doesn't look at content, only connections, so it's **fast enough to handle millions of requests per second** and can give you a **static IP**.

:::tip[💡 Exam key point]
Match the keyword straight to the answer — nearly free points:
- Question mentions **HTTP/HTTPS, routing by path or host, microservices** → **ALB**
- Question mentions **TCP/UDP, ultra-high performance, ultra-low latency, or a "fixed/static IP" or "IP allow-list"** → **NLB**
- Question mentions **chaining third-party firewalls / intrusion-detection appliances** → **GWLB**
- Question mentions **using multiple AZs for high availability** → the ELB must have **≥ 2 AZs selected at creation** (the most commonly overlooked setting)
:::

## How it works (diagram)

<div className="flow">
  <div className="flow-node">User request</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">ELB (across multiple AZs)</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Health check filters out bad targets</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Routes to healthy EC2s (AZ-a / AZ-b)</div>
</div>

*Diagram: ELB only sends traffic to targets that pass the health check, and spans multiple AZs — any single instance or single-AZ failure leaves the service unaffected.*

## Real-world application: it's not just for the exam

<Scenario title="Real scenario: users keep reporting your API is 'unreachable'">

After much digging you find: you run your API on a single EC2, and during the few seconds a new deploy restarts it — or when the machine randomly crashes — users get disconnected. Your boss demands "**no more downtime on deploy, and a dead instance must be covered automatically**". The answer: multiple EC2s spread across AZs with an ALB in front, whose health checks steer traffic to healthy machines. Let's do it once below.

</Scenario>

### 🛠️ Hands-on: create an ALB spanning two AZs

1. First launch one EC2 in **each of two different AZs** (e.g. `ap-northeast-1a` and `1c`), both running the same website.
2. In the console search `EC2` → left menu **Target Groups** → **Create target group**, type `Instances`, add both EC2s, and set the health check path to `/health` (or `/`).
3. Left menu **Load Balancers** → **Create Application Load Balancer**.
4. **Network mapping**: select **at least two AZs** (this step is the key to high availability!).
5. **Listener**: `HTTP:80` → forward to the target group you just made. Create.
6. Once created, copy the ALB's DNS name into a browser and refresh a few times — traffic alternates between machines. Now manually stop one EC2: the site **still works** — traffic is automatically steered entirely to the other instance.

```bash
# Check target group health; a broken target shows as unhealthy
$ aws elbv2 describe-target-health \
    --target-group-arn <your-target-group-ARN>
```

<Cost>

ALB/NLB themselves are **billed per hour + traffic (LCU)** — not free, but very cheap compared to "the whole site going down". When you're done, remember to **delete the ALB and the test EC2s**. Use Free Tier `t2.micro` for EC2; the ALB has no free allowance, so deleting it right after is safest.

</Cost>

:::warning[🚑 Common real-world mistakes]
- **Only one AZ attached**: that defeats high availability — a single-AZ outage still takes everything down. ELB must span ≥ 2 AZs.
- **Wrong health check path**: set a path that returns 404, and all targets get marked unhealthy, so the ELB returns 503.
- **Security Group not opened**: the backend EC2's SG must allow traffic from the "ELB's SG", or the health check fails forever.
- **Misusing ALB for raw TCP game traffic**: when you need ultra-low latency or a fixed IP, choose NLB.
:::

<Refs title="📚 Official docs & further reading">

- [AWS Docs: Elastic Load Balancing User Guide](https://docs.aws.amazon.com/elasticloadbalancing/latest/userguide/what-is-load-balancing.html)
- [Application Load Balancer overview](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/introduction.html)
- [Network Load Balancer overview](https://docs.aws.amazon.com/elasticloadbalancing/latest/network/introduction.html)
- [Health checks for target groups](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/target-group-health-checks.html)

</Refs>

## Next

- ⚡ Quick review: [Domain 2 Flashcards](./flashcards.md)
- ✍️ Test yourself: [Domain 2 Practice Questions](./quiz.md)
- 📖 Next page: [Auto Scaling](./auto-scaling.md)
