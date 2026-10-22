---
sidebar_position: 4
title: 實戰架構 4：災難復原（DR）架構
---

# 實戰架構 4：災難復原（DR）架構

> 高可用（多 AZ）顧的是「一台機器壞掉」，但如果**整個主要區域（Region）** 都掛了呢？這一篇帶你把前面學過的服務組起來，設計一套能抵禦「區域級災難」的復原架構。重點只有兩個：**容忍多久無法服務、容忍遺失多少資料**，然後依預算選一種策略。

## 先用白話懂兩個關鍵指標

<Term en="Recovery Time Objective" desc="復原時間目標：災難發生後，你能容忍系統多久無法服務。RTO 越小代表停機時間要越短。">RTO</Term> 和 <Term en="Recovery Point Objective" desc="復原點目標：你能容忍遺失多少時間的資料。RPO 越小代表能丟的資料越少。">RPO</Term> 是整篇最常被考的一組觀念，用一條時間軸就懂：

```text
        ← RPO（往回看，能丟多少資料）        → RTO（往前看，多久要復原）
  ───────┬──────────────────┬──────────────────────┬────────→ 時間
      上次複寫/備份        💥 主要區域故障           系統恢復服務
```

- **RTO 往「未來」看**：從災難發生到服務恢復要花多久。架構越即時待命，RTO 越短。
- **RPO 往「過去」看**：從災難點回推到「上一次備份／複寫」之間的資料會不見。複寫越即時，RPO 越小。

<Analogy title="🎮 生活比喻：打電動的存檔">

- **RPO** = 你「**多久存一次檔**」。每 5 分鐘存一次，主機當機最多重打 5 分鐘（丟 5 分鐘進度）。
- **RTO** = 當機後「**多久能重新開始玩**」。開機 30 秒就能繼續 = RTO 30 秒；要重灌遊戲 2 小時 = RTO 2 小時。

你想「幾乎不丟進度、而且秒開」當然最爽，但那要花更多錢（更頻繁存檔＋更好的設備）。DR 策略就是在這兩者和預算之間做取捨。

</Analogy>

## 需求情境：主要區域整個故障時怎麼辦

<Scenario title="真實情境：老闆問「東京整個區域掛了怎麼辦？」">

你負責的系統全部跑在東京區域。老闆問：「如果東京整個區域出大事（不是單一機房，是**整個 Region**），我們多久能恢復？會丟掉多少訂單資料？」

這就是在問你的 **RTO 和 RPO**。你要做的是：(1) 先跟老闆對齊「能停多久、能丟多少」，(2) 把核心資料持續**複寫**到另一個區域，(3) 依預算從下面四種策略選一種，決定「另一個區域平時要待命到什麼程度」。

記住一個底線：多 AZ 只能擋「單一可用區」故障，擋不了「整個區域」級災難，**DR 一定要跨區域**。

</Scenario>

## 四種 DR 策略（核心）

從「最便宜但最慢」到「最貴但最快」，由上往下排。四種策略的差別，本質上就是「**另一個區域平時待命到什麼程度**」：

| 策略 | RTO / RPO | 平時成本 | 怎麼實作 | 適用 |
| --- | --- | --- | --- | --- |
| **Backup & Restore**（備份還原） | RTO、RPO 最長（數小時～數天） | 最低 | 只把備份／快照跨區域存著；災難後用 IaC 從零重建、還原資料 | 預算優先、可容忍較長停機 |
| **Pilot Light**（引導燈） | RTO、RPO 較低（數十分鐘～數小時） | 低 | 核心資料持續複寫、常態運轉（跨區域 RDS 唯讀複本／Aurora）；運算層平時關機待命，災難時才開 | 關鍵資料不能丟、其餘可快速拉起 |
| **Warm Standby**（溫備援） | RTO、RPO 低（數分鐘） | 中高 | 另一區域跑一套**縮小版、隨時運轉**的完整系統，災難時放大（擴充）並接管流量 | 停機要很短的正式系統 |
| **Multi-Site Active/Active**（多站點雙活） | RTO、RPO 幾乎為零 | 最高 | 兩個區域**同時全速服務**，用 Route 53 分流、Aurora Global Database 跨區同步 | 不能停、要求最嚴苛 |

下圖直觀地呈現這個取捨——越往下走，復原越快、成本越高：

```text
  便宜、慢                                              貴、快
  ├──────────────┬──────────────┬──────────────┬──────────────┤
  Backup &       Pilot          Warm           Multi-Site
  Restore        Light          Standby         Active/Active

  待命程度：  只存備份  →  核心常跑  →  縮小版全跑  →  兩區都全速
  RTO/RPO：    數小時~天  → 數十分~時  →   數分鐘   →    趨近 0
```

:::tip[💡 考試重點：一眼對上策略]
- 「**成本最低／預算有限**」又能接受較長復原 → **Backup & Restore**。
- 「核心資料庫先在備援區小規模常態運行、其餘關機省錢」= **Pilot Light** 的招牌描述。
- 「另一區隨時跑一套縮小版、災難時放大」= **Warm Standby**。
- 「**幾乎零停機／最高可用／RTO 與 RPO 趨近 0**」→ **Multi-Site Active/Active**。
:::

