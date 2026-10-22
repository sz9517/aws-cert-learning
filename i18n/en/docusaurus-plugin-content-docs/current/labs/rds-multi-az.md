---
sidebar_position: 5
title: "Lab 5: Test RDS Multi-AZ Failover"
---

# Lab 5: Test RDS Multi-AZ Failover

> You've read that "Multi-AZ fails over automatically" — but reading about it is never the same as watching it happen. In this lab you'll **spin up a Multi-AZ RDS instance and then deliberately knock the primary over**, and watch RDS promote the standby in another Availability Zone within minutes — all while **the connection endpoint stays exactly the same**. Do this once and the Domain 2 "high availability" idea will stick for good.

<Analogy title="🏢 Analogy: the live-synced ledger in the shop next door">

Picture the primary database as the **master ledger** the store manager writes in every day. The Multi-AZ standby is a **live, entry-by-entry copy kept in the safe of the shop next door**. When this store catches fire (an AZ fails), that copy instantly becomes the master and business carries on — that's **failover**. This time we won't wait for a fire; we'll run a drill: manually trigger one failover and see it with our own eyes.

</Analogy>

:::info[Before you start]
This lab assumes you've already done the prep:

- You've completed [Your first hands-on: EC2 + S3](../intro/first-hands-on.md) and are comfortable moving around the console.
- You've **set up a Billing Alarm** so you get notified if spending crosses a threshold.
- You're staying in **one Region** for the whole lab, so you don't lose track of what you created.
:::

:::warning[💸 This lab is different: it will likely cost you a little]
The EC2 + S3 lab stayed inside the Free Tier, but **RDS is much easier to push past the Free Tier**, so set your expectations:

- The RDS Free Tier has a **monthly cap (about 750 hours of a single-AZ `db.t3.micro` / `db.t4g.micro` plus 20 GB of storage)**. The moment you **enable Multi-AZ you are running two instances**, which can eat through that cap and start billing you.
- Even at the smallest size and even if you leave it running for only a few hours, this lab **may produce a small charge**. Think of it as "paying a little for one real experience" — decide for yourself.
- To keep costs down: **create it as single-AZ first, confirm you know the steps, then switch it to Multi-AZ**; or finish and delete the whole thing **within an hour or two**.

The one rule that matters most: **delete it when you're done — don't let it quietly bill you in the background.** (Cleanup steps are at the end.)
:::

## In plain words: what is Multi-AZ, and how is it different from a Read Replica?

