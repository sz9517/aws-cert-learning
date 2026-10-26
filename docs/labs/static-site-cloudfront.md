---
sidebar_position: 4
title: 實驗 4：S3 + CloudFront 靜態網站全球加速
---

# 實驗 4：S3 + CloudFront 靜態網站全球加速

> 這篇我們要親手把一個靜態網站放上 **S3**，再用 **CloudFront** 幫它做**全球加速**與 **HTTPS**。做完你會得到一個「全世界打開都快、而且貯體完全不對外公開」的網站——這正對應到 SAA Domain 3「高效能架構」裡最愛考的**內容傳遞**主題。

:::note[💬 閱讀小提示]
看到帶<Term desc="像這樣！滑鼠移到有虛線的名詞上（手機點一下），就會跳出白話解釋。">虛線底線的名詞</Term>，把滑鼠移上去就會跳出白話解釋。所有名詞也整理在 [名詞與服務對照表](/glossary)。
:::

:::info[開始前的前提]
這篇假設你已經完成前面的準備：

- 已經做過 [第一個動手實作（EC2 + S3）](../intro/first-hands-on.md)，對 S3 貯體的建立與上傳已經有感覺。
- 已經**設好帳單告警（Billing Alarm）**，花超過門檻會收到通知——這是你的安全網。
- 知道怎麼在主控台右上角**切換區域（Region）**。建議貯體固定開在一個你熟悉的區域（例如東京）。

還沒做完？先回頭補完再來。
:::

## 先用白話把這篇會用到的東西講清楚

- **靜態網站託管（Static Website Hosting）**：網站只有固定的 HTML／CSS／圖片，沒有後端程式在跑。這種網站最適合直接放在 S3 上，不必養一台伺服器。
- **S3 當來源（Origin）**：<Term en="Origin" desc="內容真正的老家，放原始檔案的地方，這篇就是 S3 貯體。">來源</Term>就是你內容「真正的老家」。這篇把放著網頁檔案的 S3 貯體當成 CloudFront 的來源。
- **CloudFront 的邊緣節點快取（Edge Cache）**：<Term en="Amazon CloudFront" desc="AWS 的 CDN，把內容快取到全球邊緣節點，就近服務使用者。">CloudFront</Term> 會把你的網頁複製一份放到全球各地的<Term en="Edge Location" desc="AWS 散佈在全球各大城市的前線小機房，就近服務附近的使用者。">邊緣節點</Term>，使用者就近拿到，延遲最低。
- **OAC（Origin Access Control，來源存取控制）**：一把「**只發給 CloudFront 的鑰匙**」。有了它，貯體可以**維持封鎖公開存取**，卻又只允許 CloudFront 讀取裡面的檔案。
- **HTTPS 預設**：CloudFront 在邊緣就幫你把連線加密，使用者不用設定就走 HTTPS。

<Analogy title="🏪 生活比喻：總倉 + 全球連鎖超商">

把你的網站想成一間**總倉**（S3），裡面放著原始貨品。CloudFront 就像在全球各地開的**連鎖超商**（邊緣節點），先從總倉進一批貨囤著。顧客要買東西直接走到巷口超商（最近的邊緣節點）就拿到了，又快又省運費，根本不用大老遠跑回總倉。而 OAC 就像是「**總倉只跟連鎖超商開門，一般路人進不去**」——貨還是安全鎖在倉庫裡。

</Analogy>

---

## 動手做：把靜態網站放上 S3，再用 CloudFront 加速

### 步驟一：建立 S3 貯體並上傳 index.html

目標：準備好內容的「老家」。

:::info[🤔 為什麼這樣做：為什麼不直接開 S3 靜態網站就好？]
S3 本身有一個「靜態網站託管」功能，開了就能直接給一個網址對外。那為什麼這篇偏偏**不開它**、反而要在前面多架一層 CloudFront？因為 S3 靜態網站端點有三個硬傷：**只走 http 不走 https**（網址列不會有鎖頭）、**沒有全球快取**（海外使用者每次都連回你的來源區域，很慢）、而且要能被看到就得**把貯體設公開**（埋下外洩風險）。所以這篇改用「**貯體維持不公開 + 前面放 CloudFront**」，一次把加密、加速、安全全解決。這也是官方建議的正規做法。
:::

