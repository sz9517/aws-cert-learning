---
sidebar_position: 3
title: Deployment Strategies (Blue/Green, Canary, Rolling)
---

# Deployment Strategies: Ship a New Version and Still Have an Escape Hatch

> This article takes a developer's view of deployment strategies: how in-place, rolling, blue/green, and canary/linear each work, whether they cause downtime, how big the risk is, how fast you can roll back, and how to actually do it on AWS: CodeDeploy deployment configurations, Lambda alias weighted traffic shifting, ECS blue/green, and Elastic Beanstalk deployment policies. This is a high-frequency topic in DVA-C03 Domain 3 (Deployment & Testing, 22%). The exam gives you a scenario and asks which one you pick and why.

<Vocab title="Terms you will see in this article (no prior knowledge needed)">

- **Deployment**: pushing your new code live to replace the old version that is currently running, so users get the new version.
- **In-place**: no new machines. You replace the old version with the new one directly on the **existing servers**. Cheap on resources, but the box may be briefly unavailable during the swap.
- **Rolling**: split your fleet into batches and replace them **one batch at a time** instead of all at once.
- **Blue/Green**: run two environments at the same time: **Blue (current old version)** and **Green (brand-new version)**. Validate Green, then switch all traffic to Green at once.
- **Canary**: send a **small slice** of traffic (say 10%) to the new version first, watch it, then shift the rest once it looks healthy. Named after the canary miners used to detect toxic gas.
- **Rollback**: the act of sending traffic/code **back to the old version** when the new one misbehaves. Faster rollback means a shorter blast on users.
- **Downtime**: the window during a deployment when the service is **unavailable**. Good strategies aim for **zero-downtime**.

</Vocab>

:::note[Reading tip]
Whenever you see a term with a <Term desc="Like this! Hover over any dotted-underline term (tap on mobile) for a plain-language explanation.">dotted underline</Term>, hover over it for a plain explanation. All terms are also collected in the [glossary](/glossary).
:::

## Why deployment strategy matters so much: both "going live" and "going wrong" happen

Picture pushing a new payments build all at once at midnight, and a bug makes every single payment fail. The two things you want most are: **(1) if it breaks, only a small set of users are hit, and (2) when it breaks, you can get back to the old version as fast as possible.**

A strategy has to balance three things that often pull against each other:

- **Speed**: how quickly can you get the new version live?
- **Risk (blast radius)**: if the new version has a bug, how many users are affected at once?
- **Rollback speed**: once you spot trouble, how fast can you get back to the safe old version?

And a fourth is constrained by money: do you spin up a **whole extra environment** for this (that is exactly what blue/green does). There is no "best" strategy, only the one that fits the scenario. That is precisely what DVA likes to test: it hands you a scenario (zero downtime required? can you accept double cost? do you want to validate with a small slice first?) and asks which one you choose.

## The four core strategies: how they work, downtime, risk, rollback speed

### 1. In-place

Stop the old version on the **existing servers**, install the new one, and start it back up. No new machines, lowest resource use.

- **Downtime**: the box being swapped is **briefly unavailable**. If you swap everything at once, that is a brief site-wide outage.
- **Risk**: when the new version is broken, **every machine is already on it**, so the blast radius is large.
- **Rollback**: slow. To go back you have to **deploy the old version again** (another in-place swap). You cannot flip back instantly.
- **In one line**: cheapest, but the worst for downtime and rollback. Good for **non-production** or internal tools that can tolerate a brief outage.

### 2. Rolling

Split the fleet into batches (say 25% each). **Replace one batch, pass its health check, then move to the next.** The old version keeps serving the remaining machines, so you get **near-zero downtime**.

- **Downtime**: near zero (some machines are always serving).
- **Risk**: smaller than in-place: on failure only some batches may be on the new version. But both versions run **side by side** mid-deploy, so they must coexist.
- **Rollback**: medium. You have to roll a batch of the old version back through, slower than blue/green.
- **Variant**: "**rolling with an additional batch**" spins up one extra batch of new machines before it starts, keeping full capacity the whole time, at the cost of a slightly higher machine count during the deploy.

### 3. Blue/Green

Run **two complete environments**: **Blue** is the old version serving now, **Green** is the new version, deployed and tested. Once Green checks out, switch traffic to it **all at once** (usually by repointing a router / load balancer, or DNS).

