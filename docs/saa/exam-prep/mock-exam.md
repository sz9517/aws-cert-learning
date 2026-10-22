---
sidebar_position: 2
title: 綜合模擬考（65 題）
---

# SAA-C03 綜合模擬考（65 題）

這是一份對齊真實考試規模的**完整模擬卷**：65 題、涵蓋四大領域，題型與配分比照 SAA-C03 官方。每題先自己點選答案，再按「**顯示答案與解析**」對照詳解。所有題目皆為**原創**、仿官方風格（情境式題幹＋限定詞＋含複選），**非真實考題**。

:::info 應試方式建議
- **題數／時間**：65 題、建議限時 **130 分鐘**（約 2 分鐘/題），模擬真實節奏。
- **及格線**：官方為 **720 / 1000**；本卷可自抓「答對約 47 題（72%）」當通過門檻。
- **領域配分**（比照官方權重）：Domain 1 安全 1–20 題、Domain 2 彈性/高可用 21–37 題、Domain 3 高效能 38–52 題、Domain 4 成本 53–65 題。
- **複選題**會在題幹標明「選兩項 / Choose TWO」，務必選滿、不多不少。
- 先全部做完再對答案，模擬考場不能回頭查資料的情境；想針對弱項複習時，也可依上面題號區間挑單一領域練。
:::

:::tip 作答心法
先圈出題幹的**限定詞**（最具成本效益、最少營運負擔、最高可用、最安全、即時、最低延遲…），再回頭刪選項。卡住的題先猜一個並標記，把會的分數先穩穩拿到手。需要時可先翻 [考前衝刺重點](/saa/exam-prep/cram) 把「關鍵字 → 答案」反射複習一遍。
:::

## Domain 1 · 設計安全的架構（第 1–20 題）

<Quiz
  qnum={1}
  total={65}
  question="某公司的 Lambda 函式需要讀取同帳號 DynamoDB 資料表並寫入 CloudWatch Logs，安全團隊要求「只給剛好夠用的權限、且不得使用萬用字元 Action」。下列哪個做法最符合最小權限原則？"
  options={[
    '附加 AWS 受管政策 AdministratorAccess 以免日後缺權限',
    '自訂一條客戶受管政策，只允許該資料表的特定 DynamoDB 動作與寫入 Logs 的動作，並限定資源 ARN',
    '直接在函式程式碼內嵌一組 IAM 使用者的 Access Key',
    '為函式附加 PowerUserAccess 受管政策',
  ]}
  answer={1}>

**正解：B**

最小權限的標準做法是**自訂客戶受管政策，把 Action 與 Resource（ARN）都收斂到剛好夠用**，而非給萬用字元或廣泛的受管政策。A 的 AdministratorAccess 權限過大；D 的 PowerUserAccess 仍遠超需求；C 內嵌長期金鑰既不安全也違反「Lambda 應以執行角色取得臨時憑證」的原則。

</Quiz>

<Quiz
  qnum={2}
  total={65}
  question="某公司剛建立 AWS 帳號，安全團隊要落實 Root 使用者的保護最佳實務。下列哪兩項做法最正確？（選兩項）"
  options={[
    '為 Root 使用者啟用 MFA（多因素驗證）',
    '日常建置工作改用具備所需權限的 IAM 身分，不使用 Root',
    '把 Root 的 Access Key 分享給所有管理員方便共用',
    '刪除 Root 使用者帳號以徹底避免風險',
    '將 Root 密碼寫在共用的試算表供團隊查閱',
  ]}
  answer={[0, 1]}>

**正解：A、B**

Root 保護的兩大原則是**為 Root 啟用 MFA（A）**，以及**日常改用最小權限的 IAM 身分、把 Root 鎖起來只在少數必要時使用（B）**。C 分享 Root 金鑰無法稽核且極危險；D 的 Root 無法刪除、它是帳號本身；E 把密碼放共用試算表等於主動外洩。

</Quiz>

<Quiz
  qnum={3}
  total={65}
  question="某企業導入 AWS IAM Identity Center（原 AWS SSO），希望讓員工以既有的公司身分登入、並一次集中管理多個 AWS 帳號的存取權。關於此做法，下列敘述何者最正確？"
  options={[
    '必須在每個帳號各自手動建立一組 IAM 使用者才能登入',
    'IAM Identity Center 可串接外部身分提供者，集中指派權限集（permission set）到多個帳號，使用者以臨時憑證登入',
    '它只能管理單一 AWS 帳號，無法跨帳號',
    '使用者登入後會自動取得各帳號的 Root 權限',
  ]}
  answer={1}>

**正解：B**

**IAM Identity Center** 可串接外部身分提供者（如公司既有的目錄或 IdP），用**權限集（permission set）**集中指派到 Organizations 底下的多個帳號，使用者透過 **SSO 以臨時憑證**登入，免在每個帳號建長期 IAM 使用者。A 與它的集中式設計相反；C 它本就為跨多帳號而生；D 登入取得的是被指派的權限，絕非 Root。

</Quiz>

<Quiz
  qnum={4}
  total={65}
  question="某系統以客戶託管金鑰（CMK）加密 S3 物件。合規要求「金鑰材料必須定期自動輪替，且不需人工介入」。下列哪個做法最合適？"
  options={[
    '手動建立一把新金鑰並把舊資料全部重新加密',
    '為該 CMK 啟用 KMS 自動金鑰輪替（每年自動輪替金鑰材料）',
    '改用 AWS owned key 以免輪替麻煩',
    '把金鑰材料匯出到本機後定期自行更換',
  ]}
  answer={1}>

**正解：B**

對稱 CMK 可直接**啟用 KMS 自動金鑰輪替**，KMS 會定期（預設每年）自動產生新的金鑰材料並保留舊材料以解密既有密文，全程零人工。A 手動重新加密營運負擔高且非必要；C 的 AWS owned key 無法滿足「自行控制」的合規需求；D 匯出金鑰材料自行更換既複雜又違反「金鑰材料不離開 KMS」的安全設計。

</Quiz>

<Quiz
  qnum={5}
  total={65}
  question="某團隊在 EC2 上執行一支工具，透過 Security Group 開放了 TCP 8080 連入供外部測試。測試完成後他們在 Security Group 新增了一條「Deny 8080」的規則，但連線仍然通。最可能的原因是？"
  options={[
    'Security Group 不支援 Deny 規則，只能以允許規則定義，應移除該允許規則才會擋下',
    'Security Group 的 Deny 規則需等 24 小時才生效',
    '必須改用 Root 帳號才能套用 Deny 規則',
    'Security Group 只對 UDP 有效，對 TCP 無效',
  ]}
  answer={0}>

**正解：A**

**Security Group 只支援允許（Allow）規則，沒有 Deny 的概念**；沒被明確允許的流量就是被擋。要關掉 8080，應**移除那條允許 8080 的規則**，而不是加 Deny。若需要以 Deny 阻擋特定來源，應在子網路層使用無狀態的 NACL。B、C、D 皆為虛構限制。

</Quiz>

<Quiz
  qnum={6}
  total={65}
  question="某金融公司要在多個區域（Region）提供以 KMS 加密的備份，且要求「在主區域不可用時，另一區域也能用對應金鑰解密同一份密文」。最合適的做法是？"
  options={[
    '在每個區域各建一把完全不相關的 CMK，分別加密各自的備份',
    '使用 KMS 多區域金鑰（multi-Region keys），在多個區域建立共用相同金鑰材料的複本金鑰',
    '把單一區域的 CMK 金鑰材料以明文複製到其他區域',
    '停用加密以確保跨區域都能讀取',
  ]}
  answer={1}>

**正解：B**

**KMS 多區域金鑰（multi-Region keys）**讓主金鑰與各區域複本金鑰**共用相同金鑰材料與金鑰 ID**，因此在 A 區加密的密文可在 B 區用對應複本金鑰解密，正好滿足跨區災難復原。A 用不相關金鑰無法互相解密彼此的密文；C 明文複製金鑰材料違反安全設計、也做不到；D 停用加密直接違反合規。

</Quiz>

<Quiz
  qnum={7}
  total={65}
  question="某公司要求所有新上傳到 S3 的物件「在伺服器端加密是強制的、且由 AWS 全權管理金鑰、營運負擔最低」。該貯體沒有特殊的金鑰稽核或存取控制需求。最合適的做法是？"
  options={[
    '為貯體設定預設加密使用 SSE-S3（由 S3 管理金鑰）',
    '要求每位上傳者在用戶端自行用自帶金鑰加密後再上傳',
    '把物件改放到 EC2 的本機磁碟並自行加密',
    '不加密，改以貯體政策限制來源 IP',
  ]}
  answer={0}>

**正解：A**

當需求是「強制伺服器端加密、金鑰完全交給 AWS、最少營運負擔，且沒有自訂金鑰政策或稽核需求」時，**SSE-S3（預設加密）**最合適：設定一次後所有新物件自動加密，金鑰由 S3 代管、零維護。若需自訂金鑰政策與 CloudTrail 稽核才需 SSE-KMS。B 用戶端自帶金鑰營運負擔高；C 偏離 S3；D 限制 IP 不是加密手段。

</Quiz>

<Quiz
  qnum={8}
  total={65}
  question="某容器化應用需要在啟動時取得資料庫連線字串與 API 金鑰。需求是「集中存放、加密保存、而且 API 金鑰必須能自動定期輪替」。下列哪個組合最合適？"
  options={[
    '把所有機密都放在 Parameter Store 的標準參數，並手動更新',
    '把需要自動輪替的 API 金鑰放在 Secrets Manager，其餘不需輪替的設定放在 Parameter Store',
    '把機密全部寫進容器映像檔的環境變數',
    '把機密放在公開 S3 貯體以便容器隨時讀取',
  ]}
  answer={1}>