1. 登入 AWS 主控台 → 確認右上角**區域** → 搜尋 `S3` → **建立貯體（Create bucket）**。
2. **貯體名稱（Bucket name）**：必須**全球唯一**，例如 `my-static-site-wang-20261022`（只能小寫字母、數字、連字號）。
3. **封鎖公開存取（Block Public Access）**：**維持勾選「封鎖所有公開存取」——務必保持開啟！** 這篇的重點就是「貯體不對外公開，只讓 CloudFront 讀」。
4. 其他設定維持預設 → **建立貯體**。
5. 在你的電腦上建立一個簡單的首頁檔案 `index.html`：

```bash
# 建一個最簡單的 index.html（任何文字編輯器也行）
cat > index.html <<'HTML'
<!doctype html>
<html lang="zh-Hant">
  <head><meta charset="utf-8"><title>我的第一個全球加速網站</title></head>
  <body>
    <h1>哈囉，CloudFront！</h1>
    <p>這個頁面放在非公開的 S3 貯體，由 CloudFront 全球加速並走 HTTPS。</p>
  </body>
</html>
HTML
```

6. 回到貯體 → **上傳（Upload）** → **新增檔案（Add files）** → 選剛建好的 `index.html` → **上傳**。確認貯體裡出現這個物件。

:::note[👀 這一步你會看到什麼]
貯體建好後，**「封鎖所有公開存取」那一欄會顯示「開啟（On）」**——這是對的、不要去關它。上傳完成後，貯體物件清單裡會出現 `index.html`。此時你**還不能**用瀏覽器打開它（直接點物件的網址會是 Access Denied），因為貯體仍然不公開，而我們還沒把 CloudFront 接上去——這正是預期行為，別急。
:::

### 步驟二：建立 CloudFront distribution，以 S3 為來源並設定 OAC

目標：在 S3 前面架一層全球 CDN，而且用 OAC 安全存取。

:::info[🤔 為什麼這樣做：為什麼用 OAC 讓貯體維持不公開？]
這一步的靈魂是 **OAC（Origin Access Control）**。最偷懶的做法是「把貯體設公開，誰都能讀」——但那正是雲端外洩新聞裡最常見的那一條：工程師為了方便設公開，事後忘了關，整包資料就這樣攤在網路上。OAC 的做法相反：貯體**維持封鎖公開存取**，只在貯體政策裡放行「這個特定的 CloudFront 發佈」一個對象。等於是貯體只對 CloudFront 開一道受控的小門，其他人（包含直接猜到 S3 網址的人）一律 Access Denied。安全性和便利性兼得，這也是考試最愛考的正解。
:::

7. 主控台搜尋 `CloudFront` → **建立發佈（Create distribution）**。
8. **來源網域（Origin domain）**：從清單選你剛建的 S3 貯體。
9. **來源存取（Origin access）**：選 **Origin access control settings（OAC）** → 按 **Create control setting** 建立一組 OAC → 套用。
10. 建立後，CloudFront 會提示你**貯體政策需要更新**，好讓這組 OAC 能讀取貯體。點 **Copy policy（複製政策）**，到 S3 貯體的 **權限（Permissions）› 貯體政策（Bucket policy）** 貼上並儲存。重點：**貯體的「封鎖公開存取」仍然維持開啟**，這段政策只放行 CloudFront。
11. **檢視器協定政策（Viewer protocol policy）**：選 `Redirect HTTP to HTTPS`，讓邊緣節點強制走 HTTPS。
12. **預設根物件（Default root object）**：填 `index.html`。這樣使用者打開網域根路徑時會自動顯示首頁。
13. 其他維持預設 → **建立發佈（Create distribution）**。建立後狀態要等它從部署中變成可用（通常幾分鐘）。

:::note[👀 這一步你會看到什麼]
剛建好時，發佈的 **「上次修改（Last modified）」會顯示「Deploying（部署中）」**，這代表設定正在同步到全球各邊緣節點。等個幾分鐘重新整理，狀態會變成一個時間戳記（代表部署完成、可用了）。**部署中就先去開網頁，很可能看到 403／舊狀態，這是正常的——等它跑完再測。**
:::

