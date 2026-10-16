---
sidebar_position: 4
title: S3 資料安全
---

# S3 資料安全：別讓你的儲存貯體變成公開資料庫

> S3 設定錯誤導致資料外洩，是現實世界**最常見的雲端事故**。這篇教你怎麼把 S3 鎖好，也是考試的高頻主題。

<Vocab title="📌 先認識這篇會出現的名詞">

- **貯體（Bucket）**：S3 裡存放檔案的「大容器」，名稱全球唯一，像一個資料夾兼網址。
- **物件（Object）**：放在貯體裡的**單個檔案**（圖片、影片、報表等）。
- **貯體政策（Bucket Policy）**：用 JSON 寫的規則，決定**誰能對這個貯體做什麼**。
- **封鎖公開存取（Block Public Access）**：一個總開關，**一鍵確保貯體不會被公開**。
- **預簽章網址（Pre-signed URL）**：一個**有時效的臨時網址**，讓沒權限的人也能在限定時間內下載某個檔案。

</Vocab>

## 為什麼需要特別注意 S3 安全？

<Scenario title="真實情境：一個打勾打錯，百萬筆資料全網公開">

工程師為了方便，把存了客戶個資的 S3 貯體設成「公開」，結果**任何人用網址就能下載**。這類「設定錯誤導致外洩」的新聞每年都在發生。S3 預設其實是安全的（私有），問題幾乎都出在**人為把它打開**。

</Scenario>

## S3 的四道安全防線（由外到內）

<div className="flow">
  <div className="flow-node">① 封鎖公開存取</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">② 貯體政策 / IAM</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">③ 加密</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">④ 版本控制 / 稽核</div>
</div>

### ① 封鎖公開存取（Block Public Access）—— 最重要的總開關

這是 S3 安全的**第一道、也是最關鍵的防線**。帳號層級與貯體層級都可以開啟，**預設是開著的**。除非你真的要做公開網站，否則**永遠保持開啟**。

:::tip[💡 考試重點]
題目若問「如何確保一個貯體**絕對不會**被意外公開」，答案就是 **啟用 Block Public Access**。它會凌駕（覆蓋）任何不小心設成公開的貯體政策或 ACL。
:::

### ② 誰能存取：貯體政策 vs IAM vs ACL

| 方式 | 用在哪 | 白話 |
| --- | --- | --- |
| **IAM 政策** | 綁在「使用者／角色」上 | 控制「**這個人**能碰哪些 S3」 |
| **貯體政策（Bucket Policy）** | 綁在「貯體」上 | 控制「**這個貯體**允許誰來碰」，也能做跨帳號分享 |
| **ACL（存取控制清單）** | 舊方法 | AWS 已不建議使用，盡量改用前兩者 |

### ③ 加密

搭配上一篇的 [KMS](./kms.md)：開啟**預設加密（SSE-KMS 或 SSE-S3）**，讓所有上傳檔案自動靜態加密；傳輸時用 **HTTPS**。

### ④ 版本控制與稽核

- **版本控制（Versioning）**：檔案被覆蓋或刪除時保留舊版，可救回誤刪或被勒索軟體加密的檔案。
- **MFA Delete**：刪除物件需要額外的 MFA 驗證，防止惡意刪除。
- **S3 存取日誌 / CloudTrail**：記錄誰存取了什麼（詳見下一篇[稽核與監控](./logging-monitoring.md)）。

## 怎麼安全地分享「單一檔案」給外部？

<Analogy title="🎟️ 生活比喻：預簽章網址 = 限時入場券">

你不想把整個貯體公開，但要讓客戶下載一份報表。**預簽章網址（Pre-signed URL）** 就像一張**限時入場券**：拿著這個網址的人，可以在你設定的時間內（例如 15 分鐘）下載那**一個檔案**，過期自動失效。既安全又方便。

</Analogy>

## 實務應用

### 🛠️ 動手做：確認貯體沒有公開 + 產生限時下載連結

**確認封鎖公開存取：**

1. 進 `S3` → 點貯體 → **權限（Permissions）** 頁籤
2. 確認 **封鎖公開存取（Block public access）** 顯示為 **On（已開啟）**

**用 CLI 產生一個 15 分鐘有效的下載連結：**

```bash
# 產生預簽章網址，900 秒（15 分鐘）後失效
$ aws s3 presign s3://my-company-reports/report.csv \
    --expires-in 900
# 會回傳一串長網址，給對方就能限時下載
```

**（進階）用貯體政策強制所有連線都走 HTTPS：**

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Deny",
    "Principal": "*",
    "Action": "s3:*",
    "Resource": "arn:aws:s3:::my-company-reports/*",
    "Condition": { "Bool": { "aws:SecureTransport": "false" } }
  }]
}
```

*這段政策的意思：只要不是用 HTTPS（SecureTransport=false）就拒絕，等於強制加密傳輸。*

<Cost>

S3 的安全功能——**封鎖公開存取、貯體政策、版本控制開關、預簽章網址——本身都免費**。要注意的是：開啟**版本控制**後，舊版本仍佔用儲存空間（會計入儲存費），可搭配**生命週期規則**自動清理舊版本來省錢。

</Cost>

:::warning[🚑 實務常見錯誤]
- **為了「暫時方便」把貯體設公開**，然後忘記關 → 最常見的外洩原因。要分享單一檔案請用**預簽章網址**，不要開放整個貯體。
- **以為私有就不用加密**：存取控制和加密是**兩回事**，兩個都要做。
- **關閉版本控制以為能省錢**，卻失去誤刪救援能力 → 建議保留版本控制，用生命週期規則清理舊版即可。
:::

## 下一步

- ⚡ 複習：[Domain 1 重點速記 / 閃卡](./flashcards.md)
- ✍️ 測驗：[Domain 1 原創練習題](./quiz.md)
- 📖 下一篇：[機密管理：Secrets Manager vs Parameter Store](./secrets-management.md)
