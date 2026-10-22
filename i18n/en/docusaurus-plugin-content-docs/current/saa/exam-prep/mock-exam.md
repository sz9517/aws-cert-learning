---
sidebar_position: 2
title: Full Mock Exam (65 questions)
---

# SAA-C03 Full Mock Exam (65 questions)

This is a **full-length mock** that matches the real exam scale: 65 questions across all four domains, with question style and weighting modeled on SAA-C03. Pick your answer first, then click "**Show answer & explanation**" to compare. All questions are **original**, written in the official style (scenario stems + qualifiers + some multiple-answer), and are **not real exam questions**.

:::info Suggested exam conditions
- **Count / time**: 65 questions, suggested limit of **130 minutes** (about 2 minutes per question) to simulate the real pace.
- **Passing score**: the official bar is **720 / 1000**; for this mock, treat about 47 correct (72 percent) as your pass line.
- **Domain distribution** (mirrors the official weighting): Domain 1 Security Q1-20, Domain 2 Resilience/HA Q21-37, Domain 3 High Performance Q38-52, Domain 4 Cost Q53-65.
- **Multiple-answer questions** are marked "Choose TWO / 選兩項" in the stem; select exactly two, no more and no less.
- Finish all questions before checking answers to simulate not looking things up mid-exam; for targeted review, you can also practice a single domain using the question ranges above.
:::

:::tip How to answer
Circle the **qualifier** in the stem first (most cost-effective, least operational overhead, highly available, most secure, real-time, lowest latency...), then eliminate options. Guess and flag anything you are stuck on, and bank the points you know first. If needed, review the keyword-to-answer reflexes in the [Exam Cram Sheet](/saa/exam-prep/cram) first.
:::

## Domain 1 · Design Secure Architectures (Q1-20)

<Quiz
  qnum={1}
  total={65}
  question="A Lambda function needs to read one DynamoDB table in the same account and write to CloudWatch Logs. The security team requires that it be granted only just enough permission and that no wildcard Action be used. Which approach best follows least privilege?"
  options={[
    'Attach the AWS managed policy AdministratorAccess to avoid missing permissions later',
    'Create a customer managed policy that allows only the specific DynamoDB actions on that table plus the log-write actions, scoped to the resource ARN',
    'Embed an IAM user Access Key directly in the function code',
    'Attach the PowerUserAccess managed policy to the function',
  ]}
  answer={1}>

**Correct: B**

The standard least-privilege approach is to **author a customer managed policy that narrows both Action and Resource (ARN) to just what is needed**, rather than wildcards or broad managed policies. A AdministratorAccess is far too broad; D PowerUserAccess still greatly exceeds the need; C embeds long-term credentials, which is insecure and violates the rule that a Lambda function should get temporary credentials from the execution role.

</Quiz>

<Quiz
  qnum={2}
  total={65}
  question="A company just created an AWS account and the security team wants to apply best practices for protecting the Root user. Which TWO actions are correct? (Choose TWO)"
  options={[
    'Enable MFA on the Root user',
    'Use an IAM identity with only the needed permissions for daily build work, and stop using Root',
    'Share the Root Access Key with all administrators for convenience',
    'Delete the Root user account to eliminate the risk entirely',
    'Write the Root password in a shared spreadsheet for the team to look up',
  ]}
  answer={[0, 1]}>

**Correct: A, B**

The two core principles for protecting Root are to **enable MFA on Root (A)** and to **switch daily work to a least-privilege IAM identity, locking Root away for the rare cases that need it (B)**. C sharing the Root key cannot be audited and is extremely dangerous; D the Root user cannot be deleted because it is the account itself; E a shared spreadsheet is active leakage.

</Quiz>

<Quiz
  qnum={3}
  total={65}
  question="An enterprise adopts AWS IAM Identity Center (formerly AWS SSO) so employees can sign in with the existing corporate identity and access to many AWS accounts can be managed centrally. Which statement is most accurate?"
  options={[
    'A separate set of IAM users must be created by hand in every account before anyone can sign in',
    'IAM Identity Center can connect to an external identity provider and assign permission sets centrally across many accounts, with users signing in using temporary credentials',
    'It can manage only a single AWS account and cannot work across accounts',
    'Users automatically receive Root permissions in every account after signing in',
  ]}
  answer={1}>

**Correct: B**

**IAM Identity Center** can connect to an external identity provider (such as the existing corporate directory or IdP) and uses **permission sets** to assign access centrally across many accounts under Organizations, with users signing in through SSO using **temporary credentials**, avoiding long-term IAM users in every account. A is the opposite of its centralized design; C it is built for the multi-account case; D sign-in grants the assigned permissions, never Root.

</Quiz>

<Quiz
  qnum={4}
  total={65}
  question="A system encrypts S3 objects with a customer managed key (CMK). Compliance requires that the key material rotate automatically on a schedule with no manual intervention. Which approach fits best?"
  options={[
    'Manually create a new key and re-encrypt all existing data',
    'Enable KMS automatic key rotation on the CMK so the key material rotates yearly on its own',
    'Switch to an AWS owned key to avoid the hassle of rotation',
    'Export the key material locally and replace it periodically by hand',
  ]}
  answer={1}>

**Correct: B**

A symmetric CMK can simply have **KMS automatic key rotation enabled**, after which KMS generates new key material on a schedule (yearly by default) while keeping older material to decrypt existing ciphertext, with no manual work. A manual re-encryption is high overhead and unnecessary; C an AWS owned key cannot satisfy the self-controlled compliance need; D exporting key material to replace by hand is complex and violates the design where key material does not leave KMS.

</Quiz>

<Quiz
  qnum={5}
  total={65}
  question="A team runs a tool on EC2 and opened TCP 8080 inbound through a Security Group for external testing. After testing, they added a Deny 8080 rule to the Security Group, but connections still go through. What is the most likely reason?"
  options={[
    'A Security Group does not support Deny rules and is defined only by allow rules, so the allow rule must be removed to block the traffic',
    'A Security Group Deny rule takes 24 hours to take effect',
    'The Root user must be used to apply a Deny rule',
    'A Security Group works only for UDP and not for TCP',
  ]}
  answer={0}>

**Correct: A**

A **Security Group supports only allow rules and has no concept of Deny**; any traffic not explicitly allowed is already blocked. To close 8080, the correct action is to **remove the rule that allows 8080**, not add a Deny. If a Deny for a specific source is needed, use the stateless NACL at the subnet level. B, C, and D are all fictional limits.

</Quiz>

<Quiz
  qnum={6}
  total={65}
  question="A financial company offers KMS-encrypted backups in several Regions and requires that, when the primary Region is unavailable, another Region can decrypt the same ciphertext with a matching key. Which approach fits best?"
  options={[
    'Create a completely unrelated CMK in each Region and encrypt each backup separately',
    'Use KMS multi-Region keys, creating replica keys in several Regions that share the same key material',
    'Copy the key material of a single-Region CMK in plaintext to the other Regions',
    'Disable encryption to ensure the data can be read in every Region',
  ]}
  answer={1}>

**Correct: B**

**KMS multi-Region keys** let a primary key and its per-Region replicas **share the same key material and key ID**, so ciphertext encrypted in Region A can be decrypted in Region B with the matching replica, which fits cross-Region disaster recovery. A unrelated keys cannot decrypt each other ciphertext; C copying key material in plaintext violates the security design and is not possible; D disabling encryption directly breaks compliance.

</Quiz>

<Quiz
  qnum={7}
  total={65}
  question="A company requires that server-side encryption be enforced on all new objects uploaded to S3, that AWS fully manage the keys, and that operational overhead be the lowest. The bucket has no special key-auditing or key-access-control needs. Which approach fits best?"
  options={[
    'Set default encryption on the bucket using SSE-S3 (keys managed by S3)',
    'Require each uploader to encrypt client-side with a self-supplied key before upload',
    'Move the objects to local EC2 disks and encrypt them yourself',
    'Skip encryption and instead restrict source IP with a bucket policy',
  ]}
  answer={0}>

**Correct: A**

When the need is enforced server-side encryption with keys fully managed by AWS, lowest operational overhead, and no custom key policy or auditing, **SSE-S3 (default encryption)** fits best: once set, all new objects are encrypted automatically and keys are managed by S3 with zero maintenance. SSE-KMS is needed only when a custom key policy and CloudTrail auditing are required. B client-side keys are high overhead; C moves off S3; D IP restriction is not encryption.

</Quiz>

<Quiz
  qnum={8}
  total={65}
  question="A containerized application needs a database connection string and an API key at startup. The requirement is centralized, encrypted storage, and the API key must rotate automatically on a schedule. Which combination fits best?"
  options={[
    'Put all secrets in Parameter Store standard parameters and update them by hand',
    'Put the API key that needs automatic rotation in Secrets Manager, and put the other non-rotating settings in Parameter Store',
    'Write all secrets into the container image as environment variables',
    'Put the secrets in a public S3 bucket so the container can read them anytime',
  ]}
  answer={1}>

