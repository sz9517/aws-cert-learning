---
sidebar_position: 5
title: DNS 與流量路由（Route 53）
---

# Route 53：網路世界的「總機與導航」

> 使用者在瀏覽器打的是 `www.example.com`，但電腦之間其實是用 IP 位址溝通。把人類看得懂的網域名稱翻譯成 IP，就是 DNS 的工作——而 Route 53 是 AWS 的 DNS 服務，還能幫你把流量「導」到最健康、最近、最適合的伺服器。

<Vocab title="📌 先認識這篇會出現的名詞（完全沒碰過也能懂）">

- **DNS（Domain Name System）**：把網域名稱（`example.com`）翻譯成 IP 位址（`52.1.2.3`）的「**網路電話簿**」。
- **網域名稱（Domain Name）**：人類好記的網站地址，例如 `example.com`。
- **記錄（Record）**：電話簿裡的一筆資料，告訴大家「這個名字對應到哪個 IP 或哪個資源」。
- **健康檢查（Health Check）**：Route 53 定時去「敲門」問伺服器還活著嗎，壞掉就不再把人導過去。

</Vocab>

:::note[💬 閱讀小提示]
文章裡只要看到帶<Term desc="像這樣！滑鼠移到有虛線的名詞上（手機點一下），就會跳出白話解釋。">虛線底線的名詞</Term>，把滑鼠移上去就會跳出白話解釋。所有名詞也都整理在 [名詞與服務對照表](/glossary)。
:::

## 一句話先懂 Route 53

**Route 53** 是 AWS 的 <Term en="Domain Name System" desc="把網域名稱翻譯成 IP 位址的網路電話簿。">DNS</Term> 服務（名字取自 DNS 使用的 53 埠）。它做兩件事：**（1）把網域名稱翻譯成 IP**，**（2）依照你設定的「路由策略」決定要把每個使用者導向哪一台伺服器**。第二件事，正是它在高可用架構裡的關鍵角色。

<Analogy title="☎️ 生活比喻：把 Route 53 想成一間大公司的總機">

- 你打電話報上要找的「部門名稱」（網域名稱）
- **總機（Route 53）** 幫你轉接到正確分機（IP 位址）
- 聰明的總機還會：看哪個客服最閒（加權）、幫你轉到離你最近的分點（延遲／地理位置）、發現某分機沒人接就自動轉到備援分機（故障轉移 + 健康檢查）

</Analogy>

## DNS 怎麼運作（白話流程）

當你輸入 `www.example.com`：

1. 電腦先問 DNS：「這個名字的 IP 是多少？」
2. 查詢最後會問到管理這個網域的 Route 53
3. Route 53 依你設定的記錄與路由策略回一個 IP
4. 瀏覽器拿到 IP，才真正連上網站

## 路由策略一次看懂（考試最愛考）

Route 53 的威力在於「同一個網域名稱，可以有多筆記錄，用不同策略決定回哪一筆」：

| 路由策略 | 做什麼 | 典型用途 |
| --- | --- | --- |
| **簡單（Simple）** | 一筆記錄對一個或多個 IP，隨機回傳 | 最單純的網站，沒有特殊需求 |
| **加權（Weighted）** | 依你設定的比例分流（例如 90% / 10%） | <Term desc="新舊版本同時上線，用比例慢慢把流量導到新版，有問題可立刻縮回。">藍綠／金絲雀部署</Term>、A/B 測試 |
| **延遲（Latency）** | 回傳「對使用者延遲最低」的區域端點 | 多區域部署，要讓使用者連到最快的那區 |
| **故障轉移（Failover）** | 主要端點健康就用主要，掛了自動切備援 | 主備（Active-Passive）高可用 |
| **地理位置（Geolocation）** | 依使用者**所在國家／地區**回傳不同結果 | 內容在地化、法規限制（某國只能看某版） |
| **地理鄰近（Geoproximity）** | 依地理距離分流，還能用 bias 調整偏向 | 精細控制「哪區服務哪些人」 |
| **多值回應（Multivalue）** | 一次回多個健康的 IP，客戶端自己挑 | 簡易的分散與容錯（非正式負載平衡器） |

