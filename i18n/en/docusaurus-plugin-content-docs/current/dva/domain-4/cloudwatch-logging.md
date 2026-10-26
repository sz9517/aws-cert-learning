---
sidebar_position: 1
title: CloudWatch Monitoring and Logging
---

# CloudWatch Monitoring and Logging: when something breaks, you need a way to know, and a way to find it

> This article takes a developer's view of CloudWatch: where log groups and log streams come from, how Lambda ships logs automatically, how to query with Logs Insights, built-in vs custom metrics, dimensions and the EMF embedded metric format, how to set alarm thresholds with SNS, and Dashboards. It also settles the DVA favourite once and for all: CloudWatch vs CloudTrail vs X-Ray, what each one shows you, and when to use which. This is the core of DVA-C03 Domain 4 (Troubleshooting and Optimization).

<Vocab title="📌 Terms you will meet here (clear even if brand new)">

- **Observability**: the ability of a system to emit enough signals that you can infer, from the outside, what is happening inside. Its three pillars are Logs, Metrics, and Traces.
- **Logs**: the line-by-line text records your code prints as it runs, such as `console.log` or `print`. CloudWatch collects them centrally for you.
- **Metric**: a series of numbers over time, such as errors per minute or average latency. You can chart it and set alarms on it.
- **Dimension**: a key-value label attached to a metric, such as `FunctionName=order-processor`. It lets you slice the same metric different ways.
- **Alarm**: watches a metric and triggers an action (notify, scale, run a Lambda) when it crosses a threshold you set.
- **EMF (Embedded Metric Format)**: a special JSON log format. You print logs in this shape, and CloudWatch automatically extracts metrics from them, with no separate API call.

</Vocab>

:::note[💬 Reading tip]
Whenever you see a term with a <Term desc="Like this! Hover over the dotted underline (tap on mobile) to see a plain explanation.">dotted underline</Term>, hover over it for a plain explanation. All terms are also collected in the [Glossary](/glossary).
:::

## Why observability? First, the nightmare of being paged at 3am with no clue

Say your order-processing Lambda sits behind API Gateway. In the middle of the night a user reports that checkout spins forever and then fails. You open the code and everything looks fine. The problem is that you have no idea what actually happened on that one request. Was the Lambda timing out? Was permission denied? Was downstream DynamoDB throttling? Or was the function never even triggered?

Without observability you can only guess, reproduce, and guess again. With observability you can answer three questions directly:

1. **How do I even know something broke?** Use metrics plus alarms: the moment the error rate spikes, CloudWatch texts or Slacks you, so you do not wait for users to complain.
2. **What exactly broke?** Use logs: pull the log for that request, see `AccessDenied: dynamodb:PutItem`, and you instantly know the execution role is missing a permission.
3. **Where is it slow?** Use traces (X-Ray): one request spans API Gateway then Lambda then DynamoDB, and you can see DynamoDB ate 800ms.

<Term en="Amazon CloudWatch" desc="AWS monitoring and observability service that centralises logs, metrics, alarms, and dashboards; your first stop for troubleshooting and optimization.">CloudWatch</Term> is the AWS service that gathers your logs, metrics, alarms, and dashboards in one place. For a developer, it is the first thing you open when something goes wrong.

<Analogy title="🏢 Analogy: CloudWatch is the control room of a building">

- **Logs = the security camera footage in each room**: when you need to find what happened at a given moment, you pull the tape and watch it frame by frame.
- **Metrics = the live gauges on the wall**: temperature, foot traffic, power usage as live numbers, so you spot trends at a glance.
- **Alarm = the alarm bell**: when a gauge crosses a safe value (like smoke density), the alarm goes off and notifies security automatically.
- **Dashboard = the wall of big screens in the control room**: the most important gauges arranged together so whoever is on shift can glance once and know the building is healthy.

</Analogy>

## Logs: log groups, log streams, and Lambda shipping logs automatically

CloudWatch Logs has a hierarchy, from largest to smallest:

- **Log Group**: the collection of logs for one application or service. For example, all logs of the Lambda `order-processor` live in the group `/aws/lambda/order-processor`. Retention, permissions, and encryption are set at the group level.
- **Log Stream**: the individual sources inside a group. For example, each Lambda execution environment maps to a stream.
- **Log Event**: the actual timestamped line inside a stream.

**Lambda ships logs automatically**: as long as your Lambda execution role has CloudWatch Logs permissions (`logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents`, normally granted by the managed policy `AWSLambdaBasicExecutionRole`), whatever you `console.log` or `print` in the function flows automatically into the `/aws/lambda/<function-name>` group. You never call an API to ship it.