**Correct: B**

**Secrets Manager has built-in automatic rotation**, suited to API keys and database credentials that must rotate; non-rotating general settings can go in the lower-cost **Parameter Store**, and this split fits the need best. A standard parameters have no built-in automatic rotation; C baking secrets into the image leaks them with the image; D a public bucket is outright leakage.

</Quiz>

<Quiz
  qnum={9}
  total={65}
  question="A public web application sits behind CloudFront and an ALB and keeps receiving malicious crawlers from a specific country and requests carrying SQL injection. The company wants to filter these layer-7 malicious requests as close to users as possible at the edge. Which approach fits best?"
  options={[
    'Apply AWS WAF on CloudFront, enabling the SQL injection managed rule and adding a geo-blocking rule',
    'Use a NACL to block malicious strings by request payload',
    'Close all inbound traffic on the ALB Security Group',
    'Change the application domain name to evade the crawlers',
  ]}
  answer={0}>

**Correct: A**

**AWS WAF can attach directly to CloudFront** and inspect HTTP request content at the edge: the SQL injection managed rule blocks layer-7 injection, and a geo-match rule blocks the specific country, covering both threats. B a NACL sees only IP and port and cannot read request payload; C closing all inbound blocks legitimate users too; D changing the domain is not a security control.

</Quiz>

<Quiz
  qnum={10}
  total={65}
  question="An application in a private subnet needs to call the Amazon KMS and Secrets Manager APIs, and security requires that the traffic never traverse the internet. Neither service is S3 or DynamoDB. Which approach fits best?"
  options={[
    'Create a Gateway Endpoint for each of KMS and Secrets Manager',
    'Create an Interface Endpoint (PrivateLink) for each of KMS and Secrets Manager, placing a private-IP network interface in the subnet',
    'Set up a NAT Gateway so traffic goes out to the internet to call the APIs',
    'Add an Internet Gateway to the subnet and assign public IPs',
  ]}
  answer={1}>

**Correct: B**

**Gateway Endpoints support only S3 and DynamoDB**; services like KMS and Secrets Manager require **Interface Endpoints (PrivateLink)**, which place an elastic network interface with a private IP in the subnet so traffic stays entirely on the AWS internal network. A is wrong because these two services do not support Gateway Endpoints; C and D both route traffic to the internet, violating the requirement.

</Quiz>

<Quiz
  qnum={11}
  total={65}
  question="A company has a Production OU and a Sandbox OU under AWS Organizations. The security team requires that all accounts in the Production OU can create resources only in ap-northeast-1 and us-east-1, with no exception even for an account administrator. Which approach fits best?"
  options={[
    'Apply an SCP to the Production OU with a condition that allows operations only in those two Regions',
    'Add a Region-restriction policy to every user in every account one by one',
    'Set a permissions boundary on each role to restrict the Region',
    'Request a service quota of 0 for the other Regions',
  ]}
  answer={0}>

**Correct: A**

An **SCP can apply at the OU level** and, with a condition such as aws:RequestedRegion, limit every account in the OU to the specified Regions, with even an account administrator unable to break this permission ceiling, which best enforces a Region boundary across many accounts. B per-user maintenance is error-prone and misses new users; C a permissions boundary targets a single identity and does not cover a whole account; D adjusting quotas is capacity management, not a security control, and is unreliable.

</Quiz>

<Quiz
  qnum={12}
  total={65}
  question="A team wants inbound traffic to the ALB allowed only from CloudFront and to reject users connecting to the ALB directly. The ALB itself needs only HTTPS open. Which TWO settings are correct and most secure? (Choose TWO)"
  options={[
    'Allow only 443 (HTTPS) inbound on the ALB Security Group',
    'Restrict the source on the ALB Security Group to CloudFront using the AWS managed prefix list (com.amazonaws.global.cloudfront.origin-facing)',
    'Make the ALB public and allow all ports inbound from 0.0.0.0/0',
    'Use a NACL to filter the source by the HTTP request Host header',
    'Remove the ALB Security Group so it does not block traffic',
  ]}
  answer={[0, 1]}>

**Correct: A, B**

**Allowing only 443 (A)** narrows the inbound protocol, and **restricting the source to the CloudFront AWS managed prefix list (B)** makes the ALB accept connections only from CloudFront and reject direct hits that bypass the CDN, so together they are most secure. C opening all ports to the world is least secure; D a NACL sees only IP and port and cannot read the Host header; E removing the SG strips the defense.

</Quiz>

<Quiz
  qnum={13}
  total={65}
  question="A partner in an external AWS account needs temporary access to a specific S3 bucket in your account. The access window varies but is usually a few hours, and the company requires that no long-term key ever be handed over and that the partner be forced to use MFA to assume the role. Which approach fits best?"
  options={[
    'Create a cross-account IAM role in your account that trusts the partner account and adds an MFA condition to the trust policy, and have the partner use STS AssumeRole to get temporary credentials',
    'Create an IAM user in your account and mail the Access Key to the partner for long-term storage',
    'Make the bucket publicly readable and writable so the partner can access it directly',
    'Share your Root user credentials with the partner',
  ]}
  answer={0}>

**Correct: A**

The standard pattern for temporary cross-account access is to **create an IAM role in the resource account that trusts the partner account** and to **add an MFA condition (aws:MultiFactorAuthPresent) to the trust policy**, with the partner using **STS AssumeRole** to obtain time-limited temporary credentials that expire after use, with no long-term key anywhere. B hands over a long-term key and breaks the requirement; C a public bucket leaks data; D sharing Root is the worst.

</Quiz>

<Quiz
  qnum={14}
  total={65}
  question="A company requires that every connection to an S3 bucket must use HTTPS (encryption in transit) or be denied. The control must apply at the bucket level for all requesters. Which approach fits best?"
  options={[
    'Add a condition to the bucket policy that explicitly denies when aws:SecureTransport is false',
    'Manually configure each client to use HTTPS only',
    'Make the bucket public but open it only during the day',
    'Use a NACL to block the HTTP port instead',
  ]}
  answer={0}>

**Correct: A**

Adding a **bucket policy** statement that **explicitly denies when aws:SecureTransport is false (that is, over HTTP)** enforces HTTPS for all requests at the bucket level regardless of who the requester is. B relying on client discipline is unreliable and cannot enforce; C a public bucket breaks security; D a NACL acts at the subnet level and cannot govern S3 API requests coming from anywhere.

</Quiz>

<Quiz
  qnum={15}
  total={65}
  question="A company suspects an attacker is trying to enumerate IAM permissions, with an abnormal surge of API calls and suspicious outbound connections. The company wants to continuously and automatically detect such threat behavior with the least operational overhead, without deploying its own detection rules. Which service fits best?"
  options={[
    'Amazon GuardDuty',
    'AWS Config',
    'AWS CloudTrail (event history only)',
    'Amazon Inspector',
  ]}
  answer={0}>

**Correct: A**

**GuardDuty** continuously analyzes sources such as CloudTrail, VPC Flow Logs, and DNS logs and uses built-in threat intelligence and machine learning to **automatically detect abnormal API calls, permission enumeration, and suspicious connections**, working out of the box with the least overhead. B Config evaluates configuration compliance rather than threat behavior; C CloudTrail only records API activity and does no threat analysis itself; D Inspector does vulnerability scanning (such as CVEs on EC2 and containers), not behavioral threat detection.

</Quiz>

<Quiz
  qnum={16}
  total={65}
  question="A team wants to manage the security posture across a whole AWS Organizations centrally, aggregating findings from several services such as GuardDuty and Inspector into one dashboard and checking compliance against AWS baselines. Which service fits best?"
  options={[
    'AWS Security Hub',
    'Amazon CloudWatch Dashboards',
    'The cost pillar of AWS Trusted Advisor',
    'AWS Systems Manager Session Manager',
  ]}
  answer={0}>

**Correct: A**

**Security Hub** is purpose-built to **aggregate findings from several security services (GuardDuty, Inspector, Macie, and more) into a single view** and automatically check compliance against baselines such as AWS Foundational Security Best Practices and CIS, making it the choice for centralized security posture management across an organization. B CloudWatch Dashboards are general metric panels and do no security baseline scoring; C the Trusted Advisor cost pillar is unrelated to security aggregation; D Session Manager is a remote-connection tool that needs no open ports.

</Quiz>

<Quiz
  qnum={17}
  total={65}
  question="A company wants operations staff to remotely sign in to EC2 in a private subnet for maintenance, but security requires that port 22 not be open to the outside and that no SSH keys or bastion host be managed. Which approach fits best?"
  options={[
    'Use Systems Manager Session Manager to connect through the SSM Agent, with no port 22 open and no keys',
    'Open port 22 to 0.0.0.0/0 on the Security Group for worldwide access',
    'Stand up a public bastion host and share one SSH private key',
    'Move the EC2 instances to a public subnet and assign public IPs',
  ]}
  answer={0}>

