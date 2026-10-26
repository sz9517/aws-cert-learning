---
sidebar_position: 4
title: 機密管理（Secrets Manager vs Parameter Store）
---

# 機密管理：別把密碼寫死，讓程式在執行時「安全地去拿」

> 本篇用「開發者視角」帶你搞懂：為什麼不能把資料庫密碼、API 金鑰寫死在程式碼或塞進環境變數；程式怎麼用 SDK 在執行時安全取用機密（`get-secret-value` / `get-parameter --with-decryption`）；為什麼一定要**快取**機密而不是每次請求都去抓；Secrets Manager 的**自動輪替**怎麼運作；以及最常被 DVA-C03 Domain 2 考到的抉擇——**Secrets Manager vs Parameter Store 到底怎麼選**。

<Vocab title="📌 先認識這篇會出現的名詞（完全沒碰過也能懂）">

- **機密（Secret）**：任何「外洩就出事」的敏感資料——資料庫密碼、第三方 API 金鑰、OAuth token、TLS 私密金鑰等。相對地，資料表名稱、區域這種不敏感的值叫「設定（configuration）」。
- **寫死（Hard-code）**：把值直接打在程式碼裡（如 `password = "p@ss123"`）。只要有人拿到原始碼或反編譯，機密就外洩，而且改一次要重新部署。
- **Secrets Manager**：AWS 專門存放機密的服務，特色是**內建自動輪替**（定期自動換新密碼並更新到資料庫），每個機密按月＋按呼叫次數計費。
- **Parameter Store（SSM Parameter Store）**：AWS Systems Manager 底下的設定／機密儲存，`String`／`StringList` 存一般設定（免費），`SecureString` 用 KMS 加密存機密（標準層免費）。
- **SecureString**：Parameter Store 裡「用 <Term en="Key Management Service" desc="AWS 的金鑰管理服務，負責產生、保管加密金鑰並代為加解密。">KMS</Term> 加密」的參數類型。取用時要加 `--with-decryption` 才會解密回明文。
- **輪替（Rotation）**：定期把機密換成新值（例如每 30 天換一次資料庫密碼），降低「舊密碼早就被偷、卻一直有效」的風險。
- **快取（Cache）**：把抓回來的機密在執行環境記憶體裡暫存一小段時間，下次直接用，不用再呼叫 API。

</Vocab>

:::note[💬 閱讀小提示]
文章裡只要看到帶<Term desc="像這樣！滑鼠移到有虛線的名詞上（手機點一下），就會跳出白話解釋。">虛線底線的名詞</Term>，把滑鼠移上去就會跳出白話解釋。所有名詞也都整理在 [名詞與服務對照表](/glossary)。
:::

## 為什麼需要它？先看「把密碼寫死」會出什麼事

假設你的 Lambda 要連資料庫，你圖方便直接這樣寫：

```js
// ❌ 千萬別這樣
const conn = connect({ user: 'admin', password: 'p@ssw0rd-2024' });
```

這段看起來能跑，但埋了四顆地雷：

1. **機密進了原始碼倉庫**：只要程式碼推上 Git，密碼就永遠留在歷史紀錄裡，任何能看到 repo 的人都看得到。
2. **要換密碼就得重新部署**：資料庫改密碼，你得改程式、重新建置、重新部署，整條流程都得動。
3. **多環境難管理**：開發、測試、正式各一組密碼，全寫死就得維護多份程式碼或塞一堆判斷。
4. **無法輪替**：資安最佳實務是「定期換密碼」，寫死的值根本沒辦法自動換。

那「改放環境變數」就好了嗎？比寫死好一點（至少不進原始碼），但還是不夠：**環境變數的值會明文顯示在 Lambda 設定、CloudFormation 範本、部署紀錄裡**，而且一樣不會自動輪替。真正的解法是：**機密集中存在專門服務（加密保管＋控管讀取權限），程式在執行時才用 SDK 去拿**。

<Analogy title="🏢 生活比喻：機密像銀行保險箱裡的鑰匙，不是寫在便利貼上">

- **寫死在程式碼 = 把保險箱密碼寫在便利貼貼在螢幕上**：路過的人都看得到。
- **塞環境變數 = 把便利貼收進抽屜**：好一點，但抽屜（Lambda 設定／部署紀錄）還是會被翻到。
- **存在 Secrets Manager / Parameter Store = 鑰匙鎖在銀行保險箱**：需要時本人帶證件（IAM 權限）去銀行領，領完用一下就還回去（快取一小段時間），而且銀行會定期幫你換鎖（輪替）。

