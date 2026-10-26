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

## 為什麼要「三個」？一句話分工（最容易混的就是這裡）

很多人第一個反應是：「不是都在看安全嗎？開一個不就好了？」關鍵是**它們看的東西根本不一樣**，缺一個就有一塊盲區：

<Analogy title="🏢 生活比喻：一棟大樓的三種紀錄">

- **CloudTrail = 門禁刷卡機**：忠實記下「**誰、幾點、刷了哪道門**」（做了什麼動作）。它不管你進房間後把家具擺成什麼樣，也不管你是不是壞人——**只記動作本身**。
- **AWS Config = 房間現況與裝潢變更簿**：記的是「**房間現在長怎樣、跟規定（例如逃生門不能堵）合不合**」（設定狀態與合規），還能回放「這面牆上週是什麼顏色」。它不在乎是誰刷卡進來的。
- **GuardDuty = 保全判讀中心**：盯著門禁與監視畫面，**判斷「這組行為像不像壞人」**（威脅偵測）——例如「這張卡半夜從沒去過的國家連續刷了 50 次」。它自己不產生紀錄，而是**吃 CloudTrail 等日誌去分析**。

</Analogy>

用一句白話串起來就是：

<div className="flow">
  <div className="flow-node">誰做了什麼？<br/>（CloudTrail）</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">設定合不合規？<br/>（Config）</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">這些行為有沒有威脅？<br/>（GuardDuty）</div>
</div>

:::info[🔑 一個最關鍵的差異：記「動作」還是記「狀態」？]
- **CloudTrail 記的是「動作流水帳」**：10:00 `alice` 呼叫了 `PutBucketPolicy`。它回答「**發生過什麼事**」。
- **Config 記的是「狀態快照與合規」**：S3 貯體 `my-bucket` 現在**是**公開的、而且**違反**「不可公開」規則。它回答「**東西現在長怎樣、合不合規**」。
- 同一件事「某人把貯體改成公開」：**CloudTrail** 告訴你「是 alice 10:00 改的」，**Config** 告訴你「現在它是公開的、不合規，而且上週五之前還是私有的」。兩者**互補**，考試常用這組對比出題。
:::

## 為什麼選它 / 優缺點 / 何時別用（逐一拆解）

### CloudTrail

- **為什麼選它**：這是 AWS 帳號的「**黑盒子**」。任何事後調查、資安鑑識、稽核合規（誰刪了資料庫、誰改了 IAM 權限）都靠它。**出事了要追責任，第一個查的就是 CloudTrail。**
- **優點**：管理事件的第一份追蹤**免費**；開一次就全帳號記錄；可送到 S3 長期保存、送 CloudWatch Logs 做即時告警。
- **缺點／限制**：**資料事件**（如 S3 物件層級的讀寫、Lambda 呼叫）量大且**要另外付費**，全開很貴；日誌有**幾分鐘延遲**，不是即時監控（即時看健康要用 CloudWatch）。
- **何時別用／別誤用**：不要拿它當「效能監控」——它不告訴你 CPU 高不高、也不會主動判斷威脅。它只是忠實的流水帳。

### AWS Config

- **為什麼選它**：當你要回答「**我的資源符合規範嗎？**」「**這個設定是什麼時候被改壞的？**」時用它。它能持續評估規則（如「所有 EBS 必須加密」「安全群組不可開放 0.0.0.0/0 的 22 埠」），**不合規就標記並可自動修復**。
- **優點**：有**設定時間軸**可回放任一資源的歷史狀態；內建大量受控規則；可跨帳號／跨區域彙總合規狀態（Aggregator）。
- **缺點／限制**：**按記錄的設定項目數 + 規則評估次數計費**，資源一多、規則一多，帳單會默默長大；它看的是「設定」，**不看你帳號發生了哪些 API 動作**（那是 CloudTrail）。
- **何時別用／別誤用**：不需要合規稽核、只想知道「誰做了什麼」時，別用 Config——那是 CloudTrail 的活。也別把所有資源類型都開記錄，挑你真正在乎的。

### GuardDuty

- **為什麼選它**：前兩個是「**紀錄**」，GuardDuty 是「**判讀**」。它用機器學習與威脅情報，自動從 CloudTrail、VPC Flow Logs、DNS 日誌裡**揪出可疑行為**（被盜用的憑證、挖礦、對外惡意連線），不用你自己寫規則盯日誌。
- **優點**：**開箱即用、點一下就開**，不用部署代理程式、不用搬日誌；持續更新威脅情報；發現後可自動觸發 EventBridge 做處置。
- **缺點／限制**：**按分析的日誌量計費**，流量大時成本可觀；它只會**告訴你「可疑」**，不會自己幫你擋（要搭配 Lambda／Security Hub 做自動回應）；偶有誤報要人判讀。
- **何時別用／別誤用**：它**不是稽核紀錄**（查歷史用 CloudTrail）、**也不是合規檢查**（合規用 Config）。別期待它回答「誰在幾點做了什麼」——它回答的是「有沒有壞味道」。

:::tip[💡 一句話選型]
- 要**事後追查「誰做了什麼」** → CloudTrail
- 要確認**設定合不合規、回放設定歷史** → Config
- 要**自動被動偵測威脅**、不想自己寫規則 → GuardDuty
- 真實世界三個**常常一起開**：CloudTrail 當資料來源，Config 顧合規，GuardDuty 顧威脅。
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

