---
sidebar_position: 1
title: 考前速查與選型決策
---

# DVA-C03 考前速查與選型決策（開發者視角衝刺）

> 這一頁把 DVA-C03 四大領域最常考的**選型取捨**與**關鍵字 → 答案**濃縮成表格與決策清單，考前一小時從頭掃到尾正好。每一列都是「看到這種題幹，選哪個、為什麼」。看到不熟的，點回該篇補一下再回來掃。

:::note[💬 怎麼用這一頁]
先掃四大領域對照表，把「自己每次都猶豫的那幾格」圈出來重點記；最後的「關鍵字 → 選它」速記表與應試技巧，進考場前再看一眼。
:::

## D1 用 AWS 服務開發（30%）

這塊最重、也最吃「開發細節」。重點不是服務是什麼，而是**同類服務怎麼選**、**失敗了會不會自動重試**。

### Lambda 併發：Reserved vs Provisioned

| 類型 | 作用 | 會不會消冷啟動 | 什麼時候選 |
| --- | --- | --- | --- |
| **Reserved Concurrency（保留併發）** | 幫某函式**保留**一塊配額，同時也是它的**上限** | **不會** | 保護關鍵函式不被餓死，或**限制**某函式最多開幾個（下游資料庫撐不住） |
| **Provisioned Concurrency（預置併發）** | 預先初始化並**保持 N 個環境溫熱** | **會** | 要求**低延遲、無冷啟動**的可預測流量（面向使用者的 API） |

:::warning[🚑 最常見的坑]
「要消冷啟動」→ **Provisioned**；「要限制併發上限／保留配額」→ **Reserved**。兩個別混。Provisioned 會持續計費。
:::

### 三種呼叫模型的重試行為（高頻考點）

| 呼叫模型 | 代表來源 | 失敗重試行為 |
| --- | --- | --- |
| **同步（Sync）** | API Gateway、SDK `Invoke` | Lambda **不自動重試**，錯誤回給呼叫端，**由呼叫端**做重試＋指數退避 |
| **非同步（Async）** | S3、EventBridge、SNS | Lambda **自動重試 2 次**（共 3 次），全失敗後送 **DLQ／on-failure destination** |
| **事件來源映射（ESM）** | SQS、Kinesis、DynamoDB Streams | Lambda **主動輪詢**成批取；SQS 依 `maxReceiveCount` 進 DLQ；Kinesis／Streams **卡在壞那批**重試直到成功或過期 |

### 訊息／編排服務怎麼選

| 需求關鍵字 | 選它 | 為什麼 |
| --- | --- | --- |
| 「**一對多扇出**」一則訊息多個訂閱者同時收 | **SNS**（常配 **SNS + SQS** 扇出） | Pub/Sub 推播，多個 SQS 佇列各收一份、各自消化 |
| 「**解耦、緩衝、削峰、保證處理**」點對點 | **SQS** | 生產者丟進佇列，消費者按自己步調拉；失敗靠重新遞送＋DLQ |
| 「**依事件內容路由到不同目標**」「第三方 SaaS 事件」「排程 cron」 | **EventBridge** | 規則比對 + 多目標路由，內建 schema registry 與排程器 |
| 「**多步驟工作流程、需要狀態、重試、人工審核、等待**」 | **Step Functions** | 狀態機編排長流程；Standard 長流程、Express 高頻短流程 |

:::info[🔑 一句話區分]
**SQS = 緩衝佇列（拉）**；**SNS = 扇出通知（推）**；**EventBridge = 事件路由（比對規則）**；**Step Functions = 多步驟編排（有狀態）**。
:::

### DynamoDB：索引、讀取、容量、一致性

| 主題 | 對照 | 考點 |
| --- | --- | --- |
| **LSI vs GSI** | LSI 同分割鍵、換排序鍵，**只能建立時定**、共用主表容量、支援強一致；GSI 可**隨時加**、不同分割鍵、**獨立容量**、**只最終一致** | 「建立後才要加索引」→ 只能 **GSI**；「要在同分割鍵下換排序條件且要強一致」→ **LSI** |
| **Query vs Scan** | Query 指定分割鍵、精準高效；Scan 掃全表、昂貴 | 「效能差、吃光容量」→ 多半在用 **Scan**，改用 **Query／GSI** |
| **容量模式** | On-Demand 免預估、尖峰自動撐、按用量計費；Provisioned 可預估流量、較省、可配 Auto Scaling | 「流量難預測／突發」→ **On-Demand**；「穩定可預估要省錢」→ **Provisioned** |
| **一致性** | 預設**最終一致**（便宜、快）；強一致讀**費用加倍、延遲較高、不能用於 GSI** | 「剛寫完要立刻讀到最新」→ 強一致讀；「GSI 要強一致」→ **做不到** |