**Correct: A**

**Session Manager** connects through the SSM Agent on the instance using IAM authorization, needing **no open port 22, no SSH keys, and no bastion host**, with all sessions auditable through CloudTrail, giving the lowest overhead and attack surface. B opening 22 to the world is very high risk; C a bastion and shared private key add attack surface and operations; D exposing instances to the public internet breaks the requirement.

</Quiz>

<Quiz
  qnum={18}
  total={65}
  question="A company shares one internal API service across several VPCs and accounts and wants consumers to access the service privately, with traffic not traversing the internet and without peering VPCs or managing routes. As the service provider, which approach fits best?"
  options={[
    'Place the service behind an NLB and create a VPC endpoint service (AWS PrivateLink) so consumers access it privately through Interface Endpoints',
    'Make the service public and require consumers to connect over public IPs',
    'Create a VPC peering connection for every pair of VPCs and maintain routes by hand',
    'Deploy the service to a public S3 bucket for download',
  ]}
  answer={0}>

**Correct: A**

**AWS PrivateLink (a VPC endpoint service)** lets the provider place the service behind an **NLB** and publish it as an endpoint service, and each consumer creates an **Interface Endpoint** in its own VPC for private access, with traffic staying on the AWS internal network, not exposed to the internet, and no peering or complex routing needed. B a public service breaks the private requirement; C VPC peering becomes heavy to route in a many-to-many setup and risks CIDR overlap; D moves off the scenario.

</Quiz>

<Quiz
  qnum={19}
  total={65}
  question="Regarding the difference between a Security Group and a network ACL (NACL), which TWO statements are correct? (Choose TWO)"
  options={[
    'A Security Group is stateful, so after inbound traffic is allowed its response traffic is automatically allowed back',
    'A NACL is stateless, so inbound and response-outbound must each be configured with separate rules',
    'A Security Group can set an explicit Deny rule to block a specific IP',
    'A NACL can apply only to a single EC2 instance and not to a subnet',
    'A Security Group acts at the subnet level and a NACL acts at the instance level',
  ]}
  answer={[0, 1]}>

**Correct: A, B**

A **Security Group is stateful (A)**: once inbound is allowed, the response is allowed automatically with no extra rule; a **NACL is stateless (B)**: inbound and response-outbound need separate rules. C is wrong because an SG has only allow rules and no Deny (a NACL is needed for an explicit Deny); D is wrong because a NACL applies at the subnet level, not a single instance; E is wrong because the levels are reversed (an SG acts at the instance or ENI level, a NACL at the subnet level).

</Quiz>

<Quiz
  qnum={20}
  total={65}
  question="A company wants to ensure that, no matter which account or who creates an EC2 instance, its attached EBS volumes are always encrypted, and to continuously audit for any unencrypted volumes and be notified on noncompliance. Which TWO actions most directly achieve this? (Choose TWO)"
  options={[
    'Turn on EBS encryption by default in each Region so new volumes created afterward are always encrypted',
    'Use an AWS Config managed rule (such as encrypted-volumes) to continuously evaluate and notify on noncompliant volumes',
    'Ask engineers to manually open the EC2 console once a month to check whether volumes are encrypted',
    'Close the Security Group of every unencrypted volume',
    'Share the account Root key with the audit team so they can check',
  ]}
  answer={[0, 1]}>

**Correct: A, B**

**Turning on EBS encryption by default (A)** guarantees at the source that new volumes are always encrypted, and an **AWS Config managed rule for continuous evaluation (B)** (such as encrypted-volumes) detects existing unencrypted volumes and triggers a notification, so one prevents and the other continuously audits, matching the need. C a monthly manual check is not continuous detection; D closing a Security Group is unrelated to encryption and disrupts service; E sharing the Root key is a severe security risk.

</Quiz>

## Domain 2 · Design Resilient (Highly Available) Architectures (Q21-37)

<Quiz
  qnum={21}
  total={65}
  question="A company Web tier runs behind an Auto Scaling Group spread across three Availability Zones (AZ). The team notices that during peaks, scaling does happen, but new instances are added only after the CPU metric stays above the threshold for a while, so the early part of each peak is sluggish and users feel lag. The team wants scaling to track the predictable traffic curve and provision capacity ahead of time while staying cost-effective. Which approach fits best?"
  options={[
    'Fix the desired capacity at the peak maximum all day long',
    'Enable Predictive Scaling to add capacity ahead of peaks based on historical patterns, combined with dynamic scaling for unexpected bursts',
    'Set the health check grace period to 0 to replace instances faster',
    'Switch to one larger EC2 type and scale vertically',
  ]}
  answer={1}>

**Correct: B**

When traffic is predictable from history and the goal is to have capacity ready before a peak, **Predictive Scaling** uses machine learning on past patterns to raise capacity ahead of the peak, avoiding the lag of waiting for a reactive metric trigger; pairing it with dynamic (target-tracking) scaling covers unexpected bursts, balancing cost and responsiveness. A runs the maximum all day, wasting off-peak cost and losing elasticity; C a grace period of 0 lets the health check kill new instances before they finish booting; D vertical scaling of one instance is still a single point of failure and cannot scale out or in.

</Quiz>

<Quiz
  qnum={22}
  total={65}
  question="A security team wants to deploy third-party firewall virtual appliances in a VPC to inspect all ingress and egress traffic, and wants those appliances to scale out and fail over transparently, with traffic spread evenly across multiple appliances. Which load balancer fits best?"
  options={[
    'Application Load Balancer (ALB)',
    'Network Load Balancer (NLB)',
    'Gateway Load Balancer (GWLB)',
    'Classic Load Balancer (CLB)',
  ]}
  answer={2}>

**Correct: C**

**GWLB** is purpose-built to insert third-party network security appliances such as firewalls and IDS or IPS: it transparently steers traffic to a fleet of virtual appliances, handles their health checks and horizontal scaling, and uses GENEVE encapsulation to preserve the original packets, which matches the need exactly. ALB is Layer 7 for HTTP and HTTPS application traffic; NLB is a high-performance Layer 4 forwarder but does not provide the transparent appliance-insertion model; CLB is a previous-generation product and is not recommended for new designs.

</Quiz>

<Quiz
  qnum={23}
  total={65}
  question="In a microservices architecture, an order service needs to tell an inventory service to decrement stock. The team wants the two fully decoupled: while the inventory service is deploying or briefly offline, order messages must not be lost, and once it recovers it should process messages at its own pace. Which approach fits the need best?"
  options={[
    'Have the order service call the inventory service REST API synchronously and retry on failure',
    'Put an Amazon SQS queue between them so the order service writes messages and the inventory service polls and processes at its own pace',
    'Share one database table between the two services and coordinate with a flag column',
    'Merge the stock-decrement logic directly into the order service',
  ]}
  answer={1}>

**Correct: B**

An **SQS queue** is the standard way to decouple asynchronously: the order service writes a message and returns, the message is durably retained, messages survive while the inventory service is offline, and on recovery the inventory service pulls and processes at its own pace, with neither side blocking the other. A synchronous calling is tight coupling that fails when inventory is offline, and retries push load back onto the order service; C a shared database is a tight-coupling anti-pattern that constrains scaling and operations; D merging the logic means no decoupling at all, so a problem on either side drags the other down.

</Quiz>

<Quiz
  qnum={24}
  total={65}
  question="A financial trading system requires messages to be processed in strict send order with no duplicate processing of the same transaction, yet transactions for the same customer must stay ordered relative to each other while different customers can be processed in parallel for higher throughput. Which approach fits best?"
  options={[
    'Use an SQS standard queue for the highest throughput and fix ordering in the application',
    'Use an SQS FIFO queue with the customer ID as the MessageGroupId',
    'Use an SNS standard topic that pushes directly to consumers',
    'Use an SQS FIFO queue but put every message in a single message group ID',
  ]}
  answer={1}>

**Correct: B**

A **FIFO queue** guarantees strict ordering and deduplication (exactly-once processing); the key is using the **customer ID as the MessageGroupId**: messages within one group (one customer) are strictly ordered, while different groups (different customers) are processed in parallel, preserving order and raising overall throughput. A a standard queue is at-least-once with best-effort ordering and possible duplicates, and fixing it in the app is error-prone; C SNS has no queue buffer and does not guarantee strict order; D putting everything in one group ID forces all transactions to serialize fully and collapses throughput.

</Quiz>

<Quiz
  qnum={25}
  total={65}
  question="A global website is deployed in three Regions covering North America, Europe, and Asia Pacific. For compliance, the company must route all European Union user traffic to the Europe Region, while other regions are served nearby. Which Route 53 routing policy should be used?"
  options={[
    'Latency-based routing',
    'Geolocation routing',
    'Weighted routing',
    'Failover routing',
  ]}
  answer={1}>

**Correct: B**

