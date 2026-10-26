---
sidebar_position: 7
title: Domain 3 練習題
---

# Domain 3 原創練習題（仿官方考題風格）

先自己點選答案，再按「**顯示答案與解析**」。本頁對齊 DVA-C03 官方題型：**情境式題幹、開發者的部署視角**，考的是**測試與部署**這塊的開發細節與取捨——CI/CD（CodePipeline 階段、CodeBuild 的 buildspec、CodeDeploy 的 appspec、建置權限、機密該放哪）、IaC（CloudFormation 變更集與 DeletionPolicy、堆疊更新、SAM 與 CDK 何時用）、部署策略（藍綠／金絲雀／滾動／就地怎麼選、Lambda 別名加權、快速回復）、容器（ECR 映像標籤、任務定義、Fargate vs EC2、任務角色 vs 執行角色）、測試（單元 vs 整合、mock、AI 輔助測試仍需人工驗證）。選項皆為合理的 AWS 做法（誘答選項不會明顯錯誤），部分題用「**最符合最佳實務／最安全／最能快速回復**」等**限定詞**逼你比較。包含**單選**與**複選（Choose TWO）**兩種題型。題目為**原創**內容（非真實考題）。

<Quiz
  qnum={1}
  total={20}
  question="某團隊要用 CodePipeline 打造「程式一推上 CodeCommit 就自動建置、再自動部署到正式環境」的流水線。關於 CodePipeline 的核心概念，下列敘述何者正確？"
  options={[
    'CodePipeline 本身負責編譯程式碼，不需要 CodeBuild',
    'CodePipeline 把發布過程切成多個階段（stage），每個階段內有動作（action），可串接來源、建置、部署等不同服務',
    'CodePipeline 只能部署到 EC2，不支援 Lambda 或 ECS',
    'CodePipeline 一定要人工在每個階段按核准才會往下走',
  ]}
  answer={1}>

**正解：B**

CodePipeline 是**編排（orchestration）**工具，把發布流程切成一連串**階段（stage）**，每個階段裡放**動作（action）**，分別串接來源（CodeCommit／S3／GitHub）、建置（CodeBuild）、測試、部署（CodeDeploy／ECS／Lambda／CloudFormation）等服務。A 錯，編譯是 CodeBuild 做的，CodePipeline 只負責串接；C 錯，它支援 EC2、Lambda、ECS、S3 等多種部署目標；D 錯，人工核准（manual approval）是可選的動作，不是必要。

</Quiz>

<Quiz
  qnum={2}
  total={20}
  question="開發者要用 CodeBuild 建置一個 Node.js 專案：先安裝相依套件、再跑測試、最後打包產物。這些步驟與指令應該寫在哪裡？"
  options={[
    '寫在 CodePipeline 的設定裡，CodeBuild 會自動讀取',
    '寫在專案根目錄的 buildspec.yml，用 phases（install／pre_build／build／post_build）與 artifacts 定義指令與產物',
    '寫在 appspec.yml 裡',
    '不用寫，CodeBuild 會自動偵測並建置任何語言',
  ]}
  answer={1}>

**正解：B**

CodeBuild 的建置指令定義在 **buildspec.yml**（預設放專案根目錄）：用 `phases` 分成 `install`、`pre_build`、`build`、`post_build` 等階段寫指令，用 `artifacts` 指定要輸出的建置產物。A 錯，建置細節屬於 buildspec 而非 pipeline 設定；C 錯，`appspec.yml` 是 **CodeDeploy** 用的部署規格，不是 CodeBuild；D 錯，CodeBuild 需要你明確指定建置步驟。

</Quiz>

<Quiz
  qnum={3}
  total={20}
  question="某 CodeBuild 專案在建置時要連線資料庫做整合測試，需要一組資料庫密碼。團隊想「密碼絕不出現在 buildspec.yml 或程式碼裡」。最符合最佳實務的做法是？"
  options={[
    '直接把密碼明文寫在 buildspec.yml 的環境變數',
    '把密碼存進 Secrets Manager（或 SSM Parameter Store 的 SecureString），在 buildspec 用 secrets-manager／parameter-store 參照取用，並給建置的服務角色對應讀取權限',
    '把密碼硬寫在測試程式碼裡再 commit',
    '把密碼放在 CodeBuild 專案描述欄位',
  ]}
  answer={1}>

