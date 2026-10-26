---
sidebar_position: 1
title: IAM（開發者視角）
---

# IAM（開發者視角）：讓你的程式「有身分、有權限」，又不用把金鑰到處貼

> 這篇用「開發者視角」帶你搞懂 IAM：你的應用程式是怎麼拿到權限的（EC2 執行個體設定檔、程式裡用 STS `AssumeRole`、預設憑證提供鏈）、身分政策 vs 資源政策差在哪、最小權限怎麼落實、臨時憑證為什麼比長期金鑰安全，以及「為什麼用角色而不是把一組長期金鑰發給程式」。這些正是 DVA-C03 Domain 2（安全，26%）最常考的開發細節——比 SAA 問得更靠近程式碼。

<Vocab title="📌 先認識這篇會出現的名詞（完全沒碰過也能懂）">

- **IAM（Identity and Access Management）**：AWS 的「身分與權限管理」系統，決定**誰（身分）能對哪些資源（S3、DynamoDB…）做哪些動作**。
- **主體（Principal）**：發出請求的那個「身分」——可能是一位 IAM 使用者、一個角色，或某個 AWS 服務。
- **政策（Policy）**：一份 JSON 文件，用 `Effect`（Allow/Deny）、`Action`（`s3:GetObject`…）、`Resource`（哪個 ARN）描述「准不准做某件事」。
- **角色（Role）**：一組「可被臨時扮演」的權限集合，**沒有自己的長期密碼或金鑰**。程式、EC2、Lambda 都是「扮演角色」來取得權限，用完就還。
- **STS（Security Token Service）**：負責發**臨時憑證**的服務。你呼叫 `AssumeRole`，它就發一組會過期的金鑰給你。
- **臨時憑證（Temporary Credentials）**：一組有效期很短（幾分鐘到幾小時）的金鑰，由三個值組成：Access Key ID、Secret Access Key、**Session Token**。過期自動失效。
- **執行個體設定檔（Instance Profile）**：掛在 EC2 執行個體上的「角色容器」，讓執行個體上的程式**自動拿到**那個角色的臨時憑證。

</Vocab>

:::note[💬 閱讀小提示]
文章裡只要看到帶<Term desc="像這樣！滑鼠移到有虛線的名詞上（手機點一下），就會跳出白話解釋。">虛線底線的名詞</Term>，把滑鼠移上去就會跳出白話解釋。所有名詞也都整理在 [名詞與服務對照表](/glossary)。
:::

## 為什麼需要 IAM？先講一個「把金鑰貼進程式」的災難

假設你寫了一支跑在 EC2 上的程式，要把處理好的檔案寫進 <Term en="Simple Storage Service" desc="AWS 的雲端物件儲存，放檔案用。">S3</Term>。程式要呼叫 AWS API，就得「證明自己有權限」。

最直覺（也最危險）的做法：去 IAM 產生一組<Term en="Access Key" desc="一組長期有效的金鑰（Access Key ID + Secret Access Key），代表某個 IAM 使用者的身分，不會自動過期。">存取金鑰（access key）</Term>，把 Access Key ID 和 Secret 直接寫進程式碼。結果：

- 這組金鑰**永不過期**，一旦外洩（push 進 GitHub、打進 log、被同事看到），對方就能永久冒用你。
- 你很難知道「到底誰在用這組金鑰」，也很難乾淨地輪替它。
- 真的洩漏時，網路上的掃描機器人**幾分鐘內**就會拿去開一堆挖礦執行個體，帳單爆炸。

<Term en="Identity and Access Management" desc="AWS 的身分與權限管理系統，用政策決定誰能對哪些資源做哪些動作。">IAM</Term> 的正解是：**不要發長期金鑰給程式**，而是讓程式「扮演一個角色」，由 AWS 自動發一組**會過期的臨時憑證**。程式完全不用接觸、也不用保管任何長期密碼。對開發者來說，重點從「我把金鑰藏哪才安全」變成「我根本不持有長期金鑰」。

