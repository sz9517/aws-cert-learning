---
sidebar_position: 1
title: AWS Lambda（無伺服器運算）
---

# AWS Lambda：把一段程式碼丟上去，有事件才跑、按毫秒計費

> 本篇用「開發者視角」帶你搞懂 Lambda：handler／event／context 怎麼寫、冷啟動是什麼、記憶體怎麼連動 CPU、版本與別名怎麼做流量切換、併發與節流、各種觸發來源、權限、以及同步／非同步／事件來源映射的錯誤重試行為。這些正是 DVA-C03 Domain 1 最常考的開發細節，比 SAA 問得更深。

<Vocab title="📌 先認識這篇會出現的名詞（完全沒碰過也能懂）">

- **無伺服器（Serverless）**：不是真的沒有伺服器，而是「**伺服器由 AWS 幫你顧**」——你只管寫程式、丟上去跑，不用開機、不用修補、不用手動擴充。
- **函式（Function）**：你丟上 Lambda 的一段程式碼，連同它的設定（記憶體、逾時、環境變數）打包在一起，就是一個 Lambda 函式。
- **事件（Event）**：觸發函式執行的那包資料。例如「有人上傳檔案到 S3」會變成一個 JSON 事件丟給你的函式。
- **處理常式（Handler）**：函式的「進入點」——AWS 收到事件後，就是呼叫這個方法，把事件交給你處理。
- **執行環境（Execution Environment）**：AWS 為了跑你的函式而準備的一個小型安全沙箱，裡面裝好執行階段與你的程式碼。它會被**重複利用**，這是理解冷啟動的關鍵。
- **併發（Concurrency）**：同一瞬間有幾個函式執行個體在跑。一次湧進 100 個事件，就可能同時有 100 個執行個體在跑。

</Vocab>

:::note[💬 閱讀小提示]
文章裡只要看到帶<Term desc="像這樣！滑鼠移到有虛線的名詞上（手機點一下），就會跳出白話解釋。">虛線底線的名詞</Term>，把滑鼠移上去就會跳出白話解釋。所有名詞也都整理在 [名詞與服務對照表](/glossary)。
:::

## 為什麼需要 Lambda？先講一個「自己顧伺服器很累」的例子

假設你要做一個「使用者上傳圖片就自動產生縮圖」的功能。流量很不固定：有時一小時幾張、有時突然湧進上千張。

如果你開一台 <Term en="Elastic Compute Cloud" desc="AWS 的虛擬伺服器，你租一整台機器，開著就計費。">EC2</Term> 整天開著等，沒人上傳時這台機器**空轉燒錢**；真的湧進上千張時，一台又**扛不住**。而且作業系統更新、安全修補、容量規劃全得你自己顧。

用 <Term en="AWS Lambda" desc="無伺服器運算服務，有事件才執行你的程式碼，按實際執行時間與記憶體計費，沒事就不收錢。">Lambda</Term> 幾乎完美：有圖片上傳才跑、沒事就不收錢、瞬間自動擴充到上千個執行個體，而且你**完全不用碰伺服器**——只需要寫一個函式。對開發者來說，重點從「怎麼養機器」變成「怎麼寫好這段程式碼」。

## 一句話先懂 Lambda 的運作

你寫一個**函式**（handler），設定好記憶體、逾時、環境變數後部署上去。之後只要有**事件**發生（S3 上傳、API 請求、訊息進佇列…），AWS 就會幫你開一個**執行環境**、呼叫你的 handler、把事件丟給你。你的程式跑完回傳結果，AWS 按**實際執行的毫秒數 × 記憶體**收費。

<Analogy title="🏢 生活比喻：Lambda 就像叫外送廚房的廚師">

- **你的函式 = 一位廚師的食譜**：你只交出食譜（程式碼）與需要多大的廚房（記憶體），不用自己蓋廚房。
- **事件 = 一張訂單**：有訂單進來（事件），平台才叫一位廚師開工做菜；沒訂單時完全不花錢。
- **併發 = 同時開工的廚師人數**：一次湧進 100 張訂單，平台就同時叫 100 位廚師（100 個執行環境）各做一份。
- **冷啟動 = 廚師要先熱鍋**：很久沒訂單時，第一位廚師得先進廚房、熱鍋、擺好食材（啟動執行環境 + 載入程式碼），所以**第一份菜會慢一點**；接下來同一位廚師接著做就快了。

</Analogy>

