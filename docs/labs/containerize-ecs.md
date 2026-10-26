---
sidebar_position: 8
title: 實驗 8：容器化並部署到 ECS Fargate
---

# 實驗 8：把一個小 web app 容器化，部署到 ECS Fargate

> 這個實驗是開發者（對應 DVA）最該練熟的一條鏈：**把你寫的程式打包成容器映像 → 推到 AWS 的映像倉庫（ECR）→ 讓 ECS 在 Fargate 上把它跑起來，用瀏覽器打開看到頁面。** 全程不用自己開、自己顧任何一台伺服器——Fargate 是「無伺服器（Serverless）」的容器執行環境，你只負責容器，底層機器 AWS 幫你處理。做完記得照最後一節清理，避免 ALB 與執行中的任務默默計費。

<Vocab title="📌 先認識這篇會出現的名詞（完全沒碰過也能懂）">

- **容器（Container）**：把你的程式、執行環境、相依套件打包在一起的「標準箱子」，在哪台機器跑起來都一樣，不會再有「我這邊明明可以跑」的問題。
- **映像（Image）**：容器的「模板」。你用 `docker build` 做出映像，之後可以用同一個映像開出很多個一模一樣的容器。
- **Dockerfile**：一份純文字食譜，寫明「這個映像怎麼做出來」——用哪個基底、複製哪些檔案、開哪個埠、啟動時跑什麼指令。
- **ECR（Elastic Container Registry）**：AWS 的私有映像倉庫，你把映像 `push` 上去，ECS 之後再從這裡 `pull` 下來跑。
- **ECS（Elastic Container Service）**：AWS 的容器調度服務，負責「把你的容器跑起來、跑掛了幫你重開、要幾份就跑幾份」。
- **Fargate**：ECS 的一種執行模式，**不用你自己管底層的 EC2 機器**。你只要說「給我這麼多 CPU／記憶體」，AWS 就把容器放上去跑。相對的另一種模式是 EC2 模式（機器要你自己開、自己顧）。
- **任務定義（Task Definition）**：一份藍圖，寫明「要跑哪個映像、配多少 CPU／記憶體、開哪個埠、用哪些角色」。可以把它想成容器版的「規格表」。
- **服務（Service）**：ECS 裡負責「維持 N 份任務一直在跑」的管理員。某份掛了，它幫你補一份回來。

</Vocab>

:::note[💬 閱讀小提示]
看到帶<Term desc="像這樣！滑鼠移到有虛線的名詞上（手機點一下），就會跳出白話解釋。">虛線底線的名詞</Term>，把滑鼠移上去就會跳出白話解釋。所有名詞也整理在 [名詞與服務對照表](/glossary)。
:::

:::info[開始前的前提]
這篇假設你已經有這些基礎：

- 本機裝好 **Docker**（`docker --version` 有輸出）與 **AWS CLI v2**（`aws --version` 有輸出）。
- AWS CLI 已設好一組有權限的憑證（本機開發用 `aws configure`，正式環境請改用角色）。
- 已**設好帳單告警（Billing Alarm）**，花超過門檻會收到通知。
- 整篇固定在同一個**區域（Region）**（例如「亞太區域（東京）ap-northeast-1」），比較不會找不到自己開的資源。

本篇示範的 app 刻意做到最小（一個回「Hello」的網頁），重點是把整條鏈走通，而不是 app 本身。
:::

---

## 情境：把本機能跑的小網站搬上雲端

<Scenario title="真實情境：你寫好了一個小 web app，老闆要你「放上去讓大家連得到」">

你用手邊的框架寫了一支很小的 web 服務，本機 `http://localhost:3000` 打開就看得到頁面。現在要上雲：你不想自己去開一台 EC2、裝執行環境、設開機自動啟動、還要擔心哪天機器掛了沒人補。你想要的是——**把這支程式打包好交出去，剩下的「跑起來、跑掛了重開、要擴充幾份」都交給平台。**

這正是容器 + ECS Fargate 的甜蜜點：你交出一個映像，平台負責調度與維運。接下來我們就把這條鏈一步步走通。

</Scenario>

### 整條鏈長這樣

<div className="flow">
  <div className="flow-node">寫 Dockerfile</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">docker build 做出映像</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">push 到 ECR</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">寫任務定義</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">ECS/Fargate 跑服務</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">瀏覽器測試</div>
</div>

*圖：左邊三步在你的本機（打包、建映像、推上倉庫），右邊三步在 AWS（定義怎麼跑、真的跑起來、驗證）。*

