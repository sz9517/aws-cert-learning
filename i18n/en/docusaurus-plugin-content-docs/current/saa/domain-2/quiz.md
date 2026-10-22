---
sidebar_position: 9
title: Practice Questions
---

# Domain 2 Practice Questions (official-exam style)

Pick your answer first, then click **Show answer & explanation**. This page mirrors the SAA-C03 exam style: **scenario-based stems**, options that are all plausible AWS services (distractors are never obviously wrong), and deliberate **qualifiers** like "MOST cost-effectively / with the LEAST operational overhead / MOST highly available" to force trade-off comparisons. Includes both **single-answer** and **multiple-response (Choose TWO)** questions. These are **original** content (not real exam questions).

<Quiz
  qnum={1}
  total={26}
  question="A company runs a web application on several EC2 instances in a single Availability Zone (AZ), behind an Application Load Balancer. The company wants the service to stay available if a single AZ fails, with the fewest architectural changes. Which approach is MOST appropriate?"
  options={[
    'Switch to a larger EC2 instance type and add resources per instance',
    'Add EC2 instances in a second AZ and ensure the ALB and Auto Scaling Group span both AZs',
    'Replicate the entire application to another AWS Region',
    'Enable hourly snapshots for every EC2 instance',
  ]}
  answer={1}>

**Correct answer: B**

The core of high availability is eliminating the single point of failure by spanning **multiple AZs**. Having the ALB and ASG span two AZs keeps the service running when one AZ fails entirely, with minimal change. A is vertical scaling — a single box still fails; C (cross-Region) is disaster-recovery scope, with too much cost and complexity for this question; D (snapshots) is just backup and doesn't keep the service continuously available.

</Quiz>

<Quiz
  qnum={2}
  total={26}
  question="A gaming company needs a load balancer to handle millions of TCP connections per second at extremely low latency, and a partner firewall only allows a whitelisted 'fixed static IP'. Which option fits best?"
  options={[
    'Application Load Balancer (ALB)',
    'Network Load Balancer (NLB)',
    'Amazon CloudFront',
    'Gateway Load Balancer (GWLB)',
  ]}
  answer={1}>

**Correct answer: B**

**NLB** operates at Layer 4 with ultra-high performance and ultra-low latency, and can be assigned a **static / Elastic fixed IP** — exactly matching "extreme TCP performance + fixed-IP whitelist". ALB is Layer 7 and cannot provide a fixed IP; CloudFront is a content delivery network; GWLB is for chaining third-party network appliances.

</Quiz>

<Quiz
  qnum={3}
  total={26}
  question="An e-commerce site is busy during the day and nearly idle late at night. The company wants to automatically add and remove EC2 instances based on actual traffic to maintain performance MOST cost-effectively, with no manual intervention. Which approach is best?"
  options={[
    'Permanently run the maximum number of instances needed at peak',
    'Configure a target tracking policy on an Auto Scaling Group to keep average CPU utilization at a set value',
    'Have engineers manually start instances before peaks and stop them afterward each day',
    'Switch to the largest available EC2 instance type',
  ]}
  answer={1}>

**Correct answer: B**

**Target tracking** automatically scales out/in by a metric (e.g. average CPU), shrinking when traffic is low so you pay only for what you need — the best match for "MOST cost-effective and hands-off". A runs at max all the time, wasting cost; C needs manual effort and cannot handle surges; D is still a single point and expensive.

</Quiz>

<Quiz
  qnum={4}
  total={26}
  question="During promotions, an order system is flooded with requests that overwhelm the backend. The company wants to decouple the front and back ends, lose no requests during spikes, and let the backend process at its own capacity. Which approach is best?"
  options={[
    'Raise the maximum connection limit on the database',
    'Insert an Amazon SQS queue between the front and back ends as a buffer',
    'Use Amazon SNS to push each request to the backend in real time',
    'Replace the backend with a larger EC2 instance type',
  ]}
  answer={1}>

**Correct answer: B**

An **SQS** queue is the classic buffering/decoupling solution: requests queue up first and are not lost, and the backend (optionally with Auto Scaling) **pulls at its own pace**, so spikes do not crush it. SNS is real-time push and cannot buffer (C wrong); A and D treat symptoms, not the cause.

</Quiz>

