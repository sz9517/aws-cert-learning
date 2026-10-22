---
sidebar_position: 2
title: "Cloud Concepts"
---

# Cloud Concepts: Why Is Everyone Moving to the Cloud?

> This is the first domain of CLF (Domain 1, 24% of the exam). This part isn't about building systems by hand — it's about understanding the **benefits and value of the cloud**. Expect lots of concept questions, so nailing this page gets you halfway there.

<Analogy title="☕ Analogy: Opening Your Own Cafe vs. a Spot in the Food Court">

- **On-premises** = renting a storefront for your own cafe: you pay upfront for the fit-out, utilities, and furniture, and you owe rent whether business is good or bad.
- **Cloud** = a stall in a food court: utilities and furniture are already there, you **pay for what you use**, you can expand instantly when crowds surge, and closing down costs you nothing.

</Analogy>

## The Six Advantages of Cloud (a Favorite on the Exam)

This is AWS's official list of the <Term en="Six Advantages of Cloud Computing" desc="AWS's official summary of the six benefits of adopting the cloud — almost guaranteed to appear on CLF.">six advantages of cloud computing</Term>. Treat it as a checklist worth memorizing.

| Advantage | In Plain Terms |
| --- | --- |
| **Trade upfront capital expense for variable expense** | No huge upfront purchase of servers (<Term en="Capital Expenditure" desc="A large, one-time upfront investment in hardware and data centers.">CapEx</Term>); instead you pay for what you use as an ongoing cost (<Term en="Operating Expenditure" desc="Recurring costs that scale with usage, like a utility bill.">OpEx</Term>). |
| **Benefit from massive economies of scale** | AWS serves millions of customers worldwide, so its buying power is enormous and costs are spread out — meaning lower prices than going it alone. |
| **Stop guessing capacity** | You no longer have to guess how many users you'll get before buying hardware. Provision exactly what you need and adjust anytime. |
| **Increase speed and agility** | Need a new server? It's ready in minutes instead of weeks of procurement and setup, so your ideas ship faster. |
| **Stop spending money running data centers** | No more renting data centers, cooling them, and paying staff to watch machines around the clock. Put that money and energy into the business that actually makes money. |
| **Go global in minutes** | With a few clicks you can deploy to data centers around the world, so users everywhere get a fast, smooth experience. |

:::note[The One-Line Takeaway]
The cloud turns "**invest a large sum upfront and run your own data center**" into "**spin up on demand and pay by the bill**." As long as you can recognize and tell these six apart, the CLF concept questions are in the bag.
:::

## The Three Cloud Deployment Models

Deployment models are about **where your system actually lives**. CLF expects you to tell the three apart and know when each fits.

| Model | What It Is | When to Use It |
| --- | --- | --- |
| **Cloud** | The whole system is built in the cloud, with no own data center | Startups and new projects that want full cloud flexibility and no maintenance |
| **Hybrid** | Part in the cloud, part kept in your own data center, connected together | When regulations or legacy systems are tied to on-premises but you want to migrate the rest gradually |
| **On-Premises** | You buy all the hardware and run it in your own data center (also called a private cloud) | When compliance or security rules are strict and data cannot leave the building |

<Scenario title="Scenario: A Traditional Bank Moving to the Cloud">

The bank's core banking system is bound by regulation, so its data must stay in the bank's own data center. But its new mobile app and marketing campaign sites want the cloud's elastic scaling. The sensible choice here is **Hybrid**: keep the core on-premises, move customer-facing services to the cloud, and connect the two securely.

</Scenario>

## Cloud Economics and TCO

<Term en="Pay-as-you-go" desc="Pay only for what you use, with no contracts and no upfront buyout.">Pay-as-you-go</Term> is the core of how the cloud saves money, but the exam likes to ask about a more complete idea: **total cost of ownership**.

<Term en="Total Cost of Ownership" desc="The sum of every cost of an asset from purchase through operation and retirement — not just the purchase price.">TCO (Total Cost of Ownership)</Term> means that when you work out what a system costs, you **can't just look at the price of the machines**. You also add in data center rent, electricity, cooling, networking, operations staff, and hardware refreshes.

<Analogy title="🚗 Analogy: The Real Cost of Owning a Car">

Buying a car doesn't end at the sticker price — there's fuel, servicing, insurance, parking, and depreciation. All of those together are the true cost of owning the car, which is the idea behind TCO. The "hidden costs" of running your own data center are often far higher than they first appear.

</Analogy>

:::info[Why Is the Cloud Usually Cheaper?]
On-premises means **paying a large sum upfront and keeping a whole data center running**, and you often buy too much and leave it idle. The cloud is pay-as-you-go, needs no data center of your own, and hardware refreshes are AWS's problem. Once you fold all those hidden costs into TCO, it usually works out cheaper over the long run.
:::

## The Six Pillars of Well-Architected

AWS uses the <Term en="Well-Architected Framework" desc="AWS's framework for judging how well a cloud system is designed, across six dimensions.">Well-Architected Framework</Term> to judge how well a cloud system is built, and it has **six pillars**. At the CLF level you don't need the details — just **know there are six and recognize their names**.

| Pillar | In Plain Terms |
| --- | --- |
| **Operational Excellence** | The system runs smoothly and keeps improving |
| **Security** | Protects data, systems, and assets |
| **Reliability** | Recovers from failures and is there when needed |
| **Performance Efficiency** | Uses the right resources and runs fast and efficiently |
| **Cost Optimization** | Spends where it counts, without waste |
| **Sustainability** | Reduces environmental impact and saves energy |

:::tip[💡 Common CLF Exam Points]
This domain loves **concept questions**, most commonly:
- **The benefits of the cloud** (the six advantages, especially "stop guessing capacity" and "go global in minutes")
- **CapEx vs. OpEx** (trading upfront capital expense for a variable expense)
- **Elasticity and agility** (spin up on demand, pay for what you use)

When a question asks about "the benefits of adopting the cloud" or "why it's cheaper than on-premises," the answer almost always points to these.
:::

<Refs title="📚 Official docs & further reading">

- [AWS Official: Six Advantages of Cloud Computing](https://docs.aws.amazon.com/whitepapers/latest/aws-overview/six-advantages-of-cloud-computing.html)
- [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
- [AWS Cloud Economics and TCO](https://aws.amazon.com/economics/)

</Refs>

👉 Next domain: [Security & Compliance](./security-compliance.md)
