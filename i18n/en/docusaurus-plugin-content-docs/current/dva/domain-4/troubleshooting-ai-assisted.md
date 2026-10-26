---
sidebar_position: 5
title: Troubleshooting and AI-Assisted Debugging (New in C03)
---

# Troubleshooting and AI-Assisted Debugging: find the root cause fast, not just the last line of the error

> This article takes a developer's view of DVA-C03 Domain 4 debugging: why you must find root causes quickly, a systematic debugging flow (look at CloudWatch Logs / Logs Insights first, then use the X-Ray service map to find the slow or failing hop, then match common error codes, then debug IAM permissions), and finally the **brand-new "AI-assisted debugging" in C03** — using **Amazon Q Developer** to read error messages and stack traces, explain root causes, and suggest fixes and performance improvements, while **you still verify**. The exam loves asking "what do you check first for this symptom", which is exactly what the fixed lookup table at the end of this article will help you internalize.

<Vocab title="📌 Terms you will meet here (clear even if brand new)">

- **Root cause**: the real origin of a problem, not the first symptom you see. For example, "the API returns 500" is a symptom; the real root cause behind it may be "the Lambda execution role is missing permission to read DynamoDB".
- **CloudWatch Logs**: where AWS centrally collects your application and service logs. Lambda, API Gateway and so on send their `print` / `console.log` and platform logs here, organized into Log Groups.
- **Logs Insights**: a query engine built into CloudWatch Logs. Using a SQL-like query language, it quickly pulls "the entries with ERROR" or "the 20 slowest" out of a huge pile of logs, so you do not flip through them page by page.
- **X-Ray**: the AWS distributed tracing service. It stitches every hop a single request passes through (API Gateway, then Lambda, then DynamoDB, and so on) into one Trace, drawn as a service map, so you can see at a glance which hop is slow and which is red.
- **Segment / Subsegment**: X-Ray breaks one request into timed slices; each downstream call (such as a single DynamoDB query) is a subsegment labelled with its duration and whether it failed.
- **Throttling**: when you call a service too often and exceed its limit, the service temporarily rejects your request, usually returning **429** or `ThrottlingException`. This is not a logic bug; it means you are calling too fast.
- **Policy simulator**: an IAM tool that answers "is this role allowed to do this action on this resource" without actually calling the API, used to debug permission problems.
- **CloudTrail**: the audit log of "who called which AWS API, when, and whether it was allowed or denied". When debugging a permission error, use it to see which identity made the denied call and what was missing.

</Vocab>

:::note[💬 Reading tip]
Whenever you see a term with a <Term desc="Like this! Hover over the dotted underline (tap on mobile) to see a plain explanation.">dotted underline</Term>, hover over it for a plain explanation. All terms are also collected in the [Glossary](/glossary).
:::

## Why practice debugging? First, a tale of staring at an error message for two hours

Say your order API starts returning occasional **500**s after launch. You stare at the code for a long time, convinced "it looks fine", rerun it a few times, change some unrelated lines, and two hours later it is still broken. Finally a colleague snaps you out of it: "Just look at that `AccessDenied` line in the logs." It turns out the Lambda execution role was changed last week and lost permission to write to DynamoDB. This was never a code bug; it was a **permission problem**, and you were editing code the whole time.

The real skill in debugging is not guessing; it is **systematically finding the root cause from evidence**: look at the logs, look at the trace, match the error code, and let the data tell you which hop and which category the problem is. For a developer, whether you can pinpoint the root cause within ten minutes often matters more than "how elegant the code is" — it decides whether you get to go back to sleep after a 3 a.m. page. DVA-C03 gives "troubleshooting and optimization" a 22% weight precisely to test whether you know how to **use the right tool in the right order**.

## A systematic debugging flow: follow this order and take fewer detours

<div className="flow">
  <div className="flow-node">CloudWatch Logs / Logs Insights (read errors and stacks)</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">X-Ray service map (find the slow / red hop)</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Match the error code (403 / 429 / 5xx / timeout)</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Debug IAM permissions (simulator / CloudTrail)</div>
</div>

### Step 1: look at CloudWatch Logs / Logs Insights

The first thing to do when something breaks is **read the logs**, and read them down to the **full error stack and the root-cause line**, not just the final "Internal Server Error". A Lambda's `print` / `console.log` and exception stacks all land in the matching **Log Group** (`/aws/lambda/<function-name>`).

