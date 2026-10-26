---
sidebar_position: 3
title: KMS 與加密（開發者視角）
---

# KMS 與加密：你的程式怎麼把資料「鎖起來」又「打開」

> 本篇用「開發者視角」帶你搞懂 <Term en="Key Management Service" desc="AWS 的金鑰管理服務，幫你集中建立、保管、授權與稽核加密金鑰，程式只呼叫 API 加解密，拿不到金鑰本體。">KMS</Term>：傳輸中加密 vs 靜態加密差在哪、怎麼用 SDK 直接 `Encrypt`／`Decrypt`（為什麼限 4KB）、大資料為什麼要 `GenerateDataKey` 做**信封加密**、用戶端加密 vs 伺服器端加密怎麼選、對稱 vs 非對稱、AWS 託管 vs 客戶託管金鑰（CMK）怎麼挑、以及金鑰政策 + IAM 的雙重授權踩雷。這些是 DVA-C03 Domain 2（安全）最愛考的開發細節。

<Vocab title="📌 先認識這篇會出現的名詞（完全沒碰過也能懂）">

- **加密（Encryption）**：把看得懂的資料（明文）用一把金鑰換算成看不懂的亂碼（密文），只有拿對金鑰的人才解得回來。
- **金鑰（Key）**：加解密用的那串祕密數字。誰有金鑰，誰就能解密——所以金鑰本身要好好保管。
- **KMS 金鑰（KMS key，舊稱 CMK）**：你在 KMS 裡建立或託管的主金鑰。重點是它**永遠不離開 KMS**——你只能叫 KMS 幫你加解密，拿不到金鑰本體。
- **對稱 vs 非對稱**：對稱是「同一把鑰匙鎖也用它開」；非對稱是「一對鑰匙，公鑰鎖、私鑰開」。
- **信封加密（Envelope Encryption）**：先用一把「資料金鑰」加密大資料，再用 KMS 主金鑰加密那把資料金鑰——像把鑰匙鎖進信封。這是 AWS 加密大資料的標準做法。
- **資料金鑰（Data Key）**：由 KMS 幫你產生、真正拿來加密大資料的那把金鑰。KMS 會一次給你「明文版」和「被主金鑰加密過的版本」。
- **傳輸中 vs 靜態**：傳輸中（in transit）是資料在網路上移動時；靜態（at rest）是資料存在硬碟／資料庫裡不動時。

</Vocab>

:::note[💬 閱讀小提示]
文章裡只要看到帶<Term desc="像這樣！滑鼠移到有虛線的名詞上（手機點一下），就會跳出白話解釋。">虛線底線的名詞</Term>，把滑鼠移上去就會跳出白話解釋。所有名詞也都整理在 [名詞與服務對照表](/glossary)。
:::

## 為什麼需要 KMS？先講一個「金鑰自己藏在程式裡」的災難

假設你要把使用者的身分證字號存進資料庫，老闆要求「一定要加密」。最直覺的做法：自己產生一把金鑰、寫在程式碼或環境變數裡，用它來加解密。

這會出三個大問題：

1. **金鑰外洩就全完蛋**：金鑰寫在程式碼裡，一旦原始碼外流（推上公開 GitHub、被同事截圖），所有加密資料等於沒加密。
2. **沒人管、不能稽核**：誰在什麼時候用這把金鑰解過密？你答不出來。金鑰該換（輪替）了嗎？沒人管。
3. **授權做不細**：想讓 A 服務能加密、但只有 B 服務能解密——自己管金鑰根本做不到這種細緻授權。

<Term en="Key Management Service" desc="AWS 的金鑰管理服務，集中建立、保管、授權與稽核加密金鑰。">KMS</Term> 把這件事扛走：金鑰**永遠鎖在 KMS 裡拿不出來**，你只能呼叫 API「請 KMS 幫我用某把金鑰加／解密」。誰能用哪把金鑰做什麼，全由**金鑰政策 + IAM** 控管；每一次加解密都進 <Term en="CloudTrail" desc="AWS 的 API 操作稽核日誌服務，記錄誰在何時呼叫了哪個 API。">CloudTrail</Term> 稽核。對開發者來說，重點從「怎麼藏金鑰」變成「怎麼呼叫對的 API、把授權設對」。

<Analogy title="🏢 生活比喻：KMS 就像銀行的保險箱室">

