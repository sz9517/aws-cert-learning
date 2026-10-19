---
sidebar_position: 8
title: 原創練習題
---

# Domain 1 原創練習題（仿官方考題風格）

先自己點選答案，再按「**顯示答案與解析**」。本頁對齊 SAA-C03 官方題型：**情境式題幹**、選項皆為合理的 AWS 服務（誘答選項不會明顯錯誤），並刻意用「**最安全／最少營運負擔／最具成本效益**」這類**限定詞**逼你比較取捨。包含**單選**與**複選（Choose TWO）**兩種題型。題目為**原創**內容（非真實考題）。

<Quiz
  qnum={1}
  total={12}
  question="某公司的應用程式跑在 EC2 上，需要讀取 S3 貯體裡的檔案。安全團隊要求「不得在執行個體上儲存任何長期憑證」。下列哪個做法最安全？"
  options={[
    '把 Access Key 與 Secret Key 寫在應用程式的設定檔裡',
    '把金鑰放進 EC2 的環境變數供程式讀取',
    '建立一個具備 S3 讀取權限的 IAM Role，指派給 EC2 執行個體',
    '使用 Root 使用者的 Access Key 讓程式存取',
  ]}
  answer={2}>

**正解：C**

EC2 應透過 **IAM Role** 取得臨時、自動輪替的憑證，執行個體上完全不需儲存長期金鑰，風險最低。A、B 都把長期金鑰放在可能外洩的位置；D 使用 Root 金鑰更嚴重違反最小權限。

</Quiz>

<Quiz
  qnum={2}
  total={12}
  question="某公司工程部有 10 位成員需要完全相同的權限，且未來新進人員要能快速套用相同權限。公司希望以「最少的營運負擔」管理。最合適的做法是？"
  options={[
    '為每位成員各自附加一份內容相同的 Policy',
    '建立一個 IAM Group，把 Policy 綁在 Group 上，再把成員加入群組',
    '讓全部成員共用同一組 IAM 使用者帳號密碼',
    '為每位成員建立一個具備完整權限的角色供其扮演',
  ]}
  answer={1}>

**正解：B**

把權限綁在 **IAM Group**、成員加入即自動取得，是管理同職務多人的標準做法，新人加入群組即可、營運負擔最低。A 要逐一維護、容易漂移；C 共用帳號無法稽核且違反最佳實務；D 為每人建角色過度複雜。

</Quiz>

<Quiz
  qnum={3}
  total={12}
  question="某 IAM 使用者透過其群組的 Policy 已被允許執行某動作，但安全團隊另外附加了一條明確「Deny」該動作的 Policy。最終該使用者能否執行此動作？"
  options={[
    '可以，因為 Allow 一定勝過 Deny',
    '不行，因為明確的 Deny 一定勝過任何 Allow',
    '要看哪一條 Policy 比較晚建立',
    '兩條衝突時系統會全部忽略、改採預設允許',
  ]}
  answer={1}>

**正解：B**

IAM 評估邏輯：**預設拒絕 → 有 Allow 才放行 → 只要有明確 Deny 一律擋下**。明確 Deny 是最後防線，勝過一切 Allow，與建立時間無關（C 錯）；IAM 預設是拒絕而非允許（D 錯）。

</Quiz>

<Quiz
  qnum={4}
  total={12}
  question="某公司基於法遵需求，要「自行控制加密金鑰的存取政策、自訂輪替週期，並能稽核誰在何時使用過金鑰」。應選擇哪種 KMS 金鑰？"
  options={[
    'AWS 擁有的金鑰（AWS owned key）',
    'AWS 託管金鑰（AWS managed key）',
    '客戶託管金鑰（Customer managed key，CMK）',
    '完全不使用金鑰，改用貯體改名隱藏',
  ]}
  answer={2}>

**正解：C**

只有 **客戶託管金鑰（CMK）** 能讓你自訂金鑰政策、控制輪替並透過 CloudTrail 稽核使用情形。AWS owned／managed 金鑰都無法讓你自訂這些細節；D 不是加密機制。

