---
sidebar_position: 8
title: "CLF Full Mock Exam (65 questions)"
---

# CLF Full Mock Exam (65 questions)

This is a full mock exam in the official CLF-C02 style, with **65 questions** weighted across the four official domains: Cloud Concepts, Security and Compliance, Technology and Services, and Billing, Pricing, and Support. Plan to complete it in one sitting, timing yourself at about 90 minutes. Pick your answer first, then click "**Show answer & explanation**". A few questions are **multiple-answer (Choose TWO)**; the rest are single-answer. All questions are **original** style-matched content, not real exam questions.

## Part 1  Cloud Concepts

<Quiz
  qnum={1}
  total={65}
  question="A company wants to replace buying servers up front with paying only for what it actually uses. Which cloud computing benefit does this best reflect?"
  options={[
    'Procuring enough hardware in advance to cover three years',
    'Trading capital expense (CapEx) for variable usage-based expense (OpEx)',
    'Signing a long contract to lock in a fixed annual fee',
    'Operating every resource on premises by yourself',
  ]}
  answer={1}>

**Correct: B** — The cloud lets you **trade capital expense for variable expense**, paying for actual usage instead of buying hardware first. A large advance procurement is what cloud avoids; C a locked fixed fee is the opposite of pay-as-you-go; D on-premises operation is not using the cloud.

</Quiz>

<Quiz
  qnum={2}
  total={65}
  question="A team wants to hand non-differentiating work (facilities, power, cooling, swapping disks) to AWS and focus on its application. Which cloud benefit does this match?"
  options={[
    'The team remains responsible for data center power and cooling',
    'Stopping undifferentiated heavy lifting and handing underlying operations to AWS',
    'The team forecasts and procures future rack space itself',
    'The team replaces failed physical disks by hand',
  ]}
  answer={1}>

**Correct: B** — The cloud lets you **stop doing undifferentiated heavy lifting** and hand facility and hardware operations to AWS. A, C, and D are tasks of running your own data center, exactly the burden the cloud removes.

</Quiz>

<Quiz
  qnum={3}
  total={65}
  question="A new service may see usage spike or drop sharply overnight. The team wants resources to scale automatically with demand without forecasting the peak. Which cloud benefit does this reflect?"
  options={[
    'Elasticity: resources scale out or in automatically with demand',
    'Buying maximum capacity once so it is never short',
    'Routing all traffic to a single fixed-size server',
    'Signing a procurement contract for every capacity change',
  ]}
  answer={0}>

**Correct: A** — **Elasticity** scales resources automatically with actual demand, with no need to forecast the peak. B buying maximum capacity wastes money; C a single fixed server cannot scale; D signing a contract each time contradicts elasticity.

</Quiz>

<Quiz
  qnum={4}
  total={65}
  question="Regarding AWS global infrastructure, which statement about a Region and an Availability Zone (AZ) is correct?"
  options={[
    'A Region has only one Availability Zone',
    'A Region is made of multiple physically isolated Availability Zones, and spreading across them improves high availability',
    'An Availability Zone is an edge location near users for content caching',
    'All Regions worldwide share the same single data center',
  ]}
  answer={1}>

**Correct: B** — **A Region is made of multiple physically isolated AZs**, and spreading across them avoids a single-facility failure. A each Region has multiple AZs; C describes an edge location; D Regions are independent infrastructure, not shared.

</Quiz>

<Quiz
  qnum={5}
  total={65}
  question="A global website wants local users to get static content (images, video) from a nearby location to reduce latency. Which AWS facility caches content close to users?"
  options={[
    'Availability Zone',
    'Edge Location',
    'Region',
    'VPC subnet',
  ]}
  answer={1}>

**Correct: B** — An **Edge Location** is where CloudFront caches content near users to reduce latency. A and C are geographic tiers for compute and deployment; D a subnet is virtual network segmentation. None is a content cache node.

</Quiz>

<Quiz
  qnum={6}
  total={65}
  question="Which statement best describes the cloud benefit of going global in minutes?"
  options={[
    'Service can be offered in only a single country',
    'An application can be deployed to multiple Regions worldwide in minutes to serve local users nearby',
    'A local data center must be built before expanding to a new country',
    'Server hardware must be moved by hand to every Region',
  ]}
  answer={1}>

**Correct: B** — The cloud lets you **deploy across Regions in minutes** to serve users worldwide. A service is not limited to one country; C and D building data centers and moving hardware are burdens the cloud removes.

</Quiz>

<Quiz
  qnum={7}
  total={65}
  question="A company keeps some workloads in its own data center and some on AWS, with the two sides connected and working together. Which deployment model is this?"
  options={[
    'Pure cloud deployment',
    'Hybrid deployment',
    'Pure on-premises deployment',
    'Multi-account deployment',
  ]}
  answer={1}>

**Correct: B** — **Hybrid** uses both on-premises and cloud, connected together. A is all in the cloud; C is all on premises; D multi-account is a billing and isolation management method, unrelated to the deployment model.

</Quiz>

