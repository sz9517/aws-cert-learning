---
sidebar_position: 7
title: "Lab 7: Automate Deployment with CodePipeline"
---

# Lab 7: Build a CI/CD Pipeline with CodePipeline (push code, it builds and deploys itself)

> This lab answers something developers think about every day: **when I push my code, can it automatically build, test, and deploy for me — without me running commands and uploading files by hand?** The answer is — use **CodePipeline** to string "pull code -> build -> deploy" into an **automated pipeline** that runs end to end on every new commit. This is the heart of DVA Domain 3 (Testing & Deployment) and the daily reality of real teams. It skirts the edge of the Free Tier, so clean up when you are done.

<Vocab title="📌 Jargon you'll see on this page (fine even if you've never touched AWS)">

- **CI/CD (Continuous Integration / Continuous Deployment)**: a practice where every code change is **automatically** integrated, built, tested, and shipped, replacing "package and upload by hand".
- **Pipeline**: an automated flow that chains a series of steps together. Here, **CodePipeline** connects "pull code -> build -> deploy" into one line.
- **Source (stage)**: the first stop of the pipeline; it fetches the latest code from the repo as the material for later stages to work on.
- **Build (stage)**: run by **CodeBuild**; it follows the instructions in `buildspec.yml` to compile and package the code into a deployable output.
- **Artifact**: the output of a stage (e.g. packaged files); it is stored in an S3 bucket and passed on to the next stage.
- **buildspec.yml**: a config file in the repo root that tells CodeBuild "which commands to run in each phase, and which files are the artifacts".
- **Service Role**: the IAM role you grant to CodeBuild / CodePipeline so they can "operate other AWS services on your behalf". Missing permissions will get you stuck.
- **Secrets Manager**: the AWS service dedicated to storing **secrets** like passwords, keys, and connection strings; your app fetches them at runtime instead of hardcoding them in code or config.

</Vocab>

:::note[💬 Reading tip]
Whenever you see a term with a <Term desc="Like this! Hover over any dotted term (tap on mobile) and a plain explanation pops up.">dotted underline</Term>, hover over it for a plain-language explanation. All terms are also collected in the [Glossary & Services](/glossary).
:::

:::info[Before you start]
This lab assumes you already have the basics:

- An **AWS account** with a **Billing Alarm** set up, so you get notified if spending crosses a threshold.
- A repo to hold your code. This lab uses **GitHub** as the source (CodePipeline also supports CodeCommit and S3; the steps are nearly identical).
- Stay in the same **Region** throughout (e.g. "Asia Pacific (Tokyo) ap-northeast-1") so you don't lose track of the resources you create.

Not done yet? Go back and finish those first.
:::

---

## Scenario: why have an automated deployment pipeline?

<Scenario title="Real scenario: you're a backend dev, and every release is a scramble">

Your release used to go like this: package locally -> manually upload files to the server/bucket -> manually restart the service. With that many steps, things slip — one day you forget to run the tests, or you upload to the wrong environment, and production breaks. What you actually want is simple: **after I `git push`, the machine does the rest automatically, using the exact same steps every time.**

That is CI/CD. You write down "what to do" as config (`buildspec.yml`), chain "who hands off to whom" into a pipeline (CodePipeline), and from then on every push triggers the pipeline: fetch the latest code, build, deploy. The manual steps vanish, and with them a whole class of "fat finger" accidents.

</Scenario>

### What does this pipeline look like?

<div className="flow">
  <div className="flow-node">Source<br/>(fetch latest code from GitHub)</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Build<br/>(CodeBuild builds per buildspec)</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Deploy<br/>(ship the output to the target)</div>
</div>

*Diagram: the three stages run in order, and each stage's **artifact** is automatically passed to the next. If any stage fails, the pipeline stops there and does not deploy the broken output.*

:::info[🤔 Why split into three stages instead of one script?]
You could of course write one big script that does everything, but splitting into **Source / Build / Deploy** has real benefits:

- **You can see where it stuck**: one glance tells you whether it was fetching code, building, or deploying that went red — no digging through a wall of logs to guess.
- **You can rerun a single stage**: if deploy fails, rerun just Deploy without rebuilding from scratch.
- **Separation of responsibility**: Build lets CodeBuild focus on "compile and package", Deploy focuses on "where to ship", and swapping the tool for one does not affect the other.

That is why a "pipeline" fits production better than "one script".
:::

---

## Hands-on: wire a pipeline together

