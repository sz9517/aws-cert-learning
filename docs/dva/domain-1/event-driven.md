---
sidebar_position: 5
title: 事件驅動與解耦
---

# 事件驅動與解耦：讓服務之間「不綁死、不互相拖垮」

> 這篇從**開發者視角**講 SQS / SNS / EventBridge / Step Functions：訊息怎麼送、怎麼不重複處理、失敗怎麼辦、多個服務怎麼協調。這是 DVA-C03 Domain 1（用 AWS 服務開發）的超高頻考點。

<Vocab title="📌 先認識這篇會出現的名詞（完全沒碰過也能懂）">

- **解耦（Decoupling）**：在兩個服務中間放一層「緩衝」，就算下游暫時掛了，資料也先存著不會掉，下游好了再慢慢處理。
- **SQS（Simple Queue Service）**：AWS 的**訊息佇列**，像排隊的信箱，發送方把訊息丟進去，接收方自己來「拉」出來處理。
- **SNS（Simple Notification Service）**：AWS 的**發布/訂閱通知服務**，像群組公告，一則訊息同時「推」給所有訂閱者。
- **EventBridge**：AWS 的**事件匯流排**，像一個聰明的總機：各種事件丟進來，它依「規則」比對後，自動轉送給該收的目標。
- **Step Functions**：AWS 的**工作流協調器**，用「狀態機」把多個步驟（多個 Lambda、多個服務）串成有順序、有分支、會重試的流程。
- **冪等性（Idempotency）**：同一則訊息就算被處理很多次，結果也跟只處理一次一樣，不會重複扣款、重複出貨。

</Vocab>

:::note[💬 閱讀小提示]
文章裡只要看到帶<Term desc="像這樣！滑鼠移到有虛線的名詞上（手機點一下），就會跳出白話解釋。">虛線底線的名詞</Term>，把滑鼠移上去就會跳出白話解釋。所有名詞也都整理在 [名詞與服務對照表](/glossary)。
:::

## 一句話先懂「為什麼要解耦」

<Scenario title="真實情境：使用者上傳一張照片">

你的 App 讓使用者上傳大頭照，上傳後要做三件事：**產縮圖、掃描違規內容、寄確認信**。最笨的寫法是上傳的 API 一口氣同步做完這三件事——結果使用者按下上傳後要**等 8 秒**才有回應，而且只要「寄信」那段的服務掛了，**整個上傳就失敗**。

</Scenario>

**解法**：上傳成功後只丟一則「照片已上傳」的事件就立刻回應使用者，後面三件事交給 SQS / SNS / EventBridge 非同步去跑。使用者 0.5 秒就收到成功，三個後端各做各的、互不影響，任一個暫時掛掉也不會拖垮上傳本身。這就是**事件驅動（event-driven）**的核心價值：**快、彈性、一處壞不會全線崩**。

### 不解耦會怎樣？（白話講「為什麼」）

把前後兩個服務**直接同步串死**（上游呼叫下游、等它回應才繼續），看起來最簡單，但代價是：

- **一個慢，全部慢**：下游寄信要 3 秒，使用者就得多等 3 秒，體感直接變差。
- **一個掛，全部掛**：下游掛了，上游的呼叫就報錯，連「上傳」這種跟寄信無關的事也一起失敗。
- **擴充被互相綁死**：尖峰時下游處理不過來，上游只能跟著卡住或丟棄請求，流量一來就雪崩。
- **改一個動全身**：要換掉寄信服務，上游程式也得跟著改、重測、重上線。

**解耦就是在中間墊一層緩衝（佇列／主題／匯流排）**，換來四個實實在在的好處：

| 解耦帶來的好處 | 白話說明 |
| --- | --- |
| **削峰填谷** | 尖峰訊息先堆在佇列，下游用穩定速度慢慢消化，不會被瞬間流量打爆。 |
| **容錯** | 下游暫時掛了，訊息留著不掉，等它好了再處理，上游完全無感。 |
| **獨立擴充** | 上游、下游各自依自己的負載擴充，互不牽制。 |
| **獨立演進** | 只要事件格式不變，換掉／新增下游不用動上游。 |

