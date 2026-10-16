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

## 企業單一登入：IAM Identity Center

員工不該為每個 AWS 帳號各記一組密碼。**IAM Identity Center** 讓員工用**一組公司帳號（可串接 Active Directory、Google、Okta 等）**登入，再依角色自動取得各 AWS 帳號的權限。

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

# 回傳的 AccessKeyId / SecretAccessKey / SessionToken 即為臨時憑證
```

<Cost>

**IAM、STS、Organizations、SCP、IAM Identity Center 本身都免費**——你只為實際動用的資源付費。多帳號治理不會額外增加帳單，放心規劃。

</Cost>

:::warning[🚑 常見錯誤]
- **以為 SCP 會給權限**：它只設上限。帳號內還是要有 IAM Policy 真正授權，動作才會通。
- **跨帳號只設了一邊**：擔任角色要**兩邊都對**——目標帳號角色的信任政策 + 來源端有 `sts:AssumeRole` 權限。
- **為了跨帳號去複製長期金鑰**：這正是要避免的反模式，請一律改用角色 + STS。
:::

## 下一步

- 📖 回顧基礎：[IAM 身分與存取管理](./iam.md)
- 📖 下一篇：[資料加密（KMS）](./kms.md)
- ⚡ 複習：[Domain 1 重點速記 / 閃卡](./flashcards.md)
