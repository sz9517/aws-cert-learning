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

#### 為什麼選它？優缺點？何時別用？

- **為什麼是它**：當「資料量 ÷ 可用頻寬」算出來要搬好幾週甚至好幾個月，與其讓專線塞車、拖垮正常業務流量，不如把資料灌進實體裝置、用**物流**取代**網路**。本質上是「拿卡車的載貨量去換頻寬的不足」。
- **優點**：不吃對外頻寬、資料量越大越划算、裝置內建**硬體加密（AES-256）**、Snowball Edge 還能在裝置上**就地跑運算／Lambda**（適合工廠、船舶、戰地等斷網邊緣環境先處理再回傳）。
- **缺點**：有**實體等待期**（下訂、收件、灌資料、寄回、AWS 端上傳，通常以**天到週**計）；要人**到現場插拔、搬運**；不適合「要立刻看到資料在雲上」的急件。
- **什麼時候反而別用**：**頻寬其實夠用**（算一下走網路幾小時～一兩天能搬完）時別用 Snow——那是 DataSync 的場子；需要**持續、長期**同步也別用（Snow 是一次性搬運，不是常態管道）。

:::warning[🚑 常踩雷：先算「搬多久」再決定離不離線]
很多人一看到「資料很大」就直覺選 Snow，但**有沒有頻寬**才是關鍵。粗略估算法：**所需時間（小時）≈ 資料量(GB) × 8 ÷ 可用頻寬(Mbps) ÷ 3600**。
- 例：**50 TB**（≈ 51200 GB）走 **1 Gbps（1000 Mbps）**專線 → 約 **114 小時 ≈ 5 天**（理想值，實際更久）→ 這其實**走 DataSync 就好**，不必等實體裝置。
- 例：**500 TB** 走 **100 Mbps** 一般商用網路 → 約 **11000 小時 ≈ 460 天** → 這才是 **Snowball** 的場子。
考試看到數字別只看「大不大」，心裡要能把「資料量 vs 頻寬 vs 可接受時間」快速比一比。
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

#### 為什麼選它？優缺點？何時別用？

- **為什麼是它**：地端機房**不打算退場**，但想「順便用到雲端那幾乎無限大又便宜的儲存」。Storage Gateway 的價值在於**地端應用一行程式都不用改**——它照舊用 NFS／SMB／iSCSI／磁帶這些**熟悉的老介面**，閘道在背後偷偷把資料搬去 S3／Glacier。這是「**不改既有系統就上雲儲存**」的橋樑。
- **優點**：地端**低延遲存取**常用資料（靠本地快取）、無痛接上雲端的耐久性與無限容量、磁帶流程可**原封不動**換成雲端、天然的異地備援。
- **缺點**：地端得**部署並維運一台閘道**（VM 或實體設備）、效能受**地端網路與快取大小**影響、它是**長期共存的通道**而非一次搬完就拆。
- **什麼時候反而別用**：只是想**一次把檔案搬上雲**（搬完地端就不用了）→ 那是 **DataSync**，別架 Storage Gateway；完全**雲原生、沒有地端**要接 → 直接用 S3／EFS 就好，不需要閘道。

## DataSync：線上自動化的「大量檔案快遞」

<Term en="DataSync" desc="AWS 的線上資料傳輸服務，自動、增量、可排程地搬大量檔案到 S3／EFS／FSx。">DataSync</Term> 走的是**線上（online，走網路）**路線，專門做**大量檔案的自動化傳輸**：

- 來源可以是地端的 **NAS／檔案系統**，目的地是 **S3、EFS、FSx** 等。
- **增量**傳輸：第一次搬全量，之後只搬**有變動的部分**，又快又省。
- 可**排程**、自動重試、傳輸中驗證完整性，速度比自己寫 script 搬快很多。
- 適合「**一次性線上遷移**」或「**持續定期同步**」。

:::info[📌 Snow 和 DataSync 怎麼分？]
兩者都在搬大量資料，差別在**離線 vs 線上**：頻寬夠、可以走網路 → **DataSync**；頻寬不足、資料大到走網路要等到天荒地老 → **Snow（離線寄硬碟）**。
:::

#### 為什麼選它？優缺點？何時別用？

- **為什麼是它**：地端有一大包檔案要搬上 S3／EFS／FSx，**頻寬足夠走網路**，但你不想自己寫 `rsync`／script 慢慢搬、還得自己處理斷線重試、增量比對、完整性驗證。DataSync 把這些**全包辦**，而且用加速協定，速度常是手刻 script 的數倍。
- **優點**：**增量同步**（只搬變動的）、自動重試與**傳輸中驗證完整性**、可**排程**定期跑、單一代理可達**約 10 Gbps**吞吐、按搬運量計費單純。
- **缺點**：**吃對外頻寬**（大搬運期間可能影響正常流量，可設頻寬節流）、地端要跑一個 **DataSync agent**（VM）、終究受限於你有多少頻寬。
- **什麼時候反而別用**：頻寬根本不夠、資料大到走網路要幾個月 → 改用 **Snow**；地端要**長期掛著當雲端儲存在用**（而非搬完就結束）→ 那是 **Storage Gateway**。

