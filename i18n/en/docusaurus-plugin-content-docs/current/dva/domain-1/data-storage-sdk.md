---
sidebar_position: 4
title: Accessing S3 and Data with the SDK
---

# Accessing S3 and Data with the AWS SDK: A Developer's First Tools

> SAA asks whether S3 fits and which storage class to pick; DVA asks **how you put objects in, pull them out, handle big files, and hand out temporary links with code**. This article takes the developer's view: using the AWS SDK to work with S3, and meeting ElastiCache as an application-layer cache.

<Vocab title="📌 Terms you will meet here (fine even if they are new)">

- **SDK (Software Development Kit)**: a library AWS ships for each language (Python, JavaScript, Java…) so you call AWS services from code instead of hand-crafting raw HTTP requests and signatures.
- **Credentials**: the keys that prove who you are and what you are allowed to do, usually an Access Key pair. The SDK uses them to call AWS.
- **Object**: one piece of data stored in S3 (an image, a video, a file) plus its metadata.
- **Client**: the handle you create in code to talk to a given AWS service; every call goes through it.

</Vocab>

:::note[💬 Reading tip]
Whenever you see a term with a <Term desc="Like this! Hover over the dotted term (tap on mobile) to see a plain-language explanation.">dotted underline</Term>, hover over it for a plain-language explanation. All terms are also collected in the [glossary](/glossary).
:::

## AWS SDK basics: credentials, Region, client

Before using the SDK you need three things straight: **how it knows who you are (credentials), which Region to talk to, and how to initialize a client**.

### Credential provider chain

You should **not** hardcode Access Keys in your code (they leak and are hard to rotate). The AWS SDK walks a fixed **credential provider chain** top to bottom and uses the first one it finds:

<div className="flow">
  <div className="flow-node">Explicitly passed in code</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Environment variables</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Shared config ~/.aws/credentials</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">IAM role (EC2/ECS/Lambda)</div>
</div>

*Diagram: the SDK searches left to right and stops at the first match. For code running on AWS the best practice is the far right — attach an IAM role and never touch keys.*

:::tip[💡 Exam focus]
**For code running on EC2, ECS, or Lambda the answer is almost always "attach an IAM role"**, letting the SDK obtain temporary credentials from the runtime and rotate them automatically. An option that hardcodes an Access Key into code or a config file is usually wrong.
:::

#### Why not hardcode keys? What the chain is really for

Pasting a set of **long-lived Access Keys** into your code looks easiest, but its problem is that it is "**permanent and gets copied everywhere**":

- **Pro (hardcoding)**: literally just "no setup, paste and run", and it only exists on your machine.
- **Cons (hardcoding)**: the key **never expires**, and once it rides along into Git, a Docker image, or a teammate's copy, it is like photocopying your house key and handing it out — with **no way to know who has it**. After a leak, rotating (changing the key) means manually hunting down every place it is used, and you usually miss one.

The point of the **credential provider chain** is to let your program obtain credentials **without ever knowing what the key looks like**: on your laptop it reads `~/.aws/credentials` (the key stays on your machine, out of the code); on AWS it asks the runtime for a **short-lived, auto-expiring, auto-rotating** temporary credential (from an IAM role). The exact same code switches credential source just by changing environment.

<Analogy title="🔑 Analogy: a forever key vs a daily-rotated access badge">

A hardcoded long-lived key is like cutting a **master key for a lock you never change** and handing copies around; lose one and you will not even notice, and re-keying is endless. The temporary credentials an IAM role hands out are like a corporate **access badge**: auto-reissued every day (or hour), auto-expiring, limited blast radius if lost, and you can even tell which badge opened the door.

</Analogy>