**正解：B**

機密應存在 **Secrets Manager** 或 **SSM Parameter Store 的 SecureString**，在 buildspec 的 `env` 區塊用 `secrets-manager` 或 `parameter-store` 參照，建置時才動態注入，且要給 CodeBuild 的**服務角色**讀取該機密的權限。A、C、D 都把密碼明文暴露在 buildspec／程式碼／設定欄位，等於外洩，違反機密保護原則。

</Quiz>

<Quiz
  qnum={4}
  total={20}
  question="團隊要用 CodeDeploy 把應用程式部署到一組 EC2 執行個體，需要定義「部署的生命週期各階段要跑什麼腳本（例如停服務、裝檔案、起服務、驗證）」。這份規格檔是什麼？"
  options={[
    'buildspec.yml',
    'appspec.yml（指定檔案對應與各生命週期掛鉤要執行的腳本）',
    'template.yaml',
    'Dockerfile',
  ]}
  answer={1}>

**正解：B**

CodeDeploy 讀 **appspec.yml（或 appspec.json）**：對 EC2／On-premises 部署，它定義檔案要複製到哪、以及各**生命週期事件掛鉤（hooks）**（如 `BeforeInstall`、`AfterInstall`、`ApplicationStart`、`ValidateService`）要執行哪些腳本。A 的 buildspec 是 CodeBuild 用的；C 的 template.yaml 是 CloudFormation／SAM 用的；D 的 Dockerfile 是建置容器映像用的。

</Quiz>

<Quiz
  qnum={5}
  total={20}
  question="關於 CodeDeploy 針對 EC2／On-premises 部署的 appspec.yml 生命週期掛鉤，下列哪兩項描述正確？（Choose TWO）"
  options={[
    'hooks 可以指定在 BeforeInstall、AfterInstall、ApplicationStart、ValidateService 等事件執行自訂腳本',
    'appspec.yml 的 files 區塊用來指定來源檔案複製到執行個體的哪個目的路徑',
    'appspec.yml 只能用來部署到 Lambda，不能用在 EC2',
    'hooks 裡的腳本一定要用 Python 撰寫，其他語言無效',
    'appspec.yml 會自動編譯你的原始碼',
  ]}
  answer={[0, 1]}>

**正解：A、B**

對 EC2／On-premises，appspec.yml 的 **`hooks`** 可在部署生命週期的各事件（`BeforeInstall`、`AfterInstall`、`ApplicationStart`、`ValidateService` 等）掛上自訂腳本；**`files`** 區塊則指定來源與目的路徑，決定檔案複製到執行個體何處。C 錯，EC2／On-premises 正是 appspec 的主要用途之一（Lambda／ECS 部署的 appspec 格式不同但同樣支援）；D 錯，腳本語言不限 Python；E 錯，編譯是建置階段（CodeBuild）的事，appspec 不做編譯。

</Quiz>

<Quiz
  qnum={6}
  total={20}
  question="某開發者要更新一個正式環境的 CloudFormation 堆疊，但擔心「某些修改會導致資源被取代或中斷」，希望「先看到這次更新會對哪些資源做什麼改動，確認後再執行」。最適合的做法是？"
  options={[
    '直接 update-stack，有問題再回復',
    '先建立變更集（change set）預覽這次更新會新增／修改／刪除哪些資源與是否會取代，確認後再執行變更集',
    '刪掉整個堆疊再重建',
    '手動到主控台一個一個改資源',
  ]}
  answer={1}>

**正解：B**

**變更集（change set）**讓你在真正套用前，先**預覽**這次更新會對哪些資源做新增／修改／刪除，以及是否會造成**資源取代（replacement）**；確認無虞後再執行該變更集。A 直接更新少了預覽、風險高；C 刪掉重建會造成不必要的中斷與資料遺失風險；D 手動改資源會讓堆疊與實際狀態漂移（drift）。

</Quiz>

