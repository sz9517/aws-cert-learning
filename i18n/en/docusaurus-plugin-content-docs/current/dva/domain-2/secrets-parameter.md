---
sidebar_position: 4
title: Secrets Management (Secrets Manager vs Parameter Store)
---

# Secrets Management: Stop Hard-coding Passwords — Let Your Code Fetch Them Safely at Runtime

> This article takes the developer's point of view: why you must never hard-code database passwords or API keys (or just stuff them into environment variables); how your code fetches secrets safely at runtime with the SDK (`get-secret-value` / `get-parameter --with-decryption`); why you must cache secrets instead of fetching on every request; how Secrets Manager automatic rotation works; and the decision DVA-C03 Domain 2 loves to test — how to choose between Secrets Manager and Parameter Store.

<Vocab title="📌 Terms you will meet in this article (clear even if this is all new)">

- **Secret**: Any sensitive value that causes damage if leaked — database passwords, third-party API keys, OAuth tokens, TLS private keys. By contrast, non-sensitive values like a table name or a region are just configuration.
- **Hard-code**: Writing a value directly in the source (such as `password = "p@ss123"`). Anyone who sees the source or decompiles it gets the secret, and changing it means redeploying.
- **Secrets Manager**: The AWS service dedicated to storing secrets. Its headline feature is built-in automatic rotation (it periodically replaces the password and updates the database for you). Billed per secret per month plus per API call.
- **Parameter Store (SSM Parameter Store)**: A configuration and secret store under AWS Systems Manager. `String` / `StringList` hold ordinary config (free), and `SecureString` stores secrets encrypted with KMS (free in the standard tier).
- **SecureString**: The Parameter Store type that is encrypted with <Term en="Key Management Service" desc="The AWS service that creates and guards encryption keys and performs encrypt/decrypt on your behalf.">KMS</Term>. You must pass `--with-decryption` when retrieving it to get the plaintext back.
- **Rotation**: Periodically replacing a secret with a new value (for example, a new database password every 30 days) to reduce the risk of a stolen old password staying valid forever.
- **Cache**: Keeping a fetched secret in the execution environment's memory for a short time so the next use skips the API call.

</Vocab>

:::note[💬 Reading tip]
Whenever you see a term with a <Term desc="Like this! Hover over any dotted-underlined term (tap on mobile) to see a plain-language explanation.">dotted underline</Term>, hover over it for a plain-language explanation. Every term is also collected in the [Glossary](/glossary).
:::

## Why do you need it? Look at what goes wrong when you hard-code a password

Suppose your Lambda needs to connect to a database and, for convenience, you write this:

```js
// ❌ Never do this
const conn = connect({ user: 'admin', password: 'p@ssw0rd-2024' });
```

It looks like it works, but it buries four landmines:

1. **The secret lands in your source repository**: once the code is pushed to Git, the password lives in history forever, visible to anyone who can see the repo.
2. **Changing the password means redeploying**: change the database password and you must edit the code, rebuild, and redeploy the whole pipeline.
3. **Multiple environments are hard to manage**: dev, test, and prod each have their own password, so hard-coding forces you to maintain multiple copies or a pile of conditionals.
4. **No rotation is possible**: the security best practice is to rotate passwords regularly, and a hard-coded value simply cannot be swapped automatically.

So is moving it to an environment variable enough? It is slightly better (at least it is out of the source), but still not enough: **the value appears in plaintext in the Lambda configuration, CloudFormation templates, and deployment logs**, and it still will not rotate. The real fix: **keep secrets in a dedicated service (encrypted storage plus controlled read access) and have the code fetch them with the SDK only at runtime**.

<Analogy title="🏢 Analogy: a secret is a key in a bank safe, not a value on a sticky note">

- **Hard-coded in code = writing the safe combination on a sticky note on your monitor**: everyone walking by can read it.
- **Stuffed into an environment variable = putting the sticky note in a drawer**: a bit better, but the drawer (Lambda config and deployment logs) still gets opened.
- **Stored in Secrets Manager / Parameter Store = the key locked in a bank safe**: when you need it, you show ID (IAM permission) to collect it, use it briefly and return it (cache it for a short time), and the bank periodically changes the lock for you (rotation).

