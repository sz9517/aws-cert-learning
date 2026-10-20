---
sidebar_position: 8
title: Practice Questions
---

# Domain 1 Practice Questions (official-exam style)

Pick your answer first, then click **Show answer & explanation**. This page mirrors the SAA-C03 exam style: **scenario-based stems**, options that are all plausible AWS services (distractors are never obviously wrong), and deliberate **qualifiers** like "MOST securely / with the LEAST operational overhead / MOST cost-effectively" to force trade-off comparisons. Includes both **single-answer** and **multiple-response (Choose TWO)** questions. These are **original** content (not real exam questions).

<Quiz
  qnum={1}
  total={20}
  question="A company runs an application on EC2 that needs to read files from an S3 bucket. The security team requires that no long-term credentials are stored on the instance. Which approach is MOST secure?"
  options={[
    'Put the Access Key and Secret Key in the application config file',
    'Store the keys in the EC2 environment variables for the app to read',
    'Create an IAM Role with S3 read permission and attach it to the EC2 instance',
    'Use the Root user Access Key so the app can access S3',
  ]}
  answer={2}>

**Correct answer: C**

EC2 should obtain temporary, auto-rotating credentials via an **IAM Role**, so no long-term keys are stored on the instance — the lowest risk. A and B put long-term keys where they can leak; D using Root keys is an even worse violation of least privilege.

</Quiz>

<Quiz
  qnum={2}
  total={20}
  question="A company has 10 engineering team members who need exactly the same permissions, and future hires must be able to get the same permissions quickly. The company wants to manage this with the LEAST operational overhead. Which approach is best?"
  options={[
    'Attach an identical copy of the policy to each member individually',
    'Create an IAM Group, attach the policy to the group, and add members to it',
    'Have all members share a single IAM user account and password',
    'Create a fully privileged role for each member to assume',
  ]}
  answer={1}>

**Correct answer: B**

Attaching the policy to an **IAM Group** so members inherit it on joining is the standard way to manage many people in the same role; new hires just join the group — lowest overhead. A drifts and is error-prone to maintain; C (shared account) cannot be audited and violates best practice; D (a role per person) is needlessly complex.

</Quiz>

<Quiz
  qnum={3}
  total={20}
  question="An IAM user is already allowed to perform an action via the policy on their group, but the security team has additionally attached a policy that explicitly denies that action. Can the user ultimately perform the action?"
  options={[
    'Yes, because an Allow always beats a Deny',
    'No, because an explicit Deny always beats any Allow',
    'It depends on which policy was created more recently',
    'When the two conflict, both are ignored and the default becomes Allow',
  ]}
  answer={1}>

**Correct answer: B**

IAM evaluation logic: **deny by default → an Allow is needed to permit → any explicit Deny overrides everything**. An explicit Deny is the final line of defense and beats all Allows, regardless of creation time (C wrong); IAM defaults to deny, not allow (D wrong).

</Quiz>

<Quiz
  qnum={4}
  total={20}
  question="For compliance reasons, a company must control the access policy of its encryption keys, set its own rotation schedule, and audit who used a key and when. Which KMS key type should be chosen?"
  options={[
    'An AWS owned key',
    'An AWS managed key',
    'A Customer managed key (CMK)',
    'No key at all; just hide the bucket by renaming it',
  ]}
  answer={2}>

**Correct answer: C**

Only a **Customer managed key (CMK)** lets you define the key policy, control rotation, and audit usage via CloudTrail. AWS owned/managed keys do not let you customize these details; D is not an encryption mechanism.

</Quiz>

<Quiz
  qnum={5}
  total={20}
  question="An engineer added a rule to a subnet NACL allowing inbound HTTP (port 80), but users still cannot reach the site. The Security Group has been confirmed correct. What is the MOST likely cause?"
  options={[
    'NACLs are stateless, and no outbound rule has been added to allow the response traffic out',
    'NACLs do not support the HTTP protocol',
    'You must use the Root account to apply NACL rules',
    'NACLs can only be applied to EC2 instances, not to subnets',
  ]}
  answer={0}>

**Correct answer: A**

**NACLs are stateless**, so inbound and the outbound response must be configured separately. You need an outbound Allow as well (typically the ephemeral high ports 1024–65535 used for responses). A Security Group would not need this, because it is stateful and automatically allows response traffic.

</Quiz>