<Quiz
  qnum={7}
  total={20}
  question="某 CloudFormation 堆疊裡有一個存放重要資料的 S3 貯體與一個 RDS 資料庫。團隊擔心「有人不小心刪掉堆疊時，這些資料也跟著沒了」。要讓這些資源在堆疊被刪除時仍保留，應該設定什麼？"
  options={[
    '把資源移出堆疊手動管理',
    '在這些資源上設定 DeletionPolicy: Retain，堆疊刪除時保留該資源',
    '把堆疊設成唯讀',
    '什麼都不用做，CloudFormation 預設不會刪資源',
  ]}
  answer={1}>

**正解：B**

在資源上設定 **`DeletionPolicy: Retain`**，當堆疊被刪除時 CloudFormation 會**保留**該資源而不刪除（也可用 `Snapshot` 在刪除前先做快照，適用 RDS 等支援的資源）。A 把資源移出失去了 IaC 管理的好處；C CloudFormation 沒有「唯讀堆疊」這種設定；D 錯，預設行為是刪除堆疊時一併刪除其建立的資源，所以才需要 DeletionPolicy 來改變。

</Quiz>

<Quiz
  qnum={8}
  total={20}
  question="某開發者專案是 Serverless 架構（Lambda + API Gateway + DynamoDB），想用「比原生 CloudFormation 更精簡的語法」來定義這些資源並方便本機測試。最適合的工具是？"
  options={[
    'AWS SAM（Serverless Application Model），用精簡語法定義 Serverless 資源，可用 sam local 在本機測試',
    '直接手刻完整的原生 CloudFormation，不用任何輔助',
    'Terraform Enterprise',
    '只能用主控台手動建立',
  ]}
  answer={0}>

**正解：A**

**AWS SAM** 是 CloudFormation 的擴充，提供 `AWS::Serverless::*` 等**精簡語法**專門描述 Lambda、API Gateway、DynamoDB 等 Serverless 資源，部署時會展開成標準 CloudFormation；還能用 `sam local` 在本機叫用函式或模擬 API 做測試。B 原生 CloudFormation 寫 Serverless 冗長；C Terraform 是第三方工具、題目要的是 AWS 原生 Serverless 方案；D 手動建立無法重現與版本控管。

</Quiz>

<Quiz
  qnum={9}
  total={20}
  question="某團隊成員熟悉 TypeScript，想「用一般程式語言（而非 YAML/JSON）來描述基礎設施、享有型別檢查與迴圈條件等程式能力」。最適合的工具是？"
  options={[
    '只用 YAML 手寫 CloudFormation 範本',
    'AWS CDK（Cloud Development Kit），用 TypeScript/Python 等程式語言定義基礎設施，合成（synth）成 CloudFormation',
    '把基礎設施寫在 Word 文件裡',
    '用 CodeBuild 的 buildspec 當作基礎設施定義',
  ]}
  answer={1}>

**正解：B**

**AWS CDK** 讓你用 **TypeScript、Python、Java** 等**一般程式語言**定義基礎設施，享有型別檢查、迴圈、條件、重用等程式能力，執行 `cdk synth` 會**合成**成標準 CloudFormation 範本再部署。A 純 YAML 缺少程式語言的抽象與重用能力（這正是 CDK 的賣點）；C、D 都不是 IaC 工具。何時用 CDK：團隊偏好用程式語言、需要高度重用與抽象時；偏好宣告式純文字時仍可選 CloudFormation／SAM。

</Quiz>

<Quiz
  qnum={10}
  total={20}
  question="某正式環境服務要發布新版本，公司要求「如果新版有問題，必須能在數秒內切回舊版、把影響降到最低」，可接受短時間同時維護兩套環境的成本。最符合「可快速回復」需求的部署策略是？"
  options={[
    '就地部署（in-place），直接在現有執行個體上覆蓋新版',
    '藍綠部署（blue/green）：另建一套綠色環境部署新版，驗證後把流量切過去；出問題只要把流量切回藍色環境即可快速回復',
    '直接刪掉舊版再裝新版',
    '手動一台一台登入更新',
  ]}
  answer={1}>

**正解：B**

