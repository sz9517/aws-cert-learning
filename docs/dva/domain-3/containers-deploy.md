---
sidebar_position: 4
title: 容器建置與部署（ECR / ECS / Fargate）
---

# 容器建置與部署：把映像推上 ECR，交給 ECS／Fargate 幫你跑

> 本篇用「開發者視角」帶你把一個容器化應用從本機一路送上雲：為什麼要用容器、映像怎麼推上 ECR（標籤、掃描）、任務定義（task definition）怎麼寫、ECS 服務怎麼維持你要的執行數量、Fargate 與 EC2 兩種啟動類型差在哪、以及最常搞混的「任務角色 vs 執行角色」。這些是 DVA-C03 Domain 3「測試與部署」的高頻考點，問法比 SAA 更貼近「你實際怎麼部署」。

<Vocab title="📌 先認識這篇會出現的名詞（完全沒碰過也能懂）">

- **容器（Container）**：把你的程式碼連同它需要的執行階段、函式庫、設定全部打包成一個「可攜帶的小盒子」，在任何裝了容器引擎的機器上都跑得一模一樣。
- **映像（Image）**：容器的「安裝檔／模板」。你用 `Dockerfile` 建出一個映像，之後每個執行中的容器都是從同一個映像複製出來的。
- **ECR（Elastic Container Registry）**：AWS 託管的<Term en="Elastic Container Registry" desc="AWS 託管的私有 Docker 映像倉庫，負責存放、版本標籤與弱點掃描你的容器映像。">映像倉庫</Term>，用來存放你推上去的容器映像（像 GitHub，但放的是映像）。
- **ECS（Elastic Container Service）**：AWS 的<Term en="Elastic Container Service" desc="AWS 原生的容器編排服務，負責依你的任務定義把容器跑起來、維持數量、做健康檢查與替換。">容器編排服務</Term>，負責「把你的容器跑起來、維持該有的數量、掛掉就重開」。
- **任務定義（Task Definition）**：一份 JSON 藍圖，描述「要跑哪個映像、給多少 CPU／記憶體、開哪些連接埠、用哪個角色、環境變數是什麼」。像容器版的「食譜」。
- **任務（Task）**：依任務定義實際跑起來的一組容器。一個任務可以包含一到多個容器。
- **服務（Service）**：ECS 裡負責「長期維持 N 個任務一直活著」的管理員，掛掉自動補、要更新版本時幫你滾動替換。
- **Fargate**：一種<Term en="AWS Fargate" desc="ECS／EKS 的無伺服器運算引擎，你不用管理底層 EC2 機器，AWS 直接依任務需要的 CPU/記憶體幫你跑容器。">無伺服器容器運算引擎</Term>，你只說「我這個容器要多少 CPU／記憶體」，AWS 幫你跑，你**完全不用管底下的機器**。

</Vocab>

:::note[💬 閱讀小提示]
文章裡只要看到帶<Term desc="像這樣！滑鼠移到有虛線的名詞上（手機點一下），就會跳出白話解釋。">虛線底線的名詞</Term>，把滑鼠移上去就會跳出白話解釋。所有名詞也都整理在 [名詞與服務對照表](/glossary)。
:::

## 為什麼要用容器？先講一個「在我電腦上明明好好的」的痛

你在本機把應用寫好、跑得好好的，交給同事或推上伺服器卻一堆錯：對方 Node 版本不一樣、少裝某個系統函式庫、環境變數沒設……這就是經典的「**在我電腦上明明可以**」。

容器把這個問題一次解掉：你把**程式碼 + 執行階段 + 相依 + 設定**一起打包成一個**映像**，這個映像在你的筆電、同事的機器、測試環境、正式環境跑起來**完全一致**。對開發者來說，重點從「每台機器都要手動喬環境」變成「建一次映像，到處都能跑」。

容器還有兩個開發者愛的好處：

- **啟動快、夠輕**：比開一整台虛擬機（VM）輕量很多，秒級就能起一個容器。
- **好搬、好擴充**：同一個映像可以在本機、ECS、別的雲都跑；要擴充就多開幾個容器。

但光會打包還不夠——**誰來存這些映像？誰來幫你把容器跑起來、掛了自動補、要擴充時自動加？** 這就輪到 ECR 和 ECS／Fargate 上場。

<Analogy title="🏢 生活比喻：映像是餐點的「中央廚房配方包」">