:::tip[💡 考試重點]
- 題目說「讓全球使用者連到**延遲最低**的區域」→ 選 **延遲路由（Latency）**。
- 題目說「依**使用者所在國家**提供不同內容／擋特定國家」→ 選 **地理位置路由（Geolocation）**。這兩個最容易被混淆，關鍵字一個是「速度」、一個是「地點」。
- 「主站掛掉要**自動**切到備援站」→ **故障轉移路由 + 健康檢查**。
- 要做**藍綠／金絲雀**慢慢導流 → **加權路由**。
- **Alias vs CNAME**：指向 AWS 資源（ELB、CloudFront、S3 靜態網站）請用 **Alias 記錄**，它**免費**且**根網域（Zone Apex，如 `example.com`）只能用 Alias**，CNAME 無法用在根網域。
:::

## 故障轉移運作圖解

<div className="flow">
  <div className="flow-node">使用者查詢 example.com</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Route 53 看健康檢查</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">主站健康？回主站 IP</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">主站掛了？自動回備援站 IP</div>
</div>

*圖：健康檢查發現主站故障，Route 53 自動把後續查詢導向備援站，使用者幾乎無感。*

## 實務應用：不只是考試

<Scenario title="真實情境：你負責的官網不能有『打不開』的時候">

老闆說：「這個官網是公司門面，主機房如果出事，**不能讓客戶看到錯誤頁**，要自動切到另一區的備援站。」——這正是「故障轉移路由 + 健康檢查」的標準解法。下面帶你做一次。

</Scenario>

### 🛠️ 動手做：用 Failover + 健康檢查做主備高可用

1. 登入 AWS 主控台 → 搜尋列輸入 `Route 53` → 進入服務
2. 先建**健康檢查**：左側 **Health checks** → **Create health check** → 填主站的網域／IP 與監控的路徑（例如 `/health`）→ 建立
3. 進入你的 **託管區域（Hosted Zone）** → **Create record**
4. 建立**主要記錄**：Record name 填 `www`、Routing policy 選 **Failover**、Failover record type 選 **Primary**、關聯剛剛的健康檢查、值填主站（建議對 AWS 資源用 **Alias**）
5. 再建一筆**備援記錄**：同名、Failover 選 **Secondary**、值填備援站
6. 測試：把主站停掉或讓健康檢查失敗，稍待 TTL 後查詢 `www` 會自動回備援站

```bash
# 查詢某網域目前解析到的 IP，驗證切換是否生效
$ dig +short www.example.com

# 用 nslookup 也可以（Windows 常用）
$ nslookup www.example.com
```

<Cost>

Route 53 的計費很小但不是全免：每個**託管區域**約 **$0.50/月**，查詢量另計（每百萬筆查詢數美分等級），**健康檢查**每個約 **$0.50/月**（AWS 端點）。**Alias 記錄指向 AWS 資源的查詢免費**，這是相對 CNAME 的一大好處。練習完把不需要的託管區域與健康檢查刪掉即可。

</Cost>

:::warning[🚑 實務常見錯誤]
- **改了記錄卻沒馬上生效？** DNS 有 **TTL（快取時間）**，舊結果會被快取到過期為止。預計要切換前，先把 TTL 調短（例如 60 秒）。
- **想在根網域 `example.com` 用 CNAME？** 不行！根網域（Zone Apex）只能用 **Alias**。這是最常見的卡關點。
- **只設了故障轉移卻沒建健康檢查？** 那 Route 53 根本不知道主站掛了，不會切換。兩者要搭配。
- **把 Route 53 當負載平衡器？** 多值回應只是「隨機回多個 IP」，沒有連線層級的健康與分流能力，正式負載平衡請用 ELB。
:::

<Refs>

- [AWS 官方文件：Amazon Route 53 開發人員指南](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/Welcome.html)
- [選擇路由策略（Routing policy）](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-policy.html)
- [Route 53 健康檢查與 DNS 故障轉移](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-failover.html)
- [選擇 Alias 或非 Alias 記錄](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resource-record-sets-choosing-alias-non-alias.html)

</Refs>

## 下一步

- ⚡ 快速複習：[Domain 2 重點速記 / 閃卡](/saa/domain-2/flashcards)
- ✍️ 測試自己：[Domain 2 原創練習題](/saa/domain-2/quiz)
- 📖 下一篇：[備份與災難復原](/saa/domain-2/backup-dr)
