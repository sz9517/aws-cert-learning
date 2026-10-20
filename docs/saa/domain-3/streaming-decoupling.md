---
sidebar_position: 6
title: 高效能解耦與資料串流：Kinesis 與 SQS
---

# 用佇列與串流「吸收尖峰、撐住高吞吐」

> 本篇從**效能**角度切入：當流量瞬間暴增、資料像消防水管一樣湧進來，怎麼用 SQS 與 Kinesis 把尖峰吸掉、讓後端穩穩地高吞吐處理。這是 Domain 3 高效能架構很常考的選型題。

<Vocab title="📌 先認識這篇會出現的名詞（完全沒碰過也能懂）">

- **佇列（Queue）**：一條「**排隊的隊伍**」。訊息先進來排隊，後端有空才一筆一筆拿出來處理，處理完就刪掉。
- **串流（Stream）**：一條「**持續流動的資料河**」。事件一筆接一筆流進來，消費者沿著河讀取，資料會在河裡保留一段時間。
- **生產者／消費者（Producer / Consumer）**：**丟資料進來的人**叫生產者（例如前端 App）、**把資料拿出來處理的人**叫消費者（例如後端服務）。
- **尖峰（Spike）**：短時間內流量暴衝，例如秒殺、直播開場、促銷活動。
- **吞吐量（Throughput）**：單位時間能處理多少筆資料，數字越大代表越能扛量。

</Vocab>

:::note[💬 閱讀小提示]
文章裡只要看到帶<Term desc="像這樣！滑鼠移到有虛線的名詞上（手機點一下），就會跳出白話解釋。">虛線底線的名詞</Term>，把滑鼠移上去就會跳出白話解釋。所有名詞也都整理在 [名詞與服務對照表](/glossary)。
:::

## 為什麼需要它？先講一個會出事的例子

假設你的秒殺網站，前端直接把每一筆下單「**同步**」丟給後端資料庫處理。平常沒事，但促銷一開場，**每秒湧進十萬筆**請求，後端資料庫瞬間被打爆、連線塞爆、整站回應變超慢甚至當機。問題出在：**前端的尖峰速度，遠超過後端的處理速度**，中間沒有緩衝。

解法是：在前後端中間放一個**佇列或串流**當緩衝。前端只負責「把訊息丟進去」（很快），後端則「**照自己的步調**」把訊息一筆一筆拿出來處理。尖峰被緩衝區吸掉，後端不會被打爆，整體還能維持高吞吐——這就是「**用佇列／串流吸收尖峰**」。

> 💡 從「鬆耦合、容錯」的架構角度看同一件事，可以參考 Domain 2 的 [應用程式解耦（Decoupling）](/saa/domain-2/decoupling)；本篇專講**效能**面的「吸收尖峰、提升吞吐」。

## 一句話先懂這兩個服務

**SQS（Simple Queue Service）** 是全代管的**訊息佇列**：訊息排隊，一個消費者拿去處理完就**刪掉**，適合任務分派與吸收尖峰。**Kinesis** 是**即時資料串流**平台：資料像河一樣流動，**多個消費者可以各自重複讀取**同一份資料，適合即時分析與遙測。

<Analogy title="🏢 生活比喻：郵局的「取號機」vs 電視台的「直播訊號」">

- **SQS 像郵局取號機**：每個客人抽一張號碼牌排隊，櫃台叫到號就服務「**那一位**」，服務完這張號碼牌就作廢（訊息被刪）。一張號碼牌只會被叫一次。
- **Kinesis 像電視台直播訊號**：同一個訊號**同時**送給千千萬萬台電視（多個消費者），每台都能自己收看，還能用 DVR **倒帶重看**（重播保留期內的資料）。訊號不會因為某台電視看過就消失。
- 要「一人一單、處理完就結束」用取號機（SQS）；要「大家同時收、還能重播」用直播訊號（Kinesis）。

</Analogy>

## 三種選擇怎麼選（最重要的一張表）

| 服務 | 本質 | 消費方式 | 資料保留 | 最適合 |
| --- | --- | --- | --- | --- |
| **SQS** | 訊息佇列 | 一筆被**一個**消費者取走、處理後**刪除**（一次性消費） | 預設 4 天、最長 14 天 | 任務分派、吸收尖峰、鬆耦合的背景工作 |
| **Kinesis Data Streams** | 即時串流 | **多個**消費者可各自讀、**可重播**、保有順序 | 預設 24 小時、最長 365 天 | 即時分析、遙測、點擊流、需多消費者/重播 |
| **Kinesis Data Firehose** | 串流載入管線 | 自動**近即時**寫入目的地（免寫消費端程式） | 不保留（直接送走） | 把串流資料自動入湖到 S3／Redshift／OpenSearch |

<Term en="Simple Queue Service" desc="全代管的訊息佇列服務。訊息排隊，一個消費者處理完就刪除，適合任務分派與吸收流量尖峰。">SQS</Term> 的重點是「**一次性、吸尖峰**」：前端狂丟訊息，後端照自己步調慢慢消化，訊息被某台處理完就刪掉，不會重複。<Term en="Kinesis Data Streams" desc="即時資料串流服務。資料保留一段時間，多個消費者可各自重複讀取並保有順序，用分片擴展吞吐。">Kinesis Data Streams</Term> 的重點是「**可重播、多消費者、保有順序**」：同一份點擊流，可以同時給「即時儀表板」「異常偵測」「資料倉儲」三組消費者各讀各的。

### Kinesis 怎麼擴展吞吐？認識「分片 Shard」

