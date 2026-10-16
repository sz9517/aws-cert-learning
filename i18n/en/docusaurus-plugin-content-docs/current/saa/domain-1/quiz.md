---
sidebar_position: 4
title: Practice Questions
---

# Domain 1 Practice Questions (in the style of the official exam)

Select your answer first, then click "**Show answer & explanation**". Questions align with the official exam domains and style, and are **original** content.

<Quiz
  qnum={1}
  total={3}
  question="Your application runs on EC2 and needs to read files from S3. Which approach best follows AWS security best practices?"
  options={[
    'Hard-code the Access Key and Secret Key directly in the code',
    'Store the keys in the EC2 environment variables',
    'Create an IAM Role and assign it to the EC2 instance',
    'Use the Root user\'s keys',
  ]}
  answer={2}>

**Correct answer: C**

EC2 should obtain temporary, automatically-rotated credentials via an **IAM Role**, with no need to store any long-term keys anywhere — the lowest risk.

A, B, and D all expose long-term keys in places that could leak; in particular, D uses Root keys, violating least privilege, which is the most serious mistake.

</Quiz>

<Quiz
  qnum={2}
  total={3}
  question="A company wants all 10 members of the Engineering team to have the same AWS permissions, and wants new hires to inherit them quickly. What's the most efficient way to manage this?"
  options={[
    'Attach an identical Policy to each person individually',
    'Create an IAM Group, attach the Policy to the Group, then add members',
    'Share one IAM User account and password',
    'Give everyone Root permissions',
  ]}
  answer={1}>

**Correct answer: B**

Attach permissions to an **IAM Group**; members get them automatically on joining — fast onboarding and consistent, easy-to-maintain permissions.

A works but must be maintained one by one and is error-prone; C shares an account so you can't audit who did what (a security no-no); D badly violates least privilege.

</Quiz>

<Quiz
  qnum={3}
  total={3}
  question="The security team requires that even if a Policy allows an action, certain high-risk actions must be forcibly blocked. What is IAM's permission evaluation logic?"
  options={[
    'Allow always wins over Deny',
    'An explicit Deny always wins over any Allow',
    'Whichever Policy was created later wins',
    'When they conflict, both are ignored',
  ]}
  answer={1}>

**Correct answer: B**

IAM evaluation rule: **deny everything by default → allow only if there's an Allow → but any explicit Deny always blocks it**. So Deny is always the last line of defense, winning over any Allow. This is a very high-frequency exam point!

</Quiz>

:::note
After launch, this domain's question bank will expand to around 15–30 questions, covering IAM, encryption, network security, and more.
:::
