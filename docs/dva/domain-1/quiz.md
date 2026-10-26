---
sidebar_position: 8
title: Domain 1 練習題
---

# Domain 1 原創練習題（仿官方考題風格）

先自己點選答案，再按「**顯示答案與解析**」。本頁對齊 DVA-C03 官方題型：**情境式題幹、開發者視角**，考的是**開發細節與取捨**（並發、版本別名、重試、冷啟動、整合方式、索引設計、一致性、事件驅動流程…），而非 SAA 那種純架構選型。選項皆為合理的 AWS 做法（誘答選項不會明顯錯誤），部分題用「**最少程式碼變更／最符合最佳實務／最具成本效益**」等**限定詞**逼你比較。包含**單選**與**複選（Choose TWO）**兩種題型。題目為**原創**內容（非真實考題）。

<Quiz
  qnum={1}
  total={20}
  question="某開發者把一個 Lambda 函式的保留並發（reserved concurrency）設為 0，用來緊急停止它處理事件。設定完成後，新的叫用會發生什麼事？"
  options={[
    '函式仍可正常執行，只是變慢',
    '函式會被節流（throttled），同步叫用收到 429、非同步來源會重試',
    '函式會自動刪除',
    '函式改為以佈建並發（provisioned concurrency）執行',
  ]}
  answer={1}>

**正解：B**

保留並發設為 0 等於把該函式的可用並發上限降到 0，所有叫用都會被**節流**：同步叫用（如 API Gateway）回 `429 TooManyRequestsException`，非同步來源（如 S3、SNS）會依重試策略重試。這是常見的「踩煞車」手法。A 錯，0 並發不是變慢而是完全擋下；C、D 與保留並發無關。

</Quiz>

<Quiz
  qnum={2}
  total={20}
  question="某團隊想讓 API Gateway 的正式環境指向 Lambda 的穩定版本，同時方便日後快速切換或做金絲雀發布，且「不想每次發版都改 API Gateway 設定」。最合適的做法是？"
  options={[
    '每次發版都把 API Gateway 整合指到新的 $LATEST',
    '讓 API Gateway 整合指向一個 Lambda 別名（alias），發版時只移動別名',
    '把版本號硬寫進 API Gateway 的整合 ARN',
    '每次發版重建整個 API Gateway',
  ]}
  answer={1}>

**正解：B**

**別名（alias）**是一個指向特定函式版本的可移動指標。讓 API Gateway 整合指向別名後，發版只需把別名移到新版本（或設定加權在兩版本間分流做金絲雀），API Gateway 完全不用改。A 用 `$LATEST` 無法保證穩定且不能加權分流；C 硬寫版本號每次都要改整合；D 過度操作。

</Quiz>

<Quiz
  qnum={3}
  total={20}
  question="某 Lambda 函式每次冷啟動都要花數秒建立資料庫連線池與載入設定，導致第一次請求延遲偏高。開發者希望用「最少的程式碼改動」降低冷啟動對延遲的影響。下列哪個做法最合適？"
  options={[
    '把連線池與設定載入的程式碼放在處理常式（handler）函式內部，每次叫用都重建',
    '把連線池與設定載入放在處理常式外層（初始化階段），並對別名啟用佈建並發',
    '把記憶體調到最低以加速啟動',
    '改用同步叫用避免冷啟動',
  ]}
  answer={1}>

**正解：B**

放在**處理常式外層的初始化程式碼**只在執行環境建立時跑一次，之後的熱叫用可重用連線；再對別名啟用**佈建並發（provisioned concurrency）**，可事先初始化好一批執行環境，幾乎消除冷啟動延遲。A 把初始化放進 handler 反而每次都重建；C 降記憶體通常更慢（CPU 隨記憶體等比成長）；D 叫用方式與冷啟動無關。

</Quiz>

<Quiz
  qnum={4}
  total={20}
  question="某 Lambda 函式需要一個資料庫連線字串與一個功能開關。連線字串裡含有密碼，團隊要求「機密不可明文出現、且能集中輪替」，但一般設定值希望讀取延遲低。開發者應如何設計？（Choose TWO）"
  options={[
    '把資料庫密碼存進 Secrets Manager，由函式在初始化時取用',
    '把資料庫密碼以明文寫在 Lambda 環境變數',
    '把功能開關這類非機密設定放在環境變數或 Parameter Store 參數',
    '把所有值都寫死在程式碼裡並重新部署才能改',
    '把密碼放在函式的資源政策（resource policy）',
  ]}
  answer={[0, 2]}>

