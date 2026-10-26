---
sidebar_position: 3
title: 錯誤處理與重試
---

# 錯誤處理與重試：雲端一定會出暫時性故障，你的程式要能「撐過去」

> 這篇從**開發者視角**講錯誤處理：為什麼要重試、指數退避加抖動怎麼做、冪等為什麼讓重試變安全、節流錯誤（429／ThrottlingException／ProvisionedThroughputExceeded）怎麼辦、死信佇列 DLQ、部分批次失敗（ReportBatchItemFailures）、斷路器，以及 SDK 內建的重試行為。這是 DVA-C03 Domain 4（疑難排解與最佳化）的超高頻考點。

<Vocab title="📌 先認識這篇會出現的名詞（完全沒碰過也能懂）">

- **暫時性失敗（Transient failure）**：一種「過一下就會好」的錯誤，例如網路抖一下、服務一瞬間忙不過來。不是你的程式壞了，重試一下通常就成功。
- **重試（Retry）**：呼叫失敗後，再送一次同樣的請求，賭它這次會成功。
- **指數退避（Exponential backoff）**：重試不是馬上連打，而是每失敗一次就「等更久再試」——等 1 秒、2 秒、4 秒、8 秒…，讓對方喘口氣。
- **抖動（Jitter）**：在每次等待時間上**加一點隨機**，避免一堆用戶端算出一模一樣的等待時間、同一秒一起重試，又把下游打爆。
- **冪等（Idempotency）**：同一個請求做一次和做很多次，結果完全一樣（不會重複扣款）。這是「重試安全」的前提。
- **節流（Throttling）**：你送太快、超過對方的速率上限，對方就擋你，回一個「太多請求」的錯誤要你慢點。
- **死信佇列（DLQ, Dead-Letter Queue）**：專門收那些一直處理失敗的訊息的獨立佇列，隔離壞訊息、方便事後排查。
- **斷路器（Circuit breaker）**：下游明顯壞了就「先別打了」——暫時停止呼叫，給它時間恢復，別一直撞牆浪費資源。

</Vocab>

:::note[💬 閱讀小提示]
文章裡只要看到帶<Term desc="像這樣！滑鼠移到有虛線的名詞上（手機點一下），就會跳出白話解釋。">虛線底線的名詞</Term>，把滑鼠移上去就會跳出白話解釋。所有名詞也都整理在 [名詞與服務對照表](/glossary)。
:::

## 為什麼需要錯誤處理與重試？先講一個「雲端一定會抖」的事實

在單機時代，你呼叫一個本機函式幾乎不會「中途失敗」。但一上雲端，你的每一次呼叫都要**跨網路**打到別的服務（DynamoDB、S3、SQS、第三方 API…），而網路與分散式系統有個鐵律：**暫時性失敗一定會發生**。封包掉一次、某台主機剛好在重啟、服務瞬間流量太高擋你一下——這些都不是「你寫錯」，而是雲端的常態。

<Scenario title="真實情境：一次性的 500 讓整張訂單白白失敗">

你的下單 API 要寫一筆資料進 DynamoDB。平常都好好的，但某天流量尖峰，DynamoDB 回了一個 `ProvisionedThroughputExceededException`（容量被衝破、暫時擋你）。你的程式沒做重試，直接把錯誤往上丟——使用者看到「下單失敗」，但其實只要**等 200 毫秒再送一次就會成功**。你白白損失了一張訂單，只因為沒撐過那一下的抖動。

</Scenario>

**核心觀念：在雲端寫程式，不是「假設呼叫都會成功」，而是「假設呼叫隨時會暫時失敗，並設計好它失敗時怎麼辦」。** 重試、退避、冪等、DLQ 這些機制，就是讓你的應用在這種常態抖動下**還能穩穩跑**的保命工具。

## 核心一：重試，為什麼不能「失敗就馬上狂重試」

最直覺的重試是「失敗就立刻再送一次」。但這在分散式系統裡是**災難**：下游明明已經忙不過來才擋你，你卻用更快的速度猛打它，等於火上加油，把它徹底打垮——這叫 <Term en="Retry Storm" desc="大量用戶端同時失敗後又同時猛烈重試，流量不減反增，把本來只是暫時過載的下游徹底壓垮。">重試風暴（retry storm）</Term>。

正確做法是**指數退避（exponential backoff）**：每失敗一次就等更久再試。

