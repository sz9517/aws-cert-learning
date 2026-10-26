---
sidebar_position: 5
title: "Content Delivery & Global Acceleration: CloudFront & Global Accelerator"
---

# Content Delivery & Global Acceleration: minimize latency for users worldwide

> This page untangles two often-confused "global acceleration" services: CloudFront (caches content) and Global Accelerator (accelerates the connection path) — a favorite selection question in Domain 3's high-performance topics.

<Vocab title="📌 Jargon you'll see on this page (fine even if you've never touched AWS)">

- **CDN (Content Delivery Network)**: a worldwide network of "**nearby warehouses**" that keeps a copy of your content close to users, so they don't have to reach all the way back to the source.
- **Edge Location**: AWS's "**front-line mini data centers**" scattered across major cities worldwide, serving nearby users locally. There are many more of them than Regions.
- **Origin**: your content's "**real home**" — where the original files live, e.g. an S3 bucket or your ALB/server.
- **Latency**: the "**round-trip wait**" from when a user sends a request to when they get a response; the farther away, the longer it usually takes.
- **Anycast IP**: **one single IP address** announced from many locations at once, so a user's packets are automatically steered to the "**nearest location on the network**".

</Vocab>

:::note[💬 Reading tip]
Whenever you see a term with a <Term desc="Like this! Hover over any dotted term (tap on mobile) and a plain explanation pops up.">dotted underline</Term>, hover over it for a plain-language explanation. All terms are also collected in the [Glossary & Services](../../glossary.md).
:::

## Why do you need it? A story that gets slow first

Say your web server lives in Tokyo, but one of your users is in Brazil. Every image they open, every video segment they load, the packets must **cross half the planet and back** — physical distance alone adds hundreds of milliseconds per request. The site feels sluggish and videos keep buffering.

The root cause: **when users are far from the server, it's just slow** — no server, however fast, can beat the speed of light.

There are two fixes, and they are exactly this page's stars:

1. **Pre-copy** the content to the <Term en="Edge Location" desc="AWS's front-line mini data centers in major cities worldwide, serving nearby users locally.">Edge Location</Term> closest to the user — that's **CloudFront** doing "content caching".
2. Don't cache content, but route the user's connection over **AWS's own high-speed private network** instead of the congested public internet — that's **Global Accelerator** doing "path acceleration".

## Both services in one sentence

**CloudFront** is AWS's <Term en="Content Delivery Network" desc="A worldwide network of nearby warehouses that caches content to the edge locations closest to users.">CDN</Term> that **caches** static and dynamic content at edge locations worldwide so users fetch it locally with the lowest latency; **Global Accelerator** instead gives you **fixed anycast IPs** and pushes traffic onto AWS's global private network to accelerate (but not cache) the path to your backend.

<Analogy title="🏪 Analogy: a convenience-store chain vs an express lane">

- **CloudFront is like a "global convenience-store chain"**: the central warehouse (<Term en="Origin" desc="Your content's real home, where the original files live, e.g. S3 or ALB.">Origin</Term>) gets stock, and each local store (edge location) keeps a copy. You grab what you need at the store on your corner (a **cache hit**) — no trip back to the warehouse — fast and cheap on shipping.
- **Global Accelerator is like "an express lane the moment you pass the toll booth"**: the goods still sit in the warehouse, but the second you get on the road (connect to the nearest edge location) you ride AWS's smooth private lane instead of sitting in traffic on surface streets (the public internet), reaching the warehouse faster and more reliably.
- In one line: **the store brings goods near you (caches content); the express lane makes your car travel smoothly (accelerates the path)**.

</Analogy>

## CloudFront: cache content right at the user's doorstep

<Term en="Amazon CloudFront" desc="AWS's CDN service that caches content at edge locations worldwide to serve users locally.">CloudFront</Term>'s core is **caching**. When the first user requests an image, the edge location fetches a copy from the <Term en="Origin" desc="The original content source, commonly S3 or ALB.">Origin</Term> and stores it; after that, nearby users asking for the same image get it served instantly from the edge, **without bothering the origin again**.

Key capabilities:

- **Caches static + dynamic content**: static assets like images, CSS, JavaScript, and video are ideal; it can also accelerate dynamic content such as APIs with the right settings.
- **Works with many origins**: the origin can be an **S3 bucket** (static sites, files), **ALB/EC2** (dynamic apps), or even a self-hosted server outside AWS.
- **Built-in HTTPS**: it terminates TLS encryption at the edge and can bind a custom-domain certificate.
- **Integrates with <Term en="Web Application Firewall" desc="Filters malicious requests such as SQL injection and cross-site scripting.">WAF</Term>**: block malicious traffic and common attacks at the outermost edge, before they ever reach the origin.
- **Saves money and effort**: cache-hit traffic never goes back to the origin, so the **origin's load is lower and your data-transfer-out bill is cheaper**.

