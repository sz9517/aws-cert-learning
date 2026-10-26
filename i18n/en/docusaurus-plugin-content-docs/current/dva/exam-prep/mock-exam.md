---
sidebar_position: 2
title: DVA Full Mock Exam (65 questions)
---

# DVA-C03 Full Mock Exam (65 questions)

This is a full-length mock exam matching the real exam scale: 65 questions covering the four official domains, written from a developer point of view. Aim for about 90 minutes (roughly 1.4 minutes per question) to simulate real pacing, and complete all questions before checking answers. Every question is original and mimics the DVA-C03 scenario style (scenario stem plus qualifiers, including multiple-response); none are real exam questions. Questions are arranged by the official domain weightings into sections, including several Choose TWO questions whose stems say "Choose TWO" so you select exactly two. Pick your answer first, then expand the explanation to see why it is correct and why the others are wrong.

## Part 1 · Development with AWS Services (Questions 1-20)

<Quiz
  qnum={1}
  total={65}
  question="A Lambda function occasionally fails because a downstream DynamoDB table throttles it, and after a retry it sometimes charges the same order twice. The team wants the same event to produce its side effect only once even if it is processed multiple times. Which approach best achieves idempotency?"
  options={[
    'Set the Lambda retry count to 0 to avoid any duplicate execution',
    'Write to DynamoDB with a condition expression keyed on the order ID so the same ID can only be written once',
    'Use a random number inside the function to decide whether to process this event',
    'Increase the function memory to shorten the run time',
  ]}
  answer={1}>

**Correct: B** — Idempotency means a duplicate input maps to a single result. Using the order ID with a DynamoDB condition expression (such as attribute_not_exists(orderId)) guarantees the same ID succeeds only once, so retries do not charge twice. A disabling retries loses events on transient errors and does not provide idempotency. C makes behavior unpredictable. D is unrelated to idempotency.

</Quiz>

<Quiz
  qnum={2}
  total={65}
  question="A Lambda function needs to reuse a database connection pool and AWS SDK clients after a cold start to lower latency. Which coding practice follows best practices?"
  options={[
    'Create a new database connection and SDK client every time the handler is invoked',
    'Create the connection and SDK clients in the global scope outside the handler so later invocations on the same execution environment reuse them',
    'Hard-code the connection string in the code and disable the connection pool',
    'Store the per-request connection in a Lambda Layer so it can be shared',
  ]}
  answer={1}>

**Correct: B** — Lambda reuses the execution environment, so objects initialized outside the handler (global scope) are reused on warm invocations, saving the cost of rebuilding connections and clients. A rebuilds everything each time, raising latency and exhausting connections. C hard-coding the connection string is insecure and unrelated to pooling. D a Layer packages dependencies, not runtime connections.

</Quiz>

<Quiz
  qnum={3}
  total={65}
  question="A developer exposes a public REST API through API Gateway. The front end must call it cross-origin, and the browser first sends a preflight (OPTIONS) request. Which setting is required for the browser to call across origins successfully?"
  options={[
    'Enable CORS on API Gateway so it correctly answers OPTIONS and returns headers such as Access-Control-Allow-Origin',
    'Change the API authentication to IAM signing',
    'Enable AWS WAF for the API',
    'Disable caching on the client',
  ]}
  answer={0}>

**Correct: A** — Cross-Origin Resource Sharing (CORS) requires the server to return the correct headers so the browser allows cross-origin calls. API Gateway must enable CORS and handle the preflight OPTIONS and headers such as Access-Control-Allow-Origin. B signing handles authentication, not CORS. C WAF is a protection layer. D caching is unrelated to cross-origin.

</Quiz>

<Quiz
  qnum={4}
  total={65}
  question="A DynamoDB table has userId as its partition key. The application needs a non-key lookup such as find a user by email, with low latency and no full table scan. Which approach fits best?"
  options={[
    'Use Scan with a FilterExpression on email for every query',
    'Create a global secondary index (GSI) with email as the partition key and use Query',
    'Load the whole table into Lambda memory and filter in code',
    'Use a local secondary index (LSI) with email as the partition key',
  ]}
  answer={1}>

**Correct: B** — To query efficiently on a non-key attribute, the standard pattern is a global secondary index (GSI) keyed on email, then Query. A Scan reads the whole table and is slow and costly. C loading the whole table does not scale. D an LSI must share the base table partition key and only changes the sort key, so it cannot use email as the partition key.

</Quiz>

<Quiz
  qnum={5}
  total={65}
  question="A developer wants to cache a high-traffic read such as a product catalog to lower DynamoDB read cost and latency, and wants a fully managed cache purpose-built for DynamoDB that is nearly transparent to the application. Which service fits best?"
  options={[
    'Amazon CloudFront',
    'DynamoDB Accelerator (DAX)',
    'Amazon S3',
    'AWS Glue',
  ]}
  answer={1}>

**Correct: B** — DynamoDB Accelerator (DAX) is a fully managed in-memory cache purpose-built for DynamoDB that drops read latency to microseconds and is nearly transparent to the API. A CloudFront is a content delivery network for HTTP and static assets. C S3 is object storage. D Glue is an ETL service; none are DynamoDB read caches.

</Quiz>

<Quiz
  qnum={6}
  total={65}
  question="A team needs to buffer events from several producers, consume them in batches with Lambda, and require strict ordering within the same group while avoiding duplicate processing. Which combination fits best?"
  options={[
    'An SNS standard topic triggering Lambda directly',
    'An SQS FIFO queue with a message group ID, consumed by a Lambda event source mapping',
    'S3 event notifications triggering Lambda',
    'An EventBridge schedule rule triggering once per minute',
  ]}
  answer={1}>

**Correct: B** — When strict ordering and deduplication are required, an SQS FIFO queue with a message group ID keeps order within a group and provides exactly-once processing; Lambda pulls batches through an event source mapping. A SNS standard topic does not guarantee order and may duplicate. C S3 events fire on object changes, not general event buffering. D a schedule rule fires on a timer, unrelated to ordered consumption.

</Quiz>

<Quiz
  qnum={7}
  total={65}
  question="A developer wants to publish a new Lambda version, shift a small amount of traffic to it for validation, then gradually increase it, with a fast rollback. Which Lambda feature most directly supports this?"
  options={[
    'Point an environment variable at the new code',
    'Publish a version and use an alias with weighted routing to gradually adjust the traffic split between old and new versions',
    'Overwrite $LATEST and redeploy every time',
    'Use a CloudWatch alarm to automatically delete the old version',
  ]}
  answer={1}>

**Correct: B** — A Lambda alias can point to multiple versions with weights (for example 10 percent new, 90 percent old), enabling canary or linear rollout and a fast rollback by shifting the weight back. A environment variables do not shift traffic proportions. C overwriting $LATEST cannot do weighted shifting and is hard to roll back. D deleting the old version removes the ability to roll back.

