---
sidebar_position: 6
title: 實驗 6：無伺服器 API（Lambda + API Gateway + DynamoDB）
---

# 實驗 6：蓋一個無伺服器待辦事項 API（Lambda + API Gateway + DynamoDB）

> 這個實驗把 **DVA（開發人員）** 最核心的三件事串起來做一次：**API Gateway 收 HTTP 請求 → Lambda 跑你的程式 → DynamoDB 存資料**。全程**不碰任何伺服器**、不用管作業系統、不用管擴充——這就是「無伺服器（Serverless）」的手感。做完你會有一個真的能用 `curl` 打的待辦事項 API。全程走免費額度，做完記得清理。

<Vocab title="📌 先認識這篇會出現的名詞（完全沒碰過也能懂）">

- **無伺服器（Serverless）**：你只寫程式、只為「實際執行」付費；底層的機器、作業系統、擴充都由 AWS 代管。不是「沒有伺服器」，而是「你不用管伺服器」。
- **Lambda 函式（Function）**：一段「被事件觸發才跑」的程式。沒人呼叫時不花錢、不佔機器。
- **API Gateway（HTTP API）**：幫你的 Lambda 開一個對外的網址（Endpoint），把外面的 HTTP 請求轉給 Lambda。
- **DynamoDB**：AWS 全代管的 NoSQL 資料庫，用「資料表（Table）＋主鍵（Primary Key）」存資料，天生會自動擴充。
- **執行角色（Execution Role）**：Lambda 跑的時候「扮演」的 IAM 角色，決定這支函式**能碰哪些 AWS 服務**。沒給 DynamoDB 權限，函式就讀不到／寫不到資料表。
- **代理整合（Proxy Integration）**：API Gateway 把「整包請求」原封不動丟給 Lambda，也要求 Lambda 回「特定格式的 JSON」。格式回錯就會 500。

</Vocab>

:::note[💬 閱讀小提示]
看到帶<Term desc="像這樣！滑鼠移到有虛線的名詞上（手機點一下），就會跳出白話解釋。">虛線底線的名詞</Term>，把滑鼠移上去就會跳出白話解釋。所有名詞也整理在 [名詞與服務對照表](/glossary)。
:::

:::info[開始前的前提]
這篇假設你已經有基礎準備：

- 有一個 AWS 帳號，而且已經**設好帳單告警（Billing Alarm）**，花超過門檻會收到通知。
- 知道怎麼在主控台切換**區域（Region）**。建議整篇固定在同一個區域（例如「亞太區域（東京）ap-northeast-1」），比較不會找不到自己開的資源。
- 看得懂一點點 Node.js 或 Python 皆可（本篇用 Node.js 20，程式很短，照抄即可）。

這些是你的安全網，尤其帳單告警，務必先設好。
:::

---

## 情境：做一個「待辦事項（To-Do）」API

我們要做一個很小但五臟俱全的待辦事項後端，對外只開兩個動作：

- `POST /items`：新增一筆待辦事項（丟一段 JSON 進來）。
- `GET /items`：列出目前所有待辦事項。

想像你在幫一個前端 App 寫後端。傳統做法要租一台 EC2、裝 Node、裝資料庫、設定開機自動啟動、半夜還怕它掛掉。無伺服器做法是：**資料放 DynamoDB、邏輯放 Lambda、入口放 API Gateway**，三個都全代管，沒人用就幾乎不花錢，突然爆量也會自己撐住。

### 架構長這樣

<div className="flow">
  <div className="flow-node">使用者 / curl</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">API Gateway（HTTP API）</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Lambda 函式</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">DynamoDB 資料表</div>
</div>

*圖：請求從左邊進來，API Gateway 把它交給 Lambda，Lambda 執行你的程式去讀／寫 DynamoDB，再把結果一路傳回去。整條鏈路沒有任何一台要你自己開關的機器。*

