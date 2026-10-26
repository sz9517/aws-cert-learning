---
sidebar_position: 3
title: "Data Transfer Cost: the Invisible Bill That Gets Expensive"
---

# Data Transfer Cost: the invisible bill nobody sees until it gets expensive

> This page explains the part of AWS most people overlook yet often blows up the bill — data transfer cost. You will learn "inbound is mostly free, outbound costs money", how cross-AZ and cross-Region transfer is charged, and the moves that cut this invisible bill with CloudFront and VPC Endpoints. It is Domain 4's most practical "design for cost optimization" topic.

<Vocab title="📌 Jargon you will see on this page (fine even if you have never touched AWS)">

- **Data transfer**: moving data from one place "**to another place**". Moving into AWS, out of AWS, and within AWS are all billed by different rules.
- **Egress (outbound)**: data going "**outward**", especially out to the internet for users to download. This is usually the **most expensive leg**.
- **Ingress (inbound)**: data going "**inward**", for example users uploading files into AWS. Bringing data in is **mostly free**.
- **AZ (Availability Zone)**: **independent data centers** inside a Region. One Region usually has several AZs.
- **Region**: AWS's **large data-center groups around the world**, such as Tokyo, Singapore, Virginia. Moving data across Regions is the most expensive.
- **NAT Gateway**: the device that lets machines in a private subnet "**borrow a path out to the internet**", billed per hour plus per GB of data processed.

</Vocab>

:::note[💬 Reading tip]
Whenever you see a term with a <Term desc="Like this! Hover over any dotted term (tap on mobile) and a plain explanation pops up.">dotted underline</Term>, hover over it for a plain-language explanation. All terms are also collected in the [Glossary & Services](../../glossary.md).
:::

## Why care about transfer cost? A story where the bill explodes

Say you built a very popular image/video site with all files in <Term en="Simple Storage Service" desc="AWS's object storage service for files, images, videos, and backups.">S3</Term>, letting users worldwide connect in and download directly. More traffic feels great — until the end-of-month bill arrives.

You discover S3 **storage cost** is actually cheap; what is truly expensive is the leg that "**sends files out to users**" — the <Term en="Egress" desc="Traffic going out to the internet; the most common and most expensive AWS transfer cost.">egress (outbound)</Term> cost. Every download by every user adds to your outbound transfer bill; a popular file downloaded tens of thousands of times multiplies that cost by the same amount.

What makes transfer cost scary is that **it hides in many places you do not normally see**: cross-AZ database sync, traffic routed through a NAT Gateway, cross-Region backup replication — all quietly billing. **A big part of cost optimization is making data "travel less far, exit less, and stay on the internal network whenever possible".**

## The three billing principles in one sentence

- **Inbound free, outbound costs money**: sending data into AWS (upload) is almost always free; sending it out to the internet (download) is where the charges pile up.
- **The farther, the pricier**: transfer within the same AZ is **free**; cross-AZ costs money; cross-Region is **more expensive**.
- **Detours cost extra**: traffic that "loops out" via a public IP or NAT Gateway pays more in processing and transfer fees than staying internal (private IP, VPC Endpoint).

<Analogy title="🏢 Analogy: data transfer is like shipping parcels">

- **Inbound free = receiving costs nothing**: when someone ships a parcel to you (upload into AWS), you pay no shipping.
- **Outbound costs money = you pay to ship out**: when you ship a parcel to a customer (download to the internet), that leg is the big cost.
- **Distance sets the fee = same city vs overseas**: delivery within one building (same AZ) is free; to the next city (cross-AZ) costs money; overseas (cross-Region) costs even more.
- **Detour surcharge = toll road**: you could use the free internal lane (internal network), but instead you detour onto a tollway booth (NAT Gateway / public IP), paying a processing surcharge per kilogram.

</Analogy>

## Why is transfer billed "this way"? (Understand the logic, and saving money has a direction)

