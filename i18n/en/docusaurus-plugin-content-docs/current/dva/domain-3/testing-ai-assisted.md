---
sidebar_position: 5
title: Testing and AI-Assisted Testing (New in C03)
---

# Testing and AI-Assisted Testing: Catch Bugs Before Launch, and Let AI Help Write Tests

> This article takes a "developer's point of view" on the testing topics in DVA-C03 Domain 3: why you test, which layers testing comes in (unit vs integration), how to mock AWS services with **moto**, how to run Lambda on your own machine with **SAM local**, how to run tests in CI, and finally the brand-new **"AI-assisted testing"** added in C03 — using **Amazon Q Developer** to auto-generate unit tests, regression tests, and edge cases. The exam asks you "which testing layer fits this scenario" and "how do I test AWS interactions cheaply" — exactly what this article makes clear.

<Vocab title="📌 Terms you will see in this article (clear even if this is all new)">

- **Unit Test**: a test for just **one small piece of code** (usually a single function). All external dependencies (database, network, AWS) are blocked out, so it only checks "is this logic itself correct." Runs extremely fast and is almost free.
- **Integration Test**: a test for **several pieces wired together**, for example "can my Lambda really write to DynamoDB." It touches real or near-real external services, so it is slower and more expensive.
- **Mock (stand-in)**: a **fake stand-in** that replaces a real external service. Your code thinks it is talking to AWS, but it is really talking to a fake object you set up that returns the fake data you specify. This lets a unit test avoid actually connecting to AWS.
- **moto**: the most common Python library for **mocking AWS services entirely**. It pretends in memory that an S3 / DynamoDB / SQS exists, your boto3 code calls it as usual, and nothing actually touches the cloud or costs a cent.
- **SAM local**: a feature of the AWS SAM CLI that uses Docker to simulate the Lambda execution environment on **your own machine**, so you can `invoke` functions and start an API locally without deploying to the cloud every time.
- **CI (Continuous Integration)**: a pipeline that **automatically builds and tests** on every code push (such as CodeBuild or GitHub Actions). If tests fail, it blocks the change and keeps bad code out of the main line.
- **Regression Test**: a test that confirms "**features that used to work still work after you change something new**." It stops a fix to A from breaking B.
- **Edge Case**: an "extreme / weird / empty / huge" input outside the normal range, for example an empty string, a negative number, a very long list, or null. Bugs love to hide here.

</Vocab>

:::note[💬 Reading tip]
Whenever you see a <Term desc="Like this! Hover over any term with a dotted underline (tap on mobile) and a plain-language explanation pops up.">term with a dotted underline</Term>, hover over it for a plain-language explanation. All terms are also collected in the [Glossary of terms and services](/glossary).
:::

## Why test? A "shipped without testing" disaster first

Say you wrote an order-processing Lambda, changed one line of discount math, figured "such a tiny change is surely fine," and deployed straight to production. That one line made the amount go negative when "the discount code is empty" — so placing an order meant **you paid the customer**. You only found out when complaints rolled in, after burning a whole afternoon of losses.

Testing is the mechanism that catches that kind of bug **before launch**. You first write in code "feed this function X, it should return Y," then re-run it on every change. The moment the logic gets broken, the test turns red and you see it on your own machine — instead of letting users debug for you.

For a developer, testing is not just about "finding bugs" — it is what **lets you change code with confidence**: with a full suite of tests watching your back, you have the nerve to refactor, upgrade, and change logic, because if you break something the tests tell you immediately. DVA-C03 makes "testing" a major part of Domain 3, and what it tests is whether you know how to **test correctly inside the development workflow**.

## Testing layer one: unit tests (test one small piece, block out all external dependencies)

A unit test only verifies "**is this function's own logic correct**." The key is: **mock out all the external things (AWS, database, third-party APIs)**, so the test runs fast, costs nothing, is immune to the network, and when it fails you can be sure "my logic is wrong, not AWS being down."

<Analogy title="🏢 Analogy: a unit test is like the closed-course part of a driving test">

The closed course (unit test) happens on a **closed, controlled lot** where the cones and S-curve are fake and fixed, testing just one skill: "can you handle the wheel." No real pedestrians or real traffic lights interfere — because those are all "mocked" out. Only once each basic skill passes do you move onto a real road (integration test).

</Analogy>