**正解：B**

**Secrets Manager 內建自動輪替**，適合放需定期輪替的 API 金鑰與資料庫憑證；而不需輪替的一般設定參數放在成本較低的 **Parameter Store** 即可，兩者分工最符合需求。A 的標準參數沒有內建自動輪替；C 把機密寫進映像檔易隨映像外洩；D 放公開貯體等於直接外洩。

</Quiz>

<Quiz
  qnum={9}
  total={65}
  question="某對外 Web 應用部署在 CloudFront 加 ALB 之後，持續收到來自特定國家的惡意爬蟲，以及夾帶 SQL injection 的請求。公司希望在最靠近使用者的邊緣就過濾這些第 7 層惡意流量。最合適的做法是？"
  options={[
    '在 CloudFront 上套用 AWS WAF，啟用 SQL injection 受管規則並加上地理封鎖規則',
    '用 NACL 依請求內文封鎖惡意字串',
    '把 ALB 的 Security Group 關閉所有連入',
    '將應用的網域換掉以躲避爬蟲',
  ]}
  answer={0}>

**正解：A**

**AWS WAF 可直接套在 CloudFront**，在邊緣檢查 HTTP 請求內容：以 SQL injection 受管規則擋第 7 層注入攻擊，並以地理比對規則（geo match）封鎖特定國家，正好涵蓋兩種威脅。B 的 NACL 只看 IP 與埠、讀不懂請求內文；C 關閉所有連入等於讓正常使用者也不能用；D 換網域不是安全控制。

</Quiz>

<Quiz
  qnum={10}
  total={65}
  question="某私有子網路裡的應用程式需要呼叫 Amazon KMS 與 Secrets Manager 的 API，安全要求「流量全程不得流經網際網路」。這兩個服務都不是 S3／DynamoDB。最合適的做法是？"
  options={[
    '為 KMS 與 Secrets Manager 各建立 Gateway 端點',
    '為 KMS 與 Secrets Manager 各建立 Interface 端點（PrivateLink），在子網路放私有 IP 網卡',
    '架設 NAT Gateway 讓流量連出網際網路再呼叫 API',
    '為子網路加上網際網路閘道（IGW）並指派公有 IP',
  ]}
  answer={1}>

**正解：B**

**Gateway 端點只支援 S3 與 DynamoDB**；KMS、Secrets Manager 這類服務要用 **Interface 端點（PrivateLink）**，在子網路內放一張帶私有 IP 的彈性網路介面，讓流量全程走 AWS 內網。A 錯在這兩個服務不支援 Gateway 端點；C、D 都把流量導向網際網路，違反需求。

</Quiz>

<Quiz
  qnum={11}
  total={65}
  question="某企業在 AWS Organizations 底下有「生產 OU」與「沙盒 OU」。安全團隊要求「生產 OU 的所有帳號只能在 ap-northeast-1 與 us-east-1 兩個區域建立資源，連帳號管理員也不能例外」。最合適的做法是？"
  options={[
    '在生產 OU 套用 SCP，以條件限制只允許這兩個區域的操作',
    '在每個帳號逐一為每位使用者加上區域限制政策',
    '為每個角色設定權限邊界來限制區域',
    '把其他區域的服務配額申請為 0',
  ]}
  answer={0}>

**正解：A**

**SCP 可套在 OU 層級**，以條件（如 `aws:RequestedRegion`）限制整個 OU 下所有帳號只能在指定區域操作，連帳號內的管理員也無法突破這道權限天花板，最適合跨多帳號強制區域邊界。B 逐一維護易遺漏且新使用者會漏掉；C 權限邊界只針對單一身分、不涵蓋整個帳號；D 調配額是容量管理、非安全控制且不可靠。

</Quiz>

<Quiz
  qnum={12}
  total={65}
  question="某團隊想把 ALB 連入的流量只允許來自 CloudFront，而拒絕使用者直接連 ALB。同時 ALB 本身只需開放 HTTPS。下列哪兩項設定正確且最安全？（選兩項）"
  options={[
    '在 ALB 的 Security Group 只允許 443（HTTPS）連入',
    '在 ALB 的 Security Group 以 AWS 受管前綴清單（com.amazonaws.global.cloudfront.origin-facing）限制只允許 CloudFront 來源',
    '把 ALB 設為公開並允許 0.0.0.0/0 的所有埠連入',
    '用 NACL 依 HTTP 請求的 Host 標頭過濾來源',
    '關閉 ALB 的 Security Group 以免阻擋流量',
  ]}
  answer={[0, 1]}>

**正解：A、B**

**只允許 443（A）**收斂連入協定；再以 **CloudFront 的 AWS 受管前綴清單限制來源（B）**，即可讓 ALB 只接受來自 CloudFront 的連線、擋掉繞過 CDN 的直連，兩者合用最安全。C 對全世界開放所有埠最不安全；D 的 NACL 只看 IP 與埠、讀不懂 Host 標頭；E 關閉 SG 等於拿掉防線。

</Quiz>

<Quiz
  qnum={13}
  total={65}
  question="某合作夥伴（外部 AWS 帳號）需要臨時存取你帳號內一個特定 S3 貯體，存取期間不定但通常只有幾小時，且公司要求「絕不交付長期金鑰、且可限制對方必須通過 MFA 才能扮演」。最合適的做法是？"
  options={[
    '在你的帳號建立一個跨帳號 IAM Role，信任對方帳號並在信任政策加上 MFA 條件，對方以 STS AssumeRole 取得臨時憑證',
    '在你的帳號建立 IAM 使用者並把 Access Key 寄給對方長期保存',
    '把該 S3 貯體設為公開讀寫讓對方直接存取',
    '共用你帳號的 Root 使用者憑證給對方',
  ]}
  answer={0}>

**正解：A**

跨帳號臨時存取的標準做法是**在資源帳號建立信任對方帳號的 IAM Role**，並在**信任政策加上 MFA 條件（`aws:MultiFactorAuthPresent`）**，對方用 **STS AssumeRole** 取得有時效的臨時憑證，用完即失效、全程無長期金鑰。B 交付長期金鑰違反需求；C 公開貯體外洩資料；D 共用 Root 最嚴重。

</Quiz>

<Quiz
  qnum={14}
  total={65}
  question="某公司要求所有對 S3 貯體的連線「必須使用 HTTPS（傳輸加密），否則一律拒絕」。這項控制要套用在貯體層級、對所有請求者生效。最合適的做法是？"
  options={[
    '在貯體政策加上條件，當 aws:SecureTransport 為 false 時明確 Deny',
    '在每台用戶端手動設定只用 HTTPS',
    '把貯體設為公開但只在白天開放',
    '改用 NACL 阻擋 HTTP 埠',
  ]}
  answer={0}>

**正解：A**

在**貯體政策**加一條：當 **`aws:SecureTransport` 為 false（即走 HTTP）時明確 Deny**，即可在貯體層級強制所有請求都走 HTTPS，與請求者是誰無關。B 靠用戶端自律不可靠、無法強制；C 公開貯體違反安全；D 的 NACL 作用在子網路層、管不到來自各處的 S3 API 請求。

</Quiz>

<Quiz
  qnum={15}
  total={65}
  question="某公司懷疑有攻擊者正嘗試列舉 IAM 權限、並出現異常的大量 API 呼叫與可疑的對外連線。公司希望用「最少營運負擔」持續自動偵測這類威脅行為，而不需自行部署偵測規則。最合適的服務是？"
  options={[
    'Amazon GuardDuty',
    'AWS Config',
    'AWS CloudTrail（僅開啟事件歷史）',
    'Amazon Inspector',
  ]}
  answer={0}>

**正解：A**

**GuardDuty** 持續分析 CloudTrail、VPC Flow Logs 與 DNS 記錄等資料來源，以內建的威脅情報與機器學習**自動偵測異常 API 呼叫、權限列舉、可疑連線**等威脅，開啟即用、營運負擔最低。B 的 Config 評估的是「設定合規」而非威脅行為；C 的 CloudTrail 只記錄 API、本身不做威脅分析；D 的 Inspector 做的是漏洞掃描（如 EC2／容器的 CVE），非行為型威脅偵測。

</Quiz>

<Quiz
  qnum={16}
  total={65}
  question="某團隊要集中管理整個 AWS Organizations 的安全狀態，希望「把 GuardDuty、Inspector 等多個服務的發現項目彙整到單一儀表板，並對照 AWS 基準檢查合規狀態」。最合適的服務是？"
  options={[
    'AWS Security Hub',
    'Amazon CloudWatch Dashboards',
    'AWS Trusted Advisor 的成本面向',
    'AWS Systems Manager Session Manager',
  ]}
  answer={0}>

**正解：A**

**Security Hub** 專門**彙整多個安全服務（GuardDuty、Inspector、Macie 等）的發現項目到單一視圖**，並依 AWS 基礎安全最佳實務、CIS 等基準自動做合規檢查，是跨組織集中式安全態勢管理的首選。B 的 CloudWatch Dashboards 是通用指標面板、不做安全基準評比；C 的 Trusted Advisor 成本面向與安全彙整無關；D 的 Session Manager 是免開埠的遠端連線工具。

</Quiz>

<Quiz
  qnum={17}
  total={65}
  question="某公司想讓私有子網路裡的運維人員能遠端登入 EC2 進行維護，但安全要求「不得對外開放 22 埠、也不要管理 SSH 金鑰與堡壘主機」。最合適的做法是？"
  options={[
    '用 Systems Manager Session Manager 透過 SSM Agent 建立連線，免開 22 埠、免金鑰',
    '在 Security Group 對 0.0.0.0/0 開放 22 埠供全球連入',
    '架設一台公開的堡壘主機並共用 SSH 私鑰',
    '把 EC2 搬到公有子網路並指派公有 IP',
  ]}
  answer={0}>

