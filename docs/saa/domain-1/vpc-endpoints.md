---
sidebar_position: 3.5
title: VPC 私密連線：VPC Endpoint / PrivateLink
---

# VPC 私密連線：VPC Endpoint 與 PrivateLink

> 「要讓私有子網路裡的 EC2 存取 S3，但**流量完全不要走網際網路**，該怎麼做？」——這是 SAA **超高頻**的題型。答案幾乎都是 **VPC Endpoint**。

<Vocab title="📌 先認識這篇會出現的名詞">

- **VPC（Virtual Private Cloud）**：你在 AWS 裡的私人虛擬網路。
- **私有子網路（Private Subnet）**：沒有對外網路路由的子網路，裡面的主機連不到網際網路。
- **NAT Gateway（網路位址轉譯閘道）**：讓私有子網路的主機「單向」連出網際網路的中繼站，**按小時 + 按流量計費**。
- **VPC Endpoint（VPC 端點）**：在你的 VPC 裡開一個「直達 AWS 服務」的私密通道，流量**不經過網際網路**。
- **PrivateLink**：撐起 Interface 端點的底層技術，用一張私有 IP 網卡把服務拉進你的 VPC。

</Vocab>

## 為什麼需要它？

<Scenario title="真實情境：資料庫備份要上傳 S3，但老闆說『不准走公網』">

你的 EC2 在私有子網路裡，要把備份丟到 S3。傳統做法是架一台 **NAT Gateway** 讓它連出網際網路再繞到 S3——但這樣流量跑到公網上、又要付 NAT 的流量費。資安團隊希望流量**全程待在 AWS 內部網路**。**VPC Endpoint** 就是為此而生：在 VPC 內開一條直通 S3 的私密捷徑，省錢又安全。

</Scenario>

### 為什麼選 VPC Endpoint？（相對走 NAT Gateway / 網際網路）

同樣是「讓私有子網路連到 S3」，你其實有兩條路，差別很大：

- **走 NAT Gateway + 網際網路**：EC2 → NAT Gateway → Internet Gateway → 公網 → 回到 S3。流量**離開了 AWS 私有網路、跑到公網**再繞回來；而且 NAT Gateway 是**按小時 + 每 GB 流量**雙重計費，備份量大時帳單很有感。
- **走 VPC Endpoint**：EC2 → S3 端點 → S3。流量**全程待在 AWS 骨幹網路**，一步到位。

白話講，為什麼多數題目要你選 VPC Endpoint？三個關鍵好處：

1. **不出公網（更安全）**：流量不經過 Internet Gateway，從頭到尾在 AWS 內部網路。對資安／稽核／法遵（如要求「資料不得途經公網」）是直接達標，不用再靠防火牆去堵。
2. **省 NAT 費用**：原本經 NAT 連 S3 的那段流量，改走 Gateway 端點後**完全免費**，等於把 NAT 的流量費省掉。很多題目考「**降低成本**又要連 S3」，答案就是它。
3. **更簡單、更穩**：少了 NAT、IGW 這一長串中繼，路徑短、故障點少，也不受公網壅塞影響。

:::info[🔑 關鍵觀念：Endpoint 不是「上網的另一條路」]
VPC Endpoint 只通往**特定的 AWS 服務**（S3、DynamoDB、SQS…），**不能**讓你的主機去連任意網站或下載一般網路資源。真的需要私有子網路對外「上網」（如 `yum update` 抓外部套件），那還是 **NAT Gateway** 的工作，兩者解決的是不同問題，常被題目拿來混淆。
:::

## 兩種端點：一張表分清楚（考試最愛考）

AWS 的 VPC Endpoint 分兩種，**考試最愛考「什麼服務用哪一種」**：

| 比較項 | **Gateway 端點** | **Interface 端點（PrivateLink）** |
| --- | --- | --- |
| 支援的服務 | **只有 S3 和 DynamoDB** | **其他絕大多數服務**（如 SQS、SNS、Kinesis、API Gateway…） |
| 運作方式 | 在**路由表**加一條路由指向服務 | 在子網路放一張**私有 IP 網卡（ENI）** |
| 費用 | **完全免費** | 按**小時 + 按流量**計費 |
| 存取控制 | 用端點政策（Endpoint Policy） | 端點政策 + **Security Group** |
| 跨 VPC / 內部部署存取 | ❌ 不行 | ✅ 可（透過 PrivateLink） |

<Analogy title="🚪 生活比喻：兩種進公司大樓的方式">

