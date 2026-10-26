---
sidebar_position: 2
title: 基礎設施即程式碼（CloudFormation / SAM / CDK）
---

# 基礎設施即程式碼（IaC）：用程式碼管雲端資源，想重建就重建

> 本篇用「開發者視角」帶你搞懂 IaC 三件套：**CloudFormation**（AWS 原生範本、堆疊、變更集）、**SAM**（無伺服器專用、簡化語法、`sam build`/`deploy`）、**CDK**（用熟悉的程式語言寫、合成成 CloudFormation）。重點放在三者**怎麼選**、動手跑一個會 `CREATE_COMPLETE` 的範本，以及更新／刪除堆疊時最常炸的雷。這些是 DVA-C03 Domain 3（測試與部署）的核心。

<Vocab title="📌 先認識這篇會出現的名詞（完全沒碰過也能懂）">

- **基礎設施即程式碼（Infrastructure as Code, IaC）**：把「要開哪些雲端資源（S3 貯體、Lambda、DynamoDB…）」寫成**文字檔**，交給工具自動建立，而不是用滑鼠一個一個點主控台。
- **範本（Template）**：一份描述「我要哪些資源、長什麼樣子」的設定檔（YAML 或 JSON）。它是**藍圖**，本身不是資源。
- **堆疊（Stack）**：AWS 依照一份範本實際建立出來的**一整組資源**，被當成**一個單位**管理——一起建、一起更新、一起刪。
- **變更集（Change Set）**：套用更新前，先產生一份「這次會新增／修改／刪除哪些資源」的**預覽清單**，你看過沒問題再按下去執行。
- **合成（Synthesize）**：CDK 專有詞。你用程式語言寫好邏輯後，CDK 幫你**產生**出等價的 CloudFormation 範本，這個過程叫合成（`cdk synth`）。
- **漂移（Drift）**：堆疊建好後，有人跑去主控台**手動改了**其中某個資源，導致「實際狀態」和「範本寫的」對不上，這個偏差就叫漂移。

</Vocab>

:::note[💬 閱讀小提示]
文章裡只要看到帶<Term desc="像這樣！滑鼠移到有虛線的名詞上（手機點一下），就會跳出白話解釋。">虛線底線的名詞</Term>，把滑鼠移上去就會跳出白話解釋。所有名詞也都整理在 [名詞與服務對照表](/glossary)。
:::

## 為什麼需要 IaC？先講一個「手動點主控台的惡夢」

假設你在主控台手動開好了一套環境：一個 DynamoDB 資料表、三個 Lambda、一個 API Gateway、幾條 IAM 權限。花了一下午、點了上百次滑鼠，終於跑起來了。

接著惡夢開始：

- **老闆要你再開一套一模一樣的測試環境。** 你還記得每個欄位當時填了什麼嗎？讀寫容量？環境變數？哪條政策掛在哪？多半**記不全**，於是兩套環境**長得不一樣**，正式環境好好的、測試環境卻怪怪的，查半天查不出。
- **同事問你「這套環境到底有哪些資源」。** 你只能一頁一頁翻主控台數給他看。
- **要砍掉這套環境。** 你得記得哪些資源是這套的、一個一個刪，漏刪一個就**繼續偷偷收你錢**。

用 <Term en="Infrastructure as Code" desc="把要開的雲端資源寫成文字範本，交給工具自動建立、更新、刪除，可版本控管、可重複重建。">IaC</Term> 這些全解決：整套環境寫成一份範本 → 存進 Git（可看歷史、可 code review）→ 一行指令建起整套、一行指令整套砍光。要再開一套？同一份範本換個名字跑一次，**保證長得一模一樣**。對開發者來說，基礎設施從「一次性手工藝品」變成「可版本控管、可重現的程式碼」。

<Analogy title="🏢 生活比喻：IaC 就像食譜，手動點主控台像憑記憶炒菜">

- **手動點主控台 = 憑記憶炒菜**：這次好吃，下次想重現卻忘了放多少鹽，每次味道都不一樣。
- **範本（Template）= 寫好的食譜**：份量、步驟白紙黑字，誰照著做、做幾次都一樣。
- **堆疊（Stack）= 照食譜做出的一整桌菜**：一起上、一起收。
- **變更集（Change Set）= 改食譜前先貼出「這次會多加辣、少放糖」的告示**：大家看過確認，才真的動鍋。

</Analogy>

