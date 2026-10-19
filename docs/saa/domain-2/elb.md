---
sidebar_position: 2
title: 彈性負載平衡 ELB
---

# ELB：幫你的網站「自動分流、不怕某台當機」

> 本篇帶你搞懂三種負載平衡器（ALB／NLB／GWLB）怎麼選，這是 Domain 2 高可用架構裡最常考的選型題。

<Vocab title="📌 先認識這篇會出現的名詞（完全沒碰過也能懂）">

- **負載平衡器（Load Balancer）**：站在使用者和你後端伺服器「**中間的櫃台**」，把湧進來的流量平均分給後面每一台伺服器。
- **可用區（AZ, Availability Zone）**：同一個區域（Region）裡**實體分開的機房**。一個 AZ 停電，另一個 AZ 還能照常運作。
- **目標群組（Target Group）**：負載平衡器後面「**一群要收流量的伺服器**」的名單（可以是 EC2、IP 或 Lambda）。
- **健康檢查（Health Check）**：負載平衡器定期「**敲門問還活著嗎？**」，壞掉的伺服器就不再分流量給它。

</Vocab>

:::note[💬 閱讀小提示]
文章裡只要看到帶<Term desc="像這樣！滑鼠移到有虛線的名詞上（手機點一下），就會跳出白話解釋。">虛線底線的名詞</Term>，把滑鼠移上去就會跳出白話解釋。所有名詞也都整理在 [名詞與服務對照表](/glossary)。
:::

## 為什麼需要它？先講一個會出事的例子

假設你的購物網站只跑在**一台** EC2 上。雙十一流量暴增，這台扛不住就當機，全站掛掉；就算流量正常，哪天這台所在的機房（AZ）停電，網站一樣全黑。

解法是：**開多台 EC2、分散在不同 AZ**，前面擺一個<Term en="Elastic Load Balancing" desc="站在使用者和後端伺服器中間，自動把流量平均分給多台伺服器的服務。">ELB</Term>當櫃台。使用者只連到 ELB，ELB 再把每一筆請求分給還活著的伺服器。某台掛了、某個 AZ 停電，ELB 自動跳過它——使用者完全無感。這就是「高可用」。

## 一句話先懂 ELB

**ELB（Elastic Load Balancing）** 自動把進來的流量分散到多台後端，並透過**健康檢查**只把流量送給正常的目標，是 AWS 達成高可用與水平擴展的入口。

<Analogy title="🏢 生活比喻：把 ELB 想成餐廳門口的帶位員">

- **帶位員（ELB）** 站在門口，客人一來就帶到「目前有空、服務正常」的桌子。
- **多張桌子（多台 EC2）** 分散在不同包廂（不同 AZ），一間包廂冷氣壞了，帶位員就不往那帶。
- **巡桌確認（健康檢查）**：帶位員定時去看每桌狀況，桌子出問題就暫時不帶客人過去。
- 客人全程只認「門口的帶位員」，完全不用知道自己被帶到第幾桌——這就是 ELB 幫你隱藏後端細節。

</Analogy>

## 三種負載平衡器怎麼選（最重要的一張表）

| 類型 | 運作層級 | 看得懂什麼 | 最適合 | 固定 IP |
| --- | --- | --- | --- | --- |
| **ALB**（Application LB） | 第 7 層（應用層） | HTTP／HTTPS、網址路徑、主機名稱 | 一般網站、API、微服務（依路徑/網域分流） | ❌（給 DNS 名稱） |
| **NLB**（Network LB） | 第 4 層（傳輸層） | TCP／UDP、連線 | 極高效能、低延遲、遊戲/金融、需要固定 IP | ✅（每個 AZ 一個靜態/彈性 IP） |
| **GWLB**（Gateway LB） | 第 3/4 層 | IP 封包 | 串接第三方**網路資安設備**（防火牆、IDS/IPS） | — |

<Term en="Application Load Balancer" desc="第 7 層負載平衡器，看得懂 HTTP，可依網址路徑或主機名稱分流。">ALB</Term> 的強項是「**聰明分流**」：`/api/*` 送到 API 伺服器、`/images/*` 送到圖片伺服器，或依網域把 `shop.example.com` 和 `blog.example.com` 分開。<Term en="Network Load Balancer" desc="第 4 層負載平衡器，處理 TCP/UDP，效能極高、延遲極低，可提供固定 IP。">NLB</Term> 不看內容、只看連線，所以**快到可以處理每秒數百萬請求**，而且能給你**靜態 IP**。

