---
sidebar_position: 5
title: 資料庫與網路成本：挑對計費模式，省下長期開銷
---

# 資料庫與網路成本：挑對計費模式，省下長期開銷

> 資料庫與網路，是帳單裡最容易「不知不覺就變貴」的兩塊。本篇帶你搞懂資料庫怎麼依「負載穩不穩定」挑計費模式，以及網路傳輸費從哪裡偷偷流掉、怎麼堵住。這是 Domain 4 很實用、也常考的成本最佳化題。

<Vocab title="📌 先認識這篇會出現的名詞（完全沒碰過也能懂）">

- **隨需（On-Demand）**：**用多少付多少、不用先承諾**。開機就計費、關掉就停——最彈性，但單價最貴。
- **預留執行個體（Reserved Instance）**：**先承諾用 1 年或 3 年，換一個大折扣**。適合「反正一定會一直用」的穩定負載。
- **無伺服器（Serverless）**：資料庫容量**由 AWS 依用量自動伸縮**，忙時放大、閒時縮小甚至接近零，你不用自己猜要開多大。
- **讀取複本（Read Replica）**：把資料庫**複製一份出來專門分攤查詢**，讀取變快，但多一份就多一份錢。
- **NAT 閘道（NAT Gateway）**：讓私有子網路裡的機器**能連外網、但外網連不進來**的出口；它按小時＋按流量雙重計費。
- **資料傳輸費（Data Transfer）**：資料**流出 AWS、或跨可用區／跨區域**搬動時收的「過路費」。進來多半免費，出去與橫向搬動才貴。

</Vocab>

:::note[💬 閱讀小提示]
文章裡只要看到帶<Term desc="像這樣！滑鼠移到有虛線的名詞上（手機點一下），就會跳出白話解釋。">虛線底線的名詞</Term>，把滑鼠移上去就會跳出白話解釋。所有名詞也都整理在 [名詞與服務對照表](/glossary)。
:::

## 為什麼需要它？先講一個帳單被咬一口的例子

假設你的電商網站，資料庫跑在 <Term en="Amazon Relational Database Service" desc="AWS 代管的關聯式資料庫服務，支援 MySQL、PostgreSQL 等引擎，底層伺服器由 AWS 維運。">RDS</Term> 上，用隨需計費，一開就是整年不停。流量其實很穩定，但你一直用「最彈性、最貴」的隨需價在付——等於住了一整年，卻天天用「一晚一晚」的旅館日租在算，白白多花三、四成。

更慘的是網路那一塊。你的應用程式在私有子網路，要去抓 <Term en="Simple Storage Service" desc="AWS 的物件儲存服務，常用來放檔案、備份、靜態資源。">S3</Term> 的檔案，所有流量都繞過 <Term en="NAT Gateway" desc="讓私有子網路的機器能主動連外網的出口閘道，按小時加按處理流量計費。">NAT 閘道</Term> 出去——結果 NAT **每小時收錢、每 GB 再收一次處理費**，一個月下來傳輸費比你想像的高好幾倍。

這兩筆錢，問題都不是「用了什麼服務」，而是**計費模式與流量路徑沒挑對**。選型的核心，就是依「負載穩不穩定」挑資料庫計費模式，並讓流量走「最便宜的那條路」。

## 資料庫成本：先問「負載穩不穩定」

資料庫最大的省錢關鍵，就是一句話：**穩定可預測的負載用「承諾換折扣」，變動或不可預測的負載用「按用量自動伸縮」。** 猜反了就是浪費。

- **RDS／<Term en="Amazon Aurora" desc="AWS 自家的雲端原生關聯式資料庫，相容 MySQL 與 PostgreSQL，效能與可用性更高。">Aurora</Term> 買預留執行個體（Reserved Instance）**：負載一整年都很穩、確定會持續用，先承諾 1 年或 3 年，單價立刻打折（最多可省六、七成），適合正式環境的主資料庫。
- **Aurora Serverless v2**：負載**忽高忽低、間歇、或半夜幾乎沒人用**時最划算——它會**依實際用量自動放大縮小**，閒置時縮到很小，等於「沒人用就幾乎不收錢」。開發測試環境、季節性尖峰、不常用的內部系統特別適合。
- **讀取複本（Read Replica）要權衡**：加讀取複本能分攤大量查詢、讓讀取更快，但**每多一份複本就多一份執行個體費用**。只有在「讀取遠多於寫入、而且單一資料庫扛不住」時才加，不要為了保險亂加。
- **選對儲存與備援層級**：備份保留天數、多可用區（Multi-AZ）高可用都會加錢。正式庫該開 Multi-AZ 換取高可用；但開發測試庫就不必，能省一半。

