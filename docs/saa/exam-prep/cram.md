---
sidebar_position: 1
title: 考前衝刺重點
---

# 考前衝刺重點（關鍵字速查）

這一頁是你考前一天的「**最後一哩**」速查：四大領域都讀完了，這裡把最常考、最會搞混的重點濃縮成一頁，讓你在進考場前快速掃過。核心用法只有一個——**看到題幹的關鍵字，直接對應到答案方向**，不用再從頭推理。

:::tip 考前心法
SAA-C03 幾乎都是**情境選型題**：給你一段業務情境，四個選項常常「每個都能動」，真正逼你選的是題幹裡的**限定詞**（最省錢、最少維運、最高可用、即時…）。先圈出限定詞，再回頭刪選項，比埋頭讀完整段情境有效率得多。
:::

## 四大領域一句話記憶 + 權重

| 領域 | 權重 | 一句話核心 |
|---|---|---|
| **D1 設計安全的架構** | **30%** | 最小權限、傳輸與靜態加密、用角色不用金鑰、網路分層防護 |
| **D2 設計彈性(高可用)的架構** | **26%** | 跨多 AZ 消除單點故障、自動擴縮、解耦、可自動復原 |
| **D3 設計高效能的架構** | **24%** | 對的工作用對的服務、加快取、水平擴展、按負載選型 |
| **D4 設計成本最佳化的架構** | **18%** | 穩定負載換折扣、冷資料往下層搬、免維運與免費端點優先 |

:::info 權重就是時間分配
D1 安全權重最高(30%)，CP 值也最高，複習時優先確保 IAM、加密、VPC 安全不失分。
:::

## 限定詞 → 思路對照表

這是整張速查最該背熟的一張。**看到左邊的字，心裡先往右邊的方向想。**

| 題幹限定詞 | 看到它就往這個方向選 |
|---|---|
| **MOST cost-effective**(最具成本效益) | 挑免維運又便宜的：Serverless、Spot、S3 往冷層搬、Gateway Endpoint(免費)、RI/Savings Plans |
| **LEAST operational overhead**(最少營運負擔) | 選全代管/無伺服器：Lambda、Fargate、Aurora Serverless、S3、SQS、Managed 服務，少自己顧機器 |
| **HIGHLY available / fault-tolerant**(高可用/容錯) | 跨多個 AZ、Multi-AZ、Auto Scaling、ELB、解耦；單 AZ、單執行個體一律先刪 |
| **MOST secure / MOST restrictive**(最安全) | 最小權限、角色取代長期金鑰、加密(KMS)、私有子網路、Security Group/NACL 收緊 |
| **real-time / streaming**(即時/串流) | Kinesis(可重播)、串流處理；需要排序或重播就不是 SQS/SNS |
| **lowest latency**(最低延遲) | 使用者就近：CloudFront、Global Accelerator、邊緣位置、ElastiCache/DAX 快取、就近區域 |
| **decouple**(解耦元件) | SQS(佇列)或 SNS(扇出)；把同步呼叫改成非同步訊息 |
| **disaster recovery**(災難復原) | 跨區域：備份還原→暖備→熱備(Pilot Light/Warm Standby/Multi-Site)，看 RTO/RPO 要多低選多貴 |
| **serverless / no servers to manage**(無伺服器) | Lambda、Fargate、S3、DynamoDB、Aurora Serverless、API Gateway |
| **global users / worldwide**(全球使用者) | CloudFront、Route 53 延遲路由、Global Accelerator、跨區域複寫 |
| **spiky / unpredictable load**(突發/難預測負載) | 隨需/自動擴縮：DynamoDB On-Demand、Aurora Serverless、Lambda、Auto Scaling |
| **can tolerate interruption**(可容忍中斷) | Spot 執行個體(批次、容錯、無狀態工作最省) |
| **private connectivity to AWS**(私下連 AWS 服務) | VPC Endpoint(Gateway 走 S3/DynamoDB 且免費；Interface/PrivateLink 走其他服務) |

## 最常混淆服務對決速查

每組只記「**決勝那句話**」就夠了。

**高可用 vs 擴展讀取**
- **Multi-AZ**：同步複寫到另一個 AZ，主庫掛了自動切換——考**高可用/容錯**，不分擔讀取流量。
- **Read Replica(讀取複本)**：非同步複寫，分攤**讀取**流量——考**擴展讀取效能**。看到「提升可用性」選 Multi-AZ，看到「讀太多、要減輕主庫壓力」選 Read Replica。

**負載平衡器：ALB vs NLB**
- **ALB**：第 7 層(HTTP/HTTPS)，可依路徑/主機名稱路由——考**Web、微服務、內容路由**。
- **NLB**：第 4 層(TCP/UDP)，超高吞吐、超低延遲、支援靜態 IP——考**極致效能、非 HTTP、百萬級連線**。

**訊息：SQS vs SNS vs Kinesis**
- **SQS**：佇列，一對一消費、解耦緩衝——考**解耦、削峰、非同步任務**。
- **SNS**：發佈/訂閱，一則訊息**扇出**給多個訂閱者——考**一對多廣播通知**。
- **Kinesis**：即時串流，資料可**保留與重播**、保順序——考**即時分析、串流、要重播**。

**VPC 防火牆：Security Group vs NACL**
- **Security Group**：掛在執行個體層、**有狀態**(回應流量自動放行)、只能設允許規則。
- **NACL**：掛在子網路層、**無狀態**(進出要分別開)、可設拒絕規則。考「擋掉某個 IP」要用 NACL(SG 不能設拒絕)。

