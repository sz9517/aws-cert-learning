---
sidebar_position: 2
title: "Lab 2: Let EC2 Access S3 with an IAM Role"
---

# Lab 2: Let EC2 Securely Access S3 with an IAM Role (No Keys)

> This lab answers a question that is hugely important for beginners and shows up again and again on the exam: **when an EC2 needs to access S3, where do its credentials come from?** The answer is — **do not stuff an access key into the machine**; attach an **IAM Role** instead. A role hands out **temporary credentials that rotate automatically** — it is the most secure option and the standard practice in production. Everything stays inside the Free Tier, and remember to clean up when you're done.

<Vocab title="📌 Jargon you'll see on this page (fine even if you've never touched AWS)">

- **IAM Role**: an identity with temporary permissions that can be "assumed". It's made for **services** (like EC2); once assumed, it automatically receives temporary credentials.
- **Instance Profile**: the container that "wraps" a role so it can be handed to an EC2. When you pick a role in the console, AWS creates this for you automatically.
- **Credentials / Access Key**: the password that proves "who you are and what you're allowed to do". Once a long-term key leaks, anyone can impersonate your account.
- **Temporary Credentials**: short-lived passes with an expiry that rotate automatically; far safer than long-term keys.
- **Least Privilege**: grant only the permissions that are "just enough", never more.

</Vocab>

:::note[💬 Reading tip]
Whenever you see a term with a <Term desc="Like this! Hover over any dotted term (tap on mobile) and a plain explanation pops up.">dotted underline</Term>, hover over it for a plain-language explanation. All terms are also collected in the [Glossary & Services](/glossary).
:::

:::info[Before you start]
This lab assumes you've already done the groundwork:

- You've completed [Your First Hands-On: EC2 + S3](/intro/first-hands-on) and know how to launch an EC2, create an S3 bucket, and connect into the machine.
- You've **set up a Billing Alarm**, so you get notified if spending crosses a threshold.
- Stay in the same **Region** throughout (e.g. "Asia Pacific (Tokyo) ap-northeast-1") so you don't lose track of the resources you create.

Not done yet? Go back and finish those first — they're your safety net.
:::

---

## Why not put an Access Key on the EC2?

Many beginners' first instinct is: "Can't I just run `aws configure` on the EC2, paste in an access key and secret key, and access S3?" **It works — but it's a bad idea**, for three reasons:

- **Keys are long-term**: unless you rotate them, they stay valid forever. If one leaks (pushed to GitHub, seen by a colleague, the machine gets breached), someone can act as you.
- **Keys on machines are hard to manage**: as machines multiply, you end up with key copies everywhere, and rotating or revoking them becomes impossible to track.
- **Production simply doesn't do this**: mature teams use roles, period.

<Analogy title="🏨 Analogy: a hotel key card vs handing over the master key">

Putting a long-term access key on an EC2 is like cutting a copy of the building's **master key** and giving it to a guest — if they lose it or it's stolen, the whole building is exposed. An **IAM Role** is more like a hotel **key card**: it only opens that one room, it expires automatically at checkout, and you can reissue it anytime. What EC2 needs is never a "master key" — it's a "just enough for this task, and it expires on its own" temporary pass.

</Analogy>

### How does a role actually work?

When you attach a role to an EC2, AWS is quietly doing this:

<div className="flow">
  <div className="flow-node">Role attached to EC2</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">EC2 assumes the role</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Gets temporary credentials</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Credentials auto-rotate on expiry</div>
</div>

*Diagram: you never enter or store any key by hand — the CLI/SDK automatically pulls the role's temporary credentials from inside the instance metadata.*

The container that "hands the role to the EC2" is called an **Instance Profile**. Good news: when you work in the console, **you don't have to deal with it** — AWS creates and associates it automatically when you assign the role. Just remember the term, because the exam may mention it.

---

## Hands-on: build a path that can read only "this one bucket"

This time we deliberately tighten the permissions: instead of the ready-made `AmazonS3ReadOnlyAccess` (which lets the EC2 read **every** bucket), we write our own policy that **only allows reading the single bucket we create here** — that's least privilege in practice.