```python
# Function under test: compute final amount, no discount when code is empty
def calc_total(price, discount_code):
    if not discount_code:          # edge case: empty string / None
        return price
    if discount_code == "SAVE10":
        return round(price * 0.9, 2)
    raise ValueError("unknown code")

# Unit tests (pytest): no AWS, no network at all
def test_no_code_no_discount():
    assert calc_total(100, "") == 100          # the case that caused the incident

def test_valid_code():
    assert calc_total(100, "SAVE10") == 90.0

def test_unknown_code_raises():
    import pytest
    with pytest.raises(ValueError):
        calc_total(100, "WRONG")
```

These three tests run in under a second on your machine at zero cost, yet they precisely block the earlier "empty discount code goes negative" disaster.

## Testing layer two: mocking AWS services (moto)

Real Lambdas almost always touch AWS: write to DynamoDB, read from S3, push to SQS. Here is the problem — **in a unit test you must not actually connect** (slow, needs credentials, creates data, costs money). The fix is to use <Term en="moto" desc="The most common Python AWS-mocking library; it pretends in memory that services like S3/DynamoDB exist, boto3 calls them as usual but nothing touches the cloud.">moto</Term> to "pretend" the whole AWS service exists.

Your code calls `put_item` and `get_object` through boto3 as usual, but in the test moto intercepts it, data lives in a **fake service in memory**, and it vanishes when the test ends. Nothing touches the cloud, nothing costs money, and no real credentials are needed.

```python
import boto3
from moto import mock_aws

# Function under test: write one order into DynamoDB
def save_order(order_id, amount):
    table = boto3.resource("dynamodb").Table("orders")
    table.put_item(Item={"id": order_id, "amount": amount})

@mock_aws                                  # this decorator mocks all of AWS
def test_save_order():
    # First create the table in the "fake" DynamoDB
    ddb = boto3.resource("dynamodb", region_name="us-east-1")
    ddb.create_table(
        TableName="orders",
        KeySchema=[{"AttributeName": "id", "KeyType": "HASH"}],
        AttributeDefinitions=[{"AttributeName": "id", "AttributeType": "S"}],
        BillingMode="PAY_PER_REQUEST",
    )

    save_order("A1", 100)                  # call function under test (writes to fake table)

    item = ddb.Table("orders").get_item(Key={"id": "A1"})["Item"]
    assert item["amount"] == 100           # verify it really got written
```

