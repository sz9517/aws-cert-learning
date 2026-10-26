---
sidebar_position: 1
title: IAM for Developers
---

# IAM for Developers: give your code an identity and permissions, without pasting keys everywhere

> This article takes a developer's view of IAM: how your application actually gets permissions (EC2 instance profiles, calling STS `AssumeRole` in code, the default credential provider chain), the difference between identity-based and resource-based policies, how to apply least privilege, why temporary credentials beat long-term keys, and above all why you use a role instead of handing your program a set of long-term keys. These are exactly the development details DVA-C03 Domain 2 (Security, 26%) loves to test, closer to the code than SAA.

<Vocab title="📌 Terms you will meet here (clear even if brand new)">

- **IAM (Identity and Access Management)**: AWS's identity and permissions system. It decides who (an identity) can do what (actions) to which resources (S3, DynamoDB, and so on).
- **Principal**: the identity making a request, which may be an IAM user, a role, or an AWS service.
- **Policy**: a JSON document that uses `Effect` (Allow/Deny), `Action` (such as `s3:GetObject`), and `Resource` (which ARN) to describe whether an action is allowed.
- **Role**: a set of permissions that can be assumed temporarily, with no long-term password or keys of its own. Programs, EC2, and Lambda all assume a role to get permissions, then give it back.
- **STS (Security Token Service)**: the service that issues temporary credentials. You call `AssumeRole` and it hands you a set of keys that expire.
- **Temporary Credentials**: a short-lived set of keys (minutes to hours) made of three values: Access Key ID, Secret Access Key, and a Session Token. They expire automatically.
- **Instance Profile**: a container for a role that is attached to an EC2 instance, so code on that instance automatically receives the role's temporary credentials.

</Vocab>

:::note[💬 Reading tip]
Whenever you see a term with a <Term desc="Like this! Hover over the dotted underline (tap on mobile) to see a plain explanation.">dotted underline</Term>, hover over it for a plain explanation. All terms are also collected in the [Glossary](/glossary).
:::

## Why IAM? First, a disaster where keys were pasted into the code

Say you wrote a program running on EC2 that writes processed files into <Term en="Simple Storage Service" desc="AWS cloud object storage for files.">S3</Term>. To call an AWS API, the program must prove it has permission.

The most intuitive and most dangerous approach: go to IAM, generate an <Term en="Access Key" desc="A long-lived key pair (Access Key ID + Secret Access Key) representing an IAM user's identity; it does not expire on its own.">access key</Term>, and paste the Access Key ID and Secret straight into the code. The result:

- That key never expires. Once leaked (pushed to GitHub, printed to a log, seen by a colleague), anyone can impersonate you forever.
- It is hard to know who is actually using the key, and hard to rotate it cleanly.
- When it really leaks, scanner bots on the internet grab it within minutes and spin up a pile of mining instances, and the bill explodes.

The right answer from <Term en="Identity and Access Management" desc="AWS's identity and permissions system; policies decide who can do what to which resources.">IAM</Term> is: do not hand long-term keys to your program. Instead, let the program assume a role, and let AWS automatically issue a set of temporary credentials that expire. The program never touches or stores any long-term secret. For a developer, the focus shifts from where do I hide the key safely to I do not hold a long-term key at all.

## Understand how IAM works in your code in one line

Your program carries no long-term keys. It runs in an environment that has a role (an EC2 instance profile, or a Lambda execution role), and the AWS SDK uses the credential provider chain to automatically find the role, exchange it at STS for temporary credentials, and sign every API request with them. The SDK auto-renews the credentials before they expire, and there is not a single key visible anywhere in your code.

<Analogy title="🏢 Analogy: an IAM role is like a company visitor badge">

- **A long-term access key = a master key you cut yourself**: you give an employee a physical key; if they lose it or it gets copied, the door stays open forever, and you do not even know who did it.
- **An IAM role = a day-pass badge issued at the front desk**: the employee (your program) carries no key, but scans in at the desk (STS) to collect a badge that expires today. Expired badges stop working, a lost one is useless tomorrow, and every issue is logged.
- **An instance profile = automatic recognition for staff in this building**: an EC2 with a profile attached is recognized automatically the moment its program starts, so it skips the queue at the desk entirely.
- **Least privilege = the badge only opens rooms you should enter**: a finance badge should not open the server room. Grant just enough permission and no more.