**Geolocation routing** directs users based on the geographic location they are in (country or continent), which exactly meets a compliance or localization need such as sending all EU users to the Europe Region. Latency-based routing picks only the lowest-latency endpoint and does not guarantee EU users land in Europe (a common distractor); weighted routing splits by proportion and is unrelated to geography; failover routing is for active-passive switchover, so none of these fit.

</Quiz>

<Quiz
  qnum={26}
  total={65}
  question="A production RDS database has two problems at once: (1) heavy read-only reporting queries slow the primary, and (2) if the primary fails it must fail over automatically with minimal downtime. Which TWO measures directly solve these two problems respectively? (Choose TWO)"
  options={[
    'Create one or more Read Replicas and direct the reporting queries to the replicas',
    'Enable Multi-AZ so the standby takes over automatically when the primary fails',
    'Direct the reporting queries to the Multi-AZ standby to offload reads',
    'Take a manual snapshot every 5 minutes for fast restore',
    'Switch to a larger instance type and make no other changes',
  ]}
  answer={[0, 1]}>

**Correct: A, B**

The two problems need two different mechanisms: reads slowing the primary call for **Read Replicas (A)**, which are built for read scaling and offload the read-only reports; automatic failover of the primary calls for **Multi-AZ (B)**, which synchronously replicates to a standby in another AZ and fails over automatically. C is a common misconception, since the **Multi-AZ standby does not serve reads** in normal operation; D snapshots are backups whose restore takes time and is not automatic failover; E vertical scaling is a stopgap that neither offloads reads nor provides automatic failover.

</Quiz>

<Quiz
  qnum={27}
  total={65}
  question="A multinational SaaS needs its database to provide low-latency reads across several Regions and, if the entire primary Region fails, to promote quickly to a writable primary. Which database approach fits the need best?"
  options={[
    'A single-Region RDS Multi-AZ deployment',
    'Amazon Aurora Global Database',
    'Independent, unconnected RDS instances set up separately in each Region',
    'RDS with several Read Replicas in the same Region',
  ]}
  answer={1}>

**Correct: B**

**Aurora Global Database** writes in the primary Region and replicates with very low latency (typically under a second) to several secondary Regions for nearby low-latency reads; if the primary Region fails, a secondary Region can be promoted to a writable primary in a short time, satisfying both cross-Region low-latency reads and fast disaster recovery at once. A Multi-AZ is single-Region and cannot survive a whole-Region failure; C independent RDS instances have no automatic cross-Region replication, so data diverges; D same-Region read replicas provide neither cross-Region low latency nor cross-Region failover.

</Quiz>

<Quiz
  qnum={28}
  total={65}
  question="An internal file-collaboration system needs dozens of Linux EC2 instances spread across multiple Availability Zones (AZ) to share one file system concurrently with parallel read and write, and the capacity should grow and shrink automatically with usage, with no manual management. Which storage service fits best?"
  options={[
    'Attach a single EBS volume to many EC2 instances to share',
    'Use Amazon EFS so EC2 across multiple AZ access the same file system concurrently through mount targets',
    'Stand up an NFS server on one EC2 for the other instances to mount',
    'Give each EC2 its own EBS volume and sync them periodically',
  ]}
  answer={1}>

**Correct: B**

**Amazon EFS** is a fully managed NFS file system that natively supports many EC2 instances across multiple AZ mounting and reading and writing concurrently, and its capacity grows and shrinks automatically with no pre-provisioning, matching the cross-AZ sharing need exactly. A an ordinary EBS volume attaches to only one instance at a time (io1 or io2 Multi-Attach is limited to the same AZ and to narrow use cases), so it cannot be shared across AZ by many instances; C a self-run single NFS server is itself a single point of failure and must be operated and scaled by hand; D per-instance EBS plus syncing is neither real-time nor simple and is error-prone.

</Quiz>

<Quiz
  qnum={29}
  total={65}
  question="An enterprise disaster recovery requirement is an RTO measured in minutes and an RPO near zero, and it must survive a large-scale failure of the entire primary Region. Budget is ample, and the operations team wants a switchover that is almost unnoticeable with zero downtime for users. Which DR strategy fits the need best?"
  options={[
    'Backup and Restore (back up normally, restore when needed)',
    'Pilot Light (only the core database stays on, the rest on standby)',
    'Warm Standby (a scaled-down copy runs continuously in another Region and scales up on disaster)',
    'Multi-Site Active/Active (multiple sites serve traffic at the same time)',
  ]}
  answer={3}>

**Correct: D**

When the need is an RTO of minutes, an RPO near zero, and near-zero downtime, with ample budget, **Multi-Site Active/Active** keeps both Regions in production serving traffic at the same time and continuously in sync, so if the primary fails the other takes over almost seamlessly; it is the fastest to recover and the most expensive of the four strategies. Backup and Restore is the slowest with the longest RTO; Pilot Light must scale up before it can serve, so the RTO is longer; Warm Standby runs continuously but still needs to scale up to take the full load and cannot reach the zero-downtime tier.

</Quiz>

<Quiz
  qnum={30}
  total={65}
  question="A company wants the root domain example.com (the zone apex) to point directly to an internet-facing Network Load Balancer, following AWS best practice with no extra charge for the queries. Which DNS record should be created?"
  options={[
    'A CNAME record pointing to the NLB DNS name',
    'A Route 53 Alias record pointing to the NLB',
    'An A record that hardcodes the current NLB IP',
    'An MX record pointing to the NLB',
  ]}
  answer={1}>

**Correct: B**

A **zone apex (root domain) cannot use a CNAME** due to DNS rules, so you use a Route 53 **Alias record** pointing to an AWS resource such as an NLB, and Alias queries to AWS resources are free, which matches the requirement. A a CNAME cannot be used at the zone apex; C hardcoding an IP breaks when the NLB addresses change and is unreliable; D an MX record is for mail servers and is unrelated to domain routing.

</Quiz>

<Quiz
  qnum={31}
  total={65}
  question="A batch image-processing system feeds an SQS queue to a pool of worker instances managed by an Auto Scaling Group. The team wants the worker count to grow and shrink based on the number of messages waiting in the queue: more backlog means more instances, and the pool shrinks once it is drained. Which scaling configuration fits best?"
  options={[
    'Target-tracking scaling on the average CPU utilization of the workers',
    'Target-tracking scaling on a custom metric such as backlog per instance (the average number of waiting messages per worker)',
    'A fixed schedule that launches a fixed count at the same time each day',
    'Fix the desired capacity at the maximum so it can always keep up',
  ]}
  answer={1}>

**Correct: B**

For a queue-driven workload, the real measure of load is the **message backlog**, not CPU; using **backlog per instance as a custom metric for target tracking** lets the ASG add and remove workers precisely in step with queue depth, scaling out as backlog rises and in as it clears. A CPU does not reflect queue backlog (an I/O-bound worker can show low CPU while the backlog is severe); C a fixed schedule cannot handle irregular backlog; D running the maximum forever wastes off-peak cost and loses elasticity.

</Quiz>

<Quiz
  qnum={32}
  total={65}
  question="A team wants to broadcast a real-time order event to multiple downstreams in a one-to-many fashion: it must land in a data warehouse for analytics and also trigger a notification service to send email, and new subscribers may be added later. The requirement is that adding a subscriber must not require changing the publisher code, and subscribers must be independent of one another. Which architecture fits best?"
  options={[
    'Have the order service call each downstream service directly in code one by one',
    'Create an Amazon SNS topic, have the order service publish only to the topic, and have each downstream subscribe (fan-out)',
    'Write all events to one shared SQS queue and let all downstreams compete to consume',
    'Write events to a database and have each downstream poll the table periodically',
  ]}
  answer={1}>

**Correct: B**

**SNS fan-out** is the standard solution for one-to-many broadcast with loose coupling and the ability to add subscribers anytime: the publisher only publishes to the topic, adding or removing subscribers requires no change to the publisher code, and each subscriber receives independently without affecting the others. A calling each downstream directly is tight coupling, so adding one downstream means changing the publisher and any failed downstream affects the main flow; C a single SQS queue is competing consumption (each message is taken by only one consumer), which is not a broadcast and cannot give every downstream its own copy; D polling a database is not real-time, adds load, and scales poorly.

</Quiz>

<Quiz
  qnum={33}
  total={65}
  question="A company production environment in ap-northeast-1 is a single-AZ three-tier architecture, and an audit flags an Availability Zone single point of failure. The team wants to achieve high availability that survives a single-AZ failure with the least change and as little application rework as possible. Which approach fits best?"
  options={[
    'Copy the whole environment to a second Region for cross-Region active-active',
    'Extend the ALB and Auto Scaling Group to span at least two AZ and enable Multi-AZ for RDS',
    'Enable a daily EBS snapshot backup for all EC2',
    'Upgrade all instances to a larger, more powerful type',
  ]}
  answer={1}>

**Correct: B**