:::info[🔑 一句話記住「為什麼解耦」]
**同步 = 兩人用一條繩子綁在一起走路，一個跌倒兩個都倒；解耦 = 中間放個信箱，各走各的、誰都不拖累誰。** 代價是多了一層「非同步」的複雜度（順序、重複、延遲要自己管），所以不是什麼都該解耦——**只要求即時回傳結果的同步查詢（例如查餘額）就別硬塞佇列**。
:::

<Analogy title="🏣 生活比喻：信箱、廣播、總機、流水線">

- **SQS＝公寓信箱**：郵差把信投進信箱就走，你有空再下樓「領」。一對一、用拉的、信會等你。
- **SNS＝社區廣播器**：管理員喊一次「包裹到囉」，整棟樓同時聽到。一對多、用推的。
- **EventBridge＝大樓總機**：各種訊息進來，它看「這通找誰」的規則，自動轉接給對的部門。會依內容分流。
- **Step Functions＝工廠流水線領班**：先做 A，A 成功才做 B，B 失敗就重試三次，再不行就走例外流程。管的是「順序與流程」。

</Analogy>

## SQS：最常用的「緩衝佇列」

SQS 讓發送方（producer）和接收方（consumer）徹底分開：發送方丟訊息、接收方自己來拉，中間完全不需要同時在線。

### 標準佇列 vs FIFO 佇列

| | 標準佇列（Standard） | FIFO 佇列 |
| --- | --- | --- |
| 順序 | **不保證**先進先出 | **嚴格**先進先出 |
| 重複 | 可能極少數重複送達（at-least-once） | **精準一次處理**（不重複） |
| 吞吐量 | 幾乎無上限，超高 | 預設較低（可開高吞吐量模式） |
| 名稱 | 任意命名 | 佇列名**必須**以 `.fifo` 結尾 |
| 何時用 | 順序不重要、要爆量 | 金流、訂單狀態等**順序與不重複很重要**時 |

:::info[🔑 FIFO 去重怎麼做]
FIFO 用 **MessageGroupId** 決定哪些訊息要照順序（同一 group 內嚴格排序，不同 group 可平行），用 **MessageDeduplicationId**（或開內容去重）在 5 分鐘內過濾重複。開發者送訊息時這兩個參數常是考點。
:::

:::tip[💡 標準 vs FIFO 怎麼選：別為了「安心」就無腦選 FIFO]
FIFO 的「嚴格順序 + 不重複」不是免費的，它有**實打實的代價**：

- **吞吐量低很多**：標準佇列幾乎無上限；FIFO 預設 **每秒 300 筆訊息**（批次 `SendMessageBatch` 可到 3,000 筆/秒），開「高吞吐量模式」才更高，但仍遠不如標準。
- **順序其實被 MessageGroupId 綁住**：同一個 group 內是**單線處理**，你沒辦法用多個消費者平行吃同一個 group，想提高並行度就得把訊息拆到更多 group。
- **成本略高**：FIFO 的每百萬次請求單價比標準貴。

**選型原則**：

- **預設先選標準佇列**——絕大多數背景工作（產縮圖、寄信、記 log）根本不在乎順序，標準的超高吞吐 + 低成本最划算，只要**消費端做好冪等**就能吸收偶發的重複送達。
- **只有「順序錯了會出事」或「絕不能重複」時才上 FIFO**：例如同一帳戶的交易必須照先後順序、同一訂單的狀態轉換（建立→付款→出貨）不能亂。
- 真的要嚴格順序又要高吞吐，記得**用 MessageGroupId 把不相關的實體分流**（例如用 `帳戶ID` 當 group），讓不同帳戶之間能平行。
:::

### 可見性逾時（Visibility Timeout）—— 開發者最常踩

