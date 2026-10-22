---
sidebar_position: 6.5
title: 遷移與混合雲：Snow、Storage Gateway、DataSync、DMS
---

# 遷移與混合雲：把資料搬上雲，或讓地端與雲共存

> 企業上雲，最常卡住的不是程式，而是「**那一大堆既有資料和資料庫怎麼搬上去**」，或是「**地端機房還要用，但想順便接雲端儲存**」。這篇把考試最常考的四組工具與它們的選型講清楚：離線搬運的 **Snow 家族**、混合儲存的 **Storage Gateway**、線上傳檔的 **DataSync**、以及資料庫遷移的 **DMS**。

:::note[💬 閱讀小提示]
看到帶<Term desc="滑鼠移上去（手機點一下）會跳出白話解釋。">虛線底線的名詞</Term>把滑鼠移上去就有白話解釋，也可查 [名詞與服務對照表](/glossary)。
:::

## 先分兩種情境

遷移題的第一步，是先認出題目要的是哪一種：

- **搬家型（Migration）**：把地端的資料或資料庫**搬上雲**，搬完就結束（也可能持續同步）。要分辨是**離線**搬（實體裝置）還是**線上**搬（走網路）。
- **混合型（Hybrid）**：地端機房**繼續存在**，但要和雲端**長期共存**、無縫互通，讓地端應用也能用到雲端儲存。

<Analogy title="📦 生活比喻：搬家的三種方式">

想像你要把一整間倉庫的東西搬到新家（雲端）：

- 東西太多、網路太慢 → 直接租一台**貨櫃卡車**裝一裝開過去（**Snow 家族**，離線搬）。
- 東西沒那麼多、網路夠用 → 請**宅配天天幫你送、還會自動只送有變動的新東西**（**DataSync**，線上搬）。
- 舊家不打算退租，想把舊家的櫃子直接接到新家的大倉庫當延伸空間 → **Storage Gateway**（混合儲存）。
- 搬的是一整套「**帳本系統**」（資料庫），而且想換一本不同格式的新帳本 → **DMS**（＋格式轉換工具 SCT）。

</Analogy>

## Snow 家族：離線搬大量資料的「實體硬碟宅配」

當資料量是 **TB 到 PB 級**、而且**頻寬不足或走網路要搬好幾個月**時，與其苦等上傳，不如把資料裝進 AWS 寄來的實體裝置，再**寄回 AWS 由他們上傳**。這就是 Snow 家族，重點是**離線（offline）**。

| 裝置 | 容量級距 | 白話定位 |
| --- | --- | --- |
| **Snowcone** | 小（約數 TB） | 最小、最輕便，可帶到現場、甚至邊緣運算 |
| **Snowball Edge** | 大（約數十 TB 以上） | 主力選項，搬**大量資料**還能就地做運算 |
| **Snowmobile** | EB 級（一整台貨櫃卡車） | 超大規模專用；**已淘汰**，考試大多只當歷史背景帶過 |

:::tip[💡 怎麼記]
Snow 的關鍵字是「**離線實體裝置 + 資料量大 + 頻寬不足**」。題目只要同時出現「**PB 級資料**」和「**網路頻寬有限／上傳要好幾週、好幾個月**」，答案幾乎都是 **Snowball（Edge）**。
:::

## Storage Gateway：讓地端應用「無縫用雲端儲存」

<Term en="Storage Gateway" desc="裝在地端的閘道，讓地端應用用熟悉的介面（檔案、區塊、磁帶）直接存取 AWS 雲端儲存。">Storage Gateway</Term> 是**混合儲存**的代表：在地端裝一個閘道，地端應用照舊用熟悉的介面（檔案、區塊、磁帶）操作，背後資料其實存到 AWS 雲端。它有三種型態：

- **File Gateway（檔案閘道）**：地端用 **NFS／SMB** 介面像存取一般網路磁碟那樣讀寫，資料實際存到 **S3**。適合把檔案共享延伸上雲。
- **Volume Gateway（磁碟區閘道）**：提供 **iSCSI 區塊**儲存，備份到 S3（以 EBS 快照形式）。
  - **cached（快取模式）**：主要資料放雲端，地端只留常用資料的快取（省地端空間）。
  - **stored（儲存模式）**：主要資料留在地端，雲端當非同步備份（低延遲、就地保留全量）。
- **Tape Gateway（磁帶閘道）**：模擬一座**虛擬磁帶櫃（VTL）**，讓既有備份軟體以為自己還在寫**磁帶**，實際存到 S3／S3 Glacier。用來**取代實體磁帶**備份流程。

:::tip[💡 考試重點]
看到「地端**既有備份軟體／想取代實體磁帶**、備份上雲」→ **Tape Gateway**；看到地端要以 **NFS／SMB 檔案**介面用 S3 → **File Gateway**；看到要 **iSCSI 區塊**裝置 → **Volume Gateway**。
:::

## DataSync：線上自動化的「大量檔案快遞」

<Term en="DataSync" desc="AWS 的線上資料傳輸服務，自動、增量、可排程地搬大量檔案到 S3／EFS／FSx。">DataSync</Term> 走的是**線上（online，走網路）**路線，專門做**大量檔案的自動化傳輸**：

- 來源可以是地端的 **NAS／檔案系統**，目的地是 **S3、EFS、FSx** 等。
- **增量**傳輸：第一次搬全量，之後只搬**有變動的部分**，又快又省。
- 可**排程**、自動重試、傳輸中驗證完整性，速度比自己寫 script 搬快很多。
- 適合「**一次性線上遷移**」或「**持續定期同步**」。

:::info[📌 Snow 和 DataSync 怎麼分？]
兩者都在搬大量資料，差別在**離線 vs 線上**：頻寬夠、可以走網路 → **DataSync**；頻寬不足、資料大到走網路要等到天荒地老 → **Snow（離線寄硬碟）**。
:::

