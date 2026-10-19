---
sidebar_position: 9
title: Practice Questions
---

# Domain 2 Practice Questions (official-exam style)

Pick your answer first, then click **Show answer & explanation**. This page mirrors the SAA-C03 exam style: **scenario-based stems**, options that are all plausible AWS services (distractors are never obviously wrong), and deliberate **qualifiers** like "MOST cost-effectively / with the LEAST operational overhead / MOST highly available" to force trade-off comparisons. Includes both **single-answer** and **multiple-response (Choose TWO)** questions. These are **original** content (not real exam questions).

<Quiz
  qnum={1}
  total={12}
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
  total={12}
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
  total={12}
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
  total={12}
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
  total={12}
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
  total={12}
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
  total={12}
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
  total={12}
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
  total={12}
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
  total={12}
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
  total={12}
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
  total={12}
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

---

Done already? Review again 👉 [Domain 2 Key Points / Flashcards](/saa/domain-2/flashcards), or move on to the next domain 👉 [Domain 3: Design High-Performing Architectures](/saa/domain-3/).
