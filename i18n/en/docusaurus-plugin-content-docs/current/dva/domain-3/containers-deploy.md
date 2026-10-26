---
sidebar_position: 4
title: Build and Deploy Containers (ECR / ECS / Fargate)
---

# Build and Deploy Containers: push the image to ECR, let ECS / Fargate run it

> This article takes a developer's view of shipping a containerised app from your laptop to the cloud: why containers matter, how to push images to ECR (tags, scanning), how to write a task definition, how an ECS service keeps the number of tasks you want running, how the Fargate and EC2 launch types differ, and the one everyone mixes up — task role vs execution role. These are high-frequency topics in DVA-C03 Domain 3 (Deployment), asked closer to how you actually deploy than SAA.

<Vocab title="📌 Terms you will meet here (clear even if brand new)">

- **Container**: your code packaged together with its runtime, libraries, and config into one portable little box that runs identically on any machine with a container engine.
- **Image**: the installer or template for a container. You build an image from a `Dockerfile`, and every running container is a copy made from that same image.
- **ECR (Elastic Container Registry)**: AWS managed <Term en="Elastic Container Registry" desc="AWS managed private Docker image registry that stores, version-tags, and vulnerability-scans your container images.">image registry</Term> that stores the container images you push (like GitHub, but for images).
- **ECS (Elastic Container Service)**: AWS <Term en="Elastic Container Service" desc="AWS native container orchestration service that runs containers from your task definition, keeps the count, health-checks, and replaces them.">container orchestration service</Term> that runs your containers, keeps the right number alive, and restarts them if they die.
- **Task Definition**: a JSON blueprint describing which image to run, how much CPU/memory, which ports, which role, and the environment variables. Like a recipe for a container.
- **Task**: an actual set of running containers launched from a task definition. One task can hold one or more containers.
- **Service**: the manager inside ECS that keeps N tasks alive long-term, auto-replacing dead ones and rolling out new versions.
- **Fargate**: a <Term en="AWS Fargate" desc="Serverless compute engine for ECS/EKS. You do not manage the underlying EC2 machines; AWS runs your containers based on the CPU/memory the task needs.">serverless container compute engine</Term> where you just say how much CPU/memory your container needs, and AWS runs it, so you never manage the underlying machines.

</Vocab>

:::note[💬 Reading tip]
Whenever you see a term with a <Term desc="Like this! Hover over the dotted term (tap on mobile) to see a plain explanation.">dotted underline</Term>, hover over it for a plain explanation. All terms are also collected in the [Glossary](/glossary).
:::

## Why use containers? Start with the "but it works on my machine" pain

You write your app locally, it runs fine, you hand it to a colleague or push it to a server, and it breaks everywhere: their Node version differs, a system library is missing, an environment variable was not set. That is the classic "it works on my machine".

Containers fix this in one shot: you package your code plus runtime plus dependencies plus config into one image, and that image runs identically on your laptop, your colleague's machine, the test environment, and production. For a developer the focus shifts from "hand-tune every machine" to "build the image once, run it anywhere".

Containers bring two more developer favourites:

- **Fast and lightweight**: far lighter than booting a whole virtual machine (VM); a container starts in seconds.
- **Portable and scalable**: the same image runs locally, on ECS, or on another cloud; to scale out you just run more containers.

But packaging alone is not enough. Who stores these images? Who runs the containers, replaces the dead ones, and adds more when you need to scale? That is where ECR and ECS / Fargate come in.

<Analogy title="🏢 Analogy: the image is a central-kitchen meal kit">

- **Dockerfile = the recipe**: writes down which ingredients and steps make this dish.
- **Image = a vacuum-sealed meal kit**: made from the recipe and sealed, with every kit identical.
- **ECR = the central cold-storage warehouse**: all the kits are stored here, labelled (flavour, version) for easy retrieval.
- **ECS service = the chain-store manager**: makes sure there are always 3 hot meals on the counter, reheating a replacement as soon as one sells.
- **Fargate = an outsourced kitchen**: you do not rent a kitchen or tend the stove; you just say how much heat and how many ingredients this meal needs, and the kitchen produces it.

</Analogy>

## The whole flow in one sentence

Locally you run `docker build` to package your app into an image, push it to the ECR private registry with a tag, write a task definition that tells ECS which image to run and how much resource and which roles to use, create an ECS service that keeps N tasks alive forever, then pick Fargate (no machines to manage) or EC2 (bring your own machines).

<div className="flow">
  <div className="flow-node">docker build (build image)</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">push to ECR (tag + scan)</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">register task definition (what to run, how much)</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">ECS service keeps N tasks</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Fargate or EC2 runs the containers</div>
</div>

## Core 1: ECR — pushing images, tags, vulnerability scanning