:::tip[💡 Best practice (credentials)]
- **Running on AWS** (EC2/ECS/Lambda) → always attach an **IAM role**; no key appears in your code at all.
- **Local development** → use `aws configure` to store keys in `~/.aws/credentials` (not pasted into code), or `aws sso login` for short-lived credentials.
- **If an external system truly needs a long-lived key** → grant least privilege, rotate regularly, and store it in **Secrets Manager** or **Parameter Store**, never in source.
- When a question offers "hardcoded long-lived IAM user Access Key" vs "attach an IAM role", **always pick the role**.
:::

### Region and client initialization

Every client needs to know which **Region** to reach. The Region can come from the `AWS_REGION` environment variable, a config file, or be set explicitly when you build the client. Initialize a client once and reuse it; do not create a new one on every call and waste connections.

```python
import boto3

# Build an S3 client: credentials come from the provider chain, Region set explicitly
s3 = boto3.client("s3", region_name="ap-northeast-1")

# Put an object
s3.put_object(Bucket="my-app-bucket", Key="reports/2026.csv", Body=b"hello")

# Get it back
obj = s3.get_object(Bucket="my-app-bucket", Key="reports/2026.csv")
data = obj["Body"].read()
```

## S3 developer essentials

You may already know S3 concepts; DVA tests the **details of driving it with code**.

### Object operations and the paginator

The basics are `put_object` / `get_object` / `delete_object`. But listing has a trap: **`list_objects_v2` returns at most 1000 objects per call**, so beyond that you need pagination. The SDK provides a **paginator** that turns the pages for you, so you never handle the `ContinuationToken` yourself.

```python
# Use a paginator to list every object in the bucket (no 1000-item limit)
paginator = s3.get_paginator("list_objects_v2")
for page in paginator.paginate(Bucket="my-app-bucket", Prefix="reports/"):
    for obj in page.get("Contents", []):
        print(obj["Key"], obj["Size"])
```

**Expected result**: even with 5,000 objects in the bucket, the code above prints **all of them** (the paginator turned 5 pages behind the scenes). If you instead reach for `s3.list_objects_v2(...)["Contents"]` directly, you get **only the first 1,000** and the rest silently vanish — exactly the classic trap called out in "common pitfalls" below.

### Multipart upload

When uploading **large files** (videos, backups), do not send them in one shot. **Multipart upload** splits the file into multiple parts, uploads them separately and **in parallel**, lets you re-send only a failed part, and merges them into a single object at the end.

#### Why big files need parts, and why not use it for every file

Sending one big file in a single shot is fragile over the network: if the connection drops at **99%**, the whole thing **starts over**; and a single connection has a speed ceiling, so a big file crawls through that one pipe. Multipart upload fixes both — **splitting into parts lets you open several pipes in parallel (faster)**, and **a drop only re-sends that one part (no restart)**.

But it is **not free**, so it should not be used for every file:

- **Pros**: parallel speedup, re-send only a failed part, pause and resume, and upload while still producing the data (streaming).
- **Cons / caveats**: the flow is more complex (initiate → many upload-part → complete, three steps); **parts that are neither completed nor aborted linger in the bucket and quietly bill storage**; for small files the coordination overhead actually makes it **not worth it**.
- **When you actually need it**: the file is large (AWS recommends it for **>100 MB**), the network is unreliable, or you want parallel speedup. For **small files just `put_object`** and skip the hassle.

:::tip[💡 The lazy-but-correct way: use upload_file]
Do not want to manage the three steps yourself? boto3's `s3.upload_file(...)` **decides automatically**: large enough files get split and uploaded in parallel, small ones go as a single PUT. For most cases this one line is all you need — no hand-rolled multipart.

```python
# Automatically switches to multipart when needed (threshold and parallelism tunable via TransferConfig)
s3.upload_file("big-video.mp4", "my-app-bucket", "videos/big-video.mp4")
# Expected result: a big file is split and uploaded in parallel; if a part fails midway the SDK re-sends just that part.
```
:::

<Analogy title="📦 Analogy: carrying a piano vs packing it into boxes">

