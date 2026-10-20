---
sidebar_position: 7
title: 可擴展的網路與儲存模式
---

# 可擴展模式：撐住高流量的底層心法

> 這是 Domain 3 的綜合收尾篇。前面幾篇談的是「用什麼工具加速」，這篇要把它們串起來，講一個更底層的道理：**水平擴展與分散負載，才是撐住高效能的根本**。

<Vocab title="📌 先認識這篇會出現的名詞（完全沒碰過也能懂）">

- **讀寫分離（Read/Write Split）**：把「讀資料」和「寫資料」分到**不同的資料庫**去處理。讀多的流量交給副本，寫入只走主庫。
- **唯讀副本（Read Replica）**：主資料庫的一份「**自動同步的複本**」，專門用來分攤讀取流量，不能拿來寫入。
- **分片／分區（Sharding / Partitioning）**：把一大堆資料**切成好幾塊**，分散存到不同地方，這樣就不會全部擠在同一處。
- **分區鍵（Partition Key）**：DynamoDB 用來決定「**這筆資料該放哪一塊**」的欄位，選得好資料才會分得平均。
- **熱分區（Hot Partition）**：某一塊被打爆了——大量請求全集中在同一個分區，塞車到拖垮整體效能。
- **前綴（Prefix）**：S3 物件路徑中「**斜線前面那一段**」，例如 `images/2026/a.jpg` 的 `images/2026/` 就是前綴。

</Vocab>

:::note[💬 閱讀小提示]
文章裡只要看到帶<Term desc="像這樣！滑鼠移到有虛線的名詞上（手機點一下），就會跳出白話解釋。">虛線底線的名詞</Term>，把滑鼠移上去就會跳出白話解釋。所有名詞也都整理在 [名詞與服務對照表](/glossary)。
:::

## 為什麼需要它？先講一個會出事的例子

假設你的網站一開始只有一台資料庫、一個 S3 儲存桶，流量小的時候一切都好。但隨著使用者暴增：讀取請求把資料庫壓到喘不過氣、某個熱門商品的查詢把 DynamoDB 某一塊打爆、使用者上傳大影片卡在半路跨海傳不完……

這些問題有個共同的解法方向：**不要讓所有負載擠在同一處，想辦法「分散」出去**。讀取太多就多開副本分攤、資料太集中就切開分散、上傳太慢就切成小塊平行傳。這就是「水平擴展」的核心精神——與其把單一資源無限加大（垂直擴展，總有上限），不如**把負載攤平到更多份資源上**。

## 一句話先懂這篇

**撐住高效能的底層心法，就是「水平擴展 + 分散負載」**：讀寫分離分攤資料庫壓力、分片／分區讓資料不集中、S3 用多前綴與分段上傳把請求與檔案攤開平行處理。

<Analogy title="🏢 生活比喻：把它想成一家爆紅的手搖飲店">

- **讀寫分離**：點單的客人（讀取）超多，你就多擺幾台「只負責報菜單、查庫存」的螢幕（唯讀副本）分流；真正「下單結帳」（寫入）還是集中到收銀台（主庫）。
- **分片／分區**：原料不要全堆在一個冰箱（熱分區會塞爆），依種類分到好幾個冰箱（分區鍵），要拿的時候各走各的、不互相卡。
- **S3 多前綴**：出餐窗口只開一個會排長龍，開好幾個窗口（多前綴）同時出餐，吞吐量瞬間翻好幾倍。
- **分段上傳**：一大箱貨太重搬不動，拆成好幾小箱分頭搬（Multipart），還能同時搬、掉一箱只要重搬那一箱。

</Analogy>

## 三種擴展模式怎麼用（最重要的一張表）

