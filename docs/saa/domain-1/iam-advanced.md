---
sidebar_position: 1.5
title: IAM 進階：跨帳號、STS、SCP、Identity Center
---

# IAM 進階：跨帳號角色、STS、SCP 與 Identity Center

> 讀完[基礎 IAM](./iam.md) 後，這篇補上 Associate **必考**的進階主題：怎麼安全地**跨帳號存取**、臨時憑證怎麼來、以及公司有**很多 AWS 帳號**時怎麼統一治理。

<Vocab title="📌 先認識這篇會出現的名詞">

- **STS（Security Token Service）**：發放**臨時憑證**的服務，有時效、會自動過期。
- **擔任角色（AssumeRole）**：暫時「變身」成某個 IAM Role，取得它的權限。
- **信任政策（Trust Policy）**：角色上寫明「**誰可以來擔任我**」的規則。
- **AWS Organizations**：把公司所有 AWS 帳號集中管理的服務。
- **SCP（Service Control Policy，服務控制政策）**：在 Organizations 層級設的**權限天花板**。
- **IAM Identity Center**：企業單一登入（SSO）服務，前身叫 AWS SSO。
- **權限邊界（Permission Boundary）**：限制某個使用者 / 角色「最多」能有多少權限的上限。

</Vocab>

## 臨時憑證：STS 與擔任角色

<Scenario title="真實情境：正式環境帳號要讀開發環境帳號的 S3">

你有兩個 AWS 帳號（正式、開發），正式環境的應用需要暫時讀取開發帳號的某個貯體。**不要**把開發帳號的長期金鑰複製過去——正確做法是：開發帳號建立一個 Role、信任政策寫「允許正式帳號來擔任」，正式環境的應用再透過 **STS AssumeRole** 取得**臨時憑證**去存取。憑證幾小時後自動失效，完全不用保管長期金鑰。

</Scenario>

<Analogy title="🎫 生活比喻：STS 臨時憑證就像訪客證">

長期金鑰像「正式員工識別證」——弄丟很麻煩。STS 給的是**訪客證**：到櫃台登記（AssumeRole）換一張、幾小時後自動失效，就算掉了風險也有限。能用臨時憑證就別用長期金鑰，是 AWS 的核心安全精神。

</Analogy>

### 為什麼跨帳號要用 STS AssumeRole，而不是共享長期金鑰？

這是本篇最該搞懂的「為什麼」。兩種做法都能讓正式帳號存取開發帳號，但差很多：

**共享長期金鑰的做法（反模式）**：把開發帳號的 Access Key / Secret Key 複製一份貼到正式帳號的設定檔或環境變數。看起來最快，但問題一堆：

- **永不過期**：這把金鑰只要沒人手動換掉就一直有效。哪天被 commit 進 Git、貼進 log、或離職員工帶走，等於長期後門大開。
- **難追查是誰用的**：大家共用同一把金鑰，CloudTrail 只看得到「這把 key 做了什麼」，看不出到底是哪個人、哪個服務在用。
- **輪替是惡夢**：要換金鑰就得同步通知所有拿著它的人一起改，漏一個就壞。

**STS AssumeRole 的做法（正解）**：正式帳號的身分去「擔任」開發帳號的一個角色，STS 當場發一把**只活幾分鐘到幾小時**的臨時憑證。

:::tip[💡 為什麼選它 / 優缺點]
**好處（為什麼選它）：**
- **會自動過期**：臨時憑證時效一到就失效（預設 1 小時，可調），就算外洩，風險窗口極小。
- **不用保管長期祕密**：來源端完全不持有開發帳號的金鑰，沒有「金鑰放哪、怎麼輪替」的煩惱。
- **可追查**：每次 AssumeRole 都會在 CloudTrail 留下「誰、在何時、用哪個 session name」擔任了角色，稽核清楚。
- **可集中收權**：要收回存取，只要改開發帳號角色的信任政策或權限，不用去追每一把散出去的金鑰。