**正解：A**

**Session Manager** 透過執行個體上的 SSM Agent 與 IAM 授權建立連線，**完全不需開放 22 埠、不需 SSH 金鑰、也不需堡壘主機**，且所有連線可經 CloudTrail 稽核，營運負擔與攻擊面都最低。B 對全世界開 22 埠風險極高；C 堡壘主機與共用私鑰增加攻擊面與維運；D 把執行個體暴露到公網違反需求。

</Quiz>

<Quiz
  qnum={18}
  total={65}
  question="某公司在多個 VPC 與帳號間共用一個內部 API 服務，希望「讓消費端以私有方式存取此服務、流量不經網際網路，且不必互相對接 VPC 或管理路由」。身為服務提供者，最合適的做法是？"
  options={[
    '把服務放在 NLB 之後，建立 VPC 端點服務（AWS PrivateLink），讓消費端以 Interface 端點私密存取',
    '把服務設為公開並要求消費端以公有 IP 連入',
    '為每一對 VPC 建立 VPC 對等連線並手動維護路由',
    '把服務部署到公開 S3 貯體供下載',
  ]}
  answer={0}>

**正解：A**

**AWS PrivateLink（VPC 端點服務）**讓服務提供者把服務放在 **NLB** 之後並發布為端點服務，各消費端在自己的 VPC 建 **Interface 端點**即可私密存取，流量全程走 AWS 內網、不暴露到網際網路，也不需彼此對等或管理複雜路由。B 公開服務違反私有需求；C VPC 對等在多對多時路由維護繁重且會有 CIDR 重疊問題；D 偏離情境。

</Quiz>

<Quiz
  qnum={19}
  total={65}
  question="關於 Security Group 與網路 ACL（NACL）的差異，下列哪兩項敘述正確？（選兩項）"
  options={[
    'Security Group 是有狀態（stateful）的，允許了連入流量後，其回應流量會自動被放行',
    'NACL 是無狀態（stateless）的，連入與回應外送必須分別設定規則',
    'Security Group 可以設定明確的 Deny 規則來阻擋特定 IP',
    'NACL 只能套用在單一 EC2 執行個體，不能套用於子網路',
    'Security Group 作用在子網路層，NACL 作用在執行個體層',
  ]}
  answer={[0, 1]}>

**正解：A、B**

**Security Group 有狀態（A）**：放行連入後回應自動放行，無需另設；**NACL 無狀態（B）**：連入與回應外送要分開設規則。C 錯：SG 只有允許規則、沒有 Deny（要用 NACL 才能明確 Deny）；D 錯：NACL 套在子網路層、不是單一執行個體；E 錯：兩者層級說反了（SG 在執行個體／ENI 層，NACL 在子網路層）。

</Quiz>

<Quiz
  qnum={20}
  total={65}
  question="某公司要為「不論在哪個帳號、由誰建立」的 EC2 執行個體，確保其附掛的 EBS 磁碟一律啟用加密，並能持續稽核是否有未加密磁碟，一旦發現不合規即通知。下列哪兩項做法最直接達成？（選兩項）"
  options={[
    '在每個區域開啟 EBS 預設加密（EBS encryption by default），之後新建的磁碟一律自動加密',
    '用 AWS Config 受管規則（如 encrypted-volumes）持續評估並對不合規磁碟發出通知',
    '請工程師每月手動開啟一次 EC2 主控台檢查磁碟是否加密',
    '把所有未加密磁碟的 Security Group 關閉',
    '將帳號的 Root 金鑰分享給稽核團隊以便檢查',
  ]}
  answer={[0, 1]}>

**正解：A、B**

**開啟 EBS 預設加密（A）**可從源頭保證之後新建磁碟一律加密；再以 **AWS Config 受管規則持續評估（B）**（如 `encrypted-volumes`）偵測現存未加密磁碟並觸發通知，兩者一個預防、一個持續稽核，正好對應需求。C 人工月檢不是「持續」偵測；D 關閉 SG 與加密無關、還會中斷服務；E 分享 Root 金鑰是嚴重的安全風險。

</Quiz>

## Domain 2 · 設計具彈性（高可用）的架構（第 21–37 題）

<Quiz
  qnum={21}
  total={65}
  question="某公司的 Web 層由 Auto Scaling Group 管理，橫跨三個可用區（AZ）。團隊發現尖峰時雖然有擴展，但新機器要等 CPU 指標連續超標一段時間才被加入，導致尖峰初期反應不及、使用者感到卡頓。團隊希望在維持成本效益的前提下，讓擴展「更貼合可預期的流量曲線並提前備妥容量」。最合適的做法是？"
  options={[
    '把期望容量固定設為尖峰所需的最大台數，整天不變',
    '啟用預測性擴展（Predictive Scaling），依歷史流量預先在尖峰前擴容，再搭配動態擴展應付突發',
    '把健康檢查寬限期（health check grace period）設為 0 以加快替換',
    '改用運算能力更大的單一 EC2 機型做垂直擴展',
  ]}
  answer={1}>

**正解：B**

流量「可依歷史預測」且希望「提前備妥容量」時，**預測性擴展**用機器學習分析過往模式、在尖峰到來前就先把容量拉上來，避免被動等指標觸發的延遲；再搭配動態（目標追蹤）擴展應付非預期突發，兼顧成本與反應速度。A 整天跑最大量浪費離峰成本、也失去彈性；C 寬限期設 0 會在新機還沒開機完成時就被健康檢查判定不健康而誤殺；D 垂直擴展單台仍是單點、且無法動態增減。

</Quiz>

<Quiz
  qnum={22}
  total={65}
  question="某資安團隊要在 VPC 中部署第三方防火牆虛擬設備來檢測所有進出流量，並希望這些設備本身能「透明地水平擴展與容錯」，流量可平均分散到多台設備。最適合搭配的負載平衡器是？"
  options={[
    'Application Load Balancer（ALB）',
    'Network Load Balancer（NLB）',
    'Gateway Load Balancer（GWLB）',
    'Classic Load Balancer（CLB）',
  ]}
  answer={2}>

**正解：C**

**GWLB** 專為「串接第三方網路安全設備（如防火牆、IDS/IPS）」而生：它把流量透明導向一組虛擬設備、負責健康檢查與水平擴展，並用 GENEVE 封裝保留原始封包，正好符合需求。ALB 是第 7 層、針對 HTTP/HTTPS 應用流量；NLB 是第 4 層高效能轉送、但不提供設備串接的透明檢測機制；CLB 是上一代產品、不建議新架構採用。

</Quiz>

<Quiz
  qnum={23}
  total={65}
  question="某微服務架構中，一個「訂單服務」要通知「庫存服務」扣減庫存。團隊希望兩者完全解耦：當庫存服務正在部署或暫時離線時，訂單訊息不可遺失，且庫存服務恢復後要能依自己的步調逐筆處理。最符合需求的做法是？"
  options={[
    '讓訂單服務直接同步呼叫庫存服務的 REST API，失敗就重試',
    '在兩者之間放一個 Amazon SQS 佇列，訂單服務寫入訊息、庫存服務依自身處理能力輪詢消化',
    '兩個服務共用同一張資料庫表，用旗標欄位協調',
    '把庫存扣減邏輯直接合併進訂單服務裡',
  ]}
  answer={1}>

**正解：B**

**SQS 佇列**是非同步解耦的標準做法：訂單服務把訊息寫進佇列即可返回、訊息會持久保留，庫存服務離線期間訊息仍安在，恢復後再**依自身步調拉取**處理，彼此互不阻塞。A 同步呼叫是緊耦合，庫存離線就會失敗、重試也會把壓力回灌訂單服務；C 共用資料庫是緊耦合反模式、擴展與維運都受牽制；D 合併邏輯等於不解耦，任一邊出問題都互相拖垮。

</Quiz>

<Quiz
  qnum={24}
  total={65}
  question="某金融交易系統要求訊息「嚴格依送出順序處理、同一筆交易絕不可被重複處理」，但同一位客戶的交易彼此要照順序、不同客戶之間則可平行處理以提高吞吐。最合適的做法是？"
  options={[
    '使用 SQS 標準佇列以取得最高吞吐量，順序由應用程式自行補救',
    '使用 SQS FIFO 佇列，並以客戶 ID 作為訊息群組 ID（MessageGroupId）',
    '使用 SNS 標準主題直接推播給消費端',
    '使用 SQS FIFO 佇列，但所有訊息用同一個訊息群組 ID',
  ]}
  answer={1}>

**正解：B**

**FIFO 佇列**保證嚴格順序與去重（exactly-once 處理）；關鍵在用**客戶 ID 當訊息群組 ID**：同一群組（同客戶）內嚴格依序，不同群組（不同客戶）之間可平行消化，既守順序又拉高整體吞吐。A 標準佇列是至少一次、順序盡力而為且可能重複，自行補救易出錯；C SNS 無佇列緩衝、也不保證嚴格順序；D 全部塞同一個群組 ID 會讓所有交易被迫完全序列化、吞吐大幅下降。

</Quiz>

<Quiz
  qnum={25}
  total={65}
  question="某全球網站在北美、歐洲、亞太三個 Region 都有部署。公司因法遵要求「歐盟使用者的流量一律導向歐洲 Region 處理」，其餘地區就近分流。應使用 Route 53 的哪種路由策略？"
  options={[
    '延遲路由（Latency-based routing）',
    '地理位置路由（Geolocation routing）',
    '加權路由（Weighted routing）',
    '故障轉移路由（Failover routing）',
  ]}
  answer={1}>

