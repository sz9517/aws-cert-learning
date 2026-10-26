---
sidebar_position: 5
title: 測試與 AI 輔助測試（C03 新重點）
---

# 測試與 AI 輔助測試：上線前把錯抓出來，順便讓 AI 幫你寫測試

> 本篇用「開發者視角」帶你搞懂 DVA-C03 Domain 3 的測試主題：為什麼要測試、測試分哪幾層（單元 vs 整合）、怎麼用 **moto** mock 掉 AWS 服務、怎麼用 **SAM local** 在自己電腦跑 Lambda、怎麼把測試放進 CI，最後是 **C03 全新納入的「AI 輔助測試」**——用 **Amazon Q Developer** 自動產生單元測試、回歸測試、找邊界案例。考試會問你「這個情境該用哪一層測試」「怎麼不花錢又能測到 AWS 互動」，這正是這篇要講清楚的。

<Vocab title="📌 先認識這篇會出現的名詞（完全沒碰過也能懂）">

- **單元測試（Unit Test）**：只測**一小塊程式**（通常是一個函式）的測試。把外部相依（資料庫、網路、AWS）通通擋掉，只驗「這段邏輯本身對不對」。跑得超快、超便宜。
- **整合測試（Integration Test）**：測**好幾塊串起來**對不對，例如「我的 Lambda 真的能寫進 DynamoDB 嗎」。會碰到真實或接近真實的外部服務，比較慢、比較貴。
- **Mock（模擬替身）**：用一個**假的替身**頂替真實的外部服務。程式以為在跟 AWS 講話，其實是在跟你準備好的假物件講話，回傳你指定的假資料。讓單元測試不用真的連 AWS。
- **moto**：Python 生態最常用的**把 AWS 服務整個 mock 掉**的函式庫。它在記憶體裡假裝有一個 S3／DynamoDB／SQS…，你的 boto3 程式照常呼叫，實際上完全沒碰到雲端，不花半毛錢。
- **SAM local**：AWS SAM CLI 的功能，用 Docker 在**你自己電腦**模擬 Lambda 執行環境，讓你在本機就能 `invoke` 函式、起 API，不用每次都部署上雲。
- **CI（持續整合，Continuous Integration）**：每次推程式碼就**自動跑建置與測試**的流水線（如 CodeBuild、GitHub Actions）。測試沒過就擋下來，不讓壞程式進主線。
- **回歸測試（Regression Test）**：確認「**以前會動的功能，改了新東西之後還是會動**」的測試。防止修 A 弄壞 B。
- **邊界案例（Edge Case）**：正常輸入以外的「極端 / 奇怪 / 空 / 超大」輸入，例如空字串、負數、超長清單、null。bug 最愛躲在這裡。

</Vocab>

:::note[💬 閱讀小提示]
文章裡只要看到帶<Term desc="像這樣！滑鼠移到有虛線的名詞上（手機點一下），就會跳出白話解釋。">虛線底線的名詞</Term>，把滑鼠移上去就會跳出白話解釋。所有名詞也都整理在 [名詞與服務對照表](/glossary)。
:::

## 為什麼要測試？先講一個「沒測就上線」的慘劇

假設你寫了一個訂單處理的 Lambda，改了一行折扣計算的程式，覺得「這麼小的改動應該沒差」就直接部署上正式環境。結果那一行讓「折扣碼為空」時算出負數金額，使用者下單變成**你倒貼錢**。等客訴進來才發現，已經賠了一整個下午。

測試就是在**上線前**把這種錯抓出來的機制。你先用程式碼寫好「這個函式餵它 X，應該回 Y」，每次改動都重跑一遍。只要邏輯被改壞，測試馬上變紅，你在自己電腦就看到了，而不是讓使用者幫你 debug。

對開發者來說，測試的價值不只是「找 bug」，更是**讓你敢改程式**：有一整套測試罩著，你重構、升版、改邏輯時才有底氣——改壞了測試會立刻告訴你。DVA-C03 把「測試」獨立成 Domain 3 的一大塊，考的就是你懂不懂**在開發流程中正確地測**。

