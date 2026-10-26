---
sidebar_position: 4
title: "Caching: ElastiCache & DAX"
---

# Caching: cut read latency from milliseconds to microseconds

> This page shows how "adding a cache layer" offloads your database and pushes response times to the extreme. Choosing between ElastiCache (Redis / Memcached) and DAX is a favorite Domain 3 exam topic.

<Vocab title="📌 Jargon you'll see on this page (fine even if you've never touched AWS)">

- **Cache**: putting "**frequently requested data**" somewhere super fast (usually memory) so the next request just grabs it, instead of hitting a slow disk or database every time.
- **In-Memory**: data kept directly in RAM — reads are **orders of magnitude faster** than disk, but data can vanish on restart (unless you specifically persist it).
- **Latency**: the wait time between "sending a request" and "getting a response". Smaller is better.
- **Session**: the state a server remembers for a user after they log in (e.g. shopping cart, login identity).

</Vocab>

:::note[💬 Reading tip]
Whenever you see a term with a <Term desc="Like this! Hover over any dotted term (tap on mobile) and a plain explanation pops up.">dotted underline</Term>, hover over it for a plain-language explanation. All terms are also collected in the [Glossary & Services](../../glossary.md).
:::

## Why do you need it? A story that slows down first

Say your homepage shows a "top products leaderboard". Every visitor triggers a complex query against the **database**. Fine on a quiet day — but at peak, thousands of people hit the homepage at once, the same query runs tens of thousands of times, the database is overwhelmed, and the whole site slows down.

The problem: **everyone sees the same leaderboard, and there's no need to recompute it every time**. The fix: put a **cache** layer in front. The first visitor computes it once and stores it in memory; everyone after reads straight from memory, back in **microseconds**, and the database never has to work again. That's the core value of caching — **keep hot data in memory, skip hitting the database every time, and cut both latency and load**.

### Why is an extra layer worth it? The point and the benefits

Beginners often ask: "The database can already answer the query — why add another layer to maintain?" In plain terms, here's what caching actually solves:

- **Lower latency (faster)**: memory reads are **microsecond-level**, while disk/database queries are often **milliseconds or more** — a gap of up to hundreds of times. For users, that's "page loads instantly" vs "spinner".
- **Less backend load (saves resources)**: if the same hot query is hit millions of times a day, most can be answered straight from the cache, instantly freeing up the database's CPU and connections — **no need to upgrade to a pricier database just to survive peaks**.
- **Better scalability (survives spikes)**: during promotions, flash sales, or traffic bursts, the cache acts as a buffer, absorbing the surge of reads in front of the database so the whole site doesn't get dragged down.
- **Indirect cost savings**: the more queries you deflect, the smaller the database you need; for a pay-per-read service like DynamoDB, a cache hit is literally a read you don't pay for.

:::info[🔑 When is caching most worth it?]
Caching fits best when data is **read-heavy, write-light, and the same data gets read repeatedly** (product pages, config, leaderboards, sessions). Conversely, if each item is **read only once** (a one-off report) or **changes constantly** (a real-time counter ticking every second), hit rates are low and you fight consistency forever — adding a cache can cost more than it saves. Ask "will this data be read repeatedly?" before deciding to cache it.
:::

## Caching in one sentence

A **cache** keeps frequently used data in memory so repeated reads complete in **microseconds** without hitting the slower database each time — **lowering latency and offloading the backend**. AWS offers two main managed caches: <Term en="Amazon ElastiCache" desc="AWS-managed in-memory cache service supporting both the Redis and Memcached engines.">ElastiCache</Term> and <Term en="DynamoDB Accelerator" desc="An in-memory cache built specifically for DynamoDB, cutting read latency from milliseconds to microseconds.">DAX</Term>, which is dedicated to DynamoDB.

<Analogy title="🍜 Analogy: think of a cache as the ramen shop's 'soup of the day'">

