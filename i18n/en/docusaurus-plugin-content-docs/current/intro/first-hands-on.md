---
sidebar_position: 10
title: "Your First Hands-On: EC2 + S3"
---

# Your First Hands-On: EC2 + S3

> Congratulations on reaching the "hands-on" stage! The earlier pages were all about the "why" and the "what" — now you'll finally **spin up a server and build a cloud warehouse with your own hands**, putting AWS's two headline services to work. Everything stays within the **Free Tier**, so following along won't cost you a cent (as long as you clean up at the end).

<Vocab title="📌 Jargon you'll see on this page (fine even if you've never touched AWS)">

- **EC2 (Elastic Compute Cloud)**: a "**rented computer / server**" on AWS — the "compute" star of this page.
- **Instance**: the actual **single** EC2 virtual machine you launch, like the specific computer you rented.
- **S3 (Simple Storage Service)**: AWS's "**cloud drive / file warehouse**" — the "storage" star of this page.
- **Bucket**: the "big container" that holds your files in S3; its name is **globally unique**.
- **Region**: the physical location of AWS's data centers around the world (e.g. Tokyo, Singapore); your resources live in whichever Region you pick.

</Vocab>

:::note[💬 Reading tip]
Whenever you see a term with a <Term desc="Like this! Hover over any dotted term (tap on mobile) and a plain explanation pops up.">dotted underline</Term>, hover over it for a plain-language explanation. All terms are also collected in the [Glossary & Services](../glossary.md).
:::

## Why do this hands-on once?

Reading about "launching an EC2" will never make it stick. This page gets you to **actually click the button, see the Linux prompt, drop a file onto S3 and pull it back down**. Do it once and every later service will have a mental picture attached — and exam scenario questions will make far more sense.

<Analogy title="🚗 Analogy: like driving out of the parking lot for the first time">

You can memorize the entire driving manual, but **actually knowing how to drive** starts the moment you first hit the gas and the car moves. This is your first time on the road: first launch a "computer" (EC2), then rent a "warehouse" (S3), and finally wire the two together.

</Analogy>

:::info[Before you start]
This page assumes you've finished the earlier onboarding pages:

- You've **created an AWS account** and you **don't use the Root user** for daily work.
- You've **set up a Billing Alarm**, so you get notified when spending crosses a threshold.
- You know how to **switch Region** (top-right of the console) — stick to the same Region for this whole walkthrough (e.g. "Asia Pacific (Tokyo) ap-northeast-1") so you don't lose track of what you created.

Not done yet? Go back and finish those first — they're your safety net.
:::

---

## Hands-on 1: Launch an EC2 instance

Goal: spin up a Linux server and successfully connect to see its prompt.

1. Log in to the AWS console → confirm the **Region** (top-right) is the one you want → type `EC2` in the search bar → open the EC2 service.
2. Click **Launch instance**.
3. **Name**: anything you like, e.g. `my-first-server`.
4. **Application and OS Images (AMI)**: choose **Amazon Linux** (usually "Amazon Linux 2023", marked "Free tier eligible").
5. **Instance type**: choose **t2.micro or t3.micro**, making sure it's labeled **"Free tier eligible"** — this is the key to not getting charged.
6. **Key pair**: we'll use a keyless connection method this time, so you can choose **Proceed without a key pair**.
7. **Network settings**: keep the **default VPC (Virtual Private Cloud — the virtual network built into your account)** and default subnet; beginners don't need to touch this.
8. **Storage**: keep the default small disk (within the Free Tier).
9. On the right, confirm "Number of instances = 1" and click **Launch instance**.
10. Back in the instance list, wait for the **instance state** to change from `Pending` to **`Running`**, and for the **status checks** to pass.

:::note[🤔 Why pick each option this way? (beginner plain-talk)]
- **Why Amazon Linux?** It's AWS's own, cheapest, most compatible Linux, and it even comes with the AWS CLI pre-installed — the least likely to trip up a beginner.
- **Why must it be `t2.micro` / `t3.micro`?** Only these "Free tier eligible" small types stay **free** within the Free Tier. Pick anything else and billing starts — the number-one reason beginners blow up their bill.
- **Why is "Proceed without a key pair" okay?** Because we connect from the browser instead (next section), so there's no `.pem` key file to safeguard — one less thing to lose or leak.
- **Why the default VPC / subnet?** The default network already sets up the basic "can reach the internet, you can connect in" rules for you. As a beginner, don't touch networking yet — just focus on the feel of launching a machine.

**What you should see**: a new row `my-first-server` appears in the list, state first an orange `Pending`, then after a minute or two a green **`Running`**, with "status checks" showing `2/2 checks passed`. That screen means the machine really is up.
:::

### Connect to it (no SSH keys to manage)

Don't want to deal with SSH key files? AWS offers two "connect right from the browser, more secure" options — pick either one:

- **EC2 Instance Connect**: in the instance list, select your machine → top-right **Connect** → choose the **EC2 Instance Connect** tab → **Connect**. A terminal opens in your browser.
- **Session Manager** (part of Systems Manager): on the same **Connect** screen, choose the **Session Manager** tab. It doesn't require any open inbound port and is the more secure, recommended approach in practice (it needs an appropriate IAM role — dig into that later).

11. Once connected, when you see a **Linux prompt** like this, you've succeeded:

```bash
[ec2-user@ip-172-31-xx-xx ~]$
```

Try a command to get a feel for it:

```bash
# See this machine's hostname
$ hostname

# See what system it's running
$ cat /etc/os-release
```

**What you should see**: `hostname` prints a name like `ip-172-31-xx-xx`; `cat /etc/os-release` prints several lines of system info containing `Amazon Linux`. Getting output back means you really are inside that machine running commands.

🎉 Congrats — you just launched a server in the cloud with your own hands!

:::warning[🚑 Common traps & misconceptions (EC2 part)]
- **Forgetting to pick a Free-tier type**: the default sometimes jumps to another type. Always **confirm the "Free tier eligible" label** before launching, or billing starts in the first minute.
- **Opening the security group (firewall) too wide**: if you switch to classic SSH and see a "Source" field, **do not enter `0.0.0.0/0` (that opens the door to the whole world)**. Connecting from the browser in this guide is exactly how you dodge this trap — follow along and you never touch the security group.
- **"Stop" instead of "Terminate"**: during cleanup later, choose **Terminate**, not Stop. Stop only powers it off; some resources may keep billing (see the cleanup section at the end).
- **Launch and forget**: the most expensive trap. An EC2 you launched but forgot about keeps **billing 24/7 in the background**, and you often only notice days later on the bill. Always come back and clean up.
:::

---

## Hands-on 2: Create an S3 bucket and upload a file

Goal: build your own cloud warehouse, upload a file, and pull it back down.

1. Type `S3` in the console search bar → open the S3 service → click **Create bucket**.
2. **Bucket name**: must be **globally unique**. Add your identifier and a date, e.g. `my-first-bucket-wang-20261022`. (Names allow only lowercase letters, numbers, and hyphens.)
3. **Region**: pick the same Region you've been using.
4. **Block Public Access**: **keep "Block all public access" checked — be sure to leave it ON!** This is S3's single most important safety switch. Don't open your warehouse to the whole world for the sake of "convenience".
5. Leave the other settings at their defaults → click **Create bucket**.

:::note[🤔 Why pick each option this way? (beginner plain-talk)]
- **Why must the bucket name be "globally unique" with a date added?** S3 names share **one global namespace across the whole world**, so nice names like `test` or `mydata` were taken long ago. Adding your identifier and a date is the fastest way to land a name nobody has used.
- **Why keep "Block all public access" ON?** It's S3's master safety switch. Turning it off is like letting anyone on the internet see your files. The most common real-world data leaks come from someone turning this off for convenience and forgetting to turn it back on.
- **Why build a private bucket first instead of learning "serve a public web page"?** As a beginner you want to build the instinct that "private and secure is the default". Once the concept is solid, you can learn when you'd deliberately make something public (with extra permissions set on purpose).

**What you should see**: after it's created, back in the bucket list you'll see your new name's row with the "Access" column showing **`Bucket and objects not public`** — seeing "not public" is correct.
:::

<Analogy title="🔒 Why not make the bucket public?">

Making a bucket public is like **tearing off your warehouse door and hanging the key on the frame** — anyone walking by can wander in. The most common real-world cloud breaches almost always come down to someone setting an S3 bucket public for convenience and forgetting to close it. This also echoes AWS's **Shared Responsibility Model**: **AWS secures the cloud itself, and you secure the data in the cloud** — locking down your bucket is your job.

</Analogy>

### Upload and download

6. Open the bucket you just created → **Upload** → **Add files** → pick a small file from your computer (an image or a text file) → **Upload**.
7. When the upload finishes, you'll see this **object (the file you uploaded)** inside the bucket.
8. Click into the object → hit **Download** and confirm you can pull the file back to your computer.