</Quiz>

<Quiz
  qnum={5}
  total={12}
  question="某工程師在子網路的 NACL 加了一條允許 HTTP（80 埠）進入的規則，但使用者仍連不上網站。Security Group 已確認正確。最可能的原因是？"
  options={[
    'NACL 是無狀態（Stateless）的，尚未加上允許回應流量外送的 outbound 規則',
    'NACL 不支援 HTTP 協定',
    '必須改用 Root 帳號才能套用 NACL 規則',
    'NACL 只能套用在 EC2 執行個體上，不能用於子網路',
  ]}
  answer={0}>

**正解：A**

**NACL 是無狀態的**，進入與回應外送必須分別設定規則。需再加一條 outbound 允許（通常是回應用的高位暫時埠 1024–65535）。若改用 Security Group 則不需要，因為它是有狀態、會自動放行回應流量。

</Quiz>

<Quiz
  qnum={6}
  total={12}
  question="某應用程式連線 RDS 資料庫時，需要使用「能定期自動輪替」的資料庫密碼，且公司不想自行維護輪替程式。最合適的服務是？"
  options={[
    '把密碼放在 EC2 的環境變數',
    'AWS Secrets Manager',
    'Systems Manager Parameter Store 的標準參數',
    '把密碼寫在應用程式的程式碼註解裡',
  ]}
  answer={1}>

**正解：B**

**Secrets Manager** 內建與 RDS 整合的**自動輪替**功能，不需自行撰寫輪替邏輯。Parameter Store 標準參數沒有內建輪替（需自行寫 Lambda）；環境變數與程式碼都不是安全的機密管理方式。

</Quiz>

<Quiz
  qnum={7}
  total={12}
  question="稽核時，安全團隊需要查出「哪一個 IAM 身分在什麼時間呼叫了刪除某資源的 API 操作」。應該查看哪個服務？"
  options={[
    'Amazon CloudWatch 的指標與警示',
    'AWS CloudTrail 的事件歷史',
    'AWS Config 的合規分數',
    'Amazon GuardDuty 的威脅發現清單',
  ]}
  answer={1}>

**正解：B**

**CloudTrail** 記錄「誰、何時、對 AWS 做了哪個 API 操作」，是稽核使用者與服務行為的依據。CloudWatch 看效能指標；Config 看資源設定變更與合規狀態；GuardDuty 做威脅偵測，皆非查「誰呼叫了哪個 API」的首選。

</Quiz>

<Quiz
  qnum={8}
  total={12}
  question="某公司使用 AWS Organizations 管理數十個帳號。安全團隊要求「即使某帳號的 IAM 管理員，也絕對無法啟用某個高風險服務」，且規則要能一次套用到多個帳號。最合適的做法是？"
  options={[
    '在每個帳號的每位使用者身上各加一條 Deny 政策',
    '在 AWS Organizations 設定 SCP（服務控制政策）拒絕該服務',
    '為每個角色設定權限邊界（permissions boundary）',
    '把該服務的預算上限設為 0 美元',
  ]}
  answer={1}>

**正解：B**

**SCP** 在組織／OU 層級設定「權限天花板」，涵蓋整個帳號、連帳號內的管理員都無法突破，最適合跨多帳號強制禁用。A 要逐一維護且新使用者可能漏掉；權限邊界只針對單一身分、不涵蓋整個帳號；設預算上限屬成本控制、非安全控制。

</Quiz>

<Quiz
  qnum={9}
  total={12}
  question="私有子網路裡的 EC2 需要存取 S3，要求「流量不經過網際網路」且「成本越低越好」。最合適的做法是？"
  options={[
    '架設 NAT Gateway，讓 EC2 連出網際網路再存取 S3',
    '建立 S3 的 Gateway 端點（VPC Gateway Endpoint）',
    '把 EC2 搬到公有子網路並指派公有 IP',
    '將 S3 貯體設為公開存取以便直接下載',
  ]}
  answer={1}>

