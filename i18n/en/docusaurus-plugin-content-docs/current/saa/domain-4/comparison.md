---
sidebar_position: 7
title: Service Comparison & Exam Cheat Sheet
---

# Domain 4 Service Comparison & Exam Cheat Sheet

> This page collects the **most easily confused** services and pricing models in Domain 4 (cost-optimized design) into comparison tables — the most efficient thing to skim right before the exam. Each table is followed by a one-line "**How to choose on the exam**" tip: spot the keyword in the question stem and map it straight to the answer.

:::tip How to use this page
Cost-optimization questions are almost always about "**selection trade-offs**": options that all work are placed together, and a qualifier like "lowest cost / least operational overhead / commit for a discount / tolerant of interruption" forces you to choose. Remember the one cell that tells you what each option "commits to, saves, and sacrifices" — that is your decision point.
:::

## 1. Compute pricing: On-Demand vs Reserved Instances vs Savings Plans vs Spot vs Dedicated Hosts

| Item | On-Demand | Reserved Instances (RI) | Savings Plans | Spot | Dedicated Hosts |
|---|---|---|---|---|---|
| Commitment | None | 1 or 3 years | 1 or 3 years | None | On-demand or 1/3 years |
| Discount | None (most expensive) | Up to about 70 percent | Up to about 70 percent | Up to about 90 percent | On-demand or reserved discount |
| Flexibility | Highest | Tied to instance type/Region (varies) | **Tied to dollar spend, more flexible across type/Region** | High | Low (tied to a physical host) |
| Can be interrupted | No | No | No | **Yes (AWS can reclaim anytime)** | No |
| Best for | Short-term, uncertain load | Steady, predictable long-term load | Steady load but wants flexibility | Interruptible batch, fault-tolerant jobs | Compliance/licensing tied to physical host |

**How to choose on the exam**: stem says "**steady, predictable, long-term load to save money**" → **Reserved Instances or Savings Plans**; need **more flexibility across instance type/Region** → **Savings Plans**; "**interruptible, stateless, batch or fault-tolerant**" for the deepest savings → **Spot**; "**short-term, temporary, uncertain**" → **On-Demand**; "**software licensing tied to physical hardware / compliance needs dedicated hardware**" → **Dedicated Hosts**.

## 2. S3 storage classes: Standard / Intelligent-Tiering / Standard-IA / One Zone-IA / Glacier trio / Deep Archive

| Storage class | Retrieval speed | Storage cost | Minimum storage days | Retrieval fee | Best for |
|---|---|---|---|---|---|
| **Standard** | Instant (ms) | Highest | None | None | Frequently accessed hot data |
| **Intelligent-Tiering** | Instant | Auto-adjusts by tier | None | None (small monitoring fee) | **Unknown or changing access patterns** |
| **Standard-IA** | Instant | Cheaper | 30 days | Yes | Infrequent access but needs it immediately |
| **One Zone-IA** | Instant | Even cheaper (about 20 percent less than Standard-IA) | 30 days | Yes | Re-creatable, non-critical, infrequent |
| **Glacier Instant Retrieval** | Instant (ms) | Very cheap | 90 days | Yes | Archive but occasionally needs it instantly |
| **Glacier Flexible Retrieval** | Minutes to hours | Even cheaper | 90 days | Yes | Archive, can wait for retrieval |
| **Glacier Deep Archive** | Hours (within 12) | **Cheapest** | 180 days | Yes (slowest, cheapest) | Long-term archive, almost never retrieved |

**How to choose on the exam**: "**access pattern unknown or changing, do not want to move data manually**" → **Intelligent-Tiering**; "**infrequent access but needs it immediately**" → **Standard-IA**; "**re-creatable, non-critical, single AZ to save money**" → **One Zone-IA**; "**archive but occasionally needs millisecond retrieval**" → **Glacier Instant Retrieval**; "**long-term archive, rarely retrieved, kept for years for compliance, lowest cost**" → **Glacier Deep Archive**. Watch the "**minimum storage days**" trap: do not put data that changes daily into IA/Glacier.

## 3. Reducing data transfer cost: CloudFront vs Gateway Endpoint vs Interface Endpoint/PrivateLink vs same-AZ deployment

| Technique | What it saves | Cost | When to use |
|---|---|---|---|
| **CloudFront** | Saves **internet data-transfer-out**, edge cache reduces origin fetches | Per transfer + requests, often cheaper than serving straight from origin | Public websites/video/static content distributed globally |
| **VPC Gateway Endpoint** | Saves **NAT processing and transfer fees** (access to S3/DynamoDB) | **Free** | Heavy access to S3/DynamoDB from inside a VPC |
| **Interface Endpoint / PrivateLink** | Saves transfer fees of routing out through NAT, traffic stays on the AWS private path | Per hour + per traffic (still often cheaper than routing via NAT) | Private access to other services (SQS, SNS, etc.) from a VPC |
| **Same-AZ deployment** | Saves **cross-AZ / cross-Region** data transfer fees | No extra fee (traffic within one AZ is mostly free) | Components that talk frequently placed in one AZ |

