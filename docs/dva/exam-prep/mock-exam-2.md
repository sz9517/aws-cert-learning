---
sidebar_position: 3
title: DVA 綜合模擬考 B 卷（65 題）
---

# DVA-C03 綜合模擬考 B 卷（65 題）

這是第二份對齊真實考試規模的完整模擬卷（B 卷）：65 題，涵蓋官方四大領域，以開發者視角出題。建議限時約 90 分鐘（約 1.4 分鐘/題）模擬真實節奏，先全部做完再對答案。所有題目皆為原創、仿官方 DVA-C03 情境式風格（情境式題幹＋限定詞＋含複選），非真實考題，與第一份模擬卷不重複、盡量換不同情境角度。題目依官方四領域權重分區配置，其中含數題複選（Choose TWO），題幹會標明「選兩項」，請選滿不多不少。每題先自己點選答案，再展開詳解對照「為何對、其他為何錯」。

## 第一部分 · 用 AWS 服務開發（第 1–20 題）

<Quiz
  qnum={1}
  total={65}
  question="某團隊的 Lambda 需要讀取同一組設定值（如下游服務網址）數千次，目前每次叫用都呼叫 Parameter Store 取值，造成額外延遲與 API 限流。希望在不犧牲正確性的前提下大幅降低取值次數。下列哪個做法最合適？"
  options={[
    '把參數值寫死在程式碼中以免呼叫',
    '在 handler 外（初始化階段）取值並在執行環境內快取，搭配合理 TTL 後再重取',
    '每次叫用都改用 GetParametersByPath 一次抓整個路徑',
    '把參數放進部署套件的純文字檔隨函式一起打包',
  ]}
  answer={1}>

**正解：B** — Lambda 會重複使用執行環境，在 handler 外取值並於暖呼叫快取，搭配合理 TTL 定期刷新，可大幅減少對 Parameter Store 的呼叫且仍能更新。A 寫死值無法更新且難維護；C 一次抓整路徑仍是每次叫用都打 API、未解決次數問題；D 打包純文字檔等於寫死、改值要重新部署。

</Quiz>

<Quiz
  qnum={2}
  total={65}
  question="開發者要用 DynamoDB 儲存使用者的待辦事項，查詢模式是「依使用者取其最近 N 筆、且可依建立時間排序」。下列哪個索引鍵設計最合適？"
  options={[
    'userId 當分割索引鍵、createdAt 當排序索引鍵，查詢時 Query 並以 ScanIndexForward 控制排序',
    'userId 當唯一主鍵（只有分割索引鍵），其餘欄位全靠 Scan 過濾',
    '把所有待辦放在同一個分割索引鍵值以方便一次取回',
    '用隨機 UUID 當分割索引鍵，查詢時全表 Scan',
  ]}
  answer={0}>

**正解：A** — 以 userId 為分割索引鍵、createdAt 為排序索引鍵，可用 Query 高效取某使用者的項目並依時間排序（ScanIndexForward 決定升/降冪、Limit 取最近 N 筆）。B 只有分割索引鍵無法在表內排序與範圍查詢；C 全部塞同一個分割索引鍵值會造成熱分割；D 隨機主鍵無法依使用者查詢，只能全表掃描。

</Quiz>

<Quiz
  qnum={3}
  total={65}
  question="一個 Step Functions 工作流程要協調多個 Lambda，依前一步結果決定分支，並在某步驟失敗時自動重試與補償。下列哪個描述最符合使用 Step Functions 的理由？"
  options={[
    '用它可把重試、分支、錯誤處理與狀態轉移宣告在狀態機中，免在程式裡手寫協調邏輯',
    '它會自動把所有 Lambda 合併成單一函式以降低成本',
    '它只能做固定順序、不支援條件分支',
    '它會取代 DynamoDB 作為資料儲存',
  ]}
  answer={0}>

**正解：A** — Step Functions 以狀態機宣告式地描述步驟順序、Choice 條件分支、Retry/Catch 錯誤處理與補償，讓協調邏輯可視化且可重試，不必在各函式裡手刻協調。B 它不會合併函式；C 它支援 Choice 等條件分支；D 它是協調服務，不是資料儲存。

</Quiz>

<Quiz
  qnum={4}
  total={65}
  question="開發者要讓一個 API Gateway REST API 在整合不同後端時先「驗證請求格式（必填欄位、JSON 結構）」，不合格就直接回 400、不浪費後端資源。下列哪個 API Gateway 功能最直接？"
  options={[
    '請求驗證（request validation）搭配模型（model）與必要參數設定',
    '把驗證全部塞進後端 Lambda 自己判斷',
    '啟用 WAF 擋掉格式錯誤',
    '把 API 設為私有端點',
  ]}
  answer={0}>

**正解：A** — API Gateway 可用請求驗證搭配 JSON Schema 模型與必要的查詢/標頭參數設定，在抵達後端前就擋下格式不符的請求並回 400。B 塞進後端會白白耗用叫用成本；C WAF 面向安全規則而非業務欄位結構驗證；D 私有端點只改存取範圍，與格式驗證無關。

</Quiz>

<Quiz
  qnum={5}
  total={65}
  question="某服務需要把一筆訊息「可靠地送達單一消費者、支援重試、消費失敗可進死信」，且不需要多個訂閱者扇出。下列哪個服務最適合當作這個工作佇列？"
  options={[
    'Amazon SNS 標準主題',
    'Amazon SQS 標準佇列（搭配可見逾時與死信佇列）',
    'Amazon Kinesis Data Streams',
    'Amazon EventBridge 事件匯流排',
  ]}
  answer={1}>

**正解：B** — 單一消費者的工作佇列需求（可靠投遞、可見逾時控制重試、失敗進 DLQ）正是 SQS 的本業。A SNS 是發布/訂閱推播、面向扇出；C Kinesis 面向多消費者串流與回放、較重；D EventBridge 面向事件路由與多目標，非單純工作佇列。

</Quiz>

<Quiz
  qnum={6}
  total={65}
  question="開發者要讓 Lambda 連到 VPC 內的 RDS 資料庫，但該函式同時也需要呼叫公開的外部 API。把函式接上 VPC 後，發現對外呼叫失敗。下列哪個設定最能修正對外連線？"
  options={[
    '把 RDS 設為公開存取即可',
    '讓函式所在子網路透過 NAT 閘道（位於公有子網）對外連線，函式本身放私有子網',
    '把函式記憶體調大以恢復網路',
    '停用 VPC 設定、放棄連 RDS',
  ]}
  answer={1}>

**正解：B** — VPC 內的 Lambda 沒有公有 IP，要對外需把函式放私有子網並經由 NAT 閘道（在公有子網）出網。A 把 RDS 公開是安全反模式且不解決函式出網；C 記憶體與網路路由無關；D 停用 VPC 會失去連 RDS 的能力。

</Quiz>

<Quiz
  qnum={7}
  total={65}
  question="一個 Lambda 用 AWS SDK 寫入 S3 大型物件，開發者想用多段上傳（multipart upload）以提升大檔上傳的可靠度與吞吐。下列哪兩項是多段上傳帶來的好處？（選兩項）"
  options={[
    '可平行上傳各段以提升吞吐',
    '單一段失敗只需重傳該段、不必整檔重來',
    '會自動把物件加密成明文以利除錯',
    '會把物件大小上限降到 5 MB',
    '可免除 IAM 權限需求',
  ]}
  answer={[0, 1]}>

**正解：A、B** — 多段上傳把大物件切成多段，可平行上傳提升吞吐（A），且任一段失敗只需重傳該段、不必整檔重來（B），對大檔與不穩網路特別有利。C 明文化不是加密、也非多段上傳行為；D 多段上傳是用來突破單次 PUT 上限、支援更大物件而非降低上限；E 仍需適當 IAM 權限。

