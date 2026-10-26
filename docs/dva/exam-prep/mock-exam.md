---
sidebar_position: 2
title: DVA 綜合模擬考（65 題）
---

# DVA-C03 綜合模擬考（65 題）

這是一份對齊真實考試規模的完整模擬卷：65 題，涵蓋官方四大領域，以開發者視角出題。建議限時約 90 分鐘（約 1.4 分鐘/題）模擬真實節奏，先全部做完再對答案。所有題目皆為原創、仿官方 DVA-C03 情境式風格（情境式題幹＋限定詞＋含複選），非真實考題。題目依官方四領域權重分區配置，其中含數題複選（Choose TWO），題幹會標明「選兩項」，請選滿不多不少。每題先自己點選答案，再展開詳解對照「為何對、其他為何錯」。

## 第一部分 · 用 AWS 服務開發（第 1–20 題）

<Quiz
  qnum={1}
  total={65}
  question="某開發者的 Lambda 函式偶爾因下游 DynamoDB 節流而失敗，重試後有時會對同一筆訂單重複扣款。團隊希望同一個事件就算被處理多次也只產生一次副作用。下列哪個做法最能達成冪等？"
  options={[
    '把 Lambda 的重試次數設為 0，避免任何重複執行',
    '以訂單 ID 當作條件寫入 DynamoDB，使用條件運算式確保同一 ID 只會成功寫入一次',
    '在函式內用隨機數決定是否處理此次事件',
    '把函式記憶體調大以降低執行時間',
  ]}
  answer={1}>

**正解：B** — 冪等的核心是讓「重複的輸入」對應「唯一的結果」。用訂單 ID 搭配 DynamoDB 條件運算式（如 `attribute_not_exists(orderId)`）可確保同一 ID 只成功一次，重試不會重複扣款。A 關掉重試會在暫時性錯誤時直接遺失事件，且不解決冪等；C 隨機決定會讓行為不可預期；D 調記憶體與冪等無關。

</Quiz>

<Quiz
  qnum={2}
  total={65}
  question="一個 Lambda 函式需要在冷啟動後重複使用資料庫連線池與 AWS SDK 用戶端以降低延遲。下列哪種寫法最符合最佳實務？"
  options={[
    '每次 handler 被呼叫時都新建一個資料庫連線與 SDK 用戶端',
    '把連線與 SDK 用戶端建立在 handler 函式外的全域範圍，讓後續同一執行環境的呼叫重複使用',
    '把連線字串寫死在程式碼中並停用連線池',
    '把每次請求的連線存進 Lambda 層（Layer）以便共用',
  ]}
  answer={1}>

**正解：B** — Lambda 會重複使用「執行環境」，在 handler 外（全域）初始化的物件會在後續的暖呼叫被重用，省下重建連線與用戶端的時間。A 每次都新建會拉高延遲並耗盡連線；C 寫死連線字串不安全且與連線池無關；D 的 Layer 用來打包相依，不是儲存執行期連線。

</Quiz>

<Quiz
  qnum={3}
  total={65}
  question="開發者要用 API Gateway 對外提供 REST API，前端需要跨網域呼叫而瀏覽器會先發出預檢（OPTIONS）請求。要讓瀏覽器成功跨域呼叫，下列哪個設定是必要的？"
  options={[
    '在 API Gateway 啟用 CORS，正確回應 OPTIONS 並帶 Access-Control-Allow-Origin 等標頭',
    '把 API 的驗證方式改成 IAM 簽章',
    '為 API 啟用 AWS WAF',
    '在用戶端停用快取',
  ]}
  answer={0}>

**正解：A** — 跨來源資源共用（CORS）由伺服器端在回應中帶正確標頭，瀏覽器才允許跨域。API Gateway 需啟用 CORS 並正確處理預檢 OPTIONS 與 `Access-Control-Allow-Origin` 等標頭。B 簽章解決的是驗證不是 CORS；C WAF 是防護層；D 停用快取與跨域無關。

</Quiz>

<Quiz
  qnum={4}
  total={65}
  question="某 DynamoDB 資料表主鍵為 userId（分割索引鍵）。應用需要「依 email 查使用者」這類非主鍵查詢，且要求低延遲、避免全表掃描。下列哪個做法最合適？"
  options={[
    '每次查詢用 Scan 加 FilterExpression 過濾 email',
    '建立以 email 為分割索引鍵的全域次要索引（GSI）並用 Query',
    '把整張表載入 Lambda 記憶體後在程式內過濾',
    '改用本機次要索引（LSI）以 email 當分割索引鍵',
  ]}
  answer={1}>

**正解：B** — 要用非主鍵屬性高效查詢，標準做法是建立全域次要索引（GSI），以 email 當索引鍵再 Query。A 的 Scan 會掃全表、昂貴且慢；C 載入整表不可擴展；D 的 LSI 必須與基底表共用同一分割索引鍵、只能換排序索引鍵，無法改用 email 當分割索引鍵。

</Quiz>

<Quiz
  qnum={5}
  total={65}
  question="開發者希望對一筆高流量的讀取（例如商品目錄）加上快取以降低 DynamoDB 讀取成本與延遲，且希望是全受管、對應用近乎透明的 DynamoDB 專用快取。下列哪個服務最適合？"
  options={[
    'Amazon CloudFront',
    'DynamoDB Accelerator（DAX）',
    'Amazon S3',
    'AWS Glue',
  ]}
  answer={1}>

**正解：B** — DynamoDB Accelerator（DAX）是 DynamoDB 專用的全受管記憶體內快取，可把讀取延遲降到微秒級且對 API 近乎透明。A CloudFront 是內容傳遞網路，面向 HTTP/靜態資源；C S3 是物件儲存；D Glue 是 ETL 服務，皆非 DynamoDB 讀取快取。

</Quiz>

<Quiz
  qnum={6}
  total={65}
  question="某團隊需要把多個生產者寫入的事件先緩衝起來，由 Lambda 批次消費，且要求同一群組的訊息嚴格保序、避免重複處理。下列哪個組合最適合？"
  options={[
    'SNS 標準主題直接觸發 Lambda',
    'SQS FIFO 佇列搭配訊息群組 ID，由 Lambda 事件來源映射消費',
    'S3 事件通知觸發 Lambda',
    'EventBridge 排程規則每分鐘觸發一次',
  ]}
  answer={1}>

**正解：B** — 需要嚴格保序與去重時，SQS FIFO 佇列搭配訊息群組 ID 可在同一群組內保序並提供僅一次處理語意；Lambda 透過事件來源映射批次拉取。A SNS 標準主題不保序且可能重複；C S3 事件是物件變更觸發，非一般事件緩衝；D 排程規則是定時觸發，與保序消費無關。

</Quiz>

<Quiz
  qnum={7}
  total={65}
  question="開發者要發布 Lambda 新版本，希望能把少量流量先導到新版驗證再逐步放大，且能快速回退。下列哪個 Lambda 功能最直接支援此需求？"
  options={[
    '把環境變數指向新版程式碼',
    '發布版本（Version）並用別名（Alias）設定加權路由，逐步調整新舊版流量比例',
    '每次都覆寫 $LATEST 並重新部署',
    '用 CloudWatch 警報自動刪除舊版',
  ]}
  answer={1}>

