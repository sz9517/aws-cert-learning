---
sidebar_position: 9
title: Practice Questions
---

# Domain 3 Practice Questions (official exam style)

Pick your answer first, then click "**Show answer & explanation**". This page mirrors the SAA-C03 official style: **scenario-based stems**, options that are all plausible AWS services (distractors are not obviously wrong), and deliberate **qualifiers** like "highest performance / lowest latency / least operational overhead / most cost-effective" to force a trade-off. It includes both **single-answer** and **multiple-answer (Choose TWO)** questions. All questions are **original** content (not real exam questions).

<Quiz
  qnum={1}
  total={20}
  question="A startup builds a feature that auto-generates a thumbnail after each image upload. Traffic is very spiky: idle for a whole day, then thousands of images in a few minutes. The team wants to manage no servers and pay only for actual usage. Which compute option fits best?"
  options={[
    'Run one large EC2 on standby all the time',
    'Use AWS Lambda triggered by the S3 upload event',
    'Build a fixed-size EC2 Auto Scaling group',
    'Purchase Reserved Instances',
  ]}
  answer={1}>

**正解：B**

Spiky, event-driven, short tasks, plus "no servers to manage and pay per use" is exactly a **Lambda** scenario, triggered directly by the S3 upload event. A pays even while idle and needs you to manage a machine; C cannot track wildly varying traffic; D is a cost commitment, even less suited to irregular traffic.

</Quiz>

<Quiz
  qnum={2}
  total={20}
  question="An enterprise is migrating a legacy system that needs full OS control, runs continuously for long periods, and has specially licensed software installed. The load is steady and predictable over time. Which compute option is most suitable?"
  options={[
    'AWS Lambda',
    'Amazon EC2',
    'AWS Fargate serverless containers',
    'Rewrite the app as Step Functions',
  ]}
  answer={1}>

**正解：B**

Needing "full OS control + long-running + special licensed software + steady load", **EC2** is the most direct choice. Lambda has a 15-minute cap and no OS-level control; Fargate suits already-containerized apps and also lacks full OS control; Step Functions is workflow orchestration, not a compute environment.

</Quiz>

<Quiz
  qnum={3}
  total={20}
  question="A team has already containerized its application and wants to run it on AWS, but wants to manage none of the underlying EC2 nodes, patching, or scaling. Which approach best fits?"
  options={[
    'Build an EC2 cluster and install Docker manually',
    'Use ECS or EKS with the AWS Fargate launch type',
    'Bake the container into an AMI and launch EC2',
    'Switch to a Lambda container image running 2 hours per invocation',
  ]}
  answer={1}>

**正解：B**

"Containerized + no underlying nodes to manage" maps straight to **Fargate** (with ECS or EKS); AWS manages the underlying compute, patching, and scaling. A and C still require managing EC2; D fails because Lambda caps a single run at 15 minutes, so it cannot run for 2 hours.

</Quiz>

<Quiz
  qnum={4}
  total={20}
  question="A financial trading database needs storage that is persistent and delivers the highest IOPS with the lowest latency. Which storage fits best?"
  options={[
    'EBS gp3 general-purpose SSD',
    'EBS io2 Block Express',
    'Instance Store',
    'EBS st1 throughput-optimized HDD',
  ]}
  answer={1}>

**正解：B**

The requirement "persistent + highest IOPS + lowest latency" points to **io2 Block Express**. gp3 is balanced but not top-tier IOPS; Instance Store has very high IOPS but is wiped on stop (not persistent), so it fails the database requirement; st1 is an HDD built for throughput, not IOPS.

</Quiz>

<Quiz
  qnum={5}
  total={20}
  question="A content management system has dozens of Linux EC2 instances that must read and write the same shared files at the same time, and the capacity should auto-scale as files grow with no pre-provisioning. Which service should be chosen?"
  options={[
    'Amazon EFS, mountable by many Linux hosts at once with auto-scaling capacity',
    'Attach a separate EBS volume to each EC2',
    'Amazon FSx for Lustre as a general website shared disk',
    'Store files on Instance Store and replicate between hosts',
  ]}
  answer={0}>

**正解：A**