:::info[🤔 為什麼這樣選：三個服務各司其職]
- **為什麼用 Lambda 而不是 EC2？** 這個 API 平常沒什麼流量，用 EC2 要 24 小時開機付費、還要自己管更新與擴充。Lambda **沒人呼叫就不跑、不收費**，爆量時自動多開幾份一起處理，對「流量零散的小後端」最划算。
- **為什麼用 DynamoDB 而不是 RDS？** 待辦事項是很單純的「用 key 查一筆」存取，不需要複雜 JOIN。DynamoDB 全代管、自動擴充、**可以設成「用多少付多少」**，很適合搭配 Lambda；RDS 要先開一台執行個體 24 小時待命，對這種用量反而貴又多餘。
- **為什麼用 API Gateway 的 HTTP API（不是 REST API）？** 同樣能把 Lambda 開成網址，**HTTP API 更便宜、更簡單、延遲更低**，對這種單純代理到 Lambda 的場景綽綽有餘；REST API 的進階功能（用量方案、請求驗證模板等）我們這次用不到。
:::

---

## 動手做：四步把 API 蓋起來

### 步驟一：建一個 DynamoDB 資料表

1. 主控台搜尋列輸入 `DynamoDB` → 進入 DynamoDB → 點**建立資料表（Create table）**。
2. **資料表名稱（Table name）** 填 `todo-items`。
3. **分割索引鍵（Partition key）** 填 `id`，型別選 **字串（String）**。其餘的排序索引鍵不用填。
4. **資料表設定（Table settings）** 選 **自訂設定（Customize settings）**，**容量模式（Capacity mode）** 選 **隨需（On-demand）**。
5. 其他維持**預設** → **建立資料表**。

:::info[🤔 為什麼這樣做：主鍵與「隨需」計費]
- **為什麼要指定分割索引鍵 `id`？** DynamoDB 用主鍵決定「每一筆資料放哪、怎麼找回來」。我們讓每筆待辦事項都有一個唯一的 `id`（等一下在 Lambda 裡自動產生），就能用 `id` 精準存取單筆。
- **為什麼選「隨需（On-demand）」而不是「佈建（Provisioned）」？** 隨需是**用多少付多少**、沒流量幾乎不花錢，不用預先估讀寫容量，最適合「流量零散、不確定」的練習與小專案。佈建模式要你先買固定的讀寫容量，估太少會被限流（throttle）、估太多是浪費——練習階段沒必要承擔這個。

**預期會看到**：資料表清單出現 `todo-items`，**狀態（Status）** 一開始是 `Creating`，幾秒後變成 `Active`。變 `Active` 才代表可以用了。
:::

### 步驟二：建一個 Lambda 函式（含程式碼）

1. 主控台搜尋 `Lambda` → 進入 Lambda → **建立函式（Create function）**。
2. 選 **從頭開始撰寫（Author from scratch）**。
3. **函式名稱（Function name）** 填 `todo-api`。
4. **執行階段（Runtime）** 選 **Node.js 20.x**。
5. 其他維持**預設** → **建立函式**。（這一步 AWS 會順手幫你建一個基本的執行角色，我們下一步再補 DynamoDB 權限。）
6. 建立後，在下方 **程式碼原始碼（Code source）** 區塊把 `index.mjs` 的內容整段換成下面這段，然後按 **部署（Deploy）**：

```javascript
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);
const TABLE = "todo-items";

export const handler = async (event) => {
  const method = event.requestContext?.http?.method;

  try {
    if (method === "POST") {
      // 從請求本文讀出前端傳來的待辦事項內容
      const body = JSON.parse(event.body || "{}");
      const item = {
        id: randomUUID(),
        task: body.task || "（未命名）",
        done: false,
      };
      await ddb.send(new PutCommand({ TableName: TABLE, Item: item }));
      return reply(201, { message: "已新增", item });
    }

    if (method === "GET") {
      // 掃出資料表裡所有待辦事項
      const result = await ddb.send(new ScanCommand({ TableName: TABLE }));
      return reply(200, { items: result.Items || [] });
    }

    return reply(405, { message: "不支援的方法" });
  } catch (err) {
    console.error(err);
    return reply(500, { message: "伺服器錯誤", error: String(err) });
  }
};

// Lambda proxy 整合要求：一定要回這個固定格式，body 必須是「字串」
function reply(statusCode, data) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  };
}
```

