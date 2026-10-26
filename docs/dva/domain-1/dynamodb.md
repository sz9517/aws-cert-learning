---
sidebar_position: 3
title: DynamoDB（開發者重點）
---

# DynamoDB（開發者重點）：建模、索引、容量與正確的讀寫

> DynamoDB 是 DVA 考最多、最細的服務之一。SAA 問「什麼時候選它」，DVA 會逼你答出**分割鍵怎麼設計、該用 Query 還是 Scan、容量不足時程式要怎麼退避重試**。這篇專講開發者視角的實作細節。

<Vocab title="📌 先認識這篇會出現的名詞（完全沒碰過也能懂）">

- **NoSQL**：不是傳統「表格 + 固定欄位 + SQL 查詢」的資料庫。DynamoDB 是**鍵值 / 文件型**資料庫，每筆資料的欄位可以不一樣，靠「鍵」來存取。
- **分割鍵（Partition Key，又稱 Hash Key）**：每筆資料的「主鍵」，DynamoDB 用它算雜湊值、決定資料實際存在哪個**分割（partition）**。設計得好不好直接影響效能。
- **排序鍵（Sort Key，又稱 Range Key）**：搭配分割鍵一起當主鍵的第二部分，讓「同一個分割鍵」底下的多筆資料能**排序與範圍查詢**。
- **容量單位（RCU / WCU）**：衡量讀 / 寫吞吐量的單位。預置（provisioned）模式下你要先買多少。
- **一致性（Consistency）**：剛寫進去的資料，馬上讀得不讀得到最新值。

</Vocab>

:::note[💬 閱讀小提示]
文章裡只要看到帶<Term desc="像這樣！滑鼠移到有虛線的名詞上（手機點一下），就會跳出白話解釋。">虛線底線的名詞</Term>，把滑鼠移上去就會跳出白話解釋。所有名詞也都整理在 [名詞與服務對照表](/glossary)。
:::

## 一句話先懂 DynamoDB

<Term en="Amazon DynamoDB" desc="AWS 全託管的 NoSQL 鍵值／文件資料庫，個位數毫秒延遲，自動擴展，無伺服器可管。">DynamoDB</Term> 是 AWS **全託管、無伺服器**的 NoSQL 資料庫：你不用管機器、不用修補、不用擴機房，只要設計好「鍵」，它就能在**任何規模下維持個位數毫秒的延遲**。代價是：它不像關聯式資料庫能隨便下任意條件查詢——**你得照「存取模式」先設計好鍵與索引**。

## 為什麼選 DynamoDB（而不是 RDS / 關聯式）？

很多人「知道 DynamoDB 是 NoSQL」，卻說不清**什麼情況該選它、什麼情況選了會後悔**。先把這題講白。

關聯式資料庫（RDS/Aurora）像一張張可以互相 join 的表格，查詢彈性極高：你可以臨時下任意條件、跨表 join、跑複雜報表。但要**撐到超大規模**時，你得自己煩惱分片、讀取副本、連線池、擴容。DynamoDB 相反——它**用「限制查詢彈性」換「幾乎無上限的水平擴展與穩定低延遲」**：只要你照存取模式設計好鍵，它在流量暴衝十倍、資料長到 TB 級時，延遲照樣是個位數毫秒。

<Analogy title="🍽️ 生活比喻：點餐 vs 吃到飽自助餐">

關聯式資料庫像**單點餐廳**：菜單彈性大，你想怎麼點都行（任意查詢、join），但廚房一忙就塞車（規模一大就要人工調優）。DynamoDB 像**動線設計好的自助餐**：你能拿什麼、怎麼拿都**事先規劃好動線**（存取模式），所以**來多少人都不會塞**（自動擴展、穩定低延遲）；代價是你**不能臨時叫廚師客製一道菜單上沒有的菜**（無法隨意下任意條件查詢）。

</Analogy>

| 面向 | **DynamoDB（選它的好處）** | **缺點 / 限制** |
| --- | --- | --- |
| 擴展性 | 自動水平擴展，流量暴衝也不用改架構 | — |
| 延遲 | 任何規模都穩定個位數毫秒（可加 DAX 到微秒） | — |
| 維運 | 全託管、無伺服器，不用管機器與分片 | — |
| 計費彈性 | On-Demand 可零規劃、用多少付多少 | On-Demand 單位成本較高 |
| 查詢彈性 | — | **不能任意條件查詢**，鍵沒設到就只能 Scan |
| 複雜查詢 | — | **沒有 join、沒有多筆跨表複雜交易查詢** |
| 資料建模 | — | 要**先懂存取模式再設計**，改存取模式常要改表 |
| 項目大小 | — | 單一項目最大 **400 KB**，大檔要外放 S3 |

