---
sidebar_position: 9
title: 原創練習題
---

# Domain 3 原創練習題（仿官方考題風格）

先自己點選答案，再按「**顯示答案與解析**」。本頁對齊 SAA-C03 官方題型：**情境式題幹**、選項皆為合理的 AWS 服務（誘答選項不會明顯錯誤），並刻意用「**最高效能／最低延遲／最少營運負擔／最具成本效益**」這類**限定詞**逼你比較取捨。包含**單選**與**複選（Choose TWO）**兩種題型。題目為**原創**內容（非真實考題）。

<Quiz
  qnum={1}
  total={24}
  question="某新創開發一個圖片上傳後自動產生縮圖的功能。流量極不規律，有時整天沒人用、有時幾分鐘湧入上千張。團隊不想管理任何伺服器，且希望「只為實際用量付費」。最合適的運算方案是？"
  options={[
    '開一台大型 EC2 隨時待命處理',
    '使用 AWS Lambda 由 S3 上傳事件觸發',
    '建立固定數量的 EC2 Auto Scaling 群組',
    '租用預留執行個體（Reserved Instances）',
  ]}
  answer={1}>

**正解：B**

流量不規律、事件驅動、短任務、且「不想管伺服器 + 只為用量付費」——完全是 **Lambda** 的情境，由 S3 上傳事件直接觸發。A 整天閒置仍付費、要自己管機器；C 固定數量無法貼合忽高忽低的流量；D 預留執行個體是成本承諾、更不適合不規律流量。

</Quiz>

<Quiz
  qnum={2}
  total={24}
  question="某企業要把一套需要完整作業系統控制、長時間常駐、並安裝了特殊授權軟體的舊系統搬上雲。負載長期穩定可預測。下列哪個運算選項最合適？"
  options={[
    'AWS Lambda',
    'Amazon EC2',
    'AWS Fargate 無伺服器容器',
    '把程式改寫成 Step Functions',
  ]}
  answer={1}>

**正解：B**

需要「完整 OS 控制 + 長時間常駐 + 特殊授權軟體 + 穩定負載」，**EC2** 是最直接的選擇。Lambda 有 15 分鐘上限、不給 OS 層控制；Fargate 適合已容器化的應用、也不提供完整 OS 控制；Step Functions 是流程編排、非運算環境。

</Quiz>

<Quiz
  qnum={3}
  total={24}
  question="某團隊的應用程式已經容器化，想在 AWS 上跑，但「完全不想管理底層的 EC2 節點、也不想處理修補與擴縮」。最符合需求的做法是？"
  options={[
    '自建 EC2 叢集並手動安裝 Docker',
    '用 ECS 或 EKS 搭配 AWS Fargate 啟動類型',
    '把容器打包成 AMI 直接開 EC2',
    '改用 Lambda 容器映像，單次執行 2 小時',
  ]}
  answer={1}>

**正解：B**

「容器化 + 不想管底層節點」直接對應 **Fargate**（搭配 ECS 或 EKS），由 AWS 管理底層運算、修補與擴縮。A、C 都還要自己管 EC2；D 的 Lambda 單次最長 15 分鐘，無法執行 2 小時。

</Quiz>

<Quiz
  qnum={4}
  total={24}
  question="某金融交易系統的資料庫需要「可持久保留、且提供最高的每秒輸入輸出（IOPS）與最低延遲」。下列哪種儲存最適合？"
  options={[
    'EBS gp3 通用型 SSD',
    'EBS io2 Block Express',
    '執行個體儲存（Instance Store）',
    'EBS st1 吞吐最佳化 HDD',
  ]}
  answer={1}>

**正解：B**

要求「持久 + 最高 IOPS + 最低延遲」→ **io2 Block Express**。gp3 均衡但非頂規 IOPS；執行個體儲存雖 IOPS 極高，但**關機即消失、不持久**，不符合資料庫需求；st1 是 HDD、走吞吐不走 IOPS。

</Quiz>

<Quiz
  qnum={5}
  total={24}
  question="某內容管理系統有數十台 Linux EC2 需要「同時讀寫同一份共享檔案」，且儲存容量要能隨檔案增加自動擴展、免預先配置。應選用哪項服務？（Choose TWO 的敘述中，選出最正確的一項組合描述）"
  options={[
    'Amazon EFS，可被多台 Linux 同時掛載且容量自動擴展',
    '為每台 EC2 各掛一顆獨立的 EBS 磁碟區',
    'Amazon FSx for Lustre 作為一般網站共享碟',
    '把檔案放在執行個體儲存上互相複製',
  ]}
  answer={0}>

