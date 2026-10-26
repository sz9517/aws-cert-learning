---
sidebar_position: 4
title: 快取加速：ElastiCache 與 DAX
---

# 快取加速：把讀取延遲從毫秒降到微秒

> 本篇帶你搞懂「加一層快取」怎麼減輕資料庫壓力、把回應速度拉到極致。ElastiCache（Redis／Memcached）與 DAX 的選型，是 Domain 3 很愛考的題目。

<Vocab title="📌 先認識這篇會出現的名詞（完全沒碰過也能懂）">

- **快取（Cache）**：把「**常被查的資料**」先放進一個超快的地方（通常是記憶體），下次要用直接拿，不必每次都去翻慢吞吞的硬碟或資料庫。
- **記憶體（In-Memory）**：資料直接放在 RAM 裡，讀取比硬碟快**好幾個數量級**，但機器重開資料可能就不見（除非特別做持久化）。
- **延遲（Latency）**：從「送出請求」到「拿到回應」中間等待的時間。數字越小越好。
- **工作階段（Session）**：使用者登入後，伺服器幫他記住的狀態（例如購物車、登入身分）。

</Vocab>

:::note[💬 閱讀小提示]
文章裡只要看到帶<Term desc="像這樣！滑鼠移到有虛線的名詞上（手機點一下），就會跳出白話解釋。">虛線底線的名詞</Term>，把滑鼠移上去就會跳出白話解釋。所有名詞也都整理在 [名詞與服務對照表](/glossary)。
:::

## 為什麼需要它？先講一個會變慢的例子

假設你的網站首頁要顯示「熱門商品排行榜」，每個使用者一進來，程式就去**資料庫**跑一次複雜查詢。平常沒事，但一到尖峰，成千上萬人同時進首頁——同一個查詢被重複跑了幾萬次，資料庫被打到喘不過氣，整站跟著變慢。

問題在於：**這份排行榜資料大家看的都一樣，而且沒必要每次都重算**。解法是：把算好的結果先放進一層**快取**。第一個人來時算一次、存進記憶體；接下來的人直接從記憶體拿，**微秒**就回來，資料庫完全不用再動。這就是快取的核心價值——**把熱門資料放記憶體，省去每次打資料庫，同時降延遲、降負載**。

### 為什麼值得多加一層？意義與好處

初學者常問：「資料庫本來就能查，為什麼要多搬一層快取、多一個東西要維護？」用白話列一下它真正解決的問題：

- **降低延遲（變快）**：記憶體讀取是**微秒級**，硬碟／資料庫查詢常是**毫秒級甚至更久**，差距可達上百倍。對使用者來說就是「頁面秒開」vs「轉圈圈」。
- **減輕後端壓力（省資源）**：同一個熱門查詢若一天被打幾百萬次，大多可以由快取直接回答，資料庫的 CPU／連線數瞬間鬆綁，**不用為了尖峰硬去升級一台更貴的資料庫**。
- **提升可擴充性（撐得住尖峰）**：行銷活動、搶購、突發流量時，快取像個緩衝墊，把暴衝的讀取擋在資料庫前面，避免整站被拖垮。
- **間接省錢**：擋掉的查詢越多，資料庫需要的規格就越小；對 DynamoDB 這種**按讀取量計費**的服務，快取命中等於直接少付讀取費用。

:::info[🔑 什麼時候快取最划算？]
快取最適合「**讀多寫少、而且同一份資料被重複讀**」的情境（商品頁、設定檔、排行榜、session）。反過來說，若資料**每筆只讀一次**（如一次性報表）或**改動極頻繁**（每秒都在變的即時計數），快取命中率低、又要一直維護一致性，加了反而划不來。先問「這份資料會被重複讀嗎？」再決定要不要快取。
:::

## 一句話先懂快取

