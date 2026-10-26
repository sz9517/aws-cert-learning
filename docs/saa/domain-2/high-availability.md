---
sidebar_position: 1
title: 高可用與多可用區
---

# 高可用：讓系統「一台壞了也不會掛」

> 這是 Domain 2 的地基。先搞懂 AWS 的地理架構（Region／AZ／Edge），後面的負載平衡、自動擴展、備援才會通。

<Vocab title="📌 先認識這篇會出現的名詞（完全沒碰過也能懂）">

- **Region（區域）**：AWS 在**某個地理地點**蓋的一整組機房，例如「東京」「新加坡」「美國維吉尼亞北部」。你把服務開在哪個 Region，資料就放在那。
- **Availability Zone（AZ，可用區）**：一個 Region 裡**彼此實體隔離的機房群**（通常 3 個以上）。一個 AZ 淹水停電，其他 AZ 不受影響。
- **Edge Location（邊緣節點）**：散佈全球、離使用者很近的**小據點**，拿來做內容快取（CloudFront）加速，不是拿來跑你的主機。
- **SPOF（Single Point of Failure，單點故障）**：系統裡「**只要它一壞、整個服務就停**」的那個環節。高可用的目標就是消滅它。

</Vocab>

:::note[💬 閱讀小提示]
文章裡只要看到帶<Term desc="像這樣！滑鼠移到有虛線的名詞上（手機點一下）就會跳出白話解釋。">虛線底線的名詞</Term>，把滑鼠移上去就會跳出白話解釋。所有名詞也都整理在 [名詞與服務對照表](/glossary)。
:::

## 一句話先懂高可用

**高可用（High Availability，HA）** 就是：**設計一套「死了一台，服務照跑」的系統**。做法的核心只有一句話——**不要把雞蛋放在同一個籃子裡**，而在 AWS，這個「籃子」就是**可用區（AZ）**。

<Analogy title="🍔 生活比喻：把 AWS 想成一家連鎖餐廳">

- **Region（區域）** = 一座**城市**（例如「台北」）。你決定在台北開店，食材、客人、營運都在台北。
- **Availability Zone（AZ）** = 同一座城市裡**不同棟、分開供電供水的分店**。信義店跳電，大安店照常營業。
- **Edge Location（邊緣節點）** = 街口的**外送取餐櫃**，離客人最近、只放熱門餐點（快取），不是廚房。

把廚房（伺服器）只開在信義店一棟 → 那棟一停電就全停。把廚房同時開在信義店和大安店（跨 AZ）→ 一棟掛了另一棟接手，這就是高可用。

</Analogy>

## Region vs AZ vs Edge：三層地理架構

| 層級 | 是什麼 | 數量 | 你拿它做什麼 |
| --- | --- | --- | --- |
| **Region** | 一個地理區域的整組機房 | 全球數十個 | 選一個離使用者近、符合法規的區域放服務 |
| **AZ** | Region 內實體隔離的機房群 | 每個 Region 通常 3+ | **跨多個 AZ 部署**，達成高可用 |
| **Edge Location** | 全球各地的快取小據點 | 數百個 | 用 CloudFront 把內容快取到離使用者最近處 |

:::tip[💡 考試重點]
- 題目出現「**高可用（Highly Available）**」「**容忍單一機房故障**」→ 答案方向一定是**把資源部署到多個 AZ**（Multi-AZ）。
- **只開在單一 AZ**＝不符合高可用，是常見的錯誤選項。
- 題目強調「**全球使用者、降低延遲**」→ 方向是**多個 Region** 或 **CloudFront（Edge）**，而不是加 AZ。
- AZ 之間是**低延遲專線互連**，所以跨 AZ 同步複製（例如資料庫 Multi-AZ）是可行且常見的。
:::

## 運作流程圖解

<div className="flow">
  <div className="flow-node">使用者請求</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">負載平衡器</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">AZ-a 的伺服器</div>
  <div className="flow-arrow">＋</div>
  <div className="flow-node">AZ-b 的伺服器</div>
</div>

*圖：同一份服務同時跑在兩個 AZ。AZ-a 整個掛掉，流量自動全導向 AZ-b，使用者幾乎無感。*

