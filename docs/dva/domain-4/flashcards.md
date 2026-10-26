---
sidebar_position: 6
title: Domain 4 閃卡
---

# Domain 4 閃卡

點一下卡片即可翻開說明。這頁把 Domain 4「疑難排解與最佳化」的開發者重點濃縮成一張張小卡，涵蓋 CloudWatch 可觀測性、X-Ray 追蹤、錯誤處理與重試、效能調校與快取，考前快速複習最有效率。

## CloudWatch 可觀測性

<Flashcards>
  <Flashcard term="日誌群組 vs 日誌串流">日誌群組（Log Group）是同一個應用程式日誌的大櫃子，可設保留天數與加密；日誌串流（Log Stream）是櫃子裡一個來源（如某個執行個體、某個 Lambda 執行環境）的時間序列事件。查錯時先選群組、再看是哪條串流出問題。</Flashcard>
  <Flashcard term="自訂指標（Custom Metric）">內建指標（CPU、呼叫次數）之外，你自己用 PutMetricData 送上去的業務數字，例如「下單成功筆數」「購物車金額」。能針對應用程式真正在意的事做監控與告警，而不只看機器層面。</Flashcard>
  <Flashcard term="EMF（嵌入式指標格式）">把指標直接「藏」在結構化 JSON 日誌裡的一種格式。你照常寫日誌，CloudWatch 讀到就自動抽出成指標，省掉另外呼叫 PutMetricData 的額外 API 與延遲，很適合 Lambda 這種高頻短命的環境。</Flashcard>
  <Flashcard term="CloudWatch 告警（Alarm）">盯著某個指標，當它超過你設的門檻並持續一段時間（如 CPU &gt; 80% 連續 5 分鐘），就改變狀態並觸發動作：發 SNS 通知、自動擴縮或執行自動修復。是「出事主動通知你」的核心機制。</Flashcard>
  <Flashcard term="Logs Insights">用類 SQL 的查詢語法在大量日誌裡撈資料、統計與排序，例如「找出回應時間最長的前 20 筆請求」。比肉眼翻日誌串流快得多，是事後查錯與分析的利器。</Flashcard>
  <Flashcard term="結構化日誌（Structured Logging）">把日誌寫成 JSON 這類有欄位的格式（而非一整串純文字），讓 Logs Insights 能直接依欄位過濾與彙總。養成輸出 requestId、userId 等欄位的習慣，查錯會輕鬆很多。</Flashcard>
</Flashcards>

## CloudWatch vs CloudTrail vs X-Ray

<Flashcards>
  <Flashcard term="CloudWatch vs CloudTrail vs X-Ray">三者常被搞混：CloudWatch 看「系統表現如何」（指標、日誌、告警）；CloudTrail 記「誰在什麼時候呼叫了哪個 API」（稽核與安全）；X-Ray 追「一個請求在各服務間怎麼流動、慢在哪」（分散式追蹤）。要查誰刪了資源找 CloudTrail，要查為什麼變慢找 X-Ray。</Flashcard>
  <Flashcard term="CloudTrail">記錄帳號內所有 AWS API 呼叫的稽核日誌：誰（哪個身分）、何時、從哪個 IP、對哪個資源做了什麼。用來追查「是誰改了設定／刪了儲存貯體」以及符合法遵要求，不是拿來看效能的。</Flashcard>
</Flashcards>

## X-Ray 分散式追蹤

<Flashcards>
  <Flashcard term="Trace / Segment / Subsegment">Trace 是「一個請求從頭到尾的完整旅程」；Segment 是旅程中「某一個服務」做的事（如 API Gateway、某個 Lambda）；Subsegment 是該服務內「更細的一步」（如呼叫 DynamoDB、打外部 HTTP）。層層展開就能看出時間花在哪一段。</Flashcard>
  <Flashcard term="Annotation vs Metadata">兩者都是你附加在 trace 上的額外資訊。Annotation 會建索引、可拿來在 X-Ray 裡過濾與搜尋（如 userId、orderStatus），只能放簡單值；Metadata 不建索引、不能搜尋，但能放大塊的詳細資料供事後檢視。要搜尋就用 annotation。</Flashcard>
  <Flashcard term="Service Map（服務地圖）">X-Ray 自動把各服務畫成節點與連線的圖，標出每段的延遲、流量與錯誤率。一眼就能看出哪個下游服務是瓶頸或在噴錯，是排查分散式系統的起點。</Flashcard>
  <Flashcard term="X-Ray 取樣（Sampling）">不是每個請求都完整追蹤，而是依取樣規則抽一部分（如每秒保底 1 筆 + 其餘 5%），兼顧觀測品質與成本／效能。流量很大時靠取樣避免 trace 量與費用爆炸。</Flashcard>
  <Flashcard term="X-Ray Daemon / SDK">應用程式用 X-Ray SDK 產生 trace 資料，先送給本機的 X-Ray daemon（或 Lambda 內建代理），daemon 再批次上傳到 X-Ray 服務。知道這條路徑，才懂為何在 EC2/ECS 上要自己跑 daemon 並給對 IAM 權限。</Flashcard>
</Flashcards>

## 錯誤處理與重試