When there is a lot of log volume, scanning by eye is painful, so use <Term en="CloudWatch Logs Insights" desc="A query engine built into CloudWatch Logs; uses a SQL-like syntax to quickly pull matching records out of a large pile of logs.">Logs Insights</Term> with one query to pull out "the entries with ERROR":

```sql
-- Pull logs containing ERROR or Exception, newest first, only the key fields
fields @timestamp, @message, @requestId
| filter @message like /ERROR|Exception|AccessDenied|Timeout/
| sort @timestamp desc
| limit 50
```

:::tip[💡 Exam point: Logs answer "is there an error, and which line"]
Logs / Logs Insights are great at **pinpoint** questions: what exception a request threw, what the stack was, which `requestId` failed. But they are poor at answering "when one request spans several services, which hop is slow" — that is X-Ray's strength. Use them **together**: Logs for the content detail, X-Ray for the cross-service big picture.
:::

### Step 2: look at the X-Ray service map to find the slow / failing hop

When one request passes through several services (API Gateway, then Lambda, then DynamoDB, then an external API), reading a single service's logs makes it hard to tell "where exactly it is stuck". <Term en="AWS X-Ray" desc="The AWS distributed tracing service; stitches every hop of one request into a trace drawn as a service map, showing which hop is slow and which failed.">X-Ray</Term> draws the whole path as a **service map**, with each node (service) labelled with average latency and error rate, and the **red or enlarged node** is the suspect.

<Analogy title="🏢 Analogy: X-Ray is like courier package tracking">

Your online order has not arrived, and the tracking page shows where it is stuck: "arrived at sorting center, then stuck for 3 days". You do not have to phone every stop to ask; you see at a glance **which hop** is the problem. X-Ray's service map is the package tracking for your application's requests — which hop is slow, which hop was returned (failed), marked right on the map, so you do not have to go query each service's logs one round at a time.

</Analogy>

Click into a trace and you can see the per-slice **subsegment timings**: for example "the Lambda body only took 20ms, but the subsegment calling DynamoDB took 1.8 seconds" — the root cause instantly narrows to "the DynamoDB query is slow", not "my code is slow".

### Step 3: common error code lookup (know the category the moment you see the number)

Error codes tell you the **general direction** of the problem directly; do not treat every error as a code bug:

| Error code / message | What it usually means | Where to look first |
| --- | --- | --- |
| **403 AccessDenied** | Insufficient **permission**, not a logic bug | Check the execution role's IAM policy, use the policy simulator, see which API CloudTrail shows was denied |
| **429 TooManyRequests / ThrottlingException** | Being **throttled**, calling too fast past a limit | Add **retry with exponential backoff**, raise concurrency / read-write capacity, check for a runaway loop |
| **5xx (500 / 502 / 503)** | Server side or downstream **crashed / timed out / wrong response format** | Read the Lambda log exception stack, see which hop is red in X-Ray, check the response matches the integration format |
| **Lambda Task timed out** | The function **ran past its timeout** (max 15 minutes) | See which subsegment is stuck in X-Ray (often a downstream call with no timeout), adjust the timeout or optimize a slow query |
| **ThrottlingException** (downstream such as DynamoDB / Kinesis) | Downstream service out of capacity, being throttled | Check the capacity mode / RCU-WCU, add backoff retry, spread hot keys |

:::info[🔑 The most mixed-up distinction: 403 is not "the code is broken"]
When you see **403 / AccessDenied**, nine times out of ten your code logic is not wrong; an **identity is missing permission**. Taking a 403 to rewrite business logic is wasted effort — you need to look at IAM. When you see **429**, that is also not a bug; it means "you are calling too fast", and the fix is backoff retry or raising a quota, not changing logic. Categorizing the problem by its error code first saves you more than half the detours.
:::

### Step 4: debug IAM permissions (policy simulator and CloudTrail)

Once you have confirmed it is a permission problem (403), there are two power tools:

- **Policy simulator**: without actually calling the API, ask AWS directly "is **this role** allowed to do **this action** (such as `dynamodb:PutItem`) on **this resource**". It tells you allow / deny, and if denied, which policy blocked it.
- **CloudTrail**: look at the **actual denied API call** — which identity (role / user), which API it called, whether the `errorCode` is `AccessDenied`, and what the `errorMessage` says was missing. This is "on-scene evidence", the most reliable.

```bash
# Simulate with the CLI: ask "can this role PutItem into this table"
aws iam simulate-principal-policy \
  --policy-source-arn arn:aws:iam::111122223333:role/order-lambda-role \
  --action-names dynamodb:PutItem \
  --resource-arns arn:aws:dynamodb:ap-northeast-1:111122223333:table/orders
```

