---
sidebar_position: 3
title: Flashcards
---

# Domain 1 Flashcards

Click a card to flip it open. Use this page for a quick review before the exam.

<Flashcards>
  <Flashcard term="Least privilege">Grant only the permissions that are just enough — no more. This is the standard answer direction for permission questions.</Flashcard>
  <Flashcard term="MFA">Multi-Factor Authentication. Always enable it for the Root account — it's like adding a second lock to the door.</Flashcard>
  <Flashcard term="Policy evaluation">Evaluation rule: deny everything by default → allow only if there's an Allow → but any explicit Deny always wins.</Flashcard>
  <Flashcard term="Role vs Key">When a service (like EC2) accesses another service, use a Role for temporary credentials — not a long-term key (Access Key).</Flashcard>
  <Flashcard term="Root user">The account's highest-privilege owner. Use it only for initial setup; use an IAM User for daily operations.</Flashcard>
  <Flashcard term="IAM Group">Attach permissions to a group; members get them automatically on joining — easy to manage centrally.</Flashcard>
</Flashcards>

:::tip
More cards will be added to this page as the other Domain 1 topics (encryption, network security) are built out.
:::