## 白話再想一次：為什麼非得跨多個 AZ？

<Analogy title="🔌 單點故障到底多可怕？用家裡的插座想">

想像你家所有電器——冰箱、電腦、路由器——全插在**同一個延長線**上。這條延長線只要燒了，全家電器一起斷電。這條延長線就是你的 **SPOF（單點故障）**：它一壞，後面全倒，再多電器也沒用。

把服務全開在同一個 AZ，就是把所有電器插在同一條延長線上。那個 AZ 跳電（或網路斷、或整棟維護），你**開再多台 EC2 都一起陪葬**。跨 AZ 的意義，就是把電器分插到**兩條來自不同電箱的延長線**：一條燒了，另一條還撐著。

</Analogy>

重點不是「開幾台機器」，而是「這些機器**會不會一起死**」。高可用的本質就是：**找出整條鏈路上每一個「它一壞就全停」的環節，把它變成至少兩份、且分散在不同 AZ**。常見的隱藏 SPOF 包括：只有一台的資料庫、只放在一個 AZ 的 NAT Gateway、只有一份的快取節點——它們常被忽略，卻和 EC2 一樣會拖垮整個系統。

## 別搞混：HA、容錯、災難復原

| 名詞 | 白話 | 例子 |
| --- | --- | --- |
| **高可用（HA）** | 壞了能**快速自動恢復**，允許極短暫中斷 | 跨 2 個 AZ，一個壞了另一個接手 |
| **容錯（Fault Tolerance）** | 壞了**完全不中斷**，成本最高 | 同時多份完整運作，零停機 |
| **災難復原（DR）** | 整個 Region 級大災難後的**復原計畫** | 跨 Region 備援（見[備份與災難復原](/saa/domain-2/backup-dr)） |

### 三者差在哪？用「停多久、損失多少」一次看懂

這三個詞考試超愛混在一起考，差別其實就在**允許中斷多久**與**對抗多大的災難**：

- **高可用（HA）** 回答的是：「**一個零件壞了，服務能不能自動頂住、幾乎不中斷？**」它容許**極短暫**的切換時間（例如資料庫 Multi-AZ 容錯移轉通常 1～2 分鐘），對抗的是**單一 AZ / 單一執行個體**等級的故障。做法：同一 Region 內跨 AZ 多開、前面放負載平衡器、資料庫開 Multi-AZ。
- **容錯（Fault Tolerance）** 把標準再拉高：「**壞了要連那 1～2 分鐘都不能中斷、使用者完全無感。**」它要求同時有**多份完整運作的副本**在跑，成本最高。白話說，HA 是「跌倒後能馬上爬起來」，容錯是「根本不讓你跌倒」。
- **災難復原（DR）** 層級完全不同：它對抗的是「**整個 Region 都沒了**」（天災、大規模斷網）這種極端事件，靠的是**跨 Region** 的備援與復原計畫。衡量 DR 的兩個關鍵指標是 <Term en="Recovery Time Objective" desc="災難後，服務要在多久內恢復。越短越貴。">RTO（可容忍的恢復時間）</Term> 與 <Term en="Recovery Point Objective" desc="災難後，最多能接受遺失多久的資料。越短越貴。">RPO（可容忍的資料遺失量）</Term>。

:::info[🔑 一句話記住三者的分界]
**HA／容錯**處理的是「**一個 Region 內**」的故障（跨 AZ 就能解決）；**DR** 處理的是「**整個 Region 掛掉**」的故障（必須跨 Region）。考題看到「**容忍單一 AZ 故障**」想 HA／Multi-AZ；看到「**整個區域發生天災**」「**RTO／RPO**」想 DR／跨 Region。
:::

## 取捨：多 AZ vs 多 Region，什麼時候該升級？

跨 AZ 能解決絕大多數高可用需求，而且**便宜、低延遲、設定簡單**，應該是你的**預設做法**。跨 Region 則是明顯更貴、更複雜的升級，只在特定需求下才值得。兩者不是二選一，而是「先把多 AZ 做好，真有需要再加多 Region」。

