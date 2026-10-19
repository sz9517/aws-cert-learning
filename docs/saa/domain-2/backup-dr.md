---
sidebar_position: 6
title: 備份與災難復原
---

# 備份與災難復原：天塌下來也救得回來

> 高可用（多 AZ）顧的是「一台機器壞掉」，但如果**整個區域（Region）** 發生大地震、大停電呢？這就要靠備份與災難復原（DR）計畫。這篇教你用兩個指標衡量、用四種策略在「復原速度」和「成本」之間做取捨。

<Vocab title="📌 先認識這篇會出現的名詞（完全沒碰過也能懂）">

- **備份（Backup）**：把資料**另外複製一份存起來**，原始資料壞了或被誤刪時可以還原。
- **災難復原（DR, Disaster Recovery）**：當**整個機房／區域級**的大災難發生時，讓系統在另一個地方重新站起來的**整套計畫**。
- **RPO（Recovery Point Objective，復原點目標）**：你能接受**遺失多少時間的資料**。RPO = 1 小時，代表最糟會丟掉最近 1 小時的資料。
- **RTO（Recovery Time Objective，復原時間目標）**：你能接受**系統停機多久**。RTO = 2 小時，代表災難後最多 2 小時內要恢復服務。
- **快照（Snapshot）**：對硬碟（EBS）在某個時間點拍的「**存檔照片**」，可用來還原或複製硬碟。

</Vocab>

:::note[💬 閱讀小提示]
看到帶<Term desc="滑鼠移上去（手機點一下）會跳出白話解釋。">虛線底線的名詞</Term>把滑鼠移上去就有白話解釋，也可查 [名詞與服務對照表](/glossary)。
:::

## 一句話先懂：RPO vs RTO

這是**整篇最常考**的一組觀念，用一條時間軸就懂：

```
        ← RPO（往回看，能丟多少資料）        → RTO（往前看，多久要復原）
  ───────┬──────────────────┬──────────────────────┬────────→ 時間
      上次備份            💥 災難發生              系統恢復服務
```

- **RPO 往「過去」看**：從災難點回推到「上一次備份」之間的資料會不見。**備份越頻繁，RPO 越小（丟得越少）。**
- **RTO 往「未來」看**：從災難發生到服務恢復要花多久。**架構越即時待命，RTO 越短（停機越短）。**

<Analogy title="🎮 生活比喻：打電動的存檔">

- **RPO** = 你「**多久存一次檔**」。每 5 分鐘存一次，主機當機最多重打 5 分鐘（丟 5 分鐘進度）。
- **RTO** = 當機後「**多久能重新開始玩**」。開機 30 秒就能繼續 = RTO 30 秒；要重灌遊戲 2 小時 = RTO 2 小時。

你想「幾乎不丟進度、而且秒開」當然最爽，但那要花更多錢（更頻繁存檔＋更好的設備）。DR 策略就是在這兩者和預算之間做選擇。

</Analogy>

## 四大災難復原策略（速度 vs 成本的取捨）

從「最便宜但最慢」到「最貴但最快」，由上往下排：

| 策略 | 白話 | 平時成本 | 復原速度（RTO） | 適合 |
| --- | --- | --- | --- | --- |
| **Backup & Restore**（備份還原） | 平時只存備份，災難後**從零重建** | 最低 | 最慢（數小時～數天） | 預算優先、可容忍較長停機 |
| **Pilot Light**（引導燈） | 核心（如資料庫）在他區**長期小火慢跑**，其餘災難時才開 | 低 | 較快（數十分鐘～數小時） | 關鍵資料要即時、其餘可快速拉起 |
| **Warm Standby**（溫備援） | 他區跑一套**縮小版、隨時運轉**的完整系統，災難時放大 | 中高 | 快（數分鐘） | 停機要很短的正式系統 |
| **Multi-Site Active/Active**（多站點雙活） | 兩區**同時全速運作**、同時服務流量 | 最高 | 幾乎零停機 | 不能停、要求最嚴苛 |

:::tip[💡 考試重點]
- 題目強調「**成本最低／預算有限**」又能接受較長復原 → **Backup & Restore**。
- 題目要「**幾乎零停機／最高可用／RTO 趨近 0**」→ **Multi-Site Active/Active**（其次 Warm Standby）。
- 看到 **RPO** → 問的是「**能丟多少資料**」→ 靠**備份頻率／複寫**解決。
- 看到 **RTO** → 問的是「**能停機多久**」→ 靠**待命架構的即時程度**解決。
- 「核心資料庫先在備援區小規模常態運行、其餘關機省錢」= **Pilot Light** 的招牌描述。
:::