- **KMS 金鑰 = 鎖在保險箱室裡的主鑰匙**：你永遠不能把它帶出銀行（金鑰不離開 KMS）。
- **加解密 = 請銀行行員代操作**：你不能自己拿鑰匙，只能填單子請行員（呼叫 API）幫你用某把鑰匙鎖東西或開鎖。
- **金鑰政策 + IAM = 誰能填哪種單子**：授權誰能「用這把鑰匙鎖」、誰能「用它開」。
- **CloudTrail = 保險箱室的監視錄影**：每次有人動用鑰匙都被錄下來，事後查得到。

</Analogy>

## 核心一：傳輸中加密 vs 靜態加密（兩件不同的事）

這是最常被混淆的一組概念，DVA 很愛考你分得清不清：

| | 傳輸中加密（In transit） | 靜態加密（At rest） |
| --- | --- | --- |
| **保護什麼** | 資料在**網路上移動**時不被竊聽／竄改 | 資料**存著不動**時（硬碟、資料庫、物件）不被偷走 |
| **靠什麼做** | <Term en="Transport Layer Security" desc="加密網路連線的通訊協定，HTTPS 底下就是它，確保資料在傳輸過程不被竊聽竄改。">TLS</Term>／HTTPS（憑證加密連線） | KMS 金鑰加密資料本體 |
| **開發者要做的事** | 用 HTTPS endpoint、強制 TLS、驗憑證 | 開啟服務的加密選項並**指定 KMS 金鑰** |
| **典型例子** | 瀏覽器 ↔ API Gateway、SDK ↔ S3 都走 TLS | S3 物件、EBS 磁碟、RDS、DynamoDB 落地加密 |

:::info[🔑 一個最容易搞混的點]
「我的 S3 走 HTTPS 上傳，所以資料加密了」——**只對一半**。HTTPS 只保護**傳輸中**；檔案**落到 S3 硬碟後**要靠 S3 的靜態加密（SSE，用 KMS 金鑰）才算加密。兩件事要分開設，缺一不可。考題常用這個區分當陷阱。
:::

## 核心二：用 SDK 直接 Encrypt / Decrypt（但只能到 4KB）

最簡單的用法是直接把資料丟給 KMS 加密。KMS 幫你用金鑰算出密文、回傳給你；要用時再丟密文回去請它解密。

```python
# Python (boto3)：直接加密一小段敏感字串
import boto3
kms = boto3.client("kms")

# 加密：把明文交給 KMS，拿回密文（CiphertextBlob）
resp = kms.encrypt(
    KeyId="alias/my-app-key",          # 指定要用哪把 KMS 金鑰
    Plaintext=b"my-db-password-123",   # 要加密的明文（bytes）
)
ciphertext = resp["CiphertextBlob"]    # 這段密文可以安全地存進資料庫

# 解密：把密文交回 KMS，拿回明文（不用再指定 KeyId，密文裡已記著用哪把金鑰）
plain = kms.decrypt(CiphertextBlob=ciphertext)["Plaintext"]
print(plain.decode())  # -> my-db-password-123
```

:::warning[🚑 為什麼限 4KB？]
`Encrypt` API **一次最多只能加密 4,096 bytes（4KB）** 的明文。這是硬限制——因為真正的金鑰在 KMS 裡，資料得「傳進 KMS」才能加密，不適合搬大檔。超過 4KB 直接丟 `Encrypt` 會收到 **`ValidationException`**。要加密大檔（照片、備份、大 JSON）**不能**用這招，要改用下面的**信封加密**。
:::

## 核心三：大資料用 GenerateDataKey + 信封加密

既然 KMS 一次只能嚼 4KB，加密大檔怎麼辦？答案是**不把大檔送進 KMS**，而是請 KMS 給你一把**資料金鑰**，你在**本地**用它加密大檔。這就是<Term en="Envelope Encryption" desc="用資料金鑰在本地加密大資料，再用 KMS 主金鑰加密那把資料金鑰一起存放。">信封加密</Term>。

`GenerateDataKey` 會一次回傳**兩樣東西**：

- **`Plaintext`**：資料金鑰的**明文版**——你拿它在本地（記憶體裡）加密大檔，**用完立刻丟掉，絕不落地**。
- **`CiphertextBlob`**：**同一把**資料金鑰被 KMS 主金鑰**加密過的版本**——這個可以安全地跟密文存在一起。

<div className="flow">
  <div className="flow-node">呼叫 GenerateDataKey</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">拿到明文資料金鑰 + 加密版資料金鑰</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">用明文金鑰在本地加密大檔</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">存「密文 + 加密版金鑰」、丟掉明文金鑰</div>
