---
sidebar_position: 3
title: 部署策略（藍綠、金絲雀、滾動）
---

# 部署策略：怎麼把新版推上線，又能在出事時快速逃生

> 本篇用「開發者視角」帶你搞懂部署策略：就地（in-place）、滾動（rolling）、藍綠（blue/green）、金絲雀（canary）／線性（linear）各自怎麼運作、會不會停機、風險多大、回復（rollback）快不快，以及在 AWS 上怎麼落地——CodeDeploy 的部署設定、Lambda 別名加權流量切換、ECS 藍綠、Elastic Beanstalk 部署政策。這是 DVA-C03 Domain 3（測試與部署，22%）的高頻考點，考的是「情境給你，你選哪種、為什麼」。

<Vocab title="📌 先認識這篇會出現的名詞（完全沒碰過也能懂）">

- **部署（Deployment）**：把你寫好的新版程式碼，實際推上去取代線上正在跑的舊版，讓使用者用到新版。
- **就地部署（In-place）**：不另外開機器，直接在**現有的伺服器上**把舊版換成新版。省資源，但換的當下可能短暫不能服務。
- **滾動部署（Rolling）**：把一群伺服器分成好幾批，**一批一批**慢慢換新版，而不是一次全換。
- **藍綠部署（Blue/Green）**：同時準備兩套環境——**藍（現行舊版）**與**綠（全新新版）**，驗證綠沒問題後，把流量**一次切**到綠。
- **金絲雀部署（Canary）**：先放**一小撮**流量（例如 10%）到新版試水溫，觀察沒問題再把剩下的切過去。名字來自礦工用金絲雀偵測毒氣。
- **回復（Rollback）**：新版出事時，把流量／程式**退回舊版**的動作。回復越快，使用者受影響越短。
- **停機時間（Downtime）**：部署過程中服務「不能用」的那段時間。好的策略追求**零停機（zero-downtime）**。

</Vocab>

:::note[💬 閱讀小提示]
文章裡只要看到帶<Term desc="像這樣！滑鼠移到有虛線的名詞上（手機點一下），就會跳出白話解釋。">虛線底線的名詞</Term>，把滑鼠移上去就會跳出白話解釋。所有名詞也都整理在 [名詞與服務對照表](/glossary)。
:::

## 為什麼部署策略這麼重要？因為「上線」和「出事」都會發生

想像你半夜把新版金流程式一次全部換上去，結果有個 bug 讓每筆付款都失敗。這時你最想要的兩件事是：**（1）出事前只影響一小部分人、（2）出事後能用最快速度退回舊版。**

部署策略要同時平衡三件事，而且常常互相拉扯：

- **速度**：能不能快速把新版推上線？
- **風險（爆炸半徑）**：如果新版有 bug，會一次影響多少使用者？
- **回復速度**：發現不對勁，能多快退回安全的舊版？

還有第四件被成本牽制：要不要為此**多開一整套環境**（藍綠就是這樣）。沒有「最好」的策略，只有「這個情境最適合」的策略——這正是 DVA 考試愛問的：給你一段情境（要求零停機？能不能接受雙倍成本？要不要先小流量驗證？），問你選哪一種。

## 四種核心策略：怎麼運作、停機、風險、回復速度

### 1. 就地部署（In-place）

直接在**現有的伺服器**上把舊版停掉、裝上新版、再啟動。不開新機器，最省資源。

- **停機**：換的那一刻，被換的伺服器**短暫不能服務**。若一次全換，就是全站短暫停機。
- **風險**：新版有問題時，**整批機器都已經是新版**，爆炸半徑大。
- **回復**：慢。要退回舊版得**再部署一次舊版**（又一輪就地替換），不能瞬間切回。
- **一句話**：最省錢，但停機與回復都最不理想。適合**非正式環境**或能接受短暫停機的內部工具。

### 2. 滾動部署（Rolling）

把機器分成好幾批（例如每次換 25%），**一批換好、健康檢查通過，再換下一批**。換的過程舊版還在服務剩下的機器，所以能做到**接近零停機**。

- **停機**：接近零停機（總有一部分機器在服務）。
- **風險**：比就地小——出事時可能只有部分批次是新版。但部署中途會**新舊版同時在線**，要能並存。
- **回復**：中等。要退回得再滾一輪舊版，比藍綠慢。
- **變體**：「**滾動加額外批次（rolling with additional batch）**」會先多開一批新機器再開始滾，確保全程維持滿額容量，代價是過程中機器數量稍微超出。

### 3. 藍綠部署（Blue/Green）

準備**兩套完整環境**：**藍**是現在正在服務的舊版，**綠**是部署好、測好的新版。驗證綠沒問題後，把流量**一次性切換**（通常改路由／負載平衡器指向，或 DNS）到綠。