**快取（Cache）** 把常用資料放在記憶體裡，讓重複的讀取在**微秒**內完成，不用每次都去打較慢的資料庫，藉此**降低延遲、減輕後端壓力**。AWS 主要提供兩個託管快取：<Term en="Amazon ElastiCache" desc="AWS 託管的記憶體快取服務，支援 Redis 與 Memcached 兩種引擎。">ElastiCache</Term> 與專給 DynamoDB 用的 <Term en="DynamoDB Accelerator" desc="專為 DynamoDB 打造的記憶體快取，把讀取延遲從毫秒降到微秒。">DAX</Term>。

<Analogy title="🍜 生活比喻：把快取想成拉麵店門口的『今日湯頭』">

- 每碗都從頭熬湯（**每次打資料庫**）既慢又累，客人排到天荒地老。
- 老闆改成一大早熬好一鍋放保溫（**快取放記憶體**），客人點餐直接舀——**秒上桌**。
- 湯放久了會走味，所以設個「**每 2 小時換一鍋**」的規則（這就是 **TTL 過期時間**），確保客人喝到的不會太舊。
- 偶爾有人點隱藏菜單（**快取沒有的冷門資料**），才回廚房現做一次，順便也裝進保溫桶下次用（這就是 **Lazy Loading 惰性載入**）。

</Analogy>

## ElastiCache：Redis 還是 Memcached？（最重要的一張表）

<Term en="Amazon ElastiCache" desc="AWS 託管的記憶體快取服務，幫你管好叢集、修補、備份。">ElastiCache</Term> 幫你把快取叢集的建置、修補、監控都托管好。它有兩種「引擎」可選，考試最愛考怎麼挑：

| 比較項目 | **Redis** | **Memcached** |
| --- | --- | --- |
| 資料結構 | 豐富（字串、清單、集合、排序集合、雜湊…） | 單純（只有 key-value 字串物件） |
| 持久化／備份 | ✅ 支援（可存快照、重開不丟） | ❌ 不支援（重開資料就沒了） |
| 複製／高可用 | ✅ 支援主從複製、自動容錯移轉 | ❌ 沒有複製，壞了就壞了 |
| 多執行緒 | 單執行緒為主 | ✅ 多執行緒，純吃 CPU 效能好 |
| 擴展方式 | 讀取可加副本；分片叢集模式 | 水平加節點切分資料 |
| 典型用途 | 排行榜、即時訊息、需要持久化的 session | 單純、要水平擴展的物件快取 |

一句話記：<Term en="Remote Dictionary Server" desc="功能豐富的記憶體資料庫，支援持久化、複製、排序集合等進階結構。">Redis</Term> 是「**功能齊全、可當半個資料庫**」；<Term en="Memcached" desc="單純、多執行緒的記憶體物件快取，適合水平擴展。">Memcached</Term> 是「**單純、快、好水平擴展的純快取**」。只要題目提到持久化、複製、排行榜、進階結構，答案幾乎都是 Redis。

#### 怎麼選？各自的優缺點與適用時機

- **選 Redis 的理由（優點）**：支援持久化與快照（重開不丟）、主從複製與自動容錯移轉（高可用）、豐富資料結構（排序集合做排行榜、發布／訂閱做即時通知）。**缺點**：以單執行緒為主，純粹比「單節點每秒塞多少 key」時不一定勝過多執行緒的 Memcached；功能多，設定與維運也相對複雜一點。
- **選 Memcached 的理由（優點）**：多執行緒、在多核心機器上純吞吐量強；架構單純、水平加節點切分資料很直覺。**缺點**：沒有持久化（重開全丟）、沒有複製與容錯移轉（節點掛了資料就沒了）、只有單純 key-value（做不了排行榜那類進階結構）。

:::info[🔑 一句話決策：不確定就選 Redis]
實務與考試的通則是——**除非你明確需要「多執行緒純吞吐 + 單純物件快取 + 可接受資料遺失」才選 Memcached，其餘幾乎都選 Redis**。因為 Redis 功能是 Memcached 的超集合，選它幾乎不會錯；而只要題目碰到「持久化、複製、高可用、排行榜、session 要保存」，Memcached 直接出局。
:::