- **Downtime**: zero (the switch is instant).
- **Risk**: you can **fully test Green** before the switch; after the switch, a failure can hit all traffic (unless you combine it with canary).
- **Rollback**: the **fastest**. The old version (Blue) is still fully there, so on failure you just **switch traffic back to Blue**, almost instantly.
- **Cost**: you run **two environments at once** during the deploy, so cost is close to double.

<Analogy title="Everyday analogy: blue/green is like moving into the freshly fitted shop next door">

- **Blue = the old shop that is open now**: customers come in as usual.
- **Green = the brand-new shop next door, fitted out but not yet open**: you can test the plumbing, the till, and the menu inside while customers are completely unaffected.
- **The switch = pointing the sign and the front door at the new shop**: once tested, one word and every customer walks into the new shop.
- **Rollback = the new shop has a problem, so point the front door straight back to the old one**: the old shop never closed, which is why blue/green rolls back instantly.

</Analogy>

### 4. Canary / Linear

This is really a finer-grained way of **how you shift traffic**, often layered on top of blue/green: instead of flipping 100% of traffic to the new version at once, you shift it **in stages**.

- **Canary**: shift a **small slice** (say 10%) to the new version, **pause and watch** for a while (error rate, latency), confirm it is healthy, then shift the **remaining 90% at once**. Two stages.
- **Linear**: add **equal increments over several steps** (say 10% every 1 minute, ten steps total). Multi-stage, smoother.

{/* The difference: canary is "small slice then all the rest" in two steps; linear adds a fixed percentage each step. */}

- **Downtime**: zero.
- **Risk**: the **smallest**. Only the small slice of canary users meets the bug first, so the blast radius is minimal.
- **Rollback**: fast, and usually **automatable**: pair it with a CloudWatch alarm and it **rolls back automatically** the moment error rate crosses a threshold, no one watching required.
- **Cost**: it takes longer to go live (you wait and watch), and you **must set up monitoring and alarms**, otherwise "send 10% first" with nobody watching and no auto-rollback is pointless.

## How to do it on AWS

The same strategy names have different entry points across AWS services. DVA will test which mechanism a given service uses for blue/green or canary.

### CodeDeploy deployment configurations

<Term en="AWS CodeDeploy" desc="The AWS automated deployment service that pushes new versions to EC2, Lambda, and ECS, with built-in in-place/blue-green and canary/linear deployment configurations.">CodeDeploy</Term> uses a **deployment configuration** to decide "how traffic shifts". It has a set of built-ins, and you can define custom ones:

| Compute platform | Built-in deployment config (example) | Meaning |
| --- | --- | --- |
| **EC2/On-Premises** | `CodeDeployDefault.AllAtOnce` | Replace everything at once (in-place, all at once) |
| | `CodeDeployDefault.HalfAtATime` | Replace half at a time (rolling) |
| | `CodeDeployDefault.OneAtATime` | Replace one instance at a time (most conservative rolling) |
| **Lambda/ECS** | `CodeDeployDefault.LambdaCanary10Percent5Minutes` | Shift 10% first, wait 5 minutes, then the rest (canary) |
| | `CodeDeployDefault.LambdaLinear10PercentEvery1Minute` | Add 10% every minute (linear) |
| | `CodeDeployDefault.LambdaAllAtOnce` | Shift all at once |

The naming is easy to read: **`platform + Canary/Linear/AllAtOnce + percentage + time`**. `Canary10Percent5Minutes` means "10% first, wait 5 minutes, then shift the rest".

:::info[CodeDeploy AppSpec and lifecycle hooks]
CodeDeploy uses an `appspec.yml` to describe how to deploy, and you can attach **lifecycle hooks** that run your Lambda validation functions. For Lambda/ECS blue/green, the key hooks are **`BeforeAllowTraffic`** (validate before shifting traffic) and **`AfterAllowTraffic`** (validate after shifting). If validation fails, CodeDeploy **rolls back automatically**. This is the core of automating "canary + auto-rollback".
:::

### Lambda alias weighted traffic shifting (canary/linear)

Lambda supports weighted traffic shifting natively through **versions + aliases**: an alias can point to two versions at once with weights. Doing canary by hand is just adjusting alias weights; doing it with CodeDeploy means picking the `LambdaCanary.../LambdaLinear...` config above and letting it advance the weights for you.