- **停機**：零停機（切換是瞬間的）。
- **風險**：切之前綠可以**完整測試**；切之後若出事，爆炸半徑可能是全部流量（除非搭配金絲雀）。
- **回復**：**最快**。舊版（藍）整套還留著，出事就把流量**切回藍**，幾乎瞬間完成。
- **代價**：部署期間要**同時養兩套環境**，成本接近雙倍。

<Analogy title="🏢 生活比喻：藍綠就像搬到隔壁新裝潢好的店面">

- **藍 = 現在營業中的舊店**：客人照常上門。
- **綠 = 隔壁剛裝潢好、還沒開門的新店**：你可以先進去把水電、收銀、菜單全部測一遍，客人完全不受影響。
- **切換 = 把招牌和大門指向新店**：測好後一聲令下，所有客人改走新店。
- **回復 = 新店出狀況，馬上把大門指回舊店**：舊店根本沒關，所以能瞬間切回——這就是藍綠回復最快的原因。

</Analogy>

### 4. 金絲雀（Canary）／線性（Linear）

這其實是「**怎麼切流量**」的細緻做法，常疊在藍綠之上：不要一次把 100% 流量切到新版，而是**分階段**切。

- **金絲雀（Canary）**：先切**一小撮**（例如 10%）到新版，**暫停觀察**一段時間（監控錯誤率、延遲），確認健康，再把**剩下的 90% 一次切過去**。兩階段。
- **線性（Linear）**：**等比例、分多次**慢慢加（例如每 1 分鐘加 10%，共 10 次切完）。多階段、更平滑。

{/* 兩者差別：金絲雀是「一小撮 → 剩下全部」兩步；線性是「每次加固定比例」多步。 */}

- **停機**：零停機。
- **風險**：**最小**。只有金絲雀階段的那一小撮使用者會先碰到 bug，爆炸半徑被壓到最低。
- **回復**：快，而且通常**可以自動化**——搭配 CloudWatch 警報，錯誤率一超標就**自動回復**，不用人盯著。
- **代價**：上線時間較長（要等觀察），且**一定要設好監控與警報**，否則「先放 10%」卻沒人看、沒自動回復，等於白做。

## 在 AWS 上怎麼落地

同一套策略名詞，在不同 AWS 服務有不同的實作入口。DVA 會考你「這個服務用什麼機制做藍綠／金絲雀」。

### CodeDeploy 的部署設定（Deployment Configuration）

<Term en="AWS CodeDeploy" desc="AWS 的自動化部署服務，把新版程式推到 EC2、Lambda、ECS，並內建就地/藍綠、金絲雀/線性等部署設定。">CodeDeploy</Term> 用**部署設定**決定「流量怎麼轉移」。它有一組內建設定，也能自訂：

| 運算平台 | 內建部署設定（舉例） | 含義 |
| --- | --- | --- |
| **EC2／On-Premises** | `CodeDeployDefault.AllAtOnce` | 一次全換（等於就地一次全上） |
| | `CodeDeployDefault.HalfAtATime` | 一次換一半（滾動） |
| | `CodeDeployDefault.OneAtATime` | 一次換一台（最保守的滾動） |
| **Lambda／ECS** | `CodeDeployDefault.LambdaCanary10Percent5Minutes` | 先切 10%，等 5 分鐘再切其餘（金絲雀） |
| | `CodeDeployDefault.LambdaLinear10PercentEvery1Minute` | 每 1 分鐘加 10%（線性） |
| | `CodeDeployDefault.LambdaAllAtOnce` | 一次全切 |

命名規則很好記：**`平台 + Canary/Linear/AllAtOnce + 百分比 + 時間`**。看到 `Canary10Percent5Minutes` 就是「先 10%、等 5 分鐘、再全切」。

:::info[🔑 CodeDeploy 的 AppSpec 與生命週期鉤子]
CodeDeploy 靠一個 `appspec.yml` 描述怎麼部署，裡面可掛**生命週期鉤子（lifecycle hooks）**跑你的 Lambda 驗證函式。對 Lambda／ECS 藍綠，關鍵鉤子是 **`BeforeAllowTraffic`**（切流量前驗證）與 **`AfterAllowTraffic`**（切流量後驗證）。驗證不過，CodeDeploy 會**自動回復**。這是把「金絲雀 + 自動回復」做成自動化的核心。
:::

### Lambda 別名加權流量切換（canary／linear）

Lambda 用**版本 + 別名**天然支援加權流量切換：別名可同時指向兩個版本並給權重。手動做金絲雀就是調整別名權重；用 CodeDeploy 做就是選上面的 `LambdaCanary.../LambdaLinear...` 設定，由它自動推進權重。