Many people memorize "inbound free, outbound costs money" without knowing **why**, so a reworded question trips them up. There is really just one principle behind it: **AWS wants to keep your data and compute "inside its network"**, so any time data **leaves the AWS network boundary**, or crosses **independent facilities** internally, you pay a "toll".

- **Why is inbound (upload) mostly free?** Because AWS is happy for you to bring data in — once it is in, you use its compute, storage, and analytics services, which is where AWS makes its money. So **the entrance has no barrier**, encouraging you to move data in.
- **Why is outbound (download to the internet) the most expensive?** Because once traffic crosses the AWS boundary it rides the **external bandwidth AWS buys from carriers**, which is a real cash cost; and data that left no longer drives further AWS consumption. So egress is the **biggest charge** and the leg you should work hardest to lower.
- **Why is same-AZ free but cross-AZ costs money?** One AZ is one data center, and private-IP traffic stays on its internal network at near-zero extra cost. But **cross-AZ means crossing different data centers**, and AWS has to run dedicated links between them, so it **charges both directions** (sender and receiver each counted).
- **Why is cross-Region even pricier?** Cross-Region crosses cities or even countries over the long-haul backbone — the farthest distance, the highest cost, so naturally the most expensive.

:::info[🔑 The easiest point to confuse: same Region does not mean free]
Many people assume "within the same Region it is free". That is **half right, half wrong**. The real dividing line is the **AZ, not the Region**:
- **Same Region + same AZ + private IP** → free.
- **Same Region but cross-AZ** (for example a multi-AZ high-availability deployment, primary database in AZ-a, replica in AZ-c) → **costs money, and both directions count**.
High-availability designs are often "same Region, spread across multiple AZs", so this kind of architecture **inherently generates cross-AZ transfer cost** — not a misconfiguration, but the necessary cost of high availability. Exams often use "same Region" as a distractor; see cross-AZ and think billing.
:::

## The tradeoffs behind the three money-saving moves (why pick it, when not to)

Saving transfer cost is not "the more the better" — each move has its right scenario and its price. This section lays out the **why, the pros and cons, and when not to use** each of the three.

### CloudFront: why it saves, and when it is not worth it