**正解：A、C**

機密（密碼）應放進 **Secrets Manager**（支援集中輪替、不明文外露），由函式初始化時以 SDK 取用。非機密設定（功能開關）放**環境變數或 Parameter Store** 即可，讀取簡單延遲低。B 明文密碼違反要求；D 寫死無法動態調整且仍會外露；E 資源政策是權限用途，不是放機密的地方。

</Quiz>

<Quiz
  qnum={5}
  total={20}
  question="某非同步叫用的 Lambda 偶爾因暫時性錯誤失敗。開發者希望失敗的事件在重試用盡後「不要遺失」，以便事後排查或重新處理。最符合最佳實務的做法是？"
  options={[
    '把重試次數設到非常大，期待最終成功',
    '為函式設定非同步叫用的失敗目的地（on-failure destination）或死信佇列（DLQ）指向 SQS/SNS',
    '在程式碼裡 catch 所有例外然後忽略',
    '關閉重試，失敗就算了',
  ]}
  answer={1}>

**正解：B**

對非同步叫用，Lambda 支援設定**失敗目的地（destination）或死信佇列（DLQ）**，重試用盡後把事件連同中繼資料送到 SQS 佇列或 SNS 主題，確保不遺失、可事後重新處理。A 無限放大重試治標不治本；C 吞掉例外會讓事件靜默消失；D 直接丟失事件違反要求。

</Quiz>

<Quiz
  qnum={6}
  total={20}
  question="某 REST API 的某個端點需要用公司既有的 JWT 權杖做授權，且希望授權結果能被快取以減少重複驗證的開銷。在 API Gateway 上最合適的做法是？"
  options={[
    '在每個後端 Lambda 裡自己解析並驗證 JWT',
    '使用 Lambda authorizer（授權方），回傳 IAM 政策並設定授權快取 TTL',
    '把 JWT 直接當成 API key 使用',
    '開放端點不做授權，靠前端隱藏',
  ]}
  answer={1}>

**正解：B**

**Lambda authorizer** 可在請求進入後端前集中驗證 JWT 並回傳允許/拒絕的 IAM 政策，且支援以權杖為鍵的**授權快取（TTL）**，相同權杖在 TTL 內不必重複驗證。A 在每個後端各自驗證造成重複邏輯；C API key 是用量識別不是身分驗證；D 前端隱藏不是安全控制。

</Quiz>

<Quiz
  qnum={7}
  total={20}
  question="某瀏覽器前端（網域 app.example.com）呼叫 API Gateway 的 REST API 時，瀏覽器對非簡單請求先送出 OPTIONS 預檢，但失敗了。開發者應如何正確啟用跨來源存取？"
  options={[
    '在前端關閉瀏覽器的同源政策',
    '在 API Gateway 設定 CORS，讓 OPTIONS 方法回傳正確的 Access-Control-Allow-* 標頭',
    '把 API 改成只接受 GET',
    '在後端資料庫開放所有 IP',
  ]}
  answer={1}>

**正解：B**

跨來源問題要在 **API Gateway 啟用 CORS**：為資源加上 OPTIONS 方法並在回應中帶 `Access-Control-Allow-Origin`、`Access-Control-Allow-Methods`、`Access-Control-Allow-Headers` 等標頭，瀏覽器預檢才會通過。A 無法要求使用者改瀏覽器；C 不解決預檢問題；D 與 CORS 無關且危險。

</Quiz>

<Quiz
  qnum={8}
  total={20}
  question="某 DynamoDB 資料表的主鍵是 UserId（分割鍵）。應用程式常需要「查某使用者在某時間範圍內的訂單」，而目前查詢只能靠掃描整表過濾。開發者希望用「可用不同分割鍵／排序鍵高效查詢」的方式。最合適的做法是？"
  options={[
    '建立區域二級索引（LSI），使用與表相同的分割鍵但不同排序鍵',
    '建立全域二級索引（GSI），使用新的分割鍵與排序鍵',
    '每次都用 Scan 加 FilterExpression',
    '把整表讀進應用程式記憶體再過濾',
  ]}
  answer={1}>