## 測試層級一：單元測試（測一小塊，擋掉所有外部相依）

單元測試只驗「**這個函式自己的邏輯對不對**」。關鍵是：**把外部的東西（AWS、資料庫、第三方 API）通通 mock 掉**，這樣測試才跑得快、不花錢、不受網路影響，而且失敗時你能確定「是我的邏輯錯，不是 AWS 當機」。

<Analogy title="🏢 生活比喻：單元測試像考駕照的場內考">

場內考（單元測試）在一塊**封閉、可控的場地**裡，三角錐、S 彎都是假的、固定的，專測「你會不會打方向盤」這一項技能。不會有真的路人、真的紅綠燈來干擾——因為那些都被「mock」掉了。等基本功每項都過，才上真實道路（整合測試）。

</Analogy>

```python
# 被測函式：算最終金額，折扣碼為空時不打折
def calc_total(price, discount_code):
    if not discount_code:          # 邊界案例：空字串/None
        return price
    if discount_code == "SAVE10":
        return round(price * 0.9, 2)
    raise ValueError("unknown code")

# 單元測試（pytest）：完全不碰 AWS、不碰網路
def test_no_code_no_discount():
    assert calc_total(100, "") == 100          # 當初出包的那個案例

def test_valid_code():
    assert calc_total(100, "SAVE10") == 90.0

def test_unknown_code_raises():
    import pytest
    with pytest.raises(ValueError):
        calc_total(100, "WRONG")
```

這三個測試在你電腦跑不到一秒、零成本，卻剛好把前面那個「空折扣碼算負數」的慘劇擋住了。

## 測試層級二：mock AWS 服務（moto）

真正的 Lambda 幾乎都要碰 AWS：寫 DynamoDB、讀 S3、丟 SQS。問題來了——**單元測試時不能真的連上去**（慢、要憑證、會產生資料、要花錢）。解法是用 <Term en="moto" desc="Python 最常用的 AWS mock 函式庫，在記憶體裡假裝有 S3/DynamoDB 等服務，boto3 照常呼叫但完全不碰雲端。">moto</Term> 把 AWS 服務整個「假裝」出來。

你的程式照常用 boto3 呼叫 `put_item`、`get_object`，但在測試裡被 moto 攔截，資料存在**記憶體裡的假服務**，測試結束就消失。完全不碰雲端、不花錢、不需要真實憑證。

```python
import boto3
from moto import mock_aws

# 被測函式：把一筆訂單寫進 DynamoDB
def save_order(order_id, amount):
    table = boto3.resource("dynamodb").Table("orders")
    table.put_item(Item={"id": order_id, "amount": amount})

@mock_aws                                  # 這個裝飾器把整個 AWS mock 掉
def test_save_order():
    # 在「假的」DynamoDB 裡先建好資料表
    ddb = boto3.resource("dynamodb", region_name="us-east-1")
    ddb.create_table(
        TableName="orders",
        KeySchema=[{"AttributeName": "id", "KeyType": "HASH"}],
        AttributeDefinitions=[{"AttributeName": "id", "AttributeType": "S"}],
        BillingMode="PAY_PER_REQUEST",
    )

    save_order("A1", 100)                  # 呼叫被測函式（其實寫進假表）

    item = ddb.Table("orders").get_item(Key={"id": "A1"})["Item"]
    assert item["amount"] == 100           # 驗證真的寫進去了
```

:::info[🔑 moto 的重點：它測的是「你的程式有沒有正確呼叫 AWS」]
moto 驗的是「你有沒有用對 API、傳對參數、處理對回傳值」，**不是** AWS 本身對不對（那是 AWS 的事）。它跑在記憶體、沒有網路往返，所以**超快又零成本**，很適合放進每次推程式都跑的單元測試。但它畢竟是**模擬**，跟真實 AWS 的行為（IAM 權限、服務限制、極端邊界）不會 100% 一樣——這也是為什麼還需要整合測試。
:::

