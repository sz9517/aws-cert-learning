---
sidebar_position: 6
title: "Lab 6: Serverless API (Lambda + API Gateway + DynamoDB)"
---

# Lab 6: Build a Serverless To-Do API (Lambda + API Gateway + DynamoDB)

> This lab wires together the three things that sit at the heart of **DVA (Developer)**, all in one go: **API Gateway takes the HTTP request → Lambda runs your code → DynamoDB stores the data**. The whole time you **touch no servers** — no OS to patch, no scaling to manage. That's the feel of "serverless". When you're done you'll have a real To-Do API you can hit with `curl`. Everything stays inside the Free Tier, and remember to clean up when you're done.

<Vocab title="📌 Jargon you'll see on this page (fine even if you've never touched AWS)">

- **Serverless**: you only write code and only pay for actual execution; the underlying machines, OS, and scaling are all managed by AWS. It's not "no servers" — it's "no servers for you to manage".
- **Lambda Function**: a chunk of code that only runs when an event triggers it. When nobody calls it, it costs nothing and occupies no machine.
- **API Gateway (HTTP API)**: opens a public endpoint for your Lambda and forwards incoming HTTP requests to it.
- **DynamoDB**: AWS's fully managed NoSQL database. It stores data via a Table plus a Primary Key, and scales automatically by design.
- **Execution Role**: the IAM role your Lambda "assumes" while it runs. It decides **which AWS services this function can touch**. Without DynamoDB permissions, the function cannot read from or write to the table.
- **Proxy Integration**: API Gateway hands the whole request to Lambda untouched, and in return requires Lambda to reply with a **specific JSON shape**. Get the shape wrong and you get a 500.

</Vocab>

:::note[💬 Reading tip]
When you see a term with a <Term desc="Like this! Hover over any dotted-underline term (tap on mobile) to see a plain-English explanation.">dotted underline</Term>, hover over it for a plain-English explanation. All terms are also collected in the [Glossary](/glossary).
:::

:::info[Before you start]
This lab assumes some basic groundwork:

- You have an AWS account and have already **set up a Billing Alarm** so you get notified if spending crosses a threshold.
- You know how to switch **Region** in the console. Keep the whole lab in one Region (e.g. "Asia Pacific (Tokyo) ap-northeast-1") so you don't lose track of your resources.
- You can read a little Node.js or Python (this lab uses Node.js 20; the code is short — just copy it).

These are your safety nets — especially the billing alarm. Set it up first.
:::

---

## Scenario: build a To-Do API

We'll build a tiny but complete To-Do backend that exposes just two actions:

- `POST /items`: add a to-do item (send a bit of JSON).
- `GET /items`: list all current to-do items.

Imagine you're writing the backend for a frontend app. The traditional way means renting an EC2, installing Node, installing a database, setting it to start on boot, and still worrying about it crashing at 3am. The serverless way is: **data in DynamoDB, logic in Lambda, entrance in API Gateway** — all three fully managed, costing almost nothing when idle, and absorbing sudden bursts on their own.

### Here's the architecture

<div className="flow">
  <div className="flow-node">User / curl</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">API Gateway (HTTP API)</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Lambda function</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">DynamoDB table</div>
</div>

*Figure: the request comes in from the left, API Gateway hands it to Lambda, Lambda runs your code to read/write DynamoDB, and the result flows all the way back. Nowhere in this chain is there a machine you have to switch on or off yourself.*

:::info[🤔 Why these choices: each service plays its part]
- **Why Lambda instead of EC2?** This API usually has little traffic. An EC2 would bill you 24/7 and leave you managing patches and scaling. Lambda **doesn't run — or charge — when nobody calls it**, and spins up extra copies automatically under load. For a small backend with sporadic traffic, it's the most economical.
- **Why DynamoDB instead of RDS?** A to-do item is a simple "look up one record by key" — no complex JOINs needed. DynamoDB is fully managed, auto-scaling, and **can be set to pay-per-use**, pairing beautifully with Lambda. RDS would need an instance on standby 24/7, which is both pricier and overkill here.
- **Why API Gateway's HTTP API (not REST API)?** Both can expose a Lambda as a URL, but **HTTP API is cheaper, simpler, and lower latency** — more than enough for a plain proxy-to-Lambda setup. The REST API's advanced features (usage plans, request-mapping templates, etc.) we simply don't need this time.
:::

---

## Hands-on: build the API in four steps

