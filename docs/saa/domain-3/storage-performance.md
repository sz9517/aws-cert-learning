---
sidebar_position: 2
title: 儲存效能選型：EBS／執行個體儲存／EFS／FSx
---

# 儲存效能選型：先搞懂「要快、要共享、還是要便宜？」

> 本篇帶你搞懂四種儲存服務（EBS／執行個體儲存／EFS／FSx）的效能特性怎麼選，這是 Domain 3 最愛考的選型題——題目給你一堆關鍵字，你要秒對應到正確的儲存服務。

<Vocab title="📌 先認識這篇會出現的名詞（完全沒碰過也能懂）">

- **硬碟區／磁碟區（Volume）**：給一台伺服器用的「**一塊硬碟空間**」，可以切大切小、掛上去就能存資料。
- **IOPS（每秒輸入輸出次數）**：硬碟「**一秒能處理幾筆小動作**」，像一秒能翻幾頁書。資料庫這種「很多零碎小讀寫」最在意這個。
- **吞吐量（Throughput）**：硬碟「**一秒能搬多少資料量（MB/s）**」，像一秒能搬幾箱貨。大檔案一次讀一大段最在意這個。
- **持久性（Persistence）**：資料「**關機後還在不在**」。會不見的叫暫存，會留下來的叫持久。
- **檔案共享（File Share）**：**多台伺服器同時掛同一塊空間**、看到同一份檔案，像公司共用的網路磁碟。

</Vocab>

:::note[💬 閱讀小提示]
文章裡只要看到帶<Term desc="像這樣！滑鼠移到有虛線的名詞上（手機點一下），就會跳出白話解釋。">虛線底線的名詞</Term>，把滑鼠移上去就會跳出白話解釋。所有名詞也都整理在 [名詞與服務對照表](/glossary)。
:::

## 為什麼需要它？先講一個會選錯的例子

假設你要替一個「每秒上萬筆交易」的資料庫挑硬碟。你隨手選了便宜又大的 HDD，結果資料庫卡到不行——因為 HDD 擅長「一次搬一大段」，卻不擅長「同時處理超多零碎小讀寫」。又或者你要讓**五台 EC2 同時讀同一批素材**，卻選了一塊只能掛一台的 EBS，結果根本掛不上去。

選錯儲存，不是容量不夠，而是**效能特性對不上需求**。所以 AWS 給你好幾種儲存，每一種都為不同情境優化：要**超高 IOPS** 的資料庫、要**便宜吞吐**的大數據、要**多台共享**的檔案、要**暫存但極快**的運算暫存區——各有各的最佳解。這篇就教你怎麼對號入座。

## 一句話先懂這四種儲存

**EBS** 是掛給單台 EC2 的網路硬碟（可持久）；**執行個體儲存**是直接焊在主機上的暫存硬碟（極快但關機就沒）；**EFS** 是給多台 Linux 同時共享的網路檔案系統；**FSx** 是給 Windows 或高效能運算用的託管檔案系統。

<Analogy title="🏢 生活比喻：把四種儲存想成辦公室裡的不同櫃子">

- <Term en="Elastic Block Store" desc="掛給單台 EC2 的網路區塊儲存，可持久保存，是最常見的雲端硬碟。">EBS</Term>**＝你桌邊的抽屜櫃**：專屬你一個人（一台 EC2），東西放著不會不見，容量可大可小。
- **執行個體儲存（Instance Store）＝桌面上的便條紙區**：伸手就拿、超快，但下班關燈（關機）就被清掉，只能放草稿。
- <Term en="Elastic File System" desc="可讓多台 Linux EC2 同時掛載的共享 NFS 檔案系統，容量自動擴展。">EFS</Term>**＝全公司共用的檔案室**：很多人（多台 EC2）同時進去拿同一份資料，空間自動長大。
- <Term en="Amazon FSx" desc="AWS 的託管檔案系統服務，提供 Windows 檔案伺服器與高效能 Lustre 等選項。">FSx</Term>**＝專業部門的特製檔案室**：一間給 Windows 部門（SMB 共享）、一間給超級電腦運算（Lustre 極高吞吐）。

</Analogy>

## EBS 磁碟區類型怎麼選（最重要的一張表）

EBS 本身還分好幾種「磁碟區類型」，差別在於它偏向 **IOPS（零碎小讀寫）** 還是 **吞吐量（大段搬運）**，以及貴不貴。

