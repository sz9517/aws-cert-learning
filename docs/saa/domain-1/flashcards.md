---
sidebar_position: 3
title: 重點速記 / 閃卡
---

# Domain 1 重點速記 / 閃卡

點一下卡片即可翻開說明。考前拿這頁快速複習最有效率。

<Flashcards>
  <Flashcard term="最小權限原則">只給剛好夠用的權限，不多給。這是考試遇到權限題時的標準答案方向。</Flashcard>
  <Flashcard term="MFA">多因素驗證（Multi-Factor Authentication）。Root 帳號務必開啟，等於門禁再加一道密碼。</Flashcard>
  <Flashcard term="Policy 評估">權限評估規則：預設全部拒絕 → 有 Allow 才放行 → 但只要出現明確 Deny，就一律擋下。</Flashcard>
  <Flashcard term="Role vs Key">服務（如 EC2）存取其他服務時用 Role 取得臨時憑證，不要用長期金鑰（Access Key）。</Flashcard>
  <Flashcard term="Root 使用者">帳號的最高權限擁有者。只用來做初始設定，平常改用 IAM User 操作。</Flashcard>
  <Flashcard term="IAM Group">把權限綁在群組上，成員加入即自動取得權限，方便統一管理。</Flashcard>
</Flashcards>

:::tip
本頁之後會隨 Domain 1 其他主題（加密、網路安全）持續增加卡片。
:::