</Quiz>

<Quiz
  qnum={8}
  total={65}
  question="A Lambda behind a synchronous API hits a spike, and the developer worries that high concurrency will overwhelm a fragile downstream relational database. They want to cap the function concurrent executions and throttle requests above that. Which setting is most direct?"
  options={[
    'Set reserved concurrency as the upper limit for the function',
    'Raise the function timeout to the maximum',
    'Raise the memory to the maximum to finish faster',
    'Change the function to asynchronous invocation',
  ]}
  answer={0}>

**Correct: A** — Reserved concurrency caps how many executions can run at once, throttling new invocations above that, which protects a fragile downstream. B a longer timeout does not limit concurrency. C more memory does not change the concurrency cap. D asynchronous invocation only changes the invocation model and can still drive high concurrency downstream.

</Quiz>

<Quiz
  qnum={9}
  total={65}
  question="A developer wants a Lambda to be fully initialized at cold start to avoid the latency spike on the first request, such as predictable traffic on the hour. Which feature fits best?"
  options={[
    'Provisioned concurrency',
    'Shrink the deployment package to the minimum',
    'Switch to container image deployment',
    'Put the function in more Availability Zones',
  ]}
  answer={0}>

**Correct: A** — Provisioned concurrency pre-initializes a set number of execution environments and keeps them warm, so requests avoid cold starts, which suits predictable traffic spikes. B shrinking the package helps a little but does not remove cold starts. C a container image does not by itself guarantee no cold start. D Availability Zones are not directly related to cold starts.

</Quiz>

<Quiz
  qnum={10}
  total={65}
  question="An application needs to send large user uploads directly into S3 without giving the front end long-term credentials and without routing traffic through the application server. Which approach fits best?"
  options={[
    'Hand the front end an IAM user Access Key',
    'Have the back end generate an S3 presigned URL so the front end uploads directly within a time limit',
    'Make the S3 bucket publicly writable',
    'Have the front end upload to the application server first, then relay to S3',
  ]}
  answer={1}>

**Correct: B** — A presigned URL is issued temporarily by a back end that holds the permission, letting the front end PUT the file directly to S3 within the validity window, exposing no long-term credentials and not passing through the application server. A handing an Access Key to the front end is very dangerous. C publicly writable is a major risk. D routing through the server wastes bandwidth and does not meet the requirement.

</Quiz>

<Quiz
  qnum={11}
  total={65}
  question="A developer uses a DynamoDB transaction (TransactWriteItems) to update several items at once and occasionally gets TransactionCanceledException. The cancellation reasons show ConditionalCheckFailed and TransactionConflict. Which handling is most correct?"
  options={[
    'Ignore the exception because the transaction will always eventually succeed',
    'Parse the cancellation reasons, retry retryable conflicts with exponential backoff, and do not retry business-logic condition failures',
    'Immediately retry all failures an unlimited number of times',
    'Switch to BatchWriteItem to ignore condition checks',
  ]}
  answer={1}>

**Correct: B** — Cancellation reasons call for different handling: a transient TransactionConflict is suitable for exponential backoff retry, while ConditionalCheckFailed means a business precondition is not met and should be reported rather than retried. A ignoring causes inconsistency. C immediate retries with no backoff worsen conflicts (thundering herd). D BatchWriteItem does not provide transactional atomicity, so switching loses the transaction guarantee.

</Quiz>

<Quiz
  qnum={12}
  total={65}
  question="A data ingestion pipeline needs near-real-time processing of a large stream of events, supports multiple independent consumers each reading at their own pace with replay, and retains data for several days. Which service fits best as the streaming backbone?"
  options={[
    'Amazon SQS standard queue',
    'Amazon Kinesis Data Streams',
    'Amazon SNS',
    'Amazon MQ',
  ]}
  answer={1}>

**Correct: B** — Kinesis Data Streams orders records by shard, lets multiple consumers keep their own position, and replays within the retention window, which suits near-real-time streaming. A SQS removes a message once consumed, which does not fit multi-consumer replay. C SNS is pub/sub push with no replay. D Amazon MQ is a traditional message broker, not built for large-scale stream replay.

</Quiz>

<Quiz
  qnum={13}
  total={65}
  question="A developer wants to share settings such as a database connection string across functions and services, with hierarchical management (such as /app/prod/db), versioning, and free standard parameters. Which service fits best for such non-secret configuration?"
  options={[
    'AWS Systems Manager Parameter Store (standard parameters)',
    'A public Amazon S3 object',
    'A hard-coded plaintext password in a Lambda environment variable',
    'A single DynamoDB item holding all configuration',
  ]}
  answer={0}>

**Correct: A** — Parameter Store manages configuration by hierarchical path with versioning, and standard parameters are free, which fits storing settings such as connection strings (secrets can use SecureString with KMS). B a public object leaks configuration. C a hard-coded plaintext password is insecure. D a homegrown DynamoDB config table reinvents the wheel and lacks parameter management features.

</Quiz>

<Quiz
  qnum={14}
  total={65}
  question="A developer calling a service with the AWS SDK occasionally gets ThrottlingException and wants the client to be more resilient to transient errors. Which two practices are most correct? (Choose TWO)"
  options={[
    'Use the SDK built-in retry configuration (tunable max attempts and mode)',
    'Apply exponential backoff with jitter to spread retry times',
    'Disable all retries and let errors bubble up',
    'Retry at a fixed 10 milliseconds on throttling until it succeeds',
    'Change the request to synchronous blocking until the service recovers',
  ]}
  answer={[0, 1]}>

**Correct: A, B** — Two ways to make the client resilient: use the configurable retry mechanism built into the AWS SDK (A); and apply exponential backoff with jitter to spread retry times and avoid a second wave of throttling (B). C disabling retries fails on transient errors. D fixed high-frequency retries worsen throttling with no backoff. E blocking is not a retry strategy.

</Quiz>

<Quiz
  qnum={15}
  total={65}
  question="A team wants to manage Lambda, API Gateway, and DynamoDB as infrastructure as code, preferring concise syntax with built-in local testing and deployment tools optimized for serverless. Which fits best?"
  options={[
    'Create resources one by one in the console manually',
    'AWS SAM (Serverless Application Model)',
    'Use shell scripts that call the CLI one resource at a time',
    'Write the resource settings in a README for people to follow',
  ]}
  answer={1}>

**Correct: B** — AWS SAM is built on CloudFormation and optimized for serverless, with concise syntax and tools such as sam local and sam deploy for local testing and deployment. A manual creation is not reproducible. C homegrown scripts lack state management and rollback. D documentation is not infrastructure as code.

</Quiz>

