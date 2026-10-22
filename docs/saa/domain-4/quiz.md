---
sidebar_position: 9
title: 原創練習題
---

# Domain 4 原創練習題（仿官方考題風格）

先自己點選答案，再按「**顯示答案與解析**」。本頁對齊 SAA-C03 官方題型：**情境式題幹**、選項皆為合理的 AWS 服務（誘答選項不會明顯錯誤），並刻意用「**最具成本效益（MOST cost-effective）／最少營運負擔（LEAST operational overhead）／最低成本**」這類**限定詞**逼你比較取捨。包含**單選**與**複選（Choose TWO）**兩種題型。題目為**原創**內容（非真實考題）。

<Quiz
  qnum={1}
  total={18}
  question="某公司有一組正式環境的網站主機，流量長期穩定可預測，一年 365 天都得開著，且不能被中斷。團隊想在不被綁死特定機型、未來可彈性調整的前提下，用最具成本效益的方式計費。最適合的做法是？"
  options={[
    '全部維持 On-Demand 隨需以保留最大彈性',
    '購買 Compute Savings Plans 承諾每小時固定用量',
    '把主機改用 Spot 執行個體以取得最大折扣',
    '購買整台 Dedicated Hosts 專用主機',
  ]}
  answer={1}>

**正解：B**

「穩定可預測、長期常駐、不能中斷、又想保有跨機型彈性」最符合 **Compute Savings Plans（運算型節省方案）**，承諾每小時固定運算花費就能打折，且可跨機型、跨區域、跨 EC2／Fargate／Lambda。A 隨需天天付牌價、穩定負載用它最貴；C 的 Spot 會被回收、不適合不能中斷的正式主機；D 的 Dedicated Hosts（專用主機）最貴，僅用於合規或自備授權（BYOL）。

</Quiz>

<Quiz
  qnum={2}
  total={18}
  question="某團隊每晚跑一批影片轉檔運算，工作無狀態、跑完即丟、被中途打斷也只要重跑即可。團隊希望把這批運算的成本壓到最低。最適合的計費模式是？"
  options={[
    'On-Demand 隨需執行個體',
    'Reserved Instances 預留執行個體（3 年全預付）',
    'Spot 執行個體',
    'Dedicated Hosts 專用主機',
  ]}
  answer={2}>

**正解：C**

「無狀態＋可重跑＋可容忍中斷＋成本越低越好」正是 **Spot** 的經典場景，最高可省約 9 成，回收前還會給約 2 分鐘的中斷通知。A 隨需沒有折扣；B 的預留執行個體是長期承諾、適合穩定常駐而非每晚短跑的批次；D 的專用主機最貴、與此需求無關。

</Quiz>

<Quiz
  qnum={3}
  total={18}
  question="某製造業要把一套舊系統搬上 AWS，該系統的軟體授權以實體核心計價、必須自備授權（BYOL）並獨占實體主機，同時長期穩定運行。下列哪兩項組合最能同時滿足合規與成本需求？（Choose TWO）"
  options={[
    '使用 EC2 Dedicated Hosts 專用主機以滿足獨占實體與 BYOL 需求',
    '對這台長期穩定的主機購買預留方案（Reserved 或 Savings Plans）鎖定折扣',
    '把系統改用 Spot 執行個體以取得最低單價',
    '改用 AWS Lambda 以免除伺服器管理',
    '維持 On-Demand 隨需並停用所有折扣方案',
  ]}
  answer={[0, 1]}>

**正解：A、B**

「授權綁實體核心＋自備授權（BYOL）＋獨占實體主機」只有 **Dedicated Hosts 專用主機（A）** 能滿足；而既然負載長期穩定，再**購買預留方案或 Savings Plans（B）** 鎖定折扣就能壓低這筆長期開銷。C 的 Spot 會被回收、不適合常駐授權系統；D 的 Lambda 不給 OS 層與實體主機控制、無法滿足 BYOL 合規；E 維持隨需等於放著折扣不拿、最不省。

</Quiz>