:::info[🤔 為什麼這樣做：如果要用自己的網域與憑證，為什麼憑證一定要在 us-east-1？]
這篇用的是 CloudFront 內建的 `*.cloudfront.net` 憑證，所以你**還不用**自己申請憑證。但只要你之後想換成自己的網域（例如 `www.mysite.com`），就得在 **ACM（AWS Certificate Manager）** 申請一張憑證掛到 CloudFront 上——而這張憑證**一定要在 `us-east-1`（北維吉尼亞）這個區域申請**，別的區域申請的 CloudFront 根本選不到。原因是 CloudFront 是**全球服務**，它的憑證是從 `us-east-1` 這個「總部」統一讀取、再推送到全球邊緣節點的。這是極常見的卡關點：很多人在東京申請憑證，結果回到 CloudFront 下拉選單裡怎麼找都找不到那張憑證，就是踩了這個雷。
:::

### 步驟三：用 CloudFront 網域連線看網頁，確認走 HTTPS

目標：驗證成果——網頁打得開、而且是 HTTPS。

14. 回到 distribution 詳情頁，複製 **Distribution domain name**（長得像 `d1234abcd.cloudfront.net`）。
15. 把這個網域貼到瀏覽器打開，應該會看到你的 `哈囉，CloudFront！` 頁面。
16. 看瀏覽器網址列，開頭是 `https://`、出現鎖頭圖示，代表**預設就走 HTTPS**。
17. **關鍵驗證**：試著直接用 S3 物件的公開網址去開（例如 `https://你的貯體.s3.amazonaws.com/index.html`），你會得到 **Access Denied**。這證明了：**貯體維持封鎖公開存取，只有 CloudFront 能讀**。
18. **看快取有沒有生效（最有成就感的一步）**：打開瀏覽器的開發者工具（F12）→ **Network（網路）** 分頁 → 重新整理網頁 → 點那筆 `index.html` 的請求 → 看 **Response Headers（回應標頭）**。找 `X-Cache` 這個標頭：

```bash
# 也可以用命令列看，連按兩次觀察 X-Cache 的變化
curl -I https://你的發佈網域.cloudfront.net/
```

:::note[👀 這一步你會看到什麼：第一次 Miss、第二次 Hit]
- **第一次**打開（或剛改過內容後第一次）：`X-Cache` 會是 **`Miss from cloudfront`**——代表這個邊緣節點手上還沒有快取，它剛跑回 S3 來源拿了一份。
- **重新整理再看第二次**：`X-Cache` 變成 **`Hit from cloudfront`**——代表這次直接命中邊緣快取，**沒有回源**。這就是「全球加速」與「省對外傳輸費」真正發生的瞬間：命中快取的請求又快、又不花你 S3 的對外流量費。

看到 `Miss` → `Hit` 的轉變，就代表 CloudFront 的快取確實在運作了。
:::

:::tip[💡 這一步呼應了責任共擔]
你沒有把貯體設成公開，而是用 OAC 讓 CloudFront 當唯一入口。**AWS 負責雲端本身的安全，你負責雲端裡資料的安全**——把貯體鎖好、只開一道受控的門，正是你該扛的那一半責任。別為了「方便」把貯體設公開。
:::

```bash
# （選配）用 CLI 查看這個發佈的設定與狀態
aws cloudfront get-distribution --id <你的發佈ID>
```

:::warning[🚑 常踩雷]
這個實驗最容易卡住或出錯的四個地方，照著避開：

