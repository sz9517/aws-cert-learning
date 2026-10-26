---
sidebar_position: 6
title: CLF 核心名詞閃卡
---

# CLF 核心名詞閃卡

這頁把 AWS Cloud Practitioner（CLF-C02）最常考的核心名詞做成閃卡。**點一下卡片**就會翻開白話解釋，縮寫都附上英文全名。依照考試四大領域分組，考前拿這頁快速複習、把觀念記熟最有效率。

## 雲端概念（Cloud Concepts）

<Flashcards>
  <Flashcard term="雲端六大優勢">把資本支出換成變動支出、享規模經濟、不用猜容量、提升速度與敏捷、省下維運機房、幾分鐘布及全球。考試幾乎必考。</Flashcard>
  <Flashcard term="CapEx → OpEx">資本支出（Capital Expenditure，一次砸大錢買硬體）轉成營運支出（Operating Expenditure，用多少付多少的日常花費）。</Flashcard>
  <Flashcard term="規模經濟（Economies of Scale）">AWS 服務全球上百萬客戶，採購量超大把成本攤平，所以你用的單價比自己買便宜。</Flashcard>
  <Flashcard term="彈性（Elasticity）">需求變多就自動擴充、變少就縮減，資源跟著用量伸縮，不用事先猜容量。</Flashcard>
  <Flashcard term="敏捷（Agility）">想開新伺服器幾分鐘就好，不用等採購安裝好幾週，點子能更快上線。</Flashcard>
  <Flashcard term="公有雲（Public Cloud）">全部跑在 AWS 上，不碰自家機房。最常見的雲端部署模型。</Flashcard>
  <Flashcard term="混合雲（Hybrid）">一部分在 AWS、一部分留在自家機房，兩邊連起來一起用。常用於逐步搬遷。</Flashcard>
  <Flashcard term="地端 / 私有雲（On-premises）">全部資源自己架在自家機房，不用公有雲。又稱 Private Cloud。</Flashcard>
  <Flashcard term="TCO">總持有成本（Total Cost of Ownership），把硬體、電力、機房、人力全算進去的完整成本，用來比較自建 vs. 上雲划不划算。</Flashcard>
  <Flashcard term="Well-Architected 六支柱">架構良好的六個檢視面向：卓越營運、安全性、可靠性、效能效率、成本最佳化、永續性。</Flashcard>
  <Flashcard term="共享責任的好處">底層機房、硬體維運交給 AWS，你只要專心在真正賺錢的業務上。</Flashcard>
</Flashcards>

## 安全與合規（Security and Compliance）

<Flashcards>
  <Flashcard term="責任共擔模型">AWS 負責「雲端本身」的安全（機房、硬體），你負責「雲端裡面」的安全（資料、權限、設定）。</Flashcard>
  <Flashcard term="IAM">身分與存取管理（Identity and Access Management），控制誰能用哪些 AWS 資源。這項服務本身免費。</Flashcard>
  <Flashcard term="IAM 使用者（User）">給一個人或一支程式的長期身分，有自己的登入憑證。</Flashcard>
  <Flashcard term="IAM 群組（Group）">把多個使用者綁在一起統一給權限，新人加入群組就自動拿到權限。</Flashcard>
  <Flashcard term="IAM 角色（Role）">可被臨時取用的身分，發的是臨時憑證。給 EC2 等服務存取用它，不要散長期金鑰。</Flashcard>
  <Flashcard term="IAM 政策（Policy）">用 JSON 寫的規則，定義允許或拒絕哪些動作。綁到使用者、群組或角色上生效。</Flashcard>
  <Flashcard term="MFA">多因素驗證（Multi-Factor Authentication），密碼之外再加一道動態驗證碼。Root 帳號務必開啟。</Flashcard>
  <Flashcard term="最小權限原則">只給剛好夠用的權限，不多給。遇到權限題的標準答案方向。</Flashcard>
  <Flashcard term="傳輸中 / 靜態加密">傳輸中（In Transit）＝資料在網路上跑時用 HTTPS/TLS 加密；靜態（At Rest）＝存在硬碟時加密。</Flashcard>
  <Flashcard term="KMS">金鑰管理服務（Key Management Service），集中建立、保管、輪替加密金鑰。</Flashcard>
  <Flashcard term="CloudTrail">記錄誰在帳號裡做了什麼 API 動作的稽核日誌，用來追查與合規。</Flashcard>
  <Flashcard term="GuardDuty">智慧威脅偵測服務，自動分析日誌找出可疑或惡意行為並示警。</Flashcard>
  <Flashcard term="Artifact">線上下載 AWS 合規報告與協議（如 SOC、ISO、PCI）的入口。</Flashcard>
</Flashcards>

## 技術與服務（Technology and Services）