| 比較點 | 多 AZ（同一 Region 內） | 多 Region（跨區域） |
| --- | --- | --- |
| **主要解決** | 單一機房故障 → **高可用** | 整個區域災難、全球延遲 → **DR／全球化** |
| **延遲** | AZ 間是低延遲專線，**可同步複製**（如 RDS Multi-AZ） | 跨 Region 延遲高（數十～上百毫秒），通常只能**非同步複製** |
| **成本** | 低（跨 AZ 流量費很少） | 高（跨 Region 傳輸費、兩地各一份資源） |
| **複雜度** | 低，很多服務一個開關就開（Multi-AZ） | 高，要處理資料一致性、流量導向、災難演練 |
| **典型場景** | 一般正式環境的標配 | 法規要求異地備援、全球使用者就近存取、對抗區域級災難 |

:::tip[💡 考試重點：怎麼選]
- 題目只說「**高可用、容忍機房故障**」，成本敏感 → 選 **多 AZ**（別一看到「高可用」就跳去跨 Region，那通常是過度設計、成本陷阱）。
- 題目出現「**整個區域中斷也要能服務**」「**法規要求資料異地保存**」「**全球使用者低延遲**」→ 這才需要 **多 Region**（或搭配 CloudFront、Route 53 延遲路由）。
- 題目強調「**資料要即時同步、不能遺失**」→ 想 **同一 Region 內 Multi-AZ 同步複製**；跨 Region 多半是非同步，會有 RPO（少量資料遺失）。
:::

## 實務應用：不只是考試

<Scenario title="真實情境：你的購物網站上線前一天">

主管問：「如果 AWS 某個機房半夜跳電，我們的網站會不會整個掛掉？」——如果你的 EC2 全開在同一個 AZ，答案是「會」。正確做法：把 EC2 分散到至少 2 個 AZ，前面放負載平衡器。下面帶你先看看自己手上有哪些 AZ 可用。

</Scenario>

### 🛠️ 動手做：看看你的 Region 有哪些 AZ

1. 登入 AWS 主控台 → 右上角確認目前 **Region**（例如「亞太區域（東京）ap-northeast-1」）
2. 搜尋列輸入 `EC2` → 進入 EC2 服務
3. 左側最下方點 **EC2 儀表板**，或建立執行個體時展開「網路設定」，就能看到此 Region 可選的**可用區（如 ap-northeast-1a／1c／1d）**
4. 用 CLI 也能一行列出：

```bash
# 列出目前 Region 的所有可用區
$ aws ec2 describe-availability-zones --query "AvailabilityZones[].ZoneName"
[
    "ap-northeast-1a",
    "ap-northeast-1c",
    "ap-northeast-1d"
]
```

### 🛠️ 動手做：把資料庫從單點變成高可用（RDS Multi-AZ）

最常見的隱藏 SPOF 就是「**只有一台的資料庫**」。EC2 開再多台，全部指向同一台資料庫，那台一掛照樣全站崩。RDS 的 **Multi-AZ** 只要一個開關就能補上這個洞：AWS 會在**另一個 AZ** 自動維護一份**同步複製**的待命副本，主庫故障時自動容錯移轉。

```bash
# 建立 RDS 時直接開 Multi-AZ（重點是 --multi-az）
aws rds create-db-instance \
  --db-instance-identifier myapp-db \
  --db-instance-class db.t3.micro \
  --engine mysql \
  --allocated-storage 20 \
  --master-username admin \
  --master-user-password "ChangeMe123!" \
  --multi-az

# 既有的單 AZ 資料庫，也能一行改成 Multi-AZ
aws rds modify-db-instance \
  --db-instance-identifier myapp-db \
  --multi-az \
  --apply-immediately
```

**預期結果**：`describe-db-instances` 查詢會看到 `"MultiAZ": true`，且主控台的資料庫詳情頁會顯示主副本在不同的 AZ（例如主庫在 `1a`、待命在 `1c`）。之後若主庫所在 AZ 故障，RDS 會自動把流量切到待命副本，而你的應用程式**連線字串完全不用改**（連的是 endpoint，不是某台機器的 IP）——這就是「死了一台、服務照跑」落在資料庫上的具體樣子。

