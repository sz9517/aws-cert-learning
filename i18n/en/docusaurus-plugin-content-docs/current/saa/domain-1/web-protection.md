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

:::warning[🚑 Common mistakes]
- **Creating the ACM cert in the wrong region**: a cert for CloudFront not created in `us-east-1` won't appear in the console selector.
- **Assuming an SG alone is safe**: an SG can't stop content attacks like SQL injection — that's **WAF's** job.
- **Buying Shield Advanced for a small project**: Standard already covers common DDoS automatically; don't waste US$3,000/month.
:::

## Next

- 📖 Next page: [S3 Data Security](./s3-security.md)
- ⚡ Review: [Domain 1 Flashcards](./flashcards.md)