**正解：B**

**地理位置路由**依使用者「所在地理位置（國家/洲）」決定導向哪個端點，正好滿足「歐盟使用者一律進歐洲 Region」這類法遵或在地化需求。延遲路由只看網路延遲最低、不保證歐盟使用者一定落在歐洲（常見誘答）；加權路由按比例分流、與地理無關；故障轉移路由用於主備自動切換，皆不符此需求。

</Quiz>

<Quiz
  qnum={26}
  total={65}
  question="某正式環境的 RDS 資料庫同時出現兩個問題：(1) 大量唯讀報表查詢拖慢主庫；(2) 主庫一旦故障要能自動容錯移轉、將停機降到最低。下列哪兩項措施能分別直接解決這兩個問題？（選兩項）"
  options={[
    '建立一個或多個 Read Replica（唯讀複本），把報表查詢導向複本',
    '啟用 Multi-AZ 部署，讓備援執行個體在主庫故障時自動接手',
    '把報表查詢也導向 Multi-AZ 的備援執行個體以分攤讀取',
    '改為每 5 分鐘建立一次手動快照以便快速還原',
    '把資料庫換成更大機型後就不再做其他調整',
  ]}
  answer={[0, 1]}>

**正解：A、B**

兩個問題要用兩種不同機制：讀取拖慢主庫 → **Read Replica（A）** 專為讀取擴展設計，把唯讀報表導過去分攤負載；主庫故障要自動容錯 → **Multi-AZ（B）** 同步複寫到另一 AZ 的備援、故障時自動容錯移轉。C 是常見誤解——**Multi-AZ 的備援平時並不分擔讀取**；D 快照是備份、還原仍需時間且非自動容錯；E 垂直擴展治標，既不分讀也不提供自動容錯。

</Quiz>

<Quiz
  qnum={27}
  total={65}
  question="某跨國 SaaS 要求資料庫同時具備「跨多個 Region 的低延遲讀取」與「整個主 Region 故障時能快速升級為可寫入的主庫」。最符合需求的資料庫方案是？"
  options={[
    '單一 Region 的 RDS Multi-AZ 部署',
    'Amazon Aurora 全球資料庫（Global Database）',
    '在每個 Region 各自獨立架設互不相連的 RDS',
    'RDS 搭配同 Region 的多個 Read Replica',
  ]}
  answer={1}>

**正解：B**

**Aurora 全球資料庫**在主 Region 寫入、以極低延遲（通常一秒內）複寫到最多數個次要 Region 供就近低延遲讀取；主 Region 發生故障時，某個次要 Region 可在很短時間內被升級為可寫入的主庫，正好同時滿足「跨區低延遲讀 + 快速故障復原」。A 的 Multi-AZ 只在單一 Region、擋不住整區故障；C 各自獨立的 RDS 無自動跨區複寫、資料會不一致；D 的同區讀取複本無法提供跨 Region 低延遲與跨區容錯。

</Quiz>

<Quiz
  qnum={28}
  total={65}
  question="某內部檔案協作系統要讓分散在多個可用區（AZ）的數十台 Linux EC2「同時共享同一份檔案系統、可並行讀寫」，且容量隨用量自動伸縮、免人工管理。最合適的儲存服務是？"
  options={[
    '把一顆 EBS 磁碟區掛載到多台 EC2 上共用',
    '使用 Amazon EFS，讓多個 AZ 的 EC2 透過掛載目標同時存取同一檔案系統',
    '在單一 EC2 上架設 NFS 伺服器供其餘機器掛載',
    '每台 EC2 各用自己的 EBS，再定期互相同步',
  ]}
  answer={1}>

**正解：B**

**Amazon EFS** 是全託管的 NFS 檔案系統，天生支援「多個 AZ 的大量 EC2 同時掛載、並行讀寫」，容量隨檔案增減自動伸縮、無需預先規劃，完全符合跨 AZ 共享需求。A 一般 EBS 一次只能掛給單一執行個體（io1/io2 的 Multi-Attach 僅限同 AZ 且用途受限），無法跨 AZ 多機共享；C 自建單台 NFS 伺服器本身就是單點故障、也要自己維運擴容；D 各自 EBS 再同步既不即時又複雜易出錯。

</Quiz>

<Quiz
  qnum={29}
  total={65}
  question="某企業的災難復原要求「RTO 以分鐘計、RPO 接近零」，必須承受整個主要 Region 發生大規模故障。預算充足，營運團隊希望切換時「幾乎無感、使用者零停機」。最符合需求的 DR 策略是？"
  options={[
    'Backup & Restore（平時只備份，需要時再還原）',
    'Pilot Light（僅核心資料庫常開、其餘待命）',
    'Warm Standby（另一 Region 常態跑縮小版、災難時擴大）',
    'Multi-Site Active/Active（多站同時服務流量）',
  ]}
  answer={3}>

**正解：D**

當需求是「RTO 數分鐘、RPO 接近零、幾乎零停機」且預算充足時，**Multi-Site（多站同時運作）** 讓兩個 Region 都是正式、同時承接流量並持續同步，主區故障時另一區幾乎無縫接手，是四大策略中復原最快、也最貴的一種。Backup & Restore 復原最慢、RTO 最長；Pilot Light 要先擴容才能服務、RTO 較長；Warm Standby 雖已常態運行但仍需擴容承接、無法達到「零停機」的最高等級。

</Quiz>

<Quiz
  qnum={30}
  total={65}
  question="某公司要讓根網域 example.com（zone apex）直接指向一個對外的 Network Load Balancer，並符合 AWS 最佳實務、查詢不額外收費。應建立哪種 DNS 記錄？"
  options={[
    '指向 NLB DNS 名稱的 CNAME 記錄',
    '指向 NLB 的 Route 53 Alias 記錄',
    '寫死 NLB 目前 IP 的 A 記錄',
    '指向 NLB 的 MX 記錄',
  ]}
  answer={1}>

**正解：B**

**根網域（zone apex）不能用 CNAME**（DNS 規範限制），須改用 Route 53 的 **Alias 記錄**指向 NLB 等 AWS 資源，且 Alias 對 AWS 資源的查詢免費，完全符合需求。A 的 CNAME 不能用在 zone apex；C 寫死 IP 在 NLB 的位址變動時會失效、不可靠；D 的 MX 記錄是給郵件伺服器用的、與網域導向無關。

</Quiz>

<Quiz
  qnum={31}
  total={65}
  question="某批次影像處理系統用一條 SQS 佇列餵給一群以 Auto Scaling Group 管理的工作節點。團隊希望工作節點數量能「依佇列中待處理的訊息數」自動增減：積壓越多就開越多機、處理完就縮回。最合適的擴展設定是？"
  options={[
    '依工作節點的平均 CPU 使用率做目標追蹤擴展',
    '以「每台工作節點平均待處理訊息數（backlog per instance）」這類自訂指標做目標追蹤擴展',
    '設定固定排程，每天同一時間開固定台數',
    '把期望容量固定設為最大值，確保永遠消化得完',
  ]}
  answer={1}>

**正解：B**

對「佇列驅動」的工作負載，真正反映負載的是**待處理訊息的積壓量**，而非 CPU；以 **每台平均積壓訊息數（backlog per instance）作為自訂指標做目標追蹤**，能讓 ASG 直接依佇列深度精準增減節點，積壓升高就擴、清空就縮。A 用 CPU 當指標無法反映佇列積壓（I/O 密集時 CPU 可能偏低卻積壓嚴重）；C 固定排程無法應付不規律的積壓；D 永遠跑最大量浪費離峰成本、失去彈性。

</Quiz>

<Quiz
  qnum={32}
  total={65}
  question="某團隊想把一個即時下單事件「一對多」廣播出去：既要寫入資料倉儲做分析，也要觸發一個通知服務發 email，未來還可能再加新的訂閱者。要求新增訂閱者時「不必改動發布端的程式」，且各訂閱者彼此獨立、互不影響。最合適的架構是？"
  options={[
    '讓下單服務在程式中逐一直接呼叫每個下游服務',
    '建立一個 Amazon SNS 主題，下單服務只發布到主題，各下游各自訂閱（扇出）',
    '把所有事件寫進一條共用的 SQS 佇列，讓所有下游競爭消費',
    '把事件寫進資料庫，讓各下游定時輪詢資料表',
  ]}
  answer={1}>

**正解：B**

**SNS 扇出（fan-out）**正是「一對多廣播、鬆耦合、可隨時加訂閱者」的標準解：發布端只管發布到主題，新增或移除訂閱者完全不必改發布端程式，各訂閱者獨立收訊、互不影響。A 逐一直接呼叫是緊耦合，加一個下游就要改發布端、任一下游掛掉會影響主流程；C 單一 SQS 佇列是「競爭消費（每則訊息只被一個消費者取走）」，不是廣播，無法讓每個下游都各收一份；D 輪詢資料庫既不即時又增加負載、擴展性差。

</Quiz>

<Quiz
  qnum={33}
  total={65}
  question="某公司在 ap-northeast-1 的正式環境是單一 AZ 的三層架構，稽核指出存在可用區單點故障風險。團隊要在「盡量不重構應用程式、以最少改動」達成「可承受單一 AZ 故障」的高可用。下列哪個做法最合適？"
  options={[
    '把整套環境複製到第二個 Region 做跨區雙活',
    '將 ALB 與 Auto Scaling Group 擴展到涵蓋至少兩個 AZ，並為 RDS 啟用 Multi-AZ',
    '為所有 EC2 開啟每日 EBS 快照備份',
    '把所有執行個體升級為運算能力更大的機型',
  ]}
  answer={1}>

