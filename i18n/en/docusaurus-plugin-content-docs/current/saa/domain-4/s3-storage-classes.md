---
sidebar_position: 2
title: "S3 Storage Classes & Lifecycle: auto-move cold data to a cheaper place"
---

# S3 Storage Classes & Lifecycle: auto-move cold data to a cheaper place

> This page helps you understand the "retrieval speed vs price" trade-off of each of S3's seven storage classes, and how to use lifecycle policies to automatically move "cold data" that fewer and fewer people touch to a cheaper place. It is Domain 4's most commonly tested and most directly money-saving cost-optimization topic.

<Vocab title="📌 Jargon you'll see on this page (fine even if you've never touched AWS)">

- **Object storage**: storing each file together with its metadata as one whole "**object**", rather than slicing it into disk blocks. <Term en="Simple Storage Service" desc="AWS's object storage service; it holds a nearly unlimited number of files (objects) and bills by actual usage.">S3</Term> is this kind of storage.
- **Bucket**: the "**big box**" that holds objects; all your files go into a bucket, and the name is globally unique.
- **Storage class**: the same file can pick a "**storage tier**" — kept on an always-handy but pricier shelf, or placed in a deep warehouse that is cheap but slow to fetch.
- **Durability**: how well data "**will not be lost**". Most S3 classes are eleven 9s (99.999999999%), so loss is almost impossible.
- **Availability**: how well data is "**reachable at any moment**" — a different thing from durability; not being lost does not mean you can connect to it this instant.
- **Retrieval**: the act of "**bringing archived data back into a readable state**"; the cheaper the class, the slower the retrieval, and it may charge a separate retrieval fee.
- **Lifecycle policy**: a set of "**auto-move / auto-discard**" rules that downgrade or delete objects once their age hits a threshold, with no manual effort.

</Vocab>

:::note[💬 Reading tip]
Whenever you see a term with a <Term desc="Like this! Hover over any dotted term (tap on mobile) and a plain explanation pops up.">dotted underline</Term>, hover over it for a plain-language explanation. All terms are also collected in the [Glossary & Services](../../glossary.md).
:::

## Why split into storage classes? A story about keeping everything on the pricey shelf

Say your company dumps **every file** into S3 Standard: yesterday's transaction records, tax receipts from three years ago, raw high-resolution images users uploaded, and a pile of "just in case" backups. All of it sits on the "always handy, fastest" shelf, but here is the problem — **a tax receipt from three years ago might not be touched once a year**, yet it pays the same pricey storage fee as yesterday's hot data.

That is like cramming out-of-season clothes, old textbooks, and keepsakes all into a prime downtown storefront where every square meter costs a fortune. The smart move: **keep the frequently used ones up front, move the occasionally used ones to a suburban warehouse, and seal the barely touched ones in a deep vault**. S3's storage classes are these "shelves", and your job is to place each file in the right one based on "how often it gets touched". **The core of cost optimization is finding the balance between "retrieval speed" and "storage price", based on access frequency.**

## Seven storage classes: "retrieval speed vs price" at a glance

| Storage class | Suits this data | Retrieval speed | Storage cost | Minimum storage days | Retrieval fee |
| --- | --- | --- | --- | --- | --- |
| **S3 Standard** | Frequently accessed hot data | Instant | Most expensive | None | None |
| **S3 Intelligent-Tiering** | Access frequency "unknown / changing" | Instant | Auto-adjusts with hot/cold | None | None (small monitoring fee) |
| **S3 Standard-IA** | Occasional access, but needed instantly | Instant | Cheaper | 30 days | Yes (per retrieved amount) |
| **S3 One Zone-IA** | Re-creatable, non-critical, occasional access | Instant | Even cheaper (about 20% off Standard-IA) | 30 days | Yes |
| **S3 Glacier Instant Retrieval** | Archived but occasionally needed "instantly" | Instant (milliseconds) | Very cheap | 90 days | Yes |
| **S3 Glacier Flexible Retrieval** | Archived, can wait minutes to hours | Minutes to hours | Even cheaper | 90 days | Yes |
| **S3 Glacier Deep Archive** | Long-term archive, almost never retrieved | Hours (within 12 hours) | **Cheapest** | 180 days | Yes (slowest, most frugal) |

A few key ideas:

- The logic of the <Term en="Infrequent Access" desc="Means not often accessed; S3's IA classes have cheaper storage cost but charge a retrieval fee each time you fetch.">IA (Infrequent Access)</Term> classes is "**cheap to store, but charged to retrieve**" — good for data touched only occasionally; if you actually read it often, the retrieval fee eats back the storage savings.
- <Term en="One Zone" desc="Data lives in a single Availability Zone (AZ); cheaper than spanning three AZs, but data can be lost if that one AZ goes down.">One Zone-IA</Term> is cheaper than Standard-IA, at the cost of keeping data in **a single Availability Zone (AZ)**, unlike other classes that span three AZs. If that AZ has a disaster the data can be lost, so only put "**re-creatable, non-critical**" data there (such as thumbnails or temporary transcoding results).
- The three <Term en="Glacier" desc="S3's family of archive storage classes; extremely cheap to store, but retrieval takes time and charges a retrieval fee.">Glacier</Term> siblings are all for "archiving"; the difference is **retrieval speed**: Instant fetches in milliseconds, Flexible waits minutes to hours, and Deep Archive is the cheapest but takes several hours.
- **Minimum storage days** is a trap: if IA data stays under 30 days, or Glacier data under 90/180 days, you are still **billed for the minimum days** — so do not dump data that "changes daily" into them.

### Plain version: why each class exists, when to pick it, when not to

Where to put a given file comes down to one question: **"How often is this data touched, and how long can I wait when I retrieve it?"** Below, each of the seven classes is broken into "why it exists / when to pick it / downsides and when not to", so you can match your data to a class.

- **S3 Standard — why it exists**: the simplest one; always fastest, no retrieval fee, no minimum days. **When to pick**: hot data read and written daily, or whose access pattern changes often (homepage images, in-progress project files). **Downsides / when not to**: the highest per-GB storage fee; keeping data touched only a few times a year here is just burning money.
- **S3 Intelligent-Tiering — why it exists**: it solves the problem of "**I genuinely do not know whether this data will be hot or cold**" by letting S3 move tiers automatically based on actual access. **When to pick**: access frequency is unknown, irregular, or changes over time, and you do not want to manage it by hand. **Downsides / when not to**: each object pays a small **monitoring fee**, so when you have an enormous number of extremely tiny objects (tens of millions of a few-KB thumbnails), the monitoring fee can exceed the savings; a fixed class is then cheaper.
- **S3 Standard-IA — why it exists**: gives data that is "**read only occasionally, but must be fetched instantly when read, and cannot be lost**" an option cheaper than Standard. **When to pick**: data read a few times a month, durable backups that must span three AZs. **Downsides / when not to**: it has a **retrieval fee**, a **30-day minimum storage**, and a **128 KB minimum billable size**; not worth it for data read often, or objects too small or too short-lived.
- **S3 One Zone-IA — why it exists**: shaves another cut off Standard-IA (about 20% off), at the cost of storing in **a single AZ**. **When to pick**: data that is "**re-creatable if lost**" and non-critical (thumbnails, transcoding intermediates, re-runnable analytics output). **Downsides / when not to**: if that AZ has a disaster the data is gone, so **never put any critical or hard-to-recreate data here**.
- **S3 Glacier Instant Retrieval — why it exists**: archive-level price while keeping "**fetch in milliseconds**" instant retrieval. **When to pick**: data touched maybe once a quarter but must be viewable immediately when it is (medical images, compliance reports). **Downsides / when not to**: it has a retrieval fee and a **90-day minimum storage**; do not put frequently read data here.
- **S3 Glacier Flexible Retrieval — why it exists**: cheaper still, at the cost of **retrieval taking minutes to hours**. **When to pick**: rarely retrieved archives where you can wait when you do (old project assets, backups). **Downsides / when not to**: unsuitable when you need it "instantly" (that is Instant Retrieval).
- **S3 Glacier Deep Archive — why it exists**: the **cheapest of all** archives, for data that "regulations make you keep for years but you will almost never dig out". **When to pick**: 7-to-10-year compliance retention, long-term cold backups. **Downsides / when not to**: retrieval takes **several hours** (up to 12) and it has a **180-day minimum storage**; never put data here that you might need within a day.

:::info[🔑 One-line decision: ask "how long can I wait" before "how often do I read"]
Only Standard / Intelligent-Tiering / Standard-IA / One Zone-IA / Glacier **Instant** Retrieval give you data **instantly (milliseconds to seconds)**; consider Glacier Flexible only if you **can wait minutes to hours**; use Deep Archive only if you **can wait several hours and almost never retrieve**. Use "retrieval wait tolerance" to cut half the options first, then use "how often you read" to pick the cheapest of the rest — and you will not choose wrong.
:::

<Analogy title="🏢 Analogy: downtown storefront vs suburban warehouse vs deep vault">

