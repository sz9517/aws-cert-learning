---
sidebar_position: 2
title: S3 儲存類別與生命週期：把冷資料自動搬到便宜的地方
---

# S3 儲存類別與生命週期：把冷資料自動搬到便宜的地方

> 本篇帶你搞懂 S3 的七種儲存類別各自的「取回速度 vs 價格」取捨，以及怎麼用生命週期政策（Lifecycle）把越來越少人碰的「冷資料」自動搬到更便宜的地方。這是 Domain 4 最常考、也最能直接省錢的成本最佳化題。

<Vocab title="📌 先認識這篇會出現的名詞（完全沒碰過也能懂）">

- **物件儲存（Object Storage）**：把每個檔案連同它的資訊當成一個「**物件**」整包存放，而不是切成磁碟區塊。<Term en="Simple Storage Service" desc="AWS 的物件儲存服務，可存放幾乎無限量的檔案（物件），按實際用量計費。">S3</Term> 就是這種儲存。
- **儲存貯體（Bucket）**：放物件的「**大箱子**」，你的檔案都丟在貯體裡，名稱全球唯一。
- **儲存類別（Storage Class）**：同一份檔案可以選「**存放的等級**」——放在隨時好拿但較貴的架上，還是放在深層倉庫便宜但拿得慢。
- **耐久性（Durability）**：資料「**不會不見**」的程度。S3 多數類別是 11 個 9（99.999999999%），幾乎不可能遺失。
- **可用性（Availability）**：資料「**隨時拿得到**」的程度，跟耐久性是兩回事——沒壞不代表此刻一定連得上。
- **取回（Retrieval）**：把存進封存類別的資料「**搬回來變成可讀**」的動作；越便宜的類別，取回越慢、而且可能要另外付取回費。
- **生命週期政策（Lifecycle Policy）**：一組「**自動搬家 / 自動丟棄**」的規則，時間一到就幫你把物件降級或刪掉，不用人工顧。

</Vocab>

:::note[💬 閱讀小提示]
文章裡只要看到帶<Term desc="像這樣！滑鼠移到有虛線的名詞上（手機點一下），就會跳出白話解釋。">虛線底線的名詞</Term>，把滑鼠移上去就會跳出白話解釋。所有名詞也都整理在 [名詞與服務對照表](/glossary)。
:::

## 為什麼需要分儲存類別？先講一個全存貴架子的例子

假設你公司把**所有檔案**都丟進 S3 Standard：昨天的交易紀錄、三年前的稅務憑證、使用者上傳的原始大圖、還有一堆「以防萬一」的備份。這些檔案全放在「隨時好拿、速度最快」的架子上，問題是——**三年前的稅務憑證一年可能碰不到一次**，卻跟昨天的熱門資料付一樣貴的存放費。

這就像把過季衣服、舊課本、紀念品全塞進市中心的精華店面，每坪都是黃金價。聰明的做法是：**常用的留在店面、偶爾用的搬到郊區倉庫、幾乎不碰的封進深層保管箱**。S3 的儲存類別就是這幾種「架子」，而你要做的，是依「這份資料多久碰一次」把它放對地方。**成本最佳化的核心，就是在「取回速度」與「存放價格」之間，依存取頻率找平衡點。**

## 七種儲存類別：一次看懂「取回速度 vs 價格」

| 儲存類別 | 適合的資料 | 取回速度 | 存放費 | 最低儲存天數 | 取回費 |
| --- | --- | --- | --- | --- | --- |
| **S3 Standard** | 常存取的熱資料 | 立即 | 最貴 | 無 | 無 |
| **S3 Intelligent-Tiering** | 存取頻率「未知／會變」 | 立即 | 隨冷熱自動調整 | 無 | 無（但有少量監控費） |
| **S3 Standard-IA** | 偶爾存取、但要馬上拿到 | 立即 | 較便宜 | 30 天 | 有（按取回量） |
| **S3 One Zone-IA** | 可重建、非關鍵、偶爾存取 | 立即 | 更便宜（比 Standard-IA 省約 20%） | 30 天 | 有 |
| **S3 Glacier Instant Retrieval** | 封存但偶爾要「立刻」拿 | 立即（毫秒） | 很便宜 | 90 天 | 有 |
| **S3 Glacier Flexible Retrieval** | 封存、可等幾分鐘到幾小時 | 分鐘～小時 | 更便宜 | 90 天 | 有 |
| **S3 Glacier Deep Archive** | 長期封存、幾乎不取回 | 數小時（12 小時內） | **最便宜** | 180 天 | 有（最慢最省） |

