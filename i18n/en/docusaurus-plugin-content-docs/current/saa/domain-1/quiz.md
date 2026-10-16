---
sidebar_position: 8
title: Practice Questions
---

# Domain 1 Practice Questions (in the style of the official exam)

Select your answer first, then click "**Show answer & explanation**". Questions cover all Domain 1 topics, align with the official exam domains and style, and are **original** content.

<Quiz
  qnum={1}
  total={8}
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
  total={8}
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
  total={8}
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
  total={8}
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
  total={8}
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
  total={8}
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
  total={8}
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
  total={8}
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

:::note
After launch, this domain's question bank will keep expanding. For best results, practice alongside each topic page's "Hands-on" section.
:::
