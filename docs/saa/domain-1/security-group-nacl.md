---
sidebar_position: 3
title: 網路安全：Security Group vs NACL
---

# 網路安全：Security Group 與 NACL

> 「Security Group 和 NACL 有什麼不同？」是 SAA **幾乎必考**的題目。這篇用白話 + 比喻把它講到你不會再搞混。

<Vocab title="📌 先認識這篇會出現的名詞">

- **VPC（Virtual Private Cloud）**：你在 AWS 裡的**私人虛擬網路**，像你租的一整層辦公室。
- **子網路（Subnet）**：VPC 裡再切出來的小網段，像辦公室裡的一個個房間。
- **Security Group（安全群組，簡稱 SG）**：掛在**單一主機（如 EC2）**上的防火牆。
- **NACL（Network ACL，網路存取控制清單）**：掛在**整個子網路**上的防火牆。
- **封包（Packet）**：在網路上傳送的一小塊資料。
- **Inbound / Outbound**：進來的流量 / 出去的流量。

</Vocab>

## 為什麼需要它們？

<Scenario title="真實情境：你的資料庫被網路上任何人連線">

你開了一台資料庫主機，卻忘了設定防火牆，結果**全世界都能嘗試連你的資料庫**，被暴力破解密碼。防火牆的工作就是：**只放行你允許的流量，其他一律擋掉**。AWS 給你兩層防火牆——SG 和 NACL。

</Scenario>

## 兩層防火牆的位置（圖解）

<div className="flow">
  <div className="flow-node">網際網路</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">NACL（守在子網路門口）</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Security Group（守在主機門口）</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">EC2 主機</div>
</div>

*圖：流量要先過「子網路層」的 NACL，再過「主機層」的 SG，才會到你的主機。像先過大樓門禁，再過你辦公室的門。*

## 用比喻秒懂差別

<Analogy title="🛡️ 生活比喻：保全 vs. 門口黑白名單">

- **Security Group = 貼身保全**：它**記得你**。你（流量）進得來，等你要回應出去時，保全自動放行，不用再檢查一次。這叫「**有狀態（Stateful）**」。
- **NACL = 大樓門口的規則清單**：它**不記人**。進來檢查一次、出去又檢查一次，兩邊規則要分開設好。這叫「**無狀態（Stateless）**」。

</Analogy>

## 核心差異對照表（把這張背起來就穩了）

| 比較項 | Security Group（SG） | NACL |
| --- | --- | --- |
| 作用層級 | **主機**（EC2 網卡） | **整個子網路** |
| 有無狀態 | **有狀態（Stateful）** | **無狀態（Stateless）** |
| 回應流量 | 自動放行，不用設 | **要自己設** outbound 規則 |
| 規則種類 | **只有允許（Allow）** | **允許 + 拒絕（Allow / Deny）** |
| 規則評估 | 全部一起看，有允許就通 | **依編號由小到大**，第一條符合的就生效 |
| 預設行為 | 預設擋全部 inbound、放全部 outbound | 預設（自建的）擋全部進出 |
| 典型用途 | 日常第一線控管（開 80、443、22） | 額外加強、黑名單擋特定 IP |

:::tip[💡 考試最常考的兩個陷阱]
1. **「加了 inbound 允許，卻連不上」**：如果是 **NACL**，別忘了它**無狀態**，你還要加 **outbound 允許**（通常是回應用的高位埠 1024-65535），否則回應出不去。SG 則不用，它有狀態會自動放行。
2. **「要擋掉某個特定惡意 IP」**：SG **只能允許、不能拒絕**，所以要用 **NACL 的 Deny 規則** 來封鎖特定 IP。
:::

## 為什麼要分兩層？各自存在的意義

很多人第一個疑問是：「有一個防火牆不就好了，為什麼 AWS 要搞兩層？」答案是——**兩層守在不同位置、負責不同範圍，互相補位**。

<Analogy title="🏢 生活比喻：大樓門禁（NACL）vs 你辦公室門鎖（SG）">

- **NACL = 大樓一樓的門禁**：管的是**整層樓（整個子網路）**進出的所有人。你想把某個惡意訪客擋在大樓外，在這裡設一條黑名單，整層樓的所有辦公室都受保護，一次搞定。
- **SG = 你辦公室的門鎖**：只管**你這間（單一執行個體）**。你可以很細地決定誰能進你辦公室（開哪些埠、放行哪些來源），而且不影響隔壁同事。

</Analogy>

**為什麼這樣分比較好？**

- **範圍不同、各司其職**：要「一次保護整個子網路」用 NACL（例如全子網路一律禁連某個惡意網段）；要「針對這台機器精細控管」用 SG（例如這台 Web 伺服器只開 80／443）。
- **責任分層、少踩雷**：網路管理員可以在子網路層（NACL）設大原則黑名單，應用團隊在執行個體層（SG）開自己要用的埠，兩邊互不覆蓋、好分工。
- **縱深防禦（Defense in Depth）**：萬一 SG 設錯開太大，子網路層的 NACL 還有機會攔一道；多一層就多一分保險。