**How to choose on the exam**: "**large internet data-transfer-out, cacheable content**" → **CloudFront**; "**access S3/DynamoDB from a VPC to save NAT and transfer fees**" → **Gateway Endpoint (free)**; "**private access to SQS/SNS and other services from a VPC**" → **Interface Endpoint/PrivateLink**; "**moving lots of data cross-AZ between components is expensive**" → **place them in the same AZ**.

## 4. Cost monitoring tools: Cost Explorer vs Budgets vs Cost and Usage Report vs Cost Anomaly Detection

| Tool | Main purpose | Granularity/form | When to use |
|---|---|---|---|
| **Cost Explorer** | **Analyze trends**, visualize, forecast | Charts, interactive queries | Want to see where money went and roughly what is coming |
| **Budgets** | **Set thresholds, alert on overrun** | Set budget amount/usage + notifications | Want an alert when cost or usage crosses a value |
| **Cost and Usage Report (CUR)** | **Finest line-item** raw data | Hourly/per-resource, load into S3 and query with Athena | Need deep allocation, custom analysis, auditing |
| **Cost Anomaly Detection** | **Automatically catch anomalous** spend | Machine learning auto-detection + notifications | Want to automatically find unexpected spikes |

**How to choose on the exam**: "**analyze historical trends, visualize, forecast**" → **Cost Explorer**; "**alert when a threshold is crossed**" → **Budgets**; "**need the finest per-resource, hourly raw line items**" → **Cost and Usage Report**; "**automatically detect unexpected anomalous spend**" → **Cost Anomaly Detection**.

## 5. Database pricing choice: RDS/Aurora RI vs Aurora Serverless v2 vs DynamoDB on-demand vs DynamoDB provisioned + Auto Scaling

| Option | Load pattern | Billing | When to use |
|---|---|---|---|
| **RDS/Aurora Reserved Instances (RI)** | Steady, predictable | Commit 1/3 years for a discount | Production running steadily long-term |
| **Aurora Serverless v2** | **Variable, intermittent, hard to predict** | Pay per actual usage (ACU), auto scales up/down | Dev/test, relational load with unpredictable peaks |
| **DynamoDB on-demand** | **Bursty, unpredictable** | Pay per actual read/write requests | Traffic swings wildly, uncertain new launch |
| **DynamoDB provisioned + Auto Scaling** | Predictable, regular | Provisioned capacity + rule-based auto scaling | Regular load, provisioned saves more |

**How to choose on the exam**: "**database load is steady and runs long-term, save money**" → **RDS/Aurora RI**; "**relational but variable, intermittent, hard-to-predict load**" → **Aurora Serverless v2**; "**NoSQL with bursty, unpredictable traffic**" → **DynamoDB on-demand**; "**NoSQL with predictable load, save further**" → **DynamoDB provisioned + Auto Scaling**. Rule of thumb: variable load goes Serverless/on-demand, steady load goes RI/provisioned.

## 6. Network cost choice: NAT Gateway vs NAT Instance vs VPC Endpoint vs Direct Connect

| Option | Cost profile | Operational overhead | When to use |
|---|---|---|---|
| **NAT Gateway** | Per hour + per-GB processing fee (double billing) | Fully managed, no ops, auto high availability | Default way for a private subnet to reach the internet |
| **NAT Instance** | Lower unit price, **no per-GB processing fee** | Must handle HA, patching, scaling yourself | Cost-sensitive, low traffic, can accept self-managed ops |
| **VPC Endpoint** | **Gateway endpoint is free**; interface endpoint is per hour + traffic | Low | Access S3/DynamoDB (Gateway) or other services (Interface) from a VPC |
| **Direct Connect** | High upfront and build cost, but cheaper per-GB at high volume | Medium (needs a physical line) | Long-term, steady, high-volume hybrid cloud |

**How to choose on the exam**: "**private subnet reaching out, wants no ops**" → **NAT Gateway**; "**low traffic, cost-sensitive, can accept self-managed ops**" → **NAT Instance**; "**access S3/DynamoDB from a VPC for free to save NAT**" → **VPC Gateway Endpoint**; "**long-term steady high-volume hybrid cloud to lower transfer unit price**" → **Direct Connect**.

---

- ⚡ Quick review: [Domain 4 Flashcards](./flashcards.md)
- ✍️ Test yourself: [Domain 4 Practice Questions](./quiz.md)
