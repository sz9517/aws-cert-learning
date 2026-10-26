---
sidebar_position: 6
title: AI-Assisted Development (New in C03)
---

# AI-Assisted Development: Amazon Q Developer (New in C03)

The biggest difference between DVA-C03 and the older C02 is that **AI-assisted development is now officially part of the exam guide**. This is not marketing talk — it reflects **how developers actually work today**: you open your IDE and an AI assistant helps you complete code, explain code written by others, spot possible bugs, and generate unit tests as you go. AWS wants to confirm that, beyond wiring up services with the SDK, you also know how to **bring AI tools into your development workflow and use them responsibly**.

<Scenario title="Real scenario: something you already do">

You get a requirement to write an <Term en="Lambda">AWS Lambda</Term> function that processes <Term en="Simple Queue Service">SQS</Term> messages and writes to <Term en="DynamoDB">DynamoDB</Term>. In the past you would dig through the docs, copy and paste boilerplate, and slowly piece it together. Now you describe the requirement in natural language inside your IDE, and the AI first produces the skeleton, the SDK calls, and the error handling. You then review it line by line, fix it, and add tests. You go faster, but **the responsibility for judging whether it is correct still sits with you** — and that is exactly what C03 wants to test.

</Scenario>

## Why C03 includes AI-assisted development

<Analogy title="🏢 Analogy: a junior colleague, not a magic helper">

Think of the AI assistant as a **very eager junior colleague who has read a huge amount of code**: it is fast, knows the boilerplate, and often gives you a good starting point. But it **does not guarantee it is right every time**, and it does not understand your project's business rules or security requirements. You are the senior one, responsible for **reviewing, gatekeeping, and owning the result**. The exam asks you from the "senior developer" angle: when the AI hands you something, how do you judge whether it is safe to use.

</Analogy>

Development teams have long used AI to complete code. By folding this into the certification, AWS wants you to have three abilities:

- **Use it**: know what AI tools can do for you and where they save time.
- **Read it**: understand what the AI's output does, be able to explain it and spot mistakes.
- **Gatekeep it**: know where you cannot blindly trust it (security, correctness, cost), and review by hand where needed.

## Why do developers use it? Benefits and trade-offs

First, the plain-language benefits — why everyone reaches for it:

- **Speed**: no more digging through docs to piece together boilerplate, SDK calls, and config formats; one sentence gives you a skeleton, so development is clearly faster.
- **Less boilerplate**: repetitive, low-thought code (standard error handling, pagination loops, creating a client) can be generated, freeing you to focus on business logic.
- **Finds bugs / explains code**: paste a failing snippet or old code you do not understand, and it points out likely problems and explains in plain language — especially handy when you inherit someone else's code.
- **Fills in tests**: unit-test boilerplate is the most tedious part; let it produce a batch with edge cases first, then you add scenarios specific to your project.

But every benefit has a matching cost. Both the exam and real work expect you to articulate this trade-off clearly:

| Benefit (what is good) | Drawback / risk (what to watch) |
| --- | --- |
| Fast, saves time, low barrier to start | May produce code that **looks correct but is actually wrong** (hallucination, wrong business rules) |
| Fills in boilerplate, less repetitive typing | May grant **overly broad IAM permissions** (such as `*`), planting a security hole |
| Explains code, speeds up handovers | **Security concerns**: hard-coded secrets, missing input validation, outdated patterns |
| Auto-generates tests, raises coverage | It **does not understand your project context** (business rules, compliance, cost limits) |

:::info[🔑 Grab the point in one line]
The value of AI is **freeing you from boilerplate and doc-hunting** so you can focus on judgment and design; but "fast" does not mean "correct" — some of the time you save has to be **paid back as review**.
:::

## When to be extra careful / what you cannot hand over fully

Not every kind of code is safe to "generate and ship." **The more it touches money, permissions, security, or personal data, the less you can hand it fully to the AI** — it must be reviewed by hand, or even rewritten:

- **Payment / billing logic**: charges, refunds, reconciliation, idempotency (retrying the same transaction must not double-charge). These errors turn directly into money lost, and the AI does not know your reconciliation rules.
- **Permission configuration (IAM)**: the AI loves to take the easy path and grant `Action: "*"` or `Resource: "*"`. Production must be narrowed to **least privilege** — you decide exactly which actions and which resources are actually needed.
- **Security and sensitive data**: encryption/decryption, handling of keys and secrets, input validation and injection defense, authentication / authorization flows — a mistake here is a security incident.
- **Compliance**: personal data, audit logs, data-retention policy — only you (and your company) know these rules.

