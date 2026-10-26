---
sidebar_position: 2
title: X-Ray 分散式追蹤
---

# AWS X-Ray：一個請求流過十個服務，到底哪一段慢、哪一段錯，一眼看出來

> 本篇用「開發者視角」帶你搞懂 X-Ray：為什麼在微服務／無伺服器裡光看日誌除不完錯、追蹤（trace）與區段（segment）／子區段（subsegment）怎麼組成、服務地圖怎麼畫出整條路徑、註解（annotations）和中繼資料（metadata）差在哪、取樣（sampling）怎麼控成本、以及怎麼在 Lambda／應用上啟用並實際加一個子區段與註解。這些是 DVA-C03 Domain 4（疑難排解與最佳化）的高頻考點。

<Vocab title="📌 先認識這篇會出現的名詞（完全沒碰過也能懂）">

- **分散式追蹤（Distributed Tracing）**：一個使用者請求往往會流過好幾個服務（API Gateway → Lambda → DynamoDB → 另一個 Lambda…）。分散式追蹤就是把「同一個請求」在這一路上每一站花的時間、成功或失敗，全部串成一條線記錄下來。
- **追蹤（Trace）**：代表「一個請求從頭到尾」的完整記錄。整條路徑共用同一個 Trace ID，所以散落在各服務的資料能被重新拼回成一整條。
- **區段（Segment）**：一個服務（例如某個 Lambda 函式）替這次請求所做的事的記錄——起訖時間、是否出錯。一條 trace 由多個 segment 組成。
- **子區段（Subsegment）**：segment 裡更細的一段，例如「呼叫 DynamoDB 花了 12 毫秒」「打外部 HTTP API 花了 200 毫秒」。讓你看到某個服務內部「時間花在哪」。
- **服務地圖（Service Map）**：X-Ray 把所有 trace 彙整後畫出的一張圖，節點是各服務、連線是呼叫關係，上面標著延遲與錯誤率。一眼看出整條鏈路長怎樣、哪個節點在冒紅。
- **取樣（Sampling）**：不是每一個請求都記錄，而是「抽樣」記一部分，避免追蹤本身拖慢應用又產生巨量費用。

</Vocab>

:::note[💬 閱讀小提示]
文章裡只要看到帶<Term desc="像這樣！滑鼠移到有虛線的名詞上（手機點一下），就會跳出白話解釋。">虛線底線的名詞</Term>，把滑鼠移上去就會跳出白話解釋。所有名詞也都整理在 [名詞與服務對照表](/glossary)。
:::

## 為什麼需要 X-Ray？先講一個「只看日誌根本除不完錯」的例子

假設你做了一個下單 API：API Gateway 收到請求 → 呼叫「下單 Lambda」→ 這個 Lambda 又去寫 DynamoDB、再呼叫「庫存 Lambda」、最後打一個第三方金流 HTTP API。某天使用者抱怨「下單有時候要等五秒」。

你打開 <Term en="Amazon CloudWatch Logs" desc="AWS 的日誌服務，收集各服務印出的文字日誌。">CloudWatch Logs</Term> 開始查，但問題來了：下單 Lambda 的日誌只看得到它自己印了什麼，看不到「這五秒到底是 DynamoDB 慢、還是庫存 Lambda 慢、還是金流 API 慢」。你得分別去三個不同服務的日誌、用時間戳土法對時間，才能勉強拼湊出經過——而且每一條請求都是分開的日誌，根本串不起來。

<Term en="AWS X-Ray" desc="AWS 的分散式追蹤服務，把一個請求流經多個服務的時間與錯誤串成一條 trace，並畫成服務地圖。">X-Ray</Term> 解決的正是這件事：它把同一個請求流過的每一站自動串成**一條 trace**，畫成一張**服務地圖**，每個節點標著平均延遲與錯誤率。你一眼就看到「喔，是金流那段 API 慢了 4.3 秒」，點進去還能看到那一次請求每個子區段的耗時。對開發者來說，除錯從「翻三份日誌猜」變成「看一張圖指」。

## 一句話先懂 X-Ray 的運作

你的應用（或 Lambda）用 X-Ray SDK 做 **instrument（埋點）**，每次處理請求時就產生一個 **segment**，裡面可再切出 **subsegment** 記錄「呼叫下游」的細節。這些資料送到 X-Ray 服務後，依同一個 **Trace ID** 被拼成完整的 **trace**，再彙整成一張 **service map**。為了不爆量，X-Ray 用 **sampling** 只記一部分請求。

