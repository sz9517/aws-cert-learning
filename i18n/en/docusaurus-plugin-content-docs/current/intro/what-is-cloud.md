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

👉 Ready? On to your first certification: [SAA Exam Info](../saa/exam-info.md)