:::info[🤔 為什麼這樣做：程式在做什麼、為什麼長這樣]
- **為什麼用 `DynamoDBDocumentClient`（Document Client）？** 它讓你直接用普通的 JavaScript 物件（`{ id, task, done }`）存取 DynamoDB，不用自己手寫 `{ "S": "..." }` 那種型別標註格式，程式乾淨很多。
- **為什麼看 `event.requestContext.http.method` 來分流？** 因為我們用的是 HTTP API 的代理整合，請求方法藏在這個欄位裡。用它判斷是 `GET` 還是 `POST`，一支函式就能處理兩種動作。
- **為什麼回傳要包成 `{ statusCode, headers, body }`、而且 `body` 要 `JSON.stringify`？** 這是 **Lambda proxy 整合的硬性格式**。API Gateway 期待 Lambda 回這個形狀，`body` 必須是**字串**；直接 `return item`（回一個物件）會讓 API Gateway 不知道怎麼翻譯，前端拿到 500。
- **為什麼 `AWS SDK` 不用自己裝？** Node.js 20 的 Lambda 執行階段**內建** AWS SDK v3（`@aws-sdk/*`），所以直接 `import` 就能用，不必打包 `node_modules`。

**預期會看到**：按 **部署（Deploy）** 後，程式碼區塊上方會出現綠色的「成功更新函式 todo-api」提示。此時函式已經有程式，但**還不能碰 DynamoDB**（下一步補權限）。
:::

### 步驟三：給執行角色 DynamoDB 權限

剛剛建函式時，AWS 自動幫 `todo-api` 建了一個**執行角色**，但它預設只有寫 CloudWatch Logs 的權限，**碰不到 DynamoDB**。我們來補上。

1. 在 `todo-api` 函式頁 → **組態（Configuration）** 頁籤 → 左側 **權限（Permissions）**。
2. 點 **執行角色（Execution role）** 底下那個角色名稱（像 `todo-api-role-xxxx`）的連結，會跳到 IAM。
3. 在 IAM 角色頁 → **新增權限（Add permissions） › 建立內嵌政策（Create inline policy）** → 切到 **JSON** 頁籤，貼上下面這段（把 `你的帳號ID` 換成你的 12 碼帳號 ID，區域換成你用的那個）：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "TodoTableAccess",
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:Scan"
      ],
      "Resource": "arn:aws:dynamodb:ap-northeast-1:你的帳號ID:table/todo-items"
    }
  ]
}
```

4. 命名這條政策，例如 `todo-items-rw` → **建立政策（Create policy）**。

:::info[🤔 為什麼這樣做：最小權限的執行角色]
- **為什麼只給 `PutItem` 和 `Scan`？** 因為我們的程式只做這兩件事：`POST` 用 `PutItem` 寫一筆、`GET` 用 `Scan` 讀全部。只給剛好夠用的動作，就是**最小權限**——萬一函式被人塞了惡意輸入，它能對資料庫做的事也被限制住。
- **為什麼 `Resource` 要指定到 `table/todo-items`，不填 `*`？** 這樣這支函式**只碰得到這張資料表**，碰不到你帳號裡其他 DynamoDB 資料表。範圍越窄，出事時的爆炸半徑越小。
- **怎麼找到帳號 ID？** 主控台右上角帳號選單裡就有那串 12 碼數字，或在貼政策時用右下角提示帶出。

**預期會看到**：角色的「權限」清單多出一條內嵌政策 `todo-items-rw`。回到 Lambda 不需要重新部署，權限**即時生效**。
:::

### 步驟四：建 API Gateway（HTTP API）串上 Lambda

1. 主控台搜尋 `API Gateway` → **建立 API（Create API）** → 找到 **HTTP API** → **建置（Build）**。
2. **整合（Integrations）** 選 **Lambda**，區域選對，函式選 `todo-api`。
3. **API 名稱（API name）** 填 `todo-http-api` → 下一步。
4. **設定路由（Configure routes）**：建立兩條路由，都指向 `todo-api` 整合：
   - 方法 `GET`，路徑 `/items`
   - 方法 `POST`，路徑 `/items`
5. **定義階段（Stages）** 維持預設的 `$default`（自動部署）→ 下一步 → **建立（Create）**。
6. 建立完成後，在 API 的 **詳細資訊（Details）** 頁複製 **叫用 URL（Invoke URL）**，像 `https://abc123.execute-api.ap-northeast-1.amazonaws.com`。

