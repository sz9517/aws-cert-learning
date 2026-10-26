---
sidebar_position: 8
title: Domain 1 Quiz
---

# Domain 1 Practice Questions (official-exam style)

Pick your answer first, then click **Show answer & explanation**. This page mirrors the DVA-C03 exam style: **scenario-based stems from a developer point of view**, testing **development details and trade-offs** (concurrency, version aliases, retries, cold starts, integration choices, index design, consistency, event-driven flows) rather than the pure architecture selection of SAA. Options are all plausible AWS approaches (distractors are never obviously wrong), and some questions use **qualifiers** like "with the LEAST code change / MOST aligned with best practice / MOST cost-effectively" to force comparison. Includes both **single-answer** and **multiple-response (Choose TWO)** questions. These are **original** content (not real exam questions).

<Quiz
  qnum={1}
  total={20}
  question="A developer sets a Lambda function reserved concurrency to 0 as an emergency way to stop it from processing events. After this change, what happens to new invocations?"
  options={[
    'The function still runs normally, just more slowly',
    'The function is throttled: synchronous callers get a 429 and asynchronous sources will retry',
    'The function is automatically deleted',
    'The function switches to running with provisioned concurrency',
  ]}
  answer={1}>

**Correct answer: B**

Setting reserved concurrency to 0 caps the available concurrency at 0, so every invocation is **throttled**: synchronous callers (such as API Gateway) get `429 TooManyRequestsException`, and asynchronous sources (such as S3 or SNS) retry according to their retry policy. This is a common way to hit the brakes. A is wrong because 0 concurrency blocks rather than slows; C and D are unrelated to reserved concurrency.

</Quiz>

<Quiz
  qnum={2}
  total={20}
  question="A team wants the production API Gateway to point at a stable Lambda version while making it easy to switch quickly or do canary releases later, and they do not want to change API Gateway settings on every release. What is the best approach?"
  options={[
    'Point the API Gateway integration at the new $LATEST on every release',
    'Point the API Gateway integration at a Lambda alias and just move the alias on each release',
    'Hard-code the version number into the API Gateway integration ARN',
    'Rebuild the entire API Gateway on every release',
  ]}
  answer={1}>

**Correct answer: B**

An **alias** is a movable pointer to a specific function version. Pointing the API Gateway integration at the alias means a release only moves the alias to the new version (or uses weighting across two versions for a canary), and API Gateway never changes. A using `$LATEST` is not stable and cannot do weighted traffic; C hard-coding a version forces a change every time; D is overkill.

</Quiz>

<Quiz
  qnum={3}
  total={20}
  question="A Lambda function spends several seconds on every cold start building a database connection pool and loading config, which makes the first request slow. The developer wants to reduce the cold-start impact with the LEAST code change. Which approach is best?"
  options={[
    'Put the connection pool and config loading inside the handler function so it is rebuilt on every invocation',
    'Put the connection pool and config loading outside the handler (the init phase) and enable provisioned concurrency on the alias',
    'Set memory to the minimum to speed up startup',
    'Switch to synchronous invocation to avoid cold starts',
  ]}
  answer={1}>

**Correct answer: B**

Code in the **init phase outside the handler** runs only once when the execution environment is created, so warm invocations reuse the connection; enabling **provisioned concurrency** on the alias pre-initializes a pool of environments and nearly eliminates cold-start latency. A rebuilds everything on each invocation; C less memory is usually slower because CPU scales with memory; D the invocation type has nothing to do with cold starts.

</Quiz>

<Quiz
  qnum={4}
  total={20}
  question="A Lambda function needs a database connection string and a feature flag. The connection string contains a password, and the team requires that secrets are never stored in plain text and can be rotated centrally, while ordinary config should be fast to read. How should the developer design this? (Choose TWO)"
  options={[
    'Store the database password in Secrets Manager and fetch it during initialization',
    'Store the database password in plain text in a Lambda environment variable',
    'Keep non-secret config such as the feature flag in an environment variable or a Parameter Store parameter',
    'Hard-code all values in the code so a redeploy is required to change them',
    'Put the password in the function resource policy',
  ]}
  answer={[0, 2]}>

**Correct answer: A, C**

Secrets (the password) belong in **Secrets Manager**, which supports central rotation and no plain-text exposure, fetched by the function during initialization. Non-secret config (the feature flag) can go in an **environment variable or Parameter Store**, which is simple and low latency to read. B exposes the password in plain text; D hard-coding cannot be changed dynamically and still leaks; E the resource policy is for permissions, not for storing secrets.

</Quiz>

