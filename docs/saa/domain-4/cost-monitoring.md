---
sidebar_position: 4
title: 成本監控與治理：看得到花費，才控得住帳單
---

# 成本監控與治理：看得到花費，才控得住帳單

> 這篇帶你搞懂 AWS 一整套「看帳、控帳、分帳」的工具：怎麼視覺化分析花費、怎麼設預算超過就告警、怎麼把帳單拆給不同部門、怎麼自動抓出暴增的異常，以及多帳號怎麼集中管理省更多。這是 Domain 4 最實用、也最常考「選對監控/治理工具」的題型。

<Vocab title="📌 先認識這篇會出現的名詞（完全沒碰過也能懂）">

- **成本監控（Cost Monitoring）**：就是「**隨時盯著你花了多少錢**」——哪個服務貴、花費有沒有突然暴增，都要看得到。
- **預算（Budget）**：你先訂一個「**這個月最多花多少**」的門檻，超過或快超過就通知你，不讓帳單默默失控。
- **成本分攤（Cost Allocation）**：把一筆總帳「**拆開算給不同部門或專案**」，知道錢到底花在誰身上。
- **標籤（Tag）**：貼在資源上的「**便利貼**」，例如寫上 `部門=行銷`、`專案=官網`，之後就能照便利貼把帳分類。
- **合併帳單（Consolidated Billing）**：把公司很多個 AWS 帳號「**集中成一張總帳單**」付款，還能一起享折扣。
- **右規模（Right-sizing）**：把「**開太大、用不到**」的資源調整成剛剛好的大小，不多花冤枉錢。

</Vocab>

:::note[💬 閱讀小提示]
文章裡只要看到帶<Term desc="像這樣！滑鼠移到有虛線的名詞上（手機點一下），就會跳出白話解釋。">虛線底線的名詞</Term>，把滑鼠移上去就會跳出白話解釋。所有名詞也都整理在 [名詞與服務對照表](/glossary)。
:::

## 為什麼需要成本監控？先講一個月底才發現就太遲的例子

假設你的公司把服務搬上 AWS，沒人特別盯帳。某天財務跑來說：「這個月帳單是上個月的三倍！」你一臉問號，打開帳單看到一堆服務名稱和數字，卻完全看不出**到底是哪個服務、哪個部門、什麼時候開始暴增的**。

問題不是你花太多錢，而是你「**看不到**」。看不到就無法分析、無法歸咎、也無法在暴增當下就止血，只能等月底收到帳單才心痛。成本治理的核心，就是把花費變得**看得到（視覺化）、控得住（預算告警）、拆得清（標籤分攤）、抓得出異常（自動偵測）**。先能看見，才談得上最佳化。

## 一句話先懂這幾個核心工具

- **Cost Explorer**：一張可以拖拉篩選的**花費趨勢圖**，回答「我這陣子錢花去哪、哪個服務最貴」。
- **AWS Budgets**：幫你設**預算門檻**，快超過或已超過就寄信/發通知，回答「別讓我花超過 X 元」。
- **Cost and Usage Report（CUR）**：最細的**帳單明細檔**，一行一行列出每個資源每小時的花費，給要深入分析的人用。
- **Cost Allocation Tags**：靠**標籤把帳拆開**算給部門/專案，回答「這筆錢是誰花的」。
- **Organizations 合併帳單**：把多個帳號**集中成一張總帳單**，一起享量折扣、共享預留方案。
- **Cost Anomaly Detection**：用機器學習**自動盯著花費**，一暴增就通知，不用你盯著圖看。

<Analogy title="🏢 生活比喻：成本工具就像你的家庭記帳三件組">

- **Cost Explorer = 月結消費圖表 App**：打開就看到「這個月餐飲最多、交通次之」，還能拉時間區間比較，一眼看出錢往哪流。
- **AWS Budgets = 信用卡消費上限提醒**：你設「這卡每月刷 3 萬就提醒我」，快到就叮一聲，不讓你不知不覺刷爆。
- **Cost Allocation Tags = 帳本上的分類標記**：每筆支出都標上「房租／伙食／小孩」，月底一算就知道錢花在哪一塊。
- **Cost Anomaly Detection = 盜刷偵測**：系統自己學會你平常的消費習慣，一出現「半夜在國外刷了一大筆」這種異常就馬上通知。

</Analogy>

## 為什麼用它、何時用哪個：五個工具的取捨一次看懂

這幾個工具名字很像、功能又有點重疊，考試最愛考「**這個情境該選哪一個**」。重點不是「它能做什麼」，而是「**為什麼是它、不是旁邊那個**」。下面逐一講白話，每個都給「為什麼選它 / 優點 / 缺點 / 何時別用」。