幾個關鍵觀念：

- <Term en="Infrequent Access" desc="不常存取的意思，S3 的 IA 類別存放費較便宜，但每次取回要另外付取回費。">IA（Infrequent Access，不常存取）</Term> 類別的邏輯是「**存放便宜、但取回要收費**」——適合偶爾才碰的資料；如果其實常常讀，取回費會反過來吃掉省下的存放費。
- <Term en="One Zone" desc="資料只存在單一個可用區域（AZ），比跨三區便宜，但該區機房出事時資料可能遺失。">One Zone-IA</Term> 比 Standard-IA 更便宜，代價是資料只放在**單一個可用區域（AZ）**，不像其他類別跨三個 AZ。該 AZ 整個出事時資料可能遺失，所以只放「**掉了能重建、不是關鍵**」的資料（如縮圖、暫存的轉檔結果）。
- <Term en="Glacier" desc="S3 的封存儲存類別家族，存放極便宜，但取回需要時間、而且要付取回費。">Glacier</Term> 三兄弟都是「封存」用，差別在**取回速度**：Instant 毫秒就拿到、Flexible 等幾分鐘到幾小時、Deep Archive 最便宜但要等數小時。
- **最低儲存天數**是陷阱：IA 類別存不滿 30 天、Glacier 存不滿 90／180 天，照樣**按最低天數收費**——所以別把「天天會改」的資料丟進去。

### 白話版：每個類別「為什麼存在、何時選它、什麼時候別用」

同一份檔案放哪一類，只有一個判準：**「這份資料多久碰一次？取回時我能等多久？」** 下面把七種類別拆成「為什麼有它／選它的時機／缺點與何時別用」，看完就能對號入座。

- **S3 Standard —— 為什麼有它**：最單純，隨時最快、沒有取回費、沒有最低天數。**何時選**：天天在讀寫、或存取模式會頻繁變動的熱資料（網站首頁圖、進行中的專案檔）。**缺點／何時別用**：每 GB 存放費最貴；一份一年碰不到幾次的資料還放這，就是在燒錢。
- **S3 Intelligent-Tiering —— 為什麼有它**：解決「**我根本不知道這份資料將來冷熱**」的難題，讓 S3 自動依實際存取搬層。**何時選**：存取頻率未知、不規則、會隨時間改變，而你不想手動管理。**缺點／何時別用**：每個物件要付一點點**監控費**，當物件數量極多又都極小（如幾 KB 的縮圖幾千萬個）時，監控費可能比省下的還多，此時直接挑固定類別更划算。
- **S3 Standard-IA —— 為什麼有它**：給「**偶爾才讀、但一讀就要馬上拿到、而且不能掉**」的資料一個比 Standard 便宜的選擇。**何時選**：每月讀個幾次的資料、要跨三個 AZ 的耐久備份。**缺點／何時別用**：有**取回費**與**30 天最低儲存**、**128 KB 最低計費大小**；讀太頻繁或物件太小、太短命都不划算。
- **S3 One Zone-IA —— 為什麼有它**：在 Standard-IA 之上再砍一刀（約省 20%），代價是**只存單一 AZ**。**何時選**：資料「**掉了能重建**」且非關鍵（縮圖、轉檔中間產物、可重跑的分析輸出）。**缺點／何時別用**：該 AZ 整個出事資料就沒了，**任何關鍵／難重建的資料都不要放**。
- **S3 Glacier Instant Retrieval —— 為什麼有它**：封存價格、卻保留「**毫秒就拿到**」的即時取回。**何時選**：季度才翻一次、但要翻就得立刻看的資料（醫療影像、合規報告）。**缺點／何時別用**：有取回費、**90 天最低儲存**；會常常讀的別放。
- **S3 Glacier Flexible Retrieval —— 為什麼有它**：更便宜，代價是**取回要等幾分鐘到幾小時**。**何時選**：很少取回、取回時可以等的封存（舊專案素材、備份）。**缺點／何時別用**：要「立刻」拿的場景不適合（那要 Instant Retrieval）。
- **S3 Glacier Deep Archive —— 為什麼有它**：**全場最便宜**的封存，給「法規要存很多年、但幾乎永遠不會翻」的資料。**何時選**：7～10 年合規保存、長期冷備份。**缺點／何時別用**：取回要**等數小時**（最長到 12 小時）、**180 天最低儲存**；任何可能需要在一天內拿到的資料都別放。