- **Why pick it**: when popular static content (images, video, JS/CSS, downloads) is downloaded repeatedly, a cache hit skips the origin and saves the S3 / EC2 outbound transfer cost; and CloudFront's egress rate is usually cheaper than S3 / EC2 going out directly.
- **Pros**: lowers outbound transfer cost, users fetch nearby so it is fast, and it also sits in front of the origin for extra security (with WAF / OAC).
- **Cons / tradeoff**: an extra service to configure (cache policy, invalidation, certificates); **content with a low cache-hit rate saves little**; and for **dynamic content that is different every time and cannot be cached** (such as personalized API responses), CloudFront saves no transfer cost and just adds a hop.
- **When not to use**: purely internal, non-public traffic (that is the VPC Endpoint's job); or content that is rarely re-accessed (caching is pointless).

### VPC Endpoint: how to choose Gateway vs Interface

- **Why pick it**: when private-subnet resources reach AWS services, by default they detour out through NAT to the internet — slow and costly (NAT processing fee + outbound transfer fee). An Endpoint keeps traffic on the AWS internal network, never touching the internet.
- **Gateway Endpoint**: supports only **S3 and DynamoDB**, steered by route tables, and **completely free itself**. This is the "set it and save, almost zero downside" first choice. Its limits: **only those two services**, works only **within the same Region**, and routes via route tables rather than a specific private IP.
- **Interface Endpoint (PrivateLink)**: supports **many AWS services and third-party services**, placing an ENI in your subnet connected over a private IP. It is general-purpose; **the con is it bills per hour plus per GB**, so with many service types and many endpoints the fixed fee adds up. Rule of thumb: **always use the free Gateway Endpoint for S3 / DynamoDB; only consider Interface Endpoint for other services**.
- **When not to use an Interface Endpoint**: for a service with tiny, occasional traffic, the fixed per-hour fee can be more than the NAT detour you started with — so it is not worth it there.

### Same-AZ / same-Region design: free, but do not sacrifice high availability to save money

- **Why it works**: placing components that talk at high frequency (app ↔ cache, app ↔ database) in the **same AZ** keeps them on private IPs inside one data center, so transfer is free.
- **Tradeoff**: same-AZ saves transfer cost but **gives up cross-AZ high availability** — if that AZ goes down the whole group goes with it. So **do not put all your eggs in one basket just to save transfer cost**. The right mindset: **keep the high availability that should span AZs, but collapse the truly high-frequency, latency-sensitive traffic into the same AZ, and accept the necessary cross-AZ cost as the price of insurance**.

## Three battlegrounds of transfer cost: same AZ, cross-AZ, cross-Region

| Traffic path | Billing | Typical scenario |
| --- | --- | --- |
| **Within one AZ (via private IP)** | **Free** | EC2 and a database in the same AZ talking to each other |
| **Cross-AZ** | Costs money (both directions count) | A primary/replica database split across AZs for high availability |
| **Cross-Region** | **More expensive** | Replicating data to another Region for disaster recovery |
| **Outbound to the internet (egress)** | Big cost | Users downloading files from S3 / EC2 |
| **Inbound from the internet (ingress)** | **Mostly free** | Users uploading files into AWS |

:::tip[💡 Exam key point]
Match the keyword straight to the money-saving move — nearly free points:
- Question mentions **"many users downloading, static content distribution, lower outbound transfer cost"** → **CloudFront** (edge caching + cheaper egress)
- Question mentions **"EC2 in a VPC needs to access S3 / DynamoDB", "traffic should not go through the internet or NAT", "save NAT processing fees"** → **Gateway VPC Endpoint** (accessing S3 / DynamoDB is **free**)
- Question mentions **"cross-AZ traffic cost is too high", "components keep talking to each other"** → **place frequently chatting components in the same AZ**
- Question mentions **"reach an AWS or third-party service over a private network"** → **Interface VPC Endpoint (PrivateLink)**
:::

## Money-saving move 1: CloudFront lowers outbound transfer cost

<Term en="Amazon CloudFront" desc="AWS's content delivery network (CDN) that caches content to edge locations worldwide, close to users and with cheaper transfer.">CloudFront</Term> is AWS's <Term en="Content Delivery Network" desc="A content delivery network that copies content to locations around the world so users fetch it nearby.">CDN (content delivery network)</Term>. It caches your files to **edge locations** worldwide, so a user downloads from the nearest one instead of going all the way back to the origin S3 / EC2.

It saves money in two key ways:

- **A cache hit skips the origin**: popular files sit at the edge, so repeated downloads come from cache and **no longer generate S3 / EC2 outbound transfer cost**.
- **CloudFront egress is cheaper**: the rate from CloudFront to users is usually better than S3 / EC2 going to the internet directly, and **CloudFront fetching from S3 as its origin is not charged separately for transfer**.

## Money-saving move 2: VPC Endpoint keeps traffic internal and skips NAT

When an EC2 in a private subnet needs to reach AWS services like S3 or DynamoDB, by default it "detours" out through a NAT Gateway to the internet and back into the AWS service. That path is **slow and costly** (NAT processing fee + transfer fee).

A <Term en="VPC Endpoint" desc="An entry point that lets resources inside a VPC connect directly and privately to AWS services, without going over the internet.">VPC Endpoint</Term> keeps this traffic **on the AWS internal network** — no internet, no NAT:

- **Gateway Endpoint**: dedicated to **S3 and DynamoDB**, steered via route tables, and **completely free itself**, while also saving the NAT processing and outbound transfer fees.
- **Interface Endpoint (PrivateLink)**: supports **many AWS services and third-party services**, placing an <Term en="Elastic Network Interface" desc="An elastic network interface, effectively a virtual network card inside the VPC.">ENI network card</Term> in your subnet with traffic going over <Term en="AWS PrivateLink" desc="Lets you reach AWS or third-party services securely over private IPs, without the traffic going over the internet.">PrivateLink</Term>. It bills per hour plus per GB, but is usually still cheaper than detouring via NAT.

## Transfer-path diagram: detour vs internal

<div className="flow">
  <div className="flow-node">EC2 in a private subnet needs to access S3</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Detour via NAT Gateway over the internet (pay NAT processing + transfer)</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Switch to an S3 Gateway Endpoint (internal, free)</div>
</div>

*Diagram: for the same S3 access, detouring via NAT out to the internet is billed all the way; switching to an S3 Gateway Endpoint is both more secure and free for transfer.*

## Real-world application: it is not just for the exam

<Scenario title="Real scenario: your boss asks 'it is just a backup running, why is the NAT bill so high?'">

Checking the bill you find: the company has a fleet of EC2s in a private subnet that back up large logs to S3 every night. Because they have no public IP, all that traffic detours through the <Term en="NAT Gateway" desc="The gateway that lets machines in a private subnet reach the internet, billed per hour plus per GB processed.">NAT Gateway</Term> to reach S3 — so every GB of nightly backup pays a NAT processing fee, plus extra outbound transfer cost.

The fix: create an **S3 Gateway Endpoint** in this VPC to steer S3 traffic back onto the AWS internal network. From now on that traffic **skips NAT, never leaves to the internet, and is completely free**. The setup only touches route tables, no code changes, the backup keeps running, and the NAT bill slims down immediately. Let us do it once below.

</Scenario>

### 🛠️ Hands-on: create an S3 Gateway Endpoint to save NAT cost

1. In the console search `VPC` → pick **Endpoints** on the left → **Create endpoint**.
2. For service category choose **AWS services**, search and pick `com.amazonaws.region-code.s3`, and confirm the type is **Gateway**.
3. Select your **VPC**, and check the **Route tables** used by the private subnet — a Gateway Endpoint steers traffic via route tables.
4. For the policy, start with **Full Access** to test, then tighten it later.
5. Click **Create endpoint**. Once done, traffic from the private subnet to S3 automatically uses this endpoint.
6. Put/get a file in S3 to verify the backup still works, then check the NAT Gateway traffic metrics — they should drop noticeably.

```bash
# Create an S3 Gateway Endpoint (replace vpc-xxx and the route table ID with yours)
$ aws ec2 create-vpc-endpoint \
    --vpc-id vpc-xxxxxxxx \
    --service-name com.amazonaws.ap-northeast-1.s3 \
    --vpc-endpoint-type Gateway \
    --route-table-ids rtb-xxxxxxxx
```

### 🧮 Estimate one with me: how much does this transfer cost actually differ?

Talking in theory is weaker than running the numbers once. Say that earlier EC2 fleet **backs up 100 GB of logs to S3 every day, 30 days a month = 3,000 GB** (about 3 TB). Below compares the two approaches with easy round-number rates (use the [official pricing](https://aws.amazon.com/vpc/pricing/) for real figures; whole numbers here just make mental math easy):

| Approach | NAT processing fee (approx. 0.045 USD/GB) | Outbound transfer fee | Monthly cost (rough) |
| --- | --- | --- | --- |
| **Detour via NAT to the internet** | 3,000 GB x 0.045 approx. **135 USD** | the leg to S3 in the same Region is usually not charged separately, but the NAT per-hour fixed fee is extra (approx. 0.045 USD/hr x 720 hr approx. **32 USD**) | **about 167 USD/month** |
| **Switch to an S3 Gateway Endpoint** | **0 USD** (internal network, no routing out to the internet) | **0 USD** (same Region via the Endpoint is free) | **about 0 USD (Endpoint is free)** |

**Expected result**: after switching to the Gateway Endpoint, the NAT processing fee and outbound transfer fee for this backup traffic **go straight to zero**, saving roughly the hundred-plus dollars in the table each month, and more as the data grows. After the hands-on steps, check the NAT Gateway `BytesOutToDestination` metric in CloudWatch — you should see traffic during the backup window drop noticeably or approach zero, which is the proof you are saving money.

:::tip[💡 Exam key point: first figure out "which leg is billed", then pick the fix]
The exam will not really make you compute to the decimal, but it will ask you to judge **which leg of traffic is billed and which option takes it to zero**. The trick: ask "does this traffic leave the AWS boundary? does it cross AZs / Regions? does it detour via NAT?" — as long as you can collapse traffic back to **the same-AZ internal network** or route it through **the free Gateway Endpoint**, that is the cheapest answer.
:::

<Cost>

**Gateway Endpoint (S3 / DynamoDB) is free itself** — one of the rare "set it and save, almost no downside" options. **NAT Gateway** is double billing: a **fixed per-hour fee + a per-GB processing fee**, so steering large traffic away from it has the biggest effect. **CloudFront** lowers origin and outbound transfer cost through caching, paying off more the more popular static content you serve. Also, **EBS snapshots are billed incrementally** — the first is full, after that only the "changed blocks" are charged, so frequent snapshots do not pay for the whole disk each time, but piled-up old snapshots still need periodic cleanup. When done practicing, remember to delete the test endpoint and objects.

</Cost>

:::warning[🚑 Common real-world mistakes]
- **Assuming transfer cost is the same as storage cost**: S3 storage is cheap; the real cost is often outbound egress, and ignoring it lets the bill quietly explode.
- **Private subnet still detouring via NAT to reach S3**: without a Gateway Endpoint, every GB pays a NAT processing fee — wasted money.
- **Components forced to chat across AZs**: a primary/replica database, cache, and app spread across AZs with high-frequency traffic rack up serious cross-AZ fees; keep frequent talkers in the same AZ.
- **Using public IPs to connect resources in the same VPC**: traffic detours out to the internet and back, pricier than private IPs; use private IPs for internal communication.
- **Forgetting to clean up old EBS snapshots and cross-Region replication**: piled-up incremental snapshots and cross-Region replication (the most expensive transfer) keep burning money without governance.
- **Assuming "within the same Region is free"**: the free dividing line is the **AZ, not the Region**. Same-Region but **cross-AZ** traffic is still charged, and **both directions count** — a multi-AZ high-availability deployment inherently pays this, so do not mistake it for a misconfiguration.
- **Forgetting the NAT Gateway is "double billing"**: it charges a **per-hour fixed fee** (ticking whenever it is up, even with no traffic) **plus a per-GB processing fee**. Cutting traffic but leaving an idle NAT still burns the hourly fee; to save on large traffic, bypass it with a Gateway Endpoint.
- **Turning on cross-Region replication (S3 CRR / DynamoDB global tables / RDS cross-Region replicas) without estimating cost**: cross-Region is the most expensive transfer, and with a lot of data the monthly cost is significant; before enabling it, confirm the "disaster recovery / compliance" need truly requires cross-Region, and do not replicate all your data just for peace of mind.
:::

<Refs title="📚 Official docs & further reading">

- [AWS data transfer pricing overview](https://aws.amazon.com/ec2/pricing/on-demand/#Data_Transfer)
- [Amazon CloudFront pricing](https://aws.amazon.com/cloudfront/pricing/)
- [VPC Endpoints (AWS PrivateLink)](https://docs.aws.amazon.com/vpc/latest/privatelink/what-is-privatelink.html)
- [Gateway VPC Endpoints for S3](https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints-s3.html)
- [NAT Gateway pricing and behavior](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html)
- [Incremental billing of EBS snapshots](https://docs.aws.amazon.com/ebs/latest/userguide/ebs-snapshots.html)

</Refs>

## Next

- ⚡ Quick review: [Domain 4 Flashcards](./flashcards.md)
- ✍️ Test yourself: [Domain 4 Practice Questions](./quiz.md)
- 📖 Next page: [Cost Monitoring & Governance](./cost-monitoring.md)