</div>

解密時反過來：先把**加密版資料金鑰**丟回 KMS `Decrypt` 拿回**明文資料金鑰**，再用它在本地解開大檔。

```python
import boto3, os
from cryptography.fernet import Fernet
import base64

kms = boto3.client("kms")

# 1) 請 KMS 產生一把 256-bit 的資料金鑰
dk = kms.generate_data_key(KeyId="alias/my-app-key", KeySpec="AES_256")
plaintext_key = dk["Plaintext"]        # 明文金鑰：本地用完即丟
encrypted_key = dk["CiphertextBlob"]   # 加密版金鑰：跟密文一起存

# 2) 用明文金鑰在本地加密大檔（這裡用 Fernet 示意，實務可用 AES-GCM）
f = Fernet(base64.urlsafe_b64encode(plaintext_key))
big_data = open("report.pdf", "rb").read()
ciphertext = f.encrypt(big_data)

# 3) 存「ciphertext + encrypted_key」，並清掉記憶體裡的明文金鑰
del plaintext_key

# --- 解密時 ---
# 4) 把加密版金鑰丟回 KMS 換回明文金鑰
plaintext_key = kms.decrypt(CiphertextBlob=encrypted_key)["Plaintext"]
f = Fernet(base64.urlsafe_b64encode(plaintext_key))
original = f.decrypt(ciphertext)       # 解回原始大檔
```

<Analogy title="🏢 生活比喻：信封加密就像把鑰匙鎖進保險箱">

- **資料金鑰 = 家裡那把鑰匙**：你用它鎖住大行李（大檔）。
- **用主金鑰加密資料金鑰 = 把鑰匙鎖進銀行保險箱**：鑰匙本身被銀行的主鎖鎖起來，跟行李放一起也不怕。
- **要開行李時**：先去銀行（KMS）用主鎖打開保險箱、拿回鑰匙，再用鑰匙開行李。整個過程主鎖從不離開銀行。

</Analogy>

:::tip[💡 考試重點：什麼時候用哪個]
- 要加密的東西 **≤ 4KB**（密碼、token、設定值）→ 直接 `Encrypt` / `Decrypt`。
- 要加密**大資料 / 檔案 / 整個物件** → `GenerateDataKey` + **信封加密**（本地加密、主金鑰只加密那把資料金鑰）。
- 很多 AWS 服務（S3 SSE-KMS、EBS、RDS）**在底層自動幫你做信封加密**，你只需指定金鑰；要自己在用戶端做時才手寫上面這段。
:::

## 核心四：用戶端加密 vs 伺服器端加密

同樣是加密，資料「在哪裡被加密」決定了你要寫多少程式：

| | 伺服器端加密（SSE） | 用戶端加密（Client-side） |
| --- | --- | --- |
| **誰加密** | **AWS 服務收到資料後**幫你加密再落地 | **你的程式在送出前**就先加密 |
| **明文到過雲端嗎** | 到過（傳輸中靠 TLS 保護）；AWS 看得到明文的瞬間 | **從不**；AWS 只收到密文 |
| **開發者工作量** | 低——開個選項、指定金鑰（如 S3 `SSE-KMS`） | 高——自己用 SDK／加密函式庫（如 **AWS Encryption SDK**）做信封加密 |
| **適用情境** | 絕大多數情況，夠用又省事 | 法規要求「連雲端供應商都不能看到明文」的最高機密資料 |

:::info[🔑 S3 的三種伺服器端加密別搞混]
- **SSE-S3**：用 S3 自己管的金鑰，最省事，但你不能控管／稽核金鑰。
- **SSE-KMS**：用你指定的 KMS 金鑰，**可稽核、可細授權、可輪替**——DVA 最常考這個。
- **SSE-C**：金鑰由你自己提供（每次請求附上），AWS 不保管。
開發者視角預設選 **SSE-KMS**。
:::

## 🧭 為什麼用 KMS 管金鑰？對稱 vs 非對稱、AWS 託管 vs 客戶託管怎麼選

> 這是本篇的核心決策段落。你可能「知道有 KMS」，但面對「對稱還非對稱」「AWS 託管還客戶託管」常常選不下手。這段把取捨攤開講白話。

### 為什麼是 KMS，而不是自己管金鑰？

