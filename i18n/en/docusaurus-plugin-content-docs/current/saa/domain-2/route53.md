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

## Why use Route 53 (and not just any DNS)?

A plain DNS service does one thing: translate a name into an IP. Route 53 adds **"steer traffic to the right place based on conditions"**, and it's deeply integrated with the rest of AWS:

- **Built-in health checks**: Route 53 periodically knocks on endpoints to confirm they're alive, and stops sending traffic to the ones that are down — the foundation of automatic failover, which plain DNS can't do.
- **Free Alias records to AWS resources**: pointing at an ELB, CloudFront, or S3 static site costs no query fees, and the record **follows the resource's IP automatically** when it changes (detailed below).
- **Multiple routing policies**: a single domain name can return different answers based on "lowest latency, user's country, weight ratio, health status" — offloading part of your traffic-control logic to the DNS layer.
- **A highly available service itself**: Route 53 is one of the few AWS services carrying a **100% availability SLA**.

:::info[🔑 Clearing up a common misconception in one line]
Route 53 decides **which server to send a user to**, not **how the connection itself is handled**. It acts during the "look up the name" phase, before the user has connected; what actually accepts the connection, does connection-level load balancing, and blocks traffic is **ELB / WAF / Shield**, not Route 53. This boundary matters both on the exam and in practice (more in "Common pitfalls" below).
:::

## How do you choose a routing policy? When to use which (pros/cons + health checks)

The table above tells you "what each policy does"; this section adds "**why pick it, when not to, and whether to pair it with a health check**" — which is exactly what scenario questions test.

<Analogy title="☎️ First, remember the seven transfer styles with the switchboard analogy">

- **Simple**: one set of extensions; hands out one from the list at random.
- **Weighted**: send 90% to the old agents, 10% to the new ones, to test the waters.
- **Latency**: transfer to the branch that "connects fastest".
- **Failover**: if the main extension doesn't answer, auto-transfer to the backup extension.
- **Geolocation**: look at **which country you're calling from** and transfer to a different branch (regulation / localization).
- **Geoproximity**: look at **how far away you actually are**, and use a bias to manually "enlarge or shrink" a region's service area.
- **Multivalue answer**: hand you several healthy extension numbers at once; you pick one to dial yourself.

</Analogy>

