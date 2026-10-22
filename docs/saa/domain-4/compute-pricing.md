---
sidebar_position: 1
title: 運算計費模式：隨需、預留、Spot、Savings Plans 怎麼選
---

# 運算計費模式：同一台 EC2，怎麼付最省？

> 本篇帶你搞懂 EC2 運算的幾種「付費方式」：隨需（On-Demand）、預留（Reserved Instances）、Savings Plans、Spot、Dedicated Hosts，以及「看到什麼關鍵字就選哪一種」的 Domain 4 送分題。機器一樣，付費方式選對，帳單可以差到好幾倍。

<Vocab title="📌 先認識這篇會出現的名詞（完全沒碰過也能懂）">

- **計費模式（Pricing Model）**：同一台機器，AWS 給你好幾種「**付錢的方式**」。按時付最貴、先承諾用量換折扣最省。
- **承諾（Commitment）**：你先跟 AWS 說好「**未來 1 年或 3 年會持續用這麼多**」，換到的折扣。用越久、付越前面，折越多。
- **中斷（Interruption）**：AWS 把你暫時借走的便宜算力「**收回去**」——機器會被關掉，但會提前給你通知。
- **容錯（Fault Tolerant）**：工作「**被中途打斷也不會壞**」——可以重跑、可以換一台繼續，不會丟資料。
- **BYOL（Bring Your Own License）**：你**自備軟體授權**（例如某些 Windows／Oracle 授權），搬到 AWS 繼續用。

</Vocab>

:::note[💬 閱讀小提示]
文章裡只要看到帶<Term desc="像這樣！滑鼠移到有虛線的名詞上（手機點一下），就會跳出白話解釋。">虛線底線的名詞</Term>，把滑鼠移上去就會跳出白話解釋。所有名詞也都整理在 [名詞與服務對照表](/glossary)。
:::

## 為什麼需要挑計費模式？先講一個多花錢的例子

假設你公司有一組網站主機，流量很穩定，**一年 365 天都得開著**。你如果全部用「開機就計費」的 <Term en="On-Demand" desc="按使用時間計費的 EC2，開機就收錢、關機就停，最有彈性但單價最貴。">隨需（On-Demand）</Term>，等於每天都用「牌價」在付，一年下來貴得嚇人。

其實這種「**可預測、會長期持續**」的負載，你只要先跟 AWS 承諾「我未來 1 年（或 3 年）都會用這麼多」，就能換到**最多省約 7 成**的折扣（Reserved Instances 或 Savings Plans）。反過來，如果是「**跑完就丟、被中途打斷也沒關係**」的批次運算，用 <Term en="Spot Instances" desc="用 AWS 的閒置算力，最高可省約 90%，但可能被收回（中斷），適合容錯、可重跑的工作。">Spot</Term> 甚至能省到**約 9 成**。選錯計費模式，不是多花冤枉錢，就是把不該被中斷的工作放在會被中斷的地方。**成本最佳化的核心，就是把「負載的穩定度」對應到「對的計費模式」。**

## 一句話先懂這五種計費模式

- **On-Demand（隨需）**：開機就計費、關機就停，最有彈性、不用承諾，但**單價最貴**。
- **Reserved Instances（預留，RI）**：先承諾 **1 年或 3 年**用特定機型，換**最多約 7 成**折扣，適合穩定負載。
- **Savings Plans（節省方案）**：一樣承諾 1／3 年，但承諾的是「**每小時花多少錢**」而非綁死機型，**比 RI 更彈性**。
- **Spot（競價／暫用）**：撿 AWS 的閒置算力，**最高省約 9 成**，但**可能被收回**（中斷），只適合容錯工作。
- **Dedicated Hosts（專用主機）**：整台實體伺服器只給你用，為了**合規**或**自備授權（BYOL）**，最貴。

<Analogy title="🏨 生活比喻：住飯店 vs 簽年約 vs 撿空房 vs 包棟">

- **On-Demand = 當天走進飯店訂房**：想住幾晚就住幾晚，隨到隨訂最自由，但付的是「**當日牌價**」最貴。
- **Reserved Instances = 跟飯店簽一年住宿約**：先講好「我固定住這種房型一整年」，房價立刻打大折；但房型綁死（Standard）、或多付一點可換房型（Convertible）。
- **Savings Plans = 簽「每月固定消費額」的會員**：你承諾「每個月在這間集團花這麼多錢」，不管住哪間分店、哪種房型都算數——**比綁房型的年約更靈活**。
- **Spot = 撿飯店當晚沒賣掉的空房**：超便宜，但飯店**隨時可能把你請出房**（提前通知你收拾）——只適合「被趕出去也無所謂、換一間繼續睡」的人。
- **Dedicated Hosts = 整棟包下來**：為了把某張只能貼在「這一棟」的證照／授權用好用滿，或法規要求你獨占硬體，最貴但最專屬。