</Quiz>

<Quiz
  qnum={8}
  total={65}
  question="開發者要讓前端即時收到後端推送的通知（雙向、低延遲），且希望用全受管方式避免自建長連線伺服器。下列哪個 API Gateway 功能最適合？"
  options={[
    'REST API 搭配輪詢',
    'WebSocket API（由 API Gateway 管理連線並路由訊息到後端）',
    'HTTP API 單純轉發',
    'API 金鑰限流',
  ]}
  answer={1}>

**正解：B** — API Gateway WebSocket API 可維護用戶端的持久連線並以路由把訊息導到後端（如 Lambda），支援伺服器主動推送，免自建長連線伺服器。A 輪詢延遲高且浪費請求；C HTTP API 是請求/回應模型、非雙向推送；D 金鑰限流與即時推送無關。

</Quiz>

<Quiz
  qnum={9}
  total={65}
  question="某 Lambda 需要在數個環境（dev/stage/prod）使用不同的資料庫端點與記錄層級，開發者希望不改程式碼就切換這些值。下列哪個做法最合適？"
  options={[
    '用環境變數注入端點與記錄層級，各環境各自設定',
    '把三組值都寫死在程式裡用 if 判斷',
    '為每個環境各複製一份函式程式碼',
    '把值放進網址查詢參數每次傳入',
  ]}
  answer={0}>

**正解：A** — Lambda 環境變數可在不改程式碼下為各環境注入不同設定（端點、記錄層級），是標準做法（機密則改用 Secrets Manager/SecureString）。B 寫死多組值難維護且易錯；C 複製程式碼造成漂移；D 靠查詢參數傳設定不適用於非 HTTP 觸發且易外洩。

</Quiz>

<Quiz
  qnum={10}
  total={65}
  question="開發者要在 DynamoDB 以單一數值欄位做「原子遞增」計數（如貼文按讚數），避免讀出再寫回的競態。下列哪個做法最正確？"
  options={[
    '先 GetItem 讀出目前值，在程式內 +1 後 PutItem 寫回',
    '用 UpdateItem 搭配 ADD 或 SET likes = likes + :inc 的更新運算式做原子加',
    '每次按讚都新增一筆項目再事後統計',
    '把計數欄位設為字串每次重寫',
  ]}
  answer={1}>

**正解：B** — UpdateItem 的原子計數（ADD 或 `SET likes = likes + :inc`）直接在伺服器端對屬性做加法，避免「讀-改-寫」之間的競態造成遺失更新。A 讀出再寫回在並發下會互相覆寫；C 事後統計雖可行但讀取昂貴且非即時計數需求；D 用字串做數值運算不正確。

</Quiz>

<Quiz
  qnum={11}
  total={65}
  question="一個 Lambda 以事件來源映射從 Kinesis Data Streams 讀取，開發者發現某筆「毒藥訊息」反覆解析失敗，導致同一分片的後續記錄全部卡住無法前進。下列哪個設定最能避免卡住？"
  options={[
    '把分片數調為 1 以簡化處理',
    '設定最大重試次數與失敗記錄的目的地（on-failure destination），並啟用分割批次/回報部分失敗讓壞記錄可被略過或轉存',
    '把批次大小調到最大以加速通過',
    '停用檢查點讓它自動跳過全部',
  ]}
  answer={1}>

**正解：B** — Kinesis 事件來源映射可設定最大重試次數、把用盡重試的記錄送到失敗目的地，並透過分割批次/回報部分批次失敗，避免一筆毒藥訊息把整個分片卡死。A 調分片數不解決單筆卡住；C 加大批次反而讓壞記錄影響更多；D 停用檢查點會造成資料遺失與重複。

</Quiz>

<Quiz
  qnum={12}
  total={65}
  question="開發者要在 S3 物件建立時自動做縮圖，但預期尖峰每秒數千個事件，擔心直接觸發 Lambda 會造成下游壓力。希望在來源與處理之間加一層緩衝以削峰。下列哪個架構最合適？"
  options={[
    'S3 事件直接同步呼叫下游資料庫',
    'S3 事件送到 SQS 佇列，由 Lambda 事件來源映射批次拉取削峰',
    '把所有事件丟到同一個 Lambda 同步處理',
    '用 CloudWatch 指標當作緩衝',
  ]}
  answer={1}>

**正解：B** — 在 S3 事件與處理之間放 SQS 佇列當緩衝，Lambda 以事件來源映射批次拉取並受並發控制，可平滑尖峰、保護下游。A 同步打資料庫在尖峰會被壓垮；C 單函式同步處理無緩衝；D CloudWatch 指標是監控，不是訊息緩衝。

</Quiz>

<Quiz
  qnum={13}
  total={65}
  question="某團隊想讓多個 Lambda 共用一段肥大的相依（例如共用程式庫與 SDK 擴充），避免每個函式套件都重複打包、也便於集中更新版本。下列哪個 Lambda 功能最適合？"
  options={[
    'Lambda 層（Layer）把共用相依獨立打包供多個函式引用',
    '把相依複製貼到每個函式的套件裡',
    '用環境變數存放相依的程式碼',
    '把相依放到 DynamoDB 執行期下載',
  ]}
  answer={0}>

**正解：A** — Lambda 層可把共用相依獨立成一個層，多個函式引用同一層，減少重複打包並方便集中管理版本。B 複製到每個套件會造成重複與版本漂移；C 環境變數不是放程式庫的地方；D 執行期下載相依會拉高冷啟動與不確定性。

</Quiz>

<Quiz
  qnum={14}
  total={65}
  question="開發者要把一個長時間（約 20 分鐘）的批次轉檔工作放上雲端，純運算、無狀態、可容器化，且希望按用量付費不想管伺服器。因為單次執行會超過 Lambda 15 分鐘上限，下列哪個服務最適合跑這個批次？"
  options={[
    '硬塞進 Lambda 並把逾時設到 20 分鐘',
    'AWS Fargate（以容器執行批次任務，不限 15 分鐘）',
    '用 API Gateway 同步等待 20 分鐘',
    '用 DynamoDB 觸發器跑運算',
  ]}
  answer={1}>

**正解：B** — Lambda 單次執行上限為 15 分鐘，20 分鐘的批次應改用可跑長任務的容器服務，如 Fargate（ECS/EKS 的無伺服器運算）按用量付費且免管主機。A Lambda 逾時最高只能到 15 分鐘，設 20 分鐘無效；C API Gateway 有 29 秒整合逾時、不可能同步等 20 分鐘；D DynamoDB 觸發器仍是 Lambda，同樣受 15 分鐘限制。

</Quiz>

<Quiz
  qnum={15}
  total={65}
  question="開發者在本機想反覆產生事件 payload 餵給 Lambda 測試各種輸入，希望用 SAM CLI 以指定事件檔叫用函式並看回傳與日誌。下列哪個指令最直接？"
  options={[
    'sam deploy --guided',
    'sam local invoke MyFunction --event events/test.json',
    'sam validate',
    'sam package',
  ]}
  answer={1}>

**正解：B** — `sam local invoke` 可在本機以容器叫用指定函式，並用 `--event` 帶入事件 JSON 檔，立即看到回傳與日誌，適合反覆測試輸入。A `sam deploy` 是部署到雲端；C `sam validate` 只檢查範本語法；D `sam package` 是打包上傳成品，皆非本機叫用測試。

</Quiz>

