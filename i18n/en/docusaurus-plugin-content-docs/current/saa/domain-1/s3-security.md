---
sidebar_position: 4
title: S3 Data Security
---

# S3 Data Security: don't let your bucket become a public database

> S3 misconfiguration leading to data leaks is **the most common cloud incident** in the real world. This page teaches you how to lock S3 down — also a high-frequency exam topic.

<Vocab title="📌 Jargon you'll see on this page">

- **Bucket**: the "big container" in S3 that stores files; its name is globally unique — like a folder that's also a URL.
- **Object**: a **single file** stored in a bucket (image, video, report, etc.).
- **Bucket Policy**: JSON rules that decide **who can do what to this bucket**.
- **Block Public Access**: a master switch that **ensures a bucket won't be made public** in one click.
- **Pre-signed URL**: a **temporary, time-limited URL** that lets someone without permissions download a specific file within a limited time.

</Vocab>

## Why pay special attention to S3 security?

<Scenario title="Real scenario: one wrong checkbox, millions of records public">

For convenience, an engineer sets an S3 bucket holding customer PII to "public" — and now **anyone with the URL can download it**. News of "misconfiguration causing a leak" happens every year. S3 is actually secure (private) by default; the problem is almost always **a human opening it up**.

</Scenario>

## S3's four lines of defense (outer to inner)

<div className="flow">
  <div className="flow-node">① Block Public Access</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">② Bucket Policy / IAM</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">③ Encryption</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">④ Versioning / Auditing</div>
</div>

### ① Block Public Access — the most important master switch

This is S3's **first and most critical** line of defense. It can be enabled at the account and bucket level, and is **on by default**. Unless you truly intend to run a public website, **keep it on at all times**.

:::tip[💡 Exam key point]
If a question asks "how to ensure a bucket is **never** accidentally made public", the answer is **enable Block Public Access**. It overrides any bucket policy or ACL that accidentally sets things public.
:::

### ② Who can access: Bucket Policy vs IAM vs ACL

| Method | Applied to | Plain meaning |
| --- | --- | --- |
| **IAM policy** | A user/role | Controls "which S3 **this person** can touch" |
| **Bucket Policy** | A bucket | Controls "who **this bucket** allows", also for cross-account sharing |
| **ACL** | Legacy method | AWS no longer recommends it; prefer the two above |

### ③ Encryption

Combine with the previous page on [KMS](./kms.md): enable **default encryption (SSE-KMS or SSE-S3)** so all uploads are automatically encrypted at rest; use **HTTPS** in transit.

### ④ Versioning and auditing

- **Versioning**: keeps old versions when a file is overwritten or deleted — lets you recover accidental deletes or ransomware-encrypted files.
- **MFA Delete**: deleting objects requires extra MFA verification, preventing malicious deletion.
- **S3 access logs / CloudTrail**: record who accessed what (see the next page, [Logging & Monitoring](./logging-monitoring.md)).

## How to securely share a "single file" with outsiders?

<Analogy title="🎟️ Analogy: a pre-signed URL = a timed entry ticket">

You don't want to make the whole bucket public, but you need a customer to download one report. A **Pre-signed URL** is like a **timed entry ticket**: whoever holds the URL can download that **one file** within the time you set (e.g. 15 minutes), after which it expires. Secure and convenient.

</Analogy>

## Real-world application

### 🛠️ Hands-on: confirm a bucket isn't public + generate a timed download link

**Confirm Block Public Access:**

1. `S3` → click the bucket → **Permissions** tab
2. Confirm **Block public access** shows **On**

**Generate a 15-minute download link via CLI:**

```bash
# Generate a pre-signed URL that expires after 900 seconds (15 minutes)
$ aws s3 presign s3://my-company-reports/report.csv \
    --expires-in 900
# Returns a long URL; give it to someone for a time-limited download
```

**(Advanced) Force all connections to use HTTPS via a bucket policy:**

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Deny",
    "Principal": "*",
    "Action": "s3:*",
    "Resource": "arn:aws:s3:::my-company-reports/*",
    "Condition": { "Bool": { "aws:SecureTransport": "false" } }
  }]
}
```

*This policy means: deny anything not using HTTPS (SecureTransport=false), effectively forcing encrypted transit.*

<Cost>

S3's security features — **Block Public Access, bucket policies, the versioning toggle, pre-signed URLs — are all free**. Note: once **versioning** is on, old versions still consume storage (counted toward storage cost); pair it with **lifecycle rules** to auto-clean old versions and save money.

</Cost>

:::warning[🚑 Common real-world mistakes]
- **Making a bucket public for "temporary convenience"** and forgetting to turn it off → the most common leak cause. To share a single file, use a **pre-signed URL**, not an open bucket.
- **Thinking "private means no encryption needed"**: access control and encryption are **two different things** — do both.
- **Turning off versioning to "save money"** and losing accidental-delete recovery → keep versioning on and use lifecycle rules to clean old versions.
:::

<Refs title="📚 Official docs & further reading">

- [Security in Amazon S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/security.html)
- [Blocking public access (Block Public Access)](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html)

</Refs>

## Next

- ⚡ Review: [Domain 1 Flashcards](./flashcards.md)
- ✍️ Quiz: [Domain 1 Practice Questions](./quiz.md)
- 📖 Next page: [Secrets Management: Secrets Manager vs Parameter Store](./secrets-management.md)
