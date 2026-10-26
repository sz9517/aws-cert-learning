---
sidebar_position: 1
title: IAM 身分與存取管理
---

# IAM：AWS 的「門禁與鑰匙」系統

> 本篇用最白話的方式帶你理解 IAM，這是 SAA 考試出現頻率最高的主題之一。

<Vocab title="📌 先認識這篇會出現的名詞（完全沒碰過也能懂）">

- **EC2（Elastic Compute Cloud）**：AWS 上「**租來的一台電腦／伺服器**」。你的網站、程式就跑在它上面。
- **S3（Simple Storage Service）**：AWS 的「**雲端硬碟／檔案倉庫**」，拿來放圖片、影片、備份、報表等檔案。
- **憑證／金鑰（Credentials / Access Key）**：證明「你是誰、有沒有權限」的**通行密碼**，外洩了別人就能冒用你的帳號。

</Vocab>

:::note[💬 閱讀小提示]
文章裡只要看到帶<Term desc="像這樣！滑鼠移到有虛線的名詞上（手機點一下），就會跳出白話解釋。">虛線底線的名詞</Term>，把滑鼠移上去就會跳出白話解釋。所有名詞也都整理在 [名詞與服務對照表](/glossary)。
:::

## 一句話先懂 IAM

**IAM（Identity and Access Management）** 決定了「**誰**（哪個使用者／服務）可以對「**哪些資源**」做「**哪些操作**」。它是 AWS 所有安全的根基，而且**完全免費**。

<Analogy title="🏢 生活比喻：把 AWS 帳號想成一棟公司大樓">

- **Root 使用者** = 建這棟樓的大老闆，擁有萬能鑰匙（平常絕對不要用它辦公！）
- **IAM User** = 公司每位員工，各自有員工證
- **IAM Group** = 部門（例如「工程部」），整個部門給同一套權限
- **IAM Policy** = 門禁卡的權限設定（能進哪幾間房、能不能開保險箱）
- **IAM Role** = 臨時訪客通行證，用完自動失效，給「服務或臨時需求」用

</Analogy>

## 四個核心元件

| 元件 | 是什麼 | 什麼時候用 |
| --- | --- | --- |
| **User** | 代表一個人或應用程式的長期身分 | 固定的使用者，例如你自己 |
| **Group** | 一群 User 的集合，方便統一給權限 | 同職務的多位成員 |
| **Policy** | 用 JSON 寫的權限規則（允許／拒絕） | 定義「能做什麼」 |
| **Role** | 可被「扮演」的臨時權限身分 | 給 EC2、Lambda 或跨帳號存取 |

:::tip[💡 考試重點]
當題目出現「<Term en="Elastic Compute Cloud" desc="AWS 上租來的一台雲端伺服器，程式跑在上面。">EC2</Term> 需要存取 <Term en="Simple Storage Service" desc="AWS 的雲端檔案倉庫，用來放圖片、備份、報表等檔案。">S3</Term>」時，正解幾乎都是「**建立 IAM Role 指派給 EC2**」，**而不是**把金鑰（Access Key）寫死在程式裡。這是最常考的陷阱！
:::

## 為什麼用 Role，而不是把長期金鑰發出去？

這是 IAM 最核心、也最常考的「為什麼」。先講清楚兩種東西的差別：

- **長期存取金鑰（Access Key）**：一組 `AKIA...` 開頭的帳號＋密碼，**建了就永遠有效**，直到你手動刪掉。常被貼進程式碼、設定檔、環境變數。
- **Role（角色）＋臨時憑證**：不發固定金鑰，而是讓服務（EC2、Lambda…）去「**扮演（assume）**」一個角色，AWS 當場發一組**幾小時後自動過期**的臨時憑證，過期自動換新，全程沒有人碰到金鑰。

<Analogy title="🏢 生活比喻：萬年鑰匙 vs 每天換的臨時門卡">

長期金鑰像一把**打了永遠不收回的萬年鑰匙**——員工離職、鑰匙掉了、被拍照外流，你完全不知道，而且它一直能開門。Role 的臨時憑證像**每天早上重發、晚上就失效的門卡**：就算被撿到，隔幾小時也自動作廢；人走了，門卡自然不再發。

</Analogy>

**為什麼要這樣做（好處）：**