```text
第 1 次失敗 → 等 1 秒 → 重試
第 2 次失敗 → 等 2 秒 → 重試
第 3 次失敗 → 等 4 秒 → 重試
第 4 次失敗 → 等 8 秒 → 重試（通常設一個上限，例如最多重試 5 次或等最多 20 秒）
```

等待時間 `= base × 2^(重試次數)`，呈指數成長，給下游越來越多喘息時間。

### 為什麼光有退避還不夠：加「抖動（jitter）」

想像同一秒有 1,000 個用戶端一起失敗，它們**用同一套公式算退避**，於是全部都「等 1 秒」→ 1 秒後這 1,000 個又**同時**重試 → 下游再次被瞬間打爆 → 又全部失敗 → 又同時等 2 秒… 這種「大家踩同一個節拍」的現象叫<Term en="Thundering Herd" desc="大量用戶端在同一時刻一起重試，造成週期性的流量尖峰，反覆壓垮下游。">驚群（thundering herd）</Term>。

解法是在退避時間上**加一點隨機（jitter）**，把這 1,000 個用戶端的重試時間**打散**到一段區間內，流量就被攤平了。

```python
import random

base = 0.5      # 基礎等待秒數
cap = 20.0      # 等待上限

def backoff_with_jitter(attempt):
    # Full Jitter：在 0 ~ 指數值之間取隨機，打散重試時間
    exp = min(cap, base * (2 ** attempt))
    return random.uniform(0, exp)
```

:::tip[💡 考試重點：退避 + 抖動一定一起講]
- 看到「重試把下游打垮」「週期性流量尖峰」「驚群」→ 答案是**指數退避 + 抖動（jitter）**，不是「加大重試次數」或「縮短間隔」。
- **退避**讓重試越來越慢、給下游喘息；**抖動**把一群用戶端的重試時間打散、避免同一秒一起撞。兩者缺一不可。
- AWS 官方與多數 SDK 用的是 **Full Jitter / 等值抖動** 這類策略。
:::

## 核心二：冪等（idempotency），為什麼重試才安全

重試有個隱藏風險：**你以為失敗了，其實對方已經做完了**。例如你送出「扣款 100 元」，下游其實成功了，但回應在網路上掉了，你沒收到 → 你以為失敗 → 你重試 → **扣了兩次**。

要讓重試安全，請求必須是<Term en="Idempotency" desc="同一個請求執行一次和執行多次，造成的結果完全相同，不會產生重複的副作用，因此重試是安全的。">冪等</Term>的：**同一個請求不管被處理幾次，結果都跟只做一次一樣。**

做法是帶一個**唯一的冪等鍵（idempotency key）**（例如訂單編號、用戶端自產的 UUID），伺服器端先查「這個鍵我處理過沒」：

- 沒處理過 → 處理、記下這個鍵、回結果。
- 處理過了 → **直接回上次的結果，不再做第二次副作用。**

```python
# 用 DynamoDB 的條件寫入當「冪等鎖」：同一個 idempotency_key 只會成功寫入一次
def charge_once(idempotency_key, amount):
    try:
        table.put_item(
            Item={"pk": idempotency_key, "amount": amount, "status": "DONE"},
            ConditionExpression="attribute_not_exists(pk)",  # 已存在就不覆蓋
        )
        do_real_charge(amount)   # 真正扣款只在第一次發生
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            return  # 這筆之前已處理過，重試直接略過，不重複扣款
        raise
```

:::info[🔑 很多 AWS 服務原生支援冪等參數]
你不一定要自己造輪子：很多 API 直接提供冪等鍵參數，例如 **SQS FIFO 的 `MessageDeduplicationId`**、很多「建立」類 API 的 `ClientToken`／`clientRequestToken`、Lambda Powertools 也有 **Idempotency 工具**（用 DynamoDB 存處理結果）。設計時優先用這些，比自己寫鎖可靠。
:::

## 核心三：節流錯誤（429 / ThrottlingException / ProvisionedThroughputExceeded）怎麼辦

當你送請求的速率超過服務的上限，服務會**節流**你，回一個明確的錯誤要你慢點：

| 常見節流錯誤 | 來自哪 | 白話意思 |
| --- | --- | --- |
| **HTTP 429 `TooManyRequestsException`** | API Gateway、Lambda 同步呼叫 | 你打太快，超過速率／併發上限。 |
| **`ThrottlingException` / `Throttling`** | 多數 AWS 服務的一般節流 | 一樣是請求太快，被限流。 |
| **`ProvisionedThroughputExceededException`** | DynamoDB（佈建容量模式） | 讀寫量超過你佈建的 RCU／WCU。 |

