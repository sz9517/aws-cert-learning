---
sidebar_position: 1
title: AWS Lambda (Serverless Compute)
---

# AWS Lambda: upload a piece of code, it runs only on events, billed per millisecond

> This article takes a developer's view of Lambda: how to write the handler, event, and context; what a cold start is; how memory scales CPU; how versions and aliases enable traffic shifting; concurrency and throttling; trigger sources; permissions; and the retry behaviour of synchronous, asynchronous, and event source mapping invocations. These are exactly the development details DVA-C03 Domain 1 loves to test, deeper than SAA.

<Vocab title="📌 Terms you will meet here (clear even if brand new)">

- **Serverless**: not that there are literally no servers, but that AWS manages them for you. You just write code and upload it, with no booting, patching, or manual scaling.
- **Function**: the piece of code you upload to Lambda, packaged together with its settings (memory, timeout, environment variables). That is a Lambda function.
- **Event**: the bundle of data that triggers a function run. For example, someone uploading a file to S3 becomes a JSON event handed to your function.
- **Handler**: the entry point of your function. When AWS receives an event, it calls this method and passes the event to you.
- **Execution Environment**: a small secure sandbox AWS prepares to run your function, with the runtime and your code loaded. It gets reused, which is the key to understanding cold starts.
- **Concurrency**: how many function instances run at the same instant. A burst of 100 events may mean 100 instances running at once.

</Vocab>

:::note[💬 Reading tip]
Whenever you see a term with a <Term desc="Like this! Hover over the dotted underline (tap on mobile) to see a plain explanation.">dotted underline</Term>, hover over it for a plain explanation. All terms are also collected in the [Glossary](/glossary).
:::

## Why Lambda? First, an example of how tiring it is to run your own server

Say you want a feature that automatically creates a thumbnail when a user uploads an image. The traffic is very uneven: sometimes a few images an hour, sometimes a sudden surge of thousands.

If you keep an <Term en="Elastic Compute Cloud" desc="AWS virtual server; you rent a whole machine and pay while it is on.">EC2</Term> instance running all day to wait, it burns money idling when no one uploads, and a single machine cannot cope when thousands arrive. On top of that, OS updates, security patching, and capacity planning are all on you.

<Term en="AWS Lambda" desc="Serverless compute service; runs your code only on events, billed by actual run time and memory, and charges nothing when idle.">Lambda</Term> fits almost perfectly: it runs only when an image is uploaded, charges nothing when idle, scales instantly to thousands of instances, and you never touch a server. For a developer, the focus shifts from how to keep a machine alive to how to write this piece of code well.

## Understand how Lambda works in one line

You write a function (the handler), set its memory, timeout, and environment variables, and deploy it. From then on, whenever an event happens (an S3 upload, an API request, a message arriving in a queue), AWS spins up an execution environment, calls your handler, and passes the event in. Your code runs, returns a result, and AWS charges by the actual milliseconds run times the memory.

<Analogy title="🏢 Analogy: Lambda is like a chef in a delivery kitchen">

- **Your function = a chef's recipe**: you only hand over the recipe (code) and how big a kitchen you need (memory); you do not build the kitchen.
- **Event = an order ticket**: only when an order arrives (an event) does the platform call a chef to cook; it costs nothing when there are no orders.
- **Concurrency = how many chefs work at once**: a burst of 100 orders makes the platform call 100 chefs (100 execution environments), each cooking one dish.
- **Cold start = the chef must heat the pan first**: after a long quiet spell, the first chef has to enter the kitchen, heat the pan, and lay out ingredients (start the execution environment and load the code), so the first dish is a bit slower; after that the same chef keeps cooking and it is fast.

</Analogy>

## Core 1: handler, event, context

Every Lambda function has a handler, the entry point AWS calls into your code. The handler receives two parameters:

- **event**: the data that triggered this run (a JSON bundle). Its contents depend on the trigger source: from API Gateway it is an HTTP request, from S3 it is object info, from SQS it is a batch of messages.
- **context**: runtime information for this invocation, such as how much timeout remains (`getRemainingTimeInMillis()`), the request ID (`awsRequestId`), the function name, and the memory limit.

```js
// Node.js example: index.handler
exports.handler = async (event, context) => {
  console.log('Received event:', JSON.stringify(event));
  console.log('Remaining time (ms):', context.getRemainingTimeInMillis());

  // your business logic
  const result = doSomething(event);

  // async handler: the return value is the response; throwing is treated as failure
  return {
    statusCode: 200,
    body: JSON.stringify(result),
  };
};
```

:::info[🔑 Handler naming rule]
When you deploy, you tell Lambda where the handler is, in the form filename.exportedMethod. For example, `exports.handler` in `index.js` is set as `index.handler`. Python uses filename.functionName (such as `lambda_function.lambda_handler`). Getting it wrong gives you `Unable to import module` or `Handler not found` errors.
:::

