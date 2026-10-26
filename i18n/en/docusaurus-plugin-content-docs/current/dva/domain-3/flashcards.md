---
sidebar_position: 6
title: Domain 3 Flashcards
---

# Domain 3 Flashcards

Tap a card to flip it open. This page distills the developer-focused essentials of Domain 3 "Deployment" into bite-sized cards, covering CI/CD, infrastructure as code, deployment strategies, containers, and testing, perfect for a fast review before the exam.

## CI/CD

<Flashcards>
  <Flashcard term="CodePipeline">The service that chains build, test, and deploy into an automated pipeline. A code change automatically runs through every stage; a pipeline is made of stages, and each stage can contain different actions. It only orchestrates; the real work is handed to CodeBuild, CodeDeploy, and others.</Flashcard>
  <Flashcard term="CodeBuild">A fully managed build service that compiles source code, runs tests, and packages deployable artifacts. You never run your own build server, you pay by build time, and the build steps live in buildspec.yml.</Flashcard>
  <Flashcard term="CodeDeploy">The service that automatically deploys your application to EC2, Lambda, or ECS. It supports strategies such as rolling and blue/green, the steps and lifecycle hooks live in appspec.yml, and a failed deployment can roll back automatically.</Flashcard>
  <Flashcard term="CodeArtifact">A fully managed package repository for centrally storing and sharing dependencies such as npm, pip, and Maven packages. It can proxy public repositories upstream, cache them, and control which package versions and sources your team uses.</Flashcard>
  <Flashcard term="buildspec.yml">The CodeBuild instruction file, by default at the root of your source. It uses phases (install / pre_build / build / post_build) to describe the commands each phase runs, and the artifacts section to specify which files to hand off to the next step.</Flashcard>
  <Flashcard term="appspec.yml">The CodeDeploy configuration file. The EC2/on-prem version specifies where to copy files and the scripts for lifecycle hooks such as BeforeInstall and AfterInstall; the Lambda/ECS version specifies the new version and the traffic-shifting hooks.</Flashcard>
  <Flashcard term="Lifecycle Hook">A specific point during a CodeDeploy deployment (such as before install, before traffic shift, or after shift) where you can attach your own validation scripts. It is commonly used to run a health check before cutting live traffic over, aborting the deployment if it fails.</Flashcard>
</Flashcards>

## Infrastructure as Code (IaC)

<Flashcards>
  <Flashcard term="CloudFormation Stack">Using one template to create, update, and delete a whole set of AWS resources at once; that set of resources is a stack. The benefit is reproducible, version-controlled environments, and deleting the stack cleans up all its resources in one go.</Flashcard>
  <Flashcard term="Change Set">A preview generated before updating a stack that tells you which resources this change will add, modify, or delete, and which ones will be replaced and rebuilt. Review the change set before executing to avoid accidentally tearing down and rebuilding a database.</Flashcard>
  <Flashcard term="DeletionPolicy">A CloudFormation resource attribute that decides how a resource is handled when the stack is deleted or the resource is removed: Retain keeps it, Snapshot takes a snapshot first then deletes, and Delete removes it outright (the default). Important resources like databases and S3 are often set to Retain.</Flashcard>
  <Flashcard term="SAM (Serverless Application Model)">A serverless extension of CloudFormation that uses a more concise syntax to describe Lambda, API Gateway, DynamoDB, and more. sam build / deploy packages your app and expands it into a full CloudFormation template to deploy.</Flashcard>
  <Flashcard term="CDK (Cloud Development Kit)">Lets you write infrastructure in a real programming language such as TypeScript or Python, then synthesize it into a CloudFormation template. You can reuse loops, conditions, and functions, making it more flexible than hand-written YAML and a good fit for people with a coding background.</Flashcard>
  <Flashcard term="Stack Drift">When someone changes a resource directly in the console so its actual state no longer matches the CloudFormation template, that is drift. Use drift detection to find hand-edited resources and remind yourself not to bypass IaC.</Flashcard>
</Flashcards>

## Deployment Strategies