<Analogy title="🏢 生活比喻：X-Ray 就像宅配包裹的物流追蹤">

- **trace = 一個包裹的完整物流記錄**：從下單到送達，全程共用同一組追蹤號碼（Trace ID）。
- **segment = 每一個轉運站的簽收記錄**：包裹在「台北轉運中心」「桃園分揀」各停留多久、有沒有卡關，都各自記一筆。
- **subsegment = 站內更細的動作**：在某個轉運站裡「卸貨 2 分鐘、分揀 5 分鐘、裝車 1 分鐘」。
- **service map = 整張物流路線圖**：把所有包裹的記錄彙整起來，畫出「哪條路線特別容易塞、哪一站特別常出包」。
- **sampling = 抽檢**：不可能每個包裹都全程錄影，所以只抽一部分做完整記錄。

</Analogy>

## 核心一：trace、segment、subsegment 怎麼組成一條線

一條 **trace** 代表一個請求的全程，由多個 **segment** 組成，每個 segment 又可切出多個 **subsegment**：

```
Trace（Trace ID: 1-abc…）  ← 一個下單請求的全程
├── Segment：下單 Lambda
│   ├── Subsegment：DynamoDB PutItem（12 ms）
│   ├── Subsegment：呼叫庫存 Lambda（Invoke 80 ms）
│   └── Subsegment：金流 HTTP API（4300 ms）  ← 慢在這！
└── Segment：庫存 Lambda
    └── Subsegment：DynamoDB Query（9 ms）
```

- **segment** 回答「**哪個服務**處理這次請求、花多久、有沒有錯」。
- **subsegment** 回答「這個服務**內部**時間花在哪」——尤其是對下游（資料庫、其他服務、外部 API）的每一次呼叫。X-Ray SDK 在你 instrument 之後，常見的 AWS SDK 呼叫會**自動**產生 subsegment；你也能**手動**加 subsegment 包住自己的一段邏輯。

:::info[🔑 Trace ID 是怎麼跨服務傳下去的]
當請求從一個服務傳到下一個服務時，X-Ray 會在請求裡帶一個 `X-Amzn-Trace-Id` 標頭，把 Trace ID 一路傳遞下去。下游服務用同一個 Trace ID 記錄自己的 segment，X-Ray 才能把散落各處的 segment 拼回**同一條 trace**。這個「上下文傳遞」多半由 SDK 自動完成，但如果某一段沒 instrument，鏈路就會在那裡斷掉（見文末常踩雷）。
:::

## 核心二：服務地圖（service map）——整條鏈路一眼看懂

X-Ray 把大量 trace 彙整後，自動畫出一張**服務地圖**：每個**節點**是一個服務（你的 Lambda、API Gateway、DynamoDB、外部 API），節點之間的**連線**代表呼叫關係，上面標著**平均延遲**與**錯誤率**。

<div className="flow">
  <div className="flow-node">API Gateway</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">下單 Lambda</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">DynamoDB</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">金流 API（紅：高延遲）</div>
</div>

節點會用顏色標示健康度：綠色正常、黃色有部分 4xx、紅色有 5xx 錯誤或高延遲。你在圖上看到哪個節點冒紅，直接點進去就能篩出那些出錯或變慢的 trace，再往下鑽到 subsegment 看細節。這就是 X-Ray 相對只看日誌最大的價值：**先用一張圖定位到問題在哪一段，再去看細節**，而不是一開始就一頭栽進某份日誌。

## 核心三：註解（annotations）vs 中繼資料（metadata）——能不能查是關鍵差別

你可以在 segment／subsegment 上附加自訂資料，幫助之後篩選與除錯。但分兩種，**DVA 很愛考你分得清不清**：

| 類型 | 能不能用來篩選／查詢 | 典型用途 |
| --- | --- | --- |
| **註解（Annotations）** | **可以**。會被**建立索引**，能在 X-Ray 主控台用篩選表達式查（如 `annotation.userId = "u123"`）。 | 放**少量、關鍵、想拿來篩**的鍵值，如 `userId`、`orderId`、`paymentProvider`。每筆值只能是字串／數字／布林。 |
| **中繼資料（Metadata）** | **不可以**。**不建索引**、無法用來篩選查詢，只能在點開某一條 trace 時當作附帶細節看。 | 放**較大、只供人工檢視**的資料，如完整的請求內容、除錯用的物件、回應片段。 |

