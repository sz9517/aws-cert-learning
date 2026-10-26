---
sidebar_position: 2
title: "Reference Architecture 2: A Serverless API"
---

# Reference Architecture 2: A Serverless API with the least operational overhead and cost

> This page walks a common requirement — "spiky, unpredictable traffic, a tiny team, and a REST API backend that must cost as little and take as little ops effort as possible" — and turns it step by step into a <Term en="Serverless" desc="Not literally no servers; AWS runs the servers for you, you just ship code and pay per use.">serverless</Term> architecture. It is also the textbook answer to SAA exam scenarios about "least operational overhead" and "unpredictable traffic".

<Scenario title="Real scenario: a three-person team is launching a REST API backend">

You and two teammates are building the backend for a to-do list app. The user base is still small, and traffic is **spiky**: most days it is a few dozen requests, but a single social-media share could suddenly bring in tens of thousands. The team is tiny, with **no dedicated ops engineer**, and the boss is blunt: "**As little ops overhead as possible, and as cheap as possible** — don't make us pay for a full server during hours when nobody is using it."

For this kind of requirement, the traditional "keep an <Term en="Elastic Compute Cloud" desc="A full cloud server you rent on AWS; it bills while it is running.">EC2</Term> instance running all day waiting" almost always loses — it burns money idling off-peak and may get overwhelmed at peak. The serverless architecture below is tailor-made for exactly this.

</Scenario>

## Architecture overview

Look at the whole picture first, then we'll break it down piece by piece. Users arrive from the browser; the static frontend is delivered from a nearby CDN edge, while API requests travel an "auth to gateway to compute to data" serverless chain:

```text
                    ┌─────────────────────────────────────────┐
                    │              User (browser)              │
                    └───────────────────┬─────────────────────┘
                                        │
                      ┌─────────────────┴──────────────────┐
                      │                                     │
             (static frontend)                      (API requests)
                      │                                     │
                      ▼                                     ▼
          ┌───────────────────┐                 ┌───────────────────┐
          │    CloudFront     │                 │  Amazon Cognito   │
          │    (CDN edges)    │                 │   (user auth)     │
          └─────────┬─────────┘                 └─────────┬─────────┘
                    │                             auth OK, issues token
                    ▼                                     ▼
          ┌───────────────────┐                 ┌───────────────────┐
          │        S3         │                 │   API Gateway     │
          │ (static website)  │                 │ (managed API door)│
          └───────────────────┘                 └─────────┬─────────┘
                                                          │
                                                          ▼
                                                ┌───────────────────┐
                                                │      Lambda       │
                                                │ (logic, pay-per-use)│
                                                └─────────┬─────────┘
                                                          │
                                   ┌──────────────────────┼─────────────────┐
                                   ▼                                        ▼
                         ┌───────────────────┐                  ┌───────────────────┐
                         │     DynamoDB      │                  │   EventBridge     │
                         │ (serverless NoSQL)│                  │ (optional: async) │
                         └───────────────────┘                  └─────────┬─────────┘
                                                                          ▼
                                                                  ┌───────────────┐
                                                                  │ another Lambda │
                                                                  │ (background job)│
                                                                  └───────────────┘
```

Reading the diagram in one line: the **static frontend** lives in <Term en="Simple Storage Service" desc="AWS's cloud file warehouse; can serve as the origin for a static website.">S3</Term> and is accelerated worldwide by <Term en="Amazon CloudFront" desc="A content delivery network (CDN) that caches content at global edge locations for nearby delivery.">CloudFront</Term>; **API requests** first hit <Term en="Amazon Cognito" desc="A managed service for user sign-up/sign-in and authentication that issues access tokens.">Cognito</Term> for authentication, then enter <Term en="Amazon API Gateway" desc="A managed API entry point that receives requests, authorizes, throttles, and forwards them to the backend.">API Gateway</Term> as the "front door", which invokes <Term en="AWS Lambda" desc="Serverless compute; event-triggered, billed per millisecond, auto-scaling.">Lambda</Term> to run the business logic, reading and writing <Term en="Amazon DynamoDB" desc="A serverless NoSQL database with single-digit millisecond latency and on-demand capacity.">DynamoDB</Term>. Work that does not need an immediate response — sending email, generating reports — is handed off to <Term en="Amazon EventBridge" desc="An event bus that decouples services and triggers them asynchronously via events.">EventBridge</Term>, which triggers another Lambda to handle it in the background.

