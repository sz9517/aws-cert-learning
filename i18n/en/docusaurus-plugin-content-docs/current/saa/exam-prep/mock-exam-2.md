---
sidebar_position: 4
title: Full Mock Exam B (65 questions)
---

# SAA-C03 Full Mock Exam B (65 questions)

This is the **second** full-length mock: the questions are entirely different from the first one, meant to add practice volume and test whether it has all come together. 65 questions across all four domains, with question style and weighting modeled on SAA-C03. Pick your answer first, then click "**Show answer & explanation**" to compare. All questions are **original**, written in the official style (scenario stems + qualifiers + some multiple-answer), and are **not real exam questions**.

:::info[Suggested exam conditions]
- **Count / time**: 65 questions, suggested limit of **130 minutes** (about 2 minutes per question).
- **Passing score**: the official bar is **720 / 1000**; for this mock, treat about 47 correct (72 percent) as your pass line.
- **Domain distribution** (mirrors the official weighting): Domain 1 Security Q1-20, Domain 2 Resilience/HA Q21-37, Domain 3 High Performance Q38-52, Domain 4 Cost Q53-65.
- **Multiple-answer questions** are marked "Choose TWO"; select exactly two, no more and no less.
- It is best to finish [the first Full Mock Exam](./mock-exam.md) before taking this one.
:::

:::tip[How to answer]
Circle the **qualifier** in the stem first (most cost-effective, least operational overhead, highly available, most secure, real-time, lowest latency...), then eliminate options. Guess and flag anything you are stuck on, and bank the points you know first. Review the keyword-to-answer reflexes in the [Exam Cram Sheet](./cram.md) if needed.
:::

## Domain 1 · Design Secure Architectures (Q1-20)

<Quiz
  qnum={1}
  total={65}
  question="A startup has only three developers, and all of them currently share one set of Root user credentials to sign in to the console for daily deployments. A security consultant asks the team to adopt identity best practices with minimal change. Which approach is most correct?"
  options={[
    'Keep sharing Root, but make the password a bit longer',
    'Create a separate IAM user for each developer, grant least-privilege permissions by job function, and lock away Root for the few account-level operations that require it',
    'Pin the Root access key in the shared team chat so everyone can find it',
    'Create a Root user with AdministratorAccess for each developer',
  ]}
  answer={1}>

**Correct: B**

Identity best practice is one IAM user per person with least-privilege permissions by job function, and reserving Root only for the few account-level tasks that genuinely need it (such as changing billing or closing the account). A sharing Root cannot be audited to an individual and grants far too much; C posting a long-term key is an active leak; D each account has exactly one Root user, so creating multiple Root users is not possible and the statement itself is wrong.

</Quiz>

<Quiz
  qnum={2}
  total={65}
  question="A CI/CD pipeline runs on ECS tasks and needs to push an image to ECR and update a Lambda function during deployment. The security team requires that no long-term keys ever appear in the task definition or the code, and that only just-enough permissions are granted. Which approach fits best?"
  options={[
    'Put an IAM user access key in the environment variables of the task definition',
    'Assign an IAM task role to the ECS task that grants only the actions to push to that ECR repository and update that Lambda function',
    'Store an access key in an S3 bucket and have the task download it at startup',
    'Attach the PowerUserAccess managed policy to the task to avoid missing permissions',
  ]}
  answer={1}>

**Correct: B**

ECS tasks should obtain temporary, auto-rotated credentials through an IAM task role, with the policy narrowed to the actions and resources needed to push to that ECR repository and update that Lambda function, which satisfies both no long-term keys and least privilege. A and C both place long-term keys where they can leak; D PowerUserAccess grants far more than needed and violates least privilege.

</Quiz>

<Quiz
  qnum={3}
  total={65}
  question="An operator is allowed to stop EC2 instances through an IAM group, but the same operator also has a policy whose condition allows the action only when the source IP is within the company office network range. When the operator tries to stop an instance from a home public network, what is the result?"
  options={[
    'The stop succeeds, because the Allow from the group always applies',
    'The stop fails, because the Allow does not apply when the condition is not met, and IAM denies by default',
    'The stop succeeds, because IAM ignores source IP conditions',
    'It depends on which of the two policies was created first',
  ]}
  answer={1}>

**Correct: B**

The Condition on an IAM policy must be satisfied for that Allow to apply. From a home public network the source IP is outside the office range, so the condition is not met and the Allow does not apply, and because IAM denies by default the stop fails. A ignores the condition; C saying IAM ignores conditions is wrong; D creation order is irrelevant, as IAM evaluation does not consider time order.

</Quiz>

<Quiz
  qnum={4}
  total={65}
  question="A team wants to rotate a customer managed key (CMK) and needs to understand what KMS automatic rotation actually does. Which statement is most correct?"
  options={[
    'After automatic rotation is enabled, KMS changes the key ID and all existing ciphertext must be re-encrypted',
    'After automatic rotation is enabled, KMS periodically generates new key material while the key ID and key ARN stay the same, and the old material is retained to decrypt existing ciphertext',
    'Automatic rotation requires you to manually distribute the new key to every client',
    'Automatic rotation works only for asymmetric keys and is not supported for symmetric keys',
  ]}
  answer={1}>

**Correct: B**

When automatic rotation is enabled for a symmetric CMK, KMS periodically generates new key material while the key ID and ARN stay unchanged, and it keeps the old material so prior ciphertext can still be decrypted, all transparent to callers with no re-encryption. A is wrong because the key ID does not change and no re-encryption is needed; C is wrong because no manual distribution is required; D is backwards, since automatic rotation applies to symmetric keys.

</Quiz>

<Quiz
  qnum={5}
  total={65}
  question="An engineer wants to block a specific set of malicious source IP addresses from reaching all instances at the subnet level, but a security group supports only allow rules and cannot explicitly deny specific IP addresses. Which approach fits best?"
  options={[
    'Add a Deny rule to the network ACL (NACL) associated with that subnet to explicitly reject that set of source IP addresses',
    'Add a Deny rule to the security group to reject that set of IP addresses',
    'Write that set of IP addresses into the hosts file of the EC2 instances',
    'Add a route on each instance that rejects that IP address',
  ]}
  answer={0}>

**Correct: A**

To explicitly deny specific source IP addresses at the network layer, use a NACL, which operates at the subnet level and supports both allow and deny rules. B is wrong because a security group has only allow rules and no concept of Deny; C the hosts file does name resolution and cannot block inbound traffic; D a route table cannot filter traffic by rejecting a specific source.

</Quiz>

<Quiz
  qnum={6}
  total={65}
  question="A team wants to centrally store a set of application configuration parameters that do not need rotation (such as feature flags and endpoint URLs), with the goals of free or low cost, hierarchical naming, and access control through IAM, and no built-in automatic rotation is needed. Which service fits best?"
  options={[
    'AWS Secrets Manager, storing them and enabling automatic rotation',
    'Standard parameters in Systems Manager Parameter Store',
    'Hard-code the parameters into the application image',
    'Create one DynamoDB table per parameter',
  ]}
  answer={1}>

**Correct: B**

When no rotation is needed and the goal is centrally stored general configuration at low cost with IAM control, standard parameters in Parameter Store fit best, because standard parameters are free, support hierarchical path naming, and can be authorized with IAM. A Secrets Manager is billed per secret and is built for automatic rotation, which is overkill for configuration that never rotates; C hard-coding is hard to change and easy to leak; D using DynamoDB for configuration adds operational overhead and cost.

</Quiz>

<Quiz
  qnum={7}
  total={65}
  question="A company wants to regularly scan EC2 instances and container images for software vulnerabilities (CVEs) and unintended open network paths, in a fully managed, automatic, and continuous way, without deploying its own scanners. Which service fits best?"
  options={[
    'Amazon Inspector',
    'AWS CloudTrail',
    'Amazon Macie',
    'AWS Config',
  ]}
  answer={0}>

**Correct: A**

Amazon Inspector is a fully managed vulnerability management service that continuously and automatically scans EC2, ECR container images, and Lambda for software vulnerabilities (CVEs) and unintended network reachability, with no self-built scanner required. B CloudTrail records API activity and does not scan for vulnerabilities; C Macie finds sensitive personal data (PII) in S3; D Config evaluates resource configuration compliance and does not perform CVE scanning.

</Quiz>

<Quiz
  qnum={8}
  total={65}
  question="A company uses AWS Organizations to manage dozens of accounts, and audit requires that all API activity across every account be recorded centrally into a single audit trail that individual account administrators cannot tamper with or turn off. Which approach fits best?"
  options={[
    'Ask each account administrator to enable a CloudTrail trail in their own account',
    'Create an Organizations-level CloudTrail organization trail in the management account to centrally record all member accounts',
    'Enable CloudTrail only in the management account and leave member accounts unrecorded',
    'Use Config instead of CloudTrail to record API calls',
  ]}
  answer={1}>