**正解：A**

「多台 Linux 同時共享 + 容量自動擴展」正是 **EFS（NFS）** 的定位。B 的 EBS 一般只掛單台、彼此不共享；C 的 FSx for Lustre 是 HPC 高吞吐暫存檔案系統、非一般網站共享；D 執行個體儲存關機即消失且不共享。

</Quiz>

<Quiz
  qnum={6}
  total={24}
  question="一個部署在美國的 S3 儲存貯體，常有位於亞洲與歐洲的使用者要上傳數 GB 的大型檔案，目前上傳又慢又常中斷。下列哪兩項做法最能提升上傳效能與可靠度？（Choose TWO）"
  options={[
    '啟用 S3 Transfer Acceleration，透過邊緣節點加速跨區上傳',
    '對大型檔案使用分段上傳（Multipart Upload）平行傳送',
    '把儲存貯體改成單一前綴以集中流量',
    '改用 S3 Glacier Deep Archive 儲存類別',
    '關閉版本控制以加快寫入',
  ]}
  answer={[0, 1]}>

**正解：A、B**

跨國大檔上傳慢 → **Transfer Acceleration（A）** 走就近邊緣節點加速、**Multipart Upload（B）** 把大檔切段平行上傳並可斷點續傳。C 集中單一前綴反而限制平行度；D Glacier 是封存類別、與上傳速度無關且取回慢；E 版本控制與上傳速度無關。

</Quiz>

<Quiz
  qnum={7}
  total={24}
  question="某機器學習團隊需要一個「極高吞吐、供 HPC 運算節點暫存大量資料集」的共享檔案系統，資料可在工作結束後清除。最適合的服務是？"
  options={[
    'Amazon EFS 標準模式',
    'Amazon FSx for Lustre',
    'Amazon FSx for Windows File Server',
    'EBS sc1 冷儲存 HDD',
  ]}
  answer={1}>

**正解：B**

「HPC + 極高吞吐 + 暫存大型資料集」是 **FSx for Lustre** 的招牌場景（可與 S3 連動）。EFS 吞吐不及 Lustre 等級；FSx for Windows 走 SMB、給 Windows 用；sc1 是最便宜的冷 HDD、吞吐低。

</Quiz>

<Quiz
  qnum={8}
  total={24}
  question="某 Windows 檔案伺服器要搬上 AWS，應用程式依賴 SMB 通訊協定與 Active Directory 整合。下列哪項服務最合適？"
  options={[
    'Amazon EFS',
    'Amazon FSx for Windows File Server',
    'Amazon S3 搭配 File Gateway',
    'EBS 多重掛載（Multi-Attach）',
  ]}
  answer={1}>

**正解：B**

「Windows + SMB + AD 整合」直接對應 **FSx for Windows File Server**。EFS 是 Linux 的 NFS；S3 File Gateway 是混合雲閘道、非原生 Windows 檔案伺服器；EBS Multi-Attach 是區塊儲存、不是 SMB 檔案共享。

</Quiz>

<Quiz
  qnum={9}
  total={24}
  question="某遊戲後端需要一個「可支撐數百萬使用者、以玩家 ID 為鍵做查詢、延遲要穩定在個位數毫秒、且能自動擴展不想管伺服器」的資料庫。最適合的是？"
  options={[
    'Amazon RDS for MySQL 單一執行個體',
    'Amazon DynamoDB',
    '在 EC2 上自建 PostgreSQL',
    'Amazon Redshift',
  ]}
  answer={1}>

**正解：B**

「超大規模 + 鍵值查詢 + 個位數毫秒 + 無伺服器自動擴展」是 **DynamoDB** 的經典場景。RDS 單一執行個體擴展有限；EC2 自建要自己顧一切；Redshift 是資料倉儲、用於分析查詢而非線上高併發鍵值查詢。

</Quiz>

<Quiz
  qnum={10}
  total={24}
  question="某電商的 RDS 資料庫寫入正常，但「大量商品瀏覽（讀取）」在尖峰時把主資料庫拖垮。希望在「最少應用程式改動」下提升讀取效能。最適合的做法是？"
  options={[
    '把 RDS 執行個體換成更大的機型就好',
    '建立 RDS 讀取複本（Read Replica）並把讀取流量導向它',
    '改用 Multi-AZ 部署',
    '為資料庫開啟自動備份',
  ]}
  answer={1}>

**正解：B**

讀取壓力大、要分攤讀取 → **Read Replica** 最對症，應用把讀取查詢指向複本即可。A 垂直擴展有上限、治標；C 的 Multi-AZ 是**高可用**（待命不分攤讀取）；D 備份與效能無關。

