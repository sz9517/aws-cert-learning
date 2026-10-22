---
sidebar_position: 9
title: Practice Questions
---

# Domain 4 Practice Questions (official exam style)

Pick your answer first, then click "**Show answer & explanation**". This page mirrors the SAA-C03 official style: **scenario-based stems**, options that are all plausible AWS services (distractors are not obviously wrong), and deliberate **qualifiers** like "MOST cost-effective / LEAST operational overhead / lowest cost" to force a trade-off. It includes both **single-answer** and **multiple-answer (Choose TWO)** questions. All questions are **original** content (not real exam questions).

<Quiz
  qnum={1}
  total={18}
  question="A company runs a fleet of production web servers whose traffic is steady and predictable, runs 365 days a year, and cannot be interrupted. The team wants the most cost-effective billing without being locked to a specific instance type, so it can stay flexible for future changes. Which approach fits best?"
  options={[
    'Keep everything On-Demand to retain maximum flexibility',
    'Buy Compute Savings Plans with an hourly usage commitment',
    'Move the servers to Spot Instances for the biggest discount',
    'Buy whole EC2 Dedicated Hosts',
  ]}
  answer={1}>

**Correct: B**

"Steady, predictable, always-on, cannot be interrupted, plus flexibility across instance types" best matches **Compute Savings Plans**, which discount an hourly compute spend commitment and apply across instance types, Regions, and EC2, Fargate, and Lambda. A On-Demand pays list price every day and is most expensive for steady loads; C Spot gets reclaimed and does not suit production servers that cannot be interrupted; D Dedicated Hosts are the most expensive and are meant for compliance or BYOL only.

</Quiz>

<Quiz
  qnum={2}
  total={18}
  question="A team runs a nightly video-transcoding batch. The work is stateless, discarded after each run, and tolerates interruption because it can simply be retried. The team wants the lowest possible cost for this batch. Which pricing model fits best?"
  options={[
    'On-Demand instances',
    'Reserved Instances (3-year all upfront)',
    'Spot Instances',
    'Dedicated Hosts',
  ]}
  answer={2}>

**Correct: C**

"Stateless + retryable + interruption-tolerant + lowest cost" is the classic **Spot** scenario, saving up to about 90 percent, with roughly a 2-minute interruption notice before reclaim. A On-Demand has no discount; B Reserved Instances are a long-term commitment suited to steady always-on loads, not a short nightly batch; D Dedicated Hosts are the most expensive and unrelated to this need.

</Quiz>

<Quiz
  qnum={3}
  total={18}
  question="A manufacturer is migrating a legacy system to AWS. The software license is priced per physical core, requires bring-your-own-license (BYOL), and demands a dedicated physical host, while the load runs steadily over the long term. Which TWO choices together best satisfy both the compliance and the cost needs? (Choose TWO)"
  options={[
    'Use EC2 Dedicated Hosts to meet the dedicated-physical-host and BYOL needs',
    'Buy a Reserved or Savings Plans commitment for this steady long-running host to lock in a discount',
    'Move the system to Spot Instances for the lowest unit price',
    'Switch to AWS Lambda to avoid managing any servers',
    'Keep On-Demand and disable all discount plans',
  ]}
  answer={[0, 1]}>

**Correct: A, B**

"License bound to physical cores + BYOL + dedicated physical host" can only be met by **Dedicated Hosts (A)**; and because the load is steady long term, buying a **Reserved or Savings Plans commitment (B)** locks in a discount to reduce the long-term cost. C Spot gets reclaimed and does not suit an always-on licensed system; D Lambda gives no OS-level or physical-host control and cannot satisfy BYOL compliance; E keeping On-Demand leaves the discount on the table and is least cost-effective.

</Quiz>

