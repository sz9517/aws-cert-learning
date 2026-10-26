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

#### 為什麼 Block Public Access 預設全開？它跟政策是什麼關係？

AWS 2023 年起對**新貯體**預設把四個 Block Public Access 開關**全部打開**，而且**新貯體預設停用 ACL**。原因很單純：史上最大宗的雲端外洩都來自「有人寫了一條公開的政策或 ACL，卻沒人發現」。與其事後補救，不如預設就擋死。

**它和政策的關係是「最後一道防護網」，不是取代政策：**

<div className="flow">
  <div className="flow-node">你寫的政策/ACL 說「允許公開」</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Block Public Access 再檢查一次</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">只要開關是 On，照樣擋下、拒絕公開</div>
</div>

換句話說：**政策／ACL 決定「誰可以存取」，Block Public Access 決定「允不允許任何公開設定生效」**。即使你（或某個同事、某段 IaC）不小心寫了一條 `Principal: "*"` 的公開政策，只要 Block Public Access 開著，公開就是不會發生。兩者**同時存在、互不取代**：平常靠政策做細緻授權，Block Public Access 當「就算手滑也不會外洩」的保險。

:::info[🔑 一個容易混的觀念]
Block Public Access **只擋「公開」**（對匿名大眾或整個網際網路開放），**不會**擋你用貯體政策／IAM 做的**具名授權**（指定某個帳號、某個角色）。所以開著它，完全不影響你正常地跨帳號分享或給特定服務存取。
:::

### ② 誰能存取：貯體政策 vs IAM vs ACL

| 方式 | 用在哪 | 白話 |
| --- | --- | --- |
| **IAM 政策** | 綁在「使用者／角色」上 | 控制「**這個人**能碰哪些 S3」 |
| **貯體政策（Bucket Policy）** | 綁在「貯體」上 | 控制「**這個貯體**允許誰來碰」，也能做跨帳號分享 |
| **ACL（存取控制清單）** | 舊方法 | AWS 已不建議使用，盡量改用前兩者 |

#### 三種方式怎麼選？為什麼現在建議用 policy、少用 ACL？

白話的判斷順序：**先想「這是在管一個人，還是在管一個貯體」**。

- 要控制「**這個使用者／角色**能碰哪些貯體」→ 用 **IAM 政策**（權限集中在身分上，好盤點「某人到底能動什麼」）。
- 要控制「**這個貯體**開放給誰」、或要**跨帳號分享**、或要寫**強制 HTTPS／強制加密**這類條件 → 用 **貯體政策**（權限集中在資源上，一眼看出「這個桶對外開了什麼」）。
- **ACL**：盡量別用。

<Analogy title="🏢 生活比喻：IAM 是員工識別證，貯體政策是房間門口的訪客名單">

- **IAM 政策 = 員工識別證**：決定這位員工（使用者／角色）自己能進公司裡哪些房間（哪些貯體）。
- **貯體政策 = 貼在某個房間門口的名單**：決定這個房間（貯體）放哪些人進來，連「外公司的人（跨帳號）」都能寫進名單。
- **ACL = 很舊的那種「每張桌子各貼一張小紙條」**：管得又細又散，一個物件一張，數量一多根本盤不完，所以 AWS 要你別再用。

</Analogy>

| 方式 | 優點 | 缺點 / 限制 | 什麼時候別用 |
| --- | --- | --- | --- |
| **IAM 政策** | 權限綁在身分上、集中管理「某人能做什麼」；支援群組與條件 | 看不出「一個貯體到底對外開了什麼」；**無法做跨帳號、無法給匿名大眾** | 要跨帳號分享、要對貯體本身寫條件（如強制 TLS）時，它辦不到 |
| **貯體政策** | 權限集中在資源上、一眼看懂這桶開了什麼；**可跨帳號**、可寫 `Condition`（強制 HTTPS／加密／來源 IP） | 單一政策有大小上限（20 KB）；規則多時要小心別自相矛盾 | 幾乎都該用；唯一要注意別手滑寫出 `Principal: "*"` 的公開條款 |
| **ACL（舊）** | 歷史產物，早年唯一能做「物件層級公開」的方式 | 粒度粗、分散在每個物件上、難稽核；跟現代條件式授權不相容 | **幾乎永遠別用**。新貯體預設已停用 ACL，除非你有「物件由別的帳號擁有」等極少數老場景 |

