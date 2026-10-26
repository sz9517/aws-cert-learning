---
sidebar_position: 2
title: Cognito (Authentication and Authorization)
---

# Amazon Cognito: do not build your own login system, let AWS handle "who you are" and "what you can do"

> This article takes a developer's view of the two things about Cognito that are most tested and most easily confused: the **User Pool (handles authentication = sign-up/sign-in, issues JWTs)** and the **Identity Pool (handles authorization = exchanging for temporary AWS credentials to access S3/DynamoDB)**. How they differ, when to use which, and how they work together are high-frequency topics in DVA-C03 Domain 2.

<Vocab title="📌 Terms you will meet here (clear even if brand new)">

- **Authentication (AuthN for short)**: confirming **who you are**. Proving your identity with a username and password is authentication.
- **Authorization (AuthZ for short)**: confirming **what you can do**. Once we know who you are, it decides which files you can read and which buttons you can press.
- **User Pool**: Cognito's **user directory**. It handles sign-up, sign-in, password reset, and multi-factor authentication (MFA), and after a successful login it issues you <Term en="JSON Web Token" desc="A signature-protected, self-verifiable token format that carries user info and an expiry time.">JWT</Term> tokens.
- **Identity Pool (also called Federated Identities)**: takes an already-authenticated identity (which may come from a User Pool, Google, Apple, and so on) and **exchanges it for a set of temporary AWS credentials**, so the front-end app can directly access AWS services like S3 and DynamoDB.
- **Token**: the "pass" you receive after a successful login. A Cognito User Pool issues three kinds: an **ID token, an Access token, and a Refresh token**.
- **Federation**: letting users sign in with an **existing account from elsewhere** (Google, Facebook, corporate SAML) instead of registering again in your app.
- **IdP (Identity Provider)**: the source that authenticates your users, such as Google, Apple, or a corporate SAML/OIDC provider.

</Vocab>

:::note[💬 Reading tip]
Whenever you see a term with a <Term desc="Like this! Hover over the dotted underline (tap on mobile) to see a plain explanation.">dotted underline</Term>, hover over it for a plain explanation. All terms are also collected in the [Glossary](/glossary).
:::

## Why Cognito? First, an example of how painful it is to build your own login system

Say you want an app where users can register, sign in, reset a forgotten password, ideally turn on multi-factor authentication (MFA), sign in with their Google account in one click, and where the front end can upload files straight to S3 after logging in.

If you **build this yourself**, you have to store passwords (and hash and salt them correctly, or they leak), issue and verify login tokens, build the forgot-password email flow, wire up Google OAuth, and figure out how the front end safely gets AWS access. Every one of these is a **security minefield**, and one mistake leaks user data. None of this is your core business, yet it demands huge effort and may still end up insecure.

<Term en="Amazon Cognito" desc="AWS identity service that handles app sign-up/sign-in (authentication) and exchanges for temporary AWS credentials (authorization), so you do not build your own login system.">Cognito</Term> solves almost all of this at once: sign-up, sign-in, password reset, MFA, and social login are built in; it issues standard JWT tokens after login; and it can exchange those for temporary, time-limited AWS credentials for the front end. For developers, the focus shifts from "how do I securely build an account system" to "how do I wire Cognito in."

## Core: User Pool vs Identity Pool (this is almost always tested)

This is the most important part of the article and the thing most people confuse. Remember it in one line first:

- **User Pool handles "who you are" (authentication)** — sign-up and sign-in, and on success it issues **JWTs**.
- **Identity Pool handles "which AWS resources you can touch" (authorization)** — it takes an authenticated identity and **exchanges it for temporary AWS credentials** to access S3/DynamoDB.

<Analogy title="🏢 Everyday analogy: a User Pool is the front-desk check-in, an Identity Pool is swapping it for an access card">

Imagine you visit an office building:

- **User Pool = checking in at the lobby front desk**: you show your ID, the desk confirms you really are who you say, and hands you a **visitor badge (the JWT token)**. This step only proves "who you are"; it does not yet say which rooms you may enter.
- **Identity Pool = using that badge to get an access card**: you take the visitor badge to the access-control desk and swap it for a **time-limited access card (temporary AWS credentials)**, and that card decides which server rooms (S3 buckets, DynamoDB tables) you can unlock. When the time is up the card stops working and you swap for a new one.