**正解：B**

承受「單一 AZ 故障」的標準且改動最小的做法，就是把運算層（ALB + ASG）攤到**至少兩個 AZ**、資料層的 **RDS 啟用 Multi-AZ**，一個 AZ 整個故障時另一 AZ 仍能服務。A 跨 Region 雙活是對抗「整個 Region 故障」的 DR 等級、成本與複雜度遠超此題需求；C 快照只是備份、無助於「持續可用」；D 垂直擴展單台仍是單點故障。

</Quiz>

<Quiz
  qnum={34}
  total={65}
  question="某公司有一個對外 HTTPS 的微服務平台，需要依「網址路徑」把請求導到不同的後端目標群組（例如 /api 導到 API 服務、/img 導到圖片服務），並支援以主機名稱做路由。最適合的負載平衡器是？"
  options={[
    'Application Load Balancer（ALB）',
    'Network Load Balancer（NLB）',
    'Gateway Load Balancer（GWLB）',
    'Classic Load Balancer（CLB）',
  ]}
  answer={0}>

**正解：A**

依「網址路徑（path-based）或主機名稱（host-based）」做第 7 層內容路由，是 **ALB** 的看家本領：它理解 HTTP/HTTPS，能依路徑、主機、標頭等把請求導向不同目標群組，最適合微服務。NLB 是第 4 層、只看 IP 與連接埠、不解析 HTTP 路徑；GWLB 用於串接第三方安全設備；CLB 是上一代、功能有限且不建議新架構採用。

</Quiz>

<Quiz
  qnum={35}
  total={65}
  question="某公司的佇列中偶爾出現「不論重試幾次都處理失敗」的訊息，卡住消費者反覆重試、拖累整體處理速度。團隊希望把這類反覆失敗的訊息自動隔離供事後分析，同時不影響正常訊息的處理。最合適的做法是？"
  options={[
    '把這些處理失敗的訊息一律直接刪除',
    '設定死信佇列（DLQ）並指定最大接收次數（maxReceiveCount），超過即自動移入 DLQ',
    '把佇列的可見逾時（visibility timeout）調到最大值',
    '增加消費者數量，用數量壓過失敗訊息',
  ]}
  answer={1}>

**正解：B**

**死信佇列（DLQ）** 搭配 `maxReceiveCount`：一則訊息被接收處理失敗超過設定次數後，SQS 會自動把它移到 DLQ 隔離，主佇列不再被它卡住，正常訊息照常流動，而隔離起來的毒丸訊息可事後人工分析。A 直接刪會遺失問題線索、無法追查根因；C 調高可見逾時只是延後重試、解決不了反覆失敗；D 加消費者反而讓更多消費者同時卡在同一則毒丸上、治標不治本。

</Quiz>

<Quiz
  qnum={36}
  total={65}
  question="某醫療系統的災難復原要求「RTO 數分鐘、RPO 數分鐘」，必須能抵禦整個主要 Region 故障，但成本上「不想負擔與正式環境完全對等的雙活」。最符合這組取捨的 DR 策略是？"
  options={[
    'Backup & Restore（平時只備份，需要時再還原）',
    'Pilot Light（僅核心資料庫持續同步、運算待命）',
    'Warm Standby（另一 Region 常態跑一套縮小版、災難時快速擴大承接）',
    'Multi-Site Active/Active（兩個 Region 完全對等、同時服務）',
  ]}
  answer={2}>

**正解：C**

需求是「RTO/RPO 都要短，但又不想花完全對等雙活的錢」——這正是 **Warm Standby** 的定位：在另一 Region 常態運行一套「縮小版但隨時可服務」的環境，資料持續同步（RPO 短），災難時只要快速擴容即可承接（RTO 短），成本低於 Multi-Site。Backup & Restore 與 Pilot Light 都要先還原或先擴容、RTO 較長；Multi-Site 雖最快但成本最高、超出此題「不想完全對等」的取捨。

</Quiz>

<Quiz
  qnum={37}
  total={65}
  question="某公司要發布新版 API，需求有二：(1) 先把 5% 的正式流量導到新版、其餘到舊版做金絲雀驗證，確認穩定後再逐步提高比例；(2) 要能依使用者到各 Region 的實測網路延遲，自動把每位使用者導向延遲最低的端點以取得最佳效能。下列哪兩種 Route 53 路由策略分別最適合？（選兩項）"
  options={[
    '加權路由（Weighted）：依權重把 5%／95% 流量分給新舊版',
    '延遲路由（Latency-based routing）：依實測延遲把使用者導向最低延遲的 Region',
    '地理位置路由（Geolocation）：依使用者所在國家分流',
    '故障轉移路由（Failover）：主備自動切換',
    '簡單路由（Simple）：單純回傳固定記錄',
  ]}
  answer={[0, 1]}>

**正解：A、B**

兩個需求各對應一種策略：金絲雀「按比例分流、可逐步調整權重」用 **加權路由（A）**；「依實測網路延遲導向最低延遲端點以求最佳效能」用 **延遲路由（B）**。地理位置路由是依國家而非延遲（不等於延遲最低，常見誘答）；故障轉移路由是主備容錯、不是比例分流或延遲選擇；簡單路由不做任何智慧判斷，皆非此題兩需求的最佳解。

</Quiz>

## Domain 3 · 設計高效能的架構（第 38–52 題）

<Quiz
  qnum={38}
  total={65}
  question="某新聞網站的首頁會呼叫一支後端 API 取得最新頭條，這支 API 每次只需執行約 200 毫秒、流量隨新聞熱度忽高忽低，有時一秒數千次、有時長時間沒人用。團隊不想管理任何伺服器，且希望以最具成本效益的方式提供此 API。最符合需求的運算方案是？"
  options={[
    '開一組固定數量的 EC2 搭配 Application Load Balancer 隨時待命',
    '使用 AWS Lambda 搭配 API Gateway，由請求事件觸發並自動擴縮',
    '在 EC2 上自建一台大型主機並手動調整容量',
    '購買 3 年期預留執行個體長期運行這支 API',
  ]}
  answer={1}>

**正解：B**

極短任務（200 毫秒）、事件驅動、流量忽高忽低、閒置時沒人用、又要「免管伺服器 + 最省」——完全是 **Lambda（搭配 API Gateway）** 的場景，只為實際執行付費、自動擴縮到零。A 固定數量的 EC2 離峰時仍為閒置付費、還要自己維運；C 自建大型主機手動擴容營運負擔最高、也無法貼合瞬間尖峰；D 預留執行個體是對穩定長期用量的承諾、對這種間歇流量多半閒置。

</Quiz>

<Quiz
  qnum={39}
  total={65}
  question="某資料分析團隊已把批次處理程式容器化，每天固定時段跑一次、每次約 30 分鐘，跑完即結束。團隊希望「完全不管理底層 EC2 節點、不處理修補與擴縮」，並以最少營運負擔的方式執行這些容器。最適合的做法是？"
  options={[
    '自建 EC2 叢集並手動安裝 Docker 與排程',
    '使用 ECS 搭配 AWS Fargate 啟動類型排程執行任務',
    '把容器改寫成單次執行 30 分鐘的 Lambda 函式',
    '把容器打包成 AMI 後開一台長期常駐的 EC2',
  ]}
  answer={1}>

**正解：B**

「已容器化 + 每天定時短跑 + 不想管底層節點 + 最少營運負擔」直接對應 **ECS 搭配 Fargate**，由 AWS 管理底層運算、修補與擴縮，任務跑完即釋放、不為閒置付費。A 自建叢集要自己顧節點與排程、營運負擔最高；C 的 Lambda 單次最長 15 分鐘，無法執行 30 分鐘的任務；D 長期常駐 EC2 每天其餘時間都在為閒置付費、也要自己維運。

</Quiz>

<Quiz
  qnum={40}
  total={65}
  question="某高頻交易應用需要一個「暫存的高速暫存空間」來放計算過程的中繼資料，要求「最高的本機 IOPS 與最低延遲」，資料在執行個體關機後不需要保留。最符合效能需求的儲存是？"
  options={[
    'EBS gp3 通用型 SSD',
    'EBS st1 吞吐最佳化 HDD',
    '執行個體儲存（Instance Store）',
    'Amazon EFS 標準模式',
  ]}
  answer={2}>

**正解：C**

「暫存 + 不需持久保留 + 最高本機 IOPS + 最低延遲」正是 **執行個體儲存（Instance Store）** 的定位，它是實體連在主機上的本機 NVMe，提供極高 IOPS 與最低延遲，缺點是關機即消失——但此需求本來就不需保留。A 的 gp3 是網路型區塊儲存、延遲高於本機碟；B 的 st1 是 HDD、走吞吐不走 IOPS；D 的 EFS 是網路共享檔案系統、延遲最高、非最高 IOPS 暫存解。

</Quiz>

<Quiz
  qnum={41}
  total={65}
  question="某資料倉儲載入作業需要一個「大容量、以循序方式一次讀寫大量資料、追求高吞吐（MB 每秒）而非高 IOPS」的磁碟區，且希望以最具成本效益的方式達成。最適合的 EBS 類型是？"
  options={[
    'EBS gp3 通用型 SSD',
    'EBS io2 Block Express',
    'EBS st1 吞吐最佳化 HDD',
    'EBS sc1 冷儲存 HDD',
  ]}
  answer={2}>

**正解：C**

