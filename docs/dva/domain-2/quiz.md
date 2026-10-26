---
sidebar_position: 7
title: Domain 2 練習題
---

# Domain 2 原創練習題（仿官方考題風格）

先自己點選答案，再按「**顯示答案與解析**」。本頁對齊 DVA-C03 官方題型：**情境式題幹、開發者的安全視角**，考的是**身分與存取、加密與機密管理、簽署與臨時憑證**這些開發細節與取捨（IAM 角色與 instance profile、AssumeRole 與信任政策方向、最小權限、Cognito User Pool 與 Identity Pool、JWT 權杖、KMS 信封加密與 GenerateDataKey、Secrets Manager 自動輪替與 Parameter Store、SigV4 與 presigned URL）。選項皆為合理的 AWS 做法（誘答選項不會明顯錯誤），部分題用「**最符合最小權限／最符合最佳實務／最安全**」等**限定詞**逼你比較。包含**單選**與**複選（Choose TWO）**兩種題型。題目為**原創**內容（非真實考題）。

<Quiz
  qnum={1}
  total={20}
  question="某在 EC2 上執行的應用程式需要讀取 S3 貯體。開發者希望程式「不用在任何地方放長期金鑰」就能取得暫時憑證。最符合最佳實務的做法是？"
  options={[
    '把 IAM 使用者的 Access Key 與 Secret Key 寫進 EC2 上的設定檔',
    '建立 IAM 角色並透過執行個體設定檔（instance profile）附加到 EC2，程式由 SDK 自動取得暫時憑證',
    '把金鑰硬寫在應用程式原始碼裡',
    '用 Root 使用者的金鑰以確保一定有權限',
  ]}
  answer={1}>

**正解：B**

EC2 上的應用程式應透過**執行個體設定檔（instance profile）**掛載一個 **IAM 角色**，執行個體中繼資料服務會提供會自動輪替的**暫時憑證**，SDK 的預設憑證提供者鏈會自動取用，完全不需在機器上放任何長期金鑰。A、C 放長期金鑰違反最佳實務且難以輪替；D 用 Root 金鑰是嚴重安全風險且違反最小權限。

</Quiz>

<Quiz
  qnum={2}
  total={20}
  question="帳號 A 的一個 Lambda 需要寫入帳號 B 的某個 S3 貯體。團隊決定讓 Lambda 去扮演（assume）帳號 B 的一個角色。關於信任關係的設定方向，下列何者正確？"
  options={[
    '在帳號 A 的 Lambda 執行角色上設定信任政策信任帳號 B',
    '在帳號 B 的目標角色上設定信任政策（trust policy）信任帳號 A 的 Lambda 執行角色，並允許該角色呼叫 sts:AssumeRole',
    '把帳號 B 的 Root 金鑰交給帳號 A 使用',
    '只要在帳號 A 的身分政策寫 Allow 即可，不用動帳號 B',
  ]}
  answer={1}>

**正解：B**

跨帳號扮演角色需要兩邊配合，方向是：**被扮演的角色（帳號 B）**的**信任政策**要把**來源主體（帳號 A 的 Lambda 執行角色）**列為可信任，同時帳號 A 的那個角色要有 `sts:AssumeRole` 到帳號 B 角色的權限。A 方向相反（信任政策是設在被扮演的那一方）；C 交出 Root 金鑰極度危險；D 只設來源端、沒設目標角色信任對方，扮演會被拒絕。

</Quiz>

<Quiz
  qnum={3}
  total={20}
  question="某開發者在為一個服務角色撰寫 IAM 政策。需求是「只讓它對某一個特定 DynamoDB 資料表做 GetItem 與 PutItem，其他一律不給」。最符合最小權限原則的政策應如何寫？"
  options={[
    'Action 用 dynamodb:*、Resource 用 *，方便日後擴充',
    'Action 只列 dynamodb:GetItem 與 dynamodb:PutItem、Resource 限定到那張資料表的 ARN',
    '直接附加 AdministratorAccess 代管政策',
    'Action 列 dynamodb:GetItem 與 dynamodb:PutItem、Resource 用 * 涵蓋所有表',
  ]}
  answer={1}>

