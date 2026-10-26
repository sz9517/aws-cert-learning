---
sidebar_position: 7
title: CLF 原創練習題
---

# CLF 原創練習題（仿官方考題風格）

先自己點選答案，再按「**顯示答案與解析**」。本頁對齊 CLF-C02 官方題型：以**雲端概念、安全與合規、技術與服務、帳務定價與支援**四大領域為主，考的是**定義、服務用途、基本判斷與雲端好處**，不會出 SAA 那種複雜架構選型。包含**單選**與**複選（Choose TWO）**兩種題型。題目為**原創**內容（非真實考題）。

<Quiz
  qnum={1}
  total={45}
  question="一家新創公司不想自己買伺服器、建機房，而是希望依實際用量付費，隨時能快速擴充或縮減資源。這最能體現雲端運算的哪一項好處？"
  options={[
    '必須預先採購大量硬體以保障容量',
    '把固定的資本支出（CapEx）轉為按用量計費的變動支出（OpEx）',
    '一次簽長約鎖定三年固定費用',
    '所有資源都要自行在地端維運',
  ]}
  answer={1}>

**正解：B**

雲端的核心好處之一就是**把資本支出（CapEx）轉為變動支出（OpEx）**：不必先砸錢買硬體，改成依實際用量付費，還能依需求彈性擴縮。A 預先大量採購正是雲端要避免的；C 綁三年固定費用與「按用量付費」相反；D 在地端自行維運就不是用雲端了。

</Quiz>

<Quiz
  qnum={2}
  total={45}
  question="某團隊想盡量少管底層伺服器、把維運交給 AWS，並讓自己更專注在應用程式開發上。下列哪一項最符合雲端的這個好處？"
  options={[
    '團隊要自行負責資料中心的電力與冷卻',
    '團隊停止「做粗重的工作（undifferentiated heavy lifting）」，把機房與硬體維運交給 AWS',
    '團隊必須自行預測並採購未來三年的機架空間',
    '團隊要自己更換故障的實體硬碟',
  ]}
  answer={1}>

**正解：B**

雲端讓你**停止做那些沒有差異化價值的粗重工作**（機房、電力、冷卻、換硬碟等），把這些交給 AWS，團隊得以專注在真正帶來價值的應用程式上。A、C、D 都是在地端自管機房才需要做的事，正是上雲後可以免除的負擔。

</Quiz>

<Quiz
  qnum={3}
  total={45}
  question="在 AWS 責任共擔模型（Shared Responsibility Model）中，下列哪一項屬於「AWS 的責任（雲端的安全性，security OF the cloud）」？"
  options={[
    '設定 IAM 使用者的密碼原則與權限',
    '維護與保護實體資料中心、機房設施與底層硬體',
    '為 EC2 作業系統安裝安全性更新（patch）',
    '加密客戶存放在 S3 中的資料',
  ]}
  answer={1}>

**正解：B**

責任共擔模型中，**AWS 負責「雲端本身的安全性」**，也就是實體設施、資料中心、硬體與全球基礎建設的保護。A、C、D 都屬於「客戶在雲端中的安全性（security IN the cloud）」：IAM 設定、作業系統更新、客戶資料加密都由客戶負責。

</Quiz>

<Quiz
  qnum={4}
  total={45}
  question="某公司稽核人員需要下載 AWS 的合規報告（例如 SOC、ISO、PCI），以證明所用的雲端服務符合法規要求。應該到哪裡自助取得這些報告？"
  options={[
    'AWS Artifact',
    'AWS CloudTrail',
    'Amazon Inspector',
    'AWS Trusted Advisor',
  ]}
  answer={0}>

**正解：A**

**AWS Artifact** 是取得 AWS 合規與稽核報告（如 SOC、ISO、PCI DSS）的自助入口，可隨時下載。B 的 CloudTrail 記錄的是帳號內的 API 操作軌跡；C 的 Inspector 做的是漏洞掃描；D 的 Trusted Advisor 給的是最佳實務建議，皆非下載合規文件的地方。

</Quiz>

<Quiz
  qnum={5}
  total={45}
  question="資安最佳實務建議「不要用根使用者（root user）處理日常作業」。下列哪一項是較安全且正確的做法？"
  options={[
    '把根使用者的存取金鑰分享給整個團隊共用',
    '建立具備最小必要權限的 IAM 使用者或角色供日常使用，並為根使用者啟用多因素驗證（MFA）',
    '關閉所有帳號的多因素驗證以方便登入',
    '所有人都直接以根使用者身分登入操作',
  ]}
  answer={1}>

