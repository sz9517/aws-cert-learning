---
sidebar_position: 1
title: "Lab 1: Build Your First VPC"
---

# Lab 1: Build Your First VPC

> In this lab you'll **build a VPC with your own hands** — your own private slice of virtual network on AWS. Why start here? Because **networking is the foundation of every architecture**: every server and database you launch later has to live inside some network first. Get this foundation right, and the high-availability and security designs that follow will stand on solid ground.

<Vocab title="📌 Jargon you'll see on this page (fine even if you've never touched AWS)">

- **VPC (Virtual Private Cloud)**: your **own fenced-off slice of virtual network** on AWS — resources inside can see each other, and you decide whether to open a door to the outside.
- **Subnet**: a **smaller block** carved out inside a VPC; each subnet belongs to exactly one Availability Zone.
- **CIDR**: the notation for a range of IP addresses, e.g. `10.0.0.0/16` means one big block of usable internal IPs.
- **Route Table**: the **traffic rulebook** that decides which path traffic takes to reach a given destination.
- **Internet Gateway (IGW)**: the **front door** from your VPC to the public internet.
- **Availability Zone (AZ)**: independent data centers within one Region; spreading across them avoids a single point of failure.

</Vocab>

:::note[💬 Reading tip]
Whenever you see a term with a <Term desc="Like this! Hover over any dotted term (tap on mobile) and a plain explanation pops up.">dotted underline</Term>, hover over it for a plain-language explanation. All terms are also collected in the [Glossary & Services](../glossary.md).
:::

:::info[Before you start]
This page assumes you've finished the earlier prep:

- You've completed the onboarding **first hands-on (EC2 + S3)** and have a basic feel for the console.
- You've **set up a Billing Alarm**, so you get notified when spending crosses a threshold.
- You know how to **switch Region** (top-right of the console) — stick to the same Region for this whole lab (e.g. "Asia Pacific (Tokyo) ap-northeast-1").

Not done yet? Go back and finish those first — they're your safety net.
:::

---

## First, the mental model: what a VPC is and why we split it up

<Analogy title="🏘️ Analogy: a VPC is like your own plot of neighborhood land">

- **VPC** = a **whole plot of neighborhood land** you fence off from AWS (its border is marked by a CIDR, e.g. `10.0.0.0/16`).
- **Subnets** = the **different blocks** you lay out on that land: some front the main road and are open to the outside (public); some are tucked inside for internal use only (private).
- **Route Tables** = the **signposts** at each block's entrance, telling cars "to leave the neighborhood, take this road."
- **Internet Gateway (IGW)** = the **one front gate** from the neighborhood to the main road outside. Without it, cars hit the border and can't get out.

</Analogy>

The difference between a **public subnet and a private subnet** comes down to one thing: **whether its route table has a route pointing to the IGW**.

- **Public subnet**: its route table has a rule "send internet-bound traffic (`0.0.0.0/0`) to the IGW," so resources with a public IP can reach out and be reached from outside. Good for public-facing web servers.
- **Private subnet**: no route to the IGW, so nothing outside can connect in. Good for databases and backend services that **should not sit directly on the internet**.

<Term en="Virtual Private Cloud" desc="Your own fenced-off slice of virtual network on AWS where resources can talk to each other and you decide whether to open a door to the outside.">Why split public from private?</Term> In one line: **put what should face the world on the outer ring, and lock what shouldn't on the inner ring** — the most basic form of network security layering. With the database locked in a private subnet, even if someone breaks into your web server, they can't reach the database directly from the internet.

---

## Hands-on: build a VPC from scratch

Goal: build a VPC containing **one public subnet** and **one private subnet**, and let the public subnet reach the internet.

:::info[🧭 Think it through first: why this design]
So every step has a "why" behind it, here's the plan in plain terms:

- **Why one public and one private subnet?** It's the minimal "layering" demo: **put outward-facing things in public, lock things that shouldn't face the internet in private**. In real architectures the web server sits in public and the database in private, so breaking into the web server still can't reach the database.
- **Why `/16` for the VPC and `/24` for subnets?** `/16` gives you 65,536 internal IPs (a big plot of land), plenty to carve many subnets out of later; each `/24` subnet has roughly 250 usable IPs, more than enough for a single purpose. **Plan big, then slice small** so you don't run out of room and have to redo it.
- **Why span two different AZs?** If a single AZ's data center goes down, everything in it goes with it; **spanning AZs is what makes high availability possible**, and it's the prerequisite for every multi-AZ architecture later.
- **Why does public need an IGW and a route table pointing at it?** The IGW is the VPC's one door to the outside; **having the door isn't enough — you also have to "draw a road" in the route table pointing to it** so traffic knows to leave through that door. Without that route, even a subnet with public IPs can't get out.
:::

The AWS console has a handy wizard called **VPC and more** that **builds the VPC, subnets, route tables, and IGW all at once and wires them together**. We'll use the wizard to build it quickly first (and explain what it did for you), then show what each step is if you do it by hand.

### Option A: let the "VPC and more" wizard do it all (recommended for beginners)

1. Log in to the AWS console → confirm the **Region** (top-right) is the one you want → type `VPC` in the search bar → open the VPC service.
2. Click **Create VPC**.
3. At the top, choose **VPC and more** — this opens the wizard.
4. **Name tag**: give it a recognizable prefix, e.g. `my-first-vpc`.
5. **IPv4 CIDR block**: enter `10.0.0.0/16` (this gives you a large block of internal IPs).
6. **Number of Availability Zones (AZs)**: choose **2** (spanning two AZs is the baseline for high availability).
7. **Number of public subnets**: choose **2**; **Number of private subnets**: choose **2**. (The wizard spreads them across different AZs automatically.)
8. **NAT gateways**: to avoid extra charges, choose **None** this time. (NAT gateways cost money — create one later when you actually need private subnets to reach out.)
9. **VPC endpoints**: choose **None**.
10. The **preview diagram** on the right draws what it's about to build in real time → confirm it looks right and click **Create VPC**.

When the wizard finishes, it has actually built all of this for you at once: **1 VPC + public/private subnets (across 2 AZs) + 1 Internet Gateway attached to the VPC + a public route table (with a `0.0.0.0/0` rule pointing to the IGW) + a private route table**, with the right subnets already associated. You now have a usable network foundation.

### Option B: build it by hand once to really understand each piece

If you want to truly grasp what the wizard did behind the scenes, building it by hand in this order makes it click:

1. **Create the VPC**: VPC service → left menu **Your VPCs** → **Create VPC** → choose "VPC only" → name `my-first-vpc`, IPv4 CIDR `10.0.0.0/16` → Create.
   - **Why build this first?** The VPC is the "outer frame" — subnets, route tables, and the IGW all have to hang off some VPC, so it must come first.
   - **What you should see**: a new `my-first-vpc` entry in the VPC list with state `Available`, and AWS has already created a "main route table" for it automatically — that default table only has the rule for internal VPC traffic, with **no** route to the outside.
2. **Create the public subnet**: left menu **Subnets** → **Create subnet** → select your VPC → name `public-1a`, pick an AZ (e.g. `ap-northeast-1a`), CIDR `10.0.1.0/24`.
   - **Why CIDR `10.0.1.0/24`?** It must fall "inside" the VPC's `10.0.0.0/16` range and **must not overlap** any other subnet; we reserve the `.1.` block for public, and the private one will use `.2.` next — easy to tell apart at a glance.
   - **What you should see**: a new `public-1a` entry in the subnet list in the AZ you picked. It is **not truly "public" yet** — that only happens once you wire up the route in steps 5 and 6.
3. **Create the private subnet**: same flow, name `private-1c`, pick a **different AZ** (e.g. `ap-northeast-1c` — spanning AZs is for high availability), CIDR `10.0.2.0/24`.
   - **Why deliberately a different AZ?** Spreading public and private across different data centers is the cheapest high availability you can get; in a real architecture you'd put a public+private pair in each AZ.
   - **Why is it automatically private without "doing" any routing?** Because private just means "the route table has no path to the IGW" — we **wire up nothing**, so it's closed to the outside by default.
   - **What you should see**: another entry `private-1c` in the subnet list, in a different AZ from `public-1a`.
