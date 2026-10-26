---
sidebar_position: 7
title: Domain 4 Quiz
---

# Domain 4 Practice Questions (official-exam style)

Pick your answer first, then click **Show answer & explanation**. This page mirrors the DVA-C03 exam style: **scenario-based stems from a developer operations and optimization point of view**, testing the development details and trade-offs of **troubleshooting and optimization** — observability (CloudWatch custom metrics/alarms, Logs Insights queries, log retention, CloudWatch vs CloudTrail), distributed tracing (X-Ray annotation vs metadata, using the service map to find the slow segment, how to enable tracing), error handling (exponential backoff with jitter, idempotency, what to do about 429/Throttling, DLQ, Lambda partial batch failure reporting, retryable vs non-retryable), performance optimization (Lambda memory tuning, placing connections outside the handler, cold starts, choosing a caching layer, avoiding DynamoDB Scan), and debugging (403 permission issue vs code bug, IAM policy simulator, AI-assisted debugging still needs human verification). Options are all plausible AWS approaches (distractors are never obviously wrong), and some questions use **qualifiers** like "MOST aligned with best practice / MOST effective / MOST likely cause" to force comparison. Includes both **single-answer** and **multiple-response (Choose TWO)** questions. These are **original** content (not real exam questions).

<Quiz
  qnum={1}
  total={20}
  question="A developer wants to track a business number the application defines itself (for example successful orders per minute), which is not a metric any AWS service emits natively. What is the best approach?"
  options={[
    'Write the order count into application logs and tally it manually by reading the logs',
    'Publish a custom metric to CloudWatch (for example using PutMetricData or the Embedded Metric Format EMF), then build charts and alarms on it',
    'CloudWatch does not support custom metrics and can only show built-in AWS service metrics',
    'Use CloudTrail to record every order event and treat that as the metric',
  ]}
  answer={1}>

**Correct answer: B**

Your own business numbers call for a **CloudWatch custom metric**: you can call `PutMetricData` directly, or in environments like Lambda use the **Embedded Metric Format (EMF)** to write metrics into logs so CloudWatch extracts them into metrics, after which you can chart them and set alarms. A reading logs manually gives no real-time monitoring and no alarms; C is wrong because CloudWatch does support custom metrics; D is wrong because CloudTrail records an API audit trail, not business metrics.

</Quiz>

<Quiz
  qnum={2}
  total={20}
  question="A team wants to automatically notify the on-call engineer when the 5-minute average latency of an API stays above 500 milliseconds. What is the best mechanism in CloudWatch?"
  options={[
    'Manually check the metric in the console every few minutes',
    'Create a CloudWatch alarm on that latency metric with a threshold and evaluation period, notifying the on-call engineer through SNS when it fires',
    'Write the latency into S3 and run a scheduled program to evaluate it yourself',
    'CloudWatch can only display metrics and cannot notify proactively',
  ]}
  answer={1}>

**Correct answer: B**

Automatically notifying on a threshold is exactly what a **CloudWatch alarm** is for: set a threshold (500 milliseconds) and an evaluation period (how many consecutive data points) on the latency metric, and when it enters the ALARM state it triggers an action, commonly publishing to an **SNS** topic that fans out to the on-call engineer (email/SMS/pager). A manual watching is neither timely nor reliable; C building your own adds operational burden; D is wrong because alarms are exactly the proactive notification capability of CloudWatch.

</Quiz>

<Quiz
  qnum={3}
  total={20}
  question="All of a service logs go into CloudWatch Logs. A developer wants to use a SQL-like query to find all records containing a specific error code across a large volume of logs and count them per time window. What is the best tool?"
  options={[
    'Download the whole log archive locally and search it in a text editor',
    'CloudWatch Logs Insights, using its query language to filter, aggregate, and summarize across log groups',
    'CloudTrail Insights',
    'Only expand each log stream one by one and read them manually',
  ]}
  answer={1}>

**Correct answer: B**

