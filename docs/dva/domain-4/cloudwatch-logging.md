---
sidebar_position: 1
title: CloudWatch 監控與日誌
---

# CloudWatch 監控與日誌：出事了，你要有辦法知道、而且查得到

> 本篇用「開發者視角」帶你搞懂 CloudWatch：日誌群組／串流怎麼來、Lambda 怎麼自動送日誌、Logs Insights 怎麼查、內建指標 vs 自訂指標、維度與 EMF 嵌入式指標格式、告警門檻怎麼設搭 SNS、以及 Dashboards。順便把 DVA 最愛考的「CloudWatch vs CloudTrail vs X-Ray 各看什麼、何時用哪個」一次講清楚。這是 DVA-C03 Domain 4（疑難排解與最佳化）的核心。

<Vocab title="📌 先認識這篇會出現的名詞（完全沒碰過也能懂）">

- **可觀測性（Observability）**：系統對外「吐出足夠訊號」讓你能從外面推斷裡面發生什麼事的能力。三大支柱是**日誌（Logs）、指標（Metrics）、追蹤（Traces）**。
- **日誌（Logs）**：程式跑的時候一行一行印出來的文字記錄，例如 `console.log`、`print`。CloudWatch 幫你集中收好。
- **指標（Metric）**：隨時間變化的一串數字，例如「每分鐘的錯誤數」「平均延遲」。可以畫成折線圖、設告警。
- **維度（Dimension）**：幫指標貼的標籤（鍵值對），例如 `FunctionName=order-processor`。同一個指標用不同維度切開看。
- **告警（Alarm）**：盯著某個指標，超過你設的門檻就觸發動作（發通知、擴充、執行 Lambda）。
- **EMF（Embedded Metric Format，嵌入式指標格式）**：一種特別格式的 JSON 日誌，你照格式印出來，CloudWatch 讀到就**自動幫你抽出成指標**，不用另外呼叫 API。

</Vocab>

:::note[💬 閱讀小提示]
文章裡只要看到帶<Term desc="像這樣！滑鼠移到有虛線的名詞上（手機點一下），就會跳出白話解釋。">虛線底線的名詞</Term>，把滑鼠移上去就會跳出白話解釋。所有名詞也都整理在 [名詞與服務對照表](/glossary)。
:::

## 為什麼需要可觀測性？先講一個「半夜被叫起來查不到原因」的惡夢

假設你的訂單處理 Lambda 掛在 API Gateway 後面。半夜有使用者回報「結帳按下去轉圈圈，最後失敗」。你打開程式碼看，一切都很正常。問題是：**你根本不知道剛剛那次請求到底發生什麼事**——是 Lambda 逾時？是權限被拒？是下游 DynamoDB 節流？還是根本沒被觸發？

沒有可觀測性，你只能瞎猜、重現、再瞎猜。有了可觀測性，你能直接回答三個問題：

1. **出事了我怎麼知道？** → 靠**指標 + 告警**：錯誤率一飆高，CloudWatch 立刻發簡訊／Slack 通知你，不用等使用者抱怨。
2. **是什麼東西壞了？** → 靠**日誌**：翻那次請求的 log，看到 `AccessDenied: dynamodb:PutItem`，一眼就知道是執行角色少權限。
3. **慢在哪一段？** → 靠**追蹤（X-Ray）**：一條請求跨了 API Gateway → Lambda → DynamoDB，看出是 DynamoDB 那一段吃掉 800ms。

<Term en="Amazon CloudWatch" desc="AWS 的監控與可觀測性服務，集中收日誌、指標、告警與儀表板，是你排錯與最佳化的第一站。">CloudWatch</Term> 就是 AWS 幫你把**日誌、指標、告警、儀表板**集中在一處的服務。對開發者來說，它是**你出事後第一個會打開的地方**。

<Analogy title="🏢 生活比喻：CloudWatch 就像大樓的中控室">

- **日誌 = 每個房間的監視器錄影**：事後要查「那一刻發生什麼」，調錄影帶一格一格看。
- **指標 = 牆上那排即時儀表**：溫度、人流、用電量的即時數字，一眼看出趨勢。
- **告警 = 警報器**：某個儀表超過安全值（如煙霧濃度），警報大響、自動通知保全。
- **儀表板 = 中控室那面大螢幕牆**：把最重要的儀表集中擺一起，值班的人掃一眼就知道大樓健不健康。

