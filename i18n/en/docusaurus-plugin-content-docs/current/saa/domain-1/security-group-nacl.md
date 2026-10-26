---
sidebar_position: 3
title: "Network Security: Security Group vs NACL"
---

# Network Security: Security Groups and NACLs

> "What's the difference between a Security Group and a NACL?" is an **almost-guaranteed** SAA question. This page uses plain language and analogies so you never mix them up again.

<Vocab title="📌 Jargon you'll see on this page">

- **VPC (Virtual Private Cloud)**: your **private virtual network** inside AWS — like the office floor you rent.
- **Subnet**: a smaller segment carved out of a VPC — like individual rooms in that office.
- **Security Group (SG)**: a firewall attached to a **single host (e.g. EC2)**.
- **NACL (Network ACL)**: a firewall attached to an **entire subnet**.
- **Packet**: a small chunk of data sent over the network.
- **Inbound / Outbound**: incoming traffic / outgoing traffic.

</Vocab>

## Why do you need them?

<Scenario title="Real scenario: your database is reachable by anyone on the internet">

You spin up a database host but forget to configure the firewall — now **the whole world can try to connect to your database** and brute-force the password. A firewall's job is: **allow only the traffic you permit, and block everything else**. AWS gives you two layers — SG and NACL.

</Scenario>

## Where the two firewalls sit (diagram)

<div className="flow">
  <div className="flow-node">Internet</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">NACL (guards the subnet door)</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Security Group (guards the host door)</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">EC2 host</div>
</div>

*Diagram: traffic passes the "subnet-level" NACL first, then the "host-level" SG, before reaching your host — like clearing building security, then your office door.*

## Get the difference instantly with an analogy

<Analogy title="🛡️ Analogy: a bodyguard vs. a door whitelist">

- **Security Group = a personal bodyguard**: it **remembers you**. Once you (traffic) come in, when your response needs to go out, the bodyguard lets it through automatically — no re-check. This is **Stateful**.
- **NACL = the rule list at the building entrance**: it **doesn't remember anyone**. It checks on the way in, and checks again on the way out — you must set both directions separately. This is **Stateless**.

</Analogy>

## Core difference table (memorize this and you're set)

| Comparison | Security Group (SG) | NACL |
| --- | --- | --- |
| Level | **Host** (EC2 network interface) | **Entire subnet** |
| Stateful? | **Stateful** | **Stateless** |
| Return traffic | Allowed automatically, no setup | **You must set** outbound rules |
| Rule types | **Allow only** | **Allow + Deny** |
| Rule evaluation | All evaluated together; any allow passes | **By rule number, low to high**; first match wins |
| Default behavior | Blocks all inbound, allows all outbound | A custom NACL blocks all in/out |
| Typical use | Front-line daily control (open 80, 443, 22) | Extra hardening, blacklist specific IPs |

:::tip[💡 The two most commonly tested traps]
1. **"Added an inbound allow but still can't connect"**: if it's a **NACL**, remember it's **stateless** — you also need an **outbound allow** (usually the ephemeral ports 1024-65535 for responses), or the response can't get out. SGs don't need this; being stateful, they allow it automatically.
2. **"Block a specific malicious IP"**: an SG **can only allow, not deny**, so use a **NACL Deny rule** to block a specific IP.
:::

## Why two layers? What each one is for

The first thing people ask is: "Wouldn't one firewall be enough — why does AWS give me two layers?" The answer: **they sit at different places and cover different scopes, backing each other up.**

<Analogy title="🏢 Analogy: building entrance (NACL) vs. your office lock (SG)">

- **NACL = the ground-floor entrance control**: it governs everyone entering and leaving **the whole floor (the entire subnet)**. Want to keep a malicious visitor out of the building? Set one blacklist rule here and every office on the floor is protected at once.
- **SG = the lock on your office door**: it governs **only your room (a single instance)**. You decide, in fine detail, who gets into your office (which ports to open, which sources to allow) — without affecting the colleague next door.

</Analogy>

**Why is splitting it this way better?**

- **Different scopes, clear division of labor**: to "protect an entire subnet in one shot," use a NACL (e.g. the whole subnet must never reach a malicious IP range); to "finely control this one machine," use an SG (e.g. this web server only opens 80/443).
- **Layered responsibility, fewer mistakes**: network admins set broad blacklist policies at the subnet layer (NACL), while app teams open the ports they need at the instance layer (SG) — the two do not overwrite each other, which makes ownership clean.
- **Defense in depth**: if an SG is misconfigured too open, the subnet-layer NACL still gets a chance to catch it. One more layer is one more safety net.