:::info[🔑 一句話決策：先問「要等多久」再問「多常讀」]
**要立刻拿（毫秒～秒）** 的只剩 Standard／Intelligent-Tiering／Standard-IA／One Zone-IA／Glacier **Instant** Retrieval；**能等分鐘～小時** 才考慮 Glacier Flexible；**能等數小時且幾乎不取回** 才用 Deep Archive。先用「取回等待容忍度」砍掉一半選項，再用「多常讀」在剩下的裡挑最便宜的，就不會選錯。
:::

<Analogy title="🏢 生活比喻：市中心店面 vs 郊區倉庫 vs 深層保管庫">

- **S3 Standard = 市中心精華店面**：伸手就拿到，但每坪租金最貴，只該放天天在賣的熱門商品。
- **Standard-IA / One Zone-IA = 郊區自助倉庫**：租金便宜不少，東西也能當天開車去拿，但「每次進倉取貨要付一筆手續費」（取回費）。One Zone 則是「只租一個倉庫、不備份到別區」，更省但那間倉庫失火就沒了。
- **Glacier Instant = 隔壁棟的保管庫**：一樣便宜，但偶爾才去，拿得到而且很快。
- **Glacier Flexible = 要預約的保管庫**：打電話預約，幾分鐘到幾小時後幫你把箱子搬到門口。
- **Glacier Deep Archive = 深山地下金庫**：租金全場最低，但要取件得排程、等半天才送到——適合法規要你存七年、卻幾乎不會翻出來看的憑證。

</Analogy>

## 存取頻率不確定？用 Intelligent-Tiering 讓它自己搬

很多時候你**根本不知道**一份資料將來多久碰一次：新上線的 App 使用者上傳的檔案，可能前兩週天天看、之後再也沒人點。這種「冷熱不明、而且會變」的資料，手動挑類別很容易挑錯。

<Term en="Intelligent-Tiering" desc="S3 的智慧分層類別，會自動監控每個物件的存取頻率，把變冷的自動降級到便宜層、變熱的再搬回來，不收取回費。">Intelligent-Tiering（智慧分層）</Term> 就是為此設計：它會**自動監控每個物件的存取頻率**，把一陣子沒人碰的物件自動降到便宜層，之後若又被存取就再搬回熱層——而且**沒有取回費**，你只付一點點「監控費」。對存取模式不穩或未知的資料，這是最省心的首選。

**為什麼 Intelligent-Tiering 常常是「最省心」的解？** 因為它幫你把兩個最容易出錯的決定自動化了：一是**你猜不準冷熱**（用 Lifecycle 要自己訂「幾天算冷」，訂錯了就搬早或搬晚）；二是**冷了又變熱的資料**——Lifecycle 只會單向往冷搬，一旦某份舊資料突然又被大量讀取，放在 IA／Glacier 反而被取回費狠咬，而 Intelligent-Tiering 會自動把它搬回熱層、**完全不收取回費**。所以當資料的冷熱「會來回變動」或「你真的不知道」時，它最省心。**但它不是萬用**：如果你的資料冷熱很固定、可預測（例如「日誌就是存 30 天後封存、再也不讀」），那用 Lifecycle 規則直接搬到指定類別更單純、也不用付監控費——此時 Intelligent-Tiering 的監控費反而是多花的。