- **把貯體設成「公開」而不是用 OAC**：為了圖快把貯體開公開，網頁是看得到，但你就埋了一顆外洩地雷，而且考試會判你錯。正解永遠是**貯體維持封鎖公開存取 + OAC**，只讓 CloudFront 讀。做完記得回頭確認貯體的「封鎖所有公開存取」還是 On。
- **ACM 憑證沒在 `us-east-1` 申請**：之後要掛自己的網域時，憑證若申請在東京等其他區域，CloudFront 的下拉選單**根本選不到**它。憑證一律在 `us-east-1`（北維吉尼亞）申請，記住 CloudFront 是全球服務、只從這個區域讀憑證。
- **改了檔案卻看到舊版（快取沒失效）**：你重新上傳了 `index.html`，但打開網頁還是舊內容——因為邊緣節點手上那份快取還在有效期內（TTL 沒到）。要立刻看到新版，得去發佈的 **Invalidations（失效）** 建立一筆 `/*` 失效，把快取清掉；或在測試時用查詢字串（如 `?v=2`）繞過快取。
- **以為一改就馬上全球生效**：不管是改發佈設定、還是建立失效，CloudFront 都要**幾分鐘把變更推到全球邊緣節點**才算數。看到狀態「Deploying」就先等一下，別反覆重試或以為壞掉了——它只是還在部署。
:::

---

## 概念澄清：為什麼不乾脆把貯體直接設公開就好？

既然只是要讓大家看到網頁，為什麼不把 S3 貯體設公開、省掉 CloudFront？因為 CloudFront 一次解決四件事：

- **快取 + 就近**：內容複製到全球邊緣節點，海外使用者就近取得，**延遲大幅降低**，不用每次都連回你的來源區域。
- **HTTPS 幾乎免設定**：CloudFront 在邊緣內建憑證，使用者預設就走加密連線；S3 靜態網站端點本身並不提供 HTTPS。
- **省對外傳輸費**：命中邊緣快取的請求**不回源**，來源負載更低、S3 的對外流量費也明顯下降。
- **安全**：搭配 OAC，貯體**維持非公開**，避免「設公開然後忘了關」這個最常見的雲端外洩事故。

一句話：**把貯體公開只是「能看到」；S3 + CloudFront 是「又快、又安全、又省錢」。**

---

## 清理資源，避免被扣款

:::warning[🧹 做完一定要清理！不清理會持續扣款]
請依序把這次開的東西全部清掉：

**1. 停用並刪除 CloudFront distribution**
- 進 `CloudFront` → 勾選你的發佈 → **Disable（停用）** → 等狀態變成 Disabled。
- 停用完成後，再 **Delete（刪除）** 這個發佈。（CloudFront 必須先停用、完成部署後才能刪除。）

**2. 清空並刪除 S3 貯體**
- 進 `S3` → 點你的貯體 → 全選物件 → **刪除（Delete）**，依指示輸入確認字樣。
- 物件清空後 → 勾選該貯體 → **刪除（Delete）** → 輸入貯體名稱確認。（貯體**必須先清空才能刪除**。）

**3. 回帳單頁確認不再計費**
- 右上角帳號選單 → **帳單與成本管理（Billing and Cost Management）** → 看 **免費方案（Free Tier）** 使用量與目前帳單，確認沒有異常項目。
:::

<Cost title="💰 成本提醒">

CloudFront 有**免費額度**（每月一定量的傳出資料與請求），S3 存放一個小 HTML 檔也幾乎不花錢，照步驟做、做完清理基本上不會扣到錢。真正會讓人中招的，是**忘了停用／刪除 distribution**或**忘了清空刪除貯體**。記住：**資源開了就要記得關。**

</Cost>

---

## 這對考試的意義

- Domain 3（高效能）與 Domain 4（成本最佳化）很愛考 **CloudFront 能同時「降低延遲」和「省下對外傳輸費」**——看到「全球使用者嫌慢、對外流量費又高」的 S3 靜態網站情境，正解幾乎都是 **S3 + CloudFront**。
- 安全面則常考 **OAC（Origin Access Control）**：題目若強調「貯體不能公開、但要讓 CloudFront 讀」，答案就是 **OAC + 封鎖公開存取**，而不是把貯體設公開。

<Refs title="📚 官方資料與延伸閱讀">

- [用 CloudFront 託管 S3 靜態網站（教學）](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/getting-started-secure-static-website-cloudfront.html)
- [用 OAC 限制對 S3 來源的存取](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html)
- [Amazon S3 封鎖公開存取](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html)
- [Amazon CloudFront 開發人員指南](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Introduction.html)

</Refs>

👉 下一個實驗：[RDS Multi-AZ 容錯移轉實測](./rds-multi-az.md)