## 核心一：handler、event、context

每個 Lambda 函式都有一個**處理常式（handler）**，它是 AWS 呼叫你程式的進入點。handler 會收到兩個參數：

- **event**：觸發這次執行的資料（一包 JSON）。內容依觸發來源而異——來自 API Gateway 是 HTTP 請求、來自 S3 是物件資訊、來自 SQS 是一批訊息。
- **context**：本次執行的「執行階段資訊」，例如還剩多少逾時時間（`getRemainingTimeInMillis()`）、本次請求 ID（`awsRequestId`）、函式名稱與記憶體上限等。

```js
// Node.js 範例：index.handler
exports.handler = async (event, context) => {
  console.log('收到事件：', JSON.stringify(event));
  console.log('剩餘時間（毫秒）：', context.getRemainingTimeInMillis());

  // 你的商業邏輯
  const result = doSomething(event);

  // async handler：回傳值就是回應；拋出例外則視為失敗
  return {
    statusCode: 200,
    body: JSON.stringify(result),
  };
};
```

:::info[🔑 handler 的命名規則]
部署時你要告訴 Lambda handler 在哪，格式是 **「檔名.匯出的方法名」**。例如檔案 `index.js` 裡 `exports.handler`，就設定成 `index.handler`。Python 則是 `檔名.函式名`（如 `lambda_function.lambda_handler`）。設錯會出現 `Unable to import module` 或 `Handler not found` 錯誤。
:::

## 核心二：執行環境生命週期與冷啟動

理解效能與計費，關鍵在執行環境怎麼被重複利用。一次執行分三階段：

1. **Init（初始化）**：AWS 建立執行環境、下載你的程式碼、載入執行階段、跑 **handler 外層**的初始化程式碼（例如建立資料庫連線、讀取設定）。
2. **Invoke（呼叫）**：執行你的 **handler 本體**，處理這次事件。
3. **Shutdown（關閉）**：閒置一段時間後，AWS 回收這個執行環境。

當沒有可重複利用的執行環境時（例如很久沒被呼叫、或併發突然暴增需要更多執行個體），就必須走一次完整的 Init，這段額外延遲就是<Term en="Cold Start" desc="Lambda 沒有可重複利用的執行環境時，第一次呼叫需額外建立環境、載入程式碼，造成首次回應較慢。">冷啟動</Term>。之後同一個環境再被呼叫就跳過 Init，叫做**熱啟動**，速度快很多。

```js
// ✅ 把「建立連線、讀設定」放在 handler 外層（Init 階段）
// 這些只在冷啟動跑一次，熱啟動時會被重複利用，省時間
const db = createDbConnection(process.env.DB_URL);

exports.handler = async (event) => {
  // handler 內只放「每次都要做」的邏輯
  return db.query(event.id);
};
```

:::tip[💡 考試重點：怎麼緩解冷啟動]
- **Provisioned Concurrency（預置併發）**：預先初始化並保持指定數量的執行環境「隨時待命」，呼叫進來直接是熱的——**要求低延遲、可預測流量**（如面向使用者的 API）時最常考這招。
- **把重物搬到 handler 外層**：連線、SDK client、設定只在 Init 建立一次。
- **選對執行階段與減肥部署套件**：套件越小、相依越少，Init 越快。
- 注意：**Reserved Concurrency 不會**減少冷啟動，它只是「保留配額」；真正讓環境保持溫熱的是 **Provisioned Concurrency**。別混淆這兩個。
:::

## 核心三：記憶體、CPU、逾時、環境變數、/tmp、部署限制、Layers

這一段全是 DVA 愛考的「設定細節」：

| 設定項 | 說明與考點 |
| --- | --- |
| **記憶體（Memory）** | 128 MB ～ 10,240 MB。**CPU 與記憶體連動**：給越多記憶體，自動分到越多 vCPU。CPU 密集的函式常常「加記憶體反而更快又更省」。 |
| **逾時（Timeout）** | 單次最長 **15 分鐘**（900 秒）。超過就被強制中止。長跑工作不適合 Lambda。 |
| **環境變數（Environment Variables）** | 把設定（如資料表名、API endpoint）用<Term en="Environment Variables" desc="在函式設定裡注入的鍵值設定，程式用 process.env / os.environ 讀取，不必寫死在程式碼。">環境變數</Term>注入，程式用 `process.env.X`（Node）或 `os.environ['X']`（Python）讀取。可用 KMS 加密敏感值。 |
| **/tmp 暫存空間** | 每個執行環境有 `/tmp` 可寫，預設 512 MB、最大可設到 **10,240 MB**。注意它會隨執行環境被**重複利用**，別把它當乾淨空間。 |
| **部署套件大小** | 直接上傳的 zip：**50 MB**（壓縮）；解壓後含 Layers 上限 **250 MB**。超過就改用**容器映像（最大 10 GB）**部署。 |
| **Lambda Layers** | 把共用的相依套件／函式庫抽成<Term en="Lambda Layers" desc="可被多個函式共用的程式庫/相依打包，讓函式部署套件更小、相依集中管理。">Layer</Term>，多個函式共用，讓每個函式的部署套件更小、相依集中管理。一個函式最多疊 **5 層**。 |

