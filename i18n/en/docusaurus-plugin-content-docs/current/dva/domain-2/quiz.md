---
sidebar_position: 7
title: Domain 2 Quiz
---

# Domain 2 Practice Questions (official-exam style)

Pick your answer first, then click **Show answer & explanation**. This page mirrors the DVA-C03 exam style: **scenario-based stems from a developer security point of view**, testing the development details and trade-offs of **identity and access, encryption and secrets, signing and temporary credentials** (IAM roles and instance profiles, AssumeRole and trust-policy direction, least privilege, Cognito User Pool vs Identity Pool, JWT tokens, KMS envelope encryption and GenerateDataKey, Secrets Manager rotation vs Parameter Store, SigV4 and presigned URLs). Options are all plausible AWS approaches (distractors are never obviously wrong), and some questions use **qualifiers** like "MOST aligned with least privilege / MOST aligned with best practice / MOST secure" to force comparison. Includes both **single-answer** and **multiple-response (Choose TWO)** questions. These are **original** content (not real exam questions).

<Quiz
  qnum={1}
  total={20}
  question="An application running on EC2 needs to read from an S3 bucket. The developer wants the app to obtain temporary credentials without storing long-term keys anywhere. What is the approach MOST aligned with best practice?"
  options={[
    'Write an IAM user Access Key and Secret Key into a config file on the EC2 instance',
    'Create an IAM role and attach it to the EC2 instance via an instance profile, so the SDK obtains temporary credentials automatically',
    'Hard-code the keys in the application source code',
    'Use the Root user keys to guarantee it always has permission',
  ]}
  answer={1}>

**Correct answer: B**

An application on EC2 should get an **IAM role** through an **instance profile**. The instance metadata service supplies **temporary credentials that rotate automatically**, and the SDK default credential provider chain picks them up, so no long-term key is stored on the machine at all. A and C store long-term keys and are hard to rotate; D uses Root keys, which is a serious security risk and violates least privilege.

</Quiz>

<Quiz
  qnum={2}
  total={20}
  question="A Lambda in account A needs to write to an S3 bucket in account B. The team decides to let the Lambda assume a role in account B. Which statement about the trust relationship direction is correct?"
  options={[
    'Set a trust policy on the Lambda execution role in account A to trust account B',
    'Set a trust policy on the target role in account B that trusts the Lambda execution role in account A, and allow that role to call sts:AssumeRole',
    'Hand the Root keys of account B to account A',
    'Just add an Allow in the identity policy in account A; nothing is needed in account B',
  ]}
  answer={1}>

**Correct answer: B**

Cross-account role assumption needs both sides. The direction is: the **role being assumed (in account B)** has a **trust policy** that lists the **source principal (the Lambda execution role in account A)** as trusted, and that role in account A has permission to `sts:AssumeRole` the account B role. A has the direction reversed (the trust policy lives on the role being assumed); C hands over Root keys, which is extremely dangerous; D configures only the source side, so with no trust from the target role the assumption is denied.

</Quiz>

<Quiz
  qnum={3}
  total={20}
  question="A developer is writing an IAM policy for a service role. The requirement is to allow only GetItem and PutItem against one specific DynamoDB table and nothing else. Which policy is MOST aligned with least privilege?"
  options={[
    'Use Action dynamodb:* and Resource * so it is easy to extend later',
    'List only dynamodb:GetItem and dynamodb:PutItem as Action, and scope Resource to the ARN of that one table',
    'Attach the AdministratorAccess managed policy directly',
    'List dynamodb:GetItem and dynamodb:PutItem as Action but use Resource * to cover all tables',
  ]}
  answer={1}>

**Correct answer: B**

Least privilege means granting **only the actions and resources needed** for the job: list the exact actions `dynamodb:GetItem` and `dynamodb:PutItem`, and scope Resource to the **ARN** of that table. A grants a wildcard action plus all resources, which is far too broad; C grants admin, the opposite of least privilege; D has the right actions but Resource `*` lets it touch every table in the account, still beyond what is needed.

</Quiz>

<Quiz
  qnum={4}
  total={20}
  question="A web app needs users to sign up and sign in with email and password, with multi-factor authentication (MFA) and a forgot-password flow, and to receive verifiable identity tokens after login. Which service is BEST suited to handle user authentication?"
  options={[
    'Cognito User Pool',
    'Cognito Identity Pool',
    'IAM users, one created per end user',
    'KMS',
  ]}
  answer={0}>

