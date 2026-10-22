---
sidebar_position: 6
title: "CLF Practice Questions"
---

# CLF Practice Questions (official exam style)

Pick your answer first, then click "**Show answer & explanation**". This page mirrors the CLF-C02 official style across the four domains: **Cloud Concepts, Security and Compliance, Technology and Services, and Billing, Pricing, and Support**. It tests **definitions, service purpose, basic judgment, and cloud benefits**, not the complex architecture trade-offs of SAA. It includes both **single-answer** and **multiple-answer (Choose TWO)** questions. All questions are **original** content (not real exam questions).

<Quiz
  qnum={1}
  total={15}
  question="A startup does not want to buy its own servers and build a data center. Instead it wants to pay for what it actually uses and scale resources up or down quickly at any time. Which cloud computing benefit does this best reflect?"
  options={[
    'Procuring large amounts of hardware in advance to guarantee capacity',
    'Trading fixed capital expense (CapEx) for variable usage-based expense (OpEx)',
    'Signing a long three-year contract to lock in a fixed fee',
    'Operating every resource on premises by yourself',
  ]}
  answer={1}>

**Correct: B**

A core cloud benefit is **trading capital expense (CapEx) for variable expense (OpEx)**: instead of spending up front on hardware, you pay for what you use and scale elastically with demand. A buying hardware in advance is exactly what cloud avoids; C locking a fixed three-year fee is the opposite of pay-as-you-go; D operating on premises is not using the cloud at all.

</Quiz>

<Quiz
  qnum={2}
  total={15}
  question="A team wants to manage as little underlying server infrastructure as possible, hand operations to AWS, and focus more on building its application. Which cloud benefit does this best match?"
  options={[
    'The team remains responsible for data center power and cooling',
    'The team stops doing undifferentiated heavy lifting and hands facility and hardware operations to AWS',
    'The team must forecast and procure three years of rack space itself',
    'The team replaces failed physical disks on its own',
  ]}
  answer={1}>

**Correct: B**

The cloud lets you **stop doing undifferentiated heavy lifting** (facilities, power, cooling, swapping disks) and hand it to AWS, so the team can focus on the application that actually delivers value. A, C, and D are all tasks of running your own data center on premises, exactly the burden that moving to the cloud removes.

</Quiz>

<Quiz
  qnum={3}
  total={15}
  question="In the AWS Shared Responsibility Model, which of the following is the responsibility of AWS (security OF the cloud)?"
  options={[
    'Configuring IAM user password policies and permissions',
    'Maintaining and protecting physical data centers, facilities, and underlying hardware',
    'Installing security patches on the EC2 operating system',
    'Encrypting customer data stored in S3',
  ]}
  answer={1}>

**Correct: B**

Under the Shared Responsibility Model, **AWS is responsible for security OF the cloud**, meaning the physical facilities, data centers, hardware, and global infrastructure. A, C, and D are all security IN the cloud: IAM configuration, OS patching, and encrypting customer data are the customer responsibility.

</Quiz>

<Quiz
  qnum={4}
  total={15}
  question="An auditor at a company needs to download AWS compliance reports (such as SOC, ISO, PCI) to prove the cloud services used meet regulatory requirements. Where should they self-serve these reports?"
  options={[
    'AWS Artifact',
    'AWS CloudTrail',
    'Amazon Inspector',
    'AWS Trusted Advisor',
  ]}
  answer={0}>

**Correct: A**

**AWS Artifact** is the self-service portal for AWS compliance and audit reports (such as SOC, ISO, PCI DSS), available for download at any time. B CloudTrail records API activity in the account; C Inspector performs vulnerability scanning; D Trusted Advisor gives best-practice recommendations. None of them is where you download compliance documents.

</Quiz>

<Quiz
  qnum={5}
  total={15}
  question="Security best practice advises against using the root user for day-to-day work. Which of the following is the safer and correct approach?"
  options={[
    'Share the root user access keys across the whole team',
    'Create IAM users or roles with least-privilege permissions for daily use and enable multi-factor authentication (MFA) on the root user',
    'Turn off multi-factor authentication on all accounts for easier sign-in',
    'Have everyone sign in and operate directly as the root user',
  ]}
  answer={1}>

**Correct: B**