<Quiz
  qnum={8}
  total={65}
  question="Which of the following are benefits of cloud computing over traditional on-premises? (Choose TWO)"
  options={[
    'No need to forecast capacity; scale elastically with actual demand',
    'Pay for actual usage and avoid the waste of idle hardware',
    'A three-year fixed fee must be signed before you can start',
    'A data center must be built and operated by yourself',
    'All security work is done by the user in a physical facility',
  ]}
  answer={[0, 1]}>

**Correct: A, B** — The cloud lets you **skip capacity forecasting and scale elastically (A)** and **pay for actual usage (B)**. C a fixed fee contradicts pay-as-you-go; D and E building and operating facilities are exactly what the cloud removes.

</Quiz>

<Quiz
  qnum={9}
  total={65}
  question="Which of the following is the most accurate definition of cloud computing?"
  options={[
    'On-demand delivery of IT resources such as compute, storage, and databases over the internet, with pay-as-you-go pricing',
    'Installing all software on your own laptop to run offline',
    'Buying physical servers once and owning them forever with no further payment',
    'Only a private facility built by a large enterprise counts as cloud',
  ]}
  answer={0}>

**Correct: A** — Cloud computing is the **on-demand delivery of IT resources over the internet with pay-as-you-go pricing**. B offline local install is not cloud; C owning physical servers forever is on-premises procurement; D cloud is not limited to large enterprises.

</Quiz>

<Quiz
  qnum={10}
  total={65}
  question="A team wants to use Infrastructure as Code to build and repeatedly deploy a full set of AWS resources from templates. Which AWS service fits best?"
  options={[
    'AWS CloudFormation',
    'Amazon S3',
    'Amazon CloudWatch',
    'AWS Artifact',
  ]}
  answer={0}>

**Correct: A** — **CloudFormation** defines and deploys resources from templates as code, enabling Infrastructure as Code. B S3 is object storage; C CloudWatch is monitoring; D Artifact is a compliance report portal. None is an IaC tool.

</Quiz>

<Quiz
  qnum={11}
  total={65}
  question="Which statement about the three cloud service models is correct?"
  options={[
    'With IaaS the provider even writes the application for you',
    'IaaS provides infrastructure such as compute, networking, and storage, while the user manages the OS and applications',
    'SaaS requires the user to install and maintain server hardware',
    'PaaS is the same as leasing a physical data center',
  ]}
  answer={1}>

**Correct: B** — **IaaS** (such as EC2) provides infrastructure, and the user manages the OS and applications. A confuses IaaS with SaaS; C SaaS is ready-to-use software with no hardware to manage; D PaaS is a platform service, not a facility lease.

</Quiz>

<Quiz
  qnum={12}
  total={65}
  question="A company signs into and uses a ready-made email or collaboration application in the browser, with no need to manage underlying servers or the OS. Which cloud service model is this?"
  options={[
    'IaaS (Infrastructure as a Service)',
    'PaaS (Platform as a Service)',
    'SaaS (Software as a Service)',
    'On-premises build',
  ]}
  answer={2}>

**Correct: C** — Using a ready-made application without managing the underlying layers is **SaaS**. A IaaS means managing the OS and applications; B PaaS provides a development platform; D a build is the opposite of ready-to-use.

</Quiz>

<Quiz
  qnum={13}
  total={65}
  question="The AWS Well-Architected Framework helps customers design and review workloads against best practices. Which of the following is one of its pillars?"
  options={[
    'Operational Excellence',
    'Physical facility procurement',
    'Fax form processing',
    'Manual disk replacement',
  ]}
  answer={0}>

**Correct: A** — **Operational Excellence** is one pillar of the Well-Architected Framework (others include security, reliability, performance efficiency, cost optimization, and sustainability). B, C, and D are not pillars and are unrelated to cloud best practices.

</Quiz>

<Quiz
  qnum={14}
  total={65}
  question="A company wants to improve availability so that a single facility failure does not take down the whole service. Which approach best matches cloud best practice?"
  options={[
    'Concentrate all servers on a single physical host',
    'Spread the workload across multiple Availability Zones (AZs) in a Region',
    'Disable redundancy to save cost',
    'Deploy in a single AZ and turn off backups',
  ]}
  answer={1}>

**Correct: B** — **Deploying across multiple AZs** keeps the service running if one facility fails, the basic way to improve high availability. A a single host is a single point of failure; C and D disabling redundancy and backups reduce availability and break best practice.

</Quiz>

<Quiz
  qnum={15}
  total={65}
  question="Regarding the cloud benefit of economies of scale, which statement is correct?"
  options={[
    'Because of AWS large-scale purchasing and high usage, unit cost drops and is reflected in prices',
    'The more users there are, the higher the unit price each person pays',
    'Economies of scale mean you must build more facilities yourself',
    'Economies of scale have nothing to do with cloud pricing',
  ]}
  answer={0}>

**Correct: A** — **Economies of scale** let AWS drive down unit cost with huge usage and pass lower prices to customers. B is the opposite of reality; C building facilities is not economies of scale; D it is a key reason the cloud keeps lowering prices.

</Quiz>