當某個接收方拉走一則訊息開始處理時，這則訊息會先對其他接收方「隱形」一段時間，這段就是<Term en="Visibility Timeout" desc="訊息被某個接收方拉走處理時，暫時對其他人隱形的一段時間，避免被重複領取。預設 30 秒，最長 12 小時。">可見性逾時</Term>（預設 30 秒，最長 12 小時）。接收方處理完要主動呼叫 `DeleteMessage` 把訊息刪掉；**沒刪**（例如處理途中掛了），逾時一到訊息就重新可見，被下一個接收方拉走重試。

:::warning[🚑 可見性逾時設錯的後果（兩個方向都會出事）]
**設太短**：處理一則訊息要 60 秒，但可見性逾時只有 30 秒 → 第一台還在處理，訊息就重新可見被第二台拉走 → **同一筆被處理兩次**（重複扣款、重複出貨）。原則：**可見性逾時 ≥ 最久處理時間**；處理時間不確定時，可在處理中呼叫 `ChangeMessageVisibility` 動態延長。

**設太長**：萬一消費者處理途中**當掉且沒刪訊息**，這則訊息要等到你設的逾時（最長 12 小時）到期才會重新可見 → **重試被延遲很久**，訊息看起來「卡住」不動。

**配 Lambda 事件來源映射時的坑**：官方建議**佇列的可見性逾時 ≥ Lambda 逾時的 6 倍**。設太接近，Lambda 還沒跑完訊息就重新可見被重複觸發；差太多又拖慢重試。
:::

### 長輪詢（Long Polling）

預設的**短輪詢**即使佇列空了也立刻回空回應，造成大量無效請求與較高費用。**長輪詢**讓 `ReceiveMessage` 等到有訊息、或等到你設的 `WaitTimeSeconds`（最長 20 秒）才回。開發上幾乎都該開長輪詢：**更省錢、更即時、更少空回應**。

### 死信佇列（DLQ）

某則訊息重試很多次都失敗（格式壞掉、下游永久錯誤），就該把它丟到<Term en="Dead-Letter Queue" desc="專門收那些一直處理失敗的訊息的獨立佇列，方便事後排查，避免壞訊息無限重試卡住整條佇列。">死信佇列</Term>隔離。設定方式是在來源佇列掛一個 **redrive policy**，指定 `maxReceiveCount`（例如收 5 次還沒刪就移到 DLQ）。這樣壞訊息不會無限重試卡住整條線，你還能事後到 DLQ 查問題。

### 訊息大小上限與冪等性

- **訊息大小上限 256 KB**。超過（例如要傳一張圖）用 **SQS Extended Client**：把大內容放 S3，佇列裡只放指向 S3 的指標。
- **標準佇列可能重複送達**，加上失敗會重試，所以**消費端一定要做冪等**：用訂單編號、MessageDeduplicationId 等當唯一鍵先查「這筆我是不是處理過了」，處理過就直接略過，避免重複扣款/出貨。

## SNS：發布/訂閱與扇出

SNS 是**推**模式：發布者把訊息丟進一個 **Topic（主題）**，所有訂閱該主題的目標同時收到。訂閱者可以是 Lambda、SQS、HTTP/S、Email、SMS…

### 扇出（Fan-out）：SNS + SQS 的黃金組合

一則事件要同時給好幾個下游、而且每個下游都要**各自有緩衝、不掉訊息**時，標準答案是 **SNS 主題 + 多個 SQS 佇列**：SNS 推一次，每個 SQS 各收一份、各自依能力慢慢消化。

<div className="flow">
  <div className="flow-node">照片已上傳</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">SNS 主題</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">SQS：產縮圖</div>
  <div className="flow-arrow">＋</div>
  <div className="flow-node">SQS：內容掃描</div>
  <div className="flow-arrow">＋</div>
  <div className="flow-node">SQS：寄信</div>
</div>

*圖：一則「照片已上傳」事件透過 SNS 扇出，三個下游各收一份、互不影響，任一個掛了也不會漏訊息。*

