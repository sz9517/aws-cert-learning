---
sidebar_position: 3
title: DynamoDB for Developers
---

# DynamoDB for Developers: Modeling, Indexes, Capacity, and Correct Reads/Writes

> DynamoDB is one of the most heavily and finely tested services on the DVA. SAA asks "when to pick it"; DVA forces you to answer **how to design the partition key, whether to use Query or Scan, and how your code should back off and retry when capacity runs out**. This article focuses on the implementation details from a developer's point of view.

<Vocab title="📌 Terms you will meet here (readable even if you have never touched them)">

- **NoSQL**: Not the traditional "tables + fixed columns + SQL queries" database. DynamoDB is a **key-value / document** database. Each item can have different attributes, and you access data through "keys".
- **Partition Key (also called Hash Key)**: The primary key of each item. DynamoDB hashes it to decide which **partition** the data physically lives in. Good design directly affects performance.
- **Sort Key (also called Range Key)**: The second part of the primary key, paired with the partition key, so multiple items under the same partition key can be **sorted and range-queried**.
- **Capacity Units (RCU / WCU)**: Units that measure read / write throughput. In provisioned mode you decide how much to buy up front.
- **Consistency**: Whether data you just wrote can be read back as the latest value immediately.

</Vocab>

:::note[💬 Reading tip]
Whenever you see a term with a <Term desc="Like this! Hover over the dotted underline (tap on mobile) to see a plain-language explanation.">dotted underline</Term>, hover over it for a plain-language explanation. All terms are also collected in the [Glossary](/glossary).
:::

## DynamoDB in one sentence

<Term en="Amazon DynamoDB" desc="A fully managed, serverless NoSQL key-value / document database from AWS, with single-digit millisecond latency and automatic scaling.">DynamoDB</Term> is AWS's **fully managed, serverless** NoSQL database: no machines to manage, no patching, no racking to scale. Design your "keys" well and it keeps **single-digit millisecond latency at any scale**. The trade-off: unlike a relational database you cannot query by arbitrary conditions on a whim. **You must design your keys and indexes around your access patterns first.**

## Why pick DynamoDB (instead of RDS / relational)?

Many people "know DynamoDB is NoSQL" but cannot say clearly **when to pick it and when picking it will make them regret it**. Let us settle that first.

A relational database (RDS/Aurora) is a set of tables you can join together, with extremely flexible querying: you can run ad-hoc conditions, join across tables, and run complex reports. But to **survive huge scale** you have to worry about sharding, read replicas, connection pools, and scaling up yourself. DynamoDB is the opposite: it **trades away query flexibility for near-unlimited horizontal scale and steady low latency**. As long as you design your keys around access patterns, latency stays single-digit milliseconds even when traffic spikes tenfold or data grows to terabytes.

<Analogy title="🍽️ Analogy: a la carte vs a well-planned buffet">

A relational database is like an **a la carte restaurant**: the menu is flexible and you can order however you like (arbitrary queries, joins), but the kitchen jams up when it gets busy (large scale needs manual tuning). DynamoDB is like a **buffet with a carefully designed flow**: what you can take and how you take it are **planned in advance** (access patterns), so **no matter how many people show up, there is no jam** (auto scaling, steady low latency). The price is that you **cannot ask the chef to improvise a dish that is not on the layout** (no arbitrary ad-hoc queries).

</Analogy>

| Aspect | **DynamoDB (why it wins)** | **Downside / limit** |
| --- | --- | --- |
| Scalability | Auto horizontal scaling, spikes need no re-architecting | — |
| Latency | Steady single-digit ms at any scale (add DAX for microseconds) | — |
| Operations | Fully managed, serverless, no machines or sharding to run | — |
| Billing flexibility | On-Demand means zero planning, pay per use | On-Demand has a higher unit cost |
| Query flexibility | — | **No arbitrary conditions**; if no key fits, you are stuck with Scan |
| Complex queries | — | **No joins, no multi-item cross-table complex query transactions** |
| Data modeling | — | Must **understand access patterns before designing**; changing patterns often means redesigning the table |
| Item size | — | A single item is at most **400 KB**; large files go to S3 |

