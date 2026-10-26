---
sidebar_position: 2
title: API Gateway（建立 API）
---

# Amazon API Gateway：幫你把後端變成一道受控的 API 大門

> 身為開發者，你寫好了 Lambda 函式、準備好了後端邏輯，但「外界要怎麼安全地呼叫它」才是真正的挑戰——誰能呼叫？流量爆了怎麼辦？要驗身分嗎？<Term en="Amazon API Gateway" desc="託管的 API 入口服務,負責收 HTTP 請求、驗權、限流、轉送到後端(Lambda、HTTP 服務等),並處理快取、CORS、版本階段。">API Gateway</Term> 就是那道「大門」：請求先到它，由它驗身分、限流、轉送到後端，再把結果包好回給呼叫端。DVA 考試對這個服務的考法非常「開發者」——整合格式、授權器、階段變數、CORS、錯誤碼，全是實作細節。

<Vocab title="📌 先認識的名詞">

- **API（Application Programming Interface）**：讓程式之間互相呼叫的介面，這裡指你對外公開的 HTTP 端點。
- **整合（Integration）**：API Gateway 收到請求後「要轉給誰、怎麼轉」的設定，最常見是轉給 Lambda。
- **階段（Stage）**：同一份 API 的一個已部署版本與執行環境，例如 `dev`、`prod`，各有獨立網址。
- **授權器（Authorizer）**：決定「這個請求有沒有權限進來」的機制，可用 IAM、Cognito 或自訂 Lambda。
- **VTL（Velocity Template Language）**：API Gateway 用來做「請求／回應對應轉換」的樣板語言。

</Vocab>

## 三種 API 怎麼選：REST、HTTP、WebSocket

API Gateway 不是只有一種 API。DVA 很愛考「這個情境該選哪一種」，先把差異記清楚。

| 類型 | 適用情境 | 重點特性 |
| --- | --- | --- |
| **REST API** | 需要完整功能：用量方案、API 金鑰、請求驗證、VTL 對應轉換、WAF、私有端點、快取 | 功能最齊全，但**較貴、延遲略高** |
| **HTTP API** | 單純把請求轉給 Lambda 或 HTTP 後端、要**更便宜更快**、內建 JWT／OIDC 授權 | 成本約為 REST API 的三分之一、延遲更低；**不支援** API 金鑰用量方案、VTL、快取 |
| **WebSocket API** | 需要**雙向即時通訊**：聊天室、即時看板、多人協作、推播 | 連線持續，用 `$connect`／`$disconnect`／自訂路由處理訊息 |

:::tip[💡 考試這樣選]
看到「最低成本、最低延遲、只是代理到 Lambda」→ 選 **HTTP API**。看到「需要 API 金鑰、用量方案、請求／回應轉換、快取或 WAF」→ 選 **REST API**。看到「即時雙向、伺服器要主動推訊息給前端」→ 選 **WebSocket API**。
:::

### 為什麼預設先想 HTTP API，而不是功能最多的 REST API？

直覺上「功能多的比較強」，但實務與考試的預設答案常常是 **HTTP API**。原因很白話：**大多數後端就是「一個 HTTP 請求轉給一個 Lambda」**，根本用不到 VTL、快取、用量方案這些重機具。既然用不到，就沒必要為了它們多付三倍的錢、多吃一點延遲。**先假設 HTTP API 夠用，只有在明確需要 REST 專屬功能時才升級**——這個「由簡入繁」的思路本身就是考點。

| 比較面向 | HTTP API | REST API |
| --- | --- | --- |
| 成本 | 便宜（約 REST 的 1/3） | 貴 |
| 延遲 | 更低 | 略高 |
| 設定複雜度 | 簡單、內建 CORS／JWT | 多、功能選項繁雜 |
| API 金鑰／用量方案 | ❌ 不支援 | ✅ 支援 |
| VTL 映射樣板 | ❌ 不支援 | ✅ 支援 |
| 回應快取 | ❌ 不支援 | ✅ 支援 |
| 私有端點、WAF、請求驗證 | 多數不支援 | ✅ 支援 |