**CloudWatch Logs Insights** provides a query language to run `filter`, `stats`, `parse`, and more across one or more **log groups**, quickly surfacing records with a specific error code and aggregating them by time, which is the go-to for finding problems in large volumes of logs. A downloading locally does not scale; C CloudTrail Insights detects anomalies in API activity, not application logs; D reading one by one is far too slow.

</Quiz>

<Quiz
  qnum={4}
  total={20}
  question="The CloudWatch Logs bill keeps rising, and investigation shows many log groups have never-expire retention when only 30 days are actually needed. What is MOST aligned with cost optimization?"
  options={[
    'Manually delete all the logs one by one',
    'Set a 30-day retention policy on each log group so older logs expire automatically, and export to S3 if long-term archival is needed',
    'Disable CloudWatch Logs and stop collecting logs entirely',
    'Log retention cannot be configured and logs must be kept forever',
  ]}
  answer={1}>

**Correct answer: B**

CloudWatch Logs default to **never expire**, so long-term accumulation keeps billing. The right approach is to set a **retention policy** on each log group per your needs (such as 30 days) so older logs are deleted automatically to control cost; if compliance requires long-term keeping, **export or subscribe to S3** (cheaper long-term storage) with lifecycle policies. A manual deletion is impractical; C collecting no logs at all loses observability, which overshoots; D is wrong because retention is configurable.

</Quiz>

<Quiz
  qnum={5}
  total={20}
  question="An auditor asks who called the DeleteBucket API last week, from which IP, and under what identity. A separate need is to chart the error rate trend of a service over the past hour. Regarding the division of labor between CloudWatch and CloudTrail, which TWO statements are correct? (Choose TWO)"
  options={[
    'CloudTrail records API calls in the account (who, when, from where, what they did), suitable for audit and operational-trail questions',
    'CloudWatch collects metrics and logs, charts trends, and sets alarms, suitable for monitoring questions like performance and error rate',
    'CloudTrail is the primary tool for charting real-time performance trends',
    'CloudWatch records the identity and source IP of every AWS API caller as an audit trail',
    'They are two names for the same service with identical functionality',
  ]}
  answer={[0, 1]}>

**Correct answer: A, B**

The two serve different purposes: **CloudTrail** is the **audit/operational trail**, recording **API calls** in the account (who, when, from which IP, what action, success or failure), which answers questions like who deleted the bucket; **CloudWatch** is **monitoring**, collecting **metrics and logs**, charting trends, and setting **alarms**, which answers performance questions like error rate, latency, and CPU. C is wrong because charting performance trends is a CloudWatch job; D is wrong because recording the caller identity and source IP is the responsibility of CloudTrail; E is wrong because they are different services.

</Quiz>

<Quiz
  qnum={6}
  total={20}
  question="A microservice architecture consists of API Gateway, several Lambdas, and DynamoDB, and one request is occasionally slow but nobody knows which segment is slow. The developer wants to see which services a request passes through and how long each segment takes. What is the best tool?"
  options={[
    'Only look at the average CloudWatch metrics of the Lambdas',
    'Enable AWS X-Ray for distributed tracing and use the service map and trace timeline to see time spent per segment and locate the slowest one',
    'Add print timing in each function and compare them manually',
    'X-Ray can only trace a single function and cannot span services',
  ]}
  answer={1}>

**Correct answer: B**

A request crossing multiple services calls for **distributed tracing**: with **AWS X-Ray** enabled, it stitches the handling of one request across services into a single **trace**, uses the **service map** to show the topology and per-segment latency, and lets you drill into the trace timeline to see which segment (a Lambda? a DynamoDB query? a downstream API?) is slowest, quickly locating the bottleneck. A average metrics cannot reveal per-request segment timing; C manual timing is scattered and hard to stitch across services; D is wrong because X-Ray is designed for cross-service tracing.

</Quiz>