**正解：B** — Lambda 的別名可指向多個版本並設定加權（例如新版 10%、舊版 90%），實現金絲雀/線性發布並可快速把權重調回達成回退。A 環境變數不切換流量比例；C 覆寫 $LATEST 無法做比例導流也難回退；D 刪除舊版反而失去回退能力。

</Quiz>

<Quiz
  qnum={8}
  total={65}
  question="一個同步 API 背後的 Lambda 偶遇尖峰，開發者擔心大量並發會壓垮下游關聯式資料庫。希望限制該函式的同時執行數，超過時讓請求被節流。下列哪個設定最直接？"
  options={[
    '為該函式設定保留並發（Reserved Concurrency）上限',
    '把函式逾時時間調到最大',
    '把記憶體調到最大以加速完成',
    '把函式改為非同步呼叫',
  ]}
  answer={0}>

**正解：A** — 保留並發會為函式設定可同時執行的上限，超過時新呼叫會被節流，正好用來保護脆弱的下游。B 調逾時不限制並發；C 調記憶體不改變並發上限；D 改非同步只是改變呼叫模型，仍可能大量並發打下游。

</Quiz>

<Quiz
  qnum={9}
  total={65}
  question="開發者要讓 Lambda 在冷啟動時就備妥初始化、避免首個請求的延遲尖峰（例如可預期的整點流量）。下列哪個功能最適合？"
  options={[
    '預置並發（Provisioned Concurrency）',
    '把部署套件壓到最小',
    '改用容器映像部署',
    '把函式放到更多可用區',
  ]}
  answer={0}>

**正解：A** — 預置並發會事先初始化一定數量的執行環境並保持暖機，讓請求不必經歷冷啟動，適合可預期的流量尖峰。B 縮小套件略有幫助但不消除冷啟動；C 容器映像本身不保證無冷啟動；D 可用區與冷啟動無直接關係。

</Quiz>

<Quiz
  qnum={10}
  total={65}
  question="某應用要把大型使用者上傳檔案直接送進 S3，但不想讓前端持有長期憑證，也不想讓流量繞經應用伺服器。下列哪個做法最合適？"
  options={[
    '把 IAM 使用者的 Access Key 發給前端',
    '由後端產生 S3 預簽章 URL（presigned URL）讓前端在時限內直接上傳',
    '開放該 S3 儲存貯體為公開可寫',
    '讓前端先上傳到應用伺服器再轉存 S3',
  ]}
  answer={1}>

**正解：B** — 預簽章 URL 由持有權限的後端臨時簽發，前端在有效期內可直接把檔案 PUT 到 S3，既不暴露長期憑證也不經過應用伺服器。A 發 Access Key 給前端極危險；C 公開可寫是重大風險；D 繞經伺服器浪費頻寬且不符需求。

</Quiz>

<Quiz
  qnum={11}
  total={65}
  question="開發者在 DynamoDB 用交易（TransactWriteItems）一次更新多筆項目，偶爾收到 TransactionCanceledException。檢視原因碼顯示 ConditionalCheckFailed 與 TransactionConflict。下列哪個處理最正確？"
  options={[
    '忽略例外，交易一定最終會成功',
    '解析取消原因，對可重試的衝突採用指數退避重試，對條件不符的商業邏輯錯誤則不重試',
    '把所有失敗都無限次立即重試',
    '改用 BatchWriteItem 以忽略條件檢查',
  ]}
  answer={1}>

**正解：B** — 交易取消的原因碼不同處置也不同：TransactionConflict 這類暫時性衝突適合指數退避重試，而 ConditionalCheckFailed 代表商業前提不成立應回報而非重試。A 忽略會造成資料不一致；C 無退避的立即重試會加劇衝突（驚群）；D BatchWriteItem 不支援條件原子性，改它會丟失原本的交易保證。

</Quiz>

<Quiz
  qnum={12}
  total={65}
  question="一個資料擷取管線需要近即時處理大量串流事件，支援多個獨立消費者各自以自己的速度重讀資料（可回放），並保留資料數天。下列哪個服務最適合當作串流骨幹？"
  options={[
    'Amazon SQS 標準佇列',
    'Amazon Kinesis Data Streams',
    'Amazon SNS',
    'Amazon MQ',
  ]}
  answer={1}>

**正解：B** — Kinesis Data Streams 以分片保序、支援多個消費者各自維護位置並可在保留期內回放，適合近即時串流。A SQS 訊息被消費後即移除、不利多消費者回放；C SNS 是發布/訂閱推播、無回放；D Amazon MQ 是傳統訊息代理，非大規模串流回放設計。

</Quiz>

<Quiz
  qnum={13}
  total={65}
  question="開發者要在多個函式與服務間共用資料庫連線字串等設定，希望能分層管理（如 /app/prod/db）、支援版本並可免費使用標準參數。下列哪個服務最適合存放這類「非機密」設定？"
  options={[
    'AWS Systems Manager Parameter Store（標準參數）',
    'Amazon S3 公開物件',
    'Lambda 環境變數硬編碼明文密碼',
    'DynamoDB 單一項目存所有設定',
  ]}
  answer={0}>

**正解：A** — Parameter Store 以階層路徑管理設定、支援版本，標準參數免費，很適合集中存放連線字串等設定（機密可用 SecureString 搭配 KMS）。B 公開物件會外洩設定；C 硬編碼明文密碼不安全；D 自建 DynamoDB 設定表重造輪子且缺少參數管理功能。

</Quiz>

<Quiz
  qnum={14}
  total={65}
  question="開發者用 AWS SDK 呼叫服務時偶遇 ThrottlingException，想讓用戶端在暫時性錯誤時更有韌性。下列哪兩項做法最正確？（選兩項）"
  options={[
    '使用 SDK 內建的重試設定（可調最大重試次數與模式）',
    '採用指數退避加抖動（jitter）以分散重試時間',
    '關閉所有重試，讓錯誤直接往上拋',
    '收到節流就固定每 10 毫秒重試一次直到成功',
    '把請求改為同步阻塞直到服務恢復',
  ]}
  answer={[0, 1]}>

**正解：A、B** — 讓用戶端有韌性的兩招：善用 AWS SDK 內建可設定的重試機制（A）；並採指數退避加抖動以分散重試時間、避免同時重試造成第二波節流（B）。C 關閉重試會讓暫時性錯誤直接失敗；D 固定高頻重試會加劇節流且無退避；E 阻塞等待不是重試策略。

</Quiz>

<Quiz
  qnum={15}
  total={65}
  question="某團隊想用基礎設施即程式碼管理 Lambda、API Gateway、DynamoDB，且偏好簡潔語法與內建的本機測試/部署工具，專為無伺服器最佳化。下列哪個最符合？"
  options={[
    '手動在主控台逐一建立資源',
    'AWS SAM（Serverless Application Model）',
    '用 shell 指令稿逐一呼叫 CLI 建資源',
    '把資源設定寫在 README 讓人照做',
  ]}
  answer={1}>

**正解：B** — AWS SAM 是建構在 CloudFormation 上、專為無伺服器最佳化的框架，語法精簡並提供 `sam local`、`sam deploy` 等本機測試與部署工具。A 手動建立無法重現；C 土炮指令稿缺乏狀態管理與回復；D 文件不是基礎設施即程式碼。