:::tip[💡 DynamoDB 速記]
看到 **`ProvisionedThroughputExceededException`／被節流** → 熱分割或容量不足：改 **On-Demand**、優化分割鍵分佈、或加 **DAX 快取**。看到「**原子計數、避免覆蓋別人的寫入**」→ **條件寫入（Conditional Write）＋ 樂觀鎖（version 屬性）**。
:::

### S3 上傳與授權

| 需求 | 選它 | 關鍵 |
| --- | --- | --- |
| 「**臨時給外部使用者上傳／下載 S3**，不想發 IAM」 | **Presigned URL** | 用你的憑證簽一個有**到期時間**的 URL；權限 = 簽發者的權限 |
| 「**大檔上傳**、網路不穩要能續傳、`>100 MB`」 | **Multipart Upload** | 切片平行上傳、個別重試；超過 5 GB **必須**用 multipart |
| 「上傳到一半的分片要清掉省錢」 | **生命週期規則**中止未完成的 multipart | 殘留分片會持續計費 |

## D2 安全（26%）

核心永遠是：**用角色、不用長期金鑰**；**分清誰是誰**（驗證 vs 授權）。

### 身分與授權

| 對照 | 選它／差異 | 考點 |
| --- | --- | --- |
| **IAM 角色 vs 長期存取金鑰** | 一律**用角色拿臨時憑證**（EC2/Lambda/ECS 都有角色）；長期 Access Key 盡量不用、絕不寫進程式碼 | 「程式碼裡有硬寫金鑰」「金鑰外洩」→ 改用**角色 + STS 臨時憑證** |
| **Cognito User Pool vs Identity Pool** | User Pool = **使用者目錄與登入**（註冊/登入/MFA，發 JWT）；Identity Pool = **拿 AWS 臨時憑證**去存取 AWS 資源 | 「要登入/註冊/社群登入」→ **User Pool**；「登入後要直接存取 S3/DynamoDB」→ **Identity Pool**（常兩個一起用） |

:::info[🔑 Cognito 一句話]
**User Pool 管「人怎麼登入」，Identity Pool 管「登入後能動哪些 AWS 資源」。**
:::

### 加密與祕密管理

| 主題 | 重點 | 考點 |
| --- | --- | --- |
| **KMS 信封加密** | 用資料金鑰（DEK）加密資料、再用 KMS 主金鑰（CMK）加密那把 DEK；**直接呼叫 KMS 加密上限 4 KB** | 「要加密大檔」→ **信封加密**（`GenerateDataKey`），別直接丟整包給 `Encrypt` |
| **Secrets Manager vs Parameter Store** | Secrets Manager：**自動輪替**、有費用、適合 DB 帳密/API 金鑰；Parameter Store：免費層、設定值/字串，SecureString 可用 KMS 加密 | 「需要**自動輪替**憑證」→ **Secrets Manager**；「只是存設定/不太變／要省錢」→ **Parameter Store** |

:::warning[🚑 KMS 4 KB 限制]
看到「要用 KMS 直接加密一個大物件」就警覺：`Encrypt` API 上限 **4 KB**。大資料一律**信封加密**——本地用 DEK 加密資料，只把 DEK 交給 KMS 保護。
:::

### 簽章與臨時授權

| 關鍵字 | 答案 |
| --- | --- |
| 「對 API 請求**簽章**、擋竄改」 | **SigV4**（SDK 自動做；手動呼叫才需自己簽） |
| 「給外部**有時效**的 S3 存取連結」 | **Presigned URL** |
| 「跨帳號／角色拿**臨時憑證**」 | **STS**（`AssumeRole`，拿到會到期的臨時金鑰組） |

## D3 測試與部署（22%）

考「哪個服務做哪件事」與「部署策略怎麼選」。

### CI/CD 分工

<div className="flow">
  <div className="flow-node">CodePipeline：總指揮（串接各階段的流水線）</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">CodeBuild：編譯＋測試（buildspec.yml）</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">CodeDeploy：把產物部署到目標（appspec.yml）</div>
</div>

| 服務 | 負責 | 記憶點 |
| --- | --- | --- |
| **CodePipeline** | 編排整條流水線的各階段（來源→建置→部署） | 「要串起整個 CI/CD 流程」 |
| **CodeBuild** | 跑建置與測試，吃 **`buildspec.yml`** | 「編譯、單元測試、打包」 |
| **CodeDeploy** | 部署到 EC2/Lambda/ECS，吃 **`appspec.yml`**，可做藍綠/金絲雀 | 「做部署與部署策略」 |

### IaC 三選一：CloudFormation vs SAM vs CDK

