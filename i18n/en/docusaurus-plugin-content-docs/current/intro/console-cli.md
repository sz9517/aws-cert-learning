---
sidebar_position: 9
title: "The Console, CloudShell & CLI"
---

# Three ways to operate AWS: the Console, CloudShell & CLI

> There is usually more than one way to do the same thing. Knowing *when to use which* matters more than memorizing commands.

<Term en="Command Line Interface" desc="A way to operate a computer by typing commands instead of clicking buttons with a mouse.">CLI</Term> might sound intimidating, but don't worry — this page walks you through the three main entry points for operating AWS in the gentlest way possible.

## Why are there so many ways to do the same thing?

<Analogy title="💡 Analogy: three ways to change the same TV channel">

Imagine you want to "switch the TV to channel 5". There are actually several ways:

- **Walk over and press the buttons on the TV itself**: intuitive, you can see the screen, but you have to get up every time.
- **Use the remote control**: you can do it from the couch, a bit faster, but you have to learn which button does what.
- **Write a script that switches to channel 5 automatically every night at 8pm**: set it up once, then never touch it again.

Operating AWS is the same: the **Console** is like pressing the buttons by hand, the **CLI** is like the remote, and **IaC (Infrastructure as Code)** is like the automation script. Same task — use whichever suits you best.

</Analogy>

AWS provides all three entry points because **different situations suit different tools**: as a beginner, clicking with a mouse feels safest; for things you repeat daily, typing one line beats twenty clicks; to spin up hundreds of servers at once, you need code to generate them automatically.

## 1. AWS Management Console (the Console)

The **AWS Management Console** is the **web-based graphical interface** you see after logging in through your browser. Every service can be operated with a mouse, and it's where most people first meet AWS.

The <Term en="Management Console" desc="AWS's web-based graphical interface; log in with a browser and operate services by clicking with a mouse.">Console</Term> is best for **exploring and learning**: you can see every button and option, and you don't need to memorize any commands.

### Navigation: know these spots first

Your first login can feel overwhelming, so just remember these few spots in the top-right area:

| Location | What it is | Why it matters |
| --- | --- | --- |
| **Region selector** (top-right) | Choose which region your services run in (e.g. Tokyo `ap-northeast-1`) | Picking the wrong region means you can't find the resource you just created — the most common beginner confusion |
| **Service search bar** (top center) | Type a service name (e.g. `EC2`, `S3`) to jump straight to it | AWS has 200+ services; searching is far faster than browsing menus |
| **Account / Billing menu** (your account name, top-right) | Check billing, settings, sign out | Keep an eye on billing so month-end doesn't surprise you |
| **CloudShell icon** (top toolbar, the `>_` icon) | Opens a browser-based terminal in one click | The star of the next section — the best starting point for typing commands |

:::tip[💡 Beginner tip]
If a resource seems to have "disappeared", first check the **Region in the top-right**. It's not a bug — you created it in region A but are now looking in region B.
:::

## 2. AWS CloudShell (a terminal built into your browser)

<Term en="CloudShell" desc="A terminal AWS provides that runs right inside your browser — no install, no key setup; just log in to the Console and use it.">AWS CloudShell</Term> is a **terminal that opens right inside your browser**. Its biggest advantages:

- **No install needed**: you don't install anything on your own computer — just click the `>_` icon in the Console and it's ready.
- **Credentials already loaded**: since you're already logged in to the Console, CloudShell automatically uses your identity and permissions, so **you never set up any keys manually**.
- **Safest option**: no keys are left on your own computer.

These traits make CloudShell **the best place to type your first commands** — no worrying about installing the wrong thing, and no risk of leaking keys.

### Try two harmless commands

Once CloudShell is open, start with these two "look, don't touch" commands:

```bash
# Ask AWS "who am I right now?" — returns your account ID and identity
$ aws sts get-caller-identity
{
    "UserId": "AIDXXXXXXXXXXXXXX",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/you"
}

# List all S3 buckets in this account (empty output is perfectly normal)
$ aws s3 ls
```

Both commands **only query — they don't create or delete anything** — so practice freely.