<Quiz
  qnum={5}
  total={26}
  question="A company has an environment in each of two Regions: a primary and a standby. It requires that when the primary environment fails its health check, user traffic is routed to the standby automatically, then back once the primary recovers. Which Route 53 configuration should be used?"
  options={[
    'Weighted routing, 50% to each side',
    'Failover routing combined with health checks',
    'Simple routing pointing straight at the primary',
    'Geolocation routing based on the user country',
  ]}
  answer={1}>

**Correct answer: B**

**Failover routing + health checks** is the standard active/passive automatic-switch approach: when the health check finds the primary unhealthy, traffic is routed to the standby automatically. Weighted splits by ratio and will not fail over; simple routing has no health check; geolocation routes by user location — none meet the requirement.

</Quiz>

<Quiz
  qnum={6}
  total={26}
  question="An internal reporting system can tolerate a recovery time of 'several hours', and a once-daily backup is sufficient. The company wants the disaster-recovery approach with the LOWEST ongoing cost. Which DR strategy fits best?"
  options={[
    'Multi-Site Active/Active (multiple sites running at once)',
    'Warm Standby (a scaled-down version always running)',
    'Pilot Light (core always on, the rest on standby)',
    'Backup & Restore (only back up normally, restore when needed)',
  ]}
  answer={3}>

**Correct answer: D**

The stem stresses "several-hour RTO acceptable" and "LOWEST ongoing cost". **Backup & Restore** is the lowest-cost of the four strategies (you only pay for backup storage in normal times), at the price of the slowest recovery — exactly matching the need. The other three are more immediate and cost more. This tests the **RTO-vs-cost trade-off**.

</Quiz>

<Quiz
  qnum={7}
  total={26}
  question="For a production RDS database, the company requires automatic failover when the primary instance fails, minimizing downtime. Which should be enabled?"
  options={[
    'Create a Read Replica',
    'Enable a Multi-AZ deployment',
    'Increase the database storage capacity',
    'Take a manual snapshot every 5 minutes',
  ]}
  answer={1}>

**Correct answer: B**

**RDS Multi-AZ** synchronously replicates to a standby in another AZ and performs **automatic failover** when the primary fails, with very short downtime — exactly the HA need. A Read Replica is asynchronous and for read scaling; it does not take over automatically (A wrong); C and D cannot achieve automatic failover.

</Quiz>

<Quiz
  qnum={8}
  total={26}
  question="A reporting system generates heavy 'read-only' queries against RDS, slowing the write performance of the primary database. The company wants to offload the read traffic while affecting the primary as little as possible. Which approach is best?"
  options={[
    'Enable a Multi-AZ deployment so the standby serves reads',
    'Create one or more Read Replicas and direct the reporting queries to the replicas',
    'Switch to a larger instance type and leave it at that',
    'Temporarily disable the reporting feature',
  ]}
  answer={1}>

**Correct answer: B**

**Read Replicas** are built for **read scaling**: create replicas and send read-only queries to them to offload the primary. Note that a **Multi-AZ standby does not serve reads in normal operation** (A is a common distractor); C treats the symptom and D is not viable.

</Quiz>

<Quiz
  qnum={9}
  total={26}
  question="A company wants to point the zone apex example.com at an Application Load Balancer, following AWS best practice. Which DNS record should be created?"
  options={[
    'A CNAME record pointing to the DNS name of the ALB',
    'A Route 53 Alias record pointing to the ALB',
    'An A record hard-coding the current IP of the ALB',
    'A TXT record pointing to the ALB',
  ]}
  answer={1}>

**Correct answer: B**

The **zone apex cannot use CNAME** (a DNS-spec limitation); use a Route 53 **Alias** record pointing to AWS resources such as an ALB, and Alias queries are free. An ALB IP changes, so you cannot hard-code an A record (C wrong); a TXT record has nothing to do with domain redirection (D wrong).

</Quiz>

<Quiz
  qnum={10}
  total={26}
  question="A company wants to design a three-tier web application to be highly available so it can withstand a 'single Availability Zone failure'. Which TWO measures directly achieve this goal? (Choose TWO)"
  options={[
    'Configure the EC2 Auto Scaling Group to span multiple Availability Zones',
    'Enable a Multi-AZ deployment for the backend RDS database',
    'Concentrate all resources in a single AZ to reduce latency',
    'Switch to a single larger EC2 instance type',
    'Disable the load balancer health checks to avoid false positives',
  ]}
  answer={[0, 1]}>

**Correct answer: A, B**

