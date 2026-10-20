---
sidebar_position: 4
title: 名詞與服務對照表
sidebar_label: 📖 名詞與服務對照表
---

# 名詞與服務對照表

不確定某個縮寫是什麼？在這裡查。格式為 **縮寫 ｜ 英文全名 ｜ 白話說明**。

## 核心服務

| 縮寫 | 英文全名 | 白話說明 |
| --- | --- | --- |
| **EC2** | Elastic Compute Cloud | AWS 上租來的一台雲端伺服器，程式跑在上面。 |
| **S3** | Simple Storage Service | AWS 的雲端檔案倉庫，放圖片、備份、報表等檔案。 |
| **IAM** | Identity and Access Management | 管理「誰能對哪些資源做哪些操作」的門禁系統，免費。 |
| **KMS** | Key Management Service | 集中管理加密金鑰的「金鑰保險箱」。 |
| **RDS** | Relational Database Service | 代管式關聯式資料庫（MySQL、PostgreSQL 等）。 |
| **VPC** | Virtual Private Cloud | 你在 AWS 裡的私人虛擬網路。 |

## 常見觀念

| 名詞 | 白話說明 |
| --- | --- |
| **Root 使用者** | 帳號的最高權限擁有者，只用於初始設定。 |
| **MFA** | 多因素驗證，登入時多一道動態密碼。 |
| **最小權限原則** | 只給剛好夠用的權限，是安全設計的核心。 |
| **可用區（AZ）** | 同一區域內彼此獨立的機房，用於高可用設計。 |
| **Pay-as-you-go** | 用多少付多少的計費方式。 |

## Domain 2：彈性與高可用

| 縮寫／名詞 | 英文全名 | 白話說明 |
| --- | --- | --- |
| **ELB** | Elastic Load Balancing | 負載平衡器的總稱，把流量分散到多台後端。 |
| **ALB** | Application Load Balancer | 第 7 層（HTTP/HTTPS）負載平衡器，可依路徑／網域分流，適合網站與微服務。 |
| **NLB** | Network Load Balancer | 第 4 層（TCP/UDP）負載平衡器，超高效能、可給固定靜態 IP。 |
| **GWLB** | Gateway Load Balancer | 串接第三方網路設備（防火牆、IDS/IPS）用。 |
| **ASG** | Auto Scaling Group | 依流量自動增減 EC2 數量的群組，維持 min／desired／max。 |
| **SQS** | Simple Queue Service | 訊息佇列，消費者主動拉取，用來緩衝與削峰、解耦前後端。 |
| **SNS** | Simple Notification Service | 發布／訂閱服務，一則訊息推播給多個訂閱者（扇出）。 |
| **DLQ** | Dead-Letter Queue | 死信佇列，收容多次處理失敗的訊息，避免卡住主佇列。 |
| **Route 53** | — | AWS 的 DNS 服務，把網域名稱解析到資源，並支援多種路由策略。 |
| **RPO** | Recovery Point Objective | 復原點目標：能容忍遺失多少「資料」（時間長度）。 |
| **RTO** | Recovery Time Objective | 復原時間目標：能容忍多久「無法服務」。 |
| **Multi-AZ** | — | 跨可用區同步備援，主庫故障自動容錯移轉；用於高可用（不分擔讀取）。 |
| **Read Replica** | — | 唯讀複本，非同步複寫、可跨區，用於分攤讀取流量（非高可用方案）。 |
| **CRR** | Cross-Region Replication | S3 跨區域自動複寫，用於異地備援。 |
| **EFS** | Elastic File System | 可多個可用區共享掛載的檔案系統（EBS 則綁單一 AZ）。 |

## Domain 3：高效能架構

| 縮寫／名詞 | 英文全名 | 白話說明 |
| --- | --- | --- |
| **EC2** | Elastic Compute Cloud | 虛擬伺服器，租一整台機器，需完整 OS 控制／長時間執行時選它。 |
| **Lambda** | AWS Lambda | 無伺服器運算，事件觸發、按執行毫秒計費，單次最長 15 分鐘。 |
| **Fargate** | AWS Fargate | 無伺服器容器引擎，跑 ECS／EKS 但免管底層 EC2 節點。 |
| **ECS / EKS** | Elastic Container Service／Elastic Kubernetes Service | AWS 的容器編排服務（EKS 為託管 Kubernetes）。 |
| **Placement Group** | — | 執行個體擺放策略；cluster 擠同機架取得超低延遲，用於 HPC。 |
| **EBS** | Elastic Block Store | 持久區塊儲存；gp3 均衡、io2 最高 IOPS、st1 吞吐、sc1 冷儲存。 |
| **Instance Store** | — | 實體直連的暫存碟，IOPS 極高但關機即消失（不持久）。 |
| **FSx** | Amazon FSx | 託管檔案系統家族；for Windows 走 SMB、for Lustre 供 HPC 高吞吐。 |
| **RDS** | Relational Database Service | 託管關聯式資料庫（MySQL／PostgreSQL 等）。 |
| **Aurora** | Amazon Aurora | 相容 MySQL／PostgreSQL、效能數倍於 RDS、儲存自動擴展。 |
| **DynamoDB** | Amazon DynamoDB | 無伺服器 NoSQL，個位數毫秒延遲、近乎無限擴展。 |
| **DAX** | DynamoDB Accelerator | DynamoDB 專用的微秒級記憶體快取。 |
| **ElastiCache** | Amazon ElastiCache | 託管記憶體快取；Redis 功能豐富／可持久，Memcached 單純多執行緒。 |
| **CloudFront** | — | CDN，把內容快取到邊緣節點，加速全球存取。 |
| **Global Accelerator** | — | 用 AWS 骨幹＋anycast 固定 IP 加速連線路徑，適合非 HTTP 的 TCP/UDP。 |
| **Kinesis Data Streams** | — | 即時串流，多消費者可讀同一份、可重播，以分片擴展吞吐。 |
| **Firehose** | Amazon Data Firehose | 近即時把串流自動載入 S3／Redshift／OpenSearch，免寫程式。 |
| **Shard** | — | Kinesis 串流的吞吐擴展單位（分片）。 |
| **Partition Key** | — | DynamoDB 用來分散資料的鍵，基數要高才能避免熱分區。 |
| **Hot Partition** | — | 流量集中打在少數鍵造成的瓶頸（熱分區）。 |
| **Multipart Upload** | — | 把大型檔案切段平行上傳 S3，可斷點續傳。 |
| **Transfer Acceleration** | — | S3 透過邊緣節點加速跨區域上傳。 |

:::tip
這張表會隨著各領域內容增加而持續擴充。
:::