:::tip[💡 A rule for judging]
Ask yourself one question: **"If this code is wrong, what is the worst that happens?"** If it only breaks the layout, go ahead and let the AI draft it. But the moment it could cause **money loss, data leakage, or excessive permissions**, treat the AI output as a "draft" and review it line by line before shipping.
:::

## Amazon Q Developer: the AI assistant inside your IDE

<Vocab title="📌 Terms to know first">

- **Amazon Q Developer**: AWS's AI development assistant, integrated into IDEs such as VS Code and JetBrains, with a CLI version too. It can chat, generate code, explain code, review, and transform or upgrade code.
- **Inline suggestions**: as you type, it completes the following code based on context; press Tab to accept.
- **Code transformation / upgrade**: automatically upgrades an older language version or framework to a newer one (for example, a Java version upgrade), saving a lot of manual rewriting.

</Vocab>

**Amazon Q Developer** is the AWS-provided AI assistant integrated inside your IDE. For DVA-C03, it is enough to remember the categories of capability it covers:

| Capability | What it does for you | How you use it while developing |
| --- | --- | --- |
| **Code generation** | Produces code and boilerplate from natural language or context | "Write me a Lambda that reads an S3 object" gives you a skeleton |
| **Explaining existing code** | Describes in plain language what a piece of code does | Ask it when you inherit code you do not understand |
| **Automated review** | Scans for potential bugs, quality, and security issues | Let it scan before you send for review |
| **Code transformation / upgrade** | Automatically upgrades an older language or framework | Bulk Java version upgrades, dependency updates |
| **Generating unit tests** | Produces test cases for a function | Fill in test coverage and skip hand-written boilerplate |

:::tip[💡 Exam focus]
The exam will not ask you where the Amazon Q Developer button is. It tests the **concept and positioning**: it is the **AI development assistant inside your IDE** that can **generate, explain, review, transform, and produce tests**. The theme is always "**AI speeds things up, but humans still gatekeep**."
:::

## How you use it in a real workflow

Walk through a typical Lambda development flow and see how AI helps at each step:

<div className="flow">
<div className="flow-node">Describe requirement</div>
<div className="flow-arrow">→</div>
<div className="flow-node">Generate skeleton / boilerplate</div>
<div className="flow-arrow">→</div>
<div className="flow-node">Human review and fix</div>
<div className="flow-arrow">→</div>
<div className="flow-node">Generate unit tests</div>
<div className="flow-arrow">→</div>
<div className="flow-node">Find bugs / optimization tips</div>
</div>

1. **Write a Lambda, generate boilerplate**: describe it in natural language ("process SQS events, write to DynamoDB, with retries") and let it produce the function skeleton, SDK calls, and basic error handling. You skip the doc-reading and boilerplate typing.
2. **Explain existing code**: when you inherit code you do not understand, ask it to explain section by section so you get up to speed fast.
3. **Find bugs**: paste the failing code or the error message and ask it to analyze likely causes and suggest fixes.
4. **Write tests**: ask it to generate unit test cases for a function (including edge cases), then add the scenarios specific to your project.
5. **Optimization tips**: ask it to look at a piece of code and suggest a more efficient or best-practice approach (for example, using batch writes instead of calling once per item).

<Scenario title="Real scenario: treat it as a starting point, not the finish line">

The Lambda skeleton the AI gives you might **miss idempotency handling**, **use overly broad IAM permissions**, or **not handle partial batch failures**. These are exactly the development details the DVA loves to test. The AI helps you start, but the judgment of whether these are right is what the exam wants **you** to do.

</Scenario>

## Responsible use: humans still gatekeep

This is the concept C03 **most wants to stress** about AI, and the angle most likely to appear in questions: **AI is an assistant, not the final decision-maker.**

:::warning[🚑 Do not blindly trust AI output]
AI-generated code is **not guaranteed correct, not guaranteed secure, and not guaranteed optimal**. Common risks:

- **Correctness**: logic that looks reasonable but hides a bug, or does not match your business rules.
- **Security**: it may grant overly broad IAM permissions, hard-code secrets in the code, or skip input validation.
- **Best practice**: it may use an outdated or inefficient approach.

**Every piece of AI output needs human review** — just like reviewing a junior colleague's pull request.
:::

:::info[🔑 Remember it in one line]
**AI is responsible for speed; humans are responsible for the result.** Output only counts once it passes your understanding, review, and testing. When a question mentions AI, the option pointing toward **"a human still needs to review / validate" is usually the correct direction**.
:::

:::warning[🚑 Common traps]
These are where AI-assisted development most often goes wrong, and the kind of trap answers the exam loves to design:

- **Blindly shipping output**: treating "it seems to run" as "it is correct," sending it to production without understanding it line by line or testing it.
- **Pasting keys / secrets into the prompt**: dropping access keys, passwords, connection strings, or production data into the chat so the AI "understands" — that sends sensitive data out. Use **placeholders** instead (such as `<YOUR_API_KEY>`).
- **Merging to production without review**: treat AI output as a "draft" only; it must pass code review, testing, and a security check before it merges to the main branch.
- **Ignoring least privilege**: adopting the AI's `"*"` permissions for convenience, without narrowing to the actions and resources actually needed.
- **Letting it touch code you do not understand**: asking it to "upgrade / refactor" a large chunk you cannot read without validating — when something breaks you will not even know where.
- **Ignoring cost impact**: the AI may hand you a "works but expensive" approach (per-item calls, no pagination, no caching) that blows up the bill once production traffic hits.
:::

## A concrete example: ask Q for a Lambda handler — what to check

Suppose you ask Amazon Q Developer: "Write me a Node.js Lambda handler that processes SQS messages and writes to DynamoDB." It quickly hands you a chunk of code that looks complete. **Do not rush to use it** — gatekeep it point by point with this checklist:

<div className="flow">
<div className="flow-node">AI generates skeleton</div>
<div className="flow-arrow">→</div>
<div className="flow-node">Check permissions and secrets</div>
<div className="flow-arrow">→</div>
<div className="flow-node">Check correctness and retries</div>
<div className="flow-arrow">→</div>
<div className="flow-node">Add tests, send for review</div>
</div>

| Checkpoint | What to ask yourself / what to fix |
| --- | --- |
| **IAM permissions** | Did it grant the execution role `dynamodb:*` and `Resource: "*"`? Narrow it to only the needed action (such as `dynamodb:PutItem`) and the ARN of **that one table**. |
| **Keys / secrets** | Did it **hard-code** a key or connection string in the code? Switch to **environment variables**, and keep sensitive values in Secrets Manager / Parameter Store. |
| **Idempotency** | SQS may **redeliver the same message**. Is the DynamoDB write idempotent (conditional write, using the message ID as the key)? Otherwise you double-write — and in a payment scenario you double-charge. |
| **Partial batch failures** | If a batch of several messages fails halfway, does it report `batchItemFailures`? Otherwise the whole batch retries and the already-succeeded ones are redone. |
| **Error handling** | Are exceptions swallowed? Do failed messages go to a DLQ, or silently vanish? |
| **Input validation** | Does it blindly trust the `event` contents? Malicious or malformed messages should be validated before processing. |
| **Cost / efficiency** | Is it a per-item `PutItem` or a `BatchWriteItem`? At volume, per-item calls are both slow and expensive. |

:::tip[💡 The point is not generating code, it is gatekeeping]
The skeleton the AI produced saved you the doc-reading time, but the judgment on this checklist — **narrowing permissions, idempotency, retries, cost** — is exactly the development detail DVA-C03 Domain 1 loves to test, and the part the AI **cannot do for you**. Treat the AI as a "junior colleague who hands in a draft," and you own the review.
:::

## How AI runs through all four DVA domains

C03 does not cram AI into one chapter — it **weaves it through all four domains**. See it as a single thread:

<div className="flow">
<div className="flow-node">Domain 1 generate code</div>
<div className="flow-arrow">→</div>
<div className="flow-node">Domain 3 generate tests</div>
<div className="flow-arrow">→</div>
<div className="flow-node">Domain 3 CI/CD approval</div>
<div className="flow-arrow">→</div>
<div className="flow-node">Domain 4 debugging</div>
<div className="flow-arrow">→</div>
<div className="flow-node">Domain 4 performance tips</div>
</div>

| Domain | Where AI assistance fits in |
| --- | --- |
| **1. Development with AWS services (30%)** | Generate Lambda / SDK boilerplate, explain existing code, automated review |
| **3. Testing and deployment (22%)** | Generate unit / regression tests; automated deployment approval in CI/CD |
| **4. Troubleshooting and optimization (22%)** | Error analysis and debugging tips, performance optimization tips |

(Domain 2, Security, works the other way around — the AI's output itself must pass a **security review**; do not let it hand out permissions and secrets carelessly.)

:::tip[💡 How this site handles it]
This site treats AI-assisted development as a **cross-domain bonus highlight** and covers it in one dedicated article (this one). Other domain articles only mention it briefly instead of repeating the full explanation. You just need to remember the main thread: "the AI helper can show up at every step, but humans must gatekeep."
:::

<Refs title="📚 Official docs & further reading">

- [Amazon Q Developer (official product page)](https://aws.amazon.com/q/developer/)
- [Amazon Q Developer User Guide](https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/what-is.html)
- [Amazon Q (AWS documentation overview)](https://docs.aws.amazon.com/amazonq/)

</Refs>

👉 Review: [Domain 1 Flashcards](./flashcards.md)