:::tip[💡 When picking it is exactly right]
- **Access patterns are fixed and key-based**: look up a person by `userId`, or their orders by `userId + date`. The "I know the key, fetch directly" case is where DynamoDB shines.
- **Scale will be large and traffic will spike**: shopping carts, sessions, IoT writes, leaderboards, game state. The scale that needs manual tuning on relational, it absorbs automatically.
- **You want single-digit ms, fully managed, and no DBA to hire.**
:::

:::warning[🚑 When to NOT use DynamoDB]
- **You need complex joins or multi-table reporting** (such as "join orders, customers, and products for an ops report") -> relational (RDS/Aurora), or Redshift/Athena for analytics, is the right tool.
- **Query conditions are flexible and unpredictable up front** (users can search by any combination of fields) -> DynamoDB would need a GSI per access pattern and quickly spirals out of control; put this on RDS or pair it with OpenSearch.
- **Complex multi-table ACID transactions are your main daily workload** (such as a bank core ledger with multi-table transactions) -> the relational transaction model is more natural; DynamoDB does have `TransactWriteItems` but it **consumes twice the capacity** and is not meant as the norm.
- **Data is inherently highly relational and often needs ad-hoc analysis** -> do not force it into DynamoDB.
:::

## Data model: table / item / attribute

DynamoDB's three-layer structure is simple:

- **Table**: A collection of data, equivalent to a relational "table".
- **Item**: A single record in a table, equivalent to a "row". An item is at most **400 KB**.
- **Attribute**: A field within an item, equivalent to a "column". Different items **can have different attributes** (except the primary key, which must always exist).

There are two primary key designs:

| Primary key type | Made of | Characteristics |
| --- | --- | --- |
| **Partition key only** | Partition key (PK) | Each PK value must be unique, such as looking up a single user by `userId` |
| **Composite primary key** | Partition key (PK) + Sort key (SK) | Many items can share one PK, sorted and range-queried by SK |

<Analogy title="🗄️ Analogy: picture a table as a row of filing cabinets">

- The **partition key (PK)** is like "**which drawer**". DynamoDB hashes it to decide which drawer (partition) the data goes into.
- The **sort key (SK)** is like "**how the folders inside that drawer are ordered**". Within one drawer (one PK), folders are arranged by SK in ascending order.
- So a query like "all orders of a given user (PK = userId) after 2026 (SK = date)" is extremely fast. **Open one drawer and flip forward by date.**
- But "the single largest order across the whole company" means amount is not a key at all, so you have to **go through every drawer** (that is a Scan, slow and expensive).

</Analogy>

:::tip[💡 Developer lesson one: design keys around access patterns]
A relational database lets you "store first, query however you like later". DynamoDB is the opposite: **figure out exactly how the application will query, then work backward to the primary key and indexes.** Get the key design wrong and you are stuck either redesigning the table or resorting to Scan. This is the concept the DVA loves to test.
:::

## Secondary indexes: LSI vs GSI

The primary key only lets you query by one set of attributes, but real apps often need to "query by something else". That is what a **secondary index** is for, letting you query on non-key attributes. There are two kinds:

| Comparison | **LSI (Local Secondary Index)** | **GSI (Global Secondary Index)** |
| --- | --- | --- |
| Full name | Local Secondary Index | Global Secondary Index |
| Partition key | **Same PK as the base table**, only the SK differs | Both PK and SK **can be chosen freely** |
| When it can be created | **Only at table creation**, cannot be added later | **Any time, can be added or deleted** |
| Consistency | Supports **strongly consistent reads** | **Eventually consistent only** (no strong consistency) |
| Capacity | **Shared** with the base table's RCU/WCU | **Its own, separate** RCU/WCU |
| Limit | Up to 5 per table | Up to 20 per table (default) |

One line to remember: **LSI is locked in at table creation, shares the base table's PK and capacity, and can be strongly consistent**; **GSI is flexible, can be added or removed any time, has its own capacity, and is eventually consistent only**.

:::info[🔑 Why there are two, and how to actually choose]
A secondary index is essentially "**an extra copy of the data sorted by a new key**". The benefit is querying by a non-key attribute and avoiding Scan; the cost is **extra storage and extra write cost** (write the base table once, and the index must update too). The trade-offs:

- **LSI benefits**: shares the base table's capacity, supports **strongly consistent reads**, and is simplest when the PK is the same and you only change the sort field. **Downsides**: can only be created at table creation, cannot be dropped afterward, eats the base table's capacity, and caps the **data under a single PK at 10 GB** (the item collection limit).
- **GSI benefits**: added or dropped any time, PK/SK of your choosing, **its own independently tunable capacity**, far more flexible than an LSI, and the one used most in practice. **Downsides**: **eventually consistent only**, and you must provision its own capacity (if it runs short it can in turn slow base-table writes, see the pitfalls below).

In practice **most cases use a GSI**; pick an LSI only when "the query PK is identical to the base table, you just want a different sort field, and you need strong consistency".
:::

:::tip[💡 How to choose on the exam]
- The question says "**the query field has the same PK as the base table, just a different sort field**" or "**needs strongly consistent reads**" -> **LSI**.
- The question says "**want to query by a completely different attribute as the PK**", "**the table is already created and I only now need an index**", or "**the index needs independently tunable capacity**" -> **GSI**.
- Any mention of "**adding an index after the table is created**" -> it must be a **GSI** (an LSI cannot be added later).
:::

## Capacity modes: on-demand vs provisioned

DynamoDB has two billing / capacity modes, and the DVA loves to test how to choose:

- **Provisioned**: You **specify up front** how many reads / writes per second you need, measured in **RCU / WCU**, and can pair it with **Auto Scaling** to adjust up and down with traffic. Best for **stable, predictable** traffic, with a lower unit cost.
- **On-Demand**: **No capacity estimation needed**. Pay for what you use, and it absorbs sudden spikes. Best for **bursty, hard-to-predict traffic, or a brand new launch with unknown volume**. Higher unit cost but no planning.

:::info[🔑 Why there are two, and where the trade-off is]
The core trade-off is "**save money**" versus "**save worry and avoid throttling**":

- **Provisioned benefits**: when traffic is stable the **unit cost is clearly lower**, and with Auto Scaling it tracks traffic up and down. **Downsides**: guess the capacity wrong and you get **throttled** (bought too little) or **waste money** (bought too much); Auto Scaling also reacts with a delay, so a millisecond-level burst may outrun it and still get blocked.
- **On-Demand benefits**: **zero capacity planning, absorbs instant spikes, and never throttles you for a bad estimate**, which is safest at launch, when traffic is unpredictable, or when spikes are extreme. **Downsides**: at the same traffic the **unit cost is higher**, so for steady long-term traffic it means overpaying.

**How to choose**: at launch with unknown volume, or when traffic is a roller coaster, start on On-Demand to kill the risk; after running long enough to learn the traffic, if it is stable, switch to Provisioned + Auto Scaling to save cost. The two modes are interchangeable (you can switch once every 24 hours).
:::

### How RCU / WCU are calculated (tested)

- **WCU (Write Capacity Unit)**: 1 WCU = writing **one item of 1 KB per second**. Writing a 2 KB item = 2 WCU.
- **RCU (Read Capacity Unit)**: 1 RCU = **one strongly consistent read of 4 KB per second**; with an **eventually consistent read**, 1 RCU reads **two items of 4 KB** (half the cost).

<Scenario title="Calculation drill: reading 80 items per second, 6 KB each, strongly consistent. How many RCU?">

Each 6 KB item **rounds up** to a multiple of 4 KB -> 8 KB = two 4 KB blocks = 2 RCU per item (strongly consistent). 80 items per second -> 80 x 2 = **160 RCU**. Switch to eventually consistent reads and RCU halves -> **80 RCU**. This kind of "round KB up + strongly consistent is twice eventually consistent" calculation shows up often on the DVA.

</Scenario>

:::tip[💡 Pick the mode in one second]
- "**Unpredictable traffic / sudden spikes / brand new launch with unknown volume / avoid capacity planning**" -> **On-Demand**.
- "**Stable predictable traffic / want the lowest unit cost**" -> **Provisioned + Auto Scaling**.
:::