:::tip[💡 考試重點：policy vs ACL 關鍵字]
- 題目出現 **「跨帳號存取」「強制 HTTPS／強制加密」「限制來源 IP」「VPC Endpoint 才能存取」** → 幾乎都是 **貯體政策**（這些靠 `Condition` 寫）。
- 題目出現 **「某使用者／某應用程式角色該有哪些 S3 權限」** → **IAM 政策**。
- 題目若說 **「現代化、集中管理存取、停用 ACL」** → 啟用 **S3 Object Ownership = Bucket owner enforced**（直接關掉 ACL，全部改走政策）。看到「想擺脫 ACL」就選它。
:::

### ③ 加密

搭配上一篇的 [KMS](./kms.md)：開啟**預設加密（SSE-KMS 或 SSE-S3）**，讓所有上傳檔案自動靜態加密；傳輸時用 **HTTPS**。

:::note[💬 一個好消息]
從 2023 年起，**所有 S3 貯體預設就會用 SSE-S3 加密**——就算你什麼都沒設，新上傳的物件也已經在靜態加密了。所以現在的問題不是「要不要加密」，而是「**要用哪一種金鑰管理**」。
:::

#### SSE-S3 vs SSE-KMS vs SSE-C 怎麼選？（取捨、成本、稽核）

三種都是**伺服器端加密（SSE）**，差別只在**金鑰是誰在管、能不能稽核、要不要錢**：

| 選項 | 金鑰由誰管 | 能稽核「誰解密了」嗎 | 成本 | 白話 |
| --- | --- | --- | --- | --- |
| **SSE-S3**（預設） | **AWS 全權代管**，你看不到也碰不到金鑰 | ❌ 不行 | **免費** | 「反正幫我加密就好」——最省事，預設就是它 |
| **SSE-KMS** | 你在 **KMS** 裡的金鑰，可自訂輪替、權限、政策 | ✅ 每次解密都進 **CloudTrail** | KMS 金鑰月費 ＋ **每次 API 呼叫**計費 | 「我要能控管金鑰、要有解密紀錄可查」——合規／稽核首選 |
| **SSE-C** | **你自己**提供並保管金鑰，S3 用完即丟不留存 | 由你自己 | 免費（但你得自扛金鑰管理） | 「金鑰絕不能交給 AWS」——極少數法規要求才用 |

**怎麼選的白話版：**

- **預設、不想傷腦筋** → **SSE-S3**。免費、自動、對絕大多數資料夠用。
- **要合規、要輪替金鑰、要知道「誰在什麼時候解了這份資料」** → **SSE-KMS**。它的 CloudTrail 紀錄常是稽核題的正解。
- **連 AWS 都不能持有金鑰**（極少見的法規場景） → **SSE-C**，但代價是**金鑰遺失＝資料永遠救不回**，且每次存取都得自己帶金鑰。

<Analogy title="🔑 生活比喻：三種保險箱">

- **SSE-S3 = 旅館的保險箱**：旅館（AWS）幫你上鎖開鎖，你不用管鑰匙，方便但你沒有「誰開過」的紀錄。
- **SSE-KMS = 銀行保管箱**：鑰匙在你名下（KMS），每次有人開箱銀行都登記一筆（CloudTrail），要查有跡可循，但保管箱要月租＋每次開箱收手續費。
- **SSE-C = 你自己的掛鎖，鑰匙永遠自己帶**：AWS 只負責把你帶來的鎖掛上，鑰匙從不留存；鑰匙掉了就永遠打不開。

</Analogy>

:::tip[💡 考試重點：加密選型關鍵字]
- 題目講 **「要稽核／追蹤誰存取了加密資料」「要控管並輪替金鑰」「法規要求 CMK（客戶管理金鑰）」** → **SSE-KMS**。
- 題目講 **「最省事、不想管金鑰、預設即可」** → **SSE-S3**。
- 題目講 **「金鑰必須由客戶自行保管、AWS 不得持有」** → **SSE-C**。
- 大流量下 **SSE-KMS 可能撞到 KMS 的 API 限流**，解法是開 **S3 Bucket Keys**（大幅減少對 KMS 的呼叫次數、順便省錢）。看到「KMS 成本高／被限流」就想到 Bucket Keys。
:::

**用 CLI 對貯體開啟 SSE-KMS 預設加密：**