- **S3 Standard = prime downtown storefront**: grab it instantly, but the rent per square meter is highest, so only stock what sells every day.
- **Standard-IA / One Zone-IA = suburban self-storage**: much cheaper rent, and you can still drive over to pick things up the same day, but "each trip to fetch goods costs a handling fee" (retrieval fee). One Zone means "rent only one warehouse, no copy in another region" — even cheaper, but if that warehouse burns down it is gone.
- **Glacier Instant = a vault in the building next door**: just as cheap, visited only occasionally, but reachable and fast.
- **Glacier Flexible = a vault that needs an appointment**: you phone ahead, and minutes to hours later they bring the box to the door.
- **Glacier Deep Archive = an underground vault in a remote mountain**: the lowest rent of all, but retrieval must be scheduled and takes half a day to arrive — ideal for receipts the law makes you keep for seven years yet you will almost never dig out.

</Analogy>

## Access frequency uncertain? Let Intelligent-Tiering move it for you

Often you simply **do not know** how often a piece of data will be touched in the future: files users upload to a newly launched app might be viewed daily for two weeks, then never clicked again. For this kind of "cold-or-hot unclear, and changing" data, picking a class by hand is easy to get wrong.

<Term en="Intelligent-Tiering" desc="S3's smart tiering class; it automatically monitors each object's access frequency, auto-downgrades cooling objects to a cheaper tier, moves hot ones back up, and charges no retrieval fee.">Intelligent-Tiering</Term> is designed for exactly this: it **automatically monitors each object's access frequency**, auto-downgrades objects nobody has touched for a while to a cheaper tier, and moves them back to the hot tier if accessed again — and there is **no retrieval fee**, you only pay a tiny "monitoring fee". For data with an unstable or unknown access pattern, this is the most worry-free first choice.

**Why is Intelligent-Tiering so often the "most worry-free" answer?** Because it automates the two decisions most likely to go wrong: first, **you cannot predict hot vs cold** (with Lifecycle you must decide "how many days counts as cold", and getting it wrong moves data too early or too late); second, **data that goes cold then hot again** — Lifecycle only moves one way, toward colder, so once an old object suddenly gets read heavily again, sitting in IA / Glacier gets it bitten by retrieval fees, whereas Intelligent-Tiering moves it back to the hot tier automatically and **charges no retrieval fee at all**. So when data's temperature "swings back and forth" or "you truly do not know", it is the most worry-free. **But it is not a cure-all**: if your data's temperature is fixed and predictable (for example "logs are kept 30 days then archived and never read again"), a Lifecycle rule that moves straight to the chosen class is simpler and avoids the monitoring fee — in that case the Intelligent-Tiering monitoring fee is just extra spend.

:::tip[💡 Exam key point: match the keyword straight to the class]
Matching the keyword straight to a class is nearly free points:
- Question mentions **"access frequency unknown / irregular / changing", "do not want to manage tiering by hand"** → **Intelligent-Tiering**
- Question mentions **"long-term archive", "almost never retrieved", "regulations require keeping for many years", "lowest cost"** → **Glacier Deep Archive**
- Question mentions **"archived but occasionally needed instantly (milliseconds)"** → **Glacier Instant Retrieval**
- Question mentions **"re-creatable / non-critical data", "want to save money and can accept a single AZ"** → **One Zone-IA**
- Question mentions **"occasional access, but needed instantly, data must be durable across regions"** → **Standard-IA**
- Question mentions **"automatically move old data to a cheaper class / auto-delete"** → **Lifecycle policy**
:::

## Lifecycle policies: let cold data move itself and expire itself

You would not want to manually watch "which files should be downgraded" every day. A <Term en="Lifecycle Policy" desc="Automatic rules on an S3 bucket that transition an object to a cheaper class based on its age, or delete it when it expires.">lifecycle policy</Term> lets you set rules once, and S3 then handles things automatically by object "age", in two kinds of actions:

**Why use Lifecycle instead of moving things by hand?** A real bucket may hold millions or even billions of objects, and nobody can manually track "which file has been untouched for N days and should be downgraded now". Lifecycle turns "auto-downgrade / delete by age" into a rule that **you set once and it stays in effect long-term**, saving manual effort and avoiding bills that pile up forever because someone "forgot to clean up". The difference from Intelligent-Tiering is **what it moves by**: Lifecycle looks at an **object's age (how many days since creation)**, good for data whose temperature is predictable and advances with time (logs, backups, compliance files); Intelligent-Tiering looks at **actual access frequency**, good for data whose temperature is unpredictable and swings back and forth. The two can also be used together.

