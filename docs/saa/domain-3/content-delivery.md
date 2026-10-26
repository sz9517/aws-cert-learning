---
sidebar_position: 5
title: 內容傳遞與全球加速：CloudFront 與 Global Accelerator
---

# 內容傳遞與全球加速：把全球使用者的延遲降到最低

> 本篇帶你搞懂兩個常被混淆的「全球加速」服務：CloudFront（快取內容）與 Global Accelerator（加速連線路徑），這是 Domain 3 高效能架構裡最愛考的選型題。

<Vocab title="📌 先認識這篇會出現的名詞（完全沒碰過也能懂）">

- **CDN（Content Delivery Network，內容傳遞網路）**：一整張散佈在全球的「**就近倉庫**」網路，把你的內容複製一份放到離使用者最近的地方，讓他們不用大老遠連回原廠。
- **邊緣節點（Edge Location）**：AWS 散佈在全球各大城市的「**前線小機房**」，負責就近服務附近的使用者。數量比區域（Region）多很多。
- **來源（Origin）**：內容「**真正的老家**」，也就是放原始檔案的地方，例如 S3 儲存貯體或你的 ALB／伺服器。
- **延遲（Latency）**：請求從使用者出發、到拿到回應的「**來回等待時間**」，距離越遠通常越久。
- **Anycast IP**：**同一個 IP 位址**被全球多個節點同時公告，使用者的封包會自動被導向「**路由上最近的那個節點**」。

</Vocab>

:::note[💬 閱讀小提示]
文章裡只要看到帶<Term desc="像這樣！滑鼠移到有虛線的名詞上（手機點一下），就會跳出白話解釋。">虛線底線的名詞</Term>，把滑鼠移上去就會跳出白話解釋。所有名詞也都整理在 [名詞與服務對照表](/glossary)。
:::

## 為什麼需要它？先講一個會變慢的例子

假設你的網站主機放在東京，但有一位使用者人在巴西。他每打開一張圖片、每載入一段影片，封包都要**橫跨半個地球來回**，光是物理距離就讓他每個請求等上好幾百毫秒——網站感覺卡卡的，影片一直轉圈圈。

問題的根本是：**使用者離伺服器太遠就是慢**，再快的伺服器也救不了光速的限制。

解法有兩條路，而這正是本篇的主角：

1. 把內容**預先複製一份**，放到離使用者最近的<Term en="Edge Location" desc="AWS 散佈在全球各大城市的前線小機房，就近服務附近的使用者。">邊緣節點</Term>——這是 **CloudFront** 做的「內容快取」。
2. 不快取內容，而是讓使用者的連線**走 AWS 自家的高速專網**、而非壅塞的公開網際網路——這是 **Global Accelerator** 做的「路徑加速」。

## 一句話先懂這兩個服務

**CloudFront** 是 AWS 的 <Term en="Content Delivery Network" desc="散佈在全球的就近倉庫網路，把內容快取到離使用者最近的邊緣節點。">CDN</Term>，把靜態與動態內容**快取**到全球邊緣節點，讓使用者就近取得、延遲最低；**Global Accelerator** 則給你**固定的 anycast IP**，把流量導進 AWS 全球專網，加速（但不快取）到後端應用的連線路徑。

<Analogy title="🏪 生活比喻：連鎖超商 vs 高速公路專用道">

- **CloudFront 像「全球連鎖超商」**：總倉（<Term en="Origin" desc="內容真正的老家，放原始檔案的地方，例如 S3 或 ALB。">Origin</Term>）進一批貨，各地的小超商（邊緣節點）先囤一份。你要買東西直接去巷口超商拿（**命中快取**），根本不用跑回總倉——又快又省運費。
- **Global Accelerator 像「進了收費站就走高速公路專用道」**：東西還是在總倉，但你一上路（連進最近的邊緣節點）就走 AWS 自家順暢的專用道，不用塞在滿是車的平面道路（公開網際網路）上，抵達總倉更快更穩。
- 差別一句話：**超商是把貨搬到你附近（快取內容）；專用道是讓你的車跑得更順（加速路徑）**。