**邊緣加速：CloudFront vs Global Accelerator**
- **CloudFront**：CDN，**快取** HTTP/靜態內容於邊緣——考**可快取的網站/影片全球分發**。
- **Global Accelerator**：走 AWS 骨幹加速、給靜態 Anycast IP，**不快取**——考**非 HTTP(TCP/UDP)、遊戲、需要固定 IP 的全球低延遲**。

**運算：EC2 vs Lambda vs Fargate**
- **EC2**：完全掌控作業系統與執行個體——考**要控制、長時間運行、特殊環境**。
- **Lambda**：無伺服器函式，按執行付費、有執行時間上限——考**事件驅動、短任務、最少維運**。
- **Fargate**：無伺服器跑容器，不用管底層主機——考**要用容器但不想顧叢集節點**。

**資料庫：RDS vs Aurora vs DynamoDB**
- **RDS**：標準關聯式資料庫(MySQL/PostgreSQL…)——考**一般關聯式需求**。
- **Aurora**：AWS 自家高效能關聯式，相容 MySQL/PostgreSQL、效能與可用性更高——考**要關聯式又要更高效能/可用性**。
- **DynamoDB**：全代管 NoSQL，個位數毫秒、無上限擴展——考**NoSQL、鍵值、超大規模、無伺服器**。

**快取：ElastiCache Redis vs Memcached vs DAX**
- **Redis**：支援持久化、複寫、排序、Pub/Sub——考**要進階功能、要高可用的快取**。
- **Memcached**：單純、多執行緒、易水平擴展——考**單純、要分片的簡單快取**。
- **DAX**：專給 **DynamoDB** 的快取，把毫秒變微秒——考題一提 DynamoDB 讀取加速就選它。

**計費模式：On-Demand vs RI vs Savings Plans vs Spot**
- **On-Demand**：不承諾、最貴、最彈性——短期、臨時、不確定。
- **RI(預留執行個體)**：承諾 1/3 年換折扣，綁機型/區域——穩定可預測負載。
- **Savings Plans**：承諾用量金額換折扣，跨機型/區域更彈性——穩定負載但想保留彈性。
- **Spot**：最高約 9 折優惠但**可被回收**——可中斷的批次、容錯工作。

**S3 儲存類別：Intelligent-Tiering vs Standard-IA vs Glacier Deep Archive**
- **Intelligent-Tiering**：存取頻率**未知或會變**、不想手動搬——它自動幫你分層。
- **Standard-IA**：**偶爾存取但要立即拿到**，存取頻率明確。
- **Glacier Deep Archive**：**長期封存、幾乎不取回、最便宜**，可接受數小時取回(合規保存多年)。

**連外與免費存取：NAT Gateway vs VPC Gateway Endpoint**
- **NAT Gateway**：讓私有子網路**連外網**(連網際網路上的任何服務)，按小時+流量計費。
- **VPC Gateway Endpoint**：VPC 內**免費**私下存取 **S3/DynamoDB**，不走 NAT、不出公網。考「省 NAT 費存取 S3」就選它。

**成本工具：Cost Explorer vs Budgets vs CUR vs Cost Anomaly Detection**
- **Cost Explorer**：看趨勢、視覺化、預測未來。
- **Budgets**：設門檻，**超標告警**。
- **CUR(成本與使用報告)**：**最細**的每資源每小時原始明細，丟 S3 用 Athena 查。
- **Cost Anomaly Detection**：機器學習**自動抓異常**暴衝花費。

**安全加分題(各記一句)**
- **STS AssumeRole / 跨帳號**：跨帳號存取靠**假設角色**拿臨時憑證，不要散播長期金鑰。
- **KMS 信封加密**：用資料金鑰加密資料、再用主金鑰(CMK)加密資料金鑰——大量資料加密的標準做法。
- **WAF vs Shield**：**WAF** 擋第 7 層應用層攻擊(SQL injection、XSS、依規則過濾)；**Shield** 擋 DDoS(Standard 免費自動開，Advanced 付費加強)。

## 應試技巧

:::tip 進考場前再看一次
- **先抓限定詞，再看選項**：MOST/LEAST/MUST 這些字決定正確答案，別被漂亮但不符限定詞的選項騙走。
- **刪去法**：四選一通常能先刪掉兩個明顯錯的(違反高可用、違反最小權限、服務用錯場景)，剩兩個再比限定詞。
- **複選題看清題目**：寫明「**Choose TWO**」就一定要選滿兩個、不多不少，少選或多選都算錯。
- **時間分配**：65 題、130 分鐘，約 **2 分鐘/題**。難題先**標記(flag)跳過**，把簡單分數先拿滿，最後再回頭攻難題。
- **及格線 720 / 1000**：不必題題全對，穩拿會的、不糾結個別難題，整體過線就好。
- **別過度解讀**：選**最直接、最符合 AWS 最佳實務**的答案，通常不是最複雜、最花俏的那個。
:::

---

讀到這裡，你已經把四大領域的判斷邏輯都收進腦袋了。剩下的就是**在模擬考裡把這套「限定詞 → 答案」的反射練到自動**。深呼吸，你比想像中準備得更好——去寫最後一套題吧！

👉 [綜合模擬考 65 題](/saa/exam-prep/mock-exam)
