---
sidebar_position: 4
title: 雲端技術與服務（Cloud Technology & Services）
---

# 雲端技術與服務（Cloud Technology & Services）

> 這是 CLF 考試占比最高的一個領域（約 34%）。別被名字嚇到——這一篇不要你會「設定」任何服務，只要你**認得「哪個服務在做什麼」**，以及幾個撐起整個 AWS 的基本觀念。

<Analogy title="🧰 比喻：認得工具箱裡每把工具的用途就好">

想像你第一次打開一個大工具箱：裡面有螺絲起子、扳手、電鑽、膠帶……一時間記不住全部。但你其實不用會「用」每一把，只要知道「鎖螺絲找螺絲起子、鑽洞找電鑽」，需要時拿對工具就行。

這一領域也是如此：AWS 有上百種服務，CLF 層級**只要求你認得各類「主角服務」解決什麼問題**，不要你深入選型與調校細節。本篇就帶你把這個工具箱認過一輪。

</Analogy>

:::note[💬 怎麼讀這一篇]
下面核心服務用「一類一張小表（服務 ｜ 一句用途）」呈現，現在只要「有印象」即可，不必強記。看到帶<Term desc="像這樣！滑鼠移到有虛線的名詞上（手機點一下）就會跳出白話解釋。">虛線底線的名詞</Term>，把滑鼠移上去就會跳出白話解釋。
:::

## 一、全球基礎建設：Region、可用區、邊緣節點

所有 AWS 服務都跑在實體機房上，而這些機房的分佈方式，正是雲端「又穩又快」的關鍵。只要記住三個由大到小的層級。

| 層級 | 白話說明 | 為什麼重要 |
| --- | --- | --- |
| **<Term en="Region" desc="AWS 在世界各地的一個地理區塊，例如東京、新加坡；各 Region 彼此獨立運作。">Region（區域）</Term>** | 世界某地理位置的一大塊基礎建設（如東京、新加坡） | 挑離使用者近的 Region 可降低延遲；法規常要求資料留在特定國境內 |
| **<Term en="Availability Zone" desc="一個 Region 內彼此獨立的資料中心群，各有獨立電力、冷卻與網路。">可用區（AZ）</Term>** | 一個 Region 裡數個彼此獨立的機房 | 把服務跨多個 AZ 部署，一個機房掛掉另一個頂得住（高可用） |
| **<Term en="Edge Location" desc="AWS 散佈全球各城市的小型節點，數量遠多於 Region，主要給 CloudFront 做內容快取與就近加速。">邊緣節點（Edge Location）</Term>** | 散佈全球、數量超多的小型就近據點 | 把內容快取在離使用者最近處，載入更快（CloudFront 用它） |

:::info[🏗️ 為什麼這很重要：高可用 + 就近]
- **高可用（容錯）**：雞蛋不要放同一個籃子。把資源**跨多個 AZ** 部署，一處出事其他地方還活著。
- **就近（低延遲）**：在離使用者近的地方放資源，連線才快；全球使用者還可靠**邊緣節點**就近取得內容。

一句話記：**Region ＞ 可用區（AZ）＞ 邊緣節點**，三者由大到小、由遠到近。
:::

## 二、存取 AWS 的方式：主控台、CLI、SDK、IaC

同一件事，AWS 準備了好幾種「入口」，因為**不同情境適合不同人**。

| 方式 | 是什麼 | 適合誰／什麼情境 |
| --- | --- | --- |
| **<Term en="Management Console" desc="AWS 的網頁圖形操作介面，用瀏覽器登入後用滑鼠點選操作。">主控台（Console）</Term>** | 瀏覽器打開的網頁圖形介面，用滑鼠點選 | 初學、探索、臨時查看資源——看得到全貌，不用背指令 |
| **<Term en="Command Line Interface" desc="命令列介面：用打字下指令操作 AWS，而不是用滑鼠點按鈕。">CLI（命令列）</Term>** | 在終端機打 `aws` 指令操作 | 重複性操作、要寫成腳本自動化的人 |
| **<Term en="Software Development Kit" desc="軟體開發套件：各種程式語言的函式庫，讓程式碼直接呼叫 AWS 服務。">SDK（開發套件）</Term>** | 各語言的函式庫，讓程式碼直接呼叫 AWS | 開發者在應用程式裡整合 AWS 功能 |
| **<Term en="Infrastructure as Code" desc="基礎設施即程式碼：把整套環境用程式碼定義，一鍵重複建立。">IaC（基礎設施即程式碼）</Term>** | 用程式碼定義整套環境（如 CloudFormation） | 要大規模、可重現、可版本控管地部署整套環境 |