Kinesis Data Streams 的吞吐量是由<Term en="Shard" desc="Kinesis 串流的最小吞吐單位。一個分片有固定的寫入/讀取上限，加分片就能線性放大整條串流的吞吐。">分片（Shard）</Term>決定的。**一個分片 = 一條固定吞吐的小水管**（寫入約 1 MB/s 或 1000 筆/s）。當每秒事件變多、水管不夠粗，就**加分片**，吞吐量隨之線性放大——這就是 Kinesis 達成「每秒上百萬事件」的方式。

### Firehose：不想自己寫消費端，就讓它自動入湖

<Term en="Kinesis Data Firehose" desc="全代管的串流載入服務。自動把串流資料近即時地批次寫入 S3、Redshift、OpenSearch 等目的地，不用自己寫消費程式。">Kinesis Data Firehose</Term> 解決的是「**資料進來了，但我懶得寫程式把它搬到儲存體**」。你只要把串流接到 Firehose，它會**近即時**地自動緩衝、壓縮、批次寫入 S3、Redshift 或 OpenSearch，完全免維護消費端程式。要的是「**串流資料自動入湖、免寫程式**」就用它。

:::tip[💡 考試重點]
看到關鍵字直接對應，幾乎是送分：
- 題目講 **即時串流、多個消費者要讀同一份、要可重播、要保有順序** → **Kinesis Data Streams**
- 題目講 **把串流資料自動載入到 S3／Redshift、近即時、免寫程式** → **Kinesis Data Firehose**
- 題目講 **單純任務佇列、一個消費者處理後刪除、吸收尖峰讓後端不被打爆** → **SQS**
- 題目講 **每秒上百萬事件的遙測／點擊流（click-stream）** → **Kinesis**
:::

## 運作流程圖解

<div className="flow">
  <div className="flow-node">生產者（前端尖峰流量）</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">佇列／串流吸收尖峰（緩衝）</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">後端消費者照自己步調處理</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">穩定高吞吐、後端不被打爆</div>
</div>

*圖：中間的佇列／串流當緩衝，把前端的尖峰吸掉，後端以穩定速度高吞吐消化，單一後端慢或暫停都不影響收資料。*

## 實務應用：不只是考試

<Scenario title="真實情境：直播開場那一秒，後端被互動訊息打爆">

你做一個直播互動 App，平常每秒幾百則留言沒事，但知名實況主一開台，**瞬間每秒數十萬則**留言、按讚、送禮事件湧入。原本前端直接寫資料庫，開台那一刻資料庫連線爆滿、全體卡頓。老闆要求「**開台尖峰不能再卡、事件一筆都不能掉、之後還要能回放做數據分析**」。——答案：事件先丟進 Kinesis Data Streams（可重播、多消費者），一組消費者做即時儀表板、再用 Firehose 自動把原始事件入湖到 S3 供事後分析。下面帶你做一次最小版 SQS 緩衝。

</Scenario>

### 🛠️ 動手做：用 SQS 當緩衝吸收尖峰

1. AWS 主控台搜尋 `SQS` → **建立佇列**，類型選 `Standard`（標準佇列，高吞吐），其餘預設即可。
2. 記下佇列的 **URL**。讓前端（生產者）把每筆任務用 `send-message` 丟進佇列，前端丟完就回應使用者，**不用等後端處理完**。
3. 後端（消費者）持續用 `receive-message` 把訊息拉出來處理，處理成功後用 `delete-message` 刪掉它。
4. 故意一次灌入大量訊息模擬尖峰，你會看到佇列裡訊息暫時堆積（被緩衝住），後端照自己步調慢慢清——**後端完全不會被打爆**。

```bash
# 丟一筆訊息進佇列（生產者）
$ aws sqs send-message \
    --queue-url <你的佇列URL> \
    --message-body "order-12345"

# 拉一筆訊息出來處理（消費者），處理完要記得刪
$ aws sqs receive-message --queue-url <你的佇列URL>
```

<Cost>

SQS **按請求數計費**，每月有一大筆免費額度（百萬級請求），一般練習幾乎零成本。Kinesis Data Streams **按分片小時 + 資料量計費**，分片是**開著就收錢**，練習完一定要**刪掉串流／調降分片**。Firehose 按寫入資料量計費。練習完記得清掉佇列與串流，避免分片持續計費。

</Cost>

:::warning[🚑 實務常見錯誤]
- **拿 SQS 當「要多消費者重播」的方案**：SQS 訊息一次性消費、處理完就刪，無法像 Kinesis 那樣多組消費者各讀各的、還能倒帶重播。
- **用 Kinesis 做單純的任務佇列**：若只是一人一單的背景工作，SQS 更簡單便宜，硬用 Kinesis 反而要管分片。
- **分片開太少撐不住尖峰**：寫入超過分片上限會收到 `ProvisionedThroughputExceeded`，尖峰前要估好分片數或改用隨量模式。
- **SQS 消費者忘了刪訊息**：處理完沒 `delete-message`，過了可見性逾時訊息會重新出現、被重複處理。
:::

<Refs>

- [AWS 官方文件：Amazon SQS 開發人員指南](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html)
- [Amazon Kinesis Data Streams 開發人員指南](https://docs.aws.amazon.com/streams/latest/dev/introduction.html)
- [Amazon Data Firehose 說明](https://docs.aws.amazon.com/firehose/latest/dev/what-is-this-service.html)
- [Kinesis Data Streams：分片與容量](https://docs.aws.amazon.com/streams/latest/dev/key-concepts.html)
- [SQS 標準佇列與 FIFO 佇列比較](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-queue-types.html)

</Refs>

## 下一步

- ⚡ 快速複習：[Domain 3 重點速記 / 閃卡](/saa/domain-3/flashcards)
- ✍️ 測試自己：[Domain 3 原創練習題](/saa/domain-3/quiz)
- 📖 下一篇：[可擴展的網路與儲存模式](/saa/domain-3/scalability-patterns)
