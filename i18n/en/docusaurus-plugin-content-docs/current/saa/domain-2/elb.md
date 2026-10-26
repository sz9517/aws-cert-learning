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

## Why load balance at all? (what "high availability" really means)

Many people memorize "ELB = spreads traffic" without grasping **why you can't live without it**. In plain terms, load balancing solves three things a single server simply cannot:

- **High Availability**: a single machine will fail eventually — either the app crashes or its data center (AZ) loses power. ELB spreads traffic across **multiple machines in different AZs**, and when any one machine or a whole AZ dies, the **health check** makes ELB route around it, with users noticing nothing. That is what "high availability" concretely means: **not that nothing ever breaks, but that a break doesn't interrupt the service.**
- **Horizontal Scaling**: when traffic grows, instead of swapping the single machine for a pricier one (vertical scaling — capped and needs downtime), you **add more identical machines** behind the ELB (horizontal scaling). ELB is the entry point for horizontal scaling, and usually pairs with **Auto Scaling** — add machines when traffic is high, remove them when it is low.
- **Hiding backend details**: users only connect to "one ELB address". How many machines are behind it, which one was swapped, which one is under maintenance — none of that is their concern. You can do rolling updates and replace failed machines behind the scenes, invisible to the front end.

:::info[🔑 An easy mix-up: load balancing ≠ auto scaling]
ELB is responsible for "**distributing** traffic across the existing healthy machines", but it **does not add or remove machines by itself**. The thing that actually "adds machines when busy, removes them when idle" is **Auto Scaling**. The exam often ties them together: **ELB (distribute) + Auto Scaling (add/remove) + multiple AZs** is the complete highly-available, elastic architecture.
:::

## ALB vs NLB vs GWLB: why pick which, and when to use each

The table above is a quick lookup; this section spells out the **trade-offs** behind the three — which is exactly what the exam's "selection" questions rely on.

### ALB (Layer 7 / application) — the default first choice for general websites and APIs

- **Why pick it**: it **understands HTTP/HTTPS content**, so it can do the "smart" things: route by URL path (`/api`, `/images`) or host name (`shop.` vs `blog.`), terminate HTTPS with a certificate attached to it, apply rules on HTTP headers/query strings, plus native WebSocket and redirect support. Targets can be EC2, IPs, or even **Lambda**.
- **Pros**: richest feature set, best for microservices and containers (ECS/EKS); centralized certificate management; fine-grained request-level routing and logging.
- **Cons / limits**: handles HTTP/HTTPS only (**cannot** carry raw TCP/UDP); because it parses Layer 7 content, its **latency is higher than NLB** and its throughput is lower; **no fixed IP**, you only get a DNS name.
- **When not to use**: when you need a **fixed/static IP**, **ultra-low latency**, **millions of connections per second**, or a **non-HTTP protocol** (gaming, MQTT, database connections) — all of those call for NLB.

### NLB (Layer 4 / transport) — fast, fixed IP, non-HTTP

- **Why pick it**: it **only looks at connections (TCP/UDP), not content**, so it is fast and lightweight, with extremely low latency and the ability to handle millions of requests per second; and it gives you **one static IP per AZ (you can attach an Elastic IP)**, which ALB cannot do.
- **Pros**: the highest ceiling on performance/latency; a fixed IP (ideal for **firewall allow-lists** or partners who will only open specific IPs); native TCP/UDP and TLS pass-through support.
- **Cons / limits**: it **cannot read HTTP content**, so no path/host routing, no WebSocket awareness, none of the Layer 7 features; to route by content you must handle it on the backend.
- **When not to use**: when you just want a general website/REST API, want path or host routing, or want to manage certificates centrally on the LB — **ALB is simpler** for these, so do not force an NLB just because it "sounds faster".

### GWLB (Layer 3/4) — purpose-built for chaining third-party security "virtual appliances"

- **Why pick it**: it is **not for serving general user traffic**; instead it **transparently steers** traffic through third-party **virtual network appliances** (firewalls, IDS/IPS, deep packet inspection) and sends it back on its way after inspection. You can "insert" a fleet of security appliances into the traffic path without changing your existing routing architecture.
- **Pros**: centrally deploy and scale third-party security appliances; uses the GENEVE protocol to encapsulate and forward traffic through a single entry/exit point.
- **Cons / limits**: a very narrow use case that general applications never touch; it requires a vendor security-appliance solution running behind it.
- **When to use (exam keywords)**: whenever a question says "**third-party firewall / intrusion-detection / traffic-inspection appliance**" or "**transparently send traffic through a security appliance first**", the answer is almost always **GWLB**.