:::tip[💡 考試重點：SNS vs SNS+SQS]
- 只要「即時推播、不在乎緩衝」（例如推手機通知）→ **SNS 直接接 Lambda / HTTP**。
- 「要廣播、又要每個下游各自有緩衝、不能掉訊息」→ **SNS + 多個 SQS（扇出）**。
- 記住：**SNS 推出去的當下若下游沒收到就沒了**（Lambda 會重試、SQS 會留著），要「保證收得到且能緩衝」就在中間墊 SQS。
:::

### 🛠️ 動手做：串一條 SNS → SQS 扇出（含最容易漏的佇列權限）

```bash
# 1) 建主題與佇列，取回 ARN/URL（實際請用你回傳的值替換）
$ aws sns create-topic --name photo-uploaded
# 預期輸出："TopicArn": "arn:aws:sns:ap-northeast-1:123456789012:photo-uploaded"

$ aws sqs create-queue --queue-name thumbnail-queue
# 預期輸出："QueueUrl": "https://sqs.ap-northeast-1.amazonaws.com/123456789012/thumbnail-queue"

# 2) 取得佇列 ARN（訂閱與授權都會用到）
$ aws sqs get-queue-attributes \
    --queue-url https://sqs.ap-northeast-1.amazonaws.com/123456789012/thumbnail-queue \
    --attribute-names QueueArn
# 預期輸出："QueueArn": "arn:aws:sqs:ap-northeast-1:123456789012:thumbnail-queue"

# 3) 【最關鍵、最常漏】給佇列掛 access policy，允許該 SNS 主題投遞
$ aws sqs set-queue-attributes \
    --queue-url https://sqs.ap-northeast-1.amazonaws.com/123456789012/thumbnail-queue \
    --attributes '{"Policy":"{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Principal\":{\"Service\":\"sns.amazonaws.com\"},\"Action\":\"sqs:SendMessage\",\"Resource\":\"arn:aws:sqs:ap-northeast-1:123456789012:thumbnail-queue\",\"Condition\":{\"ArnEquals\":{\"aws:SourceArn\":\"arn:aws:sns:ap-northeast-1:123456789012:photo-uploaded\"}}}]}"}'
# 沒有輸出（成功）；少了這步 → 下面 publish 不會報錯，但 SQS 永遠收不到訊息（無聲失敗）

# 4) 訂閱：把佇列掛到主題底下
$ aws sns subscribe \
    --topic-arn arn:aws:sns:ap-northeast-1:123456789012:photo-uploaded \
    --protocol sqs \
    --notification-endpoint arn:aws:sqs:ap-northeast-1:123456789012:thumbnail-queue
# 預期輸出："SubscriptionArn": "arn:aws:sns:...:photo-uploaded:xxxxxxxx-...."

# 5) 發布一則事件
$ aws sns publish \
    --topic-arn arn:aws:sns:ap-northeast-1:123456789012:photo-uploaded \
    --message "photo-001 uploaded"
# 預期輸出："MessageId": "abc123-...."

# 6) 到 SQS 把它拉出來（證明扇出通了）
$ aws sqs receive-message \
    --queue-url https://sqs.ap-northeast-1.amazonaws.com/123456789012/thumbnail-queue \
    --wait-time-seconds 10
# 預期：Body 是一包 SNS 封裝的 JSON，裡面的 "Message" 欄位就是 "photo-001 uploaded"
```

:::info[🔑 為什麼第 3 步非做不可]
`aws sns subscribe` 只是「登記」佇列是訂閱者，**它不會自動給 SQS 投遞權限**。SNS 要把訊息放進 SQS，靠的是**該佇列自己的 access policy**。漏了這一步，`publish` 照樣成功回 MessageId，但訊息投不進佇列、也不報錯——這就是扇出最常見的「以為通了其實沒通」。用主控台建訂閱時 AWS 常自動幫你補這條政策，用 CLI/IaC 要自己加。
:::

## EventBridge：事件匯流排與規則比對

EventBridge 比 SNS 更聰明：它是一個**事件匯流排（event bus）**，事件進來後用**規則（rule）**依內容（來源、類型、欄位值）比對，符合的才轉送到對應**目標（target）**。一個事件可以觸發多個目標。

