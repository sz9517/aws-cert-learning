---
sidebar_position: 6
title: CLF 原創練習題
---

# CLF 原創練習題（仿官方考題風格）

先自己點選答案，再按「**顯示答案與解析**」。本頁對齊 CLF-C02 官方題型：以**雲端概念、安全與合規、技術與服務、帳務定價與支援**四大領域為主，考的是**定義、服務用途、基本判斷與雲端好處**，不會出 SAA 那種複雜架構選型。包含**單選**與**複選（Choose TWO）**兩種題型。題目為**原創**內容（非真實考題）。

<Quiz
  qnum={1}
  total={15}
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
  total={15}
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
  total={15}
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
  total={15}
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
  total={15}
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
  total={15}
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
  total={15}
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
  total={15}
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
  total={15}
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
  total={15}
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
  total={15}
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
  total={15}
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
  total={15}
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
  total={15}
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
  total={15}
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

---

🎉 CLF 基礎打好了！想進一步考架構師，接著看 👉 [SAA 考試資訊與讀書計畫](../saa/exam-info.md)
