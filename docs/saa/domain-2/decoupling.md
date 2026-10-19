---
sidebar_position: 4
title: 解耦架構（SQS 與 SNS）
---

# 解耦架構：讓系統「一個壞掉，其他照跑」

> 本篇教你用 SQS 與 SNS 把系統拆開，這是 Domain 2（彈性）最愛考的題型之一。

<Vocab title="📌 先認識這篇會出現的名詞（完全沒碰過也能懂）">

- **緊耦合（Tightly Coupled）**：A 直接呼叫 B，B 一掛掉 A 就跟著卡住或報錯，像兩個齒輪死死咬在一起。
- **解耦（Decoupling）**：在 A 和 B 中間放一個「緩衝」，就算 B 暫時掛了，訊息也先存著不會掉，B 好了再慢慢處理。
- **SQS（Simple Queue Service）**：AWS 的「**訊息佇列**」，像一個**排隊的信箱**，發送方丟訊息進去，接收方自己來「拉」出來處理。
- **SNS（Simple Notification Service）**：AWS 的「**通知／廣播服務**」，像一個**群組公告**，一則訊息同時「推」給所有訂閱者。

</Vocab>

:::note[💬 閱讀小提示]
文章裡只要看到帶<Term desc="像這樣！滑鼠移到有虛線的名詞上（手機點一下），就會跳出白話解釋。">虛線底線的名詞</Term>，把滑鼠移上去就會跳出白話解釋。所有名詞也都整理在 [名詞與服務對照表](/glossary)。
:::

## 一句話先懂「為什麼要解耦」

<Scenario title="真實情境：購物網站大特賣當機了">

你的下單流程是「網頁 → 直接呼叫 → 處理訂單的伺服器」。平常沒事，但雙 11 瞬間湧入 10 倍流量，處理訂單的伺服器被塞爆、整個掛掉，**連帶讓前面的網頁也卡住，客人連「加入購物車」都做不了**。這就是緊耦合的惡夢：一個環節壞，全線崩。

</Scenario>

**解法**：在中間放一個 <Term en="Simple Queue Service" desc="AWS 的訊息佇列，像排隊的信箱，發送方丟訊息、接收方自己拉出來處理。">SQS</Term> 佇列。網頁只要把訂單「丟進佇列」就立刻回覆客人「已收到」，後面的伺服器再依自己的速度慢慢拉出來處理。流量暴衝時，佇列會幫你**把尖峰的水量先存起來**，伺服器不會被沖垮。這招叫 **削峰填谷（buffering）**。

<Analogy title="🏣 生活比喻：郵局信箱 vs 社區廣播">

- **SQS＝公寓的信箱**：郵差（發送方）把信投進你的信箱就走，你（接收方）有空再自己下樓「領」出來。信會乖乖等著，不會因為你還沒領就消失。**一對一、用拉的**。
- **SNS＝社區廣播器**：管理員喊一次「包裹到囉」，**整棟樓所有住戶同時聽到**。訊息是「推」出去的，一次通知一大群。**一對多、用推的**。

</Analogy>

## 同步 vs 非同步：解耦的本質

| | 同步（緊耦合） | 非同步（解耦） |
| --- | --- | --- |
| 做法 | A 呼叫 B，站在原地等 B 做完 | A 把工作丟進佇列就走，不等 |
| B 掛掉時 | A 跟著失敗 | 訊息留在佇列，B 復原後照常處理 |
| 流量暴衝 | B 被沖垮，A 也卡死 | 佇列當緩衝，B 依能力慢慢消化 |

## SQS vs SNS：最常考的對照

| 項目 | SQS（佇列） | SNS（發布/訂閱） |
| --- | --- | --- |
| 模式 | 一對一，接收方**主動拉**（pull） | 一對多，**主動推**（push）給訂閱者 |
| 訊息留存 | 會留著等人領（最長 14 天） | 推完就沒了，沒訂閱者就收不到 |
| 典型用途 | 緩衝、削峰、背景工作佇列 | 即時通知、扇出、一事件多處理 |
| 接收方 | 通常是 EC2/Lambda 來拉 | Email、簡訊、Lambda、SQS… |

### SQS 兩種佇列：標準 vs FIFO

| | 標準佇列（Standard） | FIFO 佇列 |
| --- | --- | --- |
| 順序 | **不保證**先進先出 | **嚴格**先進先出（First-In-First-Out） |
| 重複 | 可能極少數重複送達（at-least-once） | **精準一次**，不重複 |
| 吞吐量 | 幾乎無上限，超高 | 有上限（較低） |
| 何時用 | 順序不重要、要爆量 | 金流、訂單編號等**順序與不重複很重要**時 |

:::tip[💡 考試重點]
- 題目出現「**緩衝、削峰填谷、背景處理、怕流量暴衝沖垮後端**」→ 選 **SQS**。
- 題目出現「**一個事件要同時通知很多個對象／一對多推播／扇出（fan-out）**」→ 選 **SNS**。
- 題目要「**又要廣播、又要每個下游各自有緩衝不掉訊息**」→ 經典答案是 **SNS + 多個 SQS（扇出模式）**：SNS 推一次，每個 SQS 各收一份、各自慢慢處理。
- 題目強調「**訊息不能重複、順序不能亂**」（例如交易、庫存扣減）→ 選 **FIFO 佇列**。
:::