<Quiz
  qnum={7}
  total={20}
  question="In X-Ray a developer wants to filter and group traces by customer tier and order amount to find requests that are slow only under specific conditions. Regarding X-Ray annotations and metadata, which statement is MOST correct?"
  options={[
    'Annotations and metadata are exactly the same and either can be indexed and searched',
    'Annotations are indexed and can be used to filter and group traces; metadata is not indexed and is just extra detail for viewing',
    'Metadata is indexed and can be used to filter, while annotations cannot',
    'Neither annotations nor metadata can be searched in the X-Ray console',
  ]}
  answer={1}>

**Correct answer: B**

In X-Ray, **annotations** are key-value pairs that are **indexed** and can be used in **filter expressions** to search and group traces (so dimensions you want to filter by, like customer tier and order amount, belong in annotations); **metadata** is **not indexed** and is just extra detail you can view within a trace but **cannot** use to filter searches. A, C, and D all reverse or confuse which one can be indexed and searched.

</Quiz>

<Quiz
  qnum={8}
  total={20}
  question="A developer wants to enable X-Ray tracing for a Lambda function and have it automatically create subsegments for downstream AWS SDK calls such as DynamoDB. What is the MOST correct combination?"
  options={[
    'Do nothing, because Lambda fully traces all downstream calls by default',
    'Turn on Active tracing in the function configuration, instrument the AWS SDK clients with the X-Ray SDK in code to auto-create downstream subsegments, and ensure the execution role has permission to write to X-Ray',
    'Just import the X-Ray SDK in code and tracing is enabled automatically with no configuration or permission needed',
    'The function must be changed to a container image to support X-Ray',
  ]}
  answer={1}>

**Correct answer: B**

Enabling tracing for Lambda takes two things together: turn on **Active tracing** in the function configuration so the service layer produces traces, and **instrument** the AWS SDK clients with the **X-Ray SDK** in code so downstream calls such as DynamoDB automatically get **subsegments**. Do not forget the execution role needs permission to write to X-Ray (commonly the managed policy `AWSXRayDaemonWriteAccess`). A is wrong because without enabling and instrumenting there is no full downstream tracing; C is wrong because importing alone, without Active tracing or permission, does nothing; D is wrong because it has nothing to do with being a container image.

</Quiz>

<Quiz
  qnum={9}
  total={20}
  question="A function occasionally gets transient errors when calling a downstream API. The team wants to retry but worries that if everyone fails at once and then retries together at a fixed interval, the spike overwhelms the downstream (a retry storm). Which retry strategy is MOST aligned with best practice?"
  options={[
    'Retry every 1 second at a fixed interval until it succeeds',
    'Exponential backoff with jitter: the wait between retries grows exponentially and adds random jitter to spread out retry timing, with a retry cap',
    'Do not retry at all and let the request fail immediately on the first error',
    'Retry hundreds of times back-to-back with no interval',
  ]}
  answer={1}>

**Correct answer: B**

The best practice for retrying transient errors is **exponential backoff with jitter**: the wait grows exponentially with each retry (such as 1, 2, 4 seconds) to avoid dense retries, and **random jitter** scatters the retry timing across clients so they do not all retry at once and form a spike (retry storm), with a **retry cap**. A fixed intervals still synchronize into a spike; C never retrying turns self-healing transient errors into failures; D no-interval hammering overwhelms the downstream directly.

</Quiz>

<Quiz
  qnum={10}
  total={20}
  question="A function calling DynamoDB or an API receives HTTP 429 (Too Many Requests / ThrottlingException). What is the MOST appropriate handling?"
  options={[
    'Treat it as a permanent code bug and let the request fail without calling again',
    'This is a throttling signal and a retryable error: retry with exponential backoff and jitter, and if it persists, review whether to raise capacity or smooth the traffic',
    'Immediately raise the call rate even higher and try to push through',
    'Ignore the 429, treat it as a success response, and continue',
  ]}
  answer={1}>

**Correct answer: B**

A **429 / ThrottlingException** means you are sending too fast and are being **throttled**, a classic **retryable** error: the right approach is to retry later with **exponential backoff and jitter**; if it keeps happening, real demand exceeds current capacity, so fix it at the source — raise provisioned capacity (or switch to on-demand), add caching, or smooth/queue the traffic. A treating it as a permanent bug is a misdiagnosis; C going higher only gets throttled harder; D ignoring the 429 causes data loss or logic errors.

