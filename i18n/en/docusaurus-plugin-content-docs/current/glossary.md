---
sidebar_position: 8
title: Glossary & Services
sidebar_label: Glossary & Services
sidebar_class_name: sidebar-secondary
---

# Glossary & Services

Not sure what an acronym means? Look it up here. Format: **Acronym ｜ Full name ｜ Plain explanation**.

## Core services

| Acronym | Full name | Plain explanation |
| --- | --- | --- |
| **EC2** | Elastic Compute Cloud | A cloud server you rent on AWS; your program runs on it. |
| **S3** | Simple Storage Service | AWS's cloud file warehouse for images, backups, reports, etc. |
| **IAM** | Identity and Access Management | The access-control system for "who can do what to which resources". Free. |
| **KMS** | Key Management Service | A "key safe" that centrally manages encryption keys. |
| **RDS** | Relational Database Service | Managed relational databases (MySQL, PostgreSQL, etc.). |
| **VPC** | Virtual Private Cloud | Your private virtual network inside AWS. |

## Common concepts

| Term | Plain explanation |
| --- | --- |
| **Root user** | The account's highest-privilege owner; used only for initial setup. |
| **MFA** | Multi-factor authentication; an extra one-time code at login. |
| **Least privilege** | Grant only just-enough permissions; the core of secure design. |
| **Availability Zone (AZ)** | Independent data centers within a region, used for high-availability design. |
| **Pay-as-you-go** | A billing model where you pay for what you use. |

## Domain 2: Resilience & High Availability

| Acronym / term | Full name | Plain explanation |
| --- | --- | --- |
| **ELB** | Elastic Load Balancing | Umbrella name for load balancers that spread traffic across multiple backends. |
| **ALB** | Application Load Balancer | A Layer 7 (HTTP/HTTPS) load balancer with path/host routing; ideal for websites and microservices. |
| **NLB** | Network Load Balancer | A Layer 4 (TCP/UDP) load balancer with ultra-high performance and a fixed static IP option. |
| **GWLB** | Gateway Load Balancer | For chaining third-party network appliances (firewalls, IDS/IPS). |
| **ASG** | Auto Scaling Group | A group that auto-adjusts the EC2 count by traffic, keeping min/desired/max. |
| **SQS** | Simple Queue Service | A message queue; consumers pull — used to buffer, smooth spikes, and decouple. |
| **SNS** | Simple Notification Service | Publish/subscribe; one message pushed to many subscribers (fan-out). |
| **DLQ** | Dead-Letter Queue | Holds messages that fail repeatedly so they do not clog the main queue. |
| **Route 53** | — | AWS DNS service that resolves domain names to resources and supports many routing policies. |
| **RPO** | Recovery Point Objective | How much "data" (a length of time) you can afford to lose. |
| **RTO** | Recovery Time Objective | How long you can afford to be "down". |
| **Multi-AZ** | — | Synchronous standby across AZs with automatic failover; for HA (does not serve reads). |
| **Read Replica** | — | An asynchronous, optionally cross-Region read-only copy used to offload reads (not an HA solution). |
| **CRR** | Cross-Region Replication | S3 automatic replication across Regions for off-site DR. |
| **EFS** | Elastic File System | A file system mountable/shared across multiple AZs (whereas EBS is tied to a single AZ). |

## Domain 3: High-Performing Architectures