:::info[🔑 A concept people mix up: both layers must pass]
For traffic to reach your instance, **both the NACL and the SG must allow it** (AND, not OR). If either one blocks it, it does not get in. So when troubleshooting "can't connect," check both layers — but **99% of the time, day to day, you only touch the SG** (see the next section).
:::

## Stateful (SG) vs stateless (NACL): the difference and its consequences

This is the **core** distinction, and the one exams and real life love to trip you up on.

- **SG is stateful**: it **remembers** the connections you let in. When that connection's response (return traffic) needs to go back out, the SG **allows it automatically** — you **never** set a separate outbound rule for it.
- **NACL is stateless**: it **remembers nothing**. One rule for traffic coming in, another for traffic going out — **you set each direction separately**. If you open only inbound and forget outbound, your own NACL blocks the return packets, which looks like "connects but hangs as if there is no response."

<Analogy title="🛡️ One more analogy to lock it in: a doorman with memory vs. without">

- **SG = a doorman with memory**: he logged you in on the way in, so on the way out he opens the door for you automatically — no need to report again.
- **NACL = a doorman with no memory**: you logged in on the way in; on the way out he treats you as a stranger and demands you log in again. Skip that (skip the outbound rule) and you are trapped inside.

</Analogy>

**So which one do you actually touch? → By default, always the SG.** Opening ports, restricting sources, adjusting who is allowed — 99% of it happens in the SG: it is stateful, you set only one direction, the rules are intuitive, and changes take effect immediately. Leave the NACL as a "subnet-layer extra defense" and **do not touch it** without a special reason — touching it makes it easy to forget the outbound side and create weird failures.

## When do you actually *need* to touch a NACL?

The SG is usually enough, so first ask: **is a NACL really required?** Only in the few cases below — where an SG can't do it or isn't worth it — does the NACL come into play:

- **Block a specific source IP or range**: an SG has **only allow, no deny** — it cannot "block an IP." To blacklist a malicious IP, you must use a **NACL Deny rule**.
- **Protect an entire subnet at once**: attach the rule once and it applies to **all** instances in the subnet, without editing SGs machine by machine. E.g. "this subnet must never allow outbound SSH."
- **Compliance/audit requiring explicit "subnet-layer" boundary control**: some audits require a reviewable allow/deny list at the network-segment boundary, which NACL's numbered rules fit nicely.

:::info[🔑 A rule of thumb]
**Need a "deny/blacklist" or a "whole-subnet blanket rule" → only then use a NACL; for everyday allows, always use an SG.** If you catch yourself wanting to "open a port on the NACL for one machine," you are almost certainly at the wrong layer — that is the SG's job.
:::

## SG vs NACL: pros, cons, and when NOT to use each

| | Pros | Cons / limits | When **not** to use it |
| --- | --- | --- | --- |
| **Security Group** | Stateful (return traffic auto-allowed, set one side only), intuitive rules, effective immediately, can reference another SG as a source | **No deny rules** (cannot blacklist a specific IP), scope is only the instances it is attached to | When you want to "block a malicious IP" — an SG cannot; switch to a NACL Deny |
| **NACL** | Has deny rules (can blacklist), protects a whole subnet at once, numbered evaluation gives explicit ordering | Stateless (must set both directions, very easy to miss outbound), cannot reference an SG, rules harder to maintain | When you want "everyday port opening / fine-grained allows" — do not cram these into a NACL; that is the SG's job, and you will just create return-traffic headaches |

<Scenario title="Real scenario: security reports an IP scanning your service — block the whole subnet now">

The security team reports that `203.0.113.66` is heavily scanning every host in one of your subnets. You do not want to edit machines one by one (and anyway, SGs have no "deny"), so you add a **Deny** rule to **that subnet's NACL**, source `203.0.113.66/32`, with a number **lower than the existing Allow rules** (e.g. `#10`) so it is **matched first** and blocks outright. The moment this rule is added, every instance in the subnet is immune to that IP — exactly one of the few right times to "touch a NACL."

</Scenario>

## Real-world application

### 🛠️ Hands-on: create a Security Group that only opens web + SSH

1. Console → `EC2` → left menu **Security Groups** → **Create security group**
2. Name it `web-server-sg`, choose your VPC
3. Add **Inbound rules**:
   - Type `HTTP`, source `0.0.0.0/0` (anyone can view the site)
   - Type `HTTPS`, source `0.0.0.0/0`
   - Type `SSH`, source **choose "My IP"** (⚠️ restrict to your own IP only — never the whole world)