| 工具 | 為什麼選它（解決什麼） | 優點 | 缺點 / 限制 | 何時反而別用它 |
| --- | --- | --- | --- | --- |
| **Cost Explorer** | 要「用眼睛快速看出錢花去哪、趨勢怎麼走」。這是**人看圖做判斷**的工具。 | 不用設定、開箱即用；可拖拉按維度拆解；內建未來花費**預測**。 | 資料是**彙總**的，看不到逐筆；歷史資料有延遲（約 24 小時）；深度自訂分析做不到。 | 要**逐行帳單明細**、或要用程式／SQL 大量跑分析時 → 該用 CUR。 |
| **AWS Budgets** | 要「**別讓帳單默默爆掉**」——先設門檻，超過或快超過自動告警，是**主動防守**。 | 可對成本／用量／RI·SP 使用率分別設預算；支援**預測型**提前示警；能發 SNS 做自動化。 | 它只**通知**不會自動幫你省或關資源；每帳號只有 2 個免費預算，多了要錢。 | 只是想**事後分析**趨勢（那是 Cost Explorer）、或要自動偵測未知異常（那是 Anomaly Detection）時。 |
| **Cost and Usage Report（CUR）** | 要「**最細、逐行、每資源每小時**」的原始帳單，拿去自己深度分析。 | 顆粒度最細、欄位最全；輸出到 S3 可用 Athena／QuickSight／Redshift 任意分析；適合做自訂報表與回饋計費（chargeback）。 | **沒有現成圖表**，要自己接工具查；資料量大、S3 會產生儲存費；上手門檻高。 | 只想「快速看一眼趨勢」時用它太重 → 那是 Cost Explorer 的活。 |
| **Cost Anomaly Detection** | 要「**不用人盯，花費一異常暴增就自動通知**」——用機器學習抓你平常看不出的突發。 | 免費；自動學習花費樣態；能按服務／帳號／標籤分別設監控器；抓的是**你沒預期到**的暴增。 | 要**累積一段歷史**才學得準；偵測到是「通知」，不會自動止血；對全新、沒歷史的服務較不靈。 | 你**已經知道**上限、只要「超過 X 元就叫我」時 → 那更單純，用 Budgets 就好。 |
| **Organizations 合併帳單** | 要「**多帳號集中管理又更省**」——把整間公司帳號湊在一起付、一起拿折扣。 | 一張總帳單好對帳；用量**加總**更容易達量折扣門檻；RI／SP 可跨帳號**共享**不浪費。 | 需要先把帳號納入 Organizations（治理成本）；省的是「折扣加總」，不是幫你少用資源。 | 只有單一帳號、或各部門堅持獨立計費不共享折扣時，合併的意義就不大。 |

:::info[🔑 一句話記住怎麼選]
**看趨勢用 Cost Explorer、守預算用 Budgets、挖明細用 CUR、抓異常用 Anomaly Detection、多帳號省錢用 Organizations。** 關鍵分辨：Budgets 是「我**已知**的門檻」，Anomaly Detection 是「抓我**未知**的暴增」；Cost Explorer 是「**人看圖**」，CUR 是「**程式挖原始資料**」。
:::

## 看得到：Cost Explorer 與 CUR

<Term en="AWS Cost Explorer" desc="視覺化分析 AWS 花費與用量趨勢的工具，可依服務、帳號、標籤等維度拆解，並能預測未來花費。">Cost Explorer</Term> 是你最常打開的那張圖。它把過去的花費畫成趨勢圖，可以按**服務、帳號、區域、標籤**等維度拆解，馬上看出「哪個服務最貴、哪天開始漲」，還能依歷史趨勢**預測**未來幾個月的花費。它適合「快速分析、找出大戶」，但資料是**彙總過**的，不是逐筆明細。

當你需要「**最細、逐行**」的資料——例如每個資源每小時的用量與費用、拿去自己的資料庫做深度分析——就要用 <Term en="Cost and Usage Report" desc="AWS 最詳細的帳單資料，把每個資源每小時的用量與費用逐行輸出到 S3，供深入分析。">Cost and Usage Report（CUR）</Term>。CUR 會把超細的帳單明細輸出到一個 <Term en="Simple Storage Service" desc="AWS 的物件儲存服務，常拿來存放檔案、備份與資料報表。">S3</Term> 儲存貯體，再搭配 Athena 或 QuickSight 分析。