**Correct: B**

A CloudTrail organization trail created in the management account automatically applies to every member account, records organization-wide API activity centrally, and cannot be turned off or tampered with by member-account administrators, which best fits centralized audit. A per-account trails cannot be centralized and could be turned off individually; C not recording member accounts leaves blind spots; D Config records configuration changes, not a complete API call trail.

</Quiz>

<Quiz
  qnum={9}
  total={65}
  question="An EC2 application in a private subnet needs to privately call Amazon ECR to pull container images, security requires that the traffic never traverse the internet, and ECR is not S3 or DynamoDB. Which approach fits best?"
  options={[
    'Create a Gateway endpoint for ECR',
    'Create Interface endpoints (PrivateLink) for the ECR-related services, placing elastic network interfaces with private IP addresses in the subnet',
    'Set up a NAT Gateway so the traffic goes out to the internet and then pulls the images',
    'Attach an internet gateway to the subnet and assign a public IP address',
  ]}
  answer={1}>

**Correct: B**

Gateway endpoints support only S3 and DynamoDB, so services like ECR require Interface endpoints (PrivateLink), which place an elastic network interface with a private IP in the subnet so image-pull traffic stays entirely on the AWS network. A is wrong because ECR does not support a Gateway endpoint; C and D both route traffic to the internet and violate the requirement.

</Quiz>

<Quiz
  qnum={10}
  total={65}
  question="A company stores many log files for analysis in an S3 bucket, with these needs: data at rest must be encrypted, key usage must be auditable through CloudTrail to show who used the key and when, and a bucket policy must ensure only specific roles can read. Which two measures most directly meet the encryption and audit needs? (Choose TWO)"
  options={[
    'Set default encryption on the bucket using SSE-KMS with a customer managed key (CMK)',
    'Rely on KMS recording key usage through CloudTrail to audit decrypt and encrypt calls',
    'Rename the bucket to a random string so it cannot be guessed',
    'Use SSE-S3 where S3 fully manages the keys, without setting up any auditing',
    'Disable default encryption on the bucket and let uploaders decide whether to encrypt',
  ]}
  answer={[0, 1]}>

**Correct: A, B**

The requirement explicitly calls for auditable key usage, so use SSE-KMS with a customer managed key (A) rather than S3-managed SSE-S3, and KMS records every encrypt and decrypt call to that key in CloudTrail (B), which satisfies the who-used-the-key-and-when audit need. C hiding the name is not a security control; D SSE-S3 cannot provide CMK-centered key auditing; E disabling default encryption and leaving it to uploaders leaves an unencrypted gap.

</Quiz>

<Quiz
  qnum={11}
  total={65}
  question="A public API is exposed through API Gateway and has recently faced layer 7 attacks carrying malicious payloads and abnormally high-rate requests from specific sources. The company wants to filter with managed rules before requests reach the API, and to automatically block flooding sources based on a rate limit. Which approach fits best?"
  options={[
    'Apply AWS WAF on API Gateway, enable a managed rule group, and configure a rate-based rule to limit flooding sources',
    'Use a security group to filter malicious payloads by request content',
    'Use a NACL to block all inbound traffic to stop the attack',
    'Change the API domain name to something that is not public',
  ]}
  answer={0}>

**Correct: A**

AWS WAF can be applied on API Gateway to inspect HTTP request content with a managed rule group to stop layer 7 attacks, and a rate-based rule automatically blocks sources that exceed the threshold, covering both threats. B a security group only sees IP and port and cannot read the payload; C blocking all inbound also blocks legitimate users; D changing the domain is security through obscurity, not an effective control.

</Quiz>

<Quiz
  qnum={12}
  total={65}
  question="A company has a security account and an application account. Code on many instances in the application account needs temporary credentials to read a KMS key and an S3 bucket in the security account, and the company requires that no long-term keys be distributed and that access be centralized on a single auditable role. Which approach fits best?"
  options={[
    'Store an IAM user access key from the security account on every instance in the application account',
    'Create a cross-account IAM role in the security account that trusts the application account, grant least privilege to that KMS key and S3 bucket, and have the application use STS AssumeRole for temporary credentials',
    'Set the S3 bucket policy and KMS key policy in the security account to allow access by anyone',
    'Share one set of Root user credentials between the two accounts',
  ]}
  answer={1}>

**Correct: B**

The standard pattern for cross-account access is to create an IAM role in the account that holds the resources (the security account) that trusts the other account, grant least privilege to that KMS key and S3 bucket, and have the application use STS AssumeRole for time-limited temporary credentials, with no long-term keys and all access centralized on a single auditable role. A distributing long-term keys violates the requirement; C allowing anyone is a leak; D sharing Root is the most severe.

</Quiz>

<Quiz
  qnum={13}
  total={65}
  question="A company requires that every object stored in an S3 bucket must be encrypted with SSE-KMS, and that any upload request that does not specify server-side encryption be rejected, and this control must apply at the bucket level for all uploaders. Which approach fits best?"
  options={[
    'Add a bucket policy statement that explicitly denies when the s3:x-amz-server-side-encryption header of the upload request is not aws:kms',
    'Ask each uploader to remember to encrypt on the client side before uploading',
    'Make the bucket public but allow uploads only during the day',
    'Use a NACL to block unencrypted upload requests',
  ]}
  answer={0}>

**Correct: A**

A bucket policy that uses a condition to inspect the s3:x-amz-server-side-encryption header of the upload request and explicitly denies when it is not aws:kms enforces SSE-KMS on every object at the bucket level, regardless of who the uploader is. B relying on discipline cannot enforce; C a public bucket violates security and is unrelated to encryption; D a NACL operates at the subnet level and cannot inspect S3 API request content coming from anywhere.

</Quiz>

<Quiz
  qnum={14}
  total={65}
  question="A company worries about former employees or stolen passwords being abused and requires that self-service operations such as setting or deleting an MFA device and changing the user own password must first pass MFA verification, to reduce the risk of credential leakage. Which approach fits best?"
  options={[
    'Enable MFA for users and use the aws:MultiFactorAuthPresent condition in IAM policies to require MFA for sensitive self-service operations',
    'Require users to change their password every hour',
    'Change the password policy to allow only four-digit numbers so they are easy to remember',
    'Have everyone switch to using the Root account for centralized management',
  ]}
  answer={0}>

**Correct: A**

The correct answer is to enable MFA and use the aws:MultiFactorAuthPresent condition in policies to require MFA for sensitive operations, so that even if a password leaks, high-risk actions cannot proceed without the second factor. B changing the password every hour adds burden for little benefit; C four-digit passwords sharply reduce security; D everyone using Root is an extremely dangerous anti-pattern.

</Quiz>

<Quiz
  qnum={15}
  total={65}
  question="A media company wants external freelance editors to upload raw video files to a private S3 bucket for a limited time. The bucket cannot be public, and the company does not want to create an IAM user for each temporary editor. Which approach fits best?"
  options={[
    'Generate an S3 presigned URL for upload (PUT) with a short expiry and hand it to the editor',
    'Make the bucket publicly writable so anyone can upload',
    'Create a long-term IAM user and access key for each editor',
    'Grant write permission on the bucket to the 0.0.0.0/0 source',
  ]}
  answer={0}>

**Correct: A**

A presigned URL uses existing credentials to issue a time-limited upload link that expires automatically, keeps the bucket private, and avoids creating accounts for temporary people, which fits time-limited uploads. B a publicly writable bucket lets anyone drop files and is very dangerous; C creating long-term users for temporary people is excessive and hard to revoke; D granting write to the whole internet is a severe misconfiguration.

</Quiz>

<Quiz
  qnum={16}
  total={65}
  question="A platform team lets developers create IAM roles in the account for their own applications, but security requires that whatever policies a developer attaches to a role, the effective permissions of that role must never exceed a predefined ceiling. Which mechanism fits best?"
  options={[
    'Attach a permissions boundary to those roles when developers create them, to cap the maximum permissions',
    'Have the security team manually review the policies of all new roles every day',
    'Use an SCP to disable IAM across the whole account so developers cannot create anything',
    'Change all developer permissions to read-only and forbid creating any role',
  ]}
  answer={0}>

**Correct: A**

A permissions boundary sets a ceiling on a single identity, so that even if broader policies are attached, the effective permissions are only the intersection with the boundary and never exceed it, which fits delegating role creation while capping the maximum. B manual daily review is unreliable and not timely; C disabling IAM prevents developers from creating necessary roles, and an SCP is an account-level ceiling that cannot cap each individual role a developer creates; D read-only everywhere is over-restrictive and prevents getting work done.