:::info[🔑 什麼時候「反而別用」HTTP API]
需要**對外計量賣 API（API 金鑰＋用量方案）**、要在閘道層做**請求／回應轉換（VTL）**、要**快取**減輕後端、要掛 **WAF** 或 **私有端點**——這些 HTTP API 都辦不到，就得改用 **REST API**。反過來，若只是內部服務單純代理 Lambda，用 REST API 就是「殺雞用牛刀」，白白多花錢。
:::

### 要不要用 API Gateway？還是直接 ALB 或 Lambda 函式網址？

API Gateway 不是唯一能把流量導到後端的東西。DVA 會考你「這個情境到底值不值得擺一道閘道」，白話理解三個選項的分工：

| 選項 | 什麼時候選它 | 好在哪 | 不足 |
| --- | --- | --- | --- |
| **API Gateway** | 要做**真正的 API 管理**：授權器、節流、用量方案、金鑰、快取、請求驗證、多階段 | 一站把驗權／限流／轉換／監控都包辦，不用自己寫 | 多一層服務、多一份費用與延遲 |
| **Application Load Balancer（ALB）** | 後端是**長時間運作的容器／EC2**，要做 L7 路由，且請求量大、單純 | 高併發下**每請求成本低**、支援長連線，適合微服務叢集 | 沒有 API 金鑰、用量方案、原生 JWT 驗權等 API 管理功能 |
| **Lambda 函式網址（Function URL）** | 只要給 Lambda 一個 **HTTPS 端點、最陽春**，內部用或 webhook 接收 | 零額外服務、免費、設定最少 | 沒有授權器（只有 IAM 或 NONE）、沒有節流、沒有自訂網域管理、沒有用量方案 |

:::tip[💡 怎麼快速判斷該不該放 API Gateway]
一句口訣：**「要不要『管理』這個 API？」** 要授權器／金鑰／限流／快取／多階段 → 放 **API Gateway**；只是要給 Lambda 一個 URL 自己用／接 webhook → **Function URL** 就夠；後端是吃重的容器叢集、要 L7 負載平衡 → **ALB**。別為了一個內部小端點硬套 API Gateway，也別想用 ALB 去補 API 金鑰這種它天生沒有的功能。
:::

## 與 Lambda 整合：代理整合最常考

把 API Gateway 接到 Lambda 有兩種做法，DVA 幾乎只圍著**Lambda 代理整合（Lambda proxy integration）**打轉。

<Analogy title="🏢 生活比喻:全權代理 vs 填制式表單">

**代理整合**像請一位全權代理：API Gateway 把整個請求（路徑、查詢字串、標頭、內文）原封不動打包成一份 `event` 交給 Lambda，由你的程式自己拆解、自己決定怎麼回。彈性最大、設定最少。

**非代理整合**則像要求對方「填我這張制式表單」：你得用 VTL 對應樣板，把請求欄位一格一格對應進後端、再把回應對應回來。設定繁瑣但控制最細。開發實務與考試預設都用**代理整合**。

</Analogy>

代理整合下，Lambda 收到的 `event` 大致長這樣（REST API 版本）：

```json
{
  "resource": "/items/{id}",
  "path": "/items/42",
  "httpMethod": "GET",
  "headers": { "Authorization": "Bearer ..." },
  "queryStringParameters": { "verbose": "true" },
  "pathParameters": { "id": "42" },
  "body": null,
  "isBase64Encoded": false
}
```

而 Lambda **必須回傳固定格式**，否則 API Gateway 會回 `502 Bad Gateway`：

```json
{
  "statusCode": 200,
  "headers": { "Content-Type": "application/json" },
  "body": "{\"id\":42,\"name\":\"keyboard\"}",
  "isBase64Encoded": false
}
```

:::warning[🚑 常見錯誤:body 必須是字串]
代理整合回傳的 `body` **一定要是字串**（用 `JSON.stringify` 包過），不能直接丟物件。直接回物件、或少了 `statusCode`，呼叫端就會收到 `502`。這是 DVA 很愛埋的雷。
:::

## 階段與部署：改了要「部署」才生效

這是新手最常卡的概念：在 API Gateway 改了設定**不會自動上線**，你得建立一次**部署（Deployment）**並把它指向某個**階段（Stage）**。

