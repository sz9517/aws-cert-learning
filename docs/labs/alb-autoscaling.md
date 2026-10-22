---
sidebar_position: 3
title: 實驗 3：ALB + Auto Scaling 高可用網站
---

# 實驗 3：ALB + Auto Scaling 高可用網站

> 這個實驗要親手做出一個「**一台掛掉也不會斷線、流量變大會自動長出新機器**」的網站。做完這一次，你對 Domain 2 最愛考的「**彈性（Elasticity）＋高可用（High Availability）**」就不再只是背名詞，而是真的看過它在你眼前發生。

:::note[💬 閱讀小提示]
看到帶<Term desc="像這樣！滑鼠移到有虛線的名詞上（手機點一下），就會跳出白話解釋。">虛線底線的名詞</Term>，把滑鼠移上去就會跳出白話解釋。所有名詞也整理在 [名詞與服務對照表](/glossary)。
:::

## 這一次我們要做什麼？

前面的入門實作，你開過一台 EC2。但「只有一台」有兩個致命傷：**那台掛了，全站就黑**；**流量暴增時，那台就被打垮**。這個實驗要補上兩個關鍵元件：

- **<Term en="Application Load Balancer" desc="第 7 層負載平衡器，看得懂 HTTP，把流量分給後面多台健康的伺服器。">ALB</Term>**：站在最前面的櫃台，把流量分給後面多台機器，並自動跳過壞掉的那台。
- **<Term en="Auto Scaling Group" desc="自動擴展群組，依設定的台數與條件自動增減 EC2 數量。">ASG</Term>**：負責「該有幾台機器」，掛了自動補、流量大了自動長。

兩者合起來，就是一個**跨多個可用區、能自我修復、能自動擴展**的高可用網站。

<Analogy title="🍜 生活比喻：一間永遠不會打烊的連鎖拉麵店">

- **目標群組（Target Group）** = 這個品牌「目前營業中的分店名單」。
- **ALB（帶位員）** = 客人一上門，就帶去名單裡「還開著、還有空」的分店。
- **啟動範本（Launch Template）** = 「開新分店的標準作業手冊」：裝潢、菜單、機型都照這份開，每間都一模一樣。
- **ASG（總部的展店制度）** = 規定「最少開幾間、平常開幾間、最多開到幾間」；哪間分店倒了，總部立刻照手冊再開一間補上。
- **健康檢查（Health Check）** = 總部定時打電話問每間分店「還開著嗎？」，沒接電話的就先從帶位名單拿掉。

客人全程只認「帶位員」，完全不用知道自己被帶到第幾間分店——這就是高可用。

</Analogy>

:::info[開始前的前提]
這個實驗假設你已經備好以下安全網與基礎：

- 已經完成**入門動手實作**（開過 EC2、建過 S3、知道怎麼在主控台切換**區域（Region）**）。
- 已經有一個**至少兩個子網路、分屬兩個不同可用區（AZ）的 VPC**。帳號內建的**預設 VPC** 通常每個 AZ 都已經有一個子網路，直接用它即可；如果你想自己手刻一個，可以參考「實驗 1：用 VPC 打造你的私有網路」裡跨兩個 AZ 的做法。
- 已經**設好帳單告警（Billing Alarm）**，花超過門檻會收到通知。

還沒補齊？先回頭做完，這些是你不會被意外扣款的最後防線。
:::

## 先把幾個名詞講成白話

在動手前，先把這五個會一直出現的名詞用大白話過一遍：

- **目標群組（Target Group）**：ALB 後面「一群要收流量的機器」的名單。ALB 自己不處理請求，它只負責把請求丟給名單裡健康的成員。
- **Application Load Balancer（ALB）**：站在使用者和後端之間的櫃台，依 HTTP 請求把流量**平均分（分流）**給目標群組裡的機器。它給你的是一個 **DNS 名稱**，不是固定 IP。
- **啟動範本（Launch Template）**：一份「開新機器的規格說明書」——用哪個系統映像（AMI）、哪種機型、掛哪個安全群組、開機時要跑什麼指令。ASG 要加機器時，就照這份範本開。
- **Auto Scaling 群組（ASG）**：負責「維持你要的機器數量」。你設 **最小／期望／最大** 三個數字，ASG 會持續把實際台數拉回**期望值**；少一台就補一台，這就是**自我修復**。
- **健康檢查（Health Check）**：ALB（與 ASG）定時「敲門問還活著嗎」。回應正常的才算健康、才會收到流量；壞掉的會被拉出名單。