</Quiz>

<Quiz
  qnum={17}
  total={65}
  question="A company wants to scan all S3 buckets to automatically find whether they contain sensitive personal data such as credit card numbers and national ID numbers, classify and alert on findings, in a fully managed, machine-learning-driven way, without writing its own matching rules. Which service fits best?"
  options={[
    'Amazon Macie',
    'AWS CloudTrail',
    'Amazon GuardDuty',
    'AWS Config',
  ]}
  answer={0}>

**Correct: A**

Amazon Macie is a fully managed service that uses machine learning and pattern matching to automatically discover sensitive personal data (PII) in S3 and classify and alert on it, which matches the requirement. B CloudTrail records API activity; C GuardDuty detects threat behavior such as abnormal API calls and malicious connections, not data content classification; D Config evaluates resource configuration compliance, so none of them discovers sensitive data.

</Quiz>

<Quiz
  qnum={18}
  total={65}
  question="A company serves a public website behind CloudFront and needs a public HTTPS certificate attached to the CloudFront distribution, with the requirements that it auto-renews before expiry, needs zero manual maintenance, and costs nothing extra. Regarding the Region of the certificate, which approach is most correct?"
  options={[
    'Issue the public certificate in ACM in us-east-1 (N. Virginia) and attach it to CloudFront, with ACM auto-renewing it',
    'Buy a certificate from an external CA, manually renew it every year, and upload it to CloudFront',
    'Turn off HTTPS to avoid maintaining a certificate',
    'Embed the private key in the CloudFront error page and deploy it together',
  ]}
  answer={0}>

**Correct: A**

An ACM public certificate for CloudFront must be issued in the us-east-1 (N. Virginia) Region, and once attached ACM auto-renews it with zero maintenance and no extra cost, which fully meets the requirement. B manual renewal is easy to forget and causes outages when the certificate expires; C turning off HTTPS sacrifices encryption in transit; D putting the private key anywhere obtainable is a severe security risk.

</Quiz>

<Quiz
  qnum={19}
  total={65}
  question="Regarding envelope encryption and how KMS works, which two statements are correct? (Choose TWO)"
  options={[
    'KMS has a size limit (about 4 KB) for data it encrypts directly, so large data is encrypted with a data key and that data key is then encrypted by a KMS key',
    'The key material of a customer managed key (CMK) never leaves KMS, and decrypting the data key happens inside KMS',
    'Envelope encryption downloads the master key material to the client along with the ciphertext to speed up decryption',
    'Sending an entire 1 GB file directly to KMS to encrypt with the master key in one call is best practice, with no size limit',
    'The plaintext version of the data key should be kept long-term alongside the ciphertext for easy future decryption',
  ]}
  answer={[0, 1]}>

**Correct: A, B**

Envelope encryption exists precisely because KMS has an about 4 KB size limit for direct encryption (A), so large data is encrypted with a data key and that data key is then encrypted by the KMS key, and the key material of a CMK never leaves KMS (B), with decryption of the data key done inside KMS. C is wrong because master key material is not downloaded to the client; D is wrong because KMS has a size limit and cannot directly encrypt 1 GB; E is wrong because the plaintext data key is discarded after use and must never be kept long-term alongside the ciphertext.

</Quiz>

<Quiz
  qnum={20}
  total={65}
  question="A company wants to build baseline threat detection and compliance auditing across the entire AWS Organizations, with two needs: (1) continuously and automatically detect threat behavior such as anomalous sign-ins, permission enumeration, and suspicious outbound connections across all accounts; (2) aggregate these and other security service findings into a single dashboard and score compliance against AWS security standards. Which two services fit best together? (Choose TWO)"
  options={[
    'Amazon GuardDuty: continuously detect threat behavior across accounts',
    'AWS Security Hub: aggregate findings from security services and score compliance against standards',
    'Use only a security group to block all outbound connections for safety',
    'Use Parameter Store to centrally store all security findings',
    'Turn off all logging and detection to save cost',
  ]}
  answer={[0, 1]}>

**Correct: A, B**

GuardDuty (A) continuously analyzes CloudTrail, VPC Flow Logs, and DNS logs across accounts to automatically detect threats such as anomalous sign-ins, permission enumeration, and suspicious connections, while Security Hub (B) aggregates findings from GuardDuty, Inspector, Macie, and more into a single view and scores compliance against AWS security standards, so the two together cover threat detection and centralized compliance auditing. C blocking all outbound breaks services and does no detection; D Parameter Store stores parameters and is not a findings aggregation tool; E turning off logging and detection runs counter to the requirement.

</Quiz>

## Domain 2 · Design Resilient (Highly Available) Architectures (Q21-37)

<Quiz
  qnum={21}
  total={65}
  question="A company runs equal numbers of EC2 instances across three Availability Zones (AZs) in one Region, fronted by an ALB that spreads traffic evenly. During a game day one entire AZ was taken offline, and the instances in the remaining two AZs were immediately overwhelmed and latency spiked. The company wants the remaining capacity to absorb ALL traffic when any single AZ fails, while avoiding keeping too much idle capacity long term. What is the MOST appropriate approach?"
  options={[
    'Double the capacity in each of the three AZs so there is always enough',
    'Plan N+1 capacity across AZs so each AZ reserves headroom to absorb one AZ failure, and let Auto Scaling fill the gap dynamically',
    'Consolidate all instances into the single most stable AZ for easier management',
    'Disable cross-zone load balancing on the ALB to limit traffic spillover',
  ]}
  answer={1}>

**Correct: B**

Highly available capacity planning must survive losing one AZ without degradation; the standard pattern is N+1 headroom across AZs backed by Auto Scaling, rather than permanently over-provisioning double capacity (A) that sits idle. C concentrates everything in one AZ, creating a single point of failure. D disabling cross-zone load balancing actually unbalances per-AZ traffic distribution and does nothing for fault tolerance.

</Quiz>

<Quiz
  qnum={22}
  total={65}
  question="A healthcare platform needs to route VPC traffic through a fleet of third-party virtual firewall / network IDS appliances so that all inbound and outbound traffic is transparently inspected, and the appliance fleet must be able to scale out horizontally. Which load balancer is MOST appropriate?"
  options={[
    'Application Load Balancer (ALB)',
    'Network Load Balancer (NLB)',
    'Gateway Load Balancer (GWLB)',
    'Classic Load Balancer (CLB)',
  ]}
  answer={2}>

**Correct: C**

GWLB is purpose-built to deploy and scale third-party network appliances (firewalls, IDS/IPS, deep packet inspection), using the GENEVE protocol to transparently steer traffic to a fleet of appliances while load balancing across them, exactly as required. ALB is Layer 7 application routing, NLB is Layer 4 high-performance routing, and CLB is the previous generation; none can transparently steer traffic through network appliances.

</Quiz>

<Quiz
  qnum={23}
  total={65}
  question="A streaming platform uses Auto Scaling to process background transcoding jobs sourced from an SQS queue. It currently target-tracks average CPU, but during spikes the queue backs up heavily while CPU barely moves, so scaling is too slow. The company wants to scale more accurately based on the amount of pending work. Which scaling metric is MOST appropriate?"
  options={[
    'Keep a fixed instance count and switch to a larger instance type',
    'Use a custom metric: target-track the backlog per instance (queue messages divided by instance count)',
    'Lengthen the scaling cooldown to avoid flapping',
    'Switch to scheduled scaling that scales out on the hour',
  ]}
  answer={1}>

**Correct: B**

When the bottleneck is the number of pending messages rather than CPU, the backlog per instance (visible queue messages divided by current instance count) is the right custom target-tracking metric, driving the ASG by actual workload for the most accurate response. A loses elasticity; C lengthening cooldown makes scaling even slower; D scheduled scaling suits predictable, regular patterns, not queue depth that varies with workload.

</Quiz>

<Quiz
  qnum={24}
  total={65}
  question="An e-commerce site runs a flash sale that starts exactly at 12:00 noon each day, with traffic surging explosively in the minutes right before the start. Target-tracking scaling has repeatedly left the site short of capacity at the opening moment due to reaction lag. The company wants capacity ready BEFORE the traffic actually arrives, while still keeping normal load-based automatic adjustment. What combination is MOST appropriate?"
  options={[
    'Use only simple scaling, reacting after CPU crosses a threshold',
    'Configure both scheduled scaling (raise capacity before 12:00) and target tracking (auto-adjust to load the rest of the time)',
    'Keep the peak maximum instance count running all day',
    'Set the scaling cooldown to 0 to speed up reactions',
  ]}
  answer={1}>

**Correct: B**

