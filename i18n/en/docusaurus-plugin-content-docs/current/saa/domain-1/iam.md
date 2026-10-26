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

## Why use a Role instead of handing out long-term keys?

This is IAM's most important — and most tested — "why". First, the difference between the two things:

- **Long-term access key**: an `AKIA...` account + secret that is **valid forever** until you manually delete it. It tends to get pasted into code, config files, and environment variables.
- **Role + temporary credentials**: no fixed key. Instead a service (EC2, Lambda, …) **assumes** a role, and AWS issues a set of credentials that **expire in a few hours** and auto-refresh — no human ever touches a key.

<Analogy title="🏢 Analogy: a master key forever vs a day pass that expires">

A long-term key is like a **master key you hand out and never collect back** — an employee leaves, the key is lost, it gets photographed and leaked, and you have no idea, yet it still opens the door. A Role's temporary credential is like a **door pass reissued every morning that expires at night**: even if someone picks it up, it is void in a few hours; when a person leaves, the pass simply stops being issued.

</Analogy>

**Why do it this way (benefits):**

- **No long-lived secret to leak**: temporary credentials expire in hours, so even if they end up in a log or a GitHub commit, an attacker has only a short window. A leaked long-term key means "the door stays open" indefinitely.
- **No key rotation to do yourself**: AWS rotates them in the background; you never write a "rotate keys periodically" process.
- **No secrets in your code**: not a single key line in the program. The SDK fetches credentials automatically from the Role (EC2 from instance metadata, Lambda from its execution role).
- **Clean cross-account / cross-service access**: a role in account A can be assumed by account B, controlled by a **trust policy** — far safer than mailing keys back and forth.

**Drawbacks / costs (being honest):**

- **One extra mental model**: you must understand both "who can assume this role (trust policy)" and "what this role can do (permission policy)". Beginners easily confuse the two directions.
- **Slightly more friction for local dev**: your laptop has no EC2 role, so you fetch temporary credentials via `aws sso login` or a named profile — one step more than just pasting a key.

:::info[🔑 When is a long-term access key actually justified?]
The rule is **prefer a Role; avoid keys**. Cases that genuinely need a long-term key are rare: e.g. an **off-AWS system that cannot assume a role** (on-prem servers, a third-party CI tool with no OIDC federation yet). Even then, prefer **IAM Roles Anywhere** (on-prem) or **OIDC federation** (GitHub Actions, etc.) so you avoid issuing `AKIA` long-term keys. For human users' daily work, use **IAM Identity Center (SSO)** — also temporary credentials.
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

## User vs Group vs Role vs Policy: when to use which?

These four are the easiest to mix up. One sentence: **a Policy is the "permission content"; the other three are "whose identity the permissions hang on".**

| What you want to do | Use | Why (trade-off) |
| --- | --- | --- |
| Give a long-term, fixed person or off-AWS program an identity | **User** | Create a User only when you need a fixed identity that can sign in to the console or hold keys. **Fewer is better** — if SSO or a Role works, do not spam Users. |
| A group of people needs the same set of permissions | **Group** | Attach permissions to the Group; as people join or leave, just add/remove them from the Group instead of editing each one. **Never paste permissions onto each User one by one** — that is an operations nightmare. |
| Let a service, or a temporary / cross-account caller, get permissions | **Role** | Services (EC2, Lambda), cross-account access, and humans signing in via SSO all use a Role to get **temporary credentials** with no long-term key left behind. |
| Define what can actually be done | **Policy** | A Policy is not an identity — it is a JSON rule document that **only takes effect once attached to a User, Group, or Role**. |

<Analogy title="🏢 Analogy: access card vs person vs department vs visitor pass">

- **Policy = the permission list printed on the access card** (which rooms it opens); a list by itself is nobody.
- **User = one fixed employee**; stick the list on their employee badge.
- **Group = a department**; stick the list on the department and everyone in it is covered.
- **Role = a temporary visitor pass**; whoever (matching the trust policy) borrows it is temporarily covered by that list, then hands it back.

</Analogy>

