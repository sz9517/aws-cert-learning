---
sidebar_position: 8
title: "Billing Alerts & Free Tier: Avoid Surprise Bills"
---

# Billing Alerts & Free Tier: Don't Let the Bill Scare You

> The biggest fear for anyone who just opened an AWS account is: "**Am I going to get hit with a huge charge by accident?**" This page walks you through how the Free Tier works, what the classic "surprise bill" traps look like, and finally how to set up **two safety nets** — a budget alert plus a billing alert — so you can practice with peace of mind and never get woken up by a scary invoice.

<Vocab title="📌 Jargon you'll see on this page (fine even if you've never touched AWS)">

- **Free Tier**: AWS's "**trial allowance**" for newcomers — you can use certain services for free within set limits. It's the perfect sandbox for practice.
- **Billing Alert**: a warning that **proactively emails you** when your spend or usage is about to exceed a threshold, so you're never charged silently.
- **Budget**: a threshold you set in advance — "**the most I want to spend this month**" — that notifies you when you're over or about to go over.
- **Instance**: a virtual machine you rent (e.g. one EC2). If it's running, it's being used; if you don't stop it, it keeps billing.
- **Pay-as-you-go**: AWS's billing philosophy, like a utility bill — the more you use, the more you pay; use nothing and you're charged nothing. The upside is savings; the downside is that **if you forget to turn something off, the meter keeps running**.

</Vocab>

:::note[💬 Reading tip]
Whenever you see a term with a <Term desc="Like this! Hover over any dotted term (tap on mobile) and a plain explanation pops up.">dotted underline</Term>, hover over it for a plain-language explanation. All terms are also collected in the [Glossary & Services](/glossary).
:::

## Why figure out the "money" side first?

<Analogy title="🍽️ Analogy: AWS is like an all-you-can-eat buffet with 'premium add-ons'">

Many AWS services are inside the Free Tier, just like the "**standard dishes**" at a buffet — grab as much as you want, no extra charge. But some items (think wagyu, oysters, a special cocktail) carry a **surcharge**. It's printed on the menu; you just didn't read it carefully.

When newcomers get a surprise bill, it's almost never because they "ate too much" — it's because they **didn't notice which items cost extra**: they casually ordered a service outside the free allowance, or forgot to settle up on the way out (forgot to turn off a machine). Then the end-of-month bill arrives and gives them a shock.

Understand the rules first, set up your alarms first, and you can "eat" with confidence — knowing what's free, what costs money, and getting a heads-up when you're near a limit.

</Analogy>

AWS is **pay-as-you-go**, which saves money, but it also means **nobody will stop you automatically** — unless you set up alerts yourself. So before you touch any service, spending ten minutes to set up the two safety nets in this page is the best investment you can make.

**Why set a billing alert *first*, instead of dealing with it when something goes wrong?** Because AWS bills in arrears — everything you do in the cloud is tallied up and **invoiced to you once, at the end of the month**. Without an alert, you have no idea you're bleeding money the entire month; by the time the bill arrives, the money is **already spent and unrecoverable**. That's exactly the point of a billing alert: it turns "find out at month-end" into "find out the moment spend appears," giving you a chance to stop resources and stop the bleeding while it's still small money. For a beginner, that's **ten minutes of setup** buying **a whole month of peace of mind** — a bargain any way you count it.

## The Free Tier comes in three types — don't mix them up

Lots of beginners assume "Free Tier" means "free forever," then get charged the moment it expires without realizing. In reality AWS's Free Tier splits into **three types**, and knowing the difference keeps you out of trouble:

| Type | In plain terms | Duration | Common examples |
| --- | --- | --- | --- |
| **12-month free** | A monthly allowance for 12 months after you open a new account | 12 months from sign-up | EC2 `t2.micro`/`t3.micro` 750 hours/month, S3 standard storage 5 GB, RDS 750 hours/month |
| **Always Free** | A monthly allowance with no time limit — still there years later | Permanent (resets monthly) | Lambda 1 million requests/month, DynamoDB 25 GB storage, CloudWatch 10 custom metrics |
| **Trials** | Short-term free use counted from the first time you enable a service | Usually 30–90 days | Time-limited trials for certain services (e.g. Amazon SageMaker, Inspector) |

