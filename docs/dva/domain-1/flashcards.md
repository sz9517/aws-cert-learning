---
sidebar_position: 7
title: Domain 1 閃卡
---

# Domain 1 閃卡

點一下卡片即可翻開說明。這頁把 Domain 1「用 AWS 服務開發」的開發者重點濃縮成一張張小卡，考前快速複習最有效率。

## Lambda

<Flashcards>
  <Flashcard term="冷啟動（Cold Start）">函式閒置後第一次被叫用，要先拉起執行環境、載入程式碼，會多花幾百毫秒。對延遲敏感可用 Provisioned Concurrency 預熱。</Flashcard>
  <Flashcard term="版本（Version）">發佈後的不可變快照，程式碼與設定都凍結。每次發佈產生一個遞增版本號，方便回溯。</Flashcard>
  <Flashcard term="別名（Alias）">指向某個版本的可移動指標（如 prod 指向 v3）。改別名就能切換流量，還能設加權做金絲雀部署。</Flashcard>
  <Flashcard term="並發（Concurrency）">同一時間正在執行的函式執行個體數。可用 Reserved Concurrency 保留額度或設上限避免拖垮下游。</Flashcard>
  <Flashcard term="重試行為">非同步叫用預設重試 2 次，失敗可送 DLQ 或 Lambda Destinations；串流來源（Kinesis/DynamoDB）會卡住該分片直到成功或過期。</Flashcard>
  <Flashcard term="執行角色（Execution Role）">Lambda 執行時用的 IAM 角色，決定它能存取哪些 AWS 資源。權限不足時先查這個角色。</Flashcard>
</Flashcards>

## API Gateway

<Flashcards>
  <Flashcard term="REST / HTTP / WebSocket API">REST 功能最全（含 API key、請求驗證）；HTTP API 更便宜、延遲更低、功能較精簡；WebSocket 支援雙向即時連線。</Flashcard>
  <Flashcard term="代理整合（Proxy Integration）">把整個請求原封不動轉給後端（Lambda 或 HTTP），由後端自己解析，省去逐一對應參數的設定。</Flashcard>
  <Flashcard term="授權方（Authorizer）">決定誰能呼叫 API：可用 Cognito、IAM，或 Lambda Authorizer 自訂驗證邏輯（如驗 JWT）。</Flashcard>
  <Flashcard term="用量計畫（Usage Plan）">搭配 API key 對呼叫方做節流（throttle）與配額（quota）限制，常用於開放給第三方的 API。</Flashcard>
  <Flashcard term="CORS">瀏覽器跨來源請求要在 API Gateway 設 CORS，回應正確的 Access-Control 標頭，否則前端會被擋。</Flashcard>
</Flashcards>

## DynamoDB

<Flashcards>
  <Flashcard term="分區鍵 / 排序鍵（PK / SK）">PK 決定資料分散到哪個分區；加上 SK 可在同一 PK 下排序與範圍查詢，兩者合成複合主鍵。</Flashcard>
  <Flashcard term="LSI vs GSI">LSI 與主表共用 PK、只換 SK，建表時就要定、強一致可用；GSI 可換不同 PK/SK、隨時增刪、只支援最終一致。</Flashcard>
  <Flashcard term="RCU / WCU">容量單位。1 RCU＝每秒 1 次強一致讀 4KB（最終一致可讀兩倍）；1 WCU＝每秒寫 1KB。超量會被節流。</Flashcard>
  <Flashcard term="Query vs Scan">Query 靠主鍵精準命中、只讀需要的資料，效率高；Scan 掃全表很耗容量，盡量避免。</Flashcard>
  <Flashcard term="強一致 vs 最終一致">強一致讀一定拿到最新值但較貴；最終一致可能短暫讀到舊值，便宜且為預設。</Flashcard>
  <Flashcard term="DynamoDB Streams">記錄項目的新增/修改/刪除變更，可觸發 Lambda 做後續處理（如同步、通知），資料保留 24 小時。</Flashcard>
  <Flashcard term="DAX">DynamoDB 專用的記憶體快取，把讀取延遲從毫秒降到微秒，對讀多、常讀同樣資料的情境很有效。</Flashcard>
  <Flashcard term="指數退避（Exponential Backoff）">遇到節流（ProvisionedThroughputExceeded）時，重試間隔逐次拉長再加隨機抖動，避免一直撞牆。SDK 預設已內建。</Flashcard>
</Flashcards>

## S3 與 SDK、快取

<Flashcards>
  <Flashcard term="預簽章 URL（Presigned URL）">用你的憑證產生一條帶時效的網址，讓沒有 AWS 權限的人也能臨時上傳或下載特定物件。</Flashcard>
  <Flashcard term="分段上傳（Multipart Upload）">把大檔切成多段平行上傳、可斷點續傳，大於 100MB 建議用、大於 5GB 一定要用。</Flashcard>
  <Flashcard term="憑證鏈（Credential Chain）">SDK 依序找憑證：環境變數 → 共用設定檔 → IAM 角色（EC2/ECS/Lambda）。程式裡別硬寫金鑰，交給角色最安全。</Flashcard>
  <Flashcard term="ElastiCache 延遲載入（Lazy Loading）">先查快取，沒命中才讀資料庫並寫回快取。省空間，但首次 miss 較慢、資料可能過期。</Flashcard>
  <Flashcard term="ElastiCache 寫入直通（Write-Through）">寫資料庫時同時更新快取，讀取永遠命中且新鮮；缺點是寫入變慢、快取可能存到從沒被讀的資料。</Flashcard>
</Flashcards>

## 事件驅動與解耦

<Flashcards>
  <Flashcard term="SQS 可見性逾時（Visibility Timeout）">訊息被取走處理時暫時對其他消費者隱藏的時間。太短會重複處理，太長則失敗後要等很久才能重試。</Flashcard>
  <Flashcard term="SQS FIFO 佇列">保證順序且訊息只處理一次（exactly-once），用 MessageGroupId 分組；吞吐量比標準佇列低。</Flashcard>
  <Flashcard term="死信佇列（DLQ）">多次處理仍失敗的訊息會被丟到這裡，方便事後排查，避免毒訊息卡住整個佇列。</Flashcard>
  <Flashcard term="SNS 扇出（Fan-out）">一則訊息發佈到主題後，同時推給多個訂閱者（多個 SQS / Lambda / HTTP），一對多廣播。</Flashcard>
  <Flashcard term="EventBridge">事件匯流排，可依規則比對事件內容路由到不同目標，還能接上百種 SaaS 來源，比 SNS 更適合複雜事件路由。</Flashcard>
  <Flashcard term="Step Functions：Standard vs Express">Standard 適合長流程、可稽核、每次轉換計費；Express 適合高頻短流程、依執行時間計費、吞吐量高。</Flashcard>
</Flashcards>

## AI 輔助開發

<Flashcards>
  <Flashcard term="Amazon Q Developer">AWS 的 AI 編碼助手，能在 IDE 裡補全程式、解釋與重構程式碼、產生測試、協助除錯與升級，是 DVA-C03 新納入的重點。</Flashcard>
</Flashcards>

👉 來測驗：[Domain 1 練習題](./quiz.md)