:::info[🔑 The point of moto: it tests whether YOUR code calls AWS correctly]
moto verifies "did you use the right API, pass the right parameters, handle the return value right" — **not** whether AWS itself is correct (that is AWS's job). It runs in memory with no network round-trip, so it is **extremely fast and free**, ideal for unit tests that run on every push. But it is after all a **simulation**, so its behavior is not 100 percent identical to real AWS (IAM permissions, service limits, extreme edges) — which is exactly why you still need integration tests.
:::

## Testing layer three: local testing (SAM local)

The <Term en="AWS SAM CLI" desc="The command-line tool for the AWS Serverless Application Model; it can simulate the Lambda execution environment locally with Docker and start a local API.">SAM CLI</Term> can use Docker to simulate the Lambda execution environment on **your own machine**, so you do not have to deploy to the cloud and wait every time you change a line. Two common moves:

- **`sam local invoke`**: feed an event JSON to your function once and watch the output and logs right in the terminal. Great for quickly checking "how does the handler react to this event."
- **`sam local start-api`**: start a simulated API Gateway locally at `http://127.0.0.1:3000`, then hit it with a browser or curl as if calling it in the cloud.

```bash
# Run the Lambda once locally with a sample event (no cloud)
sam local invoke OrderFunction --event events/order.json

# Start a simulated API locally, then curl http://127.0.0.1:3000/orders
sam local start-api
```

:::tip[💡 SAM local vs moto, how to tell them apart?]
- **moto**: inside your **test code** it fakes the AWS API responses, testing "your function logic plus whether it calls the AWS SDK correctly." Used for unit tests.
- **SAM local**: actually runs a **Lambda-like execution environment on your machine** (Docker), testing **deployment-level** things like packaging, handler configuration, event format, and API routing. Closer to an integration test, but still on your machine and free of cloud cost.
:::

## Testing layer four: running tests in CI (let the machine be the gatekeeper)

Remembering to run tests yourself is not enough — people forget and cut corners. <Term en="Continuous Integration" desc="A pipeline that auto-builds and runs tests on every push; if tests fail it blocks the change so bad code stays out of the main line.">CI (Continuous Integration)</Term> binds tests into the pipeline: **on every code push the machine runs the tests automatically, and blocks the change if they fail**, keeping bad code from merging into the main line or deploying to production.

The most typical setup on AWS is **CodeBuild** (which CodePipeline can chain together), using a `buildspec.yml` that describes "install dependencies, then run tests":

```yaml
# buildspec.yml -- CodeBuild runs this automatically every time
version: 0.2
phases:
  install:
    runtime-versions:
      python: 3.12
    commands:
      - pip install -r requirements.txt pytest moto
  build:
    commands:
      - pytest -q        # any failing test makes CodeBuild FAILED and stops the pipeline
```

:::info[🔑 The core value of CI: tests only matter if they run automatically every time]
A beautifully written test suite that just sits in the repo and no one runs is as good as nonexistent. The point of CI is to turn it into a **mandatory gate before deployment**: only a green light lets the change move forward. The exam often steers "how do I make sure bad code is never deployed" toward "run automated tests in the build/test stage of the pipeline."
:::

## 🤖 New in C03: AI-assisted testing (Amazon Q Developer)

This is the **biggest new topic in DVA-C03 relative to C02**: bringing an AI coding assistant like **<Term en="Amazon Q Developer" desc="AWS's AI coding assistant; it can generate code, unit tests, find bugs, and explain code inside the IDE, and fit into the dev/CI workflow.">Amazon Q Developer</Term>** into your testing workflow. The exam asks "which testing tasks can AI help with" and "what do you watch out for in AI-generated tests."

A few things AI-assisted testing can help with:

| What AI can help with | How you use it | What the developer gets |
| --- | --- | --- |
| **Auto-generate unit tests** | Select a function and ask Q Developer "write pytest unit tests for this function" | A batch of test scaffolding in seconds, saving hand-written time |
| **Find edge cases** | Ask AI "list this function's likely edge and exception inputs and write matching tests" | Fills in cases you missed, such as empty, negative, or very long inputs |
| **Generate regression tests** | After a change, ask AI "add regression tests for this change" | Locks in existing behavior, stops a fix to A from breaking B |
| **Automate in CI/CD** | Fold the AI-generated tests into `pytest`, run automatically by CodeBuild/pipeline each time | AI-generated tests are treated the same as hand-written ones at the gate |

<Analogy title="🏢 Analogy: AI-assisted testing is like a very eager intern">

Amazon Q Developer is like an **intern who types fast and never tires**: you say "write a batch of tests for this function and consider the weird inputs too," and in seconds you get a stack of drafts. But the intern **does not understand your business rules** — they do not know that "the amount must never go negative when the discount code is empty" is your company's ironclad rule. So when the drafts come back, **the senior you must review every one**: does this test really verify the important thing? Is the assertion correct? Do not ship the intern's drafts as finished work.

</Analogy>

:::tip[💡 Exam focus: how AI-assisted testing is tested]
- When you see **"how do I speed up writing unit tests / find unexpected edge cases / generate regression tests"** - think **Amazon Q Developer** (generate tests inside the IDE).
- AI-generated tests still must be **folded into your existing test framework (pytest, etc.) and run automatically in CI/CD** - not just run once.
- Core idea: AI **speeds up** output but does **not replace** the developer's judgment - generated tests must be **reviewed by a human** to confirm they really verify the correct behavior.
:::

## 🧭 Fixed section: why split into testing layers? What does each catch? How to trade off?

This section distills everything above into a decision view in plain language — the exam and real work love asking "which layer fits this scenario."

**Why split into layers (instead of just using integration tests for everything)?**
Because each layer differs wildly in **speed, cost, and the kind of bug it catches**. Use only slow, expensive integration tests and you will get so slow you stop wanting to run them and so expensive you do not dare to — and in the end you just stop testing. Layering is about "**run the cheap ones often, run the expensive ones precisely and rarely**."

**What each layer catches:**

| Layer | What it catches | Speed / Cost | Touches AWS? |
| --- | --- | --- | --- |
| **Unit test** (+moto) | **Logic bugs** in a single function, unhandled edges | Very fast / nearly zero | No (moto pretends) |
| **Local test** (SAM local) | Bugs in **packaging, handler config, event format, API routing** | Fast / zero (local Docker) | Simulated environment |
| **Integration test** (real resources) | Bugs in **permissions (IAM), real service behavior, wiring** | Slow / costs money, has side effects | Touches real AWS |

**How to trade off (the industry "test pyramid"):**

<div className="flow">
  <div className="flow-node">Many unit tests (fast, cheap, run daily)</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Some local/integration tests (critical paths)</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Few end-to-end tests (real environment, most expensive)</div>
</div>

Put the **most** unit tests at the bottom (fast and cheap, run on every push), and gradually fewer integration and end-to-end tests toward the top (slow and expensive, run only on critical paths and before deployment). **AI-assisted testing mainly helps you quickly stack up that bottom layer of unit tests**, but the higher up you go, the more human design of real scenarios it needs.

## 🛠️ Hands-on: write a unit test + mock for a Lambda, and run it locally with SAM

Follow along once and you will have walked the whole path of "write test, mock AWS, verify locally."

```bash
# 1) Install the testing tools
pip install pytest moto boto3

# 2) Assume the project looks like this
#    app/handler.py   <- Lambda code
#    tests/test_handler.py  <- tests
```

```python
# app/handler.py -- write the order from the event into DynamoDB
import boto3

def lambda_handler(event, context):
    amount = event["amount"]
    if amount < 0:
        raise ValueError("amount must be >= 0")   # edge: no negatives
    boto3.resource("dynamodb").Table("orders").put_item(
        Item={"id": event["id"], "amount": amount}
    )
    return {"statusCode": 200, "body": f"saved {event['id']}"}
```

```python
# tests/test_handler.py -- mock out DynamoDB with moto
import boto3, pytest
from moto import mock_aws
from app.handler import lambda_handler

@mock_aws
def _setup_table():
    ddb = boto3.resource("dynamodb", region_name="us-east-1")
    ddb.create_table(
        TableName="orders",
        KeySchema=[{"AttributeName": "id", "KeyType": "HASH"}],
        AttributeDefinitions=[{"AttributeName": "id", "AttributeType": "S"}],
        BillingMode="PAY_PER_REQUEST",
    )
    return ddb

@mock_aws
def test_happy_path():
    _setup_table()
    res = lambda_handler({"id": "A1", "amount": 100}, None)
    assert res["statusCode"] == 200

@mock_aws
def test_negative_amount_rejected():    # edge case (the kind AI often adds for you)
    _setup_table()
    with pytest.raises(ValueError):
        lambda_handler({"id": "A2", "amount": -5}, None)
```

```bash
# 3) Run the tests
pytest -q
```

**Expected result:**

```text
..                                                       [100%]
2 passed in 0.23s
```

Seeing **`2 passed`** means: the happy path writes correctly into the (mocked) DynamoDB, and a negative amount is correctly blocked — all while **never touching real AWS, spending nothing, and finishing in under a second**.

```bash
# 4) (Optional) Actually run a Lambda execution environment locally with SAM
sam local invoke OrderFunction --event events/order.json
```

**Expected result of `sam local invoke`**: the terminal prints logs of Docker spinning up the execution environment, followed by the JSON your handler returns, for example:

```text
START RequestId: ... Version: $LATEST
END RequestId: ...
{"statusCode": 200, "body": "saved A1"}
```

:::warning[🚑 Common pitfalls]
- **Only testing the happy path**: only verifying "normal input succeeds" and never testing empty, negative, or exception inputs. Bugs love the edges — the earlier "empty discount code goes negative" is exactly what happens when you do not test edges.
- **Integration tests hitting real resources**: running tests directly against production S3 / DynamoDB **creates real data, costs money, and has side effects** (it can even pollute production data). Always mock in unit tests with something like **moto**; for a real integration test, use a **separate test account/environment** and clean up afterward.
- **No one reviews AI-generated tests**: tests from Amazon Q Developer may have **loose assertions** (for example only checking "something was returned" without verifying "the return value is correct"), looking green while missing the point. AI output **must be reviewed by a human** to confirm it really verifies the correct behavior.
- **Not putting tests in CI is the same as not having them**: tests that just sit in the repo and rely on people remembering to run them will eventually be skipped. Always bind them into **CodeBuild/pipeline** as a mandatory gate before deployment.
- **Tests depending on real credentials**: putting real AWS keys in tests (or assuming the environment is logged in) is both insecure and makes tests fail to run on someone else's machine or in CI. Unit tests with moto need **no credentials at all**; when you need an identity, use a CI role — do not hard-code keys into code or tests.
:::

<Refs title="📚 Official docs & further reading">

- [Testing AWS Lambda functions (unit / integration / local)](https://docs.aws.amazon.com/lambda/latest/dg/testing-functions.html)
- [AWS SAM CLI local testing (sam local invoke / start-api)](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/using-sam-cli-local.html)
- [Amazon Q Developer User Guide](https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/what-is.html)
- [Amazon Q Developer: generating unit tests](https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/test-generation.html)
- [AWS CodeBuild buildspec reference](https://docs.aws.amazon.com/codebuild/latest/userguide/build-spec-ref.html)

</Refs>

## Next step

👉 Review: [Domain 3 Flashcards](./flashcards.md)
