---
sidebar_position: 3.7
title: 應用層防護：WAF / Shield / ACM
---

# 應用層防護：WAF、Shield 與 ACM

> SG 和 NACL 守的是「網路層」，但網站還會被 **SQL injection、爬蟲灌爆、DDoS** 攻擊——這些要靠更上層的 **WAF、Shield、ACM** 來擋。SAA 幾乎每份考卷都會碰到其中之一。

<Vocab title="📌 先認識這篇會出現的名詞">

- **WAF（Web Application Firewall，網站應用防火牆）**：檢查 HTTP 請求「內容」的防火牆，擋 SQL injection、跨站腳本等攻擊。
- **DDoS（分散式阻斷服務攻擊）**：壞人用大量流量灌爆你的服務，讓正常使用者連不上。
- **Shield**：AWS 的 **DDoS 防護**服務。
- **ACM（AWS Certificate Manager，憑證管理員）**：免費幫你申請與自動更新 **TLS/SSL 憑證**（就是網址前面的 🔒 HTTPS）。
- **TLS/SSL 憑證**：讓瀏覽器與伺服器之間的連線加密的「身分證 + 金鑰」。

</Vocab>

## 為什麼需要它們？

<Scenario title="真實情境：網站上線當天，被灌爆 + 被打 SQL injection">

你的購物網站剛上線：
1. 競爭對手雇人用**大量假流量**灌爆你的伺服器 → 需要 **Shield** 擋 DDoS。
2. 駭客在搜尋框塞入 `' OR 1=1 --` 想偷資料庫 → 需要 **WAF** 擋 SQL injection。
3. 使用者看到網址是 `http://` 沒有鎖頭，不敢刷卡 → 需要 **ACM** 幫你上 HTTPS。

這三個服務分工守住「應用層」。

</Scenario>

## 三個服務分工表

| 服務 | 擋什麼 / 做什麼 | 掛在哪裡 |
| --- | --- | --- |
| **AWS WAF** | 第 7 層攻擊：SQL injection、XSS、惡意爬蟲、**限制請求速率（Rate limiting）**、按國家封鎖 | CloudFront、ALB、API Gateway |
| **AWS Shield** | **DDoS 攻擊**（第 3／4 層流量洪水） | CloudFront、ALB、Route 53 等邊緣 |
| **ACM** | 發放 / 自動更新 **HTTPS 憑證**（加密連線） | CloudFront、ALB、API Gateway |

### WAF：可以設哪些規則

- **代管規則組（Managed Rule Groups）**：AWS 準備好的常見攻擊規則，一鍵套用（最省事，考試常推薦）。
- **速率限制（Rate-based）**：同一個 IP 5 分鐘內超過 N 次就封鎖——擋暴力嘗試與小型灌爆。
- **地理封鎖 / IP 黑白名單**：只允許特定國家，或封掉特定 IP 段。

### Shield：兩種等級

<Analogy title="🛡️ 生活比喻：Shield 就像保全方案">

- **Shield Standard（標準版）= 內建免費保全**：**自動開啟、完全免費**，擋常見的第 3／4 層 DDoS，每個 AWS 帳號都有。
- **Shield Advanced（進階版）= 貴賓級 24 小時隨扈**：月費約 **US$3,000**，提供 24／7 專家團隊（DRT）、更強防護，還有**攻擊期間暴衝費用的補償**。只有大型／高風險服務才需要。

</Analogy>

:::tip[💡 考試重點]
- 「擋 **SQL injection / XSS / 依國家封鎖 / 限制請求速率**」→ **WAF**。
- 「防 **DDoS**、且問『免費又自動』」→ **Shield Standard**；問「要 24 小時團隊支援 + 費用補償」→ **Shield Advanced**。
- 「要免費、會**自動更新**的 HTTPS 憑證」→ **ACM**。
- ⚠️ 給 **CloudFront** 用的 ACM 憑證，**必須建在 `us-east-1`（維吉尼亞北部）**——這是經典陷阱題。
- ACM 的**公有憑證無法匯出**去別的地方用；要自己掌控私鑰得用別的方案。
:::

## 為什麼選它？優缺點？何時別用？

這三個服務常被一起考，但它們**解決的問題完全不同、也不是互相替代**——而是**疊起來用**。先用白話把「為什麼要這個、而不是只用別的」講清楚。

### WAF：為什麼要它、優缺點、何時別用

**為什麼是它**：SG／NACL 只看「封包從哪來、走哪個埠」，**看不懂 HTTP 內容**。駭客在搜尋框塞 `' OR 1=1 --`、或用假 User-Agent 狂爬你的頁面，封包本身長得跟正常請求一模一樣，SG 根本擋不住。WAF 是唯一會**拆開 HTTP 請求讀內容**的那一層，所以第 7 層（應用層）攻擊非它不可。

<Analogy title="🏢 生活比喻：WAF 是會檢查包裹內容的保全">

