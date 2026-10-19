---
sidebar_position: 9
title: Practice Questions
---

# Domain 2 Practice Questions (official-exam style)

Pick your answer first, then click **Show answer & explanation**. These cover every Domain 2 topic and mirror the official exam domains and question style. They are **original** content (not real exam questions).

<Quiz
  qnum={1}
  total={12}
  question="All of your EC2 instances are currently deployed in a single Availability Zone (AZ). To improve availability, what should you do first?"
  options={[
    'Switch the EC2 instances to a larger instance type',
    'Spread the EC2 instances across multiple AZs in the same Region',
    'Enable more frequent backups for the instances',
    'Move the instances to a Region in another country',
  ]}
  answer={1}>

**Correct answer: B**

The first step toward high availability is eliminating the **single point of failure (SPOF)**. Deploying instances **across multiple AZs** means that even if one AZ goes down entirely, the others keep serving. A is vertical scaling — a single box still fails. C doesn't help availability. D (cross-Region) is disaster-recovery scope: too much cost and complexity for this question.

</Quiz>

<Quiz
  qnum={2}
  total={12}
  question="Which statement correctly describes the difference between High Availability (HA) and Fault Tolerance?"
  options={[
    'They are identical, just different names',
    'HA aims to recover quickly after a failure; fault tolerance aims for no interruption at all during a failure',
    'Fault tolerance is cheaper than HA',
    'HA can only be achieved through vertical scaling',
  ]}
  answer={1}>

**Correct answer: B**

**HA** tolerates a brief interruption but recovers fast; **fault tolerance** requires the service to be completely unaffected during a failure, usually needing more redundancy and higher cost (so C is wrong). HA is achieved mainly through **horizontal scaling + multiple AZs** (so D is wrong).

</Quiz>

<Quiz
  qnum={3}
  total={12}
  question="A mostly HTTP/HTTPS website needs to route traffic to different microservices based on the URL path. Which load balancer should you choose?"
  options={[
    'Network Load Balancer (NLB)',
    'Application Load Balancer (ALB)',
    'Gateway Load Balancer (GWLB)',
    'No load balancer is needed',
  ]}
  answer={1}>

**Correct answer: B**