</Quiz>

<Quiz
  qnum={16}
  total={65}
  question="開發者要讓一個 S3 物件上傳事件觸發兩個互不相干的下游（一個寫稽核日誌、一個做縮圖），且希望鬆耦合、未來易於再加訂閱者。下列哪個架構最適合作為事件扇出？"
  options={[
    'S3 直接同時呼叫兩個 Lambda 並寫死在程式中',
    'S3 事件送到 SNS 主題，由多個訂閱者（Lambda、SQS）各自接收做扇出',
    '把兩個工作塞進同一個 Lambda 依序執行',
    '用 CloudWatch 指標觸發',
  ]}
  answer={1}>

**正解：B** — 事件扇出的標準做法是讓來源發布到 SNS，多個訂閱者（Lambda、SQS 等）各自消費，彼此解耦、日後加訂閱者不動現有流程。A 寫死多個目標難維護；C 單一函式串接讓兩工作互相影響、違反解耦；D CloudWatch 指標不是事件扇出機制。

</Quiz>

<Quiz
  qnum={17}
  total={65}
  question="一個函式需要讀取 DynamoDB 串流（DynamoDB Streams）以在項目變更時觸發後續處理，並要能處理失敗批次。下列哪兩項設定能提升可靠性？（選兩項）"
  options={[
    '設定失敗目的地（on-failure destination）或死信佇列以保存無法處理的記錄',
    '設定批次大小與批次視窗並啟用部分批次回應（report batch item failures）',
    '把串流檢視類型設為只有索引鍵以節省處理所需資料',
    '把 Lambda 逾時設為 1 秒以便快速放棄',
    '停用重試讓失敗記錄直接丟棄',
  ]}
  answer={[0, 1]}>

**正解：A、B** — 可靠消費串流的兩個關鍵：為處理不了的記錄設定失敗目的地/死信（A）避免卡死或遺失；以及調整批次大小/視窗並回報「部分批次失敗」（B）只重試失敗的那幾筆而非整批。C 改檢視類型影響的是資料完整度，不是可靠性；D 逾時 1 秒會讓正常處理也失敗；E 直接丟棄失敗記錄會造成資料遺失。

</Quiz>

<Quiz
  qnum={18}
  total={65}
  question="開發者要把一個每天清晨執行一次的資料彙整工作改為全受管排程觸發 Lambda，且希望用類似 cron 的表示式彈性設定時間。下列哪個服務最合適？"
  options={[
    'Amazon EventBridge 排程規則（schedule，cron/rate 運算式）',
    '在 EC2 上自己架一個 cron',
    '靠使用者手動每天點按觸發',
    'S3 生命週期規則',
  ]}
  answer={0}>

**正解：A** — EventBridge 可用 cron 或 rate 運算式設定排程規則定時觸發 Lambda，全受管免維護伺服器。B 自架 cron 需自行維運 EC2；C 手動觸發不可靠；D S3 生命週期是管理物件存續，非通用排程。

</Quiz>

<Quiz
  qnum={19}
  total={65}
  question="某 API 需要對同一回應依「查詢參數」提供不同內容，並希望在 API Gateway 層快取以降低後端負載。下列哪個設定最正確？"
  options={[
    '啟用 API Gateway 階段快取，並把該查詢參數設為快取索引鍵（cache key）的一部分',
    '完全停用快取以確保正確',
    '把所有回應的 TTL 設為 0',
    '在用戶端自行快取即可，不需動 API Gateway',
  ]}
  answer={0}>

**正解：A** — API Gateway 階段快取可針對方法快取回應；若回應隨某查詢參數不同，必須把該參數納入快取索引鍵，否則不同參數會命中到同一份快取而回錯內容。B、C 等於不快取，無法降低後端負載；D 用戶端快取無法替後端分流且無法跨用戶共享。

</Quiz>

<Quiz
  qnum={20}
  total={65}
  question="開發者在本機想用容器化方式測試完整的無伺服器應用（Lambda＋API Gateway）後再部署，希望盡量貼近雲端行為。下列哪個工具最直接？"
  options={[
    '只能部署到雲端後才測試',
    'sam local invoke / sam local start-api 在本機以容器模擬叫用',
    '用瀏覽器直接開啟 .py 檔',
    '把程式貼到主控台的程式碼編輯器逐行試',
  ]}
  answer={1}>

**正解：B** — SAM CLI 的 `sam local invoke` 與 `sam local start-api` 會以容器在本機模擬 Lambda 執行環境與 API Gateway，讓你部署前就近似雲端行為地測試。A 部署後才測回饋太慢；C 直接開 .py 無法模擬 Lambda 執行環境；D 主控台逐行試不是可重複的測試流程。

</Quiz>

## 第二部分 · 安全（第 21–37 題）

<Quiz
  qnum={21}
  total={65}
  question="某 Web 與行動應用需要讓終端使用者以 email/密碼或社群帳號登入（使用者註冊、驗證、權杖簽發），開發者要的是「使用者目錄與驗證」這一塊。下列哪個 Cognito 元件負責此職責？"
  options={[
    'Cognito 使用者池（User Pool）',
    'Cognito 身分池（Identity Pool）',
    'IAM 使用者群組',
    'KMS 金鑰原則',
  ]}
  answer={0}>

**正解：A** — 使用者池負責使用者目錄、註冊/登入/MFA 並簽發 JWT（身分與存取權杖），正是「驗證」這一塊。B 身分池負責把已驗證身分換成臨時 AWS 憑證以存取 AWS 服務（授權到 AWS）；C IAM 使用者是給 AWS 身分不是 App 終端使用者；D KMS 原則與登入無關。

</Quiz>

<Quiz
  qnum={22}
  total={65}
  question="承上，使用者在使用者池登入後，應用需要讓他們「直接存取 AWS 服務」（例如上傳到特定 S3 前綴），且要臨時憑證、依身分給不同權限。下列哪個 Cognito 元件負責此職責？"
  options={[
    'Cognito 使用者池',
    'Cognito 身分池（Identity Pool）換發臨時 AWS 憑證',
    '把 IAM 長期金鑰寫進 App',
    'API Gateway 使用方案（Usage Plan）',
  ]}
  answer={1}>

**正解：B** — 身分池接受使用者池（或其他 IdP）的權杖，透過 STS 換發臨時 AWS 憑證並對應到 IAM 角色，讓前端在受控權限下直接存取 AWS 服務。A 使用者池只管驗證不發 AWS 憑證；C 長期金鑰進 App 極危險；D 使用方案是 API 配額/金鑰管理，非 AWS 憑證換發。

</Quiz>

<Quiz
  qnum={23}
  total={65}
  question="開發者要加密大量 S3 物件，希望以「信封加密」降低對 KMS 的呼叫次數與成本：用 KMS 產生資料金鑰加密資料，KMS 只負責加解密那把資料金鑰。下列哪個描述最符合信封加密？"
  options={[
    '每個物件都直接呼叫 KMS Encrypt 用 CMK 加密整份資料',
    '用 KMS 產生資料金鑰（data key）在本機加密資料，僅把加密後的資料金鑰交給 KMS 保管/解密',
    '把 KMS 主金鑰下載到應用伺服器本機加密',
    '不用 KMS，自己在程式裡寫死一把對稱金鑰',
  ]}
  answer={1}>