:::tip[💡 考試重點：關鍵字直接對應類別]
看到關鍵字直接選類別，幾乎是送分：
- 題目講 **「存取頻率未知／不固定／會變」「不想手動管理分層」** → **Intelligent-Tiering**
- 題目講 **「長期封存」「幾乎不會取回」「法規要存很多年」「最低成本」** → **Glacier Deep Archive**
- 題目講 **「封存但偶爾要立刻拿到（毫秒）」** → **Glacier Instant Retrieval**
- 題目講 **「可重建／非關鍵資料」「想省錢且能接受單一 AZ」** → **One Zone-IA**
- 題目講 **「偶爾存取、但要馬上拿、資料要跨區耐久」** → **Standard-IA**
- 題目講 **「要自動把舊資料搬到便宜類別／自動刪除」** → **Lifecycle 生命週期政策**
:::

## 生命週期政策：讓冷資料自己搬家、過期自己刪

你不會想每天手動盯著「哪些檔案該降級了」。<Term en="Lifecycle Policy" desc="S3 貯體上的自動規則，依物件年齡自動把它轉換到更便宜的類別，或在到期時刪除。">生命週期政策（Lifecycle）</Term> 讓你設一次規則，S3 就依物件的「年齡」自動處理，分成兩種動作：

**為什麼要用 Lifecycle，而不是手動搬？** 一個真實貯體裡可能有幾百萬甚至上億個物件，沒有人能手動追蹤「哪個檔案幾天沒人碰、該降級了」。Lifecycle 把「依年齡自動降級／刪除」這件事變成**設一次就長期生效**的規則，不但省掉人工，也避免「忘了清」造成帳單無止盡累積。它和 Intelligent-Tiering 的差別在於**依據什麼搬**：Lifecycle 看的是**物件的年齡（建立幾天了）**，適合冷熱可預測、按時間推進的資料（日誌、備份、合規檔）；Intelligent-Tiering 看的是**實際存取頻率**，適合冷熱不可預測、會來回變的資料。兩者也可以並用。

- **轉換（Transition）**：物件到了指定天數，**自動降級到更便宜的類別**。例如「建立 30 天後 → Standard-IA、90 天後 → Glacier Flexible、365 天後 → Glacier Deep Archive」。
- **到期（Expiration）**：物件到了指定天數，**自動刪除**。例如「日誌存 90 天後自動清掉」，省下永遠累積的存放費。

如果貯體開了<Term en="Versioning" desc="S3 的版本控制功能，開啟後每次覆寫或刪除都會保留舊版本，避免誤刪。">版本控制（Versioning）</Term>，每次覆寫都會留一份舊版本，越積越多也越花錢。生命週期可以針對**非目前版本（noncurrent version）**設規則，例如「舊版本保留 30 天後自動刪除」，自動清掉歷史包袱。

:::tip[💡 考試重點]
Lifecycle 的轉換**只能往更冷、更便宜的方向降級**（例如 Standard → IA → Glacier），不能用它把 Glacier 的資料「自動升回」Standard。若要把 Glacier 的物件變回可立即讀取，必須手動執行**取回（restore）**。另外，很小的物件搬進 IA／Glacier 不一定划算，因為有最低計費容量與最低儲存天數。
:::

## 生命週期流程圖解

<div className="flow">
  <div className="flow-node">物件剛建立：S3 Standard（熱）</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">30 天沒人碰 → Standard-IA</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">90 天 → Glacier Flexible（封存）</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">365 天 → Glacier Deep Archive（最便宜）</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">2555 天（7 年）→ 到期自動刪除</div>
</div>

*圖：資料越老越冷，就讓 Lifecycle 一階一階自動往便宜的類別搬，最後過了保存期限就自動清掉，全程不用人工。*