**正解：B**

最佳實務是**替日常作業建立權限最小化的 IAM 使用者或角色**，根使用者僅保留做少數必要的帳務設定，並為其**啟用 MFA**。A 共用根金鑰、C 關閉 MFA、D 天天用根使用者操作，都是高風險、違反最小權限原則的做法。

</Quiz>

<Quiz
  qnum={6}
  total={45}
  question="某公司要在 AWS 上存放大量使用者上傳的圖片與備份檔，需要高耐久性、幾乎無限容量且用多少付多少的物件儲存服務。最適合的 AWS 服務是？"
  options={[
    'Amazon EC2',
    'Amazon S3',
    'Amazon RDS',
    'Amazon VPC',
  ]}
  answer={1}>

**正解：B**

**Amazon S3** 是 AWS 的物件儲存服務，提供極高耐久性、幾乎無限的容量，依實際存放量與用量計費，最適合存圖片、備份、日誌等檔案。A 的 EC2 是虛擬伺服器（運算）；C 的 RDS 是受管關聯式資料庫；D 的 VPC 是虛擬網路，皆非物件儲存。

</Quiz>

<Quiz
  qnum={7}
  total={45}
  question="某團隊只想單純跑程式碼、不想管理任何伺服器，程式由事件觸發、每次只執行幾秒，而且希望閒置時不收費。下列哪一項 AWS 服務最符合這種無伺服器（serverless）需求？"
  options={[
    'Amazon EC2',
    'AWS Lambda',
    'Amazon EBS',
    'Amazon Route 53',
  ]}
  answer={1}>

**正解：B**

**AWS Lambda** 是無伺服器運算服務，由事件觸發、只在執行時依用量計費，閒置不收錢，且完全不用管理伺服器，最符合題述需求。A 的 EC2 要自己管虛擬伺服器；C 的 EBS 是區塊儲存磁碟；D 的 Route 53 是 DNS 服務，皆非無伺服器運算。

</Quiz>

<Quiz
  qnum={8}
  total={45}
  question="關於 AWS 全球基礎建設，下列對「區域（Region）」與「可用區（Availability Zone, AZ）」的敘述何者正確？"
  options={[
    '一個區域只會有一個可用區',
    '一個區域由多個彼此實體隔離的可用區組成，分散可用區可提升高可用性',
    '可用區就是放在使用者附近、用來做內容快取的邊緣節點',
    '所有區域都共用同一個資料中心',
  ]}
  answer={1}>

**正解：B**

**一個區域（Region）由多個實體隔離的可用區（AZ）組成**，把工作負載分散到不同 AZ 可避免單一機房故障，提升高可用性。A 錯在每個區域都有多個 AZ；C 描述的是邊緣節點（Edge Location），用於 CloudFront 內容快取，不是 AZ；D 全球各區域是獨立的基礎建設，並非共用同一個資料中心。

</Quiz>

<Quiz
  qnum={9}
  total={45}
  question="某開發者想用程式（SDK）與指令列（CLI）自動化操作 AWS 資源，同時其他同事偏好用瀏覽器以圖形介面手動操作。下列哪兩項是存取與管理 AWS 服務的正確方式？（Choose TWO）"
  options={[
    'AWS Management Console（網頁圖形介面）',
    'AWS CLI 或 AWS SDK（指令列與程式介面）',
    '直接實體走進 AWS 資料中心操作主機',
    '打電話請 AWS 客服代為按下每一個按鈕',
    '只能透過傳真表單申請變更資源',
  ]}
  answer={[0, 1]}>

**正解：A、B**

存取與管理 AWS 的主要方式就是 **Management Console（網頁圖形介面，A）** 與 **CLI／SDK（指令列與程式介面，B）**，兩者都能操作同一套服務。C 客戶無法實體進入 AWS 機房；D、E 靠客服逐一按鈕或傳真表單都不是 AWS 提供的存取方式。

</Quiz>

<Quiz
  qnum={10}
  total={45}
  question="某穩定運行的正式環境伺服器，整年 365 天都要開著、用量可預測，團隊願意做 1 年或 3 年的承諾以換取最大折扣。下列哪一種 EC2 計費模式最省錢？"
  options={[
    'On-Demand 隨需執行個體',
    'Spot 執行個體',
    'Reserved Instances / Savings Plans（預留或節省方案）',
    'Dedicated Hosts 專用主機',
  ]}
  answer={2}>

