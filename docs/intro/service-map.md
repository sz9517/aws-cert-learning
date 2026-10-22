---
sidebar_position: 6
title: 主要服務地圖：一頁看懂常用服務
---

# 主要服務地圖：一頁看懂常用服務

> AWS 有上百種服務，光看名字就讓人頭暈。別急，新手不用全記——先認得各「大類的主角」就好。

<Analogy title="🛒 比喻：第一次逛大賣場，先認得各區就夠了">

第一次走進一家超大的賣場，架上商品有好幾萬種，你不可能一次記住。但你很快就會發現，賣場其實分成幾個大區：**生鮮區**、**日用品區**、**冷凍食品區**、**3C 家電區**……

只要先知道「要買菜去生鮮區、要買衛生紙去日用品區」，你就不會迷路了。

AWS 也一樣。它的服務可以分成幾個大類（運算、儲存、資料庫、網路、安全……），**每一類都有幾個「主角」服務**。你現在要做的，不是背完上百個服務，而是先認得「哪一類在解決什麼問題、裡面的主角是誰」。這樣看題目、做架構時，你才找得到正確的那一區。

</Analogy>

:::note[💬 怎麼用這一頁]
下面每一大類配一張表，欄位是「**服務 ｜ 白話一句 ｜ 典型用途**」。現在只要「有印象」就好，不必強記細節；之後每個服務在本站都有專篇深入。遇到不熟的縮寫，也可以隨時查 [名詞與服務對照表](/glossary)。
:::

## 🖥️ 運算（Compute）：程式「跑在哪裡」

你的網站、App、後端程式總要有東西幫你執行——這就是運算類在解決的問題。從「租一整台電腦」到「連機器都不用管」，有不同的選擇。

| 服務 | 白話一句 | 典型用途 |
| --- | --- | --- |
| **<Term en="Elastic Compute Cloud" desc="AWS 上租來的一台雲端伺服器，程式跑在上面。">EC2</Term>** | 租一整台雲端伺服器，自己裝環境 | 需要完整掌控作業系統、長時間執行的傳統應用 |
| **<Term en="AWS Lambda" desc="無伺服器運算，事件觸發、按毫秒計費。">Lambda</Term>** | 不用管伺服器，寫一段程式、有事件就跑 | 偶發、事件驅動的小工作（上傳檔案後自動處理） |
| **<Term en="Elastic Container Service / Elastic Kubernetes Service" desc="AWS 的容器編排服務，EKS 是託管的 Kubernetes。">ECS／EKS</Term>** | 幫你調度一堆「容器」的指揮中心 | 用 Docker／Kubernetes 部署的微服務 |
| **<Term en="AWS Fargate" desc="無伺服器容器引擎，跑容器但免管底層主機。">Fargate</Term>** | 跑容器但「連主機都不用顧」 | 想用容器又不想管底層 EC2 節點 |
| **<Term en="Auto Scaling" desc="依流量自動增減伺服器數量。">Auto Scaling</Term>** | 流量大就自動加機器、流量小就收回 | 應付尖峰流量、又在離峰時省錢 |

:::tip[💡 怎麼選]
一句話記：**要完整控制選 EC2、偶發小工作選 Lambda、用容器選 ECS／EKS（搭 Fargate 免顧主機）**。這是高效能與成本領域的常考取捨。
:::

## 💾 儲存（Storage）：檔案「放在哪裡」

資料總要有地方存。不同的存法差在：是放檔案、還是接在伺服器上的硬碟、能不能多台共用、以及「多久拿一次」。

| 服務 | 白話一句 | 典型用途 |
| --- | --- | --- |
| **<Term en="Simple Storage Service" desc="AWS 的雲端檔案倉庫，放圖片、備份、報表等。">S3</Term>** | 幾乎無限大的雲端檔案倉庫 | 放圖片、影片、備份、網站靜態檔、資料湖 |
| **<Term en="Elastic Block Store" desc="接在單一 EC2 上的雲端硬碟。">EBS</Term>** | 掛在一台 EC2 上的「雲端硬碟」 | 給 EC2 當系統碟或資料碟（綁單一可用區） |
| **<Term en="Elastic File System" desc="可多台同時掛載共享的檔案系統。">EFS</Term>** | 多台伺服器可同時共用的網路硬碟 | 多台 EC2 需要讀寫同一份檔案（Linux） |
| **<Term en="Amazon FSx" desc="託管的檔案系統家族，支援 Windows SMB、Lustre 等。">FSx</Term>** | 針對特定系統的進階共享檔案系統 | Windows 檔案共享（SMB）、高效能運算（Lustre） |
| **<Term en="S3 Glacier" desc="超便宜的封存儲存，取回較慢。">Glacier</Term>** | 超便宜的「冷凍庫」，很少拿才用 | 法規封存、長期備份，可接受幾分鐘到數小時取回 |