**ALB** operates at Layer 7 (application layer), understands HTTP/HTTPS, and can route by **path or host name** — ideal for websites and microservices. NLB is Layer 4 (it can't see the path); GWLB is for chaining third-party network appliances.

</Quiz>

<Quiz
  qnum={4}
  total={12}
  question="A game backend must handle millions of TCP connections per second with extremely low latency, and the client firewall needs a single 'fixed, unchanging IP'. Which load balancer fits best?"
  options={[
    'Application Load Balancer (ALB)',
    'Network Load Balancer (NLB)',
    'Classic Load Balancer (CLB)',
    'Route 53 weighted routing',
  ]}
  answer={1}>

**Correct answer: B**

**NLB** operates at Layer 4 with ultra-high performance and ultra-low latency, and can be assigned a **static / Elastic fixed IP** — exactly matching the extreme-performance and fixed-IP needs. ALB can't give a fixed IP; CLB is the legacy generation; Route 53 is DNS, not a load balancer.

</Quiz>

<Quiz
  qnum={5}
  total={12}
  question="You want a group of EC2 instances to automatically 'keep average CPU utilization around 50%' — add instances when busy, remove them when idle. What is the simplest Auto Scaling approach?"
  options={[
    'Manually log into the console and add instances during peaks',
    'Set a Target Tracking policy with a target of CPU 50%',
    'Fix the desired capacity at the maximum value',
    'Use only scheduled scaling to add instances at fixed times each day',
  ]}
  answer={1}>

**Correct answer: B**

**Target tracking** is the simplest, most intuitive policy: specify a target metric (such as CPU 50%) and the ASG automatically adds/removes instances to maintain it. C effectively runs at max all the time, wasting cost; D (scheduled) only suits peaks at **known fixed times** and can't handle random traffic.

</Quiz>

<Quiz
  qnum={6}
  total={12}
  question="Regarding an Auto Scaling Group's min / desired / max and health checks, which statement is correct?"
  options={[
    'desired can be smaller than min',
    'When the ASG detects an unhealthy instance, it automatically terminates it and launches a replacement',
    'A larger max always means a higher bill, regardless of actual traffic',
    'An ASG can only place all instances in a single AZ',
  ]}
  answer={1}>

**Correct answer: B**

With health checks, an ASG **automatically replaces** unhealthy instances to maintain the desired capacity. min is the floor, max the ceiling, and desired sits between them (A wrong); the actual instance count varies with traffic between min and max — it doesn't always run at max (C wrong); an ASG spreads instances **across multiple AZs** (D wrong).

</Quiz>

<Quiz
  qnum={7}
  total={12}
  question="During a promotion, an order system is flooded with requests and the backend keeps crashing because it can't keep up. To 'smooth the spike' and let the backend process at its own pace, which service fits best?"
  options={[
    'Use SNS to push orders straight to the backend',
    'Write orders into an SQS queue and have the backend pull and process at its own capacity',
    'Scale up the database instance',
    'Ask the frontend to rate-limit how fast users place orders',
  ]}
  answer={1}>

**Correct answer: B**

An **SQS** queue is the classic **buffering / decoupling** solution: requests queue up first, and the backend (optionally with Auto Scaling) **pulls at its own pace**, so traffic spikes don't crush it directly. SNS is real-time push and can't buffer (A wrong).

</Quiz>

<Quiz
  qnum={8}
  total={12}
  question="When an 'order placed' event occurs, three independent systems must be notified simultaneously — 'send email, update inventory, write analytics' — without affecting one another. What is the best architecture?"
  options={[
    'Have the order service call the APIs of the three systems one after another',
    'Use an SNS topic fan-out, with each system subscribing (often each paired with its own SQS)',
    'Put all three tasks in the same program',
    'Poll a shared database column used as a flag',
  ]}
  answer={1}>

**Correct answer: B**

**SNS fan-out**: the order service publishes just one message to an SNS topic, and the three systems each subscribe (commonly each with its own SQS queue), staying decoupled and consuming independently without dragging one another down. A is tight coupling — if any system is slow or down, it stalls the main flow.

</Quiz>

<Quiz
  qnum={9}
  total={12}
  question="You have a primary site (us-east-1) and a standby site (us-west-2). You want 'use the primary while healthy, automatically switch to standby if the primary fails'. Which Route 53 routing policy should you use?"
  options={[
    'Simple routing',
    'Weighted routing',
    'Failover routing + health checks',
    'Latency routing',
  ]}
  answer={2}>

**Correct answer: C**

**Failover routing** with **health checks** is the standard active/passive HA approach: when the health check finds the primary unhealthy, Route 53 automatically shifts traffic to the standby. Simple routing has no health check; weighted splits by ratio; latency routing optimizes for speed — none match active/passive failover.

</Quiz>

<Quiz
  qnum={10}
  total={12}
  question="You want to point the zone apex example.com at an Application Load Balancer. What is the correct, best-practice approach?"
  options={[
    'Create a CNAME record pointing to the DNS name of the ALB',
    'Create a Route 53 Alias record pointing to the ALB',
    'Hard-code the IP of the ALB as an A record',
    'The zone apex cannot point to an ALB',
  ]}
  answer={1}>

**Correct answer: B**

The **zone apex cannot use CNAME** (a DNS-spec limitation); use a Route 53 **Alias** record to point to AWS resources such as an ALB. Alias is free, and an ALB's IPs change, so you can't hard-code an A record (C wrong).

</Quiz>

<Quiz
  qnum={11}
  total={12}
  question="For an internal reporting system, the boss wants 'the lowest possible disaster-recovery cost, and a longer recovery time is acceptable'. Which DR strategy fits best?"
  options={[
    'Multi-Site Active/Active (multiple sites running at once)',
    'Warm Standby (a scaled-down version always running)',
    'Backup & Restore (back up, then restore when needed)',
    'Pilot Light (core always on, the rest on standby)',
  ]}
  answer={2}>

**Correct answer: C**

Among the four DR strategies, **Backup & Restore** has the lowest cost (you only pay for backup storage in normal times), at the price of the slowest recovery — exactly matching 'lowest cost, longer RTO acceptable'. The other three are more immediate and more expensive. This question tests the **trade-off between RTO (recovery time) and cost**.

</Quiz>

<Quiz
  qnum={12}
  total={12}
  question="Your RDS database's read traffic has surged and is hurting performance, and the boss also wants 'automatic failover with no interruption when the database fails'. Which combination is correct?"
  options={[
    'A Read Replica alone solves both read scaling and automatic failover',
    'Use a Read Replica to offload read traffic, and enable Multi-AZ for HA automatic failover',
    'A Multi-AZ standby automatically offloads read traffic',
    'Switching to a larger instance type solves both problems at once',
  ]}
  answer={1}>

**Correct answer: B**

These two needs require **two different mechanisms**: a **Read Replica** (asynchronous, can be multiple) offloads **read** traffic; **Multi-AZ** (synchronous standby) provides **HA and automatic failover**. Note the Multi-AZ standby does **not** serve reads in normal operation (C wrong), and a Read Replica is **not** an HA solution (A wrong). This is the confusion SAA loves to test.

</Quiz>

---

Done already? Review again 👉 [Domain 2 Key Points / Flashcards](/saa/domain-2/flashcards), or move on to the next domain 👉 [Domain 3: Design High-Performing Architectures](/saa/domain-3/).
