---
sidebar_position: 8
title: Key Points / Flashcards
---

# Domain 2 Key Points / Flashcards

Tap a card to flip it open. Covers every Domain 2 topic (high availability, load balancing, auto scaling, decoupling, DNS routing, backup & disaster recovery, database high availability) — the most efficient page for last-minute review.

## High Availability & Multi-AZ

<Flashcards>
  <Flashcard term="Region vs AZ">Region = a geographic area (e.g. Tokyo); AZ = isolated data-center clusters within a Region. HA = spreading resources across multiple AZs.</Flashcard>
  <Flashcard term="SPOF">Single Point Of Failure: any one-of-a-kind component that takes everything down when it fails. Eliminating SPOFs is step one of HA.</Flashcard>
  <Flashcard term="HA vs Fault Tolerance">HA = recovers quickly after failure; Fault Tolerance = no interruption at all during failure. Fault tolerance costs more.</Flashcard>
  <Flashcard term="Horizontal vs Vertical">Horizontal = add more instances (can span AZs, more elastic — favored on the exam); Vertical = bigger instance (has a ceiling, needs a restart).</Flashcard>
  <Flashcard term="Don't hard-code one AZ">Design to deploy across AZs so one AZ outage doesn't take down the whole site.</Flashcard>
</Flashcards>

## Elastic Load Balancing (ELB)

<Flashcards>
  <Flashcard term="ALB">Layer 7 (HTTP/HTTPS), supports path/host routing — ideal for websites and microservices.</Flashcard>
  <Flashcard term="NLB">Layer 4 (TCP/UDP), ultra-high performance and ultra-low latency, can expose a static/Elastic fixed IP.</Flashcard>
  <Flashcard term="GWLB">For chaining third-party network appliances (firewalls, IDS/IPS).</Flashcard>
  <Flashcard term="Health checks">ELB only sends traffic to healthy targets and automatically removes unhealthy ones.</Flashcard>
  <Flashcard term="ELB + cross-AZ">ELB spreads traffic across targets in multiple AZs — a key piece of HA.</Flashcard>
</Flashcards>

## Auto Scaling

<Flashcards>
  <Flashcard term="ASG three sizes">Min (floor), desired (keep now), max (ceiling).</Flashcard>
  <Flashcard term="Target tracking">Most common and simplest: set "keep CPU at 50%" and it scales in/out automatically.</Flashcard>
  <Flashcard term="Step vs Scheduled">Step = scale by metric thresholds; Scheduled = pre-scale for known peaks (e.g. 9am daily).</Flashcard>
  <Flashcard term="ASG + health checks">Detects unhealthy instances, terminates them, and launches fresh replacements.</Flashcard>
  <Flashcard term="Across AZs">An ASG spreads instances evenly across multiple AZs for HA.</Flashcard>
</Flashcards>

## Decoupling (SQS / SNS)

<Flashcards>
  <Flashcard term="SQS">A message "queue"; consumers actively "pull". Used to buffer, smooth traffic spikes, and decouple.</Flashcard>
  <Flashcard term="SNS">Publish/subscribe; one message is "pushed" to many subscribers (fan-out).</Flashcard>
  <Flashcard term="Standard vs FIFO">Standard = high throughput, may duplicate/reorder; FIFO = ordered, no duplicates, lower throughput.</Flashcard>
  <Flashcard term="Visibility Timeout">How long a message stays hidden after being picked up; set it too short and it gets processed twice.</Flashcard>
  <Flashcard term="DLQ">Dead-Letter Queue: messages that fail repeatedly land here so they don't clog the main queue.</Flashcard>
  <Flashcard term="SNS + SQS fan-out">One SNS publish lands in several SQS queues at once, each system consuming independently.</Flashcard>
</Flashcards>

## DNS & Traffic Routing (Route 53)

<Flashcards>
  <Flashcard term="Simple routing">One record to one set of IPs, no health check. The most basic.</Flashcard>
  <Flashcard term="Weighted routing">Split traffic by ratio — blue/green, canary, or A/B testing.</Flashcard>
  <Flashcard term="Latency routing">Sends users to the lowest-latency Region — for speed.</Flashcard>
  <Flashcard term="Failover routing">If the primary's health check fails, switch automatically to the standby (active/passive HA).</Flashcard>
  <Flashcard term="Alias vs CNAME">The zone apex (e.g. example.com) must use Alias, not CNAME; Alias points to AWS resources and is free.</Flashcard>
</Flashcards>

## Backup & Disaster Recovery (DR)

<Flashcards>
  <Flashcard term="RPO">How much "data" you can afford to lose (a length of time). "Data loss amount" = RPO.</Flashcard>
  <Flashcard term="RTO">How long you can afford to be "down". "Downtime" = RTO.</Flashcard>
  <Flashcard term="Four DR strategies">Cost/speed low to high: Backup &amp; Restore → Pilot Light → Warm Standby → Multi-Site.</Flashcard>
  <Flashcard term="Lowest cost pick">Backup &amp; Restore (slowest recovery but cheapest).</Flashcard>
  <Flashcard term="Near-zero downtime pick">Multi-Site Active/Active (fastest but most expensive).</Flashcard>
  <Flashcard term="EBS snapshots">Incremental backups stored in S3; can be copied cross-Region for off-site DR.</Flashcard>
</Flashcards>

## Database & Storage High Availability

<Flashcards>
  <Flashcard term="RDS Multi-AZ">HA! Synchronous replication to a standby in another AZ, automatic failover — but does NOT serve reads.</Flashcard>
  <Flashcard term="Read Replica">Read scaling! Asynchronous replication, can be cross-Region, offloads read traffic, can be promoted to a standalone DB.</Flashcard>
  <Flashcard term="Don't confuse them">Need "high availability" → Multi-AZ; need "faster reads" → Read Replica.</Flashcard>
  <Flashcard term="EFS vs EBS">EFS = a file system shareable across AZs; EBS = block storage tied to a single AZ.</Flashcard>
  <Flashcard term="S3 durability">Eleven 9s (99.999999999%); Cross-Region Replication (CRR) for off-site DR.</Flashcard>
</Flashcards>
