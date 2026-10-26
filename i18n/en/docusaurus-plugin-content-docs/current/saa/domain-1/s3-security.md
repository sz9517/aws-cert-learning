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

#### Why is Block Public Access on by default? How does it relate to policies?

Since 2023, AWS turns all four Block Public Access switches **on by default for new buckets**, and **new buckets have ACLs disabled by default**. The reason is simple: the biggest cloud leaks in history came from "someone wrote a public policy or ACL and nobody noticed". Rather than cleaning up after the fact, block it by default.

**Think of it as a final safety net, not a replacement for policies:**

<div className="flow">
  <div className="flow-node">Your policy/ACL says "allow public"</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Block Public Access checks again</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">If the switch is On, it still blocks and refuses public</div>
</div>

In other words: **policies/ACLs decide "who can access", while Block Public Access decides "whether any public setting is allowed to take effect"**. Even if you (or a colleague, or some IaC) accidentally writes a public policy with `Principal: "*"`, as long as Block Public Access is on, public exposure simply will not happen. The two **coexist and do not replace each other**: use policies for fine-grained authorization day to day, and let Block Public Access be the "no leak even if you slip" insurance.

:::info[🔑 A commonly confused idea]
Block Public Access **only blocks "public"** (open to anonymous everyone or the whole internet). It does **not** block the **named grants** you make with a bucket policy / IAM (a specific account, a specific role). So keeping it on does not affect legitimate cross-account sharing or granting access to specific services.
:::

### ② Who can access: Bucket Policy vs IAM vs ACL

| Method | Applied to | Plain meaning |
| --- | --- | --- |
| **IAM policy** | A user/role | Controls "which S3 **this person** can touch" |
| **Bucket Policy** | A bucket | Controls "who **this bucket** allows", also for cross-account sharing |
| **ACL** | Legacy method | AWS no longer recommends it; prefer the two above |

#### How to choose among the three? Why prefer policies and avoid ACLs now?

The plain-language rule of thumb: **first ask "am I managing a person, or managing a bucket?"**

- To control "which buckets **this user/role** can touch" → use an **IAM policy** (permissions centered on the identity, easy to audit "what can this person do").
- To control "who **this bucket** opens to", or to do **cross-account** sharing, or to write conditions like **force HTTPS / force encryption** → use a **bucket policy** (permissions centered on the resource, so you can see at a glance "what this bucket exposes").
- **ACL**: avoid it.

<Analogy title="🏢 Analogy: IAM is an employee badge, a bucket policy is the visitor list at a room's door">

- **IAM policy = employee badge**: decides which rooms (which buckets) this employee (user/role) can enter.
- **Bucket policy = the list taped to a room's door**: decides who this room (bucket) lets in — you can even write "people from another company (another account)" onto the list.
- **ACL = the old "a sticky note on every desk" approach**: fine-grained but scattered, one per object; once there are many, you cannot audit them, which is why AWS tells you to stop using it.

</Analogy>

| Method | Pros | Cons / limits | When not to use |
| --- | --- | --- | --- |
| **IAM policy** | Permissions bound to identity; centrally manages "what a person can do"; supports groups and conditions | Cannot see "what a bucket exposes externally"; **cannot do cross-account, cannot grant to anonymous public** | When you need cross-account sharing, or conditions on the bucket itself (like force TLS), it cannot do it |
| **Bucket policy** | Permissions centered on the resource; see at a glance what the bucket exposes; **cross-account capable**; can write `Condition` (force HTTPS / encryption / source IP) | A single policy has a size limit (20 KB); with many rules, be careful not to contradict yourself | Almost always the right choice; just be careful not to slip and write a public `Principal: "*"` clause |
| **ACL (legacy)** | Historical artifact; was once the only way to do "object-level public" | Coarse-grained, scattered across each object, hard to audit; incompatible with modern conditional authorization | **Almost never**. New buckets disable ACLs by default; only for rare legacy cases like "objects owned by another account" |

:::tip[💡 Exam key point: policy vs ACL keywords]
- Question mentions **"cross-account access", "force HTTPS / force encryption", "restrict source IP", "only accessible via VPC Endpoint"** → almost always a **bucket policy** (these rely on `Condition`).
- Question mentions **"which S3 permissions a certain user / application role should have"** → an **IAM policy**.
- Question says **"modernize, centrally manage access, disable ACLs"** → enable **S3 Object Ownership = Bucket owner enforced** (turns off ACLs entirely, everything goes through policies). When you see "want to get rid of ACLs", pick this.
:::

### ③ Encryption

Combine with the previous page on [KMS](./kms.md): enable **default encryption (SSE-KMS or SSE-S3)** so all uploads are automatically encrypted at rest; use **HTTPS** in transit.

:::note[💬 Good news]
Since 2023, **all S3 buckets encrypt with SSE-S3 by default** — even if you set nothing, newly uploaded objects are already encrypted at rest. So the question today is not "should I encrypt" but "**which key management should I use**".
:::

#### SSE-S3 vs SSE-KMS vs SSE-C: how to choose? (trade-offs, cost, auditing)

All three are **server-side encryption (SSE)**; the difference is only **who manages the key, whether it is auditable, and whether it costs money**:

| Option | Who manages the key | Can you audit "who decrypted"? | Cost | Plain meaning |
| --- | --- | --- | --- | --- |
| **SSE-S3** (default) | **AWS fully manages it**; you never see or touch the key | ❌ No | **Free** | "Just encrypt it for me" — least effort, the default |
| **SSE-KMS** | Your key in **KMS**; customizable rotation, permissions, policy | ✅ Every decrypt lands in **CloudTrail** | KMS monthly key fee + **per API call** | "I need to control the key and have decrypt records" — top pick for compliance/audit |
| **SSE-C** | **You** supply and keep the key; S3 uses it and discards it | Up to you | Free (but you carry all key management) | "AWS must never hold the key" — only for rare regulatory needs |