<Analogy title="💡 比喻：開同一台電視的幾種方法">

把電視轉到第 5 台，你可以**走過去按電視按鈕**（主控台）、**拿遙控器**（CLI）、**請 App 幫你按**（SDK），或**寫腳本讓它每晚自動轉台**（IaC）。沒有誰比較高級，只有「這個情境用哪個最順手」。

</Analogy>

:::note[📝 名詞小抄]
**CloudFormation** 是 AWS 原生的 IaC 工具：你寫一份「設計圖」範本（template），它就幫你把整套資源一次建好，之後要重建或刪除也一鍵完成。CLF 只要認得「要可重複部署整套環境 → 用 IaC（CloudFormation）」這個觀念即可。
:::

## 三、核心服務類別速覽

接下來把最常見的服務依「大類」整理。**現在只要認得「哪個服務做什麼」就夠了**，深入的選型與設定留到實務或進階考試再學。

### 🖥️ 運算（Compute）：程式「跑在哪裡」

| 服務 | 一句用途 |
| --- | --- |
| **<Term en="Elastic Compute Cloud" desc="AWS 上租來的一台雲端伺服器，程式跑在上面。">EC2</Term>** | 租一整台雲端伺服器，自己裝環境、完整掌控 |
| **<Term en="AWS Lambda" desc="無伺服器運算，事件觸發、按用量計費。">Lambda</Term>** | 無伺服器：不用管機器，寫一段程式、有事件就跑 |
| **<Term en="Elastic Container Service / Elastic Kubernetes Service" desc="AWS 的容器編排服務，EKS 是託管的 Kubernetes。">ECS／EKS</Term>** | 調度一堆「容器」的指揮中心（用 Docker／Kubernetes 部署） |
| **<Term en="AWS Elastic Beanstalk" desc="把程式碼交給它，自動幫你佈建並管理底層資源的平台服務。">Elastic Beanstalk</Term>** | 把程式碼丟上去，它自動幫你佈建與管理底層環境 |

### 💾 儲存（Storage）：檔案「放在哪裡」

| 服務 | 一句用途 |
| --- | --- |
| **<Term en="Simple Storage Service" desc="AWS 的雲端物件儲存，放圖片、備份、報表等。">S3</Term>** | 幾乎無限大的雲端檔案倉庫（物件儲存） |
| **<Term en="Elastic Block Store" desc="接在單一 EC2 上的雲端硬碟（區塊儲存）。">EBS</Term>** | 掛在一台 EC2 上的「雲端硬碟」 |
| **<Term en="Elastic File System" desc="可多台同時掛載共享的檔案系統。">EFS</Term>** | 多台伺服器可同時共用的網路檔案系統 |
| **<Term en="AWS Storage Gateway" desc="把地端環境與 AWS 雲端儲存接起來的混合儲存服務。">Storage Gateway</Term>** | 橋接地端機房與雲端儲存的「混合儲存」閘道 |

:::info[🔑 一個容易混的差異]
**EBS 一次只黏一台 EC2（像外接硬碟）；EFS 可以多台同時掛載共享（像網路磁碟機）。** S3 則是放整包檔案的物件倉庫，不是掛在機器上的硬碟。
:::

### 🗄️ 資料庫（Database）：有結構的資料放哪、怎麼查

| 服務 | 一句用途 |
| --- | --- |
| **<Term en="Relational Database Service" desc="代管式關聯式資料庫，如 MySQL、PostgreSQL。">RDS</Term>** | 代管的傳統表格式（關聯式）資料庫，免自己維運 |
| **<Term en="Amazon Aurora" desc="AWS 自研、相容 MySQL/PostgreSQL 的高效能關聯式資料庫。">Aurora</Term>** | RDS 的加強版，更快、儲存自動長大 |
| **<Term en="Amazon DynamoDB" desc="無伺服器 NoSQL，個位數毫秒延遲、幾乎無限擴展。">DynamoDB</Term>** | 免管機器的超快 NoSQL 資料庫 |

