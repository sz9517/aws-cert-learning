---
sidebar_position: 8
title: 重點速記 / 閃卡
---

# Domain 4 重點速記 / 閃卡

點一下卡片即可翻開說明。涵蓋 Domain 4 全部主題（運算計費模式、S3 儲存類別與生命週期、資料傳輸成本、成本監控與治理、資料庫與網路成本、成本最佳化架構決策），考前拿這頁快速複習最有效率。

## 運算計費模式（On-Demand／RI／Savings Plans／Spot）

<Flashcards>
  <Flashcard term="On-Demand">按秒／按時計費、隨開隨關、無承諾，最有彈性但單價最貴，適合短期或無法預測的負載。</Flashcard>
  <Flashcard term="Reserved Instances：Standard vs Convertible">承諾 1 或 3 年換折扣。Standard＝折扣最大但不能換機型；Convertible＝折扣略小但可更換家族／OS／租用方式。</Flashcard>
  <Flashcard term="Savings Plans：Compute vs EC2 Instance">承諾每小時花費金額換折扣。Compute SP＝最有彈性（跨家族／區域／Fargate／Lambda）；EC2 Instance SP＝折扣更高但綁定特定家族與區域。</Flashcard>
  <Flashcard term="Spot Instances">用閒置產能最高省 90%，但 AWS 可回收，僅提前 2 分鐘中斷通知；適合可容錯、可中斷的批次／大數據工作。</Flashcard>
  <Flashcard term="Dedicated Hosts">整台實體主機專屬給你，可帶自有授權（BYOL，依實體核心計價）、滿足合規與軟體授權需求。</Flashcard>
</Flashcards>

## S3 儲存類別與生命週期

<Flashcards>
  <Flashcard term="S3 Intelligent-Tiering">自動在存取層間搬移資料、依存取頻率調整成本，存取模式不確定時最省心（僅收少量監控費）。</Flashcard>
  <Flashcard term="Standard-IA vs One Zone-IA">都是低頻存取、較便宜但有取回費。Standard-IA 跨 3 AZ；One Zone-IA 只存單一 AZ、更便宜但 AZ 故障會遺失，適合可重建資料。</Flashcard>
  <Flashcard term="Glacier 三種">Instant Retrieval＝毫秒取回、很少存取的歸檔；Flexible Retrieval＝分鐘到小時取回；Deep Archive＝最便宜、取回需數小時，長期合規保存。</Flashcard>
  <Flashcard term="Lifecycle 生命週期規則">Transition＝按天數自動把物件降轉到更便宜的類別；Expiration＝到期自動刪除物件或清掉舊版本，省下長期費用。</Flashcard>
  <Flashcard term="最低儲存天數陷阱">IA 類別有 30 天、Glacier 類別有 90／180 天最低計費；太早刪或太快降轉反而被收足天數費用，別把短命資料丟進去。</Flashcard>
</Flashcards>

## 資料傳輸成本（Data Transfer）

<Flashcards>
  <Flashcard term="Inbound 免費／Outbound 收費">資料傳「進」AWS 通常免費；傳「出」到網際網路（egress）才收費——成本優化先盯外流流量。</Flashcard>
  <Flashcard term="同 AZ／跨 AZ／跨 Region">同一 AZ 內多半免費；跨 AZ、跨 Region 的傳輸都要收費，架構盡量讓互相通訊的資源待在同一 AZ。</Flashcard>
  <Flashcard term="CloudFront 省 egress">靜態／可快取內容走 CloudFront，從邊緣節點回應、減少直接從 S3／EC2 外流的流量，傳輸費率也較低。</Flashcard>
  <Flashcard term="VPC Gateway Endpoint">存取 S3 與 DynamoDB 的 Gateway Endpoint 免費，讓流量走私有網路、不經 NAT 或網際網路，同時省下 NAT 費用。</Flashcard>
  <Flashcard term="NAT Gateway 計費">NAT Gateway 同時按「每小時」與「每 GB 處理量」收費；大量私有子網流量走 NAT 會很貴，能用 Gateway Endpoint 就別繞 NAT。</Flashcard>
