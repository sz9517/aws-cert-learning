---
sidebar_position: 5
title: "The Well-Architected Framework: 6 Pillars"
---

# Well-Architected: how AWS scores whether your architecture is "built well"

> This page ties all the later SAA content into one map. By the end you'll know what a "good architecture" is actually aiming for, and where each exam domain sits on that map.

## Why do we need a set of "architecture guidelines"?

<Analogy title="🏠 Analogy: building a house needs a building code, not just winging it">

If you build a house with no rules at all, the walls might come out crooked, there's no earthquake reinforcement, the wiring is a mess, and it leaks the first time it rains — you only discover the problems after you move in.

That's why there's a **building code**: how deep the foundation must be, how thick the rebar, how to lay out the escape routes. Follow it and the house turns out **safe, durable, comfortable to live in, and not a waste of money**.

Building a cloud system is the same. You can stitch services together until it "works", but can it **handle a traffic surge, fend off attackers, keep the bill under control, and recover when something breaks**? You need a set of guidelines to check against — and that's the **Well-Architected Framework**.

</Analogy>

## What is the Well-Architected Framework?

The **Well-Architected Framework** is a set of guidelines for "**what counts as a good architecture**", distilled by AWS from a huge amount of real-world experience.

It breaks "good architecture" into **six dimensions (called "pillars")**, each with a list of design principles and review questions, so you can inspect your system systematically instead of relying on gut feeling.

:::note[💬 One-sentence framing]
Well-Architected isn't a service you go and "turn on" — it's a **thinking checklist**. The exam asks you "in this scenario, which approach best follows well-architected principles", so knowing what each of the six pillars cares about gives you direction when answering.
:::

## The six pillars, one by one

| Pillar | In plain words: what it cares about | A one-line example |
| --- | --- | --- |
| **Operational Excellence** | How easy the system is to **run, change, and troubleshoot when something goes wrong** | Deploy via code, keep logs, and automatically page the on-call person when a midnight error hits |
| **Security** | **Who can touch the data, whether it's encrypted, and whether attacks are blocked** | Give staff only the least privilege they need (IAM), and store DB passwords in a vault instead of hard-coding them |
| **Reliability** | **Whether it can self-recover when broken, and hold up when traffic grows** | When one server dies, traffic automatically shifts to another and users notice nothing |
| **Performance Efficiency** | **Whether you picked the right tool, run fast enough, and waste no resources** | Cache images on a global CDN so users everywhere load the page quickly |
| **Cost Optimization** | **Whether you're spending wastefully, and turning off unused resources** | Automatically shut down idle servers off-peak, and only spin them up when needed |
| **Sustainability** | **Hitting your goal with the least compute, to reduce environmental impact** | Choose more energy-efficient instance types and schedule work to high-utilization windows to cut the carbon footprint |

<Scenario title="Scenario: applying all six pillars to the same shopping site">

For one shopping site, each pillar asks you a different question:
**Operational Excellence** asks "do you have to move files by hand to ship a new feature?", **Security** asks "is the card data encrypted?", **Reliability** asks "what happens if it crashes on Black Friday?", **Performance Efficiency** asks "how many seconds does the homepage take to load?", **Cost Optimization** asks "is the server burning money at 3 a.m. when nobody's shopping?", and **Sustainability** asks "could the same traffic be carried in a more energy-efficient way?"

You'll notice: a truly good architecture has a good answer to **all six** of these questions at once.

</Scenario>

:::tip[💡 Exam key point: watch for the trade-off]
The six pillars often **pull against each other**: making something more reliable (adding standby servers) usually makes it cost more. SAA questions love testing this trade-off — if a question stresses "**lowest cost**", lean toward cost; if it stresses "**zero downtime**", lean toward reliability. Spotting which pillar the question cares about is the key to answering correctly.
:::

## Key mapping: the six pillars ↔ the four SAA exam domains

This part is hugely important for beginners — it lets you understand the entire SAA exam outline at a glance:

| Well-Architected pillar | Roughly maps to the SAA exam domain |
| --- | --- |
| Security | **Domain 1: Design Secure Architectures** |
| Reliability, resilience | **Domain 2: Design Resilient Architectures** |
| Performance Efficiency | **Domain 3: Design High-Performing Architectures** |
| Cost Optimization | **Domain 4: Design Cost-Optimized Architectures** |
| Operational Excellence, Sustainability | **Cut across everything**: no single domain, but the ideas are scattered throughout the questions |

:::info[📌 So how should you read this site?]
The four SAA domains that follow are really just walking you through the four most-tested pillars — security, reliability, performance, and cost — one at a time until you've mastered each. Keep this mapping table in mind now, and for every page ahead you'll know "which pillar this is reinforcing".
:::

## While you're here: the AWS Well-Architected Tool

The **AWS Well-Architected Tool** is a **free** tool inside the AWS console that gives your architecture a "health check".

It's simple to use: you create a workload (one of your systems) in it, and the tool **walks you through a series of questions, pillar by pillar** (e.g. "have you built redundancy for your critical components?"). After you answer honestly, it lists your **high-risk items** and **improvement suggestions** — like having a senior architect do a free check-up for you.

<Scenario title="In practice: run a health check before going live">

You've just finished a system and you're about to launch, but you're not quite sure whether you missed something. Open the Well-Architected Tool and run a pass — it might remind you that "your database has no automatic backups configured" or "this bucket is publicly exposed". Catching those *before* something goes wrong beats getting dragged out of bed at midnight to fight a fire.

</Scenario>

<Refs title="📚 Official docs & further reading">

- [AWS Well-Architected Framework (official overview)](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
- [The six pillars](https://aws.amazon.com/architecture/well-architected/)
- [AWS Well-Architected Tool User Guide](https://docs.aws.amazon.com/wellarchitected/latest/userguide/intro.html)

</Refs>

👉 Next: [AWS Service Map: Core Services at a Glance](./service-map.md)