```bash
# 發佈新版本 2（對 $LATEST 拍不可變快照）
aws lambda publish-version --function-name order-api

# 金絲雀：prod 別名 90% 指向版本 1、10% 導到版本 2
aws lambda update-alias \
  --function-name order-api \
  --name prod \
  --function-version 1 \
  --routing-config AdditionalVersionWeights={"2"=0.1}
```

### ECS 藍綠（搭配 CodeDeploy）

<Term en="Elastic Container Service" desc="AWS 的容器編排服務，跑你的 Docker 容器。可搭配 CodeDeploy 做藍綠部署。">ECS</Term> 做藍綠時，CodeDeploy 會在**新的目標群組（target group）**啟動一組新版任務（綠），透過 **Application Load Balancer** 把測試流量導過去驗證，驗證通過再把正式監聽器（listener）切到綠的目標群組。出事時把監聽器切回藍的目標群組即可回復。

### Elastic Beanstalk 部署政策（Deployment Policies）

<Term en="Elastic Beanstalk" desc="AWS 的 PaaS 平台，上傳程式碼就幫你管機器、負載平衡與擴充；內建多種部署政策。">Elastic Beanstalk</Term> 把策略包成**部署政策**，建環境時就能選：

| 政策 | 行為 | 停機 | 回復 |
| --- | --- | --- | --- |
| **All at once** | 一次全換（就地） | 有短暫停機 | 需重新部署舊版 |
| **Rolling** | 分批換現有機器 | 接近零停機，過程**容量下降** | 需再滾一輪 |
| **Rolling with additional batch** | 先多開一批再滾 | 零停機、**維持滿額容量** | 需再滾一輪 |
| **Immutable** | **全新開一組**新機器，通過健康檢查才切 | 零停機、風險低 | 很快（砍掉新機器即可） |
| **Traffic splitting** | 在 immutable 基礎上先導**一小撮**流量驗證 | 零停機 | 快（金絲雀式） |

:::tip[💡 考試重點：Beanstalk 政策速記]
- 要**最省**、能接受停機 → **All at once**。
- 要**零停機又不想降容量** → **Rolling with additional batch** 或 **Immutable**。
- 要**最安全、好回復** → **Immutable**（新機器另起爐灶，壞了直接丟）。
- 要**先小流量驗證（金絲雀）** → **Traffic splitting**。
- Beanstalk 本身**沒有**名叫「Blue/Green」的政策；它的藍綠做法是另建一個環境再用 **Swap Environment URLs（交換環境網址）** 把 CNAME 對調。
:::

## 哪種策略怎麼選：為什麼用它、優缺點、何時用哪個

這是本篇最該記熟的固定段落。考試常把「停機容忍度、成本、是否要小流量驗證、回復速度」包進情境裡問你選哪個。

| 策略 | 為什麼用它 | 優點 | 缺點 | 何時用它 | 何時別用 |
| --- | --- | --- | --- | --- | --- |
| **就地（In-place）** | 最省資源、最簡單 | 不用多開環境、成本最低 | 換的當下停機、回復要重部署、爆炸半徑大 | 非正式環境、能接受短暫停機的內部工具 | 正式、對停機敏感的服務 |
| **滾動（Rolling）** | 用現有機器做到接近零停機 | 不需雙倍環境、比就地安全 | 回復較慢、過程新舊並存且**容量可能下降**、要能相容 | 一般正式服務、成本敏感又想要近零停機 | 要求「出事秒退回」的高風險變更 |
| **藍綠（Blue/Green）** | 零停機 + **最快回復** | 切前完整測試、出事一鍵切回舊環境 | **成本接近雙倍**（養兩套）、資料庫等共用狀態要處理 | 高可用正式服務、要求快速安全回復、金流等關鍵系統 | 預算吃緊、或變更很小不值得開兩套 |
| **金絲雀／線性（Canary/Linear）** | **把爆炸半徑壓到最小** | 只影響一小撮使用者、可搭警報**自動回復** | 上線較慢、**一定要有監控與警報** | 風險高的變更、面向大量使用者、想真流量驗證 | 沒有監控警報、或要求立刻 100% 上線 |

<Scenario title="真實情境：用情境關鍵字反推該選哪種">

- 題目說「**不能有任何停機**、**出事要能最快回到舊版**、預算允許」→ **藍綠**。
- 題目說「**要先讓一小部分真實使用者**試用新版、錯誤率一高就**自動回復**」→ **金絲雀 + CloudWatch 警報**。
- 題目說「**不想多付一整套環境的錢**，但也要**近乎零停機**」→ **滾動**（或 Beanstalk 的 rolling with additional batch）。
- 題目說「這是內部測試工具，**短暫停機沒差**，要最省」→ **就地 / All at once**。

</Scenario>

## 🛠️ 動手做：用 CodeDeploy 幫 Lambda 做金絲雀 + 自動回復