<div className="flow"><div className="flow-node">改設定</div><div className="flow-arrow">→</div><div className="flow-node">建立部署<br/>Deployment</div><div className="flow-arrow">→</div><div className="flow-node">指向階段<br/>dev / prod</div><div className="flow-arrow">→</div><div className="flow-node">產生可呼叫網址</div></div>

- 每個階段有自己的**呼叫網址**，例如 `.../prod` 與 `.../dev`。
- **階段變數（stage variables）**是綁在階段上的鍵值對，像環境變數一樣用。最常見用法是讓同一份 API 的 `dev` 階段呼叫 `myFunc:dev`、`prod` 階段呼叫 `myFunc:prod`（搭配 Lambda 別名），一份 API 服務多環境。

:::info[🔑 一個容易混的差異]
**部署**是「把目前設定快照發布出去」這個動作；**階段**是「這份快照跑在哪個環境、用什麼網址」。改完設定忘了重新部署，是「我明明改了怎麼沒效果」的頭號原因。
:::

## 節流與用量方案：保護後端、控管用量

API Gateway 可以幫後端擋住暴衝流量，也可以對不同用戶分配額度。

- **節流（Throttling）**：用**速率（rate，每秒請求數）**與**暴量（burst，瞬間可累積的請求桶）**兩個參數做限流，可設在帳戶層、階段層、方法層或用量方案層。超過就回 **`429 Too Many Requests`**。
- **用量方案（Usage Plans）＋ API 金鑰（API Keys）**：先發給呼叫端一把 **API 金鑰**，再把金鑰掛到**用量方案**上，方案裡設定「每天最多幾次、每秒幾筆」的配額與節流。常用於把 API 賣給不同等級的客戶（免費版／付費版）。

:::warning[🚑 常見錯誤:API 金鑰不是拿來驗身分的]
API 金鑰只用於**識別呼叫端以套用用量方案與計量**，**不是身分驗證機制**。要驗「你是誰、有沒有權限」請用下面的授權器。另外，**用量方案／API 金鑰只有 REST API 支援**，HTTP API 沒有。
:::

## 授權：三種把關方式

「誰能呼叫這個 API」是 DVA Domain 2（安全）與 Domain 1 交界的高頻考點。三種授權方式各有適用場景。

| 授權方式 | 怎麼運作 | 什麼時候用 |
| --- | --- | --- |
| **IAM 授權** | 呼叫端用 <Term en="Signature Version 4" desc="AWS 用 IAM 憑證對請求簽名的標準,證明請求來自某個 IAM 身分且未被竄改。">SigV4</Term> 簽名請求，API Gateway 驗 IAM 政策 | 呼叫端是**其他 AWS 服務、內部系統、或有 IAM 身分的應用** |
| **Cognito 授權器** | 呼叫端先在 <Term en="Amazon Cognito" desc="託管的使用者註冊/登入與身分服務,登入後發放 JWT 權杖。">Cognito</Term> 使用者池登入，拿 JWT 權杖，API Gateway 自動驗權杖 | **面向終端使用者**的 App（網頁／手機）要登入驗證 |
| **Lambda 授權器（自訂授權）** | 你寫一個 Lambda 檢查權杖或請求，回傳一份 IAM 政策決定放行或拒絕 | 要用**第三方／自家的驗證邏輯**（如自訂 JWT、OAuth、合作夥伴權杖） |

<Scenario title="真實情境:手機 App 登入後呼叫 API">

你的待辦 App 讓使用者用 email 註冊登入。做法：使用者在 **Cognito 使用者池**登入後拿到 JWT，App 每次呼叫 API 時把 JWT 放在 `Authorization` 標頭。API Gateway 掛上 **Cognito 授權器**後，會自動驗證權杖的簽章與有效期，通過才放行進 Lambda——你完全不用自己寫驗 token 的程式。

如果驗證邏輯是公司自家那套（例如和合作夥伴共用的自訂權杖），就改用 **Lambda 授權器**：由你的 Lambda 解析權杖、回傳允許或拒絕的 IAM 政策。Lambda 授權器的結果還可以**快取**（用 TTL），避免每次請求都重跑驗證。

</Scenario>

#### 三種授權器的優缺點取捨

