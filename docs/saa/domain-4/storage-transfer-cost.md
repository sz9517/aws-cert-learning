---
sidebar_position: 3
title: 資料傳輸成本：看不見卻很貴的隱形帳單
---

# 資料傳輸成本：看不見卻很貴的隱形帳單

> 本篇帶你搞懂 AWS 最容易被忽略、卻常常把帳單撐爆的一環——資料傳輸（Data Transfer）費。你會學到「傳入免費、傳出要錢」「跨 AZ、跨 Region 怎麼算」，以及用 CloudFront、VPC Endpoint 把這筆隱形帳單砍下來的招式。這是 Domain 4「設計成本最佳化」最實用的題型。

<Vocab title="📌 先認識這篇會出現的名詞（完全沒碰過也能懂）">

- **資料傳輸（Data Transfer）**：資料從一個地方「**搬到另一個地方**」。搬進 AWS、搬出 AWS、在 AWS 內部搬，計費規則都不一樣。
- **傳出／出口流量（Egress）**：資料「**往外送**」，尤其是送到網際網路給使用者下載。這通常是**最貴的一段**。
- **傳入／入口流量（Ingress）**：資料「**往內送**」，例如使用者上傳檔案進 AWS。送進來**大多免費**。
- **可用區（AZ, Availability Zone）**：一個 Region 裡**彼此獨立的機房**。同一個 Region 通常有好幾個 AZ。
- **區域（Region）**：AWS 在**世界各地的大型資料中心群**，例如東京、新加坡、維吉尼亞。跨 Region 搬資料最貴。
- **NAT 閘道（NAT Gateway）**：讓私有子網路裡的機器「**借道出去連網際網路**」的裝置，按小時＋按處理的資料量收費。

</Vocab>

:::note[💬 閱讀小提示]
文章裡只要看到帶<Term desc="像這樣！滑鼠移到有虛線的名詞上（手機點一下），就會跳出白話解釋。">虛線底線的名詞</Term>，把滑鼠移上去就會跳出白話解釋。所有名詞也都整理在 [名詞與服務對照表](/glossary)。
:::

## 為什麼要在意傳輸費？先講一個帳單爆炸的例子

假設你做了一個很受歡迎的圖片／影片網站，檔案都放在 <Term en="Simple Storage Service" desc="AWS 的物件儲存服務，拿來放檔案、圖片、影片、備份。">S3</Term>，直接讓全世界的使用者連進來下載。流量越大越開心——直到月底帳單寄來。

你發現 S3 **儲存費**其實很便宜，真正貴的是「**把檔案傳出去給使用者**」那一段<Term en="Egress" desc="資料往外送到網際網路的流量，是 AWS 最常見、也最貴的傳輸費。">出口流量（Egress）</Term>費。每個使用者每次下載，都在替你累積對外傳輸費；熱門檔案被重複下載上萬次，等於這筆費用被乘上萬倍。

傳輸費的可怕在於**它藏在很多地方、平常看不到**：跨 AZ 的資料庫同步、繞經 NAT 閘道的流量、跨 Region 的備份複製……這些都在默默計費。**成本最佳化的一大重點，就是讓資料「少跑遠路、少出口、能走內網就走內網」。**

## 一句話先懂傳輸計費的三大原則

- **傳入免費、傳出要錢**：資料送進 AWS（上傳）幾乎都免費；送出 AWS 到網際網路（下載）才是收費大宗。
- **距離越遠越貴**：同一個 AZ 內部傳輸**免費**；跨 AZ 要錢；跨 Region **更貴**。
- **繞路會多付錢**：流量透過公有 IP 或 NAT 閘道「繞一圈」出去，比走內網（私有 IP、VPC Endpoint）多付處理費與傳輸費。

<Analogy title="🏢 生活比喻：資料傳輸就像寄快遞">

- **傳入免費 = 收件不用錢**：別人把包裹寄來給你（上傳進 AWS），你不用付運費。
- **傳出要錢 = 寄出去要付運費**：你把包裹寄給客戶（下載到網際網路），這段運費才是大頭。
- **距離決定運費 = 同城 vs 跨國**：同一棟大樓送件（同 AZ）免費；送到隔壁城市（跨 AZ）要錢；寄到國外（跨 Region）運費更高。
- **繞路加價 = 走收費道路**：本來能走免費的內部專用道（內網），你卻繞去走高速公路收費站（NAT 閘道／公有 IP），每公斤都加收過路處理費。