<Quiz
  qnum={16}
  total={65}
  question="某 REST API 回應含大量重複的靜態參考資料（如國家清單），開發者想降低重複計算與頻寬。希望在邊緣就近快取並支援失效。下列哪個服務最適合放在 API 前面做內容傳遞與邊緣快取？"
  options={[
    'Amazon CloudFront 置於 API 前，於邊緣快取回應並支援失效',
    '把回應寫死在前端程式',
    '用 Glue 快取回應',
    '把 API 改為私有以加速',
  ]}
  answer={0}>

**正解：A** — CloudFront 可置於 API（或 S3/ALB）前，在全球邊緣節點就近快取回應、降低延遲與源站負載，並支援快取失效（invalidation）。B 寫死在前端無法集中更新；C Glue 是 ETL 服務、非快取；D 改私有只縮小存取範圍、不提供邊緣快取。

</Quiz>

<Quiz
  qnum={17}
  total={65}
  question="開發者要用 DynamoDB 一次原子地「扣庫存且建立訂單」，兩者必須同時成功或同時失敗，否則可能超賣。下列哪個做法最正確？"
  options={[
    '依序兩次 PutItem，失敗就手動補償',
    '用 TransactWriteItems 把扣庫存（含條件檢查庫存足夠）與建立訂單包成單一交易',
    '用 BatchWriteItem 一次寫兩筆',
    '先讀庫存再寫，靠程式邏輯保證',
  ]}
  answer={1}>

**正解：B** — TransactWriteItems 可把「條件扣庫存」與「建立訂單」包成單一 ACID 交易，全部成功或全部回復，杜絕部分成功造成的超賣。A 兩次分開寫無原子性、補償複雜易錯；C BatchWriteItem 不提供交易原子性與條件保證；D 讀後寫在並發下仍會超賣。

</Quiz>

<Quiz
  qnum={18}
  total={65}
  question="開發者用 API Gateway 的 Lambda 代理整合（proxy integration），想知道如何正確回傳 HTTP 狀態碼與標頭給用戶端。下列哪個描述最正確？"
  options={[
    'Lambda 只要 return 字串，狀態碼都會是 200',
    'Lambda 需回傳含 statusCode、headers、body 的結構，API Gateway 會據此組出 HTTP 回應',
    '狀態碼只能在 API Gateway 主控台固定寫死',
    '代理整合不支援自訂標頭',
  ]}
  answer={1}>

**正解：B** — 在 Lambda 代理整合下，函式須回傳 `{ statusCode, headers, body }` 這類結構，API Gateway 直接據此組成 HTTP 回應，故可自訂狀態碼與標頭。A 直接回字串不符代理整合格式；C 狀態碼由函式回傳決定、非固定寫死；D 代理整合可在 headers 自訂標頭。

</Quiz>

<Quiz
  qnum={19}
  total={65}
  question="某 Lambda 非同步處理耗時工作，上游呼叫方只想「立即拿到已接收的回應」、不等結果。開發者要用非同步叫用。下列哪個 InvocationType 或模式最符合「觸發後不等結果」？"
  options={[
    '以 Event（非同步）叫用，立即回 202 由 Lambda 背景處理',
    '以 RequestResponse（同步）叫用並等待完成',
    '把逾時設到最大以便同步等候',
    '用 DryRun 叫用',
  ]}
  answer={0}>

**正解：A** — 非同步叫用使用 Event 類型，Lambda 將事件入列後立即回 202、在背景處理，呼叫方不需等結果（可搭配目的地取得成敗）。B RequestResponse 是同步、會等結果；C 加大逾時仍是同步等待；D DryRun 只做權限/參數檢查、不真正執行。

</Quiz>

<Quiz
  qnum={20}
  total={65}
  question="開發者要把一個關聯式查詢密集、需要複雜 JOIN 與交易的服務上雲，資料模型高度關聯，查詢多變。下列哪個資料儲存最適合，而不是硬套 DynamoDB？"
  options={[
    '一律用 DynamoDB 並大量建 GSI 模擬 JOIN',
    'Amazon RDS/Aurora 等關聯式資料庫，適合複雜 JOIN 與多變查詢',
    '把資料全放 S3 用 Select 查',
    '用 ElastiCache 當主資料庫',
  ]}
  answer={1}>

**正解：B** — 高度關聯、需要複雜 JOIN 與靈活臨機查詢的工作負載，關聯式資料庫（RDS/Aurora）比 DynamoDB 更合適；DynamoDB 擅長已知存取模式的鍵值/文件查詢。A 用 GSI 硬模擬 JOIN 複雜且低效；C S3 Select 面向物件內查詢、非交易型資料庫；D ElastiCache 是快取、不是持久主資料庫。

</Quiz>

## 第二部分 · 安全（第 21–37 題）

<Quiz
  qnum={21}
  total={65}
  question="開發者要讓 Cognito 使用者池登入後的前端，能以最小權限呼叫 AWS 服務，且不同使用者群組對應不同 IAM 角色（例如管理員群組權限較大）。下列哪個機制最直接達成「依群組給不同角色」？"
  options={[
    '身分池的角色對應（role mapping），依使用者池的群組或權杖宣告指派不同 IAM 角色',
    '把所有使用者都對應到同一個管理員角色',
    '在前端程式用 if 判斷使用者群組決定要不要呼叫',
    '為每個使用者各建一個 IAM 使用者',
  ]}
  answer={0}>

**正解：A** — Cognito 身分池支援角色對應，可依使用者池群組或權杖內的宣告，把不同使用者換發到不同 IAM 角色，落實依群組分權。B 全用管理員角色違反最小權限；C 前端 if 判斷可被繞過、不是真正授權；D 為每個終端使用者建 IAM 使用者不可擴展也非 Cognito 模式。

</Quiz>

<Quiz
  qnum={22}
  total={65}
  question="某團隊的多個微服務需要跨服務呼叫，安全團隊要求「服務對服務」身分不得使用長期金鑰。下列哪個做法最符合？"
  options={[
    '每個服務各發一組 IAM 使用者長期金鑰互相呼叫',
    '各服務以其執行角色（Lambda 執行角色、ECS 任務角色）取得的臨時憑證呼叫，必要時以 AssumeRole 取得目標權限',
    '把一組共用金鑰寫進所有服務的環境變數',
    '把金鑰放進 S3 讓各服務讀取',
  ]}
  answer={1}>

**正解：B** — 服務對服務身分應使用各自執行角色的臨時憑證（Lambda 執行角色、ECS 任務角色、EC2 執行個體角色），需要時以 STS AssumeRole 取得目標角色權限，全程免長期金鑰。A、C、D 都在系統中留下可外洩、難輪替的長期金鑰，違反最佳實務。

</Quiz>

<Quiz
  qnum={23}
  total={65}
  question="開發者要在應用層對一小段高敏感欄位（如身分證號）做加解密，想直接呼叫 KMS 對這段小資料加解密（資料小於 4 KB）。下列哪個 KMS API 最直接適用？"
  options={[
    '對小於 4 KB 的資料直接用 KMS Encrypt/Decrypt API 以 KMS 金鑰加解密',
    '用 KMS 直接加密 1 GB 的大檔',
    '把 KMS 主金鑰匯出到本機加解密',
    '用 GenerateRandom 當作加密',
  ]}
  answer={0}>

**正解：A** — KMS 的 Encrypt/Decrypt API 可直接對小型資料（上限約 4 KB）加解密，適合少量高敏感欄位。B 大檔應改用信封加密（GenerateDataKey 取資料金鑰在本機加密）而非直接丟 KMS；C KMS 主金鑰不可匯出；D GenerateRandom 只是產生亂數、不是加密機制。

</Quiz>