:::tip[💡 Exam point: the standard way to debug a permission error]
When a question describes "a function cannot reach a service and returns AccessDenied", the standard flow is: **use the policy simulator first to confirm which action the role is missing, then go to CloudTrail to see the detail of that denied request, then add the missing IAM policy to the execution role**. Do not treat 403 as a code bug and debug the code.
:::

## New in C03: AI-assisted debugging (Amazon Q Developer)

This is the part **newly added in DVA-C03**. <Term en="Amazon Q Developer" desc="The AWS AI development assistant; it can read your error messages and stacks, explain the root cause, and suggest fixes and performance optimizations, integrated into the IDE and the console.">Amazon Q Developer</Term> is an AI development assistant integrated into the IDE and the AWS console. For debugging it can help you:

- **Read error messages and stacks**: paste a long, unreadable exception stack or CloudWatch error to it and it explains in plain language "what this is saying".
- **Explain the root cause**: it does not just translate the error but infers "why it happened", for example "this `AccessDenied` is because the execution role is missing `dynamodb:PutItem`".
- **Suggest fixes**: it directly proposes which IAM policy to add, where to add a retry, which query needs an index.
- **Suggest performance optimizations**: it points out obvious inefficiencies (such as calling one-by-one in a loop, no timeout set, a cold start loading too much) and offers a fix.

<Scenario title="Real scenario: hand an unreadable stack to Q Developer to narrow the direction first">

Your Lambda spits out a long Python stack in CloudWatch, with the last line `botocore.exceptions.ClientError: An error occurred (AccessDeniedException)`. In the IDE you select this and paste it to Amazon Q Developer, asking "what is this problem and how do I fix it". It answers: "This is an IAM permission shortfall; your execution role lacks `dynamodb:PutItem` on the target resource, so add that action to the role policy scoped to this table's ARN." You **do not accept it at face value**; instead you take that direction to the policy simulator and CloudTrail to **verify the permission really is missing**, and only add the policy after confirming. The AI turns "two hours staring at a stack" into "ten minutes with a direction, then verify".

</Scenario>

:::warning[🚑 Always verify the answer the AI gives]
Amazon Q Developer is very good at **speeding up finding a direction**, but it can **guess the wrong root cause** or give an **overly broad permission** (such as suggesting `dynamodb:*` or `Resource: *`, violating least privilege). Treat the AI as "a strong hint", not "the final answer": take its conclusion to **Logs / X-Ray / policy simulator / CloudTrail to verify** it is true and that the fix respects least privilege before you change anything. Blindly applying an AI fix can turn a small problem into a security hole.
:::

## What to check first for each symptom, and why (fixed lookup table)

This is the one section most worth memorizing in this article — **start from the symptom**, and know which tool to open first and why:

| Symptom | What to check first | Common root cause |
| --- | --- | --- |
| **Function returns 403 / AccessDenied** | Policy simulator, then CloudTrail | Execution role missing a permission; or resource policy does not allow the caller |
| **Occasional 429 / ThrottlingException** | CloudWatch metrics (Throttles), then call rate | Insufficient concurrency / read-write capacity; a runaway loop; no backoff retry |
| **API returns 5xx** | CloudWatch Logs (exception stack), then X-Ray | Downstream crashed / timed out, response does not match the integration, uncaught exception |
| **Request is slow but no error** | X-Ray service map / subsegment timing | A slow downstream call, cold start, N+1 queries, no index |
| **Lambda Task timed out** | X-Ray to see which hop is stuck, then timeout setting | Downstream call with no timeout, slow query, timeout set too short |
| **Event does not trigger the function** | CloudWatch Logs for whether it was called, then resource policy | Resource policy does not allow the source to call; trigger misconfigured; the event never arrived |
| **Nothing to look at — no log / no trace** | First confirm whether Logs / X-Ray are enabled | Role was never given permission to write logs; X-Ray tracing not enabled |

:::info[🔑 Why "pick the tool from the symptom"]
Debugging most often wastes time by "using the wrong tool to look in the wrong direction": using Logs to hunt cross-service latency (should be X-Ray), or taking a 403 to rewrite code (should check IAM). Mapping the symptom to the right tool first cuts the search space by ninety percent, and what remains is the few lines of real evidence you actually need to read.
:::

## 🛠️ Hands-on: query errors with Logs Insights and verify permissions with the simulator

Below is a small debugging flow you can copy and follow. Scenario: a Lambda starts returning 500 and you need to find the root cause.

