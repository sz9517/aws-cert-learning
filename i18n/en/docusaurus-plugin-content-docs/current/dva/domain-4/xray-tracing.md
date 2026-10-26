---
sidebar_position: 2
title: X-Ray Distributed Tracing
---

# AWS X-Ray: when a request flows through ten services, see at a glance which hop is slow and which one failed

> This article takes a developer's view of X-Ray: why logs alone cannot debug microservices and serverless apps, how a trace is built from segments and subsegments, how the service map draws the whole path, the difference between annotations and metadata, how sampling controls cost, and how to enable tracing on Lambda and actually add a subsegment and annotation. These are high-frequency topics in DVA-C03 Domain 4 (troubleshooting and optimisation).

<Vocab title="📌 Terms you will meet here (clear even if brand new)">

- **Distributed Tracing**: a single user request often flows through several services (API Gateway, then Lambda, then DynamoDB, then another Lambda...). Distributed tracing stitches together, for that one request, the time spent and the success or failure at every hop into a single line of record.
- **Trace**: the complete record of one request from start to finish. The whole path shares one Trace ID, so data scattered across services can be reassembled into a single line.
- **Segment**: the record of what one service (for example a Lambda function) did for this request: start and end time, and whether it errored. One trace is made of multiple segments.
- **Subsegment**: a finer slice inside a segment, such as "the DynamoDB call took 12 ms" or "the external HTTP API took 200 ms". It shows where the time went inside a service.
- **Service Map**: a diagram X-Ray draws after aggregating all traces, where nodes are services and edges are calls, annotated with latency and error rate. One glance shows the whole chain and which node is turning red.
- **Sampling**: instead of recording every request, X-Ray records a sample of them, so tracing itself does not slow the app or generate huge costs.

</Vocab>

:::note[💬 Reading tip]
Whenever you see a term with a <Term desc="Like this! Hover over the dotted underline (tap on mobile) to see a plain explanation.">dotted underline</Term>, hover over it for a plain explanation. All terms are also collected in the [Glossary](/glossary).
:::

## Why X-Ray? First, an example of how logs alone cannot finish the debugging

Say you built an order API: API Gateway receives the request, calls an "order Lambda", which then writes to DynamoDB, calls an "inventory Lambda", and finally hits a third-party payment HTTP API. One day a user complains that "ordering sometimes takes five seconds".

You open <Term en="Amazon CloudWatch Logs" desc="The AWS logging service that collects the text logs printed by each service.">CloudWatch Logs</Term> to investigate, but here is the problem: the order Lambda's logs only show what it printed itself, not whether those five seconds were DynamoDB being slow, the inventory Lambda being slow, or the payment API being slow. You have to go to the logs of three different services and crudely line up timestamps to piece together what happened, and because each request is a separate log entry, you cannot stitch them together at all.

<Term en="AWS X-Ray" desc="The AWS distributed tracing service that stitches a request flowing through multiple services into one trace and draws a service map.">X-Ray</Term> solves exactly this: it automatically stitches every hop a single request passes through into **one trace**, draws it as a **service map**, and labels each node with average latency and error rate. At a glance you see "ah, the payment API hop took 4.3 seconds", and clicking in shows the time of each subsegment for that request. For a developer, debugging shifts from "read three logs and guess" to "look at one map and point".

## The one-sentence model of how X-Ray works

Your app (or Lambda) uses the X-Ray SDK to **instrument**. Each time it handles a request it produces a **segment**, inside which it can carve **subsegments** to record the detail of "calling a downstream". Once this data reaches the X-Ray service, it is reassembled by the same **Trace ID** into a complete **trace**, then aggregated into a **service map**. To avoid flooding, X-Ray uses **sampling** to record only a portion of requests.

<Analogy title="🏢 A real-life analogy: X-Ray is like courier parcel tracking">

- **trace = the full delivery record of one parcel**: from order to doorstep, the whole journey shares one tracking number (Trace ID).
- **segment = the signed record at each transit hub**: how long the parcel stayed at the "Taipei hub" or "Taoyuan sorting", and whether it got stuck, each logged separately.
- **subsegment = the finer actions inside a hub**: at one hub, "unloading 2 min, sorting 5 min, loading 1 min".
- **service map = the whole delivery route diagram**: aggregating all parcel records to draw "which route tends to jam, which hub tends to fail".
- **sampling = spot checks**: it is impossible to fully film every parcel, so only a portion gets the full record.

</Analogy>

## Core one: how trace, segment, and subsegment form one line

A **trace** represents the full journey of a request and is made of multiple **segments**, each of which can carve several **subsegments**:

```
Trace (Trace ID: 1-abc...)  <- the full journey of one order request
|-- Segment: order Lambda
|   |-- Subsegment: DynamoDB PutItem (12 ms)
|   |-- Subsegment: call inventory Lambda (Invoke 80 ms)
|   +-- Subsegment: payment HTTP API (4300 ms)  <- the slow one!
+-- Segment: inventory Lambda
    +-- Subsegment: DynamoDB Query (9 ms)
```

- A **segment** answers "which service handled this request, how long it took, and whether it errored".
- A **subsegment** answers "where the time went inside that service", especially each call to a downstream (database, another service, external API). Once you instrument, the X-Ray SDK produces subsegments automatically for common AWS SDK calls; you can also add subsegments manually to wrap a piece of your own logic.

:::info[🔑 How the Trace ID is passed across services]
When a request moves from one service to the next, X-Ray carries an `X-Amzn-Trace-Id` header to propagate the Trace ID all the way down. The downstream service records its own segment under the same Trace ID, so X-Ray can reassemble the scattered segments into the same trace. This context propagation is mostly done by the SDK automatically, but if one hop is not instrumented, the chain breaks there (see the pitfalls at the end).
:::

## Core two: the service map, understand the whole chain at a glance

After aggregating many traces, X-Ray automatically draws a **service map**: each **node** is a service (your Lambda, API Gateway, DynamoDB, an external API), the **edges** between nodes represent calls, labelled with **average latency** and **error rate**.

<div className="flow">
  <div className="flow-node">API Gateway</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">order Lambda</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">DynamoDB</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">payment API (red: high latency)</div>
</div>

Nodes use colour to show health: green is fine, yellow has some 4xx, red has 5xx errors or high latency. When you see a node turning red, click straight into it to filter the traces that errored or slowed down, then drill into the subsegments for detail. That is X-Ray's biggest value over logs alone: **first use one map to locate which hop the problem is in, then look at the detail**, instead of diving head-first into one log from the start.

## Core three: annotations vs metadata, queryability is the key difference

You can attach custom data to a segment or subsegment to help later filtering and debugging. But there are two kinds, and DVA loves to test whether you can tell them apart:

| Type | Can it be used to filter or query | Typical use |
| --- | --- | --- |
| **Annotations** | **Yes.** They are indexed and can be queried with a filter expression in the X-Ray console (such as `annotation.userId = "u123"`). | Store a small number of key, queryable values such as `userId`, `orderId`, `paymentProvider`. Each value may only be a string, number, or boolean. |
| **Metadata** | **No.** Not indexed, cannot be used to filter or query; only viewable as attached detail when you open a specific trace. | Store larger, human-review-only data such as the full request body, debug objects, or response fragments. |

<Analogy title="🏢 A real-life analogy: a medical record's searchable labels vs attached notes">

- **annotation = the category labels stuck on the record folder**: like "blood type A" or "allergy: penicillin", which you can use to filter out all matching records. So keep them concise and make them the things you may want to search on later.
- **metadata = the detailed note pages tucked inside the record**: a long handwritten remark from the doctor, full of information, but you cannot run a hospital-wide search on it. It is only visible when you open that one record.

</Analogy>

:::info[🔑 One line to remember how to choose]
**If you may want to filter or query on it later, use an annotation (indexed, but keep it concise). If you just want to attach a bundle of detail for humans to read, use metadata (not indexed, can be large).** Using the wrong direction, putting the thing you want to query into metadata, means "it cannot be found", a common trap.
:::

## Core four: sampling, why not record every request

If every request recorded a full trace, two problems appear at once: cost (X-Ray charges by the number of recorded traces) and possible extra overhead for a high-traffic app. So X-Ray samples by default:

- **Default rule**: a reservoir of **1 request per second** is recorded first, then an additional **5%** of requests are sampled. This keeps recording to a small fraction even under high traffic, while still reflecting the overall picture.
- You can define **custom sampling rules**: for example set the sampling rate for a `/health` health-check path to 0 (no waste), and set a higher rate for a critical path like `/checkout` (so problems get caught).

:::tip[💡 Exam focus: what to remember about sampling]
- Sampling is a trade-off between cost and observability: higher captures more but costs more; lower saves money but may miss intermittent issues.
- If the question says "X-Ray cost is too high, want to lower it", think of adjusting sampling rules (lower the rate, set 0 for low-value paths).
- If the question says "intermittent errors are not caught, sampling misses them", think of raising the sampling rate for critical paths.
:::

## Core five: how to enable X-Ray on Lambda and apps

For traces to actually appear, three things must be in place: enable tracing, instrument with the SDK, and get data to X-Ray (the daemon concept).

