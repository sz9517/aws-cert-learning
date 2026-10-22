---
sidebar_position: 5.5
title: "VPC Networking: Subnets, NAT, Peering & Hybrid Connectivity"
---

# VPC Networking: Subnets, NAT, Peering & Hybrid Connectivity

> "Can this host reach that one? Can it reach the internet? How do two VPCs talk to each other? How does an on-premises data center plug into AWS?" These **connectivity** questions are a **high-frequency, must-know topic** on the SAA exam. This page strings VPC networking into one clear storyline so that the moment you read a scenario, you know which service to pick.

<Vocab title="📌 Jargon you'll see on this page">

- **VPC (Virtual Private Cloud)**: your **private virtual network** inside AWS, like a whole floor of office space you rent.
- **CIDR**: the notation for an IP range, e.g. `10.0.0.0/16`, which decides how many usable IPs a VPC has.
- **Subnet**: a smaller slice carved out of a VPC, tied to a **single Availability Zone (AZ)**.
- **Route Table**: the signpost that decides "where a packet bound for a given destination should go".
- **Internet Gateway (IGW)**: the VPC's front door to the internet.
- **NAT (Network Address Translation)**: a relay that lets hosts in a private subnet reach out to the internet **one-way only**.

</Vocab>

:::note[💬 Reading tip]
Whenever you see a term with a <Term desc="Like this! Hover over any dotted term (tap on mobile) and a plain explanation pops up.">dotted underline</Term>, hover over it for a plain-language explanation. All terms are also collected in the [Glossary & Services](/glossary).
:::

:::info[🔎 This page focuses on connectivity]
Network **security** (Security Groups and NACLs) and **VPC Endpoints / PrivateLink** each have their own dedicated pages, so we won't repeat them here. This page is purely about "**how to make traffic flow**": subnets, routing, reaching the internet, VPC-to-VPC, and on-premises-to-AWS connections.
:::

## Why you need to understand VPC connectivity

<Scenario title="Real scenario: an architecture diagram full of 'can they reach each other' decisions">

You're building a system on AWS: web servers need to be reachable from outside, the database must be unreachable from the internet but still able to pull updates, the company HQ data center needs a secure link into this VPC, and later you'll spin up several more VPCs that all need to interconnect. Every line on that diagram is a service choice — **pick wrong and you get no connectivity, extra cost, or a security hole**. The SAA exam tests exactly these judgments.

</Scenario>

## VPC and CIDR: carve out a private network first

The first step in creating a VPC is giving it a **CIDR** (IP range), e.g. `10.0.0.0/16` — meaning this VPC owns roughly 65,000 private IPs. Each **subnet** you carve inside it takes a smaller slice of that range, e.g. `10.0.1.0/24`.

<Analogy title="🏢 Analogy: the VPC is a whole office floor, subnets are rooms">

- **VPC (`10.0.0.0/16`)** = the entire floor you rent
- **Subnet (`10.0.1.0/24`)** = individual rooms partitioned off the floor, each anchored to one "building wing" (Availability Zone)
- **Route table** = the signpost at each room's door telling you "to get somewhere, take this road"

</Analogy>

:::tip[💡 About CIDR, this is all you need for the exam]
- A VPC's CIDR is **hard to change after creation** (you can only add extra blocks), so plan it large enough up front and **make sure it doesn't overlap with networks you may interconnect later**. This "no overlap" rule becomes a key exam point under Peering below.
:::

## Public vs private subnets: the only difference is "a route to the IGW"

This trips up many beginners: a subnet itself has **no public/private switch**. Whether it's public or private depends **entirely on whether its route table has a route pointing to the Internet Gateway (IGW)**.

- **Public subnet** = its route table has a `0.0.0.0/0 → IGW` route (any destination outside the VPC goes out through the IGW).
- **Private subnet** = its route table has **no** route to an IGW, so hosts in it cannot reach the internet.

