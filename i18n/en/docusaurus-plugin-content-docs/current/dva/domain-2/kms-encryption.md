---
sidebar_position: 3
title: KMS and Encryption for Developers
---

# KMS and Encryption: How Your Code Locks Data Up and Opens It Again

> This article takes a "developer's view" of <Term en="Key Management Service" desc="AWS service that centrally creates, stores, authorizes, and audits encryption keys; your code only calls an API to encrypt or decrypt and never touches the raw key.">KMS</Term>: the difference between encryption in transit and at rest, how to call `Encrypt`/`Decrypt` directly via the SDK (and why there is a 4KB limit), why large data needs `GenerateDataKey` and envelope encryption, how to choose between client-side and server-side encryption, symmetric vs asymmetric keys, AWS managed vs customer managed keys (CMK), and the key policy plus IAM dual-authorization traps. These are the developer details that DVA-C03 Domain 2 (Security) loves to test.

<Vocab title="📌 Terms you will meet here (no prior knowledge needed)">

- **Encryption**: turning readable data (plaintext) into scrambled nonsense (ciphertext) with a key, so only whoever holds the right key can turn it back.
- **Key**: the secret string used to encrypt and decrypt. Whoever has the key can decrypt, so the key itself must be guarded.
- **KMS key (formerly CMK)**: a master key you create or that AWS manages inside KMS. The point is it **never leaves KMS**: you can only ask KMS to encrypt or decrypt for you, you never get the raw key.
- **Symmetric vs asymmetric**: symmetric means the same key both locks and unlocks; asymmetric means a pair of keys, a public key locks and a private key opens.
- **Envelope encryption**: encrypt large data with a data key, then encrypt that data key with a KMS master key, like locking a key inside an envelope. This is the AWS standard for encrypting large data.
- **Data key**: the key that KMS generates for you to actually encrypt large data. KMS hands you both a plaintext version and a version encrypted by the master key.
- **In transit vs at rest**: in transit is while data moves across the network; at rest is while data sits on a disk or in a database.

</Vocab>

:::note[💬 Reading tip]
Whenever you see a term with a <Term desc="Like this! Hover over any dotted-underlined term (tap it on mobile) to see a plain-language explanation.">dotted underline</Term>, hover over it for a plain-language explanation. All terms are also collected in the [Glossary](/glossary).
:::

## Why do you need KMS? A cautionary tale of hiding a key in your code

Say you need to store users' ID numbers in a database, and your boss says "it must be encrypted." The obvious move: generate a key yourself, write it into your code or an environment variable, and use it to encrypt and decrypt.

That causes three big problems:

1. **One leaked key and everything is exposed**: if the key lives in the code and the source leaks (pushed to a public GitHub, screenshotted by a colleague), all your encrypted data is effectively unencrypted.
2. **Nobody governs it, nothing is auditable**: who decrypted with this key, and when? You cannot say. Is it time to rotate the key? Nobody is tracking it.
3. **Authorization cannot be fine-grained**: letting service A encrypt but only service B decrypt is simply impossible when you manage the key yourself.

<Term en="Key Management Service" desc="AWS service that centrally creates, stores, authorizes, and audits encryption keys.">KMS</Term> takes this off your hands: the key **stays locked inside KMS and can never be extracted**, and you can only call an API to ask KMS to encrypt or decrypt with a given key. Who can use which key for what is all governed by **key policy plus IAM**, and every encrypt or decrypt call lands in <Term en="CloudTrail" desc="AWS audit log service that records who called which API and when.">CloudTrail</Term> for auditing. For a developer, the job shifts from "how do I hide the key" to "how do I call the right API and set authorization correctly."

<Analogy title="🏢 Analogy: KMS is like a bank vault">

- **KMS key = the master key locked inside the vault**: you can never take it out of the bank (the key never leaves KMS).
- **Encrypt/decrypt = asking a teller to operate it for you**: you cannot grab the key yourself, you fill in a form (call an API) and the teller locks or unlocks something with a given key.
- **Key policy plus IAM = who may file which form**: authorizing who can "lock with this key" and who can "unlock with it."
- **CloudTrail = the vault security camera**: every time someone uses a key it is recorded, so you can check afterwards.