<Quiz
  qnum={16}
  total={65}
  question="A team wants to operate AWS manually through a browser graphical interface and also automate with a command line or code. Which TWO are correct ways to access and manage AWS? (Choose TWO)"
  options={[
    'AWS Management Console (web graphical interface)',
    'AWS CLI or SDK (command line and programmatic interface)',
    'Physically walking into an AWS facility to operate the servers',
    'Calling support to press each button on your behalf',
    'Submitting a fax form as the only way to request changes',
  ]}
  answer={[0, 1]}>

**Correct: A, B** — The main ways to access AWS are the **Management Console (A)** and the **CLI or SDK (B)**. C customers cannot enter AWS facilities; D and E relying on support or fax forms are not AWS access methods.

</Quiz>

## Part 2  Security and Compliance

<Quiz
  qnum={17}
  total={65}
  question="In the AWS Shared Responsibility Model, which of the following is the responsibility of AWS (security OF the cloud)?"
  options={[
    'Configuring IAM user password policies and permissions',
    'Protecting physical data centers, facilities, and underlying hardware',
    'Installing security patches on the EC2 operating system',
    'Encrypting customer data stored in S3',
  ]}
  answer={1}>

**Correct: B** — AWS is responsible for **security OF the cloud**: physical facilities, hardware, and global infrastructure. A, C, and D are security IN the cloud: IAM configuration, OS patching, and customer data encryption are the customer responsibility.

</Quiz>

<Quiz
  qnum={18}
  total={65}
  question="In the Shared Responsibility Model, which of the following is the customer responsibility (security IN the cloud)?"
  options={[
    'Protecting physical access to AWS global data centers',
    'Maintaining the underlying virtualization platform (hypervisor)',
    'Managing IAM users, permissions, and encryption of customer data',
    'Replacing failed physical server hardware',
  ]}
  answer={2}>

**Correct: C** — The customer is responsible for **security IN the cloud**: IAM, permissions, data encryption, and OS configuration. A, B, and D are the physical facilities, virtualization platform, and hardware that AWS maintains.

</Quiz>

<Quiz
  qnum={19}
  total={65}
  question="Security best practice advises against using the root user for day-to-day work. Which of the following is the safer and correct approach?"
  options={[
    'Share the root user access keys across the whole team',
    'Create least-privilege IAM users or roles for daily work and enable MFA on the root user',
    'Turn off MFA on all accounts for easier sign-in',
    'Have everyone sign in and operate as the root user',
  ]}
  answer={1}>

**Correct: B** — Best practice is to **create least-privilege IAM identities for daily work**, reserve the root user for the few tasks that require it, and **enable MFA** on it. A sharing root keys, C disabling MFA, and D using root daily are high-risk and break least privilege.

</Quiz>

<Quiz
  qnum={20}
  total={65}
  question="Which of the following best matches the principle of least privilege?"
  options={[
    'Give every user full administrator permissions by default',
    'Grant only the minimum permissions needed to do the job, nothing more',
    'Have everyone share the same root user keys',
    'The more permissions the better, so you never need to adjust later',
  ]}
  answer={1}>

**Correct: B** — Least privilege means **granting only the minimum permissions needed**. A and D over-granting by default widens the risk surface; C sharing root keys breaks both least privilege and individual accountability.

</Quiz>

<Quiz
  qnum={21}
  total={65}
  question="An auditor needs to self-serve AWS compliance reports (such as SOC, ISO, PCI DSS) to prove regulatory compliance. Which service should they use?"
  options={[
    'AWS Artifact',
    'AWS CloudTrail',
    'Amazon Inspector',
    'AWS Trusted Advisor',
  ]}
  answer={0}>

**Correct: A** — **AWS Artifact** is the self-service portal for compliance and audit reports. B CloudTrail records API activity; C Inspector does vulnerability scanning; D Trusted Advisor gives best-practice advice. None is where you download compliance documents.

</Quiz>

<Quiz
  qnum={22}
  total={65}
  question="A security team wants to record who did which API actions on account resources and when, for audit and investigation. Which AWS service fits best?"
  options={[
    'AWS CloudTrail',
    'Amazon S3',
    'AWS Budgets',
    'Amazon Route 53',
  ]}
  answer={0}>

**Correct: A** — **CloudTrail** records API activity in the account for audit and investigation. B S3 is storage; C Budgets does budget alerts; D Route 53 is DNS. None is an API activity log tool.

</Quiz>

<Quiz
  qnum={23}
  total={65}
  question="A team wants to continuously evaluate and record whether AWS resource configurations follow internal rules (for example, whether encryption is enabled). Which service fits best?"
  options={[
    'AWS Config',
    'Amazon CloudFront',
    'AWS Lambda',
    'Amazon SNS',
  ]}
  answer={0}>

**Correct: A** — **AWS Config** continuously tracks resource configuration changes and evaluates compliance. B CloudFront is content delivery; C Lambda is serverless compute; D SNS is notifications. None is a configuration compliance tool.

</Quiz>

