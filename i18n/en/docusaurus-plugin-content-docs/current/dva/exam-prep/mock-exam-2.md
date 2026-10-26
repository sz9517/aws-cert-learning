---
sidebar_position: 3
title: DVA Full Mock Exam B (65 questions)
---

# DVA-C03 Full Mock Exam B (65 questions)

This is the second full-length mock exam (Exam B): 65 questions covering the four official domains, written from a developer point of view. Aim for about 90 minutes (roughly 1.4 minutes per question) to simulate real pacing, and complete all questions before checking answers. Every question is original and mimics the DVA-C03 scenario style (scenario stem plus qualifiers, including multiple-response); none are real exam questions, and they do not overlap with the first mock exam, using different scenario angles where possible. Questions are arranged by the official domain weightings into sections, including several Choose TWO questions whose stems say "Choose TWO" so you select exactly two. Pick your answer first, then expand the explanation to see why it is correct and why the others are wrong.

## Part 1 · Development with AWS Services (Questions 1-20)

<Quiz
  qnum={1}
  total={65}
  question="A teams Lambda needs to read the same configuration values (such as a downstream service URL) thousands of times, and currently calls Parameter Store on every invocation, adding latency and hitting API throttling. The team wants to cut the number of fetches without sacrificing correctness. Which approach is best?"
  options={[
    'Hard-code the parameter values in the code to avoid calls',
    'Fetch the values outside the handler (during init) and cache them in the execution environment, refreshing after a reasonable TTL',
    'Call GetParametersByPath to grab the whole path on every invocation',
    'Ship the parameters in a plaintext file packaged with the function',
  ]}
  answer={1}>

**Correct: B** — Lambda reuses the execution environment, so fetching values outside the handler and caching them across warm invocations, with a sensible TTL for refresh, greatly reduces Parameter Store calls while still allowing updates. A hard-coded values cannot be updated and are hard to maintain. C still calls the API on every invocation and does not reduce the count. D a packaged plaintext file is effectively hard-coded and needs a redeploy to change.

</Quiz>

<Quiz
  qnum={2}
  total={65}
  question="A developer stores user to-do items in DynamoDB, and the query pattern is: get a users most recent N items, sortable by creation time. Which key design is best?"
  options={[
    'userId as partition key and createdAt as sort key, then Query with ScanIndexForward to control ordering',
    'userId as the only key (partition key only), filtering all other fields with Scan',
    'Put all to-dos under the same partition key value so they can be fetched at once',
    'Use a random UUID as partition key and Scan the whole table for queries',
  ]}
  answer={0}>

**Correct: A** — With userId as partition key and createdAt as sort key, you can Query a users items efficiently and order by time (ScanIndexForward sets ascending or descending, Limit gets the most recent N). B a partition key only cannot sort or do range queries within the table. C stuffing everything under one partition key value causes a hot partition. D a random key cannot be queried by user and forces a full table scan.

</Quiz>

<Quiz
  qnum={3}
  total={65}
  question="A Step Functions workflow coordinates several Lambdas, branches based on the previous steps result, and retries plus compensates when a step fails. Which statement best captures the reason to use Step Functions?"
  options={[
    'It lets you declare retries, branching, error handling, and state transitions in a state machine instead of hand-writing coordination logic in code',
    'It automatically merges all Lambdas into a single function to cut cost',
    'It can only run a fixed sequence and does not support conditional branching',
    'It replaces DynamoDB as a data store',
  ]}
  answer={0}>

**Correct: A** — Step Functions declaratively describes step order, Choice branching, Retry and Catch error handling, and compensation in a state machine, making coordination visible and retryable without hand-coding it in each function. B it does not merge functions. C it supports conditional branching such as Choice. D it is an orchestration service, not a data store.

</Quiz>

<Quiz
  qnum={4}
  total={65}
  question="A developer wants an API Gateway REST API to validate request format (required fields, JSON structure) before integrating with different backends, returning 400 immediately for invalid input without wasting backend resources. Which API Gateway feature is most direct?"
  options={[
    'Request validation with a model and required parameters',
    'Put all validation inside the backend Lambda',
    'Enable WAF to block malformed input',
    'Make the API a private endpoint',
  ]}
  answer={0}>

**Correct: A** — API Gateway request validation with a JSON Schema model and required query/header parameters rejects malformed requests with a 400 before they reach the backend. B putting it in the backend wastes invocation cost. C WAF targets security rules, not business field-structure validation. D a private endpoint only changes access scope and is unrelated to format validation.

</Quiz>

<Quiz
  qnum={5}
  total={65}
  question="A service needs to deliver a message reliably to a single consumer, support retries, and send failures to a dead-letter location, with no need to fan out to multiple subscribers. Which service fits this work queue best?"
  options={[
    'Amazon SNS standard topic',
    'Amazon SQS standard queue (with visibility timeout and a dead-letter queue)',
    'Amazon Kinesis Data Streams',
    'Amazon EventBridge event bus',
  ]}
  answer={1}>

**Correct: B** — A single-consumer work queue (reliable delivery, visibility timeout to control retries, failures to a DLQ) is exactly what SQS is for. A SNS is publish/subscribe aimed at fan-out. C Kinesis targets multi-consumer streaming and replay and is heavier. D EventBridge targets event routing to multiple targets, not a plain work queue.

</Quiz>

<Quiz
  qnum={6}
  total={65}
  question="A developer connects a Lambda to an RDS database inside a VPC, but the same function must also call a public external API. After attaching the function to the VPC, the outbound call fails. Which setup best fixes outbound connectivity?"
  options={[
    'Make RDS publicly accessible',
    'Place the function in private subnets and route outbound traffic through a NAT gateway in a public subnet',
    'Increase the function memory to restore networking',
    'Disable the VPC config and give up connecting to RDS',
  ]}
  answer={1}>

**Correct: B** — A Lambda in a VPC has no public IP, so for outbound internet access you place it in private subnets and route out through a NAT gateway in a public subnet. A making RDS public is an insecure anti-pattern and does not solve egress. C memory is unrelated to routing. D disabling the VPC loses RDS connectivity.

</Quiz>

<Quiz
  qnum={7}
  total={65}
  question="A Lambda uses the AWS SDK to write a large object to S3, and the developer wants multipart upload to improve reliability and throughput for big files. Which TWO benefits does multipart upload provide? (Choose TWO)"
  options={[
    'Parts can be uploaded in parallel to improve throughput',
    'If one part fails, only that part is re-sent instead of the whole file',
    'It automatically encrypts the object into plaintext for easier debugging',
    'It lowers the object size limit to 5 MB',
    'It removes the need for IAM permissions',
  ]}
  answer={[0, 1]}>

**Correct: A, B** — Multipart upload splits a large object into parts that can be uploaded in parallel for higher throughput (A), and if any part fails only that part is re-sent rather than the whole file (B), which helps big files and flaky networks. C turning something into plaintext is not encryption and is not multipart behavior. D multipart exists to exceed the single-PUT limit and support larger objects, not to lower the limit. E it still needs proper IAM permissions.

</Quiz>