</Analogy>

## 為什麼傳輸費是「這樣」收？（搞懂收費邏輯，省錢就有方向）

很多人背下「傳入免費、傳出要錢」卻不知道**為什麼**，於是遇到變化題就答錯。其實背後只有一條原則：**AWS 想把你的資料與運算「留在它的網路裡」**，所以凡是資料**離開 AWS 的網路邊界**、或在內部**跨越獨立設施**，就要付「過路費」。

- **為什麼傳入（上傳）大多免費？** 因為 AWS 很樂意你把資料搬進來——資料進來之後，你就會用它的運算、儲存、分析服務，AWS 賺的是後續這些錢。所以**入口不設門檻**，鼓勵你搬進來。
- **為什麼傳出（下載到網際網路）最貴？** 因為流量一旦出了 AWS 的邊界，就要走 AWS 向電信商買的**對外頻寬**，這是真金白銀的成本；而且資料出去了就不再替 AWS 產生後續消費。所以 egress 是**計費大宗**，也是你最該想辦法壓低的一段。
- **為什麼同 AZ 免費、跨 AZ 卻要錢？** 同一個 AZ 是同一座機房，用私有 IP 直接走內部網路，幾乎零額外成本。但**跨 AZ 等於跨不同機房**，AWS 要在機房之間拉專線、維運這些實體線路，所以**雙向都收費**（送出端和接收端各算一份）。
- **為什麼跨 Region 更貴？** 跨 Region 是跨城市甚至跨國，走的是長途骨幹網路，距離最遠、成本最高，自然最貴。

:::info[🔑 一個最容易混的點：同 Region 不等於免費]
很多人以為「同一個 Region 內就不用錢」，這是**半對半錯**。正確的分界是 **AZ**，不是 Region：
- **同 Region ＋ 同 AZ ＋ 走私有 IP** → 免費。
- **同 Region 但跨 AZ**（例如多 AZ 高可用部署，主資料庫在 AZ-a、副本在 AZ-c）→ **要錢，而且雙向都算**。
高可用設計常常「同一個 Region、分散多 AZ」，這種架構**天生就在產生跨 AZ 傳輸費**，不是設定錯，而是高可用的必要成本。考題常把「同 Region」當誘答，看到跨 AZ 就要想到收費。
:::

## 三招省錢背後的取捨（為什麼選它、什麼時候別用）

省傳輸費的手法不是「越多越好」，每一招都有適用情境與代價。這段把三大招的**為什麼、優缺點、何時別用**講清楚。

### CloudFront：為什麼能省、什麼時候不划算

- **為什麼選它**：熱門的靜態內容（圖片、影片、JS/CSS、下載檔）被重複下載時，快取命中就不回源，省掉 S3／EC2 的對外傳輸費；而且 CloudFront 的 egress 費率通常比 S3／EC2 直接對外便宜。
- **優點**：降對外傳輸費、使用者就近取得速度快、順便擋在源站前面提升安全（搭配 WAF／OAC）。
- **缺點／取捨**：多了一層服務要設定（快取策略、失效、憑證）；**快取命中率低的內容省不到**；對**每次都不同、無法快取的動態內容**（如個人化 API 回應），CloudFront 省不了傳輸費，只是多繞一層。
- **什麼時候別用**：純內部、不對外的流量（那是 VPC Endpoint 的場子）；或內容極少被重複存取（快取沒意義）。

### VPC Endpoint：Gateway vs Interface 怎麼選

- **為什麼選它**：私有子網路的資源要連 AWS 服務時，預設繞 NAT 出網際網路，又慢又貴（NAT 處理費＋對外傳輸費）。Endpoint 讓流量走 AWS 內網，不碰網際網路。
- **Gateway Endpoint**：只支援 **S3 與 DynamoDB**，靠路由表導流，**本身完全免費**。這是「設了就省、幾乎零缺點」的首選。缺點是**只有這兩個服務**能用、只在**同 Region** 內有效、且是透過路由表而非特定私有 IP。
- **Interface Endpoint（PrivateLink）**：支援**很多種 AWS 服務與第三方服務**，在子網路放一張 ENI 用私有 IP 連。優點是通用；**缺點是要按小時＋按 GB 收費**，所以服務種類一多、端點一多，固定費會累積。取捨原則：**S3／DynamoDB 一律先用免費的 Gateway Endpoint；其他服務才考慮 Interface Endpoint**。
- **什麼時候別用 Interface Endpoint**：流量很小、偶爾才連一次的服務，固定的每小時費可能比你原本繞 NAT 還貴，這時反而不划算。