**正解：B** — 信封加密是：向 KMS 取得一把資料金鑰，用它在本機加密大量資料，之後只需讓 KMS 加解密那把（體積小的）資料金鑰，省下大量直接對大資料呼叫 KMS 的成本。A 直接用 CMK 加密整份資料受限於大小且呼叫昂貴；C KMS 主金鑰無法匯出；D 寫死金鑰不可輪替也不安全。

</Quiz>

<Quiz
  qnum={24}
  total={65}
  question="資料庫密碼需要定期自動輪替，且應用能透過 API 取得最新值、不需重新部署。下列哪個服務最適合存放這類「需自動輪替的機密」？"
  options={[
    'AWS Secrets Manager，設定自動輪替並由應用在執行期擷取',
    '把密碼寫在 Lambda 環境變數並手動更新',
    '把密碼放進公開 Git repo 的設定檔',
    '存在 S3 公開物件供應用讀取',
  ]}
  answer={0}>

**正解：A** — Secrets Manager 專為機密設計，內建與多種資料庫整合的自動輪替，應用於執行期用 API 取得最新密碼而不需重新部署。B 環境變數需手動更新且會留明文；C 放公開 repo 是嚴重外洩；D S3 公開物件等於公開密碼。

</Quiz>

<Quiz
  qnum={25}
  total={65}
  question="Lambda 執行角色需要存取 S3 與 DynamoDB，安全團隊要求遵守最小權限、且不得使用萬用字元資源。下列哪個做法最正確？"
  options={[
    '附加 AdministratorAccess 以免日後缺權限',
    '自訂政策只允許所需動作並把 Resource 限定到特定的 ARN',
    '把 Access Key 嵌進函式程式碼',
    '附加 PowerUserAccess',
  ]}
  answer={1}>

**正解：B** — 最小權限要把 Action 與 Resource 都收斂到剛好夠用，用特定 ARN 取代萬用字元。A、D 的受管政策權限遠超需求；C 內嵌長期金鑰既不安全也違反「用執行角色取得臨時憑證」的原則。

</Quiz>

<Quiz
  qnum={26}
  total={65}
  question="開發者要讓 EC2 上的應用呼叫 AWS 服務，希望完全不在機器上存放任何長期金鑰。下列哪個做法最正確？"
  options={[
    '把 IAM 使用者的 Access Key 寫進設定檔',
    '為 EC2 指派 IAM 執行個體設定檔（instance profile）/角色，由執行個體自動取得臨時憑證',
    '把金鑰放到環境變數並定期手動換',
    '用 Root 金鑰避免權限問題',
  ]}
  answer={1}>

**正解：B** — 指派 IAM 角色給 EC2（透過執行個體設定檔），應用可經由執行個體中繼資料自動取得會自動輪替的臨時憑證，機器上完全不存長期金鑰。A、C 都在機器留下長期金鑰；D 用 Root 金鑰是最嚴重的反模式。

</Quiz>

<Quiz
  qnum={27}
  total={65}
  question="某帳號 A 的角色需要被帳號 B 的使用者承擔（跨帳號存取）。要讓這個 AssumeRole 成立，下列哪兩項設定是必要的？（選兩項）"
  options={[
    '帳號 A 角色的信任政策（trust policy）允許帳號 B 的主體 sts:AssumeRole',
    '帳號 B 端的身分被授予 sts:AssumeRole 指向帳號 A 的角色',
    '把帳號 A 的 Root 金鑰交給帳號 B',
    '兩個帳號必須在同一個可用區',
    '帳號 A 角色必須附加 AdministratorAccess',
  ]}
  answer={[0, 1]}>

**正解：A、B** — 跨帳號承擔角色需「兩邊都同意」：被承擔角色（帳號 A）的信任政策要允許帳號 B 的主體（A）；承擔方（帳號 B）的身分要有權限呼叫 sts:AssumeRole 指向該角色（B）。C 交出 Root 金鑰是嚴重反模式；D 承擔角色與可用區無關；E 不需要給管理員權限，違反最小權限。

</Quiz>

<Quiz
  qnum={28}
  total={65}
  question="開發者用 API Gateway 保護後端 API，希望以使用者池的 JWT 權杖做驗證，且不想自己寫驗章邏輯。下列哪個做法最直接？"
  options={[
    '使用 API Gateway 的 Cognito 使用者池授權方（authorizer）驗證 JWT',
    '在每個 Lambda 裡自己手刻 JWT 驗證',
    '把後端完全公開再用防火牆擋',
    '用 API 金鑰當作身分驗證',
  ]}
  answer={0}>

**正解：A** — API Gateway 可直接設定 Cognito 使用者池授權方，由閘道驗證請求夾帶的 JWT，省去在每個函式重複手刻。B 到處手刻易錯且難維護；C 公開後端風險高；D API 金鑰用於識別呼叫方與配額，不是使用者身分驗證。

</Quiz>

<Quiz
  qnum={29}
  total={65}
  question="團隊要在 CI/CD 流程中避免把任何雲端長期金鑰放進程式碼倉庫或建置環境。下列哪個做法最符合最佳實務？"
  options={[
    '把 Access Key 存進 CI 的純文字變數',
    '使用 OIDC 聯合讓 CI 以短期臨時憑證承擔 IAM 角色',
    '把金鑰 base64 後提交到 repo',
    '共用一組永久金鑰給所有流水線',
  ]}
  answer={1}>

**正解：B** — 以 OIDC 聯合讓 CI 服務換發短期臨時憑證、承擔受限角色，可徹底避免在 repo 或 CI 放長期金鑰。A 純文字變數仍是長期金鑰；C base64 只是編碼不是加密、等於外洩；D 共用永久金鑰無法稽核且風險極高。

</Quiz>

<Quiz
  qnum={30}
  total={65}
  question="開發者希望 S3 儲存貯體的所有物件在靜態時都加密，且由 AWS 全受管金鑰、免自行管理。下列哪個加密選項最省事？"
  options={[
    'SSE-S3（Amazon S3 受管金鑰）作為預設加密',
    '把物件先在本機用寫死金鑰加密再上傳',
    '完全不加密以簡化流程',
    '每次上傳自己呼叫第三方加密服務',
  ]}
  answer={0}>

**正解：A** — SSE-S3 以 Amazon S3 受管金鑰在伺服器端自動加密物件，開發者不需管理金鑰（需要稽核與自管輪替時才升級到 SSE-KMS）。B 寫死金鑰不安全；C 不加密不符合要求；D 自接第三方徒增複雜度。

</Quiz>

<Quiz
  qnum={31}
  total={65}
  question="一個 KMS 客戶受管金鑰需要讓特定角色能「使用金鑰加解密」但不能「管理金鑰（如排程刪除）」。要正確分權，主要應調整下列哪一項？"
  options={[
    '金鑰原則（key policy）/授予（grant），分別授予使用與管理的動作給不同主體',
    '把金鑰設為公開',
    '刪除金鑰重建',
    '改用對稱密碼寫在程式裡',
  ]}
  answer={0}>

**正解：A** — KMS 以金鑰原則與授予控制「誰能用、誰能管」，可把 kms:Encrypt/Decrypt 等使用動作給一組主體、把 kms:ScheduleKeyDeletion 等管理動作給另一組，達成分權。B 金鑰不可公開；C 刪除重建不解決分權；D 寫死金鑰是反模式。