```js
// Node.js: these console.log lines flow automatically into CloudWatch Logs
exports.handler = async (event, context) => {
  console.log('Request ID:', context.awsRequestId); // ties together all logs of one request
  console.log('Received event:', JSON.stringify(event));
  // ...business logic...
};
```

:::info[🔑 Structured logs are easier to query than plain text]
Prefer printing structured JSON (`console.log(JSON.stringify({ level: 'error', orderId, msg }))`) rather than gluing information into one text string. Logs Insights can query JSON fields directly by name (`filter orderId = "A123"`), while plain text forces keyword scraping that is slow and imprecise.
:::

### Logs Insights: query your logs with a query language

Scanning piles of logs by eye is painful. <Term en="CloudWatch Logs Insights" desc="Interactive query tool that runs a SQL-like query language over CloudWatch logs to filter, aggregate, and sort; a troubleshooting workhorse.">CloudWatch Logs Insights</Term> lets you run a SQL-like query over a log group to filter, aggregate, and sort fast:

```
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 20
```

Common pipes: `fields` (pick columns), `filter`, `stats` (aggregate, such as `count()`, `avg()`), `sort`, `limit`, and `parse` (extract fields from text). This is the most practical tool when troubleshooting, far faster than clicking through streams one by one in the console.

## Metrics: built-in vs custom metrics, dimensions, and EMF

<Term en="Metric" desc="A series of numeric data points over time that CloudWatch charts and alarms on.">Metrics</Term> come in two kinds:

- **Built-in (AWS-provided)**: metrics that AWS services emit automatically, with nothing for you to do. For example, Lambda automatically has `Invocations`, `Errors`, `Throttles`, `Duration`, `ConcurrentExecutions`; API Gateway has `4XXError`, `5XXError`, `Latency`, `Count`.
- **Custom metric**: a business number you send yourself, such as successful checkouts, cart abandonment rate, or the response time of some external API. AWS does not measure these for you, so you push them.

A **dimension** is a key-value label on a metric that lets you slice the same metric. For example, the `Errors` metric with dimension `FunctionName=order-processor` versus `FunctionName=email-sender` lets you see the errors of each function separately.

:::info[🔑 Why custom metrics? Are built-ins not enough?]
Built-in metrics only know the technical side (how many runs, how many errors, how many milliseconds). They do not understand your business. Business numbers like how many checkouts succeeded today, or how many people added to cart but did not check out, are known only to your code, so custom metrics carry them up. When something breaks, business metrics often tell you there is a real problem earlier and more accurately than technical ones.
:::

### Two ways to send custom metrics: put-metric-data vs EMF

There are two routes to send custom metrics, and DVA loves to test whether you can tell them apart:

| Way | How it works | Pros and cons |
| --- | --- | --- |
| **`PutMetricData` API** | Call the API directly in your code to push the number | Intuitive; but each call is a synchronous API call that eats execution time inside Lambda (and may get throttled, adding latency and cost). |
| **EMF embedded metric format** | Print one line of JSON in EMF shape, and CloudWatch extracts the metric automatically while reading logs | No extra API call and no execution time cost (you are just logging); the same record is both a log and a metric. AWS recommends EMF in Lambda scenarios. |

The spirit of <Term en="Embedded Metric Format" desc="A structured JSON log format; once printed in this shape, CloudWatch extracts metrics from the logs automatically, with no separate PutMetricData call.">EMF</Term> is that you only print logs and metrics appear on their own. That pays off especially in Lambda, where every millisecond is billed and you do not want extra synchronous API calls. AWS provides an EMF library (`aws-embedded-metrics`) that produces the correct shape for you.

## Alarms: thresholds, actions, and pairing with SNS

An <Term en="CloudWatch Alarm" desc="Continuously watches a metric and changes state and triggers actions (notify, scale, run a Lambda) when it crosses a threshold over the configured period.">alarm</Term> watches a metric and does something when it crosses a threshold. Setting one means thinking through four things:

1. **Which metric, statistic, and period**: for example, the Lambda `Errors` metric with the **Sum** statistic over a **1-minute** period. Picking the wrong statistic is a common trap (see below).
2. **Threshold and evaluation periods**: for example, trigger only when it is **greater than or equal to 5** for **3** consecutive periods, to avoid false alarms from the occasional jitter.
3. **States**: `OK` (healthy), `ALARM` (breached), `INSUFFICIENT_DATA` (not enough data to judge).
4. **Actions**: what to do on `ALARM`. The most common is to send an <Term en="Simple Notification Service" desc="AWS publish/subscribe notification service; one message can fan out to many subscribers at once such as email, SMS, Lambda, and HTTP endpoints.">SNS</Term> notification (email, SMS, trigger Lambda, push to Slack); it can also trigger Auto Scaling or an EC2 action.