```text
          ┌──────────────── VPC 10.0.0.0/16 ────────────────┐
          │                                                  │
 internet ──IGW─┬─ public subnet 10.0.1.0/24                 │
          │     │   route table: 0.0.0.0/0 → IGW             │
          │     │                                            │
          │     └─ private subnet 10.0.2.0/24                │
          │         route table: (no route to IGW) → no net  │
          └──────────────────────────────────────────────────┘
```

*Diagram: same VPC, the only difference is that one route in the route table pointing to the IGW.*

:::warning[🚑 Common gotcha]
- **Attached an IGW but still can't reach the internet?** An IGW alone isn't enough. You also need: (1) a `0.0.0.0/0 → IGW` route in the subnet's route table, (2) a **public IP or Elastic IP** on the host, and (3) Security Group / NACL rules that allow the traffic. All three are required.
:::

## NAT Gateway vs NAT Instance: let a private subnet go "out only, not in"

Hosts in a private subnet can't reach the internet, yet they often **need to initiate outbound connections** (download OS updates, call an external API). The key is: we want them to **get out, but no one from outside to get in**. That's NAT's job.

The way it works: point the private subnet's `0.0.0.0/0` route at a NAT that sits in a **public subnet**, and the NAT reaches out through the IGW. Responses come back along the same path, but external parties **cannot initiate** a connection into the private hosts.

<Analogy title="📮 Analogy: NAT is like the company mailroom">

Employees (private hosts) can hand a letter to the mailroom (NAT) to send out, and replies come back to the right employee; but outsiders **cannot address a letter directly to a specific employee** — they can only reply to a letter the employee sent first. That's "one-way outbound".

</Analogy>

| Aspect | **NAT Gateway** (managed) | **NAT Instance** (self-managed EC2) |
| --- | --- | --- |
| Who operates it | **Fully managed by AWS**, no maintenance | You run an EC2 as the NAT and maintain it yourself |
| High availability | **Automatically HA within an AZ**; put **one per AZ** for cross-AZ | You handle failover yourself; high single-point risk |
| Performance / bandwidth | Auto-scaling, high bandwidth | Limited by that EC2 instance type |
| Cost | Charged **per hour + per GB** (pricier but hassle-free) | Only EC2 cost (cheaper but labor-intensive) |
| Exam stance | **Default choice, the correct answer** | Only consider it for "extremely cost-sensitive, tiny traffic" |

:::tip[💡 Exam key points]
- "Hosts in a private subnet need to reach out to the internet to patch packages" → **NAT Gateway**.
- "The NAT must be **highly available**" → put **one NAT Gateway per Availability Zone**, don't bet everything on a single AZ.
- NAT handles **outbound only**; letting outsiders initiate inbound is the job of IGW + public IP — don't mix them up.
- If you only need to reach **S3 / DynamoDB** and skip NAT costs, the answer is usually a **VPC Gateway Endpoint** (see the VPC Endpoint page), not NAT.
:::

## VPC Peering: a "private line" between two VPCs

When you have two VPCs (possibly cross-account, cross-region) and want their hosts to **talk directly over private IPs** without traffic touching the public internet, you create **VPC Peering**. Afterward, each side adds a route saying "to reach the other's CIDR, use this peering connection".

Two Peering points are tested almost every time:

- **Non-transitive**: A peered with B and B peered with C **does not mean A can reach C**. Every pair that needs to communicate must have **its own** peering connection. This is why the count explodes as VPCs grow (fully meshing N VPCs needs `N×(N-1)/2` connections).
- **CIDRs must not overlap**: if two VPCs' IP ranges overlap (e.g. both use `10.0.0.0/16`), you **cannot create** the peering, because packets wouldn't know which side to go to. This echoes the earlier "avoid overlap when planning CIDRs".

```text
   VPC A ──peering── VPC B ──peering── VPC C
    │                                    │
    └──────── A reach C? No! ────────────┘
       (peering is non-transitive; A↔C needs its own link)
```