</Analogy>

## Development detail 1: how does your application actually get permissions?

This is the most central and most commonly half-understood part for DVA. The key point: a program should almost never hold long-term keys itself. It relies on the chain below to obtain temporary credentials automatically.

### The default credential provider chain

When you build an SDK client (`boto3`, the JS SDK, the Java SDK, and so on) without specifying keys, the SDK looks for credentials in a fixed order, using the first one it finds:

<div className="flow">
  <div className="flow-node">1. Keys hard-coded in the program (not recommended)</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">2. Environment variables AWS_ACCESS_KEY_ID…</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">3. ~/.aws/credentials file (for local development)</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">4. The role from EC2/ECS/Lambda (instance profile)</div>
</div>

- **During local development**: usually `~/.aws/credentials` (created by `aws configure` or SSO), or environment variables for the short term.
- **Once in the cloud**: the last stop, temporary credentials provided by the environment (EC2 instance profile, ECS task role, Lambda execution role). This is the state you want: no long-term keys in either the code or the machine.

### EC2: the instance profile

When EC2 needs to give its program permissions, you do not stuff keys into the machine. Instead: create an IAM role, wrap it in an instance profile, and attach the profile to the EC2 instance. After that the SDK on the instance automatically fetches the role's temporary credentials from the <Term en="Instance Metadata Service" desc="An address inside an EC2 instance reachable only from the instance itself, where a program can automatically obtain the role's temporary credentials.">Instance Metadata Service (IMDS)</Term>, with nothing for you to manage.

```python
# Python on EC2: build the client without passing any keys
# boto3 automatically fetches temporary credentials from the instance profile (IMDS)
import boto3

s3 = boto3.client("s3")          # no access key, no secret
s3.put_object(Bucket="my-bucket", Key="out/result.json", Body=b"...")
# This succeeds because the role attached to this EC2 allows s3:PutObject to this bucket
```

### Calling `AssumeRole` in code (cross-account / switching permissions)

Sometimes you need to actively switch into another role, for example to reach another AWS account or temporarily gain higher permissions. Here you call STS `AssumeRole` directly, get back a set of temporary credentials, and use them to build the target client:

```python
import boto3

sts = boto3.client("sts")
resp = sts.assume_role(
    RoleArn="arn:aws:iam::222233334444:role/CrossAccountS3Reader",
    RoleSessionName="my-app-session",   # makes it easy to trace who assumed it in CloudTrail
)
creds = resp["Credentials"]  # contains AccessKeyId / SecretAccessKey / SessionToken

# Build the target account's S3 client with the temporary credentials
s3 = boto3.client(
    "s3",
    aws_access_key_id=creds["AccessKeyId"],
    aws_secret_access_key=creds["SecretAccessKey"],
    aws_session_token=creds["SessionToken"],   # temporary credentials MUST carry a SessionToken
)
```

:::info[🔑 How do temporary credentials differ from long-term keys? Look for the SessionToken]
A long-term access key has only two values (ID and Secret). Temporary credentials add a `SessionToken` and have an expiry time. If you see code passing `aws_session_token`, it almost always means these are STS-issued temporary credentials using a role, which is the good practice.
:::

## Development detail 2: identity-based vs resource-based policies

Both are JSON policies, but they attach in different places and answer different questions. DVA loves testing whether you can tell them apart:

| | **Identity-based** | **Resource-based** |
| --- | --- | --- |
| **Attached to** | an identity (IAM user / group / role) | a resource (S3 bucket, SQS queue, Lambda function) |
| **Question it answers** | What can this identity do, and to which resources? | Which principals can do what to this resource of mine? |
| **Has a `Principal` field?** | No (the principal is the identity it is attached to) | Yes, you must name the allowed principal |
| **Typical use** | give a role the ability to read S3 and write DynamoDB | S3 bucket policy, allow cross-account access, allow a service to invoke Lambda |

<Analogy title="🏢 Analogy: a staff badge vs the list at a room's door">

