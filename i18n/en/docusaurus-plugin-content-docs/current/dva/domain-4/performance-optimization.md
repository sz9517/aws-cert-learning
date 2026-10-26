---
sidebar_position: 4
title: Performance and Cost Optimization
---

# Performance and Cost Optimization: Slow and Expensive Are Often the Same Disease

> This article takes a developer's view to make your app **both faster and cheaper**. You will see: how Lambda memory and CPU are linked, how Power Tuning finds the sweet spot, why connections and SDK clients belong outside the handler, how provisioned concurrency kills cold starts, how to choose among four caches (ElastiCache / DAX / API Gateway cache / CloudFront), how to pick DynamoDB keys and avoid Scan, plus connection reuse, batching, and pagination. These are exactly the optimization details DVA-C03 Domain 4 loves to test.

## Why put "performance" and "cost" in the same article?

Because in the cloud, **slow and expensive are often the same disease**.

Picture this: every time your Lambda runs, it builds a fresh database connection inside the handler, news up a brand-new SDK client, and then runs a full-table `Scan` against DynamoDB. The result? Every invocation takes several seconds (slow), and because Lambda bills by **milliseconds of runtime times memory** and DynamoDB bills by **amount of data read**, you are **both slow and expensive** at the same time.

Flip it around: move the connection outside the handler for reuse, hit the right key with a single `Query`, and add a cache layer to block repeated reads. Latency drops, and **the bill drops right along with it**. That is why optimization looks at performance and cost together: most of the time you are not trading one for the other, you are getting **two birds with one stone**.

:::note[💬 Reading tip]
Whenever you see a term with a <Term desc="Like this! Hover over any dotted-underline term (tap on mobile) to see a plain-language explanation.">dotted underline</Term>, hover over it for a plain-language explanation. All terms are also collected in the [Glossary of terms and services](/glossary).
:::

<Vocab title="📌 Terms you will meet in this article (no prior knowledge needed)">

- **Latency**: the time a request takes from sending to getting a response. Smaller is better, usually measured in milliseconds (ms).
- **Cold start**: when Lambda has no reusable execution environment, the first invocation must build the environment and load your code first, making the first response slower.
- **Cache**: storing a result you already computed or fetched, so the next identical request grabs the ready-made answer instead of recomputing or re-querying. Saves both time and money.
- **Cache hit / miss**: "hit" means the data you want is already in the cache, so you use it directly; "miss" means it is not there, so you must go back to the backend.
- **Cache invalidation / TTL**: when data changes, the stale copy in the cache should be evicted. A common approach is <Term en="Time To Live" desc="How long data lives in the cache before it is automatically evicted; after it expires the next request re-fetches the latest value from the source.">TTL (Time To Live)</Term>, which auto-expires entries.
- **Throttling**: when request volume exceeds a limit, the service temporarily rejects or queues requests to protect the backend.
- **Scale out**: handling more load by "adding more instances" rather than swapping one machine for a bigger one.

</Vocab>

## With the terms covered, set up a decision order first

The most common optimization mistake is **acting before measuring**. The right order is: **measure** first (find which part is actually slow, which call is actually expensive) then **fix the most painful part** then **measure again** to verify. Keep this order in mind as you read each technique below.

## Core one: Lambda tuning (memory to CPU, Power Tuning, connection reuse, provisioned concurrency)

Lambda is where developers touch the most and can get results the fastest. Four key points:

### 1) Memory and CPU are linked (the most counterintuitive part)

In Lambda you **only set memory** (128 MB to 10,240 MB), but **vCPU is allocated automatically based on memory**: more memory means more CPU. So for CPU-bound functions (image processing, compression, heavy computation), bumping memory from 128 MB to 1024 MB often slashes runtime to a fraction. It **runs faster, billed milliseconds drop, and the bill actually goes down**.

This is the most direct example of "slow and expensive are the same disease": give it too little memory thinking you save money, and you end up slower and pricier.

### 2) Use Power Tuning to find the sweet spot, do not guess

More memory is not always better. Past a certain point CPU is already sufficient, and adding memory just raises the unit price. So how much is optimal? Use **AWS Lambda Power Tuning** (an open-source tool that runs as a Step Functions state machine): it runs your function several times at different memory settings and plots a "memory vs runtime vs cost" curve, telling you directly the **cheapest**, the **fastest**, or the **balanced** point.

### 3) Put connections and SDK clients outside the handler for reuse

This is the number-one Lambda performance detail. Code **outside** the handler runs **only once, during the cold start (Init phase)**, and is reused as long as the same execution environment survives. So database connections, SDK clients, and config loading all go outside, and warm invocations skip the rebuild.

```js
// Correct: connection and SDK client outside the handler, built once on cold start then reused
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

// This runs only once, during the Init phase
const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  // The handler holds only what must run every time
  const res = await ddb.send(
    new GetCommand({ TableName: 'orders', Key: { id: event.id } })
  );
  return res.Item;
};
```