<Quiz
  qnum={4}
  total={18}
  question="A company stores files uploaded by users of a newly launched app. The access frequency is unknown and changes over time: some files are read daily for two weeks and then rarely touched. The team does not want to manage tiering manually and wants the most cost-effective storage. Which S3 storage class fits best?"
  options={[
    'S3 Standard',
    'S3 Intelligent-Tiering',
    'S3 Glacier Deep Archive',
    'S3 One Zone-IA',
  ]}
  answer={1}>

**Correct: B**

"Unknown or changing access frequency + no manual tiering" is exactly the role of **Intelligent-Tiering**, which moves objects between cold and hot tiers automatically with no retrieval fee. A Standard is too expensive for cold data; C Deep Archive takes hours to retrieve and does not suit data that may become hot again at any time; D One Zone-IA stores in a single Availability Zone (AZ), suits only recreatable non-critical data, and does not auto-tier.

</Quiz>

<Quiz
  qnum={5}
  total={18}
  question="A financial company must retain audit records for seven years by regulation. The data is almost never retrieved, and even when it is, a wait of several hours is acceptable. The team wants the lowest storage cost. Which S3 storage class fits best?"
  options={[
    'S3 Standard-IA',
    'S3 Glacier Instant Retrieval',
    'S3 Glacier Deep Archive',
    'S3 Intelligent-Tiering',
  ]}
  answer={2}>

**Correct: C**

"Long-term archive + almost never retrieved + several-hour wait acceptable + lowest cost" maps directly to **Glacier Deep Archive**, which has the lowest per-GB storage price. A Standard-IA still costs far more to store than Glacier and only pays off when immediate retrieval is needed; B Glacier Instant Retrieval is built for occasional millisecond retrieval and costs more; D Intelligent-Tiering suits data with unknown access, not the lowest-cost deep archive.

</Quiz>

<Quiz
  qnum={6}
  total={18}
  question="A team has an S3 bucket holding five years of logs, all in S3 Standard, many of which are rarely read; the bucket also has versioning enabled and the old versions were never cleaned up. The team wants to auto-demote cold data and delete expired data with the least operational overhead. Which approach fits best?"
  options={[
    'Write a nightly script that manually moves and deletes objects',
    'Configure an S3 Lifecycle policy to transition to cheaper classes and expire current and noncurrent versions',
    'Change the whole bucket to Glacier Deep Archive at once',
    'Disable versioning to avoid old versions piling up',
  ]}
  answer={1}>

**Correct: B**

"Auto-demote cold data + clean up expired and old versions + least operational overhead" is exactly the job of an **S3 Lifecycle policy**, which can transition objects to colder classes and expire both current and noncurrent versions. It runs automatically after a single setup. A a custom script carries the highest operational overhead; C archiving data that is still read hot triggers retrieval fees and minimum-storage-duration charges; D disabling versioning cannot handle the existing old versions and does not demote cold data.

</Quiz>

<Quiz
  qnum={7}
  total={18}
  question="A media site stores many images and videos in S3 and lets users worldwide download directly, with popular files downloaded tens of thousands of times, so the outbound transfer (egress) cost has spiked. The team wants the most cost-effective way to cut outbound transfer cost. Which approach fits best?"
  options={[
    'Replicate the S3 bucket into every Region where users live',
    'Put Amazon CloudFront in front of S3 to serve from edge caches and reduce origin traffic',
    'Change all objects to S3 One Zone-IA to save storage cost',
    'Create a separate NAT Gateway for each user',
  ]}
  answer={1}>

**Correct: B**

"Heavy outbound downloads + repeated popular content + reduce outbound transfer cost" best fits **CloudFront (CDN)**: popular files are cached at edge locations so repeated downloads serve from cache and no longer hit the origin, and CloudFront egress rates are usually cheaper, with no transfer fee to fetch from S3 as origin. A cross-Region replication only adds cost and complexity; C One Zone-IA saves storage cost, not outbound transfer cost; D a NAT Gateway is a private-subnet outbound exit, unrelated to user-facing content delivery.

</Quiz>

