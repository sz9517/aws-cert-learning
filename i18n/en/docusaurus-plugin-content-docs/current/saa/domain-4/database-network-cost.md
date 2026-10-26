---
sidebar_position: 5
title: "Database & Network Cost: Pick the Right Pricing Model, Cut Long-Term Spend"
---

# Database & Network Cost: pick the right pricing model and cut long-term spend

> Databases and networking are the two line items that quietly get expensive without you noticing. This page shows you how to pick a database pricing model by "how stable the load is", and where data transfer fees leak out and how to plug them. It is a practical, frequently tested cost-optimization topic in Domain 4.

<Vocab title="📌 Jargon you'll see on this page (fine even if you've never touched AWS)">

- **On-Demand**: **pay for what you use, with no commitment up front**. It bills while running and stops when you stop it — the most flexible, but the highest unit price.
- **Reserved Instance**: **commit to 1 or 3 years in exchange for a big discount**. Great for stable loads you know will keep running.
- **Serverless**: database capacity that **scales automatically with usage** — scaling up when busy, shrinking toward zero when idle — so you never have to guess how big to provision.
- **Read Replica**: a **copy of the database dedicated to serving queries**, making reads faster, but each extra copy is extra cost.
- **NAT Gateway**: the exit that lets machines in a private subnet **reach the internet while the internet cannot reach in**; it bills both per hour and per GB processed.
- **Data Transfer**: the "toll" charged when data **leaves AWS, or moves across Availability Zones or Regions**. Inbound is mostly free; outbound and lateral movement are the pricey parts.

</Vocab>

:::note[💬 Reading tip]
Whenever you see a term with a <Term desc="Like this! Hover over any dotted term (tap on mobile) and a plain explanation pops up.">dotted underline</Term>, hover over it for a plain-language explanation. All terms are also collected in the [Glossary & Services](../../glossary.md).
:::

## Why does this matter? A story where the bill takes a bite

Say your e-commerce database runs on <Term en="Amazon Relational Database Service" desc="A managed relational database service from AWS, supporting engines like MySQL and PostgreSQL, with servers operated by AWS.">RDS</Term> on on-demand pricing, running all year without a break. The load is actually very stable, yet you keep paying the "most flexible, most expensive" on-demand rate — like living somewhere for a whole year but being charged a nightly hotel rate, wasting an easy 30 to 40 percent.

Networking is even worse. Your application sits in a private subnet and needs to fetch files from <Term en="Simple Storage Service" desc="The AWS object storage service, commonly used for files, backups, and static assets.">S3</Term>, so all that traffic detours out through a <Term en="NAT Gateway" desc="An exit gateway that lets machines in a private subnet reach the internet, billed per hour plus per GB processed.">NAT Gateway</Term> — and the gateway **charges per hour and then again per GB processed**, so monthly transfer fees run several times higher than you expected.

For both of these, the problem is not "which service you used" but **the wrong pricing model and traffic path**. The core of selection is to pick a database pricing model by "how stable the load is", and to route traffic down "the cheapest path".

## Database cost: first ask "how stable is the load?"

The single biggest database saving comes down to one sentence: **use "commit for a discount" for stable, predictable loads, and "scale automatically with usage" for variable or unpredictable loads.** Guess wrong and you waste money.

- **Buy Reserved Instances for RDS / <Term en="Amazon Aurora" desc="A cloud-native relational database from AWS, compatible with MySQL and PostgreSQL, with higher performance and availability.">Aurora</Term>**: when the load is steady all year and you know it will keep running, commit to 1 or 3 years and the unit price drops immediately (up to 60 to 70 percent off). Ideal for the primary database of a production environment.
- **Aurora Serverless v2**: best value when the load is **spiky, intermittent, or near-zero overnight** — it **scales up and down with actual usage**, shrinking tiny when idle, so "nobody using it means almost no charge". Great for dev/test environments, seasonal peaks, and rarely used internal systems.
- **Weigh the Read Replica tradeoff**: a read replica can offload heavy queries and make reads faster, but **each extra replica adds another instance fee**. Add one only when "reads far outnumber writes and a single database cannot cope" — do not add them for insurance.
- **Pick the right storage and resilience tier**: backup retention days and Multi-AZ high availability both add cost. A production database should run Multi-AZ for high availability; a dev/test database does not need it and can save half.

