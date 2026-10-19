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

:::tip
This table will keep expanding as content for each domain grows.
:::
