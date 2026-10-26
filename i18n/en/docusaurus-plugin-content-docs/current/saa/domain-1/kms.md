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

## Why use KMS to manage keys (instead of doing it yourself)?

<Scenario title="Real scenario: how painful it is to manage keys yourself">

Say you want to encrypt data yourself, so you generate a key. Problems appear immediately: where do you **store** this key? In the code → leaked the moment someone browses Git; in a config file → equally risky; in a database → and what protects that database's key? Then there's more: **who is allowed to use this key** (permissions), **how often to rotate it** (rotation), **who used it last and when** (auditing), **how to replace it everywhere if it leaks**... You have to figure all of this out yourself, and one mistake anywhere brings the whole thing down.

</Scenario>

The point of KMS is to hand all these "key lifecycle headaches" over to AWS's dedicated hardware and services. In plain terms:

| Managing keys yourself | Handing it to KMS |
| --- | --- |
| Wherever you store the key, you fear a leak; the master key **could be copied out** | The master key is **locked inside a Hardware Security Module (HSM) and can never be exported** — even you cannot get the plaintext |
| Permissions rely on code you write, easy to get wrong | Use **key policy + IAM** to uniformly control who can encrypt/decrypt |
| Rotation means scheduling and swapping it yourself, easy to forget | A CMK can **turn on automatic yearly rotation with one click**; old data still decrypts |
| Nobody knows "who used this key" | Every encrypt/decrypt is logged to **CloudTrail**, fully auditable |
| You have to wire up S3 / EBS / RDS integration yourself | AWS services **integrate natively** — tick a box and it uses KMS |

:::tip[💡 The key point in one line]
What KMS solves for you is not "the encryption algorithm" (those have been standard for ages), but **"how to safely store, authorize, rotate, and audit the key itself"** — which is the hardest, most error-prone part of encryption in practice.
:::

## The three types of KMS keys (frequently tested)

| Type | Who creates/manages | Characteristics | Cost |
| --- | --- | --- | --- |
| **AWS owned** | Fully managed by AWS | Invisible to you, nothing to manage, shared across accounts | Free |
| **AWS managed** | Managed by AWS, tied to a service | Named like `aws/s3`, `aws/ebs`; auto-rotated | Free (but API calls billed) |
| **Customer managed (CMK)** | **You create and control it** | Custom permissions, rotation, disable, audit | **$1/month each** + API calls |

:::tip[💡 Exam key point: when do you need a "customer managed key" (CMK)?]
When a question emphasizes that you need to **control key permissions yourself, set a custom rotation schedule, or audit who used the key**, the answer is a **Customer managed key**. If you just need "encryption, but don't care who manages the key", an AWS managed key is enough (and has no monthly fee).
:::

### AWS managed vs customer managed (CMK): how do you choose?

Both lock the master key inside AWS's HSM, and you can never get the plaintext of either; the difference is **"how much control you get" and "how much you pay"**:

| Comparison | AWS managed key (`aws/s3`, etc.) | Customer managed key (CMK) |
| --- | --- | --- |
| Created / owned by | AWS creates it, tied to a service | **You create and own it** |
| Key policy (who can use it) | Fixed, **you cannot change it** | **Customizable**, down to a specific role/account |
| Automatic rotation | Fixed **yearly**, cannot turn off or adjust | **Optional on/off**, can rotate yearly |
| Disable / schedule deletion | No (controlled by AWS) | **Can disable, can schedule deletion** |
| Cross-account sharing | No | **Yes** (grant other accounts via key policy) |
| Import your own key material | No | **Yes** (BYOK, import key material) |
| Monthly fee | **Free** | **US$1/month each** |

**Plain-language choice:**

- **Just want "encrypt the thing", no management** → use an AWS managed key. Cheap, zero maintenance; "just encrypt it" style exam wording usually points here.
- **Need control yourself** (custom who-can-use, audit a specific key, be able to disable at any time, cross-account sharing, bring your own key material, compliance requiring "key controlled by the customer") → **it has to be a CMK**.

:::info[🔑 An easily confused difference: both can be audited, but "degree of control" differs]
Usage of both AWS managed and customer managed keys **is logged to CloudTrail**, so "we need auditing" alone is not enough to conclude you need a CMK. The real keywords that force a **CMK** are: **custom key policy / cross-account / disable or delete the key / optional rotation / bring your own key material (BYOK)**. Just "being able to see who used it" is achievable with an AWS managed key too.
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

