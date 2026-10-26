---
sidebar_position: 4
title: 效能與成本最佳化
---

# 效能與成本最佳化：慢與貴往往是同一個病

> 本篇用「開發者視角」帶你把應用程式**調快又調便宜**。你會看到：Lambda 的記憶體與 CPU 怎麼連動、Power Tuning 怎麼找甜蜜點、為什麼連線與 SDK client 要放 handler 外層、provisioned concurrency 怎麼解冷啟動、四種快取（ElastiCache／DAX／API Gateway 快取／CloudFront）怎麼選、DynamoDB 怎麼挑鍵與避開 Scan、以及連線重用、批次與分頁。這些是 DVA-C03 Domain 4「最佳化」最愛考的開發細節。

## 為什麼要把「效能」和「成本」放在同一篇講？

因為在雲端，**慢與貴常常是同一個病**。

想一個例子：你的 Lambda 每次被呼叫，都在 handler 裡重新建立一條資料庫連線、重新 new 一個 SDK client，再去 DynamoDB 做一次全表 `Scan` 撈資料。結果是——每次執行都花好幾秒（慢），而 Lambda 按**執行毫秒數 × 記憶體**計費、DynamoDB 按**讀取的資料量**計費，所以你同時**又慢又貴**。

反過來，當你把連線移到 handler 外層重用、用對的鍵一次 `Query` 命中、再加一層快取擋掉重複讀取——**延遲下降的同時，帳單也跟著下降**。這就是為什麼最佳化要「效能＋成本一起看」：多數時候你不是在兩者間取捨，而是**一箭雙鵰**。

:::note[💬 閱讀小提示]
文章裡只要看到帶<Term desc="像這樣！滑鼠移到有虛線的名詞上（手機點一下），就會跳出白話解釋。">虛線底線的名詞</Term>，把滑鼠移上去就會跳出白話解釋。所有名詞也都整理在 [名詞與服務對照表](/glossary)。
:::

<Vocab title="📌 先認識這篇會出現的名詞（完全沒碰過也能懂）">

- **延遲（Latency）**：一個請求從送出到拿到回應花的時間。數字越小越好，常以毫秒（ms）計。
- **冷啟動（Cold Start）**：Lambda 沒有可重複利用的執行環境時，第一次呼叫要先建環境、載程式碼，造成首次回應較慢。
- **快取（Cache）**：把「算過或查過的結果」先存起來，下次同樣的請求直接拿現成的，不用再重算或重查，省時間也省錢。
- **快取命中／未命中（Hit / Miss）**：要的資料在快取裡找到了叫「命中」，直接用；沒找到叫「未命中」，得回到後端重查一次。
- **快取失效（Invalidation / TTL）**：資料變了，快取裡的舊版就該被淘汰。常用<Term en="Time To Live" desc="資料在快取裡的存活時間，到期就自動被淘汰，下次請求會重新回源查最新值。">TTL（存活時間）</Term>讓快取到期自動更新。
- **節流（Throttling）**：請求量超過上限時，服務暫時拒絕或排隊，保護後端不被打垮。
- **水平擴充（Scale Out）**：靠「增加執行個體數量」來扛更多量，而不是把單台機器換更大台。

</Vocab>

## 名詞先修到位後，先建立一個決策順序

最佳化最常見的錯，是**還沒量測就先動手**。正確順序是：先**量**（找出到底是哪一段慢、哪一筆貴）→ 再**改最痛的那段** → 改完**再量一次**驗證。帶著這個順序往下看每一招。

## 核心一：Lambda 調校（記憶體↔CPU、Power Tuning、連線重用、provisioned concurrency）

Lambda 是開發者最常碰、也最容易調出成效的地方。四個重點：

### 1）記憶體和 CPU 是連動的（這是最反直覺的一點）

Lambda 你**只能設記憶體**（128 MB ～ 10,240 MB），但 **vCPU 是跟著記憶體自動配的**：記憶體給越多，分到的 CPU 也越多。所以對 CPU 密集的函式（影像處理、壓縮、大量運算），把記憶體從 128 MB 調到 1024 MB，常常執行時間砍到原本的一小截——**跑得快、計費毫秒變少，帳單反而更低**。