## CloudFormation：AWS 原生的 IaC 引擎

<Term en="AWS CloudFormation" desc="AWS 原生的基礎設施即程式碼服務，用 YAML/JSON 範本描述資源，以堆疊為單位建立、更新、刪除。">CloudFormation（CFN）</Term> 是底層那台**實際幹活的引擎**——SAM 與 CDK 最後都是轉成 CloudFormation 來執行。你寫一份範本，CloudFormation 負責照著把資源一個個開出來、記住它們屬於哪個堆疊、並處理相依順序（例如先建 IAM 角色，Lambda 才能引用它）。

### 範本的骨架：Resources / Parameters / Outputs

一份 CloudFormation 範本主要由這幾個區塊組成，DVA 最愛考前三個：

| 區塊 | 作用 | 白話 |
| --- | --- | --- |
| **Resources**（必填） | 宣告「我要哪些資源」 | 整份範本**唯一必填**的區塊。沒有 Resources 就沒有東西可建。 |
| **Parameters** | 宣告「建堆疊時可以傳進來的參數」 | 讓同一份範本重複用：環境名、資料表容量、AMI ID 等開堆疊時再填，不用寫死。 |
| **Outputs** | 宣告「建完後要回報哪些值」 | 例如建好的 S3 貯體名稱、API 的網址。方便你拿去用，也可被別的堆疊**跨堆疊引用**。 |
| **Mappings** | 靜態對照表（如各區域對應的 AMI） | 依區域／環境查表取值。 |
| **Conditions** | 條件式建立資源 | 例如「只有 prod 環境才建這個資源」。 |

```yaml
# template.yaml — 一個最小可跑的 CloudFormation 範本
AWSTemplateFormatVersion: '2010-09-09'
Description: 建立一個 S3 貯體，貯體名由參數帶入

Parameters:
  BucketName:                      # 建堆疊時傳進來，不寫死
    Type: String
    Description: 要建立的 S3 貯體名稱

Resources:
  MyBucket:                        # 邏輯 ID（範本內自己取的代號）
    Type: AWS::S3::Bucket          # 資源類型
    Properties:
      BucketName: !Ref BucketName  # !Ref 取用上面的參數值

Outputs:
  BucketArn:                       # 建完回報貯體的 ARN
    Description: 建立好的貯體 ARN
    Value: !GetAtt MyBucket.Arn
```

### 堆疊（Stack）：一整組資源當一個單位管

你把範本交給 CloudFormation 建立，產出的就是一個**堆疊**。堆疊把那一整組資源綁成一個單位：

- **建立**：`create-stack` → 狀態從 `CREATE_IN_PROGRESS` 走到 **`CREATE_COMPLETE`**。
- **更新**：改範本後 `update-stack`，CloudFormation 自動算出差異、只動有變的資源。
- **刪除**：`delete-stack` → **預設會把這個堆疊建的資源全部刪掉**（這點很重要，見踩雷）。
- **失敗回滾**：建立／更新中途出錯，CloudFormation 預設會**自動 rollback** 回上一個正常狀態，避免留下半套壞掉的資源。

### 變更集（Change Set）：更新前先看「會動到什麼」

直接 `update-stack` 有風險——你可能沒意識到某個小改動會**害資源被整個重建**（例如改 DynamoDB 的某些屬性會觸發「替換」，等於砍掉重建、資料可能沒了）。<Term en="Change Set" desc="CloudFormation 更新前先產生的變更預覽，列出每個資源會被新增、修改或替換，確認後才執行。">變更集</Term> 就是保險：

1. 用新範本 `create-change-set` → CloudFormation 算出「這次會對每個資源做什麼」。
2. 你 `describe-change-set` **檢視清單**，特別看有沒有 `Replacement: True`（會被砍掉重建的資源）。
3. 確認沒問題再 `execute-change-set` 真的套用。

## SAM：無伺服器專用的「簡化版 CloudFormation」

<Term en="AWS Serverless Application Model" desc="CloudFormation 的無伺服器擴充，用更精簡的語法定義 Lambda/API Gateway/DynamoDB，部署時展開成完整 CloudFormation。">SAM（AWS Serverless Application Model）</Term> 不是另一套引擎，而是 **CloudFormation 的無伺服器擴充**。它看到你範本第一行寫了 `Transform: AWS::Serverless-2016-10-09`，就會在部署時把 SAM 的精簡寫法**自動展開**成一大段完整的 CloudFormation。

