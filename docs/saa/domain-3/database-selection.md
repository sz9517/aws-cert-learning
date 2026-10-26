---
sidebar_position: 3
title: 資料庫選型：RDS／Aurora／DynamoDB
---

# 資料庫選型：用「資料模型 + 效能需求」選對資料庫

> 本篇從**效能角度**帶你搞懂 RDS、Aurora、DynamoDB 怎麼選，還有讀取流量太大時怎麼用 Read Replica 分攤——這是 Domain 3 最常考的選型題。

<Vocab title="📌 先認識這篇會出現的名詞（完全沒碰過也能懂）">

- **關聯式資料庫（Relational Database）**：資料存在「**一張張有欄位的表格**」裡，表格之間可以用關聯互相對應，查詢用標準 SQL 語言。像 Excel 的升級版。
- **NoSQL 資料庫**：不用固定表格、不強制欄位一致的資料庫。常見是「**鍵值（Key-Value）**」：給一把鑰匙（Key），直接拿到對應的資料，速度極快。
- **託管（Managed）**：AWS 幫你處理「**安裝、修補、備份、硬體維護**」這些雜事，你只管用。
- **讀取複本（Read Replica）**：主資料庫的「**唯讀分身**」，專門分攤查詢（讀）流量，讓主庫專心處理寫入。
- **吞吐量（Throughput）**：資料庫「**每秒能處理多少筆請求**」的能力。

</Vocab>

:::note[💬 閱讀小提示]
文章裡只要看到帶<Term desc="像這樣！滑鼠移到有虛線的名詞上（手機點一下），就會跳出白話解釋。">虛線底線的名詞</Term>，把滑鼠移上去就會跳出白話解釋。所有名詞也都整理在 [名詞與服務對照表](/glossary)。
:::

## 為什麼需要它？先講一個會出事的例子

假設你的電商網站一開始只用一台自己架的 MySQL。生意越來越好之後，你會發現三件事同時爆炸：

1. **資料庫要人顧**：半夜要自己備份、打安全修補、硬碟滿了要擴容，出事還得爬起來處理。
2. **讀取流量拖垮主庫**：大量使用者同時「查商品、看評論」（讀取），把主庫塞爆，連「下單」（寫入）都變慢。
3. **有些資料根本不適合塞進表格**：像購物車、使用者 session、遊戲排行榜，資料量超大又只需要「給一把鑰匙拿一筆資料」，用關聯式反而又慢又貴。

AWS 的答案是：**依資料模型與效能需求選對資料庫**——要標準 SQL 又想省事就用 <Term en="Relational Database Service" desc="AWS 託管的關聯式資料庫服務，支援 MySQL、PostgreSQL 等引擎，幫你處理備份、修補、維護。">RDS</Term>；要更高效能的關聯式就升級 <Term en="Amazon Aurora" desc="AWS 自家的關聯式資料庫引擎，相容 MySQL/PostgreSQL，效能更高、儲存自動擴展。">Aurora</Term>；要超大規模鍵值查詢、個位數毫秒延遲就用 <Term en="Amazon DynamoDB" desc="AWS 全託管的 NoSQL 鍵值資料庫，個位數毫秒延遲、無伺服器、自動擴展。">DynamoDB</Term>。而讀取流量太大的問題，則交給**讀取複本**分攤。

## 一句話先懂

**選資料庫沒有「最好」只有「最適合」**：先看資料是「表格關聯式」還是「鍵值 NoSQL」，再看效能／規模需求有多大，就能對應到 RDS、Aurora 或 DynamoDB。

<Analogy title="🍱 生活比喻：把三種資料庫想成三種餐廳">