**正解：C**

**用量穩定可預測、願意做 1 年或 3 年承諾**時，**Reserved Instances 或 Savings Plans** 能換到最大折扣（最多約省七成）。A 隨需天天付牌價、穩定負載用它最貴；B 的 Spot 雖便宜但會被回收、不適合不能中斷的正式環境；D 的專用主機最貴、僅用於合規或自備授權（BYOL）。

</Quiz>

<Quiz
  qnum={11}
  total={45}
  question="某團隊要跑一批可容忍中斷、跑完即丟的批次運算，想用最低單價取得運算資源，並可接受資源偶爾被 AWS 回收。最適合的 EC2 計費模式是？"
  options={[
    'Reserved Instances 預留執行個體',
    'Spot 執行個體',
    'On-Demand 隨需執行個體',
    'Dedicated Hosts 專用主機',
  ]}
  answer={1}>

**正解：B**

**可容忍中斷、可重跑、追求最低單價**正是 **Spot 執行個體**的經典場景，利用閒置產能最高可省約九成，代價是資源可能被回收。A 的預留執行個體適合長期穩定負載；C 隨需沒有折扣；D 的專用主機最貴，皆不符合「最低單價跑可中斷批次」的需求。

</Quiz>

<Quiz
  qnum={12}
  total={45}
  question="某公司希望在成本「超過自己設定的固定金額門檻」時主動收到告警，以免帳單失控。最適合的 AWS 工具是？"
  options={[
    'AWS Budgets',
    'AWS CloudTrail',
    'Amazon CloudWatch Logs',
    'AWS Config',
  ]}
  answer={0}>

**正解：A**

**AWS Budgets** 可針對成本或用量設定門檻，一旦超過預設金額就發出告警通知，正好滿足需求。B 的 CloudTrail 記錄 API 操作軌跡；C 的 CloudWatch Logs 收集應用程式與系統日誌；D 的 Config 追蹤資源組態變更，皆非設定預算門檻告警的工具。

</Quiz>

<Quiz
  qnum={13}
  total={45}
  question="某企業需要 AWS 提供「不到 15 分鐘回應關鍵系統中斷、可指派專屬技術客戶經理（TAM）」等級的支援。最適合訂閱的 AWS 支援方案是？"
  options={[
    'Basic（基本）支援',
    'Developer（開發者）支援',
    'Business（商業）支援',
    'Enterprise（企業）支援',
  ]}
  answer={3}>

**正解：D**

**提供專屬技術客戶經理（TAM）與最快等級回應**的是 **Enterprise 支援方案**。A 的 Basic 只有帳務與服務健康資訊、無技術案件支援；B 的 Developer 僅供開發測試、營業時間回應；C 的 Business 已有 24／7 技術支援但不含專屬 TAM，皆未達企業級關鍵系統需求。

</Quiz>

<Quiz
  qnum={14}
  total={45}
  question="某集團在 AWS Organizations 底下有多個部門帳號，希望集中收到一張帳單、簡化對帳，並讓各帳號用量加總以享更多量折扣、共享預留方案。最適合的做法是？"
  options={[
    '在每個帳號各自手動管理與付款',
    '使用 AWS Organizations 的合併帳單（Consolidated Billing）',
    '把所有部門合併成單一帳號共用登入',
    '為每個帳號各自聯絡 AWS 客服開立發票',
  ]}
  answer={1}>

**正解：B**

**合併帳單（Consolidated Billing）**讓 Organizations 下的多個帳號集中成一張帳單、簡化對帳，並把各帳號用量加總以享更多量折扣、共享 RI／Savings Plans。A 各自手動付款無法加總用量；C 併成單一帳號會失去帳號隔離、並非合併帳單的作法；D 逐一聯絡客服開發票既不集中也無法共享折扣。

</Quiz>

