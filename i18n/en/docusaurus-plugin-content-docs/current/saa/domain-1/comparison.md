---
sidebar_position: 6.5
title: Service Comparison & Exam Cheat Sheet
---

# Domain 1 Service Comparison & Exam Cheat Sheet

> This page distills the **most easily confused** services in Domain 1 (Security) into comparison tables for an efficient last-minute review. Each table ends with a one-line "**How to choose on the exam**" tip — when you see the keyword in a question stem, you can map straight to the answer.

:::tip[How to use this page]
Read the topic pages first to build the concepts, then use this page for your final review. For each table, remember the cell that **only that service can do** — that is usually the deciding point in a question.
:::

## 1. Security Group vs NACL (network firewalls)

| Item | Security Group | NACL (Network Access Control List) |
|---|---|---|
| Scope | Instance (ENI) level | Subnet level |
| State | **Stateful** (response traffic auto-allowed) | **Stateless** (inbound and outbound set separately) |
| Rule types | Allow only | Both Allow and **Deny** |
| Rule evaluation | All rules together | **By number, lowest first**, stops at first match |
| Default behavior | Deny all by default, must explicitly allow | Default NACL allows all; a custom one denies all |

**How to choose on the exam**: control at the level of a single server with responses auto-allowed → **Security Group**; block a specific IP (Deny) across an entire subnet → **NACL**. A stem saying "can connect in but not out" usually means a stateless NACL missing the outbound rule.

## 2. KMS key types

| Item | AWS owned key | AWS managed key | Customer managed key (CMK) |
|---|---|---|---|
| Who manages | AWS, invisible to you | AWS on your behalf (`aws/service`) | **You** |
| Custom key policy | No | No | **Yes** |
| Control rotation | No | Auto yearly, not changeable | **Customizable** (can enable auto-rotation) |
| Auditable usage | No | Yes (CloudTrail) | **Yes (CloudTrail)** |
| Cost | Free | Free (the key itself) | Per-key monthly fee + API calls |

**How to choose on the exam**: whenever the stem says "**custom key policy / control rotation yourself / share a key across accounts**" → always pick the **Customer managed key (CMK)**. If you do not care about control and just need encryption → an AWS managed key is enough.

## 3. Secrets Manager vs Parameter Store

| Item | AWS Secrets Manager | SSM Parameter Store |
|---|---|---|
| Main purpose | Secrets (passwords, API keys, DB credentials) | Config parameters (can also hold secrets) |
| **Automatic rotation** | **Built-in** (integrated with RDS, etc.) | None (write your own Lambda) |
| Encryption | Encrypted with KMS by default | SecureString encrypted with KMS |
| Cost | Per-secret monthly fee + API | Standard parameters are **free**; advanced parameters are charged |

**How to choose on the exam**: a stem stressing "**automatically rotate** a database password without maintaining rotation code" → **Secrets Manager**; just storing general config at the **lowest cost** → **Parameter Store standard parameters**.

## 4. CloudTrail vs Config vs GuardDuty (the three audit/monitoring services)

| Service | Question it answers | Typical use |
|---|---|---|
| **CloudTrail** | "**Who** did which **API action** to AWS, and **when**?" | Activity audit, tracing who deleted a resource |
| **AWS Config** | "What is a resource's **configuration**, is it **compliant**, and when did it change?" | Configuration compliance, detecting unencrypted volumes, etc. |
| **GuardDuty** | "Is there any **threat** or anomalous behavior?" | Intelligent threat detection (mining, malicious IPs, anomalous API) |

**How to choose on the exam**: keyword mapping — "**who called which API**" → CloudTrail; "**is the configuration compliant / configuration change history**" → Config; "**automatically detect threats / suspicious behavior**" → GuardDuty.

## 5. WAF vs Shield vs ACM (application-layer protection)

| Service | What it protects / does | Layer |
|---|---|---|
| **AWS WAF** | Filters malicious HTTP requests (SQL injection, XSS, block IPs/strings by rules) | Layer 7 (application) |
| **AWS Shield Standard** | Automatic, free baseline DDoS protection (on by default) | Layer 3/4 |
| **AWS Shield Advanced** | Advanced DDoS protection, cost protection, 24/7 support | Layer 3/4 |
| **ACM** | Issues and **auto-renews** TLS/SSL certificates (HTTPS encryption) | Encryption in transit (not attack protection) |

**How to choose on the exam**: "block request content such as **SQL injection / XSS**" → WAF; "block large-scale **DDoS** traffic" → Shield; "need an **HTTPS certificate with auto-renewal**" → ACM. Note that ACM is about **encryption**, not **attack protection** — do not mix them up.

## 6. VPC Gateway Endpoint vs Interface Endpoint (PrivateLink)

| Item | Gateway Endpoint | Interface Endpoint (PrivateLink) |
|---|---|---|
| Services supported | **Only S3 and DynamoDB** | Most AWS services (SQS, SNS, KMS, ...) |
| How it works | Adds a route to the route table | Places a **private-IP network interface (ENI)** in the subnet |
| Cost | **Free** | Hourly fee + data processing fee |

**How to choose on the exam**: private access from a private subnet to **S3 / DynamoDB** at the **lowest cost** → **Gateway Endpoint** (free); access to **other services** (SQS, SNS, etc.) → **Interface Endpoint**. "No internet + S3" is almost always a Gateway Endpoint.

## 7. IAM policy types

| Policy type | Attached to | Purpose |
|---|---|---|
| Identity-based | User / group / role | What this identity can do |
| Resource-based | A resource (e.g. an S3 bucket policy) | Which principals/accounts can access this resource; can be cross-account |
| **SCP** (Service Control Policy) | Organizations account / OU | Sets the **permissions ceiling** for a whole account (blocks even admins) |
| **Permissions boundary** | A single user / role | Sets the permissions ceiling for **this identity** (intersection) |

**How to choose on the exam**: "a **whole account** cannot use a service, not even admins" → **SCP**; "cap the permissions of a **single identity**, often for delegating role creation" → **Permissions boundary**; "**cross-account** access to a resource" → **Resource-based policy** (with the other side's Role/STS).

<Refs title="📚 Official docs & further reading">

- [Compare security groups and network ACLs](https://docs.aws.amazon.com/vpc/latest/userguide/infrastructure-security.html)
- [AWS KMS key concepts](https://docs.aws.amazon.com/kms/latest/developerguide/concepts.html)
- [SCPs and permissions boundaries (IAM policy evaluation)](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html)
- [VPC endpoint types](https://docs.aws.amazon.com/vpc/latest/privatelink/concepts.html)

</Refs>
