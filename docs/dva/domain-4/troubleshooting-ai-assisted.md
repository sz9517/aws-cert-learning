---
sidebar_position: 5
title: 疑難排解與 AI 輔助除錯（C03 新重點）
---

# 疑難排解與 AI 輔助除錯：出事時能快速定位根因，別只看最後一行錯誤

> 本篇用「開發者視角」帶你把 DVA-C03 Domain 4 的除錯功夫練起來：為什麼要能快速找根因、系統化的除錯流程（先看 CloudWatch Logs／Logs Insights → 用 X-Ray service map 找慢／錯的那段 → 對照常見錯誤碼 → IAM 權限除錯）、再到 **C03 全新納入的「AI 輔助除錯」**——用 **Amazon Q Developer** 幫你讀錯誤訊息與堆疊、解釋根因、給修正與效能建議，但**人仍要驗證**。考試很愛問你「這個症狀先查什麼」，這正是本篇最後的固定對照表要幫你內化的。

<Vocab title="📌 先認識這篇會出現的名詞（完全沒碰過也能懂）">

- **根因（Root Cause）**：造成問題的**真正源頭**，不是你最先看到的那個現象。例如「API 回 500」是現象，背後真正的根因可能是「Lambda 的執行角色少了讀 DynamoDB 的權限」。
- **CloudWatch Logs**：AWS 幫你集中收集應用與服務日誌的地方。Lambda、API Gateway 等的 `print`／`console.log` 與平台日誌都會進這裡，按「日誌群組（Log Group）」分類。
- **Logs Insights**：CloudWatch Logs 內建的**查詢引擎**，用一種類 SQL 的查詢語言在大量日誌裡快速撈出「有 ERROR 的那幾筆」「最慢的前 20 筆」，不用自己一頁頁翻。
- **X-Ray**：AWS 的**分散式追蹤**服務。它把一次請求經過的每一段（API Gateway → Lambda → DynamoDB…）串成一條**追蹤（Trace）**，畫成一張 **service map**，讓你一眼看出「哪一段慢、哪一段紅」。
- **區段（Segment／Subsegment）**：X-Ray 把一次請求拆成一段一段的計時，每個下游呼叫（如一次 DynamoDB 查詢）是一個 subsegment，上面標著耗時與有沒有出錯。
- **節流（Throttling）**：你呼叫某個服務太頻繁、超過上限時，服務暫時拒絕你的請求，通常回 **429** 或 `ThrottlingException`。這不是你程式邏輯壞了，是「叫太快」。
- **policy simulator（IAM 政策模擬器）**：不用真的去呼叫 API，就能問 AWS「這個角色對這個動作、這個資源到底准不准」的工具，用來除權限的錯。
- **CloudTrail**：記錄「誰在什麼時候呼叫了哪個 AWS API、結果准還是拒」的稽核日誌。除權限錯時，用它看那個被拒的 API 到底是哪個身分、少了什麼。

</Vocab>

:::note[💬 閱讀小提示]
文章裡只要看到帶<Term desc="像這樣！滑鼠移到有虛線的名詞上（手機點一下），就會跳出白話解釋。">虛線底線的名詞</Term>，把滑鼠移上去就會跳出白話解釋。所有名詞也都整理在 [名詞與服務對照表](/glossary)。
:::

## 為什麼要練除錯？先講一個「盯著錯誤訊息發呆兩小時」的慘劇

假設你的訂單 API 上線後開始零星回 **500**。你打開程式碼看了半天邏輯，覺得「明明沒錯啊」，又重跑了幾次、改了幾行無關的程式，兩小時過去還是好不了。最後同事一句話點醒你：「你看一下 log 裡那筆 `AccessDenied` 啊。」——原來是 Lambda 的執行角色上禮拜被人改動，少了寫 DynamoDB 的權限。這根本不是程式 bug，是**權限問題**，你卻一直在改程式。

