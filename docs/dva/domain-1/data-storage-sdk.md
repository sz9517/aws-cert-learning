---
sidebar_position: 4
title: 用 SDK 存取 S3 與資料
---

# 用 AWS SDK 存取 S3 與資料：開發者的第一手工具

> SAA 問 S3「適不適合、怎麼選儲存類別」；DVA 問「**你怎麼用程式把物件放進去、取出來、處理大檔、給臨時連結**」。這篇站在開發者視角，帶你用 AWS SDK 操作 S3，並認識應用層快取 ElastiCache。

<Vocab title="📌 先認識這篇會出現的名詞（完全沒碰過也能懂）">

- **SDK（Software Development Kit，軟體開發套件）**：AWS 幫各種程式語言（Python、JavaScript、Java…）包好的函式庫，讓你用程式呼叫 AWS 服務，不用自己手刻一堆 HTTP 請求與簽章。
- **憑證（Credentials）**：證明「你是誰、有沒有權限」的鑰匙，通常是一組 Access Key。SDK 靠它去呼叫 AWS。
- **物件（Object）**：S3 裡儲存的一份資料（一張圖、一支影片、一份檔案），加上它的中繼資料（metadata）。
- **用戶端（Client）**：你在程式裡建立的「連到某個 AWS 服務的操作把手」，之後所有呼叫都透過它發出。

</Vocab>

:::note[💬 閱讀小提示]
文章裡只要看到帶<Term desc="像這樣！滑鼠移到有虛線的名詞上（手機點一下），就會跳出白話解釋。">虛線底線的名詞</Term>，把滑鼠移上去就會跳出白話解釋。所有名詞也都整理在 [名詞與服務對照表](/glossary)。
:::

## AWS SDK 基礎：憑證、區域、用戶端

用 SDK 之前要先搞懂三件事：**它怎麼知道我是誰（憑證）、要連哪個區域、以及怎麼初始化用戶端**。

### 憑證提供鏈（Credential Provider Chain）

你**不應該**把 Access Key 寫死在程式碼裡（會外洩、難輪替）。AWS SDK 會依照一條固定的**憑證提供鏈**，由上往下找憑證，找到就用：

<div className="flow">
  <div className="flow-node">程式碼明確傳入</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">環境變數</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">共用設定檔 ~/.aws/credentials</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">IAM 角色（EC2/ECS/Lambda）</div>
</div>

*圖：SDK 由左往右找憑證，找到第一個就停。在 AWS 上跑的程式最佳做法是最右邊——掛 IAM 角色，完全不碰金鑰。*

:::tip[💡 考試重點]
**在 EC2、ECS、Lambda 上跑的程式，正解幾乎都是「附掛 IAM 角色」**，由 SDK 自動從執行環境取得臨時憑證並自動輪替。看到「把 Access Key 硬寫在程式／設定檔裡」的選項，通常是錯的。
:::

#### 為什麼不能把金鑰寫死？意義在哪

把一組**長期 Access Key** 貼進程式碼，表面上最省事，但它的壞處是「**永久有效又到處散播**」：

- **優點（寫死）**：真的只有「不用設定、貼上就能跑」這一個，而且只在你本機。
- **缺點（寫死）**：這把鑰匙**不會過期**，一旦跟著程式碼進了 Git、Docker image、或被同事複製，就等於把家裡大門鑰匙影印發出去，而且**沒辦法知道誰拿了**。外洩後要「輪替（換鑰匙）」還得手動找出每個用到的地方改掉，常常漏改。

**憑證提供鏈的意義**就是：讓你的程式「**不用知道金鑰長怎樣**」也能拿到憑證——在本機它去讀 `~/.aws/credentials`（金鑰留在你電腦、不進程式碼），在 AWS 上它去跟執行環境要一份**短期、會自動過期、會自動換新**的臨時憑證（來自 IAM 角色）。程式碼完全一樣，換環境就自動換憑證來源。

<Analogy title="🔑 生活比喻：萬年鑰匙 vs 每天換的門禁卡">

把長期金鑰寫死，像打一把**永不換鎖的萬能鑰匙**到處發；掉了你根本不知道，也換不勝換。IAM 角色給的臨時憑證像公司的**門禁卡**：每天（甚至每小時）自動換一張、過期自動失效，掉了影響有限，還查得到是哪張卡進的門。

</Analogy>