---

## 動手做：從一份 Dockerfile 到瀏覽器看到頁面

### 步驟一：寫一支最小 app 與 Dockerfile

先在一個空資料夾裡放一支最小的 web app。這裡用 Node.js 當例子（換成 Python、Go 都一樣是這個套路）。建一個 `server.js`：

```javascript
const http = require('http');
const port = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello from ECS Fargate!\n');
}).listen(port, () => console.log('listening on ' + port));
```

同一個資料夾建一個 `Dockerfile`（檔名就叫 `Dockerfile`，沒有副檔名）：

```dockerfile
# 用官方精簡基底映像，體積小、受信任
FROM node:20-alpine

# 容器內的工作目錄
WORKDIR /app

# 先複製相依清單（這一層能被快取，沒改動就不用重裝）
COPY package*.json ./
RUN npm install --omit=dev || true

# 再複製程式碼
COPY . .

# 宣告容器對外服務的埠
EXPOSE 3000

# 容器啟動時跑的指令
CMD ["node", "server.js"]
```

:::info[🤔 為什麼這樣做：Dockerfile 的順序不是隨便排的]
- **用 `node:20-alpine` 這種精簡基底**：Alpine 版本體積極小，映像越小，push／pull 越快、受攻擊面也越小。別一開始就抓肥大的完整版。
- **先 `COPY package*.json` 再 `COPY . .`**：Docker 是**一層一層**建的，每層會快取。相依清單沒變時，`npm install` 那層直接吃快取、不重跑；你只改了程式碼時，重建會快很多。順序顛倒就享受不到這個快取。
- **`EXPOSE 3000` 要跟程式實際聽的埠一致**：這行是「宣告」，後面任務定義的埠對應、安全群組開的埠都要跟它對上，對不上就是「服務起來了卻連不到」。

**預期會看到**：資料夾裡有 `server.js` 和 `Dockerfile` 兩個檔。還沒執行任何東西，這一步只是把「食譜」寫好。
:::

### 步驟二：docker build 做出映像並本機試跑

在這個資料夾裡執行：

```bash
# 做出一個叫 hello-ecs 的映像（結尾的 . 代表「用目前資料夾當建置脈絡」）
$ docker build -t hello-ecs:v1 .

# 本機先跑一下，確認映像真的能動（把本機 3000 導到容器 3000）
$ docker run --rm -p 3000:3000 hello-ecs:v1
```

另開一個瀏覽器分頁打開 `http://localhost:3000`，看到 `Hello from ECS Fargate!` 就代表映像本身沒問題。按 `Ctrl+C` 停掉。

:::info[🤔 為什麼這樣做：先在本機試跑，別直接上雲]
上雲的環節很多（ECR、任務定義、網路、角色），任何一環錯都會讓你「不知道是哪裡壞了」。**先在本機 `docker run` 確認映像自己能跑**，就把「app／映像本身」這個變因先排除掉——之後上雲若連不到，你就知道問題多半在網路或設定，而不是程式。這是省下大把除錯時間的好習慣。

**預期會看到**：`docker build` 一層層跑完，最後出現 `naming to ... hello-ecs:v1`；`docker run` 後終端機印出 `listening on 3000`，瀏覽器看到那行 Hello 文字。
:::

### 步驟三：建一個 ECR 儲存庫

映像要先有個「家」放在雲端，ECS 才拿得到。用 CLI 建一個私有儲存庫（把區域換成你用的）：

```bash
$ aws ecr create-repository \
    --repository-name hello-ecs \
    --region ap-northeast-1
```

輸出的 JSON 裡會有一個 `repositoryUri`，長得像：

```
123456789012.dkr.ecr.ap-northeast-1.amazonaws.com/hello-ecs
```

把這串記下來，後面登入、打標籤、push、任務定義都要用到。

:::info[🤔 為什麼這樣做：ECR 是私有的，不是 Docker Hub]
你可能習慣把映像推到公開的 Docker Hub，但正式服務的映像通常**不該公開**（裡面可能有你的程式、設定）。ECR 是你帳號底下的**私有倉庫**，預設只有你授權的身分能存取，而且和 ECS／IAM 無縫整合——ECS 要 pull 映像時，靠的就是後面會提到的「執行角色」去 ECR 取。

**預期會看到**：指令回傳一段 JSON，`repositoryName` 是 `hello-ecs`，並附上那串 `repositoryUri`。到 ECR 主控台也會看到這個空的儲存庫。
:::

