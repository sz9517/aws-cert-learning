---
sidebar_position: 8
title: CLF 綜合模擬考（65 題）
---

# CLF 綜合模擬考（65 題）

本頁是一份仿官方 CLF-C02 風格的綜合模擬考，共 **65 題**，依官方四大領域權重配題：雲端概念、安全與合規、技術與服務、帳務定價與支援。建議一次做完、計時約 90 分鐘，先自己點選答案再按「**顯示答案與解析**」對照；含少數**複選（Choose TWO）**題，其餘為單選。所有題目皆為**原創**仿風格內容，非真實考題。

## 第一部分　雲端概念

<Quiz
  qnum={1}
  total={65}
  question="一家公司希望把原本要先砸大錢買伺服器的做法，改成依實際用量付費、用多少算多少。這最能體現雲端運算的哪一項好處？"
  options={[
    '必須預先採購足夠三年用的硬體',
    '把資本支出（CapEx）轉為按用量計費的變動支出（OpEx）',
    '簽長約以鎖定固定的年度費用',
    '所有資源都要在地端自行維運',
  ]}
  answer={1}>

**正解：B** — 雲端讓你**從資本支出轉為變動支出**，不必先買硬體、改依實際用量付費。A 預先大量採購正是雲端要避免的；C 綁長約固定費與按用量付費相反；D 在地端自管就不是用雲端。

</Quiz>

<Quiz
  qnum={2}
  total={65}
  question="某團隊希望把機房、電力、冷卻、更換硬碟等沒有差異化價值的工作交給 AWS，自己專注在應用程式上。這對應雲端的哪一項好處？"
  options={[
    '團隊仍要負責資料中心的電力與冷卻',
    '停止做粗重的工作（undifferentiated heavy lifting），把底層維運交給 AWS',
    '團隊要自行預測並採購未來的機架空間',
    '團隊要親自更換故障的實體硬碟',
  ]}
  answer={1}>

**正解：B** — 雲端讓你**停止做沒有差異化價值的粗重工作**，把機房與硬體維運交給 AWS。A、C、D 都是在地端自管機房才需要做的事，正是上雲後可免除的負擔。

</Quiz>

<Quiz
  qnum={3}
  total={65}
  question="某新服務上線後使用人數可能暴增，也可能夜間驟減。團隊希望資源能隨需求自動增減、不必自己預估尖峰。這體現雲端的哪一項好處？"
  options={[
    '彈性（Elasticity）：依需求自動擴增或縮減資源',
    '一次買足最大容量以免不夠用',
    '把所有流量都導到單一固定大小的伺服器',
    '每次調整容量都要簽採購合約',
  ]}
  answer={0}>

**正解：A** — **彈性**讓資源依實際需求自動擴增或縮減，不必事先預估尖峰。B 預先買足最大容量會造成浪費；C 單一固定伺服器無法伸縮；D 每次都簽約與彈性相違。

</Quiz>

<Quiz
  qnum={4}
  total={65}
  question="關於 AWS 全球基礎建設，下列對「區域（Region）」與「可用區（Availability Zone, AZ）」的敘述何者正確？"
  options={[
    '一個區域只有一個可用區',
    '一個區域由多個實體隔離的可用區組成，分散部署可提升高可用性',
    '可用區就是靠近使用者、用於內容快取的邊緣節點',
    '全球所有區域共用同一個資料中心',
  ]}
  answer={1}>

**正解：B** — **一個區域由多個實體隔離的 AZ 組成**，分散部署可避免單一機房故障。A 每個區域都有多個 AZ；C 描述的是邊緣節點（Edge Location）；D 各區域是獨立基礎建設，並非共用。

</Quiz>

<Quiz
  qnum={5}
  total={65}
  question="某全球網站想讓各地使用者就近取得靜態內容（圖片、影片），降低延遲。AWS 透過哪一種設施把內容快取到靠近使用者的地點？"
  options={[
    '可用區（Availability Zone）',
    '邊緣節點（Edge Location）',
    '區域（Region）',
    'VPC 子網路',
  ]}
  answer={1}>

**正解：B** — **邊緣節點（Edge Location）**是 CloudFront 用來把內容快取到靠近使用者地點的設施，可降低延遲。A、C 是運算與部署的地理層級；D 的子網路屬於虛擬網路切割，皆非內容快取節點。

</Quiz>

<Quiz
  qnum={6}
  total={65}
  question="下列哪一項最能說明雲端「全球規模（go global in minutes）」的好處？"
  options={[
    '只能在單一國家提供服務',
    '可在幾分鐘內把應用程式部署到世界多個區域，就近服務當地使用者',
    '擴展到新國家前必須先自建當地機房',
    '所有區域都要手動搬運伺服器硬體',
  ]}
  answer={1}>

**正解：B** — 雲端讓你**在幾分鐘內跨區域部署**、就近服務全球使用者。A 服務範圍不受限單一國家；C、D 自建機房與搬硬體正是雲端免除的負擔。

</Quiz>

<Quiz
  qnum={7}
  total={65}
  question="某公司將一部分工作負載留在自家資料中心，另一部分放到 AWS，並讓兩邊互相連線協同運作。這屬於哪一種部署模型？"
  options={[
    '純雲端（Cloud）部署',
    '混合雲（Hybrid）部署',
    '純在地端（On-premises）部署',
    '多帳號部署',
  ]}
  answer={1}>

**正解：B** — **混合雲**同時使用在地端與雲端並互相連線。A 是全部都在雲端；C 是全部都在地端；D 的多帳號是帳務與隔離的管理方式，與部署模型無關。

</Quiz>

