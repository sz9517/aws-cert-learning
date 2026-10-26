---
sidebar_position: 5
title: "Billing, Pricing & Support"
---

# Billing, Pricing & Support: How AWS Charges You and How It Helps

> This is the smallest of the four CLF domains (**12%**), but it is easy points because the questions are almost all conceptual: how AWS prices things, which tools watch your spending before and after, and who you can turn to when something goes wrong. This page walks you through all three in plain language.

:::note[💬 Reading tip]
Whenever you see a term with a <Term desc="Like this! Hover over any dotted-underlined term (tap on mobile) to see a plain-language explanation.">dotted underline</Term>, hover over it for a plain explanation. Always treat specific numbers as subject to change and defer to the official docs.
:::

## 1. The Three Core Pricing Principles

AWS billing has lots of line items, but only three ideas sit behind all of them. Remember these three and you can reason your way through most pricing questions.

1. **Pay-as-you-go**: You pay only for what you use, like a utility bill. Nothing used means nothing charged, and there is no big upfront purchase. The upside is flexibility with no waste.
2. **Save when you commit (reserve)**: If you are sure you will use something steadily for the long term and are willing to **commit to 1 or 3 years**, AWS gives you a meaningful discount. You trade commitment for a lower price.
3. **The more you use, the less you pay (volume discounts)**: For some services (such as S3 storage), once your usage crosses certain tiers, **the price per unit of the extra usage drops automatically**. Bigger scale means better rates.

:::tip[💡 One-line memory aid]
**Unsure? Pay as you go. Sure? Commit for a discount. Using a lot? It naturally gets cheaper.** Those three lines are the whole spirit of AWS pricing.
:::

<Analogy title="🏢 Why does AWS price this way? Think rent vs. buy">

Imagine your company needs computers to run its business:

- **Building your own data center (the old way)**: You spend a big chunk of money up front on servers, rent space, and hire people to maintain it. That cost burns every month whether you use the machines or not. When traffic is low the machines sit idle and waste money; when it spikes you cannot add machines fast enough.
- **Using AWS (pay-as-you-go)**: It is like a utility bill. The meter runs only when the light is on, and nothing is charged when it is off. No big up-front spend, and no fleet of unused machines to feed. **This is the core money-saving logic of the cloud: trade a large up-front purchase that depreciates on the shelf for paying only for what you use.**

So why do commitment and volume make it even cheaper? From AWS's point of view, **if you are willing to commit long term, AWS can plan its data centers better** (it knows those machines will be used), and it passes the savings back to you as a discount. And the more you use, the bigger AWS's economies of scale, so it can offer a lower unit price. All three principles boil down to one idea: **the more certainty or volume you give AWS, the bigger the discount it gives back.**

</Analogy>

## 2. Compute Pricing Models

The same EC2 <Term en="Instance" desc="A virtual machine you rent. It bills while running; you only stop charges by stopping or terminating it.">instance</Term> can be rented under different payment models, and the savings vary a lot. For CLF you just need to **understand what each model does and when to use it** — you will not be tested on exact discount percentages.

| Model | In plain words | Best for |
| --- | --- | --- |
| **On-Demand** | Pay by the second/hour with no commitment; most flexible and most expensive | Short-term, temporary, or when usage is still uncertain |
| **Reserved Instances (RI)** | Commit to 1 or 3 years in exchange for a clear discount | Long-term, steady, predictable workloads |
| **Savings Plans** | Commit to an hourly dollar amount rather than a specific instance type; more flexible than RIs | Steady long-term use while keeping flexibility across types/regions |
| **Spot** | Use AWS spare capacity at the lowest price, but AWS can reclaim it at any time | Interruptible, fault-tolerant batch or test jobs |
| **Dedicated Host** | A whole physical server reserved just for you | Software licenses tied to physical hardware, or compliance needs for dedicated hardware |

:::tip[💡 How to decide on CLF]
"**Short-term, uncertain**" → On-Demand; "**long-term, steady, save money**" → Reserved Instances or Savings Plans; "**want more flexibility**" → Savings Plans; "**interruptible, cheapest**" → Spot. Just recognize Dedicated Host as "a whole physical machine for you" and that is enough.
:::

## 3. Cost Management Tools

AWS gives you a whole set of free tools so you can **estimate before you spend, review after you spend, and get alerted when you go over**. CLF loves to ask "which tool fits this scenario."

| Tool | Purpose | Why and when to use it |
| --- | --- | --- |
| **AWS Pricing Calculator** | **Before you launch anything**, estimate roughly how much this setup will cost | Use it before budgeting or quoting a proposal, so you get a ballpark figure instead of a nasty surprise after launch |
| **Cost Explorer** | Chart your **past spending** as trends, broken down by service, region, and more | Use it for monthly reconciliation and to answer "where did the money actually go," spotting the biggest spenders at a glance |
| **AWS Budgets** | Set a cost or usage threshold and **get an email alert when you approach or exceed it** | Use it when you worry the bill might blow up — set a threshold and let it watch for you instead of logging in every day |
| **Cost and Usage Report (CUR)** | Export the **most detailed, per-resource, hourly** raw data for deep analysis and auditing | Use it when Cost Explorer charts are not detailed enough and you need to pull data into a spreadsheet or database for deep analysis or auditing |
| **Cost Anomaly Detection** | Use machine learning to **automatically catch unexpected spending spikes** and notify you | Use it when you fear "a sudden spike that no one notices" — no fixed threshold needed; it learns your normal spend and flags anomalies for you |