- **RDS（託管關聯式）** 像「**家常熱炒店**」：菜單規矩（標準 SQL）、老闆幫你顧店（AWS 託管），該有的都有，開店門檻低。
- **Aurora（高效能關聯式）** 像「**同樣菜系但開了連鎖的旗艦店**」：菜單一樣（相容 MySQL/PostgreSQL），但後廚效能大升級、座位（儲存）客滿會自動擴桌，上菜更快。
- **DynamoDB（NoSQL 鍵值）** 像「**超高速取餐櫃**」：你報號碼（Key），櫃子「叮」一聲立刻彈出餐點（個位數毫秒），不管幾萬人同時取都不會塞——但它只做「報號取餐」這種固定動作，不接受複雜客製點單。

</Analogy>

## 三種資料庫怎麼選（最重要的一張表）

| 類型 | 資料模型 | 效能／規模 | 維運 | 最適合 |
| --- | --- | --- | --- | --- |
| **RDS** | 關聯式（MySQL、PostgreSQL、MariaDB、Oracle、SQL Server） | 一般～中大型，可加讀取複本 | 託管（AWS 顧備份/修補） | 要標準 SQL、傳統應用、想省維運 |
| **Aurora** | 關聯式（相容 MySQL / PostgreSQL） | 比 RDS 更高（官方宣稱 MySQL 約 5 倍吞吐），儲存自動擴展到 128 TB | 託管，且自動擴展更省心 | 要關聯式但需要更高效能／更大吞吐 |
| **DynamoDB** | NoSQL（鍵值 / 文件） | 幾乎無上限，個位數毫秒延遲 | 無伺服器（Serverless），完全不用管機器 | 超大規模、鍵值查詢、流量忽高忽低 |

<Term en="Relational Database Service" desc="AWS 託管的關聯式資料庫服務，支援 MySQL、PostgreSQL 等引擎。">RDS</Term> 的強項是「**標準又省事**」：你熟悉的 MySQL/PostgreSQL 原封不動搬上雲，備份、修補、硬體全交給 AWS。<Term en="Amazon Aurora" desc="AWS 自家關聯式引擎，相容 MySQL/PostgreSQL，效能更高、儲存自動擴展。">Aurora</Term> 則是「**同樣的 SQL、更強的引擎**」：相容既有應用，但吞吐更高、儲存隨用量自動長大，不用手動擴容。<Term en="Amazon DynamoDB" desc="AWS 全託管 NoSQL 鍵值資料庫，個位數毫秒延遲、無伺服器。">DynamoDB</Term> 走完全不同的路：放棄複雜的表格關聯，換來**超大規模下依然個位數毫秒**的穩定延遲，而且**無伺服器**，流量暴增也自動擴展。

## 第一步：關聯式 vs NoSQL 到底怎麼判斷？

很多人卡在這一步：三個服務背後其實是**兩種世界觀**。選型第一刀永遠是先切「我的資料是關聯式還是 NoSQL」，切錯後面全錯。判斷方法就看一句話——**你的查詢是「彈性、事先想不完」還是「固定、就那幾種」**。

<Analogy title="🗂️ 生活比喻：萬用檔案櫃 vs 自動販賣機">

- **關聯式（RDS／Aurora）像「萬用檔案櫃」**：資料分門別類放進一格格抽屜（表格），你事後想怎麼交叉比對都行——「找出上個月在台北、買過 A 商品、而且退過貨的女性會員」這種**臨時想到、要跨好幾張表 join 的彈性查詢**，它一句 SQL 就給你。代價是：規模衝很大時，這種彈性會變成效能包袱。
- **NoSQL（DynamoDB）像「自動販賣機」**：你投幣按 B3（給一把 Key），商品「叩」一聲掉出來，**快到不行、幾萬人同時按也不卡**。但它只做「按編號取貨」這一種動作——你沒辦法對販賣機說「給我所有紅色、300 元以下、銷量前十的商品」，那不是它的玩法。

</Analogy>

**一張判斷表（考試與實務都靠它）：**

