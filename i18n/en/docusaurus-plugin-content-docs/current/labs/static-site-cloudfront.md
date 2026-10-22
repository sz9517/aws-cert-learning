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

### Step 2: create a CloudFront distribution with S3 as the origin and OAC

Goal: put a global CDN in front of S3, secured with OAC.

7. Search `CloudFront` in the console → **Create distribution**.
8. **Origin domain**: pick the S3 bucket you just created from the list.
9. **Origin access**: choose **Origin access control settings (OAC)** → click **Create control setting** to create an OAC → apply it.
10. After creating it, CloudFront tells you the **bucket policy needs updating** so this OAC can read the bucket. Click **Copy policy**, then in the S3 bucket's **Permissions › Bucket policy**, paste it and save. Key point: the bucket's **Block Public Access stays ON** — this policy only grants access to CloudFront.
11. **Viewer protocol policy**: choose `Redirect HTTP to HTTPS` so the edge forces HTTPS.
12. **Default root object**: enter `index.html`, so opening the domain's root path automatically serves the home page.
13. Leave the rest at defaults → **Create distribution**. Wait for its status to go from deploying to deployed (usually a few minutes).

### Step 3: open the site via the CloudFront domain and confirm HTTPS

Goal: verify the result — the page loads, and it's over HTTPS.

14. Back on the distribution's details page, copy the **Distribution domain name** (something like `d1234abcd.cloudfront.net`).
15. Paste that domain into your browser; you should see your `Hello, CloudFront!` page.
16. Check the address bar — it starts with `https://` with a padlock icon, proving it's **HTTPS by default**.
17. **The key check**: try opening the S3 object's URL directly (e.g. `https://your-bucket.s3.amazonaws.com/index.html`). You'll get **Access Denied**. This proves it: **the bucket keeps Block Public Access on, and only CloudFront can read it.**

:::tip[💡 This step echoes the Shared Responsibility Model]
You didn't make the bucket public — you used OAC to make CloudFront the only way in. **AWS secures the cloud itself; you secure what's in the cloud.** Locking the bucket and exposing only one controlled door is exactly your half of the deal. Don't make the bucket public for "convenience."
:::

```bash
# (Optional) Inspect this distribution's config and status via the CLI
aws cloudfront get-distribution --id <your-distribution-id>
```

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