The overall order is: **prepare the repo and `buildspec.yml` -> create a CodeBuild project -> create a CodePipeline linking the three stages -> trigger a run and watch the result -> read build logs in CloudWatch Logs.**

### Step 1: Prepare the repo and `buildspec.yml`

1. Put something deployable in your GitHub repo. The simplest example: a static site with an `index.html` at the root.
2. Add a file named `buildspec.yml` at the **repo root** and paste in the following:

```yaml
version: 0.2

phases:
  install:
    runtime-versions:
      nodejs: 20
    commands:
      - echo "install phase started"
  build:
    commands:
      - echo "build phase started at $(date)"
      - echo "put your build commands here, e.g. npm install and npm run build"
  post_build:
    commands:
      - echo "build finished, preparing artifacts"

artifacts:
  files:
    - '**/*'
  base-directory: '.'
```

3. Commit and push to GitHub.

:::info[🤔 Why this works: `buildspec.yml` is CodeBuild's "recipe"]
CodeBuild does not know how to build your project on its own — it does exactly what `buildspec.yml` says. This file decides:

- **`phases`**: `install` sets up the runtime and dependencies, `build` runs the real build commands, `post_build` does the wrap-up. Splitting into phases lets you tell at a glance whether "setting up the environment" or "compiling" failed.
- **`artifacts`**: tells CodeBuild "which files are the output" to package and pass to the next stage (Deploy). Here `**/*` means treat all files as artifacts. **Forget the artifacts block and Deploy receives an empty parcel.**

**What you'll see**: the repo root now has `index.html` and `buildspec.yml`, and the commit shows up on GitHub.
:::

:::tip[💡 Reading this buildspec]
- `version: 0.2` is the current common format version — just copy it.
- Each line under `commands` is a shell command, run top to bottom. **If any line returns non-zero (fails), that phase fails** and the pipeline stops.
- A real project's `build` usually has `npm install`, `npm run build`, `mvn package`, and so on; here `echo` is a placeholder so you can get the whole pipeline green first, then swap in real commands.
:::

### Step 2: Create a CodeBuild project

1. In the console, search `CodeBuild` -> **Create build project**.
2. **Project name**: enter `cicd-lab-build`.
3. **Source**: choose **GitHub**, authorize the connection to your repo as prompted, and select that repo and branch (e.g. `main`).
4. **Environment**:
   - **Managed image** -> operating system **Amazon Linux**, with a standard runtime image.
   - **Service role**: choose **New service role** and let it create one for you (note the name — you may need to add permissions later, and clean it up).
5. **Buildspec**: choose "**Use a buildspec file**" — it will look for `buildspec.yml` at the repo root automatically.
6. Leave everything else at the **defaults** -> **Create build project**.

:::info[🤔 Why this works: get Build green on its own before wiring the pipeline]
We deliberately **create only the CodeBuild project first**, instead of standing up the whole pipeline in one shot. The reason: the build is the most error-prone part (environment, dependencies, `buildspec` syntax), so getting it green on its own rules out "is the build itself broken?" when you later wire the pipeline.

**Why "use a buildspec file" instead of pasting commands in the console?** Because putting the build steps in the repo's `buildspec.yml` means the build config is **version-controlled alongside the code** — who changed the build flow and what they changed is all in git history, and you never fight the "console config out of sync with the code" ghost.

**What you'll see**: `cicd-lab-build` appears in the CodeBuild project list; opening it shows it linked to your GitHub repo with the Buildspec source set to "file".
:::

### Step 3: Create CodePipeline, chaining Source -> Build -> Deploy

1. In the console, search `CodePipeline` -> **Create pipeline**.
2. **Pipeline name**: enter `cicd-lab-pipeline`.
3. **Service role**: choose **New service role** and let it create one (note the name).
4. **Artifact store**: let it use the **default** and auto-create an S3 bucket for artifacts (the name looks like `codepipeline-ap-northeast-1-xxxx` — note it, you will delete it during cleanup).
5. **Source stage**:
   - Pick **GitHub** as the source provider, connect to your repo, and select branch `main`.
   - Leave the trigger at the default (fire on every new commit).
6. **Build stage**:
   - Pick **AWS CodeBuild** as the build provider, and select the `cicd-lab-build` project from Step 2.
7. **Deploy stage**:
   - Pick a target to deploy to. The simplest demo is **Amazon S3** (deploy as a static website): pick an S3 bucket you have prepared to serve the site, and tick "Extract file before deploy".
   - (If your target is EC2/ECS, switch the provider to **CodeDeploy** and friends; the concept is the same: ship the Build artifact to the target.)
8. Review the settings -> **Create pipeline**. Once created, it usually **triggers the first run automatically**.

:::info[🤔 Why this works: CodePipeline is the "conductor", it does no work itself]
CodePipeline itself **does not build and does not deploy** — it is the conductor that tells "Source to fetch code, CodeBuild to build, Deploy to deploy", and **passes the artifact** between stages. The services behind each stage do the actual work.

**Why that artifact bucket?** Because stages do not hand files "hand to hand"; instead: Source packages the fetched code into an S3 bucket -> Build pulls it out, builds, and drops the artifact back into the bucket -> Deploy pulls the artifact to deploy. That S3 bucket is the **transfer point** between stages, so do not forget to delete it during cleanup.

**What you'll see**: after creation it enters a run view with the three stages (Source / Build / Deploy) listed top to bottom; you will watch them go **from "in progress (blue)" to "succeeded (green)" in order**.
:::

### Step 4: Trigger a run and watch the result

If it did not run automatically, or you want to run it again, open the pipeline detail page and click **Release change** to trigger manually. Or, closer to real life: **change a line in `index.html` in the repo and push** — the pipeline should kick off on its own.

:::note[🔍 What you'll see (stage by stage)]
- **Source** turns green first: it successfully fetched your latest commit from GitHub (the stage shows the commit message and ID).
- **Build** runs next: click the stage's "details" to see live output; at the end you see the `echo` lines from `build` and `post_build`, and the stage turning green means `buildspec` ran to completion and returned success.
- **Deploy** turns green last: the artifact is shipped to your S3 bucket. Open that site bucket's object list and `index.html` is updated; if static website hosting is on, opening the URL shows your change.
- **All three stages green** means the CI/CD pipeline is working: you only `git push`, and the machine builds and deploys for you automatically.
:::

### Step 5: Read build logs in CloudWatch Logs

When the build fails (the Build stage turns red), the key skill is **reading logs to find the cause**.

1. On the pipeline's Build stage, click **Details** to jump to that CodeBuild run's page.
2. Click the **Build logs** tab, or click "View entire log in CloudWatch Logs".
3. In CloudWatch Logs, the log group is usually named `/aws/codebuild/cicd-lab-build`; open the latest log stream to read, line by line, exactly what each `phase` ran and which line errored.

:::info[🤔 Why this works: logs are your only source of truth when debugging]
A "red failed" stage only tells you "it broke" — it does **not** tell you why. The real reason lives in CloudWatch Logs: whether `npm install` could not find a package, a permission got AccessDenied, or a `buildspec` command had a typo. Build the reflex of "red means read the log first" — it beats blind guessing every time.

**What you'll see**: a `/aws/codebuild/cicd-lab-build` log group in CloudWatch Logs; opening it shows the output of each phase (`install`, `build`, `post_build`), including the `echo` text from your `buildspec`; if the build failed, the red error message is usually right around the failing line.
:::

---

## Do not put secrets in buildspec: use Secrets Manager instead

Many people's first move is to `echo` a database password or API key straight into `buildspec.yml` or stuff it as a plaintext environment variable — **do not**. `buildspec.yml` goes into git and gets printed into CloudWatch Logs, so you have just exposed the secret in two places.

The right approach is to store secrets in **Secrets Manager** (or SSM Parameter Store SecureString) and reference them in `buildspec` via the `env` block's `secrets-manager`, so CodeBuild pulls them in dynamically at runtime and masks them in the logs. The idea looks like this:

```yaml
env:
  secrets-manager:
    DB_PASSWORD: "my-secret-name:password"
```

Now the app can get the password, but the password **never appears in code, config, or logs**. Remember this role needs permission to read that secret.

:::warning[🚑 Common gotchas (nearly every beginner hits these)]
- **CodeBuild service role missing permissions**: the most common one. The build dies mid-run with `AccessDenied` — e.g. it needs to write the artifact bucket, read Secrets Manager, or deploy to S3/ECR, but the auto-created service role lacks the matching permission. Fix: go to IAM, find that service role, and add the least necessary permission for the action the log says is missing — do not take the lazy route and grant `*`.
- **buildspec phase written wrong**: a misspelled `phases` name (e.g. `builds` instead of `build`), Tab indentation, or a missing `version` makes CodeBuild reject the buildspec as invalid and the build goes red instantly. YAML is extremely sensitive to indentation and spelling — follow the example exactly.
- **artifact not passed through**: a missing `artifacts` block, or a wrong `files` / `base-directory` path, leaves Build green but Deploy receiving an empty parcel with files missing. Before deploying, confirm the files you want to hand to the next stage are actually listed under `artifacts`.
- **secrets written into buildspec**: as above. Passwords, keys, and connection strings always go into **Secrets Manager**, referenced via `secrets-manager`, and are **never** written in plaintext into `buildspec.yml` or code. This is a high-frequency DVA security exam point.
- **forgot to authorize the Source connection**: if the GitHub connection is not authorized, the Source stage stalls unable to fetch code. Go back to the source settings and complete the OAuth/connection authorization.
:::

---

## Clean up resources to avoid charges

:::warning[🧹 Always clean up when done! Not cleaning up keeps charging you]
Be sure to delete everything you created, in this order:

**1. Delete the CodePipeline pipeline**
- Go to `CodePipeline` -> select `cicd-lab-pipeline` -> **Delete** -> type `delete` to confirm.

**2. Delete the CodeBuild build project**
- Go to `CodeBuild` -> Build projects -> select `cicd-lab-build` -> **Delete build project**.

**3. Empty and delete the artifact bucket**
- Go to `S3` -> find the auto-created artifact bucket (name like `codepipeline-your-region-xxxx`) -> open it, select all objects -> **Delete** (a bucket must be emptied before it can be deleted) -> back to the list, select the bucket -> **Delete** -> type the bucket name to confirm.
- If you created a separate site bucket for Deploy, or any test bucket during the lab, clean those up too.

**4. Delete the auto-created IAM service roles**
- Go to `IAM` -> **Roles** -> find the two service roles that CodePipeline and CodeBuild just auto-created -> after confirming nothing else uses them, **Delete**.

**5. (If created) Delete the Secrets Manager secret**
- Go to `Secrets Manager` -> select the secret you created for this lab -> **Delete** (it has a scheduled deletion waiting period, which is normal).
:::

<Cost title="💰 Cost note">

CodePipeline is billed monthly per "active pipeline" (the first pipeline each month usually has a free allowance); CodeBuild is billed per build minute (with a monthly free allowance); the few artifact files sitting in S3 cost next to nothing. What really bites is **a pipeline left undeleted billing month after month**, plus **artifact and site buckets you forgot to clean**. Remember: **if you turn a resource on, remember to turn it off.**

</Cost>

---

## What this means for the exam

DVA Domain 3 (Testing & Deployment) keeps testing the role split of this pipeline, so remember:

- **CodePipeline is the "orchestrator/conductor"**, chaining stages and passing artifacts; **CodeBuild is the "build engine"**, consuming `buildspec.yml` to compile and package; the deploy side is often **CodeDeploy** (EC2/Lambda/ECS) or straight to **S3**. See "chain multiple stages, automate the whole release" and think CodePipeline.
- **`buildspec.yml` lives at the repo root**, using `phases` (install / pre_build / build / post_build) and `artifacts` to define the build and its output — a detail the exam loves.
- **Secrets always go into Secrets Manager / Parameter Store**, referenced rather than hardcoded in code or `buildspec`. "Hardcode the password into an env var/code" is almost always a wrong option.
- See "build failed, find out why" -> the answer is to check **CloudWatch Logs**.

Drill this into a reflex: **CodePipeline conducts, CodeBuild builds, buildspec defines the steps, secrets go into Secrets Manager.**

<Refs title="📚 Official docs & further reading">

- [AWS CodePipeline User Guide](https://docs.aws.amazon.com/codepipeline/latest/userguide/welcome.html)
- [AWS CodeBuild User Guide](https://docs.aws.amazon.com/codebuild/latest/userguide/welcome.html)
- [Build specification reference for CodeBuild](https://docs.aws.amazon.com/codebuild/latest/userguide/build-spec-ref.html)
- [Use Secrets Manager secrets in CodeBuild](https://docs.aws.amazon.com/codebuild/latest/userguide/build-spec-ref.html#build-spec.env.secrets-manager)
- [Monitoring CodeBuild with CloudWatch Logs](https://docs.aws.amazon.com/codebuild/latest/userguide/cloudwatch-logs.html)

</Refs>

Once this pipeline is green, you have turned "push code, it builds and deploys itself" into reality by hand — exactly what DVA wants to confirm you can do.