<Quiz
  qnum={6}
  total={20}
  question="An application connecting to an RDS database needs a database password that rotates automatically on a schedule, and the company does not want to maintain its own rotation code. Which service fits best?"
  options={[
    'Store the password in an EC2 environment variable',
    'AWS Secrets Manager',
    'A standard parameter in Systems Manager Parameter Store',
    'Write the password in a code comment in the application',
  ]}
  answer={1}>

**Correct answer: B**

**Secrets Manager** has built-in **automatic rotation** integrated with RDS, with no rotation logic to write yourself. Standard Parameter Store parameters have no built-in rotation (you would write a Lambda); environment variables and code are not secure ways to manage secrets.

</Quiz>

<Quiz
  qnum={7}
  total={20}
  question="During an audit, the security team needs to find out which IAM identity called the API that deleted a resource, and when. Which service should they look at?"
  options={[
    'Amazon CloudWatch metrics and alarms',
    'AWS CloudTrail event history',
    'The AWS Config compliance score',
    'The Amazon GuardDuty findings list',
  ]}
  answer={1}>

**Correct answer: B**

**CloudTrail** records who did which API action to AWS, and when — the basis for auditing user and service activity. CloudWatch is for performance metrics; Config tracks resource configuration changes and compliance; GuardDuty does threat detection — none is the first choice for "who called which API".

</Quiz>

<Quiz
  qnum={8}
  total={20}
  question="A company manages dozens of accounts with AWS Organizations. The security team requires that even an IAM administrator in a given account can never enable a certain high-risk service, and the rule must apply to many accounts at once. Which approach is best?"
  options={[
    'Add a Deny policy to every user in every account individually',
    'Configure a Service Control Policy (SCP) in AWS Organizations to deny the service',
    'Set a permissions boundary on each role',
    'Set the budget limit for that service to 0 USD',
  ]}
  answer={1}>

**Correct answer: B**

An **SCP** sets a permissions ceiling at the organization/OU level that covers the whole account and cannot be bypassed even by administrators inside it — ideal for org-wide enforcement. A is per-user and easy to miss for new users; a permissions boundary applies to a single identity, not the whole account; a budget limit is cost control, not a security control.

</Quiz>

<Quiz
  qnum={9}
  total={20}
  question="An EC2 instance in a private subnet needs to access S3, with the requirement that traffic does not traverse the internet and cost is as low as possible. Which approach is best?"
  options={[
    'Set up a NAT Gateway so the instance reaches the internet and then S3',
    'Create an S3 Gateway endpoint (VPC Gateway Endpoint)',
    'Move the instance to a public subnet and assign a public IP',
    'Make the S3 bucket publicly accessible for direct download',
  ]}
  answer={1}>

**Correct answer: B**

An **S3 Gateway endpoint** keeps traffic entirely on the AWS private network (never the public internet) and is **free**, saving NAT hourly and data-processing charges. A pays for NAT and still routes via the public internet; C and D expose resources to the internet, violating the "no internet" requirement.

</Quiz>

<Quiz
  qnum={10}
  total={20}
  question="A bucket stores customer PII. The company requires that it can never be accidentally made public and that data at rest is encrypted with auditable key usage. Which TWO measures most directly achieve this? (Choose TWO)"
  options={[
    'Enable Block Public Access on the bucket',
    'Enable default encryption on the bucket using SSE-KMS (a customer managed key)',
    'Rename the bucket to something hard to guess',
    'Change the object file extensions to an uncommon format',
    'Only open public access to the bucket during business hours',
  ]}
  answer={[0, 1]}>

**Correct answer: A, B**

**Block Public Access (A)** is a master switch that overrides any policy or ACL accidentally set to public, directly preventing public exposure; **SSE-KMS default encryption (B)** encrypts data at rest and lets you audit key usage via CloudTrail, meeting "encrypted and auditable". C and D are security through obscurity, not real controls; E violates the requirement the moment public access is opened.

</Quiz>

<Quiz
  qnum={11}
  total={20}
  question="A public website faces two kinds of attack: malicious HTTP requests carrying SQL injection/XSS, and large volumetric DDoS floods. The company wants to defend before traffic reaches the application. Which TWO services fit best together? (Choose TWO)"
  options={[
    'Deploy AWS WAF with managed rules to filter Layer 7 malicious requests such as SQL injection/XSS',
    'Enable AWS Shield (Advanced) to protect against large volumetric DDoS attacks',
    'Use only a Security Group to filter malicious strings by request content',
    'Use a NACL to set Deny rules based on the HTTP request payload',
    'Move the service port from 443 to a non-standard port to evade attacks',
  ]}
  answer={[0, 1]}>

