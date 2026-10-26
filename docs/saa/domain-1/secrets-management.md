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

### 白話：為什麼絕對別把密碼／金鑰寫死在程式或環境變數？

「寫死」指的是把密碼直接打在原始碼裡（`password = "p@ssw0rd"`），或塞進環境變數當設定。這樣看起來最省事，但有幾個致命問題：

- **程式碼會被散佈與保存**：原始碼會進版本控制（Git）、會被複製、會打包進映像檔。密碼一旦寫進去，就等於散佈到每一個拿到程式碼的人手上，而且**Git 歷史會永久保留**——事後刪掉也沒用，舊 commit 翻得到。
- **環境變數比你想的更容易外洩**：環境變數會出現在**錯誤堆疊、日誌、崩潰報告、`printenv`／程序清單**裡；掛了容器、CI/CD 工具、監控代理程式都看得到。它方便注入設定，但**不是機密保險箱**。
- **改密碼變成大工程**：密碼寫死後，要換就得改程式、重新部署、重啟服務。因為太麻煩，多數團隊乾脆**永遠不換密碼**——這正是外洩後災情擴大的主因。
- **無法做到最小權限與稽核**：寫死的密碼人人共用、看不出誰在用、也無法針對單一密碼撤銷或輪替。放進機密服務後，才有「誰在什麼時候讀了哪個密碼」的 IAM 權限與 CloudTrail 稽核。

**一句話**：密碼不是「設定」，是「機密」。設定可以寫死，機密要放進專門保險箱、執行時才憑身分去領。

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

### Secrets Manager：為什麼用它？優缺點？何時別用？

**為什麼是它**：它是 AWS 「專職」的機密保險箱。相對於 Parameter Store，它多做了一件最關鍵的事——**內建自動輪替**，還能跟 RDS／Redshift／DocumentDB 深度整合，一鍵設定「每 30 天自動換資料庫密碼、換完同步更新機密」，整個過程不用停機、不用改程式。

- **優點**：內建自動輪替（含 RDS 等受管整合）；預設就用 KMS 加密；支援跨區域複寫機密、跨帳號分享；原生版本管理（輪替時新舊密碼可平滑過渡，避免切換瞬間連不上）。
- **缺點**：**要錢**——每個機密每月約 US$0.40，外加 API 呼叫費。機密一多、呼叫一頻繁，帳單就有感。
- **何時別用**：只是要存「不太敏感的設定值」（如功能開關、資料表名、endpoint）、或**完全不需要輪替**又想省錢時，用它就是花冤枉錢。

### Parameter Store：為什麼用它？優缺點？何時別用？

**為什麼是它**：它是 Systems Manager 底下的設定值存放區，**標準參數免費**，而且用 **SecureString** 型別也能把機密用 KMS 加密後存起來。對「量大、要省錢、只需要安全讀取、不需要自動換」的情境非常划算。

- **優點**：標準參數免費（每帳號每區域上限 1 萬個）；支援 SecureString（KMS 加密）；有參數階層（`/app/prod/db-url` 這種路徑式命名好管理）；和多數 AWS 服務整合良好。
- **缺點**：**沒有內建輪替**——想自動換密碼得自己寫 Lambda + EventBridge 排程，等於重造 Secrets Manager 的輪子；不像 SM 有 RDS 那種開箱即用的整合。
- **何時別用**：題目／需求明確要**自動輪替**（尤其 RDS 密碼）時，別硬用 Parameter Store 去手刻輪替，直接上 Secrets Manager 省事又穩。

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

**預期結果**：會印出 JSON 字串（就是你剛存的鍵值對），程式再 parse 出 `password`：

```json
{"username":"admin","password":"s3cr3t!"}
```

程式端（以 Python boto3 為例）實際讀法——密碼只活在記憶體、從不落地到程式碼：

```python
import boto3, json

sm = boto3.client("secretsmanager")
resp = sm.get_secret_value(SecretId="prod/db/credentials")
creds = json.loads(resp["SecretString"])
# 用 creds["password"] 連資料庫，不寫死在程式裡
```

### 🛠️ 動手做（省錢版）：用 Parameter Store 的 SecureString 存機密

不需要自動輪替、想省錢時，改用 Parameter Store。重點是**型別一定要選 `SecureString`**（才會用 KMS 加密），別存成純文字的 `String`：

```bash
# 存一個加密的機密參數（SecureString ＝ 用 KMS 加密）
$ aws ssm put-parameter \
    --name "/prod/db/password" \
    --type SecureString \
    --value "s3cr3t!"

# 讀取時要加 --with-decryption 才會解密回明文
$ aws ssm get-parameter \
    --name "/prod/db/password" \
    --with-decryption \
    --query Parameter.Value --output text
```

**預期結果**：加了 `--with-decryption` 會印出解密後的 `s3cr3t!`；**若忘了加 `--with-decryption`，拿到的會是一串加密亂碼**（而非明文）——這是最常見的「我讀到奇怪字串」疑問來源。

<Cost>

- **Secrets Manager**：每個機密約 **US$0.40／月**，外加每萬次 API 呼叫約 US$0.05。
- **Parameter Store**：**標準參數免費**（每帳號每區域上限 1 萬個），進階參數才按月計費。
- 練習建議：想省錢就用 **Parameter Store 的 SecureString**；要體驗自動輪替再用 Secrets Manager，測完記得刪除機密。

</Cost>

:::warning[🚑 常踩雷]
- **用 Parameter Store 卻需要自動輪替**：Parameter Store **沒有內建輪替**。若需求／題目要「每 N 天自動換密碼、尤其 RDS 密碼」，硬用它就得自己寫 Lambda + EventBridge 手刻一套——又累又易錯。這種情況直接用 **Secrets Manager**。
- **把機密放成純文字 `String` 而非 `SecureString`**：Parameter Store 的 `String` 型別**不加密**，等於把密碼用明文攤在那裡（主控台、`get-parameter` 都看得到）。存機密**一律用 `SecureString`**，讀取時加 `--with-decryption`。
- **沒設最小權限讀取**：機密存了卻給太寬的 IAM（例如 `secretsmanager:GetSecretValue` 對 `Resource: "*"`，或 `ssm:GetParameter` 開給全部參數）。要用**最小權限**把讀取範圍**鎖到特定機密／特定參數路徑**，只有需要的角色能讀；並用 CloudTrail 稽核誰讀了什麼。
- **把機密寫進環境變數就以為安全**：環境變數容易被其他程式、日誌、錯誤訊息、崩潰報告洩漏，不算真正的機密管理。
- **選錯服務多花錢**：只是要省成本放設定值卻用了 Secrets Manager，每個機密每月都在付 US$0.40。反過來，真的需要輪替卻為省錢硬用 Parameter Store，則是省小錢擔大風險。
:::

<Refs>

- [AWS Secrets Manager 使用者指南](https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html)
- [Systems Manager Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html)

</Refs>

## 下一步

- ⚡ 複習：[Domain 1 重點速記 / 閃卡](./flashcards.md)
- ✍️ 測驗：[Domain 1 原創練習題](./quiz.md)
- 📖 下一篇：[稽核與監控：CloudTrail / Config / GuardDuty](./logging-monitoring.md)