</Analogy>

## 核心一：程式裡怎麼安全取用機密

概念很單純：機密**不在程式碼裡**，而是在執行時用 SDK／CLI 向服務要。兩個服務的取用指令不同：

**Secrets Manager —— `get-secret-value`**

```bash
# CLI：抓一個機密的值（回傳 JSON，SecretString 欄位是你的機密內容）
aws secretsmanager get-secret-value --secret-id prod/db/credentials
```

```js
// SDK（Node.js v3）：取出並解析機密
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient();
const resp = await client.send(new GetSecretValueCommand({ SecretId: 'prod/db/credentials' }));
const secret = JSON.parse(resp.SecretString); // { username, password, host, ... }
```

**Parameter Store —— `get-parameter --with-decryption`**

```bash
# CLI：抓 SecureString 參數，一定要加 --with-decryption 才會解密回明文
aws ssm get-parameter --name /prod/db/password --with-decryption
```

```js
// SDK（Node.js v3）：WithDecryption: true 等同 CLI 的 --with-decryption
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

const ssm = new SSMClient();
const resp = await ssm.send(new GetParameterCommand({
  Name: '/prod/db/password',
  WithDecryption: true, // 忘了這個就只拿到加密後的密文，不是明文
}));
const password = resp.Parameter.Value;
```

:::info[🔑 `--with-decryption` 是 SecureString 的關鍵]
Parameter Store 的 `SecureString` 平常以 KMS 加密狀態保存。取用時**不加** `--with-decryption`（SDK 的 `WithDecryption: true`），拿到的是**加密後的密文**，不是你要的明文密碼。對應地，呼叫者的 IAM 角色除了 `ssm:GetParameter`，還需要對那把 KMS 金鑰的 `kms:Decrypt` 權限，否則會噴 `AccessDeniedException`。`String`／`StringList` 則沒有加密，加不加 `--with-decryption`都一樣。
:::

## 核心二：為什麼要「快取」機密，不要每次請求都抓

新手最常犯的錯，是把 `get-secret-value` 寫在 handler **裡面**，等於每一個請求都去呼叫一次 API。這會同時踩三個坑：

- **延遲（Latency）**：每次請求多一趟網路往返（通常數十毫秒），面向使用者的 API 會明顯變慢。
- **成本（Cost）**：Secrets Manager **按呼叫次數計費**（每萬次約 US$0.05）。高流量 API 每天幾百萬次請求都去抓，帳單很可觀；Parameter Store 標準層雖然呼叫免費，但也有**吞吐量上限**。
- **限流（Throttling）**：兩個服務都有 API 速率上限，狂打會收到 `ThrottlingException`，反而讓請求失敗。

正確做法：**在執行環境啟動時（handler 外層）抓一次，快取在記憶體，設一個存活時間（TTL，例如幾分鐘）過期才重抓**。這樣同一個熱啟動環境的大量請求共用同一份快取，呼叫 API 次數從「每請求一次」降到「每幾分鐘一次」。

```js
// ✅ 把機密抓取放 handler 外層（Init 階段），加上帶 TTL 的簡易快取
let cached = null;
let cachedAt = 0;
const TTL_MS = 5 * 60 * 1000; // 5 分鐘

async function getDbSecret() {
  const now = Date.now();
  if (cached && now - cachedAt < TTL_MS) return cached; // 命中快取，直接用
  const resp = await client.send(new GetSecretValueCommand({ SecretId: 'prod/db/credentials' }));
  cached = JSON.parse(resp.SecretString);
  cachedAt = now;
  return cached;
}

export const handler = async (event) => {
  const { username, password } = await getDbSecret(); // 大多數請求都命中快取
  // ...用這組憑證連資料庫
};
```

:::tip[💡 考試重點：別自己造輪子，用官方快取工具]
Lambda 可以直接用 **AWS Parameters and Secrets Lambda Extension**（一個 Layer），它會在本地跑一個小快取服務，你的程式改打 `localhost` 就能拿到已快取的機密／參數，連 SDK 都不用寫快取邏輯。Secrets Manager 也有官方的 **caching client**（Java／Python／.NET／Go）。考試看到「如何降低 Lambda 取用機密的延遲與呼叫次數」→ 答案通常就是**快取**（Extension 或 caching client），不是「提高 API 上限」。
:::