<Quiz
  qnum={5}
  total={20}
  question="An asynchronously invoked Lambda occasionally fails on transient errors. The developer wants failed events to not be lost after retries are exhausted so they can be investigated or reprocessed later. What is the approach MOST aligned with best practice?"
  options={[
    'Set the retry count very high and hope it eventually succeeds',
    'Configure an on-failure destination or a dead-letter queue (DLQ) for asynchronous invocation, pointing at SQS or SNS',
    'Catch all exceptions in the code and ignore them',
    'Turn off retries and accept the loss on failure',
  ]}
  answer={1}>

**Correct answer: B**

For asynchronous invocation, Lambda supports an **on-failure destination or a dead-letter queue (DLQ)**: after retries are exhausted, the event plus metadata is sent to an SQS queue or SNS topic so it is not lost and can be reprocessed. A inflating retries only masks the problem; C swallowing exceptions makes events disappear silently; D drops the event, which violates the requirement.

</Quiz>

<Quiz
  qnum={6}
  total={20}
  question="A REST API endpoint must authorize requests using the existing company JWT tokens, and the team wants the authorization result cached to reduce repeated validation overhead. What is the best approach on API Gateway?"
  options={[
    'Parse and validate the JWT inside every backend Lambda',
    'Use a Lambda authorizer that returns an IAM policy and set an authorization cache TTL',
    'Use the JWT directly as an API key',
    'Leave the endpoint open and rely on the frontend to hide it',
  ]}
  answer={1}>

**Correct answer: B**

A **Lambda authorizer** validates the JWT centrally before the request reaches the backend and returns an allow or deny IAM policy, and it supports an **authorization cache (TTL)** keyed on the token so the same token is not revalidated within the TTL. A duplicates logic in every backend; C an API key is for usage identification, not identity authentication; D hiding in the frontend is not a security control.

</Quiz>

<Quiz
  qnum={7}
  total={20}
  question="A browser frontend on app.example.com calls a REST API on API Gateway. For non-simple requests the browser first sends an OPTIONS preflight, and it fails. How should the developer correctly enable cross-origin access?"
  options={[
    'Disable the browser same-origin policy in the frontend',
    'Configure CORS on API Gateway so the OPTIONS method returns the correct Access-Control-Allow-* headers',
    'Change the API to accept GET only',
    'Open the backend database to all IP addresses',
  ]}
  answer={1}>

**Correct answer: B**

