---
sidebar_position: 7
title: Domain 1 Flashcards
---

# Domain 1 Flashcards

Tap a card to flip it open. This page distills the developer-focused essentials of Domain 1 "Development with AWS Services" into bite-sized cards, perfect for a fast review before the exam.

## Lambda

<Flashcards>
  <Flashcard term="Cold Start">The first invocation after a function has been idle must spin up the execution environment and load your code, adding a few hundred milliseconds. Use Provisioned Concurrency to pre-warm latency-sensitive functions.</Flashcard>
  <Flashcard term="Version">An immutable snapshot of your published code and configuration. Each publish creates an incrementing version number, making rollbacks easy.</Flashcard>
  <Flashcard term="Alias">A movable pointer to a specific version (e.g. prod points to v3). Change the alias to shift traffic, and set weights for canary deployments.</Flashcard>
  <Flashcard term="Concurrency">The number of function instances running at the same time. Use Reserved Concurrency to guarantee or cap capacity so you do not overwhelm downstream systems.</Flashcard>
  <Flashcard term="Retry Behavior">Async invocations retry twice by default and can send failures to a DLQ or Lambda Destinations. Stream sources (Kinesis/DynamoDB) block the shard until success or expiry.</Flashcard>
  <Flashcard term="Execution Role">The IAM role Lambda assumes at runtime, deciding which AWS resources it can reach. When permissions are missing, check this role first.</Flashcard>
</Flashcards>

## API Gateway

<Flashcards>
  <Flashcard term="REST / HTTP / WebSocket API">REST is the most full-featured (API keys, request validation); HTTP API is cheaper and lower-latency with fewer features; WebSocket supports two-way real-time connections.</Flashcard>
  <Flashcard term="Proxy Integration">Passes the entire request untouched to the backend (Lambda or HTTP) and lets the backend parse it, sparing you from mapping each parameter by hand.</Flashcard>
  <Flashcard term="Authorizer">Decides who may call the API: use Cognito, IAM, or a Lambda Authorizer for custom logic (such as validating a JWT).</Flashcard>
  <Flashcard term="Usage Plan">Pairs with API keys to apply throttling and quotas per caller, commonly used for APIs exposed to third parties.</Flashcard>
  <Flashcard term="CORS">Cross-origin browser requests require CORS to be configured on API Gateway so the correct Access-Control headers are returned, otherwise the frontend is blocked.</Flashcard>
</Flashcards>

## DynamoDB

<Flashcards>
  <Flashcard term="Partition Key / Sort Key (PK / SK)">The PK decides which partition the item lands on; adding an SK lets you sort and run range queries within the same PK. Together they form a composite primary key.</Flashcard>
  <Flashcard term="LSI vs GSI">An LSI shares the base table PK and only swaps the SK, must be defined at table creation, and supports strong consistency; a GSI can use a different PK/SK, can be added or removed anytime, and is eventually consistent only.</Flashcard>
  <Flashcard term="RCU / WCU">Capacity units. 1 RCU is one strongly consistent read of 4KB per second (eventually consistent reads double that); 1 WCU is one 1KB write per second. Exceeding them triggers throttling.</Flashcard>
  <Flashcard term="Query vs Scan">Query hits items precisely by key and reads only what you need, so it is efficient; Scan reads the whole table and burns capacity, so avoid it where possible.</Flashcard>
  <Flashcard term="Strong vs Eventual Consistency">A strongly consistent read always returns the latest value but costs more; an eventually consistent read may briefly return stale data, is cheaper, and is the default.</Flashcard>
  <Flashcard term="DynamoDB Streams">Captures item-level insert/modify/delete changes and can trigger Lambda for follow-up work (sync, notifications). Data is retained for 24 hours.</Flashcard>
  <Flashcard term="DAX">A DynamoDB-specific in-memory cache that cuts read latency from milliseconds to microseconds, ideal for read-heavy workloads that repeatedly read the same items.</Flashcard>
  <Flashcard term="Exponential Backoff">On throttling (ProvisionedThroughputExceeded), retries wait progressively longer with added random jitter so you stop hammering the service. The SDK has this built in by default.</Flashcard>
</Flashcards>

## S3, SDK and Caching

<Flashcards>
  <Flashcard term="Presigned URL">A time-limited URL generated with your credentials that lets someone without AWS permissions temporarily upload or download a specific object.</Flashcard>
  <Flashcard term="Multipart Upload">Splits a large file into parts uploaded in parallel with resumable progress. Recommended above 100MB and required above 5GB.</Flashcard>
  <Flashcard term="Credential Chain">The SDK looks for credentials in order: environment variables, then shared config files, then the IAM role (EC2/ECS/Lambda). Never hardcode keys; let the role handle it for the most secure setup.</Flashcard>
  <Flashcard term="ElastiCache Lazy Loading">Check the cache first and only read the database on a miss, then write the result back. It saves space but the first miss is slower and data can go stale.</Flashcard>
  <Flashcard term="ElastiCache Write-Through">Update the cache at the same time you write to the database, so reads always hit and stay fresh. The trade-off is slower writes and caching data that may never be read.</Flashcard>
</Flashcards>

## Event-Driven and Decoupling

<Flashcards>
  <Flashcard term="SQS Visibility Timeout">The window during which a message in flight is hidden from other consumers. Too short causes duplicate processing; too long means a long wait before a failed message can be retried.</Flashcard>
  <Flashcard term="SQS FIFO Queue">Guarantees ordering and exactly-once processing, grouping with MessageGroupId. Throughput is lower than a standard queue.</Flashcard>
  <Flashcard term="Dead-Letter Queue (DLQ)">Messages that keep failing after several attempts land here for later investigation, preventing a poison message from blocking the whole queue.</Flashcard>
  <Flashcard term="SNS Fan-out">A single message published to a topic is pushed to many subscribers at once (multiple SQS / Lambda / HTTP), a one-to-many broadcast.</Flashcard>
  <Flashcard term="EventBridge">An event bus that routes events to different targets based on rules matching event content, with hundreds of SaaS sources. Better than SNS for complex event routing.</Flashcard>
  <Flashcard term="Step Functions: Standard vs Express">Standard suits long, auditable workflows and is billed per state transition; Express suits high-frequency short workflows, is billed by execution duration, and offers high throughput.</Flashcard>
</Flashcards>

## AI-Assisted Development

<Flashcards>
  <Flashcard term="Amazon Q Developer">AWS's AI coding assistant that completes code in your IDE, explains and refactors code, generates tests, and helps with debugging and upgrades. A new focus area in DVA-C03.</Flashcard>
</Flashcards>

👉 Test yourself: [Domain 1 Quiz](./quiz.md)