**處理原則很單純：節流錯誤幾乎都是「可重試」的——但一定要搭配退避 + 抖動，把速度降下來。** 如果你收到 429 卻用更快的速度重試，只會被擋得更慘。

- 若是 DynamoDB 一直節流，除了退避，根本解是**改用 On-Demand 容量模式**或**調高佈建容量**、或**均勻分散分割鍵**避免熱鍵。
- 若是 Lambda 同步呼叫被 429，根本解是**提高併發上限**或設 **Reserved Concurrency**，呼叫端同時做退避重試。

:::tip[💡 考試重點：看到這些關鍵字就想到「退避重試」]
- `429` / `TooManyRequestsException` / `ThrottlingException` / `ProvisionedThroughputExceededException` → **都是節流，解法是指數退避 + 抖動重試**；若反覆發生才去動容量／併發設定。
- 千萬別把節流當「程式壞了」去改邏輯——它只是在說「你太快了，慢一點」。
:::

## 核心四：死信佇列（DLQ）—— 收那些「怎麼重試都失敗」的訊息

有些失敗不是暫時的：訊息格式天生就壞、下游永久性拒絕、程式對這筆資料就是會炸。這種訊息**重試幾千次也不會成功**，若放著不管，它會一直佔用重試、卡住整條佇列。

<Term en="Dead-Letter Queue" desc="專門收那些重試多次仍失敗的訊息的獨立佇列，把壞訊息隔離出來，避免無限重試卡住整條線，並方便事後排查。">死信佇列（DLQ）</Term> 就是為此而生：設定「重試幾次還失敗，就把它移到一個獨立的佇列隔離」。

- **SQS**：在來源佇列掛 **redrive policy**，設 `maxReceiveCount`（例如收 5 次還沒刪就移到 DLQ）。
- **Lambda 非同步呼叫**：自動重試 2 次後仍失敗，可送到 **DLQ 或 on-failure destination** 保留失敗事件。

這樣壞訊息被請到一邊，正常訊息繼續流動；你事後再到 DLQ 查原因、修好後可選擇性重新投遞（redrive）。

## 核心五：部分批次失敗（partial batch failure，ReportBatchItemFailures）

當 Lambda 用**事件來源映射**從 SQS／Kinesis／DynamoDB Streams **成批**拉訊息時（例如一次 10 筆），有個經典問題：**批次裡只有 1 筆失敗，整批都算失敗**——於是那 9 筆已經成功的也會**被重試一遍**，造成重複處理。

解法是啟用**部分批次回報**：Lambda 處理完回傳一個 `batchItemFailures` 清單，**只告訴 SQS 哪幾筆失敗**，其餘成功的就不再重送。

```python
# SQS 事件來源映射需在設定開啟 ReportBatchItemFailures
def handler(event, context):
    failures = []
    for record in event["Records"]:
        try:
            process(record)                      # 處理這一筆
        except Exception:
            failures.append({"itemIdentifier": record["messageId"]})  # 只記下失敗的那筆
    return {"batchItemFailures": failures}        # 只有這些會被重試，成功的不重送
```

:::info[🔑 一定要「開設定 + 回傳正確格式」兩件事都做]
光在程式回傳 `batchItemFailures` 還不夠——你必須在事件來源映射的設定裡把 **`ReportBatchItemFailures`** 功能開起來，Lambda 才會理會你回傳的清單。兩件事缺一，整批還是會一起重試。
:::

## 核心六：斷路器（circuit breaker）概念

退避重試是假設「下游很快會好」。但如果下游**整個掛了**（例如第三方 API 大當機），你每個請求都還傻傻地「重試 5 次 + 退避」，只會**浪費大量時間與資源**、把自己的執行緒／Lambda 併發全卡在等逾時上，連帶拖垮自己。

<Term en="Circuit Breaker" desc="一種保護機制：偵測到下游連續失敗就「跳閘」，暫時直接讓請求快速失敗、不再呼叫下游，給它時間恢復，過一段時間再放幾個請求試探是否復原。">斷路器</Term> 借用電路保險絲的概念，有三種狀態：

- **關閉（Closed）**：正常放行，請求照常打到下游。
- **打開（Open）**：偵測到連續失敗超過門檻就「跳閘」——接下來一段時間**直接快速失敗**，根本不去呼叫下游，省掉等逾時的浪費。
- **半開（Half-Open）**：跳閘一陣子後，放**少量**請求去試探；若成功就回到關閉、恢復正常，若又失敗就繼續打開。

