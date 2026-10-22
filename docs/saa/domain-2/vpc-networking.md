---
sidebar_position: 5.5
title: VPC 網路：子網路、NAT、對等連線與混合連線
---

# VPC 網路：子網路、NAT、對等連線與混合連線

> 「這台主機能不能連到那台？能不能連上網際網路？兩個 VPC 怎麼互通？地端機房怎麼接進 AWS？」——這類「**連通性（Connectivity）**」題目在 SAA 是**高頻必考**。這篇把 VPC 網路的來龍去脈用白話串成一條線，讓你看到情境就知道該選哪個服務。

<Vocab title="📌 先認識這篇會出現的名詞">

- **VPC（Virtual Private Cloud）**：你在 AWS 裡的**私人虛擬網路**，像你租下的一整層辦公室。
- **CIDR**：描述一段 IP 範圍的寫法，例如 `10.0.0.0/16`，決定這個 VPC 有多少可用 IP。
- **子網路（Subnet）**：VPC 裡再切出來的小網段，綁在**單一可用區（AZ）**裡。
- **路由表（Route Table）**：決定「要去某個目的地的封包往哪送」的指路牌。
- **網際網路閘道（Internet Gateway，IGW）**：VPC 通往網際網路的大門。
- **NAT（Network Address Translation）**：讓私有子網路的主機「**單向**」連出網際網路的中繼站。

</Vocab>

:::note[💬 閱讀小提示]
文章裡只要看到帶<Term desc="像這樣！滑鼠移到有虛線的名詞上（手機點一下），就會跳出白話解釋。">虛線底線的名詞</Term>，把滑鼠移上去就會跳出白話解釋。所有名詞也都整理在 [名詞與服務對照表](/glossary)。
:::

:::info[🔎 這篇聚焦「連通性」]
網路**安全**（Security Group 與 NACL）和 **VPC Endpoint／PrivateLink** 各有專篇，這裡不重複。本篇專講「**怎麼讓流量通**」：子網路、路由、對外上網、VPC 之間、以及地端與 AWS 之間的連線。
:::

## 為什麼要懂 VPC 連通性？

<Scenario title="真實情境：一張架構圖裡全是『連不連得到』的決定">

你要在 AWS 蓋一個系統：網站主機要被外面的人連到、資料庫不能被外界碰到但要能抓更新、公司總部機房要安全地接進這個 VPC、之後還會多開好幾個 VPC 要互通。每一條線背後都是一個 AWS 服務的選擇題——**選錯了，不是連不上就是多花錢或不安全**。SAA 考的就是這些判斷。

</Scenario>

## VPC 與 CIDR：先圈一塊私人網路

建立 VPC 的第一步，是給它一段 **CIDR**（IP 範圍），例如 `10.0.0.0/16`——這代表這個 VPC 擁有約 6.5 萬個私有 IP 可用。之後你在裡面切出來的每個**子網路**，都是從這段大範圍再切一小塊，例如 `10.0.1.0/24`。

<Analogy title="🏢 生活比喻：VPC 是整層辦公室，子網路是房間">

- **VPC（`10.0.0.0/16`）** = 你租下的一整層樓
- **子網路（`10.0.1.0/24`）** = 樓層裡隔出來的一間間房間，各綁在一個「樓棟」（可用區 AZ）
- **路由表** = 每間房門口的指路牌，告訴你「要去某個地方該走哪條路」

</Analogy>

:::tip[💡 關於 CIDR，考試記這點就夠]
- VPC 的 CIDR **建立後不好改**（只能額外附加區塊），所以一開始就規劃夠大、且**不要跟未來要互連的網路重疊**。這個「不重疊」後面講 Peering 時會變成關鍵考點。
:::

## 公有 vs 私有子網路：差別只在「有沒有一條路通 IGW」

這是很多初學者的盲點：子網路本身**沒有「公有／私有」的開關**。它是公有還是私有，**完全取決於它的路由表有沒有一條路由指向網際網路閘道（IGW）**。

- **公有子網路**＝路由表裡有一條 `0.0.0.0/0 → IGW`（任何不在 VPC 內的目的地，都往 IGW 送出去）。
- **私有子網路**＝路由表裡**沒有**指向 IGW 的路由，所以裡面的主機連不到網際網路。