**藍綠部署**另建一套完整的「綠色」環境部署新版，驗證通過後再把流量從「藍色」切到「綠色」；一旦新版有問題，只要**把流量切回藍色環境**即可在極短時間內**快速回復**，因為舊版仍完整存在。代價是部署期間同時維護兩套環境、成本較高。A 就地部署直接覆蓋，回復得重新部署舊版、較慢；C 刪舊裝新沒有退路；D 手動更新慢且易錯。

</Quiz>

<Quiz
  qnum={11}
  total={20}
  question="某團隊想在正式環境「先把新版只放給一小部分流量（例如 10%），觀察指標沒問題後再逐步放大到 100%」，以降低全面出包的風險。關於這種金絲雀／線性（canary / linear）部署策略，下列哪兩項描述正確？（Choose TWO）"
  options={[
    '金絲雀先把一小比例流量導向新版，觀察指標正常後再把剩餘流量切過去',
    '線性部署每隔固定時間放大固定比例的流量（例如每 10 分鐘 +10%）',
    '這種策略一次就把 100% 流量切到新版，不分比例',
    '導入新版後就無法再回復到舊版',
    '這種策略只適用於實體機房，雲端完全不支援',
  ]}
  answer={[0, 1]}>

**正解：A、B**

**金絲雀（canary）**先把一小比例流量導向新版，觀察一段時間指標正常後，再一次把剩餘流量切過去；**線性（linear）**則是每隔固定時間放大固定比例（如每 10 分鐘 +10%）。兩者都用「先小量驗證再擴大」來降低風險。C 描述的是全量一次性（all-at-once）切換，風險最高、與金絲雀相反；D 錯，觀察到問題時可停止擴大並把流量切回舊版；E 錯，AWS（如 CodeDeploy 的 Lambda/ECS 金絲雀）原生支援這種策略。

</Quiz>

<Quiz
  qnum={12}
  total={20}
  question="某 Lambda 函式要發布新版本，開發者希望「用別名（alias）把 95% 流量導到舊版本、5% 導到新版本做驗證，確認後再調整比例」。這會用到 Lambda 的什麼機制？"
  options={[
    '直接改 $LATEST 的程式碼，沒有版本概念',
    '發布版本（version）並用別名（alias）指向版本，透過別名的加權路由（weighted alias / routing config）把流量按比例分到兩個版本',
    '為每個比例各建一個獨立函式',
    'Lambda 不支援流量分流',
  ]}
  answer={1}>

**正解：B**

Lambda 可**發布不可變的版本（version）**，並用**別名（alias）**指向版本；別名支援**加權路由（routing configuration）**，讓你把流量按比例（例如 95% 給版本 1、5% 給版本 2）分到**兩個版本**，正是金絲雀驗證的做法，驗證後再調整權重或指向新版。A 直接改 `$LATEST` 無法做分流與回復；C 建多個函式徒增管理；D 錯，Lambda 別名的加權路由就是為此設計。

</Quiz>

<Quiz
  qnum={13}
  total={20}
  question="某團隊在一組 EC2 Auto Scaling 的執行個體上部署，希望「每次只更新一部分執行個體、更新完再換下一批，讓服務全程維持可用，且不額外開一整套新環境」。最符合描述的策略是？"
  options={[
    '滾動部署（rolling）：分批逐步更新執行個體，更新一批再換下一批，期間服務持續可用',
    '藍綠部署，必須另開一整套新環境',
    '全部同時停機更新',
    '金絲雀部署，一定要加權到個別函式版本',
  ]}
  answer={0}>

**正解：A**

**滾動部署（rolling）**把更新分成數批，**每次只更新一部分執行個體**，該批完成並通過健康檢查後再換下一批，整個過程服務維持可用，且**不需要另開一整套環境**（成本較藍綠低）。代價是部署期間同時存在新舊版本、回復較藍綠慢。B 藍綠需另開整套環境，與「不額外開」矛盾；C 全部停機不符「全程可用」；D 金絲雀的加權路由主要用在 Lambda/ECS 流量比例，與此 EC2 分批情境不同。

</Quiz>