<Quiz
  qnum={24}
  total={65}
  question="A company wants to protect a web application from common attacks (such as SQL injection and cross-site scripting) by filtering malicious traffic in front of CloudFront or an ALB. Which service fits best?"
  options={[
    'AWS WAF (Web Application Firewall)',
    'Amazon S3',
    'AWS Cost Explorer',
    'Amazon EBS',
  ]}
  answer={0}>

**Correct: A** — **AWS WAF** is a web application firewall that filters common attacks such as SQL injection and XSS. B S3 is storage; C Cost Explorer analyzes cost; D EBS is block storage. None is web protection.

</Quiz>

<Quiz
  qnum={25}
  total={65}
  question="A gaming website wants to defend against large distributed denial-of-service (DDoS) attacks. Which basic DDoS protection does AWS provide to all customers by default?"
  options={[
    'AWS Shield Standard',
    'AWS Artifact',
    'Amazon Inspector',
    'AWS Config',
  ]}
  answer={0}>

**Correct: A** — **AWS Shield Standard** is free by default for all customers and provides basic DDoS protection (advanced protection is Shield Advanced). B downloads compliance reports; C does vulnerability scanning; D evaluates configuration. None is DDoS protection.

</Quiz>

<Quiz
  qnum={26}
  total={65}
  question="A team wants to centrally manage, rotate, and securely store secrets such as database passwords and API keys, avoiding hardcoding them in source code. Which AWS service fits best?"
  options={[
    'AWS Secrets Manager',
    'Amazon CloudWatch',
    'AWS Trusted Advisor',
    'Amazon VPC',
  ]}
  answer={0}>

**Correct: A** — **Secrets Manager** centrally stores and can automatically rotate secrets such as database passwords and API keys. B is monitoring; C gives best-practice advice; D is a virtual network. None is a secrets manager.

</Quiz>

<Quiz
  qnum={27}
  total={65}
  question="A company wants to encrypt data at rest and in transit and centrally create and manage encryption keys. Which AWS service fits best?"
  options={[
    'AWS KMS (Key Management Service)',
    'Amazon S3 Glacier',
    'AWS CloudFormation',
    'Amazon QuickSight',
  ]}
  answer={0}>

**Correct: A** — **AWS KMS** centrally creates and manages encryption keys for use by other services. B is an archive storage tier; C is Infrastructure as Code; D is a business intelligence tool. None is a key management service.

</Quiz>

<Quiz
  qnum={28}
  total={65}
  question="A team wants to scan EC2 instances and container images for known software vulnerabilities and insecure settings. Which AWS service fits best?"
  options={[
    'Amazon Inspector',
    'AWS Budgets',
    'Amazon Route 53',
    'AWS Artifact',
  ]}
  answer={0}>

**Correct: A** — **Amazon Inspector** automatically scans workloads for known vulnerabilities and insecure settings. B does budget alerts; C is DNS; D downloads compliance reports. None is a vulnerability scanner.

</Quiz>

<Quiz
  qnum={29}
  total={65}
  question="A security team wants to use machine learning to continuously monitor account and network activity and automatically detect suspicious or malicious behavior (threat detection). Which AWS service fits best?"
  options={[
    'Amazon GuardDuty',
    'Amazon S3',
    'AWS Cost Explorer',
    'Amazon EC2',
  ]}
  answer={0}>

**Correct: A** — **Amazon GuardDuty** is an intelligent threat detection service that continuously analyzes activity for suspicious behavior. B is storage; C analyzes cost; D is compute. None is a threat detection service.

</Quiz>

<Quiz
  qnum={30}
  total={65}
  question="In AWS, which of the following is the best-practice way to grant cross-service access with temporary credentials, preferred over long-term access keys?"
  options={[
    'Assign an IAM role to an EC2 instance or service to obtain temporary credentials',
    'Hardcode long-term access keys into the source code',
    'Use root user keys shared by all applications',
    'Post the keys in a public code repository',
  ]}
  answer={0}>

**Correct: A** — Best practice is to **assign an IAM role to obtain temporary credentials**, avoiding long-term keys. B hardcoding keys, C sharing root keys, and D publishing keys are all serious security risks.

</Quiz>

<Quiz
  qnum={31}
  total={65}
  question="A company wants to centrally manage multiple AWS accounts and set a permission ceiling per account using service control policies (SCPs). Which service fits best?"
  options={[
    'AWS Organizations',
    'Amazon CloudWatch',
    'AWS Artifact',
    'Amazon S3',
  ]}
  answer={0}>

**Correct: A** — **AWS Organizations** centrally manages multiple accounts and uses SCPs to set per-account permission ceilings. B is monitoring; C downloads compliance reports; D is storage. None is a multi-account governance tool.

</Quiz>

<Quiz
  qnum={32}
  total={65}
  question="Which of the following is the main security benefit of enabling multi-factor authentication (MFA)?"
  options={[
    'Even if the password leaks, sign-in is hard without the second factor, improving account security',
    'It means the password never needs to be changed',
    'It automatically encrypts all data',
    'It replaces IAM permission configuration',
  ]}
  answer={0}>

**Correct: A** — **MFA** requires a second factor, so **even a leaked password is hard to misuse**. B is unrelated to MFA; C data encryption is handled by KMS and others; D permissions still need IAM, which MFA cannot replace.

