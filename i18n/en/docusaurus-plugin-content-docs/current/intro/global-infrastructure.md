---
sidebar_position: 3
title: "Global Infrastructure: Regions, AZs & Edge"
---

# Global Infrastructure: Regions, AZs & Edge

> This page is the foundation for every service that follows. Once you understand how AWS lays out its "data centers" around the world, you'll see why designs go "multi-region/multi-zone", and why users experience fast or slow connections.

<Analogy title="💡 Analogy: a convenience-store chain's stores, shelves, and pickup points">

Picture a nationwide convenience-store chain:

- **Region** = a **big city** (e.g. "Taipei" or "Kaohsiung"). Each city stands on its own; the Taipei warehouse and the Kaohsiung warehouse don't interfere with each other.
- **Availability Zone (AZ)** = several **branch stores** within the same city, spread across different blocks, each with its own power and supply. If one branch loses power, the others keep trading.
- **Edge Location** = the **pickup point around the corner** — there are tons of them and they're right next to you, so you grab everyday items nearby instead of trekking to the big warehouse.

AWS's global infrastructure stacks these three layers — from big to small, from far to near — so your services stay both reliable and fast.

</Analogy>

## Why do we need "global" infrastructure?

<Scenario title="Scenario: your customers are spread across Taiwan, Japan, and the US">

Suppose your server only sits in the US. Every click from a user in Taiwan sends data halfway around the globe and back, so the page feels sluggish. And if that single US data center loses power, customers everywhere go offline at the same time.

Global infrastructure solves exactly these two pain points:

1. **Proximity (low latency)**: put servers close to your users so connections are fast.
2. **Fault tolerance (high availability)**: don't put all your eggs in one basket — if one place fails, others carry the load.

</Scenario>

:::note[💬 Reading tip]
Whenever you see a term with a <Term desc="Like this! Hover over any dotted term (tap on mobile) for a plain-language explanation.">dotted underline</Term>, hover over it for a plain-language explanation.

The three layers on this page, from largest to smallest, are: **Region > Availability Zone (AZ) > Edge Location**.
:::

## Region: the big geographic block

A <Term en="Region" desc="A geographic block of AWS infrastructure somewhere in the world, e.g. Tokyo, Singapore, N. Virginia; each Region operates independently.">Region</Term> is a large block of AWS infrastructure carved out at a geographic location — for example "Asia Pacific (Tokyo)", "Asia Pacific (Singapore)", or "US East (N. Virginia)".

**Each Region is completely independent**: resources you create in Tokyo won't automatically show up in Singapore, and data doesn't move across Regions on its own (unless you explicitly configure it). That independence is exactly what makes compliance and fault tolerance possible.

### How do you choose a Region? Four considerations

| Consideration | Plain explanation | Example |
| --- | --- | --- |
| **Latency (proximity)** | Pick the Region closest to your users for the fastest connection | Customers in Taiwan → choose Tokyo or Singapore |
| **Compliance / data residency** | Some laws require data to stay within specific borders | EU data is often required to live in a European Region |
| **Price** | The same service can cost differently per Region | Some Regions have lower unit prices |
| **Service availability** | New services don't launch in every Region at once | Want a new feature? Check whether that Region has it |

:::tip[💡 Practical advice for beginners]
When you're just practicing, stick to **one Region close to you** (e.g. Tokyo `ap-northeast-1` or Singapore `ap-southeast-1`). The most common beginner billing surprise is **creating resources in Region A, then looking for them in Region B**, assuming it failed — only to get billed in both.
:::

## Availability Zone (AZ): multiple independent data centers within a Region

Inside a single Region, there are actually several <Term en="Availability Zone" desc="A group of independent data centers within a Region; each has its own power, cooling, and networking, used for high availability.">Availability Zones (AZs)</Term>. Each AZ is one or more **independent data centers**, each with its own power, cooling, and networking. They're connected by high-speed private links — close enough for low latency, yet far enough apart that they won't fail together.

<Analogy title="🏢 Why deploy 'across AZs'?">

Running your website in just **one** AZ is like cramming all your employees into **one building** — if that building loses power or catches fire, the whole company stops.

Deploying your service across **two or more AZs** (this is called **Multi-AZ**) is like keeping a team in each of several buildings. If one goes down, another takes over instantly and customers barely notice.