:::tip[💡 Keyword mapping]
"**Estimate (not used yet)**" → Pricing Calculator; "**review history, visualize**" → Cost Explorer; "**alert when over a threshold**" → Budgets; "**most granular raw detail**" → Cost and Usage Report; "**automatically spot unexpected spikes**" → Cost Anomaly Detection.
:::

<Cost title="💰 Cost reminder">

Almost all of these tools are **free in themselves**: the Pricing Calculator, viewing charts in Cost Explorer in the console, Budgets (every account gets free budgets), and Cost Anomaly Detection cost nothing extra. What actually costs money are the resources you run. So building the habit of "**estimate before, review after, alert when over**" is the real foundation of saving money.

</Cost>

## 4. Account and Billing Governance

Once you have more than one account, you need to manage money and permissions centrally. CLF focuses on two things here: **consolidated billing** and **cost allocation tags**.

### AWS Organizations and Consolidated Billing

<Term en="AWS Organizations" desc="A service for centrally managing multiple AWS accounts, enabling consolidated billing and unified policies.">AWS Organizations</Term> lets you centrally manage multiple AWS accounts under your company, and the most practical feature is **consolidated billing** — all accounts roll up into **one combined bill**. The benefits go beyond convenient payment:

- **Volume discounts combine**: Usage across accounts is **added together**, making it easier to reach the "more usage, lower unit price" tiers, so you save more overall.
- **Shared reservations**: If one account buys Reserved Instances/Savings Plans it does not fully use, **other accounts can share** the leftover discount, so nothing is wasted.

:::tip[💡 Why use consolidated billing? Three benefits at a glance]
Many people think consolidated billing is just "paying together for convenience." Its real value is that it **saves money and is easier to manage**:

1. **Cheaper**: Usage across accounts is **added together**, so you reach the "more usage, lower price" volume tiers faster; unused discounts can be shared across accounts, so nothing is wasted.
2. **Easier to manage**: One combined bill shows the whole company's spend — no logging into each account to reconcile.
3. **Accounts stay isolated**: Only the *billing* is combined; each account's resources and permissions remain separated — you can run **one account for production, one for test** without interference, while still getting the combined discount.

So the moment you have more than one account (almost every company does), consolidated billing is close to a must-have.
:::

### Cost Allocation Tags

<Term en="Cost Allocation Tags" desc="Tags attached to resources that, once activated, let your bill group costs by tag so you can see spending per department or project.">Cost allocation tags</Term> are simply "labels" you attach to resources (for example `department=marketing`, `project=website`). Once activated, your bill and Cost Explorer can **group by tag**, so you can see at a glance "which department or project spent how much," making internal chargeback and tracking easy.