</Flashcards>

## 成本監控與治理（Cost Explorer／Budgets／CUR）

<Flashcards>
  <Flashcard term="Cost Explorer">視覺化查看與分析歷史花費趨勢、按服務／標籤細分，並預測未來成本，找出花費大戶。</Flashcard>
  <Flashcard term="AWS Budgets">設定成本或用量預算門檻，超過（或預測超過）就發出警示，主動控管支出。</Flashcard>
  <Flashcard term="Cost and Usage Report（CUR）">最細、最完整的帳務明細報表，匯出到 S3 供深入分析（搭配 Athena／QuickSight）。</Flashcard>
  <Flashcard term="Cost Allocation Tags">用成本分配標籤把花費依專案／團隊／環境歸類，才能在 Cost Explorer／CUR 中分帳與歸責。</Flashcard>
  <Flashcard term="Organizations 合併帳單">多帳號集中到一個組織統一出帳（Consolidated Billing），用量合併後更容易觸及折扣級距、共享 RI／Savings Plans。</Flashcard>
  <Flashcard term="Cost Anomaly Detection">用機器學習偵測異常花費並自動通知，及早抓到暴衝的成本。</Flashcard>
</Flashcards>

## 資料庫與網路成本（RDS／Aurora／DynamoDB／連線）

<Flashcards>
  <Flashcard term="RDS／Aurora Reserved Instances">穩定、長期運行的資料庫買 RI（1 或 3 年承諾）可比 On-Demand 大幅省錢。</Flashcard>
  <Flashcard term="Aurora Serverless v2">自動依負載平滑擴縮容量、按用量計費，適合間歇或不可預測的負載，避免為尖峰長期預置。</Flashcard>
  <Flashcard term="DynamoDB 隨需 vs 預置">隨需＝流量不可預測、按實際請求計費免管理；預置＝流量穩定可預測，預先設定容量（可搭 Auto Scaling）更便宜。</Flashcard>
  <Flashcard term="VPC Endpoint 省 NAT">用 Gateway／Interface Endpoint 讓 VPC 內服務私有存取 AWS 服務，省去 NAT Gateway 的處理量費用。</Flashcard>
  <Flashcard term="Direct Connect vs VPN">VPN 走網際網路、便宜好上手；Direct Connect＝專線、穩定低延遲且大量傳輸的每 GB 費率更低，長期大流量才划算。</Flashcard>
</Flashcards>

## 成本最佳化架構決策

<Flashcards>
  <Flashcard term="閒置＝浪費">未使用或低使用率的資源仍在計費；關閉閒置執行個體、刪除未掛載的 EBS／舊快照／未用的 Elastic IP。</Flashcard>
  <Flashcard term="managed／serverless＝較低營運負擔">用受管或無伺服器服務（Lambda／Fargate／DynamoDB／Aurora Serverless）把維運與閒置成本交給 AWS，只為實際用量付費。</Flashcard>
  <Flashcard term="Right-Sizing 右規模">用 Compute Optimizer 與 Trusted Advisor 找出過度配置的資源，調降到符合實際需求的規格以省錢。</Flashcard>
  <Flashcard term="供需匹配">用 Auto Scaling 讓容量隨需求自動增減，流量低時縮編、不為尖峰長期多付。</Flashcard>
  <Flashcard term="Well-Architected 成本支柱">涵蓋雲端財務管理、量入為出、採用消費模式、評估效益、停止為不需要的東西付費。</Flashcard>
</Flashcards>

---

複習完了？來測驗自己 👉 [Domain 4 原創練習題](/saa/domain-4/quiz)，或回頭看 [服務比較與考前速查](/saa/domain-4/comparison)。
