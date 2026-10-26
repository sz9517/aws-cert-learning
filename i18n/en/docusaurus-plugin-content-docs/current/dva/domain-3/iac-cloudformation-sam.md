---
sidebar_position: 2
title: Infrastructure as Code (CloudFormation / SAM / CDK)
---

# Infrastructure as Code (IaC): manage cloud resources with code, rebuild anytime

> This article takes a developer's view of the three IaC tools: **CloudFormation** (AWS-native templates, stacks, change sets), **SAM** (serverless-focused, simplified syntax, `sam build`/`deploy`), and **CDK** (write in a real programming language, synthesize into CloudFormation). The focus is on **how to choose among them**, running a template that actually reaches `CREATE_COMPLETE`, and the traps that blow up most often when updating or deleting stacks. This is core DVA-C03 Domain 3 (testing and deployment) material.

<Vocab title="📌 Terms you will see (understandable even if you have never touched them)">

- **Infrastructure as Code (IaC)**: write down "which cloud resources I want (S3 buckets, Lambda, DynamoDB…)" as **text files** and let a tool create them automatically, instead of clicking through the console one by one.
- **Template**: a config file (YAML or JSON) describing "which resources I want and what they look like." It is a **blueprint**, not the resources themselves.
- **Stack**: the **whole group of resources** AWS actually creates from a template, managed as **one unit** — created together, updated together, deleted together.
- **Change Set**: before applying an update, generate a **preview list** of "which resources this change will add, modify, or delete," review it, then execute.
- **Synthesize**: a CDK term. After you write your logic in a programming language, CDK **generates** the equivalent CloudFormation template for you; that process is called synthesis (`cdk synth`).
- **Drift**: after a stack is built, someone goes into the console and **manually changes** one of its resources, so the "actual state" no longer matches what the template says. That gap is called drift.

</Vocab>

:::note[💬 Reading tip]
Whenever you see a term with a <Term desc="Like this! Hover over the dotted underline (tap on mobile) for a plain-language explanation.">dotted underline</Term>, hover over it for a plain-language explanation. All terms are also collected in the [Glossary](/glossary).
:::

## Why do you need IaC? First, a "clicking through the console is a nightmare" story

Say you manually set up an environment in the console: one DynamoDB table, three Lambdas, one API Gateway, a few IAM permissions. It took an afternoon and a hundred clicks, but it finally works.

Then the nightmare begins:

- **Your boss asks you to spin up an identical test environment.** Do you remember what you typed into every field? The read/write capacity? The environment variables? Which policy was attached where? Probably **not all of it**, so the two environments **end up different** — production works fine but the test one misbehaves, and you cannot figure out why.
- **A teammate asks "what resources does this environment even have?"** All you can do is flip through console pages and count them out.
- **You want to tear the environment down.** You have to remember which resources belong to it and delete them one by one; miss one and it **keeps quietly charging you**.

With <Term en="Infrastructure as Code" desc="Write the cloud resources you want as text templates and let a tool create, update, and delete them automatically — version-controlled and reproducible.">IaC</Term>, all of this is solved: write the whole environment as one template → store it in Git (history, code review) → one command builds everything, one command tears it all down. Need another copy? Run the same template with a different name — it is **guaranteed to look identical**. For a developer, infrastructure goes from a "one-off handicraft" to "version-controlled, reproducible code."

<Analogy title="🏢 Analogy: IaC is like a recipe; clicking the console is cooking from memory">

- **Clicking the console = cooking from memory**: tasty this time, but next time you forget how much salt you added — it tastes different every time.
- **Template = a written recipe**: amounts and steps in black and white; anyone who follows it, any number of times, gets the same result.
- **Stack = the full table of dishes made from the recipe**: served together, cleared together.
- **Change Set = posting "this time: more chili, less sugar" before changing the recipe**: everyone reviews and confirms before the pot actually moves.

</Analogy>

## CloudFormation: the AWS-native IaC engine