<Analogy title="🏢 為什麼「跨多個 AZ」就能高可用？">

一個**可用區（AZ）**就是一座實體獨立的機房。如果你所有機器都擠在同一個 AZ，那座機房一停電，你全掛。把機器**分散在兩個以上的 AZ**，就等於把雞蛋放在不同籃子裡：一個 AZ 出事，另一個 AZ 的機器照常服務，ALB 會自動把流量全導到還活著的那邊。這就是 AWS 高可用設計的鐵律——**永遠跨至少 2 個 AZ**。

</Analogy>

---

## 動手做：四步蓋出高可用網站

全程建議固定在同一個**區域**（例如「亞太區域（東京）ap-northeast-1」），比較不會找不到自己開的東西。

### 步驟一：建立一個簡單的啟動範本

目標：寫好一份「開機器的規格說明書」，讓每台新機器一開機就自動變成一台會顯示自己主機名稱的網頁伺服器。

1. 登入 AWS 主控台 → 確認右上角**區域** → 搜尋 `EC2` → 進入 EC2 服務。
2. 左側選單找到 **啟動範本（Launch Templates）** → **建立啟動範本（Create launch template）**。
3. **名稱**：取個好認的，例如 `ha-web-template`。
4. **應用程式與 OS 映像（AMI）**：選 **Amazon Linux**（通常是「Amazon Linux 2023」，標示「符合免費方案資格」）。
5. **執行個體類型（Instance type）**：選 **t2.micro 或 t3.micro**，認明「符合免費方案資格（Free tier eligible）」。
6. **金鑰對（Key pair）**：這次用不到自己連線，可選**不使用金鑰對**。
7. **網路設定 › 安全群組（Security Group）**：建立或選一個**允許 HTTP（連接埠 80）**連入的安全群組（這樣 ALB 才打得進來）。
8. 展開**進階詳細資訊（Advanced details）**，在最下面的 **使用者資料（User data）** 貼上下面這段開機腳本——它會在機器開機時自動裝好 `httpd` 並顯示這台機器的主機名稱：

```bash
#!/bin/bash
# 安裝並啟動 Apache（httpd）
dnf install -y httpd
systemctl enable --now httpd
# 把這台機器的主機名稱寫進首頁，等一下重整就能看出是哪一台在服務
echo "<h1>Hello from $(hostname -f)</h1>" > /var/www/html/index.html
```

9. 按**建立啟動範本**。

:::tip[💡 為什麼要在首頁印出主機名稱？]
因為等一下你會透過 ALB 連進去，而 ALB 會把你每次的請求分到不同機器。首頁印出**主機名稱**，就能用肉眼看出「這次是哪一台在回我」——重整幾次看到名稱在變，就證明**分流真的有在運作**。
:::

### 步驟二：建立跨兩個 AZ 的 Auto Scaling 群組

目標：用剛剛的範本，開出一組「至少 2 台、分散在兩個 AZ、掛了會自動補」的機器。

1. EC2 左側選單點 **Auto Scaling 群組（Auto Scaling Groups）** → **建立 Auto Scaling 群組**。
2. **名稱**：例如 `ha-web-asg`；**啟動範本**選剛剛建的 `ha-web-template` → 下一步。
3. **網路**：選你的 **VPC**，並在子網路欄**勾選兩個分屬不同 AZ 的子網路**（這一步就是高可用的關鍵）→ 下一步。
4. **負載平衡**：這裡先選**不要附加到負載平衡器（No load balancer）**——我們下一步再建好 ALB 回來掛（這樣步驟比較清楚）。
5. **群組大小（Group size）**：
   - **最小容量（Minimum）**：`2`
   - **期望容量（Desired）**：`2`
   - **最大容量（Maximum）**：`4`