The standard and least-disruptive way to survive a single-AZ failure is to spread the compute tier (ALB plus ASG) across **at least two AZ** and enable **Multi-AZ for RDS** in the data tier, so if one AZ fails entirely the other keeps serving. A cross-Region active-active is DR-level protection against a whole-Region failure, far beyond this need in cost and complexity; C snapshots are only backups and do not keep the service continuously available; D vertical scaling of one instance is still a single point of failure.

</Quiz>

<Quiz
  qnum={34}
  total={65}
  question="A company runs an internet-facing HTTPS microservices platform and needs to route requests to different backend target groups based on the URL path (for example, /api to the API service and /img to the image service), with host-based routing also supported. Which load balancer fits best?"
  options={[
    'Application Load Balancer (ALB)',
    'Network Load Balancer (NLB)',
    'Gateway Load Balancer (GWLB)',
    'Classic Load Balancer (CLB)',
  ]}
  answer={0}>

**Correct: A**

Layer 7 content routing by URL path (path-based) or host name (host-based) is the core strength of the **ALB**: it understands HTTP and HTTPS and can route requests to different target groups by path, host, headers, and more, which suits microservices best. NLB is Layer 4 and looks only at IP and port, so it does not parse HTTP paths; GWLB is for inserting third-party security appliances; CLB is previous-generation with limited features and is not recommended for new designs.

</Quiz>

<Quiz
  qnum={35}
  total={65}
  question="A queue occasionally contains messages that fail no matter how many times they are retried, so consumers get stuck retrying them and overall throughput suffers. The team wants to isolate these repeatedly failing messages automatically for later analysis while not affecting the processing of normal messages. Which approach fits best?"
  options={[
    'Simply delete every message that fails to process',
    'Configure a dead-letter queue (DLQ) with a maxReceiveCount so a message moves to the DLQ automatically once exceeded',
    'Raise the queue visibility timeout to its maximum',
    'Add more consumers to overpower the failing messages',
  ]}
  answer={1}>

**Correct: B**

A **dead-letter queue (DLQ)** with a maxReceiveCount automatically moves a message to the DLQ once it has been received and failed more than the set number of times, so the main queue is no longer blocked by it and normal messages keep flowing, while the isolated poison message can be analyzed later. A deleting outright loses the clues and cannot trace the root cause; C a higher visibility timeout only delays the retry and does not fix repeated failure; D more consumers just get more of them stuck on the same poison message, a stopgap that fixes nothing.

</Quiz>

<Quiz
  qnum={36}
  total={65}
  question="A healthcare system disaster recovery requires an RTO of minutes and an RPO of minutes and must survive a full failure of the primary Region, but the company does not want to pay for a fully symmetric active-active footprint. Which DR strategy fits this trade-off best?"
  options={[
    'Backup and Restore (back up normally, restore when needed)',
    'Pilot Light (only the core database stays in sync, compute on standby)',
    'Warm Standby (a scaled-down copy runs continuously in another Region and scales up quickly on disaster)',
    'Multi-Site Active/Active (two fully symmetric Regions serving at the same time)',
  ]}
  answer={2}>

**Correct: C**

The need is a short RTO and RPO without paying for a fully symmetric active-active footprint, which is exactly where **Warm Standby** fits: a scaled-down but always-serviceable environment runs continuously in another Region with data kept in sync (short RPO), and on disaster it only needs to scale up to take over (short RTO), at a cost below Multi-Site. Backup and Restore and Pilot Light must restore or scale up first, so their RTO is longer; Multi-Site is fastest but most expensive and exceeds this trade-off of not wanting a fully symmetric footprint.

</Quiz>

<Quiz
  qnum={37}
  total={65}
  question="A company is releasing a new API version with two needs: (1) send 5 percent of production traffic to the new version and the rest to the old version for canary validation, then raise the share gradually once stable; and (2) automatically route each user to the lowest-latency endpoint based on the measured network latency from the user to each Region, for the best performance. Which TWO Route 53 routing policies fit these needs respectively? (Choose TWO)"
  options={[
    'Weighted routing: split 5 percent and 95 percent of traffic between the new and old versions by weight',
    'Latency-based routing: route users to the lowest-latency Region based on measured latency',
    'Geolocation routing: split by the country the user is in',
    'Failover routing: automatic active-passive switchover',
    'Simple routing: just return a fixed record',
  ]}
  answer={[0, 1]}>

**Correct: A, B**

Each need maps to one policy: a canary that splits by proportion and can raise the weight gradually uses **Weighted routing (A)**; routing to the lowest-latency endpoint based on measured network latency for the best performance uses **Latency-based routing (B)**. Geolocation routing is by country, not latency (not the same as lowest latency, a common distractor); failover routing is active-passive failover, not proportional splitting or latency selection; simple routing makes no intelligent decision, so none of these are the best fit for the two needs.

</Quiz>

## Domain 3 · Design High-Performing Architectures (Q38-52)

<Quiz
  qnum={38}
  total={65}
  question="The home page of a news site calls a backend API to fetch the latest headlines. Each call runs for only about 200 milliseconds, and traffic swings with how hot the news is: sometimes thousands of calls a second, sometimes nobody for a long stretch. The team does not want to manage any servers and wants the most cost-effective way to serve this API. Which compute option fits best?"
  options={[
    'Run a fixed-size pool of EC2 behind an Application Load Balancer on standby',
    'Use AWS Lambda with API Gateway, triggered by requests and scaling automatically',
    'Build one large EC2 and adjust its capacity by hand',
    'Buy a 3-year Reserved Instance to run this API continuously',
  ]}
  answer={1}>

**Correct: B**

Very short tasks (200 milliseconds), event-driven, swinging traffic, nothing running when idle, plus no servers and lowest cost, is exactly the **Lambda (with API Gateway)** scenario: it pays only for actual execution and scales to zero. A a fixed pool of EC2 still pays for idle off-peak and needs operating; C a self-built large host scaled by hand has the highest operational overhead and cannot track sudden spikes; D a Reserved Instance is a commitment to steady long-term usage and mostly sits idle for this intermittent traffic.

</Quiz>

<Quiz
  qnum={39}
  total={65}
  question="A data analytics team has containerized a batch job that runs once a day at a set time for about 30 minutes and then stops. The team wants to avoid managing the underlying EC2 nodes, patching, and scaling entirely, and wants to run these containers with the least operational overhead. Which approach fits best?"
  options={[
    'Build an EC2 cluster and install Docker and a scheduler by hand',
    'Use ECS with the AWS Fargate launch type to run the task on a schedule',
    'Rewrite the container as a Lambda function that runs for 30 minutes per invocation',
    'Bake the container into an AMI and run one always-on EC2',
  ]}
  answer={1}>

**Correct: B**

"Already containerized + short scheduled daily run + no managing underlying nodes + least operational overhead" maps directly to **ECS with Fargate**, where AWS manages the underlying compute, patching, and scaling, and the task is released when it finishes so there is no idle cost. A a self-built cluster means operating nodes and a scheduler, the highest overhead; C Lambda caps at 15 minutes per invocation and cannot run a 30-minute task; D an always-on EC2 pays for idle the rest of the day and still needs operating.

</Quiz>

<Quiz
  qnum={40}
  total={65}
  question="A high-frequency trading application needs a fast temporary scratch space for intermediate data during computation, requiring the highest local IOPS and the lowest latency. The data does not need to survive after the instance stops. Which storage best meets the performance need?"
  options={[
    'EBS gp3 general purpose SSD',
    'EBS st1 throughput optimized HDD',
    'Instance Store',
    'Amazon EFS standard mode',
  ]}
  answer={2}>

**Correct: C**

"Temporary + no durability needed + highest local IOPS + lowest latency" is exactly the role of **Instance Store**, which is local NVMe physically attached to the host and delivers very high IOPS and the lowest latency, with the caveat that it is lost on stop, which this need does not care about. A gp3 is network-attached block storage with higher latency than a local disk; B st1 is HDD built for throughput, not IOPS; D EFS is a shared network file system with the highest latency and is not a highest-IOPS scratch option.

</Quiz>

<Quiz
  qnum={41}
  total={65}
  question="A data warehouse load job needs a large-capacity volume that reads and writes large amounts of data sequentially and targets high throughput (MB per second) rather than high IOPS, and the team wants to achieve this in the most cost-effective way. Which EBS type fits best?"
  options={[
    'EBS gp3 general purpose SSD',
    'EBS io2 Block Express',
    'EBS st1 throughput optimized HDD',
    'EBS sc1 cold HDD',
  ]}
  answer={2}>

**Correct: C**

"Large capacity + sequential access + high throughput rather than IOPS + cost-effective" is the design purpose of **st1 throughput optimized HDD**, commonly used for data warehouses, large ETL, and log processing with sequential high-volume workloads. A gp3 is SSD suited to general transactional work but costs more per GB; B io2 Block Express is a premium SSD for very high IOPS and low latency, the most expensive and the wrong direction; D sc1 is cheaper but has even lower throughput and suits rarely accessed cold data, not a load job needing steady high throughput.