除錯的真功夫不是「猜」，而是**系統化地從證據找根因**：先看日誌、看追蹤、對照錯誤碼，讓資料告訴你問題在哪一段、是哪一類。對開發者來說，能不能在十分鐘內定位根因，往往比「程式寫得多漂亮」更決定你半夜被 call 起來後能不能回去睡。DVA-C03 把「疑難排解與最佳化」放到 22% 的權重，考的就是你懂不懂**用對工具、按對順序**去查。

## 系統化除錯流程：按這個順序查，少走冤枉路

<div className="flow">
  <div className="flow-node">CloudWatch Logs／Logs Insights（看錯誤與堆疊）</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">X-Ray service map（找慢／紅的那一段）</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">對照錯誤碼（403／429／5xx／timeout…）</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">IAM 權限除錯（simulator／CloudTrail）</div>
</div>

### 第一步：看 CloudWatch Logs / Logs Insights

出事第一件事是**看日誌**，而且要看到**完整的錯誤堆疊與根因那一行**，不是只看最後一句「Internal Server Error」。Lambda 的 `print`／`console.log` 與例外堆疊都會進對應的**日誌群組**（`/aws/lambda/函式名`）。

日誌量一大，用眼睛翻很痛苦，這時用 <Term en="CloudWatch Logs Insights" desc="CloudWatch Logs 內建的查詢引擎，用類 SQL 語法在大量日誌裡快速撈出符合條件的紀錄。">Logs Insights</Term> 下一句查詢就能把「有 ERROR 的那幾筆」撈出來：

```sql
-- 撈出含 ERROR 或 Exception 的日誌，最新的在前，只看關鍵欄位
fields @timestamp, @message, @requestId
| filter @message like /ERROR|Exception|AccessDenied|Timeout/
| sort @timestamp desc
| limit 50
```

:::tip[💡 考試重點：Logs 能回答「有沒有錯、錯在哪一行」]
Logs / Logs Insights 擅長**定點**問題：某次請求噴了什麼例外、堆疊是什麼、哪一個 `requestId` 失敗。但它不擅長回答「一次請求跨好幾個服務時，到底慢在哪一段」——那是 X-Ray 的強項。兩者**搭配**用：Logs 看內容細節，X-Ray 看跨服務的全貌。
:::

### 第二步：看 X-Ray service map，找慢／錯的那一段

當一次請求會經過好幾個服務（API Gateway → Lambda → DynamoDB → 外部 API），光看單一服務的 log 很難判斷「到底卡在哪」。<Term en="AWS X-Ray" desc="AWS 的分散式追蹤服務，把一次請求經過的每一段串成一條 trace，畫成 service map，看出哪段慢、哪段出錯。">X-Ray</Term> 會把整條路徑畫成一張 **service map**，每個節點（服務）標著平均延遲與錯誤率，**紅色或變大的節點**就是嫌疑犯。

<Analogy title="🏢 生活比喻：X-Ray 像快遞的物流追蹤">

你網購的包裹遲遲沒到，物流追蹤頁會顯示它卡在哪一站：「已到轉運中心 → 卡住 3 天」。你不用打給每一個站點問，一眼就看出是**哪一段**出問題。X-Ray 的 service map 就是你應用請求的物流追蹤——哪一段慢、哪一段退件（出錯），地圖上直接標給你看，不用對每個服務的 log 各查一輪。

</Analogy>

點進某條 trace 還能看到一段段的 **subsegment 計時**：例如「Lambda 本體只花 20ms，但其中呼叫 DynamoDB 那個 subsegment 花了 1.8 秒」——根因瞬間收斂到「DynamoDB 查詢慢」，而不是「我的程式慢」。

### 第三步：常見錯誤碼對照（看到數字先知道是哪一類）

錯誤碼會直接告訴你問題的**大方向**，別把每個錯都當成程式 bug：