- **Dockerfile = 配方寫法**：寫下這道菜要哪些食材、怎麼做。
- **映像（Image）= 真空包裝的半成品**：照配方做好、封裝起來的標準包，每一包都一模一樣。
- **ECR = 中央冷凍倉庫**：所有半成品包都存在這，貼上標籤（口味、版本）方便取用。
- **ECS 服務 = 連鎖店店長**：負責「隨時要有 3 份熱餐在檯面上」，賣掉一份就再加熱一份補上。
- **Fargate = 外包的廚房**：你不用自己租廚房、顧爐火，只說「這份餐要多大火、多少料」，廚房自動幫你出。

</Analogy>

## 一句話先懂整個流程

你在本機用 `docker build` 把程式打包成**映像** → 推（push）到 **ECR** 這個私有倉庫並貼上**標籤** → 寫一份**任務定義**告訴 ECS「要跑這個映像、給多少資源、用哪些角色」 → 建一個 ECS **服務**叫它「永遠維持 N 個任務活著」 → 選 **Fargate** 就不用管機器、選 **EC2** 就自己備機器。

<div className="flow">
  <div className="flow-node">docker build（建映像）</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">push 到 ECR（貼標籤 + 掃描）</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">註冊任務定義（要跑什麼、多少資源）</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">ECS 服務維持 N 個任務</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Fargate 或 EC2 把容器跑起來</div>
</div>

## 核心一：ECR——推送映像、標籤、弱點掃描

<Term en="Elastic Container Registry" desc="AWS 託管的私有 Docker 映像倉庫。">ECR</Term> 就是你的私有映像倉庫。重點有三個：**推送、標籤、掃描**。

### 推送（push）映像前要先「登入」

ECR 是私有的，推之前要先拿一組短效的登入權杖。指令長這樣（細節見下方動手做）：

```bash
aws ecr get-login-password --region ap-northeast-1 \
  | docker login --username AWS --password-stdin \
    111122223333.dkr.ecr.ap-northeast-1.amazonaws.com
```

`get-login-password` 幫你產生一組**12 小時有效**的密碼，餵給 `docker login`，之後 `docker push` 才有權限推上去。

### 標籤（tag）——別只會用 `latest`

映像推上去時要貼<Term en="Image Tag" desc="映像的版本標籤，例如 v1.2.0 或 git commit SHA，用來指定與回溯特定版本的映像。">標籤</Term>標示版本，例如 `myapp:v1.2.0`。標籤決定你部署的是「哪一版」。

:::info[🔑 為什麼不要只用 `latest`]
`latest` 只是一個**會一直被覆蓋**的名字，不代表版本。今天的 `latest` 和上週的 `latest` 可能是完全不同的程式——出事時你**根本說不出正式環境跑的是哪一版**，也很難回溯。正解：用**不可變的版本標籤**（如語意化版本 `v1.2.0` 或 git commit 的 SHA），一個標籤對應一包永遠不變的映像。ECR 還可開啟 **tag immutability（標籤不可變）**，直接禁止同一標籤被覆蓋。
:::

### 掃描（scan）——幫映像做健康檢查

ECR 可以自動掃描你的映像，找出裡面的套件有沒有已知<Term en="Vulnerability (CVE)" desc="軟體中已被公開登錄的安全漏洞，攻擊者可能據此入侵。">安全漏洞（CVE）</Term>：

- **基本掃描（Basic scanning）**：免費，比對開源漏洞資料庫。
- **增強掃描（Enhanced scanning，整合 Amazon Inspector）**：更深入、持續掃描作業系統與語言套件層級的漏洞。

可設定成「**每次推送自動掃描（scan on push）**」，有漏洞立刻知道，而不是上線後才被打。

## 核心二：任務定義（Task Definition）——容器的部署藍圖

<Term en="Task Definition" desc="描述要跑哪個映像、CPU/記憶體、連接埠、角色、環境變數的 JSON 藍圖。">任務定義</Term>是一份 JSON，是 ECS 的核心。它回答「**要跑什麼、用多少資源、怎麼連、用誰的身分**」：

