---
sidebar_position: 5
title: Request Signing and Temporary Credentials
---

# Request Signing and Temporary Credentials: SigV4, Presigned URLs, STS

> This article takes a developer's view of how your code proves to AWS that "this request really came from me and was not tampered with on the way." It covers **SigV4 signing** (the SDK signs for you automatically, and when you must sign by hand), **presigned URLs** (letting people without AWS credentials access S3 temporarily), and **STS temporary credentials** (`AssumeRole` / `GetSessionToken`). These are favorites on DVA-C03 Domain 2 (Security, 26%), and in practice they are where long-term keys most often get leaked.

<Vocab title="📌 Terms you will meet here (no prior knowledge needed)">

- **Credentials**: the keys you use to prove your identity to AWS. Long-term credentials are an **Access Key ID + Secret Access Key** pair; temporary credentials add a **Session Token** and they expire.
- **Signature**: a cryptographic fingerprint computed from the whole request using your secret key. AWS recomputes it the same way; if it matches, the request is accepted.
- **SigV4 (Signature Version 4)**: the signing algorithm AWS uses today. Almost every request to an AWS API must carry a SigV4 signature.
- **Presigned URL**: a URL that is already signed with authorization baked in. Anyone who has it can upload to or download from S3 **within its expiry window**, with **no AWS credentials of their own**.
- **STS (Security Token Service)**: the AWS service that hands out **temporary credentials**. You trade for a set of short-lived, scoped-down keys.
- **AssumeRole**: asking STS to let you temporarily act as an IAM role, returning temporary credentials with a Session Token.

</Vocab>

:::note[💬 Reading tip]
Whenever you see a <Term desc="Like this! Hover over any dotted-underline term (tap on mobile) to see a plain-language explanation.">dotted-underline term</Term>, hover over it for a plain-language explanation. All terms are also collected in the [Glossary](/glossary).
:::

## Why is this needed? How AWS confirms a request is yours and untampered

When your code calls AWS, it is really just sending an **HTTP request** to an AWS API endpoint. The network is public, so any middleman could read or alter that request. How does AWS know:

1. **This request really came from "you, the holder of the key"** (authentication)?
2. **The request was not secretly modified between you sending it and AWS receiving it** (integrity)?

The naive approach is to put the Secret Access Key straight into the request and send it. But then the key is naked on the wire, and one interception compromises everything. So AWS uses <Term en="Signature Version 4" desc="The signing algorithm AWS uses today. It computes a fingerprint over the whole request with your secret key to verify identity and integrity, while the key itself is never sent.">SigV4 signing</Term> instead:

- You use the **Secret Access Key** to compute a **signature** over the key parts of the request (method, path, query, important headers, payload hash, timestamp).
- What gets sent is the **Access Key ID (public, like a username) plus that signature**, but the **secret key itself never leaves your machine**.
- AWS, which stores your secret key, recomputes the signature the exact same way. **Match** means it is you and the content was not changed; **mismatch** means rejected (the common error `SignatureDoesNotMatch`).

<Analogy title="🏢 Analogy: SigV4 is like a tamper-proof wax seal on a document">

- **Secret key = your personal signet stamp**: never lent out, never leaves you.
- **Signature = a wax seal pressed over the whole document**: the seal is shaped by the contents of the entire document.
- **Change any single character** and the seal no longer matches, so it is spotted immediately (this is tamper-proofing).
- **You send the document plus the seal, not the stamp itself**, so even if intercepted, no one can forge the seal for the next document.

</Analogy>

## SigV4 signing: the SDK signs automatically, when you must sign by hand

The good news: **in day-to-day development you almost never sign by hand.**

When you call AWS with an **AWS SDK (Boto3, the JavaScript v3 SDK, and so on) or the AWS CLI**, the SDK automatically, behind the scenes: reads your credentials, computes the SigV4 signature, and injects the `Authorization` header plus `X-Amz-Date` and `X-Amz-Security-Token` (only for temporary credentials) into the request. You just call the method; signing is a black box.