<Scenario title="Real scenario: get notified the instant the error rate spikes, before the complaints">

You want to be notified the moment your order Lambda errors more than 5 times within 5 minutes. Build a CloudWatch Alarm on the `AWS/Lambda` `Errors` metric (dimension pinned to your function), statistic **Sum**, period 1 minute, threshold greater than or equal to 5 within 5 minutes, and set the alarm action to publish to an SNS topic that your phone email is subscribed to. From then on, the instant errors spike, your phone pings and you are already reading logs before any user calls in.

</Scenario>

## Dashboards: gather the most important charts onto one wall

A <Term en="CloudWatch Dashboard" desc="A customisable monitoring panel that gathers multiple metric charts, alarm states, and Logs Insights queries on one page for an at-a-glance view of system health.">Dashboard</Term> lets you put key charts across services and regions on one page: Lambda error rate, API Gateway latency, DynamoDB throttling, your custom business metrics, and so on. On shift you glance once and know whether the system is healthy, with no jumping between service pages. Dashboards can be shared with the team and can even host Logs Insights query results as a widget.

## Fixed section: CloudWatch vs CloudTrail vs X-Ray — what each shows, and when to use which

These three have similar-sounding names, are extremely easy to confuse, and DVA tests them almost every time. One line to lock in first: CloudWatch shows whether the system is healthy, CloudTrail shows who did what, and X-Ray shows where this one request is slow.

| | What it answers | Main data | Typical use |
| --- | --- | --- | --- |
| **CloudWatch** | "Is the system healthy right now? Did something break?" | Logs, metrics, alarms | Watch error rate and latency, read application logs, notify on breach |
| **CloudTrail** | "Who called which AWS API, and when?" | An audit trail of API calls | Auditing, security investigation, compliance, "who deleted that bucket" |
| **X-Ray** | "Which services did this one request touch, and where is it slow?" | Distributed traces (trace / segment) | Microservice and serverless performance debugging, finding latency bottlenecks |

**When to use which (in plain words):**

- You want to know that your function has been erroring a lot lately and latency is up: use **CloudWatch** (metrics plus alarms plus logs).
- You want to know exactly who deleted that S3 bucket or changed an IAM policy at 3am: use **CloudTrail** (it records every API caller, source IP, and time).
- You want to know whether the checkout chain is slow because of Lambda, DynamoDB, or an external API: use **X-Ray** (it breaks one request end to end and shows the time of each segment).

**Pros and cons:**

- **CloudWatch** — Pros: ubiquitous, nearly every service has built-in metrics, simple to set up, the first stop for troubleshooting. Cons: logs with no retention set bill forever; high-cardinality dimensions blow up cost (see below); it cannot see who called an API, which is CloudTrail territory.
- **CloudTrail** — Pros: a complete audit trail, essential for security and compliance, management events are queryable for 90 days by default. Cons: it is not a real-time monitoring tool (do not use it as your alarm backbone); data events (such as S3 object level) must be enabled separately and cost extra; it does not tell you what happened inside your application.
- **X-Ray** — Pros: end-to-end tracing across services, instantly reveals the slow segment, superb for microservices and serverless. Cons: you must instrument the SDK or enable tracing to get data (not zero-config); it samples (by default not every request is traced); billed per trace.

:::tip[💡 Exam focus: keyword mapping]
- Question mentions auditing, who called or deleted, compliance, API call history, source IP: **CloudTrail**.
- Question mentions error rate or latency alarms, reading application logs, custom business metrics: **CloudWatch**.
- Question mentions cross-service latency, finding a performance bottleneck, end-to-end tracing, service map: **X-Ray**.
:::

## 🛠️ Hands-on: send a custom metric, set an alarm, then query with Logs Insights

Each step below includes what you should expect to see. Do it once and it clicks.

### 1) Send a custom metric with put-metric-data

```bash
# Send one data point "CheckoutSuccess = 1" to namespace MyApp/Orders with one dimension
aws cloudwatch put-metric-data \
  --namespace "MyApp/Orders" \
  --metric-name CheckoutSuccess \
  --value 1 \
  --unit Count \
  --dimensions Environment=prod
```

**Expected result**: the command prints nothing (silence means success). After 1 to 2 minutes, go to the CloudWatch console under **Metrics, custom namespace `MyApp/Orders`**, and you will see the `CheckoutSuccess` metric; open it to chart a line graph.

### 2) Set an alarm on this metric, paired with SNS