| 欄位 | 說明與考點 |
| --- | --- |
| **`family`** | 任務定義的名字；每次改內容註冊會產生新的**修訂版號**（family:1、family:2…），和 Lambda 版本一樣是不可變快照。 |
| **容器定義（containerDefinitions）** | 要跑哪個**映像（image，通常是 ECR 的 URI）**、`cpu`／`memory`、`portMappings`（開哪些埠）、`environment`（環境變數）、`logConfiguration`（送 CloudWatch Logs）。 |
| **`requiresCompatibilities`** | 宣告跑在 `FARGATE` 還是 `EC2`。 |
| **`networkMode`** | Fargate 一律 `awsvpc`（每個任務有自己的網路介面與私有 IP）。 |
| **任務層級 `cpu`／`memory`** | Fargate 必填，整個任務的資源總量（如 256 CPU / 512 MB）。 |
| **`executionRoleArn`（執行角色）** | 給 **ECS 代理人**用：拉 ECR 映像、寫 CloudWatch Logs。 |
| **`taskRoleArn`（任務角色）** | 給**你的容器程式**用：你的 App 要讀 S3、寫 DynamoDB 就靠它。 |

:::tip[💡 考試重點：兩個角色千萬別搞混]
- **執行角色（Execution Role）**＝給「**把容器跑起來這件事**」用的：**拉 ECR 私有映像**、把日誌送 CloudWatch。缺它 → 任務根本**起不來**（常見錯誤 `CannotPullContainerError`）。
- **任務角色（Task Role）**＝給「**容器裡你的程式**」用的：你的 App 呼叫 AWS SDK 去存取 S3／DynamoDB／SQS 就用它。缺它 → 容器**跑得起來，但程式存取 AWS 時被 AccessDenied**。
這組「拉映像 vs 程式存取資源」的對比，幾乎每次都考。
:::

## 核心三：ECS 服務——維持數量、滾動更新

一個**任務**跑一次就是一次；但正式服務要「**永遠維持 N 個一直活著**」，這就是 **ECS 服務（Service）** 的工作：

- **維持期望數量（desired count）**：你說要 3 個，掛掉一個它自動補一個。
- **健康檢查與替換**：接 ALB（Application Load Balancer）做健康檢查，不健康就替換。
- **滾動更新（rolling update）**：你註冊新版任務定義、更新服務，ECS 會**一邊起新版、一邊收舊版**，流量不中斷。
- **搭配 Auto Scaling**：依 CPU／記憶體或請求數自動加減任務數。

<Analogy title="🏢 生活比喻：服務就是「排班表上永遠要有 3 個人」">

店長（服務）盯著排班表：規定檯面上**隨時要有 3 位店員（任務）**。有人請假（容器掛掉），馬上叫一位來補；要換制服（部署新版），就一位一位換，不會整間店同時關門。

</Analogy>

## 核心四：啟動類型——Fargate vs EC2

同樣一份任務定義，可以跑在兩種**啟動類型（launch type）**上：

| | **Fargate（無伺服器）** | **EC2 啟動類型** |
| --- | --- | --- |
| 誰管底層機器 | **AWS 管**，你不用碰 | **你自己**備一堆 EC2 當容器主機 |
| 計費 | 按**任務用到的 vCPU／記憶體 × 時間** | 按**你開的 EC2 機器**（不管塞不塞滿） |
| 省事程度 | 最省心，免修補、免容量規劃 | 要自己顧作業系統修補、擴充主機 |
| 能不能進機器 | **不能 SSH** 進底層機器 | 可以 SSH 進 EC2 主機 |
| 適合 | 一般微服務、流量起伏、想少運維 | 要特殊硬體（GPU）、要塞好塞滿壓成本、需對主機細調 |

## ECS vs EKS、Fargate vs EC2 怎麼選

> 這段是固定段落：先講「為什麼用它」，再給優缺點，最後講「何時用哪個」。

### 先搞懂兩組不同維度的選擇

很多人把這兩件事混在一起。其實它們是**兩個獨立的問題**：

1. **用哪個編排器？** ECS 還是 EKS。（誰來指揮容器）
2. **用哪種啟動類型？** Fargate 還是 EC2。（容器跑在誰的機器上）

兩組可以自由組合，例如「ECS + Fargate」「ECS + EC2」「EKS + Fargate」都行。

### ECS vs EKS

- **ECS（Elastic Container Service）**
  - **為什麼用它**：AWS **原生、最簡單**的容器編排。概念少（任務定義、服務、叢集），和 IAM／ALB／CloudWatch 無縫整合，**學習曲線最平**。
  - **優點**：上手快、幾乎零學習負擔、免管理控制平面、AWS 整合度最高。
  - **缺點**：是 AWS **專屬**，換到別的雲或地端無法照搬；生態系／外掛沒有 Kubernetes 那麼龐大。
  - **何時用**：團隊想**最快把容器跑在 AWS 上**、不需要 Kubernetes 的複雜生態、沒有多雲包袱時。考試預設情境的首選。