The start time is predictable, so scheduled scaling pre-provisions capacity before 12:00, avoiding the reactive lag of target tracking, while target tracking still auto-adjusts to load the rest of the time; the two coexist and complement each other. A is too reactive; C runs peak all day and wastes cost; D a cooldown of 0 causes scaling flapping and still cannot solve the before-the-event shortfall.

</Quiz>

<Quiz
  qnum={25}
  total={65}
  question="A SaaS service has clearly cyclical traffic, high during weekday daytime and low on weekends, with a fairly stable waveform. The company wants the system to learn the historical pattern, forecast ahead, and scale out before demand rises, reducing the lag of reactive scaling. Which Auto Scaling strategy is MOST appropriate?"
  options={[
    'Predictive scaling',
    'Simple scaling',
    'Manually adjusting the desired capacity',
    'Disabling scaling and using a fixed capacity',
  ]}
  answer={0}>

**Correct: A**

Predictive scaling uses machine learning to analyze historical cyclical traffic, forecast future demand, and scale out before the rise, which best fits a regular, learnable, cyclical load. Simple scaling is reactive and slow; manual and fixed capacity cannot automatically adapt to cyclical change. In practice it is often combined with target tracking (predictive for the baseline, tracking for real-time variation).

</Quiz>

<Quiz
  qnum={26}
  total={65}
  question="An asynchronous image-processing system has a frontend that places jobs into an SQS queue consumed by EC2 workers. Some images repeatedly fail and are retried, so such a message keeps occupying the queue and slows everything down. The company wants repeatedly failing messages automatically isolated so the main queue is no longer stuck, for later manual analysis. What is the MOST appropriate approach?"
  options={[
    'Delete the failing messages outright',
    'Configure a dead-letter queue (DLQ) with a maxReceiveCount so messages exceeding the receive limit move to the DLQ automatically',
    'Set the visibility timeout to 0',
    'Keep adding consumers indefinitely to dilute the failing messages',
  ]}
  answer={1}>

**Correct: B**

Configure a dead-letter queue (DLQ) with a maxReceiveCount on the main queue; when a message is received and retried beyond the limit it is moved to the DLQ automatically, so poison-pill messages no longer block the main queue and can be analyzed manually later. A loses forensic clues; C a visibility timeout of 0 causes duplicate processing and more chaos; D adding consumers cannot fix the root cause that the message itself fails.

</Quiz>

<Quiz
  qnum={27}
  total={65}
  question="An inventory system requires that change messages for the same product ID be processed strictly in the order sent and that no single change be applied twice, while different products may be processed in parallel to preserve throughput. What is the MOST appropriate SQS design?"
  options={[
    'Use a standard queue and implement ordering and deduplication in the application',
    'Use a FIFO queue with the product ID as the MessageGroupId',
    'Use a FIFO queue but share a single MessageGroupId for all messages',
    'Drop the queue and push directly via an SNS standard topic',
  ]}
  answer={1}>

**Correct: B**

A FIFO queue provides strict ordering and deduplication; using the product ID as the MessageGroupId lets messages for the same product process strictly in order while different products belong to different groups and consume in parallel, balancing ordering guarantees with throughput. C sharing one group serializes all messages and caps throughput; A reinvents the wheel and is error-prone; D a standard topic offers no ordering or deduplication guarantee.

</Quiz>

<Quiz
  qnum={28}
  total={65}
  question="A company wants to point the subdomain app.example.com at a CloudFront-served site that lives in another account, and in Route 53 it wants to avoid hard-coding addresses that can change while also avoiding extra charges for the DNS queries. What is the MOST appropriate DNS record configuration?"
  options={[
    'Create an Alias record pointing to the CloudFront domain name',
    'Create an A record hard-coded to CloudFront current IP addresses',
    'Create an MX record pointing to CloudFront',
    'Create an NS record to delegate the subdomain',
  ]}
  answer={0}>

**Correct: A**

A Route 53 Alias record can point directly at the domain name of an AWS resource such as CloudFront, avoids hard-coding IPs that change, and Alias queries to AWS resources are free, meeting every requirement. CloudFront edge IPs change, so an A record cannot be hard-coded (B); MX is a mail-exchange record (C); NS delegation is unrelated to pointing at a site (D).

</Quiz>

<Quiz
  qnum={29}
  total={65}
  question="A multinational application has separate deployments in the US, Europe, and Japan. For compliance, users from a given country must always connect to that country designated deployment, regardless of latency. Which Route 53 routing policy should be used?"
  options={[
    'Latency-based routing',
    'Geolocation routing',
    'Weighted routing',
    'Multivalue answer routing',
  ]}
  answer={1}>

**Correct: B**

The compliance requirement to force users to a designated deployment by their country is exactly what geolocation routing does: it returns the matching record based on the query source geographic location. Latency-based routing sends users to the fastest endpoint (which does not guarantee country-based compliance and is a common distractor); weighted splits by proportion; multivalue is simple load spreading; none meet the force-by-country requirement.

</Quiz>

<Quiz
  qnum={30}
  total={65}
  question="A disaster recovery project requires that when the primary Region suffers a Region-wide failure the system recover within minutes with very low data loss (near-zero RPO), but the company will not pay for two fully equal active-active Regions. Which DR strategy is MOST appropriate?"
  options={[
    'Backup and restore (only back up normally, restore when needed)',
    'Pilot light (only the core database replicates continuously, the rest is shut down on standby)',
    'Warm standby (run a scaled-down environment continuously in the recovery Region, scale it up fast during a disaster)',
    'Multi-site active/active (two fully equal Regions serving simultaneously)',
  ]}
  answer={2}>

**Correct: C**

Warm standby runs a scaled-down but serviceable environment continuously in the recovery Region with ongoing data replication, and scales up fast during a disaster, achieving an RTO of minutes and near-zero RPO at a cost clearly lower than full active-active. Backup and restore and pilot light recover more slowly with longer RTO; multi-site is fastest but most expensive, which conflicts with not paying for a high cost.

</Quiz>

<Quiz
  qnum={31}
  total={65}
  question="An enterprise backup policy requires the RPO of a critical database to be under 5 minutes, while an RTO of about 1 hour is acceptable. The team currently takes one full backup per day. Which change BEST meets the RPO while keeping operational overhead lowest?"
  options={[
    'Keep daily backups; the RPO will improve on its own',
    'Enable continuous backup / transaction log retention on the database to support near point-in-time recovery (PITR)',
    'Switch to taking a manual snapshot every hour',
    'Move backups to a lower-cost archive storage tier',
  ]}
  answer={1}>

**Correct: B**

RPO is the tolerable amount of data loss. A daily backup can mean an RPO of up to a day, failing the under-5-minutes target. Enabling continuous backup / transaction logs (supporting point-in-time recovery, PITR) shrinks the RPO to very small, and because the service retains the logs automatically it keeps operational overhead lowest. C an hourly manual snapshot still yields a 1-hour RPO and needs manual effort; A is a misconception; D only affects cost and retrieval speed, not RPO.

</Quiz>

<Quiz
  qnum={32}
  total={65}
  question="A global online game requires its player database to support low-latency reads across multiple Regions and to promote a secondary Region to a new primary within about a minute if the primary Region fails entirely. Which database solution is MOST appropriate?"
  options={[
    'A single-Region RDS Multi-AZ deployment',
    'Amazon Aurora Global Database',
    'Independent, unrelated RDS instances in each Region kept in sync by the application',
    'A single-Region RDS with several cross-Region read replicas, rebuilt manually on failure',
  ]}
  answer={1}>

**Correct: B**

Aurora Global Database pairs one primary Region with multiple secondary Regions, providing low-latency cross-Region reads and very low replication lag, and supports promoting a secondary Region to a new primary quickly (about a minute) if the primary fails, matching the requirement exactly. RDS Multi-AZ tolerates failure only within one Region (A is insufficient); C independent instances are hard to keep consistent; D cross-Region read replicas fail over more slowly and manually, giving a worse RTO.

</Quiz>

<Quiz
  qnum={33}
  total={65}
  question="A content management system runs on an EC2 fleet spread across three AZs. The instances must mount the same shared files simultaneously and still access those files if any single AZ fails. Which shared storage solution is MOST appropriate?"
  options={[
    'Attach a separate EBS volume to each EC2 instance and sync them periodically',
    'Use Amazon EFS so EC2 instances in multiple AZs mount the same file system simultaneously',
    'Place the files on a single NFS server in one AZ for everyone to connect to',
    'Use the instance store as shared space',
  ]}
  answer={1}>

**Correct: B**

Amazon EFS is a fully managed, multi-AZ shared file system that EC2 instances across multiple AZs can mount simultaneously, and a single-AZ failure does not affect access, fully meeting the cross-AZ shared and highly available requirement. EBS is single-AZ block storage that cannot be shared across instances (A requires custom sync and risks inconsistency); C a single NFS server is a SPOF; D the instance store is ephemeral and lost when the instance stops.

