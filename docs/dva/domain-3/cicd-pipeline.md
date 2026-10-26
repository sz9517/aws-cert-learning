---
sidebar_position: 1
title: CI/CD 持續整合與部署
---

# CI/CD：用 CodePipeline + CodeBuild + CodeDeploy 把「上版」變成按一個鈕

> 本篇用「開發者視角」帶你搞懂 AWS 原生的 CI/CD 三件套：**CodePipeline 負責編排**（把流程串成一條管線）、**CodeBuild 負責建置與測試**（看 `buildspec.yml`）、**CodeDeploy 負責部署**（看 `appspec.yml`），再加上套件庫 **CodeArtifact** 與原始碼來源。DVA-C03 Domain 3（測試與部署，佔 22%）最愛考「哪個服務做哪件事」「buildspec／appspec 寫什麼」「權限與 artifact 怎麼傳」。

<Vocab title="📌 先認識這篇會出現的名詞（完全沒碰過也能懂）">

- **CI（持續整合，Continuous Integration）**：每次有人把程式推上來，就**自動建置＋跑測試**，愈早發現壞掉愈好，不要等到上線才爆。
- **CD（持續交付／部署，Continuous Delivery / Deployment）**：測試過的程式**自動走到下一關**，最終**自動部署**到環境上。交付＝自動到可上線狀態（可能留一個人工核准鈕）；部署＝連最後一步也自動。
- **管線（Pipeline）**：把「取原始碼 → 建置測試 → 部署」這些關卡**串成一條自動化流水線**，一關過了自動進下一關。
- **階段（Stage）與動作（Action）**：管線切成好幾個**階段**（如 Source、Build、Deploy），每個階段裡有一個或多個**動作**（實際去呼叫 CodeBuild、CodeDeploy 等）。
- **構件（Artifact）**：一個階段產出、要交給下一階段用的**檔案包**（如建置好的 zip、編譯產物）。在 AWS 由管線透過 S3 貯體**自動搬運**。
- **建置規格（buildspec）**：一個 `buildspec.yml` 檔，告訴 **CodeBuild**「分哪些階段、每階段跑什麼指令、產出哪些檔案」。
- **部署規格（appspec）**：一個 `appspec.yml`（或 `.json`）檔，告訴 **CodeDeploy**「要部署什麼、放到哪、部署前後跑哪些掛鉤腳本」。

</Vocab>

:::note[💬 閱讀小提示]
文章裡只要看到帶<Term desc="像這樣！滑鼠移到有虛線的名詞上（手機點一下），就會跳出白話解釋。">虛線底線的名詞</Term>，把滑鼠移上去就會跳出白話解釋。所有名詞也都整理在 [名詞與服務對照表](/glossary)。
:::

## 為什麼需要 CI/CD？先講一個「手動上版很可怕」的例子

假設你的團隊三個人一起開發一個 API。沒有 CI/CD 時，上線流程大概長這樣：改完程式 → 自己在筆電上手動跑一下測試（或忘了跑）→ 打包 → SSH 連到伺服器 → 複製檔案覆蓋 → 重啟服務 → 祈禱沒事。

這套「手動上版」的痛，開發者都懂：

- **人為失誤**：複製漏檔、環境變數忘了設、覆蓋錯版本，上線當場炸。
- **「在我電腦上明明會動」**：每個人的環境不一樣，建置結果不一致。
- **沒人記得跑測試**：趕時間就跳過測試，壞程式直接進正式環境。
- **不可重現、無紀錄**：出事了不知道上的是哪一版、誰上的、何時上的。
- **回滾很慌**：壞了要手忙腳亂把舊版再 SSH 傳回去。

CI/CD 把這整條流程**自動化＋標準化**：推上 Git 就自動建置、自動跑測試、測過才自動部署，每一步都有紀錄、壞了能自動回滾。對開發者來說，重點從「別上錯版」變成「寫好程式與測試，上版交給管線」。

## 一句話先懂這三個服務怎麼合作

<div className="flow">
  <div className="flow-node">原始碼來源<br/>(CodeConnections → GitHub)</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">CodeBuild<br/>(建置＋測試<br/>buildspec.yml)</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">CodeDeploy<br/>(部署<br/>appspec.yml)</div>
</div>