**Correct answer: A, B**

**WAF (A)** inspects HTTP request content and blocks Layer 7 attacks like SQL injection and XSS; **Shield (B)** specifically defends against volumetric DDoS — together they cover both threats in the stem. C and D are wrong because SG/NACL only see IP and port, not request content; E (changing the port) is security through obscurity, not a real control.

</Quiz>

<Quiz
  qnum={12}
  total={20}
  question="An application in a private subnet needs private access to both Amazon S3 and Amazon SQS, with the requirement that neither path traverses the internet. Which TWO settings are correct and most appropriate? (Choose TWO)"
  options={[
    'Create a Gateway endpoint (VPC Gateway Endpoint) for S3',
    'Create an Interface endpoint (PrivateLink) for SQS',
    'Create Interface endpoints for both S3 and SQS, because Gateway endpoints no longer support S3',
    'Set up a NAT Gateway so both reach the internet and then the services',
    'Attach an Internet Gateway (IGW) for both and assign public IPs',
  ]}
  answer={[0, 1]}>

**Correct answer: A, B**

**Gateway endpoints only support S3 and DynamoDB**, so S3 uses a **Gateway endpoint (A)** (free); services like SQS require an **Interface endpoint / PrivateLink (B)**, which places a private-IP network interface in the subnet. C is false (S3 still supports Gateway endpoints, usually the free first choice); NAT and IGW are both for internet-bound traffic, violating the "no internet" requirement.

</Quiz>

<Quiz
  qnum={13}
  total={20}
  question="A company has a production account A and a data account B. An EC2 application in account A must read an S3 bucket in account B, and the company requires that no long-term keys are shared or stored. Which approach is MOST appropriate?"
  options={[
    'Create an IAM Role in account B that trusts account A and grants S3 read, and have the EC2 in account A assume it via STS to get temporary credentials',
    'Create an IAM user in account B and hand its Access Key to account A to store long-term',
    'Make the S3 bucket in account B publicly readable so account A can download directly',
    'Share a single Root user Access Key between the two accounts',
  ]}
  answer={0}>

**Correct answer: A**

The standard cross-account pattern: the **resource account (B) creates an IAM Role that trusts the source account (A)**, and the source uses **STS AssumeRole** for temporary credentials — no long-term keys anywhere. B hands over long-term keys and is hard to rotate; C exposes PII publicly; D sharing a Root key is the worst.

</Quiz>

<Quiz
  qnum={14}
  total={20}
  question="A company wants a second layer of verification beyond the password when users sign in to the console and when they perform high-risk actions such as deleting a database, to reduce the damage from leaked credentials. Which approach is best?"
  options={[
    'Enable MFA (multi-factor authentication) for users and require MFA for high-risk actions via an IAM policy condition',
    'Force every user to change the password once a day',
    'Shorten the maximum password length from 128 to 8 characters so users can remember it',
    'Use the Root account to perform all high-risk actions centrally',
  ]}
  answer={0}>

**Correct answer: A**

**MFA** adds a "something you have" factor on top of the password, so even a leaked password is blocked; then a condition (`aws:MultiFactorAuthPresent`) requiring MFA for high-risk actions fits best. B (daily password changes) has limited effect and adds burden; C shortening passwords reduces security; D using Root is more dangerous.

</Quiz>

<Quiz
  qnum={15}
  total={20}
  question="An application must let signed-in users download a file from a private S3 bucket for a limited time; the bucket must not be public, and the company does not want to create an IAM user per downloader. Which approach is best?"
  options={[
    'Generate an S3 presigned URL with a short expiry and give it to the user',
    'Make the whole bucket publicly readable so users can download directly',
    'Create an IAM user and Access Key for each downloader',
    'Copy the file to an EC2 instance and serve it publicly over HTTP',
  ]}
  answer={0}>

**Correct answer: A**

A **presigned URL** is issued temporarily with existing credentials and carries an expiry, after which it stops working; the bucket stays private and you avoid creating an account per person. B goes public and violates the requirement; C creating an IAM user for a temporary download is excessive and hard to clean up; D is a detour that still exposes the data.

</Quiz>

<Quiz
  qnum={16}
  total={20}
  question="Developers on a team can create their own IAM roles and users, but the security team requires that no matter how they configure them, the effective permissions of any identity they create cannot exceed a predefined ceiling. Which mechanism fits best?"
  options={[
    'Attach a permissions boundary when the developers create the roles and users to cap their maximum permissions',
    'Have the security team manually review the permissions of each new role one by one',
    'Use an SCP to disable the IAM service for the whole account',
    'Make all developers read-only across the board',
  ]}
  answer={0}>