:::tip[💡 什麼情況「選它」最對]
- **存取模式固定、以鍵查詢為主**：用 `userId` 查某人、用 `userId + 日期` 查某人的訂單——這種「我知道鍵、直接撈」的場景 DynamoDB 最強。
- **規模會大、流量會暴衝**：購物車、session、IoT 寫入、排行榜、遊戲狀態——關聯式要人工調優的規模，它自動扛。
- **要個位數毫秒且全託管、不想養 DBA**。
:::

:::warning[🚑 什麼時候「反而別用」DynamoDB]
- **需要複雜 join、多表關聯報表**（如「把訂單、客戶、商品三張表 join 起來出營運報表」）→ 關聯式（RDS/Aurora）或分析用 Redshift/Athena 才對。
- **查詢條件很彈性、事前無法預測**（使用者可以用任意欄位組合搜尋）→ DynamoDB 得為每種查法建 GSI，很快就失控；這種丟 RDS 或搭 OpenSearch。
- **強交易一致、跨多表的複雜事務**是日常主力（如銀行核心帳務的多表交易）→ 關聯式的交易模型更自然；DynamoDB 雖有 `TransactWriteItems`，但**消耗兩倍容量**、不適合當常態。
- **資料天生高度關聯、常要 ad-hoc 分析** → 別硬塞 DynamoDB。
:::

## 資料模型：table / item / attribute

DynamoDB 的三層結構很單純：

- **資料表（Table）**：一堆資料的集合，等於關聯式資料庫的「表」。
- **項目（Item）**：資料表裡的一筆資料，等於「列」。一個項目最大 **400 KB**。
- **屬性（Attribute）**：項目裡的欄位，等於「欄」。不同項目的屬性**可以不一樣**（除了主鍵一定要有）。

主鍵有兩種設計：

| 主鍵型態 | 組成 | 特性 |
| --- | --- | --- |
| **僅分割鍵** | 分割鍵（PK） | 每個 PK 的值必須唯一，像是用 `userId` 查單一使用者 |
| **複合主鍵** | 分割鍵（PK）＋ 排序鍵（SK） | 同一個 PK 底下可有多筆、靠 SK 排序與範圍查詢 |

<Analogy title="🗄️ 生活比喻：把資料表想成一排檔案櫃">

- **分割鍵（PK）** 就像「**哪一個抽屜**」——DynamoDB 拿它算雜湊，決定資料丟進哪個抽屜（分割）。
- **排序鍵（SK）** 就像「**抽屜裡的資料夾怎麼排**」——同一個抽屜（同一個 PK）裡，資料夾照 SK 由小到大排好。
- 所以「某使用者（PK = userId）2026 年之後的所有訂單（SK = 日期）」這種查詢超快——**同一個抽屜打開、照日期往後翻就好**。
- 但「全公司所有訂單裡金額最大的」這種——金額根本不是鍵，只能**把所有抽屜全部翻一遍**（這就是 Scan，又慢又貴）。

</Analogy>

:::tip[💡 開發者第一課：照存取模式設計鍵]
關聯式資料庫是「先存資料、之後想怎麼查都行」；DynamoDB 相反——**先想清楚應用程式會怎麼查，再反推主鍵與索引**。鍵設計錯了，之後要嘛改表、要嘛被迫用 Scan 硬撈。這是 DVA 最愛考的觀念。
:::

## 二級索引：LSI vs GSI

主鍵只能用一組欄位查，但現實常需要「用別的欄位查」。這時要建**二級索引（Secondary Index）**，讓你用非主鍵的屬性查詢。有兩種：

| 比較項目 | **LSI（本地二級索引）** | **GSI（全域二級索引）** |
| --- | --- | --- |
| 全名 | Local Secondary Index | Global Secondary Index |
| 分割鍵 | **和主表同一個 PK**，只換 SK | PK、SK **都可以另外指定** |
| 何時可建 | **只能建表時建**，之後不能加 | **隨時可建、可刪** |
| 一致性 | 支援**強一致讀** | **只有最終一致**（不支援強一致） |
| 容量 | 和主表**共用** RCU/WCU | **獨立**的 RCU/WCU |
| 數量上限 | 每表最多 5 個 | 每表最多 20 個（預設） |