| Acronym / term | Full name | Plain explanation |
| --- | --- | --- |
| **EC2** | Elastic Compute Cloud | Virtual servers; rent a whole machine — pick it for full OS control / long-running work. |
| **Lambda** | AWS Lambda | Serverless compute, event-triggered, billed per runtime ms, 15-minute max per run. |
| **Fargate** | AWS Fargate | Serverless container engine; run ECS/EKS without managing the underlying EC2 nodes. |
| **ECS / EKS** | Elastic Container Service / Elastic Kubernetes Service | AWS container orchestration services (EKS is managed Kubernetes). |
| **Placement Group** | — | Instance placement strategy; cluster packs one rack for ultra-low latency, used for HPC. |
| **EBS** | Elastic Block Store | Persistent block storage; gp3 balanced, io2 highest IOPS, st1 throughput, sc1 cold. |
| **Instance Store** | — | Physically attached scratch disk; extremely high IOPS but wiped on stop (not persistent). |
| **FSx** | Amazon FSx | Managed file-system family; for Windows uses SMB, for Lustre serves HPC high throughput. |
| **RDS** | Relational Database Service | Managed relational databases (MySQL/PostgreSQL and others). |
| **Aurora** | Amazon Aurora | MySQL/PostgreSQL-compatible, several times RDS performance, storage auto-scales. |
| **DynamoDB** | Amazon DynamoDB | Serverless NoSQL with single-digit ms latency and near-unlimited scale. |
| **DAX** | DynamoDB Accelerator | A microsecond in-memory cache purpose-built for DynamoDB. |
| **ElastiCache** | Amazon ElastiCache | Managed in-memory cache; Redis is feature-rich/persistent, Memcached is simple multi-threaded. |
| **CloudFront** | — | CDN that caches content at edge locations to speed up global access. |
| **Global Accelerator** | — | Uses the AWS backbone + anycast static IPs to speed the connection path; great for non-HTTP TCP/UDP. |
| **Kinesis Data Streams** | — | Real-time streaming; multiple consumers read the same data, replayable, scales with shards. |
| **Firehose** | Amazon Data Firehose | Near-real-time auto-loading of streams into S3/Redshift/OpenSearch, no code. |
| **Shard** | — | The throughput-scaling unit of a Kinesis stream. |
| **Partition Key** | — | The key DynamoDB uses to spread data; must be high-cardinality to avoid hot partitions. |
| **Hot Partition** | — | A bottleneck caused by traffic concentrating on a few keys. |
| **Multipart Upload** | — | Uploads a large file to S3 in parallel parts, resumable. |
| **Transfer Acceleration** | — | Speeds up cross-Region S3 uploads via edge locations. |

## Domain 4: Cost Optimization

| Acronym / term | Full name | Plain explanation |
| --- | --- | --- |
| **On-Demand** | — | Pay as you go, no commitment, most flexible but highest unit price. |
| **RI** | Reserved Instance | Commit for 1 or 3 years for a discount; Standard saves more, Convertible can change instance type. |
| **Savings Plans** | — | Commit to an hourly spend ($/hr) for a discount; Compute SP is most flexible, EC2 Instance SP saves most. |
| **Spot** | Spot Instance | Uses spare AWS capacity, up to ~90% off, can be interrupted (2-minute notice); good for fault-tolerant/batch work. |
| **Dedicated Host** | — | A whole physical server for your sole use, for compliance or BYOL; most expensive. |
| **Intelligent-Tiering** | S3 Intelligent-Tiering | Auto-moves objects to cheaper tiers by access frequency; first choice when access is unknown. |
| **Glacier** | S3 Glacier | Archive storage; Instant/Flexible/Deep Archive — colder is cheaper but slower to retrieve. |
| **Lifecycle** | Lifecycle policy | Auto-transitions objects to cheaper classes or expires (deletes) them. |
| **Cost Explorer** | — | Visualize spending trends and find the costliest services. |
| **Budgets** | AWS Budgets | Set cost/usage thresholds that alert when exceeded (forecasted budgets supported). |
| **CUR** | Cost and Usage Report | The most granular line-item billing data, exported to S3 for analysis. |
| **Cost Allocation Tags** | — | Split costs to departments/projects via tags (must be activated first). |
| **Consolidated Billing** | — | One bill across an Organization; volume discounts aggregate and RI/SP are shared. |
| **Cost Anomaly Detection** | — | Uses machine learning to flag abnormal spending spikes automatically. |
| **Aurora Serverless v2** | — | Aurora that auto-scales by usage; good for variable/intermittent load. |
| **NAT Gateway** | — | Lets private subnets reach out; per-hour plus per-GB processing fee, costly at high volume. |
| **VPC Endpoint** | — | Gateway Endpoint reaches S3/DynamoDB for free, skipping NAT and transfer fees. |
| **Direct Connect** | — | A dedicated line to AWS; high upfront cost but cheaper long-term at high volume with lower transfer fees. |
| **Right-Sizing** | — | Adjust oversized/idle resources to the right size; find them with Compute Optimizer/Trusted Advisor. |

