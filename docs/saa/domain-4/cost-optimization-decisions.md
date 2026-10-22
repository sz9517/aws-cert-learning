---
sidebar_position: 6
title: 成本最佳化架構決策：把前面所有招式整合成一套判斷流程
---

# 成本最佳化架構決策：把前面所有招式，整合成一套判斷流程

> 這是 Domain 4 的收尾總整。前面幾篇各自教了一招——計費模式、彈性擴展、無伺服器、儲存分層、資料傳輸、右規模——這篇把它們串成「一套順序固定的判斷流程」，讓你在看到情境題時，能在好幾個可行方案中快速挑出**最省、又做得到**的那一個。

<Vocab title="📌 先認識這篇會出現的名詞（完全沒碰過也能懂）">

- **成本最佳化（Cost Optimization）**：不是「一味砍到最便宜」，而是「**用最少的錢，把事情做到夠好**」——花該花的、砍掉浪費的。
- **彈性（Elasticity）**：系統能**跟著流量自動變大變小**。人多時長出機器、人少時收掉，不養一群閒置資源乾等。
- **右規模（Right-Sizing）**：把機器的**大小調到剛好**。不是越大越保險，開太大就是在燒錢；太小又卡效能。
- **託管服務（Managed Service）**：由 AWS 幫你顧底層的服務（如 RDS、Fargate、Lambda）。你少了修補、擴充、備援這些雜事，**營運負擔**自然低。
- **營運負擔（Operational Overhead）**：為了讓系統活著要花的「雜事成本」——修補、擴充、監控、換壞硬碟。考題常與成本一起考：越少越好。

</Vocab>

:::note[💬 閱讀小提示]
文章裡只要看到帶<Term desc="像這樣！滑鼠移到有虛線的名詞上（手機點一下），就會跳出白話解釋。">虛線底線的名詞</Term>，把滑鼠移上去就會跳出白話解釋。所有名詞也都整理在 [名詞與服務對照表](/glossary)。
:::

## 為什麼需要一套「流程」？因為情境題不會只考一招

前面每一篇你都學會一招，但真正的 SAA 情境題很少只問一招。它通常長這樣：

> 「某公司有一套每天固定跑、流量白天高晚上低的網站，外加一批每月一次、可容忍中斷的批次運算，還有一堆三年沒人動過的舊日誌。請選出**最具成本效益（MOST cost-effective）**且**營運負擔最低**的架構。」

這一題裡，光是計費模式就同時牽涉隨需、預留、Spot；還牽涉自動擴展、儲存分層。如果你每招分開想，很容易顧此失彼——省了運算卻漏了儲存，或選了最便宜卻**做不到**（例如把不能中斷的工作丟去 Spot）。

**解法是：固定一套順序，像過安檢一樣一關一關問下去。** 這樣每個面向都不會漏，而且因為有先後順序，你會先砍掉最大、最明顯的浪費，再處理細節。

## 骨架：AWS Well-Architected「成本最佳化」支柱的七個原則

這套流程不是我們自己編的，而是直接對應 <Term en="AWS Well-Architected Framework" desc="AWS 官方的架構設計準則，分成多個支柱，成本最佳化是其中之一。">AWS Well-Architected 架構準則</Term> 裡的「成本最佳化支柱」。七個原則，一個都不要漏：

1. **選對計費模式**：隨需（On-Demand）／預留執行個體（Reserved Instances）／<Term en="Savings Plans" desc="承諾一段時間（1 或 3 年）的用量，換取比隨需更低的價格，比 RI 更有彈性。">Savings Plans</Term>／<Term en="Spot Instances" desc="用 AWS 的閒置產能，價格最低（可省達 90%），但可能被隨時收回，適合可中斷的工作。">Spot</Term> **混用**。
2. **用彈性讓供給貼合需求**：靠自動擴展（Auto Scaling）讓資源**跟著需求長縮**，不養閒置機器。
3. **無伺服器／託管服務優先**：能交給 AWS 顧的就交出去，減少閒置與維運成本。
4. **儲存分層與生命週期**：冷熱資料分開放，用 <Term en="S3 Storage Classes" desc="S3 的多種儲存等級，常用的熱資料放標準層，少用的放便宜的冷層。">S3 儲存類別</Term> 與 <Term en="Amazon S3 Glacier" desc="S3 的封存儲存，極便宜但取回較慢，適合長期保存的冷資料。">Glacier</Term> 把舊資料自動搬到便宜層。
5. **降低資料傳輸成本**：用 <Term en="Amazon CloudFront" desc="AWS 的內容傳遞網路（CDN），把內容快取到離使用者近的節點，減少回源流量。">CloudFront</Term> 快取、用 <Term en="VPC Endpoint" desc="讓 VPC 內的資源不經網際網路、直接私密連到 AWS 服務，省下 NAT 與對外流量費。">VPC Endpoint</Term> 走內網，少付「出 AWS」的流量費。
6. **右規模（Right-Sizing）**：用 <Term en="AWS Compute Optimizer" desc="分析實際使用量，建議你把機器調到剛好大小的工具。">Compute Optimizer</Term> 與 <Term en="AWS Trusted Advisor" desc="自動檢查你的帳號，點出省錢、安全、效能等改善建議的工具。">Trusted Advisor</Term> 把開太大的機器調小。
7. **持續監控與治理**：用 <Term en="AWS Cost Explorer" desc="視覺化分析歷史與預測花費、找出花費來源的工具。">Cost Explorer</Term> 看錢花去哪、用 <Term en="AWS Budgets" desc="設定預算門檻，超過就自動寄信或通知你的工具。">Budgets</Term> 設門檻超過就示警。