### Step 1: Create a DynamoDB table

1. In the console search bar, type `DynamoDB` → open DynamoDB → click **Create table**.
2. **Table name**: `todo-items`.
3. **Partition key**: `id`, type **String**. Leave the sort key empty.
4. Under **Table settings** choose **Customize settings**, and for **Capacity mode** choose **On-demand**.
5. Leave everything else at the **defaults** → **Create table**.

:::info[🤔 Why this way: the primary key and On-demand billing]
- **Why specify the partition key `id`?** DynamoDB uses the primary key to decide "where each item lives and how to fetch it back". Giving every to-do item a unique `id` (generated automatically in the Lambda shortly) lets us address a single item precisely by `id`.
- **Why pick "On-demand" over "Provisioned"?** On-demand is **pay-per-use** — near-free when idle, with no need to estimate read/write capacity up front. It's ideal for "sporadic, unpredictable" practice and small projects. Provisioned mode makes you buy fixed capacity in advance: estimate too low and you get throttled; too high and you waste money. No reason to take that on while practising.

**What you should see**: the table list shows `todo-items`, with **Status** starting at `Creating` and turning `Active` after a few seconds. Only once it's `Active` is it ready to use.
:::

### Step 2: Create a Lambda function (with code)

1. Console search `Lambda` → open Lambda → **Create function**.
2. Choose **Author from scratch**.
3. **Function name**: `todo-api`.
4. **Runtime**: **Node.js 20.x**.
5. Leave the rest at the **defaults** → **Create function**. (AWS quietly creates a basic execution role for you here; we'll add DynamoDB permissions in the next step.)
6. Once created, in the **Code source** panel replace the entire contents of `index.mjs` with the code below, then click **Deploy**:

```javascript
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);
const TABLE = "todo-items";

export const handler = async (event) => {
  const method = event.requestContext?.http?.method;

  try {
    if (method === "POST") {
      // Read the to-do content the frontend sent in the request body
      const body = JSON.parse(event.body || "{}");
      const item = {
        id: randomUUID(),
        task: body.task || "(untitled)",
        done: false,
      };
      await ddb.send(new PutCommand({ TableName: TABLE, Item: item }));
      return reply(201, { message: "created", item });
    }

    if (method === "GET") {
      // Scan out every to-do item in the table
      const result = await ddb.send(new ScanCommand({ TableName: TABLE }));
      return reply(200, { items: result.Items || [] });
    }

    return reply(405, { message: "method not allowed" });
  } catch (err) {
    console.error(err);
    return reply(500, { message: "server error", error: String(err) });
  }
};

// Lambda proxy integration requires this exact shape; body MUST be a string
function reply(statusCode, data) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  };
}
```

:::info[🤔 Why this way: what the code does and why it looks like this]
- **Why use `DynamoDBDocumentClient`?** It lets you work with plain JavaScript objects (`{ id, task, done }`) instead of hand-writing the `{ "S": "..." }` typed format, keeping the code far cleaner.
- **Why branch on `event.requestContext.http.method`?** Because we're on the HTTP API's proxy integration, the request method lives in that field. Using it to tell `GET` from `POST` lets one function handle both actions.
- **Why wrap the response as `{ statusCode, headers, body }`, with `body` run through `JSON.stringify`?** This is the **mandatory shape of the Lambda proxy integration**. API Gateway expects exactly this, and `body` must be a **string**. Returning a raw object (e.g. `return item`) leaves API Gateway unsure how to translate it, and the caller gets a 500.
- **Why no need to install the AWS SDK?** The Node.js 20 Lambda runtime **bundles** AWS SDK v3 (`@aws-sdk/*`), so you can `import` it directly without packaging `node_modules`.

**What you should see**: after clicking **Deploy**, a green "Successfully updated the function todo-api" banner appears above the code panel. The function now has code but **still can't touch DynamoDB** (permissions come next).
:::

### Step 3: Grant the execution role DynamoDB permissions

When you created the function, AWS auto-created an **execution role** for `todo-api`, but by default it can only write CloudWatch Logs — it **cannot touch DynamoDB**. Let's fix that.

1. On the `todo-api` function page → **Configuration** tab → **Permissions** on the left.
2. Click the role name link under **Execution role** (something like `todo-api-role-xxxx`); it opens IAM.
3. On the IAM role page → **Add permissions › Create inline policy** → switch to the **JSON** tab and paste the block below (replace `YOUR_ACCOUNT_ID` with your 12-digit account ID, and the Region with the one you're using):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "TodoTableAccess",
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:Scan"
      ],
      "Resource": "arn:aws:dynamodb:ap-northeast-1:YOUR_ACCOUNT_ID:table/todo-items"
    }
  ]
}
```

4. Name the policy, e.g. `todo-items-rw` → **Create policy**.

:::info[🤔 Why this way: a least-privilege execution role]
- **Why only `PutItem` and `Scan`?** Because our code only does those two things: `POST` writes one record with `PutItem`, `GET` reads everything with `Scan`. Granting only the actions that are just enough is **least privilege** — if the function is ever fed malicious input, what it can do to the database is still fenced in.
- **Why point `Resource` at `table/todo-items` instead of `*`?** So this function **can only touch this one table**, not every other DynamoDB table in your account. The narrower the scope, the smaller the blast radius if something goes wrong.
- **Where do I find the account ID?** It's the 12-digit number in the account menu at the top-right of the console, or the console can fill it in for you as you paste the policy.

**What you should see**: the role's permissions list gains an inline policy `todo-items-rw`. No redeploy needed back in Lambda — the permission takes effect **immediately**.
:::

### Step 4: Create an API Gateway (HTTP API) and wire it to Lambda

1. Console search `API Gateway` → **Create API** → find **HTTP API** → **Build**.
2. **Integrations**: choose **Lambda**, pick the right Region, and select the `todo-api` function.
3. **API name**: `todo-http-api` → Next.
4. **Configure routes**: create two routes, both pointing at the `todo-api` integration:
   - Method `GET`, path `/items`
   - Method `POST`, path `/items`
5. **Define stages**: keep the default `$default` stage (auto-deploy) → Next → **Create**.
6. Once created, on the API's **Details** page copy the **Invoke URL**, something like `https://abc123.execute-api.ap-northeast-1.amazonaws.com`.

