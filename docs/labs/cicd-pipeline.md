---
sidebar_position: 7
title: 實驗 7：用 CodePipeline 自動部署
---

# 實驗 7：用 CodePipeline 建一條 CI/CD 自動部署（push 完就自動建置部署）

> 這個實驗要回答開發者天天在想的一件事：**我把程式碼 push 上去，能不能就自動幫我建置、測試、部署，不用我手動跑指令、手動上傳？** 答案是——用 **CodePipeline** 把「拉程式碼 → 建置 → 部署」串成一條**自動化流水線**，有新 commit 就自動跑完整條。這是 DVA 考試 Domain 3（測試與部署）的核心，也是正式團隊的日常。全程走免費額度邊緣，做完一定要清理。

<Vocab title="📌 先認識這篇會出現的名詞（完全沒碰過也能懂）">

- **CI/CD（持續整合／持續部署）**：每次改程式碼就**自動**把它整合、建置、測試、部署出去的一套做法，取代「手動打包、手動上傳」。
- **Pipeline（流水線）**：把一連串步驟串起來的自動化流程。這裡用 **CodePipeline** 把「拉碼 → 建置 → 部署」接成一條。
- **Source（來源階段）**：流水線的第一站，負責去 repo 把最新的程式碼抓下來，當作後面要加工的材料。
- **Build（建置階段）**：由 **CodeBuild** 執行，依照 `buildspec.yml` 的指令把程式碼編譯、打包，產出可部署的成品。
- **Artifact（產物）**：某個階段的輸出成品（例如打包好的檔案），會被存進一個 S3 貯體，再傳給下一階段使用。
- **buildspec.yml**：放在 repo 根目錄的設定檔，用來告訴 CodeBuild「每個階段要跑哪些指令、哪些檔案是產物」。
- **服務角色（Service Role）**：你授權給 CodeBuild／CodePipeline「代替你去操作其他 AWS 服務」的 IAM 角色。權限不足就會卡住。
- **Secrets Manager**：AWS 專門存放密碼、金鑰、連線字串等**機密**的服務，程式在執行時才去取，不寫死在程式碼或設定檔裡。

</Vocab>

:::note[💬 閱讀小提示]
看到帶<Term desc="像這樣！滑鼠移到有虛線的名詞上（手機點一下），就會跳出白話解釋。">虛線底線的名詞</Term>，把滑鼠移上去就會跳出白話解釋。所有名詞也整理在 [名詞與服務對照表](/glossary)。
:::

:::info[開始前的前提]
這篇假設你已經有這些基礎：

- 有一個 **AWS 帳號**，且已**設好帳單告警（Billing Alarm）**，花超過門檻會收到通知。
- 有一個可以放程式碼的 repo。本篇用 **GitHub** 當來源（CodePipeline 也支援 CodeCommit、S3，步驟大同小異）。
- 建議整篇固定在同一個**區域（Region）**（例如「亞太區域（東京）ap-northeast-1」），比較不會找不到自己開的資源。

還沒做完？先回頭補完再來。
:::

---

## 情境：為什麼要有一條自動部署流水線？

<Scenario title="真實情境：你是後端開發，每次上線都手忙腳亂">

以前你每次要上線，流程是：本機打包 → 手動把檔案上傳到伺服器／貯體 → 手動重啟服務。步驟一多就會漏，哪天忘了跑測試、或上傳到錯的環境，線上就炸了。你想要的其實很單純：**我 `git push` 完，剩下的交給機器自動做完，而且每次都用一模一樣的步驟。**

這就是 CI/CD。你把「要做哪些事」寫成設定（`buildspec.yml`），把「誰接誰」串成流水線（CodePipeline），之後只要 push，流水線就自動跑：抓最新程式碼、建置、部署。人為手動的環節消失了，也就少了一整類「手滑」的意外。

</Scenario>

### 這條流水線長什麼樣子？

<div className="flow">
  <div className="flow-node">Source<br/>（抓 GitHub 最新程式碼）</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Build<br/>（CodeBuild 依 buildspec 建置）</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Deploy<br/>（部署成品到目標）</div>