```text
          ┌──────────────── VPC 10.0.0.0/16 ────────────────┐
          │                                                  │
  網際網路 ──IGW─┬─ 公有子網路 10.0.1.0/24                     │
          │     │   路由表: 0.0.0.0/0 → IGW                  │
          │     │                                            │
          │     └─ 私有子網路 10.0.2.0/24                     │
          │         路由表: (沒有通往 IGW 的路由) → 連不到外網  │
          └──────────────────────────────────────────────────┘
```

*圖：同一個 VPC，差別只在路由表那一條指向 IGW 的路由。*

:::warning[🚑 常見卡關]
- **放了 IGW 卻還是連不上網際網路？** 光有 IGW 不夠，還要：①子網路路由表有 `0.0.0.0/0 → IGW`、②主機有**公有 IP 或 Elastic IP**、③Security Group／NACL 有放行。三者缺一不可。
:::

## NAT Gateway vs NAT Instance：讓私有子網路「只出不進」

私有子網路的主機連不到外網，但常常**需要主動連出去**（例如下載系統更新、呼叫外部 API）。重點是：我們要讓它**能出去、但外面不能主動進來**。這就是 **NAT** 的工作。

做法是：把私有子網路的路由 `0.0.0.0/0` 指向放在**公有子網路**裡的 NAT，NAT 再透過 IGW 連出去。回應會沿著原路回來，但外部**無法主動**發起連線進入私有主機。

<Analogy title="📮 生活比喻：NAT 像公司的『代收發室』">

員工（私有主機）可以把信交給收發室（NAT）寄出去，回信也會送回給員工；但外面的人**不能直接指名寄信給某個員工**——只能回覆員工先寄出的信。這就是「單向出站」。

</Analogy>

| 比較項 | **NAT Gateway**（代管） | **NAT Instance**（自管 EC2） |
| --- | --- | --- |
| 誰在維運 | **AWS 全代管**，免維護 | 你自己開一台 EC2 來當 NAT，要自己維護 |
| 高可用 | 單一 AZ 內**自動高可用**；跨 AZ 要**每區各放一個** | 要自己搞 failover，單點風險高 |
| 效能／頻寬 | 自動擴展，高頻寬 | 受那台 EC2 機型限制 |
| 費用 | 按**小時 + 流量**計費（較貴但省心） | 只付 EC2 費用（較便宜但費工） |
| 考試立場 | **預設首選、正確答案** | 只有「極度省錢、流量很小」才考慮 |

:::tip[💡 考試重點]
- 「私有子網路的主機要能連出網際網路更新套件」→ **NAT Gateway**。
- 「NAT 要**高可用**」→ **每個可用區（AZ）各放一個 NAT Gateway**，別全押在同一區。
- NAT 只處理**出站**；要讓外面主動連進來是 IGW + 公有 IP 的事，別混淆。
- 若只是要連 **S3／DynamoDB** 省掉 NAT 費用，答案通常是 **VPC Gateway 端點**（見 VPC Endpoint 專篇），不是 NAT。
:::

## VPC Peering：兩個 VPC 的「私人專線」

當你有兩個 VPC（可能跨帳號、跨區域）想讓它們的主機**用私有 IP 直接互通**、流量不走公網，就建立 **VPC Peering（對等連線）**。建立後，兩邊各自在路由表加一條「去對方 CIDR 走這條 peering」的路由即可。

兩個 Peering 的考點幾乎每次都考：

- **不可遞移（Non-transitive）**：A 連 B、B 連 C，**不代表 A 能連 C**。每一對想互通的 VPC 都要**各自建立一條** peering。這就是 VPC 數量一多就爆炸的原因（N 個 VPC 全互連要 `N×(N-1)/2` 條）。
- **CIDR 不可重疊**：兩個 VPC 的 IP 範圍若重疊（例如都用 `10.0.0.0/16`），**無法建立 peering**，因為封包會不知道該送去哪一邊。這呼應前面「規劃 CIDR 時就要避免重疊」。