## 實務應用：不只是考試

<Scenario title="真實情境：老闆說『S3 帳單一直漲，但很多檔案根本沒人在看』">

你查帳單發現：公司的 S3 貯體裡堆了五年的日誌和使用者上傳檔，**全都放在 S3 Standard**。其中三年前的日誌一年都開不到一次，卻跟昨天的熱資料付一樣貴的存放費；更慘的是貯體開了版本控制，每次覆寫留下的舊版本從沒清過，默默佔了快一半的容量。

解法：**設一條 Lifecycle 政策**——物件 30 天後轉 Standard-IA、90 天後轉 Glacier Flexible、一年後轉 Deep Archive，法規到期（例如 7 年）自動刪除；再加一條「**非目前版本保留 30 天後刪除**」清掉舊版本。設一次、從此自動省錢。下面帶你把這條規則設起來。

</Scenario>

### 🛠️ 動手做：幫一個貯體設生命週期規則

1. AWS 主控台搜尋 `S3` → 點進你的**儲存貯體** → 上方分頁選 **管理（Management）**。
2. 在 **生命週期規則（Lifecycle rules）** 區按 **建立生命週期規則**，命名例如 `archive-old-logs`。
3. 規則範圍選 **套用到貯體中所有物件**（或用前置詞 `logs/` 只套到特定資料夾）。
4. 勾選 **在物件的目前版本之間轉換**，新增兩段：`30 天 → Standard-IA`、`90 天 → Glacier Flexible Retrieval`。
5. 勾選 **使目前版本的物件到期**，天數填 `2555`（約 7 年後自動刪除）。
6. 若貯體有開版本控制，再勾 **永久刪除非目前版本**，天數填 `30`，清掉舊版本。
7. 建立後，在物件列表點任一舊物件可看到它的 **儲存類別** 會隨時間自動變化。

也可以用 CLI 一次把規則套上去（把上面主控台的步驟寫成一個 JSON 檔）：

```bash
# 1) 先寫一個生命週期規則檔 lifecycle.json
cat > lifecycle.json <<'JSON'
{
  "Rules": [
    {
      "ID": "archive-old-logs",
      "Filter": { "Prefix": "logs/" },
      "Status": "Enabled",
      "Transitions": [
        { "Days": 30, "StorageClass": "STANDARD_IA" },
        { "Days": 90, "StorageClass": "GLACIER" }
      ],
      "Expiration": { "Days": 2555 },
      "NoncurrentVersionExpiration": { "NoncurrentDays": 30 }
    }
  ]
}
JSON

# 2) 套用到貯體
$ aws s3api put-bucket-lifecycle-configuration \
    --bucket 你的貯體名稱 \
    --lifecycle-configuration file://lifecycle.json

# 3) 查看某個貯體目前套用的生命週期設定（驗證有套上去）
$ aws s3api get-bucket-lifecycle-configuration \
    --bucket 你的貯體名稱
```

**預期結果**：`put` 指令成功時**不會印任何輸出**（沒有錯誤就是成功）；接著 `get` 指令會把你剛設定的 `Rules` 內容原封不動印回來（含 `STANDARD_IA`、`GLACIER` 兩段轉換與到期天數）。規則**不會立刻搬動**既有物件——S3 以 UTC 為準，每天批次評估一次，物件要等「年齡」真的到了設定天數的那一天（的隔天）才會被轉換，所以你當天去看物件的儲存類別**還是原本的**，屬正常現象，不是沒設成功。

<Cost>

**存放費**：Standard 最貴，往 IA、Glacier、Deep Archive 一路遞減，Deep Archive 的每 GB 單價可低到 Standard 的零頭。但省存放費的代價是：**IA／Glacier 類別有最低儲存天數（30／90／180 天）與取回費**，把「常被讀」或「很快又會刪」的資料丟進去，取回費與最低天數反而更貴。**Intelligent-Tiering** 沒有取回費，但每個物件要付一點監控費，物件數量極多且都很小時要留意。練習完記得把測試貯體與物件清一清，避免被最低儲存天數綁住計費。