## 一句話先懂 IAM 在程式裡怎麼運作

你的程式不帶長期金鑰。它跑在某個「有角色」的環境裡（EC2 掛了執行個體設定檔、或 Lambda 有執行角色），AWS SDK 會透過**憑證提供鏈**自動找到角色、向 **STS** 換一組**臨時憑證**，再用這組憑證簽署每一次 API 請求。憑證快過期時 SDK 自動續約，你的程式碼裡**一行金鑰都看不到**。

<Analogy title="🏢 生活比喻：IAM 角色就像公司的訪客識別證">

- **長期存取金鑰 = 一把自己打的萬能鑰匙**：你配一把實體鑰匙給員工，他弄丟了、被複製了，門永遠開著，你還不知道是誰。
- **IAM 角色 = 櫃台核發的臨時識別證**：員工（程式）不自己帶鑰匙，而是到櫃台（STS）刷臉領一張**當天到期**的識別證。證件過期自動失效，弄丟了明天就沒用，而且每次領證都有記錄。
- **執行個體設定檔 = 這棟樓的員工自動感應**：掛了設定檔的 EC2，裡面的程式一啟動就「自動被認得」拿到當日識別證，連去櫃台排隊都省了。
- **最小權限 = 識別證只能開你該進的房間**：財務的證不該能開機房。權限就給剛好夠用的。

</Analogy>

## 開發細節一：你的應用程式到底怎麼拿到權限？

這是 DVA 最核心、也最容易一知半解的部分。重點：**程式幾乎從不該自己持有長期金鑰**，而是靠底下這條鏈自動取得臨時憑證。

### 預設憑證提供鏈（Credential Provider Chain）

你用 AWS SDK（`boto3`、JS SDK、Java SDK…）建立 client 時，**不指定金鑰**。SDK 會按固定順序去找憑證，找到就用、找不到才往下一個：

<div className="flow">
  <div className="flow-node">1. 程式碼明寫的金鑰（不建議）</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">2. 環境變數 AWS_ACCESS_KEY_ID…</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">3. ~/.aws/credentials 設定檔（本機開發用）</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">4. EC2/ECS/Lambda 的角色（執行個體設定檔）</div>
</div>

- **本機開發時**：通常走 `~/.aws/credentials`（由 `aws configure` 或 SSO 產生），或短期用環境變數。
- **正式上雲後**：走最後一關——由環境（EC2 執行個體設定檔、ECS 任務角色、Lambda 執行角色）提供的**臨時憑證**。這才是你該追求的狀態：程式碼與機器上**都沒有**長期金鑰。

### EC2：執行個體設定檔（Instance Profile）

當 EC2 要讓上面的程式有權限時，不是把金鑰塞進機器，而是：建立一個 IAM **角色** → 把角色包進一個**執行個體設定檔** → 把設定檔附加到 EC2。之後執行個體上的 SDK 會自動從<Term en="Instance Metadata Service" desc="EC2 執行個體內部一個只有自己連得到的位址，程式可從這裡自動取得角色的臨時憑證。">執行個體中繼資料服務（IMDS）</Term>拿到角色的臨時憑證，你完全不用管。

```python
# EC2 上的 Python：建立 client 時「完全不傳金鑰」
# boto3 會自動從執行個體設定檔（IMDS）拿臨時憑證
import boto3

s3 = boto3.client("s3")          # ← 沒有 access key、沒有 secret
s3.put_object(Bucket="my-bucket", Key="out/result.json", Body=b"...")
# 能成功，是因為這台 EC2 附加的角色政策允許 s3:PutObject 到這個貯體
```

### 程式裡主動 `AssumeRole`（跨帳號／切換權限）

有時你要**主動切換到另一個角色**——例如跨 AWS 帳號存取、或臨時取得較高權限。這時直接呼叫 STS 的 `AssumeRole`，拿回一組臨時憑證，再用它建立目標 client：