- **Gateway 端點 = 大樓後門專用道**：只通往 S3、DynamoDB 這兩間「大戶」，走這條完全免費。
- **Interface 端點 = 幫服務在你樓層裝一支專線分機**：幾乎任何服務都能裝，但裝機要月租 + 通話費。

</Analogy>

### 兩種端點怎麼選？優缺點與成本一次看

先記一句口訣：**「只有 S3 和 DynamoDB 能用 Gateway 端點，其他全部走 Interface 端點。」** 所以第一步不是「哪個比較好」，而是**先看服務支援哪一種**。

**Gateway 端點（S3 / DynamoDB）**

- ✅ **優點**：**完全免費**、沒有頻寬上限（不受單張 ENI 流量限制）、設定極簡（加一條路由就好）。只要是從**同一個 VPC 內**連 S3／DynamoDB，這是 CP 值最高的選擇。
- ❌ **缺點 / 限制**：**只支援 S3 和 DynamoDB**；**不能跨 VPC、不能從地端（on-prem）經 VPN / Direct Connect 存取**（因為它靠的是本 VPC 的路由表，地端機器沒有這張路由表）。
- 💡 **何時別用**：要連 S3／DynamoDB **以外**的服務，或要**從公司機房、其他 VPC** 連進來時——這時只能改用 Interface 端點。

**Interface 端點（PrivateLink）**

- ✅ **優點**：**幾乎所有 AWS 服務都支援**；可**跨 VPC、跨帳號、從地端**存取（因為它是你 VPC 裡一張真的**私有 IP 網卡**，誰連得到這個 IP 就用得到）；可用 **Security Group** 做細緻存取控制。
- ❌ **缺點 / 成本**：**要花錢**——按「**每個端點每小時**」+「**每 GB 流量**」計費，而且是**每個可用區 (AZ) 各一張 ENI**、各自計費，多 AZ 佈署成本會翻倍。閒置不刪也一直收錢。
- 💡 **何時別用**：如果只是**同 VPC 內連 S3／DynamoDB**，別為了「統一用 Interface」而多花錢——用免費的 Gateway 端點就好。

:::tip[💡 一句話決策]
**同 VPC 連 S3 / DynamoDB → Gateway（免費優先）；其餘服務、或要跨 VPC / 地端 → Interface（PrivateLink，付費）。**
:::

### PrivateLink：把「自家服務」私密開放給別的 VPC

前面講的 Interface 端點都是連 **AWS 官方服務**；PrivateLink 更強的地方是：你可以把**自己做的服務**（例如架在 NLB 後面的一組 API）包裝成一個 **Endpoint Service**，私密地開放給**其他 VPC／其他 AWS 帳號**來用。

- **對提供方（你）**：建立 **VPC Endpoint Service**（掛在 Network Load Balancer 後面），決定哪些帳號可以連。
- **對使用方（對方 VPC）**：在他們的 VPC 建一個 **Interface 端點**指向你的服務，就像連 AWS 原生服務一樣。

**意義／為什麼用它**：兩個 VPC 之間**不必做 VPC Peering、不必開放公網**，流量全程走 AWS 私有網路，而且是**單向、一對多**——你把服務「推出去」給很多消費方，彼此的 VPC 不會互通、IP 不會衝突。常見於 **SaaS 廠商把產品私密賣給客戶的 VPC**，或大企業內部跨團隊共享服務。

<Analogy title="🏢 生活比喻：PrivateLink 像大樓裡的「專線窗口」">

你（服務提供方）在大樓一樓開一個專屬窗口，只接待名單上的租戶。每個租戶（消費方 VPC）在自己樓層裝一支直通你窗口的分機（Interface 端點），不需要把兩間辦公室打通（VPC Peering），也不用走大門（公網）。彼此只看得到那個窗口，看不到對方整間辦公室。

</Analogy>

## 圖解：有沒有 Endpoint 的差別

<div className="flow">
  <div className="flow-node">私有子網路 EC2</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">NAT Gateway（付流量費）</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">網際網路</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">S3</div>
</div>

*傳統做法：繞一大圈走公網，還要付 NAT 費用。*

<div className="flow">
  <div className="flow-node">私有子網路 EC2</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">S3 Gateway 端點（免費、私密）</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">S3</div>
</div>

*用 Endpoint：一步到位，流量全程在 AWS 內網，Gateway 端點還免費。*

:::tip[💡 考試重點]
- 看到「**存取 S3 / DynamoDB** 且要**私密、省錢**」→ 答 **Gateway 端點（免費）**。
- 看到「存取 **S3、DynamoDB 以外**的服務」或「要跨 VPC / 從地端存取某服務」→ 答 **Interface 端點（PrivateLink）**。
- 看到「**移除 NAT Gateway 以降低成本**，同時仍要連 S3」→ 答 **Gateway 端點**。
:::