## Core 2: execution environment lifecycle and cold start

The key to understanding performance and billing is how the execution environment gets reused. One run has three phases:

1. **Init**: AWS creates the execution environment, downloads your code, loads the runtime, and runs the initialization code outside the handler (such as opening a database connection or reading config).
2. **Invoke**: your handler body runs and processes this event.
3. **Shutdown**: after some idle time, AWS reclaims the execution environment.

When there is no reusable execution environment (for example after a long quiet spell, or when a concurrency spike needs more instances), a full Init must happen, and that extra latency is the <Term en="Cold Start" desc="When Lambda has no reusable execution environment, the first invocation must build one and load code, making the first response slower.">cold start</Term>. When the same environment is called again, it skips Init; that is a warm start, and it is much faster.

```js
// ✅ Put "open connection, read config" outside the handler (the Init phase).
// These run once per cold start and get reused on warm starts, saving time.
const db = createDbConnection(process.env.DB_URL);

exports.handler = async (event) => {
  // keep only "do it every time" logic inside the handler
  return db.query(event.id);
};
```

:::tip[💡 Exam focus: how to mitigate cold starts]
- **Provisioned Concurrency**: pre-initializes and keeps a set number of execution environments on standby, so invocations land warm. This is the common answer for low-latency, predictable traffic, such as user-facing APIs.
- **Move heavy work outside the handler**: open connections, build SDK clients, and read config once during Init.
- **Pick the right runtime and slim the deployment package**: smaller package and fewer dependencies mean faster Init.
- Note: Reserved Concurrency does not reduce cold starts; it only reserves a quota. What keeps environments warm is Provisioned Concurrency. Do not confuse the two.
:::

## Core 3: memory, CPU, timeout, environment variables, /tmp, deployment limits, Layers

This section is full of the configuration details DVA loves:

| Setting | Explanation and exam points |
| --- | --- |
| **Memory** | 128 MB to 10,240 MB. CPU scales with memory: more memory means more vCPU. CPU-bound functions often run faster and cheaper with more memory. |
| **Timeout** | Maximum 15 minutes (900 seconds) per run. Beyond that it is forcibly stopped. Long-running work does not fit Lambda. |
| **Environment Variables** | Inject settings (such as a table name or API endpoint) as <Term en="Environment Variables" desc="Key-value settings injected into the function config, read via process.env / os.environ, instead of hardcoding.">environment variables</Term>, read with `process.env.X` (Node) or `os.environ['X']` (Python). Sensitive values can be encrypted with KMS. |
| **/tmp scratch space** | Each execution environment has a writable `/tmp`, 512 MB by default, up to 10,240 MB. Note it gets reused with the environment, so do not treat it as clean space. |
| **Deployment package size** | Direct zip upload: 50 MB (compressed); unzipped with Layers up to 250 MB. Beyond that, deploy as a container image (up to 10 GB). |
| **Lambda Layers** | Extract shared dependencies or libraries into a <Term en="Lambda Layers" desc="Shared library/dependency package reusable across functions, keeping deployment packages small and dependencies centralized.">Layer</Term> shared across functions, keeping each function's package small. A function can stack up to 5 layers. |

:::warning[🚑 Memory is not only about memory]
Many people think "my function does not use much memory, so 128 MB is fine" and then it runs very slowly. The reason is that lower memory also means less CPU. For CPU-bound work, raising memory from 128 MB to 1024 MB often cuts run time to a fifth, which can lower the bill. Use the AWS Lambda Power Tuning tool to find the sweet spot.
:::

## Core 4: versions and aliases (versions / aliases, $LATEST)

Every time you change code and deploy, you change the mutable $LATEST version. But production should not point at an ever-changing $LATEST, so you use versions and aliases:

- **Version**: an immutable snapshot of the current code and config, given a number (1, 2, 3, and so on). Once published it is frozen and never changes.
- **Alias**: a movable pointer to a version, such as `prod` to version 3 and `dev` to $LATEST. Callers only know the alias, and you swap the version behind it.

<Analogy title="🏢 Analogy: a version is a save file, an alias is a bookmark">

- **$LATEST = the draft you are editing**: you keep changing it.
- **Version = a save point**: pressing publish stores an unchangeable file (version 1, 2, 3).
- **Alias = a bookmark stuck on some save file**: the `prod` bookmark is on version 3 now; to ship a new release you peel it off and stick it on version 4, and users never feel the switch details.

</Analogy>

**Traffic shifting with aliases (canary / blue-green)**: an alias can point to two versions at once with weights, such as `prod` sending 10 percent of traffic to version 4 and keeping 90 percent on version 3. Once it looks fine, you raise it gradually to 100 percent.

