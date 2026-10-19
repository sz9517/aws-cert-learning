---
sidebar_position: 7
title: 資料庫與儲存的高可用
---

# 資料庫與儲存：讓「資料」永遠不掉線

> 伺服器可以隨時砍掉重開，但**資料不行**。這篇教你如何讓資料庫與檔案儲存即使機房出事也不中斷、不遺失，是 Domain 2 的收尾重點。

<Vocab title="📌 先認識這篇會出現的名詞（完全沒碰過也能懂）">

- **RDS（Relational Database Service）**：AWS 幫你「**代管的關聯式資料庫**」（MySQL、PostgreSQL、SQL Server 等）。備份、修補、備援它都幫你顧，你不用自己養一台資料庫主機。
- **AZ（Availability Zone，可用區）**：同一個地區（Region）裡**實體分開的機房**。一個 AZ 淹水停電，另一個 AZ 還活著。
- **容錯移轉（Failover）**：主系統掛掉時，**自動切換**到備援系統接手，使用者幾乎無感。
- **複本（Replica）**：資料的**另一份拷貝**。依用途分成「備援用」和「分擔讀取用」兩種。

</Vocab>

:::note[💬 閱讀小提示]
文章裡只要看到帶<Term desc="像這樣！滑鼠移到有虛線的名詞上（手機點一下），就會跳出白話解釋。">虛線底線的名詞</Term>，把滑鼠移上去就會跳出白話解釋。所有名詞也都整理在 [名詞與服務對照表](/glossary)。
:::

## 一句話先懂

資料的高可用有兩個完全不同的目標，考試最愛混在一起考：
- **怕掛掉（高可用）** → 用 **Multi-AZ**：在另一個機房放一份即時同步的備援，主庫一倒就自動切過去。
- **讀太慢（效能/擴展）** → 用 **唯讀複本（Read Replica）**：多放幾份拷貝分擔「讀」的流量。

<Analogy title="🏢 生活比喻：把資料庫想成一家餐廳的帳本">

- **主資料庫** = 正本帳本，店長每天在上面記帳（寫入）。
- **Multi-AZ 備援** = 隔壁分店保險箱裡一本**即時同步的副本**。本店失火（AZ 故障）時，隔壁那本立刻變正本繼續用——這叫**高可用**，副本平常不給客人看。
- **唯讀複本（Read Replica）** = 影印好幾份帳本放在各櫃檯，讓很多客人同時「查帳」（讀取），減輕正本的負擔——這叫**讀取擴展**，但它不保證即時、也不會自動變正本。

</Analogy>

## Multi-AZ vs 唯讀複本：最常考的對照

| 比較項目 | Multi-AZ 備援 | 唯讀複本（Read Replica） |
| --- | --- | --- |
| **主要目的** | 高可用 / 災難復原 | 分擔讀取流量、提升效能 |
| **複寫方式** | **同步**（寫入兩邊都成功才算完成） | **非同步**（略有延遲） |
| **能不能讀取分流** | ❌ 平常不提供讀取，純待命 | ✅ 可以，應用程式把讀取導到複本 |
| **故障時** | **自動** failover 到備援 AZ | 不會自動接手（但可手動升為獨立主庫） |
| **可否跨地區（Region）** | 否（同 Region 跨 AZ） | ✅ 可跨 Region（災難復原 + 就近讀取） |

:::tip[💡 考試重點]
- 題目出現「**提高可用性 / 自動容錯移轉 / 不能停機**」→ 選 **<Term en="Multi Availability Zone" desc="在同一地區的另一個機房放即時同步備援，主庫故障時自動切換。">Multi-AZ</Term>**。
- 題目出現「**讀取流量太大 / 報表查詢拖慢資料庫 / 減輕主庫負擔**」→ 選 **<Term en="Read Replica" desc="資料庫的唯讀拷貝，用來分擔查詢流量，非同步複寫。">唯讀複本</Term>**。
- **Multi-AZ 不會分擔讀取**、唯讀複本**不保證高可用**——把這兩句背起來，一題穩拿分。
- 檔案儲存：**<Term en="Elastic File System" desc="AWS 代管的共享檔案系統，可被多台 EC2 同時掛載，跨 AZ。">EFS</Term> 天生跨多個 AZ、可多台同時掛載**；**<Term en="Elastic Block Store" desc="掛在單一台 EC2 的區塊硬碟，綁定單一 AZ。">EBS</Term> 綁死單一 AZ**，不能跨 AZ 掛載。要跨 AZ 共享檔案選 EFS。
:::

## 運作流程圖解

<div className="flow">
  <div className="flow-node">主資料庫（AZ-a）</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">AZ-a 整個故障</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">RDS 自動 failover</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">備援升為主庫（AZ-b）</div>