</div>

*圖：三個階段依序跑，前一階段的**產物（artifact）**會自動傳給下一階段。任何一階段失敗，流水線就停在那、不會把壞東西部署出去。*

:::info[🤔 為什麼拆成三個階段，而不是一支腳本做完？]
你當然可以寫一支大腳本把所有事做完，但拆成 **Source／Build／Deploy** 三段有實在的好處：

- **看得到卡在哪**：哪一階段紅了一眼就知道，是程式碼沒拉到、建置失敗、還是部署出錯，不用翻一大坨 log 猜。
- **可重跑單一階段**：部署失敗時，可以只重跑 Deploy，不用從頭 build。
- **責任分離**：Build 由 CodeBuild 專心做「編譯打包」，Deploy 專心做「送到哪」，各自換工具都不影響對方。

這就是「流水線」比「一支腳本」更適合正式環境的原因。
:::

---

## 動手做：把一條流水線串起來

整體順序是：**準備 repo 與 `buildspec.yml` → 建 CodeBuild 專案 → 建 CodePipeline 串起三階段 → 觸發一次看結果 → 用 CloudWatch Logs 看建置日誌。**

### 步驟一：準備 repo 與 `buildspec.yml`

1. 在你的 GitHub repo 準備一點可部署的東西。最簡單的例子：一個靜態網站，根目錄放一個 `index.html`。
2. 在 **repo 根目錄**新增檔案 `buildspec.yml`，貼上下面這段：

```yaml
version: 0.2

phases:
  install:
    runtime-versions:
      nodejs: 20
    commands:
      - echo "安裝階段開始"
  build:
    commands:
      - echo "建置階段開始，時間 $(date)"
      - echo "這裡放你的建置指令，例如 npm install 和 npm run build"
  post_build:
    commands:
      - echo "建置完成，準備輸出產物"

artifacts:
  files:
    - '**/*'
  base-directory: '.'
```

3. commit 並 push 到 GitHub。

:::info[🤔 為什麼這樣做：`buildspec.yml` 是 CodeBuild 的「食譜」]
CodeBuild 自己不知道你的專案要怎麼建——它完全照 `buildspec.yml` 做事。這個檔決定了：

- **`phases`（階段）**：`install` 裝執行環境與相依套件、`build` 跑真正的建置指令、`post_build` 做收尾。分階段是為了讓你在 log 裡一眼看出「是裝環境失敗，還是編譯失敗」。
- **`artifacts`（產物）**：告訴 CodeBuild「哪些檔案是成品」，要打包起來傳給下一階段（Deploy）。這裡 `**/*` 代表把全部檔案都當產物。**漏寫 artifacts，Deploy 階段就會收到空包裹**。

**預期會看到**：repo 根目錄多了 `index.html` 與 `buildspec.yml`，GitHub 上看得到這次 commit。
:::

:::tip[💡 看懂這份 buildspec 的重點]
- `version: 0.2` 是目前通用的格式版本，照抄即可。
- 每個 `commands` 底下就是一行行 shell 指令，由上往下跑，**任何一行回傳非零（失敗），該階段就算失敗**，流水線停住。
- 真實專案的 `build` 裡通常是 `npm install`、`npm run build`、`mvn package` 之類；這裡用 `echo` 當佔位，讓你先把整條流水線跑通，再換成真指令。
:::

### 步驟二：建一個 CodeBuild 專案

1. 主控台搜尋 `CodeBuild` → **建立建置專案（Create build project）**。
2. **專案名稱（Project name）**：填 `cicd-lab-build`。
3. **來源（Source）**：選 **GitHub**，依指示授權連到你的 repo，選剛剛那個 repo 與分支（例如 `main`）。
4. **環境（Environment）**：
   - **受管映像（Managed image）** → 作業系統 **Amazon Linux**、執行環境選標準映像。
   - **服務角色（Service role）**：選**新增服務角色（New service role）**，讓它自動幫你建一個（名字記下來，之後要補權限與清理）。
5. **Buildspec**：選「**使用 buildspec 檔案（Use a buildspec file）**」——它會自動去 repo 根目錄找 `buildspec.yml`。
6. 其他維持**預設** → **建立建置專案**。