4. Leave Outbound as default (allow all) → Create
5. Attach this SG to your EC2

Use the CLI to see which SGs a host has:

```bash
$ aws ec2 describe-instances \
    --instance-ids i-0123456789abcdef0 \
    --query "Reservations[].Instances[].SecurityGroups"
```

### 🛠️ Hands-on (CLI): create an SG and add an SSH rule open only to yourself

```bash
# 1) Create the security group (specify the VPC); it returns a GroupId
$ aws ec2 create-security-group \
    --group-name web-server-sg \
    --description "Web + SSH for my server" \
    --vpc-id vpc-0abc123456789def0

# 2) Add an inbound rule: allow SSH only from "your own machine's IP"
#    First find your public IP (any method); say it is 198.51.100.25
$ aws ec2 authorize-security-group-ingress \
    --group-id sg-0123456789abcdef0 \
    --protocol tcp --port 22 \
    --cidr 198.51.100.25/32

# 3) Then open HTTP/HTTPS so anyone can view the site
$ aws ec2 authorize-security-group-ingress \
    --group-id sg-0123456789abcdef0 \
    --protocol tcp --port 80 --cidr 0.0.0.0/0
$ aws ec2 authorize-security-group-ingress \
    --group-id sg-0123456789abcdef0 \
    --protocol tcp --port 443 --cidr 0.0.0.0/0
```

**Expected results**:
- Step 1 returns something like `{"GroupId": "sg-0123456789abcdef0", ...}` — note this `GroupId`; every later command uses it.
- Steps 2-3 each return `{"Return": true, "SecurityGroupRules": [...]}` on success, containing the rule you just created.
- Afterward, `describe-security-groups --group-ids sg-...` should show three entries under `IpPermissions`: 22 (source `198.51.100.25/32`), 80, and 443 (source `0.0.0.0/0`).
- **No outbound to touch**: the SG is stateful, so the return traffic for the site and SSH is allowed automatically. That is the real experience of "only touching the SG" — you set **only the inbound direction**.

> By contrast, to get the same effect with a NACL you would **also** have to add a matching outbound rule for each (opening 1024-65535 so the return traffic can leave) — and one slip and you miss it. That is exactly what the "Common pitfalls" box below warns about.

<Cost>

Security Groups and NACLs are **completely free** — no charge no matter how many rules you add. Practice freely. (What actually costs money is the resource they protect, e.g. the EC2.)

</Cost>

:::warning[🚑 Common pitfalls]
- **Opening a NACL in one direction only (not "both ways")**: a NACL is **stateless** — return traffic is **not** allowed automatically. Set only inbound and forget outbound (usually you must open the ephemeral ports `1024-65535` for responses) and you get a "connects but no response" hang. **When you touch a NACL, always set both directions.** SGs never have this problem — stateful, set one side only.
- **Assuming an SG can "deny" an IP**: an SG has **only Allow rules, no Deny**. It simply cannot block a specific malicious IP — you must switch to a **NACL Deny rule** (and give it a number lower than the matching Allow, so it is matched first). This is the classic "wrong layer for the requirement."
- **Forcing a NACL to do what an SG should do**: everyday "open a port for one machine" is the SG's job. Forcing it onto a NACL means dealing with stateless two-way return traffic AND affecting every other host in the subnet — more effort, more mistakes. **Everyday allows always go in the SG; use NACLs only for blacklists / whole-subnet blanket rules.**
- **Opening SSH (port 22) to `0.0.0.0/0`**: that's handing a back door to the whole world for brute-forcing — **wrong in both practice and the exam**. Always restrict the source IP (e.g. only `your-IP/32`).
- **Mis-ordering NACL rule numbers**: a NACL evaluates **low to high, first match wins**. Put a Deny **after** (a higher number than) some broad Allow and the traffic gets allowed first — the Deny never fires. Give blacklist rules a **lower number**.
:::

<Refs title="📚 Official docs & further reading">

- [Security groups](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html)
- [Network ACLs (NACL)](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-network-acls.html)

</Refs>

## Next

- ⚡ Review: [Domain 1 Flashcards](./flashcards.md)
- ✍️ Quiz: [Domain 1 Practice Questions](./quiz.md)
- 📖 Next page: [S3 Data Security](./s3-security.md)