| 模式 | 解決什麼瓶頸 | 怎麼做 | 典型服務 |
| --- | --- | --- | --- |
| **讀寫分離** | 讀取流量把資料庫壓垮 | 開<Term en="Read Replica" desc="主資料庫的自動同步複本，專門分攤讀取流量，不能寫入。">唯讀副本</Term>分攤讀取、寫入走主庫 | RDS／Aurora Read Replica |
| **分片／分區** | 資料或請求全擠在同一處 | 用高基數的<Term en="Partition Key" desc="DynamoDB 決定資料放哪一塊的欄位，選得好資料才分得平均。">分區鍵</Term>把資料分散，避免熱分區 | DynamoDB、分庫分表 |
| **S3 效能最佳化** | 高請求率、大檔或跨國上傳慢 | 多<Term en="Prefix" desc="S3 物件路徑中斜線前面那一段，不同前綴可各自平行處理高請求率。">前綴</Term>平行、分段上傳、傳輸加速 | S3、S3 Transfer Acceleration |

### 讀寫分離：讀多就多開副本

大部分應用都是「**讀遠多於寫**」（商品頁被看千百次、下單才幾次）。RDS／Aurora 可以建立<Term en="Read Replica" desc="主資料庫的自動同步複本，專門分攤讀取流量。">Read Replica</Term>，把報表、查詢這類**唯讀流量導到副本**，主庫就專心處理寫入，整體吞吐量大幅提升。注意副本是**非同步複製**，可能有幾毫秒到幾秒的延遲，所以「寫完馬上要讀到最新」的情境仍要讀主庫。

### 分片／分區：資料不要集中在一塊

DynamoDB 把資料依<Term en="Partition Key" desc="DynamoDB 決定資料放哪一塊的欄位。">Partition Key</Term> 的雜湊值分散到多個分區。如果 Partition Key 選得不好（例如全部用同一個 `status=active`、或用日期導致當天流量全集中），就會造成<Term en="Hot Partition" desc="大量請求全集中在同一個分區，塞車拖垮整體效能。">熱分區</Term>——某一塊被打爆、其他塊閒置。**解法是選擇「高基數（值很多、分布均勻）」的 Partition Key**，例如用 `user_id`、`order_id` 這種唯一性高的欄位，讓請求平均攤到各分區。

### S3 效能最佳化：把請求與檔案都攤開平行

- **多前綴平行**：S3 現在**每個<Term en="Prefix" desc="物件路徑斜線前面那一段。">前綴</Term>可達每秒 3,500 次寫入 / 5,500 次讀取請求**，而且前綴數量沒有上限。只要把物件分散在多個前綴下（如 `logs/a/`、`logs/b/`），吞吐量就能線性疊加。**（重要：以前要在前綴加隨機 hash 來分散，現在已經不需要了。）**
- **分段上傳（<Term en="Multipart Upload" desc="把大檔切成多個小塊平行上傳，失敗只需重傳該塊。">Multipart Upload</Term>）**：大檔切成多個小塊**平行上傳**，速度更快、失敗只要重傳那一塊。官方建議 **100 MB 以上就該用**。
- **傳輸加速（<Term en="S3 Transfer Acceleration" desc="透過 CloudFront 邊緣節點加速跨國長距離上傳。">S3 Transfer Acceleration</Term>）**：跨國、長距離上傳時，先傳到最近的 CloudFront 邊緣節點，再走 AWS 骨幹網路回到儲存桶，明顯加快。

:::tip[💡 考試重點]
看到關鍵字直接對應瓶頸與工具，幾乎是送分：
- 題目講 **讀取流量暴增、資料庫讀取壓力大** → **Read Replica**（搭配快取 ElastiCache 更好）
- 題目講 **DynamoDB 某些鍵被打爆、吞吐量不均、throttling** → 設計**高基數的 Partition Key** 分散資料、**避免熱分區**
- 題目講 **S3 上傳大檔、或跨國／長距離上傳很慢** → **Multipart Upload ＋ Transfer Acceleration**
- 題目講 **S3 需要支撐高請求率** → **用多個前綴平行化**（不再需要隨機前綴 hash）
:::

## 「依效能瓶頸選工具」決策思路