</Analogy>

## Part 1: Encryption in transit vs at rest (two different things)

This is the most confused pair of concepts, and DVA loves to test whether you can tell them apart:

| | In transit | At rest |
| --- | --- | --- |
| **Protects what** | Data **moving over the network** from eavesdropping or tampering | Data **sitting still** (disk, database, object) from being stolen |
| **Done with** | <Term en="Transport Layer Security" desc="Protocol that encrypts network connections; it sits underneath HTTPS and ensures data is not eavesdropped or tampered with in transit.">TLS</Term>/HTTPS (certificate-encrypted connection) | KMS key encrypting the data itself |
| **Developer does** | Use HTTPS endpoints, enforce TLS, validate certificates | Turn on the service encryption option and **specify a KMS key** |
| **Typical example** | Browser to API Gateway, SDK to S3, all over TLS | S3 objects, EBS volumes, RDS, DynamoDB encrypted on disk |

:::info[🔑 The easiest point to confuse]
"My S3 upload uses HTTPS, so the data is encrypted" is **only half right**. HTTPS protects only data **in transit**; once the file **lands on S3 disks** it needs S3 at-rest encryption (SSE, using a KMS key) to be encrypted. The two must be configured separately and you need both. Exams often use this distinction as a trap.
:::

## Part 2: Calling Encrypt / Decrypt directly via the SDK (but only up to 4KB)

The simplest approach is to hand the data straight to KMS to encrypt. KMS encrypts it with the key and returns ciphertext; when you need it, you send the ciphertext back and ask KMS to decrypt.

```python
# Python (boto3): encrypt a short sensitive string directly
import boto3
kms = boto3.client("kms")

# Encrypt: hand KMS the plaintext, get back ciphertext (CiphertextBlob)
resp = kms.encrypt(
    KeyId="alias/my-app-key",          # which KMS key to use
    Plaintext=b"my-db-password-123",   # the plaintext to encrypt (bytes)
)
ciphertext = resp["CiphertextBlob"]    # safe to store this in a database

# Decrypt: send the ciphertext back, get plaintext (no need to specify KeyId;
# the ciphertext already records which key was used)
plain = kms.decrypt(CiphertextBlob=ciphertext)["Plaintext"]
print(plain.decode())  # -> my-db-password-123
```

:::warning[🚑 Why the 4KB limit?]
The `Encrypt` API can encrypt **at most 4,096 bytes (4KB)** of plaintext per call. This is a hard limit, because the real key lives inside KMS so the data must travel into KMS to be encrypted, which is unsuitable for large files. Sending more than 4KB to `Encrypt` returns a **`ValidationException`**. To encrypt large files (photos, backups, big JSON) you **cannot** use this approach; use **envelope encryption** below.
:::

## Part 3: Large data uses GenerateDataKey and envelope encryption

Since KMS can only chew 4KB at a time, how do you encrypt a large file? The answer is **do not send the large file into KMS**; instead ask KMS for a **data key** and encrypt the large file **locally** with it. This is <Term en="Envelope Encryption" desc="Encrypt large data locally with a data key, then encrypt that data key with the KMS master key and store them together.">envelope encryption</Term>.

`GenerateDataKey` returns **two things** at once:

- **`Plaintext`**: the **plaintext version** of the data key. Use it in memory to encrypt the large file, then **discard it immediately and never write it to disk**.
- **`CiphertextBlob`**: the **same** data key **encrypted by the KMS master key**. This can be safely stored alongside the ciphertext.

<div className="flow">
  <div className="flow-node">Call GenerateDataKey</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Get plaintext data key + encrypted data key</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Encrypt the large file locally with the plaintext key</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Store ciphertext + encrypted key, discard plaintext key</div>
</div>

To decrypt, reverse it: send the **encrypted data key** back to KMS `Decrypt` to recover the **plaintext data key**, then use it to unlock the large file locally.