<Quiz
  qnum={8}
  total={65}
  question="下列哪一項是雲端運算相較於傳統在地端的好處？（Choose TWO）"
  options={[
    '不必預估容量，可依實際需求彈性擴縮',
    '依實際用量付費，避免閒置硬體的浪費',
    '必須先簽三年固定費用才能開始使用',
    '一定要自建並維運資料中心',
    '所有安全性工作都由使用者在實體機房完成',
  ]}
  answer={[0, 1]}>

**正解：A、B** — 雲端讓你**不必預估容量、依需求彈性擴縮（A）**，並**依實際用量付費（B）**。C 綁固定費與按用量付費相反；D、E 自建機房與實體維運正是雲端要免除的事。

</Quiz>

<Quiz
  qnum={9}
  total={65}
  question="以下關於「雲端運算」的定義，哪一項最正確？"
  options={[
    '透過網路隨需取用運算、儲存與資料庫等 IT 資源，並依用量付費',
    '把所有軟體都安裝在使用者自己的筆電上離線執行',
    '一次購足實體伺服器後永久擁有、永不付費',
    '僅限大型企業自建的私人機房才算雲端',
  ]}
  answer={0}>

**正解：A** — 雲端運算是**透過網路隨需取用 IT 資源並依用量付費**。B 離線安裝在本機不是雲端；C 永久擁有實體伺服器是在地端採購；D 雲端並不限於大型企業。

</Quiz>

<Quiz
  qnum={10}
  total={65}
  question="某團隊想用「基礎架構即程式碼（Infrastructure as Code）」以範本自動建立並重複部署整套 AWS 資源。最適合的 AWS 服務是？"
  options={[
    'AWS CloudFormation',
    'Amazon S3',
    'Amazon CloudWatch',
    'AWS Artifact',
  ]}
  answer={0}>

**正解：A** — **CloudFormation** 用範本以程式碼定義並自動部署資源，實現基礎架構即程式碼。B 的 S3 是物件儲存；C 的 CloudWatch 做監控；D 的 Artifact 是合規報告入口，皆非 IaC 工具。

</Quiz>

<Quiz
  qnum={11}
  total={65}
  question="下列關於三種雲端服務模型的描述，哪一項正確？"
  options={[
    'IaaS 由供應商連應用程式都幫你寫好',
    'IaaS 提供運算、網路與儲存等基礎設施，使用者自行管理作業系統與應用程式',
    'SaaS 需要使用者自行安裝並維護伺服器硬體',
    'PaaS 等同於實體資料中心的租賃',
  ]}
  answer={1}>

**正解：B** — **IaaS**（如 EC2）提供基礎設施，由使用者管理作業系統與應用程式。A 混淆了 IaaS 與 SaaS；C 的 SaaS 是直接使用現成軟體、不需管硬體；D 的 PaaS 是平台服務，不是機房租賃。

</Quiz>

<Quiz
  qnum={12}
  total={65}
  question="某公司直接使用瀏覽器登入並使用一套現成的電子郵件或協作軟體，完全不需管理底層伺服器或作業系統。這屬於哪一種雲端服務模型？"
  options={[
    'IaaS（基礎設施即服務）',
    'PaaS（平台即服務）',
    'SaaS（軟體即服務）',
    '在地端自建',
  ]}
  answer={2}>

**正解：C** — 直接使用現成應用程式、不管底層的就是 **SaaS**。A 的 IaaS 要自管作業系統與應用程式；B 的 PaaS 提供開發平台；D 自建與「現成即用」相反。

</Quiz>

<Quiz
  qnum={13}
  total={65}
  question="AWS 架構完善的框架（Well-Architected Framework）用來幫助客戶依最佳實務設計與檢視工作負載。下列哪一項是它的支柱之一？"
  options={[
    '卓越營運（Operational Excellence）',
    '實體機房採購',
    '傳真表單流程',
    '手動更換硬碟',
  ]}
  answer={0}>

**正解：A** — **卓越營運**是 Well-Architected Framework 的支柱之一（另含安全、可靠性、效能效率、成本最佳化、永續）。B、C、D 都不是框架支柱，而是與雲端最佳實務無關的事務。

</Quiz>

<Quiz
  qnum={14}
  total={65}
  question="某公司希望提升系統可用性，避免單一機房故障就讓整個服務中斷。下列哪一項是最符合雲端最佳實務的做法？"
  options={[
    '把所有伺服器集中在同一台實體主機上',
    '把工作負載分散到同一區域的多個可用區（AZ）',
    '關閉備援以節省成本',
    '只在單一可用區部署並停用備份',
  ]}
  answer={1}>

**正解：B** — **跨多個可用區部署**可在單一機房故障時維持服務，是提升高可用性的基本做法。A 集中單機是單點故障；C、D 關閉備援與備份會降低可用性，皆違反最佳實務。

</Quiz>

<Quiz
  qnum={15}
  total={65}
  question="關於「規模經濟（economies of scale）」帶來的雲端好處，下列敘述何者正確？"
  options={[
    '因為 AWS 的大量採購與高使用量，單位成本得以降低並反映到價格上',
    '使用者越多，每個人付的單價就越貴',
    '規模經濟代表必須自建更多機房',
    '規模經濟與雲端定價毫無關係',
  ]}
  answer={0}>

**正解：A** — **規模經濟**讓 AWS 以龐大用量壓低單位成本，並以較低價格回饋客戶。B 與事實相反；C 自建機房不是規模經濟的體現；D 規模經濟正是雲端能持續降價的原因之一。

</Quiz>

