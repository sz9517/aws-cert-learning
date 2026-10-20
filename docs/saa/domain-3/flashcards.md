---
sidebar_position: 8
title: 重點速記 / 閃卡
---

# Domain 3 重點速記 / 閃卡

點一下卡片即可翻開說明。涵蓋 Domain 3 全部主題（運算選型、儲存效能、資料庫選型、快取、內容傳遞、解耦與串流、可擴展模式），考前拿這頁快速複習最有效率。

## 運算選型（EC2／Lambda／容器）

<Flashcards>
  <Flashcard term="EC2 執行個體家族">C 系列＝運算最佳化（高 CPU）；R/X＝記憶體最佳化（大記憶體、資料庫）；I/D＝儲存最佳化（高 IOPS 本機碟）；P/G＝GPU（機器學習、繪圖）。</Flashcard>
  <Flashcard term="何時用 Lambda">短任務、事件驅動、不想管伺服器、按毫秒計費。單次執行上限 15 分鐘、有冷啟動。</Flashcard>
  <Flashcard term="何時用 EC2">需要完整 OS 控制、長時間執行、特殊軟體／授權、可預測的穩定負載。</Flashcard>
  <Flashcard term="Fargate">無伺服器容器：跑 ECS/EKS 但不用自己管理 EC2 節點，按容器用量計費。</Flashcard>
  <Flashcard term="Cluster Placement Group">把執行個體擠在同一機架，取得節點間超低延遲、高網路吞吐——HPC 高效能運算用。</Flashcard>
</Flashcards>

## 儲存效能選型（EBS／執行個體儲存／EFS／FSx）

<Flashcards>
  <Flashcard term="gp3 vs io2">gp3＝通用 SSD，IOPS 與吞吐可獨立設定、性價比高；io2 Block Express＝最高 IOPS／最低延遲，關鍵資料庫用。</Flashcard>
  <Flashcard term="st1 vs sc1">st1＝吞吐最佳化 HDD，大檔循序存取（大數據、日誌）；sc1＝冷儲存 HDD，最便宜、很少存取。</Flashcard>
  <Flashcard term="執行個體儲存 Instance Store">實體連在主機上、極高 IOPS，但執行個體關機／終止就消失＝暫存，不可放要保留的資料。</Flashcard>
  <Flashcard term="EFS">可共享的 NFS 檔案系統，多台 Linux EC2 同時掛載、容量自動擴展。</Flashcard>
  <Flashcard term="FSx">FSx for Windows＝SMB 檔案共享；FSx for Lustre＝HPC／機器學習超高吞吐暫存檔案系統。</Flashcard>
</Flashcards>

## 資料庫選型（RDS／Aurora／DynamoDB）

<Flashcards>
  <Flashcard term="關聯式 vs NoSQL">關聯式＝固定結構＋SQL＋交易（RDS/Aurora）；NoSQL＝彈性結構＋超大規模鍵值查詢（DynamoDB）。</Flashcard>
  <Flashcard term="Aurora">相容 MySQL/PostgreSQL，效能約 RDS 的數倍，儲存自動擴展、6 份複本跨 3 AZ。</Flashcard>
  <Flashcard term="DynamoDB">無伺服器 NoSQL，個位數毫秒延遲、幾乎無限擴展，按用量或預置容量計費。</Flashcard>
  <Flashcard term="Read Replica（效能角度）">把「讀取」流量分攤到複本、減輕主庫壓力——提升讀取吞吐。與 Multi-AZ（高可用）目的不同。</Flashcard>
  <Flashcard term="全球低延遲資料庫">DynamoDB Global Tables／Aurora Global Database＝跨 Region 複製，就近讀取。</Flashcard>
</Flashcards>

## 快取加速（ElastiCache／DAX）