- **沒有長期祕密可外洩**：臨時憑證幾小時就過期，就算被 log 出來、被 commit 進 GitHub，攻擊者能用的時間也很短。長期金鑰外洩則是「門一直開著」。
- **不用自己輪替（rotate）金鑰**：AWS 在背後自動換發，你完全不用寫「定期換金鑰」的流程。
- **不用把祕密放進程式**：程式裡一行金鑰都不用寫，SDK 會自動從 Role 取憑證（EC2 從執行個體中繼資料、Lambda 從執行角色）。
- **跨帳號／跨服務乾淨**：A 帳號的角色可以被 B 帳號扮演，靠**信任政策**控制，比互發金鑰安全太多。

**缺點／成本（誠實說）：**

- **多一層心智模型**：要懂「誰能扮演這個角色（信任政策）」和「這角色能做什麼（權限政策）」兩件事，新手容易搞混方向。
- **本機開發稍麻煩**：筆電上沒有 EC2 角色可用，得靠 `aws sso login` 或具名設定檔（profile）取得臨時憑證，比直接貼一組金鑰多一步。

:::info[🔑 什麼時候「才」該用長期存取金鑰？]
原則是**能用 Role 就別用金鑰**。真的需要長期金鑰的情境很少：例如**無法扮演角色的機外系統**（地端伺服器、第三方 CI 工具尚未支援 OIDC 聯合）。即使如此，現在也優先改用 **IAM Roles Anywhere**（地端）或 **OIDC 聯合**（GitHub Actions 等），盡量不發 `AKIA` 長期金鑰。給人類使用者日常操作則用 **IAM Identity Center（SSO）**，同樣是臨時憑證。
:::

## 運作流程圖解

<div className="flow">
  <div className="flow-node">EC2 執行個體</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">扮演 IAM Role</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">取得臨時憑證</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">存取 S3 儲存貯體</div>
</div>

*圖：EC2 透過 Role 取得臨時憑證存取 S3，全程不需要人工管理金鑰。*

## User vs Group vs Role vs Policy：什麼時候用哪個？

這四個最容易混。記住一句話：**Policy 是「權限內容」，另外三個是「把權限掛在誰身上」。**

| 你要做的事 | 用哪個 | 為什麼（取捨） |
| --- | --- | --- |
| 給「一個長期、固定的人或機外程式」身分 | **User** | 需要一個能登入主控台或持有金鑰的固定身分時才建 User。**人越少越好**，能用 SSO／Role 就別狂開 User。 |
| 一群人要套同一套權限 | **Group** | 權限掛在 Group，人進出部門只要加入／移出 Group，不用一個個改。**絕對別把權限一條一條貼在每個 User 身上**，那是維運惡夢。 |
| 讓「服務」或「臨時／跨帳號」取得權限 | **Role** | 服務（EC2、Lambda）、跨帳號存取、人類透過 SSO 登入——全都用 Role 拿**臨時憑證**，不留長期金鑰。 |
| 定義「到底能做什麼」 | **Policy** | Policy 本身不是身分，是一份 JSON 規則，**要被附加（attach）到 User／Group／Role 上才生效**。 |

<Analogy title="🏢 生活比喻：門卡 vs 人 vs 部門 vs 訪客證">

- **Policy = 門卡上寫的權限清單**（能進哪幾間房），單獨一張清單不代表任何人。
- **User = 一位固定員工**，把清單貼到他的員工證上。
- **Group = 一個部門**，把清單貼到部門，部門裡每個人自動適用。
- **Role = 一張臨時訪客證**，誰（符合信任政策的）來借用，就暫時套上這份清單，用完還回去。

</Analogy>

:::tip[💡 考試重點：關鍵字對應]
- 題目講「**服務要存取另一個服務**」「**EC2/Lambda 需要權限**」「**跨帳號**」→ 幾乎都是 **Role**。
- 題目講「**很多開發者要套同一組權限**」「**好維護**」→ **Group**（不是一個個給 User）。
- 題目講「**定義允許/拒絕哪些動作**」→ 在講 **Policy** 的內容。
:::

## 為什麼要最小權限（least privilege）？

**最小權限**＝只給「完成工作剛好夠用」的權限，不多給。這不是潔癖，是**控制爆炸半徑**：一旦某個身分被盜或程式被入侵，攻擊者能摸到的範圍，就等於你當初給它的權限。給得越寬，災情越大。

<Analogy title="🏢 生活比喻：別給清潔阿姨保險箱鑰匙">

清潔工作只需要進辦公室的門卡，你卻順手給了連保險箱、機房、財務室都能開的萬能卡——哪天卡掉了，掉的就不只是辦公室。最小權限就是「**清潔的只給清潔的卡**」。

</Analogy>

### Managed Policy vs Inline Policy：用哪種？

Policy 的「附加方式」有兩種，考試和實務都愛比：