<Quiz
  qnum={8}
  total={65}
  question="A developer wants the frontend to receive real-time push notifications from the backend (bidirectional, low latency) using a fully managed approach without running long-lived connection servers. Which API Gateway feature fits best?"
  options={[
    'REST API with polling',
    'WebSocket API (API Gateway manages connections and routes messages to the backend)',
    'HTTP API plain forwarding',
    'API key rate limiting',
  ]}
  answer={1}>

**Correct: B** — API Gateway WebSocket API maintains persistent client connections and routes messages to the backend (such as Lambda), supporting server-initiated push without running your own connection servers. A polling has high latency and wastes requests. C HTTP API is request/response, not bidirectional push. D key rate limiting is unrelated to real-time push.

</Quiz>

<Quiz
  qnum={9}
  total={65}
  question="A Lambda needs different database endpoints and log levels across dev, stage, and prod, and the developer wants to switch these values without changing code. Which approach fits best?"
  options={[
    'Inject the endpoint and log level via environment variables, set per environment',
    'Hard-code all three sets of values in the code and branch with if statements',
    'Copy the function code once per environment',
    'Pass the values as URL query parameters on every request',
  ]}
  answer={0}>

**Correct: A** — Lambda environment variables inject different settings (endpoint, log level) per environment without code changes, which is the standard approach (use Secrets Manager or SecureString for secrets). B hard-coding multiple sets is hard to maintain and error-prone. C copying code causes drift. D passing config via query parameters does not work for non-HTTP triggers and leaks easily.

</Quiz>

<Quiz
  qnum={10}
  total={65}
  question="A developer wants an atomic increment on a single numeric attribute in DynamoDB (such as a posts like count) without the race condition of read-then-write. Which approach is correct?"
  options={[
    'GetItem the current value, add 1 in code, then PutItem it back',
    'Use UpdateItem with an ADD or SET likes = likes + :inc update expression for an atomic add',
    'Insert a new item for each like and count them later',
    'Store the counter as a string and overwrite it each time',
  ]}
  answer={1}>

**Correct: B** — UpdateItem atomic counters (ADD or SET likes = likes + :inc) add to the attribute on the server, avoiding the read-modify-write race that loses updates. A read-then-write overwrites each other under concurrency. C counting later is possible but read-expensive and not a real-time counter. D doing arithmetic on a string is incorrect.

</Quiz>

<Quiz
  qnum={11}
  total={65}
  question="A Lambda reads from Kinesis Data Streams via an event source mapping, and the developer finds a poison message that repeatedly fails to parse, blocking all subsequent records in the same shard from progressing. Which setup best avoids the block?"
  options={[
    'Set the shard count to 1 to simplify processing',
    'Configure max retry attempts and an on-failure destination for failed records, and enable batch splitting / report partial failures so bad records can be skipped or offloaded',
    'Set the batch size to the maximum to push through faster',
    'Disable checkpointing so it skips everything automatically',
  ]}
  answer={1}>

**Correct: B** — The Kinesis event source mapping can set max retry attempts, send records that exhaust retries to an on-failure destination, and split batches / report partial failures, so a single poison message does not block the whole shard. A changing shard count does not fix a stuck record. B increasing batch size lets a bad record affect more. D disabling checkpointing causes data loss and duplicates.

</Quiz>

<Quiz
  qnum={12}
  total={65}
  question="A developer wants to generate thumbnails automatically when S3 objects are created, but expects peaks of thousands of events per second and worries that triggering Lambda directly will overload downstream. The team wants a buffer between source and processing to absorb spikes. Which architecture fits best?"
  options={[
    'S3 events call a downstream database synchronously',
    'S3 events go to an SQS queue, and a Lambda event source mapping pulls batches to smooth the spikes',
    'Send all events to one Lambda processing synchronously',
    'Use a CloudWatch metric as the buffer',
  ]}
  answer={1}>

**Correct: B** — Placing an SQS queue between S3 events and processing buffers the load, with a Lambda event source mapping pulling batches under concurrency control to smooth spikes and protect downstream. A hitting a database synchronously is overwhelmed at peak. C a single synchronous function has no buffer. D a CloudWatch metric is monitoring, not a message buffer.

</Quiz>

<Quiz
  qnum={13}
  total={65}
  question="A team wants several Lambdas to share a large dependency (such as a shared library and SDK extensions) to avoid bundling it in every package and to update the version centrally. Which Lambda feature fits best?"
  options={[
    'A Lambda Layer that packages the shared dependency separately for multiple functions to reference',
    'Copy the dependency into every functions package',
    'Store the dependency code in environment variables',
    'Put the dependency in DynamoDB and download it at runtime',
  ]}
  answer={0}>

**Correct: A** — A Lambda Layer packages the shared dependency once so multiple functions reference the same layer, reducing duplication and easing version management. B copying into every package causes duplication and version drift. C environment variables are not for storing libraries. D downloading dependencies at runtime raises cold start and adds uncertainty.

</Quiz>

<Quiz
  qnum={14}
  total={65}
  question="A developer wants to run a long batch transcode job (about 20 minutes) in the cloud: pure compute, stateless, containerizable, and pay-per-use without managing servers. Because a single run exceeds the Lambda 15-minute limit, which service best runs this batch?"
  options={[
    'Force it into Lambda and set the timeout to 20 minutes',
    'AWS Fargate (run the batch as a container with no 15-minute cap)',
    'Use API Gateway to wait synchronously for 20 minutes',
    'Use a DynamoDB trigger to run the compute',
  ]}
  answer={1}>

**Correct: B** — Lambda caps a single run at 15 minutes, so a 20-minute batch should run on a container service that supports long tasks, such as Fargate (serverless compute for ECS/EKS), pay-per-use and no host management. A the Lambda timeout maxes at 15 minutes, so 20 minutes is invalid. C API Gateway has a 29-second integration timeout and cannot wait 20 minutes. D a DynamoDB trigger still runs Lambda and hits the same 15-minute limit.

</Quiz>

<Quiz
  qnum={15}
  total={65}
  question="A developer wants to repeatedly generate event payloads to feed a Lambda and test various inputs locally, invoking the function with a given event file using the SAM CLI and seeing the return value and logs. Which command is most direct?"
  options={[
    'sam deploy --guided',
    'sam local invoke MyFunction --event events/test.json',
    'sam validate',
    'sam package',
  ]}
  answer={1}>

**Correct: B** — sam local invoke runs the function locally in a container and uses --event to pass an event JSON file, immediately showing the return value and logs, ideal for iterating on inputs. A sam deploy pushes to the cloud. C sam validate only checks template syntax. D sam package bundles and uploads artifacts, none of which is a local invoke test.

</Quiz>

<Quiz
  qnum={16}
  total={65}
  question="A REST API response contains a lot of repeated static reference data (such as a country list), and the developer wants to cut repeated computation and bandwidth by caching close to users at the edge with support for invalidation. Which service fits best in front of the API for content delivery and edge caching?"
  options={[
    'Amazon CloudFront in front of the API, caching responses at the edge with invalidation support',
    'Hard-code the response in the frontend code',
    'Use Glue to cache the response',
    'Make the API private to speed it up',
  ]}
  answer={0}>