</Quiz>

<Quiz
  qnum={33}
  total={65}
  question="Regarding AWS compliance and regulation, which statement is correct?"
  options={[
    'AWS holds many international and regional compliance certifications (such as ISO, SOC, PCI DSS), which customers can leverage to meet their own compliance needs',
    'After using AWS the customer bears no compliance responsibility at all',
    'AWS provides no compliance-related documents',
    'Compliance applies only to physical facilities and has nothing to do with the cloud',
  ]}
  answer={0}>

**Correct: A** — AWS holds many certifications, and customers can obtain reports via Artifact to support their own compliance. B under shared responsibility the customer still has duties; C AWS provides many compliance documents; D compliance applies to the cloud too.

</Quiz>

<Quiz
  qnum={34}
  total={65}
  question="Which TWO of the following are customer responsibilities for security IN the cloud? (Choose TWO)"
  options={[
    'Configuring security group and network ACL (NACL) rules',
    'Choosing and configuring encryption for your own data',
    'Protecting physical access to AWS data centers',
    'Maintaining the underlying hardware and virtualization platform',
    'Replacing failed disks inside an AWS facility',
  ]}
  answer={[0, 1]}>

**Correct: A, B** — **Configuring security groups and NACLs (A)** and **encrypting your own data (B)** are customer responsibilities. C, D, and E physical access, hardware, and disk maintenance are the AWS responsibility for security OF the cloud.

</Quiz>

<Quiz
  qnum={35}
  total={65}
  question="In a VPC, which statement about security groups and network ACLs (NACLs) is correct?"
  options={[
    'A security group acts at the instance level and is stateful; a NACL acts at the subnet level and is stateless',
    'They are identical and interchangeable',
    'A security group can be used only in a physical data center',
    'A NACL can only deny traffic and can never allow any traffic',
  ]}
  answer={0}>

**Correct: A** — A **security group acts at the instance level and is stateful; a NACL acts at the subnet level and is stateless**. B they differ; C a security group is a cloud VPC mechanism; D a NACL can set both allow and deny rules.

</Quiz>

## Part 3  Technology and Services

<Quiz
  qnum={36}
  total={65}
  question="A company needs to store many user-uploaded images and backups with high durability, nearly unlimited capacity, and pay-for-what-you-use object storage. Which service fits best?"
  options={[
    'Amazon EC2',
    'Amazon S3',
    'Amazon RDS',
    'Amazon VPC',
  ]}
  answer={1}>

**Correct: B** — **Amazon S3** is object storage with very high durability, nearly unlimited capacity, and usage-based billing. A EC2 is compute; C RDS is a relational database; D VPC is a virtual network. None is object storage.

</Quiz>

<Quiz
  qnum={37}
  total={65}
  question="A team just wants to run code with no servers to manage. The code is event-triggered, runs a few seconds each time, and should cost nothing while idle. Which serverless service fits best?"
  options={[
    'Amazon EC2',
    'AWS Lambda',
    'Amazon EBS',
    'Amazon Route 53',
  ]}
  answer={1}>

**Correct: B** — **AWS Lambda** is serverless compute: event-triggered, billed by usage, and free while idle. A EC2 means managing servers; C EBS is block storage; D Route 53 is DNS. None is serverless compute.

</Quiz>

<Quiz
  qnum={38}
  total={65}
  question="A company wants a virtual server in the cloud with full control of the operating system where it can install its own software. Which AWS service fits best?"
  options={[
    'Amazon EC2',
    'Amazon S3',
    'AWS Lambda',
    'Amazon DynamoDB',
  ]}
  answer={0}>

**Correct: A** — **Amazon EC2** provides a virtual server with full control of the OS. B is object storage; C is a serverless function with no long-lived OS control; D is a NoSQL database. None is a virtual server.

</Quiz>

<Quiz
  qnum={39}
  total={65}
  question="A company wants a fully managed relational database (such as MySQL or PostgreSQL) where AWS handles backups, patching, and high availability. Which service fits best?"
  options={[
    'Amazon RDS',
    'Amazon S3',
    'Amazon CloudFront',
    'AWS Lambda',
  ]}
  answer={0}>

**Correct: A** — **Amazon RDS** is a managed relational database where AWS handles backups, patching, and high availability. B is object storage; C is content delivery; D is serverless compute. None is a relational database service.

</Quiz>

<Quiz
  qnum={40}
  total={65}
  question="A mobile app needs an extremely low-latency, automatically scalable key-value NoSQL database. Which AWS service fits best?"
  options={[
    'Amazon DynamoDB',
    'Amazon RDS',
    'Amazon Redshift',
    'Amazon S3',
  ]}
  answer={0}>

**Correct: A** — **Amazon DynamoDB** is a fully managed NoSQL key-value database with single-digit millisecond latency and automatic scaling. B is relational; C is a data warehouse; D is object storage. None fits the key-value NoSQL need.

</Quiz>

