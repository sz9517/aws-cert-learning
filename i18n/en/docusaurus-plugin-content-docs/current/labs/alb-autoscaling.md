---
sidebar_position: 3
title: "Lab 3: A Highly Available Site with ALB + Auto Scaling"
---

# Lab 3: A Highly Available Site with ALB + Auto Scaling

> In this lab you'll build, with your own hands, a website that **stays up even when a server dies, and grows more servers automatically when traffic spikes**. Once you've seen it happen in front of you, Domain 2's favorite topic — **elasticity and high availability** — stops being something you memorize and becomes something you understand.

:::note[💬 Reading tip]
Whenever you see a term with a <Term desc="Like this! Hover over any dotted term (tap on mobile) and a plain explanation pops up.">dotted underline</Term>, hover over it for a plain-language explanation. All terms are also collected in the [Glossary & Services](/glossary).
:::

## What are we building this time?

In the intro hands-on, you launched a single EC2 instance. But "just one" has two fatal flaws: **if that one dies, the whole site goes dark**, and **when traffic spikes, that one gets crushed**. This lab adds the two pieces that fix both:

- **<Term en="Application Load Balancer" desc="A layer-7 load balancer that understands HTTP and spreads traffic across multiple healthy backend servers.">ALB</Term>**: the front desk that spreads traffic across several servers and automatically skips any that are broken.
- **<Term en="Auto Scaling Group" desc="A group that automatically adds or removes EC2 instances based on the size and conditions you set.">ASG</Term>**: the thing in charge of "how many servers there should be" — it replaces dead ones and grows new ones when traffic rises.

Put together, they give you a highly available website that **spans multiple Availability Zones, heals itself, and scales automatically**.

<Analogy title="🍜 Analogy: a ramen chain that never closes">