</Analogy>

## CloudFront：把內容快取到使用者家門口

<Term en="Amazon CloudFront" desc="AWS 的 CDN 服務，把內容快取到全球邊緣節點，就近服務使用者。">CloudFront</Term> 的核心就是**快取**。第一位使用者請求某張圖片時，邊緣節點會回源到 <Term en="Origin" desc="原始內容來源，常見為 S3 或 ALB。">Origin</Term> 拿一份並存起來；之後附近的使用者再來要同一張圖，就直接從邊緣節點秒回，**不再打擾來源**。

重點能力：

- **快取靜態＋動態內容**：圖片、CSS、JavaScript、影片等靜態資源最適合；也能透過設定加速 API 等動態內容。
- **搭配多種來源**：來源可以是 **S3 儲存貯體**（靜態網站、檔案）、**ALB／EC2**（動態應用），甚至是 AWS 以外的自架伺服器。
- **內建 HTTPS**：在邊緣就幫你做 TLS 加密，可綁自訂網域憑證。
- **整合 <Term en="Web Application Firewall" desc="網站應用防火牆，過濾惡意請求，例如 SQL 注入、跨站腳本。">WAF</Term>**：在最外層的邊緣節點就擋掉惡意流量與常見攻擊，連來源都碰不到。
- **省錢又省力**：命中快取的流量不回源，**來源負載更低、對外流量費更省**。

## Global Accelerator：用 AWS 專網加速連線

<Term en="AWS Global Accelerator" desc="用 AWS 全球專網與固定 anycast IP 加速連線路徑的服務，不快取內容。">Global Accelerator</Term> 不碰你的內容、不做快取，它解決的是「**連線路徑**」的問題。它給你 **2 個固定的 <Term en="Anycast IP" desc="同一個 IP 由全球多個節點同時公告，封包自動導向最近的節點。">anycast IP</Term>**，使用者連上後，流量立刻進入離他最近的邊緣節點，接著全程走 **AWS 全球專網**（而非壅塞的公開網際網路）抵達你在某個區域的後端。

重點能力：

- **非 HTTP 流量也行**：支援 **TCP／UDP**，很適合**線上遊戲、VoIP、IoT**這類即時通訊，而不只是網站。
- **固定 anycast IP**：IP 位址固定不變，方便做 **IP 白名單**，後端換了也不用改 IP。
- **自動容錯移轉**：某個區域的端點出問題，流量會自動導向健康的區域。
- **不快取**：每個請求都真的送到後端，靠的是「路徑更短更穩」而非「就近拿快取」。

## 退一步想：為什麼要用 CDN？「就近送達」到底值多少

把內容放到邊緣節點，省下的不是一點點。延遲的本體是**物理距離**：封包以接近光速在光纖裡跑，東京到巴西來回就是硬生生的兩三百毫秒，這跟你伺服器多強完全無關。而一個網頁通常不是一次請求就載完——它要先抓 HTML、再抓 CSS、JavaScript、一堆圖片，彼此還有先後相依。**每一次來回都吃一份延遲**，距離遠時這些延遲會疊起來，使用者就感覺「整頁慢吞吞」。

CDN 的意義就是把這段來回距離**從「跨半個地球」縮成「到你家巷口」**：

- **延遲大降**：靜態資源命中邊緣快取時，回應來自最近的節點，省掉回源的長途來回。
- **來源更穩更省**：大量重複請求被邊緣擋下，來源（S3／ALB）負載與對外流量費一起降。
- **尖峰扛得住**：突然爆量（如活動、上新片）由遍布全球的邊緣節點分攤，不會把單一來源打垮。
- **安全往外推**：TLS 與 WAF 在邊緣就處理掉，惡意流量根本碰不到來源。

一句話：**CDN 不是「讓伺服器變快」，而是「讓使用者不用大老遠來找伺服器」**。這也是為什麼它對「全球都有使用者、內容又可重複使用（可快取）」的網站幾乎是標配。