### 同 AZ／同 Region 設計：免費但別為省錢犧牲高可用

- **為什麼有效**：把高頻互傳的元件（應用↔快取、應用↔資料庫）放在**同一個 AZ**，讓它們走私有 IP、同機房內部，傳輸免費。
- **取捨**：同 AZ 省傳輸費，但**犧牲了跨 AZ 的高可用**——那個 AZ 掛了就整組一起掛。所以**不能為了省傳輸費而把所有雞蛋放同一籃**。正確心法：**高可用該跨 AZ 的照跨，但把「真正高頻、對延遲敏感」的互傳儘量收斂在同 AZ，並接受必要的跨 AZ 成本是買保險的錢**。

## 傳輸費三大戰場：同 AZ、跨 AZ、跨 Region

| 流量路徑 | 計費 | 典型情境 |
| --- | --- | --- |
| **同一個 AZ 內（用私有 IP）** | **免費** | 同一個 AZ 裡的 EC2 和資料庫互通 |
| **跨 AZ** | 要錢（雙向都算） | 資料庫主從分散在不同 AZ 做高可用 |
| **跨 Region** | **更貴** | 把資料複製到另一個 Region 做災難備援 |
| **傳出到網際網路（Egress）** | 收費大宗 | 使用者從 S3／EC2 下載檔案 |
| **傳入從網際網路（Ingress）** | **多半免費** | 使用者上傳檔案進 AWS |

:::tip[💡 考試重點]
看到關鍵字直接對應省錢手法，幾乎是送分：
- 題目講 **「大量使用者對外下載／靜態內容分發／降低對外傳輸費」** → **CloudFront**（邊緣快取 + 便宜 egress）
- 題目講 **「VPC 內的 EC2 要存取 S3／DynamoDB」「流量不想經過網際網路或 NAT」「省 NAT 處理費」** → **Gateway VPC Endpoint**（存取 S3／DynamoDB **免費**）
- 題目講 **「跨 AZ 流量費太高」「元件之間一直互傳」** → **把常互通的元件放在同一個 AZ**
- 題目講 **「連 AWS 服務或第三方服務想走私有網路」** → **Interface VPC Endpoint（PrivateLink）**
:::

## 省錢招式一：CloudFront 降低對外傳輸費

<Term en="Amazon CloudFront" desc="AWS 的內容傳遞網路（CDN），把內容快取到全球邊緣節點，離使用者近、傳輸費也較便宜。">CloudFront</Term> 是 AWS 的<Term en="Content Delivery Network" desc="內容傳遞網路，把內容複製到世界各地的節點，讓使用者就近取得。">CDN（內容傳遞網路）</Term>。它把你的檔案快取到全球各地的**邊緣節點**，使用者下載時就近拿，不用每次都回到原始的 S3／EC2。

它省錢有兩個關鍵：

- **快取命中就不回源**：熱門檔案存在邊緣節點，重複下載直接從快取出，**不再產生 S3／EC2 的對外傳輸費**。
- **CloudFront 的 egress 比較便宜**：從 CloudFront 傳到使用者的費率，通常比 S3／EC2 直接對外傳輸更划算，而且 **CloudFront 回源抓 S3 的流量不另外收傳輸費**。

## 省錢招式二：VPC Endpoint 讓流量走內網、繞開 NAT

當私有子網路裡的 EC2 要存取 S3、DynamoDB 這類 AWS 服務時，預設會「繞」出去——透過 NAT 閘道連上網際網路再進 AWS 服務。這條路**又慢又花錢**（NAT 處理費＋傳輸費）。

<Term en="VPC Endpoint" desc="讓 VPC 內的資源直接、私密地連到 AWS 服務的入口，流量不經過網際網路。">VPC Endpoint</Term> 讓這段流量**走 AWS 內部網路**，不碰網際網路、不經 NAT：