| 問自己的問題 | 傾向關聯式（RDS／Aurora） | 傾向 NoSQL（DynamoDB） |
| --- | --- | --- |
| 查詢型態 | **彈性查詢**：事後才想到的各種條件、報表、跨表 join | **固定存取模式**：事先就知道「用哪個 Key 查哪筆」 |
| 資料關聯 | 多張表互相關聯（訂單↔會員↔商品） | 單一主鍵直取，關聯少或靠設計攤平 |
| 綱要（Schema） | 欄位固定、要求一致、重視交易一致性 | 欄位可變、每筆長得不一樣也行 |
| 規模與延遲 | 一般～中大型；要個位數毫秒且規模極大就難 | **超大規模**也維持**個位數毫秒** |
| 交易（Transaction） | 強項：多表 ACID 交易是天生本領 | 支援交易但有限制，不是為複雜交易而生 |

:::info[🔑 一個最關鍵的判準：先想「存取模式」再選 NoSQL]
關聯式可以「先建表、查詢之後慢慢想」；**DynamoDB 相反——你必須先想清楚「我會怎麼查」（存取模式），再據此設計主鍵與索引**。如果你現在連「以後會用什麼條件查」都還說不準，這本身就是一個強烈訊號：**你需要的是關聯式的彈性，而不是 DynamoDB**。
:::

## 第二步：RDS vs Aurora vs DynamoDB 為什麼選誰？

確定了關聯式 or NoSQL 之後，再往下分。下面用固定段落把每個服務的**為什麼是它／優點／缺點／何時別用**講清楚——這正是考試情境題要你判斷的核心。

### RDS：要關聯式、要標準、要省維運的「安全牌」

- **為什麼是它**：你已經有一套跑在 MySQL／PostgreSQL／Oracle／SQL Server 的應用，想上雲又不想自己顧機器。RDS 讓你**幾乎原封不動**搬過來，備份、修補、Multi-AZ 都變成勾選項。
- **優點**：相容性最廣（五種引擎）、生態與工具成熟、學習成本低、單機有 Free Tier。
- **缺點**：儲存要**事先配置**、單庫寫入效能有上限、垂直擴展（換更大機型）有天花板、故障切換比 Aurora 慢。
- **何時反而別用**：需要極高吞吐／自動擴展儲存（→ Aurora）；或根本是超大規模鍵值場景（→ DynamoDB）。

### Aurora：關聯式但要「更快、更大、更不用操心」

- **為什麼是它**：和 RDS **一樣講 SQL、相容既有應用**，但 AWS 重寫了儲存層——官方宣稱 MySQL 約 5 倍、PostgreSQL 約 3 倍吞吐，**儲存自動擴展到 128 TB**、6 份副本跨 3 個 AZ、故障切換通常**30 秒內**。
- **優點**：高效能、儲存免手動擴容、復原快、支援 **Aurora Serverless v2**（依負載自動伸縮運算，流量忽高忽低也划算）、**Global Database** 跨區災備與低延遲讀。
- **缺點**：比同規格 RDS **貴**；只相容 MySQL／PostgreSQL（沒有 Oracle／SQL Server）；仍是關聯式，解決不了「超大規模鍵值」的本質問題。
- **何時反而別用**：你只是小型應用、流量平穩，RDS 就夠且更便宜；或你要的是 NoSQL 的無限水平擴展（→ DynamoDB）。

:::info[🔑 最常被混淆：Aurora ≠ DynamoDB]
Aurora 名字很潮，很多人以為它是「AWS 版的 NoSQL」或「DynamoDB 的進階版」——**完全錯**。Aurora 是**關聯式資料庫**（講 SQL、有表格、能 join），它的對手是 RDS，不是 DynamoDB。DynamoDB 是 NoSQL 鍵值庫，兩者是**不同世界**，不能互相替代。考試很愛用這個混淆你。
:::

### DynamoDB：超大規模、固定存取、要無伺服器彈性