:::info[🤔 為什麼這樣做：先單獨把 Build 跑通，再接進流水線]
我們刻意**先只建 CodeBuild 專案**，而不是一口氣把整條流水線拉起來。原因是：建置最容易出錯（環境、相依套件、`buildspec` 寫法），先單獨把它跑綠，後面串流水線時就能排除「是不是 build 本身壞了」。

**為什麼讓它「使用 buildspec 檔案」而不是在主控台貼指令？** 因為把建置步驟放進 repo 的 `buildspec.yml`，等於讓建置設定**跟程式碼一起版本控管**——誰改了建置流程、改了什麼，git 歷史都看得到；也不會發生「主控台設定和程式碼不同步」的鬼打牆。

**預期會看到**：CodeBuild 專案清單出現 `cicd-lab-build`；點進去可以看到它連到你的 GitHub repo，且 Buildspec 來源是「檔案」。
:::

### 步驟三：建 CodePipeline，串起 Source → Build → Deploy

1. 主控台搜尋 `CodePipeline` → **建立管道（Create pipeline）**。
2. **管道名稱（Pipeline name）**：填 `cicd-lab-pipeline`。
3. **服務角色（Service role）**：選**新增服務角色**，讓它自動建（名字記下來）。
4. **產物貯體（Artifact store）**：讓它用**預設**自動建一個 S3 貯體存產物（名字會像 `codepipeline-ap-northeast-1-xxxx`，記下來，清理時要刪）。
5. **來源階段（Source stage）**：
   - 來源供應商選 **GitHub**，連到你的 repo，選分支 `main`。
   - 觸發方式維持預設（有新 commit 就觸發）。
6. **建置階段（Build stage）**：
   - 建置供應商選 **AWS CodeBuild**，專案選步驟二建好的 `cicd-lab-build`。
7. **部署階段（Deploy stage）**：
   - 部署供應商選一個你想部署到的目標。最簡單示範是 **Amazon S3**（部署成靜態網站）：選一個你先建好的、要當網站的 S3 貯體，勾選「部署前先解壓縮檔案（Extract file before deploy）」。
   - （若你的目標是 EC2／ECS，供應商改選 **CodeDeploy** 等，概念一樣：把 Build 產物送到目標。）
8. 檢視設定 → **建立管道**。建立完成它通常會**自動觸發第一次執行**。

:::info[🤔 為什麼這樣做：CodePipeline 是「指揮」，自己不幹活]
CodePipeline 本身**不建置、不部署**——它是指揮家，負責「叫 Source 去抓碼、叫 CodeBuild 去建、叫 Deploy 去部署」，並在階段之間**傳遞產物（artifact）**。真正幹活的是各階段背後的服務。

**為什麼需要那個 artifact 貯體？** 因為階段之間不是直接把檔案「手遞手」，而是：Source 把抓到的程式碼打包丟進 S3 貯體 → Build 從貯體拿出來、建置完把產物再丟回貯體 → Deploy 從貯體拿產物去部署。這個 S3 貯體就是階段之間的**中轉站**，所以清理時別忘了刪它。

**預期會看到**：建立後自動進入執行畫面，三個階段（Source／Build／Deploy）由上到下排列，會看到它們**依序由「進行中（藍色）」轉為「成功（綠色）」**。
:::

### 步驟四：觸發一次，看執行結果

如果建立完沒有自動跑，或你想再跑一次，到 pipeline 詳細頁點 **釋出變更（Release change）** 手動觸發。或者更貼近真實：**在 repo 改一行 `index.html` 再 push**，流水線應該會自己動起來。

:::note[🔍 預期會看到什麼（逐階段對照）]
- **Source** 先轉綠：代表成功從 GitHub 抓到你最新的 commit（階段上會顯示 commit 訊息與 ID）。
- **Build** 接著跑：點該階段的「詳細資訊」可看到即時輸出，最後出現 `build` 與 `post_build` 裡那幾句 `echo` 的文字，階段轉綠代表 `buildspec` 跑完且回傳成功。
- **Deploy** 最後轉綠：產物被送到你的 S3 貯體。打開那個網站貯體的物件清單，會看到 `index.html` 已更新；若有開靜態網站托管，用網址開會看到你改的內容。
- **全部三個階段都綠**，就代表這條 CI/CD 流水線通了：你只 `git push`，機器就自動幫你建置部署完畢。
:::

