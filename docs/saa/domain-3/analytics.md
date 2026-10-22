---
sidebar_position: 6.5
title: 資料分析服務：Athena、Glue、Redshift、QuickSight
---

# 從一堆資料裡挖出洞見：認得這幾個分析主角就夠了

> 很多考題的情境都是「我手上有一大堆資料（日誌、交易記錄、檔案），想從裡面挖出有用的洞見，該用哪個服務？」。這一篇不教你深入操作，只要你**認得每個分析服務各自的定位**，SAA 的分析選型題就能穩穩答對。

<Vocab title="📌 先認識這篇會出現的名詞（完全沒碰過也能懂）">

- **資料湖（Data Lake）**：一個「**什麼資料都先丟進來放著**」的大倉庫。原始資料不用先整理，之後需要分析時再用不同工具去撈。在 AWS 上通常就是 **S3**。
- **ETL（Extract / Transform / Load，擷取、轉換、載入）**：把資料從來源**撈出來、清理轉換成好用的格式、再載入到分析的地方**的整套流程。
- **資料倉儲（Data Warehouse）**：專門為「**分析與報表**」設計的資料庫，擅長跑又大又複雜的查詢。
- **OLTP vs OLAP**：**OLTP** 是「**交易型**」，處理一筆筆日常的新增／修改（例如下單、轉帳）；**OLAP** 是「**分析型**」，處理大範圍的統計與彙總（例如「過去三年各地區營收趨勢」）。
- **BI（Business Intelligence，商業智慧）**：把分析結果做成**圖表、儀表板**給人看、幫忙做決策。
- **欄式儲存（Columnar）**：資料**按欄位**存放而不是按整列存放，跑「只看某幾欄的大範圍彙總」特別快，是資料倉儲的常見設計。

</Vocab>

:::note[💬 閱讀小提示]
文章裡只要看到帶<Term desc="像這樣！滑鼠移到有虛線的名詞上（手機點一下），就會跳出白話解釋。">虛線底線的名詞</Term>，把滑鼠移上去就會跳出白話解釋。所有名詞也都整理在 [名詞與服務對照表](/glossary)。
:::

## 先建立大局觀：以 S3 為中心的資料湖

這幾個分析服務不是各做各的，它們常常圍繞同一個中心運作——那個中心就是 **S3**。

把 **S3 當成資料湖**：各種來源（應用程式日誌、IoT 遙測、交易記錄、匯出的檔案）全部先丟進 S3，不用先煩惱格式。等到要分析時，再**挑對的工具去撈同一份資料**：想直接下 SQL 查就用 Athena、想先清理轉換就用 Glue、想做大規模倉儲報表就把資料載進 Redshift、最後把結果用 QuickSight 畫成儀表板。

<Analogy title="🏢 生活比喻：一座大型食材倉庫，配不同的廚房與工具">

- **S3 資料湖 = 大型食材倉庫**：各地送來的食材（原始資料）通通先冰進來，不用先切好洗好。
- **Athena = 現場快速試吃**：想知道某箱食材長怎樣，當場直接查、不用搬進廚房，問完就走。
- **Glue = 中央備料廚房**：把食材洗淨、切好、分類貼標（ETL ＋ 建目錄），之後誰要用都方便。
- **Redshift = 大型專業廚房**：接大型宴席訂單（複雜報表），一次處理海量食材做出大餐。
- **QuickSight = 擺盤上菜**：把做好的成果漂亮地端到客人面前（圖表儀表板）。

</Analogy>

## 四個主角，一句話各自定位

### Athena：無伺服器，直接用 SQL 查 S3

<Term en="Amazon Athena" desc="無伺服器的互動式查詢服務，直接用標準 SQL 查詢存放在 S3 的資料，按掃描的資料量計費，免建資料庫與伺服器。">Athena</Term> 的賣點是「**什麼都不用架，直接下 SQL 查 S3**」。它是**無伺服器**的：沒有要管理的叢集、沒有要先建的資料庫，你把資料放在 S3，Athena 就能直接用標準 SQL 去查。計費方式是**按每次查詢掃描的資料量**計算，查多少算多少、閒置不收錢。最典型的用途就是「**臨時想查一下 S3 裡的日誌或檔案**」這種即席查詢。

