---
sidebar_position: 1
title: CI/CD Pipelines
---

# CI/CD: Turn "shipping a release" into pressing one button with CodePipeline + CodeBuild + CodeDeploy

> This article takes a developer's view of AWS's native CI/CD trio: **CodePipeline orchestrates** (strings the flow into one pipeline), **CodeBuild builds and tests** (reads `buildspec.yml`), and **CodeDeploy deploys** (reads `appspec.yml`), plus the package repository **CodeArtifact** and your source. DVA-C03 Domain 3 (Deployment, 22%) loves asking "which service does which job", "what goes in buildspec vs appspec", and "how permissions and artifacts flow".

<Vocab title="📌 Terms you will meet (no prior experience needed)">

- **CI (Continuous Integration)**: every time someone pushes code, it is **built and tested automatically** so you catch breakage as early as possible, not at release time.
- **CD (Continuous Delivery / Deployment)**: tested code **flows to the next gate automatically** and is ultimately deployed. Delivery = automated up to a release-ready state (maybe with a manual approval button); deployment = even the final step is automatic.
- **Pipeline**: the stages "get source, build and test, deploy" **strung into one automated assembly line**, each gate flowing into the next.
- **Stage and Action**: a pipeline is split into **stages** (such as Source, Build, Deploy), and each stage contains one or more **actions** (which actually call CodeBuild, CodeDeploy, and so on).
- **Artifact**: a **bundle of files** that one stage produces and hands to the next (such as a built zip or compiled output). On AWS the pipeline moves these through an S3 bucket automatically.
- **buildspec**: a `buildspec.yml` file that tells **CodeBuild** which phases to run, what commands each phase runs, and which files to output.
- **appspec**: an `appspec.yml` (or `.json`) file that tells **CodeDeploy** what to deploy, where to put it, and which hook scripts to run before and after.

</Vocab>

:::note[💬 Reading tip]
Whenever you see a term with a <Term desc="Like this one. Hover over the dotted underline (tap on mobile) to see a plain-language explanation.">dotted underline</Term>, hover over it for a plain-language explanation. Every term is also collected in the [Terms and services glossary](/glossary).
:::

## Why do you need CI/CD? A "manual release is scary" story first

Say three of you build an API together. Without CI/CD, shipping looks like this: finish the code, run tests manually on your laptop (or forget to), package it up, SSH into the server, copy files over the top, restart the service, and pray.

Developers know the pain of this "manual release":

- **Human error**: miss a file, forget an environment variable, overwrite the wrong version, and it blows up on arrival.
- **"It works on my machine"**: everyone's environment differs, so build results are inconsistent.
- **Nobody remembers to run tests**: in a rush you skip them, and broken code lands straight in production.
- **Not reproducible, no record**: when something breaks you do not know which version shipped, who shipped it, or when.
- **Panic rollback**: when it breaks you scramble to SSH the old version back.

CI/CD **automates and standardizes** this whole flow: push to Git and it builds, tests, and deploys only if tests pass, with a record at every step and automatic rollback on failure. For developers the focus shifts from "do not ship the wrong build" to "write good code and tests, and let the pipeline ship it".

## The one-line view of how these three services cooperate

<div className="flow">
  <div className="flow-node">Source<br/>(CodeConnections to GitHub)</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">CodeBuild<br/>(build and test<br/>buildspec.yml)</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">CodeDeploy<br/>(deploy<br/>appspec.yml)</div>
</div>

**The whole pipeline is conducted by CodePipeline** (orchestration). It does not build and does not deploy itself; instead it **calls the right service at each stage**: fetch source, ask CodeBuild to build and test, then hand the produced artifact to CodeDeploy to deploy. Artifacts move between stages automatically through an S3 bucket.

<Analogy title="🏢 Analogy: CI/CD is like a restaurant service line">

- **CodePipeline = the service-line conveyor controller**: it neither cooks nor delivers; it only ensures "once this station finishes, the item moves to the next", controlling the order and any blockers.
- **Source = the receiving dock**: fresh ingredients (the code you push) kick off the whole line as they arrive.
- **CodeBuild = the kitchen**: follows the recipe (`buildspec.yml`) to turn ingredients into a dish (compile, package), and **taste-tests it (runs tests)** along the way, placing the finished product (artifact) on the conveyor.
- **CodeDeploy = the server**: follows the order slip (`appspec.yml`) to carry the dish to the right table (EC2 / Lambda / ECS), and will **serve one table first to test the waters (canary)** before serving everyone.
- **CodeArtifact = the pantry**: shared seasonings and half-made parts (third-party packages, your own libraries) live here centrally, ready for the kitchen to grab.

</Analogy>

## Who does what (exam core: which service does which job)

### Source: the pipeline's starting point

