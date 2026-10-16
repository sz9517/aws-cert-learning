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

用 CLI 列出 VPC 裡的端點：

```bash
$ aws ec2 describe-vpc-endpoints \
    --query "VpcEndpoints[].{ID:VpcEndpointId,Service:ServiceName,Type:VpcEndpointType}"
```

<Cost>

**Gateway 端點（S3 / DynamoDB）完全免費**——而且還能幫你省下原本 NAT Gateway 的流量費，是少數「加了還更省錢」的設定。
**Interface 端點**則會按「每小時 + 每 GB」收費，用不到時記得刪除。

</Cost>

:::warning[🚑 常見錯誤]
- **想用 Gateway 端點連 SQS / Kinesis**：不行！Gateway 端點**只支援 S3 和 DynamoDB**，其他服務要用 Interface 端點。
- **建了端點卻連不上**：Gateway 端點要確認**有勾到正確的路由表**；Interface 端點要確認**Security Group 有放行 443**。
- **誤以為 Endpoint 能連網際網路**：它只通往**特定 AWS 服務**，不是通用的對外上網方案（那是 NAT / IGW 的工作）。
:::

<Refs>

- [AWS PrivateLink 概念](https://docs.aws.amazon.com/vpc/latest/privatelink/concepts.html)
- [Gateway 端點（S3／DynamoDB）](https://docs.aws.amazon.com/vpc/latest/privatelink/gateway-endpoints.html)

</Refs>

## 下一步

- 📖 下一篇：[S3 資料安全](./s3-security.md)
- ⚡ 複習：[Domain 1 重點速記 / 閃卡](./flashcards.md)