HA hinges on **eliminating the single point of failure across multiple AZs**: span the ASG across AZs (A) for the compute tier and enable RDS Multi-AZ (B) for the data tier — both withstand a single-AZ failure. C concentrates everything in one AZ, creating a SPOF; D is vertical scaling and a single box still fails; E disabling health checks sends traffic to failed targets, making things worse.

</Quiz>

<Quiz
  qnum={11}
  total={26}
  question="When an order is placed, a system must notify several downstream services at once, and it requires that 'no notification message is lost even if a downstream service is temporarily offline'. Which TWO choices fit best together? (Choose TWO)"
  options={[
    'Create an Amazon SNS topic and have the order service publish a message when the event occurs',
    'Have each downstream service subscribe to the SNS topic with its own SQS queue (fan-out pattern)',
    'Have the order service call each downstream API one after another synchronously',
    'Use a shared database column as a flag and have downstreams poll it',
    'Put all downstream processing logic directly inside the order service',
  ]}
  answer={[0, 1]}>

**Correct answer: A, B**

**SNS + multiple SQS fan-out**: SNS handles one-to-many broadcast, and each downstream has its own SQS queue as a buffer — if a downstream is offline, the message stays in its queue and is consumed once it is back, so **nothing is lost**. C and E are tight coupling that stalls the main flow if any downstream is slow or down; D (polling a flag) is neither timely nor reliable.

</Quiz>

<Quiz
  qnum={12}
  total={26}
  question="A company wants a fleet of EC2 instances to automatically replace failed instances and automatically adjust the count based on traffic, with no manual effort. Which TWO settings together achieve this? (Choose TWO)"
  options={[
    'Use an Auto Scaling Group with a target tracking policy to maintain a target metric',
    'Combine the ASG health checks with the ELB so unhealthy instances are automatically terminated and replaced',
    'Disable health checks to avoid instances being terminated by false positives',
    'Fix the desired capacity equal to the maximum capacity',
    'Use vertical scaling, moving to a larger instance type as traffic grows',
  ]}
  answer={[0, 1]}>

**Correct answer: A, B**

**Target tracking (A)** lets the ASG scale out/in by a metric; **ELB health checks (B)** let the ASG detect unhealthy instances and automatically terminate and replace them — together they satisfy both "auto-adjust the count" and "auto-replace failures". C keeps failed instances around; D effectively runs at max always and loses elasticity; E is vertical scaling and a single box is still a single point.

</Quiz>

<Quiz
  qnum={13}
  total={26}
  question="A payment system requires that messages are processed in strict send order and that the same message is never processed twice. Which Amazon SQS queue fits best?"
  options={[
    'A Standard Queue, because it has the highest throughput',
    'A FIFO queue (first-in, first-out), providing strict ordering and exactly-once processing',
    'Replace the queue with an SNS standard topic',
    'Use a Standard Queue and sort and de-duplicate in the application with a database',
  ]}
  answer={1}>

**Correct answer: B**

A **FIFO queue** guarantees strict first-in-first-out ordering and de-duplication (exactly-once), matching payment needs where reordering and duplication are unacceptable. A Standard Queue is at-least-once with best-effort ordering and possible duplicates (A wrong); SNS has no queue buffering (C wrong); rolling your own sort and de-dup reinvents the wheel and is error-prone (D wrong).

</Quiz>

<Quiz
  qnum={14}
  total={26}
  question="A queue occasionally contains poison-pill messages that fail no matter what, and constant retries block later processing. The company wants to automatically isolate these repeatedly failing messages for later manual analysis. Which approach is best?"
  options={[
    'Simply delete every message that fails to process',
    'Configure a Dead-Letter Queue (DLQ) with a maximum receive count, so messages move to the DLQ automatically once exceeded',
    'Set the queue visibility timeout to 0',
    'Add more consumers to outpace the failing messages',
  ]}
  answer={1}>

**Correct answer: B**

A **Dead-Letter Queue (DLQ)** with `maxReceiveCount` moves repeatedly failing messages to the DLQ automatically once the retry count is exceeded, so the main queue is no longer blocked and the issue can be analyzed later. A deletes the evidence; C setting visibility timeout to 0 causes duplicate processing; D treats the symptom, not the cause.

</Quiz>

<Quiz
  qnum={15}
  total={26}
  question="A global service is deployed in multiple Regions, and the company wants users to automatically connect to the Region with the lowest network latency for the best performance. Which Route 53 routing policy should be used?"
  options={[
    'Weighted routing',
    'Latency-based routing',
    'Geolocation routing',
    'Simple routing',
  ]}
  answer={1}>