<Term en="Amazon DynamoDB" desc="The serverless NoSQL database from AWS, with millisecond latency and on-demand or provisioned throughput.">DynamoDB</Term> has two billing modes, again chosen by the load:

- **On-Demand mode**: for traffic that is **unpredictable and may suddenly spike** — no capacity guessing, AWS handles it. Choose it for brand-new launches, unknown traffic, or peaks that are very hard to predict.
- **Provisioned capacity + Auto Scaling**: cheaper when traffic is **relatively stable and predictable** — you preset read/write capacity units and let Auto Scaling fine-tune within a range, at a unit price far below on-demand.

### Going deeper: the three database pricing models — why pick each, pros/cons, and when not to

You have probably heard all these terms. The hard part is "**why pick this one and not the one next to it**". Here is each model laid out plainly.

**RDS / Aurora Reserved Instance — commit for a discount**

- **Why it exists**: a production primary database is almost always a stable load that "starts once and never stops all year". Since you will keep using it anyway, there is no reason to pay the "most flexible, most expensive" on-demand rate. A reservation is simply "you promise 1 or 3 years, AWS gives you up to 60 to 70 percent off".
- **Pros**: the lowest unit price and the deepest discount; for a database already running on-demand, buying one drops the bill immediately with no architecture change.
- **Cons**: it is a **commitment** — you pay for the whole term even if you shut the database down or traffic collapses. Pick the wrong (oversized) instance class and you cannot return it.
- **When not to use it**: loads that swing wildly, or an environment that **may be shut down in six months** (short-term projects, temporary environments). A 1-year commitment used for 3 months wastes far more in monthly fees than the discount saves.
- **Payment options**: All Upfront gives the deepest discount, Partial Upfront is in between, No Upfront is the shallowest but easiest on cash flow — if cash allows, All Upfront saves the most.

**Aurora Serverless v2 — scale automatically with usage**

- **Why it exists**: some loads are "very busy when busy, almost nobody when idle" (dev/test, internal back-office, seasonal peaks). Fix a big-enough instance and it burns money idling; fix a small one and it buckles at the peak. Serverless v2 lets AWS scale smoothly up and down in **ACU (Aurora Capacity Units)** by actual usage, so you pay only for what you use.
- **Pros**: very low idle cost (can shrink to 0.5 ACU), automatic headroom at peaks, and zero capacity guessing or manual tuning.
- **Cons**: the **per-unit price is higher than a fixed instance** — if the load is actually near-full all the time, Serverless ends up noticeably pricier than a reservation.
- **When not to use it**: a stable load that stays close to full (that belongs on reserved/provisioned). Putting an "always busy" production primary on Serverless means paying the expensive unit price for steady volume, spending more.

**DynamoDB: On-Demand vs Provisioned — one table, two ways to charge**

- **Why On-Demand exists**: when traffic is **completely unpredictable** (a brand-new product, a marketing spike), you simply cannot estimate how much capacity to provision. On-Demand lets AWS absorb any peak, you pay per actual read/write, and you are **never throttled for under-provisioning**. The trade-off is a higher per-request unit price.
- **Why Provisioned + Auto Scaling is cheaper**: when traffic is **relatively stable and estimable**, you pre-buy read/write capacity units (RCU/WCU) at a unit price as low as roughly 1/7 of on-demand, then let Auto Scaling fine-tune within your min/max to both save money and avoid throttling.
- **A simple decision rule**: cannot estimate, worried about peaks → launch on On-Demand and observe; once you have seen the traffic pattern and can estimate → switch to Provisioned to save. You can **switch modes once per day**, so the common play is "start On-Demand, move to Provisioned once stable".

<Analogy title="🍜 Analogy: database billing is like a restaurant booth vs à la carte vs an auto-sizing table">

- **Reserved Instance = a year-round booth**: you tell the restaurant "I will come every week all year" and get a rock-bottom price. The catch: you must actually keep coming; no-shows still pay, which is waste.
- **Aurora Serverless v2 = an auto-sizing table**: one person gets one place setting, ten people trigger extra tables automatically, and it all clears away when they leave. Off-peak costs almost nothing, with no need to book the whole room up front.
- **DynamoDB on-demand = à la carte**: order as much as you want, and the kitchen keeps up even when a crowd pours in; the unit price is a bit higher, but a sudden full house is no problem.
- **DynamoDB provisioned = agreeing on the headcount first**: you know roughly how many people come each day, so you book that many portions for a cheaper rate, and a few extra guests (Auto Scaling) can still add a dish or two.

