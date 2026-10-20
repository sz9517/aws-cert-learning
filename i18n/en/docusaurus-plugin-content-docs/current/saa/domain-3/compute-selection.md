---
sidebar_position: 1
title: "Compute Selection: EC2 / Lambda / Containers"
---

# Compute Selection: for the same job, should you use EC2, Lambda, or containers?

> This page helps you find the sweet spot of each of the three compute choices (EC2 / Lambda / containers), and how EC2 instance families map to workloads. It's Domain 3's most commonly tested and most practical "choose by performance need and operational overhead" topic.

<Vocab title="📌 Jargon you'll see on this page (fine even if you've never touched AWS)">

- **Compute**: simply "**the machine that runs your program**". Your code needs somewhere to execute; CPU and memory are that machine's horsepower and desk space.
- **Instance**: a **virtual computer** you rent from AWS. It bills while running and saves money when stopped; it can be tiny or huge.
- **Serverless**: not literally no servers — it means "**AWS looks after the servers for you**". You just write code and ship it; no booting, no patching, no scaling.
- **Container**: packaging your program together with the environment it needs into "**a standard shipping container**" that runs identically on any machine.
- **Operational overhead**: the "**chore cost**" of keeping a system alive — patching the OS, scaling machines, replacing dead disks. Less is easier.

</Vocab>

:::note[💬 Reading tip]
Whenever you see a term with a <Term desc="Like this! Hover over any dotted term (tap on mobile) and a plain explanation pops up.">dotted underline</Term>, hover over it for a plain-language explanation. All terms are also collected in the [Glossary & Services](../../glossary.md).
:::

## Why does selection matter? A story where picking wrong hurts

Say you're building an "upload an image, auto-generate a thumbnail" feature. Traffic is very spiky: sometimes a few images an hour, sometimes thousands flood in at once.

If you naively leave an <Term en="Elastic Compute Cloud" desc="AWS's virtual servers; you rent a whole machine and it bills while it runs.">EC2</Term> running all day waiting, it **burns money idling** when nobody uploads, and a single instance **can't cope** when thousands arrive. For this kind of "short, bursty, event-triggered" work, <Term en="AWS Lambda" desc="A serverless compute service that runs your code only when an event occurs, billed by actual run time; it charges nothing when idle.">Lambda</Term> is almost perfect — it runs only when an image is uploaded, charges nothing when idle, and instantly scales out to thousands.

Conversely, if you run scientific computing that "needs special drivers, full OS control, and runs for hours", forcing it into Lambda hits the **execution time limit**. Picking the wrong compute either wastes money or simply can't do the job. **The core of selection is finding the balance between "performance need" and "operational overhead".**

## The three choices in one sentence

- **EC2**: you rent **a whole virtual computer** — full control, install anything — but you must handle booting, patching, and scaling yourself.
- **Lambda**: you ship just **a piece of code** — it runs on an event and is billed by the millisecond, with servers fully handed to AWS — but each run has a time limit.
- **Containers (ECS / EKS + Fargate)**: you **package your program as a container** — lighter than a whole EC2, better for long runs than Lambda; with <Term en="AWS Fargate" desc="A serverless container engine; you manage only the container while AWS fully manages the underlying servers.">Fargate</Term> you don't even manage the underlying servers.

<Analogy title="🏢 Analogy: renting a house vs ordering delivery vs a shared kitchen">

- **EC2 = renting a whole house**: you hold the keys and can decorate and install any appliance, but plumbing, electrics, and cleaning are all on you (you handle the OS, patching, scaling).
- **Lambda = ordering food delivery**: you order only when hungry (an event), pay for what you eat, and never worry about what the kitchen looks like; but one meal has a size limit (time limit) — not for "an all-day banquet".
- **Containers = renting a stall in a shared kitchen**: you walk in with your own container of ingredients (image) and start cooking, lighter than renting a whole house; with Fargate, "even the stove and extractor fan are maintained for you" — you just cook.

</Analogy>

## EC2 instance families: pick the "model" by workload

EC2 isn't just one kind of machine — it splits into several "families", each boosting a particular resource. Pick the wrong family and it's like hauling cargo in a sports car or racing a truck: money spent, poor result.