- **為什麼是它**：當你要的是「**給一把 Key、個位數毫秒拿到資料**」，而且規模可能衝到每秒百萬級、流量還忽高忽低——關聯式會被打趴，DynamoDB 卻**自動水平擴展**、幾乎無上限、閒置時用 On-Demand 幾乎不花錢。
- **優點**：無伺服器（完全不管機器）、延遲穩定、自動擴展、**Global Tables** 多區多活、按用量計費。
- **缺點**：**沒有彈性查詢**——跨「存取模式」的臨時查詢、複雜 join、聚合報表它都不擅長；綱要設計門檻高（要先想好存取模式）；不適合需要複雜交易的場景。
- **何時反而別用**：查詢條件多變、要 join、要報表分析（→ 關聯式或 Redshift）；資料量其實不大又需要彈性（RDS 更省事）。

### 擴展方式差在哪（一句話記）

- **RDS**：主要靠**垂直擴展**（換更大機型）＋ Read Replica 擴讀；寫入擴展有上限。
- **Aurora**：儲存**自動水平擴展**、讀取靠複本、運算可用 Serverless v2 伸縮；但寫入仍是單一主節點為主。
- **DynamoDB**：**天生水平擴展**，靠分區（Partition）自動把資料與流量攤到很多節點，規模幾乎無感上限。

:::warning[🚑 常踩雷：關聯式硬要「水平擴展」]
RDS／Aurora 的寫入**本質上是垂直擴展**（靠換更大機型、單一主節點），不像 DynamoDB 天生就能把寫入攤到無數節點。如果你的瓶頸是**寫入**量體大到單庫扛不住，加再多 Read Replica 也沒用（複本只分攤**讀**）。這時要嘛改造資料分片（複雜、易錯），要嘛本來就該選 DynamoDB。**把關聯式當水平擴展用，是選型最常見的死路。**
:::

## 不只有這三個：ElastiCache／Redshift／其他何時登場

選型題常常丟一個「其實不該選 RDS/Aurora/DynamoDB」的情境來考你有沒有分清楚。記住這幾個**關鍵字直接對應**：

| 需求關鍵字 | 該選的服務 | 為什麼 |
| --- | --- | --- |
| **極低延遲快取、session、排行榜、減輕 DB 讀取** | <Term en="Amazon ElastiCache" desc="AWS 託管的記憶體快取服務，支援 Redis/Memcached，微秒級延遲，常放在資料庫前面擋讀取。">ElastiCache</Term>（Redis／Memcached） | 記憶體快取，**微秒級**延遲；擋在 DB 前面吸收熱點讀取 |
| **大量歷史資料做分析／報表／OLAP、複雜聚合查詢** | <Term en="Amazon Redshift" desc="AWS 的雲端資料倉儲，為大規模分析查詢（OLAP）最佳化，用欄式儲存跑複雜聚合。">Redshift</Term> | 資料倉儲，欄式儲存、為**掃大量資料做分析**最佳化（不是即時交易 OLTP） |
| **圖形關聯：社群關係、推薦、詐欺偵測** | Amazon Neptune | 圖形資料庫，為「關係遍歷」而生 |
| **文件型 JSON、相容 MongoDB** | Amazon DocumentDB | 文件資料庫，MongoDB 相容 |
| **時間序列：IoT 感測、監控指標** | Amazon Timestream | 為時序資料最佳化 |

:::tip[💡 考試重點：別被「資料庫」三個字綁死]
- 看到 **「減輕資料庫負載、極低延遲、session／排行榜／熱門商品快取」** → **ElastiCache**（不是加 Read Replica，也不是換 DynamoDB）。
- 看到 **「分析、報表、OLAP、對 TB～PB 歷史資料跑複雜聚合」** → **Redshift**（不是 RDS／Aurora 這種 OLTP 交易庫）。
- 關鍵分辨：**OLTP（線上交易，一次動幾筆）= RDS／Aurora／DynamoDB；OLAP（分析，一次掃海量）= Redshift**。
:::

## 讀取流量太大？用讀取複本分攤