<Analogy title="🏢 生活比喻：病歷上的「可檢索標籤」vs「附註說明」">

- **annotation = 貼在病歷夾上的分類標籤**：像「血型 A」「過敏：盤尼西林」，可以拿這些標籤**篩出所有符合的病歷**。所以要精簡、要是你之後想拿來搜尋的東西。
- **metadata = 夾在病歷裡的詳細說明紙**：醫師的一大段手寫備註，資訊很多，但**不能拿它做全院搜尋**——只有翻開這一份病歷時才看得到。

</Analogy>

:::info[🔑 一句話記住怎麼選]
**之後想拿來「篩選／查詢」的 → 用 annotation（會建索引，但要精簡）。只是想「附一包細節給人看」的 → 用 metadata（不建索引，可以大包）。** 用錯方向——把想查的放進 metadata——結果就是「查不到」，這是常見的坑。
:::

## 核心四：取樣（sampling）——為什麼不每一個請求都記

如果每一個請求都完整記錄 trace，兩個問題馬上來：一是**費用**（X-Ray 按記錄的 trace 筆數收費），二是對高流量應用可能帶來**額外負擔**。所以 X-Ray 預設採**取樣**：

- **預設規則**：每秒先保底記錄 **1 筆**（reservoir），之後額外抽 **5%** 的請求。這樣在高流量下也只記一小部分，但仍足夠反映整體狀況。
- 你可以**自訂取樣規則**：例如把 `/health` 健康檢查這類路徑取樣率設 0（不浪費），把 `/checkout` 結帳這類關鍵路徑設較高取樣率（確保問題抓得到）。

:::tip[💡 考試重點：取樣要記的點]
- 取樣是**成本與可觀測性的取捨**：調高抓得更全但更貴，調低省錢但可能漏掉偶發問題。
- 題目講「X-Ray 費用太高想降低」→ 想到**調整取樣規則**（降低取樣率、對低價值路徑設 0）。
- 題目講「偶發錯誤抓不到、取樣抽不中」→ 想到**對關鍵路徑提高取樣率**。
:::

## 核心五：怎麼在 Lambda／應用上啟用 X-Ray

要讓 trace 真的出現，需要三件事到位：**開啟追蹤 → SDK instrument → 資料送到 X-Ray（daemon 概念）**。

**1）開啟 Active Tracing（Lambda）**：在 Lambda 函式設定裡把 <Term en="Active Tracing" desc="在 Lambda 函式設定開啟後，Lambda 會自動為每次呼叫建立 segment 並送到 X-Ray。">Active Tracing</Term> 打開。開啟後，Lambda **自己會替每次呼叫建立一個 segment** 並送到 X-Ray——這時服務地圖上就看得到這個函式節點了。但要注意：這只給你「函式這一格」，**看不到函式裡呼叫的下游細節**，那要靠下一步。

**2）用 SDK instrument（埋點）**：在程式碼裡用 **AWS X-Ray SDK** 把 AWS SDK client 包起來（patch），之後所有對 DynamoDB、S3、其他 Lambda 的呼叫就會**自動產生 subsegment**；你也可以手動加 subsegment 與 annotation。沒做這一步，下游呼叫在地圖上就是看不到的。

**3）X-Ray daemon 概念**：X-Ray SDK 不直接把資料打到 X-Ray API，而是先丟給一個本機的 <Term en="X-Ray daemon" desc="負責收集 SDK 產生的 segment 並批次送到 X-Ray 服務的常駐程式。">X-Ray daemon</Term>（透過 UDP），由它批次緩衝後再送到 X-Ray 服務，減少對應用的負擔。**在 Lambda 上你不用自己裝 daemon**——Lambda 執行環境已內建；但在 **EC2／ECS／自管容器** 上，就要自己把 daemon 跑起來（EC2 裝 daemon、ECS 加一個 daemon 的 sidecar 容器）。

:::info[🔑 執行角色要有 X-Ray 權限]
Lambda 的**執行角色**必須能把 trace 送出去，常見做法是附上受管政策 **`AWSXRayDaemonWriteAccess`**（含 `xray:PutTraceSegments`、`xray:PutTelemetryRecords` 等權限）。少了這個，就算開了 Active Tracing、也 instrument 了，trace 依然送不出去、地圖上一片空白。
:::