</Analogy>

## Logs：日誌群組、日誌串流、Lambda 自動送日誌

CloudWatch Logs 的層級由大到小：

- **日誌群組（Log Group）**：同一個應用／服務的日誌集合。例如 Lambda `order-processor` 的所有日誌都在 `/aws/lambda/order-processor` 這個群組裡。保留期、權限、加密都設在群組層級。
- **日誌串流（Log Stream）**：群組裡的一條條來源。例如 Lambda 每一個執行環境會對應一條串流。
- **日誌事件（Log Event）**：串流裡實際一行一行帶時間戳記的記錄。

**Lambda 會自動送日誌**：只要你的 Lambda 執行角色有 CloudWatch Logs 權限（`logs:CreateLogGroup`、`logs:CreateLogStream`、`logs:PutLogEvents`，通常由受管政策 `AWSLambdaBasicExecutionRole` 給），你在函式裡 `console.log` / `print` 印的東西就會**自動**進到 `/aws/lambda/<函式名>` 群組，你完全不用自己呼叫 API 送。

```js
// Node.js：這些 console.log 會自動進 CloudWatch Logs
exports.handler = async (event, context) => {
  console.log('請求 ID：', context.awsRequestId); // 用來串起同一次請求的所有 log
  console.log('收到事件：', JSON.stringify(event));
  // ...商業邏輯...
};
```

:::info[🔑 結構化日誌比純文字好查]
印日誌盡量印**結構化 JSON**（`console.log(JSON.stringify({ level: 'error', orderId, msg }))`），而不是把一堆資訊黏成一行字串。因為 Logs Insights 能直接用欄位名查詢 JSON 欄位（`filter orderId = "A123"`），純文字只能靠關鍵字硬撈，又慢又不準。
:::

### Logs Insights：用查詢語法翻日誌

一堆 log 用肉眼翻很痛苦。<Term en="CloudWatch Logs Insights" desc="對 CloudWatch 日誌下類 SQL 查詢語法的互動式查詢工具，可過濾、彙總、排序，排錯利器。">CloudWatch Logs Insights</Term> 讓你對日誌群組下一段類 SQL 的查詢，快速過濾、彙總、排序：

```
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 20
```

常用管線：`fields`（選欄位）、`filter`（過濾）、`stats`（彙總，如 `count()`、`avg()`）、`sort`、`limit`、`parse`（從文字抽欄位）。這是排錯時最實用的工具——比在主控台一條條點串流快太多。

## Metrics：內建指標 vs 自訂指標、維度、EMF

<Term en="Metric" desc="隨時間變化的一串數字資料點，CloudWatch 用它畫圖、設告警。">指標</Term>分兩種：

- **內建指標（Built-in / AWS 提供）**：AWS 服務**自動**發出的指標，你什麼都不用做。例如 Lambda 自動有 `Invocations`、`Errors`、`Throttles`、`Duration`、`ConcurrentExecutions`；API Gateway 有 `4XXError`、`5XXError`、`Latency`、`Count`。
- **自訂指標（Custom Metric）**：**你自己**送上去的業務數字，例如「成功結帳筆數」「購物車放棄率」「某外部 API 回應時間」。這些 AWS 不會幫你量，要你主動送。

**維度（Dimension）** 是幫指標貼的鍵值標籤，讓你能把同一個指標切開看。例如 `Errors` 這個指標配上維度 `FunctionName=order-processor`、`FunctionName=email-sender`，就能分別看兩個函式各自的錯誤。

:::info[🔑 為什麼要有自訂指標？內建的不夠嗎？]
內建指標只知道「技術層面」的事（跑了幾次、錯幾次、花幾毫秒），**它不懂你的生意**。「今天成功結帳幾筆」「有多少人加入購物車卻沒結帳」這些**業務指標**，只有你的程式知道，所以要靠自訂指標送上去。出事時業務指標往往比技術指標更早、更準地告訴你「真的有問題」。
:::

### 兩種送自訂指標的方式：put-metric-data vs EMF

送自訂指標有兩條路，DVA 愛考你分得清：