<Term en="Amazon DynamoDB" desc="AWS 的無伺服器 NoSQL 資料庫，毫秒級延遲，容量與吞吐可隨需或預置。">DynamoDB</Term> 則有兩種計費模式，一樣看負載挑：

- **隨需模式（On-Demand）**：流量**不可預測、忽然暴衝也不怕**，完全不用猜容量，AWS 自動扛。新上線、流量未知、或尖峰極難預測時選它。
- **預置容量＋Auto Scaling**：流量**相對穩定、可預測**時更省——你預先設定讀寫容量單位，再用 Auto Scaling 在範圍內自動微調，單價比隨需低很多。

### 白話深入：三種資料庫計費，為什麼這樣選？優缺點與何時別用

名詞你大概都聽過，但真正難的是「**為什麼挑這個、而不是旁邊那個**」。下面把每種計費攤開講清楚。

**RDS／Aurora 預留執行個體（Reserved Instance）——先承諾換折扣**

- **為什麼是它**：正式環境的主資料庫，幾乎都是「一開就整年不關」的穩定負載。既然反正會一直用，就沒道理付「最彈性、最貴」的隨需價。預留的本質是「你先答應用 1 年或 3 年，AWS 給你最多六、七成折扣」。
- **優點**：單價最低、折扣最深；對已經在跑的隨需資料庫，買下去帳單立刻降，不用改任何架構。
- **缺點**：**綁約**——承諾期內就算你把資料庫關掉、或流量驟降用不到，錢照付。選錯機型（規格太大）也退不掉。
- **何時反而別用**：負載會大起大落、或這個環境**半年後可能就收掉**（短期專案、臨時環境）。綁 1 年卻用 3 個月，省的折扣遠不如浪費的月費。
- **預付選項**：全預付（All Upfront）折扣最深、部分預付次之、不預付（No Upfront）最淺但現金壓力最小——現金充足選全預付最省。

**Aurora Serverless v2——按用量自動伸縮**

- **為什麼是它**：有些負載「忙起來很忙、閒起來幾乎沒人」（開發測試、內部後台、季節性尖峰）。你若固定開一台夠大的，閒置時整台在空轉燒錢；開太小又怕尖峰扛不住。Serverless v2 讓 AWS 依實際用量，以 **ACU（Aurora 容量單位）** 為刻度平滑地放大縮小，你只付實際用到的量。
- **優點**：閒置成本極低（可縮到 0.5 ACU）、尖峰自動撐住、完全不用自己猜容量或手動調整。
- **缺點**：**單位用量的單價比固定執行個體貴**——如果負載其實一直滿載，Serverless 反而比預留貴一截。
- **何時反而別用**：負載穩定又持續接近滿載時（這種就該用預留／預置）。把「一直很忙」的正式主庫丟 Serverless，等於用貴的單價付穩定的量，花更多錢。

**DynamoDB：On-Demand vs Provisioned——同一張表、兩種收錢法**

- **On-Demand（隨需）為什麼存在**：流量**完全猜不到**（新產品剛上線、會被行銷活動瞬間引爆）時，你根本估不出該預置多少容量。隨需讓 AWS 自動扛任何尖峰，你只按實際讀寫次數付錢，**永遠不會因為估太低而被節流（throttle）**。代價是每次讀寫的單價較高。
- **Provisioned（預置）＋Auto Scaling 為什麼更省**：流量**相對穩定、估得準**時，你預先買好讀寫容量單位（RCU／WCU），單價可比隨需低到約 1/7；再用 Auto Scaling 在你設的上下限之間自動微調，兼顧省錢與不被節流。
- **怎麼選的簡單判準**：估不準、怕尖峰 → 隨需先上線觀察；跑一陣子看出流量型態、估得準了 → 切回預置省錢。兩種模式**每天可互切一次**，所以常見做法是「隨需起步、穩定後轉預置」。

<Analogy title="🍜 生活比喻：資料庫計費就像訂餐廳包廂 vs 單點 vs 吃到飽伸縮">