```js
// Wrong: a new client built on every invocation, rebuilding the connection each time -> slow and wasteful
exports.handler = async (event) => {
  const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({})); // rebuilt every time!
  // ...
};
```

### 4) Use Provisioned Concurrency to kill cold starts

For functions that need **low latency with predictable traffic** (a user-facing API, for example), the few hundred milliseconds to several seconds of cold-start latency hurts the experience. <Term en="Provisioned Concurrency" desc="Pre-initializes and keeps a set number of Lambda execution environments warm and ready, so incoming calls hit a warm environment with no cold-start delay.">Provisioned Concurrency</Term> pre-initializes and **keeps N environments warm**, so a call hits a warm environment immediately with no cold start. The cost is that **it bills continuously while enabled**, so only turn it on when you truly need low latency.

:::info[🔑 A commonly confused difference]
**Reserved Concurrency does not** eliminate cold starts; it only "reserves/limits" a slice of concurrency for a function. What actually keeps environments warm and removes cold starts is **Provisioned Concurrency**. DVA loves to swap these two to set traps.
:::

## Core two: how to choose a cache layer (ElastiCache / DAX / API Gateway cache / CloudFront)

The shared spirit of caching: **block repeated reads up front, do not hit the backend every time**. But there are many kinds of cache, each sitting at a different position and serving a different audience.

<div className="flow">
  <div className="flow-node">CloudFront (farthest front, caches static/content, closest to users)</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">API Gateway cache (at the API layer, caches API responses)</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">App layer: ElastiCache (general) / DAX (DynamoDB only)</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Database / backend</div>
</div>

| Cache | Where it sits / what it caches | Typical use |
| --- | --- | --- |
| **CloudFront** | A <Term en="Content Delivery Network" desc="A global network of edge nodes that caches content as close to users as possible to reduce latency.">CDN</Term>, the edge nodes closest to users, caching static assets and cacheable API/content | Images, JS/CSS, video, low-latency access for global users |
| **API Gateway cache** | The API Gateway stage layer, caching the **entire API response** keyed by request parameters | The same GET request hammered many times in a short window, without triggering the backend Lambda each time |
| **ElastiCache** | An app-layer in-memory data store (Redis/Memcached), read and written by your own code | General caching: query results, sessions, leaderboards, counters |
| **DAX** | <Term en="DynamoDB Accelerator" desc="A DynamoDB-only in-memory cache that drops millisecond reads to microseconds with almost no code changes.">DynamoDB Accelerator</Term>, an in-memory cache **only for DynamoDB** | DynamoDB read-heavy write-light workloads that need millisecond-to-microsecond reads without big code changes |

## Core three: DynamoDB optimization (pick the right key, avoid Scan, DAX)

DynamoDB performance and cost are **ninety percent about how you design keys and how you query**.

- **Pick the right key**: make the field you query most often the <Term en="Partition Key" desc="The key DynamoDB uses to decide which partition stores an item; you almost always carry it when querying.">partition key</Term>, so you can `Query` and hit it directly. A good key lets one `Query` fetch exactly the batch you want; a bad key leaves you with a full-table scan. Also keep the partition key well-distributed (high cardinality) to avoid all traffic hammering one partition as a "hot partition".
- **Avoid `Scan`**: `Scan` **reads the entire table** then filters, so the bigger the table the slower it gets, and you **pay for every item read** (even if you only want one). If you can `Query` (with the partition key), never `Scan`. If you really must query by a non-key field, build a <Term en="Global Secondary Index" desc="An extra index on a DynamoDB table that lets you Query by non-primary-key fields instead of running a full-table Scan.">GSI (Global Secondary Index)</Term> and `Query` it.
- **Use DAX to block reads**: for read-heavy write-light workloads that need ultra-low latency, attach **DAX**; reads drop from milliseconds to microseconds and you save a lot of read capacity cost.

```js
// Wrong: using Scan to find an email -> reads the whole table, slow and expensive
const bad = await ddb.send(new ScanCommand({
  TableName: 'users',
  FilterExpression: 'email = :e',
  ExpressionAttributeValues: { ':e': { S: 'a@example.com' } },
}));

// Correct: build a GSI on email, Query directly -> read only the matching items
const good = await ddb.send(new QueryCommand({
  TableName: 'users',
  IndexName: 'email-index',
  KeyConditionExpression: 'email = :e',
  ExpressionAttributeValues: { ':e': { S: 'a@example.com' } },
}));
```

## Core four: connection reuse and keep-alive, batching, pagination

A few general moves where "writing it right makes it fast and cheap":