## 實務應用

### 🛠️ 動手做：為 S3 建立 Gateway 端點

1. 進主控台 → `VPC` → 左側 **端點（Endpoints）** → **建立端點**
2. 服務類別選 **AWS 服務**，搜尋並選 `com.amazonaws.<區域>.s3`，類型選 **Gateway**
3. 選擇你的 VPC
4. 勾選要套用的**路由表**（AWS 會自動幫這些路由表加一條指向 S3 的路由）
5. 端點政策先用預設「完全存取」→ 建立

用 CLI 建一個 S3 的 Gateway 端點（記得帶上要套用的路由表）：

```bash
$ aws ec2 create-vpc-endpoint \
    --vpc-id vpc-0abc123 \
    --vpc-endpoint-type Gateway \
    --service-name com.amazonaws.ap-northeast-1.s3 \
    --route-table-ids rtb-0def456
```

**預期結果**：回傳一包 JSON，`State` 會從 `pending` 很快變成 `available`，並且你指定的那張路由表會**自動多一條**目的地為 S3（受管前綴清單 `pl-xxxx`）、目標指向這個端點（`vpce-xxxx`）的路由。這條路由出現，才代表私有子網路的流量真的會走端點而不是 NAT。

用 CLI 列出 VPC 裡的端點，確認狀態：

```bash
$ aws ec2 describe-vpc-endpoints \
    --query "VpcEndpoints[].{ID:VpcEndpointId,Service:ServiceName,Type:VpcEndpointType}"
```

**預期結果**：每個端點一列，看得到 `ID`（`vpce-...`）、`Service`（如 `...s3`）、`Type`（`Gateway` 或 `Interface`）。驗證成功後，從私有子網路的 EC2 執行 `aws s3 ls`（不帶任何公網路由）仍能列出貯體，就證明走的是端點。

<Cost>

**Gateway 端點（S3 / DynamoDB）完全免費**——而且還能幫你省下原本 NAT Gateway 的流量費，是少數「加了還更省錢」的設定。
**Interface 端點**則會按「每小時 + 每 GB」收費，用不到時記得刪除。

</Cost>

:::warning[🚑 常踩雷]
- **只有 S3 和 DynamoDB 是 Gateway 端點**：想用 Gateway 端點連 SQS / Kinesis / SNS / ECR… 一律不行，其他服務全部走 **Interface 端點**。這是考試最愛設的陷阱，務必記死。
- **Gateway 端點忘了改路由表**：Gateway 端點**靠路由表生效**。建端點時沒勾到 EC2 所在子網路關聯的那張路由表，流量就不會走端點（可能還是繞 NAT 或根本連不到）。症狀：端點 `available` 了卻沒作用——去檢查**路由表有沒有那條指向 `vpce-` 的路由**。
- **Interface 端點的 DNS 沒開「私有 DNS」**：Interface 端點要能用**原本的服務網域名**（如 `sqs.ap-northeast-1.amazonaws.com`）自動解析到端點私有 IP，必須**啟用 Private DNS**（且 VPC 的 `enableDnsSupport`、`enableDnsHostnames` 都要開）。沒開的話程式仍解析到公網 IP，等於沒走端點。
- **Interface 端點的 Security Group 擋掉 443**：Interface 端點是一張 ENI，會套用 **Security Group**。要在端點的 SG **放行來源為用戶端的 TCP 443（HTTPS）**，否則連線逾時。這是「端點建好了卻連不上」最常見的原因。
- **endpoint policy 把自己擋住**：端點政策（Endpoint Policy）預設是「完全存取」，但若你自訂了政策卻寫太緊（例如只允許某個貯體 / 某個 Action），就算網路通了，請求也會被**端點層**拒絕（常見錯誤：`Access Denied`）。排查時記得端點政策和 S3 貯體政策、IAM 政策是**三道都要過**。
- **誤以為 Endpoint 能連網際網路**：它只通往**特定 AWS 服務**，不是通用的對外上網方案（要上網是 NAT / IGW 的工作）。
:::

<Refs>

- [AWS PrivateLink 概念](https://docs.aws.amazon.com/vpc/latest/privatelink/concepts.html)
- [Gateway 端點（S3／DynamoDB）](https://docs.aws.amazon.com/vpc/latest/privatelink/gateway-endpoints.html)

</Refs>

## 下一步

- 📖 下一篇：[S3 資料安全](./s3-security.md)
- ⚡ 複習：[Domain 1 重點速記 / 閃卡](./flashcards.md)