```python
import boto3

sts = boto3.client("sts")
resp = sts.assume_role(
    RoleArn="arn:aws:iam::222233334444:role/CrossAccountS3Reader",
    RoleSessionName="my-app-session",   # 方便在 CloudTrail 追是誰扮演的
)
creds = resp["Credentials"]  # 內含 AccessKeyId / SecretAccessKey / SessionToken

# 用臨時憑證建立「目標帳號」的 S3 client
s3 = boto3.client(
    "s3",
    aws_access_key_id=creds["AccessKeyId"],
    aws_secret_access_key=creds["SecretAccessKey"],
    aws_session_token=creds["SessionToken"],   # ← 臨時憑證「一定」要帶 SessionToken
)
```

:::info[🔑 臨時憑證和長期金鑰差在哪？看有沒有 SessionToken]
長期 access key 只有兩個值（ID + Secret）。**臨時憑證多一個 `SessionToken`**，而且有到期時間。程式碼裡看到有人在傳 `aws_session_token`，幾乎就代表「這是 STS 發的臨時憑證、走角色」——這是好的做法。
:::

## 開發細節二：身分政策 vs 資源政策

同樣是 JSON 政策，掛的位置不同、回答的問題也不同，DVA 很愛考你分不分得清：

| | **身分政策（Identity-based）** | **資源政策（Resource-based）** |
| --- | --- | --- |
| **掛在哪** | 掛在**身分**上（IAM 使用者 / 群組 / 角色） | 掛在**資源**上（S3 貯體、SQS 佇列、Lambda 函式…） |
| **回答的問題** | 「**這個身分**可以對哪些資源做什麼？」 | 「**哪些主體**可以對**我這個資源**做什麼？」 | 
| **有 `Principal` 欄位嗎** | 沒有（主體就是被掛的那個身分） | **有**，要明寫允許哪個主體 |
| **典型用途** | 給角色綁上「能讀 S3、寫 DynamoDB」 | S3 貯體政策、允許跨帳號存取、允許某服務呼叫 Lambda |

<Analogy title="🏢 生活比喻：員工識別證 vs 房間門口的名單">

- **身分政策 = 員工識別證上寫的權限**：這張證（角色）本身被授權能進哪些房間。
- **資源政策 = 貼在某個房間門口的訪客名單**：這個房間（S3 貯體）自己規定「哪些人獲准進來」。
- 兩邊其實是**同一個授權的兩種寫法**。跨帳號存取時常常**兩邊都要設**：來源帳號的角色要有身分政策（我能去），目標資源也要有資源政策（我允許你來）。

</Analogy>

:::info[🔑 一句話判斷：有沒有 Principal]
看到政策裡有 `"Principal": {...}` → **資源政策**（掛在資源上、指定誰能來）。沒有 `Principal`、直接列 `Action`/`Resource` → **身分政策**（掛在身分上）。信任政策（下面會講）是一種特殊的資源政策，掛在「角色」這個資源上。
:::

## 開發細節三：最小權限（Least Privilege）

最小權限＝**只給剛好夠用的權限，不多給**。這是 IAM 的核心原則，也是 DVA 情境題的預設「正確答案方向」。

```json
// ✅ 好：只准讀「某一個貯體的某個前綴」
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:GetObject"],
    "Resource": "arn:aws:s3:::my-bucket/reports/*"
  }]
}
```

```json
// ❌ 壞：萬用權限，等於「什麼都能做」——幾乎永遠是錯答案
{
  "Effect": "Allow",
  "Action": "*",
  "Resource": "*"
}
```