</Quiz>

<Quiz
  qnum={32}
  total={65}
  question="開發者要呼叫一個沒有 SDK 輔助的 AWS 服務端點，必須自行對請求簽章。下列哪個描述最符合 AWS 的請求簽章（SigV4）？"
  options={[
    '把密碼放在 URL 查詢字串明文傳送',
    '用 Signature Version 4 以存取金鑰對請求的標頭與內容做簽章，服務端驗章',
    '只要走 HTTPS 就不需要任何簽章',
    '每次請求都附上 Root 密碼',
  ]}
  answer={1}>

**正解：B** — AWS 以 SigV4 對請求（含標頭、酬載雜湊、時間戳）計算簽章，服務端以相同演算法驗證，確保身分與完整性且避免重放。A 明文傳密碼極危險；C HTTPS 只保傳輸加密、不等於 AWS 驗章；D 附 Root 密碼是嚴重反模式。

</Quiz>

<Quiz
  qnum={33}
  total={65}
  question="某跨來源前端呼叫受 Cognito 保護的 API，開發者要把使用者的身分權杖安全地帶給後端驗證。下列哪個做法最正確？"
  options={[
    '把使用者密碼隨每個請求送到後端',
    '前端在 Authorization 標頭帶上使用者池簽發的 JWT，由授權方驗證',
    '把 JWT 存進網址列當查詢參數並記錄到日誌',
    '後端信任任何帶有 userId 參數的請求',
  ]}
  answer={1}>

**正解：B** — 標準做法是前端在 Authorization 標頭帶 Cognito 簽發的 JWT，後端/授權方驗簽與有效期後才放行。A 傳使用者密碼違反零信任；C 權杖放網址會被日誌或瀏覽器紀錄外洩；D 單憑 userId 參數無法證明身分。

</Quiz>

<Quiz
  qnum={34}
  total={65}
  question="開發者要限制一個 Lambda 只能被特定 S3 儲存貯體的事件觸發，避免其他來源任意叫用。下列哪個做法最正確？"
  options={[
    '在函式的資源型政策（resource-based policy）上限定來源服務與來源 ARN',
    '把函式設為公開讓任何人可叫用',
    '在程式開頭用 if 判斷呼叫者 IP',
    '停用 CloudTrail 以減少干擾',
  ]}
  answer={0}>

**正解：A** — Lambda 的資源型政策可限定允許叫用的來源服務（如 S3）與特定來源 ARN（SourceArn），確保只有指定儲存貯體能觸發。B 公開叫用風險高；C 在程式內判斷 IP 既不可靠也繞過了授權層；D 停 CloudTrail 反而失去稽核。

</Quiz>

<Quiz
  qnum={35}
  total={65}
  question="團隊要把資料庫連線字串（含密碼）提供給 Lambda，希望加密靜態值並能稽核誰讀取過。下列哪兩項做法最符合安全最佳實務？（選兩項）"
  options={[
    '用 Secrets Manager 或 Parameter Store SecureString 以 KMS 加密存放',
    '以 CloudTrail 記錄對機密的讀取（存取稽核）',
    '把密碼明文寫進函式環境變數供長期使用',
    '把密碼印在 CloudWatch Logs 方便除錯',
    '把密碼寫死在程式碼中並提交到 repo',
  ]}
  answer={[0, 1]}>

**正解：A、B** — 安全存放機密的兩個要點：用 Secrets Manager 或 Parameter Store SecureString 以 KMS 加密靜態值（A）；並以 CloudTrail 稽核對機密的存取（B）。C 明文環境變數會外洩；D 把密碼印進日誌等於外洩；E 寫死並提交到 repo 是最嚴重的外洩。

</Quiz>

<Quiz
  qnum={36}
  total={65}
  question="開發者發現兩個 Lambda 共用同一個執行角色，但其中一個只需讀 S3、另一個只需寫 DynamoDB。依最小權限原則應如何處理？"
  options={[
    '維持共用角色並附上兩者權限的聯集',
    '為每個函式各建一個只含自身所需權限的執行角色',
    '乾脆給兩個函式都 AdministratorAccess',
    '刪掉角色改用 Access Key',
  ]}
  answer={1}>

**正解：B** — 最小權限主張每個函式只拿自己所需的權限，應拆成各自的執行角色，避免讀 S3 的函式順便握有寫 DynamoDB 的能力。A 聯集權限讓每個函式都超出所需；C 管理員權限嚴重過大；D 用 Access Key 是反模式。

</Quiz>

<Quiz
  qnum={37}
  total={65}
  question="某 API 需要對第三方開發者發放可識別與限流的憑證，但這「不是」使用者身分驗證。下列哪個 API Gateway 功能最適合？"
  options={[
    'API 金鑰搭配使用方案（Usage Plan）做識別與配額/速率限制',
    'Cognito 使用者池授權方',
    'IAM 簽章驗證',
    'KMS 金鑰原則',
  ]}
  answer={0}>

**正解：A** — API 金鑰搭配使用方案可識別呼叫方並套用配額與速率限制，適合對外部開發者分級限流；它本身不是身分驗證手段。B 使用者池授權方驗的是終端使用者身分；C IAM 簽章驗的是 AWS 主體；D KMS 原則與 API 限流無關。

</Quiz>

## 第三部分 · 測試與部署（第 38–51 題）

<Quiz
  qnum={38}
  total={65}
  question="團隊要部署 ECS 服務時做到「舊版持續服務直到新版就緒，期間可自動依健康檢查回退，但部署時暫時需要雙倍資源」。下列哪個部署策略最符合此描述？"
  options={[
    '就地（in-place）滾動更新，逐一替換現有工作',
    '藍/綠部署，另起一組新版環境、就緒後切流量、有問題則切回',
    '直接停掉所有工作再開新版',
    '只在本機測試不部署',
  ]}
  answer={1}>

**正解：B** — 藍/綠部署會另起一整組新版（故需暫時雙倍資源），驗證通過才切換流量，出問題可立刻切回舊環境，停機與風險低。A 滾動更新是逐一替換、不需雙倍但回退較慢；C 全停再開會造成停機；D 不部署不符需求。

</Quiz>

<Quiz
  qnum={39}
  total={65}
  question="開發者用 CodeDeploy 搭配 Lambda 做部署，想要「先只把 10% 流量導到新版、觀察 5 分鐘無誤後再把其餘 90% 一次切過去」。下列哪個部署組態類型最符合？"
  options={[
    'Canary（金絲雀，先少量、觀察後一次放完）',
    'AllAtOnce（一次全切）',
    'Linear（線性，每隔固定時間放一批）',
    'In-place（就地覆寫）',
  ]}
  answer={0}>

**正解：A** — 金絲雀（Canary）正是「先導一小部分流量、觀察一段時間再把剩餘一次切過去」。B AllAtOnce 立即全切、無觀察期；C Linear 是每隔固定時間放等量一批（例如每 1 分鐘 10%）；D 就地覆寫不是 Lambda 的加權切流概念。

</Quiz>