:::tip[💡 考試重點]
看到關鍵字直接對應工具，幾乎是送分：
- 題目講 **「視覺化分析花費趨勢」「找出花最多錢的服務」「預測未來花費」** → **Cost Explorer**
- 題目講 **「最詳細、逐行的帳單明細」「匯出到 S3 做深入分析」** → **Cost and Usage Report（CUR）**
- 記法：**Cost Explorer = 看圖抓大戶**；**CUR = 挖到最細的原始明細**。
:::

## 控得住：AWS Budgets 與帳單告警

光看圖還不夠，你不可能整天盯著。<Term en="AWS Budgets" desc="設定成本、用量或預留方案使用率的預算門檻，達到或預測將超過時自動告警的服務。">AWS Budgets</Term> 讓你先設門檻，系統幫你盯：

- **成本預算（Cost Budget）**：設「這個月最多花 500 美元」，達到 80%、100% 或**預測將超過**時就告警。
- **用量預算（Usage Budget）**：對「用了多少 GB、多少小時」設上限，不只盯金額也盯用量。
- **預留方案使用率/涵蓋率預算**：盯你買的 <Term en="Reserved Instances" desc="預先承諾使用一段時間以換取折扣的方案，適合長期穩定的工作負載。">預留執行個體（RI）</Term> 有沒有被用好用滿，買了卻閒置就是浪費。

告警可以寄 Email，也能發到 <Term en="Simple Notification Service" desc="AWS 的通知服務，可把訊息推送到 Email、簡訊或其他系統。">SNS</Term> 進一步觸發自動化。另外有個更老派但也常考的作法：在 <Term en="Amazon CloudWatch" desc="AWS 的監控服務，收集各種指標並可設定告警。">CloudWatch</Term> 用 `EstimatedCharges` 這個計費指標設**帳單告警**，超過金額就發通知。兩者都能做到「超過金額就通知」，但 **Budgets 功能更完整**（可對成本、用量、RI/SP 使用率分別設預算），是現在的首選。

## 拆得清：Cost Allocation Tags 與合併帳單

<Term en="Cost Allocation Tags" desc="啟用後可讓標籤出現在帳單與 Cost Explorer，用來把成本分攤到部門、專案或環境。">成本分攤標籤（Cost Allocation Tags）</Term> 是「依專案拆帳」的關鍵。你先在資源貼上標籤（例如 `CostCenter=行銷`、`Project=官網改版`），再到帳單設定把這些標籤「**啟用為成本分攤標籤**」，之後 Cost Explorer 和帳單就能照標籤把花費拆開，老闆問「行銷花了多少」立刻答得出來。

當公司有很多個 AWS 帳號（例如每個部門一個、或開發/正式分開），就用 <Term en="AWS Organizations" desc="集中管理多個 AWS 帳號的服務，可做合併帳單、套用政策與組織治理。">AWS Organizations</Term> 的<Term en="Consolidated Billing" desc="把 Organizations 底下多個帳號的用量合併成一張帳單，共享量折扣與預留方案。">合併帳單（Consolidated Billing）</Term>。它有三個省錢重點：

- **一張總帳單**：所有帳號的花費集中到管理帳號一起付，對帳更簡單。
- **享量折扣（Volume Discount）**：各帳號的用量**加總**計算，更容易達到階梯折扣門檻，等於大家一起湊折扣。
- **RI / Savings Plans 共享**：A 帳號買的預留方案沒用完，可以**自動分享**給 B 帳號用，避免買了閒置的浪費。

:::tip[💡 考試重點]
- 要**依部門/專案拆帳** → **Cost Allocation Tags**（記得要先在帳單設定「啟用」才會生效）。
- **多帳號集中管理又想更省** → **AWS Organizations 合併帳單**（量折扣加總、RI/SP 共享）。
- 常見陷阱題：想省錢又想集中治理多帳號，答案是 **Organizations**，不是去一個一個帳號手動調。
:::

## 抓得出異常：Cost Anomaly Detection 與右規模建議

你不可能每天盯圖。<Term en="AWS Cost Anomaly Detection" desc="用機器學習學習你平常的花費樣態，偵測到異常暴增時自動通知的服務。">Cost Anomaly Detection</Term> 用機器學習**學會你平常的花費樣態**，一旦某個服務或帳號出現「不正常的暴增」就自動通知你——例如有人半夜誤開了一堆大機器、或程式無限迴圈狂打 API。題目只要出現「**自動偵測花費異常暴增**」「不用人工盯著」，答案就是它。

另一個方向是「**找出閒置或過大的資源**」來省錢，這靠兩個建議型服務：