:::info[🤔 Why this way: routes and the $default stage]
- **Why define both GET and POST on `/items`?** The HTTP API uses "method + path" to decide which request goes to which integration. We point both at the same `todo-api`, and the function branches internally by method — so one Lambda powers the whole API.
- **Why the HTTP API's Lambda integration?** This integration is a **Lambda proxy integration** by default — API Gateway hands the whole request to Lambda and requires the fixed response shape (that `reply()` from Step 2). It's the least config and the most beginner-friendly.
- **What is the `$default` stage?** A stage is a deployed "entrance" to your API. On an HTTP API, `$default` **auto-deploys** your changes, so you don't have to click deploy each time — easiest for practice.

**What you should see**: the API list shows `todo-http-api`; the Details page has a copyable **Invoke URL**; the routes page lists `GET /items` and `POST /items`, each attached to `todo-api`.
:::

---

## Test: hit your own API with curl

Replace `YOUR_INVOKE_URL` below with the URL you just copied (no trailing slash).

```bash
# 1. First POST to add a to-do item
curl -X POST "YOUR_INVOKE_URL/items" \
  -H "Content-Type: application/json" \
  -d '{"task": "finish the serverless lab"}'

# 2. Then GET to list all to-do items
curl "YOUR_INVOKE_URL/items"
```

:::note[🔍 What you should see (line by line)]
- **Line 1 (POST)** returns HTTP `201`, with a body like:

  ```json
  {"message":"created","item":{"id":"3f2a...","task":"finish the serverless lab","done":false}}
  ```

  The `id` is auto-generated by `randomUUID()`, so it differs every time.

- **Line 2 (GET)** returns HTTP `200`, listing that record (and any added earlier):

  ```json
  {"items":[{"id":"3f2a...","task":"finish the serverless lab","done":false}]}
  ```

- Want to confirm the data really landed in the database? Back in DynamoDB → `todo-items` → **Explore table items**, and you'll see the same record sitting there.
- To see the status code, add `-i` to `curl` and it will print the `HTTP/2 201` / `HTTP/2 200` line.
:::

