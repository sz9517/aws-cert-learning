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

### Why use STS AssumeRole for cross-account instead of sharing long-term keys?

This is the most important "why" on this page. Both approaches let the prod account reach the dev account, but they are worlds apart:

**Sharing long-term keys (anti-pattern):** copy the dev account's Access Key / Secret Key into the prod account's config file or environment variables. Looks fastest, but it is riddled with problems:

- **Never expires:** that key stays valid until someone manually rotates it. The day it gets committed to Git, pasted into a log, or walks out with a departing employee, you have a permanent backdoor wide open.
- **Hard to attribute:** everyone shares the one key, so CloudTrail only sees "what this key did," not which person or service actually used it.
- **Rotation is a nightmare:** to change the key you must notify and update everyone holding it at the same time — miss one and things break.

**STS AssumeRole (the right way):** a prod identity "assumes" a role in the dev account, and STS issues a temporary credential that lives only **minutes to hours**.

:::tip[💡 Why choose it / pros and cons]
**Benefits (why choose it):**
- **Expires automatically:** the temporary credential dies when its lifetime runs out (default 1 hour, adjustable), so even if leaked the risk window is tiny.
- **No long-term secret to guard:** the source side never holds the dev account's keys — no "where do we store the key / how do we rotate it" headache.
- **Attributable:** every AssumeRole leaves a CloudTrail record of who assumed the role, when, and under which session name — clean auditing.
- **Centralized revocation:** to cut off access, just change the dev role's trust policy or permissions — no hunting down every scattered key.