:::tip[💡 考試重點]
看到關鍵字直接對應，幾乎是送分：
- 題目講 **要複製／持久化／進階資料結構（排序集合）／排行榜** → **ElastiCache for Redis**
- 題目講 **單純、要水平擴展的物件快取** → **Memcached**
- 題目講 **加速 DynamoDB 讀取到微秒級** → **DAX**（這題不要選一般 ElastiCache！）
- 題目講 **資料庫讀取壓力大、同樣查詢一直重複** → 前面**加一層快取**（ElastiCache）
- 題目講 **要把使用者 session 從單台 EC2 搬出來共用** → 用 **ElastiCache 存 session**
:::

## 常見快取策略

快取不是放進去就好，要決定「**資料什麼時候進快取、什麼時候過期**」。三種最常考：

- **惰性載入（Lazy Loading）**：有人要查才去資料庫撈，撈完順手塞進快取。好處是只快取「真的有人要的資料」，不浪費記憶體；壞處是第一次查一定會慢（快取沒命中，術語叫 cache miss）。
- **寫穿（Write-Through）**：每次寫資料庫時，**同步**也更新快取。好處是快取永遠是最新的；壞處是就算這筆資料沒人讀，也占了快取空間。
- **過期時間（TTL, Time To Live）**：給每筆快取資料設一個「**保存期限**」，時間到就自動清掉，強迫下次重新從資料庫拿。常和上面兩種搭配使用，避免快取的資料和資料庫對不上（術語叫 stale data，過期資料）。

<div className="flow">
  <div className="flow-node">應用程式要讀資料</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">先問快取：有嗎？</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">命中 → 微秒回傳</div>
  <div className="flow-arrow">／</div>
  <div className="flow-node">沒命中 → 打資料庫，再寫回快取</div>
</div>

*圖：快取命中時直接從記憶體回傳；沒命中才回頭打資料庫（惰性載入），並把結果寫回快取供下次使用。*

#### Lazy Loading vs Write-Through：怎麼取捨？

這兩種策略常被放在一起問「該用哪個」，其實是一組互補的取捨：

| 比較 | **惰性載入（Lazy Loading）** | **寫穿（Write-Through）** |
| --- | --- | --- |
| 什麼時候寫快取 | **讀取未命中時**才回填 | **每次寫資料庫時**同步寫 |
| 快取裡放的資料 | 只放「真的被讀過」的熱資料 | 連沒人讀的也放，可能占空間 |
| 第一次讀 | 一定慢（cache miss） | 已經先寫好了，讀得到 |
| 資料新鮮度 | 可能讀到舊資料（要靠 TTL 救） | 寫入後快取立刻是最新的 |
| 寫入延遲 | 寫入快（只寫 DB） | 寫入較慢（要同時寫 DB + 快取） |

白話取捨：**惰性載入省記憶體、但第一次慢且可能讀到舊資料**；**寫穿永遠新鮮、但浪費空間且拖慢寫入**。實務上最常見的是**「惰性載入 + TTL」當底，再對少數關鍵且讀取量大的資料補上寫穿**——兩者不是二選一，而是看資料特性混搭。

:::warning[🚑 常踩雷：忘了 TTL，快取和資料庫就會「對不上」]
不管用哪種策略，只要底層資料會被改，快取就有**過期資料（stale data）**的風險。惰性載入沒設 TTL，舊值會一直被回傳；寫穿若有人繞過應用程式直接改資料庫，快取也會失準。**務必替快取項目設 TTL**，或在資料更新時主動**失效（invalidate）對應的快取鍵**，否則使用者會一直看到舊畫面。
:::

## DAX：DynamoDB 專屬的微秒級快取

如果你用的是 <Term en="Amazon DynamoDB" desc="AWS 的全託管 NoSQL 資料庫，個位數毫秒延遲。">DynamoDB</Term>，而且讀取壓力很大、想再快一階——答案**不是**一般 ElastiCache，而是 <Term en="DynamoDB Accelerator" desc="專為 DynamoDB 打造的記憶體快取，程式幾乎不用改就能把讀取延遲降到微秒。">DAX</Term>。