</Quiz>

<Quiz
  qnum={11}
  total={20}
  question="A payment function may be retried multiple times for the same request (network resends, SQS at-least-once, and so on). To avoid charging the same payment twice because of a retry, what should development most ensure?"
  options={[
    'Assume a message is always delivered exactly once and add no protection',
    'Make it idempotent: use a unique idempotency key (such as a request ID) to record already-processed requests, and do not repeat the side effect when the same key arrives again',
    'Turn off retries entirely so there is no duplication',
    'Add a new charge each time and manually reconcile and delete duplicates later',
  ]}
  answer={1}>

**Correct answer: B**

Distributed systems are often **at-least-once**, so the same request can be resent, and operations with side effects like payments must be made **idempotent**: use a **unique idempotency key** (such as a client-generated request ID) to record in a database (for example a DynamoDB conditional write) that this one was processed, and when the same key arrives again return the existing result without charging again. A assuming exactly-once is unrealistic; C turning off retries sacrifices reliability, and resends come from more than just retries; D manual reconciliation afterward is slow and error-prone.

</Quiz>

<Quiz
  qnum={12}
  total={20}
  question="A Lambda triggered by SQS processes several messages per batch. Right now, if any one message in the batch fails, the whole batch is redelivered and even the ones that succeeded are rerun. The team wants only the truly failed messages to be retried. What is the best approach?"
  options={[
    'Set the batch size to 1, sacrificing throughput',
    'Enable partial batch response (ReportBatchItemFailures) so the function returns a batchItemFailures list identifying only the failed messages, so only those are redelivered and the successful ones are not rerun',
    'Catch and swallow errors in code and pretend everything succeeded',
    'SQS does not support retrying only some messages and can only redeliver the whole batch',
  ]}
  answer={1}>

**Correct answer: B**

For an SQS-triggered Lambda, enable **partial batch response (ReportBatchItemFailures)**: turn this on in the event source mapping, and the function returns a `batchItemFailures` list naming only the **IDs of the failed messages**, so only those are redelivered (or sent to a DLQ) while the **successful ones are not rerun**, balancing throughput and correctness. A a batch size of 1 drops throughput sharply; C swallowing errors causes data loss; D is wrong because ReportBatchItemFailures is exactly what supports partial retry.

</Quiz>

<Quiz
  qnum={13}
  total={20}
  question="An asynchronously invoked Lambda (for example triggered by an S3 event) has a few messages that repeatedly fail and then vanish after retries are exhausted, and the team has no idea what was lost. What is the best approach?"
  options={[
    'Leave it, and let failures simply disappear',
    'Configure a dead-letter queue (DLQ) or an on-failure destination so events that still fail after retries are preserved for later inspection, analysis, and replay after a fix',
    'Set the retry count to infinity until it succeeds',
    'Set the function timeout to the maximum so there will be no failures',
  ]}
  answer={1}>

**Correct answer: B**

For asynchronous invocations or queue triggers, configure a **dead-letter queue (DLQ)** or the Lambda **on-failure destination**: when an event still fails after retries are exhausted, it is sent to SQS/SNS and preserved, so the team can **inspect the failure content, analyze the cause, and replay it after a fix** instead of losing it silently. A letting failures vanish loses data with no trace; C infinite retries block subsequent messages and waste resources; D timeout is unrelated to this failure handling and solves nothing.

</Quiz>

<Quiz
  qnum={14}
  total={20}
  question="When writing retry logic, a developer wants to retry only errors that should be retried and give up on ones that should not. Regarding judging retryable vs non-retryable errors, which TWO statements are correct? (Choose TWO)"
  options={[
    'Throttling (429 / ThrottlingException) and 5xx transient server-side errors are usually retryable and suit exponential backoff',
    '400 parameter errors and 403 insufficient-permission errors are client errors that are usually non-retryable; retrying fails the same way, so fix the request or the permission',
    'All errors should be retried infinitely because they will eventually succeed',
    'A 404 Not Found should be retried at an even higher rate until the resource appears',
    'No error should ever be retried and everything should just fail immediately',
  ]}
  answer={[0, 1]}>