重點是**少寫很多字**。純 CloudFormation 寫一個「有 API 觸發、有環境變數、有權限」的 Lambda，動輒上百行；SAM 用 `AWS::Serverless::Function` 一個資源就搞定，連 API Gateway、IAM 角色都幫你補齊。

```yaml
# template.yaml（SAM）— 一個 HTTP 觸發的 Lambda
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-09     # ← 這行讓它變成 SAM 範本
Description: 一個由 API 觸發的 Hello Lambda

Resources:
  HelloFunction:
    Type: AWS::Serverless::Function        # SAM 專用的精簡資源類型
    Properties:
      CodeUri: ./src/                      # 程式碼位置
      Handler: app.lambda_handler
      Runtime: python3.12
      MemorySize: 256
      Timeout: 10
      Environment:
        Variables:
          STAGE: dev
      Events:                              # 一個 Events 區塊就自動建好 API Gateway
        Api:
          Type: Api
          Properties:
            Path: /hello
            Method: get

Outputs:
  ApiUrl:
    Description: 呼叫這個網址測試
    Value: !Sub 'https://${ServerlessRestApi}.execute-api.${AWS::Region}.amazonaws.com/Prod/hello'
```

SAM 還附一組 CLI 讓本機開發更順：

- **`sam build`**：安裝相依、把程式碼與範本整理成可部署的產物（放在 `.aws-sam/`）。
- **`sam deploy`**：把建好的東西上傳並**實際以 CloudFormation 堆疊部署**。第一次用 `sam deploy --guided` 會問你堆疊名、區域等，存進 `samconfig.toml`，之後直接 `sam deploy` 即可。
- **`sam local invoke` / `sam local start-api`**：用 Docker 在**本機模擬** Lambda 與 API，不用每次都上雲測。

## CDK：用你熟的程式語言寫基礎設施

<Term en="AWS Cloud Development Kit" desc="用 TypeScript/Python/Java 等通用程式語言定義雲端資源，再合成（synth）成 CloudFormation 範本部署。">CDK（Cloud Development Kit）</Term> 把 IaC 帶進你熟悉的世界：不寫 YAML，直接用 **TypeScript / Python / Java / C# / Go** 寫。你用迴圈、函式、條件判斷、物件封裝去組裝資源，CDK 再把它**合成（synth）**成一份標準的 CloudFormation 範本交給 AWS 執行。所以 CDK 底層跑的**還是 CloudFormation**。

對寫慣程式的開發者，CDK 的爽點是：能用 IDE 自動完成、能抽共用元件（把「一個標準的 API + Lambda + 資料表」包成一個可重用的 Construct）、能寫邏輯避免複製貼上大段 YAML。

```python
# app.py（CDK，Python）— 一個 S3 貯體 + 一個 Lambda
from aws_cdk import App, Stack, CfnOutput
from aws_cdk import aws_s3 as s3
from aws_cdk import aws_lambda as _lambda
from constructs import Construct

class MyStack(Stack):
    def __init__(self, scope: Construct, id: str, **kwargs):
        super().__init__(scope, id, **kwargs)

        bucket = s3.Bucket(self, "MyBucket")   # 一行就是一個 S3 貯體

        fn = _lambda.Function(
            self, "HelloFn",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="app.handler",
            code=_lambda.Code.from_asset("src"),
            environment={"BUCKET": bucket.bucket_name},
        )
        bucket.grant_read(fn)                    # 一行自動補好 IAM 讀取權限

        CfnOutput(self, "BucketName", value=bucket.bucket_name)

app = App()
MyStack(app, "MyStack")
app.synth()                                      # 合成成 CloudFormation 範本
```

CDK 的常用指令：`cdk synth`（合成成 CFN 範本看一眼）、`cdk diff`（跟雲上現況比差異，類似變更集）、`cdk deploy`（部署，底層就是建 CloudFormation 堆疊）、`cdk destroy`（刪堆疊）。

## 三者怎麼選：為什麼用它、優點、缺點、何時用哪個

這是本篇最重要的固定段落。三者**底層都是 CloudFormation**，差別在「你用什麼方式描述資源」。

### CloudFormation

