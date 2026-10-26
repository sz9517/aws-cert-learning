---
sidebar_position: 6
title: Domain 3 閃卡
---

# Domain 3 閃卡

點一下卡片即可翻開說明。這頁把 Domain 3「測試與部署」的開發者重點濃縮成一張張小卡，涵蓋 CI/CD、基礎設施即程式碼、部署策略、容器與測試，考前快速複習最有效率。

## CI/CD

<Flashcards>
  <Flashcard term="CodePipeline">把「建置 → 測試 → 部署」串成一條自動化流水線的服務。程式碼一變動就自動跑完各階段，由多個 stage 組成，每個 stage 可再接不同 action。它只負責「編排」，實際工作交給 CodeBuild、CodeDeploy 等。</Flashcard>
  <Flashcard term="CodeBuild">全託管的建置服務，負責編譯原始碼、跑測試、打包成可部署的產出物（artifact）。你不用自己養建置伺服器，依建置時間付費，建置步驟寫在 buildspec.yml。</Flashcard>
  <Flashcard term="CodeDeploy">把應用程式自動部署到 EC2、Lambda 或 ECS 的服務。支援滾動、藍綠等多種策略，部署步驟與生命週期掛鉤寫在 appspec.yml，失敗可自動回復。</Flashcard>
  <Flashcard term="CodeArtifact">全託管的套件儲存庫，用來集中存放與分享 npm、pip、Maven 等相依套件。可當上游代理公開儲存庫、快取並控管團隊用到的套件版本與來源。</Flashcard>
  <Flashcard term="buildspec.yml">CodeBuild 的指令腳本，預設放在原始碼根目錄。用 phases（install／pre_build／build／post_build）描述每階段要跑的指令，並用 artifacts 指定要輸出哪些檔案給下一關。</Flashcard>
  <Flashcard term="appspec.yml">CodeDeploy 的部署設定檔。EC2/on-prem 版用它指定檔案複製到哪、以及 BeforeInstall／AfterInstall 等生命週期鉤子要跑的腳本；Lambda／ECS 版用它指定新版本與流量切換鉤子。</Flashcard>
  <Flashcard term="生命週期鉤子（Lifecycle Hook）">CodeDeploy 部署過程中的特定時點（如安裝前、流量切換前、切換後），可掛上自己的驗證腳本。常用來在正式切流量前先做健康檢查，不過關就中止部署。</Flashcard>
</Flashcards>

## 基礎設施即程式碼（IaC）

<Flashcards>
  <Flashcard term="CloudFormation 堆疊（Stack）">用一份範本（template）一次建立、更新、刪除一整組 AWS 資源，這組資源就叫一個堆疊。好處是環境可重現、可版本控管，刪堆疊就能把資源一次清乾淨。</Flashcard>
  <Flashcard term="變更集（Change Set）">更新堆疊前先產生的「預覽」，告訴你這次變更會新增、修改或刪除哪些資源，哪些會被取代重建。先看變更集再執行，避免不小心把資料庫砍掉重建。</Flashcard>
  <Flashcard term="DeletionPolicy">CloudFormation 資源屬性，決定刪除堆疊或移除資源時怎麼處理該資源：Retain 保留不刪、Snapshot 先拍快照再刪、Delete 直接刪（預設）。資料庫、S3 等重要資源常設 Retain。</Flashcard>
  <Flashcard term="SAM（Serverless Application Model）">CloudFormation 的無伺服器擴充，用更精簡的語法描述 Lambda、API Gateway、DynamoDB 等。sam build／deploy 會幫你打包並轉成完整的 CloudFormation 範本部署。</Flashcard>
  <Flashcard term="CDK（Cloud Development Kit）">用 TypeScript、Python 等「真正的程式語言」寫基礎設施，再合成（synth）成 CloudFormation 範本。可用迴圈、條件、函式重複利用，比手寫 YAML 更靈活，適合程式背景的人。</Flashcard>
  <Flashcard term="堆疊漂移（Drift）">有人直接在主控台改了資源，讓實際狀態與 CloudFormation 範本不一致，就叫漂移。用偵測漂移功能找出被手改的資源，提醒你別繞過 IaC 動手腳。</Flashcard>
</Flashcards>

## 部署策略