</Analogy>

## Core 1: how your code fetches a secret safely

The idea is simple: the secret is **not in your code**; the code asks the service for it at runtime using the SDK or CLI. The two services use different retrieval commands:

**Secrets Manager — `get-secret-value`**

```bash
# CLI: fetch a secret value (returns JSON; the SecretString field holds your secret)
aws secretsmanager get-secret-value --secret-id prod/db/credentials
```

```js
// SDK (Node.js v3): retrieve and parse the secret
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient();
const resp = await client.send(new GetSecretValueCommand({ SecretId: 'prod/db/credentials' }));
const secret = JSON.parse(resp.SecretString); // { username, password, host, ... }
```

**Parameter Store — `get-parameter --with-decryption`**

```bash
# CLI: fetch a SecureString parameter; you must add --with-decryption to get plaintext back
aws ssm get-parameter --name /prod/db/password --with-decryption
```

```js
// SDK (Node.js v3): WithDecryption: true is the same as the CLI --with-decryption
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

const ssm = new SSMClient();
const resp = await ssm.send(new GetParameterCommand({
  Name: '/prod/db/password',
  WithDecryption: true, // forget this and you only get ciphertext, not the plaintext
}));
const password = resp.Parameter.Value;
```

:::info[🔑 `--with-decryption` is the key for SecureString]
A Parameter Store `SecureString` is stored KMS-encrypted. If you retrieve it **without** `--with-decryption` (the SDK's `WithDecryption: true`), you get back **ciphertext**, not the plaintext password you wanted. Correspondingly, the caller's IAM role needs `kms:Decrypt` on that KMS key in addition to `ssm:GetParameter`, or you get `AccessDeniedException`. `String` / `StringList` are not encrypted, so the flag makes no difference for them.
:::

## Core 2: why you must cache secrets instead of fetching on every request

The most common beginner mistake is calling `get-secret-value` **inside** the handler, so every single request makes an API call. That steps on three landmines at once:

- **Latency**: every request adds a network round trip (typically tens of milliseconds), noticeably slowing a user-facing API.
- **Cost**: Secrets Manager is **billed per API call** (about US$0.05 per 10,000). A high-traffic API making millions of calls a day adds up fast; Parameter Store's standard tier has no per-call charge but does have throughput limits.
- **Throttling**: both services have API rate limits, so hammering them returns `ThrottlingException`, which actually fails your requests.

The right approach: **fetch once when the execution environment starts (outside the handler), cache it in memory, and set a time-to-live (TTL, say a few minutes) after which you refetch**. That way the many requests served by the same warm environment share one cached copy, dropping API calls from once-per-request to once-per-few-minutes.

```js
// ✅ Fetch the secret outside the handler (Init phase), with a simple TTL cache
let cached = null;
let cachedAt = 0;
const TTL_MS = 5 * 60 * 1000; // 5 minutes

async function getDbSecret() {
  const now = Date.now();
  if (cached && now - cachedAt < TTL_MS) return cached; // cache hit, use it directly
  const resp = await client.send(new GetSecretValueCommand({ SecretId: 'prod/db/credentials' }));
  cached = JSON.parse(resp.SecretString);
  cachedAt = now;
  return cached;
}

export const handler = async (event) => {
  const { username, password } = await getDbSecret(); // most requests hit the cache
  // ...use these credentials to connect to the database
};
```

:::tip[💡 Exam point: do not reinvent the wheel, use the official caching tool]
Lambda can use the **AWS Parameters and Secrets Lambda Extension** (a Layer) directly. It runs a small local caching service, and your code calls `localhost` to get the already-cached secret or parameter, so you do not even write caching logic in the SDK. Secrets Manager also offers an official **caching client** (Java / Python / .NET / Go). When the exam asks how to reduce the latency and the number of calls when a Lambda retrieves secrets, the answer is usually caching (the Extension or the caching client), not raising the API limit.
:::

## Core 3: automatic rotation (the signature feature of Secrets Manager)

<Term en="Rotation" desc="Automatically replacing a secret with a new value on a schedule and syncing it to the service that uses it (such as a database), reducing the risk of an old secret staying valid for a long time.">Rotation</Term> is Secrets Manager's biggest selling point. Once configured, it runs the whole password-change process **automatically** on your schedule (for example every 30 days), with no manual steps:

<div className="flow">
  <div className="flow-node">createSecret generates a new password</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">setSecret writes it into the database</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">testSecret tests the connection with the new one</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">finishSecret marks the new one as current</div>
</div>

- Behind the scenes a **rotation Lambda** runs those four steps for you (for common databases such as RDS, Redshift, and DocumentDB, AWS provides ready-made blueprints with almost no code).
- During rotation the old and new passwords **coexist briefly** (distinguished by the version labels `AWSCURRENT` / `AWSPENDING`), so a connection in progress does not break instantly.
- **As long as your code caches with a TTL as in Core 2**, after the password rotates the cache expires, refetches, and automatically gets the new password — no code change, no redeploy. That is the biggest payoff of not hard-coding.

:::info[🔑 Parameter Store has no built-in rotation]
Parameter Store does **not** rotate secrets automatically. You can of course write your own Lambda plus an EventBridge schedule to swap them, but then you maintain that whole flow yourself. When the requirement literally says automatic rotation, it almost always points to **Secrets Manager**.
:::

## How to choose between Secrets Manager and Parameter Store

This is a high-frequency DVA-C03 Domain 2 topic. Read the comparison first, then memorize the rule of thumb.

| Dimension | Secrets Manager | Parameter Store (SSM) |
| --- | --- | --- |
| **Primary purpose** | Dedicated to secrets, full-featured | Config plus secrets, lightweight and general |
| **Automatic rotation** | ✅ Built in, blueprints for RDS and more | ❌ None built in (do it yourself) |
| **Encryption** | Always KMS-encrypted | Only `SecureString` uses KMS; `String` / `StringList` are not encrypted |
| **Cost** | **Billed per secret per month** + per 10,000 calls | Standard tier is **free** (only advanced parameters are charged) |
| **Cross-account / resource policy** | ✅ Supports attached resource policies and cross-account sharing | More basic in the standard tier |
| **Size limit** | Up to 64 KB per secret | 4 KB standard tier, 8 KB advanced tier |
| **Integration with RDS and more** | ✅ Can manage RDS credentials directly at creation | Wire it up yourself |

**Pros and cons:**

- **Secrets Manager pros**: built-in rotation, deep integration with RDS and databases, resource policies for cross-account use, the most complete feature set. **Cons**: it **costs money** (a fixed monthly fee per secret, noticeable when you have many secrets).
- **Parameter Store pros**: the standard tier is **free**, config and secrets live in one place, it integrates well with SSM and IaC, and it has a low learning curve. **Cons**: **no automatic rotation**, and weaker cross-account and advanced features.

:::tip[💡 Exam point: one-line selection rule]
- Need **automatic rotation**, deep integration with **RDS or database credentials**, or **cross-account sharing** of secrets → **Secrets Manager**.
- Just storing **ordinary config values** (table names, feature flags, endpoints), or you **want to save money** and do not need rotation → **Parameter Store** (`String` for config, `SecureString` for the few secrets).
- A common mix: **non-sensitive config in Parameter Store (free), and database passwords that need rotation in Secrets Manager**.
:::

## Hands-on: create a secret → retrieve and cache it with the SDK

<Scenario title="Real scenario: a Lambda connects to RDS, the password must be rotatable, and you do not want to fetch it on every request">

Your order API runs on Lambda and connects to RDS. The requirements are: rotate the password automatically every 30 days, never hard-code it, and under high traffic do not call the secrets service on every request. The approach: store the credentials in Secrets Manager, enable automatic rotation, and in the code fetch once outside the handler and cache with a 5-minute TTL. After rotation swaps in a new password, the cache expires and automatically picks up the new one, with no code change.

</Scenario>

### 🛠️ Follow along once

```bash
# 1) Create the secret (store the DB credentials as JSON, encrypted with KMS)
aws secretsmanager create-secret \
  --name prod/db/credentials \
  --secret-string '{"username":"admin","password":"InitPass-123","host":"orders.xxxx.rds.amazonaws.com"}'

# 2) (Optional) Enable automatic rotation: every 30 days, run by the specified rotation Lambda
aws secretsmanager rotate-secret \
  --secret-id prod/db/credentials \
  --rotation-lambda-arn arn:aws:lambda:ap-northeast-1:111122223333:function:SecretsRotation \
  --rotation-rules AutomaticallyAfterDays=30

# 3) Verify you can retrieve it (for dev testing; in prod the code's IAM role fetches it)
aws secretsmanager get-secret-value --secret-id prod/db/credentials \
  --query SecretString --output text
```

In the code, use the TTL-cached `getDbSecret()` from **Core 2**, and grant the Lambda execution role least privilege (allow reading only this one secret):

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": "secretsmanager:GetSecretValue",
    "Resource": "arn:aws:secretsmanager:ap-northeast-1:111122223333:secret:prod/db/credentials-*"
  }]
}
```

**Expected result:**

- Step 1 returns JSON with `ARN`, `Name`, and `VersionId`, meaning the secret was created.
- Step 2 returns the secret `ARN` and `VersionId`; from then on Secrets Manager runs a rotation cycle every 30 days, updating both the RDS password and the secret value in sync.
- Step 3 prints the JSON you just stored (`{"username":"admin",...}`). If the KMS `Decrypt` permission is missing or the secret name is wrong, you see `AccessDeniedException` or `ResourceNotFoundException`.
- After deploying, hit the API: the **first request** triggers one `GetSecretValue` (filling the cache), and the many requests in the next 5 minutes **hit the cache and make no more API calls**. In CloudWatch the `GetSecretValue` call count drops from once-per-request to once-per-5-minutes.

<Cost>

**Secrets Manager keeps billing**: about **US$0.40 per secret per month**, plus about **US$0.05 per 10,000 API calls**. With many secrets, or high-frequency calls with no caching, the bill is very noticeable. **Parameter Store's standard tier is completely free** (including `SecureString`, you only pay a tiny KMS decryption fee), which suits storing lots of ordinary config. A money-saving strategy: **keep config that does not need rotation in Parameter Store, and put only the secrets that truly need automatic rotation in Secrets Manager**, and always cache to reduce call counts. When you finish practicing, `delete-secret` the test secret (it has a 7-to-30-day recovery window by default).

</Cost>

:::warning[🚑 Common pitfalls]
- **Fetching the secret on every request**: putting `get-secret-value` in the handler body makes it slow and expensive under high traffic and triggers `ThrottlingException`. The fix: fetch once outside the handler plus a TTL cache (or use the Parameters and Secrets Lambda Extension).
- **Storing a secret as plaintext `String` instead of `SecureString`**: Parameter Store's `String` is not encrypted, leaving the password in the open. Always use `SecureString` for secrets.
- **Needing automatic rotation but choosing Parameter Store**: it has no built-in rotation. If the requirement mentions rotating passwords automatically, use Secrets Manager rather than forcing Parameter Store to reinvent the wheel.
- **Reading secrets without least privilege**: granting the execution role `secretsmanager:*` or `Resource: "*"` lets it read every secret. Grant `GetSecretValue` for only this one secret (SecureString also needs `kms:Decrypt` on the matching KMS key).
- **Forgetting `--with-decryption`**: retrieving a Parameter Store `SecureString` without this flag (the SDK's `WithDecryption: true`) returns ciphertext instead of plaintext, and the code is sure to fail when it tries to connect.
:::

<Refs title="📚 Official docs & further reading">

- [AWS Secrets Manager User Guide](https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html)
- [Rotate secrets in Secrets Manager](https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotating-secrets.html)
- [Working with parameters in SSM Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html)
- [AWS Parameters and Secrets Lambda Extension (caching)](https://docs.aws.amazon.com/secretsmanager/latest/userguide/retrieving-secrets_lambda.html)
- [Choosing and integrating Secrets Manager with Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/integration-ps-secretsmanager.html)

</Refs>

## Next step

👉 Next: [Request Signing and Temporary Credentials](./request-signing.md)
