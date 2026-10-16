---
sidebar_position: 1.5
title: "IAM Advanced: Cross-Account, STS, SCP, Identity Center"
---

# IAM Advanced: Cross-Account Roles, STS, SCP, and Identity Center

> After the [IAM basics](./iam.md), this page adds the **must-know** advanced topics for the Associate exam: how to safely do **cross-account access**, where temporary credentials come from, and how to govern an organization with **many AWS accounts**.

<Vocab title="📌 Jargon you'll see on this page">

- **STS (Security Token Service)**: the service that issues **temporary credentials** that expire automatically.
- **AssumeRole**: temporarily "become" an IAM Role to borrow its permissions.
- **Trust policy**: the rule on a role stating **who is allowed to assume it**.
- **AWS Organizations**: the service for centrally managing all of a company's AWS accounts.
- **SCP (Service Control Policy)**: a **permissions ceiling** set at the Organizations level.
- **IAM Identity Center**: the enterprise single sign-on (SSO) service, formerly AWS SSO.
- **Permission Boundary**: an upper limit on how much permission a user / role can ever have.

</Vocab>

## Temporary credentials: STS and assuming roles

<Scenario title="Real scenario: the production account needs to read the dev account's S3">

You have two AWS accounts (prod, dev), and a prod app needs to temporarily read a bucket in dev. **Don't** copy the dev account's long-term keys over — the correct approach is: dev creates a Role whose trust policy says "prod is allowed to assume me," and the prod app gets **temporary credentials via STS AssumeRole** to access it. The credentials expire in a few hours, and you never store long-term keys.

</Scenario>

<Analogy title="🎫 Analogy: STS temporary credentials are like a visitor badge">

Long-term keys are like a "full employee ID" — a pain if lost. STS gives you a **visitor badge**: sign in at the front desk (AssumeRole), get one, and it expires on its own in a few hours, so even if it's lost the risk is limited. Prefer temporary credentials over long-term keys — it's a core AWS security principle.

</Analogy>

## How cross-account access works (diagram)

<div className="flow">
  <div className="flow-node">App in prod account</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Call STS AssumeRole</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Get temporary credentials</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Access S3 in dev account</div>
</div>

*Key point: the dev account's Role must list the prod account as trusted in its **trust policy** — only then do the two sides connect.*

## Multi-account governance: Organizations and SCP

A company usually has more than one account (prod / test / security…). **AWS Organizations** manages them centrally, and **SCP** sets a "permissions ceiling."

:::tip[💡 The most important SCP concept (frequently tested)]
**An SCP can only "restrict" permissions, never "grant" them.** It sets an **upper limit** — even if an IAM user's policy allows an action, if the SCP doesn't permit it, it's still blocked.

Analogy: an SCP is like a company rule, "no one may spend over $100k." Even if your manager (IAM Policy) approves $200k, you still hit the company ceiling first.
:::

### SCP vs Permission Boundary vs IAM Policy — don't mix them up

| Mechanism | Scope | Grants or restricts |
| --- | --- | --- |
| **IAM Policy** | A single user / group / role | **Grants** permissions |
| **Permission Boundary** | A single user / role | Sets that principal's **max permissions** |
| **SCP** | An entire account / organizational unit (OU) | Sets the account's **permissions ceiling** |

> Mnemonic: **effective permissions = what IAM Policy grants ∩ (intersection) each ceiling**. If any layer doesn't allow it, it's blocked.

## Enterprise single sign-on: IAM Identity Center

Employees shouldn't memorize a separate password per AWS account. **IAM Identity Center** lets them log in with **one corporate identity (can connect to Active Directory, Google, Okta, etc.)** and automatically get role-based access across all AWS accounts.

:::tip[💡 Exam focus]
- "Need **cross-account** access **without long-term keys**" → **IAM Role + STS AssumeRole**.
- "**Stop an entire account** from doing something (even admins)" → **SCP** (remember: restrict only, never grant).
- "**Many accounts**, employees need to **log in once to all of them** and connect a corporate directory" → **IAM Identity Center**.
- "Delegate role creation to a developer but **don't let them make a role with more power than themselves**" → **Permission Boundary**.
:::

## Real-world application

### 🛠️ Hands-on: assume a cross-account role via CLI

```bash
# Assume the dev account's read-only role to get temporary credentials
$ aws sts assume-role \
    --role-arn arn:aws:iam::222222222222:role/CrossAccountReadOnly \
    --role-session-name demo-session

# The returned AccessKeyId / SecretAccessKey / SessionToken are the temporary credentials
```

<Cost>

**IAM, STS, Organizations, SCP, and IAM Identity Center are all free** — you only pay for the resources you actually use. Multi-account governance adds nothing to your bill, so plan freely.

</Cost>

:::warning[🚑 Common mistakes]
- **Thinking an SCP grants permissions**: it only sets a ceiling. The account still needs an IAM Policy to actually authorize the action.
- **Setting up only one side of cross-account**: assuming a role needs **both sides correct** — the target role's trust policy + the source having `sts:AssumeRole` permission.
- **Copying long-term keys for cross-account access**: this is the exact anti-pattern to avoid — always use roles + STS instead.
:::

## Next

- 📖 Recap the basics: [IAM — Identity and Access Management](./iam.md)
- 📖 Next page: [Data Encryption (KMS)](./kms.md)
- ⚡ Review: [Domain 1 Flashcards](./flashcards.md)