</Quiz>

<Quiz
  qnum={11}
  total={24}
  question="某企業要一套「相容 MySQL、但效能與吞吐要遠高於標準 RDS、儲存能自動擴展、並具企業級可用性」的關聯式資料庫。最適合的是？"
  options={[
    'Amazon Aurora（MySQL 相容）',
    'Amazon DynamoDB',
    '在 EC2 上自建 MySQL 叢集',
    'Amazon ElastiCache for Redis',
  ]}
  answer={0}>

**正解：A**

「相容 MySQL + 遠高於 RDS 的效能 + 儲存自動擴展 + 企業級」正是 **Aurora**。DynamoDB 是 NoSQL、非 MySQL 相容；EC2 自建要自己顧擴展與維運；ElastiCache 是快取、不是主資料庫。

</Quiz>

<Quiz
  qnum={12}
  total={24}
  question="某應用程式大量讀取 DynamoDB，相同的熱門項目一直被重複查詢，團隊希望把這些讀取延遲「從毫秒再降到微秒」，且盡量少改程式。最適合的做法是？"
  options={[
    '在前面加一層 Amazon ElastiCache for Memcached',
    '啟用 DynamoDB Accelerator（DAX）',
    '為 DynamoDB 開更多讀取容量單位',
    '把資料改存到 RDS',
  ]}
  answer={1}>

**正解：B**

「專為 DynamoDB、微秒級、少改程式」→ **DAX**，它是 DynamoDB 原生的快取層，API 幾乎相容。用一般 ElastiCache（A）要自己寫快取邏輯、較費工；C 加容量能提升吞吐但延遲仍是毫秒級；D 改 RDS 偏離需求。

</Quiz>

<Quiz
  qnum={13}
  total={24}
  question="某即時排行榜功能需要一個「支援排序結構、具持久化與複製、可當作排行榜與計數器」的記憶體資料儲存。最適合的是？"
  options={[
    'Amazon ElastiCache for Memcached',
    'Amazon ElastiCache for Redis',
    'Amazon DynamoDB 一般資料表',
    'Amazon S3',
  ]}
  answer={1}>

**正解：B**

「排序結構 + 持久化 + 複製 + 排行榜」是 **Redis** 的強項（Sorted Set）。Memcached 只有單純鍵值、無持久化與排序結構；DynamoDB 可做但非記憶體微秒級排行榜最佳解；S3 是物件儲存、不適合即時排行榜。

</Quiz>

<Quiz
  qnum={14}
  total={24}
  question="某媒體網站有大量圖片與影片，使用者遍布全球，常抱怨離來源伺服器遠的地區載入很慢。希望「把可快取的內容送到離使用者最近處」以降低延遲。最適合的服務是？"
  options={[
    'AWS Global Accelerator',
    'Amazon CloudFront',
    'Elastic Load Balancing',
    'AWS Direct Connect',
  ]}
  answer={1}>

**正解：B**

「可快取內容 + 全球就近送達 + 降延遲」是 **CloudFront（CDN）** 的本職，把內容快取到邊緣節點。Global Accelerator 加速的是「連線路徑」、不快取內容，較適合非 HTTP；ELB 是區域內負載平衡；Direct Connect 是專線、非全球內容快取。

</Quiz>

<Quiz
  qnum={15}
  total={24}
  question="某線上遊戲使用自訂的 UDP 通訊協定，需要「全球玩家都能以最低延遲連到最近的 AWS 進入點，並提供固定的靜態 IP 供防火牆白名單」，內容不需快取。最適合的服務是？"
  options={[
    'Amazon CloudFront',
    'AWS Global Accelerator',
    'Amazon Route 53 延遲路由',
    'Application Load Balancer',
  ]}
  answer={1}>

**正解：B**

「非 HTTP（UDP）+ 全球最低延遲路徑 + 固定 anycast 靜態 IP + 不需快取」完全是 **Global Accelerator**。CloudFront 偏 HTTP 內容快取；Route 53 只做 DNS 解析、不走 AWS 骨幹加速連線；ALB 是第 7 層 HTTP、也不給固定 IP。

</Quiz>

<Quiz
  qnum={16}
  total={24}
  question="某公司要處理即時點擊流資料，需求為：「多個不同的下游系統要各自讀取同一份資料、且必須能在數小時內重播（reprocess）」。最適合的服務是？"
  options={[
    'Amazon SQS 標準佇列',
    'Amazon Kinesis Data Streams',
    'Amazon SNS 標準主題',
    'Amazon MQ',
  ]}
  answer={1}>