Best practice is to **create least-privilege IAM users or roles for daily work**, reserve the root user for the few tasks that require it, and **enable MFA** on it. A sharing root keys, C disabling MFA, and D using root every day are all high-risk and violate least privilege.

</Quiz>

<Quiz
  qnum={6}
  total={15}
  question="A company needs to store a large volume of user-uploaded images and backup files on AWS, wanting an object storage service with high durability, nearly unlimited capacity, and pay-for-what-you-use billing. Which AWS service fits best?"
  options={[
    'Amazon EC2',
    'Amazon S3',
    'Amazon RDS',
    'Amazon VPC',
  ]}
  answer={1}>

**Correct: B**

**Amazon S3** is the AWS object storage service, offering very high durability, nearly unlimited capacity, and billing based on what you store and use, making it ideal for images, backups, and logs. A EC2 is virtual servers (compute); C RDS is a managed relational database; D VPC is a virtual network. None of these is object storage.

</Quiz>

<Quiz
  qnum={7}
  total={15}
  question="A team simply wants to run code without managing any servers. The code is triggered by events, runs for only a few seconds each time, and the team wants to pay nothing while idle. Which AWS service best fits this serverless need?"
  options={[
    'Amazon EC2',
    'AWS Lambda',
    'Amazon EBS',
    'Amazon Route 53',
  ]}
  answer={1}>

**Correct: B**

**AWS Lambda** is the serverless compute service: triggered by events, billed by usage only while running, costing nothing when idle, and requiring no server management, which matches the need exactly. A EC2 means managing virtual servers yourself; C EBS is block storage; D Route 53 is a DNS service. None is serverless compute.

</Quiz>

<Quiz
  qnum={8}
  total={15}
  question="Regarding the AWS global infrastructure, which statement about a Region and an Availability Zone (AZ) is correct?"
  options={[
    'A Region has only a single Availability Zone',
    'A Region is made of multiple physically isolated Availability Zones, and spreading across AZs improves high availability',
    'An Availability Zone is an edge location placed near users for content caching',
    'All Regions share the same single data center',
  ]}
  answer={1}>

**Correct: B**

**A Region is made of multiple physically isolated Availability Zones (AZs)**, and spreading a workload across AZs avoids a single-facility failure, improving high availability. A is wrong because each Region has multiple AZs; C describes an edge location, used for CloudFront content caching, not an AZ; D Regions are independent infrastructure, not one shared data center.

</Quiz>

<Quiz
  qnum={9}
  total={15}
  question="A developer wants to automate AWS resource operations with an SDK and a command line, while other colleagues prefer a browser-based graphical interface for manual work. Which TWO are correct ways to access and manage AWS services? (Choose TWO)"
  options={[
    'AWS Management Console (web graphical interface)',
    'AWS CLI or AWS SDK (command line and programmatic interface)',
    'Physically walking into an AWS data center to operate the servers',
    'Calling AWS support to press every button on your behalf',
    'Submitting a fax form as the only way to request resource changes',
  ]}
  answer={[0, 1]}>

**Correct: A, B**

The main ways to access and manage AWS are the **Management Console (web graphical interface, A)** and the **CLI or SDK (command line and programmatic interface, B)**, both of which operate the same services. C customers cannot physically enter AWS facilities; D and E relying on support to press buttons or submitting fax forms are not AWS access methods.

</Quiz>

<Quiz
  qnum={10}
  total={15}
  question="A steady production server must run 365 days a year with predictable usage, and the team is willing to make a 1-year or 3-year commitment in exchange for the biggest discount. Which EC2 pricing model is most cost-effective?"
  options={[
    'On-Demand instances',
    'Spot Instances',
    'Reserved Instances or Savings Plans',
    'Dedicated Hosts',
  ]}
  answer={2}>

**Correct: C**

When usage is **steady and predictable and you are willing to make a 1-year or 3-year commitment**, **Reserved Instances or Savings Plans** earn the biggest discount (up to about 70 percent off). A On-Demand pays list price every day and is most expensive for steady loads; B Spot is cheap but gets reclaimed and does not suit a production environment that cannot be interrupted; D Dedicated Hosts are the most expensive and are meant for compliance or BYOL only.

</Quiz>