**Correct answer: B**

**Latency-based routing** directs users to the lowest-latency endpoint based on measured network latency to each Region, matching the "best performance" goal. Weighted splits by ratio; geolocation routes by user country (not necessarily the lowest latency, and a common distractor); simple routing makes no intelligent choice.

</Quiz>

<Quiz
  qnum={16}
  total={26}
  question="An online transaction system requires disaster recovery with an RTO of a few minutes and a very low RPO, but does not want to pay for a fully symmetric active/active deployment matching production. Which DR strategy fits best?"
  options={[
    'Backup & Restore (only back up normally, restore when needed)',
    'Pilot Light (only the core database stays on, the rest on standby)',
    'Warm Standby (a scaled-down environment runs continuously in another Region and scales up quickly during a disaster)',
    'No DR; rely on multiple AZs in a single Region',
  ]}
  answer={2}>

**Correct answer: C**

**Warm Standby** runs a scaled-down environment in another Region (serving but at small capacity) and scales up quickly to take over during a disaster, giving a **short RTO and low RPO** at a lower cost than a fully symmetric Multi-Site. Backup & Restore and Pilot Light recover more slowly with longer RTO; multiple AZs cannot withstand a whole-Region failure.

</Quiz>

<Quiz
  qnum={17}
  total={26}
  question="An internal system has traffic that spikes at 9 AM and drops sharply after 6 PM on every business day — a regular, predictable pattern. The company wants enough capacity ready before the peak and automatic scale-in off-peak to save cost. Which Auto Scaling approach fits best?"
  options={[
    'Use only Simple Scaling, reacting after CPU exceeds a threshold',
    'Configure Scheduled Scaling to adjust capacity ahead of the known time windows',
    'Keep maximum capacity running all day',
    'Switch to a larger EC2 instance type',
  ]}
  answer={1}>

**Correct answer: B**

When the traffic pattern is regular and predictable, **Scheduled Scaling** pre-provisions before the peak and scales in off-peak, avoiding the lag of waiting for a metric to trigger. Simple Scaling and target tracking are reactive and may be too late for an instant spike; running max capacity wastes cost; vertical scaling loses elasticity.

</Quiz>

<Quiz
  qnum={18}
  total={26}
  question="A company must meet a compliance DR requirement: objects in an S3 bucket must be automatically replicated to another Region to prevent data loss if a single Region suffers a large-scale failure. Which approach fits best?"
  options={[
    'Enable Same-Region Replication (SRR) to another bucket in the same Region',
    'Enable Cross-Region Replication (CRR) to a bucket in another Region',
    'Enable only S3 versioning, which achieves cross-Region redundancy',
    'Periodically download and re-upload to another bucket by hand',
  ]}
  answer={1}>

**Correct answer: B**

**Cross-Region Replication (CRR)** asynchronously replicates objects to a bucket in another Region automatically, protecting against data loss from a whole-Region failure. SRR stays in the same Region and cannot survive a regional disaster (A wrong); versioning only protects against accidental delete/overwrite, not cross-Region (C wrong); manual copying is unreliable and not real-time (D wrong).

</Quiz>

<Quiz
  qnum={19}
  total={26}
  question="A company is releasing a new version with two needs: (1) send 10% of traffic to the new version and the rest to the old version for a canary test; (2) automatically reroute to a standby endpoint when an endpoint fails its health check. Which TWO Route 53 routing policies fit these two needs respectively? (Choose TWO)"
  options={[
    'Weighted routing: split 10%/90% of traffic between the new and old versions by weight',
    'Failover routing: combined with health checks, automatically reroute to the standby when an endpoint is unhealthy',
    'Geolocation routing: split by the user country',
    'Simple routing: just return a fixed record',
    'Multivalue answer: return several healthy IPs at random',
  ]}
  answer={[0, 1]}>

**Correct answer: A, B**

Canary "split by ratio" uses **Weighted routing (A)**; "automatic failover on a failed health check" uses **Failover routing (B)** — matching the two needs respectively. Geolocation routes by country, simple routing makes no intelligent decision, and multivalue is basic load spreading — none is the best fit for these two needs.

</Quiz>

<Quiz
  qnum={20}
  total={26}
  question="A system must broadcast events one-to-many to several downstream services, and the entire path must preserve strict ordering and remove duplicates. Which TWO settings together achieve this? (Choose TWO)"
  options={[
    'Use an SNS FIFO topic to publish events, ensuring ordering and de-duplication at the publisher',
    'Have each downstream subscribe with an SQS FIFO queue, preserving ordering and de-duplication end to end',
    'Use an SNS standard topic for the highest throughput',
    'Have each downstream subscribe with an SQS standard queue',
    'Have each downstream sort in memory before processing',
  ]}
  answer={[0, 1]}>