### 步驟四：登入 ECR，打標籤並 push 映像

ECR 是私有的，push 前要先登入。這段指令是把「ECR 的臨時密碼」餵給 `docker login`：

```bash
# 1. 取得 ECR 登入密碼，直接管線餵給 docker login（帳號、區域換成你的）
$ aws ecr get-login-password --region ap-northeast-1 \
    | docker login --username AWS --password-stdin \
      123456789012.dkr.ecr.ap-northeast-1.amazonaws.com

# 2. 把本機映像打上「ECR 位址 + 版本」的標籤
$ docker tag hello-ecs:v1 \
    123456789012.dkr.ecr.ap-northeast-1.amazonaws.com/hello-ecs:v1

# 3. 推上去
$ docker push \
    123456789012.dkr.ecr.ap-northeast-1.amazonaws.com/hello-ecs:v1
```

:::info[🤔 為什麼這樣做：為什麼用 `get-login-password` 管線，不手動貼密碼]
ECR 的登入權杖是**臨時的、會過期**（約 12 小時），所以沒有一組固定帳密可以存。`aws ecr get-login-password` 會用你 CLI 的身分去換一張當下有效的權杖，再用管線 `|` 直接餵給 `docker login` 的 `--password-stdin`——**密碼不會出現在指令歷史或畫面上**，比手動複製貼上安全。打標籤（`docker tag`）則是因為 push 的目的地是由「映像標籤長什麼樣」決定的：標籤必須是完整的 ECR 位址，Docker 才知道要推到哪。

**預期會看到**：
- `docker login` 成功會印 `Login Succeeded`。
- `docker push` 會一層層顯示 `Pushed`，最後給一行摘要帶上 `digest: sha256:...` 與大小。
- 回 ECR 主控台點進儲存庫，會看到一個 **Image tag 為 `v1`** 的映像，帶著推送時間與大小。
:::

### 步驟五：寫任務定義（Task Definition）

任務定義是「這個容器要怎麼跑」的藍圖。在本機存一個 `task-def.json`（把 `<帳號>`、區域、兩個角色 ARN 換成你的）：

```json
{
  "family": "hello-ecs-task",
  "requiresCompatibilities": ["FARGATE"],
  "networkMode": "awsvpc",
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "hello-ecs",
      "image": "123456789012.dkr.ecr.ap-northeast-1.amazonaws.com/hello-ecs:v1",
      "essential": true,
      "portMappings": [
        { "containerPort": 3000, "protocol": "tcp" }
      ]
    }
  ]
}
```

用 CLI 註冊它：

```bash
$ aws ecs register-task-definition \
    --cli-input-json file://task-def.json \
    --region ap-northeast-1
```

:::info[🤔 為什麼這樣做：把任務角色和執行角色分清楚（這是 DVA 愛考的點）]
任務定義裡有兩種角色，初學者最常搞混，一定要分清楚：

- **執行角色（Execution Role，`executionRoleArn`）**：給 **ECS 代理人**用的，讓它能**代你去 ECR 拉映像、把容器日誌寫進 CloudWatch**。沒有它，任務根本拉不到映像、起不來。AWS 內建一個 `ecsTaskExecutionRole`（主控台建叢集時常會提示自動建），附的受管政策是 `AmazonECSTaskExecutionRolePolicy`。
- **任務角色（Task Role，`taskRoleArn`）**：給**容器裡的程式**用的，讓你的 app 去存取別的 AWS 服務（例如讀 S3、寫 DynamoDB）。本篇的 Hello app 不碰其他服務，所以**沒填任務角色**——需要時才加。

一句話記法：**執行角色是「幫 ECS 把容器搬上來」，任務角色是「容器跑起來之後程式自己要用的」。**

**預期會看到**：指令回傳註冊好的任務定義 JSON，裡面 `revision` 是 `1`（之後每改一次註冊就 +1），`status` 是 `ACTIVE`。
:::

### 步驟六：建 ECS 叢集（Fargate）與服務

最後一步，把它真的跑起來。這步建議用**主控台**操作，因為要順手設網路（VPC、子網路、安全群組）與 ALB，畫面引導比純 CLI 好懂：