| 工具 | 是什麼 | 什麼時候選 |
| --- | --- | --- |
| **CloudFormation** | 原生 IaC，寫 YAML/JSON 範本 | 通用基礎設施、團隊用宣告式範本 |
| **SAM** | CloudFormation 的**無伺服器簡寫**，少量語法展開成完整 CFN；`sam local` 可本機測 Lambda | 「**無伺服器**應用、要本機測試 Lambda/API」 |
| **CDK** | 用**程式語言**（TS/Python…）寫，合成成 CloudFormation | 「想用迴圈/條件/物件抽象、工程師用熟悉語言寫基礎設施」 |

:::info[🔑 一句話]
SAM = 無伺服器專用的 CFN 簡寫；CDK = 用程式語言產出 CFN。兩者底層最後都是 **CloudFormation 堆疊**。
:::

### 部署策略怎麼選

| 策略 | 做法 | 優點 | 代價 | 關鍵字 |
| --- | --- | --- | --- | --- |
| **就地（In-place / All-at-once）** | 直接換掉現有環境 | 最快、最省 | **會停機**、回復慢 | 「最便宜、測試環境、能接受停機」 |
| **滾動（Rolling）** | 一批一批換 | 不用加倍資源 | 新舊版**並存**一段時間、回復較慢 | 「逐批更新、省資源」 |
| **金絲雀（Canary）** | 先導少量流量到新版，觀察再全放 | 風險小、早發現問題 | 切換較久 | 「先放 10% 觀察再全量」 |
| **藍綠（Blue/Green）** | 另起一套新環境，一次切換、留舊的可秒回 | **零停機、可快速回復** | **資源加倍**、較貴 | 「零停機且要能快速回復」 |

:::tip[💡 部署策略速記]
「**零停機 + 可快速回復**」→ **藍綠**；「**先放一點點觀察**」→ **金絲雀**；「**最省、可停機**」→ **就地**。
:::

### 容器與執行角色

| 對照 | 差異 | 考點 |
| --- | --- | --- |
| **Fargate vs EC2 啟動類型** | Fargate 免管機器（無伺服器容器）；EC2 自己管節點、較省且可控 | 「不想管底層主機/節點」→ **Fargate**；「要控制主機、長穩流量省錢」→ **EC2** |
| **任務角色 vs 執行角色（ECS）** | **任務角色（Task Role）**＝容器內**應用程式**存取 AWS 資源的權限；**任務執行角色（Task Execution Role）**＝**ECS 代理**拉 ECR 映像、寫 CloudWatch Logs 的權限 | 「容器裡的程式讀不到 S3/DynamoDB」→ **任務角色**；「拉不到 ECR 映像/沒日誌」→ **任務執行角色** |
| **ECR** | 私有容器映像倉庫 | 推映像前要先 `aws ecr get-login-password` 登入 |

## D4 疑難排解與最佳化（22%）

考「出問題先看哪個工具」與「錯誤碼先查什麼」。

### 三大觀測性工具分工

| 工具 | 看什麼 | 一句話 |
| --- | --- | --- |
| **CloudWatch** | **指標、日誌、告警**（Logs/Metrics/Alarms/Dashboards） | 「監控數值、看日誌、設告警」 |
| **CloudTrail** | **誰在何時呼叫了哪個 API**（稽核/合規） | 「是誰做了這個操作、資源何時被改」 |
| **X-Ray** | **分散式追蹤**：請求跨服務的路徑與每段耗時 | 「跨服務追蹤、找出慢在哪一段」 |

### X-Ray：annotation vs metadata

| 項目 | 可否被索引／查詢 | 用途 |
| --- | --- | --- |
| **Annotation** | **可**（建索引，可用於過濾/搜尋 trace） | 放少量關鍵維度（如 `userId`、`orderType`）供篩選 |
| **Metadata** | **不可**查詢 | 放附加的除錯上下文（較大、不索引） |

:::info[🔑 一句話]
要**能用來過濾/搜尋 trace** → **Annotation**；只是**附帶的除錯資訊** → **Metadata**。
:::

### 彈性與正確性三件套

| 機制 | 解決什麼 | 關鍵字 |
| --- | --- | --- |
| **指數退避 + 抖動（Backoff + Jitter）** | 被節流/暫時失敗時的重試策略，避免同時重試打垮服務 | 「遇到 429/5xx 要重試」 |
| **冪等（Idempotency）** | 同事件被處理多次也不重複副作用（重試安全） | 「訊息可能重複投遞／重試」 |
| **DLQ（死信佇列）** | 處理不掉的訊息/事件移到旁邊保留、不卡住主流程 | 「失敗訊息要保留、不要遺失」 |

### 常見錯誤碼先查什麼