:::tip[💡 最佳實務（憑證）]
- **在 AWS 上跑**（EC2/ECS/Lambda）→ 一律掛 **IAM 角色**，程式裡完全不出現金鑰。
- **本機開發** → 用 `aws configure` 把金鑰存進 `~/.aws/credentials`（別貼進程式碼），或用 `aws sso login` 拿短期憑證。
- **真的需要給外部系統長期金鑰** → 權限給到最小、定期輪替，並用 **Secrets Manager**／**Parameter Store** 存放，不要進原始碼。
- 看到考題給「IAM 使用者的長期 Access Key 硬編碼」vs「附掛 IAM 角色」，**永遠選角色**。
:::

### 區域設定與用戶端初始化

每個用戶端都要知道連哪個**區域（Region）**。區域可以來自環境變數 `AWS_REGION`、設定檔，或建立用戶端時明確指定。初始化一次用戶端後重複使用即可（不要每次呼叫都新建，浪費連線）。

```python
import boto3

# 建立 S3 用戶端：憑證走提供鏈自動取得，區域明確指定
s3 = boto3.client("s3", region_name="ap-northeast-1")

# 放一個物件上去（put）
s3.put_object(Bucket="my-app-bucket", Key="reports/2026.csv", Body=b"hello")

# 把它取回來（get）
obj = s3.get_object(Bucket="my-app-bucket", Key="reports/2026.csv")
data = obj["Body"].read()
```

## S3 開發者重點

S3 本身觀念你可能已經會了，DVA 考的是**用程式操作它的細節**。

### 物件操作與分頁列舉（Paginator）

基本就是 `put_object`／`get_object`／`delete_object`。但列舉物件時有個陷阱：**`list_objects_v2` 單次最多只回傳 1000 個物件**，超過要靠分頁（pagination）一頁一頁拿。SDK 提供 **paginator（分頁器）** 幫你自動翻頁，不用自己處理 `ContinuationToken`。

```python
# 用 paginator 自動翻頁，列舉 bucket 裡所有物件（不受 1000 筆限制）
paginator = s3.get_paginator("list_objects_v2")
for page in paginator.paginate(Bucket="my-app-bucket", Prefix="reports/"):
    for obj in page.get("Contents", []):
        print(obj["Key"], obj["Size"])
```

**預期結果**：就算貯體裡有 5,000 個物件，上面的程式也會**全部印出來**（paginator 在背後翻了 5 頁）。若你誤用 `s3.list_objects_v2(...)["Contents"]` 直接取，**只會拿到前 1,000 筆**、後面的靜悄悄不見——這正是下面「常踩雷」要提醒的經典坑。

### 分段上傳（Multipart Upload）

上傳**大檔**（例如影片、備份）時，不要一口氣送。**分段上傳**把檔案切成多個區塊（part），分別上傳、可**平行**送、單一區塊失敗只要重傳那一塊，最後再合併成一個物件。

#### 為什麼大檔要分段？為什麼不是每個檔都分段

「一口氣送一個大檔」在網路上其實很脆弱：傳到 **99%** 時連線一斷，整個就得**從頭重來**；而且單一連線的速度有上限，大檔會卡在那條水管慢慢爬。分段上傳解決的就是這兩件事——**切塊後可以同時開多條水管平行送（變快）**，而且**斷了只補那一塊（不用重來）**。

但它**不是免費的**，所以不該每個檔都用：

- **優點**：平行加速、單塊失敗只重傳該塊、可暫停續傳、能邊產生邊上傳（串流）。
- **缺點／注意**：流程較複雜（要 initiate → 多次 upload part → complete 三步）；**沒 complete 也沒 abort 的殘段會一直留在貯體裡偷偷算儲存費**；小檔反而因為多了協調開銷而**不划算**。
- **何時才需要**：檔案大（AWS 建議 **>100 MB** 就用）、網路不穩、或要平行加速時。**小檔直接 `put_object` 就好**，別自找麻煩。

:::tip[💡 偷懶但正確的做法：用 upload_file]
不想自己管三步驟？boto3 的 `s3.upload_file(...)` 會**自動判斷**：檔案夠大就自動切成分段並平行上傳，小檔就直接 PUT。多數情況這一行就夠了，不用手刻 multipart。

```python
# 自動在需要時啟用分段上傳（門檻、平行度可用 TransferConfig 調）
s3.upload_file("big-video.mp4", "my-app-bucket", "videos/big-video.mp4")
# 預期結果：大檔會被切塊平行上傳；中途某塊失敗 SDK 會自動重傳那塊。
```
:::