**Correct: A** — CloudFront can sit in front of the API (or S3/ALB) and cache responses at global edge locations close to users, reducing latency and origin load, with invalidation support. B hard-coding in the frontend cannot be updated centrally. C Glue is an ETL service, not a cache. D making it private only narrows access scope and provides no edge caching.

</Quiz>

<Quiz
  qnum={17}
  total={65}
  question="A developer needs to atomically deduct inventory and create an order in DynamoDB; both must succeed or both fail, otherwise overselling is possible. Which approach is correct?"
  options={[
    'Two sequential PutItem calls, compensating manually on failure',
    'Use TransactWriteItems to wrap the inventory deduction (with a condition checking sufficient stock) and the order creation in a single transaction',
    'Use BatchWriteItem to write both items at once',
    'Read stock first then write, relying on application logic to guarantee it',
  ]}
  answer={1}>

**Correct: B** — TransactWriteItems wraps the conditional inventory deduction and the order creation in a single ACID transaction that all succeeds or all rolls back, preventing partial success and overselling. A two separate writes have no atomicity and compensation is complex and error-prone. C BatchWriteItem provides no transactional atomicity or condition guarantees. D read-then-write still oversells under concurrency.

</Quiz>

<Quiz
  qnum={18}
  total={65}
  question="A developer uses API Gateway Lambda proxy integration and wants to know how to return the HTTP status code and headers to the client. Which statement is correct?"
  options={[
    'As long as Lambda returns a string, the status code is always 200',
    'Lambda must return a structure with statusCode, headers, and body, and API Gateway builds the HTTP response from it',
    'The status code can only be hard-coded in the API Gateway console',
    'Proxy integration does not support custom headers',
  ]}
  answer={1}>

**Correct: B** — With Lambda proxy integration, the function must return a structure like `{ statusCode, headers, body }`, and API Gateway builds the HTTP response directly from it, so you can set custom status codes and headers. A returning a plain string does not match proxy integration format. C the status code is decided by the function return, not hard-coded. D proxy integration supports custom headers in headers.

</Quiz>

<Quiz
  qnum={19}
  total={65}
  question="A Lambda processes a time-consuming job asynchronously, and the upstream caller only wants an immediate accepted response without waiting for the result. The developer wants an asynchronous invocation. Which InvocationType or pattern best fits fire-and-forget?"
  options={[
    'Invoke with Event (asynchronous), returning 202 immediately while Lambda processes in the background',
    'Invoke with RequestResponse (synchronous) and wait for completion',
    'Set the timeout to the maximum to wait synchronously',
    'Invoke with DryRun',
  ]}
  answer={0}>

**Correct: A** — Asynchronous invocation uses the Event type: Lambda enqueues the event, returns 202 immediately, and processes in the background, so the caller does not wait for the result (destinations can capture success or failure). B RequestResponse is synchronous and waits for the result. C increasing the timeout is still synchronous waiting. D DryRun only checks permissions and parameters and does not actually run.

</Quiz>

<Quiz
  qnum={20}
  total={65}
  question="A developer migrates a relationally query-heavy service to the cloud that needs complex JOINs and transactions, with a highly relational data model and varied queries. Which data store fits best instead of forcing DynamoDB?"
  options={[
    'Always use DynamoDB and build many GSIs to emulate JOINs',
    'A relational database such as Amazon RDS/Aurora, suited to complex JOINs and varied queries',
    'Put all data in S3 and query with Select',
    'Use ElastiCache as the primary database',
  ]}
  answer={1}>

**Correct: B** — Highly relational workloads needing complex JOINs and flexible ad hoc queries fit a relational database (RDS/Aurora) better than DynamoDB, which excels at key-value/document access with known patterns. A emulating JOINs with GSIs is complex and inefficient. C S3 Select queries within objects and is not a transactional database. D ElastiCache is a cache, not a durable primary database.

</Quiz>

## Part 2 · Security (Questions 21-37)

<Quiz
  qnum={21}
  total={65}
  question="A developer wants a frontend signed in via a Cognito user pool to call AWS services with least privilege, where different user groups map to different IAM roles (for example an admin group gets broader permissions). Which mechanism most directly achieves per-group roles?"
  options={[
    'Identity pool role mapping, assigning different IAM roles based on user pool groups or token claims',
    'Map all users to one admin role',
    'Use an if check in the frontend to decide whether to call based on the users group',
    'Create one IAM user per end user',
  ]}
  answer={0}>

**Correct: A** — Cognito identity pools support role mapping, assigning different IAM roles based on user pool groups or token claims to enforce per-group permissions. B one admin role for all violates least privilege. C a frontend if check can be bypassed and is not real authorization. D creating an IAM user per end user does not scale and is not the Cognito model.

</Quiz>

<Quiz
  qnum={22}
  total={65}
  question="A teams microservices call each other, and the security team requires that service-to-service identity must not use long-lived keys. Which approach fits best?"
  options={[
    'Issue each service a set of IAM user long-lived keys to call each other',
    'Each service uses temporary credentials from its execution role (Lambda execution role, ECS task role) to call, assuming a target role with AssumeRole when needed',
    'Put one shared key in every services environment variables',
    'Put the keys in S3 for each service to read',
  ]}
  answer={1}>

**Correct: B** — Service-to-service identity should use temporary credentials from each services execution role (Lambda execution role, ECS task role, EC2 instance role), and use STS AssumeRole to get target-role permissions when needed, all without long-lived keys. A, C, D all leave leakable, hard-to-rotate long-lived keys in the system, against best practice.

</Quiz>

<Quiz
  qnum={23}
  total={65}
  question="A developer wants to encrypt and decrypt a small highly sensitive field (such as a national ID) at the application layer by calling KMS directly on this small data (under 4 KB). Which KMS API applies most directly?"
  options={[
    'Use the KMS Encrypt/Decrypt API with a KMS key directly on data under 4 KB',
    'Use KMS to encrypt a 1 GB large file directly',
    'Export the KMS master key to the local machine to encrypt and decrypt',
    'Use GenerateRandom as encryption',
  ]}
  answer={0}>

**Correct: A** — The KMS Encrypt/Decrypt API can directly encrypt and decrypt small data (up to about 4 KB), suited to a small amount of highly sensitive fields. B large files should use envelope encryption (GenerateDataKey to get a data key and encrypt locally) rather than calling KMS directly. C the KMS master key cannot be exported. D GenerateRandom just produces random bytes and is not an encryption mechanism.

</Quiz>

<Quiz
  qnum={24}
  total={65}
  question="A developer finds the team stores a database password in plaintext in Lambda environment variables, and the audit requires encryption at rest, central management, automatic rotation, and auditable access. Which TWO changes best meet the requirements? (Choose TWO)"
  options={[
    'Move it to Secrets Manager with automatic rotation enabled and fetch it at runtime via the API',
    'Audit reads of the secret with CloudTrail and encrypt the value at rest with KMS',
    'Base64-encode the password but still keep it in environment variables',
    'Print the password to CloudWatch Logs for easy cross-checking',
    'Hard-code the password in code and commit it to the repo',
  ]}
  answer={[0, 1]}>