**Correct answer: A, B**

End-to-end ordering plus de-duplication needs an **SNS FIFO topic (A)** together with **SQS FIFO queue subscriptions (B)** — both ends must be FIFO to preserve strict ordering and de-dup all the way. Standard topics/queues (C, D) are at-least-once with best-effort ordering and break the guarantee; E sorting in the downstream is unreliable.

</Quiz>

<Quiz
  qnum={21}
  total={26}
  question="A company runs backend instances in a private subnet of its VPC. These instances must not be reachable from the internet, but they must be able to initiate outbound connections to download OS updates and call external APIs. The team wants a fully AWS-managed, maintenance-free solution that is automatically highly available within an AZ. Which approach is MOST appropriate?"
  options={[
    'Add a 0.0.0.0/0 route to an Internet Gateway (IGW) in the private subnet route table',
    'Create a NAT Gateway in a public subnet and point the private subnet 0.0.0.0/0 route to it',
    'Launch your own EC2 instance as a NAT Instance in the private subnet to forward traffic',
    'Assign a public IP to every private instance so they can reach the internet directly',
  ]}
  answer={1}>

**Correct: B**

To let a private subnet reach out (outbound only, no inbound), the standard answer is a **NAT Gateway** placed in a **public subnet**, with the private subnet 0.0.0.0/0 route pointing to it. A NAT Gateway is fully AWS-managed and automatically highly available within an AZ, meeting the maintenance-free requirement. A points the private subnet at an IGW, which turns it into a public subnet and exposes it to inbound traffic. C, a NAT Instance, requires you to operate and fail-over yourself (high operational overhead). D assigns public IPs, exposing instances to inbound connections, which violates the no-inbound requirement.

</Quiz>

<Quiz
  qnum={22}
  total={26}
  question="A company already has more than a dozen VPCs on AWS and the number keeps growing. These VPCs need to communicate with one another and with the on-premises data center. The team originally connected them pairwise with VPC peering, but the number of connections exploded and routing became hard to manage. Which approach BEST simplifies the architecture and scales well?"
  options={[
    'Keep creating a VPC peering connection for every pair of VPCs that must communicate',
    'Introduce a Transit Gateway as a hub and connect all VPCs and on-premises to it',
    'Merge all services into one large VPC to eliminate the need for interconnection',
    'Create one NAT Gateway per VPC to forward traffic between them',
  ]}
  answer={1}>

**Correct: B**

A **Transit Gateway (TGW)** provides a hub-and-spoke model: each VPC and the on-premises network connect to the TGW hub once and then reach each other transitively through it. It scales and stays manageable as VPCs grow, and natively supports on-premises connectivity (VPN / Direct Connect). A, pairwise peering, needs N×(N-1)/2 connections for N VPCs and is non-transitive, which is exactly the pain the question wants to escape. C, merging into one big VPC, is impractical and disrupts security and IP planning. D, NAT Gateways, are for outbound internet access and cannot interconnect VPCs.

</Quiz>

<Quiz
  qnum={23}
  total={26}
  question="A financial company wants to connect its on-premises data center to AWS. The requirement is a long-term dedicated connection with high throughput, consistently low latency, and predictable bandwidth that is not affected by public internet congestion. With cost as a secondary concern, which connection option is MOST appropriate?"
  options={[
    'Site-to-Site VPN, establishing an encrypted tunnel over the internet',
    'AWS Direct Connect dedicated line',
    'VPC peering connection',
    'NAT Gateway with an Elastic IP',
  ]}
  answer={1}>

**Correct: B**

**Direct Connect (DX)** is a physical dedicated line leased from a carrier that does not traverse the public internet, providing stable, low-latency, high-bandwidth and predictable connectivity, exactly matching the financial firm need for a long-term dedicated link. A, Site-to-Site VPN, runs over the public internet; although cheap and fast to provision, its latency and stability are subject to internet fluctuation, so it does not satisfy the hard low-latency requirement. C, VPC peering, is for VPC-to-VPC traffic and is unrelated to on-premises connectivity. D, NAT Gateway, only handles outbound internet access from a private subnet and is not a hybrid connectivity solution.

</Quiz>

