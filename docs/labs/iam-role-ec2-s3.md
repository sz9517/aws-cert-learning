---
sidebar_position: 2
title: 實驗 2：用 IAM 角色讓 EC2 存取 S3
---

# 實驗 2：用 IAM 角色讓 EC2 安全存取 S3（不碰金鑰）

> 這個實驗要回答一個對新手超級重要、考試也反覆在考的問題：**一台 EC2 要存取 S3，憑證要從哪裡來？** 答案是——**不要把 Access Key 塞進機器裡**，而是掛一個 **IAM 角色（Role）**。角色給的是**會自動輪替的臨時憑證**，最安全，也是正式環境的標準做法。全程走免費額度，做完記得清理。

<Vocab title="📌 先認識這篇會出現的名詞（完全沒碰過也能懂）">

- **IAM 角色（Role）**：一個可以被「扮演」的臨時權限身分。給**服務**（例如 EC2）用，扮演後自動拿到臨時憑證。
- **執行個體設定檔（Instance Profile）**：把角色「包起來」交給 EC2 的容器。你在主控台勾選角色時，AWS 會自動幫你建好它。
- **憑證／金鑰（Credentials / Access Key）**：證明「你是誰、有沒有權限」的通行密碼。長期金鑰一旦外洩，別人就能冒用你的帳號。
- **臨時憑證（Temporary Credentials）**：有時效、會自動輪替的短期通行證，用完就失效，比長期金鑰安全得多。
- **最小權限（Least Privilege）**：只給「剛好夠用」的權限，不多給一點。

</Vocab>

:::note[💬 閱讀小提示]
看到帶<Term desc="像這樣！滑鼠移到有虛線的名詞上（手機點一下），就會跳出白話解釋。">虛線底線的名詞</Term>，把滑鼠移上去就會跳出白話解釋。所有名詞也整理在 [名詞與服務對照表](/glossary)。
:::

:::info[開始前的前提]
這篇假設你已經完成前面的準備：

- 已經完成 [你的第一個動手實作：EC2 + S3](/intro/first-hands-on)，知道怎麼開 EC2、建 S3 貯體、連進機器。
- 已經**設好帳單告警（Billing Alarm）**，花超過門檻會收到通知。
- 建議整篇固定在同一個**區域（Region）**（例如「亞太區域（東京）ap-northeast-1」），比較不會找不到自己開的資源。

還沒做完？先回頭補完再來，這些是你的安全網。
:::

---

## 為什麼不要把 Access Key 放進 EC2？

很多新手的第一直覺是：「我在 EC2 上跑 `aws configure`，把 Access Key、Secret Key 貼進去，不就能存取 S3 了嗎？」**能動，但這是糟糕的做法**，原因有三：

- **金鑰是長期的**：你不換，它就一直有效。只要外洩（被 push 到 GitHub、被同事看到、機器被入侵），別人就能用你的身分為所欲為。
- **金鑰放在機器裡很難管**：機器一多，等於到處都是鑰匙備份，哪天要輪替、要撤銷，根本追不完。
- **正式環境根本不這樣做**：成熟團隊一律用角色。

<Analogy title="🏨 生活比喻：飯店房卡 vs 把大門鑰匙交給房客">

把長期 Access Key 放進 EC2，就像把**整棟大樓的萬能鑰匙**打一把交給住客——他弄丟了、被偷了，你整棟樓都暴露。**IAM 角色**比較像飯店的**房卡**：只能開他那間房、退房自動失效，而且隨時能重發一張。EC2 要的從來不是「萬能鑰匙」，而是「這次剛好夠用、而且會自動過期」的臨時通行證。

</Analogy>

### 角色（Role）到底怎麼運作？

當你把角色掛到 EC2 上，AWS 其實做了這幾件事：

<div className="flow">
  <div className="flow-node">角色掛到 EC2</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">EC2 自動扮演角色</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">取得臨時憑證</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">憑證到期自動輪替</div>
</div>

*圖：你完全不用手動輸入或保管任何金鑰，CLI／SDK 會自動去機器內部的中繼資料取得角色的臨時憑證。*

而「把角色交給 EC2」的那個容器，就叫**執行個體設定檔（Instance Profile）**。好消息是：在主控台用畫面操作時，**你不用管它**——AWS 會在你指派角色時自動建立並關聯好。你只要記得這個名詞考試可能會出現就好。

---

## 動手做：建一條只能讀「這一個貯體」的路

