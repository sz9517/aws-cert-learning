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

## Why do you need "three" of them? One-line division of labor (this is the easiest thing to confuse)

Most people's first reaction is: "Aren't they all about security? Why not just turn on one?" The key is that **they look at completely different things** — skip one and you have a blind spot:

<Analogy title="🏢 Analogy: three kinds of records in one building">

- **CloudTrail = the access-card reader**: it faithfully records "**who, at what time, swiped which door**" (what action was taken). It does not care how you arrange the furniture after you enter, nor whether you are a bad actor — it **only records the action itself**.
- **AWS Config = the room's current-state and renovation logbook**: it records "**what the room looks like now, and whether it meets the rules (e.g. fire exits must not be blocked)**" (configuration state and compliance), and can even replay "what color this wall was last week". It does not care whose card got them in.
- **GuardDuty = the security analysts' room**: it watches the door logs and camera feeds and **judges whether a pattern of behavior looks like a bad actor** (threat detection) — e.g. "this card swiped 50 times overnight from a country it has never visited". It produces no records of its own; instead it **feeds on logs from CloudTrail and others and analyzes them**.

</Analogy>

In plain English, chained together:

<div className="flow">
  <div className="flow-node">Who did what?<br/>(CloudTrail)</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Is the config compliant?<br/>(Config)</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Is any of this a threat?<br/>(GuardDuty)</div>
</div>

:::info[🔑 The one key difference: recording "actions" vs "state"?]
- **CloudTrail records an "action ledger"**: at 10:00 `alice` called `PutBucketPolicy`. It answers "**what happened**".
- **Config records "state snapshots and compliance"**: bucket `my-bucket` **is** public right now, and it **violates** the "must not be public" rule. It answers "**what things look like now, and whether they are compliant**".
- For the same event "someone made a bucket public": **CloudTrail** tells you "alice changed it at 10:00", while **Config** tells you "it is public now, non-compliant, and was private until last Friday". The two are **complementary** — the exam loves to contrast this pair.
:::

## Why choose it / pros and cons / when NOT to use it (one by one)

### CloudTrail

- **Why choose it**: this is your AWS account's "**black box**". Any after-the-fact investigation, security forensics, or audit compliance (who deleted the database, who changed IAM permissions) relies on it. **When something breaks and you need accountability, CloudTrail is the first thing you check.**
- **Pros**: the first trail for management events is **free**; one trail records the whole account; logs can be shipped to S3 for long-term retention and to CloudWatch Logs for real-time alerting.
- **Cons / limits**: **data events** (such as S3 object-level reads/writes, Lambda invocations) are high-volume and **cost extra** — turning them all on gets expensive; logs have a **few minutes of delay**, so this is not real-time monitoring (use CloudWatch for live health).
- **When NOT to use / misuse it**: do not treat it as "performance monitoring" — it does not tell you whether CPU is high, nor does it actively judge threats. It is just a faithful ledger.

### AWS Config