**正解：B**

最小權限是**只給完成工作所需的動作與資源**：Action 精確列出 `dynamodb:GetItem`、`dynamodb:PutItem`，Resource 以該資料表的 **ARN** 限定範圍。A 的萬用 Action 加全資源權限過大；C 管理員權限完全違反最小權限；D 動作雖對，但 Resource 用 `*` 讓它能存取帳號內所有資料表，仍超出需求。

</Quiz>

<Quiz
  qnum={4}
  total={20}
  question="某 Web App 要讓使用者以電子郵件與密碼註冊、登入，並支援多因素驗證（MFA）與忘記密碼流程，登入後取得可驗證身分的權杖。最適合處理「使用者身分驗證（authentication）」的服務是？"
  options={[
    'Cognito User Pool（使用者池）',
    'Cognito Identity Pool（身分池）',
    'IAM 使用者，每位終端使用者建一個',
    'KMS',
  ]}
  answer={0}>

**正解：A**

**Cognito User Pool** 是託管的**使用者目錄與身分驗證**服務，提供註冊、登入、MFA、忘記密碼等流程，登入成功後發出 **JWT 權杖**（ID／Access／Refresh token）。B 的 Identity Pool 是用來「換取 AWS 暫時憑證」的，不是做登入；C 為每位終端使用者開 IAM 使用者完全不適用（IAM 是給 AWS 內部身分）；D KMS 是加密金鑰管理，與登入無關。

</Quiz>

<Quiz
  qnum={5}
  total={20}
  question="使用者已在 Cognito User Pool 完成登入，前端現在要讓他「直接以暫時 AWS 憑證存取某個 S3 貯體與 DynamoDB」。應該用哪個元件把已驗證身分換成 AWS 暫時憑證？"
  options={[
    '再建一個 User Pool',
    'Cognito Identity Pool（身分池），用 User Pool 發的權杖換取 AWS 暫時憑證',
    '把 User Pool 的 JWT 直接當成 AWS 簽章使用',
    '把 IAM 使用者金鑰下發到前端',
  ]}
  answer={1}>

**正解：B**

**Cognito Identity Pool（身分池）**負責把已驗證的身分（例如 User Pool 發的權杖，或 Google、Facebook 等外部身分提供者）**換成 AWS 暫時憑證（透過 STS）**，讓前端能直接以受限的 IAM 角色存取 S3、DynamoDB 等服務。A 再建 User Pool 不解決授權 AWS 資源的問題；C JWT 不是 AWS 簽章、無法直接簽 AWS 請求；D 下發長期金鑰到前端極度危險。

</Quiz>

<Quiz
  qnum={6}
  total={20}
  question="關於 Cognito User Pool 登入後拿到的三種 JWT 權杖，開發者想知道「呼叫受保護的 API 時，通常應該拿哪一個去授權」。下列敘述何者正確？"
  options={[
    'Refresh token 用來直接呼叫 API 做授權',
    'ID token 描述使用者身分資訊（claims），Access token 用來授權存取受保護資源，Refresh token 用來換取新的 ID／Access token',
    '三種權杖可以互換，用哪個都一樣',
    'Access token 只能存在前端，不能送到後端',
  ]}
  answer={1}>

**正解：B**

三種權杖分工明確：**ID token** 攜帶使用者的身分 claims（who you are）；**Access token** 代表授權、用來**存取受保護資源**（what you can do）；**Refresh token** 在前兩者過期後**換取新的權杖**。A 用途錯（refresh 不是拿來直接授權）；C 三者不可互換；D access token 本來就是要送給後端／API 做授權。

</Quiz>