:::tip[💡 考試重點：最小權限的關鍵字]
- 題目講「開發初期先放寬、上線再收緊」或「只給必要權限」→ 答案方向都是**最小權限**：先給窄的，用 **IAM Access Analyzer** 根據實際用量產生更精準的政策、或看 CloudTrail 補權限。
- **明確 Deny 一定贏過 Allow**。多份政策的結果是：只要有一個 `Deny` 命中，就直接拒絕。
- 看到 `Action: "*"` 或 `Resource: "*"` 的選項，先高度懷疑它是陷阱。
:::

## 開發細節四：臨時憑證與角色鏈（為什麼短命反而更安全）

臨時憑證有到期時間（`AssumeRole` 預設 1 小時，可調 15 分鐘～12 小時）。短命的好處是：**就算洩漏，攻擊者能用的時間也很短**，而且 SDK 會在背景自動續約，你的程式不會因為憑證過期而中斷。

這套機制讓 EC2、Lambda、ECS 上的程式**全程只碰臨時憑證**。長期金鑰最好只留給「真的沒辦法走角色」的少數情境（例如某些機房外的老系統）。

## 🧭 固定段落：為什麼用角色，而不是把長期金鑰發給程式？

這是本篇的核心決策，務必能用白話講清楚：

**為什麼是角色（它解決什麼）**
- 程式**完全不持有長期金鑰**，沒有「金鑰藏哪才安全」的難題——因為根本沒有長期金鑰可洩漏。
- 憑證**短命 + 自動輪替**：過期自動換新，不用你寫輪替邏輯，洩漏的傷害被時間封頂。
- **誰扮演了角色、做了什麼**都進 CloudTrail（配合 `RoleSessionName`），稽核清楚。
- **跨帳號、跨服務**都用同一套 `AssumeRole` 模型，乾淨一致。

**優點**
- 安全性大幅提升（無長期機密、自動過期、可稽核）。
- 維運更省（不用手動發、藏、輪替金鑰）。
- 權限可集中在角色上管理，隨時收緊或撤銷。

**缺點 / 代價**
- 概念比「貼一組金鑰」複雜：要懂角色、信任政策、`AssumeRole`、SessionToken。
- 信任政策方向容易設錯（誰能扮演誰），新手常卡在這。
- 臨時憑證會過期，長流程若沒用 SDK 自動續約、自己手動管理，可能中途失效。

**什麼時候反而別用（或要特別小心）**
- **跑在 AWS 外、又完全無法連到 AWS 身分來源的系統**：沒有執行個體設定檔可用時，可能只能退而用長期金鑰——這時務必最小權限 + 定期輪替，或改用 **IAM Roles Anywhere** 讓地端也能走角色。
- **本機個人開發**：短期用 `aws configure` 的設定檔或 SSO 即可，不必為了純本機測試硬搭一套 AssumeRole。
- 絕不要為了「方便」把長期金鑰寫進程式碼或環境變數塞進映像檔——這是最常見、也最嚴重的反模式。

## 實務應用：不只是考試

<Scenario title="真實情境：讓 EC2 上的程式讀寫 S3，一把長期金鑰都不發">

你有一支資料處理程式要跑在 EC2 上、把結果寫進 S3。正確做法完全不碰 access key：建一個 IAM 角色、給它「只能寫這個貯體」的身分政策、包成執行個體設定檔附到 EC2。程式用 `boto3.client("s3")` 不帶任何金鑰就能寫入。日後要加權限就改角色政策，要撤權就改或移除角色——機器本身永遠乾淨，金鑰外洩風險直接歸零。

</Scenario>

### 🛠️ 動手做：建立角色 → 附到 EC2（執行個體設定檔）→ 驗證