:::info[Details subject to official docs]
Consolidated billing rules for volume discounts and shared reservations may change as services evolve. For how they actually apply, defer to the [AWS Organizations documentation](https://docs.aws.amazon.com/organizations/).
:::

## 5. Support Plans

AWS offers four <Term en="AWS Support Plans" desc="AWS technical support tiers priced by response speed, scope of support, and whether a dedicated Technical Account Manager is included.">support plans</Term>. The differences come down to **response speed and scope of support**, plus a dedicated **Technical Account Manager (TAM)** available only on the top tier.

| Support plan | What it includes | Key difference |
| --- | --- | --- |
| **Basic** | Built in and **free** for every account: customer docs, whitepapers, forums, plus billing questions and service health | No technical support for your issues |
| **Developer** | Can open technical support cases (Email only, business hours) | Good for dev/test; slower response |
| **Business** | 24/7 technical support (phone, Email, chat), full set of Trusted Advisor checks | Good for production; faster response |
| **Enterprise** | Highest support tier, fastest response, and a **dedicated Technical Account Manager (TAM)** | **Only tier with a TAM**; for business-critical workloads |

:::note[What is a TAM?]
A <Term en="Technical Account Manager (TAM)" desc="A dedicated technical account manager assigned to you by AWS to help with architecture advice, cost optimization, and proactive health checks.">TAM (Technical Account Manager)</Term> is a dedicated contact AWS assigns to you, proactively helping with architecture advice, cost reviews, and health checks. **Only the Enterprise plan includes a TAM** — this is a very high-frequency exam point.
:::

### How do you actually choose among the four support plans?

Why are support plans split into four price tiers? Because **how urgently you need help, and how long you can afford to wait, differs for every company**. Someone just learning and experimenting can look things up online when something breaks. But once a live production service goes down, every minute bleeds customers and revenue — and that is when "someone picks up your call 24/7" is worth every penny. AWS's logic is simple: **the faster the response, the broader the support, and the more dedicated attention you need, the more you pay.**

<Analogy title="🏢 Analogy: support plans are like tiers of medical care">

- **Basic (free) = reading public health info online**: Only public docs and forums, no real person looking at *your* problem. Fine for pure learning and free experimenting.
- **Developer = a regular clinic (business hours, messages only)**: You can open cases for technical questions, but it is Email-only, business hours, and replies are slow. Good for **your own dev/test environment** where downtime is not urgent.
- **Business = a 24-hour emergency room (phone included)**: Open around the clock, reachable by phone/Email/chat, much faster response. **The moment you have a production environment actually serving customers, you should move up to this tier** — this is usually a company's first paid threshold.
- **Enterprise = a dedicated family doctor (TAM) proactively checking on you**: Fastest response, plus a **dedicated Technical Account Manager (TAM)** who proactively reviews your architecture, trims costs, and catches risks early. Good for **business-critical workloads where downtime means big money**.

</Analogy>

:::tip[💡 When is it worth upgrading? One-line test]
- **Still learning, personal experiments** → **Basic** is enough; do not waste money.
- **Have a dev/test environment and want to ask questions** → **Developer**.
- **Running production that serves real customers** → move up to **Business** (you need 24/7 and the full Trusted Advisor; this is the most critical step).
- **Business-critical, high cost of downtime, want someone proactively watching for you** → **Enterprise** (the only tier with a TAM).

The deciding factor is not "how big the company is," but "**how high the cost of failure is and how long you can wait**." The higher the stakes and the less you can wait, the more you should move up.
:::

### Trusted Advisor Check Scope by Plan

<Term en="AWS Trusted Advisor" desc="A tool that automatically scans your account and gives best-practice recommendations across cost, performance, security, fault tolerance, and service limits.">Trusted Advisor</Term> automatically runs best-practice health checks on your account (cost, performance, security, fault tolerance, service limits, and more), but **how many checks you can see depends on your support plan**:

- **Basic/Developer**: Only a **small set of core checks** (including some security and service limit items).
- **Business/Enterprise**: Unlock the **full set of Trusted Advisor checks** for the most complete guidance.

:::warning[🚑 Common pitfalls and misconceptions]
This chapter loves to test "misunderstood concepts." Lock these traps in now:

- **No budget alert, so the bill explodes**: The most common pain. Without **Budgets**, AWS will **not** stop you on its own — it has no idea what counts as "too much" for you. You must set the threshold yourself to get an email alert when you go over.
- **Thinking the Free Tier is free forever with no limits**: Very wrong. Most Free Tier offers are **"12 months for new accounts" or a fixed monthly allowance**, and they have **usage caps**. Once you exceed them or they expire, AWS **automatically charges normal rates** without asking first. Remember to shut down resources after practicing.
- **Choosing the wrong support plan**: Two common mistakes — (1) a production service still on free **Basic**, with no one to call when things break; (2) a personal experiment paying for an expensive plan for nothing. Judge by "**the cost of failure and how long you can wait**," not by company size.
- **Assuming Trusted Advisor checks are the same for everyone**: The **set of checks depends on your support plan**! Basic/Developer get only a few core checks; you need **Business or Enterprise** for the full set. Exam questions love to set traps with this.
- **Attributing the TAM to the wrong plan**: A TAM is **only on Enterprise** — not Business, and you cannot buy one separately.
:::

:::tip[💡 Common CLF exam points]
- **Free Tier**: Trial allowances for new accounts; know what is free before you practice.
- **Budgets alerts**: Want to be notified when cost or usage goes over? Use Budgets.
- **Consolidated billing benefits**: Volume discounts combine and reservations are shared — cheaper overall and easier to manage.
- **Which support plan has a TAM**: Only **Enterprise** (dedicated Technical Account Manager).
- **Pricing Calculator**: Use it to **estimate costs before** you launch a service.
:::

:::info[Prices and plan details subject to official docs]
Support plan prices, inclusions, and response times may change at any time. For the actual details, defer to the [AWS Support Plans page](https://aws.amazon.com/premiumsupport/plans/).
:::

<Refs title="📚 Official docs & further reading">

- [AWS pricing principles and cloud economics](https://aws.amazon.com/pricing/)
- [AWS Pricing Calculator](https://calculator.aws/)
- [AWS Cost Management (Cost Explorer / Budgets)](https://aws.amazon.com/aws-cost-management/)
- [AWS Organizations consolidated billing](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_accounts_billing.html)
- [AWS Support Plans comparison](https://aws.amazon.com/premiumsupport/plans/)
- [AWS Trusted Advisor](https://aws.amazon.com/premiumsupport/technology/trusted-advisor/)

</Refs>

👉 Test yourself: [CLF Practice Questions](./clf-quiz.md)