<Analogy title="🏢 生活比喻：成本最佳化就像幫一個家庭省錢">

- **選對計費模式 = 選對付費方案**：天天要用的（網路、電）簽長約拿折扣（RI／Savings Plans）；偶爾用的按次付（隨需）；不怕被插隊的半夜離峰電價（Spot）。
- **彈性 = 需要才開冷氣**：人在才開、人走就關，而不是整天開著等。
- **託管服務 = 外包家事**：請人打掃比自己邊上班邊打掃省下大量時間（營運負擔）。
- **儲存分層 = 衣櫃分季**：常穿的掛衣櫃（S3 標準），換季的收壓縮袋塞床底（Glacier），要穿再拿出來。
- **右規模 = 別買太大的車**：一個人上下班卻買九人座，油錢（運算費）天天多付。
- **監控治理 = 記帳 App**：每月看帳單找出哪裡超支，設預算警報。

</Analogy>

## 核心心法：成本最佳化的三個直覺

在死背流程之前，先建立三個直覺，很多題目光靠這三句就能選對：

- **閒置 = 浪費**：只要是「開著卻沒在用」的資源，都是成本最佳化要先開刀的對象（空轉 EC2、開太大的機器、沒清的舊快照）。
- **託管／無伺服器 通常 = 較低營運負擔**：題目同時問「最省」又「營運負擔最低」時，**Managed／Serverless 選項往往兩邊都贏**——它把擴充、修補、備援都包了。
- **先砍大的，再砍小的**：先處理「整天空轉的機器」這種大錢，再去摳「資料傳輸費」這種細節，順序對了才有效率。

:::tip[💡 考試重點：MOST cost-effective ＋ 最少營運負擔 的解題直覺]
綜合情境題最愛同時要求「**MOST cost-effective（最具成本效益）**」和「**least operational overhead（最少營運負擔）**」。面對多個「都做得到」的選項時：
- 先刪掉「**做不到**」的（例如不能中斷卻用 Spot、要長跑卻用 Lambda）。
- 剩下可行的裡面，**優先挑 Managed／Serverless**（如 Fargate、Lambda、S3、DynamoDB），因為它們通常同時最省錢又最省事。
- 自己架一整群 EC2 再手動管，幾乎永遠不是「營運負擔最低」的答案。
:::

## 成本最佳化決策流程圖解

把七個原則收斂成一條「過安檢」路線——從最大、最明顯的浪費問起，一關一關往下：

<div className="flow">
  <div className="flow-node">這個資源是「閒置／用太少」嗎？→ 是：右規模或關掉</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">能交給 Managed／Serverless 嗎？→ 能：優先用（省錢又省事）</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">需求會起伏嗎？→ 會：套自動擴展（供給貼合需求）</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">是穩定長期用量嗎？→ 是：用 RI／Savings Plans 鎖折扣</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">能容忍中斷嗎？→ 能：改用 Spot</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">資料是冷的／舊的嗎？→ 是：生命週期搬到 Glacier；對外流量套 CloudFront／VPC Endpoint</div>
</div>

*圖：永遠先砍「閒置浪費」，再看「能不能交出去（Managed）」，最後才細調計費模式、儲存分層與傳輸成本。每一關都對應一個原則。*

## 快速檢查清單：情境題看到關鍵字就對應

| 題目關鍵字 | 該用的招 | 對應原則 |
| --- | --- | --- |
| 穩定、長期、可預測的用量 | 預留執行個體 RI／Savings Plans | 選對計費模式 |
| 可容忍中斷、批次、無狀態 | Spot 執行個體 | 選對計費模式 |
| 流量忽高忽低、白天晚上差很多 | Auto Scaling 自動擴展 | 彈性貼合需求 |
| 不想管伺服器、事件驅動、短任務 | Lambda／Fargate（Serverless） | 託管優先、低營運負擔 |
| 舊資料、少存取、要長期保存 | S3 生命週期 → Glacier | 儲存分層 |
| 使用者分散各地、靜態內容流量大 | CloudFront（CDN） | 降低傳輸成本 |
| VPC 內要連 S3／DynamoDB 省流量費 | VPC Endpoint | 降低傳輸成本 |
| 機器開太大、CPU 常年很低 | Compute Optimizer 建議右規模 | 右規模 |
| 想知道錢花去哪、超支要示警 | Cost Explorer ＋ Budgets | 監控與治理 |