<Flashcards>
  <Flashcard term="指數退避 + 抖動（Backoff + Jitter）">重試失敗請求時，等待時間一次比一次久（1s、2s、4s…）叫指數退避，避免一直猛打把下游壓垮；再加上隨機抖動（jitter），讓大量用戶端不要「同時」重試造成尖峰。兩者合用才是正確的重試姿勢。</Flashcard>
  <Flashcard term="冪等（Idempotency）">同一個操作重複執行多次，結果跟做一次一樣，不會重複扣款或重複建單。做法通常是帶一個唯一的冪等鍵（idempotency key）。因為重試與 at-least-once 投遞會造成重複，所以寫入類操作務必設計成冪等。</Flashcard>
  <Flashcard term="DLQ（死信佇列）">訊息重試多次仍處理失敗，就把它丟到一個專門的「死信佇列」而不是無限重試或直接丟掉。保留失敗訊息供事後分析與重放，SQS、SNS、Lambda 非同步呼叫都支援設定 DLQ。</Flashcard>
  <Flashcard term="部分批次失敗（Partial Batch Failure）">Lambda 一次處理一批 SQS/串流訊息時，若整批回報失敗會害已成功的也被重送。改回報 batchItemFailures 只把「真正失敗的那幾筆」交回重試，成功的不再重複處理，大幅減少重工。</Flashcard>
  <Flashcard term="可重試 vs 不可重試錯誤">節流（429/ThrottlingException）、5xx、逾時這類暫時性錯誤「可重試」，退避一下再試通常會好；而 400 參數錯誤、403 權限不足、找不到資源這類「不可重試」，重試幾次也一樣錯，應直接回報不要浪費重試。</Flashcard>
  <Flashcard term="429 / ThrottlingException">你呼叫 API 太快、超過服務的速率上限時收到的節流錯誤。正確反應是指數退避加抖動後重試，並考慮降低呼叫頻率、提高配額或用批次與快取減少請求，而不是無腦狂重試。</Flashcard>
  <Flashcard term="斷路器（Circuit Breaker）">當某個下游持續失敗時，暫時「跳閘」停止再打它，直接快速失敗或走備援，過一陣子再試探性放行。避免把資源與時間浪費在注定失敗的呼叫上，也給下游喘息復原的機會。</Flashcard>
</Flashcards>

## 效能與快取

<Flashcards>
  <Flashcard term="Lambda 記憶體 ↔ CPU">Lambda 沒有獨立調 CPU 的旋鈕——你調的是記憶體，CPU（與網路頻寬）會依記憶體成比例一起變多。所以「跑太慢」有時加記憶體反而更快又更便宜，因為執行時間縮短，值得用 Power Tuning 找甜蜜點。</Flashcard>
  <Flashcard term="連線重用（Connection Reuse）">把資料庫連線、SDK 用戶端這些昂貴物件建在處理函式「外面」（初始化階段），讓同一個執行環境的後續呼叫重複使用，不用每次都重新建連線。這是降低 Lambda 延遲最有效的小改動之一。</Flashcard>
  <Flashcard term="Provisioned Concurrency（預置並發）">預先把一批 Lambda 執行環境初始化好、隨時待命，讓請求進來免去冷啟動的延遲。適合對延遲敏感、流量可預期的場景；缺點是即使沒請求也要付費，要和 On-demand 權衡成本。</Flashcard>
  <Flashcard term="冷啟動（Cold Start）">Lambda 某個執行環境第一次被用到時，要先下載程式、啟動執行期、跑初始化，這段額外延遲就是冷啟動。可用 provisioned concurrency、精簡套件、連線重用、選對執行期來緩解。</Flashcard>
  <Flashcard term="ElastiCache">放在資料庫前面的記憶體快取（Redis／Memcached），把熱門查詢結果暫存起來，讓重複讀取不必每次都打資料庫。常用 cache-aside 模式大幅降低讀取延遲與資料庫負載，記得設 TTL 處理資料新鮮度。</Flashcard>
  <Flashcard term="DAX（DynamoDB Accelerator）">專為 DynamoDB 設計的記憶體快取層，讓讀取從毫秒級降到微秒級，而且和 DynamoDB API 相容、幾乎不用改程式。適合極高頻的讀取密集情境；只加速讀、對寫入與強一致性讀沒幫助。</Flashcard>
  <Flashcard term="API Gateway 快取">在 API Gateway 這一層對某個端點的回應做快取，設定 TTL 後相同請求直接回快取，不必每次都觸發後端 Lambda 或整合。能降低後端負載與延遲、省呼叫成本，適合變動不頻繁的 GET 查詢。</Flashcard>
  <Flashcard term="CloudFront">AWS 的 CDN，把靜態內容（甚至動態 API 回應）快取在全球各地的邊緣節點，讓使用者就近取得、降低延遲與來源負載。常擺在 S3、API Gateway、ALB 前面，是面向終端使用者的第一層快取與加速。</Flashcard>
</Flashcards>

## AI 輔助除錯

<Flashcards>
  <Flashcard term="Amazon Q Developer">AWS 的 AI 開發助手，可在 IDE 或主控台裡幫你解讀錯誤訊息、分析 CloudWatch 日誌、找出效能瓶頸並提出修正建議，加快疑難排解。DVA-C03 新增「AI 輔助開發」重點，把它當成陪你一起查錯與最佳化的夥伴。</Flashcard>
</Flashcards>

👉 來測驗：[Domain 4 練習題](./quiz.md)