- **預留執行個體 = 包年包廂**：你跟餐廳簽「我整年每週都來」，老闆給你一個超低價。前提是你真的會一直來；沒來照付，就浪費了。
- **Aurora Serverless v2 = 自動伸縮的桌子**：來一個人擺一副碗筷，來十個人自動加桌，散場就收走。人少的時段幾乎不花錢，不用一開始就包整間。
- **DynamoDB 隨需 = 單點**：想吃多少點多少，再多人湧進來廚房也立刻跟上；單價貴一點，但不怕突然客滿。
- **DynamoDB 預置容量 = 先講好幾人份**：你確定每天大概來這麼多人，先訂好份數換便宜價，臨時多幾人（Auto Scaling）還能小幅加菜。

</Analogy>

:::tip[💡 考試重點：資料庫成本關鍵字對應]
- 題目講 **「負載穩定、可預測、長期持續」「要降 RDS／Aurora 成本」** → **預留執行個體（Reserved Instance）**
- 題目講 **「負載變動、間歇、半夜幾乎沒流量」「不想自己調容量」** → **Aurora Serverless v2**
- 題目講 **「流量不可預測、無法預估尖峰」（DynamoDB）** → **隨需模式（On-Demand）**
- 題目講 **「流量穩定可預測」「想把 DynamoDB 成本壓到最低」** → **預置容量 ＋ Auto Scaling**
- 看到 **「讀取遠多於寫入、要分攤查詢」** → **讀取複本（Read Replica）**，但記得它會加成本
:::

## 網路成本：堵住偷偷流掉的傳輸費

網路費的隱形殺手有三個：**NAT 閘道的雙重計費、沒必要繞出去的流量、以及跨可用區／跨區域的搬運費。** 一個個堵。

### NAT 閘道 vs NAT 執行個體

私有子網路的機器要連外網，得走 NAT。兩種做法：

- **NAT 閘道（NAT Gateway）**：AWS 全代管、自動高可用、免維運，但**按小時＋按處理的每 GB 雙重收費**。流量大時，那筆「每 GB 處理費」會很有感。
- **NAT 執行個體（NAT Instance）**：自己開一台 EC2 當 NAT，**沒有每 GB 處理費**，小流量或要省錢時單價較低；但你要自己顧它的高可用、修補、擴充，而且效能受機型限制。

考試預設答案通常是 NAT 閘道（省維運），但若題目強調「**成本敏感、流量小、可接受自行維運**」，NAT 執行個體才是省錢解。

### 用 VPC 端點省下 NAT 與傳輸費

這是最常考的省錢招：如果你的機器是去存取 **S3 或 DynamoDB**，根本不需要繞 NAT 出公網——用 <Term en="VPC Endpoint" desc="讓 VPC 內的資源不經公網、直接私下連到 AWS 服務的入口，可省 NAT 與傳輸費。">VPC 端點（VPC Endpoint）</Term> 讓流量**走 AWS 內部私有通道**直達：

- **閘道端點（Gateway Endpoint）**：專給 **S3 與 DynamoDB**，**完全免費**，還省掉 NAT 的處理費與傳輸費。VPC 內大量存取 S3／DynamoDB，幾乎必開。
- **介面端點（Interface Endpoint）**：給其他服務（如 SQS、SNS），底層是 PrivateLink，按小時＋按流量計費，但仍常比繞 NAT 便宜，且更安全。

### VPN vs Direct Connect

公司機房要連到 AWS，兩條路：

- **Site-to-Site VPN**：走公網加密通道，**前期成本低、幾分鐘就通**，但頻寬與延遲受公網影響。偶發、小流量、臨時需求選它。
- **<Term en="AWS Direct Connect" desc="從你的機房拉一條專線實體連到 AWS，頻寬穩定、延遲低，大流量下傳輸單價較便宜。">Direct Connect</Term>（專線）**：拉一條實體專線直連 AWS，**前期成本與建置時間都高**，但頻寬穩定、延遲低，而且**大流量下每 GB 傳輸單價明顯比走公網便宜**。長期、穩定、大流量的混合雲，Direct Connect 長期更省。

### 跨可用區／跨區域流量費別忽略

同一區域內**跨可用區（AZ）**互傳、以及**跨區域（Region）**複製資料，都會收傳輸費。把頻繁互動的元件放在同一個 AZ、或善用區域內私有流量，能省下一筆平常看不見的錢。

### 白話深入：網路費到底從哪裡來、怎麼堵

很多人以為「資料進出都要錢」，其實收費方向很有規律，抓住規律就知道該省哪裡：