**Correct answer: A, B**

Whether to retry depends on the nature of the error: **throttling (429) and 5xx transient server errors** are mostly **retryable** and suit exponential backoff with jitter; while **400 (parameter error) and 403 (insufficient permission)** client errors are usually **non-retryable** — resending unchanged fails again, so you should fix the request content or add the permission. C infinite retries amplify the failure and waste resources; D a 404 usually means the resource really is not there, so hammering is pointless; E never retrying turns self-healing transient errors into failures.

</Quiz>

<Quiz
  qnum={15}
  total={20}
  question="A compute-intensive Lambda runs slowly and costs a lot, and the team finds it is configured with the minimum memory. Regarding tuning Lambda memory, which statement is MOST correct?"
  options={[
    'Lower memory is always cheaper, so it should always be set to the minimum',
    'Lambda CPU and compute scale proportionally with memory; raising memory may make the function run faster, and the shorter run time can even lower total cost, so measure to find the sweet spot (Lambda Power Tuning can help)',
    'The memory setting does not affect performance and only affects how much memory is available',
    'The only way to speed it up is to split it into several functions; changing memory does nothing',
  ]}
  answer={1}>

**Correct answer: B**

Lambda **CPU and other compute resources scale proportionally with the configured memory**. For a compute-intensive function, **raising memory** often makes it run faster, and with the run time cut sharply, the total cost computed as memory times duration **can even go down** while latency improves. The best practice is to **measure** time and cost at different memory settings to find the sweet spot (the open-source tool **Lambda Power Tuning** helps). A minimum memory is not necessarily cheapest (it may be slower and pricier for running too long); C is wrong because memory directly drives CPU and performance; D is wrong because tuning memory is the easiest first step.

</Quiz>

<Quiz
  qnum={16}
  total={20}
  question="A Lambda creates a database connection or SDK client inside the handler function on every invocation, so it pays the connection-setup cost each time and the connection count explodes. What should performance optimization most do?"
  options={[
    'Keep it as is, because rebuilding the connection on every request is safest',
    'Move heavyweight resource initialization such as database connections and SDK clients outside the handler (at module load), reusing them across invocations via warm starts instead of rebuilding each time',
    'Hard-code the connection in an environment variable string',
    'Open a few extra spare connections on every invocation',
  ]}
  answer={1}>

**Correct answer: B**

The Lambda execution environment is reused on a **warm start**, so objects created outside the `handler` (at module initialization) can be **reused across invocations**. Therefore, put heavyweight initialization such as **database connections, SDK clients, and config reads** **outside** the handler so they are created once on cold start and reused afterward, reducing per-invocation setup cost and connection-count explosions. A rebuilding each time wastes time and exhausts the connection pool; C putting a connection string in config is fine, but the point is reusing the connection object; D opening more connections only exhausts the downstream connection count faster.

</Quiz>

<Quiz
  qnum={17}
  total={20}
  question="A latency-sensitive Lambda occasionally has an especially slow first call (cold start) that hurts user experience, and the team wants to reduce the cold-start impact. Which TWO are reasonable and effective approaches? (Choose TWO)"
  options={[
    'Configure provisioned concurrency to keep a number of execution environments warm, eliminating cold starts for those environments',
    'Trim the deployment package and dependencies and move initialization like connections outside the handler to shorten init time',
    'Set memory to the minimum to speed up cold starts',
    'Stuff all the function logic into one huge dependency package to make cold starts faster',
    'Cold starts cannot be improved at all and must simply be accepted',
  ]}
  answer={[0, 1]}>

**Correct answer: A, B**