這次我們刻意收斂權限：不用現成的 `AmazonS3ReadOnlyAccess`（那會讓 EC2 讀得到**所有**貯體），而是自己寫一條政策，**只允許讀取我們這次建的那一個貯體**——這正是「最小權限」的實作。

### 步驟一：建一個 S3 貯體並放一個測試檔

1. 主控台搜尋列輸入 `S3` → 進入 S3 → 點**建立貯體（Create bucket）**。
2. **貯體名稱（Bucket name）** 必須**全球唯一**，建議加上識別字與日期，例如 `role-lab-wang-20261022`。請記住這個名字，後面政策要用。
3. **區域（Region）** 選你習慣用的那個。
4. **封鎖公開存取（Block Public Access）** 維持勾選「封鎖所有公開存取」——務必保持開啟。我們要的是「EC2 透過角色能讀」，不是「全世界都能讀」。
5. 其他維持**預設** → **建立貯體**。
6. 點進貯體 → **上傳（Upload）** → 丟一個小文字檔（例如 `hello.txt`，裡面隨便寫一行字）→ 上傳。這就是等一下要驗證「讀得到」的測試物件。

### 步驟二：建一個信任 EC2 的 IAM 角色，附上最小權限政策

1. 主控台搜尋 `IAM` → 進入 IAM → 左側 **角色（Roles）** → **建立角色**。
2. **信任的實體類型**選 **AWS 服務**，**使用案例**選 **EC2** → 下一步。（這一步就是在設定「這個角色只允許被 EC2 服務扮演」。）
3. 權限頁面先不選現成政策，點 **建立政策（Create policy）**，切到 **JSON** 頁籤，貼上下面這段（把兩個 `role-lab-wang-20261022` 換成你的貯體名稱）：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ReadOneBucketOnly",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetObject"
      ],
      "Resource": [
        "arn:aws:s3:::role-lab-wang-20261022",
        "arn:aws:s3:::role-lab-wang-20261022/*"
      ]
    }
  ]
}
```

4. 命名這條政策，例如 `read-role-lab-bucket` → **建立政策**。
5. 回到建立角色的頁面（可能要重新整理政策清單），勾選剛建好的 `read-role-lab-bucket` → 下一步。
6. 角色命名為 `ec2-read-one-bucket` → **建立角色**。

:::tip[💡 看懂這條政策做了什麼]
- `s3:ListBucket` 給在「貯體本身」（`arn:...:bucket`）上，才能 **列出**裡面有哪些物件。
- `s3:GetObject` 給在「貯體內的物件」（`arn:...:bucket/*`）上，才能 **下載**檔案。
- 沒有 `PutObject`、`DeleteObject`——所以這個角色**只能讀、不能寫、不能刪**。
- 只列了這一個貯體的 ARN——所以它**碰不到你帳號裡其他貯體**。這就是最小權限。
:::

### 步驟三：把角色附加到一台 EC2

1. 進 `EC2` → 啟動或選一台既有的執行個體（用免費額度的 `t2.micro`／`t3.micro`）。
2. 在執行個體清單勾選它 → **動作（Actions） › 安全性（Security） › 修改 IAM 角色（Modify IAM role）**。
3. 選剛建好的 `ec2-read-one-bucket` → **更新 IAM 角色（Update IAM role）**。

就這樣。**你沒有、也不需要在這台機器上輸入任何金鑰。**

### 步驟四：連進 EC2 驗證「沒設金鑰也能存取」

用 **EC2 Instance Connect** 或 **Session Manager**（瀏覽器就能連，較安全）連進機器，然後依序執行：

```bash
# 1. 先確認「我現在是誰」——看到的會是扮演角色後的臨時身分
$ aws sts get-caller-identity
# 輸出的 Arn 會類似：
# arn:aws:sts::123456789012:assumed-role/ec2-read-one-bucket/i-0abc123...

# 2. 列出貯體內容——憑證由角色自動提供，你完全沒打過金鑰
$ aws s3 ls s3://role-lab-wang-20261022

# 3. 把測試檔抓下來，確認真的讀得到
$ aws s3 cp s3://role-lab-wang-20261022/hello.txt .
$ cat hello.txt
```

能看到檔案內容，就代表成功了：**一行 `aws configure` 都沒打、機器裡沒有任何長期金鑰，EC2 卻能安全地讀到 S3。** 這就是角色的魔法。

:::note[想親眼看到「最小權限」在擋你？]
試著在同一台機器上執行 `aws s3 ls`（不加貯體名稱，等於要列出**所有**貯體），你會拿到 **AccessDenied**——因為我們的政策只授權了那一個貯體。再試 `aws s3 cp hello.txt s3://role-lab-wang-20261022/`（想上傳），一樣會被擋，因為沒給 `PutObject`。這就是「只給剛好夠用」的具體手感。
:::

---

## 最小權限：為什麼值得多花這點功夫？

直接套 `AmazonS3ReadOnlyAccess` 五秒搞定，為什麼我們要自己寫政策？因為**權限範圍 = 出事時的爆炸半徑**。這台 EC2 如果被入侵，攻擊者能用它的角色做的事，就是政策允許的那些事：

- 用現成的唯讀政策：攻擊者能讀光你帳號裡**每一個**貯體的內容。
- 用我們這條政策：攻擊者頂多讀到**那一個測試貯體**，其餘一律 AccessDenied。

收斂的做法就是**從「需要哪些動作、哪些資源」倒推**，只列出真正需要的 `Action` 與 `Resource`，其餘不給。實務上一開始可能抓不準，技巧是：先給小一點，跑起來遇到 AccessDenied 再按需補——**由小加大，而不是一開始就給 `*`**。

---

## 清理資源，避免被扣款

:::warning[🧹 做完一定要清理！不清理會持續扣款]
請務必依序把這次開的東西全部清掉：

**1. 終止（Terminate）EC2 執行個體**
- 進 `EC2` → 勾選這台機器 → **執行個體狀態（Instance state） › 終止執行個體（Terminate instance）** → 確認。
- 注意是**終止（Terminate）**，不是只有**停止（Stop）**；要看到狀態變 `Terminated` 才算真的刪掉。

**2. 刪掉 IAM 角色與政策**
- 進 `IAM` → **角色（Roles）** → 勾選 `ec2-read-one-bucket` → **刪除（Delete）**。
- 再到 **政策（Policies）** → 找到 `read-role-lab-bucket` → **刪除（Delete）**。
- （IAM 角色與政策本身免費，但留著用不到的權限不是好習慣，順手清掉。）

**3. 清空並刪掉 S3 貯體**
- 進 `S3` → 點貯體 → 全選物件 → **刪除（Delete）**（貯體必須先清空才能刪）。
- 物件清空後 → 回貯體清單 → 勾選該貯體 → **刪除（Delete）** → 輸入貯體名稱確認。
:::

<Cost title="💰 成本提醒">

這篇用的 `t2.micro`／`t3.micro` 與少量 S3 儲存都在**免費額度**內；**IAM 角色、政策本身完全免費**。照步驟做、做完清理，基本上不會產生費用。真正會中招的，是**忘了終止 EC2 或忘了刪貯體**——它們會一直默默計費。記住：**資源開了就要記得關。**

</Cost>

---

## 這對考試的意義

Domain 1（安全）反覆在考同一個觀念，請牢牢記住：

- **「EC2／Lambda 等服務要存取其他 AWS 服務」→ 答案幾乎都是「建立 IAM 角色指派給它」**，而**不是**產生 Access Key 寫進程式或機器。看到選項裡有「把金鑰存在 EC2／存在程式碼／存在環境變數」，通常就是陷阱。
- 角色給的是**會自動輪替的臨時憑證**，這也是考題愛強調的安全優勢。
- 題目若同時出現「最小權限」字眼，優先選**範圍最窄、剛好滿足需求**的那個答案；一律套 `AdministratorAccess` 或 `*` 是明確的錯誤選項。

把這題的直覺練成反射動作：**服務存服務，用角色；不要長期金鑰。**

<Refs title="📚 官方資料與延伸閱讀">

- [為 EC2 使用 IAM 角色（IAM roles for Amazon EC2）](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/iam-roles-for-amazon-ec2.html)
- [執行個體設定檔（Using instance profiles）](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use_switch-role-ec2_instance-profiles.html)
- [IAM 中的臨時安全憑證](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp.html)
- [IAM 安全最佳實務（含最小權限）](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [S3 的 IAM 政策範例（Bucket policies and user policies）](https://docs.aws.amazon.com/AmazonS3/latest/userguide/example-policies-s3.html)

</Refs>

👉 下一個實驗：[ALB + Auto Scaling 高可用網站](./alb-autoscaling.md)
