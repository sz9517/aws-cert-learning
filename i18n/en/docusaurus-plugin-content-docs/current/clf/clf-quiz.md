---
sidebar_position: 7
title: "CLF Practice Questions"
---

# CLF Practice Questions (official exam style)

Pick your answer first, then click "**Show answer & explanation**". This page mirrors the CLF-C02 official style across the four domains: **Cloud Concepts, Security and Compliance, Technology and Services, and Billing, Pricing, and Support**. It tests **definitions, service purpose, basic judgment, and cloud benefits**, not the complex architecture trade-offs of SAA. It includes both **single-answer** and **multiple-answer (Choose TWO)** questions. All questions are **original** content (not real exam questions).

<Quiz
  qnum={1}
  total={45}
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
  total={45}
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
  total={45}
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
  total={45}
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
  total={45}
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
  total={45}
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
  total={45}
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
  total={45}
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
  total={45}
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
  total={45}
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
  total={45}
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
  total={45}
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
  total={45}
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
  total={45}
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
  total={45}
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

<Quiz
  qnum={16}
  total={45}
  question="Among the cloud deployment models, an enterprise builds and runs all of its workloads entirely on a public cloud such as AWS and keeps no on-premises data center. Which deployment model is this?"
  options={[
    'Hybrid',
    'Cloud-based (All-in)',
    'On-premises',
    'Private cloud',
  ]}
  answer={1}>

**Correct: B** — Running every workload in the cloud with no on-premises facility is the cloud-based (All-in) deployment model. A hybrid mixes cloud with on-premises; C on-premises is a fully self-managed data center; D private cloud is a dedicated environment usually still in your own facility.

</Quiz>

<Quiz
  qnum={17}
  total={45}
  question="Which option best describes the cloud benefit of elasticity?"
  options={[
    'Automatically scaling compute resources up or down with demand and paying for what you use',
    'Having to buy enough servers in advance for three years of use',
    'Fixing all resource capacity at contract signing with no changes allowed',
    'Storing data only in a single physical data center',
  ]}
  answer={0}>

**Correct: A** — Elasticity means resources scale up or down automatically with demand, growing at peak and shrinking off-peak to avoid idle waste. B and C describe fixed capacity that cannot adjust to demand, the opposite of elasticity; D is unrelated.

</Quiz>

<Quiz
  qnum={18}
  total={45}
  question="A global enterprise wants to deploy applications closest to its users to reduce latency and meet local data residency rules. Which AWS infrastructure concept most directly represents choosing the geographic location where data actually resides?"
  options={[
    'Availability Zone',
    'Region',
    'Edge Location',
    'Virtual Private Cloud (VPC)',
  ]}
  answer={1}>

**Correct: B** — A Region is a geographic location worldwide, and choosing a Region decides where data physically resides, which matters for latency and compliance. A an Availability Zone is an isolated group of data centers inside a Region; C an Edge Location caches content for CloudFront; D a VPC is a virtual network inside an account.

</Quiz>

<Quiz
  qnum={19}
  total={45}
  question="To achieve high availability, you should deploy an application across multiple of which facility within a single Region so service continues if one facility fails?"
  options={[
    'Multiple Edge Locations',
    'Multiple Availability Zones',
    'Multiple IAM users',
    'Multiple S3 buckets',
  ]}
  answer={1}>

**Correct: B** — Availability Zones (AZs) are physically isolated, independently powered groups of data centers within a Region. Deploying across multiple AZs keeps service running if one AZ fails, the basic pattern for high availability. A Edge Locations are for content caching; C and D are unrelated to facility-level fault tolerance.

</Quiz>

<Quiz
  qnum={20}
  total={45}
  question="In the AWS Shared Responsibility Model, which of the following is a customer responsibility (security IN the cloud)?"
  options={[
    'Protecting the physical security of global infrastructure',
    'Maintaining the hypervisor and underlying hardware',
    'Configuring security group rules and managing IAM permissions',
    'Replacing failed physical disks in the data center',
  ]}
  answer={2}>

