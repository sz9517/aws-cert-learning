---
sidebar_position: 6
title: 稽核與監控：CloudTrail / Config / GuardDuty
---

# 稽核與監控：出事了，你查得出來嗎？

> 安全不只是「擋」，還要能「**看見**」——誰做了什麼、系統有沒有異常。這四個服務很容易搞混，這篇幫你一次分清楚（考試很愛比較）。

<Vocab title="📌 先認識這篇會出現的名詞">

- **CloudTrail**：記錄「**誰、在什麼時候、對 AWS 做了什麼操作**」的稽核日誌（API 歷史）。
- **CloudWatch**：監控「**系統的健康與效能指標**」（CPU、記憶體、流量）並能收集日誌、設警報。
- **AWS Config**：記錄「**資源的設定狀態與變更歷史**」，並檢查是否**符合規範**。
- **GuardDuty**：用機器學習**自動偵測可疑／威脅行為**的服務。

</Vocab>

## 為什麼需要它們？

<Scenario title="真實情境：某台伺服器半夜被人改了設定">

隔天系統出問題，老闆問：「**是誰**在幾點改的？改了**什麼**？」如果沒有稽核與監控，你只能兩手一攤。有了這些服務，你能精準回答每一個「誰、何時、做了什麼、系統當時狀況如何」。

</Scenario>

## 四個服務，各司其職（這張表是重點）

| 服務 | 回答的問題 | 一句話定位 | 生活比喻 |
| --- | --- | --- | --- |
| **CloudTrail** | 「**誰**做了什麼操作？」 | API 操作的**稽核紀錄** | 大樓的**門禁刷卡紀錄** |
| **CloudWatch** | 「系統**現在健康嗎**？」 | 效能**監控**與警報 | 病人的**心跳血壓監視器** |
| **AWS Config** | 「設定**被改成什麼**？合不合規？」 | 資源**設定變更**追蹤與合規 | 房間的**裝潢變更紀錄** |
| **GuardDuty** | 「有沒有**壞人**在搞鬼？」 | 智慧**威脅偵測** | 大樓的**保全監控中心** |

:::tip[💡 考試最常考的區分]
- 要查「**哪個使用者刪了某個資源 / 呼叫了哪個 API**」→ **CloudTrail**（稽核、API 歷史）。
- 要「**監控 CPU 使用率並在過高時發警報**」→ **CloudWatch**。
- 要「**確保所有 S3 貯體都有加密，並在不合規時告警**」→ **AWS Config**（合規檢查）。
- 要「**自動偵測異常登入、惡意 IP 連線**」→ **GuardDuty**。
:::

## 它們怎麼搭配（圖解）

<div className="flow">
  <div className="flow-node">使用者操作</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">CloudTrail 記下「誰做了什麼」</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">GuardDuty 分析日誌找威脅</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">CloudWatch 發出警報通知你</div>
</div>

*圖：這幾個服務常常串在一起——CloudTrail 提供紀錄、GuardDuty 分析、CloudWatch 告警。*

## 實務應用

### 🛠️ 動手做：開啟 CloudTrail 記錄帳號所有操作

1. 進主控台 → 搜尋 `CloudTrail` → **建立追蹤（Create trail）**
2. 命名 `account-activity`，指定一個 S3 貯體存放日誌（會自動建議一個）
3. 建立後，帳號內**所有 API 操作都會被記錄**
4. 之後在 **事件歷史（Event history）** 就能搜尋「誰在何時做了什麼」

用 CLI 查最近的操作紀錄：

```bash
# 查最近由某使用者執行的操作
$ aws cloudtrail lookup-events \
    --lookup-attributes AttributeKey=Username,AttributeValue=alice \
    --max-results 10
```

<Cost>

- **CloudTrail**：**管理事件的第一份追蹤免費**（記錄 API 操作）；資料事件、額外追蹤才計費。
- **AWS Config**：按**記錄的設定項目數**與**規則評估次數**計費，資源多時要留意。
- **GuardDuty**：按分析的日誌量計費，有 **30 天免費試用**。
- **CloudWatch**：基本指標免費，自訂指標、日誌儲存與警報才計費。
- 練習建議：CloudTrail 的免費追蹤可以放心開；GuardDuty / Config 測完記得關閉，避免持續計費。

</Cost>

:::warning[🚑 實務常見錯誤]
- **把 CloudTrail 和 CloudWatch 搞混**：記住「**Trail = 誰做了什麼（稽核）**」「**Watch = 系統好不好（效能監控）**」。
- **從沒開 CloudTrail**：出事時完全查不到歷史，等於沒有監視器。建議帳號一開就啟用。
- **日誌沒保護**：存放日誌的 S3 貯體要設好權限與加密，否則稽核紀錄本身被竄改就失去意義。
:::

## Domain 1 到這裡的地圖

你已經走完 Domain 1「設計安全的架構」的主要主題：

1. [IAM 身分與存取管理](./iam.md) — 誰能做什麼
2. [資料加密（KMS）](./kms.md) — 資料上鎖
3. [Security Group vs NACL](./security-group-nacl.md) — 網路防火牆
4. [S3 資料安全](./s3-security.md) — 儲存別外洩
5. [機密管理](./secrets-management.md) — 密碼別寫死
6. **稽核與監控**（本篇） — 看得見、查得到

<Refs>

- [AWS CloudTrail 使用者指南](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-user-guide.html)
- [AWS Config 是什麼](https://docs.aws.amazon.com/config/latest/developerguide/WhatIsConfig.html)
- [Amazon GuardDuty 是什麼](https://docs.aws.amazon.com/guardduty/latest/ug/what-is-guardduty.html)

</Refs>

## 下一步

- ⚡ 複習全部：[Domain 1 重點速記 / 閃卡](./flashcards.md)
- ✍️ 驗收：[Domain 1 原創練習題](./quiz.md)
