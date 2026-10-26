---
sidebar_position: 3
title: "Security & Compliance"
---

# Security & Compliance: This Domain Is a Full 30% of CLF

Security and compliance is the **highest-weighted** domain on the CLF exam (about 30%), but don't let that scare you. Almost everything here tests **concepts**, not hands-on configuration or policy code. Get clear on just a few things — who's responsible for what, how to protect your account, and how data gets encrypted — and the points come easily. This page walks you through it all in plain language.

## Shared Responsibility Model: AWS Secures the Cloud, You Secure What's in It

This is the **foundational idea** of the whole domain, and CLF loves to test it. Remember it in one line:

> **AWS is responsible for "Security OF the Cloud," and you are responsible for "Security IN the Cloud."**

<Analogy title="🏠 Everyday analogy: renting an apartment, landlord and tenant each cover their own part">

- The **landlord (= AWS)** handles "the building itself": foundations, plumbing, the main door lock, security guards.
- The **tenant (= you)** handles "what's inside": locking the door when you leave, putting valuables in a safe, deciding who you let in.

No matter how securely the landlord built the place, if you forget to lock your own door and get robbed, that's on you. The cloud works exactly the same way.

</Analogy>

:::info[🤔 Why does a "shared responsibility" model even exist?]
Many people's first reaction is: "I'm paying AWS, so shouldn't security be entirely their job?" That's exactly the misconception this model is meant to clear up. The reason is simple:

- **Some things only AWS can do, and you can't touch them**: data center access, server hardware, the underlying network, the virtualization layer. You can't even see these, so only AWS can be responsible for them.
- **Some things only you know, and AWS shouldn't touch**: which data goes to whom, whether your S3 bucket should be public, who gets to use your application. These are **your business decisions**, and it would be worse if AWS configured them for you on its own.

So "shared responsibility" isn't AWS being lazy. It's about **handing each task to the party most able — and most appropriate — to own it**. Once you see this line clearly, you know what to watch yourself and what you can safely leave to AWS, and you'll answer the exam questions correctly too.
:::

| Who | Responsible for | In plain terms |
| --- | --- | --- |
| **AWS** | Security OF the Cloud | Physical data centers, hardware, underlying network, virtualization layer |
| **Customer (you)** | Security IN the Cloud | Your data, IAM permissions, network settings, encryption, OS patching (depends on the service) |

### Key point: the responsibility line "slides"

This is the most-overlooked yet most-tested point — **how much you have to cover depends on which type of service you use**. The more fully managed the service, the more AWS covers for you.

| Service type | Example service | Who patches the OS | What you mainly cover |
| --- | --- | --- | --- |
| Rent your own machine | **EC2** | **You** | OS patching, security groups, installed software, data, permissions |
| Managed service | **S3, RDS** | **AWS** (underlying OS, database engine) | Data, access permissions, encryption options, don't make it public |
| Serverless | **Lambda** | **AWS, fully** | Little more than your code and IAM permissions |

:::note[One-line takeaway]
When a question describes a service, first ask yourself: "**Whose job is OS patching?**"
- <Term en="Elastic Compute Cloud" desc="A cloud server you rent on AWS where your programs run.">EC2</Term> → patching is the **customer's** responsibility (the most common trap).
- **RDS, S3, Lambda** → the underlying OS is **AWS's** responsibility.
:::

## IAM Basics: AWS's "Locks and Keys" System

<Term en="Identity and Access Management" desc="Decides who can perform which actions on which AWS resources. It's the foundation of all security, and it's completely free.">IAM</Term> decides "**who**" can perform "**which actions**" on "**which resources**." It's the foundation of all AWS security, and it's **completely free**.