```python
import boto3

# You wrote zero signing code.
# boto3 reads credentials and signs this request with SigV4 before sending.
s3 = boto3.client("s3")
s3.put_object(Bucket="my-bucket", Key="hello.txt", Body=b"hi")
```

**So when do you need to sign by hand?** Only when you **bypass the SDK and send raw HTTP requests** to an AWS service yourself, for example:

- Using `requests` / `fetch` to call an endpoint that has **no matching SDK method** (such as the Amazon OpenSearch REST API).
- Calling an **API Gateway endpoint that uses IAM authorization** when you are not going through a generated SDK.
- Building a lightweight client yourself and not wanting the whole SDK.

In those cases, use the SDK-provided signing helpers (such as botocore `SigV4Auth` or the JS `@aws-sdk/signature-v4`) and **do not hand-roll the algorithm yourself** — the SigV4 canonicalization steps are very easy to get wrong.

:::info[🔑 A commonly confused point: signing vs encryption]
SigV4 signing **is not encryption**. It does not hide the request contents (confidentiality in transit comes from **HTTPS/TLS**). It does only two things: **prove the request is yours** and **guarantee it was not tampered with**. Do not conflate "signing" with "encryption."
:::

## Presigned URLs: letting people without credentials access S3 temporarily

A common need: you want **front-end users** or an **external partner** to upload or download an S3 object directly, but you obviously **cannot** hand them AWS keys.

A <Term en="Presigned URL" desc="A URL pre-signed by a credential holder, with authorization and an expiry baked in. Anyone who has it can access that S3 object within the window, with no AWS credentials of their own.">presigned URL</Term> exists for exactly this: **your backend (which holds credentials) pre-signs a URL** and hands it to the user. With that URL, the user can, **within the expiry window**, perform **that one specific action** (download or upload **that one object**) directly against S3, with **no AWS credentials at all**.

<div className="flow">
  <div className="flow-node">User asks your backend for an upload location</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Backend generates a presigned URL with its own credentials</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Returns the URL to the user</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">User's browser PUTs/GETs directly to S3</div>
</div>

The key point: **the permissions the URL carries equal those of "the identity that generated the URL"** at that moment, not those of whoever holds the URL. The user has no identity; they merely borrow the one authorization you signed. The URL also embeds an **expiry time** (`X-Amz-Expires`) and becomes void afterward.

<Analogy title="🏢 Analogy: a presigned URL is a time-limited, door-limited temporary pass">

- **You (the backend) = the building manager**: you hold the master key (AWS credentials).
- **Presigned URL = a temporary door card**: it opens only "the one door of warehouse 3" (a specific bucket/key), and **it self-expires in two hours**.
- **The visitor (user)** swipes the card to go in and pick up or drop off items, **never needing their own key**.
- But note: once the card is handed out, you **cannot recall it** — whoever finds it can use it until it expires. This is the most overlooked risk.

</Analogy>

## STS temporary credentials in code: AssumeRole / GetSessionToken

When your program needs **a set of short-lived, scoped-down keys** (instead of long-term ones), it trades for them with <Term en="Security Token Service" desc="The AWS service that issues temporary credentials. The response includes an Access Key, Secret Key, Session Token, and an expiry time.">STS</Term>. The temporary credentials STS returns have **four things**: Access Key ID, Secret Access Key, **Session Token**, and an **Expiration**. When you use them, the SDK automatically adds `X-Amz-Security-Token`.

The two most-tested APIs:

| API | What it does | Typical scenario |
| --- | --- | --- |
| **`AssumeRole`** | Temporarily "assume" another IAM role and get that role's temporary credentials. | Cross-account access; EC2/Lambda operating as a role; switching to another set of permissions for a task |
| **`GetSessionToken`** | Trade your **existing** long-term credentials for temporary ones (often with MFA). | When "a sensitive operation requires MFA," first get MFA-verified temporary credentials, then operate |
| **`AssumeRoleWithWebIdentity`** | Trade a token from an external identity provider (Google/Facebook/OIDC, or Cognito) for temporary credentials. | Mobile app / web end users who should never get AWS keys |