| 類型 | 底層 | 偏重 | 最適合 | 白話 |
| --- | --- | --- | --- | --- |
| **gp3**（通用型 SSD） | SSD | 均衡、IOPS/吞吐可獨立調 | 大多數場景、開機碟、一般應用、中小型資料庫 | 預設首選，CP 值高 |
| **io2 Block Express**（高效能 SSD） | SSD | 極高 IOPS、低延遲 | 吃重 I/O 的正式資料庫（Oracle/SAP）、要求高持久性 | 最貴也最猛 |
| **st1**（吞吐最佳化 HDD） | HDD | 高吞吐、循序讀寫 | 大數據、日誌處理、資料倉儲、大檔循序存取 | 便宜又能搬大量資料 |
| **sc1**（冷儲存 HDD） | HDD | 最便宜、極少存取 | 很少用到的冷資料、歸檔 | 最省錢、最慢 |

<Term en="General Purpose SSD gp3" desc="EBS 通用型 SSD，IOPS 與吞吐量可以各自獨立調整，是大多數情況的預設選擇。">gp3</Term> 是「不知道選什麼就先選它」的均衡款；真正吃重的資料庫才升級到 <Term en="Provisioned IOPS SSD io2 Block Express" desc="EBS 最高階 SSD，提供極高 IOPS 與超低延遲，適合關鍵資料庫。">io2 Block Express</Term>。而 <Term en="Throughput Optimized HDD st1" desc="EBS 吞吐最佳化 HDD，擅長大檔循序讀寫、便宜，適合大數據與日誌。">st1</Term> 和 **sc1** 是 HDD，便宜、擅長「一次搬一大段」，但**不要拿來做資料庫**（零碎小讀寫會很慘）。

:::tip[💡 考試重點]
看到關鍵字直接對應，幾乎是送分：
- 題目講 **需要最高 IOPS 的正式資料庫、關鍵業務、要求極低延遲** → **io2 Block Express**
- 題目講 **大檔循序讀寫、巨量資料／大數據、日誌、便宜的吞吐量** → **st1**
- 題目講 **很少存取、歸檔、要最便宜的硬碟** → **sc1**
- 題目講 **多台 EC2（Linux）要同時共享同一份檔案** → **EFS**
- 題目講 **Windows 檔案共享、SMB 協定、要支援 AD** → **FSx for Windows File Server**
- 題目講 **HPC 高效能運算、機器學習訓練、極高吞吐的暫存空間** → **FSx for Lustre**（或 **Instance Store** 當暫存）
- 題目講 **資料「關機後必須保留」** → 千萬**不能選 Instance Store**（關機即消失）
:::

## 共享與暫存：EFS、FSx、執行個體儲存

前面的 EBS 是「一塊硬碟掛一台機器」。但很多情境需要**多台一起用**或**只要快不要留**，這時就輪到這三個登場。

- **執行個體儲存（Instance Store）**：硬碟**實體連接**在 EC2 的宿主機上，所以 IOPS 和延遲極猛；缺點是它跟著這台執行個體生死——**停止或終止執行個體，資料就消失**，只能當暫存（快取、暫存檔、運算中繼資料）。
- **EFS（Elastic File System）**：一套 <Term en="Network File System" desc="Linux 常用的網路檔案共享協定，讓多台機器掛同一份檔案系統。">NFS</Term> 共享檔案系統，**多台 Linux EC2 可以同時掛載同一份資料**，容量隨你放隨你長、不用先分配，適合 Web 伺服器群共用素材、內容管理系統。
- **FSx**：託管的「特製檔案系統」家族，考試最常見兩個：
  - **FSx for Windows File Server**：原生 <Term en="Server Message Block" desc="Windows 環境常用的檔案共享協定。">SMB</Term> 檔案共享、整合 Active Directory，給 Windows 工作負載用。
  - **FSx for Lustre**：為 <Term en="High Performance Computing" desc="用大量運算節點平行處理的高效能運算，例如模擬、基因分析、機器學習訓練。">HPC</Term>、機器學習、大規模分析打造的**極高吞吐**檔案系統，還能無縫接 S3。

## 選型流程圖解

<div className="flow">
  <div className="flow-node">需要多台同時共享嗎？</div>
  <div className="flow-arrow">→ 是（Linux）</div>
  <div className="flow-node">EFS</div>
</div>

<div className="flow">
  <div className="flow-node">共享＋Windows / HPC？</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">FSx（Windows 或 Lustre）</div>
</div>

<div className="flow">
  <div className="flow-node">單台專用、要持久？</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">EBS（看 IOPS/吞吐選 gp3 / io2 / st1 / sc1）</div>
</div>