<Quiz
  qnum={16}
  total={65}
  question="某團隊想用瀏覽器的圖形介面手動操作 AWS，也想用指令列或程式自動化。下列哪兩項是存取與管理 AWS 的正確方式？（Choose TWO）"
  options={[
    'AWS Management Console（網頁圖形介面）',
    'AWS CLI 或 SDK（指令列與程式介面）',
    '實體走進 AWS 機房操作主機',
    '打電話請客服逐一代按按鈕',
    '只能以傳真表單申請變更',
  ]}
  answer={[0, 1]}>

**正解：A、B** — 存取 AWS 的主要方式是 **Management Console（A）** 與 **CLI／SDK（B）**。C 客戶無法進入 AWS 機房；D、E 靠客服代按或傳真皆非 AWS 提供的存取方式。

</Quiz>

## 第二部分　安全與合規

<Quiz
  qnum={17}
  total={65}
  question="在 AWS 責任共擔模型中，下列哪一項屬於「AWS 的責任（雲端本身的安全性，security OF the cloud）」？"
  options={[
    '設定 IAM 使用者的密碼原則與權限',
    '保護實體資料中心、機房設施與底層硬體',
    '為 EC2 作業系統安裝安全性更新',
    '加密客戶存放在 S3 的資料',
  ]}
  answer={1}>

**正解：B** — AWS 負責**雲端本身的安全性**，即實體設施、硬體與全球基礎建設。A、C、D 都屬於「客戶在雲端中的安全性」：IAM 設定、作業系統更新、客戶資料加密皆由客戶負責。

</Quiz>

<Quiz
  qnum={18}
  total={65}
  question="在責任共擔模型中，下列哪一項屬於「客戶的責任（在雲端中的安全性，security IN the cloud）」？"
  options={[
    '保護 AWS 全球資料中心的實體門禁',
    '維護底層虛擬化平台（hypervisor）',
    '管理 IAM 使用者、權限與客戶資料的加密',
    '汰換故障的實體伺服器硬體',
  ]}
  answer={2}>

**正解：C** — 客戶負責**雲端中的安全性**，包含 IAM、權限、資料加密與作業系統設定。A、B、D 都屬於 AWS 負責的實體設施、虛擬化平台與硬體維護。

</Quiz>

<Quiz
  qnum={19}
  total={65}
  question="資安最佳實務建議不要用根使用者（root user）處理日常作業。下列哪一項是較安全且正確的做法？"
  options={[
    '把根使用者的存取金鑰分享給整個團隊',
    '為日常作業建立最小必要權限的 IAM 使用者或角色，並為根使用者啟用 MFA',
    '關閉所有帳號的 MFA 以方便登入',
    '所有人都以根使用者身分登入操作',
  ]}
  answer={1}>

**正解：B** — 最佳實務是**替日常作業建立最小權限的 IAM 身分**，根使用者僅保留做少數必要設定並**啟用 MFA**。A 共用根金鑰、C 關閉 MFA、D 天天用根使用者，都是高風險且違反最小權限。

</Quiz>

<Quiz
  qnum={20}
  total={65}
  question="下列哪一項最符合「最小權限原則（least privilege）」？"
  options={[
    '預設給每位使用者完整的管理員權限',
    '只授予使用者完成工作所需的最小權限，不多給',
    '所有人都共用同一組根使用者金鑰',
    '權限越多越好，方便日後不用再調整',
  ]}
  answer={1}>

**正解：B** — 最小權限原則就是**只給完成工作所需的最小權限**。A、D 預設給過多權限擴大風險面；C 共用根金鑰同時違反最小權限與個別課責。

</Quiz>

<Quiz
  qnum={21}
  total={65}
  question="某稽核人員需要自助下載 AWS 的合規報告（如 SOC、ISO、PCI DSS）以證明符合法規。應使用哪一項服務？"
  options={[
    'AWS Artifact',
    'AWS CloudTrail',
    'Amazon Inspector',
    'AWS Trusted Advisor',
  ]}
  answer={0}>

**正解：A** — **AWS Artifact** 是下載合規與稽核報告的自助入口。B 的 CloudTrail 記錄 API 操作；C 的 Inspector 做漏洞掃描；D 的 Trusted Advisor 給最佳實務建議，皆非下載合規文件之處。

</Quiz>

<Quiz
  qnum={22}
  total={65}
  question="某資安團隊想記錄「誰在何時對帳號內的資源做了哪些 API 操作」，以利稽核與事後調查。最適合的 AWS 服務是？"
  options={[
    'AWS CloudTrail',
    'Amazon S3',
    'AWS Budgets',
    'Amazon Route 53',
  ]}
  answer={0}>

**正解：A** — **CloudTrail** 記錄帳號內的 API 操作軌跡，用於稽核與調查。B 的 S3 是儲存；C 的 Budgets 做預算告警；D 的 Route 53 是 DNS，皆非 API 操作記錄工具。

</Quiz>

<Quiz
  qnum={23}
  total={65}
  question="某團隊想持續評估並記錄 AWS 資源的組態是否符合內部規範（例如是否開啟加密）。最適合的服務是？"
  options={[
    'AWS Config',
    'Amazon CloudFront',
    'AWS Lambda',
    'Amazon SNS',
  ]}
  answer={0}>

**正解：A** — **AWS Config** 持續追蹤資源組態變更並評估是否符合規範。B 的 CloudFront 是內容傳遞；C 的 Lambda 是無伺服器運算；D 的 SNS 是通知服務，皆非組態合規評估工具。

</Quiz>