一句話記：**LSI 綁死在建表時、共用主表的 PK 與容量、可強一致**；**GSI 彈性大、隨時增刪、自帶容量、只能最終一致**。

:::info[🔑 為什麼有兩種、到底怎麼選]
二級索引的本質是「**多存一份照新鍵排好的資料**」，好處是能用非主鍵欄位查、避免 Scan；代價是**多一份儲存、多一份寫入成本**（主表寫一次，索引也要跟著更新）。兩者的取捨：

- **LSI 的好處**：和主表共用容量、支援**強一致讀**，PK 相同只換排序欄位時最省事。**缺點**：只能建表時建、建了不能刪、吃主表的容量，且會讓**單一 PK 下的資料量受 10 GB 限制**（item collection 上限）。
- **GSI 的好處**：隨時增刪、PK/SK 隨你挑、**容量獨立可單獨調**，彈性遠大於 LSI，是實務上最常用的。**缺點**：**只能最終一致**、要自己養一份獨立容量（容量不足會反過來拖慢主表寫入，見下方雷區）。

實務上**絕大多數情況用 GSI**；只有「查詢 PK 和主表完全一樣、只是想換排序欄位、且需要強一致」才選 LSI。
:::

:::tip[💡 考試怎麼選]
- 題目說「**查詢欄位的 PK 和主表一樣，只是想換個排序欄位**」、「**需要強一致讀**」→ **LSI**。
- 題目說「**想用完全不同的欄位當 PK 查**」、「**表已經建好、現在才要加索引**」、「**索引要獨立調容量**」→ **GSI**。
- 看到「**建表後才想加索引**」→ 一定是 **GSI**（LSI 建表後加不了）。
:::

## 容量模式：on-demand vs provisioned

DynamoDB 兩種計費 / 容量模式，DVA 很愛考怎麼挑：

- **預置模式（Provisioned）**：你**先指定**每秒要多少讀 / 寫容量，用 **RCU / WCU** 計算，可搭配 **Auto Scaling 自動擴展**依流量上下調。適合**流量穩定、可預測**，單位成本較低。
- **隨需模式（On-Demand）**：**不用預估容量**，用多少付多少，瞬間尖峰也能扛。適合**流量不穩、難預測、或全新上線不知道量**。單位成本較高但省去規劃。

:::info[🔑 為什麼有兩種、取捨在哪]
核心取捨是「**省錢**」對上「**省心與防節流**」：

- **Provisioned 的好處**：流量穩定時**單位成本明顯較低**，搭 Auto Scaling 還能跟著流量上下調。**缺點**：你**猜錯容量就會被節流**（買太少）或**白花錢**（買太多）；Auto Scaling 反應也有延遲，面對「毫秒級暴衝」可能來不及擴，瞬間尖峰照樣被擋。
- **On-Demand 的好處**：**零容量規劃、瞬間尖峰自動扛、不會因估錯被節流**，剛上線、流量難測、或尖峰極端時最安全。**缺點**：**同樣流量下單位成本較高**，長期穩定流量用它等於多付錢。

**怎麼選**：剛上線不知道量、或流量像雲霄飛車 → 先用 On-Demand 把風險壓掉，跑一陣子摸清流量後若穩定，再換 Provisioned + Auto Scaling 省成本。兩種模式可以互換（每 24 小時可切一次）。
:::

### RCU / WCU 怎麼算（會考）

- **WCU（寫入容量單位）**：1 WCU＝每秒寫入 **1 筆 1 KB** 的資料。寫 2 KB 的項目＝2 WCU。
- **RCU（讀取容量單位）**：1 RCU＝每秒 **強一致讀 1 筆 4 KB**；若用**最終一致讀**，1 RCU 可讀 **2 筆 4 KB**（便宜一半）。

<Scenario title="換算練習：每秒讀 80 筆、每筆 6 KB，強一致，要幾 RCU？">

每筆 6 KB 要**無條件進位**到 4 KB 的倍數 → 8 KB ＝ 2 個 4 KB 區塊 ＝ 2 RCU / 筆（強一致）。每秒 80 筆 → 80 × 2 ＝ **160 RCU**。若改成最終一致讀，RCU 減半 → **80 RCU**。這類「KB 進位 + 強一致是最終一致兩倍」的計算，DVA 很常考。

</Scenario>