1. 進 `ECS` → **建立叢集（Create cluster）** → 命名 `hello-cluster`，基礎架構選 **AWS Fargate (serverless)** → 建立。
2. 進叢集 → **服務（Services）** 分頁 → **建立（Create）**。
3. **啟動類型**選 **Fargate**；**任務定義**選剛註冊的 `hello-ecs-task`（版本 1）。
4. **服務名稱** `hello-service`；**所需任務數（Desired tasks）** 填 `1`。
5. **網路**：選你的 VPC 與至少兩個公有子網路（跨可用區比較穩）。
6. **安全群組**：新建或選一個，**務必開放 TCP 3000 的入站**（來源：ALB 的安全群組，或先用 `0.0.0.0/0` 測完再收斂）。
7. **負載平衡（Load balancing）**：選 **Application Load Balancer**，新建一個 ALB，監聽埠 `80`，目標群組指向容器的 `3000` 埠，健康檢查路徑先用 `/`。
8. **建立服務**。

:::info[🤔 為什麼這樣做：為什麼掛 ALB，而不是只靠公有 IP]
Fargate 任務可以配一個**公有 IP** 直接連（測試很快），但那個 IP **會隨任務重開而改變**，而且沒有健康檢查、沒法把流量分散到多份任務。**ALB（Application Load Balancer）** 給你一個**固定的網址**，會自動把流量導到健康的任務、某份掛了就不送它流量——這才是正式服務該有的樣子。本篇用 ALB 示範正規做法；若你只想最快看到畫面，也可以在建服務時關掉 ALB、改在網路設定勾「指派公有 IP」，用那個 IP:3000 直接測（記得安全群組開 3000）。

**預期會看到**：
- 服務建立後，**任務（Tasks）** 分頁會出現一份任務，狀態從 `PROVISIONING` → `PENDING` → 最後停在 **`RUNNING`**（約 1~3 分鐘）。
- 若卡在 `PENDING` 一直重啟，多半是映像拉不到（執行角色問題）或容器起來就掛（看 CloudWatch 日誌）。
:::

### 步驟七：用瀏覽器測試

- **走 ALB**：到 EC2 主控台 → **負載平衡器（Load Balancers）** → 找到剛建的 ALB → 複製 **DNS 名稱**（像 `hello-xxxx.ap-northeast-1.elb.amazonaws.com`），貼到瀏覽器打開。
- **走公有 IP**（若你沒掛 ALB）：到 ECS 服務的任務詳細頁 → 找 **公有 IP** → 瀏覽器開 `http://<公有IP>:3000`。

看到 `Hello from ECS Fargate!` 就代表整條鏈走通了：**你沒自己開任何一台伺服器，程式卻在雲上跑起來、對外服務了。**

:::note[🔍 預期會看到什麼（逐條對照）]
- ALB DNS 開啟後，頁面顯示 `Hello from ECS Fargate!`。
- 回 ECS 服務的 **健康（Health）** 狀態，目標群組裡那份任務是 **`healthy`**。
- 若瀏覽器一直轉圈或 504：十之八九是**安全群組沒開 ALB 到容器的 3000 埠**，或**健康檢查路徑／埠設錯**導致目標被判 `unhealthy`、ALB 不送流量。
:::

---

## 進階：不能 SSH，那要怎麼進容器查問題？

傳統 EC2 出問題你會 SSH 進去看，但 **Fargate 沒有你能 SSH 的底層機器**。正解是 **ECS Exec**：在服務上啟用後，用 CLI 直接「鑽進」正在跑的容器開一個 shell：

```bash
$ aws ecs execute-command \
    --cluster hello-cluster \
    --task <任務ID> \
    --container hello-ecs \
    --interactive \
    --command "/bin/sh" \
    --region ap-northeast-1
```

（前提：建服務時啟用了 `enableExecuteCommand`，且任務角色有對應的 SSM 權限。）這就是 Fargate 世界的「SSH 替代品」，查環境變數、看檔案、測連線都靠它。

---

## 常踩雷