<Term en="AWS CloudFormation" desc="The AWS-native Infrastructure as Code service: describe resources with YAML/JSON templates and create, update, and delete them as stacks.">CloudFormation (CFN)</Term> is the engine that **does the actual work** underneath — both SAM and CDK end up turning into CloudFormation to execute. You write a template, and CloudFormation creates the resources one by one, remembers which stack they belong to, and handles dependency order (for example, create the IAM role first so the Lambda can reference it).

### Template skeleton: Resources / Parameters / Outputs

A CloudFormation template is mainly made of these sections; the DVA loves to test the first three:

| Section | Purpose | In plain words |
| --- | --- | --- |
| **Resources** (required) | Declares "which resources I want" | The **only required** section in the whole template. No Resources, nothing to build. |
| **Parameters** | Declares "values I can pass in when creating the stack" | Reuse the same template: pass the environment name, table capacity, AMI ID, etc. at stack-creation time instead of hard-coding them. |
| **Outputs** | Declares "which values to report after building" | For example the created S3 bucket name or an API URL. Handy to use, and can be **referenced across stacks**. |
| **Mappings** | Static lookup tables (e.g. AMI per region) | Look up a value by region/environment. |
| **Conditions** | Create resources conditionally | For example "only build this resource in the prod environment." |

```yaml
# template.yaml — a minimal runnable CloudFormation template
AWSTemplateFormatVersion: "2010-09-09"
Description: Creates an S3 bucket whose name comes from a parameter

Parameters:
  BucketName:                      # passed in at stack creation, not hard-coded
    Type: String
    Description: Name of the S3 bucket to create

Resources:
  MyBucket:                        # logical ID (your own alias inside the template)
    Type: AWS::S3::Bucket          # resource type
    Properties:
      BucketName: !Ref BucketName  # !Ref reads the parameter value above

Outputs:
  BucketArn:                       # report the bucket ARN after building
    Description: ARN of the created bucket
    Value: !GetAtt MyBucket.Arn
```

### Stack: manage a whole group of resources as one unit

When you hand a template to CloudFormation, the result is a **stack**. A stack binds that whole group of resources into one unit:

- **Create**: `create-stack` → status goes from `CREATE_IN_PROGRESS` to **`CREATE_COMPLETE`**.
- **Update**: after editing the template, `update-stack`; CloudFormation computes the diff and only touches what changed.
- **Delete**: `delete-stack` → **by default, deletes all resources this stack created** (important — see traps).
- **Rollback on failure**: if a create/update fails midway, CloudFormation by default **rolls back automatically** to the last good state, so you are not left with a half-broken set of resources.

### Change Set: preview "what will be touched" before updating

Running `update-stack` directly is risky — you may not realize a small change will **replace an entire resource** (for example, changing certain DynamoDB properties triggers a "replacement," which deletes and recreates it, and data may be lost). A <Term en="Change Set" desc="A preview CloudFormation generates before an update, listing whether each resource will be added, modified, or replaced; execute only after confirming.">change set</Term> is your insurance:

1. `create-change-set` with the new template → CloudFormation computes "what it will do to each resource."
2. `describe-change-set` to **review the list**, watching especially for `Replacement: True` (resources that will be deleted and recreated).
3. Confirm, then `execute-change-set` to actually apply it.

## SAM: a "simplified CloudFormation" built for serverless

<Term en="AWS Serverless Application Model" desc="A serverless extension of CloudFormation: define Lambda/API Gateway/DynamoDB with much shorter syntax that expands into full CloudFormation at deploy time.">SAM (AWS Serverless Application Model)</Term> is not a separate engine — it is a **serverless extension of CloudFormation**. When it sees `Transform: AWS::Serverless-2016-10-09` on the first line of your template, it **automatically expands** SAM's shorthand into a large block of full CloudFormation at deploy time.

The point is **writing far less**. In plain CloudFormation, a Lambda "with an API trigger, environment variables, and permissions" easily runs to hundreds of lines; SAM handles it with a single `AWS::Serverless::Function` resource and fills in the API Gateway and IAM role for you.