<Flashcards>
  <Flashcard term="In-place Deployment">Stops the old version and installs the new one directly on the existing instances. It saves resources and needs no extra machines, but the service is down during the update and there is no old environment to switch back to if something breaks.</Flashcard>
  <Flashcard term="Rolling Deployment">Updates only a subset of instances at a time, replacing them in batches until all are new. The old and new versions coexist and the service stays up, but rollback is slower and you must watch for compatibility between versions.</Flashcard>
  <Flashcard term="Blue/Green Deployment">Spins up a whole new environment (green) with the new version, verifies it, then shifts all traffic over at once, keeping the old environment (blue) around. Switching is fast and rollback is just shifting traffic back to blue, but it needs double the resources during deployment.</Flashcard>
  <Flashcard term="Canary Deployment">Routes a small slice of traffic (such as 10%) to the new version and watches for a while; once it looks healthy, it shifts all the rest over. It catches problems early with a little real traffic, keeping risk to a minimum.</Flashcard>
  <Flashcard term="Linear Deployment">Shifts traffic to the new version in fixed increments at fixed intervals (such as +10% every 10 minutes), moving all traffic over smoothly. It is more even than canary and suits situations where you want to observe gradually.</Flashcard>
  <Flashcard term="Lambda Alias Weighting">On a single Lambda alias, splits traffic between two versions by proportion (such as 90% old, 10% new). This is the underlying mechanism for canary and linear deployments on Lambda, and CodeDeploy adjusts the weights for you automatically.</Flashcard>
  <Flashcard term="ECS Blue/Green Deployment">CodeDeploy starts a new set of tasks (green) for the ECS service, validates it through the load balancer's test listener, then shifts live traffic from the old tasks (blue) to the new ones. It rolls back quickly if something breaks, ideal for zero-downtime updates of container services.</Flashcard>
</Flashcards>

## Containers

<Flashcards>
  <Flashcard term="ECR (Elastic Container Registry)">A fully managed Docker image repository for storing and distributing your container images. It can scan images for vulnerabilities and use lifecycle policies to clean up old images automatically, and both ECS and EKS pull images from it.</Flashcard>
  <Flashcard term="Task Definition">The ECS blueprint that describes which containers a task runs, which image to use, how much CPU/memory to allocate, which ports to open, and which environment variables and roles to attach. It is a template; the running copy is called a task.</Flashcard>
  <Flashcard term="Fargate vs EC2 Launch Type">Fargate is serverless: you manage only the containers, not the underlying machines, pay by usage, and save on operations; the EC2 type requires you to manage the cluster machines yourself but gives more control over host specs, supports GPU/special needs, and may be cheaper for large steady workloads.</Flashcard>
  <Flashcard term="Task Role vs Execution Role">The task role is for your application inside the container, deciding which AWS resources it can access (such as reading S3); the execution role is for the ECS agent, used to pull ECR images and write CloudWatch logs. Do not mix the two up.</Flashcard>
</Flashcards>

## Testing

<Flashcards>
  <Flashcard term="Unit vs Integration Tests">Unit tests verify the logic of a single function/module, run fast, and touch no external services; integration tests verify that several components wired together (such as a Lambda actually reading DynamoDB) work. Catch logic errors with plenty of unit tests first, then confirm the pieces connect with integration tests.</Flashcard>
  <Flashcard term="Mock">Replaces a real external dependency (such as a database or third-party API) with a fake stand-in so unit tests can run without a real connection and can simulate various responses and errors. Tests become fast and stable, unaffected by external state.</Flashcard>
  <Flashcard term="SAM Local">Uses sam local invoke / start-api to simulate Lambda and API Gateway on your own machine with Docker, so you can test functions without deploying to the cloud every time. It is a fast way to validate logic during development, saving both time and money.</Flashcard>
  <Flashcard term="AI-assisted Testing / Amazon Q">Amazon Q Developer can generate unit tests, fill in test cases, and explain and fix code right inside your IDE, speeding up writing tests and debugging. C03 adds an "AI-assisted development" focus, so treat it as an assistant for raising your test coverage.</Flashcard>
</Flashcards>

👉 Test yourself: [Domain 3 Quiz](./quiz.md)