<Quiz
  qnum={8}
  total={18}
  question="EC2 instances in a company private subnet back up large logs to Amazon S3 every night. Because they have no public IP, the traffic all routes through a NAT Gateway, and the per-GB processing fee is inflating the bill. The team wants the most cost-effective way to stop routing this traffic through NAT. Which approach fits best?"
  options={[
    'Assign public IPs to the instances so they reach S3 directly',
    'Create an S3 Gateway VPC Endpoint so traffic stays on the AWS internal network and is free',
    'Switch to an Interface Endpoint (PrivateLink) to reach S3',
    'Change the backups to cross-Region replication to another Region',
  ]}
  answer={1}>

**Correct: B**

For access to S3 and DynamoDB, a **Gateway VPC Endpoint** routes traffic back to the AWS internal network via the route table, is itself free, and removes the per-GB NAT processing fee and outbound transfer cost, making it the best value. A public IPs still route over the internet, add egress cost, and are less secure; C an Interface Endpoint is billed per hour and per GB, so the free Gateway Endpoint is cheaper for S3; D cross-Region replication is the most expensive transfer and the opposite direction.

</Quiz>

<Quiz
  qnum={9}
  total={18}
  question="Transfer costs on a system keep creeping up, and investigation finds two sources: a primary and replica database split across different Availability Zones (AZ) with heavy chatter, and EC2 in a private subnet reaching DynamoDB by routing through NAT to the internet. Which TWO actions best reduce these transfer costs? (Choose TWO)"
  options={[
    'Place the heavily communicating components in the same AZ to avoid cross-AZ transfer fees',
    'Create a Gateway VPC Endpoint for DynamoDB so traffic stays internal and NAT cost drops',
    'Replicate the database to another Region to spread the traffic',
    'Assign public IPs to each EC2 to reach DynamoDB over the internet directly',
    'Double the number of NAT Gateways to raise throughput',
  ]}
  answer={[0, 1]}>

**Correct: A, B**

Heavy cross-AZ chatter calls for **placing communicating components in the same AZ (A)**, since private-IP traffic within one AZ is free; reaching DynamoDB through NAT calls for a **Gateway VPC Endpoint (B)** (free, for S3 and DynamoDB) that stays internal and removes the NAT processing fee and outbound transfer cost. C cross-Region replication is the most expensive transfer and only costs more; D public IPs still route over the internet, incur egress, and are less secure; E doubling NAT Gateways only doubles the fixed hourly fee and solves nothing.

</Quiz>

<Quiz
  qnum={10}
  total={18}
  question="Finance at a company finds this month bill is three times last month, but the bill shows only a pile of service names and numbers. They want to visually break down the spend trend, find which service is most expensive, and forecast the next few months. Which tool fits best?"
  options={[
    'AWS Cost and Usage Report (CUR)',
    'AWS Cost Explorer',
    'AWS Budgets',
    'AWS CloudTrail',
  ]}
  answer={1}>

**Correct: B**

"Visual trend + break down by service, account, or tag + find the big spenders + forecast future spend" is the core job of **Cost Explorer**. A CUR is the most detailed line-by-line billing data exported to S3 for deep analysis, not a drag-and-drop trend view; C Budgets sets threshold alerts rather than analyzing trends; D CloudTrail records API activity, unrelated to cost analysis.

</Quiz>

<Quiz
  qnum={11}
  total={18}
  question="A company wants to avoid finding out about a spike only at month end, and wants an automatic notification when cost shows an abnormal spike, without a human watching charts. Which service fits best?"
  options={[
    'AWS Budgets with a fixed dollar threshold',
    'AWS Cost Anomaly Detection',
    'AWS Trusted Advisor',
    'AWS Compute Optimizer',
  ]}
  answer={1}>

**Correct: B**