- **進來（Inbound）幾乎免費**：資料從外面流進 AWS，多半不收傳輸費。所以「上傳」通常不是帳單痛點。
- **流出網際網路（Internet egress）最貴**：資料從 AWS 送出去給使用者、送到別家雲或你的機房，是最大一筆。**用 <Term en="Amazon CloudFront" desc="AWS 的內容傳遞網路（CDN），把內容快取到全球節點，就近回應使用者並降低源站流出費。">CloudFront</Term>（CDN）擋在前面**，把內容快取到邊緣節點就近回應，不但快，流出單價也比直接從源站送便宜。
- **跨可用區（Cross-AZ）**：同區域內兩個 AZ 之間互傳，**來回兩個方向都各收一次**。資料庫主備、應用層打到另一個 AZ 的資料庫，每一筆都在累積。
- **跨區域（Cross-Region）**：複製到另一個 Region（如異地備援、全球多區部署）單價更高。不是不能做，而是要知道「這是為了可用性付的錢」，別無意間把流量繞到別的 Region。
- **同一 AZ 內、用私有 IP**：通常免費或極低。所以把頻繁互打的元件收在同一個 AZ、走私有通道，是最直接的省法。

**省網路費的三個主力招數**：① 面向使用者的流出 → 掛 CloudFront；② VPC 內存取 S3／DynamoDB → 開 Gateway Endpoint 繞過 NAT；③ 架構上盡量讓頻繁互動的元件同區同 AZ、用私有 IP。

:::info[🔑 一個最容易算錯的方向]
**NAT 閘道的「處理費」跟「資料傳輸費」是兩筆、會疊加。** 流量經過 NAT，先被收一次「每 GB 處理費」，若又是流出網際網路還要再收一次「流出傳輸費」。所以同一包流量可能被咬兩口——這也是為什麼「能用 Gateway Endpoint 就別繞 NAT」省得特別有感。
:::

## 資料庫與網路成本決策圖解

<div className="flow">
  <div className="flow-node">我要省哪一塊？</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">資料庫負載穩定？→ 預留執行個體／預置容量</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">負載變動/間歇？→ Aurora Serverless／DynamoDB 隨需</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">VPC 內大量存取 S3/DynamoDB？→ Gateway Endpoint</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">大量穩定混合雲流量？→ Direct Connect</div>
</div>

*圖：先分清「資料庫」還是「網路」，再問「負載穩不穩」「流量走哪條路」，就能一路收斂到最省的選擇。*

## 實務應用：不只是考試

<Scenario title="真實情境：老闆說『資料庫跟網路費一直往上爬，砍一砍』">

你查帳單發現兩個洞。第一，正式環境的 Aurora 用隨需計費跑了整年，負載其實一直很穩定——這等於放著六成折扣不拿。第二，應用程式在私有子網路，大量讀寫 S3，所有流量全繞 NAT 閘道出去，光是每 GB 處理費就吃掉一大筆。

解法：**穩定的 Aurora 改買 1 年期預留執行個體**，單價立刻打折；**存取 S3 的流量改走 S3 Gateway Endpoint**，直接繞過 NAT、免處理費又免傳輸費。兩刀下去，資料庫與網路帳單一起降。下面帶你把 S3 Gateway Endpoint 開起來。

</Scenario>

### 🛠️ 動手做：建一個 S3 Gateway Endpoint 繞過 NAT

1. AWS 主控台搜尋 `VPC` → 左側選 **端點（Endpoints）** → **建立端點**。
2. 服務類別選 **AWS 服務**，搜尋並選 `com.amazonaws.<區域>.s3`，類型確認是 **Gateway**。
3. **VPC** 選你的 VPC；**路由表** 勾選私有子網路用的那張（它會自動加一條指向 S3 的路由）。
4. 原則（Policy）先用 **完整存取** 測試，確認通了之後再收緊。按 **建立端點**。
5. 到私有子網路裡的 EC2，用 CLI 抓一次 S3 檔案，確認走的是端點而不是 NAT（流量不再出公網）。
6. 觀察幾天帳單的 NAT 處理費與傳輸費是否下降，確認有效後就固定下來。

```bash
# 建立一個指向 S3 的 Gateway Endpoint，並掛到私有子網路的路由表
$ aws ec2 create-vpc-endpoint \
    --vpc-id vpc-你的VPC \
    --service-name com.amazonaws.ap-northeast-1.s3 \
    --route-table-ids rtb-你的私有路由表
```

<Cost>

