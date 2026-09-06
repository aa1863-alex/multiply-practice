# 九九乘法表練習

平板/手機友善的九九乘法表練習網頁，純 HTML/CSS/JS，無需建置工具。

## 功能

- 指定要練習的倍數（可多選，例如 2 和 7 的倍數）
- 可設定題數（預設 10 題）
- 一次只顯示一題，題目大字顯示
- 兩種作答方式：數字鍵盤逐位輸入，或四選一點選，全程免鍵盤
- 答錯的題目會排入下一輪重考，直到全部答對為止
- 完成後顯示輪數與正確率

## 開發

直接用瀏覽器打開 `index.html` 即可，或用任意靜態伺服器：

```bash
python3 -m http.server 8000
```

## 部署

本專案部署在 Cloudflare Pages，透過 GitHub repo 自動部署（push 到 main 分支後自動重新部署）。

詳細設計請見 [docs/specs/2026-09-06-multiply-practice-design.md](docs/specs/2026-09-06-multiply-practice-design.md)。