<Quiz
  qnum={40}
  total={65}
  question="承上，若需求改為「每隔 10 分鐘把 10% 流量平均逐步切到新版，直到 100%」，最符合的 CodeDeploy 部署類型是？"
  options={[
    'Canary',
    'Linear（線性，固定間隔等量遞增）',
    'AllAtOnce',
    'Blue/Green 之外沒有其他選擇',
  ]}
  answer={1}>

**正解：B** — 每隔固定時間平均遞增固定比例屬於 Linear（線性）部署。A 金絲雀是「少量＋觀察＋一次放完」兩段式；C AllAtOnce 立即全切；D 說法錯誤，Lambda/ECS 皆有多種流量切換類型可選。

</Quiz>

<Quiz
  qnum={41}
  total={65}
  question="團隊的 CI/CD 想在同一條管線中做來源→建置→測試→部署，且各階段產物要能傳遞、失敗時停止。下列哪組 AWS 服務最直接對應此流程？"
  options={[
    'CodePipeline 串接 CodeBuild（建置/測試）與 CodeDeploy（部署）',
    '只用 S3 靜態網站託管即可完成 CI/CD',
    'CloudFront 搭配 Route 53',
    'Athena 搭配 QuickSight',
  ]}
  answer={0}>

**正解：A** — CodePipeline 負責編排各階段並傳遞產物、失敗即停；CodeBuild 做建置與測試、CodeDeploy 做部署，正好組成完整管線。B 靜態託管不含建置/測試/部署編排；C 是內容傳遞與 DNS；D 是分析與 BI，皆非 CI/CD 骨幹。

</Quiz>

<Quiz
  qnum={42}
  total={65}
  question="開發者要在 CodeBuild 定義建置步驟（安裝相依、執行測試、產出成品）。下列哪個是 CodeBuild 用來描述建置階段的設定檔？"
  options={[
    'appspec.yml',
    'buildspec.yml',
    'template.yaml（SAM）',
    'Dockerfile',
  ]}
  answer={1}>

**正解：B** — CodeBuild 以 `buildspec.yml` 定義 install/pre_build/build/post_build 等階段與產出成品（artifacts）。A `appspec.yml` 是 CodeDeploy 的部署指示檔；C SAM 的 `template.yaml` 定義無伺服器資源；D Dockerfile 定義映像建置，非 CodeBuild 的階段規格。

</Quiz>

<Quiz
  qnum={43}
  total={65}
  question="承上，CodeDeploy 需要一份檔案來描述「要部署哪個版本、部署到哪裡、以及部署生命週期掛鉤（如 BeforeAllowTraffic 驗證）」。下列哪個檔案負責此職責？"
  options={[
    'buildspec.yml',
    'appspec.yml / appspec.yaml',
    'package.json',
    'cfn-init 設定',
  ]}
  answer={1}>

**正解：B** — CodeDeploy 以 `appspec` 描述部署目標、檔案對應與生命週期事件掛鉤（如 BeforeAllowTraffic 跑驗證）。A buildspec 是 CodeBuild 的；C package.json 是 Node 專案的相依宣告；D cfn-init 是 CloudFormation 的執行個體初始化。

</Quiz>

<Quiz
  qnum={44}
  total={65}
  question="開發者想為 Lambda 建立合理的自動化測試分層：單元測試只驗證商業邏輯、不真的呼叫 AWS，再以另一層測試對真實 AWS 資源驗證端到端。下列哪兩項做法最符合此分層？（選兩項）"
  options={[
    '單元測試中模擬（mock）AWS 呼叫，專注驗證商業邏輯以求快速回饋',
    '另設整合測試對真實或 sam local 環境做端到端驗證',
    '全部用整合測試直接打生產環境',
    '只在主控台手動點按測試',
    '把測試全部拿掉以加速交付',
  ]}
  answer={[0, 1]}>

**正解：A、B** — 合理分層的兩個關鍵：單元測試以 mock 隔離 AWS、專注商業邏輯快速回饋（A）；整合測試再對真實資源或本機模擬環境（sam local）驗證端到端行為（B）。C 直打生產風險高；D 手動點按不可重複；E 拿掉測試是交付品質的反模式。

</Quiz>

<Quiz
  qnum={45}
  total={65}
  question="團隊用 SAM 部署，想在同一個範本以參數/組態切換 dev 與 prod 的設定（如記憶體、環境變數），避免維護多份幾乎相同的範本。下列哪個做法最合適？"
  options={[
    '複製整份範本各改一份給每個環境',
    '用 CloudFormation/SAM 的參數（Parameters）與 sam deploy 的組態（samconfig）依環境帶入不同值',
    '把環境差異寫死在程式碼中',
    '每個環境各自手動在主控台調',
  ]}
  answer={1}>

**正解：B** — 用參數化範本＋各環境的部署組態帶入不同值，單一範本可重用於多環境，降低漂移與維護成本。A 複製多份容易不同步；C 寫死在程式碼不是基礎設施組態；D 手動調整無法重現也易漏。

</Quiz>

<Quiz
  qnum={46}
  total={65}
  question="開發者要在 ECS/EKS 上部署容器，映像需集中儲存、具版本標籤與漏洞掃描，且與 IAM 整合做存取控制。下列哪個服務最適合當作映像倉庫？"
  options={[
    'Amazon ECR（Elastic Container Registry）',
    'Amazon S3 存 tar 檔',
    '在 EC2 自架未加密的 registry',
    'DynamoDB 存映像二進位',
  ]}
  answer={0}>

**正解：A** — ECR 是全受管容器映像倉庫，支援標籤、生命週期政策、映像掃描並與 IAM 整合控管存取。B 把映像塞 S3 失去 registry 語意與拉取整合；C 自架未加密 registry 需自維運且不安全；D DynamoDB 不是設計來存大型映像。

</Quiz>

<Quiz
  qnum={47}
  total={65}
  question="團隊希望每次合併到主分支就自動建置映像、推到 ECR 並更新 ECS 服務，且失敗要能停止並通知。下列哪個做法最符合「自動化部署」精神？"
  options={[
    '工程師手動在本機 build 後 docker push 再到主控台更新服務',
    '以 CodePipeline 觸發 CodeBuild 建置推送 ECR，再由部署階段更新 ECS，失敗即停並通知',
    '把映像用 email 寄給維運手動部署',
    '每次改動都重建整個叢集',
  ]}
  answer={1}>

**正解：B** — 以管線在合併時自動建置、推送 ECR、更新 ECS 並在失敗時停止/通知，符合可重複、可稽核的自動化部署。A 手動步驟易出錯且不可重現；C email 傳映像荒謬且不可追溯；D 每次重建整個叢集成本高且非必要。

</Quiz>

<Quiz
  qnum={48}
  total={65}
  question="開發者在 CodeDeploy 的 appspec 生命週期掛鉤中放了驗證腳本，若新版健康檢查失敗希望自動回退到舊版。下列哪個設定最符合此需求？"
  options={[
    '停用回退，失敗就讓新版繼續服務',
    '啟用部署失敗時自動回退，並在 BeforeAllowTraffic 掛鉤執行健康驗證',
    '把所有流量先全切到新版再測試',
    '刪除舊版後再部署新版',
  ]}
  answer={1}>

**正解：B** — 在切流前的掛鉤（如 BeforeAllowTraffic）執行健康驗證，並啟用「部署失敗自動回退」，驗證不過即回到舊版，風險最低。A 停用回退會把壞版本留在線上；C 先全切再測失去保護；D 先刪舊版就失去回退依據。

