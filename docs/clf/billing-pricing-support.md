---
sidebar_position: 5
title: 帳務、定價與支援（Billing, Pricing & Support）
---

# 帳務、定價與支援：搞懂 AWS 怎麼算錢、怎麼幫你

> 這是 CLF 四大領域裡權重最小的一塊（**12%**），但考題很好拿分，因為幾乎都是觀念題：AWS 怎麼定價、花錢前後有哪些工具幫你盯著、出事時可以找誰。這篇用最白話的方式帶你把這三件事一次搞懂。

:::note[💬 閱讀小提示]
文章裡只要看到帶<Term desc="像這樣！滑鼠移到有虛線的名詞上（手機點一下），就會跳出白話解釋。">虛線底線的名詞</Term>，把滑鼠移上去就會跳出白話解釋。細節數字一律以官方為準。
:::

## 一、AWS 定價的三個基本原則

AWS 的收費方式看起來項目很多，但背後其實只有三個精神。把這三條記住，大部分定價題都能用常識判斷。

1. **按用量付費（Pay-as-you-go）**：用多少付多少，像水電費——沒用就不收，不用預先買一大筆。好處是彈性、不浪費。
2. **預留（承諾）換折扣**：如果你確定會長期穩定使用，願意先**承諾用 1 年或 3 年**，AWS 就給你明顯的折扣。用承諾換便宜。
3. **用越多、單價越低（量折扣）**：某些服務（例如 S3 儲存）用量累積到一定級距後，**超過的部分單價會自動變便宜**，規模越大越划算。

:::tip[💡 一句話記法]
**不確定就按量用、確定就承諾換折扣、用很多自然更便宜。** 這三句話就是 AWS 定價的全部精神。
:::

## 二、運算的計費模式

同一台 EC2 <Term en="Instance" desc="執行個體，你租來的一台虛擬機器。開著就計費，關掉或終止才停止。">執行個體</Term>，可以用不同的「付款方案」來租，省錢幅度差很多。CLF 只要你**聽得懂每種模式在幹嘛、什麼情況用哪個**，不會考細部折扣數字。

| 模式 | 白話解釋 | 適用情境 |
| --- | --- | --- |
| **On-Demand（隨需）** | 開多久算多久，不用承諾，最有彈性也最貴 | 短期、臨時、用量還不確定的時候 |
| **Reserved Instances（預留執行個體，RI）** | 先承諾用 1 或 3 年，換取明顯折扣 | 長期穩定、可預測的固定負載 |
| **Savings Plans（節省方案）** | 承諾「每小時花多少錢」而非綁特定機型，比 RI 更有彈性 | 長期穩定但又想保留換機型／區域的彈性 |
| **Spot（競價）** | 用 AWS 的閒置資源，最便宜，但 AWS 可隨時收回 | 可被中斷、容錯的批次或測試工作 |
| **Dedicated Host（專用主機）** | 整台實體伺服器專門給你用 | 軟體授權綁實體機、或法規要求專用硬體 |

:::tip[💡 CLF 怎麼判斷]
「**短期、不確定**」→ On-Demand；「**長期穩定要省錢**」→ Reserved Instances 或 Savings Plans；「**想要更彈性**」→ Savings Plans；「**可中斷、要最便宜**」→ Spot。Dedicated Host 聽過即可，知道它是「整台實體機專用」就夠。
:::

## 三、成本管理工具

AWS 給了一整套免費工具，讓你在**花錢之前先估、花錢之後能看、超標時有人叫**。CLF 很愛考「哪個情境該用哪個工具」。

| 工具 | 用途 |
| --- | --- |
| **AWS Pricing Calculator（定價計算器）** | **還沒開服務之前**，先估算這樣用大概要花多少錢 |
| **Cost Explorer（成本探索器）** | 把**過去的花費**畫成趨勢圖，按服務、區域拆開看錢花在哪 |
| **AWS Budgets（預算）** | 先設一個金額或用量門檻，**接近或超過就寄信告警** |
| **Cost and Usage Report（成本與用量報告，CUR）** | 匯出**最細、每資源每小時**的原始明細，供深度分析與稽核 |
| **Cost Anomaly Detection（成本異常偵測）** | 用機器學習**自動抓出沒預期到的暴衝花費**並通知你 |

:::tip[💡 關鍵字對應]
「**估價（還沒用）**」→ Pricing Calculator；「**看歷史、視覺化**」→ Cost Explorer；「**超過門檻就告警**」→ Budgets；「**最細的原始明細**」→ Cost and Usage Report；「**自動發現異常暴衝**」→ Cost Anomaly Detection。
:::

<Cost title="💰 成本提醒">

上面這些工具**本身幾乎都免費**：Pricing Calculator、主控台裡的 Cost Explorer 看圖、Budgets（每個帳號有免費的預算額度）、Cost Anomaly Detection 都不用額外付錢。真正會花錢的是你拿來跑的那些資源——所以養成「**用前估、用後看、超標有告警**」的習慣，才是省錢的根本。

</Cost>

## 四、帳號與帳單治理

