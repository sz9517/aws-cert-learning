---
sidebar_position: 4
title: Glossary & Services
sidebar_label: 📖 Glossary & Services
---

# Glossary & Services

Not sure what an acronym means? Look it up here. Format: **Acronym ｜ Full name ｜ Plain explanation**.

## Core services

| Acronym | Full name | Plain explanation |
| --- | --- | --- |
| **EC2** | Elastic Compute Cloud | A cloud server you rent on AWS; your program runs on it. |
| **S3** | Simple Storage Service | AWS's cloud file warehouse for images, backups, reports, etc. |
| **IAM** | Identity and Access Management | The access-control system for "who can do what to which resources". Free. |
| **KMS** | Key Management Service | A "key safe" that centrally manages encryption keys. |
| **RDS** | Relational Database Service | Managed relational databases (MySQL, PostgreSQL, etc.). |
| **VPC** | Virtual Private Cloud | Your private virtual network inside AWS. |

## Common concepts

| Term | Plain explanation |
| --- | --- |
| **Root user** | The account's highest-privilege owner; used only for initial setup. |
| **MFA** | Multi-factor authentication; an extra one-time code at login. |
| **Least privilege** | Grant only just-enough permissions; the core of secure design. |
| **Availability Zone (AZ)** | Independent data centers within a region, used for high-availability design. |
| **Pay-as-you-go** | A billing model where you pay for what you use. |

## Domain 2: Resilience & High Availability

| Acronym / term | Full name | Plain explanation |
| --- | --- | --- |
| **ELB** | Elastic Load Balancing | Umbrella name for load balancers that spread traffic across multiple backends. |
| **ALB** | Application Load Balancer | A Layer 7 (HTTP/HTTPS) load balancer with path/host routing; ideal for websites and microservices. |
| **NLB** | Network Load Balancer | A Layer 4 (TCP/UDP) load balancer with ultra-high performance and a fixed static IP option. |
| **GWLB** | Gateway Load Balancer | For chaining third-party network appliances (firewalls, IDS/IPS). |
| **ASG** | Auto Scaling Group | A group that auto-adjusts the EC2 count by traffic, keeping min/desired/max. |
| **SQS** | Simple Queue Service | A message queue; consumers pull — used to buffer, smooth spikes, and decouple. |
| **SNS** | Simple Notification Service | Publish/subscribe; one message pushed to many subscribers (fan-out). |
| **DLQ** | Dead-Letter Queue | Holds messages that fail repeatedly so they do not clog the main queue. |
| **Route 53** | — | AWS DNS service that resolves domain names to resources and supports many routing policies. |
| **RPO** | Recovery Point Objective | How much "data" (a length of time) you can afford to lose. |
| **RTO** | Recovery Time Objective | How long you can afford to be "down". |
| **Multi-AZ** | — | Synchronous standby across AZs with automatic failover; for HA (does not serve reads). |
| **Read Replica** | — | An asynchronous, optionally cross-Region read-only copy used to offload reads (not an HA solution). |
| **CRR** | Cross-Region Replication | S3 automatic replication across Regions for off-site DR. |
| **EFS** | Elastic File System | A file system mountable/shared across multiple AZs (whereas EBS is tied to a single AZ). |

## Domain 3: High-Performing Architectures

| Acronym / term | Full name | Plain explanation |
| --- | --- | --- |
| **EC2** | Elastic Compute Cloud | Virtual servers; rent a whole machine — pick it for full OS control / long-running work. |
| **Lambda** | AWS Lambda | Serverless compute, event-triggered, billed per runtime ms, 15-minute max per run. |
| **Fargate** | AWS Fargate | Serverless container engine; run ECS/EKS without managing the underlying EC2 nodes. |
| **ECS / EKS** | Elastic Container Service / Elastic Kubernetes Service | AWS container orchestration services (EKS is managed Kubernetes). |
| **Placement Group** | — | Instance placement strategy; cluster packs one rack for ultra-low latency, used for HPC. |
| **EBS** | Elastic Block Store | Persistent block storage; gp3 balanced, io2 highest IOPS, st1 throughput, sc1 cold. |
| **Instance Store** | — | Physically attached scratch disk; extremely high IOPS but wiped on stop (not persistent). |
| **FSx** | Amazon FSx | Managed file-system family; for Windows uses SMB, for Lustre serves HPC high throughput. |
| **RDS** | Relational Database Service | Managed relational databases (MySQL/PostgreSQL and others). |
| **Aurora** | Amazon Aurora | MySQL/PostgreSQL-compatible, several times RDS performance, storage auto-scales. |
| **DynamoDB** | Amazon DynamoDB | Serverless NoSQL with single-digit ms latency and near-unlimited scale. |
| **DAX** | DynamoDB Accelerator | A microsecond in-memory cache purpose-built for DynamoDB. |
| **ElastiCache** | Amazon ElastiCache | Managed in-memory cache; Redis is feature-rich/persistent, Memcached is simple multi-threaded. |
| **CloudFront** | — | CDN that caches content at edge locations to speed up global access. |
| **Global Accelerator** | — | Uses the AWS backbone + anycast static IPs to speed the connection path; great for non-HTTP TCP/UDP. |
| **Kinesis Data Streams** | — | Real-time streaming; multiple consumers read the same data, replayable, scales with shards. |
| **Firehose** | Amazon Data Firehose | Near-real-time auto-loading of streams into S3/Redshift/OpenSearch, no code. |
| **Shard** | — | The throughput-scaling unit of a Kinesis stream. |
| **Partition Key** | — | The key DynamoDB uses to spread data; must be high-cardinality to avoid hot partitions. |
| **Hot Partition** | — | A bottleneck caused by traffic concentrating on a few keys. |
| **Multipart Upload** | — | Uploads a large file to S3 in parallel parts, resumable. |
| **Transfer Acceleration** | — | Speeds up cross-Region S3 uploads via edge locations. |

:::tip
This table will keep expanding as content for each domain grows.
:::
