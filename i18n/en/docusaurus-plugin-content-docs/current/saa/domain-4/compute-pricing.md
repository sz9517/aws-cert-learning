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

## The five pricing models: why they exist, why you would pick them, when not to

Below, each model is broken into the same four boxes — **why it exists (what it solves) / why you pick it (pros) / cons / when to avoid it** — so you do not just "know it exists" but "know which situation it is for". The core tradeoff is one sentence: **how much flexibility are you willing to trade for a discount.**

### On-Demand: no commitment, just run it

- **Why it exists**: you are just starting, traffic is still uncertain, and you do not want a yearly contract from day one. It lets you "turn on and use, turn off and stop, zero commitment".
- **Why you pick it**: **the most flexible** — start and stop at will, no future usage pledged; it is the "list-price baseline" for every other model.
- **Cons**: **the priciest per unit**. Running a steady, long-running workload on it means paying full price every day, wasting tens of percent.
- **When to avoid it**: once the load is "steady, predictable, running long-term", switch to RI or Savings Plans to save; forcing it onto On-Demand is the most common form of waste.

### Reserved Instances (RI): sure you will use a type long-term, get the deepest discount

- **Why it exists**: many workloads genuinely "run all year with a type that rarely changes". Given that, committing to buy them up front earns a steep discount.
- **Why you pick it**: for steady load, the **deepest discount** (up to about 70%), and a Standard RI can also provide a **capacity reservation** when EC2 capacity is tight (when a Zonal RI is tied to an Availability Zone).
- **Cons**: **low flexibility** — a Standard RI is locked to an instance family and region, and across the 1 or 3 year term you pay the commitment even if the machine is off.
- **When to avoid it**: the type may change later (use **Convertible RI** or **Savings Plans**); you want one discount across EC2, Fargate, and Lambda (use **Compute Savings Plans**); you will not actually fill the usage (do not over-commit).

### Savings Plans: saves just as much, but not locked to a type

- **Why it exists**: RI locking to a type is too rigid; many teams switch types, switch regions, even move from EC2 to Fargate or Lambda. Savings Plans changes the commitment from "a type" to "**how much you spend per hour**", greatly increasing flexibility.
- **Why you pick it**: the discount is on par with RI (up to about 70%), but **Compute Savings Plans** auto-applies across instance families, regions, and EC2, Fargate, Lambda — the first choice for "steady but will be adjusted later" loads.
- **Cons**: it is still committed spend, paid even when unused; it **does not provide a capacity reservation** (for reserved capacity you need separate On-Demand Capacity Reservations or a Zonal RI).
- **When to avoid it**: short-term, temporary, uncertain loads (use On-Demand); when you need guaranteed "a machine will be available" capacity (Savings Plans cannot do this).

### Spot: grab spare capacity, saves the most but gets reclaimed

- **Why it exists**: AWS has lots of "spare capacity not yet sold"; rather than leave it idle, it rents it dirt cheap to people who "do not mind being interrupted" — a win-win.
- **Why you pick it**: **up to about 90% off**, the cheapest of all models. For rerunnable, stateless, horizontally scalable work, it is like buying compute for a tenth of the price.
- **Cons**: **can be reclaimed at any time** (only about a 2-minute interruption notice); capacity is not guaranteed, and the type you want is occasionally unavailable.
- **When to avoid it**: stateful, non-interruptible, critical work that breaks the moment it is cut off (such as a single database host, or unsaved real-time transactions) — these must use On-Demand or RI.

### Dedicated Hosts: born for compliance and bring-your-own-license

- **Why it exists**: some regulations require that "the hardware is used by you alone", and some software licenses (Windows, Oracle) are priced "per physical core or socket" and only count when you occupy a whole physical machine.
- **Why you pick it**: you can see and control the **physical server sockets and cores**, satisfying BYOL licensing and compliance audits, and the same physical machine can be dedicated to you long-term.
- **Cons**: **the priciest**, and management is complex (you manage physical host capacity).
- **When to avoid it**: with no compliance or BYOL need there is no reason to use it — general compute is cheaper and simpler on On-Demand, RI, or SP.

:::info[🔑 The most commonly confused difference: RI vs Savings Plans]
Both have **nearly the same discount, both are 1 or 3 year commitments, and both are paid even when unused**. The difference is only "**what the commitment is tied to**":

- **RI is tied to a "type"**: you commit to instances of a specific family in a specific region (Standard is locked, Convertible can switch). Low flexibility, but a Standard RI can pair with a **capacity reservation**.
- **Savings Plans is tied to "hourly spend"**: as long as you hit the committed amount per hour, it discounts no matter which type or region you switch to, even Fargate or Lambda. High flexibility, but **no capacity reservation**.

One-line memory aid: **want flexibility and cross-service discounts, choose Compute Savings Plans; want a capacity reservation, or the EC2 type is certain not to change, choose RI (or EC2 Instance Savings Plans for the compromise of the deepest discount with slightly more flexibility than RI).**
:::

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

**Expected result**: it returns a list of JSON entries, each with a `SpotPrice` (for example `0.0372`), an `AvailabilityZone`, and a `Timestamp`. Compare that `SpotPrice` with the On-Demand list price for the same type (m5.large is about `0.096` per hour) and it is usually only 30 to 40 percent of list — an instant feel for how much Spot actually saves.

```bash
# Check which active Savings Plans commitments this account still has
$ aws savingsplans describe-savings-plans \
    --states active
```

**Expected result**: it lists each Savings Plan's `commitment` (the hourly committed amount), `savingsPlanType` (`Compute` or `EC2Instance`), and `start` / `end` (the commitment period). An empty array means this account has bought no commitment at all and is paying full On-Demand list price everywhere — exactly the signal that there is money to save.

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
- **Putting stateful or critical work on Spot**: a reclaimed Spot instance just shuts down with only about 2 minutes notice. A database, session state, or unsaved real-time transactions placed there lose all data when reclaimed. Keep stateful work on On-Demand or RI; give Spot only stateless, rerunnable work where "rerun if cut off" is fine.
- **Assuming a Savings Plan guarantees a machine will be available**: the commitment gives you a **discount**, not reserved capacity. To guarantee a specific type at peak, use **On-Demand Capacity Reservations** or a **Zonal RI** separately.
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
