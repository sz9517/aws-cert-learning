---
sidebar_position: 3.7
title: "Application-Layer Protection: WAF / Shield / ACM"
---

# Application-Layer Protection: WAF, Shield, and ACM

> SGs and NACLs guard the "network layer," but a website also gets hit by **SQL injection, bot floods, and DDoS** — those are stopped by the higher-layer **WAF, Shield, and ACM**. Nearly every SAA exam touches at least one of them.

<Vocab title="📌 Jargon you'll see on this page">

- **WAF (Web Application Firewall)**: a firewall that inspects the **content** of HTTP requests, blocking SQL injection, cross-site scripting, and more.
- **DDoS (Distributed Denial of Service)**: attackers flood your service with traffic so legitimate users can't get through.
- **Shield**: AWS's **DDoS protection** service.
- **ACM (AWS Certificate Manager)**: provisions and **auto-renews TLS/SSL certificates** for free (the 🔒 HTTPS in front of a URL).
- **TLS/SSL certificate**: the "ID card + key" that encrypts the connection between browser and server.

</Vocab>

## Why do you need them?

<Scenario title="Real scenario: launch day — flooded and hit with SQL injection">

Your shopping site just went live:
1. A competitor pays to flood you with **fake traffic** → you need **Shield** to stop the DDoS.
2. A hacker types `' OR 1=1 --` into the search box to steal from the database → you need **WAF** to block SQL injection.
3. Users see a plain `http://` URL with no padlock and won't enter their card → you need **ACM** to enable HTTPS.

These three services divide up defense of the "application layer."

</Scenario>

## Division of labor

| Service | What it blocks / does | Where it attaches |
| --- | --- | --- |
| **AWS WAF** | Layer-7 attacks: SQL injection, XSS, malicious bots, **rate limiting**, geo-blocking | CloudFront, ALB, API Gateway |
| **AWS Shield** | **DDoS attacks** (layer 3/4 traffic floods) | CloudFront, ALB, Route 53, and other edge |
| **ACM** | Issues / auto-renews **HTTPS certificates** (encrypted connections) | CloudFront, ALB, API Gateway |

### WAF: what rules you can set

- **Managed Rule Groups**: AWS-maintained rules for common attacks, applied in one click (easiest; often the recommended answer).
- **Rate-based**: block an IP that exceeds N requests in 5 minutes — stops brute-force and small floods.
- **Geo-blocking / IP allow-deny lists**: allow only certain countries, or block specific IP ranges.

### Shield: two tiers

<Analogy title="🛡️ Analogy: Shield is like a security plan">

- **Shield Standard = built-in free security guard**: **on automatically, completely free**, blocks common layer-3/4 DDoS, included with every AWS account.
- **Shield Advanced = VIP 24-hour bodyguard**: about **US$3,000/month**, with a 24/7 expert team (DRT), stronger protection, and **cost protection for traffic spikes during an attack**. Only large / high-risk services need it.

</Analogy>

:::tip[💡 Exam focus]
- "Block **SQL injection / XSS / geo-block / rate-limit requests**" → **WAF**.
- "Defend against **DDoS**, and it asks for 'free and automatic'" → **Shield Standard**; if it asks for "24/7 team support + cost protection" → **Shield Advanced**.
- "Need a free, **auto-renewing** HTTPS certificate" → **ACM**.
- ⚠️ An ACM cert for **CloudFront** **must be created in `us-east-1` (N. Virginia)** — a classic trap question.
- ACM **public certificates cannot be exported** for use elsewhere; if you must hold the private key yourself, use a different approach.
:::

## Why pick it? Pros, cons, and when not to use it

These three often appear together on the exam, but they solve **completely different problems and do not replace one another** — you **stack them**. Let's spell out, in plain terms, "why this one and not just another."

### WAF: why it, pros/cons, when not to use