SG 像大樓門口的保全，只看「這個人有沒有門禁卡、要去幾樓」；WAF 則會**把包裹拆開檢查裡面裝什麼**——同樣一個人、同樣走正門，但手上拿的是炸彈（SQL injection）就攔下來。

</Analogy>

| 面向 | 說明 |
| --- | --- |
| **優點** | 用代管規則組（Managed Rules）一鍵擋掉 OWASP 常見攻擊；規則即時生效、可按請求內容／國家／速率精細過濾；跟 CloudFront／ALB／API Gateway 原生整合。 |
| **缺點** | 規則寫太嚴會**誤殺正常使用者**（false positive）；按請求數＋規則數計費，高流量站成本會累積；它只看 HTTP 層，**擋不了大流量 DDoS**（那是 Shield 的事）。 |
| **何時別用／限制** | 只有 CloudFront、ALB、API Gateway、AppSync、Cognito 這幾個資源能掛 WAF——**EC2 的公有 IP 不能直接掛 WAF**，得先放到 ALB 或 CloudFront 後面。純內部服務、沒有外來 HTTP 的場景也不需要。 |

### Shield：Standard 還是 Advanced？怎麼選

**為什麼是它**：DDoS 是「用海量流量把你的頻寬／連線數塞爆」，這跟 WAF 擋的「單一惡意請求」是兩回事。Shield 專門吸收並清洗這種流量洪水。

**關鍵觀念：Shield Standard 不用你開、也不用你選——它本來就在**。只要你用 CloudFront、Route 53、ALB 等邊緣服務，常見的第 3／4 層 DDoS 已經被自動擋掉了，**免費、無感、零設定**。

什麼時候才值得跳上 **Advanced**（月費約 US$3,000、通常綁一年）？

| 情境 | 建議 |
| --- | --- |
| 個人練習、小型網站、內部工具 | **Standard 就夠**，別花這筆錢。 |
| 營收高度依賴線上服務、被打一次就損失慘重 | 可考慮 **Advanced**：有 24／7 的 **SRT（Shield Response Team）**可呼叫、更細的攻擊即時指標。 |
| 怕被大型 DDoS 打到自動擴充、帳單暴衝 | **Advanced 有「費用補償」**——因 DDoS 造成的 EC2／ELB／CloudFront／Route 53 擴充費用可申請抵免，這往往是真正值回票價的點。 |
| 合規或客戶要求有 DDoS 事件支援窗口 | Advanced 提供正式的回應流程與報告。 |

<Analogy title="🛡️ 一句話記法：Standard 是免費安全氣囊，Advanced 是加買的全險 + 隨扈">

安全氣囊（Standard）每台車都有、出廠就裝好；全險加隨扈（Advanced）只有「撞一次賠很大」的高價車才划算。你的小車（練習站）不用買全險。

</Analogy>

:::info[🔑 最常被誤會的一點]
**Shield Standard 不需要「開啟」**，也沒有開關可按。考題若說「要先啟用 Shield Standard 才有 DDoS 防護」通常是**錯的敘述**；它是內建、永遠在的。你唯一要做決定的，是「**要不要加錢上 Advanced**」。
:::

### ACM：免費自動續約的好處與限制

**為什麼是它**：自己管 TLS 憑證最痛的不是申請，是**忘記續約**——憑證一過期，整站瀏覽器就跳紅色警告、使用者嚇跑。ACM 的核心價值就是**自動續約**：用 DNS 驗證發的公有憑證，ACM 會在到期前自動換新、自動部署到綁定的服務，你**再也不會因為忘記續約而炸站**。

| 面向 | 說明 |
| --- | --- |
| **優點** | 公有憑證**完全免費**；DNS 驗證後**自動續約、自動輪替**，零維運；跟 CloudFront／ALB／API Gateway 一鍵整合。 |
| **缺點／限制** | 公有憑證**私鑰無法匯出**——你**只能把它用在 AWS 服務上**，不能搬到自架 Nginx、地端伺服器或第三方 CDN；也不能直接掛在 EC2 執行個體上（要透過 ALB／CloudFront）。 |
| **何時別用** | 需要**自己掌控私鑰**、或要在**AWS 以外**的地方用憑證時，ACM 公有憑證幫不了你——改用自己買的憑證，或 ACM Private CA（內部憑證，另計費）。 |

:::info[🔑 自動續約的前提]
ACM 自動續約**只在「DNS 驗證」且驗證用的 CNAME 一直留著**時才成立。若當初用 **Email 驗證**，到期前得手動再驗一次，很容易漏掉——所以**實務一律選 DNS 驗證**。這也是考題常見的陷阱：問「哪種驗證方式能完全自動續約」答 **DNS**。
:::

## 圖解：請求依序通過的防線

<div className="flow">
  <div className="flow-node">使用者（HTTPS）</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Shield（擋 DDoS）</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">WAF（擋惡意請求）</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">ALB（用 ACM 憑證解密）</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">你的應用</div>