<Flashcards>
  <Flashcard term="就地部署（In-place）">直接在現有的執行個體上停掉舊版、裝上新版。省資源、不用多開機器，但更新期間服務會中斷、出事也沒有舊環境可立刻切回。</Flashcard>
  <Flashcard term="滾動部署（Rolling）">一次只更新一部分執行個體，分批替換直到全部換新。期間新舊版並存、服務不中斷，但回復較慢，且要留意新舊版本相容性。</Flashcard>
  <Flashcard term="藍綠部署（Blue/Green）">另外開一組全新環境（綠）裝新版，驗證沒問題後把流量整批切過去，舊環境（藍）先留著。切換快、回復只要把流量切回藍環境，缺點是部署期間要雙倍資源。</Flashcard>
  <Flashcard term="金絲雀部署（Canary）">先把一小部分流量（如 10%）導到新版觀察一段時間，確認健康再把剩下的全部切過去。能及早用少量真實流量抓出問題，把風險壓到最小。</Flashcard>
  <Flashcard term="線性部署（Linear）">流量按固定比例、固定間隔逐步轉到新版（如每 10 分鐘加 10%），平穩地把所有流量移過去。比金絲雀更均勻，適合想慢慢觀察的情境。</Flashcard>
  <Flashcard term="Lambda 別名加權（Alias Weighting）">在同一個 Lambda 別名上，把流量按比例分給兩個版本（如舊版 90%、新版 10%）。這就是 Lambda 做金絲雀／線性部署的底層機制，CodeDeploy 會自動幫你調整權重。</Flashcard>
  <Flashcard term="ECS 藍綠部署">CodeDeploy 幫 ECS 服務另起一組新任務（綠），透過負載平衡器的測試接聽器驗證，再把正式流量從舊任務（藍）切到新任務。出問題可快速切回，適合容器服務不中斷更新。</Flashcard>
</Flashcards>

## 容器

<Flashcards>
  <Flashcard term="ECR（Elastic Container Registry）">全託管的 Docker 映像儲存庫，用來存放與分發你的容器映像。可做映像掃描找漏洞、設生命週期政策自動清舊映像，ECS、EKS 都從這裡拉映像。</Flashcard>
  <Flashcard term="任務定義（Task Definition）">ECS 的藍圖，描述一個任務要跑哪些容器、用哪個映像、分配多少 CPU／記憶體、開哪些連接埠、掛哪些環境變數與角色。它是範本，實際跑起來的叫任務（task）。</Flashcard>
  <Flashcard term="Fargate vs EC2 啟動類型">Fargate 是無伺服器模式，你只管容器、不用管底層機器，依用量付費、省維運；EC2 類型要自己管理叢集機器，但更能控制主機規格、可用 GPU／特殊需求，大量穩定負載可能更省錢。</Flashcard>
  <Flashcard term="任務角色 vs 執行角色">任務角色（Task Role）是給容器裡「你的應用程式」用的，決定它能存取哪些 AWS 資源（如讀 S3）；執行角色（Execution Role）是給 ECS 代理人用的，用來拉 ECR 映像、寫 CloudWatch 日誌。兩者別搞混。</Flashcard>
</Flashcards>

## 測試

<Flashcards>
  <Flashcard term="單元測試 vs 整合測試">單元測試只驗證單一函式／模組的邏輯，跑得快、不碰外部服務；整合測試驗證多個元件串起來（如 Lambda 真的讀到 DynamoDB）是否正常。先靠大量單元測試抓邏輯錯，再用整合測試確認接得起來。</Flashcard>
  <Flashcard term="Mock（模擬）">用假的替身取代真實的外部相依（如資料庫、第三方 API），讓單元測試不必真的連線就能跑、也能模擬各種回應與錯誤。測試快又穩定，不受外部狀態影響。</Flashcard>
  <Flashcard term="SAM Local">用 sam local invoke／start-api 在自己電腦上用 Docker 模擬 Lambda 與 API Gateway，不用每次都部署到雲端就能測試函式。開發階段快速驗證邏輯、省時間又省錢。</Flashcard>
  <Flashcard term="AI 輔助測試 / Amazon Q">Amazon Q Developer 可在 IDE 裡幫你產生單元測試、補測試案例、解釋與修正程式碼，加快撰寫測試與除錯的速度。C03 新增「AI 輔助開發」重點，把它當成提升測試覆蓋率的助手。</Flashcard>
</Flashcards>

👉 來測驗：[Domain 3 練習題](./quiz.md)
