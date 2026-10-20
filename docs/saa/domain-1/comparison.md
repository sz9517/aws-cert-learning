---
sidebar_position: 6.5
title: 服務比較與考前速查
---

# Domain 1 服務比較與考前速查

> 這一頁把 Domain 1（安全）裡**最容易混淆**的服務整理成比較表，考前快速掃一遍最有效率。每張表後面都附一句「**考試怎麼選**」的決策提示——考試題幹看到關鍵字，就能直接對應到答案。

:::tip 怎麼用這頁
先讀完各主題頁建立觀念，再用這頁做「考前最後複習」。看到比較表時，重點記住**每個服務「只有它能做」的那一格**，那通常就是考題的判別點。
:::

## 1. Security Group vs NACL（網路防火牆）

| 比較項目 | Security Group（安全群組） | NACL（網路存取控制清單） |
|---|---|---|
| 作用層級 | 執行個體（ENI）層級 | 子網路層級 |
| 狀態性 | **有狀態**（回應流量自動放行） | **無狀態**（進、出要分別設規則） |
| 規則類型 | 只有 Allow（允許） | Allow 與 **Deny（拒絕）** 都有 |
| 規則評估 | 全部規則一起看 | **依編號由小到大**，命中即停 |
| 預設行為 | 預設全部拒絕，需明確允許 | 預設 NACL 全部允許；自訂則全部拒絕 |

**考試怎麼選**：要「針對單一伺服器」控管、且希望回應自動放行 → **Security Group**；要在「整個子網路」擋掉特定 IP（Deny） → **NACL**。題幹出現「連得進去但連不出來」通常就是 NACL 無狀態、漏設 outbound。

## 2. KMS 金鑰類型

| 比較項目 | AWS 擁有金鑰<br/>(AWS owned) | AWS 託管金鑰<br/>(AWS managed) | 客戶託管金鑰<br/>(Customer managed, CMK) |
|---|---|---|---|
| 誰管理 | AWS，使用者看不到 | AWS 代管（`aws/服務名`） | **使用者自己** |
| 自訂金鑰政策 | 否 | 否 | **可以** |
| 控制輪替週期 | 否 | 自動每年輪替、不可改 | **可自訂**（可開啟自動輪替） |
| 可否稽核使用 | 否 | 可（CloudTrail） | **可（CloudTrail）** |
| 費用 | 免費 | 免費（金鑰本身） | 每把每月費用 + API 呼叫費 |

**考試怎麼選**：題幹只要出現「**自訂金鑰政策／自行控制輪替／跨帳號共用金鑰**」→ 一律選 **客戶託管金鑰（CMK）**。不在意控制、只要加密 → AWS 託管金鑰即可。

## 3. Secrets Manager vs Parameter Store

| 比較項目 | AWS Secrets Manager | SSM Parameter Store |
|---|---|---|
| 主要用途 | 機密（密碼、API 金鑰、DB 憑證） | 設定參數（也能存機密） |
| **自動輪替** | **內建**（與 RDS 等整合） | 無（要自己寫 Lambda） |
| 加密 | 預設以 KMS 加密 | SecureString 以 KMS 加密 |
| 費用 | 每個機密每月費用 + API 費 | 標準參數**免費**；進階參數才收費 |

**考試怎麼選**：題幹強調「**自動輪替**資料庫密碼、不想自己維護輪替程式」→ **Secrets Manager**；只是要存一般設定、要**最省成本** → **Parameter Store 標準參數**。

## 4. CloudTrail vs Config vs GuardDuty（三大稽核監控服務）

| 服務 | 回答的問題 | 典型用途 |
|---|---|---|
| **CloudTrail** | 「**誰**、**何時**、對 AWS 做了哪個 **API 操作**？」 | 行為稽核、追查是誰刪了資源 |
| **AWS Config** | 「資源的**設定**長怎樣、有沒有**合規**、何時變更？」 | 設定合規追蹤、偵測未加密磁碟等 |
| **GuardDuty** | 「有沒有**威脅**／異常行為？」 | 智慧威脅偵測（挖礦、惡意 IP、異常 API） |

**考試怎麼選**：關鍵字對應——「**誰呼叫了哪個 API**」→ CloudTrail；「**設定是否合規／設定變更歷史**」→ Config；「**自動偵測威脅／可疑行為**」→ GuardDuty。

## 5. WAF vs Shield vs ACM（應用層防護）

| 服務 | 防什麼／做什麼 | 作用層 |
|---|---|---|
| **AWS WAF** | 過濾惡意 HTTP 請求（SQL injection、XSS、依規則擋 IP／字串） | 第 7 層（應用層） |
| **AWS Shield Standard** | 自動、免費的基礎 DDoS 防護（預設開啟） | 第 3／4 層 |
| **AWS Shield Advanced** | 進階 DDoS 防護、費用補償、24/7 支援 | 第 3／4 層 |
| **ACM** | 簽發與**自動續約** TLS/SSL 憑證（HTTPS 加密） | 傳輸加密（不是攻擊防護） |

**考試怎麼選**：「擋 **SQL injection／XSS** 等請求內容」→ WAF；「擋大規模 **DDoS** 流量」→ Shield；「要 **HTTPS 憑證且自動續約**」→ ACM。注意 ACM 是**加密**不是**防攻擊**，別混。

## 6. VPC Gateway Endpoint vs Interface Endpoint（PrivateLink）

| 比較項目 | Gateway Endpoint | Interface Endpoint（PrivateLink） |
|---|---|---|
| 支援的服務 | **只有 S3 與 DynamoDB** | 大多數 AWS 服務（SQS、SNS、KMS…） |
| 運作方式 | 在路由表加一條路由 | 在子網路放一張**私有 IP 網卡（ENI）** |
| 費用 | **免費** | 每小時費 + 資料處理費 |

**考試怎麼選**：要讓私有子網路私密連 **S3／DynamoDB** 且**省錢** → **Gateway Endpoint**（免費）；連**其他服務**（SQS、SNS 等）→ **Interface Endpoint**。看到「不經過網際網路 + S3」幾乎都是 Gateway Endpoint。

## 7. IAM 政策類型

| 政策類型 | 綁在誰身上 | 用途 |
|---|---|---|
| Identity-based（身分型） | 使用者／群組／角色 | 給這個身分「能做什麼」 |
| Resource-based（資源型） | 資源（如 S3 貯體政策） | 給「哪些人／帳號」能存取這個資源，可跨帳號 |
| **SCP**（服務控制政策） | Organizations 帳號／OU | 設整個帳號的**權限天花板**（連管理員也擋得住） |
| **Permissions boundary**（權限邊界） | 單一使用者／角色 | 設**這個身分**的權限上限（取交集） |

**考試怎麼選**：「**整個帳號**都不能用某服務、連管理員也不行」→ **SCP**；「限制**單一身分**的權限上限、常用於委派建立角色」→ **Permissions boundary**；「**跨帳號**存取某資源」→ **Resource-based policy**（搭配對方的 Role/STS）。

<Refs>

- [Security groups 與 Network ACLs 比較](https://docs.aws.amazon.com/vpc/latest/userguide/infrastructure-security.html)
- [AWS KMS 金鑰概念](https://docs.aws.amazon.com/kms/latest/developerguide/concepts.html)
- [SCP 與 permissions boundary（IAM 權限評估）](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html)
- [VPC Endpoint 類型](https://docs.aws.amazon.com/vpc/latest/privatelink/concepts.html)

</Refs>