:::info[🤔 為什麼這樣做：路由與 $default 階段]
- **為什麼要定義 `/items` 的 GET 與 POST 兩條路由？** HTTP API 用「方法＋路徑」決定哪個請求交給哪個整合。我們把這兩條都指到同一個 `todo-api`，由函式內部用方法分流，所以一支 Lambda 就撐起整個 API。
- **為什麼選 HTTP API 的 Lambda 整合？** 這種整合預設就是 **Lambda proxy 整合**——API Gateway 把整包請求丟給 Lambda、也要求 Lambda 回固定格式（就是步驟二那個 `reply()`），設定最少、最適合入門。
- **`$default` 階段是什麼？** 階段（Stage）是 API 的一個「已部署版本的入口」。HTTP API 的 `$default` 會**自動部署**你的變更，不用每次手動按部署，練習最省事。

**預期會看到**：API 清單出現 `todo-http-api`；詳細頁有一條可複製的 **叫用 URL**；路由頁列著 `GET /items` 與 `POST /items` 兩條，各自掛著 `todo-api`。
:::

---

## 測試：用 curl 打你自己的 API

把下面指令裡的 `你的叫用URL` 換成剛剛複製的那串（結尾不要多斜線）。

```bash
# 1. 先 POST 新增一筆待辦事項
curl -X POST "你的叫用URL/items" \
  -H "Content-Type: application/json" \
  -d '{"task": "寫完無伺服器實驗"}'

# 2. 再 GET 列出所有待辦事項
curl "你的叫用URL/items"
```

:::note[🔍 預期會看到什麼（逐條對照）]
- **第 1 條（POST）** 會回 HTTP `201`，本文類似：

  ```json
  {"message":"已新增","item":{"id":"3f2a...","task":"寫完無伺服器實驗","done":false}}
  ```

  `id` 是程式用 `randomUUID()` 自動產生的，每次都不同。

- **第 2 條（GET）** 會回 HTTP `200`，本文把剛剛那筆（以及之前新增過的）都列出來：

  ```json
  {"items":[{"id":"3f2a...","task":"寫完無伺服器實驗","done":false}]}
  ```

- 想親眼確認資料真的進了資料庫？回 DynamoDB → `todo-items` → **探索資料表項目（Explore table items）**，會看到同一筆資料躺在裡面。
- 想看狀態碼，`curl` 加 `-i` 就會把 `HTTP/2 201`／`HTTP/2 200` 這行印出來。
:::

:::warning[🚑 常踩雷（這幾個新手幾乎都中過）]
- **執行角色缺 DynamoDB 權限 → AccessDenied**：漏做步驟三，或政策寫錯資料表名／區域／帳號 ID。症狀是 `curl` 回 `500`，到 CloudWatch Logs 看會寫 `AccessDeniedException: User ... is not authorized to perform: dynamodb:PutItem`。解法：回步驟三確認那條內嵌政策的 `Action` 與 `Resource` 都對。
- **Lambda proxy 整合回傳格式錯**：函式直接 `return { items }`（回一個普通物件）而不是 `{ statusCode, headers, body }`，或忘了對 `body` 做 `JSON.stringify`。症狀是 `curl` 收到 `500`「Internal Server Error」。務必用步驟二那個 `reply()` 的格式，`body` 一定是**字串**。
- **CORS（瀏覽器打才會中）**：用 `curl` 測不會遇到，但從**網頁前端**（不同網域）呼叫時，瀏覽器會先發 `OPTIONS` 預檢、檢查 CORS 標頭，沒設就被擋。解法：到 HTTP API 的 **CORS** 設定頁，把 **Access-Control-Allow-Origin** 設為你的前端網域（練習可先用 `*`）、允許 `GET, POST, OPTIONS`。
- **資料表計費模式選錯**：把 **容量模式** 留在 **佈建（Provisioned）** 又估太低，測試時可能被限流（`ProvisionedThroughputExceededException`）；估太高則白白付費。練習一律選 **隨需（On-demand）**，沒流量幾乎不花錢。
- **叫用 URL 多了結尾斜線或路徑拼錯**：打成 `.../items/` 或忘了 `/items`，會回 `404 Not Found`。URL 結尾不要多斜線，路徑要和路由設定的 `/items` 完全一致。
- **忘了按「部署（Deploy）」**：在 Lambda 編輯器改完程式沒按 Deploy，打 API 還是跑舊程式。改完一定按 Deploy。
:::

