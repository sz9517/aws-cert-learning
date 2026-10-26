---
sidebar_position: 4
title: "The Shared Responsibility Model"
---

# The Shared Responsibility Model: What AWS Handles vs. What You Handle

In the cloud, security isn't "all on AWS" and it isn't "all dumped on you" either — **each side handles its own half.** Not knowing where that line sits is the single most common starting point for data breaches. This page draws that line in the plainest way possible.

## Why figure out "who's responsible for what" first?

<Analogy title="🏠 Analogy: renting an apartment, where landlord and tenant each handle their own part">

Imagine you rent a studio apartment.

- **The landlord (= AWS)** is responsible for the **building itself**: whether the structure is sound, the plumbing and wiring, the front-door lock, the building's security guards — even the plot of land it sits on. If any of that breaks, you call the landlord.
- **The tenant (= you)** is responsible for **what happens inside**: whether you locked your doors and windows on the way out, whether you put valuables in the safe, whether you let a stranger in. No matter how good the landlord's front-door lock is, if you forget to lock your own door and get robbed, that's not the landlord's fault.

The cloud works exactly the same way: **AWS builds the building to be sturdy and secure, but "whether you locked your own door" is on you.**

</Analogy>

Once you understand this line, you know which side to check when something goes wrong, and where to spend your effort day to day. This is exactly what AWS's official docs open with — the **<Term en="Shared Responsibility Model" desc="The framework splitting security duties between AWS and the customer: AWS handles the underlying cloud, the customer handles what they put into it.">Shared Responsibility Model</Term>**.

:::info[🤔 Why create a whole "division of duties" model at all?]
Because the scariest failure mode in security is **both sides assuming the other will handle it — so nobody does.** The whole point of this model is to **hand each task to "whichever side is best placed to own it":**

- Things like **data-center security, hardware replacement, and the virtualization layer** need global scale, round-the-clock teams, and huge investment. Letting AWS do them is far sturdier and cheaper than building your own data center — you can't touch them, and you shouldn't have to worry about them.
- Things like **your data, who can access it, and whether to encrypt it** depend on knowledge only you have ("how important is this to me?"). AWS can't make those calls for you — only you can.

Splitting the responsibility **clearly and in writing, up front** keeps the two sides from pointing fingers at each other, and means that when something goes wrong you can tell at a glance which side dropped the ball. It isn't about dodging responsibility — it's about letting "whoever understands and is best equipped" handle each risk.
:::

## The core: one sentence to split the two sides

| Who | Responsible for | In plain words |
| --- | --- | --- |
| **AWS** | Security **OF** the cloud | The one who built the house and maintains the foundation |
| **Customer (you)** | Security **IN** the cloud | The one who lives in the house and has to lock their own door |

**AWS is responsible for "security OF the cloud"** — the underlying layers you can't touch or manage:

- Physical **data centers** worldwide: access control, security guards, fire suppression, power redundancy
- **Hardware** maintenance and replacement (servers, disks, network gear)
- The underlying **network** infrastructure
- The **virtualization layer** (the software that lets one physical machine run many virtual ones)

**You, the customer, are responsible for "security IN the cloud"** — everything you put in and configure:

- Your **data** itself (the most important thing!)
- **IAM permissions**: who can touch which resources (remember the "locks and keys" system from the last page?)
- **Patching** the operating system (**OS**) — depending on the service (see the next section)
- **Network configuration**: security groups (<Term en="Security Group" desc="AWS's virtual firewall, controlling traffic in and out of a server.">Security Group</Term>), which ports are exposed
- Whether to enable **encryption**, and how you manage the keys

:::note[In one sentence]
**AWS handles "the cloud itself"; you handle "what you put into the cloud."** A secure building doesn't make the things you leave inside it automatically secure.
:::

## The key concept: the responsibility line "slides"

This is the part of the model that's most often overlooked yet most often tested: **how much you have to handle depends on which type of service you use.** The more "fully managed" the service, the more AWS handles for you, and the less you have to worry about.

<Scenario title="Scenario: run the same website on different services, and your responsibility changes a lot">

- Build it yourself on **EC2**: the landlord rents you a **bare shell** — fit-out, furniture, and locking the door are all on you.
- Use **S3 / RDS**: a **furnished studio** — the landlord handles a lot more, but you still lock the door and stow your valuables.
- Use **Lambda**: like **staying at a hotel** — bed linens, security, fire safety are all taken care of; you basically just mind your own luggage (your code and permissions).

</Scenario>