```yaml
# template.yaml (SAM) — an HTTP-triggered Lambda
AWSTemplateFormatVersion: "2010-09-09"
Transform: AWS::Serverless-2016-10-09     # <- this line makes it a SAM template
Description: A Hello Lambda triggered by an API

Resources:
  HelloFunction:
    Type: AWS::Serverless::Function        # SAM's simplified resource type
    Properties:
      CodeUri: ./src/                      # code location
      Handler: app.lambda_handler
      Runtime: python3.12
      MemorySize: 256
      Timeout: 10
      Environment:
        Variables:
          STAGE: dev
      Events:                              # one Events block auto-creates API Gateway
        Api:
          Type: Api
          Properties:
            Path: /hello
            Method: get

Outputs:
  ApiUrl:
    Description: Call this URL to test
    Value: !Sub "https://${ServerlessRestApi}.execute-api.${AWS::Region}.amazonaws.com/Prod/hello"
```

SAM also ships a CLI that makes local development smoother:

- **`sam build`**: installs dependencies and packages your code and template into deployable artifacts (in `.aws-sam/`).
- **`sam deploy`**: uploads the built artifacts and **actually deploys them as a CloudFormation stack**. The first time, `sam deploy --guided` asks for stack name, region, etc. and saves them to `samconfig.toml`; after that just `sam deploy`.
- **`sam local invoke` / `sam local start-api`**: uses Docker to **simulate** Lambda and the API **locally**, so you do not have to go to the cloud for every test.

## CDK: write infrastructure in a language you already know

<Term en="AWS Cloud Development Kit" desc="Define cloud resources in a general-purpose language like TypeScript/Python/Java, then synthesize into a CloudFormation template to deploy.">CDK (Cloud Development Kit)</Term> brings IaC into a world you know: instead of YAML, you write **TypeScript / Python / Java / C# / Go**. You assemble resources with loops, functions, conditionals, and object encapsulation, and CDK **synthesizes** it into a standard CloudFormation template for AWS to execute. So underneath, CDK **still runs CloudFormation**.

For developers used to writing code, the appeal of CDK is: IDE autocomplete, reusable components (wrap "a standard API + Lambda + table" into a reusable Construct), and logic that avoids copy-pasting large blocks of YAML.

```python
# app.py (CDK, Python) — one S3 bucket + one Lambda
from aws_cdk import App, Stack, CfnOutput
from aws_cdk import aws_s3 as s3
from aws_cdk import aws_lambda as _lambda
from constructs import Construct

class MyStack(Stack):
    def __init__(self, scope: Construct, id: str, **kwargs):
        super().__init__(scope, id, **kwargs)

        bucket = s3.Bucket(self, "MyBucket")   # one line is one S3 bucket

        fn = _lambda.Function(
            self, "HelloFn",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="app.handler",
            code=_lambda.Code.from_asset("src"),
            environment={"BUCKET": bucket.bucket_name},
        )
        bucket.grant_read(fn)                    # one line wires up the IAM read permission

        CfnOutput(self, "BucketName", value=bucket.bucket_name)

app = App()
MyStack(app, "MyStack")
app.synth()                                      # synthesize into a CloudFormation template
```

Common CDK commands: `cdk synth` (synthesize into a CFN template and take a look), `cdk diff` (compare against what is live in the cloud, like a change set), `cdk deploy` (deploy — underneath it creates a CloudFormation stack), `cdk destroy` (delete the stack).

## How to choose: why use it, pros, cons, and when to use which

This is the most important fixed section of the article. All three **run on CloudFormation underneath**; the difference is "how you describe resources."

### CloudFormation

- **Why use it**: AWS-native, no extra language runtime needed, and every AWS resource is supported from day one. It is the layer closest to the metal; SAM and CDK both turn into it in the end.
- **Pros**: most complete and stable coverage; pure config (YAML/JSON) with no program logic, so reviews are simple; works across teams.
- **Cons**: **verbose** — a complex architecture easily runs to thousands of lines; no loops or abstraction, so repeated things are copy-pasted; pure YAML makes conditions and computation awkward.
- **When to use it**: the team prefers purely declarative config and does not want a language dependency; or when you need the newest resource property that SAM/CDK has not caught up to yet — writing CFN directly is safest.