:::info[🔑 Not a single server to look after along the whole chain]
From the entry point through compute to the database, everything is a **managed, serverless service** — no instances to boot, no OS to patch, no auto scaling groups to configure. During idle hours it costs almost nothing; when traffic spikes, each service scales on its own. That is the essence of "least operational overhead".
:::

## Why each component was chosen

| Component | Role | Why it fits here |
| --- | --- | --- |
| **API Gateway** | Managed API entry point | Handles request intake, token validation, throttling, and forwarding to the backend, so you never run a web server; natively pairs with Lambda for a fully serverless stack |
| **Lambda** | Compute running business logic | Billed by actual execution time, **charges nothing while idle**, and **auto-scales** to thousands of concurrent executions when traffic arrives — the team only writes code |
| **DynamoDB** | Serverless NoSQL database | With **On-Demand capacity mode**, spiky traffic needs no capacity planning; single-digit millisecond latency and no machines to operate |
| **Cognito** | Managed user authentication | Handles sign-up, sign-in, and token issuance in one place, so you don't build your own credential system; tokens can be validated directly by API Gateway |
| **S3 + CloudFront** | Static frontend hosting and global acceleration | S3 stores HTML/JS/CSS nearly limitlessly and very cheaply; CloudFront caches it at edge locations so users everywhere load fast |
| **EventBridge (optional)** | Trigger for asynchronous work | **Decouples** non-urgent work like email and report generation from the main flow, so the main API responds faster while the background catches up on its own |

:::tip[💡 How to remember this chain]
Memorize a mnemonic: **"Static goes S3 + CloudFront; dynamic goes Cognito to API Gateway to Lambda to DynamoDB; async goes to EventBridge."** On the exam, a "serverless REST API" scenario is almost always this combination of pieces.
:::

### In plain terms: why each component, and not the alternative

The table above gave the selection reasons; here we spell out in plain terms why *this* service rather than the confusingly similar one next to it — exactly the trap the exam loves to dig:

- **API Gateway: why not let users hit Lambda directly?** Lambda itself has no stable URL for the outside world to call, and it won't validate tokens, throttle, or block bad requests for you. API Gateway is that **front door and guard**: it gives you a fixed HTTPS endpoint, validates Cognito tokens, enforces throttling and quotas, and maps routes to different Lambdas. Without it, the house has no front door — anyone can barge in and you can't absorb traffic spikes.
- **Lambda: why not EC2 or containers (ECS/Fargate)?** All three run code, but Lambda is the **only one that charges nothing when there is no event and needs no machine management at all**. EC2 makes you boot, patch, and scale; Fargate removes machine management but a container **bills continuously while it runs**. With spiky traffic and a tiny team, Lambda's "zero idle cost plus auto-scaling" lands right on the sweet spot.
- **DynamoDB: why not RDS (a relational database)?** RDS **requires you to run a database host** (even Aurora Serverless has a minimum capacity and a higher floor price), which drags you back to "a machine to tend, burning money off-peak". A to-do list has very simple access — look up one item by key, store one item — so DynamoDB, a **serverless NoSQL** store with no host to boot, pay-per-read/write, and single-digit millisecond latency, fits the whole serverless chain best. **But only if the access pattern is simple** — when you need complex JOINs, flexible ad-hoc queries, or cross-table transactional reports, RDS is the better fit (see the pitfalls below).
- **Cognito: why not build your own credentials?** Rolling your own sign-in means handling password hashing, token issuance, forgotten passwords, multi-factor authentication (MFA), brute-force protection, and more — every one a potential security incident if done wrong. Cognito **manages** all of that and hands JWT tokens straight to API Gateway for validation, saving a small team huge time and making it safer.
- **S3 + CloudFront: why not serve the frontend from Lambda too?** Static HTML/JS/CSS needs no compute; invoking Lambda to return a file on every request is both slow and costly. S3 as a **file warehouse** is nearly limitless and extremely cheap, and CloudFront **caches it at global edge locations** for nearby delivery — that is the right answer for static content.
- **EventBridge (optional): why not just send the email inside the same Lambda?** Slow work like sending email or generating reports, if crammed into the main Lambda, **drags down the user's API response** (and may even hit the timeout). Using EventBridge (or SQS) to **decouple it asynchronously** into the background lets the main API reply "received" instantly while a background Lambda catches up — better experience and stability.

## Why serverless fits this scenario best

<Analogy title="🚰 Analogy: installing a water cooler vs ordering bottled water on demand">