當「讀取（查詢）」遠多於「寫入」時，與其把主庫升級成怪物，不如幫主庫開幾個<Term en="Read Replica" desc="主資料庫的唯讀分身，專門分攤讀取流量，讓主庫專心處理寫入。">讀取複本</Term>：主庫專心寫，查詢流量分給一群唯讀分身，讀取效能就能水平擴展。RDS 與 Aurora 都支援。

:::note[📌 和 Domain 2「高可用」的差別]
同樣是「複本」，角度不一樣：這裡講的 **Read Replica 是為了「擴展讀取效能」**（分攤查詢流量）；而 Domain 2 講的 **Multi-AZ 是為了「高可用」**（主庫掛掉自動切換到備援）。兩者可以併用。高可用那套在 [資料庫高可用：Multi-AZ](/saa/domain-2/database-ha) 有完整說明。
:::

:::tip[💡 考試重點]
看到關鍵字直接對應，幾乎是送分：
- 題目講 **關聯式、要標準 SQL、想要託管省維運** → **RDS**
- 題目講 **要比 RDS 更高效能／更大吞吐的關聯式，儲存自動擴展** → **Aurora**
- 題目講 **超大規模、鍵值查詢、個位數毫秒延遲、無伺服器彈性** → **DynamoDB**
- 題目講 **讀取流量太大拖垮主庫、要擴展讀取效能** → 加 **Read Replica** 分攤讀取（注意：高可用才是 Multi-AZ）
- 題目講 **全球多區、低延遲讀寫** → **DynamoDB Global Tables** 或 **Aurora Global Database**
:::

## 運作流程圖解

<div className="flow">
  <div className="flow-node">應用程式</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">寫入 → 主資料庫（Primary）</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">自動複寫</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">讀取 → Read Replica（唯讀分身，可多個）</div>
</div>

*圖：寫入都送主庫，大量讀取分散到多個 Read Replica，讀取效能隨複本數量水平擴展。*

## 實務應用：不只是考試

<Scenario title="真實情境：下單越來越慢，一查發現是『被查垮的』">

你的電商主庫是一台 RDS for MySQL。促銷期間使用者狂刷「商品頁、評論、庫存」（全是讀取），把資料庫 CPU 塞到 100%，連結帳（寫入）都卡住。老闆說「**別再讓查詢拖垮下單**」。——答案不是無腦升級主庫，而是**加 2～3 個 Read Replica 專門吃讀取流量**，應用程式把查詢導到複本、寫入留給主庫。若未來資料量再暴漲、又出現超大規模鍵值查詢（例如購物車），再評估把那塊搬去 DynamoDB。下面帶你做一次。

</Scenario>

<Scenario title="真實情境：同一個電商，三種需求各選哪個？">

同一個電商系統，不同模組其實該用**不同資料庫**——這正是選型的精髓：

1. **訂單、會員、商品目錄**（要交易一致、要跨表 join 出報表）→ **關聯式**。流量中等就 **RDS**；若促銷吞吐暴衝、要儲存自動擴展、要快速故障切換 → 升 **Aurora**。
2. **購物車、使用者 session、即時排行榜**（固定存取模式、要個位數毫秒、規模可能很大）→ **DynamoDB**。
3. **首頁熱門商品、熱門搜尋**（同樣的查詢被打爆，想減輕 DB 讀取）→ 前面擋一層 **ElastiCache** 快取；想跑「過去一年銷售分析報表」→ 丟 **Redshift**。

**預期結果**：各模組用對工具後，交易庫專心處理交易、鍵值庫吃超大規模熱點、快取吸收重複讀取、分析庫跑它的大查詢——沒有哪一個被硬塞不該做的事，整體又快又省。這就是「沒有最好、只有最適合」的實際長相。

</Scenario>

### 🛠️ 動手做：幫 RDS 加一個 Read Replica

