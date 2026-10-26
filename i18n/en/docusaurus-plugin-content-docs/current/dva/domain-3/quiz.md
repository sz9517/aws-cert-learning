---
sidebar_position: 7
title: Domain 3 Quiz
---

# Domain 3 Practice Questions (official-exam style)

Pick your answer first, then click **Show answer & explanation**. This page mirrors the DVA-C03 exam style: **scenario-based stems from a developer deployment point of view**, testing the development details and trade-offs of **testing and deployment** — CI/CD (CodePipeline stages, the CodeBuild buildspec, the CodeDeploy appspec, build permissions, where to put secrets), IaC (CloudFormation change sets and DeletionPolicy, stack updates, when to use SAM vs CDK), deployment strategies (how to choose blue/green, canary, rolling, in-place, Lambda alias weighting, fast rollback), containers (ECR image tags, task definitions, Fargate vs EC2, task role vs execution role), and testing (unit vs integration, mocks, AI-assisted testing still needs human verification). Options are all plausible AWS approaches (distractors are never obviously wrong), and some questions use **qualifiers** like "MOST aligned with best practice / MOST secure / BEST for fast rollback" to force comparison. Includes both **single-answer** and **multiple-response (Choose TWO)** questions. These are **original** content (not real exam questions).

<Quiz
  qnum={1}
  total={20}
  question="A team wants a CodePipeline that automatically builds and then deploys to production whenever code is pushed to CodeCommit. Which statement about the core concept of CodePipeline is correct?"
  options={[
    'CodePipeline compiles the code itself and does not need CodeBuild',
    'CodePipeline splits the release process into stages, each stage containing actions, and can chain services for source, build, and deploy',
    'CodePipeline can only deploy to EC2 and does not support Lambda or ECS',
    'CodePipeline always requires a manual approval at every stage before it moves on',
  ]}
  answer={1}>

**Correct answer: B**

CodePipeline is an **orchestration** tool that splits the release process into a series of **stages**, each holding **actions** that chain services for source (CodeCommit/S3/GitHub), build (CodeBuild), test, and deploy (CodeDeploy/ECS/Lambda/CloudFormation). A is wrong because compilation is done by CodeBuild and CodePipeline only wires things together; C is wrong because it supports EC2, Lambda, ECS, S3, and more; D is wrong because manual approval is an optional action, not a requirement.

</Quiz>

<Quiz
  qnum={2}
  total={20}
  question="A developer wants CodeBuild to build a Node.js project: install dependencies, run tests, then package the output. Where should these steps and commands be defined?"
  options={[
    'In the CodePipeline settings, which CodeBuild reads automatically',
    'In buildspec.yml at the project root, using phases (install/pre_build/build/post_build) and artifacts to define commands and outputs',
    'In appspec.yml',
    'Nowhere, because CodeBuild auto-detects and builds any language',
  ]}
  answer={1}>

**Correct answer: B**

The build commands for CodeBuild are defined in **buildspec.yml** (by default at the project root): use `phases` to split commands into `install`, `pre_build`, `build`, and `post_build`, and use `artifacts` to specify the build output. A is wrong because build details belong in the buildspec, not the pipeline settings; C is wrong because `appspec.yml` is the **CodeDeploy** deployment spec, not CodeBuild; D is wrong because CodeBuild needs you to specify the build steps explicitly.

</Quiz>

<Quiz
  qnum={3}
  total={20}
  question="A CodeBuild project needs a database password to run integration tests against a database during the build. The team wants the password to never appear in buildspec.yml or in the code. Which approach is MOST aligned with best practice?"
  options={[
    'Put the password in plaintext as an environment variable in buildspec.yml',
    'Store the password in Secrets Manager (or an SSM Parameter Store SecureString) and reference it in the buildspec via secrets-manager/parameter-store, granting the build service role read access to it',
    'Hard-code the password in the test code and commit it',
    'Put the password in the CodeBuild project description field',
  ]}
  answer={1}>

**Correct answer: B**

Secrets should live in **Secrets Manager** or an **SSM Parameter Store SecureString**, referenced in the buildspec `env` block via `secrets-manager` or `parameter-store` so they are injected only at build time, and the CodeBuild **service role** must be granted read access to that secret. A, C, and D all expose the password in plaintext in the buildspec, code, or a settings field, which leaks it and violates secret-protection principles.

</Quiz>