**缺點 / 取捨：**
- **要先設好雙邊信任**（目標帳號的信任政策 + 來源端的 `sts:AssumeRole` 權限），第一次設定比「複製貼上金鑰」麻煩。
- **憑證會過期**：長時間執行的程式要能**自動重新 AssumeRole**換新憑證（用官方 SDK 通常會自動處理）。

**何時別用 / 不是首選的場合：** 同一帳號內的服務（如 EC2、Lambda）要存取同帳號資源時，直接掛 **IAM 角色**給該服務即可，SDK 會自動取臨時憑證，**不需要你手動 AssumeRole**。手動 AssumeRole 主要用在**跨帳號**、或要**臨時降/換權限**的情境。
:::

## 跨帳號存取的運作（圖解）

<div className="flow">
  <div className="flow-node">正式帳號的應用</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">呼叫 STS AssumeRole</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">取得臨時憑證</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">存取開發帳號的 S3</div>
</div>

*關鍵：開發帳號的 Role 要在**信任政策**裡把正式帳號列為可信來源，兩邊才接得起來。*

## 多帳號治理：Organizations 與 SCP

公司通常不只一個帳號（正式 / 測試 / 資安各一個…）。**AWS Organizations** 把它們集中管理，再用 **SCP** 設「權限天花板」。

:::tip[💡 SCP 最重要的觀念（必考）]
**SCP 只能「限制」權限，不會「給」權限。** 它設的是**上限**——就算某個 IAM 使用者的政策允許了某動作，只要 SCP 沒放行，照樣被擋。

生活比喻：SCP 像公司規定「全公司不准動用超過 10 萬的預算」。你主管（IAM Policy）就算批准你花 20 萬，也會先撞到這條公司天花板。
:::

### SCP vs 權限邊界 vs IAM Policy——三者別搞混

| 機制 | 作用範圍 | 給權限還是限權限 |
| --- | --- | --- |
| **IAM Policy** | 單一使用者 / 群組 / 角色 | **給**權限 |
| **權限邊界（Permission Boundary）** | 單一使用者 / 角色 | 設該對象的**權限上限** |
| **SCP** | 整個帳號 / 組織單位（OU） | 設整個帳號的**權限天花板** |

> 口訣：**實際權限 = IAM Policy 給的 ∩（交集）各層天花板**。任何一層沒放行就被擋。

### 為什麼要有 SCP？跟 IAM Policy 到底怎麼取捨

新手最容易把 SCP 當成「另一種發權限的工具」，其實兩者角色完全不同、而且是**互補**的：

- **IAM Policy 是油門**：負責「**給**權限」，把某個使用者 / 角色能做的事打開。沒有它，什麼都不能做。
- **SCP 是煞車 / 天花板**：負責「**封頂**」，規定「這個帳號裡**最多**能碰到哪些服務／動作」。它**不會給任何人權限**，只會把超過天花板的部分一律擋掉——**連帳號的 root 使用者也擋得住**，這是它和 IAM Policy 最關鍵的差別。

:::tip[💡 為什麼選它 / 何時用 Organizations + SCP]
**為什麼需要 SCP（意義）：** 公司帳號一多，光靠「每個帳號裡各自寫好 IAM Policy」根本管不動——總有人在某個帳號開了太大的權限。SCP 讓你在**組織層級**畫一條所有人都跨不過的紅線（例如「這些是沙箱帳號，一律禁止動用 EC2 以外的昂貴服務」「全組織禁止關閉 CloudTrail」），不管帳號裡的管理員怎麼設都突破不了。

**什麼時候用：**
- 有 **AWS Organizations、多個帳號**，要做**全組織統一的護欄（guardrail）**時。
- 要**強制合規**（如「只准用特定區域」「禁止刪稽核日誌」），且不希望被個別帳號管理員繞過。

