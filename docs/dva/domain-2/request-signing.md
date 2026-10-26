---
sidebar_position: 5
title: 簽署請求與臨時憑證
---

# 簽署請求與臨時憑證：SigV4、預簽章 URL、STS

> 這篇從「開發者視角」帶你搞懂：你的程式怎麼向 AWS 證明「這個請求真的是我發的、而且中途沒被人改過」。涵蓋 **SigV4 簽章**（SDK 幫你自動簽、何時才需要手動簽）、**預簽章 URL（presigned URL）**（讓沒有 AWS 憑證的人暫時存取 S3）、以及 **STS 臨時憑證**（`AssumeRole` / `GetSessionToken`）。這些是 DVA-C03 Domain 2（安全，26%）很愛考的細節，也是實務上最常把長期金鑰外流的雷區。

<Vocab title="📌 先認識這篇會出現的名詞（完全沒碰過也能懂）">

- **憑證（Credentials）**：你向 AWS 證明身分的那組鑰匙。長期憑證是一對 **Access Key ID + Secret Access Key**；臨時憑證則多一個 **Session Token**，而且會過期。
- **簽章（Signature）**：用你的祕密金鑰對「整個請求」算出來的一段加密指紋。AWS 收到請求後用同樣方法重算一次，對得上才接受。
- **SigV4（Signature Version 4）**：AWS 目前的請求簽章演算法。幾乎每一個打到 AWS API 的請求都要帶 SigV4 簽章。
- **預簽章 URL（Presigned URL）**：一條「已經先簽好名、內嵌授權」的網址，任何人拿到它、在**有效期內**就能直接對 S3 做上傳或下載，**不需要自己的 AWS 憑證**。
- **STS（Security Token Service）**：AWS 發放**臨時憑證**的服務。你跟它換一組「會過期、權限受限」的鑰匙來用。
- **AssumeRole（擔任角色）**：跟 STS 說「我要暫時扮演某個 IAM 角色」，換回一組帶 Session Token 的臨時憑證。

</Vocab>

:::note[💬 閱讀小提示]
文章裡只要看到帶<Term desc="像這樣！滑鼠移到有虛線的名詞上（手機點一下），就會跳出白話解釋。">虛線底線的名詞</Term>，把滑鼠移上去就會跳出白話解釋。所有名詞也都整理在 [名詞與服務對照表](/glossary)。
:::

## 為什麼需要？AWS 怎麼確認請求是你發的、沒被竄改

你的程式呼叫 AWS，本質上就是對 AWS 的 API 端點送一個 **HTTP 請求**。網路是公開的，任何中間人都可能偷看或偷改這個請求。AWS 怎麼知道：

1. **這個請求真的是「持有金鑰的你」發的**（身分驗證 / Authentication）？
2. **請求從你送出到 AWS 收到之間，沒有被偷改內容**（完整性 / Integrity）？

天真的做法是「把 Secret Access Key 直接放進請求送出去」——但這樣金鑰等於在網路上裸奔，一被攔截就完蛋。所以 AWS 改用<Term en="Signature Version 4" desc="AWS 目前的請求簽章演算法，用祕密金鑰對整個請求算出一段指紋，驗證身分與完整性，但金鑰本身不會被送出。">SigV4 簽章</Term>：

- 你用 **Secret Access Key** 對「這個請求的關鍵內容」（方法、路徑、查詢參數、關鍵標頭、內容雜湊、時間戳）算出一段**簽章**。
- 送出去的是 **Access Key ID（公開的，像帳號）＋ 這段簽章**，但**祕密金鑰本身永遠不離開你的機器**。
- AWS 那邊存有你的祕密金鑰，用一模一樣的步驟重算簽章。**對得上**→ 確定是你、而且內容沒被改；**對不上**→ 拒絕（常見錯誤 `SignatureDoesNotMatch`）。

<Analogy title="🏢 生活比喻：SigV4 像文件上的防偽蠟封">

- **祕密金鑰 = 你專屬的印章**：絕不外借、不離身。
- **簽章 = 蓋在整份文件上的蠟封**：封印是依「整份文件的內容」壓出來的。
- **有人偷改文件任何一個字** → 蠟封對不起來 → 立刻被識破（這就是「防竄改」）。
- **你送出的是文件 + 蠟封，不是印章本身** → 就算被攔截，對方也仿不出下一份文件的封印。

</Analogy>

## SigV4 簽章：SDK 幫你自動簽，何時才需要手動簽

好消息是：**日常開發你幾乎不用自己動手簽**。