<Analogy title="📦 生活比喻：搬鋼琴 vs 拆箱分批搬">

一次扛整台鋼琴上樓（**單次上傳大檔**），中途手滑就全砸了、得重來。分段上傳像把它拆成琴鍵、琴身、琴腳**分箱搬**，多人同時搬更快，某一箱摔了只補那一箱，全部到齊再組裝起來。

</Analogy>

:::tip[💡 考試重點]
- 檔案**大於 100 MB** 時 AWS 建議改用分段上傳；**大於 5 GB** 的物件**必須**用分段上傳（單次 PUT 上限是 5 GB）。
- 好處：**平行上傳加速、可暫停續傳、單塊失敗只重傳該塊**。
- 記得設 **生命週期規則** 自動清掉「上傳到一半、沒完成」的殘留區塊，否則會一直算儲存費。
:::

### 預簽章 URL（Presigned URL）

想讓**沒有 AWS 憑證的人**（例如你 App 的一般使用者）臨時上傳或下載某個物件，又不想把 bucket 開成公開——用**預簽章 URL**。你的後端用自己的憑證產生一條**有時效**的網址，對方拿著它就能在期限內直接對 S3 做指定操作，時間一到自動失效。

#### 為什麼用它？相對「檔案都經過你的伺服器轉手」

最直覺的做法是：使用者要下載檔案，就先讓你的伺服器去 S3 抓下來、再轉傳給使用者；上傳也一樣先收到伺服器再轉存。這叫「**經過伺服器轉手（proxy）**」。它能動，但有三個痛點：**所有檔案流量都壓在你的伺服器上（頻寬爆、擴充貴）**、使用者要**等兩段傳輸**（S3→你→使用者）比較慢、你的伺服器還得**暫存大檔**。

預簽章 URL 的意義是：**讓使用者的瀏覽器直接跟 S3 對傳，你的伺服器只負責「發一張限時門票」**，完全不碰檔案內容。

- **優點**：省你的頻寬與 CPU、天生好擴展（流量交給 S3）、不用把貯體開公開也能給臨時存取、權限可精準到「單一 key + 單一操作 + 幾分鐘」。
- **缺點／注意**：URL 一旦產生，**在到期前擋不掉**（無法主動撤銷，只能等它過期或改權限/輪替金鑰）；用誰的身分簽，權限就是誰的（別用權限過大的身分簽）；簽出來的網址本身就是**憑證**，外流就等於授權。
- **何時反而別用**：需要**精細存取控制、要能隨時撤銷、要記錄誰下載了什麼**（稽核）→ 改用 **CloudFront 簽章 URL/Cookie** 或在應用層控管；內部系統之間傳檔，彼此都有 IAM 憑證時，直接用 SDK 呼叫即可，**不需要**預簽章 URL。

```python
# 產生一條「1 小時內有效」的下載連結，交給前端使用者直接下載
url = s3.generate_presigned_url(
    ClientMethod="get_object",
    Params={"Bucket": "my-app-bucket", "Key": "reports/2026.csv"},
    ExpiresIn=3600,  # 秒；這裡是 1 小時
)
print(url)
```

**預期結果**：印出一條像 `https://my-app-bucket.s3.ap-northeast-1.amazonaws.com/reports/2026.csv?X-Amz-Algorithm=...&X-Amz-Expires=3600&X-Amz-Signature=...` 的網址。**任何人**在 1 小時內用瀏覽器開它都能下載該物件，1 小時後再開就回 `AccessDenied`。注意：若簽這條 URL 用的憑證**本身沒有** `s3:GetObject` 權限，URL 看起來正常但一用就被拒——**預簽章 URL 的權限不會超過簽署者的權限**。

<Scenario title="真實情境：讓使用者直接上傳大頭貼，不經過你的伺服器">

你的 App 要讓使用者上傳大頭貼。如果照片都先傳到你的後端、再由後端轉存 S3，流量與頻寬全壓在你的伺服器上。改法：後端產生一條 `put_object` 的**預簽章 URL**（只對某個 key、限 5 分鐘），回給前端；使用者的瀏覽器**直接把照片 PUT 上 S3**，你的伺服器完全不碰檔案內容，省頻寬又好擴展。

</Scenario>

### S3 事件通知觸發 Lambda

S3 可以在**物件建立／刪除**等事件發生時，自動發出通知觸發後續處理——最常見就是**觸發 Lambda**（也可送到 SQS／SNS）。例如：使用者上傳圖片 → S3 觸發 Lambda → 自動產生縮圖。這是**事件驅動**的經典起點，下一篇會深入。