- **EKS（Elastic Kubernetes Service）**
  - **為什麼用它**：AWS 託管的 **Kubernetes**。當你已經有 Kubernetes 經驗、既有的 K8s 設定（YAML、Helm），或要**跨雲／混合雲**一致性時。
  - **優點**：標準 Kubernetes、龐大生態系與工具、可攜性高（別的雲也跑 K8s）。
  - **缺點**：**複雜、學習曲線陡**、要懂 K8s 概念，營運負擔比 ECS 高。
  - **何時用**：團隊已投資 Kubernetes、要多雲可攜、需要 K8s 豐富生態（如特定 operator）時。

### Fargate vs EC2

- **Fargate**
  - **為什麼用它**：你**不想管機器**。只宣告容器要多少 CPU／記憶體，AWS 幫你跑，免修補、免容量規劃、免顧叢集主機。
  - **優點**：營運最省心、依任務精準計費、安全隔離好。
  - **缺點**：單位成本通常比塞好塞滿的 EC2 高、**不能 SSH 進機器做底層調校**、不支援某些特殊需求（如 GPU 的支援與彈性較受限）。
  - **何時用**：一般網站／API／微服務、流量起伏大、團隊想把精力放在程式而非運維時。

- **EC2 啟動類型**
  - **為什麼用它**：你需要**對底層機器有控制權**，或要靠**把機器塞好塞滿**來壓低大規模成本，或要**特殊硬體（GPU）**。
  - **優點**：大規模下單位成本可更低、可選特殊機型、可細調主機、可 SSH 進機器。
  - **缺點**：要自己顧作業系統修補、容量規劃、叢集主機健康，**運維負擔重**。
  - **何時用**：穩定高用量想壓成本、需要 GPU／特殊機型、需對主機做細部控制時。

:::tip[💡 一句話記法]
- 「**最快、最省心、在 AWS 上**」→ **ECS**；「**已經在用 Kubernetes／要多雲**」→ **EKS**。
- 「**懶得管機器**」→ **Fargate**；「**要省大錢或要 GPU／細調主機**」→ **EC2**。
:::

## 實務應用：不只是考試

<Scenario title="真實情境：把一個 Node API 容器化後交給 ECS + Fargate 跑">

你有一個 Node.js API，想上雲又不想管機器。做法：先在本機 `docker build` 打包成映像、推到 ECR 並貼上 `v1.0.0` 標籤（不是 `latest`）；開啟 ECR 的 scan on push 確認沒有高風險漏洞；寫一份 Fargate 任務定義（256 CPU / 512 MB、`awsvpc`、執行角色能拉 ECR＋寫 Logs、任務角色能讀你的 S3 設定檔）；最後建一個維持 2 個任務的 ECS 服務，掛在 ALB 後面。之後要上新版，只要 build 新映像、貼 `v1.1.0`、註冊新任務定義修訂版、更新服務，ECS 會滾動替換、流量不中斷。

</Scenario>

### 🛠️ 動手做：build → 登入 ECR → push → 註冊任務定義 → 部署服務

```bash
# 0) 先設定一些變數方便複製（換成你自己的帳號與區域）
ACCOUNT=111122223333
REGION=ap-northeast-1
REPO=myapp
REGISTRY=$ACCOUNT.dkr.ecr.$REGION.amazonaws.com

# 1) 在 ECR 建一個私有倉庫（開啟 scan on push）
aws ecr create-repository \
  --repository-name $REPO \
  --image-scanning-configuration scanOnPush=true \
  --region $REGION
# 預期結果：回傳 JSON，含 repositoryUri（如 111122223333.dkr.ecr.ap-northeast-1.amazonaws.com/myapp）

# 2) 本機建映像，並直接貼上「版本標籤 + 完整 ECR 位址」
docker build -t $REGISTRY/$REPO:v1.0.0 .
# 預期結果：一連串 build 步驟，最後 Successfully tagged .../myapp:v1.0.0

# 3) 登入 ECR（拿 12 小時有效的密碼餵給 docker login）
aws ecr get-login-password --region $REGION \
  | docker login --username AWS --password-stdin $REGISTRY
# 預期結果：Login Succeeded

# 4) 推上去
docker push $REGISTRY/$REPO:v1.0.0
# 預期結果：各層 Pushed，最後顯示 digest（sha256:...）

# 5) 註冊任務定義（taskdef.json 內含兩個角色、映像 URI、CPU/記憶體）
aws ecs register-task-definition --cli-input-json file://taskdef.json
# 預期結果：回傳 taskDefinitionArn，結尾帶修訂版號（如 myapp:1）

# 6) 建立服務：維持 2 個任務、用 Fargate、掛在指定子網路
aws ecs create-service \
  --cluster my-cluster \
  --service-name myapp-svc \
  --task-definition myapp:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-abc,subnet-def],securityGroups=[sg-123],assignPublicIp=ENABLED}"
# 預期結果：回傳服務描述，runningCount 會從 0 逐漸變成 2

# 7)（之後要上新版）改完程式 → build v1.1.0 → push → 更新服務做滾動替換
aws ecs update-service \
  --cluster my-cluster \
  --service myapp-svc \
  --task-definition myapp:2
# 預期結果：ECS 一邊起 v1.1.0 的新任務、一邊收掉舊任務，流量不中斷
```

