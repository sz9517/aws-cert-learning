---
sidebar_position: 4
title: "Cloud Technology & Services"
---

# Cloud Technology & Services

> This is the single largest domain on the CLF exam (about 34%). Don't let the name scare you—this chapter doesn't ask you to *configure* anything. It only asks you to **recognize "which service does what,"** plus a handful of foundational ideas that hold all of AWS together.

<Analogy title="🧰 Analogy: just know what each tool in the box is for">

Picture opening a big toolbox for the first time: screwdrivers, wrenches, a drill, tape... you can't memorize it all at once. But you don't need to *use* every tool—you just need to know "grab a screwdriver for screws, grab the drill for holes" and pick the right one when the time comes.

This domain is the same. AWS has hundreds of services, and at the CLF level you only need to **recognize what problem each "headline" service solves**—not dive into selection criteria and tuning. This chapter walks you through that toolbox once.

</Analogy>

:::note[💬 How to read this chapter]
The core services below are shown as "one small table per category (Service | One-line purpose)." For now, just getting a vague sense is enough—no need to cram. When you see a term with a <Term desc="Like this! Hover over the dotted-underline term (tap on mobile) and a plain-language explanation pops up.">dotted underline</Term>, hover over it for a plain-language explanation.
:::

## 1. Global Infrastructure: Regions, AZs, Edge Locations

Every AWS service runs on physical data centers, and how those data centers are laid out is exactly what makes the cloud "stable and fast." Just remember three levels, largest to smallest.

| Level | Plain explanation | Why it matters |
| --- | --- | --- |
| **<Term en="Region" desc="A geographic area where AWS operates, such as Tokyo or Singapore; each Region runs independently.">Region</Term>** | A large block of infrastructure in a geographic location (e.g., Tokyo, Singapore) | Picking a Region near your users lowers latency; regulations often require data to stay within a country |
| **<Term en="Availability Zone" desc="One or more independent data centers within a Region, each with its own power, cooling, and networking.">Availability Zone (AZ)</Term>** | Several mutually independent data centers inside one Region | Deploy across multiple AZs so that if one data center fails, another keeps going (high availability) |
| **<Term en="Edge Location" desc="Small AWS sites spread across cities worldwide, far more numerous than Regions, used mainly by CloudFront to cache content closer to users.">Edge Location</Term>** | Many small, close-to-user sites spread worldwide | Caches content nearest to users for faster loading (used by CloudFront) |

:::info[🏗️ Why this matters: high availability + proximity]
- **High availability (fault tolerance):** don't put all your eggs in one basket. Deploy resources **across multiple AZs** so that if one fails, the others survive.
- **Proximity (low latency):** put resources near your users for faster connections; global users can also pull content from the nearest **edge location**.

One line to remember: **Region > Availability Zone (AZ) > Edge Location**—largest to smallest, farthest to nearest.
:::

## 2. Ways to Access AWS: Console, CLI, SDK, IaC

For the same task, AWS offers several "entry points," because **different situations suit different people**.

| Method | What it is | Who / when it suits |
| --- | --- | --- |
| **<Term en="Management Console" desc="AWS's web-based graphical interface; log in with a browser and click to operate.">Console</Term>** | A browser-based graphical interface you click through | Beginners, exploring, quick lookups—you see the whole picture without memorizing commands |
| **<Term en="Command Line Interface" desc="A command-line interface: type commands to operate AWS instead of clicking buttons.">CLI</Term>** | Type `aws` commands in a terminal | People doing repetitive operations or scripting automation |
| **<Term en="Software Development Kit" desc="Software development kits: language libraries that let your code call AWS services directly.">SDK</Term>** | Language libraries that let your code call AWS directly | Developers integrating AWS features inside an application |
| **<Term en="Infrastructure as Code" desc="Infrastructure as Code: define an entire environment in code so it can be rebuilt with one command.">IaC</Term>** | Define a whole environment in code (e.g., CloudFormation) | Deploying entire environments at scale, repeatably, with version control |

<Analogy title="💡 Analogy: several ways to change the TV channel">

To switch the TV to channel 5, you could **walk over and press the TV's buttons** (Console), **grab the remote** (CLI), **ask an app to press it for you** (SDK), or **write a script that switches it every night automatically** (IaC). None is "higher-class"—it's just about which fits the situation best.

</Analogy>

:::note[📝 Quick note]
**CloudFormation** is AWS's native IaC tool: you write a "blueprint" template, and it builds the whole set of resources at once—rebuilding or tearing it all down is also one command. At the CLF level, just recognize the idea "want to repeatably deploy a whole environment → use IaC (CloudFormation)."
:::

## 3. Core Service Categories at a Glance

Now let's organize the most common services by "category." **For now, just recognizing "which service does what" is enough**—leave the deeper selection and configuration for hands-on work or advanced exams.

### 🖥️ Compute: where your code "runs"

| Service | One-line purpose |
| --- | --- |
| **<Term en="Elastic Compute Cloud" desc="A cloud server you rent on AWS where your code runs.">EC2</Term>** | Rent a whole cloud server, install your own environment, full control |
| **<Term en="AWS Lambda" desc="Serverless compute, triggered by events and billed by usage.">Lambda</Term>** | Serverless: no servers to manage—write a function, it runs when an event fires |
| **<Term en="Elastic Container Service / Elastic Kubernetes Service" desc="AWS container orchestration services; EKS is managed Kubernetes.">ECS/EKS</Term>** | The control center that orchestrates a bunch of "containers" (deploy with Docker/Kubernetes) |
| **<Term en="AWS Elastic Beanstalk" desc="A platform service that takes your code and automatically provisions and manages the underlying resources.">Elastic Beanstalk</Term>** | Hand it your code; it provisions and manages the underlying environment for you |