"Automatically detect abnormal cost spikes + no human watching" is exactly **Cost Anomaly Detection**, which uses machine learning to learn normal spend patterns and alerts on anomalies. A Budgets watches whether you cross a fixed threshold you set, not anomalous patterns; C Trusted Advisor finds idle or low-usage resources across several pillars; D Compute Optimizer does right-sizing for EC2 and Lambda.

</Quiz>

<Quiz
  qnum={12}
  total={18}
  question="An enterprise has many accounts under AWS Organizations, one per department, and wants centralized management and simpler reconciliation, with usage across accounts aggregated for larger volume discounts and shared reserved plans. Which approach fits best?"
  options={[
    'Manually adjust resources and discounts in each account separately',
    'Use AWS Organizations Consolidated Billing',
    'Enable Cost Explorer only in the management account',
    'Set a separate Budgets budget per account',
  ]}
  answer={1}>

**Correct: B**

"Centralized multi-account, aggregated usage for volume discounts, shared RI and Savings Plans" is exactly what **Organizations Consolidated Billing** delivers. A adjusting each account by hand cannot aggregate usage or share reserved plans; C Cost Explorer only views spend and does not consolidate billing or aggregate discounts; D separate budgets only alert and are unrelated to consolidated savings.

</Quiz>

<Quiz
  qnum={13}
  total={18}
  question="An internal reporting system is used only during business hours, with almost no traffic at night and on weekends, and the load swings and is hard to predict. The team does not want to guess capacity or pay for idle off-peak hours, and wants the most cost-effective relational database. Which fits best?"
  options={[
    'RDS with a 3-year Reserved Instance',
    'Amazon Aurora Serverless v2',
    'A fixed-size self-managed MySQL on EC2',
    'RDS On-Demand left running all the time',
  ]}
  answer={1}>

**Correct: B**

"Load swings, intermittent, almost no traffic off-peak, no capacity guessing" is the scenario for **Aurora Serverless v2**, which scales capacity up and down with real usage and shrinks to very small when idle, so idle time costs almost nothing. A a Reserved Instance is a commitment to steady long-term usage and mostly sits idle for an intermittent load; C a fixed-size self-managed database needs operations and pays for the whole instance off-peak; D On-Demand left running still pays for idle on a variable load.

</Quiz>

<Quiz
  qnum={14}
  total={18}
  question="A company data center needs a long-term, steady, high-volume connection to AWS. The transfer cost is already significant, and the team wants to lower the per-GB rate and get a steady low-latency link. Which approach fits best?"
  options={[
    'Site-to-Site VPN over an encrypted internet tunnel',
    'AWS Direct Connect',
    'Route the data center traffic through a NAT Gateway',
    'Send all traffic through an Internet Gateway',
  ]}
  answer={1}>

**Correct: B**

"Long-term + steady + high-volume + lower per-GB rate and steady low latency" is the scenario for **Direct Connect**, which has higher upfront cost and setup time but a clearly lower per-GB transfer rate than the internet at high volume. A Site-to-Site VPN is cheap upfront and fits occasional small traffic, but bandwidth and latency depend on the internet; C a NAT Gateway is a private-subnet outbound exit, not a data-center interconnect; D an Internet Gateway is just the VPC public entry and exit and offers no private line or steady low latency.

</Quiz>

<Quiz
  qnum={15}
  total={18}
  question="An e-commerce company ran its production Aurora on On-Demand for a whole year with a consistently steady load, and it also has a dev and test database used only intermittently during business hours. The team wants to re-arrange billing for both in the most cost-effective way without hurting production stability. Which TWO actions fit best? (Choose TWO)"
  options={[
    'Move the steady production Aurora to a 1-year Reserved Instance to lock in the discount',
    'Move the dev and test database to Aurora Serverless v2 so it shrinks automatically when idle',
    'Move production to Spot for the lowest unit price',
    'Add three more read replicas to production just in case',
    'Keep both databases On-Demand and leave them running all the time',
  ]}
  answer={[0, 1]}>

**Correct: A, B**