## Global Accelerator: speed up connections via AWS's private network

<Term en="AWS Global Accelerator" desc="Accelerates the connection path using AWS's global private network and fixed anycast IPs; it does not cache content.">Global Accelerator</Term> never touches your content and does no caching — it solves the "**connection path**" problem. It gives you **2 fixed <Term en="Anycast IP" desc="One IP announced from many locations at once; packets are steered to the nearest location.">anycast IPs</Term>**; once a user connects, traffic immediately enters the edge location closest to them, then travels the whole way over **AWS's global private network** (rather than the congested public internet) to your backend in some Region.

Key capabilities:

- **Non-HTTP traffic too**: supports **TCP/UDP**, great for real-time communication like **online gaming, VoIP, and IoT**, not just websites.
- **Fixed anycast IPs**: the IPs never change, which makes **IP allow-listing** easy — swap the backend without changing the IP.
- **Automatic failover**: if an endpoint in one Region has problems, traffic is automatically steered to a healthy Region.
- **No caching**: every request really reaches the backend; the win comes from "a shorter, steadier path", not "fetching a nearby cache".

## Step back: why use a CDN at all? What "deliver it nearby" is worth

Putting content at the edge saves far more than a little. Latency is fundamentally about **physical distance**: packets travel through fiber at near light speed, so a Tokyo-to-Brazil round trip is a hard two-to-three-hundred milliseconds no matter how fast your server is. And a web page rarely loads in one request — it fetches HTML, then CSS, JavaScript, and a pile of images, with dependencies between them. **Every round trip pays the latency tax once**, and over long distances those taxes stack up, so the user feels "the whole page is sluggish".

A CDN's whole point is to shrink that round trip **from "across half the planet" to "the store on your corner"**:

- **Latency drops sharply**: on a cache hit, static assets come from the nearest edge location, skipping the long trip back to the origin.
- **Origin is steadier and cheaper**: lots of repeated requests are absorbed at the edge, so origin (S3/ALB) load and data-transfer-out costs both fall.
- **Survives spikes**: sudden surges (a campaign, a new video drop) are spread across edge locations worldwide, so no single origin gets crushed.
- **Security pushed outward**: TLS and WAF are handled at the edge, so malicious traffic never reaches the origin.

In one line: **a CDN does not "make the server faster"; it means "users do not have to travel all the way to the server"**. That is why it is practically the default for any site with users everywhere whose content is reusable (cacheable).

## Why are they two different things? CloudFront and Global Accelerator solve different problems

Many people's first reaction is "they are both AWS global acceleration — aren't they about the same?" — **they actually solve completely different problems**, and mixing them up is a big trap.

### Why CloudFront (and not Global Accelerator)?

- **Problem it solves**: the same content is requested repeatedly by many people worldwide (images, video, web pages, cacheable APIs). CloudFront **keeps a copy at the edge**, so the next person never needs to reach the origin.
- **Edge over Global Accelerator**: GA only makes the path faster — **every request still truly reaches the backend**; on a cache hit CloudFront **never goes back to origin**, so latency is lower, origin load is lighter, and the transfer bill is cheaper.
- **Pros**: caches, cuts transfer costs, edge HTTPS + WAF, free allowance, supports dynamic content.
- **Cons/limits**: HTTP(S) only; content is cached, so **updates need an invalidation or versioned filenames** or users get stale copies; it does nothing for real-time connections that must hit the backend every time and cannot be cached.
- **When NOT to use it**: your traffic is **non-HTTP real-time TCP/UDP** (gaming, VoIP, IoT), or you need a **fixed, unchanging IP** for allow-listing — reach for Global Accelerator instead.

### Why Global Accelerator (and not CloudFront)?

- **Problem it solves**: the connection path itself is slow and unstable (over the congested public internet), and the content **cannot be cached** (every packet must reach the backend). GA gives you fixed anycast IPs and puts traffic onto **AWS's private network** the moment it gets on the road.
- **Edge over CloudFront**: supports **TCP/UDP** (CloudFront does not), gives you **2 fixed anycast IPs** (CloudFront gives a DNS name that changes), and cross-Region automatic failover.
- **Pros**: works for non-HTTP, fixed IPs make allow-listing easy, a shorter steadier path, second-scale Regional failover.
- **Cons/limits**: **does not cache** (cannot lower origin load or cut transfer costs), has a **fixed hourly charge** with no free allowance, and is not the cheapest answer for cacheable website content.
- **When NOT to use it**: your content actually **can be cached** (sites, video, static assets) — then CloudFront is both faster and cheaper, and GA just costs more without the caching benefit.