### Why is envelope encryption designed this way? (plain terms)

You might wonder: **why all the fuss? Why not just hand the data to KMS to encrypt?** There are three very practical limits:

1. **The KMS master key never leaves, but data is large**: the master key is locked inside the HSM and cannot come out, and the KMS `Encrypt` API can only process up to **4 KB** of data per call. You cannot throw a 5 GB video file into KMS.
2. **So it becomes "two-stage"**: ask KMS for a **one-time data key** (KMS returns both a "plaintext version" and a "version encrypted by the master key") → use the **plaintext data key** to encrypt that 5 GB locally and fast (local symmetric encryption, no 4 KB limit, no round-trips to KMS) → **immediately drop the plaintext data key from memory** afterward, keeping only the "encrypted data key" stored alongside the ciphertext.
3. **Decryption is the reverse**: send the "encrypted data key" back to KMS to unlock (this part is ≤ 4 KB, no problem) → get the plaintext data key back → decrypt that 5 GB locally.

<Analogy title="🔐 Analogy: why not haul the whole safe into the bank vault">

Rather than hauling an entire big safe (5 GB of data) into the bank vault for a teller to lock (throwing it into KMS), you: lock the safe at home with a **small key** (encrypt the data locally with the data key), then put **that small key** into the bank vault to be locked (KMS encrypts the data key with the master key). The big thing stays home, only the small key goes into the vault — fast, secure, and not bound by the vault's "one small package at a time" limit.

</Analogy>

:::tip[💡 Exam key point: what envelope encryption solves]
When a question says **"encrypt a large file / large amounts of data while still managing keys with KMS"**, or asks **"why not just encrypt the whole thing with KMS directly"** → the answer points to **Envelope Encryption**: use `GenerateDataKey` to get a data key, encrypt the large data locally, and KMS only protects that data key.
:::

## Symmetric vs asymmetric keys: when to use which?

KMS keys are **symmetric** by default, but you can also create **asymmetric** keys. Most people only ever use symmetric, but the exam tests whether you can tell them apart:

| | Symmetric key | Asymmetric key |
| --- | --- | --- |
| Plain meaning | **The same key** encrypts and decrypts | A key pair: **public key encrypts, private key decrypts** (or private key signs, public key verifies) |
| Does the key leave KMS | Never **leaves KMS** | **The public key can be exported** for people outside AWS to use |
| Typical uses | S3 / EBS / RDS encryption, envelope encryption (**the vast majority of cases**) | The other party is **outside AWS** and cannot reach your KMS, so you give them the public key to encrypt; or **digital signing/verification** |
| Speed / cost | Fast, cheap | Slower |

**Plain-language choice:**

- **Default to symmetric keys** — AWS service integration and envelope encryption all use them; fast and cheap.
- **Use asymmetric only in these two cases**: (1) the other party doing the encrypt/decrypt is **outside AWS** and simply cannot touch your KMS, so you can only hand them the **public key** to encrypt with; (2) you need a **digital signature** to prove "this came from me and was not tampered with".

:::info[🔑 Common misconception: do not pick asymmetric just because it sounds "more secure"]
Asymmetric is not a more advanced, more secure version. Symmetric keys are equally locked inside the HSM and equally secure. You pick asymmetric **only because "the other party cannot reach KMS" or "you need signing"** — compatibility/feature needs. Without those needs, do not use it; it is slower and more complex.
:::

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

### 🛠️ Hands-on: create a CMK and encrypt / decrypt a bit of text by hand

This exercise lets you **see KMS's most basic `Encrypt`/`Decrypt`** (remember: ≤ 4 KB), separate from envelope encryption.

