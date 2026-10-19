---
sidebar_position: 8
title: 重點速記 / 閃卡
---

# Domain 2 重點速記 / 閃卡

點一下卡片即可翻開說明。涵蓋 Domain 2 全部主題（高可用、負載平衡、自動擴展、解耦、DNS 路由、備份與災難復原、資料庫高可用），考前拿這頁快速複習最有效率。

## 高可用與多可用區

<Flashcards>
  <Flashcard term="Region vs AZ">Region＝地理區域（如東京）；AZ＝區域內彼此隔離的機房群。高可用＝把資源分散到「多個 AZ」。</Flashcard>
  <Flashcard term="SPOF 單點故障">任何只有一份、壞了就全停的元件。高可用設計的第一步就是消除 SPOF。</Flashcard>
  <Flashcard term="高可用 vs 容錯">高可用＝故障後能「很快恢復」；容錯＝故障時「完全不中斷」。容錯成本更高。</Flashcard>
  <Flashcard term="水平 vs 垂直擴展">水平＝加更多台（可跨 AZ、較有彈性，考試偏好）；垂直＝換更大台（有上限、需重啟）。</Flashcard>
  <Flashcard term="別硬編碼單一 AZ">設計要能跨 AZ 部署，才不會某個 AZ 掛掉就整站停。</Flashcard>
</Flashcards>

## 彈性負載平衡（ELB）

<Flashcards>
  <Flashcard term="ALB">第 7 層（HTTP/HTTPS），支援路徑/主機路由，適合網站與微服務。</Flashcard>
  <Flashcard term="NLB">第 4 層（TCP/UDP），超高效能、超低延遲，可給靜態/彈性固定 IP。</Flashcard>
  <Flashcard term="GWLB">串接第三方網路虛擬設備（防火牆、IDS/IPS）用。</Flashcard>
  <Flashcard term="健康檢查">ELB 只把流量送到健康的目標，不健康的自動剔除。</Flashcard>
  <Flashcard term="ELB + 跨 AZ">ELB 把流量分散到多個 AZ 的目標，是高可用的關鍵一環。</Flashcard>
</Flashcards>

## 自動擴展（Auto Scaling）

<Flashcards>
  <Flashcard term="ASG 三個容量">最小（min）保底、期望（desired）目前要維持、最大（max）上限。</Flashcard>
  <Flashcard term="目標追蹤">最常用、最簡單：設定「維持 CPU 50%」，系統自動增減。</Flashcard>
  <Flashcard term="階梯 vs 排程">階梯＝依指標級距擴展；排程＝已知尖峰時間（如每天 9 點）預先擴展。</Flashcard>
  <Flashcard term="ASG + 健康檢查">偵測到不健康的執行個體會自動終止並補一台新的。</Flashcard>
  <Flashcard term="跨多 AZ">ASG 會把執行個體平均分散到多個 AZ，兼顧高可用。</Flashcard>
</Flashcards>

## 解耦（SQS / SNS）

<Flashcards>
  <Flashcard term="SQS">訊息「佇列」，消費者主動「拉取」。用來緩衝、削峰填谷、解耦。</Flashcard>
  <Flashcard term="SNS">發布/訂閱，一則訊息「推播」給多個訂閱者（扇出 fan-out）。</Flashcard>
  <Flashcard term="標準 vs FIFO">標準＝高吞吐、可能重複/亂序；FIFO＝保順序、不重複、吞吐較低。</Flashcard>
  <Flashcard term="Visibility Timeout">訊息被取走後暫時隱藏的時間；設太短會被重複處理。</Flashcard>
  <Flashcard term="DLQ 死信佇列">多次處理失敗的訊息丟到這裡，避免卡住整條佇列。</Flashcard>
  <Flashcard term="SNS + SQS 扇出">一則 SNS 推播同時進多個 SQS，各系統獨立消化。</Flashcard>
</Flashcards>

## DNS 與流量路由（Route 53）

<Flashcards>
  <Flashcard term="簡單路由">一個記錄對一組 IP，無健康檢查。最基本。</Flashcard>
  <Flashcard term="加權路由">按比例分流，做藍綠/金絲雀部署或 A/B 測試。</Flashcard>
  <Flashcard term="延遲路由">把使用者導到「延遲最低」的區域，追求速度。</Flashcard>
  <Flashcard term="故障轉移路由">主站健康檢查失敗就自動切到備援站（主備高可用）。</Flashcard>
  <Flashcard term="Alias vs CNAME">根網域（apex，如 example.com）只能用 Alias，不能用 CNAME；Alias 指 AWS 資源且免費。</Flashcard>
</Flashcards>

## 備份與災難復原（DR）

<Flashcards>
  <Flashcard term="RPO">能容忍遺失多少「資料」（時間長度）。問「資料遺失量」就是 RPO。</Flashcard>
  <Flashcard term="RTO">能容忍多久「無法服務」。問「停機時間」就是 RTO。</Flashcard>
  <Flashcard term="四大 DR 策略">成本/速度由低到高：Backup &amp; Restore → Pilot Light → Warm Standby → Multi-Site。</Flashcard>
  <Flashcard term="成本最低選哪個">Backup &amp; Restore（復原最慢但最便宜）。</Flashcard>
  <Flashcard term="幾乎零停機選哪個">Multi-Site Active/Active（最快但最貴）。</Flashcard>
  <Flashcard term="EBS 快照">增量備份、存於 S3，可跨區域複製做異地備援。</Flashcard>
</Flashcards>

## 資料庫與儲存高可用

<Flashcards>
  <Flashcard term="RDS Multi-AZ">高可用！同步複寫到另一個 AZ 的備援，故障自動容錯移轉，但不分擔讀取。</Flashcard>
  <Flashcard term="Read Replica">讀取擴展！非同步複寫、可跨區，分攤讀取流量，可升為獨立資料庫。</Flashcard>
  <Flashcard term="別搞混">要「高可用」選 Multi-AZ；要「讀取變快」選 Read Replica。</Flashcard>
  <Flashcard term="EFS vs EBS">EFS＝可多 AZ 共享的檔案系統；EBS＝綁單一 AZ 的區塊儲存。</Flashcard>
  <Flashcard term="S3 耐久性">11 個 9（99.999999999%），跨區複寫（CRR）做異地備援。</Flashcard>
</Flashcards>