:::info[🤔 Why bother with IAM? Can't everyone just share one password?]
You could, but that's the start of a disaster. Picture it:

- **Everyone shares one set of credentials** → when something goes wrong, you **can't tell who did it**, and a departed employee's password might still work.
- **Everyone uses their own IAM user** → every action is logged, you can shut off one individual, and you can grant each person only "just enough" permissions.

The whole point of IAM is to replace "one master key passed around" with "**each person holding a keycard with exactly the right access, and every entry and exit logged**." That's also why AWS keeps stressing: lock that root master key in a safe, and use IAM users for daily work.
:::

<Analogy title="🏢 Everyday analogy: think of your AWS account as an office building">

- **Root user** = the big boss who built the building, holding the master key (never use it for daily work!)
- **IAM User** = each employee, with their own ID badge
- **IAM Group** = a department (say, Engineering), granted one shared set of permissions
- **IAM Policy** = the permission settings on a keycard (which rooms you can enter, whether you can open the safe)
- **IAM Role** = a temporary visitor pass that expires after use, for services or short-term needs

</Analogy>

| Component | What it is | When to use it |
| --- | --- | --- |
| **User** | A long-term identity for a person or application | Fixed users, such as yourself |
| **Group** | A collection of users, for granting permissions in one go | Multiple members with the same job function |
| **Policy** | A set of rules defining which actions are allowed or denied | To define "what can be done" |
| **Role** | A temporary identity that can be "assumed" | For EC2, Lambda, or cross-account access |

### Three security principles you must remember

- **Protect the root user**: root is the all-powerful account, so **turn on <Term en="Multi-Factor Authentication" desc="Besides a password, logging in also requires a one-time code from your phone, blocking attackers even if your password leaks.">MFA</Term>** and **never use it for daily work** — use an IAM user with just enough permissions instead.
- **Turn on MFA everywhere**: enable MFA for root and all important IAM users. One extra phone check means a stolen password still won't get anyone in.
- **Least privilege**: grant only the permissions actually needed. Don't hand out `AdministratorAccess` just because it's convenient.

<Analogy title="🔑 Everyday analogy: what are MFA and least privilege each defending against?">

- **Why turn on MFA?** A password will eventually get guessed, phished, or leaked. MFA is like your bank asking for a **one-time code on your phone** on top of your card PIN — even if an attacker steals your password, without your phone in hand they still can't get in. **The cost is nearly zero, but the risk it blocks is huge**, which is why AWS makes it the top priority.
- **Why least privilege?** This limits "**how much damage an attacker can do if that one keycard gets stolen**." Giving `AdministratorAccess` to a program that only needs to read S3 is like handing the cleaner a master key to the vault — fine most days, but the moment that key leaks, the whole company is finished. Granting only just-enough permissions keeps the "blast radius" as small as possible when something does go wrong.

</Analogy>

:::warning[🚑 Common pitfalls and misconceptions]
Here are the four most common conceptual mistakes in this domain — and the ones the exam loves to turn into traps:

- **Thinking "once it's on the cloud, security is entirely AWS's job"** → wrong. **The vast majority of cloud data breaches come from misconfiguration on the customer's side** — the classic disaster is leaving an **S3 bucket set to public**, so the whole dataset is searchable by the entire world. AWS builds the warehouse to be rock-solid, but if you leave your own door wide open, AWS can't save you.
- **Using the root user for daily operations** → root is the master key: its permissions can't be narrowed and it can't be switched off. Using it day to day is like leaving the vault key in the lock every day; the moment those credentials leak, the entire account falls. For daily work, use an **IAM user with just-enough permissions** instead.
- **Not turning on MFA** → relying on a password alone means one phishing attempt or leak logs the attacker straight in. **Root and all important IAM users must have MFA enabled** — it's the cheapest move with the biggest payoff.
- **Getting the responsibility line wrong, especially the OS on EC2** → many people assume "the machine is AWS's, so of course AWS patches the OS." **Wrong! On EC2, OS patching, updates, and anti-malware are all YOUR (the customer's) responsibility** — AWS only handles the hardware and virtualization layer beneath it. This is the most classic exam point in this domain, so lock it in: **the OS on EC2 = customer's job; the underlying OS of S3/RDS/Lambda = AWS's job.**
:::

## Encryption Concepts: In Transit and At Rest

Encryption turns data into "gibberish that nobody can read without the key." For CLF you just need to know **two moments**:

- **Encryption in transit**: data is encrypted **while it travels across the network**, so it can't be eavesdropped on along the way. Like mailing a letter in a sealed envelope instead of on a postcard. Usually done with HTTPS/TLS.
- **Encryption at rest**: data is encrypted **while stored on disks, in buckets, or in databases**, so even a stolen drive reveals nothing.

<Analogy title="🔐 Everyday analogy: KMS is the safe that holds your keys">

Encryption needs a "key," but the key itself must be kept safe — otherwise it's like locking the door while leaving the key in the lock. **<Term en="Key Management Service" desc="AWS's key management service: a safe that centrally creates, stores, and controls encryption keys, so you don't have to worry about where keys live.">KMS</Term> (Key Management Service)** is the "safe" where AWS centrally stores and controls these encryption keys for you. You just say "encrypt this data with this key," and KMS handles where the key lives and who can use it.

</Analogy>

:::info[Plain-language summary]
Encryption has two moments: **in transit** (on the road) and **at rest** (sitting still); and **keys are centrally held by the KMS safe**. For CLF, understanding it to this depth is enough.
:::

## A Quick Tour of Security-Related Services

AWS has a whole set of security services. CLF won't ask you how to configure them, but it will ask **what each one does**. Remember each in one line:

| Service | One-line purpose |
| --- | --- |
| **WAF** (Web Application Firewall) | A web application firewall that blocks common web attacks like SQL injection and cross-site scripting |
| **Shield** | Dedicated protection against <Term en="Distributed Denial of Service" desc="An attack that floods your service with huge amounts of traffic to knock it offline.">DDoS</Term> (traffic-flooding) attacks |
| **GuardDuty** | Intelligent threat detection that automatically analyzes logs to spot suspicious or malicious activity |
| **Inspector** | Automatically scans EC2, containers, and more for security vulnerabilities and weaknesses |
| **Security Hub** | Pulls security findings into a single dashboard so you can see your overall security posture at a glance |
| **Macie** | Uses machine learning to automatically find sensitive data in S3 (like personal info or credit card numbers) and alert you |

:::note[Tip: map by keyword]
See "**block attacks**" → think WAF/Shield; see "**find threats, find vulnerabilities**" → think GuardDuty/Inspector; see "**central overview**" → think Security Hub; see "**sensitive personal data in S3**" → think Macie.
:::

:::info[🤔 Why so many separate services? Wouldn't one do?]
Because security isn't "one trick for everything" — **different checkpoints have to block different bad things**. Each service guards one position, and only together do they form a complete line of defense:

- **WAF/Shield stand at the outermost "front door"**: they block bad traffic before it ever reaches your house (WAF blocks application-layer attacks, Shield blocks traffic floods). They exist because **blocking is most effective done as far out front as possible**.
- **GuardDuty/Inspector are "patrol and checkup"**: GuardDuty watches your logs for "is something suspicious happening right now," while Inspector proactively scans "do my machines have known vulnerabilities still unpatched." One looks at **behavior**, the other at **condition** — different angles, so they're two services.
- **Security Hub is the "command center"**: with many services running, alerts scatter everywhere and become impossible to keep up with, so you need one place to **pull every finding into a single dashboard** and see the whole picture at a glance.
- **Macie focuses on "the data itself"**: the others handle attacks and vulnerabilities, but "**is there personal info or credit card numbers sitting in my S3 that shouldn't be there**" is a separate question, needing machine learning to dig through, so it's its own service.

In one line: **they don't overlap, they divide the work**. The exam just wants you to map "scenario keyword" to "the service that owns that checkpoint."
:::

## Compliance: Proving "I Followed the Rules"

**Compliance** means proving your systems meet certain regulations or industry standards. Many industries — finance, healthcare, e-commerce — have mandatory requirements.

- **AWS Artifact**: AWS's "compliance report download center." Here you can **self-serve download** AWS's compliance reports and agreements (such as SOC and ISO reports) to show auditors or customers, proving AWS's underlying infrastructure passed these certifications.
- **Common compliance programs** (conceptual awareness is enough):
  - **ISO**: the International Organization for Standardization's security-management standards (such as ISO 27001).
  - **SOC** (System and Organization Controls): audit reports on a service provider's internal controls.
  - **PCI DSS** (Payment Card Industry Data Security Standard): the security standard you must follow to handle credit card data.
- **Compliance is also part of shared responsibility**: AWS is responsible for getting the **underlying infrastructure** certified (and providing proof via Artifact), but whether **your own application and data configuration** is compliant is still **your responsibility**.

:::tip[💡 Frequent CLF exam points — memorize these for easy marks]
- **Shared responsibility "who covers what"**: AWS secures the cloud, you secure what's in it; the line slides with the service (EC2 → S3/RDS → Lambda), so focus on "who patches the OS."
- **Three things to protect your account**: enable MFA on root and don't use it daily, turn on MFA everywhere, and follow least privilege.
- **AWS Artifact for compliance reports**: if you need to download SOC/ISO and other compliance reports, the answer is Artifact.
:::

<Refs title="📚 Official docs & further reading">

- [AWS: Shared Responsibility Model](https://aws.amazon.com/compliance/shared-responsibility-model/)
- [AWS: IAM security best practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [AWS: Key Management Service (KMS)](https://docs.aws.amazon.com/kms/latest/developerguide/overview.html)
- [AWS: Artifact compliance reports](https://aws.amazon.com/artifact/)
- [AWS: Compliance Programs overview](https://aws.amazon.com/compliance/programs/)

</Refs>

👉 Next domain: [Cloud Technology & Services](./technology-services.md)