</Quiz>

<Quiz
  qnum={42}
  total={65}
  question="An architecture firm stores large CAD project files in the cloud, and a group of Windows workstations needs to access the same shared files over the SMB protocol at the same time and integrate with the existing Active Directory for permission control. Which service fits best?"
  options={[
    'Amazon EFS',
    'Amazon FSx for Lustre',
    'Amazon FSx for Windows File Server',
    'Attach a separate EBS volume to each workstation',
  ]}
  answer={2}>

**Correct: C**

"Windows + SMB + Active Directory integration + multi-machine sharing" maps directly to **FSx for Windows File Server**, a native Windows file server that supports SMB and AD integration. A EFS uses NFS and is for Linux; B FSx for Lustre is an HPC high-throughput scratch file system, not Windows SMB sharing; D a separate EBS volume attaches to a single instance and is not shared, so it cannot let multiple machines share the same files.

</Quiz>

<Quiz
  qnum={43}
  total={65}
  question="An advertising platform needs a database that queries by user ID as the key, supports hundreds of thousands of requests per second, keeps latency steady in the single-digit milliseconds, and faces sudden traffic spikes, without pre-planning capacity or managing servers. Which fits best?"
  options={[
    'Amazon RDS for PostgreSQL single instance',
    'Amazon DynamoDB with on-demand capacity mode',
    'A self-managed MongoDB cluster on EC2',
    'Amazon Redshift',
  ]}
  answer={1}>

**Correct: B**

"Key-value query + hundreds of thousands per second + single-digit milliseconds + sudden spikes + no capacity planning and no servers" is the classic **DynamoDB (on-demand capacity)** scenario, scaling automatically with traffic and needing no pre-configuration. A an RDS single instance has a scaling ceiling and struggles to absorb sudden spikes; C a self-built EC2 cluster means operating scaling, sharding, and maintenance yourself; D Redshift is a data warehouse for analytical queries, not online high-concurrency key-value lookups.

</Quiz>

<Quiz
  qnum={44}
  total={65}
  question="A finance system needs a relational database that is PostgreSQL compatible but has throughput and performance far above standard RDS, with storage that auto-scales and high durability across multiple Availability Zones. Which fits best?"
  options={[
    'Amazon Aurora (PostgreSQL compatible)',
    'Amazon DynamoDB',
    'Amazon ElastiCache for Redis',
    'A self-managed PostgreSQL on EC2',
  ]}
  answer={0}>

**Correct: A**

"PostgreSQL compatible + performance and throughput far above RDS + auto-scaling storage + high durability across Availability Zones" is the role of **Aurora (PostgreSQL compatible)**, whose storage layer replicates automatically across multiple Availability Zones and grows capacity automatically. B DynamoDB is NoSQL and not PostgreSQL compatible; C ElastiCache is an in-memory cache, not a primary database; D a self-built EC2 database means operating scaling and maintenance yourself and struggles to match the performance of Aurora.

</Quiz>

<Quiz
  qnum={45}
  total={65}
  question="The write volume on an e-commerce RDS primary database is fine, but read queries on the product catalog spike during a promotion and max out the CPU of the primary. The team wants to offload read pressure and improve read performance with the least application change. Which approach fits best?"
  options={[
    'Vertically upgrade the RDS primary instance to the largest type',
    'Create one or more RDS Read Replicas and direct read queries to the replicas',
    'Change RDS to a Multi-AZ deployment',
    'Enable automated backups and snapshots for RDS',
  ]}
  answer={1}>

**Correct: B**

Heavy read pressure that needs offloading with minimal code change points squarely to **Read Replicas**: the application just points read queries at the replica endpoint while writes still go to the primary. A a vertical upgrade has a ceiling, is expensive, and only treats the symptom; C Multi-AZ is a high-availability mechanism whose standby does not serve reads and does not offload load; D backups and snapshots are data protection, unrelated to read performance.

</Quiz>

<Quiz
  qnum={46}
  total={65}
  question="A social app reads heavily from DynamoDB, and investigation shows the same set of popular posts is queried millions of times. The team wants to cut the latency of these repeated reads from single-digit milliseconds down to the microsecond level with as little change to the existing code as possible. Which approach fits best?"
  options={[
    'Build an ElastiCache for Memcached layer in front of DynamoDB and maintain the cache logic yourself',
    'Enable DynamoDB Accelerator (DAX) as a native cache layer',
    'Greatly raise the provisioned read capacity units on DynamoDB',
    'Move the popular posts to RDS to speed up reads',
  ]}
  answer={1}>

**Correct: B**

"Built for DynamoDB, microsecond level, almost no code change" is exactly the role of **DAX**, a DynamoDB-native in-memory cache layer with a nearly compatible API, so repeated reads hit the cache and latency drops to microseconds. A a generic ElastiCache means writing cache invalidation and consistency logic yourself, which is more work; C raising read capacity boosts throughput but latency stays in the millisecond range; D moving data to RDS strays from the need and does not go faster.

</Quiz>

<Quiz
  qnum={47}
  total={65}
  question="An online game needs a real-time leaderboard that can sort players by score, support atomic counter increments, and provide persistence and replication to guard against data loss. Which in-memory data store best meets the need?"
  options={[
    'Amazon ElastiCache for Memcached',
    'Amazon ElastiCache for Redis',
    'Amazon S3',
    'A plain Amazon DynamoDB table',
  ]}
  answer={1}>

**Correct: B**

"Sorted structure (Sorted Set) + atomic counters + persistence + replication + leaderboard" is a strength of **ElastiCache for Redis**. A Memcached offers only plain key-value with no sorted structure, persistence, or replication; C S3 is object storage and unsuited to a real-time low-latency leaderboard; D DynamoDB can implement it but is not the best fit for a microsecond-level in-memory sorted structure.

</Quiz>

<Quiz
  qnum={48}
  total={65}
  question="A streaming media company stores many videos and images in S3, viewers worldwide repeatedly watch popular content, and users far from the origin Region complain about slow loading. The team wants to serve cacheable HTTP content from the location nearest each user to cut latency and reduce origin traffic. Which service fits best?"
  options={[
    'AWS Global Accelerator',
    'Amazon CloudFront',
    'Elastic Load Balancing',
    'AWS Direct Connect',
  ]}
  answer={1}>

**Correct: B**

"Cacheable HTTP content + served from nearby worldwide + lower latency + less origin traffic" is the core job of **CloudFront (CDN)**: popular content is cached at edge locations so repeated views serve from cache. A Global Accelerator speeds up the connection path and does not cache content, better suited to non-HTTP TCP and UDP; C ELB is in-Region load balancing and does no global content caching; D Direct Connect is a private line from a data center to AWS, unrelated to delivering content to worldwide viewers.

</Quiz>

<Quiz
  qnum={49}
  total={65}
  question="An online multiplayer game uses a custom TCP and UDP protocol and needs players worldwide to connect to the nearest entry point over the AWS backbone with the lowest latency, plus fixed static IPs to allow-list in corporate firewalls. The content itself does not need caching. Which service fits best?"
  options={[
    'Amazon CloudFront',
    'AWS Global Accelerator',
    'An Amazon Route 53 latency routing policy',
    'Application Load Balancer',
  ]}
  answer={1}>

**Correct: B**

"Non-HTTP (TCP and UDP) + lowest-latency global path over the AWS backbone + fixed anycast static IPs + no caching" maps directly to **Global Accelerator**. A CloudFront leans toward HTTP content caching and does not suit a custom protocol for real-time connections; C Route 53 only does DNS resolution, does not accelerate connections over the backbone, and provides no static IP; D an ALB is a layer 7 HTTP load balancer that does not handle UDP and provides no fixed static IP.

</Quiz>

<Quiz
  qnum={50}
  total={65}
  question="An IoT platform processes real-time telemetry and needs several different downstream systems (a live dashboard, anomaly detection, and long-term archiving) to each read the same data stream independently, and it must be able to replay past data within the retention period after an incident. Which service fits best?"
  options={[
    'Amazon SQS standard queue',
    'Amazon Kinesis Data Streams',
    'Amazon SNS standard topic',
    'Amazon MQ',
  ]}
  answer={1}>

**Correct: B**

"Multiple consumers each reading the same data independently + replay within the retention period + real-time streaming" is the core capability of **Kinesis Data Streams**, where data within the retention period can be read and replayed by multiple applications. A an SQS message is deleted once one consumer processes it and cannot be replayed to many parties; C SNS is push-based, dropping messages after delivery with no replay; D Amazon MQ is a traditional message broker, not a high-throughput stream replay scenario.

</Quiz>

