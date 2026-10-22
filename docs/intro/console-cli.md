---
sidebar_position: 9
title: 認識主控台、CloudShell 與 CLI
---

# 操作 AWS 的三種方式：主控台、CloudShell 與 CLI

> 同一件事，常常有好幾種做法。學會「什麼時候該用哪一種」，比死記指令更重要。

<Term en="Command Line Interface" desc="命令列介面：用打字下指令的方式操作電腦，而不是用滑鼠點按鈕。">CLI</Term> 聽起來很硬，但別怕——這篇會帶你用最輕鬆的方式，認識操作 AWS 的三種主要入口。

## 為什麼要有這麼多種操作方式？

<Analogy title="💡 比喻：開同一台電視的三種方法">

想像你要「把電視轉到第 5 台」，其實有好幾種做法：

- **走過去用手點電視上的按鈕**：直覺、看得到畫面，但每次都得走過去。
- **用遙控器**：坐在沙發上就能操作，快一點，但要先學會哪個鍵是什麼。
- **寫一段腳本讓它每天晚上 8 點自動轉到第 5 台**：一次設定好，之後完全不用管。

操作 AWS 也一樣：**主控台**像走過去用手點、**CLI**像拿遙控器、**IaC（基礎設施即程式碼）**像寫自動化腳本。同一件事，隨你用最順手的方式做。

</Analogy>

AWS 把這三種入口都準備好，是因為**不同情境適合不同工具**：剛入門用滑鼠點最安心；每天要重複做的事，打一行指令比點二十下滑鼠快；要一次開出上百台伺服器，就得靠程式自動產生。

## 一、AWS Management Console（主控台）

**AWS Management Console（管理主控台）** 就是你用瀏覽器打開、登入後看到的那個**網頁圖形介面**。所有服務都能用滑鼠點選操作，是絕大多數人第一次碰 AWS 的地方。

<Term en="Management Console" desc="AWS 的網頁圖形操作介面，用瀏覽器登入後用滑鼠點選操作各種服務。">主控台</Term>最適合**初學與探索**：你看得到每個按鈕、每個選項，不用背任何指令。

### 導覽：先認得這幾個地方

第一次登入可能眼花撩亂，先記住右上角這幾個重點就好：

| 位置 | 是什麼 | 為什麼重要 |
| --- | --- | --- |
| **Region 選單**（右上角） | 選擇你的服務要開在哪個區域（如東京 `ap-northeast-1`） | 開錯區域會找不到自己剛建立的資源，是新手最常見的困惑 |
| **服務搜尋框**（最上方） | 直接打服務名稱（如 `EC2`、`S3`）就能跳過去 | AWS 有兩百多種服務，用搜尋比翻選單快太多 |
| **帳號／帳單選單**（右上角帳號名） | 查帳單、設定、登出 | 隨時盯著帳單，避免月底被嚇到 |
| **CloudShell 圖示**（上方工具列，`>_` 的圖案） | 一鍵打開瀏覽器內的終端機 | 下一段的主角，新手打指令的最佳起點 |

:::tip[💡 新手小提醒]
看到畫面上的資源「不見了」，先檢查**右上角的 Region**是不是切到別區去了。這不是 bug，是你在 A 區建立、卻跑到 B 區找。
:::

## 二、AWS CloudShell（瀏覽器內建終端機）

<Term en="CloudShell" desc="AWS 提供的、直接在瀏覽器裡執行的終端機，免安裝、免設定金鑰，登入主控台就能用。">AWS CloudShell</Term> 是一個**直接開在瀏覽器裡的終端機**。它最大的好處是：

- **免安裝**：不用在自己電腦裝任何東西，點一下主控台上的 `>_` 圖示就開好了。
- **已帶好憑證**：因為你已經登入主控台，CloudShell 自動用你的身分與權限，**不必手動設定任何金鑰**。
- **最安全**：不會把金鑰留在你自己的電腦上。

這些特性讓 CloudShell 成為**新手第一次打指令的最佳場所**——不用擔心裝錯東西，也不用擔心金鑰外洩。

### 試試看兩個無害的指令

打開 CloudShell 後，可以先跑這兩個「只看、不改」的指令：

```bash
# 問 AWS：「我現在是誰？」會回傳你的帳號 ID 與身分
$ aws sts get-caller-identity
{
    "UserId": "AIDXXXXXXXXXXXXXX",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/you"
}

# 列出這個帳號裡的所有 S3 儲存貯體（沒有的話就是空的，很正常）
$ aws s3 ls
```

這兩個指令都**只是查詢，不會建立或刪除任何東西**，放心練習。