這就是「慢與貴同源」最直接的例子：給太低的記憶體，你以為省錢，實際上又慢又貴。

### 2）用 Power Tuning 找「甜蜜點」，別用猜的

記憶體不是越大越好，過了某個點，CPU 已經夠用、再加記憶體只是多花單價。到底設多少最划算？用 **AWS Lambda Power Tuning**（一個以 Step Functions 跑的開源工具）：它會用不同記憶體設定各跑你的函式幾次，畫出「記憶體 vs 執行時間 vs 成本」曲線，直接告訴你**最便宜**或**最快**或**兼顧兩者**的那個點。

### 3）把連線與 SDK client 放在 handler 外層重用

這是 Lambda 效能的頭號開發細節。handler **外層**的程式碼只在**冷啟動（Init 階段）跑一次**，之後同一個執行環境被重複利用時會直接沿用。所以資料庫連線、SDK client、組態讀取通通放外層，熱啟動時就省掉重建的時間。

```js
// ✅ 正確：連線與 SDK client 放 handler 外層，冷啟動建一次、之後重用
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

// 這段只在 Init 階段跑一次
const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  // handler 內只放「每次都要做」的事
  const res = await ddb.send(
    new GetCommand({ TableName: 'orders', Key: { id: event.id } })
  );
  return res.Item;
};
```

```js
// ❌ 錯誤：每次呼叫都 new 一個 client、每次都重建連線 → 又慢又浪費
exports.handler = async (event) => {
  const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({})); // 每次重建！
  // ...
};
```

### 4）用 Provisioned Concurrency 解冷啟動

對**要求低延遲、流量可預測**的函式（例如面向使用者的 API），冷啟動那幾百毫秒到幾秒的首次延遲很傷體驗。<Term en="Provisioned Concurrency" desc="預先初始化並保持指定數量的 Lambda 執行環境隨時待命，呼叫進來直接命中熱環境，沒有冷啟動延遲。">Provisioned Concurrency（預置併發）</Term> 會預先初始化並**保持 N 個環境溫熱**，呼叫一進來就是熱的、沒有冷啟動。代價是**只要開著就持續計費**，所以只在真的需要低延遲時才開。

:::info[🔑 一個最常混的差異]
**Reserved Concurrency（保留併發）不會**消除冷啟動，它只是幫函式「保留／限制」一塊併發配額。真正讓環境保持溫熱、消掉冷啟動的是 **Provisioned Concurrency（預置併發）**。DVA 很愛用這兩個互換來設陷阱。
:::

## 核心二：快取層怎麼選（ElastiCache / DAX / API Gateway 快取 / CloudFront）

快取的共同精神：**把重複的讀取擋在前面，別每次都打到後端**。但快取有很多種，各擋在不同的位置、給不同的對象用。

<div className="flow">
  <div className="flow-node">CloudFront（擋在最前，快取靜態/內容，離使用者最近）</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">API Gateway 快取（擋在 API 層，快取 API 回應）</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">應用層：ElastiCache（通用）/ DAX（專給 DynamoDB）</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">資料庫 / 後端</div>
</div>

| 快取 | 擋在哪 / 快取什麼 | 典型用途 |
| --- | --- | --- |
| **CloudFront** | <Term en="Content Delivery Network" desc="遍布全球的邊緣節點，把內容快取在離使用者最近的地方，降低延遲。">CDN</Term>，最靠近使用者的邊緣節點，快取靜態資產與可快取的 API/內容 | 圖片、JS/CSS、影片、全球使用者的低延遲存取 |
| **API Gateway 快取** | API Gateway 階段層，依請求參數快取**整個 API 回應** | 同樣的 GET 請求短時間內被打很多次，不想每次都觸發後端 Lambda |
| **ElastiCache** | 應用層的記憶體資料庫（Redis／Memcached），由你的程式主動讀寫 | 通用快取：資料庫查詢結果、Session、排行榜、計數器 |
| **DAX** | <Term en="DynamoDB Accelerator" desc="DynamoDB 專屬的記憶體快取，程式幾乎不用改就能把毫秒級讀取降到微秒級。">DynamoDB Accelerator</Term>，**專門只給 DynamoDB** 的記憶體快取 | DynamoDB 讀多寫少、要把讀取從毫秒降到微秒，又不想大改程式 |