<Term en="Elastic Container Registry" desc="AWS managed private Docker image registry.">ECR</Term> is your private image registry. Three things matter: push, tag, and scan.

### You must log in before you can push

ECR is private, so before pushing you first obtain a short-lived login token. The command looks like this (details in the hands-on below):

```bash
aws ecr get-login-password --region ap-northeast-1 \
  | docker login --username AWS --password-stdin \
    111122223333.dkr.ecr.ap-northeast-1.amazonaws.com
```

`get-login-password` produces a password valid for 12 hours, fed into `docker login`, so that the later `docker push` has permission to upload.

### Tags — do not just use `latest`

When you push an image you attach an <Term en="Image Tag" desc="A version label on an image, such as v1.2.0 or a git commit SHA, used to pin and roll back to a specific image.">image tag</Term> to mark the version, for example `myapp:v1.2.0`. The tag decides which version you deploy.

:::info[🔑 Why you should not only use `latest`]
`latest` is just a name that keeps getting overwritten; it does not stand for a version. Today's `latest` and last week's `latest` can be completely different code, so when something breaks you cannot even say which version production is running, and rolling back is hard. The fix: use immutable version tags (semantic versions like `v1.2.0` or the git commit SHA), where one tag maps to one image that never changes. ECR can also enable tag immutability, which outright forbids overwriting an existing tag.
:::

### Scan — a health check for your image

ECR can automatically scan your image to find known <Term en="Vulnerability (CVE)" desc="A publicly catalogued security flaw in software that an attacker may exploit.">security vulnerabilities (CVEs)</Term> in its packages:

- **Basic scanning**: free, compares against open-source vulnerability databases.
- **Enhanced scanning (integrated with Amazon Inspector)**: deeper, continuous scanning of OS and language-package vulnerabilities.

You can set it to scan on push, so you learn about vulnerabilities immediately instead of after you are already live and attacked.

## Core 2: Task Definition — the deployment blueprint for a container

The <Term en="Task Definition" desc="A JSON blueprint describing which image to run, CPU/memory, ports, roles, and environment variables.">task definition</Term> is a JSON file and the heart of ECS. It answers what to run, how much resource, how to connect, and under whose identity:

| Field | What it is and why it is tested |
| --- | --- |
| **`family`** | The task definition's name; each change you register produces a new revision (family:1, family:2...), an immutable snapshot like Lambda versions. |
| **containerDefinitions** | Which image to run (usually an ECR URI), `cpu`/`memory`, `portMappings` (which ports), `environment` (environment variables), `logConfiguration` (ship to CloudWatch Logs). |
| **`requiresCompatibilities`** | Declares whether this runs on `FARGATE` or `EC2`. |
| **`networkMode`** | Fargate is always `awsvpc` (each task gets its own network interface and private IP). |
| **Task-level `cpu`/`memory`** | Required for Fargate, the total resource for the whole task (e.g. 256 CPU / 512 MB). |
| **`executionRoleArn` (execution role)** | Used by the ECS agent: pulls the ECR image and writes CloudWatch Logs. |
| **`taskRoleArn` (task role)** | Used by your container code: how your app reads S3 or writes DynamoDB. |

:::tip[💡 Exam focus: never mix up the two roles]
- **Execution Role** is for the act of running the container: pulling the private ECR image and shipping logs to CloudWatch. Missing it means the task cannot even start (the common error `CannotPullContainerError`).
- **Task Role** is for your program inside the container: your app calling the AWS SDK to reach S3 / DynamoDB / SQS. Missing it means the container runs but your program gets AccessDenied when touching AWS.
This "pull the image vs the program accesses resources" contrast is tested almost every time.
:::

## Core 3: ECS Service — keep the count, roll out updates

A task runs once and that is it; but a production service must keep N alive forever, and that is the job of the ECS Service:

- **Maintain the desired count**: you say 3, and if one dies it launches a replacement.
- **Health checks and replacement**: wired to an ALB (Application Load Balancer) for health checks, replacing anything unhealthy.
- **Rolling update**: you register a new task definition revision and update the service, and ECS brings up new tasks while draining old ones, with no traffic interruption.
- **Works with Auto Scaling**: adds or removes tasks based on CPU/memory or request count.

<Analogy title="🏢 Analogy: a service is a roster that always needs 3 people on shift">

The manager (the service) watches the roster: there must always be 3 staff (tasks) on the counter. When someone takes leave (a container dies), a replacement is called in at once; to change uniforms (deploy a new version), they swap one at a time, so the shop never closes all at once.

</Analogy>

## Core 4: Launch types — Fargate vs EC2

The same task definition can run on two launch types:

| | **Fargate (serverless)** | **EC2 launch type** |
| --- | --- | --- |
| Who manages the machines | **AWS does**, you never touch them | **You** provide a fleet of EC2 instances as container hosts |
| Billing | By the **vCPU/memory the task uses x time** | By the **EC2 instances you run** (packed or not) |
| Ease | Most hands-off, no patching, no capacity planning | You patch the OS and scale the hosts yourself |
| Can you get into the machine | **No SSH** into the underlying machine | You can SSH into the EC2 host |
| Good for | General microservices, bursty traffic, less ops | Special hardware (GPU), packing instances tight to cut cost, fine host tuning |

## How to choose: ECS vs EKS, Fargate vs EC2

> This is the fixed section: first why you use it, then pros and cons, finally when to use which.

### Understand these are two separate dimensions

Many people blur these together. They are actually two independent questions:

1. **Which orchestrator?** ECS or EKS. (Who directs the containers)
2. **Which launch type?** Fargate or EC2. (Whose machines the containers run on)

The two combine freely: ECS + Fargate, ECS + EC2, EKS + Fargate are all valid.

### ECS vs EKS

- **ECS (Elastic Container Service)**
  - **Why use it**: the AWS-native, simplest container orchestration. Few concepts (task definition, service, cluster), seamless with IAM / ALB / CloudWatch, and the flattest learning curve.
  - **Pros**: fast to pick up, almost no learning overhead, no control plane to manage, highest AWS integration.
  - **Cons**: AWS-proprietary, so you cannot lift it to another cloud or on-prem as-is; the ecosystem and plugins are not as vast as Kubernetes.
  - **When to use**: the team wants containers on AWS fastest, does not need the Kubernetes ecosystem, and has no multi-cloud baggage. The default pick in exam scenarios.

- **EKS (Elastic Kubernetes Service)**
  - **Why use it**: AWS-managed Kubernetes. When you already have Kubernetes experience, existing K8s config (YAML, Helm), or need cross-cloud / hybrid consistency.
  - **Pros**: standard Kubernetes, huge ecosystem and tooling, high portability (K8s runs on other clouds too).
  - **Cons**: complex, steep learning curve, requires K8s knowledge, heavier operational burden than ECS.
  - **When to use**: the team has invested in Kubernetes, needs multi-cloud portability, or needs the rich K8s ecosystem (such as a specific operator).

### Fargate vs EC2

- **Fargate**
  - **Why use it**: you do not want to manage machines. You just declare the CPU/memory the container needs and AWS runs it, with no patching, no capacity planning, no cluster hosts to tend.
  - **Pros**: most hands-off operations, precise per-task billing, strong security isolation.
  - **Cons**: unit cost is usually higher than tightly packed EC2, no SSH into the machine for low-level tuning, and some special needs are more limited (such as GPU support and flexibility).
  - **When to use**: general sites / APIs / microservices, bursty traffic, and a team that wants to spend effort on code rather than ops.

- **EC2 launch type**
  - **Why use it**: you need control over the underlying machine, or want to pack instances tight to cut cost at large scale, or need special hardware (GPU).
  - **Pros**: lower unit cost at scale, choice of special instance types, fine host tuning, SSH into the machine.
  - **Cons**: you tend the OS patching, capacity planning, and cluster host health, so the ops burden is heavy.
  - **When to use**: steady high utilisation where you want to cut cost, GPU / special instances needed, or fine host control required.

:::tip[💡 One-line memory aid]
- "Fastest, most hands-off, on AWS" → **ECS**; "already on Kubernetes / need multi-cloud" → **EKS**.
- "Cannot be bothered to manage machines" → **Fargate**; "need big savings or GPU / fine host tuning" → **EC2**.
:::

## Real-world use: not just for the exam

<Scenario title="Real scenario: containerise a Node API and run it on ECS + Fargate">

You have a Node.js API and want it in the cloud without managing machines. Here is how: locally `docker build` it into an image, push to ECR and tag it `v1.0.0` (not `latest`); enable ECR scan on push and confirm no high-risk vulnerabilities; write a Fargate task definition (256 CPU / 512 MB, `awsvpc`, an execution role that can pull from ECR and write Logs, a task role that can read your S3 config); finally create an ECS service that keeps 2 tasks behind an ALB. To ship a new version later, just build a new image, tag `v1.1.0`, register a new task definition revision, and update the service, and ECS rolls over with no traffic interruption.

</Scenario>

### 🛠️ Hands-on: build → log in to ECR → push → register task definition → deploy service