## Read consistency: eventually vs strongly consistent

DynamoDB replicates your data across multiple facilities. Reading right after a write gives you two choices:

- **Eventually consistent read (default)**: May read a **slightly stale** replica (usually synced within a second). **Half the cost, lowest latency.**
- **Strongly consistent read**: Guarantees you read the **most recent write**. Costs twice as much as eventually consistent (1 RCU reads only 4 KB), latency is slightly higher, it **cannot cross Regions**, and **GSIs do not support it**.

:::info[🔑 An easy-to-confuse difference]
The default is **eventually consistent**. For strong consistency you must explicitly set `ConsistentRead=true` on the call. If a question says "**needs to read the correct value immediately after writing**" (such as verifying a balance right after a write) -> use a **strongly consistent read**; if it says "**can tolerate briefly stale data and wants to save cost**" -> eventually consistent is fine. Remember a **GSI is always eventually consistent only**.
:::

:::warning[🚑 Strong consistency is not free, know the cost first]
Reflexively turning on `ConsistentRead=true` whenever you see "consistent" is a common over-engineering. It costs you three things: **(1) twice the price** (1 RCU reads only 4 KB, while eventually consistent reads 8 KB per RCU); **(2) slightly higher latency** (it must read the leader replica); **(3) more limits** (cannot go through a GSI, and gets no DAX cache speedup). Many reads actually **tolerate data up to a second stale** (product lists, posts, leaderboards), so eventually consistent saves half the cost and latency. **Only "the write must be readable as the latest value immediately" (balances, inventory reconciliation) is worth paying the strong-consistency cost.**
:::

## Query vs Scan: use Query whenever possible

This is the performance question the DVA tests most often.

- **Query**: **Must specify the partition key** and scans only the items matching that PK (optionally with SK range / sort). It reads only the partition you want, so it is **fast and RCU-efficient**.
- **Scan**: **Reads every single item in the whole table** and then filters. The bigger the table, the slower and more expensive, and even with a `FilterExpression` the filtering happens **after reading**, so **RCU is charged for the entire table**. It saves you nothing.

<Analogy title="📚 Analogy: Query reads the table of contents, Scan reads the whole book cover to cover">

Say you want "the content of Chapter 5" in a thick book. **Query** is like flipping to the table of contents and jumping straight to Chapter 5 (specify the PK); **Scan** is like reading from page one, word by word, deciding "is this part Chapter 5" as you go. The thicker the book, the bigger a disaster Scan becomes.

</Analogy>

:::info[🔑 Why you should almost never use Scan as an everyday query]
Scan's fatal flaw is that its cost and time **grow with the whole table**: today the table is small and you feel nothing, but once it grows to millions of items that same Scan eats all the RCU, throttles the whole table, and drags down other normal requests too. Worse, `FilterExpression` is a **fake saving**: it filters **after reading the entire table**, so even though it returns only 10 items, RCU is charged for the **whole table scanned**. The answer is always: **make the query you need use Query** by designing the primary key to cover it, or by **building a GSI** that turns the queried attribute into a Query-able key. Use Scan only when you truly must read the whole table (one-off export, batch recompute), paired with Parallel Scan to split the work.
:::

:::tip[💡 Exam focus]
- When a question shows "**queries are slow / RCU is blowing up / cost is too high**" and the code uses a **Scan** -> the answer is usually "**switch to Query**" or "**create a GSI so it can use Query**".
- A `FilterExpression` does **not** save RCU (filtering happens after the read); what actually saves is the right **KeyConditionExpression (Query)**.
- When you truly must Scan, use a **Parallel Scan** to split and speed it up.
:::

## Conditional writes, atomic counters, optimistic locking

These three are DynamoDB's core mechanisms for handling "concurrent writes", and the DVA always tests them.

### Conditional writes (Condition Expressions)

Attach a condition to a write so it **only writes if the condition holds**; otherwise it returns `ConditionalCheckFailedException`. Use it to prevent overwrites and duplicate creation.