<div className="flow">
  <div className="flow-node">只要極快、關機消失沒關係？</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Instance Store（暫存）</div>
</div>

*圖：先問「要不要共享」，再問「要不要持久」，最後才在 EBS 裡依 IOPS 或吞吐量挑磁碟區類型。*

## 實務應用：不只是考試

<Scenario title="真實情境：資料庫半夜狂噴延遲警報，老闆要你『救一下』">

你們的訂單資料庫掛在一塊 **gp3** 上，平常好好的，一到促銷每秒上萬筆交易就延遲飆高。你一看監控：IOPS 已經打到 gp3 的上限，硬碟成了瓶頸。選項有二：幫 gp3 加買 IOPS，或直接升級到 **io2 Block Express** 拿到更穩的極高 IOPS 與低延遲。同時你發現前端那群 Web 伺服器各自存了一份重複素材——其實可以改掛 **EFS** 共享同一份，省空間又好維護。下面帶你看怎麼調 EBS 效能。

</Scenario>

### 🛠️ 動手做：幫 EBS 磁碟區加大 IOPS 與吞吐量

1. AWS 主控台搜尋 `EC2` → 左側 **磁碟區（Volumes）** → 選到資料庫那顆磁碟區。
2. **動作（Actions）** → **修改磁碟區（Modify Volume）**。
3. 類型確認是 `gp3`；把 **IOPS** 從預設 3000 往上調（gp3 最高 16000），**吞吐量** 從 125 MB/s 往上調（最高 1000 MB/s）。gp3 的好處就是**兩者可以各自獨立加**，不用為了多一點 IOPS 被迫買更大容量。
4. 若需求遠超 gp3（例如要 64000+ IOPS），建立新磁碟區時改選 `io2`，容量越大可給的 IOPS 越高。
5. 存檔後回監控看延遲是否下降。

```bash
# 把一顆 gp3 磁碟區調到 10000 IOPS、500 MB/s 吞吐量
$ aws ec2 modify-volume \
    --volume-id vol-xxxxxxxx \
    --volume-type gp3 \
    --iops 10000 \
    --throughput 500
```

<Cost>

**EBS 按「配置的容量＋你加買的 IOPS／吞吐量」計費**：gp3 的基礎 3000 IOPS 和 125 MB/s 是免費包含的，加上去才另外算錢，所以 gp3 通常比舊的 gp2 更省。**io2 最貴**（為極高效能付費）、**HDD 的 st1／sc1 最便宜**。**EFS／FSx 按用量計費**，EFS 還能用生命週期策略把少用檔案自動搬到便宜層。練習完記得**刪掉測試磁碟區與檔案系統**，EBS 快照也會持續收費。

</Cost>

:::warning[🚑 實務常見錯誤]
- **拿 HDD（st1／sc1）跑資料庫**：零碎小讀寫會爛到不行，資料庫一律用 SSD（gp3／io2）。
- **把重要資料放 Instance Store**：一停止執行個體就全沒，要保留的資料只能放 EBS／EFS／FSx。
- **以為 EBS 能被多台同時掛**：一般 EBS 一次只掛一台；要多台共享請用 EFS（Linux）或 FSx（Windows）。（註：io1/io2 的 Multi-Attach 是特例，且限同一 AZ。）
- **EFS 掛去跑 Windows**：EFS 是 NFS、給 Linux；Windows 的 SMB 共享要用 FSx for Windows。
- **忘了跨 AZ**：EBS 綁單一 AZ，EFS 天生跨 AZ 高可用；設計高可用時別把資料鎖死在一個 AZ。
:::

<Refs>

- [AWS 官方文件：Amazon EBS 磁碟區類型](https://docs.aws.amazon.com/ebs/latest/userguide/ebs-volume-types.html)
- [Amazon EC2 執行個體儲存（Instance Store）](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/InstanceStorage.html)
- [Amazon EFS 使用者指南](https://docs.aws.amazon.com/efs/latest/ug/whatisefs.html)
- [Amazon FSx 服務總覽](https://aws.amazon.com/fsx/)
- [AWS 儲存服務選型指南](https://docs.aws.amazon.com/decision-guides/latest/storage-on-aws-how-to-choose/choosing-aws-storage-service.html)

</Refs>

## 下一步

- ⚡ 快速複習：[Domain 3 重點速記 / 閃卡](/saa/domain-3/flashcards)
- ✍️ 測試自己：[Domain 3 原創練習題](/saa/domain-3/quiz)
- 📖 下一篇：[資料庫選型](/saa/domain-3/database-selection)