<Quiz
  qnum={7}
  total={20}
  question="某團隊要用 KMS 加密大量大型檔案（每個都遠超過 4 KB）。他們聽說 KMS 的 Encrypt API 對明文有大小限制。最符合最佳實務、且能處理大型資料的做法是？"
  options={[
    '把大檔案切成每段剛好 4 KB 分別呼叫 KMS Encrypt',
    '使用信封加密（envelope encryption）：呼叫 GenerateDataKey 取得資料金鑰，用它在本機加密大檔，再把被 KMS 加密過的資料金鑰存在旁邊',
    '把整個檔案一次送進 KMS Encrypt，由 KMS 直接加密所有資料',
    '放棄 KMS，自己在程式裡寫固定密碼加密',
  ]}
  answer={1}>

**正解：B**

KMS 的 `Encrypt` 直接加密的明文上限約 **4 KB**，大型資料應用**信封加密**：呼叫 **GenerateDataKey** 取得一把資料金鑰（會同時回傳明文版與被 CMK 加密過的版本），用明文資料金鑰在本機加密大檔後立即丟棄明文、只保存**被加密的資料金鑰**，解密時再請 KMS 解出資料金鑰。A 切 4 KB 逐段呼叫既慢又貴；C 超過 4 KB 會直接失敗；D 自寫固定密碼不安全。

</Quiz>

<Quiz
  qnum={8}
  total={20}
  question="關於 KMS 信封加密中由 GenerateDataKey 回傳的內容，下列哪兩項描述正確？（Choose TWO）"
  options={[
    'GenerateDataKey 會同時回傳一把明文資料金鑰與一份被 CMK 加密過的資料金鑰',
    '應用程式用明文資料金鑰在本機加密資料後，應盡快從記憶體清除明文金鑰',
    '被加密的資料金鑰不能跟密文存在一起，必須存進另一個 AWS 區域',
    '明文資料金鑰應長期保存在設定檔中以便重複使用',
    'GenerateDataKey 只會回傳密文資料金鑰，明文要另外用 Encrypt 產生',
  ]}
  answer={[0, 1]}>

**正解：A、B**

`GenerateDataKey` 一次回傳**兩份**：**明文資料金鑰**（Plaintext）與**被 CMK 加密過的資料金鑰**（CiphertextBlob）。流程是用明文金鑰在本機加密資料，然後**立刻把明文金鑰從記憶體清掉**，只把加密後的資料金鑰與密文一起保存。C 錯，被加密的資料金鑰通常就與密文一起存放，無跨區要求；D 長期保存明文金鑰等於破壞信封加密的安全性；E 描述錯誤，GenerateDataKey 本就同時給明文與密文。

</Quiz>

<Quiz
  qnum={9}
  total={20}
  question="某團隊要用 KMS 做兩件事：一是加密／解密應用程式資料，二是對外部交付的檔案產生數位簽章讓對方驗證。關於對稱與非對稱金鑰的選擇，下列敘述何者正確？"
  options={[
    '兩件事都只能用非對稱金鑰',
    '加解密用對稱金鑰（效率高、GenerateDataKey 等情境適用）；數位簽章／驗章需要非對稱金鑰（公私鑰對）',
    '兩件事都只能用對稱金鑰',
    '對稱與非對稱沒有差別，隨便選即可',
  ]}
  answer={1}>

**正解：B**

KMS **對稱金鑰**一把金鑰同時加解密，效率高，是大多數加密情境（含信封加密的 `GenerateDataKey`）的預設選擇；**非對稱金鑰**是公私鑰對，適合**數位簽章與驗章**（用私鑰簽、公鑰驗）或需要把公鑰交給 AWS 外部的情境。A、C 把兩者綁死都錯；D 兩者用途有明確差異，不可隨意。

</Quiz>

