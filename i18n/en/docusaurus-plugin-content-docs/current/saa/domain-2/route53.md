---
sidebar_position: 5
title: DNS & Traffic Routing (Route 53)
---

# Route 53: the internet's "switchboard and navigator"

> A user types `www.example.com` in their browser, but computers actually talk to each other using IP addresses. Translating a human-readable domain name into an IP is the job of DNS — and Route 53 is AWS's DNS service, which can also "steer" traffic to the healthiest, nearest, most suitable server.

<Vocab title="📌 Jargon you'll see on this page (fine even if you've never touched AWS)">

- **DNS (Domain Name System)**: the "**phone book of the internet**" that translates a domain name (`example.com`) into an IP address (`52.1.2.3`).
- **Domain name**: the human-friendly address of a site, e.g. `example.com`.
- **Record**: one entry in the phone book, telling everyone "this name maps to this IP or this resource".
- **Health check**: Route 53 periodically "knocks on the door" to ask whether a server is still alive; if it's down, it stops sending people there.

</Vocab>

:::note[💬 Reading tip]
Whenever you see a term with a <Term desc="Like this! Hover over any dotted term (tap on mobile) and a plain explanation pops up.">dotted underline</Term>, hover over it for a plain-language explanation. All terms are also collected in the [Glossary & Services](../../glossary.md).
:::

## Route 53 in one sentence

**Route 53** is AWS's <Term en="Domain Name System" desc="The internet phone book that translates domain names into IP addresses.">DNS</Term> service (named after port 53, which DNS uses). It does two things: **(1) translate domain names into IPs**, and **(2) use the "routing policy" you configure to decide which server each user is steered to**. That second job is exactly its key role in a highly available architecture.

<Analogy title="☎️ Analogy: think of Route 53 as a big company's switchboard">

- You call and give the "department name" you want (the domain name)
- The **switchboard (Route 53)** connects you to the correct extension (the IP address)
- A smart switchboard also: checks which agent is least busy (weighted), connects you to the nearest branch (latency / geolocation), and automatically reroutes to a backup extension when one doesn't answer (failover + health check)

</Analogy>

## How DNS works (in plain terms)

When you type `www.example.com`:

1. Your computer asks DNS: "What's the IP for this name?"
2. The lookup eventually reaches the Route 53 that manages this domain
3. Route 53 returns an IP based on your records and routing policy
4. Only then does the browser use that IP to actually connect to the site

## Routing policies at a glance (an exam favorite)

Route 53's power is that "a single domain name can have multiple records, and different policies decide which one to return":

| Routing policy | What it does | Typical use |
| --- | --- | --- |
| **Simple** | One record to one or more IPs, returned at random | The simplest site, no special needs |
| **Weighted** | Splits traffic by the ratio you set (e.g. 90% / 10%) | <Term desc="New and old versions live at once; gradually shift traffic to the new one by ratio, and roll back instantly if there's a problem.">Blue/green & canary deployments</Term>, A/B testing |
| **Latency** | Returns the regional endpoint with the **lowest latency** for the user | Multi-region deployments where users should reach the fastest region |
| **Failover** | Uses the primary while it's healthy; auto-switches to the backup when it's down | Active-Passive high availability |
| **Geolocation** | Returns different results based on the user's **country/region** | Content localization, legal restrictions (one country sees one version) |
| **Geoproximity** | Splits traffic by geographic distance, with a bias you can tune | Fine-grained control of "which region serves whom" |
| **Multivalue answer** | Returns several healthy IPs at once; the client picks | Simple distribution and fault tolerance (not a real load balancer) |

:::tip[💡 Exam key point]
- "Connect global users to the region with the **lowest latency**" → choose **Latency routing**.
- "Serve different content based on the user's **country** / block a specific country" → choose **Geolocation routing**. These two are the easiest to confuse: one keyword is "speed", the other is "location".
- "**Automatically** switch to a backup site when the main site goes down" → **Failover routing + health checks**.
- To do **blue/green or canary** gradual rollout → **Weighted routing**.
- **Alias vs CNAME**: to point at an AWS resource (ELB, CloudFront, S3 static site) use an **Alias record** — it's **free**, and the **zone apex (root domain, e.g. `example.com`) can only use an Alias**; a CNAME cannot be used at the root domain.
:::

## How failover works (diagram)

<div className="flow">
  <div className="flow-node">User queries example.com</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Route 53 checks health check</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Primary healthy? return primary IP</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Primary down? auto-return backup IP</div>
</div>

*Diagram: the health check detects the primary is down, so Route 53 automatically steers later queries to the backup site — nearly invisible to the user.*

## Real-world application: it's not just for the exam

<Scenario title="Real scenario: your company website can never show an 'unreachable' page">

Your boss says: "This site is the company's face. If the primary data center has an incident, customers **must not see an error page** — it should auto-switch to the backup site in another region." That's exactly what "failover routing + health checks" solves. Let's do it once below.

</Scenario>

### 🛠️ Hands-on: build Active-Passive HA with Failover + health checks

1. Log in to the AWS console → type `Route 53` in the search bar → open the service
2. First create a **health check**: left menu **Health checks** → **Create health check** → enter the primary site's domain/IP and the path to monitor (e.g. `/health`) → create
3. Open your **Hosted zone** → **Create record**
4. Create the **primary record**: Record name `www`, Routing policy **Failover**, Failover record type **Primary**, associate the health check you just made, value = the primary site (prefer **Alias** for AWS resources)
5. Create a **backup record**: same name, Failover **Secondary**, value = the backup site
6. Test: stop the primary or make the health check fail; after the TTL, a query for `www` automatically returns the backup site

```bash
# Query the IP a domain currently resolves to, to verify the switch
$ dig +short www.example.com

# nslookup works too (common on Windows)
$ nslookup www.example.com
```

<Cost>

Route 53's cost is small but not zero: each **hosted zone** is about **$0.50/month**, with queries billed separately (cents per million queries), and each **health check** is about **$0.50/month** (for AWS endpoints). **Queries to Alias records pointing at AWS resources are free** — a big advantage over CNAME. When done, just delete the hosted zones and health checks you don't need.

</Cost>

:::warning[🚑 Common real-world mistakes]
- **Changed a record but it didn't take effect immediately?** DNS has a **TTL (cache time)**; old results are cached until they expire. Before a planned switch, lower the TTL first (e.g. 60 seconds).
- **Want a CNAME on the root domain `example.com`?** You can't! The zone apex can only use an **Alias**. This is the most common sticking point.
- **Set up failover but created no health check?** Then Route 53 has no idea the primary is down and won't switch. The two must go together.
- **Treating Route 53 as a load balancer?** Multivalue answer just "returns several IPs at random" — it has no connection-level health or distribution. For real load balancing, use ELB.
:::

<Refs title="📚 Official docs & further reading">

- [AWS Docs: Amazon Route 53 Developer Guide](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/Welcome.html)
- [Choosing a routing policy](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-policy.html)
- [Route 53 health checks and DNS failover](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-failover.html)
- [Choosing between alias and non-alias records](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resource-record-sets-choosing-alias-non-alias.html)

</Refs>

## Next

- ⚡ Quick review: [Domain 2 Flashcards](./flashcards.md)
- ✍️ Test yourself: [Domain 2 Practice Questions](./quiz.md)
- 📖 Next page: [Backup & Disaster Recovery](./backup-dr.md)