"Many Linux hosts sharing files + auto-scaling capacity" is exactly the role of **EFS (NFS)**. B attaches EBS to a single host with no sharing; C (FSx for Lustre) is an HPC high-throughput scratch system, not a general web share; D (Instance Store) is wiped on stop and is not shared.

</Quiz>

<Quiz
  qnum={6}
  total={20}
  question="An S3 bucket in the US frequently receives multi-GB uploads from users in Asia and Europe, and those uploads are slow and often interrupted. Which TWO actions best improve upload performance and reliability? (Choose TWO)"
  options={[
    'Enable S3 Transfer Acceleration to speed cross-region uploads via edge locations',
    'Use Multipart Upload to send large files in parallel parts',
    'Force a single prefix on the bucket to concentrate traffic',
    'Switch to the S3 Glacier Deep Archive storage class',
    'Disable versioning to speed up writes',
  ]}
  answer={[0, 1]}>

**正解：A、B**

Slow cross-border large uploads call for **Transfer Acceleration (A)**, which routes through nearby edge locations, and **Multipart Upload (B)**, which splits large files into parallel parts and supports resuming. C concentrating a single prefix actually limits parallelism; D Glacier is an archive class unrelated to upload speed and slow to retrieve; E versioning has nothing to do with upload speed.

</Quiz>

<Quiz
  qnum={7}
  total={20}
  question="A machine learning team needs a shared file system with extremely high throughput to stage large datasets for HPC compute nodes, and the data can be discarded after the job finishes. Which service fits best?"
  options={[
    'Amazon EFS standard mode',
    'Amazon FSx for Lustre',
    'Amazon FSx for Windows File Server',
    'EBS sc1 cold HDD',
  ]}
  answer={1}>

**正解：B**

"HPC + extremely high throughput + staging large datasets" is the signature use case of **FSx for Lustre** (and it links with S3). EFS throughput does not reach the Lustre tier; FSx for Windows uses SMB for Windows; sc1 is the cheapest cold HDD with low throughput.

</Quiz>

<Quiz
  qnum={8}
  total={20}
  question="A Windows file server is moving to AWS, and the application relies on the SMB protocol and Active Directory integration. Which service is most suitable?"
  options={[
    'Amazon EFS',
    'Amazon FSx for Windows File Server',
    'Amazon S3 with File Gateway',
    'EBS Multi-Attach',
  ]}
  answer={1}>

**正解：B**

"Windows + SMB + AD integration" maps directly to **FSx for Windows File Server**. EFS is NFS for Linux; S3 File Gateway is a hybrid-cloud gateway, not a native Windows file server; EBS Multi-Attach is block storage, not an SMB file share.

</Quiz>

<Quiz
  qnum={9}
  total={20}
  question="A gaming backend needs a database that can support millions of users, looks up records by player ID, keeps latency steady at single-digit milliseconds, and auto-scales with no servers to manage. Which fits best?"
  options={[
    'A single Amazon RDS for MySQL instance',
    'Amazon DynamoDB',
    'Self-managed PostgreSQL on EC2',
    'Amazon Redshift',
  ]}
  answer={1}>

**正解：B**

"Massive scale + key-value lookups + single-digit ms + serverless auto-scaling" is the classic **DynamoDB** scenario. A single RDS instance scales only so far; self-managed EC2 means managing everything; Redshift is a data warehouse for analytics, not high-concurrency online key-value lookups.

</Quiz>

<Quiz
  qnum={10}
  total={20}
  question="An e-commerce RDS database writes fine, but heavy product-browsing reads overwhelm the primary at peak. The team wants to boost read performance with minimal application change. Which approach fits best?"
  options={[
    'Just resize the RDS instance to a larger type',
    'Create an RDS Read Replica and route read traffic to it',
    'Switch to a Multi-AZ deployment',
    'Enable automated backups on the database',
  ]}
  answer={1}>

**正解：B**

Heavy read load that needs to be offloaded points straight to a **Read Replica**; the app simply directs read queries to the replica. A vertical scaling has a ceiling and is a stopgap; C Multi-AZ is for **high availability** (the standby does not serve reads); D backups are unrelated to performance.

</Quiz>