### 步驟五：用 CloudWatch Logs 看 build 日誌

建置失敗（Build 階段變紅）時，最重要的技能就是**看 log 找原因**。

1. 在 pipeline 的 Build 階段點 **詳細資訊（Details）**，會帶你到該次 CodeBuild 的執行頁。
2. 點 **建置日誌（Build logs）** 頁籤，或點「在 CloudWatch 中檢視整個日誌（View entire log in CloudWatch Logs）」。
3. 在 CloudWatch Logs 裡，日誌群組通常叫 `/aws/codebuild/cicd-lab-build`，點進最新的日誌串流，就能逐行看到每個 `phase` 實際跑了什麼、哪一行報錯。

:::info[🤔 為什麼這樣做：log 是你 debug 的唯一真相]
階段顯示「紅色失敗」只告訴你「壞了」，**不會**告訴你為什麼壞。真正的原因都在 CloudWatch Logs 裡——是 `npm install` 找不到套件、是權限 AccessDenied、還是 `buildspec` 某行指令打錯。養成「一紅就先看 log」的反射，比盲猜快得多。

**預期會看到**：CloudWatch Logs 裡有一條 `/aws/codebuild/cicd-lab-build` 日誌群組，點進去能看到 `install`、`build`、`post_build` 各階段的輸出，包含你 `buildspec` 裡寫的 `echo` 內容；若建置失敗，紅字錯誤訊息通常就在失敗那行的附近。
:::

---

## 別把機密寫進 buildspec：改用 Secrets Manager

很多人第一次會把資料庫密碼、API 金鑰直接 `echo` 進 `buildspec.yml` 或塞成明文環境變數——**千萬別**。`buildspec.yml` 會進 git、會被印進 CloudWatch Logs，等於把機密公開放到兩個地方。

正確做法是把機密存進 **Secrets Manager**（或 SSM Parameter Store 的 SecureString），在 `buildspec` 裡用 `env` 區塊的 `secrets-manager` 參照取用，CodeBuild 執行時才動態帶入，log 裡也會自動遮蔽。概念像這樣：

```yaml
env:
  secrets-manager:
    DB_PASSWORD: "my-secret-name:password"
```

這樣程式能拿到密碼，但密碼**從不出現在程式碼、設定檔或日誌裡**。記得這個角色要有讀取該密碼的權限。

:::warning[🚑 常踩雷（這幾個新手幾乎都中過）]
- **CodeBuild 服務角色少權限**：最常見。build 跑到一半跳 `AccessDenied`——例如要寫 artifact 貯體、要讀 Secrets Manager、要部署到 S3／ECR，但那個自動建的服務角色沒給對應權限。解法：到 IAM 找到該服務角色，按 log 裡缺的那個動作補上最小必要權限，不要圖方便直接給 `*`。
- **buildspec 階段寫錯**：`phases` 名稱打錯（例如把 `build` 寫成 `builds`）、縮排用了 Tab、或 `version` 漏寫，CodeBuild 會直接判定 buildspec 無效，build 秒紅。YAML 對縮排與拼字極敏感，照範例一字不差。
- **artifact 傳不過去**：`buildspec` 漏寫 `artifacts` 區塊、或 `files`／`base-directory` 指錯路徑，結果 Build 綠了但 Deploy 拿到空包裹、部署出來少檔案。部署前先確認你要給下一階段的檔案，真的被列進 `artifacts`。
- **把機密寫進 buildspec**：如上一段。密碼、金鑰、連線字串一律進 **Secrets Manager**，用 `secrets-manager` 參照取用，**絕不**明文寫進 `buildspec.yml` 或程式碼。這是 DVA 安全領域的高頻考點。
- **忘了 Source 的授權連線**：GitHub 連線沒授權成功，Source 階段會卡在無法抓碼。重新到來源設定裡完成 OAuth／連線授權。
:::