| 錯誤碼 | 意思 | 先查什麼 |
| --- | --- | --- |
| **403 Forbidden / AccessDenied** | 權限不足 | IAM 政策、角色、資源政策、KMS 金鑰政策、`Bucket Policy` |
| **429 TooManyRequests / ThrottlingException** | 被節流 | 加**指數退避＋抖動**重試；提高配額/併發；DynamoDB 改 On-Demand |
| **5xx（500/502/503）** | 服務端或下游錯誤 | 下游服務、Lambda 例外/逾時、重試＋退避 |
| **逾時（Timeout）** | 處理太久被砍 | Lambda 15 分鐘上限、下游慢、網路/VPC 設定、API Gateway 29 秒上限 |

:::tip[💡 錯誤碼速記]
**4xx 是你（用戶端）的問題**（權限、節流、請求格式）→ 多半**不要盲目重試**，先修請求或退避；**5xx 是對方的問題**→ **可重試＋指數退避**。
:::

### Lambda 效能調校與快取層選擇

| 情境 | 做法 |
| --- | --- |
| Lambda 冷啟動慢、要低延遲 | **Provisioned Concurrency**；重物（連線/SDK client）搬到 handler 外層；減肥部署套件 |
| Lambda 慢但沒吃滿 CPU | **調大記憶體**（CPU 與記憶體連動），常常更快又更省 |
| DynamoDB 熱讀、微秒級延遲 | **DAX**（DynamoDB 專用快取） |
| 通用資料庫/查詢結果快取、Session | **ElastiCache**（Redis/Memcached） |
| 靜態內容/API 回應全球加速 | **CloudFront**（邊緣快取） |

## 關鍵字 → 選它（進場前最後一掃）

| 看到題幹講… | 直接選 |
| --- | --- |
| 一對多**扇出**、一則訊息多訂閱者 | **SNS**（＋SQS 扇出） |
| 解耦、緩衝、削峰、保證處理 | **SQS** |
| 依事件內容**路由**、SaaS 事件、排程 | **EventBridge** |
| 多步驟工作流、要狀態/重試/等待/人工審核 | **Step Functions** |
| 臨時給外部存取 S3、有時效 | **Presigned URL** |
| 大檔上傳、要續傳、`>5 GB` | **Multipart Upload** |
| 消除冷啟動、低延遲可預測流量 | **Provisioned Concurrency** |
| 限制某函式併發上限／保留配額 | **Reserved Concurrency** |
| 建立後才要新增索引、可用不同分割鍵 | **GSI** |
| 剛寫完要立刻讀到最新 | **強一致讀**（GSI 做不到） |
| 流量難預測/突發、不想預估容量 | **On-Demand 容量模式** |
| 需要自動輪替的 DB 憑證/API 金鑰 | **Secrets Manager** |
| 只存設定值、要省錢 | **Parameter Store** |
| 加密大於 4 KB 的資料 | **KMS 信封加密** |
| 要登入/註冊/社群登入 | **Cognito User Pool** |
| 登入後要直接存取 AWS 資源 | **Cognito Identity Pool** |
| 跨帳號/角色拿臨時憑證 | **STS AssumeRole** |
| 無伺服器應用 IaC、要本機測 | **SAM** |
| 用程式語言寫基礎設施 | **CDK** |
| 零停機部署且可快速回復 | **藍綠部署** |
| 先放少量流量觀察再全量 | **金絲雀部署** |
| 不想管容器底層主機 | **Fargate** |
| 容器內程式存取 AWS 資源的權限 | **任務角色（Task Role）** |
| 拉不到 ECR 映像/沒日誌 | **任務執行角色** |
| 跨服務追蹤、慢在哪一段 | **X-Ray** |
| 要能過濾/搜尋 trace 的標籤 | **X-Ray Annotation** |
| 誰在何時呼叫了哪個 API（稽核） | **CloudTrail** |
| 看指標/日誌/設告警 | **CloudWatch** |
| 被節流（429）要重試 | **指數退避 + 抖動** |
| 訊息可能重複投遞 | **設計成冪等** |
| 失敗訊息要保留不遺失 | **DLQ** |
| DynamoDB 熱讀要微秒級延遲 | **DAX** |

:::tip[💡 應試技巧]
- **先讀最後一句問句**（要你選什麼、是不是複選），再回頭讀題幹，避免被情境帶偏。
- 抓**限定詞**：「最具成本效益」「最少維運」「零停機」「即時/最低延遲」「符合最少權限」——這些決定正解。
- 「**無伺服器／最少維運**」通常導向受管/無伺服器服務（Lambda、Fargate、DynamoDB On-Demand、SQS/SNS）。
- 「程式碼裡有硬寫金鑰」幾乎都是錯的——答案往往是**角色 + 臨時憑證**。
- **4xx 修請求、5xx 可重試**；被節流一律想到**指數退避 + 抖動**。
- 兩個選項都「做得到」時，挑**更符合限定詞**（更省、更少維運、更低延遲）的那個。
:::

## 下一步

👉 接著實戰：[DVA 綜合模擬考（65 題）](./mock-exam.md)