**取捨 / 缺點：**
- **SCP 只在 Organizations 裡存在**，單一獨立帳號沒有這東西。
- **不授權、只設限**：設完 SCP，帳號內**仍要有 IAM Policy 真正授權**，動作才會通。兩者要一起設，缺一不可。
- 設太嚴容易**誤殺**：一條「拒絕」SCP 會蓋過帳號內所有允許，排錯時常讓人一頭霧水（「IAM 明明給了為什麼還是不行？」答案往往在 SCP）。
:::

## 企業單一登入：IAM Identity Center

員工不該為每個 AWS 帳號各記一組密碼。**IAM Identity Center** 讓員工用**一組公司帳號（可串接 Active Directory、Google、Okta 等）**登入，再依角色自動取得各 AWS 帳號的權限。

### 為什麼大型 / 多帳號公司改用 Identity Center，而不是傳統 IAM users？

傳統做法是在**每個帳號裡各建一批 IAM 使用者**。帳號一多、人一多，這招就會塌：

**傳統 IAM users 的痛點：**
- **帳號爆炸**：10 個帳號 × 50 位員工，等於要維護 500 組使用者與密碼，入職離職都要到處開關帳號，一定會漏。
- **到處是長期憑證**：IAM users 常帶長期金鑰與密碼，散落各帳號，攻擊面大。
- **沒有單一登入**：員工每個帳號各記一組密碼，體驗差也不安全。

**Identity Center 怎麼解：** 員工只在**一個地方**（可串接公司既有的 AD / Google / Okta）有身分，登入後從一個入口看到自己有權限的所有帳號，點進去時 Identity Center 在背後用**臨時憑證**（本質還是 STS）配發對應角色的權限。

:::tip[💡 為什麼選它 / 取捨]
**好處（為什麼選它）：**
- **單一身分、單一登入**：一處管理入職 / 離職，一關帳號就全帳號失效，不會有漏網的殭屍帳號。
- **用臨時憑證、少長期金鑰**：大幅縮小「金鑰散落」的攻擊面。
- **沿用企業既有目錄**：直接接 AD / Okta，不必在 AWS 重建一套人員資料。
- **權限集中治理**：用「權限集（Permission Set）」統一定義角色，套到多個帳號，不用每個帳號各寫一次。

**取捨 / 缺點：**
- **初期要設定**：要接身分來源、規劃權限集，比隨手開幾個 IAM user 費工（但帳號一多就非常划算）。
- **面向的是「人」**：Identity Center 管的是**員工登入**；**程式 / 服務之間**的存取還是走 **IAM 角色 + STS**，別混用。

**何時反而不用：** 只有單一帳號、少數幾個人的小專案，傳統 IAM users 其實就夠，硬上 Identity Center 反而過度設計。**帳號多 / 人多 / 要接企業目錄**時才是它發光的場合。
:::

:::tip[💡 考試重點]
- 「要**跨帳號**存取、又**不想用長期金鑰**」→ **IAM Role + STS AssumeRole**。
- 「要**阻止整個帳號**做某件事（即使管理員也不行）」→ **SCP**（記住：只限制、不給予）。
- 「公司**很多帳號**，員工要**一次登入全部**、串接企業目錄」→ **IAM Identity Center**。
- 「委派開發者建角色，但**不准他做出權限比自己大的角色**」→ **權限邊界**。
:::

## 實務應用

### 🛠️ 動手做：用 CLI 擔任跨帳號角色

```bash
# 擔任開發帳號的唯讀角色，取得臨時憑證
$ aws sts assume-role \
    --role-arn arn:aws:iam::222222222222:role/CrossAccountReadOnly \
    --role-session-name demo-session
```

**預期結果**：成功的話，會回傳一包 JSON，核心是 `Credentials` 區塊，裡面三個欄位就是這次的臨時憑證：

```json
{
  "Credentials": {
    "AccessKeyId": "ASIA...",
    "SecretAccessKey": "wJalr...",
    "SessionToken": "FwoGZXIvYXdz...",
    "Expiration": "2026-10-26T15:00:00Z"
  },
  "AssumedRoleUser": {
    "Arn": "arn:aws:sts::222222222222:assumed-role/CrossAccountReadOnly/demo-session"
  }
}
```