- **Gateway Endpoint（閘道端點）**：專給 **S3 與 DynamoDB**，走路由表導流，**本身完全免費**，還省下 NAT 處理費與對外傳輸費。
- **Interface Endpoint（介面端點／PrivateLink）**：支援**很多種 AWS 服務與第三方服務**，在你的子網路裡放一張<Term en="Elastic Network Interface" desc="彈性網路介面，相當於 VPC 內一張虛擬網卡。">ENI 網卡</Term>，流量走 <Term en="AWS PrivateLink" desc="讓你用私有 IP 安全連到 AWS 或第三方服務，流量不經過網際網路。">PrivateLink</Term>。它按小時＋按資料量收費，但通常仍比繞 NAT 便宜。

## 傳輸路徑圖解：繞路 vs 走內網

<div className="flow">
  <div className="flow-node">私有子網路的 EC2 要存取 S3</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">走 NAT 閘道繞網際網路（付 NAT 處理費＋傳輸費）</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">改用 S3 Gateway Endpoint（走內網、免費）</div>
</div>

*圖：同樣是存取 S3，繞 NAT 出網際網路一路計費；改走 S3 Gateway Endpoint 不但更安全，傳輸還免費。*

## 實務應用：不只是考試

<Scenario title="真實情境：老闆說『明明只是備份跑一跑，NAT 帳單怎麼這麼貴？』">

你查帳單發現：公司有一批私有子網路裡的 EC2，每天凌晨把大量日誌備份到 S3。因為它們沒有公有 IP，流量全部繞經 <Term en="NAT Gateway" desc="讓私有子網路的機器連外的閘道，按小時＋按處理的 GB 計費。">NAT 閘道</Term> 才連到 S3——等於每天備份的每一 GB 都在付 NAT 處理費，而且還額外產生對外傳輸費。

解法：在這個 VPC 建一個 **S3 Gateway Endpoint**，把到 S3 的流量導回 AWS 內網。這段流量從此**不經 NAT、不出網際網路、完全免費**。設定只要改路由表、不用動程式，備份照跑，NAT 帳單立刻瘦一圈。下面帶你做一次。

</Scenario>

### 🛠️ 動手做：建一個 S3 Gateway Endpoint 省下 NAT 費

1. AWS 主控台搜尋 `VPC` → 左側選 **端點（Endpoints）** → **建立端點**。
2. 服務類別選 **AWS services**，搜尋並選 `com.amazonaws.區域代碼.s3`，類型確認是 **Gateway**。
3. 選擇你的 **VPC**，勾選私有子網路所使用的 **路由表（Route tables）**——Gateway Endpoint 是靠路由表導流的。
4. 原則（Policy）先用 **完整存取（Full Access）** 測試，之後再收緊。
5. 按 **建立端點**。完成後，私有子網路到 S3 的流量就會自動走這個端點。
6. 到 S3 丟／抓一個檔案驗證備份正常，再回頭看 NAT 閘道的流量指標，應該明顯下降。

```bash
# 建立一個 S3 Gateway Endpoint（把 vpc-xxx 與路由表 ID 換成你的）
$ aws ec2 create-vpc-endpoint \
    --vpc-id vpc-xxxxxxxx \
    --service-name com.amazonaws.ap-northeast-1.s3 \
    --vpc-endpoint-type Gateway \
    --route-table-ids rtb-xxxxxxxx
```

### 🧮 跟著估一筆：這筆傳輸費到底差多少？