<Quiz
  qnum={15}
  total={45}
  question="某團隊想自動檢查帳號是否符合最佳實務，拿到涵蓋「成本最佳化、安全、容錯、效能、服務限額」等面向的檢查與建議（例如找出閒置資源或未開啟 MFA）。下列哪兩項敘述正確？（Choose TWO）"
  options={[
    'AWS Trusted Advisor 會提供跨多個面向的最佳實務檢查與建議',
    '較高等級的支援方案（如 Business、Enterprise）可解鎖完整的 Trusted Advisor 檢查項目',
    'Trusted Advisor 是用來撰寫與部署應用程式原始碼的服務',
    'Trusted Advisor 的唯一用途是儲存物件檔案',
    'Trusted Advisor 僅能在實體資料中心內使用',
  ]}
  answer={[0, 1]}>

**正解：A、B**

**Trusted Advisor** 會從成本最佳化、安全、容錯、效能與服務限額等面向給出最佳實務檢查與建議（A），而且**較高等級的支援方案（Business／Enterprise）能解鎖完整的檢查項目**（B）。C 它不是寫程式或部署原始碼的工具；D 儲存物件是 S3 的工作；E Trusted Advisor 是雲端上的服務，與實體資料中心無關。

</Quiz>

<Quiz
  qnum={16}
  total={45}
  question="雲端運算的四大部署模型中，企業把所有工作負載完全建置並執行在 AWS 等公有雲上，不保留任何在地端機房。這屬於下列哪一種部署模型？"
  options={[
    '混合雲（Hybrid）',
    '純雲端／全雲端（Cloud / All-in）',
    '在地端（On-premises）',
    '私有雲（Private cloud）',
  ]}
  answer={1}>

**正解：B** — 全部工作負載都在雲端上執行、不留在地端設施，屬於「純雲端（Cloud-based / All-in）」部署模型。A 混合雲是雲端與在地端並存；C 在地端是完全自管機房；D 私有雲是專屬自己使用的環境，通常仍在自有機房。

</Quiz>

<Quiz
  qnum={17}
  total={45}
  question="下列哪一項最能代表「雲端的彈性（Elasticity）」這項好處？"
  options={[
    '依實際需求自動增減運算資源，用多少付多少',
    '必須事先採購足夠三年使用的伺服器',
    '所有資源容量在簽約時就固定不可變動',
    '資料只能存放在單一實體機房',
  ]}
  answer={0}>

**正解：A** — 彈性（Elasticity）指的是依需求自動擴充或縮減資源，尖峰時加大、離峰時縮小，避免閒置浪費。B、C 都是固定容量、無法隨需求調整，與彈性相反；D 與彈性無關。

</Quiz>

<Quiz
  qnum={18}
  total={45}
  question="一家全球性企業希望把應用程式部署到離使用者最近的地理位置，以降低延遲並符合當地資料存放法規。AWS 的哪一個基礎建設概念最直接對應「選擇資料實際存放的地理區域」？"
  options={[
    '可用區域（Availability Zone）',
    '區域（Region）',
    '邊緣節點（Edge Location）',
    '虛擬私有雲（VPC）',
  ]}
  answer={1}>

**正解：B** — 區域（Region）是全球各地的地理位置，客戶選擇 Region 即決定資料實際存放的地理範圍，常用於延遲與法規遵循考量。A 可用區域是 Region 內彼此隔離的機房群；C 邊緣節點用於 CloudFront 內容快取；D VPC 是帳號內的虛擬網路。

</Quiz>

<Quiz
  qnum={19}
  total={45}
  question="為了達成高可用性（High Availability），建議將應用程式部署在同一個區域內的多個哪一種設施上，使單一設施故障時仍能持續服務？"
  options={[
    '多個邊緣節點（Edge Locations）',
    '多個可用區域（Availability Zones）',
    '多個 IAM 使用者',
    '多個 S3 儲存貯體（Bucket）',
  ]}
  answer={1}>

**正解：B** — 可用區域（AZ）是 Region 內彼此實體隔離、獨立供電的機房群。跨多個 AZ 部署可在單一 AZ 故障時維持服務，是高可用性的基本做法。A 邊緣節點是內容快取用途；C、D 與機房層級的容錯無關。

</Quiz>

<Quiz
  qnum={20}
  total={45}
  question="在 AWS 責任共擔模型中，下列哪一項屬於「客戶的責任（雲端中的安全性，security IN the cloud）」？"
  options={[
    '保護全球基礎建設的實體安全',
    '維護 Hypervisor 與底層硬體',
    '設定安全群組規則與管理 IAM 權限',
    '更換資料中心故障的實體硬碟',
  ]}
  answer={2}>