```bash
# 把整個貯體的預設加密設成 SSE-KMS，並開啟 Bucket Keys 省成本
$ aws s3api put-bucket-encryption \
    --bucket my-company-reports \
    --server-side-encryption-configuration '{
      "Rules": [{
        "ApplyServerSideEncryptionByDefault": {
          "SSEAlgorithm": "aws:kms",
          "KMSMasterKeyID": "arn:aws:kms:ap-northeast-1:111122223333:key/abcd-1234"
        },
        "BucketKeyEnabled": true
      }]
    }'
# 預期結果：指令沒有輸出就代表成功；之後上傳的物件會自動用這把 KMS 金鑰加密，
# 且可到該物件的「屬性 → 加密」頁或用 head-object 看到 "ServerSideEncryption": "aws:kms"
```

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

**（進階）用貯體政策把某個外部帳號設成「唯讀」（跨帳號分享）：**

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "AllowPartnerReadOnly",
    "Effect": "Allow",
    "Principal": { "AWS": "arn:aws:iam::444455556666:root" },
    "Action": ["s3:GetObject", "s3:ListBucket"],
    "Resource": [
      "arn:aws:s3:::my-company-reports",
      "arn:aws:s3:::my-company-reports/*"
    ]
  }]
}
```

*這段的意思：只允許合作夥伴帳號 `444455556666` **讀取與列出**這個貯體，不給寫入或刪除。*

**用 CLI 套上這段政策並驗證：**

```bash
# 把上面的 JSON 存成 policy.json，套到貯體上
$ aws s3api put-bucket-policy \
    --bucket my-company-reports \
    --policy file://policy.json

# 預期結果：指令沒有輸出即成功。回查確認：
$ aws s3api get-bucket-policy --bucket my-company-reports
# 會把你剛套上的 JSON 原樣回傳出來
```

:::info[🔑 這招為什麼需要「兩邊都設」]
貯體政策只是「貯體這端」答應了。對方帳號 `444455556666` 裡的使用者，**自己的 IAM 政策**也要允許 `s3:GetObject`，才真的連得進來——跨帳號存取是**兩邊都要點頭**。另外，若貯體開了 Block Public Access，這類**具名**授權完全不受影響（它只擋匿名公開）。
:::

<Cost>

S3 的安全功能——**封鎖公開存取、貯體政策、版本控制開關、預簽章網址——本身都免費**。要注意的是：開啟**版本控制**後，舊版本仍佔用儲存空間（會計入儲存費），可搭配**生命週期規則**自動清理舊版本來省錢。

</Cost>

:::warning[🚑 常踩雷]
- **為了「暫時方便」把貯體設公開**，然後忘記關 → 最常見的外洩原因。要分享單一檔案請用**預簽章網址**，不要開放整個貯體。
- **用 ACL 誤把物件設成公開**：舊的 `public-read` ACL 很容易手滑開到。新貯體請直接啟用 **Object Ownership = Bucket owner enforced** 停用 ACL，全部改走貯體政策，從根源避免。
- **為了「讓某個東西能連」而關掉 Block Public Access**：這是把保險絲拔掉。正確做法是**保持 Block Public Access 開著**，改用**具名授權**（貯體政策指定帳號／角色）或**預簽章網址**——它們都不受 Block Public Access 影響。
- **沒強制 TLS／沒強制加密**：資料可能以明文在網路上傳輸、或有人上傳未加密物件。用貯體政策的 `Condition` 兩道都補上：`aws:SecureTransport=false` 一律 `Deny`（強制 HTTPS）、`s3:x-amz-server-side-encryption` 不符就 `Deny`（強制加密上傳）。
- **以為私有就不用加密**：存取控制和加密是**兩回事**，兩個都要做。
- **寫貯體政策手滑打成 `Principal: "*"`**：那就是對全世界開放。寫完務必看一下 S3 主控台貯體列表有沒有跳 **「Public」** 紅字警示。
- **關閉版本控制以為能省錢**，卻失去誤刪救援能力 → 建議保留版本控制，用生命週期規則清理舊版即可。
:::

<Refs>

- [Amazon S3 安全性](https://docs.aws.amazon.com/AmazonS3/latest/userguide/security.html)
- [封鎖公開存取（Block Public Access）](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html)

</Refs>

## 下一步

- ⚡ 複習：[Domain 1 重點速記 / 閃卡](./flashcards.md)
- ✍️ 測驗：[Domain 1 原創練習題](./quiz.md)
- 📖 下一篇：[機密管理：Secrets Manager vs Parameter Store](./secrets-management.md)