```python
import boto3

sts = boto3.client("sts")

# Assume a role to get credentials that will expire
resp = sts.assume_role(
    RoleArn="arn:aws:iam::111122223333:role/read-only-role",
    RoleSessionName="my-session",
    DurationSeconds=3600,  # expires in 1 hour
)
creds = resp["Credentials"]

# Build another client with these temporary credentials (incl. SessionToken)
s3 = boto3.client(
    "s3",
    aws_access_key_id=creds["AccessKeyId"],
    aws_secret_access_key=creds["SecretAccessKey"],
    aws_session_token=creds["SessionToken"],  # only temporary credentials have this
)
print(s3.list_buckets()["Buckets"])
```

:::tip[💡 Exam tip: you are often "already using" temporary credentials]
When your code runs on **EC2 (with an attached IAM role)** or **Lambda (its execution role)**, the SDK **automatically** obtains that role's **temporary credentials** behind the scenes and refreshes them on a schedule — you never write `AssumeRole` yourself. If a question says "code runs on EC2/Lambda and needs to access S3," the standard answer is **attach an IAM role**, not hard-code keys into code or environment variables.
:::

## Why use temporary credentials/presigned URLs instead of issuing long-term keys? Pros/cons/when not to

This is the core trade-off of this article. The point is understanding **why you pick these**, not just the names.

**Why it exists (what problem it solves)**
Once a long-term Access Key leaks (committed to Git, hard-coded in the front end, caught in a screenshot), an attacker can do anything with it **indefinitely**, and you often find out **long after the fact**. The shared philosophy of temporary credentials and presigned URLs is to **shrink "who can do it, what they can do, and for how long" to the minimum** — so even if it leaks, the damage has a ceiling (it expires, is scoped, targets a single object).

**Pros**

- **They expire automatically**: temporary credentials die in minutes to hours; a presigned URL is void at expiry. A leak is time-boxed.
- **Least privilege**: `AssumeRole` can grant only what is needed; a presigned URL authorizes only "one action on one object."
- **No need to spread long-term keys**: front ends, partners, and end users **never hold** your long-term keys.
- **Auditable**: who assumed which role and when is visible in CloudTrail.

**Cons / costs**

- **You must handle expiry**: after temporary credentials expire, the program must **refresh** (re-`AssumeRole`); long-running jobs that do not refresh will fail midway.
- **An extra call and more setup**: you must configure the role trust policy and `sts:AssumeRole` permission — more involved than one key.
- **Presigned URLs cannot be revoked**: once issued you cannot recall them; you can only wait for expiry (see the pitfalls box).

**When not to use it / limits**

- **Truly permanent, unattended environments that cannot attach a role**: a few on-premises systems may still need long-term keys — but prefer **IAM Roles Anywhere** or at least strict key rotation over simply issuing long-term keys.
- **Presigned URLs do not fit "must be able to revoke access at any time"**: because they cannot be revoked. If you need instant revocation, use **short-lived presigned URLs** or route users through your backend API proxy.
- **Do not fall back to long-term keys just to "save a call"**: the risk of long-term keys far outweighs the cost of one extra `AssumeRole`.

## Real-world use: not just for the exam

<Scenario title="Real scenario: the front end lets users upload avatars to S3, but you cannot give out keys">

Your site lets users upload avatars. Files can be large, and you do not want them to pass through your server (saving bandwidth and machines). The approach: the front end calls your backend API saying "I want to upload"; the backend uses **its own IAM role credentials** to generate a presigned URL that can only `PUT` to `avatars/userID.jpg` and **expires in 15 minutes**, and returns it to the front end. The front end then **PUTs the file straight to S3**, never touching your server and never holding any AWS key. After 15 minutes the URL is automatically void.

</Scenario>

### 🛠️ Hands-on: generate a presigned URL for download (Python / CLI)

```python
# generate_url.py
import boto3

s3 = boto3.client("s3")

url = s3.generate_presigned_url(
    ClientMethod="get_object",
    Params={"Bucket": "my-demo-bucket", "Key": "report.pdf"},
    ExpiresIn=300,  # expires in 5 minutes
)
print(url)
```