| Family | Key series | Strength | Best-fit workloads |
| --- | --- | --- | --- |
| **General purpose** | T, M | Balanced CPU / memory | General websites, small databases, dev/test |
| **Compute optimized** | C | Strongest CPU horsepower | HPC, batch computing, game servers, media encoding |
| **Memory optimized** | R, X | Huge memory | Large in-memory databases (e.g. SAP HANA), real-time big-data analytics, caching |
| **Storage optimized** | I, D | Fast, large local disks | High-IOPS NoSQL, data warehouses, massive log processing |
| **GPU / accelerated** | P, G | Has a GPU | ML training, deep-learning inference, graphics rendering, video transcoding |

<Term en="Compute Optimized" desc="The EC2 family with the strongest CPU, led by the C series; for CPU-heavy work.">C series</Term> is about "**computing fast**"; <Term en="Memory Optimized" desc="The EC2 family with especially large memory, led by R and X series; for memory-heavy work.">R / X series</Term> is about "**holding a lot**" (memory); <Term en="Storage Optimized" desc="The EC2 family with fast, large local-disk read/write, led by I and D series.">I / D series</Term> is about "**fast disk read/write**"; <Term en="Accelerated Computing" desc="The EC2 family equipped with GPUs, led by P and G series; for AI and graphics.">P / G series</Term> is about "**a GPU helping compute**".

:::tip[💡 Exam key point]
Match the keyword straight to the compute choice — nearly free points:
- Question mentions **"don't want to manage servers", "pay per use", "short, event-driven tasks", "runs for seconds then ends"** → **Lambda**
- Question mentions **"needs full OS control", "install special software/drivers", "long-running", "special licensing"** → **EC2**
- Question mentions **"already containerized" but "don't want to manage underlying nodes/servers"** → **Fargate** (with ECS or EKS)
- Question mentions **"HPC", "ultra-low latency between nodes"** → **cluster placement group + enhanced networking (e.g. Elastic Network Adapter)**, with a **compute-optimized C series** instance
- EC2 family mapping: **CPU-bound → C**, **memory-bound → R / X**, **disk-IO-bound → I / D**, **needs GPU → P / G**
:::

## EC2 vs Lambda vs containers: core differences at a glance

| Compared item | EC2 | Lambda | Containers (ECS / EKS + Fargate) |
| --- | --- | --- | --- |
| What you manage | Whole machine (OS, patching, scaling) | Just the code | Just the container (Fargate: no nodes either) |
| Billing | Bills while running (per second/hour) | By actual run time and memory | By container CPU/memory time |
| Run time | No limit, can run forever | Max 15 minutes per invocation | No limit, can run long |
| Startup speed | Boot takes tens of seconds to minutes | Has "cold start" latency (first call slightly slower) | Containers start fast, quicker than booting EC2 |
| OS control | Full control | None at all | Controllable at container level |
| Best for | Long runs, special software, full control | Bursty, event-driven, spiky traffic | Microservices, already containerized, portability |

Two of the most tested limits to burn in: Lambda has a <Term en="Cold Start" desc="When Lambda hasn't been called in a while, the first invocation needs extra startup time, making the first response slightly slower.">cold start</Term> (the first call after idle is slightly slower) and a **15-minute per-invocation time limit**; work that exceeds this or needs to stay resident should move to EC2 or containers.

## Placement Groups: control "where the machines sit"

Normally when you launch EC2, AWS places it wherever. But some workloads are sensitive to "the distance between machines" — that's where a <Term en="Placement Group" desc="A strategy controlling where a group of EC2 instances physically sit in the data center, for low latency or high fault tolerance.">placement group</Term> lets you specify the layout:

- **cluster**: packs a group of EC2s **into the same rack, extremely close together**, for **ultra-low latency and very high network bandwidth between nodes** — exactly what <Term en="High Performance Computing" desc="High-performance computing using many machines in concert, where nodes need frequent, fast communication.">HPC (High Performance Computing)</Term> wants.
- **spread**: **deliberately keeps machines apart** on different hardware, so one hardware failure won't take them all down — for **high fault tolerance**.
- **partition**: in between, splitting into blocks; common for large distributed systems (e.g. Hadoop, Kafka).

