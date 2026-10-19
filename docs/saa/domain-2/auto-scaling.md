---
sidebar_position: 3
title: 自動擴展 Auto Scaling
---

# Auto Scaling：讓伺服器數量「自動增減」

> 本篇教你怎麼讓系統在尖峰自動加機器、離峰自動關機器，是 Domain 2（彈性）最核心的考點之一。

<Vocab title="📌 先認識這篇會出現的名詞（完全沒碰過也能懂）">

- **EC2（Elastic Compute Cloud）**：AWS 上「租來的一台伺服器」，你的網站或程式跑在它上面。
- **執行個體（Instance）**：一台正在運行的 EC2，就是「一台機器」。
- **CPU 使用率**：機器有多忙的指標，愈接近 100% 代表快撐不住了。
- **AZ（Availability Zone，可用區）**：同一個地區（Region）裡「彼此獨立的機房」，一個壞了另一個還在。

</Vocab>

:::note[💬 閱讀小提示]
文章裡只要看到帶<Term desc="像這樣！滑鼠移到有虛線的名詞上（手機點一下），就會跳出白話解釋。">虛線底線的名詞</Term>，把滑鼠移上去就會跳出白話解釋。所有名詞也都整理在 [名詞與服務對照表](/glossary)。
:::

## 為什麼需要 Auto Scaling？

想像你開一家手搖飲店：

- **平日下午**客人稀稀落落，排 1 位店員就夠了。
- **週末放學時段**人潮爆滿，只排 1 位店員會大排長龍、客人跑光。
- 但如果你為了週末「永遠排 5 位店員」，平日就在**付錢給發呆的員工**。

伺服器也一樣。流量有尖峰、有離峰，如果固定開一堆機器，離峰時就是在燒錢；如果只開一兩台，尖峰一來就被流量打垮。**Auto Scaling 就是幫你「客人多就自動加人、客人少就自動遣散」**，兼顧穩定與省錢。

## 一句話先懂 Auto Scaling

**EC2 Auto Scaling** 會根據你設定的條件（例如 CPU 太高）**自動增加或減少 EC2 執行個體的數量**，讓系統永遠維持「剛剛好」的運算量。

<Analogy title="🍢 生活比喻：手搖飲店的彈性排班">

- **Auto Scaling Group（ASG，自動擴展群組）** = 這家店的「排班制度」，負責決定現在該有幾個店員。
- **Launch Template（啟動範本）** = 「新店員的標準訓練手冊」，規定每位新進店員（新機器）用什麼機型、什麼系統映像、掛哪個安全群組。
- **最小 / 期望 / 最大容量** = 「最少留幾人、平常排幾人、最多能加到幾人」。
- **擴展策略（Scaling Policy）** = 「什麼情況要加人、什麼情況可以放人回家」的規則。

</Analogy>

## 三個關鍵容量參數

這是**考試最愛考的細節**，一定要分清楚：

| 參數 | 意思 | 舉例 |
| --- | --- | --- |
| **最小容量（Minimum）** | 無論多離峰，至少保留幾台（守住底線） | 2 |
| **期望容量（Desired）** | 平常想維持的台數，ASG 會努力湊到這個數字 | 2 |
| **最大容量（Maximum）** | 再怎麼尖峰也不會超過幾台（守住荷包上限） | 10 |

:::tip[💡 考試重點]
- ASG 會**持續把實際台數拉回「期望容量」**；若一台機器掛了，ASG 會自動補一台到期望數。
- 設 `min=2` 且分散在**兩個以上 AZ**，就算整個 AZ 掛掉，另一個 AZ 仍有機器 → 這就是「高可用」。
- **擴展（Scale out）＝加機器**；**縮減（Scale in）＝關機器**。注意不要和「垂直擴充（換更大台）」搞混，ASG 做的是**水平擴展**。
:::

## 三種擴展策略，怎麼選？

| 策略 | 怎麼運作 | 什麼時候用 |
| --- | --- | --- |
| **目標追蹤（Target Tracking）** | 你只設一個目標值（例如平均 CPU 維持 50%），AWS 自動加減機器去逼近它 | **最常用、最省心**，考試預設首選 |
| **階梯式（Step Scaling）** | 依指標超標的「幅度」分級加機器（例：CPU>60% 加 1 台、>80% 加 3 台） | 需要更精細控制擴展幅度時 |
| **排程式（Scheduled）** | 按「時間表」預先加減（例：每天 18:00 先加到 6 台） | **可預測**的尖峰，例如每天下班時段、電商檔期 |

:::tip[💡 考試重點]
題目若說「**想維持某個指標在固定水準**、設定愈簡單愈好」→ 選 **目標追蹤（Target Tracking）**。
題目若說「**流量尖峰時間固定可預測**（例如每天早上 9 點）」→ 選 **排程式（Scheduled）**。
還有一種 **預測式擴展（Predictive Scaling）**：用機器學習看歷史流量，**提前**把機器準備好，適合週期性、可預測的負載。
:::