:::warning[🚑 記憶體不是只影響記憶體]
很多人以為「我的函式不吃記憶體，給 128 MB 就好」，結果函式跑超慢。原因是**記憶體越低、分到的 CPU 也越少**。對 CPU 密集工作，把記憶體從 128 MB 調到 1024 MB 常常執行時間砍到 1/5，算下來帳單反而更低。可用 **AWS Lambda Power Tuning** 工具找最佳點。
:::

## 核心四：版本與別名（versions / aliases、$LATEST）

你每次改程式按部署，改的都是可變動的 **`$LATEST`** 版本。但正式環境不能指著會一直變的 `$LATEST`，所以要用**版本**與**別名**：

- **版本（Version）**：對當下的程式碼與設定拍一張**不可變的快照**，給一個數字（1、2、3…）。發佈後就凍結，永遠不會變。
- **別名（Alias）**：一個會「指向某個版本」的**可移動指標**，例如 `prod` → 版本 3、`dev` → `$LATEST`。呼叫端只認別名，你在背後換版本即可。

<Analogy title="🏢 生活比喻：版本是存檔，別名是書籤">

- **$LATEST = 正在編輯的草稿**：你一直在改它。
- **版本 = 存檔點**：按下「發佈」就存一個永不變的檔（版本 1、2、3…）。
- **別名 = 貼在某個存檔上的書籤**：`prod` 書籤現在貼在版本 3；要上新版就把書籤撕下來改貼版本 4，使用者感覺不到切換的細節。

</Analogy>

**用別名做流量切換（金絲雀／藍綠）**：別名可以同時指向**兩個版本**並設定權重，例如 `prod` 把 **10%** 流量導到版本 4、**90%** 留在版本 3，觀察沒問題再慢慢加到 100%。

```bash
# 發佈一個新版本（對 $LATEST 拍快照）
aws lambda publish-version --function-name my-func

# 建立/更新 prod 別名指向版本 3
aws lambda create-alias \
  --function-name my-func \
  --name prod \
  --function-version 3

# 加權流量切換：90% 版本 3、10% 版本 4（金絲雀）
aws lambda update-alias \
  --function-name my-func \
  --name prod \
  --function-version 3 \
  --routing-config AdditionalVersionWeights={"4"=0.1}
```

## 核心五：併發與節流

<Term en="Concurrency" desc="同一瞬間正在執行的 Lambda 執行個體數。一次湧進很多事件就會同時開很多執行個體。">併發</Term> 是指「同一瞬間正在跑的函式執行個體數」。每個帳號在每個區域有一個**併發上限**（預設常見為 1,000，可申請提高）。兩種併發設定要分清楚：

| 類型 | 作用 | 什麼時候用 |
| --- | --- | --- |
| **Reserved Concurrency（保留併發）** | 幫某個函式**保留**一塊配額，同時也是它的**上限**。保證它有得用，也防止它吃光整個帳號的配額影響別的函式。 | 要保護某函式不被餓死、或要**限制**某函式最多開幾個（如下游資料庫撐不住） |
| **Provisioned Concurrency（預置併發）** | 預先初始化並**保持 N 個環境溫熱**，呼叫直接命中熱環境。 | 要求**低延遲、無冷啟動**的可預測流量 |

當同時進來的事件超過可用併發時，就會<Term en="Throttling" desc="併發超過上限時 Lambda 暫時拒絕或排隊請求的保護機制。">節流（Throttling）</Term>。同步呼叫被節流時，呼叫端會收到 **HTTP 429 `TooManyRequestsException`**；非同步與事件來源映射則會自動重試。