</div>

*圖：Multi-AZ 下主庫故障，RDS 幾分鐘內自動把備援提升為新主庫，連線字串（Endpoint）不變，應用程式幾乎無感。*

## 其他要會的高可用設計

- **Aurora**：AWS 自家相容 MySQL/PostgreSQL 的資料庫，資料自動在**單一 Region 內 3 個 AZ 各存 2 份（共 6 份）**，天生高耐久、高可用，考題若強調「最高可用的關聯式資料庫」常指向它。
- **DynamoDB**：全託管 NoSQL，資料預設就跨多個 AZ。需要**跨 Region**高可用與就近低延遲時，用 **<Term en="Global Tables" desc="DynamoDB 跨多個地區自動雙向複寫的設定，讓多地讀寫都低延遲。">全域表（Global Tables）</Term>**。
- **S3**：耐久性高達 **99.999999999%（11 個 9）**，資料自動跨 AZ 存放；要跨 Region 保一份（法遵或異地備援）用 **<Term en="Cross-Region Replication" desc="S3 自動把物件複製到另一個地區的儲存貯體。">跨區複寫（CRR）</Term>**。
- **EFS vs EBS**：多台 EC2 要共用同一批檔案、又要跨 AZ → **EFS**；單台機器的系統碟/資料碟 → **EBS**（記得它綁單一 AZ）。

## 實務應用：不只是考試

<Scenario title="真實情境：你的電商在半夜促銷突然掛掉">

半夜大促，資料庫所在的機房（AZ）突然斷電，整個網站下單失敗、客訴灌爆。老闆問：「為什麼一個機房出事，整間店就垮？」——如果當初 RDS 有開 **Multi-AZ**，備援會在幾分鐘內自動接手，這場災難根本不會發生。另外白天報表查詢老是把資料庫拖垮，則該加**唯讀複本**把查詢分流出去。下面帶你把 Multi-AZ 開起來。

</Scenario>

### 🛠️ 動手做：幫 RDS 開啟 Multi-AZ 高可用

1. 登入 AWS 主控台 → 搜尋 `RDS` → 進入服務 → **建立資料庫**
2. 引擎選 **MySQL**（或 PostgreSQL）→ 範本選 **開發/測試**（練習用，省錢）
3. 在「**可用性與耐久性**」區塊，選 **建立待命執行個體（Multi-AZ deployment）**
4. 執行個體大小選 `db.t3.micro`（免費方案適用），設定帳密 → **建立資料庫**
5. 建好後進入資料庫詳情，可看到 **Multi-AZ：是**，以及一個固定的**端點（Endpoint）**——應用程式永遠連這個端點，failover 後也不用改。
6. 想驗證？在主控台對資料庫點 **動作 › 重新開機**，勾選 **使用容錯移轉重新開機**，觀察它自動切到另一個 AZ。

<Cost>

Multi-AZ 因為要多養一台待命備援，費用約為**單 AZ 的兩倍**。練習完務必把測試資料庫**刪除（Delete）**，否則即使閒置也會持續計費。唯讀複本同樣是「多一台=多一份錢」。真的要省，開發環境用單 AZ，只在正式環境開 Multi-AZ。

</Cost>

:::warning[🚑 實務常見錯誤]
- **把唯讀複本當高可用用**：它是非同步、不會自動 failover 的，主庫掛了它不會自動接手。要高可用請用 Multi-AZ，別搞混。
- **以為 EBS 能跨 AZ 掛載**：EBS 綁死建立時的那個 AZ，EC2 若在別的 AZ 根本掛不上。要跨 AZ 共享用 EFS。
- **只開 Multi-AZ 就以為萬無一失**：Multi-AZ 防的是「機房級」故障，不能取代**備份**（防誤刪、防邏輯錯誤）。兩者要並用。
:::

<Refs>

- [AWS 官方文件：RDS 多可用區部署（Multi-AZ）](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZ.html)
- [RDS 唯讀複本（Read Replicas）](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ReadRepl.html)
- [Amazon EFS 使用指南](https://docs.aws.amazon.com/efs/latest/ug/whatisefs.html)
- [S3 跨區複寫（Replication）](https://docs.aws.amazon.com/AmazonS3/latest/userguide/replication.html)

</Refs>

## 下一步

- ⚡ 快速複習：[Domain 2 重點速記 / 閃卡](/saa/domain-2/flashcards)
- ✍️ 測試自己：[Domain 2 原創練習題](/saa/domain-2/quiz)
- 📖 下一個領域：[Domain 3：設計高效能的架構](/saa/domain-3/)