```text
   VPC A ──peering── VPC B ──peering── VPC C
    │                                    │
    └──────── A 要連 C？不行！ ───────────┘
       （peering 不可遞移，A↔C 要另外建一條）
```

:::tip[💡 考試重點]
- 「**兩個** VPC 要用私有 IP 互通、CIDR 不重疊」→ **VPC Peering**。
- 「A 透過 B 連到 C」這種敘述→**錯**，peering 不可遞移。
:::

## Transit Gateway：多個 VPC 的「中樞輻輳」交通樞紐

當 VPC 數量越來越多，用 Peering 兩兩相連會變成一張可怕的蜘蛛網（條數暴增、路由難管）。**Transit Gateway（TGW）**就是來解決這個問題的：它像一個**中央路由器**，所有 VPC（甚至地端網路、跨帳號）都只要**連到 TGW 這個中樞一次**，彼此就能透過它互通——這叫 **hub-and-spoke（中樞輻輳）**。

```text
        VPC A        VPC B        VPC C
          │            │            │
          └──────┬─────┴─────┬──────┘
                 │  Transit  │
                 │  Gateway  │ ←── 也能接地端(VPN/DX)、跨帳號
                 └───────────┘
   （每個 VPC 只連 TGW 一次，不用兩兩互牽）
```

| 比較項 | **VPC Peering** | **Transit Gateway** |
| --- | --- | --- |
| 連線模型 | 兩兩點對點 | 中樞輻輳（一個中心接全部） |
| 遞移性 | **不可遞移** | **可遞移**（透過 TGW 互連） |
| VPC 數量多時 | 條數暴增、難管理 | **一個中樞搞定**，好擴充 |
| 併接地端／跨帳號 | 較受限 | **原生支援**（可接 VPN、Direct Connect） |

:::tip[💡 考試重點]
- 「要連接**很多個** VPC（而且會持續增加）／跨帳號／還要接地端」→ **Transit Gateway**。
- 「VPC Peering 太多條、管理很痛苦，想簡化」→ **改用 Transit Gateway**。
:::

## 混合連線：把地端機房接進 AWS

很多公司不是純雲端，而是**地端機房 + AWS 一起用（混合架構）**。把兩邊接起來有兩條路：**Site-to-Site VPN** 和 **Direct Connect（DX）**。

<Analogy title="🚗 生活比喻：走高速公路 vs. 自己蓋一條專用車道">

- **Site-to-Site VPN** = 開上**公用高速公路**（網際網路），但車子裝了保全押運（加密）。**便宜、幾小時就能上路**，但塞車（網路壅塞、延遲波動）你管不了。
- **Direct Connect** = 向電信商**租一條只有你能走的專用車道**（實體專線）。**穩定、低延遲、高頻寬**，但**租金貴、施工要數週甚至數月**。

</Analogy>

| 比較項 | **Site-to-Site VPN** | **Direct Connect（DX）** |
| --- | --- | --- |
| 走哪裡 | 走**公用網際網路**，加密傳輸 | 專屬**實體專線**，不走公網 |
| 佈建速度 | **快**，幾小時到一天 | **慢**，數週到數月 |
| 費用 | **便宜** | **貴**（專線 + 連接埠費） |
| 延遲／穩定度 | 受網際網路波動影響 | **穩定、低延遲、高頻寬** |
| 典型用途 | 臨時／備援／成本敏感 | 長期、大流量、要求穩定低延遲 |

:::tip[💡 常被一起考的組合]
- 可以用 **VPN 當 Direct Connect 的備援**：平時走 DX（穩又快），DX 斷線時自動改走 VPN，兼顧穩定與韌性，是很常見的「正確答案」。
:::

## 一張總比較表：看情境選服務

| 你的需求／情境 | 該選 |
| --- | --- |
| 私有子網路的主機要能**連出**網際網路（下載更新、呼叫外部 API） | **NAT Gateway** |
| 公有子網路的主機要被外界連到、也要能上網 | **Internet Gateway + 公有 IP** |
| **兩個** VPC 要用私有 IP 互通、CIDR 不重疊 | **VPC Peering** |
| 要連接**很多** VPC／跨帳號／還要併接地端 | **Transit Gateway** |
| 地端機房要**便宜、快速**接進 AWS（可接受網路波動） | **Site-to-Site VPN** |
| 地端機房要**穩定、低延遲、高頻寬**的專線 | **Direct Connect** |
| 要穩定專線、又要一條便宜的備援 | **Direct Connect（主）+ VPN（備援）** |