## 什麼時候需要 X-Ray（相對只看 CloudWatch Logs）、優缺點、何時別用

這是本篇的固定決策段落，考試與實務都靠它分辨「這題該用 X-Ray 還是 CloudWatch」。

**為什麼需要它（相對只看 CloudWatch Logs）**：CloudWatch Logs 擅長「某個服務內部印了什麼」，但一個請求跨多個服務時，日誌是**各自分散**的，你很難回答「這條請求的 5 秒花在哪一段」。X-Ray 的價值就是**把一個請求跨服務的全程串成一條 trace、畫成服務地圖**，讓你先定位是**哪一段**慢／錯，再下鑽細節。簡單說：**CloudWatch 回答「這個服務怎麼了」，X-Ray 回答「這個請求在整條鏈路哪裡出問題」。** 兩者互補，不是二選一。

**優點**：

- 跨服務把請求全程串起來，延遲瓶頸與錯誤來源**一眼定位**。
- 服務地圖自動呈現整體架構與健康度，不用自己畫。
- 和 Lambda／API Gateway／SDK 整合好，Lambda 幾乎「開個開關 + 加權限」就有基本追蹤。
- annotation 可索引，能按業務維度（如 `orderId`）篩出特定請求的 trace。

**缺點 / 限制**：

- 要看到完整鏈路，**每一段都得 instrument**；只要中間有一段沒埋點，鏈路就在那裡斷掉。
- **取樣**意味著不是每個請求都有 trace，偶發問題可能剛好沒被抽中。
- trace 資料有**保留期限**（預設約 30 天），不適合當長期稽核紀錄。
- 多一層 SDK 與送資料的動作，會有**少量額外負擔與費用**。

**什麼時候反而別用它（或先別急著上）**：

- **單一服務、沒有跨服務呼叫**：一支獨立的小函式，光看 CloudWatch Logs／Metrics 常就夠了，上 X-Ray 是殺雞用牛刀。
- **你要的是精確的錯誤堆疊與完整日誌文字**：那是 CloudWatch Logs 的強項；X-Ray 給的是「時間分佈與鏈路」，不是逐行日誌。
- **極度在意每一分成本、流量又很大**：全量追蹤會貴，至少要先把取樣規則調好。

## 動手做：Lambda 開啟追蹤 + 加一個 subsegment 與 annotation

<Scenario title="真實情境：下單 Lambda 偶爾很慢，想知道是不是金流 API 拖的">

你的下單 Lambda 會呼叫一個第三方金流 HTTP API，偶爾很慢但看日誌看不出來。做法：開啟 Active Tracing、用 X-Ray SDK 把呼叫金流那段包成一個**子區段**、並把 `orderId` 標成**註解**方便事後篩選。之後在服務地圖上就能看到金流節點的延遲，點進慢的那條 trace，`payment-call` 子區段會明白告訴你花了幾秒。

</Scenario>

### 🛠️ 步驟一：開啟 Active Tracing 並補上 X-Ray 權限

```bash
# 1) 開啟函式的 Active Tracing（Lambda 自動為每次呼叫建 segment）
aws lambda update-function-configuration \
  --function-name order-processor \
  --tracing-config Mode=Active

# 2) 給執行角色 X-Ray 送資料的權限（少了這個 trace 送不出去）
aws iam attach-role-policy \
  --role-name lambda-exec-role \
  --policy-arn arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess
```

### 🛠️ 步驟二：在程式碼裡 instrument + 加 subsegment 與 annotation