「大容量 + 循序存取 + 追求高吞吐而非 IOPS + 具成本效益」正是 **st1 吞吐最佳化 HDD** 的設計用途，常用於資料倉儲、大型 ETL 與日誌處理這類循序大流量的工作負載。A 的 gp3 是 SSD、適合一般交易型工作但每 GB 較貴；B 的 io2 Block Express 是追求極高 IOPS 與低延遲的高階 SSD、成本最高、方向不符；D 的 sc1 雖更便宜但吞吐更低、適合極少存取的冷資料、不適合需要穩定高吞吐的載入作業。

</Quiz>

<Quiz
  qnum={42}
  total={65}
  question="某建築設計公司把大型 CAD 專案檔放在雲端，有一群 Windows 工作站需要「以 SMB 通訊協定同時存取同一份共享檔案，並與現有的 Active Directory 整合做權限控管」。最符合需求的服務是？"
  options={[
    'Amazon EFS',
    'Amazon FSx for Lustre',
    'Amazon FSx for Windows File Server',
    '為每台工作站各掛一顆獨立的 EBS 磁碟區',
  ]}
  answer={2}>

**正解：C**

「Windows + SMB + 與 Active Directory 整合 + 多機共享」直接對應 **FSx for Windows File Server**，它是原生 Windows 檔案伺服器、支援 SMB 與 AD 整合。A 的 EFS 走 NFS、給 Linux 用；B 的 FSx for Lustre 是 HPC 高吞吐暫存檔案系統、非 Windows SMB 共享；D 的獨立 EBS 一般只掛單台、彼此不共享，無法滿足多機共用同一份檔案。

</Quiz>

<Quiz
  qnum={43}
  total={65}
  question="某廣告平台需要一個資料庫「以使用者 ID 為鍵做查詢、支撐每秒數十萬次請求、延遲要穩定在個位數毫秒、且流量會瞬間暴增，不想預先規劃容量也不想管伺服器」。最符合需求的是？"
  options={[
    'Amazon RDS for PostgreSQL 單一執行個體',
    'Amazon DynamoDB 搭配隨需容量模式',
    '在 EC2 上自建 MongoDB 叢集',
    'Amazon Redshift',
  ]}
  answer={1}>

**正解：B**

「鍵值查詢 + 每秒數十萬 + 個位數毫秒 + 瞬間暴增 + 免規劃容量免管伺服器」是 **DynamoDB（隨需容量）** 的經典場景，隨流量自動擴縮、不需預先設定。A 的 RDS 單一執行個體擴展有上限、難以撐住瞬間暴增；C 的 EC2 自建叢集要自己顧擴展、分片與維運；D 的 Redshift 是資料倉儲、適合分析查詢而非線上高併發鍵值查詢。

</Quiz>

<Quiz
  qnum={44}
  total={65}
  question="某企業的財務系統需要一個「相容 PostgreSQL、但吞吐與效能要遠高於標準 RDS、儲存可自動擴展、並具跨多個可用區的高持久度」的關聯式資料庫。最符合需求的是？"
  options={[
    'Amazon Aurora（PostgreSQL 相容）',
    'Amazon DynamoDB',
    'Amazon ElastiCache for Redis',
    '在 EC2 上自建 PostgreSQL',
  ]}
  answer={0}>

**正解：A**

「相容 PostgreSQL + 遠高於 RDS 的效能與吞吐 + 儲存自動擴展 + 跨多可用區高持久」正是 **Aurora（PostgreSQL 相容）** 的定位，其儲存層自動跨多個可用區複製、容量自動成長。B 的 DynamoDB 是 NoSQL、非 PostgreSQL 相容；C 的 ElastiCache 是記憶體快取、不是主資料庫；D 的 EC2 自建要自己顧擴展與維運、效能也難及 Aurora。

</Quiz>

<Quiz
  qnum={45}
  total={65}
  question="某電商平台的 RDS 主資料庫寫入量正常，但「商品目錄的讀取查詢」在促銷尖峰暴增、把主庫的 CPU 拖滿。團隊希望在「最少的應用程式改動」下分攤讀取壓力、提升讀取效能。最適合的做法是？"
  options={[
    '把 RDS 主執行個體垂直升級到最大機型',
    '建立一或多個 RDS 讀取複本（Read Replica）並把讀取查詢導向複本',
    '把 RDS 改成 Multi-AZ 部署',
    '為 RDS 開啟自動備份與快照',
  ]}
  answer={1}>

**正解：B**

讀取壓力大、要分攤讀取且盡量少改程式 → **Read Replica（讀取複本）** 最對症，應用只要把讀取查詢指向複本端點即可，寫入仍走主庫。A 垂直升級有上限且昂貴、只是治標；C 的 Multi-AZ 是**高可用**機制（待命複本不對外提供讀取、不分攤負載）；D 的備份與快照是資料保護、與讀取效能無關。

</Quiz>

<Quiz
  qnum={46}
  total={65}
  question="某社群 App 大量讀取 DynamoDB，調查發現同一批熱門貼文被重複查詢數百萬次，團隊希望把這些重複讀取的延遲「從個位數毫秒再降到微秒級」，且盡量不改動現有程式邏輯。最適合的做法是？"
  options={[
    '在 DynamoDB 前面自建一層 ElastiCache for Memcached 並自行維護快取邏輯',
    '啟用 DynamoDB Accelerator（DAX）作為原生快取層',
    '為 DynamoDB 大幅調高佈建的讀取容量單位',
    '把熱門貼文改存到 RDS 以加速讀取',
  ]}
  answer={1}>

**正解：B**

「專為 DynamoDB、微秒級、幾乎不改程式」正是 **DAX** 的定位，它是 DynamoDB 原生的記憶體快取層、API 幾乎相容，重複讀取直接命中快取、延遲降到微秒。A 用一般 ElastiCache 要自己寫快取失效與一致性邏輯、較費工；C 調高讀取容量能提升吞吐、但延遲仍停在毫秒級；D 改存 RDS 偏離需求、也不會更快。

</Quiz>

<Quiz
  qnum={47}
  total={65}
  question="某線上遊戲需要一個即時排行榜功能，要能「以分數排序玩家、支援原子性的計數器遞增、具持久化與複製以防資料遺失」。最符合需求的記憶體資料儲存是？"
  options={[
    'Amazon ElastiCache for Memcached',
    'Amazon ElastiCache for Redis',
    'Amazon S3',
    'Amazon DynamoDB 一般資料表',
  ]}
  answer={1}>

**正解：B**

「排序結構（Sorted Set）+ 原子性計數器 + 持久化 + 複製 + 排行榜」正是 **ElastiCache for Redis** 的強項。A 的 Memcached 只有單純鍵值、無排序結構、無持久化與複製；C 的 S3 是物件儲存、不適合即時低延遲排行榜；D 的 DynamoDB 雖可實作，但非記憶體微秒級排序結構的最佳解。

</Quiz>

<Quiz
  qnum={48}
  total={65}
  question="某串流媒體公司把大量影片與圖片放在 S3，全球觀眾經常重複觀看熱門內容，距離來源區域較遠的使用者抱怨載入很慢。團隊希望「把可快取的 HTTP 內容送到離使用者最近的節點」以降低延遲並減少回源流量。最符合需求的服務是？"
  options={[
    'AWS Global Accelerator',
    'Amazon CloudFront',
    'Elastic Load Balancing',
    'AWS Direct Connect',
  ]}
  answer={1}>

**正解：B**

「可快取 HTTP 內容 + 全球就近送達 + 降低延遲 + 減少回源」是 **CloudFront（CDN）** 的本職，熱門內容快取在邊緣節點、重複觀看直接由快取出。A 的 Global Accelerator 加速的是「連線路徑」、本身不快取內容、較適合非 HTTP 的 TCP/UDP；C 的 ELB 是區域內負載平衡、不做全球內容快取；D 的 Direct Connect 是機房到 AWS 的專線、與面向全球觀眾的內容分發無關。

</Quiz>

<Quiz
  qnum={49}
  total={65}
  question="某線上對戰遊戲使用自訂的 TCP/UDP 通訊協定，需要「全球玩家都能透過 AWS 骨幹網路以最低延遲連到最近的進入點，並提供固定的靜態 IP 供企業防火牆白名單使用」，內容本身不需要快取。最符合需求的服務是？"
  options={[
    'Amazon CloudFront',
    'AWS Global Accelerator',
    'Amazon Route 53 延遲路由政策',
    'Application Load Balancer',
  ]}
  answer={1}>

**正解：B**

「非 HTTP（TCP/UDP）+ 走 AWS 骨幹的全球最低延遲路徑 + 固定 anycast 靜態 IP + 不需快取」完全對應 **Global Accelerator**。A 的 CloudFront 偏 HTTP 內容快取、不適合自訂協定的即時連線；C 的 Route 53 只做 DNS 解析、不走骨幹加速連線、也不提供靜態 IP；D 的 ALB 是第 7 層 HTTP 負載平衡、不處理 UDP、也不提供固定靜態 IP。

</Quiz>

<Quiz
  qnum={50}
  total={65}
  question="某物聯網平台要處理即時遙測資料，需求為：「多個不同的下游系統（即時儀表板、異常偵測、長期歸檔）要各自獨立讀取同一份資料串流，且必須能在事故發生後於保留期內重播（reprocess）過去的資料」。最符合需求的服務是？"
  options={[
    'Amazon SQS 標準佇列',
    'Amazon Kinesis Data Streams',
    'Amazon SNS 標準主題',
    'Amazon MQ',
  ]}
  answer={1}>

**正解：B**

「多個消費者各自獨立讀同一份 + 保留期內可重播 + 即時串流」是 **Kinesis Data Streams** 的核心能力，資料在保留期內可被多個應用重複讀取與重播。A 的 SQS 訊息被一個消費者處理後即刪除、無法重播給多方；C 的 SNS 是推播、訊息送出即丟、不保留供重播；D 的 Amazon MQ 是傳統訊息中介、非高吞吐串流重播場景。