</Quiz>

<Quiz
  qnum={34}
  total={65}
  question="A real-time payment system must broadcast payment-success events one-to-many to multiple downstream services, and end to end it must preserve strict event ordering and remove duplicates, with no message lost if any downstream is briefly offline. Which TWO settings together achieve this? (Choose TWO)"
  options={[
    'Publish events to an SNS FIFO topic to guarantee strict ordering and deduplication at the publisher',
    'Have each downstream subscribe with its own SQS FIFO queue to the FIFO topic, preserving end-to-end ordering, deduplication, and buffering',
    'Use an SNS standard topic for the highest throughput',
    'Have each downstream subscribe with its own SQS standard queue',
    'Have downstreams call each other APIs synchronously to ensure ordering',
  ]}
  answer={[0, 1]}>

**Correct: A, B**

End-to-end ordering plus deduplication requires FIFO on both ends: an SNS FIFO topic (A) guarantees order and deduplication at the publisher, paired with each downstream subscribing via an SQS FIFO queue (B) to preserve strict end-to-end ordering while buffering so no message is lost when a downstream is offline. Standard topics/queues (C, D) only guarantee at-least-once, best-effort ordering, breaking the guarantee; E synchronous calls are tightly coupled and fail if any downstream is offline.

</Quiz>

<Quiz
  qnum={35}
  total={65}
  question="A three-tier architecture must withstand both a single-AZ failure and automatic failover when the data-tier primary fails. Which TWO measures BEST achieve this directly? (Choose TWO)"
  options={[
    'Deploy the EC2 Auto Scaling Group across multiple AZs',
    'Enable Multi-AZ on the backend RDS so the primary fails over automatically',
    'Consolidate all resources into the single lowest-latency AZ',
    'Create only an RDS read replica and expect it to take over automatically if the primary fails',
    'Disable ALB health checks to avoid instances being terminated by mistake',
  ]}
  answer={[0, 1]}>

**Correct: A, B**

High availability hinges on spanning multiple AZs to remove single points of failure: an ASG across multiple AZs (A) keeps the compute tier surviving a single-AZ failure, and enabling RDS Multi-AZ (B) fails the primary over to the standby automatically. C concentrating in one AZ creates a SPOF; D a read replica is asynchronous and used for read scaling, not automatic failover (a common distractor); E disabling health checks sends traffic to failed targets, which is worse.

</Quiz>

<Quiz
  qnum={36}
  total={65}
  question="A company needs Route 53 to meet two requirements: (1) point the root domain example.com (zone apex) at an ALB in a DNS-compliant way; and (2) have the same hostname return multiple healthy endpoint IPs at random for simple client-side load spreading with health checks. Which TWO settings are MOST appropriate, respectively? (Choose TWO)"
  options={[
    'Create an Alias record for the zone apex pointing to the ALB',
    'Use multivalue answer routing with a health check attached to each endpoint',
    'Create a CNAME record for the zone apex pointing to the ALB domain name',
    'Use simple routing returning a single fixed record',
    'Use weighted routing with all weights set to 0',
  ]}
  answer={[0, 1]}>

**Correct: A, B**

A zone apex cannot use CNAME (a DNS restriction), so it needs a Route 53 Alias record (A) pointing to the ALB; and returning multiple healthy endpoints at random for simple load spreading is exactly multivalue answer routing with health checks (B). C violates the no-CNAME-at-apex rule; D simple routing returns a single record with no health-based spreading; E all-zero weights leave no record to return.

</Quiz>

<Quiz
  qnum={37}
  total={65}
  question="A read-heavy, write-light news site has its backend RDS overwhelmed by read-only queries during breaking-news spikes, which also slows writes. The company wants to offload read traffic with minimal impact on primary write performance, while still keeping automatic failover if the primary fails. What combination is MOST appropriate?"
  options={[
    'Enable only Multi-AZ and have the standby serve reads normally',
    'Enable Multi-AZ for automatic failover and additionally create one or more read replicas to serve the read-only queries',
    'Create only a read replica; no Multi-AZ is needed for automatic failover',
    'Upgrade the primary to a larger instance type and leave it at that',
  ]}
  answer={1}>

**Correct: B**

Read replicas are built for read scaling; directing read-only queries to replicas offloads the primary, while automatic failover still requires Multi-AZ, so the two serve different roles and should be used together. Note the Multi-AZ standby does not serve reads normally (A is a common misconception); a read replica does not provide automatic failover (C is wrong); D vertical scaling is a stopgap and still a single point of failure.

</Quiz>

## Domain 3 · Design High-Performing Architectures (Q38-52)

<Quiz
  qnum={38}
  total={65}
  question="A batch genome-sequencing workload is stateless, fault tolerant, and can be automatically retried. It runs as massively parallel compute, and the team wants to minimize the cost of this temporary work. Which EC2 pricing and scheduling approach fits best?"
  options={[
    'Keep On-Demand instances running on standby full time',
    'Run EC2 Spot Instances together with a Spot Fleet',
    'Buy 3-year Standard Reserved Instances',
    'Rent Dedicated Hosts',
  ]}
  answer={1}>

**Correct: B**

Stateless, interruptible, retryable, and cost-sensitive is the classic **Spot** scenario; pairing it with a Spot Fleet draws capacity from multiple instance pools and can save up to about 90 percent. A on standby is most expensive; C Reserved Instances suit steady long-running workloads and a 3-year commit is wrong for temporary batches; D Dedicated Hosts are costliest and only for compliance or bring-your-own-license.

</Quiz>

<Quiz
  qnum={39}
  total={65}
  question="An API is built on AWS Lambda, but during peak hours cold starts cause occasional high latency. The team wants to keep functions ready for predictable peaks to achieve the most stable and lowest response latency. Which approach fits best?"
  options={[
    'Set the Lambda memory allocation to the maximum',
    'Configure Lambda Provisioned Concurrency',
    'Use a Lambda Reserved Concurrency limit instead',
    'Extend the function timeout to 15 minutes',
  ]}
  answer={1}>

**Correct: B**

To eliminate cold starts and keep functions pre-initialized, use **Provisioned Concurrency**, which keeps a set number of warm execution environments and minimizes cold-start latency. A adds CPU alongside memory but barely helps cold starts; C Reserved Concurrency is a cap, not pre-warming, and does not remove cold starts; D a longer timeout is unrelated to startup latency.

</Quiz>

<Quiz
  qnum={40}
  total={65}
  question="A containerized microservices platform runs on Amazon ECS on EC2. The team wants to auto-adjust the underlying capacity to maximize cluster node utilization and lower compute cost, without changing the ECS service definitions. Which approach fits best?"
  options={[
    'Manually fix the node count based on experience',
    'Enable an ECS Capacity Provider with managed scaling',
    'Run every task on its own dedicated large EC2 instance',
    'Disable task-level auto scaling',
  ]}
  answer={1}>

**Correct: B**

To auto-match container demand, raise node utilization, and cut cost, use a **Capacity Provider with managed scaling**, which grows and shrinks EC2 capacity based on actual task demand. A fixed count cannot track load; C one large instance per task is most wasteful; D disabling scaling is the opposite of the goal.

</Quiz>

<Quiz
  qnum={41}
  total={65}
  question="A relational database volume currently uses EBS gp2, and at peak both IOPS and throughput fall short. The team wants to independently raise IOPS and throughput while balancing cost, without increasing volume size or moving to the pricier io2. Which approach fits best?"
  options={[
    'Switch to EBS gp3 and independently provision higher IOPS and throughput',
    'Switch to EBS st1 throughput-optimized HDD',
    'Switch to instance store',
    'Switch to EBS sc1 cold HDD',
  ]}
  answer={0}>

**Correct: A**

**gp3** decouples performance from capacity: you can provision higher IOPS and throughput without enlarging the volume, at a lower unit price than io2, best matching the balance of performance and cost. st1 and sc1 are HDDs built for throughput, not high IOPS, with higher latency; instance store is not durable and unsuitable for a database.

</Quiz>

<Quiz
  qnum={42}
  total={65}
  question="A high-performance computing application needs the same data volume mounted concurrently to multiple EC2 instances (Linux) within the same Availability Zone, so cluster nodes can read and write block storage in parallel. Which configuration fits best?"
  options={[
    'Use Amazon S3 and let each node read and write on its own',
    'Use EBS io2 with Multi-Attach enabled',
    'Attach a separate gp3 volume per node and sync manually',
    'Use an EBS st1 throughput-optimized HDD attached to a single instance',
  ]}
  answer={1}>

**Correct: B**

