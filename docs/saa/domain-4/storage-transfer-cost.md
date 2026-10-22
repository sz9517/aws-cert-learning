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

<Cost>

**Gateway Endpoint（S3／DynamoDB）本身免費**，是少數「設了就省、幾乎沒缺點」的選項。**NAT 閘道**則是雙重計費：**每小時固定費 ＋ 每 GB 處理費**，所以讓大流量繞開它最有感。**CloudFront** 靠快取降低回源與對外傳輸費，熱門靜態內容越多越划算。另外 **EBS 快照是增量計費**——第一次全量、之後只對「有變動的區塊」收費，所以頻繁快照不會每次都付整顆硬碟的錢，但長期堆積的舊快照仍要定期清理。練習完記得刪掉測試用的 Endpoint 與物件。

</Cost>

:::warning[🚑 實務常見錯誤]
- **以為傳輸費就是儲存費**：S3 儲存很便宜，真正貴的常是對外 egress，忽略它帳單會悄悄爆。
- **私有子網路存取 S3 還在繞 NAT**：沒建 Gateway Endpoint，每 GB 都付 NAT 處理費，白花錢。
- **元件硬跨 AZ 一直聊天**：主從資料庫、快取與應用散在不同 AZ 又高頻互傳，跨 AZ 費用累積很可觀；常互通的放同 AZ。
- **用公有 IP 互連同 VPC 的資源**：流量繞出網際網路再回來，比走私有 IP 貴；內部互通請用私有 IP。
- **忘了清理舊的 EBS 快照與跨 Region 複製**：增量快照長期堆積、跨 Region 複製是最貴的傳輸，沒治理會持續燒錢。
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