**Correct: C** — Configuring security groups and managing IAM users and permissions are security IN the cloud, which is the customer responsibility. A, B, and D are maintenance of physical facilities, hardware, and the hypervisor, which is the AWS responsibility (security OF the cloud).

</Quiz>

<Quiz
  qnum={21}
  total={45}
  question="An administrator wants to record who called which AWS APIs and when in the account (for example who launched an EC2 instance) for audit purposes. Which service should be used?"
  options={[
    'Amazon CloudWatch',
    'AWS CloudTrail',
    'AWS Config',
    'Amazon Inspector',
  ]}
  answer={1}>

**Correct: B** — CloudTrail records API calls and user activity in the account, used to audit who did what. A CloudWatch collects performance metrics and logs for monitoring and alarms; C Config tracks resource configuration changes and compliance; D Inspector performs vulnerability scanning.

</Quiz>

<Quiz
  qnum={22}
  total={45}
  question="A team wants to monitor EC2 instance CPU utilization, set threshold alarms, and collect application logs. Which service fits best?"
  options={[
    'AWS CloudTrail',
    'Amazon CloudWatch',
    'AWS Trusted Advisor',
    'AWS Artifact',
  ]}
  answer={1}>

**Correct: B** — CloudWatch collects performance metrics (such as CPU utilization) and logs, and can set alarms. A CloudTrail records API activity, not performance metrics; C Trusted Advisor gives best-practice advice; D Artifact downloads compliance reports.

</Quiz>

<Quiz
  qnum={23}
  total={45}
  question="Which AWS service is object storage, commonly used for backups, static website content, and large amounts of unstructured data?"
  options={[
    'Amazon EBS',
    'Amazon S3',
    'Amazon RDS',
    'Amazon EFS',
  ]}
  answer={1}>

**Correct: B** — Amazon S3 is object storage, suited to backups, static content, and large unstructured data. A EBS is block storage attached to EC2; C RDS is a relational database; D EFS is file storage.

</Quiz>

<Quiz
  qnum={24}
  total={45}
  question="A company needs a fully managed relational database (supporting MySQL, PostgreSQL, and others) and wants AWS to handle backups, patching, and failover recovery. Which service fits best?"
  options={[
    'Amazon DynamoDB',
    'Amazon RDS',
    'Amazon Redshift',
    'Amazon ElastiCache',
  ]}
  answer={1}>

**Correct: B** — Amazon RDS is a fully managed relational database service supporting engines like MySQL and PostgreSQL, with AWS handling backups and patching. A DynamoDB is a NoSQL key-value database; C Redshift is a data warehouse for analytics; D ElastiCache is an in-memory cache.

</Quiz>

<Quiz
  qnum={25}
  total={45}
  question="A development team wants to run code without managing any servers, paying only for the number of executions and run time, running only when triggered by an event. Which service fits best?"
  options={[
    'Amazon EC2',
    'AWS Lambda',
    'Amazon Lightsail',
    'AWS Batch',
  ]}
  answer={1}>

**Correct: B** — AWS Lambda is a serverless compute service triggered by events and billed by run time and number of executions, with no servers to manage. A EC2 requires managing virtual servers; C Lightsail offers simplified virtual server plans; D Batch is for batch computing jobs.

</Quiz>

<Quiz
  qnum={26}
  total={45}
  question="Which service is used for global content delivery (CDN), caching content at edge locations to reduce user access latency?"
  options={[
    'Amazon Route 53',
    'Amazon CloudFront',
    'AWS Direct Connect',
    'Elastic Load Balancing',
  ]}
  answer={1}>

**Correct: B** — Amazon CloudFront is a content delivery network (CDN) that caches content at global edge locations to speed delivery and lower latency. A Route 53 is a DNS service; C Direct Connect is a dedicated line; D ELB is load balancing.

</Quiz>