**預期結果**：回傳一串 JSON 事件，每筆有 `EventName`（如 `DeleteBucket`）、`Username`、`EventTime`、來源 IP 等。這就是「alice 在幾點做了什麼」的鐵證。

:::info[🔑 開 Trail 時最常被忽略的兩個開關]
在主控台建立追蹤時，**預設就是跨所有區域**（維持它別關），而且記得把兩件事做對：
- **多區域（multi-region）**：確保在**任何區域**發生的操作都會被記下，否則攻擊者只要跑去你沒開的區域動手，你就查不到。
- **日誌檔案驗證（log file validation）**：勾起來後 CloudTrail 會對日誌做數位簽章，事後能證明**日誌沒被竄改**，稽核才站得住腳。
用 CLI 一次設好這兩項：

```bash
$ aws cloudtrail create-trail \
    --name account-activity \
    --s3-bucket-name my-cloudtrail-logs \
    --is-multi-region-trail \
    --enable-log-file-validation
# 建立後要手動開始記錄
$ aws cloudtrail start-logging --name account-activity
```

**預期結果**：`create-trail` 回傳 trail 的 ARN 與設定（`IsMultiRegionTrail: true`、`LogFileValidationEnabled: true`）；`start-logging` 無輸出即成功，之後 S3 貯體裡會開始出現按日期分層的日誌檔。
:::

### 🛠️ 動手做：用 Config 規則檢查「S3 貯體有沒有公開」

CloudTrail 只告訴你「誰做了什麼」，但要**持續確認設定合不合規**得靠 Config。以下用一條 AWS 受控規則抓出被設成公開的 S3 貯體：

1. 主控台 → 搜尋 `Config` → **開始使用（Set up AWS Config）**，選要記錄的資源與存日誌的 S3 貯體
2. 進 **規則（Rules）→ 新增規則**，搜尋受控規則 `s3-bucket-public-read-prohibited` 並套用
3. 等幾分鐘，Config 會把現有 S3 貯體**逐一評估**為 **合規（Compliant）** 或 **不合規（Non-compliant）**

用 CLI 套用同一條規則並查結果：

```bash
# 套用一條 AWS 受控規則：禁止 S3 貯體可被公開讀取
$ aws configservice put-config-rule \
    --config-rule '{"ConfigRuleName":"s3-no-public-read","Source":{"Owner":"AWS","SourceIdentifier":"S3_BUCKET_PUBLIC_READ_PROHIBITED"}}'

# 查哪些資源不合規
$ aws configservice get-compliance-details-by-config-rule \
    --config-rule-name s3-no-public-read \
    --compliance-types NON_COMPLIANT
```

**預期結果**：`put-config-rule` 無輸出即成功；過幾分鐘後 `get-compliance-details-by-config-rule` 會列出**所有被設成公開讀取的貯體**，每筆標 `ComplianceType: NON_COMPLIANT` 並附資源 ID。你就能一眼抓出「哪個貯體外洩風險」，而不用自己一個個點開看。

<Cost>

- **CloudTrail**：**管理事件的第一份追蹤免費**（記錄 API 操作）；資料事件、額外追蹤才計費。
- **AWS Config**：按**記錄的設定項目數**與**規則評估次數**計費，資源多時要留意。
- **GuardDuty**：按分析的日誌量計費，有 **30 天免費試用**。
- **CloudWatch**：基本指標免費，自訂指標、日誌儲存與警報才計費。
- 練習建議：CloudTrail 的免費追蹤可以放心開；GuardDuty / Config 測完記得關閉，避免持續計費。

</Cost>

:::warning[🚑 常踩雷]
- **把三者搞混（最高頻考點）**：**CloudTrail = 誰做了什麼（動作稽核）**、**Config = 設定合不合規（狀態與合規）**、**GuardDuty = 有沒有威脅（智慧偵測）**。再加一個常被混進來的 **CloudWatch = 系統好不好（效能監控）**。題目問「誰刪的」選 CloudTrail、問「合不合規」選 Config、問「偵測異常行為」選 GuardDuty，別互換。
- **CloudTrail 沒開多區域**：只開單一區域，攻擊者跑去你沒覆蓋的區域動手就查不到。建立追蹤時務必 `--is-multi-region-trail`，讓**任何區域**的操作都被記下。
- **日誌沒存到 S3＋沒加密／沒驗證**：稽核紀錄若能被竄改就失去意義。存日誌的 S3 貯體要**開加密、鎖權限**，並開 **log file validation（日誌檔案驗證）**，事後才能證明紀錄沒被動過手腳。
- **Config 規則與記錄成本失控**：Config **按記錄的設定項目數 + 規則評估次數計費**，把所有資源類型都開記錄、規則又一堆，帳單會默默爆。只記你真正在乎的資源類型與規則。
- **以為 GuardDuty 會自己擋**：它只**告警**不會**阻擋**，要搭 EventBridge＋Lambda／Security Hub 做自動回應。測完也記得關，它按日誌量持續計費。
- **從沒開 CloudTrail**：出事時完全查不到歷史，等於沒有監視器。帳號一開就該啟用（第一份管理事件追蹤免費）。
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