The first stage of a pipeline is always **Source**, defining "where the code comes from and what triggers the pipeline". Common sources:

- **GitHub / GitHub Enterprise / Bitbucket / GitLab**: connected via <Term en="AWS CodeConnections" desc="Formerly CodeStar Connections, used to securely connect AWS pipelines to external Git services such as GitHub, replacing the old OAuth-token approach.">CodeConnections</Term> (formerly CodeStar Connections), now the standard way to connect external Git.
- **Amazon S3**: use a zip as the source.
- **Amazon ECR**: trigger on a container image push.

:::info[🔑 A note on CodeCommit]
AWS's own Git host **CodeCommit** used to be a textbook staple, but AWS **stopped onboarding new customers to CodeCommit after July 2024**. For C03, questions mostly use **GitHub + CodeConnections**. The concept is the same (it is just a Git repository), but do not assume a new project still uses CodeCommit.
:::

### CodePipeline: orchestration

CodePipeline is the **conductor**, splitting the release flow into **stages**, each holding **actions**:

- Typical stages: `Source` (fetch) → `Build` (call CodeBuild) → (optional) `Test` → (optional manual approval) → `Deploy` (call CodeDeploy).
- **It does not build or deploy itself**; it only strings the flow, passes artifacts, holds gates, and stops on failure.
- It supports a **Manual approval** action: place a gate before production that requires a person to approve before continuing.
- A stage can run **parallel actions** (at once) or **serial** ones.

### CodeBuild: build and test (reads `buildspec.yml`)

<Term en="AWS CodeBuild" desc="A fully managed build service that compiles code, runs tests, and packages artifacts in a throwaway container per buildspec.yml, billed by the minute with nothing charged when idle.">CodeBuild</Term> is a **fully managed build server**: it spins up a throwaway container, follows the `buildspec.yml` commands to compile, run unit tests, and package, produces the artifact, then destroys the container.

`buildspec.yml` (by default at the source root) is split into fixed **phases**:

```yaml
version: 0.2

env:
  variables:
    NODE_ENV: "production"
  # Never put secrets in plaintext. Inject via Secrets Manager / Parameter Store (see pitfalls below)
  secrets-manager:
    DB_PASSWORD: "prod/db:password"

phases:
  install:            # Install tools, pin runtime versions
    runtime-versions:
      nodejs: 20
    commands:
      - echo "Installing dependencies"
      - npm ci
  pre_build:          # Prep before build (log in to registry, run linter)
    commands:
      - npm run lint
  build:              # The actual build
    commands:
      - npm run build
      - npm test       # Always include tests here, so a failing test fails this phase
  post_build:         # Wrap-up after build (package, upload)
    commands:
      - echo "Build complete"

artifacts:            # Files to hand to the next stage
  files:
    - '**/*'
  base-directory: dist

cache:                # Cache dependencies to speed up the next build
  paths:
    - 'node_modules/**/*'
```

:::info[🔑 Meaning and order of phases]
`install → pre_build → build → post_build` is a fixed order. **If any command in any phase returns non-zero, the whole build is marked failed** and the pipeline blocks at this stage. So putting `npm test` inside `build` means a failing test fails the build, and broken code cannot reach the deploy stage. That is the core value of CI.
:::

### CodeDeploy: deploy (reads `appspec.yml`)

<Term en="AWS CodeDeploy" desc="A fully managed deployment service that places built artifacts onto EC2, Lambda, or ECS per appspec.yml, supports blue/green and canary, and can auto-roll back.">CodeDeploy</Term> **actually places the artifact onto compute and brings it live**, supporting three targets whose `appspec` differs slightly:

| Deploy target | Typical strategy | appspec focus |
| --- | --- | --- |
| **EC2 / on-premises servers** | In-place or Blue/Green | Use `files` to say where files go and `hooks` to define lifecycle scripts (such as `BeforeInstall`, `ApplicationStop`, `AfterInstall`) |
| **Lambda** | Canary / Linear / AllAtOnce (with alias weighted traffic) | Specify the function, alias, and old/new versions; traffic shifts gradually |
| **ECS** | Blue/Green (always) | Specify the task definition, container, and port |

An EC2 `appspec.yml`:

```yaml
version: 0.0
os: linux
files:
  - source: /
    destination: /var/www/myapp
hooks:
  ApplicationStop:
    - location: scripts/stop_server.sh
      timeout: 60
  AfterInstall:
    - location: scripts/install_deps.sh
      timeout: 120
  ApplicationStart:
    - location: scripts/start_server.sh
      timeout: 60
  ValidateService:            # Post-deploy health check; failure can auto-roll back
    - location: scripts/health_check.sh
      timeout: 60
```

