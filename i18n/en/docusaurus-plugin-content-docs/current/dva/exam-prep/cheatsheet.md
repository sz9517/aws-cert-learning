---
sidebar_position: 1
title: Cheat Sheet and Decision Guide
---

# DVA-C03 Cheat Sheet and Decision Guide (Developer-Focused Final Sprint)

> This single page distills the most frequently tested **trade-offs** and **keyword to answer** mappings across the four DVA-C03 domains into tables and decision lists. It is built to scan top to bottom in the last hour before your exam. Every row answers: "When you see a stem like this, pick which, and why." If a row looks unfamiliar, jump back to that article, then return and keep scanning.

:::note[How to use this page]
Scan the four domain tables first and circle the cells you always hesitate on. Save the final "keyword to pick" table and the exam tips for one last look right before you walk in.
:::

## D1: Development with AWS Services (30%)

The heaviest domain, and the one that rewards developer-level detail. The question is rarely "what is this service" but "which of these similar services" and "does it auto-retry on failure".

### Lambda concurrency: Reserved vs Provisioned

| Type | What it does | Removes cold starts? | When to pick |
| --- | --- | --- | --- |
| **Reserved Concurrency** | Reserves a slice of quota for a function, which is also its **upper limit** | **No** | Protect a critical function from starvation, or **cap** a function (a downstream database cannot take the load) |
| **Provisioned Concurrency** | Pre-initializes and **keeps N environments warm** | **Yes** | **Low-latency, no cold start** on predictable traffic (a user-facing API) |

:::warning[Most common trap]
"Remove cold starts" means **Provisioned**; "cap concurrency / reserve quota" means **Reserved**. Do not confuse them. Provisioned Concurrency bills continuously.
:::

### Retry behavior of the three invocation models (high-frequency topic)

| Invocation model | Typical source | Retry behavior on failure |
| --- | --- | --- |
| **Synchronous** | API Gateway, SDK `Invoke` | Lambda does **not** auto-retry; the error returns to the caller, and the **caller** must retry with exponential backoff |
| **Asynchronous** | S3, EventBridge, SNS | Lambda **auto-retries twice** (3 attempts total), then sends to a **DLQ / on-failure destination** |
| **Event Source Mapping (ESM)** | SQS, Kinesis, DynamoDB Streams | Lambda **polls** and reads in batches; SQS goes to a DLQ per `maxReceiveCount`; Kinesis/Streams **block on the failing batch** and retry until success or expiry |

### Choosing a messaging / orchestration service

| Keyword in the stem | Pick | Why |
| --- | --- | --- |
| "**one-to-many fan-out**", one message to many subscribers at once | **SNS** (often **SNS + SQS** fan-out) | Pub/Sub push; multiple SQS queues each get a copy and process at their own pace |
| "**decouple, buffer, absorb spikes, guaranteed processing**", point-to-point | **SQS** | Producer drops into a queue, consumer pulls at its own pace; failures use redelivery + DLQ |
| "**route events to different targets by content**", "third-party SaaS events", "scheduled cron" | **EventBridge** | Rule matching + multi-target routing, with a built-in schema registry and scheduler |
| "**multi-step workflow needing state, retries, human approval, waiting**" | **Step Functions** | State-machine orchestration for long flows; Standard for long, Express for high-volume short flows |

:::info[One-line distinction]
**SQS = buffering queue (pull)**; **SNS = fan-out notification (push)**; **EventBridge = event routing (rule matching)**; **Step Functions = multi-step orchestration (stateful)**.
:::

### DynamoDB: indexes, reads, capacity, consistency

| Topic | Comparison | Exam point |
| --- | --- | --- |
| **LSI vs GSI** | LSI: same partition key, different sort key, **created only at table creation**, shares table capacity, supports strong consistency. GSI: **added anytime**, different partition key, **own capacity**, **eventually consistent only** | "add an index after creation" means only a **GSI**; "swap the sort condition under the same partition key with strong consistency" means **LSI** |
| **Query vs Scan** | Query targets a partition key, precise and efficient; Scan reads the whole table, expensive | "slow, burns capacity" usually means a **Scan**, switch to **Query / GSI** |
| **Capacity mode** | On-Demand: no forecasting, auto-handles spikes, pay per use. Provisioned: for predictable traffic, cheaper, can add Auto Scaling | "unpredictable / bursty traffic" means **On-Demand**; "steady and predictable, save money" means **Provisioned** |
| **Consistency** | Default is **eventually consistent** (cheap, fast); strong-consistent reads **cost double, add latency, and cannot be used on a GSI** | "read the latest right after a write" means strong-consistent read; "strong consistency on a GSI" is **not possible** |