```bash
# Publish new version 2 (an immutable snapshot of $LATEST)
aws lambda publish-version --function-name order-api

# Canary: prod alias keeps 90% on version 1, sends 10% to version 2
aws lambda update-alias \
  --function-name order-api \
  --name prod \
  --function-version 1 \
  --routing-config AdditionalVersionWeights={"2"=0.1}
```

### ECS blue/green (with CodeDeploy)

For blue/green on <Term en="Elastic Container Service" desc="The AWS container orchestration service that runs your Docker containers. Can do blue/green deployments with CodeDeploy.">ECS</Term>, CodeDeploy starts a set of new-version tasks (Green) in a **new target group**, routes test traffic to them through an **Application Load Balancer** for validation, and once they pass, switches the production listener to the Green target group. On failure you switch the listener back to the Blue target group to roll back.

### Elastic Beanstalk deployment policies

<Term en="Elastic Beanstalk" desc="The AWS PaaS platform: upload your code and it manages the machines, load balancing, and scaling; comes with several built-in deployment policies.">Elastic Beanstalk</Term> packages the strategies as **deployment policies** you pick when creating an environment:

| Policy | Behavior | Downtime | Rollback |
| --- | --- | --- | --- |
| **All at once** | Replace everything at once (in-place) | Brief outage | Redeploy the old version |
| **Rolling** | Replace existing machines in batches | Near zero, but **capacity drops** during | Roll a batch back through |
| **Rolling with additional batch** | Spin up an extra batch first, then roll | Zero, **keeps full capacity** | Roll a batch back through |
| **Immutable** | Launch a **brand-new set** of machines, switch only after health checks pass | Zero, low risk | Fast (just terminate the new machines) |
| **Traffic splitting** | On top of immutable, route a **small slice** of traffic to validate first | Zero | Fast (canary-style) |

:::tip[Exam tip: Beanstalk policies at a glance]
- Want the **cheapest** and can accept downtime: **All at once**.
- Want **zero downtime without dropping capacity**: **Rolling with additional batch** or **Immutable**.
- Want the **safest, easiest rollback**: **Immutable** (fresh machines; if broken, just throw them away).
- Want to **validate with a small slice first (canary)**: **Traffic splitting**.
- Beanstalk has **no** policy literally named "Blue/Green"; its blue/green approach is to build a second environment and use **Swap Environment URLs** to swap the CNAME.
:::

## Which strategy and why: reason to use it, pros/cons, when to use which

This is the fixed section to memorize. The exam often wraps "downtime tolerance, cost, whether you want small-slice validation, rollback speed" into a scenario and asks which to pick.

| Strategy | Why use it | Pros | Cons | When to use it | When not to |
| --- | --- | --- | --- | --- | --- |
| **In-place** | Lowest resource use, simplest | No extra environment, lowest cost | Downtime during swap, rollback means redeploy, large blast radius | Non-production, internal tools that tolerate brief downtime | Production, downtime-sensitive services |
| **Rolling** | Near-zero downtime using existing machines | No double environment, safer than in-place | Slower rollback, both versions coexist mid-deploy and **capacity may drop**, must be compatible | General production services, cost-sensitive but want near-zero downtime | High-risk changes that need instant rollback |
| **Blue/Green** | Zero downtime plus **fastest rollback** | Full testing before the switch, one-click switch back to the old environment | Cost close to **double** (two environments), shared state like databases needs handling | High-availability production, fast safe rollback, critical systems like payments | Tight budget, or a change so small two environments are not worth it |
| **Canary/Linear** | Shrinks the **blast radius to a minimum** | Only a small slice of users affected, can **auto-rollback** with alarms | Slower to go live, **must have monitoring and alarms** | High-risk changes, large user base, want real-traffic validation | No monitoring/alarms, or you need 100% live immediately |

<Scenario title="Real scenario: work backward from the scenario keywords">

- The question says "**no downtime at all**, **must get back to the old version as fast as possible**, budget allows": **blue/green**.
- The question says "**let a small portion of real users** try the new version first, and **auto-rollback** the moment error rate climbs": **canary + CloudWatch alarm**.
- The question says "**do not want to pay for a whole extra environment**, but still need **near-zero downtime**": **rolling** (or Beanstalk rolling with additional batch).
- The question says "this is an internal test tool, **a brief outage is fine**, want the cheapest": **in-place / all at once**.

</Scenario>

## Hands-on: canary + auto-rollback for a Lambda with CodeDeploy

This flow turns "send 10% first, auto-revert when an alarm fires" into real configuration. Assume you already have a Lambda function `order-api` and a `prod` alias.