:::info[🔑 一個容易混的差異]
**S3 事件通知是「推」給你的程式**（物件一進來就自動觸發），不是你寫程式去「輪詢（polling）」問 S3「有新檔了嗎」。考題若描述「上傳後要自動做某件事」，答案方向就是 S3 事件通知 + Lambda/SQS/SNS。
:::

## SDK 的重試與指數退避（Retry & Exponential Backoff）

呼叫 AWS 偶爾會遇到**暫時性錯誤**（網路抖動、服務回 `503` 節流 throttling）。**AWS SDK 內建自動重試**，而且重試之間會**指數退避**——第 1 次失敗等一下再試、第 2 次等更久、並加上隨機抖動（jitter），避免所有用戶端同時重試把服務再度打垮。

這行為**可設定**：重試次數、重試模式（如 `standard`／`adaptive`）都能調整。

```python
from botocore.config import Config

# 自訂重試：最多 5 次、採用 adaptive 模式（會依節流情況自動調整節奏）
cfg = Config(retries={"max_attempts": 5, "mode": "adaptive"})
s3 = boto3.client("s3", config=cfg)
```

:::tip[💡 考試重點]
看到 **`ThrottlingException`／`503 SlowDown`／`ProvisionedThroughputExceeded`** 這類「被節流」的錯誤，正解是**用（通常 SDK 已內建的）指數退避加抖動重試**，而不是「無間隔瘋狂重打」或「直接放棄」。DVA 很愛考這個開發細節。
:::

## ElastiCache：把常用資料快取在應用層

S3 存的是物件；但應用程式常常要**反覆讀同一批熱門資料**（例如排行榜、商品資訊）。每次都去打資料庫會很慢、壓力大。解法是在應用層前面加一層**記憶體快取**——<Term en="Amazon ElastiCache" desc="AWS 託管的記憶體快取服務，支援 Redis 與 Memcached 兩種引擎，把讀取延遲降到微秒級。">ElastiCache</Term>。

### Redis vs Memcached（簡述）

| 比較 | **Redis** | **Memcached** |
| --- | --- | --- |
| 資料結構 | 豐富（清單、集合、排序集合、雜湊…） | 單純 key-value |
| 持久化／複製／高可用 | ✅ 支援 | ❌ 不支援 |
| 多執行緒 | 單執行緒為主 | ✅ 多執行緒 |
| 典型用途 | 排行榜、需持久化的 session、進階結構 | 單純、要水平擴展的物件快取 |

一句話：**要持久化／複製／進階結構 → Redis；只要單純、好水平擴展的快取 → Memcached**。

### 快取策略：Lazy Loading vs Write-Through

開發者要決定「**資料什麼時候進快取、什麼時候過期**」，兩種主策略最常考：

- **惰性載入（Lazy Loading）**：有人要查才去資料庫撈，撈完順手寫進快取。優點是**只快取真的被讀的資料**、省記憶體；缺點是第一次查一定沒命中（cache miss）會慢，且資料可能較舊。
- **寫穿（Write-Through）**：每次**寫**資料庫時，**同步**也更新快取。優點是快取永遠最新；缺點是連「沒人讀的資料」也占快取空間，且每次寫都多一步。

兩者都該搭配 **TTL（Time To Live，存活時間）**：給每筆快取設保存期限，到期自動清掉，強迫下次重新取得，避免讀到**過期資料（stale data）**。

#### 取捨：到底該用哪個？

兩者的核心取捨是「**記憶體 vs 資料新鮮度 vs 首次延遲**」，沒有誰絕對比較好：

| 面向 | 惰性載入（Lazy Loading） | 寫穿（Write-Through） |
| --- | --- | --- |
| 快取裡放什麼 | **只放真的被讀過的資料**（省記憶體） | 連沒人讀的也放（較耗記憶體） |
| 首次讀取 | 一定 miss、要回資料庫，**第一次較慢** | 寫入時已填好，**讀取幾乎都命中** |
| 資料新鮮度 | 可能偏舊（要靠 TTL 收斂） | 寫入即更新，**較新** |
| 寫入成本 | 寫資料庫不碰快取，**寫很輕** | 每次寫都多更新一次快取，**寫較重** |
| 最怕的狀況 | 熱點資料第一次大量 miss 打爆 DB | 大量寫入但很少被讀 → 快取塞一堆冷資料 |

**何時用哪個（白話版）**：