<Scenario title="Real scenario: one team, three needs, each picks differently">

- "We are an e-commerce site: `/api` goes to backend services, `/` to the frontend, and we need an HTTPS certificate" → **ALB** (Layer 7 routing + certificate).
- "We build online gaming / real-time voice: we need UDP, the lowest possible latency, and our partner's firewall will only allow a **fixed IP**" → **NLB** (Layer 4 + static IP).
- "The security team requires all inbound and outbound traffic to first pass through the third-party firewall appliance we bought" → **GWLB** (chaining a virtual security appliance).

</Scenario>

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

**Expected result**: a freshly attached target starts as `initial`, then turns `healthy` after passing a few health checks; once you manually stop one instance, running this command again shows that one as `unhealthy`, and refreshing the browser **never reaches that instance** (ELB skips it automatically) — the site stays up.

### 🛠️ Advanced: attach an HTTPS certificate to the ALB (the most common production need)

Production sites almost always need HTTPS. The approach is to **attach the certificate to the ALB**, which terminates TLS centrally and forwards to the backends over HTTP (the backends never manage certificates themselves):

1. In **AWS Certificate Manager (ACM)**, request or import a certificate for your domain (ACM public certificates are free and auto-renew).
2. On the ALB, add an **`HTTPS:443` listener**, select that ACM certificate, and forward to the target group.
3. Change the original **`HTTP:80` listener to "redirect to HTTPS:443"**, so everyone is auto-upgraded to an encrypted connection.

**Expected result**: opening `https://your-domain` shows the padlock with no certificate warning; opening `http://` is auto-redirected to `https://`.
> ⚠️ The certificate goes on the **ALB** (an NLB offloading TLS uses a TLS listener, configured differently); and the **ACM certificate must be in the same Region as the ALB**, otherwise the listener cannot see that certificate.

### 🛠️ Need "the same user always hits the same instance"? Enable sticky sessions

If a shopping cart or login state lives in a single server's memory, a user whose next request lands on a different instance appears "logged out / cart emptied". The ALB's **Sticky Sessions** uses a cookie to pin the same user to the same target: in the target group's **Attributes**, enable `Stickiness`, pick the ALB-generated cookie, and set a duration.
> But the better approach is to **make the backend stateless** (store sessions in ElastiCache/DynamoDB), so any instance can serve any user and stickiness is no longer needed — this is also the "correct direction" the exam prefers.

<Cost>

ALB/NLB themselves are **billed per hour + traffic (LCU)** — not free, but very cheap compared to "the whole site going down". When you're done, remember to **delete the ALB and the test EC2s**. Use Free Tier `t2.micro` for EC2; the ALB has no free allowance, so deleting it right after is safest.

</Cost>

:::warning[🚑 Common pitfalls]
- **Only one AZ attached**: that defeats high availability — a single-AZ outage still takes everything down. ELB must span ≥ 2 AZs.
- **Wrong health check path**: set a path that returns 404 (or one that requires login to view), and **all targets get marked unhealthy**, so the ELB returns **503 Service Unavailable**. Point the health check at an endpoint that is "no-auth, lightweight, always returns 200" (a `/health` endpoint is common).
- **Forgetting to enable Cross-Zone Load Balancing**: when it is off, traffic is **first split evenly across AZs**, then each AZ distributes among its own targets — so if the AZs have different instance counts, the load becomes **uneven** (the AZ with fewer machines gets each instance hammered). **ALB has it on by default and free**; **NLB has it off by default** and you must enable it (cross-zone on NLB may incur cross-AZ data transfer charges). When you see "AZs have different instance counts but you still want even distribution", think of this.
- **Sticky sessions used in the wrong place**: enabling stickiness means "the same user always hits the same instance" — if that instance dies, the sessions pinned to it vanish, and it also causes **uneven distribution**. The correct direction is to **make the backend stateless** (keep sessions outside, in ElastiCache/DynamoDB) and only enable stickiness when you truly must.
- **Using ALB when you need a fixed IP**: ALB **only gives a DNS name and its IPs change**. When a partner firewall asks you for a "fixed IP to allow-list", you must switch to **NLB** (one static/Elastic IP per AZ).
- **HTTPS certificate on the wrong place or wrong Region**: to offload TLS at the LB, attach the certificate to the **ALB's HTTPS listener** (or an NLB's TLS listener); and the **ACM certificate must be in the same Region as the LB**, or the listener cannot select it and creation fails.
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
