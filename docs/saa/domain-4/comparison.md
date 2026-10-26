---
sidebar_position: 7
title: 服務比較與考前速查
---

# Domain 4 服務比較與考前速查

> 這一頁把 Domain 4（設計成本最佳化）裡**最容易混淆**的服務與計費模式整理成比較表，考前快速掃一遍最有效率。每張表後面都附一句「**考試怎麼選**」的決策提示——看到題幹的關鍵字，就能直接對應到答案。

:::tip[怎麼用這頁]
成本最佳化的題目幾乎都在考「**選型取捨**」：同樣能用的選項擺一起，用「最低成本／最省維運／長期承諾換折扣／可容忍中斷」這類限定詞逼你選。記住每個選項「承諾什麼、省什麼、犧牲什麼」那一格，就是判別點。
:::

## 1. 運算計費模式：On-Demand vs Reserved Instances vs Savings Plans vs Spot vs Dedicated Hosts

| 比較項目 | On-Demand | Reserved Instances（RI） | Savings Plans | Spot | Dedicated Hosts |
|---|---|---|---|---|---|
| 承諾期 | 無 | 1 或 3 年 | 1 或 3 年 | 無 | 可隨需或 1／3 年 |
| 折扣幅度 | 無（最貴） | 最高約 7 成 | 最高約 7 成 | 最高約 9 成 | 隨需或預留折扣 |
| 彈性 | 最高 | 綁機型／區域（視類型） | **綁用量金額、跨機型／區域較彈性** | 高 | 低（綁實體主機） |
| 可否被中斷 | 否 | 否 | 否 | **是（AWS 可隨時回收）** | 否 |
| 適用場景 | 短期、不確定負載 | 穩定、可預測的長期負載 | 穩定負載但想要彈性 | 可中斷的批次、容錯工作 | 合規／授權綁實體機 |

**考試怎麼選**：題幹講「**穩定、可預測、長期負載要省錢**」→ **Reserved Instances 或 Savings Plans**；要**跨機型／區域更有彈性**選 **Savings Plans**；「**可中斷、無狀態、批次或容錯**」要最省 → **Spot**；「**短期、臨時、不確定**」→ **On-Demand**；「**軟體授權綁實體主機／合規要專用硬體**」→ **Dedicated Hosts**。

## 2. S3 儲存類別：Standard / Intelligent-Tiering / Standard-IA / One Zone-IA / Glacier 三兄弟 / Deep Archive

| 儲存類別 | 取回速度 | 儲存成本 | 最低儲存天數 | 取回費 | 適用場景 |
|---|---|---|---|---|---|
| **Standard** | 立即（毫秒） | 最高 | 無 | 無 | 經常存取的熱資料 |
| **Intelligent-Tiering** | 立即 | 隨層級自動調整 | 無 | 無（另收少量監控費） | **存取頻率未知或會變** |
| **Standard-IA** | 立即 | 較便宜 | 30 天 | 有 | 偶爾存取、但要馬上拿到 |
| **One Zone-IA** | 立即 | 更便宜（比 Standard-IA 省約 2 成） | 30 天 | 有 | 可重建、非關鍵、偶爾存取 |
| **Glacier Instant Retrieval** | 立即（毫秒） | 很便宜 | 90 天 | 有 | 封存但偶爾要立刻拿 |
| **Glacier Flexible Retrieval** | 分鐘到數小時 | 更便宜 | 90 天 | 有 | 封存、可等取回 |
| **Glacier Deep Archive** | 數小時（12 小時內） | **最便宜** | 180 天 | 有（最慢最省） | 長期封存、幾乎不取回 |

**考試怎麼選**：「**存取頻率未知或會變、不想手動搬**」→ **Intelligent-Tiering**；「**偶爾存取但要立即拿到**」→ **Standard-IA**；「**可重建、非關鍵、只放一個區省錢**」→ **One Zone-IA**；「**封存但偶爾要毫秒拿到**」→ **Glacier Instant Retrieval**；「**長期封存、幾乎不取回、法規存很多年、最低成本**」→ **Glacier Deep Archive**。小心「**最低儲存天數**」陷阱：天天會改的資料別丟進 IA／Glacier。

## 3. 降低資料傳輸成本：CloudFront vs Gateway Endpoint vs Interface Endpoint/PrivateLink vs 同 AZ 部署

| 手法 | 省什麼費用 | 成本 | 適用情境 |
|---|---|---|---|
| **CloudFront** | 省**對外（網際網路）傳出費**，邊緣快取減少回源 | 按傳輸＋請求，常比直接從源頭傳出便宜 | 對外的網站／影片／靜態內容全球分發 |
| **VPC Gateway Endpoint** | 省 **NAT 處理費與傳輸費**（存取 S3／DynamoDB） | **完全免費** | VPC 內大量存取 S3／DynamoDB |
| **Interface Endpoint / PrivateLink** | 省繞 NAT 出公網的傳輸費，流量走 AWS 私有通道 | 按小時＋按流量（仍常比繞 NAT 便宜） | VPC 內私下存取其他服務（SQS、SNS 等） |
| **同 AZ 部署** | 省**跨可用區／跨區域**資料搬運費 | 無額外費（同 AZ 內傳輸多半免費） | 高頻互通的元件放同一個 AZ |