## 測試層級三：本地測試（SAM local）

<Term en="AWS SAM CLI" desc="AWS 無伺服器應用模型的命令列工具，能在本機用 Docker 模擬 Lambda 執行環境、起本地 API。">SAM CLI</Term> 可以用 Docker 在**你自己電腦**模擬 Lambda 的執行環境，讓你不必每改一次就部署上雲、等個老半天。常用兩招：

- **`sam local invoke`**：拿一個事件 JSON 餵給你的函式跑一次，直接在終端機看輸出與日誌。很適合快速驗「handler 收到這個事件會怎麼反應」。
- **`sam local start-api`**：在本機 `http://127.0.0.1:3000` 起一個模擬的 API Gateway，你用瀏覽器或 curl 打它，就像在雲端呼叫一樣。

```bash
# 用範例事件在本機跑一次 Lambda（不碰雲端）
sam local invoke OrderFunction --event events/order.json

# 在本機起一個模擬 API，之後用 curl 打 http://127.0.0.1:3000/orders
sam local start-api
```

:::tip[💡 SAM local vs moto 怎麼分？]
- **moto**：在**測試程式碼裡**把 AWS 的 API 回應假裝出來，測的是「你的函式邏輯 + 有沒有正確呼叫 AWS SDK」。單元測試用。
- **SAM local**：在**本機真的跑一個像 Lambda 的執行環境**（Docker），測的是「打包、handler 設定、事件格式、API 路由」這些**部署層面**的東西對不對。比較接近整合測試，但仍在你電腦、不花雲端錢。
:::

## 測試層級四：在 CI 跑測試（讓機器幫你把關）

光自己記得跑測試不夠——人會忘、會偷懶。<Term en="Continuous Integration" desc="每次推送程式碼就自動建置並執行測試的流水線，測試沒過就擋住，不讓壞程式進主線。">CI（持續整合）</Term> 就是把測試綁進流水線：**每次推程式碼，機器自動跑一遍測試，沒過就擋下來**，不讓壞程式合進主線或部署上線。

在 AWS 上最典型的是 **CodeBuild**（可被 CodePipeline 串起來），用一個 `buildspec.yml` 描述「安裝相依 → 跑測試」：

```yaml
# buildspec.yml —— CodeBuild 每次自動跑
version: 0.2
phases:
  install:
    runtime-versions:
      python: 3.12
    commands:
      - pip install -r requirements.txt pytest moto
  build:
    commands:
      - pytest -q        # 任何一個測試失敗，CodeBuild 直接 FAILED，流水線停住
```

:::info[🔑 CI 的核心價值：測試只有「每次都自動跑」才有意義]
一套寫得再漂亮的測試，如果只躺在 repo 裡、沒人跑，等於不存在。CI 的重點是把它變成**部署前的強制關卡**：測試綠燈才准往下走。考試常把「怎麼確保壞程式不會被部署」導向「在 pipeline 的 build/test 階段跑自動化測試」。
:::

## 🤖 C03 新重點：AI 輔助測試（Amazon Q Developer）

這是 **DVA-C03 相對 C02 最大的新增主題**：把 **<Term en="Amazon Q Developer" desc="AWS 的 AI 編碼助理，可在 IDE 內產生程式碼、單元測試、找 bug、解釋程式，並整進開發/CI 流程。">Amazon Q Developer</Term>** 這類 AI 編碼助理放進你的測試流程。考試會問你「AI 可以幫忙做哪些測試工作」「AI 產出的測試要注意什麼」。

AI 輔助測試能幫的幾件事：