<Quiz
  qnum={4}
  total={20}
  question="A team uses CodeDeploy to deploy an application to a set of EC2 instances and needs to define what scripts run at each deployment lifecycle stage (for example stop the service, install files, start the service, validate). What is this specification file?"
  options={[
    'buildspec.yml',
    'appspec.yml (specifies file mappings and the scripts to run at each lifecycle hook)',
    'template.yaml',
    'Dockerfile',
  ]}
  answer={1}>

**Correct answer: B**

CodeDeploy reads **appspec.yml (or appspec.json)**: for EC2/On-premises deployments it defines where files are copied and which scripts run at each **lifecycle event hook** (such as `BeforeInstall`, `AfterInstall`, `ApplicationStart`, `ValidateService`). A buildspec is for CodeBuild; C template.yaml is for CloudFormation/SAM; D Dockerfile is for building a container image.

</Quiz>

<Quiz
  qnum={5}
  total={20}
  question="Regarding the appspec.yml lifecycle hooks for a CodeDeploy EC2/On-premises deployment, which TWO statements are correct? (Choose TWO)"
  options={[
    'hooks can specify custom scripts to run at events such as BeforeInstall, AfterInstall, ApplicationStart, and ValidateService',
    'the files section of appspec.yml specifies the destination path on the instance that source files are copied to',
    'appspec.yml can only be used to deploy to Lambda and never to EC2',
    'scripts in hooks must be written in Python and no other language works',
    'appspec.yml automatically compiles your source code',
  ]}
  answer={[0, 1]}>

**Correct answer: A, B**

For EC2/On-premises, the **`hooks`** in appspec.yml can attach custom scripts to each lifecycle event (`BeforeInstall`, `AfterInstall`, `ApplicationStart`, `ValidateService`, and so on); the **`files`** section specifies source and destination paths, deciding where files are copied on the instance. C is wrong because EC2/On-premises is one of the primary uses of appspec (Lambda/ECS deployments use a different appspec format but are also supported); D is wrong because the script language is not limited to Python; E is wrong because compilation happens in the build stage (CodeBuild), and appspec does not compile.

</Quiz>

<Quiz
  qnum={6}
  total={20}
  question="A developer wants to update a production CloudFormation stack but worries that some changes could replace or disrupt resources. They want to see exactly what this update will do to which resources, confirm it, and only then execute. What is the best approach?"
  options={[
    'Just run update-stack and roll back if there is a problem',
    'Create a change set first to preview which resources will be added/modified/deleted and whether any will be replaced, then execute the change set after confirming',
    'Delete the whole stack and recreate it',
    'Manually change each resource one by one in the console',
  ]}
  answer={1}>

**Correct answer: B**

A **change set** lets you **preview**, before actually applying, which resources this update will add/modify/delete and whether it will cause **resource replacement**; once you are satisfied, you execute the change set. A updates directly without the preview and is risky; C deletes and recreates, causing unnecessary downtime and risk of data loss; D changing resources manually causes the stack to drift from the actual state.

</Quiz>

<Quiz
  qnum={7}
  total={20}
  question="A CloudFormation stack contains an S3 bucket holding important data and an RDS database. The team worries that if someone accidentally deletes the stack, the data goes with it. To keep these resources when the stack is deleted, what should they configure?"
  options={[
    'Move the resources out of the stack and manage them manually',
    'Set DeletionPolicy: Retain on these resources so they are kept when the stack is deleted',
    'Make the stack read-only',
    'Nothing, because CloudFormation does not delete resources by default',
  ]}
  answer={1}>

**Correct answer: B**

Set **`DeletionPolicy: Retain`** on the resource so that when the stack is deleted, CloudFormation **keeps** that resource instead of deleting it (you can also use `Snapshot` to take a snapshot before deletion for resources such as RDS that support it). A loses the benefits of IaC management; C there is no read-only stack setting in CloudFormation; D is wrong because the default behavior is to delete the resources it created along with the stack, which is why DeletionPolicy is needed to change that.

</Quiz>

<Quiz
  qnum={8}
  total={20}
  question="A developer project is a serverless architecture (Lambda + API Gateway + DynamoDB) and wants to define these resources with a more concise syntax than raw CloudFormation while also testing locally. Which tool is most suitable?"
  options={[
    'AWS SAM (Serverless Application Model), which defines serverless resources with concise syntax and can test locally with sam local',
    'Hand-write full raw CloudFormation with no helper at all',
    'Terraform Enterprise',
    'Only create everything manually in the console',
  ]}
  answer={0}>

**Correct answer: A**