### 💾 Storage: where your files "live"

| Service | One-line purpose |
| --- | --- |
| **<Term en="Simple Storage Service" desc="AWS object storage for images, backups, reports, and more.">S3</Term>** | A nearly unlimited cloud file warehouse (object storage) |
| **<Term en="Elastic Block Store" desc="A cloud disk (block storage) attached to a single EC2 instance.">EBS</Term>** | A "cloud disk" attached to one EC2 instance |
| **<Term en="Elastic File System" desc="A file system that multiple servers can mount and share at the same time.">EFS</Term>** | A network file system multiple servers can share at once |
| **<Term en="AWS Storage Gateway" desc="A hybrid storage service that connects on-premises environments to AWS cloud storage.">Storage Gateway</Term>** | A "hybrid storage" gateway bridging on-prem data centers and cloud storage |

:::info[🔑 An easy-to-confuse difference]
**EBS attaches to just one EC2 instance at a time (like an external drive); EFS can be mounted and shared by many instances at once (like a network drive).** S3, by contrast, is an object warehouse for whole files—not a disk attached to a machine.
:::

### 🗄️ Database: where structured data lives and how you query it

| Service | One-line purpose |
| --- | --- |
| **<Term en="Relational Database Service" desc="A managed relational database, such as MySQL or PostgreSQL.">RDS</Term>** | A managed traditional (relational) table-based database—no self-maintenance |
| **<Term en="Amazon Aurora" desc="AWS-built, MySQL/PostgreSQL-compatible high-performance relational database.">Aurora</Term>** | A supercharged RDS—faster, with storage that grows automatically |
| **<Term en="Amazon DynamoDB" desc="Serverless NoSQL with single-digit-millisecond latency and near-unlimited scaling.">DynamoDB</Term>** | A blazing-fast NoSQL database with no machines to manage |

### 🌐 Networking & Delivery: how traffic comes in and gets delivered

| Service | One-line purpose |
| --- | --- |
| **<Term en="Virtual Private Cloud" desc="Your own private virtual network inside AWS.">VPC</Term>** | Your own private network inside AWS (the foundation of every architecture) |
| **<Term en="Amazon Route 53" desc="AWS's DNS service that resolves domain names to resources.">Route 53</Term>** | AWS's DNS—points domain names to your resources |
| **<Term en="Amazon CloudFront" desc="A content delivery network (CDN) that caches content at edge locations worldwide.">CloudFront</Term>** | A CDN: caches content around the world to deliver it from nearby |
| **<Term en="Elastic Load Balancing" desc="A load balancer that spreads traffic across multiple backends.">ELB</Term>** | Spreads incoming traffic evenly across multiple servers (high availability) |

### 🚀 Deployment & Management: how to provision, monitor, and track who did what

| Service | One-line purpose |
| --- | --- |
| **<Term en="AWS CloudFormation" desc="An IaC service that defines and automatically creates a whole set of AWS resources from a code template.">CloudFormation</Term>** | Build a whole set of resources with one template (code)—IaC |
| **<Term en="Amazon CloudWatch" desc="A monitoring service that collects metrics and logs and triggers alarms.">CloudWatch</Term>** | The system "dashboard": view metrics, logs, and set alarms |
| **<Term en="AWS CloudTrail" desc="An audit log that records every API action in the account.">CloudTrail</Term>** | The "dashcam": records who did what, and when |

:::info[🔍 Don't mix up CloudWatch and CloudTrail]
**CloudWatch tells you "how the system is performing" (metrics, logs); CloudTrail tells you "who did what" (auditing).** One is like a dashboard, the other like a dashcam.
:::

## 4. Technical Support & Learning Resources

When you hit a problem, AWS offers several channels to find answers and health-check your environment.

| Resource | One-line purpose |
| --- | --- |
| **AWS Documentation** | The official manual: setup, examples, and best practices for every service |
| **Knowledge Center** | An official FAQ collection—follow the steps to solve most common issues |
| **<Term en="AWS Trusted Advisor" desc="An advisor that automatically inspects your account and offers optimization recommendations on cost, security, performance, and more.">Trusted Advisor</Term>** | Automatically health-checks your account with cost, security, and performance advice |

:::tip[💡 Common CLF exam points]
This domain tests "recognition," not "mastery." Focus on these:

- **Which service does what:** given a service name, say which category it's in and what problem it solves (e.g., S3 stores files, RDS is a relational database, CloudFront is a CDN).
- **Region/AZ concepts:** want "high availability" → think **across multiple AZs**; want "proximity, low latency" → think the right Region plus edge locations.
- **Benefits of serverless (Lambda):** no servers to manage, pay per actual usage, and it scales automatically with traffic.
- **Managed services reduce operations:** services like RDS and DynamoDB are **managed services** that hand patching, backups, and scaling to AWS, so you spend less effort on operations.
:::

<Refs title="📚 Official docs & further reading">

- [AWS Global Infrastructure overview](https://aws.amazon.com/about-aws/global-infrastructure/)
- [AWS Cloud Products (all service categories)](https://aws.amazon.com/products/)
- [AWS Documentation home](https://docs.aws.amazon.com/)
- [AWS Knowledge Center](https://repost.aws/knowledge-center)
- [AWS Trusted Advisor overview](https://aws.amazon.com/premiumsupport/technology/trusted-advisor/)

</Refs>

👉 Next domain: [Billing, Pricing & Support](./billing-pricing-support.md)