<Quiz
  qnum={10}
  total={20}
  question="帳號裡有一把 KMS 對稱金鑰，某個 IAM 角色需要用它解密資料卻一直被拒絕，即使該角色的身分政策已經 Allow 了 kms:Decrypt。最可能的原因與正確處理是？"
  options={[
    'KMS 金鑰一定是壞了，要重建',
    '除了身分政策，還需要在 KMS 金鑰的金鑰政策（key policy）或授權（grant）中允許該角色使用，兩邊都要放行',
    '只要身分政策 Allow 就一定能解密，與金鑰政策無關',
    '把金鑰設為公開給所有人即可',
  ]}
  answer={1}>

**正解：B**

能否使用 KMS 金鑰同時取決於**身分政策**與**金鑰本身的金鑰政策（key policy）／授權（grant）**：金鑰政策是金鑰的最終守門員，若金鑰政策沒有把該主體列入可用對象，光有身分政策 Allow 仍會被拒。正確做法是在金鑰政策或 grant 中也允許該角色。A 金鑰沒壞；C 忽略了金鑰政策這一層；D 把金鑰公開是嚴重風險且不是正解。

</Quiz>

<Quiz
  qnum={11}
  total={20}
  question="某應用程式使用 RDS 資料庫密碼，公司政策要求「密碼必須定期自動輪替、且輪替時應用程式不中斷」。最符合需求的做法是？"
  options={[
    '把密碼放在 Parameter Store 的 String 參數並手動每季改一次',
    '用 Secrets Manager 儲存資料庫密碼並啟用自動輪替（透過輪替用 Lambda 與資料庫整合）',
    '把密碼寫在 Lambda 環境變數，要改時重新部署',
    '把密碼放在程式碼的設定檔並定期 commit 新密碼',
  ]}
  answer={1}>

**正解：B**

**Secrets Manager** 原生支援**排程自動輪替**，透過輪替用 Lambda 與資料庫（如 RDS）整合，能在不中斷應用程式的情況下更新密碼並同步更新資料庫端。A 的 Parameter Store 標準參數沒有內建自動輪替、手動易遺漏；C 環境變數要靠重新部署且非機密保護機制；D 把密碼寫進程式碼／commit 是嚴重外洩風險。

</Quiz>

<Quiz
  qnum={12}
  total={20}
  question="某應用程式要存一批設定值，其中「資料庫連線字串含密碼」屬機密、「功能開關與逾時秒數」屬一般設定。團隊想在不額外付費的前提下，用一個服務同時管理兩類值，且機密要加密儲存。關於 Parameter Store 的用法，下列哪兩項正確？（Choose TWO）"
  options={[
    '把含密碼的連線字串存成 SecureString 參數，由 KMS 加密',
    '把功能開關、逾時秒數等非機密存成 String 參數',
    '把密碼以明文存成 String 參數就好，反正有 IAM 擋著',
    '所有值都必須存成 SecureString 才合法',
    '把密碼貼在參數的 Description 欄位',
  ]}
  answer={[0, 1]}>

**正解：A、B**

Parameter Store 支援不同參數型別：**機密（含密碼的連線字串）應存成 SecureString**，內容由 **KMS 加密**；**非機密（功能開關、逾時秒數）存成 String** 即可，讀取簡單。C 把密碼明文存成 String 違反機密保護；D 並非所有值都要 SecureString（非機密用 String 更合適）；E 把密碼貼在 Description 等於明文外露。

</Quiz>

<Quiz
  qnum={13}
  total={20}
  question="某高流量 Lambda 每次叫用都呼叫 Secrets Manager 取得同一組密碼，導致 API 呼叫次數與延遲上升，偶爾觸發限流。在不犧牲安全的前提下，最合適的最佳化是？"
  options={[
    '把密碼改成明文寫死在程式碼裡以省去 API 呼叫',
    '在處理常式外層初始化時取得密碼並在執行環境中快取（可用 Secrets Manager 的快取機制），於輪替後更新',
    '每次叫用都呼叫兩次 Secrets Manager 以確保最新',
    '把密碼複製到多個區域分散呼叫',
  ]}
  answer={1}>

**正解：B**