**AWS SAM** is an extension of CloudFormation that provides a **concise syntax** (such as `AWS::Serverless::*`) dedicated to describing Lambda, API Gateway, DynamoDB, and other serverless resources, expanding to standard CloudFormation on deploy; it also lets you use `sam local` to invoke functions or emulate an API locally for testing. B raw CloudFormation for serverless is verbose; C Terraform is a third-party tool while the question asks for a native AWS serverless option; D manual creation cannot be reproduced or version-controlled.

</Quiz>

<Quiz
  qnum={9}
  total={20}
  question="A team member is comfortable with TypeScript and wants to describe infrastructure using a general programming language (not YAML/JSON), gaining type checking and programming constructs like loops and conditions. Which tool is most suitable?"
  options={[
    'Hand-write CloudFormation templates only in YAML',
    'AWS CDK (Cloud Development Kit), which defines infrastructure in a programming language such as TypeScript or Python and synthesizes to CloudFormation',
    'Write the infrastructure in a Word document',
    'Use a CodeBuild buildspec as the infrastructure definition',
  ]}
  answer={1}>

**Correct answer: B**

**AWS CDK** lets you define infrastructure in a **general programming language** such as **TypeScript, Python, or Java**, gaining type checking, loops, conditions, and reuse; running `cdk synth` **synthesizes** a standard CloudFormation template that is then deployed. A pure YAML lacks the abstraction and reuse of a programming language (which is exactly what CDK offers); C and D are not IaC tools. When to use CDK: when the team prefers a programming language and needs high reuse and abstraction; when a declarative plain-text approach is preferred, CloudFormation/SAM is still fine.

</Quiz>

<Quiz
  qnum={10}
  total={20}
  question="A production service is releasing a new version, and the company requires that if the new version has a problem it must be able to switch back to the old version within seconds to minimize impact, while accepting the cost of briefly maintaining two environments. Which deployment strategy is BEST for fast rollback?"
  options={[
    'In-place deployment, overwriting the new version directly on existing instances',
    'Blue/green deployment: build a separate green environment with the new version, verify it, then shift traffic over; if there is a problem, just shift traffic back to the blue environment for a fast rollback',
    'Delete the old version first and then install the new version',
    'Manually log in to each instance and update it one by one',
  ]}
  answer={1}>

**Correct answer: B**

**Blue/green deployment** builds a complete separate green environment with the new version, verifies it, then shifts traffic from blue to green; if the new version has a problem, you simply **shift traffic back to the blue environment** for a near-instant **fast rollback** because the old version is still fully intact. The cost is maintaining two environments during deployment. A in-place overwrites directly, so rollback requires redeploying the old version and is slower; C deleting then installing leaves no fallback; D manual updates are slow and error-prone.

</Quiz>

<Quiz
  qnum={11}
  total={20}
  question="A team wants to release a new version to only a small portion of production traffic (for example 10%) first, observe metrics, and only then gradually scale up to 100% to reduce the risk of a full outage. Regarding this canary / linear deployment strategy, which TWO statements are correct? (Choose TWO)"
  options={[
    'Canary routes a small percentage of traffic to the new version first, and after metrics look healthy it shifts the remaining traffic over',
    'Linear deployment increases a fixed percentage of traffic at fixed intervals (for example +10% every 10 minutes)',
    'This strategy shifts 100% of traffic to the new version at once, without any percentage split',
    'Once the new version is introduced it is impossible to roll back to the old version',
    'This strategy only works in a physical data center and is not supported in the cloud at all',
  ]}
  answer={[0, 1]}>

**Correct answer: A, B**

**Canary** routes a small percentage of traffic to the new version first, and after metrics look healthy for a while it shifts the remaining traffic over; **linear** increases a fixed percentage at fixed intervals (for example +10% every 10 minutes). Both reduce risk by validating with a small amount before scaling up. C describes an all-at-once switch, which carries the highest risk and is the opposite of canary; D is wrong because when a problem is observed you can stop scaling up and shift traffic back to the old version; E is wrong because AWS (for example CodeDeploy canary for Lambda/ECS) natively supports this strategy.

</Quiz>

<Quiz
  qnum={12}
  total={20}
  question="A Lambda function is releasing a new version, and the developer wants to use an alias to route 95% of traffic to the old version and 5% to the new version for validation, then adjust the ratio once confirmed. Which Lambda mechanism does this use?"
  options={[
    'Edit the $LATEST code directly, with no concept of versions',
    'Publish a version and point an alias at it, using the weighted routing (routing configuration) of the alias to split traffic by ratio across two versions',
    'Create a separate function for each ratio',
    'Lambda does not support traffic splitting',
  ]}
  answer={1}>

**Correct answer: B**

