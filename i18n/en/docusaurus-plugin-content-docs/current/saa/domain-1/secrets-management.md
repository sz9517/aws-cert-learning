---
sidebar_position: 5
title: "Secrets Management: Secrets Manager vs Parameter Store"
---

# Secrets Management: stop putting passwords in your code

> Where do database passwords and API keys belong? This page covers AWS's two standard answers and their differences (the exam compares them).

<Vocab title="📌 Jargon you'll see on this page">

- **Secret**: a sensitive string that must not leak — e.g. a database password, API key, or certificate.
- **Secrets Manager**: the AWS service dedicated to storing secrets, with **automatic periodic password rotation**.
- **Parameter Store**: a configuration value store under Systems Manager that can also hold secrets; **basic features are free**.
- **Rotation**: automatically replacing a password with a new one on a schedule, reducing leak risk.

</Vocab>

## Why do you need it?

<Scenario title="Real scenario: a DB password in the code, pushed to GitHub">

An engineer writes the database password directly in the code, then accidentally pushes it to a **public GitHub repo** — and within minutes the database is compromised. Secrets **should never be in code, config files, or environment variables**; put them in a dedicated secrets service and have the program "fetch" them at runtime.

</Scenario>

<Analogy title="🔑 Analogy: don't tape the key to the door">

Writing a password in code is like **taping the key to the door** — anyone passing by can grab it. The right way is to put the key in a **safe (Secrets Manager / Parameter Store)**, retrieve it by identity (IAM) when needed, and even change the lock periodically (rotation).

</Analogy>

### Plain talk: why never hard-code passwords/keys in code or environment variables?

"Hard-coding" means typing a password straight into source (`password = "p@ssw0rd"`) or stuffing it into an environment variable as config. It looks like the easiest path, but it has fatal problems:

- **Code gets distributed and preserved**: source goes into version control (Git), gets copied, and bakes into images. Once a password is in there, it is effectively handed to everyone who ever gets the code — and **Git history keeps it forever**. Deleting it later does not help; old commits still have it.
- **Environment variables leak more easily than you think**: env vars show up in **stack traces, logs, crash reports, `printenv`, and process listings**; mounted containers, CI/CD tools, and monitoring agents can all see them. They are handy for injecting config, but they are **not a secret vault**.
- **Changing a password becomes a big project**: once hard-coded, rotating it means editing code, redeploying, and restarting services. Because that is painful, most teams simply **never rotate** — which is exactly why a leak spreads so far.
- **No least privilege, no audit**: a hard-coded password is shared by everyone, you cannot see who uses it, and you cannot revoke or rotate a single secret. Put it in a secrets service and you finally get IAM permissions plus CloudTrail audit of "who read which secret, and when".

**In one line**: a password is not "config", it is a "secret". Config can be hard-coded; secrets go in a dedicated vault and are fetched by identity at runtime.

## How to choose between the two? (a must-know comparison)

| Comparison | Secrets Manager | Parameter Store |
| --- | --- | --- |
| Main use | Dedicated to **secrets** (passwords, keys) | **Config values**, can also hold secrets |
| **Auto rotation** | ✅ **Built-in**, can auto-rotate RDS passwords | ❌ Not built-in (write your own Lambda) |
| Encryption | KMS-encrypted by default | Optional (SecureString type uses KMS) |
| Cost | **~$0.40/month per secret** + API fees | **Standard parameters free** (advanced ones billed) |
| Best for | Secrets needing **auto-rotation** and cross-service integration | Budget-limited configs and secrets without rotation |

:::tip[💡 Exam key point: it comes down to "do you need auto-rotation?"]
- Question emphasizes **auto-rotating passwords (especially RDS DB passwords)** → choose **Secrets Manager**.
- Question emphasizes **saving cost, just securely storing config values** → choose **Parameter Store (SecureString)**.
:::

### Secrets Manager: why use it? Pros/cons? When NOT to use it?

**Why it exists**: it is AWS's dedicated secret vault. Compared with Parameter Store, it does one crucial extra thing — **built-in automatic rotation** — and integrates deeply with RDS/Redshift/DocumentDB, so you can one-click "auto-change the DB password every 30 days and update the secret in sync", with no downtime and no code changes.

- **Pros**: built-in auto-rotation (including managed RDS-style integration); KMS-encrypted by default; supports cross-region replication and cross-account sharing of secrets; native versioning (old and new passwords transition smoothly during rotation, avoiding a connection drop at the switchover moment).
- **Cons**: **it costs money** — roughly US$0.40 per secret per month, plus API call fees. With many secrets or frequent calls, the bill becomes noticeable.
- **When NOT to use it**: when you just need to store not-very-sensitive config values (feature flags, table names, endpoints), or you **do not need rotation at all** and want to save money — using it then is just wasted spend.

### Parameter Store: why use it? Pros/cons? When NOT to use it?

**Why it exists**: it is a configuration value store under Systems Manager where **standard parameters are free**, and the **SecureString** type lets you store secrets KMS-encrypted too. It is very cost-effective for "high volume, cost-sensitive, read-only, no rotation needed" cases.

