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

## One by one: why pick it? Pros, cons, and when NOT to use it

You know the names, but what's genuinely hard — on the exam and in practice — is "**why pick this one instead of the one next to it**". Below, each compute option gets a fixed section so the trade-offs are obvious at a glance.

### EC2: pick it when you need full control or long runs

**Why it's the one**: when you need **full control of the whole machine** — installing special drivers, special kernel parameters, specific licensed software (e.g. certain commercial databases, graphics software), or the work **runs for hours or stays resident long-term** — only EC2 gives you that freedom. Lambda can't touch the OS and caps at 15 minutes; containers can run long but don't hand you the underlying kernel by default.

**Pros**: highest control (OS, kernel, network, disk all tunable); no run-time limit; a full set of instance families so every workload has matching hardware; supports GPUs and special licensing (bring your own license, BYOL).

**Cons**: **heaviest operational overhead** — patching, updates, scaling, monitoring, replacing dead disks are all yours; **bills while running**, idle included; you must set up Auto Scaling and load balancing yourself to get elasticity.

**When NOT to use it**: work that is "short, bursty, event-triggered" → Lambda is cheaper; you just want to run a container without minding the machine → Fargate; keeping a whole machine alive just for one stateless tiny API → usually waste.

### Lambda: pick it when work is event-driven and you don't want to mind servers

**Why it's the one**: when work is **triggered by events and each run finishes quickly** (file upload, API request, message into a queue), Lambda lets you "**manage just a piece of code**" — servers, patching, scaling all handed to AWS — while it **charges nothing when idle** and scales out instantly. This is operational overhead taken to its minimum.

**Pros**: **near-zero operational overhead**; billed by the millisecond, free when idle; automatic, instant scale-out to high concurrency; natively integrated with event sources like S3, API Gateway, and EventBridge.

**Cons**: **15 minutes max per invocation** (long runs are out); has <Term en="Cold Start" desc="When Lambda hasn't been called in a while, the first invocation needs extra startup time, making the first response slightly slower.">cold start</Term> latency (first call after idle is slower); no OS access, cannot install arbitrary system software; per-invocation memory, /tmp, and deployment package all have caps; under steady high traffic, cost can end up higher than a resident EC2 or container.

**When NOT to use it**: long-running or resident work (> 15 minutes), needing full OS control, needing predictable ultra-low latency without paying for Provisioned Concurrency, or traffic so steady that "one machine left running is actually cheaper".

### Containers (ECS / EKS / Fargate): pick them for portability and microservices

**Why they're the one**: when you've **already containerized** your app (or want microservices), want the portability of "**the same image runs identically in dev, test, and prod**", and need something that runs longer than Lambda yet lighter than a whole EC2, containers are the best fit. With Fargate you don't even manage the underlying servers.

**Pros**: high portability (the image is consistent anywhere); faster to start and denser than a whole EC2 (pack many containers onto one machine to save money); well suited to splitting into independently scalable microservices; with Fargate you skip minding nodes.

**Cons**: you must first know how to build images and write task/service definitions; one more layer of concepts than Lambda; EKS has a **cluster management fee**, and K8s itself has a steep learning curve; you still **decide how much CPU/memory each container gets** (too little gets OOM-killed).

**When NOT to use them**: just running a small event-triggered program (Lambda is simpler); the team has no container experience and the work isn't complex (forcing K8s is self-inflicted pain); a single monolith you don't plan to split into microservices soon.

## The three container siblings: ECS vs EKS vs Fargate — how they differ and which to pick

Many people treat "containers" as one thing, but the exam often tests whether you can tell these three apart. Remember one line: **ECS / EKS are "who schedules and manages the containers" (the control plane); Fargate is "whose machines the containers run on" (the launch type)** — they're two different dimensions and can be combined.

| Name | What it is | Sweet spot | The cost |
| --- | --- | --- | --- |
| **ECS** | AWS's own container orchestrator — simple concepts, deeply integrated with AWS | Running containers on AWS without the complexity of Kubernetes | Tied to AWS; less cross-cloud portable than K8s |
| **EKS** | AWS-managed <Term en="Kubernetes" desc="The open-source container orchestration platform — powerful but complex, portable across clouds.">Kubernetes</Term> | The team is **already on K8s**, needs the K8s ecosystem / cross-cloud consistency, or has complex scheduling needs | Steep learning curve + a **management fee per cluster** (control-plane cost) |
| **Fargate** | A serverless container **launch engine** (works with ECS or EKS) | **Not wanting to mind the underlying EC2 nodes** (patching, scaling) | Per-unit compute usually a bit pricier than self-managed EC2, in exchange for no ops |

<Analogy title="🏢 Analogy: ECS/EKS is the 'scheduler', Fargate is 'bring your own venue or not'">

- **ECS / EKS = two kinds of scheduler**: ECS is AWS's simple in-house scheduler (few commands, easy to start); EKS is the industry-standard but complex scheduler (Kubernetes — schedules anything, but takes a long time to learn).
- **Fargate = whether you prepare the venue yourself**: picking Fargate means "the venue (underlying servers) is prepared and maintained by AWS" — you just hand over the container; not picking Fargate (the EC2 launch type) means "you rent and mind the venue yourself".
- So the real choice is **a two-cell combo**: ECS+Fargate, ECS+EC2, EKS+Fargate, EKS+EC2 are all valid.

</Analogy>