重點差別：**重試**是「賭這次會好」，**斷路器**是「下游明顯壞了就先別打、保護自己與下游」。兩者搭配使用：平常用退避重試吸收抖動，真的持續壞掉就靠斷路器止血。

## 核心七：SDK 內建的重試行為（別重複造輪子）

好消息：AWS SDK **預設就幫你做重試 + 指數退避**！你不一定要自己寫退避迴圈。了解它的預設行為是考點：

- SDK 預設會對**可重試錯誤**（節流、連線逾時、5xx 等）**自動重試**並套用退避。
- 新版 SDK 預設用 **`standard`（標準）重試模式**，也可設定成 **`adaptive`（自適應）模式**——`adaptive` 會依偵測到的節流動態調整送出速率（用戶端限流），對重度節流場景更友善，但較激進、需測試。
- 可調的參數主要是**最大重試次數**與**重試模式**。

```python
import boto3
from botocore.config import Config

cfg = Config(
    retries={
        "max_attempts": 5,       # 含第一次，總共最多嘗試 5 次
        "mode": "adaptive",      # standard 或 adaptive（自適應，依節流自動降速）
    }
)
ddb = boto3.client("dynamodb", config=cfg)
# 之後 ddb 遇到節流/暫時性錯誤會自動退避重試，你不用自己寫迴圈
```

:::info[🔑 自動重試不等於「什麼都幫你擋」]
SDK 只對它認得的**可重試錯誤**自動重試。像 `ValidationException`（參數錯）、`AccessDenied`（權限錯）這種**不可重試**的錯誤，SDK 會直接丟給你——重試它們完全沒意義。另外，SDK 的自動重試**不保證冪等**：對有副作用的操作（扣款、建資源），冪等還是得你自己顧。
:::

## 可重試 vs 不可重試：怎麼分、什麼時候退避／進 DLQ／讓它失敗

這是本篇最重要的判斷，也是 DVA 情境題的核心。拿到一個錯誤，先問自己：**「再試一次有機會成功嗎？」**

### 第一步：這個錯誤「可重試」還是「不可重試」？

| | 可重試（Transient，暫時性） | 不可重試（Permanent，永久性） |
| --- | --- | --- |
| **典型錯誤** | 429／ThrottlingException、ProvisionedThroughputExceeded、5xx、連線逾時、`ServiceUnavailable` | 400 參數錯、`ValidationException`、`AccessDenied`／403、`ResourceNotFound`、訊息格式壞掉 |
| **本質** | 「過一下就會好」——下游忙、網路抖 | 「再試一萬次也一樣」——請求本身就錯 |
| **該怎麼辦** | **退避 + 抖動重試**；多試幾次 | **別重試**，立刻失敗或丟 DLQ 人工處理 |

### 第二步：依答案決定策略

- **可重試錯誤 → 退避重試**：加指數退避 + 抖動，給下游喘息，多數會在幾次內成功。
- **不可重試錯誤 → 快速失敗 / 進 DLQ**：重試它只是浪費資源。同步呼叫就**直接回錯給呼叫端**；非同步／佇列場景就**送 DLQ** 隔離，交給人去看。
- **重試到上限仍失敗 → 進 DLQ**：就算是可重試錯誤，也要設**重試上限**，不能無限試。超過上限就當它「暫時好不了」送 DLQ。

:::tip[💡 取捨：不是每個錯誤都該重試，也不是每個失敗都要進 DLQ]
- **把不可重試錯誤拿去重試** = 純浪費，還拖延使用者拿到「其實早就該失敗」的回應。先分類再決定。
- **該讓它失敗就讓它失敗**：同步的使用者請求（如查資料）失敗了，與其讓使用者乾等你重試 30 秒，不如**快速回錯 + 讓前端重試**，體驗更好。
- **DLQ 是「隔離 + 留證據」，不是「垃圾桶」**：進 DLQ 的訊息代表「需要人看一眼」。設好 DLQ 卻沒人監控，等於沒設。
- **同步 vs 非同步的重試責任不同**：同步呼叫（API Gateway → Lambda、SDK `Invoke`）**不會**自動重試，責任在**呼叫端**；非同步與事件來源映射才有平台層的自動重試 + DLQ。
:::

## 實務應用：兩個最常動手做的場景

<Scenario title="真實情境：SDK 一行設定，擋掉尖峰的 DynamoDB 節流">

