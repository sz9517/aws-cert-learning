---
sidebar_position: 2
title: Data Encryption (KMS)
---

# Data Encryption and KMS: the "key safe" that locks your data

> Encryption is one of the core topics in Domain 1. This page takes you from "why encrypt" all the way to "how to use KMS" — no cryptography background needed.

<Vocab title="📌 Jargon you'll see on this page (fine even if you've never touched AWS)">

- **Encryption**: turning readable data (plaintext) into gibberish (ciphertext) using a "key"; without the key, it's unreadable.
- **Key**: the "key" used to encrypt and decrypt — essentially a very long random string.
- **KMS (Key Management Service)**: the AWS service that **centrally stores and manages keys** — like a locked "key safe".
- **At Rest**: data is encrypted **while stored on disk** (e.g. in S3 or EBS).
- **In Transit**: data is encrypted **while moving over the network** (that's the `https` / TLS in front of a URL).

</Vocab>

## Why do you need encryption?

<Scenario title="Real scenario: a hard drive gets stolen">

A company server's hard drive is stolen, containing hundreds of thousands of customer records. If the data is **not encrypted**, the thief can plug it into a computer and read it directly — the company ends up in the news, fined, and paying damages. If the data **is encrypted**, all the thief gets is gibberish — **without the key, it's just scrap metal**.

</Scenario>

Encryption must cover two directions — **both are required**:

| Direction | Plain meaning | How to achieve it |
| --- | --- | --- |
| **At Rest** | Data is locked **while sitting on disk** | Enable encryption on S3, EBS, RDS (backed by KMS) |
| **In Transit** | Data is locked **while moving** | Use HTTPS / TLS connections |

## What is KMS? A safe-deposit analogy

<Analogy title="🔐 Analogy: think of KMS as a bank vault + key management room">

- Your data = the valuables in a safe-deposit box
- **Data Key** = the key that opens your box
- **KMS Key (CMK)** = the **master key in the "key management room" that locks up all the keys**; it **never leaves KMS** (even you can't take it out — you can only ask KMS to encrypt/decrypt for you)
- So even if someone steals your "data key", that key itself is locked by the KMS master key — unusable without KMS's help

This approach of "using one key to encrypt another key" is called **Envelope Encryption**, and it's the core design of KMS.

</Analogy>

## The three types of KMS keys (frequently tested)

| Type | Who creates/manages | Characteristics | Cost |
| --- | --- | --- | --- |
| **AWS owned** | Fully managed by AWS | Invisible to you, nothing to manage, shared across accounts | Free |
| **AWS managed** | Managed by AWS, tied to a service | Named like `aws/s3`, `aws/ebs`; auto-rotated | Free (but API calls billed) |
| **Customer managed (CMK)** | **You create and control it** | Custom permissions, rotation, disable, audit | **$1/month each** + API calls |

:::tip[💡 Exam key point: when do you need a "customer managed key" (CMK)?]
When a question emphasizes that you need to **control key permissions yourself, set a custom rotation schedule, or audit who used the key**, the answer is a **Customer managed key**. If you just need "encryption, but don't care who manages the key", an AWS managed key is enough (and has no monthly fee).
:::

## How it works (envelope encryption diagram)

<div className="flow">
  <div className="flow-node">App wants to store data</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">asks KMS for a data key</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">encrypts data with the data key</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">stores the "encrypted data key" alongside the data</div>
</div>

*Diagram: the data key itself is locked by the KMS master key; to decrypt later, you ask KMS to unlock the data key.*

## S3's three encryption options (high-frequency topic)

When a question asks "how to encrypt S3", remember the difference between these three:

| Option | Full name | Who manages the key | Key point |
| --- | --- | --- | --- |
| **SSE-S3** | Server-Side Encryption with S3 keys | AWS handles everything | Easiest, the default |
| **SSE-KMS** | Server-Side Encryption with KMS | Uses KMS (can use your CMK) | Permission control & auditing; pick this when the question wants "audit/control" |
| **SSE-C** | Server-Side Encryption with Customer keys | **You provide and keep the key** | AWS doesn't store your key — lose it and the data is gone |

## Real-world application

### 🛠️ Hands-on: make an S3 bucket encrypt by default

1. AWS console → search `S3` → open your bucket
2. Top tabs → **Properties**
3. Find **Default encryption** → Edit
4. Choose **SSE-KMS**, key `aws/s3` (or your own CMK) → Save
5. From now on, uploaded files are **automatically encrypted** — no manual step each time

Upload a file via CLI with KMS encryption:

```bash
# Upload a file encrypted with KMS
$ aws s3 cp report.csv s3://my-company-reports/ \
    --sse aws:kms

# Check the object to confirm it's encrypted
$ aws s3api head-object \
    --bucket my-company-reports \
    --key report.csv
# The response will include "ServerSideEncryption": "aws:kms"
```

<Cost>

- **Customer managed key (CMK)**: **US$1/month** each (prorated), plus **API call fees** for each encrypt/decrypt (about US$0.03 per 10,000 calls).
- **AWS managed keys** (`aws/s3`, etc.): **no monthly fee**, only API call fees.
- For practice, start with an AWS managed key like `aws/s3` to avoid the fixed $1/month charge. If you do create a test CMK, remember to **schedule its deletion** when done (KMS key deletion has a 7–30 day waiting period).

</Cost>

:::warning[🚑 Common real-world mistakes]
- **Deleting/disabling a key = permanently unrecoverable data!** Everything encrypted with that key becomes undecryptable. Deleting a KMS key must be done very carefully (that's why AWS has a waiting period so you can change your mind).
- **Assuming "IAM permission is enough to use a key"**: a KMS key also has its own **Key Policy** — **both** the IAM allow **and** the key policy allow must pass. This is a very common Access Denied cause.
- **Losing your own SSE-C key**: AWS keeps nothing for you — lost is lost.
:::

:::tip[💡 One-liner to remember in-transit vs at-rest]
- See **HTTPS / TLS / SSL** → it's about **In Transit** encryption.
- See **S3 / EBS / RDS encryption, KMS** → it's about **At Rest** encryption.
:::

## Next

- ⚡ Review: [Domain 1 Flashcards](./flashcards.md)
- ✍️ Quiz: [Domain 1 Practice Questions](./quiz.md)
- 📖 Next page: [Network Security: Security Group vs NACL](./security-group-nacl.md)