<Quiz
  qnum={4}
  total={18}
  question="某公司有一批新上線 App 的使用者上傳檔案，存取頻率「未知且會隨時間變化」，有些檔案前兩週天天被讀、之後幾乎沒人碰。團隊不想手動管理分層，希望以最具成本效益的方式存放。最適合的 S3 儲存類別是？"
  options={[
    'S3 Standard 標準類別',
    'S3 Intelligent-Tiering 智慧分層',
    'S3 Glacier Deep Archive',
    'S3 One Zone-IA',
  ]}
  answer={1}>

**正解：B**

「存取頻率未知／會變＋不想手動管理分層」正是 **Intelligent-Tiering（智慧分層）** 的定位，它自動依存取頻率在冷熱層之間搬動、且沒有取回費。A 的 Standard 對冷資料太貴；C 的 Deep Archive 取回要數小時、不適合可能隨時變熱的資料；D 的 One Zone-IA 只存單一可用區（AZ）、僅適合可重建的非關鍵資料，也不會自動分層。

</Quiz>

<Quiz
  qnum={5}
  total={18}
  question="某金融公司依法規要保存七年的稽核憑證，這些資料「幾乎永遠不會取回」，就算要取回也能接受等待數小時。團隊要以最低存放成本保存。最適合的 S3 儲存類別是？"
  options={[
    'S3 Standard-IA 不常存取類別',
    'S3 Glacier Instant Retrieval 即時取回',
    'S3 Glacier Deep Archive',
    'S3 Intelligent-Tiering 智慧分層',
  ]}
  answer={2}>

**正解：C**

「長期封存＋幾乎不取回＋可接受數小時＋最低成本」完全對應 **Glacier Deep Archive**，每 GB 存放單價最低。A 的 Standard-IA 存放費仍遠高於 Glacier，且取回要立即可用才划算；B 的 Glacier Instant Retrieval 是為「偶爾要毫秒取回」設計、單價較高；D 的 Intelligent-Tiering 適合存取不明的資料、不是最低成本的深層封存解。

</Quiz>

<Quiz
  qnum={6}
  total={18}
  question="某團隊的 S3 貯體堆了五年的日誌，全放在 S3 Standard，其中很多很久沒人讀；貯體還開了版本控制，舊版本從未清理。團隊希望以最少營運負擔自動把冷資料降級並清掉過期資料。最適合的做法是？"
  options={[
    '寫一支每晚執行的指令碼手動搬移與刪除物件',
    '設定 S3 生命週期政策，自動轉換到更便宜類別並對過期與非目前版本到期刪除',
    '把整個貯體一次改成 Glacier Deep Archive',
    '關閉版本控制以避免舊版本累積',
  ]}
  answer={1}>

**正解：B**

「自動降級冷資料＋清掉過期與舊版本＋最少營運負擔」正是 **S3 生命週期政策（Lifecycle）** 的用途，可設轉換（Transition）往更冷的類別降級，並對目前版本與非目前版本設到期（Expiration）刪除，設一次就自動運作。A 自寫指令碼營運負擔最高；C 把還在熱讀的資料也一併封存會產生取回費與最低儲存天數問題；D 關閉版本控制無法處理既有舊版本，也不會自動降級冷資料。

</Quiz>

<Quiz
  qnum={7}
  total={18}
  question="某媒體網站把大量圖片與影片放在 S3，全球使用者直接連進來下載，熱門檔案被重複下載數萬次，對外傳輸（egress）費用暴增。團隊希望以最具成本效益的方式降低對外傳輸費。最適合的做法是？"
  options={[
    '把 S3 貯體複製到每個使用者所在的區域',
    '在 S3 前面放 Amazon CloudFront，用邊緣快取就近送達並降低回源流量',
    '把所有物件改存成 S3 One Zone-IA 以省存放費',
    '為每個使用者建立獨立的 NAT 閘道',
  ]}
  answer={1}>

**正解：B**

「大量對外下載＋重複熱門內容＋降低對外傳輸費」最適合 **CloudFront（CDN）**：熱門檔案快取在邊緣節點、重複下載直接由快取出不再回源，且 CloudFront 的 egress 費率通常更划算、回源抓 S3 也不另收傳輸費。A 跨區複製只增加成本與複雜度；C 的 One Zone-IA 省的是存放費、與對外傳輸費無關；D 的 NAT 閘道是私有子網路對外出口、與面向使用者的內容分發無關。

</Quiz>