:::tip[💡 一秒判斷模式]
- 「**流量不可預測 / 尖峰暴衝 / 剛上線不知道量 / 省去容量規劃**」→ **On-Demand**。
- 「**流量穩定可預測 / 想壓低單位成本**」→ **Provisioned ＋ Auto Scaling**。
:::

## 讀取一致性：最終一致 vs 強一致

DynamoDB 把你的資料複製到多個設施。剛寫完馬上讀，有兩種選擇：

- **最終一致讀（Eventually Consistent，預設）**：讀取可能讀到**稍舊**的副本（通常 1 秒內同步完成）。**便宜一半、延遲最低**。
- **強一致讀（Strongly Consistent）**：保證讀到**最新寫入**的值。成本是最終一致的兩倍（1 RCU 只能讀 4 KB），延遲略高，且**不能跨區**、**GSI 不支援**。

:::info[🔑 一個容易混的差異]
預設是**最終一致**。要強一致必須在呼叫時明確指定 `ConsistentRead=true`。題目若說「**剛寫入就要馬上讀到正確值**」（如寫入後立刻驗證餘額）→ 要**強一致讀**；若說「**可以容忍短暫舊資料、要省成本**」→ **最終一致**即可。記得 **GSI 永遠只有最終一致**。
:::

:::warning[🚑 強一致不是免費的——先想清楚代價]
看到「強一致」就無腦開 `ConsistentRead=true`，是常見的過度設計。它的代價有三：**① 貴一倍**（1 RCU 只讀 4 KB，最終一致同樣 1 RCU 讀 8 KB）；**② 延遲略高**（要去讀主副本）；**③ 限制多**（不能走 GSI、也享受不到 DAX 快取加速）。很多讀取其實**容忍 1 秒內的舊資料**（商品列表、貼文、排行榜），用最終一致即可省一半成本與延遲。**只有「寫完必須立刻讀到最新值」（餘額、庫存核對）才值得付強一致的代價。**
:::

## Query vs Scan：盡量用 Query

這是 DVA 最常考的效能題。

- **Query（查詢）**：**一定要指定分割鍵**，只掃描符合該 PK 的資料（可再用 SK 做範圍 / 排序）。只讀你要的那個分割，**又快又省 RCU**。
- **Scan（掃描）**：**讀遍整張表的每一筆**再做過濾。表越大越慢越貴——即使你加了 `FilterExpression`，過濾是在**讀完之後**才做的，**RCU 照整張表算**，省不到錢。

<Analogy title="📚 比喻：Query 是翻目錄，Scan 是整本從頭讀到尾">

想在一本厚書裡找「第 5 章的內容」。**Query** 像先翻目錄直接跳到第 5 章（指定 PK）；**Scan** 像從第 1 頁一個字一個字讀到最後，邊讀邊判斷「這段是不是第 5 章」。書越厚，Scan 越是災難。

</Analogy>

:::info[🔑 為什麼幾乎永遠別用 Scan 當日常查詢]
Scan 的致命問題是它的成本和耗時**跟著整張表一起長**：今天表小你沒感覺，資料長到百萬筆後，同一支 Scan 會把 RCU 吃光、讓整張表節流、順便拖慢其他正常請求。更坑的是 `FilterExpression` **騙人的省**——它是**讀完整張表之後才過濾**，你以為「只回 10 筆所以便宜」，其實 RCU 照**掃過的全表**計算。**正解永遠是：讓需要的查詢能用 Query**——主鍵設計涵蓋它，或**建一個 GSI** 把那個查詢欄位變成可 Query 的鍵。只有「真的要讀全表」（如一次性匯出、批次重算）才用 Scan，並搭 Parallel Scan 分段。
:::

:::tip[💡 考試重點]
- 題目出現「**查詢很慢 / RCU 爆掉 / 成本過高**」而程式用了 **Scan** → 答案通常是「**改用 Query**」或「**建一個 GSI 讓它能用 Query**」。
- `FilterExpression` **不會**省 RCU（過濾發生在讀取之後）；真正省的是用對的 **KeyConditionExpression（Query）**。
- 真的非得 Scan 時，用 **Parallel Scan（平行掃描）** 分段加速。
:::

## 條件寫入、原子計數器、樂觀鎖

這三個是 DynamoDB 處理「併發寫入」的核心機制，DVA 必考。

### 條件寫入（Condition Expressions）

