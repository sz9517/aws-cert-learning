---
sidebar_position: 3
title: Auto Scaling
---

# Auto Scaling: let your server count grow and shrink automatically

> This page teaches you how to automatically add servers at peak and shut them down off-peak. It's one of the core topics of Domain 2 (Resilience).

<Vocab title="📌 Jargon you'll see on this page (fine even if you've never touched AWS)">

- **EC2 (Elastic Compute Cloud)**: a "rented server" on AWS; your website or program runs on it.
- **Instance**: one running EC2 — i.e. "one machine".
- **CPU utilization**: a metric for how busy a machine is; the closer to 100%, the closer it is to being overwhelmed.
- **AZ (Availability Zone)**: "independent data centers" within one Region; if one fails, another is still up.

</Vocab>

:::note[💬 Reading tip]
Whenever you see a term with a <Term desc="Like this! Hover over any dotted term (tap on mobile) and a plain explanation pops up.">dotted underline</Term>, hover over it for a plain-language explanation. All terms are also collected in the [Glossary & Services](../../glossary.md).
:::

## Why do you need Auto Scaling?

Imagine you run a bubble-tea shop:

- **Weekday afternoons** are quiet — one clerk is plenty.
- **Weekend after-school rush** is packed — one clerk means a huge queue and customers walking away.
- But if you staff **5 clerks all the time** just for the weekend, on weekdays you're **paying people to stand around**.

Servers are the same. Traffic has peaks and troughs. Run a fixed fleet and you burn money off-peak; run just one or two and a traffic spike crushes you. **Auto Scaling "hires more when busy and sends people home when quiet"** — balancing stability and cost.

### Couldn't I just add and remove machines by hand? Why do I need an ASG?

Sure, you could watch a dashboard yourself, manually launch a few machines at peak, and shut them down off-peak. But in practice this barely works — and that's exactly why the ASG exists:

| Aspect | Doing it by hand | Using an ASG |
| --- | --- | --- |
| **Reaction speed** | A spike hits at 3 AM; by the time you wake up, see the alert, and log in to launch machines, the service has been down for minutes | The moment CloudWatch sees a metric breach, it launches machines **within tens of seconds**, no human needed |
| **A machine dies** | Someone has to notice and manually replace it | The ASG **automatically detects the unhealthy one and replaces it** (self-healing) |
| **Nights / weekends** | No one on shift means no one handles it | Runs automatically 24/7, no rota needed |
| **Human error** | Easy to launch the wrong instance type, forget the load balancer, or kill the wrong machine | Everything follows the **Launch Template** and policy, so the result is predictable |
| **Cost** | You forget (or can't be bothered) to scale in off-peak, so you keep burning money | **Scales in automatically** off-peak — nothing to remember |

:::info[🔑 The one-line takeaway]
The ASG turns "should I add/remove machines, how many, and how?" from a **human judgment plus manual action** into a **metric-driven automatic action**. What it really sells isn't "saving money" but "**no one has to watch it, and it self-heals**" — the savings are just a bonus.
:::

## Auto Scaling in one sentence

**EC2 Auto Scaling** automatically **adds or removes EC2 instances** based on conditions you set (e.g. CPU too high), keeping your system at "just the right" amount of compute at all times.

<Analogy title="🍢 Analogy: flexible staffing at a bubble-tea shop">

- **Auto Scaling Group (ASG)** = the shop's "staffing system", deciding how many clerks are on right now.
- **Launch Template** = the "standard training manual for new clerks": it specifies what instance type, machine image, and security group every new machine uses.
- **Minimum / Desired / Maximum capacity** = "fewest to keep, how many normally, most we can add up to".
- **Scaling Policy** = the rules for "when to add people, and when it's OK to send them home".

</Analogy>

## The three key capacity parameters

This is a **favorite exam detail** — be sure to keep them straight:

| Parameter | Meaning | Example |
| --- | --- | --- |
| **Minimum** | No matter how quiet, keep at least this many (hold the floor) | 2 |
| **Desired** | The count you normally want; the ASG works to reach this number | 2 |
| **Maximum** | No matter how busy, never exceed this many (cap your wallet) | 10 |

:::tip[💡 Exam key point]
- The ASG **continuously pulls the actual count back to "Desired"**; if a machine dies, the ASG automatically replaces it to meet Desired.
- Set `min=2` spread across **two or more AZs**, and even if a whole AZ fails, the other AZ still has machines → this is "high availability".
- **Scale out = add machines**; **Scale in = remove machines**. Don't confuse this with "vertical scaling (bigger machine)" — the ASG does **horizontal scaling**.
:::

## The three scaling policies — which to choose?

| Policy | How it works | When to use |
| --- | --- | --- |
| **Target Tracking** | You set a single target (e.g. keep average CPU at 50%); AWS adds/removes machines to approach it | **Most common, most hands-off** — the exam default |
| **Step Scaling** | Adds machines in tiers based on how far the metric overshoots (e.g. CPU>60% add 1, >80% add 3) | When you need finer control over the scaling amount |
| **Scheduled** | Adds/removes on a "timetable" in advance (e.g. scale to 6 every day at 18:00) | **Predictable** peaks, e.g. daily rush hour, e-commerce sales events |

:::tip[💡 Exam key point]
If a question says "**keep a metric at a fixed level**, as simple to configure as possible" → choose **Target Tracking**.
If a question says "**peak times are fixed and predictable** (e.g. every day at 9 AM)" → choose **Scheduled**.
There's also **Predictive Scaling**: it uses machine learning on historical traffic to **provision machines ahead of time** — great for periodic, predictable loads.
:::

### Dynamic vs Scheduled vs Predictive — how do I actually choose?

These three answer different questions. One line each to keep them straight:

- **Dynamic = looks at "now"**: reacts **after the fact** to live metrics (CPU, request count). Includes both "Target Tracking" and "Step Scaling".
- **Scheduled = looks at "the clock"**: you already know when it gets busy, so it **scales up ahead of time** and ignores metrics entirely.
- **Predictive = looks at "historical patterns"**: AWS uses machine learning on the past few weeks to **predict tomorrow's** busy hours and warm up **in advance**.

| Type | Pros | Cons / limits | When to use it |
| --- | --- | --- | --- |
| **Dynamic (Target Tracking / Step)** | No forecasting needed; keeps up with however traffic moves; intuitive to set | It's **reactive**: the metric spikes first, then machines launch — and a new machine takes minutes to boot and pass health checks, so there's a brief gap where you may lag | Traffic has **no fixed pattern** and arrives unannounced (a viral social share, unpredictable spikes) |
| **Scheduled** | Machines are **ready in advance**, so peak hits a full-strength fleet with no boot gap | You have to **know the peak time yourself**; times are hard-coded, so it can't help with a peak that comes early or late | Peak times are **fixed and predictable** (9 AM each day, Friday night, an e-commerce sale launch) |
| **Predictive** | Best of both: **auto-learns** the pattern and warms up ahead, no manual schedule | Needs **~two weeks of history** to be accurate; only fits **cyclic** loads — useless for brand-new or patternless traffic | Traffic **has a rhythm but you'd rather not schedule by hand**, or you want AWS to detect the daily/weekly cadence for you |

:::tip[💡 Exam key point: keyword map for the three]
- Stem says "**real-time / based on current CPU / can't predict when peaks hit**" → **Dynamic (usually Target Tracking)**.
- Stem says "**fixed daily time / known peak window / cron**" → **Scheduled**.
- Stem says "**cyclic and want machines ready before the peak / use historical data to predict**" → **Predictive**.
- The three **can be combined**: Target Tracking as the baseline, plus a Scheduled policy to warm up before a known big event — very common in real architectures (this page's scenario does exactly this).
:::

### Target Tracking vs Step Scaling — where's the trade-off?

Both are "dynamic", but they control scaling differently, and the exam loves to make you pick one:

| Aspect | Target Tracking | Step Scaling |
| --- | --- | --- |
| **What you set** | Just **one target value** (keep CPU at 50%); AWS handles the rest | You define **multiple thresholds and matching actions** (>60% add 1, >80% add 3) |
| **Like what** | Like a **thermostat**: set 25°C and it adjusts itself | Like **manual tiered switches**: you dictate what each tier does |
| **Pros** | Most hands-off, hardest to misconfigure, the **default choice** for AWS and the exam | Can react with **different force** based on how far the metric overshoots — finer control |
| **Cons / limits** | AWS decides the amount; harder to control precisely | You tune the thresholds yourself, and **set them badly and it flaps** or under-reacts |

:::info[🔑 How to choose, in one line]
**Default to Target Tracking** (it's enough and safest in ~90% of cases); only reach for Step Scaling when you genuinely need "different overshoot levels get different scaling force". If a question doesn't stress fine-grained tiers, the answer is almost always **Target Tracking**.
:::

## How it works (diagram)

<div className="flow">
  <div className="flow-node">CloudWatch detects high CPU</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">triggers scaling policy</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">ASG launches new machine from Launch Template</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">auto-registers to ELB to take traffic</div>
</div>

*Diagram: when CPU spikes, the ASG launches a new machine from the template and attaches it to the load balancer; when traffic drops, it scales back in.*

## How does the ASG work with ELB and health checks?

An ASG rarely appears alone — it's the golden partner of <Term en="Elastic Load Balancing" desc="A load balancer that spreads traffic evenly across multiple machines behind it.">ELB</Term>:

- Machines the ASG launches **auto-register** to the ELB and immediately start sharing traffic; when scaling in, they're deregistered from the ELB before shutdown.
- The ASG can use **ELB health checks**: when the ELB marks a machine "unhealthy" (e.g. response timeout), the ASG **automatically terminates it and replaces it with a new one** — this is the key to a self-healing system.

:::warning[🚑 Common trap: always switch the health check type to ELB]
By default the ASG only does **EC2 health checks** — it only looks at "is the machine's underlying host alive" (booted, passing system status checks). The problem: **the machine is running but the web application on it has crashed** (the service died, keeps returning 500s), and the EC2 check still rates it "healthy", so traffic keeps getting routed to that broken machine.

The fix is to set the ASG's health check type to **ELB (`ELB` health check type)**, so it instead looks at "can the load balancer reach the application layer". Now if the app layer dies, the ASG will **actually replace it**. Whenever a question describes "the machine is still alive but the service isn't responding, yet the ASG won't replace it", the answer is almost always **the health check wasn't set to ELB type**.
:::

<Scenario title="Real scenario: your e-commerce site crashes every anniversary sale">

Your boss complains: "It's fine normally, but during the anniversary sale the homepage won't load — yet I don't want to run 10 machines all year burning money." Your answer is this page: put the site in an **ASG (min=2, max=10)**, use **Target Tracking to keep CPU at 50%**, and add a **Scheduled** policy to warm up before the sale. Below, let's do a basic setup once.

</Scenario>

### 🛠️ Hands-on: build a CPU target-tracking ASG

1. Log in to the AWS console → search `EC2` → in the left menu find **Launch Templates** → **Create launch template**
2. Pick an AMI (machine image, e.g. Amazon Linux), instance type `t2.micro`, and a security group → create
3. In the left menu click **Auto Scaling Groups** → **Create Auto Scaling group** → select the launch template you just made
4. In the network step, **select two or more subnets (in different AZs)** so machines spread across AZs
5. Capacity: **Minimum 2, Desired 2, Maximum 10**
6. For the scaling policy choose **Target tracking**, metric **Average CPU utilization**, target value **50**
7. Done. Use a load-testing tool to drive traffic and watch the machine count grow automatically:

```bash
# See how many machines are in the ASG and which AZ each is in
$ aws autoscaling describe-auto-scaling-groups \
    --auto-scaling-group-names my-web-asg \
    --query "AutoScalingGroups[0].Instances[].{Id:InstanceId,AZ:AvailabilityZone,State:LifecycleState}"
```

**Expected result**: freshly built, with traffic still low, you'll see **two** machines (Desired = 2), spread across two AZs, both `InService`:

```json
[
  {"Id": "i-0a1b2c3d", "AZ": "ap-northeast-1a", "State": "InService"},
  {"Id": "i-0e4f5g6h", "AZ": "ap-northeast-1c", "State": "InService"}
]
```

Drive in a load test, let CPU stay above 50% for a few minutes, then query again: the list grows (say 4–6 machines), and some will be `Pending` (still booting, not yet taking traffic). Once traffic drops, machines gradually turn `Terminating` until the count shrinks back to Desired.

### 🛠️ Advanced: switch to a "Step Scaling" policy that adds machines in tiers

If you want "add a little when CPU is slightly high, add a lot when it's way over", use step scaling. Create a `StepScaling` policy tied to a CloudWatch alarm:

```bash
# Create a step scaling policy: add machines by "overshoot above 50%"
# 0-20 (i.e. CPU 50-70%) add 1 machine; 20 and above (CPU >70%) add 3
$ aws autoscaling put-scaling-policy \
    --auto-scaling-group-name my-web-asg \
    --policy-name cpu-step-out \
    --policy-type StepScaling \
    --adjustment-type ChangeInCapacity \
    --metric-aggregation-type Average \
    --step-adjustments \
        MetricIntervalLowerBound=0,MetricIntervalUpperBound=20,ScalingAdjustment=1 \
        MetricIntervalLowerBound=20,ScalingAdjustment=3
```

**Expected result**: the command returns this policy's `PolicyARN`. You then set that ARN as the action of a CloudWatch "CPU > 50%" alarm; afterward, whichever tier CPU lands in, the ASG adds that many machines. Check the alarm state to confirm it's live:

```bash
$ aws cloudwatch describe-alarms --alarm-names high-cpu \
    --query "MetricAlarms[0].{State:StateValue,Actions:AlarmActions}"
# Normally you'll see State toggle between OK / ALARM; on ALARM it triggers the policy above
```

:::info[🔑 Don't mix two dynamic policies on the same metric]
**Don't attach both** target tracking and step scaling to the same metric (e.g. average CPU) — the two logics fight each other and cause flapping. Use target tracking for the whole group, or step scaling for the whole group, not both.
:::

<Cost>

Auto Scaling as a **service is free**; you only pay for the EC2 instances actually launched. Its real cost value is in **scaling in off-peak** — no need to keep a fleet of idle machines all day. When you're done practicing, set the ASG's **Desired/Maximum to 0 or delete the ASG**, otherwise it keeps maintaining machines and billing you. Use a **Free Tier** `t2.micro`.

</Cost>

:::warning[🚑 Common traps]
- **Only in a single AZ**: if that AZ fails, the whole service goes down — that's not high availability. Always span at least 2 AZs.
- **Health check type not set to ELB**: the default EC2 check can't see "machine alive but app crashed", so a broken machine keeps taking traffic. For anything behind a load balancer, switch the type to **ELB** (see the health check section above).
- **Maximum set too low**: you want to add machines at peak but hit the cap, and get crushed anyway. Conversely, **Maximum set too high** can let a traffic burst (or an attack) drag you into launching machines without limit and blow up the bill — pair it with a budget alert.
- **min / max / desired set wrong**: the three have an implicit "`min ≤ desired ≤ max`" relationship. A classic disaster is **setting `desired` higher than you actually need** (say a slip of 10), so the ASG dutifully grows to 10 machines and bills you nonstop; or **setting `min` too high**, so off-peak you can't scale down to save money (the ASG holds the min floor and won't cut below it).
- **Cooldown not configured well**: right after adding machines, the metric hasn't reacted yet and the system rushes to add another batch, causing "flapping". Give it buffer time so new machines can take effect first.
- **Scaling in too fast, killing machines still in service**: if scale in is too aggressive, a brief traffic dip triggers a shutdown, then traffic returns and the just-killed machine was for nothing — worse, it can **terminate a machine that still has user connections on it**, cutting requests off. Fixes: use **connection draining / deregistration delay** so a machine finishes its existing connections before shutdown, set a sensible scale-in cooldown, and where needed use **instance scale-in protection** to keep critical machines from being chosen for scale in.
- **Treating scaling as a way to fix bugs**: if the app itself has a memory leak, adding machines only delays the crash and burns more money.
:::

<Refs title="📚 Official docs & further reading">

- [AWS Docs: Amazon EC2 Auto Scaling User Guide](https://docs.aws.amazon.com/autoscaling/ec2/userguide/what-is-amazon-ec2-auto-scaling.html)
- [Scaling policy types (target tracking / step / simple)](https://docs.aws.amazon.com/autoscaling/ec2/userguide/scale-your-group.html)
- [Target tracking scaling policies](https://docs.aws.amazon.com/autoscaling/ec2/userguide/as-scaling-target-tracking.html)

</Refs>

## Next

- ⚡ Quick review: [Domain 2 Flashcards](./flashcards.md)
- ✍️ Test yourself: [Domain 2 Practice Questions](./quiz.md)
- 📖 Next page: [Decoupling (SQS / SNS)](./decoupling.md)