- **意義**：金鑰**永不離開 KMS**（在 FIPS 140 驗證的硬體裡），你只能呼叫 API 加解密——程式碼外洩也拿不到金鑰。
- **相對自己管好在哪**：自己管得煩惱怎麼藏、怎麼輪替、怎麼稽核、怎麼細授權；KMS 把這四件事全包了（授權用金鑰政策 + IAM、稽核進 CloudTrail、輪替一鍵開）。
- **跟其他服務整合**：S3、EBS、RDS、DynamoDB、Secrets Manager 全都能直接指定 KMS 金鑰做靜態加密，不用自己寫加密邏輯。

### 對稱 vs 非對稱金鑰怎麼選？

| | 對稱金鑰（Symmetric） | 非對稱金鑰（Asymmetric） |
| --- | --- | --- |
| **怎麼運作** | 同一把金鑰加密也解密 | 一對：公鑰加密／驗簽、私鑰解密／簽章 |
| **金鑰離開 KMS 嗎** | 金鑰永不離開 KMS | **公鑰可下載**（私鑰仍不離開） |
| **主要用途** | 一般加解密、`GenerateDataKey`、SSE | 讓 **KMS 外部**的人用公鑰加密後只有你能解；或**數位簽章**驗證身分 |
| **效能／成本** | 快、便宜，**預設選它** | 較慢；只有真的需要「公私鑰分離」時才用 |

:::tip[💡 一句話決策]
**預設一律用對稱金鑰**（99% 的加解密情境）。只有兩種情況才用非對稱：(1) 加密方在 AWS 外、拿不到 KMS API 授權，給他**公鑰**自己加密；(2) 你要做**數位簽章 / 驗簽**。
:::

### AWS 託管 vs 客戶託管金鑰（CMK）怎麼選？

| | AWS 託管金鑰（AWS managed） | 客戶託管金鑰（Customer managed, CMK） |
| --- | --- | --- |
| **誰建立／管理** | AWS 幫你建（如 `aws/s3`），你管不到政策 | **你自己**建立與管理 |
| **金鑰政策** | 不能改 | **完全自訂**（細到哪個角色能 encrypt、哪個能 decrypt） |
| **輪替** | 自動（每年），不可調 | 可開自動輪替，也可自訂週期 |
| **刪除／停用** | 不能 | 可停用、可排程刪除 |
| **費用** | 金鑰本身免費 | **每把每月約 \$1** + API 呼叫費 |
| **適用** | 只想「有加密就好」、懶得管 | **要稽核、要細授權、要跨帳號共用、要自己掌控生命週期** |

:::tip[💡 考試重點：看到這些字就選 CMK]
題目出現 **「要控管金鑰輪替」「要自訂金鑰政策」「要跨帳號授權」「要能停用／刪除金鑰」「要稽核誰解過密」** → 一律選**客戶託管金鑰（CMK）**。AWS 託管金鑰這些全做不到。
:::

### 優缺點總表

- **優點**：金鑰不外洩、集中授權與稽核、一鍵輪替、與 AWS 服務深度整合、合規（FIPS 140）。
- **缺點**：每次加解密都要呼叫 API（有延遲與 **API 配額**，高流量要注意節流）、CMK 要付月費、金鑰是**區域性**（跨區要另外規劃）。
- **什麼時候反而別用 / 要留意**：
  - 超高頻、對延遲極敏感又資料極小的加解密 → 考慮**信封加密 + 快取資料金鑰**（如 AWS Encryption SDK 的 data key caching），別每筆都打 KMS。
  - 只是要「存一個密碼 / API 金鑰」→ 別自己 KMS 加解密，直接用 **Secrets Manager / Parameter Store**（它們底層就用 KMS，還附輪替）。
  - 跨區複寫大量資料 → 留意金鑰區域性（見下方踩雷）。

## 實務應用：不只是考試

<Scenario title="真實情境：把使用者上傳的大檔做用戶端信封加密再放 S3">

你的 App 讓使用者上傳合約 PDF（常常好幾 MB），法規要求「連我們自己的維運人員都不該能直接看到明文」。做法：上傳前在後端呼叫 `GenerateDataKey` 拿一把資料金鑰，用它在記憶體裡把 PDF 加密，然後把「密文 + 加密版資料金鑰」一起 `PutObject` 到 S3，明文金鑰當場丟棄。要讀檔時，先把加密版資料金鑰丟回 KMS `Decrypt` 換回明文金鑰，再在本地解開。這樣即使有人直接看 S3 物件，也只是一堆亂碼；能不能解密完全由 KMS 的金鑰政策控管。

</Scenario>

### 🛠️ 動手做：用 CLI 跑一次 encrypt / decrypt 與 generate-data-key