<Quiz
  qnum={24}
  total={65}
  question="某公司想防護 Web 應用程式免於常見攻擊（如 SQL 注入、跨站腳本），在 CloudFront 或 ALB 前過濾惡意流量。最適合的服務是？"
  options={[
    'AWS WAF（Web Application Firewall）',
    'Amazon S3',
    'AWS Cost Explorer',
    'Amazon EBS',
  ]}
  answer={0}>

**正解：A** — **AWS WAF** 是 Web 應用防火牆，可過濾 SQL 注入、XSS 等常見攻擊。B 的 S3 是儲存；C 的 Cost Explorer 分析成本；D 的 EBS 是區塊儲存，皆與 Web 防護無關。

</Quiz>

<Quiz
  qnum={25}
  total={65}
  question="某遊戲網站想抵禦大規模分散式阻斷服務（DDoS）攻擊。AWS 預設即為所有客戶提供哪一項基本的 DDoS 防護？"
  options={[
    'AWS Shield Standard',
    'AWS Artifact',
    'Amazon Inspector',
    'AWS Config',
  ]}
  answer={0}>

**正解：A** — **AWS Shield Standard** 預設免費為所有客戶提供基本的 DDoS 防護（進階防護為 Shield Advanced）。B 下載合規報告；C 做漏洞掃描；D 評估組態，皆非 DDoS 防護服務。

</Quiz>

<Quiz
  qnum={26}
  total={65}
  question="某團隊想集中管理、輪替並安全存放資料庫密碼與 API 金鑰等機密資訊，避免寫死在程式碼中。最適合的 AWS 服務是？"
  options={[
    'AWS Secrets Manager',
    'Amazon CloudWatch',
    'AWS Trusted Advisor',
    'Amazon VPC',
  ]}
  answer={0}>

**正解：A** — **Secrets Manager** 集中安全存放並可自動輪替資料庫密碼、API 金鑰等機密。B 做監控；C 給最佳實務建議；D 是虛擬網路，皆非機密管理服務。

</Quiz>

<Quiz
  qnum={27}
  total={65}
  question="某公司要為靜態與傳輸中的資料加密，並集中建立與管理加密金鑰。最適合的 AWS 服務是？"
  options={[
    'AWS KMS（Key Management Service）',
    'Amazon S3 Glacier',
    'AWS CloudFormation',
    'Amazon QuickSight',
  ]}
  answer={0}>

**正解：A** — **AWS KMS** 用於集中建立與管理加密金鑰，供各服務進行加密。B 是封存儲存層級；C 是基礎架構即程式碼；D 是商業智慧視覺化工具，皆非金鑰管理服務。

</Quiz>

<Quiz
  qnum={28}
  total={65}
  question="某團隊想掃描 EC2 執行個體與容器映像是否有已知的軟體漏洞與不安全設定。最適合的 AWS 服務是？"
  options={[
    'Amazon Inspector',
    'AWS Budgets',
    'Amazon Route 53',
    'AWS Artifact',
  ]}
  answer={0}>

**正解：A** — **Amazon Inspector** 自動掃描工作負載的已知漏洞與不安全設定。B 做預算告警；C 是 DNS；D 下載合規報告，皆非漏洞掃描工具。

</Quiz>

<Quiz
  qnum={29}
  total={65}
  question="某資安團隊想利用機器學習持續監控帳號與網路活動，自動偵測可疑或惡意行為（威脅偵測）。最適合的 AWS 服務是？"
  options={[
    'Amazon GuardDuty',
    'Amazon S3',
    'AWS Cost Explorer',
    'Amazon EC2',
  ]}
  answer={0}>

**正解：A** — **Amazon GuardDuty** 是智慧型威脅偵測服務，持續分析活動以發現可疑行為。B 是儲存；C 分析成本；D 是運算服務，皆非威脅偵測服務。

</Quiz>

<Quiz
  qnum={30}
  total={65}
  question="在 AWS 中，下列哪一項是用來跨服務授權存取、且應優先於長期存取金鑰的「臨時憑證」最佳實務做法？"
  options={[
    '為 EC2 或服務指派 IAM 角色（Role），取得臨時憑證',
    '把長期存取金鑰寫死在程式碼裡',
    '用根使用者金鑰供所有應用程式共用',
    '把金鑰張貼在公開的程式碼儲存庫',
  ]}
  answer={0}>

**正解：A** — 最佳實務是**指派 IAM 角色取得臨時憑證**，避免管理長期金鑰。B 寫死金鑰、C 共用根金鑰、D 公開金鑰都是嚴重的資安風險。

</Quiz>

<Quiz
  qnum={31}
  total={65}
  question="某公司想集中管理多個 AWS 帳號，並透過服務控制原則（SCP）對各帳號設定權限上限。最適合的服務是？"
  options={[
    'AWS Organizations',
    'Amazon CloudWatch',
    'AWS Artifact',
    'Amazon S3',
  ]}
  answer={0}>

**正解：A** — **AWS Organizations** 可集中管理多帳號，並用 SCP 設定帳號權限上限。B 做監控；C 下載合規報告；D 是儲存，皆非多帳號治理工具。

</Quiz>

<Quiz
  qnum={32}
  total={65}
  question="下列哪一項是啟用多因素驗證（MFA）的主要資安好處？"
  options={[
    '就算密碼外洩，缺少第二道驗證也難以登入，提升帳號安全',
    '讓密碼永遠不需更換',
    '自動為所有資料加密',
    '取代 IAM 權限設定',
  ]}
  answer={0}>

**正解：A** — **MFA** 要求第二道驗證，**即使密碼外洩也較難被入侵**。B 與 MFA 無關；C 資料加密由 KMS 等負責；D 權限仍需以 IAM 設定，MFA 無法取代。

