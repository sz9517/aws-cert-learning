---
sidebar_position: 2
title: Cognito（使用者驗證與授權）
---

# Amazon Cognito：別自己刻登入系統，把「誰是你、你能做什麼」交給 AWS

> 本篇用「開發者視角」帶你搞懂 Cognito 最常考、也最容易混的兩個東西：**User Pool（使用者池，負責驗證＝註冊/登入，發 JWT）** 與 **Identity Pool（身分池，負責授權＝換臨時 AWS 憑證去存取 S3/DynamoDB）**。這兩者的差別、什麼時候用哪個、怎麼搭在一起，是 DVA-C03 Domain 2 的高頻考點。

<Vocab title="📌 先認識這篇會出現的名詞（完全沒碰過也能懂）">

- **驗證（Authentication，簡稱 AuthN）**：確認「**你是誰**」。輸入帳號密碼證明身分，就是驗證。
- **授權（Authorization，簡稱 AuthZ）**：確認「**你能做什麼**」。你是誰確認後，決定你可以讀哪個檔、按哪個鈕。
- **User Pool（使用者池）**：Cognito 的**使用者目錄**，負責註冊、登入、重設密碼、多因素驗證（MFA），登入成功後發給你 <Term en="JSON Web Token" desc="一種用簽章保護、可自我驗證的權杖格式，內含使用者資訊與過期時間。">JWT</Term> 權杖。
- **Identity Pool（身分池，又叫 Federated Identities）**：拿一個已驗證的身分（可能來自 User Pool、Google、Apple…），**換成一組臨時的 AWS 憑證**，讓前端 App 能直接存取 S3、DynamoDB 等 AWS 服務。
- **權杖（Token）**：登入成功後拿到的「通行證」。Cognito User Pool 會發三種：**ID token、Access token、Refresh token**。
- **聯合身分（Federation）**：讓使用者用**別處既有的帳號**（Google、Facebook、企業 SAML）登入你的 App，而不用在你這重新註冊。
- **IdP（Identity Provider，身分提供者）**：幫你驗證使用者身分的來源，例如 Google、Apple、企業的 SAML/OIDC。

</Vocab>

:::note[💬 閱讀小提示]
文章裡只要看到帶<Term desc="像這樣！滑鼠移到有虛線的名詞上（手機點一下），就會跳出白話解釋。">虛線底線的名詞</Term>，把滑鼠移上去就會跳出白話解釋。所有名詞也都整理在 [名詞與服務對照表](/glossary)。
:::

## 為什麼需要 Cognito？先講一個「自己刻登入系統超痛苦」的例子

假設你要做一個 App，要讓使用者註冊、登入、忘記密碼能重設、最好還能開多因素驗證（MFA）、可以用 Google 帳號一鍵登入，而且登入後前端要能直接上傳檔案到 S3。

如果你**自己刻**這套：你要自己存密碼（而且得正確地雜湊加鹽，存錯就外洩）、自己發放與驗證登入權杖、自己做「忘記密碼」寄信流程、自己串 Google OAuth、自己想辦法讓前端安全地拿到 AWS 存取權……這每一項都是**安全地雷區**，做錯一個使用者資料就外流。這不是你的核心業務，卻要你投入大量心力還不一定做得安全。

用 <Term en="Amazon Cognito" desc="AWS 的使用者身分服務，負責 App 的註冊/登入（驗證）與換取 AWS 臨時憑證（授權），免得你自己刻登入系統。">Cognito</Term> 幾乎一次解決：註冊/登入/重設密碼/MFA/社群登入全部內建，登入後發標準 JWT 權杖，還能幫前端換到有時效的臨時 AWS 憑證。對開發者來說，重點從「怎麼安全地自建一套帳號系統」變成「怎麼把 Cognito 接上去」。

## 核心：User Pool vs Identity Pool（這題幾乎必考）

這是整篇最重要、也最多人搞混的地方。先用一句話記住：

- **User Pool 管「你是誰」（驗證）** —— 註冊、登入，登入成功發 **JWT**。
- **Identity Pool 管「你能動哪些 AWS 資源」（授權）** —— 拿已驗證身分**換臨時 AWS 憑證**，去存取 S3/DynamoDB。

<Analogy title="🏢 生活比喻：User Pool 是櫃台報到，Identity Pool 是換門禁卡">

想像你去一棟辦公大樓辦事：

- **User Pool = 大廳櫃台報到**：你出示證件、櫃台確認「你確實是本人」，發給你一張**訪客識別證（JWT 權杖）**。這一步只證明「你是誰」，還沒說你能進哪些房間。
- **Identity Pool = 用識別證去換門禁卡**：你拿著訪客證走到門禁櫃台，換成一張**有時效的門禁卡（臨時 AWS 憑證）**，這張卡決定你能刷開哪幾間機房（S3 貯體、DynamoDB 資料表）。時間一到門禁卡就失效，要重換。

