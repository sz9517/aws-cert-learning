---
sidebar_position: 2
title: 資料加密（KMS）
---

# 資料加密與 KMS：幫資料上鎖的「金鑰保險箱」

> 加密是 Domain 1 的核心考點之一。這篇帶你從「為什麼要加密」一路到「KMS 怎麼用」，完全不用密碼學背景。

<Vocab title="📌 先認識這篇會出現的名詞（完全沒碰過也能懂）">

- **加密（Encryption）**：把看得懂的資料（明文）用一把「鑰匙」轉成亂碼（密文），沒鑰匙就看不懂。
- **金鑰（Key）**：加密和解密用的那把「鑰匙」，本質是一串很長的亂數。
- **KMS（Key Management Service）**：AWS 幫你**集中保管與管理金鑰**的服務，像一個上鎖的「金鑰保險箱」。
- **靜態加密（At Rest）**：資料**存放在硬碟上**時是加密的（例如存在 S3、EBS 裡）。
- **傳輸中加密（In Transit）**：資料**在網路上傳送**時是加密的（就是網址前面的 `https` / TLS）。

</Vocab>

## 為什麼需要加密？

<Scenario title="真實情境：一顆硬碟被偷走">

公司的伺服器硬碟被偷，裡面有幾十萬筆客戶資料。如果資料**沒加密**，小偷插上電腦就能直接讀取，公司得上新聞、挨罰、賠償。如果資料**有加密**，小偷拿到的只是一堆亂碼——**沒有鑰匙，等於廢鐵**。

</Scenario>

加密要做好兩個方向，**兩個都要**：

| 方向 | 白話 | 怎麼達成 |
| --- | --- | --- |
| **靜態加密（At Rest）** | 資料**躺在硬碟**時是鎖住的 | S3、EBS、RDS 開啟加密（背後用 KMS） |
| **傳輸中加密（In Transit）** | 資料**在路上移動**時是鎖住的 | 用 HTTPS / TLS 連線 |

## KMS 是什麼？用保險箱比喻

<Analogy title="🔐 生活比喻：把 KMS 想成銀行的金庫 + 鑰匙管理室">

- 你的資料 = 保險箱裡的貴重物品
- **資料金鑰（Data Key）** = 開你那個保險箱的鑰匙
- **KMS 主金鑰（KMS Key / CMK）** = 「鑰匙管理室」裡那把**用來鎖住所有鑰匙的總鑰匙**，它**永遠不離開 KMS**（連你都拿不出來，只能請 KMS 代為加解密）
- 這樣就算有人偷到你的「資料金鑰」，那把鑰匙本身也是被 KMS 總鑰匙鎖住的，沒 KMS 幫忙解不開

這套「用一把金鑰去加密另一把金鑰」的做法，叫 **信封加密（Envelope Encryption）**，是 KMS 的核心設計。

</Analogy>

## KMS 金鑰的三種類型（考試常考）

| 類型 | 誰建立／管理 | 特色 | 費用 |
| --- | --- | --- | --- |
| **AWS 擁有的金鑰（AWS owned）** | AWS 全權管理 | 你看不到、不用管，多個帳號共用 | 免費 |
| **AWS 託管金鑰（AWS managed）** | AWS 管理、對應某服務 | 名稱像 `aws/s3`、`aws/ebs`，自動輪替 | 免費（但 API 呼叫計費） |
| **客戶託管金鑰（Customer managed / CMK）** | **你自己建立與控制** | 可自訂權限、輪替、停用、稽核 | **每把 $1/月** + API 呼叫費 |

:::tip[💡 考試重點：什麼時候要用「客戶託管金鑰（CMK）」？]
當題目強調你需要**自己控制金鑰權限、自訂輪替週期、或要能稽核誰用了金鑰**時，答案就是 **Customer managed key**。如果只是「要加密、但不在意誰管鑰匙」，用 AWS managed key 就夠了（而且免月費）。
:::

## 運作流程圖解（信封加密）

<div className="flow">
  <div className="flow-node">應用程式要存資料</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">向 KMS 要一把資料金鑰</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">用資料金鑰加密資料</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">把「加密後的資料金鑰」跟資料一起存起來</div>
</div>

*圖：資料金鑰本身是被 KMS 主金鑰鎖住的，之後要解密時再請 KMS 把資料金鑰解開。*

## S3 的三種加密方式（高頻考點）

當題目問「S3 怎麼加密」，記住這三個選項的差別：

| 方式 | 全名 | 金鑰誰管 | 重點 |
| --- | --- | --- | --- |
| **SSE-S3** | Server-Side Encryption with S3 keys | AWS 全包 | 最省事，預設選項 |
| **SSE-KMS** | Server-Side Encryption with KMS | 用 KMS（可用你的 CMK） | 可控制權限、可稽核，考題要「稽核／控制」時選它 |
| **SSE-C** | Server-Side Encryption with Customer keys | **你自己提供並保管金鑰** | AWS 不幫你存鑰匙，鑰匙丟了資料就沒了 |

## 實務應用

### 🛠️ 動手做：讓 S3 貯體預設就加密

1. 進 AWS 主控台 → 搜尋 `S3` → 點進你的貯體
2. 上方頁籤選 **屬性（Properties）**
3. 找到 **預設加密（Default encryption）** → 編輯
4. 加密類型選 **SSE-KMS**，金鑰選 `aws/s3`（或你自己的 CMK）→ 儲存
5. 之後上傳的檔案就會**自動加密**，不用每次手動設定

用 CLI 上傳一個檔案並指定 KMS 加密：

```bash
# 上傳檔案並用 KMS 加密
$ aws s3 cp report.csv s3://my-company-reports/ \
    --sse aws:kms

# 查看物件確認已加密
$ aws s3api head-object \
    --bucket my-company-reports \
    --key report.csv
# 回應裡會看到 "ServerSideEncryption": "aws:kms"
```

<Cost>

- **客戶託管金鑰（CMK）**：每把 **US$1／月**（不滿一個月按比例），外加每次加解密的 **API 呼叫費**（每萬次約 US$0.03）。
- **AWS 託管金鑰**（`aws/s3` 等）：**不收月費**，只收 API 呼叫費。
- 練習建議先用 `aws/s3` 這種託管金鑰，不會產生每月 $1 的固定費用。真的建了測試用 CMK，練完記得**排程刪除**（KMS 刪金鑰有 7~30 天等待期）。

</Cost>

:::warning[🚑 實務常見錯誤]
- **把金鑰刪掉／停用 = 資料永久救不回來！** 用該金鑰加密的所有資料都會解不開。刪 KMS 金鑰一定要非常謹慎（所以 AWS 設計了等待期讓你反悔）。
- **以為「有 IAM 權限就能用金鑰」**：KMS 金鑰還有自己的 **金鑰政策（Key Policy）**，IAM 允許 + 金鑰政策允許**兩個都要過**才行。這是很常見的 Access Denied 原因。
- **SSE-C 的鑰匙自己弄丟**：AWS 完全不幫你保管，丟了就是丟了。
:::

:::tip[💡 一句話記住傳輸中 vs 靜態]
- 看到 **HTTPS / TLS / SSL** → 在講**傳輸中加密（In Transit）**
- 看到 **S3 / EBS / RDS 加密、KMS** → 在講**靜態加密（At Rest）**
:::

## 下一步

- ⚡ 複習：[Domain 1 重點速記 / 閃卡](./flashcards.md)
- ✍️ 測驗：[Domain 1 原創練習題](./quiz.md)
- 📖 下一篇：[網路安全：Security Group vs NACL](./security-group-nacl.md)