- **Transition**: when an object reaches a specified number of days, it is **automatically downgraded to a cheaper class**. For example "30 days after creation → Standard-IA, 90 days → Glacier Flexible, 365 days → Glacier Deep Archive".
- **Expiration**: when an object reaches a specified number of days, it is **automatically deleted**. For example "logs are kept 90 days then auto-cleared", saving storage cost that would otherwise pile up forever.

If the bucket has <Term en="Versioning" desc="S3's versioning feature; once enabled, every overwrite or delete keeps the old version, preventing accidental loss.">versioning</Term> enabled, every overwrite keeps an old version, which piles up and costs more. Lifecycle can set rules for **noncurrent versions**, for example "delete old versions automatically 30 days after they become noncurrent", clearing out historical baggage automatically.

:::tip[💡 Exam key point]
Lifecycle transitions can **only downgrade toward colder, cheaper classes** (for example Standard → IA → Glacier); you cannot use it to "auto-promote" Glacier data back to Standard. To make a Glacier object instantly readable again, you must run a manual **restore**. Also, moving very small objects into IA / Glacier is not always worth it, because of the minimum billable size and the minimum storage days.
:::

## Lifecycle diagram

<div className="flow">
  <div className="flow-node">Object just created: S3 Standard (hot)</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Untouched 30 days → Standard-IA</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">90 days → Glacier Flexible (archive)</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">365 days → Glacier Deep Archive (cheapest)</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">2555 days (7 years) → expire and auto-delete</div>
</div>

*Diagram: the older and colder data gets, let Lifecycle move it a step at a time toward cheaper classes, and once the retention period passes, auto-clear it — no manual effort throughout.*

## Real-world application: it's not just for the exam

<Scenario title="Real scenario: your boss says 'the S3 bill keeps climbing, but many files are not being looked at at all'">

Checking the bill you find: the company S3 bucket is piled with five years of logs and user uploads, **all sitting in S3 Standard**. Logs from three years ago are opened less than once a year, yet pay the same pricey storage fee as yesterday's hot data; worse, the bucket has versioning on, and the old versions left by every overwrite were never cleared, quietly taking up nearly half the capacity.

The fix: **set one Lifecycle policy** — objects go to Standard-IA after 30 days, Glacier Flexible after 90 days, Deep Archive after a year, and are auto-deleted when the regulatory period (say 7 years) expires; add one more rule to "**delete noncurrent versions 30 days after they become noncurrent**" to clear old versions. Set it once, and save money automatically from then on. Let's set this rule up below.

</Scenario>

### 🛠️ Hands-on: set a lifecycle rule for a bucket

1. In the console search `S3` → open your **bucket** → choose the **Management** tab at the top.
2. In the **Lifecycle rules** section click **Create lifecycle rule**, name it something like `archive-old-logs`.
3. Set the rule scope to **Apply to all objects in the bucket** (or use a prefix `logs/` to apply only to a specific folder).
4. Tick **Transition current versions of objects between storage classes** and add two steps: `30 days → Standard-IA` and `90 days → Glacier Flexible Retrieval`.
5. Tick **Expire current versions of objects** and set the days to `2555` (auto-delete after about 7 years).
6. If the bucket has versioning on, also tick **Permanently delete noncurrent versions** and set the days to `30` to clear old versions.
7. After creating it, click any old object in the object list to see its **storage class** change automatically over time.

You can also apply the whole rule at once with the CLI (write the console steps above as one JSON file):

```bash
# 1) First write a lifecycle rule file lifecycle.json
cat > lifecycle.json <<'JSON'
{
  "Rules": [
    {
      "ID": "archive-old-logs",
      "Filter": { "Prefix": "logs/" },
      "Status": "Enabled",
      "Transitions": [
        { "Days": 30, "StorageClass": "STANDARD_IA" },
        { "Days": 90, "StorageClass": "GLACIER" }
      ],
      "Expiration": { "Days": 2555 },
      "NoncurrentVersionExpiration": { "NoncurrentDays": 30 }
    }
  ]
}
JSON

# 2) Apply it to the bucket
$ aws s3api put-bucket-lifecycle-configuration \
    --bucket your-bucket-name \
    --lifecycle-configuration file://lifecycle.json

# 3) View the lifecycle configuration currently applied to a bucket (verify it took)
$ aws s3api get-bucket-lifecycle-configuration \
    --bucket your-bucket-name
```

**Expected result**: when the `put` command succeeds it **prints no output** (no error means success); the `get` command then prints back exactly the `Rules` you just set (including the two `STANDARD_IA` and `GLACIER` transitions and the expiration days). The rule **does not move existing objects immediately** — S3 evaluates in a daily batch based on UTC, and an object is only transitioned on the day (the day after) its "age" actually reaches the configured days, so if you check an object's storage class the same day it is **still the original one**, which is normal, not a sign the setup failed.

