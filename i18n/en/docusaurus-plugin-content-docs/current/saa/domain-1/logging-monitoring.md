---
sidebar_position: 6
title: "Auditing & Monitoring: CloudTrail / Config / GuardDuty"
---

# Auditing & Monitoring: when something breaks, can you find out?

> Security isn't just "blocking" — it's also being able to **see**: who did what, and whether the system is behaving abnormally. These four services are easy to confuse, so this page sorts them out once and for all (the exam loves to compare them).

<Vocab title="📌 Jargon you'll see on this page">

- **CloudTrail**: records "**who did what to AWS, and when**" — the audit log (API history).
- **CloudWatch**: monitors "**system health and performance metrics**" (CPU, memory, traffic), collects logs, and sets alarms.
- **AWS Config**: records "**the configuration state and change history of resources**" and checks **compliance**.
- **GuardDuty**: uses machine learning to **automatically detect suspicious/threatening behavior**.

</Vocab>

## Why do you need them?

<Scenario title="Real scenario: someone changed a server's config at midnight">

The next day the system has problems, and the boss asks: "**Who** changed it, at what time? **What** did they change?" Without auditing and monitoring, all you can do is shrug. With these services, you can precisely answer every "who, when, what, and how was the system doing".

</Scenario>

## Four services, each with its own job (this table is key)

| Service | The question it answers | One-line role | Analogy |
| --- | --- | --- | --- |
| **CloudTrail** | "**Who** performed what action?" | **Audit log** of API operations | The building's **access-card log** |
| **CloudWatch** | "Is the system **healthy right now**?" | Performance **monitoring** and alarms | A patient's **heart-rate/BP monitor** |
| **AWS Config** | "What was the config **changed to**? Compliant?" | Resource **config change** tracking & compliance | A room's **renovation record** |
| **GuardDuty** | "Is there a **bad actor** at work?" | Intelligent **threat detection** | The building's **security operations center** |

:::tip[💡 The distinctions most commonly tested]
- To find "**which user deleted a resource / called which API**" → **CloudTrail** (audit, API history).
- To "**monitor CPU usage and alarm when too high**" → **CloudWatch**.
- To "**ensure all S3 buckets are encrypted and alert on non-compliance**" → **AWS Config** (compliance checks).
- To "**automatically detect abnormal logins and malicious IP connections**" → **GuardDuty**.
:::

## How they work together (diagram)

<div className="flow">
  <div className="flow-node">User action</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">CloudTrail records "who did what"</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">GuardDuty analyzes logs for threats</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">CloudWatch raises an alarm to notify you</div>
</div>

*Diagram: these services are often chained — CloudTrail provides records, GuardDuty analyzes, CloudWatch alerts.*

## Real-world application

### 🛠️ Hands-on: enable CloudTrail to record all account activity

1. Console → search `CloudTrail` → **Create trail**
2. Name it `account-activity`, specify an S3 bucket to store logs (one is suggested automatically)
3. Once created, **all API operations in the account are recorded**
4. Then use **Event history** to search "who did what, and when"

Query recent activity via CLI:

```bash
# Look up recent actions performed by a user
$ aws cloudtrail lookup-events \
    --lookup-attributes AttributeKey=Username,AttributeValue=alice \
    --max-results 10
```

<Cost>

- **CloudTrail**: the **first trail for management events is free** (records API operations); data events and additional trails are billed.
- **AWS Config**: billed by the **number of configuration items recorded** and **rule evaluations** — watch out when you have many resources.
- **GuardDuty**: billed by the volume of logs analyzed, with a **30-day free trial**.
- **CloudWatch**: basic metrics are free; custom metrics, log storage, and alarms are billed.
- Practice tip: CloudTrail's free trail is safe to enable; turn off GuardDuty / Config after testing to avoid ongoing charges.

</Cost>

:::warning[🚑 Common real-world mistakes]
- **Confusing CloudTrail with CloudWatch**: remember "**Trail = who did what (audit)**" and "**Watch = is the system OK (performance monitoring)**".
- **Never enabling CloudTrail**: when something happens, you can't look up any history — like having no security camera. Enable it as soon as the account is created.
- **Not protecting the logs**: the S3 bucket storing logs needs proper permissions and encryption, or the audit records themselves can be tampered with and lose their value.
:::

## The Domain 1 map so far

You've now covered the main topics of Domain 1, "Design Secure Architectures":

1. [IAM — Identity and Access Management](./iam.md) — who can do what
2. [Data Encryption (KMS)](./kms.md) — locking data
3. [Security Group vs NACL](./security-group-nacl.md) — network firewalls
4. [S3 Data Security](./s3-security.md) — don't leak storage
5. [Secrets Management](./secrets-management.md) — don't hard-code passwords
6. **Auditing & Monitoring** (this page) — be able to see and investigate

<Refs title="📚 Official docs & further reading">

- [AWS CloudTrail User Guide](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-user-guide.html)
- [What is AWS Config](https://docs.aws.amazon.com/config/latest/developerguide/WhatIsConfig.html)
- [What is Amazon GuardDuty](https://docs.aws.amazon.com/guardduty/latest/ug/what-is-guardduty.html)

</Refs>

## Next

- ⚡ Review everything: [Domain 1 Flashcards](./flashcards.md)
- ✍️ Check yourself: [Domain 1 Practice Questions](./quiz.md)