Reasonable ways to reduce cold-start impact: one is to configure **provisioned concurrency** for latency-sensitive functions, keeping a number of execution environments pre-warmed so incoming requests do not cold start; the other is to **shorten init time** — trim the deployment package and dependencies, avoid overly heavy frameworks, and move initialization like connections outside the handler to take advantage of reuse. C is wrong because memory that is too low actually makes init and execution slower; D is wrong because a larger package loads longer and makes cold starts slower; E is wrong because cold starts can be significantly mitigated.

</Quiz>

<Quiz
  qnum={18}
  total={20}
  question="A read-heavy, write-light service often queries the same set of hot data repeatedly and wants to reduce database read latency and load. Regarding adding a caching layer, which statement is MOST correct?"
  options={[
    'Adding a cache always makes the system more complex with no benefit and should never be used',
    'Add a cache in front of the database (such as ElastiCache for Redis, or DAX for DynamoDB) so hot reads hit the cache to lower latency and backend load; mind cache consistency and invalidation strategy',
    'A cache can only store images and not query results',
    'As long as the cache never expires there will be no problems at all',
  ]}
  answer={1}>

**Correct answer: B**

For **read-heavy workloads that repeatedly read the same hot data**, adding a **caching layer** in front of the database greatly lowers read latency and backend load: use **ElastiCache (Redis/Memcached)** for the general case, or the built-in **DAX** cache if the backend is DynamoDB. But design the **invalidation and consistency strategy** well (TTL, update-or-clear cache on write) to avoid reading stale data. A the benefit is clear for read-heavy workloads, so the claim overstates it; C is wrong because a cache can store query results and other data; D is wrong because never expiring reads stale data and breaks consistency.

</Quiz>

<Quiz
  qnum={19}
  total={20}
  question="A DynamoDB-backed page gets slower and consumes a lot of read capacity. Investigation shows the code uses Scan to read the whole table and then filters the wanted items in the application. What should performance optimization most change this to?"
  options={[
    'Keep using Scan but keep raising read capacity',
    'Use Query to fetch data precisely by partition key (adding a sort key condition when needed); if a non-key attribute is often queried, create a global secondary index (GSI) and Query it, avoiding a full-table Scan',
    'Load the whole table into Lambda memory and query it there',
    'DynamoDB can only use Scan and has no other way to query',
  ]}
  answer={1}>

**Correct answer: B**

**Scan reads the entire table** and then discards non-matching items, which gets slow and burns read capacity as data grows, so avoid it. The answer is **Query**: hit the target items directly by **partition key** (adding a **sort key** condition when needed); if the common query condition is not an existing key, create a **global secondary index (GSI)** so that query can also use Query precisely instead of scanning the whole table. A endlessly raising capacity treats the symptom and costs more; C loading the whole table into memory is infeasible and does not fix the root cause; D is wrong because Query and indexes exist precisely for this.

</Quiz>

<Quiz
  qnum={20}
  total={20}
  question="A Lambda consistently gets AccessDenied when calling S3, but the same code logic runs fine locally with the developer own credentials. What is the MOST likely cause and the MOST effective tool to investigate?"
  options={[
    'It must be a code logic bug unrelated to permissions, so the whole section should be rewritten',
    'It is likely the execution role missing permission for that S3 action or resource (a permission issue, not a code bug); use the IAM policy simulator or review the AccessDenied in CloudTrail to confirm and add least-privilege permission',
    'The S3 service is down and you just wait for it to recover',
    'Granting the execution role AdministratorAccess directly is the best fix',
  ]}
  answer={1}>

**Correct answer: B**

Working locally with developer credentials but getting **AccessDenied** in Lambda is a classic **permission issue, not a code bug**: Lambda uses its **execution role**, which likely lacks the matching S3 action or resource permission. To investigate, use the **IAM policy simulator** to simulate how that role evaluates the action, or look at the **AccessDenied** events in **CloudTrail** to find the denied action, then add the needed permission following **least privilege**. A suspecting the code first leads you astray (403 is mostly permissions); C treating it as a service outage is a misdiagnosis; D granting Administrator directly violates least privilege and is a major security risk.

</Quiz>

Domain 4 complete! You have finished all four DVA domains. Next, take the full mock exam.