</Analogy>

## 四種主流計費模式：核心差異一次看

| 比較項 | On-Demand 隨需 | Reserved（RI）預留 | Savings Plans | Spot |
| --- | --- | --- | --- | --- |
| 要不要承諾 | 不用 | 要（1 或 3 年） | 要（1 或 3 年） | 不用 |
| 省多少 | 0%（基準牌價） | 最多約 72% | 最多約 72% | 最高約 90% |
| 會被中斷嗎 | 不會 | 不會 | 不會 | **會**（2 分鐘通知） |
| 彈性 | 最高 | 低（綁機型／區域） | 中（綁花費額，不綁機型） | 高（但隨時可能被收回） |
| 最適合 | 短期、不確定、臨時尖峰 | 穩定可預測、長期常駐 | 穩定但機型可能會變 | 容錯、可重跑、無狀態批次 |

### Reserved Instances：Standard 還是 Convertible？

RI 是「先承諾換折扣」，又分兩種彈性：

- **Standard RI（標準型）**：折扣最深，但**綁死機型家族**，中途幾乎不能改。適合「我很確定一整年都用這種機器」。
- **Convertible RI（可轉換型）**：折扣稍淺，但**可以中途換成別的機型／OS／租用方式**。適合「長期會用、但未來機型可能要調整」。
- **年期**：都可選 **1 年或 3 年**；年期越長、付款越前面（全預付 > 部分預付 > 不預付），折扣越多。

### Savings Plans：為什麼比 RI 更彈性？

Savings Plans 不綁「你要用哪一台機型」，而是承諾「**每小時固定花多少美元（例如每小時 $10 的運算用量）**」，在這個額度內不管你換機型、換區域、甚至從 EC2 換到 Fargate／Lambda，都照樣打折。常考兩種：

- **Compute Savings Plans（運算型）**：**最彈性**——涵蓋 EC2、Fargate、Lambda，可跨機型家族、跨區域、跨作業系統。折扣略少於下面那種。
- **EC2 Instance Savings Plans（EC2 執行個體型）**：**只綁某一區域的某個機型家族**（例如 us-east-1 的 C 系列），彈性較小、但**折扣最深**，很接近 Standard RI。

:::tip[💡 考試重點]
看到關鍵字直接對應計費模式，幾乎是送分：
- 題目講 **「穩定、可預測、長期常駐」「要最低成本但不能被中斷」** → **Reserved Instances 或 Savings Plans**
- 題目講 **「要最大彈性、想跨機型／跨 EC2 與 Fargate／Lambda 都打折」** → **Compute Savings Plans**
- 題目講 **「可中斷」「容錯」「無狀態」「批次」「可重跑」「省越多越好」** → **Spot Instances**
- 題目講 **「短期、臨時、流量不確定、不想承諾」** → **On-Demand**
- 題目講 **「法規要求獨占實體主機」「自備授權 BYOL」「授權綁實體核心」** → **Dedicated Hosts**
- Spot 會在回收前給 **2 分鐘中斷通知**；常見架構是用 **Auto Scaling 混合隨需 + Spot**（基礎量用隨需保穩定，尖峰用 Spot 省錢）。
:::

## Spot 為什麼便宜？為什麼會被中斷？

Spot 是把 AWS **還沒賣出去的閒置算力**便宜租給你。一旦 AWS 需要把那些算力拿回去正常賣（On-Demand），就會**回收你的 Spot 執行個體**。好消息是回收前會先發 <Term en="Spot Interruption Notice" desc="Spot 執行個體被回收前 AWS 發出的通知，讓你有約 2 分鐘把工作存檔或轉移。">中斷通知</Term>，給你**約 2 分鐘**善後（把進度存檔、把工作交給別台）。

所以 Spot 的鐵律是：**只放「被打斷也不會壞」的工作**——例如影片批次轉檔、資料處理管線、CI/CD 建置、機器學習訓練（有 checkpoint）、無狀態的網頁前端。千萬別把「一中斷就完蛋」的工作（例如唯一一台、沒存檔的資料庫主機）放 Spot。

## 計費模式選型流程圖解

<div className="flow">
  <div className="flow-node">這個工作被中斷會怎樣？</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">中斷也沒差、可重跑？→ Spot（省最多）</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">不能中斷、長期穩定？→ RI 或 Savings Plans</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">短期／不確定／不想承諾？→ On-Demand</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">要獨占實體／自備授權？→ Dedicated Hosts</div>
</div>

