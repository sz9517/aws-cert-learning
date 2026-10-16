---
sidebar_position: 1
title: IAM 身分與存取管理
---

# IAM：AWS 的「門禁與鑰匙」系統

> 本篇用最白話的方式帶你理解 IAM，這是 SAA 考試出現頻率最高的主題之一。

:::info[📌 先認識這篇會出現的名詞（完全沒碰過也能懂）]

- **EC2（Elastic Compute Cloud）**：AWS 上「**租來的一台電腦／伺服器**」。你的網站、程式就跑在它上面。
- **S3（Simple Storage Service）**：AWS 的「**雲端硬碟／檔案倉庫**」，拿來放圖片、影片、備份、報表等檔案。
- **憑證／金鑰（Credentials / Access Key）**：證明「你是誰、有沒有權限」的**通行密碼**，外洩了別人就能冒用你的帳號。

:::

:::note[💬 閱讀小提示]
文章裡只要看到帶<Term desc="像這樣！滑鼠移到有虛線的名詞上（手機點一下），就會跳出白話解釋。">虛線底線的名詞</Term>，把滑鼠移上去就會跳出白話解釋。所有名詞也都整理在 [名詞與服務對照表](/glossary)。
:::

## 一句話先懂 IAM

**IAM（Identity and Access Management）** 決定了「**誰**（哪個使用者／服務）可以對「**哪些資源**」做「**哪些操作**」。它是 AWS 所有安全的根基，而且**完全免費**。

:::tip[🏢 生活比喻：把 AWS 帳號想成一棟公司大樓]

- **Root 使用者** = 建這棟樓的大老闆，擁有萬能鑰匙（平常絕對不要用它辦公！）
- **IAM User** = 公司每位員工，各自有員工證
- **IAM Group** = 部門（例如「工程部」），整個部門給同一套權限
- **IAM Policy** = 門禁卡的權限設定（能進哪幾間房、能不能開保險箱）
- **IAM Role** = 臨時訪客通行證，用完自動失效，給「服務或臨時需求」用

:::

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

## 實務應用：不只是考試

:::info[真實情境：你剛進一家新創當工程師]
老闆說：「我們的訂單系統跑在 EC2 上，要讓它能把報表存到 S3，但**絕對不要把公司金鑰外洩**。」你該怎麼做？——答案就是這篇教的 IAM Role。下面帶你實際做一次。
:::

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

:::danger[💰 成本提醒]
IAM、Role、Policy **本身完全免費**。但這個練習會開到 EC2（可能計費）。練習完記得把測試用的 EC2 **終止（Terminate）**，並善用**免費方案（Free Tier）** 的 `t2.micro`，避免月底帳單嚇到。
:::

:::warning[🚑 實務常見錯誤]
- **掛了 Role 卻還是 Access Denied？** 多半是 Policy 權限不夠，或程式還在讀舊的環境變數金鑰（環境變數會優先於 Role）。
- **一次給 `AdministratorAccess` 圖方便？** 實務大忌，違反最小權限；真的被盜用損失無法想像。
:::

## 下一步

- ⚡ 快速複習：[Domain 1 重點速記 / 閃卡](/saa/domain-1/flashcards)
- ✍️ 測試自己：[Domain 1 原創練習題](/saa/domain-1/quiz)
- 📖 下一篇：[資料加密（KMS）](/saa/domain-1/kms)