### Step 1: Create an S3 bucket and drop in a test file

1. Type `S3` in the console search bar → open S3 → click **Create bucket**.
2. The **Bucket name** must be **globally unique**; add an identifier and a date, e.g. `role-lab-wang-20261022`. Remember this name — the policy will use it.
3. Pick the **Region** you normally use.
4. Keep **Block Public Access** set to "Block all public access" — leave it on. We want "the EC2 can read via the role", not "the whole world can read".
5. Leave everything else at its **default** → **Create bucket**.
6. Open the bucket → **Upload** → drop in a small text file (e.g. `hello.txt` with one line of text) → Upload. This is the test object we'll verify we can read shortly.

:::info[🤔 Why do it this way: block public access first, then talk about roles]
A tempting shortcut is "just make the bucket public, then the EC2 can read it" — **don't**. Public means the whole world can read it, which is a completely different thing from "only my EC2 can read it", and it's the single most common cause of cloud data-leak headlines. What we want is to **authorize by identity (a role)**, not by "open to everyone". Keep it blocked, and in a moment you'll see with your own eyes: the bucket is not public, yet an EC2 with the role attached can still read it.

**What you should see**: after creating the bucket, it appears in the list and the "Access" column shows "Bucket and objects not public"; after the upload finishes, `hello.txt` is listed inside the bucket.
:::

### Step 2: Create an IAM role that trusts EC2, with a least-privilege policy

