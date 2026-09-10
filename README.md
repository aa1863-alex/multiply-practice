# 九九乘法表練習

平板/手機友善的九九乘法表練習網頁，純 HTML/CSS/JS，無需建置工具。

網站網址：<https://99.smartchu321.win>（亦可用 <https://multiply-practice.aa1863.workers.dev>）

## 功能

- 指定要練習的倍數 2~9（可多選，例如 2 和 7 的倍數），只出「該數字 × 2~9」的題目
- 可設定題數（預設 10 題），可選擇每題作答秒數限制
- 開始前先顯示所選倍數的乘法表複習畫面
- 一次只顯示一題，題目大字顯示
- 兩種作答方式：數字鍵盤逐位輸入，或四選一點選，全程免鍵盤
- 答錯可重答一次，第二次仍錯會直接揭曉答案
- 答錯的題目會排入下一輪重考，直到某一輪全部答對為止
- 答對／答錯提示音效（右上角可關閉）
- 完成後顯示得分（0~100 分）、輪數，並列出曾經答錯的題目與解答
- 自動記住上次的設定（`localStorage`）

## 開發

直接用瀏覽器打開 `index.html` 即可，或用任意靜態伺服器：

```bash
python3 -m http.server 8000
```

## 部署

網站部署在 **Cloudflare Workers**（Worker 名稱 `multiply-practice`），**push 到 GitHub 不會自動更新網站**，必須另外執行：

```bash
npx wrangler deploy
```

`wrangler.toml` 將整個專案目錄宣告為靜態資源，`.assetsignore` 排除 `docs/`、`README.md` 等非網站檔案。因此只修改文件時不需要重新部署。

## 在多台電腦上開發

GitHub repo 是唯一的正本，每台電腦都照這個流程：

**第一次在新電腦上使用**

```bash
gh repo clone aa1863-alex/multiply-practice
cd multiply-practice
npx wrangler login   # 登入 Cloudflare，每台電腦只需做一次
```

**每次開始修改前**

```bash
git pull
```

**改完之後**

```bash
git add -A
git commit -m "feat: 描述這次修改"
git push
npx wrangler deploy  # 要讓網站更新時才需要
```

> ⚠️ 部署前一定要先 `git pull` 並確認 `git status` 乾淨、已經 push。`wrangler deploy` 會把「這台電腦目前的檔案」直接蓋到線上，如果這台電腦的程式碼比較舊，就會把別台電腦上線的新版本蓋掉。

詳細設計請見 [docs/specs/2026-09-06-multiply-practice-design.md](docs/specs/2026-09-06-multiply-practice-design.md)。