**Correct: A, B** — The two moves that meet the audit: use Secrets Manager for central storage with automatic rotation and runtime fetch (A), and encrypt the value at rest with KMS while auditing access with CloudTrail (B). C base64 is encoding, not encryption. D printing to logs leaks the secret. E hard-coding and committing to the repo is the worst leak.

</Quiz>

<Quiz
  qnum={25}
  total={65}
  question="An S3 bucket stores data subject to regulatory audit, requiring that once an object is written it cannot be deleted or overwritten during the retention period (WORM). Which feature most directly achieves immutability?"
  options={[
    'S3 versioning alone guarantees it cannot be deleted',
    'S3 Object Lock in compliance mode with a retention period, during which objects cannot be deleted or overwritten',
    'Making the bucket private is enough',
    'A lifecycle rule to auto-delete old versions',
  ]}
  answer={1}>

**Correct: B** — S3 Object Lock operates as WORM; in compliance mode, during the retention period no one (including root) can delete or overwrite the object, meeting the regulatory immutability requirement. A versioning keeps old versions but does not stop delete markers or overwrites. C private is just access control. D auto-delete is the opposite of immutability.

</Quiz>

<Quiz
  qnum={26}
  total={65}
  question="A developer connects a Lambda to VPC resources and also calls S3, and the security team requires that S3 traffic not traverse the public internet. Which approach fits best?"
  options={[
    'Make S3 public so the function can read it',
    'Create an S3 gateway VPC endpoint in the VPC so traffic stays private and does not go over the internet',
    'Hard-code function keys for a direct connection',
    'Give the function a public IP to reach S3 directly',
  ]}
  answer={1}>

**Correct: B** — An S3 gateway VPC endpoint lets VPC resources reach S3 over private routing without the public internet, balancing security and performance. A making S3 public is a major risk. C hard-coded keys are unrelated to the network path and insecure. D a public IP means traffic over the internet, against the requirement.

</Quiz>

<Quiz
  qnum={27}
  total={65}
  question="A developer needs to issue a link for a third party to download a private S3 object within a limited time, without making the bucket public or issuing IAM credentials. Which approach is correct?"
  options={[
    'Make the object public and change it back later',
    'Have a backend with permissions generate a pre-signed URL with an expiry for the download',
    'Give the third party IAM user keys',
    'Change the bucket policy to allow everyone to read',
  ]}
  answer={1}>

**Correct: B** — A pre-signed URL is issued temporarily by an identity with permissions; the third party can access the private object until expiry, after which the link stops working, with no need to make it public or issue credentials. A anyone can read it while it is public, a high risk. C giving out keys is very dangerous. D allowing everyone to read is effectively public data.

</Quiz>

<Quiz
  qnum={28}
  total={65}
  question="An API Gateway needs custom authorization logic (such as validating a third-party JWT or querying an in-house permission service) to decide whether to allow a request, and wants to cache the authorization result to reduce latency. Which approach fits best?"
  options={[
    'A Lambda authorizer that returns an IAM policy and can cache the authorization result',
    'Hand-code validation in every backend function',
    'Make the API fully public and decide in the frontend',
    'Use an API key as user authentication',
  ]}
  answer={0}>

**Correct: A** — A Lambda authorizer holds custom authorization logic (validate a JWT, query a permission service), returns an allow/deny IAM policy to the gateway, and can cache results by cache key to reduce repeat-validation latency. B hand-coding everywhere is duplicated and error-prone. C frontend decisions can be bypassed. D an API key is identification and quota, not user authentication.

</Quiz>

<Quiz
  qnum={29}
  total={65}
  question="A developer is troubleshooting an AccessDenied error and wants to confirm whether an IAM principal is actually allowed a specific action/resource and find which policy causes the deny. Which tool is most direct?"
  options={[
    'Open all permissions and see what happens',
    'Use the IAM Policy Simulator or review CloudTrail events to determine effective permissions and the reason for the deny',
    'Switch to the root account',
    'Rebuild all of the principals policies and hope',
  ]}
  answer={1}>

**Correct: B** — The IAM Policy Simulator can simulate a principals effective permissions on a specific action/resource, and CloudTrail records the actual denied API calls and context, together pinpointing the root cause of AccessDenied. A opening all permissions is dangerous trial and error. C using root masks the problem and violates best practice. D blindly rebuilding cannot pinpoint the cause.

</Quiz>

<Quiz
  qnum={30}
  total={65}
  question="An S3 bucket must accept only uploads encrypted with a KMS customer managed key, rejecting any PUT that is unencrypted or uses the wrong encryption. Which approach most directly enforces this rule?"
  options={[
    'Trust that every uploader will encrypt voluntarily',
    'Use a bucket policy to deny PutObject that lacks the required SSE-KMS header or does not use the specified key',
    'Make the key public for everyones convenience',
    'Scan for unencrypted objects afterward and delete them manually',
  ]}
  answer={1}>

**Correct: B** — A bucket policy with conditions (such as s3:x-amz-server-side-encryption must be aws:kms and a specified key ARN) rejects PutObject that does not comply, enforcing the encryption method at the source. A relying on goodwill is unreliable. C a public key is a major risk. D cleaning up afterward does not prevent noncompliant writes from landing.

</Quiz>

<Quiz
  qnum={31}
  total={65}
  question="A developer wants a Lambda to be invocable by API Gateway in the same account, but does not want to grant invoke permission to every service in the account. Which approach best follows least privilege?"
  options={[
    'Make the function invocable by anyone',
    'Use lambda:AddPermission to add to the functions resource-based policy, restricting the principal to the API Gateway service and SourceArn to that API',
    'Give the API Gateway execution role AdministratorAccess',
    'Disable all permission checks on the function',
  ]}
  answer={1}>

**Correct: B** — AddPermission adds a statement to the Lambda resource-based policy restricting the principal to apigateway.amazonaws.com with a SourceArn bound to that specific API, so only that API can invoke it, following least privilege. A letting anyone invoke is high risk. C admin access is far too broad. D disabling permission checks is a serious anti-pattern.

</Quiz>

<Quiz
  qnum={32}
  total={65}
  question="A team wants to rotate a KMS customer managed key that is in use for compliance, while old data remains decryptable without re-encryption. Which statement best describes KMS automatic key rotation?"
  options={[
    'Rotation immediately makes old ciphertext undecryptable',
    'When automatic rotation is enabled KMS generates new key material, keeps old material to decrypt existing ciphertext, and is transparent to the application',
    'Rotation requires manually re-encrypting all objects',
    'Rotation changes the key ARN, so the application must update its configuration',
  ]}
  answer={1}>

**Correct: B** — Automatic rotation of a KMS symmetric CMK periodically generates new key material for future encryption while retaining old material to decrypt existing ciphertext; the key ID/ARN stays the same and it is transparent to the application, with no re-encryption needed. A old ciphertext still decrypts. C no re-encryption required. D the ARN does not change.

</Quiz>

