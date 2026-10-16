---
sidebar_position: 3.5
title: "Private Connectivity: VPC Endpoints / PrivateLink"
---

# Private Connectivity: VPC Endpoints and PrivateLink

> "How do I let an EC2 in a private subnet reach S3 **without the traffic ever touching the internet**?" — this is a **very high-frequency** SAA question. The answer is almost always a **VPC Endpoint**.

<Vocab title="📌 Jargon you'll see on this page">

- **VPC (Virtual Private Cloud)**: your private virtual network inside AWS.
- **Private subnet**: a subnet with no route to the internet — hosts in it can't reach the internet.
- **NAT Gateway**: a relay that lets private-subnet hosts make **outbound-only** internet connections — billed **per hour + per GB**.
- **VPC Endpoint**: a private "direct line" to an AWS service inside your VPC — traffic **never goes over the internet**.
- **PrivateLink**: the underlying technology behind Interface endpoints; it pulls a service into your VPC via a private-IP network interface.

</Vocab>

## Why do you need it?

<Scenario title="Real scenario: database backups must go to S3, but 'no public internet' is the rule">

Your EC2 sits in a private subnet and needs to push backups to S3. The traditional approach is to stand up a **NAT Gateway** so it can reach the internet and loop around to S3 — but that puts traffic on the public internet and you pay NAT data charges. Security wants the traffic to **stay entirely inside the AWS network**. That's exactly what a **VPC Endpoint** is for: a private shortcut straight to S3 — cheaper and safer.

</Scenario>

## Two endpoint types: one table to tell them apart (heavily tested)

AWS has two kinds of VPC Endpoint, and the exam **loves asking "which service uses which"**:

| Comparison | **Gateway endpoint** | **Interface endpoint (PrivateLink)** |
| --- | --- | --- |
| Supported services | **Only S3 and DynamoDB** | **Most other services** (SQS, SNS, Kinesis, API Gateway…) |
| How it works | Adds a route in the **route table** to the service | Places a **private-IP network interface (ENI)** in the subnet |
| Cost | **Completely free** | Billed **per hour + per GB** |
| Access control | Endpoint policy | Endpoint policy + **Security Group** |
| Cross-VPC / on-prem access | ❌ No | ✅ Yes (via PrivateLink) |

<Analogy title="🚪 Analogy: two ways into the office building">

- **Gateway endpoint = a dedicated back-door lane**: only leads to the two "big tenants" S3 and DynamoDB, and it's completely free.
- **Interface endpoint = installing a direct extension line for a service on your floor**: almost any service can have one, but there's a monthly line fee + call charges.

</Analogy>

## Diagram: with vs. without an endpoint

<div className="flow">
  <div className="flow-node">EC2 in private subnet</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">NAT Gateway (data charges)</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Internet</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">S3</div>
</div>

*Traditional: a big detour over the public internet, and you pay NAT fees.*

<div className="flow">
  <div className="flow-node">EC2 in private subnet</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">S3 Gateway endpoint (free, private)</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">S3</div>
</div>

*With an endpoint: one hop, traffic stays inside AWS, and the Gateway endpoint is free.*

:::tip[💡 Exam focus]
- "Access **S3 / DynamoDB**, must be **private and cheap**" → **Gateway endpoint (free)**.
- "Access a service **other than S3 / DynamoDB**", or "reach a service across VPCs / from on-prem" → **Interface endpoint (PrivateLink)**.
- "**Remove the NAT Gateway to cut costs** while still reaching S3" → **Gateway endpoint**.
:::

## Real-world application

### 🛠️ Hands-on: create a Gateway endpoint for S3

1. Console → `VPC` → left menu **Endpoints** → **Create endpoint**
2. Service category **AWS services**, search and pick `com.amazonaws.<region>.s3`, type **Gateway**
3. Choose your VPC
4. Select the **route tables** to apply to (AWS adds a route to S3 for them automatically)
5. Leave the endpoint policy as the default "Full access" → Create

List the endpoints in a VPC via CLI:

```bash
$ aws ec2 describe-vpc-endpoints \
    --query "VpcEndpoints[].{ID:VpcEndpointId,Service:ServiceName,Type:VpcEndpointType}"
```

<Cost>

**Gateway endpoints (S3 / DynamoDB) are completely free** — and they can even save you the NAT Gateway data charges you'd otherwise pay. It's one of the rare settings that is "more secure *and* cheaper."
**Interface endpoints** bill "per hour + per GB", so delete them when unused.

</Cost>

:::warning[🚑 Common mistakes]
- **Trying to reach SQS / Kinesis with a Gateway endpoint**: no! Gateway endpoints **only support S3 and DynamoDB**; other services need an Interface endpoint.
- **Created an endpoint but still can't connect**: for Gateway endpoints, confirm the **correct route tables are selected**; for Interface endpoints, confirm the **Security Group allows 443**.
- **Thinking an endpoint provides general internet access**: it only reaches **specific AWS services**, not the open internet (that's the job of NAT / IGW).
:::

<Refs title="📚 Official docs & further reading">

- [AWS PrivateLink concepts](https://docs.aws.amazon.com/vpc/latest/privatelink/concepts.html)
- [Gateway endpoints (S3 / DynamoDB)](https://docs.aws.amazon.com/vpc/latest/privatelink/gateway-endpoints.html)

</Refs>

## Next

- 📖 Next page: [S3 Data Security](./s3-security.md)
- ⚡ Review: [Domain 1 Flashcards](./flashcards.md)
