---
sidebar_position: 9
title: 原創練習題
---

# Domain 2 原創練習題（仿官方考題風格）

先自己點選答案，再按「**顯示答案與解析**」。題目涵蓋 Domain 2 全部主題，對齊官方考試領域與題型風格，為**原創**內容（非真實考題）。

<Quiz
  qnum={1}
  total={12}
  question="你的網站目前所有 EC2 都部署在同一個可用區（AZ）。為了提高可用性，最該先做的是？"
  options={[
    '把 EC2 換成規格更大的機型',
    '把 EC2 分散部署到同一區域的多個可用區',
    '幫 EC2 開啟更頻繁的備份',
    '把 EC2 搬到另一個國家的區域',
  ]}
  answer={1}>

**正解：B**

高可用的第一步是消除**單點故障（SPOF）**。把執行個體**跨多個 AZ** 部署，就算一個 AZ 整個停擺，其他 AZ 仍能服務。A 是垂直擴展，單台還是會壞；C 無助於高可用；D 跨區域是災難復原層級，成本與複雜度都過高，非此題最佳解。

</Quiz>

<Quiz
  qnum={2}
  total={12}
  question="關於「高可用（HA）」與「容錯（Fault Tolerance）」的差異，下列敘述何者正確？"
  options={[
    '兩者完全相同，只是叫法不同',
    '高可用追求故障後「快速恢復」，容錯追求故障時「完全不中斷」',
    '容錯比高可用便宜',
    '高可用只能靠垂直擴展達成',
  ]}
  answer={1}>

**正解：B**

**高可用**容許短暫中斷但能很快恢復；**容錯**則要求故障當下服務完全不受影響，通常需要更多備援、成本更高（C 錯）。高可用主要靠**水平擴展＋跨 AZ**（D 錯）。

</Quiz>

<Quiz
  qnum={3}
  total={12}
  question="一個以 HTTP/HTTPS 為主、需要依「網址路徑」把流量導到不同微服務的網站，應該選哪種負載平衡器？"
  options={[
    'Network Load Balancer（NLB）',
    'Application Load Balancer（ALB）',
    'Gateway Load Balancer（GWLB）',
    '不需要負載平衡器',
  ]}
  answer={1}>

**正解：B**

**ALB** 運作在第 7 層（應用層），看得懂 HTTP/HTTPS，可依**路徑或主機名稱**做路由，最適合網站與微服務。NLB 是第 4 層（看不懂路徑）；GWLB 用於串接第三方網路設備。

</Quiz>

<Quiz
  qnum={4}
  total={12}
  question="遊戲後端需要處理每秒數百萬筆 TCP 連線、延遲要極低，而且客戶端防火牆需要一個「固定不變的 IP」。最適合的負載平衡器是？"
  options={[
    'Application Load Balancer（ALB）',
    'Network Load Balancer（NLB）',
    'Classic Load Balancer（CLB）',
    'Route 53 加權路由',
  ]}
  answer={1}>

**正解：B**

**NLB** 運作在第 4 層，具備超高效能、超低延遲，且可指派**靜態／彈性固定 IP**，正好符合極端效能與固定 IP 的需求。ALB 無法給固定 IP；CLB 是舊世代；Route 53 是 DNS 層，不是負載平衡器。

</Quiz>

<Quiz
  qnum={5}
  total={12}
  question="你希望一組 EC2 能「自動維持平均 CPU 使用率在 50% 左右」，流量高就自動加機器、流量低就自動減。最簡單的 Auto Scaling 做法是？"
  options={[
    '手動在尖峰時段登入主控台加開機器',
    '設定目標追蹤（Target Tracking）策略，目標 CPU 50%',
    '把期望容量（desired）固定設成最大值',
    '只設定排程擴展，每天固定時間加機器',
  ]}
  answer={1}>

**正解：B**

**目標追蹤**策略最簡單直覺：指定一個目標指標（如 CPU 50%），ASG 會自動增減執行個體去維持它。C 等於一直開最大量、浪費成本；D 排程只適合「已知固定時間」的尖峰，無法應付隨機流量。

</Quiz>

<Quiz
  qnum={6}
  total={12}
  question="關於 Auto Scaling Group 的 min / desired / max 與健康檢查，下列何者正確？"
  options={[
    'desired 可以小於 min',
    'ASG 偵測到不健康的執行個體會自動終止並補一台新的',
    'max 設越大帳單一定越高，與實際流量無關',
    'ASG 只能把所有機器放在同一個 AZ',
  ]}
  answer={1}>

**正解：B**

ASG 搭配健康檢查時，會**自動替換**不健康的執行個體，維持期望容量。min 是下限、max 是上限、desired 介於兩者之間（A 錯）；實際機器數隨流量在 min~max 間變動，不是永遠跑 max（C 錯）；ASG 會**跨多個 AZ** 分散機器（D 錯）。

</Quiz>