:::tip[💡 Exam key point: whether you need EKS]
If the question **doesn't mention Kubernetes and the team has no K8s experience** yet wants to "run containers on AWS with minimal ops" → lean toward **ECS (+ Fargate)**; don't reflexively pick EKS. Only pick **EKS** when the question explicitly mentions **"existing Kubernetes workloads / needs the K8s ecosystem / multi-cloud consistency"**. See **"don't want to mind the underlying EC2 nodes/servers"** → add **Fargate**.
:::

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

### Reading the instance name: what does a string like `m6g.large` mean?

After the family, you still pick "how big, which generation". EC2 instance names are actually a decodable code — split it up and it's not scary:

- **`m6g.large`** → `m` = family (general purpose), `6` = generation (bigger number = newer, usually better value), `g` = extra modifier, `.large` = size.
- Common modifiers: **`g` = Graviton (AWS's in-house ARM chip — cheaper and more power-efficient at the same performance)**, `a` = AMD processor, `i` = Intel, `n` = enhanced networking, `d` = has local NVMe disk.
- Sizes from small to large: `nano` → `micro` → `small` → `medium` → `large` → `xlarge` → `2xlarge`… **each step up roughly doubles vCPU and memory — and roughly doubles the price**.

:::tip[💡 Exam key point: choosing generation and Graviton]
- If the question asks "**how to get the same performance for less money**" with no special x86 dependency → prefer a **newer generation** and a **Graviton (`g`) instance** — usually the best value.
- Pick the **right family first** (sets the hardware direction), then a **large-enough size** (don't oversize into idling), and only then compare generation and processor within the same tier.
:::

:::info[🔑 Easy to confuse: vertical vs horizontal scaling]
**Swapping in a bigger instance (e.g. large → 2xlarge) is vertical scaling (scale up)** — simple, but limited by a single machine's ceiling and usually needs downtime to resize; **running more identical machines behind a load balancer is horizontal scaling (scale out)** — effectively unlimited and more fault-tolerant, the cloud-preferred direction. On the exam, "traffic is growing, needs to keep scaling and be fault-tolerant" usually points to **horizontal scaling + Auto Scaling**, not endlessly swapping in a bigger machine.
:::

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

**Expected result**: within seconds of the upload, CloudWatch logs show a new execution record (`START` / `END` / `REPORT`); the `REPORT` line shows this run's `Duration` (milliseconds), `Billed Duration`, and `Memory Used`. Seeing these means the trigger and the function both work; `get-function-configuration` prints the values you set — `MemorySize: 512`, `Timeout: 60`, and the `Runtime`.

<Scenario title="Real scenario: a long batch belongs on a container, not crammed into Lambda">

Continuing from above, that "once-a-month, runs for 3 hours" reporting batch keeps hitting the 15-minute Lambda cap. It's **already containerized** (has a Dockerfile) but only runs once and needn't stay resident. The least-hassle fit here is an **ECS + Fargate "scheduled task"**: use EventBridge to fire a Fargate task on a monthly schedule; when the container finishes it stops automatically and stops billing — no 15-minute limit, no need to keep an EC2 running all month, and no need to learn Kubernetes just to run a container (no EKS required).

**How to decide**: long run (rules out Lambda) + already containerized (suits containers) + don't want to mind nodes (pick Fargate) + no K8s need (pick ECS, not EKS) = **ECS on Fargate + an EventBridge schedule**.

**Expected result**: when the monthly schedule fires, ECS launches a Fargate task that runs for about 3 hours and, once complete, moves to `STOPPED` and stops billing; in the ECS console for that cluster you can watch the task go `PROVISIONING` → `RUNNING` → `STOPPED`, with CloudWatch logs for the period, and the bill charges only the vCPU/memory used for those 3 hours.

</Scenario>

<Cost>

**Lambda has a monthly free tier** (1M requests + 400,000 GB-seconds), so bursty work often costs nothing at all. **EC2** bills as long as it's running — idling included — so "running but unused" is the most common waste. **Fargate** bills by the vCPU/memory time your containers use, less hassle than operating a whole fleet of EC2s. When done practicing, clean up the test EC2 and the Lambda-triggering S3 objects.

</Cost>

:::warning[🚑 Common pitfalls]
- **Cramming long-running / over-15-minute work into Lambda**: the classic trap. Anything over 15 minutes per invocation is force-killed, so report batches, long video transcodes, and large data migrations all fail; use **EC2, containers, or split the work with Step Functions**. Before picking Lambda, ask: "Is this guaranteed to finish within 15 minutes?"
- **Reflexively picking EKS for containers when you don't actually need Kubernetes**: forcing EKS when the team has no K8s experience and the work isn't complex means paying the control-plane management fee plus taking on a steep learning and ops curve. Without a clear need for "already on K8s / needs the K8s ecosystem / multi-cloud consistency", **ECS (+ Fargate)** is simpler.
- **Choosing by unit price alone, ignoring operational overhead**: comparing only "who's cheaper per hour" is the most common misjudgment. EC2's unit compute looks cheap, but the **labor and time cost** of patching, scaling, monitoring, and replacing dead disks is often the bigger chunk; Lambda/Fargate cost more per unit but the ops they save often wins. Fold **operational overhead into the total cost** when selecting.
- **Leaving EC2 idling all day**: bursty, irregular work should use Lambda or Auto Scaling — don't let machines wait idle and burn money.
- **Picking the wrong instance family**: cramming an in-memory database onto general purpose runs out of memory and crashes; choose R / X memory-optimized. Running CPU-heavy work on memory-optimized, conversely, pays for memory you waste.
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