:::tip[💡 Exam key points]
- "**Two** VPCs need to talk over private IPs, CIDRs don't overlap" → **VPC Peering**.
- "A reaches C via B" phrasing → **wrong**, peering is non-transitive.
:::

## Transit Gateway: the hub-and-spoke traffic hub for many VPCs

As the number of VPCs grows, meshing them pairwise with Peering becomes a scary spider web (connection count explodes, routing gets unmanageable). **Transit Gateway (TGW)** exists to fix this: it acts as a **central router** where all VPCs (and even on-premises networks, across accounts) only need to **connect to the TGW hub once** to reach each other through it — this is **hub-and-spoke**.

```text
        VPC A        VPC B        VPC C
          │            │            │
          └──────┬─────┴─────┬──────┘
                 │  Transit  │
                 │  Gateway  │ ←── also attaches on-prem (VPN/DX), cross-account
                 └───────────┘
   (each VPC connects to the TGW once, no pairwise wiring)
```

| Aspect | **VPC Peering** | **Transit Gateway** |
| --- | --- | --- |
| Connection model | Point-to-point pairs | Hub-and-spoke (one center connects all) |
| Transitivity | **Non-transitive** | **Transitive** (interconnect through the TGW) |
| With many VPCs | Connection count explodes, hard to manage | **One hub handles it**, easy to scale |
| On-prem / cross-account | More limited | **Natively supported** (attach VPN, Direct Connect) |

:::tip[💡 Exam key points]
- "Connect **many** VPCs (and the count keeps growing) / cross-account / plus on-prem" → **Transit Gateway**.
- "Too many VPC Peering connections, management is painful, simplify it" → **switch to Transit Gateway**.
:::

## Hybrid connectivity: plug an on-premises data center into AWS

Many companies aren't pure cloud but run **on-premises + AWS together (hybrid)**. There are two roads to link the two sides: **Site-to-Site VPN** and **Direct Connect (DX)**.

<Analogy title="🚗 Analogy: take the public highway vs. build your own dedicated lane">

- **Site-to-Site VPN** = drive on the **public highway** (the internet), but with an armored escort (encryption). **Cheap, up and running in hours**, but you can't control traffic jams (network congestion, latency jitter).
- **Direct Connect** = lease a **dedicated lane only you can use** (a physical private line) from a carrier. **Stable, low latency, high bandwidth**, but **expensive and takes weeks to months to provision**.

</Analogy>

| Aspect | **Site-to-Site VPN** | **Direct Connect (DX)** |
| --- | --- | --- |
| Path | Over the **public internet**, encrypted | A dedicated **physical private line**, off the public internet |
| Provisioning speed | **Fast**, hours to a day | **Slow**, weeks to months |
| Cost | **Cheap** | **Expensive** (private line + port fees) |
| Latency / stability | Subject to internet jitter | **Stable, low latency, high bandwidth** |
| Typical use | Temporary / backup / cost-sensitive | Long-term, high volume, needs stable low latency |

:::tip[💡 A combo they love to test together]
- You can use **VPN as a backup for Direct Connect**: normally run over DX (stable and fast), and if DX goes down, fail over automatically to the VPN — balancing stability and resilience. This is a very common "correct answer".
:::

## One master comparison table: pick the service by scenario

| Your need / scenario | Pick |
| --- | --- |
| Hosts in a private subnet need to reach **out** to the internet (patch updates, call an external API) | **NAT Gateway** |
| Hosts in a public subnet need to be reachable from outside and also reach the internet | **Internet Gateway + public IP** |
| **Two** VPCs need to talk over private IPs, CIDRs don't overlap | **VPC Peering** |
| Connect **many** VPCs / cross-account / plus on-prem | **Transit Gateway** |
| On-prem data center needs a **cheap, fast** link into AWS (jitter acceptable) | **Site-to-Site VPN** |
| On-prem data center needs a **stable, low-latency, high-bandwidth** private line | **Direct Connect** |
| Need a stable private line plus a cheap backup | **Direct Connect (primary) + VPN (backup)** |

