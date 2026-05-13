# OOTD 配色遷移進度報告

**更新時間:** 2026-04-27  
**目標:** 從森林綠 (#2f7a56) 遷移到活力藍綠 (#00D4AA) + 陽光橙 (#FFB347)

---

## ✅ 已完成項目

### 1. 基礎設計系統 (100%)
- [x] 建立設計規格文件 `docs/frontend-design-system.md`
- [x] 建立 CSS 變數系統 `design-tokens.css`
- [x] 實作 Dark Mode 切換功能 `theme-switcher.js`
- [x] 引入 Inter 字體 (Geist Sans fallback)
- [x] 更新 Tailwind 配置

### 2. 全域樣式 (90%)
- [x] 更新 body 背景與文字顏色變數
- [x] 更新 Scrollbar 樣式
- [x] 更新按鈕樣式 (btn-primary, btn-ghost)
- [x] 更新導航連結樣式
- [x] 更新輸入框樣式
- [x] 更新卡片 hover 效果
- [x] 更新標籤 (tag-pill) 樣式
- [x] 更新 Modal 遮罩樣式
- [ ] 更新圖片 placeholder URLs (需批量替換)

### 3. Navigation Bar (100%)
- [x] 玻璃擬態效果
- [x] 新增 Dark Mode 切換按鈕
- [x] 更新文字與 hover 狀態
- [x] 更新 Avatar 樣式

### 4. Login 頁面 (100%)
- [x] 左側品牌區背景改為淺 Teal
- [x] 更新表單區配色
- [x] 更新按鈕與連結配色

### 5. Wardrobe 頁面 (40%)
- [x] Header 文字與按鈕配色
- [x] Filter bar 按鈕樣式
- [x] 標籤配色
- [ ] 卡片背景色 (目前仍是深色)
- [ ] 圖片 placeholder 更新為 Teal 色調
- [ ] Item overlay 顏色調整

### 6. Outfits 頁面 (0%)
- [ ] Header 配色
- [ ] 卡片背景與漸層
- [ ] Badge 配色
- [ ] 圖片 placeholder

### 7. Recommendations 頁面 (0%)
- [ ] Header 配色
- [ ] AI 分析區塊樣式
- [ ] 推薦卡片樣式
- [ ] 按鈕配色

### 8. Composer 頁面 (0%)
- [ ] 側邊欄背景
- [ ] Canvas 區域樣式
- [ ] Item 選擇狀態
- [ ] 底部操作欄

### 9. Upload Modal (0%)
- [ ] Modal 背景與邊框
- [ ] 步驟指示器顏色
- [ ] Drop zone 樣式
- [ ] 按鈕配色

---

## 🚧 待處理項目 (優先順序)

### 高優先級
1. **批量更新圖片 placeholder URLs**
   - 將所有 `placehold.co` URL 的顏色從舊綠色改為 Teal
   - 範例: `placehold.co/400x560/1a1a17/2f7a56` → `placehold.co/400x560/F9FAFB/00D4AA`

2. **修正卡片背景色**
   - 目前所有 `style="background:#1a1a17"` 需改為 `style="background: var(--card-bg);"`
   - 漸層覆蓋層需使用新的顏色變數

3. **完成 Outfits/Recommendations/Composer/Upload Modal 頁面**
   - 依照相同模式更新配色

### 中優先級
4. **Dark Mode 完整測試**
   - 測試所有頁面在 Dark Mode 下的可讀性
   - 調整對比度不足的元素

5. **響應式調整**
   - 檢查移動裝置下的視覺效果
   - 調整字級與間距

### 低優先級
6. **同步 Next.js App (`apps/web`)**
   - 更新 `tailwind.config.ts`
   - 安裝並配置 `next-themes`
   - 遷移現有元件配色

7. **圖示更新**
   - 如果有品牌圖示,更新為 Teal 版本
   - Favicon 更新

---

## 📊 整體進度

| 項目 | 進度 | 狀態 |
|------|------|------|
| 設計系統建立 | 100% | ✅ 完成 |
| 全域樣式更新 | 90% | 🟡 進行中 |
| Login 頁面 | 100% | ✅ 完成 |
| Wardrobe 頁面 | 40% | 🟡 進行中 |
| Outfits 頁面 | 0% | ⏸️ 待開始 |
| Recommendations 頁面 | 0% | ⏸️ 待開始 |
| Composer 頁面 | 0% | ⏸️ 待開始 |
| Upload Modal | 0% | ⏸️ 待開始 |
| Dark Mode 測試 | 0% | ⏸️ 待開始 |
| Next.js 同步 | 0% | ⏸️ 待開始 |

**總體進度:** 約 35%

---

## 🔧 技術債務

1. **圖片 URL 硬編碼問題**
   - 目前所有 placeholder 圖片 URL 都寫在 HTML 中
   - 建議: 改用 CSS 變數或統一管理

2. **Inline Style 過多**
   - 許多樣式直接寫在 `style` 屬性中
   - 建議: 遷移到 CSS class 或 Tailwind utilities

3. **顏色值混用**
   - 有些地方使用 Tailwind class,有些使用 CSS 變數
   - 建議: 統一使用 CSS 變數以支援 Dark Mode

---

## 📝 下一步行動計畫

### 階段 1: 完成 index.html 核心頁面 (預計 2-3 小時)
1. 批量替換所有圖片 placeholder URLs
2. 更新所有卡片背景色為變數
3. 完成 Outfits/Recommendations 頁面配色
4. 完成 Composer 和 Upload Modal

### 階段 2: Dark Mode 完整測試 (預計 1 小時)
1. 逐頁測試 Dark Mode 切換
2. 調整對比度問題
3. 修正視覺 bug

### 階段 3: Next.js App 同步 (預計 2 小時)
1. 更新 tailwind.config.ts
2. 安裝 next-themes
3. 更新現有元件

### 階段 4: 優化與文件 (預計 1 小時)
1. 清理多餘 inline styles
2. 更新 README
3. 建立 Design System 使用指南

---

**預計總完成時間:** 6-7 小時  
**當前已投入時間:** ~2 小時  
**剩餘時間:** ~4-5 小時