## DMS：資料庫遷移，近乎零停機

<Term en="Database Migration Service" desc="AWS 的資料庫遷移服務，支援同質與異質遷移，可持續複寫做到近乎零停機。">DMS（Database Migration Service）</Term> 專門搬**資料庫**，特色是**近乎零停機**：

- **同質遷移（homogeneous）**：來源和目的地是**同一種引擎**（例如 Oracle → Oracle、MySQL → RDS MySQL），直接搬。
- **異質遷移（heterogeneous）**：來源和目的地是**不同引擎**（例如 Oracle → Aurora），資料表結構、預存程序語法不相容，要先搭配 **SCT（Schema Conversion Tool，結構轉換工具）** 轉換結構，再由 DMS 搬資料。
- **持續複寫（CDC）**：遷移期間來源資料庫**照常運作**，DMS 會持續把新異動同步到目的地，等切換那一刻才停，做到**近乎零停機遷移**。

:::tip[💡 考試重點]
題目出現「**換資料庫引擎**」（例如 Oracle／SQL Server 搬到 Aurora／PostgreSQL）→ 答案是 **DMS + SCT**；同引擎搬、要求**遷移期間不中斷服務** → **DMS（持續複寫）**。
:::

## 順帶一提：AWS Transfer Family

如果地端或合作夥伴習慣用 **SFTP／FTPS／FTP** 傳檔，**AWS Transfer Family** 提供**代管的 SFTP/FTPS/FTP 端點**，檔案直接落地到 **S3**（或 EFS），不用自己維護檔案傳輸伺服器。考試偶爾會以「要保留既有 SFTP 流程、又想把檔案存到 S3」的角度出現。

## 選型決策表（一眼挑對工具）

| 你的情境 | 選這個 | 關鍵理由 |
| --- | --- | --- |
| 資料量大（TB～PB）＋**頻寬不足**＋可離線 | **Snow（Snowball Edge）** | 走網路太久，直接寄實體裝置 |
| 地端機房**持續要用**雲端檔案／區塊／磁帶 | **Storage Gateway** | 混合儲存，地端介面無縫接雲 |
| **線上**搬／定期同步大量檔案（NAS ↔ S3/EFS/FSx） | **DataSync** | 增量、排程、自動化、快 |
| 搬**資料庫**（尤其**換引擎**） | **DMS（＋SCT）** | 同質／異質皆可，近乎零停機 |
| 要保留既有 **SFTP／FTPS** 流程傳檔到 S3 | **Transfer Family** | 代管檔案傳輸端點 |

## 實務應用：不只是考試

<Scenario title="真實情境：一次把三種搬遷都遇上">

你接手一間公司的上雲專案，老闆丟來三件事：(1) 機房有 **200TB** 歷史影片要上雲，公司**對外頻寬只有一般商用網路**；(2) 地端的備份系統**還在用實體磁帶**，想換成上雲但不想改備份軟體；(3) 一套 **Oracle** 訂單資料庫要搬到 **Aurora**，而且**不能停機太久**。

對照上面的決策表：第 (1) 題資料大又頻寬不足 → **Snowball Edge** 離線寄；第 (2) 題想沿用備份軟體又取代磁帶 → **Tape Gateway**；第 (3) 題換引擎又要少停機 → **DMS + SCT** 搭配持續複寫。三題各有最佳解，這正是考試最愛考的「情境對工具」。

</Scenario>

## 常見考題角度整理

| 題目描述關鍵字 | 正解 |
| --- | --- |
| PB 級資料、頻寬不夠、上傳要好幾個月 | **Snowball（Edge）** |
| 地端備份想上雲、**取代實體磁帶**、沿用既有備份軟體 | **Tape Gateway** |
| 把地端 **NFS／檔案系統定期同步**到 S3 | **DataSync** |
| **Oracle 搬到 Aurora**（換引擎、少停機） | **DMS + SCT** |
| 地端要用 **NFS／SMB** 介面存取 S3 | **File Gateway** |

:::warning[🚑 容易混淆的地方]
- **Snow vs DataSync**：差在**離線 vs 線上**（頻寬夠不夠）。
- **DataSync vs Storage Gateway**：DataSync 是「**把檔案搬過去**」（遷移／同步）；Storage Gateway 是「**地端長期接著用**雲端儲存」（混合共存）。
- **DMS 什麼時候要 SCT**：只有**異質（換引擎）**才需要 SCT；同引擎遷移不用。
:::

<Refs title="📚 官方資料與延伸閱讀">

- [AWS Snow 家族（AWS Snow Family）](https://docs.aws.amazon.com/snowball/)
- [AWS Storage Gateway 使用者指南](https://docs.aws.amazon.com/storagegateway/latest/userguide/WhatIsStorageGateway.html)
- [AWS DataSync 使用者指南](https://docs.aws.amazon.com/datasync/latest/userguide/what-is-datasync.html)
- [AWS Database Migration Service（DMS）](https://docs.aws.amazon.com/dms/latest/userguide/Welcome.html)
- [AWS Schema Conversion Tool（SCT）](https://docs.aws.amazon.com/SchemaConversionTool/latest/userguide/CHAP_Welcome.html)
- [AWS Transfer Family](https://docs.aws.amazon.com/transfer/latest/userguide/what-is-aws-transfer-family.html)

</Refs>

## 下一步

- ⚡ 快速複習：[Domain 2 重點速記 / 閃卡](/saa/domain-2/flashcards)
- ✍️ 測試自己：[Domain 2 原創練習題](/saa/domain-2/quiz)
- 📖 下一篇：[資料庫與儲存的高可用](/saa/domain-2/database-ha)