<Quiz
  qnum={11}
  total={15}
  question="A team needs to run an interruption-tolerant, run-and-discard batch job and wants compute at the lowest unit price, accepting that the resources may occasionally be reclaimed by AWS. Which EC2 pricing model fits best?"
  options={[
    'Reserved Instances',
    'Spot Instances',
    'On-Demand instances',
    'Dedicated Hosts',
  ]}
  answer={1}>

**Correct: B**

**Interruption-tolerant, retryable, lowest unit price** is the classic scenario for **Spot Instances**, which use spare capacity for up to about 90 percent savings at the cost of possible reclamation. A Reserved Instances suit steady long-term loads; C On-Demand has no discount; D Dedicated Hosts are the most expensive. None fits running an interruptible batch at the lowest unit price.

</Quiz>

<Quiz
  qnum={12}
  total={15}
  question="A company wants to receive a proactive alert when cost exceeds a fixed dollar threshold it sets, to keep the bill from running out of control. Which AWS tool fits best?"
  options={[
    'AWS Budgets',
    'AWS CloudTrail',
    'Amazon CloudWatch Logs',
    'AWS Config',
  ]}
  answer={0}>

**Correct: A**

**AWS Budgets** lets you set a threshold on cost or usage and sends an alert once a preset amount is exceeded, meeting the need exactly. B CloudTrail records API activity; C CloudWatch Logs collects application and system logs; D Config tracks resource configuration changes. None is a budget-threshold alerting tool.

</Quiz>

<Quiz
  qnum={13}
  total={15}
  question="An enterprise needs AWS support at a level that responds to a critical system outage in under 15 minutes and can assign a dedicated Technical Account Manager (TAM). Which AWS Support plan should it subscribe to?"
  options={[
    'Basic Support',
    'Developer Support',
    'Business Support',
    'Enterprise Support',
  ]}
  answer={3}>

**Correct: D**

The plan that provides a **dedicated Technical Account Manager (TAM) and the fastest response tier** is **Enterprise Support**. A Basic offers only billing and service-health info with no technical cases; B Developer is for dev and test with business-hours responses; C Business has 24/7 technical support but no dedicated TAM. None of the others meets the enterprise-grade critical-system need.

</Quiz>

<Quiz
  qnum={14}
  total={15}
  question="A group has multiple department accounts under AWS Organizations and wants a single consolidated bill, simpler reconciliation, aggregated usage across accounts for larger volume discounts, and shared reserved plans. Which approach fits best?"
  options={[
    'Manage and pay in each account separately by hand',
    'Use Consolidated Billing in AWS Organizations',
    'Merge all departments into a single shared-login account',
    'Contact AWS support per account to issue separate invoices',
  ]}
  answer={1}>

**Correct: B**

**Consolidated Billing** combines the multiple accounts under Organizations into a single bill, simplifies reconciliation, and aggregates usage across accounts for larger volume discounts and shared RI and Savings Plans. A paying by hand per account cannot aggregate usage; C merging into one account loses account isolation and is not consolidated billing; D contacting support per account for invoices neither consolidates nor shares discounts.

</Quiz>

<Quiz
  qnum={15}
  total={15}
  question="A team wants to automatically check whether its account follows best practices and get checks and recommendations across cost optimization, security, fault tolerance, performance, and service limits (for example, finding idle resources or accounts without MFA). Which TWO statements are correct? (Choose TWO)"
  options={[
    'AWS Trusted Advisor provides best-practice checks and recommendations across multiple pillars',
    'Higher support plans (such as Business and Enterprise) unlock the full set of Trusted Advisor checks',
    'Trusted Advisor is a service for writing and deploying application source code',
    'The only purpose of Trusted Advisor is to store object files',
    'Trusted Advisor can only be used inside a physical data center',
  ]}
  answer={[0, 1]}>

**Correct: A, B**

**Trusted Advisor** gives best-practice checks and recommendations across cost optimization, security, fault tolerance, performance, and service limits (A), and **higher support plans (Business and Enterprise) unlock the full set of checks** (B). C it is not a tool for writing or deploying source code; D storing objects is the job of S3; E Trusted Advisor is a cloud service and has nothing to do with a physical data center.

</Quiz>

---

🎉 Your CLF foundation is set! Ready for the architect cert? Next 👉 [SAA Exam Info & Study Plan](../saa/exam-info.md)