6. 其餘維持預設 → **建立 Auto Scaling 群組**。
7. 建好後，到 **執行個體（Instances）** 清單確認：ASG 已經幫你自動開了 **2 台**機器，而且**分別落在兩個不同的 AZ**。

```bash
# 確認 ASG 開了幾台、各自在哪個 AZ（換成你的群組名稱）
aws autoscaling describe-auto-scaling-groups \
    --auto-scaling-group-names ha-web-asg \
    --query "AutoScalingGroups[0].Instances[].{Id:InstanceId,AZ:AvailabilityZone,State:LifecycleState}"
```

### 步驟三：建立 ALB 與目標群組，把 ASG 掛上去

目標：在機器前面擺一個 ALB 當櫃台，並把 ASG 接到它後面。

1. EC2 左側選單點 **目標群組（Target Groups）** → **建立目標群組**。
2. 目標類型選 **執行個體（Instances）**；**通訊協定／連接埠**填 `HTTP:80`；選你的 **VPC**；**健康檢查路徑**填 `/` → 建立。**這一步先不用手動加機器**，等一下交給 ASG 自動註冊。
3. 回左側 **負載平衡器（Load Balancers）** → **建立 Application Load Balancer**。
4. **配置（Scheme）**：選**面向網際網路（Internet-facing）**。
5. **網路對應（Network mapping）**：選同一個 VPC，並**勾選跟 ASG 相同的那兩個 AZ／子網路**（兩邊要對得上）。
6. **安全群組**：選一個**允許 HTTP（連接埠 80）從網際網路連入**的安全群組。
7. **監聽器（Listener）**：`HTTP:80` → 轉送到步驟三建立的那個目標群組 → **建立負載平衡器**。
8. 最後回頭把 ASG 接上去：到 **Auto Scaling 群組 › `ha-web-asg` › 編輯**，在**負載平衡（Load balancing）**區塊選**附加到現有的目標群組**，選剛剛的目標群組並儲存。從此 ASG 新開的機器都會**自動註冊**到這個目標群組。

### 步驟四：用 ALB 的 DNS 連進去，看見分流

1. 進 **負載平衡器**，複製你的 ALB 的 **DNS 名稱**（長得像 `ha-web-alb-xxxx.ap-northeast-1.elb.amazonaws.com`）。
2. 先到**目標群組**確認兩台機器的健康狀態都變成 **healthy**（剛建好可能要等一兩分鐘健康檢查通過）。
3. 把 ALB 的 DNS 名稱貼到瀏覽器打開，你會看到 `Hello from ip-xxx...`。
4. **重整幾次**（或 Ctrl/Cmd + Shift + R 強制重整），你會看到**主機名稱在兩台之間切換**——這就代表 ALB 真的把你的請求**分流**給了不同機器。

```bash
# 隨時查看目標群組的健康狀態，壞掉的目標會顯示 unhealthy
aws elbv2 describe-target-health \
    --target-group-arn <你的目標群組ARN>
```

---

## 驗證高可用：故意弄掛一台

這是整個實驗最過癮的一步——我們親手「殺掉」一台機器，看系統怎麼自我修復。

1. 到 **EC2 › 執行個體**，挑一台目前 `running` 的機器 → **執行個體狀態（Instance state）› 終止執行個體（Terminate instance）** → 確認。
2. 立刻切回瀏覽器**不斷重整**那個 ALB 的 DNS 網址。你會發現：**網站完全沒斷線**，只是從此只回另一台（還活著的）機器的主機名稱——因為 ALB 的**健康檢查**發現壞掉那台不再回應，就把流量全導到健康的那台。
3. 過一兩分鐘再看 **Auto Scaling 群組** 的活動歷史與執行個體清單：ASG 發現實際台數（1）低於**期望容量（2）**，會**自動照啟動範本再開一台新機器**補回來，等它健康檢查通過，目標群組又變回 2 台 healthy。

:::info[你剛剛親眼看到的三件事]
1. **ALB 自動避開壞掉的目標**——使用者無感，服務不中斷。
2. **ASG 自動把台數補回期望值**——這就是「自我修復（self-healing）」。
3. 整個過程**你沒有動一根手指去開機器**——這就是彈性與高可用的威力。
:::