<Quiz
  qnum={14}
  total={20}
  question="某開發者把容器映像推上 ECR，流程是建置映像、標記版本、推送。關於 ECR 映像標籤（tag）的最佳實務，下列敘述何者最正確？"
  options={[
    '永遠只用 latest 標籤，方便省事',
    '用明確、不可變的版本標籤（如 git commit SHA 或語意化版本）以確保部署的是特定映像，便於追溯與回復；可另外搭配 latest 但不要只靠它',
    '映像不需要標籤',
    '每次都覆蓋同一個標籤，過去版本不用保留',
  ]}
  answer={1}>

**正解：B**

最佳實務是用**明確、不可變的標籤**（如 git commit SHA 或語意化版本號）標記映像，確保每次部署拉到的是**特定、可追溯的映像**，需要時能**精準回復**到某一版。只靠 `latest` 會因為它會被覆蓋而無法確定實際跑的是哪一版、也難回復。A、D 只用／覆蓋 latest 失去可追溯性與回復能力；C 無標籤無法引用特定映像。

</Quiz>

<Quiz
  qnum={15}
  total={20}
  question="某團隊在 ECS 上跑容器，不想管理底層的 EC2 執行個體、也不想負責修補作業系統，希望「只要定義容器要多少 CPU/記憶體，AWS 幫忙配置執行環境」。最符合描述的啟動類型是？"
  options={[
    'EC2 啟動類型，自行管理叢集中的 EC2 執行個體',
    'Fargate：無伺服器容器運算，只需定義容器所需資源，無須管理底層執行個體',
    '一定要自建 Kubernetes 叢集',
    'Fargate 需要你自己修補作業系統',
  ]}
  answer={1}>

**正解：B**

**Fargate** 是**無伺服器**的容器運算：你只需在任務定義裡宣告容器要多少 CPU／記憶體，AWS 負責配置與維運底層執行環境，**不用管理 EC2、不用修補作業系統**。A 的 EC2 啟動類型由你自行管理叢集中的執行個體（想精細控制主機或用特殊硬體時才選）；C 錯，ECS 本身就是容器編排、不必自建 K8s；D 錯，修補底層正是 Fargate 幫你省掉的。

</Quiz>

<Quiz
  qnum={16}
  total={20}
  question="某 ECS 任務裡的容器需要讀取 S3 貯體裡的資料。開發者想知道「該把 S3 讀取權限給哪個角色」。關於 ECS 的任務角色（task role）與執行角色（execution role），下列哪兩項描述正確？（Choose TWO）"
  options={[
    '任務角色（task role）是容器內應用程式用來呼叫 AWS 服務（如讀取 S3）的身分，S3 讀取權限應給它',
    '執行角色（task execution role）是給 ECS 代理去拉取 ECR 映像、寫入 CloudWatch Logs 等平台層動作用的',
    '任務角色與執行角色是同一個東西，隨便給哪個都行',
    '應該把 S3 讀取權限加到執行角色，因為它權限最大',
    '容器要用 AWS 服務一定得把 Access Key 寫進環境變數，不能靠角色',
  ]}
  answer={[0, 1]}>

**正解：A、B**

兩個角色職責不同：**任務角色（task role）**是**容器內應用程式**的身分，用來呼叫 AWS 服務（讀 S3、寫 DynamoDB 等），所以 S3 讀取權限要給**它**；**執行角色（task execution role）**是給 **ECS 代理／平台**用的，負責**拉取 ECR 映像、寫 CloudWatch Logs、取用 Secrets** 等啟動容器所需的平台動作。C 錯，兩者不同；D 錯，應用程式存取 S3 屬任務角色、不是塞進執行角色；E 錯，正確做法是靠角色取得暫時憑證而非硬寫金鑰。

</Quiz>

<Quiz
  qnum={17}
  total={20}
  question="某開發者為一個計算折扣金額的函式寫測試，想「在不連任何外部服務、不碰資料庫的情況下，快速驗證這個函式對各種輸入的回傳是否正確」。這類測試屬於？"
  options={[
    '整合測試（integration test），因為它驗證多個服務協作',
    '單元測試（unit test），聚焦單一函式／模組的邏輯，不依賴外部系統，執行快、易定位問題',
    '壓力測試（load test）',
    '手動測試',
  ]}
  answer={1}>