</Cost>

:::warning[🚑 實務常見錯誤]
- **把常讀資料丟進 IA／Glacier**：存放是便宜了，但每次取回都收取回費，讀得越勤越貴，得不償失。
- **忽略最低儲存天數**：把「幾天就會改或刪」的資料丟進 Standard-IA（最低 30 天）或 Glacier（90／180 天），照最低天數收費，等於多付錢。
- **把關鍵資料放 One Zone-IA**：它只存單一 AZ，該區出事就遺失；只放「掉了能重建」的資料。
- **以為 Lifecycle 能自動把 Glacier 升回 Standard**：轉換只能往更冷降級，要讀 Glacier 資料得手動 restore，且要等取回時間。
- **開了版本控制卻不清舊版本**：舊版本會一直累積佔空間，記得用 Lifecycle 針對非目前版本設到期刪除。
:::

:::warning[🚑 常踩雷]
這幾個是帳單被咬、或資料拿不回來的高頻雷，考試與實務都愛考：

- **把「常存取」的資料放進 IA 卻以為省到**：IA 的存放費是便宜，但**每次取回都收取回費**。一份其實每天被讀的檔放 Standard-IA，取回費加總常常**比直接放 Standard 還貴**——省存放、賠取回，得不償失。判準很簡單：**一個月讀不到一兩次才考慮 IA**。
- **Glacier 取回要時間、而且要另外付取回費**：Glacier 不是「點了就看到」。**Flexible 要等幾分鐘到幾小時、Deep Archive 要等數小時（最長 12 小時）**，而且每次取回都**另計取回費**（取越急越貴）。要「立刻（毫秒）」拿到的只有 **Glacier Instant Retrieval**。把「可能臨時要調閱」的資料丟 Deep Archive，真的要時只能乾等半天。
- **忽略「最低儲存天數」與「最小計費大小」**：**Standard-IA／One Zone-IA 最低 30 天、Glacier Instant／Flexible 最低 90 天、Deep Archive 最低 180 天**；沒存滿就刪，照**最低天數收費**。另外 IA 類別有 **128 KB 最小計費大小**，比它小的物件也**按 128 KB 計費**。所以「幾天就會改或刪」「一堆幾 KB 的小檔」丟進 IA／Glacier 反而更貴。
- **把關鍵資料放 One Zone-IA（單一 AZ 風險）**：它**只存一個可用區域（AZ）**，不像別的類別跨三個 AZ。那個機房一出事，資料就**真的沒了**。只放「掉了能重新產生」的資料（縮圖、轉檔中繼檔）；**關鍵或難重建的資料絕對不要放**。
- **以為 Lifecycle 能把 Glacier「自動升回」Standard**：Lifecycle 的轉換**只能往更冷、更便宜的方向走**。要讀回 Glacier 的物件，得**手動執行 restore**、等取回時間、付取回費——沒有「自動解凍回熱層」這回事。
:::

<Refs title="📚 Official docs & further reading">

- [Amazon S3 儲存類別總覽](https://docs.aws.amazon.com/AmazonS3/latest/userguide/storage-class-intro.html)
- [使用 S3 生命週期管理儲存](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html)
- [S3 Intelligent-Tiering 自動分層](https://docs.aws.amazon.com/AmazonS3/latest/userguide/intelligent-tiering.html)
- [從 S3 Glacier 類別取回封存物件](https://docs.aws.amazon.com/AmazonS3/latest/userguide/restoring-objects.html)
- [S3 版本控制](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Versioning.html)

</Refs>

## 下一步

- ⚡ 快速複習：[Domain 4 重點速記 / 閃卡](/saa/domain-4/flashcards)
- ✍️ 測試自己：[Domain 4 原創練習題](/saa/domain-4/quiz)
- 📖 下一篇：[儲存與資料傳輸成本](/saa/domain-4/storage-transfer-cost)