<Quiz
  qnum={16}
  total={65}
  question="A developer wants an S3 object upload event to trigger two unrelated downstreams (one writes an audit log, one makes thumbnails), loosely coupled and easy to add more subscribers later. Which architecture fits best as event fan-out?"
  options={[
    'Have S3 call both Lambdas directly, hard-coded in the code',
    'Send the S3 event to an SNS topic and let multiple subscribers (Lambda, SQS) each receive it for fan-out',
    'Put both jobs into one Lambda run in sequence',
    'Trigger it from a CloudWatch metric',
  ]}
  answer={1}>

**Correct: B** — The standard fan-out pattern publishes from the source to SNS and lets multiple subscribers (Lambda, SQS, and others) consume independently, decoupled, so adding subscribers later does not touch the existing flow. A hard-coding multiple targets is hard to maintain. C one function chaining both jobs makes them affect each other and breaks decoupling. D a CloudWatch metric is not an event fan-out mechanism.

</Quiz>

<Quiz
  qnum={17}
  total={65}
  question="A function needs to read a DynamoDB stream (DynamoDB Streams) to trigger follow-up processing on item changes and must handle failed batches. Which two settings improve reliability? (Choose TWO)"
  options={[
    'Configure an on-failure destination or a dead-letter queue to keep records that cannot be processed',
    'Set the batch size and batch window and enable partial batch responses (report batch item failures)',
    'Set the stream view type to keys only to save the data needed for processing',
    'Set the Lambda timeout to 1 second to give up quickly',
    'Disable retries so failed records are simply dropped',
  ]}
  answer={[0, 1]}>

**Correct: A, B** — Two keys to reliable stream consumption: set an on-failure destination or dead-letter for records that cannot be processed (A) to avoid getting stuck or losing data; and tune batch size/window and report partial batch failures (B) so only the failed records are retried instead of the whole batch. C the view type affects data completeness, not reliability. D a 1-second timeout fails normal processing too. E dropping failed records loses data.

</Quiz>

<Quiz
  qnum={18}
  total={65}
  question="A developer wants to convert a daily early-morning data aggregation job into a fully managed scheduled trigger for Lambda, with cron-like expressions for flexible timing. Which service fits best?"
  options={[
    'Amazon EventBridge schedule rules (schedule with cron/rate expressions)',
    'Run a cron job on EC2 yourself',
    'Rely on a user clicking a trigger daily',
    'An S3 lifecycle rule',
  ]}
  answer={0}>

**Correct: A** — EventBridge can trigger Lambda on a schedule using cron or rate expressions, fully managed with no server to maintain. B self-hosted cron requires operating EC2. C manual triggering is unreliable. D S3 lifecycle manages object retention, not general scheduling.

</Quiz>

<Quiz
  qnum={19}
  total={65}
  question="An API needs to return different content for the same response based on a query parameter, and wants to cache at the API Gateway layer to reduce back-end load. Which setting is most correct?"
  options={[
    'Enable API Gateway stage caching and make that query parameter part of the cache key',
    'Disable caching entirely to ensure correctness',
    'Set the TTL of all responses to 0',
    'Just cache on the client; no need to touch API Gateway',
  ]}
  answer={0}>

**Correct: A** — API Gateway stage caching can cache responses per method; if the response varies by a query parameter, that parameter must be part of the cache key, otherwise different parameters hit the same cached entry and return the wrong content. B and C effectively disable caching and do not reduce back-end load. D client caching cannot offload the back end or be shared across users.

</Quiz>

<Quiz
  qnum={20}
  total={65}
  question="A developer wants to test a full serverless application (Lambda plus API Gateway) locally in a containerized way before deploying, staying as close to cloud behavior as possible. Which tool is most direct?"
  options={[
    'You can only test after deploying to the cloud',
    'sam local invoke / sam local start-api to invoke locally in containers',
    'Open the .py file directly in a browser',
    'Paste the code into the console code editor and try it line by line',
  ]}
  answer={1}>

**Correct: B** — The SAM CLI commands sam local invoke and sam local start-api run containers locally to emulate the Lambda execution environment and API Gateway, letting you test close to cloud behavior before deploying. A testing only after deploy gives slow feedback. C opening a .py file cannot emulate the Lambda runtime. D trying lines in the console is not a repeatable test flow.

</Quiz>

## Part 2 · Security (Questions 21-37)

<Quiz
  qnum={21}
  total={65}
  question="A web and mobile app needs end users to sign in with email/password or social accounts (sign-up, verification, token issuance), and the developer wants the user directory and authentication piece. Which Cognito component owns that responsibility?"
  options={[
    'Cognito User Pool',
    'Cognito Identity Pool',
    'An IAM user group',
    'A KMS key policy',
  ]}
  answer={0}>

**Correct: A** — A User Pool owns the user directory, sign-up/sign-in/MFA, and issues JWTs (ID and access tokens), which is exactly the authentication piece. B an Identity Pool exchanges an authenticated identity for temporary AWS credentials to access AWS services (authorization to AWS). C an IAM user is an AWS identity, not an app end user. D a KMS policy is unrelated to sign-in.

</Quiz>

<Quiz
  qnum={22}
  total={65}
  question="Continuing from the previous question, after users sign in to the User Pool, the app needs them to directly access AWS services (such as uploading to a specific S3 prefix) with temporary credentials and different permissions per identity. Which Cognito component owns that responsibility?"
  options={[
    'Cognito User Pool',
    'Cognito Identity Pool issuing temporary AWS credentials',
    'Embed a long-term IAM key in the app',
    'An API Gateway Usage Plan',
  ]}
  answer={1}>

**Correct: B** — An Identity Pool accepts tokens from a User Pool (or another IdP) and uses STS to issue temporary AWS credentials mapped to an IAM role, letting the front end access AWS services under controlled permissions. A a User Pool only handles authentication and issues no AWS credentials. C a long-term key in the app is very dangerous. D a Usage Plan manages API quotas and keys, not AWS credential exchange.

</Quiz>

<Quiz
  qnum={23}
  total={65}
  question="A developer wants to encrypt many S3 objects using envelope encryption to reduce calls to KMS and cost: use KMS to generate a data key to encrypt the data, and KMS only encrypts/decrypts that data key. Which description best matches envelope encryption?"
  options={[
    'Call KMS Encrypt with the CMK directly for every object to encrypt the whole payload',
    'Use KMS to generate a data key, encrypt the data locally with it, and give only the encrypted data key to KMS to safeguard/decrypt',
    'Download the KMS primary key to the application server to encrypt locally',
    'Skip KMS and hard-code a symmetric key in the code',
  ]}
  answer={1}>