### AWS Glue：無伺服器 ETL ＋ 資料目錄

<Term en="AWS Glue" desc="無伺服器的 ETL 服務，負責擷取、清理、轉換資料；內建資料目錄（Data Catalog）集中管理中繼資料，供 Athena、Redshift 等查詢引擎使用。">AWS Glue</Term> 做兩件事。第一是**無伺服器 ETL**：幫你把原始資料**擷取、清理、轉換**成乾淨好用的格式，一樣免管伺服器。第二是**資料目錄（Data Catalog）**：它會幫資料建立一份「**中繼資料目錄**」（這份資料有哪些欄位、什麼型別、放在哪），這份目錄可以直接給 Athena、Redshift 這些查詢引擎使用，它們才知道怎麼讀你的資料。簡單說：**Glue 負責把資料整理好、並登記在目錄裡**。

### Redshift：雲端資料倉儲，專攻大規模複雜分析

<Term en="Amazon Redshift" desc="AWS 的雲端資料倉儲服務，採欄式儲存，專為 PB 級資料的複雜分析查詢（OLAP）與商業報表設計。">Redshift</Term> 是 AWS 的**雲端資料倉儲**。它採用**欄式儲存**，專門為「**又大又複雜的分析查詢**」設計，能處理到 **PB 級**的資料量，是跑**商業報表、複雜彙總統計**的首選。這裡要特別分清楚和 RDS 的差別：

| 面向 | RDS（關聯式資料庫） | Redshift（資料倉儲） |
| --- | --- | --- |
| 類型 | **OLTP**（交易型） | **OLAP**（分析型） |
| 擅長 | 一筆筆的新增／修改／查詢（下單、轉帳） | 大範圍的統計、彙總、報表查詢 |
| 資料量情境 | 日常營運資料 | 海量歷史資料（可達 PB 級） |
| 儲存方式 | 以列為主 | **欄式儲存** |

一句話：**日常交易用 RDS，大規模分析報表用 Redshift**。

### QuickSight：把分析結果畫成儀表板

<Term en="Amazon QuickSight" desc="AWS 的無伺服器 BI 服務，把分析結果做成互動式圖表與儀表板，供人檢視與決策。">QuickSight</Term> 是 AWS 的 **BI 視覺化**服務。前面幾個服務把資料查好、算好之後，QuickSight 負責**把結果做成互動式圖表與儀表板**，端到主管或客戶面前看。它連得到 Athena、Redshift、RDS、S3 等資料來源。只要題目講的是「**做成圖表、儀表板給人看**」，答案就是 QuickSight。

## 其他會點到名的分析服務（認得定位即可）

| 服務 | 一句話定位 |
| --- | --- |
| **OpenSearch** | **日誌搜尋與分析**，適合全文搜尋、即時查日誌、看營運指標 |
| **EMR** | 跑 **Hadoop／Spark** 的大數據處理叢集，適合超大規模自訂運算 |
| **Kinesis** | **即時串流**資料的接收與處理（已於 [串流與解耦](/saa/domain-3/streaming-decoupling) 專篇說明，這裡不重講） |

## 最重要的一張選型表

| 你的需求 | 選這個 |
| --- | --- |
| 想**直接用 SQL 查 S3 裡的日誌／檔案**，免建資料庫、無伺服器 | **Athena** |
| 要做 **ETL**（清理轉換資料）或**建中繼資料目錄** | **Glue** |
| 要**大規模資料倉儲、跑複雜 OLAP 報表**（PB 級） | **Redshift** |
| 要把結果做成**圖表、儀表板視覺化** | **QuickSight** |