## 扇出（Fan-out）流程圖解

<div className="flow">
  <div className="flow-node">訂單事件</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">SNS 主題</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">SQS：出貨</div>
  <div className="flow-arrow">＋</div>
  <div className="flow-node">SQS：發票</div>
  <div className="flow-arrow">＋</div>
  <div className="flow-node">SQS：數據分析</div>
</div>

*圖：一則「訂單成立」事件透過 SNS 扇出，出貨、發票、分析三個系統各收一份、互不影響，任一個掛了也不會漏訊息。*

## 兩個一定要懂的機制

- **可見逾時（<Term en="Visibility Timeout" desc="訊息被某個接收方拉走處理時，暫時對其他人「隱形」的一段時間，避免被重複領取。">Visibility Timeout</Term>）**：某台伺服器拉走一則訊息開始處理時，這則訊息會先「隱形」一段時間，避免別台也拉到同一則、重複處理。**設太短** → 第一台還沒做完，訊息又變可見被別人拉走 → **重複處理**；**設太長** → 處理失敗時要等很久才會重新出現。
- **死信佇列（<Term en="Dead-Letter Queue" desc="專門收那些一直處理失敗的訊息的獨立佇列，方便事後排查，避免壞訊息無限重試卡住整條佇列。">DLQ, Dead-Letter Queue</Term>）**：某則訊息重試很多次都失敗（例如格式壞掉），就把它丟到一個專用的「死信佇列」隔離起來，方便你事後查，也避免它無限重試卡住整條線。

## 實務應用：不只是考試

<Scenario title="真實情境：訂單尖峰削峰">

雙 11 下單量是平常的 20 倍。你把流程改成「網頁 → 丟進 SQS → 訂單伺服器自己拉」。尖峰時佇列暫存了 50 萬筆訂單，伺服器用穩定的速度慢慢消化，**全程沒有一筆訂單掉失，網頁也一路順暢**。這就是 SQS 當緩衝的威力。

</Scenario>

### 🛠️ 動手做：建一個 SQS 佇列並送收訊息

1. 登入 AWS 主控台 → 搜尋列輸入 `SQS` → 進入 Simple Queue Service
2. 點 **建立佇列**，類型選 **標準（Standard）**，命名為 `my-first-queue` → 建立
3. 進入佇列，右上角點 **傳送並接收訊息**
4. 在「訊息內容」輸入 `Hello Queue`，按 **傳送訊息**
5. 往下在「接收訊息」區按 **輪詢訊息（Poll for messages）**，就會看到剛剛那則訊息被「拉」出來

也可以用 CLI 體驗「丟」和「拉」是分開的兩個動作：

```bash
# 丟一則訊息進佇列（發送方）
$ aws sqs send-message \
    --queue-url https://sqs.ap-northeast-1.amazonaws.com/123456789012/my-first-queue \
    --message-body "Hello Queue"

# 接收方自己來「拉」訊息
$ aws sqs receive-message \
    --queue-url https://sqs.ap-northeast-1.amazonaws.com/123456789012/my-first-queue
```

<Cost>

SQS 與 SNS 都有**免費方案額度**（各每月 100 萬次請求），一般練習幾乎不會產生費用。超過後也是以「每百萬次請求」計價，非常便宜。真正要留意的是你**拉訊息的 EC2**可能計費，練習完記得關掉。

</Cost>

:::warning[🚑 實務常見錯誤]
- **可見逾時設太短** → 第一台還在處理，訊息就重新可見被第二台拉走，變成**同一筆訂單處理兩次**。原則：Visibility Timeout 要 ≥ 你處理一則訊息最久需要的時間。
- **沒設死信佇列（DLQ）** → 一則壞訊息無限重試，不斷佔用資源、吃掉吞吐量，還可能把整條佇列拖垮。正式環境務必設 DLQ。
- **以為 SNS 會幫你留訊息** → SNS 推出去的當下若沒有訂閱者，訊息就**沒了**。要「保證下游一定收得到且能緩衝」就要接 SQS。
:::

<Refs>

- [AWS 官方文件：Amazon SQS 開發人員指南](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html)
- [Amazon SNS 開發人員指南](https://docs.aws.amazon.com/sns/latest/dg/welcome.html)
- [SQS Visibility Timeout 說明](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html)
- [SNS + SQS 扇出（Fanout）模式](https://docs.aws.amazon.com/sns/latest/dg/sns-common-scenarios.html)

</Refs>

## 下一步

- ⚡ 快速複習：[Domain 2 重點速記 / 閃卡](/saa/domain-2/flashcards)
- ✍️ 測試自己：[Domain 2 原創練習題](/saa/domain-2/quiz)
- 📖 下一篇：[DNS 與流量路由（Route 53）](/saa/domain-2/route53)