</Analogy>

:::info[This is the heart of SAA]
The SAA exam hammers on **High Availability**. Whenever a question cares about "the service must survive even if a data center goes down", the standard answer direction is almost always: **deploy resources across multiple AZs**. Database "Multi-AZ failover" and load balancers spreading traffic across instances in multiple AZs are both built on this foundation.
:::

## Edge Location: the closest acceleration point to your users

An <Term en="Edge Location" desc="A small AWS site spread across cities worldwide, far more numerous than Regions, mainly used by CloudFront for content caching and proximity acceleration.">Edge Location</Term> is a **small site** AWS places in major cities worldwide, far more numerous than Regions. It's mainly used by the <Term en="Content Delivery Network" desc="A network that caches website content like images and videos at nodes closest to users, so pages load faster.">CDN</Term> service CloudFront to **cache** a website's images, videos, and static files **as close to the user as possible**.

<Scenario title="Scenario: a Taiwan user watching your US-hosted video">

Without Edge Locations: every playback pulls data from the US data center — slow and expensive.

With Edge Locations: after the video is watched once, it's **cached at an Edge Location in Taiwan**. The next Taiwanese viewer grabs it from around the corner (the Taiwan node) — instant playback, and you save on cross-border traffic too.

</Scenario>

### What's the difference? One table

| Layer | Count | Main purpose | In a nutshell |
| --- | --- | --- | --- |
| **Region** | Few (big blocks) | Deploy your main resources | The "city your HQ is in" |
| **Availability Zone (AZ)** | Several per Region | High availability, cross-data-center fault tolerance | "Branches in different blocks of the city" |
| **Edge Location** | Very many | CDN caching, proximity acceleration | The "pickup point around the corner" |

:::warning[🚑 A common conceptual mix-up]
**Edge Locations are not where you run your servers or databases.** Your EC2 instances and databases live **in the AZs of a Region**; Edge Locations only handle proximity tasks like caching and acceleration. Confusing the two is a classic beginner mistake.
:::

## 🛠️ Hands-on: switch Regions and view the AZs you have

No money needed — just explore the UI to feel these three layers:

1. Log in to the AWS console and look at the Region selector in the **top-right corner** (it shows something like "Tokyo" or "N. Virginia").
2. Open it and try **switching to a different Region** (say, from Tokyo to Singapore). You'll notice the instances and buckets you saw in Tokyo have "disappeared" over in Singapore — because **Regions are independent**, which is exactly the key point above.
3. Switch back to the Region you want to use. Go to the search bar, type `EC2` to open the service, and when you start creating an instance, the "Availability Zone" dropdown in the network settings shows **which AZs this Region currently has** (e.g. `ap-northeast-1a`, `1c`, `1d`).

You can also use the CLI to list the AZs in a Region directly (no charge):

```bash
# List the currently available AZs in the Tokyo Region
$ aws ec2 describe-availability-zones --region ap-northeast-1 \
    --query "AvailabilityZones[].ZoneName"
[
    "ap-northeast-1a",
    "ap-northeast-1c",
    "ap-northeast-1d"
]
```

See that? Tokyo alone has several AZs for you to deploy "across data centers".

## How this relates to the SAA exam

Global infrastructure is **the foundation of the entire SAA architecture mindset**:

- Talking about "high availability" → almost always comes back to **deploying across multiple AZs (Multi-AZ)**.
- Talking about "low latency and global user experience" → comes back to **choosing the right Region** plus **Edge Locations (CloudFront)**.
- Talking about "compliance and data residency" → comes back to **Region choice and independence**.

Burn these three terms and their size relationship into your memory first. Later, when you read about EC2, load balancing, database failover, and CloudFront, you'll find they all sit on top of this map.

<Refs title="📚 Official docs & further reading">

- [AWS Global Infrastructure overview](https://aws.amazon.com/about-aws/global-infrastructure/)
- [Regions, Availability Zones, and Local Zones (EC2 User Guide)](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-regions-availability-zones.html)
- [How Amazon CloudFront and Edge Locations work](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Introduction.html)

</Refs>

👉 Next: [The Shared Responsibility Model](./shared-responsibility.md)