你的報表服務在每天凌晨批次寫 DynamoDB，偶爾爆 `ProvisionedThroughputExceededException` 害整批掛掉。你不改架構，只把 boto3 的 client 設 `max_attempts=8` + `mode="adaptive"`，SDK 就會在遇到節流時自動退避重試並自我降速。隔天凌晨批次**全數成功**，CloudWatch 上的節流錯誤從幾十筆降到零。

</Scenario>

### 🛠️ 動手做 A：用 SDK 內建重試 + 退避（最省力）

```python
import boto3
from botocore.config import Config

cfg = Config(retries={"max_attempts": 8, "mode": "adaptive"})
ddb = boto3.client("dynamodb", config=cfg)

ddb.put_item(
    TableName="orders",
    Item={"orderId": {"S": "A-1001"}, "amount": {"N": "100"}},
)
print("寫入成功（若途中遇節流，SDK 已自動退避重試）")
```

**預期結果**：即使尖峰時 DynamoDB 回 `ProvisionedThroughputExceededException`，SDK 會自動等待（退避）後重試，最多 8 次；正常情況你會看到印出「寫入成功」，CloudWatch 的 `ThrottledRequests` 指標不會造成你的程式失敗。

### 🛠️ 動手做 B：SQS 批次只回報失敗片段（避免成功的被重處理）

```bash
# 在 Lambda 的 SQS 事件來源映射上開啟部分批次回報
$ aws lambda update-event-source-mapping \
    --uuid <你的-event-source-mapping-uuid> \
    --function-response-types ReportBatchItemFailures
# 預期輸出：回傳的 JSON 裡 "FunctionResponseTypes": ["ReportBatchItemFailures"]
```

搭配前面核心五的 handler（回傳 `batchItemFailures` 清單）。

**預期結果**：一批 10 筆訊息裡若第 3 筆處理失敗，Lambda 回傳 `{"batchItemFailures": [{"itemIdentifier": "<第3筆的messageId>"}]}`，則**只有第 3 筆**會在可見性逾時後重新可見被重試，其餘 9 筆正常刪除、不再重送——避免「一筆壞、十筆重做」。若沒開這個設定，整批 10 筆都會被重試。

<Cost>

本篇講的機制幾乎都**不額外收費**：重試、退避、冪等是你程式裡的邏輯；DLQ 只是一個普通的 SQS 佇列（在免費額度內）；SDK 內建重試不另外計價。要留意的是**重試本身會多送請求**——若是對按用量計費的服務（如 DynamoDB On-Demand、API 呼叫），狂重試會多算錢，所以**退避 + 重試上限**除了保護下游，也保護你的帳單。練習完記得把測試用的佇列／資料表清掉。

</Cost>

:::warning[🚑 常踩雷]
- **無退避狂重試打垮下游**：失敗就立刻連打，等於對已經忙不過來的下游補刀，造成重試風暴。一定要**指數退避 + 抖動**。
- **沒做冪等就重試 → 重複扣款／重複出貨**：你以為失敗其實對方做完了，重試就做第二次。有副作用的操作**務必帶冪等鍵**。
- **把不可重試錯誤也一直重試**：參數錯、權限錯、格式壞重試一萬次也一樣，只是浪費資源又拖延。先分類**可重試 vs 不可重試**再決定。
- **DLQ 設了沒人看**：訊息默默堆進 DLQ 卻沒有告警，等於問題被藏起來。**一定要對 DLQ 的訊息數設 CloudWatch 告警**。
- **同步呼叫以為平台會自動重試**：API Gateway → Lambda、SDK `Invoke` 這種**同步**呼叫，Lambda **不會**自動重試，重試責任在**呼叫端**。只有非同步與事件來源映射才有平台層自動重試。
- **批次沒開 ReportBatchItemFailures**：一筆失敗害整批（含已成功的）全被重試、重複處理。記得**開設定 + 回傳正確格式**兩件事都做。
:::

<Refs>

- [AWS SDK 重試行為與退避（Retry behavior）](https://docs.aws.amazon.com/sdkref/latest/guide/feature-retry-behavior.html)
- [指數退避與抖動（AWS Architecture Blog）](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
- [Lambda 用 ReportBatchItemFailures 做部分批次回報](https://docs.aws.amazon.com/lambda/latest/dg/services-sqs-errorhandling.html)
- [Amazon SQS 死信佇列（DLQ）](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html)
- [DynamoDB 錯誤處理與重試（含節流）](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Programming.Errors.html)

</Refs>

## 下一步

👉 下一篇：[效能與成本最佳化](./performance-optimization.md)