:::tip[DynamoDB shortcuts]
Seeing `ProvisionedThroughputExceededException` or throttling means a hot partition or insufficient capacity: switch to **On-Demand**, improve partition-key distribution, or add a **DAX** cache. Seeing "atomic counter, avoid overwriting another writer" means **Conditional Write + optimistic locking (a version attribute)**.
:::

### S3 uploads and authorization

| Need | Pick | Key point |
| --- | --- | --- |
| "give an external user **temporary** upload/download to S3 without issuing IAM" | **Presigned URL** | Signed with your credentials and an **expiry**; the permission equals the signer's permission |
| "**large file upload**, must resume on flaky network, over 100 MB" | **Multipart Upload** | Parallel part uploads, individual retries; over 5 GB **must** use multipart |
| "clean up half-finished parts to save money" | **Lifecycle rule** aborting incomplete multipart uploads | Leftover parts keep billing |

## D2: Security (26%)

The core is always: **use roles, not long-term keys**, and **know who is who** (authentication vs authorization).

### Identity and authorization

| Comparison | Pick / difference | Exam point |
| --- | --- | --- |
| **IAM role vs long-term access key** | Always **use a role for temporary credentials** (EC2/Lambda/ECS all have roles); avoid long-term access keys, and never hardcode them | "credentials hardcoded in code" or "key leaked" means switch to a **role + STS temporary credentials** |
| **Cognito User Pool vs Identity Pool** | User Pool = **user directory and sign-in** (sign-up/sign-in/MFA, issues JWT); Identity Pool = **get AWS temporary credentials** to access AWS resources | "need sign-in/sign-up/social login" means **User Pool**; "after login, directly access S3/DynamoDB" means **Identity Pool** (the two are often used together) |

:::info[Cognito in one line]
**User Pool manages how people sign in; Identity Pool manages which AWS resources they can touch after signing in.**
:::

### Encryption and secrets management

| Topic | Key point | Exam point |
| --- | --- | --- |
| **KMS envelope encryption** | Encrypt data with a data key (DEK), then encrypt that DEK with a KMS master key (CMK); a direct KMS encrypt is capped at **4 KB** | "encrypt a large file" means **envelope encryption** (`GenerateDataKey`), do not pass the whole blob to `Encrypt` |
| **Secrets Manager vs Parameter Store** | Secrets Manager: **automatic rotation**, has a cost, fits DB credentials / API keys. Parameter Store: free tier, config values/strings, SecureString can use KMS | "need **automatic rotation** of credentials" means **Secrets Manager**; "just storing config / rarely changes / save money" means **Parameter Store** |

:::warning[KMS 4 KB limit]
When you see "encrypt a large object directly with KMS", be alert: the `Encrypt` API is capped at **4 KB**. Large data always uses **envelope encryption**, encrypting the data locally with a DEK and handing only the DEK to KMS.
:::

### Signing and temporary authorization

| Keyword | Answer |
| --- | --- |
| "**sign** an API request, block tampering" | **SigV4** (the SDK does it automatically; you only sign manually for raw calls) |
| "give an external **time-limited** S3 access link" | **Presigned URL** |
| "get **temporary credentials** cross-account / cross-role" | **STS** (`AssumeRole`, returns a set of expiring temporary keys) |

## D3: Testing and Deployment (22%)

Tests "which service does which job" and "how to choose a deployment strategy".

### CI/CD division of labor

<div className="flow">
  <div className="flow-node">CodePipeline: conductor (chains the pipeline stages)</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">CodeBuild: build + test (buildspec.yml)</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">CodeDeploy: deploy artifacts to targets (appspec.yml)</div>
</div>

| Service | Responsible for | Memory hook |
| --- | --- | --- |
| **CodePipeline** | Orchestrates the stages of the pipeline (source → build → deploy) | "chain the whole CI/CD flow" |
| **CodeBuild** | Runs builds and tests, reads **`buildspec.yml`** | "compile, unit test, package" |
| **CodeDeploy** | Deploys to EC2/Lambda/ECS, reads **`appspec.yml`**, can do blue/green and canary | "do the deployment and deployment strategy" |