**正解：C** — 設定安全群組、管理 IAM 使用者與權限都屬於「客戶在雲端中的安全性」。A、B、D 皆為實體設施、硬體與 Hypervisor 的維護，屬於 AWS 負責的「雲端本身的安全性」。

</Quiz>

<Quiz
  qnum={21}
  total={45}
  question="管理員想記錄「帳號內誰在何時呼叫了哪些 AWS API（例如誰啟動了某台 EC2）」以供稽核。應該使用下列哪一項服務？"
  options={[
    'Amazon CloudWatch',
    'AWS CloudTrail',
    'AWS Config',
    'Amazon Inspector',
  ]}
  answer={1}>

**正解：B** — CloudTrail 記錄帳號內的 API 呼叫與使用者操作軌跡，用於稽核「誰做了什麼」。A CloudWatch 收集效能指標與日誌、做監控與警示；C Config 追蹤資源組態變化與合規；D Inspector 做漏洞掃描。

</Quiz>

<Quiz
  qnum={22}
  total={45}
  question="團隊想監控 EC2 執行個體的 CPU 使用率、設定門檻警示，並收集應用程式日誌。最適合的服務是下列哪一項？"
  options={[
    'AWS CloudTrail',
    'Amazon CloudWatch',
    'AWS Trusted Advisor',
    'AWS Artifact',
  ]}
  answer={1}>

**正解：B** — CloudWatch 用於收集效能指標（如 CPU 使用率）、日誌，並可設定警示（Alarm）。A CloudTrail 記錄的是 API 操作軌跡，非效能指標；C Trusted Advisor 提供最佳實務建議；D Artifact 下載合規報告。

</Quiz>

<Quiz
  qnum={23}
  total={45}
  question="下列哪一個 AWS 服務是「物件儲存（Object Storage）」，常用於存放備份、靜態網站內容與大量非結構化資料？"
  options={[
    'Amazon EBS',
    'Amazon S3',
    'Amazon RDS',
    'Amazon EFS',
  ]}
  answer={1}>

**正解：B** — Amazon S3 是物件儲存服務，適合存放備份、靜態內容與大量非結構化資料。A EBS 是掛載到 EC2 的區塊儲存；C RDS 是關聯式資料庫；D EFS 是檔案儲存。

</Quiz>

<Quiz
  qnum={24}
  total={45}
  question="某公司需要一個全受管的關聯式資料庫（支援 MySQL、PostgreSQL 等），希望由 AWS 處理備份、修補與故障復原。最適合的服務是下列哪一項？"
  options={[
    'Amazon DynamoDB',
    'Amazon RDS',
    'Amazon Redshift',
    'Amazon ElastiCache',
  ]}
  answer={1}>

**正解：B** — Amazon RDS 是全受管的關聯式資料庫服務，支援 MySQL、PostgreSQL 等引擎，並由 AWS 處理備份與修補。A DynamoDB 是 NoSQL 鍵值資料庫；C Redshift 是資料倉儲（分析用）；D ElastiCache 是記憶體快取。

</Quiz>

<Quiz
  qnum={25}
  total={45}
  question="開發團隊想執行程式碼但完全不管理伺服器，依實際執行次數與時間付費，事件觸發時才執行。最符合的服務是下列哪一項？"
  options={[
    'Amazon EC2',
    'AWS Lambda',
    'Amazon Lightsail',
    'AWS Batch',
  ]}
  answer={1}>

**正解：B** — AWS Lambda 是無伺服器（Serverless）運算服務，由事件觸發、依執行時間與次數付費，不需管理伺服器。A EC2 需自行管理虛擬伺服器；C Lightsail 提供簡化的虛擬伺服器方案；D Batch 用於批次運算工作。

</Quiz>

<Quiz
  qnum={26}
  total={45}
  question="下列哪一個服務是用於全球內容傳遞（CDN），透過邊緣節點快取內容以降低使用者存取延遲？"
  options={[
    'Amazon Route 53',
    'Amazon CloudFront',
    'AWS Direct Connect',
    'Elastic Load Balancing',
  ]}
  answer={1}>

**正解：B** — Amazon CloudFront 是內容傳遞網路（CDN），利用全球邊緣節點快取內容、加速傳輸、降低延遲。A Route 53 是 DNS 服務；C Direct Connect 是專線連接；D ELB 是負載平衡。

</Quiz>

