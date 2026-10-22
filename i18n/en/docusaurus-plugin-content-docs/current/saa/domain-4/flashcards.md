---
sidebar_position: 8
title: Flashcards
---

# Domain 4 Flashcards

Click a card to flip it open. Covers every Domain 4 topic (compute pricing models, S3 storage classes & lifecycle, data transfer costs, cost monitoring & governance, database & network costs, cost-optimization architecture decisions). The most efficient page for last-minute review.

## Compute Pricing Models (On-Demand / RI / Savings Plans / Spot)

<Flashcards>
  <Flashcard term="On-Demand">Billed per second/hour, start and stop any time, no commitment — most flexible but highest unit price, best for short-lived or unpredictable workloads.</Flashcard>
  <Flashcard term="Reserved Instances: Standard vs Convertible">Commit to 1 or 3 years for a discount. Standard = biggest discount but cannot change instance type; Convertible = slightly smaller discount but you can swap family / OS / tenancy.</Flashcard>
  <Flashcard term="Savings Plans: Compute vs EC2 Instance">Commit to an hourly spend for a discount. Compute SP = most flexible (across family / Region / Fargate / Lambda); EC2 Instance SP = higher discount but locked to a specific family and Region.</Flashcard>
  <Flashcard term="Spot Instances">Uses spare capacity for up to 90 percent savings, but AWS can reclaim it with only a 2-minute interruption notice; best for fault-tolerant, interruptible batch / big-data work.</Flashcard>
  <Flashcard term="Dedicated Hosts">A whole physical host dedicated to you, lets you bring your own license (BYOL, priced per physical core), meeting compliance and software-licensing needs.</Flashcard>
</Flashcards>

## S3 Storage Classes & Lifecycle

<Flashcards>
  <Flashcard term="S3 Intelligent-Tiering">Automatically moves objects between access tiers to match cost to access frequency — most hands-off when access patterns are unknown (only a small monitoring fee).</Flashcard>
  <Flashcard term="Standard-IA vs One Zone-IA">Both are infrequent-access, cheaper storage with a retrieval fee. Standard-IA spans 3 AZs; One Zone-IA stores in a single AZ, cheaper but lost if that AZ fails, best for re-creatable data.</Flashcard>
  <Flashcard term="Glacier three tiers">Instant Retrieval = millisecond retrieval for rarely-accessed archives; Flexible Retrieval = minutes to hours; Deep Archive = cheapest, retrieval takes hours, for long-term compliance storage.</Flashcard>
  <Flashcard term="Lifecycle rules">Transition = automatically demote objects to cheaper classes after a set number of days; Expiration = automatically delete objects or purge old versions when they expire, cutting long-term costs.</Flashcard>
  <Flashcard term="Minimum storage duration trap">IA classes have a 30-day minimum, Glacier classes 90/180 days; deleting or transitioning too soon still bills the full duration, so do not dump short-lived data in them.</Flashcard>
</Flashcards>

## Data Transfer Costs

<Flashcards>
  <Flashcard term="Inbound free / Outbound charged">Data coming into AWS is usually free; data going out to the internet (egress) is what costs money — cost optimization starts by watching outbound traffic.</Flashcard>
  <Flashcard term="Same AZ / cross-AZ / cross-Region">Traffic within one AZ is mostly free; cross-AZ and cross-Region transfer both cost money, so keep resources that talk to each other in the same AZ.</Flashcard>
  <Flashcard term="CloudFront cuts egress">Serve static / cacheable content through CloudFront so edge locations respond, reducing traffic flowing straight out of S3 / EC2, and at a lower transfer rate.</Flashcard>
  <Flashcard term="VPC Gateway Endpoint">Gateway Endpoints for S3 and DynamoDB are free, keeping traffic on the private network instead of through a NAT or the internet, which also saves NAT costs.</Flashcard>
  <Flashcard term="NAT Gateway billing">NAT Gateway charges both per hour and per GB processed; heavy private-subnet traffic through a NAT gets expensive, so use a Gateway Endpoint instead of routing through NAT when you can.</Flashcard>