</Quiz>

<Quiz
  qnum={33}
  total={65}
  question="關於 AWS 合規與法規，下列哪一項敘述正確？"
  options={[
    'AWS 取得多項國際與地區合規認證（如 ISO、SOC、PCI DSS），客戶可善用以滿足自身合規需求',
    '使用 AWS 後客戶完全不需負任何合規責任',
    'AWS 不提供任何合規相關文件',
    '合規僅適用於實體機房，與雲端無關',
  ]}
  answer={0}>

**正解：A** — AWS 取得多項合規認證，客戶可透過 Artifact 取得報告以支持自身合規。B 責任共擔下客戶仍有責任；C AWS 提供大量合規文件；D 合規同樣適用於雲端。

</Quiz>

<Quiz
  qnum={34}
  total={65}
  question="下列哪兩項屬於「客戶在雲端中的安全性（security IN the cloud）」責任？（Choose TWO）"
  options={[
    '設定安全群組與網路存取控制清單（NACL）規則',
    '為客戶自己的資料選擇並設定加密',
    '保護 AWS 資料中心的實體門禁',
    '維護底層硬體與虛擬化平台',
    '更換 AWS 機房內故障的硬碟',
  ]}
  answer={[0, 1]}>

**正解：A、B** — **設定安全群組／NACL（A）** 與**為自己的資料設定加密（B）**都是客戶責任。C、D、E 的實體門禁、硬體與硬碟維護屬於 AWS 負責的「雲端本身的安全性」。

</Quiz>

<Quiz
  qnum={35}
  total={65}
  question="在 VPC 中，下列關於安全群組（Security Group）與網路存取控制清單（NACL）的敘述何者正確？"
  options={[
    '安全群組作用在執行個體層級且具狀態（stateful）；NACL 作用在子網路層級且無狀態（stateless）',
    '兩者完全相同，可互相取代',
    '安全群組只能用於實體資料中心',
    'NACL 只能拒絕流量、永遠無法允許任何流量',
  ]}
  answer={0}>

**正解：A** — **安全群組作用於執行個體層級且具狀態；NACL 作用於子網路層級且無狀態**。B 兩者不同；C 安全群組是雲端 VPC 的機制；D NACL 可同時設定允許與拒絕規則。

</Quiz>

## 第三部分　技術與服務

<Quiz
  qnum={36}
  total={65}
  question="某公司要存放大量使用者上傳的圖片與備份，需要高耐久性、幾乎無限容量、用多少付多少的物件儲存。最適合的服務是？"
  options={[
    'Amazon EC2',
    'Amazon S3',
    'Amazon RDS',
    'Amazon VPC',
  ]}
  answer={1}>

**正解：B** — **Amazon S3** 是物件儲存，提供極高耐久性、近乎無限容量並依用量計費。A 的 EC2 是運算；C 的 RDS 是關聯式資料庫；D 的 VPC 是虛擬網路，皆非物件儲存。

</Quiz>

<Quiz
  qnum={37}
  total={65}
  question="某團隊只想跑程式碼、不管任何伺服器，程式由事件觸發、每次執行幾秒，且希望閒置不收費。最適合的無伺服器服務是？"
  options={[
    'Amazon EC2',
    'AWS Lambda',
    'Amazon EBS',
    'Amazon Route 53',
  ]}
  answer={1}>

**正解：B** — **AWS Lambda** 是無伺服器運算，由事件觸發、依用量計費、閒置不收費。A 的 EC2 要自管伺服器；C 的 EBS 是區塊儲存；D 的 Route 53 是 DNS，皆非無伺服器運算。

</Quiz>

<Quiz
  qnum={38}
  total={65}
  question="某公司要在雲端跑一台可完全掌控作業系統、能安裝自家軟體的虛擬伺服器。最適合的 AWS 服務是？"
  options={[
    'Amazon EC2',
    'Amazon S3',
    'AWS Lambda',
    'Amazon DynamoDB',
  ]}
  answer={0}>

**正解：A** — **Amazon EC2** 提供可完全掌控作業系統的虛擬伺服器。B 是物件儲存；C 是無伺服器函式、無法長期掌控作業系統；D 是 NoSQL 資料庫，皆非虛擬伺服器。

</Quiz>

<Quiz
  qnum={39}
  total={65}
  question="某公司想用全受管的關聯式資料庫（如 MySQL、PostgreSQL），由 AWS 負責備份、修補與高可用。最適合的服務是？"
  options={[
    'Amazon RDS',
    'Amazon S3',
    'Amazon CloudFront',
    'AWS Lambda',
  ]}
  answer={0}>

**正解：A** — **Amazon RDS** 是受管關聯式資料庫，由 AWS 負責備份、修補與高可用。B 是物件儲存；C 是內容傳遞；D 是無伺服器運算，皆非關聯式資料庫服務。

</Quiz>

<Quiz
  qnum={40}
  total={65}
  question="某行動應用需要延遲極低、可自動擴展的鍵值（key-value）NoSQL 資料庫。最適合的 AWS 服務是？"
  options={[
    'Amazon DynamoDB',
    'Amazon RDS',
    'Amazon Redshift',
    'Amazon S3',
  ]}
  answer={0}>

**正解：A** — **Amazon DynamoDB** 是全受管的 NoSQL 鍵值資料庫，提供個位數毫秒延遲與自動擴展。B 是關聯式資料庫；C 是資料倉儲；D 是物件儲存，皆不符鍵值 NoSQL 需求。

</Quiz>

