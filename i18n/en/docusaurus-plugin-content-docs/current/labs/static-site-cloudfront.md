---
sidebar_position: 4
title: "Lab 4: A Globally Accelerated Static Site with S3 + CloudFront"
---

# Lab 4: A Globally Accelerated Static Site with S3 + CloudFront

> In this lab you'll put a static website on **S3** with your own hands, then put **CloudFront** in front of it for **global acceleration** and **HTTPS**. You'll end up with a site that's fast to open from anywhere in the world — while the bucket stays completely private. This maps directly to one of SAA Domain 3's favorite topics: high-performance **content delivery**.

:::note[💬 Reading tip]
Whenever you see a term with a <Term desc="Like this! Hover over any dotted term (tap on mobile) and a plain explanation pops up.">dotted underline</Term>, hover over it for a plain-language explanation. All terms are also collected in the [Glossary & Services](../glossary.md).
:::

:::info[Before you start]
This lab assumes you've finished the earlier prep:

- You've done the [First Hands-On (EC2 + S3)](../intro/first-hands-on.md), so creating an S3 bucket and uploading files already feels familiar.
- You've **set up a Billing Alarm**, so you get notified when spending crosses a threshold — that's your safety net.
- You know how to **switch Region** (top-right of the console). Keep the bucket in one Region you're comfortable with (e.g. Tokyo).

Not done yet? Go back and finish those first.
:::

## Plain-language primer for this lab

- **Static website hosting**: a site made only of fixed HTML / CSS / images, with no backend program running. This kind of site is a perfect fit for S3 — no server to babysit.
- **S3 as the Origin**: the <Term en="Origin" desc="The true home of your content, where the original files live — here, an S3 bucket.">Origin</Term> is where your content "really lives." Here, the S3 bucket holding your web files is CloudFront's origin.
- **CloudFront edge caching**: <Term en="Amazon CloudFront" desc="AWS's CDN; caches content to edge locations worldwide to serve users from nearby.">CloudFront</Term> copies your page to <Term en="Edge Location" desc="AWS's front-line mini data centers in cities worldwide, serving nearby users.">edge locations</Term> around the globe, so users get it from nearby with the lowest latency.
- **OAC (Origin Access Control)**: a key handed out **only to CloudFront**. With it, the bucket can **keep Block Public Access on** yet still let CloudFront — and only CloudFront — read its files.
- **HTTPS by default**: CloudFront encrypts the connection right at the edge, so users get HTTPS without any setup.

<Analogy title="🏪 Analogy: a central warehouse plus a global convenience-store chain">

Picture your website as a **central warehouse** (S3) holding the original goods. CloudFront is like a **convenience-store chain** opened in cities worldwide (the edge locations): each shop first stocks a copy from the warehouse. Customers just walk to the corner shop (the nearest edge location) and grab what they need — fast and cheap on shipping, no long trip back to the warehouse. And OAC is like "**the warehouse only opens its door to the chain's trucks, never to random passersby**" — the goods stay safely locked inside.

</Analogy>

---

## Hands-on: put the static site on S3, then accelerate it with CloudFront

### Step 1: create an S3 bucket and upload index.html

Goal: prepare the "home" for your content.

