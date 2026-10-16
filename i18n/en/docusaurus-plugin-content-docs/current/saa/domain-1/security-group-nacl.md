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

<Cost>

Security Groups and NACLs are **completely free** — no charge no matter how many rules you add. Practice freely. (What actually costs money is the resource they protect, e.g. the EC2.)

</Cost>

:::warning[🚑 Common real-world mistakes]
- **Opening SSH (port 22) to `0.0.0.0/0`**: that's handing a back door to the whole world for brute-forcing — **wrong in both practice and the exam**. Always restrict the source IP.
- **Changing a NACL but forgetting it's stateless**: setting only inbound, not outbound, causes the weird "connects but no response" dropouts.
- **Cramming all security into NACLs**: use **SG as your primary** daily control (more intuitive, stateful); use NACLs for subnet-level extra defense or blacklists.
:::

<Refs title="📚 Official docs & further reading">

- [Security groups](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html)
- [Network ACLs (NACL)](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-network-acls.html)

</Refs>

## Next

- ⚡ Review: [Domain 1 Flashcards](./flashcards.md)
- ✍️ Quiz: [Domain 1 Practice Questions](./quiz.md)
- 📖 Next page: [S3 Data Security](./s3-security.md)