4. **Create and attach the IGW**: left menu **Internet Gateways** → **Create internet gateway** → name and create → select it → **Actions › Attach to VPC** → choose your VPC.
   - **Why "attach" it to the VPC after creating it?** A freshly created IGW is an orphan not connected to any VPC, with state `Detached`; **only after attaching does it actually become that VPC's door to the outside**. Skip this and a route table pointing at it does nothing.
   - **What you should see**: the IGW's state flips from `Detached` to `Attached`, showing the VPC ID it is attached to.
5. **Create a public route table and add a route**: left menu **Route Tables** → **Create route table** → select your VPC, name it `public-rt` → open it → **Routes › Edit routes › Add route** → Destination `0.0.0.0/0`, Target = your **IGW** → Save.
   - **Why set the route this way?** `0.0.0.0/0` is the notation for "all destinations (i.e. the entire internet)"; in plain terms this rule says "**send any outbound traffic through the IGW door**." This is the one and only difference between a public and a private subnet.
   - **Why create a separate table instead of editing the default main route table?** Editing the main route table would make **every subnet that isn't explicitly assigned elsewhere become public**, which easily opens a door for ones that should stay private; keeping **one table just for public and leaving private on the default** stays clean and hard to get wrong.
   - **What you should see**: `public-rt`'s route list has two entries — the internal `10.0.0.0/16 → local` (there by default, can't be removed) plus the `0.0.0.0/0 → igw-xxxx` you just added.