<Quiz
  qnum={27}
  total={45}
  question="管理員想把多個 AWS 帳號集中管理、套用統一的政策並整合帳單。最適合的服務是下列哪一項？"
  options={[
    'AWS IAM',
    'AWS Organizations',
    'AWS Control Tower',
    'AWS Config',
  ]}
  answer={1}>

**正解：B** — AWS Organizations 用於集中管理多個帳號、套用服務控制政策（SCP）並進行合併帳單。A IAM 管理單一帳號內的身分與權限；C Control Tower 用於快速建立受管的多帳號環境（landing zone）；D Config 追蹤資源組態。

</Quiz>

<Quiz
  qnum={28}
  total={45}
  question="資安最佳實務建議「不要以 root 使用者進行日常作業」。下列哪一項是最恰當的做法？"
  options={[
    '把 root 帳號密碼分享給所有團隊成員',
    '為個別人員建立 IAM 使用者並授予最小必要權限，root 僅保留少數必要作業',
    '停用所有 IAM 使用者，一律使用 root',
    '把 root 的存取金鑰寫入程式碼',
  ]}
  answer={1}>

**正解：B** — 最佳實務是為每個人建立個別 IAM 使用者、遵循最小權限原則，並把 root 帳號保留給少數必須用它的作業。A、C、D 都是嚴重的資安風險做法，應避免。

</Quiz>

<Quiz
  qnum={29}
  total={45}
  question="為了在帳號登入時增加一層保護，除了密碼外還要求輸入一次性驗證碼。這項機制稱為什麼？"
  options={[
    '多因素驗證（MFA）',
    '安全群組（Security Group）',
    '存取控制清單（ACL）',
    '金鑰對（Key Pair）',
  ]}
  answer={0}>

**正解：A** — 多因素驗證（MFA）在密碼之外再要求第二項驗證（如一次性驗證碼），大幅提升登入安全性。B 安全群組是執行個體層級的虛擬防火牆；C ACL 是網路層的存取清單；D 金鑰對用於 SSH 登入 EC2。

</Quiz>

<Quiz
  qnum={30}
  total={45}
  question="下列哪一項服務可在網路邊界協助防護常見的 Web 攻擊（如 SQL Injection、跨站腳本），可與 CloudFront 或 ALB 搭配使用？"
  options={[
    'AWS Shield',
    'AWS WAF',
    'Amazon GuardDuty',
    'AWS KMS',
  ]}
  answer={1}>

**正解：B** — AWS WAF（Web Application Firewall）用於過濾常見 Web 攻擊，如 SQL Injection 與 XSS，可搭配 CloudFront、ALB 使用。A Shield 專注於 DDoS 防護；C GuardDuty 是威脅偵測；D KMS 是金鑰管理。

</Quiz>

<Quiz
  qnum={31}
  total={45}
  question="下列哪一項服務專門用來抵禦分散式阻斷服務（DDoS）攻擊？"
  options={[
    'AWS Shield',
    'Amazon Inspector',
    'AWS Config',
    'Amazon Macie',
  ]}
  answer={0}>

**正解：A** — AWS Shield 是專門防禦 DDoS 攻擊的服務，Standard 版自動提供基礎防護。B Inspector 做漏洞評估；C Config 追蹤組態合規；D Macie 用機器學習偵測 S3 中的敏感資料。

</Quiz>

<Quiz
  qnum={32}
  total={45}
  question="財務人員想「視覺化分析過去的成本與用量趨勢」，找出花費最多的服務並預測未來費用。最適合的工具是下列哪一項？"
  options={[
    'AWS Budgets',
    'AWS Cost Explorer',
    'AWS Cost and Usage Report',
    'AWS Pricing Calculator',
  ]}
  answer={1}>

**正解：B** — AWS Cost Explorer 以圖表視覺化呈現歷史成本與用量趨勢，協助分析與預測。A Budgets 用於設定預算門檻並在超支時警示；C CUR 是最詳盡的原始帳務明細檔；D Pricing Calculator 用於上線前估價。

</Quiz>

<Quiz
  qnum={33}
  total={45}
  question="管理員想「設定每月費用上限，一旦實際或預測花費超過門檻就收到通知」。最適合的服務是下列哪一項？"
  options={[
    'AWS Cost Explorer',
    'AWS Budgets',
    'AWS Trusted Advisor',
    'AWS Organizations',
  ]}
  answer={1}>

