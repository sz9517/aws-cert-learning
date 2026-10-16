# 新增文章 SOP

這份是給你自己看的操作手冊（不會出現在網站上）。照著做就能新增 / 修改文章，不需要懂程式。

---

## 0. 心智模型（先懂這個就不會亂）

- **你平常只動一個資料夾：`docs/`**（中文內容）。
- 英文版放在對應的 `i18n/en/.../current/` 底下（第 5 節會教，可之後再補）。
- 檔案是 **Markdown（`.md`）**：純文字 + 少量符號。
- 存檔上傳後，**GitHub 會自動把網站重新發佈**，約 1～2 分鐘後上線。

---

## 1. 資料夾結構對照

```
docs/
├── welcome.md                      首頁
├── intro/                          入門必讀
│   ├── why-aws.md
│   └── what-is-cloud.md
├── saa/                            SAA 證照
│   ├── exam-info.md                考試資訊
│   └── domain-1/                   Domain 1
│       ├── iam.md                  知識點筆記
│       ├── flashcards.md           閃卡
│       └── quiz.md                 練習題
└── glossary.md                     名詞對照表
```

**規則**：資料夾 = 側邊欄的分類；`.md` 檔 = 側邊欄的一頁。

---

## 2. 新增一篇文章：三步驟

### 步驟 1：建立檔案

在對應資料夾新增一個 `.md` 檔，例如要在 Domain 1 新增「VPC 網路」：
建立 `docs/saa/domain-1/vpc.md`。

> 檔名用**英文小寫**、單字用 `-` 連接（例如 `vpc.md`、`s3-storage-classes.md`）。

### 步驟 2：貼上開頭設定（frontmatter）

每個檔案最上面一定要有這段（兩行 `---` 中間）：

```markdown
---
sidebar_position: 3
title: VPC 虛擬私有雲
---
```

- `sidebar_position`：這頁在側邊欄的**排序**（數字小的在上面）。
- `title`：頁面標題，也是側邊欄顯示的名字。

### 步驟 3：寫內容

`---` 底下就是正文，用 Markdown 寫。常用語法：

```markdown
## 這是大標題
### 這是小標題

一般段落文字。**粗體**、`程式碼字`。

- 清單項目一
- 清單項目二

| 欄位 A | 欄位 B |
| --- | --- |
| 內容 1 | 內容 2 |
```

存檔 → 完成！（預覽與上線看第 6、7 節）

---

## 3. 這個網站的「內容模板」（建議每篇照這個順序）

這是我們定下的全站風格，讓每篇都「考得過也用得出來」：

1. **為什麼需要它？** — 用生活化例子講它解決什麼問題
2. **名詞先修** — 把這篇會用到的專門名詞先白話解釋（`<Vocab>`）
3. **核心概念 + 生活比喻**（`<Analogy>`）
4. **圖解**（`<div className="flow">`）
5. **實務應用**：真實情境（`<Scenario>`）＋ 動手做步驟 ＋ CLI 指令
6. **成本提醒**（`<Cost>`）
7. **常見錯誤**（`:::warning`）
8. **閃卡**（`<Flashcards>`）＋ **練習題**（`<Quiz>`）
9. **官方資料與延伸閱讀**（`<Refs>`，放在文末「下一步」之前）

---

## 4. 專屬元件怎麼用（複製貼上就好）

> ⚠️ 元件裡若要用 Markdown（清單、粗體），**內容上下要各留一行空行**。

### 名詞提示（滑鼠移上去看解釋）

```markdown
<Term en="Virtual Private Cloud" desc="你在 AWS 裡的私人虛擬網路。">VPC</Term>
```

- 縮寫請填 `en`（英文全名）；一般名詞不用填 `en`，只給 `desc`。

### 名詞先修框（灰底）

```markdown
<Vocab title="📌 先認識這篇會出現的名詞">

- **VPC（Virtual Private Cloud）**：你在 AWS 裡的私人虛擬網路。
- **子網路（Subnet）**：VPC 裡再切出來的小網段。

</Vocab>
```

### 生活比喻框（橘色虛線）

```markdown
<Analogy title="🏢 生活比喻：VPC 就像你租的辦公大樓樓層">

這裡寫比喻內容，可以用清單或粗體。

</Analogy>
```

### 真實情境框（藍色虛線）

```markdown
<Scenario title="真實情境：公司要你把資料庫藏起來不讓外網存取">

這裡寫情境內容。

</Scenario>
```

### 成本提醒框（紅色）

```markdown
<Cost>

這個練習會用到 NAT Gateway，會按小時計費，練習完記得刪除。

</Cost>
```

### 圖解流程