<Quiz
  qnum={51}
  total={65}
  question="A company wants to automatically load continuously streaming application logs into Amazon S3 and Amazon Redshift for later analysis in a way that is near real time, fully managed, and free of writing consumer code or operating infrastructure. Which service fits best?"
  options={[
    'Amazon Kinesis Data Streams, writing your own consumer code to the destinations',
    'Amazon Data Firehose (Kinesis Data Firehose)',
    'Amazon SQS with a self-developed Lambda integration',
    'A self-built ETL scheduler on EC2',
  ]}
  answer={1}>

**Correct: B**

"Stream auto-loaded into S3 and Redshift + near real time + fully managed with no code and no infrastructure to operate" is exactly the role of **Data Firehose**, which automatically buffers, batches, transforms, and delivers to destinations. A Data Streams requires you to write and operate consumer code; C SQS with Lambda requires developing the integration logic yourself with higher operational overhead; D a self-built ETL scheduler on EC2 has the highest operational overhead and is hardest to keep near real time.

</Quiz>

<Quiz
  qnum={52}
  total={65}
  question="A multinational team often uploads multi-GB large datasets from Asia and Europe to an S3 bucket located in the United States, and uploads are currently slow and often fail partway. Which TWO actions together best improve both the performance and the reliability of the uploads? (Choose TWO)"
  options={[
    'Enable S3 Transfer Acceleration to speed cross-border uploads through a nearby edge location',
    'Use Multipart Upload for large files to send parts in parallel and retry failed parts',
    'Change all objects to the S3 Glacier Deep Archive storage class',
    'Funnel all uploads into one single identical prefix to simplify paths',
    'Disable versioning on the bucket to speed up writes',
  ]}
  answer={[0, 1]}>

**Correct: A, B**

Slow, interruption-prone cross-border uploads of large files call for two matching fixes: **Transfer Acceleration (A)** lets data enter a nearby edge location first and then travel the AWS backbone to the destination bucket, speeding cross-border transfer; **Multipart Upload (B)** splits a large file into parts sent in parallel, so a failed part needs only that part re-sent, greatly improving reliability and throughput. C Glacier Deep Archive is an archival storage class unrelated to upload speed; D funneling into one prefix limits parallelism and hurts performance; E versioning is unrelated to upload speed and disabling it does not speed anything up.

</Quiz>

## Domain 4 · Design Cost-Optimized Architectures (Q53-65)

<Quiz
  qnum={53}
  total={65}
  question="A gaming company runs a large marketing campaign in the launch month of a new game. One part is a steady increase lasting about one month, clearly higher than usual and unable to be interrupted; the other part is interruption-tolerant, discard-after-run asynchronous image compression. The team wants the most cost-effective billing for each of these two loads. Which TWO actions fit best? (Choose TWO)"
  options={[
    'Buy a 1-year Compute Savings Plans that commits an hourly compute spend for the steady added capacity',
    'Move the interruption-tolerant image compression to Spot Instances',
    'Buy 3-year Standard Reserved Instances for both loads',
    'Keep both loads On-Demand and disable all discounts',
    'Move both loads to Dedicated Hosts',
  ]}
  answer={[0, 1]}>

**Correct: A, B**

The two loads map separately: the steady, predictable, roughly one-month, non-interruptible added capacity points to **Compute Savings Plans (A)**, where an hourly compute spend commitment earns a discount and applies flexibly across instance types, and can still be absorbed by other steady workloads after the campaign; the interruption-tolerant, discard-after-run image compression points to **Spot (B)**, saving up to about 90 percent. C tying one month of short-term capacity to a 3-year Reserved commitment is a poor fit and should not bind an interruptible batch; D keeping On-Demand leaves the discount on the table and is least cost-effective; E Dedicated Hosts are the most expensive and meant for compliance or BYOL only.

</Quiz>

<Quiz
  qnum={54}
  total={65}
  question="A data analytics team runs a large Apache Spark cluster on EC2 for batch analysis. The work splits into many small tasks, supports checkpointing, and a node that gets reclaimed can resume elsewhere automatically, while the whole batch can finish later. The team wants the lowest possible compute cost for this cluster. Which approach fits best?"
  options={[
    'Run the whole cluster on On-Demand instances',
    'Run the whole cluster on Spot Instances with capacity diversification',
    'Buy 1-year Reserved Instances for the whole cluster',
    'Run the whole cluster on Dedicated Hosts',
  ]}
  answer={1}>

**Correct: B**

"Splittable + checkpointing + a reclaimed node can resume + the batch can finish later" is the best **Spot** scenario, saving up to about 90 percent; diversifying across several instance types lowers the risk of a large simultaneous reclaim. A On-Demand has no discount and is the most wasteful for interruptible batch; C Reserved Instances are a long-term commitment to steady always-on usage and do not suit a run-then-stop batch; D Dedicated Hosts are the most expensive and unrelated to this need.

</Quiz>

<Quiz
  qnum={55}
  total={65}
  question="A team stores a large volume of hot data in S3 Standard that is accessed every day with a very steady access pattern. The team wants to lower the storage cost of this daily-use data but requires millisecond retrieval at any time and does not want to risk unpredictable retrieval fees. Which approach fits best?"
  options={[
    'Transition to S3 Standard-IA',
    'Transition to S3 Glacier Instant Retrieval',
    'Keep the data in S3 Standard',
    'Transition to S3 One Zone-IA',
  ]}
  answer={2}>

**Correct: C**

The key is "accessed every day with a steady pattern": both Standard-IA and One Zone-IA are built for infrequent access, so daily reads incur a retrieval fee on every access that often totals more than Standard, and they carry a minimum storage duration. Glacier Instant Retrieval allows millisecond retrieval but also assumes occasional access, so frequent reads get eaten by retrieval fees too. For high-frequency hot data, **keeping S3 Standard (C)** is actually the cheapest and carries no unpredictable retrieval fee. One Zone-IA also stores in a single Availability Zone (AZ) and does not suit critical hot data.

</Quiz>

<Quiz
  qnum={56}
  total={65}
  question="A medical imaging platform generates many intermediate image files that can be regenerated from the raw data at any time. The files are accessed infrequently but must be quickly available, and the team can accept single-Availability-Zone (AZ) durability in exchange for lower cost. Which S3 storage class is the most cost-effective?"
  options={[
    'S3 Standard',
    'S3 Standard-IA',
    'S3 One Zone-IA',
    'S3 Glacier Deep Archive',
  ]}
  answer={2}>

**Correct: C**

The three key requirements are "regenerable (loss tolerant) + infrequent access but quick retrieval + single AZ acceptable", which maps to **S3 One Zone-IA**: it stores in a single AZ, so storage is cheaper than Standard-IA across three AZs, while still allowing instant retrieval. A Standard is too expensive for infrequent access; B Standard-IA spans three AZs for more durability but costs more per GB, and this data is recreatable so it does not need that durability; D Deep Archive takes hours to retrieve and fails the quick-retrieval requirement.

</Quiz>

<Quiz
  qnum={57}
  total={65}
  question="A team has archive data that is almost never touched, but regulation requires that when auditors request it, it must be retrievable instantly within milliseconds. The data volume is large and must be kept at the lowest storage cost. Which S3 storage class fits best?"
  options={[
    'S3 Glacier Deep Archive',
    'S3 Glacier Flexible Retrieval',
    'S3 Glacier Instant Retrieval',
    'S3 Standard-IA',
  ]}
  answer={2}>

**Correct: C**

"Rarely accessed, but must retrieve instantly in milliseconds when needed, and keep it cheap" is exactly **Glacier Instant Retrieval**: its per-GB storage is far lower than Standard-IA while allowing instant reads like a normal object. A Deep Archive is the cheapest but takes hours to retrieve, failing the millisecond requirement; B Flexible Retrieval usually takes minutes to hours, not milliseconds; D Standard-IA allows instant access but its per-GB storage is clearly higher than Glacier Instant Retrieval and is not cheap enough for data that is almost never touched.

</Quiz>

<Quiz
  qnum={58}
  total={65}
  question="A global application serves a static site and API responses from a single Region to users worldwide. Repeated access to the same content drives high outbound transfer cost, and remote users also see high latency. The team wants to lower outbound transfer cost and improve latency at the same time, with the least operational overhead. Which approach fits best?"
  options={[
    'Deploy the backend into every Region worldwide',
    'Put Amazon CloudFront in front to serve from edge caches and reduce origin traffic',
    'Move all content to S3 One Zone-IA to save cost',
    'Build a Direct Connect link for each country',
  ]}
  answer={1}>

**Correct: B**

"Repeated access to the same content + lower outbound transfer cost + improve global latency + low operational overhead" is exactly **CloudFront (CDN)**: popular content is cached at edge locations and served nearby, latency drops, and repeated requests no longer hit the origin; CloudFront egress rates are usually cheaper, with no transfer fee to fetch from an AWS origin. A deploying to every Region raises both operations and cost sharply; C One Zone-IA only saves storage cost and is unrelated to transfer or latency; D Direct Connect is a data-center interconnect, not a content delivery method for ordinary internet users.

