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

<Cost>

ElastiCache 與 DAX 都是**按節點／小時計費**，沒有免費額度，開著就一直算錢。練習完記得**刪掉叢集**。想省錢就選最小節點類型（如 `cache.t3.micro`、`cache.t4g.micro`），用完立刻刪最保險。

</Cost>

:::warning[🚑 實務常見錯誤]
- **拿 Memcached 存需要持久化的 session**：Memcached 重開就全丟，使用者會被集體登出；要持久化／複製請用 Redis。
- **DynamoDB 場景誤用一般 ElastiCache**：要加速 DynamoDB 讀取應該用 DAX，省得自己寫一堆快取邏輯。
- **忘了設 TTL**：快取資料永不過期，結果使用者一直看到舊資料（stale data）。
- **Security Group 沒放行快取埠**：Redis `6379`、Memcached `11211` 沒開，應用程式永遠連不上。
- **把快取當成唯一的資料來源**：快取是「加速層」，底層還是要有可靠的資料庫，快取節點掛了資料不能跟著不見。
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