<Scenario title="動手情境：用 DataSync 把地端 NAS 定期同步到 S3">

目標：每天凌晨把地端 NAS（NFS）上**有變動**的檔案同步到 S3，不影響白天的正常頻寬。大致流程與**預期結果**：

1. 在地端（VMware／Hyper-V／或 EC2）部署 **DataSync agent** → agent 啟動後會拿到一組**啟用金鑰（activation key）**。
2. 在主控台用該金鑰**啟用 agent** → 狀態顯示 **ONLINE** 代表地端已可被 DataSync 控制。
3. 建立兩個 **location**：來源（地端 NFS，填 agent + NFS 路徑）、目的地（S3 貯體）。
4. 建立 **task**，設定選項：開啟「只傳變動（**Transfer only data that has changed**）」、「驗證（**Verify**）」、頻寬上限（如夜間放寬、日間節流）。
5. 用 **EventBridge 排程**每天 02:00 觸發此 task。

```bash
# 以 CLI 手動啟動一次傳輸（驗證設定是否正確）
aws datasync start-task-execution --task-arn arn:aws:datasync:ap-northeast-1:111122223333:task/task-0abc123

# 查看這次執行狀態（會看到 LAUNCHING → PREPARING → TRANSFERRING → VERIFYING → SUCCESS）
aws datasync describe-task-execution \
  --task-execution-arn arn:aws:datasync:ap-northeast-1:111122223333:task/task-0abc123/execution/exec-0def456
```

**預期結果**：第一次跑會搬**全量**、耗時最久；之後每天只搬**新增／修改**的檔案，執行摘要會顯示 `FilesTransferred`、`BytesTransferred` 等數字，狀態最後停在 **SUCCESS**。到 S3 貯體即可看到與 NAS 一致的目錄結構。

</Scenario>

## DMS：資料庫遷移，近乎零停機

<Term en="Database Migration Service" desc="AWS 的資料庫遷移服務，支援同質與異質遷移，可持續複寫做到近乎零停機。">DMS（Database Migration Service）</Term> 專門搬**資料庫**，特色是**近乎零停機**：

- **同質遷移（homogeneous）**：來源和目的地是**同一種引擎**（例如 Oracle → Oracle、MySQL → RDS MySQL），直接搬。
- **異質遷移（heterogeneous）**：來源和目的地是**不同引擎**（例如 Oracle → Aurora），資料表結構、預存程序語法不相容，要先搭配 **SCT（Schema Conversion Tool，結構轉換工具）** 轉換結構，再由 DMS 搬資料。
- **持續複寫（CDC）**：遷移期間來源資料庫**照常運作**，DMS 會持續把新異動同步到目的地，等切換那一刻才停，做到**近乎零停機遷移**。

:::tip[💡 考試重點]
題目出現「**換資料庫引擎**」（例如 Oracle／SQL Server 搬到 Aurora／PostgreSQL）→ 答案是 **DMS + SCT**；同引擎搬、要求**遷移期間不中斷服務** → **DMS（持續複寫）**。
:::

#### 為什麼選它？優缺點？何時別用？

- **為什麼是它**：資料庫不是「把檔案複製過去」就好——它一直在被寫入，直接匯出匯入會**遺漏遷移期間的異動**，要嘛就得長時間停機。DMS 用 **CDC（持續擷取變更）**邊搬邊追，做到**近乎零停機**；配上 **SCT** 還能跨引擎轉換結構，是「**資料庫上雲／換引擎**」的標準答案。
- **優點**：**近乎零停機**（CDC 持續同步到切換前一刻）、**同質／異質**都支援、來源可以是地端或其他雲的資料庫、遷移期間來源**照常服務**。
- **缺點**：**異質**遷移要**先用 SCT 轉結構**，且預存程序／觸發器／自訂函式等複雜物件**常需人工改寫**（SCT 會產出評估報告，標出哪些無法自動轉）；DMS 搬的是**資料**，不會自動搬好所有邏輯物件。
- **什麼時候反而別用**：**同引擎、同版本**又能接受短暫停機 → 直接用該引擎的**原生備份還原／快照**可能更單純；純檔案而非資料庫 → 那是 DataSync／Storage Gateway，不是 DMS。

:::warning[🚑 常踩雷：異質遷移「只開 DMS 不配 SCT」會卡住]
考題最愛的陷阱：**Oracle → Aurora PostgreSQL** 這種**換引擎**的題目，只選「用 DMS 遷移」是**不完整**的——不同引擎的**資料表結構、資料型別、預存程序語法不相容**，必須**先用 SCT 轉換結構**（並處理 SCT 報告標出的無法自動轉項目），再讓 DMS 把資料灌進去。記法：**同引擎只要 DMS；換引擎要 DMS + SCT**。
:::

