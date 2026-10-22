---
sidebar_position: 1
title: "Compute Pricing: On-Demand / Reserved / Spot / Savings Plans"
---

# Compute Pricing: for the same EC2, how do you pay the least?

> This page helps you understand the several "ways to pay" for EC2 compute: On-Demand, Reserved Instances, Savings Plans, Spot, and Dedicated Hosts, plus the Domain 4 "match the keyword to the model" free points. The machine is identical; pick the right pricing model and the bill can differ severalfold.

<Vocab title="📌 Jargon you'll see on this page (fine even if you've never touched AWS)">

- **Pricing model**: for the same machine, AWS gives you several "**ways to pay**". Pay-by-the-hour is priciest; commit to usage up front for the deepest discount.
- **Commitment**: you tell AWS in advance that you "**will keep using this much for the next 1 or 3 years**", in exchange for a discount. Longer term and more upfront payment means a deeper discount.
- **Interruption**: AWS "**takes back**" the cheap capacity it lent you temporarily — the machine gets shut down, but you get a warning in advance.
- **Fault tolerant**: work that "**does not break if interrupted mid-way**" — it can be rerun, or moved to another machine, without losing data.
- **BYOL (Bring Your Own License)**: you **supply your own software license** (for example certain Windows or Oracle licenses) and keep using it on AWS.

</Vocab>

:::note[💬 Reading tip]
Whenever you see a term with a <Term desc="Like this! Hover over any dotted term (tap on mobile) and a plain explanation pops up.">dotted underline</Term>, hover over it for a plain-language explanation. All terms are also collected in the [Glossary & Services](../../glossary.md).
:::

## Why does picking a pricing model matter? A story where you overpay

Say your company runs a set of website hosts with very steady traffic that **must stay on 365 days a year**. If you run them all on <Term en="On-Demand" desc="EC2 billed by usage time; it charges while running and stops when stopped, the most flexible but priciest per unit.">On-Demand</Term> (billing while running), you are paying the "list price" every single day, which adds up to a frightening yearly bill.

For this kind of "**predictable, long-running**" workload, you only need to commit to AWS that "I will keep using this much for the next 1 (or 3) years" to earn a discount of **up to roughly 70%** (Reserved Instances or Savings Plans). Conversely, for batch computing that "**can be thrown away after it finishes and does not mind being cut off mid-way**", <Term en="Spot Instances" desc="Uses spare AWS capacity, saving up to about 90%, but can be reclaimed (interrupted); best for fault-tolerant, rerunnable work.">Spot</Term> can even save around **90%**. Picking the wrong pricing model either wastes money or puts work that must not be interrupted somewhere it will be. **The core of cost optimization is matching "how stable the workload is" to "the right pricing model".**

## The five pricing models in one sentence

- **On-Demand**: bills while running, stops when stopped — the most flexible, no commitment, but the **priciest per unit**.
- **Reserved Instances (RI)**: commit to a specific instance type for **1 or 3 years** for **up to about 70%** off; best for steady workloads.
- **Savings Plans**: also a 1 or 3 year commitment, but you commit to "**how much you spend per hour**" rather than locking to an instance type, so it is **more flexible than RI**.
- **Spot**: picks up spare AWS capacity for **up to about 90%** off, but **can be reclaimed** (interrupted); only for fault-tolerant work.
- **Dedicated Hosts**: a whole physical server dedicated to you, for **compliance** or **bring-your-own-license (BYOL)**; the priciest option.

<Analogy title="🏨 Analogy: booking a hotel vs a yearly contract vs grabbing an empty room vs the whole building">

- **On-Demand = walking into a hotel and booking tonight**: stay as many nights as you like, book as you go — the most freedom, but you pay the "**daily rate**", the priciest.
- **Reserved Instances = signing a one-year stay contract**: agree up front that "I will stay in this room type all year" for a steep rate cut; but the room type is locked (Standard), or you pay a little more to switch room types (Convertible).
- **Savings Plans = a membership with a fixed monthly spend**: you commit to "I will spend this much across the chain each month", and it counts no matter which branch or room type you use — **more flexible than a room-locked yearly contract**.
- **Spot = grabbing a room the hotel did not sell tonight**: dirt cheap, but the hotel **can ask you to vacate at any time** (with advance notice to pack up) — only for someone fine with being moved to another room to keep sleeping.
- **Dedicated Hosts = booking the whole building**: to fully use a license tied to "this one building", or because regulations require you to occupy the hardware alone; the priciest but most exclusive.