Hauling the whole piano upstairs at once (**a single large upload**) means one slip ruins everything and you start over. Multipart upload is like packing it into separate boxes for keys, body, and legs: several movers carry them at once, a dropped box only needs that one box redone, and once all boxes arrive you assemble the piano.

</Analogy>

:::tip[💡 Exam focus]
- AWS recommends multipart upload for files **larger than 100 MB**; objects **larger than 5 GB** **must** use it (the single-PUT limit is 5 GB).
- Benefits: **parallel upload for speed, pause and resume, and re-sending only a failed part**.
- Add a **lifecycle rule** to clean up leftover parts from uploads that never completed, or they keep billing storage.
:::

### Presigned URLs

To let **someone without AWS credentials** (such as a regular user of your app) temporarily upload or download one specific object without making the bucket public, use a **presigned URL**. Your backend uses its own credentials to generate a **time-limited** URL; the holder can perform the specified operation on S3 until it expires, after which it stops working.

#### Why use it, vs routing every file through your server

The most obvious approach is: when a user wants to download, your server fetches the file from S3 and relays it to the user; uploads work the same way, hitting the server first and then being saved to S3. This is "**proxying through your server**". It works, but has three pain points: **all file traffic lands on your server (bandwidth blows up, scaling gets expensive)**, the user waits for **two hops** (S3 → you → user) so it is slower, and your server has to **buffer large files**.

The point of a presigned URL is to **let the user's browser talk to S3 directly while your server only hands out a time-limited ticket** — your server never touches the file content.

- **Pros**: saves your bandwidth and CPU, scales naturally (traffic goes to S3), gives temporary access without making the bucket public, and permission can be scoped precisely to "one key + one operation + a few minutes".
- **Cons / caveats**: once generated, the URL **cannot be revoked before it expires** (you can only wait it out, or change permissions / rotate the key); it carries the permissions of whoever signed it (do not sign with an over-privileged identity); the signed URL **is itself a credential**, so leaking it means granting access.
- **When not to use it**: when you need **fine-grained access control, the ability to revoke at any time, or an audit log of who downloaded what** → use **CloudFront signed URLs/cookies** or control it at the application layer; for file transfer between internal systems that both already hold IAM credentials, just call the SDK directly — **no presigned URL needed**.

```python
# Generate a download link valid for 1 hour, handed to a frontend user
url = s3.generate_presigned_url(
    ClientMethod="get_object",
    Params={"Bucket": "my-app-bucket", "Key": "reports/2026.csv"},
    ExpiresIn=3600,  # seconds; 1 hour here
)
print(url)
```

**Expected result**: it prints a URL like `https://my-app-bucket.s3.ap-northeast-1.amazonaws.com/reports/2026.csv?X-Amz-Algorithm=...&X-Amz-Expires=3600&X-Amz-Signature=...`. **Anyone** who opens it in a browser within the hour can download that object; open it after the hour and it returns `AccessDenied`. Note: if the credentials used to sign the URL **do not have** `s3:GetObject`, the URL looks fine but is rejected on use — **a presigned URL never exceeds the signer's permissions**.

<Scenario title="Real scenario: let users upload avatars directly, bypassing your server">

Your app lets users upload an avatar. If every photo goes to your backend first and the backend then saves it to S3, all the traffic and bandwidth land on your server. Better: the backend generates a `put_object` **presigned URL** (scoped to one key, valid 5 minutes) and returns it to the frontend; the browser **PUTs the photo straight to S3**. Your server never touches the file content, saving bandwidth and scaling better.

</Scenario>

### S3 event notifications triggering Lambda

S3 can automatically emit a notification when events like **object created or deleted** happen, triggering downstream processing — most commonly **triggering a Lambda** (it can also send to SQS or SNS). For example: a user uploads an image, S3 triggers a Lambda, and a thumbnail is generated automatically. This is a classic starting point for **event-driven** design, which the next article covers in depth.