## 核心三：DynamoDB 最佳化（選對鍵、避免 Scan、DAX）

DynamoDB 的效能與成本，**九成取決於你怎麼設計鍵與怎麼查**。

- **選對鍵**：把最常用來查詢的欄位設成<Term en="Partition Key" desc="DynamoDB 用來決定資料存在哪個分區的鍵，查詢時幾乎都要帶著它。">分割鍵（Partition Key）</Term>，讓你能用 `Query` 直接命中。鍵選得好，一次 `Query` 就撈到要的那批；選不好，就只能全表掃。另外分割鍵要夠分散（高基數），避免所有流量都打到同一個分區形成「熱分區」。
- **避免 `Scan`**：`Scan` 會**讀過整張表**再篩選，表越大越慢、而且你**為讀過的每一筆都付費**（即使最後只要一筆）。能用 `Query`（帶分割鍵）就絕不用 `Scan`；真的要靠非鍵欄位查，建<Term en="Global Secondary Index" desc="為 DynamoDB 另外建立的索引，讓你能用非主鍵的欄位做 Query，不必全表 Scan。">GSI（全域次要索引）</Term>再 `Query`。
- **用 DAX 擋讀取**：讀多寫少、又要超低延遲時，掛上 **DAX**，讀取從毫秒降到微秒，還省掉大量讀取容量費用。

```js
// ❌ 用 Scan 找某個 email → 讀過整張表，又慢又貴
const bad = await ddb.send(new ScanCommand({
  TableName: 'users',
  FilterExpression: 'email = :e',
  ExpressionAttributeValues: { ':e': { S: 'a@example.com' } },
}));

// ✅ 在 email 上建 GSI，直接 Query → 只讀命中的那幾筆
const good = await ddb.send(new QueryCommand({
  TableName: 'users',
  IndexName: 'email-index',
  KeyConditionExpression: 'email = :e',
  ExpressionAttributeValues: { ':e': { S: 'a@example.com' } },
}));
```

## 核心四：連線重用與 keep-alive、批次、分頁

幾個「寫法對了就快又省」的通用招：

- **連線重用與 keep-alive**：除了把 client 放 handler 外層，還要讓底層 HTTP 連線**保持存活（keep-alive）**重複使用，省掉每次重新 TCP/TLS 交握的開銷。AWS SDK for JavaScript v3 **預設就開 keep-alive**；用其他 runtime 時確認連線池有被重用。
- **批次（Batching）**：與其呼叫 25 次 `GetItem`，不如用一次 `BatchGetItem`／`BatchWriteItem` 把多筆打包成一個請求——**少很多次往返（round trip）**，延遲與成本都降。
- **分頁（Pagination）**：一次撈太多資料又慢又耗記憶體。該分頁的查詢（`Query`／`Scan`／各種 List API）就乖乖帶著分頁游標（如 DynamoDB 的 `LastEvaluatedKey`）一頁一頁拿，別硬塞一大包。

## 固定段落：哪種快取 / 哪種調校，怎麼選、為什麼、優缺點、何時別用

這是本篇的決策核心。遇到題目或實務抉擇，照這張對照表想。

### CloudFront

- **為什麼選它**：它把內容快取在**離使用者最近的邊緣節點**，全球使用者都能就近拿到，延遲最低，還順便擋掉大量回源流量、省後端成本。
- **優點**：全球低延遲、卸掉源站負載、整合 WAF／TLS、對靜態資產幾乎零改造。
- **缺點**：主要適合**可快取的內容**；高度個人化、每次都不同的動態回應獲益有限。快取失效要管（改檔後要讓邊緣更新）。
- **何時別用**：內容每個人每次都不同、無法快取時，CloudFront 幫不上快取的忙（但仍可當安全/傳輸入口）。

### API Gateway 快取

- **為什麼選它**：同一個 GET 請求短時間被打很多次時，直接在 API 層回快取，**連後端 Lambda 都不用觸發**，省延遲也省 Lambda 費用。
- **優點**：開啟簡單（階段層設定）、直接減少後端呼叫、可依請求參數區分快取鍵。
- **缺點**：**快取容量要額外付費**（按小時 × 容量）、TTL 內可能回到舊資料。
- **何時別用**：寫入類請求、或要求「永遠即時最新」的資料；低流量 API 開了也不划算。