- **Why choose it**: use it when you need to answer "**are my resources compliant?**" or "**when was this setting changed to something bad?**". It continuously evaluates rules (e.g. "all EBS must be encrypted", "security groups must not open port 22 to 0.0.0.0/0"), and **flags non-compliance and can auto-remediate**.
- **Pros**: a **configuration timeline** lets you replay any resource's historical state; many managed rules are built in; it can aggregate compliance across accounts and Regions (Aggregator).
- **Cons / limits**: **billed by the number of configuration items recorded + rule evaluations** — with many resources and many rules, the bill grows quietly; it looks at "configuration", and **does not track which API actions happened** in your account (that is CloudTrail's job).
- **When NOT to use / misuse it**: if you do not need compliance auditing and only want to know "who did what", do not use Config — that is CloudTrail's job. Also, do not record every resource type; pick the ones you actually care about.

### GuardDuty

- **Why choose it**: the first two are "**records**"; GuardDuty is "**judgment**". Using machine learning and threat intelligence, it automatically **finds suspicious behavior** in CloudTrail, VPC Flow Logs, and DNS logs (compromised credentials, crypto-mining, malicious outbound connections) — you do not have to write rules and babysit logs.
- **Pros**: **works out of the box, enabled with one click** — no agents to deploy, no logs to move; threat intelligence stays updated; findings can automatically trigger EventBridge for handling.
- **Cons / limits**: **billed by the volume of logs analyzed** — cost can be significant under high traffic; it only **tells you something is "suspicious"**, it does not block it for you (pair it with Lambda / Security Hub for automated response); occasional false positives need a human to judge.
- **When NOT to use / misuse it**: it is **not an audit log** (use CloudTrail for history) and **not a compliance check** (use Config for compliance). Do not expect it to answer "who did what at what time" — it answers "does anything smell bad".

:::tip[💡 One-line selection guide]
- To **investigate "who did what" after the fact** → CloudTrail
- To check **whether config is compliant, and replay config history** → Config
- To **passively, automatically detect threats** without writing rules yourself → GuardDuty
- In the real world all three are **often enabled together**: CloudTrail as the data source, Config for compliance, GuardDuty for threats.
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

**Expected result**: a list of JSON events, each with `EventName` (e.g. `DeleteBucket`), `Username`, `EventTime`, source IP, and more. This is the hard evidence of "what alice did and when".

:::info[🔑 Two switches most often overlooked when creating a Trail]
When you create a trail in the console it **defaults to all Regions** (keep it that way), and be sure to get two things right:
- **Multi-region**: ensures operations in **any Region** are recorded; otherwise an attacker only has to act in a Region you did not cover and you will not be able to investigate it.
- **Log file validation**: once enabled, CloudTrail digitally signs the logs so you can later prove the **logs have not been tampered with** — which is what makes an audit hold up.
Set both at once via CLI:

```bash
$ aws cloudtrail create-trail \
    --name account-activity \
    --s3-bucket-name my-cloudtrail-logs \
    --is-multi-region-trail \
    --enable-log-file-validation
# After creating, you must start recording
$ aws cloudtrail start-logging --name account-activity
```

**Expected result**: `create-trail` returns the trail's ARN and settings (`IsMultiRegionTrail: true`, `LogFileValidationEnabled: true`); `start-logging` has no output on success, after which date-partitioned log files begin appearing in the S3 bucket.
:::

### 🛠️ Hands-on: use a Config rule to check "are any S3 buckets public"

CloudTrail only tells you "who did what", but to **continuously confirm whether config is compliant** you need Config. Below, one AWS managed rule catches S3 buckets that were made public:

1. Console → search `Config` → **Set up AWS Config**, choose which resources to record and an S3 bucket to store logs
2. Go to **Rules → Add rule**, search for the managed rule `s3-bucket-public-read-prohibited` and apply it
3. After a few minutes, Config evaluates each existing S3 bucket as **Compliant** or **Non-compliant**

Apply the same rule and check results via CLI:

```bash
# Apply an AWS managed rule: prohibit publicly readable S3 buckets
$ aws configservice put-config-rule \
    --config-rule '{"ConfigRuleName":"s3-no-public-read","Source":{"Owner":"AWS","SourceIdentifier":"S3_BUCKET_PUBLIC_READ_PROHIBITED"}}'

# Find which resources are non-compliant
$ aws configservice get-compliance-details-by-config-rule \
    --config-rule-name s3-no-public-read \
    --compliance-types NON_COMPLIANT
```

**Expected result**: `put-config-rule` has no output on success; a few minutes later `get-compliance-details-by-config-rule` lists **every bucket set to public read**, each marked `ComplianceType: NON_COMPLIANT` with its resource ID. You can spot "which bucket is a leak risk" at a glance, instead of clicking into each one yourself.

<Cost>

- **CloudTrail**: the **first trail for management events is free** (records API operations); data events and additional trails are billed.
- **AWS Config**: billed by the **number of configuration items recorded** and **rule evaluations** — watch out when you have many resources.
- **GuardDuty**: billed by the volume of logs analyzed, with a **30-day free trial**.
- **CloudWatch**: basic metrics are free; custom metrics, log storage, and alarms are billed.
- Practice tip: CloudTrail's free trail is safe to enable; turn off GuardDuty / Config after testing to avoid ongoing charges.

</Cost>

:::warning[🚑 Common gotchas]
- **Confusing the three (highest-frequency exam trap)**: **CloudTrail = who did what (action audit)**, **Config = is the config compliant (state & compliance)**, **GuardDuty = is there a threat (intelligent detection)**. Plus one that often gets mixed in: **CloudWatch = is the system OK (performance monitoring)**. If the question asks "who deleted it" pick CloudTrail, "is it compliant" pick Config, "detect abnormal behavior" pick GuardDuty — do not swap them.
- **CloudTrail without multi-region**: with only a single Region enabled, an attacker acting in a Region you did not cover goes untracked. Always create the trail with `--is-multi-region-trail` so operations in **any Region** are recorded.
- **Logs not stored in S3 + not encrypted / not validated**: audit records lose their value if they can be tampered with. The S3 bucket storing logs must have **encryption on and permissions locked down**, and enable **log file validation** so you can later prove the records were not altered.
- **Config rule and recording costs running wild**: Config is **billed by the number of configuration items recorded + rule evaluations** — record every resource type plus a pile of rules and the bill quietly explodes. Record only the resource types and rules you truly care about.
- **Assuming GuardDuty blocks things itself**: it only **alerts**, it does not **block** — pair it with EventBridge + Lambda / Security Hub for automated response. Also turn it off after testing, since it bills continuously by log volume.
- **Never enabling CloudTrail**: when something happens, you cannot look up any history — like having no security camera. Enable it as soon as the account is created (the first management-events trail is free).
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