</Analogy>

:::tip[💡 Exam key point: database cost keyword mapping]
- Question mentions **"stable, predictable, long-running load", "reduce RDS/Aurora cost"** → **Reserved Instance**
- Question mentions **"variable, intermittent load, almost no traffic overnight", "do not want to tune capacity"** → **Aurora Serverless v2**
- Question mentions **"unpredictable traffic, cannot estimate the peak" (DynamoDB)** → **On-Demand mode**
- Question mentions **"stable, predictable traffic", "minimize DynamoDB cost"** → **Provisioned capacity + Auto Scaling**
- See **"reads far outnumber writes, offload queries"** → **Read Replica**, but remember it adds cost
:::

## Network cost: plug the transfer fees leaking out

There are three invisible killers in network bills: **the NAT Gateway double charge, traffic that needlessly detours out, and cross-AZ or cross-Region movement fees.** Plug them one by one.

### NAT Gateway vs NAT Instance

Machines in a private subnet need a NAT to reach the internet. Two ways:

- **NAT Gateway**: fully managed by AWS, automatically highly available, no maintenance — but it **charges both per hour and per GB processed**. At high volume, that per-GB processing fee really adds up.
- **NAT Instance**: run your own EC2 as a NAT, with **no per-GB processing fee**, so it is cheaper per unit for small volumes or tight budgets; but you must handle its high availability, patching, and scaling yourself, and performance is capped by the instance type.

The default exam answer is usually the NAT Gateway (less maintenance), but if the question stresses **"cost-sensitive, low traffic, willing to self-manage"**, the NAT Instance is the money-saving answer.

### Use a VPC Endpoint to save on NAT and transfer fees

This is the most commonly tested saving trick: if your machines are reaching **S3 or DynamoDB**, there is no need to detour out through NAT to the public internet — use a <Term en="VPC Endpoint" desc="An entry that lets resources inside a VPC connect privately to AWS services without going over the public internet, saving NAT and transfer fees.">VPC Endpoint</Term> to route traffic **through the AWS private backbone** straight there:

- **Gateway Endpoint**: dedicated to **S3 and DynamoDB**, **completely free**, and it skips the NAT processing fee and transfer fee. For heavy access to S3/DynamoDB from within a VPC, it is almost a must.
- **Interface Endpoint**: for other services (such as SQS, SNS), built on PrivateLink, billed per hour plus per GB, but still usually cheaper than detouring out through NAT, and more secure.

### VPN vs Direct Connect

To connect your on-premises data center to AWS, there are two paths:

- **Site-to-Site VPN**: an encrypted tunnel over the public internet, with **low up-front cost and up in minutes**, but bandwidth and latency are at the mercy of the public internet. Choose it for occasional, low-volume, or temporary needs.
- **<Term en="AWS Direct Connect" desc="A physical dedicated line from your data center straight to AWS, with stable bandwidth, low latency, and a cheaper per-GB transfer rate at high volume.">Direct Connect</Term> (dedicated line)**: a physical dedicated line straight into AWS, with **high up-front cost and setup time**, but stable bandwidth, low latency, and **a per-GB transfer rate clearly cheaper than the public internet at high volume**. For long-term, stable, high-volume hybrid cloud, Direct Connect is cheaper in the long run.

### Do not ignore cross-AZ / cross-Region traffic fees

Traffic between **Availability Zones (AZ)** within one Region, and **cross-Region** data replication, both incur transfer fees. Placing components that talk to each other frequently in the same AZ, or making good use of private intra-Region traffic, saves a cost that is usually invisible.

### Going deeper: where network fees actually come from, and how to plug them

Many people assume "all data in and out costs money", but the charging direction is actually quite regular — grasp the pattern and you know exactly where to save:

- **Inbound is almost free**: data flowing into AWS from outside mostly carries no transfer fee. So "uploads" are usually not the bill's pain point.
- **Internet egress is the priciest**: data sent out of AWS to users, to another cloud, or to your data center is the biggest line item. **Put <Term en="Amazon CloudFront" desc="The AWS content delivery network (CDN) that caches content at global edge locations to answer users nearby and lower origin egress fees.">CloudFront</Term> (a CDN) in front**, caching content at edge locations to answer users nearby — it is both faster and cheaper per GB than sending straight from the origin.
- **Cross-AZ**: traffic between two AZs in the same Region is **charged once in each direction**. Database primary/standby, or an app tier hitting a database in another AZ, piles up on every request.
- **Cross-Region**: replicating to another Region (DR, global multi-Region deployment) costs even more per GB. Not that you cannot do it, but know "this is money paid for availability", and do not accidentally route traffic to another Region.
- **Within the same AZ, over private IP**: usually free or very low. So gathering frequently chatting components in the same AZ over a private path is the most direct saving.

**The three main moves to cut network fees**: (1) user-facing egress → put CloudFront in front; (2) accessing S3/DynamoDB from within a VPC → open a Gateway Endpoint to bypass NAT; (3) architecturally, keep frequently interacting components in the same Region and AZ, over private IP.

:::info[🔑 The direction people miscalculate most]
**The NAT Gateway "processing fee" and the "data transfer fee" are two separate charges that stack.** Traffic through NAT is first charged a "per-GB processing fee", and if it also exits to the internet it is charged a "egress transfer fee" on top. So the same packet can get bitten twice — which is exactly why "use a Gateway Endpoint instead of detouring through NAT whenever you can" saves so noticeably.
:::

## Database and network cost decision diagram

<div className="flow">
  <div className="flow-node">Which part am I saving on?</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Database load stable? → Reserved Instance / Provisioned capacity</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Variable/intermittent? → Aurora Serverless / DynamoDB on-demand</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Heavy S3/DynamoDB access in a VPC? → Gateway Endpoint</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">High, steady hybrid-cloud traffic? → Direct Connect</div>
</div>

*Diagram: first separate "database" from "network", then ask "is the load stable" and "which path does traffic take", and you converge all the way to the cheapest choice.*

## Real-world application: it's not just for the exam

<Scenario title="Real scenario: your boss says 'database and network fees keep climbing, cut them'">

Checking the bill you find two holes. First, the production Aurora ran all year on on-demand pricing, yet the load has been steady the whole time — that is a 60 percent discount left on the table. Second, the application in a private subnet reads and writes S3 heavily, and all that traffic detours out through the NAT Gateway, so the per-GB processing fee alone eats a large chunk.

The fix: **switch the stable Aurora to a 1-year Reserved Instance**, so the unit price drops immediately; **route the S3-bound traffic through an S3 Gateway Endpoint**, bypassing NAT with no processing fee and no transfer fee. Two cuts, and both the database and network bills drop together. Let's set up the S3 Gateway Endpoint below.

</Scenario>

### 🛠️ Hands-on: create an S3 Gateway Endpoint to bypass NAT

1. In the console search `VPC` → in the left menu pick **Endpoints** → **Create endpoint**.
2. For service category choose **AWS services**, search and select `com.amazonaws.<region>.s3`, and confirm the type is **Gateway**.
3. For **VPC** pick your VPC; for **Route tables** tick the one used by the private subnet (it will auto-add a route pointing to S3).
4. For the policy, start with **Full access** to test, then tighten it once it works. Click **Create endpoint**.
5. From an EC2 in the private subnet, fetch an S3 file via the CLI and confirm it goes through the endpoint rather than NAT (traffic no longer leaves to the public internet).
6. Watch the NAT processing and transfer fees on the bill for a few days, and once confirmed effective, lock it in.

```bash
# Create a Gateway Endpoint pointing to S3 and attach it to the private subnet route table
$ aws ec2 create-vpc-endpoint \
    --vpc-id vpc-your-vpc \
    --service-name com.amazonaws.ap-northeast-1.s3 \
    --route-table-ids rtb-your-private-route-table
```

<Cost>

**Aurora Serverless v2** bills by actual usage and shrinks tiny when idle, so for variable loads it is often cheaper than a fixed instance; but **for stable, predictable traffic, Reserved Instances or provisioned capacity are usually cheaper**, so do not blindly pick Serverless. **The Gateway Endpoint for S3/DynamoDB is completely free**, and it skips the NAT per-GB processing fee and transfer fee — the highest-value trick here. **A NAT Gateway** bills per hour just for being up, plus the per-GB processing fee, so delete it when done practicing. **Direct Connect** has a high up-front cost and only pays off under high, long-term volume.