**Correct answer: A**

A **permissions boundary** sets a permissions ceiling for a single identity: even if a broader policy is attached, the effective permissions are the intersection and never exceed the boundary — ideal for delegating identity creation while capping the maximum. B (manual review) is unreliable; C disabling IAM stops their work, and an SCP is account-level rather than a per-identity ceiling; D is over-restrictive.

</Quiz>

<Quiz
  qnum={17}
  total={20}
  question="A company wants to continuously detect whether unencrypted EBS volumes or security groups that open port 22 to the world appear in its environment, and be able to see and be notified when something is non-compliant. Which service fits best?"
  options={[
    'AWS Config with managed rules continuously evaluating resource configuration compliance',
    'Only CloudTrail to look up API call history',
    'GuardDuty to detect malicious traffic',
    'Have engineers do a manual configuration inventory once a month',
  ]}
  answer={0}>

**Correct answer: A**

**AWS Config** continuously records resource configuration and evaluates compliance with rules; managed rules (such as `encrypted-volumes`, `restricted-ssh`) detect exactly these configuration issues and can trigger notifications. CloudTrail records API activity, not configuration compliance; GuardDuty watches threat traffic; a manual inventory is not "continuous" detection.

</Quiz>

<Quiz
  qnum={18}
  total={20}
  question="A website is served to the public through an ALB and needs an HTTPS certificate; the company wants the certificate to renew automatically before expiry with no manual maintenance. Which approach is best?"
  options={[
    'Use AWS Certificate Manager (ACM) to issue the certificate, attach it to the ALB, and let ACM auto-renew it',
    'Buy a certificate from an external CA and manually renew and upload it every year',
    'Turn off HTTPS and use HTTP to avoid maintaining certificates',
    'Embed the private key in the application code and deploy it together',
  ]}
  answer={0}>

**Correct answer: A**

A public certificate issued by **ACM** and attached to an ALB/CloudFront can **auto-renew** with zero maintenance and no cost. B (manual renewal) is easy to forget and causes outages from expired certificates; C turning off HTTPS sacrifices encryption in transit; D embedding the private key in code is highly insecure.

</Quiz>

<Quiz
  qnum={19}
  total={20}
  question="A company wants a continuous security detection capability that both (1) automatically detects threat behavior such as crypto mining and anomalous API calls, and (2) continuously tracks resource configuration changes and compliance. Which TWO services fit best together? (Choose TWO)"
  options={[
    'Amazon GuardDuty: automatically analyze traffic and events to detect threat behavior',
    'AWS Config: continuously record configuration changes and evaluate compliance',
    'Use only a Security Group to block all outbound connections',
    'Use Parameter Store to hold the detection results',
    'Turn off all logging to save cost',
  ]}
  answer={[0, 1]}>

**Correct answer: A, B**

**GuardDuty (threat detection)** and **Config (configuration compliance)** cover the "threat behavior" and "configuration change / compliance" needs respectively. C blocks everything and breaks the service while doing no detection; D Parameter Store is for storing parameters; E turning off logging is the opposite of the requirement.

</Quiz>

<Quiz
  qnum={20}
  total={20}
  question="Which TWO statements about KMS envelope encryption are correct? (Choose TWO)"
  options={[
    'A data key encrypts the bulk data, and the KMS master key encrypts that data key, which is stored alongside the ciphertext',
    'After use, the plaintext data key is cleared from memory and is not stored long-term with the data',
    'You can send an entire large file directly to KMS to encrypt with the master key, with no size limit',
    'The key material of the master key (CMK) is downloaded to the client along with the ciphertext',
    'Envelope encryption cannot be audited because the process does not go through KMS',
  ]}
  answer={[0, 1]}>

**Correct answer: A, B**

The core of envelope encryption: **a data key encrypts the data and the master key encrypts the data key (A)**, and the **plaintext data key is discarded after use and not stored long-term (B)**. C is wrong: direct KMS encryption has a 4KB limit, which is precisely why large data needs envelope encryption; D is wrong: the key material of a CMK never leaves KMS; E is wrong: every call to a CMK can be audited via CloudTrail.

</Quiz>

:::note
This domain's question bank will keep expanding after launch. Practicing alongside the "Hands-on" section of each topic page works best.
:::