當你用 **AWS SDK（Boto3、JavaScript v3 SDK…）或 AWS CLI** 呼叫 AWS 時，SDK 會在背後自動：讀取你的憑證 → 依 SigV4 算簽章 → 把 `Authorization` 標頭與 `X-Amz-Date`、`X-Amz-Security-Token`（臨時憑證才有）塞進請求。你只管呼叫方法，簽章完全是黑箱。

```python
import boto3

# 你完全沒寫任何簽章程式碼。
# boto3 會自動讀憑證、用 SigV4 幫這個請求簽好名再送出。
s3 = boto3.client("s3")
s3.put_object(Bucket="my-bucket", Key="hello.txt", Body=b"hi")
```

**那什麼時候才需要「手動簽」？** 只有在你**繞過 SDK、自己直接發 HTTP 請求**打 AWS 服務時，例如：

- 用 `requests` / `fetch` 直接呼叫某個**沒有對應 SDK 方法**的端點（如 Amazon OpenSearch 的 REST API）。
- 要對 **API Gateway 用 IAM 授權**的端點發請求，而你不是透過產生好的 SDK。
- 自己實作一個輕量客戶端、不想帶整包 SDK。

這時可用 SDK 提供的簽章輔助工具（如 botocore 的 `SigV4Auth`、JS 的 `@aws-sdk/signature-v4`）來簽，而**不要自己手刻演算法**——SigV4 的正規化（canonicalization）步驟很容易寫錯。

:::info[🔑 一個最常混的觀念：簽章 vs 加密]
SigV4 簽章**不是加密**。它不把請求內容藏起來（傳輸的保密是靠 **HTTPS/TLS**），它只做兩件事：**證明是你發的**＋**保證沒被竄改**。別把「簽章」和「加密」混為一談。
:::

## 預簽章 URL（Presigned URL）：讓沒有憑證的人暫時存取 S3

常見需求：你想讓**前端網頁的使用者**或**某個外部合作夥伴**直接上傳／下載一個 S3 物件，但你**不可能**把 AWS 金鑰發給他們。

<Term en="Presigned URL" desc="由持有憑證者預先簽好的一條網址，內嵌授權與有效期，任何人拿到就能在期限內直接存取該 S3 物件，不需自己的 AWS 憑證。">預簽章 URL</Term> 正是為此而生：**由你的後端（持有憑證）預先簽好一條網址**，把這條網址交給使用者。使用者拿著它，就能在**有效期內**直接對 S3 做**那一個特定動作**（下載或上傳**那一個物件**），全程**不需要任何 AWS 憑證**。

<div className="flow">
  <div className="flow-node">使用者向你的後端要上傳位置</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">後端用自己的憑證產生 presigned URL</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">把 URL 回給使用者</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">使用者的瀏覽器直接 PUT/GET 到 S3</div>
</div>

重點在於：**URL 攜帶的權限，等於「產生這條 URL 的那個身分」當下的權限**。使用者本身沒有身分，他只是「借用」你簽好的那一次授權。而且 URL 內嵌一個**到期時間**（`X-Amz-Expires`），過期就作廢。

<Analogy title="🏢 生活比喻：預簽章 URL 像一張限時、限門的臨時門卡">

- **你（後端）= 大樓管理員**：手上有萬能鑰匙（AWS 憑證）。
- **presigned URL = 一張臨時門卡**：只開「3 號倉庫的那一扇門」（某個 bucket/key），而且**兩小時後自動失效**。
- **訪客（使用者）** 拿卡刷門即可進去拿／放東西，**全程不需要自己的鑰匙**。
- 但注意：卡**發出去就收不回**，誰撿到都能用到過期為止——這是最常被忽略的風險。

</Analogy>

## STS 臨時憑證在程式裡：AssumeRole / GetSessionToken

當你的程式需要**一組會過期、權限受限的鑰匙**（而不是長期金鑰）時，就跟 <Term en="Security Token Service" desc="AWS 發放臨時憑證的服務，回傳的憑證包含 Access Key、Secret Key、Session Token 與到期時間。">STS</Term> 換。STS 回傳的臨時憑證有**四個東西**：Access Key ID、Secret Access Key、**Session Token**、以及**到期時間（Expiration）**。用這組憑證時，SDK 會自動多帶 `X-Amz-Security-Token`。

兩個最常考的 API：

| API | 做什麼 | 典型情境 |
| --- | --- | --- |
| **`AssumeRole`** | 暫時「擔任」另一個 IAM 角色，拿到那個角色的臨時憑證。 | 跨帳號存取、EC2/Lambda 以角色身分運作、要「切換成另一組權限」做某件事 |
| **`GetSessionToken`** | 用**既有的**長期憑證換一組臨時憑證（常搭配 MFA）。 | 要求「敏感操作需 MFA 驗證」時，先換一組「已通過 MFA」的臨時憑證再去操作 |
| **`AssumeRoleWithWebIdentity`** | 用外部身分供應商（Google/Facebook/OIDC、或 Cognito）登入後的 token 換臨時憑證。 | 行動 App／網頁的終端使用者，不配發 AWS 金鑰 |