```bash
# Publish a new version (snapshot of $LATEST)
aws lambda publish-version --function-name my-func

# Create/update the prod alias to point at version 3
aws lambda create-alias \
  --function-name my-func \
  --name prod \
  --function-version 3

# Weighted traffic shifting: 90% version 3, 10% version 4 (canary)
aws lambda update-alias \
  --function-name my-func \
  --name prod \
  --function-version 3 \
  --routing-config AdditionalVersionWeights={"4"=0.1}
```

## Core 5: concurrency and throttling

<Term en="Concurrency" desc="The number of Lambda instances running at the same instant; a burst of events opens many instances at once.">Concurrency</Term> means the number of function instances running at the same instant. Each account has a concurrency limit per region (commonly 1,000 by default, raisable on request). Two concurrency settings must be kept apart:

| Type | Effect | When to use |
| --- | --- | --- |
| **Reserved Concurrency** | Reserves a slice of quota for a function, which is also its limit. It guarantees supply and prevents it from eating the whole account quota and starving others. | To protect a function from starvation, or to cap how many instances a function may open (such as when a downstream database cannot cope) |
| **Provisioned Concurrency** | Pre-initializes and keeps N environments warm, so invocations hit a warm environment. | For low-latency, no-cold-start, predictable traffic |

When incoming events exceed available concurrency, <Term en="Throttling" desc="A protection mechanism that temporarily rejects or queues requests when concurrency exceeds the limit.">throttling</Term> happens. A throttled synchronous invocation returns HTTP 429 `TooManyRequestsException` to the caller; asynchronous and event source mapping invocations retry automatically.

:::tip[💡 Exam focus: handling 429]
- Seeing `429 TooManyRequests` / `TooManyRequestsException` means concurrency is throttled; the fix is to raise the concurrency limit or set Reserved Concurrency for a critical function.
- Synchronous callers (such as an SDK direct `Invoke`) must do their own retry with exponential backoff when throttled.
- To guarantee low latency with no cold start, use Provisioned Concurrency; to cap or reserve a function's concurrency, use Reserved Concurrency.
:::

## Core 6: trigger sources (who invokes your function)

<div className="flow">
  <div className="flow-node">API Gateway (HTTP request, synchronous)</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">S3 events (upload/delete, asynchronous)</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">SQS queue (event source mapping, Lambda polls)</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">EventBridge (schedule/rule, asynchronous)</div>
</div>

- **API Gateway**: turns an HTTP request into an event and invokes Lambda synchronously, waiting for the return before responding to the user. This is the classic serverless API combo.
- **S3**: emits an event when an object is created or deleted, invoking Lambda asynchronously (such as auto-generating a thumbnail on upload).
- **SQS**: this is an event source mapping; the Lambda service actively polls the queue and pulls messages in batches to invoke your function (see the next section).
- **EventBridge**: triggers asynchronously on a schedule (cron-like) or after matching a rule, often used for timed tasks and event routing.

## Core 7: permissions, execution role vs resource-based policy

Lambda permissions run in two directions, and DVA loves testing whether you can tell them apart:

- **Execution Role**: the IAM role the function itself uses, deciding which AWS resources this function can act on (such as reading an S3 bucket, writing DynamoDB, sending CloudWatch logs). This is the function's outbound permission.
- **Resource-based Policy**: a policy attached to the function, deciding who may invoke this function (such as allowing a certain S3 bucket or API Gateway to trigger it). This is the inbound permission others use to call it.

<Analogy title="🏢 Analogy: an employee badge vs a visitor list">

- **Execution role = the employee badge**: it decides which rooms this employee (the function) can enter in the building (S3, DynamoDB).
- **Resource-based policy = the visitor list at this office door**: it decides which outsiders (S3, API Gateway) are allowed in to call on you (invoke you).

</Analogy>

:::info[🔑 A very common pitfall]
"My function cannot read S3" is usually the execution role missing a permission; "the S3 event did not trigger my function" is usually the resource-based policy not allowing S3 to call it. Mix up the direction and you will debug forever. When you add a trigger in the console, AWS often adds the matching resource-based policy for you; with the CLI or IaC you must `add-permission` yourself.
:::

## Core 8: error handling and retries (synchronous vs asynchronous vs event source mapping)

This is a high-frequency DVA topic, and the retry behaviour of the three invocation models differs completely:

| Invocation model | Typical sources | Retry behaviour on failure |
| --- | --- | --- |
| **Synchronous** | API Gateway, SDK `Invoke` | Lambda does not retry automatically. The error goes straight back to the caller, and the caller decides whether to retry (with exponential backoff). |
| **Asynchronous** | S3, EventBridge, SNS | Lambda retries automatically twice (3 attempts total), with growing intervals. After all fail, it can send to a DLQ (dead-letter queue) or an on-failure destination to keep the failed event. |
| **Event source mapping** | SQS, Kinesis, DynamoDB Streams | Lambda actively polls the source and takes events in batches. SQS batch failures retry per queue settings and go to the SQS DLQ after the limit; Kinesis / DynamoDB Streams get stuck retrying the failed batch until it succeeds or expires (you can configure batch retries and bisect to isolate a bad message). |

:::tip[💡 Exam focus: retry keyword cheat sheet]
- "Do not drop messages when an S3 event trigger fails" / "keep the event when an async invocation fails" means set a DLQ or on-failure destination (async retries twice before going to the DLQ).
- "API Gateway to Lambda occasionally fails and needs retry" means synchronous Lambda does not retry automatically, so do retry with exponential backoff on the caller side.
- "SQS message processing fails" is event source mapping, handled by SQS redelivery and DLQ (`maxReceiveCount`).
- Design functions to be <Term en="Idempotency" desc="Processing the same event multiple times causes no duplicate side effects, so retries are safe.">idempotent</Term>, because retries may process the same event more than once.
:::

## Real-world use: not just for the exam

<Scenario title="Real scenario: use an alias to ramp a new version slowly, not all at once">

Your order-processing Lambda sits behind API Gateway with heavy production traffic. The boss wants to ship a new version with changed payment logic, but you fear it will blow up on release. The approach: point API Gateway at the `prod` alias (not a fixed version), first `publish-version` to release version 4, then `update-alias` to set `prod` to 90 percent version 3 and 10 percent version 4. Watch the CloudWatch error rate for ten minutes, and if it is fine, raise version 4's weight to 100 percent. Throughout, the caller's API address never changes.

</Scenario>

### 🛠️ Hands-on: create a function, publish a version, set an alias

```bash
# 1) Create the function from a zip (specify execution role and handler)
aws lambda create-function \
  --function-name order-processor \
  --runtime nodejs20.x \
  --role arn:aws:iam::111122223333:role/lambda-exec-role \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --memory-size 512 \
  --timeout 30 \
  --environment "Variables={TABLE_NAME=orders}"

# 2) After changing code, redeploy to $LATEST
aws lambda update-function-code \
  --function-name order-processor \
  --zip-file fileb://function.zip

# 3) Publish as an immutable version (snapshot)
aws lambda publish-version --function-name order-processor

# 4) Create the prod alias pointing at version 1
aws lambda create-alias \
  --function-name order-processor \
  --name prod \
  --function-version 1

# 5) Allow API Gateway to invoke this alias (resource-based policy)
aws lambda add-permission \
  --function-name order-processor:prod \
  --statement-id apigw-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com
```

<Cost>

Lambda has a monthly free tier (1 million requests plus 400,000 GB-seconds), so bursty work often costs nothing. Charges follow request count times run milliseconds times memory, so raising memory to run faster is sometimes cheaper. But note that Provisioned Concurrency keeps billing (to keep environments warm), so turn it on only when you truly need low latency, not all day long. After practising, remember to clean up the test functions and triggered resources.

</Cost>

:::warning[🚑 Common real-world mistakes]
- **Putting heavy work inside the handler**: database connections and SDK clients belong outside the handler (the Init phase); inside, they rebuild on every invocation, slow and wasteful.
- **Pointing production directly at $LATEST**: it keeps changing, so there is no version control. Production should always point at an alias.
- **Thinking Reserved Concurrency removes cold starts**: that is Provisioned's job; Reserved is only a quota floor and ceiling.
- **Assuming synchronous invocations retry automatically**: synchronous does not, so the caller must retry.
- **Setting timeout too short or too long**: too short cuts off normal work; too long burns money on errors (15 minutes max).
- **Forcing long-running work into Lambda**: anything over 15 minutes must fail; use containers or Step Functions to split the steps.
- **Storing plaintext passwords in environment variables**: encrypt sensitive values with KMS, or use Secrets Manager / Parameter Store.
:::

<Refs title="📚 Official docs & further reading">

- [AWS Lambda Developer Guide](https://docs.aws.amazon.com/lambda/latest/dg/welcome.html)
- [Lambda function versions and aliases](https://docs.aws.amazon.com/lambda/latest/dg/configuration-versions.html)
- [Lambda concurrency (Reserved / Provisioned)](https://docs.aws.amazon.com/lambda/latest/dg/lambda-concurrency.html)
- [Lambda execution environment lifecycle and cold start](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtime-environment.html)
- [Lambda error handling and automatic retries](https://docs.aws.amazon.com/lambda/latest/dg/invocation-retries.html)

</Refs>

## Next

👉 Next: [API Gateway — Build APIs](./api-gateway.md)