### IaC, pick one: CloudFormation vs SAM vs CDK

| Tool | What it is | When to pick |
| --- | --- | --- |
| **CloudFormation** | Native IaC, write YAML/JSON templates | General infrastructure, teams using declarative templates |
| **SAM** | A **serverless shorthand** for CloudFormation, a little syntax expands into full CFN; `sam local` tests Lambda locally | "**serverless** application, want to test Lambda/API locally" |
| **CDK** | Write in a **programming language** (TS/Python...), synthesized into CloudFormation | "want loops/conditions/object abstractions, engineers writing infrastructure in a familiar language" |

:::info[One line]
SAM is a serverless-only CFN shorthand; CDK produces CFN from a programming language. Both end up as a **CloudFormation stack** underneath.
:::

### How to choose a deployment strategy

| Strategy | How it works | Pros | Cost | Keyword |
| --- | --- | --- | --- | --- |
| **In-place / all-at-once** | Replace the existing environment directly | Fastest, cheapest | **Downtime**, slow rollback | "cheapest, test environment, downtime acceptable" |
| **Rolling** | Replace a batch at a time | No need to double resources | Old and new **coexist** for a while, slower rollback | "update in batches, save resources" |
| **Canary** | Send a small slice of traffic to the new version, observe, then go full | Low risk, catch issues early | Longer cutover | "send 10% first, observe, then full" |
| **Blue/Green** | Spin up a new environment, cut over at once, keep the old for instant rollback | **Zero downtime, fast rollback** | **Double resources**, pricier | "zero downtime and fast rollback" |

:::tip[Deployment strategy shortcuts]
"**Zero downtime + fast rollback**" means **blue/green**; "**send a little first and observe**" means **canary**; "**cheapest, downtime OK**" means **in-place**.
:::

### Containers and roles

| Comparison | Difference | Exam point |
| --- | --- | --- |
| **Fargate vs EC2 launch type** | Fargate: no machine management (serverless containers); EC2: manage your own nodes, cheaper and more controllable | "do not want to manage the underlying host/node" means **Fargate**; "control the host, save money on steady traffic" means **EC2** |
| **Task role vs execution role (ECS)** | **Task Role** = permission for the **application inside the container** to access AWS resources; **Task Execution Role** = permission for the **ECS agent** to pull ECR images and write CloudWatch Logs | "the program in the container cannot read S3/DynamoDB" means **Task Role**; "cannot pull the ECR image / no logs" means **Task Execution Role** |
| **ECR** | Private container image registry | Before pushing an image, run `aws ecr get-login-password` to log in |

## D4: Troubleshooting and Optimization (22%)

Tests "which tool to look at first" and "what to check first per error code".

### The three observability tools

| Tool | What it shows | One line |
| --- | --- | --- |
| **CloudWatch** | **Metrics, logs, alarms** (Logs/Metrics/Alarms/Dashboards) | "monitor numbers, read logs, set alarms" |
| **CloudTrail** | **Who called which API and when** (audit/compliance) | "who did this action, when a resource was changed" |
| **X-Ray** | **Distributed tracing**: the path of a request across services and the time of each segment | "cross-service tracing, find where it is slow" |

### X-Ray: annotation vs metadata

| Item | Indexed / queryable? | Use |
| --- | --- | --- |
| **Annotation** | **Yes** (indexed, usable to filter/search traces) | A few key dimensions (such as `userId`, `orderType`) for filtering |
| **Metadata** | **Not** queryable | Extra debugging context (larger, not indexed) |

:::info[One line]
Need to **filter/search traces** means **Annotation**; just **extra debug info** means **Metadata**.
:::

### The resilience-and-correctness trio

| Mechanism | What it solves | Keyword |
| --- | --- | --- |
| **Exponential backoff + jitter** | Retry strategy for throttling/transient failures, avoiding a retry stampede | "429/5xx, must retry" |
| **Idempotency** | Processing the same event multiple times causes no duplicate side effects (safe to retry) | "messages may be delivered more than once / retried" |
| **DLQ (dead-letter queue)** | Move unprocessable messages/events aside to keep them without blocking the main flow | "keep failed messages, do not lose them" |

### Common error codes, what to check first