<Scenario title="動手情境：Oracle 近乎零停機遷移到 Aurora PostgreSQL">

目標：地端 Oracle 訂單庫搬到 Aurora PostgreSQL，**切換前服務不中斷**。大致流程與**預期結果**：

1. 用 **SCT** 連到來源 Oracle，產生**遷移評估報告** → 預期看到「可自動轉換 X%、需人工處理 Y 項」，據此先改寫無法自動轉的預存程序。
2. SCT 把轉換後的**結構（schema）**套用到目標 Aurora PostgreSQL。
3. 建立 DMS **replication instance**（搬資料的工作機）、來源與目標 **endpoint**，各自**測試連線**→ 預期顯示 **successful**。
4. 建立 **migration task**，類型選「**Migrate existing data and replicate ongoing changes（full load + CDC）**」。

```bash
# 啟動遷移任務（全量 + 持續複寫）
aws dms start-replication-task \
  --replication-task-arn arn:aws:dms:ap-northeast-1:111122223333:task:ABCD1234 \
  --start-replication-task-type start-replication

# 觀察任務狀態與進度（看 FullLoadProgressPercent 與 CDC 延遲）
aws dms describe-replication-tasks \
  --filters Name=replication-task-arn,Values=arn:aws:dms:ap-northeast-1:111122223333:task:ABCD1234
```

**預期結果**：任務先跑 **full load**（`FullLoadProgressPercent` 從 0 爬到 100），接著進入 **CDC** 持續把新訂單同步到 Aurora，`CDCLatencySource/Target` 應保持很低（秒級）。等業務低峰、延遲趨近 0 時，把應用程式連線字串切到 Aurora、停掉任務，即完成近乎零停機切換。

</Scenario>

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

### 一張表看懂「四個服務各解決什麼、何時用哪個」

把四個主角並排，用同一組問題拷問，最容易記住取捨：

| | **Snow 家族** | **Storage Gateway** | **DataSync** | **DMS** |
| --- | --- | --- | --- | --- |
| **解決什麼** | 離線搬**大量**資料 | 地端**持續**用雲儲存 | 線上**大量同步**檔案 | **資料庫**遷移（含異質） |
| **離線 / 線上** | 離線（寄實體裝置） | 線上（長期通道） | 線上（走網路） | 線上（走網路） |
| **一次性 / 長期** | 一次性搬運 | **長期共存** | 一次性或定期同步 | 一次性遷移（切換後拆） |
| **搬的是** | 任意檔案／物件 | 檔案／區塊／磁帶 | 檔案（NAS→S3/EFS/FSx） | 資料庫（表、資料列） |
| **最關鍵的判斷字眼** | 「頻寬不足＋PB 級」 | 「地端還要用」「取代磁帶」 | 「定期同步」「線上搬 NAS」 | 「換引擎」「近乎零停機」 |
| **常見搭配** | 內建加密、邊緣運算 | S3／Glacier | EventBridge 排程 | **SCT**（異質時必配） |

**一句話選型口訣**：先問「搬的是**檔案**還是**資料庫**」——資料庫一律先想 **DMS**；是檔案，再問「地端**搬完就不用**還是**長期要接著用**」——長期用是 **Storage Gateway**，搬完就結束再問「**頻寬夠不夠**」——夠就 **DataSync**，不夠就 **Snow**。

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

:::warning[🚑 常踩雷]
- **頻寬夠就別反射性選 Snow**：看到「資料大」別急著選 Snow，**先用「資料量 ÷ 頻寬」估搬運時間**；幾天內能走網路搬完就該選 **DataSync**，Snow 還得等實體裝置來回反而更慢。離線 vs 線上的分水嶺是**頻寬**，不是資料絕對大小。
- **DataSync vs Storage Gateway 最容易搞混**：兩者都跟「地端檔案 + S3」有關，但目的不同——DataSync 是「**把檔案搬過去**」（一次性遷移或定期同步，搬完這件事就結束）；Storage Gateway 是「**地端長期掛著、持續把雲端當儲存在用**」（混合共存，不會拆）。題幹講「**遷移／同步**」選 DataSync；講「**地端還要繼續用／取代磁帶**」選 Storage Gateway。
- **DMS 異質遷移一定要配 SCT**：**換引擎**（Oracle → Aurora 這類）只選「用 DMS」是**錯的／不完整**——結構與語法不相容，要**先 SCT 轉結構**再 DMS 搬資料；**同引擎**遷移才不用 SCT。
- **遷移時間要會估**：別只憑感覺說「很久」。用 **時間(小時) ≈ 資料量(GB) × 8 ÷ 頻寬(Mbps) ÷ 3600** 心算一下；這一步往往就是「選 DataSync 還是 Snow」的決定性依據，考題給了數字就是要你算。
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
