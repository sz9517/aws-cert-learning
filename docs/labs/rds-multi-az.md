---
sidebar_position: 5
title: 實驗 5：RDS Multi-AZ 容錯移轉實測
---

# 實驗 5：RDS Multi-AZ 容錯移轉實測

> 前面你已經在文章裡讀過「Multi-AZ 會自動容錯移轉」，但光讀永遠不如親眼看一次。這篇帶你**親手開一個啟用 Multi-AZ 的 RDS，然後故意把主庫踢掉**，看著 RDS 在幾分鐘內自動把另一個可用區的備援升為新主庫——而且**連線端點完全不變**。做過這一次，Domain 2 的「高可用」你就再也不會忘。

<Analogy title="🏢 生活比喻：隔壁分店那本即時同步的帳本">

把主資料庫想成店長每天記帳的**正本帳本**；Multi-AZ 備援就是放在**隔壁分店保險箱裡、逐筆即時同步的副本**。本店失火（可用區故障）時，隔壁那本立刻變正本接著用——這就是**容錯移轉**。這次我們不等失火，直接「演習」：手動點一次容錯移轉，眼見為憑。

</Analogy>

:::info[開始前的前提]
這篇假設你已經完成前面的準備：

- 已經完成 [你的第一個動手實作：EC2 + S3](../intro/first-hands-on.md)，熟悉主控台怎麼操作。
- 已經**設好帳單告警（Billing Alarm）**，花超過門檻會收到通知。
- 整篇固定在**同一個區域（Region）**操作，比較不會找不到自己開的資源。
:::

:::warning[💸 這個實驗跟前面不一樣：很可能會產生費用]
EC2 + S3 那篇走的是免費額度，但 **RDS 比較容易超出免費額度**，請先有心理準備：

- RDS 免費額度有**月用量上限（約 750 小時單 AZ 的 `db.t3.micro` / `db.t4g.micro`、20 GB 儲存）**，一旦你**開了 Multi-AZ，等於同時養兩台**，很可能直接吃掉額度、開始計費。
- 這個實驗就算只留幾小時、就算用最小規格，也**可能產生小額費用**。這是「花小錢換一次真實體驗」，請自行斟酌。
- 若想盡量省：**先用單 AZ 建立、確認會操作後，再把它改成 Multi-AZ**；或整個實驗控制在**一兩個小時內做完就刪**。

最重要的一句話：**做完一定要刪掉，別讓它在背景默默計費。**（清理步驟在最後。）
:::

## 白話：Multi-AZ 到底是什麼？跟唯讀複本差在哪？

- **Multi-AZ（多可用區備援）**：在**同一個區域的另一個可用區**放一份**同步複寫**的備援（寫入兩邊都成功才算完成）。它**平常不給你讀**，純待命；主庫一掛，RDS 會**自動容錯移轉**，把備援升為新主庫。目的是**高可用**。
- **唯讀複本（Read Replica）**：一份或多份**非同步**的拷貝，專門用來**分攤讀取流量**。它**不會自動容錯移轉**（主庫掛了不會自動接手），目的是**擴展讀取效能**。

一句話記住：**Multi-AZ 防「掛掉」、唯讀複本解「讀太慢」。** 考試最愛把這兩個混在一起考。

## 動手做：建立 Multi-AZ RDS 並手動觸發容錯移轉

目標：開一個啟用 Multi-AZ 的 RDS，記下寫入端點，然後手動觸發一次容錯移轉，親眼看它切到另一個可用區。

### 步驟一：建立一個啟用 Multi-AZ 的 RDS