| AI 能幫的事 | 具體怎麼用 | 開發者得到什麼 |
| --- | --- | --- |
| **自動產生單元測試** | 選中一個函式，請 Q Developer「幫我為這個函式寫 pytest 單元測試」 | 幾秒鐘生出一批測試骨架，省掉手刻的時間 |
| **找邊界案例** | 請 AI「列出這個函式可能的邊界與例外輸入並寫對應測試」 | 補上你沒想到的空值／負數／超長輸入等案例 |
| **產生回歸測試** | 改完程式後請 AI「針對這次改動補上回歸測試」 | 鎖住既有行為，防止改 A 弄壞 B |
| **在 CI/CD 自動化** | 把 AI 產出的測試納入 `pytest`，由 CodeBuild/pipeline 每次自動跑 | AI 產的測試和手寫的一視同仁，進關卡把關 |

<Analogy title="🏢 生活比喻：AI 輔助測試像一位很勤快的實習生">

Amazon Q Developer 像一位**打字飛快、不喊累的實習生**：你說「幫這個函式寫一批測試、把奇怪的輸入也考慮進去」，他幾秒就交出一疊草稿。但他**不懂你的業務規則**——他不知道「折扣碼為空時絕不能變負數」是你們公司的鐵律。所以草稿交回來，**資深的你一定要逐條檢查**：這個測試有真的驗到重點嗎？斷言寫對了嗎？別把實習生的草稿直接當成品送出。

</Analogy>

:::tip[💡 考試重點：AI 輔助測試怎麼考]
- 看到 **「如何加速撰寫單元測試／找出沒想到的邊界案例／產生回歸測試」** → 聯想 **Amazon Q Developer**（在 IDE 內產生測試）。
- AI 產出的測試一樣要**納入既有測試框架（pytest 等）並進 CI/CD 自動跑**，不是跑一次就算。
- 核心觀念：AI **加速**產出，但**不取代**開發者的判斷——產出的測試一定要**人工審查**是否真的驗到正確行為。
:::

## 🧭 固定段落：為什麼要分測試層級？各自抓什麼？怎麼取捨？

這段把前面所有層級**用白話收斂成一張決策觀**——考試和實務最愛考「這個情境該用哪一層」。

**為什麼要分層（而不是全部用整合測試就好）？**
因為各層的**速度、成本、抓到的錯種類**天差地遠。全用慢又貴的整合測試，你會慢到不想跑、貴到不敢跑，最後乾脆不測。分層是為了「**便宜的多跑、昂貴的精準少跑**」。

**各層各自抓什麼錯：**

| 層級 | 抓什麼錯 | 速度 / 成本 | 碰不碰 AWS |
| --- | --- | --- | --- |
| **單元測試**（+moto） | 單一函式的**邏輯錯**、沒處理到的邊界 | 極快 / 幾乎零 | 不碰（moto 假裝） |
| **本地測試**（SAM local） | **打包、handler 設定、事件格式、API 路由**的錯 | 快 / 零（本機 Docker） | 模擬執行環境 |
| **整合測試**（真實資源） | **權限（IAM）、服務真實行為、串接**的錯 | 慢 / 要花錢、有副作用 | 碰真實 AWS |

**怎麼取捨（業界慣例「測試金字塔」）：**

<div className="flow">
  <div className="flow-node">大量單元測試（快、便宜，天天跑）</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">中量本地/整合測試（關鍵路徑）</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">少量端對端測試（真實環境、最貴）</div>
</div>

底層放**最多**的單元測試（快又便宜，每次推程式都跑），往上逐漸減少整合與端對端測試（慢又貴，只在關鍵路徑與部署前跑）。**AI 輔助測試主要幫你把最底層的單元測試量快速堆起來**，但越往上層、越需要人設計真實情境。

## 🛠️ 動手做：為一個 Lambda 寫單元測試 + mock，並在本機跑 SAM

跟著做一次，你就把「寫測試 → mock AWS → 本機驗證」整條走過。

```bash
# 1) 安裝測試工具
pip install pytest moto boto3

# 2) 假設專案長這樣
#    app/handler.py   ← Lambda 程式
#    tests/test_handler.py  ← 測試
```

```python
# app/handler.py —— 把事件裡的訂單寫進 DynamoDB
import boto3

def lambda_handler(event, context):
    amount = event["amount"]
    if amount < 0:
        raise ValueError("amount must be >= 0")   # 邊界：不准負數
    boto3.resource("dynamodb").Table("orders").put_item(
        Item={"id": event["id"], "amount": amount}
    )
    return {"statusCode": 200, "body": f"saved {event['id']}"}
```