**Correct: B** — Envelope encryption means getting a data key from KMS, encrypting large data locally with it, and afterward only asking KMS to encrypt/decrypt that small data key, saving the cost of calling KMS directly on large data. A using the CMK to encrypt the whole payload is size-limited and costly per call. C the KMS primary key cannot be exported. D a hard-coded key cannot be rotated and is insecure.

</Quiz>

<Quiz
  qnum={24}
  total={65}
  question="A database password must be rotated automatically on a schedule, and the application should fetch the latest value through an API without a redeploy. Which service fits best for such a secret that needs automatic rotation?"
  options={[
    'AWS Secrets Manager, with automatic rotation configured and the application fetching at runtime',
    'Write the password in a Lambda environment variable and update it manually',
    'Put the password in a config file in a public Git repo',
    'Store it in a public S3 object for the application to read',
  ]}
  answer={0}>

**Correct: A** — Secrets Manager is built for secrets, with built-in automatic rotation integrated with many databases, and the application fetches the latest password at runtime through an API with no redeploy. B an environment variable needs manual updates and leaves plaintext. C a public repo is a severe leak. D a public S3 object exposes the password.

</Quiz>

<Quiz
  qnum={25}
  total={65}
  question="A Lambda execution role needs to access S3 and DynamoDB, and the security team requires least privilege with no wildcard resources. Which approach is most correct?"
  options={[
    'Attach AdministratorAccess to avoid missing permissions later',
    'Write a custom policy that allows only the needed actions and scopes Resource to specific ARNs',
    'Embed an Access Key in the function code',
    'Attach PowerUserAccess',
  ]}
  answer={1}>

**Correct: B** — Least privilege scopes both Action and Resource to exactly what is needed, using specific ARNs instead of wildcards. A and D managed policies grant far more than needed. C embedding a long-term key is insecure and violates the principle of using the execution role for temporary credentials.

</Quiz>

<Quiz
  qnum={26}
  total={65}
  question="A developer wants an application on EC2 to call AWS services without storing any long-term key on the machine. Which approach is most correct?"
  options={[
    'Write an IAM user Access Key into a config file',
    'Assign an IAM instance profile/role to the EC2 so the instance automatically obtains temporary credentials',
    'Put the key in an environment variable and rotate it manually',
    'Use the Root key to avoid permission problems',
  ]}
  answer={1}>

**Correct: B** — Assigning an IAM role to EC2 (via an instance profile) lets the application obtain auto-rotating temporary credentials through the instance metadata, with no long-term key stored on the machine. A and C leave a long-term key on the machine. D using the Root key is the worst anti-pattern.

</Quiz>

<Quiz
  qnum={27}
  total={65}
  question="A role in account A must be assumed by a user in account B (cross-account access). Which two settings are required for this AssumeRole to work? (Choose TWO)"
  options={[
    'The trust policy of the role in account A allows the principal in account B to call sts:AssumeRole',
    'The identity in account B is granted sts:AssumeRole targeting the role in account A',
    'Hand the Root key of account A to account B',
    'The two accounts must be in the same Availability Zone',
    'The role in account A must have AdministratorAccess attached',
  ]}
  answer={[0, 1]}>

**Correct: A, B** — Cross-account assume role requires both sides to agree: the assumed role in account A must allow the principal in account B in its trust policy (A); and the assuming identity in account B must have permission to call sts:AssumeRole targeting that role (B). C handing over the Root key is a severe anti-pattern. D assuming a role is unrelated to Availability Zones. E administrator access is not needed and violates least privilege.

</Quiz>

<Quiz
  qnum={28}
  total={65}
  question="A developer protects a back-end API with API Gateway and wants to authenticate with JWT tokens from a User Pool without writing validation logic themselves. Which approach is most direct?"
  options={[
    'Use the API Gateway Cognito User Pool authorizer to validate the JWT',
    'Hand-code JWT validation inside every Lambda',
    'Leave the back end fully public and block it with a firewall',
    'Use an API key as identity authentication',
  ]}
  answer={0}>

**Correct: A** — API Gateway can configure a Cognito User Pool authorizer so the gateway validates the JWT carried by the request, avoiding repeated hand-coding in every function. B hand-coding everywhere is error-prone and hard to maintain. C a public back end is risky. D an API key identifies the caller and quota, not user authentication.

</Quiz>

<Quiz
  qnum={29}
  total={65}
  question="A team wants to avoid putting any long-term cloud key in the code repository or the build environment within CI/CD. Which approach best follows best practices?"
  options={[
    'Store the Access Key in a plaintext CI variable',
    'Use OIDC federation so CI assumes an IAM role with short-lived temporary credentials',
    'Base64-encode the key and commit it to the repo',
    'Share one permanent key with all pipelines',
  ]}
  answer={1}>

**Correct: B** — OIDC federation lets the CI service exchange for short-lived temporary credentials and assume a scoped role, fully avoiding long-term keys in the repo or CI. A a plaintext variable is still a long-term key. C base64 is only encoding, not encryption, so it is a leak. D a shared permanent key cannot be audited and is very risky.

</Quiz>

<Quiz
  qnum={30}
  total={65}
  question="A developer wants all objects in an S3 bucket encrypted at rest using AWS fully managed keys with no key management of their own. Which encryption option is the simplest?"
  options={[
    'SSE-S3 (Amazon S3 managed keys) as the default encryption',
    'Encrypt objects locally with a hard-coded key before upload',
    'Skip encryption to simplify the flow',
    'Call a third-party encryption service yourself on every upload',
  ]}
  answer={0}>

**Correct: A** — SSE-S3 encrypts objects server-side with Amazon S3 managed keys and needs no key management by the developer (upgrade to SSE-KMS only when audit and self-managed rotation are needed). B a hard-coded key is insecure. C no encryption does not meet the requirement. D wiring a third party adds needless complexity.

</Quiz>

<Quiz
  qnum={31}
  total={65}
  question="A KMS customer managed key must let a specific role use the key to encrypt/decrypt but not manage the key (such as scheduling deletion). To separate these duties correctly, which should you primarily adjust?"
  options={[
    'The key policy/grants, granting use actions and management actions to different principals',
    'Make the key public',
    'Delete and recreate the key',
    'Use a symmetric password written in the code',
  ]}
  answer={0}>

**Correct: A** — KMS controls who can use and who can manage through the key policy and grants, so you can give kms:Encrypt/Decrypt to one set of principals and management actions such as kms:ScheduleKeyDeletion to another, separating duties. B a key cannot be public. C delete-and-recreate does not separate duties. D a hard-coded key is an anti-pattern.

</Quiz>

<Quiz
  qnum={32}
  total={65}
  question="A developer must call an AWS service endpoint without SDK support and has to sign the request themselves. Which description best matches AWS request signing (SigV4)?"
  options={[
    'Put the password in the URL query string in plaintext',
    'Use Signature Version 4 to sign the request headers and content with the access key, and the service validates the signature',
    'As long as it uses HTTPS, no signing is needed',
    'Attach the Root password to every request',
  ]}
  answer={1}>