<Quiz
  qnum={24}
  total={65}
  question="開發者發現團隊把資料庫密碼以明文放在 Lambda 環境變數，稽核要求：靜態加密、集中管理、可自動輪替、存取可稽核。下列哪兩項改法最符合要求？（選兩項）"
  options={[
    '改存 Secrets Manager 並啟用自動輪替，函式執行期以 API 擷取',
    '以 CloudTrail 稽核對機密的讀取並以 KMS 加密靜態值',
    '把密碼改成 base64 後仍放環境變數',
    '把密碼印到 CloudWatch Logs 方便查對',
    '把密碼寫死在程式碼並提交到 repo',
  ]}
  answer={[0, 1]}>

**正解：A、B** — 符合稽核要求的兩招：改用 Secrets Manager 集中存放並啟用自動輪替、執行期擷取（A）；並以 KMS 加密靜態值、用 CloudTrail 稽核存取（B）。C base64 只是編碼非加密；D 印進日誌等於外洩；E 寫死並提交到 repo 是最嚴重的外洩。

</Quiz>

<Quiz
  qnum={25}
  total={65}
  question="某 S3 儲存貯體存放需符合法規稽核的資料，要求「物件寫入後在保留期內不可被刪除或覆寫」（WORM）。下列哪個功能最直接達成不可竄改？"
  options={[
    'S3 版本控制即可保證不可刪除',
    'S3 物件鎖定（Object Lock）以合規模式設定保留期，期內不可刪改',
    '把儲存貯體設為私有即可',
    '用生命週期規則自動刪除舊版',
  ]}
  answer={1}>

**正解：B** — S3 物件鎖定（Object Lock）以 WORM 模式運作，合規（Compliance）模式下在保留期內任何人（含 Root）都無法刪除或覆寫物件，滿足法規不可竄改需求。A 版本控制可保留舊版但不阻止刪除標記/覆寫；C 私有只是存取控制；D 自動刪除與不可刪除的目標相反。

</Quiz>

<Quiz
  qnum={26}
  total={65}
  question="開發者要讓 Lambda 連到 VPC 內資源並呼叫 S3，安全團隊要求「S3 流量不要經過公網」。下列哪個做法最合適？"
  options={[
    '把 S3 設為公開供函式讀取',
    '在 VPC 建立 S3 的閘道型 VPC 端點（Gateway Endpoint），讓流量走私網不經網際網路',
    '把函式金鑰寫死以便直連',
    '為函式加上公有 IP 直連 S3',
  ]}
  answer={1}>

**正解：B** — VPC 的 S3 閘道端點讓 VPC 內資源以私網路由存取 S3，不經公網，兼顧安全與效能。A 公開 S3 是重大風險；C 寫死金鑰與網路路徑無關且不安全；D 給公有 IP 等於走公網，違反需求。

</Quiz>

<Quiz
  qnum={27}
  total={65}
  question="開發者要簽發供第三方在「有限時間內下載」某 S3 私有物件的連結，不想公開儲存貯體、也不想發 IAM 憑證。下列哪個做法最正確？"
  options={[
    '把物件設為公開並事後改回',
    '由持有權限的後端產生具到期時間的預簽章 URL 供下載',
    '把 IAM 使用者金鑰交給第三方',
    '把儲存貯體政策改成允許所有人讀',
  ]}
  answer={1}>

**正解：B** — 預簽章 URL 由有權限的身分臨時簽發，第三方在到期前可直接存取該私有物件，之後連結失效，無需公開或發憑證。A 設公開期間任何人都讀得到、風險高；C 發金鑰給第三方極危險；D 全開讀取等於公開資料。

</Quiz>

<Quiz
  qnum={28}
  total={65}
  question="某 API Gateway 需要自訂驗證邏輯（例如驗證第三方發的 JWT 或查自家權限服務），再決定放行與否，並快取授權結果以降低延遲。下列哪個做法最合適？"
  options={[
    'Lambda 授權方（Lambda authorizer）回傳 IAM 政策並可快取授權結果',
    '在每個後端函式各自手刻驗證',
    '把 API 完全公開改用前端判斷',
    '用 API 金鑰當作使用者驗證',
  ]}
  answer={0}>

**正解：A** — Lambda 授權方可放自訂驗證邏輯（驗 JWT、查權限服務），回傳允許/拒絕的 IAM 政策給閘道，並可依快取金鑰快取結果降低重複驗證延遲。B 到處手刻重複且易錯；C 前端判斷可被繞過；D API 金鑰是識別與配額、非使用者身分驗證。

</Quiz>

<Quiz
  qnum={29}
  total={65}
  question="開發者在排查「AccessDenied」錯誤，想確認某個 IAM 主體對特定動作/資源實際是否被允許，並找出是哪條政策造成拒絕。下列哪個工具最直接？"
  options={[
    '把權限全開試試看',
    '用 IAM Policy Simulator 或檢視 CloudTrail 事件判斷有效權限與被拒原因',
    '直接改用 Root 帳號',
    '重建該主體的所有政策碰運氣',
  ]}
  answer={1}>

**正解：B** — IAM Policy Simulator 可模擬主體對特定動作/資源的有效權限，CloudTrail 則記錄實際被拒的 API 呼叫與情境，兩者可定位 AccessDenied 的根因。A 權限全開是危險的試誤；C 用 Root 掩蓋問題且違反最佳實務；D 盲目重建無法定位原因。

</Quiz>

<Quiz
  qnum={30}
  total={65}
  question="某 S3 儲存貯體要求「只接受以 KMS 客戶受管金鑰加密的上傳」，未加密或加密方式不符的 PUT 一律拒絕。下列哪個做法最直接強制此規則？"
  options={[
    '相信每個上傳者都會自覺加密',
    '用儲存貯體政策（bucket policy）拒絕未帶指定 SSE-KMS 標頭或未用指定金鑰的 PutObject',
    '把金鑰公開讓大家方便加密',
    '事後掃描未加密物件再手動刪除',
  ]}
  answer={1}>

**正解：B** — 以儲存貯體政策設定條件（如 `s3:x-amz-server-side-encryption` 必須為 `aws:kms` 且指定金鑰 ARN），不符即拒絕 PutObject，可從源頭強制加密方式。A 靠自覺不可靠；C 公開金鑰是重大風險；D 事後補救無法阻止不合規寫入落地。

</Quiz>

<Quiz
  qnum={31}
  total={65}
  question="開發者要讓一個 Lambda 能被「同帳號的 API Gateway」叫用，但不想給整個帳號所有服務叫用權限。下列哪個做法最符合最小權限？"
  options={[
    '把函式設為任何人可叫用',
    '以 lambda:AddPermission 在函式的資源型政策上，限定 principal 為 API Gateway 服務且 SourceArn 為該 API',
    '給 API Gateway 執行角色 AdministratorAccess',
    '停用函式的所有權限檢查',
  ]}
  answer={1}>

**正解：B** — 透過 AddPermission 在 Lambda 資源型政策新增一條，將 principal 限定為 `apigateway.amazonaws.com` 並以 SourceArn 綁定該特定 API，只有該 API 能叫用，符合最小權限。A 開放任何人叫用風險高；C 給管理員權限過大；D 停用權限檢查是嚴重反模式。

</Quiz>

<Quiz
  qnum={32}
  total={65}
  question="某團隊要輪替正在使用中的 KMS 客戶受管金鑰以符合合規，且希望舊資料仍能解密、不必重新加密。下列哪個描述最符合 KMS 自動金鑰輪替？"
  options={[
    '輪替會立即讓舊密文無法解密',
    '啟用自動輪替後 KMS 會產生新的金鑰素材，舊素材仍保留以解密既有密文，對應用透明',
    '輪替必須手動把所有物件重新加密',
    '輪替會改變金鑰 ARN 導致應用需改設定',
  ]}
  answer={1}>