:::info[🔑 An easy-to-confuse difference]
**S3 event notifications push to your code** (triggered the moment an object arrives); you do not write code to **poll** S3 asking "is there a new file yet?". If a question describes "do something automatically after an upload," the direction is S3 event notifications plus Lambda/SQS/SNS.
:::

## SDK retries and exponential backoff

Calls to AWS occasionally hit **transient errors** (network blips, a `503` throttling response). The **AWS SDK retries automatically**, and between retries it uses **exponential backoff** — wait a little after the first failure, longer after the second, with added random **jitter** so that clients do not all retry at once and overwhelm the service again.

This behavior is **configurable**: the number of retries and the retry mode (such as `standard` or `adaptive`) can be tuned.

```python
from botocore.config import Config

# Custom retries: up to 5 attempts, adaptive mode (adjusts pace based on throttling)
cfg = Config(retries={"max_attempts": 5, "mode": "adaptive"})
s3 = boto3.client("s3", config=cfg)
```

:::tip[💡 Exam focus]
When you see throttling errors such as **`ThrottlingException`, `503 SlowDown`, or `ProvisionedThroughputExceeded`**, the answer is to **retry with exponential backoff and jitter** (usually already built into the SDK), not to retry with no delay or to give up. DVA loves this developer detail.
:::

## ElastiCache: caching hot data at the application layer

S3 stores objects, but applications often **read the same hot data repeatedly** (leaderboards, product info). Hitting the database every time is slow and heavy. The fix is an in-memory cache in front of the application layer — <Term en="Amazon ElastiCache" desc="AWS managed in-memory cache service supporting the Redis and Memcached engines, dropping read latency to microseconds.">ElastiCache</Term>.

### Redis vs Memcached (in brief)

| Comparison | **Redis** | **Memcached** |
| --- | --- | --- |
| Data structures | Rich (lists, sets, sorted sets, hashes…) | Simple key-value |
| Persistence / replication / HA | ✅ Supported | ❌ Not supported |
| Multithreading | Mostly single-threaded | ✅ Multithreaded |
| Typical use | Leaderboards, sessions needing persistence, advanced structures | Simple, horizontally scalable object cache |

In one line: **need persistence, replication, or advanced structures → Redis; just want a simple, horizontally scalable cache → Memcached.**

### Caching strategies: Lazy Loading vs Write-Through

As a developer you decide **when data enters the cache and when it expires**. Two main strategies come up most:

- **Lazy Loading**: fetch from the database only when something is requested, then write the result into the cache. Upside: **only caches data that is actually read**, saving memory; downside: the first read always misses (cache miss) and is slow, and data can be stale.
- **Write-Through**: every time you **write** the database, **synchronously** update the cache too. Upside: the cache is always current; downside: even never-read data occupies the cache, and every write does extra work.

Both should be paired with a **TTL (Time To Live)**: give each cache entry an expiry so it is cleared automatically, forcing a fresh fetch next time and avoiding **stale data**.

#### The tradeoff: which one should you actually use?

The core tradeoff is "**memory vs freshness vs first-read latency**", and neither is universally better:

| Aspect | Lazy Loading | Write-Through |
| --- | --- | --- |
| What ends up cached | **Only data that was actually read** (saves memory) | Even never-read data (uses more memory) |
| First read | Always a miss, goes to the DB, **first read is slower** | Already populated on write, **reads almost always hit** |
| Freshness | Can be stale (rely on TTL to converge) | Updated on write, **fresher** |
| Write cost | Write skips the cache, **writes are light** | Every write also updates the cache, **writes are heavier** |
| Worst case | A hot item causes a big miss storm that hammers the DB | Many writes rarely read → cache fills with cold data |

**When to use which (plain version)**:

- **Reads far outnumber writes, you can tolerate slightly stale data, and want to save memory** → **Lazy Loading**. E.g. product pages, article content. This is the most common default.
- **You must read the latest right after a write, and that data is almost certainly going to be read** → **Write-Through**. E.g. a user's just-updated profile page, a shopping cart.
- **In practice they are often combined**: use lazy loading generally to save memory, add write-through for the critical data that "must read correctly right after a write", and put a **TTL** on everything as a fuse — even if the strategy has a gap, the data self-corrects once the TTL expires.