6. **Associate the public subnet with the public route table**: in `public-rt`, under **Subnet associations** → **Edit subnet associations** → check `public-1a` → Save. (Don't associate the private subnet with this table, so it stays private.)
   - **Why is this "associate" step needed too?** A route table doesn't apply to any subnet automatically; **you have to explicitly associate it so the table with the outbound route actually takes effect on `public-1a`**, which is what finally makes it public.
   - **What you should see**: `public-rt`'s subnet associations list `public-1a`; meanwhile `private-1c` is still associated with the **main route table** (no outbound route), so it stays private.

The result of Option B is identical at its core to what the wizard builds — the only difference is the wizard clicks every button for you at once.

---

## Optional: launch an EC2 in the public subnet to verify internet access

Want to see with your own eyes that the public subnet really works? Launch a tiny EC2:

1. Go to `EC2` → **Launch instance** → name `vpc-test` → AMI = **Amazon Linux** (Free tier eligible).
2. **Instance type**: choose **t2.micro or t3.micro** (look for the "Free tier eligible" label).
3. **Network settings** → **Edit** → set **VPC** to your new `my-first-vpc`, set **Subnet** to the **public subnet** (e.g. `public-1a`) → set **Auto-assign public IP** to **Enable**.
4. The default security group is fine; launch the instance.
5. Connect with **EC2 Instance Connect** (right from the browser, no keys to manage) and test outbound connectivity in the terminal:

```bash
# If it prints your public IP, the machine really can reach the internet
$ curl -s https://checkip.amazonaws.com
# What you should see: a public IP, e.g.
# 54.xxx.xxx.xxx

# Or simply ping an external site (Ctrl+C to stop)
$ ping -c 3 aws.amazon.com
# What you should see: three "64 bytes from ..." lines with a latency (time=xx ms), ending in 0% packet loss
```

:::note[👀 Why "Auto-assign public IP = Enable" is the critical bit]
Step 3 above must set **Auto-assign public IP** to **Enable**. Why? Because "the public subnet has a route to the IGW" only means "the door is open"; **the machine itself still needs a public IP to actually walk out that door**. Missing either one and it can't reach out — this is one of the most common things beginners get stuck on.
:::

---

## How do you know it worked?

- The VPC list shows `my-first-vpc` with state `Available`.
- The subnet list shows **two public and two private** subnets (or one each with Option B), spread across **different AZs**.
- The public route table has a `0.0.0.0/0 → igw-xxxx` route; the private route table does **not**.
- (Optional) The EC2 can `curl` an external IP — proving the whole "public subnet + IGW + route table" path is really connected.

🎉 Congrats — you've built a cloud network with your own hands, complete with public and private layers!

---

:::warning[🚑 Common traps: nearly every beginner hits these four]
- **You forget to delete the NAT gateway and the bill keeps climbing.** A NAT gateway **is billed per hour just for existing** (even with zero traffic), which can run to $20-30 a month. We deliberately chose "None" this time; if you created one by accident, **be sure** to delete it under VPC → NAT gateways — and **also release the Elastic IP it used**, since an Elastic IP not attached to a running resource is billed too.
- **The route table is misconfigured and nothing can get out.** Two most common causes: one, you **forgot to add the `0.0.0.0/0 → IGW` route** to the public route table; two, you **forgot to "associate" the public subnet with that table** (step 6), so the subnet is still on the main route table with no outbound route. When you can't get out, check these two first.
- **Poor CIDR planning you can't easily fix later.** A subnet CIDR **must fall inside the VPC range and not overlap** other subnets; a VPC's CIDR **cannot be shrunk or freely changed** once created. Do not slice the VPC too small up front (e.g. a `/24`), or you will run out of IPs when adding subnets later. Prefer a large range like `/16`.
- **A security group or NACL locks you out of your own instance.** Even with routing all correct, **if a Security Group or Network ACL (NACL) blocks the traffic, you still cannot connect**. When you cannot reach the EC2, confirm the security group's **Inbound rules** allow the connection you want (EC2 Instance Connect needs an inbound rule for the right source); a NACL is a firewall at the subnet level, open by default, but if you have edited it, remember it **must allow both directions separately** (unlike a security group, it does not automatically remember the return trip).
:::

:::warning[🧹 Always clean up! Skipping this keeps charging you for NAT/EIP and similar resources]
A VPC itself is free, but this lab can involve **some billable resources** (e.g. a NAT gateway if you created one by mistake, or an EC2 you forget to shut down). Remove everything in order:

**1. Terminate the test EC2 first**
- Go to `EC2` → select `vpc-test` → **Instance state › Terminate instance** → confirm.
- Note it's **Terminate**, not just **Stop**; only when the state becomes `Terminated` is it truly deleted.

**2. Delete the VPC (the wizard's related resources are deleted along with it)**
- Go to `VPC` → **Your VPCs** → select `my-first-vpc` → **Actions › Delete VPC**.
- If you built it with the **VPC and more** wizard, the console will **list and delete together** the subnets, route tables, IGW, and other resources it created — just type `delete` to confirm as prompted.
- If you built it by hand (Option B), you may need to detach and delete the IGW manually before deleting the VPC — follow the console prompts.

**3. Check the Billing page to confirm nothing keeps charging**
- Top-right account menu → **Billing and Cost Management** → review **Free Tier** usage and your current bill, confirming there are no still-billing items like NAT gateways, Elastic IPs, or EC2.
:::

<Cost title="💰 Cost note">

**The VPC, subnets, route tables, and Internet Gateway are all free.** There are only two places this lab might actually charge you: one is a **NAT gateway** (billed per hour plus traffic, which is why we deliberately chose "None"), the other is an **EC2 you forget to terminate**. Keep NAT set to "None" and clean up when you're done, and you basically won't incur charges. Remember: **if you turned it on, remember to turn it off.**

</Cost>

---

## Why this matters for the exam

Don't underestimate this network foundation — **the VPC is the shared base for both SAA Domain 1 (Security) and Domain 2 (High Availability and Resilience)**:

- **Security (D1)**: locking databases and backends into **private subnets** while keeping only the web tier in public subnets is the classic "minimize the exposed surface" pattern. Questions often test "a database shouldn't have a public IP" and "what belongs in a private subnet."
- **High availability (D2)**: spreading subnets **across multiple AZs** is the prerequisite for nearly every high-availability architecture (multi-AZ deployments, load balancing, database failover). Whenever a question mentions "improve availability / fault tolerance," the answer often involves cross-AZ subnet design.

Master the VPC and you've laid the shared groundwork for both exam domains at once.

<Refs title="📚 Official docs & further reading">

- [What is Amazon VPC](https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html)
- [Create a VPC and other resources](https://docs.aws.amazon.com/vpc/latest/userguide/create-vpc.html)
- [Subnets for your VPC](https://docs.aws.amazon.com/vpc/latest/userguide/configure-subnets.html)
- [Internet gateways](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Internet_Gateway.html)

</Refs>

👉 Next lab: [Let EC2 Access S3 with an IAM Role](./iam-role-ec2-s3.md)
