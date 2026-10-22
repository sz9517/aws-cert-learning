---
sidebar_position: 6
title: "AWS Service Map: Core Services at a Glance"
---

# AWS Service Map: Core Services at a Glance

> AWS has hundreds of services, and the names alone are dizzying. Relax — as a beginner you don't need to memorize them all. Just learn to recognize the "lead actors" in each major category.

<Analogy title="🛒 Analogy: your first trip to a giant supermarket, just learn the sections">

The first time you walk into a huge supermarket, there are tens of thousands of products on the shelves. You can't possibly memorize them all at once. But you'll quickly notice the store is divided into a few big sections: **fresh produce**, **household goods**, **frozen foods**, **electronics**, and so on.

As long as you know "for groceries go to produce, for toilet paper go to household goods", you won't get lost.

AWS is the same. Its services fall into a handful of major categories (compute, storage, database, networking, security...), and **each category has a few "lead actor" services**. Your job right now is not to memorize hundreds of services, but to recognize "which category solves which problem, and who the lead actors are". That way, when you read exam questions or design architectures, you'll know which section to walk to.

</Analogy>

:::note[💬 How to use this page]
Each category below comes with one table, with the columns "**Service ｜ In one sentence ｜ Typical use**". For now, just getting a rough impression is enough — don't force yourself to memorize the details. Every service here has its own in-depth page elsewhere on this site. When you hit an unfamiliar abbreviation, you can always look it up in the [Glossary & Services](../glossary.md).
:::

## 🖥️ Compute: where your code "runs"

Your website, app, and backend code all need something to execute them — that's the problem the compute category solves. From "renting a whole computer" to "not even managing machines", you have different options.

| Service | In one sentence | Typical use |
| --- | --- | --- |
| **<Term en="Elastic Compute Cloud" desc="A cloud server you rent on AWS; your program runs on it.">EC2</Term>** | Rent a whole cloud server and set it up yourself | Traditional apps needing full OS control and long-running processes |
| **<Term en="AWS Lambda" desc="Serverless compute, event-triggered and billed by the millisecond.">Lambda</Term>** | No servers to manage — write some code, it runs on an event | Occasional, event-driven tasks (auto-process a file after upload) |
| **<Term en="Elastic Container Service / Elastic Kubernetes Service" desc="AWS container orchestration services; EKS is managed Kubernetes.">ECS/EKS</Term>** | The command center that schedules a fleet of "containers" | Microservices deployed with Docker/Kubernetes |
| **<Term en="AWS Fargate" desc="Serverless container engine; runs containers without managing the underlying hosts.">Fargate</Term>** | Run containers without ever tending the host | Using containers but not wanting to manage underlying EC2 nodes |
| **<Term en="Auto Scaling" desc="Automatically adds or removes servers based on traffic.">Auto Scaling</Term>** | Adds machines when traffic rises, removes them when it falls | Handling traffic peaks while saving money off-peak |

:::tip[💡 How to choose]
In a nutshell: **need full control → EC2; occasional small tasks → Lambda; using containers → ECS/EKS (pair with Fargate to skip host management)**. This trade-off is frequently tested in the performance and cost domains.
:::

## 💾 Storage: where your files "live"

Data has to live somewhere. The storage options differ in: whether you're storing files, a disk attached to a server, whether multiple machines can share it, and "how often you retrieve it".

| Service | In one sentence | Typical use |
| --- | --- | --- |
| **<Term en="Simple Storage Service" desc="AWS's cloud file warehouse for images, backups, reports, etc.">S3</Term>** | A virtually unlimited cloud file warehouse | Images, videos, backups, static website files, data lakes |
| **<Term en="Elastic Block Store" desc="A cloud hard drive attached to a single EC2 instance.">EBS</Term>** | A "cloud hard drive" attached to one EC2 instance | System or data disk for an EC2 (tied to a single AZ) |
| **<Term en="Elastic File System" desc="A file system that many machines can mount and share at once.">EFS</Term>** | A network drive multiple servers can share at once | Multiple EC2 instances reading/writing the same files (Linux) |
| **<Term en="Amazon FSx" desc="A managed file system family supporting Windows SMB, Lustre, and more.">FSx</Term>** | Advanced shared file systems for specific platforms | Windows file shares (SMB), high-performance computing (Lustre) |
| **<Term en="S3 Glacier" desc="Very cheap archival storage with slower retrieval.">Glacier</Term>** | A dirt-cheap "freezer" for rarely accessed data | Regulatory archives, long-term backups where minutes-to-hours retrieval is acceptable |