<Quiz
  qnum={27}
  total={45}
  question="An administrator wants to centrally manage multiple AWS accounts, apply unified policies, and consolidate billing. Which service fits best?"
  options={[
    'AWS IAM',
    'AWS Organizations',
    'AWS Control Tower',
    'AWS Config',
  ]}
  answer={1}>

**Correct: B** — AWS Organizations centrally manages multiple accounts, applies service control policies (SCPs), and consolidates billing. A IAM manages identities and permissions within a single account; C Control Tower sets up a managed multi-account landing zone; D Config tracks resource configuration.

</Quiz>

<Quiz
  qnum={28}
  total={45}
  question="Security best practice recommends not using the root user for daily operations. Which of the following is the most appropriate approach?"
  options={[
    'Sharing the root account password with all team members',
    'Creating individual IAM users with least-privilege permissions and reserving root for the few tasks that require it',
    'Disabling all IAM users and always using root',
    'Embedding root access keys in the code',
  ]}
  answer={1}>

**Correct: B** — Best practice is to create individual IAM users, follow least privilege, and reserve the root account for the few tasks that require it. A, C, and D are serious security risks that should be avoided.

</Quiz>

<Quiz
  qnum={29}
  total={45}
  question="To add a layer of protection at sign-in, besides a password a one-time verification code is also required. What is this mechanism called?"
  options={[
    'Multi-factor authentication (MFA)',
    'Security Group',
    'Access Control List (ACL)',
    'Key Pair',
  ]}
  answer={0}>

**Correct: A** — Multi-factor authentication (MFA) requires a second factor (such as a one-time code) in addition to a password, greatly improving sign-in security. B a security group is an instance-level virtual firewall; C an ACL is a network-layer access list; D a key pair is used for SSH login to EC2.

</Quiz>

<Quiz
  qnum={30}
  total={45}
  question="Which service helps protect against common web attacks (such as SQL injection and cross-site scripting) at the network edge and can be used with CloudFront or ALB?"
  options={[
    'AWS Shield',
    'AWS WAF',
    'Amazon GuardDuty',
    'AWS KMS',
  ]}
  answer={1}>

**Correct: B** — AWS WAF (Web Application Firewall) filters common web attacks such as SQL injection and XSS and can be used with CloudFront and ALB. A Shield focuses on DDoS protection; C GuardDuty is threat detection; D KMS is key management.

</Quiz>

<Quiz
  qnum={31}
  total={45}
  question="Which service is specifically designed to defend against distributed denial-of-service (DDoS) attacks?"
  options={[
    'AWS Shield',
    'Amazon Inspector',
    'AWS Config',
    'Amazon Macie',
  ]}
  answer={0}>

**Correct: A** — AWS Shield is the service dedicated to defending against DDoS attacks, with the Standard tier providing automatic baseline protection. B Inspector does vulnerability assessment; C Config tracks configuration compliance; D Macie uses machine learning to detect sensitive data in S3.

</Quiz>

<Quiz
  qnum={32}
  total={45}
  question="A finance person wants to visually analyze past cost and usage trends, find the services with the highest spend, and forecast future charges. Which tool fits best?"
  options={[
    'AWS Budgets',
    'AWS Cost Explorer',
    'AWS Cost and Usage Report',
    'AWS Pricing Calculator',
  ]}
  answer={1}>

**Correct: B** — AWS Cost Explorer visualizes historical cost and usage trends in charts to help analyze and forecast. A Budgets sets budget thresholds and alerts on overspend; C the CUR is the most detailed raw billing data file; D Pricing Calculator estimates cost before deployment.

</Quiz>

<Quiz
  qnum={33}
  total={45}
  question="An administrator wants to set a monthly spending cap and get notified when actual or forecasted spend exceeds the threshold. Which service fits best?"
  options={[
    'AWS Cost Explorer',
    'AWS Budgets',
    'AWS Trusted Advisor',
    'AWS Organizations',
  ]}
  answer={1}>

**Correct: B** — AWS Budgets sets cost or usage budget thresholds and alerts when actual or forecasted values exceed them. A Cost Explorer focuses on visualizing historical trends; C Trusted Advisor gives best-practice advice; D Organizations manages multiple accounts.