## 跨區域落地會用到的服務

把上面四種策略真的做出來，會反覆用到這幾個服務：

| 服務／功能 | 在 DR 裡做什麼 | 常搭配的策略 |
| --- | --- | --- |
| **<Term en="S3 Cross-Region Replication" desc="S3 跨區域複寫：自動把一個儲存貯體的物件複寫到另一個區域的儲存貯體。">S3 跨區域複寫（CRR）</Term>** | 把備份檔、靜態內容自動複寫到另一區域，擋區域級故障 | 全部策略的資料底座 |
| **RDS 快照複製／跨區域唯讀複本** | 把資料庫快照跨區域複製；或在他區建**唯讀複本**持續同步，災難時升為主庫 | Pilot Light、Warm Standby |
| **<Term en="Aurora Global Database" desc="Aurora 全球資料庫：一個主區域寫入，資料以極低延遲複寫到多個次要區域，可快速升為主區域。">Aurora Global Database</Term>** | 跨區域低延遲複寫，RPO 可達秒級，次要區域可快速接管 | Warm Standby、Multi-Site |
| **<Term en="Route 53 Failover Routing" desc="Route 53 故障轉移路由：搭配健康檢查，主區域異常時自動把流量導向備援區域。">Route 53 故障轉移路由</Term>** | 搭配健康檢查，主區域掛掉時自動把使用者流量導到備援區域 | Warm Standby、Multi-Site |
| **<Term en="Infrastructure as Code" desc="基礎設施即程式碼：用範本把整套環境定義成程式碼，可一鍵重新建立。">CloudFormation／IaC</Term>** | 把整套環境寫成範本，災難後**一鍵重建**備援區域的資源 | 特別是 Backup & Restore |

:::info[🔑 一個關鍵觀念：複寫方向與容錯移轉]
備援區域能不能「接得住」，關鍵在**資料有沒有持續複寫過去**。Backup & Restore 只是定時把備份搬過去（RPO 較大）；Pilot Light 以上開始讓資料庫**持續複寫**（RPO 變小）。真的要容錯移轉（failover）時，再把唯讀複本升為主庫、用 Route 53 把流量切過去。
:::

## 怎麼選：RTO/RPO 越低就往越貴的策略走

選擇邏輯其實很單純，先問清楚業務能接受的 RTO 和 RPO，再對照上面的表往下選：

- 只在乎省錢、停機幾小時可接受 → **Backup & Restore**。
- 資料不能丟（RPO 要小）、但停機可容忍一陣子 → **Pilot Light**（核心持續複寫、運算待命）。
- 停機要壓到數分鐘 → **Warm Standby**（他區先養一套縮小版）。
- 連幾分鐘都不能停、要求最嚴苛 → **Multi-Site Active/Active**（最快也最貴）。

:::note[🧭 一句決策口訣]
**要停得越短、丟得越少（RTO／RPO 越低），就往下一級更貴的策略走；預算有多緊，就往上一級更省的策略退。** 四種策略本質上就是在這條「速度 vs 成本」的線上選一個點。
:::

## 常見考題角度

<Scenario title="考題演練：兩種最常見的問法">

**問法一：「RTO 要數分鐘，但預算有限，選哪個？」**

數分鐘的 RTO 已經排除最慢的 Backup & Restore；但「預算有限」又讓你別急著跳到最貴的 Multi-Site。答案通常落在 **Warm Standby**——他區先跑一套縮小版隨時待命，災難時放大就能在數分鐘內接管，成本又比雙活低。

**問法二：「RPO 要近乎為零，選哪個？」**

RPO 近零代表「資料幾乎不能丟」，靠的是**持續、即時的跨區域複寫**。關聯式資料庫的標準答案是 **Aurora Global Database**（跨區域秒級複寫），架構層級則對應 **Multi-Site Active/Active** 或 **Warm Standby**。單純「定時備份」的 Backup & Restore 一定不符合。

</Scenario>

:::tip[💡 抓題訣竅]
看到 **RTO**（能停多久）→ 答案取決於「**備援架構的即時程度**」（待命越完整，RTO 越短）。看到 **RPO**（能丟多少）→ 答案取決於「**複寫／備份的頻率**」（越即時複寫，RPO 越小）。把題目關鍵詞對回這兩條軸，再往對應策略走，幾乎不會錯。
:::

<Refs title="📚 官方資料與延伸閱讀">

- [AWS 白皮書：雲端的災難復原選項（Disaster Recovery Options in the Cloud）](https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-options-in-the-cloud.html)
- [AWS Well-Architected 可靠性支柱（Reliability Pillar）](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html)
- [Aurora 全球資料庫（Amazon Aurora Global Database）](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-global-database.html)

</Refs>

👉 學以致用，回去驗收：[65 題綜合模擬考](../saa/exam-prep/mock-exam.md)