:::tip[💡 Exam key point: keyword mapping]
- Question says "**a service needs to access another service**", "**EC2/Lambda needs permissions**", or "**cross-account**" → almost always a **Role**.
- Question says "**many developers need the same set of permissions**" or "**easy to maintain**" → **Group** (not editing each User).
- Question says "**define which actions are allowed/denied**" → it is talking about the contents of a **Policy**.
:::

## Why least privilege?

**Least privilege** = grant only the permissions "just enough to do the job", no more. This is not fussiness — it is about **containing the blast radius**: once an identity is stolen or a program is compromised, the reach an attacker gets equals the permissions you granted. The broader the grant, the bigger the disaster.

<Analogy title="🏢 Analogy: do not give the cleaner the vault key">

Cleaning only needs the office door card, yet you hand over a master card that also opens the vault, the server room, and finance. The day that card is lost, you lose far more than the office. Least privilege means "**the cleaner gets only the cleaner card**".

</Analogy>

### Managed Policy vs Inline Policy: which one?

Policies can be attached two ways, and both the exam and real work love to compare them:

| Type | What it is | Pros | Cons / when not to use |
| --- | --- | --- | --- |
| **Managed Policy** | A **standalone** policy that can be attached to multiple Users/Groups/Roles at once. Comes as AWS-managed or customer-managed. | **Change once, applies everywhere; reusable; easy to audit**; versioned so you can roll back. **The default choice.** | AWS-managed ones are often **too broad** (e.g. `AmazonS3FullAccess`); using them as production permissions easily over-grants. |
| **Inline Policy** | A policy **embedded directly inside a single** identity; it lives and dies with that identity and cannot be shared. | Guarantees "this permission **belongs only to this one identity**"; delete the identity and the policy vanishes too — no orphans left behind. | **Not reusable, hard to audit centrally**; heavy use scatters permission fragments nobody can manage. Use only when you truly want a one-to-one binding. |

:::tip[💡 Exam key point: managed vs inline]
Default to a **customer-managed Managed Policy** (reusable, manageable, auditable). Use **Inline** only in the few cases where "this permission must exist with, and be deleted with, a single identity". See "apply the same set to many identities, easy to maintain" → Managed; see "this permission must never be misused by another identity, bound to the identity" → Inline.
:::

### Why not use root for daily work?

The **root user** is the "almighty account" created with your email when you opened the account. Its permissions **cannot be limited by IAM and cannot be reduced**. It can change billing, close the account, and delete anything. Using it daily is like carrying the master key everywhere — if it leaks, there is no recovery, and what it does is hard to stop with normal permission mechanisms.

The right practice: **right after creating the account, enable MFA on root and lock it in a drawer**, then use IAM identities (ideally SSO temporary credentials) for daily work. Only the very few operations **only root can do** (closing the account, changing the account name, certain billing settings) warrant pulling it out temporarily.

## Policy evaluation logic: why does an explicit Deny always win?

Many people think "I just attach one more Allow and it will go through", then get blocked anyway. That is because IAM decides whether a request passes by a **fixed order**, in which an **explicit Deny always overrides any Allow**:

<div className="flow">
  <div className="flow-node">Any explicit Deny?</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Yes → denied outright (nothing can save it)</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">No → any explicit Allow?</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Allow it only if there is an Allow; otherwise default deny</div>
</div>

Three plain sentences to remember:

1. **Everything is denied by default** (default deny): anything you did not grant cannot be done.
2. **Only an explicit Allow lets it through**: to be able to do something, some Policy must explicitly Allow it.
3. **A single explicit Deny always blocks it**: no number of Allows can save it. Deny is the final verdict.

<Analogy title="🏢 Analogy: the blocklist has veto power">

Even if you are on ten departments' allow lists at once (ten Allows), if the guard's **blocklist** (one Deny) has your name, you simply do not get in. Deny is a veto.

</Analogy>

:::info[🔑 The practical use of this]
To "**guarantee nobody can do certain actions**" (e.g. forbid deleting the audit-log bucket, forbid launching resources outside allowed regions), use an **explicit Deny** (often via an Organizations SCP). Because Deny overrides every Allow, even if someone is accidentally attached an over-broad Allow, the Deny still blocks them.
:::

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

