---
sidebar_position: 6
title: CLF Flashcards
---

# CLF Core Term Flashcards

This page turns the most frequently tested core terms of AWS Cloud Practitioner (CLF-C02) into flashcards. **Tap a card** to flip it open and see a plain-language explanation, with the full name spelled out for every abbreviation. Cards are grouped by the four exam domains, so this is the fastest way to review and lock in the concepts before the exam.

## Cloud Concepts

<Flashcards>
  <Flashcard term="Six Advantages of Cloud">Trade capital expense for variable expense, benefit from economies of scale, stop guessing capacity, increase speed and agility, stop spending on data centers, go global in minutes. Almost always tested.</Flashcard>
  <Flashcard term="CapEx to OpEx">Turn Capital Expenditure (a big upfront purchase of hardware) into Operating Expenditure (pay-as-you-go running costs).</Flashcard>
  <Flashcard term="Economies of Scale">Because AWS serves millions of customers, its huge purchasing power spreads costs out, so your unit price is lower than buying your own gear.</Flashcard>
  <Flashcard term="Elasticity">Resources scale out when demand rises and scale in when it drops, matching usage automatically so you never have to guess capacity.</Flashcard>
  <Flashcard term="Agility">Spin up a new server in minutes instead of waiting weeks for procurement and install, so ideas ship faster.</Flashcard>
  <Flashcard term="Public Cloud">Everything runs on AWS with no private data center involved. The most common deployment model.</Flashcard>
  <Flashcard term="Hybrid">Part runs on AWS and part stays in your own data center, with the two connected and used together. Common for gradual migration.</Flashcard>
  <Flashcard term="On-premises / Private Cloud">All resources are hosted in your own data center without public cloud. Also called Private Cloud.</Flashcard>
  <Flashcard term="TCO">Total Cost of Ownership, the full cost counting hardware, power, facilities and staff, used to compare build-it-yourself versus moving to the cloud.</Flashcard>
  <Flashcard term="Well-Architected 6 Pillars">The six review lenses for a sound architecture: operational excellence, security, reliability, performance efficiency, cost optimization, and sustainability.</Flashcard>
  <Flashcard term="Benefit of Shared Responsibility">The underlying facilities and hardware are handled by AWS, so you can focus on the business that actually makes money.</Flashcard>
</Flashcards>

## Security and Compliance

<Flashcards>
  <Flashcard term="Shared Responsibility Model">AWS secures the security OF the cloud (facilities, hardware); you secure your security IN the cloud (data, permissions, configuration).</Flashcard>
  <Flashcard term="IAM">Identity and Access Management, controlling who can use which AWS resources. The service itself is free.</Flashcard>
  <Flashcard term="IAM User">A long-term identity for a person or a program, with its own sign-in credentials.</Flashcard>
  <Flashcard term="IAM Group">Bundles several users together to grant permissions at once; a new member joining the group gets the permissions automatically.</Flashcard>
  <Flashcard term="IAM Role">An identity that can be assumed temporarily, handing out short-lived credentials. Use it for services like EC2 instead of scattering long-term keys.</Flashcard>
  <Flashcard term="IAM Policy">A JSON rule that defines which actions are allowed or denied. It takes effect when attached to a user, group, or role.</Flashcard>
  <Flashcard term="MFA">Multi-Factor Authentication, adding a one-time code on top of the password. Always enable it on the root account.</Flashcard>
  <Flashcard term="Least Privilege">Grant only the permissions that are just enough, no more. The go-to answer direction for permission questions.</Flashcard>
  <Flashcard term="In Transit vs At Rest Encryption">In Transit means data is encrypted with HTTPS/TLS while moving over the network; At Rest means data is encrypted while stored on disk.</Flashcard>
  <Flashcard term="KMS">Key Management Service, a central place to create, store, and rotate encryption keys.</Flashcard>
  <Flashcard term="CloudTrail">An audit log that records who did what API action in the account, used for investigation and compliance.</Flashcard>
  <Flashcard term="GuardDuty">An intelligent threat detection service that analyzes logs automatically to surface suspicious or malicious activity and alert you.</Flashcard>
  <Flashcard term="Artifact">The portal to download the compliance reports and agreements of AWS (such as SOC, ISO, PCI).</Flashcard>
</Flashcards>

## Technology and Services