```python
import boto3

sts = boto3.client("sts")

# 擔任一個角色，換回「會過期」的臨時憑證
resp = sts.assume_role(
    RoleArn="arn:aws:iam::111122223333:role/read-only-role",
    RoleSessionName="my-session",
    DurationSeconds=3600,  # 1 小時後過期
)
creds = resp["Credentials"]

# 用這組臨時憑證（含 SessionToken）建立另一個 client
s3 = boto3.client(
    "s3",
    aws_access_key_id=creds["AccessKeyId"],
    aws_secret_access_key=creds["SecretAccessKey"],
    aws_session_token=creds["SessionToken"],  # 臨時憑證才有這一欄
)
print(s3.list_buckets()["Buckets"])
```

:::tip[💡 考試重點：你其實常常「已經在用」臨時憑證]
當程式跑在 **EC2（掛了 IAM 角色）** 或 **Lambda（執行角色）** 上時，SDK 會**自動**透過背後機制拿到該角色的**臨時憑證**並定時刷新——你根本不用寫 `AssumeRole`。考題若說「程式在 EC2/Lambda 上、要存取 S3」，標準答案是**掛 IAM 角色**，而不是把金鑰寫進程式或環境變數。
:::

## 為什麼用臨時憑證／預簽章 URL 而不是發長期金鑰？優點／缺點／何時別用

這是本篇最核心的取捨。使用者「知道這些名詞，但不懂為什麼選它」——以下白話交代。

**為什麼是它（解決什麼問題）**
長期 Access Key 一旦外流（commit 進 Git、寫死在前端、被截圖），攻擊者可以**無限期**拿它為所欲為，而你往往**很久才發現**。臨時憑證與預簽章 URL 的共同精神是：**把「誰能做、能做什麼、能做多久」縮到最小**——就算外流，傷害也有天花板（會過期、權限受限、只對單一物件）。

**優點**

- **會自動過期**：臨時憑證幾分鐘到幾小時就失效；presigned URL 到期即作廢。外流的損害被時間鎖住。
- **最小權限**：`AssumeRole` 可只給必要權限；presigned URL 只授權「某物件的某個動作」。
- **不用散播長期金鑰**：前端／合作夥伴／終端使用者**完全不持有**你的長期金鑰。
- **可稽核**：`AssumeRole` 誰在何時擔任了什麼角色，CloudTrail 查得到。

**缺點 / 代價**

- **要處理「過期」**：臨時憑證過期後程式要能**刷新**（重新 `AssumeRole`）；長時間作業若不刷新會中途失敗。
- **多一層呼叫與設定**：要設好角色信任政策（trust policy）、`sts:AssumeRole` 權限，比直接一把金鑰複雜。
- **presigned URL 無法撤銷**：發出去就收不回，只能等它到期（見常踩雷）。

**什麼時候反而別用它 / 限制**

- **真正需要「永久、無人值守」又無法掛角色的環境**：少數地端系統可能仍需長期金鑰——但這種情況應優先改用 **IAM Roles Anywhere** 或至少嚴格輪替金鑰，而非直接長期發放。
- **presigned URL 不適合「要能隨時收回權限」的場景**：因為它無法撤銷。需要可即時撤權時，改用**短效 presigned URL** 或讓使用者走你的後端 API 代理。
- **別為了「省一次呼叫」就退回長期金鑰**：長期金鑰的風險遠大於多一次 `AssumeRole` 的成本。

## 實務應用：不只是考試

<Scenario title="真實情境：前端要讓使用者上傳大頭照到 S3，但不能給金鑰">

你的網站讓使用者上傳大頭照。檔案可能很大，不想經過你的伺服器中轉（省頻寬、省機器）。做法：前端呼叫你的後端 API 說「我要上傳」，後端用**自己的 IAM 角色憑證**產生一條**只能 `PUT` 到 `avatars/使用者ID.jpg`、15 分鐘到期**的 presigned URL 回給前端。前端拿到後**直接 PUT 檔案到 S3**，完全不碰你的伺服器、也不持有任何 AWS 金鑰。15 分鐘後這條 URL 自動失效。

</Scenario>

### 🛠️ 動手做：產生一條下載用的 presigned URL（Python / CLI）

