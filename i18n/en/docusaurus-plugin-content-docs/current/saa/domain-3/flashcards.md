---
sidebar_position: 8
title: Flashcards
---

# Domain 3 Flashcards

Click a card to flip it open. Covers every Domain 3 topic (compute selection, storage performance, database selection, caching, content delivery, decoupling & streaming, scalability patterns). The most efficient page for last-minute review.

## Compute Selection (EC2 / Lambda / Containers)

<Flashcards>
  <Flashcard term="EC2 instance families">C family = compute-optimized (high CPU); R/X = memory-optimized (big RAM, databases); I/D = storage-optimized (high-IOPS local disks); P/G = GPU (ML, graphics).</Flashcard>
  <Flashcard term="When to use Lambda">Short tasks, event-driven, no servers to manage, billed per millisecond. 15-minute max runtime, has cold starts.</Flashcard>
  <Flashcard term="When to use EC2">Need full OS control, long-running processes, special software/licensing, or steady predictable load.</Flashcard>
  <Flashcard term="Fargate">Serverless containers: run ECS/EKS without managing EC2 nodes yourself, billed by container usage.</Flashcard>
  <Flashcard term="Cluster Placement Group">Packs instances onto one rack for ultra-low latency and high network throughput between nodes — used for HPC.</Flashcard>
</Flashcards>

## Storage Performance (EBS / Instance Store / EFS / FSx)

<Flashcards>
  <Flashcard term="gp3 vs io2">gp3 = general-purpose SSD, IOPS and throughput set independently, best value; io2 Block Express = highest IOPS / lowest latency, for critical databases.</Flashcard>
  <Flashcard term="st1 vs sc1">st1 = throughput-optimized HDD for large sequential access (big data, logs); sc1 = cold HDD, cheapest, rarely accessed.</Flashcard>
  <Flashcard term="Instance Store">Physically attached to the host, extremely high IOPS, but wiped when the instance stops/terminates = ephemeral, never for data you must keep.</Flashcard>
  <Flashcard term="EFS">Shared NFS file system, mounted by many Linux EC2s at once, capacity scales automatically.</Flashcard>
  <Flashcard term="FSx">FSx for Windows = SMB file shares; FSx for Lustre = ultra-high-throughput scratch file system for HPC / ML.</Flashcard>
</Flashcards>

## Database Selection (RDS / Aurora / DynamoDB)

<Flashcards>
  <Flashcard term="Relational vs NoSQL">Relational = fixed schema + SQL + transactions (RDS/Aurora); NoSQL = flexible schema + massive-scale key-value lookups (DynamoDB).</Flashcard>
  <Flashcard term="Aurora">MySQL/PostgreSQL-compatible, several times the performance of RDS, storage auto-scales, 6 copies across 3 AZs.</Flashcard>
  <Flashcard term="DynamoDB">Serverless NoSQL, single-digit millisecond latency, near-unlimited scale, on-demand or provisioned capacity.</Flashcard>
  <Flashcard term="Read Replica (performance angle)">Offloads read traffic onto replicas, easing load on the primary — boosts read throughput. Different purpose from Multi-AZ (high availability).</Flashcard>
  <Flashcard term="Global low-latency database">DynamoDB Global Tables / Aurora Global Database = cross-Region replication for local reads.</Flashcard>
</Flashcards>

## Caching (ElastiCache / DAX)

<Flashcards>
  <Flashcard term="Why cache">Keep hot data in memory to skip hitting the database every time — latency drops from milliseconds to microseconds while easing backend load.</Flashcard>
  <Flashcard term="Redis vs Memcached">Redis = persistence, replication, sorted structures (leaderboards); Memcached = simple, multi-threaded, easily horizontally-scaled object cache.</Flashcard>
  <Flashcard term="DAX">DynamoDB Accelerator, a microsecond cache purpose-built for DynamoDB (do not use plain ElastiCache to cache DynamoDB).</Flashcard>
  <Flashcard term="Caching strategies">Lazy Loading = load on demand; Write-Through = update cache on every write; use TTL to control expiry.</Flashcard>
  <Flashcard term="Session store">Put sessions in ElastiCache so many EC2s stay stateless and scale freely.</Flashcard>
</Flashcards>

## Content Delivery & Global Acceleration (CloudFront / Global Accelerator)

<Flashcards>
  <Flashcard term="CloudFront">CDN: caches content at edge locations nearest the user, speeds up static and dynamic content, integrates with S3 / ALB / WAF.</Flashcard>
  <Flashcard term="Global Accelerator">Uses the AWS backbone plus anycast static IPs to speed up the connection path; great for non-HTTP TCP/UDP (gaming, VoIP), does not cache content.</Flashcard>
  <Flashcard term="CloudFront vs GA">CloudFront caches the "content"; Global Accelerator speeds up the "connection path" and gives you fixed IPs.</Flashcard>
  <Flashcard term="S3 + CloudFront">Cache S3 static sites/assets through CloudFront to speed up global access and cut S3 transfer costs.</Flashcard>
  <Flashcard term="Edge Location">Globally distributed cache points that serve content close to users to cut latency.</Flashcard>
</Flashcards>

## High-Performance Decoupling & Data Streaming (Kinesis / SQS)

<Flashcards>
  <Flashcard term="Why decouple">Use a queue/stream to absorb traffic spikes and isolate front end from back end so the back end works at its own pace without being overwhelmed.</Flashcard>
  <Flashcard term="SQS (performance angle)">Message queue; one consumer deletes a message after processing it; absorbs spikes and smooths load.</Flashcard>
  <Flashcard term="Kinesis Data Streams">Real-time streaming, multiple consumers read the same data, replayable (within retention), scale throughput with shards.</Flashcard>
  <Flashcard term="Kinesis Data Firehose">Near-real-time auto-loading of streaming data into S3 / Redshift / OpenSearch, no code needed.</Flashcard>
  <Flashcard term="Kinesis vs SQS">Need multiple consumers + replay + ordering → Kinesis; need a simple task queue, delete-after-process → SQS.</Flashcard>
</Flashcards>

## Scalable Network & Storage Patterns

<Flashcards>
  <Flashcard term="Read/write split">Writes go to the primary, reads go to Read Replicas, spreading read load out.</Flashcard>
  <Flashcard term="Sharding / partitioning">Spread data across partitions by key; DynamoDB uses a high-cardinality Partition Key to avoid hot partitions.</Flashcard>
  <Flashcard term="Hot partition">One key gets hammered and becomes a bottleneck; the fix is a well-distributed partition key.</Flashcard>
  <Flashcard term="S3 request rate">Each prefix handles thousands of requests per second; scale by parallelizing across multiple prefixes (random hash prefixes no longer needed).</Flashcard>
  <Flashcard term="S3 big files & cross-region speed">Multipart Upload uploads large files in parallel parts; Transfer Acceleration routes through edge locations to speed cross-Region uploads.</Flashcard>
</Flashcards>

---

Done reviewing? Test yourself 👉 [Domain 3 Practice Questions](./quiz.md), or revisit the [Service Comparison & Exam Cheat Sheet](./comparison.md).
