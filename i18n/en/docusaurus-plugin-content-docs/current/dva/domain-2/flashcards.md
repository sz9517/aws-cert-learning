---
sidebar_position: 6
title: Domain 2 Flashcards
---

# Domain 2 Flashcards

Tap a card to flip it open. This page distills the developer-focused essentials of Domain 2 "Security" into bite-sized cards, covering IAM, Cognito, KMS, secrets management, and request signing, perfect for a fast review before the exam.

## IAM

<Flashcards>
  <Flashcard term="Role vs User">A user has long-term credentials and represents a person; a role has no fixed credentials and is an identity that a service or program temporarily assumes, receiving credentials that expire. Prefer roles in development and avoid handing out long-lived user keys.</Flashcard>
  <Flashcard term="Instance Profile">The container that attaches an IAM role to an EC2 instance. Through it, EC2 automatically obtains the role's temporary credentials, so your code never hardcodes keys on the box.</Flashcard>
  <Flashcard term="AssumeRole">Uses STS to assume a role and get back a set of temporary credentials (AccessKeyId / SecretAccessKey / SessionToken). Cross-account access, privilege elevation, and federation all rely on it.</Flashcard>
  <Flashcard term="Trust Policy vs Permission Policy">The trust policy defines who may assume the role (the Principal); the permission policy defines what they can do once assumed. If a role cannot be assumed, check the trust policy first.</Flashcard>
  <Flashcard term="Least Privilege">Grant only the minimum permissions needed to do the job, no more. Start narrow and widen gradually as needed, which is far safer than granting * and clawing it back later.</Flashcard>
  <Flashcard term="Temporary Credentials">Credentials issued by STS with an expiry time that lapse automatically. They are safer than long-term keys because the risk and blast radius of a leak are much smaller. Roles and federation both use them.</Flashcard>
  <Flashcard term="Credential Provider Chain">The SDK looks for credentials in order: environment variables, then shared config files, then the container/instance role (ECS/EC2/Lambda). Never hardcode keys; letting the role supply them through the chain is the most secure.</Flashcard>
</Flashcards>

## Cognito

<Flashcards>
  <Flashcard term="User Pool vs Identity Pool">A User Pool is a user directory that handles sign-up, sign-in, and issuing JWTs (authentication); an Identity Pool exchanges a signed-in identity for AWS temporary credentials to access AWS resources directly (authorization).</Flashcard>
  <Flashcard term="ID Token">A JWT carrying who the user is (claims such as email and name). The frontend uses it to confirm the signed-in identity; it is not meant for authorizing API calls.</Flashcard>
  <Flashcard term="Access Token">A JWT carrying what the user may access (scopes, groups). Send this token when calling a protected API, where the backend or an authorizer validates it.</Flashcard>
  <Flashcard term="Refresh Token">A longer-lived token used to obtain new ID/Access tokens after they expire, without making the user sign in again.</Flashcard>
  <Flashcard term="Identity Federation">Lets users sign in with an external identity such as Google, Facebook, or corporate SAML/OIDC. Cognito brokers the connection and ultimately exchanges it for AWS temporary credentials to access resources.</Flashcard>
</Flashcards>

## KMS

<Flashcards>
  <Flashcard term="Envelope Encryption">Encrypt the data itself with a data key, then encrypt that data key with a KMS master key. Store only the encrypted data key alongside the data, and ask KMS to unwrap it when decrypting. This is how all bulk data encryption is done.</Flashcard>
  <Flashcard term="GenerateDataKey">Asks KMS for a data key and returns both a plaintext and an encrypted version at once. Use the plaintext version to encrypt data locally and discard it immediately, keeping only the encrypted version. This is envelope encryption in practice.</Flashcard>
  <Flashcard term="4KB Limit">The KMS Encrypt API can encrypt at most 4KB of data at a time. To encrypt anything larger, use envelope encryption (GenerateDataKey), where KMS only protects the small data key.</Flashcard>
  <Flashcard term="Symmetric vs Asymmetric Keys">A symmetric key uses the same key to encrypt and decrypt, is fast, and is the most common; an asymmetric key encrypts with a public key and decrypts with a private key (or signs and verifies), ideal when the key cannot be shared or when you need digital signatures.</Flashcard>
  <Flashcard term="CMK vs AWS Managed Key">A customer managed key is one you create, with a key policy you control, rotation you set, and cross-account sharing; an AWS managed key is created and managed automatically by a service, is free but inflexible, and has no customizable policy.</Flashcard>
</Flashcards>

## Secrets Management

<Flashcards>
  <Flashcard term="Secrets Manager Automatic Rotation">Uses a Lambda to periodically change passwords/keys and sync them to the source database automatically, reducing leak risk. With native support for RDS and more, it is the top choice for storing database credentials, though it is paid.</Flashcard>
  <Flashcard term="Parameter Store SecureString">A parameter type in Systems Manager Parameter Store that stores values encrypted with KMS. Standard parameters are free and suit configuration and general secrets; for automatic rotation, use Secrets Manager instead.</Flashcard>
  <Flashcard term="Secrets Caching">Fetching secrets frequently piles up API calls and latency. The official caching client keeps secrets locally for a while to cut calls dramatically; in Lambda, place it outside the handler to reuse it.</Flashcard>
</Flashcards>

## Request Signing and STS

<Flashcards>
  <Flashcard term="SigV4 (Signature Version 4)">The signing mechanism for AWS API requests. It computes a signature over the request content using your secret key, proving the request truly came from you and was not tampered with in transit. The SDK signs automatically, so you never hand-roll it.</Flashcard>
  <Flashcard term="Presigned URL">A time-limited URL generated with your credentials that lets someone without AWS permissions temporarily upload or download a specific S3 object, expiring when its time is up.</Flashcard>
  <Flashcard term="STS (Security Token Service)">The service that issues temporary credentials. AssumeRole, federation, cross-account access, and GetSessionToken all go through it, making it the single source of temporary credentials.</Flashcard>
</Flashcards>

👉 Test yourself: [Domain 2 Quiz](./quiz.md)