**1) Enable Active Tracing (Lambda)**: in the Lambda function settings, turn on <Term en="Active Tracing" desc="Once enabled in the Lambda function settings, Lambda automatically creates a segment for each invocation and sends it to X-Ray.">Active Tracing</Term>. Once enabled, Lambda creates a segment for each invocation by itself and sends it to X-Ray, so the function node shows up on the service map. But note: this only gives you the function's own box, not the downstream detail of what the function calls. That needs the next step.

**2) Instrument with the SDK**: in your code, use the AWS X-Ray SDK to wrap (patch) the AWS SDK client, so that all calls to DynamoDB, S3, or other Lambdas automatically produce subsegments; you can also add subsegments and annotations manually. Without this step, downstream calls are invisible on the map.

**3) The X-Ray daemon concept**: the X-Ray SDK does not send data straight to the X-Ray API, but first hands it to a local <Term en="X-Ray daemon" desc="A resident process that collects segments produced by the SDK and sends them to the X-Ray service in batches.">X-Ray daemon</Term> (over UDP), which buffers and batches before sending to the X-Ray service, reducing the load on your app. On Lambda you do not install the daemon yourself, because the Lambda execution environment has it built in; but on EC2, ECS, or self-managed containers you must run the daemon yourself (install it on EC2, add a daemon sidecar container on ECS).

:::info[🔑 The execution role needs X-Ray permission]
The Lambda execution role must be able to send traces out, commonly by attaching the managed policy `AWSXRayDaemonWriteAccess` (which includes `xray:PutTraceSegments`, `xray:PutTelemetryRecords`, and so on). Without it, even with Active Tracing enabled and instrumentation done, traces still cannot be sent out and the map stays blank.
:::

## When you need X-Ray (vs just CloudWatch Logs), pros and cons, when not to use it

This is the fixed decision section of the article, used in both exam and practice to tell "should this be X-Ray or CloudWatch".

**Why you need it (vs just CloudWatch Logs)**: CloudWatch Logs is great at "what one service printed internally", but when a request crosses multiple services, the logs are scattered separately, so it is hard to answer "where did this request's 5 seconds go". X-Ray's value is to stitch a request's cross-service journey into one trace and draw it as a service map, letting you first locate which hop is slow or failing, then drill into detail. In short: CloudWatch answers "what happened to this service", X-Ray answers "where in the whole chain this request has a problem". They are complementary, not either-or.

**Pros**:

- Stitches a request's full journey across services, so latency bottlenecks and error sources are located at a glance.
- The service map automatically presents the overall architecture and health without you drawing it.
- Integrates well with Lambda, API Gateway, and the SDK; Lambda gets basic tracing with almost just "flip a switch and add a permission".
- Annotations are indexed, so you can filter out the traces of a specific request by a business dimension (such as `orderId`).

**Cons / limits**:

- To see the full chain, every hop must be instrumented; if one hop in the middle is not, the chain breaks there.
- Sampling means not every request has a trace, so an intermittent issue may simply not be sampled.
- Trace data has a retention period (about 30 days by default), so it is not suitable as a long-term audit record.
- The extra SDK layer and the act of sending data add a small amount of overhead and cost.

**When not to use it (or not to rush it)**:

- A single service with no cross-service calls: for one small standalone function, CloudWatch Logs and Metrics are often enough, and X-Ray is overkill.
- When what you want is a precise error stack and full log text: that is CloudWatch Logs' strength; X-Ray gives you "time distribution and the chain", not line-by-line logs.
- When you care about every cent of cost and traffic is huge: full tracing gets expensive, so at least tune the sampling rules first.

## Hands-on: enable tracing on Lambda and add a subsegment and annotation

<Scenario title="A real scenario: the order Lambda is occasionally slow, and you want to know if the payment API is dragging it">

Your order Lambda calls a third-party payment HTTP API that is occasionally slow, but the logs do not show it. Approach: enable Active Tracing, use the X-Ray SDK to wrap the payment call in a subsegment, and tag `orderId` as an annotation for later filtering. Then on the service map you can see the payment node's latency, and clicking into a slow trace, the `payment-call` subsegment tells you plainly how many seconds it took.

</Scenario>

### 🛠️ Step one: enable Active Tracing and add X-Ray permission

```bash
# 1) Enable the function's Active Tracing (Lambda auto-creates a segment per invocation)
aws lambda update-function-configuration \
  --function-name order-processor \
  --tracing-config Mode=Active

# 2) Give the execution role permission to send X-Ray data (without it, traces cannot be sent)
aws iam attach-role-policy \
  --role-name lambda-exec-role \
  --policy-arn arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess
```

### 🛠️ Step two: instrument in code and add a subsegment and annotation