<Quiz
  qnum={41}
  total={65}
  question="An enterprise wants to run complex analytical queries over terabytes to petabytes of historical data (data warehousing). Which AWS service fits best?"
  options={[
    'Amazon Redshift',
    'Amazon DynamoDB',
    'Amazon Route 53',
    'Amazon SQS',
  ]}
  answer={0}>

**Correct: A** — **Amazon Redshift** is a cloud data warehouse built for large-scale analytical queries. B suits fast key-value access; C is DNS; D is a message queue. None is a data warehouse.

</Quiz>

<Quiz
  qnum={42}
  total={65}
  question="A global website wants to cache static and dynamic content at edge locations near users to reduce latency. Which AWS service fits best?"
  options={[
    'Amazon CloudFront',
    'Amazon S3',
    'AWS Lambda',
    'Amazon RDS',
  ]}
  answer={0}>

**Correct: A** — **Amazon CloudFront** is a content delivery network (CDN) that caches content at edge locations to reduce latency. B only stores; C is compute; D is a database. None is a CDN.

</Quiz>

<Quiz
  qnum={43}
  total={65}
  question="A company wants to register a domain and resolve domain names to resources on AWS (DNS service). Which AWS service fits best?"
  options={[
    'Amazon Route 53',
    'Amazon CloudFront',
    'Amazon VPC',
    'Amazon S3',
  ]}
  answer={0}>

**Correct: A** — **Amazon Route 53** is the AWS DNS and domain registration service. B is a CDN; C is a virtual network; D is object storage. None is a DNS service.

</Quiz>

<Quiz
  qnum={44}
  total={65}
  question="A team wants to distribute incoming traffic evenly across multiple EC2 instances and automatically route traffic to healthy instances when one fails. Which service fits best?"
  options={[
    'Elastic Load Balancing (ELB)',
    'Amazon S3',
    'AWS Budgets',
    'Amazon Athena',
  ]}
  answer={0}>

**Correct: A** — **Elastic Load Balancing** automatically distributes traffic across multiple healthy instances. B is storage; C does budget alerts; D is a query service. None is a load balancer.

</Quiz>

<Quiz
  qnum={45}
  total={65}
  question="A team wants to automatically add or remove EC2 instances based on load, scaling out when traffic is high and in when it is low to save money. Which service fits best?"
  options={[
    'Amazon EC2 Auto Scaling',
    'Amazon S3',
    'AWS Artifact',
    'Amazon Rekognition',
  ]}
  answer={0}>

**Correct: A** — **EC2 Auto Scaling** adjusts instance count with load, balancing performance and cost. B is storage; C downloads compliance reports; D is image recognition. None is auto scaling.

</Quiz>

<Quiz
  qnum={46}
  total={65}
  question="A team wants to decouple microservices with an asynchronous message queue so that messages are not lost when one component is temporarily busy. Which service fits best?"
  options={[
    'Amazon SQS (Simple Queue Service)',
    'Amazon S3',
    'Amazon RDS',
    'AWS KMS',
  ]}
  answer={0}>

**Correct: A** — **Amazon SQS** is a managed message queue for asynchronous decoupling that avoids message loss. B is storage; C is a database; D is key management. None is a message queue.

</Quiz>

<Quiz
  qnum={47}
  total={65}
  question="When a system event occurs, the team needs to notify multiple subscribers by email and SMS at once (publish/subscribe). Which AWS service fits best?"
  options={[
    'Amazon SNS (Simple Notification Service)',
    'Amazon EBS',
    'Amazon VPC',
    'Amazon Redshift',
  ]}
  answer={0}>

**Correct: A** — **Amazon SNS** is a publish/subscribe notification service that pushes to multiple subscribers at once (including email and SMS). B is block storage; C is a virtual network; D is a data warehouse. None is a notification service.

</Quiz>

<Quiz
  qnum={48}
  total={65}
  question="A company needs to physically move tens of terabytes of on-premises data to AWS, with limited bandwidth and no wish to upload slowly over the network. Which service fits best?"
  options={[
    'AWS Snowball',
    'Amazon CloudFront',
    'AWS Lambda',
    'Amazon SNS',
  ]}
  answer={0}>

**Correct: A** — **AWS Snowball** moves large data offline on a physical device to AWS, ideal for large migrations with limited bandwidth. B is a CDN; C is compute; D is notifications. None is a data transfer device.

</Quiz>

<Quiz
  qnum={49}
  total={65}
  question="A team wants to run standard SQL queries directly on data stored in S3 without setting up and maintaining servers or a database. Which service fits best?"
  options={[
    'Amazon Athena',
    'Amazon EC2',
    'Amazon EBS',
    'Amazon Route 53',
  ]}
  answer={0}>

**Correct: A** — **Amazon Athena** is a serverless query service that runs SQL directly on data in S3. B is a virtual server; C is block storage; D is DNS. None fits the serverless query need.

</Quiz>

<Quiz
  qnum={50}
  total={65}
  question="A team wants to package an application into containers and run and orchestrate them on AWS in a managed way. Which of the following is the AWS container orchestration service?"
  options={[
    'Amazon ECS / Amazon EKS',
    'Amazon S3',
    'AWS Budgets',
    'Amazon QuickSight',
  ]}
  answer={0}>