1. 登入 AWS 主控台 → 確認右上角**區域**是你要用的那個 → 搜尋列輸入 `RDS` → 進入 RDS 服務。
2. 點**建立資料庫（Create database）**。
3. 建立方式選**標準建立（Standard create）**。
4. **引擎類型（Engine）**：選 **MySQL** 或 **PostgreSQL**（兩者都可以，以下以 MySQL 為例）。
5. **範本（Templates）**：選**開發／測試（Dev/Test）**（練習用，比較省）。
6. **可用性與耐久性（Availability and durability）**：這是本篇的重點——選**建立待命執行個體（Multi-AZ DB instance deployment）**。這一步就是幫你在另一個可用區開一台同步的備援。
7. **設定（Settings）**：設定資料庫識別名稱（例如 `lab5-multiaz`）、主要使用者名稱與密碼，密碼記下來等一下連線要用。
8. **執行個體組態（Instance configuration）**：選 `db.t3.micro`（或 `db.t4g.micro`），認明**符合免費方案資格（Free tier eligible）**的字樣。
9. **儲存（Storage）**：維持預設最小值即可（例如 20 GB 一般用途 SSD）。
10. **連線（Connectivity）**：維持**預設 VPC**；為了方便待會用 EC2 驗證，可把 RDS 和 EC2 放在**同一個 VPC**。新手這裡維持預設即可。
11. 其他設定維持預設 → 點**建立資料庫（Create database）**。

:::tip[💡 想更省錢的做法]
你也可以在第 6 步**先選「單一 AZ（Single-AZ）」**把資料庫建起來、確認整個流程會操作，之後再到**修改（Modify）**把它改成 Multi-AZ。這樣前期只養一台，真要省錢時很有用。改成 Multi-AZ 後才需要做下面的容錯移轉測試。
:::

### 步驟二：等建立完成，記下寫入端點（Endpoint）

12. 回到資料庫清單，等**狀態**從 `Creating` 變成 **`Available`**（Multi-AZ 建立會比較久，可能要 10 分鐘以上，耐心等）。
13. 點進這個資料庫 → 在**連線與安全性（Connectivity & security）**頁籤找到**端點（Endpoint）**，長得像這樣：

```bash
lab5-multiaz.abcd1234.ap-northeast-1.rds.amazonaws.com
```

14. 在**組態（Configuration）**頁籤確認 **Multi-AZ：是（Yes）**，並留意主庫目前所在的**可用區（例如 ap-northeast-1a）**，待會容錯移轉後會變成另一個。

### 步驟三：手動觸發容錯移轉（Reboot with failover）

這就是「演習」的關鍵一步：不等真的故障，手動讓 RDS 切到備援。

15. 在資料庫清單勾選你的執行個體 → **動作（Actions） › 重新開機（Reboot）**。
16. 在跳出的視窗**勾選「使用容錯移轉重新開機（Reboot with failover）」** → 確認。
17. 觀察**狀態**會變成 `Rebooting`，接著回到 `Available`。
18. 點進資料庫 → 看**事件（Events）**頁籤，你會看到類似 **「Multi-AZ instance failover started / completed」** 的事件，證明剛剛真的做了一次容錯移轉。
19. 回**組態（Configuration）**頁籤看**可用區**，會發現主庫已經**換到另一個可用區（例如從 ap-northeast-1a 變成 ap-northeast-1c）**——但你的**端點完全沒變**。

:::info[🎯 這就是 Multi-AZ 的精髓：端點不變]
注意剛剛那件事：主庫實際上已經切換到**另一台、在另一個可用區**的機器，但你連線用的**端點（Endpoint）一個字都沒改**。RDS 在底層把這個端點指向新的主庫。這代表你的**應用程式不需要改連線字串、不需要重新部署**，容錯移轉對應用程式幾乎無感——這正是 Multi-AZ 做為高可用方案的價值所在。
:::

### 步驟四（選配）：從一台 EC2 連線驗證

想更有感，可以從同一個 VPC 裡的一台 EC2 連過去（記得把 RDS 安全群組開放來自該 EC2 的資料庫連接埠，MySQL 預設 3306）：