重點：**報到（User Pool）和發門禁卡（Identity Pool）是兩件事、兩個櫃台。** 很多人以為 Identity Pool 負責登入——錯，登入是 User Pool 的事。

</Analogy>

| 比較項 | User Pool（使用者池） | Identity Pool（身分池） |
| --- | --- | --- |
| **負責什麼** | **驗證**（AuthN）：你是誰 | **授權**（AuthZ）：你能動哪些 AWS 資源 |
| **產出什麼** | **JWT**（ID / Access / Refresh token） | **臨時 AWS 憑證**（AccessKeyId、SecretKey、SessionToken） |
| **拿來做什麼** | 保護你**自己的 API**（給 API Gateway / ALB 驗權杖） | 讓前端**直接呼叫 AWS 服務**（S3 上傳、DynamoDB 讀寫） |
| **使用者從哪來** | Cognito 自己的使用者目錄，或聯合 Google/SAML | 吃「已驗證的身分」：可來自 User Pool、Google、Apple…甚至允許訪客（guest） |
| **典型搭配** | API Gateway Cognito 授權方、App 登入畫面 | 行動/網頁前端要存取 S3、DynamoDB、分析服務 |

:::info[🔑 一句話分辨：你要「保護 API」還是「直接碰 AWS 服務」？]
- 要**驗證使用者、保護你自己寫的 API** → **User Pool**（把 JWT 丟給 API Gateway 的 Cognito 授權方驗）。
- 要讓**前端直接存取 AWS 服務**（如 App 直接上傳到 S3）→ 需要 **Identity Pool** 換臨時 AWS 憑證。
- 兩者**常一起用**：User Pool 先登入拿 JWT，再把 JWT 餵給 Identity Pool 換 AWS 憑證。
:::

### User Pool 發的三種權杖（ID / Access / Refresh）

登入成功後，User Pool 會回給你三個權杖，DVA 很愛考它們各自的用途：

| 權杖 | 內容 | 拿來做什麼 | 效期 |
| --- | --- | --- | --- |
| **ID token** | 使用者的身分資訊（email、姓名等 claims） | 給**你的 App 前端**知道「登入的是誰」、顯示使用者資料 | 短（預設 1 小時） |
| **Access token** | 使用者的權限範圍（scopes、群組） | 給**後端 API / 資源伺服器**驗證「這個請求可不可以做」 | 短（預設 1 小時） |
| **Refresh token** | 用來換新的 ID/Access token | ID/Access 過期時，**不用重新登入**就換一組新的 | 長（可設定幾天到幾個月） |

:::tip[💡 考試重點：哪個權杖做什麼]
- 題目問「驗證使用者身分、取得使用者屬性」→ **ID token**。
- 題目問「授權 API 存取、檢查 scope / 群組」→ **Access token**。
- 題目問「權杖過期了但不想逼使用者重登」→ 用 **Refresh token** 換新的。
- 這三個都是 **JWT**，可被 API Gateway / ALB 直接驗簽、不用打回 Cognito。
:::

## User Pool 與 Identity Pool 怎麼搭：完整登入到存取流程

兩者搭起來的經典流程（「加強型授權流程 Enhanced Flow」）：

<div className="flow">
  <div className="flow-node">① 使用者在 App 用 User Pool 登入</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">② User Pool 回傳 JWT（ID/Access/Refresh）</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">③ App 把 ID token 交給 Identity Pool</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">④ Identity Pool 找 STS 換臨時 AWS 憑證</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">⑤ App 用臨時憑證直接存取 S3 / DynamoDB</div>
</div>

說明：

1. **登入**：使用者在 App 輸入帳密（或用 Google 登入），**User Pool** 負責驗證。
2. **拿權杖**：驗證成功，User Pool 回傳三個 JWT。此時你已經可以保護自己的 API 了。
3. **交換身分**：若前端還需要直接碰 AWS 服務，就把 **ID token** 交給 **Identity Pool**。
4. **換憑證**：Identity Pool 背後呼叫 <Term en="Security Token Service" desc="AWS 發放臨時安全憑證的服務，憑證有時效，到期自動失效。">STS</Term>，依你設定的 **IAM 角色** 發一組**臨時 AWS 憑證**。
5. **存取**：App 拿這組臨時憑證（有時效）直接呼叫 S3、DynamoDB 等，權限由那個 IAM 角色決定。