| Service type | Example | Who patches the OS | What you mainly handle |
| --- | --- | --- | --- |
| Rent-your-own machine (IaaS) | **EC2** | **You** | OS patching, security groups, installed software, data, permissions |
| Managed service (PaaS-leaning) | **S3, RDS** | **AWS** (underlying OS, DB engine) | Data, access permissions, encryption options, not making it public |
| Fully managed / serverless | **Lambda**, etc. | **AWS, entirely** | Basically just **your code** and **IAM permissions** |

:::tip[💡 Exam key point]
When a question describes a service, first ask yourself: "**Whose job is OS patching?**"
- **EC2** → patching and updates are the **customer's** responsibility (the most commonly tested trap; many people wrongly assume AWS patches it for them).
- **RDS, S3, Lambda** → the underlying OS and runtime are handled by **AWS**.

The line slides with the service — that's the core judgment SAA wants to test.
:::

## The most common beginner misconception

:::warning[🚑 "Once it's in the cloud, it's automatically secure" is wrong]
Many people assume that throwing something onto AWS makes it bulletproof. The truth: **the vast majority of cloud data breaches come from misconfiguration on the "customer side,"** not from AWS being breached.

The classic disaster: an **S3 bucket accidentally set to "public,"** exposing an entire set of customer data to the whole world's search results. AWS builds the warehouse to be impenetrable, but if **you leave your own door wide open**, AWS can't save you. This is the best cautionary example of why "security IN the cloud" is **your** responsibility.
:::

:::warning[🚑 The lines people get wrong most often]
For beginners the trap isn't "not knowing the model exists" — it's "thinking the line sits somewhere else":

- **"Security in the cloud is entirely AWS's job."** → Wrong. AWS only guarantees the "underlying cloud." **Everything you put in and configure — data, permissions, whether it's public — is your responsibility.** This is the biggest misunderstanding, and the real cause of the vast majority of breaches.
- **"AWS patches the operating system (OS) on my EC2 instance automatically."** → Wrong. Using EC2 means you rented a **machine**; the OS updates, security patches, and installed software on it are **all on you (the customer)**. AWS only handles the hardware and virtualization layer underneath. This is the exam's favorite trap.
- **"S3 / RDS / Lambda are fully managed, so I don't have to manage anything."** → Half right, half wrong. Look at the line in two layers: the **underlying layer** (OS, database engine, runtime, patching) is indeed handled by **AWS**; but **the data you put in, access permissions, whether to encrypt, and whether it's left public** are always **your** responsibility. The common disasters (like a public S3 leak) all land on "your half" — not AWS's.

One line to remember: **the more managed the underlying layer, the more AWS handles; but the line around "your data and configuration" stays on your side from start to finish.** (In plain terms: AWS keeps making the house fancier, but what's inside is always yours to look after.)
:::

## How this connects to SAA

The Shared Responsibility Model is the **underlying mindset** for the SAA exam's **Security domain**. The exam won't just ask for a definition — it hides the model inside scenario questions:

- "How do you ensure the OS on an EC2 instance has the latest patches?" — recognize this is a **customer responsibility** first, and the answer follows.
- "How do you prevent an S3 data leak?" — it's testing whether you've done "security IN the cloud" right (block public access, enable encryption, use IAM).

**Internalize this line first, and every security question gives you something to reason from — instead of memorizing answers.**

## 🛠️ Checklist: things you, the customer, must do yourself

These all fall under "security IN the cloud." AWS won't do them for you, but every item is hard-won basic hygiene:

1. **Enable <Term en="Multi-Factor Authentication" desc="On top of a password, login also requires a one-time code from your phone, so a stolen password alone can't get in.">MFA</Term> on the Root user and all IAM Users** — one extra phone check means a stolen password still can't get in.
2. **Follow least privilege** — grant only just-enough permissions; don't hand out `AdministratorAccess` for convenience.
3. **Turn on encryption** — encrypt data both at rest and in transit.
4. **Never set an S3 bucket to public** unless you are 100% sure it's a static website meant for the whole world.
5. **Never hard-code access keys in your code or push them to GitHub** — use an IAM Role instead (remember the last page?).
6. **Regularly review who has which permissions** — disable departed employees' access and unused keys promptly.

:::note[The mindset]
Think of this checklist as "what to do on day one in a new home": change the locks, install a camera, lock important documents in the safe. AWS has handed you the house — whether you lock the door from here is on you.
:::

<Refs title="📚 Official docs & further reading">

- [AWS: Shared Responsibility Model](https://aws.amazon.com/compliance/shared-responsibility-model/)
- [AWS: Security Pillar overview (best practices)](https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/welcome.html)
- [AWS: Blocking public access to your S3 storage](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html)

</Refs>

👉 Next: [The Well-Architected Framework: 6 Pillars](./well-architected.md)