| 錯誤碼／訊息 | 多半代表什麼 | 先往哪個方向查 |
| --- | --- | --- |
| **403 AccessDenied** | **權限**不足，不是程式邏輯錯 | 查執行角色的 IAM 政策、用 policy simulator、看 CloudTrail 哪個 API 被拒 |
| **429 TooManyRequests／ThrottlingException** | 被**節流**，叫太快超過上限 | 加**重試＋指數退避**、調高併發／讀寫容量、檢查是不是迴圈狂打 |
| **5xx（500／502／503）** | 伺服器端或下游**掛了／逾時／回傳格式不對** | 看 Lambda log 的例外堆疊、看 X-Ray 哪段紅、檢查回傳是否符合整合格式 |
| **Lambda Task timed out** | 函式**跑超過逾時設定**（最長 15 分鐘） | 看 X-Ray 哪個 subsegment 卡住（常是下游呼叫沒設逾時）、調整逾時或優化慢查詢 |
| **ThrottlingException**（下游如 DynamoDB／Kinesis） | 下游服務容量不足被節流 | 檢查容量模式／RCU-WCU、加退避重試、分散熱鍵 |

:::info[🔑 一個最常混的差異：403 不是「程式壞了」]
看到 **403 / AccessDenied**，九成不是你程式邏輯寫錯，而是**身分少了權限**。拿 403 去改商業邏輯是白費功夫——要去查 IAM。看到 **429**，也不是 bug，是「你叫太快」，解法是退避重試或提高配額，不是改邏輯。先用錯誤碼把問題歸類，能省掉一大半冤枉路。
:::

### 第四步：IAM 權限除錯（policy simulator ＋ CloudTrail）

確定是權限問題（403）後，有兩個利器：

- **policy simulator（IAM 政策模擬器）**：不用真的去呼叫 API，直接問 AWS「**這個角色**對**這個動作**（如 `dynamodb:PutItem`）、**這個資源**到底准不准」。它會告訴你准／拒，拒的話是哪條政策擋的。
- **CloudTrail**：去看**那筆真實被拒的 API 呼叫**——是哪個身分（角色／使用者）、呼叫了哪個 API、`errorCode` 是不是 `AccessDenied`、`errorMessage` 說少了什麼。這是「現場證據」，最準。

```bash
# 用 CLI 模擬：問「這個角色能不能對這張表 PutItem」
aws iam simulate-principal-policy \
  --policy-source-arn arn:aws:iam::111122223333:role/order-lambda-role \
  --action-names dynamodb:PutItem \
  --resource-arns arn:aws:dynamodb:ap-northeast-1:111122223333:table/orders
```

:::tip[💡 考試重點：權限錯的標準查法]
題目描述「函式讀不到某服務、回 AccessDenied」時，標準流程是：**先用 policy simulator 確認角色少了哪個動作的權限 → 再去 CloudTrail 看那筆被拒請求的細節 → 補上執行角色的 IAM 政策**。別把 403 當程式 bug 去 debug 程式碼。
:::

## C03 新重點：AI 輔助除錯（Amazon Q Developer）

這是 **DVA-C03 全新納入**的部分。<Term en="Amazon Q Developer" desc="AWS 的 AI 開發助理，能讀你的錯誤訊息與堆疊、解釋根因、給修正與效能最佳化建議，整合在 IDE 與主控台。">Amazon Q Developer</Term> 是整合在 IDE 與 AWS 主控台裡的 AI 開發助理，在除錯上它能幫你：

- **讀錯誤訊息與堆疊**：把一長串看不懂的例外堆疊或 CloudWatch 錯誤貼給它，它用白話解釋「這在講什麼」。
- **解釋根因**：不只翻譯錯誤，還會推測「為什麼會發生」，例如「這個 `AccessDenied` 是因為執行角色少了 `dynamodb:PutItem`」。
- **給修正建議**：直接提議要加哪條 IAM 政策、哪裡該加重試、哪段查詢該加索引。
- **效能最佳化建議**：指出明顯的低效寫法（如在迴圈裡逐筆呼叫、沒設逾時、冷啟動載入太重）並給改法。

<Scenario title="真實情境：把看不懂的堆疊丟給 Q Developer 先收斂方向">