**正解：B**

要用**不同的分割鍵**查詢需建立**全域二級索引（GSI）**，GSI 可自訂與主表不同的分割鍵與排序鍵。LSI（A）必須沿用與主表**相同的分割鍵**、只能換排序鍵，不符「不同分割鍵」需求，且 LSI 只能在建表時建立。C 的 Scan 成本高、效率差；D 把資料全撈回來更糟。

</Quiz>

<Quiz
  qnum={9}
  total={20}
  question="某開發者對 DynamoDB 用 Query 讀取剛剛寫入的項目，偶爾讀不到最新值。他需要「保證讀到最新寫入結果」，可以接受較高的讀取成本。應該怎麼做？"
  options={[
    '使用最終一致性讀取（預設）',
    '在 Query/GetItem 設定 ConsistentRead=true 使用強一致性讀取',
    '改用 Scan 就會自動變強一致',
    '在用戶端睡眠幾秒再讀',
  ]}
  answer={1}>

**正解：B**

DynamoDB 預設是**最終一致性讀取**（較便宜但可能讀到舊值）。要保證讀到最新寫入，需在 Query/GetItem 設定 **`ConsistentRead=true`** 使用**強一致性讀取**（消耗較多讀取容量，且不支援 GSI）。A 正是造成讀不到的原因；C Scan 的一致性由 ConsistentRead 決定、不會自動強一致；D 睡眠是不可靠的 hack。

</Quiz>

<Quiz
  qnum={10}
  total={20}
  question="某新上線的應用程式流量難以預測，時常出現尖峰與離峰。團隊不想花時間規劃與調整 DynamoDB 的讀寫容量，希望「依實際用量自動擴縮並按用量付費」。最合適的容量模式是？"
  options={[
    '佈建容量（provisioned）且不開自動擴縮',
    '按需容量（on-demand）模式',
    '佈建容量並手動設一個很大的固定值',
    '把資料表改放到 S3',
  ]}
  answer={1}>

**正解：B**

流量不可預測、又不想管容量，選**按需容量（on-demand）**最合適：自動依瞬時流量擴縮、按實際讀寫請求數計費，無須規劃 RCU/WCU。A 不開擴縮易被節流；C 固定大值造成浪費且仍可能被尖峰超過；D 改用 S3 失去 DynamoDB 的鍵值查詢能力。

</Quiz>

<Quiz
  qnum={11}
  total={20}
  question="某應用程式對 DynamoDB 批次寫入時，偶爾收到 ProvisionedThroughputExceededException 或 throttling 錯誤。開發者應如何在用戶端正確處理這類暫時性限流？"
  options={[
    '立即以相同速率無間隔重試',
    '實作指數退避（exponential backoff）加抖動（jitter）後重試；多數 AWS SDK 已內建',
    '收到錯誤就讓程式整個結束',
    '把所有寫入改成一次超大批次送出',
  ]}
  answer={1}>

**正解：B**

對限流這類暫時性錯誤，正確做法是**指數退避加抖動後重試**，讓重試逐漸拉開間隔並錯開併發，避免雪崩；多數 AWS SDK 已內建此重試邏輯，也可自行調整。A 無間隔重試會加重限流；C 直接結束失去可恢復機會；D 更大批次只會更快觸發限流。

</Quiz>

<Quiz
  qnum={12}
  total={20}
  question="某網站要讓已登入使用者「直接把大檔案上傳到特定 S3 貯體」，但不希望把 AWS 憑證下發到瀏覽器，也不想讓檔案流經自家伺服器。最合適的做法是？"
  options={[
    '把 IAM 使用者的 Access Key 嵌進前端 JavaScript',
    '後端用 SDK 產生有時效的 S3 presigned URL（預簽章網址）給前端直接 PUT 上傳',
    '把貯體設為公開可寫',
    '讓檔案先上傳到 EC2 再轉存 S3',
  ]}
  answer={1}>

**正解：B**

後端（持有憑證）用 SDK 產生**有時效的 presigned URL**，前端拿著這個網址直接向 S3 做 PUT 上傳，既不外露長期憑證、也不必讓檔案經過自家伺服器。A 把金鑰放前端極度危險；C 公開可寫是重大風險；D 經 EC2 轉存增加成本與延遲。