1. Search `IAM` in the console → open IAM → left menu **Roles** → **Create role**.
2. For **trusted entity type** choose **AWS service**, and for **use case** choose **EC2** → Next. (This step configures "this role may only be assumed by the EC2 service".)
3. On the permissions page, don't pick a ready-made policy — click **Create policy**, switch to the **JSON** tab, and paste the following (replace both `role-lab-wang-20261022` with your bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ReadOneBucketOnly",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetObject"
      ],
      "Resource": [
        "arn:aws:s3:::role-lab-wang-20261022",
        "arn:aws:s3:::role-lab-wang-20261022/*"
      ]
    }
  ]
}
```

4. Name the policy, e.g. `read-role-lab-bucket` → **Create policy**.
5. Back on the create-role page (you may need to refresh the policy list), select the `read-role-lab-bucket` you just made → Next.
6. Name the role `ec2-read-one-bucket` → **Create role**.

:::info[🤔 Why do it this way: a role has "two locks", keep them separate]
An IAM role actually has **two** pieces of configuration, and beginners most often blur them together:

- **Trust policy**: decides **who** may assume this role. Choosing "AWS service → EC2" in Step 2 sets "only the EC2 service may assume it". Pick the wrong service (say, Lambda by mistake) and your EC2 can't assume the role — attaching it gets you no credentials.
- **Permissions policy**: decides **what you can do** once assumed. That's our read-only-single-bucket JSON above.

**Why write our own policy instead of the ready-made `AmazonS3ReadOnlyAccess`?** Because the ready-made one lets the EC2 read **every** bucket in the account; we only need to read this one, so we grant only this one — that's least privilege, keeping the "blast radius when something goes wrong" as small as possible.

**What you should see**: `ec2-read-one-bucket` appears in the roles list; open it and the "Trust relationships" tab shows `Service` as `ec2.amazonaws.com`; the "Permissions" tab has `read-role-lab-bucket` attached.
:::

:::tip[💡 Read what this policy does]
- `s3:ListBucket` is granted on the "bucket itself" (`arn:...:bucket`), so you can **list** the objects inside it.
- `s3:GetObject` is granted on the "objects in the bucket" (`arn:...:bucket/*`), so you can **download** files.
- There's no `PutObject` or `DeleteObject` — so this role can **only read; it can't write or delete**.
- Only this one bucket's ARN is listed — so it **can't touch any other bucket** in your account. That is least privilege.
:::

### Step 3: Attach the role to an EC2 instance

1. Open `EC2` → launch or pick an existing instance (use a Free Tier `t2.micro`/`t3.micro`).
2. Select it in the instance list → **Actions › Security › Modify IAM role**.
3. Choose the `ec2-read-one-bucket` you just created → **Update IAM role**.

That's it. **You have not — and do not need to — enter any key on this machine.**

:::info[🤔 Why do it this way: the role must be "attached to the instance" to count]
Until you **attach the role to this EC2 instance**, it does nothing for this machine — it's just an identity sitting in IAM. This step (Modify IAM role) is what actually hands the "profile" to the machine. It's also the single most forgotten step: no matter how nicely the policy is written, forget to attach it and the EC2 is still empty-handed.

Also: a role hands out **temporary credentials**, which the EC2 fetches automatically from the instance metadata service and that rotate on expiry. That's exactly why you don't — and shouldn't — place any key on the machine by hand: with no long-term key to leak, a whole class of risk disappears.

**What you should see**: after updating, the instance detail page's "Security" section shows the **IAM Role** field as `ec2-read-one-bucket` (it was blank before). The change takes effect immediately — no reboot needed.
:::

### Step 4: Connect into the EC2 and verify "access with no key configured"

Connect in with **EC2 Instance Connect** or **Session Manager** (browser-based and more secure), then run these in order:

```bash
# 1. First confirm "who am I now" — you'll see the temporary identity after assuming the role
$ aws sts get-caller-identity
# The Arn will look something like:
# arn:aws:sts::123456789012:assumed-role/ec2-read-one-bucket/i-0abc123...

# 2. List the bucket contents — credentials come from the role automatically; you never typed a key
$ aws s3 ls s3://role-lab-wang-20261022

# 3. Pull the test file down to confirm you can really read it
$ aws s3 cp s3://role-lab-wang-20261022/hello.txt .
$ cat hello.txt
```

Seeing the file's contents means success: **you never ran `aws configure`, there are no long-term keys on the machine, yet the EC2 can securely read S3.** That's the magic of roles.

:::note[🔍 What you should see (line by line)]
- `aws sts get-caller-identity`: the `Arn` will be `...:assumed-role/ec2-read-one-bucket/i-xxxx` — the keyword **assumed-role** means you're now a "temporary identity after assuming the role", not some long-term key.
- `aws s3 ls s3://your-bucket`: lists `hello.txt` directly, **without ever asking you to configure a key**. If this step throws `Unable to locate credentials`, nine times out of ten the role wasn't attached (go back to Step 3 and check).
- `aws s3 cp .../hello.txt .` + `cat`: prints the line you just wrote, proving you can really read the object's contents, not just list a filename.
:::

:::note[Want to see "least privilege" block you in real time?]
On the same machine, try `aws s3 ls` (with no bucket name — i.e. list **all** buckets) and you'll get **AccessDenied**, because our policy only authorizes that one bucket. Then try `aws s3 cp hello.txt s3://role-lab-wang-20261022/` (an upload) and it'll be blocked too, because we didn't grant `PutObject`. That's the concrete feel of "grant only just enough".
:::

---

## Least privilege: why is it worth the extra effort?

Slapping on `AmazonS3ReadOnlyAccess` takes five seconds — so why write our own policy? Because **the scope of your permissions equals the blast radius when something goes wrong**. If this EC2 is compromised, whatever the attacker can do with its role is exactly what the policy allows:

- With the ready-made read-only policy: the attacker can read the contents of **every** bucket in your account.
- With our policy: the attacker can read, at most, that **one test bucket** — everything else is AccessDenied.

The way to tighten things is to **work backwards from "which actions and which resources are actually needed"**, listing only the `Action`s and `Resource`s you truly require and nothing else. In practice you may not get it right the first time; the trick is to **start small, and add permissions on demand when you hit AccessDenied** — grow from small to large, rather than starting with `*`.

:::warning[🚑 Common gotchas (almost every beginner has hit these)]
- **Writing an access key into the EC2 or your code**: running `aws configure` and pasting a key on the machine, or hard-coding the key into your code or environment variables. It works, but it's the most dangerous option — and the exam's favorite wrong answer. **Service accessing service → always use a role, never long-term keys.**
- **Granting permissions too broadly (using `*`)**: slapping on `AmazonS3ReadOnlyAccess` for convenience, or writing `*` for `Action` and `Resource` in your own policy. If the machine is compromised, the blast radius is the whole account. This lab grants only `ListBucket`/`GetObject` on a single bucket to demonstrate the opposite.
- **Setting the wrong service in the trust relationship**: picking the wrong "use case" when creating the role (e.g. choosing Lambda for a role meant for EC2) leaves the trust policy pointing at the wrong service, so the EC2 cannot assume the role and gets no credentials even when attached. After creating it, check the "Trust relationships" tab shows `Service` as `ec2.amazonaws.com`.
- **Forgetting to attach the role to the instance**: the policy and role are both built, but Step 3 "Modify IAM role" got skipped. The result: `aws s3 ls` throws `Unable to locate credentials`, because no role is attached to the machine at all. This is the classic "I did everything but it still doesn't work".
- **Getting the bucket ARN wrong**: dropping the `/*` on the object line (granting the bucket but not the objects) means `ListBucket` passes but `GetObject` gets AccessDenied; or typing the bucket name wrong / forgetting to replace it with your own in one of the two ARNs.
:::

---

## Clean up to avoid charges

:::warning[🧹 Always clean up when you're done! Leftovers keep billing you]
Tear everything down in this order:

**1. Terminate the EC2 instance**
- Open `EC2` → select the machine → **Instance state › Terminate instance** → confirm.
- Note it's **Terminate**, not just **Stop**; you need the state to show `Terminated` for it to be truly deleted.

**2. Delete the IAM role and policy**
- Open `IAM` → **Roles** → select `ec2-read-one-bucket` → **Delete**.
- Then go to **Policies** → find `read-role-lab-bucket` → **Delete**.
- (IAM roles and policies are free, but leaving unused permissions around is a bad habit — clean them up.)

**3. Empty and delete the S3 bucket**
- Open `S3` → open the bucket → select all objects → **Delete** (a bucket must be emptied before it can be deleted).
- Once empty → back to the bucket list → select the bucket → **Delete** → type the bucket name to confirm.
:::

<Cost title="💰 Cost reminder">

The `t2.micro`/`t3.micro` and small amount of S3 storage used here are within the **Free Tier**; **IAM roles and policies are completely free** themselves. Follow the steps and clean up afterward, and you basically won't incur charges. What actually catches people out is **forgetting to terminate the EC2 or delete the bucket** — those keep billing quietly. Remember: **if you spin it up, remember to shut it down.**

</Cost>

---

## What this means for the exam

Domain 1 (Security) tests the same idea over and over — lock it in:

- **"An EC2/Lambda/etc. service needs to access another AWS service" → the answer is almost always "create an IAM Role and assign it to that service"**, **not** generating an access key and putting it in your code or on the machine. Any option like "store the key on the EC2 / in the code / in environment variables" is usually the trap.
- A role provides **temporary credentials that rotate automatically** — a security advantage the exam loves to emphasize.
- If a question also mentions "least privilege", prefer the answer with the **narrowest scope that just satisfies the need**; blanket `AdministratorAccess` or `*` is a clearly wrong choice.

Drill this into a reflex: **service accessing service → use a role; never long-term keys.**

<Refs title="📚 Official docs & further reading">

- [IAM roles for Amazon EC2](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/iam-roles-for-amazon-ec2.html)
- [Using instance profiles](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use_switch-role-ec2_instance-profiles.html)
- [Temporary security credentials in IAM](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp.html)
- [Security best practices in IAM (incl. least privilege)](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [Bucket policies and user policies (S3 IAM policy examples)](https://docs.aws.amazon.com/AmazonS3/latest/userguide/example-policies-s3.html)

</Refs>

👉 Next lab: [A Highly Available Site with ALB + Auto Scaling](./alb-autoscaling.md)
