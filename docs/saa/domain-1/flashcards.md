---
sidebar_position: 7
title: 重點速記 / 閃卡
---

# Domain 1 重點速記 / 閃卡

點一下卡片即可翻開說明。涵蓋 Domain 1 全部主題，考前拿這頁快速複習最有效率。

## 身分與存取（IAM）

<Flashcards>
  <Flashcard term="最小權限原則">只給剛好夠用的權限。遇到權限題時的標準答案方向。</Flashcard>
  <Flashcard term="MFA">多因素驗證。Root 帳號務必開啟。</Flashcard>
  <Flashcard term="Policy 評估">預設拒絕 → 有 Allow 才放行 → 明確 Deny 一律勝出。</Flashcard>
  <Flashcard term="Role vs Key">服務（如 EC2）存取用 Role 取得臨時憑證，不要用長期金鑰。</Flashcard>
  <Flashcard term="IAM Group">把權限綁群組，成員加入即自動取得，方便統一管理。</Flashcard>
</Flashcards>

## 資料加密（KMS）

<Flashcards>
  <Flashcard term="At Rest vs In Transit">At Rest＝存硬碟時加密（S3/EBS/KMS）；In Transit＝傳輸時加密（HTTPS/TLS）。</Flashcard>
  <Flashcard term="信封加密">用 KMS 主金鑰去加密「資料金鑰」，資料金鑰再加密資料。</Flashcard>
  <Flashcard term="客戶託管金鑰(CMK)">你自己控制權限、輪替、稽核；每把 $1/月。要「控制/稽核金鑰」時選它。</Flashcard>
  <Flashcard term="SSE-S3 / SSE-KMS / SSE-C">分別是 S3 管鑰匙 / KMS 管鑰匙(可稽核) / 你自己管鑰匙。</Flashcard>
  <Flashcard term="金鑰刪除風險">刪或停用金鑰＝用它加密的資料全部救不回。</Flashcard>
</Flashcards>

## 網路安全（SG / NACL）

<Flashcards>
  <Flashcard term="Security Group">掛在主機、有狀態(Stateful)、只有 Allow。回應流量自動放行。</Flashcard>
  <Flashcard term="NACL">掛在子網路、無狀態(Stateless)、有 Allow+Deny。進出要分別設規則。</Flashcard>
  <Flashcard term="要擋特定 IP">SG 只能允許，封鎖特定 IP 要用 NACL 的 Deny 規則。</Flashcard>
  <Flashcard term="SSH 來源">22 埠永遠限制來源 IP，不要開 0.0.0.0/0。</Flashcard>
</Flashcards>

## S3 安全與機密、監控

<Flashcards>
  <Flashcard term="Block Public Access">確保貯體不被公開的總開關，會覆蓋意外的公開設定。預設開啟。</Flashcard>
  <Flashcard term="預簽章網址">限時的臨時下載連結，安全分享單一檔案而不公開整個貯體。</Flashcard>
  <Flashcard term="Secrets Manager vs Parameter Store">要自動輪替密碼→Secrets Manager；要省錢存設定→Parameter Store(免費)。</Flashcard>
  <Flashcard term="CloudTrail vs CloudWatch">Trail＝誰做了什麼(稽核)；Watch＝系統健不健康(效能監控)。</Flashcard>
  <Flashcard term="AWS Config / GuardDuty">Config＝設定變更與合規；GuardDuty＝智慧威脅偵測。</Flashcard>
</Flashcards>

## IAM 進階（跨帳號 / STS / SCP）

<Flashcards>
  <Flashcard term="STS 臨時憑證">有時效、自動過期的憑證。能用它就別用長期金鑰。</Flashcard>
  <Flashcard term="跨帳號存取">目標帳號建 Role、信任政策列出可信帳號，來源端用 AssumeRole 擔任。不要複製長期金鑰。</Flashcard>
  <Flashcard term="SCP">組織層級的權限天花板。只「限制」不「給予」，連管理員也擋得住。</Flashcard>
  <Flashcard term="權限邊界">限制單一使用者／角色的權限上限，常用於委派建角色時防止提權。</Flashcard>
  <Flashcard term="IAM Identity Center">企業單一登入（前身 AWS SSO），一組帳號登入多個 AWS 帳號。</Flashcard>
  <Flashcard term="實際權限公式">IAM 給的 ∩ 權限邊界 ∩ SCP，任一層沒放行就被擋。</Flashcard>
</Flashcards>

## VPC 私密連線（Endpoint）

<Flashcards>
  <Flashcard term="Gateway 端點">只支援 S3 與 DynamoDB，走路由表，完全免費。要私密又省錢連這兩者時選它。</Flashcard>
  <Flashcard term="Interface 端點(PrivateLink)">支援其他絕大多數服務，用私有 IP 網卡(ENI)，按時數＋流量計費，要設 Security Group。</Flashcard>
  <Flashcard term="省掉 NAT">用 S3 Gateway 端點可免走 NAT Gateway，流量留在內網又省流量費。</Flashcard>
</Flashcards>

## 應用層防護（WAF / Shield / ACM）

<Flashcards>
  <Flashcard term="WAF">擋第 7 層攻擊：SQL injection、XSS、依國家封鎖、限制請求速率。掛在 CloudFront／ALB／API Gateway。</Flashcard>
  <Flashcard term="Shield Standard">免費、自動開啟的 DDoS 防護，每個帳號都有。</Flashcard>
  <Flashcard term="Shield Advanced">月費約 US$3,000，含 24/7 團隊與費用補償，給大型／高風險服務。</Flashcard>
  <Flashcard term="ACM">免費、自動更新的 HTTPS 憑證。給 CloudFront 用的憑證必須建在 us-east-1。</Flashcard>
</Flashcards>