## 常見考題角度（看到關鍵字就反射）

- 「連很多個 VPC、還一直在增加」→ **Transit Gateway**。
- 「**兩個** VPC 私連、CIDR 不重疊」→ **VPC Peering**（且記得它**不可遞移**）。
- 「私有子網路要**連外**（出站）」→ **NAT Gateway**（高可用就每區一個）。
- 「要**穩定低延遲**的地端**專線**」→ **Direct Connect**。
- 「要**便宜、快速**佈建的**加密通道**接地端」→ **Site-to-Site VPN**。
- 「公有子網路＝怎麼算公有？」→ **路由表有一條 `0.0.0.0/0` 指向 IGW**。

## 實務應用

### 🛠️ 動手做：建一個「公有 + 私有子網路 + NAT」的經典架構

1. 進主控台 → `VPC` → **建立 VPC**，CIDR 填 `10.0.0.0/16`
2. 建兩個子網路：公有 `10.0.1.0/24`、私有 `10.0.2.0/24`（放在同一個可用區方便練習）
3. 建立並掛上 **Internet Gateway** 到這個 VPC
4. 公有子網路的路由表加一條 `0.0.0.0/0 → IGW`（它就「變公有」了）
5. 在**公有**子網路裡建 **NAT Gateway**（配一個 Elastic IP）
6. 私有子網路的路由表加一條 `0.0.0.0/0 → NAT Gateway`（私有主機就能「只出不進」地連外）

用 CLI 檢查某個 VPC 的路由表，確認路由指向正確：

```bash
$ aws ec2 describe-route-tables \
    --filters Name=vpc-id,Values=vpc-0123456789abcdef0 \
    --query "RouteTables[].Routes"
```

<Cost>

**VPC、子網路、路由表、Internet Gateway 本身都免費**。要注意的是 **NAT Gateway 按小時 + 按流量收費**（放著不用也會一直算小時費），還有 **Elastic IP 若沒綁在運行中的資源上也會收費**。練習完記得把 NAT Gateway 刪掉、釋放 Elastic IP。**VPC Peering 本身免費**，只收跨區／跨 AZ 的資料傳輸費；**Transit Gateway 與 Direct Connect** 則都有固定的連接費用。

</Cost>

:::warning[🚑 實務常見錯誤]
- **把 NAT Gateway 放進私有子網路**：NAT 必須放在**公有子網路**（它自己要能透過 IGW 連出去），放錯就永遠連不出去。
- **想靠 Peering 做遞移連線**：A→B→C 連不通，peering **不可遞移**，要嘛每對都建、要嘛改用 Transit Gateway。
- **兩個 VPC CIDR 重疊還想 Peering**：建不起來，規劃階段就要讓 CIDR 不重疊。
- **NAT Gateway 只放一個卻要求高可用**：單一 AZ 的 NAT 掛了，跨區主機就連不出去；要**每個 AZ 各放一個**。
:::

<Refs title="📚 官方資料與延伸閱讀">

- [AWS 官方文件：Amazon VPC 使用者指南](https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html)
- [NAT Gateway](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html)
- [VPC Peering](https://docs.aws.amazon.com/vpc/latest/peering/what-is-vpc-peering.html)
- [AWS Transit Gateway](https://docs.aws.amazon.com/vpc/latest/tgw/what-is-transit-gateway.html)
- [Site-to-Site VPN](https://docs.aws.amazon.com/vpn/latest/s2svpn/VPC_VPN.html)
- [AWS Direct Connect](https://docs.aws.amazon.com/directconnect/latest/UserGuide/Welcome.html)

</Refs>

## 下一步

- ⚡ 快速複習：[Domain 2 重點速記 / 閃卡](/saa/domain-2/flashcards)
- ✍️ 測試自己：[Domain 2 原創練習題](/saa/domain-2/quiz)
- 📖 下一篇：[備份與災難復原](/saa/domain-2/backup-dr)