---

## 清理資源，避免被扣款

:::warning[🧹 做完一定要清理！不清理會持續扣款]
請務必依序把這次開的東西全部清掉：

**1. 刪掉 CodePipeline 管道**
- 進 `CodePipeline` → 勾選 `cicd-lab-pipeline` → **刪除（Delete）** → 輸入 `delete` 確認。

**2. 刪掉 CodeBuild 建置專案**
- 進 `CodeBuild` → 建置專案 → 勾選 `cicd-lab-build` → **刪除建置專案（Delete build project）**。

**3. 清空並刪掉 artifact 貯體**
- 進 `S3` → 找到那個自動建的產物貯體（名字像 `codepipeline-你的區域-xxxx`）→ 點進去全選物件 → **刪除（Delete）**（貯體必須先清空才能刪）→ 回清單勾選該貯體 → **刪除** → 輸入貯體名稱確認。
- 若你另外為 Deploy 建了網站貯體、或實驗過程建了任何測試貯體，一併清掉。

**4. 刪掉自動建的 IAM 服務角色**
- 進 `IAM` → **角色（Roles）** → 找到 CodePipeline 與 CodeBuild 剛剛自動建的那兩個服務角色 → 確認沒別處在用後 **刪除（Delete）**。

**5.（若有建）刪掉 Secrets Manager 的密碼**
- 進 `Secrets Manager` → 勾選你為這次實驗建的密碼 → **刪除（Delete）**（它會有一段排程刪除的等待期，屬正常）。
:::

<Cost title="💰 成本提醒">

CodePipeline 以「作用中的管道」按月計費（每月第一條通常有免費額度）；CodeBuild 按建置分鐘數計費（有每月免費額度）；artifact 存在 S3 的少量檔案費用極低。真正會中招的，是**留著沒刪的管道按月扣**、以及**忘了清的 artifact 與網站貯體**。記住：**資源開了就要記得關。**

</Cost>

---

## 這對考試的意義

DVA Domain 3（測試與部署）反覆在考這條流水線的角色分工，請記住：

- **CodePipeline 是「編排／指揮」**，負責串接與傳遞 artifact；**CodeBuild 是「建置引擎」**，吃 `buildspec.yml` 做編譯打包；部署端常見 **CodeDeploy**（EC2／Lambda／ECS）或直接到 **S3**。看到「串接多個階段、自動化整個發布流程」就想到 CodePipeline。
- **`buildspec.yml` 放在 repo 根目錄**，用 `phases`（install／pre_build／build／post_build）與 `artifacts` 定義建置與產物——這是必考的細節。
- **機密一律進 Secrets Manager／Parameter Store**，用參照取用，不寫進程式碼或 `buildspec`。題目出現「把密碼硬寫進環境變數／程式碼」幾乎都是錯誤選項。
- 看到「build 失敗要查原因」→ 答案是去看 **CloudWatch Logs**。

把直覺練成反射：**CodePipeline 指揮、CodeBuild 建置、buildspec 定義步驟、機密進 Secrets Manager。**

<Refs title="📚 官方資料與延伸閱讀">

- [AWS CodePipeline 使用者指南](https://docs.aws.amazon.com/codepipeline/latest/userguide/welcome.html)
- [AWS CodeBuild 使用者指南](https://docs.aws.amazon.com/codebuild/latest/userguide/welcome.html)
- [Buildspec 檔案參考（Build specification reference）](https://docs.aws.amazon.com/codebuild/latest/userguide/build-spec-ref.html)
- [在 CodeBuild 使用 Secrets Manager 的機密](https://docs.aws.amazon.com/codebuild/latest/userguide/build-spec-ref.html#build-spec.env.secrets-manager)
- [CodePipeline 中的 CloudWatch Logs 監控](https://docs.aws.amazon.com/codebuild/latest/userguide/cloudwatch-logs.html)

</Refs>

這條流水線跑通後，你已經親手把「push 完自動建置部署」變成現實，這正是 DVA 想確認你會的事。