- Boiling fresh broth for every bowl (**hitting the database every time**) is slow and exhausting — customers wait forever.
- So the owner boils one big pot early and keeps it warm (**cache in memory**); each order is just a quick ladle — **served in seconds**.
- Broth sits too long and goes off, so there's a "**swap the pot every 2 hours**" rule (that's the **TTL / expiry**), ensuring what customers get isn't too stale.
- Occasionally someone orders off-menu (**cold data not in the cache**), so the kitchen cooks it once and also drops it in the warm pot for next time (that's **Lazy Loading**).

</Analogy>

## ElastiCache: Redis or Memcached? (the most important table)

<Term en="Amazon ElastiCache" desc="AWS-managed in-memory cache service that handles the cluster setup, patching, and backups for you.">ElastiCache</Term> manages the setup, patching, and monitoring of your cache cluster. It offers two "engines", and the exam loves testing how to pick:

| Comparison | **Redis** | **Memcached** |
| --- | --- | --- |
| Data structures | Rich (strings, lists, sets, sorted sets, hashes…) | Simple (key-value string objects only) |
| Persistence / backup | ✅ Yes (snapshots; survives restart) | ❌ No (data gone on restart) |
| Replication / HA | ✅ Primary-replica replication, automatic failover | ❌ No replication — if it dies, it's gone |
| Multi-threaded | Mostly single-threaded | ✅ Multi-threaded, great raw CPU throughput |
| Scaling | Read replicas; sharded (cluster) mode | Add nodes horizontally to partition data |
| Typical use | Leaderboards, pub/sub, sessions needing persistence | Simple object cache that scales horizontally |

One line to remember: <Term en="Remote Dictionary Server" desc="A feature-rich in-memory data store supporting persistence, replication, and sorted sets.">Redis</Term> is "**fully featured, almost half a database**"; <Term en="Memcached" desc="A simple, multi-threaded in-memory object cache good for horizontal scaling.">Memcached</Term> is "**a simple, fast, easily horizontally-scaled pure cache**". If the question mentions persistence, replication, leaderboards, or advanced structures, the answer is almost always Redis.

#### How to choose? Pros, cons, and when each fits

- **Why pick Redis (pros)**: persistence and snapshots (survives restart), primary-replica replication with automatic failover (high availability), and rich data structures (sorted sets for leaderboards, pub/sub for real-time notifications). **Cons**: mostly single-threaded, so on raw "keys per second on a single node" it may not beat multi-threaded Memcached; more features also means slightly more to configure and operate.
- **Why pick Memcached (pros)**: multi-threaded, strong raw throughput on multi-core machines; dead-simple architecture where adding nodes to partition data is intuitive. **Cons**: no persistence (everything gone on restart), no replication or failover (lose a node, lose its data), and only plain key-value (can't do leaderboard-style advanced structures).

:::info[🔑 One-line decision: when in doubt, pick Redis]
The rule of thumb for both practice and the exam — **unless you specifically need "multi-threaded raw throughput + a simple object cache + can tolerate data loss", choose Memcached; otherwise pick Redis almost every time**. Redis is a superset of Memcached's features, so choosing it is rarely wrong; and the moment a question touches persistence, replication, high availability, leaderboards, or sessions that must survive, Memcached is out.
:::

:::tip[💡 Exam key point]
Match the keyword straight to the answer — nearly free points:
- Question mentions **replication / persistence / advanced data structures (sorted sets) / leaderboards** → **ElastiCache for Redis**
- Question mentions **a simple object cache that must scale horizontally** → **Memcached**
- Question mentions **accelerating DynamoDB reads to microseconds** → **DAX** (do NOT pick plain ElastiCache here!)
- Question mentions **heavy database read load, the same query repeated over and over** → **add a cache layer** (ElastiCache) in front
- Question mentions **moving user sessions off a single EC2 so they're shared** → use **ElastiCache to store sessions**
:::

## Common caching strategies

A cache isn't "set and forget" — you must decide "**when data enters the cache, and when it expires**". The three most tested:

- **Lazy Loading**: fetch from the database only when something is requested, then stash the result in the cache. Pro: you only cache data people actually want, wasting no memory. Con: the first request is always slow (a cache miss).
- **Write-Through**: every time you write to the database, you **synchronously** update the cache too. Pro: the cache is always fresh. Con: it fills the cache even with data nobody reads.
- **TTL (Time To Live)**: give each cached item an "**expiry date**" so it's auto-evicted when time's up, forcing a fresh fetch next time. Often combined with the two above to avoid the cache drifting out of sync with the database (stale data).

<div className="flow">
  <div className="flow-node">App wants to read data</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Ask the cache first: got it?</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Hit → returned in microseconds</div>
  <div className="flow-arrow">/</div>
  <div className="flow-node">Miss → hit the database, then write back to cache</div>
</div>

*Diagram: on a cache hit, data returns straight from memory; only on a miss does it fall back to the database (lazy loading) and write the result back for next time.*

#### Lazy Loading vs Write-Through: how to trade off?

These two often appear together as "which should I use?" — really they're a complementary set of trade-offs:

| Comparison | **Lazy Loading** | **Write-Through** |
| --- | --- | --- |
| When the cache is written | On a **read miss** (backfilled) | **On every database write** (synchronously) |
| What ends up in the cache | Only data that was actually read | Even data nobody reads — may waste space |
| First read | Always slow (cache miss) | Already written, so it's there |
| Freshness | May read stale data (TTL to the rescue) | Cache is fresh immediately after a write |
| Write latency | Fast write (DB only) | Slower write (DB + cache together) |

Plain trade-off: **lazy loading saves memory but the first read is slow and may be stale**; **write-through is always fresh but wastes space and slows writes**. In practice the most common pattern is **"lazy loading + TTL" as the base, then add write-through for a few critical, heavily-read items** — they aren't either/or; you mix them based on the data's characteristics.

:::warning[🚑 Common pitfall: forget the TTL and the cache drifts out of sync]
No matter which strategy you use, if the underlying data changes, the cache risks serving **stale data**. Lazy loading without a TTL keeps returning old values; and even write-through goes stale if someone bypasses the app and edits the database directly. **Always set a TTL on cached items**, or proactively **invalidate the matching cache key** when the data updates — otherwise users keep seeing an old screen.
:::

## DAX: microsecond caching dedicated to DynamoDB

If you're using <Term en="Amazon DynamoDB" desc="AWS's fully managed NoSQL database with single-digit millisecond latency.">DynamoDB</Term> and your read load is heavy — and you want to go one gear faster — the answer is **not** plain ElastiCache, but <Term en="DynamoDB Accelerator" desc="An in-memory cache built for DynamoDB that cuts read latency to microseconds with almost no code changes.">DAX</Term>.

DAX is an in-memory cache AWS built specifically for DynamoDB. Its hallmark: **it pushes millisecond-level reads down to microseconds**, and its API is nearly identical to DynamoDB's — so your code **barely changes**; you just point the client at DAX, and it handles cache hits and fall-through automatically. This differs from ElastiCache, where you must write the "check cache first, fall back to the database" logic yourself.

| Comparison | **DAX** | **Plain ElastiCache** |
| --- | --- | --- |
| Built for | DynamoDB only | Any data source |
| Code changes | Almost none (API-compatible) | You write the cache logic |
| Latency | Microseconds | Microseconds–milliseconds |
| Best for | Read-heavy DynamoDB that needs more speed | General cache, sessions, leaderboards |

:::tip[💡 One-second decision]
If the question mentions **DynamoDB** AND **faster reads / microseconds / caching** → pick **DAX** directly. Only pick ElastiCache when you see "general cache", "sessions", or "Redis features".
:::

#### DAX vs ElastiCache: pros, cons, and when NOT to use

- **DAX pros**: API-compatible with DynamoDB, so your code **barely changes**; cache hits and fall-through are handled automatically, saving you from hand-writing cache logic; reads drop to microseconds. **Cons / limits**: **it only works with DynamoDB** (useless for any other database); it does **not** accelerate **writes** (DAX speeds up reads), and watch its consistency model — DAX is an **eventually consistent** cache layer, so a **strongly consistent read** right after a write **bypasses DAX and hits DynamoDB directly**, getting no microsecond boost.
- **ElastiCache pros**: can cache **any data source** (RDS, self-hosted DBs, computed results, sessions…), and with Redis you also get persistence, replication, and advanced structures. **Cons**: you must **write the cache logic yourself** (check cache first, fall back to the DB, remember to backfill and invalidate), which costs more to develop and maintain.

:::info[🔑 When should you NOT use DAX?]
- Your data is **not in DynamoDB** (e.g. the source is RDS or Aurora) → DAX does not apply; use ElastiCache.
- Your workload is **write-heavy** or **needs strongly consistent real-time reads** → DAX will not help (it accelerates eventually consistent reads); do not force it.
- What you want to cache is **sessions or general cross-service data** → that's ElastiCache (especially Redis) territory, not DAX.
Conversely, **data already in DynamoDB, read-heavy, and you want minimal code** → DAX is almost the least-effort answer.
:::

## Real-world application: it's not just for the exam

<Scenario title="Real scenario: users get logged out the moment they switch machines">

Your site runs several EC2s behind a load balancer. But users complain: they log in fine, refresh, and are asked to log in again. Digging in, you find — **sessions are stored in each EC2's own memory**, and when the load balancer routes the next request to a different instance, that instance has no idea who the user is. The fix: store sessions **centrally in ElastiCache**, so every EC2 reads from the same place and recognizes you no matter which instance handles the request. Let's do it once below.

</Scenario>

### 🛠️ Hands-on: store sessions in ElastiCache for Redis

1. In the console, search `ElastiCache` → **Create cluster** → engine **Redis**.
2. Pick the smallest node type (e.g. `cache.t3.micro`), deployed in the same **VPC and subnets** as your EC2s.
3. **Security Group**: allow traffic from the "EC2's SG" to Redis port `6379`, or nothing can connect.
4. Once created, copy Redis's **endpoint** address into your app's session config (PHP, Express, Django all have matching packages).
5. Test: log in, then deliberately stop one EC2 so the load balancer routes you to another — **you're still logged in**, because the session lives in the shared Redis.

```bash
# Check the ElastiCache cluster state; confirm the endpoint and status are available
$ aws elasticache describe-cache-clusters \
    --show-cache-node-info
```

**Expected result**: the JSON output shows `"CacheClusterStatus": "available"`, plus an `Endpoint` (with `Address` and `Port` 6379) under each node in `CacheNodes`. Drop that `Address` into your app. If the status is still `creating`, wait a minute or two and re-run; if no cluster shows up, double-check your `--region`.

```bash
# (optional) Verify the security group allows 6379: from the EC2, test with redis-cli
$ redis-cli -h <your-redis-endpoint> -p 6379 ping
```

**Expected result**: a working connection replies `PONG`. If it hangs or times out, **nine times out of ten the Security Group hasn't opened 6379** (also the first item in the pitfalls below) — go back and confirm Redis's SG allows 6379 from the EC2's SG.

<Cost>

Both ElastiCache and DAX are **billed per node / hour** with no free allowance — the meter runs as long as they're up. When you're done, remember to **delete the cluster**. To save money, pick the smallest node type (e.g. `cache.t3.micro`, `cache.t4g.micro`) and delete it right after.

</Cost>

:::warning[🚑 Common real-world mistakes]
- **Using Memcached for sessions that need persistence**: Memcached loses everything on restart, logging all users out at once; use Redis when you need persistence/replication.
- **Misusing plain ElastiCache for DynamoDB**: to accelerate DynamoDB reads, use DAX and skip writing a pile of cache logic yourself.
- **Forgetting to set a TTL**: cached data never expires, so users keep seeing stale data.
- **Security Group not opening the cache port**: without Redis `6379` or Memcached `11211` open, the app can never connect.
- **Treating the cache as the only source of truth**: a cache is an "acceleration layer" — you still need a reliable database underneath, so data doesn't vanish when a cache node dies.
- **Neglecting cache consistency (stale data)**: updating the database without **invalidating** the matching cache key means users keep reading the old value. On update, either delete the old cache entry or let a TTL force it to expire.
- **Cache penetration**: a flood of queries for **keys that don't exist at all** (e.g. a guess-the-ID attack) never hits the cache, so every one falls straight through to the database — the cache might as well not be there. Fixes: **cache the "not found" result too, with a short TTL** (cache the empty value), or validate parameters / whitelist at the entry point to block garbage requests.
- **Misusing DAX strongly consistent reads**: a strongly consistent read against DAX **bypasses the cache and hits DynamoDB directly** — no microsecond boost, and it still consumes read capacity; for the microsecond speedup, use eventually consistent reads.
- **Not spreading out expiries (cache avalanche)**: if a large batch of keys all expire at the same instant, every request stampedes the database at once. Add a little random jitter to TTLs so they don't all expire together.
:::

<Refs title="📚 Official docs & further reading">

- [AWS Docs: Amazon ElastiCache overview](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/WhatIs.html)
- [ElastiCache: comparing Redis and Memcached](https://docs.aws.amazon.com/AmazonElastiCache/latest/mem-ug/SelectEngine.html)
- [Caching strategies (Lazy Loading, Write-Through, TTL)](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/Strategies.html)
- [Amazon DynamoDB Accelerator (DAX)](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DAX.html)
- [Managing sessions with ElastiCache](https://docs.aws.amazon.com/AmazonElastiCache/latest/mem-ug/elasticache-use-cases.html)

</Refs>

## Next

- ⚡ Quick review: [Domain 3 Flashcards](./flashcards.md)
- ✍️ Test yourself: [Domain 3 Practice Questions](./quiz.md)
- 📖 Next page: [Content Delivery & Global Acceleration](./content-delivery.md)