---

## 清理資源，避免被扣款

:::warning[🧹 做完一定要清理！不清理可能持續扣款]
請務必依序把這次開的東西全部清掉：

**1. 刪掉 API Gateway**
- 進 `API Gateway` → 勾選 `todo-http-api` → **刪除（Delete）** → 輸入確認。

**2. 刪掉 Lambda 函式**
- 進 `Lambda` → 勾選 `todo-api` → **動作（Actions） › 刪除（Delete）** → 確認。
- （函式連帶的執行角色可留可刪；想乾淨就到 IAM 把那個 `todo-api-role-xxxx` 一起刪掉，它本身免費。）

**3. 刪掉 DynamoDB 資料表**
- 進 `DynamoDB` → **資料表（Tables）** → 勾選 `todo-items` → **刪除（Delete）** → 依指示確認（可取消勾選建立備份）。
- 刪掉資料表會連同裡面的資料一起清除。
:::

<Cost title="💰 成本提醒">

這篇用到的三個服務都非常省：**Lambda** 有每月百萬次免費叫用、**API Gateway（HTTP API）** 與 **DynamoDB 隨需** 都有免費額度，照步驟做、做完清理，這個練習基本上不會產生費用。真正會中招的是**忘了刪資源**——尤其 DynamoDB 資料表只要存在就可能持續計入儲存量。記住：**資源開了就要記得關。**

</Cost>

---

## 這對考試的意義

DVA（開發人員）反覆在考「無伺服器三件套」怎麼搭、權責怎麼分，請牢牢記住：

- **「要做一個低流量、免管機器的 HTTP API」→ 答案通常是 API Gateway + Lambda + DynamoDB**，而不是「開一台 EC2 自己架」。看到選項強調「不想管伺服器、按用量付費、自動擴充」，往往就是指向這套。
- **Lambda 要存取其他 AWS 服務（DynamoDB、S3…）→ 靠執行角色授權**，不是把金鑰寫進程式或環境變數；題目出現 AccessDenied，第一個要想的就是「執行角色權限不足」。
- **Lambda proxy 整合的回傳一定是 `{ statusCode, headers, body }`、`body` 為字串**，這是考題與實作都愛考的細節。
- **DynamoDB 隨需 vs 佈建**：題目若強調「流量不可預測、不想預估容量」，選隨需；強調「流量穩定、要省長期成本」才考慮佈建。

把直覺練成反射：**無伺服器 API＝API Gateway 收、Lambda 算、DynamoDB 存；服務存服務靠執行角色。**

<Refs title="📚 官方資料與延伸閱讀">

- [使用 Lambda 建置無伺服器 API（教學）](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-dynamo-db.html)
- [API Gateway：HTTP API 與 Lambda 代理整合](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-develop-integrations-lambda.html)
- [Lambda 執行角色（Execution role）](https://docs.aws.amazon.com/lambda/latest/dg/lambda-intro-execution-role.html)
- [DynamoDB：讀寫容量模式（隨需與佈建）](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.ReadWriteCapacityMode.html)
- [在 JavaScript 用 DynamoDB Document Client](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-lib-dynamodb/)

</Refs>

恭喜，你剛剛沒碰任何一台伺服器，就蓋出了一個真的能用的 API。無伺服器的手感，就是這麼輕。