**正解：B**

「多消費者各自讀同一份 + 可在保留期內重播 + 即時串流」是 **Kinesis Data Streams** 的核心能力。SQS 訊息被一個消費者處理後即刪除、無法重播；SNS 是推播、不保留供重播；Amazon MQ 是傳統訊息中介、非高吞吐串流重播場景。

</Quiz>

<Quiz
  qnum={17}
  total={24}
  question="某團隊想把串流進來的日誌「近乎即時、且免寫程式維運」地自動載入到 Amazon S3 與 Redshift 做後續分析。最適合的服務是？"
  options={[
    'Amazon Kinesis Data Streams 自行寫消費者程式',
    'Amazon Data Firehose（Kinesis Firehose）',
    'Amazon SQS 搭配 Lambda',
    '在 EC2 上自建 ETL 排程',
  ]}
  answer={1}>

**正解：B**

「串流自動入 S3/Redshift + 近即時 + 免寫程式／免管基礎設施」正是 **Firehose** 的定位（全託管、自動批次與傳送）。Data Streams（A）要自己寫消費者；SQS+Lambda（C）要自己開發整合；EC2 自建 ETL（D）營運負擔最高。

</Quiz>

<Quiz
  qnum={18}
  total={24}
  question="某團隊的 DynamoDB 資料表在尖峰時出現節流（throttling），調查發現流量集中打在少數幾個分區鍵值上（熱分區）。下列哪兩項做法最能改善？（Choose TWO）"
  options={[
    '重新設計使用高基數（分散度高）的分區鍵，讓流量平均分布',
    '為熱門讀取加上 DynamoDB Accelerator（DAX）吸收重複查詢',
    '把資料表整個搬到單一分區以簡化管理',
    '改用更長的排序鍵但維持同一個分區鍵',
    '關閉自動擴展以固定容量',
  ]}
  answer={[0, 1]}>

**正解：A、B**

熱分區的根因是分區鍵分散度不足 → **重新設計高基數分區鍵（A）** 讓流量均勻；若是「同樣的熱門項目一直被讀」，**DAX（B）** 可把重複讀取擋在快取層、減輕分區壓力。C 集中單一分區只會更糟；D 不改分區鍵就無法分散；E 關閉自動擴展無助於熱分區。

</Quiz>

<Quiz
  qnum={19}
  total={24}
  question="某應用的讀取流量在尖峰暴增且有大量「重複的相同查詢」拖垮 RDS。團隊希望用「最具成本效益」的組合同時分攤讀取並降低重複查詢的延遲。下列哪兩項最適合？（Choose TWO）"
  options={[
    '建立 RDS 讀取複本分攤讀取流量',
    '在資料庫前加一層 ElastiCache 快取熱門查詢結果',
    '把每個查詢都改走跨 Region 複本',
    '把 RDS 垂直升級到最大機型',
    '為每個使用者建立獨立資料庫',
  ]}
  answer={[0, 1]}>

**正解：A、B**

分攤讀取 → **Read Replica（A）**；降低「重複相同查詢」的延遲與資料庫負載 → 前面加 **ElastiCache 快取（B）**，兩者是最常見且具成本效益的讀取加速組合。C 跨 Region 成本與延遲都不划算；D 垂直升級有上限且昂貴；E 每人一個資料庫不切實際。

</Quiz>

<Quiz
  qnum={20}
  total={24}
  question="某資料分析平台要「每秒攝取數百萬筆遙測事件、吸收突發尖峰、並讓後端批次處理不被打爆」。下列哪個服務最適合作為高吞吐的即時攝取層？"
  options={[
    'Amazon Kinesis Data Streams',
    '直接讓裝置寫入 RDS',
    'Amazon S3 單一前綴逐筆寫入',
    'AWS Config',
  ]}
  answer={0}>

**正解：A**

「每秒數百萬事件 + 吸收尖峰 + 即時攝取 + 讓後端按自己步調處理」是 **Kinesis Data Streams** 的典型用途（以分片擴展吞吐、作為緩衝層）。直接寫 RDS（B）會被尖峰打爆；S3 單一前綴逐筆寫（C）不適合高併發即時攝取；AWS Config 是資源合規稽核、與此無關。

</Quiz>