**Correct: B** — AWS uses SigV4 to compute a signature over the request (including headers, a payload hash, and a timestamp), and the service validates it with the same algorithm, ensuring identity and integrity and preventing replay. A sending a password in plaintext is very dangerous. C HTTPS only encrypts transport and does not equal AWS signature validation. D attaching the Root password is a severe anti-pattern.

</Quiz>

<Quiz
  qnum={33}
  total={65}
  question="A cross-origin front end calls a Cognito-protected API, and the developer wants to carry the user identity token securely to the back end for validation. Which approach is most correct?"
  options={[
    'Send the user password with every request to the back end',
    'Have the front end carry the User Pool JWT in the Authorization header and let the authorizer validate it',
    'Put the JWT in the URL bar as a query parameter and log it',
    'Have the back end trust any request carrying a userId parameter',
  ]}
  answer={1}>

**Correct: B** — The standard pattern is for the front end to carry the Cognito-issued JWT in the Authorization header, and the back end/authorizer validates the signature and expiry before allowing it. A sending the password violates zero trust. C putting the token in the URL leaks it through logs or browser history. D a userId parameter alone cannot prove identity.

</Quiz>

<Quiz
  qnum={34}
  total={65}
  question="A developer wants a Lambda to be invoked only by events from a specific S3 bucket and to prevent other sources from invoking it arbitrarily. Which approach is most correct?"
  options={[
    'Restrict the source service and source ARN in the function resource-based policy',
    'Make the function public so anyone can invoke it',
    'Use an if check on the caller IP at the start of the code',
    'Disable CloudTrail to reduce noise',
  ]}
  answer={0}>

**Correct: A** — A Lambda resource-based policy can restrict the allowed source service (such as S3) and a specific source ARN (SourceArn), ensuring only the designated bucket can trigger it. B public invocation is risky. C checking IP in code is unreliable and bypasses the authorization layer. D disabling CloudTrail loses audit.

</Quiz>

<Quiz
  qnum={35}
  total={65}
  question="A team must provide a database connection string (with a password) to a Lambda, encrypting the value at rest and auditing who read it. Which two practices best follow security best practices? (Choose TWO)"
  options={[
    'Use Secrets Manager or Parameter Store SecureString encrypted with KMS',
    'Use CloudTrail to record reads of the secret (access audit)',
    'Write the password in plaintext into the function environment variable for long-term use',
    'Print the password into CloudWatch Logs for easy debugging',
    'Hard-code the password in the code and commit it to the repo',
  ]}
  answer={[0, 1]}>

**Correct: A, B** — Two keys to storing secrets safely: encrypt the value at rest with Secrets Manager or Parameter Store SecureString using KMS (A); and audit reads of the secret with CloudTrail (B). C a plaintext environment variable leaks. D printing the password into logs is a leak. E hard-coding and committing to the repo is the worst leak.

</Quiz>

<Quiz
  qnum={36}
  total={65}
  question="A developer finds two Lambdas sharing one execution role, but one only needs to read S3 and the other only needs to write DynamoDB. How should least privilege be applied?"
  options={[
    'Keep the shared role with the union of both permissions',
    'Create a separate execution role for each function containing only its own required permissions',
    'Just give both functions AdministratorAccess',
    'Delete the role and switch to Access Keys',
  ]}
  answer={1}>

**Correct: B** — Least privilege gives each function only what it needs, so split into separate execution roles to avoid the S3-reading function also holding the ability to write DynamoDB. A the union gives each function more than needed. C administrator access is far too broad. D using Access Keys is an anti-pattern.

</Quiz>

<Quiz
  qnum={37}
  total={65}
  question="An API needs to issue identifiable and rate-limitable credentials to third-party developers, but this is not user identity authentication. Which API Gateway feature fits best?"
  options={[
    'API keys with a Usage Plan for identification and quota/rate limits',
    'A Cognito User Pool authorizer',
    'IAM signature validation',
    'A KMS key policy',
  ]}
  answer={0}>

**Correct: A** — API keys with a Usage Plan identify the caller and apply quota and rate limits, which suits tiered rate limiting for external developers; it is not an authentication mechanism by itself. B a User Pool authorizer validates end-user identity. C IAM signing validates an AWS principal. D a KMS policy is unrelated to API rate limiting.

</Quiz>

## Part 3 · Deployment (Questions 38-51)

<Quiz
  qnum={38}
  total={65}
  question="A team deploying an ECS service wants the old version to keep serving until the new one is ready, with automatic rollback by health check during that window, but the deployment temporarily needs double the resources. Which deployment strategy matches this?"
  options={[
    'In-place rolling update, replacing existing tasks one by one',
    'Blue/green deployment, standing up a new environment, cutting traffic once ready, and cutting back if there is a problem',
    'Stop all tasks and start the new version',
    'Only test locally and do not deploy',
  ]}
  answer={1}>

**Correct: B** — A blue/green deployment stands up a full new version (hence the temporary double resources), cuts traffic over only after validation, and can cut back to the old environment immediately if there is a problem, with low downtime and risk. A a rolling update replaces tasks one by one, needing no doubling but rolling back more slowly. C stop-then-start causes downtime. D not deploying does not meet the requirement.

</Quiz>

<Quiz
  qnum={39}
  total={65}
  question="A developer uses CodeDeploy with Lambda and wants to shift only 10 percent of traffic to the new version, observe for 5 minutes with no errors, then shift the remaining 90 percent all at once. Which deployment configuration type matches?"
  options={[
    'Canary (a small amount first, then all at once after observing)',
    'AllAtOnce (shift all at once)',
    'Linear (release a batch at a fixed interval)',
    'In-place (overwrite in place)',
  ]}
  answer={0}>

**Correct: A** — Canary is exactly shift a small portion of traffic, observe for a period, then shift the rest all at once. B AllAtOnce shifts everything immediately with no observation window. C Linear releases an equal batch at a fixed interval (for example 10 percent per minute). D in-place overwrite is not the Lambda weighted traffic-shift concept.

</Quiz>

<Quiz
  qnum={40}
  total={65}
  question="Continuing from the previous question, if the requirement changes to shift 10 percent of traffic evenly to the new version every 10 minutes until 100 percent, which CodeDeploy deployment type matches best?"
  options={[
    'Canary',
    'Linear (equal increments at a fixed interval)',
    'AllAtOnce',
    'There is no option other than Blue/Green',
  ]}
  answer={1}>

**Correct: B** — Shifting an equal fixed percentage at a fixed interval is a Linear deployment. A canary is a two-stage small amount plus observe plus all at once. C AllAtOnce shifts everything immediately. D is false; Lambda and ECS both offer several traffic-shifting types.