The key point: **checking in (User Pool) and issuing the access card (Identity Pool) are two separate things at two separate desks.** Many people think the Identity Pool handles login. It does not. Login is the User Pool's job.

</Analogy>

| Aspect | User Pool | Identity Pool |
| --- | --- | --- |
| **What it handles** | **Authentication** (AuthN): who you are | **Authorization** (AuthZ): which AWS resources you can touch |
| **What it produces** | **JWTs** (ID / Access / Refresh token) | **Temporary AWS credentials** (AccessKeyId, SecretKey, SessionToken) |
| **What you use it for** | Protecting **your own API** (hand the JWT to API Gateway / ALB to verify) | Letting the front end **call AWS services directly** (S3 upload, DynamoDB read/write) |
| **Where users come from** | Cognito's own user directory, or federated Google/SAML | Takes an "already-authenticated identity": from a User Pool, Google, Apple, or even allows guests |
| **Typical pairing** | API Gateway Cognito authorizer, app login screen | Mobile/web front end needing S3, DynamoDB, analytics |

:::info[🔑 One line to tell them apart: do you want to "protect an API" or "touch AWS services directly"?]
- Want to **authenticate users and protect your own API** → **User Pool** (hand the JWT to API Gateway's Cognito authorizer to verify).
- Want to let the **front end access AWS services directly** (such as an app uploading straight to S3) → you need an **Identity Pool** to exchange for temporary AWS credentials.
- The two are **often used together**: the User Pool logs the user in and issues the JWT, then you feed that JWT to the Identity Pool to exchange for AWS credentials.
:::

### The three tokens a User Pool issues (ID / Access / Refresh)

After a successful login, the User Pool returns three tokens, and DVA loves to test what each is for:

| Token | Contents | What you use it for | Lifetime |
| --- | --- | --- | --- |
| **ID token** | The user's identity info (email, name, and other claims) | Lets **your app front end** know "who logged in" and display user data | Short (1 hour by default) |
| **Access token** | The user's permission scope (scopes, groups) | Lets the **back-end API / resource server** verify "is this request allowed" | Short (1 hour by default) |
| **Refresh token** | Used to obtain new ID/Access tokens | When the ID/Access tokens expire, get a fresh set **without logging in again** | Long (configurable from days to months) |

:::tip[💡 Exam focus: which token does what]
- A question about "authenticate the user, get user attributes" → **ID token**.
- A question about "authorize API access, check scope / groups" → **Access token**.
- A question about "the token expired but I do not want to force the user to log in again" → use the **Refresh token** to get a new one.
- All three are **JWTs** that API Gateway / ALB can verify by signature directly, without calling back to Cognito.
:::

## How User Pool and Identity Pool work together: the full login-to-access flow

The classic flow combining the two (the "Enhanced Flow" for authorization):

<div className="flow">
  <div className="flow-node">1. User logs in to the app via the User Pool</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">2. User Pool returns JWTs (ID/Access/Refresh)</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">3. App hands the ID token to the Identity Pool</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">4. Identity Pool asks STS for temporary AWS credentials</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">5. App uses the temporary credentials to access S3 / DynamoDB directly</div>
</div>

Step by step:

1. **Log in**: the user enters a username and password (or signs in with Google) in the app, and the **User Pool** handles authentication.
2. **Get tokens**: on success, the User Pool returns three JWTs. At this point you can already protect your own API.
3. **Exchange the identity**: if the front end also needs to touch AWS services directly, it hands the **ID token** to the **Identity Pool**.
4. **Exchange for credentials**: behind the scenes the Identity Pool calls <Term en="Security Token Service" desc="AWS service that issues temporary security credentials; they are time-limited and expire automatically.">STS</Term> and issues a set of **temporary AWS credentials** according to the **IAM role** you configured.
5. **Access**: the app uses these time-limited credentials to call S3, DynamoDB, and so on, with permissions determined by that IAM role.

:::info[🔑 How does the Identity Pool decide what permissions to grant?]
An Identity Pool is bound to **two IAM roles**: one for **authenticated users** and one for **guests (unauthenticated)**. What the exchanged temporary credentials can do is entirely decided by the IAM policy on the matching role. You can also use **role mapping** to grant different roles based on User Pool groups, achieving fine-grained authorization.
:::

## App integration flow (how a developer actually wires it up)

Taking a web/mobile app as an example, a developer typically wires it like this:

1. Create a **User Pool** in Cognito, configuring the password policy, whether to require MFA, and whether to allow social logins like Google.
2. Create an **App client** (your app's identity) under the User Pool and get its **client ID**.
3. The front end uses the **Amplify** library or the **AWS SDK** to integrate: calling `signUp`, `confirmSignUp`, `signIn`, and so on.
4. On successful login you receive **JWTs**. To protect your own API, configure a **Cognito authorizer** on **API Gateway**, and the front end sends the token in the `Authorization` header.
5. If the front end needs to access AWS services directly, create an **Identity Pool**, set the User Pool as its identity source, and have the front end exchange the ID token for temporary credentials.

:::tip[💡 Developer favorite: the Hosted UI]
Do not want to build your own login screen? The User Pool has a built-in **Hosted UI** that gives you a ready-made sign-up/sign-in/social-login screen out of the box, following the standard **OAuth 2.0 / OIDC** flow, and hands the tokens back to your app via redirect after login. A huge time saver when you are in a hurry.
:::

## Why Cognito instead of building your own authentication? Pros / cons / when not to use it

This section is for you if you know Cognito exists but are not sure whether to use it.

**Why it (what it solves)**
Building your own account system means securely handling password storage, token issuance and verification, forgot-password, MFA, social/corporate federated login, and "how the front end safely gets AWS access." Every one of these, done wrong, leaks data. Cognito **standardizes and manages** all of it, and what it issues is standard JWT / OAuth that the whole ecosystem understands.

**Pros**
- **No storing passwords yourself, no issuing tokens yourself**: most security minefields are handled by AWS.
- **Built-in MFA, forgot-password, and social/corporate federated login** (Google, Apple, SAML, OIDC), ready to toggle on.
- **Deep AWS integration**: API Gateway / ALB can verify Cognito tokens directly; an Identity Pool exchanges directly for temporary AWS credentials to access S3/DynamoDB.
- **Generous free tier**: small to medium apps often pay nothing.

**Cons / limitations**
- **Customization has limits**: the Hosted UI appearance is adjustable but not fully free; unusual login flows may require Lambda triggers to force into shape.
- **Learning curve plus easily confused terms**: User Pool vs Identity Pool and the three tokens trip up beginners who wire things wrong.
- **Ties you to AWS**: once deeply used, it is hard to move to another provider.
- **Some advanced features (such as advanced security protection) are billed separately**.

**When not to use it**
- Your team **already has a mature identity system** (such as a self-hosted Keycloak / Auth0 already in production); layering Cognito on top only adds complexity.
- Requirements are **extremely custom** and Cognito's flow blocks you; a third-party IdP (Auth0, Okta) may be more flexible.
- It is purely **machine-to-machine** with no "human users" logging in. Then you want IAM roles / service credentials, not Cognito.

## Real-world use: not just for the exam

<Scenario title="Real scenario: a mobile app that lets users log in and upload photos straight to S3">

You are building a photo app. Requirements: users register/log in (with Google sign-in too), and after login the **mobile device uploads photos straight to S3**, where each user can only touch their own folder. Here is how:

1. Create a **User Pool** for sign-up/sign-in and connect Google as a federated identity.
2. Create an **Identity Pool** and set the User Pool as its identity source.
3. Give the Identity Pool's "authenticated role" an IAM policy that allows access only to `s3://photos-bucket/${cognito-identity.amazonaws.com:sub}/*` (using the user's identity ID as the folder prefix, which isolates users naturally).
4. After login the app gets the ID token, hands it to the Identity Pool for temporary credentials, and uses them to `PutObject` directly.

This way no long-term key is hardcoded anywhere in the app (you must never put IAM user keys into a mobile app), and the whole path uses time-limited temporary credentials.

</Scenario>

### 🛠️ Hands-on: create a User Pool with the CLI, create an App client, then register and log in a user

```bash
# 1) Create a User Pool: allow sign-in by email, password at least 8 characters
aws cognito-idp create-user-pool \
  --pool-name demo-user-pool \
  --auto-verified-attributes email \
  --policies '{"PasswordPolicy":{"MinimumLength":8,"RequireUppercase":true,"RequireNumbers":true}}'
# Expected result: returns JSON containing "Id": "us-east-1_xxxxxxxxx" (note down this UserPoolId)

# 2) Create an App client (your app's identity) under this pool
aws cognito-idp create-user-pool-client \
  --user-pool-id us-east-1_xxxxxxxxx \
  --client-name demo-app-client \
  --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH
# Expected result: returns "ClientId": "xxxxxxxxxxxxxxxxxx" (note down this ClientId)

# 3) Register a user
aws cognito-idp sign-up \
  --client-id xxxxxxxxxxxxxxxxxx \
  --username alice@example.com \
  --password 'Passw0rd123' \
  --user-attributes Name=email,Value=alice@example.com
# Expected result: returns "UserConfirmed": false (meaning the email is not verified yet)

# 4) During dev/test, use the admin command to mark the user confirmed directly (production goes through an email verification code)
aws cognito-idp admin-confirm-sign-up \
  --user-pool-id us-east-1_xxxxxxxxx \
  --username alice@example.com
# Expected result: no error output (the command succeeding means confirmation is done)

# 5) Log in with the username and password to obtain tokens
aws cognito-idp initiate-auth \
  --client-id xxxxxxxxxxxxxxxxxx \
  --auth-flow USER_PASSWORD_AUTH \
  --auth-parameters USERNAME=alice@example.com,PASSWORD='Passw0rd123'
# Expected result: returns "AuthenticationResult" containing the three JWTs: IdToken, AccessToken, RefreshToken
```

Paste the returned `IdToken` into [jwt.io](https://jwt.io) to decode it, and you will see claims inside such as `email`, `sub` (the user's unique ID), and `exp` (the expiry time). This is exactly the information your app front end uses to know "who logged in."

<Cost>

**Cognito User Pools have a monthly free tier** (measured by monthly active users, MAU, and the allowance is quite large), so small to medium apps often pay nothing. The **Identity Pool itself is free**; what you pay for is the AWS services you actually consume after exchanging for temporary credentials (such as S3 traffic). Note that **advanced security protection (Advanced Security, such as detecting compromised logins) is billed separately**, so do not turn it on when you do not need it. Remember to delete your test User Pools / Identity Pools when you finish practicing.

</Cost>

:::warning[🚑 Common pitfalls]
- **Confusing the User Pool and the Identity Pool**: User Pool = login/authentication/issue JWTs; Identity Pool = exchange for temporary AWS credentials/authorization. See "issue JWTs, protect an API" and think User Pool; see "exchange for AWS credentials, access S3 directly" and think Identity Pool.
- **Thinking the Identity Pool handles login**: it does **not** do login. It only takes an "already-authenticated identity" and exchanges it for credentials. Login is always the User Pool's job (or an external IdP's).
- **Not handling token refresh when tokens expire**: ID/Access tokens expire after 1 hour by default. Without using the Refresh token to renew automatically, users get mysteriously logged out. The front end must handle the refresh flow.
- **Storing tokens in an insecure place**: putting JWTs in browser `localStorage` makes them easy to steal via XSS. Prefer safer storage (such as an httpOnly cookie / platform secure storage) and do not just dump them anywhere.
- **Hardcoding long-term IAM keys into the front-end app**: absolutely not. To let the front end touch AWS services, always use the **Identity Pool to exchange for temporary credentials**.
- **Mixing up the ID token and the Access token**: to know "who logged in" use the **ID token**; to authorize API access and check scope use the **Access token**.
:::

<Refs title="📚 Official docs & further reading">

- [Amazon Cognito Developer Guide](https://docs.aws.amazon.com/cognito/latest/developerguide/what-is-amazon-cognito.html)
- [Cognito User Pools](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools.html)
- [Cognito Identity Pools (Federated Identities)](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-identity.html)
- [User Pool tokens (ID / Access / Refresh)](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-with-identity-providers.html)
- [Protect an API with an API Gateway Cognito authorizer](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-integrate-with-cognito.html)

</Refs>

## Next steps

👉 Next: [KMS and Encryption](./kms-encryption.md)
