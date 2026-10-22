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

<Cost>

**Gateway Endpoint (S3 / DynamoDB) is free itself** — one of the rare "set it and save, almost no downside" options. **NAT Gateway** is double billing: a **fixed per-hour fee + a per-GB processing fee**, so steering large traffic away from it has the biggest effect. **CloudFront** lowers origin and outbound transfer cost through caching, paying off more the more popular static content you serve. Also, **EBS snapshots are billed incrementally** — the first is full, after that only the "changed blocks" are charged, so frequent snapshots do not pay for the whole disk each time, but piled-up old snapshots still need periodic cleanup. When done practicing, remember to delete the test endpoint and objects.

</Cost>

:::warning[🚑 Common real-world mistakes]
- **Assuming transfer cost is the same as storage cost**: S3 storage is cheap; the real cost is often outbound egress, and ignoring it lets the bill quietly explode.
- **Private subnet still detouring via NAT to reach S3**: without a Gateway Endpoint, every GB pays a NAT processing fee — wasted money.
- **Components forced to chat across AZs**: a primary/replica database, cache, and app spread across AZs with high-frequency traffic rack up serious cross-AZ fees; keep frequent talkers in the same AZ.
- **Using public IPs to connect resources in the same VPC**: traffic detours out to the internet and back, pricier than private IPs; use private IPs for internal communication.
- **Forgetting to clean up old EBS snapshots and cross-Region replication**: piled-up incremental snapshots and cross-Region replication (the most expensive transfer) keep burning money without governance.
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