</Quiz>

<Quiz
  qnum={59}
  total={65}
  question="A company manages many team accounts under AWS Organizations. Finance wants to split and attribute every cost by dimensions such as project, team, and environment (production or test) so each project can own its budget. The team wants this granular cost attribution with the least operational overhead. Which approach fits best?"
  options={[
    'Open a separate AWS account per project just to tell the costs apart',
    'Enable Cost Allocation Tags, tag resources consistently, and break down by tag in Cost Explorer',
    'Ask each team to record costs by hand in a spreadsheet each month',
    'Use AWS CloudTrail to estimate each project cost from API call counts',
  ]}
  answer={1}>

**Correct: B**

"Split and attribute cost by project, team, and environment" is best done, with the least operational overhead, by tagging resources consistently and enabling **Cost Allocation Tags** in the billing console, after which Cost Explorer and the CUR can break spend down by tag and attribute it to each project. A splitting into many accounts just to separate costs raises governance and operational overhead and is unnecessary; C a manual spreadsheet is laborious and error-prone; D CloudTrail records API activity and cannot reflect the actual dollar amounts.

</Quiz>

<Quiz
  qnum={60}
  total={65}
  question="A team wants to be notified by email when monthly forecasted or actual spend is about to exceed a certain dollar amount, so it can hit the brakes early rather than discovering an overrun at month end. The team wants this fixed-threshold alert with the least setup. Which service fits best?"
  options={[
    'AWS Cost Explorer',
    'AWS Budgets with a cost budget and alert threshold',
    'AWS Cost Anomaly Detection',
    'AWS Cost and Usage Report (CUR)',
  ]}
  answer={1}>

**Correct: B**

"Notify proactively when actual or forecasted spend nears or crosses a fixed dollar threshold" is the core job of **AWS Budgets**, which sets cost or usage budgets with attached alerts. A Cost Explorer is a tool for visual trend analysis and is not a threshold alerter itself; C Cost Anomaly Detection uses machine learning to detect abnormal patterns rather than a fixed amount you set; D the CUR is the most detailed line-by-line billing data for deep analysis and does not alert proactively.

</Quiz>

<Quiz
  qnum={61}
  total={65}
  question="A startup has very irregular web traffic: mostly quiet, but occasionally a social-media surge brings a sudden flood of requests. Its backend relational database currently uses a fixed-size RDS On-Demand left running all the time, which sits badly idle off-peak yet still pays for the whole instance. The team wants the most cost-effective database and does not want to estimate capacity. Which approach fits best?"
  options={[
    'Scale the RDS instance size up to handle the peaks',
    'Move to Amazon Aurora Serverless v2 so it scales automatically with real load',
    'Buy a 3-year Reserved Instance for this RDS',
    'Add several fixed-size read replicas to spread the load',
  ]}
  answer={1}>

**Correct: B**

"Irregular load, mostly quiet, occasional surges, badly idle off-peak, no capacity guessing" is the scenario for **Aurora Serverless v2**: it scales up and down with real usage, shrinks to very small off-peak so idle costs almost nothing, and scales out quickly during a surge. A scaling the size up only pays more for idle off-peak; C a 3-year Reserved Instance is a commitment to steady long-term usage and mostly sits idle for an intermittent load; D fixed-size read replicas just pay for more whole instances and do not solve the off-peak idle or peak surge problem.

</Quiz>

<Quiz
  qnum={62}
  total={65}
  question="A mobile app backend uses DynamoDB with traffic that is very hard to predict: almost no usage right after launch, with occasional sudden surges from push campaigns. The team does not want to plan read and write capacity in advance or pay for unused capacity off-peak, and wants to start with the least operational overhead and reasonable cost. Which capacity mode fits best?"
  options={[
    'Provisioned capacity with a manually set very high read and write ceiling',
    'On-Demand capacity mode',
    'Provisioned capacity without auto scaling enabled',
    'A self-managed database on EC2 to control capacity by hand',
  ]}
  answer={1}>

**Correct: B**

"Very unpredictable traffic, almost none early on, occasional surges, no capacity planning, low operational overhead" is the scenario for DynamoDB **On-Demand capacity mode**: it scales instantly with actual read and write volume, pays only for what is used, needs no capacity planning, and handles surges without throttling. A a very high provisioned ceiling pays for idle capacity long term; C provisioned without auto scaling tends to throttle on surges and wastes capacity off-peak; D a self-managed database with manual capacity has the highest operational overhead and is the opposite of the need.

</Quiz>

<Quiz
  qnum={63}
  total={65}
  question="Several EC2 instances in a company private subnet need to call a few third-party APIs and download system updates. The traffic is small, occasional, and predictable. A highly available NAT Gateway was set up for this, but the fixed hourly fee each month looks high for such small traffic. The team wants to lower this cost while keeping outbound connectivity. Which approach is the most cost-effective?"
  options={[
    'Keep multiple NAT Gateways for the highest availability',
    'Switch to a NAT Instance, using one small EC2 to carry the small occasional outbound traffic',
    'Assign a public IP to each EC2 to reach the internet directly',
    'Route all outbound traffic through a Direct Connect link',
  ]}
  answer={1}>

**Correct: B**

When outbound traffic is small, occasional, and predictable, the NAT Gateway fixed hourly fee plus per-GB processing fee looks expensive; switching to a **NAT Instance (one small EC2)** can cut the fixed cost sharply and is the frugal choice for this low-traffic case (the trade-off is self-management and lower availability and throughput). A keeping multiple NAT Gateways only raises the fixed fee; C assigning public IPs exposes private hosts to the internet, sacrificing security and still paying egress; D Direct Connect is a data-center interconnect with high upfront cost and does not fit calling third-party APIs.

</Quiz>

<Quiz
  qnum={64}
  total={65}
  question="After reviewing the bill, a company wants a full cost health check: on one hand to find idle or low-utilization resources such as load balancers with almost no traffic and EBS volumes long unattached, and on the other hand to get quantified right-sizing guidance on how much it would save to resize a group of clearly oversized EC2 instances to the correct size. Which TWO tools together fit best? (Choose TWO)"
  options={[
    'Use AWS Trusted Advisor to find cost-optimization recommendations for idle and low-utilization resources',
    'Use AWS Compute Optimizer for quantified right-sizing recommendations for EC2',
    'Use AWS CloudTrail to inventory which resources are under-utilized',
    'Use AWS Budgets to automatically shut down idle resources',
    'Use AWS Cost Anomaly Detection to list which EC2 to downsize',
  ]}
  answer={[0, 1]}>

**Correct: A, B**

Finding idle and low-utilization resources points to **Trusted Advisor (A)**, whose cost-optimization checks do exactly this (idle load balancers, unattached EBS, low-utilization RDS, and more); getting quantified EC2 right-sizing points to **Compute Optimizer (B)**, which uses machine learning to analyze real usage, recommend the right size, and estimate the savings. C CloudTrail records API activity and does no utilization analysis; D Budgets only sets threshold alerts and cannot shut resources down; E Cost Anomaly Detection detects abnormal spikes and does not produce a right-sizing list.

</Quiz>

<Quiz
  qnum={65}
  total={65}
  question="An enterprise wants to re-architect for both the MOST cost-effective result and the LEAST operational overhead: a steady always-on core API, a batch of interruption-tolerant nightly data processing, an internal reporting database with intermittent traffic, and a large pile of old files untouched for three years. Which combination fits best?"
  options={[
    'Savings Plans for the core API, Spot for the nightly processing, Aurora Serverless v2 for the reporting database, and Lifecycle to Glacier Deep Archive for the old files',
    'Switch everything to On-Demand and have someone manually shut down off-peak each day',
    'Spot for the core API, 3-year Reserved Instances for the nightly processing, keep the reporting database On-Demand always on, and leave the old files in S3 Standard',
    'Move everything to a self-managed EC2 cluster the team operates and schedules by hand',
  ]}
  answer={0}>

**Correct: A**

This combined scenario maps one layer at a time: the steady always-on core API points to **Savings Plans or RI** to lock in a discount; the interruption-tolerant nightly processing points to **Spot** (up to about 90 percent off); the intermittent reporting database points to **Aurora Serverless v2** (shrinks when idle); the three-year-old files point to an **S3 Lifecycle move to Glacier Deep Archive**. All of it is configuration, not new infrastructure, so operational overhead barely rises. B manual shutdowns raise overhead and save little; C puts the core API that cannot be interrupted on Spot and ties the interruptible nightly batch to a 3-year Reserved commitment, which is completely backwards; D a self-managed cluster scheduled by hand is almost never the least-operational-overhead answer.

</Quiz>

---

🎉 Done! After checking your answers, go back to the matching domain articles and the [Glossary](/glossary) to shore up anything you missed, and skim the [Exam Cram Sheet](/saa/exam-prep/cram) once more before the exam. Keep your pace, trust your prep — good luck passing SAA-C03 on the first try!