## Common exam angles (reflex on the keywords)

- "Connect many VPCs, and the count keeps growing" → **Transit Gateway**.
- "**Two** VPCs talk privately, CIDRs don't overlap" → **VPC Peering** (and remember it's **non-transitive**).
- "Private subnet needs **outbound** internet" → **NAT Gateway** (one per AZ for HA).
- "Need a **stable, low-latency** on-prem **private line**" → **Direct Connect**.
- "Need a **cheap, fast** encrypted tunnel to on-prem" → **Site-to-Site VPN**.
- "What makes a subnet public?" → **a `0.0.0.0/0` route pointing to the IGW**.

## Real-world application

### 🛠️ Hands-on: build the classic "public + private subnet + NAT" architecture

1. Open the console → `VPC` → **Create VPC**, set CIDR to `10.0.0.0/16`
2. Create two subnets: public `10.0.1.0/24` and private `10.0.2.0/24` (same AZ for easy practice)
3. Create and attach an **Internet Gateway** to this VPC
4. Add a `0.0.0.0/0 → IGW` route to the public subnet's route table (now it "becomes public")
5. Create a **NAT Gateway** in the **public** subnet (assign an Elastic IP)
6. Add a `0.0.0.0/0 → NAT Gateway` route to the private subnet's route table (now private hosts can go "out only, not in")

Check a VPC's route tables with the CLI to confirm the routes point correctly:

```bash
$ aws ec2 describe-route-tables \
    --filters Name=vpc-id,Values=vpc-0123456789abcdef0 \
    --query "RouteTables[].Routes"
```

<Cost>

**VPCs, subnets, route tables, and Internet Gateways are all free.** Watch out for the **NAT Gateway, which is charged per hour + per GB** (it keeps racking up hourly charges even when idle), and an **Elastic IP that isn't attached to a running resource also incurs a charge**. After practicing, remember to delete the NAT Gateway and release the Elastic IP. **VPC Peering itself is free** (you only pay cross-region / cross-AZ data transfer); **Transit Gateway and Direct Connect** both have fixed attachment/connection fees.

</Cost>

:::warning[🚑 Common real-world mistakes]
- **Putting the NAT Gateway in a private subnet**: the NAT must sit in a **public subnet** (it needs to reach out through the IGW itself); put it in the wrong place and it will never connect out.
- **Trying to get transitive connectivity from Peering**: A→B→C won't work, peering is **non-transitive** — either build every pair or switch to Transit Gateway.
- **Two VPCs with overlapping CIDRs wanting to peer**: it won't build; make CIDRs non-overlapping at the planning stage.
- **One NAT Gateway while demanding high availability**: if the single-AZ NAT dies, cross-AZ hosts lose outbound; put **one per AZ**.
:::

<Refs title="📚 Official docs & further reading">

- [AWS Docs: Amazon VPC User Guide](https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html)
- [NAT Gateway](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html)
- [VPC Peering](https://docs.aws.amazon.com/vpc/latest/peering/what-is-vpc-peering.html)
- [AWS Transit Gateway](https://docs.aws.amazon.com/vpc/latest/tgw/what-is-transit-gateway.html)
- [Site-to-Site VPN](https://docs.aws.amazon.com/vpn/latest/s2svpn/VPC_VPN.html)
- [AWS Direct Connect](https://docs.aws.amazon.com/directconnect/latest/UserGuide/Welcome.html)

</Refs>

## Next

- ⚡ Quick review: [Domain 2 Key Points / Flashcards](/saa/domain-2/flashcards)
- ✍️ Test yourself: [Domain 2 Practice Questions](/saa/domain-2/quiz)
- 📖 Next: [Backup & Disaster Recovery](/saa/domain-2/backup-dr)