```bash
# First create an SNS topic and subscribe your email (then click the confirm link in your inbox)
aws sns create-topic --name order-alerts
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:111122223333:order-alerts \
  --protocol email \
  --notification-endpoint you@example.com

# Create the alarm: Lambda Errors "Sum >= 5 within 5 minutes" publishes to SNS
aws cloudwatch put-metric-alarm \
  --alarm-name order-processor-errors \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --dimensions Name=FunctionName,Value=order-processor \
  --statistic Sum \
  --period 60 \
  --evaluation-periods 5 \
  --threshold 5 \
  --comparison-operator GreaterThanOrEqualToThreshold \
  --treat-missing-data notBreaching \
  --alarm-actions arn:aws:sns:us-east-1:111122223333:order-alerts
```

**Expected result**: `put-metric-alarm` prints nothing on success. Under **Alarms** in the console you will see `order-processor-errors`, usually starting in `INSUFFICIENT_DATA` and turning `OK` once data arrives. When the function really errors up to the threshold, the state turns `ALARM` and your email gets a notification (as long as you already clicked the SNS confirm link).

### 3) Use Logs Insights to query "how many errors in the last hour, and when"

In the console under **Logs, Logs Insights**, select the log group `/aws/lambda/order-processor` and paste:

```
fields @timestamp, @message
| filter @message like /ERROR/
| stats count() as errorCount by bin(5m)
| sort @timestamp desc
```

**Expected result**: it lists the error count (`errorCount`) in one row per 5 minutes, so you instantly see which time window the errors spiked in. Swap `like /ERROR/` for your own keyword (such as an orderId) to pull every log line of a specific request.

## Real-world use: more than the exam

<Scenario title="Real scenario: tie all logs of one request together with a request ID">

A user reports that one order was double charged. You know the request ID of that call (available from the API Gateway response or the front-end log). In Logs Insights, run `filter @requestId = "<that id>"` over `/aws/lambda/order-processor` to pull every log line of that one execution from start to finish, and see whether a retry caused double processing (in which case go back and check the function is idempotent). This is far faster than blindly scanning the whole group, and it is why the advice above was to put a request ID on every log line.

</Scenario>

<Cost>

**Most CloudWatch items have a free tier** (such as 10 custom metrics, some API calls, a small amount of log ingestion), but three places quietly burn money: (1) log ingestion and storage, since a log group with no retention set defaults to never expire, so logs pile up forever and keep billing; (2) custom metrics, where every metric-name-by-dimension combination is billed as a separate metric, so high-cardinality dimensions (such as using userId as a dimension) explode into thousands of metrics; (3) Logs Insights queries, billed by data scanned, so wild queries over huge groups get expensive. Fix: always set a retention period, keep dimensions low-cardinality, and narrow the time range before querying. When done practising, clean up the test alarms, SNS topics, and log groups.

</Cost>

:::warning[🚑 Common traps]
- **No retention set on a log group**: the default is never expire, so logs grow without bound and bill forever. Always set a sensible number of days with `aws logs put-retention-policy` (such as 14 or 30 days).
- **High-cardinality dimensions blow up cost**: using values that differ on every record, such as `userId`, `requestId`, or `orderId`, as a metric dimension instantly creates thousands of billed metrics. High-cardinality data belongs in logs (queried with Logs Insights), not as a dimension.
- **Wrong statistic or period on an alarm**: to watch total errors use **Sum**, not **Average** (an average can be diluted until the spike disappears); a period and evaluation periods set too long react too slowly, too short causes false alarms. Think it through before you set it.
- **Lambda execution role missing logs permissions**: the function clearly has `console.log` but CloudWatch has no logs at all, usually because the execution role lacks `logs:CreateLogGroup` / `logs:CreateLogStream` / `logs:PutLogEvents` (attaching the managed policy `AWSLambdaBasicExecutionRole` is the easy fix).
- **Thinking CloudWatch can see who called an API**: that is **CloudTrail** territory. CloudWatch watches system health and application logs; it cannot tell you who called or deleted which AWS resource and when. Chase the wrong tool and you will never find it.
:::

<Refs title="📚 Official docs & further reading">

- [Amazon CloudWatch User Guide](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/WhatIsCloudWatch.html)
- [CloudWatch Logs: log groups and log streams](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/Working-with-log-groups-and-streams.html)
- [CloudWatch Logs Insights query syntax](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CWL_QuerySyntax.html)
- [Publishing custom metrics and the EMF embedded metric format](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Embedded_Metric_Format.html)
- [Using CloudWatch alarms](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/AlarmThatSendsEmail.html)
- [How CloudTrail, CloudWatch, and X-Ray differ](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-user-guide.html)

</Refs>

## Next step

👉 Next: [X-Ray Distributed Tracing](./xray-tracing.md)
