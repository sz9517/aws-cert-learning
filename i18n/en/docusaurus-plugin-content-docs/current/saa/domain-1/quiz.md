---
sidebar_position: 8
title: Practice Questions
---

# Domain 1 Practice Questions (in the style of the official exam)

Select your answer first, then click "**Show answer & explanation**". Questions cover all Domain 1 topics, align with the official exam domains and style, and are **original** content.

<Quiz
  qnum={1}
  total={12}
  question="Your application runs on EC2 and needs to read files from S3. Which approach best follows AWS security best practices?"
  options={[
    'Hard-code the Access Key and Secret Key in the code',
    'Store the keys in the EC2 environment variables',
    'Create an IAM Role and assign it to the EC2 instance',
    'Use the Root user\'s keys',
  ]}
  answer={2}>

**Correct: C**

EC2 should obtain temporary, auto-rotated credentials via an **IAM Role** with no stored long-term keys — the lowest risk. A, B, and D expose long-term keys; D uses Root keys, badly violating least privilege.

</Quiz>

<Quiz
  qnum={2}
  total={12}
  question="The 10-member Engineering team needs the same permissions, and new hires should inherit them quickly. The most efficient approach is?"
  options={[
    'Attach an identical Policy to each person individually',
    'Create an IAM Group, attach the Policy to the Group, then add members',
    'Share one IAM User account and password',
    'Give everyone Root permissions',
  ]}
  answer={1}>

**Correct: B**

Attach permissions to an **IAM Group**; members get them on joining. A is error-prone to maintain one by one; C can't be audited; D badly violates least privilege.

</Quiz>

<Quiz
  qnum={3}
  total={12}
  question="A Policy allows an action, but the security team must forcibly block certain high-risk actions. What is IAM's evaluation logic?"
  options={[
    'Allow always wins over Deny',
    'An explicit Deny always wins over any Allow',
    'Whichever Policy was created later wins',
    'When they conflict, both are ignored',
  ]}
  answer={1}>

**Correct: B**

IAM rule: **deny by default → allow only with an Allow → an explicit Deny always blocks it**. Deny is always the last line of defense, winning over any Allow.

</Quiz>

<Quiz
  qnum={4}
  total={12}
  question="A company must control encryption-key permissions itself, set a custom rotation schedule, and audit who used the key. Which KMS key type?"
  options={[
    'AWS owned key',
    'AWS managed key',
    'Customer managed key (CMK)',
    'No key needed',
  ]}
  answer={2}>

**Correct: C**

Only a **Customer managed key (CMK)** lets you customize the key policy, control rotation, and audit usage via CloudTrail. AWS owned/managed keys don't allow these customizations.

</Quiz>

<Quiz
  qnum={5}
  total={12}
  question="You added a NACL rule allowing inbound HTTP(80), but users still can't reach the site. The most likely cause?"
  options={[
    'NACLs are stateless; you haven\'t set an outbound rule allowing the response traffic',
    'NACLs don\'t support HTTP',
    'You must use the Root account',
    'NACLs only work on EC2',
  ]}
  answer={0}>

**Correct: A**

**NACLs are stateless** — inbound and the outbound response must be set separately. You need to allow outbound (usually ephemeral ports 1024-65535 for responses). A Security Group wouldn't need this since it's stateful and allows responses automatically.

</Quiz>

<Quiz
  qnum={6}
  total={12}
  question="You must ensure an S3 bucket holding customer PII is 'never' accidentally made public. The most effective approach?"
  options={[
    'Rename the bucket to something hard to guess',
    'Enable Block Public Access on the bucket',
    'Only allow access during the day',
    'Change the file extensions',
  ]}
  answer={1}>

**Correct: B**

**Block Public Access** is the master switch that overrides any bucket policy or ACL accidentally set to public — the most direct, effective way to prevent S3 leaks. Renaming or changing extensions are not security mechanisms.

</Quiz>

<Quiz
  qnum={7}
  total={12}
  question="An application needs an 'automatically, periodically rotated' password when connecting to RDS. The most suitable service is?"
  options={[
    'Put the password in an environment variable',
    'Secrets Manager',
    'Parameter Store standard parameter',
    'Write it in a code comment',
  ]}
  answer={1}>

**Correct: B**

**Secrets Manager** has built-in **auto-rotation** integrated with RDS. Parameter Store has no built-in rotation (you'd write your own Lambda); env vars and code are not secure secrets management.

</Quiz>

<Quiz
  qnum={8}
  total={12}
  question="During an audit you need to find 'which user deleted a resource and when'. Which service should you check?"
  options={[
    'CloudWatch',
    'CloudTrail',
    'AWS Config compliance score',
    'GuardDuty threat list',
  ]}
  answer={1}>

**Correct: B**

**CloudTrail** records "who did what API operation to AWS, and when" — the basis for auditing user behavior. CloudWatch is performance monitoring; Config tracks config changes & compliance; GuardDuty does threat detection.

</Quiz>

<Quiz
  qnum={9}
  total={12}
  question="An EC2 in a private subnet needs to access S3, the traffic must not go over the internet, and cost should be as low as possible. The best approach?"
  options={[
    'Stand up a NAT Gateway so it reaches the internet and then S3',
    'Create a Gateway endpoint (VPC Endpoint) for S3',
    'Move the EC2 to a public subnet and give it a public IP',
    'Make the S3 bucket publicly accessible',
  ]}
  answer={1}>

**Correct: B**

An **S3 Gateway endpoint** keeps traffic entirely inside the AWS network — never on the public internet — and is **completely free**, even saving the NAT data charges. A pays for NAT and detours over the internet; C and D expose resources to the internet, violating the security requirement.

</Quiz>

<Quiz
  qnum={10}
  total={12}
  question="You need private connectivity (no internet) to an application running on SQS. Which VPC endpoint type should you use?"
  options={[
    'Gateway endpoint',
    'Interface endpoint (PrivateLink)',
    'NAT Gateway',
    'Internet Gateway (IGW)',
  ]}
  answer={1}>

**Correct: B**

**Gateway endpoints only support S3 and DynamoDB**; a service like SQS needs an **Interface endpoint (PrivateLink)**, which places a private-IP network interface in the subnet. NAT and IGW are both for outbound internet access and don't meet the "private" requirement.

</Quiz>

<Quiz
  qnum={11}
  total={12}
  question="Your site keeps receiving requests carrying SQL injection, and you want to filter by request content before it reaches the app. The most suitable service?"
  options={[
    'Security Group',
    'AWS Shield Standard',
    'AWS WAF',
    'NACL',
  ]}
  answer={2}>

**Correct: C**

**WAF** specifically inspects HTTP request **content**, blocking layer-7 attacks like SQL injection, XSS, and rate limiting. SG/NACL only look at IP and port and can't read request content; Shield defends against DDoS, not malicious request content.

</Quiz>

<Quiz
  qnum={12}
  total={12}
  question="Security requires that even an account's IAM admin can never enable a certain high-risk service. What enforces this across multiple accounts?"
  options={[
    'Add a Deny policy on every user',
    'Set an SCP (Service Control Policy) in AWS Organizations',
    'Use a permission boundary on each role',
    'Set the service\'s cost limit to 0',
  ]}
  answer={1}>

**Correct: B**

An **SCP** sets a permissions ceiling at the organization level, covering the whole account — even admins are blocked — making it the right tool to forcibly disable something across accounts. A is error-prone and new users may be missed; a permission boundary targets a single principal, not the whole account; a cost limit isn't a security control.

</Quiz>

:::note
After launch, this domain's question bank will keep expanding. For best results, practice alongside each topic page's "Hands-on" section.
:::