## 為什麼是兩件事？CloudFront 與 Global Accelerator 根本在解不同的問題

很多人第一次看會覺得「兩個都是 AWS 全球加速，不是差不多嗎？」——**其實解的是完全不同的問題**，混用會踩大雷。

### 為什麼是 CloudFront（而不是 Global Accelerator）？

- **它解的問題**：同一份內容被全球很多人重複要（圖片、影片、網頁、可快取的 API）。CloudFront 把內容**複製一份放到邊緣**，第二個人以後就不用回源了。
- **相對 Global Accelerator 好在哪**：GA 只是路徑變快，**每個請求還是真的送到後端**；CloudFront 命中快取時**根本不回源**，延遲更低、來源負載更輕、對外流量費更省。
- **優點**：可快取、省流量費、邊緣 HTTPS＋WAF、免費額度、支援動態內容。
- **缺點／限制**：只處理 **HTTP(S)**；內容會被快取，所以**更新內容要處理失效（invalidation）或版本化檔名**，否則使用者拿到舊版；對「每次都要打到後端、不能快取」的即時連線幫不上忙。
- **什麼時候反而別用它**：你的流量是 **TCP/UDP 的非 HTTP 即時連線**（遊戲、VoIP、IoT）、或需要**固定不變的 IP** 做白名單——這時該換 Global Accelerator。

### 為什麼是 Global Accelerator（而不是 CloudFront）？

- **它解的問題**：連線路徑本身太慢太不穩（走壅塞的公開網際網路），而且內容**不能快取**（每個封包都要送到後端）。GA 給你固定 anycast IP，讓流量一上路就走 **AWS 專網**。
- **相對 CloudFront 好在哪**：支援 **TCP/UDP**（CloudFront 不行）、給你**2 個固定 anycast IP**（CloudFront 給的是會變的 DNS 名稱）、跨區自動容錯移轉。
- **優點**：非 HTTP 也行、固定 IP 方便白名單、路徑更短更穩、秒級區域容錯。
- **缺點／限制**：**不快取**（無法降低來源負載或省流量費）、有**固定每小時費用**且無免費額度、對「可快取的網站內容」並不是最省的解。
- **什麼時候反而別用它**：你的內容其實**可以快取**（網站、影片、靜態資源）——那用 CloudFront 又快又省，GA 反而多花錢又沒快取好處。

:::info[🔑 一句話記法：快取 vs 固定 IP]
糾結選哪個時，問自己兩個問題就好：
1. **內容能快取嗎？**（同一份東西很多人重複要）→ 能 → **CloudFront**。
2. **是非 HTTP（TCP/UDP）或需要固定 IP 嗎？**→ 是 → **Global Accelerator**。
兩個都想要也可以**疊著用**：前面 CloudFront 快取 HTTP 內容，後端用 GA 加速非 HTTP 的連線。
:::

## CloudFront vs Global Accelerator 怎麼選（最重要的一張表）

| 比較項目 | CloudFront | Global Accelerator |
| --- | --- | --- |
| 核心手段 | **快取內容**到邊緣節點 | **加速連線路徑**（走 AWS 專網） |
| 協定 | 主要 HTTP／HTTPS（網站、影片） | **TCP／UDP**（遊戲、VoIP、IoT 等） |
| 對外 IP | 給 DNS 名稱（IP 會變） | **2 個固定 anycast IP** |
| 快取 | ✅ 會快取 | ❌ 不快取 |
| 最適合 | 靜態資源、影音串流、可快取的網站 | 非 HTTP 的即時流量、需固定 IP、不需快取 |

:::tip[💡 考試重點]
看到關鍵字直接對應，幾乎是送分：
- 題目講 **網站／影片／靜態資源，要全球加速且「可快取」** → **CloudFront**
- 題目講 **非 HTTP 的 TCP/UDP（遊戲、VoIP、IoT）、要「固定 anycast IP」、不需快取** → **Global Accelerator**
- 題目講 **要在邊緣做 HTTPS ＋ WAF 防護、擋掉攻擊** → **CloudFront**
- 題目講 **S3 靜態網站要加速又「省流量費」** → **S3 + CloudFront**
:::