**考試怎麼選**：「**對外（上網）傳出流量大、內容可快取**」→ **CloudFront**；「**VPC 內存取 S3／DynamoDB 省 NAT 與傳輸費**」→ **Gateway Endpoint（免費）**；「**VPC 內私下存取 SQS／SNS 等其他服務**」→ **Interface Endpoint/PrivateLink**；「**元件間跨 AZ 搬大量資料很貴**」→ **把它們放同一個 AZ**。

## 4. 成本監控工具：Cost Explorer vs Budgets vs Cost and Usage Report vs Cost Anomaly Detection

| 工具 | 主要用途 | 粒度／形式 | 適用情境 |
|---|---|---|---|
| **Cost Explorer** | **分析趨勢**、視覺化、預測 | 圖表、互動查詢 | 想看「過去花在哪、未來大概花多少」 |
| **Budgets** | **設門檻、超標告警** | 設定預算金額／用量＋通知 | 想在成本或用量超過某值時收到警報 |
| **Cost and Usage Report（CUR）** | **最細明細**原始資料 | 每小時／每資源，匯入 S3 可用 Athena 查 | 要做深度分攤、自訂分析、稽核 |
| **Cost Anomaly Detection** | **自動抓異常**支出 | 機器學習自動偵測＋通知 | 想自動發現沒預期到的暴衝花費 |

**考試怎麼選**：「**分析歷史趨勢、視覺化、預測未來**」→ **Cost Explorer**；「**超過門檻就告警**」→ **Budgets**；「**要最細、每資源每小時的原始明細**」→ **Cost and Usage Report**；「**自動偵測沒料到的異常花費**」→ **Cost Anomaly Detection**。

## 5. 資料庫計費選擇：RDS/Aurora RI vs Aurora Serverless v2 vs DynamoDB 隨需 vs DynamoDB 預置+Auto Scaling

| 選項 | 負載型態 | 計費方式 | 適用情境 |
|---|---|---|---|
| **RDS/Aurora 預留執行個體（RI）** | 穩定、可預測 | 承諾 1／3 年換折扣 | 正式環境長期穩定運行 |
| **Aurora Serverless v2** | **變動、間歇、難預測** | 按實際用量（ACU）自動增減 | 開發／測試、尖峰不定的關聯式負載 |
| **DynamoDB 隨需（On-Demand）** | **突發、無法預測** | 按實際讀寫請求計費 | 流量忽高忽低、新上線不確定 |
| **DynamoDB 預置+Auto Scaling** | 可預測、有規律 | 預置容量＋依規則自動擴縮 | 負載有規律、用預置省更多 |

**考試怎麼選**：「**資料庫負載穩定、長期運行要省錢**」→ **RDS/Aurora RI**；「**關聯式但負載變動、間歇、難預測**」→ **Aurora Serverless v2**；「**NoSQL 流量突發、無法預測**」→ **DynamoDB 隨需**；「**NoSQL 負載可預測、要進一步省錢**」→ **DynamoDB 預置+Auto Scaling**。口訣：變動負載走 Serverless／隨需，穩定負載走 RI／預置。

## 6. 網路成本選擇：NAT Gateway vs NAT Instance vs VPC Endpoint vs Direct Connect

| 選項 | 成本特性 | 維運負擔 | 適用場景 |
|---|---|---|---|
| **NAT Gateway** | 按小時＋按每 GB 處理費（雙重計費） | 全代管、免維運、自動高可用 | 私有子網路要連外網的預設解 |
| **NAT Instance** | 單價較低、**無每 GB 處理費** | 要自己顧高可用、修補、擴充 | 成本敏感、流量小、可接受自行維運 |
| **VPC Endpoint** | **Gateway 端點免費**；介面端點按小時＋流量 | 低 | VPC 內存取 S3／DynamoDB（Gateway）或其他服務（Interface） |
| **Direct Connect** | 前期與建置成本高，但大流量下每 GB 單價更便宜 | 中（需實體專線） | 長期、穩定、大流量的混合雲 |

**考試怎麼選**：「**私有子網路連外、要免維運**」→ **NAT Gateway**；「**流量小、成本敏感、可接受自行維運**」→ **NAT Instance**；「**VPC 內存取 S3／DynamoDB 要免費省 NAT**」→ **VPC Gateway Endpoint**；「**長期穩定、大流量的混合雲要降傳輸單價**」→ **Direct Connect**。

---

- ⚡ 快速複習：[Domain 4 重點速記 / 閃卡](/saa/domain-4/flashcards)
- ✍️ 測試自己：[Domain 4 原創練習題](/saa/domain-4/quiz)