寫入時附帶一個條件，**條件成立才寫**，否則回傳 `ConditionalCheckFailedException`。用來防止覆蓋、防止重複建立。

```bash
# 只有在這個 userId 還不存在時才建立（防止覆蓋既有使用者）
$ aws dynamodb put-item \
    --table-name Users \
    --item '{"userId": {"S": "u-123"}, "name": {"S": "Alice"}}' \
    --condition-expression "attribute_not_exists(userId)"
```

### 原子計數器（Atomic Counter）

用 `UpdateItem` 的 `ADD` / `SET x = x + :n` 對數字欄位做**原子加減**，多個請求同時打也不會互相覆蓋。適合「文章瀏覽數」這種允許偶爾小誤差、不需絕對精準的計數。

```bash
# 瀏覽數 +1，原子操作，併發安全
$ aws dynamodb update-item \
    --table-name Articles \
    --key '{"articleId": {"S": "a-1"}}' \
    --update-expression "SET views = views + :inc" \
    --expression-attribute-values '{":inc": {"N": "1"}}'
```

### 樂觀鎖（Optimistic Locking）

每個項目存一個「版本號」屬性，更新時用**條件寫入**檢查「版本號還是我讀到的那個嗎」，是才寫、並把版本 +1。若中間被別人改過（版本變了），條件失敗、你重讀再試。SDK 的 `DynamoDBMapper` / `@DynamoDbVersionAttribute` 可自動幫你做。適合「不能有一筆更新被悄悄蓋掉」的場景（如庫存、餘額）。

:::info[🔑 原子計數器 vs 樂觀鎖]
**原子計數器**容許偶爾不精準、重點是高併發不互卡（瀏覽數）；**樂觀鎖**要求**絕不可遺失更新**、寧可失敗重試（庫存扣減、帳戶餘額）。選錯會被扣分。
:::

## DynamoDB Streams 與 DAX

### DynamoDB Streams

<Term en="DynamoDB Streams" desc="按時間順序記錄資料表項目層級變更的串流，保留 24 小時，常用來觸發 Lambda。">Streams</Term> 會**按時間順序**記錄資料表的每一筆「新增 / 修改 / 刪除」，保留 **24 小時**。最常見用法是**觸發 Lambda**做後續處理——例如寫入後自動同步到 OpenSearch、發通知、更新彙總表。可設定串流要帶哪些資料（`StreamViewType`：只帶鍵、新值、舊值、或新舊都帶）。

### DAX（DynamoDB Accelerator）

<Term en="DynamoDB Accelerator" desc="專為 DynamoDB 打造的記憶體快取叢集，把讀取延遲從毫秒降到微秒，API 幾乎相容、程式幾乎不用改。">DAX</Term> 是 DynamoDB 專屬的**記憶體快取**，把原本個位數**毫秒**的讀取進一步降到**微秒**級。它 API 和 DynamoDB 幾乎相容，**程式幾乎不用改**，把連線指向 DAX 叢集即可。

:::tip[💡 DAX 什麼時候用、什麼時候別用]
- 適合：**讀多寫少、重複讀同樣資料、要微秒級延遲**（如熱門商品、排行榜讀取）。
- 不適合：**寫入密集**（DAX 是讀取快取，寫入還是直打 DynamoDB）、**需要強一致讀**（DAX 服務的是最終一致讀）。
- 題目同時出現 **DynamoDB ＋ 讀取要更快 / 微秒** → 選 **DAX**，不要選一般 ElastiCache。
:::

## 分頁、批次操作與交易

### 分頁（Pagination、LastEvaluatedKey）

一次 Query / Scan 最多回傳 **1 MB** 資料。如果結果超過，回應會帶一個 **`LastEvaluatedKey`**；你把它當作下一次請求的 **`ExclusiveStartKey`** 再呼叫一次，就能拿下一頁。**沒有 `LastEvaluatedKey` 才代表讀完了**。

```bash
# 第二頁：把上一頁回傳的 LastEvaluatedKey 當 ExclusiveStartKey 傳回去
$ aws dynamodb query \
    --table-name Orders \
    --key-condition-expression "userId = :u" \
    --expression-attribute-values '{":u": {"S": "u-123"}}' \
    --exclusive-start-key '{"userId": {"S": "u-123"}, "orderDate": {"S": "2026-06-01"}}'
```

:::warning[🚑 新手最常漏]
看到結果筆數比預期少就以為「資料只有這些」——其實是碰到 **1 MB 單次上限**，沒接著用 `LastEvaluatedKey` 翻頁。正式程式一定要**迴圈讀到沒有 `LastEvaluatedKey` 為止**。
:::