</Cost>

:::warning[🚑 Common real-world mistakes]
- **Still on on-demand for a stable load**: not buying Reserved Instances for RDS/Aurora you know will run long-term leaves a big discount on the table.
- **Dumping everything into Aurora Serverless**: when traffic is clearly stable and predictable, Serverless can cost more than reserved/provisioned — the wrong direction.
- **Adding read replicas carelessly**: forcing a read replica onto a write-heavy database adds a fee without speeding up queries.
- **Detouring through NAT to reach S3/DynamoDB**: forgetting the Gateway Endpoint means paying NAT processing and transfer fees for nothing (and the endpoint is free).
- **Ignoring cross-AZ / cross-Region traffic fees**: splitting frequently chatting components across different AZs or Regions quietly piles up transfer fees you cannot trace.
- **Forgetting the NAT "processing fee" and "egress transfer fee" stack**: people think the undeletable part is just the fixed hourly charge, but at high volume the "per-GB processing fee" is the big one, and internet egress adds another transfer layer on top. Routing everything that can go through a Gateway Endpoint is the real saving.
- **Mis-estimating DynamoDB provisioned capacity**: estimate too low → hit a peak and get **throttled**, with users seeing `ProvisionedThroughputExceededException` and failed requests; estimate too high → capacity sits idle and you pay for nothing. When unsure, run On-Demand for a week or two to learn the traffic pattern, then switch to Provisioned with Auto Scaling min/max set.
- **Aurora Serverless cold-start and cost blind spots**: v2 can shrink small (0.5 ACU), but the **minimum is not zero**, so leaving it up for long stretches still carries a floor cost; waking it up from near-idle to scale also has a brief scale-up delay. The bigger trap is "using Serverless while the load is actually near-full all the time" — the higher unit price makes the monthly total exceed a reservation. Do not equate "saving money" with "mindlessly using Serverless".
- **Treating cross-Region replication as free insurance**: DR, Global Tables, and cross-Region snapshot copies all keep generating cross-Region transfer fees. Fine to do, but be clear this is a bill paid for availability — do not leave it running unconsciously.
:::

<Scenario title="Real scenario: the DynamoDB bill spikes, traced to 'over-estimated provisioned capacity'">

Your shopping cart runs on DynamoDB. Early on it used On-Demand mode and everything was fine. At some point, "to be safe", you switched to Provisioned capacity, set RCU/WCU very high in case the peak was not enough, and did not enable Auto Scaling.

**Expected result (what you see when it goes wrong)**: mid-month the bill is noticeably higher than last month, but CloudWatch `ConsumedReadCapacityUnits` / `ConsumedWriteCapacityUnits` are far below what you provisioned — meaning you **bought a big chunk of capacity you barely used**, and the gap is all waste.

**Fix and expected result (after fixing)**: go back to On-Demand for two weeks and note the real read/write average and peak; then switch back to Provisioned, set the baseline slightly above the average, and enable **Auto Scaling** (target utilization around 70 percent) so it scales up at peaks and down off-peak. After the change you should see: the bill falls back, the `Consumed` curve hugs the `Provisioned` curve (no more large idle gap), and no `ProvisionedThroughputExceededException` throttling errors at peak.

</Scenario>

<Refs title="📚 Official docs & further reading">

- [Amazon RDS Reserved Instances](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithReservedDBInstances.html)
- [Amazon Aurora Serverless v2 User Guide](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.html)
- [DynamoDB Read/Write Capacity Modes (On-Demand and Provisioned)](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.ReadWriteCapacityMode.html)
- [VPC Endpoints (Gateway and Interface)](https://docs.aws.amazon.com/vpc/latest/privatelink/concepts.html)
- [NAT Gateways](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html)
- [AWS Direct Connect User Guide](https://docs.aws.amazon.com/directconnect/latest/UserGuide/Welcome.html)

</Refs>

## Next

- ⚡ Quick review: [Domain 4 Flashcards](./flashcards.md)
- ✍️ Test yourself: [Domain 4 Practice Questions](./quiz.md)
- 📖 Next page: [Cost Optimization Architecture Decisions](./cost-optimization-decisions.md)