## 運作流程圖解

<div className="flow">
  <div className="flow-node">主區域正常服務</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">💥 區域級災難</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">依策略在備援區復原</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">流量切到備援區</div>
</div>

*圖：策略越「即時待命」（往 Multi-Site 走），中間這段復原時間（RTO）越短，但平時付的錢越多。*

## 備份的實際工具

- **EBS 快照（Snapshot）**：對 EBS 硬碟拍存檔照片，**存放在 S3**（由 AWS 代管），而且是**增量備份**——第一次拍完整份，之後只存「有變動的部分」，省空間省錢。
- **AMI（Amazon Machine Image）**：把整台 EC2（含系統與資料）打包成映像檔，之後可一鍵開出一模一樣的新機器。
- **跨區域複寫（Cross-Region）**：把快照／備份**複製到另一個 Region**，才擋得住「整個區域級」災難——備份跟正本放同一區，那區全毀就一起陪葬。
- **AWS Backup**：一個**集中管理**所有備份的服務，用排程與政策統一備份 EBS、RDS、DynamoDB、EFS 等，不用每個服務各自設定。

## 實務應用：不只是考試

<Scenario title="真實情境：老闆問「機房燒掉怎麼辦？」">

你負責的系統資料都在東京區。老闆問：「如果東京整個區域出大事，我們多久能恢復？會丟多少訂單資料？」——這就是在問你的 **RTO 和 RPO**。你需要：(1) 定時對資料庫與硬碟做快照、(2) 把快照**複製到另一個 Region**、(3) 依預算選一種 DR 策略。下面先帶你做最基礎的 EBS 快照與跨區複製。

</Scenario>

### 🛠️ 動手做：建立 EBS 快照並複製到另一個區域

1. 主控台搜尋 `EC2` → 左側 **Elastic Block Store › 磁碟區（Volumes）**
2. 勾選要備份的磁碟區 → **動作 › 建立快照** → 加個描述 → 建立
3. 左側 **快照（Snapshots）** 看到剛建立的快照，狀態變 `completed`
4. 選該快照 → **動作 › 複製快照** → **目的地區域**選另一個 Region（例如從東京複到新加坡）→ 複製
5. 這樣即使東京整個區域出事，新加坡還有一份可還原

```bash
# 建立快照
$ aws ec2 create-snapshot --volume-id vol-0abc123 --description "db-backup"

# 把快照複製到另一個 Region（跨區異地備援的關鍵一步）
$ aws ec2 copy-snapshot --source-region ap-northeast-1 \
    --source-snapshot-id snap-0abc123 --region ap-southeast-1
```

<Cost>

**策略越即時待命，平時的帳單越貴**：Backup & Restore 平時幾乎只付「快照存在 S3」的錢（最便宜）；Multi-Site 則要長期養兩套全速運作的環境（最貴）。快照是增量的、只存變動量，相對便宜；但**跨區複製的資料傳輸與另一區的儲存會額外計費**。別為了省小錢而不跨區——那等於沒有災難復原能力。

</Cost>

:::warning[🚑 實務常見錯誤]
- **只備份、從來不演練還原**：備份檔案損毀或還原步驟沒人會做，等真的出事才發現「救不回來」。**備份一定要定期做還原演練**。
- **快照跟正本放同一個 Region**：那個 Region 整個掛掉時，備份也一起沒了。**DR 一定要跨 Region。**
- **把高可用當成災難復原**：多 AZ 只能擋「單一機房」故障，擋不了「整個區域」級災難，兩者要分開規劃。
- **RPO／RTO 定得太嚴卻不給預算**：要求「零丟失、秒復原」就得用 Multi-Site，成本最高，要先對齊預算。
:::

<Refs>

- [AWS 官方文件：災難復原選項（Disaster Recovery Options in the Cloud）](https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-options-in-the-cloud.html)
- [EBS 快照（Amazon EBS snapshots）](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/EBSSnapshots.html)
- [AWS Backup 使用者指南](https://docs.aws.amazon.com/aws-backup/latest/devguide/whatisbackup.html)

</Refs>

## 下一步

- ⚡ 快速複習：[Domain 2 重點速記 / 閃卡](/saa/domain-2/flashcards)
- ✍️ 測試自己：[Domain 2 原創練習題](/saa/domain-2/quiz)
- 📖 下一篇：[資料庫與儲存的高可用](/saa/domain-2/database-ha)