:::info[🔑 一個最容易混的觀念：兩層是「都要通過」]
流量要能進到你的執行個體，**NACL 和 SG 兩關都要放行**（AND，不是 OR）。只要其中一關擋下來就進不去。所以排查「連不上」時，兩層都要看——但 **99% 的日常情況，你只會動 SG**（見下一段）。
:::

## stateful（SG）vs stateless（NACL）：差在哪、後果是什麼

這是兩者**最核心**的差別，也是考試與實務最愛坑人的地方。

- **SG 有狀態（Stateful）**：它**記得**你放進來的連線。當這條連線要回應（回程流量）出去時，SG **自動放行**，你**完全不用**另外設 outbound 規則。
- **NACL 無狀態（Stateless）**：它**不記**任何連線。進來一條規則、出去又一條規則，**兩個方向要分開各設一次**。你只開了 inbound 卻忘了 outbound，回程封包就會被自己的 NACL 擋掉，表現出來就是「連得進去、卻像沒回應一樣卡住」。

<Analogy title="🛡️ 再用一個比喻鞏固：有記性 vs 沒記性的門房">

- **SG = 有記性的門房**：看你進門時登記過，等你要出門自動幫你開，不用你再報備。
- **NACL = 沒記性的門房**：你進門登記一次，出門他又當你是陌生人、要你再登記一次。少登記（少設 outbound）就被攔在裡面出不去。

</Analogy>

**平常到底該動哪個？→ 預設一律動 SG。** 日常開埠、限制來源、調整放行對象，99% 都在 SG 完成：它有狀態、只要設一個方向、規則直覺、改了馬上生效。NACL 留著當「子網路層的額外防線」，沒特殊需求**不要去動它**，動了很容易忘記 outbound 而製造詭異故障。

## 什麼情況「才」需要動 NACL？

SG 已經很夠用，所以要先問：**非它不可嗎？** 下列少數情況 SG 做不到或不划算，才輪到 NACL：

- **要封鎖特定來源 IP／網段**：SG **只有允許、沒有拒絕**，無法「擋掉某個 IP」。要黑名單封鎖惡意 IP，只能用 **NACL 的 Deny 規則**。
- **要一次保護整個子網路**：規則掛一次就套用到子網路內**所有**執行個體，不必一台一台改 SG。例如「這個子網路一律禁止對外 SSH」。
- **合規／稽核要求「子網路層」的明確邊界控制**：有些稽核要求在網段邊界有可檢視的允許／拒絕清單，NACL 的編號規則剛好符合。

:::info[🔑 判斷口訣]
**要「拒絕／黑名單」或「整個子網路一刀切」→ 才用 NACL；其餘日常放行一律用 SG。** 如果你發現自己想「在 NACL 開某個埠給某台機器用」，八成是用錯層了，那是 SG 的工作。
:::

## SG vs NACL：優缺點與何時別用

| | 優點 | 缺點 / 限制 | 什麼時候**別**用它 |
| --- | --- | --- | --- |
| **Security Group** | 有狀態（回程自動放行、只設一邊）、規則直覺、改即生效、可引用其他 SG 當來源 | **沒有拒絕規則**（無法黑名單特定 IP）、作用範圍只有掛到的執行個體 | 想「封鎖某個惡意 IP」時——SG 辦不到，要改用 NACL Deny |
| **NACL** | 有拒絕規則（可黑名單）、一次保護整個子網路、依編號評估可做明確優先序 | 無狀態（進出都要設、極易漏 outbound）、不能引用 SG、規則較難維護 | 想做「日常開埠／精細放行」時——別硬塞 NACL，那是 SG 的事，用了只會自找回程麻煩 |

<Scenario title="真實情境：資安通報某個 IP 在掃描你的服務，要立刻封鎖整個子網路">

資安團隊通報 `203.0.113.66` 正在大量掃描你某個子網路裡的所有主機。你不想一台一台改（況且 SG 根本沒有「拒絕」），於是在**該子網路的 NACL** 加一條 **Deny** 規則，來源 `203.0.113.66/32`，編號設**比現有 Allow 規則小**（例如 `#10`），讓它**優先**被命中直接擋下。這條一加，整個子網路所有執行個體立刻對這個 IP 免疫——這正是「動 NACL」少數幾個對的時機。

</Scenario>

## 實務應用

### 🛠️ 動手做：建一個只開放網站與 SSH 的 Security Group