:::tip[💡 Exam key point: the HPC keyword combo]
See **"HPC", "ultra-low latency between nodes", "tightly coupled parallel computing"** → the answer combo is **cluster placement group + compute-optimized C series + enhanced networking**. See **"avoid a single point of failure, spread the risk"** → **spread placement group**.
:::

## Compute selection diagram

<div className="flow">
  <div className="flow-node">What am I running?</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Short, event-driven, ≤15 min? → Lambda</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Containerized but don't want servers? → Fargate</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Need full OS / long runs / special software? → EC2 (then pick a family)</div>
</div>

*Diagram: first ask "how light must the operational overhead be" and "how high are the performance/control needs", then follow this path down to the best-fit compute choice.*

## Real-world application: it's not just for the exam

<Scenario title="Real scenario: your boss says 'the bill spiked, but the machines idle most of the time'">

Checking the bill you find: the company has three EC2s running all day, yet the transcoding work only happens "when users upload files" — busy maybe 2 hours a day, idling and burning money the other 22. Meanwhile a "once-a-month, runs for 3 hours" reporting batch keeps failing because it was crammed into Lambda and hits the 15-minute limit.

The fix: **move the bursty transcoding events to Lambda** (runs only when a file arrives, no more 22 hours of idling); **move the 3-hour batch back to EC2 or a container** (not bound by the 15-minute limit). Net result: lower bill, no more failures. Let's move the transcoding to Lambda below.

</Scenario>

### 🛠️ Hands-on: replace an idle EC2 with Lambda

1. In the console search `Lambda` → **Create function** → choose **Author from scratch**, runtime `Python` or `Node.js`.
2. Paste your transcoding/processing logic into the code pane and click **Deploy**.
3. **Add a trigger**: choose `S3`, point it at a bucket, and set the event type to `PUT` (fires when a file is uploaded).
4. Adjust **General configuration**: give `512 MB` memory and set the Timeout to `1 minute` (remember the hard cap is 15 minutes).
5. Drop a file into that S3 bucket, then go to **Monitor → CloudWatch logs** to see the function fire automatically.
6. Once it works, **stop or delete** the previously idle EC2 to save those 22 hours of cost.

```bash
# View a Lambda function's configuration (memory, timeout, runtime)
$ aws lambda get-function-configuration \
    --function-name your-function-name
```

<Cost>

**Lambda has a monthly free tier** (1M requests + 400,000 GB-seconds), so bursty work often costs nothing at all. **EC2** bills as long as it's running — idling included — so "running but unused" is the most common waste. **Fargate** bills by the vCPU/memory time your containers use, less hassle than operating a whole fleet of EC2s. When done practicing, clean up the test EC2 and the Lambda-triggering S3 objects.

</Cost>

:::warning[🚑 Common real-world mistakes]
- **Cramming long-running work into Lambda**: it fails at the 15-minute cap; use EC2 or containers for long runs.
- **Leaving EC2 idling all day**: bursty, irregular work should use Lambda or auto scaling — don't let machines wait idle.
- **Picking the wrong instance family**: cramming an in-memory database onto general purpose runs out of memory and crashes; choose R / X memory-optimized.
- **Forgetting the placement group for HPC**: launching many high-performance EC2s without a cluster placement group raises inter-node latency and tanks performance.
- **Assuming Fargate needs no setup**: you still define how much CPU/memory each container uses — too little still gets OOM-killed.
:::

<Refs title="📚 Official docs & further reading">

- [Amazon EC2 instance types overview](https://docs.aws.amazon.com/ec2/latest/instancetypes/instance-types.html)
- [AWS Lambda Developer Guide](https://docs.aws.amazon.com/lambda/latest/dg/welcome.html)
- [AWS Fargate User Guide](https://docs.aws.amazon.com/AmazonECS/latest/userguide/what-is-fargate.html)
- [EC2 Placement Groups](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/placement-groups.html)
- [Amazon ECS Developer Guide](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/Welcome.html)

</Refs>

## Next

- ⚡ Quick review: [Domain 3 Flashcards](./flashcards.md)
- ✍️ Test yourself: [Domain 3 Practice Questions](./quiz.md)
- 📖 Next page: [Storage Performance Selection](./storage-performance.md)