```python
# generate_url.py
import boto3

s3 = boto3.client("s3")

url = s3.generate_presigned_url(
    ClientMethod="get_object",
    Params={"Bucket": "my-demo-bucket", "Key": "report.pdf"},
    ExpiresIn=300,  # 5 分鐘後過期
)
print(url)
```

**預期結果**：終端機印出一條很長的網址，長得像
`https://my-demo-bucket.s3.amazonaws.com/report.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...&X-Amz-Date=...&X-Amz-Expires=300&X-Amz-SignedHeaders=host&X-Amz-Signature=...`
把它貼到瀏覽器（或 `curl`），**5 分鐘內**可直接下載 `report.pdf`；**超過 5 分鐘**再開，會收到 S3 回 `AccessDenied` 且訊息含 `Request has expired`。

用 CLI 也可以（預設 1 小時到期）：

```bash
# 產生一條下載用 presigned URL，3600 秒到期
aws s3 presign s3://my-demo-bucket/report.pdf --expires-in 3600
```

**預期結果**：同樣印出一條帶 `X-Amz-Signature` 的長網址，可直接 `curl` 下載。

### 🛠️ 動手做：擔任角色拿臨時憑證（CLI）

```bash
# 擔任角色，換回臨時憑證（含 SessionToken 與 Expiration）
aws sts assume-role \
  --role-arn arn:aws:iam::111122223333:role/read-only-role \
  --role-session-name demo-session \
  --duration-seconds 900
```

**預期結果**：回傳一包 JSON，`Credentials` 底下有 `AccessKeyId`、`SecretAccessKey`、`SessionToken`、`Expiration`（15 分鐘後的時間戳）。把這三個 key 設成環境變數（`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_SESSION_TOKEN`）後，接下來的 CLI 就是以那個角色的權限在跑；過了 `Expiration` 再呼叫會收到 `ExpiredToken` 錯誤。

```bash
# 隨時用這招確認「我現在是誰」——臨時憑證會顯示 assumed-role 的身分
aws sts get-caller-identity
```

**預期結果**：印出 `Account`、`Arn`（會是 `.../assumed-role/read-only-role/demo-session`）、`UserId`，用來確認你已經成功切換成那個角色。

<Cost>

**SigV4 簽章、STS、產生 presigned URL 本身都不收費**——簽章是在你機器上算的、`AssumeRole`／`generate_presigned_url` 也不計費。真正會產生費用的是**實際用這些憑證／URL 去做的事**：例如透過 presigned URL 下載檔案會算 **S3 的請求數與資料傳出（egress）** 費用。所以成本重點不在「簽章」，而在「別讓一條外流的 presigned URL 被人狂拉檔案」造成流量帳單。練習完記得清掉測試 bucket 與物件。

</Cost>

:::warning[🚑 常踩雷]
- **presigned URL 的有效期與權限＝「簽署者」的權限**：URL 能做什麼，取決於**產生它的那個身分**當下的權限，不是拿 URL 的人。若簽署者權限太大，等於把過大的權力外借。
- **presigned URL 無法撤銷**：發出去就收不回，只能等它到期。所以**有效期要設短**（幾分鐘），別一設就 7 天。需要可撤權就別用它。
- **用臨時憑證簽的 presigned URL，壽命被憑證綁住**：若用 `AssumeRole` 的臨時憑證去簽，URL 實際最長只能活到**那組臨時憑證過期**為止，就算你把 `ExpiresIn` 設更久也沒用。
- **時鐘誤差導致簽章失敗**：SigV4 把時間戳算進簽章，機器時鐘和 AWS 差太多（預設容許約 ±15 分鐘）會出現 `SignatureDoesNotMatch` 或 `RequestTimeTooSkewed`。對策：開啟 NTP 校時。
- **把長期金鑰外流**：Access Key 寫死在前端 JS、commit 進 Git、貼到截圖——這是最嚴重的雷。正解是**掛 IAM 角色用臨時憑證**或**發 presigned URL**，前端永遠不該持有長期金鑰。
- **臨時憑證過期沒刷新**：長時間執行的程式拿了一次 `AssumeRole` 就一直用，過了 `Expiration` 後所有呼叫報 `ExpiredToken`。對策：靠 SDK 的自動刷新（掛角色時）或自行在過期前重新 `AssumeRole`。
:::

<Refs>

- [AWS 簽章版本 4（SigV4）簽署 API 請求](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_sigv.html)
- [使用預簽章 URL（Amazon S3）](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html)
- [AWS STS 臨時安全憑證](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp.html)
- [STS AssumeRole API 參考](https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html)
- [IAM 安全最佳實務（不要用長期金鑰）](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)

</Refs>

## 下一步

👉 來複習：[Domain 2 核心名詞閃卡](./flashcards.md)