*圖：先問「被中斷會不會壞」與「負載穩不穩定」，再沿著這條路往下收斂到最省又最合適的計費模式。*

## 實務應用：不只是考試

<Scenario title="真實情境：老闆說『帳單太高，但有些機器明明可以被打斷』">

你盤點公司的 EC2 負載，發現有三種：一組是 24 小時都要開的網站主機（流量穩定）；一組是每晚跑的影片轉檔批次（跑完就丟、中斷了重跑即可）；還有臨時做活動時才開的尖峰機器（不確定哪天會用）。目前**全部都用隨需**在付，帳單自然高。

解法：**穩定的網站主機** → 承諾 1 年買 **Savings Plans**（省約 7 成又不怕中斷）；**可重跑的轉檔批次** → 改用 **Spot**（最高省約 9 成，被中斷就重跑）；**臨時尖峰** → 維持 **On-Demand**（不想被年約綁住）。一次把三種負載對應到三種計費模式，帳單立刻瘦身。下面帶你用 CLI 看目前的 Spot 行情與買 Savings Plans 前的建議。

</Scenario>

### 🛠️ 動手做：查 Spot 價格、看 Savings Plans 建議

1. AWS 主控台搜尋 `EC2` → 左側 **Spot 請求（Spot Requests）** → **定價歷史記錄（Pricing History）**，挑一個機型看它的 Spot 價格波動（通常遠低於隨需牌價）。
2. 搜尋 `Cost Explorer` → 開啟 **Savings Plans → 建議（Recommendations）**，AWS 會根據你過去用量，算出「買多少每小時承諾、可省多少」。
3. 要用 Spot 跑批次：在 **啟動範本（Launch Template）** 或 **Auto Scaling 群組** 裡設定「混合執行個體原則」，一部分用 On-Demand（保底）、一部分用 Spot（省錢）。
4. 幫 Spot 工作加上「中斷處理」：監聽中斷通知，收到後在 2 分鐘內把進度存檔、把流量移走。

```bash
# 查某機型最近的 Spot 價格（遠低於 On-Demand 牌價）
$ aws ec2 describe-spot-price-history \
    --instance-types m5.large \
    --product-descriptions "Linux/UNIX" \
    --max-items 5
```

<Cost>

**省錢順序**（同一台機器）：**Spot（最高約 -90%）> Savings Plans／RI（約 -72%）> On-Demand（牌價）> Dedicated Hosts（最貴）**。

重點提醒：

- **RI 與 Savings Plans 是「承諾付費」**：就算機器關掉沒用，承諾的錢照付，所以**只對確定會長期用的量**下承諾。
- **Spot 省最多但會被中斷**，務必只放容錯、可重跑的工作，並處理那 2 分鐘的中斷通知。
- 練習完記得把測試用的 Spot／On-Demand 執行個體**關掉或刪除**，避免繼續計費。

</Cost>

:::warning[🚑 實務常見錯誤]
- **穩定負載卻用隨需硬撐**：長期常駐卻不買 RI／Savings Plans，等於天天付牌價，白白多花好幾成。
- **把不能中斷的工作放 Spot**：唯一一台資料庫、沒存檔的主機被回收就出大事；Spot 只放可重跑、無狀態的工作。
- **RI／Savings Plans 承諾過頭**：對「其實用不滿」的量下 3 年承諾，之後機器閒置照付，反而更貴；先從 1 年、較小承諾開始。
- **忘了處理 Spot 的 2 分鐘通知**：沒監聽中斷通知就被硬關，進度全丟；要搭 checkpoint 或把工作交棒給別台。
- **搞混 RI 與 Savings Plans**：RI 綁機型、Savings Plans 綁花費額；要最大彈性（跨 EC2／Fargate／Lambda）選 **Compute Savings Plans**。
:::

<Refs>

- [Amazon EC2 定價](https://aws.amazon.com/ec2/pricing/)
- [Amazon EC2 預留執行個體（Reserved Instances）](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-reserved-instances.html)
- [AWS Savings Plans 使用者指南](https://docs.aws.amazon.com/savingsplans/latest/userguide/what-is-savings-plans.html)
- [Amazon EC2 Spot 執行個體](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-spot-instances.html)
- [Amazon EC2 專用主機（Dedicated Hosts）](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/dedicated-hosts-overview.html)

</Refs>

## 下一步

- ⚡ 快速複習：[Domain 4 重點速記 / 閃卡](/saa/domain-4/flashcards)
- ✍️ 測試自己：[Domain 4 原創練習題](/saa/domain-4/quiz)
- 📖 下一篇：[S3 儲存類別與生命週期](/saa/domain-4/s3-storage-classes)