## 實務應用：不只是考試

<Scenario title="真實情境：老闆丟來一份暴增的帳單，要你『用最少力氣砍到最省』">

你拿到帳單，發現三個問題同時存在：一、有一排 EC2 整天開著跑一個穩定的內部系統，流量幾乎不變；二、每月一次的財報批次運算，開了一堆隨需 EC2 跑完就關；三、S3 裡堆了好幾 TB 三年沒人碰的舊日誌，卻全放在最貴的標準層。老闆要你「**最省、又別花太多人力去維運**」。

套上流程一關一關過：穩定長期的內部系統 → 用 **Savings Plans／RI** 鎖折扣（可省 up to 72%）；可中斷的財報批次 → 改用 **Spot**（可省 up to 90%）；三年沒碰的舊日誌 → 設 **S3 生命週期規則**自動搬到 **Glacier Deep Archive**。三刀下去，帳單大降，而且因為都是改設定、沒有自己多架東西，**營運負擔幾乎沒增加**。下面帶你先設一條最有感的 S3 生命週期規則。

</Scenario>

### 🛠️ 動手做：用 S3 生命週期把舊資料自動搬去便宜層

1. AWS 主控台搜尋 `S3` → 點進你那個堆滿舊日誌的儲存貯體（Bucket）。
2. 切到 **管理（Management）** 分頁 → **建立生命週期規則（Create lifecycle rule）**。
3. 規則命名 `archive-old-logs`，套用範圍選 **整個儲存貯體**（或用前綴只套某資料夾）。
4. 勾選 **在物件的目前版本間轉換（Transition current versions）**：設定 `30 天後` 轉到 **Standard-IA**、`90 天後` 轉到 **Glacier Flexible Retrieval**。
5. （選用）再加一條 **到期刪除（Expire）**：例如 `2555 天（約 7 年）後` 自動刪除，符合法規保存年限又不多付錢。
6. 儲存規則。之後 S3 會**自動**依天數把物件搬去便宜層，你完全不用再手動搬。

```bash
# 查看某個儲存貯體目前套了哪些生命週期規則
$ aws s3api get-bucket-lifecycle-configuration \
    --bucket 你的儲存貯體名稱
```

<Cost>

這套流程的每一招幾乎都是「**改設定、不是加東西**」，所以多半能降帳單而不增加營運負擔。重點提醒：**Savings Plans／RI 是「承諾」**，一旦簽了就算沒用滿也要付，別為了折扣超買；**Spot 便宜但會被收回**，只給可中斷的工作用；**Glacier 取回要時間也要錢**，別把每天要讀的資料丟進去。練習完記得把測試用的生命週期規則、儲存貯體與物件清一清，避免留著莫名計費。

</Cost>

:::warning[🚑 實務常見錯誤]
- **只顧運算、忘了儲存與傳輸**：砍了 EC2 卻放著一堆舊資料在標準層、或對外流量沒套 CDN，省一半漏一半。
- **把不能中斷的工作丟去 Spot**：Spot 隨時會被收回，拿去跑不能斷的線上服務會出事；Spot 只給可中斷、可重跑的工作。
- **為了折扣過度承諾 RI／Savings Plans**：承諾量超過實際需求，等於先付了用不到的錢，反而更貴。
- **只買最便宜卻選到「做不到」的方案**：例如要跑 3 小時卻選 Lambda（15 分鐘上限）。先確認「可行」，再比「最省」。
- **設完就不管了**：成本最佳化是持續的，沒開 Cost Explorer／Budgets 監控，下個月又偷偷長出新的浪費。
:::

<Refs>

- [AWS Well-Architected 成本最佳化支柱](https://docs.aws.amazon.com/wellarchitected/latest/cost-optimization-pillar/welcome.html)
- [AWS 定價與計費模式總覽](https://aws.amazon.com/pricing/)
- [Amazon S3 生命週期管理](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html)
- [AWS Compute Optimizer 使用者指南](https://docs.aws.amazon.com/compute-optimizer/latest/ug/what-is-compute-optimizer.html)
- [AWS Cost Explorer 使用者指南](https://docs.aws.amazon.com/cost-management/latest/userguide/ce-what-is.html)
- [AWS Trusted Advisor](https://docs.aws.amazon.com/awssupport/latest/user/trusted-advisor.html)

</Refs>

## 下一步

- 📊 服務比較與考前速查：[Domain 4 服務比較表](/saa/domain-4/comparison)
- ⚡ 快速複習：[Domain 4 重點速記 / 閃卡](/saa/domain-4/flashcards)
- ✍️ 測試自己：[Domain 4 原創練習題](/saa/domain-4/quiz)