```js
// Node.js: wrap the AWS SDK with aws-xray-sdk, and add a subsegment and annotation manually
const AWSXRay = require('aws-xray-sdk-core');
// Patch the whole AWS SDK: later DynamoDB, S3... calls auto-produce subsegments
const AWS = AWSXRay.captureAWS(require('aws-sdk'));

const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  // The segment for this invocation is created by Lambda; we add a subsegment under it
  const segment = AWSXRay.getSegment();

  // Annotation: a small number of key, indexed, queryable values
  segment.addAnnotation('orderId', event.orderId);
  segment.addAnnotation('paymentProvider', 'acme-pay');

  // Metadata: larger, view-only, cannot be used to query
  segment.addMetadata('rawRequest', event);

  // DynamoDB call -> thanks to captureAWS above, a subsegment is produced automatically
  await dynamo.put({ TableName: 'orders', Item: { id: event.orderId } }).promise();

  // Manually wrap a subsegment to measure how slow the payment API call really is
  const result = await AWSXRay.captureAsyncFunc('payment-call', async (sub) => {
    try {
      const res = await callPaymentApi(event);   // your payment call
      sub.addAnnotation('paymentStatus', res.status);
      return res;
    } finally {
      sub.close();   // remember to close the subsegment, or its timing is inaccurate
    }
  });

  return { statusCode: 200, body: JSON.stringify(result) };
};
```

### 🛠️ Step three: send a few requests and look at the service map

```bash
# Trigger a few times (to produce traces)
aws lambda invoke --function-name order-processor \
  --payload '{"orderId":"o-1001"}' out.json

# Use the annotation to filter the trace of one order (a filter expression demo)
aws xray get-trace-summaries \
  --start-time $(date -d '-10 min' +%s) \
  --end-time $(date +%s) \
  --filter-expression 'annotation.orderId = "o-1001"'
```

:::tip[✅ Expected result]
- Open the Service map in the X-Ray console and you will see the `order-processor` node connected to DynamoDB and an external node representing the payment API.
- If the payment node has high latency it shows yellow or red. Click into a slow trace and you can see the `payment-call` subsegment taking most of the time. Problem located.
- In the trace detail you can see annotations like `orderId` and `paymentProvider`, and you can filter out that one record directly with `annotation.orderId = "o-1001"`; `rawRequest` instead appears in the metadata area, viewable only and not filterable.
:::

:::warning[🚑 Common pitfalls]
- **Only enabling Active Tracing without SDK instrumentation**: the service map shows only your function's box, not the DynamoDB or external API it calls. To see downstream, you must use the X-Ray SDK to patch the AWS SDK client (`captureAWS`) and add subsegments manually.
- **Using annotations and metadata the wrong way**: putting "the thing you want to query later" into metadata means it cannot be found (metadata is not indexed). Always put what you want to filter into an annotation; and do not stuff large data into an annotation (it only takes a string, number, or boolean, and should stay concise).
- **The execution role lacks X-Ray permission**: without `AWSXRayDaemonWriteAccess` (or the equivalent `xray:PutTraceSegments` and `xray:PutTelemetryRecords`), even fully enabled, traces cannot be sent out, the map stays blank, and it is hard to realise it is a permission problem.
- **Not minding the sampling rate and cost**: by default only a small fraction is sampled, so an intermittent issue may not be caught; conversely, tracing all requests makes cost explode under high traffic. Use custom sampling rules: set 0 for low-value paths and raise it for critical paths.
- **Forgetting to close a subsegment**: a manually created subsegment that is not closed with `close()` will have inaccurate timing and the trace may show up incomplete.
- **A hop in the middle is not instrumented**: if one service in the middle is not instrumented, the Trace ID context breaks there, and the service map shows a broken chain, looking as if "everything after it disappeared".
:::

<Refs title="📚 Official docs & further reading">

- [AWS X-Ray Developer Guide](https://docs.aws.amazon.com/xray/latest/devguide/aws-xray.html)
- [X-Ray concepts: segments, subsegments, traces, service graph, sampling](https://docs.aws.amazon.com/xray/latest/devguide/xray-concepts.html)
- [Using X-Ray with Lambda (Active Tracing)](https://docs.aws.amazon.com/lambda/latest/dg/services-xray.html)
- [Annotations and metadata (annotations vs metadata)](https://docs.aws.amazon.com/xray/latest/devguide/xray-sdk-nodejs-segment.html)
- [Configuring sampling rules](https://docs.aws.amazon.com/xray/latest/devguide/xray-console-sampling.html)

</Refs>

## Next step

👉 Next: [Error Handling and Retries](./error-handling-retries.md)