**Aurora Serverless v2** 依實際用量計費，閒置時縮得很小，變動負載常常比固定開一台便宜；但**流量穩定可預測時，預留執行個體或預置容量通常更省**，別一律無腦選 Serverless。**S3／DynamoDB 的 Gateway Endpoint 完全免費**，還省掉 NAT 的每 GB 處理費與傳輸費——是 CP 值最高的一招。**NAT 閘道**只要開著就按小時收，加上每 GB 處理費，練習完記得刪除。**Direct Connect** 前期成本高，只有在大量且長期的流量下才攤得回來。

</Cost>

:::warning[🚑 實務常見錯誤]
- **穩定負載還在用隨需**：確定會長期跑的 RDS／Aurora 不買預留執行個體，等於放著大折扣不拿。
- **把什麼都丟 Aurora Serverless**：流量明明穩定可預測，用 Serverless 反而比預留／預置貴，選錯方向。
- **讀取複本亂加**：寫入為主的庫硬加讀取複本，查詢沒變快卻多付一份錢。
- **存取 S3／DynamoDB 還繞 NAT**：忘了開 Gateway Endpoint，白白被收 NAT 處理費與傳輸費（而且 Endpoint 是免費的）。
- **忽略跨可用區／跨區域流量費**：把頻繁互動的元件拆到不同 AZ 或 Region，傳輸費悄悄累積卻查不到來源。
- **忘了 NAT 的「處理費」跟「流出傳輸費」會疊加**：以為刪不掉的只是每小時固定費，其實大流量下「每 GB 處理費」才是大頭，又流出網際網路還再疊一層傳輸費。能走 Gateway Endpoint 的流量全繞過去才是真省。
- **DynamoDB 預置容量估不準**：估太低 → 一遇尖峰就被**節流（throttle）**，使用者看到 `ProvisionedThroughputExceededException`、請求失敗；估太高 → 容量長期閒置白付錢。拿不準就先用隨需跑一兩週看出流量型態，再切預置並設好 Auto Scaling 上下限。
- **Aurora Serverless 的冷啟動與成本盲點**：v2 雖可縮到很小（0.5 ACU），但**最小容量不是零**，長時間掛著仍有底費；若從近乎停機被喚醒放大，也有短暫的擴容延遲。更大的雷是「負載其實一直滿載還用 Serverless」——單位單價較高，整月算下來比預留貴。別把「省錢」跟「無腦用 Serverless」畫等號。
- **把跨 Region 複製當免費的保險**：異地備援、Global Table、跨區快照複製都在持續產生跨區傳輸費。要做可以，但要清楚這是為可用性付的帳，別無意識地開著。
:::

<Scenario title="真實情境：DynamoDB 帳單暴增，追出來是『估太高的預置容量』">

你的購物車用 DynamoDB，上線初期用隨需模式，一切正常。某次為了「保險」改成預置容量，怕尖峰不夠就把 RCU／WCU 設得很大，又沒開 Auto Scaling。

**預期結果（出問題時你會看到的）**：月中帳單比上個月高出一截，但 CloudWatch 的 `ConsumedReadCapacityUnits`／`ConsumedWriteCapacityUnits` 遠低於你預置的量——代表你**買了一大塊容量卻幾乎沒用到**，差額全是浪費。

**解法與預期結果（改好後）**：先回隨需觀察兩週，記下實際讀寫的平均與尖峰；再切回預置，把基準容量設在略高於平均、並開 **Auto Scaling**（目標使用率設約 70%），讓尖峰時自動往上、離峰往下。改完後你應看到：帳單回落、`Consumed` 曲線貼近 `Provisioned` 曲線（不再有大片閒置），且尖峰時沒有 `ProvisionedThroughputExceededException` 的節流錯誤。

</Scenario>

<Refs>

- [Amazon RDS 預留執行個體](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithReservedDBInstances.html)
- [Amazon Aurora Serverless v2 使用者指南](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.html)
- [DynamoDB 讀寫容量模式（隨需與預置）](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.ReadWriteCapacityMode.html)
- [VPC 端點（Gateway 與 Interface）](https://docs.aws.amazon.com/vpc/latest/privatelink/concepts.html)
- [NAT 閘道](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html)
- [AWS Direct Connect 使用者指南](https://docs.aws.amazon.com/directconnect/latest/UserGuide/Welcome.html)

</Refs>

## 下一步

- ⚡ 快速複習：[Domain 4 重點速記 / 閃卡](/saa/domain-4/flashcards)
- ✍️ 測試自己：[Domain 4 原創練習題](/saa/domain-4/quiz)
- 📖 下一篇：[成本最佳化架構決策](/saa/domain-4/cost-optimization-decisions)
