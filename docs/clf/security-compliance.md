---
sidebar_position: 3
title: 安全與合規（Security & Compliance）
---

# 安全與合規：這一領域佔 CLF 整整 30%

安全與合規是 CLF 考試**比重最高**的領域（約 30%），但別被嚇到——這一塊考的幾乎都是**觀念**，不是要你寫一堆設定或政策程式碼。只要把「誰負責什麼」「怎麼保護帳號」「資料怎麼加密」這幾件事想清楚，分數就很好拿。這篇用最白話的方式帶你一次搞懂。

## 責任共擔模型：AWS 顧雲的安全，你顧雲中的安全

這是整個領域的**底層觀念**，CLF 極愛考。一句話記住：

> **AWS 負責「雲的安全」（Security OF the Cloud），你負責「雲中的安全」（Security IN the Cloud）。**

<Analogy title="🏠 生活比喻：租房子，房東和房客各顧各的">

- **房東（= AWS）** 負責「房子本身」：地基、水電管線、大門門鎖、社區保全。
- **房客（= 你）** 負責「房子裡面」：出門有沒有鎖門、貴重物品要不要收進保險箱、要不要讓陌生人進來。

房東把大樓蓋得再安全，你自己忘了鎖門，東西被偷也不能怪房東。雲端完全是同一回事。

</Analogy>

| 誰 | 負責什麼 | 白話說法 |
| --- | --- | --- |
| **AWS** | 雲的安全（Security OF the Cloud） | 實體機房、硬體、底層網路、虛擬化層 |
| **客戶（你）** | 雲中的安全（Security IN the Cloud） | 你的資料、IAM 權限、網路設定、加密、OS 修補（視服務而定） |

### 關鍵：責任界線會「滑動」

這是最常被忽略、卻最常考的一點——**你要顧多少，取決於你用的是哪種服務**。越「全託管」的服務，AWS 幫你顧得越多。

| 服務類型 | 代表服務 | 作業系統（OS）修補誰顧 | 你主要要顧的事 |
| --- | --- | --- | --- |
| 自己租機器 | **EC2** | **你自己** | OS 修補、安全群組、裝的軟體、資料、權限 |
| 託管服務 | **S3、RDS** | **AWS**（底層 OS、資料庫引擎） | 資料、存取權限、加密選項、別設成公開 |
| 無伺服器 | **Lambda** | **AWS 全包** | 幾乎只剩你的程式碼與 IAM 權限 |

:::note[一句話總結]
看到題目描述某個服務，先問自己：「**OS 修補是誰的事？**」
- <Term en="Elastic Compute Cloud" desc="AWS 上租來的一台雲端伺服器，你的程式跑在上面。">EC2</Term> → 修補是**客戶**責任（最常考的陷阱）。
- **RDS、S3、Lambda** → 底層 OS 由 **AWS** 負責。
:::

## IAM 基礎：AWS 的「門禁與鑰匙」系統

<Term en="Identity and Access Management" desc="身分與存取管理：決定誰可以對哪些 AWS 資源做哪些操作，是所有安全的根基，而且完全免費。">IAM</Term> 決定了「**誰**可以對「**哪些資源**」做「**哪些操作**」。它是 AWS 所有安全的根基，而且**完全免費**。

<Analogy title="🏢 生活比喻：把 AWS 帳號想成一棟公司大樓">

- **Root 使用者** = 建這棟樓的大老闆，擁有萬能鑰匙（平常絕對不要用它辦公！）
- **IAM 使用者（User）** = 公司每位員工，各自有員工證
- **IAM 群組（Group）** = 部門（例如工程部），整個部門給同一套權限
- **IAM 政策（Policy）** = 門禁卡的權限設定（能進哪幾間房、能不能開保險箱）
- **IAM 角色（Role）** = 臨時訪客通行證，用完自動失效，給「服務或臨時需求」用

</Analogy>

| 元件 | 是什麼 | 什麼時候用 |
| --- | --- | --- |
| **使用者（User）** | 代表一個人或應用程式的長期身分 | 固定的使用者，例如你自己 |
| **群組（Group）** | 一群使用者的集合，方便統一給權限 | 同職務的多位成員 |
| **政策（Policy）** | 定義允許或拒絕哪些操作的權限規則 | 定義「能做什麼」 |
| **角色（Role）** | 可被「扮演」的臨時權限身分 | 給 EC2、Lambda 或跨帳號存取 |

### 三個你一定要記住的安全原則

- **保護 Root 使用者**：Root 是萬能帳號，**開啟 <Term en="Multi-Factor Authentication" desc="多因素驗證：登入除了密碼，還要再輸入手機動態驗證碼，密碼被盜也擋得住。">MFA</Term>**，而且**平常絕對不要拿它日常辦公**，改用權限剛好夠的 IAM 使用者。
- **到處開 MFA**：Root 和所有重要 IAM 使用者都開 MFA，多一道手機驗證，密碼被盜也進不來。
- **最小權限原則（Least Privilege）**：只給剛好夠用的權限，別圖方便就發 `AdministratorAccess`。