**Why it exists**: SGs and NACLs only look at "where the packet came from and which port" — they **can't read HTTP content**. When a hacker stuffs `' OR 1=1 --` into a search box, or crawls your pages with a fake User-Agent, the packets look identical to normal traffic, so an SG can't stop them. WAF is the only layer that **opens up the HTTP request and inspects its content**, which is why layer-7 (application-layer) attacks require it.

<Analogy title="🏢 Analogy: WAF is the guard who inspects what's inside the package">

An SG is like the guard at the building entrance who only checks "does this person have a badge, which floor." WAF **opens the package and checks what's inside** — same person, same front door, but if they are carrying a bomb (SQL injection) it stops them.

</Analogy>

| Aspect | Notes |
| --- | --- |
| **Pros** | Managed Rule Groups block common OWASP attacks in one click; rules take effect instantly; you can filter finely by content / country / rate; native integration with CloudFront / ALB / API Gateway. |
| **Cons** | Rules that are too strict cause **false positives** (blocking real users); billed by request count + rule count, so costs add up on high-traffic sites; it only sees the HTTP layer, so it **cannot stop large-scale DDoS** (that is Shield's job). |
| **When not to use / limits** | Only CloudFront, ALB, API Gateway, AppSync, and Cognito can have a WAF attached — **you cannot attach WAF directly to an EC2 public IP**; put EC2 behind an ALB or CloudFront first. Purely internal services with no inbound HTTP do not need it. |

### Shield: Standard or Advanced? How to choose

**Why it exists**: DDoS means "flooding your bandwidth / connection count with massive traffic," which is a different thing from the "single malicious request" WAF blocks. Shield specifically absorbs and scrubs that flood.

**Key idea: Shield Standard is not something you enable or choose — it is already on.** As long as you use edge services like CloudFront, Route 53, and ALB, common layer-3/4 DDoS is already deflected automatically — **free, invisible, zero config**.

When is it worth jumping to **Advanced** (about US$3,000/month, usually a one-year commitment)?

| Situation | Recommendation |
| --- | --- |
| Personal practice, small site, internal tool | **Standard is enough** — don't spend the money. |
| Revenue depends heavily on online service; one attack means heavy loss | Consider **Advanced**: on-call 24/7 **SRT (Shield Response Team)** and finer real-time attack metrics. |
| Worried a large DDoS triggers auto-scaling and spikes the bill | **Advanced includes "cost protection"** — DDoS-driven scaling charges on EC2 / ELB / CloudFront / Route 53 can be credited back; this is often what actually makes it worth the price. |
| Compliance or a customer requires a DDoS incident support channel | Advanced provides a formal response process and reports. |

<Analogy title="🛡️ One-liner: Standard is a free airbag, Advanced is the full-coverage insurance + bodyguard you buy on top">

Every car ships with an airbag (Standard); only a high-value car where "one crash costs a fortune" makes the full-coverage policy plus a bodyguard (Advanced) worth it. Your little car (a practice site) does not need full coverage.

</Analogy>

:::info[🔑 The most commonly misunderstood point]
**Shield Standard does not need to be "enabled"** — there is no switch to flip. An exam statement saying "you must enable Shield Standard first to get DDoS protection" is usually **wrong**; it is built-in and always on. The only decision you actually make is "**do I pay to go Advanced**."
:::

### ACM: the upside of free auto-renewal, and its limits

**Why it exists**: The painful part of managing TLS certificates yourself is not requesting them — it is **forgetting to renew**. The moment a cert expires, every browser throws a red warning and users flee. ACM's core value is **auto-renewal**: for public certificates issued via DNS validation, ACM rotates them before expiry and re-deploys them to the bound services automatically, so you **never take the site down by forgetting to renew** again.

| Aspect | Notes |
| --- | --- |
| **Pros** | Public certificates are **completely free**; after DNS validation they **auto-renew and auto-rotate** with zero ops; one-click integration with CloudFront / ALB / API Gateway. |
| **Cons / limits** | A public certificate's **private key cannot be exported** — you **can only use it on AWS services**, not on a self-hosted Nginx, an on-prem server, or a third-party CDN; and it cannot be attached directly to an EC2 instance (go through ALB / CloudFront). |
| **When not to use** | If you need to **hold the private key yourself**, or use the cert **outside AWS**, an ACM public certificate can't help — use a certificate you buy yourself, or ACM Private CA (internal certs, billed separately). |

:::info[🔑 The condition for auto-renewal]
ACM auto-renewal only holds when you used **DNS validation and the validation CNAME stays in place**. If you originally used **Email validation**, you must re-validate manually before expiry, which is easy to miss — so **always choose DNS validation in practice**. This is a common exam trap too: "which validation method allows fully automatic renewal?" → **DNS**.
:::

## Diagram: the defenses a request passes through

<div className="flow">
  <div className="flow-node">User (HTTPS)</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Shield (blocks DDoS)</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">WAF (blocks malicious requests)</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">ALB (decrypts with ACM cert)</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Your app</div>
</div>

## Real-world application

### 🛠️ Hands-on: put HTTPS on an ALB (ACM)

1. Console → `Certificate Manager` → **Request certificate** → public certificate
2. Enter your domain (e.g. `shop.example.com`) → choose **DNS validation** (easiest, enables auto-renewal)
3. Follow the prompt to add a CNAME validation record in Route 53 (one click if same account)
4. Once issued, go to **EC2 → Load Balancers → add an HTTPS (443) listener** and pick that certificate
5. Your site now has the 🔒, and ACM will **auto-renew** before expiry

<Cost>

- **WAF**: billed by "number of Web ACLs + rules + requests" — small but not zero.
- **Shield Standard**: **free**. **Shield Advanced**: about **US$3,000/month** (with a one-year commitment) — ordinary practice and small projects **don't need it**.
- **ACM public certificates**: **free**, including auto-renewal.

</Cost>

### 🛠️ Walk through a scenario: block a search-box SQL injection (WAF)

Say you already have an ALB (your site sits behind it) and you want WAF to block the `' OR 1=1 --` attack above. Step by step:

1. Console → **WAF & Shield** → **Create web ACL** → pick the **Region your ALB is in** (WAF for an ALB is "regional," not us-east-1).
2. **Associated AWS resources** → add your **ALB** (this step is "attaching WAF" — without it, WAF does nothing).
3. **Add rules → Add managed rule groups** → select AWS's **`SQL database`** rule group (built for SQL injection) and the **`Core rule set`**.
4. Set the Default action to **Allow** (normal traffic that matches no rule passes), and **Block** on a rule match.
5. Create it and wait a minute or two to take effect.

**Expected result**: type `' OR 1=1 --` into the search box in a browser and submit → you get an **HTTP 403 Forbidden** (blocked by WAF); a normal keyword search works as usual. Back in the Web ACL's **Sampled requests / CloudWatch metrics**, you'll see `BlockedRequests` ticking up and the blocked request's content logged. That's your proof WAF is actually working.

<Cost>

- **WAF**: billed by "number of Web ACLs + rules + requests" — small but not zero.
- **Shield Standard**: **free**. **Shield Advanced**: about **US$3,000/month** (with a one-year commitment) — ordinary practice and small projects **don't need it**.
- **ACM public certificates**: **free**, including auto-renewal.

</Cost>

:::warning[🚑 Common mistakes]
- **An ACM cert for CloudFront created in the wrong region**: CloudFront is a global service, and its certificate is **only recognized in `us-east-1` (N. Virginia)**. A cert you created in Tokyo or Singapore simply **won't appear** in CloudFront's certificate dropdown — it isn't broken, it's in the wrong region. A cert for **ALB / API Gateway** must be created in **that resource's region** (regional); don't mix these up.
- **Creating the WAF but forgetting to associate a resource**: a Web ACL only takes effect once it is **associated with an ALB / CloudFront / API Gateway**. Create the Web ACL but skip the association and attacks still get through — this is the classic "I turned WAF on, why didn't it block anything."
- **Assuming Shield Standard must be turned on**: it is **built-in, automatic, and free** — there is no switch. Don't hunt for an "enable Shield Standard" button, and don't be fooled by an exam statement saying "you must enable it first to be protected."
- **Assuming an SG alone is safe**: an SG can't stop content attacks like SQL injection — that's **WAF's** job; large-scale DDoS is **Shield's** job. The three layers each cover their own thing; drop one and you lose a line of defense.
- **Trying to move an ACM public cert to on-prem / EC2**: the private key can't be exported, so it **can only be bound to AWS services** (and EC2 must go through ALB / CloudFront, not direct). Use a different approach if you need the cert elsewhere.
- **Email-validated certs don't auto-renew hands-free**: for "auto-renewal" you must use **DNS validation** and keep the validation CNAME in place, or you'll be re-validating by hand at expiry.
:::

<Refs title="📚 Official docs & further reading">

- [AWS WAF Developer Guide](https://docs.aws.amazon.com/waf/latest/developerguide/what-is-aws-waf.html)
- [How AWS Shield works](https://docs.aws.amazon.com/waf/latest/developerguide/ddos-overview.html)
- [AWS Certificate Manager (ACM)](https://docs.aws.amazon.com/acm/latest/userguide/acm-overview.html)

</Refs>

## Next

- 📖 Next page: [S3 Data Security](./s3-security.md)
- ⚡ Review: [Domain 1 Flashcards](./flashcards.md)