:::tip[💡 Exam focus: deployment strategy keywords]
- **In-place**: update directly on existing instances, resource-cheap but **that instance is briefly interrupted during the update**; rollback means redeploying the old version.
- **Blue/Green**: stand up a whole new environment (green) with the new version, and only shift traffic from old (blue) once healthy. **Rollback is instant** (shift traffic back to blue), at the cost of **running two sets at once, which is pricier**. **CodeDeploy for ECS and Lambda is always blue/green.**
- **Canary / Linear**: common for Lambda; send a small slice of traffic (such as 10%) to the new version, watch, then ramp to 100%.
:::

### CodeArtifact: package repository

<Term en="AWS CodeArtifact" desc="A fully managed package repository that serves as a private registry for npm/pip/Maven/NuGet and proxies public sources such as npmjs and Maven Central.">CodeArtifact</Term> is a **fully managed private package repository** compatible with npm, pip, Maven, NuGet, yarn, and more. It solves two pains:

- **Proxy public registries**: it caches packages from npmjs, PyPI, and Maven Central, so when a public registry is down or an author deletes a version, your build does not break with it.
- **Host your private packages**: internal shared libraries you do not want public are published to CodeArtifact, and CodeBuild pulls from here during a build.

It is not a required pipeline stage, but it is often used in the `install`/`pre_build` phases of `buildspec.yml` (log in to CodeArtifact, then `npm install`).

## Why use this instead of rolling your own or a third party?

> People often say "I know Jenkins and GitHub Actions exist, but not why I would use this set on AWS." This section makes the trade-offs plain.

### Why it

The core value of AWS-native CI/CD is **fully managed plus deep integration with AWS permissions and resources**: you do not run and maintain a Jenkins server (patch, scale, keep it alive); and with **IAM roles** it safely touches AWS resources (deploy to EC2 / Lambda / ECS, pull secrets from Secrets Manager) without stuffing long-lived keys into the CI tool. For teams whose workloads are mostly on AWS, the integration cost is lowest.

### Tool comparison

| Option | Pros | Cons / limits | When to use |
| --- | --- | --- | --- |
| **AWS CodePipeline trio** | Fully managed, no servers to tend; seamless with IAM/CloudWatch/CloudFormation; CodeBuild billed by the minute and free when idle; CodeDeploy natively supports EC2/Lambda/ECS blue/green with auto-rollback | Fiddly to set up, steeper learning curve; plugin ecosystem thinner than GitHub Actions; weaker across clouds | **Workloads mostly on AWS**, wanting no ops and native permission integration (the default DVA answer) |
| **Self-hosted Jenkins** | Richest plugins, extremely flexible, fully controllable, cross-cloud | **You run the server** (boot, patch, scale, back up; if it dies you cannot ship); you build HA yourself | You already have a Jenkins stack, need heavy customization, or run multi-cloud |
| **GitHub Actions / GitLab CI** | Close to the source, quick YAML, rich community actions, great PR experience | Deploying into AWS still needs cloud credentials (OIDC recommended); heavy build minutes cost money; native AWS deploy features (blue/green rollback) are weaker than CodeDeploy | Source on GitHub/GitLab, wanting a PR-close developer experience |

:::info[🔑 Mixing is common, not either/or]
In practice people often **mix**: run **CI on GitHub Actions** (build and test, close to the source), then trigger **CodePipeline / CodeDeploy for the AWS deploy** (blue/green, auto-rollback). The exam answer leans toward "AWS-native = no ops, native integration", but know it is not black and white.
:::

### When to avoid it

- **Super simple flow** (one small static site pushed to S3) → one GitHub Actions job or a single `aws s3 sync` is enough; a whole CodePipeline is overkill.
- **Strong cross-cloud need** (deploy to AWS plus GCP plus Azure) → a neutral Jenkins / GitLab CI fits better than this AWS-bound set.
- **Team already invested deeply in Jenkins** and it works well → no need to switch for its own sake.

## 🛠️ Hands-on: build a minimal pipeline (Source → Build → Deploy)

Goal: push code on GitHub → CodeBuild builds and tests per `buildspec.yml` → CodeDeploy deploys to EC2.

### Step 0: put `buildspec.yml` at the source root

Use the `buildspec.yml` from the CodeBuild section above. **Expected result**: CodeBuild can then find it automatically at the source root (when no path is specified, it defaults to `buildspec.yml`).

### Step 1 (console): connect the GitHub source

1. CodePipeline console → "Create pipeline".
2. Source provider → **GitHub (via GitHub App)** → create or pick a **CodeConnections** connection → authorize → pick the repo and branch (such as `main`).

**Expected result**: connection status shows `Available`; pushing the `main` branch will then trigger the pipeline automatically.

### Step 2: create the Build stage (CodeBuild project)

Create a build project via CLI (you can also create it in the wizard):