紙上談兵不如自己算一次。假設前面那批 EC2 **每天備份 100 GB 日誌到 S3，一個月 30 天共 3,000 GB**（約 3 TB）。下面用好記的概略費率比較兩種做法（實際以 [官方定價](https://aws.amazon.com/vpc/pricing/) 為準，這裡抓整數方便心算）：

| 做法 | NAT 處理費（約 0.045 USD/GB） | 對外傳輸費 | 月成本（概估） |
| --- | --- | --- | --- |
| **繞 NAT 出網際網路** | 3,000 GB × 0.045 ≈ **135 USD** | 到 S3 同 Region 這段通常不另計，但 NAT 每小時固定費另計（約 0.045 USD/時 × 720 時 ≈ **32 USD**） | **約 167 USD／月** |
| **改用 S3 Gateway Endpoint** | **0 USD**（走內網、免路由出網際網路） | **0 USD**（同 Region 走 Endpoint 免費） | **約 0 USD（Endpoint 免費）** |

**預期結果**：換成 Gateway Endpoint 後，這段備份流量的 NAT 處理費與對外傳輸費**直接歸零**，每月省下的量級就是上表那 100 多美元，且資料量越大省越多。做完動手步驟後，回 CloudWatch 看 NAT Gateway 的 `BytesOutToDestination` 指標，應該看到備份時段的流量明顯下降甚至趨近於零——那就是省到錢的證據。

:::tip[💡 考試重點：先算「哪一段在收費」再選方案]
考場上不會真的要你算到小數點，但會要你判斷**哪一段流量在收費、換哪個方案能把它歸零**。心法：先問「這條流量有沒有出 AWS 邊界？有沒有跨 AZ／跨 Region？有沒有繞 NAT？」——只要能把流量收斂回**同 AZ 內網**或**走免費的 Gateway Endpoint**，就是最省的答案。
:::

<Cost>

**Gateway Endpoint（S3／DynamoDB）本身免費**，是少數「設了就省、幾乎沒缺點」的選項。**NAT 閘道**則是雙重計費：**每小時固定費 ＋ 每 GB 處理費**，所以讓大流量繞開它最有感。**CloudFront** 靠快取降低回源與對外傳輸費，熱門靜態內容越多越划算。另外 **EBS 快照是增量計費**——第一次全量、之後只對「有變動的區塊」收費，所以頻繁快照不會每次都付整顆硬碟的錢，但長期堆積的舊快照仍要定期清理。練習完記得刪掉測試用的 Endpoint 與物件。

</Cost>

:::warning[🚑 實務常見錯誤]
- **以為傳輸費就是儲存費**：S3 儲存很便宜，真正貴的常是對外 egress，忽略它帳單會悄悄爆。
- **私有子網路存取 S3 還在繞 NAT**：沒建 Gateway Endpoint，每 GB 都付 NAT 處理費，白花錢。
- **元件硬跨 AZ 一直聊天**：主從資料庫、快取與應用散在不同 AZ 又高頻互傳，跨 AZ 費用累積很可觀；常互通的放同 AZ。
- **用公有 IP 互連同 VPC 的資源**：流量繞出網際網路再回來，比走私有 IP 貴；內部互通請用私有 IP。
- **忘了清理舊的 EBS 快照與跨 Region 複製**：增量快照長期堆積、跨 Region 複製是最貴的傳輸，沒治理會持續燒錢。
- **以為「同一個 Region 內就免費」**：免費的分界是 **AZ 不是 Region**。同 Region 但**跨 AZ** 的流量照收，而且**來回雙向都算**——多 AZ 高可用部署天生就在付這筆，別以為是設定錯。
- **忘了 NAT 閘道是「雙重計費」**：它同時收**每小時固定費**（開著就扣，沒流量也扣）＋**每 GB 處理費**。只刪流量沒刪閒置的 NAT，每小時費還是持續燒；大流量要省就靠 Gateway Endpoint 繞開它。
- **跨 Region 複寫（S3 CRR／DynamoDB 全球表／RDS 跨區副本）沒估成本就開**：跨 Region 是最貴的傳輸，資料一多每月費用很可觀；開之前先確認「災難備援／合規」的需求是否真的需要跨 Region，別為了心安而複寫全部資料。
:::

<Refs>

- [AWS 資料傳輸定價總覽](https://aws.amazon.com/ec2/pricing/on-demand/#Data_Transfer)
- [Amazon CloudFront 定價](https://aws.amazon.com/cloudfront/pricing/)
- [VPC Endpoint（AWS PrivateLink）說明](https://docs.aws.amazon.com/vpc/latest/privatelink/what-is-privatelink.html)
- [S3 的 Gateway VPC Endpoint](https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints-s3.html)
- [NAT 閘道定價與運作](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html)
- [EBS 快照的增量計費](https://docs.aws.amazon.com/ebs/latest/userguide/ebs-snapshots.html)

</Refs>

## 下一步

- ⚡ 快速複習：[Domain 4 重點速記 / 閃卡](/saa/domain-4/flashcards)
- ✍️ 測試自己：[Domain 4 原創練習題](/saa/domain-4/quiz)
- 📖 下一篇：[成本監控與治理](/saa/domain-4/cost-monitoring)