**Correct answer: A**

A **Cognito User Pool** is a managed **user directory and authentication** service that provides sign-up, sign-in, MFA, and forgot-password flows, and issues **JWT tokens** (ID, Access, Refresh) on successful login. B, the Identity Pool, is for exchanging an identity for AWS temporary credentials, not for login; C creating an IAM user per end user is inappropriate (IAM is for identities inside AWS); D KMS is for encryption key management and is unrelated to login.

</Quiz>

<Quiz
  qnum={5}
  total={20}
  question="A user has signed in through a Cognito User Pool, and the front end now needs to let them access an S3 bucket and DynamoDB directly with temporary AWS credentials. Which component exchanges the authenticated identity for AWS temporary credentials?"
  options={[
    'Create another User Pool',
    'A Cognito Identity Pool, which exchanges the token issued by the User Pool for AWS temporary credentials',
    'Use the User Pool JWT directly as the AWS request signature',
    'Hand IAM user keys to the front end',
  ]}
  answer={1}>

**Correct answer: B**

A **Cognito Identity Pool** exchanges an authenticated identity (such as a token from a User Pool, or an external identity provider like Google or Facebook) for **AWS temporary credentials via STS**, so the front end can access S3, DynamoDB, and other services directly under a scoped IAM role. A building another User Pool does not solve authorizing AWS resources; C a JWT is not an AWS signature and cannot sign AWS requests directly; D handing long-term keys to the front end is extremely dangerous.

</Quiz>

<Quiz
  qnum={6}
  total={20}
  question="Regarding the three JWT tokens received after a Cognito User Pool login, the developer wants to know which one is normally used to authorize calls to a protected API. Which statement is correct?"
  options={[
    'The Refresh token is used to call the API for authorization directly',
    'The ID token carries user identity claims, the Access token is used to authorize access to protected resources, and the Refresh token is used to obtain new ID and Access tokens',
    'The three tokens are interchangeable; it does not matter which you use',
    'The Access token can only live in the front end and must never be sent to the back end',
  ]}
  answer={1}>

**Correct answer: B**

The three tokens have distinct roles: the **ID token** carries identity claims (who you are); the **Access token** represents authorization and is used to **access protected resources** (what you can do); the **Refresh token** obtains new tokens once the others expire. A has the wrong purpose (the refresh token is not used to authorize directly); C the three are not interchangeable; D the access token is meant to be sent to the back end or API for authorization.

</Quiz>

<Quiz
  qnum={7}
  total={20}
  question="A team needs to encrypt many large files with KMS (each far larger than 4 KB). They heard the KMS Encrypt API has a size limit on plaintext. What is the approach MOST aligned with best practice that can handle large data?"
  options={[
    'Split each large file into exactly 4 KB chunks and call KMS Encrypt on each',
    'Use envelope encryption: call GenerateDataKey to get a data key, encrypt the large file locally with it, and store the KMS-encrypted data key alongside',
    'Send the whole file to KMS Encrypt at once and let KMS encrypt all the data directly',
    'Abandon KMS and write your own encryption with a fixed password in code',
  ]}
  answer={1}>

**Correct answer: B**

The KMS `Encrypt` API caps the plaintext it encrypts directly at about **4 KB**, so large data should use **envelope encryption**: call **GenerateDataKey** to obtain a data key (it returns both a plaintext version and a version encrypted under the CMK), encrypt the large file locally with the plaintext data key, then immediately discard the plaintext and keep only the **encrypted data key**; at decrypt time ask KMS to decrypt the data key. A chunking into 4 KB calls is slow and expensive; C anything over 4 KB simply fails; D a self-written fixed password is insecure.

</Quiz>

<Quiz
  qnum={8}
  total={20}
  question="Regarding what GenerateDataKey returns in KMS envelope encryption, which two statements are correct? (Choose TWO)"
  options={[
    'GenerateDataKey returns both a plaintext data key and a copy of the data key encrypted under the CMK',
    'After the application encrypts data locally with the plaintext data key, it should wipe the plaintext key from memory as soon as possible',
    'The encrypted data key must not be stored with the ciphertext and must be stored in a different AWS Region',
    'The plaintext data key should be kept long-term in a config file for reuse',
    'GenerateDataKey only returns the ciphertext data key; the plaintext must be produced separately with Encrypt',
  ]}
  answer={[0, 1]}>