### 🌐 網路與傳遞（Networking & Delivery）：流量怎麼進來、怎麼送達

| 服務 | 一句用途 |
| --- | --- |
| **<Term en="Virtual Private Cloud" desc="你在 AWS 裡的私人虛擬網路。">VPC</Term>** | 你在 AWS 裡自己的私人網路（所有架構的底座） |
| **<Term en="Amazon Route 53" desc="AWS 的 DNS 服務，把網域名稱解析到資源。">Route 53</Term>** | AWS 的 DNS，把網域名稱指到你的資源 |
| **<Term en="Amazon CloudFront" desc="內容傳遞網路（CDN），把內容快取到全球邊緣節點。">CloudFront</Term>** | CDN：把內容快取到全球各地，就近送達 |
| **<Term en="Elastic Load Balancing" desc="負載平衡器，把流量分散到多台後端。">ELB</Term>** | 把進來的流量平均分給多台伺服器（高可用） |

### 🚀 部署與管理（Deployment & Management）：怎麼佈建、怎麼監控、誰動了什麼

| 服務 | 一句用途 |
| --- | --- |
| **<Term en="AWS CloudFormation" desc="用程式碼範本定義並自動建立整套 AWS 資源的 IaC 服務。">CloudFormation</Term>** | 用一份範本（程式碼）一鍵建立整套資源（IaC） |
| **<Term en="Amazon CloudWatch" desc="收集指標、日誌並觸發告警的監控服務。">CloudWatch</Term>** | 系統的「儀表板」：看指標、日誌、設定告警 |
| **<Term en="AWS CloudTrail" desc="記錄帳號內所有 API 操作的稽核日誌。">CloudTrail</Term>** | 「行車記錄器」：記錄誰在何時做了什麼操作 |

:::info[🔍 CloudWatch 與 CloudTrail 別搞反]
**CloudWatch 看「系統表現好不好」（指標、日誌）；CloudTrail 看「誰做了什麼操作」（稽核）。** 一個像儀表板，一個像行車記錄器。
:::

## 四、技術支援與學習資源

遇到問題時，AWS 提供多種管道幫你找答案、健檢環境。

| 資源 | 一句用途 |
| --- | --- |
| **AWS 文件（Documentation）** | 官方說明書：每個服務的設定、範例與最佳實務都在這裡 |
| **知識中心（Knowledge Center）** | 常見問題的官方解答集，照著步驟就能解掉多數疑難 |
| **<Term en="AWS Trusted Advisor" desc="自動檢查帳號並在成本、安全、效能等面向提出最佳化建議的顧問。">Trusted Advisor</Term>** | 幫你自動健檢帳號，給省錢、安全、效能等建議 |

:::tip[💡 CLF 常考點]
這個領域考的是「認得」而非「精通」，把握以下幾個重點：

- **哪個服務做什麼**：看到服務名稱，說得出它屬於哪一類、解決什麼問題（例如 S3 存檔案、RDS 是關聯式資料庫、CloudFront 是 CDN）。
- **Region／AZ 概念**：要「高可用」就想到**跨多個 AZ**；要「就近、低延遲」就想到選對 Region 加邊緣節點。
- **無伺服器（Lambda）的好處**：不用自己管伺服器、按實際用量計費、會自動隨流量伸縮。
- **託管服務減少維運**：像 RDS、DynamoDB 這類**代管／託管服務**，把打補丁、備份、擴充等雜事交給 AWS，讓你少花力氣在維運上。
:::

<Refs title="📚 官方資料與延伸閱讀">

- [AWS 全球基礎建設總覽（Global Infrastructure）](https://aws.amazon.com/about-aws/global-infrastructure/)
- [AWS 雲端產品總覽（所有服務分類）](https://aws.amazon.com/products/)
- [AWS 官方文件入口（Documentation）](https://docs.aws.amazon.com/)
- [AWS 知識中心（Knowledge Center）](https://repost.aws/knowledge-center)
- [AWS Trusted Advisor 總覽](https://aws.amazon.com/premiumsupport/technology/trusted-advisor/)

</Refs>

👉 下一個領域：[帳務、定價與支援](./billing-pricing-support.md)