**整條管線由 CodePipeline 當總指揮**（編排），它不自己建置也不自己部署，而是**在每個階段去呼叫對應的服務**：抓原始碼、叫 CodeBuild 建置測試、把產出的構件交給 CodeDeploy 去部署。構件在階段之間透過一個 S3 貯體自動搬運。

<Analogy title="🏢 生活比喻：CI/CD 就像一條餐廳出餐流水線">

- **CodePipeline = 出餐總控的傳送帶**：它不炒菜也不送餐，只負責「這一站做完，東西往下一站送」，掌控整條流程的順序與卡關。
- **原始碼來源 = 進貨口**：新食材（你推上去的程式碼）一進來就啟動整條線。
- **CodeBuild = 廚房**：照食譜（`buildspec.yml`）把食材做成料理（編譯、打包），順便**試吃檢查（跑測試）**，做好的成品（構件）放上傳送帶。
- **CodeDeploy = 送餐員**：照送餐單（`appspec.yml`）把成品端到正確的桌位（EC2／Lambda／ECS），而且會**先端一桌試水溫（金絲雀）**，沒人抱怨再全部端上。
- **CodeArtifact = 食材儲藏室**：共用的調味料與半成品（第三方套件、你自己的函式庫）集中放這，廚房要用隨時來拿。

</Analogy>

## 各服務分工（這段是考試核心：誰做哪件事）

### 原始碼來源（Source）：管線的起點

管線第一個階段永遠是 **Source**，它定義「程式碼從哪來、什麼情況觸發管線」。常見來源：

- **GitHub / GitHub Enterprise / Bitbucket / GitLab**：透過 <Term en="AWS CodeConnections" desc="以前叫 CodeStar Connections，用來把 AWS 管線安全連到 GitHub 等外部 Git 服務，取代舊的 OAuth token 作法。">CodeConnections</Term>（舊名 CodeStar Connections）連接，是現在連外部 Git 的標準作法。
- **Amazon S3**：把一個 zip 當原始碼來源。
- **Amazon ECR**：以容器映像推送當觸發來源。

:::info[🔑 CodeCommit 要注意]
AWS 自家的 Git 代管 **CodeCommit** 曾是教材常客，但 **2024 年 7 月後 AWS 已不再對新客戶開放** CodeCommit。考 C03 時題目多半改用 **GitHub + CodeConnections**。觀念一樣（它就是個 Git 貯體），但別預設新專案還會用 CodeCommit。
:::

### CodePipeline：編排（Orchestration）

CodePipeline 是**總指揮**，把整個發布流程切成**階段（Stage）**，每階段放**動作（Action）**：

- 典型階段：`Source`（抓碼）→ `Build`（叫 CodeBuild）→ （可選）`Test` → （可選人工核准）→ `Deploy`（叫 CodeDeploy）。
- **它自己不建置、不部署**，只負責「串流程、傳構件、卡關卡、出事停下來」。
- 支援**人工核准動作（Manual approval）**：正式環境前放一關，要人按核准才繼續。
- 一個階段可以有**平行動作**（同時跑），也可以**串行**。

### CodeBuild：建置與測試（看 `buildspec.yml`）

<Term en="AWS CodeBuild" desc="全代管的建置服務，照 buildspec.yml 在臨時容器裡編譯程式、跑測試、打包構件，按分鐘計費，沒事不收錢。">CodeBuild</Term> 是**全代管的建置伺服器**：它開一個臨時容器，照 `buildspec.yml` 的指令編譯、跑單元測試、打包，產出構件後容器就銷毀。

`buildspec.yml`（預設放在原始碼根目錄）分成幾個固定**階段（phases）**：

```yaml
version: 0.2

env:
  variables:
    NODE_ENV: "production"
  # 機密別寫明文！用 Secrets Manager / Parameter Store 注入（見下方雷區）
  secrets-manager:
    DB_PASSWORD: "prod/db:password"

phases:
  install:            # 裝工具、設定執行階段版本
    runtime-versions:
      nodejs: 20
    commands:
      - echo "安裝相依套件"
      - npm ci
  pre_build:          # 建置前準備（登入 registry、跑 linter）
    commands:
      - npm run lint
  build:              # 真正的建置
    commands:
      - npm run build
      - npm test       # ✅ 測試一定要放進來，測不過就讓這階段失敗
  post_build:         # 建置後收尾（打包、上傳）
    commands:
      - echo "建置完成"

artifacts:            # 要交給下一階段的檔案
  files:
    - '**/*'
  base-directory: dist

cache:                # 快取相依套件，加速下一次建置
  paths:
    - 'node_modules/**/*'
```