<Quiz
  qnum={21}
  total={24}
  question="某資安團隊把應用程式的存取日誌每天自動匯入 S3，已累積數 TB。某次事件後，他們只想「臨時用標準 SQL 查一下這些日誌找出可疑 IP」，不想為了查一次就特地建資料庫、也不想管理任何伺服器。最具成本效益的做法是？"
  options={[
    '把 S3 日誌先載入 Amazon RDS 再下 SQL 查詢',
    '使用 Amazon Athena 直接對 S3 的日誌下 SQL 查詢',
    '啟動一個 Amazon Redshift 叢集載入全部日誌後查詢',
    '在 EC2 上自建資料庫並匯入日誌再查詢',
  ]}
  answer={1}>

**正解：B**

「無伺服器、免建資料庫、直接用標準 SQL 查 S3 裡的日誌、只偶爾查一次、按掃描量付費」正是 **Athena** 的招牌場景。A、C、D 都得先把資料搬進某個資料庫或自建環境、還要持續維運與付費，為了偶爾查一次成本與營運負擔都過高；其中 C 的 Redshift 叢集一開著就持續計費，更不划算。

</Quiz>

<Quiz
  qnum={22}
  total={24}
  question="某零售企業的交易全部寫進 Amazon RDS（OLTP），運作正常。現在商業智慧團隊要「針對 PB 級的歷史交易資料跑又大又複雜的彙總報表（OLAP）」，例如過去三年各地區、各品類的營收趨勢。為了不拖垮交易資料庫並取得最佳分析效能，最適合的服務是？"
  options={[
    '直接在正式環境的 RDS 上執行複雜的分析查詢',
    '為 RDS 增設讀取複本（Read Replica）來跑報表',
    '把資料載入 Amazon Redshift 資料倉儲做分析',
    '改用 Amazon DynamoDB 儲存歷史交易以利分析',
  ]}
  answer={2}>

**正解：C**

「PB 級、又大又複雜的分析彙總報表、OLAP」正是雲端資料倉儲 **Redshift** 的定位，採欄式儲存、專為大規模分析設計。A 直接在 OLTP 的 RDS 上跑重分析會拖垮交易；B 的讀取複本仍是列式的 OLTP 引擎、不擅長 PB 級複雜彙總；D 的 DynamoDB 是 NoSQL 鍵值儲存、不適合複雜分析查詢。記住：日常交易用 RDS（OLTP），大規模分析報表用 Redshift（OLAP）。

</Quiz>

<Quiz
  qnum={23}
  total={24}
  question="某資料團隊的原始資料散落在 S3，格式雜亂，必須先「擷取、清理、轉換（ETL）成乾淨格式，並建立一份中繼資料目錄（Data Catalog）供 Athena 與 Redshift 查詢引擎直接使用」。團隊希望全程無伺服器、不要自己管理 ETL 主機。最適合的服務是？"
  options={[
    'AWS Glue',
    'Amazon QuickSight',
    'Amazon Kinesis Data Streams',
    '在 EC2 上自寫批次 ETL 腳本並手動維護結構描述',
  ]}
  answer={0}>

**正解：A**

「無伺服器 ETL（擷取、轉換、載入）＋ 建立資料目錄供查詢引擎使用」正是 **Glue** 的兩大本職：它幫你清理轉換資料，並把中繼資料登記到 Data Catalog，讓 Athena、Redshift 知道怎麼讀資料。B 的 QuickSight 是最後做視覺化儀表板、不做 ETL；C 的 Kinesis 是即時串流攝取、非 ETL 與資料目錄；D 自建腳本營運負擔最高、又得自己維護結構描述。

</Quiz>

<Quiz
  qnum={24}
  total={24}
  question="資料經過整理與分析後，某公司的主管希望「每天打開就能看到一組互動式圖表與儀表板，掌握各地區營收與關鍵指標」，資料來源包含 Athena 與 Redshift。團隊想用無伺服器的方式提供這類商業智慧（BI）視覺化，最少營運負擔。最適合的服務是？"
  options={[
    '把查詢結果匯出成 CSV 再用試算表手動製圖',
    '在 EC2 上自建一套開源 BI 平台並自行維運',
    'Amazon QuickSight',
    'Amazon CloudWatch 儀表板',
  ]}
  answer={2}>

**正解：C**

「把分析結果做成互動式圖表與儀表板給人看、BI 視覺化、無伺服器、可連 Athena 與 Redshift」正是 **QuickSight** 的定位。A 手動製圖費工又無法即時互動；B 自建 BI 平台營運負擔最高；D 的 CloudWatch 儀表板是監控系統指標（CPU、延遲等）用的、不是商業資料的 BI 分析儀表板。

</Quiz>

---

做完了嗎？回去複習 👉 [Domain 3 重點速記 / 閃卡](/saa/domain-3/flashcards)，或前往下一個領域 👉 [Domain 4：設計成本最佳化的架構](/saa/domain-4/)。