</Quiz>

<Quiz
  qnum={41}
  total={65}
  question="A team CI/CD wants source to build to test to deploy in one pipeline, passing artifacts between stages and stopping on failure. Which set of AWS services maps most directly to this flow?"
  options={[
    'CodePipeline orchestrating CodeBuild (build/test) and CodeDeploy (deploy)',
    'Just use S3 static website hosting for CI/CD',
    'CloudFront with Route 53',
    'Athena with QuickSight',
  ]}
  answer={0}>

**Correct: A** — CodePipeline orchestrates the stages, passes artifacts, and stops on failure; CodeBuild builds and tests, and CodeDeploy deploys, together forming a complete pipeline. B static hosting has no build/test/deploy orchestration. C is content delivery and DNS. D is analytics and BI, none of which are a CI/CD backbone.

</Quiz>

<Quiz
  qnum={42}
  total={65}
  question="A developer defines build steps in CodeBuild (install dependencies, run tests, produce artifacts). Which file does CodeBuild use to describe the build phases?"
  options={[
    'appspec.yml',
    'buildspec.yml',
    'template.yaml (SAM)',
    'Dockerfile',
  ]}
  answer={1}>

**Correct: B** — CodeBuild uses buildspec.yml to define phases such as install/pre_build/build/post_build and the output artifacts. A appspec.yml is the CodeDeploy deployment instruction file. C the SAM template.yaml defines serverless resources. D a Dockerfile defines image build, not CodeBuild phase specs.

</Quiz>

<Quiz
  qnum={43}
  total={65}
  question="Continuing from the previous question, CodeDeploy needs a file describing which version to deploy, where to deploy, and deployment lifecycle hooks (such as BeforeAllowTraffic validation). Which file owns that responsibility?"
  options={[
    'buildspec.yml',
    'appspec.yml / appspec.yaml',
    'package.json',
    'cfn-init configuration',
  ]}
  answer={1}>

**Correct: B** — CodeDeploy uses appspec to describe the deployment target, file mappings, and lifecycle event hooks (such as running validation at BeforeAllowTraffic). A buildspec belongs to CodeBuild. C package.json is a Node project dependency manifest. D cfn-init is CloudFormation instance initialization.

</Quiz>

<Quiz
  qnum={44}
  total={65}
  question="A developer wants a reasonable automated test layering for a Lambda: unit tests validate only business logic without really calling AWS, and another layer validates end-to-end against real AWS resources. Which two practices fit this layering? (Choose TWO)"
  options={[
    'Mock AWS calls in unit tests and focus on validating business logic for fast feedback',
    'Set up integration tests that validate end-to-end against real resources or a sam local environment',
    'Use integration tests only, hitting production directly',
    'Only test manually by clicking in the console',
    'Remove all tests to ship faster',
  ]}
  answer={[0, 1]}>

**Correct: A, B** — Two keys to reasonable layering: unit tests mock AWS to isolate and focus on business logic for fast feedback (A); and integration tests validate end-to-end behavior against real resources or a local emulation such as sam local (B). C hitting production directly is risky. D manual clicking is not repeatable. E removing tests is an anti-pattern for delivery quality.

</Quiz>

<Quiz
  qnum={45}
  total={65}
  question="A team deploying with SAM wants to switch dev and prod settings (such as memory and environment variables) in the same template via parameters/config, avoiding maintaining several nearly identical templates. Which approach fits best?"
  options={[
    'Copy the whole template and edit a separate one per environment',
    'Use CloudFormation/SAM Parameters and the sam deploy config (samconfig) to pass different values per environment',
    'Hard-code the environment differences in the code',
    'Adjust each environment manually in the console',
  ]}
  answer={1}>

**Correct: B** — A parameterized template plus per-environment deployment config passing different values lets one template be reused across environments, reducing drift and maintenance. A multiple copies easily fall out of sync. C hard-coding in code is not infrastructure configuration. D manual adjustment is not reproducible and is easy to miss.

</Quiz>

<Quiz
  qnum={46}
  total={65}
  question="A developer deploys containers on ECS/EKS and needs images stored centrally with version tags and vulnerability scanning, integrated with IAM for access control. Which service fits best as the image registry?"
  options={[
    'Amazon ECR (Elastic Container Registry)',
    'Amazon S3 storing tar files',
    'A self-hosted unencrypted registry on EC2',
    'DynamoDB storing the image binaries',
  ]}
  answer={0}>

**Correct: A** — ECR is a fully managed container image registry supporting tags, lifecycle policies, image scanning, and IAM-integrated access control. B stuffing images in S3 loses registry semantics and pull integration. C a self-hosted unencrypted registry needs operations and is insecure. D DynamoDB is not designed to store large images.

</Quiz>

<Quiz
  qnum={47}
  total={65}
  question="A team wants every merge to the main branch to automatically build the image, push it to ECR, and update the ECS service, stopping and notifying on failure. Which approach best fits the spirit of automated deployment?"
  options={[
    'An engineer builds locally, docker pushes, then updates the service in the console manually',
    'CodePipeline triggers CodeBuild to build and push to ECR, then a deploy stage updates ECS, stopping and notifying on failure',
    'Email the image to operations for manual deployment',
    'Rebuild the entire cluster on every change',
  ]}
  answer={1}>

**Correct: B** — A pipeline that builds, pushes to ECR, and updates ECS automatically on merge, stopping/notifying on failure, is repeatable and auditable automated deployment. A manual steps are error-prone and not reproducible. C emailing an image is absurd and untraceable. D rebuilding the whole cluster each time is costly and unnecessary.

</Quiz>

<Quiz
  qnum={48}
  total={65}
  question="A developer put a validation script in a CodeDeploy appspec lifecycle hook and wants an automatic rollback to the old version if the new version health check fails. Which setting fits this need?"
  options={[
    'Disable rollback and let the new version keep serving on failure',
    'Enable automatic rollback on deployment failure and run health validation in the BeforeAllowTraffic hook',
    'Shift all traffic to the new version first, then test',
    'Delete the old version, then deploy the new one',
  ]}
  answer={1}>

**Correct: B** — Running health validation in a pre-traffic hook (such as BeforeAllowTraffic) and enabling automatic rollback on deployment failure returns to the old version when validation fails, which is the lowest risk. A disabling rollback leaves a bad version live. C cutting all traffic first loses the protection. D deleting the old version first removes the rollback target.

</Quiz>

<Quiz
  qnum={49}
  total={65}
  question="A developer wants to push a set of settings (feature flags, A/B ratios) safely to a running application without a deployment, with gradual rollout and fast rollback. Which service fits best for such dynamic configuration?"
  options={[
    'AWS AppConfig (with validation and gradual rollout)',
    'Hard-code the flags in the code and redeploy',
    'Put the flags in a read-only README',
    'Rebuild the image each time a flag changes',
  ]}
  answer={0}>