:::note[📝 名詞小抄]
`aws` 是 AWS CLI 的指令；`sts` 是 <Term en="Security Token Service" desc="AWS 的安全權杖服務，負責發放臨時憑證、也能告訴你目前的身分。">Security Token Service（安全權杖服務）</Term>；`get-caller-identity` 就是「告訴我，呼叫這個指令的人是誰」。
:::

## 三、AWS CLI（在自己電腦安裝的命令列工具）

**AWS CLI（Command Line Interface，命令列介面）** 是你**安裝在自己電腦上**的工具，功能和 CloudShell 一樣能下 `aws` 指令，差別在於它跑在你的電腦、而不是瀏覽器。

為什麼要裝在自己電腦？因為你平常寫程式、跑腳本都在自己電腦上，CLI 裝在本機才方便和你的開發流程、自動化腳本整合。

### 安裝與設定概念

裝好 AWS CLI 後，第一次要用 `aws configure` 告訴它「你是誰」：

```bash
$ aws configure
AWS Access Key ID [None]: AKIA................
AWS Secret Access Key [None]: ........................................
Default region name [None]: ap-northeast-1
Default output format [None]: json
```

這四個問題分別是：

- **Access Key ID／Secret Access Key**：你的<Term en="Access Key" desc="一組像帳號密碼的金鑰，用來證明身分；Secret Access Key 只會出現一次，要妥善保管。">金鑰</Term>（像帳號與密碼）。
- **Default region**：預設要操作的區域（例如東京 `ap-northeast-1`）。
- **Default output format**：指令回傳結果的格式，新手用 `json` 即可。

:::warning[🚑 金鑰安全：最重要的一段]
- **金鑰（Access Key）就是你的鑰匙**，外洩了別人就能用你的帳號花錢、刪資料。**絕對不要**把它貼到程式碼、截圖、聊天訊息或公開的 GitHub 上。
- **優先使用角色（Role）或臨時憑證**，少用長期金鑰。這也是為什麼新手建議先用 CloudShell——它自動用臨時憑證，根本不需要你手動管金鑰。
- 真的要用金鑰時，用完記得到 IAM 把它**停用或刪除**。
:::

## 何時用哪一個？

三種方式沒有誰比較高級，只有「這個情境適合誰」：

| 情境 | 建議工具 | 原因 |
| --- | --- | --- |
| 第一次探索、學習、查看資源 | **主控台** | 圖形介面直覺，看得到全貌，不用背指令 |
| 重複性的操作、要寫成腳本自動化 | **CLI** | 一行指令勝過點二十下滑鼠，還能排程自動跑 |
| 大規模、要能重現的基礎設施 | **IaC** | 把整套環境寫成程式碼，可版本控管、可重複部署 |

<Term en="Infrastructure as Code" desc="基礎設施即程式碼：把伺服器、網路等整套環境用程式碼定義出來，就能一鍵重複建立。">IaC（基礎設施即程式碼）</Term>這裡先點到為止，常見工具有 **CloudFormation**（AWS 原生）、**CDK**（用程式語言寫）與 **Terraform**（跨雲端通用）。等你更熟之後再深入即可，初學階段先把主控台和 CloudShell 玩熟最實在。

:::info[考試這樣考]
考試不會要你背 CLI 指令的每個參數，但會考**觀念**：例如「要自動化、可重複部署整套環境，應該用什麼？」答案方向就是 **IaC（CloudFormation）**，而不是手動點主控台。記住每種工具的「適用情境」就對了。
:::

## 🛠️ 動手做：打開 CloudShell，看看自己是誰

不用安裝、不用設定金鑰，三步驟就能完成你的第一個指令：

1. 登入 AWS **主控台**，確認右上角 **Region** 選到你要的區域。
2. 點上方工具列的 **CloudShell 圖示**（`>_`），等它開好終端機（第一次約需幾十秒）。
3. 輸入以下指令並按 Enter：

```bash
$ aws sts get-caller-identity
```

看到回傳的 `Arn` 和 `Account`，那就是「此刻的你」在 AWS 眼中的身分。恭喜，你已經用指令和 AWS 對過話了！

<Refs title="📚 官方資料與延伸閱讀">

- [AWS 官方文件：AWS Management Console 入門](https://docs.aws.amazon.com/awsconsolehelpdocs/latest/gsg/getting-started.html)
- [AWS 官方文件：AWS CloudShell 使用者指南](https://docs.aws.amazon.com/cloudshell/latest/userguide/welcome.html)
- [AWS 官方文件：AWS CLI 使用者指南（安裝與設定）](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-welcome.html)
- [AWS 官方文件：IAM 安全最佳實務（金鑰管理）](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)

</Refs>

👉 下一篇：[你的第一個動手實作：EC2 + S3](./first-hands-on.md)