:::warning[🚑 常踩雷（這幾個新手幾乎都中過）]
- **一律用 `latest` 標籤**：每次都 push 成 `hello-ecs:latest`，出事時你根本不知道線上到底是哪一版、也沒法乾淨回溯到上一版。**用明確版本標籤**（`v1`、`v2`，或 git commit 的雜湊），要回滾時只要把任務定義指回舊標籤即可。
- **任務角色 vs 執行角色搞混**：以為「app 要讀 S3 所以把 S3 權限加到執行角色」——錯。**執行角色**是給 ECS 拉映像／寫日誌用的；**任務角色**才是給你容器內程式呼叫 AWS 服務用的。放錯地方，不是任務起不來（執行角色缺權限），就是程式存取別的服務被 AccessDenied（任務角色缺權限）。
- **安全群組沒開埠**：服務明明 `RUNNING`，瀏覽器卻連不到。最常見就是安全群組沒放行「ALB → 容器 3000 埠」的入站，或 ALB 本身的安全群組沒開 80。埠一路對不上（容器 `EXPOSE`、任務定義 `containerPort`、目標群組埠、安全群組規則），就是連不到。
- **映像做得太肥**：直接用完整版基底、把一堆開發工具和原始檔都包進去，映像動輒上 GB，push／pull 又慢又貴。**用精簡基底（alpine／slim）**、善用 `.dockerignore` 排除 `node_modules`、`.git`、測試檔，必要時用多階段建置（multi-stage build）只留產物。
- **以為 Fargate 能 SSH**：Fargate 沒有可登入的底層機器，別再找 SSH 金鑰。要進容器除錯請用 **ECS Exec**（見上一節），且記得建服務時要先啟用它、任務角色要給 SSM 權限，不是臨時想進就進得去。
:::

---

## 清理資源，避免被扣款

:::warning[🧹 做完一定要清理！不清理會持續扣款]
請務必依序把這次開的東西全部清掉（執行中的 Fargate 任務與 ALB 都是按時計費的）：

**1. 把服務的任務數歸零並刪掉服務**
- 進 `ECS` → `hello-cluster` → **服務** → 勾選 `hello-service` → **更新（Update）** 把「所需任務數」改成 `0`，等任務全部停掉。
- 再 **刪除（Delete）** 這個服務。

**2. 刪掉叢集**
- 服務刪乾淨後 → 回叢集 → **刪除叢集（Delete cluster）**。

**3. 刪掉 ALB 與目標群組**
- 進 `EC2` → **負載平衡器（Load Balancers）** → 勾選剛建的 ALB → **刪除**。
- 再到 **目標群組（Target Groups）** → 刪掉對應的目標群組。
- （ALB 只要存在就按小時計費，這是本篇最容易忘、最會扣錢的一項。）

**4. 刪掉 ECR 裡的映像（或整個儲存庫）**
- 進 `ECR` → `hello-ecs` → 勾選映像 → **刪除**；或直接刪掉整個儲存庫：

```bash
$ aws ecr delete-repository \
    --repository-name hello-ecs \
    --force \
    --region ap-northeast-1
```
:::

<Cost title="💰 成本提醒">

這篇真正會扣錢的是**執行中的 Fargate 任務**（按 vCPU／記憶體用量以秒計費）與 **ALB**（只要存在就按小時 + 流量計費）。ECR 存一個小映像、少量流量費用極低。照步驟做、做完**立刻清理**（服務歸零 → 刪服務 → 刪叢集 → 刪 ALB／目標群組 → 清 ECR），基本上花不了多少錢。最容易中招的是**忘了刪 ALB**——它會一直默默計費。記住：**資源開了就要記得關。**

</Cost>

---

## 這對考試的意義

DVA 的「測試與部署」領域很愛考這條容器鏈，請牢記：

- **「要跑容器、但不想管底層伺服器」→ 答案通常是 ECS Fargate（或 App Runner、EKS Fargate 視情境）**；題目強調「serverless 容器、免維運機器」時，Fargate 幾乎是標準答案。
- **執行角色（Execution Role）與任務角色（Task Role）的分工是高頻考點**：拉映像／寫日誌 = 執行角色；容器內程式呼叫 AWS 服務 = 任務角色。看到「容器要讀 S3，權限該放哪」，選**任務角色**。
- **連不到服務先想網路**：安全群組／目標群組埠／健康檢查，是「服務 RUNNING 卻連不到」的三大元兇。
- **映像標籤別用 `latest`**：可回溯、可回滾是部署的基本功，考題談「安全部署／回滾」時要往這個方向想。

<Refs title="📚 官方資料與延伸閱讀">

- [Amazon ECS 使用者指南](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/Welcome.html)
- [AWS Fargate 於 Amazon ECS](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html)
- [將 Docker 映像推送到 Amazon ECR](https://docs.aws.amazon.com/AmazonECR/latest/userguide/docker-push-ecr-image.html)
- [ECS 任務定義參數](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definition_parameters.html)
- [任務執行角色與任務角色的差別](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-iam-roles.html)
- [用 ECS Exec 進入容器除錯](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-exec.html)

</Refs>

做完這個實驗，你已經走通了「程式碼到雲上執行」最主流的一條現代部署鏈。把這條鏈練到能閉著眼睛走，無論是面試、考試還是真的要上線，都是扎實的底氣。