```bash
# 1) First use Logs Insights to pull errors from this function's log group
#    (replace FUNC with your function name)
aws logs start-query \
  --log-group-name "/aws/lambda/order-processor" \
  --start-time $(date -d '-1 hour' +%s) \
  --end-time $(date +%s) \
  --query-string 'fields @timestamp, @message | filter @message like /ERROR|AccessDenied|Timeout/ | sort @timestamp desc | limit 20'

# Take the queryId returned above and fetch the results
aws logs get-query-results --query-id <the-queryId-from-above>
```

**Expected result**: `get-query-results` returns a JSON bundle where each entry in the `results` array is one matching log. If the root cause is permissions, you will see something like this in `@message`:

```text
[ERROR] ClientError: An error occurred (AccessDeniedException) when calling the PutItem operation:
User: arn:aws:sts::111122223333:assumed-role/order-lambda-role/order-processor is not authorized to
perform: dynamodb:PutItem on resource: arn:aws:dynamodb:ap-northeast-1:111122223333:table/orders
```

Seeing **`AccessDeniedException` plus `dynamodb:PutItem`** tells you this is not a code bug; the **execution role is missing permission to write to this table**. Next, verify it:

```bash
# 2) Use the policy simulator to confirm whether the role is allowed this action/resource
aws iam simulate-principal-policy \
  --policy-source-arn arn:aws:iam::111122223333:role/order-lambda-role \
  --action-names dynamodb:PutItem \
  --resource-arns arn:aws:dynamodb:ap-northeast-1:111122223333:table/orders \
  --query 'EvaluationResults[0].EvalDecision'
```

**Expected result**: the terminal prints `"implicitDeny"` (or `"explicitDeny"`), confirming the role indeed **does not have** this permission — matching the log. Only now are you confident to add the **least-scoped** policy (add only `dynamodb:PutItem`, limited to this table's ARN), rather than opening up `*`. Rerun a request, confirm the 500 is gone and the simulator turns to `allowed`, and the root cause is resolved.

:::tip[💡 Why verify before you change]
The log tells you "the symptom looks like a permission problem"; the simulator helps you **confirm with evidence** which action and resource was denied. Verifying before changing avoids "thinking A is missing when B actually is" and making a bigger mess; it also avoids blindly applying the AI's overly broad permission. Reproduce first, confirm first, then fix with the smallest change — that is the iron rule of debugging in production.
:::

:::warning[🚑 Common pitfalls]
- **Reading only the last line, not the root cause**: the last line is often just a result like "Internal Server Error", while the real root cause (which exception, which resource was denied) is **in the middle of the stack or in a hop of the X-Ray trace**. Always scroll up through the full stack and read the whole trace.
- **Treating 403 as a code bug**: seeing AccessDenied and going to rewrite business logic gets you nowhere, even by dawn. A 403 is a **permission** problem — check IAM / simulator / CloudTrail, not the code.
- **Blindly trusting the AI fix without verifying**: Amazon Q Developer may guess the wrong root cause or give an overly broad permission. Take its conclusion to Logs / X-Ray / simulator to **verify**, and make sure the fix respects least privilege, before acting.
- **No X-Ray / Logs means nothing to investigate**: discovering only in a crisis that the function lacks permission to write logs or has tracing disabled is like having no black box. **Before launch**, ensure the role can write to CloudWatch Logs and that key services have X-Ray tracing enabled.
- **Changing production without reproducing in the log first**: changing config or code in production without first confirming "what it actually throws" easily leads to "changing something irrelevant" and believing it is fixed. **Reproduce and pinpoint** in the log / trace first, then confirm with the same query that the symptom is gone after the change.
:::

<Refs title="📚 Official docs & further reading">

- [Monitoring Lambda functions with CloudWatch Logs](https://docs.aws.amazon.com/lambda/latest/dg/monitoring-cloudwatchlogs.html)
- [CloudWatch Logs Insights query syntax](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CWL_QuerySyntax.html)
- [Tracing and debugging with AWS X-Ray](https://docs.aws.amazon.com/xray/latest/devguide/aws-xray.html)
- [Testing IAM policies with the IAM policy simulator](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_testing-policies.html)
- [Troubleshooting denied API calls with CloudTrail](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-event-reference-aws-console-sign-in-events.html)
- [Amazon Q Developer User Guide](https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/what-is.html)

</Refs>

## Next step

👉 Review: [Domain 4 Flashcards](./flashcards.md)
