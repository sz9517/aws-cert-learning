---
sidebar_position: 1
title: IAM — Identity and Access Management
---

# IAM: AWS's "locks and keys" system

> This page explains IAM in the plainest way possible. It is one of the most frequently tested topics on the SAA exam.

<Vocab title="📌 Jargon you'll see on this page (fine even if you've never touched AWS)">

- **EC2 (Elastic Compute Cloud)**: a "**rented computer / server**" on AWS. Your website or program runs on it.
- **S3 (Simple Storage Service)**: AWS's "**cloud drive / file warehouse**", used to store images, videos, backups, reports, and more.
- **Credentials / Access Key**: the **password** that proves "who you are and what you're allowed to do". If leaked, others can impersonate your account.

</Vocab>

:::note[💬 Reading tip]
Whenever you see a term with a <Term desc="Like this! Hover over any dotted term (tap on mobile) and a plain explanation pops up.">dotted underline</Term>, hover over it for a plain-language explanation. All terms are also collected in the [Glossary & Services](../../glossary.md).
:::

## IAM in one sentence

**IAM (Identity and Access Management)** decides "**who** (which user/service) can perform **which actions** on **which resources**". It is the foundation of all AWS security, and it is **completely free**.

<Analogy title="🏢 Analogy: think of your AWS account as an office building">

- **Root user** = the big boss who built the building; holds the master key (never use it for daily work!)
- **IAM User** = each employee, with their own ID badge
- **IAM Group** = a department (e.g. "Engineering"); the whole department gets the same set of permissions
- **IAM Policy** = the access-card settings (which rooms you can enter, whether you can open the safe)
- **IAM Role** = a temporary visitor pass that expires automatically; for "services or temporary needs"

</Analogy>

## The four core components

| Component | What it is | When to use |
| --- | --- | --- |
| **User** | A long-term identity for a person or application | A fixed user, e.g. yourself |
| **Group** | A collection of Users, for granting permissions together | Multiple people in the same role |
| **Policy** | Permission rules written in JSON (allow/deny) | Defines "what can be done" |
| **Role** | A temporary-permission identity that can be "assumed" | For EC2, Lambda, or cross-account access |

:::tip[💡 Exam key point]
When a question says "<Term en="Elastic Compute Cloud" desc="A cloud server you rent on AWS; your program runs on it.">EC2</Term> needs to access <Term en="Simple Storage Service" desc="AWS's cloud file warehouse for images, backups, reports, etc.">S3</Term>", the correct answer is almost always "**create an IAM Role and assign it to the EC2**", **not** hard-coding an access key into your program. This is the most commonly tested trap!
:::

## How it works (diagram)

<div className="flow">
  <div className="flow-node">EC2 instance</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">assumes IAM Role</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">gets temporary credentials</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">accesses S3 bucket</div>
</div>

*Diagram: EC2 uses a Role to get temporary credentials to access S3 — no manual key management at any point.*

## Real-world application: it's not just for the exam

<Scenario title="Real scenario: you just joined a startup as an engineer">

Your boss says: "Our order system runs on EC2 and needs to save reports to S3 — but **never leak the company keys**." What do you do? The answer is the IAM Role this page teaches. Let's actually do it once below.

</Scenario>

### 🛠️ Hands-on: create a Role that lets EC2 access S3

1. Log in to the AWS console → type `IAM` in the search bar → open the IAM service
2. In the left menu click **Roles** → top-right **Create role**
3. For trusted entity type choose **AWS service**, for use case choose **EC2** → Next
4. Search for and select the `AmazonS3ReadOnlyAccess` policy → Next
5. Name it `ec2-s3-readonly` → Create role
6. Back in EC2 → select the instance → **Actions › Security › Modify IAM role** → attach the role you just created

Once done, log in to that EC2 and verify with the CLI — **no keys required at all**:

```bash
# List S3 buckets directly; credentials are provided automatically by the Role
$ aws s3 ls
2026-10-16 10:23:01  my-company-reports

# Confirm the current identity is actually "assuming" the Role
$ aws sts get-caller-identity
```

<Cost>

IAM, Roles, and Policies are **completely free** themselves. But this exercise spins up an EC2 (which may incur charges). When you're done, remember to **Terminate** the test EC2, and use a **Free Tier** `t2.micro` to avoid a nasty bill at the end of the month.

</Cost>

:::warning[🚑 Common real-world mistakes]
- **Attached a Role but still getting Access Denied?** Usually the Policy lacks permissions, or the program is still reading an old environment-variable key (environment variables take precedence over the Role).
- **Granting `AdministratorAccess` for convenience?** A big no-no in practice; it violates least privilege, and the damage if compromised is unimaginable.
:::

<Refs title="📚 Official docs & further reading">

- [AWS Docs: What is IAM (IAM User Guide)](https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html)
- [Security best practices in IAM](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)

</Refs>

## Next

- ⚡ Quick review: [Domain 1 Flashcards](./flashcards.md)
- ✍️ Test yourself: [Domain 1 Practice Questions](./quiz.md)
- 📖 Next page: [Data Encryption (KMS)](./kms.md)
