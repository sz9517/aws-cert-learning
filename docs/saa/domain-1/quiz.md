---
sidebar_position: 8
title: 原創練習題
---

# Domain 1 原創練習題（仿官方考題風格）

先自己點選答案，再按「**顯示答案與解析**」。題目涵蓋 Domain 1 全部主題，對齊官方考試領域與題型風格，為**原創**內容。

<Quiz
  qnum={1}
  total={8}
  question="你的應用程式跑在 EC2 上，需要讀取 S3 的檔案。以下哪個做法最符合 AWS 安全最佳實務？"
  options={[
    '把 Access Key 和 Secret Key 直接寫在程式碼裡',
    '把金鑰存在 EC2 的環境變數',
    '建立一個 IAM Role 並指派給 EC2 執行個體',
    '用 Root 使用者的金鑰',
  ]}
  answer={2}>

**正解：C**

EC2 應透過 **IAM Role** 取得臨時、會自動輪替的憑證，完全不需要儲存長期金鑰，風險最低。A、B、D 都把長期金鑰暴露在可能外洩的位置；D 使用 Root 金鑰更是嚴重違反最小權限。

</Quiz>

<Quiz
  qnum={2}
  total={8}
  question="「工程部」10 位成員需要相同權限，未來新人也要能快速套用。最有效率的做法是？"
  options={[
    '為每個人各自附加一份相同的 Policy',
    '建立一個 IAM Group，把 Policy 綁在 Group 上，再把成員加入',
    '共用同一組 IAM User 帳號密碼',
    '給每個人 Root 權限',
  ]}
  answer={1}>

**正解：B**

把權限綁在 **IAM Group**，成員加入即自動取得。A 要逐一維護易出錯；C 共用帳號無法稽核；D 嚴重違反最小權限。

</Quiz>

<Quiz
  qnum={3}
  total={8}
  question="某 Policy 允許了操作，但安全團隊要強制禁止特定高風險動作。IAM 的評估邏輯是？"
  options={[
    'Allow 一定勝過 Deny',
    '明確的 Deny 一定勝過任何 Allow',
    '看哪個 Policy 比較晚建立',
    '兩者衝突時全部忽略',
  ]}
  answer={1}>

**正解：B**

IAM 規則：**預設拒絕 → 有 Allow 才放行 → 明確 Deny 一律擋下**。Deny 永遠是最後防線，勝過一切 Allow。

</Quiz>

<Quiz
  qnum={4}
  total={8}
  question="公司要求能自行控制加密金鑰的權限、自訂輪替週期，並稽核誰使用過金鑰。該選哪種 KMS 金鑰？"
  options={[
    'AWS 擁有的金鑰（AWS owned）',
    'AWS 託管金鑰（AWS managed）',
    '客戶託管金鑰（Customer managed / CMK）',
    '不需要金鑰',
  ]}
  answer={2}>

**正解：C**

只有 **客戶託管金鑰（CMK）** 能讓你自訂金鑰政策、控制輪替並透過 CloudTrail 稽核使用情形。AWS owned / managed 金鑰你無法自訂這些細節。

</Quiz>

<Quiz
  qnum={5}
  total={8}
  question="你在 NACL 加了允許 HTTP(80) 進入的規則，但使用者仍連不上網站。最可能的原因是？"
  options={[
    'NACL 是無狀態的，你還沒設定允許回應流量的 outbound 規則',
    'NACL 不支援 HTTP',
    '必須改用 Root 帳號',
    'NACL 只能用在 EC2 上',
  ]}
  answer={0}>

**正解：A**

**NACL 是無狀態（Stateless）**，進來和回應出去要分開設定。你需要再加 outbound 允許（通常是回應用的高位埠 1024-65535）。若是 Security Group 則不用，因為它有狀態會自動放行回應。

</Quiz>

<Quiz
  qnum={6}
  total={8}
  question="你要確保一個存有客戶個資的 S3 貯體『絕對不會』被意外設成公開。最有效的做法是？"
  options={[
    '把貯體改名成很難猜的名字',
    '啟用該貯體的 Block Public Access（封鎖公開存取）',
    '只在白天開放存取',
    '把檔案副檔名改掉',
  ]}
  answer={1}>

**正解：B**

**Block Public Access** 是總開關，會覆蓋任何不小心設成公開的貯體政策或 ACL，是防止 S3 外洩最直接有效的方法。改名字、改副檔名都不是安全機制。

</Quiz>

<Quiz
  qnum={7}
  total={8}
  question="應用程式需要在連線 RDS 資料庫時，使用會『自動定期輪替』的密碼。最適合的服務是？"
  options={[
    '把密碼寫在環境變數',
    'Secrets Manager',
    'Parameter Store 標準參數',
    '寫在程式碼註解裡',
  ]}
  answer={1}>

**正解：B**

**Secrets Manager** 內建與 RDS 整合的**自動輪替**功能。Parameter Store 沒有內建輪替（要自己寫 Lambda）；環境變數與程式碼都不是安全的機密管理方式。

</Quiz>

<Quiz
  qnum={8}
  total={8}
  question="稽核時需要查出『哪個使用者在什麼時間刪除了某個資源』。應該看哪個服務？"
  options={[
    'CloudWatch',
    'CloudTrail',
    'AWS Config 的合規分數',
    'GuardDuty 的威脅清單',
  ]}
  answer={1}>

**正解：B**

**CloudTrail** 記錄「誰、何時、對 AWS 做了什麼 API 操作」，是稽核使用者行為的依據。CloudWatch 是效能監控；Config 看設定變更與合規；GuardDuty 做威脅偵測。

</Quiz>

:::note
正式上線後，這個領域的題庫會持續擴充。建議搭配各主題頁的「動手做」一起練，效果最好。
:::