</Analogy>

## The four mainstream pricing models: core differences at a glance

| Compared item | On-Demand | Reserved (RI) | Savings Plans | Spot |
| --- | --- | --- | --- | --- |
| Commitment needed | No | Yes (1 or 3 years) | Yes (1 or 3 years) | No |
| How much you save | 0% (list price baseline) | Up to about 72% | Up to about 72% | Up to about 90% |
| Can it be interrupted | No | No | No | **Yes** (2-minute warning) |
| Flexibility | Highest | Low (locked to type/region) | Medium (locked to spend, not type) | High (but can be reclaimed anytime) |
| Best for | Short-term, uncertain, temporary peaks | Steady, predictable, long-running | Steady but the type may change | Fault-tolerant, rerunnable, stateless batch |

### Reserved Instances: Standard or Convertible?

RI means "commit up front for a discount", and it splits into two flexibility levels:

- **Standard RI**: the deepest discount, but **locked to an instance family** and hard to change mid-term. Best for "I am sure I will use this machine all year".
- **Convertible RI**: a slightly shallower discount, but you **can switch to a different type, OS, or tenancy mid-term**. Best for "long-term use, but the type may need adjusting later".
- **Term**: both offer **1 or 3 years**; a longer term and more upfront payment (All Upfront more than Partial Upfront more than No Upfront) means a deeper discount.

### Savings Plans: why is it more flexible than RI?

Savings Plans does not lock "which instance type you use" but commits to "**a fixed dollar amount per hour (for example 10 dollars of compute usage per hour)**". Within that amount it keeps discounting no matter how you switch types, switch regions, or even move from EC2 to Fargate or Lambda. Two commonly tested kinds:

- **Compute Savings Plans**: the **most flexible** — covers EC2, Fargate, and Lambda, across instance families, regions, and operating systems. Slightly less discount than the next one.
- **EC2 Instance Savings Plans**: **locked to one instance family in one region** (for example the C series in us-east-1), so less flexible but with the **deepest discount**, very close to Standard RI.

:::tip[💡 Exam key point]
Match the keyword straight to the pricing model — nearly free points:
- Question mentions **"steady, predictable, long-running", "lowest cost but must not be interrupted"** → **Reserved Instances or Savings Plans**
- Question mentions **"maximum flexibility, want discounts across types and across EC2, Fargate, Lambda"** → **Compute Savings Plans**
- Question mentions **"can be interrupted", "fault-tolerant", "stateless", "batch", "rerunnable", "save as much as possible"** → **Spot Instances**
- Question mentions **"short-term, temporary, uncertain traffic, no commitment"** → **On-Demand**
- Question mentions **"regulation requires exclusive physical host", "bring your own license (BYOL)", "license tied to physical cores"** → **Dedicated Hosts**
- Spot gives a **2-minute interruption notice** before reclaiming; a common architecture is **Auto Scaling mixing On-Demand plus Spot** (base load on On-Demand for stability, peaks on Spot for savings).
:::

## Why is Spot cheap? Why does it get interrupted?

Spot rents you the **spare capacity AWS has not yet sold**, cheaply. Once AWS needs that capacity back for normal (On-Demand) selling, it will **reclaim your Spot instance**. The good news is that before reclaiming it sends a <Term en="Spot Interruption Notice" desc="The notice AWS sends before reclaiming a Spot instance, giving you about 2 minutes to save or move the work.">interruption notice</Term>, giving you **about 2 minutes** to wrap up (save progress, hand the work to another machine).

So the iron rule for Spot is: **only place work that does not break when cut off** — for example video batch transcoding, data processing pipelines, CI/CD builds, machine-learning training (with checkpoints), and stateless web front ends. Never place work that "dies the moment it is interrupted" (such as a single, unsaved database host) on Spot.

## Pricing model selection diagram

<div className="flow">
  <div className="flow-node">What happens if this work is interrupted?</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Fine if interrupted, rerunnable? → Spot (saves the most)</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Cannot be interrupted, steady long-term? → RI or Savings Plans</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Short-term / uncertain / no commitment? → On-Demand</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Need exclusive hardware / own license? → Dedicated Hosts</div>
