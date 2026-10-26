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

### Why pick a VPC Endpoint? (vs. going through NAT Gateway / the internet)

To get a private subnet talking to S3 you actually have two routes, and they differ a lot:

- **Via NAT Gateway + internet**: EC2 → NAT Gateway → Internet Gateway → public internet → back to S3. The traffic **leaves the AWS private network, crosses the public internet**, then loops back. And a NAT Gateway bills **per hour + per GB** — with large backups that adds up fast.
- **Via a VPC Endpoint**: EC2 → S3 endpoint → S3. The traffic **stays on the AWS backbone** the whole way, in one hop.

In plain terms, why do most exam questions want the VPC Endpoint? Three key wins:

1. **Never touches the public internet (more secure)**: traffic bypasses the Internet Gateway and stays inside AWS end to end. For security / audit / compliance needs (e.g. "data must not traverse the public internet") this is a direct pass — no firewall juggling required.
2. **Saves NAT costs**: the S3 traffic that used to go through NAT now goes through the **free** Gateway endpoint, eliminating those NAT data charges. Many questions asking "**cut costs** while still reaching S3" answer with this.
3. **Simpler and more reliable**: removing the NAT + IGW relay chain means a shorter path, fewer failure points, and no exposure to public-internet congestion.

:::info[🔑 Key idea: an endpoint is NOT "another way to get on the internet"]
A VPC Endpoint only reaches **specific AWS services** (S3, DynamoDB, SQS…). It **cannot** let your host browse arbitrary websites or pull generic internet resources. If a private subnet genuinely needs outbound internet (e.g. `yum update` fetching external packages), that is still the **NAT Gateway**'s job. The two solve different problems — a classic point of confusion in questions.
:::

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

### How to choose between the two: pros, cons, and cost

Memorize one rule first: **"Only S3 and DynamoDB can use a Gateway endpoint; everything else uses an Interface endpoint."** So step one is not "which is better" — it's **which type the service even supports**.

**Gateway endpoint (S3 / DynamoDB)**

- ✅ **Pros**: **completely free**, no bandwidth ceiling (not limited by a single ENIs throughput), dead-simple setup (just add a route). For reaching S3/DynamoDB from **inside the same VPC**, this is the best-value choice.
- ❌ **Cons / limits**: **only supports S3 and DynamoDB**; **cannot be used across VPCs, nor from on-prem over VPN / Direct Connect** (it relies on this VPCs route table, which on-prem machines do not have).
- 💡 **When not to use it**: when you need a service **other than** S3/DynamoDB, or access **from an on-prem data center or another VPC** — then you must switch to an Interface endpoint.

**Interface endpoint (PrivateLink)**

- ✅ **Pros**: **supported by almost every AWS service**; works **across VPCs, across accounts, and from on-prem** (it is a real **private-IP network interface** in your VPC — anyone who can reach that IP can use it); supports fine-grained access control via **Security Groups**.
- ❌ **Cons / cost**: **it costs money** — billed **per endpoint per hour** + **per GB of data**, and it is **one ENI per Availability Zone**, each billed separately, so multi-AZ deployments double up. Leave it idle and it keeps charging.
- 💡 **When not to use it**: if you are just reaching S3/DynamoDB **within the same VPC**, do not pay extra to "standardize on Interface" — use the free Gateway endpoint.

:::tip[💡 Decision in one line]
**Same-VPC access to S3 / DynamoDB → Gateway (free, prefer it); any other service, or cross-VPC / on-prem → Interface (PrivateLink, paid).**
:::

### PrivateLink: expose YOUR OWN service privately to other VPCs

So far the Interface endpoints connected to **official AWS services**. PrivateLinks bigger power is this: you can wrap **your own service** (e.g. a set of APIs behind an NLB) as an **Endpoint Service** and expose it privately to **other VPCs / other AWS accounts**.

- **Provider side (you)**: create a **VPC Endpoint Service** (sitting behind a Network Load Balancer) and decide which accounts may connect.
- **Consumer side (the other VPC)**: create an **Interface endpoint** in their VPC pointing at your service — exactly like consuming a native AWS service.

**Why it matters**: the two VPCs need **no VPC Peering and no public exposure** — traffic stays entirely on the AWS private network, and it is **one-way and one-to-many**: you "push" the service out to many consumers, their VPCs stay isolated from each other, and IP ranges never collide. Common for **SaaS vendors privately selling their product into a customers VPC**, or large enterprises sharing services across internal teams.