<Quiz
  qnum={8}
  total={18}
  question="某公司私有子網路裡的 EC2 每晚把大量日誌備份到 Amazon S3，因為沒有公有 IP，流量全部繞經 NAT 閘道，每 GB 處理費把帳單撐大。團隊要以最具成本效益的方式讓這段流量不再繞 NAT。最適合的做法是？"
  options={[
    '為這些 EC2 配置公有 IP 直接連到 S3',
    '建立 S3 Gateway VPC Endpoint，讓流量走 AWS 內網且本身免費',
    '改用 Interface Endpoint（PrivateLink）連到 S3',
    '把備份改成跨區域複製到另一個 Region',
  ]}
  answer={1}>

**正解：B**

存取 S3／DynamoDB 時，**Gateway VPC Endpoint** 走路由表把流量導回 AWS 內網、本身完全免費，直接省掉 NAT 的每 GB 處理費與對外傳輸費，是 CP 值最高的一招。A 配公有 IP 仍走網際網路、要付對外傳輸費也較不安全；C 的 Interface Endpoint 按小時＋按量計費，存取 S3 時用免費的 Gateway Endpoint 更省；D 跨區域複製是最貴的傳輸、方向完全相反。

</Quiz>

<Quiz
  qnum={9}
  total={18}
  question="某系統的傳輸費用一直偷偷上漲，調查發現兩個來源：主從資料庫分散在不同可用區（AZ）高頻互傳，以及私有子網路的 EC2 存取 DynamoDB 時繞 NAT 出網際網路。下列哪兩項做法最能降低這些傳輸成本？（Choose TWO）"
  options={[
    '把頻繁互傳的元件放在同一個可用區（AZ）以免除跨 AZ 傳輸費',
    '為 DynamoDB 建立 Gateway VPC Endpoint，讓流量走內網並省下 NAT 費用',
    '把資料庫複製到另一個 Region 以分散流量',
    '為每台 EC2 配置公有 IP 直接走網際網路存取 DynamoDB',
    '把 NAT 閘道數量加倍以提升吞吐',
  ]}
  answer={[0, 1]}>

**正解：A、B**

跨 AZ 高頻互傳 → **把常互通的元件放在同一個 AZ（A）**，同一 AZ 內走私有 IP 的流量免費；存取 DynamoDB 繞 NAT → 建 **Gateway VPC Endpoint（B）**（S3／DynamoDB 專用、免費）直接走內網、省掉 NAT 處理費與對外傳輸費。C 跨 Region 複製是最貴的傳輸、只會更花錢；D 公有 IP 仍走網際網路要付 egress、也更不安全；E 加倍 NAT 閘道只會讓按小時固定費翻倍，不解決問題。

</Quiz>

<Quiz
  qnum={10}
  total={18}
  question="某公司財務發現這個月帳單是上個月的三倍，但打開帳單只看到一堆服務名稱與數字，想「視覺化拆解花費趨勢、找出是哪個服務最貴、並預測未來幾個月花費」。最適合的工具是？"
  options={[
    'AWS Cost and Usage Report（CUR）',
    'AWS Cost Explorer',
    'AWS Budgets',
    'AWS CloudTrail',
  ]}
  answer={1}>

**正解：B**

「視覺化趨勢＋依服務／帳號／標籤拆解＋找出大戶＋預測未來花費」是 **Cost Explorer** 的本職。A 的 CUR 是最細的逐行帳單明細、輸出到 S3 供深入分析，不是拖拉即看的趨勢圖；C 的 Budgets 是設門檻告警、不是分析趨勢；D 的 CloudTrail 記錄的是 API 操作軌跡、與花費分析無關。

</Quiz>

<Quiz
  qnum={11}
  total={18}
  question="某公司擔心再發生「月底才發現暴增」的狀況，希望在成本出現「不正常的異常暴增」時，不用人工盯圖就能自動收到通知。最適合的服務是？"
  options={[
    'AWS Budgets 設定固定金額門檻',
    'AWS Cost Anomaly Detection',
    'AWS Trusted Advisor',
    'AWS Compute Optimizer',
  ]}
  answer={1}>

**正解：B**