- **Connection reuse and keep-alive**: beyond putting the client outside the handler, keep the underlying HTTP connection **alive (keep-alive)** for reuse, saving the TCP/TLS handshake overhead each time. The AWS SDK for JavaScript v3 **enables keep-alive by default**; on other runtimes, confirm the connection pool is being reused.
- **Batching**: rather than 25 calls to `GetItem`, use one `BatchGetItem`/`BatchWriteItem` to pack many items into a single request. That is **far fewer round trips**, so latency and cost both drop.
- **Pagination**: fetching too much at once is slow and memory-hungry. For queries that should paginate (`Query`/`Scan`/various List APIs), carry the pagination cursor (such as DynamoDB's `LastEvaluatedKey`) and fetch page by page instead of stuffing one giant payload.

## Fixed section: which cache / which tuning, how to choose, pros and cons, when NOT to use

This is the decision core of the article. When facing a question or a real-world choice, reason through this table.

### CloudFront

- **Why choose it**: it caches content at **edge nodes closest to users**, so global users get it nearby with the lowest latency, while also offloading a lot of origin traffic and saving backend cost.
- **Pros**: global low latency, offloads the origin, integrates WAF/TLS, near-zero rework for static assets.
- **Cons**: mainly suits **cacheable content**; highly personalized, always-different dynamic responses benefit little. You must manage invalidation (edges need updating after a file change).
- **When NOT to use**: when content differs for every user every time and cannot be cached, CloudFront cannot help as a cache (though it can still serve as a security/transport entry point).

### API Gateway cache

- **Why choose it**: when the same GET request is hit many times in a short window, serve the cache at the API layer and **avoid triggering the backend Lambda at all**, saving both latency and Lambda cost.
- **Pros**: simple to enable (a stage-level setting), directly reduces backend calls, can key the cache by request parameters.
- **Cons**: **cache capacity costs extra** (billed by hour times capacity), and within the TTL you may return stale data.
- **When NOT to use**: write requests, or data that must always be instantly fresh; low-traffic APIs are not worth enabling it.

### ElastiCache (Redis / Memcached)

- **Why choose it**: it is a **general** in-memory cache that can front any backend: query results, sessions, leaderboards, counters, all read and written by your own code.
- **Pros**: ultra-low latency, very flexible, and Redis adds rich data structures and persistence options.
- **Cons**: **you manage the cache logic yourself** (hits/misses, invalidation, consistency are all on you), and it is a cluster you operate.
- **When NOT to use**: when you only want to speed up DynamoDB reads without writing cache logic. Use DAX for that, not ElastiCache.

### DAX

- **Why choose it**: it is **DynamoDB-only** and drops reads from milliseconds to microseconds with almost no code change, delivering instant wins in read-heavy write-light scenarios.
- **Pros**: API-compatible with DynamoDB (minimal code change), microsecond reads, saves read capacity cost.
- **Cons**: **serves DynamoDB only** (it cannot touch other databases), and it is a "read cache" that does not help heavy writes or strongly consistent reads.
- **When NOT to use**: when the backend is not DynamoDB, or when you need strongly consistent reads (DAX takes an eventually consistent cache path).

### Lambda memory tuning (with Power Tuning)

- **Why choose it**: memory is linked to CPU, so tuning it right can make things **both faster and cheaper** at once, the highest return on investment.
- **Pros**: zero code change (just a setting), huge gains for CPU-bound work, and Power Tuning finds the exact sweet spot for you.
- **Cons**: past the sweet spot, more memory just raises the unit price; it relies on measurement, not guessing.
- **When NOT to use**: when the bottleneck is **waiting on external I/O** (waiting for a database/API response) rather than CPU, more memory barely helps. Optimize that I/O instead.

### Provisioned Concurrency

- **Why choose it**: it is the only direct fix to **eliminate cold starts** and guarantee low latency for predictable traffic.
- **Pros**: calls hit a warm environment directly, with stable and predictable latency.
- **Cons**: **it bills continuously while enabled** (whether or not it is called), and traffic spikes beyond the provisioned amount still cold-start.
- **When NOT to use**: scattered traffic or background work where you do not care about that first bit of latency; enabling it just burns money.

## Real-world application: not just for the exam

<Scenario title="Real scenario: a slow and expensive query API, tuned step by step to fast and cheap">

You have a `GET /product/{id}` API: API Gateway to Lambda to DynamoDB. Users complain it is slow, and the bill is high. You follow the "measure then fix" order:

1. **Measure**: CloudWatch shows Lambda runtime is high and DynamoDB read volume is abnormally large. Reading the code, you find it uses `Scan` to find data and the client is built inside the handler.
2. **Fix the key and query**: change `Scan` to a `GetItem` on the partition key `id`, hitting it in one shot.
3. **Move the connection**: move the DynamoDB client outside the handler for reuse.
4. **Tune memory**: run Power Tuning and find 512 MB is the sweet spot balancing speed and cost for this function.
5. **Add caching**: popular products are queried repeatedly, so attach **DAX** to block repeated reads, then enable a short-TTL API Gateway cache to absorb the same-second flood.

Result: p99 latency drops from hundreds of milliseconds to tens, and both DynamoDB read volume and Lambda billed milliseconds fall noticeably. Fast and cheap.

</Scenario>

### 🛠️ Hands-on: move the connection outside the handler, before and after

This is the cheapest, most noticeable move. Follow along once and see the difference with your own eyes.

```bash
# 1) Prepare two versions of the function; the only difference is where the client is built

# -- before.js (wrong: client built inside the handler, rebuilt on every call) --
cat > before.js <<'EOF'
exports.handler = async () => {
  const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
  const client = new DynamoDBClient({});   // rebuilt on every call
  return { ok: true };
};
EOF

# -- after.js (correct: client outside, built once on cold start then reused) --
cat > after.js <<'EOF'
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const client = new DynamoDBClient({});     // built once in the Init phase
exports.handler = async () => ({ ok: true });
EOF

# 2) Deploy each, hit each 100 times, and compare Duration (runtime)
#    Query per-invocation Duration with CloudWatch Logs Insights:
aws logs start-query \
  --log-group-name /aws/lambda/your-func \
  --start-time $(date -d '-15 min' +%s) \
  --end-time $(date +%s) \
  --query-string 'fields @duration | stats avg(@duration), pct(@duration, 99)'
```

:::tip[🎯 Expected result: what you should see]
- **before version**: every call has a high, jittery `Duration` (rebuilding the client each time); the cold-vs-warm difference is small because the "heavy lifting" runs every time.
- **after version**: the **first call (cold start) is slightly slower** (it builds the client), but **subsequent calls drop markedly and stabilize**, because the client is reused. Average latency falls, billed milliseconds fall, and **the bill falls with it**.
- With Power Tuning you typically see: as memory rises from 128 MB, runtime drops quickly while cost falls then rises; the crossover is your **sweet spot**.
:::

<Cost>

The essence of optimization is "doing less wasted work", so **saving money and gaining speed usually happen together**. But two items bill continuously and need restraint: **Provisioned Concurrency** (bills while enabled, to stay warm) and **API Gateway cache capacity** (billed by hour times capacity). Turn them on only when truly needed, and off when not. ElastiCache/DAX are clusters you run and are also ongoing cost, so evaluate whether the hit rate really pays off. After practicing, clean up test functions, cache clusters, and Provisioned Concurrency settings.

</Cost>

:::warning[🚑 Common pitfalls]
- **Giving too little memory to save money, ending up slow and expensive**: memory is linked to CPU; a CPU-bound function with too little memory sees runtime explode and billed milliseconds rise. Use Power Tuning to find the sweet spot.
- **Rebuilding the connection / SDK client on every call**: putting it inside the handler rebuilds it on every cold and warm start, slow and wasteful. Always put it outside the handler for reuse, and keep connections keep-alive.
- **Adding caches without thinking about consistency and invalidation**: add a cache but set no TTL and handle no invalidation, and users keep getting stale data. Decide "how stale can this data tolerate" first, then set the right TTL and invalidation strategy.
- **Assuming DAX can cache anything**: **DAX serves DynamoDB only**. For general caching (other databases, sessions), use ElastiCache.
- **Premature optimization, acting before measuring**: tuning by gut feel often fixes the wrong place. Measure the real bottleneck with CloudWatch/X-Ray, fix the most painful part, then measure again to verify.
- **Treating Reserved as a cold-start fix**: killing cold starts is Provisioned Concurrency's job; Reserved is only a concurrency floor/ceiling. Do not confuse them.
- **Still using `Scan` for everyday queries**: `Scan` reads the whole table and pays per item. Use a partition-key `Query`, and build a GSI for non-key queries.
:::

<Refs title="📚 Official docs & further reading">

- [AWS Lambda performance best practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [AWS Lambda Power Tuning (GitHub)](https://github.com/alexcasalboni/aws-lambda-power-tuning)
- [Configuring Lambda memory and CPU](https://docs.aws.amazon.com/lambda/latest/dg/configuration-memory.html)
- [Lambda provisioned concurrency](https://docs.aws.amazon.com/lambda/latest/dg/provisioned-concurrency.html)
- [Amazon DynamoDB Accelerator (DAX)](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DAX.html)
- [DynamoDB best practices (partition key design, avoiding Scan)](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [Amazon ElastiCache](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/WhatIs.html)
- [API Gateway caching](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-caching.html)
- [Amazon CloudFront](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Introduction.html)

</Refs>

## Next step

👉 Next: [Troubleshooting and AI-Assisted Debugging](./troubleshooting-ai-assisted.md)
