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

## 別搞混：HA、容錯、災難復原

| 名詞 | 白話 | 例子 |
| --- | --- | --- |
| **高可用（HA）** | 壞了能**快速自動恢復**，允許極短暫中斷 | 跨 2 個 AZ，一個壞了另一個接手 |
| **容錯（Fault Tolerance）** | 壞了**完全不中斷**，成本最高 | 同時多份完整運作，零停機 |
| **災難復原（DR）** | 整個 Region 級大災難後的**復原計畫** | 跨 Region 備援（見[備份與災難復原](/saa/domain-2/backup-dr)） |

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

<Cost>

**開在幾個 AZ 本身不另外收費**，但要注意：**跨 AZ 傳輸的資料**會產生少量流量費。這是高可用該付的「保險費」，通常遠低於一次當機的損失。練習用的 EC2 記得用完**終止（Terminate）**，並善用**免費方案（Free Tier）**。

</Cost>

:::warning[🚑 實務常見錯誤]
- **把所有 EC2、資料庫都塞在同一個 AZ**：省了一點跨 AZ 流量費，卻讓整個系統變成一個大 SPOF，一停電全倒。
- **以為「多開幾台 EC2」就等於高可用**：如果那幾台都在同一個 AZ，仍然是單點故障。**關鍵是跨 AZ**。
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