DAX 是 AWS 專門為 DynamoDB 打造的記憶體快取，特色是：**把原本毫秒級的讀取進一步降到微秒級**，而且它和 DynamoDB 的 API 幾乎一樣——你的程式**幾乎不用改**，把連線指向 DAX 就好，它會自動處理快取命中與回源。這點和 ElastiCache 很不同：ElastiCache 要你自己在程式裡寫「先查快取、沒有再查資料庫」的邏輯。

| 比較 | **DAX** | **一般 ElastiCache** |
| --- | --- | --- |
| 專為誰設計 | 只給 DynamoDB | 任何資料來源都行 |
| 程式要不要改 | 幾乎不用（API 相容） | 要自己寫快取邏輯 |
| 延遲 | 微秒級 | 微秒～毫秒級 |
| 適用情境 | DynamoDB 讀多、要再加速 | 通用快取、session、排行榜 |

:::tip[💡 一秒判斷]
題目只要同時出現 **DynamoDB** ＋ **讀取要更快／微秒級／快取** → 直接選 **DAX**。出現「通用快取」「session」「Redis 功能」才選 ElastiCache。
:::

#### DAX vs ElastiCache：優缺點與何時別用

- **DAX 的優點**：和 DynamoDB API 相容，**程式幾乎不用改**，快取命中／回源都自動處理，省掉手寫快取邏輯的功夫；讀取降到微秒級。**缺點／限制**：**只能給 DynamoDB 用**（接其他資料庫一律用不到）；對**寫入**沒有加速效果（DAX 加速的是讀），而且它的快取一致性模型要注意——DAX 是**最終一致**的快取層，剛寫完立刻讀「強一致讀取（strongly consistent read）」會**略過 DAX 直接打 DynamoDB**，拿不到微秒加速。
- **ElastiCache 的優點**：**任何資料來源都能快取**（RDS、自架 DB、運算結果、session…），搭 Redis 還有持久化、複製、進階結構。**缺點**：要**自己在程式裡寫快取邏輯**（先查快取、沒有再查 DB、記得回填與失效），開發與維護成本較高。

:::info[🔑 什麼時候「別用 DAX」？]
- 你的資料**不在 DynamoDB**（例如來源是 RDS 或 Aurora）→ DAX 用不上，改用 ElastiCache。
- 你的場景是**寫入密集**或**需要強一致的即時讀**→ DAX 幫不上忙（它加速的是最終一致的讀），別為它硬上。
- 你要快取的是 **session 或跨服務的通用資料** → 那是 ElastiCache（尤其 Redis）的地盤，不是 DAX。
反過來，**資料就在 DynamoDB、讀多、想少寫程式** → DAX 幾乎是最省事的答案。
:::

## 實務應用：不只是考試

<Scenario title="真實情境：使用者登入後一換機器就被登出">

你的網站跑了好幾台 EC2、前面掛了負載平衡器。但使用者抱怨：剛登入好好的，重整一下又被要求重新登入。查下去發現——**session 被存在各台 EC2 自己的記憶體裡**，負載平衡器把下一個請求分到另一台，那台根本不認得這個使用者。解法：把 session **集中存到 ElastiCache**，所有 EC2 都去同一個地方讀，不管請求落到哪台都認得你。下面帶你做一次。

</Scenario>

### 🛠️ 動手做：用 ElastiCache for Redis 存 session

1. AWS 主控台搜尋 `ElastiCache` → **建立叢集** → 引擎選 **Redis**。
2. 節點類型先選最小的（例如 `cache.t3.micro`）、部署在你 EC2 所在的 **VPC 與子網路**。
3. **Security Group** 放行：允許來自「EC2 的 SG」連到 Redis 的 `6379` 埠，否則連不上。
4. 建好後複製 Redis 的**端點（Endpoint）位址**，填進你應用程式的 session 設定（例如 PHP、Express、Django 都有對應套件）。
5. 測試：登入後故意把其中一台 EC2 關掉，負載平衡器把你導到另一台——**你依然是登入狀態**，因為 session 存在共用的 Redis。