1. 進主控台 → `EC2` → 左側 **安全群組（Security Groups）** → **建立安全群組**
2. 命名 `web-server-sg`，選擇你的 VPC
3. 新增 **Inbound 規則**：
   - 類型 `HTTP`、來源 `0.0.0.0/0`（任何人都能看網站）
   - 類型 `HTTPS`、來源 `0.0.0.0/0`
   - 類型 `SSH`、來源 **選「My IP」**（⚠️ 只開放給你自己的 IP，不要開給全世界）
4. Outbound 保持預設（允許全部出去）→ 建立
5. 把這個 SG 掛到你的 EC2 上

用 CLI 看某台主機掛了哪些 SG：

```bash
$ aws ec2 describe-instances \
    --instance-ids i-0123456789abcdef0 \
    --query "Reservations[].Instances[].SecurityGroups"
```

### 🛠️ 動手做（CLI 版）：用指令建 SG 並加一條只開給自己的 SSH 規則

```bash
# 1) 建立安全群組（指定 VPC），會回傳一個 GroupId
$ aws ec2 create-security-group \
    --group-name web-server-sg \
    --description "Web + SSH for my server" \
    --vpc-id vpc-0abc123456789def0

# 2) 加一條 inbound 規則：只放行「你自己這台電腦的 IP」連 SSH
#    先查自己的對外 IP（任一方法），假設是 198.51.100.25
$ aws ec2 authorize-security-group-ingress \
    --group-id sg-0123456789abcdef0 \
    --protocol tcp --port 22 \
    --cidr 198.51.100.25/32

# 3) 再開 HTTP／HTTPS 給所有人看網站
$ aws ec2 authorize-security-group-ingress \
    --group-id sg-0123456789abcdef0 \
    --protocol tcp --port 80 --cidr 0.0.0.0/0
$ aws ec2 authorize-security-group-ingress \
    --group-id sg-0123456789abcdef0 \
    --protocol tcp --port 443 --cidr 0.0.0.0/0
```

**預期結果**：
- 第 1 步回傳類似 `{"GroupId": "sg-0123456789abcdef0", ...}`——記下這個 `GroupId`，後面都要用。
- 第 2～3 步每條成功會回 `{"Return": true, "SecurityGroupRules": [...]}`，裡面是剛建好的規則內容。
- 做完 `describe-security-groups --group-ids sg-...` 應看到 `IpPermissions` 底下有 22（來源 `198.51.100.25/32`）、80、443（來源 `0.0.0.0/0`）三條。
- **Outbound 不用動**：SG 有狀態，網站與 SSH 的回程流量會自動放行。這就是「平常只動 SG」的實際體驗——你**只設了進來的方向**。

> 對照之下，若同樣效果改用 NACL，你**還得**為每條再加一條對應的 outbound 規則（開 1024-65535 讓回程出得去），一不小心就漏——這正是下面「常踩雷」要提醒的。

<Cost>

Security Group 和 NACL **本身完全免費**，設定再多規則都不收費。放心練習。（真正會計費的是它們保護的資源，例如 EC2。）

</Cost>

:::warning[🚑 常踩雷]
- **NACL 只開了一個方向（沒做「雙向」）**：NACL **無狀態**，回程流量**不會**自動放行。只設 inbound、忘了設 outbound（通常要開高位埠 `1024-65535` 給回應用），就會「連得進去卻沒回應」地卡死。**動 NACL 一定兩個方向都設。** SG 不會有這問題，它有狀態、只設一邊就好。
- **以為 SG 可以「拒絕」某個 IP**：SG **只有允許（Allow）、沒有拒絕（Deny）規則**。想封鎖特定惡意 IP，SG 根本做不到——要改用 **NACL 的 Deny 規則**（且編號要比對應的 Allow 小，才會先命中）。這是把需求塞錯層的典型。
- **把該用 SG 的事硬用 NACL 做**：日常「開某個埠給某台機器」是 SG 的工作。硬用 NACL 不但要處理無狀態的雙向回程、還會波及整個子網路的其他主機，費力又易錯。**日常放行一律 SG，NACL 只做黑名單／整子網路一刀切。**
- **SSH（22 埠）開放 `0.0.0.0/0`**：等於把後門開給全世界暴力破解，**實務與考試都是錯誤答案**。永遠限制來源 IP（例如只開 `你的IP/32`）。
- **NACL 規則編號沒排好**：NACL **由小到大、第一條符合就生效**。把 Deny 放在某條廣泛 Allow 的**後面**（編號較大），流量會先被 Allow 放行、Deny 根本輪不到。黑名單規則記得給**較小的編號**。
:::

<Refs>

- [安全群組（Security Groups）](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html)
- [網路 ACL（NACL）](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-network-acls.html)

</Refs>

## 下一步

- ⚡ 複習：[Domain 1 重點速記 / 閃卡](./flashcards.md)
- ✍️ 測驗：[Domain 1 原創練習題](./quiz.md)
- 📖 下一篇：[S3 資料安全](./s3-security.md)
