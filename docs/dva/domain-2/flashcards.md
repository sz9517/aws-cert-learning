---
sidebar_position: 6
title: Domain 2 閃卡
---

# Domain 2 閃卡

點一下卡片即可翻開說明。這頁把 Domain 2「安全」的開發者重點濃縮成一張張小卡，涵蓋 IAM、Cognito、KMS、機密管理與請求簽署，考前快速複習最有效率。

## IAM

<Flashcards>
  <Flashcard term="角色（Role）vs 使用者（User）">使用者有長期憑證、代表一個人；角色沒有固定憑證，是給服務或程式「臨時扮演」的身分，拿到的是會過期的臨時憑證。開發上盡量用角色，別發使用者的長期金鑰。</Flashcard>
  <Flashcard term="執行個體設定檔（Instance Profile）">把 IAM 角色「包」給 EC2 執行個體的容器。EC2 透過它自動取得角色的臨時憑證，程式就不用在機器上硬寫金鑰。</Flashcard>
  <Flashcard term="AssumeRole">用 STS 去「扮演」某個角色，換回一組臨時憑證（AccessKeyId／SecretAccessKey／SessionToken）。跨帳號存取、權限提升、聯合身分都靠它。</Flashcard>
  <Flashcard term="信任政策 vs 權限政策">信任政策（Trust Policy）定義「誰可以扮演這個角色」（Principal）；權限政策（Permission Policy）定義「扮演後能做什麼」。角色扮演不了，先查信任政策。</Flashcard>
  <Flashcard term="最小權限（Least Privilege）">只給完成工作所需的最小權限，不多給。先給窄的，再視需要逐步放寬，比一開始給 * 再收回安全得多。</Flashcard>
  <Flashcard term="臨時憑證（Temporary Credentials）">由 STS 發出、有到期時間的憑證，過期自動失效。比長期金鑰安全，外洩風險與影響都小很多，角色與聯合身分都用它。</Flashcard>
  <Flashcard term="憑證提供鏈（Credential Provider Chain）">SDK 依序找憑證：環境變數 → 共用設定檔 → 容器／執行個體角色（ECS/EC2/Lambda）。程式裡別硬寫金鑰，交給角色由鏈自動取用最安全。</Flashcard>
</Flashcards>

## Cognito

<Flashcards>
  <Flashcard term="User Pool vs Identity Pool">User Pool 是「使用者目錄」，負責註冊、登入、發 JWT（驗證 authentication）；Identity Pool 負責把登入身分換成 AWS 臨時憑證、直接存取 AWS 資源（授權 authorization）。</Flashcard>
  <Flashcard term="ID Token">JWT，裝「使用者是誰」的身分資訊（email、名字等 claims）。前端用它確認登入者身分，不是拿來呼叫 API 授權用的。</Flashcard>
  <Flashcard term="Access Token">JWT，裝「可以存取什麼」的授權資訊（scope、群組）。呼叫受保護的 API 時帶這張，由後端或授權方驗證。</Flashcard>
  <Flashcard term="Refresh Token">效期較長的 token，用來在 ID／Access token 過期後換發新的，不用再叫使用者重新登入。</Flashcard>
  <Flashcard term="聯合身分（Identity Federation）">讓使用者用 Google、Facebook 或企業 SAML/OIDC 等外部身分登入，Cognito 幫忙對接，最後一樣換成 AWS 臨時憑證存取資源。</Flashcard>
</Flashcards>

## KMS

<Flashcards>
  <Flashcard term="信封加密（Envelope Encryption）">用一把資料金鑰加密資料本身，再用 KMS 的主金鑰加密那把資料金鑰。只把加密過的資料金鑰存在資料旁，解密時先請 KMS 解開它。大量資料加密都這樣做。</Flashcard>
  <Flashcard term="GenerateDataKey">向 KMS 要一把資料金鑰，一次回傳「明文版」與「加密版」。用明文版在本機加密資料後立刻丟棄，只保留加密版，這就是信封加密的做法。</Flashcard>
  <Flashcard term="4KB 限制">KMS 的 Encrypt API 一次最多只能加密 4KB 資料。要加密更大的東西就改用信封加密（GenerateDataKey），KMS 只負責保護那把小小的資料金鑰。</Flashcard>
  <Flashcard term="對稱 vs 非對稱金鑰">對稱金鑰同一把加解密，速度快、最常用；非對稱金鑰公鑰加密／私鑰解密（或簽章驗章），適合金鑰無法共享或要做數位簽章的情境。</Flashcard>
  <Flashcard term="CMK vs AWS 託管金鑰">客戶管理金鑰（Customer Managed Key）由你建立、可自訂金鑰政策與輪替、能跨帳號分享；AWS 託管金鑰由服務自動建立管理、免費但彈性低、無法自訂政策。</Flashcard>
</Flashcards>

## 機密管理

<Flashcards>
  <Flashcard term="Secrets Manager 自動輪替">能用 Lambda 定期自動更換密碼／金鑰並同步到資料庫等來源，降低外洩風險。原生支援 RDS 等，是存資料庫憑證的首選，但要付費。</Flashcard>
  <Flashcard term="Parameter Store SecureString">Systems Manager Parameter Store 用 KMS 加密存放的參數型別。標準參數免費，適合存組態與一般機密；要自動輪替則請用 Secrets Manager。</Flashcard>
  <Flashcard term="機密快取（Caching）">頻繁取用機密會累積 API 呼叫與延遲，用官方的快取用戶端在本機快取一段時間，可大幅減少呼叫；Lambda 可放在處理常式外重用。</Flashcard>
</Flashcards>

## 請求簽署與 STS

<Flashcards>
  <Flashcard term="SigV4（簽章第 4 版）">AWS API 請求的簽章機制，用你的祕密金鑰對請求內容算出簽章，證明請求確實是你發的、且途中沒被竄改。SDK 會自動幫你簽，不用手刻。</Flashcard>
  <Flashcard term="預簽章 URL（Presigned URL）">用你的憑證產生一條帶時效的網址，讓沒有 AWS 權限的人也能臨時上傳或下載特定 S3 物件，到期即失效。</Flashcard>
  <Flashcard term="STS（Security Token Service）">發放臨時憑證的服務。AssumeRole、聯合身分、跨帳號存取、GetSessionToken 都經過它，是臨時憑證的總源頭。</Flashcard>
</Flashcards>

👉 來測驗：[Domain 2 練習題](./quiz.md)