正確做法是在**處理常式外層（初始化階段）取得密碼並在執行環境中快取**，熱叫用重用，大幅減少 Secrets Manager API 呼叫與延遲；可用官方的 Secrets Manager 快取用戶端，並在輪替後讓快取更新，兼顧安全與效能。A 明文寫死違反機密保護；C 呼叫更多次只會更糟；D 跨區複製治標不治本且增加管理複雜度。

</Quiz>

<Quiz
  qnum={14}
  total={20}
  question="開發者用 AWS SDK 對 S3 發出請求，SDK 會自動替請求加上簽章。關於這套請求簽署機制（SigV4），下列敘述何者正確？"
  options={[
    'SigV4 會把你的 Secret Access Key 明文放進請求標頭送出',
    'SigV4 用憑證（含臨時憑證的 session token）對請求內容計算簽章，驗證請求的身分與完整性，Secret Key 本身不會隨請求送出',
    'SigV4 只是把帳號 ID 放進 URL 而已',
    'SigV4 不需要任何憑證就能簽署',
  ]}
  answer={1}>

**正解：B**

**Signature Version 4（SigV4）**用你的憑證（若是臨時憑證還會帶上 **session token**）對請求的方法、路徑、標頭、酬載等**計算簽章**，AWS 端用同樣方式驗算以確認**身分與請求完整性**；**Secret Access Key 本身絕不會隨請求送出**。A 正好相反（Secret Key 不外送）；C、D 都錯誤描述了簽署流程。

</Quiz>

<Quiz
  qnum={15}
  total={20}
  question="某後端為前端產生一個 S3 presigned URL 讓使用者下載私有物件。關於 presigned URL 的權限與有效期，下列哪兩項正確？（Choose TWO）"
  options={[
    'presigned URL 繼承「產生它的那組憑證」的權限，簽發者沒有的權限它也沒有',
    'presigned URL 有到期時間，過期後即失效',
    'presigned URL 一旦產生就永久有效',
    'presigned URL 會讓物件對全世界永久公開',
    'presigned URL 的權限永遠大於簽發者本身的權限',
  ]}
  answer={[0, 1]}>

**正解：A、B**

presigned URL 的能力**來自產生它的那組憑證**：簽發者本身沒有的權限，URL 也不會有（因此該角色要有對該物件的存取權）。同時 presigned URL 帶有**到期時間（expiration）**，過期即失效（用臨時憑證簽發時，有效期還受憑證壽命限制）。C 錯，它不是永久有效；D 錯，它只授予「帶著這個網址者、在期限內」的受限存取，不是把物件公開；E 錯，URL 權限不會超過簽發者。

</Quiz>

<Quiz
  qnum={16}
  total={20}
  question="某行動 App 需要臨時以受限權限存取 S3，權限不能是長期的。後端應該用什麼方式發給 App 短期憑證？"
  options={[
    '把 IAM 使用者的長期 Access Key 直接給 App',
    '用 STS（如 AssumeRole）產生有時效的臨時憑證（Access Key、Secret Key、Session Token）交給 App',
    '把 Root 憑證給 App',
    '為每台裝置都建一個 IAM 使用者並發永久金鑰',
  ]}
  answer={1}>

**正解：B**

需要**短期、受限**的存取應使用 **STS**（例如 `AssumeRole`）產生**臨時安全憑證**——包含 Access Key、Secret Key 與 **Session Token**，有明確到期時間，到期自動失效，最適合行動或前端這類不宜放長期金鑰的場景。A、C、D 都是下發長期／過大權限，違反最小權限與短期憑證的原則。

</Quiz>

<Quiz
  qnum={17}
  total={20}
  question="開發者要讓一個呼叫 AWS 服務的程式在本機與雲端都免硬寫金鑰，且遵守最小權限。關於憑證與角色的使用，下列敘述何者最正確？"
  options={[
    '本機與雲端都把同一組 Access Key 寫進程式碼最省事',
    '本機用具名設定檔（named profile）／SSO 等開發者短期憑證，雲端用執行環境的 IAM 角色（EC2/ECS/Lambda），程式皆不硬寫金鑰',
    '雲端也應該建 IAM 使用者並把金鑰放進環境變數',
    '只要用 Root 使用者就不用管權限設計',
  ]}
  answer={1}>