```bash
# 0) Set some variables for easy copying (swap in your own account and region)
ACCOUNT=111122223333
REGION=ap-northeast-1
REPO=myapp
REGISTRY=$ACCOUNT.dkr.ecr.$REGION.amazonaws.com

# 1) Create a private repository in ECR (enable scan on push)
aws ecr create-repository \
  --repository-name $REPO \
  --image-scanning-configuration scanOnPush=true \
  --region $REGION
# Expected: JSON back including repositoryUri (e.g. 111122223333.dkr.ecr.ap-northeast-1.amazonaws.com/myapp)

# 2) Build the image locally, tagging it directly with the version tag + full ECR address
docker build -t $REGISTRY/$REPO:v1.0.0 .
# Expected: a series of build steps, ending with Successfully tagged .../myapp:v1.0.0

# 3) Log in to ECR (get the 12-hour password and feed it to docker login)
aws ecr get-login-password --region $REGION \
  | docker login --username AWS --password-stdin $REGISTRY
# Expected: Login Succeeded

# 4) Push it up
docker push $REGISTRY/$REPO:v1.0.0
# Expected: each layer Pushed, ending with a digest (sha256:...)

# 5) Register the task definition (taskdef.json holds the two roles, image URI, CPU/memory)
aws ecs register-task-definition --cli-input-json file://taskdef.json
# Expected: a taskDefinitionArn back, ending with a revision number (e.g. myapp:1)

# 6) Create the service: keep 2 tasks, use Fargate, in the given subnets
aws ecs create-service \
  --cluster my-cluster \
  --service-name myapp-svc \
  --task-definition myapp:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-abc,subnet-def],securityGroups=[sg-123],assignPublicIp=ENABLED}"
# Expected: a service description back, with runningCount climbing from 0 to 2

# 7) (Later, for a new version) change code → build v1.1.0 → push → update the service for a rolling replace
aws ecs update-service \
  --cluster my-cluster \
  --service myapp-svc \
  --task-definition myapp:2
# Expected: ECS brings up the v1.1.0 tasks while draining the old ones, with no traffic interruption
```

A minimal Fargate `taskdef.json` (note how clearly the two roles are separated):

```json
{
  "family": "myapp",
  "requiresCompatibilities": ["FARGATE"],
  "networkMode": "awsvpc",
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::111122223333:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::111122223333:role/myapp-task-role",
  "containerDefinitions": [
    {
      "name": "myapp",
      "image": "111122223333.dkr.ecr.ap-northeast-1.amazonaws.com/myapp:v1.0.0",
      "portMappings": [{ "containerPort": 3000 }],
      "environment": [{ "name": "NODE_ENV", "value": "production" }],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/myapp",
          "awslogs-region": "ap-northeast-1",
          "awslogs-stream-prefix": "myapp"
        }
      }
    }
  ]
}
```

<Cost>

**The container itself is not billed; the compute and registry underneath are.** Fargate bills by the vCPU/memory a task uses x run time, so even with no machines to manage, 2 idle tasks keep costing money; the EC2 launch type bills by the EC2 instances you run (packed or not, which is why dense packing is what makes it cheaper). ECR bills by stored image size plus cross-region/outbound data transfer, so cleaning up old images regularly (set a lifecycle policy) saves money. After practising, set the service desired count to 0 and delete the test cluster and ECR repository.

</Cost>

:::warning[🚑 Common mistakes]
- **Using only the `latest` tag**: `latest` keeps getting overwritten, so when something breaks you cannot say which version production runs and rollback is hard. Use immutable version tags (`v1.2.0` / git SHA) and consider enabling ECR tag immutability.
- **Going live without scanning the image**: without scan on push you are pushing a pile of unknown vulnerabilities straight to production. Enable scanning and fix high-risk findings before shipping.
- **Mixing up task role vs execution role**: pulling the ECR image and writing Logs uses the execution role (missing it, the task cannot start, `CannotPullContainerError`); the container program reaching S3 / DynamoDB uses the task role (missing it, it runs but gets AccessDenied). Get the direction backwards and you will chase errors forever.
- **Assuming you can SSH into a Fargate machine**: Fargate has no underlying machine to SSH into. To get inside a container to debug, use ECS Exec (`aws ecs execute-command`), not SSH.
- **Images too large, slow to pull**: an image stuffed with unused things makes every start pull slowly and scaling sluggish. Slim it with a multi-stage build, a lean base image (such as `-slim` / `alpine`), and a good `.dockerignore`.
:::

<Refs title="📚 Official docs & further reading">

- [Amazon ECR User Guide](https://docs.aws.amazon.com/AmazonECR/latest/userguide/what-is-ecr.html)
- [Pushing an image to Amazon ECR](https://docs.aws.amazon.com/AmazonECR/latest/userguide/docker-push-ecr-image.html)
- [Amazon ECR image scanning](https://docs.aws.amazon.com/AmazonECR/latest/userguide/image-scanning.html)
- [Amazon ECS task definitions](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definitions.html)
- [Amazon ECS task IAM roles (task role vs execution role)](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-iam-roles.html)
- [AWS Fargate for Amazon ECS](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html)

</Refs>

## Next

👉 Next: [Testing and AI-Assisted Testing](./testing-ai-assisted.md)
