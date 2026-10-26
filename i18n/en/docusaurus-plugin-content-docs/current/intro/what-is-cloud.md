---
sidebar_position: 2
title: What exactly is the cloud?
---

# What exactly is the cloud?

"The cloud" sounds mysterious, but the idea is simple:

> **Instead of putting computers (servers) in your own office, you rent computers that someone else (like AWS) has already built, and use them over the internet.**

You use their compute, storage, and database power over the network, <Term desc="Pay for what you use, billed by usage like a utility bill — no big upfront purchase.">pay by usage</Term>, and never have to buy hardware yourself.

<Analogy title="🏠 Analogy: buying a house vs. renting">

- **Running your own data center** = buying a house: a huge one-time cost, you handle all the repairs, and moving is a pain.
- **Using the cloud** = renting: monthly rent, the landlord fixes what breaks, and you can upsize whenever you want.

</Analogy>

## Three cloud service models (exam material)

| Model | Full name | Plain meaning | Analogy |
| --- | --- | --- | --- |
| **IaaS** | Infrastructure as a Service | Rent the "infrastructure", install software yourself | Rent an empty room, buy your own furniture |
| **PaaS** | Platform as a Service | Rent the "platform", you only write code | Rent a furnished apartment, just move in |
| **SaaS** | Software as a Service | Use ready-made "software" directly | Stay at a hotel, everything is taken care of |

:::note[How does this relate to SAA?]
SAA mostly deals with **IaaS / PaaS** level services (like <Term en="Elastic Compute Cloud" desc="A cloud server you rent on AWS.">EC2</Term> and <Term en="Simple Storage Service" desc="AWS's cloud file warehouse.">S3</Term>). Knowing the difference between these three models keeps you calm when related questions come up.
:::

## Why use the cloud? (vs. running your own data center)

Running your own data center means buying racks of servers and keeping them in your office. It sounds like you are in control, but the problems are:

- **A huge upfront spend**: before you earn a cent, you have to buy all the hardware you *might* need for the next three years, with your money locked up in it.
- **Guess wrong and you lose either way**: buy too much and it sits idle; buy too little and you crash during peak season, with new machines arriving too late to help.
- **You carry all the operations**: cooling, power, failed disks, OS updates, 3 a.m. alarms — someone has to mind all of it.
- **Scaling is slow**: spinning up 10 more machines means purchasing, shipping, and installing over weeks; in the cloud it takes a few clicks and a few minutes.

The cloud turns those pain points into: **pay for what you use, get as much as you need instantly, and the provider swaps out broken hardware.** For startups, spiky workloads, or teams that want to experiment fast, that matters a lot — it changes "buying assets" into "paying monthly rent," freeing up time and money for what actually counts (building the product, serving customers).

<Scenario title="Real scenario: 10x traffic spike on a sale day">

Traffic on a big sale day can be 10x a normal day. To survive that one day, a self-run data center has to keep 10x the servers running all year (idle for 364 days). With the cloud you run small day to day, scale up before the rush, and shrink back afterward — paying only for the few days you truly needed it. This "scale with demand" is the most direct benefit of the cloud.

</Scenario>

## How to tell IaaS / PaaS / SaaS apart, and when to use each

The difference between the three models is really **"which parts you manage vs. which parts the provider manages for you."** The further down you go, the less you manage (less work), but the less you can customize.

<div className="flow"><div className="flow-node">IaaS<br/>you manage most</div><div className="flow-arrow">→</div><div className="flow-node">PaaS<br/>in between</div><div className="flow-arrow">→</div><div className="flow-node">SaaS<br/>you manage least</div></div>

| Model | What you manage | What the provider manages | When to pick it |
| --- | --- | --- | --- |
| **IaaS** | OS, software, app, data | Hardware, network, data center | You want maximum flexibility, a specific environment, or to lift an old system to the cloud |
| **PaaS** | Just your app and data | Even the OS and runtime are included | You just want to write code and not touch server maintenance |
| **SaaS** | Almost nothing (just accounts and data settings) | Everything | You want a ready-to-use tool (email, docs, help desk) |

<Analogy title="🍜 Analogy: you want a bowl of noodles">

- **IaaS** = buy groceries and cook at home: ingredients and pots are provided, but heat and seasoning are on you (most flexible, most effort).
- **PaaS** = a meal kit: open it, drop it in the pan, no prep needed.
- **SaaS** = order a bowl at the noodle shop: it is served ready to eat, nothing for you to handle.

</Analogy>

:::warning[🚑 Common pitfalls & misconceptions]

- **Assuming the cloud is always cheaper**: for short-term, small-scale, or "turned it on and forgot to turn it off" cases, a cloud bill can actually beat the cost of self-hosting. The cloud saves you on upfront investment and flexibility — it does not guarantee the lowest total cost. Misuse it, leave it running, or pick the wrong size, and it burns money just the same.
- **Assuming moving to the cloud means no more ops or security work**: the cloud is a *shared responsibility*. The provider handles the data center and the underlying hardware, but **your OS updates, account permissions, data encryption, and not leaking your configuration** are still your job (especially with IaaS). Going to the cloud is not passing the buck.
- **Mixing up IaaS / PaaS / SaaS**: use the mnemonic — **I** = Infrastructure (rent the machine, install it yourself), **P** = Platform (rent the platform, just write code), **S** = Software (rent ready-made software, just use it). Exams often separate them by asking "who manages the OS?": you manage the OS = IaaS; you do not manage the OS but you write code = PaaS; you do not even write code = SaaS.

:::

👉 Ready? On to your first certification: [SAA Exam Info](../saa/exam-info.md)
