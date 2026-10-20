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

:::warning[🚑 實務常見錯誤]
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