:::info[🔑 One key difference]
**EBS attaches to just one EC2 at a time (like an external drive); EFS can be mounted and shared by many machines at once (like a network drive).** If a question calls for "shared by multiple machines", pick EFS — this contrast is tested often.
:::

## 🗄️ Database: where structured data lives and how you query it

A file warehouse (S3) is great for whole files, but to "query row by row, relate, and transact" you need a database. The key split: traditional tabular (relational) vs. speed-and-flexibility-focused NoSQL.

| Service | In one sentence | Typical use |
| --- | --- | --- |
| **<Term en="Relational Database Service" desc="A managed relational database, e.g. MySQL, PostgreSQL.">RDS</Term>** | A managed traditional tabular database, no ops needed | Primary database for general business apps (MySQL/PostgreSQL) |
| **<Term en="Amazon Aurora" desc="AWS-built, MySQL/PostgreSQL-compatible high-performance database.">Aurora</Term>** | A souped-up RDS — faster, storage grows automatically | Relational databases needing high performance and availability |
| **<Term en="Amazon DynamoDB" desc="Serverless NoSQL with single-digit millisecond latency and near-infinite scale.">DynamoDB</Term>** | A blazing-fast, no-ops NoSQL database | High-traffic, low-latency scenarios (games, carts, IoT) |
| **<Term en="Amazon ElastiCache" desc="A managed in-memory cache service supporting Redis and Memcached.">ElastiCache</Term>** | An in-memory "cache" that speeds up queries | Caching hot query results to ease the load on your database |

:::tip[💡 How to choose]
**Need relations, transactions, SQL → RDS/Aurora; need extreme speed and flexibility with a simple data shape → DynamoDB; want faster queries → add a layer of ElastiCache in front.**
:::

## 🌐 Networking & Delivery: how traffic gets in and reaches users

Users need to reach your service, traffic needs to be spread evenly, and the whole world needs fast access — this category handles "networking and content delivery".

| Service | In one sentence | Typical use |
| --- | --- | --- |
| **<Term en="Virtual Private Cloud" desc="Your own private virtual network inside AWS.">VPC</Term>** | Your own private network inside AWS | Isolating resources, configuring subnets and firewalls (the foundation of every architecture) |
| **<Term en="Amazon Route 53" desc="AWS's DNS service that resolves domain names to resources.">Route 53</Term>** | AWS's DNS, pointing domain names to your resources | Domain resolution, health checks, various traffic-routing policies |
| **<Term en="Amazon CloudFront" desc="A content delivery network (CDN) that caches content at global edge locations.">CloudFront</Term>** | Caches content worldwide to deliver it from nearby | Speeding up image, video, and website loads for global users |
| **<Term en="Elastic Load Balancing" desc="A load balancer that spreads traffic across multiple backends.">ELB</Term>** | Spreads incoming traffic evenly across many servers | High availability: avoid overloading a single box, pairs with Auto Scaling |
| **<Term en="Amazon API Gateway" desc="A managed API front door that receives API requests and routes them to backends.">API Gateway</Term>** | The "front door and tollbooth" that manages your APIs | Exposing APIs externally, often with Lambda for a serverless backend |

:::info[🏗️ Get the land before you build the house]
**VPC is the "foundation" for everything** — most resources like EC2 and RDS live inside a VPC. Understand VPC first and the networking questions later won't trip you up.
:::

## 🔐 Security & Identity: who gets in, and how data is protected

Security comes first in the cloud. This category handles three things — "identity and permissions", "encryption", and "attack defense" — all heavily emphasized in both the exam and real work.