```bash
aws codebuild create-project \
  --name myapp-build \
  --source "type=CODEPIPELINE" \
  --artifacts "type=CODEPIPELINE" \
  --environment "type=LINUX_CONTAINER,computeType=BUILD_GENERAL1_SMALL,image=aws/codebuild/amazonlinux2-x86_64-standard:5.0" \
  --service-role arn:aws:iam::111122223333:role/codebuild-service-role
```

**Expected result**: a project named `myapp-build`; both `source` and `artifacts` set to `CODEPIPELINE`, meaning "input and output are both wired by the pipeline".

### Step 3: trigger once manually and read the result

```bash
# Run the existing pipeline once
aws codepipeline start-pipeline-execution --name myapp-pipeline

# Check current pipeline state (Succeeded / Failed per stage)
aws codepipeline get-pipeline-state --name myapp-pipeline
```

**Expected result**: `get-pipeline-state` lists `latestExecution.status` for `Source`, `Build`, and `Deploy`. On success all three are `Succeeded`; if `npm test` fails, the `Build` stage is `Failed`, the pipeline stops, and **it never reaches Deploy** (exactly what we want).

### Step 4: read build logs to debug

```bash
# When Build fails, read CodeBuild output in CloudWatch Logs
aws logs tail /aws/codebuild/myapp-build --follow
```

**Expected result**: you see the command output of each `buildspec.yml` phase; wherever a command exits non-zero, the build stops there.

<Scenario title="Real scenario: add a manual approval gate so code does not rush into production">

Your pipeline is `Source → Build → Deploy-Staging → Deploy-Prod`. Staging can deploy automatically, but the boss wants a person to review before production. Approach: insert a **Manual approval** action before `Deploy-Prod`, optionally wired to an SNS notification. When the pipeline reaches this gate it **pauses and waits for approval**; it continues only when someone clicks "Approve" in the console, and stops on "Reject". This keeps a human gate inside continuous delivery, balancing speed and safety.

</Scenario>

<Cost>

CodePipeline is billed per **active pipeline** (a fixed monthly fee per pipeline, with a free tier); CodeBuild is billed by **build minutes multiplied by machine size** and charges nothing when not building; CodeDeploy **charges for EC2 / on-premises but is free for Lambda / ECS**; the S3 bucket holding artifacts and CloudWatch Logs are billed separately. After practicing, delete test pipelines, the CodeBuild project, and the S3 artifact bucket so an idle pipeline does not keep eating the monthly fee.

</Cost>

:::warning[🚑 Common pitfalls]
- **Wrong buildspec phase or command**: a misspelled phase name (such as `prebuild` instead of `pre_build`) is ignored; a non-zero command fails the whole build without you noticing. **Run `npm run build && npm test` locally first** before handing it to CodeBuild.
- **CodeBuild service role missing permissions**: a build that pulls from CodeArtifact, writes artifacts to S3, and reads Secrets Manager will hit `AccessDenied` if the **service role lacks those permissions**. CodeBuild uses its own **service role**, not your account's permissions, so add each one (ECR, S3, logs, secretsmanager, codeartifact, and so on).
- **Artifacts not wired**: if `buildspec.yml` `artifacts.files` does not declare the output files, the next stage (CodeDeploy) gets nothing and deploys empty; the input/output artifact names between stages must match.
- **Auto-deploy with no tests**: a smooth pipeline whose `buildspec` runs no tests simply ships broken code to production automatically. **Always put tests in the `build` phase** so a failing test fails the build and blocks the pipeline.
- **Secrets in plaintext environment variables**: do **not** put passwords or keys in `buildspec.yml` `env.variables` or plaintext CodeBuild environment variables (logs leak them). Inject sensitive values via `env.secrets-manager` (Secrets Manager) or `env.parameter-store` (Parameter Store `SecureString`).
- **No auto-rollback for production deploys**: CodeDeploy can **auto-roll back** on a failed health check or triggered alarm; without it a bad version stays live. For EC2/on-premises, pair with Blue/Green so rollback is a traffic switch.
:::

<Refs title="📚 Official docs & further reading">

- [AWS CodePipeline User Guide](https://docs.aws.amazon.com/codepipeline/latest/userguide/welcome.html)
- [CodeBuild buildspec reference](https://docs.aws.amazon.com/codebuild/latest/userguide/build-spec-ref.html)
- [CodeDeploy AppSpec File reference](https://docs.aws.amazon.com/codedeploy/latest/userguide/reference-appspec-file.html)
- [CodeArtifact User Guide](https://docs.aws.amazon.com/codeartifact/latest/ug/welcome.html)
- [AWS CodeConnections (connect GitHub and other sources)](https://docs.aws.amazon.com/dtconsole/latest/userguide/welcome-connections.html)

</Refs>

## Next step

👉 Next: [IaC: CloudFormation / SAM / CDK](./iac-cloudformation-sam.md)
