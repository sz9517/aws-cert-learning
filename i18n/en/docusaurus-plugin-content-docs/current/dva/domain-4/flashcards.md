---
sidebar_position: 6
title: Domain 4 Flashcards
---

# Domain 4 Flashcards

Tap a card to flip it open. This page distills the developer-focused essentials of Domain 4 "Troubleshooting and Optimization" into bite-sized cards, covering CloudWatch observability, X-Ray tracing, error handling and retries, and performance tuning and caching, perfect for a fast review before the exam.

## CloudWatch Observability

<Flashcards>
  <Flashcard term="Log Group vs Log Stream">A log group is the big cabinet for one application's logs, where you set retention days and encryption; a log stream is the time-ordered sequence of events from one source inside that cabinet (such as a single instance or a single Lambda execution environment). When troubleshooting, pick the group first, then find which stream has the problem.</Flashcard>
  <Flashcard term="Custom Metric">Beyond built-in metrics (CPU, invocation count), these are business numbers you send up yourself with PutMetricData, such as "successful orders" or "cart value." They let you monitor and alarm on what your application truly cares about, not just machine-level signals.</Flashcard>
  <Flashcard term="EMF (Embedded Metric Format)">A format that "embeds" metrics directly inside structured JSON logs. You write logs as usual, and CloudWatch extracts the metrics automatically, saving the extra API call and latency of a separate PutMetricData. It fits high-frequency, short-lived environments like Lambda perfectly.</Flashcard>
  <Flashcard term="CloudWatch Alarm">Watches a metric and, when it crosses a threshold you set for a sustained period (such as CPU &gt; 80% for 5 minutes straight), changes state and triggers actions: send an SNS notification, auto scale, or run an automated remediation. It is the core mechanism for being proactively told when something goes wrong.</Flashcard>
  <Flashcard term="Logs Insights">Uses a SQL-like query language to pull, aggregate, and sort data across large volumes of logs, such as "find the top 20 slowest requests." It is far faster than scanning log streams by eye and is the go-to tool for after-the-fact troubleshooting and analysis.</Flashcard>
  <Flashcard term="Structured Logging">Writing logs in a field-based format like JSON (rather than one long plain-text string), so Logs Insights can filter and aggregate directly by field. Get into the habit of emitting fields like requestId and userId and troubleshooting becomes far easier.</Flashcard>
</Flashcards>

## CloudWatch vs CloudTrail vs X-Ray

<Flashcards>
  <Flashcard term="CloudWatch vs CloudTrail vs X-Ray">These three are often confused: CloudWatch shows "how the system is performing" (metrics, logs, alarms); CloudTrail records "who called which API and when" (audit and security); X-Ray traces "how a request flows across services and where it is slow" (distributed tracing). To find who deleted a resource use CloudTrail; to find why something got slow use X-Ray.</Flashcard>
  <Flashcard term="CloudTrail">An audit log of every AWS API call in the account: who (which identity), when, from which IP, and what they did to which resource. Use it to track down "who changed the setting / deleted the bucket" and to meet compliance requirements, not to look at performance.</Flashcard>
</Flashcards>

## X-Ray Distributed Tracing

<Flashcards>
  <Flashcard term="Trace / Segment / Subsegment">A trace is "the complete journey of one request from start to finish"; a segment is the work done by "one service" in that journey (such as API Gateway or a given Lambda); a subsegment is a "finer step" inside that service (such as a DynamoDB call or an outbound HTTP request). Peeling back the layers shows which part the time is spent in.</Flashcard>
  <Flashcard term="Annotation vs Metadata">Both are extra information you attach to a trace. Annotations are indexed and can be used to filter and search in X-Ray (such as userId or orderStatus), but hold only simple values; metadata is not indexed and cannot be searched, but can hold large detailed blobs for later review. If you need to search, use an annotation.</Flashcard>
  <Flashcard term="Service Map">X-Ray automatically draws your services as a graph of nodes and links, labeling the latency, traffic, and error rate of each hop. At a glance you can spot which downstream service is the bottleneck or throwing errors, making it the starting point for debugging a distributed system.</Flashcard>
  <Flashcard term="X-Ray Sampling">Rather than fully tracing every request, X-Ray samples a portion based on sampling rules (such as 1 per second guaranteed plus 5% of the rest), balancing observability quality against cost and performance. Under heavy traffic, sampling keeps trace volume and cost from exploding.</Flashcard>
  <Flashcard term="X-Ray Daemon / SDK">Your application uses the X-Ray SDK to produce trace data, sends it first to a local X-Ray daemon (or the built-in agent on Lambda), and the daemon then batches it up to the X-Ray service. Knowing this path explains why on EC2/ECS you must run the daemon yourself and grant it the right IAM permissions.</Flashcard>
</Flashcards>

## Error Handling and Retries

