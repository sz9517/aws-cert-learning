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

<Cost>

Auto Scaling as a **service is free**; you only pay for the EC2 instances actually launched. Its real cost value is in **scaling in off-peak** — no need to keep a fleet of idle machines all day. When you're done practicing, set the ASG's **Desired/Maximum to 0 or delete the ASG**, otherwise it keeps maintaining machines and billing you. Use a **Free Tier** `t2.micro`.

</Cost>

:::warning[🚑 Common real-world mistakes]
- **Only in a single AZ**: if that AZ fails, the whole service goes down — that's not high availability. Always span at least 2 AZs.
- **Maximum set too low**: you want to add machines at peak but hit the cap, and get crushed anyway.
- **Cooldown not configured well**: right after adding machines, the metric hasn't reacted yet and the system rushes to add another batch, causing "flapping". Give it some buffer time.
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