<Quiz
  qnum={11}
  total={20}
  question="An enterprise wants a relational database that is MySQL-compatible but with far higher performance and throughput than standard RDS, with storage that auto-scales and enterprise-grade availability. Which fits best?"
  options={[
    'Amazon Aurora (MySQL-compatible)',
    'Amazon DynamoDB',
    'A self-managed MySQL cluster on EC2',
    'Amazon ElastiCache for Redis',
  ]}
  answer={0}>

**正解：A**

"MySQL-compatible + far higher performance than RDS + auto-scaling storage + enterprise-grade" is exactly **Aurora**. DynamoDB is NoSQL and not MySQL-compatible; self-managed EC2 means owning scaling and operations; ElastiCache is a cache, not a primary database.

</Quiz>

<Quiz
  qnum={12}
  total={20}
  question="An application reads heavily from DynamoDB, repeatedly querying the same hot items, and the team wants to push those read latencies from milliseconds down to microseconds with minimal code change. Which approach fits best?"
  options={[
    'Put an Amazon ElastiCache for Memcached layer in front',
    'Enable DynamoDB Accelerator (DAX)',
    'Provision more read capacity units on DynamoDB',
    'Move the data to RDS instead',
  ]}
  answer={1}>

**正解：B**

"Purpose-built for DynamoDB, microseconds, minimal code change" points to **DAX**, the native caching layer for DynamoDB with a nearly compatible API. Using plain ElastiCache (A) means writing your own caching logic; C adding capacity raises throughput but latency stays in milliseconds; D moving to RDS misses the requirement.

</Quiz>

<Quiz
  qnum={13}
  total={20}
  question="A real-time leaderboard feature needs an in-memory data store that supports sorted structures, has persistence and replication, and can act as a leaderboard and counters. Which fits best?"
  options={[
    'Amazon ElastiCache for Memcached',
    'Amazon ElastiCache for Redis',
    'A plain Amazon DynamoDB table',
    'Amazon S3',
  ]}
  answer={1}>

**正解：B**

"Sorted structures + persistence + replication + leaderboard" is a strength of **Redis** (Sorted Set). Memcached offers only simple key-value with no persistence or sorted structures; DynamoDB can do it but is not the best in-memory microsecond leaderboard; S3 is object storage, unsuited to a real-time leaderboard.

</Quiz>

<Quiz
  qnum={14}
  total={20}
  question="A media site has many images and videos with users worldwide, who often complain of slow loads in regions far from the origin server. The goal is to deliver cacheable content as close to users as possible to cut latency. Which service fits best?"
  options={[
    'AWS Global Accelerator',
    'Amazon CloudFront',
    'Elastic Load Balancing',
    'AWS Direct Connect',
  ]}
  answer={1}>

**正解：B**

"Cacheable content + delivered close to users globally + lower latency" is the core job of **CloudFront (CDN)**, caching content at edge locations. Global Accelerator speeds up the connection path and does not cache content, better for non-HTTP; ELB is in-region load balancing; Direct Connect is a dedicated line, not global content caching.

</Quiz>

<Quiz
  qnum={15}
  total={20}
  question="An online game uses a custom UDP protocol and needs players worldwide to connect to the nearest AWS entry point with the lowest latency, plus fixed static IPs for firewall allow-lists, with no content caching required. Which service fits best?"
  options={[
    'Amazon CloudFront',
    'AWS Global Accelerator',
    'Amazon Route 53 latency routing',
    'Application Load Balancer',
  ]}
  answer={1}>

**正解：B**

"Non-HTTP (UDP) + lowest-latency global path + fixed anycast static IPs + no caching" is entirely **Global Accelerator**. CloudFront leans toward HTTP content caching; Route 53 only resolves DNS and does not accelerate the connection over the AWS backbone; ALB is Layer 7 HTTP and gives no fixed IP.

</Quiz>

<Quiz
  qnum={16}
  total={20}
  question="A company processes real-time clickstream data with this requirement: several different downstream systems must each read the same data, and it must be replayable (reprocessable) for several hours. Which service fits best?"
  options={[
    'Amazon SQS standard queue',
    'Amazon Kinesis Data Streams',
    'Amazon SNS standard topic',
    'Amazon MQ',
  ]}
  answer={1}>