**What you should see**: after the upload, a new row with your filename appears in the bucket (that's an **object**); after you download, the browser saves the same file back to your computer, and it opens with the same contents — meaning the whole "upload → store → retrieve" path works.

Done! You now own a private, secure cloud warehouse.

:::warning[🚑 Common traps & misconceptions (S3 part)]
- **Making the bucket public**: turning off "Block public access" just to "see the file faster" is the most dangerous beginner move. At this stage you **don't need** public access at all — keep it private.
- **Putting important data in a place you're about to delete**: this bucket is **for practice and will be deleted shortly**. Never store the only copy of something important (photos, reports) here and then wipe it. Use any throwaway small file for practice.
- **Thinking an "empty-looking" bucket is clean**: a bucket with any object still in it **cannot be deleted** and still occupies (a tiny bit of) storage. During cleanup you must **empty the objects first, then delete the bucket** (see the cleanup section at the end).
:::

---

## Hands-on 3 (optional): Access S3 from EC2 using the CLI

This step lets you feel **how services wire together** — letting that EC2 you just launched access your S3 with no keys at all.

The key to "no keys" is attaching an **IAM Role with S3 permissions** (e.g. `AmazonS3ReadOnlyAccess`) to the EC2. How to create the role and attach it is covered step by step in the [IAM page](/saa/domain-1/iam) — just follow along. Once the role is attached, go back to the EC2 terminal:

```bash
# List the S3 buckets in your account; credentials are provided automatically by the Role — no keys to type
$ aws s3 ls

# See what's inside that bucket (swap in your own bucket name)
$ aws s3 ls s3://my-first-bucket-wang-20261022
```

**What you should see**: `aws s3 ls` lists the buckets in your account (including the one you just created); if the bucket has a file, the second command lists that object's timestamp and name. **You typed no keys at all** — the credentials come automatically from the role.

Being able to list the buckets means you've wired "compute (EC2)" and "storage (S3)" together securely — exactly the classic combo the SAA exam loves to test.

:::tip[💡 Why a role instead of hard-coded keys?]
Baking an Access Key into your program or machine means a leak hands the key to someone else. **An IAM Role provides temporary credentials that rotate automatically** — far safer. Whenever a question says "EC2 needs to access S3", the correct answer is almost always "create an IAM Role and assign it to the EC2".
:::

---

## The most important step: clean up your resources to avoid charges

:::warning[🧹 Always clean up when you're done! Skipping this keeps charging you]
The Free Tier has **usage limits and time windows**, and resources you forget to shut down keep billing quietly in the background. Make sure you remove everything you created, in order:

**1. Terminate the EC2 instance you just launched**
- Go to `EC2` → instance list → select `my-first-server` → **Instance state › Terminate instance** → confirm.
- Note it's **Terminate**, not just **Stop**. "Stop" only powers it off — related resources may still bill. **"Terminate" is what actually deletes the whole machine.**
- **Why delete it as soon as you're done?** The Free Tier is a "fixed number of hours per month". Leaving it running easily goes over the limit, or keeps billing once the allowance expires. Once you've finished practicing, this machine is useless — keeping it only risks charges with no upside, so deleting it is the safest move.
- **What you should see**: the state first turns `Shutting-down`, then after a minute or two becomes **`Terminated`**, and a while later the row disappears from the list on its own. Seeing `Terminated` means the machine is really deleted and no longer billing.

**2. Delete the S3 bucket (empty the objects inside first)**
- Go to `S3` → open your bucket → select all the objects inside → **Delete**, and type the confirmation text as prompted.
- Once the objects are gone, back in the bucket list → select the bucket → **Delete** → type the bucket name to confirm.
- (An S3 bucket **must be empty before it can be deleted** — this is the normal flow.)
- **What you should see**: after emptying, the object list goes empty; after deleting the bucket, back in the list that bucket name **is gone**, which means it's fully deleted.

**3. Check the Billing page to confirm nothing keeps charging**
- Top-right account menu → **Billing and Cost Management** → review **Free Tier** usage and your current bill, confirming there are no unexpected items.
- **What you should see**: the current amount due is near `$0.00`, Free Tier usage is all within limits, and no service you don't recognize is billing.

**What happens if you forget to clean up?** A left-on EC2 can quietly eat several to a dozen-plus dollars a month; a pile of undeleted objects keeps occupying storage. They won't pop up to remind you — they just show up on the end-of-month bill. That's why "clean up as soon as you're done, and set up a Billing Alarm in advance" is the habit a beginner should build first.
:::

:::note
Building the habit of "**clean up as soon as you finish a hands-on**" is the first muscle memory every AWS learner should develop. That's also why we had you set up a Billing Alarm from the start — it's your last line of defense.
:::

<Cost title="💰 Cost note">

The `t2.micro` / `t3.micro` and the tiny bit of S3 storage used here are all within the **Free Tier** — follow the steps and clean up afterward, and you basically won't incur charges. What really catches people out is **forgetting to terminate the EC2 or forgetting to delete the bucket** — those keep billing quietly. Remember: **if you turned it on, remember to turn it off.**

</Cost>

---

## Wrap-up: you've finished the whole onboarding path

Look back at the road you've traveled:

- **Why we need the cloud** → you understand the motivation, no more rote memorization.
- **What the cloud / AWS is** → you have the big picture.
- **Accounts, billing, Regions, IAM basics** → your security and foundation are in place.
- **Launched EC2 by hand, built S3, wired services together, cleaned up** → genuinely hands-on!

You've completed the full "**why → what → foundations → hands-on**" onboarding path. Next, you officially enter the four SAA exam domains and start diving deep into each service and architectural design.

<Refs title="📚 Official docs & further reading">

- [Get started with Amazon EC2](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/EC2_GetStarted.html)
- [Connect using EC2 Instance Connect](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/connect-using-eic.html)
- [Getting started with Amazon S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/GetStartedWithS3.html)
- [AWS Free Tier](https://aws.amazon.com/free/)

</Refs>

👉 Onboarding complete! Next: [SAA Exam Info & Study Plan](../saa/exam-info.md)