- **事件模式比對（event pattern）**：用 JSON 條件過濾，例如「只有 `detail.status = FAILED` 的訂單事件才通知值班群組」。這種「依內容分流」是 SNS 做不到的（SNS 的過濾只能靠 message attributes，較陽春）。
- **排程規則（scheduled rules）**：用 cron 或 rate 表達式定時觸發目標，例如每天凌晨 2 點跑一支清檔 Lambda。這是**無伺服器版的排程器**，取代你自己開 EC2 跑 cron。
- **第三方/SaaS 與 AWS 服務事件**：很多 AWS 服務（S3、CodePipeline…）和 SaaS 會原生發事件到 EventBridge，不用你輪詢。

:::info[🔑 EventBridge vs SNS vs SQS 怎麼選]
- **SQS**：我要一個**緩衝佇列**，一對一、接收方自己拉、削峰填谷。
- **SNS**：我要**低延遲、高吞吐的一對多推播**（扇出），目標單純。
- **EventBridge**：我要**依事件內容做複雜路由／過濾**、接 AWS 服務事件、或要**排程**。延遲略高於 SNS，但路由能力最強。
:::

## Step Functions：協調多步驟工作流

當一個流程有**順序、分支、重試、平行**時，與其在一支肥大的 Lambda 裡用一堆 try/catch 硬寫，不如用 Step Functions 的**狀態機**把每一步拆開、用視覺化流程串起來。它內建重試、錯誤捕捉（Catch/Retry）、平行（Parallel）、迴圈（Map）等狀態，流程一目了然也好除錯。

### Standard vs Express

| | Standard 工作流 | Express 工作流 |
| --- | --- | --- |
| 最長執行 | 最長 1 年 | 最長 5 分鐘 |
| 執行模型 | 精準一次（exactly-once） | 至少一次（at-least-once） |
| 計價 | 依**狀態轉換次數** | 依**執行次數與時長** |
| 執行歷史 | 完整保留、可視覺化回溯 | 走 CloudWatch Logs |
| 何時用 | 長流程、要稽核、人工審核等 | 高頻、短時、串流/事件處理 |

:::tip[💡 考試重點：Step Functions]
- 看到「**協調（orchestrate）多個 Lambda／多個服務、有順序與分支、要內建重試**」→ Step Functions。
- 看到「**超高頻、每筆幾秒內、量超大、可容忍極少數重複**」→ **Express**；「**長流程、要完整執行歷史與稽核**」→ **Standard**。
- 別把「協調（Step Functions）」和「緩衝（SQS）」、「廣播（SNS）」搞混，它們解決的是不同問題。
:::

## 四者選型深潛：優缺點、選誰、什麼時候別用

前面各別介紹了四個服務，這段把它們**攤開對照**，講清楚「為什麼選它、它的短處、以及什麼情況反而別用它」。這正是 DVA 情境題最愛考的判斷。

### SQS：優缺點與別用時機

- **為什麼選它**：你要一個**最單純的緩衝**——削峰填谷、背景工作佇列，一對一、接收方自己拉。基礎建設最省心、最便宜。
- **優點**：幾乎無限吞吐（標準）、託管不用自己顧、內建 DLQ 與重試、免費額度大方。
- **缺點**：**拉（pull）模式**要有消費者主動來拉（或靠 Lambda 事件來源映射代拉）；一則訊息**只給一個消費者**，天生不是廣播；沒有內容路由能力。
- **什麼時候別用**：要**一對多廣播** → 該用 SNS；要**依內容分流／接 AWS 服務事件／排程** → 該用 EventBridge；要**協調多步驟流程** → 該用 Step Functions。別把 SQS 硬拗成廣播（得自己開 N 個佇列各送一份，笨）。

### SNS：優缺點與別用時機