## 核心三：自動輪替（Secrets Manager 的招牌功能）

<Term en="Rotation" desc="定期自動把機密換成新值，並同步更新到使用該機密的服務（如資料庫），降低舊機密長期有效的風險。">輪替</Term> 是 Secrets Manager 最大的賣點。設定後，它會按你排的週期（例如每 30 天）**自動**完成一整套換密碼流程，你完全不用手動介入：

<div className="flow">
  <div className="flow-node">createSecret 產生新密碼</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">setSecret 寫進資料庫</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">testSecret 用新密碼測試連線</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">finishSecret 把新版標成目前版本</div>
</div>

- 背後是一個 **Rotation Lambda** 幫你跑上面四步（RDS、Redshift、DocumentDB 這些常見資料庫，AWS 提供現成藍圖，幾乎零程式碼）。
- 輪替期間新舊密碼會**短暫並存**（用版本標籤 `AWSCURRENT`／`AWSPENDING` 區分），確保正在連線的程式不會瞬間斷掉。
- **只要你的程式有照核心二做快取＋TTL**，密碼被輪替後，快取過期重抓就會自動拿到新密碼，不用改程式、不用重新部署。這正是「不要寫死」最大的回報。

:::info[🔑 Parameter Store 沒有內建輪替]
Parameter Store **不會**自動輪替機密。你當然可以自己寫 Lambda＋EventBridge 排程去換，但那要自己維護整套邏輯。「需求白紙黑字要自動輪替」→ 幾乎都是指向 **Secrets Manager**。
:::

## Secrets Manager vs Parameter Store 怎麼選

這是 DVA-C03 Domain 2 的高頻考點。先看固定對照，再記口訣。

| 比較面向 | Secrets Manager | Parameter Store（SSM） |
| --- | --- | --- |
| **主要定位** | 專門存**機密**，功能完整 | 存**設定＋機密**，輕量通用 |
| **自動輪替** | ✅ 內建，RDS 等有現成藍圖 | ❌ 無內建（要自己做） |
| **加密** | 一律 KMS 加密 | `SecureString` 才用 KMS；`String`／`StringList` 不加密 |
| **成本** | **每個機密每月計費** + 每萬次呼叫計費 | 標準層**免費**（進階參數才收費） |
| **跨帳號／資源政策** | ✅ 支援附加資源政策、跨帳號共享 | 標準層較陽春 |
| **大小上限** | 每個機密最大 64 KB | 標準層 4 KB、進階層 8 KB |
| **與 RDS 等整合** | ✅ 建立 RDS 時可直接託管憑證 | 需自己串 |

**優缺點整理：**

- **Secrets Manager 優點**：內建輪替、與 RDS／資料庫深度整合、支援資源政策跨帳號、功能最完整。**缺點**：**要花錢**（每個機密每月固定費用，機密多時成本明顯）。
- **Parameter Store 優點**：標準層**免費**、同一個地方存設定與機密、和 SSM／IaC 整合好、學習成本低。**缺點**：**沒有自動輪替**、跨帳號與進階功能較弱。

:::tip[💡 考試重點：一句話選型口訣]
- 需要**自動輪替** / 和 **RDS 等資料庫憑證**深度整合 / 要**跨帳號共享**機密 → **Secrets Manager**。
- 只是存**一般設定值**（資料表名、功能開關、endpoint）或**想省錢**、不需要輪替 → **Parameter Store**（設定用 `String`，少量機密用 `SecureString`）。
- 常見混搭：**不敏感設定放 Parameter Store（免費）、需要輪替的資料庫密碼放 Secrets Manager**。
:::

## 動手做：建立機密 → 用 SDK 取用並快取

<Scenario title="真實情境：Lambda 連 RDS，密碼要能被輪替、又不想每次請求都去抓">

你的訂單 API 跑在 Lambda，要連 RDS。需求是：密碼每 30 天自動換、程式不能寫死、而且高流量下不能每個請求都去呼叫機密服務。做法：把憑證存進 Secrets Manager、開自動輪替、程式在 handler 外層抓一次並快取 TTL 5 分鐘。輪替換了新密碼後，快取一過期就自動拿到新的，全程不用改程式。

</Scenario>

### 🛠️ 跟著做一次