<Flashcards>
  <Flashcard term="為什麼要快取">把熱門資料放記憶體，省去每次打資料庫，延遲從毫秒降到微秒、同時減輕後端壓力。</Flashcard>
  <Flashcard term="Redis vs Memcached">Redis＝支援持久化、複製、排序結構（排行榜）；Memcached＝單純、多執行緒、易水平擴展的物件快取。</Flashcard>
  <Flashcard term="DAX">DynamoDB Accelerator，專為 DynamoDB 的微秒級快取（別用一般 ElastiCache 去快取 DynamoDB）。</Flashcard>
  <Flashcard term="快取策略">Lazy Loading＝用到才載入；Write-Through＝寫入時同步更新快取；用 TTL 控制過期。</Flashcard>
  <Flashcard term="工作階段儲存">把 session 放 ElastiCache，讓多台 EC2 無狀態、可自由擴展。</Flashcard>
</Flashcards>

## 內容傳遞與全球加速（CloudFront／Global Accelerator）

<Flashcards>
  <Flashcard term="CloudFront">CDN：把內容快取到離使用者最近的邊緣節點，加速靜態＋動態內容，可整合 S3／ALB／WAF。</Flashcard>
  <Flashcard term="Global Accelerator">用 AWS 骨幹網路＋anycast 固定 IP 加速連線路徑，適合非 HTTP 的 TCP/UDP（遊戲、VoIP），不做內容快取。</Flashcard>
  <Flashcard term="CloudFront vs GA">CloudFront＝快取「內容」；Global Accelerator＝加速「連線路徑」並給固定 IP。</Flashcard>
  <Flashcard term="S3 + CloudFront">S3 靜態網站／資源用 CloudFront 快取，加速全球存取並省下 S3 傳輸費。</Flashcard>
  <Flashcard term="邊緣節點 Edge Location">分布全球的快取據點，使用者就近取得內容、降低延遲。</Flashcard>
</Flashcards>

## 高效能解耦與資料串流（Kinesis／SQS）

<Flashcards>
  <Flashcard term="為什麼要解耦">用佇列／串流吸收尖峰流量、隔開前後端，後端照自己的速度處理、不被打爆。</Flashcard>
  <Flashcard term="SQS（效能角度）">訊息佇列，一個消費者處理後刪除訊息；吸收尖峰、平滑負載。</Flashcard>
  <Flashcard term="Kinesis Data Streams">即時串流，多個消費者可讀同一份、可重播（保留期內）、用分片 Shard 擴展吞吐。</Flashcard>
  <Flashcard term="Kinesis Data Firehose">近即時把串流資料自動載入 S3／Redshift／OpenSearch，免寫程式。</Flashcard>
  <Flashcard term="Kinesis vs SQS">要「多消費者＋可重播＋排序」→ Kinesis；要「單純任務佇列、處理後刪除」→ SQS。</Flashcard>
</Flashcards>

## 可擴展的網路與儲存模式

<Flashcards>
  <Flashcard term="讀寫分離">寫入走主庫、讀取走 Read Replica，把讀取壓力分散出去。</Flashcard>
  <Flashcard term="分片／分區 Sharding">把資料依鍵分散到多個分區；DynamoDB 用高基數 Partition Key 避免熱分區。</Flashcard>
  <Flashcard term="熱分區 Hot Partition">某個鍵被集中打爆造成瓶頸；解法是設計分散度高的分區鍵。</Flashcard>
  <Flashcard term="S3 請求率">每個前綴 prefix 可達每秒數千請求，用多前綴平行化即可擴展（不再需要隨機 hash 前綴）。</Flashcard>
  <Flashcard term="S3 大檔與跨國加速">Multipart Upload 分段平行上傳大檔；Transfer Acceleration 走邊緣節點加速跨區上傳。</Flashcard>
</Flashcards>

---

複習完了？來測驗自己 👉 [Domain 3 原創練習題](/saa/domain-3/quiz)，或回頭看 [服務比較與考前速查](/saa/domain-3/comparison)。