Lambda can **publish immutable versions** and use an **alias** pointing to a version; the alias supports **weighted routing (routing configuration)**, letting you split traffic by ratio (for example 95% to version 1, 5% to version 2) across **two versions**, which is exactly the canary validation approach; after validation you adjust the weight or point to the new version. A editing `$LATEST` directly cannot split traffic or roll back; C creating multiple functions adds management overhead; D is wrong because weighted routing of a Lambda alias is designed for this.

</Quiz>

<Quiz
  qnum={13}
  total={20}
  question="A team deploys to a set of EC2 Auto Scaling instances and wants to update only a portion of the instances at a time, moving to the next batch after each one, keeping the service available throughout, and without spinning up a whole separate new environment. Which strategy best matches this?"
  options={[
    'Rolling deployment: update instances in batches, one batch after another, with the service available throughout',
    'Blue/green deployment, which must spin up a whole separate new environment',
    'Take everything down at once to update',
    'Canary deployment, which must weight to individual function versions',
  ]}
  answer={0}>

**Correct answer: A**

**Rolling deployment** splits the update into several batches, **updating only a portion of the instances at a time**; after a batch finishes and passes health checks it moves to the next, keeping the service available throughout, and **without a whole separate environment** (lower cost than blue/green). The trade-off is that old and new versions coexist during deployment and rollback is slower than blue/green. B blue/green needs a whole separate environment, contradicting the without-a-separate-one requirement; C taking everything down does not match available throughout; D canary weighted routing is mainly for Lambda/ECS traffic ratios, different from this EC2 batching scenario.

</Quiz>

<Quiz
  qnum={14}
  total={20}
  question="A developer pushes a container image to ECR: build the image, tag a version, push. Regarding best practice for ECR image tags, which statement is MOST correct?"
  options={[
    'Always use only the latest tag for convenience',
    'Use explicit, immutable version tags (such as a git commit SHA or semantic version) to ensure a specific image is deployed, aiding traceability and rollback; you may also use latest but do not rely on it alone',
    'Images do not need tags',
    'Overwrite the same tag every time and keep no past versions',
  ]}
  answer={1}>

**Correct answer: B**

Best practice is to use **explicit, immutable tags** (such as a git commit SHA or a semantic version number) so each deployment pulls a **specific, traceable image** and can **roll back precisely** to a given version when needed. Relying only on `latest` means it gets overwritten, so you cannot be sure which version is running and rollback is hard. A and D using or overwriting only latest lose traceability and rollback ability; C without a tag you cannot reference a specific image.

</Quiz>

<Quiz
  qnum={15}
  total={20}
  question="A team runs containers on ECS and does not want to manage the underlying EC2 instances or be responsible for patching the operating system, wanting to just define how much CPU/memory the container needs and have AWS provision the runtime. Which launch type best matches this?"
  options={[
    'The EC2 launch type, managing the EC2 instances in the cluster yourself',
    'Fargate: serverless container compute where you only define the resources the container needs, with no underlying instances to manage',
    'You must build your own Kubernetes cluster',
    'Fargate requires you to patch the operating system yourself',
  ]}
  answer={1}>

**Correct answer: B**

**Fargate** is **serverless** container compute: you only declare in the task definition how much CPU/memory the container needs, and AWS provisions and operates the underlying runtime, with **no EC2 to manage and no OS to patch**. A the EC2 launch type has you manage the instances in the cluster yourself (chosen when you need fine control over the host or special hardware); C is wrong because ECS is itself container orchestration and does not require building your own K8s; D is wrong because patching the underlying host is exactly what Fargate removes for you.

</Quiz>

<Quiz
  qnum={16}
  total={20}
  question="A container in an ECS task needs to read data from an S3 bucket. The developer wants to know which role to grant the S3 read permission to. Regarding the ECS task role and execution role, which TWO statements are correct? (Choose TWO)"
  options={[
    'The task role is the identity the application inside the container uses to call AWS services (such as reading S3), so the S3 read permission should be granted to it',
    'The task execution role is used by the ECS agent for platform-level actions such as pulling the ECR image and writing to CloudWatch Logs',
    'The task role and execution role are the same thing and it does not matter which you grant',
    'You should add the S3 read permission to the execution role because it has the most permissions',
    'For a container to use AWS services you must write an Access Key into an environment variable and cannot rely on a role',
  ]}
  answer={[0, 1]}>

**Correct answer: A, B**