- **為什麼用它**：AWS 原生、不需要額外安裝語言環境，所有 AWS 資源第一時間都支援。它是最「貼近底層」的那層，SAM／CDK 最後都轉成它。
- **優點**：覆蓋最完整、最穩定；純設定檔（YAML/JSON）不含程式邏輯，審查單純；跨團隊通用。
- **缺點**：**冗長**，複雜架構動輒上千行；沒有迴圈／抽象，重複的東西只能複製貼上；純 YAML 不好做條件與運算。
- **何時用它**：團隊偏好純宣告式設定、不想引入程式語言相依；或需要用到某個 SAM／CDK 還沒跟上的最新資源屬性時，直接寫 CFN 最保險。

### SAM

- **為什麼用它**：專治「無伺服器應用寫 CloudFormation 太囉嗦」。一個 `AWS::Serverless::Function` 省掉幾十行樣板，還附本機模擬與一條龍 `build`/`deploy` 工具。
- **優點**：無伺服器場景**語法極簡**；`sam local` 可本機測 Lambda／API；`sam deploy --guided` 新手友善；仍是 CloudFormation，可和原生資源混用。
- **缺點**：**主打無伺服器**（Lambda／API Gateway／DynamoDB…），拿它蓋大型非無伺服器架構（VPC、EC2 叢集）就沒優勢；仍是 YAML，複雜邏輯一樣難寫。
- **何時用它**：你的專案就是 Lambda + API Gateway + DynamoDB 這類無伺服器應用，想要最快、最少樣板上線——**首選 SAM**。

### CDK

- **為什麼用它**：讓「寫基礎設施」和「寫應用程式」用同一種語言、同一套工具（IDE、測試、套件管理）。能抽象、能複用、能寫邏輯，告別複製貼上 YAML。
- **優點**：用通用語言（TS/Python…）＋ IDE 自動完成；高階 Construct 內建**最佳實務預設值**（例如自動幫你補好權限）；能寫迴圈／函式大幅減少重複；可寫單元測試驗證基礎設施。
- **缺點**：**學習曲線較高**（要懂語言＋ CDK 概念＋它背後合成出的 CFN）；多一層抽象，出錯時要回去看合成出的範本才知道真正發生什麼；相依較多（Node.js 環境、CDK 版本升級）。
- **何時用它**：團隊是程式開發者、基礎設施複雜且重複性高、想把基礎設施當正式程式碼來測試與複用——**選 CDK**。

:::info[🔑 一句話記住選擇]
**底層全是 CloudFormation。** 蓋純無伺服器、要最少樣板 → **SAM**；想用寫程式的方式（抽象／迴圈／複用）管複雜架構 → **CDK**；要最貼底層、最完整覆蓋、純宣告式 → **CloudFormation**。
:::

## 實務應用：不只是考試

<Scenario title="真實情境：用一份範本開出可拋棄的測試環境">

你要為每個功能分支開一套獨立的測試環境，測完就整套砍掉、不留垃圾也不漏收費。做法：把整套（Lambda＋API＋DynamoDB）寫成一份 SAM 範本，用 `Parameters` 帶入分支名當堆疊名與資源前綴。每開一個分支，CI 就 `sam deploy --stack-name test-featureX` 建一套；功能合併後 `aws cloudformation delete-stack --stack-name test-featureX` 一行整套清光。因為是同一份範本，**每套環境保證長得一模一樣**，再也不會「測試好好的、正式卻炸了」。

</Scenario>

### 🛠️ 動手做：用 SAM 部署一個 Lambda＋API，看到 CREATE_COMPLETE

> 前置：裝好 [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) 與 AWS 認證（`aws configure`）。

```bash
# 1) 用官方範本初始化一個 Hello World 專案（Python）
sam init --runtime python3.12 --name sam-hello \
  --app-template hello-world --no-interactive
cd sam-hello

# 2) 建置：安裝相依、打包成可部署產物（輸出到 .aws-sam/）
sam build

# 3) 第一次部署用引導模式，依提示填堆疊名、區域、確認變更集
sam deploy --guided
#   Stack Name       → sam-hello
#   AWS Region       → ap-northeast-1
#   Confirm changes  → Y   （部署前讓你看變更集）
#   Allow IAM role creation → Y
#   設定會存進 samconfig.toml，之後直接 `sam deploy` 即可
```

**預期結果**：終端機會先印出**變更集**（列出 `+ Add` 的 Lambda、API、IAM 角色），你確認後開始部署。成功時看到類似：