<Flashcards>
  <Flashcard term="Region">An independent geographic area around the world, isolated from the others. Pick one close to users to lower latency.</Flashcard>
  <Flashcard term="AZ">Availability Zone, a physically isolated cluster of data centers inside a Region; deploying across AZs raises availability.</Flashcard>
  <Flashcard term="Edge Location">Cache points spread worldwide; CloudFront uses them to place content as close to users as possible for speed.</Flashcard>
  <Flashcard term="EC2">Elastic Compute Cloud, virtual servers in the cloud where you manage the operating system yourself. The most flexible compute service.</Flashcard>
  <Flashcard term="Lambda">Serverless compute where you upload only code and pay per invocation and run time, with no servers to manage.</Flashcard>
  <Flashcard term="ECS / EKS">Services for running containers: ECS is the native container orchestrator of AWS, and EKS is managed Kubernetes.</Flashcard>
  <Flashcard term="Elastic Beanstalk">A platform (PaaS) where you drop in your app and AWS deploys and manages the underlying resources for you, great for shipping fast.</Flashcard>
  <Flashcard term="S3">Simple Storage Service, nearly unlimited cloud object storage for files, backups, and static website assets.</Flashcard>
  <Flashcard term="EBS">Elastic Block Store, a block storage disk attached to EC2 that acts like a local drive, used within the same AZ.</Flashcard>
  <Flashcard term="EFS">Elastic File System, shared file storage that many EC2 instances can mount at once, with capacity that scales automatically.</Flashcard>
  <Flashcard term="RDS / Aurora">Managed relational databases: RDS maintains engines like MySQL/PostgreSQL for you; Aurora is the high-performance compatible version of AWS.</Flashcard>
  <Flashcard term="DynamoDB">A fully managed NoSQL database with millisecond latency and automatic scaling, ideal for high-traffic key-value or document data.</Flashcard>
  <Flashcard term="VPC">Virtual Private Cloud, your own private virtual network in the cloud where you define subnets, routing, and firewalls.</Flashcard>
  <Flashcard term="Route 53">The DNS domain name service of AWS, resolving addresses to the right resources and also doing health checks and traffic routing.</Flashcard>
  <Flashcard term="CloudFront">A content delivery network (CDN) that caches content to edge locations worldwide so users everywhere connect fast and smoothly.</Flashcard>
  <Flashcard term="ELB">Elastic Load Balancing, spreading traffic across several backends to improve availability and scalability.</Flashcard>
  <Flashcard term="CloudFormation">Write your whole infrastructure as code (IaC) in a template and deploy it in one shot, making it easy to reproduce environments.</Flashcard>
  <Flashcard term="CloudWatch">A monitoring and alerting service that collects metrics and logs and sets alarms to show whether the system is healthy.</Flashcard>
  <Flashcard term="Console / CLI / SDK">Three ways to operate AWS: the web console (click), the CLI (commands), and the SDK (calls from code).</Flashcard>
</Flashcards>

## Billing, Pricing and Support

<Flashcards>
  <Flashcard term="Three Pricing Principles">Pay as you go, reserve usage for a discount, and pay less per unit as you use more. The basic spirit of AWS pricing.</Flashcard>
  <Flashcard term="On-Demand">Pay only for what you use, start and stop anytime with no commitment; the most flexible option but the highest unit price.</Flashcard>
  <Flashcard term="Reserved Instances">Commit to 1 or 3 years for a steep discount, best for steady long-running workloads that never stop.</Flashcard>
  <Flashcard term="Spot Instances">Use the spare capacity of AWS for up to 90 percent off, but it can be reclaimed, so it suits interruptible batch jobs.</Flashcard>
  <Flashcard term="Savings Plans">Commit to a fixed hourly spend for a discount, more flexible than RIs and spanning instance types and services.</Flashcard>
  <Flashcard term="Cost Explorer">An analysis tool with charts to view spending and usage trends and find the biggest cost drivers.</Flashcard>
  <Flashcard term="Budgets">Set a budget threshold and get an automatic notification when you are about to overspend or exceed usage.</Flashcard>
  <Flashcard term="Cost and Usage Report">The most detailed cost and usage report (CUR), which can be exported for deeper analysis.</Flashcard>
  <Flashcard term="Organizations">Centrally manage multiple AWS accounts, applying policies and enjoying consolidated billing.</Flashcard>
  <Flashcard term="Consolidated Billing">Combine the usage of multiple accounts into one bill, making it easier to reach volume discounts while saving money and staying organized.</Flashcard>
  <Flashcard term="Trusted Advisor">Automatically checks your account and gives optimization advice across five areas: cost, performance, security, fault tolerance, and service limits.</Flashcard>
  <Flashcard term="Support Plans">Basic (free), Developer, Business, and Enterprise; higher tiers get faster response and more available resources.</Flashcard>
</Flashcards>

## Next Step

Now that you know the terms, go check what you have learned!

👉 Test yourself: [CLF Practice Questions](./clf-quiz.md)