**正解：B** — AWS Budgets 用於設定成本或用量預算門檻，當實際或預測值超過時發出警示。A Cost Explorer 著重於歷史趨勢的視覺化分析；C Trusted Advisor 提供最佳實務建議；D Organizations 管理多帳號。

</Quiz>

<Quiz
  qnum={34}
  total={45}
  question="在尚未實際部署前，團隊想「依規劃的服務組態事先估算每月費用」，以便編列預算。最適合的工具是下列哪一項？"
  options={[
    'AWS Pricing Calculator',
    'AWS Cost Explorer',
    'AWS Budgets',
    'AWS Cost and Usage Report',
  ]}
  answer={0}>

**正解：A** — AWS Pricing Calculator 用於在部署前，依規劃的服務與用量估算預期費用。B、C、D 都需要有實際用量資料後才派上用場，無法用於尚未上線的事前估價。

</Quiz>

<Quiz
  qnum={35}
  total={45}
  question="下列哪一種 EC2 定價模式最適合「可被中斷、具容錯能力的批次工作」，且通常提供相對隨需（On-Demand）最大幅度的折扣？"
  options={[
    'On-Demand（隨需）',
    'Reserved Instances（預留執行個體）',
    'Spot Instances（競價型執行個體）',
    'Dedicated Hosts（專用主機）',
  ]}
  answer={2}>

**正解：C** — Spot 執行個體利用 AWS 閒置容量，折扣幅度最大，但可能被回收中斷，適合可容錯、可中斷的工作。A 隨需最有彈性但單價最高；B 預留適合穩定長期用量；D 專用主機用於法規或授權需求。

</Quiz>

<Quiz
  qnum={36}
  total={45}
  question="某公司有穩定且可預測的長期運算需求，想以「承諾一或三年使用」換取較大折扣。最適合的 EC2 定價模式是下列哪一項？"
  options={[
    'Spot Instances',
    'Reserved Instances / Savings Plans',
    'On-Demand',
    'Dedicated Hosts',
  ]}
  answer={1}>

**正解：B** — 對穩定可預測的長期用量，承諾一或三年的 Reserved Instances 或 Savings Plans 能換取大幅折扣。A Spot 適合可中斷工作；C 隨需適合短期或不可預測負載；D 專用主機主要用於授權與法規需求。

</Quiz>

<Quiz
  qnum={37}
  total={45}
  question="下列哪一項 AWS 支援方案「提供 24x7 的技術支援、對正式環境故障有較快回應，並適合有營運中工作負載的企業」，且費用低於 Enterprise？"
  options={[
    'Basic Support',
    'Developer Support',
    'Business Support',
    'Enterprise Support',
  ]}
  answer={2}>

**正解：C** — Business 方案提供 24x7 技術支援與較快的故障回應，適合有正式營運工作負載的企業，費用低於 Enterprise。A Basic 免費但不含技術支援案件；B Developer 僅上班時段、適合測試與開發；D Enterprise 最高階，含專屬技術客戶經理（TAM）。

</Quiz>

<Quiz
  qnum={38}
  total={45}
  question="下列哪一項 AWS 支援方案提供「專屬技術客戶經理（TAM）」與最高等級的支援，適合關鍵任務的大型企業？"
  options={[
    'Basic Support',
    'Developer Support',
    'Business Support',
    'Enterprise Support',
  ]}
  answer={3}>

**正解：D** — Enterprise 方案是最高階支援，提供專屬技術客戶經理（TAM）、最快回應與完整 Trusted Advisor 檢查，適合關鍵任務負載。A Basic 無技術支援案件；B Developer 適合開發測試；C Business 適合正式負載但不含 TAM。

</Quiz>

<Quiz
  qnum={39}
  total={45}
  question="下列哪一項服務會「針對你的帳號提供成本最佳化、安全性、容錯與效能等最佳實務檢查與建議」？"
  options={[
    'AWS Trusted Advisor',
    'AWS CloudTrail',
    'AWS Config',
    'Amazon CloudWatch',
  ]}
  answer={0}>

**正解：A** — Trusted Advisor 依成本最佳化、安全性、容錯、效能與服務限制等面向，對帳號提供最佳實務檢查與建議。B CloudTrail 記錄 API 軌跡；C Config 追蹤組態；D CloudWatch 做監控與警示。

</Quiz>