```bash
# 0) 先建一把客戶託管金鑰（CMK），拿到 KeyId
aws kms create-key --description "my-app-key"
# 預期結果：回傳 JSON，裡面有 "KeyId": "1234abcd-..." 與 "Arn"

# 建個好記的別名指向它
aws kms create-alias \
  --alias-name alias/my-app-key \
  --target-key-id 1234abcd-...

# 1) 直接加密一小段（≤ 4KB）——明文用 base64 餵給 CLI
aws kms encrypt \
  --key-id alias/my-app-key \
  --plaintext "$(echo -n 'secret-password' | base64)" \
  --query CiphertextBlob --output text > cipher.txt
# 預期結果：cipher.txt 內是一段 base64 密文（看起來一堆亂碼）

# 2) 解密回來
aws kms decrypt \
  --ciphertext-blob fileb://<(base64 -d cipher.txt) \
  --query Plaintext --output text | base64 -d
# 預期結果：印出 secret-password（成功解回明文）
# 注意：decrypt 不用指定 key-id，密文裡已記著用哪把金鑰

# 3) 產生一把資料金鑰（信封加密用）
aws kms generate-data-key \
  --key-id alias/my-app-key \
  --key-spec AES_256
# 預期結果：回傳 JSON，含
#   "Plaintext": "...base64..."       ← 本地加密用、用完即丟
#   "CiphertextBlob": "...base64..."  ← 加密版金鑰，跟密文一起存
#   "KeyId": "arn:aws:kms:..."
```

<Cost>

**KMS 本身便宜，但不是零**：每把**客戶託管金鑰每月約 \$1**（AWS 託管金鑰免費），再加 **API 呼叫費**（每萬次約幾美分）。真正會出意外帳單的是「每筆小資料都打一次 KMS」的高流量場景——這時改用**信封加密 + 資料金鑰快取**，把 KMS 呼叫次數砍下來。練習完記得把測試金鑰**排程刪除**（KMS 金鑰不能立即刪，最少排 7 天等待期），別留著每月扣錢。

</Cost>

:::warning[🚑 常踩雷]
- **直接 `Encrypt` 超過 4KB**：一定失敗（`ValidationException`）。大資料**要用 `GenerateDataKey` 做信封加密**，別硬塞。
- **金鑰是區域性（Region-scoped）**：`us-east-1` 建的金鑰只能在 `us-east-1` 用。別以為全球通用。
- **跨區用到加密資料**：把加密的 S3 物件／EBS 快照複製到別的區域時，**目的區要有自己的金鑰**來重新加密（如 S3 跨區複寫、EBS 快照跨區複製都要指定目的區金鑰）。拿源區金鑰到別區解不開。
- **金鑰政策 + IAM 雙重授權**：能不能用某把 KMS 金鑰，要**金鑰政策**和 **IAM 政策都放行**才行（兩道門）。常見災情是「IAM 給了 `kms:Decrypt`，但金鑰政策沒把這個角色列進去」→ 一樣被拒。反過來也一樣。
- **分清「誰能 encrypt」和「誰能 decrypt」**：加密和解密是**不同權限**（`kms:Encrypt` vs `kms:Decrypt`）。常見需求是「很多服務能加密、只有少數能解密」——務必分開授權，別一次全給。
- **用別人加密的資料卻沒解密權**：你的 Lambda 讀一個 SSE-KMS 加密的 S3 物件卻一直失敗，多半是**執行角色缺 `kms:Decrypt`**，不是 S3 權限問題。
- **把測試金鑰忘了刪**：CMK 每月持續計費；練完記得 `schedule-key-deletion`。
:::

<Refs>

- [AWS KMS 開發人員指南](https://docs.aws.amazon.com/kms/latest/developerguide/overview.html)
- [信封加密（Envelope Encryption）](https://docs.aws.amazon.com/kms/latest/developerguide/concepts.html#enveloping)
- [GenerateDataKey API 參考](https://docs.aws.amazon.com/kms/latest/APIReference/API_GenerateDataKey.html)
- [對稱 vs 非對稱 KMS 金鑰](https://docs.aws.amazon.com/kms/latest/developerguide/symmetric-asymmetric.html)
- [金鑰政策與存取控制](https://docs.aws.amazon.com/kms/latest/developerguide/key-policies.html)
- [S3 伺服器端加密（SSE-KMS）](https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingKMSEncryption.html)

</Refs>

## 下一步

👉 下一篇：[機密管理：Secrets Manager vs Parameter Store](./secrets-parameter.md)