<Quiz
  qnum={33}
  total={65}
  question="A developer wants to secure data in transit, with encrypted channels from frontend to API and from API to backend. Which is the most basic correct approach for encryption in transit?"
  options={[
    'Use HTTP plaintext throughout but compress packets',
    'Enforce HTTPS/TLS, and optionally use a bucket policy/condition to reject non-encrypted (non-TLS) requests',
    'As long as there is encryption at rest, transit does not matter',
    'Base64-encode the data and send over HTTP',
  ]}
  answer={1}>

**Correct: B** — The basic approach for encryption in transit is HTTPS/TLS throughout, and you can enforce it with a policy condition (such as denying when aws:SecureTransport is false). A HTTP plaintext can be eavesdropped. C at rest and in transit are different and both are needed. D base64 is just encoding and HTTP transport is still plaintext.

</Quiz>

<Quiz
  qnum={34}
  total={65}
  question="A Lambda execution role has accumulated many unused permissions over time, and the security team wants to narrow it to actually used actions. Which approach best narrows permissions based on actual usage?"
  options={[
    'Delete the role and start over, adding permissions as errors appear',
    'Use IAM Access Analyzer to generate least-privilege policy suggestions from CloudTrail activity, then narrow accordingly',
    'Change permissions to wildcards to be safe',
    'Just attach ReadOnlyAccess',
  ]}
  answer={1}>

**Correct: B** — IAM Access Analyzer can generate least-privilege policy suggestions based on actual API activity recorded in CloudTrail, the most precise way to narrow permissions. A deleting and restarting risks outages and has no basis. C wildcards violate least privilege. D ReadOnlyAccess may not match the functions actual required actions.

</Quiz>

<Quiz
  qnum={35}
  total={65}
  question="A developer wants a private S3 bucket behind CloudFront to be accessible only through CloudFront, not readable directly via an S3 URL. Which approach is correct?"
  options={[
    'Make S3 public so CloudFront can read it',
    'Use Origin Access Control (OAC) so CloudFront accesses S3 with a signed identity, and a bucket policy that allows only that origin',
    'Embed S3 keys in the CloudFront configuration',
    'Disable CloudFront and expose S3 directly',
  ]}
  answer={1}>

**Correct: B** — CloudFront Origin Access Control (OAC) lets the distribution access the private S3 bucket with a signed identity, and a bucket policy allowing only that CloudFront origin achieves access only through CloudFront and no direct S3 reads. A a public bucket can be read directly. C S3 does not embed keys into CloudFront. D exposing S3 directly completely violates the requirement.

</Quiz>

<Quiz
  qnum={36}
  total={65}
  question="A developer wants a container in an ECS task (Fargate) to call AWS services with least privilege, without putting long-lived keys in the image or environment variables. Which approach is correct?"
  options={[
    'Bake access keys into the container image',
    'Assign an ECS task role to the task so the container automatically gets rotating temporary credentials',
    'Share one permanent key across all tasks',
    'Put the keys in the container environment variables in plaintext',
  ]}
  answer={1}>

**Correct: B** — An ECS task role lets the container automatically obtain auto-rotating temporary credentials via the credential provider, with no long-lived keys in the image or environment variables, and least-privilege per task. A baking into the image leaks with the image. C a shared permanent key is hard to audit and high risk. D plaintext environment variables leak easily.

</Quiz>

<Quiz
  qnum={37}
  total={65}
  question="A public API is harassed by automated scripts using common attack patterns (SQL injection, excessive requests), and the developer wants to filter malicious traffic and rate-limit before it reaches the backend. Which service fits best?"
  options={[
    'Increase the backend Lambda memory to absorb it',
    'Attach AWS WAF in front of API Gateway/CloudFront with rules to block malicious patterns and apply rate limiting',
    'Disable logging so attackers cannot see anything',
    'Change the API to synchronous blocking',
  ]}
  answer={1}>

**Correct: B** — AWS WAF can sit in front of API Gateway, CloudFront, or ALB and use managed/custom rules to filter attack patterns like SQL injection and apply rate-based limiting, intercepting malicious traffic before the backend. A memory does not block attacks. C disabling logs loses observability. D a blocking model is unrelated to protection.

</Quiz>

## Part 3 · Deployment and Testing (Questions 38-51)

<Quiz
  qnum={38}
  total={65}
  question="A team updating a CloudFormation/SAM stack wants to preview which resources will be added/modified/deleted before executing, to avoid accidental deletion. Which feature is most direct?"
  options={[
    'Just deploy and see the result',
    'Create a change set to preview resource changes before executing',
    'Delete the stack and recreate it',
    'Only look at the template diff and guess',
  ]}
  answer={1}>

**Correct: B** — A CloudFormation change set lists the add/modify/delete (including possible replacement) this update will cause per resource, and only executes after you confirm, avoiding accidental deletion. A deploying directly has no preview buffer. C deleting and recreating is riskier. D a template diff alone cannot show how CloudFormation will actually treat resources (such as whether it replaces them).

</Quiz>

<Quiz
  qnum={39}
  total={65}
  question="A CloudFormation stack update stops partway because a resource fails to create, and the developer wants the default behavior to return automatically to the pre-update stable state. Which statement best describes this default mechanism?"
  options={[
    'On failure the stack stays in a half-complete state for manual handling',
    'CloudFormation by default automatically rolls back to the pre-update state on an update failure',
    'A failure automatically deletes the entire stack',
    'A failure skips that resource and continues',
  ]}
  answer={1}>

**Correct: B** — CloudFormation by default automatically rolls back to the pre-update stable state on an update failure, maintaining availability. A it does not leave the stack half-complete and unattended. C an update failure rolls back rather than deleting the whole stack. D it does not skip a failed resource and continue, to avoid a half-baked state.

</Quiz>

<Quiz
  qnum={40}
  total={65}
  question="A developer wants to cache dependency directories (such as node_modules) in the CodeBuild buildspec to speed up later builds. Which approach is most direct?"
  options={[
    'Re-download all dependencies on every build',
    'Set cache paths in the buildspec with CodeBuild caching (such as S3 or local) to cache and reuse the dependency directories',
    'Commit the dependencies into the git repo',
    'Manually copy the dependencies to the build machine',
  ]}
  answer={1}>

**Correct: B** — The buildspec can declare cache.paths to cache dependency directories (such as node_modules, .m2) to S3 or local, reusing them in later builds to cut time. A re-downloading everything is slowest. C committing dependencies pollutes the repo and is hard to maintain. D manual copying is not reproducible or automated.

</Quiz>

<Quiz
  qnum={41}
  total={65}
  question="A team wants a CI/CD pipeline to add a manual-approval gate before production deployment (for example a manager must approve to continue). Which CodePipeline feature is most direct?"
  options={[
    'A manual approval action that pauses the pipeline until approved',
    'Automate the production deployment with no gate',
    'Rely on a verbal heads-up',
    'Go back and forth over email then deploy manually',
  ]}
  answer={0}>

**Correct: A** — A CodePipeline manual approval action pauses the pipeline, waiting for a designated person to approve (optionally with SNS notification) before the next stage, exactly a pre-production review gate. B no gate loses the review mechanism. C a verbal heads-up cannot hold the pipeline. D emailing back and forth and deploying manually is not part of an automated pipeline.

</Quiz>

