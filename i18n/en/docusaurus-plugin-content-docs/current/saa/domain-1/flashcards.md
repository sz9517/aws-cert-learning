---
sidebar_position: 7
title: Flashcards
---

# Domain 1 Flashcards

Click a card to flip it open. Covers all Domain 1 topics — use this page for a quick review before the exam.

## Identity & Access (IAM)

<Flashcards>
  <Flashcard term="Least privilege">Grant only just-enough permissions. The standard answer direction for permission questions.</Flashcard>
  <Flashcard term="MFA">Multi-factor authentication. Always enable it for the Root account.</Flashcard>
  <Flashcard term="Policy evaluation">Deny by default → allow only with an Allow → an explicit Deny always wins.</Flashcard>
  <Flashcard term="Role vs Key">Services (like EC2) use a Role for temporary credentials, not long-term keys.</Flashcard>
  <Flashcard term="IAM Group">Attach permissions to a group; members get them automatically — easy central management.</Flashcard>
</Flashcards>

## Data Encryption (KMS)

<Flashcards>
  <Flashcard term="At Rest vs In Transit">At Rest = encrypted on disk (S3/EBS/KMS); In Transit = encrypted while moving (HTTPS/TLS).</Flashcard>
  <Flashcard term="Envelope encryption">Use the KMS master key to encrypt a "data key"; the data key then encrypts the data.</Flashcard>
  <Flashcard term="Customer managed key (CMK)">You control permissions, rotation, and auditing; $1/month each. Pick it when you must "control/audit the key".</Flashcard>
  <Flashcard term="SSE-S3 / SSE-KMS / SSE-C">S3 manages the key / KMS manages the key (auditable) / you manage the key yourself.</Flashcard>
  <Flashcard term="Key deletion risk">Delete or disable a key = all data encrypted with it is unrecoverable.</Flashcard>
</Flashcards>

## Network Security (SG / NACL)

<Flashcards>
  <Flashcard term="Security Group">Attached to a host, stateful, allow-only. Return traffic is allowed automatically.</Flashcard>
  <Flashcard term="NACL">Attached to a subnet, stateless, allow + deny. In and out must be set separately.</Flashcard>
  <Flashcard term="Blocking a specific IP">SGs only allow; to block a specific IP use a NACL Deny rule.</Flashcard>
  <Flashcard term="SSH source">Always restrict port 22's source IP; never open 0.0.0.0/0.</Flashcard>
</Flashcards>

## S3 Security, Secrets & Monitoring

<Flashcards>
  <Flashcard term="Block Public Access">The master switch ensuring a bucket isn't public; overrides accidental public settings. On by default.</Flashcard>
  <Flashcard term="Pre-signed URL">A time-limited temporary download link; share a single file securely without making the bucket public.</Flashcard>
  <Flashcard term="Secrets Manager vs Parameter Store">Need auto password rotation → Secrets Manager; need to save money storing config → Parameter Store (free).</Flashcard>
  <Flashcard term="CloudTrail vs CloudWatch">Trail = who did what (audit); Watch = is the system healthy (performance monitoring).</Flashcard>
  <Flashcard term="AWS Config / GuardDuty">Config = config changes & compliance; GuardDuty = intelligent threat detection.</Flashcard>
</Flashcards>