一份最小的 Fargate `taskdef.json`（注意兩個角色分得很清楚）：

```json
{
  "family": "myapp",
  "requiresCompatibilities": ["FARGATE"],
  "networkMode": "awsvpc",
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::111122223333:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::111122223333:role/myapp-task-role",
  "containerDefinitions": [
    {
      "name": "myapp",
      "image": "111122223333.dkr.ecr.ap-northeast-1.amazonaws.com/myapp:v1.0.0",
      "portMappings": [{ "containerPort": 3000 }],
      "environment": [{ "name": "NODE_ENV", "value": "production" }],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/myapp",
          "awslogs-region": "ap-northeast-1",
          "awslogs-stream-prefix": "myapp"
        }
      }
    }
  ]
}
```

<Cost>

**容器本身不收錢，收的是底下的運算與倉庫**。Fargate 按**任務用到的 vCPU／記憶體 × 執行時間**計費，不用管機器但閒置著開 2 個任務也會一直算錢；EC2 啟動類型按**你開的 EC2 機器**收費（塞不滿也照算，所以要靠排得密才划算）。ECR 按**儲存的映像容量**＋跨區／對外的資料傳輸收費，所以**定期清掉舊映像**（可設生命週期政策）能省錢。練習完記得把服務 desired count 設 0、刪掉測試叢集與 ECR 倉庫。

</Cost>

:::warning[🚑 常踩雷]
- **只用 `latest` 標籤**：`latest` 會一直被覆蓋，出事時說不出正式環境跑的是哪一版、難回溯。用**不可變版本標籤**（`v1.2.0`／git SHA），並考慮開啟 ECR 標籤不可變。
- **映像沒掃描就上線**：沒開 scan on push，等於把一堆未知漏洞直接推到正式環境。開掃描，有高風險漏洞先修再上。
- **任務角色 vs 執行角色搞混**：**拉 ECR 映像、寫 Logs 用執行角色**（缺它任務起不來，`CannotPullContainerError`）；**容器程式存取 S3／DynamoDB 用任務角色**（缺它跑得起來但 AccessDenied）。方向搞反會一直除不完錯。
- **以為 Fargate 能 SSH 進機器**：Fargate **沒有底層機器讓你 SSH**。要進容器內除錯改用 **ECS Exec（`aws ecs execute-command`）**，不是 SSH。
- **映像太大拉取慢**：映像塞一堆用不到的東西會讓每次啟動都拉很久、擴充變鈍。用**多階段建置（multi-stage build）**、精簡基底映像（如 `-slim`／`alpine`）、善用 `.dockerignore` 來瘦身。
:::

<Refs>

- [Amazon ECR 使用者指南](https://docs.aws.amazon.com/AmazonECR/latest/userguide/what-is-ecr.html)
- [將映像推送到 Amazon ECR](https://docs.aws.amazon.com/AmazonECR/latest/userguide/docker-push-ecr-image.html)
- [Amazon ECR 映像掃描](https://docs.aws.amazon.com/AmazonECR/latest/userguide/image-scanning.html)
- [Amazon ECS 任務定義](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definitions.html)
- [Amazon ECS 任務 IAM 角色（任務角色 vs 執行角色）](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-iam-roles.html)
- [AWS Fargate 於 Amazon ECS](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html)

</Refs>

## 下一步

👉 下一篇：[測試與 AI 輔助測試](./testing-ai-assisted.md)