<Quiz
  qnum={42}
  total={65}
  question="A developer wants a SAM template to declare that each Lambda deployment does gradual traffic shifting, automatic rollback on failure, and pre-shift validation, using built-in SAM syntax rather than wiring CodeDeploy manually. Which approach is most direct?"
  options={[
    'Manually shift traffic step by step in the console',
    'Use SAM AutoPublishAlias with DeploymentPreference (such as Canary/Linear, Alarms, Hooks) to declare a gradual deployment',
    'Overwrite $LATEST directly every time',
    'Delete and recreate the function',
  ]}
  answer={1}>

**Correct: B** — SAM AutoPublishAlias with DeploymentPreference declares the deployment type (Canary/Linear), binds alarms for automatic rollback, and runs Hooks validation before and after shifting, wiring CodeDeploy underneath automatically. A manual shifting is not reproducible. C overwriting $LATEST has no gradual shift or rollback. D deleting and recreating causes an outage.

</Quiz>

<Quiz
  qnum={43}
  total={65}
  question="A team wants to load-test an API to observe latency, error rate, and auto-scaling behavior under high concurrency before deciding production capacity. Which approach is most reasonable?"
  options={[
    'Run it once locally single-threaded as the test',
    'Generate high-concurrency traffic with a load-testing tool in a production-like environment and analyze CloudWatch latency/error/scaling metrics',
    'Run destructive load tests directly against production',
    'Estimate capacity from user complaints about slowness',
  ]}
  answer={1}>

**Correct: B** — Load testing should simulate high concurrency with a tool in a production-like environment and use CloudWatch to observe latency, error rate, throttling, and scaling behavior to set capacity. A a single-threaded one-time run does not reflect concurrency. C destructive tests against production are dangerous. D estimating from complaints is imprecise and reactive.

</Quiz>

<Quiz
  qnum={44}
  total={65}
  question="A developer does a blue/green deployment to ECS with CodeDeploy and wants to run a round of validation tests against the new version while it is deployed but not yet serving production traffic, shifting traffic only if it passes. Which lifecycle hook best holds this validation?"
  options={[
    'ApplicationStop',
    'A pre-shift hook such as AfterAllowTestTraffic / BeforeAllowTraffic to run validation',
    'DownloadBundle',
    'No validation at all after ApplicationStart',
  ]}
  answer={1}>

**Correct: B** — Blue/green deployment can run validation tests in hooks before production traffic shifts to the new version (such as AfterAllowTestTraffic, BeforeAllowTraffic), shifting only on pass and rolling back on failure. A ApplicationStop is the stop-old-version phase. C DownloadBundle is the fetch-artifact phase. D no validation loses the gate.

</Quiz>

<Quiz
  qnum={45}
  total={65}
  question="A team wants to manage deployments for dev/stage/prod with the same SAM template and record each environments parameters and deployment settings in a config file for repeatable runs. Which TWO approaches are most reasonable? (Choose TWO)"
  options={[
    'Use template Parameters so one template takes different environment values',
    'Use samconfig (deployment config) to record each environments parameters and settings for sam deploy to reuse',
    'Copy an almost identical template per environment',
    'Hard-code environment differences in Lambda code',
    'Manually enter parameters in the console on every deployment',
  ]}
  answer={[0, 1]}>

**Correct: A, B** — The two keys to one template for multiple environments: use Parameters so one template accepts different environment values (A), and use samconfig to record each environments parameters/settings for sam deploy to reuse (B), reducing drift. C copying templates drifts out of sync. D hard-coding in code is not infrastructure config. E manual entry is not reproducible and easy to miss.

</Quiz>

<Quiz
  qnum={46}
  total={65}
  question="A developer wants a CloudFormation template to reference a value output by another stack (such as a shared VPC subnet ID) to decouple the network stack from the application stack. Which approach fits best?"
  options={[
    'Hard-code the subnet ID in every template',
    'Export the value with Outputs plus Export in the network stack and use Fn::ImportValue in the application stack to reference it across stacks',
    'Manually paste the ID into each template',
    'Put all resources in one giant stack',
  ]}
  answer={1}>

**Correct: B** — The standard way to share values across stacks is for the source stack to name an Export under Outputs and the consuming stack to reference it with Fn::ImportValue, achieving decoupling and reuse. A hard-coded IDs drift. C manual pasting is error-prone and hard to maintain. D one giant stack loses modularity and independent updates.

</Quiz>

<Quiz
  qnum={47}
  total={65}
  question="A team finds that someone manually changed the actual resources of a CloudFormation stack in the console, making them inconsistent with the template (drift). The developer wants to detect such resources. Which feature is most direct?"
  options={[
    'Compare each resource by eye',
    'Use CloudFormation drift detection to find resources that no longer match the template',
    'Delete and recreate the stack',
    'Disable console access so there is no drift',
  ]}
  answer={1}>

**Correct: B** — CloudFormation drift detection compares the actual configuration of resources in the stack with the template definition and lists manually changed (drifted) resources for the team to fix or reconcile. A comparing by eye does not scale. C deleting and recreating is risky. D disabling access is a governance measure, not detection of existing drift.

</Quiz>

<Quiz
  qnum={48}
  total={65}
  question="A developer does a canary deployment for Lambda: shift 10% of traffic to the new version with a CloudWatch alarm, and automatically roll back if the error rate exceeds the threshold. Which combination most directly achieves automatic rollback on breach?"
  options={[
    'Watch the dashboard manually and shift back by hand when a problem is found',
    'Use CodeDeploy (or SAM DeploymentPreference) bound to a CloudWatch alarm, rolling back automatically to the old version when the alarm triggers',
    'Delete the old version so there is no problem',
    'Turn off the alarm so it does not interfere with the deployment',
  ]}
  answer={1}>

**Correct: B** — CodeDeploy (which SAM DeploymentPreference can also declare) can bind a CloudWatch alarm, and if the alarm goes into the alarm state during the canary it automatically rolls back to the old version without manual intervention. A watching manually is slow and easy to miss. C deleting the old version loses the rollback target. D turning off the alarm removes the trigger for automatic rollback.

</Quiz>

<Quiz
  qnum={49}
  total={65}
  question="A team wants to deploy a static frontend site (HTML/JS/CSS) to the cloud with edge acceleration, a custom domain, and HTTPS. Which combination is most direct?"
  options={[
    'Put the site in a Lambda that returns HTML',
    'Store static files in S3, put CloudFront in front for edge caching and HTTPS, and use Route 53 for the domain',
    'Put the site in DynamoDB',
    'Serve the static files from a single EC2 instance',
  ]}
  answer={1}>

**Correct: B** — The standard way for a static site is S3 for static files, CloudFront for global edge caching and TLS, and Route 53 for a custom domain, low cost and scalable. A returning static pages from Lambda is uneconomical. C DynamoDB is not static hosting. D a single EC2 instance has no edge acceleration and needs self-managed high availability.

</Quiz>