**Correct: A** — AppConfig is built for dynamic configuration, supporting structural/semantic validation, gradual rollout, and rollback alarms, letting you change feature flags safely without a redeploy. B hard-coding needs a redeploy and has no gradual rollout. C a README cannot be read and applied by the application. D rebuilding the image defeats the goal of change without deployment.

</Quiz>

<Quiz
  qnum={50}
  total={65}
  question="A developer wants to ship a Lambda as a container image (an existing container build flow). Where must the image be stored so Lambda can pull and deploy it directly?"
  options={[
    'The public Docker Hub registry',
    'Amazon ECR (Lambda supports pulling container images from ECR)',
    'S3 stored as a zip',
    'GitHub Releases',
  ]}
  answer={1}>

**Correct: B** — Lambda container image deployment pulls the image from Amazon ECR. A, C, and D are not sources for a Lambda container image (a zip package goes through the .zip deployment path, which is different from a container image).

</Quiz>

<Quiz
  qnum={51}
  total={65}
  question="A team wants automated integration tests for an API, sending real HTTP requests to the just-deployed test environment in the post-deploy stage of the pipeline to validate end-to-end, then deciding whether to promote to production. Which approach is most reasonable?"
  options={[
    'Run unit tests before merge and go straight to production',
    'Add an integration test stage in the pipeline after deploying to a test environment, and promote to production only if it passes',
    'Run destructive integration tests directly against production',
    'Rely on users reporting bugs as testing',
  ]}
  answer={1}>

**Correct: B** — Adding a gate that deploys to a test environment and runs integration tests, promoting to production only on pass, balances real validation with production safety. A unit tests alone do not cover integration risk. C destructive testing against production is dangerous. D relying on user reports is not a test strategy.

</Quiz>

## Part 4 · Troubleshooting and Optimization (Questions 52-65)

<Quiz
  qnum={52}
  total={65}
  question="A developer finds that a request spanning multiple services (API Gateway to Lambda to DynamoDB) is occasionally slow and wants to pinpoint which segment the latency is in. Which approach is most direct?"
  options={[
    'Enable AWS X-Ray distributed tracing and review the time of each segment/subsegment to find the bottleneck',
    'Just look at the Lambda total run time and guess',
    'Raise the timeout on all services to the maximum',
    'Reboot all resources',
  ]}
  answer={0}>

**Correct: A** — X-Ray presents the time spent in each service segment via traces and a service map, pinpointing which segment the latency is in. B a single metric cannot locate a cross-service bottleneck. C raising timeouts only hides the problem. D rebooting is not a diagnostic method.

</Quiz>

<Quiz
  qnum={53}
  total={65}
  question="A developer calling S3 gets HTTP 503 SlowDown (throttled by too high a request rate) and wants to mitigate at the application layer rather than blindly retry. Which approach is most correct?"
  options={[
    'Immediately retry at a fixed high frequency after a 503',
    'Retry with exponential backoff and jitter, and spread key prefixes as needed to improve scalability',
    'Ignore the 503 and treat it as success',
    'Make the objects public to bypass the limit',
  ]}
  answer={1}>

**Correct: B** — For throttling errors such as 503 SlowDown, retry with exponential backoff and jitter to spread the pressure, and adjust key prefix distribution to raise parallelism as needed. A fixed high-frequency retries worsen throttling. C ignoring the error loses data. D making objects public is unrelated to throttling and is insecure.

</Quiz>

<Quiz
  qnum={54}
  total={65}
  question="A synchronous API Lambda has occasional high first-request latency from cold starts, and traffic has a clear predictable spike (such as 9 a.m. daily). Which two practices effectively reduce cold-start impact? (Choose TWO)"
  options={[
    'Set provisioned concurrency for the function to have warm environments ready before the spike',
    'Shrink the deployment package and dependencies and streamline initialization to speed up the cold start',
    'Set the function memory to the minimum to save money',
    'Disable all retries',
    'Change the function to rebuild all connections on every request',
  ]}
  answer={[0, 1]}>

**Correct: A, B** — Two ways to reduce cold-start impact: use provisioned concurrency to pre-warm for a predictable spike (A); and shrink the package and streamline initialization to shorten the cold start itself (B). C too little memory lengthens run and initialization. D disabling retries is unrelated to cold starts. E rebuilding connections every request makes latency worse.

</Quiz>

<Quiz
  qnum={55}
  total={65}
  question="A developer finds that some DynamoDB requests return ProvisionedThroughputExceededException concentrated on a single partition key (a hot key). Which approach best addresses the root cause?"
  options={[
    'Immediately retry the request an unlimited number of times',
    'Redesign the partition key so access is more even (or add a write shard), and switch to on-demand capacity if needed',
    'Delete and recreate the table',
    'Change all reads and writes to strongly consistent to speed up',
  ]}
  answer={1}>

**Correct: B** — A hot key blows out the throughput of a single partition; the root fix is to redesign the partition key so access is distributed (or add a write-shard suffix), and on-demand capacity can absorb spikes. A immediate retries treat the symptom only. C delete-and-recreate does not change the distribution. D strongly consistent reads add load and are unrelated to the hot key.

</Quiz>

<Quiz
  qnum={56}
  total={65}
  question="A developer wants to add structured logging that can be correlated by request for troubleshooting, using a fully managed centralized log query and analysis. Which approach fits best?"
  options={[
    'Write logs to the function local disk',
    'Emit to CloudWatch Logs with structured (JSON) logs and query with Logs Insights',
    'Only print to standard output without collecting',
    'Email the logs to yourself',
  ]}
  answer={1}>

**Correct: B** — Lambda standard output goes to CloudWatch Logs; using JSON structured logs and querying with CloudWatch Logs Insights lets you correlate and troubleshoot quickly by field or request ID. A the local disk is not durable in Lambda. C not collecting means nothing to query. D emailed logs cannot be searched or analyzed.

</Quiz>

<Quiz
  qnum={57}
  total={65}
  question="An asynchronously invoked Lambda occasionally fails event processing, and the team wants events that fail and exhaust retries not to be lost, so they can review and replay later. Which approach is most correct?"
  options={[
    'Let failed events be dropped directly',
    'Configure an on-failure destination or a dead-letter queue (DLQ) to keep failed events',
    'Set the retry count to 0',
    'Set the function timeout to 1 second',
  ]}
  answer={1}>

**Correct: B** — Asynchronous invocation can configure an on-failure destination or DLQ to send retry-exhausted events to SQS/SNS for later review and replay, avoiding loss. A dropping loses data. C disabling retries fails transient errors directly. D a 1-second timeout fails normal processing too.

</Quiz>