The two roles have different responsibilities: the **task role** is the identity of the **application inside the container**, used to call AWS services (read S3, write DynamoDB, and so on), so the S3 read permission goes to **it**; the **task execution role** is used by the **ECS agent/platform** for the platform actions needed to start the container, such as **pulling the ECR image, writing CloudWatch Logs, and retrieving secrets**. C is wrong because the two are different; D is wrong because the application accessing S3 belongs to the task role, not the execution role; E is wrong because the correct approach is to get temporary credentials via a role rather than hard-coding a key.

</Quiz>

<Quiz
  qnum={17}
  total={20}
  question="A developer writes a test for a function that computes a discount amount, wanting to quickly verify that the function returns correct results for various inputs without connecting to any external service or touching a database. What kind of test is this?"
  options={[
    'An integration test, because it verifies several services working together',
    'A unit test, focusing on the logic of a single function/module, not depending on external systems, running fast and easy to pinpoint problems',
    'A load test',
    'A manual test',
  ]}
  answer={1}>

**Correct answer: B**

A **unit test** focuses on the logic of a **single function or module**, isolates external dependencies, runs fast, and makes problems easy to locate — verifying whether a given input returns the correct output is a classic unit test. A an integration test verifies **multiple components/services actually working together** (such as the function really reading/writing a database or calling an API), with larger scope and slower; C a load test looks at performance under load; D a manual test relies on a person operating it, which does not match quick automated verification.

</Quiz>

<Quiz
  qnum={18}
  total={20}
  question="A developer writes a unit test for a function that calls DynamoDB but does not want the test to actually connect to DynamoDB (slow, costly, unstable results). What is the best approach?"
  options={[
    'Always connect to the real production DynamoDB during tests',
    'Use a mock/stub to simulate the return of the DynamoDB client so the unit test does not actually connect and can verify the function handling of various responses in a controlled, fast way',
    'Delete all the DynamoDB code before testing',
    'Just do not write tests',
  ]}
  answer={1}>

**Correct answer: B**

In a unit test you should use a **mock/stub** to simulate the return of an external dependency (such as the DynamoDB client) so the test **does not actually connect**, which is both fast and controlled, and lets you deliberately produce various responses (success, empty result, error) to verify the function handling logic. A connecting to real production is slow, costly, and risks data pollution; C deleting the code means you are no longer testing the original logic; D not writing tests goes against the intent and quality requirements. (If you want to verify that it really connects and works together correctly, that belongs to integration testing.)

</Quiz>

<Quiz
  qnum={19}
  total={20}
  question="A team adopts AI-assisted tools to help generate code and test cases to speed up development. Regarding best practice for using AI output in the CI/CD and testing flow, which statement is MOST correct?"
  options={[
    'AI-generated code and tests can be deployed straight to production with no human review',
    'AI-generated code and tests still need human review and verification by the existing automated tests, and are only added to the pipeline after correctness and security are confirmed',
    'Anything AI generates is definitely correct and code review can be skipped',
    'After adopting AI there is no longer any need for unit and integration tests',
  ]}
  answer={1}>

**Correct answer: B**

AI-assisted tools can **speed up** generating code and test cases, but their output **still needs human review (code review) and verification by the existing automated tests** — confirming the logic is correct, free of security flaws, and meets the requirements before it is added to the CI/CD pipeline. AI can produce code that looks reasonable but is actually wrong or insecure, so it must not be trusted blindly. A and C deploying directly or skipping review are very risky; D is wrong because unit and integration tests remain fundamental to verifying correctness and are not made unnecessary by adopting AI.

</Quiz>

<Quiz
  qnum={20}
  total={20}
  question="A CodePipeline uses CloudFormation to deploy infrastructure, but the deploy action fails due to insufficient permissions. The developer wants to know whose identity this deploy action uses to create resources. What is the MOST correct understanding?"
  options={[
    'It uses the developer local Access Key',
    'It uses the service role specified for the CloudFormation deploy action (and the service role of CodePipeline itself), which should be granted least-privilege permission to create the required resources',
    'CodePipeline has all permissions in the account by default and will not have permission issues',
    'You must configure the Root keys for the pipeline',
  ]}
  answer={1}>

**Correct answer: B**

The CloudFormation deploy action of CodePipeline creates/updates resources using the **service role specified for that action** (the role CloudFormation assumes), while CodePipeline itself also has a **service role** for wiring the stages together; both should be granted **least-privilege** permissions, and insufficient permission causes a failure at that stage. A does not use the developer local keys; C is wrong because the pipeline has no arbitrary permissions by default and relies entirely on roles; D using Root keys is a serious security risk and violates least privilege.

</Quiz>

Domain 3 complete! On to Domain 4.