**正解：B** — KMS 對稱 CMK 的自動輪替會定期產生新的金鑰素材供後續加密，同時保留舊素材解密既有密文，金鑰 ID/ARN 不變、對應用透明，無需重新加密舊資料。A 舊密文仍可解；C 不需重新加密；D ARN 不變。

</Quiz>

<Quiz
  qnum={33}
  total={65}
  question="開發者要確保傳輸中的資料安全，前端到 API、API 到後端都走加密通道。下列哪個是「傳輸中加密」最基本正確的做法？"
  options={[
    '全程用 HTTP 明文但壓縮封包',
    '強制使用 HTTPS/TLS，並可用儲存貯體政策/條件拒絕非加密（非 TLS）請求',
    '只要靜態加密就不必管傳輸',
    '把資料 base64 後用 HTTP 傳',
  ]}
  answer={1}>

**正解：B** — 傳輸中加密的基本做法是全程 HTTPS/TLS，並可用政策條件（如 `aws:SecureTransport` 為 false 即拒絕）強制非 TLS 請求被擋。A HTTP 明文可被竊聽；C 靜態與傳輸加密是兩回事、都需要；D base64 只是編碼、HTTP 傳仍是明文。

</Quiz>

<Quiz
  qnum={34}
  total={65}
  question="某 Lambda 執行角色長期累積了許多用不到的權限，安全團隊要收斂到實際使用的動作。下列哪個做法最能依「實際使用情形」精簡權限？"
  options={[
    '直接刪掉角色重來，邊報錯邊加',
    '用 IAM Access Analyzer 依 CloudTrail 活動產生最小權限政策建議，再據以收斂',
    '把權限改成萬用字元最保險',
    '附加 ReadOnlyAccess 就好',
  ]}
  answer={1}>

**正解：B** — IAM Access Analyzer 可依 CloudTrail 記錄的實際 API 活動，產生貼近真實用量的最小權限政策建議，據以收斂最精準。A 刪掉重來易中斷服務且無依據；C 萬用字元違反最小權限；D ReadOnlyAccess 未必符合函式實際所需動作。

</Quiz>

<Quiz
  qnum={35}
  total={65}
  question="開發者要讓 CloudFront 後面的 S3 私有儲存貯體「只允許透過 CloudFront 存取、不可被直接以 S3 URL 讀取」。下列哪個做法最正確？"
  options={[
    '把 S3 設為公開讓 CloudFront 讀',
    '使用來源存取控制（OAC）讓 CloudFront 以簽章身分存取 S3，並用儲存貯體政策只允許該來源',
    '把 S3 金鑰嵌進 CloudFront 設定',
    '關閉 CloudFront 直接公開 S3',
  ]}
  answer={1}>

**正解：B** — 以 CloudFront 來源存取控制（OAC）讓發佈以簽章身分存取私有 S3，並在儲存貯體政策只允許該 CloudFront 來源，即可達成「僅能經 CloudFront、禁止直連 S3」。A 公開 S3 等於可被直連；C S3 不用嵌金鑰到 CloudFront；D 直接公開 S3 完全違反需求。

</Quiz>

<Quiz
  qnum={36}
  total={65}
  question="開發者要在 ECS 任務（Fargate）中讓容器以最小權限呼叫 AWS 服務，不想在映像或環境變數放長期金鑰。下列哪個做法最正確？"
  options={[
    '把 Access Key 烤進容器映像',
    '為任務指派 ECS 任務角色（task role），容器自動取得會輪替的臨時憑證',
    '所有任務共用一組永久金鑰',
    '把金鑰放進容器環境變數明文',
  ]}
  answer={1}>

**正解：B** — ECS 任務角色讓容器經由憑證提供者自動取得會自動輪替的臨時憑證，映像與環境變數都不需放長期金鑰，並可依任務最小授權。A 烤進映像會隨映像外洩；C 共用永久金鑰難稽核風險高；D 明文環境變數易外洩。

</Quiz>

<Quiz
  qnum={37}
  total={65}
  question="某公開 API 常遭自動化腳本以常見攻擊樣式（SQL 注入、超量請求）騷擾，開發者想在到達後端前就過濾惡意流量並做速率限制。下列哪個服務最適合？"
  options={[
    '把後端 Lambda 記憶體調大硬扛',
    '在 API Gateway/CloudFront 前掛 AWS WAF 設定規則擋惡意樣式並做速率限制',
    '停用日誌以免被攻擊者看到',
    '把 API 改成同步阻塞',
  ]}
  answer={1}>

**正解：B** — AWS WAF 可套在 API Gateway、CloudFront、ALB 前，以受管/自訂規則過濾 SQL 注入等攻擊樣式並做以速率為基礎的限制，在抵達後端前攔截惡意流量。A 加記憶體不阻擋攻擊；C 停日誌反而失去可觀測性；D 阻塞模式與防護無關。

</Quiz>

## 第三部分 · 測試與部署（第 38–51 題）

<Quiz
  qnum={38}
  total={65}
  question="團隊用 CloudFormation/SAM 更新一個堆疊時，希望先預覽「這次變更會新增/修改/刪除哪些資源」再決定是否執行，避免意外刪除。下列哪個功能最直接？"
  options={[
    '直接部署再看結果',
    '建立變更集（change set）預覽資源異動後再執行',
    '把堆疊刪掉重建',
    '只看範本 diff 用猜的',
  ]}
  answer={1}>

**正解：B** — CloudFormation 變更集會列出本次更新將對各資源造成的新增/修改/刪除（含可能的取代），確認後才執行，可避免意外刪除。A 直接部署沒有預覽緩衝；C 刪掉重建風險更大；D 只看範本 diff 無法得知 CloudFormation 實際會如何處置資源（例如是否取代）。

</Quiz>

<Quiz
  qnum={39}
  total={65}
  question="某 CloudFormation 堆疊更新到一半因某資源建立失敗而停止，開發者希望預設行為能自動回到更新前的穩定狀態。下列哪個描述最符合此預設機制？"
  options={[
    '失敗就讓堆疊停在半完成狀態等人工處理',
    'CloudFormation 預設會在更新失敗時自動回復（rollback）到更新前狀態',
    '失敗會自動刪除整個堆疊',
    '失敗會略過該資源繼續往下',
  ]}
  answer={1}>

**正解：B** — CloudFormation 在更新失敗時預設會自動回復到更新前的穩定狀態，維持可用性。A 它不會停在半完成放著不管；C 更新失敗是回復而非刪整個堆疊；D 不會略過失敗資源繼續，以免半套狀態。

</Quiz>

<Quiz
  qnum={40}
  total={65}
  question="開發者要在 CodeBuild 的 buildspec 中快取相依套件目錄（如 node_modules）以加速後續建置。下列哪個做法最直接？"
  options={[
    '每次建置都重新下載全部相依',
    '在 buildspec 設定 cache 的 paths 並搭配 CodeBuild 的快取（如 S3 或本機），把相依目錄快取起來重用',
    '把相依提交進 git repo',
    '把相依手動複製到建置機',
  ]}
  answer={1}>

**正解：B** — buildspec 可宣告 `cache.paths` 把相依目錄（如 node_modules、.m2）快取到 S3 或本機，後續建置重用以縮短時間。A 每次全下載最慢；C 把相依提交進 repo 污染版本庫且難維護；D 手動複製不可重現也不自動化。

</Quiz>

<Quiz
  qnum={41}
  total={65}
  question="某團隊要在 CI/CD 管線中，於部署到生產「之前」加入一個需人工核可的關卡（例如主管點核可才繼續）。下列哪個 CodePipeline 功能最直接？"
  options={[
    '手動核可（manual approval）動作，暫停管線等待核可後才繼續',
    '把生產部署直接自動化、不設關卡',
    '靠口頭通知就好',
    '用 email 來回確認再手動部署',
  ]}
  answer={0}>