**Correct: A** — **Amazon ECS / EKS** are the AWS container orchestration services (EKS is managed Kubernetes). B is storage; C does budgets; D is business intelligence. None is container orchestration.

</Quiz>

<Quiz
  qnum={51}
  total={65}
  question="A team wants to monitor AWS resource metrics (such as CPU utilization), collect logs, and trigger alarms when a threshold is exceeded, and also record which API actions were taken on resources for audit. Which TWO services pair up correctly? (Choose TWO)"
  options={[
    'Amazon CloudWatch handles metrics, logs, and alarms',
    'AWS CloudTrail records the API activity trail in the account',
    'Amazon S3 monitors metrics and triggers alarms',
    'AWS Artifact records the API activity trail',
    'Amazon Route 53 collects performance metrics',
  ]}
  answer={[0, 1]}>

**Correct: A, B** — **CloudWatch handles metrics, logs, and alarms (A)**, and **CloudTrail records the API activity trail for audit (B)**; the two are commonly paired. C S3 is storage and does not monitor; D Artifact is a compliance report portal; E Route 53 is DNS. None of those is a monitoring or audit tool.

</Quiz>

<Quiz
  qnum={52}
  total={65}
  question="A team wants to attach a disk-like block storage volume to an EC2 instance for the OS and data. Which service fits best?"
  options={[
    'Amazon EBS (Elastic Block Store)',
    'Amazon S3',
    'Amazon CloudFront',
    'Amazon SNS',
  ]}
  answer={0}>

**Correct: A** — **Amazon EBS** is a block storage volume attached to EC2. B is object (not block) storage; C is a CDN; D is notifications. None is an EC2 block volume.

</Quiz>

<Quiz
  qnum={53}
  total={65}
  question="A team wants to build a logically isolated virtual network on AWS with custom subnets, routes, and gateways. Which service fits best?"
  options={[
    'Amazon VPC (Virtual Private Cloud)',
    'Amazon S3',
    'AWS Lambda',
    'Amazon RDS',
  ]}
  answer={0}>

**Correct: A** — **Amazon VPC** lets you build a logically isolated virtual network with custom subnets and routes. B is storage; C is compute; D is a database. None is a virtual network service.

</Quiz>

<Quiz
  qnum={54}
  total={65}
  question="A team needs managed file storage (a file system) that multiple EC2 instances can mount and share at the same time. Which AWS service fits best?"
  options={[
    'Amazon EFS (Elastic File System)',
    'Amazon S3 Glacier',
    'Amazon DynamoDB',
    'Amazon Athena',
  ]}
  answer={0}>

**Correct: A** — **Amazon EFS** is a managed shared file system that many EC2 instances can mount at once. B is archive storage; C is a NoSQL database; D is a query service. None is a shared file system.

</Quiz>

<Quiz
  qnum={55}
  total={65}
  question="A team wants to host code and run it serverlessly without managing the underlying infrastructure. Which TWO are AWS serverless services? (Choose TWO)"
  options={[
    'AWS Lambda',
    'Amazon DynamoDB',
    'Amazon EC2',
    'An on-premises physical server',
    'A self-purchased rack server',
  ]}
  answer={[0, 1]}>

**Correct: A, B** — **Lambda (A)** and **DynamoDB (B)** are serverless services with no underlying servers to manage. C EC2 requires managing virtual servers; D and E are on-premises physical hardware. None of those is serverless.

</Quiz>

<Quiz
  qnum={56}
  total={65}
  question="A company backs up rarely accessed data for long-term archival and can tolerate retrieval taking minutes to hours, wanting the lowest-cost storage tier. Which option fits best?"
  options={[
    'Amazon S3 Glacier (archive storage tier)',
    'Amazon S3 Standard',
    'Amazon EBS gp3',
    'Amazon EC2 instance store',
  ]}
  answer={0}>

**Correct: A** — **S3 Glacier** is a low-cost archive tier for rarely accessed, long-term data where longer retrieval times are acceptable. B Standard suits frequent access at a higher unit price; C and D are block and ephemeral storage for instances. None fits lowest-cost long-term archival.

</Quiz>

<Quiz
  qnum={57}
  total={65}
  question="A team new to the cloud wants to quickly deploy a web application by just uploading code, leaving capacity, load balancing, scaling, and health checks to AWS automatically. Which service fits best?"
  options={[
    'AWS Elastic Beanstalk',
    'Amazon S3',
    'AWS Artifact',
    'Amazon Inspector',
  ]}
  answer={0}>

**Correct: A** — **Elastic Beanstalk** lets you upload code while the platform handles capacity provisioning, load balancing, scaling, and monitoring. B is storage; C downloads compliance reports; D does vulnerability scanning. None is an application deployment platform.

</Quiz>

## Part 4  Billing, Pricing, and Support

<Quiz
  qnum={58}
  total={65}
  question="A steady production server must run all year with predictable usage, and the team is willing to make a 1-year or 3-year commitment for the biggest discount. Which EC2 pricing model is most cost-effective?"
  options={[
    'On-Demand instances',
    'Spot Instances',
    'Reserved Instances or Savings Plans',
    'Dedicated Hosts',
  ]}
  answer={2}>