### SAM

- **Why use it**: cures "writing CloudFormation for serverless apps is too wordy." One `AWS::Serverless::Function` saves dozens of lines of boilerplate, plus you get local simulation and an all-in-one `build`/`deploy` toolchain.
- **Pros**: **extremely concise syntax** for serverless; `sam local` lets you test Lambda/API locally; `sam deploy --guided` is beginner-friendly; still CloudFormation, so it mixes with native resources.
- **Cons**: **serverless-focused** (Lambda/API Gateway/DynamoDB…), so it has no advantage for large non-serverless architectures (VPCs, EC2 fleets); still YAML, so complex logic is still hard to express.
- **When to use it**: your project is a serverless app like Lambda + API Gateway + DynamoDB and you want the fastest path with the least boilerplate — **SAM is the first choice**.

### CDK

- **Why use it**: lets you "write infrastructure" and "write applications" in the same language and toolchain (IDE, tests, package management). You can abstract, reuse, and write logic — goodbye to copy-pasting YAML.
- **Pros**: a general-purpose language (TS/Python…) plus IDE autocomplete; high-level Constructs come with **best-practice defaults** (e.g. wiring up permissions for you); loops/functions drastically cut duplication; you can write unit tests to verify infrastructure.
- **Cons**: **steeper learning curve** (you need the language + CDK concepts + the CFN it synthesizes); an extra layer of abstraction means that when things break, you go back to the synthesized template to see what really happened; more dependencies (Node.js runtime, CDK version upgrades).
- **When to use it**: the team are software developers, the infrastructure is complex and repetitive, and you want to treat infrastructure as real, testable, reusable code — **choose CDK**.

:::info[🔑 One sentence to remember the choice]
**Everything runs on CloudFormation underneath.** Pure serverless with minimal boilerplate → **SAM**; manage complex architecture in a programmatic style (abstraction/loops/reuse) → **CDK**; closest to the metal, most complete coverage, purely declarative → **CloudFormation**.
:::

## Real-world use: not just for the exam

<Scenario title="Real scenario: spin up disposable test environments from one template">

You want a separate test environment per feature branch, torn down entirely after testing — no leftover junk and no silent charges. Approach: write the whole thing (Lambda + API + DynamoDB) as one SAM template, using `Parameters` to pass the branch name as both the stack name and a resource prefix. For each branch, CI runs `sam deploy --stack-name test-featureX` to build one; after the feature merges, `aws cloudformation delete-stack --stack-name test-featureX` clears the whole thing in one line. Because it is the same template, **every environment is guaranteed to look identical**, so you never again get "works in test, blows up in prod."

</Scenario>

### 🛠️ Hands-on: deploy a Lambda + API with SAM and see CREATE_COMPLETE

> Prereqs: install the [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) and AWS credentials (`aws configure`).

```bash
# 1) Initialize a Hello World project (Python) from the official template
sam init --runtime python3.12 --name sam-hello \
  --app-template hello-world --no-interactive
cd sam-hello

# 2) Build: install dependencies, package into deployable artifacts (output to .aws-sam/)
sam build

# 3) First deploy uses guided mode: fill in stack name, region, confirm the change set
sam deploy --guided
#   Stack Name       -> sam-hello
#   AWS Region       -> ap-northeast-1
#   Confirm changes  -> Y   (lets you review the change set before deploying)
#   Allow IAM role creation -> Y
#   Settings are saved to samconfig.toml; afterward just run `sam deploy`
```

**Expected result**: the terminal first prints a **change set** (listing the `+ Add` Lambda, API, and IAM role); after you confirm, deployment begins. On success you see something like:

```text
CloudFormation events from stack operations
-------------------------------------------------------------------
Status                  ResourceType            LogicalResourceId
-------------------------------------------------------------------
CREATE_IN_PROGRESS      AWS::Lambda::Function    HelloWorldFunction
CREATE_COMPLETE         AWS::Lambda::Function    HelloWorldFunction
CREATE_COMPLETE         AWS::ApiGateway::...     ServerlessRestApi
CREATE_COMPLETE         AWS::CloudFormation::Stack  sam-hello
-------------------------------------------------------------------

Outputs
-------------------------------------------------------------------
Key                 HelloWorldApi
Description         API Gateway endpoint URL
Value              https://abc123.execute-api.ap-northeast-1.amazonaws.com/Prod/hello/
-------------------------------------------------------------------
Successfully created/updated stack - sam-hello in ap-northeast-1
```

When the whole stack reaches **`CREATE_COMPLETE`** and prints the **API URL in Outputs**, it worked. Copy that URL and `curl` it to get `{"message": "hello world"}`.

```bash
# 4) Verify (replace the URL with the Outputs value above)
curl https://abc123.execute-api.ap-northeast-1.amazonaws.com/Prod/hello/

# 5) Clean up: delete the whole stack and all its resources at once (stop the charges)
sam delete --stack-name sam-hello
```

<Cost title="💰 Cost note">

**The IaC tools themselves are free** — CloudFormation, SAM, and CDK cost nothing; you only pay for the **resources they create** (Lambda invocations, API Gateway requests, DynamoDB capacity…). So the biggest cost trap is "**built it and forgot to delete it**": after practicing, always `sam delete` or `aws cloudformation delete-stack` to clear the whole stack. The good news is IaC makes cleanup trivial — one line deletes everything, far more reliable than hunting resources down by hand. Also note: if a resource has `DeletionPolicy: Retain`, deleting the stack will **not** delete it and it **keeps charging you** (see the trap below).

</Cost>

:::warning[🚑 Common traps]
- **Running `update-stack` without reviewing a change set**: changing certain properties triggers **resource replacement** = delete and recreate = all data gone. Before updating, always `create-change-set` → `describe-change-set` to check for `Replacement: True`, then execute.
- **Deleting a stack = deleting all resources inside it**: `delete-stack` by default removes **every resource the stack created**. For resources where "deleted means gone for good" (databases, S3 buckets), add **`DeletionPolicy: Retain`** (keep it when the stack is deleted) or `Snapshot` (back up before deleting) to avoid wiping production data by accident.
- **The flip side of `DeletionPolicy: Retain`**: a resource set to Retain is **left behind** when the stack is deleted, so it **keeps billing** and can block recreating something with the same name. Remember to clean it up manually when the time comes.
- **Drift**: someone goes into the console and manually changes a resource in the stack, so the template and reality no longer match. A later stack update may **overwrite** their manual change or behave strangely. Run **drift detection** periodically and insist on "always change the template, never touch the console by hand."
- **Hard-coding secrets in the template**: putting a password or API key straight into the template = plaintext in Git = leaked. Use **Secrets Manager / SSM Parameter Store** and store only a **reference** in the template (e.g. `{{resolve:secretsmanager:...}}`), never the value.
- **Assuming rollback always saves you**: a failed create rolls back automatically and cleans up the half-built resources; but a failed update rollback can get stuck in `UPDATE_ROLLBACK_FAILED`, needing a manual `continue-update-rollback` or excluding the problem resource. Do not treat rollback as a cure-all; run important updates through a change set first.
- **Running SAM `deploy` without `sam build`**: you changed code but did not rebuild, so you deploy the old version. The order is always `sam build` → `sam deploy`.
:::

<Refs title="📚 Official docs & further reading">

- [AWS CloudFormation User Guide](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/Welcome.html)
- [CloudFormation template anatomy (Resources / Parameters / Outputs)](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/template-anatomy.html)
- [Updating stacks using change sets](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-updating-stacks-changesets.html)
- [AWS SAM Developer Guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html)
- [AWS CDK Developer Guide](https://docs.aws.amazon.com/cdk/v2/guide/home.html)
- [Detecting stack drift (Drift Detection)](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-stack-drift.html)

</Refs>

## Next steps

👉 Next: [Deployment Strategies](./deployment-strategies.md)