A steady, predictable production load points to a **Reserved Instance to lock in the discount (A)** (up to about 60 to 70 percent); an intermittent dev and test database with idle off-peak points to **Aurora Serverless v2 (B)**, which shrinks when idle and costs almost nothing. C Spot gets reclaimed and must not host a production database; D adding read replicas "just in case" only pays for extra instances without speeding reads; E keeping both On-Demand and always on is the least cost-effective choice.

</Quiz>

<Quiz
  qnum={16}
  total={18}
  question="A company runs a web site that runs on a daily schedule with high traffic by day and low by night, plus a monthly batch job that tolerates interruption, plus a pile of logs untouched for three years all in S3 Standard. It wants to reorganize in the MOST cost-effective way with the LEAST operational overhead. Which combination fits best?"
  options={[
    'Savings Plans for the web site, Spot for the batch, and Lifecycle to Glacier Deep Archive for the old logs',
    'Switch everything to On-Demand and manually shut down off-peak',
    'Spot for the web site, Reserved Instances for the batch, and leave the old logs in S3 Standard',
    'Move everything to a self-managed EC2 cluster the team operates by hand',
  ]}
  answer={0}>

**Correct: A**

This combined scenario maps one layer at a time: the steady long-running web site points to **Savings Plans or RI** to lock in a discount; the interruption-tolerant batch points to **Spot** (up to about 90 percent off); the three-year-old logs point to an **S3 Lifecycle move to Glacier Deep Archive**. All of it is configuration, not new infrastructure, so operational overhead barely rises. B manual shutdowns raise overhead and save little; C puts the web site that cannot be interrupted on Spot and ties the steady batch to Reserved, which is backwards; D a self-managed cluster run by hand is almost never the least-operational-overhead answer.

</Quiz>

<Quiz
  qnum={17}
  total={18}
  question="A company needs to run event-driven work that takes only a few seconds per run with spiky traffic. The team wants both the most cost-effective option and the least operational overhead, and does not want to manage any servers. Which approach fits best?"
  options={[
    'Run a fixed-size pool of EC2 on standby',
    'Use AWS Lambda, triggered by events and paying only for actual execution',
    'Buy a 3-year Reserved Instance that runs continuously',
    'Build one large EC2 and scale it by hand',
  ]}
  answer={1}>

**Correct: B**

When the question asks for both the lowest cost and the least operational overhead, and the load is event-driven, short, and spiky, **serverless (Lambda)** usually wins on both: it pays only for actual execution, costs nothing when idle, and leaves scaling and operations to AWS. A a fixed pool of EC2 still pays for idle off-peak and needs managing; C a Reserved Instance is a commitment to steady long-term usage and does not suit intermittent short tasks; D a self-built large EC2 scaled by hand has the highest operational overhead.

</Quiz>

<Quiz
  qnum={18}
  total={18}
  question="While reviewing the bill, a team finds a group of EC2 instances whose CPU utilization has stayed in the single-digit percent for a long time, clearly oversized. The team wants concrete guidance on how much right-sizing these instances to the correct size would save. Which service fits best?"
  options={[
    'AWS Cost Explorer',
    'AWS Compute Optimizer',
    'AWS Budgets',
    'AWS Cost Anomaly Detection',
  ]}
  answer={1}>

**Correct: B**

"Right-sizing for EC2 and Lambda with concrete downsizing recommendations" is exactly **Compute Optimizer**, which uses machine learning to analyze real usage, recommend the right size, and estimate the savings. A Cost Explorer only shows spend trends and gives no right-sizing advice; C Budgets sets threshold alerts; D Cost Anomaly Detection detects abnormal spikes, so neither is a right-sizing tool.

</Quiz>

---

Done? Head back to review 👉 [Domain 4 Flashcards](./flashcards.md), or check the lookup table 👉 [Domain 4 Service Comparison](./comparison.md). 🎉 Congratulations on finishing the practice questions for all four SAA domains. Next, sprint through a practice exam and get ready for test day.