```yaml
# appspec.yml: tells CodeDeploy to shift the prod alias from version 1 to version 2
version: 0.0
Resources:
  - myFunction:
      Type: AWS::Lambda::Function
      Properties:
        Name: order-api
        Alias: prod
        CurrentVersion: 1
        TargetVersion: 2
Hooks:
  # Run a validation function BEFORE shifting traffic; if it fails, do not shift, fail the deploy
  - BeforeAllowTraffic: validate-before
  # Run validation again AFTER traffic is shifted
  - AfterAllowTraffic: validate-after
```

```bash
# Create a deployment group with a canary config + a CloudWatch alarm for auto-rollback
aws deploy create-deployment-group \
  --application-name order-api-app \
  --deployment-group-name order-api-dg \
  --deployment-config-name CodeDeployDefault.LambdaCanary10Percent5Minutes \
  --service-role-arn arn:aws:iam::111122223333:role/CodeDeployRole \
  --alarm-configuration enabled=true,alarms=[{name=order-api-5xx-errors}] \
  --auto-rollback-configuration enabled=true,events=DEPLOYMENT_FAILURE,DEPLOYMENT_STOP_ON_ALARM
```

**Expected result**:

- As soon as the deployment starts, the `prod` alias routes **10%** of traffic to version 2 and keeps **90%** on version 1; the `BeforeAllowTraffic` validation function runs first and must pass.
- During the **5-minute** watch window, if the CloudWatch alarm `order-api-5xx-errors` does **not** fire, CodeDeploy shifts the remaining **90%** to version 2 at once and the deployment status becomes **Succeeded**.
- If 5xx errors spike during the window and the alarm enters **ALARM**, CodeDeploy **auto-rolls back**: the alias instantly flips to **100% version 1**, the deployment becomes **Stopped / Rolled back**, and only that 10% was affected for a few minutes.

<Cost>

**Blue/green costs close to double during the deploy** because you run two environments at once; once the switch is done and confirmed healthy, **remember to tear down the old (Blue) environment** so you are not burning money on two forever. Canary/linear adds almost no cost (same environment, just shifting the traffic ratio), but it is only meaningful with a **CloudWatch alarm**: the alarm costs very little yet is the lifeline of auto-rollback. CodeDeploy itself is mostly free beyond EC2/On-Premises (Lambda, ECS); you pay for the underlying compute. After practice, clean up the test deployment groups, extra environments, and alarms.

</Cost>

:::warning[Common pitfalls]
- **Thinking in-place can roll back fast**: in-place requires **another deployment** to go back, not an instant switch. For "revert in seconds", use **blue/green** (switch back to Blue) or **canary auto-rollback**.
- **Forgetting blue/green is double cost**: two environments coexist during the deploy; not tearing down the old one afterward means paying extra long-term.
- **Database schema changes breaking rollback**: the code can switch back to the old version, but the **database change cannot be undone**. If the new version made a breaking schema change (changed a column type, dropped a column), rolling the old code back breaks because it no longer matches the schema. Make **backward-compatible, incremental schema changes** (add first, drop later, both versions work) so rollback is truly safe.
- **Canary without an auto-rollback alarm**: "send 10% first" with no CloudWatch alarm attached and nobody watching leaves the risk uncontrolled: failures still spread slowly. Half the value of canary is **monitoring + auto-rollback**.
- **Ignoring session/state**: during a blue/green or rolling switch, if a user session is pinned to one machine (sticky session) or lives in local memory, switching over **drops the login state**. Move state out to shared storage like **ElastiCache/DynamoDB** so a deployment switch does not kick users out.
:::

<Refs title="Official docs & further reading">

- [CodeDeploy deployment configurations](https://docs.aws.amazon.com/codedeploy/latest/userguide/deployment-configurations.html)
- [CodeDeploy blue/green deployment overview](https://docs.aws.amazon.com/codedeploy/latest/userguide/welcome.html#welcome-deployment-overview-blue-green)
- [Lambda alias weighted traffic shifting](https://docs.aws.amazon.com/lambda/latest/dg/configuration-aliases.html)
- [ECS blue/green deployments with CodeDeploy](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/deployment-type-bluegreen.html)
- [Elastic Beanstalk deployment policies and settings](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/using-features.deploy-existing-version.html)

</Refs>

## Next

👉 Next: [Build and Deploy Containers](./containers-deploy.md)