<div className="flow">
  <div className="flow-node">先問：瓶頸在哪一層？</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">讀取太多 → Read Replica／ElastiCache</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">資料集中 → 高基數 Partition Key 分散</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">上傳／傳輸慢 → Multipart＋Transfer Acceleration</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">靜態內容遠 → CloudFront 邊緣快取</div>
</div>

*圖：效能題不是背單一服務，而是先判斷「瓶頸在哪」，再從對應層級挑分散負載的工具。這正是 Domain 3 的綜合考法。*

## 實務應用：不只是考試

<Scenario title="真實情境：大促當天資料庫 CPU 飆到 100%、S3 上傳一直逾時">

大促一開賣，監控就跳警報：RDS 的讀取 CPU 飆到 100%、DynamoDB 某張表一直 throttling、使用者上傳的高畫質開箱影片一直逾時失敗。你一個一個拆：**讀取壓力**開 Read Replica 分流；**DynamoDB 熱分區**重新設計 Partition Key；**大檔上傳**改用 Multipart Upload 並開啟 Transfer Acceleration。下面帶你把這幾招實際設定一次。

</Scenario>

### 🛠️ 動手做：三招分散負載的實作

1. **開 RDS 唯讀副本**：主控台 `RDS` → 選你的資料庫 → **動作（Actions）** → **建立唯讀副本**。建好後把應用程式的「唯讀查詢」改連副本的端點（Endpoint），寫入仍連主庫。
2. **檢視 DynamoDB 分區熱度**：到 `DynamoDB` → **CloudWatch Contributor Insights**，看哪些 Partition Key 被打最兇；若集中在少數鍵，就改用唯一性更高的欄位當 Partition Key。
3. **用 CLI 開啟 S3 傳輸加速並做分段上傳**（大檔會自動切塊）。

```bash
# 為儲存桶開啟 Transfer Acceleration
$ aws s3api put-bucket-accelerate-configuration \
    --bucket my-bucket \
    --accelerate-configuration Status=Enabled

# 上傳大檔，aws s3 cp 對大檔會自動使用分段上傳
$ aws s3 cp big-video.mp4 s3://my-bucket/ \
    --endpoint-url https://my-bucket.s3-accelerate.amazonaws.com
```

<Cost>

Read Replica 等於**多開一台資料庫執行個體**，會以執行個體時數另外計費；DynamoDB 看讀寫容量計費，熱分區會讓你一直被迫調高容量、反而更貴。S3 Transfer Acceleration 每 GB 另收加速費。練習完記得**刪掉副本、關閉加速設定**，避免持續計費。

</Cost>

:::warning[🚑 實務常見錯誤]
- **把寫入導到唯讀副本**：副本不能寫，而且複製有延遲，寫完立刻讀副本可能讀到舊資料。
- **Partition Key 用低基數欄位**：例如用 `country` 而大部分使用者都在同一國，直接造成熱分區與 throttling。
- **還在手動加隨機前綴 hash**：S3 效能早已升級，每個前綴就能撐數千請求，多餘的 hash 只會讓路徑難管理。
- **大檔不用 Multipart**：單次 PUT 上限 5 GB，而且失敗要整個重傳，大檔務必用分段上傳。
:::

<Refs>

- [AWS 官方文件：RDS 唯讀副本](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ReadRepl.html)
- [DynamoDB 分區鍵設計最佳實務](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-partition-key-design.html)
- [S3 效能最佳化最佳實務](https://docs.aws.amazon.com/AmazonS3/latest/userguide/optimizing-performance.html)
- [S3 Transfer Acceleration](https://docs.aws.amazon.com/AmazonS3/latest/userguide/transfer-acceleration.html)
- [S3 分段上傳 Multipart Upload](https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html)

</Refs>

## 下一步

- ⚡ 快速複習：[Domain 3 重點速記 / 閃卡](/saa/domain-3/flashcards)
- ✍️ 測試自己：[Domain 3 原創練習題](/saa/domain-3/quiz)
- 📊 總複習：[Domain 3 比較速查頁](/saa/domain-3/comparison)