- <Term en="AWS Trusted Advisor" desc="針對成本、效能、安全、容錯等面向給出最佳化建議的服務，成本面會指出閒置或低使用率的資源。">Trusted Advisor</Term>：涵蓋成本、效能、安全、容錯等多面向，成本面會點出「閒置的 EC2、沒掛載的 EBS、利用率過低的資源」。
- <Term en="AWS Compute Optimizer" desc="用機器學習分析實際用量，建議把 EC2、Lambda 等調整成更合適規格的右規模服務。">Compute Optimizer</Term>：專攻**右規模（right-sizing）**，分析 EC2、EBS、Lambda 的實際用量，建議你「這台開太大，降一級就夠，可省 X%」。

:::tip[💡 考試重點：抓浪費的三把刀]
- **自動偵測花費異常暴增** → **Cost Anomaly Detection**
- **找出閒置/低使用率資源（跨多面向建議）** → **Trusted Advisor**
- **針對 EC2/Lambda 做右規模（調到剛好的大小）** → **Compute Optimizer**
:::

## 成本治理工具全景圖解

<div className="flow">
  <div className="flow-node">我想做什麼？</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">看花費趨勢、抓大戶 → Cost Explorer</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">超過金額就告警 → Budgets</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">依部門/專案拆帳 → Cost Allocation Tags</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">自動抓異常暴增 → Cost Anomaly Detection</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">找閒置/過大資源 → Trusted Advisor／Compute Optimizer</div>
</div>

*圖：先問「你的目標是看、是控、是拆、還是抓浪費」，再沿著這條路往下收斂到最合適的工具。*

## 實務應用：不只是考試

<Scenario title="真實情境：老闆說『帳單這個月突然多了一倍，給我查清楚是誰花的』">

你打開 Cost Explorer，按**服務**維度拆解，發現暴增集中在 EC2；再按**標籤**拆解，發現是 `Project=資料分析` 這個專案的機器在上週五突然多開了十台。原來是某位同事跑完測試忘了關。你一邊請他關機，一邊想：這種事不能每次都靠人工發現。於是你設一個 **Budgets** 預算門檻（每月 1000 美元、達 80% 就寄信），再開啟 **Cost Anomaly Detection** 自動盯著；下次還沒等月底、暴增當天你就會收到通知。下面帶你把這道「預算告警」設起來。

</Scenario>

### 🛠️ 動手做：設一個成本預算，超過就寄信通知

1. AWS 主控台搜尋 `Billing` → 左側進入 **Budgets（預算）** → 按 **建立預算**。
2. 預算類型選 **成本預算（Cost budget）**，期間選 **每月（Monthly）**。
3. 設定預算金額，例如 `1000` 美元（可選「固定金額」或「依歷史自動抓」）。
4. 新增**告警門檻**：例如實際花費達 `80%` 時告警一次、達 `100%` 再告警一次；也可勾「**預測將超過**」提前示警。
5. 填收件 Email（或選一個 SNS 主題），儲存。
6. （加分）到 **Cost Anomaly Detection** 建立一個監控器，選擇要盯的服務或整個帳號，設定異常通知的收件人。

```bash
# 查看目前帳號底下已建立的預算清單（需帶管理帳號 ID）
$ aws budgets describe-budgets \
    --account-id 你的12位數帳號ID
```

**用 CLI 一次把「預算 + 80% 告警寄信」建起來**：主控台點一點很直覺，但面試／實務常要可重複執行的腳本。下面用 `create-budget` 建一個「每月 1000 美元」的成本預算，並同時掛一個「實際花費達 80% 就寄 Email」的告警（AWS CLI 收兩個 JSON：`--budget` 定義預算本體、`--notifications-with-subscribers` 定義告警＋收件人）。

```bash
# 建立「每月 1000 美元」成本預算，並設定達 80% 寄信告警
$ aws budgets create-budget \
    --account-id 你的12位數帳號ID \
    --budget '{
      "BudgetName": "monthly-1000usd",
      "BudgetType": "COST",
      "TimeUnit": "MONTHLY",
      "BudgetLimit": { "Amount": "1000", "Unit": "USD" }
    }' \
    --notifications-with-subscribers '[
      {
        "Notification": {
          "NotificationType": "ACTUAL",
          "ComparisonOperator": "GREATER_THAN",
          "Threshold": 80,
          "ThresholdType": "PERCENTAGE"
        },
        "Subscribers": [
          { "SubscriptionType": "EMAIL", "Address": "you@example.com" }
        ]
      }
    ]'
```