注意 `AccessKeyId` 以 **`ASIA`** 開頭（臨時憑證的特徵；長期金鑰是 `AKIA`），且有 `Expiration` 到期時間。接著把這三個值設成環境變數，之後的指令就是用這組臨時身分在跑：

```bash
# 把回傳的三個值設進環境變數（macOS / Linux）
$ export AWS_ACCESS_KEY_ID=ASIA...
$ export AWS_SECRET_ACCESS_KEY=wJalr...
$ export AWS_SESSION_TOKEN=FwoGZXIvYXdz...

# 驗證：現在的身分應該是「擔任後的角色」，不是原本的你
$ aws sts get-caller-identity
# 預期看到 Arn 為 .../assumed-role/CrossAccountReadOnly/demo-session
```

:::info[🔑 常見錯誤與預期錯誤訊息]
如果信任關係沒設好，`assume-role` 會直接失敗並回傳類似訊息：

```
An error occurred (AccessDenied) when calling the AssumeRole operation:
User: arn:aws:iam::111111111111:user/alice is not authorized to perform:
sts:AssumeRole on resource: arn:aws:iam::222222222222:role/CrossAccountReadOnly
```

看到這個 `AccessDenied on sts:AssumeRole`，就去檢查**兩邊**：目標角色的**信任政策**有沒有把來源帳號 / 使用者列為可信，以及來源端有沒有 `sts:AssumeRole` 權限。
:::

<Cost>

**IAM、STS、Organizations、SCP、IAM Identity Center 本身都免費**——你只為實際動用的資源付費。多帳號治理不會額外增加帳單，放心規劃。

</Cost>

:::warning[🚑 常踩雷]
- **以為 SCP 會「授權」**：最大的誤解。SCP **只設上限、永遠不給權限**。帳號內還是要有 IAM Policy 真正授權，動作才會通。反過來，排錯「IAM 明明給了卻還是 AccessDenied」時，第一個該懷疑的就是某條 SCP 把它封頂擋掉了。
- **把「信任關係」和「權限政策」搞混**：這兩個掛在角色上的政策**管的是完全不同的事**——
  - **信任政策（Trust Policy）**＝「**誰可以來擔任我**」（放在目標帳號的角色上）。
  - **權限政策（Permission Policy）**＝「**擔任之後能做什麼**」。
  信任政策寫對、權限政策忘了給 → 擔任得成功，但一操作就 `AccessDenied`；反過來權限給足、信任沒把來源列進去 → 連 `AssumeRole` 這一步都過不了。遇到卡關先分清楚是哪一個。
- **跨帳號只設了一邊**：擔任角色要**兩邊都對**——目標帳號角色的信任政策把來源列為可信 + 來源端有 `sts:AssumeRole` 權限。少一邊就會在 `assume-role` 直接吃 `AccessDenied`。
- **第三方跨帳號忘了外部 ID（External ID）**：當你把角色開給**外部廠商 / 第三方 SaaS** 擔任時，信任政策一定要加 `sts:ExternalId` 條件，呼叫方 `assume-role` 也要帶 `--external-id`。少了它會有「混淆代理人（confused deputy）」風險——別的客戶可能被誘導去擔任到你的角色。**同公司自己帳號之間不需要**外部 ID，這招專門給第三方情境。
- **為了跨帳號去複製長期金鑰**：這正是要避免的反模式（永不過期、難稽核、輪替惡夢），請一律改用角色 + STS。
:::

<Refs>

- [IAM 角色（Roles）](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles.html)
- [服務控制政策 SCP（AWS Organizations）](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html)
- [IAM Identity Center 是什麼](https://docs.aws.amazon.com/singlesignon/latest/userguide/what-is.html)

</Refs>

## 下一步

- 📖 回顧基礎：[IAM 身分與存取管理](./iam.md)
- 📖 下一篇：[資料加密（KMS）](./kms.md)
- ⚡ 複習：[Domain 1 重點速記 / 閃卡](./flashcards.md)