---

## 最重要的一步：清理資源，避免被扣款

:::warning[🧹 做完一定要清理！順序很重要]
請**依序**把這次開的東西清掉，順序錯了會一直補機器或刪不掉：

**1. 先刪 Auto Scaling 群組（會自動連帶終止它開的執行個體）**
- 進 **EC2 › Auto Scaling 群組** → 勾選 `ha-web-asg` → **刪除（Delete）** → 輸入確認。
- 刪掉 ASG 後，它底下那幾台 EC2 會**自動被終止**，你**不用**再一台台手動關（如果你手動關，ASG 只會再補一台，所以一定要先從 ASG 下手）。

**2. 刪掉 Application Load Balancer**
- 進 **EC2 › 負載平衡器** → 勾選你的 ALB → **動作（Actions）› 刪除（Delete）** → 輸入確認。

**3. 刪掉目標群組**
- 進 **EC2 › 目標群組** → 勾選剛剛那個 → **動作 › 刪除**。

**4. 刪掉啟動範本**
- 進 **EC2 › 啟動範本** → 勾選 `ha-web-template` → **動作 › 刪除範本**。

**5. 確認不再計費**
- 回**執行個體**清單，確認那幾台都已經是 `Terminated`。
- 到主控台右上角 **帳單與成本管理（Billing and Cost Management）**，確認沒有多出來的 ALB 或 EC2 項目。
- **特別提醒**：**ALB 沒有免費額度**，它是按**小時 + 流量單位（LCU，Load Balancer Capacity Unit）**計費的，只要它還在、哪怕沒人連，都會按小時計費。所以 ALB 用完一定要刪。
:::

:::note
養成「**先刪 ASG、再刪 ALB／目標群組、最後刪範本**」的順序肌肉記憶。先刪 ASG 的理由只有一個：ASG 的天職就是「把台數維持在期望值」，你不先解除它，手動關掉的機器都會被它默默補回來。
:::

<Cost title="💰 成本提醒">

這個實驗用的 `t2.micro`／`t3.micro` 在**免費額度**內，但只要你同時開 2～4 台並持續跑，很容易**超出**單月免費時數上限。更重要的是 **ALB 完全沒有免費額度**，按小時與 LCU 計費。所以：**做完立刻清理**，尤其別忘了那個 ALB——它是這個實驗裡最會默默燒錢的東西。

</Cost>

---

## 這對考試的意義

Domain 2（設計具韌性與高效能的架構）最愛考的一組答案，就是你這個實驗親手搭出來的組合：

- 題目只要出現「**單台／單一 AZ 故障也不能中斷服務**」「**流量尖峰要自動擴充**」「**要能自我修復**」這類關鍵字——正解幾乎都是 **ALB + Auto Scaling + 跨多個 AZ**。
- 常見陷阱是**只掛一個 AZ**：那就失去高可用的意義，單一機房停電照樣全掛。記住鐵律：**ELB 與 ASG 都要橫跨至少 2 個 AZ**。
- 另一個送分重點：ASG 會**持續把實際台數拉回期望容量**，所以「一台掛了會自動補」是它的預設行為，不用額外設定。

你剛剛不是「背」了這個答案，而是**真的看它在你眼前跑過一次**——這種記憶，考場上最靠得住。

<Refs title="📚 官方資料與延伸閱讀">

- [Application Load Balancer 使用者指南](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/introduction.html)
- [Amazon EC2 Auto Scaling 使用者指南](https://docs.aws.amazon.com/autoscaling/ec2/userguide/what-is-amazon-ec2-auto-scaling.html)
- [EC2 啟動範本（Launch Templates）](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-launch-templates.html)
- [把負載平衡器附加到 Auto Scaling 群組](https://docs.aws.amazon.com/autoscaling/ec2/userguide/autoscaling-load-balancer.html)
- [目標群組的健康檢查](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/target-group-health-checks.html)

</Refs>

👉 下一個實驗：[S3 + CloudFront 靜態網站全球加速](./static-site-cloudfront.md)