**預期結果**：指令**沒有輸出任何錯誤、直接回到提示字元**就代表建立成功（`create-budget` 成功時不回傳內容）。接著再跑一次上面的 `describe-budgets`，就會在清單裡看到 `"BudgetName": "monthly-1000usd"`，`BudgetLimit` 是 1000 USD。之後當這個月實際花費超過 800 美元（1000 的 80%），你填的那個 Email 就會收到 AWS Budgets 寄來的告警信。把 `NotificationType` 改成 `FORECASTED` 就變成「**預測**本月將超過」的提前示警。

:::note[🔑 ACTUAL vs FORECASTED]
`NotificationType` 兩種值的差別常考：**`ACTUAL`** 是「已經實際花到門檻」才告警（亡羊補牢）；**`FORECASTED`** 是 Budgets 依趨勢**預測**本週期將超過就提前通知（還來得及止血）。實務上**兩個都設**：低門檻的 FORECASTED 提早警示、100% 的 ACTUAL 做最後防線。
:::

<Cost>

**好消息：這些監控工具本身大多很便宜或免費。** Cost Explorer 的主控台介面免費（呼叫它的 API 才按次計費）；每個帳號有**兩個免費的成本/用量預算**，超過才按每日計費；Cost Anomaly Detection **免費**；Trusted Advisor 的成本檢查**免費**基本項目（完整檢查需 Business 以上支援方案）；Compute Optimizer **免費**。真正會花錢的是 **CUR 輸出到 S3** 的那個 S3 儲存費。練習完記得把測試用的預算與 CUR 的 S3 物件清一清。

</Cost>

:::warning[🚑 常踩雷]
- **從沒設 Budgets 告警，帳單爆了才發現**：這是最痛也最常見的雷。沒有任何門檻通知，你只能等**月底帳單**才知道中招，中間可能已經多燒好幾天。**上雲第一件事就是先設一個 Budgets 告警**（哪怕只是個粗略金額），把「被動收帳單」變成「主動被通知」。
- **沒打成本分攤標籤，事後無法歸屬**：標籤只對「**啟用之後**產生的用量」生效，**不會回溯**。等老闆問「行銷部門花了多少」你才想到要標，過去幾個月的帳就**永遠拆不出來**了。資源一建立就該養成貼 `CostCenter` / `Project` 標籤的習慣。
- **以為 Cost Explorer 能看逐筆，其實要用 CUR**：Cost Explorer 的資料是**彙總**過的，你在上面永遠看不到「某台 EC2 在某小時花了多少」這種逐行明細。需要逐筆／每資源每小時／要用 SQL 跑的分析，一律是 **CUR 輸出到 S3 + Athena**，別在 Cost Explorer 上硬鑽。
- **貼了標籤卻忘了啟用**：Cost Allocation Tags 要在帳單設定裡「啟用」才會出現在成本報表，光貼標籤不會自動拆帳。
- **只設 100% 才告警**：等真的超支才通知已經來不及，記得一併設 **預測型** 與較低門檻（如 80%）提前示警。
- **以為合併帳單會自動省**：量折扣與 RI/SP 共享是把多帳號用量「加總」才划算，前提是真的有把帳號都納入 Organizations。
- **買了 RI/SP 卻閒置**：沒用到的預留方案照樣付錢，記得用 Budgets 的 **RI 使用率/涵蓋率預算** 盯著。
- **只看不動手**：Cost Explorer 看到大戶、Compute Optimizer 給了右規模建議，卻從不真的去調整，省錢只停在報表上。
:::

<Refs>

- [AWS Cost Explorer 使用者指南](https://docs.aws.amazon.com/cost-management/latest/userguide/ce-what-is.html)
- [AWS Budgets 管理你的成本](https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html)
- [AWS Cost and Usage Report（CUR）](https://docs.aws.amazon.com/cur/latest/userguide/what-is-cur.html)
- [使用成本分攤標籤](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/cost-alloc-tags.html)
- [AWS Organizations 合併帳單](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/consolidated-billing.html)
- [AWS Cost Anomaly Detection](https://docs.aws.amazon.com/cost-management/latest/userguide/getting-started-ad.html)
- [AWS Compute Optimizer 使用者指南](https://docs.aws.amazon.com/compute-optimizer/latest/ug/what-is-compute-optimizer.html)

</Refs>

## 下一步

- ⚡ 快速複習：[Domain 4 重點速記 / 閃卡](/saa/domain-4/flashcards)
- ✍️ 測試自己：[Domain 4 原創練習題](/saa/domain-4/quiz)
- 📖 下一篇：[資料庫與網路成本](/saa/domain-4/database-network-cost)