你的 Lambda 在 CloudWatch 噴了一大段 Python 堆疊，最後一行是 `botocore.exceptions.ClientError: An error occurred (AccessDeniedException)`。你在 IDE 裡選取這段貼給 Amazon Q Developer，問「這是什麼問題、怎麼修」。它回答：「這是 IAM 權限不足，你的執行角色缺少對目標資源的 `dynamodb:PutItem` 權限，建議在角色政策加上該動作並限定到這張表的 ARN。」——你**不照單全收**，而是拿這個方向去 policy simulator ＋ CloudTrail **驗證確實是少了這個權限**，確認後才補政策。AI 幫你把「兩小時盯著堆疊發呆」收斂成「十分鐘有方向再驗證」。

</Scenario>

:::warning[🚑 AI 給的答案一定要驗證]
Amazon Q Developer 很會**加速找方向**，但它可能**猜錯根因**或給出**過寬的權限**（例如建議加 `dynamodb:*` 或 `Resource: *`，違反最小權限）。把 AI 當成「很強的提示」，不是「最終答案」：拿它的結論去 **Logs／X-Ray／policy simulator／CloudTrail 驗證**，確認屬實、且修法符合最小權限，才動手改。盲信 AI 直接套修法，可能把一個小問題變成一個資安漏洞。
:::

## 不同症狀先查什麼、為什麼（固定對照表）

這是本篇最該背起來的一段——**從症狀出發**，知道第一步該開哪個工具、為什麼：

| 症狀 | 先查什麼工具 | 常見根因 |
| --- | --- | --- |
| **函式回 403 / AccessDenied** | policy simulator → CloudTrail | 執行角色少權限；或資源政策沒允許對方呼叫 |
| **偶發 429 / ThrottlingException** | CloudWatch 指標（Throttles）→ 程式呼叫頻率 | 併發／讀寫容量不足；迴圈狂打；沒做退避重試 |
| **API 回 5xx** | CloudWatch Logs（例外堆疊）→ X-Ray | 下游掛了／逾時、回傳格式不符整合、未捕捉的例外 |
| **請求很慢但沒報錯** | X-Ray service map / subsegment 計時 | 某段下游呼叫慢、冷啟動、N+1 查詢、沒加索引 |
| **Lambda Task timed out** | X-Ray 看哪段卡住 → 逾時設定 | 下游呼叫沒設逾時、慢查詢、逾時值設太短 |
| **事件沒觸發函式** | CloudWatch Logs 有沒有被呼叫 → 資源政策 | 資源政策沒允許來源呼叫；觸發器設定錯；事件根本沒進來 |
| **完全沒 log／沒 trace 可查** | 先確認有沒有開 Logs／X-Ray | 根本沒給角色寫 log 的權限、沒啟用 X-Ray tracing |

:::info[🔑 為什麼要「從症狀挑工具」]
除錯最常浪費時間在「拿錯工具查錯方向」：用 Logs 去找跨服務的延遲（該用 X-Ray）、拿 403 去改程式（該查 IAM）。先把症狀對到正確的工具，等於先把搜尋範圍砍掉九成，剩下的才是真正要讀的那幾行證據。
:::

## 🛠️ 動手做：用 Logs Insights 查錯誤 ＋ 用 simulator 驗權限

下面是一段你可以照抄照做的除錯小流程。情境：某個 Lambda 開始回 500，你要找根因。

```bash
# 1) 先用 Logs Insights 在這個函式的日誌群組裡撈錯誤
#    （把 FUNC 換成你的函式名）
aws logs start-query \
  --log-group-name "/aws/lambda/order-processor" \
  --start-time $(date -d '-1 hour' +%s) \
  --end-time $(date +%s) \
  --query-string 'fields @timestamp, @message | filter @message like /ERROR|AccessDenied|Timeout/ | sort @timestamp desc | limit 20'

# 拿上一步回傳的 queryId 去取結果
aws logs get-query-results --query-id <上一步的-queryId>
```

