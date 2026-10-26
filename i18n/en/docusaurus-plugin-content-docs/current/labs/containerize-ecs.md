---
sidebar_position: 8
title: "Lab 8: Containerize and Deploy to ECS Fargate"
---

# Lab 8: Containerize a Small Web App and Deploy It to ECS Fargate

> This lab is the chain every developer (DVA track) should practice until it's second nature: **package your code into a container image → push it to AWS's image registry (ECR) → let ECS run it on Fargate → open it in a browser and see the page.** You never launch or babysit a single server — Fargate is a **serverless** container runtime: you own the container, AWS owns the underlying machines. When you're done, follow the last section to clean up so the ALB and running tasks don't quietly bill you.

<Vocab title="📌 Jargon you'll see on this page (fine even if you've never touched AWS)">

- **Container**: a "standard box" that packs your program, its runtime, and its dependencies together so it runs the same on any machine — no more "but it works on my machine".
- **Image**: the "template" for a container. You build an image with `docker build`, then spin up many identical containers from the same image.
- **Dockerfile**: a plain-text recipe describing how the image is built — which base to use, which files to copy, which port to open, and what command to run on start.
- **ECR (Elastic Container Registry)**: AWS's private image registry. You `push` images here, and ECS later `pull`s them to run.
- **ECS (Elastic Container Service)**: AWS's container orchestrator — it runs your containers, restarts them if they crash, and keeps as many copies running as you asked for.
- **Fargate**: a run mode for ECS where **you don't manage the underlying EC2 machines**. You just say "give me this much CPU/memory" and AWS places the container for you. The other mode is EC2 mode (you run and maintain the machines yourself).
- **Task Definition**: a blueprint stating "which image to run, how much CPU/memory, which port, which roles". Think of it as the container's "spec sheet".
- **Service**: the manager inside ECS that "keeps N tasks running". If one dies, it brings a replacement back for you.

</Vocab>

:::note[💬 Reading tip]
Whenever you see a term with a <Term desc="Like this! Hover over any dotted term (tap on mobile) and a plain explanation pops up.">dotted underline</Term>, hover over it for a plain-language explanation. All terms are also collected in the [Glossary & Services](/glossary).
:::

:::info[Before you start]
This lab assumes you already have the basics:

- **Docker** installed locally (`docker --version` prints something) and **AWS CLI v2** (`aws --version` prints something).
- AWS CLI configured with a set of credentials that has permissions (use `aws configure` for local dev; in production use a role instead).
- A **Billing Alarm** set up, so you get notified if spending crosses a threshold.
- Stay in the same **Region** throughout (e.g. "Asia Pacific (Tokyo) ap-northeast-1") so you don't lose track of the resources you create.

The app here is deliberately tiny (a page that returns "Hello"); the point is to get the whole chain working, not the app itself.
:::

---

## Scenario: move a locally working small site to the cloud

<Scenario title="Real scenario: you wrote a small web app and your boss says 'put it up so people can reach it'">

You wrote a tiny web service in whatever framework you had handy; it opens fine at `http://localhost:3000` locally. Now it needs to go to the cloud. You don't want to launch an EC2 yourself, install the runtime, configure auto-start on boot, and then worry about who replaces the machine if it dies. What you want is — **hand over a packaged program and let the platform handle "run it, restart it if it crashes, scale it to N copies".**

That's exactly the sweet spot for containers plus ECS Fargate: you hand over an image, and the platform handles scheduling and operations. Let's walk the chain step by step.

</Scenario>

### Here's the whole chain

<div className="flow">
  <div className="flow-node">Write Dockerfile</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">docker build an image</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">push to ECR</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">write task definition</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">run on ECS/Fargate</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">test in browser</div>
</div>

*Diagram: the left three steps happen on your machine (package, build the image, push to the registry); the right three happen on AWS (define how it runs, actually run it, verify).*

---

## Hands-on: from one Dockerfile to a page in your browser

### Step 1: Write a minimal app and a Dockerfile