```python
import boto3, os
from cryptography.fernet import Fernet
import base64

kms = boto3.client("kms")

# 1) Ask KMS to generate a 256-bit data key
dk = kms.generate_data_key(KeyId="alias/my-app-key", KeySpec="AES_256")
plaintext_key = dk["Plaintext"]        # plaintext key: use locally then discard
encrypted_key = dk["CiphertextBlob"]   # encrypted key: store with the ciphertext

# 2) Encrypt the large file locally with the plaintext key
#    (Fernet shown for illustration; production can use AES-GCM)
f = Fernet(base64.urlsafe_b64encode(plaintext_key))
big_data = open("report.pdf", "rb").read()
ciphertext = f.encrypt(big_data)

# 3) Store ciphertext + encrypted_key, and clear the plaintext key from memory
del plaintext_key

# --- when decrypting ---
# 4) Send the encrypted key back to KMS to recover the plaintext key
plaintext_key = kms.decrypt(CiphertextBlob=encrypted_key)["Plaintext"]
f = Fernet(base64.urlsafe_b64encode(plaintext_key))
original = f.decrypt(ciphertext)       # recover the original large file
```

<Analogy title="🏢 Analogy: envelope encryption is like locking a key in a safe-deposit box">

- **Data key = your house key**: you lock the big luggage (large file) with it.
- **Encrypting the data key with the master key = locking the key in the bank safe-deposit box**: the key itself is locked by the bank master lock, so it is safe to store next to the luggage.
- **To open the luggage**: first go to the bank (KMS), use the master lock to open the box and get the key back, then open the luggage with the key. Throughout, the master lock never leaves the bank.

</Analogy>

:::tip[💡 Exam focus: when to use which]
- The thing to encrypt is **≤ 4KB** (password, token, config value) → use `Encrypt` / `Decrypt` directly.
- Encrypting **large data / files / whole objects** → use `GenerateDataKey` + **envelope encryption** (encrypt locally; the master key only encrypts the data key).
- Many AWS services (S3 SSE-KMS, EBS, RDS) **do envelope encryption for you under the hood**; you just specify the key. You only hand-write the above when doing it yourself on the client side.
:::

## Part 4: Client-side vs server-side encryption

Both encrypt data, but where the data gets encrypted decides how much code you write:

| | Server-side encryption (SSE) | Client-side encryption |
| --- | --- | --- |
| **Who encrypts** | The **AWS service encrypts after receiving** the data, then stores it | **Your code encrypts before sending** |
| **Does plaintext reach the cloud** | Yes (protected in transit by TLS); AWS sees plaintext for an instant | **Never**; AWS only receives ciphertext |
| **Developer effort** | Low: flip an option, specify a key (e.g. S3 `SSE-KMS`) | High: do envelope encryption yourself with the SDK or a crypto library (e.g. the **AWS Encryption SDK**) |
| **When to use** | Most situations: sufficient and easy | When regulations demand that "not even the cloud provider may see the plaintext" for top-secret data |