| 類型 | 是什麼 | 優點 | 缺點／何時別用 |
| --- | --- | --- | --- |
| **Managed Policy（受管政策）** | 一份**獨立存在**、可同時附加到多個 User／Group／Role 的政策。分 AWS 託管與客戶自建兩種。 | **一改全改、可重複使用、好稽核**；有版本可回溯。**預設首選。** | AWS 託管的常常**給得偏寬**（如 `AmazonS3FullAccess`），拿來當正式權限容易過權。 |
| **Inline Policy（內嵌政策）** | **直接寫死在某一個**身分裡、跟著它生、跟著它死的政策，不能共用。 | 保證「這條權限**只屬於這一個身分**」，身分刪掉政策也一起消失，不會留孤兒。 | **不能重複使用、難統一稽核**；大量使用會變成散落各處、沒人管得動的權限碎片。只在「真的要一對一綁死」時用。 |

:::tip[💡 考試重點：managed vs inline 怎麼選]
預設用 **客戶自建的 Managed Policy**（可重用、好管、好稽核）。**Inline** 只在「這條權限必須跟著單一身分一起存在、一起刪除」的少數情況用。看到「要給很多身分套用同一套、好維護」→ Managed；看到「這權限絕不可被別的身分誤用、要跟身分綁死」→ Inline。
:::

### 為什麼不要用 root 做日常操作？

**Root 使用者**是用 email 建帳號時那個「萬能帳號」，權限無法被 IAM 限制、也**無法縮小**。它能改帳單、關帳號、刪任何東西。日常用它＝天天把萬能鑰匙帶在身上，一旦外洩無可挽回，而且它做的事你很難用一般權限機制擋下來。

正確做法：**建帳號後立刻幫 root 開 MFA、把它鎖進抽屜**，日常改用 IAM 身分（最好是 SSO 的臨時憑證）。只有極少數**只有 root 能做**的操作（如關閉帳號、改帳號名稱、某些帳務設定）才臨時動用它。

## 政策評估邏輯：為什麼「明確 Deny」永遠勝出？

很多人以為「我多附一條 Allow 就能放行」，結果還是被擋。因為 IAM 判斷一個請求能不能過，是走一套**固定順序**，其中**明確的 Deny 永遠蓋過任何 Allow**：

<div className="flow">
  <div className="flow-node">有明確 Deny？</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">是 → 直接拒絕（誰都救不回）</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">否 → 有明確 Allow？</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">有 Allow 才放行，否則預設拒絕</div>
</div>

白話三句話記起來：

1. **預設全部拒絕**（default deny）：你沒給的，一律不能做。
2. **有明確 Allow 才放行**：要能做，一定要有某條 Policy 明確 Allow。
3. **只要有一條明確 Deny，就一定被擋**：不管多少條 Allow 都救不回來。Deny 是最終裁決。

<Analogy title="🏢 生活比喻：黑名單一票否決">

就算你同時在十個部門的許可名單上（十條 Allow），只要大門警衛手上的**黑名單**（一條 Deny）寫了你的名字，你就是進不去。Deny 是一票否決。

</Analogy>

:::info[🔑 這招的實務用途]
想「**保證某些動作任何人都不能做**」（如禁止刪除稽核日誌貯體、禁止在非允許區域開資源），就用**明確 Deny**（常搭配 Organizations 的 SCP）。因為 Deny 蓋過一切 Allow，就算有人不小心被附上過寬的 Allow，也被 Deny 擋住。
:::

## 實務應用：不只是考試

<Scenario title="真實情境：你剛進一家新創當工程師">

老闆說：「我們的訂單系統跑在 EC2 上，要讓它能把報表存到 S3，但**絕對不要把公司金鑰外洩**。」你該怎麼做？——答案就是這篇教的 IAM Role。下面帶你實際做一次。

</Scenario>

### 🛠️ 動手做：幫 EC2 建立一個能存取 S3 的 Role

1. 登入 AWS 主控台 → 搜尋列輸入 `IAM` → 進入 IAM 服務
2. 左側選單點 **角色（Roles）** → 右上角 **建立角色**
3. 信任的實體類型選 **AWS 服務**，使用案例選 **EC2** → 下一步
4. 搜尋並勾選 `AmazonS3ReadOnlyAccess` 政策 → 下一步
5. 命名為 `ec2-s3-readonly` → 建立角色
6. 回到 EC2 → 選擇執行個體 → **動作 › 安全性 › 修改 IAM 角色** → 掛上剛建的角色