<Cost>

**Storage cost**: Standard is most expensive, dropping all the way down through IA, Glacier, and Deep Archive, whose per-GB price can be a fraction of Standard. But the price of saving on storage is: **IA / Glacier classes have minimum storage days (30 / 90 / 180) and retrieval fees**, so dumping "frequently read" or "soon deleted" data into them makes retrieval fees and minimum days cost more instead. **Intelligent-Tiering** has no retrieval fee, but each object pays a small monitoring fee, so watch out when you have an enormous number of tiny objects. When done practicing, clean up the test bucket and objects to avoid being locked into billing by the minimum storage days.

</Cost>

:::warning[🚑 Common real-world mistakes]
- **Dumping frequently read data into IA / Glacier**: storage got cheaper, but every retrieval charges a fee; the more you read, the more it costs — not worth it.
- **Ignoring minimum storage days**: putting data that "changes or is deleted within days" into Standard-IA (30-day minimum) or Glacier (90 / 180 days) bills by the minimum days, meaning you overpay.
- **Putting critical data in One Zone-IA**: it stores in a single AZ, and if that zone has a disaster the data is lost; only store "re-creatable if lost" data there.
- **Assuming Lifecycle can auto-promote Glacier back to Standard**: transitions only downgrade toward colder; to read Glacier data you must restore it manually and wait for the retrieval time.
- **Enabling versioning but never clearing old versions**: old versions keep piling up and taking space; remember to set an expiration-delete Lifecycle rule for noncurrent versions.
:::

:::warning[🚑 Common pitfalls]
These few bite your bill, or leave you unable to get data back, and both the exam and real life love to test them:

- **Putting "frequently accessed" data in IA and assuming you saved**: IA's storage fee is cheaper, but **every retrieval charges a fee**. A file actually read daily, placed in Standard-IA, racks up retrieval fees that often **cost more than just using Standard** — you save on storage and lose on retrieval, a net loss. The rule is simple: **consider IA only for data read less than once or twice a month**.
- **Glacier retrieval takes time and charges a separate retrieval fee**: Glacier is not "click and see it". **Flexible takes minutes to hours, Deep Archive takes several hours (up to 12)**, and each retrieval is **billed a retrieval fee** (the more urgent, the pricier). Only **Glacier Instant Retrieval** fetches "instantly (milliseconds)". Dump data you "might need to pull up on short notice" into Deep Archive, and when you actually need it you can only wait half a day.
- **Ignoring "minimum storage days" and "minimum billable size"**: **Standard-IA / One Zone-IA minimum 30 days, Glacier Instant / Flexible minimum 90 days, Deep Archive minimum 180 days**; delete before that and you are still **billed for the minimum days**. Also IA classes have a **128 KB minimum billable size**, so objects smaller than that are **billed as 128 KB**. So data that "changes or is deleted within days", or "piles of a-few-KB tiny files", costs more in IA / Glacier instead.
- **Putting critical data in One Zone-IA (single-AZ risk)**: it stores in **a single Availability Zone (AZ)**, unlike other classes that span three AZs. If that data center has a disaster, the data is **really gone**. Only store "re-creatable if lost" data (thumbnails, transcoding intermediates); **never put critical or hard-to-recreate data here**.
- **Assuming Lifecycle can "auto-promote" Glacier back to Standard**: Lifecycle transitions **only move toward colder, cheaper classes**. To read a Glacier object back, you must **run a manual restore**, wait the retrieval time, and pay the retrieval fee — there is no such thing as "auto-thaw back to the hot tier".
:::

<Refs title="📚 Official docs & further reading">

- [Amazon S3 storage classes overview](https://docs.aws.amazon.com/AmazonS3/latest/userguide/storage-class-intro.html)
- [Managing storage with S3 Lifecycle](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html)
- [S3 Intelligent-Tiering automatic tiering](https://docs.aws.amazon.com/AmazonS3/latest/userguide/intelligent-tiering.html)
- [Restoring archived objects from S3 Glacier classes](https://docs.aws.amazon.com/AmazonS3/latest/userguide/restoring-objects.html)
- [S3 Versioning](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Versioning.html)

</Refs>

## Next

- ⚡ Quick review: [Domain 4 Flashcards](./flashcards.md)
- ✍️ Test yourself: [Domain 4 Practice Questions](./quiz.md)
- 📖 Next page: [Storage & Data Transfer Costs](./storage-transfer-cost.md)