| Error code | Meaning | What to check first |
| --- | --- | --- |
| **403 Forbidden / AccessDenied** | Insufficient permission | IAM policy, role, resource policy, KMS key policy, `Bucket Policy` |
| **429 TooManyRequests / ThrottlingException** | Throttled | Retry with **exponential backoff + jitter**; raise quota/concurrency; move DynamoDB to On-Demand |
| **5xx (500/502/503)** | Server-side or downstream error | Downstream service, Lambda exception/timeout, retry + backoff |
| **Timeout** | Took too long and was cut off | Lambda 15-minute cap, slow downstream, network/VPC config, API Gateway 29-second cap |

:::tip[Error code shortcuts]
**4xx is your (client-side) problem** (permission, throttling, request format), so usually **do not blindly retry**, fix the request or back off first; **5xx is their problem**, so **retry with exponential backoff**.
:::

### Lambda performance tuning and cache-layer choice

| Scenario | What to do |
| --- | --- |
| Lambda cold start is slow, need low latency | **Provisioned Concurrency**; move heavy objects (connections / SDK clients) outside the handler; slim the deployment package |
| Lambda is slow but not CPU-bound | **Raise memory** (CPU scales with memory), often faster and cheaper |
| DynamoDB hot reads, microsecond latency | **DAX** (DynamoDB-specific cache) |
| General database / query-result cache, sessions | **ElastiCache** (Redis/Memcached) |
| Static content / API responses accelerated globally | **CloudFront** (edge cache) |

## Keyword to pick (last scan before you walk in)

| When the stem mentions... | Pick directly |
| --- | --- |
| one-to-many **fan-out**, one message to many subscribers | **SNS** (+ SQS fan-out) |
| decouple, buffer, absorb spikes, guaranteed processing | **SQS** |
| **route** by event content, SaaS events, scheduling | **EventBridge** |
| multi-step workflow needing state/retry/wait/human approval | **Step Functions** |
| temporary external access to S3, time-limited | **Presigned URL** |
| large file upload, resumable, over 5 GB | **Multipart Upload** |
| eliminate cold starts, low-latency predictable traffic | **Provisioned Concurrency** |
| cap a function concurrency / reserve quota | **Reserved Concurrency** |
| add an index after creation, allow a different partition key | **GSI** |
| read the latest right after a write | **strong-consistent read** (not possible on a GSI) |
| unpredictable/bursty traffic, no capacity forecasting | **On-Demand capacity mode** |
| DB credentials / API keys needing automatic rotation | **Secrets Manager** |
| just store config values, save money | **Parameter Store** |
| encrypt data larger than 4 KB | **KMS envelope encryption** |
| need sign-in/sign-up/social login | **Cognito User Pool** |
| directly access AWS resources after login | **Cognito Identity Pool** |
| temporary credentials cross-account/cross-role | **STS AssumeRole** |
| serverless application IaC, want local testing | **SAM** |
| write infrastructure in a programming language | **CDK** |
| zero-downtime deployment with fast rollback | **blue/green** |
| send a small slice first, observe, then full | **canary** |
| do not want to manage container hosts | **Fargate** |
| permission for the app inside the container to access AWS | **Task Role** |
| cannot pull the ECR image / no logs | **Task Execution Role** |
| cross-service tracing, where is it slow | **X-Ray** |
| a tag used to filter/search traces | **X-Ray Annotation** |
| who called which API and when (audit) | **CloudTrail** |
| view metrics/logs / set alarms | **CloudWatch** |
| throttled (429), must retry | **exponential backoff + jitter** |
| messages may be delivered more than once | **design for idempotency** |
| keep failed messages, do not lose them | **DLQ** |
| DynamoDB hot reads needing microsecond latency | **DAX** |

:::tip[Exam tips]
- **Read the final question first** (what it asks you to pick, whether it is multiple-answer), then go back to the stem, so the scenario does not mislead you.
- Catch the **qualifiers**: "most cost-effective", "least operational overhead", "zero downtime", "real-time / lowest latency", "least privilege". These decide the correct answer.
- "**Serverless / least operational overhead**" usually points to managed/serverless services (Lambda, Fargate, DynamoDB On-Demand, SQS/SNS).
- "Credentials hardcoded in code" is almost always wrong; the answer is usually a **role + temporary credentials**.
- **4xx: fix the request; 5xx: safe to retry**; whenever throttled, think **exponential backoff + jitter**.
- When two options both "work", pick the one that **better matches the qualifier** (cheaper, less overhead, lower latency).
:::

## Next step

👉 Now test yourself: [DVA Full Mock Exam (65 questions)](./mock-exam.md)