Cross-origin issues are solved by **enabling CORS on API Gateway**: add an OPTIONS method on the resource and return headers such as `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, and `Access-Control-Allow-Headers` so the browser preflight passes. A you cannot ask users to change their browser; C does not solve the preflight; D is unrelated to CORS and dangerous.

</Quiz>

<Quiz
  qnum={8}
  total={20}
  question="A DynamoDB table has UserId as the partition key. The application often needs to query orders for a user within a time range, but the current query can only scan the whole table and filter. The developer wants to query efficiently using a different partition key and sort key. What is the best approach?"
  options={[
    'Create a local secondary index (LSI) using the same partition key as the table but a different sort key',
    'Create a global secondary index (GSI) using a new partition key and sort key',
    'Always use Scan with a FilterExpression',
    'Read the whole table into application memory and filter there',
  ]}
  answer={1}>

**Correct answer: B**

Querying by a **different partition key** requires a **global secondary index (GSI)**, which can define a partition key and sort key different from the base table. An LSI (A) must reuse the **same partition key** as the base table and can only change the sort key, which does not meet the different-partition-key need, and an LSI can only be created at table creation time. C using Scan is costly and inefficient; D pulling all data back is even worse.

</Quiz>

<Quiz
  qnum={9}
  total={20}
  question="A developer uses Query to read an item in DynamoDB right after writing it, and occasionally does not see the latest value. The requirement is to guarantee reading the latest write, and a higher read cost is acceptable. What should the developer do?"
  options={[
    'Use eventually consistent reads (the default)',
    'Set ConsistentRead=true on Query/GetItem to use strongly consistent reads',
    'Switch to Scan, which becomes strongly consistent automatically',
    'Sleep a few seconds in the client before reading',
  ]}
  answer={1}>

**Correct answer: B**

DynamoDB defaults to **eventually consistent reads** (cheaper but may return a stale value). To guarantee reading the latest write, set **`ConsistentRead=true`** on Query/GetItem to use **strongly consistent reads** (which consume more read capacity and are not supported on a GSI). A is exactly what causes the stale read; C the consistency of Scan is controlled by ConsistentRead and does not become strong automatically; D sleeping is an unreliable hack.

</Quiz>

<Quiz
  qnum={10}
  total={20}
  question="A newly launched application has unpredictable traffic with frequent peaks and troughs. The team does not want to plan and tune DynamoDB read/write capacity and wants it to scale with actual usage and pay per use. Which capacity mode is best?"
  options={[
    'Provisioned capacity with auto scaling disabled',
    'On-demand capacity mode',
    'Provisioned capacity set manually to a very large fixed value',
    'Move the table to S3 instead',
  ]}
  answer={1}>

**Correct answer: B**

With unpredictable traffic and no desire to manage capacity, **on-demand capacity mode** is best: it scales automatically with instantaneous traffic and bills per actual read/write request, with no need to plan RCUs/WCUs. A without scaling gets throttled; C a large fixed value wastes money and can still be exceeded by peaks; D moving to S3 loses the key-value query capability of DynamoDB.

</Quiz>

<Quiz
  qnum={11}
  total={20}
  question="An application doing batch writes to DynamoDB occasionally gets ProvisionedThroughputExceededException or throttling errors. How should the developer correctly handle this transient throttling on the client?"
  options={[
    'Immediately retry at the same rate with no delay',
    'Implement exponential backoff with jitter before retrying; most AWS SDKs already do this',
    'Exit the whole program when the error occurs',
    'Change all writes into one huge batch',
  ]}
  answer={1}>

**Correct answer: B**

For transient throttling, the correct approach is **exponential backoff with jitter**, which gradually spaces out retries and staggers concurrency to avoid a thundering herd; most AWS SDKs already include this retry logic, and it can be tuned. A retrying with no delay makes throttling worse; C exiting loses the chance to recover; D a bigger batch only triggers throttling sooner.

</Quiz>

<Quiz
  qnum={12}
  total={20}
  question="A website wants logged-in users to upload large files directly to a specific S3 bucket, without sending AWS credentials to the browser and without the files passing through the own servers. What is the best approach?"
  options={[
    'Embed IAM user Access Keys in the frontend JavaScript',
    'Have the backend use the SDK to generate a time-limited S3 presigned URL so the frontend can PUT directly',
    'Make the bucket publicly writable',
    'Upload files to EC2 first and then copy them to S3',
  ]}
  answer={1}>

**Correct answer: B**

The backend (which holds credentials) uses the SDK to generate a **time-limited presigned URL**, and the frontend uses that URL to PUT directly to S3, so no long-term credentials are exposed and files do not pass through the own servers. A putting keys in the frontend is extremely dangerous; C a publicly writable bucket is a major risk; D routing through EC2 adds cost and latency.

</Quiz>

<Quiz
  qnum={13}
  total={20}
  question="A mobile app uploads several GB files to S3 over a network that occasionally drops, and re-sending the whole file is wasteful. The developer wants to split the upload so a failed part only re-sends that part and parts can upload in parallel. Which S3 feature should be used?"
  options={[
    'A single PutObject that uploads everything at once',
    'Multipart Upload',
    'S3 Select',
    'S3 versioning',
  ]}
  answer={1}>

**Correct answer: B**

**Multipart Upload** splits a large object into parts that can upload **in parallel**, and a failed part only needs that part re-sent, which suits large files and unstable networks (generally recommended above 100 MB). A a single upload has to restart the whole file on failure; C S3 Select queries object content; D versioning retains historical versions and is unrelated to multipart upload.

</Quiz>

<Quiz
  qnum={14}
  total={20}
  question="A developer builds locally with the AWS SDK. The code does not hard-code any keys, yet it can access AWS. Regarding the SDK default credential provider chain, which statement is correct?"
  options={[
    'The SDK only reads keys from strings in the code, otherwise it cannot work',
    'The SDK tries several sources in order, such as environment variables, the shared config file (~/.aws/credentials), and the role of the execution environment (such as EC2/ECS/Lambda), and uses the first one it finds',
    'The SDK must connect to the IAM console to obtain keys',
    'The SDK can only use Root user credentials',
  ]}
  answer={1}>

**Correct answer: B**

The AWS SDK **default credential provider chain** checks several sources in order: environment variables, the shared credentials/config file (`~/.aws/credentials`), and container or instance role credentials (the IAM Role of EC2/ECS/Lambda), and uses the first usable one. This lets the same code run without hard-coded keys both locally and in the cloud. A, C, and D all describe the chain incorrectly.

</Quiz>

<Quiz
  qnum={15}
  total={20}
  question="Messages on a standard SQS queue are processed by a Lambda consumer. The developer finds the same message is occasionally processed twice, causing duplicate side effects. Regarding visibility timeout and duplicates, which two designs are most correct? (Choose TWO)"
  options={[
    'Set the visibility timeout shorter than the processing time so the message reappears sooner',
    'Make the visibility timeout longer than the actual processing time so the message does not become visible before processing finishes',
    'Design the consumer to be idempotent so duplicate processing produces no side effects',
    'A standard queue guarantees exactly-once delivery, so duplicates need not be handled',
    'Do not delete the message after processing and let it disappear on its own',
  ]}
  answer={[1, 2]}>

**Correct answer: B, C**

A standard queue is **at-least-once** delivery and can produce duplicates. So on one hand the **visibility timeout must be longer than the actual processing time** (otherwise the message becomes visible again before processing finishes and another consumer picks it up), and on the other hand the consumer should be **idempotent** so occasional duplicates cause no side effects. A a too-short timeout is exactly what causes duplicates; D a standard queue does not guarantee exactly-once; E after processing you must explicitly delete the message.

</Quiz>

<Quiz
  qnum={16}
  total={20}
  question="A payment system requires that messages are processed in strict order and that the same transaction is not duplicated. How should the team configure SQS to meet this?"
  options={[
    'Use a standard queue and try to write as fast as possible',
    'Use a FIFO queue, set MessageGroupId to keep order within a group, and use content-based deduplication or MessageDeduplicationId to dedupe',
    'Use a FIFO queue but set no group or dedup ID',
    'Switch to broadcasting with a standard SNS topic',
  ]}
  answer={1}>

**Correct answer: B**

Strict order and no duplicates call for a **FIFO queue**: use **MessageGroupId** to guarantee first-in first-out order within a group, and use **content-based deduplication or MessageDeduplicationId** to avoid duplicates within the dedup window. A a standard queue guarantees neither order nor uniqueness; C a FIFO queue without group and dedup IDs cannot meet the need; D a standard SNS topic does not guarantee order.

</Quiz>

<Quiz
  qnum={17}
  total={20}
  question="One event must trigger several downstream actions at once: write to an audit queue, notify the user, and start a processing flow. The developer wants to publish once and have multiple receivers each get it, with the downstreams not affecting each other. What is the best architecture?"
  options={[
    'Have the source code call each downstream service directly in sequence',
    'Use an SNS topic for fan-out so multiple SQS queues or endpoints subscribe independently',
    'Put all downstream logic into a single Lambda',
    'Use DynamoDB as a message bus that everyone polls',
  ]}
  answer={1}>

**Correct answer: B**

Publish once and have many receivers is the classic **SNS fan-out**: publish to one SNS topic and have multiple SQS queues or endpoints subscribe and process independently, decoupled and not affecting each other. A direct chaining from the source is tightly coupled; C a single Lambda loses isolation and independent scaling; D polling DynamoDB is not a good pattern for event notification.

</Quiz>

<Quiz
  qnum={18}
  total={20}
  question="A data processing flow has several steps with branches and retries, and must be visually traceable step by step including errors. The developer wants the service itself to manage state and flow control rather than writing lots of orchestration logic inside a Lambda. Which service is best?"
  options={[
    'Write the whole flow in a single huge Lambda controlled by if/else',
    'An AWS Step Functions state machine using states, Retry, and Catch to define the flow',
    'Trigger each step manually with a cron schedule',
    'Pass each step result through environment variables',
  ]}
  answer={1}>

**Correct answer: B**

**Step Functions** is a managed workflow orchestration service that uses a state machine to define steps, branches (Choice), retries (Retry), and error handling (Catch), with visual execution tracing, removing the need to write orchestration and state management in code. A a single huge Lambda is hard to maintain and bound by timeout; C cron and manual steps do not suit complex branching; D environment variables cannot carry state across invocations.

</Quiz>

<Quiz
  qnum={19}
  total={20}
  question="A developer wants a backend Lambda to read different config values across deployment stages (dev/staging/prod), using the same deployment package and switching behavior via config. Which two approaches meet this goal? (Choose TWO)"
  options={[
    'Set different environment variables on the alias for each stage',
    'Hard-code the config for each stage in the code and compile a separate build for each',
    'Use Parameter Store with per-stage paths (such as /app/prod/ and /app/dev/) read at runtime',
    'Paste the prod password directly into a source code comment',
    'Use completely different program logic for each stage',
  ]}
  answer={[0, 2]}>

**Correct answer: A, C**

To use the same package and switch via config, you can **set different environment variables per alias** (each alias carries its own config at publish time), and you can use **Parameter Store with per-stage paths** read at runtime. B and E use a separate codebase per stage, which violates using the same package; D pasting a password into source code is a serious security problem.

</Quiz>

<Quiz
  qnum={20}
  total={20}
  question="A service behind API Gateway has limited capacity. The team wants to protect the backend from traffic spikes and apply different request limits to different clients. What is the best approach?"
  options={[
    'Set no limits and let the backend absorb everything',
    'Use API Gateway throttling for rate and burst limits, plus usage plans and API keys to tier limits per client',
    'Just replicate the backend a few more times to avoid any limiting',
    'Ask clients to be disciplined and not send too many requests',
  ]}
  answer={1}>

**Correct answer: B**

API Gateway supports **throttling** with a per-second rate and a burst limit, returning `429` when exceeded, combined with **usage plans and API keys** to apply different quotas and rates per client, tiering the limits to protect the backend. A no limit means no protection; C scaling the backend is costly and can still be overwhelmed; D relying on client discipline is unreliable.

</Quiz>

Domain 1 complete! On to Domain 2.