</Quiz>

<Quiz
  qnum={34}
  total={45}
  question="Before any actual deployment, a team wants to estimate the monthly cost based on the planned service configuration so it can set a budget. Which tool fits best?"
  options={[
    'AWS Pricing Calculator',
    'AWS Cost Explorer',
    'AWS Budgets',
    'AWS Cost and Usage Report',
  ]}
  answer={0}>

**Correct: A** — AWS Pricing Calculator estimates expected cost before deployment based on planned services and usage. B, C, and D all require actual usage data and cannot be used for an up-front estimate before anything is live.

</Quiz>

<Quiz
  qnum={35}
  total={45}
  question="Which EC2 pricing model is best for interruptible, fault-tolerant batch jobs and usually offers the largest discount relative to On-Demand?"
  options={[
    'On-Demand',
    'Reserved Instances',
    'Spot Instances',
    'Dedicated Hosts',
  ]}
  answer={2}>

**Correct: C** — Spot Instances use spare AWS capacity at the largest discount but can be reclaimed and interrupted, so they suit fault-tolerant, interruptible work. A On-Demand is most flexible but highest priced; B Reserved suits steady long-term usage; D Dedicated Hosts serve compliance or licensing needs.

</Quiz>

<Quiz
  qnum={36}
  total={45}
  question="A company has steady and predictable long-term compute needs and wants to commit to one or three years of use in exchange for a larger discount. Which EC2 pricing model fits best?"
  options={[
    'Spot Instances',
    'Reserved Instances / Savings Plans',
    'On-Demand',
    'Dedicated Hosts',
  ]}
  answer={1}>

**Correct: B** — For steady, predictable long-term usage, committing to one or three years with Reserved Instances or Savings Plans earns a large discount. A Spot suits interruptible work; C On-Demand suits short-term or unpredictable loads; D Dedicated Hosts mainly serve licensing and compliance needs.

</Quiz>

<Quiz
  qnum={37}
  total={45}
  question="Which AWS Support plan provides 24x7 technical support with faster response to production issues and suits companies with running workloads, while costing less than Enterprise?"
  options={[
    'Basic Support',
    'Developer Support',
    'Business Support',
    'Enterprise Support',
  ]}
  answer={2}>

**Correct: C** — The Business plan provides 24x7 technical support and faster issue response for companies with production workloads, and costs less than Enterprise. A Basic is free with no technical support cases; B Developer is business-hours only and suits test and development; D Enterprise is the top tier with a dedicated Technical Account Manager (TAM).

</Quiz>

<Quiz
  qnum={38}
  total={45}
  question="Which AWS Support plan provides a dedicated Technical Account Manager (TAM) and the highest level of support, suited to mission-critical large enterprises?"
  options={[
    'Basic Support',
    'Developer Support',
    'Business Support',
    'Enterprise Support',
  ]}
  answer={3}>

**Correct: D** — The Enterprise plan is the top support tier, providing a dedicated Technical Account Manager (TAM), fastest response, and full Trusted Advisor checks, suited to mission-critical workloads. A Basic has no technical support cases; B Developer suits dev and test; C Business suits production workloads but has no TAM.

</Quiz>

<Quiz
  qnum={39}
  total={45}
  question="Which service provides best-practice checks and recommendations for your account across cost optimization, security, fault tolerance, and performance?"
  options={[
    'AWS Trusted Advisor',
    'AWS CloudTrail',
    'AWS Config',
    'Amazon CloudWatch',
  ]}
  answer={0}>

**Correct: A** — Trusted Advisor provides best-practice checks and recommendations for the account across cost optimization, security, fault tolerance, performance, and service limits. B CloudTrail records API activity; C Config tracks configuration; D CloudWatch does monitoring and alarms.

</Quiz>