<Quiz
  qnum={50}
  total={65}
  question="A developer wants to automatically validate Lambda behavior before and after a deployment (smoke test before shifting, validation after shifting) using CodeDeploy lifecycle hooks to trigger small validation functions. Which statement is correct?"
  options={[
    'Lifecycle hooks can only send notifications, not run validation',
    'CodeDeploy can call a validation Lambda in the BeforeAllowTraffic/AfterAllowTraffic hooks, aborting and rolling back the deployment if validation fails',
    'Hooks can only run after the deployment completes',
    'Hooks cannot influence whether the deployment continues',
  ]}
  answer={1}>

**Correct: B** — A CodeDeploy Lambda deployment can call a validation Lambda in the BeforeAllowTraffic (pre-shift) and AfterAllowTraffic (post-shift) hooks, and if validation reports failure it aborts and rolls back the deployment. A hooks can run validation, not only notifications. C hooks can run both before and after shifting. D hook results decide whether the deployment continues.

</Quiz>

<Quiz
  qnum={51}
  total={65}
  question="A teams integration tests need a temporary, clean, disposable test environment, and the developer wants to use infrastructure as code to create it dynamically in the pipeline and tear it down after testing. Which approach is most reasonable?"
  options={[
    'Maintain a shared long-lived test environment where everyone interferes with each other',
    'Use CloudFormation/SAM in the pipeline to create a temporary stack for the tests, then delete the stack to reclaim resources after completion',
    'Manually click out an environment in the console each time',
    'Run the integration tests directly in production',
  ]}
  answer={1}>

**Correct: B** — Using IaC to dynamically create a temporary stack in the pipeline, run integration tests, then delete it gives an isolated, reproducible, disposable test environment with controlled cost. A a shared long-lived environment causes interference and dirty state. C manual environments are not reproducible. D running integration tests in production is high risk.

</Quiz>

## Part 4 · Troubleshooting and Optimization (Questions 52-65)

<Quiz
  qnum={52}
  total={65}
  question="A developer wants to see on the X-Ray service map how long a specific external HTTP call and a specific DynamoDB query each take, to locate latency. To make these calls appear in the trace, which approach is correct?"
  options={[
    'Just enabling Lambda X-Ray tracing makes everything appear automatically',
    'Enable X-Ray and instrument downstream calls with the SDK (such as wrapping the AWS SDK client and creating subsegments) to produce subsegments',
    'Just set all log levels to DEBUG',
    'Increase the function memory and it will trace automatically',
  ]}
  answer={1}>

**Correct: B** — To see downstream call timings in X-Ray, enable tracing and instrument those calls with the X-Ray SDK (such as wrapping the AWS SDK client or creating subsegments for external HTTP calls) to produce the corresponding subsegments. A enabling tracing alone does not necessarily auto-cover the detail of all custom/external calls. C and D changing log levels or memory is unrelated to producing trace subsegments.

</Quiz>

<Quiz
  qnum={53}
  total={65}
  question="A Lambda is triggered by a large number of asynchronous events, and the developer notices some events appear to be processed twice, causing duplicate side effects. Which statement about asynchronous invocation delivery semantics and correct handling is most accurate?"
  options={[
    'Lambda guarantees exactly-once delivery, so duplicates must be a code bug',
    'Asynchronous invocation can deliver at least once with occasional duplicates, so the function should be designed to be idempotent to tolerate duplicates',
    'Duplicates are impossible and need no handling',
    'Setting retries to 0 guarantees no duplicates and no loss',
  ]}
  answer={1}>

**Correct: B** — Lambda asynchronous invocation has at-least-once semantics and occasionally delivers duplicates, so the correct approach is to design the function to be idempotent (for example dedupe by a unique key) to tolerate duplicates. A Lambda does not guarantee exactly-once. C duplicates can indeed happen. D disabling retries loses events on transient errors and still does not guarantee no duplicates.

</Quiz>

<Quiz
  qnum={54}
  total={65}
  question="A developer finds a DynamoDB table read occasionally returns stale data, traced to using the default eventually consistent reads. A critical flow must read the value just written. Which approach is correct?"
  options={[
    'Retry endlessly until it reads the new value',
    'Use a strongly consistent read (ConsistentRead=true) for that critical read to read the latest written value',
    'Delete and recreate the table',
    'Use Scan to guarantee consistency',
  ]}
  answer={1}>

**Correct: B** — DynamoDB default eventually consistent reads may return a slightly stale value; for a critical read that must read the latest write, specify a strongly consistent read (ConsistentRead=true). A retrying is a band-aid and wasteful. C recreating the table is unrelated to consistency. D Scan is unrelated to the consistency model and is expensive.

</Quiz>

<Quiz
  qnum={55}
  total={65}
  question="A Lambdas CloudWatch metrics show high Throttles, and investigation finds the accounts concurrency quota is consumed by other functions. The developer wants to guarantee this critical function always has some concurrency available. Which setting is most direct?"
  options={[
    'Just raise the account concurrency limit to the maximum',
    'Set Reserved Concurrency for the critical function to guarantee its dedicated concurrency quota',
    'Increase the functions memory',
    'Disable all other functions',
  ]}
  answer={1}>

**Correct: B** — Reserved Concurrency carves out a slice of the account concurrency pool dedicated to the function, guaranteeing it always has available concurrency and is not crowded out by other functions (and also sets its cap). A raising the account limit does not guarantee allocation to this function. C memory is unrelated to concurrency quota. D disabling other functions is impractical.

</Quiz>

<Quiz
  qnum={56}
  total={65}
  question="A developer wants to trace the full processing path of a request, tying together logs across API Gateway, Lambda, and DynamoDB with the same correlation identifier for querying. Which approach is most reasonable?"
  options={[
    'Look at each services logs separately without correlation',
    'Generate/propagate a correlation ID at the request entry, include it in structured logs everywhere, and query by that ID in Logs Insights',
    'Turn off all log levels',
    'Rely on manual timestamp comparison only',
  ]}
  answer={1}>

**Correct: B** — Generate a correlation ID at the entry and propagate it downstream (in a log field or via the X-Ray trace ID), include it in structured logs everywhere, and then query by that ID in CloudWatch Logs Insights to pull the whole paths logs at once. A no correlation makes cross-service tracing hard. C turning off logs leaves nothing to query. D timestamps alone are unreliable.

</Quiz>

<Quiz
  qnum={57}
  total={65}
  question="A Lambda sourced from SQS keeps getting a failing message redelivered and eventually lost, and the team wants to preserve unprocessable messages for later analysis. Which setting is correct?"
  options={[
    'Set the visibility timeout to 0 for fast turnover',
    'Configure a dead-letter queue (DLQ) with a maximum receive count on the source queue, so messages exceeding it move to the DLQ for preservation',
    'Disable retries so failed messages are dropped immediately',
    'Set the batch size to the maximum',
  ]}
  answer={1}>

**Correct: B** — Configuring a DLQ with maxReceiveCount on the SQS queue moves a message to the DLQ once it has been received and failed beyond the limit, preserving it for later analysis and replay and avoiding loss. A a visibility timeout of 0 causes immediate re-delivery and duplicates. C disabling retries/dropping loses messages. D a larger batch does not solve failure preservation.

</Quiz>