<Analogy title="🏢 Analogy: PrivateLink is like a dedicated service window in a building">

You (the provider) open a dedicated window on the ground floor that only serves tenants on an allow-list. Each tenant (consumer VPC) installs an extension line straight to your window (an Interface endpoint) — no need to knock down the wall between the two offices (VPC Peering), and no need to use the front door (the public internet). Each side sees only that window, never the other partys whole office.

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

Create an S3 Gateway endpoint via CLI (remember to pass the route tables to apply to):

```bash
$ aws ec2 create-vpc-endpoint \
    --vpc-id vpc-0abc123 \
    --vpc-endpoint-type Gateway \
    --service-name com.amazonaws.ap-northeast-1.s3 \
    --route-table-ids rtb-0def456
```

**Expected result**: a JSON blob comes back, `State` moves from `pending` to `available` shortly, and the route table you specified **automatically gains a route** whose destination is S3 (a managed prefix list `pl-xxxx`) and whose target is this endpoint (`vpce-xxxx`). Only once that route appears does private-subnet traffic actually use the endpoint instead of NAT.

List the endpoints in a VPC via CLI to confirm status:

```bash
$ aws ec2 describe-vpc-endpoints \
    --query "VpcEndpoints[].{ID:VpcEndpointId,Service:ServiceName,Type:VpcEndpointType}"
```

**Expected result**: one row per endpoint, showing `ID` (`vpce-...`), `Service` (e.g. `...s3`), and `Type` (`Gateway` or `Interface`). To verify end to end, run `aws s3 ls` from an EC2 in the private subnet (with no public route) — if it still lists buckets, the traffic is going through the endpoint.

<Cost>

**Gateway endpoints (S3 / DynamoDB) are completely free** — and they can even save you the NAT Gateway data charges you'd otherwise pay. It's one of the rare settings that is "more secure *and* cheaper."
**Interface endpoints** bill "per hour + per GB", so delete them when unused.

</Cost>

:::warning[🚑 Common pitfalls]
- **Only S3 and DynamoDB are Gateway endpoints**: trying to reach SQS / Kinesis / SNS / ECR… with a Gateway endpoint never works — everything else goes through an **Interface endpoint**. This is the exam's favorite trap, so burn it in.
- **Forgetting to update the route table for a Gateway endpoint**: a Gateway endpoint **works via the route table**. If you do not select the route table associated with the EC2's subnet when creating it, traffic will not use the endpoint (it may still loop through NAT, or fail entirely). Symptom: the endpoint is `available` but has no effect — go check whether the **route table has that route pointing at `vpce-`**.
- **Private DNS not enabled on an Interface endpoint**: for an Interface endpoint to answer the **original service hostname** (e.g. `sqs.ap-northeast-1.amazonaws.com`) with the endpoint's private IP, you must **enable Private DNS** (and the VPC's `enableDnsSupport` + `enableDnsHostnames` must both be on). Otherwise your code still resolves the public IP and bypasses the endpoint.
- **The Interface endpoint's Security Group blocks 443**: an Interface endpoint is an ENI, so it is governed by a **Security Group**. You must **allow inbound TCP 443 (HTTPS) from your clients** on the endpoint's SG, or connections time out. This is the most common cause of "the endpoint is built but I cannot connect."
- **An endpoint policy that locks you out**: the endpoint policy defaults to "full access," but if you add a custom policy that is too tight (e.g. only one bucket / one action), the request gets denied at the **endpoint layer** even when the network is fine (typical error: `Access Denied`). Remember the endpoint policy, the S3 bucket policy, and IAM policy are **three gates that all must pass**.
- **Thinking an endpoint provides general internet access**: it only reaches **specific AWS services**, not the open internet (getting online is the job of NAT / IGW).
:::

<Refs title="📚 Official docs & further reading">

- [AWS PrivateLink concepts](https://docs.aws.amazon.com/vpc/latest/privatelink/concepts.html)
- [Gateway endpoints (S3 / DynamoDB)](https://docs.aws.amazon.com/vpc/latest/privatelink/gateway-endpoints.html)

</Refs>

## Next

- 📖 Next page: [S3 Data Security](./s3-security.md)
- ⚡ Review: [Domain 1 Flashcards](./flashcards.md)