</Quiz>

<Quiz
  qnum={13}
  total={20}
  question="某行動 App 要上傳數 GB 的大檔到 S3，網路偶爾中斷，重傳整個檔案很浪費。開發者希望「能分段、單段失敗可只重傳該段、並能平行上傳」。應使用哪個 S3 功能？"
  options={[
    '單次 PutObject 一口氣上傳',
    'Multipart Upload（分段上傳）',
    'S3 Select',
    'S3 版本控制（versioning）',
  ]}
  answer={1}>

**正解：B**

**Multipart Upload（分段上傳）**把大物件切成多個 part 可**平行上傳**，單一 part 失敗只需重傳該 part，適合大檔與不穩定網路（一般建議超過 100 MB 使用）。A 單次上傳失敗要整檔重來；C S3 Select 是查詢物件內容；D 版本控制是保留歷史版本，與分段上傳無關。

</Quiz>

<Quiz
  qnum={14}
  total={20}
  question="開發者在本機以 AWS SDK 開發，程式沒有在程式碼裡硬寫任何金鑰，卻能存取 AWS。關於 SDK 的預設憑證提供者鏈（credential provider chain），下列敘述何者正確？"
  options={[
    'SDK 只會從程式碼裡的字串讀取金鑰，否則無法運作',
    'SDK 會依序嘗試多個來源，例如環境變數、共用設定檔（~/.aws/credentials）、以及執行環境的角色（如 EC2/ECS/Lambda），找到就用',
    'SDK 一定要連到 IAM 主控台才能取得金鑰',
    'SDK 只能使用 Root 使用者憑證',
  ]}
  answer={1}>

**正解：B**

AWS SDK 的**預設憑證提供者鏈**會依序檢查多個來源：環境變數、共用憑證/設定檔（`~/.aws/credentials`）、容器或執行個體的角色憑證（EC2/ECS/Lambda 的 IAM Role）等，找到第一個可用的就使用。這讓同一份程式在本機與雲端都能免硬寫金鑰。A、C、D 都錯誤描述了這條鏈。

</Quiz>

<Quiz
  qnum={15}
  total={20}
  question="某 SQS 標準佇列的訊息由 Lambda 消費者處理。開發者發現同一則訊息偶爾被處理兩次，造成重複副作用。關於可見性逾時（visibility timeout）與重複，下列哪兩項設計最正確？（Choose TWO）"
  options={[
    '把可見性逾時設得比處理時間短，讓訊息快點重新出現',
    '讓可見性逾時長於實際處理時間，避免訊息在處理完成前重新可見',
    '把消費端設計成冪等（idempotent），讓重複處理不產生副作用',
    '標準佇列保證剛好一次傳遞，不必處理重複',
    '處理完才不要刪除訊息，讓它自然消失',
  ]}
  answer={[1, 2]}>

**正解：B、C**

標準佇列是**至少一次（at-least-once）**傳遞，可能出現重複。因此一方面**可見性逾時要長於實際處理時間**（否則訊息在還沒處理完就重新可見，被另一消費者重複取走），另一方面消費端要設計成**冪等**，讓偶發的重複不造成副作用。A 把逾時設太短正是造成重複的原因；D 標準佇列不保證恰好一次；E 處理完必須主動刪除訊息。

</Quiz>

<Quiz
  qnum={16}
  total={20}
  question="某付款系統要求「訊息嚴格依序處理、且同一筆交易不重複」。團隊要在 SQS 上達成此需求，應如何設定？"
  options={[
    '使用標準佇列並盡量寫得快一點',
    '使用 FIFO 佇列，設定 MessageGroupId 維持群組內順序、並用內容去重或 MessageDeduplicationId 去重',
    '使用 FIFO 佇列但不設任何群組或去重 ID',
    '改用 SNS 標準主題廣播',
  ]}
  answer={1}>

**正解：B**

嚴格順序與不重複要用 **FIFO 佇列**：以 **MessageGroupId** 保證同一群組內**先進先出**的順序，並以**內容去重或 MessageDeduplicationId** 在去重視窗內避免重複。A 標準佇列不保證順序與唯一；C FIFO 若不設群組與去重 ID 無法達成需求；D SNS 標準主題不保證順序。