</Quiz>

<Quiz
  qnum={51}
  total={65}
  question="某公司要把持續串流進來的應用日誌，以「近乎即時、全託管、免自行撰寫消費者程式與維運基礎設施」的方式自動載入到 Amazon S3 與 Amazon Redshift 供後續分析。最符合需求的服務是？"
  options={[
    'Amazon Kinesis Data Streams，並自行撰寫消費者程式寫入目的地',
    'Amazon Data Firehose（Kinesis Data Firehose）',
    'Amazon SQS 搭配自行開發的 Lambda 整合',
    '在 EC2 上自建 ETL 排程程式',
  ]}
  answer={1}>

**正解：B**

「串流自動入 S3/Redshift + 近即時 + 全託管免寫程式免管基礎設施」正是 **Data Firehose** 的定位，自動緩衝、批次、轉換並傳送到目的地。A 的 Data Streams 要自己寫並維運消費者程式；C 的 SQS 搭配 Lambda 要自行開發整合邏輯、營運負擔較高；D 的 EC2 自建 ETL 排程營運負擔最高、也最難維持近即時。

</Quiz>

<Quiz
  qnum={52}
  total={65}
  question="某跨國團隊常把數 GB 的大型資料集從亞洲與歐洲上傳到位於美國的 S3 儲存貯體，目前上傳既慢又常在半途失敗。下列哪兩項做法最能同時提升上傳的效能與可靠度？（選兩項）"
  options={[
    '啟用 S3 Transfer Acceleration，透過就近的邊緣節點加速跨國上傳',
    '對大型檔案使用分段上傳（Multipart Upload），平行傳送並可對失敗片段重試',
    '把所有物件改用 S3 Glacier Deep Archive 儲存類別',
    '把所有上傳集中到單一相同的前綴以簡化路徑',
    '關閉儲存貯體的版本控制以加快寫入速度',
  ]}
  answer={[0, 1]}>

**正解：A、B**

跨國大檔上傳又慢又易中斷，兩招對症：**Transfer Acceleration（A）** 讓資料先進入就近的邊緣節點、再走 AWS 骨幹到目的貯體、加速跨國傳輸；**Multipart Upload（B）** 把大檔切成多段平行上傳、單段失敗只需重傳該段、大幅提升可靠度與吞吐。C 的 Glacier Deep Archive 是封存儲存類別、與上傳速度無關；D 集中單一前綴反而限制平行度、不利效能；E 版本控制與上傳速度無關、關閉它並不會加快。

</Quiz>

## Domain 4 · 設計成本最佳化的架構（第 53–65 題）

<Quiz
  qnum={53}
  total={65}
  question="某遊戲公司在新遊戲上線首月做大型行銷活動：一部分是「約一個月、流量明顯高於平常且不能中斷」的穩定加量；另一部分是可容忍中斷、跑完即丟的非同步影像壓縮工作。團隊要分別為這兩種負載選出最具成本效益的計費方式。下列哪兩項做法最適合？（選兩項）"
  options={[
    '穩定加量的運算購買承諾每小時運算花費的 Compute Savings Plans（1 年期）',
    '可容忍中斷的影像壓縮工作改用 Spot 執行個體',
    '兩種負載都購買 3 年期標準型預留執行個體（Standard RI）',
    '兩種負載都維持 On-Demand 隨需並停用所有折扣',
    '兩種負載都改用 Dedicated Hosts 專用主機',
  ]}
  answer={[0, 1]}>

**正解：A、B**

兩種負載要分開對應：穩定、可預測、約一個月、不能中斷的加量 → **Compute Savings Plans（A）**，承諾每小時運算花費換折扣、可跨機型彈性套用，活動後仍可被其他常態負載吸收；可容忍中斷、跑完即丟的影像壓縮 → **Spot（B）**，最高可省約九成。C 用 3 年期預留綁一個月的短期加量並不划算、也不該綁可中斷的批次；D 維持隨需等於放著折扣不拿、最不省；E 的專用主機最貴、僅用於合規或自備授權（BYOL）。

</Quiz>

<Quiz
  qnum={54}
  total={65}
  question="某資料分析團隊用 EC2 跑一個大型 Apache Spark 叢集做批次分析，工作可切成許多小任務、支援檢查點（checkpoint），單一節點被收回後可自動在別處續跑，整批允許延後完成。團隊要把這個叢集的運算成本壓到最低。最適合的做法是？"
  options={[
    '整個叢集都用 On-Demand 隨需執行個體',
    '整個叢集都用 Spot 執行個體搭配容量多樣化',
    '整個叢集都買 1 年期預留執行個體',
    '整個叢集都用 Dedicated Hosts 專用主機',
  ]}
  answer={1}>

**正解：B**

「可切分、支援檢查點、節點被收回能續跑、整批可延後」正是 **Spot** 的最佳場景，最高可省約九成；搭配多種執行個體類型做容量多樣化，可降低同時被大量回收的風險。A 的隨需沒有折扣、對可中斷批次最浪費；C 的預留執行個體是對穩定常駐用量的長期承諾，不適合這種跑完即停的批次；D 的專用主機最貴、與此需求無關。

</Quiz>

<Quiz
  qnum={55}
  total={65}
  question="某團隊有一批每天固定存取、存取樣態非常穩定的熱資料放在 S3 Standard，容量很大。團隊想降低這批「天天都要用」資料的儲存成本，但要求任何時候都能毫秒級即時存取、且不想承擔不可預期的取回費。最適合的做法是？"
  options={[
    '轉到 S3 Standard-IA 不常存取類別',
    '轉到 S3 Glacier Instant Retrieval 即時取回',
    '維持 S3 Standard 不動',
    '轉到 S3 One Zone-IA',
  ]}
  answer={2}>

**正解：C**

關鍵在「天天都要存取、樣態穩定」：Standard-IA 與 One Zone-IA 都是為「不常存取」設計，一旦天天讀，每次存取都要付取回費，加總後往往比 Standard 還貴，也有最低儲存天數限制；Glacier Instant Retrieval 雖可毫秒取回，但也是以「偶爾存取」為前提、頻繁讀同樣會被取回費吃掉。因此對高頻熱資料，**維持 S3 Standard（C）** 反而最省、也沒有不可預期的取回費。One Zone-IA 另外還只存單一可用區（AZ），不適合關鍵熱資料。

</Quiz>

<Quiz
  qnum={56}
  total={65}
  question="某醫療影像平台產生大量中介影像檔，這些檔案「可隨時由原始資料重新產生」，存取不頻繁、但要求能快速取用，且團隊可接受單一可用區（AZ）層級的耐久度以換取更低成本。最具成本效益的 S3 儲存類別是？"
  options={[
    'S3 Standard',
    'S3 Standard-IA 不常存取類別',
    'S3 One Zone-IA',
    'S3 Glacier Deep Archive',
  ]}
  answer={2}>

**正解：C**

關鍵三要件是「可重新產生（不怕遺失）＋不常存取但要快速取用＋可接受單一 AZ」，正好對應 **S3 One Zone-IA**：它只存單一可用區，儲存單價比跨三個 AZ 的 Standard-IA 更低，又能即時取用。A 的 Standard 對不常存取的資料太貴；B 的 Standard-IA 跨三個 AZ 較耐久、但單價比 One Zone-IA 高，而本題資料可重建、不需要那層耐久度；D 的 Deep Archive 取回要數小時，不符合「要快速取用」。

</Quiz>

<Quiz
  qnum={57}
  total={65}
  question="某公司有一批封存資料平常幾乎不碰，但依法規要求「一旦稽核單位來查，必須能在毫秒內立即取回」，資料量大且要以最低儲存成本保存。最符合需求的 S3 儲存類別是？"
  options={[
    'S3 Glacier Deep Archive',
    'S3 Glacier Flexible Retrieval',
    'S3 Glacier Instant Retrieval',
    'S3 Standard-IA 不常存取類別',
  ]}
  answer={2}>

**正解：C**

「很少存取、但一旦要就得毫秒即時取回、又要盡量便宜」正是 **Glacier Instant Retrieval** 的定位：儲存單價遠低於 Standard-IA，又能像一般物件一樣即時讀取。A 的 Deep Archive 最便宜但取回要數小時，不符合毫秒即時；B 的 Flexible Retrieval 取回通常要數分鐘到數小時，也不是毫秒；D 的 Standard-IA 雖可即時存取，但儲存單價明顯高於 Glacier Instant Retrieval，對幾乎不碰的封存資料不夠省。

</Quiz>

<Quiz
  qnum={58}
  total={65}
  question="某跨國應用把靜態網站與 API 回應放在單一區域，全球使用者連進來，重複取用相同內容造成對外傳輸費偏高，且遠端使用者延遲也高。團隊想同時降低對外傳輸成本並改善延遲，且希望營運負擔最低。最適合的做法是？"
  options={[
    '把後端同時部署到全球每一個區域',
    '在前面加 Amazon CloudFront，用邊緣快取就近送達並減少回源',
    '把所有內容改放 S3 One Zone-IA 以省錢',
    '為每個國家各建一條 Direct Connect 專線',
  ]}
  answer={1}>

**正解：B**

「重複取用相同內容＋降對外傳輸費＋改善全球延遲＋營運負擔低」正是 **CloudFront（CDN）**：熱門內容快取在邊緣節點就近送達，使用者延遲下降，重複請求不再回源；且 CloudFront 的 egress 費率通常較划算、回源抓 AWS 來源也不另收傳輸費。A 全球多區部署營運與成本都暴增；C 的 One Zone-IA 只省儲存費、與對外傳輸與延遲無關；D 的 Direct Connect 是機房對接專線，不是面向一般網際網路使用者的內容分發方案。

