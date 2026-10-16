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
- **TLS/SSL 憑證**：讓瀏覽器與伺服器之間的連線加密的「身分證 + 密鑰」。

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

:::warning[🚑 常見錯誤]
- **把 ACM 憑證建錯區域**：CloudFront 用的憑證沒建在 `us-east-1`，會在控制台選不到。
- **只設 SG 以為就安全**：SG 擋不了 SQL injection 這類「內容攻擊」，那是 **WAF** 的工作。
- **小專案買 Shield Advanced**：Standard 已自動涵蓋常見 DDoS，別白花一個月三千美金。
:::

<Refs>

- [AWS WAF 開發人員指南](https://docs.aws.amazon.com/waf/latest/developerguide/what-is-aws-waf.html)
- [AWS Shield 運作方式](https://docs.aws.amazon.com/waf/latest/developerguide/ddos-overview.html)
- [AWS Certificate Manager（ACM）](https://docs.aws.amazon.com/acm/latest/userguide/acm-overview.html)

</Refs>

## 下一步

- 📖 下一篇：[S3 資料安全](./s3-security.md)
- ⚡ 複習：[Domain 1 重點速記 / 閃卡](./flashcards.md)