:::info[🔑 容易混：Multi-AZ ≠ 讀取副本（Read Replica）]
**Multi-AZ** 的待命副本是為了**高可用**，平時**不能讀寫**、純待命，故障才頂上，走**同步**複製。**讀取副本（Read Replica）** 是為了**分攤讀取負載／效能**，平時**可以讀**，走**非同步**複製，**不保證**自動容錯移轉。考題問「高可用／自動故障切換」選 Multi-AZ；問「分擔大量讀取流量」選 Read Replica。別把兩者混為一談。
:::

<Cost>

**開在幾個 AZ 本身不另外收費**，但要注意：**跨 AZ 傳輸的資料**會產生少量流量費。這是高可用該付的「保險費」，通常遠低於一次當機的損失。另外提醒：**RDS Multi-AZ 會收大約兩倍的資料庫費用**（因為多維護一份待命副本），而**跨 Region** 的備援還要再加跨區傳輸費與第二份資源成本——這就是為什麼「先多 AZ，真有需要再多 Region」才是省錢又務實的順序。練習用的 EC2／RDS 記得用完**終止（Terminate／Delete）**，並善用**免費方案（Free Tier）**。

</Cost>

:::warning[🚑 常踩雷]
- **以為「開在多 AZ」就自動高可用**：把執行個體丟進不同 AZ **只是第一步**。如果前面沒有負載平衡器把流量自動導走、資料庫沒開 Multi-AZ、健康檢查沒設好，那一個 AZ 掛了流量照樣打到死掉的機器。**多 AZ 是必要條件，不是充分條件**——要搭配 ELB＋Auto Scaling＋Multi-AZ 資料庫，整條鏈路都無單點，才算真的高可用。
- **把狀態（session／檔案）存在單一執行個體上**：使用者登入狀態、上傳的檔案若只存在某一台 EC2 的本機磁碟，那台（或那個 AZ）一掛，資料就沒了，使用者被登出、檔案消失——等於又造出一個 SPOF。狀態要外移到**共用且跨 AZ 的服務**：session 放 **ElastiCache／DynamoDB**，檔案放 **S3**，讓每台 EC2 都變成「可以隨時被換掉」的無狀態機器。
- **單一 NAT Gateway 變成隱藏單點**：很多人把私有子網路對外的 NAT Gateway **只開一個**在某個 AZ。那個 AZ 一掛，**所有 AZ 的私有子網路都連不出去**（更新、呼叫外部 API 全斷），EC2 明明還活著卻對外失聯。正解：**每個 AZ 各放一個 NAT Gateway**，各自路由，才不會一個 AZ 拖垮全部。
- **一看到「高可用」就跳去跨 Region**：跨 Region 貴又複雜，多數高可用需求跨 AZ 就解決了。把單 Region 的高可用問題用跨 Region 來解，是**過度設計＋成本陷阱**。只有「整個區域災難」「法規異地備援」「全球低延遲」才真的需要跨 Region。
- **忽略跨 Region 的成本與延遲**：跨 Region 複製資料要付**跨區傳輸費**、兩地各養一份資源（成本常翻倍），而且跨 Region 延遲高（數十～上百毫秒），通常只能**非同步**複製——意味著災難時會有少量資料遺失（RPO > 0）。別把它當免費的「加強版多 AZ」。
- **把 Edge Location 當成能跑主機的地方**：Edge 只做快取加速，你的應用程式跑在 Region 的 AZ 裡。
:::

<Refs>

- [AWS 官方文件：Regions and Availability Zones（全球基礎架構）](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-regions-availability-zones.html)
- [AWS 全球基礎架構總覽](https://aws.amazon.com/about-aws/global-infrastructure/)
- [AWS 架構完善框架：可靠性支柱](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html)

</Refs>

## 下一步

- ⚡ 快速複習：[Domain 2 重點速記 / 閃卡](/saa/domain-2/flashcards)
- ✍️ 測試自己：[Domain 2 原創練習題](/saa/domain-2/quiz)
- 📖 下一篇：[彈性負載平衡（ELB）](/saa/domain-2/elb)