```bash
# 查看 ElastiCache 叢集狀態，確認端點與狀態為 available
$ aws elasticache describe-cache-clusters \
    --show-cache-node-info
```

**預期結果**：輸出的 JSON 裡會看到 `"CacheClusterStatus": "available"`，以及 `CacheNodes` 底下每個節點的 `Endpoint`（含 `Address` 與 `Port` 6379）。拿那個 `Address` 填進應用程式即可。若狀態還是 `creating`，等一兩分鐘再查；若查不到叢集，先確認 `--region` 有沒有對。

```bash
# （選用）確認安全群組有放行 6379：裝好 redis-cli 後從 EC2 測連線
$ redis-cli -h <你的-redis-endpoint> -p 6379 ping
```

**預期結果**：連得上會回 `PONG`。若卡住不動或逾時，**十之八九是 Security Group 沒放行 6379**（這也是下方常踩雷第一條）——回去確認 Redis 的 SG 允許來自 EC2 SG 的 6379。

<Cost>

ElastiCache 與 DAX 都是**按節點／小時計費**，沒有免費額度，開著就一直算錢。練習完記得**刪掉叢集**。想省錢就選最小節點類型（如 `cache.t3.micro`、`cache.t4g.micro`），用完立刻刪最保險。

</Cost>

:::warning[🚑 實務常見錯誤]
- **拿 Memcached 存需要持久化的 session**：Memcached 重開就全丟，使用者會被集體登出；要持久化／複製請用 Redis。
- **DynamoDB 場景誤用一般 ElastiCache**：要加速 DynamoDB 讀取應該用 DAX，省得自己寫一堆快取邏輯。
- **忘了設 TTL**：快取資料永不過期，結果使用者一直看到舊資料（stale data）。
- **Security Group 沒放行快取埠**：Redis `6379`、Memcached `11211` 沒開，應用程式永遠連不上。
- **把快取當成唯一的資料來源**：快取是「加速層」，底層還是要有可靠的資料庫，快取節點掛了資料不能跟著不見。
- **快取一致性沒顧好（stale data）**：更新了資料庫卻沒**失效（invalidate）**對應的快取鍵，使用者就一直讀到舊值。更新資料時要嘛刪掉舊快取、要嘛靠 TTL 強制過期。
- **快取穿透（cache penetration）**：大量查詢「**根本不存在的 key**」（如亂猜 ID 攻擊），因為快取永遠沒命中，每一筆都直接打到資料庫，等於快取形同虛設。對策：把「查無此資料」這個結果也**用短 TTL 快取起來（快取空值）**，或在入口做參數／白名單驗證擋掉亂打。
- **誤用 DAX 的強一致讀取**：對 DAX 下 strongly consistent read 會**繞過快取直接打 DynamoDB**，拿不到微秒加速還照樣耗讀取容量；要微秒加速請用最終一致讀取。
- **沒分散過期時間（快取雪崩）**：一大批 key 設成同一時刻到期，過期瞬間請求全湧向資料庫。替 TTL 加一點隨機抖動，避免同時失效。
:::

<Refs>

- [AWS 官方文件：Amazon ElastiCache 總覽](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/WhatIs.html)
- [ElastiCache：Redis 與 Memcached 比較](https://docs.aws.amazon.com/AmazonElastiCache/latest/mem-ug/SelectEngine.html)
- [快取策略（Lazy Loading、Write-Through、TTL）](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/Strategies.html)
- [Amazon DynamoDB Accelerator (DAX) 說明](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DAX.html)
- [用 ElastiCache 管理工作階段（Session）](https://docs.aws.amazon.com/AmazonElastiCache/latest/mem-ug/elasticache-use-cases.html)

</Refs>

## 下一步

- ⚡ 快速複習：[Domain 3 重點速記 / 閃卡](/saa/domain-3/flashcards)
- ✍️ 測試自己：[Domain 3 原創練習題](/saa/domain-3/quiz)
- 📖 下一篇：[內容傳遞與全球加速](/saa/domain-3/content-delivery)