:::info[🔑 phases 的意義與順序]
`install → pre_build → build → post_build` 是固定順序。**任何一個 phase 的指令回傳非 0，整個建置就判定失敗**、管線卡在這一關。所以把 `npm test` 放在 `build` 裡，測試掛掉建置就掛掉，壞程式進不了部署階段——這就是 CI 的核心價值。
:::

### CodeDeploy：部署（看 `appspec.yml`）

<Term en="AWS CodeDeploy" desc="全代管的部署服務，把建置好的構件依 appspec.yml 部署到 EC2、Lambda 或 ECS，支援藍綠與金絲雀，可自動回滾。">CodeDeploy</Term> 負責把構件**實際放到運算環境上並上線**，支援三種目標，`appspec` 的寫法略有不同：

| 部署目標 | 典型部署策略 | appspec 重點 |
| --- | --- | --- |
| **EC2 / 地端伺服器** | In-place（原地）或 Blue/Green（藍綠） | 用 `files` 指定檔案放哪、用 `hooks` 定義生命週期腳本（如 `BeforeInstall`、`ApplicationStop`、`AfterInstall`） |
| **Lambda** | Canary / Linear / AllAtOnce（搭配別名加權流量） | 指定函式、別名、新舊版本，流量逐步切換 |
| **ECS** | Blue/Green（必走藍綠） | 指定 Task Definition、容器與連接埠 |

一個 EC2 版的 `appspec.yml`：

```yaml
version: 0.0
os: linux
files:
  - source: /
    destination: /var/www/myapp
hooks:
  ApplicationStop:
    - location: scripts/stop_server.sh
      timeout: 60
  AfterInstall:
    - location: scripts/install_deps.sh
      timeout: 120
  ApplicationStart:
    - location: scripts/start_server.sh
      timeout: 60
  ValidateService:            # 部署後健康檢查，失敗可自動回滾
    - location: scripts/health_check.sh
      timeout: 60
```

:::tip[💡 考試重點：部署策略關鍵字]
- **In-place（原地）**：直接在現有執行個體上更新，省資源但**更新當下該台會短暫中斷**，回滾＝重新部署舊版。
- **Blue/Green（藍綠）**：開一組全新環境（綠）部署新版，健康才把流量從舊（藍）切過去，**回滾超快**（把流量切回藍即可），代價是**同時跑兩套比較貴**。**ECS 與 Lambda 的 CodeDeploy 一律是藍綠概念。**
- **Canary / Linear（金絲雀／線性）**：Lambda 常用，先放一小撮流量到新版（如 10%），觀察沒事再逐步加到 100%。
:::

### CodeArtifact：套件庫（Package Repository）

<Term en="AWS CodeArtifact" desc="全代管的套件庫服務，可當 npm/pip/Maven/NuGet 的私有 registry，並代理 npmjs、Maven Central 等公開來源。">CodeArtifact</Term> 是**全代管的私有套件庫**，相容 npm、pip、Maven、NuGet、yarn 等。它解決兩個痛：

- **代理公開 registry**：幫你快取 npmjs、PyPI、Maven Central 的套件，公開 registry 掛掉或某版本被作者刪掉時，你的建置不會跟著斷。
- **放自己的私有套件**：公司內部共用函式庫不想公開，就發佈到 CodeArtifact，CodeBuild 建置時從這裡拉。

它不是管線的必要環節，但在 `buildspec.yml` 的 `install`／`pre_build` 階段常搭配使用（登入 CodeArtifact 後再 `npm install`）。

## 為什麼用這套，而不是自己搭或用第三方？

> 使用者常「知道有 Jenkins、有 GitHub Actions，但不懂為什麼在 AWS 上要用這套」。這段把取捨講白。

### 為什麼是它

AWS 原生 CI/CD 的核心價值是**全代管＋跟 AWS 權限與資源深度整合**：你不用自己開一台 Jenkins 伺服器並維護它（修補、擴充、顧它別掛）；而且用 **IAM 角色**就能安全地碰 AWS 資源（部署到 EC2／Lambda／ECS、拉 Secrets Manager 的機密），不必在 CI 工具裡塞一堆長期金鑰。對「東西幾乎都在 AWS 上」的團隊，整合成本最低。