:::info[🔑 一個關鍵差異]
**EBS 一次只黏一台 EC2（像外接硬碟），EFS 可以多台同時掛載共享（像網路磁碟機）。** 題目要「多台共用」就選 EFS，這組對比很常考。
:::

## 🗄️ 資料庫（Database）：有結構的資料放哪、怎麼查

檔案倉庫（S3）適合放整包檔案，但要「一筆一筆查、關聯、交易」就得用資料庫。重點在：是傳統的表格式（關聯式），還是講究極速與彈性的 NoSQL。

| 服務 | 白話一句 | 典型用途 |
| --- | --- | --- |
| **<Term en="Relational Database Service" desc="代管式關聯式資料庫，如 MySQL、PostgreSQL。">RDS</Term>** | 代管的傳統表格式資料庫，免自己維運 | MySQL／PostgreSQL 等一般商業應用的主資料庫 |
| **<Term en="Amazon Aurora" desc="AWS 自研、相容 MySQL/PostgreSQL 的高效能資料庫。">Aurora</Term>** | RDS 的加強版，更快、儲存自動長大 | 需要高效能、高可用的關聯式資料庫 |
| **<Term en="Amazon DynamoDB" desc="無伺服器 NoSQL，個位數毫秒延遲、幾乎無限擴展。">DynamoDB</Term>** | 免管機器的超快 NoSQL 資料庫 | 大流量、低延遲的場景（遊戲、購物車、IoT） |
| **<Term en="Amazon ElastiCache" desc="託管的記憶體快取服務，支援 Redis、Memcached。">ElastiCache</Term>** | 放在記憶體裡的「快取」，加速查詢 | 把熱門查詢結果暫存起來，減輕資料庫負擔 |

:::tip[💡 怎麼選]
**要關聯、交易、SQL → RDS／Aurora；要極致速度與彈性、資料結構單純 → DynamoDB；想讓查詢更快 → 前面加一層 ElastiCache 快取。**
:::

## 🌐 網路與傳遞（Networking & Delivery）：流量怎麼進來、怎麼送達

使用者要連得到你的服務、流量要分得均勻、全球都要連得快——這一類就是在處理「網路與內容傳遞」。

| 服務 | 白話一句 | 典型用途 |
| --- | --- | --- |
| **<Term en="Virtual Private Cloud" desc="你在 AWS 裡的私人虛擬網路。">VPC</Term>** | 你在 AWS 裡自己的私人網路 | 隔離資源、設定子網路與防火牆（所有架構的底座） |
| **<Term en="Amazon Route 53" desc="AWS 的 DNS 服務，把網域解析到資源。">Route 53</Term>** | AWS 的 DNS，把網域名稱指到你的資源 | 網域解析、健康檢查、各種流量路由策略 |
| **<Term en="Amazon CloudFront" desc="內容傳遞網路（CDN），把內容快取到全球邊緣節點。">CloudFront</Term>** | 把內容快取到全球各地，就近送達 | 加速全球使用者載入圖片、影片、網站 |
| **<Term en="Elastic Load Balancing" desc="負載平衡器，把流量分散到多台後端。">ELB</Term>** | 把進來的流量平均分給多台伺服器 | 高可用：避免單一台塞爆，搭配 Auto Scaling |
| **<Term en="Amazon API Gateway" desc="託管的 API 入口，負責收 API 請求並轉給後端。">API Gateway</Term>** | 幫你管理 API 的「大門與收費站」 | 對外提供 API，常搭配 Lambda 做無伺服器後端 |

:::info[🏗️ 先有地、才能蓋房]
**VPC 是所有東西的「地基」**——EC2、RDS 等多數資源都住在 VPC 裡。先理解 VPC，後面的網路題才不會卡住。
:::

## 🔐 安全與身分（Security & Identity）：誰能進、資料怎麼保護

雲端上安全是第一要務。這一類處理「身分與權限」「加密」「防攻擊」三件事，考試與實務都極度重視。

