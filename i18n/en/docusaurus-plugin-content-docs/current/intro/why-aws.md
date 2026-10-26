---
sidebar_position: 1
title: Why do you need AWS?
---

# Why do you need AWS?

Before learning any AWS service, get one thing straight: **why do we actually need it?** A real-life example makes it clearest.

<Analogy title="💡 Analogy: building your own power plant vs. plugging into the grid">

Imagine you want to open a drink shop.

**Before the cloud era**, it was like having to build your own power plant just to open the shop — spend big money on servers, rent a data center, install air conditioning for cooling, hire engineers to watch it 24/7, and crawl out of bed at midnight when a machine breaks.

**With AWS**, it is like plugging straight into the power grid and tap water: **flip the switch and you have power, pay for what you use** — no need to worry about how the power plant works.

</Analogy>

## In practice, AWS solves these real pain points

<Scenario title="Scenario 1: Starting an app without burning a pile of cash upfront">

The traditional way meant spending tens of thousands on servers first — and losing it all if nobody used the app. With AWS, **you swipe a card and spin it up, maybe spending just a few dollars a month**; if it fails, just shut it down — no heartache. This is **Pay-as-you-go**.

</Scenario>

<Scenario title="Scenario 2: Sudden popularity, traffic spikes (like a sale or breaking news)">

Your own data center gets overwhelmed and crashes, and all your customers leave. AWS can **automatically spin up more servers within minutes** to handle the traffic, then scale back down to save money once the surge is over. This is **Scalability** — and it is the core spirit of the SAA exam.

</Scenario>

<Scenario title="Scenario 3: Making it fast for users worldwide">

You are in Taiwan, but you have customers in the US and Japan. AWS has **data centers all over the world**; with a few clicks you can deploy your service locally so users everywhere get a fast connection. Do it yourself? Just renting overseas data centers would wear you out.

</Scenario>

:::note[In one sentence]
AWS turns "**the hassle of running an entire IT data center**" into "**using it like electricity and water: it's just there, and you pay the bill by usage**". You just focus on your business or product; broken hardware or a data-center fire is AWS's problem.
:::

## Compared to the alternatives, where does AWS win, and what are the tradeoffs?

"Going to the cloud" is not just AWS — there is Azure, Google Cloud, and even "just buy your own machines and self-host". A quick comparison:

- **Versus self-hosting**: no huge upfront spend on hardware, no data center, no ops staff to feed — **just turn it on and pay for what you use**. But for very large, steady, predictable workloads, the **unit cost** of self-hosting can actually come out lower. That is the tradeoff.
- **Versus Azure / Google Cloud**: the core concepts are much the same across all three (compute, storage, networking, scalability). AWS's edge is **the widest range of services, the biggest market share and community, and the easiest-to-find tutorials and examples**; the downside is **so many options that beginners get lost**.
- **The shared tradeoff**: the cloud saves you the hardware and ops headaches, but in return **you have to read the bill and control costs**. Pick the wrong service or forget to turn something off, and the bill will startle you.

For getting certified, starting with AWS is the most practical move: the concepts (elasticity, availability, cost optimization) are really shared across providers, so moving to another one later is not hard.

## What does this have to do with the exam?

SAA tests you as a **Solutions Architect**. The job of this role is to help a company decide **how to cleverly combine these AWS services** to be stable, fast, and cost-effective.

Once you understand "why use it", every service that follows will make sense as a solution to a problem — instead of rote memorization.

:::warning[🚑 Common misconceptions]
These are the three myths newcomers most often hold. Clear them up before going further:

- **"The cloud is always cheapest"**: the cloud saves you the big upfront spend and the ops staff — it does **not** guarantee the lowest total bill. Pick the wrong service, forget to shut something down, or force a high-elasticity plan onto steady traffic, and it gets more expensive. Cheap only holds when **you control costs**.
- **"Learning AWS locks you into one vendor"**: the core concepts (scalability, high availability, cost optimization) are shared across providers, so moving to Azure or Google Cloud later is a low bar. What locks you in is usually not the concepts but **over-relying on a few proprietary services without any abstraction** — that is an architecture choice, not a fault of learning AWS.
- **"A certificate means you can build it"**: a certificate proves you **understand the concepts and can choose the right service**, but real skill still comes from **building it yourself and hitting the pitfalls**. That is why every article here comes with hands-on steps; the certificate is the map, doing it is the actual walk.
:::

👉 Next: [What exactly is the cloud?](./what-is-cloud.md)