| Policy | Why choose it | Cons / limits | Pair with a health check? |
| --- | --- | --- | --- |
| **Simple** | Least setup; enough for a single-endpoint site | **Does not support health checks**; returns the IP even if it's down | Cannot (this is its biggest limit) |
| **Weighted** | Gradually ramp by ratio; first choice for blue/green, canary, A/B testing | You maintain the weights; not a real load balancer | Recommended (a failed endpoint's weight is treated as 0, so no traffic goes to it) |
| **Latency** | In multi-region deployments, connect each user to the region that is **fastest for them** | Compares "network latency", not "geographic distance" — the two don't always match | Recommended (so a down region can be excluded) |
| **Failover** | The standard answer for Active-Passive HA | Only primary/secondary roles; no multi-endpoint splitting | **Required** (without a health check it has no idea when to switch) |
| **Geolocation** | Serve different content by the user's **country/continent**; regulatory blocking, localized language versions | Based on "where the user is", so it **doesn't guarantee fastest**; set a `Default` record to catch unmapped regions | Recommended |
| **Geoproximity** | When you need **fine control over "how large an area each region serves"**, using a bias to grow/shrink a region's reach | More complex setup, requires **Traffic Flow**; harder to grasp than latency routing | Recommended |
| **Multivalue answer** | Want "simple distribution + only healthy IPs returned" — adds health filtering over Simple | **Not a load balancer**: just returns several records at random and the client picks; no connection-level distribution | Recommended (automatically filters out unhealthy IPs) |

:::tip[💡 Exam key point: keyword → policy map]
- "Global users should connect to the **fastest** region" → **Latency** (keyword: speed / latency).
- "Serve different content by the user's **country** / block a specific country" → **Geolocation** (keyword: country / region / regulation). ← Most confused with latency: one compares speed, the other location.
- "**Automatically** switch to the backup when the main site goes down" → **Failover + health checks** (neither works without the other).
- "Gradually **ramp up** a new version and be able to roll back" → **Weighted**.
- "**Fine-tune a region's service area** (bias)" → **Geoproximity**.
- "Return **multiple healthy IPs** for the client to pick, without standing up an ELB" → **Multivalue answer**.
- If you see an option pairing **Simple with a health check**, eliminate it — Simple **does not support** health checks.
:::

## Alias vs CNAME: why prefer Alias

This one shows up on almost every exam, and trips people up in practice too. Both "point one name at another target", but the differences are crucial:

| Comparison | **Alias (Route 53-specific record)** | **CNAME (standard DNS record)** |
| --- | --- | --- |
| **Usable at the root domain (zone apex, e.g. `example.com`)?** | Yes | **No** (not allowed by DNS rules — the most common sticking point) |
| **Query cost when pointing at AWS resources** | **Free** | Billed as normal queries |
| **Target IP changes** | Route 53 **follows automatically** (e.g. if an ELB's IP changes, you do nothing) | Points at a **name**; the IP behind that name is managed by the other side |
| **What it can point at** | AWS resources (ELB, CloudFront, S3 static site, API Gateway, another Route 53 record in the same zone...) | Any domain name (including non-AWS external domains) |
| **Response type** | Returns an **A/AAAA** (IP) directly on query | Returns a **CNAME** (name); the client must look up again |

**So why prefer Alias?**

1. **The root domain can only use Alias** — to make `example.com` (not `www.example.com`) point straight at an ELB/CloudFront, **only Alias can do it**; a CNAME at the zone apex is invalid.
2. **It's free** — Alias queries to AWS resources are not charged; CNAME queries are.
3. **One less hop, one less thing to maintain** — Alias returns the IP directly (one fewer DNS round trip), and it follows the target resource's IP automatically, so you never hand-edit the record.

**So when do you still need a CNAME?** When you must point at a **non-AWS external domain name** (e.g. a third-party SaaS gives you `xxx.vendor.com`), Alias can't reach it, so you use a CNAME — but remember it can **only be used on a subdomain** (like `www`, `app`), never the root domain.

<Scenario title="Real scenario: the boss wants example.com (not www) to open my site directly">

You put the site behind CloudFront and want users typing `example.com` to land right on it. Your first instinct is to add a CNAME pointing at the CloudFront domain — but Route 53 simply won't let you store a CNAME at the root domain. The fix: on the root domain `example.com`, create an **Alias record (type A) pointing at that CloudFront distribution**; while you're at it, add an Alias or CNAME for `www` pointing to the same place.

</Scenario>

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
# Expected: while the primary is healthy, you get the primary IP (e.g. 52.1.2.3);
# make the primary health check fail, wait past the TTL, query again, and it
# should switch to the backup IP (e.g. 54.9.8.7).

# nslookup works too (common on Windows)
$ nslookup www.example.com
# Expected: a Name / Address pair; the Address is the IP Route 53 is returning right now.
```

:::tip[💡 How to confirm failover actually kicked in]
Don't just read "Unhealthy" in the console. What to actually do: turn the primary health check red → **wait longer than the TTL you set** → run `dig`/`nslookup` above and check whether the returned IP has changed to the backup site. Query before the TTL expires and you'll likely get a cached old IP and wrongly conclude it didn't switch.
:::

<Cost>

Route 53's cost is small but not zero: each **hosted zone** is about **$0.50/month**, with queries billed separately (cents per million queries), and each **health check** is about **$0.50/month** (for AWS endpoints). **Queries to Alias records pointing at AWS resources are free** — a big advantage over CNAME. When done, just delete the hosted zones and health checks you don't need.

</Cost>

:::warning[🚑 Common pitfalls]
- **TTL set too long, so switching is slow?** DNS results are **cached by every layer (the user's computer, their ISP) until the TTL expires**. If your primary/backup records have a TTL of 3600 seconds, after a failover it can take up to an hour for old users to see the new IP. **Lower the TTL first (e.g. 60 seconds) before switching**, then raise it back once stable. This is the number-one reason for "I set up failover but switching feels super slow".
- **Want a CNAME on the root domain `example.com`?** You can't! The zone apex can only use an **Alias**; a CNAME can only be used on a subdomain (like `www`). This is the most common sticking point — memorize it for a free point.
- **Set up failover but created no health check?** Then Route 53 has no idea the primary is down and **will never switch** — the setup is pointless. Failover **must** be tied to a health check, and confirm the path it monitors (e.g. `/health`) really returns a non-2xx/3xx on failure.
- **Think Route 53 can "block traffic"?** Route 53 only **returns an IP**; once the user has the IP they **connect directly to your server**, so traffic never passes through Route 53. It therefore **cannot stop a DDoS or enforce WAF rules** — that is the job of **Shield / WAF / ELB**. Do not treat Route 53 as a firewall or load balancer.
- **Treating multivalue answer as a load balancer?** Multivalue just "returns several healthy IPs at random for the client to pick" — it has no connection-level health detection or distribution. For real load balancing, use **ELB**.
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