**Drawbacks / trade-offs:**
- **You must set up trust on both sides first** (the target account's trust policy + the source having `sts:AssumeRole` permission), so the initial setup is more work than "copy-paste a key."
- **Credentials expire:** long-running programs must be able to **re-assume the role automatically** to refresh (the official SDKs usually handle this for you).

**When not to use / not the first choice:** when a service in the **same account** (such as EC2 or Lambda) needs same-account resources, just attach an **IAM role** to that service and the SDK fetches temporary credentials automatically — you do **not** need to call AssumeRole yourself. Manual AssumeRole is mainly for **cross-account** access, or for temporarily switching / downgrading permissions.
:::

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

### Why have SCPs at all? How do they trade off against IAM Policy?

Beginners most often treat an SCP as "another way to hand out permissions." In fact the two play completely different — and **complementary** — roles:

- **IAM Policy is the gas pedal:** its job is to **grant** permissions, opening up what a user / role can do. Without it, nothing is allowed.
- **SCP is the brake / ceiling:** its job is to **cap** things, defining "the most this account can ever touch." It **grants no one anything**; it only blocks whatever exceeds the ceiling — and it even blocks the account's root user, which is the key difference from an IAM Policy.

:::tip[💡 Why choose it / when to use Organizations + SCP]
**Why you need an SCP (the point):** once a company has many accounts, relying on "each account writes its own good IAM Policy" simply does not scale — someone always over-provisions in some account. An SCP lets you draw a red line at the **organization level** that no one inside can cross (for example, "these are sandbox accounts, deny everything except EC2," or "no one in the whole org may disable CloudTrail"), no matter how an account admin configures things.

**When to use it:**
- You have **AWS Organizations and multiple accounts** and want an **org-wide guardrail**.
- You must **enforce compliance** (such as "only this region allowed" or "never delete audit logs") and do not want individual account admins to bypass it.

**Trade-offs / drawbacks:**
- **SCPs only exist inside Organizations** — a single standalone account has no such thing.
- **Restricts, never authorizes:** after setting an SCP you **still need an IAM Policy to actually authorize** the action. The two must be configured together; neither alone is enough.
- Set it too strict and you cause **collateral damage:** one "Deny" SCP overrides every allow inside the account, and during troubleshooting it is confusing ("IAM clearly grants it, why is it still blocked?" — the answer is often an SCP).
:::

## Enterprise single sign-on: IAM Identity Center

Employees shouldn't memorize a separate password per AWS account. **IAM Identity Center** lets them log in with **one corporate identity (can connect to Active Directory, Google, Okta, etc.)** and automatically get role-based access across all AWS accounts.

### Why large / multi-account companies switch to Identity Center instead of classic IAM users

The traditional approach is to **create a batch of IAM users in every account**. As accounts and headcount grow, this collapses:

**Pain points of classic IAM users:**
- **Account explosion:** 10 accounts × 50 employees means maintaining 500 users and passwords; onboarding and offboarding means opening and closing accounts everywhere, and something always gets missed.
- **Long-term credentials everywhere:** IAM users often carry long-term keys and passwords scattered across accounts — a large attack surface.
- **No single sign-on:** employees memorize a separate password per account — poor experience and insecure.

**How Identity Center solves it:** an employee has an identity in **one place** (which can plug into your existing AD / Google / Okta); after logging in, they see every account they have access to from a single portal, and when they click in, Identity Center hands out that role's permissions behind the scenes using **temporary credentials** (STS under the hood).

:::tip[💡 Why choose it / trade-offs]
**Benefits (why choose it):**
- **One identity, single sign-on:** manage onboarding / offboarding in one spot — disable one account and it is revoked everywhere, with no leftover zombie accounts.
- **Temporary credentials, fewer long-term keys:** dramatically shrinks the "scattered keys" attack surface.
- **Reuses your existing corporate directory:** plug straight into AD / Okta — no need to rebuild employee data inside AWS.
- **Centralized permission governance:** define roles once as a "Permission Set" and apply it across many accounts, instead of writing it per account.

**Trade-offs / drawbacks:**
- **Upfront setup:** you must connect an identity source and plan permission sets — more effort than casually spinning up a few IAM users (but hugely worth it once you have many accounts).
- **It is for people:** Identity Center governs **employee sign-in**; access **between programs / services** still goes through **IAM roles + STS** — do not mix the two.

**When not to use it:** for a small project with a single account and a handful of people, classic IAM users are genuinely enough, and forcing Identity Center is over-engineering. It shines when you have **many accounts / many people / a corporate directory to connect**.
:::

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
```

**Expected result:** on success you get back a JSON blob whose core is the `Credentials` block — its three fields are this session's temporary credentials:

```json
{
  "Credentials": {
    "AccessKeyId": "ASIA...",
    "SecretAccessKey": "wJalr...",
    "SessionToken": "FwoGZXIvYXdz...",
    "Expiration": "2026-10-26T15:00:00Z"
  },
  "AssumedRoleUser": {
    "Arn": "arn:aws:sts::222222222222:assumed-role/CrossAccountReadOnly/demo-session"
  }
}
```

Note the `AccessKeyId` starts with **`ASIA`** (the hallmark of a temporary credential; long-term keys start with `AKIA`) and has an `Expiration` time. Next, set those three values as environment variables, and subsequent commands run under this temporary identity:

```bash
# Set the three returned values as environment variables (macOS / Linux)
$ export AWS_ACCESS_KEY_ID=ASIA...
$ export AWS_SECRET_ACCESS_KEY=wJalr...
$ export AWS_SESSION_TOKEN=FwoGZXIvYXdz...

# Verify: your identity should now be the assumed role, not the original you
$ aws sts get-caller-identity
# Expect the Arn to be .../assumed-role/CrossAccountReadOnly/demo-session
```

:::info[🔑 Common mistake and the error message to expect]
If the trust relationship is not set up, `assume-role` fails immediately with a message like:

```
An error occurred (AccessDenied) when calling the AssumeRole operation:
User: arn:aws:iam::111111111111:user/alice is not authorized to perform:
sts:AssumeRole on resource: arn:aws:iam::222222222222:role/CrossAccountReadOnly
```

When you see this `AccessDenied on sts:AssumeRole`, check **both sides**: whether the target role's **trust policy** lists the source account / user as trusted, and whether the source side has the `sts:AssumeRole` permission.
:::

<Cost>

**IAM, STS, Organizations, SCP, and IAM Identity Center are all free** — you only pay for the resources you actually use. Multi-account governance adds nothing to your bill, so plan freely.

</Cost>

:::warning[🚑 Common pitfalls]
- **Thinking an SCP "grants" permissions**: the biggest misconception. An SCP **only sets a ceiling and never grants anything**. The account still needs an IAM Policy to actually authorize the action. Conversely, when troubleshooting "IAM clearly grants it but I still get AccessDenied," the first suspect is an SCP capping it off.
- **Confusing the trust policy with the permission policy**: these two policies on a role govern completely different things —
  - **Trust policy** = "**who is allowed to assume me**" (lives on the role in the target account).
  - **Permission policy** = "**what can be done after assuming**."
  Get the trust policy right but forget the permission policy → assuming succeeds, but any operation returns `AccessDenied`; grant full permissions but leave the source out of the trust policy → even the `AssumeRole` step fails. When stuck, first figure out which of the two is at fault.
- **Setting up only one side of cross-account**: assuming a role needs **both sides correct** — the target role's trust policy listing the source as trusted + the source having `sts:AssumeRole` permission. Miss one side and `assume-role` fails straight away with `AccessDenied`.
- **Forgetting the External ID for third-party cross-account**: when you open a role for an **external vendor / third-party SaaS** to assume, the trust policy must add an `sts:ExternalId` condition and the caller must pass `--external-id` on `assume-role`. Without it you have a "confused deputy" risk — another customer could be tricked into assuming your role. You do **not** need an External ID between your own company's accounts; this is specifically for the third-party scenario.
- **Copying long-term keys for cross-account access**: this is the exact anti-pattern to avoid (never expires, hard to audit, rotation nightmare) — always use roles + STS instead.
:::

<Refs title="📚 Official docs & further reading">

- [IAM roles](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles.html)
- [Service control policies (SCPs) — AWS Organizations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html)
- [What is IAM Identity Center](https://docs.aws.amazon.com/singlesignon/latest/userguide/what-is.html)

</Refs>

## Next

- 📖 Recap the basics: [IAM — Identity and Access Management](./iam.md)
- 📖 Next page: [Data Encryption (KMS)](./kms.md)
- ⚡ Review: [Domain 1 Flashcards](./flashcards.md)