```python
# tests/test_handler.py —— 用 moto mock 掉 DynamoDB
import boto3, pytest
from moto import mock_aws
from app.handler import lambda_handler

@mock_aws
def _setup_table():
    ddb = boto3.resource("dynamodb", region_name="us-east-1")
    ddb.create_table(
        TableName="orders",
        KeySchema=[{"AttributeName": "id", "KeyType": "HASH"}],
        AttributeDefinitions=[{"AttributeName": "id", "AttributeType": "S"}],
        BillingMode="PAY_PER_REQUEST",
    )
    return ddb

@mock_aws
def test_happy_path():
    _setup_table()
    res = lambda_handler({"id": "A1", "amount": 100}, None)
    assert res["statusCode"] == 200

@mock_aws
def test_negative_amount_rejected():    # 邊界案例（AI 常幫你補的那種）
    _setup_table()
    with pytest.raises(ValueError):
        lambda_handler({"id": "A2", "amount": -5}, None)
```

```bash
# 3) 跑測試
pytest -q
```

**預期結果：**

```text
..                                                       [100%]
2 passed in 0.23s
```

看到 **`2 passed`** 就代表：快樂路徑能正確寫入（mock 的）DynamoDB，且負數金額被正確擋下——而且全程**沒碰到真實 AWS、沒花半毛錢、不到一秒**。

```bash
# 4) （選用）在本機用 SAM 真的跑一次 Lambda 執行環境
sam local invoke OrderFunction --event events/order.json
```

**`sam local invoke` 的預期結果**：終端機會印出 Docker 拉起執行環境的日誌，接著是你 handler 回傳的 JSON，例如：

```text
START RequestId: ... Version: $LATEST
END RequestId: ...
{"statusCode": 200, "body": "saved A1"}
```

:::warning[🚑 常踩雷]
- **只測 happy path**：只驗「正常輸入會成功」，不測空值、負數、例外。bug 最愛躲在邊界——前面那個「折扣碼為空算負數」正是沒測邊界的下場。
- **整合測試打到真實資源**：直接對正式 S3／DynamoDB 跑測試會**產生真實資料、花錢、有副作用**（甚至污染正式資料）。單元測試一律用 **moto** 之類 mock；真要整合測試，用**獨立的測試帳號／環境**並事後清理。
- **AI 產的測試沒人檢查**：Amazon Q Developer 產的測試可能**斷言寫得很鬆**（例如只檢查「有回傳」卻沒驗「回傳值對不對」），看起來綠燈其實沒測到重點。AI 產出**一定要人工審查**是否真的驗到正確行為。
- **沒把測試放進 CI，形同沒有**：測試只躺在 repo、靠人記得跑，遲早被略過。一定要綁進 **CodeBuild／pipeline**，當成部署前的強制關卡。
- **測試依賴真實憑證**：測試裡放真實 AWS 金鑰（或假設環境有登入憑證）既不安全、也讓測試在別人電腦／CI 上跑不起來。單元測試用 moto 就**完全不需要憑證**；需要身分時用 CI 角色，別把金鑰寫死進程式或測試。
:::

<Refs>

- [AWS Lambda 測試（單元 / 整合 / 本地）](https://docs.aws.amazon.com/lambda/latest/dg/testing-functions.html)
- [AWS SAM CLI 本地測試（sam local invoke / start-api）](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/using-sam-cli-local.html)
- [Amazon Q Developer 開發人員指南](https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/what-is.html)
- [Amazon Q Developer：產生單元測試](https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/test-generation.html)
- [AWS CodeBuild buildspec 參考](https://docs.aws.amazon.com/codebuild/latest/userguide/build-spec-ref.html)

</Refs>

## 下一步

👉 來複習：[Domain 3 核心名詞閃卡](./flashcards.md)