這個流程把「先放 10%、警報一響就自動退回」落到實際設定。假設你已有一個 Lambda 函式 `order-api` 與 `prod` 別名。

```yaml
# appspec.yml — 告訴 CodeDeploy 這次要把 prod 別名從版本 1 切到版本 2
version: 0.0
Resources:
  - myFunction:
      Type: AWS::Lambda::Function
      Properties:
        Name: order-api
        Alias: prod
        CurrentVersion: 1
        TargetVersion: 2
Hooks:
  # 切流量「之前」跑驗證函式；不過就不切、直接失敗
  - BeforeAllowTraffic: validate-before
  # 切流量「之後」再跑一次驗證
  - AfterAllowTraffic: validate-after
```

```bash
# 建一個部署群組，指定金絲雀設定 + 綁一個 CloudWatch 警報做自動回復
aws deploy create-deployment-group \
  --application-name order-api-app \
  --deployment-group-name order-api-dg \
  --deployment-config-name CodeDeployDefault.LambdaCanary10Percent5Minutes \
  --service-role-arn arn:aws:iam::111122223333:role/CodeDeployRole \
  --alarm-configuration enabled=true,alarms=[{name=order-api-5xx-errors}] \
  --auto-rollback-configuration enabled=true,events=DEPLOYMENT_FAILURE,DEPLOYMENT_STOP_ON_ALARM
```

**預期結果**：

- 部署一啟動，`prod` 別名會把 **10%** 流量導到版本 2、**90%** 留在版本 1；`BeforeAllowTraffic` 的驗證函式先跑過。
- **等 5 分鐘**觀察期間，若 CloudWatch 警報 `order-api-5xx-errors` **沒有**觸發，CodeDeploy 會把剩下 **90%** 一次切到版本 2，部署狀態變 **Succeeded**。
- 若觀察期間 5xx 錯誤飆高、警報進入 **ALARM**，CodeDeploy 會**自動回復**：別名瞬間切回 **100% 版本 1**，部署狀態變 **Stopped / Rolled back**，受影響的只有那 10% 的幾分鐘。

<Cost>

**藍綠在部署期間成本接近雙倍**，因為同時養兩套環境；切換完成、確認沒問題後**記得清掉舊（藍）環境**，別兩套一直開著燒錢。金絲雀／線性本身幾乎不增加成本（同一套環境調流量比例），但**一定要有 CloudWatch 警報**才有意義——警報本身費用極低，卻是自動回復的命脈。CodeDeploy 對 EC2／On-Premises 以外（Lambda、ECS）大多無額外費用，你付的是底層運算資源。練習完把測試用的部署群組、額外環境、警報清一清。

</Cost>

:::warning[🚑 常踩雷]
- **以為就地部署能快速回復**：就地要退回舊版得**再部署一次**，不是瞬間切換。要「秒退回」請用**藍綠**（切回藍）或**金絲雀自動回復**。
- **忘了藍綠成本雙倍**：部署期間兩套環境並存，切完沒清掉舊環境會長期多付錢。
- **資料庫 schema 變更破壞回復**：程式可以切回舊版，但**資料庫改了回不去**。若新版做了破壞性的 schema 變更（改欄位型別、刪欄位），回復舊版程式會因為對不上 schema 而壞掉。要做**向後相容的漸進式 schema 變更**（先加不刪、兩版都能跑），回復才真的安全。
- **金絲雀沒設自動回復警報**：只「先放 10%」卻沒綁 CloudWatch 警報、沒人盯著，等於沒把風險控制起來——出事還是會慢慢擴散。金絲雀的價值一半在**監控 + 自動回復**。
- **忽略 session／狀態**：藍綠／滾動切換時，若使用者 session 綁在某台機器（sticky session）或存在本機記憶體，切過去會**掉登入狀態**。狀態要外移到 **ElastiCache／DynamoDB** 等共用儲存，部署切換才不會踢掉使用者。
:::

<Refs title="📚 官方資料與延伸閱讀">

- [CodeDeploy 部署設定（Deployment Configurations）](https://docs.aws.amazon.com/codedeploy/latest/userguide/deployment-configurations.html)
- [CodeDeploy 藍綠部署概觀](https://docs.aws.amazon.com/codedeploy/latest/userguide/welcome.html#welcome-deployment-overview-blue-green)
- [Lambda 加權別名流量切換](https://docs.aws.amazon.com/lambda/latest/dg/configuration-aliases.html)
- [ECS 使用 CodeDeploy 的藍綠部署](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/deployment-type-bluegreen.html)
- [Elastic Beanstalk 部署政策與設定](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/using-features.deploy-existing-version.html)

</Refs>

## 下一步

👉 下一篇：[容器建置與部署](./containers-deploy.md)