挑授權器不是「哪個最強」，而是「**你的呼叫端是誰、驗證邏輯在誰手上**」。各有代價：

- **IAM 授權**
  - 優點：不用自己寫任何驗證程式；天然整合 AWS 權限模型，適合服務對服務。
  - 缺點：呼叫端**必須有 AWS 憑證並會 SigV4 簽名**，一般終端使用者（瀏覽器／手機）做不到，所以**不適合面向消費者的登入**。
- **Cognito 授權器**
  - 優點：使用者註冊／登入／JWT 驗證全託管，閘道自動驗權杖，**開發者零驗證程式碼**。
  - 缺點：身分來源被綁在 Cognito；若公司已有自家 IdP 或自訂權杖格式，不一定塞得進來。
- **Lambda 授權器**
  - 優點：**最彈性**，任何自訂邏輯（自家 JWT、OAuth、合作夥伴權杖、查資料庫）都能寫；結果可快取省開銷。
  - 缺點：**要自己寫、自己維護、自己承擔它的冷啟動與錯誤**；寫錯政策格式會整個 API 放行或全擋。能用 Cognito／IAM 就別硬寫 Lambda 授權器。

## CORS：開發最常踩的雷

<Term en="Cross-Origin Resource Sharing" desc="瀏覽器的安全機制:網頁 JS 要呼叫「不同來源(網域/埠/協定)」的 API 時,API 必須回傳允許的標頭,否則瀏覽器會擋下回應。">CORS</Term>（跨來源資源共用）幾乎是每個前端開發者都會中招的坑。當你的網頁（例如 `https://app.example.com`）用 JavaScript 去呼叫不同網域的 API，**瀏覽器**會先送一個 `OPTIONS` **預檢請求（preflight）**，API 必須回傳正確的 CORS 標頭，瀏覽器才肯放行真正的請求。

- 要回的關鍵標頭：`Access-Control-Allow-Origin`、`Access-Control-Allow-Methods`、`Access-Control-Allow-Headers`。
- **REST API**：要為資源啟用 CORS，它會幫你建一個 `OPTIONS` 方法回預檢；但用**代理整合**時，實際請求的回應標頭**得由你的 Lambda 自己加**。
- **HTTP API**：直接在 API 設定裡宣告 CORS 設定即可，較省事。

:::warning[🚑 常見錯誤:CORS 是瀏覽器端的事]
用 Postman 或 `curl` 測明明正常，一放到網頁就「被 CORS 擋」——因為 **CORS 只有瀏覽器會強制執行**。看到瀏覽器主控台報 CORS 錯誤，先檢查：(1) 有沒有處理 `OPTIONS` 預檢、(2) 代理整合的 Lambda 回應**有沒有自己帶上** `Access-Control-Allow-Origin` 標頭。
:::

### 對應請求／回應與 VTL（映射樣板）

在**非代理整合**時，API Gateway 用 **VTL 映射樣板（mapping template）**把「進來的請求」改寫成後端要的格式、再把「後端的回應」改寫成要回給呼叫端的格式。例如把查詢字串搬進 JSON body、或只挑後端回應的某幾個欄位回傳。代理整合通常不需要它（原封轉送），但考試會考「要在 API Gateway 層做請求／回應轉換時用什麼」→ 答 **VTL 映射樣板**。

## API 快取與常見錯誤碼

- **快取（只有 REST API 有）**：在階段層開啟快取後，相同請求會直接回傳快取結果，**減輕後端負載、降低延遲**，可設 TTL 與快取鍵；呼叫端可用 `Cache-Control` 標頭要求跳過快取。
- 常見錯誤碼速記：

| 錯誤碼 | 意思 | 常見原因 |
| --- | --- | --- |
| **429** | Too Many Requests | 觸發節流或用量方案配額用盡 |
| **502** | Bad Gateway | 代理整合的 Lambda **回傳格式錯誤**（body 不是字串、少了 statusCode） |
| **503** | Service Unavailable | 後端無法連線／暫時不可用 |
| **504** | Integration Timeout | 後端處理超過 API Gateway 的整合逾時（REST API 預設上限 29 秒） |