</Quiz>

<Quiz
  qnum={59}
  total={65}
  question="某公司在 AWS Organizations 底下管理多個團隊帳號，財務希望能「依專案、團隊、環境（正式／測試）等維度拆分與歸屬每一筆花費」，以便各專案自行負責預算。團隊想以最少營運負擔達成這種細緻的成本歸屬。最適合的做法是？"
  options={[
    '為每個專案各開一個 AWS 帳號才能分辨花費',
    '啟用成本分配標籤（Cost Allocation Tags）並對資源一致地貼標，再於 Cost Explorer 依標籤拆解',
    '請各團隊每月自行用試算表手動記錄花費',
    '改用 AWS CloudTrail 依 API 呼叫次數估算各專案花費',
  ]}
  answer={1}>

**正解：B**

「依專案／團隊／環境等維度拆分與歸屬花費」最標準且營運負擔最低的做法，是對資源一致地貼上標籤、在帳單主控台啟用 **成本分配標籤（Cost Allocation Tags）**，之後就能在 Cost Explorer／CUR 依標籤任意拆解、歸屬到各專案。A 為了分花費而硬拆成很多帳號，治理與營運負擔都更高、也非必要；C 手動試算表費工又易錯；D 的 CloudTrail 記錄的是 API 操作軌跡，無法反映實際花費金額。

</Quiz>

<Quiz
  qnum={60}
  total={65}
  question="某團隊希望在「每月預估或實際花費即將超過某個金額」時主動收到電子郵件通知，好及早踩煞車，而不是月底才發現超支。團隊要以最少設定達成這個固定門檻的告警。最適合的服務是？"
  options={[
    'AWS Cost Explorer',
    'AWS Budgets 設定成本預算與告警門檻',
    'AWS Cost Anomaly Detection',
    'AWS Cost and Usage Report（CUR）',
  ]}
  answer={1}>

**正解：B**

「針對固定金額門檻、在實際或預估花費接近／超過時主動發通知」正是 **AWS Budgets** 的本職，可設成本或用量預算並綁定告警。A 的 Cost Explorer 是視覺化分析趨勢的工具、本身不是門檻告警器；C 的 Cost Anomaly Detection 用機器學習偵測「異常樣態」、而非你明確設定的固定金額門檻；D 的 CUR 是最細的逐行帳單明細、供深入分析，不會主動告警。

</Quiz>

<Quiz
  qnum={61}
  total={65}
  question="某新創的網站流量非常不規則：大多時間很冷清，但偶爾因社群爆紅瞬間湧入大量請求。其後端的關聯式資料庫目前用固定大小的 RDS 隨需、長期開著，離峰時嚴重閒置卻仍照付整台費用。團隊要以最具成本效益的方式提供這個資料庫，且不想自己預估容量。最適合的做法是？"
  options={[
    '把 RDS 執行個體規格再往上調大以應付尖峰',
    '改用 Amazon Aurora Serverless v2，依實際負載自動伸縮',
    '為這台 RDS 購買 3 年期預留執行個體',
    '多開幾台固定大小的唯讀複本以分散負載',
  ]}
  answer={1}>

**正解：B**

「負載不規則、平常冷清、偶爾暴衝、離峰嚴重閒置、不想猜容量」正是 **Aurora Serverless v2** 的場景：它依實際用量自動放大縮小，離峰縮到很小、幾乎不收錢，暴衝時又能快速擴容。A 把規格調大只是讓離峰閒置付更多；C 的 3 年期預留執行個體是對穩定長期用量的承諾，對這種間歇負載買了多半閒置；D 多開固定大小唯讀複本只是再多付整台費用、也沒解決離峰閒置與尖峰暴衝的本質問題。

</Quiz>

<Quiz
  qnum={62}
  total={65}
  question="某行動 App 的後端用 DynamoDB，流量極難預測：剛上線初期幾乎沒人用，且會不定時因推播活動瞬間暴衝。團隊不想預先規劃讀寫容量、也不想在離峰為沒用到的容量付費，要以最少營運負擔與合理成本起步。最適合的容量模式是？"
  options={[
    '預置容量（Provisioned）並手動設定一個很大的讀寫容量上限',
    '隨需容量模式（On-Demand）',
    '預置容量（Provisioned）但不開啟自動擴展',
    '改用自建在 EC2 上的資料庫以手動控制容量',
  ]}
  answer={1}>

**正解：B**

「流量極難預測、初期幾乎沒量、會不定時暴衝、不想預估容量、營運負擔要低」正是 DynamoDB **隨需容量模式（On-Demand）** 的場景：它自動依實際讀寫量瞬間伸縮、只為實際用量付費、無需規劃容量，暴衝也不怕被節流。A 預置一個很大的上限會長期為閒置容量付費；C 預置又不開自動擴展，暴衝時容易被節流、離峰又浪費；D 自建資料庫手動控容量的營運負擔最高、與需求相反。

</Quiz>

<Quiz
  qnum={63}
  total={65}
  question="某公司私有子網路裡的多台 EC2 需要對外呼叫數個第三方 API 與下載系統更新，流量不大、偶發且可預測。目前為此架了高可用的 NAT 閘道，但每月的固定小時費對這點小流量顯得偏高。團隊想在維持對外連線的前提下降低這筆成本。最具成本效益的做法是？"
  options={[
    '維持多個 NAT 閘道以追求最高可用性',
    '改用 NAT 執行個體（NAT Instance），用一台小型 EC2 承擔少量偶發對外流量',
    '為每台 EC2 直接配置公有 IP 連上網際網路',
    '把所有對外流量改走 Direct Connect 專線',
  ]}
  answer={1}>

**正解：B**

當對外流量「少、偶發、可預測」時，NAT 閘道那筆固定的每小時費＋每 GB 處理費相對顯得貴；此時改用 **NAT 執行個體（一台小型 EC2）** 可大幅降低固定成本，是這種低流量情境的省錢選擇（代價是要自行管理、可用性與吞吐較低）。A 維持多個 NAT 閘道只會讓固定費更高；C 直接配公有 IP 讓私有主機暴露於網際網路、犧牲安全性且仍要付對外傳輸費；D 的 Direct Connect 是機房對接專線、前期成本高，與「對外呼叫第三方 API」需求不符。

</Quiz>

<Quiz
  qnum={64}
  total={65}
  question="某公司盤點帳單後想做一次全面的成本健檢：一方面要找出「閒置或低使用率」的資源（如幾乎沒流量的負載平衡器、長年未掛載的 EBS），另一方面要針對一批明顯開太大的 EC2 取得「調整到剛好規格可省多少」的量化右規模建議。下列哪兩項工具組合最適合？（選兩項）"
  options={[
    '用 AWS Trusted Advisor 找出閒置與低使用率資源的成本最佳化建議',
    '用 AWS Compute Optimizer 取得 EC2 的量化右規模（right-sizing）建議',
    '用 AWS CloudTrail 盤點哪些資源使用率過低',
    '用 AWS Budgets 自動幫忙關閉閒置資源',
    '用 AWS Cost Anomaly Detection 列出該降規的 EC2 清單',
  ]}
  answer={[0, 1]}>

**正解：A、B**

找閒置／低使用率資源 → **Trusted Advisor（A）** 的成本最佳化檢查正是做這件事（閒置負載平衡器、未掛載 EBS、低使用率 RDS 等）；要拿 EC2 的量化右規模建議 → **Compute Optimizer（B）**，它用機器學習分析實際用量、建議調到剛好的規格並估算可省比例。C 的 CloudTrail 記錄 API 操作軌跡、不做使用率分析；D 的 Budgets 只設門檻告警、不會自動關資源；E 的 Cost Anomaly Detection 是偵測花費異常暴增、不是列右規模清單。

</Quiz>

<Quiz
  qnum={65}
  total={65}
  question="某企業要重整整體架構以同時達到「最具成本效益」與「最少營運負擔」：一個長期穩定常駐的核心 API、一批可容忍中斷的夜間資料處理、一個流量間歇的內部報表資料庫，以及一大批三年沒人動的舊檔案。下列哪個組合最適合？"
  options={[
    '核心 API 用 Savings Plans、夜間處理用 Spot、報表庫用 Aurora Serverless v2、舊檔案用生命週期搬到 Glacier Deep Archive',
    '全部改成 On-Demand 並請人每天手動在離峰關機',
    '核心 API 用 Spot、夜間處理用 3 年期預留執行個體、報表庫維持隨需長開、舊檔案留在 S3 Standard',
    '全部搬到團隊自建、自行維運的 EC2 叢集上手動調度',
  ]}
  answer={0}>

**正解：A**

這是綜合情境題，逐項對應即可：長期穩定的核心 API → **Savings Plans／RI** 鎖折扣；可容忍中斷的夜間處理 → **Spot**（最高省約九成）；流量間歇的報表庫 → **Aurora Serverless v2**（閒置自動縮小）；三年沒碰的舊檔案 → **S3 生命週期搬到 Glacier Deep Archive**。而且全是「改設定」、沒自己多架東西，營運負擔幾乎不增加。B 手動關機營運負擔高又不省；C 把不能中斷的核心 API 放 Spot、又讓可中斷的夜間批次綁 3 年預留，方向完全顛倒；D 自建叢集手動調度幾乎永遠不是「營運負擔最低」的答案。

</Quiz>

---

🎉 做完了！對完答案後，答錯的題回去翻對應領域的文章與 [名詞對照表](/glossary) 補強，考前再把 [考前衝刺重點](/saa/exam-prep/cram) 掃一遍。穩住節奏、相信準備——祝你一次通過 SAA-C03！