:::warning[🚑 最常見的初學者誤解]
「上了雲就自動安全」是錯的。**絕大多數雲端資料外洩，問題出在「客戶這一端」設定不當**——最經典的災難就是把 **S3 貯體誤設成公開**，整批資料被全世界搜得到。AWS 把倉庫蓋得固若金湯，但你自己把門大開，AWS 救不了你。
:::

## 加密概念：傳輸中與靜態加密

加密就是把資料變成「沒有鑰匙就看不懂的亂碼」。CLF 只要你懂**兩種時機**：

- **傳輸中加密（Encryption in transit）**：資料在**網路上傳遞時**加密，避免中途被竊聽。就像寄信用密封信封，而不是寄明信片。常見做法是 HTTPS／TLS。
- **靜態加密（Encryption at rest）**：資料**存放在硬碟、貯體、資料庫裡時**加密，就算硬碟被偷走也看不到內容。

<Analogy title="🔐 生活比喻：KMS 是幫你保管鑰匙的保險箱">

加密需要「鑰匙」，但鑰匙本身要收好，不然等於門鎖了鑰匙卻插在門上。**<Term en="Key Management Service" desc="AWS 金鑰管理服務：集中建立、保管、控管加密金鑰的保險箱，讓你不用自己煩惱金鑰放哪。">KMS</Term>（金鑰管理服務）** 就是 AWS 幫你集中保管、控管這些加密金鑰的「保險箱」。你只要說「用這把金鑰加密這份資料」，鑰匙放哪、誰能用，都交給 KMS 管。

</Analogy>

:::info[白話總結]
加密分兩種時機：**傳輸中**（在路上）和**靜態**（放著不動時）；**金鑰由 KMS 這個保險箱集中保管**。CLF 層級懂到這裡就夠。
:::

## 安全相關服務一覽

AWS 有一整組安全服務，CLF 不會考你怎麼設定，但會考**哪個服務是幹嘛的**。一句話記住每一個：

| 服務 | 一句話用途 |
| --- | --- |
| **WAF**（Web Application Firewall） | 網站應用程式防火牆，擋 SQL 注入、跨站攻擊等常見網站攻擊 |
| **Shield** | 專門擋 <Term en="Distributed Denial of Service" desc="分散式阻斷服務攻擊：用大量流量灌爆你的服務讓它當機。">DDoS</Term>（流量灌爆）攻擊的防護服務 |
| **GuardDuty** | 智慧威脅偵測，自動分析紀錄找出可疑或惡意活動 |
| **Inspector** | 自動掃描 EC2、容器等的安全漏洞與弱點 |
| **Security Hub** | 把各種安全檢查結果集中到一個儀表板，一眼看懂整體安全狀態 |
| **Macie** | 用機器學習自動找出 S3 裡的敏感資料（如個資、信用卡號）並示警 |

:::note[小技巧：用關鍵字對應]
看到「**擋攻擊**」想 WAF／Shield；看到「**找威脅、找漏洞**」想 GuardDuty／Inspector；看到「**集中總覽**」想 Security Hub；看到「**S3 裡的敏感個資**」想 Macie。
:::

## 合規：證明「我有照規矩來」

**合規（Compliance）** 就是證明你的系統符合某些法規或產業標準。很多產業（金融、醫療、電商）都有強制要求。

- **AWS Artifact**：AWS 的「合規報告下載中心」。你可以在這裡**自助下載** AWS 的合規報告與協議（例如 SOC、ISO 報告），拿去給稽核人員或客戶看，證明 AWS 的底層有通過這些認證。
- **常見合規計畫**（概念認識即可）：
  - **ISO**：國際標準化組織的資安管理標準（如 ISO 27001）。
  - **SOC**（System and Organization Controls）：針對服務供應商內部控管的審計報告。
  - **PCI DSS**（Payment Card Industry Data Security Standard）：處理信用卡資料必須遵守的安全標準。
- **合規也是責任共擔的一環**：AWS 負責讓**底層基礎建設**通過各種認證（並用 Artifact 提供證明），但**你自己的應用程式與資料設定**是否合規，仍是**你的責任**。

:::tip[💡 CLF 常考點，背起來穩拿分]
- **責任共擔「誰負責什麼」**：AWS 顧雲的安全、你顧雲中的安全；界線會隨服務（EC2 → S3／RDS → Lambda）滑動，重點看「OS 修補誰顧」。
- **保護帳號三件事**：Root 開 MFA 且別日常使用、處處開 MFA、遵守最小權限原則。
- **AWS Artifact 拿合規報告**：要下載 SOC／ISO 等合規報告，答案就是 Artifact。
:::

<Refs title="📚 官方資料與延伸閱讀">

- [AWS 官方：責任共擔模型（Shared Responsibility Model）](https://aws.amazon.com/compliance/shared-responsibility-model/)
- [AWS 官方：IAM 安全最佳實務（Security best practices）](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [AWS 官方：KMS 金鑰管理服務](https://docs.aws.amazon.com/kms/latest/developerguide/overview.html)
- [AWS 官方：Artifact 合規報告](https://aws.amazon.com/artifact/)
- [AWS 官方：合規計畫總覽（Compliance Programs）](https://aws.amazon.com/compliance/programs/)

</Refs>

👉 下一個領域：[雲端技術與服務](./technology-services.md)