**Correct answer: A, B**

`GenerateDataKey` returns **two copies** at once: a **plaintext data key** and a **data key encrypted under the CMK** (CiphertextBlob). The flow is to encrypt data locally with the plaintext key and then **immediately wipe the plaintext key from memory**, keeping only the encrypted data key stored next to the ciphertext. C is wrong: the encrypted data key is usually stored right alongside the ciphertext, with no cross-Region requirement; D keeping the plaintext key long-term breaks the security of envelope encryption; E is wrong because GenerateDataKey already returns both plaintext and ciphertext.

</Quiz>

<Quiz
  qnum={9}
  total={20}
  question="A team wants to use KMS for two things: encrypting and decrypting application data, and producing digital signatures on files delivered externally so the recipient can verify them. Which statement about symmetric vs asymmetric keys is correct?"
  options={[
    'Both tasks can only use asymmetric keys',
    'Encryption and decryption use a symmetric key (efficient, suited to GenerateDataKey and similar), while digital signing and verification require an asymmetric key (a public and private key pair)',
    'Both tasks can only use symmetric keys',
    'Symmetric and asymmetric make no difference; pick either',
  ]}
  answer={1}>

**Correct answer: B**

A KMS **symmetric key** uses one key for both encrypt and decrypt, is efficient, and is the default for most encryption cases (including `GenerateDataKey` for envelope encryption). An **asymmetric key** is a public/private key pair, suited to **digital signing and verification** (sign with the private key, verify with the public key) or cases where the public key must be given to parties outside AWS. A and C both wrongly lock the tasks to one type; D the two have clearly different purposes and cannot be chosen at random.

</Quiz>

<Quiz
  qnum={10}
  total={20}
  question="There is a KMS symmetric key in the account, and an IAM role that needs to decrypt data keeps getting denied, even though the identity policy of that role already allows kms:Decrypt. What is the MOST likely cause and correct fix?"
  options={[
    'The KMS key must be broken and needs to be recreated',
    'Besides the identity policy, the KMS key policy or a grant must also allow that role to use the key; both sides must permit it',
    'As long as the identity policy allows it, decryption always works regardless of the key policy',
    'Make the key public to everyone',
  ]}
  answer={1}>

**Correct answer: B**

Using a KMS key depends on **both** the **identity policy** and the **key policy (or a grant) on the key itself**. The key policy is the final gatekeeper for the key, so if it does not list the principal as allowed, an Allow in the identity policy alone is still denied. The fix is to also allow that role in the key policy or a grant. A the key is not broken; C ignores the key policy layer; D making the key public is a serious risk and not the answer.

</Quiz>

<Quiz
  qnum={11}
  total={20}
  question="An application uses an RDS database password, and company policy requires the password to rotate automatically on a schedule without downtime to the application. Which approach BEST meets this requirement?"
  options={[
    'Store the password in a Parameter Store String parameter and change it manually once per quarter',
    'Store the database password in Secrets Manager and enable automatic rotation (via a rotation Lambda integrated with the database)',
    'Put the password in a Lambda environment variable and redeploy when it needs changing',
    'Keep the password in a config file in the code and commit a new password periodically',
  ]}
  answer={1}>

**Correct answer: B**

**Secrets Manager** natively supports **scheduled automatic rotation**, using a rotation Lambda integrated with the database (such as RDS) to update the password and the database side in sync without application downtime. A a standard Parameter Store parameter has no built-in automatic rotation and manual changes are easy to forget; C environment variables require a redeploy and are not a secret-protection mechanism; D putting the password in code or a commit is a severe leak risk.

</Quiz>

<Quiz
  qnum={12}
  total={20}
  question="An application needs to store a set of configuration values: a database connection string that contains a password (a secret), and feature flags and a timeout in seconds (ordinary settings). The team wants one service to manage both kinds without extra cost, and secrets must be stored encrypted. Which two statements about using Parameter Store are correct? (Choose TWO)"
  options={[
    'Store the connection string that contains the password as a SecureString parameter, encrypted by KMS',
    'Store non-secret values such as feature flags and the timeout in seconds as String parameters',
    'Just store the password as a plaintext String parameter, since IAM protects it anyway',
    'All values must be stored as SecureString to be valid',
    'Paste the password into the Description field of a parameter',
  ]}
  answer={[0, 1]}>

