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

<Cost>

Security Group 和 NACL **本身完全免費**，設定再多規則都不收費。放心練習。（真正會計費的是它們保護的資源，例如 EC2。）

</Cost>

:::warning[🚑 實務常見錯誤]
- **SSH（22 埠）開放 `0.0.0.0/0`**：等於把後門開給全世界暴力破解，**實務與考試都是錯誤答案**。永遠限制來源 IP。
- **改了 NACL 卻忘了它無狀態**：只設進、沒設出，造成「連得進去但沒回應」的詭異斷線。
- **把所有安全都塞進 NACL**：日常控管請以 **SG 為主**（較直覺、有狀態），NACL 拿來做子網路層的額外防線或黑名單。
:::

## 下一步

- ⚡ 複習：[Domain 1 重點速記 / 閃卡](./flashcards.md)
- ✍️ 測驗：[Domain 1 原創練習題](./quiz.md)
- 📖 下一篇：[S3 資料安全](./s3-security.md)