| 方式 | 怎麼運作 | 優缺點 |
| --- | --- | --- |
| **`PutMetricData` API** | 在程式裡直接呼叫 API 把數字送上去 | 直覺好懂；但**每次都是一個同步 API 呼叫**，在 Lambda 裡會**佔用執行時間**（還可能被節流、增加延遲與成本）。 |
| **EMF 嵌入式指標格式** | 照 EMF 格式**印一行 JSON 日誌**，CloudWatch 讀日誌時**自動抽成指標** | **不多打 API、不佔執行時間**（你只是 log 而已）；同一筆資料同時是日誌又是指標。Lambda 情境下**官方推薦用 EMF**。 |

<Term en="Embedded Metric Format" desc="一種結構化 JSON 日誌格式，照格式印出後 CloudWatch 自動從日誌抽出成指標，不必另外呼叫 PutMetricData。">EMF</Term> 的精神是：**你只負責印 log，指標自動生出來**。對 Lambda 這種「每毫秒都計費、又不想多打同步 API」的環境特別划算。AWS 有提供 EMF 的函式庫（`aws-embedded-metrics`）幫你產出正確格式。

## Alarms：門檻、動作、搭 SNS

<Term en="CloudWatch Alarm" desc="持續盯著某個指標，當它在設定的週期內超過門檻就改變狀態並觸發動作（通知、擴充、執行 Lambda）。">告警</Term>就是「盯著一個指標，超過門檻就做事」。設一個告警要想清楚四件事：

1. **盯哪個指標 + 統計 + 週期**：例如「Lambda `Errors` 的 **Sum**（總和）、每 **1 分鐘**」。統計選錯是常見雷（見下）。
2. **門檻與評估期數**：例如「連續 **3** 個週期 **大於等於 5**」才算真的出事（避免偶發抖動誤報）。
3. **狀態**：`OK`（正常）、`ALARM`（超標）、`INSUFFICIENT_DATA`（資料不夠判斷）。
4. **動作**：進入 `ALARM` 時要做什麼——最常見是**發 <Term en="Simple Notification Service" desc="AWS 的發布/訂閱通知服務，一則訊息可同時推給 email、簡訊、Lambda、HTTP 端點等多個訂閱者。">SNS</Term> 通知**（email／簡訊／推 Lambda／推 Slack），也可以觸發 Auto Scaling 或 EC2 動作。

<Scenario title="真實情境：錯誤率一飆高就立刻通知你，不等客訴">

你希望「訂單處理 Lambda 五分鐘內錯超過 5 次，就馬上收到通知」。做法：建一個 CloudWatch Alarm 盯 `AWS/Lambda` 的 `Errors` 指標（維度鎖到你的函式），統計用 **Sum**、週期 1 分鐘、門檻「5 分鐘內 >= 5」，告警動作設成推一個 SNS 主題，你的手機 email 訂閱那個主題。之後只要爆錯，手機立刻叮一聲，你在使用者打客訴電話前就已經在翻 log 了。

</Scenario>

## Dashboards：把最重要的圖集中一面牆

<Term en="CloudWatch Dashboard" desc="可自訂的監控面板，把多個指標圖、告警狀態、Logs Insights 查詢集中在一頁，一眼看出系統健康度。">儀表板（Dashboard）</Term>讓你把跨服務、跨區域的關鍵圖表擺在同一頁：Lambda 錯誤率、API Gateway 延遲、DynamoDB 節流、自訂的業務指標……值班時掃一眼就知道系統健不健康，不用在各服務頁面跳來跳去。可共用給團隊，也能放 Logs Insights 查詢結果當 widget。

## 固定段落：CloudWatch vs CloudTrail vs X-Ray — 各看什麼、何時用哪個

這三個名字很像、超容易混，而且 **DVA 幾乎每次都考**。一句話先記住：**CloudWatch 看「系統健不健康」、CloudTrail 看「誰動了什麼」、X-Ray 看「這一條請求慢在哪」。**

| | 它回答什麼問題 | 主要資料 | 典型用途 |
| --- | --- | --- | --- |
| **CloudWatch** | 「系統現在**健不健康**？出事了嗎？」 | 日誌、指標、告警 | 看錯誤率／延遲、翻應用程式 log、超標發通知 |
| **CloudTrail** | 「**誰**在**什麼時候**呼叫了**哪個 AWS API**？」 | API 呼叫的稽核軌跡 | 稽核、安全調查、合規、「是誰刪了那個貯體」 |
| **X-Ray** | 「這**一條請求**跨了哪些服務、**慢在哪一段**？」 | 分散式追蹤（trace／segment） | 微服務／無伺服器效能除錯、找延遲瓶頸 |