:::info[🔑 Do not mix up S3's three server-side encryption modes]
- **SSE-S3**: uses keys S3 manages itself, easiest, but you cannot govern or audit the key.
- **SSE-KMS**: uses a KMS key you specify, **auditable, finely authorizable, rotatable**: DVA tests this most.
- **SSE-C**: you supply the key yourself (attached on every request) and AWS does not store it.
From a developer's view, default to **SSE-KMS**.
:::

## 🧭 Why use KMS to manage keys? Symmetric vs asymmetric, AWS managed vs customer managed

> This is the core decision section. You may "know KMS exists," but when faced with "symmetric or asymmetric" or "AWS managed or customer managed" you often cannot decide. This section lays out the trade-offs in plain language.

### Why KMS instead of managing keys yourself?

- **The point**: the key **never leaves KMS** (inside FIPS 140-validated hardware), and you can only call an API to encrypt or decrypt, so even leaked code cannot expose the key.
- **Why it beats managing it yourself**: self-management means worrying about hiding, rotating, auditing, and finely authorizing; KMS handles all four (authorization via key policy plus IAM, auditing into CloudTrail, rotation with one click).
- **Integration with other services**: S3, EBS, RDS, DynamoDB, and Secrets Manager can all point directly at a KMS key for at-rest encryption, so you never write the encryption logic yourself.

### Symmetric vs asymmetric keys: how to choose?

| | Symmetric key | Asymmetric key |
| --- | --- | --- |
| **How it works** | One key encrypts and decrypts | A pair: public key encrypts/verifies, private key decrypts/signs |
| **Does the key leave KMS** | Key never leaves KMS | **Public key is downloadable** (private key still never leaves) |
| **Main use** | General encrypt/decrypt, `GenerateDataKey`, SSE | Let someone **outside KMS** encrypt with the public key so only you can decrypt; or **digital signatures** to verify identity |
| **Performance/cost** | Fast, cheap, **the default choice** | Slower; use only when you truly need the public/private split |

:::tip[💡 One-line decision]
**Default to symmetric keys** (99% of encrypt/decrypt cases). Use asymmetric only in two situations: (1) the encrypting party is outside AWS and cannot get KMS API authorization, so you give them a **public key** to encrypt with; (2) you need **digital signing / verification**.
:::

### AWS managed vs customer managed keys (CMK): how to choose?

| | AWS managed key | Customer managed key (CMK) |
| --- | --- | --- |
| **Who creates/manages** | AWS creates it (e.g. `aws/s3`), you cannot touch the policy | **You** create and manage it |
| **Key policy** | Cannot change | **Fully customizable** (down to which role can encrypt, which can decrypt) |
| **Rotation** | Automatic (yearly), not adjustable | Can enable automatic rotation or a custom period |
| **Delete/disable** | Cannot | Can disable, can schedule deletion |
| **Cost** | The key itself is free | **About \$1 per key per month** + API call fees |
| **When to use** | You just want "encrypted, and do not want to manage it" | You **need auditing, fine-grained authorization, cross-account sharing, or control over the lifecycle** |

:::tip[💡 Exam focus: see these phrases, pick CMK]
When a question mentions **"control key rotation," "custom key policy," "cross-account authorization," "disable/delete a key," or "audit who decrypted"** → always pick a **customer managed key (CMK)**. An AWS managed key can do none of these.
:::

### Pros and cons at a glance

- **Pros**: keys never leak, centralized authorization and auditing, one-click rotation, deep integration with AWS services, compliance (FIPS 140).
- **Cons**: every encrypt/decrypt means an API call (latency and **API quotas**, watch throttling under high traffic), CMKs carry a monthly fee, and keys are **Region-scoped** (cross-Region needs separate planning).
- **When not to use it / things to watch**:
  - Ultra-high-frequency, latency-sensitive encryption of tiny data → consider **envelope encryption + data key caching** (e.g. the AWS Encryption SDK's data key caching) instead of hitting KMS per request.
  - You just want to "store a password / API key" → do not hand-roll KMS encrypt/decrypt, use **Secrets Manager / Parameter Store** (they use KMS underneath and add rotation).
  - Replicating large data cross-Region → mind the Region scope of keys (see the traps below).

## Real-world application: not just for the exam

<Scenario title="Real scenario: client-side envelope-encrypt large uploads before storing in S3">

Your app lets users upload contract PDFs (often several MB), and regulations require that "not even our own operations staff should be able to read the plaintext directly." Approach: before upload, the backend calls `GenerateDataKey` to get a data key, uses it in memory to encrypt the PDF, then `PutObject`s the "ciphertext + encrypted data key" together to S3, discarding the plaintext key on the spot. To read the file, send the encrypted data key back to KMS `Decrypt` to recover the plaintext key, then decrypt locally. Even if someone looks straight at the S3 object, they only see garbage, and whether it can be decrypted is entirely governed by the KMS key policy.

</Scenario>

### 🛠️ Hands-on: run encrypt / decrypt and generate-data-key once via the CLI

```bash
# 0) Create a customer managed key (CMK) and get the KeyId
aws kms create-key --description "my-app-key"
# Expected result: JSON back with "KeyId": "1234abcd-..." and "Arn"

# Create a friendly alias pointing at it
aws kms create-alias \
  --alias-name alias/my-app-key \
  --target-key-id 1234abcd-...

# 1) Encrypt a short string directly (<= 4KB); feed plaintext to the CLI as base64
aws kms encrypt \
  --key-id alias/my-app-key \
  --plaintext "$(echo -n 'secret-password' | base64)" \
  --query CiphertextBlob --output text > cipher.txt
# Expected result: cipher.txt holds a base64 ciphertext (looks like garbage)

# 2) Decrypt it back
aws kms decrypt \
  --ciphertext-blob fileb://<(base64 -d cipher.txt) \
  --query Plaintext --output text | base64 -d
# Expected result: prints secret-password (plaintext recovered)
# Note: decrypt needs no key-id; the ciphertext already records which key was used

# 3) Generate a data key (for envelope encryption)
aws kms generate-data-key \
  --key-id alias/my-app-key \
  --key-spec AES_256
# Expected result: JSON back containing
#   "Plaintext": "...base64..."       <- use locally to encrypt, then discard
#   "CiphertextBlob": "...base64..."  <- encrypted key, store with the ciphertext
#   "KeyId": "arn:aws:kms:..."
```

<Cost title="💰 Cost note">

**KMS is cheap, but not free**: each **customer managed key costs about \$1 per month** (AWS managed keys are free), plus **API call fees** (a few cents per 10,000 calls). The real surprise bill comes from high-traffic scenarios that "hit KMS for every small item"; there, switch to **envelope encryption + data key caching** to cut the number of KMS calls. After practicing, remember to **schedule deletion** of test keys (KMS keys cannot be deleted immediately, the minimum waiting period is 7 days), so you are not charged every month.

</Cost>

:::warning[🚑 Common traps]
- **Calling `Encrypt` directly on more than 4KB**: always fails (`ValidationException`). Large data **must use `GenerateDataKey` with envelope encryption**, do not force it.
- **Keys are Region-scoped**: a key created in `us-east-1` only works in `us-east-1`. Do not assume it is global.
- **Using encrypted data cross-Region**: when copying an encrypted S3 object or EBS snapshot to another Region, the **destination Region needs its own key** to re-encrypt (S3 cross-Region replication and EBS snapshot cross-Region copy both require a destination-Region key). A source-Region key will not decrypt in another Region.
- **Key policy plus IAM dual authorization**: whether you can use a KMS key requires **both the key policy and the IAM policy** to allow it (two doors). A classic failure is "IAM granted `kms:Decrypt`, but the key policy does not list this role" → still denied. The reverse is equally true.
- **Separate "who can encrypt" from "who can decrypt"**: encrypt and decrypt are **different permissions** (`kms:Encrypt` vs `kms:Decrypt`). A common need is "many services can encrypt, only a few can decrypt"; authorize them separately, do not grant everything at once.
- **Using someone else's encrypted data without decrypt permission**: if your Lambda keeps failing to read an SSE-KMS encrypted S3 object, it is usually the **execution role missing `kms:Decrypt`**, not an S3 permission problem.
- **Forgetting to delete test keys**: a CMK keeps billing monthly; after practice remember to `schedule-key-deletion`.
:::

<Refs title="📚 Official docs & further reading">

- [AWS KMS Developer Guide](https://docs.aws.amazon.com/kms/latest/developerguide/overview.html)
- [Envelope encryption](https://docs.aws.amazon.com/kms/latest/developerguide/concepts.html#enveloping)
- [GenerateDataKey API reference](https://docs.aws.amazon.com/kms/latest/APIReference/API_GenerateDataKey.html)
- [Symmetric vs asymmetric KMS keys](https://docs.aws.amazon.com/kms/latest/developerguide/symmetric-asymmetric.html)
- [Key policies and access control](https://docs.aws.amazon.com/kms/latest/developerguide/key-policies.html)
- [S3 server-side encryption (SSE-KMS)](https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingKMSEncryption.html)

</Refs>

## Next steps

👉 Next: [Secrets Management: Secrets Manager vs Parameter Store](./secrets-parameter.md)