<Quiz
  qnum={41}
  total={65}
  question="某企業要對 TB 至 PB 級的大量歷史資料做複雜的分析查詢（資料倉儲）。最適合的 AWS 服務是？"
  options={[
    'Amazon Redshift',
    'Amazon DynamoDB',
    'Amazon Route 53',
    'Amazon SQS',
  ]}
  answer={0}>

**正解：A** — **Amazon Redshift** 是雲端資料倉儲，專為大規模分析查詢設計。B 適合鍵值快速存取；C 是 DNS；D 是訊息佇列，皆非資料倉儲。

</Quiz>

<Quiz
  qnum={42}
  total={65}
  question="某全球網站想把靜態與動態內容快取到靠近使用者的邊緣節點以降低延遲。最適合的 AWS 服務是？"
  options={[
    'Amazon CloudFront',
    'Amazon S3',
    'AWS Lambda',
    'Amazon RDS',
  ]}
  answer={0}>

**正解：A** — **Amazon CloudFront** 是內容傳遞網路（CDN），透過邊緣節點快取內容降低延遲。B 僅儲存；C 是運算；D 是資料庫，皆非 CDN。

</Quiz>

<Quiz
  qnum={43}
  total={65}
  question="某公司想註冊網域並把網域名稱解析到 AWS 上的資源（DNS 服務）。最適合的 AWS 服務是？"
  options={[
    'Amazon Route 53',
    'Amazon CloudFront',
    'Amazon VPC',
    'Amazon S3',
  ]}
  answer={0}>

**正解：A** — **Amazon Route 53** 是 AWS 的 DNS 與網域註冊服務。B 是 CDN；C 是虛擬網路；D 是物件儲存，皆非 DNS 服務。

</Quiz>

<Quiz
  qnum={44}
  total={65}
  question="某團隊想把進來的流量平均分散到多台 EC2 執行個體，並在某台故障時自動把流量導向健康的執行個體。最適合的服務是？"
  options={[
    'Elastic Load Balancing（ELB）',
    'Amazon S3',
    'AWS Budgets',
    'Amazon Athena',
  ]}
  answer={0}>

**正解：A** — **Elastic Load Balancing** 自動把流量分散到多台健康的執行個體。B 是儲存；C 做預算告警；D 是查詢服務，皆非負載平衡器。

</Quiz>

<Quiz
  qnum={45}
  total={65}
  question="某團隊希望依負載自動增減 EC2 執行個體數量，流量大時擴增、流量小時縮減以省錢。最適合的服務是？"
  options={[
    'Amazon EC2 Auto Scaling',
    'Amazon S3',
    'AWS Artifact',
    'Amazon Rekognition',
  ]}
  answer={0}>

**正解：A** — **EC2 Auto Scaling** 依負載自動增減執行個體數量，兼顧效能與成本。B 是儲存；C 下載合規報告；D 是影像辨識服務，皆非自動擴展。

</Quiz>

<Quiz
  qnum={46}
  total={65}
  question="某團隊想在微服務之間以非同步訊息佇列解耦，讓某個元件暫時忙碌時訊息也不會遺失。最適合的服務是？"
  options={[
    'Amazon SQS（Simple Queue Service）',
    'Amazon S3',
    'Amazon RDS',
    'AWS KMS',
  ]}
  answer={0}>

**正解：A** — **Amazon SQS** 是受管訊息佇列，用於元件間非同步解耦、避免訊息遺失。B 是儲存；C 是資料庫；D 是金鑰管理，皆非訊息佇列。

</Quiz>

<Quiz
  qnum={47}
  total={65}
  question="某系統事件發生時要同時以電子郵件、簡訊通知多個訂閱者（發布／訂閱）。最適合的 AWS 服務是？"
  options={[
    'Amazon SNS（Simple Notification Service）',
    'Amazon EBS',
    'Amazon VPC',
    'Amazon Redshift',
  ]}
  answer={0}>

**正解：A** — **Amazon SNS** 是發布／訂閱通知服務，可同時推播到多個訂閱者（含電子郵件、簡訊）。B 是區塊儲存；C 是虛擬網路；D 是資料倉儲，皆非通知服務。

</Quiz>

<Quiz
  qnum={48}
  total={65}
  question="某公司要把數十 TB 的在地端資料實體搬到 AWS，且頻寬有限、不想透過網路慢慢上傳。最適合的服務是？"
  options={[
    'AWS Snowball',
    'Amazon CloudFront',
    'AWS Lambda',
    'Amazon SNS',
  ]}
  answer={0}>

**正解：A** — **AWS Snowball** 以實體裝置離線搬運大量資料到 AWS，適合頻寬有限的大規模遷移。B 是 CDN；C 是運算；D 是通知服務，皆非資料搬遷裝置。

</Quiz>

<Quiz
  qnum={49}
  total={65}
  question="某團隊想對存放在 S3 的資料直接用標準 SQL 查詢，不想先建立並維護伺服器或資料庫。最適合的服務是？"
  options={[
    'Amazon Athena',
    'Amazon EC2',
    'Amazon EBS',
    'Amazon Route 53',
  ]}
  answer={0}>

**正解：A** — **Amazon Athena** 是無伺服器查詢服務，可直接用 SQL 查詢 S3 中的資料。B 是虛擬伺服器；C 是區塊儲存；D 是 DNS，皆不符無伺服器查詢需求。

</Quiz>

<Quiz
  qnum={50}
  total={65}
  question="某團隊要把一個應用程式打包成容器，並在 AWS 上以受管方式編排執行這些容器。下列哪一項是 AWS 的容器編排服務？"
  options={[
    'Amazon ECS / Amazon EKS',
    'Amazon S3',
    'AWS Budgets',
    'Amazon QuickSight',
  ]}
  answer={0}>