```text
CloudFormation events from stack operations
-------------------------------------------------------------------
Status                  ResourceType            LogicalResourceId
-------------------------------------------------------------------
CREATE_IN_PROGRESS      AWS::Lambda::Function    HelloWorldFunction
CREATE_COMPLETE         AWS::Lambda::Function    HelloWorldFunction
CREATE_COMPLETE         AWS::ApiGateway::...     ServerlessRestApi
CREATE_COMPLETE         AWS::CloudFormation::Stack  sam-hello
-------------------------------------------------------------------

Outputs
-------------------------------------------------------------------
Key                 HelloWorldApi
Description         API Gateway endpoint URL
Value              https://abc123.execute-api.ap-northeast-1.amazonaws.com/Prod/hello/
-------------------------------------------------------------------
Successfully created/updated stack - sam-hello in ap-northeast-1
```

看到整個堆疊 **`CREATE_COMPLETE`** 並印出 **Outputs 裡的 API 網址**，就代表成功了。複製那個網址 `curl` 一下會回 `{"message": "hello world"}`。

```bash
# 4) 驗證（把網址換成上面 Outputs 的值）
curl https://abc123.execute-api.ap-northeast-1.amazonaws.com/Prod/hello/

# 5) 清乾淨：整個堆疊連同所有資源一次刪除（省得繼續收費）
sam delete --stack-name sam-hello
```

<Cost>

**IaC 工具本身不收錢**——CloudFormation／SAM／CDK 都免費，你只為它們**建出來的資源**付費（Lambda 呼叫次數、API Gateway 請求、DynamoDB 容量…）。所以最大的成本陷阱是「**建了忘了刪**」：練習完一定要 `sam delete` 或 `aws cloudformation delete-stack` 把整個堆疊清掉。好消息是 IaC 讓清理變超簡單——一行刪整套，比手動一個個找資源可靠太多。另外注意：若某資源設了 `DeletionPolicy: Retain`，刪堆疊時它**不會**被刪、會繼續收你錢（見下方踩雷）。

</Cost>

:::warning[🚑 常踩雷]
- **直接 `update-stack` 不看變更集**：某些屬性修改會觸發**資源替換（Replacement）**＝砍掉重建，等於資料全沒。更新前一律先 `create-change-set` → `describe-change-set` 檢視有沒有 `Replacement: True`，確認再執行。
- **刪堆疊＝刪光裡面的資源**：`delete-stack` 預設把這個堆疊建的所有資源**一併刪除**。對資料庫、S3 貯體這種「刪了救不回」的資源，加 **`DeletionPolicy: Retain`**（刪堆疊時保留它）或 `Snapshot`（刪前先備份），避免手滑清掉正式資料。
- **`DeletionPolicy: Retain` 反過來的坑**：設了 Retain 的資源刪堆疊時被**留下來**，之後會**繼續計費**、也可能卡住同名重建。該清的時候記得手動清。
- **漂移（Drift）**：有人跑去主控台手動改了堆疊裡的資源，範本和實際就對不上。之後更新堆疊可能把人家手動的改動**蓋回去**、或行為變怪。定期用 **drift detection** 偵測，並要求「一律改範本、別手動動主控台」。
- **範本硬寫機密**：把密碼、API 金鑰直接寫進範本＝明文進 Git＝外洩。改用 **Secrets Manager / SSM Parameter Store**，範本只存**參照**（如 `{{resolve:secretsmanager:...}}`），別存值。
- **以為 rollback 永遠救得了你**：建立失敗預設會自動 rollback 清掉半套資源；但更新失敗的 rollback 偶爾會卡在 `UPDATE_ROLLBACK_FAILED`，需要手動 `continue-update-rollback` 或排除問題資源。別把 rollback 當萬能，重要更新先走變更集。
- **SAM 忘了 `sam build` 就 `deploy`**：改了程式碼卻沒重新 build，部署上去的還是舊的。順序一律 `sam build` → `sam deploy`。
:::

<Refs>

- [AWS CloudFormation 使用者指南](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/Welcome.html)
- [CloudFormation 範本結構（Resources / Parameters / Outputs）](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/template-anatomy.html)
- [使用變更集更新堆疊](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-updating-stacks-changesets.html)
- [AWS SAM 開發人員指南](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html)
- [AWS CDK 開發人員指南](https://docs.aws.amazon.com/cdk/v2/guide/home.html)
- [偵測堆疊漂移（Drift Detection）](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-stack-drift.html)

</Refs>

## 下一步

👉 下一篇：[部署策略](./deployment-strategies.md)