### 🛠️ Advanced: build a least-privilege Role via CLI (with trust policy)

The console is convenient, but real work (and DVA/IaC) often uses the CLI to keep the two JSON documents separate: a **trust policy** (who can assume) plus a **permission policy** (what it can do). This also makes the two directions above crystal clear.

```bash
# 1) Trust policy: only the EC2 service may assume this role (this is "who can borrow it")
cat > trust-policy.json <<'JSON'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "ec2.amazonaws.com" },
    "Action": "sts:AssumeRole"
  }]
}
JSON

# 2) Create the role and attach the trust policy
aws iam create-role \
  --role-name ec2-s3-readonly \
  --assume-role-policy-document file://trust-policy.json

# 3) Permission policy: least privilege, read ONE bucket only (not S3FullAccess)
cat > permission-policy.json <<'JSON'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:GetObject", "s3:ListBucket"],
    "Resource": [
      "arn:aws:s3:::my-company-reports",
      "arn:aws:s3:::my-company-reports/*"
    ]
  }]
}
JSON

# 4) Embed the permission policy into the role (inline here; for reuse, create a managed policy and attach)
aws iam put-role-policy \
  --role-name ec2-s3-readonly \
  --policy-name read-reports-only \
  --policy-document file://permission-policy.json
```

**Expected result**: `create-role` returns a block of JSON containing the role's `Arn` (like `arn:aws:iam::111122223333:role/ec2-s3-readonly`) and `RoleId`. `put-role-policy` on success **prints nothing and exits with code 0** (AWS CLI convention: silence means success). Once this role is attached to an EC2, that machine can **read only the `my-company-reports` bucket** — even listing other buckets returns `AccessDenied`. That is exactly what least privilege should look like.

<Cost>

IAM, Roles, and Policies are **completely free** themselves. But this exercise spins up an EC2 (which may incur charges). When you're done, remember to **Terminate** the test EC2, and use a **Free Tier** `t2.micro` to avoid a nasty bill at the end of the month.

</Cost>

:::warning[🚑 Common pitfalls]
- **Using a wildcard `*` for convenience**: `"Action": "*"` or `"Resource": "*"` throws the door wide open and violates least privilege. The fix is to list **specific actions** (`s3:GetObject`) and **specific resource ARNs**. Seeing `"Action": "s3:*"` should raise a flag.
- **Setting the trust policy the wrong way round**: writing "what it can do" into the trust policy, or opening `Principal` to `"*"` (anyone can assume it). Remember: the **trust policy only controls "who can assume"** — `Principal` must name a specific service or account; the **permission policy controls "what it can do"**. Getting the direction wrong leads to endless debugging.
- **root with no MFA, still used for daily work**: root permissions cannot be reduced, and a leak is unrecoverable. Right after creating the account, the **first thing** is to enable MFA on root and lock it away, then use IAM/SSO identities daily.
- **Policy too broad (over-granting)**: slapping on `AdministratorAccess` or `AmazonS3FullAccess` as production permissions. If compromised, the attacker gets that entire swath of access. Replace it with a least-privilege customer-managed Policy.
- **Attached a Role but still getting Access Denied**: usually the Policy lacks permissions, or the program is still reading an old environment-variable key (**environment variables take precedence over the Role**). Run `aws sts get-caller-identity` first to confirm which identity you actually are.
- **Committing a long-term `AKIA` key into Git / hard-coding it**: once pushed to a public repo it gets scraped and abused within minutes. If a Role or temporary credentials work, do not issue long-term keys.
:::

<Refs title="📚 Official docs & further reading">

- [AWS Docs: What is IAM (IAM User Guide)](https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html)
- [Security best practices in IAM](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)

</Refs>

## Next

- ⚡ Quick review: [Domain 1 Flashcards](./flashcards.md)
- ✍️ Test yourself: [Domain 1 Practice Questions](./quiz.md)
- 📖 Next page: [Data Encryption (KMS)](./kms.md)