### 批次操作（BatchGetItem / BatchWriteItem）

- **`BatchGetItem`**：一次讀多筆（最多 100 筆 / 16 MB）。
- **`BatchWriteItem`**：一次寫 / 刪多筆（最多 25 筆 / 16 MB），**不支援更新、不支援條件**。

批次操作**不是交易**——其中幾筆可能失敗，失敗的會放在回應的 **`UnprocessedItems`** 裡，你要**自己退避後重送**這些未處理項目。

### 交易（Transactions）

`TransactWriteItems` / `TransactGetItems` 提供 **ACID**：一組操作**全部成功或全部回滾**，跨多個項目甚至多張表都保證一致。適合「轉帳：A 扣款與 B 入帳必須同時成立」這種。代價是**消耗兩倍容量單位**，別濫用。

## 錯誤處理與退避重試（DVA 必考）

當你的請求超過預置容量（或瞬間打太兇），DynamoDB 會回傳 **`ProvisionedThroughputExceededException`**（HTTP 400，可重試的節流錯誤）。正確做法**不是立刻狂重試**，而是**指數退避加抖動（Exponential Backoff + Jitter）**：

- **指數退避**：每次重試等待時間加倍（如 50ms → 100ms → 200ms → 400ms…），給服務喘息空間。
- **抖動（Jitter）**：在等待時間上再加一點**隨機**，避免一大群客戶端「同時退避、又同時重試」造成第二波撞擊。

好消息是：**AWS SDK 預設就內建了指數退避與重試**，大多數情況你不用自己寫。考試重點是**知道遇到節流該退避重試、而非無限快打**，以及理解為何要加抖動。

:::warning[🚑 常見錯誤]
- **碰到節流就 while 迴圈狂重送**：只會讓情況更糟，正確是指數退避＋抖動。沒做指數退避，一群客戶端會「同時撞、同時退、又同時再撞」，節流永遠解不開。
- **誤以為批次操作會自動重試全部**：`BatchWriteItem` 的 `UnprocessedItems` 要**你自己退避重送**。
- **用 Scan 當日常查詢**：表一大就節流 + 爆成本，改 Query 或建 GSI。
- **用 Scan + `FilterExpression` 以為省 RCU**：過濾在**讀完整表之後**才發生，RCU 照掃過的全表算，一毛沒省。真正省的是用 Query 的 `KeyConditionExpression`。
- **熱分割（Hot Partition）**：PK 選了低基數的值（如全用同一個 `status`、或所有寫入都用同一天日期當 PK），流量全擠一個分割照樣被節流——PK 要選**高基數、分佈均勻**的值；真的會集中時用 **write sharding**（PK 後面加隨機後綴 `-0`～`-9`）把熱點打散。
- **GSI 容量不足反過來拖垮主表**：GSI 自帶獨立容量，若 GSI 的 WCU 買太少、又是 Provisioned 模式，**主表的寫入會被 GSI 卡住**（寫主表就得同步寫 GSI，GSI 寫不進去會回壓主表）。GSI 容量要配夠，或和主表一起用 On-Demand。
- **忘了項目有 400 KB 上限**：大檔（圖片、附件）存 S3，DynamoDB 只放 S3 的連結。
:::

<Cost>

DynamoDB 本身**有永久免費額度**（每月 25 GB 儲存、25 WCU + 25 RCU 的預置容量），小專案練習幾乎免費。要留意的是：**On-Demand 單位成本比 Provisioned 高**，流量穩定時用 Provisioned + Auto Scaling 較省；**GSI 有獨立容量**，建太多會各自計費；**DAX、Streams 觸發的 Lambda** 另外計費。練習用的表與 GSI 用完記得刪，避免預置容量一直佔額度。

</Cost>

<Refs>

- [Amazon DynamoDB 開發人員指南（總覽）](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html)
- [核心元件：資料表、項目與屬性](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.CoreComponents.html)
- [二級索引（LSI 與 GSI）](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/SecondaryIndexes.html)
- [讀寫容量模式（On-Demand 與 Provisioned）](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.ReadWriteCapacityMode.html)
- [錯誤處理與指數退避重試](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Programming.Errors.html)

</Refs>

## 下一步

👉 下一篇：[用 SDK 存取 S3 與資料](./data-storage-sdk.md)