**預期結果**：`get-query-results` 會回一包 JSON，`results` 陣列裡每筆是一次命中的日誌。若根因是權限，你會在 `@message` 看到類似：

```text
[ERROR] ClientError: An error occurred (AccessDeniedException) when calling the PutItem operation:
User: arn:aws:sts::111122223333:assumed-role/order-lambda-role/order-processor is not authorized to
perform: dynamodb:PutItem on resource: arn:aws:dynamodb:ap-northeast-1:111122223333:table/orders
```

看到 **`AccessDeniedException` ＋ `dynamodb:PutItem`** 就知道：這不是程式 bug，是**執行角色少了寫這張表的權限**。接著驗證：

```bash
# 2) 用 policy simulator 確認角色對這個動作/資源到底准不准
aws iam simulate-principal-policy \
  --policy-source-arn arn:aws:iam::111122223333:role/order-lambda-role \
  --action-names dynamodb:PutItem \
  --resource-arns arn:aws:dynamodb:ap-northeast-1:111122223333:table/orders \
  --query 'EvaluationResults[0].EvalDecision'
```

**預期結果**：終端機印出 `"implicitDeny"`（或 `"explicitDeny"`），確認角色**確實沒有**這個權限——與 log 吻合。這時你才有把握去補上**最小範圍**的政策（只加 `dynamodb:PutItem` 且限定到這張表的 ARN），而不是亂開 `*`。改完重跑一次請求，確認 500 消失、simulator 變 `allowed`，根因就解掉了。

:::tip[💡 為什麼先驗證再改]
log 告訴你「現象像是權限問題」，simulator 幫你**用證據確認**是哪個動作、哪個資源被拒。先驗證再改，能避免「以為少 A 權限、其實少 B」而越補越亂；也避免直接套 AI 建議的過寬權限。先重現、先確認、再最小幅度修正，是正式環境除錯的鐵律。
:::

:::warning[🚑 常踩雷]
- **只看錯誤最後一行、沒看根因**：最後一行常只是「Internal Server Error」這種結果，真正的根因（哪個例外、哪個資源被拒）在**堆疊中間或 X-Ray 的某段**。一定要往上翻完整堆疊、看完整個 trace。
- **把 403 當程式 bug**：看到 AccessDenied 就去改商業邏輯，改到天亮也沒用。403 是**權限**問題，要查 IAM／simulator／CloudTrail，不是改程式。
- **盲信 AI 給的修法沒驗證**：Amazon Q Developer 可能猜錯根因或給過寬權限。它的結論要拿去 Logs／X-Ray／simulator **驗證**，且修法要符合最小權限，才能動手。
- **沒開 X-Ray／Logs 根本無從查**：事到臨頭才發現函式沒給寫 log 的權限、沒啟用追蹤，等於沒有黑盒子。**上線前就要**確保角色有寫 CloudWatch Logs 的權限、關鍵服務開好 X-Ray tracing。
- **直接改 production 沒先在 log 重現**：沒先確認「正式環境到底噴什麼」就上去改設定／改程式，很容易「改了個沒關係的地方」還以為修好了。先在 log／trace **重現並定位**，改完再用同樣的查詢確認症狀消失。
:::

<Refs>

- [使用 CloudWatch Logs 監控 Lambda 函式](https://docs.aws.amazon.com/lambda/latest/dg/monitoring-cloudwatchlogs.html)
- [CloudWatch Logs Insights 查詢語法](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CWL_QuerySyntax.html)
- [用 AWS X-Ray 追蹤與除錯](https://docs.aws.amazon.com/xray/latest/devguide/aws-xray.html)
- [用 IAM 政策模擬器測試政策](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_testing-policies.html)
- [用 CloudTrail 排查「被拒的 API 呼叫」](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-event-reference-aws-console-sign-in-events.html)
- [Amazon Q Developer 開發人員指南](https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/what-is.html)

</Refs>

## 下一步

👉 來複習：[Domain 4 核心名詞閃卡](./flashcards.md)