The same block volume attached concurrently to multiple EC2 instances in one AZ is exactly what **EBS Multi-Attach** provides; supported io1/io2 volumes can attach to multiple instances at once. A S3 is object, not block, storage; C separate volumes cannot share one dataset; D a single-attach volume does not meet multi-node sharing.

</Quiz>

<Quiz
  qnum={43}
  total={65}
  question="A data-lake analytics job needs a file system with very high throughput that links directly to an S3 dataset so compute nodes can read large amounts of data in parallel, with read latency kept as low as possible. Which FSx for Lustre deployment fits best?"
  options={[
    'Use a Persistent deployment but link it to no storage',
    'Use a Scratch deployment linked to S3 with lazy-loaded datasets',
    'Switch to FSx for Windows File Server over SMB',
    'Switch to EFS standard mode as HPC scratch storage',
  ]}
  answer={1}>

**Correct: B**

Very high throughput, direct S3 linkage, and parallel reads of large datasets are the signature use of **FSx for Lustre linked to S3**, which can present S3 objects as lazily loaded files with very low latency and high throughput. A without an S3 link cannot achieve data-lake integration; C FSx for Windows uses SMB for Windows; D EFS throughput does not reach Lustre levels.

</Quiz>

<Quiz
  qnum={44}
  total={65}
  question="Hundreds of Linux EC2 instances across teams need to share one file system, with a clear hot-and-cold access pattern (some files go cold quickly). The team wants to keep concurrent shared mounting while retaining data long term in the most cost-effective way. Which approach fits best?"
  options={[
    'Use Amazon EFS with lifecycle management to auto-move cold files to the IA class',
    'Switch to FSx for Lustre as the long-term shared drive',
    'Put all files on one large gp3 volume on a single EC2 instance',
    'Attach a separate EBS volume per EC2 and replicate between them',
  ]}
  answer={0}>

**Correct: A**

**EFS** can be mounted concurrently by many Linux instances, and with lifecycle management it automatically moves rarely accessed files to the lower-cost EFS IA (Infrequent Access) class, balancing sharing with long-term cost. B Lustre is HPC scratch, not an economical long-term share; C a single-instance volume cannot be shared by many; D replicating between volumes neither shares nor scales well.

</Quiz>

<Quiz
  qnum={45}
  total={65}
  question="A global social app stores sessions and user profiles in Amazon Aurora, with far more reads than writes, and requires lowest-latency reads regardless of which continent the user is on. Which approach fits best?"
  options={[
    'Deploy Aurora in a single Region and open cross-continent connections',
    'Use an Aurora Global Database with read replicas in each Region serving local reads nearby',
    'Move the data to a single-Region DynamoDB table',
    'Stand up a fully independent, non-synchronized database per country',
  ]}
  answer={1}>

**Correct: B**

Cross-continent, read-heavy, and lowest-latency local reads is exactly the fit for **Aurora Global Database**: the primary Region handles writes while secondary Regions hold read replicas that serve local reads nearby, typically with sub-second cross-Region replication. A cross-continent connections add latency; C single-Region DynamoDB cannot serve each continent locally; D independent non-synced databases cause data inconsistency.

</Quiz>

<Quiz
  qnum={46}
  total={65}
  question="An IoT platform must store hundreds of thousands of time-series events per second keyed by device ID and timestamp. Queries mostly fetch a time range for a given device ID, and it requires single-digit-millisecond latency with serverless auto scaling. Which database design fits best?"
  options={[
    'Self-manage a single PostgreSQL instance on EC2',
    'Use DynamoDB with device ID as the partition key and timestamp as the sort key',
    'Use Amazon Redshift for real-time row-by-row writes',
    'Use a single RDS for MySQL instance to absorb all writes',
  ]}
  answer={1}>

**Correct: B**

Very high write volume, key-value access, fetching a time range per device, single-digit-millisecond latency, and serverless auto scaling point to **DynamoDB**; using device ID as the partition key and timestamp as the sort key naturally supports per-device time-range queries. A and D single instances scale poorly and need management; Redshift is a warehouse, poor at high-concurrency real-time row writes.

</Quiz>

<Quiz
  qnum={47}
  total={65}
  question="A shopping-cart service stores data in Amazon DynamoDB, and hot product pages are read repeatedly at peak. The team wants to cut these repeated-read latencies from milliseconds to microseconds with almost no application code changes. Which TWO actions achieve this? (Choose TWO)"
  options={[
    'Provision a DynamoDB Accelerator (DAX) cluster and switch the app to the DAX client',
    'Simply raise the table provisioned read capacity units (RCUs)',
    'Use the DAX item cache to absorb repeated queries for read-heavy access',
    'Replicate the table into Amazon Redshift for reads',
    'Put a self-managed EC2 reverse proxy in front as a cache',
  ]}
  answer={[0, 2]}>

**Correct: A, C**

DynamoDB-specific, microsecond-level, and almost no code change point to **DAX**: provision a **DAX cluster and switch to the DAX client (A)**, whose API is nearly compatible, and let the **DAX item cache (C)** absorb repeated reads to bring latency down to microseconds. B raising RCUs only adds throughput, with latency still in milliseconds; D Redshift is an analytics warehouse, unsuited to online microsecond reads; E a self-managed EC2 proxy adds operational overhead and is not a native cache.

</Quiz>

<Quiz
  qnum={48}
  total={65}
  question="A real-time multiplayer game needs an in-memory data store for live leaderboards, counters, and publish/subscribe messaging shared across multiple nodes, and the data must support replication and persistence. Which service fits best?"
  options={[
    'Amazon ElastiCache for Memcached',
    'Amazon ElastiCache for Redis',
    'A standard Amazon DynamoDB table',
    'Amazon S3',
  ]}
  answer={1}>

**Correct: B**

Leaderboards (sorted sets), counters, publish/subscribe, plus replication and persistence are strengths of **Redis**. Memcached is plain key-value with no sorted structures, replication, or persistence; DynamoDB can do it but is not the best in-memory microsecond leaderboard; S3 is object storage, unsuited to real-time leaderboards.

</Quiz>

<Quiz
  qnum={49}
  total={65}
  question="A streaming platform distributes video on demand (VOD) through CloudFront, but different segments of the same video often hit the origin and slow performance. The team wants to keep CloudFront distribution while maximizing edge cache hit ratio and reducing origin fetches and latency. Which approach fits best?"
  options={[
    'Disable edge caching and fetch from origin every time',
    'Tune cache policies and TTLs to raise the edge hit ratio for cacheable objects',
    'Change the origin from S3 to a single EC2 instance to concentrate traffic',
    'Replace CloudFront with Global Accelerator for static video distribution',
  ]}
  answer={1}>

**Correct: B**

To raise edge cache hits and reduce origin fetches and latency, tune **cache policies and TTLs** so cacheable video segments hit the edge as often as possible and minimize origin fetches. A disabling caching is the opposite of the goal; C a single EC2 origin becomes a bottleneck; D Global Accelerator does not cache content and is unsuited to distributing cacheable static video.

</Quiz>

<Quiz
  qnum={50}
  total={65}
  question="A securities order gateway uses a custom TCP protocol and requires that global users reach the nearest entry point over the AWS backbone with lowest latency, with static IP addresses for firewall allow-listing, and fast failover during a Regional outage. The content does not need caching. Which service fits best?"
  options={[
    'Amazon CloudFront',
    'AWS Global Accelerator',
    'Amazon Route 53 weighted routing',
    'Application Load Balancer',
  ]}
  answer={1}>

**Correct: B**

Non-HTTP (custom TCP), lowest-latency path over the AWS backbone, fixed anycast static IPs, fast Regional failover, and no caching is exactly **Global Accelerator**. CloudFront leans to HTTP content caching; Route 53 only does DNS resolution, with failover slowed by TTLs; ALB is Layer 7 HTTP and provides no fixed static IPs.

</Quiz>

<Quiz
  qnum={51}
  total={65}
  question="An ad platform ingests millions of click events per second and requires that multiple independent downstream analytics services each read the same data at their own pace and be able to replay it within a retention period. Which service fits best?"
  options={[
    'An Amazon SQS standard queue',
    'Amazon Kinesis Data Streams',
    'An Amazon SNS standard topic',
    'Amazon MQ',
  ]}
  answer={1}>

**Correct: B**

Multiple consumers reading the same data at their own pace, replay within a retention period, and millions of events per second are core capabilities of **Kinesis Data Streams**, which scales throughput with shards and lets data be re-read during retention. SQS deletes messages after consumption and cannot replay; SNS is push and does not retain for replay; Amazon MQ is a traditional message broker, not high-throughput stream replay.

</Quiz>