<Quiz
  qnum={40}
  total={45}
  question="Which of the following is included free by default with every AWS account?"
  options={[
    'A dedicated Technical Account Manager (TAM)',
    'Basic Support',
    'The full set of all Trusted Advisor checks',
    '24x7 technical support cases',
  ]}
  answer={1}>

**Correct: B** — Every AWS account includes free Basic Support, covering billing questions, the service health dashboard, and documentation. A a TAM is only in Enterprise; C full Trusted Advisor checks require a paid plan; D 24x7 technical support cases require Business or higher.

</Quiz>

<Quiz
  qnum={41}
  total={45}
  question="Which service is used to build a logically isolated virtual network in the cloud, with customizable subnets, route tables, and gateways?"
  options={[
    'Amazon VPC',
    'Amazon Route 53',
    'AWS Direct Connect',
    'Amazon CloudFront',
  ]}
  answer={0}>

**Correct: A** — Amazon VPC (Virtual Private Cloud) lets you build a logically isolated virtual network on AWS with customizable subnets, routing, and gateways. B Route 53 is DNS; C Direct Connect is a physical dedicated line to AWS; D CloudFront is a CDN.

</Quiz>

<Quiz
  qnum={42}
  total={45}
  question="(Choose TWO) Which two of the following are AWS responsibilities under the Shared Responsibility Model (security OF the cloud)?"
  options={[
    'Protecting the physical security and access control of data centers',
    'Installing security patches on the customer EC2 operating system',
    'Maintaining the underlying hardware and virtualization (hypervisor)',
    'Configuring access policies for S3 buckets',
    'Managing password policies for IAM users',
  ]}
  answer={[0,2]}>

**Correct: A, C** — Physical facility security and maintenance of the underlying hardware and virtualization layer are AWS responsibilities (security OF the cloud). B OS patching, D S3 access policies, and E IAM password policies are all customer responsibilities (security IN the cloud).

</Quiz>

<Quiz
  qnum={43}
  total={45}
  question="(Choose TWO) Which two of the following are benefits of adopting cloud computing compared with building your own on-premises data center?"
  options={[
    'Trading capital expense (CapEx) for variable expense (OpEx)',
    'Having to buy and maintain physical servers yourself',
    'Deploying and scaling resources on demand within minutes',
    'Having to forecast three years of hardware capacity in advance',
    'Storing all data only in a single on-premises facility',
  ]}
  answer={[0,2]}>

**Correct: A, C** — Trading CapEx for OpEx and deploying or scaling resources on demand are core cloud benefits over on-premises. B, D, and E describe limits of running your own data center, exactly the burden moving to the cloud removes.

</Quiz>

<Quiz
  qnum={44}
  total={45}
  question="(Choose TWO) Which two of the following services can be used to store data?"
  options={[
    'Amazon S3',
    'Amazon EBS',
    'AWS Lambda',
    'Amazon CloudFront',
    'AWS IAM',
  ]}
  answer={[0,1]}>

**Correct: A, B** — Amazon S3 (object storage) and Amazon EBS (block storage) are both storage services. C Lambda is serverless compute; D CloudFront is content delivery (CDN); E IAM is identity and access management, none of which are storage.

</Quiz>

<Quiz
  qnum={45}
  total={45}
  question="(Choose TWO) Which two of the following are tools for AWS billing and cost management?"
  options={[
    'AWS Cost Explorer',
    'AWS Budgets',
    'Amazon GuardDuty',
    'AWS CloudTrail',
    'Amazon Inspector',
  ]}
  answer={[0,1]}>

**Correct: A, B** — Cost Explorer (visualizing historical cost trends) and Budgets (setting budget thresholds and alerts) are both billing and cost management tools. C GuardDuty is threat detection; D CloudTrail records API activity; E Inspector does vulnerability assessment, none related to cost management.

</Quiz>

---

👉 Now take the full exam: [CLF Full Mock Exam (65 questions)](./clf-mock-exam.md)

🎉 Your CLF foundation is set! Ready for the architect cert? Next 👉 [SAA Exam Info & Study Plan](../saa/exam-info.md)
