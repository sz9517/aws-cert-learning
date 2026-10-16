---
sidebar_position: 5
title: 機密管理：Secrets Manager vs Parameter Store
---

# 機密管理：不要再把密碼寫在程式裡

> 資料庫密碼、API 金鑰這些「機密」該放哪？這篇教你 AWS 的兩個標準答案，以及它們的差別（考試會比較）。

<Vocab title="📌 先認識這篇會出現的名詞">

- **機密（Secret）**：不能外流的敏感字串，例如資料庫密碼、API 金鑰、憑證。
- **Secrets Manager**：AWS 專門存放機密的服務，**可自動定期更換密碼（輪替）**。
- **Parameter Store（參數存放區）**：Systems Manager 底下的設定值存放區，也能存機密，**基本功能免費**。
- **輪替（Rotation）**：定期自動把密碼換成新的，降低外洩風險。

</Vocab>

## 為什麼需要它？

<Scenario title="真實情境：資料庫密碼寫在程式碼裡，上傳到 GitHub">

工程師把資料庫密碼直接寫在程式碼，結果不小心推上**公開的 GitHub**，幾分鐘內資料庫就被入侵。機密**永遠不該寫在程式碼、設定檔或環境變數裡**，而是放在專門的機密服務，程式執行時再去「取用」。

</Scenario>

<Analogy title="🔑 生活比喻：鑰匙不要黏在門上">

把密碼寫在程式碼，等於**把鑰匙用膠帶貼在門上**——誰經過都拿得到。正確做法是把鑰匙放進**保管箱（Secrets Manager / Parameter Store）**，需要時憑身分（IAM）去領，而且還能定期換鎖（輪替）。

</Analogy>

## 兩個服務怎麼選？（考試必比）

| 比較項 | Secrets Manager | Parameter Store |
| --- | --- | --- |
| 主要用途 | 專門放**機密**（密碼、金鑰） | 放**設定值**，也能放機密 |
| **自動輪替** | ✅ **內建**，可自動換 RDS 密碼 | ❌ 沒有內建（要自己寫 Lambda） |
| 加密 | 預設用 KMS 加密 | 可選（SecureString 類型用 KMS） |
| 費用 | **每個機密約 $0.40／月** + API 費 | **標準參數免費**（進階參數才收費） |
| 適合情境 | 需要**自動輪替**、跨服務整合的機密 | 預算有限、不需自動輪替的設定與機密 |

:::tip[💡 考試重點：關鍵就看「要不要自動輪替」]
- 題目強調 **自動輪替密碼（尤其是 RDS 資料庫密碼）** → 選 **Secrets Manager**。
- 題目強調 **省成本、只是要安全存放設定值** → 選 **Parameter Store（SecureString）**。
:::

## 運作流程圖解

<div className="flow">
  <div className="flow-node">應用程式需要資料庫密碼</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">憑 IAM 身分向 Secrets Manager 索取</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">取得當下有效的密碼</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">連線資料庫（密碼從不寫死在程式裡）</div>
</div>

## 實務應用

### 🛠️ 動手做：把一個資料庫密碼存進 Secrets Manager

1. 進主控台 → 搜尋 `Secrets Manager` → **儲存新機密**
2. 機密類型選 **其他類型的機密**（或 RDS 類型）
3. 用鍵值對輸入，例如 `username = admin`、`password = ****`
4. 命名 `prod/db/credentials` → 下一步（可設定自動輪替）→ 儲存

程式用 CLI／SDK 取用（完全不需要在程式裡寫死密碼）：

```bash
# 取出機密內容
$ aws secretsmanager get-secret-value \
    --secret-id prod/db/credentials \
    --query SecretString --output text
```

<Cost>

- **Secrets Manager**：每個機密約 **US$0.40／月**，外加每萬次 API 呼叫約 US$0.05。
- **Parameter Store**：**標準參數免費**（每帳號每區域上限 1 萬個），進階參數才按月計費。
- 練習建議：想省錢就用 **Parameter Store 的 SecureString**；要體驗自動輪替再用 Secrets Manager，測完記得刪除機密。

</Cost>

:::warning[🚑 實務常見錯誤]
- **把機密寫進環境變數就以為安全**：環境變數容易被其他程式、日誌、錯誤訊息洩漏，不算真正的機密管理。
- **機密存了卻沒限制 IAM 權限**：要搭配**最小權限**，只讓需要的角色能讀取特定機密。
- **選錯服務**：只是要省成本放設定值卻用了 Secrets Manager，每個機密每月都在付 $0.40。
:::

<Refs>

- [AWS Secrets Manager 使用者指南](https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html)
- [Systems Manager Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html)

</Refs>

## 下一步

- ⚡ 複習：[Domain 1 重點速記 / 閃卡](./flashcards.md)
- ✍️ 測驗：[Domain 1 原創練習題](./quiz.md)
- 📖 下一篇：[稽核與監控：CloudTrail / Config / GuardDuty](./logging-monitoring.md)