**Correct answer: A, B**

Parameter Store supports different parameter types: a **secret (a connection string with a password) should be a SecureString** whose content is **encrypted by KMS**, while **non-secrets (feature flags, a timeout in seconds) can be plain String** parameters that are simple to read. C storing a password as a plaintext String violates secret protection; D not every value needs SecureString (String is more appropriate for non-secrets); E pasting the password into the Description exposes it in plaintext.

</Quiz>

<Quiz
  qnum={13}
  total={20}
  question="A high-traffic Lambda calls Secrets Manager on every invocation to fetch the same password, driving up API calls and latency and occasionally hitting throttling. Without sacrificing security, what is the MOST appropriate optimization?"
  options={[
    'Hard-code the password in plaintext in the code to avoid the API call',
    'Fetch the secret during initialization outside the handler and cache it in the execution environment (for example using the Secrets Manager caching client), refreshing after rotation',
    'Call Secrets Manager twice on every invocation to be sure it is current',
    'Copy the password to several Regions to spread out the calls',
  ]}
  answer={1}>

**Correct answer: B**

The correct approach is to **fetch the secret during initialization (outside the handler) and cache it in the execution environment**, reusing it on warm invocations to greatly reduce Secrets Manager API calls and latency; the official Secrets Manager caching client can be used, refreshing the cache after rotation, balancing security and performance. A hard-coding plaintext violates secret protection; C more calls only makes it worse; D cross-Region copies treat the symptom and add management complexity.

</Quiz>

<Quiz
  qnum={14}
  total={20}
  question="A developer uses the AWS SDK to make requests to S3, and the SDK automatically signs each request. Which statement about this request-signing mechanism (SigV4) is correct?"
  options={[
    'SigV4 puts your Secret Access Key in plaintext in a request header and sends it',
    'SigV4 computes a signature over the request content using your credentials (including the session token for temporary credentials) to verify the identity and integrity of the request, and the Secret Key itself is never sent with the request',
    'SigV4 just puts the account ID in the URL',
    'SigV4 can sign without any credentials',
  ]}
  answer={1}>

**Correct answer: B**

**Signature Version 4 (SigV4)** computes a **signature** over the request method, path, headers, and payload using your credentials (plus a **session token** when using temporary credentials). AWS recomputes it the same way to confirm the **identity and integrity** of the request, and the **Secret Access Key itself is never sent with the request**. A is the opposite (the Secret Key is not transmitted); C and D both misdescribe the signing process.

</Quiz>

<Quiz
  qnum={15}
  total={20}
  question="A back end generates an S3 presigned URL so a user can download a private object. Which two statements about the permissions and expiration of a presigned URL are correct? (Choose TWO)"
  options={[
    'A presigned URL inherits the permissions of the credentials that generated it, so it cannot do anything the signer could not do',
    'A presigned URL has an expiration time and stops working once it expires',
    'A presigned URL is valid forever once generated',
    'A presigned URL makes the object permanently public to the whole world',
    'A presigned URL always has greater permissions than the signer',
  ]}
  answer={[0, 1]}>

**Correct answer: A, B**

A presigned URL derives its power **from the credentials that generated it**: it cannot do anything the signer could not, so the role must have access to that object. It also carries an **expiration** and stops working once it expires (when signed with temporary credentials, validity is further bounded by the lifetime of those credentials). C is wrong, it is not valid forever; D is wrong, it grants scoped access only to whoever holds the URL within the window, it does not make the object public; E is wrong, the URL permissions never exceed those of the signer.

</Quiz>

<Quiz
  qnum={16}
  total={20}
  question="A mobile app needs temporary, scoped access to S3, and the permissions must not be long-term. How should the back end issue short-term credentials to the app?"
  options={[
    'Give the long-term Access Key of an IAM user directly to the app',
    'Use STS (such as AssumeRole) to produce time-limited temporary credentials (Access Key, Secret Key, Session Token) and give them to the app',
    'Give Root credentials to the app',
    'Create an IAM user for every device and issue permanent keys',
  ]}
  answer={1}>

**Correct answer: B**