:::note[📝 Jargon cheat sheet]
`aws` is the AWS CLI command; `sts` is <Term en="Security Token Service" desc="AWS's Security Token Service — it issues temporary credentials and can also tell you your current identity.">Security Token Service</Term>; `get-caller-identity` simply means "tell me who is calling this command".
:::

## 3. AWS CLI (a command-line tool installed on your own computer)

The **AWS CLI (Command Line Interface)** is a tool you **install on your own computer**. It runs the same `aws` commands as CloudShell — the difference is that it runs on your machine instead of in the browser.

Why install it locally? Because your coding and scripts live on your own computer, so a local CLI integrates neatly with your development workflow and automation.

### Install & configuration concepts

After installing the AWS CLI, the first thing you do is run `aws configure` to tell it "who you are":

```bash
$ aws configure
AWS Access Key ID [None]: AKIA................
AWS Secret Access Key [None]: ........................................
Default region name [None]: ap-northeast-1
Default output format [None]: json
```

The four prompts are:

- **Access Key ID / Secret Access Key**: your <Term en="Access Key" desc="A key pair that works like a username and password to prove your identity; the Secret Access Key is shown only once, so store it carefully.">keys</Term> (like a username and password).
- **Default region**: the region you'll operate in by default (e.g. Tokyo `ap-northeast-1`).
- **Default output format**: the format of command results; `json` is fine for beginners.

:::warning[🚑 Key security: the most important part]
- **Your Access Key is literally your key.** If leaked, others can spend money and delete data on your account. **Never** paste it into code, screenshots, chat messages, or a public GitHub repo.
- **Prefer Roles or temporary credentials** over long-term keys. This is exactly why CloudShell is recommended for beginners — it uses temporary credentials automatically, so you never manage keys by hand.
- If you must use a key, remember to **disable or delete it** in IAM when you're done.
:::

## When to use which?

None of the three is "more advanced" than the others — it's only about which fits the situation:

| Situation | Recommended tool | Why |
| --- | --- | --- |
| First-time exploring, learning, viewing resources | **Console** | The graphical interface is intuitive, shows the big picture, no commands to memorize |
| Repetitive operations, scripting and automation | **CLI** | One line beats twenty clicks, and it can run on a schedule |
| Large-scale, reproducible infrastructure | **IaC** | Define the whole environment as code — version-controlled and repeatable |

We'll only touch on <Term en="Infrastructure as Code" desc="Defining your whole environment — servers, networks, and more — as code, so you can recreate it with one command.">IaC (Infrastructure as Code)</Term> briefly here. Common tools are **CloudFormation** (AWS-native), **CDK** (write it in a programming language), and **Terraform** (cloud-agnostic). You can dig into these once you're more comfortable — as a beginner, getting fluent with the Console and CloudShell first is the most practical move.

:::info[How the exam tests this]
The exam won't ask you to memorize every CLI flag, but it does test **concepts**: e.g. "To automate and repeatably deploy an entire environment, what should you use?" The answer points to **IaC (CloudFormation)**, not manually clicking in the Console. Just remember each tool's "best-fit situation".
:::

## 🛠️ Hands-on: open CloudShell and see who you are

No install, no key setup — your first command is three steps away:

1. Log in to the AWS **Console** and confirm the **Region** in the top-right is the one you want.
2. Click the **CloudShell icon** (`>_`) in the top toolbar and wait for the terminal to open (the first time takes a few dozen seconds).
3. Type the following and press Enter:

```bash
$ aws sts get-caller-identity
```

The `Arn` and `Account` it returns are "you, right now" in AWS's eyes. Congratulations — you've just talked to AWS with a command!

<Refs title="📚 Official docs & further reading">

- [AWS Docs: Getting started with the AWS Management Console](https://docs.aws.amazon.com/awsconsolehelpdocs/latest/gsg/getting-started.html)
- [AWS Docs: AWS CloudShell User Guide](https://docs.aws.amazon.com/cloudshell/latest/userguide/welcome.html)
- [AWS Docs: AWS CLI User Guide (install & configure)](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-welcome.html)
- [AWS Docs: IAM security best practices (key management)](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)

</Refs>

👉 Next: [Your First Hands-On: EC2 + S3](./first-hands-on.md)