```markdown
<div className="flow">
  <div className="flow-node">使用者</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">網際網路閘道</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">公有子網路</div>
</div>
```

### 內建提示框（考試重點、警告等）

```markdown
:::tip[💡 考試重點]
重點內容寫這裡。
:::

:::warning[🚑 常見錯誤]
容易踩的雷寫這裡。
:::

:::note
一般補充說明。
:::
```

### 閃卡（點一下翻開）

```markdown
<Flashcards>
  <Flashcard term="名詞一">說明一。</Flashcard>
  <Flashcard term="名詞二">說明二。</Flashcard>
</Flashcards>
```

### 練習題（先作答再看解析）

```markdown
<Quiz
  qnum={1}
  total={3}
  question="題目寫這裡？"
  options={[
    '選項 A',
    '選項 B',
    '選項 C',
    '選項 D',
  ]}
  answer={2}>

**正解：C** — 解析寫這裡，可用 Markdown。

</Quiz>
```

- `answer` 是正解的**索引**，從 0 開始：A=0、B=1、**C=2**、D=3。

### 官方資料與延伸閱讀（每篇文末放一個）

放在文章最後、「下一步」之前。裡面用 **Markdown 清單**列官方連結，之後要加連結只要多貼一行即可：

```markdown
<Refs>

- [AWS 官方文件：IAM 使用者指南](https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html)
- [IAM 安全最佳實務](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)

</Refs>
```

- 標題預設是「📚 官方資料與延伸閱讀」；英文版請加上 `title="📚 Official docs & further reading"`。
- 建議放 **AWS 官方文件**為主（最權威、不會過期）。貼上去前最好點一次確認連結能開。

---

## 5. 加英文版（可之後再補）

把中文檔複製一份，翻成英文，放到對應的英文資料夾：

| 中文（你寫的） | 英文版要放這裡 |
| --- | --- |
| `docs/saa/domain-1/vpc.md` | `i18n/en/docusaurus-plugin-content-docs/current/saa/domain-1/vpc.md` |

> 規則：把路徑裡的 `docs/` 換成 `i18n/en/docusaurus-plugin-content-docs/current/`，其餘路徑一樣。

**重點**：

- 英文版裡的**連結要用相對路徑**（例如 `./iam.md`、`../../glossary.md`），切語言時才會連到英文頁。
- 如果某頁還沒寫英文版，網站在英文模式會**自動顯示中文**，不會壞。
- 元件（`<Quiz>`、`<Analogy>` 等）中英文都一樣用。

---

## 6. 本機預覽（寫的時候即時看效果）

在專案資料夾開終端機，執行：

```bash
npm start
```

瀏覽器會開 `http://localhost:3000/aws-cert-learning/`，**你改檔案存檔，畫面會自動更新**。

- 看英文版：`npm start -- --locale en`
- 關掉預覽：終端機按 `Ctrl + C`

> 註：`npm start` 的搜尋框可能沒結果，那是正常的；搜尋只在正式上線版生效。

---

## 7. 上線（讓網站更新）

寫好、本機看過沒問題後，三種方式擇一「上傳」：

### 方式 A：在 GitHub 網站直接編輯（最簡單，免工具）

1. 打開你的 repo `github.com/sz9517/aws-cert-learning`
2. 走到檔案 → 點鉛筆 ✏️ 編輯，或 `Add file` 新增檔案
3. 貼上內容 → 下方 `Commit changes`

### 方式 B：GitHub Desktop（視覺化）

改好檔案 → 打開 App → 填一行說明 → 按 `Commit` → 按 `Push`。

### 方式 C：指令

```bash
git add -A
git commit -m "新增 VPC 文章"
git push
```

**上傳後**：GitHub 會自動建置，約 **1～2 分鐘**後 `https://sz9517.github.io/aws-cert-learning/` 就更新了。你不用做任何「建置/部署」動作。

---

## 8. 進階：新增一整個領域或新證照

- **新 Domain**：在 `docs/saa/` 下建資料夾（例如 `domain-2/`），放一個 `_category_.json` 設定分類名稱與排序，再放文章。可直接參考現有 `domain-1/` 的寫法。
- **新證照**（例如 CLF、DVA）：在 `docs/` 下建新資料夾（例如 `clf/`），結構比照 `saa/`。側邊欄會自動長出來。

有需要時跟我說，我可以幫你一次把骨架建好。

---

## 速查：最常用的三件事

| 我想… | 怎麼做 |
| --- | --- |
| 新增一篇中文文章 | 在 `docs/` 對應資料夾建 `.md`，貼 frontmatter + 內容 |
| 本機看效果 | `npm start` |
| 讓網站更新 | 上傳到 GitHub（網頁編輯最簡單），等 1～2 分鐘 |