<Quiz
  qnum={24}
  total={26}
  question="A company has VPC A peered with VPC B, and VPC B peered with VPC C. Instances in VPC A cannot reach VPC C over private IPs at all. The team confirms both peering connections themselves are healthy. Which of the following is the MOST likely reason?"
  options={[
    'VPC peering is non-transitive, so A cannot reach C through B; a separate peering connection between A and C is required',
    'Peering connections take several hours to take effect, so simply wait for connectivity',
    'An Internet Gateway must be enabled in VPC B before A can reach C through B',
    'Setting all three VPC CIDRs to be identical will let traffic route transitively',
  ]}
  answer={0}>

**Correct: A**

**VPC peering is non-transitive**: A peered with B and B peered with C does not mean A can reach C. Every pair of VPCs that must communicate needs its own peering connection, so to let A reach C you must create a separate peering between A and C (and when there are many VPCs, a Transit Gateway is easier to manage). B is wrong: peering takes effect once established, so this is not a waiting issue. C is wrong: an IGW is for internet access and does not make peering transitive. D is worse: peering requires the two sides to have non-overlapping CIDRs, so identical CIDRs make the connection impossible to establish at all.

</Quiz>

<Quiz
  qnum={25}
  total={26}
  question="A media company needs to migrate 200 TB of archived historical video from on-premises to Amazon S3. It has only ordinary commercial internet bandwidth, and uploading over the network is estimated to take several months. The company wants to complete the migration as fast as possible. Which approach is MOST appropriate?"
  options={[
    'Use AWS DataSync to transfer online incrementally to S3 over the internet',
    'Order an AWS Snowball Edge device, write the data offline, and ship it back to AWS to import into S3',
    'Deploy a Storage Gateway File Gateway to mount S3 long term',
    'Use AWS DMS with SCT to migrate the video files to S3',
  ]}
  answer={1}>

**Correct: B**

When the data volume is TB-to-PB scale and **bandwidth is insufficient so a network transfer would take months**, shipping a physical device offline with **Snowball Edge** is fastest: write the data to the device, ship it back to AWS, and AWS imports it into S3, free from the outbound bandwidth limit. A, DataSync, is an online transfer and is bottlenecked by exactly the insufficient bandwidth. C, Storage Gateway, is a hybrid solution for keeping on-premises coexisting with and continuously using cloud storage, not a one-time bulk migration tool. D, DMS with SCT, is a database migration tool and is unrelated to migrating video files.

</Quiz>

<Quiz
  qnum={26}
  total={26}
  question="A company is driving hybrid cloud and migration with two parallel needs: (1) its on-premises backup system still uses physical tapes, and it wants to back up to the cloud without replacing the existing backup software; (2) it must migrate an on-premises Oracle database to Amazon Aurora PostgreSQL with as little downtime as possible during the migration. Which TWO options are, respectively, MOST appropriate? (Choose TWO)"
  options={[
    'Deploy Storage Gateway Tape Gateway to emulate a virtual tape library and keep the existing backup software while storing backups in the cloud',
    'Use AWS DMS with the Schema Conversion Tool (SCT) for a heterogeneous migration, using ongoing replication to achieve near-zero downtime',
    'Order a Snowball Edge and ship the on-premises daily tape backups offline',
    'Use DataSync to copy the Oracle database files directly into Aurora',
    'Replace the database migration tooling with a Site-to-Site VPN connection',
  ]}
  answer={[0, 1]}>

**Correct: A, B**

Need (1), keeping the existing backup software, replacing physical tapes, and backing up to the cloud, is exactly what **Storage Gateway Tape Gateway (A)** is for: it emulates a virtual tape library (VTL) so the backup software thinks it is still writing tapes while data actually lands in S3 / Glacier. Need (2), moving Oracle to Aurora PostgreSQL (engine change) with minimal downtime, calls for **DMS with SCT (B)**: SCT converts the incompatible schema and DMS keeps syncing via ongoing change data capture (CDC) up to cutover for near-zero downtime. C, Snowball, is a one-time offline bulk transfer and is unsuited to a daily backup flow. D, DataSync, moves files and cannot turn an Oracle database into Aurora. E, a VPN, is just network connectivity, not a database migration tool.

</Quiz>

---

Done already? Review again 👉 [Domain 2 Key Points / Flashcards](/saa/domain-2/flashcards), or move on to the next domain 👉 [Domain 3: Design High-Performing Architectures](/saa/domain-3/).