當你不只一個帳號時，就需要集中管理錢與權限。CLF 會考兩個重點：**合併帳單**和**成本分配標籤**。

### AWS Organizations 與合併帳單（Consolidated Billing）

<Term en="AWS Organizations" desc="用來集中管理多個 AWS 帳號的服務，可做合併帳單、統一套用政策。">AWS Organizations</Term> 讓你把公司底下多個 AWS 帳號集中管理，其中最實用的就是**合併帳單**——所有帳號的費用合成**一張總帳單**。好處不只是方便付款：

- **量折扣加總**：各帳號的用量會**合併計算**，更容易達到「用越多單價越低」的折扣級距，整體更省。
- **共享預留**：某個帳號買的 Reserved Instances／Savings Plans 若沒用滿，**其他帳號可以共用**剩下的折扣，不浪費。

### 成本分配標籤（Cost Allocation Tags）

<Term en="Cost Allocation Tags" desc="貼在資源上的標籤，啟用後可在帳單中依標籤分組，看出各部門、專案各花多少。">成本分配標籤</Term> 就是幫資源「**貼標籤**」（例如 `部門=行銷`、`專案=官網`）。啟用後，帳單和 Cost Explorer 就能**依標籤分組**，一眼看出「哪個部門、哪個專案花了多少錢」，方便內部分攤與追蹤。

:::info[細節以官方為準]
合併帳單的量折扣與共享預留規則可能隨服務調整，實際適用方式請以 [AWS Organizations 官方文件](https://docs.aws.amazon.com/organizations/) 為準。
:::

## 五、支援方案

AWS 提供四種 <Term en="AWS Support Plans" desc="AWS 的技術支援方案，依回應速度、支援範圍與是否配有專屬技術經理分級收費。">支援方案</Term>，差別主要在**回應速度、支援範圍**，以及高階方案才有的**專屬技術客戶經理（TAM）**。

| 支援方案 | 包含什麼 | 關鍵差異 |
| --- | --- | --- |
| **Basic（基本）** | 所有帳號**免費**內建：客服文件、白皮書、論壇，以及帳單問題與服務健康狀態 | 不含技術問題支援 |
| **Developer（開發者）** | 可開技術支援案件（僅限 Email、上班時間） | 適合開發／測試環境，回應較慢 |
| **Business（商業）** | 24／7 技術支援（電話、Email、Chat），完整的 Trusted Advisor 檢查 | 適合正式環境，回應更快 |
| **Enterprise（企業）** | 最高等級支援、最快回應，並**配有專屬技術客戶經理（TAM）** | **唯一含 TAM**，適合關鍵業務 |

:::note[什麼是 TAM？]
<Term en="Technical Account Manager (TAM)" desc="專屬技術客戶經理，AWS 指派給你的專人，協助架構建議、成本最佳化與主動健檢。">TAM（專屬技術客戶經理）</Term> 是 AWS 指派給你的「專屬窗口」，會主動幫你做架構建議、成本檢視與健檢。**只有 Enterprise 方案才有 TAM**——這是超高頻考點。
:::

### Trusted Advisor 在不同方案的檢查範圍

<Term en="AWS Trusted Advisor" desc="自動掃描你的帳號，依最佳實務在成本、效能、安全、容錯、服務限制等面向提出建議的工具。">Trusted Advisor</Term> 會自動依最佳實務幫你的帳號做健檢（成本、效能、安全、容錯、服務限制等），但**能看到幾項檢查，要看你的支援方案**：

- **Basic／Developer**：只開放**核心的少數檢查**（含部分安全與服務限制項目）。
- **Business／Enterprise**：解鎖**全部的 Trusted Advisor 檢查**，建議最完整。

:::tip[💡 CLF 常考點整理]
- **免費方案（Free Tier）**：新帳號的試用額度，練習前先搞懂哪些免費。
- **Budgets 告警**：想在成本或用量超標時收到通知，就用 Budgets。
- **合併帳單好處**：量折扣加總、共享預留，整體更省也更好管理。
- **哪個支援方案有 TAM**：只有 **Enterprise**（專屬技術客戶經理）。
- **Pricing Calculator**：還沒開服務前要**估價**，就用它。
:::

:::info[費用與方案細節以官方為準]
支援方案的價格、包含項目與回應時間可能隨時調整，實際內容請以 [AWS Support 方案官方頁面](https://aws.amazon.com/premiumsupport/plans/) 為準。
:::

<Refs title="📚 官方資料與延伸閱讀">

- [AWS 定價原則與雲端經濟學](https://aws.amazon.com/pricing/)
- [AWS Pricing Calculator（定價計算器）](https://calculator.aws/)
- [AWS 成本管理（Cost Explorer／Budgets）](https://aws.amazon.com/aws-cost-management/)
- [AWS Organizations 合併帳單](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_accounts_billing.html)
- [AWS Support 方案比較](https://aws.amazon.com/premiumsupport/plans/)
- [AWS Trusted Advisor](https://aws.amazon.com/premiumsupport/technology/trusted-advisor/)

</Refs>

👉 來測驗自己：[CLF 原創練習題](./clf-quiz.md)