**正解：A** — **Amazon ECS／EKS** 是 AWS 的容器編排服務（EKS 為受管 Kubernetes）。B 是儲存；C 做預算；D 是商業智慧視覺化，皆非容器編排。

</Quiz>

<Quiz
  qnum={51}
  total={65}
  question="某團隊想監控 AWS 資源的指標（如 CPU 使用率）、收集日誌並在門檻超標時觸發告警，同時也想記錄「誰對資源做了哪些 API 操作」以利稽核。下列哪兩項服務的搭配最正確？（Choose TWO）"
  options={[
    'Amazon CloudWatch 負責指標、日誌與告警',
    'AWS CloudTrail 負責記錄帳號內的 API 操作軌跡',
    'Amazon S3 負責監控指標並觸發告警',
    'AWS Artifact 負責記錄 API 操作軌跡',
    'Amazon Route 53 負責收集效能指標',
  ]}
  answer={[0, 1]}>

**正解：A、B** — **CloudWatch 做指標、日誌與告警（A）**，**CloudTrail 記錄 API 操作軌跡供稽核（B）**，兩者常搭配使用。C 的 S3 是儲存、不做監控；D 的 Artifact 是合規報告入口；E 的 Route 53 是 DNS，皆非監控或稽核工具。

</Quiz>

<Quiz
  qnum={52}
  total={65}
  question="某團隊要為 EC2 執行個體掛載一個像硬碟的區塊儲存磁碟區，用來放作業系統與資料。最適合的服務是？"
  options={[
    'Amazon EBS（Elastic Block Store）',
    'Amazon S3',
    'Amazon CloudFront',
    'Amazon SNS',
  ]}
  answer={0}>

**正解：A** — **Amazon EBS** 是掛載給 EC2 的區塊儲存磁碟區。B 是物件儲存（非區塊）；C 是 CDN；D 是通知服務，皆非 EC2 區塊磁碟。

</Quiz>

<Quiz
  qnum={53}
  total={65}
  question="某團隊想在 AWS 上建立一個邏輯隔離的虛擬網路，自訂子網路、路由與閘道。最適合的服務是？"
  options={[
    'Amazon VPC（Virtual Private Cloud）',
    'Amazon S3',
    'AWS Lambda',
    'Amazon RDS',
  ]}
  answer={0}>

**正解：A** — **Amazon VPC** 讓你建立邏輯隔離的虛擬網路並自訂子網路與路由。B 是儲存；C 是運算；D 是資料庫，皆非虛擬網路服務。

</Quiz>

<Quiz
  qnum={54}
  total={65}
  question="某團隊需要可讓多台 EC2 同時掛載、共享存取的受管檔案儲存（檔案系統）。最適合的 AWS 服務是？"
  options={[
    'Amazon EFS（Elastic File System）',
    'Amazon S3 Glacier',
    'Amazon DynamoDB',
    'Amazon Athena',
  ]}
  answer={0}>

**正解：A** — **Amazon EFS** 是受管的共享檔案系統，可讓多台 EC2 同時掛載。B 是封存儲存；C 是 NoSQL 資料庫；D 是查詢服務，皆非共享檔案系統。

</Quiz>

<Quiz
  qnum={55}
  total={65}
  question="某團隊想要可託管程式碼、無伺服器執行，且不必管理底層的做法。下列哪兩項是 AWS 的「無伺服器（serverless）」服務？（Choose TWO）"
  options={[
    'AWS Lambda',
    'Amazon DynamoDB',
    'Amazon EC2',
    '在地端實體伺服器',
    '自行採購的機架式主機',
  ]}
  answer={[0, 1]}>

**正解：A、B** — **Lambda（A）** 與 **DynamoDB（B）** 都是無伺服器服務，不必管理底層伺服器。C 的 EC2 需自管虛擬伺服器；D、E 是在地端實體硬體，皆非無伺服器。

</Quiz>

<Quiz
  qnum={56}
  total={65}
  question="某公司備份資料很少存取、以長期封存為主，可接受取回時需等待數分鐘到數小時，想用最低成本的儲存層。最適合的選項是？"
  options={[
    'Amazon S3 Glacier（封存儲存層）',
    'Amazon S3 Standard（標準）',
    'Amazon EBS gp3',
    'Amazon EC2 執行個體儲存',
  ]}
  answer={0}>

**正解：A** — **S3 Glacier** 是低成本的封存儲存層，適合少存取、可接受較長取回時間的長期封存。B 標準層適合頻繁存取、單價較高；C、D 是給執行個體用的區塊／臨時儲存，皆不符長期封存最低成本需求。

</Quiz>

<Quiz
  qnum={57}
  total={65}
  question="某團隊剛接觸雲端，想快速部署一個 Web 應用程式，只要上傳程式碼，底層的容量、負載平衡、擴展與健康檢查都交給 AWS 自動處理。最適合的服務是？"
  options={[
    'AWS Elastic Beanstalk',
    'Amazon S3',
    'AWS Artifact',
    'Amazon Inspector',
  ]}
  answer={0}>

**正解：A** — **Elastic Beanstalk** 讓你只上傳程式碼，容量佈建、負載平衡、擴展與監控由平台自動處理。B 是儲存；C 下載合規報告；D 做漏洞掃描，皆非應用部署平台。

</Quiz>

## 第四部分　帳務、定價與支援

