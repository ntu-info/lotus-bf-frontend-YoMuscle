[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/DZepDCgF)
[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-2e0aaae1b6195c2367325f4f02e2d04e9abb55f0b24a779b69b11b9e10269abc.svg)](https://classroom.github.com/online_ide?assignment_repo_id=21445974&assignment_repo_type=AssignmentRepo)

## LoTUS-BF 前端

Location-or-Term Unified Search for Brain Functions 的前端（React + Vite）。本專案提供深色介面、關鍵詞/座標混合查詢、NIfTI 腦圖視覺化、以及可互動的 Studies 與 Locations 清單。

---

## 特色概覽

- 深色專業風格介面：一致的按鈕、表格、輸入框與自訂捲軸。
- 三欄可調大小的工作區：Terms、Query Builder + Studies、NIfTI Viewer + Locations；尺寸會自動記憶。
- Terms 與 Related terms：
	- 點選左側任一 term 會自動加入 Query Builder，並載入該 term 的相關詞（含 co_count 與 jaccard）。
	- 支援 AND / OR / NOT 快速按鈕；提供排序（co_count / jaccard / term）與顯示筆數（10 / 25 / 50）。
- Query Builder：
	- 直接輸入混合語法（範例：[-22,-4,18] AND emotion）。
	- 內建自動完成（/terms），可按 Enter 確認；提供 AND/OR/NOT/( ) 按鈕；Clear 只在你按下時才清空。
- NIfTI Viewer：
	- 顯示三向切片（Coronal / Sagittal / Axial），點圖可移動十字準線。
	- 參數完整對應後端：voxel、kernel（gauss|uniform）、fwhm、r；支援閾值模式（值/百分位）與 overlay 透明度。
	- 支援從 Locations 點列，即時跳到對應座標（x,y,z）。
- Studies 清單：
	- 伺服器分頁（limit/offset），快速載入當前頁；Study ID 會連到 PubMed。
	- 提供每頁顯示數量（10/20/50）與排序（欄位點擊）。
- Locations 清單：
	- 伺服器分頁（limit/offset）與伺服器排序（sort、dir）。
	- r(mm) 可調；點擊列會讓 Viewer 十字準線跳到該 [x,y,z]；Study ID 連 PubMed。
- 設定持久化：
	- 視窗分欄尺寸、Viewer 參數（voxel/fwhm/kernel/r、overlay、閾值設定）都會儲存在瀏覽器 localStorage。

---

## 使用教學（操作手冊）

1) 基本導覽
- 左欄 Terms：瀏覽或搜尋字詞；點選一個詞，會自動加入查詢，並顯示 Related terms。
- 中欄 Query Builder + Studies：
	- 在輸入框直接建立查詢，例：`[-2,50,-6] NOT "ventromedial prefrontal"`。
	- 可用按鈕快速插入 AND/OR/NOT/( )。
	- Studies 會依目前查詢向後端取得分頁結果；可改變每頁筆數、切換頁碼、點表頭排序。
- 右欄 NIfTI Viewer + Locations：
	- Viewer：調整 voxel/fwhm/kernel/r、閾值模式與 overlay；點圖移動十字準線；也可手動輸入 X/Y/Z（mm）。
	- Locations：顯示目前查詢的座標結果；支援伺服器分頁與排序；點任一列即可讓 Viewer 跳到該座標。

2) 常見任務
- 新增關鍵詞：在 Terms 點一個詞，或於 Query Builder 直接輸入；Related terms 可用 AND/OR/NOT 加入。
- 加入座標條件：在 Query Builder 輸入 `[x,y,z]`，例如 `([30,-60,50] OR [40,-50,45]) AND default mode`。
- 檢視腦圖：Query Builder 有查詢後，Viewer 會從 `/query/<mixed>/nii` 載入地圖；可調 voxel/fwhm/kernel/r 與閾值。
- 檢視研究與座標：Studies 與 Locations 會從 `/query/<mixed>/(studies|locations)` 載入；
	- Studies/Locations 都可在上、下方分頁器選擇每頁筆數並切換頁碼。
	- Locations 支援表頭點擊切換排序（study_id / x / y / z 與 asc/desc）。
- 跳轉 PubMed：在 Studies 或 Locations 點 Study ID 連到 PubMed 頁面。

3) 查詢語法快速對照
- 支援 AND / OR / NOT 與括號 ( )。
- 文字：裸字會自動聚成片語；精確片語請加引號，如 `"default mode"`。
- 座標：[x,y,z]；Locations 可帶 `?r=` 指定半徑（mm），預設 6。Viewer 的 `r` 亦會帶入 /nii。
- 範例：
	- `/query/[-2,50,-6] NOT "ventromedial prefrontal"/studies`
	- `/query/([30,-60,50] OR [40,-50,45]) AND default mode/locations?r=8`
	- `/query/[-2,50,-6] AND reward/nii?voxel=2&fwhm=8&kernel=gauss`

---

## 開發與部署

需求：Node.js LTS（建議 18+）。Windows 可用 PowerShell。

安裝依賴（第一次或換機時）

```powershell
# 遇到舊套件衝突時可先清除
rm -r -fo node_modules; if (Test-Path package-lock.json) { rm package-lock.json }

npm install
```

本機開發

```powershell
npm run dev
# 預設 http://localhost:5173/
```

正式建置

```powershell
npm run build
# 產出在 ./dist，可上傳到靜態主機或放在 CDN
```

---

## 疑難排解

- 畫面寬度跳動或出現水平捲軸：已於樣式修正，若仍遇到，請回報瀏覽器版本與視窗寬度。
- NIfTI 地圖載入失敗：請確認 Query 是否有效，或檢查後端 /nii 端點狀態。
- 相關詞沒有顯示：可能該 term 沒有相關詞；或後端 `/terms/<term>` 回傳為空。

---

## 原始備忘與快速試用（保留原內容）

```bash
nvm install --lts                 # for solving

rm -rf node_modules package-lock.json   # delete all incompatible packages

npm install                       # reinstall every packages according to package.json

npm run dev                       # for local development

npm run build                     # for server deployment; upload the ./dist folder to a server
```

How to try it

Locations jump

- Run a query so the Locations table shows results.
- Click any row: the Viewer crosshair jumps to that [x, y, z]; the inputs update immediately.

Related terms

- Click a term in the left pane.
- Use Sort by and Show controls above “Related to: …” to change ordering and how many are visible.
- Click AND/OR/NOT buttons to append to the Query Builder without clearing previous terms.

Page size

- Use the “per page” selector at the top/bottom of the Studies and Locations tables.

Persistence

- Resize the three panes; reload the page—sizes are remembered.
- Change Viewer parameters; reload the page—settings are remembered.

---

## 授權

僅用於 LoTUS-BF 專案開發與展示。若需重用或二次開發，請先與專案維護者聯繫。