**何時用哪個（白話版）：**

- 想知道「我的函式最近錯很多、延遲變高」→ **CloudWatch**（指標 + 告警 + 日誌）。
- 想知道「到底是**誰**在凌晨三點把那個 S3 貯體刪了／改了 IAM 政策」→ **CloudTrail**（它記錄所有 API 呼叫者、來源 IP、時間）。
- 想知道「使用者結帳這條鏈路，是 Lambda 慢、還是 DynamoDB 慢、還是外部 API 慢」→ **X-Ray**（把一條請求端到端拆開看每一段耗時）。

**優缺點對照：**

- **CloudWatch** — 優點：無所不在、幾乎每個服務都內建指標、設定簡單、是排錯第一站。缺點：日誌無限長又沒設保留期會**一直計費**；高基數維度會**爆成本**（見下）；它**看不到「誰呼叫了 API」那是 CloudTrail 的事**。
- **CloudTrail** — 優點：完整稽核軌跡、安全與合規必備、管理事件預設就有 90 天可查。缺點：它**不是即時監控工具**（別拿它當告警主力）；資料事件（如 S3 物件層級）要另外開且另計費；不告訴你應用程式內部發生什麼。
- **X-Ray** — 優點：跨服務端到端追蹤、一眼看出瓶頸段落、對微服務／無伺服器超實用。缺點：要**埋 SDK／開啟追蹤**才有資料（不是零設定）；有抽樣（預設不是每條都追）；按追蹤筆數計費。

:::tip[💡 考試重點：關鍵字對應]
- 題目講 **「稽核」「是誰呼叫／刪除」「合規」「API 呼叫歷史」「來源 IP」** → **CloudTrail**。
- 題目講 **「錯誤率／延遲告警」「翻應用程式日誌」「自訂業務指標」** → **CloudWatch**。
- 題目講 **「跨服務延遲」「找效能瓶頸」「端到端追蹤」「service map 服務地圖」** → **X-Ray**。
:::

## 🛠️ 動手做：送自訂指標 → 設告警 → 用 Logs Insights 查

下面每一步都附**預期會看到什麼**，照著做一次就懂。

### 1) 用 put-metric-data 送一筆自訂指標

```bash
# 送一筆「成功結帳數 = 1」的自訂指標，命名空間 MyApp/Orders，帶一個維度
aws cloudwatch put-metric-data \
  --namespace "MyApp/Orders" \
  --metric-name CheckoutSuccess \
  --value 1 \
  --unit Count \
  --dimensions Environment=prod
```

**預期結果**：指令沒有輸出（成功時安靜）。等 1 到 2 分鐘後，到 CloudWatch 主控台的 **Metrics → 自訂命名空間 `MyApp/Orders`**，就能看到 `CheckoutSuccess` 這個指標，點開能畫出折線圖。

### 2) 針對這個指標設一個告警，搭 SNS 通知

```bash
# 先建一個 SNS 主題並訂閱你的 email（訂閱後要去信箱點確認連結）
aws sns create-topic --name order-alerts
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:111122223333:order-alerts \
  --protocol email \
  --notification-endpoint you@example.com

# 建告警：Lambda 錯誤「5 分鐘內總和 >= 5」就推 SNS
aws cloudwatch put-metric-alarm \
  --alarm-name order-processor-errors \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --dimensions Name=FunctionName,Value=order-processor \
  --statistic Sum \
  --period 60 \
  --evaluation-periods 5 \
  --threshold 5 \
  --comparison-operator GreaterThanOrEqualToThreshold \
  --treat-missing-data notBreaching \
  --alarm-actions arn:aws:sns:us-east-1:111122223333:order-alerts
```

**預期結果**：`put-metric-alarm` 成功時無輸出。到主控台 **Alarms** 會看到 `order-processor-errors`，初始狀態通常是 `INSUFFICIENT_DATA`，資料進來後轉 `OK`。等函式真的爆錯到門檻，狀態轉 `ALARM`，你的 email 就會收到通知（前提是你已點過 SNS 確認連結）。

