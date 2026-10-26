---
sidebar_position: 1
title: DVA 考試資訊與讀書計畫
---

# DVA 考試資訊與讀書計畫（DVA-C03）

**AWS Certified Developer – Associate** 驗證你「用 AWS 服務開發、測試、部署、除錯雲端應用程式」的能力。它是繼 SAA 之後最受歡迎的助理級證照之一，兩者內容大量重疊——如果你剛考完或正在準備 SAA，接著拿 DVA 會非常順。

<Scenario title="這張適合誰">

寫程式、會用 AWS SDK 串服務的**開發者**；或是架構概念已經有（例如考過 SAA），想補強「實際動手把應用寫出來、部署上去、出問題能除錯」這一面的人。官方建議約一年 AWS 開發經驗，但有 SAA 底子 + 本站練習，零到一也能準備。

</Scenario>

## 為什麼直接準備 C03（而不是 C02）

AWS 2026 年改版：**DVA-C02 最後應考日為 2026/11/30，DVA-C03 於 2026/12/1 正式開考**。現在開始準備的人幾乎都會考 **C03**，所以本站直接對 C03 出內容。

C03 最大的變化是**全面納入「AI 輔助開發」**：用 AI 工具（如 Amazon Q Developer）協助產生程式碼與自動審查、自動化測試與回歸測試、CI/CD 的自動部署核准、錯誤分析與除錯建議、效能最佳化建議——這些都融入四大領域裡。

:::tip[💡 本站做法]
核心服務知識（Lambda、API Gateway、DynamoDB、IAM…）在 C02／C03 之間是穩定的，本站以這些為骨幹，並在各領域融入 C03 的 AI 輔助開發重點。
:::

## 考試基本資訊

| 項目 | 內容 |
| --- | --- |
| 考試代碼 | DVA-C03 |
| 等級 | 助理級（Associate） |
| 題數 | 65 題（單選 + 複選） |
| 時間 | 130 分鐘 |
| 及格分數 | 720 / 1000（量尺計分） |
| 費用 | 150 美元 |
| 語言 | 含繁體中文等多語；介面可中英切換 |
| 應考方式 | 考場（Pearson VUE）或線上監考（OnVUE） |

## 四大考試領域（權重）

| 領域 | 權重 | 重點（本站對應） |
| --- | --- | --- |
| **1. 用 AWS 服務開發** | 30% | Lambda、API Gateway、DynamoDB、S3/SDK、事件驅動與解耦、AI 輔助產碼 |
| **2. 安全** | 26% | IAM、Cognito 使用者/身分池、KMS 加密、Secrets Manager/Parameter Store、簽署請求 |
| **3. 測試與部署** | 22% | CodePipeline/CodeBuild/CodeDeploy、CloudFormation/SAM/CDK、容器部署、部署策略、AI 輔助測試 |
| **4. 疑難排解與最佳化** | 22% | CloudWatch、X-Ray 追蹤、重試與指數退避、效能最佳化、AI 輔助除錯 |

:::info[🔍 和 SAA 的差異]
**SAA 問「怎麼設計架構」（選型、高可用、成本）；DVA 問「怎麼把應用寫出來、部署上去、出錯怎麼查」。** 同樣是 Lambda，SAA 問它適不適合某架構，DVA 會問併發、版本/別名、環境變數、冷啟動、錯誤重試這些**開發細節**。
:::

## 讀書地圖：站上內容怎麼對應 DVA

1. 先把**四大領域文章**逐篇讀過（偏重開發細節與動手）。
2. 每個領域讀完做該領域的**閃卡**與**練習題**。
3. 全部讀完做**綜合模擬考**檢驗，再回頭補弱點。
4. 與 SAA 共通的服務（IAM、S3、DynamoDB、Lambda）若想複習基礎，可參考本站 [SAA 區](/saa/exam-info)對應文章，DVA 這裡聚焦在「開發者視角」的用法。

:::warning[🚑 考試代碼會更新]
本頁依 2026 年公布的 C03 資訊整理（C03 完整任務說明於 2026/10/27 報名開放時釋出）。實際報名前請以 [AWS 官方 Developer 認證頁](https://aws.amazon.com/certification/certified-developer-associate/) 為準。
:::

<Refs>

- [AWS Certified Developer – Associate（官方認證頁）](https://aws.amazon.com/certification/certified-developer-associate/)
- [AWS Certification 認證總覽](https://aws.amazon.com/certification/)

</Refs>