完成後，登入該 EC2 用 CLI 驗證，**完全不需要輸入任何金鑰**：

```bash
# 直接列出 S3 貯體，憑證由 Role 自動提供
$ aws s3 ls
2026-10-16 10:23:01  my-company-reports

# 確認目前身分其實是在「扮演」Role
$ aws sts get-caller-identity
```

### 🛠️ 進階：用 CLI 建「最小權限」的 Role（含信任政策）

主控台很方便，但實務（和 DVA/IaC）常用 CLI 把兩份 JSON 分開：**信任政策**（誰能扮演）＋**權限政策**（能做什麼）。這也最能看清前面講的兩個方向。

```bash
# 1) 信任政策：只允許 EC2 服務扮演這個角色（這是「誰能借用」）
cat > trust-policy.json <<'JSON'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "ec2.amazonaws.com" },
    "Action": "sts:AssumeRole"
  }]
}
JSON

# 2) 建立角色，掛上信任政策
aws iam create-role \
  --role-name ec2-s3-readonly \
  --assume-role-policy-document file://trust-policy.json

# 3) 權限政策：最小權限，只允許讀「某一個」貯體（不是 S3FullAccess）
cat > permission-policy.json <<'JSON'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:GetObject", "s3:ListBucket"],
    "Resource": [
      "arn:aws:s3:::my-company-reports",
      "arn:aws:s3:::my-company-reports/*"
    ]
  }]
}
JSON

# 4) 把權限政策內嵌到角色（這裡示範 inline；要重用就改建 managed policy 再 attach）
aws iam put-role-policy \
  --role-name ec2-s3-readonly \
  --policy-name read-reports-only \
  --policy-document file://permission-policy.json
```

**預期結果**：`create-role` 會回傳一段 JSON，裡面有角色的 `Arn`（像 `arn:aws:iam::111122223333:role/ec2-s3-readonly`）與 `RoleId`。`put-role-policy` 成功時**不印任何東西、結束代碼為 0**（AWS CLI 的慣例：無聲即成功）。之後把這個角色掛到 EC2，該機器就**只能讀 `my-company-reports` 這一個貯體**，連列出其他貯體都會是 `AccessDenied`——這正是最小權限該有的樣子。

<Cost>

IAM、Role、Policy **本身完全免費**。但這個練習會開到 EC2（可能計費）。練習完記得把測試用的 EC2 **終止（Terminate）**，並善用**免費方案（Free Tier）** 的 `t2.micro`，避免月底帳單嚇到。

</Cost>

:::warning[🚑 常踩雷]
- **權限寫萬用 `*` 圖方便**：`"Action": "*"` 或 `"Resource": "*"` 等於把門全開，違反最小權限。正解是列出**具體動作**（`s3:GetObject`）與**具體資源 ARN**。看到 `"Action": "s3:*"` 就該警覺。
- **信任政策設錯方向**：把「能做什麼」寫進信任政策、或把 `Principal` 開成 `"*"`（任何人都能扮演）。記住：**信任政策只管「誰能扮演」**，`Principal` 要寫明確的服務或帳號；**權限政策才管「能做什麼」**。方向搞反會一直除不完錯。
- **root 沒開 MFA、還拿來日常操作**：root 權限無法縮小，外洩無可挽回。建帳號後**第一件事就是幫 root 開 MFA 並鎖起來**，日常改用 IAM／SSO 身分。
- **Policy 給太寬（過權）**：直接套 `AdministratorAccess` 或 `AmazonS3FullAccess` 當正式權限。被盜時攻擊者拿到的就是這整片權限。用客戶自建的最小權限 Managed Policy 取代。
- **掛了 Role 卻還是 Access Denied**：多半是 Policy 權限不夠，或程式還在讀舊的環境變數金鑰（**環境變數會優先於 Role**）。先 `aws sts get-caller-identity` 確認目前到底是什麼身分。
- **把長期 `AKIA` 金鑰 commit 進 Git／寫死在程式**：一旦推上公開 repo 幾分鐘內就會被掃到盜用。能用 Role／臨時憑證就別發長期金鑰。
:::

<Refs>

- [AWS 官方文件：IAM 使用者指南（What is IAM）](https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html)
- [IAM 安全最佳實務](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)

</Refs>

## 下一步

- ⚡ 快速複習：[Domain 1 重點速記 / 閃卡](/saa/domain-1/flashcards)
- ✍️ 測試自己：[Domain 1 原創練習題](/saa/domain-1/quiz)
- 📖 下一篇：[資料加密（KMS）](/saa/domain-1/kms)