**正解：B**

**單元測試（unit test）**聚焦**單一函式或模組**的邏輯，隔離外部依賴、執行快、問題好定位——驗證「給定輸入是否回傳正確輸出」正是單元測試的典型。A 的整合測試是要驗證**多個元件／服務實際協作**（如函式真的讀寫資料庫、呼叫 API），範圍更大、較慢；C 壓力測試看的是負載下的效能；D 手動測試靠人操作，不符「快速自動驗證」。

</Quiz>

<Quiz
  qnum={18}
  total={20}
  question="開發者在為一個「會呼叫 DynamoDB 的函式」寫單元測試，但不想在測試時真的連 DynamoDB（會慢、會有費用、結果不穩定）。最適合的做法是？"
  options={[
    '測試時一律連真實的正式環境 DynamoDB',
    '用 mock／stub 模擬 DynamoDB 用戶端的回傳，讓單元測試不實際連線、可控且快速地驗證函式對各種回應的處理',
    '把 DynamoDB 的程式碼全部刪掉再測',
    '乾脆不要寫測試',
  ]}
  answer={1}>

**正解：B**

單元測試時應用 **mock／stub** 模擬外部依賴（如 DynamoDB 用戶端）的回傳，讓測試**不實際連線**，既快速又可控，還能刻意製造各種回應（成功、空結果、拋錯）來驗證函式的處理邏輯。A 連真實正式環境既慢又有費用與資料汙染風險；C 刪掉程式碼就不是在測原本的邏輯了；D 不寫測試違背題意與品質要求。（若要驗證「真的連得上並正確協作」，那屬整合測試的範疇。）

</Quiz>

<Quiz
  qnum={19}
  total={20}
  question="團隊導入 AI 輔助工具來協助產生程式碼與測試案例，以加速開發。關於在 CI/CD 與測試流程中使用 AI 產出的最佳實務，下列敘述何者最正確？"
  options={[
    'AI 產生的程式碼與測試可以直接部署到正式環境，不需任何人工審查',
    'AI 產出的程式碼與測試仍需經過人工審查與既有的自動化測試驗證，確認正確性與安全性後才納入流水線',
    '只要是 AI 產生的就一定正確，可以略過程式碼審查',
    '導入 AI 後就不再需要單元測試與整合測試',
  ]}
  answer={1}>

**正解：B**

AI 輔助工具能**加速**產生程式碼與測試案例，但其產出**仍需人工審查（code review）與既有的自動化測試驗證**——確認邏輯正確、沒有安全漏洞、符合需求後才納入 CI/CD 流水線。AI 可能產生看似合理但實際有誤或不安全的程式碼，故不可盲信。A、C 直接部署或略過審查風險極高；D 錯，單元與整合測試依然是驗證正確性的根本，不會因導入 AI 而不需要。

</Quiz>

<Quiz
  qnum={20}
  total={20}
  question="某 CodePipeline 要用 CloudFormation 部署基礎設施，執行部署動作時卻因權限不足失敗。開發者想知道「這個部署動作是用誰的身分去建立資源」。最正確的理解是？"
  options={[
    '用開發者本機的 Access Key',
    '用 CloudFormation 部署動作所指定的服務角色（以及 CodePipeline 自身的服務角色），應依最小權限授予它建立所需資源的權限',
    'CodePipeline 預設擁有帳號內所有權限，不會有權限問題',
    '必須把 Root 金鑰設定給 pipeline',
  ]}
  answer={1}>

**正解：B**

CodePipeline 的 CloudFormation 部署動作是以**該動作指定的服務角色**（CloudFormation 代入的角色）去建立／更新資源，同時 CodePipeline 本身也有一個**服務角色**負責串接各階段；兩者都應依**最小權限**授予所需權限，權限不足就會在該階段失敗。A 不會用開發者本機金鑰；C 錯，pipeline 預設沒有任意權限、全靠角色授予；D 用 Root 金鑰是嚴重安全風險且違反最小權限。

</Quiz>

完成 Domain 3！接著進入 Domain 4。