Put a minimal web app in an empty folder. We'll use Node.js as the example (Python, Go — same pattern). Create `server.js`:

```javascript
const http = require('http');
const port = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello from ECS Fargate!\n');
}).listen(port, () => console.log('listening on ' + port));
```

In the same folder, create a `Dockerfile` (the filename is literally `Dockerfile`, no extension):

```dockerfile
# Use an official slim base image: small and trusted
FROM node:20-alpine

# Working directory inside the container
WORKDIR /app

# Copy the dependency manifest first (this layer caches: unchanged means no reinstall)
COPY package*.json ./
RUN npm install --omit=dev || true

# Then copy the code
COPY . .

# Declare the port the container serves on
EXPOSE 3000

# The command to run when the container starts
CMD ["node", "server.js"]
```

:::info[🤔 Why do it this way: the Dockerfile order isn't random]
- **Use a slim base like `node:20-alpine`**: the Alpine variant is tiny. The smaller the image, the faster the push/pull and the smaller the attack surface. Don't grab the bloated full variant to start.
- **`COPY package*.json` before `COPY . .`**: Docker builds **layer by layer**, and each layer caches. When the dependency manifest hasn't changed, the `npm install` layer hits the cache and doesn't rerun; when you only changed code, rebuilds are much faster. Reverse the order and you lose that cache.
- **`EXPOSE 3000` must match the port the app actually listens on**: this line is a "declaration"; the task definition's port mapping and the security group's open port all need to line up with it. If they don't, you get "the service started but I can't connect".

**What you'll see**: the folder now has `server.js` and a `Dockerfile`. Nothing has run yet — this step just writes the "recipe".
:::

### Step 2: docker build an image and test-run it locally

In that folder, run:

```bash
# Build an image called hello-ecs (the trailing . means "use the current folder as build context")
$ docker build -t hello-ecs:v1 .

# Run it locally first to confirm the image really works (map local 3000 to container 3000)
$ docker run --rm -p 3000:3000 hello-ecs:v1
```

Open `http://localhost:3000` in a browser tab; seeing `Hello from ECS Fargate!` means the image itself is fine. Press `Ctrl+C` to stop.

:::info[🤔 Why do it this way: test locally first, don't jump straight to the cloud]
Going to the cloud has many moving parts (ECR, task definition, networking, roles), and any one of them breaking leaves you not knowing where the fault is. **Confirm the image runs on its own with a local `docker run` first**, and you rule out "the app/image itself" as a variable — so if you can't connect later in the cloud, you know the problem is most likely networking or configuration, not the program. This habit saves you hours of debugging.

**What you'll see**: `docker build` runs through each layer and ends with `naming to ... hello-ecs:v1`; after `docker run`, the terminal prints `listening on 3000` and the browser shows that Hello line.
:::

### Step 3: Create an ECR repository

The image needs a "home" in the cloud before ECS can fetch it. Create a private repository with the CLI (swap in your region):

```bash
$ aws ecr create-repository \
    --repository-name hello-ecs \
    --region ap-northeast-1
```

The returned JSON contains a `repositoryUri` that looks like:

```
123456789012.dkr.ecr.ap-northeast-1.amazonaws.com/hello-ecs
```

Note this string down — you'll use it for login, tagging, push, and the task definition.

:::info[🤔 Why do it this way: ECR is private, not Docker Hub]
You may be used to pushing images to the public Docker Hub, but a production service's image usually **should not be public** (it may contain your code and config). ECR is a **private repository** under your account, accessible only to identities you authorize by default, and it integrates seamlessly with ECS/IAM — when ECS pulls the image, it does so via the "execution role" covered later.

**What you'll see**: the command returns JSON where `repositoryName` is `hello-ecs`, along with that `repositoryUri`. The ECR console will also show this empty repository.
:::

### Step 4: Log in to ECR, tag the image, and push it

ECR is private, so you log in before pushing. This feeds "ECR's temporary password" to `docker login`:

```bash
# 1. Get the ECR login password and pipe it straight into docker login (swap in your account and region)
$ aws ecr get-login-password --region ap-northeast-1 \
    | docker login --username AWS --password-stdin \
      123456789012.dkr.ecr.ap-northeast-1.amazonaws.com

# 2. Tag the local image with the full "ECR address + version"
$ docker tag hello-ecs:v1 \
    123456789012.dkr.ecr.ap-northeast-1.amazonaws.com/hello-ecs:v1

# 3. Push it up
$ docker push \
    123456789012.dkr.ecr.ap-northeast-1.amazonaws.com/hello-ecs:v1
```

:::info[🤔 Why do it this way: why the `get-login-password` pipe, not a pasted password]
ECR's login token is **temporary and expires** (about 12 hours), so there's no fixed credential to store. `aws ecr get-login-password` uses your CLI identity to exchange for a currently valid token, then the pipe `|` feeds it straight into `docker login`'s `--password-stdin` — **the password never appears in your command history or on screen**, which is safer than copy-pasting by hand. Tagging (`docker tag`) is needed because the push destination is decided by "what the image tag looks like": the tag must be the full ECR address so Docker knows where to push.

**What you'll see**:
- A successful `docker login` prints `Login Succeeded`.
- `docker push` shows `Pushed` layer by layer, ending with a summary line that includes `digest: sha256:...` and a size.
- Back in the ECR console, open the repository and you'll see an image with **Image tag `v1`**, along with its push time and size.
:::

### Step 5: Write the task definition

The task definition is the blueprint for "how this container runs". Save a `task-def.json` locally (swap in your account, region, and role ARN):

```json
{
  "family": "hello-ecs-task",
  "requiresCompatibilities": ["FARGATE"],
  "networkMode": "awsvpc",
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "hello-ecs",
      "image": "123456789012.dkr.ecr.ap-northeast-1.amazonaws.com/hello-ecs:v1",
      "essential": true,
      "portMappings": [
        { "containerPort": 3000, "protocol": "tcp" }
      ]
    }
  ]
}
```

Register it with the CLI:

```bash
$ aws ecs register-task-definition \
    --cli-input-json file://task-def.json \
    --region ap-northeast-1
```

:::info[🤔 Why do it this way: keep the task role and the execution role straight (a DVA favorite)]
A task definition has two kinds of roles that beginners mix up most often — keep them straight:

- **Execution Role (`executionRoleArn`)**: used by the **ECS agent** so it can **pull the image from ECR on your behalf and write container logs to CloudWatch**. Without it, the task can't even pull the image and won't start. AWS provides a built-in `ecsTaskExecutionRole` (the console often offers to create it when you set up a cluster), attached with the managed policy `AmazonECSTaskExecutionRolePolicy`.
- **Task Role (`taskRoleArn`)**: used by **the program inside the container** so your app can access other AWS services (e.g. read S3, write DynamoDB). Our Hello app touches no other service, so **no task role is set** — add it only when needed.

One-liner to remember: **the execution role "helps ECS bring the container up"; the task role is "what the running program itself needs to use".**

**What you'll see**: the command returns the registered task definition JSON where `revision` is `1` (it increments by 1 each time you re-register) and `status` is `ACTIVE`.
:::

### Step 6: Create an ECS cluster (Fargate) and a service

The final step: actually run it. Do this part in the **console** — you'll set networking (VPC, subnets, security group) and the ALB along the way, and the guided screens are clearer than raw CLI:

1. Go to `ECS` → **Create cluster** → name it `hello-cluster`, pick **AWS Fargate (serverless)** for infrastructure → create.
2. Open the cluster → **Services** tab → **Create**.
3. **Launch type**: **Fargate**; **Task definition**: the `hello-ecs-task` you just registered (revision 1).
4. **Service name** `hello-service`; **Desired tasks** `1`.
5. **Networking**: pick your VPC and at least two public subnets (across AZs is more resilient).
6. **Security group**: create or pick one, and **be sure to allow inbound TCP 3000** (source: the ALB's security group, or use `0.0.0.0/0` while testing and tighten it later).
7. **Load balancing**: choose **Application Load Balancer**, create a new ALB listening on port `80`, with a target group pointing at the container's port `3000` and a health-check path of `/` for now.
8. **Create the service**.

:::info[🤔 Why do it this way: why attach an ALB instead of relying on a public IP]
A Fargate task can get a **public IP** you connect to directly (quick for testing), but that IP **changes every time the task restarts**, has no health checks, and can't spread traffic across multiple tasks. An **ALB (Application Load Balancer)** gives you a **stable address**, routes traffic to healthy tasks automatically, and stops sending traffic to a task that died — that's what a real service should look like. This lab uses an ALB to show the proper approach; if you just want the fastest look at the page, you can turn off the ALB when creating the service, check "assign public IP" in the networking settings, and test at that IP:3000 directly (remember to open 3000 in the security group).

**What you'll see**:
- After the service is created, the **Tasks** tab shows a task going `PROVISIONING` → `PENDING` → finally settling at **`RUNNING`** (about 1-3 minutes).
- If it's stuck at `PENDING` and keeps restarting, it's usually that the image can't be pulled (execution role issue) or the container crashes on start (check the CloudWatch logs).
:::

### Step 7: Test in the browser

- **Via the ALB**: go to the EC2 console → **Load Balancers** → find the ALB you just created → copy its **DNS name** (like `hello-xxxx.ap-northeast-1.elb.amazonaws.com`) and open it in a browser.
- **Via the public IP** (if you didn't attach an ALB): go to the task details page under the ECS service → find the **public IP** → open `http://<public-IP>:3000`.

Seeing `Hello from ECS Fargate!` means the whole chain works: **you launched no server of your own, yet your program is running in the cloud and serving traffic.**

:::note[🔍 What you'll see (point by point)]
- Opening the ALB DNS shows the page `Hello from ECS Fargate!`.
- Back in the ECS service's **Health** status, the task in the target group is **`healthy`**.
- If the browser keeps spinning or returns 504: nine times out of ten the **security group hasn't opened port 3000 from the ALB to the container**, or the **health-check path/port is wrong** so the target is judged `unhealthy` and the ALB won't send traffic.
:::

---

## Going further: no SSH — so how do you get into the container to debug?

On a traditional EC2 you'd SSH in to look around, but **Fargate has no underlying machine you can SSH to**. The right answer is **ECS Exec**: once enabled on the service, use the CLI to "drill into" a running container and open a shell:

```bash
$ aws ecs execute-command \
    --cluster hello-cluster \
    --task <task-id> \
    --container hello-ecs \
    --interactive \
    --command "/bin/sh" \
    --region ap-northeast-1
```

(Prerequisites: `enableExecuteCommand` was set when the service was created, and the task role has the corresponding SSM permissions.) This is Fargate's "SSH replacement" — check environment variables, inspect files, test connectivity, all through it.

---

## Common gotchas

:::warning[🚑 Common gotchas (nearly every beginner hits these)]
- **Always tagging as `latest`**: pushing everything as `hello-ecs:latest` means that when something breaks you have no idea which version is actually live and no clean way to roll back to the previous one. **Use explicit version tags** (`v1`, `v2`, or a git commit hash); to roll back, just point the task definition at the old tag.
- **Mixing up the task role and the execution role**: thinking "the app needs to read S3, so add S3 permissions to the execution role" — wrong. The **execution role** is for ECS to pull images / write logs; the **task role** is what your in-container program uses to call AWS services. Put it in the wrong place and either the task won't start (execution role lacks permissions) or your program gets AccessDenied calling other services (task role lacks permissions).
- **Security group ports not open**: the service is clearly `RUNNING` yet the browser can't connect. The most common cause is the security group not allowing inbound "ALB → container port 3000", or the ALB's own security group not opening 80. If the ports don't line up all the way through (container `EXPOSE`, task definition `containerPort`, target group port, security group rule), you can't connect.
- **Images that are too fat**: using the full base variant and packing in a pile of dev tools and source files makes images balloon to gigabytes, so push/pull is slow and costly. **Use a slim base (alpine/slim)**, use a `.dockerignore` to exclude `node_modules`, `.git`, and test files, and use a multi-stage build to keep only the artifacts when needed.
- **Assuming you can SSH into Fargate**: Fargate has no machine you can log into, so stop hunting for an SSH key. To get into a container to debug, use **ECS Exec** (see the section above) — and remember you must enable it when creating the service and grant the task role SSM permissions; you can't just decide to go in on the spot.
:::

---

## Clean up to avoid charges

:::warning[🧹 Always clean up when you're done! Not cleaning up keeps billing you]
Please tear everything down in order (running Fargate tasks and the ALB both bill by time):

**1. Set the service's task count to zero and delete the service**
- Go to `ECS` → `hello-cluster` → **Services** → select `hello-service` → **Update** and set "Desired tasks" to `0`, then wait for all tasks to stop.
- Then **Delete** the service.

**2. Delete the cluster**
- Once the services are cleared → back to the cluster → **Delete cluster**.

**3. Delete the ALB and target group**
- Go to `EC2` → **Load Balancers** → select the ALB you created → **Delete**.
- Then go to **Target Groups** → delete the matching target group.
- (An ALB bills by the hour just for existing — this is the easiest thing to forget and the biggest money-sink in this lab.)

**4. Delete the image in ECR (or the whole repository)**
- Go to `ECR` → `hello-ecs` → select the image → **Delete**; or just delete the whole repository:

```bash
$ aws ecr delete-repository \
    --repository-name hello-ecs \
    --force \
    --region ap-northeast-1
```
:::

<Cost title="💰 Cost note">

What actually costs money here is the **running Fargate task** (billed per vCPU/memory usage, by the second) and the **ALB** (billed by the hour just for existing, plus traffic). Storing one small image in ECR and a little traffic cost very little. Follow the steps, **clean up immediately when done** (set desired tasks to zero → delete the service → delete the cluster → delete the ALB/target group → clear ECR), and you'll spend almost nothing. The easiest trap is **forgetting to delete the ALB** — it keeps billing quietly. Remember: **if you opened it, remember to shut it down.**

</Cost>

---

## What this means for the exam

The DVA "testing and deployment" domain loves this container chain, so keep in mind:

- **"Need to run containers but don't want to manage the underlying servers" → the answer is usually ECS Fargate** (or App Runner, or EKS Fargate depending on the scenario); when the question stresses "serverless containers, no machines to maintain", Fargate is almost always the standard answer.
- **The split between Execution Role and Task Role is a high-frequency topic**: pull images / write logs = execution role; in-container program calling AWS services = task role. See "the container needs to read S3, where do the permissions go" and pick the **task role**.
- **Can't reach the service? Think networking first**: security group / target group port / health check are the three usual suspects for "the service is RUNNING but I can't connect".
- **Don't tag images as `latest`**: being able to trace and roll back is deployment fundamentals; when a question talks about "safe deployment / rollback", think in that direction.

<Refs title="📚 Official docs & further reading">

- [Amazon ECS Developer Guide](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/Welcome.html)
- [AWS Fargate on Amazon ECS](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html)
- [Pushing a Docker image to Amazon ECR](https://docs.aws.amazon.com/AmazonECR/latest/userguide/docker-push-ecr-image.html)
- [ECS task definition parameters](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definition_parameters.html)
- [Task execution role vs task role](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-iam-roles.html)
- [Debug into a container with ECS Exec](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-exec.html)

</Refs>

Finish this lab and you've walked the most mainstream modern deployment chain, from code to running in the cloud. Practice it until you can do it with your eyes closed, and whether it's an interview, an exam, or a real launch, you'll have solid footing.