**正解：B**

"Multiple consumers each reading the same data + replay within retention + real-time streaming" is the core capability of **Kinesis Data Streams**. SQS deletes a message once a consumer processes it, so no replay; SNS is push delivery and keeps nothing for replay; Amazon MQ is a traditional message broker, not high-throughput replayable streaming.

</Quiz>

<Quiz
  qnum={17}
  total={20}
  question="A team wants to auto-load incoming streaming logs into Amazon S3 and Redshift for later analysis, near-real-time and with no code to write or operate. Which service fits best?"
  options={[
    'Amazon Kinesis Data Streams with a custom consumer app',
    'Amazon Data Firehose (Kinesis Firehose)',
    'Amazon SQS with Lambda',
    'A self-built ETL schedule on EC2',
  ]}
  answer={1}>

**正解：B**

"Auto-load streams into S3/Redshift + near real-time + no code or infrastructure to manage" is exactly the role of **Firehose** (fully managed, automatic batching and delivery). Data Streams (A) needs a custom consumer; SQS+Lambda (C) needs custom integration; a self-built ETL on EC2 (D) carries the highest operational overhead.

</Quiz>

<Quiz
  qnum={18}
  total={20}
  question="A DynamoDB table throttles at peak, and investigation shows traffic concentrated on a few partition key values (a hot partition). Which TWO actions best improve this? (Choose TWO)"
  options={[
    'Redesign with a high-cardinality (well-distributed) partition key so traffic spreads evenly',
    'Add DynamoDB Accelerator (DAX) to absorb repeated hot reads',
    'Move the whole table onto a single partition to simplify management',
    'Use a longer sort key but keep the same partition key',
    'Disable auto-scaling to fix capacity',
  ]}
  answer={[0, 1]}>

**正解：A、B**

The root cause of a hot partition is a poorly distributed partition key, so **redesigning a high-cardinality partition key (A)** spreads traffic evenly; when the same hot items are read repeatedly, **DAX (B)** absorbs the repeated reads at the cache layer and eases partition pressure. C concentrating a single partition only makes it worse; D without changing the partition key nothing spreads; E disabling auto-scaling does not help a hot partition.

</Quiz>

<Quiz
  qnum={19}
  total={20}
  question="An application sees read traffic spike at peak with many repeated identical queries overwhelming RDS. The team wants the most cost-effective combination to both offload reads and cut the latency of repeated queries. Which TWO fit best? (Choose TWO)"
  options={[
    'Create an RDS Read Replica to offload read traffic',
    'Add an ElastiCache layer in front to cache hot query results',
    'Route every query through a cross-Region replica',
    'Vertically upgrade RDS to the largest instance type',
    'Create a separate database per user',
  ]}
  answer={[0, 1]}>

**正解：A、B**

Offloading reads points to a **Read Replica (A)**; cutting the latency and database load of "repeated identical queries" points to an **ElastiCache cache (B)** in front. Together they are the most common and cost-effective read-acceleration combo. C cross-Region is costly and adds latency; D vertical upgrade has a ceiling and is expensive; E a database per user is impractical.

</Quiz>

<Quiz
  qnum={20}
  total={20}
  question="A data analytics platform needs to ingest millions of telemetry events per second, absorb sudden spikes, and keep backend batch processing from being overwhelmed. Which service best serves as the high-throughput real-time ingestion layer?"
  options={[
    'Amazon Kinesis Data Streams',
    'Let devices write directly to RDS',
    'Write one record at a time to a single S3 prefix',
    'AWS Config',
  ]}
  answer={0}>

**正解：A**

"Millions of events per second + absorb spikes + real-time ingestion + let the backend work at its own pace" is the typical use of **Kinesis Data Streams** (scale throughput with shards, act as a buffer). Writing straight to RDS (B) gets overwhelmed by spikes; one-at-a-time writes to a single S3 prefix (C) suit neither high concurrency nor real-time ingestion; AWS Config (D) is for resource compliance auditing and is unrelated.

</Quiz>

---

Done? Head back to review 👉 [Domain 3 Flashcards](./flashcards.md), or move on to the next domain 👉 [Domain 4: Design Cost-Optimized Architectures](../domain-4/).