| 服務 | 白話一句 | 典型用途 |
| --- | --- | --- |
| **<Term en="Identity and Access Management" desc="管理誰能對哪些資源做哪些操作的門禁系統，免費。">IAM</Term>** | 門禁系統：誰能對哪些資源做哪些事 | 建立使用者、角色、權限政策（安全的根基，免費） |
| **<Term en="Key Management Service" desc="集中管理加密金鑰的金鑰保險箱。">KMS</Term>** | 集中保管加密金鑰的「保險箱」 | 替 S3、EBS、RDS 等資料加密與管理金鑰 |
| **<Term en="AWS Secrets Manager" desc="安全存放並自動輪替密碼、API 金鑰等機密。">Secrets Manager</Term>** | 安全存放密碼、金鑰，還能自動換新 | 保管資料庫密碼、API 金鑰，避免寫死在程式裡 |
| **<Term en="Web Application Firewall / AWS Shield" desc="WAF 阻擋惡意網路請求，Shield 防 DDoS 攻擊。">WAF／Shield</Term>** | 擋網路攻擊的防火牆與防洪閘 | WAF 擋惡意請求、Shield 擋 DDoS 流量攻擊 |
| **<Term en="Amazon GuardDuty" desc="自動偵測帳號內可疑活動的威脅偵測服務。">GuardDuty</Term>** | 24 小時自動盯哨的「保全監視器」 | 智慧偵測可疑登入、異常行為等資安威脅 |

:::tip[💡 考試常客]
**IAM 幾乎是每場考試的頭號主題**，而「資料加密找 KMS」「密碼別寫死、改用 Secrets Manager」也是高頻考點。
:::

## 📊 監控與管理（Monitoring & Management）：系統健不健康、誰動了什麼

東西上線後，你得知道它跑得好不好、有沒有人亂動設定、出事能不能追查——這一類就是你的「儀表板與行車記錄器」。

| 服務 | 白話一句 | 典型用途 |
| --- | --- | --- |
| **<Term en="Amazon CloudWatch" desc="收集指標、日誌並觸發告警的監控服務。">CloudWatch</Term>** | 系統的「儀表板」：看指標、日誌、告警 | 監控 CPU／流量、設定告警、觸發 Auto Scaling |
| **<Term en="AWS CloudTrail" desc="記錄帳號內所有 API 操作的稽核日誌。">CloudTrail</Term>** | 「行車記錄器」：誰在何時做了什麼 | 稽核、追查「是誰刪了這台機器」等操作 |
| **<Term en="AWS Config" desc="追蹤資源設定變更並檢查是否合規。">Config</Term>** | 盯著資源設定有沒有偏離規範 | 記錄設定變更、檢查資源是否符合合規規則 |
| **<Term en="AWS Systems Manager" desc="集中管理、修補、操作大量 EC2 與資源的工具箱。">Systems Manager</Term>** | 一次管理一大批機器的「遙控器」 | 批次修補更新、免 SSH 登入下指令、存參數 |

:::info[🔍 容易搞混的一組]
**CloudWatch 看「系統表現好不好」（指標、日誌）；CloudTrail 看「誰做了什麼操作」（稽核）。** 一個像儀表板，一個像行車記錄器，別搞反了。
:::

## 💰 成本與治理（Cost & Governance）：帳單怎麼看、多帳號怎麼管

用雲端最怕「月底帳單嚇一跳」。這一類幫你看懂花費、設預算警報，並在公司有多個帳號時統一治理。

| 服務 | 白話一句 | 典型用途 |
| --- | --- | --- |
| **<Term en="AWS Cost Explorer" desc="視覺化分析花費趨勢的工具。">Cost Explorer</Term>** | 把花費畫成圖表，看錢花在哪 | 分析成本趨勢、找出最燒錢的服務 |
| **<Term en="AWS Budgets" desc="對成本或用量設門檻並告警。">Budgets</Term>** | 設預算上限，快超過就通知你 | 「這個月別超過 X 元」的預算警報 |
| **<Term en="AWS Organizations" desc="集中管理多個 AWS 帳號的服務。">Organizations</Term>** | 用一個總部管理旗下多個帳號 | 多帳號統一治理、合併帳單、套用全域政策 |
| **<Term en="AWS Trusted Advisor" desc="自動檢查帳號並提出最佳化建議的顧問。">Trusted Advisor</Term>** | 幫你健檢、給省錢與安全建議的顧問 | 找出閒置資源、安全漏洞、可省成本之處 |

:::tip[💡 新手最實用]
剛開始玩 AWS，**先設一個 Budgets 預算告警**，就不怕忘了關機器導致帳單爆掉——這是本站最推薦的第一個保命設定。
:::

## 小結：先認得「區」，再深入「貨」

恭喜你，現在你已經有了一張 AWS 的「服務地圖」。回想一下賣場的比喻：你不需要記住每一樣商品，但你已經知道**要解決哪種問題，該走到哪一區、找哪位主角**。

這七大類的每個主角，在本站各考試領域都會有專篇深入講解——運算、儲存、資料庫在高效能架構領域，網路與安全在安全與高可用領域，成本與治理在成本最佳化領域，都會帶你從「為什麼需要」一路理解到「實際怎麼用」。先有這張地圖打底，之後學每個服務都會更有方向。

👉 下一篇：[建立 AWS 帳號與安全初始設定](./create-account.md)