:::info[🔑 Identity Pool 怎麼決定給什麼權限？]
Identity Pool 綁定**兩個 IAM 角色**：一個給**已驗證使用者（authenticated）**、一個給**訪客（unauthenticated / guest）**。換到的臨時憑證能做什麼，完全由對應角色的 IAM 政策決定。還能用「**角色對應（role mapping）**」依 User Pool 群組給不同角色，做到細緻授權。
:::

## App 整合流程（開發者實際會怎麼接）

以一個網頁/行動 App 為例，開發者通常這樣接：

1. 在 Cognito 建一個 **User Pool**，設定密碼政策、要不要 MFA、要不要允許 Google 等社群登入。
2. 在 User Pool 底下建一個 **App client**（你的 App 的身分），拿到 **client ID**。
3. 前端用 **Amplify** 函式庫或 **AWS SDK** 串接：呼叫 `signUp`、`confirmSignUp`、`signIn` 等。
4. 登入成功拿到 **JWT**；要保護自己的 API，就在 **API Gateway** 設 **Cognito 授權方**，前端把 token 放在 `Authorization` 標頭送出。
5. 若前端要直接存取 AWS 服務，再建一個 **Identity Pool**，把 User Pool 設為它的身分來源，前端用 ID token 換臨時憑證。

:::tip[💡 開發者常用：代管登入頁（Hosted UI）]
不想自己刻登入畫面？User Pool 內建一個 **Hosted UI（代管登入頁）**，開好就有現成的註冊/登入/社群登入畫面，走標準 **OAuth 2.0 / OIDC** 流程，登入完把權杖透過重新導向交給你的 App。趕時間時超省事。
:::

## 為什麼用 Cognito 而不是自己做驗證？優點／缺點／何時別用

這段是給「知道有 Cognito，但不確定該不該用」的你。

**為什麼是它（解決什麼）**
自己做帳號系統要安全地處理密碼儲存、權杖簽發與驗證、忘記密碼、MFA、社群登入、以及「前端怎麼安全拿到 AWS 存取權」——每一項做錯都會外洩資料。Cognito 把這些**標準化、代管**，而且發的是標準 JWT / OAuth，生態系通吃。

**優點**
- **不用自己存密碼、不用自己簽發權杖**：安全地雷大多由 AWS 扛。
- **內建 MFA、忘記密碼、社群/企業聯合登入（Google、Apple、SAML、OIDC）**，開關即用。
- **和 AWS 深度整合**：API Gateway / ALB 可直接驗 Cognito 權杖；Identity Pool 直接換臨時 AWS 憑證存取 S3/DynamoDB。
- **免費額度大**，中小型 App 常常不用錢。

**缺點／限制**
- **客製化有邊界**：Hosted UI 外觀可調但不是完全自由；特殊登入流程可能要搭 Lambda 觸發器硬凹。
- **學習曲線＋名詞易混**：User Pool vs Identity Pool、三種權杖，新手很容易接錯。
- **綁 AWS**：深度用了之後要搬到別家不容易。
- **某些進階功能（如進階安全防護）另外收費**。

**什麼時候反而別用它**
- 你的團隊**已經有一套成熟的身分系統**（如企業自建 Keycloak / Auth0 已上線），再疊 Cognito 只是徒增複雜。
- 需求**極度客製化**、Cognito 的流程卡住你，第三方 IdP（Auth0、Okta）可能更靈活。
- 只是**單純的機器對機器**、沒有「人類使用者」要登入——那你要的是 IAM 角色 / 服務憑證，不是 Cognito。

## 實務應用：不只是考試

<Scenario title="真實情境：行動 App 要讓使用者登入，並直接上傳照片到 S3">

你在做一個相片 App。需求：使用者註冊/登入（還要支援 Google 登入），登入後**手機端直接把照片上傳到 S3**，每個使用者只能動自己的資料夾。做法：

1. 建一個 **User Pool** 處理註冊/登入，並接上 Google 當聯合身分。
2. 建一個 **Identity Pool**，把 User Pool 設為身分來源。
3. 給 Identity Pool 的「已驗證角色」一條 IAM 政策，只允許存取 `s3://photos-bucket/${cognito-identity.amazonaws.com:sub}/*`（用使用者身分 ID 當資料夾前綴，天然隔離）。
4. App 登入後拿 ID token → 丟給 Identity Pool 換臨時憑證 → 用這組憑證直接 `PutObject` 上傳。

這樣整條路徑沒有任何長期金鑰寫死在 App 裡（絕對不能把 IAM 使用者金鑰塞進手機 App），全程用有時效的臨時憑證。

</Scenario>