<Quiz
  qnum={52}
  total={65}
  question="A multinational team frequently uploads multi-GB large files to an S3 bucket in a single Region, and uploads are currently slow and often fail. Which TWO actions best improve upload throughput, speed, and reliability together? (Choose TWO)"
  options={[
    'Enable S3 Transfer Acceleration to speed cross-Region uploads via nearby edge locations',
    'Use Multipart Upload for large files to send parts in parallel with resumable transfers',
    'Concentrate all objects under a single prefix to simplify management',
    'Switch to the S3 Glacier Deep Archive storage class',
    'Compress each file into one and upload sequentially on a single thread',
  ]}
  answer={[0, 1]}>

**Correct: A, B**

Slow cross-border large-file uploads call for **Transfer Acceleration (A)**, which routes via nearby edge locations over the AWS backbone, and **Multipart Upload (B)**, which splits large files into parts for parallel, resumable transfer to boost throughput. C a single prefix limits parallelism; D Glacier is an archive class, unrelated to upload speed and slow to retrieve; E single-threaded sequential upload is slowest and cannot exploit parallelism.

</Quiz>

## Domain 4 · Design Cost-Optimized Architectures (Q53-65)

<Quiz
  qnum={53}
  total={65}
  question="A gaming company runs real-time match servers whose traffic is steady and predictable all year, must stay always-on, and cannot be interrupted. The team plans to upgrade the servers from an older instance generation to a newer compute generation in about six months. It wants the most cost-effective way to lock in a discount without being tied to a specific instance type. Which option fits best?"
  options={[
    'Buy EC2 Instance Savings Plans for the specific old and new instance types',
    'Buy Compute Savings Plans with an hourly compute spend commitment',
    'Buy 3-year Standard Reserved Instances for the current old instance type',
    'Keep everything On-Demand to retain flexibility',
  ]}
  answer={1}>

**Correct: B**

"Steady, predictable, always-on, cannot be interrupted, but will upgrade across instance types later and must not be locked in" is the strength of **Compute Savings Plans**: commit to an hourly compute spend for a discount that applies automatically across instance families, Regions, and even Fargate and Lambda, so upgrading instance types never breaks the discount. A EC2 Instance Savings Plans give a deeper discount but bind to an instance family, so a cross-family upgrade breaks it; C Standard Reserved Instances are the least flexible and lock you in even more; D On-Demand has no discount and is most expensive for a steady load.

</Quiz>

<Quiz
  qnum={54}
  total={65}
  question="A research institute needs to run a large-scale genome-matching workload. The work splits into many independent small tasks, supports checkpointing, and if a single node is reclaimed mid-run it can simply be rerun on another node. The batch deadline has several days of slack. The team wants the lowest possible cost for this workload. Which approach fits best?"
  options={[
    'Buy 1-year Reserved Instances to run the workload long term',
    'Run the workload on Spot Instances with multiple instance types for capacity diversification',
    'Use On-Demand to guarantee it is never interrupted',
    'Rent whole Dedicated Hosts to run it',
  ]}
  answer={1}>

**Correct: B**

"Splittable + checkpointed + rerunnable after reclaim + slack in the deadline + lowest cost" is the classic **Spot** scenario, saving up to about 90 percent; using multiple instance types for capacity diversification reduces the risk of many nodes being reclaimed at once. A Reserved Instances are a long-term commitment for steady always-on usage, not a run-to-completion batch; C On-Demand has no discount and is most wasteful for interruptible work; D Dedicated Hosts are the most expensive and unrelated to this need.

</Quiz>

<Quiz
  qnum={55}
  total={65}
  question="A SaaS provider has a large dataset that is typically accessed only once or twice a month, but each access must be served immediately. The data must be kept long term, cannot be recreated, and must retain high durability across multiple Availability Zones (AZs). The team wants the most cost-effective storage. Which S3 storage class fits best?"
  options={[
    'S3 Standard',
    'S3 Standard-IA',
    'S3 One Zone-IA',
    'S3 Glacier Deep Archive',
  ]}
  answer={1}>

**Correct: B**

"Infrequent access (once or twice a month) + each access must be immediate + data cannot be recreated and needs multi-AZ durability + long-term and cost-conscious" maps exactly to **S3 Standard-IA**: a lower storage price than Standard, still instant access, and high durability across three AZs. A Standard is too expensive for such low access frequency; C One Zone-IA stores in a single AZ and suits recreatable data, failing the cannot-recreate, high-durability requirement; D Deep Archive takes hours to retrieve and cannot serve immediate reads.

</Quiz>

<Quiz
  qnum={56}
  total={65}
  question="A company has backup data that is never touched normally and is retrieved only during rare disaster-recovery drills, where a wait of several hours is acceptable but slightly faster retrieval flexibility than the deepest archive is desired. The data volume is huge and the team wants very low storage cost for long-term retention. Which S3 storage class fits best?"
  options={[
    'S3 Glacier Instant Retrieval',
    'S3 Glacier Flexible Retrieval',
    'S3 Standard-IA',
    'S3 Intelligent-Tiering',
  ]}
  answer={1}>

**Correct: B**

"Never touched normally + retrieved only during occasional drills + minutes to hours is fine + very low storage cost" maps to **Glacier Flexible Retrieval**: its storage price is far below the instant-retrieval class, and retrieval time is selectable from minutes to hours, fitting backups that do not need millisecond access. A Instant Retrieval is built for millisecond access and has a higher storage price; C Standard-IA storage cost is clearly higher than Glacier and not cost-effective for data that is almost never touched; D Intelligent-Tiering suits data with unknown access patterns, not the lowest-cost archive answer.

</Quiz>

<Quiz
  qnum={57}
  total={65}
  question="A team stores app-uploaded raw images in an S3 bucket with a clear pattern: for the first 30 days after upload they are frequently read by a thumbnail service, after 30 days they are rarely viewed, and by compliance they must be kept one more year before deletion. The team wants to automate the downgrade and cleanup with the least operational overhead. Which TWO actions fit best? (Choose TWO)"
  options={[
    'Set an S3 Lifecycle rule to transition objects to the lower-cost Standard-IA after 30 days',
    'Set an S3 Lifecycle rule to expire (delete) objects automatically after one year',
    'Write a daily script that evaluates each object age and then moves and deletes it',
    'Change the entire bucket to Glacier Deep Archive all at once',
    'Disable bucket versioning to prevent data from accumulating',
  ]}
  answer={[0, 1]}>

**Correct: A, B**

Two phases, two Lifecycle rules: hot for 30 days then cold means a **transition rule to Standard-IA after 30 days (A)**; keep for one year then purge means an **expiration rule to delete after one year (B)**, set once and fully automatic with the least overhead. C a custom daily script is the highest operational overhead; D moving everything to Deep Archive at once would incur retrieval fees and minimum-storage-duration penalties on images still hot in the first 30 days; E disabling versioning is unrelated to age-based downgrade and expiration and cannot handle existing objects.

</Quiz>

<Quiz
  qnum={58}
  total={65}
  question="A company has several EC2 instances in a private subnet in us-east-1 that need to frequently read large amounts of data from an Amazon S3 bucket in the same Region. Because they have no public IP, traffic currently detours through a NAT gateway out to the internet and back to S3, where the per-GB processing and transfer fees inflate the bill. The team wants the most cost-effective way to eliminate these fees. Which approach fits best?"
  options={[
    'Assign public IPs to the EC2 instances to reach S3 directly over the internet',
    'Create an S3 Gateway VPC Endpoint so traffic stays on the AWS private network and the endpoint itself is free',
    'Use an S3 Interface Endpoint (PrivateLink)',
    'Replicate the S3 bucket cross-Region to other Regions for closer access',
  ]}
  answer={1}>

**Correct: B**

For S3 or DynamoDB access, a **Gateway VPC Endpoint** routes traffic back to the AWS private network via the route table and is itself completely free, eliminating the NAT per-GB processing and egress fees, making it the cheapest option for heavy same-Region S3 access. A public IPs still go over the internet, incur egress fees, and are less secure; C an Interface Endpoint is billed hourly plus per-GB, so the free Gateway Endpoint is cheaper for S3; D cross-Region replication is the most expensive transfer and the opposite direction.

</Quiz>

<Quiz
  qnum={59}
  total={65}
  question="A data analytics team copies large processing results every night from EC2 in us-east-1 to another system in ap-northeast-1, and the cross-Region transfer cost keeps rising monthly. The team also notices that within the same Region, the application tier and data tier EC2 instances are deliberately spread across different Availability Zones (AZs) with high-frequency chatter, producing cross-AZ transfer fees too. The team wants to lower overall transfer cost. Which approach is most cost-effective?"
  options={[
    'Change the nightly cross-Region copy to transfer only compressed incremental deltas, and co-locate the chatty same-Region components into the same AZ',
    'Assign public IPs to each EC2 so cross-Region traffic goes over the internet',
    'Route both systems to connect through a NAT gateway',
    'Split the application and data tiers across even more AZs to distribute load',
  ]}
  answer={0}>