<Flashcards>
  <Flashcard term="Backoff + Jitter">When retrying failed requests, waiting longer each time (1s, 2s, 4s...) is exponential backoff, which avoids hammering and overwhelming the downstream; adding random jitter keeps many clients from retrying at the exact same moment and creating a spike. Using both together is the correct way to retry.</Flashcard>
  <Flashcard term="Idempotency">Running the same operation multiple times produces the same result as running it once, with no double charges or duplicate orders. It is usually implemented with a unique idempotency key. Because retries and at-least-once delivery cause duplicates, write operations must be designed to be idempotent.</Flashcard>
  <Flashcard term="DLQ (Dead-Letter Queue)">When a message still fails after several retries, it is sent to a dedicated "dead-letter queue" instead of being retried forever or silently dropped. It preserves failed messages for later analysis and replay, and SQS, SNS, and asynchronous Lambda invocations all support configuring a DLQ.</Flashcard>
  <Flashcard term="Partial Batch Failure">When Lambda processes a batch of SQS/stream messages at once, reporting the whole batch as failed causes the already-successful ones to be redelivered too. Reporting batchItemFailures instead hands back only "the few that actually failed" for retry, so the successful ones are not reprocessed, greatly cutting rework.</Flashcard>
  <Flashcard term="Retryable vs Non-retryable Errors">Transient errors like throttling (429/ThrottlingException), 5xx, and timeouts are "retryable" and usually succeed after a short backoff; errors like 400 bad parameters, 403 insufficient permissions, and resource-not-found are "non-retryable" and will fail the same way no matter how many times you retry, so report them immediately instead of wasting retries.</Flashcard>
  <Flashcard term="429 / ThrottlingException">The throttling error you get when you call an API too fast and exceed the service's rate limit. The right response is to retry with exponential backoff and jitter, and consider lowering your call rate, raising the quota, or using batching and caching to reduce requests, rather than blindly retrying hard.</Flashcard>
  <Flashcard term="Circuit Breaker">When a downstream keeps failing, temporarily "trip the breaker" to stop calling it, failing fast or falling back instead, and after a while cautiously let a request through to test. This avoids wasting resources and time on calls doomed to fail and gives the downstream room to recover.</Flashcard>
</Flashcards>

## Performance and Caching

<Flashcards>
  <Flashcard term="Lambda Memory to CPU">Lambda has no separate knob for CPU; the knob you turn is memory, and CPU (and network bandwidth) scale up in proportion with it. So when something "runs too slow," adding memory can sometimes make it both faster and cheaper because execution time shrinks, which is why it is worth using Power Tuning to find the sweet spot.</Flashcard>
  <Flashcard term="Connection Reuse">Create expensive objects like database connections and SDK clients "outside" the handler (in the init phase) so later invocations in the same execution environment reuse them instead of rebuilding the connection every time. This is one of the most effective small changes for cutting Lambda latency.</Flashcard>
  <Flashcard term="Provisioned Concurrency">Pre-initializes a batch of Lambda execution environments and keeps them on standby so incoming requests avoid cold-start latency. It suits latency-sensitive workloads with predictable traffic; the downside is you pay even when there are no requests, so weigh the cost against on-demand.</Flashcard>
  <Flashcard term="Cold Start">The first time a given Lambda execution environment is used, it must download the code, start the runtime, and run initialization, and that extra latency is the cold start. You can ease it with provisioned concurrency, leaner packages, connection reuse, and choosing the right runtime.</Flashcard>
  <Flashcard term="ElastiCache">An in-memory cache (Redis/Memcached) placed in front of the database to hold popular query results so repeated reads do not hit the database every time. The cache-aside pattern is commonly used to greatly cut read latency and database load; remember to set a TTL to handle data freshness.</Flashcard>
  <Flashcard term="DAX (DynamoDB Accelerator)">An in-memory caching layer built specifically for DynamoDB that brings reads from milliseconds down to microseconds, and it is API-compatible so you barely change code. It suits extremely high-frequency, read-heavy workloads; it only accelerates reads and does nothing for writes or strongly consistent reads.</Flashcard>
  <Flashcard term="API Gateway Caching">Caches an endpoint's response at the API Gateway layer; once you set a TTL, identical requests return straight from the cache without invoking the backend Lambda or integration every time. It lowers backend load, latency, and invocation cost, ideal for GET queries that do not change often.</Flashcard>
  <Flashcard term="CloudFront">AWS's CDN, which caches static content (and even dynamic API responses) at edge locations worldwide so users fetch it from nearby, cutting latency and origin load. It is commonly placed in front of S3, API Gateway, or an ALB as the first caching and acceleration layer facing end users.</Flashcard>
</Flashcards>

## AI-assisted Debugging

<Flashcards>
  <Flashcard term="Amazon Q Developer">AWS's AI development assistant, which can interpret error messages, analyze CloudWatch logs, pinpoint performance bottlenecks, and suggest fixes right inside your IDE or console, speeding up troubleshooting. DVA-C03 adds an "AI-assisted development" focus, so treat it as a partner that helps you debug and optimize.</Flashcard>
</Flashcards>

👉 Test yourself: [Domain 4 Quiz](./quiz.md)