| Service | In one sentence | Typical use |
| --- | --- | --- |
| **<Term en="Identity and Access Management" desc="The access system that controls who can do what to which resources; free.">IAM</Term>** | The access system: who can do what to which resources | Creating users, roles, and permission policies (the bedrock of security; free) |
| **<Term en="Key Management Service" desc="A key vault for centrally managing encryption keys.">KMS</Term>** | The "vault" that centrally safeguards encryption keys | Encrypting and managing keys for S3, EBS, RDS, and more |
| **<Term en="AWS Secrets Manager" desc="Securely stores and automatically rotates passwords, API keys, and other secrets.">Secrets Manager</Term>** | Securely stores passwords and keys — and auto-rotates them | Holding database passwords and API keys so they aren't hard-coded |
| **<Term en="Web Application Firewall / AWS Shield" desc="WAF blocks malicious web requests; Shield defends against DDoS attacks.">WAF/Shield</Term>** | The firewall and flood gate that block web attacks | WAF blocks malicious requests; Shield blocks DDoS traffic floods |
| **<Term en="Amazon GuardDuty" desc="A threat detection service that automatically spots suspicious account activity.">GuardDuty</Term>** | A 24/7 "security camera" watching for trouble | Smartly detecting suspicious logins, anomalous behavior, and other threats |

:::tip[💡 Exam regulars]
**IAM is the number-one topic in nearly every exam**, and "for data encryption, reach for KMS" and "don't hard-code passwords — use Secrets Manager" are high-frequency points too.
:::

## 📊 Monitoring & Management: is the system healthy, and who changed what

Once things are live, you need to know whether they're running well, whether someone tampered with settings, and whether you can trace incidents — this category is your "dashboard and dashcam".

| Service | In one sentence | Typical use |
| --- | --- | --- |
| **<Term en="Amazon CloudWatch" desc="A monitoring service that collects metrics and logs and triggers alarms.">CloudWatch</Term>** | The system "dashboard": metrics, logs, and alarms | Monitoring CPU/traffic, setting alarms, triggering Auto Scaling |
| **<Term en="AWS CloudTrail" desc="An audit log that records every API action in your account.">CloudTrail</Term>** | The "dashcam": who did what, and when | Auditing and tracing things like "who deleted this instance" |
| **<Term en="AWS Config" desc="Tracks resource configuration changes and checks compliance.">Config</Term>** | Watches whether resource settings drift from the rules | Recording config changes, checking resources against compliance rules |
| **<Term en="AWS Systems Manager" desc="A toolbox to centrally manage, patch, and operate many EC2s and resources.">Systems Manager</Term>** | The "remote control" to manage a whole fleet at once | Bulk patching, running commands without SSH, storing parameters |

:::info[🔍 An easily confused pair]
**CloudWatch watches "how well the system performs" (metrics, logs); CloudTrail watches "who performed which actions" (auditing).** One is like a dashboard, the other a dashcam — don't mix them up.
:::

## 💰 Cost & Governance: how to read the bill and manage many accounts

The scariest part of the cloud is "a shocking bill at month's end". This category helps you understand spending, set budget alerts, and govern consistently when a company has multiple accounts.

| Service | In one sentence | Typical use |
| --- | --- | --- |
| **<Term en="AWS Cost Explorer" desc="A tool that visualizes spending trends.">Cost Explorer</Term>** | Turns spending into charts so you see where money goes | Analyzing cost trends, finding the most expensive services |
| **<Term en="AWS Budgets" desc="Sets thresholds on cost or usage and alerts you.">Budgets</Term>** | Set a budget cap and get notified before you exceed it | "Don't go over $X this month" budget alerts |
| **<Term en="AWS Organizations" desc="A service for centrally managing multiple AWS accounts.">Organizations</Term>** | Manage many accounts under one headquarters | Multi-account governance, consolidated billing, org-wide policies |
| **<Term en="AWS Trusted Advisor" desc="An advisor that automatically checks your account and suggests optimizations.">Trusted Advisor</Term>** | An advisor that health-checks you and suggests savings and fixes | Finding idle resources, security gaps, and cost-saving opportunities |

:::tip[💡 Most useful for beginners]
Just starting with AWS? **Set up a Budgets alert first**, and you won't risk a blown-up bill from forgetting to shut a machine down — it's the first safety setting this site recommends.
:::

## Wrap-up: recognize the "sections" first, then dive into the "goods"

Congratulations — you now have a "service map" of AWS. Think back to the supermarket analogy: you don't need to memorize every product, but you already know **which section to walk to and which lead actor to find for the kind of problem you're solving**.

Each lead actor across these seven categories gets its own in-depth page in this site's exam domains — compute, storage, and database in the performance domain; networking and security in the security and high-availability domains; cost and governance in the cost-optimization domain — walking you from "why you need it" all the way to "how to actually use it". With this map as your base, every service you learn next will have a clear direction.

👉 Next: [Create Your AWS Account & Secure It](./create-account.md)