「自動偵測花費異常暴增＋不用人工盯著」正是 **Cost Anomaly Detection**，它用機器學習學會平常的花費樣態、一出現異常就通知。A 的 Budgets 盯的是「有沒有超過你設的固定門檻」、不是偵測異常樣態；C 的 Trusted Advisor 是找閒置／低使用率資源的多面向建議；D 的 Compute Optimizer 專做 EC2／Lambda 的右規模建議。

</Quiz>

<Quiz
  qnum={12}
  total={18}
  question="某企業在 AWS Organizations 底下有很多個帳號（每個部門一個），希望集中管理、對帳更簡單，並讓各帳號的用量加總以享更多量折扣、還能共享預留方案。最適合的做法是？"
  options={[
    '在每個帳號各自手動調整資源與折扣',
    '使用 AWS Organizations 合併帳單（Consolidated Billing）',
    '只在管理帳號開啟 Cost Explorer',
    '為每個帳號各設一個獨立的 Budgets 預算',
  ]}
  answer={1}>

**正解：B**

「多帳號集中、用量加總享量折扣、RI／Savings Plans 共享」正是 **Organizations 合併帳單（Consolidated Billing）** 的三大好處。A 一個個手動調無法加總用量、也無法共享預留方案；C 的 Cost Explorer 只是看花費、不會集中帳單或加總折扣；D 各設預算只是告警、與合併計費省錢無關。

</Quiz>

<Quiz
  qnum={13}
  total={18}
  question="某內部報表系統只在白天上班時間有人用，半夜與週末幾乎沒有流量，負載忽高忽低且難以預測。團隊不想自己猜容量、也不想為離峰時段的閒置付費，要以最具成本效益的方式提供關聯式資料庫。最適合的是？"
  options={[
    'RDS 購買 3 年期預留執行個體',
    'Amazon Aurora Serverless v2',
    '在 EC2 上自建一台固定大小的 MySQL',
    'RDS 隨需並長期開著不關',
  ]}
  answer={1}>

**正解：B**

「負載忽高忽低、間歇、離峰幾乎沒人用、不想猜容量」正是 **Aurora Serverless v2** 的場景，它依實際用量自動放大縮小、閒置時縮到很小，等於沒人用就幾乎不收錢。A 的預留執行個體是對「確定長期穩定用量」的承諾、間歇負載買了多半閒置；C 自建固定大小要自己顧維運、離峰照樣付整台；D 隨需長期開著對變動負載仍在為閒置付費。

</Quiz>

<Quiz
  qnum={14}
  total={18}
  question="某公司機房需要長期、穩定、大流量地連到 AWS，流量成本已相當可觀，希望降低每 GB 的傳輸單價並取得穩定低延遲的連線。最適合的做法是？"
  options={[
    'Site-to-Site VPN 走公網加密通道',
    'AWS Direct Connect 專線',
    '為機房流量改走 NAT 閘道',
    '把流量都改走網際網路閘道（Internet Gateway）',
  ]}
  answer={1}>

**正解：B**

「長期＋穩定＋大流量＋要降每 GB 單價與穩定低延遲」正是 **Direct Connect（專線）** 的場景，雖然前期成本與建置時間較高，但大流量下每 GB 傳輸單價明顯比走公網便宜。A 的 Site-to-Site VPN 前期便宜、適合偶發小流量，但頻寬與延遲受公網影響；C 的 NAT 閘道是私有子網路對外出口、不是機房對接方案；D 的 Internet Gateway 只是 VPC 的對外出入口、不提供專線與穩定低延遲。

</Quiz>

<Quiz
  qnum={15}
  total={18}
  question="某電商的正式環境 Aurora 用隨需計費跑了整年、負載一直很穩定，另外有一個開發測試用的資料庫只有上班時間間歇使用。團隊要在不犧牲正式環境穩定度的前提下，用最具成本效益的方式重新安排這兩個資料庫的計費。下列哪兩項做法最適合？（Choose TWO）"
  options={[
    '正式環境穩定的 Aurora 改買 1 年期預留執行個體以鎖定折扣',
    '開發測試資料庫改用 Aurora Serverless v2，閒置時自動縮小',
    '正式環境改用 Spot 以取得最低單價',
    '為正式環境再多開三個讀取複本以防萬一',
    '把兩個資料庫都改成隨需並長期開著',
  ]}
  answer={[0, 1]}>