<Quiz
  qnum={7}
  total={12}
  question="訂單系統在促銷時瞬間湧入大量請求，後端處理不及常常當機。要「削峰填谷」讓後端依自己步調慢慢處理，最適合的服務是？"
  options={[
    '用 SNS 把訂單直接推播給後端',
    '把訂單寫進 SQS 佇列，後端依自己能力拉取處理',
    '加大資料庫規格',
    '請前端限制使用者下單速度',
  ]}
  answer={1}>

**正解：B**

**SQS** 佇列是典型的**緩衝／解耦**方案：請求先進佇列排隊，後端（可搭配 Auto Scaling）**依自己步調拉取**處理，流量尖峰不會直接壓垮後端。SNS 是即時推播、無法緩衝（A 錯）。

</Quiz>

<Quiz
  qnum={8}
  total={12}
  question="一筆「訂單成立」事件發生時，需要同時通知「寄送 Email、更新庫存、寫入分析」三個獨立系統，彼此互不影響。最佳架構是？"
  options={[
    '讓訂單服務依序呼叫三個系統的 API',
    '用 SNS 主題扇出（fan-out），三個系統各自訂閱（常搭配各自的 SQS）',
    '把三件事都寫在同一支程式裡',
    '用一個共用資料庫欄位當旗標輪詢',
  ]}
  answer={1}>

**正解：B**

**SNS 扇出（fan-out）**：訂單服務只發佈一則訊息到 SNS 主題，三個系統各自訂閱（常見做法是各掛一個 SQS 佇列），彼此解耦、獨立消化、互不拖累。A 是緊耦合，任一系統慢或掛都會拖垮主流程。

</Quiz>

<Quiz
  qnum={9}
  total={12}
  question="你有主站（us-east-1）與備援站（us-west-2），希望「主站健康時走主站，主站掛掉自動切到備援站」。Route 53 該用哪種路由策略？"
  options={[
    '簡單路由（Simple）',
    '加權路由（Weighted）',
    '故障轉移路由（Failover）＋健康檢查',
    '延遲路由（Latency）',
  ]}
  answer={2}>

**正解：C**

**故障轉移路由**搭配**健康檢查**正是主備（Active/Passive）高可用的標準做法：健康檢查發現主站異常，Route 53 自動把流量切到備援站。簡單路由沒有健康檢查；加權是按比例分流；延遲路由是以速度為目標，都不符合主備切換需求。

</Quiz>

<Quiz
  qnum={10}
  total={12}
  question="你想把根網域 example.com（zone apex）指向一個 Application Load Balancer。正確且符合最佳實務的做法是？"
  options={[
    '建立一筆 CNAME 記錄指向 ALB 的 DNS 名稱',
    '建立一筆 Route 53 Alias 記錄指向 ALB',
    '把 ALB 的 IP 硬寫成 A 記錄',
    '根網域無法指向 ALB',
  ]}
  answer={1}>

**正解：B**

**根網域（zone apex）不能用 CNAME**（DNS 規範限制），要用 Route 53 的 **Alias** 記錄指向 ALB 等 AWS 資源；Alias 免費、且 ALB 的 IP 會變動不能硬寫 A 記錄（C 錯）。

</Quiz>

<Quiz
  qnum={11}
  total={12}
  question="一個內部報表系統，老闆要求「災難復原成本越低越好，可以接受較長的復原時間」。最適合的 DR 策略是？"
  options={[
    'Multi-Site Active/Active（多站同時運作）',
    'Warm Standby（溫備援，縮小版持續運作）',
    'Backup & Restore（備份後需要時再還原）',
    'Pilot Light（核心常開、其餘待命）',
  ]}
  answer={2}>

**正解：C**

四大 DR 策略中，**Backup & Restore** 成本最低（平時只付備份儲存費），代價是復原最慢——完全符合「成本最低、可接受較長 RTO」的需求。其餘三者越即時、成本越高。這題考的是 **RTO（復原時間）與成本的取捨**。

</Quiz>

<Quiz
  qnum={12}
  total={12}
  question="你的 RDS 資料庫讀取流量暴增拖垮效能，同時老闆也要求「資料庫故障時能自動容錯移轉不中斷」。下列搭配何者正確？"
  options={[
    '開 Read Replica 就能同時解決讀取擴展與自動容錯移轉',
    '用 Read Replica 分擔讀取流量，並開啟 Multi-AZ 做高可用自動容錯移轉',
    '開 Multi-AZ 的備援就能自動分擔讀取流量',
    '把資料庫換更大機型就能同時解決兩個問題',
  ]}
  answer={1}>

**正解：B**

這兩個需求要用**兩種不同機制**：**Read Replica**（非同步、可多個）分擔**讀取**流量；**Multi-AZ**（同步備援）負責**高可用與自動容錯移轉**。注意 Multi-AZ 的備援平時**不分擔讀取**（C 錯），Read Replica 也**不是**高可用方案（A 錯）。這是 SAA 最愛考的混淆點。

</Quiz>

---

做完了嗎？回去複習 👉 [Domain 2 重點速記 / 閃卡](/saa/domain-2/flashcards)，或前往下一個領域 👉 [Domain 3：設計高效能的架構](/saa/domain-3/)。