**Expected result**: the terminal prints a very long URL that looks like
`https://my-demo-bucket.s3.amazonaws.com/report.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...&X-Amz-Date=...&X-Amz-Expires=300&X-Amz-SignedHeaders=host&X-Amz-Signature=...`
Paste it into a browser (or `curl`) and **within 5 minutes** you download `report.pdf` directly; **after 5 minutes** you get S3 returning `AccessDenied` with a message containing `Request has expired`.

The CLI works too (default expiry is 1 hour):

```bash
# Generate a presigned download URL that expires in 3600 seconds
aws s3 presign s3://my-demo-bucket/report.pdf --expires-in 3600
```

**Expected result**: it likewise prints a long URL carrying `X-Amz-Signature` that you can `curl` to download.

### 🛠️ Hands-on: assume a role to get temporary credentials (CLI)

```bash
# Assume a role to get temporary credentials (incl. SessionToken and Expiration)
aws sts assume-role \
  --role-arn arn:aws:iam::111122223333:role/read-only-role \
  --role-session-name demo-session \
  --duration-seconds 900
```

**Expected result**: a JSON blob where `Credentials` contains `AccessKeyId`, `SecretAccessKey`, `SessionToken`, and `Expiration` (a timestamp 15 minutes out). Set those three keys as environment variables (`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_SESSION_TOKEN`) and subsequent CLI calls run with that role's permissions; calling after `Expiration` returns an `ExpiredToken` error.

```bash
# Use this anytime to confirm "who am I now" — temporary credentials show the assumed-role identity
aws sts get-caller-identity
```

**Expected result**: it prints `Account`, `Arn` (which will be `.../assumed-role/read-only-role/demo-session`), and `UserId`, confirming you switched into the role successfully.

<Cost title="💰 Cost note">

**SigV4 signing, STS, and generating presigned URLs are themselves free** — signing is computed on your machine, and `AssumeRole` / `generate_presigned_url` are not billed. What actually costs money is **what you then do with the credentials/URL**: for example, downloading a file via a presigned URL incurs **S3 request and data-egress** charges. So the cost concern is not "signing" but "do not let a leaked presigned URL get hammered for downloads" and run up a traffic bill. Clean up test buckets and objects when you are done.

</Cost>

:::warning[🚑 Common pitfalls]
- **A presigned URL's expiry and permissions equal the signer's**: what the URL can do depends on **the identity that generated it** at that moment, not on whoever holds the URL. An over-privileged signer effectively lends out excessive power.
- **Presigned URLs cannot be revoked**: once issued you cannot recall them; you can only wait for expiry. So **set the expiry short** (minutes), do not default to 7 days. If you need revocation, do not use them.
- **A presigned URL signed with temporary credentials inherits their lifetime**: if you sign with `AssumeRole` temporary credentials, the URL actually lives at most until **those temporary credentials expire**, even if you set a longer `ExpiresIn`.
- **Clock skew breaks signatures**: SigV4 folds the timestamp into the signature, so a machine clock too far from AWS (the default tolerance is about ±15 minutes) causes `SignatureDoesNotMatch` or `RequestTimeTooSkewed`. Fix: enable NTP time sync.
- **Leaking long-term keys**: an Access Key hard-coded in front-end JS, committed to Git, or pasted into a screenshot is the worst pitfall. The right answer is **attach an IAM role and use temporary credentials** or **issue a presigned URL**; the front end should never hold long-term keys.
- **Not refreshing expired temporary credentials**: a long-running program that calls `AssumeRole` once and keeps using it gets `ExpiredToken` on every call after `Expiration`. Fix: rely on SDK auto-refresh (when a role is attached) or re-`AssumeRole` before expiry yourself.
:::

<Refs title="📚 Official docs & further reading">

- [Signing AWS API requests (SigV4)](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_sigv.html)
- [Using presigned URLs (Amazon S3)](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html)
- [AWS STS temporary security credentials](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp.html)
- [STS AssumeRole API reference](https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html)
- [IAM security best practices (avoid long-term keys)](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)

</Refs>

## Next step

👉 Review: [Domain 2 Flashcards](./flashcards.md)