:::warning[🚑 Common gotchas (almost every beginner hits these)]
- **Execution role missing DynamoDB permission → AccessDenied**: you skipped Step 3, or the policy has the wrong table name / Region / account ID. Symptom: `curl` returns `500`, and CloudWatch Logs show `AccessDeniedException: User ... is not authorized to perform: dynamodb:PutItem`. Fix: go back to Step 3 and verify the inline policy's `Action` and `Resource`.
- **Lambda proxy integration response shape wrong**: the function returns a plain object (e.g. `return { items }`) instead of `{ statusCode, headers, body }`, or forgets to `JSON.stringify` the `body`. Symptom: `curl` gets a `500` "Internal Server Error". Always use the `reply()` shape from Step 2, with `body` as a **string**.
- **CORS (only bites when called from a browser)**: `curl` never hits this, but when a **web frontend** (different origin) calls the API, the browser first sends an `OPTIONS` preflight and checks the CORS headers; without them it's blocked. Fix: on the HTTP API's **CORS** settings page, set **Access-Control-Allow-Origin** to your frontend's origin (for practice you can start with `*`) and allow `GET, POST, OPTIONS`.
- **Wrong table capacity mode**: leaving **Capacity mode** on **Provisioned** with too low an estimate can throttle you during testing (`ProvisionedThroughputExceededException`); too high and you pay for nothing. For practice, always choose **On-demand** — near-free when idle.
- **Trailing slash or wrong path in the Invoke URL**: calling `.../items/` or forgetting `/items` returns `404 Not Found`. No trailing slash, and the path must match the route's `/items` exactly.
- **Forgot to click Deploy**: editing the code in the Lambda editor without clicking Deploy means the API still runs the old code. Always click Deploy after editing.
:::

---

## Clean up to avoid charges

:::warning[🧹 Always clean up when you're done — leaving it may keep billing you]
Delete everything you created here, in order:

**1. Delete the API Gateway**
- Go to `API Gateway` → select `todo-http-api` → **Delete** → confirm.

**2. Delete the Lambda function**
- Go to `Lambda` → select `todo-api` → **Actions › Delete** → confirm.
- (You can keep or delete the attached execution role; to keep things tidy, go to IAM and delete that `todo-api-role-xxxx` too — the role itself is free.)

**3. Delete the DynamoDB table**
- Go to `DynamoDB` → **Tables** → select `todo-items` → **Delete** → confirm as prompted (you can uncheck "create a backup").
- Deleting the table also wipes the data inside it.
:::

<Cost title="💰 Cost note">

All three services here are very frugal: **Lambda** gives a million free invocations a month, and both **API Gateway (HTTP API)** and **DynamoDB On-demand** have Free Tier allowances. Follow the steps, clean up afterwards, and this exercise essentially costs nothing. What actually bites you is **forgetting to delete resources** — especially a DynamoDB table, which can keep accruing storage charges just by existing. Remember: **if you turned it on, remember to turn it off.**

</Cost>

---

## Why this matters for the exam

The DVA (Developer) exam tests the "serverless trio" over and over — how they fit together and who's responsible for what. Lock these in:

- **"Build a low-traffic, no-machines-to-manage HTTP API" → the answer is usually API Gateway + Lambda + DynamoDB**, not "spin up an EC2 and host it yourself". Options stressing "I don't want to manage servers, pay per use, scale automatically" usually point here.
- **For Lambda to access other AWS services (DynamoDB, S3…) → authorize via the execution role**, not by stuffing keys into the code or environment variables. When a question shows AccessDenied, the first thing to suspect is "the execution role lacks permission".
- **A Lambda proxy integration response is always `{ statusCode, headers, body }`, with `body` as a string** — a detail both the exam and real implementations love to test.
- **DynamoDB On-demand vs Provisioned**: if the question stresses "unpredictable traffic, don't want to estimate capacity", pick On-demand; only consider Provisioned when it stresses "steady traffic, optimize long-term cost".

Train the reflex: **a serverless API = API Gateway receives, Lambda computes, DynamoDB stores; service-to-service access runs through the execution role.**

<Refs title="📚 Official docs & further reading">

- [Build a serverless API with Lambda (tutorial)](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-dynamo-db.html)
- [API Gateway: HTTP APIs and Lambda proxy integrations](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-develop-integrations-lambda.html)
- [Lambda execution role](https://docs.aws.amazon.com/lambda/latest/dg/lambda-intro-execution-role.html)
- [DynamoDB: read/write capacity modes (On-demand and Provisioned)](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.ReadWriteCapacityMode.html)
- [Using the DynamoDB Document Client in JavaScript](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-lib-dynamodb/)

</Refs>

Congratulations — you just built a real, working API without touching a single server. That's the feel of serverless: this light.