```bash
# Create only if this userId does not yet exist (prevents overwriting an existing user)
$ aws dynamodb put-item \
    --table-name Users \
    --item '{"userId": {"S": "u-123"}, "name": {"S": "Alice"}}' \
    --condition-expression "attribute_not_exists(userId)"
```

### Atomic counter

Use `UpdateItem` with `ADD` / `SET x = x + :n` to do an **atomic increment/decrement** on a numeric attribute, so concurrent requests do not overwrite each other. Good for counts like "article view count" that tolerate occasional small drift and do not need to be perfectly exact.

```bash
# Increment views by 1, atomic, concurrency-safe
$ aws dynamodb update-item \
    --table-name Articles \
    --key '{"articleId": {"S": "a-1"}}' \
    --update-expression "SET views = views + :inc" \
    --expression-attribute-values '{":inc": {"N": "1"}}'
```

### Optimistic locking

Store a "version number" attribute on each item. On update, use a **conditional write** to check "is the version still the one I read?"; if yes, write and bump the version by 1. If someone else changed it in between (version differs), the condition fails, so you reread and retry. The SDK's `DynamoDBMapper` / `@DynamoDbVersionAttribute` can do this for you automatically. Good for scenarios where "no update may be silently overwritten" (such as inventory or balances).

:::info[🔑 Atomic counter vs optimistic locking]
An **atomic counter** tolerates occasional imprecision and is about high concurrency without blocking (view counts); **optimistic locking** demands that **no update is ever lost**, preferring to fail and retry (inventory deduction, account balance). Picking the wrong one loses marks.
:::

## DynamoDB Streams and DAX

### DynamoDB Streams

<Term en="DynamoDB Streams" desc="A time-ordered stream that records item-level changes to a table, retained for 24 hours, commonly used to trigger Lambda.">Streams</Term> records every "insert / modify / delete" on a table **in time order**, retained for **24 hours**. The most common use is to **trigger Lambda** for downstream processing, such as auto-syncing writes to OpenSearch, sending notifications, or updating an aggregate table. You can configure what data the stream carries (`StreamViewType`: keys only, new image, old image, or both new and old).

### DAX (DynamoDB Accelerator)

<Term en="DynamoDB Accelerator" desc="An in-memory cache cluster built specifically for DynamoDB, taking read latency from milliseconds to microseconds, with a near-compatible API that needs almost no code change.">DAX</Term> is DynamoDB's dedicated **in-memory cache**, taking reads from single-digit **milliseconds** down to the **microsecond** level. Its API is nearly compatible with DynamoDB, so **your code barely changes**. Just point the connection at the DAX cluster.

:::tip[💡 When to use DAX and when not to]
- Good for: **read-heavy, write-light, repeatedly reading the same data, needing microsecond latency** (such as hot products or leaderboard reads).
- Not good for: **write-intensive** workloads (DAX is a read cache; writes still go straight to DynamoDB), or **strongly consistent reads** (DAX serves eventually consistent reads).
- A question showing **DynamoDB + reads need to be faster / microseconds** -> pick **DAX**, not regular ElastiCache.
:::

## Pagination, batch operations, and transactions

### Pagination (LastEvaluatedKey)

A single Query / Scan returns at most **1 MB** of data. If the result exceeds that, the response carries a **`LastEvaluatedKey`**; pass it as the **`ExclusiveStartKey`** of the next request to get the next page. **Only the absence of `LastEvaluatedKey` means you have read everything.**

```bash
# Page two: pass the previous page LastEvaluatedKey back as ExclusiveStartKey
$ aws dynamodb query \
    --table-name Orders \
    --key-condition-expression "userId = :u" \
    --expression-attribute-values '{":u": {"S": "u-123"}}' \
    --exclusive-start-key '{"userId": {"S": "u-123"}, "orderDate": {"S": "2026-06-01"}}'
```

:::warning[🚑 The most common beginner miss]
Seeing fewer rows than expected and assuming "that is all the data" when in fact you hit the **1 MB single-call limit** and never paged with `LastEvaluatedKey`. Production code must **loop until there is no `LastEvaluatedKey` left**.
:::

### Batch operations (BatchGetItem / BatchWriteItem)