**The plain-language choice:**

- **Default, no thinking required** → **SSE-S3**. Free, automatic, enough for the vast majority of data.
- **Need compliance, key rotation, and to know "who decrypted this data and when"** → **SSE-KMS**. Its CloudTrail record is often the correct answer on audit questions.
- **AWS cannot even hold the key** (rare regulatory scenario) → **SSE-C**, but the cost is **lose the key = data is gone forever**, and you must bring the key on every access.

<Analogy title="🔑 Analogy: three kinds of safes">

- **SSE-S3 = a hotel safe**: the hotel (AWS) locks and unlocks for you; you do not manage keys — convenient, but you have no record of "who opened it".
- **SSE-KMS = a bank safe-deposit box**: the key is in your name (KMS), and every time someone opens the box the bank logs it (CloudTrail), so it is traceable — but the box has a monthly rent plus a fee per opening.
- **SSE-C = your own padlock, and you always carry the key**: AWS only hangs the lock you bring and never keeps the key; lose the key and it can never be opened.

</Analogy>

:::tip[💡 Exam key point: encryption selection keywords]
- Question mentions **"audit/track who accessed encrypted data", "control and rotate keys", "regulation requires a CMK (customer managed key)"** → **SSE-KMS**.
- Question mentions **"least effort, do not want to manage keys, defaults are fine"** → **SSE-S3**.
- Question mentions **"the key must be kept by the customer; AWS must not hold it"** → **SSE-C**.
- At high volume, **SSE-KMS can hit KMS API throttling**; the fix is to enable **S3 Bucket Keys** (greatly reduces calls to KMS and saves money too). When you see "KMS cost is high / being throttled", think Bucket Keys.
:::

**Enable SSE-KMS default encryption on a bucket via CLI:**

```bash
# Set the whole bucket default encryption to SSE-KMS and enable Bucket Keys to save cost
$ aws s3api put-bucket-encryption \
    --bucket my-company-reports \
    --server-side-encryption-configuration '{
      "Rules": [{
        "ApplyServerSideEncryptionByDefault": {
          "SSEAlgorithm": "aws:kms",
          "KMSMasterKeyID": "arn:aws:kms:ap-northeast-1:111122223333:key/abcd-1234"
        },
        "BucketKeyEnabled": true
      }]
    }'
# Expected result: no output means success. Afterwards, uploaded objects are automatically
# encrypted with this KMS key, and you can see "ServerSideEncryption": "aws:kms" on the
# object's Properties -> Encryption page or via head-object
```

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

**(Advanced) Use a bucket policy to make an external account "read-only" (cross-account sharing):**

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "AllowPartnerReadOnly",
    "Effect": "Allow",
    "Principal": { "AWS": "arn:aws:iam::444455556666:root" },
    "Action": ["s3:GetObject", "s3:ListBucket"],
    "Resource": [
      "arn:aws:s3:::my-company-reports",
      "arn:aws:s3:::my-company-reports/*"
    ]
  }]
}
```

*This means: only the partner account `444455556666` may **read and list** this bucket — no write or delete.*

**Apply this policy via CLI and verify:**

```bash
# Save the JSON above as policy.json and apply it to the bucket
$ aws s3api put-bucket-policy \
    --bucket my-company-reports \
    --policy file://policy.json

# Expected result: no output means success. Read it back to confirm:
$ aws s3api get-bucket-policy --bucket my-company-reports
# Returns the JSON you just applied, verbatim
```

:::info[🔑 Why this needs "both sides" configured]
The bucket policy is only the "bucket side" saying yes. A user in account `444455556666` also needs **their own IAM policy** to allow `s3:GetObject` to actually connect — cross-account access requires **both sides to nod**. Also, if the bucket has Block Public Access on, these **named** grants are completely unaffected (it only blocks anonymous public access).
:::

<Cost>

S3's security features — **Block Public Access, bucket policies, the versioning toggle, pre-signed URLs — are all free**. Note: once **versioning** is on, old versions still consume storage (counted toward storage cost); pair it with **lifecycle rules** to auto-clean old versions and save money.

</Cost>

:::warning[🚑 Common pitfalls]
- **Making a bucket public for "temporary convenience"** and forgetting to turn it off → the most common leak cause. To share a single file, use a **pre-signed URL**, not an open bucket.
- **Accidentally making objects public via ACL**: the old `public-read` ACL is easy to slip into. For new buckets, enable **Object Ownership = Bucket owner enforced** to disable ACLs and move everything to bucket policies — avoiding the problem at the root.
- **Turning off Block Public Access "to make something connect"**: that is pulling out the fuse. The correct way is to **keep Block Public Access on** and use **named grants** (a bucket policy specifying an account/role) or a **pre-signed URL** — none of which are affected by Block Public Access.
- **Not forcing TLS / not forcing encryption**: data may travel in plaintext over the network, or someone may upload unencrypted objects. Cover both with bucket policy `Condition`s: `Deny` when `aws:SecureTransport=false` (force HTTPS), and `Deny` when `s3:x-amz-server-side-encryption` does not match (force encrypted uploads).
- **Thinking "private means no encryption needed"**: access control and encryption are **two different things** — do both.
- **Slipping and writing `Principal: "*"` in a bucket policy**: that is open to the whole world. After writing, always check the S3 console bucket list for the red **"Public"** warning.
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