:::info[🔑 區分 4xx 與 5xx]
**4xx 是呼叫端的問題**（請求不對、沒權限、超量）；**5xx 是後端或整合的問題**（Lambda 回錯格式、逾時、服務掛了）。除錯時先看是 4 開頭還是 5 開頭，就知道該往請求端查還是往後端查。
:::

## 動手:用 CLI 建立並部署一個 HTTP API

下面用 AWS CLI 建一個最小的 HTTP API，代理到既有的 Lambda，並部署到預設階段：

```bash
# 1. 建立 HTTP API,直接指定要代理的 Lambda(自動建立整合與預設路由)
aws apigatewayv2 create-api \
  --name todo-api \
  --protocol-type HTTP \
  --target arn:aws:lambda:ap-northeast-1:123456789012:function:todoHandler

# 2. 允許 API Gateway 呼叫這個 Lambda(加上資源政策)
aws lambda add-permission \
  --function-name todoHandler \
  --statement-id apigw-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com

# 3. 查出可呼叫的網址(ApiEndpoint)後直接測試
curl https://<api-id>.execute-api.ap-northeast-1.amazonaws.com/
```

:::info[🔑 預期會看到什麼結果]
- 第 1 步成功後，`create-api` 會回一段 JSON，裡面的 **`ApiEndpoint`** 就是你的可呼叫網址（形如 `https://abcd1234.execute-api.ap-northeast-1.amazonaws.com`）。
- **若跳過第 2 步（沒加 add-permission）**，第 3 步 `curl` 會收到 **`{"message":"Internal Server Error"}`** 且狀態碼 500——因為 API Gateway 沒有權限呼叫你的 Lambda。這正是新手最常卡住的地方，補上 `add-permission` 再試就會通。
- 權限都對後，`curl` 會回傳**你 Lambda 回應裡 `body` 的內容**（記得代理整合的 `body` 要是字串）。
:::

REST API 則要多一步「建立部署並指向階段」才會生效：

```bash
aws apigateway create-deployment \
  --rest-api-id abc123 \
  --stage-name prod
```

:::warning[🚑 常踩雷：忘了重新部署，改了等於沒改]
REST API **只要改過方法、整合、授權器或 CORS，就必須再跑一次 `create-deployment`**，不然線上跑的還是舊設定。症狀是「我主控台明明存檔了，呼叫卻沒變」。另外，代理整合最愛踩的三連雷：**(1) `body` 忘了 `JSON.stringify` 導致 502；(2) 瀏覽器端沒自己回 `Access-Control-Allow-Origin` 導致 CORS 被擋；(3) 以為加了 API 金鑰就等於驗了身分（它只做計量，不是身分驗證）。** 這三個幾乎是 DVA 必埋的坑。
:::

<Cost>

- **REST API** 依「每百萬次請求」計費，且比 HTTP API 貴約三倍；開啟**快取**要另外按快取容量（GB／小時）付費。
- **HTTP API** 每百萬次請求便宜很多，單純代理 Lambda 的場景優先選它省成本。
- **節流與用量方案**不是為了省自己的錢，而是**保護後端**（例如避免 Lambda 併發爆量或 DynamoDB 被打爆）並對客戶計量。

</Cost>

:::tip[💡 DVA 重點整理]
- 代理整合 Lambda **回傳格式固定**（`statusCode` + 字串 `body`），回錯 → `502`。
- 改完設定要**建立部署指向階段**才生效；**階段變數**搭 Lambda 別名做多環境。
- **API 金鑰 ≠ 身分驗證**，只做用量方案計量；驗身分用 IAM／Cognito／Lambda 授權器。
- **CORS 只有瀏覽器會管**，代理整合要自己在 Lambda 回應加 CORS 標頭。
- 省錢又低延遲選 **HTTP API**；要金鑰／用量方案／快取／VTL 選 **REST API**。
:::

<Refs>

- [Amazon API Gateway 開發人員指南](https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html)
- [設定 Lambda 代理整合（REST API）](https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html)
- [使用 API 金鑰的用量方案](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-api-usage-plans.html)
- [為 REST API 啟用 CORS](https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-cors.html)

</Refs>

👉 下一篇：[DynamoDB 開發者重點](./dynamodb.md)
