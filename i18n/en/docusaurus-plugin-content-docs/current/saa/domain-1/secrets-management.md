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

<Cost>

- **Secrets Manager**: ~**US$0.40/month** per secret, plus ~US$0.05 per 10,000 API calls.
- **Parameter Store**: **standard parameters are free** (up to 10,000 per account per region); only advanced parameters are billed monthly.
- Practice tip: to save money use **Parameter Store SecureString**; to experience auto-rotation use Secrets Manager, and delete the secret when done.

</Cost>

:::warning[🚑 Common real-world mistakes]
- **Thinking environment variables are safe for secrets**: env vars easily leak via other processes, logs, or error messages — that's not real secrets management.
- **Storing a secret without restricting IAM permissions**: pair it with **least privilege** so only the needed roles can read a specific secret.
- **Choosing the wrong service**: using Secrets Manager just to store config values means paying $0.40/month per secret unnecessarily.
:::

<Refs title="📚 Official docs & further reading">

- [AWS Secrets Manager User Guide](https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html)
- [Systems Manager Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html)

</Refs>

## Next

- ⚡ Review: [Domain 1 Flashcards](./flashcards.md)
- ✍️ Quiz: [Domain 1 Practice Questions](./quiz.md)
- 📖 Next page: [Auditing & Monitoring: CloudTrail / Config / GuardDuty](./logging-monitoring.md)