An office needs drinking water, and there are two approaches. One is to **install your own water cooler** (EC2): buy the machine, hook up plumbing and power, replace filters, descale it regularly — and whether or not anyone drinks, you pay for electricity and maintenance every month. The other is to **order bottled water only when you're thirsty** (serverless): order as much as you drink, pay nothing when you don't, and maintenance and scaling are entirely the supplier's problem.

For a small team with unpredictable demand, the "pay for what you drink, maintain nothing" delivery model is clearly cheaper and far less hassle. That is why serverless wins here.

</Analogy>

The three sweet spots of serverless in this scenario:

- **Zero idle cost**: during hours when no one calls the API, Lambda doesn't run and doesn't bill, and DynamoDB On-Demand only charges for actual reads and writes. You no longer pay for 22 hours of idling.
- **Automatic scaling**: when a viral share brings in tens of thousands of requests at once, Lambda scales to thousands of concurrent executions and DynamoDB On-Demand absorbs the peak — **nobody has to wake up at night to add servers**.
- **Minimal operations**: no OS to patch, no auto scaling group to tune, no database host to back up — the three-person team spends all its energy on product features.

:::note[⚠️ Being honest: serverless has caveats too]
It is not a silver bullet. Keep these in mind:

- **Lambda cold starts**: after a long idle period, the first invocation needs an extra few hundred milliseconds to a few seconds to warm up, so the first response is slightly slower (watch out for latency-sensitive paths; Provisioned Concurrency can mitigate it).
- **15-minute max per invocation**: a single Lambda execution has a time limit, so it is **not suitable for long-running computation** (such as a 3-hour batch job).
- **Not for long-lived or always-on work**: things like real-time media transcoding, long-held WebSocket connections, or heavy CPU-bound scientific computing will hit limits or get expensive if forced into Lambda — those belong back on EC2 or containers.
:::

## Comparison: what changes if you use an EC2 approach instead?

For the same API backend, switching to a traditional "EC2 + ELB + Auto Scaling + self-managed database" approach makes the difference in cost and ops overhead obvious — exactly the trade-off that Domain 3 (performance) and Domain 4 (cost) love to test:

| Aspect | Serverless approach | Traditional EC2 approach |
| --- | --- | --- |
| Off-peak cost | Near zero (no requests, no charge) | Billed while instances run; idling still costs |
| Handling peaks | Auto-scales, no configuration | You must configure Auto Scaling groups and policies, and new instances need warm-up time |
| Operational overhead | Near zero (fully managed) | You patch the OS, manage security updates, and handle database backups and high availability |
| Scaling speed | Instant (seconds) | A new EC2 boot + warm-up takes tens of seconds to minutes |
| Best for | Spiky traffic, small team, wants simplicity | Steady high traffic, needs full control or long-running compute |

Bottom line: for this scenario — **spiky traffic + a small team + a demand for minimal cost and ops** — serverless almost always wins. Conversely, if traffic stays steadily high and you need full OS control or long-running computation, EC2 or containers become the better fit. Selection is always "it depends on the scenario", never "whichever is trendier".

### Another comparison: how does it differ from a classic three-tier architecture?

Many people learned the classic **three-tier architecture**: a row of EC2 instances running web/app logic at the top, a load balancer (ELB) and Auto Scaling group in the middle, and an RDS database at the bottom. Serverless is essentially those three tiers swapped one-for-one for managed services:

| Three-tier (EC2 version) | Serverless equivalent | What changes after the swap |
| --- | --- | --- |
| ELB load balancer | API Gateway | No LB to tend, and it validates tokens and throttles for you too |
| A row of EC2 app servers + Auto Scaling | Lambda | No booting, no scaling policies, no charge while idle |
| RDS relational database host | DynamoDB (On-Demand) | No database host to run, no standby or backup host to tend |

:::note[⚖️ Trade-off: serverless is not "more advanced", it swaps one set of pros and cons for another]
Swapping three-tier for serverless means paying the following **costs** in exchange for "no ops plus zero idle cost":