**正解：A、B**

穩定可預測的正式負載 → **買預留執行個體鎖折扣（A）**（最多可省六、七成）；間歇、離峰沒人用的開發測試庫 → **改用 Aurora Serverless v2（B）**，閒置自動縮小、幾乎不收錢。C 的 Spot 會被回收、不能放正式資料庫；D 為「以防萬一」亂加讀取複本只是多付一份執行個體費、讀取沒變快；E 兩個都維持隨需長期開著是最不省的做法。

</Quiz>

<Quiz
  qnum={16}
  total={18}
  question="某公司有一套每天固定跑、流量白天高晚上低的網站，外加一批每月一次、可容忍中斷的批次運算，還有一堆三年沒人動過的舊日誌全放在 S3 Standard。要用「最具成本效益（MOST cost-effective）」且「最少營運負擔」的方式重整。下列哪個組合最適合？"
  options={[
    '網站用 Savings Plans、批次用 Spot、舊日誌用生命週期搬到 Glacier Deep Archive',
    '全部改用隨需並手動在離峰時關機',
    '網站用 Spot、批次用預留執行個體、舊日誌留在 S3 Standard',
    '全部搬到自建的 EC2 叢集由團隊手動管理',
  ]}
  answer={0}>

**正解：A**

這是綜合情境題，要一關一關對應：穩定長期的網站 → **Savings Plans／RI** 鎖折扣；可容忍中斷的批次 → **Spot**（最高省約 9 成）；三年沒碰的舊日誌 → **S3 生命週期搬到 Glacier Deep Archive**。而且全是「改設定」、沒自己多架東西，營運負擔幾乎不增加。B 手動關機營運負擔高又不省；C 把不能中斷的網站放 Spot、又讓穩定的批次綁預留，方向顛倒；D 自建叢集手動管幾乎永遠不是「營運負擔最低」的答案。

</Quiz>

<Quiz
  qnum={17}
  total={18}
  question="某公司要處理一批事件驅動、每次執行只需幾秒、流量忽高忽低的工作，團隊同時要求「最具成本效益」與「最少營運負擔」，不想管理任何伺服器。最適合的做法是？"
  options={[
    '開一組固定數量的 EC2 隨時待命處理',
    '使用 AWS Lambda，由事件觸發、只為實際執行付費',
    '購買 3 年期預留執行個體長期運行',
    '自建一台大型 EC2 並手動擴充',
  ]}
  answer={1}>

**正解：B**

當題目同時要「最省」又「最少營運負擔」，且負載是事件驅動、短任務、忽高忽低時，**無伺服器（Lambda）** 往往兩邊都贏：只為實際執行付費、閒置不收錢，擴縮與維運都交給 AWS。A 固定數量的 EC2 離峰仍為閒置付費、還要自己管；C 的預留執行個體是對穩定長期用量的承諾、不適合間歇短任務；D 自建大型 EC2 手動擴充營運負擔最高。

</Quiz>

<Quiz
  qnum={18}
  total={18}
  question="某團隊盤點帳單時發現一批 EC2 的 CPU 使用率長年只有個位數百分比，顯然「開太大」。團隊想拿到「把這些機器調整到剛好大小（右規模）可省多少」的具體建議。最適合的服務是？"
  options={[
    'AWS Cost Explorer',
    'AWS Compute Optimizer',
    'AWS Budgets',
    'AWS Cost Anomaly Detection',
  ]}
  answer={1}>

**正解：B**

「針對 EC2／Lambda 做右規模（right-sizing）、給具體降規建議」正是 **Compute Optimizer**，它用機器學習分析實際用量、建議調到剛好的規格並估算可省比例。A 的 Cost Explorer 只看花費趨勢、不給右規模建議；C 的 Budgets 是設門檻告警；D 的 Cost Anomaly Detection 是偵測異常暴增，皆非右規模工具。

</Quiz>

---

做完了嗎？回去複習 👉 [Domain 4 重點速記 / 閃卡](/saa/domain-4/flashcards)，或查表複習 👉 [Domain 4 服務比較表](/saa/domain-4/comparison)。🎉 恭喜你完成 SAA 四大領域的練習題，接下來就衝刺模擬考、準備應試吧！