- **Identity-based policy = the permissions written on the staff badge**: the badge (role) itself is authorized to enter certain rooms.
- **Resource-based policy = the visitor list posted at a room's door**: the room (S3 bucket) sets its own rule for who is allowed in.
- The two are really two ways of writing the same authorization. For cross-account access you often set both: the source account's role needs an identity-based policy (I may go) and the target resource needs a resource-based policy (I allow you in).

</Analogy>

:::info[🔑 One-line test: is there a Principal]
A policy with `"Principal": {...}` is a resource-based policy (attached to a resource, naming who may come). No `Principal`, just `Action`/`Resource`, is an identity-based policy (attached to an identity). A trust policy (covered below) is a special resource-based policy attached to the role as a resource.
:::

## Development detail 3: least privilege

Least privilege means granting only just enough permission and no more. It is IAM's core principle and the default correct direction for DVA scenario questions.

```json
// Good: allow reading only one prefix of one bucket
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:GetObject"],
    "Resource": "arn:aws:s3:::my-bucket/reports/*"
  }]
}
```

```json
// Bad: wildcard permissions, meaning anything goes, almost always the wrong answer
{
  "Effect": "Allow",
  "Action": "*",
  "Resource": "*"
}
```

:::tip[💡 Exam tip: keywords for least privilege]
- A question about loosening permissions early in development and tightening at launch, or granting only necessary permissions, always points to least privilege: start narrow, then use IAM Access Analyzer to generate a tighter policy from actual usage, or look at CloudTrail to add missing permissions.
- An explicit Deny always beats an Allow. Across multiple policies, a single matching `Deny` means the request is refused.
- Treat any option with `Action: "*"` or `Resource: "*"` as a likely trap.
:::

## Development detail 4: temporary credentials and role chaining (why short-lived is safer)

Temporary credentials have an expiry (`AssumeRole` defaults to 1 hour, adjustable from 15 minutes to 12 hours). The benefit of being short-lived is that even if they leak, the attacker has only a short window to use them, and the SDK renews them automatically in the background, so your program does not break when a credential expires.

This mechanism lets programs on EC2, Lambda, and ECS touch only temporary credentials the whole time. Long-term keys are best reserved for the few cases where a role truly is not an option (such as some legacy systems outside AWS).

## 🧭 Set section: why use a role instead of handing long-term keys to your program?

This is the core decision of this article, and you must be able to explain it plainly:

**Why a role (what it solves)**
- The program holds no long-term keys at all, so there is no where do I hide the key safely problem, because there is no long-term key to leak.
- Credentials are short-lived and auto-rotated: they renew automatically with no rotation logic for you to write, and any leak is capped by time.
- Who assumed the role and what they did goes into CloudTrail (with `RoleSessionName`), giving clear auditing.
- The same `AssumeRole` model covers cross-account and cross-service access, cleanly and consistently.

**Pros**
- Much better security (no long-term secrets, automatic expiry, auditable).
- Less operational work (no manual issuing, hiding, or rotating of keys).
- Permissions are managed centrally on the role and can be tightened or revoked at any time.

**Cons / costs**
- The concept is more complex than pasting a key: you must understand roles, trust policies, `AssumeRole`, and the SessionToken.
- The trust policy direction is easy to get wrong (who may assume whom), and beginners often get stuck here.
- Temporary credentials expire, so a long-running process that does not use the SDK's auto-renewal and manages them by hand may fail partway.

**When to not use it (or be extra careful)**
- **A system running outside AWS that cannot reach an AWS identity source at all**: with no instance profile available, you may have to fall back to a long-term key. In that case apply least privilege plus regular rotation, or use IAM Roles Anywhere so on-premises systems can use roles too.
- **Local personal development**: a short-term `aws configure` profile or SSO is fine; do not build a whole AssumeRole setup just for local testing.
- Never paste long-term keys into code, or bake them into environment variables inside an image, for convenience. That is the most common and most serious anti-pattern.

## Real-world use: more than just the exam

<Scenario title="Real scenario: let a program on EC2 read and write S3 without issuing a single long-term key">

You have a data-processing program running on EC2 that writes results into S3. The correct approach touches no access key: create an IAM role, give it an identity-based policy that can write only this bucket, wrap it in an instance profile, and attach it to the EC2. The program writes with `boto3.client("s3")` carrying no keys. To add permissions later you edit the role policy; to revoke them you edit or remove the role. The machine itself stays clean forever, and the risk of a leaked key drops to zero.