### 3) 用 Logs Insights 查「過去一小時有哪些錯誤、分別幾次」

在主控台 **Logs → Logs Insights**，選日誌群組 `/aws/lambda/order-processor`，貼上：

```
fields @timestamp, @message
| filter @message like /ERROR/
| stats count() as errorCount by bin(5m)
| sort @timestamp desc
```

**預期結果**：跑完會列出**每 5 分鐘一列**的錯誤次數（`errorCount`），讓你一眼看出「錯誤是哪個時段暴衝的」。把 `like /ERROR/` 換成你自己的關鍵字（如某個 orderId），就能把特定請求的所有 log 撈出來看。

## 實務應用：不只是考試

<Scenario title="真實情境：用 request ID 把一次請求的所有 log 串起來">

使用者回報「某張訂單重複扣款」。你知道那次請求的 request ID（可在 API Gateway 回應或前端 log 拿到）。到 Logs Insights 對 `/aws/lambda/order-processor` 下 `filter @requestId = "<那個 id>"`，就能把**那一次執行**從頭到尾的每一行 log 撈出來，看出是不是重試導致重複處理（這時就該回頭檢查函式有沒有做冪等）。這招比盲目翻整個群組快太多，也是為什麼前面建議你**每行 log 都帶 request ID**。

</Scenario>

<Cost>

**CloudWatch 大部分項目有免費額度**（如 10 個自訂指標、部分 API 呼叫、少量日誌擷取），但三個地方很容易不知不覺燒錢：**(1) 日誌擷取與儲存量**——日誌群組**沒設保留期預設是「永不過期」**，日積月累無限長、一直計費；**(2) 自訂指標**——每個「指標名 × 維度組合」都算一個獨立指標計費，**高基數維度（如把 userId 當維度）會爆出成千上萬個指標**；**(3) Logs Insights 查詢**按掃描資料量計費，對超大群組亂查很貴。做法：**一律設日誌保留期**、維度只放低基數的東西、查詢先縮小時間範圍。練習完把測試用的告警、SNS 主題、日誌群組清一清。

</Cost>

:::warning[🚑 常踩雷]
- **日誌群組沒設保留期**：預設**永不過期**，日誌無限長**一直計費**。一律用 `aws logs put-retention-policy` 設個合理天數（如 14 或 30 天）。
- **高基數維度爆成本**：把 `userId`、`requestId`、`orderId` 這種「每筆都不一樣」的值當**指標維度**，會瞬間生出成千上萬個計費指標。高基數的東西應該留在**日誌**裡（用 Logs Insights 查），不要當維度。
- **告警用錯統計／週期**：盯錯誤「總數」要用 **Sum**，不是 **Average**（平均可能被稀釋到看不出爆量）；週期（period）與評估期數（evaluation periods）設太長會**反應太慢**、太短又**容易誤報**。想清楚再設。
- **Lambda 執行角色缺 logs 權限**：函式裡明明有 `console.log`，但 CloudWatch 卻**完全沒日誌**——通常是執行角色少了 `logs:CreateLogGroup` / `logs:CreateLogStream` / `logs:PutLogEvents`（附上受管政策 `AWSLambdaBasicExecutionRole` 最省事）。
- **以為 CloudWatch 看得到「誰呼叫了 API」**：那是 **CloudTrail** 的事！CloudWatch 看系統健康與應用程式日誌，**查不到「是誰在幾點呼叫／刪除了哪個 AWS 資源」**。方向搞錯會一直查不到。
:::

<Refs>

- [Amazon CloudWatch 使用者指南](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/WhatIsCloudWatch.html)
- [CloudWatch Logs：日誌群組與日誌串流](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/Working-with-log-groups-and-streams.html)
- [CloudWatch Logs Insights 查詢語法](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CWL_QuerySyntax.html)
- [發布自訂指標與 EMF 嵌入式指標格式](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Embedded_Metric_Format.html)
- [使用 CloudWatch 告警](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/AlarmThatSendsEmail.html)
- [CloudWatch、CloudTrail 與 X-Ray 的差異](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-user-guide.html)

</Refs>

## 下一步

👉 下一篇：[X-Ray 分散式追蹤](./xray-tracing.md)