```python
# Classic lazy-loading pattern (Redis as cache, hit the DB only on a miss)
def get_product(redis, db, pid):
    cached = redis.get(f"product:{pid}")
    if cached is not None:
        return cached                      # hit: return directly (fast)
    row = db.query_product(pid)            # miss: fetch from the DB
    redis.set(f"product:{pid}", row, ex=300)  # write back to cache with a 300s TTL
    return row
# Expected result: the first lookup for a pid hits the DB (a bit slow), then for 300s it returns from Redis (fast), and after the TTL expires it misses once more.
```

<Analogy title="🍜 Analogy: Lazy Loading vs Write-Through">

- **Lazy Loading** = the kitchen only cooks a dish when a customer orders it, keeping one extra portion in the warmer. Dishes no one orders never take up space, but the first customer waits.
- **Write-Through** = every menu change (a database write) immediately updates the warmer. Customers always get the latest, but dishes no one orders are kept ready anyway.

</Analogy>

:::tip[💡 Exam focus]
- If a question says **the cache occasionally serves old data but you want to save memory by caching only hot items** → **Lazy Loading**.
- If a question says **cached data must always be current and readable right after a write** → **Write-Through**.
- Either way, **setting a TTL** is the general fix for stale data.
:::

<Cost>

ElastiCache bills **per node per hour** with no free tier, so it keeps charging while it runs. Delete the cluster when you finish practicing. Leftover incomplete multipart segments in S3 also keep billing storage, so a **lifecycle rule** to clean them up automatically is the safest bet.

</Cost>

:::warning[🚑 Common pitfalls]
- **Hardcoding long-lived keys in code or committing them to Git**: a leak hotspot, and that key **never expires**; on AWS always use an IAM role, locally use `~/.aws/credentials` or SSO.
- **Not handling pagination, getting only the first 1,000 items**: `list_objects_v2` returns at most **1,000** per call, and reaching for `["Contents"]` directly **silently drops** the rest; always use a **paginator**. This bug is hard to spot because nothing errors out — you just get less data.
- **Uploading a large file with a single PUT**: anything over **5 GB** fails outright; use multipart upload (or just `upload_file` and let it split automatically).
- **Leaving leftover multipart parts**: parts that were initiated but never completed or aborted **keep billing storage** and do not show up in `list_objects`; add a **lifecycle rule** to clean up incomplete multipart uploads.
- **Presigned URLs that last too long or are too permissive**: that is handing out a long-lived master key, and **it cannot be revoked before it expires**; use a **short expiry** scoped to **one key and one operation**, signed by a least-privilege identity.
- **Assuming a presigned URL bypasses permissions**: the URL **never exceeds the signer's permissions**; if the signing identity lacks `GetObject`, the URL returns `AccessDenied` on use.
- **Ignoring SDK retry settings and retrying with no delay when throttled**: it only congests the service more; use exponential backoff with jitter (usually built into the SDK; tune `max_attempts` and `adaptive` mode via `Config(retries=...)` when needed), do not hand-roll a `while True` hammer loop.
- **Not setting a TTL on the cache**: users keep seeing stale data; whatever caching strategy you pick, TTL is the fuse against stale data.
:::

<Refs title="📚 Official docs & further reading">

- [AWS SDKs: credential provider chain and configuration](https://docs.aws.amazon.com/sdkref/latest/guide/standardized-credentials.html)
- [Amazon S3: multipart upload overview](https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html)
- [Amazon S3: using presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html)
- [Amazon ElastiCache: caching strategies (Lazy Loading, Write-Through, TTL)](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/Strategies.html)

</Refs>

👉 Next: [Event-Driven and Decoupling](./event-driven.md)