Short-term, scoped access should use **STS** (for example `AssumeRole`) to produce **temporary security credentials**, consisting of an Access Key, a Secret Key, and a **Session Token** with a defined expiration that lapses automatically, which is ideal for mobile or front-end scenarios where long-term keys should not be placed. A, C, and D all hand out long-term or overly broad permissions, violating least privilege and the principle of short-term credentials.

</Quiz>

<Quiz
  qnum={17}
  total={20}
  question="A developer wants a program that calls AWS services to avoid hard-coded keys both locally and in the cloud, while following least privilege. Which statement about credentials and roles is MOST correct?"
  options={[
    'Hard-coding the same Access Key into the code for both local and cloud is simplest',
    'Locally use developer short-term credentials such as a named profile or SSO, and in the cloud use the IAM role of the runtime (EC2, ECS, Lambda); the code hard-codes no keys in either case',
    'In the cloud, also create an IAM user and put its keys in environment variables',
    'As long as you use the Root user, you do not need to design permissions',
  ]}
  answer={1}>

**Correct answer: B**

Best practice is to **use developer short-term credentials locally** (a named profile, IAM Identity Center or SSO) and **attach an IAM role to the runtime in the cloud** (EC2 instance profile, ECS task role, Lambda execution role), and the SDK credential provider chain picks them up automatically, so neither side hard-codes keys and each role is designed with least privilege. A hard-codes keys and cannot rotate; C long-term keys in the cloud are worse than just using a role; D using Root violates least privilege.

</Quiz>

<Quiz
  qnum={18}
  total={20}
  question="A service role needs a fairly broad identity policy (many actions over a set of resources), but the security team requires that no matter how much the identity policy grants, the effective permissions must never exceed a certain ceiling (a guardrail). What is BEST suited to set this ceiling?"
  options={[
    'Delete every Allow in the identity policy',
    'Use a permissions boundary to set the maximum permissions the role can obtain; effective permissions are the intersection of the identity policy and the boundary',
    'Delete the role entirely',
    'Add a Deny in the trust policy',
  ]}
  answer={1}>

**Correct answer: B**

A **permissions boundary** is a ceiling attached to an IAM identity: the **effective permissions equal the intersection of its identity policy and the boundary**, so even a broad identity policy has anything beyond the boundary nullified, which is exactly a guardrail. A deleting Allows leaves the role unable to work; C deleting the role is not setting a ceiling; D a trust policy governs who can assume the role, not the permission ceiling.

</Quiz>

<Quiz
  qnum={19}
  total={20}
  question="An external SaaS vendor needs to temporarily assume a role in your account to access resources. To avoid the confused deputy problem, what should be added to the trust policy so that only the genuine vendor can assume it?"
  options={[
    'Add nothing; just trust all of AWS',
    'Require the vendor to provide an agreed ExternalId in a condition of the trust policy',
    'Set the role so anyone can AssumeRole',
    'Give your Secret Key to the vendor',
  ]}
  answer={1}>

**Correct answer: B**

When letting a third party assume a role cross-account, add a condition in the trust policy that requires an **ExternalId**: the assumption succeeds only when the AssumeRole call carries this value agreed between you and the vendor, which prevents the **confused deputy** attack (where an attacker tricks the vendor into assuming your role on their behalf). A trusting all of AWS is far too broad; C letting anyone assume it is extremely dangerous; D handing over a Secret Key is entirely wrong.

</Quiz>

<Quiz
  qnum={20}
  total={20}
  question="A Lambda needs to call another AWS service, and the developer wants to know where its identity and permissions come from. Which statement about the Lambda execution role is correct?"
  options={[
    'Lambda runs with the developer local Access Key',
    'Lambda obtains temporary credentials from its execution role, its permissions are determined by the policy of that role, and following least privilege it should be granted only the actions it uses',
    'Lambda has all permissions in the account by default',
    'Lambda must put keys in environment variables to call other services',
  ]}
  answer={1}>

**Correct answer: B**

At runtime AWS provides a set of **temporary credentials** for the Lambda **execution role**, and the permissions the function has over other AWS services are entirely determined by the policy of that role, which following **least privilege** should grant only the actions and resources it actually uses. A it does not use the developer local keys; C Lambda has no permissions by default and relies on the role; D it does not need keys in environment variables (the role is enough).

</Quiz>

Domain 2 complete! On to Domain 3.