### 各工具優缺點對照

| 方案 | 優點 | 缺點 / 限制 | 什麼時候用 |
| --- | --- | --- | --- |
| **AWS CodePipeline 三件套** | 全代管免顧伺服器；與 IAM／CloudWatch／CloudFormation 無縫整合；CodeBuild 按分鐘計費、沒事不收錢；CodeDeploy 原生支援 EC2/Lambda/ECS 藍綠與自動回滾 | 設定較瑣碎、學習曲線陡；外掛生態不如 GitHub Actions 豐富；跨雲較弱 | **工作負載主要在 AWS**、想要免維運與原生權限整合（考 DVA 預設答案） |
| **自建 Jenkins** | 外掛最多、極度彈性、完全可控、可跨雲 | **要自己養伺服器**（開機、修補、擴充、備份、它掛你就不能上版）；高可用要自己做 | 已有 Jenkins 技術棧、需高度客製、或多雲環境 |
| **GitHub Actions / GitLab CI** | 跟原始碼貼身、YAML 上手快、社群 action 豐富、PR 體驗好 | 部署進 AWS 仍要設定雲端憑證（建議 OIDC）；大量建置分鐘數要付費；AWS 原生部署能力（藍綠回滾）不如 CodeDeploy | 原始碼在 GitHub/GitLab、想要貼近 PR 的開發體驗 |

:::info[🔑 混搭很常見，不是二選一]
實務上常**混用**：用 **GitHub Actions 跑 CI**（建置＋測試，離原始碼近），再觸發 **CodePipeline / CodeDeploy 做 AWS 內的部署**（藍綠、自動回滾）。考試答案偏「AWS 原生＝免維運、原生整合」，但要知道這不是非黑即白。
:::

### 什麼時候反而別用

- **流程超簡單**（一個小靜態網站推 S3）→ 一條 GitHub Actions 或一行 `aws s3 sync` 就夠，架整條 CodePipeline 是殺雞用牛刀。
- **強烈需要跨雲**（同時部署 AWS＋GCP＋Azure）→ 中立的 Jenkins／GitLab CI 比綁 AWS 的這套更合適。
- **團隊已深度投資 Jenkins** 且運作良好 → 不必為了用而用。

## 🛠️ 動手做：建一條最小 pipeline（Source → Build → Deploy）

目標：把 GitHub 上的程式推上去 → CodeBuild 照 `buildspec.yml` 建置測試 → CodeDeploy 部署到 EC2。

### 步驟 0：先把 `buildspec.yml` 放進原始碼根目錄

用上面 CodeBuild 那段的 `buildspec.yml`。**預期結果**：CodeBuild 之後能在原始碼根目錄自動找到它（不另外指定路徑時預設找 `buildspec.yml`）。

### 步驟 1（主控台）：連接 GitHub 原始碼

1. CodePipeline 主控台 →「Create pipeline」。
2. Source provider 選 **GitHub (via GitHub App)** → 建立 / 選一個 **CodeConnections** 連線 → 授權 → 選 repo 與分支（如 `main`）。

**預期結果**：連線狀態顯示 `Available`；之後推 `main` 分支就會自動觸發管線。

### 步驟 2：建立 Build 階段（CodeBuild 專案）

用 CLI 建一個 build 專案（也可在精靈裡直接建）：

```bash
aws codebuild create-project \
  --name myapp-build \
  --source "type=CODEPIPELINE" \
  --artifacts "type=CODEPIPELINE" \
  --environment "type=LINUX_CONTAINER,computeType=BUILD_GENERAL1_SMALL,image=aws/codebuild/amazonlinux2-x86_64-standard:5.0" \
  --service-role arn:aws:iam::111122223333:role/codebuild-service-role
```

**預期結果**：建出一個名為 `myapp-build` 的專案；`source` 與 `artifacts` 都設成 `CODEPIPELINE`，代表「輸入輸出都由管線接」。

### 步驟 3：手動觸發一次並看結果

```bash
# 讓現有管線跑一次
aws codepipeline start-pipeline-execution --name myapp-pipeline

# 查管線目前狀態（看每階段 Succeeded / Failed）
aws codepipeline get-pipeline-state --name myapp-pipeline
```