## DVA Developer Terms

> Developer-perspective terms commonly tested on the DVA (AWS Certified Developer – Associate).

| Acronym / term | Full name | Plain explanation |
| --- | --- | --- |
| **Version / Alias** | — | A published Lambda version is a read-only snapshot; an alias is a movable pointer to a version (e.g. prod), so you shift traffic or roll back just by moving the alias. |
| **Reserved Concurrency** | — | Locks a set amount of concurrency for a function, guaranteeing it capacity while preventing it from using up the whole account limit. |
| **Provisioned Concurrency** | — | Pre-warms a pool of execution environments kept ready, eliminating cold-start latency for latency-sensitive services (extra cost). |
| **Cold Start** | — | The extra latency when Lambda has no ready environment and must initialize one for the first request. |
| **Event Source Mapping** | — | A Lambda poller that automatically pulls records from SQS/Kinesis/DynamoDB Streams and sends them to the function in batches. |
| **Idempotency** | — | Sending the same request multiple times yields the same result as doing it once; retries never double-charge or double-create. |
| **Exponential Backoff + Jitter** | — | On retry, each wait doubles plus a small random offset, so many clients do not all retry at once and overwhelm the service. |
| **DLQ (Dead-Letter Queue)** | — | Holds messages or events that fail repeatedly for later inspection, keeping them from clogging the main flow. |
| **Visibility Timeout** | — | The window an SQS message is hidden while being processed; if it is not deleted in time, it reappears for others to process. |
| **Cognito User Pool** | — | A user directory and sign-in/sign-up service that authenticates identities and issues JWT tokens. |
| **Cognito Identity Pool** | — | Exchanges an authenticated identity for temporary AWS credentials so a front end can access AWS resources (such as S3) directly. |
| **JWT** | JSON Web Token | A signed token carrying user claims, used for stateless authentication and authorization. |
| **SigV4 signing** | Signature Version 4 | The standard signing process for AWS API requests; it signs requests with your keys to verify identity and prevent tampering. |
| **Presigned URL** | — | A time-limited, signed link that lets someone without AWS credentials upload or download a specific S3 object. |
| **STS AssumeRole** | Security Token Service AssumeRole | Assume a role to obtain a set of temporary credentials, used for cross-account access or short-lived authorization. |
| **Envelope Encryption** | — | Encrypt data with a data key, then encrypt that data key with a KMS master key, balancing performance and security. |
| **Data Key** | — | A key generated by KMS that actually encrypts/decrypts data; its encrypted form is usually stored alongside the ciphertext. |
| **Secrets Manager vs Parameter Store** | — | Both store config/secrets; Secrets Manager supports automatic rotation and charges per secret, while Parameter Store standard parameters are free and fit general config. |
| **Change Set** | CloudFormation Change Set | Previews which resources a stack update will add/modify/delete before you execute it. |
| **SAM** | Serverless Application Model | A framework for defining serverless resources with concise syntax; the sam CLI can test locally and deploy as CloudFormation. |
| **CDK** | Cloud Development Kit | Define infrastructure in a programming language (TypeScript/Python, etc.), then synthesize it into CloudFormation templates. |
| **CodePipeline / CodeBuild / CodeDeploy** | — | The CI/CD trio: Pipeline orchestrates the flow, Build compiles and tests, Deploy ships the artifact to the target. |
| **buildspec / appspec** | — | buildspec.yml tells CodeBuild which commands to run in each phase; appspec tells CodeDeploy how to deploy and which lifecycle hooks to run. |
| **Task Definition** | — | An ECS blueprint describing the container image, CPU/memory, ports, environment variables, and other runtime settings. |
| **ECR** | Elastic Container Registry | AWS's private container image registry; push images there for ECS/EKS/Lambda to use. |
| **X-Ray segment / annotation** | — | In an X-Ray trace, a segment records the timing of a unit of work; an annotation is an indexed, filterable key-value tag. |

:::tip
This table will keep expanding as content for each domain grows.
:::