<Quiz
  qnum={58}
  total={65}
  question="某穩定運行的正式環境伺服器整年都要開著、用量可預測，團隊願意做 1 年或 3 年承諾以換最大折扣。最省錢的 EC2 計費模式是？"
  options={[
    'On-Demand 隨需執行個體',
    'Spot 執行個體',
    'Reserved Instances / Savings Plans（預留或節省方案）',
    'Dedicated Hosts 專用主機',
  ]}
  answer={2}>

**正解：C** — 用量穩定、願做 1 或 3 年承諾時，**Reserved Instances 或 Savings Plans** 折扣最大。A 隨需付牌價最貴；B 的 Spot 會被回收、不適合正式環境；D 的專用主機最貴、僅用於合規或自備授權。

</Quiz>

<Quiz
  qnum={59}
  total={65}
  question="某團隊要跑可容忍中斷、跑完即丟的批次運算，想用最低單價取得運算資源，可接受資源偶爾被回收。最適合的 EC2 計費模式是？"
  options={[
    'Reserved Instances 預留執行個體',
    'Spot 執行個體',
    'On-Demand 隨需執行個體',
    'Dedicated Hosts 專用主機',
  ]}
  answer={1}>

**正解：B** — 可中斷、可重跑、追求最低單價正是 **Spot 執行個體**的經典場景，最高可省約九成。A 適合長期穩定負載；C 隨需無折扣；D 的專用主機最貴，皆不符需求。

</Quiz>

<Quiz
  qnum={60}
  total={65}
  question="某公司希望在成本超過自己設定的固定金額門檻時主動收到告警，以免帳單失控。最適合的工具是？"
  options={[
    'AWS Budgets',
    'AWS CloudTrail',
    'Amazon CloudWatch Logs',
    'AWS Config',
  ]}
  answer={0}>

**正解：A** — **AWS Budgets** 可針對成本或用量設門檻，超過即告警。B 記錄 API 操作；C 收集日誌；D 追蹤組態變更，皆非預算門檻告警工具。

</Quiz>

<Quiz
  qnum={61}
  total={65}
  question="某財務團隊想視覺化檢視並分析過去的 AWS 成本與用量趨勢，找出花費最多的服務。最適合的工具是？"
  options={[
    'AWS Cost Explorer',
    'AWS CloudTrail',
    'Amazon Inspector',
    'AWS Shield',
  ]}
  answer={0}>

**正解：A** — **Cost Explorer** 以圖表視覺化分析歷史成本與用量趨勢。B 記錄 API 操作；C 做漏洞掃描；D 做 DDoS 防護，皆非成本分析工具。

</Quiz>

<Quiz
  qnum={62}
  total={65}
  question="某集團在 Organizations 下有多個部門帳號，希望集中收到一張帳單、簡化對帳，並讓各帳號用量加總以享更多量折扣、共享預留方案。最適合的做法是？"
  options={[
    '在每個帳號各自手動管理與付款',
    '使用 AWS Organizations 的合併帳單（Consolidated Billing）',
    '把所有部門併成單一帳號共用登入',
    '為每個帳號各自聯絡客服開立發票',
  ]}
  answer={1}>

**正解：B** — **合併帳單**讓多帳號集中成一張帳單、簡化對帳，並把用量加總以享更多量折扣、共享 RI／Savings Plans。A 無法加總用量；C 併成單一帳號會失去隔離；D 逐一開發票既不集中也無法共享折扣。

</Quiz>

<Quiz
  qnum={63}
  total={65}
  question="某企業需要「不到 15 分鐘回應關鍵系統中斷、可指派專屬技術客戶經理（TAM）」等級的支援。最適合訂閱的方案是？"
  options={[
    'Basic（基本）支援',
    'Developer（開發者）支援',
    'Business（商業）支援',
    'Enterprise（企業）支援',
  ]}
  answer={3}>

**正解：D** — 提供**專屬 TAM 與最快回應等級**的是 **Enterprise 支援**。A 僅有帳務與服務健康資訊；B 僅供開發測試、營業時間回應；C 已有 24／7 技術支援但不含專屬 TAM。

</Quiz>

<Quiz
  qnum={64}
  total={65}
  question="某團隊想估算一套規劃中的架構在 AWS 上每月大約要花多少錢，以便做預算。AWS 官方提供哪一項工具可事先試算費用？"
  options={[
    'AWS Pricing Calculator',
    'AWS CloudTrail',
    'Amazon GuardDuty',
    'AWS Artifact',
  ]}
  answer={0}>

**正解：A** — **AWS Pricing Calculator** 可在部署前估算規劃中架構的預估月費。B 記錄 API 操作；C 做威脅偵測；D 下載合規報告，皆非費用試算工具。

</Quiz>

<Quiz
  qnum={65}
  total={65}
  question="關於 AWS 支援方案與帳務工具，下列哪兩項敘述正確？（Choose TWO）"
  options={[
    'Basic 支援對所有客戶免費，提供帳務與服務健康資訊',
    'Enterprise 支援提供專屬技術客戶經理（TAM）',
    'Spot 執行個體永遠比 Reserved Instances 更適合不能中斷的正式環境',
    'AWS Budgets 的用途是儲存物件檔案',
    'Cost Explorer 的唯一功能是掃描漏洞',
  ]}
  answer={[0, 1]}>

**正解：A、B** — **Basic 對所有客戶免費（A）**、**Enterprise 提供專屬 TAM（B）**。C 說反了，不能中斷的正式環境不該用會被回收的 Spot；D 的 Budgets 是預算告警而非儲存；E 的 Cost Explorer 是成本分析而非漏洞掃描。

</Quiz>

---

👉 回去複習：[CLF 核心名詞閃卡](./clf-flashcards.md)