</Quiz>

<Quiz
  qnum={49}
  total={65}
  question="開發者要把一組設定（功能旗標、A/B 比例）在不執行部署的情況下安全地推給執行中的應用，並能逐步放量與快速回退。下列哪個服務最適合管理這類動態組態？"
  options={[
    'AWS AppConfig（含驗證與逐步發布）',
    '把旗標寫死在程式碼重新部署',
    '把旗標放進唯讀 README',
    '每次改旗標都重建映像',
  ]}
  answer={0}>

**正解：A** — AppConfig 專為動態組態設計，支援結構/語意驗證、逐步發布與回退警報，可在不重新部署下安全變更功能旗標。B 寫死需重新部署且無逐步放量；C README 無法被應用讀取套用；D 重建映像違背「免部署變更」初衷。

</Quiz>

<Quiz
  qnum={50}
  total={65}
  question="開發者要把 Lambda 以容器映像方式交付（既有的容器建置流程），映像需放在哪裡才能被 Lambda 直接拉取部署？"
  options={[
    'Docker Hub 公開倉庫',
    'Amazon ECR（Lambda 支援從 ECR 拉取容器映像）',
    'S3 存成 zip',
    'GitHub Releases',
  ]}
  answer={1}>

**正解：B** — Lambda 的容器映像部署會從 Amazon ECR 拉取映像。A/C/D 都不是 Lambda 容器映像的來源（zip 套件走的是 .zip 部署管道，與容器映像不同）。

</Quiz>

<Quiz
  qnum={51}
  total={65}
  question="團隊要為 API 寫自動化整合測試，希望在管線的部署後階段對剛部署的測試環境發出真實 HTTP 請求驗證端到端，再決定是否放行到生產。下列哪個做法最合理？"
  options={[
    '只在合併前跑單元測試就直接上生產',
    '在管線中加入部署到測試環境後的整合測試階段，通過才晉級到生產',
    '把整合測試直接對生產環境做破壞性操作',
    '靠使用者回報 bug 當作測試',
  ]}
  answer={1}>

**正解：B** — 在管線加一個「部署到測試環境後跑整合測試」的關卡，通過才晉級到生產，兼顧真實驗證與生產安全。A 只有單元測試不足以涵蓋整合風險；C 對生產做破壞性測試危險；D 靠使用者回報不是測試策略。

</Quiz>

## 第四部分 · 疑難排解與最佳化（第 52–65 題）

<Quiz
  qnum={52}
  total={65}
  question="開發者發現一個跨多服務（API Gateway→Lambda→DynamoDB）的請求偶爾很慢，想找出延遲到底卡在哪一段。下列哪個做法最直接？"
  options={[
    '啟用 AWS X-Ray 分散式追蹤，檢視各區段（segment/subsegment）的耗時找出瓶頸',
    '只看 Lambda 的總執行時間猜測',
    '把所有服務的逾時都調到最大',
    '重開機所有資源',
  ]}
  answer={0}>

**正解：A** — X-Ray 以追蹤與服務地圖呈現請求在各服務的耗時區段，能精準定位延遲卡在哪一段。B 只看單一指標無法定位跨服務瓶頸；C 調逾時只是遮掩問題；D 重開機不是診斷方法。

</Quiz>

<Quiz
  qnum={53}
  total={65}
  question="開發者呼叫 S3 時收到 HTTP 503 SlowDown（請求速率過高造成節流）。希望用程式層策略緩解而非無腦重打。下列哪個做法最正確？"
  options={[
    '收到 503 後立即以固定高頻率重試',
    '採用指數退避加抖動重試，並視情況分散索引鍵前綴以提升可擴展性',
    '忽略 503 當作成功',
    '把物件改成公開以略過限制',
  ]}
  answer={1}>

**正解：B** — 面對節流類錯誤（503 SlowDown）應以指數退避加抖動重試分散壓力，必要時調整索引鍵前綴分佈提升平行度。A 固定高頻重試會加劇節流；C 忽略錯誤會造成資料遺失；D 改公開與節流無關且不安全。

</Quiz>

<Quiz
  qnum={54}
  total={65}
  question="一個同步 API 的 Lambda 因冷啟動導致偶發的首請求高延遲，且流量有明顯的可預期尖峰（例如每天上午 9 點）。下列哪兩項做法可有效降低冷啟動影響？（選兩項）"
  options={[
    '為函式設定預置並發，在尖峰前備妥暖執行環境',
    '縮小部署套件與相依、精簡初始化邏輯以加快冷啟動',
    '把函式記憶體設為最小值以省錢',
    '停用所有重試',
    '把函式改成每次請求都重新建立所有連線',
  ]}
  answer={[0, 1]}>

**正解：A、B** — 降低冷啟動影響的兩招：對可預期尖峰用預置並發事先暖機（A）；並縮小套件、精簡初始化以縮短冷啟動本身（B）。C 記憶體太小反而拉長執行與初始化；D 停用重試與冷啟動無關；E 每次重建連線會讓延遲更糟。

</Quiz>

<Quiz
  qnum={55}
  total={65}
  question="開發者發現 DynamoDB 某些請求回傳 ProvisionedThroughputExceededException，且集中在單一分割索引鍵（熱鍵）。下列哪個做法最能根治？"
  options={[
    '無限次立即重試該請求',
    '重新設計分割索引鍵使存取更均勻（或加入寫入分片），必要時改用隨需容量',
    '把資料表刪掉重建',
    '把所有讀寫改成強一致以加速',
  ]}
  answer={1}>

**正解：B** — 熱鍵造成單一分割吞吐爆掉，根治之道是重新設計分割索引鍵讓存取分散（或加寫入分片後綴），並可用隨需容量吸收尖峰。A 立即重試治標不治本；C 刪表重建不改分佈問題；D 強一致讀反而增加負擔且與熱鍵無關。

</Quiz>

<Quiz
  qnum={56}
  total={65}
  question="開發者要在程式中加入結構化日誌並能依請求關聯排查問題，希望用全受管的集中式日誌查詢與分析。下列哪個做法最合適？"
  options={[
    '把日誌寫到函式本機磁碟',
    '輸出到 CloudWatch Logs，用結構化（JSON）日誌並以 Logs Insights 查詢',
    '只 print 到標準輸出不收集',
    '把日誌 email 給自己',
  ]}
  answer={1}>

**正解：B** — Lambda 標準輸出會進 CloudWatch Logs；採 JSON 結構化日誌並用 CloudWatch Logs Insights 查詢，可依欄位/請求 ID 快速關聯排查。A 本機磁碟在 Lambda 不持久；C 不收集就無從查詢；D email 日誌無法檢索分析。

</Quiz>

<Quiz
  qnum={57}
  total={65}
  question="某非同步呼叫的 Lambda 偶有事件處理失敗，團隊希望失敗且重試用盡的事件不要遺失、能事後檢視與重放。下列哪個做法最正確？"
  options={[
    '讓失敗事件直接丟棄',
    '設定失敗目的地（on-failure destination）或死信佇列（DLQ）保存失敗事件',
    '把重試次數設為 0',
    '把函式逾時設為 1 秒',
  ]}
  answer={1}>