:::tip[💡 考試重點]
看到關鍵字直接對應，幾乎是送分：
- 題目講 **無伺服器、免建資料庫、直接用 SQL 查 S3 裡的日誌** → **Athena**
- 題目講 **需要資料倉儲做複雜的 OLAP 分析報表、PB 級資料** → **Redshift**
- 題目講 **要做 ETL／建 Data Catalog 中繼資料** → **Glue**
- 題目講 **把分析結果做成儀表板給人看** → **QuickSight**
- 出現 **OLTP vs OLAP 的分辨**：日常交易是 RDS（OLTP），分析報表是 Redshift（OLAP）
:::

## 運作流程圖解

<div className="flow">
  <div className="flow-node">各種來源資料丟進 S3（資料湖）</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Glue 做 ETL ＋ 建資料目錄</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Athena 即席查／Redshift 倉儲分析</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">QuickSight 做成儀表板</div>
</div>

*圖：以 S3 為中心，資料經 Glue 整理、用 Athena 或 Redshift 分析，最後用 QuickSight 視覺化——這條鏈路就是 AWS 分析題最常見的大局。*

## 實務應用：不只是考試

<Scenario title="真實情境：主管要你從一堆 S3 日誌裡找出問題">

你們的系統把所有存取日誌每天自動丟進 S3，累積了好幾 TB。某天主管問：「上週那次異常，到底是哪些 IP 在搞？幫我查一下。」你**不想為了查一次就特地架一個資料庫、匯入資料**。——答案：直接用 Athena 對著 S3 的日誌下 SQL，查完就走，按掃描量付費。如果之後要固定每天做大型營收報表、跑複雜彙總，那才值得把資料整理進 Redshift 資料倉儲，再用 QuickSight 做成主管每天看的儀表板。

</Scenario>

<Cost>

Athena **按查詢掃描的資料量計費**，不查不收錢，練習成本很低（把資料壓縮、分區可大幅減少掃描量進而省錢）。Glue 按 ETL 執行時間與資料目錄用量計費。**Redshift 的叢集是「開著就收錢」**，練習完一定要**刪掉或暫停叢集**，否則會持續計費。QuickSight 按使用者方案計費，有試用額度。練習完記得把 Redshift 叢集關掉，這是最容易爆帳單的一個。

</Cost>

:::warning[🚑 實務常見錯誤]
- **為了查一次 S3 日誌就特地架資料庫**：這種即席查詢用 Athena 最省事，免建庫、免管伺服器。
- **把 Redshift 當日常交易資料庫用**：Redshift 是分析型（OLAP），不適合高頻率的一筆筆交易寫入，那是 RDS（OLTP）的工作。
- **Athena 查詢沒壓縮／沒分區導致費用爆高**：按掃描量計費，資料沒整理會掃到一堆不必要的資料，又慢又貴。
- **分不清 Glue 和 Athena**：Glue 是**整理資料＋建目錄**，Athena 是**查資料**；兩者常搭配使用（Glue 建好目錄，Athena 就能查）。
:::

<Refs>

- [AWS 官方文件：Amazon Athena 使用者指南](https://docs.aws.amazon.com/athena/latest/ug/what-is.html)
- [AWS Glue 開發人員指南](https://docs.aws.amazon.com/glue/latest/dg/what-is-glue.html)
- [Amazon Redshift 管理指南](https://docs.aws.amazon.com/redshift/latest/mgmt/welcome.html)
- [Amazon QuickSight 使用者指南](https://docs.aws.amazon.com/quicksight/latest/user/welcome.html)
- [在 AWS 上建置資料湖](https://docs.aws.amazon.com/whitepapers/latest/building-data-lakes/building-data-lake-aws.html)

</Refs>

## 下一步

- ⚡ 快速複習：[Domain 3 重點速記 / 閃卡](/saa/domain-3/flashcards)
- ✍️ 測試自己：[Domain 3 原創練習題](/saa/domain-3/quiz)
- 📖 下一篇：[可擴展的網路與儲存模式](/saa/domain-3/scalability-patterns)