1. AWS 主控台搜尋 `RDS` → 左側 **資料庫（Databases）** → 點進你的主資料庫執行個體。
2. 右上 **動作（Actions）** → **建立讀取複本（Create read replica）**。
3. 選擇複本要放的 AZ／區域，執行個體大小先用小規格測試即可，建立。
4. 建好後，複本會有自己的**端點（Endpoint）**。把應用程式裡「唯讀查詢」的連線字串指到這個複本端點，寫入維持連主庫。
5. 壓測時觀察：主庫 CPU 明顯下降，讀取請求被複本接走——讀取效能成功水平擴展。

```bash
# 查看某個 RDS 執行個體的狀態與角色（主庫 or 複本）
$ aws rds describe-db-instances \
    --db-instance-identifier <你的執行個體名稱> \
    --query "DBInstances[].{Id:DBInstanceIdentifier,Role:ReadReplicaSourceDBInstanceIdentifier,Status:DBInstanceStatus}"
```

<Cost>

RDS／Aurora 的 Read Replica **每個都是一台要獨立計費的執行個體**，開越多越貴；DynamoDB 則是**按讀寫容量與儲存量計費**，沒在用時用「隨需（On-Demand）」模式幾乎不花錢。練習完記得**刪掉測試用的複本與資料庫執行個體**。RDS 單機有 Free Tier（`db.t3.micro`、一定時數），但複本不在免費額度內，用完就刪最保險。

</Cost>

:::warning[🚑 常踩雷]
- **用了 DynamoDB，卻又要複雜 join／彈性查詢**：DynamoDB 不是為「事後亂查、跨表 join、聚合報表」設計的。一旦發現自己一直想對它做 SQL 式的彈性查詢，代表當初**選型選錯了**，該用的是關聯式（或把分析丟給 Redshift）。
- **以為 Aurora＝DynamoDB**：Aurora 是**關聯式**（SQL、表格、join），對手是 RDS；DynamoDB 是 NoSQL 鍵值庫。兩者不同世界、不能互相替代，別被名字騙了。
- **關聯式硬要水平擴展**：RDS／Aurora 的**寫入**本質是垂直擴展（單一主節點），寫入扛不住時加 Read Replica 也救不了（複本只擴讀）。真要海量寫入水平擴展，本來就該選 DynamoDB。
- **選型只看「自己熟哪個」**：因為會寫 SQL 就什麼都塞 RDS、或因為聽過 DynamoDB 很潮就硬上——選型要看**資料模型＋存取模式＋規模**，不是看熟悉度。選錯的代價是後面整個重寫。
- **把 Read Replica 當高可用用**：複本是「擴展讀取」，不是自動故障切換；要主庫掛掉自動頂上，那是 **Multi-AZ**（見 Domain 2）。
- **應用程式沒把讀寫分流**：加了複本卻所有流量還是打主庫，等於白加。要在程式/連線層把唯讀查詢導向複本端點。
- **期待複本資料即時一致**：Read Replica 是**非同步複寫**，可能有短暫延遲（毫秒～秒級），對「寫完立刻要讀到」的場景要特別注意。
- **拿關聯式硬扛鍵值場景**：購物車、session、排行榜這類超大規模鍵值查詢，塞進 RDS 會又慢又貴，應改用 DynamoDB。
:::

<Refs>

- [AWS 官方文件：Amazon RDS 使用者指南](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Welcome.html)
- [Amazon RDS 讀取複本（Read Replicas）](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ReadRepl.html)
- [Amazon Aurora 使用者指南](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/CHAP_AuroraOverview.html)
- [Amazon DynamoDB 開發者指南](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html)
- [DynamoDB Global Tables 說明](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GlobalTables.html)

</Refs>

## 下一步

- ⚡ 快速複習：[Domain 3 重點速記 / 閃卡](/saa/domain-3/flashcards)
- ✍️ 測試自己：[Domain 3 原創練習題](/saa/domain-3/quiz)
- 📖 下一篇：[快取加速（Caching）](/saa/domain-3/caching)