**正解：B**

最佳實務是**本機用開發者的短期憑證**（具名設定檔、IAM Identity Center／SSO），**雲端讓執行環境掛 IAM 角色**（EC2 instance profile、ECS task role、Lambda 執行角色），SDK 的憑證提供者鏈會自動取用——兩邊程式都不硬寫金鑰，角色權限也各自依最小權限設計。A 硬寫金鑰且無法輪替；C 雲端用長期金鑰不如直接用角色；D 用 Root 違反最小權限。

</Quiz>

<Quiz
  qnum={18}
  total={20}
  question="某服務角色需要一個很寬的身分政策（例如對一組資源的多種動作），但安全團隊要求「無論身分政策給多少，實際有效權限都不得超出某個上限（護欄）」。最適合用來設定這個上限的是？"
  options={[
    '把身分政策裡所有 Allow 都刪掉',
    '用權限界線（permissions boundary）為該角色設定可取得權限的上限，有效權限是身分政策與界線的交集',
    '把角色直接刪除',
    '在信任政策裡加一條 Deny',
  ]}
  answer={1}>

**正解：B**

**權限界線（permissions boundary）**是附加在 IAM 身分上的一個上限：該身分的**有效權限等於其身分政策與界線的交集**，因此即使身分政策很寬，超出界線的部分一律無效，正好當作「護欄」。A 刪掉 Allow 會讓角色無法工作；C 刪角色不是設上限；D 信任政策管的是「誰能扮演」而非權限上限。

</Quiz>

<Quiz
  qnum={19}
  total={20}
  question="某外部 SaaS 廠商需要臨時扮演你帳號裡的一個角色來存取資源。為避免「混淆代理人（confused deputy）」風險，信任政策中應加入什麼來確保只有真正的該廠商能扮演？"
  options={[
    '什麼都不加，信任整個 AWS 即可',
    '在信任政策的條件中要求對方提供約定好的 ExternalId（外部 ID）',
    '把角色設成任何人都能 AssumeRole',
    '把你的 Secret Key 交給廠商',
  ]}
  answer={1}>

**正解：B**

跨帳號給第三方扮演角色時，應在信任政策的條件中要求 **ExternalId（外部 ID）**：只有在 AssumeRole 時帶上你與廠商約定的這個值才能成功扮演，藉此防止**混淆代理人**攻擊（避免攻擊者誘使該廠商替他扮演你的角色）。A 信任整個 AWS 過於寬鬆；C 任何人可扮演極度危險；D 交出 Secret Key 完全錯誤。

</Quiz>

<Quiz
  qnum={20}
  total={20}
  question="某 Lambda 需要呼叫另一個 AWS 服務。開發者想知道「它的身分與權限從哪裡來」。關於 Lambda 執行角色（execution role），下列敘述何者正確？"
  options={[
    'Lambda 用開發者本機的 Access Key 執行',
    'Lambda 以其執行角色（execution role）取得暫時憑證，權限由該角色的政策決定，應依最小權限只給它用到的動作',
    'Lambda 預設擁有帳號內所有權限',
    'Lambda 必須把金鑰寫進環境變數才能呼叫其他服務',
  ]}
  answer={1}>

**正解：B**

Lambda 執行時由 AWS 提供一組對應其**執行角色（execution role）**的**暫時憑證**，函式對其他 AWS 服務的權限完全由該角色的政策決定，應依**最小權限**只授予它真正用到的動作與資源。A 不會用開發者本機金鑰；C Lambda 預設沒有任何權限、需靠角色授予；D 不需把金鑰寫進環境變數（靠角色即可）。

</Quiz>

完成 Domain 2！接著進入 Domain 3。