- **You give up full control**: on EC2 you can install any software, tune the OS, and run any language or long-lived process; Lambda only runs within the execution environment it gives you and within 15 minutes. If you need special kernel parameters, a resident background service, or a GPU, serverless ties your hands.
- **You gain a new worry called cold starts**: a running EC2 is always warm and handles a request immediately; a Lambda that has been idle goes cold, so the first response is slower (see below).
- **You must rethink the data layer entirely**: from RDS's "normalize first, then query flexibly with SQL" to DynamoDB's "**decide your query patterns first, then design the table**". For people used to relational databases this is the biggest turn.
- **The cost curve is inverted**: serverless is extremely cheap at low/medium, spiky traffic; but if traffic stays **steadily very high**, paying per request can end up pricier than "a few EC2 reserved instances running all-you-can-eat". At that scale, re-evaluating EC2/containers can be the economical choice.

In one line: **small, bursty traffic and a small team equals a clear serverless win; large, steady traffic needing full control or long-running jobs equals a better fit for three-tier or containers.** Neither is more advanced — only one fits the scenario at hand better.
:::

:::warning[🚑 Common pitfalls]
The four most common pitfalls once a serverless stack is live — interviews and exams love them, and they trip people up in practice too:

- **Cold starts slow the first response**: after a long idle period, or when a traffic spike needs more instances, Lambda must first build the execution environment and load code, so the first response is a few hundred milliseconds to a few seconds slower. Watch out for **latency-sensitive** user-facing APIs. Fixes: enable **Provisioned Concurrency** to keep environments warm, move heavy work like creating connections/SDK clients outside the handler, and slim down the deployment package. (Note: **Reserved Concurrency does not** remove cold starts — do not confuse the two.)
- **Lambda's 15-minute max per invocation**: a single execution has a hard 15-minute ceiling and is terminated past it. **Do not cram long-running work into Lambda** (such as a 3-hour batch job or large file transcoding). For long jobs, switch to **Step Functions to break into steps**, Fargate containers, or Batch.
- **A poorly designed DynamoDB access pattern**: this is serverless's most painful pitfall. DynamoDB **is not a relational database**; you must **decide how you will query first, then design the partition key and indexes**. If you later discover you need to query by a non-key attribute, you are stuck with a full-table Scan — slow and expensive — or must bolt on a **GSI (Global Secondary Index)** to recover. Another trap is a **hot partition key**: many requests hitting the same key cause localized throttling. List every query scenario before you design, then work backward to the table and indexes.
- **API Gateway throttling**: API Gateway has a **default account-level rate limit** (requests per second plus a burst), and the defaults are often lower than you assume; exceeding them returns **HTTP 429 Too Many Requests**. The downstream Lambda also has a **concurrency limit** (commonly 1,000 by default), and when Lambda is throttled API Gateway returns an error too. Fixes: **raise the API Gateway Usage Plan / throttling settings** to match real traffic, **raise the Lambda concurrency limit or set Reserved Concurrency** to protect key functions when needed, and implement **retries with exponential backoff** on the frontend/caller.
:::

## Common exam angles

:::tip[💡 When the exam asks this, you answer that]
Mapping scenario keywords to answers is nearly free points:

- **"Which backend for a REST API with the least operational overhead?"** → **API Gateway + Lambda** (fully managed, no servers to run, pay-per-use). "Minimal operational overhead" plus "serverless" is almost always this pair.
- **"Which capacity mode for a database with unpredictable traffic?"** → **DynamoDB On-Demand capacity mode**. Provisioned capacity is cheaper only when traffic is **predictable and steady**; when it is **unpredictable**, choose On-Demand to avoid planning and avoid throttling or waste from bad estimates.
- **"Don't want to build your own user authentication/sign-in?"** → **Amazon Cognito** (managed user pools and tokens).
- **"A static frontend that loads fast and cheap worldwide?"** → **S3 for storage + CloudFront for acceleration**.
- **"Don't want slow work like email/reports to slow down the main API?"** → **Decouple asynchronously with EventBridge (or SQS)** and let a background Lambda handle it.
:::

<Refs title="📚 Official docs & further reading">

- [AWS Serverless overview](https://aws.amazon.com/serverless/)
- [Amazon API Gateway Developer Guide](https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html)
- [AWS Lambda Developer Guide](https://docs.aws.amazon.com/lambda/latest/dg/welcome.html)
- [DynamoDB On-Demand and Provisioned capacity modes](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.ReadWriteCapacityMode.html)
- [Amazon Cognito Developer Guide](https://docs.aws.amazon.com/cognito/latest/developerguide/what-is-amazon-cognito.html)
- [Amazon EventBridge User Guide](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-what-is.html)

</Refs>

👉 Next architecture: [Event-Driven Decoupling](./event-driven-decoupling.md)