**正解：A** — CodePipeline 的手動核可動作會讓管線暫停，等待指定人員核可（可配 SNS 通知）後才進入下一階段，正好當生產前的審核關卡。B 不設關卡失去審核機制；C 口頭通知無法擋住管線；D email 來回手動部署非自動化管線的一環。

</Quiz>

<Quiz
  qnum={42}
  total={65}
  question="開發者要在 SAM 範本中宣告 Lambda 每次部署都走「漸進式切流＋失敗自動回退＋切流前先跑驗證」，希望用 SAM 內建語法而非自己接 CodeDeploy。下列哪個做法最直接？"
  options={[
    '手動在主控台逐步調流量',
    '在 SAM 的 AutoPublishAlias 搭配 DeploymentPreference（如 Canary/Linear、Alarms、Hooks）宣告漸進式部署',
    '每次都直接覆寫 $LATEST',
    '刪函式再重建',
  ]}
  answer={1}>

**正解：B** — SAM 的 `AutoPublishAlias` 搭配 `DeploymentPreference` 可宣告部署類型（Canary/Linear）、綁定警報自動回退、以及切流前後的 Hooks 驗證，底層自動接 CodeDeploy。A 手動調流量不可重複；C 覆寫 $LATEST 無漸進切流與回退；D 刪了重建會中斷服務。

</Quiz>

<Quiz
  qnum={43}
  total={65}
  question="團隊要為 API 做負載測試，觀察在高併發下的延遲、錯誤率與自動擴展行為，再決定上線的容量設定。下列哪個做法最合理？"
  options={[
    '只在本機單執行緒跑一次當作測試',
    '在類生產的測試環境以負載測試工具產生高併發流量，蒐集 CloudWatch 延遲/錯誤/擴展指標分析',
    '直接對生產做破壞性壓測',
    '靠使用者抱怨慢來推估容量',
  ]}
  answer={1}>

**正解：B** — 負載測試應在類生產環境以工具模擬高併發，並以 CloudWatch 觀察延遲、錯誤率、節流與擴展行為，據此定容量。A 單執行緒跑一次無法反映併發；C 對生產破壞性壓測危險；D 靠抱怨推估不精確且被動。

</Quiz>

<Quiz
  qnum={44}
  total={65}
  question="開發者在 CodeDeploy 對 ECS 做藍/綠部署，想在「新版已部署、尚未接生產流量」時先對它跑一輪驗證測試，通過才切流量。下列哪個生命週期掛鉤最適合放這個驗證？"
  options={[
    'ApplicationStop',
    'AfterAllowTestTraffic / BeforeAllowTraffic 等切流前掛鉤執行驗證',
    'DownloadBundle',
    'ApplicationStart 之後完全不驗證',
  ]}
  answer={1}>

**正解：B** — 藍/綠部署可在把生產流量切到新版「之前」的掛鉤（如 AfterAllowTestTraffic、BeforeAllowTraffic）跑驗證測試，通過才切流、失敗則回退。A ApplicationStop 是停舊版階段；C DownloadBundle 是取得成品階段；D 完全不驗證失去把關意義。

</Quiz>

<Quiz
  qnum={45}
  total={65}
  question="某團隊想把多個環境（dev/stage/prod）的部署用同一份 SAM 範本管理，並希望把各環境的參數與部署設定記錄在設定檔以利重複執行。下列哪兩項做法最合理？（選兩項）"
  options={[
    '用範本參數（Parameters）讓同一份範本吃不同環境值',
    '以 samconfig（部署組態）記錄各環境的參數與設定供 sam deploy 重用',
    '為每個環境各複製一份幾乎相同的範本',
    '把環境差異寫死在 Lambda 程式碼',
    '每次部署都手動在主控台輸入參數',
  ]}
  answer={[0, 1]}>

**正解：A、B** — 多環境單一範本的兩個關鍵：用 Parameters 讓同一範本接受不同環境值（A）；並以 samconfig 記錄各環境的參數/設定供 `sam deploy` 重複使用（B），降低漂移。C 複製多份易不同步；D 寫死在程式碼不是基礎設施組態；E 手動輸入不可重現也易漏。

</Quiz>

<Quiz
  qnum={46}
  total={65}
  question="開發者要在 CloudFormation 範本中引用「另一個堆疊已輸出的值」（如共用 VPC 的子網 ID），讓網路堆疊與應用堆疊解耦。下列哪個做法最合適？"
  options={[
    '把子網 ID 寫死在每個範本',
    '在網路堆疊用 Outputs 加 Export，應用堆疊用 Fn::ImportValue 跨堆疊引用',
    '靠人工把 ID 貼到每個範本',
    '把所有資源塞進同一個巨大堆疊',
  ]}
  answer={1}>

**正解：B** — 跨堆疊共享值的標準做法是來源堆疊 `Outputs` 以 `Export` 命名，消費堆疊用 `Fn::ImportValue` 引用，達成解耦與重用。A 寫死 ID 易漂移；C 人工貼易錯難維護；D 全塞一個巨大堆疊喪失模組化與獨立更新能力。

</Quiz>

<Quiz
  qnum={47}
  total={65}
  question="團隊發現某 CloudFormation 堆疊的實際資源被有人在主控台「手動改過」，造成與範本不符（漂移）。開發者想偵測這類與範本不一致的資源。下列哪個功能最直接？"
  options={[
    '靠肉眼比對每個資源',
    '用 CloudFormation 漂移偵測（drift detection）找出與範本不符的資源',
    '把堆疊刪掉重建',
    '停用主控台存取就不會漂移',
  ]}
  answer={1}>

**正解：B** — CloudFormation 漂移偵測會比對堆疊內資源的實際設定與範本定義，列出被手動改動（漂移）的資源，供團隊修正或收斂。A 肉眼比對不可擴展；C 刪掉重建風險大；D 停用存取是治理手段、不等於偵測既有漂移。

</Quiz>

<Quiz
  qnum={48}
  total={65}
  question="開發者要為 Lambda 做金絲雀部署：先把 10% 流量切新版、搭配 CloudWatch 警報，若錯誤率超標就自動回退。下列哪個組合最直接達成「超標自動回退」？"
  options={[
    '人工盯著儀表板發現問題再手動切回',
    '用 CodeDeploy（或 SAM DeploymentPreference）綁定 CloudWatch 警報，警報觸發即自動回退到舊版',
    '把舊版刪掉就不會有問題',
    '把警報關掉以免干擾部署',
  ]}
  answer={1}>

**正解：B** — CodeDeploy（SAM 的 DeploymentPreference 亦可宣告）能綁定 CloudWatch 警報，金絲雀期間若警報進入告警狀態就自動回退到舊版，無需人工介入。A 人工盯盤慢且易漏；C 刪舊版會失去回退依據；D 關警報等於拿掉自動回退的觸發條件。

</Quiz>

<Quiz
  qnum={49}
  total={65}
  question="某團隊要把一組前端靜態網站（HTML/JS/CSS）部署到雲端並以邊緣加速、支援自訂網域與 HTTPS。下列哪個組合最直接？"
  options={[
    '把網站塞進 Lambda 回傳 HTML',
    '靜態檔放 S3，前面掛 CloudFront 做邊緣快取與 HTTPS，網域走 Route 53',
    '把網站放進 DynamoDB',
    '用 EC2 單機提供靜態檔即可',
  ]}
  answer={1}>

**正解：B** — 靜態網站的標準做法是 S3 存放靜態檔、CloudFront 做全球邊緣快取與 TLS、Route 53 綁自訂網域，低成本且可擴展。A 用 Lambda 回傳靜態頁不經濟；C DynamoDB 不是靜態網站託管；D 單機 EC2 無邊緣加速且需自維運高可用。