</Scenario>

### 🛠️ Hands-on: create a role → attach to EC2 (instance profile) → verify

```bash
# 1) Create the role; the trust policy allows the EC2 service to assume it
#    (a trust policy is a resource-based policy on the role, with Principal set to ec2)
cat > trust.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "ec2.amazonaws.com" },
    "Action": "sts:AssumeRole"
  }]
}
EOF
aws iam create-role --role-name AppS3WriterRole \
  --assume-role-policy-document file://trust.json

# 2) Give the role an identity-based policy that can write only one bucket (least privilege)
cat > perms.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:PutObject"],
    "Resource": "arn:aws:s3:::my-app-bucket/*"
  }]
}
EOF
aws iam put-role-policy --role-name AppS3WriterRole \
  --policy-name WriteMyBucket --policy-document file://perms.json

# 3) Create an instance profile and put the role in it
aws iam create-instance-profile --instance-profile-name AppS3WriterProfile
aws iam add-role-to-instance-profile \
  --instance-profile-name AppS3WriterProfile \
  --role-name AppS3WriterRole

# 4) Attach the profile to an existing EC2 instance
aws ec2 associate-iam-instance-profile \
  --instance-id i-0123456789abcdef0 \
  --iam-instance-profile Name=AppS3WriterProfile
```

**Expected result**: after SSHing into that EC2, running `aws sts get-caller-identity` should return an ARN starting with **`assumed-role/AppS3WriterRole/...`** (meaning your current identity is an assumed role, not a user). Then `aws s3 cp test.txt s3://my-app-bucket/test.txt` should upload successfully, but `aws s3 ls` (list all buckets) is denied (`AccessDenied`) because the policy did not grant `s3:ListAllMyBuckets`. That is least privilege doing its job.

**(Alternative) verify by calling `AssumeRole` in code**:

```bash
# Get temporary credentials (the response includes a SessionToken)
aws sts assume-role \
  --role-arn arn:aws:iam::111122223333:role/AppS3WriterRole \
  --role-session-name demo
```

**Expected result**: a JSON blob containing `AccessKeyId`, `SecretAccessKey`, `SessionToken`, and `Expiration`. Seeing a `SessionToken` and an `Expiration` confirms you received temporary credentials.

<Cost>

IAM itself is completely free (roles, policies, users, and STS `AssumeRole` cost nothing). What costs money is the resources you act on with those permissions (S3, EC2, and so on). While practicing, the thing to watch is not the bill but security: remember to clean up test roles, buckets, and EC2 instances, and do not leave any access key in code, config files, or screenshots. If you ever leak a long-term key, immediately disable or delete it in IAM and check CloudTrail for abnormal use.

</Cost>

:::warning[🚑 Common pitfalls]
- **Wildcard `*` in a policy**: `Action: "*"` or `Resource: "*"` means wide open, the most common over-grant. Grant just-enough least privilege.
- **Hard-coding an access key into code, or stuffing it into environment variables or an image**: the most serious anti-pattern. Use a role (instance profile / execution role) so the program carries no keys.
- **Setting the trust policy direction wrong**: a trust policy answers who may assume this role (the Principal is the assumer, such as `ec2.amazonaws.com`); do not confuse it with what this role can do (the identity-based policy). Reversing the direction gives endless `AccessDenied` or `is not authorized to perform: sts:AssumeRole`.
- **Forgetting to attach the role to the instance**: the role is created and the policy is correct, but without attaching the instance profile to the EC2, the program still cannot get credentials (the SDK errors because it finds none).
- **Assuming temporary credentials do not need a SessionToken**: credentials from `AssumeRole` need all three values (ID / Secret / SessionToken); omitting the token gives `InvalidClientTokenId`.
:::

<Refs title="📚 Official docs & further reading">

- [IAM User Guide](https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html)
- [IAM roles and EC2 instance profiles](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use_switch-role-ec2.html)
- [AWS STS temporary security credentials](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp.html)
- [IAM security best practices (least privilege and more)](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)

</Refs>

## Next step

👉 Next: [Cognito — Authentication and Authorization](./cognito.md)