**Correct: C** — With steady, predictable usage and a 1- or 3-year commitment, **Reserved Instances or Savings Plans** give the biggest discount. A On-Demand pays list price and is most expensive; B Spot gets reclaimed and does not suit production; D Dedicated Hosts are the most expensive, meant for compliance or BYOL.

</Quiz>

<Quiz
  qnum={59}
  total={65}
  question="A team runs an interruption-tolerant, run-and-discard batch job and wants compute at the lowest unit price, accepting that resources may occasionally be reclaimed. Which EC2 pricing model fits best?"
  options={[
    'Reserved Instances',
    'Spot Instances',
    'On-Demand instances',
    'Dedicated Hosts',
  ]}
  answer={1}>

**Correct: B** — Interruption-tolerant, retryable, lowest unit price is the classic **Spot Instances** scenario, saving up to about 90 percent. A suits steady long-term loads; C On-Demand has no discount; D Dedicated Hosts are the most expensive. None of those fits.

</Quiz>

<Quiz
  qnum={60}
  total={65}
  question="A company wants a proactive alert when cost exceeds a fixed dollar threshold it sets, to keep the bill from running out of control. Which tool fits best?"
  options={[
    'AWS Budgets',
    'AWS CloudTrail',
    'Amazon CloudWatch Logs',
    'AWS Config',
  ]}
  answer={0}>

**Correct: A** — **AWS Budgets** sets a cost or usage threshold and alerts once it is exceeded. B records API activity; C collects logs; D tracks configuration changes. None is a budget-threshold alerting tool.

</Quiz>

<Quiz
  qnum={61}
  total={65}
  question="A finance team wants to visualize and analyze past AWS cost and usage trends to find the highest-spend services. Which tool fits best?"
  options={[
    'AWS Cost Explorer',
    'AWS CloudTrail',
    'Amazon Inspector',
    'AWS Shield',
  ]}
  answer={0}>

**Correct: A** — **Cost Explorer** visualizes and analyzes historical cost and usage trends with charts. B records API activity; C does vulnerability scanning; D does DDoS protection. None is a cost analysis tool.

</Quiz>

<Quiz
  qnum={62}
  total={65}
  question="A group has multiple department accounts under Organizations and wants a single consolidated bill, simpler reconciliation, aggregated usage for larger volume discounts, and shared reserved plans. Which approach fits best?"
  options={[
    'Manage and pay in each account separately by hand',
    'Use Consolidated Billing in AWS Organizations',
    'Merge all departments into a single shared-login account',
    'Contact support per account to issue separate invoices',
  ]}
  answer={1}>

**Correct: B** — **Consolidated Billing** combines accounts into a single bill, simplifies reconciliation, and aggregates usage for larger volume discounts and shared RI and Savings Plans. A cannot aggregate usage; C merging into one account loses isolation; D per-account invoices neither consolidate nor share discounts.

</Quiz>

<Quiz
  qnum={63}
  total={65}
  question="An enterprise needs support at a level that responds to a critical system outage in under 15 minutes and can assign a dedicated Technical Account Manager (TAM). Which plan should it subscribe to?"
  options={[
    'Basic Support',
    'Developer Support',
    'Business Support',
    'Enterprise Support',
  ]}
  answer={3}>

**Correct: D** — The plan with a **dedicated TAM and the fastest response tier** is **Enterprise Support**. A offers only billing and service-health info; B is for dev and test with business-hours responses; C has 24/7 technical support but no dedicated TAM.

</Quiz>

<Quiz
  qnum={64}
  total={65}
  question="A team wants to estimate roughly how much a planned architecture would cost per month on AWS to set a budget. Which official AWS tool estimates costs in advance?"
  options={[
    'AWS Pricing Calculator',
    'AWS CloudTrail',
    'Amazon GuardDuty',
    'AWS Artifact',
  ]}
  answer={0}>

**Correct: A** — The **AWS Pricing Calculator** estimates the expected monthly cost of a planned architecture before deployment. B records API activity; C does threat detection; D downloads compliance reports. None is a cost estimation tool.

</Quiz>

<Quiz
  qnum={65}
  total={65}
  question="Regarding AWS support plans and billing tools, which TWO statements are correct? (Choose TWO)"
  options={[
    'Basic Support is free for all customers and provides billing and service-health info',
    'Enterprise Support provides a dedicated Technical Account Manager (TAM)',
    'Spot Instances are always better than Reserved Instances for a production environment that cannot be interrupted',
    'The purpose of AWS Budgets is to store object files',
    'The only function of Cost Explorer is to scan for vulnerabilities',
  ]}
  answer={[0, 1]}>

**Correct: A, B** — **Basic is free for all customers (A)** and **Enterprise provides a dedicated TAM (B)**. C is backwards: a non-interruptible production environment should not use reclaimable Spot; D Budgets is for budget alerts, not storage; E Cost Explorer is for cost analysis, not vulnerability scanning.

</Quiz>

---

👉 Review: [CLF Flashcards](./clf-flashcards.md)