- **讀遠多於寫、能容忍偶爾舊一點、想省記憶體** → **惰性載入**。例如商品頁、文章內容。這是最常見的預設選擇。
- **寫完馬上就要讀到最新、且那些資料幾乎一定會被讀** → **寫穿**。例如使用者剛更新完個人資料頁、購物車。
- **實務上常常兩個一起用**：平常走惰性載入省記憶體，對「寫完立刻要讀對」的關鍵資料額外做寫穿，再全部配上 **TTL** 當保險絲——就算策略有漏，資料也會在 TTL 到期後自動修正。

```python
# 惰性載入的經典寫法（Redis 當快取、miss 才回資料庫）
def get_product(redis, db, pid):
    cached = redis.get(f"product:{pid}")
    if cached is not None:
        return cached                      # 命中：直接回（快）
    row = db.query_product(pid)            # miss：回資料庫撈
    redis.set(f"product:{pid}", row, ex=300)  # 順手寫回快取，設 300 秒 TTL
    return row
# 預期結果：同一個 pid 第一次查會打到 db（慢一點），之後 5 分鐘內都從 Redis 回（快），TTL 到期後再 miss 一次。
```

<Analogy title="🍜 生活比喻：惰性載入 vs 寫穿">

- **惰性載入**＝客人點了某道菜，廚房才現做一份、順手多留一份在保溫桶。沒人點的菜永遠不占空間，但第一個點的人要等。
- **寫穿**＝每次改菜單（寫資料庫）就立刻同步更新保溫桶。客人一來一定拿得到最新的，但有些菜根本沒人點也一直備著。

</Analogy>

:::tip[💡 考試重點]
- 題目講 **快取偶爾會讀到舊資料、但希望省記憶體只放熱門資料** → **Lazy Loading**。
- 題目講 **快取資料一定要是最新、寫入後馬上要讀得到** → **Write-Through**。
- 不管哪種，**設 TTL** 是避免 stale data 的通用解。
:::

<Cost>

ElastiCache 按**節點／小時**計費，沒有免費額度，開著就一直算錢。練習完記得**刪掉叢集**；S3 的分段上傳若留下未完成的殘段，也會持續算儲存費，用**生命週期規則**自動清掉最保險。

</Cost>

:::warning[🚑 常踩雷]
- **把長期金鑰硬寫在程式碼或 commit 進 Git**：外洩重災區，而且那把鑰匙**不會過期**；在 AWS 上一律用 IAM 角色，本機用 `~/.aws/credentials` 或 SSO。
- **沒處理分頁、只拿到前 1000 筆**：`list_objects_v2` 單次最多回 **1,000** 筆，直接取 `["Contents"]` 會**靜默漏掉**後面的物件；一律用 **paginator**。這類 bug 很難發現，因為程式不會報錯、只是少資料。
- **大檔用單次 PUT 上傳**：超過 **5 GB** 會直接失敗；該用分段上傳（或直接用 `upload_file` 讓它自動切）。
- **分段上傳留下殘段**：initiate 了卻沒 complete／abort 的 part 會**一直算儲存費**，且 `list_objects` 看不到它；用**生命週期規則**自動清掉未完成的分段上傳。
- **預簽章 URL 設太長或權限過寬**：等於發了一把長效萬能鑰匙，**產生後到期前無法撤銷**；應設**短時效**、限定**單一 key 與單一操作**，並用權限最小的身分簽。
- **以為預簽章 URL 能繞過權限**：URL 的權限**不會超過簽署者**；簽署身分沒 `GetObject`，URL 一用就 `AccessDenied`。
- **忽略 SDK 重試設定、被節流時無間隔狂重試**：只會讓服務更塞；要指數退避加抖動（SDK 多半已內建，必要時用 `Config(retries=...)` 調 `max_attempts` 與 `adaptive` 模式），別自己寫 `while True` 無腦重打。
- **快取沒設 TTL**：使用者一直看到過期資料；不管用哪種快取策略，TTL 都是避免 stale data 的保險絲。
:::

<Refs>

- [AWS SDK：憑證提供鏈與設定](https://docs.aws.amazon.com/sdkref/latest/guide/standardized-credentials.html)
- [Amazon S3：分段上傳總覽](https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html)
- [Amazon S3：使用預簽章 URL](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html)
- [Amazon ElastiCache：快取策略（Lazy Loading、Write-Through、TTL）](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/Strategies.html)

</Refs>

👉 下一篇：[事件驅動與解耦](./event-driven.md)