<Quiz
  qnum={58}
  total={65}
  question="A developer calling a service gets HTTP 429 (Too Many Requests). Which description of this status code and handling is most correct?"
  options={[
    '429 means an internal server error and should be reported as a code bug',
    '429 means throttled/too high a rate; it is retryable, so retry with backoff and reduce the request rate as needed',
    '429 means insufficient permission and you should rotate the key',
    '429 means the resource does not exist and you should create it',
  ]}
  answer={1}>

**Correct: B** — 429 means too many requests, throttled, which is a retryable error, and the correct handling is to retry with backoff and lower the rate. A internal errors are 5xx. C insufficient permission is 403. D a missing resource is 404; none are the meaning of 429.

</Quiz>

<Quiz
  qnum={59}
  total={65}
  question="A developer finds the application fetches from Secrets Manager too often, raising cost and latency. Which optimization is most direct?"
  options={[
    'Re-fetch the secret on every request',
    'Fetch at function initialization and cache the secret in the execution environment, re-fetching after a reasonable TTL',
    'Hard-code the secret as plaintext to avoid calls',
    'Put the secret in a public S3 for free reads',
  ]}
  answer={1}>

**Correct: B** — Fetching at initialization (outside the handler) and caching the secret in the warm execution environment with a reasonable TTL greatly reduces fetch count and latency. A re-fetching every time is slow and costly. C a hard-coded plaintext secret is insecure. D a public S3 leaks the secret.

</Quiz>

<Quiz
  qnum={60}
  total={65}
  question="A Lambda run time is close to its configured timeout, and the logs show it waiting on an occasionally slow external HTTP dependency. Which set of troubleshooting/optimization is most reasonable?"
  options={[
    'Raise the timeout indefinitely as the solution',
    'Set a reasonable timeout and backoff retry on the external call, use X-Ray to locate the slow point, and move to async or add a cache if needed',
    'Set the function memory to the minimum',
    'Disable logging to improve performance',
  ]}
  answer={1}>

**Correct: B** — The right approach is a reasonable timeout and backoff on the external dependency, X-Ray to find where it is slow, then move to async processing or add a cache to reduce the dependency as needed. A just raising the timeout only delays and adds cost. C too little memory makes it slower. D disabling logging removes the basis for troubleshooting.

</Quiz>

<Quiz
  qnum={61}
  total={65}
  question="A developer wants to be notified in real time about a key error (such as a rising 5xx ratio) and to automatically trigger remediation. Which combination is most direct?"
  options={[
    'Rely on someone looking at a dashboard manually every hour',
    'Create a CloudWatch alarm from a metric/metric filter, notify through SNS, and trigger a Lambda for automatic remediation',
    'Ignore the errors to avoid being bothered',
    'Review the monthly bill to guess the problem',
  ]}
  answer={1}>

**Correct: B** — A CloudWatch alarm watching a metric (or one generated from a log metric filter) notifies through SNS and can trigger a Lambda for automatic remediation when a threshold is crossed, achieving real-time observability and automated response. A manual inspection is not real time. C ignoring errors is dangerous. D the monthly bill cannot troubleshoot in real time.

</Quiz>

<Quiz
  qnum={62}
  total={65}
  question="A team wants to lower Lambda cost and latency and finds the memory setting is too low, starving CPU and making runs too long. Which tuning concept is most correct?"
  options={[
    'Always set memory to the minimum to save the most money',
    'Lambda CPU scales proportionally with memory, so moderately raising memory can shorten run time and may be cheaper or faster',
    'Memory and CPU are unrelated',
    'Just raising the timeout makes it faster',
  ]}
  answer={1}>

**Correct: B** — Lambda CPU and network scale proportionally with memory, so for CPU-bound work moderately raising memory often shortens run time, and total cost can hold steady or even drop (use Power Tuning to find the sweet spot). A always-minimum can be slower and costlier. C memory and CPU are directly related. D raising the timeout does not speed anything up; it only allows a longer run.

</Quiz>

<Quiz
  qnum={63}
  total={65}
  question="A developer sees 'Task timed out after N seconds' in Lambda logs. Which troubleshooting direction is most correct?"
  options={[
    'This is a permission error and you should rotate the execution role',
    'The function did not finish within the timeout; analyze the time spent (external dependency/initialization), set a reasonable timeout, and optimize rather than just enlarging it',
    'This means insufficient memory and you should switch to EC2',
    'Ignore it; timeouts do not affect results',
  ]}
  answer={1}>

**Correct: B** — The timeout message means the function did not finish within the configured time, so first use logs/X-Ray to find the time source (a slow external dependency, heavy initialization), optimize, then set a reasonable timeout rather than blindly enlarging it. A it is not a permission problem. C a timeout does not equal insufficient memory and does not necessarily require EC2. D a timeout fails that execution and cannot be ignored.

</Quiz>

<Quiz
  qnum={64}
  total={65}
  question="A batch Lambda consuming from SQS occasionally fails to process a few messages, causing the whole batch to be redelivered and successfully processed messages to be handled again. Which setting retries only the failed messages?"
  options={[
    'Redeliver the whole batch on failure and accept duplicates',
    'Enable partial batch responses (ReportBatchItemFailures) in the event source mapping to report and retry only the failed items',
    'Set the batch size to 1 to avoid the problem',
    'Disable the DLQ',
  ]}
  answer={1}>

**Correct: B** — With partial batch responses (ReportBatchItemFailures) enabled, the function reports only the failed message IDs, and SQS redelivers only those, avoiding reprocessing already successful messages. A redelivering the whole batch causes duplicates. C a batch size of 1 avoids it but worsens throughput and cost. D disabling the DLQ loses the safety net of keeping failed messages.

</Quiz>

<Quiz
  qnum={65}
  total={65}
  question="A developer wants to lower back-end database load and latency for a read-heavy, write-light API whose responses can be briefly stale, without changing much code. Which two are most directly effective? (Choose TWO)"
  options={[
    'Enable response caching on API Gateway with a reasonable TTL',
    'Put an in-memory cache (such as ElastiCache/DAX) in front of the database to serve hot reads',
    'Change all queries to strongly consistent reads to speed up',
    'Disable all logging to improve performance',
    'Delete the database instance and switch to files',
  ]}
  answer={[0, 1]}>

**Correct: A, B** — For read-heavy, write-light with tolerance for brief staleness, the two most direct moves: API Gateway response caching with a reasonable TTL to absorb repeated requests (A); and an in-memory cache (ElastiCache/DAX) in front of the database to serve hot reads (B), both of which significantly reduce back-end load and latency. C strongly consistent reads add load. D disabling logging barely helps latency and loses observability. E deleting the database for files is absurd.

</Quiz>

---

👉 Review: [Cheat Sheet and Decision Guide](./cheatsheet.md)