```js
// Node.js：用 aws-xray-sdk 包住 AWS SDK，並手動加子區段與註解
const AWSXRay = require('aws-xray-sdk-core');
// 把 AWS SDK 整個 patch 起來：之後 DynamoDB、S3… 的呼叫會自動產生 subsegment
const AWS = AWSXRay.captureAWS(require('aws-sdk'));

const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  // 這次呼叫的 segment 由 Lambda 自動建立，我們在它底下加一個子區段
  const segment = AWSXRay.getSegment();

  // 註解（annotation）：少量、關鍵、可被索引查詢的鍵值
  segment.addAnnotation('orderId', event.orderId);
  segment.addAnnotation('paymentProvider', 'acme-pay');

  // 中繼資料（metadata）：較大、只供檢視、不能用來查詢
  segment.addMetadata('rawRequest', event);

  // DynamoDB 呼叫 → 因為上面 captureAWS，已自動產生一個 subsegment
  await dynamo.put({ TableName: 'orders', Item: { id: event.orderId } }).promise();

  // 手動包一個子區段，量測「呼叫金流 API」這段到底多慢
  const result = await AWSXRay.captureAsyncFunc('payment-call', async (sub) => {
    try {
      const res = await callPaymentApi(event);   // 你的金流呼叫
      sub.addAnnotation('paymentStatus', res.status);
      return res;
    } finally {
      sub.close();   // 記得關閉子區段，否則這段時間量不準
    }
  });

  return { statusCode: 200, body: JSON.stringify(result) };
};
```

### 🛠️ 步驟三：打幾次請求，去看服務地圖

```bash
# 觸發幾次（讓它產生 trace）
aws lambda invoke --function-name order-processor \
  --payload '{"orderId":"o-1001"}' out.json

# 用 annotation 篩出某一筆訂單的 trace ID（示範篩選表達式）
aws xray get-trace-summaries \
  --start-time $(date -d '-10 min' +%s) \
  --end-time $(date +%s) \
  --filter-expression 'annotation.orderId = "o-1001"'
```

:::tip[✅ 預期結果]
- 打開 X-Ray 主控台的 **Service map**，會看到 `order-processor` 這個節點，連到 **DynamoDB** 和一個代表金流 API 的**外部節點**。
- 金流節點若延遲高會呈現黃／紅色。點進一條慢的 trace，能看到 `payment-call` 這個**子區段**佔掉大部分時間——問題定位完成。
- 在 trace 詳情裡能看到 `orderId`、`paymentProvider` 這些 **annotation**，而且可以用 `annotation.orderId = "o-1001"` 直接**篩出**那一筆；`rawRequest` 則出現在 **metadata** 區，只能看、不能拿來篩。
:::

:::warning[🚑 常踩雷]
- **只開 Active Tracing、沒做 SDK instrument**：服務地圖上只有你的函式那一格，**看不到它呼叫的 DynamoDB／外部 API**。要看到下游，一定要用 X-Ray SDK 把 AWS SDK client patch 起來（`captureAWS`）並手動加子區段。
- **annotation 與 metadata 用錯**：把「之後想查的東西」塞進 **metadata**，結果**查不到**（metadata 不建索引）。想篩選的一律放 **annotation**；annotation 又別亂塞大資料（它只收字串／數字／布林，且應精簡）。
- **執行角色缺 X-Ray 權限**：沒附 `AWSXRayDaemonWriteAccess`（或等效的 `xray:PutTraceSegments`／`xray:PutTelemetryRecords`），就算全開了，trace 也**送不出去**，地圖一片空白，又很難察覺是權限問題。
- **取樣率與成本沒顧好**：預設只抽一小部分，偶發問題可能**抽不中**；反過來把全部請求都追蹤，高流量下**費用會爆**。用自訂取樣規則：低價值路徑設 0、關鍵路徑調高。
- **子區段忘了 close**：手動建的子區段若沒 `close()`，那段時間量測會不準、trace 也可能顯示不完整。
- **鏈路中間有一段沒 instrument**：只要中間某個服務沒埋點，Trace ID 的上下文就在那裡斷掉，服務地圖會出現斷鏈，看起來像「後面都不見了」。
:::

<Refs>

- [AWS X-Ray 開發人員指南](https://docs.aws.amazon.com/xray/latest/devguide/aws-xray.html)
- [X-Ray 概念：segments、subsegments、trace、service graph、sampling](https://docs.aws.amazon.com/xray/latest/devguide/xray-concepts.html)
- [在 Lambda 使用 X-Ray（Active Tracing）](https://docs.aws.amazon.com/lambda/latest/dg/services-xray.html)
- [註解與中繼資料（annotations vs metadata）](https://docs.aws.amazon.com/xray/latest/devguide/xray-sdk-nodejs-segment.html)
- [設定取樣規則（sampling rules）](https://docs.aws.amazon.com/xray/latest/devguide/xray-console-sampling.html)

</Refs>

## 下一步

👉 下一篇：[錯誤處理與重試](./error-handling-retries.md)