- **為什麼選它**：一則事件要**同時**通知多個下游（扇出），而且要**低延遲、高吞吐的推播**。
- **優點**：一對多推播、延遲低、能直接推 Lambda/SQS/HTTP/Email/SMS；配 SQS 就能做到「廣播又各自有緩衝」。
- **缺點**：**推出去當下沒收到就沒了**（SNS 本身不留訊息，要緩衝得墊 SQS）；過濾只能靠 message attributes，**比 EventBridge 陽春很多**，做不到依 payload 欄位值的複雜路由。
- **什麼時候別用**：要**依事件內容做複雜路由／過濾**、要**接收 AWS 服務原生事件（S3、CodePipeline…）**、要**排程** → 都該用 EventBridge；只需要一對一緩衝 → SQS 就夠，別多一層 SNS。

### EventBridge：優缺點與別用時機

- **為什麼選它**：你要一個**聰明的事件中樞**——依事件內容（來源、類型、欄位值）做複雜路由與過濾，或要吃 AWS 服務／SaaS 的原生事件，或要排程。
- **優點**：路由能力最強（JSON event pattern）、原生接上百種 AWS 服務事件、內建排程（cron/rate）、可做 schema registry、支援多個 event bus。
- **缺點**：**延遲比 SNS 略高**；吞吐上限、每秒 API 配額比 SNS/SQS 低；規則寫複雜了**不好除錯**；超高頻的純扇出用它反而大材小用。
- **什麼時候別用**：**超低延遲、超高吞吐的純扇出** → SNS 更對味；**單純緩衝** → SQS；**只是要有順序的多步驟流程** → Step Functions。

### Step Functions：優缺點與別用時機

- **為什麼選它**：一個流程有**明確的順序、分支、重試、平行、人工審核**，與其塞進一支肥大 Lambda 用一堆 try/catch 硬寫，不如用狀態機拆開、視覺化串起來。
- **優點**：內建重試／錯誤捕捉（Retry/Catch）、平行（Parallel）、迴圈（Map）、等待（Wait）、人工審核（Task Token）；流程視覺化、好稽核、好除錯；可直接整合 200+ AWS 服務（不一定要寫 Lambda）。
- **缺點**：**多一層協調服務要設計與維護**；Standard 依狀態轉換次數計價，**步驟一多成本就上來**；流程本身就是「有狀態、有順序」的，**不適合純非同步的「射後不理」**。
- **什麼時候別用（重要）**：

  - **只是要把訊息緩衝一下** → 用 SQS 就好，**別上 Step Functions**（殺雞用牛刀，又貴又複雜）。
  - **只是要一對多廣播** → SNS。
  - **只是單一步驟的非同步處理** → 直接 SNS/SQS 觸發 Lambda，不需要狀態機。
  - **超高頻、每秒幾萬筆的簡單事件流** → 即使要用 Step Functions 也得選 **Express**，而且要知道它**只保證至少一次、不保證恰好一次**。

:::tip[💡 一題看懂選型：同一個「照片上傳」情境，需求變了選的就不同]
- 「上傳後**慢慢**產縮圖，順序不拘」→ **SQS**（緩衝 + Lambda 慢慢拉）。
- 「上傳後**同時**產縮圖、掃描、寄信，各自要緩衝不掉訊息」→ **SNS + 多個 SQS**（扇出）。
- 「只有**特定來源 bucket** 或 **特定副檔名** 的上傳才處理」→ **EventBridge**（依內容過濾）。
- 「上傳後要**先掃描，通過才產縮圖，被判違規就走人工審核，全程要稽核**」→ **Step Functions**（有順序、有分支、要稽核）。
:::

## 何時用哪個？一分鐘小結

| 你的需求 | 選這個 |
| --- | --- |
| 緩衝削峰、背景工作佇列、一對一、接收方自己拉 | **SQS** |
| 一事件多下游、低延遲一對多推播（扇出） | **SNS**（＋多個 **SQS** 要緩衝時） |
| 依事件內容做複雜路由／過濾、接 AWS 服務事件、定時排程 | **EventBridge** |
| 多步驟流程要有順序、分支、重試、稽核 | **Step Functions** |
| 強調順序不能亂、訊息不能重複 | **SQS FIFO** |

## 實務應用：建一個 SQS 佇列並送收訊息