:::info[🔑 One-line memory hook: caching vs fixed IP]
When torn between the two, ask yourself just two questions:
1. **Can the content be cached?** (the same thing is requested repeatedly) → yes → **CloudFront**.
2. **Is it non-HTTP (TCP/UDP) or does it need a fixed IP?** → yes → **Global Accelerator**.
You can also **stack them**: CloudFront in front caching HTTP content, with GA accelerating the non-HTTP connection to the backend.
:::

## CloudFront vs Global Accelerator — how to choose (the most important table)

| Comparison | CloudFront | Global Accelerator |
| --- | --- | --- |
| Core mechanism | **Caches content** at edge locations | **Accelerates the path** (over AWS's private network) |
| Protocol | Mainly HTTP/HTTPS (sites, video) | **TCP/UDP** (gaming, VoIP, IoT, etc.) |
| Public IP | Gives a DNS name (IP changes) | **2 fixed anycast IPs** |
| Caching | ✅ Caches | ❌ Does not cache |
| Best for | Static assets, media streaming, cacheable sites | Non-HTTP real-time traffic, needs a fixed IP, no caching |

:::tip[💡 Exam key point]
Match the keyword straight to the answer — nearly free points:
- Question mentions **websites / video / static assets that must be globally accelerated and "cacheable"** → **CloudFront**
- Question mentions **non-HTTP TCP/UDP (gaming, VoIP, IoT), needs a "fixed anycast IP", no caching** → **Global Accelerator**
- Question mentions **HTTPS + WAF protection at the edge to block attacks** → **CloudFront**
- Question mentions **an S3 static site that must be faster and "cut data-transfer costs"** → **S3 + CloudFront**
:::

## How it works (diagram)

<div className="flow">
  <div className="flow-node">A user in Brazil requests an image</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">The nearest Edge Location</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Cache hit? Yes → instant reply; No → fetch from origin</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Origin (S3 / ALB, in Tokyo)</div>
</div>

*Diagram: CloudFront always has the user ask "the edge location nearest me" first, going back to the origin only on a cache miss — slashing both latency and origin load.*

## Real-world application: it's not just for the exam

<Scenario title="Real scenario: your S3 static site is slow abroad and expensive">

You put a company site (HTML/CSS/images/video) straight on a Tokyo S3 bucket, public to the world. Users in Europe and the US report it **loads slowly**, and because every request hits S3 directly, the **data-transfer-out bill keeps climbing**. Your boss demands "**fast everywhere, and bring the transfer bill down**". The answer is the classic combo: **S3 + CloudFront**. Let's do it once below.

</Scenario>

### 🛠️ Hands-on: accelerate an S3 static site with CloudFront

1. Prepare an **S3 bucket** holding your site files (e.g. a home page `index.html`).
2. In the console search `CloudFront` → **Create distribution**.
3. For **Origin**, pick your S3 bucket; enable **OAC (Origin Access Control)** so the outside world can only reach S3 through CloudFront, and S3 itself stays private.
4. Set **Viewer protocol policy** to `Redirect HTTP to HTTPS`, forcing the edge to use HTTPS.
5. (Advanced) Attach a rule set under the **WAF** option to block common attacks at the edge. Create the distribution.
6. Once created, copy CloudFront's domain name (`xxxx.cloudfront.net`) into a browser. The first load fetches from S3; afterward, users in the same region hit the edge cache directly — **fast, and S3's data-transfer-out drops sharply**.

```bash
# View a CloudFront distribution's config and status
$ aws cloudfront get-distribution \
    --id <your-distribution-ID>
# Expected result: a JSON blob back; Distribution.Status starts as "InProgress"
# and becomes "Deployed" once it rolls out worldwide; DomainName is xxxx.cloudfront.net.
```

**How do you confirm the cache is actually hitting?** Open the browser dev tools (F12) and look at the `X-Cache` response header:

- The first load (or right after you change content) is usually `Miss from cloudfront` — this request went back to origin.
- Load the same asset again and it should become `Hit from cloudfront` — served straight from the edge, **without bothering S3**. That is your proof of the transfer-cost savings.

### 🛠️ Attach a custom domain and HTTPS certificate (the step people get stuck on)

To serve the site as `www.example.com` instead of `xxxx.cloudfront.net`, attach an <Term en="AWS Certificate Manager" desc="AWS's certificate service that issues and auto-renews TLS/SSL certificates for free.">ACM</Term> certificate to CloudFront. **Key rule: an ACM certificate for CloudFront must be issued in `us-east-1` (N. Virginia)**, no matter which Region your S3/ALB lives in.

```bash
# Must specify --region us-east-1, or CloudFront simply will not show this cert in its dropdown
$ aws acm request-certificate \
    --domain-name www.example.com \
    --validation-method DNS \
    --region us-east-1
# Expected result: it returns a CertificateArn (the arn contains us-east-1).
# Then set the distribution's "Alternate domain name (CNAME)" to www.example.com,
# and only now can you pick this us-east-1 cert under "Custom SSL certificate".
```

> Why us-east-1? Because CloudFront is a global edge service and reads ACM only from us-east-1. This trips people up on both the exam and in practice — issue the cert in the wrong Region and CloudFront's dropdown is simply empty, and many people get stuck here with no obvious cause.

<Cost>

CloudFront has a **free allowance** (a set amount of data transfer out and requests per month); beyond that it's billed by region and traffic. More importantly, **cache-hit traffic never returns to the origin**, which noticeably cuts the data-transfer-out bill for S3/EC2. Global Accelerator, by contrast, has a **fixed hourly charge + transfer fee** and no free allowance. When you're done practicing, remember to **disable/delete the distribution and the Accelerator** to avoid ongoing charges.

</Cost>

:::warning[🚑 Common traps]
- **Using Global Accelerator as a CDN**: GA **does not cache**. Lowering origin load, cutting transfer costs, speeding up static web assets — that is CloudFront's job. Using GA as a CDN just adds a fixed charge with none of the caching benefit.
- **Using CloudFront as a "game accelerator"**: CloudFront only takes HTTP(S) and it caches; online gaming / VoIP / IoT with **real-time TCP/UDP** connections need Global Accelerator's fixed anycast IPs plus the private-network path. Get the direction wrong and the service simply will not connect.
- **CloudFront's ACM certificate not issued in us-east-1**: a custom-domain certificate for CloudFront **must be issued in `us-east-1`**, or CloudFront **cannot find it** in its dropdown. This holds regardless of where your origin is — it is a hard rule for this global service.
- **Leaning on invalidations to publish updates**: invalidations are **free only for the first 1,000 paths per month, then billed**, and take time to apply worldwide. The right move is **versioned filenames** (e.g. `app.v2.js`, `style.abc123.css`): change the name when you change the file so the CDN naturally fetches the new one, and keep invalidations for rare emergencies.
- **Going live with no TTL / cache policy**: without a proper TTL or cache key, you may **fail to cache what you should** (low hit rate, constant origin trips, high latency and bill) or **cache what you should not** (everyone sees someone else's personalized page). Give static assets a long TTL; use the right cache key for dynamic/personalized content, or simply do not cache it.
- **Stale cache after an update**: you changed a file but forgot an invalidation or versioned filenames, so users keep getting the old edge cache.
- **Exposing S3 publicly and directly**: use CloudFront + OAC instead, keeping S3 private — safer and cheaper on transfer.
:::

<Refs title="📚 Official docs & further reading">

- [AWS Docs: Amazon CloudFront Developer Guide](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Introduction.html)
- [AWS Global Accelerator Developer Guide](https://docs.aws.amazon.com/global-accelerator/latest/dg/what-is-global-accelerator.html)
- [Serve S3 content with CloudFront (restrict access with OAC)](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html)
- [Using AWS WAF with CloudFront](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/distribution-web-aws-waf.html)
- [Custom domains and SSL for CloudFront (certificate must be in us-east-1)](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cnames-and-https-requirements.html)
- [Managing CloudFront caching: TTL and cache policies](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/controlling-the-cache-key.html)
- [CloudFront invalidations and billing](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Invalidation.html)
- [CloudFront vs Global Accelerator (AWS FAQ)](https://aws.amazon.com/global-accelerator/faqs/)

</Refs>

## Next

- ⚡ Quick review: [Domain 3 Flashcards](./flashcards.md)
- ✍️ Test yourself: [Domain 3 Practice Questions](./quiz.md)
- 📖 Next page: [High-Performance Decoupling & Data Streaming](./streaming-decoupling.md)