</div>

*Diagram: first ask "will it break if interrupted" and "how steady is the workload", then follow this path down to the cheapest and most suitable pricing model.*

## Real-world application: it is not just for the exam

<Scenario title="Real scenario: your boss says 'the bill is too high, but some machines can clearly be interrupted'">

Auditing the company EC2 workloads, you find three kinds: a set of website hosts that must stay on 24 hours (steady traffic); a nightly video transcoding batch (throwaway once done, just rerun if interrupted); and peak machines spun up only during occasional campaigns (uncertain when they run). Right now **everything runs On-Demand**, so the bill is naturally high.

The fix: **the steady website hosts** go to a 1-year **Savings Plans** commitment (about 70% off and never interrupted); **the rerunnable transcoding batch** moves to **Spot** (up to about 90% off, just rerun if interrupted); **the temporary peaks** stay on **On-Demand** (to avoid being tied by a yearly commitment). Match all three workloads to three pricing models at once, and the bill slims down fast. Below we use the CLI to check current Spot prices and get a Savings Plans recommendation.

</Scenario>

### 🛠️ Hands-on: check Spot prices and view Savings Plans recommendations

1. In the console search `EC2` → left panel **Spot Requests** → **Pricing History**, pick an instance type and see its Spot price swings (usually far below the On-Demand list price).
2. Search `Cost Explorer` → open **Savings Plans → Recommendations**, and AWS computes "how much hourly commitment to buy and how much you can save" from your past usage.
3. To run a batch on Spot: in a **Launch Template** or an **Auto Scaling group**, configure a mixed-instances policy — part On-Demand (a safety floor) and part Spot (for savings).
4. Add interruption handling to Spot work: listen for the interruption notice, and once received, save progress and move traffic away within 2 minutes.

```bash
# Check an instance type's recent Spot prices (far below the On-Demand list price)
$ aws ec2 describe-spot-price-history \
    --instance-types m5.large \
    --product-descriptions "Linux/UNIX" \
    --max-items 5
```

<Cost>

**Savings order** (same machine): **Spot (up to about -90%) more than Savings Plans / RI (about -72%) more than On-Demand (list price) more than Dedicated Hosts (priciest)**.

Key reminders:

- **RI and Savings Plans are "committed spend"**: even if a machine is stopped and unused, you still pay the committed amount, so **commit only to usage you are sure you will keep long-term**.
- **Spot saves the most but gets interrupted**, so place only fault-tolerant, rerunnable work there and handle the 2-minute interruption notice.
- When done practicing, **stop or delete** the test Spot and On-Demand instances to avoid ongoing charges.

</Cost>

:::warning[🚑 Common real-world mistakes]
- **Forcing steady load onto On-Demand**: long-running yet no RI or Savings Plans means paying list price every day, wasting tens of percent.
- **Placing non-interruptible work on Spot**: a single, unsaved database host getting reclaimed is a disaster; Spot is only for rerunnable, stateless work.
- **Over-committing with RI or Savings Plans**: a 3-year commitment on usage you will not actually fill means paying for idle machines, ending up pricier; start with 1 year and a smaller commitment.
- **Forgetting to handle the Spot 2-minute notice**: being shut down without listening for the interruption notice loses all progress; pair it with checkpoints or hand the work to another machine.
- **Confusing RI with Savings Plans**: RI locks to an instance type, Savings Plans locks to a spend amount; for maximum flexibility (across EC2, Fargate, Lambda) choose **Compute Savings Plans**.
:::

<Refs title="📚 Official docs & further reading">

- [Amazon EC2 pricing](https://aws.amazon.com/ec2/pricing/)
- [Amazon EC2 Reserved Instances](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-reserved-instances.html)
- [AWS Savings Plans User Guide](https://docs.aws.amazon.com/savingsplans/latest/userguide/what-is-savings-plans.html)
- [Amazon EC2 Spot Instances](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-spot-instances.html)
- [Amazon EC2 Dedicated Hosts](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/dedicated-hosts-overview.html)

</Refs>

## Next

- ⚡ Quick review: [Domain 4 Flashcards](./flashcards.md)
- ✍️ Test yourself: [Domain 4 Practice Questions](./quiz.md)
- 📖 Next page: [S3 Storage Classes and Lifecycle](./s3-storage-classes.md)