<Quiz
  qnum={58}
  total={65}
  question="A developer calls a service and receives an HTTP 400 client error (such as ValidationException). Which statement about such status codes and handling is most accurate?"
  options={[
    '4xx is usually a problem with the clients request itself (bad parameters), so retrying the same request is usually useless and you should fix the request',
    '4xx means the server is broken, so keep retrying until it recovers',
    'All 4xx can be fixed by backoff retry and will self-heal',
    '4xx means being throttled, so lower the rate',
  ]}
  answer={0}>

**Correct: A** — 4xx (such as 400 ValidationException, 403, 404) is usually a problem with the clients request itself, so re-sending the same request does not help and you should fix the request content/permissions. B server errors are 5xx. C general 4xx is not fixed by retry (throttling 429 is the exception). D being throttled is specific codes like 429/503, not all 4xx.

</Quiz>

<Quiz
  qnum={59}
  total={65}
  question="A Lambda reads from RDS, and at peak many concurrent functions each open a database connection, quickly exhausting the database connection count and causing errors. Which approach best fixes connection exhaustion?"
  options={[
    'Raise the database connection limit to unlimited',
    'Use RDS Proxy for connection pooling so many Lambdas share a small number of managed connections',
    'Open a few extra connections per function as spares',
    'Raise the function concurrency to the maximum',
  ]}
  answer={1}>

**Correct: B** — RDS Proxy pools and reuses connections between Lambda and the database, letting many short-lived function calls share a small number of persistent connections and avoiding exhaustion, designed for serverless high concurrency. A unlimited connections is impractical and the database cannot sustain it. C opening more connections exhausts it faster. D raising concurrency makes it worse.

</Quiz>

<Quiz
  qnum={60}
  total={65}
  question="A developer wants to find the optimal Lambda memory setting to balance cost and performance without testing values one by one by hand. Which approach is most reasonable?"
  options={[
    'Always set the minimum memory to save the most',
    'Use a tool like Lambda Power Tuning to measure duration and cost at different memory settings and pick the best sweet spot',
    'Always set the maximum memory for the fastest',
    'Fill in the memory setting randomly',
  ]}
  answer={1}>

**Correct: B** — Lambda CPU scales proportionally with memory, so the optimal point needs measurement; a tool like Power Tuning measures duration and cost at different memory settings to find the sweet spot balancing speed and cost. A always minimum may be slower and thus more expensive. C always maximum wastes cost. D a random value cannot optimize.

</Quiz>

<Quiz
  qnum={61}
  total={65}
  question="A team wants observability and automatic response so that when a queue backlog (visible message count) exceeds a threshold it alarms and automatically scales processing capacity. Which TWO make the most direct combination? (Choose TWO)"
  options={[
    'Use a CloudWatch alarm on the SQS ApproximateNumberOfMessagesVisible metric with a threshold',
    'Drive scaling of the processing side (such as raising Lambda concurrency / adding consumers) from the alarm or metric',
    'Have a person check the queue length once each morning',
    'Delete the queue to clear the backlog',
    'Turn off metric collection to avoid too many alarms',
  ]}
  answer={[0, 1]}>

**Correct: A, B** — The two moves for observability plus automatic response: a CloudWatch alarm on the SQS backlog metric (ApproximateNumberOfMessagesVisible) with a threshold (A), and driving scaling of the processing side from the alarm/metric (B) to drain the backlog. C manual checking is not timely. D deleting the queue loses messages. E turning off metrics loses observability.

</Quiz>

<Quiz
  qnum={62}
  total={65}
  question="A developer finds API Gateway returns 502 Bad Gateway to the client, with a Lambda proxy integration backend. Which troubleshooting direction most likely hits the root cause?"
  options={[
    'It must be a client network problem, no need to check the backend',
    'It is usually because the Lambda return format does not match proxy integration requirements or the function throws an exception; check the return structure (statusCode/body) and the function error logs',
    'Just set the API timeout to the maximum to fix it',
    '502 means insufficient permissions, so change the key',
  ]}
  answer={1}>

**Correct: B** — With Lambda proxy integration, a common cause of 502 is that the functions returned payload does not match the required format (missing the statusCode/body structure) or the function throws an unhandled exception, so check the return structure and function error logs. A it is not a client network problem. C raising the timeout addresses 504-type timeouts, not a format problem. D insufficient permissions is usually 403, not 502.

</Quiz>

<Quiz
  qnum={63}
  total={65}
  question="A Lambda intermittently reports connection timed out and cannot reach a database inside a VPC, and investigation suspects a network setup issue. Which troubleshooting direction is most relevant?"
  options={[
    'It is insufficient memory, just increase the memory',
    'Check whether the functions subnet security group / network ACL allows the port to the database, and whether the subnet routing is correct',
    'Turn off the function timeout',
    'Switch to using root keys for the connection',
  ]}
  answer={1}>

**Correct: B** — Being unable to reach a database inside a VPC is usually a network setup problem: check whether the functions subnet security group allows the port to the DB, the network ACL, and the subnet routing (including whether a NAT or endpoint is needed). A a connection timeout is not a memory problem. C turning off the timeout does not fix being unable to connect. D keys are unrelated to whether the TCP connection works.

</Quiz>

<Quiz
  qnum={64}
  total={65}
  question="A developer finds a Lambdas Duration and Init Duration are both high and wants to tell whether it is slow cold-start initialization or slow business logic. Which metric/approach best distinguishes them?"
  options={[
    'Just look at the total invocation count to decide',
    'Compare Init Duration (initialization time) with Duration (execution time), and use X-Ray segments to see how much is cold start versus processing',
    'Set memory to the minimum to simplify analysis',
    'Turn off tracing to make it faster',
  ]}
  answer={1}>

**Correct: B** — Init Duration reflects cold-start initialization time, Duration reflects actual processing time; comparing them and using X-Ray segments to break down cold start versus business processing distinguishes where it is slow. A invocation count shows nothing about the time distribution. C lowering memory makes it slower and confuses the analysis. D turning off tracing loses the breakdown basis.

</Quiz>

<Quiz
  qnum={65}
  total={65}
  question="A read-heavy write-light service backed by DynamoDB has occasionally high read latency and high read cost, and the developer wants to greatly reduce read latency and RCU consumption with almost no application logic changes. Which TWO are most directly effective? (Choose TWO)"
  options={[
    'Add DynamoDB Accelerator (DAX) in front of DynamoDB to serve hot reads',
    'For reads that tolerate slightly stale data, switch to eventually consistent reads to use about half the RCU',
    'Change all reads to strongly consistent reads to speed them up',
    'Turn off all logging to reduce latency',
    'Delete the table and store on a file system instead',
  ]}
  answer={[0, 1]}>

**Correct: A, B** — For read-heavy write-light workloads, the two moves to cut read latency and cost: add DAX, a DynamoDB-specific in-memory cache, to serve hot reads with microsecond latency (A), and for reads that tolerate slightly stale data switch to eventually consistent reads, which consume about half the RCU of strongly consistent (B). C strongly consistent reads are more expensive and slower, the wrong direction. D turning off logs barely helps latency and loses observability. E deleting the table for a file system is absurd.

</Quiz>

---

👉 Review: [Cheat Sheet and Decision Guide](./cheatsheet.md)