**正解：B**

**S3 Gateway 端點**讓流量全程留在 AWS 內網、不走公網，而且**本身免費**，還能省下 NAT 的時數與流量費。A 要付 NAT 費又繞公網；C、D 都把資源暴露到網際網路，違反「不經過網際網路」的安全要求。

</Quiz>

<Quiz
  qnum={10}
  total={12}
  question="某貯體存有客戶個資，公司要求「絕對不會被意外設為公開」且「靜態資料必須加密並可稽核金鑰使用」。下列哪兩項措施最能直接達成？（選兩項）"
  options={[
    '啟用該貯體的 Block Public Access（封鎖公開存取）',
    '為貯體啟用預設加密並使用 SSE-KMS（客戶託管金鑰）',
    '把貯體改名成難以猜測的名稱',
    '把物件的副檔名改成非常見格式',
    '只在上班時間開放貯體的公開存取',
  ]}
  answer={[0, 1]}>

**正解：A、B**

**Block Public Access（A）** 是總開關，會覆蓋任何不小心設成公開的政策或 ACL，直接杜絕公開外洩；**SSE-KMS 預設加密（B）** 讓靜態資料加密且能透過 CloudTrail 稽核金鑰使用，滿足「加密且可稽核」。C、D 只是「以隱藏代替安全」，不是真正的安全控制；E 一旦開放公開就違反需求。

</Quiz>

<Quiz
  qnum={11}
  total={12}
  question="某對外網站持續遭受兩種攻擊：夾帶 SQL injection／XSS 的惡意 HTTP 請求，以及大規模的流量型 DDoS 攻擊。公司希望在流量到達應用前就防禦。下列哪兩項服務組合最適合？（選兩項）"
  options={[
    '部署 AWS WAF 並套用受管規則，過濾 SQL injection／XSS 等第 7 層惡意請求',
    '啟用 AWS Shield（Advanced）防護大規模 DDoS 流量攻擊',
    '只用 Security Group 依請求內容過濾惡意字串',
    '用 NACL 依 HTTP 請求的內文（payload）設定 Deny 規則',
    '把網站的服務埠從 443 改成非標準埠以躲避攻擊',
  ]}
  answer={[0, 1]}>

**正解：A、B**

**WAF（A）** 檢查 HTTP 請求「內容」，能擋 SQL injection、XSS 等第 7 層攻擊；**Shield（B）** 專防 DDoS 流量型攻擊——兩者分工正好涵蓋題目的兩種威脅。C、D 錯在 SG／NACL 只看 IP 與埠、看不懂請求內容；E「改埠躲避」不是安全控制（security through obscurity）。

</Quiz>

<Quiz
  qnum={12}
  total={12}
  question="某私有子網路裡的應用程式要同時私密存取 Amazon S3 與 Amazon SQS，要求「流量都不經過網際網路」。下列哪兩項設定正確且最合適？（選兩項）"
  options={[
    '為 S3 建立 Gateway 端點（VPC Gateway Endpoint）',
    '為 SQS 建立 Interface 端點（PrivateLink）',
    '為 S3 與 SQS 都建立 Interface 端點，因為 Gateway 端點已不支援 S3',
    '架設 NAT Gateway 讓兩者都連出網際網路再存取',
    '為兩者都設定網際網路閘道（IGW）並指派公有 IP',
  ]}
  answer={[0, 1]}>

**正解：A、B**

**Gateway 端點只支援 S3 與 DynamoDB**，所以 S3 用 **Gateway 端點（A）**（免費）；SQS 這類服務則要用 **Interface 端點／PrivateLink（B）**，在子網路放一張私有 IP 網卡。C 說法錯誤（S3 仍支援 Gateway 端點，且多為免費首選）；NAT 與 IGW 都是對外上網用，不符「不經過網際網路」的需求。

</Quiz>

:::note
正式上線後，這個領域的題庫會持續擴充。建議搭配各主題頁的「動手做」一起練，效果最好。
:::