</Flashcards>

## Cost Monitoring & Governance (Cost Explorer / Budgets / CUR)

<Flashcards>
  <Flashcard term="Cost Explorer">Visualize and analyze historical spend trends, break them down by service / tag, and forecast future costs to find the big spenders.</Flashcard>
  <Flashcard term="AWS Budgets">Set cost or usage budget thresholds and get alerts when you exceed (or are forecast to exceed) them, controlling spend proactively.</Flashcard>
  <Flashcard term="Cost and Usage Report (CUR)">The most detailed and complete billing line-item report, exported to S3 for deep analysis (paired with Athena / QuickSight).</Flashcard>
  <Flashcard term="Cost Allocation Tags">Use cost allocation tags to classify spend by project / team / environment so you can split and attribute costs in Cost Explorer / CUR.</Flashcard>
  <Flashcard term="Organizations consolidated billing">Centralize many accounts into one organization billed together (Consolidated Billing); pooled usage reaches volume discount tiers more easily and shares RIs / Savings Plans.</Flashcard>
  <Flashcard term="Cost Anomaly Detection">Uses machine learning to detect abnormal spend and alert you automatically, catching cost spikes early.</Flashcard>
</Flashcards>

## Database & Network Costs (RDS / Aurora / DynamoDB / Connectivity)

<Flashcards>
  <Flashcard term="RDS / Aurora Reserved Instances">For steady, long-running databases, buying RIs (1 or 3-year commitment) saves a lot versus On-Demand.</Flashcard>
  <Flashcard term="Aurora Serverless v2">Automatically and smoothly scales capacity with load and bills by usage, ideal for intermittent or unpredictable workloads, avoiding provisioning for peak all the time.</Flashcard>
  <Flashcard term="DynamoDB on-demand vs provisioned">On-demand = unpredictable traffic, billed per actual request, no management; provisioned = steady predictable traffic, pre-set capacity (can add Auto Scaling) and cheaper.</Flashcard>
  <Flashcard term="VPC Endpoint saves NAT">Use Gateway / Interface Endpoints to let services inside the VPC reach AWS services privately, dropping the per-GB NAT Gateway processing charges.</Flashcard>
  <Flashcard term="Direct Connect vs VPN">VPN runs over the internet, cheap and quick to set up; Direct Connect is a dedicated line, stable and low-latency with a lower per-GB rate for heavy transfer, worth it only at sustained high volume.</Flashcard>
</Flashcards>

## Cost-Optimization Architecture Decisions

<Flashcards>
  <Flashcard term="Idle equals waste">Unused or low-utilization resources still bill; shut down idle instances and delete unattached EBS volumes, old snapshots, and unused Elastic IPs.</Flashcard>
  <Flashcard term="Managed / serverless lowers operational burden">Use managed or serverless services (Lambda / Fargate / DynamoDB / Aurora Serverless) to hand maintenance and idle cost to AWS and pay only for actual usage.</Flashcard>
  <Flashcard term="Right-Sizing">Use Compute Optimizer and Trusted Advisor to spot over-provisioned resources and dial them down to match real demand and save money.</Flashcard>
  <Flashcard term="Match supply to demand">Use Auto Scaling so capacity grows and shrinks with demand, scaling in during lulls instead of over-paying for peak all the time.</Flashcard>
  <Flashcard term="Well-Architected cost pillar">Covers cloud financial management, spending within your means, adopting a consumption model, measuring efficiency, and stopping payment for things you do not need.</Flashcard>
</Flashcards>

---

Done reviewing? Test yourself 👉 [Domain 4 Practice Questions](./quiz.md), or revisit the [Service Comparison & Exam Cheat Sheet](./comparison.md).