</div>

## 實務應用

### 🛠️ 動手做：幫 ALB 上 HTTPS（ACM）

1. 進主控台 → `Certificate Manager` → **申請憑證** → 公有憑證
2. 輸入你的網域（例如 `shop.example.com`）→ 選 **DNS 驗證**（最方便，可自動更新）
3. 按指示在 Route 53 加一筆 CNAME 驗證記錄（同帳號可一鍵建立）
4. 憑證核發後，到 **EC2 → 負載平衡器 → 新增 HTTPS（443）接聽程式**，憑證選剛剛那張
5. 完成後網站就有 🔒，且 ACM 會在到期前**自動更新**

<Cost>

- **WAF**：按「Web ACL 數量 + 規則數 + 請求數」計費，金額不大但非零。
- **Shield Standard**：**免費**。**Shield Advanced**：月費約 **US$3,000**（還有一年期約定），一般練習與小專案**不需要**。
- **ACM 公有憑證**：**免費**，含自動更新。

</Cost>

### 🛠️ 情境走一遍：攔下搜尋框的 SQL injection（WAF）

假設你已經有一台 ALB（網站就掛在它後面），現在要用 WAF 擋掉上面那種 `' OR 1=1 --` 攻擊，一步步做：

1. 主控台 → **WAF & Shield** → **Create web ACL** → Region 選**你 ALB 所在的區域**（給 ALB 用的 WAF 是「區域級」，不是 us-east-1）。
2. **Associated AWS resources** → 加入你的 **ALB**（這一步就是「把 WAF 綁上去」，沒綁等於沒生效）。
3. **Add rules → Add managed rule groups** → 勾選 AWS 的 **`SQL database`** 規則組（專擋 SQL injection）與 **`Core rule set`**。
4. 預設動作（Default action）設 **Allow**（沒命中規則的正常流量放行），規則命中則 **Block**。
5. 建立完成，等一兩分鐘生效。

**預期結果**：用瀏覽器在搜尋框輸入 `' OR 1=1 --` 送出 → 收到 **HTTP 403 Forbidden**（被 WAF 擋下）；正常關鍵字搜尋則一切如常。回到 Web ACL 的 **Sampled requests／CloudWatch 指標**，會看到 `BlockedRequests` 數字跳動、並記錄下被擋的那條請求內容。這就是「WAF 真的有在工作」的憑據。

<Cost>

- **WAF**：按「Web ACL 數量 + 規則數 + 請求數」計費，金額不大但非零。
- **Shield Standard**：**免費**。**Shield Advanced**：月費約 **US$3,000**（還有一年期約定），一般練習與小專案**不需要**。
- **ACM 公有憑證**：**免費**，含自動更新。

</Cost>

:::warning[🚑 常踩雷]
- **ACM 給 CloudFront 用卻建錯區域**：CloudFront 是全球服務，它的憑證**只認 `us-east-1`（維吉尼亞北部）**。你在東京、新加坡建的憑證，在 CloudFront 的憑證下拉選單裡**根本不會出現**——不是沒建好，是建錯區域。給 **ALB／API Gateway** 用的則要建在**那個資源所在的區域**（區域級），別搞混。
- **WAF 建好卻忘記綁資源**：WAF 的 Web ACL 一定要**關聯到 ALB／CloudFront／API Gateway** 才會生效。只建 Web ACL、沒做 association，攻擊照樣打進來——這是最常見的「我明明開了 WAF 怎麼沒擋」。
- **以為 Shield Standard 要另外開**：它是**內建、自動、免費**的，沒有開關。別浪費時間找「啟用 Shield Standard」的按鈕，也別在考題被「要先啟用才有保護」的敘述騙到。
- **只設 SG 以為就安全**：SG 擋不了 SQL injection 這類「內容攻擊」，那是 **WAF** 的工作；大流量 DDoS 則是 **Shield** 的工作。三層各管各的，少一層就少一道防線。
- **ACM 公有憑證想搬去地端／EC2 用**：私鑰匯不出來，**只能綁 AWS 服務**（且 EC2 要透過 ALB／CloudFront，不能直接掛）。要搬出去用請改別的方案。
- **Email 驗證的憑證沒自動續約**：想要「自動續約」一定要用 **DNS 驗證**並保留驗證用的 CNAME，否則到期要手動再驗。
:::

<Refs>

- [AWS WAF 開發人員指南](https://docs.aws.amazon.com/waf/latest/developerguide/what-is-aws-waf.html)
- [AWS Shield 運作方式](https://docs.aws.amazon.com/waf/latest/developerguide/ddos-overview.html)
- [AWS Certificate Manager（ACM）](https://docs.aws.amazon.com/acm/latest/userguide/acm-overview.html)

</Refs>

## 下一步

- 📖 下一篇：[S3 資料安全](./s3-security.md)
- ⚡ 複習：[Domain 1 重點速記 / 閃卡](./flashcards.md)