```bash
# 1) 建立角色，信任政策允許「EC2 服務」來扮演它
#    （信任政策 = 掛在角色上的資源政策，Principal 寫 ec2）
cat > trust.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "ec2.amazonaws.com" },
    "Action": "sts:AssumeRole"
  }]
}
EOF
aws iam create-role --role-name AppS3WriterRole \
  --assume-role-policy-document file://trust.json

# 2) 給角色「只能寫某貯體」的身分政策（最小權限）
cat > perms.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:PutObject"],
    "Resource": "arn:aws:s3:::my-app-bucket/*"
  }]
}
EOF
aws iam put-role-policy --role-name AppS3WriterRole \
  --policy-name WriteMyBucket --policy-document file://perms.json

# 3) 建立執行個體設定檔，把角色放進去
aws iam create-instance-profile --instance-profile-name AppS3WriterProfile
aws iam add-role-to-instance-profile \
  --instance-profile-name AppS3WriterProfile \
  --role-name AppS3WriterRole

# 4) 把設定檔附加到一台現有的 EC2 執行個體
aws ec2 associate-iam-instance-profile \
  --instance-id i-0123456789abcdef0 \
  --iam-instance-profile Name=AppS3WriterProfile
```

**預期結果**：SSH 進那台 EC2 後，執行 `aws sts get-caller-identity` 應回傳一個 **`assumed-role/AppS3WriterRole/...`** 開頭的 ARN（代表你現在的身分是「扮演的角色」，不是某個使用者）。接著 `aws s3 cp test.txt s3://my-app-bucket/test.txt` 應該**成功上傳**；但 `aws s3 ls`（列出所有貯體）會因為政策沒給 `s3:ListAllMyBuckets` 而**被拒**（`AccessDenied`）——這正是最小權限在發揮作用。

**（替代做法）程式裡直接 `AssumeRole` 驗證**：

```bash
# 取得臨時憑證（回傳含 SessionToken）
aws sts assume-role \
  --role-arn arn:aws:iam::111122223333:role/AppS3WriterRole \
  --role-session-name demo
```

**預期結果**：輸出一包 JSON，內含 `AccessKeyId`、`SecretAccessKey`、`SessionToken` 與 `Expiration`（到期時間）。看到 `SessionToken` 和 `Expiration`，就確認你拿到的是**臨時憑證**。

<Cost>

IAM 本身**完全免費**（角色、政策、使用者、STS `AssumeRole` 都不收錢）。花錢的是你用這些權限去動的資源（S3、EC2…）。練習時真正要留意的不是帳單，而是**安全**：測試用的角色、貯體、EC2 用完記得清掉，別把任何 access key 留在程式碼、設定檔或截圖裡。萬一不小心把長期金鑰外洩，**立刻到 IAM 停用／刪除那組金鑰**並檢查 CloudTrail 有無異常使用。

</Cost>

:::warning[🚑 常踩雷]
- **政策用萬用 `*`**：`Action: "*"` 或 `Resource: "*"` 等於全開，是最常見的過度授權。給剛好夠用的最小權限。
- **把 access key 寫死在程式碼、或塞進環境變數／映像檔**：最嚴重的反模式。改用角色（執行個體設定檔／執行角色），程式完全不帶金鑰。
- **信任政策方向設錯**：信任政策回答「**誰能扮演這個角色**」（Principal 寫扮演者，如 `ec2.amazonaws.com`）；別和「這個角色能做什麼」（身分政策）搞混。方向反了會一直 `AccessDenied` 或 `is not authorized to perform: sts:AssumeRole`。
- **忘了把角色附加到執行個體**：角色建好、政策也對，但沒把**執行個體設定檔**附到 EC2，程式還是拿不到憑證（SDK 找不到憑證而報錯）。
- **以為臨時憑證不用帶 SessionToken**：用 `AssumeRole` 回來的臨時憑證，三個值（ID／Secret／**SessionToken**）缺一不可，少帶 token 會 `InvalidClientTokenId`。
:::

<Refs>

- [IAM 使用者指南](https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html)
- [IAM 角色與 EC2 執行個體設定檔](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use_switch-role-ec2.html)
- [AWS STS 臨時安全憑證](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp.html)
- [IAM 安全最佳實務（最小權限等）](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)

</Refs>

## 下一步

👉 下一篇：[Cognito 使用者驗證與授權](./cognito.md)