- **Target Group** = the brand's "list of branches currently open for business".
- **ALB (the host/greeter)** = when a customer walks in, they're taken to a branch on the list that is "still open and has a free table".
- **Launch Template** = the "standard playbook for opening a new branch": same decor, same menu, same equipment — every branch comes out identical.
- **ASG (head office's expansion policy)** = sets "the fewest branches to keep open, the usual number, and the most we'll ever open". If a branch shuts down, head office immediately opens a new one from the playbook to replace it.
- **Health Check** = head office periodically calls each branch to ask "still open?" — any branch that doesn't pick up is pulled off the greeter's list.

Customers only ever deal with the greeter and never need to know which branch they were sent to — that's high availability.

</Analogy>

:::info[Before you start]
This lab assumes you already have these safety nets and foundations in place:

- You've completed the **intro hands-on** (launched an EC2, created an S3 bucket, and know how to switch **Region** in the console).
- You have a **VPC with at least two subnets across two different Availability Zones (AZs)**. Your account's built-in **default VPC** usually already has one subnet per AZ, so you can just use it; if you'd rather build your own, see the two-AZ setup in "Lab 1: Build Your Own Private Network with a VPC".
- You've **set up a Billing Alarm** so you get notified if spend crosses your threshold.

Not there yet? Go back and finish those first — they're your last line of defense against a surprise bill.
:::

## Plain-language glossary first

Before touching anything, let's walk through the five terms that will keep showing up:

- **Target Group**: the list of "servers that should receive traffic" sitting behind the ALB. The ALB doesn't serve requests itself; it just hands each request to a healthy member of this list.
- **Application Load Balancer (ALB)**: the front desk between your users and your backend. It spreads (balances) HTTP traffic across the machines in the target group. It gives you a **DNS name**, not a fixed IP.
- **Launch Template**: a "spec sheet for launching new machines" — which AMI, which instance type, which security group, and what commands to run at boot. When the ASG needs to add a machine, it builds it from this template.
- **Auto Scaling Group (ASG)**: in charge of "maintaining the number of machines you asked for". You set **minimum / desired / maximum**, and the ASG continually pulls the actual count back to the **desired** value; lose one, and it launches a replacement — that's **self-healing**.
- **Health Check**: the ALB (and the ASG) periodically "knock on the door to ask if you're alive". Only machines that respond correctly count as healthy and receive traffic; broken ones get pulled off the list.

<Analogy title="🏢 Why does spanning multiple AZs give you high availability?">

An **Availability Zone (AZ)** is a physically separate data center. If all your machines are crammed into one AZ, a single power outage there takes you down. Spreading machines across **two or more AZs** is like putting your eggs in different baskets: if one AZ fails, the machines in the other keep serving, and the ALB automatically routes all traffic to the side that's still alive. This is the iron rule of AWS high-availability design — **always span at least 2 AZs**.

</Analogy>

---

## Hands-on: four steps to a highly available site

Stay in the same **Region** throughout (for example, Asia Pacific (Tokyo) ap-northeast-1) so you don't lose track of the things you create.

### Step 1: Create a simple Launch Template

Goal: write a "spec sheet for launching machines" so that every new machine, the moment it boots, turns itself into a web server that shows its own hostname.

1. Sign in to the AWS console → confirm the **Region** top-right → search for `EC2` → open the EC2 service.
2. In the left menu find **Launch Templates** → **Create launch template**.
3. **Name**: something recognizable, e.g. `ha-web-template`.
4. **Application and OS Images (AMI)**: choose **Amazon Linux** (usually "Amazon Linux 2023", marked "Free tier eligible").
5. **Instance type**: choose **t2.micro or t3.micro**, confirming the "Free tier eligible" label.
6. **Key pair**: you won't be connecting in yourself this time, so you can choose **without a key pair**.
7. **Network settings › Security Group**: create or pick a security group that **allows HTTP (port 80)** inbound (so the ALB can reach the machine).
8. Expand **Advanced details**, and at the very bottom paste the following boot script into **User data** — it installs `httpd` at boot and shows this machine's hostname:

```bash
#!/bin/bash
# Install and start Apache (httpd)
dnf install -y httpd
systemctl enable --now httpd
# Write this machine's hostname into the homepage so a refresh reveals which one is serving
echo "<h1>Hello from $(hostname -f)</h1>" > /var/www/html/index.html
```

9. Click **Create launch template**.

:::tip[💡 Why print the hostname on the homepage?]
Because in a moment you'll connect through the ALB, and the ALB spreads each request across different machines. Printing the **hostname** on the homepage lets you see with your own eyes "which machine answered me this time" — refresh a few times, watch the name change, and you've proven that **load balancing is actually working**.
:::

### Step 2: Create an Auto Scaling Group across two AZs

Goal: use that template to launch a group of "at least 2 machines, spread across two AZs, that replace themselves when one dies".

1. In the EC2 left menu click **Auto Scaling Groups** → **Create Auto Scaling group**.
2. **Name**: e.g. `ha-web-asg`; for **Launch template** pick the `ha-web-template` you just made → Next.
3. **Network**: choose your **VPC**, and in the subnets field **select two subnets in two different AZs** (this step is the key to high availability) → Next.
4. **Load balancing**: for now choose **No load balancer** — we'll build the ALB in the next step and come back to attach it (this keeps the steps clearer).
5. **Group size**:
   - **Minimum capacity**: `2`
   - **Desired capacity**: `2`
   - **Maximum capacity**: `4`
6. Leave everything else at defaults → **Create Auto Scaling group**.
7. Once created, go to the **Instances** list and confirm: the ASG has automatically launched **2 machines**, and they land in **two different AZs**.

```bash
# Confirm how many the ASG launched and which AZ each is in (use your group name)
aws autoscaling describe-auto-scaling-groups \
    --auto-scaling-group-names ha-web-asg \
    --query "AutoScalingGroups[0].Instances[].{Id:InstanceId,AZ:AvailabilityZone,State:LifecycleState}"
```

### Step 3: Create the ALB and target group, then attach the ASG

Goal: put an ALB in front of the machines as the front desk, and wire the ASG up behind it.

1. In the EC2 left menu click **Target Groups** → **Create target group**.
2. Choose target type **Instances**; set **protocol/port** to `HTTP:80`; pick your **VPC**; set the **health check path** to `/` → Create. **Don't add machines manually here** — the ASG will register them automatically in a moment.
3. Back in the left menu go to **Load Balancers** → **Create Application Load Balancer**.
4. **Scheme**: choose **Internet-facing**.
5. **Network mapping**: pick the same VPC and **select the same two AZs/subnets as the ASG** (the two sides must line up).
6. **Security group**: choose one that **allows HTTP (port 80) inbound from the internet**.
7. **Listener**: `HTTP:80` → forward to the target group you created in step 3 → **Create load balancer**.
8. Finally, attach the ASG: go to **Auto Scaling Groups › `ha-web-asg` › Edit**, in the **Load balancing** section choose **attach to an existing target group**, pick the target group you just made, and save. From now on, every machine the ASG launches will **automatically register** with this target group.

### Step 4: Connect via the ALB's DNS name and see load balancing in action

1. Go to **Load Balancers** and copy your ALB's **DNS name** (it looks like `ha-web-alb-xxxx.ap-northeast-1.elb.amazonaws.com`).
2. First check in the **target group** that both machines have turned **healthy** (right after creation it may take a minute or two for the health check to pass).
3. Paste the ALB's DNS name into your browser, and you'll see `Hello from ip-xxx...`.
4. **Refresh a few times** (or Ctrl/Cmd + Shift + R to force-refresh), and you'll see the **hostname switch between the two machines** — proof that the ALB really is **spreading** your requests across different servers.

```bash
# Check the target group's health status at any time; broken targets show as unhealthy
aws elbv2 describe-target-health \
    --target-group-arn <your-target-group-ARN>
```

---

## Verify high availability: deliberately kill a machine

This is the most satisfying step of the whole lab — we kill a machine by hand and watch the system heal itself.

1. Go to **EC2 › Instances**, pick a machine that's currently `running` → **Instance state › Terminate instance** → confirm.
2. Immediately switch back to your browser and **keep refreshing** that ALB DNS URL. You'll notice the site **never goes down** — it just starts returning only the hostname of the other (still-alive) machine, because the ALB's **health check** noticed the dead one stopped responding and routed all traffic to the healthy one.
3. A minute or two later, check the **Auto Scaling Group**'s activity history and instance list: the ASG saw the actual count (1) drop below the **desired capacity (2)**, so it **automatically launched a fresh machine from the launch template** to replace it. Once that one passes its health check, the target group is back to 2 healthy.

:::info[The three things you just watched happen]
1. **The ALB automatically avoided the broken target** — users felt nothing, service never stopped.
2. **The ASG automatically restored the count to desired** — this is **self-healing**.
3. The whole time **you didn't lift a finger to launch a machine** — that's the power of elasticity and high availability.
:::

---

## The most important step: clean up to avoid charges

:::warning[🧹 Always clean up when you're done — and order matters!]
Clean up what you created **in this order**; get the order wrong and it'll either keep replacing machines or refuse to delete:

**1. Delete the Auto Scaling Group first (this automatically terminates the instances it launched)**
- Go to **EC2 › Auto Scaling Groups** → select `ha-web-asg` → **Delete** → type to confirm.
- Once the ASG is gone, its EC2 instances are **terminated automatically** — you **don't** need to kill them one by one (and if you kill one by hand, the ASG just launches a replacement, which is exactly why you delete the ASG first).

**2. Delete the Application Load Balancer**
- Go to **EC2 › Load Balancers** → select your ALB → **Actions › Delete** → type to confirm.

**3. Delete the target group**
- Go to **EC2 › Target Groups** → select the one you made → **Actions › Delete**.

**4. Delete the launch template**
- Go to **EC2 › Launch Templates** → select `ha-web-template` → **Actions › Delete template**.

**5. Confirm you're no longer being billed**
- Back in the **Instances** list, confirm those machines are all `Terminated`.
- In **Billing and Cost Management** (top-right of the console), confirm there are no leftover ALB or EC2 line items.
- **Special note**: the **ALB has no free tier**. It's billed by the **hour plus Load Balancer Capacity Units (LCU)**, so as long as it exists — even with nobody connecting — it charges by the hour. Always delete the ALB when you're done.
:::

:::note
Build the muscle memory of the cleanup order: **delete the ASG first, then the ALB and target group, and the template last**. There's one reason to delete the ASG first: its whole job is "keep the count at desired", so unless you dismiss it first, any machine you kill by hand just gets quietly replaced.
:::

<Cost title="💰 Cost reminder">

The `t2.micro`/`t3.micro` instances in this lab are within the **free tier**, but running 2–4 of them at once for a while can easily **exceed** your monthly free-tier hours. More importantly, the **ALB has no free tier at all** — it's billed by the hour and by LCU. So: **clean up the moment you finish**, and above all don't forget the ALB — it's the thing in this lab most likely to quietly burn money.

</Cost>

---

## Why this matters for the exam

One of Domain 2's (design resilient and high-performing architectures) favorite answer combinations is exactly what you just built by hand:

- Whenever a question mentions "**a single machine or single AZ failure must not interrupt service**", "**traffic spikes must scale automatically**", or "**must be self-healing**" — the correct answer is almost always **ALB + Auto Scaling across multiple AZs**.
- A common trap is **only attaching one AZ**: that defeats the whole point of high availability, and a single data-center outage still takes you down. Remember the iron rule: **both the ELB and the ASG must span at least 2 AZs**.
- Another easy point: the ASG **continually pulls the actual count back to the desired capacity**, so "a dead machine is replaced automatically" is its default behavior — no extra configuration needed.

You didn't just "memorize" this answer — you **watched it run in front of you**. That kind of memory is the one you can count on in the exam room.

<Refs title="📚 Official docs & further reading">

- [Application Load Balancer User Guide](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/introduction.html)
- [Amazon EC2 Auto Scaling User Guide](https://docs.aws.amazon.com/autoscaling/ec2/userguide/what-is-amazon-ec2-auto-scaling.html)
- [EC2 Launch Templates](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-launch-templates.html)
- [Attach a load balancer to your Auto Scaling group](https://docs.aws.amazon.com/autoscaling/ec2/userguide/autoscaling-load-balancer.html)
- [Target group health checks](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/target-group-health-checks.html)

</Refs>

👉 Next lab: [A Globally Accelerated Static Site with S3 + CloudFront](./static-site-cloudfront.md)