**Correct: A**

There are two levers: cross-Region is the most expensive transfer, so **sending only compressed incremental deltas** sharply cuts cross-Region traffic; and **co-locating the chatty same-Region components into one AZ** lets them talk over private IPs within the AZ with no cross-AZ fee, so the two together are cheapest. B public IPs over the internet still incur egress fees and are less secure; C routing through a NAT gateway only adds per-GB processing fees; D spreading components across more AZs only raises cross-AZ chatter cost, the wrong direction.

</Quiz>

<Quiz
  qnum={60}
  total={65}
  question="A company's monthly bill composition is roughly similar each month, but the finance team wants the most granular, line-item-level usage and cost detail down to the resource and usage-type level. After export it will be loaded into their own data warehouse to run SQL for deep custom analysis and allocation. Which approach fits best?"
  options={[
    'Export a CSV from the AWS Cost Explorer charts',
    'Enable AWS Cost and Usage Report (CUR) to deliver line-item detail to S3 for analysis',
    'Set a threshold in AWS Budgets and export its report',
    'Use AWS Cost Anomaly Detection results as the detail source',
  ]}
  answer={1}>

**Correct: B**

"Most granular, line-item to resource and usage-type level, to be exported into a data warehouse for deep SQL analysis" is exactly the role of the **Cost and Usage Report (CUR)**: it provides the most detailed line-item billing data delivered to S3, ready to pair with Athena or to load into a warehouse for custom queries. A Cost Explorer is a visualization trends tool and not granular to the line-item level; C Budgets is threshold alerting, not a detail report; D Cost Anomaly Detection gives anomaly results only, not full usage detail.

</Quiz>

<Quiz
  qnum={61}
  total={65}
  question="A group has over twenty department accounts under AWS Organizations. Each account bought its own EC2 Reserved Instances and Savings Plans, but some accounts over-bought and sit idle while others still pay On-Demand. Without changing how each account operates, the group wants the least operational overhead to share discounts across the whole organization, aggregate usage, and simplify reconciliation. Which approach fits best?"
  options={[
    'Have accounts coordinate manually to resell over-bought Reserved Instances to other accounts',
    'Enable AWS Organizations Consolidated Billing in the management account',
    'Move all department resources into a single account for central management',
    'Set a Budgets budget per account to remind them not to over-buy',
  ]}
  answer={1}>

**Correct: B**

"Many accounts, shared discounts, aggregated usage, simpler reconciliation, least operational overhead" is the core value of **Organizations Consolidated Billing**: usage across the organization aggregates for larger volume discounts, unused RIs and Savings Plans can be applied automatically by other accounts, and a single bill is produced. A manual reselling is complex and error-prone; C moving all resources into a single account is a large-scale refactor with high overhead and risk; D per-account budgets are just alerts and do not share discounts or aggregate usage.

</Quiz>

<Quiz
  qnum={62}
  total={65}
  question="An e-commerce company's production order database is Aurora, with high daytime and low late-night traffic but a steady baseline all year and a fairly stable, predictable pattern. There is also an internal analytics database used intermittently only during office hours and completely idle off-peak. Without sacrificing production stability, the team wants the most cost-effective way to rearrange billing for these two databases. Which TWO actions fit best? (Choose TWO)"
  options={[
    'Buy Reserved Instances for the stable production Aurora to lock in a discount',
    'Move the intermittent internal analytics database to Aurora Serverless v2 so it scales down automatically off-peak',
    'Move the production order database to Spot for the lowest unit price',
    'Add several extra read replicas to production just in case',
    'Keep both databases On-Demand and always on',
  ]}
  answer={[0, 1]}>

**Correct: A, B**

Stable, predictable, always-on production load means **buy Reserved Instances to lock in a discount (A)**, up to 60 to 70 percent off; the intermittent, fully off-peak-idle analytics database means **move it to Aurora Serverless v2 (B)**, which scales with usage and shrinks to near-zero off-peak. C Spot gets reclaimed and cannot host a production database; D adding read replicas just in case only pays for extra full instances; E keeping both On-Demand and always on is the least cost-effective choice.

</Quiz>

<Quiz
  qnum={63}
  total={65}
  question="A logistics company already has a long-term, steady, high-volume connectivity need between its data center and AWS, currently over Site-to-Site VPN, but at high volume the per-GB transfer cost is high and latency fluctuates with the public internet. The company wants to lower the per-GB transfer rate long term and get stable, low-latency connectivity. Which approach fits best?"
  options={[
    'Add several more Site-to-Site VPN tunnels for load sharing',
    'Provision an AWS Direct Connect dedicated connection between the data center and AWS',
    'Route the data center traffic through a NAT gateway to the internet',
    'Route the data center traffic through an internet gateway (IGW)',
  ]}
  answer={1}>

**Correct: B**

"Long-term + steady + high-volume + lower per-GB rate and stable low latency" is exactly the **Direct Connect** scenario: although upfront cost and lead time are higher, at high volume the per-GB transfer rate is clearly cheaper than VPN over the public internet, and latency is unaffected by it. A more VPN tunnels are still bound by public-internet bandwidth and latency and do not lower the per-GB rate; C a NAT gateway is a private-subnet egress path, not a data-center interconnect; D an internet gateway is just the VPC's edge and provides no dedicated link or stable low latency.

</Quiz>

<Quiz
  qnum={64}
  total={65}
  question="A company runs an annual cost health check and finds two clear sources of waste: first, many accounts have EBS volumes left unattached to any instance for a long time and idle Elastic IPs; second, a group of Lambda functions is configured with far more memory than they actually use, and the team wants quantified guidance on how much a reconfiguration could save. The team wants the most direct native tools to address both. Which TWO tools fit best? (Choose TWO)"
  options={[
    'Use AWS Trusted Advisor cost-optimization checks to find waste like unattached EBS and idle Elastic IPs',
    'Use AWS Compute Optimizer to get quantified right-sizing guidance for Lambda memory',
    'Use AWS CloudTrail to inventory which resources are over-provisioned',
    'Use AWS Cost Explorer to automatically delete idle resources',
    'Use AWS Cost Anomaly Detection to list which Lambda functions to downsize',
  ]}
  answer={[0, 1]}>

**Correct: A, B**

Finding waste like unattached EBS and idle Elastic IPs is exactly what **Trusted Advisor (A)** cost-optimization checks do; getting quantified Lambda memory right-sizing guidance is **Compute Optimizer (B)**, which analyzes actual usage and recommends optimal memory configuration with estimated savings. C CloudTrail records API activity, not configuration analysis; D Cost Explorer only shows spend trends and does not delete resources; E Cost Anomaly Detection detects abnormal spend spikes, not right-sizing lists.

</Quiz>

<Quiz
  qnum={65}
  total={65}
  question="A company wants to overhaul several workloads at once, pursuing both the MOST cost-effective and the LEAST operational overhead: an always-on order API that is steady all year, a batch of nightly reporting compute that tolerates interruption and can be deferred, an internal database used intermittently only during office hours, and a large set of old audit files that must be retained for several more years by law and are almost never retrieved. Which combination fits best?"
  options={[
    'Order API on Savings Plans, nightly compute on Spot, internal database on Aurora Serverless v2, old audit files moved by Lifecycle to Glacier Deep Archive',
    'Change everything to On-Demand and have someone manually shut things down off-peak each day',
    'Order API on Spot, nightly compute on 3-year Reserved Instances, internal database kept On-Demand and always on, old audit files left in S3 Standard',
    'Move everything to a large self-managed EC2 cluster the team operates and schedules by hand',
  ]}
  answer={0}>

**Correct: A**

This is a composite scenario, mapped item by item: a steady always-on order API means **Savings Plans or RI** to lock in a discount; interruptible and deferrable nightly compute means **Spot** (up to about 90 percent off); the intermittent, off-peak-idle internal database means **Aurora Serverless v2** (scales down when idle); and old audit files retained by law and almost never retrieved means **S3 Lifecycle to Glacier Deep Archive**. All of this is configuration changes with nothing extra to run, so operational overhead barely increases. B manual shutdowns are high overhead and not cost-effective; C puts the non-interruptible API on Spot and binds interruptible nightly compute to a 3-year reservation, exactly backwards; D a self-managed cluster scheduled by hand is almost never the lowest-operational-overhead answer.

</Quiz>

---

🎉 With both mock exams done, your readiness has had a full workout! Go back to the matching domain articles and the Hands-on Labs to shore up anything you missed, then skim the [Exam Cram Sheet](./cram.md) once more and check the [Exam Day guide](./exam-day.md) before the exam. Keep your pace, trust your prep — good luck passing SAA-C03 on the first try!