</Quiz>

<Quiz
  qnum={50}
  total={65}
  question="開發者要在部署前後自動化地驗證 Lambda 的行為（切流前跑冒煙測試、切流後跑驗證），希望用 CodeDeploy 的生命週期掛鉤觸發小型驗證函式。下列哪個描述最正確？"
  options={[
    '生命週期掛鉤只能用來送通知，不能跑驗證',
    'CodeDeploy 可在 BeforeAllowTraffic/AfterAllowTraffic 掛鉤呼叫驗證用的 Lambda，驗證失敗則中止部署並回退',
    '掛鉤只能在部署完成後才執行',
    '掛鉤無法影響部署是否繼續',
  ]}
  answer={1}>

**正解：B** — CodeDeploy 的 Lambda 部署可在 BeforeAllowTraffic（切流前）與 AfterAllowTraffic（切流後）掛鉤各呼叫一個驗證 Lambda，驗證回報失敗即中止部署並回退。A 掛鉤可跑驗證、不只是通知；C 掛鉤在切流前後都能執行；D 掛鉤結果會決定部署是否繼續。

</Quiz>

<Quiz
  qnum={51}
  total={65}
  question="某團隊的整合測試需要一個「暫時、乾淨、用完即丟」的測試環境，開發者希望用基礎設施即程式碼在管線中動態建立、測完銷毀。下列哪個做法最合理？"
  options={[
    '長期維護一個共用測試環境讓大家互相干擾',
    '在管線以 CloudFormation/SAM 動態建立臨時堆疊跑測試，完成後刪除堆疊回收資源',
    '每次手動在主控台點出一個環境',
    '直接在生產跑整合測試',
  ]}
  answer={1}>

**正解：B** — 用 IaC 在管線中動態建立臨時堆疊、跑完整合測試後刪除，可得到隔離、可重現、用完即丟的測試環境並控制成本。A 共用長期環境會互相干擾且狀態髒；C 手動點環境不可重現；D 在生產跑整合測試風險高。

</Quiz>

## 第四部分 · 疑難排解與最佳化（第 52–65 題）

<Quiz
  qnum={52}
  total={65}
  question="開發者想在 X-Ray 的服務地圖上看到「某段外部 HTTP 呼叫與某次 DynamoDB 查詢各自耗時多少」，以便定位延遲。要讓這些呼叫出現在追蹤中，下列哪個做法最正確？"
  options={[
    '只要啟用 Lambda 的 X-Ray 追蹤，什麼都會自動出現',
    '啟用 X-Ray 並用 SDK 檢測（instrument）下游呼叫（如包裝 AWS SDK 用戶端、建立子區段）以產生子區段',
    '把所有日誌等級調到 DEBUG 即可',
    '把函式記憶體調大就會自動追蹤',
  ]}
  answer={1}>

**正解：B** — 要在 X-Ray 看到下游呼叫的耗時，需啟用追蹤並以 X-Ray SDK 檢測這些呼叫（例如包裝 AWS SDK 用戶端、為外部 HTTP 呼叫建立子區段），才會產生對應的子區段（subsegment）。A 僅啟用追蹤未必自動涵蓋所有自訂/外部呼叫的細節；C、D 調日誌或記憶體與產生追蹤子區段無關。

</Quiz>

<Quiz
  qnum={53}
  total={65}
  question="某 Lambda 被大量非同步事件觸發，開發者發現部分事件似乎被處理了兩次，造成重複副作用。下列哪個對「非同步叫用的傳遞語意」與正確處置最準確？"
  options={[
    'Lambda 保證剛好一次傳遞，重複一定是程式 bug',
    '非同步叫用可能至少一次傳遞、偶有重複，應讓函式設計為冪等以容忍重複',
    '重複是不可能的，無需處理',
    '把重試設為 0 就能保證不重複且不遺失',
  ]}
  answer={1}>

**正解：B** — Lambda 非同步叫用是「至少一次」語意，偶爾會重複傳遞，正確做法是把函式設計成冪等（例如以唯一鍵去重）以容忍重複。A Lambda 並不保證剛好一次；C 重複確實可能發生；D 關重試會在暫時性錯誤時遺失事件、也不保證不重複。

</Quiz>

<Quiz
  qnum={54}
  total={65}
  question="開發者發現某 DynamoDB 表讀取偶爾拿到舊資料，追查後是因為用了預設的最終一致讀。某關鍵流程必須讀到剛寫入的最新值。下列哪個做法最正確？"
  options={[
    '無限重試直到讀到新值',
    '對該關鍵讀取改用強一致讀（ConsistentRead=true）以讀到最新寫入值',
    '把資料表刪掉重建',
    '改用 Scan 以保證一致',
  ]}
  answer={1}>

**正解：B** — DynamoDB 預設最終一致讀可能拿到稍舊的值；對必須讀到最新寫入的關鍵讀取，應指定強一致讀（ConsistentRead=true）。A 重試治標且浪費；C 刪表重建無關一致性；D Scan 與一致性模型無關、且昂貴。

</Quiz>

<Quiz
  qnum={55}
  total={65}
  question="某 Lambda 的 CloudWatch 指標顯示 Throttles 偏高，排查發現是帳號的並發額度被其他函式吃光。開發者想保證這個關鍵函式永遠有一定並發可用。下列哪個設定最直接？"
  options={[
    '把帳號並發上限調到最大就好',
    '為該關鍵函式設定保留並發（Reserved Concurrency），保障其專屬並發額度',
    '把該函式記憶體調大',
    '停用其他所有函式',
  ]}
  answer={1}>

**正解：B** — 保留並發會從帳號並發池切出一塊專給該函式，保證它永遠有可用並發、不被其他函式排擠（同時也為它設上限）。A 只調帳號上限不保證分配給該函式；C 記憶體與並發額度無關；D 停用其他函式不切實際。

</Quiz>

<Quiz
  qnum={56}
  total={65}
  question="開發者要排查某次請求的完整處理路徑，希望把跨 API Gateway、Lambda、DynamoDB 的日誌用同一個「相關識別碼」串起來查詢。下列哪個做法最合理？"
  options={[
    '各服務各自看各自的日誌不關聯',
    '在請求入口產生/傳遞相關識別碼（correlation ID），各處結構化日誌都帶上它，用 Logs Insights 以該 ID 查詢',
    '把所有日誌等級關掉',
    '只靠時間戳人工比對',
  ]}
  answer={1}>

**正解：B** — 在入口產生並往下游傳遞相關識別碼（如放進日誌欄位或透過 X-Ray trace ID），各處輸出結構化日誌都帶上它，就能用 CloudWatch Logs Insights 以該 ID 一次撈出整條路徑的日誌。A 不關聯難以追蹤跨服務；C 關日誌無從查；D 純靠時間戳不可靠。

</Quiz>

<Quiz
  qnum={57}
  total={65}
  question="某 SQS 來源的 Lambda 在處理失敗時，訊息一再被重投、最後卻遺失，團隊想保存處理不了的訊息以便事後分析。下列哪個設定最正確？"
  options={[
    '把可見逾時設為 0 讓它快速輪轉',
    '為來源佇列設定死信佇列（DLQ）與最大接收次數，超過即把訊息移入 DLQ 保存',
    '停用重試讓失敗訊息直接丟掉',
    '把批次大小設到最大',
  ]}
  answer={1}>

**正解：B** — 為 SQS 佇列設定 DLQ 與 maxReceiveCount，當訊息被接收處理超過上限仍失敗時會移入 DLQ 保存，供事後分析與重放，避免遺失。A 可見逾時設 0 會造成重複立即重投；C 停用重試/直接丟棄會遺失訊息；D 加大批次不解決失敗保存問題。