```bash
# 1) Create a customer managed key (CMK) with a description
$ aws kms create-key --description "my-first-cmk"
# Expected result: returns a JSON blob with "KeyId": "1234abcd-...." and "Arn": "arn:aws:kms:..."
# You will use this KeyId shortly; "KeyState" is "Enabled" at this point

# 2) Give it a friendly alias (optional, easier to recognize than the KeyId)
$ aws kms create-alias \
    --alias-name alias/my-first-cmk \
    --target-key-id 1234abcd-....
# Expected result: no output means success (exit code 0)

# 3) Encrypt a short piece of text with this key
$ aws kms encrypt \
    --key-id alias/my-first-cmk \
    --plaintext "hello-kms" \
    --query CiphertextBlob --output text
# Expected result: prints a long base64 ciphertext, e.g. AQICAHh... (unreadable is normal — that is the ciphertext)

# 4) Decrypt the ciphertext back to plaintext (base64-decode the ciphertext into a file first)
$ echo 'AQICAHh...' | base64 --decode > ciphertext.bin
$ aws kms decrypt \
    --ciphertext-blob fileb://ciphertext.bin \
    --query Plaintext --output text | base64 --decode
# Expected result: prints hello-kms — meaning encrypt/decrypt succeeded
# Note: decrypt does not need --key-id; KMS identifies the right key from the ciphertext metadata
```

```bash
# Cleanup after practice: schedule key deletion (minimum 7-day waiting period, cancellable meanwhile)
$ aws kms schedule-key-deletion \
    --key-id alias/my-first-cmk \
    --pending-window-in-days 7
# Expected result: returns "KeyState": "PendingDeletion" and a "DeletionDate"
# Changed your mind: aws kms cancel-key-deletion --key-id ...
```

:::tip[💡 What to take away from this exercise]
- `encrypt` requires you to **specify the key**, but `decrypt` **does not** — the information about which key to use is already baked into the ciphertext (that is why the ciphertext is so long).
- Real-world encryption of large files would not call `encrypt` directly (the 4 KB limit), but go through **envelope encryption** (`generate-data-key`). This small exercise just lets you touch KMS's lowest-level encrypt/decrypt action.
:::

<Cost>

- **Customer managed key (CMK)**: **US$1/month** each (prorated), plus **API call fees** for each encrypt/decrypt (about US$0.03 per 10,000 calls).
- **AWS managed keys** (`aws/s3`, etc.): **no monthly fee**, only API call fees.
- For practice, start with an AWS managed key like `aws/s3` to avoid the fixed $1/month charge. If you do create a test CMK, remember to **schedule its deletion** when done (KMS key deletion has a 7–30 day waiting period).

</Cost>

:::warning[🚑 Common pitfalls]
- **Keys are Regional!** A KMS key only exists in the Region where it was created and **does not cross Regions automatically**. A key you create in `us-east-1` is invisible and unusable to a service in `ap-northeast-1`. To use one key across Regions, use a **Multi-Region Key**.
- **When copying encrypted data across Regions, do not forget the key must come along**: when you **copy** a CMK-encrypted EBS snapshot / S3 object from `us-east-1` to another Region, the destination Region needs a key that can decrypt it — otherwise the copy is **undecryptable** on arrival. For S3 Cross-Region Replication (CRR) or cross-Region EBS snapshot copies, specify a local KMS key in the destination Region (or use a Multi-Region Key).
- **Deleting/disabling a key = permanently unrecoverable data, and it is irreversible!** Everything encrypted with that key becomes undecryptable. That is why KMS **does not let you delete immediately** — you can only **schedule deletion**, with a **7-30 day waiting period** during which you can `cancel-key-deletion`; once actually deleted it **cannot be recovered**. (To temporarily disable while keeping a way back, use `disable-key` rather than deletion.)
- **Assuming "IAM permission is enough to use a key"**: a KMS key also has its own **Key Policy** — **both the IAM allow and the key policy allow must pass** (dual authorization). Many an `AccessDeniedException` is just the key policy not granting that role. If you wipe out the default key policy when creating a new CMK, you can lock even yourself out.
- **Losing your own SSE-C key**: AWS keeps nothing for you — lost is lost.
:::

:::tip[💡 One-liner to remember in-transit vs at-rest]
- See **HTTPS / TLS / SSL** → it's about **In Transit** encryption.
- See **S3 / EBS / RDS encryption, KMS** → it's about **At Rest** encryption.
:::

<Refs title="📚 Official docs & further reading">

- [AWS KMS Developer Guide](https://docs.aws.amazon.com/kms/latest/developerguide/overview.html)

</Refs>

## Next

- ⚡ Review: [Domain 1 Flashcards](./flashcards.md)
- ✍️ Quiz: [Domain 1 Practice Questions](./quiz.md)
- 📖 Next page: [Network Security: Security Group vs NACL](./security-group-nacl.md)