</Quiz>

<Quiz
  qnum={17}
  total={20}
  question="某事件要同時觸發多個下游動作：寫入稽核佇列、通知使用者、以及啟動一個處理流程。開發者希望「一次發布、多方各自接收」，且各下游互不影響。最合適的架構是？"
  options={[
    '讓來源程式依序直接呼叫每個下游服務',
    '用 SNS 主題做扇出（fan-out），讓多個 SQS 佇列/端點各自訂閱',
    '把所有下游邏輯塞進同一個 Lambda',
    '用 DynamoDB 當訊息匯流排讓大家輪詢',
  ]}
  answer={1}>

**正解：B**

一次發布、多方接收是典型的 **SNS 扇出（fan-out）**：發布到一個 SNS 主題，多個 SQS 佇列或端點各自訂閱並獨立處理，彼此解耦、互不影響。A 來源直接串接造成緊耦合；C 單一 Lambda 失去隔離與獨立擴縮；D 用 DynamoDB 輪詢不是事件通知的好模式。

</Quiz>

<Quiz
  qnum={18}
  total={20}
  question="某資料處理流程有多個步驟、含分支與重試，還要能可視化追蹤每一步的狀態與錯誤。開發者希望用「服務本身管理狀態與流程控制」而不是自己在 Lambda 裡寫一堆協調邏輯。最合適的服務是？"
  options={[
    '把整個流程寫在單一超大 Lambda 用 if/else 控制',
    'AWS Step Functions 狀態機，用狀態、重試與 Catch 定義流程',
    '用 cron 排程逐步手動觸發',
    '把每步結果存在環境變數裡傳遞',
  ]}
  answer={1}>

**正解：B**

**Step Functions** 是託管的工作流程協調服務，用狀態機定義步驟、分支（Choice）、重試（Retry）與錯誤處理（Catch），並提供可視化執行追蹤，省去自己在程式裡寫協調與狀態管理。A 單一巨大 Lambda 難維護、受逾時限制；C cron 手動不適合複雜分支；D 環境變數無法在叫用間傳遞狀態。

</Quiz>

<Quiz
  qnum={19}
  total={20}
  question="某開發者要讓一個 API 後端的 Lambda 在不同部署階段（dev/staging/prod）讀到不同的設定值，且希望「同一份部署套件、靠設定切換行為」。下列哪兩個做法符合此目標？（Choose TWO）"
  options={[
    '為每個階段的別名設定不同的環境變數',
    '把不同階段的設定硬寫在程式碼裡並各編譯一份',
    '用 Parameter Store 以路徑區分階段（如 /app/prod/、/app/dev/）在執行時讀取',
    '把 prod 密碼直接貼在原始碼註解裡',
    '每個階段都用完全不同的程式邏輯',
  ]}
  answer={[0, 2]}>

**正解：A、C**

要「同一份套件、靠設定切換」，可對**不同別名設定不同的環境變數**（版本發佈時別名各帶各的設定），也可用 **Parameter Store 以路徑分階段**在執行時讀取對應設定。B、E 各階段各一份程式碼違反「同一份套件」；D 把密碼貼在原始碼是嚴重安全問題。

</Quiz>

<Quiz
  qnum={20}
  total={20}
  question="某 API Gateway 後方的服務容量有限，團隊想「保護後端不被突發流量打垮」，並對不同用戶端套用不同的請求上限。最合適的做法是？"
  options={[
    '完全不設限，讓後端自己扛',
    '使用 API Gateway 的節流（throttling）設定速率與突發上限，並以使用方案（usage plan）＋API key 對不同用戶端分級限流',
    '把後端多複製幾份就不用限流',
    '要求用戶端自律不要送太多請求',
  ]}
  answer={1}>

**正解：B**

API Gateway 支援**節流（throttling）**設定每秒速率（rate）與突發（burst）上限，超出即回 `429`；再搭配**使用方案（usage plan）＋API key** 對不同用戶端套用不同配額與速率，達成分級限流保護後端。A 不設限等於不保護；C 擴充後端成本高且仍可能被打垮；D 靠用戶端自律不可靠。

</Quiz>

完成 Domain 1！接著進入 Domain 2。