<Flashcards>
  <Flashcard term="Region（區域）">世界各地獨立的地理區，彼此隔離。選離使用者近的區可降低延遲。</Flashcard>
  <Flashcard term="AZ（可用區）">可用區（Availability Zone），一個 Region 裡實體隔離的機房群，跨 AZ 部署可提升可用性。</Flashcard>
  <Flashcard term="邊緣節點（Edge Location）">散佈全球的快取據點，CloudFront 用它把內容放到離使用者最近的地方加速。</Flashcard>
  <Flashcard term="EC2">雲端虛擬伺服器（Elastic Compute Cloud），要自己管作業系統，最有彈性的運算服務。</Flashcard>
  <Flashcard term="Lambda">無伺服器（Serverless）運算，只上傳程式、依執行次數與時間計費，不用管伺服器。</Flashcard>
  <Flashcard term="ECS / EKS">跑容器的服務：ECS 是 AWS 自家的容器調度，EKS 是託管的 Kubernetes。</Flashcard>
  <Flashcard term="Elastic Beanstalk">把程式丟上去，AWS 自動幫你佈署與管底層資源的平台（PaaS），適合快速上線。</Flashcard>
  <Flashcard term="S3">幾乎無限大的雲端物件儲存（Simple Storage Service），存檔案、備份、網站靜態資源都用它。</Flashcard>
  <Flashcard term="EBS">接在 EC2 上的區塊儲存硬碟（Elastic Block Store），像主機的本機磁碟，同一個 AZ 內使用。</Flashcard>
  <Flashcard term="EFS">可多台 EC2 同時掛載的共用檔案儲存（Elastic File System），容量自動伸縮。</Flashcard>
  <Flashcard term="RDS / Aurora">託管的關聯式資料庫：RDS 幫你顧好 MySQL/PostgreSQL 等；Aurora 是 AWS 自家高效能相容版。</Flashcard>
  <Flashcard term="DynamoDB">全託管的 NoSQL 資料庫，毫秒級延遲、自動擴充，適合高流量的鍵值 / 文件資料。</Flashcard>
  <Flashcard term="VPC">你在雲端專屬的虛擬私有網路（Virtual Private Cloud），自己劃網段、設路由與防火牆。</Flashcard>
  <Flashcard term="Route 53">AWS 的 DNS 網域名稱服務，負責把網址解析到正確資源，也能做健康檢查與流量分配。</Flashcard>
  <Flashcard term="CloudFront">內容傳遞網路（CDN），把內容快取到全球邊緣節點，讓各地使用者連得又快又順。</Flashcard>
  <Flashcard term="ELB">彈性負載平衡器（Elastic Load Balancing），把流量分散到多台後端，提升可用性與擴充性。</Flashcard>
  <Flashcard term="CloudFormation">用範本檔把整套基礎設施寫成程式碼（IaC）一鍵佈署，重現環境很方便。</Flashcard>
  <Flashcard term="CloudWatch">監控與告警服務，收集指標與日誌、設定警示，看系統健不健康。</Flashcard>
  <Flashcard term="主控台 / CLI / SDK">操作 AWS 的三種方式：網頁主控台（點按）、CLI（指令）、SDK（程式呼叫）。</Flashcard>
</Flashcards>

## 帳務、定價與支援（Billing, Pricing and Support）

<Flashcards>
  <Flashcard term="定價三原則">用多少付多少、保留用量享折扣、用越多單價越低。AWS 定價的基本精神。</Flashcard>
  <Flashcard term="隨需（On-Demand）">用多少算多少、隨開隨關，不綁約，彈性最高但單價也最高。</Flashcard>
  <Flashcard term="預留執行個體（Reserved Instances）">承諾用 1 或 3 年換大幅折扣，適合長期穩定、跑不停的工作負載。</Flashcard>
  <Flashcard term="Spot 執行個體">用 AWS 的閒置算力，便宜最多九成，但可能被回收，適合可中斷的批次工作。</Flashcard>
  <Flashcard term="Savings Plans">承諾每小時固定花費金額換折扣，比 RI 更有彈性，可跨機型與服務。</Flashcard>
  <Flashcard term="Cost Explorer">用圖表看花費與用量趨勢、找出花費大戶的分析工具。</Flashcard>
  <Flashcard term="Budgets">設定預算門檻，快超支或超量時自動寄通知提醒你。</Flashcard>
  <Flashcard term="Cost and Usage Report">最詳細的費用與用量明細報表（CUR），可匯出做深入分析。</Flashcard>
  <Flashcard term="Organizations">集中管理多個 AWS 帳號，可套用政策與享合併帳單。</Flashcard>
  <Flashcard term="合併帳單（Consolidated Billing）">多帳號的用量合在一起結帳，更容易達到量大折扣、省錢又好管。</Flashcard>
  <Flashcard term="Trusted Advisor">自動檢查你的帳號，在成本、效能、安全、容錯、服務上限五大面向給優化建議。</Flashcard>
  <Flashcard term="支援方案（Support Plans）">Basic（免費）、Developer、Business、Enterprise；等級越高回應越快、可用資源越多。</Flashcard>
</Flashcards>

## 下一步

讀完名詞就來驗收成果吧！

👉 來測驗：[CLF 原創練習題](./clf-quiz.md)