## 運作流程圖解

<div className="flow">
  <div className="flow-node">CloudWatch 偵測 CPU 飆高</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">觸發擴展策略</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">ASG 依 Launch Template 開新機器</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">自動註冊到 ELB 接流量</div>
</div>

*圖：CPU 一飆高，ASG 就依範本開新機器並掛上負載平衡器；流量降下來後再自動縮減。*

## ASG 怎麼和 ELB、健康檢查合作？

ASG 很少單獨出現，它和 <Term en="Elastic Load Balancing" desc="彈性負載平衡器，把流量平均分給後面多台機器。">ELB</Term> 是黃金搭檔：

- ASG 新開的機器會**自動註冊**到 ELB，立刻開始分擔流量；縮減時也會先從 ELB 取消註冊再關機。
- ASG 可改用 **ELB 健康檢查**：當某台機器被 ELB 判定「不健康」（例如回應逾時），ASG 會**自動終止它並補一台新的**——這就是系統「自我修復」的關鍵。

<Scenario title="真實情境：你負責的電商官網每逢週年慶就掛掉">

老闆抱怨：「平常好好的，一到週年慶首頁就打不開，但我又不想整年都開 10 台機器燒錢。」你的答案就是這篇：把網站放進 **ASG（min=2, max=10）**、用**目標追蹤把 CPU 維持在 50%**，再對週年慶當天加一條**排程式**先暖機。下面帶你做一次基本設定。

</Scenario>

### 🛠️ 動手做：建立一個 CPU 目標追蹤的 ASG

1. 登入 AWS 主控台 → 搜尋 `EC2` → 左側選單找到 **啟動範本（Launch Templates）** → **建立啟動範本**
2. 選好 AMI（系統映像，例如 Amazon Linux）、機型 `t2.micro`、安全群組 → 建立
3. 左側選單點 **Auto Scaling 群組** → **建立 Auto Scaling 群組** → 選剛剛的啟動範本
4. 網路步驟**勾選兩個以上的子網路（分屬不同 AZ）**，讓機器跨 AZ 分散
5. 容量設定：**最小 2、期望 2、最大 10**
6. 擴展策略選 **目標追蹤**，指標選 **平均 CPU 使用率**，目標值填 **50**
7. 建立完成。可用壓力測試工具灌流量，觀察機器數量自動往上長：

```bash
# 查看目前 ASG 裡有幾台機器、分別在哪個 AZ
$ aws autoscaling describe-auto-scaling-groups \
    --auto-scaling-group-names my-web-asg \
    --query "AutoScalingGroups[0].Instances[].{Id:InstanceId,AZ:AvailabilityZone,State:LifecycleState}"
```

<Cost>

Auto Scaling 這個**服務本身免費**，你只要付「實際開出來的 EC2」費用。它真正的省錢價值在於**離峰自動縮減**——不用整天養一堆閒置機器。練習完記得把 ASG 的**期望/最大容量調成 0 或直接刪除 ASG**，否則它會一直幫你維持機器而持續計費。善用 **Free Tier** 的 `t2.micro`。

</Cost>

:::warning[🚑 實務常見錯誤]
- **只放在單一 AZ**：那個 AZ 一掛，整個服務跟著掛，等於沒做到高可用。永遠跨至少 2 個 AZ。
- **最大容量設太小**：尖峰時想加機器卻卡在上限，照樣被打垮。
- **冷卻時間（Cooldown）沒設好**：剛加完機器指標還沒反應，系統又急著再加一批，造成「忽多忽少」的抖動。給它一點緩衝時間。
- **把擴展當成修 Bug 的方法**：程式本身有記憶體洩漏，加再多機器也只是延後崩潰、多燒錢。
:::

<Refs>

- [AWS 官方文件：Amazon EC2 Auto Scaling 使用者指南](https://docs.aws.amazon.com/autoscaling/ec2/userguide/what-is-amazon-ec2-auto-scaling.html)
- [擴展策略類型（目標追蹤 / 階梯 / 簡易）](https://docs.aws.amazon.com/autoscaling/ec2/userguide/scale-your-group.html)
- [目標追蹤擴展策略](https://docs.aws.amazon.com/autoscaling/ec2/userguide/as-scaling-target-tracking.html)

</Refs>

## 下一步

- ⚡ 快速複習：[Domain 2 重點速記 / 閃卡](/saa/domain-2/flashcards)
- ✍️ 測試自己：[Domain 2 原創練習題](/saa/domain-2/quiz)
- 📖 下一篇：[解耦架構（SQS / SNS）](/saa/domain-2/decoupling)