```bash
# 在 EC2 上用端點連進 MySQL（換成你的端點與使用者名稱）
$ mysql -h lab5-multiaz.abcd1234.ap-northeast-1.rds.amazonaws.com -u admin -p

# 連進去後看一下版本，確認真的連上了
mysql> SELECT VERSION();
```

容錯移轉發生時連線會**短暫斷一下**，但用**同一個端點**重連馬上就好——應用程式端只要有基本的重連機制就能平順度過。

## 最重要的一步：清理資源，避免被扣款

:::warning[🧹 做完一定要刪掉 RDS！Multi-AZ 等於兩台，不刪會持續計費]
RDS 不像 EC2「停止」還能省，**只要執行個體還在就會計費**，Multi-AZ 更是雙倍。請務必刪掉：

**1. 刪除 RDS 執行個體**
- 進 `RDS` → 資料庫清單 → 勾選 `lab5-multiaz` → **動作（Actions） › 刪除（Delete）**。
- 跳出的視窗會問要不要**建立最終快照（Create final snapshot）**——練習資料不用留，**取消勾選「建立最終快照」**，以免快照本身留存還要收儲存費。
- （若有勾選「保留自動備份」之類選項也一併取消。）
- 輸入要求的確認字樣 → **刪除**。等狀態變成 `Deleting`、最後從清單消失。

**2. 順手檢查有沒有殘留的快照**
- 在 RDS 左側選單點**快照（Snapshots）**，確認沒有留下不需要、還在佔用儲存費用的手動快照。

**3. 回帳單頁確認不再計費**
- 主控台右上角帳號選單 → **帳單與成本管理（Billing and Cost Management）** → 看目前帳單與**免費方案（Free Tier）**使用量，確認 RDS 項目不再增加。

（別忘了如果你為了驗證開了 EC2，也要一併**終止（Terminate）**。）
:::

<Cost title="💰 成本提醒">

這篇跟 EC2 + S3 那篇最大的不同是：**RDS 很容易超出免費額度**。免費額度的 750 小時是以**單 AZ** 計的，一旦你開 **Multi-AZ 等於同時養兩台**，很可能馬上開始計費。就算用 `db.t3.micro` / `db.t4g.micro` 最小規格、就算只留幾小時，這個實驗**仍可能產生小額費用**。想省錢就**先用單 AZ 建、測完容錯移轉就刪**，並且**做完立刻刪除執行個體（刪除時跳過最終快照）**。一句話：**資源開了就要記得關。**

</Cost>

## 這對考試的意義

Domain 2「設計高可用的架構」幾乎每次都會考這個對照，而且專門設計來讓你搞混：

- 題目出現「**提高可用性 / 自動容錯移轉 / 機房故障也不中斷 / 最少停機**」→ 選 **<Term en="Multi Availability Zone" desc="在同一地區的另一個可用區放即時同步備援，主庫故障時自動切換，端點不變。">Multi-AZ</Term>**。
- 題目出現「**讀取流量太大 / 報表查詢拖垮資料庫 / 減輕主庫讀取負擔**」→ 選 **<Term en="Read Replica" desc="資料庫的唯讀拷貝，非同步複寫，用來分攤查詢流量，不會自動容錯移轉。">唯讀複本（Read Replica）</Term>**。
- 背兩句穩拿分：**Multi-AZ 不分擔讀取、唯讀複本不保證高可用。** 這次你親手看過「端點不變、自動切 AZ」，這題你不會再錯。

<Refs title="📚 官方資料與延伸閱讀">

- [AWS 官方文件：RDS 多可用區部署（Multi-AZ）](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZ.html)
- [重新開機並容錯移轉（Rebooting a DB instance）](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_RebootInstance.html)
- [RDS 唯讀複本（Read Replicas）](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ReadRepl.html)
- [刪除 RDS 執行個體（Deleting a DB instance）](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_DeleteInstance.html)

</Refs>

👉 實驗做完了！回去驗收實力：[65 題綜合模擬考](../saa/exam-prep/mock-exam.md)