:::tip[💡 A beginner's mnemonic]
- **12-month free**: like a "welcome gift" — once it expires, charges resume. This is the one **most likely to bite you when it quietly expires**.
- **Always Free**: like a "fixed free lunch every month" — you're only charged once that month's allowance is used up, and it resets next month.
- **Trials**: like a "limited-time trial pass" — the countdown starts the moment you hit enable.
:::

:::warning[⚠️ Allowance numbers change — always confirm with official sources]
The hours, GB, and request counts above are the common allowances at the time of writing; AWS can adjust them at any time. **Before you use anything, always rely on the latest figures published on the [AWS Free Tier official page](https://aws.amazon.com/free/)** — don't treat the numbers here as a guarantee. Also note that EC2's 750 hours/month assumes **one** machine running all month; run two at once and you'll burn through the allowance **twice as fast**.
:::

:::warning[🚑 Common traps & misconceptions: the three Free Tier myths]
- **Myth 1: the Free Tier is "free forever."** Wrong. Only the "Always Free" category has no time limit; the one you'll use most, the **12-month free** tier, is a **welcome gift** — the moment it expires, **charges resume**, and AWS **won't phone you to remind you**.
- **Myth 2: inside the Free Tier you can "use anything for free."** Wrong. Even within the Free Tier, every item has a **cap** (e.g. EC2 750 hours/month, S3 5 GB). **Anything over the cap is billed**, and it's usually something you didn't notice had already run out.
- **Myth 3: when the term ends it will "stop things for me automatically."** Wrong. After the 12 months, **resources don't shut down and services don't stop on their own** — they just **quietly switch from free to paid**. That machine you left running won't vanish; it simply starts running the meter.
- **The deadliest wrap-up trap: forget to stop a resource, get charged at month-end.** You finish practicing, close the browser, and walk away — but the machine keeps running in the cloud 24 hours a day. Because billing is settled at month-end, you **won't notice for the whole month**, and by the time the bill arrives the money is spent. This is the single best reason **why you set a billing alert first** — so the system wakes you up while it's still small money.
:::

## The most common "surprise bill" causes for beginners

Knowing where the traps are is how you dodge them. Here are the ones beginners fall into most often:

- **Forgot to stop an EC2 instance**: you spun up a machine to practice, then just closed the browser and walked away — but the machine is still running, **billing 24 hours a day**.
- **Used a service or size outside the free allowance**: the free ones are `t2.micro`/`t3.micro`; if you slip and pick a bigger `t3.large`, or open a service that isn't in the Free Tier at all, you're being charged every minute.
- **Data transfer (traffic) overage**: moving data **out** of AWS to the internet costs money. The free allowance is limited, so heavy downloads or video egress overshoot it easily.
- **Left test resources undeleted**: resources that "**cost money just by existing**" — databases, Elastic IPs, EBS volumes, NAT gateways — keep billing month after month if you forget to delete them after practice.

<Scenario title="Real scenario: Mei's first AWS bill">

Mei, new to AWS, followed a tutorial over the weekend and launched an EC2 instance to practice deploying a website. Halfway through she had to head out, so she just shut her laptop and left. She assumed "closing the browser = turning off the machine," but that `t3.medium` (not the free `micro`) kept running in the cloud, 24 hours a day.

She'd also spun up a NAT gateway to test connectivity and forgot to delete it. Two weeks later the end-of-month bill arrived — **$47**. Mei panicked: "Wasn't I on the Free Tier?"

The problem: **wrong size (outside the free allowance) + forgot to stop the machine + left test resources behind** — three traps in one go. If she'd set up a billing alert from day one, she'd have been notified the day her spend crept past $1, long before the end of the month.

</Scenario>

## 🛠️ Hands-on: set up two safety nets for yourself

This is the heart of this page. Spend ten minutes setting up these two safety nets and you can practice with confidence afterward.

:::info[Do this first: let IAM users see billing]
If you operate directly as the root account, you can skip this. If you use an IAM user, first log in as root and, in account settings, enable **IAM user and role access to Billing information** — otherwise the budget and billing pages below won't open for you.
:::

### Safety net #1: use AWS Budgets to set a monthly cost budget + alert

<Term en="AWS Budgets" desc="A service that sets cost or usage budget thresholds and automatically emails you when you reach or are forecast to exceed them.">AWS Budgets</Term> lets you set a "most I want to spend this month" threshold in advance, and emails you the moment you approach or exceed it. For a beginner, setting the threshold **very low** (say $1) is exactly right — because normal practice should cost you almost nothing, so if you go over, it means "something is off."

1. Log in to the AWS console, click your account name in the top right → go to **Billing and Cost Management**.
2. In the left menu click **Budgets** → click **Create budget**.
3. The **Zero spend budget** template is the simplest; to customize, pick **Cost budget** and set the period to **Monthly**.
4. Set the budget amount — for beginners, enter `1` (dollar), meaning "**alert me the moment I spend more than $1 this month**."
5. Add **alert thresholds**: alert once when actual spend hits `85%`, again at `100%`; it's also worth ticking **Forecasted** for an early heads-up.
6. Enter your email and save. From then on, whenever spend nears the threshold, you'll get a warning in your inbox.

```bash
# (Advanced, optional) Use the CLI to list the budgets under your account
$ aws budgets describe-budgets \
    --account-id YOUR-12-DIGIT-ACCOUNT-ID
```

### Safety net #2: turn on Free Tier usage alerts / billing alerts

A budget watches the **dollar amount**; Free Tier usage alerts watch **how much of your free allowance you've used** — warning you before you exhaust a free allowance and start getting charged. Turn both on and you've got eyes on both amount and usage.

1. On the same **Billing and Cost Management** page, click **Billing preferences** in the left menu.
2. Tick **Receive AWS Free Tier alerts** and enter your email — you'll get a message when a free allowance hits about 85% used.
3. Tick **Receive CloudWatch billing alerts** (enable billing alerts). Only after this does AWS start sending your "estimated charges" to CloudWatch so you can set a billing alarm.
4. (Bonus) In <Term en="Amazon CloudWatch" desc="AWS's monitoring service; you can set alarms on all kinds of metrics.">CloudWatch</Term> → **Alarms**, use the `EstimatedCharges` metric to set an "alert me when I go over $X" alarm as a third layer of insurance.

:::tip[💡 Why do you need both?]
**Budgets watches the amount; Free Tier alerts watch usage** — different angles that complement each other. For example, you might still be under $1 in spend, but your S3 5 GB free allowance is nearly full — in that case the Free Tier alert fires first, letting you act before you're actually charged.
:::

### While you're at it: use Cost Explorer to see where the money went

Once your alerts are set, if you ever do get one, you'll want to know "**which service is costing money?**" That's when you open <Term en="AWS Cost Explorer" desc="A tool for visualizing AWS spend and usage trends, breakable down by service, region, and more.">Cost Explorer</Term>: it charts your spend as a trend line, breakable down by **service, region**, and more, so you can spot "ah, it was that EC2 I forgot to turn off" at a glance. The in-console charting view is free, so use it freely.

<Cost>

**Good news: these two safety nets cost almost nothing themselves.** Each account gets **two free cost/usage budgets** (one zero-spend budget is plenty for a beginner); Free Tier usage alerts, billing alerts, and the Cost Explorer in-console charts are all **free**. What you actually need to watch is the resources you spin up to practice — clean them up when you're done. For fee details, rely on the [official AWS cost management page](https://aws.amazon.com/aws-cost-management/).

</Cost>

## 🏆 Golden rules: delete when done, use your allowances

The two safety nets are "passive alarms," but the best way to save money is to "**proactively not leave a mess**." Remember these two:

1. **Always delete/stop resources you're not using once you finish practicing**: Terminate test EC2 instances, delete test databases, release unused Elastic IPs, delete EBS volumes and snapshots. For some resources, "**Stop**" still incurs storage charges — if you can delete it, deleting is cleanest.
2. **Use the free allowances and pick the right size**: for practice, always choose sizes inside the Free Tier (like `t2.micro`/`t3.micro`), don't slip and launch a big machine; prefer Always Free services (like Lambda) to play with, where the cost is basically zero.

:::warning[🚑 The wrap-up steps beginners forget most]
- **Stop doesn't mean no charge**: after you stop an EC2, the EBS volume attached to it keeps billing; if you're sure you won't use it, **Terminate** it and delete the volume.
- **Idle Elastic IPs cost money too**: an Elastic IP you allocated but didn't attach to a running machine actually gets charged — remember to release it.
- **Check every Region**: resources are per-region, so you might launch a machine in Tokyo but go looking in Virginia. Switch regions and check each one for leftover resources.
:::

## How this connects to the exam

The **Budgets (budget alerts)** and **Cost Explorer (spend visualization)** you just set up by hand are exactly the core tools of the SAA exam's Domain 4, "cost optimization." Exam questions often give you a scenario (e.g. "want an automatic notification when spend exceeds a certain amount," or "want to visually analyze which service costs the most") and ask you to pick the right tool. Having set these up yourself, those terms won't be rote memorization on the exam — you've genuinely used them. When you get to the SAA course, you'll also meet more advanced governance tools like Cost Anomaly Detection and Cost Allocation Tags.

<Refs title="📚 Official docs & further reading">

- [AWS Free Tier official page](https://aws.amazon.com/free/)
- [Managing your costs with AWS Budgets](https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html)
- [Setting up billing alerts and Free Tier usage alerts](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/free-tier-alarms.html)
- [Create a CloudWatch billing alarm](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/monitor_estimated_charges_with_cloudwatch.html)
- [AWS Cost Explorer User Guide](https://docs.aws.amazon.com/cost-management/latest/userguide/ce-what-is.html)

</Refs>

👉 Next: [The Console, CloudShell & CLI](./console-cli.md)