<Scenario title="真實情境：訂單尖峰削峰">

雙 11 下單量是平常的 20 倍。你把流程改成「API → 丟進 SQS → 訂單處理 Lambda 自己拉」。尖峰時佇列暫存了 50 萬筆訂單，Lambda 用穩定的速度慢慢消化，**全程沒有一筆訂單掉失，前端 API 也一路順暢**。

</Scenario>

### 🛠️ 動手做：用 CLI 體驗「丟」和「拉」是分開的

```bash
# 建一個標準佇列
$ aws sqs create-queue --queue-name my-first-queue

# 丟一則訊息進佇列（發送方）
$ aws sqs send-message \
    --queue-url https://sqs.ap-northeast-1.amazonaws.com/123456789012/my-first-queue \
    --message-body "Hello Queue"

# 接收方自己來「拉」訊息（開長輪詢，最多等 20 秒）
$ aws sqs receive-message \
    --queue-url https://sqs.ap-northeast-1.amazonaws.com/123456789012/my-first-queue \
    --wait-time-seconds 20

# 處理完記得刪掉，否則可見性逾時一到會被重新拉走
$ aws sqs delete-message \
    --queue-url https://sqs.ap-northeast-1.amazonaws.com/123456789012/my-first-queue \
    --receipt-handle "<上一步回傳的 ReceiptHandle>"
```

<Cost>

SQS、SNS、EventBridge 都有**免費方案額度**（SQS/SNS 各每月 100 萬次請求、EventBridge 自家事件免費），一般練習幾乎不會產生費用。Step Functions 的 Standard 依狀態轉換次數計價、Express 依執行次數與時長計價，練習量都很小。真正要留意的是你**拉訊息或處理事件的運算資源**（如常駐 EC2），練習完記得關掉。

</Cost>

:::warning[🚑 實務常見錯誤]
- **可見性逾時設太短** → 同一筆被處理兩次。原則：逾時 ≥ 最久處理時間；配 Lambda 時建議佇列逾時 ≥ Lambda 逾時的 6 倍。
- **消費端沒做冪等** → 標準佇列重複送達或重試時造成重複扣款/出貨。用唯一鍵（訂單編號等）先查「這筆處理過沒」再處理。**冪等是整個事件驅動架構的保命符**，不是可選項。
- **沒設 DLQ** → 一則壞訊息無限重試、吃光吞吐量。正式環境務必掛 redrive policy + DLQ。
- **以為 SNS 會幫你留訊息** → 推出去當下沒下游收就沒了，要緩衝就墊 SQS。
- **訊息超過 256 KB 還硬塞 SQS** → 會被拒。大內容放 S3，佇列只放指標（SQS Extended Client）。
- **SNS → SQS 扇出漏設權限** → 訊息「送出去了卻沒進 SQS」。SNS 要能把訊息投進 SQS，**該 SQS 佇列的 access policy 必須允許 `sns.amazonaws.com` 的 `sqs:SendMessage`**（通常用 `aws:SourceArn` 綁定該 SNS 主題）。只建訂閱、不設佇列政策，訊息會被默默丟掉——這是扇出最常見的「無聲失敗」。
- **以為 Step Functions Express 保證恰好一次** → Express 是**至少一次（at-least-once）**，流程可能被整段重跑，所以 Express 裡的每一步**都要冪等**。要「恰好一次」得用 **Standard**。
- **無腦選 FIFO** → FIFO 吞吐低、成本高、同 group 單線處理。沒有「順序不能亂／不能重複」的硬需求就選標準佇列 + 冪等。
:::

<Refs>

- [Amazon SQS 開發人員指南](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html)
- [Amazon SNS 開發人員指南](https://docs.aws.amazon.com/sns/latest/dg/welcome.html)
- [Amazon EventBridge 使用者指南](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-what-is.html)
- [AWS Step Functions 開發人員指南](https://docs.aws.amazon.com/step-functions/latest/dg/welcome.html)

</Refs>

👉 下一篇：[AI 輔助開發](./ai-assisted-dev.md)