- **Pros**: standard parameters are free (up to 10,000 per account per region); supports SecureString (KMS encryption); parameter hierarchies (path-style names like `/app/prod/db-url` are easy to manage); integrates well with most AWS services.
- **Cons**: **no built-in rotation** — to auto-change a password you must write your own Lambda + EventBridge schedule, essentially rebuilding what Secrets Manager already does; it lacks the out-of-the-box RDS-style integration SM offers.
- **When NOT to use it**: when the question/requirement explicitly needs **auto-rotation** (especially RDS passwords), do not force Parameter Store and hand-roll rotation — just use Secrets Manager; it is simpler and more reliable.

## How it works (diagram)

<div className="flow">
  <div className="flow-node">App needs the DB password</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">requests it from Secrets Manager via IAM identity</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">gets the currently valid password</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">connects to the DB (password never hard-coded)</div>
</div>

## Real-world application

### 🛠️ Hands-on: store a database password in Secrets Manager

1. Console → search `Secrets Manager` → **Store a new secret**
2. Secret type → **Other type of secret** (or RDS type)
3. Enter key-value pairs, e.g. `username = admin`, `password = ****`
4. Name it `prod/db/credentials` → Next (optionally configure auto-rotation) → Store

Retrieve it via CLI/SDK (no hard-coded password needed):

```bash
# Retrieve the secret value
$ aws secretsmanager get-secret-value \
    --secret-id prod/db/credentials \
    --query SecretString --output text
```

**Expected result**: it prints the JSON string (the key-value pairs you just stored), and the program parses out `password`:

```json
{"username":"admin","password":"s3cr3t!"}
```

How the program actually reads it (Python boto3) — the password lives only in memory and never lands in code:

```python
import boto3, json

sm = boto3.client("secretsmanager")
resp = sm.get_secret_value(SecretId="prod/db/credentials")
creds = json.loads(resp["SecretString"])
# use creds["password"] to connect to the DB, never hard-coded
```

### 🛠️ Hands-on (budget version): store a secret with Parameter Store SecureString

When you do not need auto-rotation and want to save money, use Parameter Store. The key is to **always pick the `SecureString` type** (so it is KMS-encrypted) — do not store it as plaintext `String`:

```bash
# Store an encrypted secret parameter (SecureString = KMS-encrypted)
$ aws ssm put-parameter \
    --name "/prod/db/password" \
    --type SecureString \
    --value "s3cr3t!"

# You must add --with-decryption to get the plaintext back
$ aws ssm get-parameter \
    --name "/prod/db/password" \
    --with-decryption \
    --query Parameter.Value --output text
```

**Expected result**: with `--with-decryption` it prints the decrypted `s3cr3t!`; **if you forget `--with-decryption`, you get an encrypted blob** (not the plaintext) — this is the most common source of "I read some weird string" confusion.

<Cost>

- **Secrets Manager**: ~**US$0.40/month** per secret, plus ~US$0.05 per 10,000 API calls.
- **Parameter Store**: **standard parameters are free** (up to 10,000 per account per region); only advanced parameters are billed monthly.
- Practice tip: to save money use **Parameter Store SecureString**; to experience auto-rotation use Secrets Manager, and delete the secret when done.

</Cost>

:::warning[🚑 Common pitfalls]
- **Using Parameter Store when you need auto-rotation**: Parameter Store has **no built-in rotation**. If the requirement/question wants "auto-change the password every N days, especially RDS passwords", forcing it means hand-rolling a Lambda + EventBridge setup — tedious and error-prone. In that case, just use **Secrets Manager**.
- **Storing secrets as plaintext `String` instead of `SecureString`**: Parameter Store's `String` type is **not encrypted**, so the password sits in plaintext (visible in the console and via `get-parameter`). Always use **`SecureString`** for secrets, and add `--with-decryption` when reading.
- **Not setting least-privilege read access**: storing a secret but granting IAM that is too broad (e.g. `secretsmanager:GetSecretValue` on `Resource: "*"`, or `ssm:GetParameter` across all parameters). Use **least privilege** to **scope reads to a specific secret / specific parameter path** so only the needed roles can read it, and use CloudTrail to audit who read what.
- **Thinking environment variables are safe for secrets**: env vars easily leak via other processes, logs, error messages, or crash reports — that is not real secrets management.
- **Choosing the wrong service and overpaying**: using Secrets Manager just to store config values means paying US$0.40/month per secret unnecessarily. Conversely, when you genuinely need rotation but force Parameter Store to save money, you save pennies for a big risk.
:::

<Refs title="📚 Official docs & further reading">

- [AWS Secrets Manager User Guide](https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html)
- [Systems Manager Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html)

</Refs>

## Next

- ⚡ Review: [Domain 1 Flashcards](./flashcards.md)
- ✍️ Quiz: [Domain 1 Practice Questions](./quiz.md)
- 📖 Next page: [Auditing & Monitoring: CloudTrail / Config / GuardDuty](./logging-monitoring.md)