```bash
# 1) 建立機密（把資料庫帳密以 JSON 存入，整個以 KMS 加密）
aws secretsmanager create-secret \
  --name prod/db/credentials \
  --secret-string '{"username":"admin","password":"InitPass-123","host":"orders.xxxx.rds.amazonaws.com"}'

# 2)（選）開自動輪替：每 30 天，用指定的 Rotation Lambda 執行
aws secretsmanager rotate-secret \
  --secret-id prod/db/credentials \
  --rotation-lambda-arn arn:aws:lambda:ap-northeast-1:111122223333:function:SecretsRotation \
  --rotation-rules AutomaticallyAfterDays=30

# 3) 驗證能取回（開發機測試用；正式環境由程式的 IAM 角色去拿）
aws secretsmanager get-secret-value --secret-id prod/db/credentials \
  --query SecretString --output text
```

程式端就用**核心二**那段帶 TTL 快取的 `getDbSecret()`，並給 Lambda 執行角色最小權限（只允許讀這一個機密）：

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": "secretsmanager:GetSecretValue",
    "Resource": "arn:aws:secretsmanager:ap-northeast-1:111122223333:secret:prod/db/credentials-*"
  }]
}
```

**預期結果：**

- 步驟 1 回傳含 `ARN`、`Name`、`VersionId` 的 JSON，代表機密已建立。
- 步驟 2 回傳機密 `ARN` 與 `VersionId`，之後每 30 天 Secrets Manager 會自動跑一輪輪替，RDS 的密碼與機密內容同步更新。
- 步驟 3 印出你剛存的那串 JSON（`{"username":"admin",...}`）。若少給 KMS `Decrypt` 權限或機密名打錯，會看到 `AccessDeniedException` 或 `ResourceNotFoundException`。
- 部署後打 API：**第一個請求**觸發一次 `GetSecretValue`（填快取），接下來 5 分鐘內的大量請求都**命中快取、不再呼叫 API**；CloudWatch 上 `GetSecretValue` 的呼叫次數會從「每請求一次」掉到「每 5 分鐘一次」。

<Cost>

**Secrets Manager 會持續計費**：每個機密約 **US$0.40／月**，再加每萬次 API 呼叫約 **US$0.05**。機密數量多、或沒做快取而高頻呼叫時，帳單會很有感。**Parameter Store 標準層完全免費**（含 `SecureString`，只付 KMS 一點點解密費），適合存大量一般設定。省錢策略：**不需輪替的設定一律放 Parameter Store，只有真正需要自動輪替的機密才放 Secrets Manager**，並務必做快取降低呼叫次數。練習完記得把測試機密 `delete-secret` 清掉（預設有 7～30 天復原期）。

</Cost>

:::warning[🚑 常踩雷]
- **每個請求都去抓機密**：把 `get-secret-value` 放進 handler 本體，高流量時又慢、又貴、還會被 `ThrottlingException` 限流。正解：handler 外層抓一次 + TTL 快取（或用 Parameters and Secrets Lambda Extension）。
- **把機密存成純文字 `String` 而非 `SecureString`**：Parameter Store 的 `String` 不加密，等於把密碼明文攤在那。機密一律用 `SecureString`。
- **需要自動輪替卻選了 Parameter Store**：它沒有內建輪替。需求提到「定期自動換密碼」就要用 Secrets Manager，別硬用 Parameter Store 自己造輪子。
- **沒設最小權限就讀機密**：執行角色給了 `secretsmanager:*` 或 `Resource: "*"`，等於任何機密都能讀。只開「這一個機密」的 `GetSecretValue`（SecureString 另需對應 KMS 金鑰的 `kms:Decrypt`）。
- **忘了 `--with-decryption`**：取 Parameter Store 的 `SecureString` 沒加這個旗標（SDK 的 `WithDecryption: true`），只會拿到加密密文而不是明文，程式拿去連線一定失敗。
:::

<Refs>

- [AWS Secrets Manager 使用者指南](https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html)
- [Secrets Manager 自動輪替機密](https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotating-secrets.html)
- [SSM Parameter Store 使用參數](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html)
- [AWS Parameters and Secrets Lambda Extension（快取）](https://docs.aws.amazon.com/secretsmanager/latest/userguide/retrieving-secrets_lambda.html)
- [Secrets Manager 與 Parameter Store 的選擇與整合](https://docs.aws.amazon.com/systems-manager/latest/userguide/integration-ps-secretsmanager.html)

</Refs>

## 下一步

👉 下一篇：[簽署請求與臨時憑證](./request-signing.md)
