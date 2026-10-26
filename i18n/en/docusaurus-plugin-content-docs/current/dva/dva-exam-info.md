---
sidebar_position: 1
title: DVA Exam Info & Study Plan
---

# DVA Exam Info & Study Plan (DVA-C03)

The **AWS Certified Developer – Associate** validates your ability to develop, test, deploy, and debug cloud applications using AWS services. It is one of the most popular Associate certs after SAA, and the two overlap heavily — if you just passed or are studying for SAA, DVA is a natural next step.

<Scenario title="Who is this for">

**Developers** who write code and wire services together with the AWS SDKs; or people who already have the architecture concepts (e.g. passed SAA) and want to strengthen the "actually build the app, deploy it, and debug it" side. AWS suggests about one year of AWS development experience, but with an SAA foundation plus this site you can prepare from scratch.

</Scenario>

## Why prepare for C03 (not C02)

AWS updated the exam in 2026: **the last day to take DVA-C02 is 2026-11-30, and DVA-C03 goes live on 2026-12-01.** Anyone starting now will almost certainly sit C03, so this site targets C03 directly.

The biggest change in C03 is that **AI-assisted development is built in across all domains**: using AI tools (such as Amazon Q Developer) to help generate and review code, automate testing and regression testing, support CI/CD with automated deployment approvals, analyze errors and suggest fixes, and recommend performance optimizations.

:::tip[💡 How this site handles it]
Core service knowledge (Lambda, API Gateway, DynamoDB, IAM, and so on) is stable between C02 and C03, so this site builds on that backbone and weaves in the C03 AI-assisted development focus within each domain.
:::

## Exam basics

| Item | Details |
| --- | --- |
| Exam code | DVA-C03 |
| Level | Associate |
| Questions | 65 (multiple choice + multiple response) |
| Time | 130 minutes |
| Passing score | 720 / 1000 (scaled) |
| Cost | 150 USD |
| Languages | Several, including Traditional Chinese; the UI can switch between languages |
| Delivery | Test center (Pearson VUE) or online proctored (OnVUE) |

## The four exam domains (weights)

| Domain | Weight | Focus (covered here) |
| --- | --- | --- |
| **1. Development with AWS Services** | 30% | Lambda, API Gateway, DynamoDB, S3/SDK, event-driven and decoupling, AI-assisted code generation |
| **2. Security** | 26% | IAM, Cognito user/identity pools, KMS encryption, Secrets Manager/Parameter Store, signing requests |
| **3. Testing and Deployment** | 22% | CodePipeline/CodeBuild/CodeDeploy, CloudFormation/SAM/CDK, container deployment, deployment strategies, AI-assisted testing |
| **4. Troubleshooting and Optimization** | 22% | CloudWatch, X-Ray tracing, retries and exponential backoff, performance optimization, AI-assisted debugging |

:::info[🔍 How it differs from SAA]
**SAA asks "how do you design the architecture" (selection, high availability, cost); DVA asks "how do you build the app, deploy it, and debug it when it breaks".** For the same Lambda, SAA asks whether it fits an architecture, while DVA asks about concurrency, versions/aliases, environment variables, cold starts, and error retries — the **development details**.
:::

## Study map: how this site maps to DVA

1. Read the **four domain sections** article by article (focused on development detail and hands-on).
2. After each domain, do its **flashcards** and **practice questions**.
3. When done, take the **full mock exam** to check yourself, then go back and patch weak spots.
4. For services shared with SAA (IAM, S3, DynamoDB, Lambda), you can review the basics in the [SAA section](/saa/exam-info); here the focus is the **developer view** of those services.

:::warning[🚑 Exam codes change]
This page reflects the C03 information published in 2026 (the full C03 task statements are released when registration opens on 2026-10-27). Always confirm on the [official AWS Developer certification page](https://aws.amazon.com/certification/certified-developer-associate/) before registering.
:::

<Refs title="📚 Official docs & further reading">

- [AWS Certified Developer – Associate (official page)](https://aws.amazon.com/certification/certified-developer-associate/)
- [AWS Certification overview](https://aws.amazon.com/certification/)

</Refs>