- **`BatchGetItem`**: Read many items at once (up to 100 items / 16 MB).
- **`BatchWriteItem`**: Write / delete many items at once (up to 25 items / 16 MB), **no updates and no conditions**.

Batch operations are **not transactions**. Some items can fail; the failed ones land in the response's **`UnprocessedItems`**, and **you must back off and resend** those unprocessed items yourself.

### Transactions

`TransactWriteItems` / `TransactGetItems` provide **ACID**: a group of operations **all succeed or all roll back**, guaranteed consistent across multiple items or even multiple tables. Good for "a transfer where A is debited and B is credited must both succeed together". The cost is that it **consumes twice the capacity units**, so do not overuse it.

## Error handling and backoff/retry (a DVA must-know)

When your request exceeds provisioned capacity (or hits too hard in an instant), DynamoDB returns a **`ProvisionedThroughputExceededException`** (HTTP 400, a retryable throttling error). The correct response is **not to retry frantically at once** but to use **exponential backoff plus jitter**:

- **Exponential backoff**: Double the wait each retry (such as 50ms -> 100ms -> 200ms -> 400ms...) to give the service room to breathe.
- **Jitter**: Add a bit of **randomness** on top of the wait to avoid a crowd of clients "backing off together and retrying together" and causing a second wave of collisions.

The good news: the **AWS SDK has exponential backoff and retry built in by default**, so in most cases you do not write it yourself. The exam point is to **know that throttling calls for backoff/retry, not infinite hammering**, and to understand why jitter is added.

:::warning[🚑 Common mistakes]
- **Resending in a tight while loop the moment you get throttled**: it only makes things worse; the right way is exponential backoff + jitter. Without exponential backoff a crowd of clients will "collide together, back off together, and collide again together", so the throttling never clears.
- **Assuming batch operations auto-retry everything**: `BatchWriteItem`'s `UnprocessedItems` must be **backed off and resent by you**.
- **Using Scan as an everyday query**: once the table is large it throttles and costs explode; switch to Query or build a GSI.
- **Using Scan + `FilterExpression` thinking it saves RCU**: filtering happens **after reading the whole table**, so RCU is charged for the entire table scanned, saving nothing. What actually saves is a Query's `KeyConditionExpression`.
- **Hot partition**: picking a low-cardinality value as the PK (such as everyone using the same `status`, or all writes using the same day's date as the PK) piles all traffic onto one partition and it still throttles. The PK should be a **high-cardinality, evenly distributed** value; when concentration is unavoidable, use **write sharding** (append a random suffix `-0` to `-9` to the PK) to spread the hot spot.
- **A GSI running short on capacity dragging down the base table**: a GSI has its own capacity, and if its WCU is bought too low in Provisioned mode, **base-table writes get stuck behind the GSI** (writing the base table must also write the GSI, and if the GSI cannot accept the write it back-pressures the base table). Provision enough GSI capacity, or put it on On-Demand together with the base table.
- **Forgetting the 400 KB item limit**: store large files (images, attachments) in S3 and keep only the S3 link in DynamoDB.
:::

<Cost>

DynamoDB itself has a **perpetual free tier** (25 GB of storage per month, 25 WCU + 25 RCU of provisioned capacity), so small practice projects are nearly free. Watch out for: **On-Demand has a higher unit cost than Provisioned**, so for stable traffic Provisioned + Auto Scaling is cheaper; a **GSI has its own capacity**, so building too many bills for each separately; and **DAX and any Lambda triggered by Streams** are billed separately. Delete practice tables and GSIs when done so provisioned capacity does not keep eating your quota.

</Cost>

<Refs title="📚 Official docs & further reading">

- [Amazon DynamoDB Developer Guide (overview)](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html)
- [Core components: tables, items, and attributes](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.CoreComponents.html)
- [Secondary indexes (LSI and GSI)](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/SecondaryIndexes.html)
- [Read/write capacity modes (On-Demand and Provisioned)](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.ReadWriteCapacityMode.html)
- [Error handling and exponential backoff/retry](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Programming.Errors.html)

</Refs>

## Next step

👉 Next: [Accessing S3 and Data with the SDK](./data-storage-sdk.md)