:::tip[💡 考試重點]
看到關鍵字直接對應，幾乎是送分：
- 題目講 **HTTP／HTTPS、依路徑或網域分流、微服務** → **ALB**
- 題目講 **TCP/UDP、超高效能、超低延遲、需要「固定／靜態 IP」或「白名單 IP」** → **NLB**
- 題目講 **串接第三方防火牆／入侵偵測設備** → **GWLB**
- 題目講 **要同時用到多個 AZ 達成高可用** → ELB 一定要在**建立時勾選 ≥ 2 個 AZ**（最常被忽略的設定）
:::

## 運作流程圖解

<div className="flow">
  <div className="flow-node">使用者請求</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">ELB（跨多個 AZ）</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">健康檢查篩掉壞掉的目標</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">分流到正常的 EC2（AZ-a / AZ-b）</div>
</div>

*圖：ELB 只把流量送給健康檢查通過的目標，並橫跨多個 AZ，任何單台或單一 AZ 故障都不影響服務。*

## 實務應用：不只是考試

<Scenario title="真實情境：你的 API 三不五時就有人回報『連不上』">

查了半天發現：你只開一台 EC2 跑 API，部署新版本重啟的那幾秒、或機器偶發當機，使用者就斷線。老闆要求「**部署不要再斷線、單台掛掉要自動頂上**」。——答案就是：多台 EC2 分散 AZ + 前面掛一個 ALB，健康檢查自動把流量導到正常的機器。下面帶你做一次。

</Scenario>

### 🛠️ 動手做：建立一個橫跨兩個 AZ 的 ALB

1. 先在**兩個不同 AZ** 各開一台 EC2（例如 `ap-northeast-1a` 與 `1c`），都裝好同一個網站。
2. AWS 主控台搜尋 `EC2` → 左側 **目標群組（Target Groups）** → **建立目標群組**，類型選 `Instances`，把兩台 EC2 都加進去，健康檢查路徑填 `/health`（或 `/`）。
3. 左側 **負載平衡器（Load Balancers）** → **建立 Application Load Balancer**。
4. **網路對應**：勾選**至少兩個 AZ**（這步就是高可用的關鍵！）。
5. **監聽器（Listener）**：`HTTP:80` → 轉送到剛剛的目標群組。建立。
6. 建好後複製 ALB 的 DNS 名稱貼到瀏覽器，重整幾次會分流到不同機器。接著手動把一台 EC2 關機，網站**依然正常**——流量自動全導到另一台。

```bash
# 查看目標群組健康狀態，壞掉的目標會顯示 unhealthy
$ aws elbv2 describe-target-health \
    --target-group-arn <你的目標群組ARN>
```

<Cost>

ALB／NLB 本身**按小時 + 流量（LCU）計費**，不是免費；但相較於「全站掛掉的損失」非常划算。練習完記得**刪掉 ALB 與測試用 EC2**。EC2 用 Free Tier 的 `t2.micro`，ALB 沒有免費額度，用完就刪最保險。

</Cost>

:::warning[🚑 實務常見錯誤]
- **只掛一個 AZ**：那就失去高可用的意義了，單一 AZ 停電照樣全掛。ELB 一定要跨 ≥ 2 個 AZ。
- **健康檢查路徑設錯**：填了一個會回 404 的路徑，結果所有目標都被判定 unhealthy，ELB 直接回 503。
- **Security Group 沒放行**：後端 EC2 的 SG 要允許來自「ELB 的 SG」的流量，否則健康檢查永遠失敗。
- **誤用 ALB 處理純 TCP 遊戲流量**：需要超低延遲或固定 IP 時應選 NLB。
:::

<Refs>

- [AWS 官方文件：Elastic Load Balancing 使用者指南](https://docs.aws.amazon.com/elasticloadbalancing/latest/userguide/what-is-load-balancing.html)
- [Application Load Balancer 說明](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/introduction.html)
- [Network Load Balancer 說明](https://docs.aws.amazon.com/elasticloadbalancing/latest/network/introduction.html)
- [目標群組的健康檢查](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/target-group-health-checks.html)

</Refs>

## 下一步

- ⚡ 快速複習：[Domain 2 重點速記 / 閃卡](/saa/domain-2/flashcards)
- ✍️ 測試自己：[Domain 2 原創練習題](/saa/domain-2/quiz)
- 📖 下一篇：[自動擴展（Auto Scaling）](/saa/domain-2/auto-scaling)