:::info[🤔 Why do it this way: why not just turn on S3 static website hosting?]
S3 has a built-in "static website hosting" feature that gives you a public URL directly. So why does this lab deliberately **not** use it and instead stack a CloudFront layer in front? Because the S3 static-website endpoint has three dealbreakers: it is **HTTP only, no HTTPS** (no padlock in the address bar), it has **no global caching** (overseas users round-trip back to your origin Region every time, so it's slow), and to be visible at all it requires **making the bucket public** (planting a leak risk). So this lab uses "**keep the bucket private + put CloudFront in front**," solving encryption, acceleration, and security all at once. This is also the officially recommended approach.
:::

1. Log in to the AWS console → confirm the **Region** (top-right) → search `S3` → **Create bucket**.
2. **Bucket name**: must be **globally unique**, e.g. `my-static-site-wang-20261022` (lowercase letters, numbers, and hyphens only).
3. **Block Public Access**: **keep "Block all public access" checked — leave it ON!** The whole point of this lab is "the bucket is never public; only CloudFront may read it."
4. Leave everything else at defaults → **Create bucket**.
5. On your computer, create a simple home page `index.html`:

```bash
# Create the simplest possible index.html (any text editor works too)
cat > index.html <<'HTML'
<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><title>My First Globally Accelerated Site</title></head>
  <body>
    <h1>Hello, CloudFront!</h1>
    <p>This page lives in a private S3 bucket, served worldwide over HTTPS by CloudFront.</p>
  </body>
</html>
HTML
```

6. Back in the bucket → **Upload** → **Add files** → pick the `index.html` you just made → **Upload**. Confirm the object appears in the bucket.

:::note[👀 What you'll see at this step]
After the bucket is created, the **"Block all public access" column shows "On"** — that's correct, don't turn it off. Once the upload finishes, `index.html` appears in the bucket's object list. At this point you **can't** open it in a browser yet (clicking the object's URL directly gives Access Denied), because the bucket is still private and we haven't wired up CloudFront yet — this is exactly the expected behavior, don't panic.
:::

### Step 2: create a CloudFront distribution with S3 as the origin and OAC

Goal: put a global CDN in front of S3, secured with OAC.

:::info[🤔 Why do it this way: why keep the bucket private with OAC?]
The soul of this step is **OAC (Origin Access Control)**. The laziest approach is "make the bucket public so anyone can read it" — but that's exactly the headline in every cloud-leak story: an engineer makes it public for convenience, forgets to turn it off, and the whole dataset ends up exposed on the internet. OAC does the opposite: the bucket **keeps Block Public Access on**, and the bucket policy only grants access to "this one specific CloudFront distribution." It's like the bucket opening a single controlled door only for CloudFront, while everyone else (including anyone who guesses the S3 URL) gets Access Denied. You get both security and convenience — and this is the exam's favorite correct answer.
:::

7. Search `CloudFront` in the console → **Create distribution**.
8. **Origin domain**: pick the S3 bucket you just created from the list.
9. **Origin access**: choose **Origin access control settings (OAC)** → click **Create control setting** to create an OAC → apply it.
10. After creating it, CloudFront tells you the **bucket policy needs updating** so this OAC can read the bucket. Click **Copy policy**, then in the S3 bucket's **Permissions › Bucket policy**, paste it and save. Key point: the bucket's **Block Public Access stays ON** — this policy only grants access to CloudFront.
11. **Viewer protocol policy**: choose `Redirect HTTP to HTTPS` so the edge forces HTTPS.
12. **Default root object**: enter `index.html`, so opening the domain's root path automatically serves the home page.
13. Leave the rest at defaults → **Create distribution**. Wait for its status to go from deploying to deployed (usually a few minutes).

:::note[👀 What you'll see at this step]
Right after creation, the distribution's **"Last modified" shows "Deploying"**, meaning the config is syncing out to edge locations worldwide. Refresh after a few minutes and it changes to a timestamp (meaning deployment is done and it's ready). **If you open the page while it's still deploying, you may well see a 403 or a stale state — that's normal. Wait for it to finish, then test.**
:::

:::info[🤔 Why do it this way: if you later use your own domain and certificate, why must the certificate be in us-east-1?]
This lab uses CloudFront's built-in `*.cloudfront.net` certificate, so you **don't** need to request your own certificate yet. But the moment you want to switch to your own domain (e.g. `www.mysite.com`), you must request a certificate in **ACM (AWS Certificate Manager)** and attach it to CloudFront — and that certificate **must be requested in the `us-east-1` (N. Virginia) Region**. A certificate requested in any other Region simply won't be selectable in CloudFront. The reason: CloudFront is a **global service**, and it reads its certificates centrally from `us-east-1` (its "headquarters") before pushing them out to edge locations worldwide. This is an extremely common snag: people request a certificate in Tokyo, then go back to CloudFront's dropdown and can't find it anywhere — because they hit exactly this trap.
:::

### Step 3: open the site via the CloudFront domain and confirm HTTPS

Goal: verify the result — the page loads, and it's over HTTPS.

14. Back on the distribution's details page, copy the **Distribution domain name** (something like `d1234abcd.cloudfront.net`).
15. Paste that domain into your browser; you should see your `Hello, CloudFront!` page.
16. Check the address bar — it starts with `https://` with a padlock icon, proving it's **HTTPS by default**.
17. **The key check**: try opening the S3 object's URL directly (e.g. `https://your-bucket.s3.amazonaws.com/index.html`). You'll get **Access Denied**. This proves it: **the bucket keeps Block Public Access on, and only CloudFront can read it.**
18. **See the cache kick in (the most satisfying step)**: open your browser's developer tools (F12) → **Network** tab → refresh the page → click the `index.html` request → look at the **Response Headers**. Find the `X-Cache` header:

```bash
# You can also check from the command line; hit it twice and watch X-Cache change
curl -I https://your-distribution-domain.cloudfront.net/
```

:::note[👀 What you'll see at this step: first a Miss, then a Hit]
- **The first time** you open it (or the first time after changing content): `X-Cache` reads **`Miss from cloudfront`** — meaning this edge location didn't have it cached yet, so it just fetched a copy from the S3 origin.
- **Refresh and look again**: `X-Cache` becomes **`Hit from cloudfront`** — meaning this time it was served straight from the edge cache, with **no trip back to the origin**. This is the exact moment "global acceleration" and "cheaper data transfer" actually happen: a cache hit is both fast and free of your S3 outbound-transfer charges.

Seeing the `Miss` → `Hit` transition means CloudFront's cache is genuinely working.
:::

:::tip[💡 This step echoes the Shared Responsibility Model]
You didn't make the bucket public — you used OAC to make CloudFront the only way in. **AWS secures the cloud itself; you secure what's in the cloud.** Locking the bucket and exposing only one controlled door is exactly your half of the deal. Don't make the bucket public for "convenience."
:::

```bash
# (Optional) Inspect this distribution's config and status via the CLI
aws cloudfront get-distribution --id <your-distribution-id>
```

:::warning[🚑 Common pitfalls]
The four spots most likely to trip you up in this lab — avoid them by following along:

- **Making the bucket "public" instead of using OAC**: making the bucket public for speed does let the page show, but you've planted a leak time-bomb — and the exam will mark you wrong. The correct answer is always **bucket keeps Block Public Access on + OAC**, letting only CloudFront read. When you're done, go back and confirm the bucket's "Block all public access" is still On.
- **The ACM certificate not requested in `us-east-1`**: when you later attach your own domain, a certificate requested in Tokyo or any other Region simply **won't appear** in CloudFront's dropdown. Always request the certificate in `us-east-1` (N. Virginia) — remember CloudFront is a global service and reads certificates only from that Region.
- **Changed the file but still seeing the old version (cache not invalidated)**: you re-uploaded `index.html`, but the page still shows the old content — because the edge location's cached copy is still within its TTL. To see the new version right away, create an invalidation for `/*` under the distribution's **Invalidations** tab to clear the cache; or use a query string (e.g. `?v=2`) to bypass the cache while testing.
- **Assuming a change takes effect worldwide instantly**: whether you change distribution settings or create an invalidation, CloudFront needs **a few minutes to push the change out to edge locations worldwide**. When you see the status "Deploying," just wait — don't keep retrying or assume it's broken; it's simply still deploying.
:::

---

## Clearing up a misconception: why not just make the bucket public?

If all you want is for people to see the page, why not make the S3 bucket public and skip CloudFront? Because CloudFront solves four things at once:

- **Caching + proximity**: content is copied to edge locations worldwide, so overseas users get it from nearby. **Latency drops dramatically** — no round trip back to your origin Region every time.
- **HTTPS with almost no setup**: CloudFront ships a built-in certificate at the edge, so users get encrypted connections by default; the S3 static-website endpoint itself does not offer HTTPS.
- **Lower data-transfer costs**: requests that hit the edge cache **don't go back to the origin**, so origin load drops and S3's outbound data-transfer bill falls noticeably.
- **Security**: paired with OAC, the bucket **stays private**, avoiding the single most common cloud-leak accident — "made it public and forgot to turn it off."

In one line: **making the bucket public only gets you "visible"; S3 + CloudFront gets you "fast, secure, and cheap."**

---

## Clean up your resources to avoid charges

:::warning[🧹 Always clean up when you're done! Leaving resources running keeps billing you]
Tear everything down in order:

**1. Disable and delete the CloudFront distribution**
- Go to `CloudFront` → select your distribution → **Disable** → wait for the status to become Disabled.
- Once disabled, **Delete** the distribution. (CloudFront requires you to disable and let it redeploy before it can be deleted.)

**2. Empty and delete the S3 bucket**
- Go to `S3` → open your bucket → select all objects → **Delete**, typing the confirmation text as prompted.
- With the bucket empty → select the bucket → **Delete** → type the bucket name to confirm. (A bucket **must be empty before it can be deleted**.)

**3. Check the billing page to confirm charges have stopped**
- Top-right account menu → **Billing and Cost Management** → check **Free Tier** usage and the current bill, confirming nothing looks off.
:::

<Cost title="💰 Cost note">

CloudFront has a **Free Tier** (a monthly allotment of data transfer out and requests), and storing one small HTML file in S3 costs practically nothing — follow the steps, clean up afterward, and you basically won't be charged. The real trap is **forgetting to disable/delete the distribution** or **forgetting to empty and delete the bucket**. Remember: **if you spin it up, remember to tear it down.**

</Cost>

---

## Why this matters for the exam

- Domain 3 (performance) and Domain 4 (cost optimization) love testing that **CloudFront both "lowers latency" and "cuts outbound data-transfer costs"** — when you see an S3 static-site scenario where "global users complain it's slow and the data-transfer bill is high," the answer is almost always **S3 + CloudFront**.
- On the security side, **OAC (Origin Access Control)** comes up a lot: if the question stresses "the bucket must not be public, but CloudFront needs to read it," the answer is **OAC + Block Public Access**, not making the bucket public.

<Refs title="📚 Official docs & further reading">

- [Host a static S3 website with CloudFront (tutorial)](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/getting-started-secure-static-website-cloudfront.html)
- [Restrict access to an S3 origin with OAC](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html)
- [Blocking public access to your Amazon S3 storage](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html)
- [Amazon CloudFront Developer Guide](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Introduction.html)

</Refs>

👉 Next lab: [Test RDS Multi-AZ Failover](./rds-multi-az.md)