### 🛠️ 動手做：用 CLI 建 User Pool → 建 App client → 註冊並登入一個使用者

```bash
# 1) 建立 User Pool，允許用 email 登入，密碼至少 8 碼
aws cognito-idp create-user-pool \
  --pool-name demo-user-pool \
  --auto-verified-attributes email \
  --policies '{"PasswordPolicy":{"MinimumLength":8,"RequireUppercase":true,"RequireNumbers":true}}'
# 預期結果：回傳 JSON，裡面有 "Id": "us-east-1_xxxxxxxxx"（記下這個 UserPoolId）

# 2) 在這個 pool 底下建一個 App client（你的 App 身分）
aws cognito-idp create-user-pool-client \
  --user-pool-id us-east-1_xxxxxxxxx \
  --client-name demo-app-client \
  --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH
# 預期結果：回傳 "ClientId": "xxxxxxxxxxxxxxxxxx"（記下這個 ClientId）

# 3) 註冊一個使用者
aws cognito-idp sign-up \
  --client-id xxxxxxxxxxxxxxxxxx \
  --username alice@example.com \
  --password 'Passw0rd123' \
  --user-attributes Name=email,Value=alice@example.com
# 預期結果：回傳 "UserConfirmed": false（代表還沒驗證 email）

# 4) 開發/測試時，用管理員指令直接把使用者設為已確認（正式環境會走 email 驗證碼）
aws cognito-idp admin-confirm-sign-up \
  --user-pool-id us-east-1_xxxxxxxxx \
  --username alice@example.com
# 預期結果：無錯誤輸出（指令成功即代表確認完成）

# 5) 用帳密登入，換取權杖
aws cognito-idp initiate-auth \
  --client-id xxxxxxxxxxxxxxxxxx \
  --auth-flow USER_PASSWORD_AUTH \
  --auth-parameters USERNAME=alice@example.com,PASSWORD='Passw0rd123'
# 預期結果：回傳 "AuthenticationResult"，裡面有 IdToken、AccessToken、RefreshToken 三個 JWT
```

拿到的 `IdToken` 貼到 [jwt.io](https://jwt.io) 解開，就能看到裡面的 `email`、`sub`（使用者唯一 ID）、`exp`（過期時間）等 claims——這就是你的 App 前端用來「知道登入的是誰」的資訊。

<Cost>

**Cognito User Pool 有每月免費額度**（以每月活躍使用者 MAU 計，額度相當大），中小型 App 常常完全不用錢；**Identity Pool 本身不收費**，你付的是換到臨時憑證後實際用掉的 AWS 服務（如 S3 流量）。要注意的是**進階安全防護（Advanced Security，如偵測盜用登入）另外計費**，不需要時別開。練習完記得把測試用的 User Pool / Identity Pool 清掉。

</Cost>

:::warning[🚑 常踩雷]
- **把 User Pool 和 Identity Pool 搞混**：User Pool＝登入/驗證/發 JWT；Identity Pool＝換臨時 AWS 憑證/授權。看到「發 JWT、保護 API」想 User Pool，看到「換 AWS 憑證、直接存 S3」想 Identity Pool。
- **以為 Identity Pool 負責登入**：它**不做登入**，它只吃「已經驗證過的身分」去換憑證。登入永遠是 User Pool（或外部 IdP）的事。
- **權杖過期沒處理 refresh**：ID/Access token 預設 1 小時就過期，沒用 Refresh token 自動換，使用者就會莫名被登出。前端一定要處理 refresh 流程。
- **把權杖存在不安全的地方**：JWT 存進瀏覽器 `localStorage` 容易被 XSS 偷走。盡量用安全性較高的儲存（如 httpOnly cookie / 平台安全儲存），別隨便塞。
- **把長期 IAM 金鑰寫死進前端 App**：絕對不可以。要讓前端碰 AWS 服務，一律用 **Identity Pool 換臨時憑證**。
- **混淆 ID token 與 Access token**：要知道「登入的是誰」用 **ID token**；要授權 API 存取、檢查 scope 用 **Access token**。
:::

<Refs>

- [Amazon Cognito 開發人員指南](https://docs.aws.amazon.com/cognito/latest/developerguide/what-is-amazon-cognito.html)
- [Cognito User Pools（使用者池）](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools.html)
- [Cognito Identity Pools（身分池 / 聯合身分）](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-identity.html)
- [User Pool 權杖（ID / Access / Refresh）](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-with-identity-providers.html)
- [用 API Gateway 的 Cognito 授權方保護 API](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-integrate-with-cognito.html)

</Refs>

## 下一步

👉 下一篇：[KMS 與加密](./kms-encryption.md)