:::tip[💡 考試重點：429 怎麼處理]
- 看到 **「`429 TooManyRequests`／`TooManyRequestsException`」** → 併發被節流，解法是**提高併發上限**或**為關鍵函式設定 Reserved Concurrency**。
- 同步呼叫端（如 SDK 直接 `Invoke`）遇到節流要自己做**重試 + 指數退避（exponential backoff）**。
- 要「保證低延遲、沒有冷啟動」→ **Provisioned Concurrency**；要「限制某函式最多併發數／保留配額」→ **Reserved Concurrency**。
:::

## 核心六：觸發來源（誰來呼叫你的函式）

<div className="flow">
  <div className="flow-node">API Gateway（HTTP 請求 → 同步）</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">S3 事件（上傳/刪除 → 非同步）</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">SQS 佇列（事件來源映射 → Lambda 主動拉）</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">EventBridge（排程/規則 → 非同步）</div>
</div>

- **API Gateway**：把 HTTP 請求轉成事件、**同步**呼叫 Lambda，等它回傳再回給使用者。這是「無伺服器 API」的經典組合。
- **S3**：物件被建立／刪除時發事件，**非同步**呼叫 Lambda（如上傳圖片自動產縮圖）。
- **SQS**：屬於**事件來源映射**——Lambda 服務**主動輪詢**佇列、成批把訊息拉來呼叫你的函式（詳見下一段）。
- **EventBridge**：排程（像 cron）或依規則比對事件後**非同步**觸發，常用於定時任務與事件路由。

## 核心七：權限——執行角色 vs 資源政策

Lambda 的權限分兩個方向，DVA 很愛考你分得清不清：

- **執行角色（Execution Role）**：函式**自己**用的 IAM 角色，決定「**這個函式能去動哪些 AWS 資源**」（例如讀某個 S3 貯體、寫 DynamoDB、送 CloudWatch 日誌）。這是**函式向外**的權限。
- **資源政策（Resource-based Policy）**：掛在函式上的政策，決定「**誰可以呼叫這個函式**」（例如允許某個 S3 貯體、某個 API Gateway 來觸發它）。這是**別人向內**呼叫的權限。

<Analogy title="🏢 生活比喻：員工識別證 vs 門禁名單">

- **執行角色 = 員工識別證**：決定這位員工（函式）自己能進公司裡哪些房間（S3、DynamoDB）。
- **資源政策 = 這間辦公室門口的訪客名單**：決定外面哪些人（S3、API Gateway）獲准進來找你辦事（呼叫你）。

</Analogy>

:::info[🔑 一個最常見的坑]
「我的函式讀不到 S3」通常是**執行角色**少了權限；「S3 事件沒觸發我的函式」通常是**資源政策**沒允許 S3 來呼叫。方向搞反就一直除不完錯。用主控台加觸發器時，AWS 常會自動幫你補對應的資源政策；用 CLI/IaC 要自己 `add-permission`。
:::

## 核心八：錯誤處理與重試（同步 vs 非同步 vs 事件來源映射）

這是 DVA 的高頻考點，三種呼叫模型的重試行為完全不同：

| 呼叫模型 | 代表來源 | 失敗時的重試行為 |
| --- | --- | --- |
| **同步（Synchronous）** | API Gateway、SDK `Invoke` | **Lambda 不自動重試**。錯誤直接回給呼叫端，**由呼叫端自己決定要不要重試**（含指數退避）。 |
| **非同步（Asynchronous）** | S3、EventBridge、SNS | Lambda **自動重試 2 次**（共 3 次嘗試），間隔逐漸拉長。全部失敗後，可送到 **DLQ（死信佇列）** 或 **On-failure 目的地** 保留失敗事件。 |
| **事件來源映射（Event Source Mapping）** | SQS、Kinesis、DynamoDB Streams | Lambda **主動輪詢**來源成批取事件。SQS 批次失敗會依佇列設定重試，超過次數進 SQS 的 DLQ；Kinesis／DynamoDB Streams 會**卡在失敗的那批**重試直到成功或過期（可設定分批重試、bisect 來隔離壞訊息）。 |