### ElastiCache（Redis / Memcached）

- **為什麼選它**：它是**通用**的記憶體快取，什麼後端都能擋——資料庫查詢結果、Session、排行榜、計數器都行，由你的程式主動讀寫。
- **優點**：超低延遲、通用彈性大、Redis 還有豐富資料結構與持久化選項。
- **缺點**：**要自己管理快取邏輯**（命中/未命中、失效、一致性都得寫）、是你要維運的叢集。
- **何時別用**：只是要加速 DynamoDB 讀取、又不想寫快取邏輯時——那該用 DAX，不是 ElastiCache。

### DAX

- **為什麼選它**：**專給 DynamoDB**，幾乎不用改程式就把讀取從毫秒降到微秒，讀多寫少的場景一掛上去立刻有感。
- **優點**：與 DynamoDB API 相容（程式改動極小）、微秒級讀取、省讀取容量費用。
- **缺點**：**只服務 DynamoDB**（別的資料庫碰不到）、是「讀取快取」，對大量寫入或強一致讀沒幫助。
- **何時別用**：後端不是 DynamoDB、或你需要強一致讀（DAX 走最終一致的快取路徑）。

### Lambda 記憶體調校（配 Power Tuning）

- **為什麼選它**：記憶體連動 CPU，調對了能**同時變快又變便宜**，是投報率最高的一招。
- **優點**：零程式改動（只改設定）、CPU 密集型收益巨大、Power Tuning 幫你找精確甜蜜點。
- **缺點**：過了甜蜜點再加記憶體只是多花單價；要靠量測、不能亂猜。
- **何時別用**：函式瓶頸是在**等外部 I/O**（等資料庫/API 回應）而非 CPU 時，加記憶體幾乎沒用——該去優化那個 I/O。

### Provisioned Concurrency

- **為什麼選它**：要**消除冷啟動**、保證低延遲的可預測流量，唯一直接的解。
- **優點**：呼叫直接命中熱環境、延遲穩定可預測。
- **缺點**：**開著就持續計費**（不管有沒有被呼叫）、流量尖峰超過預置量仍會冷啟動。
- **何時別用**：流量很零散、不在意首次那點延遲的背景工作——開了只是白燒錢。

## 實務應用：不只是考試

<Scenario title="真實情境：一個又慢又貴的查詢 API，怎麼一路調到快又便宜">

你有個 `GET /product/{id}` 的 API：API Gateway → Lambda → DynamoDB。使用者抱怨慢，帳單也偏高。你照「先量再改」的順序動手：

1. **量**：看 CloudWatch 發現 Lambda 執行時間偏長、DynamoDB 讀取量異常大。翻程式碼發現用了 `Scan` 找資料、而且 client 建在 handler 裡。
2. **改鍵與查法**：把 `Scan` 改成以分割鍵 `id` 的 `GetItem`，一次命中。
3. **移連線**：把 DynamoDB client 搬到 handler 外層重用。
4. **調記憶體**：跑 Power Tuning，發現 512 MB 是這支函式兼顧速度與成本的甜蜜點。
5. **加快取**：熱門商品反覆被查，掛上 **DAX** 擋掉重複讀取；再在 API Gateway 開短 TTL 快取擋掉同一秒的洪峰。

結果：p99 延遲從數百毫秒掉到數十毫秒，DynamoDB 讀取量與 Lambda 計費毫秒都明顯下降——又快又便宜。

</Scenario>

### 🛠️ 動手做：把連線移到 handler 外層，前後對照

這是最便宜、最有感的一招。請跟著做一次，親眼看到前後差異。