**預期結果**：`get-pipeline-state` 會列出 `Source`、`Build`、`Deploy` 每個階段的 `latestExecution.status`。順利的話三個都是 `Succeeded`；若 `npm test` 掛了，`Build` 階段會是 `Failed`，管線停住、**不會進到 Deploy**（這正是我們要的）。

### 步驟 4：看建置日誌除錯

```bash
# Build 失敗時，到 CloudWatch Logs 看 CodeBuild 輸出
aws logs tail /aws/codebuild/myapp-build --follow
```

**預期結果**：你會看到 `buildspec.yml` 每個 phase 的指令輸出，哪一行指令非 0 退出、建置就停在哪。

<Scenario title="真實情境：加一道人工核准閘，別讓程式自己衝進正式環境">

你的管線是 `Source → Build → Deploy-Staging → Deploy-Prod`。測試環境可以自動上，但正式環境老闆要求「要有人看過才放行」。做法：在 `Deploy-Prod` 前插一個**人工核准動作（Manual approval）**，可選擇接到 SNS 通知相關人。管線跑到這關會**暫停並等核准**，有人在主控台按「Approve」才繼續部署正式；按「Reject」就停住。這樣「持續交付」保留了一道人工閘，兼顧速度與安全。

</Scenario>

<Cost>

CodePipeline 按**活躍管線**計費（每條管線每月有固定費用，另有免費層）；CodeBuild 按**建置分鐘數 × 機器規格**計費，沒在建置就不收錢；CodeDeploy 部署到 **EC2／地端要收費、部署到 Lambda／ECS 免費**；構件存放的 S3 貯體與 CloudWatch Logs 另計。練習完記得把測試用的管線、CodeBuild 專案與 S3 構件貯體清掉，別讓閒置管線一直吃月費。

</Cost>

:::warning[🚑 常踩雷]
- **buildspec 階段／指令設錯**：phase 名稱打錯（如把 `pre_build` 寫成 `prebuild`）會被忽略；指令非 0 退出就整個建置失敗卻沒意識到——**先在本機 `npm run build && npm test` 跑過**再交給 CodeBuild。
- **CodeBuild 服務角色少權限**：建置要拉 CodeArtifact、寫構件到 S3、讀 Secrets Manager，但**服務角色沒給對應權限**，會出現 `AccessDenied`。CodeBuild 用的是它自己的**服務角色**，不是你的帳號權限，要逐項補齊（ECR、S3、logs、secretsmanager、codeartifact…）。
- **構件（artifact）沒接好**：`buildspec.yml` 的 `artifacts.files` 沒宣告要輸出的檔，下一階段（CodeDeploy）就拿不到檔、部署空的；階段之間的 input/output artifact 名稱要對上。
- **沒設測試就自動上線**：管線很順但 `buildspec` 裡根本沒跑測試 → 等於自動把壞程式送上正式。**測試一定要放進 `build` phase**，讓測不過＝建置失敗＝管線卡住。
- **環境變數存機密用明文**：`buildspec.yml` 的 `env.variables` 或 CodeBuild 的明文環境變數**不要**放密碼／金鑰（日誌會外洩）。敏感值改用 `env.secrets-manager`（Secrets Manager）或 `env.parameter-store`（Parameter Store，`SecureString`）注入。
- **正式部署沒設自動回滾**：CodeDeploy 可在健康檢查失敗或警報觸發時**自動回滾**，沒開的話壞版會一直掛在線上。EC2/地端建議搭 Blue/Green 讓回滾＝切流量。
:::

<Refs>

- [AWS CodePipeline 使用者指南](https://docs.aws.amazon.com/codepipeline/latest/userguide/welcome.html)
- [CodeBuild buildspec 參考](https://docs.aws.amazon.com/codebuild/latest/userguide/build-spec-ref.html)
- [CodeDeploy AppSpec 檔案參考](https://docs.aws.amazon.com/codedeploy/latest/userguide/reference-appspec-file.html)
- [CodeArtifact 使用者指南](https://docs.aws.amazon.com/codeartifact/latest/ug/welcome.html)
- [AWS CodeConnections（連接 GitHub 等來源）](https://docs.aws.amazon.com/dtconsole/latest/userguide/welcome-connections.html)

</Refs>

## 下一步

👉 下一篇：[IaC：CloudFormation / SAM / CDK](./iac-cloudformation-sam.md)