- **Multi-AZ**: a **synchronously replicated** standby in **another Availability Zone in the same Region** (a write isn't "done" until both copies succeed). You **can't read from it** under normal operation — it just stands by. If the primary goes down, RDS **fails over automatically**, promoting the standby to the new primary. Its purpose is **high availability**.
- **Read Replica**: one or more **asynchronous** copies used specifically to **spread out read traffic**. It does **not** fail over automatically (if the primary dies it won't take over on its own). Its purpose is **scaling reads**.

Remember it in one line: **Multi-AZ guards against "going down"; a Read Replica solves "reads are too slow."** The exam loves to blur these two together.

## Hands-on: create a Multi-AZ RDS and manually trigger a failover

Goal: launch a Multi-AZ RDS, note the writer endpoint, then manually trigger one failover and watch it switch to the other AZ.

### Step 1: Create an RDS instance with Multi-AZ enabled

1. Log in to the AWS console → confirm the **Region** in the top-right → type `RDS` in the search bar → open the RDS service.
2. Click **Create database**.
3. For the creation method choose **Standard create**.
4. **Engine type**: choose **MySQL** or **PostgreSQL** (either is fine; the example below uses MySQL).
5. **Templates**: choose **Dev/Test** (for practice, cheaper).
6. **Availability and durability**: this is the point of the whole lab — choose **Multi-AZ DB instance deployment (creates a standby instance)**. This step spins up a synchronous standby in another AZ for you.
7. **Settings**: set a DB identifier (e.g. `lab5-multiaz`), a master username, and a password — write the password down, you'll need it to connect later.
8. **Instance configuration**: choose `db.t3.micro` (or `db.t4g.micro`), and look for the **Free tier eligible** label.
9. **Storage**: leave the default minimum (e.g. 20 GB of general-purpose SSD).
10. **Connectivity**: keep the **default VPC**; to make the optional EC2 verification easier, you can put the RDS and the EC2 in the **same VPC**. Beginners can leave this at the defaults.
11. Leave everything else at the defaults → click **Create database**.

:::tip[💡 A cheaper approach]
You can also pick **Single-AZ** in step 6 first, get the database up, confirm you can do the steps, and then go to **Modify** to switch it to Multi-AZ. That way you're only running one instance up front — handy when you really want to save money. You only need the failover test below after switching to Multi-AZ.
:::

### Step 2: Wait for it to finish, then note the writer endpoint

12. Back in the database list, wait for the **Status** to go from `Creating` to **`Available`** (Multi-AZ takes longer to create — 10 minutes or more, so be patient).
13. Click into the database → on the **Connectivity & security** tab, find the **Endpoint**, which looks like this:

```bash
lab5-multiaz.abcd1234.ap-northeast-1.rds.amazonaws.com
```

14. On the **Configuration** tab, confirm **Multi-AZ: Yes**, and note the **Availability Zone the primary is currently in (e.g. ap-northeast-1a)** — after the failover this will change to the other one.

### Step 3: Manually trigger a failover (Reboot with failover)

This is the key "drill" step: instead of waiting for a real failure, you make RDS switch to the standby on purpose.

15. In the database list, select your instance → **Actions › Reboot**.
16. In the dialog that appears, **check "Reboot with failover"** → confirm.
17. Watch the **Status** change to `Rebooting`, then return to `Available`.
18. Click into the database → look at the **Events** tab, where you'll see entries like **"Multi-AZ instance failover started / completed"**, proving a failover really did happen.
19. Back on the **Configuration** tab, check the **Availability Zone** — the primary has now **moved to the other AZ (e.g. from ap-northeast-1a to ap-northeast-1c)** — yet your **endpoint hasn't changed one character**.

:::info[🎯 This is the whole point of Multi-AZ: the endpoint doesn't change]
Notice what just happened: the primary actually switched to **a different machine in a different Availability Zone**, but the **endpoint you connect to didn't change at all**. Under the hood RDS repointed that endpoint at the new primary. This means your **application doesn't need to change its connection string or be redeployed** — the failover is nearly invisible to the app. That's exactly why Multi-AZ is such a clean high-availability solution.
:::

### Step 4 (optional): Verify by connecting from an EC2 instance

For an even more concrete feel, connect from an EC2 instance in the same VPC (remember to let the RDS security group accept the database port from that EC2 — MySQL's default is 3306):

```bash
# From the EC2, connect to MySQL using the endpoint (swap in your endpoint and username)
$ mysql -h lab5-multiaz.abcd1234.ap-northeast-1.rds.amazonaws.com -u admin -p

# Once in, check the version to confirm you're really connected
mysql> SELECT VERSION();
```

When a failover happens the connection **drops briefly**, but reconnecting with the **same endpoint** fixes it immediately — an app with basic reconnect logic rides right through it.

## The most important step: clean up so you don't get billed

:::warning[🧹 Delete the RDS instance when you're done! Multi-AZ is two instances — leaving it running keeps billing you]
Unlike EC2, "stopping" RDS doesn't save you much — **as long as the instance exists it's billing you**, and Multi-AZ is double. Make sure you delete it:

**1. Delete the RDS instance**
- Go to `RDS` → database list → select `lab5-multiaz` → **Actions › Delete**.
- The dialog asks whether to **Create final snapshot** — you don't need to keep practice data, so **uncheck "Create final snapshot"** to avoid paying storage for a leftover snapshot.
- (Uncheck any "retain automated backups" option too.)
- Type the required confirmation text → **Delete**. Wait for the status to become `Deleting` and finally disappear from the list.

**2. Double-check for leftover snapshots**
- In the left menu click **Snapshots** and confirm no unwanted manual snapshot is still sitting there racking up storage charges.

**3. Confirm billing has stopped**
- Top-right account menu → **Billing and Cost Management** → check the current bill and **Free Tier** usage, and confirm the RDS line isn't still growing.

(If you launched an EC2 for the verification step, remember to **Terminate** that too.)
:::

<Cost title="💰 Cost reminder">

The biggest difference between this lab and the EC2 + S3 one is that **RDS easily exceeds the Free Tier**. The 750 free hours are counted for a **single-AZ** instance, so once you enable **Multi-AZ you're running two instances** and may start getting billed right away. Even at the smallest `db.t3.micro` / `db.t4g.micro` size, and even for only a few hours, this lab **may still produce a small charge**. To save money, **create it single-AZ first, test the failover, then delete it**, and **delete the instance the moment you're done (skipping the final snapshot)**. In one line: **if you turn it on, remember to turn it off.**

</Cost>

## What this means for the exam

Domain 2, "Design high-availability architectures," tests this comparison almost every time — and it's designed to trip you up:

- When a question says "**improve availability / automatic failover / stay up even if a data center fails / minimize downtime**" → choose **<Term en="Multi Availability Zone" desc="A live, synchronous standby in another AZ in the same Region; fails over automatically when the primary fails, and the endpoint stays the same.">Multi-AZ</Term>**.
- When a question says "**too much read traffic / reporting queries are dragging the database down / offload reads from the primary**" → choose a **<Term en="Read Replica" desc="A read-only, asynchronously replicated copy of the database used to spread query traffic; it does not fail over automatically.">Read Replica</Term>**.
- Memorize two lines and you'll nail it: **Multi-AZ does not serve reads; a Read Replica does not guarantee high availability.** You've now watched "endpoint unchanged, AZ switched" with your own eyes — you won't miss this one again.

<Refs title="📚 Official docs & further reading">

- [AWS Docs: Multi-AZ deployments for RDS](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZ.html)
- [Rebooting a DB instance (reboot with failover)](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_RebootInstance.html)
- [Working with RDS Read Replicas](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ReadRepl.html)
- [Deleting a DB instance](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_DeleteInstance.html)

</Refs>

👉 Labs complete! Go test yourself: [the 65-question Full Mock Exam](../saa/exam-prep/mock-exam.md)