```bash
# 1) 準備兩份函式程式碼，差別只在 client 建立的位置

# ── before.js（錯誤示範：client 建在 handler 裡，每次呼叫都重建）──
cat > before.js <<'EOF'
exports.handler = async () => {
  const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
  const client = new DynamoDBClient({});   // ❌ 每次呼叫都 new
  return { ok: true };
};
EOF

# ── after.js（正確示範：client 放外層，冷啟動建一次、之後重用）──
cat > after.js <<'EOF'
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const client = new DynamoDBClient({});     // ✅ Init 階段只建一次
exports.handler = async () => ({ ok: true });
EOF

# 2) 分別部署後，各打 100 次，比較 Duration（執行時間）
#    用 CloudWatch Logs Insights 查每次呼叫的 Duration：
aws logs start-query \
  --log-group-name /aws/lambda/your-func \
  --start-time $(date -d '-15 min' +%s) \
  --end-time $(date +%s) \
  --query-string 'fields @duration | stats avg(@duration), pct(@duration, 99)'
```

:::tip[🎯 預期結果：你應該看到什麼]
- **before 版**：每次呼叫的 `Duration` 都偏高且波動大（每次都在重建 client）；冷啟動與熱啟動差異不明顯，因為「重物」每次都跑。
- **after 版**：**第一次（冷啟動）稍慢**（要建 client），但**之後的呼叫 Duration 明顯下降且穩定**，因為 client 被重複利用。平均延遲下降 →  計費毫秒變少 → **帳單同步下降**。
- 做 Power Tuning 時，典型會看到：記憶體從 128 MB 往上調，執行時間先快速下降、成本先降後升，交會處就是你的**甜蜜點**。
:::

<Cost>

最佳化的本質是「少做白工」，所以多半**省錢與提速同時發生**。但有兩個會「持續計費」的項目要特別節制：**Provisioned Concurrency**（為保持溫熱、開著就收費）與 **API Gateway 快取容量**（按小時 × 容量收費）——只在真的需要時開，用完或不需要就關掉。ElastiCache／DAX 是你在跑的叢集，也是持續成本，要評估命中率是否真的划算。練習完記得把測試用的函式、快取叢集、Provisioned Concurrency 設定清乾淨。

</Cost>

:::warning[🚑 常踩雷]
- **記憶體給太低想省錢，結果又慢又貴**：記憶體連動 CPU，CPU 密集函式給太少記憶體，執行時間暴增、計費毫秒反而更多。用 Power Tuning 找甜蜜點。
- **每次呼叫都重建連線 / SDK client**：放在 handler 裡 → 每次冷熱啟動都重建，又慢又浪費。一律放 handler 外層重用，並讓連線保持 keep-alive。
- **沒想快取一致性與失效就亂加快取**：加了快取卻不設 TTL／不處理失效，使用者一直拿到舊資料。先想清楚「這份資料能容忍多舊」，再設對的 TTL 與失效策略。
- **以為 DAX 什麼都能快取**：**DAX 只服務 DynamoDB**。要通用快取（別的資料庫、Session…）請用 ElastiCache。
- **過早最佳化、沒先量測就動手**：憑感覺調一堆，結果調錯地方。先用 CloudWatch／X-Ray 量出真正的瓶頸，改最痛的那段，改完再量一次驗證。
- **把 Reserved 當成能消冷啟動**：消冷啟動是 Provisioned Concurrency 的事；Reserved 只是配額上下限，別混淆。
- **還在用 `Scan` 當日常查詢**：`Scan` 讀過整張表、為每筆付費。改用分割鍵 `Query`，需要非鍵查詢就建 GSI。
:::

<Refs>

- [AWS Lambda 效能最佳化](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [AWS Lambda Power Tuning（GitHub）](https://github.com/alexcasalboni/aws-lambda-power-tuning)
- [設定 Lambda 記憶體與 CPU 連動](https://docs.aws.amazon.com/lambda/latest/dg/configuration-memory.html)
- [Lambda Provisioned Concurrency](https://docs.aws.amazon.com/lambda/latest/dg/provisioned-concurrency.html)
- [Amazon DynamoDB Accelerator（DAX）](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DAX.html)
- [DynamoDB 最佳實務（分割鍵設計、避免 Scan）](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [Amazon ElastiCache](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/WhatIs.html)
- [API Gateway 快取](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-caching.html)
- [Amazon CloudFront](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Introduction.html)

</Refs>

## 下一步

👉 下一篇：[疑難排解與 AI 輔助除錯](./troubleshooting-ai-assisted.md)