</Quiz>

<Quiz
  qnum={58}
  total={65}
  question="開發者呼叫某服務收到 HTTP 400 的用戶端錯誤（如 ValidationException）。下列哪個對此類狀態碼與處置的描述最正確？"
  options={[
    '4xx 多為用戶端請求本身的問題（參數錯誤），重試同樣的請求通常無用，應修正請求',
    '4xx 代表伺服器壞了，應一直重試等它恢復',
    '4xx 一律可退避重試即可自動好轉',
    '4xx 代表被節流，應降低速率',
  ]}
  answer={0}>

**正解：A** — 4xx（如 400 ValidationException、403、404）通常是用戶端請求本身的問題，重打同樣請求無濟於事，應修正請求內容/權限。B 伺服器錯誤是 5xx；C 一般 4xx 不是靠重試就能好（節流 429 是例外）；D 被節流是 429/503 這類特定碼，非泛指所有 4xx。

</Quiz>

<Quiz
  qnum={59}
  total={65}
  question="某 Lambda 從 RDS 讀資料，尖峰時大量並發函式各自開一條資料庫連線，很快把資料庫連線數打滿導致錯誤。下列哪個做法最能根治連線耗盡？"
  options={[
    '把資料庫連線數上限調到無限大',
    '改用 RDS Proxy 做連線池化，讓大量 Lambda 共用少量受管連線',
    '每個函式多開幾條連線備用',
    '把函式並發調到最大',
  ]}
  answer={1}>

**正解：B** — RDS Proxy 在 Lambda 與資料庫之間做連線池化與重用，讓大量短命的函式呼叫共用少量持久連線，避免連線數爆掉，正是為無伺服器高並發設計。A 無限連線不切實際且資料庫撐不住；C 多開連線只會更快耗盡；D 加大並發讓問題更嚴重。

</Quiz>

<Quiz
  qnum={60}
  total={65}
  question="開發者想找出 Lambda 的最佳記憶體設定，在成本與效能間取得平衡，不想土法煉鋼逐一試。下列哪個做法最合理？"
  options={[
    '一律設最小記憶體最省',
    '用 Lambda Power Tuning 之類工具量測不同記憶體下的耗時與成本，挑最佳甜蜜點',
    '一律設最大記憶體最快',
    '記憶體設定隨便填即可',
  ]}
  answer={1}>

**正解：B** — Lambda 的 CPU 隨記憶體等比配置，最佳點需實測；用 Power Tuning 類工具以不同記憶體量測耗時與成本，可找出兼顧速度與費用的甜蜜點。A 一味最小可能更慢反而更貴；C 一味最大浪費成本；D 隨便填無法最佳化。

</Quiz>

<Quiz
  qnum={61}
  total={65}
  question="某團隊想建立「當某佇列積壓（可見訊息數）超過門檻就告警，並自動擴充處理容量」的可觀測與自動回應。下列哪兩項組合最直接？（選兩項）"
  options={[
    '用 CloudWatch 警報監看 SQS 的 ApproximateNumberOfMessagesVisible 指標設門檻告警',
    '以警報或指標驅動擴展處理端（如提高 Lambda 並發/擴充消費者）',
    '靠人每天早上看一次佇列長度',
    '把佇列刪掉以消除積壓',
    '關閉指標蒐集以免告警太多',
  ]}
  answer={[0, 1]}>

**正解：A、B** — 可觀測＋自動回應的兩招：以 CloudWatch 警報監看 SQS 積壓指標（ApproximateNumberOfMessagesVisible）設門檻（A）；並由警報/指標驅動擴展處理端容量（B）以消化積壓。C 人工巡檢不即時；D 刪佇列會遺失訊息；E 關指標等於失去可觀測性。

</Quiz>

<Quiz
  qnum={62}
  total={65}
  question="開發者發現 API Gateway 回傳 502 Bad Gateway 給用戶端，後端是 Lambda 代理整合。下列哪個排查方向最可能命中根因？"
  options={[
    '這一定是用戶端網路問題，無需查後端',
    '多半是 Lambda 回傳格式不符代理整合要求或函式拋例外，檢查回傳結構（statusCode/body）與函式錯誤日誌',
    '把 API 的逾時調到最大即可解決',
    '502 代表權限不足，應更換金鑰',
  ]}
  answer={1}>

**正解：B** — Lambda 代理整合下的 502 常見原因是函式回傳的 payload 格式不符（缺 statusCode/body 結構）或函式拋出未處理例外，應檢查回傳結構與函式錯誤日誌。A 不是用戶端網路問題；C 調逾時解的是 504 類逾時、非格式問題；D 權限不足通常是 403 而非 502。

</Quiz>

<Quiz
  qnum={63}
  total={65}
  question="某 Lambda 間歇性報「connection timed out」連不到 VPC 內的資料庫，排查懷疑是網路設定。下列哪個排查方向最相關？"
  options={[
    '這是記憶體不足，調大記憶體即可',
    '檢查函式所在子網的安全群組/網路 ACL 是否允許到資料庫的連接埠，以及子網路由是否正確',
    '把函式逾時關掉',
    '改用 Root 金鑰連線',
  ]}
  answer={1}>

**正解：B** — VPC 內連不到資料庫多是網路設定問題：檢查函式子網的安全群組是否放行到 DB 的連接埠、網路 ACL、以及子網路由（含是否需 NAT 或端點）。A 連線逾時不是記憶體問題；C 關逾時不解決連不上；D 金鑰與 TCP 連線是否通無關。

</Quiz>

<Quiz
  qnum={64}
  total={65}
  question="開發者發現某 Lambda 的 Duration 與 Init Duration 都偏高，想分別釐清是「冷啟動初始化慢」還是「業務邏輯本身慢」。下列哪個觀測指標/做法最能區分？"
  options={[
    '只看總叫用次數就能判斷',
    '比對 Init Duration（初始化耗時）與 Duration（執行耗時），並用 X-Ray 區段看冷啟動 vs 處理各佔多少',
    '把記憶體調到最小以簡化分析',
    '直接關閉追蹤以加快',
  ]}
  answer={1}>

**正解：B** — Init Duration 反映冷啟動的初始化耗時，Duration 反映實際處理耗時；比對兩者並以 X-Ray 區段拆解冷啟動 vs 業務處理，即可區分慢在哪。A 叫用次數看不出耗時分佈；C 調小記憶體反而更慢且混淆分析；D 關追蹤會失去拆解依據。

</Quiz>

<Quiz
  qnum={65}
  total={65}
  question="某讀多寫少的服務後端是 DynamoDB，讀取延遲偶爾偏高且讀取成本高，開發者想在幾乎不改應用邏輯下大幅降低讀取延遲與 RCU 消耗。下列哪兩項最直接有效？（選兩項）"
  options={[
    '在 DynamoDB 前加 DynamoDB Accelerator（DAX）承接熱門讀取',
    '對可容忍稍舊資料的讀取改用最終一致讀以省一半 RCU',
    '把所有讀取都改為強一致讀以加速',
    '關閉所有日誌以降低延遲',
    '把資料表刪掉改存檔案系統',
  ]}
  answer={[0, 1]}>

**正解：A、B** — 讀多寫少時降低讀取延遲與成本的兩招：加 DAX 這個 DynamoDB 專用記憶體快取承接熱門讀取、延遲降到微秒級（A）；對可容忍稍舊的讀取改用最終一致讀，RCU 消耗約為強一致的一半（B）。C 強一致讀更貴更慢、方向相反；D 關日誌對延遲幫助甚微且失可觀測性；E 刪表改檔案荒謬。

</Quiz>

---

👉 回去複習：[考前速查與選型決策](./cheatsheet.md)