**正解：B** — 非同步叫用可設定失敗目的地或 DLQ，把重試用盡的事件送去 SQS/SNS 保存，供事後檢視與重放，避免遺失。A 丟棄會遺失資料；C 關閉重試使暫時性錯誤直接失敗；D 逾時 1 秒會讓正常處理也失敗。

</Quiz>

<Quiz
  qnum={58}
  total={65}
  question="開發者呼叫某服務收到 HTTP 429（Too Many Requests）。下列哪個對此狀態碼與處置的描述最正確？"
  options={[
    '429 代表伺服器內部錯誤，應回報為程式 bug',
    '429 代表被節流/速率過高，屬可重試，應以退避重試並視需要降低請求速率',
    '429 代表權限不足，應更換金鑰',
    '429 代表資源不存在，應建立資源',
  ]}
  answer={1}>

**正解：B** — 429 表示請求過多被節流，屬可重試錯誤，正確處置是退避重試並降低速率。A 內部錯誤是 5xx；C 權限不足是 403；D 資源不存在是 404，皆非 429 的語意。

</Quiz>

<Quiz
  qnum={59}
  total={65}
  question="開發者發現應用對 Secrets Manager 的擷取次數過高拉高成本與延遲。下列哪個最佳化最直接？"
  options={[
    '每次請求都重新擷取機密',
    '在函式初始化時擷取並於執行環境內快取機密，設定合理 TTL 再重取',
    '把機密改成明文寫死以免呼叫',
    '把機密放進公開 S3 供免費讀取',
  ]}
  answer={1}>

**正解：B** — 在 handler 外（初始化）擷取並於暖執行環境內快取機密、搭配合理 TTL，可大幅減少擷取次數與延遲。A 每次重取既慢又貴；C 明文寫死不安全；D 公開 S3 等於外洩機密。

</Quiz>

<Quiz
  qnum={60}
  total={65}
  question="一支 Lambda 執行時間接近設定的逾時，日誌顯示它在等待一個偶爾很慢的外部 HTTP 相依。下列哪組排查/最佳化最合理？"
  options={[
    '無限拉高逾時當作解法',
    '為外部呼叫設合理逾時與退避重試、用 X-Ray 定位慢點，必要時改非同步或加快取',
    '把函式記憶體設為最小',
    '直接關閉日誌以提升效能',
  ]}
  answer={1}>

**正解：B** — 正確做法是為外部相依設合理逾時與退避、用 X-Ray 找出慢在哪，再視情況改非同步處理或加快取降低依賴。A 一味拉高逾時只是拖延並增加成本；C 記憶體太小會更慢；D 關日誌反而失去排查依據。

</Quiz>

<Quiz
  qnum={61}
  total={65}
  question="開發者想針對一個關鍵錯誤（例如 5xx 比例升高）即時收到通知並能自動觸發補救。下列哪個組合最直接？"
  options={[
    '靠人每小時手動看儀表板',
    '以 CloudWatch 指標/指標篩選建立警報，透過 SNS 通知並可觸發 Lambda 自動補救',
    '把錯誤忽略以免打擾',
    '只在月底檢視帳單推測問題',
  ]}
  answer={1}>

**正解：B** — 用 CloudWatch 警報監看指標（或由日誌指標篩選產生指標），超過門檻即經 SNS 通知並可觸發 Lambda 自動補救，達成即時可觀測與自動化回應。A 人工巡檢不即時；C 忽略錯誤危險；D 月底看帳單無法即時排查。

</Quiz>

<Quiz
  qnum={62}
  total={65}
  question="團隊要降低 Lambda 成本與延遲，發現函式記憶體設定偏低導致 CPU 不足、執行過久。下列哪個調校觀念最正確？"
  options={[
    '記憶體一律設最小最省錢',
    'Lambda 的 CPU 隨記憶體等比配置，適度調高記憶體可能縮短執行時間、反而更省或更快',
    '記憶體與 CPU 無關',
    '只要提高逾時就會變快',
  ]}
  answer={1}>

**正解：B** — Lambda 的 CPU/網路資源與記憶體等比配置，CPU 密集工作適度加記憶體常能縮短執行時間，總成本可能持平甚至下降（可用 Power Tuning 找甜蜜點）。A 一味最小可能更慢更貴；C 記憶體與 CPU 直接相關；D 提高逾時不會變快、只是允許跑更久。

</Quiz>

<Quiz
  qnum={63}
  total={65}
  question="開發者收到 Lambda 日誌中的 'Task timed out after N seconds'。下列哪個排查方向最正確？"
  options={[
    '這是權限錯誤，應更換執行角色',
    '函式在逾時內未完成，應分析耗時（外部相依/初始化）、設定合理逾時並最佳化，而非一味加大',
    '這代表記憶體不足，應改用 EC2',
    '直接忽略，逾時不影響結果',
  ]}
  answer={1}>

**正解：B** — 逾時訊息代表函式在設定時間內沒跑完，應先用日誌/X-Ray 找出耗時來源（慢的外部相依、過重初始化），最佳化後設合理逾時，而非盲目加大。A 不是權限問題；C 逾時不等於記憶體不足、也不必然要改 EC2；D 逾時會讓該次執行失敗，不能忽略。

</Quiz>

<Quiz
  qnum={64}
  total={65}
  question="某批次 Lambda 從 SQS 消費，偶有少數訊息處理失敗導致整批被重投、重複處理成功的訊息。下列哪個設定可只重試失敗的那幾筆？"
  options={[
    '把整批失敗全部重投，接受重複',
    '在事件來源映射啟用部分批次回應（ReportBatchItemFailures），只回報並重試失敗項目',
    '把批次大小設為 1 避免問題',
    '停用 DLQ',
  ]}
  answer={1}>

**正解：B** — 啟用部分批次回應（ReportBatchItemFailures）後，函式只回報失敗的訊息 ID，SQS 僅重投那幾筆，避免已成功的訊息被重複處理。A 整批重投造成重複；C 批次設 1 雖可避免但吞吐與成本變差；D 停用 DLQ 反而失去保存失敗訊息的保障。

</Quiz>

<Quiz
  qnum={65}
  total={65}
  question="開發者要在不改動大量程式的前提下，為一個讀多寫少、回應可短暫過期的 API 降低後端資料庫負載與延遲。下列哪兩項最直接有效？（選兩項）"
  options={[
    '在 API Gateway 啟用回應快取並設合理 TTL',
    '為資料庫前放記憶體內快取（如 ElastiCache/DAX）承接熱門讀取',
    '把所有查詢都改為強一致讀以加速',
    '關閉所有日誌以提升效能',
    '把資料庫執行個體刪掉改用檔案',
  ]}
  answer={[0, 1]}>

**正解：A、B** — 讀多寫少且容忍短暫過期時，最直接的兩招：API Gateway 回應快取用合理 TTL 擋掉重複請求（A）；並在資料庫前加記憶體內快取（ElastiCache/DAX）承接熱門讀取（B），兩者都能顯著降低後端負載與延遲。C 強一致讀反而更重；D 關日誌對延遲幫助甚微且失去可觀測性；E 刪資料庫改檔案荒謬。

</Quiz>

---

👉 回去複習：[考前速查與選型決策](./cheatsheet.md)