## 運作流程圖解

<div className="flow">
  <div className="flow-node">巴西的使用者請求一張圖片</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">就近的邊緣節點（Edge Location）</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">命中快取？有 → 秒回；沒有 → 回源抓一份</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">來源 Origin（S3 / ALB，在東京）</div>
</div>

*圖：CloudFront 讓使用者永遠先問「離自己最近的邊緣節點」，只有快取沒命中時才回源，大幅降低延遲與來源負載。*

## 實務應用：不只是考試

<Scenario title="真實情境：你的 S3 靜態網站在海外一直被嫌慢又很貴">

你把一個官網（HTML／CSS／圖片／影片）直接放在東京的 S3 儲存貯體對外公開。歐美使用者反映**載入很慢**，而且因為每次請求都直接打 S3，**對外流量費越滾越高**。老闆要求「**全球都要快、流量費還要降下來**」。——答案就是經典組合：**S3 + CloudFront**。下面帶你做一次。

</Scenario>

### 🛠️ 動手做：用 CloudFront 加速 S3 靜態網站

1. 先準備好一個放著網站檔案的 **S3 儲存貯體**（例如首頁 `index.html`）。
2. AWS 主控台搜尋 `CloudFront` → **建立發佈（Distribution）**。
3. **來源（Origin）** 選你的 S3 儲存貯體；啟用 **OAC（Origin Access Control）**，讓外界只能透過 CloudFront 存取 S3，S3 本身不用對公開開放。
4. **檢視器協定政策** 選 `Redirect HTTP to HTTPS`，讓邊緣節點強制走 HTTPS。
5. （進階）在 **WAF** 選項掛上一組規則，於邊緣擋掉常見攻擊。建立發佈。
6. 建好後複製 CloudFront 的網域名稱（`xxxx.cloudfront.net`）貼到瀏覽器。第一次載入會回源到 S3，之後同一地區的使用者再開就直接命中邊緣快取——**又快，S3 的對外流量也大幅下降**。

```bash
# 查看某個 CloudFront 發佈的設定與狀態
$ aws cloudfront get-distribution \
    --id <你的發佈ID>
# 預期結果：回傳一包 JSON，Distribution.Status 一開始是 "InProgress"，
# 全球部署完成後變成 "Deployed"；DomainName 就是 xxxx.cloudfront.net。
```

**怎麼確認真的命中快取了？** 用瀏覽器開發者工具（F12）看回應標頭 `X-Cache`：

- 第一次載入（或剛改完內容）通常是 `Miss from cloudfront`——代表這次回源抓了。
- 同一資源再載一次，應該變成 `Hit from cloudfront`——代表直接從邊緣回，**沒再打擾 S3**。這就是省流量費的證據。

### 🛠️ 綁自訂網域與 HTTPS 憑證（最容易卡住的一步）

想讓網站用 `www.example.com` 而不是 `xxxx.cloudfront.net`，要在 CloudFront 掛一張 <Term en="AWS Certificate Manager" desc="AWS 的憑證服務，可免費簽發與自動續期 TLS/SSL 憑證。">ACM</Term> 憑證。**關鍵鐵則：給 CloudFront 用的 ACM 憑證一定要簽在 `us-east-1`（維吉尼亞北部）這個區域**，不管你的 S3／ALB 在哪個區域都一樣。

```bash
# ⚠️ 一定要指定 --region us-east-1，否則 CloudFront 的下拉選單裡「看不到」這張憑證
$ aws acm request-certificate \
    --domain-name www.example.com \
    --validation-method DNS \
    --region us-east-1
# 預期結果：回傳 CertificateArn（arn 裡會看到 us-east-1）。
# 之後在 CloudFront 發佈的「Alternate domain name (CNAME)」填 www.example.com，
# 「Custom SSL certificate」才選得到這張簽在 us-east-1 的憑證。
```