:::tip[💡 考試重點：重試關鍵字速記]
- 題目講 **「S3 事件觸發失敗怎麼不丟訊息」「非同步呼叫失敗要保留事件」** → 設 **DLQ 或 on-failure destination**（非同步自動重試 2 次後才進 DLQ）。
- 題目講 **「API Gateway → Lambda 偶發失敗要重試」** → 同步呼叫 Lambda **不會**自動重試，要在**呼叫端**做重試 + 指數退避。
- 題目講 **「SQS 訊息處理失敗」** → 事件來源映射，靠 **SQS 本身的重新遞送與 DLQ**（`maxReceiveCount`）處理。
- 設計函式時要做到<Term en="Idempotency" desc="同一事件被處理多次也不會造成重複的副作用，重試安全。">冪等（Idempotency）</Term>，因為重試可能讓同一事件被處理多次。
:::

## 實務應用：不只是考試

<Scenario title="真實情境：用別名把新版本慢慢放量，別一次全切">

你的訂單處理 Lambda 掛在 API Gateway 後面，正式流量很大。老闆要上一個改過金流邏輯的新版，但你怕一上就全炸。做法：把 API Gateway 指向 **`prod` 別名**（而不是某個固定版本），先 `publish-version` 發佈新版本 4，再用 `update-alias` 把 `prod` 設成「90% 版本 3、10% 版本 4」。盯著 CloudWatch 的錯誤率十分鐘沒問題，再逐步把版本 4 的權重拉到 100%。整個過程呼叫端的 API 位址完全沒變。

</Scenario>

### 🛠️ 動手做：建立函式 → 發佈版本 → 設別名

```bash
# 1) 從 zip 建立函式（指定執行角色與 handler）
aws lambda create-function \
  --function-name order-processor \
  --runtime nodejs20.x \
  --role arn:aws:iam::111122223333:role/lambda-exec-role \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --memory-size 512 \
  --timeout 30 \
  --environment "Variables={TABLE_NAME=orders}"

# 2) 改完程式重新部署程式碼到 $LATEST
aws lambda update-function-code \
  --function-name order-processor \
  --zip-file fileb://function.zip

# 3) 發佈成不可變的版本（拍快照）
aws lambda publish-version --function-name order-processor

# 4) 建立 prod 別名指向版本 1
aws lambda create-alias \
  --function-name order-processor \
  --name prod \
  --function-version 1

# 5) 允許 API Gateway 呼叫這個別名（資源政策）
aws lambda add-permission \
  --function-name order-processor:prod \
  --statement-id apigw-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com
```

<Cost>

**Lambda 有每月免費額度**（100 萬次請求 ＋ 40 萬 GB-秒），零碎工作常常根本不用錢。收費看**請求次數 × 執行毫秒數 × 記憶體**，所以「記憶體調大讓它跑更快」有時反而更便宜。但要注意 **Provisioned Concurrency 會持續計費**（為了保持環境溫熱），只在真的需要低延遲時才開，別整天掛著。練習完記得把測試用的函式與觸發的資源清一清。

</Cost>

:::warning[🚑 實務常見錯誤]
- **把重物放在 handler 裡**：資料庫連線、SDK client 應放 handler 外層（Init 階段），放裡面會每次呼叫都重建、又慢又浪費。
- **正式環境直接指 `$LATEST`**：它會一直變，等於沒有版本控制。正式一律指**別名**。
- **以為 Reserved Concurrency 能消冷啟動**：那是 **Provisioned** 的事；Reserved 只是配額上下限。
- **同步呼叫以為 Lambda 會自動重試**：同步**不會**，重試要呼叫端自己做。
- **逾時設太短或太長**：太短正常工作被砍斷，太長出錯時白白燒錢（最長 15 分鐘）。
- **把長跑工作硬塞 Lambda**：超過 15 分鐘必失敗，改用容器或 Step Functions 拆步驟。
- **環境變數塞明文密碼**：敏感值用 KMS 加密，或改用 Secrets Manager／Parameter Store。
:::

<Refs>

- [AWS Lambda 開發人員指南](https://docs.aws.amazon.com/lambda/latest/dg/welcome.html)
- [Lambda 函式版本與別名](https://docs.aws.amazon.com/lambda/latest/dg/configuration-versions.html)
- [Lambda 併發（Reserved / Provisioned Concurrency）](https://docs.aws.amazon.com/lambda/latest/dg/lambda-concurrency.html)
- [Lambda 執行環境生命週期與冷啟動](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtime-environment.html)
- [Lambda 錯誤處理與自動重試](https://docs.aws.amazon.com/lambda/latest/dg/invocation-retries.html)

</Refs>

## 下一步

👉 下一篇：[API Gateway 建立 API](./api-gateway.md)