<Quiz
  qnum={40}
  total={45}
  question="所有 AWS 帳號預設都免費包含下列哪一項？"
  options={[
    '專屬技術客戶經理（TAM）',
    'Basic Support（基礎支援）',
    '完整的 Trusted Advisor 所有檢查項目',
    '24x7 技術支援案件',
  ]}
  answer={1}>

**正解：B** — 每個 AWS 帳號預設都包含免費的 Basic Support，涵蓋帳務問題、服務健康儀表板與文件等。A TAM 僅 Enterprise 才有；C 完整 Trusted Advisor 檢查需付費方案；D 24x7 技術支援案件需 Business 以上方案。

</Quiz>

<Quiz
  qnum={41}
  total={45}
  question="下列哪一個服務用於在雲端建立「邏輯隔離的虛擬網路」，可自訂子網路、路由表與閘道？"
  options={[
    'Amazon VPC',
    'Amazon Route 53',
    'AWS Direct Connect',
    'Amazon CloudFront',
  ]}
  answer={0}>

**正解：A** — Amazon VPC（Virtual Private Cloud）讓你在 AWS 上建立邏輯隔離的虛擬網路，自訂子網路、路由與閘道。B Route 53 是 DNS；C Direct Connect 是與 AWS 的實體專線；D CloudFront 是 CDN。

</Quiz>

<Quiz
  qnum={42}
  total={45}
  question="（Choose TWO）下列哪兩項屬於 AWS 責任共擔模型中「AWS 的責任（security OF the cloud）」？"
  options={[
    '保護資料中心的實體安全與門禁',
    '為客戶的 EC2 作業系統安裝安全性更新',
    '維護底層硬體與虛擬化（Hypervisor）',
    '設定 S3 儲存貯體的存取政策',
    '管理 IAM 使用者的密碼原則',
  ]}
  answer={[0,2]}>

**正解：A、C** — 實體設施安全與底層硬體、虛擬化層的維護都屬於 AWS 負責的「雲端本身的安全性」。B 作業系統更新、D S3 存取政策、E IAM 密碼原則都屬於客戶的「雲端中的安全性」。

</Quiz>

<Quiz
  qnum={43}
  total={45}
  question="（Choose TWO）下列哪兩項是採用雲端運算相較於自建在地端機房的好處？"
  options={[
    '把資本支出（CapEx）轉為變動支出（OpEx）',
    '必須自行採購並維護實體伺服器',
    '可在幾分鐘內依需求快速部署與擴充資源',
    '需要事先預測三年的硬體容量',
    '所有資料只能存放在單一在地端機房',
  ]}
  answer={[0,2]}>

**正解：A、C** — 將 CapEx 轉為 OpEx、以及能依需求快速部署與擴縮資源，都是雲端相較在地端的核心好處。B、D、E 描述的都是自建機房的限制，正是上雲要擺脫的負擔。

</Quiz>

<Quiz
  qnum={44}
  total={45}
  question="（Choose TWO）下列哪兩項服務可用來「儲存資料」？"
  options={[
    'Amazon S3',
    'Amazon EBS',
    'AWS Lambda',
    'Amazon CloudFront',
    'AWS IAM',
  ]}
  answer={[0,1]}>

**正解：A、B** — Amazon S3（物件儲存）與 Amazon EBS（區塊儲存）都是儲存服務。C Lambda 是無伺服器運算；D CloudFront 是內容傳遞（CDN）；E IAM 是身分與存取管理，皆非儲存服務。

</Quiz>

<Quiz
  qnum={45}
  total={45}
  question="（Choose TWO）下列哪兩項是 AWS 帳務與成本管理相關的工具？"
  options={[
    'AWS Cost Explorer',
    'AWS Budgets',
    'Amazon GuardDuty',
    'AWS CloudTrail',
    'Amazon Inspector',
  ]}
  answer={[0,1]}>

**正解：A、B** — Cost Explorer（視覺化分析歷史成本趨勢）與 Budgets（設定預算門檻並警示）都是帳務與成本管理工具。C GuardDuty 是威脅偵測；D CloudTrail 記錄 API 軌跡；E Inspector 做漏洞評估，皆與成本管理無關。

</Quiz>

---

👉 接著挑戰整份模擬考：[CLF 綜合模擬考（65 題）](./clf-mock-exam.md)

🎉 CLF 基礎打好了！想進一步考架構師，接著看 👉 [SAA 考試資訊與讀書計畫](../saa/exam-info.md)