> 為什麼是 us-east-1？因為 CloudFront 是全球邊緣服務，它統一只讀 us-east-1 的 ACM。這題在考試和實作都超常坑人——憑證簽錯區域，CloudFront 的下拉選單就是空的，很多人卡在這裡找不到原因。

<Cost>

CloudFront 有**免費額度**（每月一定量的傳出資料與請求），超過才依地區與流量計費；更關鍵的是，**命中快取的流量不回源**，可以明顯降低 S3／EC2 的對外流量費。Global Accelerator 則是**固定每小時費用 ＋ 傳輸費**，沒有免費額度。練習完若用不到，記得**停用／刪除發佈與 Accelerator**，避免持續扣款。

</Cost>

:::warning[🚑 常踩雷]
- **把 Global Accelerator 當 CDN 用**：GA **不快取**，想降低來源負載、省流量費、加速網頁靜態資源，那是 CloudFront 的工作。把 GA 當 CDN 只會多花固定費用又拿不到快取好處。
- **把 CloudFront 當「遊戲加速」用**：CloudFront 只吃 HTTP(S)、而且會快取；線上遊戲／VoIP／IoT 這種 **TCP/UDP 即時連線**要用 Global Accelerator 的固定 anycast IP ＋ 專網路徑。方向搞反，服務根本接不起來。
- **CloudFront 的 ACM 憑證沒簽在 us-east-1**：給 CloudFront 用的自訂網域憑證**一定要在 `us-east-1` 簽發**，否則 CloudFront 下拉選單裡**找不到**這張憑證。不管你的來源在哪個區域都一樣，這是全球服務的硬性規定。
- **狂用快取失效（Invalidation）當更新手段**：Invalidation **每月只有前 1,000 個路徑免費，超過要收費**，而且全球生效要時間。正確做法是**檔名版本化**（如 `app.v2.js`、`style.abc123.css`），改了就換檔名，讓 CDN 自然抓新檔，把 invalidation 留給少數緊急情況。
- **沒設 TTL／快取策略（Cache Policy）就上線**：沒好好設 TTL 或快取鍵，可能**該快取的沒快取**（命中率低、一直回源、延遲與帳單都高），或**不該快取的被快取**（每個人看到別人的個人化頁面）。靜態資源給長 TTL，動態／個人化內容用正確的快取鍵或乾脆不快取。
- **快取未更新內容還在舊版**：改了檔案卻忘了失效或版本化檔名，使用者會一直拿到邊緣的舊快取。
- **S3 直接對公開開放**：應改用 CloudFront + OAC，S3 不直接對外，更安全也更省流量費。
:::

<Refs>

- [AWS 官方文件：Amazon CloudFront 開發人員指南](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Introduction.html)
- [AWS Global Accelerator 開發人員指南](https://docs.aws.amazon.com/global-accelerator/latest/dg/what-is-global-accelerator.html)
- [用 CloudFront 提供 S3 內容（限制存取 OAC）](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html)
- [CloudFront 與 AWS WAF 整合](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/distribution-web-aws-waf.html)
- [為 CloudFront 綁自訂網域與 SSL 憑證（憑證須在 us-east-1）](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cnames-and-https-requirements.html)
- [管理 CloudFront 快取：TTL 與快取策略](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/controlling-the-cache-key.html)
- [CloudFront 失效（Invalidation）與計費](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Invalidation.html)
- [CloudFront 與 Global Accelerator 的差異（AWS FAQ）](https://aws.amazon.com/global-accelerator/faqs/)

</Refs>

## 下一步

- ⚡ 快速複習：[Domain 3 重點速記 / 閃卡](/saa/domain-3/flashcards)
- ✍️ 測試自己：[Domain 3 原創練習題](/saa/domain-3/quiz)
- 📖 下一篇：[高效能解耦與資料串流](/saa/domain-3/streaming-decoupling)
