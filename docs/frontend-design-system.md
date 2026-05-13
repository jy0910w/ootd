# OOTD 前端設計系統規格 (Design System Specification)

**版本:** 2.0  
**更新日期:** 2026-04-27  
**設計理念:** 活潑、年輕、輕鬆但有質感

---

## 🎨 色彩系統 (Color Palette)

### 主色調 - Teal Blue-Green (活力藍綠)

```css
/* Brand - Teal Scale */
--color-brand-50:  #ECFDF7;   /* 超淡背景 */
--color-brand-100: #D1FAE5;   /* Tag 背景 */
--color-brand-200: #A7F3D0;   
--color-brand-300: #6EE7B7;   
--color-brand-400: #34D399;   
--color-brand-500: #00D4AA;   /* 主色 ★ Primary CTA */
--color-brand-600: #00B894;   /* Hover State ★ */
--color-brand-700: #0D9B7E;   /* Active/Pressed */
--color-brand-800: #047857;   
--color-brand-900: #065F46;   /* 深色文字 */
```

**使用場景:**
- `500`: 主要按鈕、連結、選中狀態
- `600`: Hover 狀態
- `700`: Active/Pressed 狀態
- `100`: Tag 背景、輕量高亮區塊
- `50`: 超淡背景、Alert 區塊

---

### 點綴色 - Sunshine Orange (陽光橙)

```css
/* Accent - Orange Scale */
--color-accent-50:  #FFF7ED;
--color-accent-100: #FFEDD5;
--color-accent-400: #FFB347;   /* 主橙 ★ Secondary CTA */
--color-accent-500: #FF9E1F;   /* Hover */
--color-accent-600: #F97316;   /* Active */
```

**使用場景:**
- `400`: 次要按鈕、特殊高亮、趣味元素
- `500`: Hover 狀態
- `100`: 警告/提示背景

---

### 中性色 - Light Mode (淺色模式)

```css
/* Background */
--color-bg-base:      #FFFFFF;    /* 主背景 */
--color-bg-elevated:  #F9FAFB;    /* 卡片背景 */
--color-bg-subtle:    #F3F4F6;    /* Input/Disabled 背景 */
--color-bg-overlay:   rgba(0, 0, 0, 0.6); /* Modal 遮罩 */

/* Text */
--color-text-primary:   #111827;  /* 主要文字 */
--color-text-secondary: #6B7280;  /* 次要文字 */
--color-text-tertiary:  #9CA3AF;  /* 輔助文字/Placeholder */
--color-text-disabled:  #D1D5DB;  /* 禁用狀態 */

/* Border */
--color-border:        #E5E7EB;   /* 一般邊框 */
--color-border-subtle: #F3F4F6;   /* 輕量分隔線 */
--color-border-focus:  #00D4AA;   /* Focus 狀態邊框 */
```

---

### 中性色 - Dark Mode (深色模式)

```css
/* Background */
--dark-bg-base:      #0F1419;    /* 主背景 */
--dark-bg-elevated:  #1A1F28;    /* 卡片背景 */
--dark-bg-subtle:    #232933;    /* Input/Hover 背景 */
--dark-bg-overlay:   rgba(0, 0, 0, 0.85); /* Modal 遮罩 */

/* Text */
--dark-text-primary:   #F9FAFB;  /* 主要文字 */
--dark-text-secondary: #D1D5DB;  /* 次要文字 */
--dark-text-tertiary:  #9CA3AF;  /* 輔助文字 */
--dark-text-disabled:  #4B5563;  /* 禁用狀態 */

/* Border */
--dark-border:        #2D3748;   /* 一般邊框 */
--dark-border-subtle: #1F2937;   /* 輕量分隔線 */
--dark-border-focus:  #00D4AA;   /* Focus 狀態邊框 */
```

---

### 語義色 (Semantic Colors)

```css
/* Success */
--color-success:     #10B981;
--color-success-bg:  #D1FAE5;

/* Warning */
--color-warning:     #F59E0B;
--color-warning-bg:  #FEF3C7;

/* Error */
--color-error:       #EF4444;
--color-error-bg:    #FEE2E2;

/* Info */
--color-info:        #3B82F6;
--color-info-bg:     #DBEAFE;
```

---

## 🔤 字體系統 (Typography)

### 字體家族

```css
/* Primary Font - Geist Sans */
--font-primary: 'Geist', 'SF Pro Display', 'SF Pro Text', 
                -apple-system, BlinkMacSystemFont, 'Segoe UI', 
                system-ui, sans-serif;

/* Monospace (用於 code/數字) */
--font-mono: 'Geist Mono', 'SF Mono', 'Monaco', 
             'Cascadia Code', 'Courier New', monospace;
```

**引入方式:**
```html
<!-- Via CDN -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

<!-- 或使用 Vercel Geist -->
<link href="https://cdn.jsdelivr.net/npm/@vercel/geist@latest/dist/index.css" rel="stylesheet">
```

> **備註:** 如果 Geist 無法載入,使用 Inter 作為備用方案

---

### 字級階層 (Font Scale)

| Token | Size | Line Height | Usage |
|-------|------|-------------|-------|
| `--text-xs` | 12px / 0.75rem | 1.4 (16.8px) | 標籤、注釋 |
| `--text-sm` | 14px / 0.875rem | 1.5 (21px) | 輔助文字、按鈕 |
| `--text-base` | 16px / 1rem | 1.6 (25.6px) | 內文 |
| `--text-lg` | 18px / 1.125rem | 1.6 (28.8px) | 小標題 |
| `--text-xl` | 20px / 1.25rem | 1.5 (30px) | 卡片標題 |
| `--text-2xl` | 24px / 1.5rem | 1.4 (33.6px) | Section 標題 |
| `--text-3xl` | 30px / 1.875rem | 1.3 (39px) | 頁面標題 |
| `--text-4xl` | 36px / 2.25rem | 1.2 (43.2px) | Hero 標題 |
| `--text-5xl` | 48px / 3rem | 1.1 (52.8px) | 大標題 |
| `--text-6xl` | 60px / 3.75rem | 1.0 (60px) | 超大標題 |

---

### 字重 (Font Weight)

```css
--font-normal:    400;  /* 內文 */
--font-medium:    500;  /* 強調文字 */
--font-semibold:  600;  /* 小標題 */
--font-bold:      700;  /* 標題 */
```

---

### Letter Spacing

```css
--tracking-tight:   -0.02em;  /* 大標題 */
--tracking-normal:   0em;     /* 一般文字 */
--tracking-wide:     0.02em;  /* 按鈕/標籤 */
--tracking-wider:    0.05em;  /* 全大寫文字 */
```

---

## 📐 間距系統 (Spacing)

使用 4px 基礎單位:

```css
--space-0:   0px;
--space-1:   4px;
--space-2:   8px;
--space-3:   12px;
--space-4:   16px;
--space-5:   20px;
--space-6:   24px;
--space-8:   32px;
--space-10:  40px;
--space-12:  48px;
--space-16:  64px;
--space-20:  80px;
--space-24:  96px;
```

---

## 🔘 圓角系統 (Border Radius)

```css
--radius-none: 0px;
--radius-sm:   6px;    /* 小元素 (tag, badge) */
--radius-md:   8px;    /* 按鈕、input */
--radius-lg:   12px;   /* 卡片 */
--radius-xl:   16px;   /* 大卡片、modal */
--radius-2xl:  24px;   /* 特殊裝飾 */
--radius-full: 9999px; /* 圓形/膠囊 */
```

---

## 💫 陰影系統 (Shadows)

### Light Mode - Teal Tinted Shadows

```css
--shadow-sm: 
  0 1px 2px rgba(0, 212, 170, 0.05);

--shadow-md: 
  0 4px 6px rgba(0, 212, 170, 0.07), 
  0 2px 4px rgba(0, 212, 170, 0.06);

--shadow-lg: 
  0 10px 15px rgba(0, 212, 170, 0.10), 
  0 4px 6px rgba(0, 212, 170, 0.08);

--shadow-xl: 
  0 20px 25px rgba(0, 212, 170, 0.12), 
  0 8px 10px rgba(0, 212, 170, 0.08);

--shadow-2xl:
  0 25px 50px rgba(0, 212, 170, 0.15),
  0 12px 24px rgba(0, 212, 170, 0.10);
```

### Dark Mode Shadows

```css
--dark-shadow-sm:
  0 1px 2px rgba(0, 0, 0, 0.4);

--dark-shadow-md:
  0 4px 6px rgba(0, 0, 0, 0.3), 
  0 2px 4px rgba(0, 212, 170, 0.1);

--dark-shadow-lg:
  0 10px 15px rgba(0, 0, 0, 0.4), 
  0 4px 6px rgba(0, 212, 170, 0.15);

--dark-shadow-xl:
  0 20px 25px rgba(0, 0, 0, 0.5), 
  0 8px 10px rgba(0, 212, 170, 0.2);
```

---

## 🎭 動畫系統 (Animation)

### Timing Functions

```css
--ease-in:     cubic-bezier(0.4, 0, 1, 1);
--ease-out:    cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);  /* 彈簧效果 */
```

### Duration

```css
--duration-fast:   150ms;  /* 按鈕 hover */
--duration-base:   200ms;  /* 一般互動 */
--duration-slow:   300ms;  /* 卡片動畫 */
--duration-slower: 500ms;  /* 頁面轉場 */
```

### 常用動畫

```css
/* Button Hover */
transition: background-color var(--duration-fast) var(--ease-out),
            box-shadow var(--duration-base) var(--ease-out);

/* Card Hover */
transition: transform var(--duration-slow) var(--ease-spring),
            box-shadow var(--duration-slow) var(--ease-out);

/* Modal Fade In */
transition: opacity var(--duration-base) var(--ease-out);
```

---

## 🖱️ 互動狀態 (Interactive States)

### 按鈕 - Primary (品牌色)

```css
/* Default */
background: var(--color-brand-500);
color: white;

/* Hover */
background: var(--color-brand-600);
box-shadow: var(--shadow-md);

/* Active/Pressed */
background: var(--color-brand-700);
transform: scale(0.98);

/* Focus */
outline: 2px solid var(--color-brand-500);
outline-offset: 2px;

/* Disabled */
background: var(--color-text-disabled);
cursor: not-allowed;
```

### 按鈕 - Secondary (橙色點綴)

```css
/* Default */
background: var(--color-accent-400);
color: white;

/* Hover */
background: var(--color-accent-500);
box-shadow: var(--shadow-md);
```

### 按鈕 - Ghost (透明邊框)

```css
/* Default */
background: transparent;
border: 1px solid var(--color-border);

/* Hover */
background: var(--color-bg-subtle);
border-color: var(--color-brand-500);
```

### 卡片 Hover

```css
/* Default */
box-shadow: var(--shadow-sm);

/* Hover */
transform: translateY(-4px);
box-shadow: var(--shadow-lg);
```

---

## 📱 響應式斷點 (Breakpoints)

```css
--breakpoint-sm:  640px;   /* Mobile landscape */
--breakpoint-md:  768px;   /* Tablet */
--breakpoint-lg:  1024px;  /* Laptop */
--breakpoint-xl:  1280px;  /* Desktop */
--breakpoint-2xl: 1536px;  /* Large desktop */
```

---

## 🌓 Dark Mode 實作

### HTML 結構

```html
<html class="light"> <!-- 或 class="dark" -->
  <body>
    <!-- Theme Switcher Button -->
    <button id="theme-toggle" aria-label="Toggle theme">
      <span class="light-icon">🌙</span>
      <span class="dark-icon">☀️</span>
    </button>
  </body>
</html>
```

### CSS 變數切換

```css
:root.light {
  --bg-base: var(--color-bg-base);
  --text-primary: var(--color-text-primary);
  /* ... */
}

:root.dark {
  --bg-base: var(--dark-bg-base);
  --text-primary: var(--dark-text-primary);
  /* ... */
}
```

### JavaScript 邏輯

```javascript
// 讀取 localStorage
const theme = localStorage.getItem('theme') || 'light';
document.documentElement.className = theme;

// 切換函數
function toggleTheme() {
  const current = document.documentElement.className;
  const next = current === 'light' ? 'dark' : 'light';
  document.documentElement.className = next;
  localStorage.setItem('theme', next);
}
```

---

## 🎯 元件範例

### Tag / Badge

```css
.tag {
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  
  /* Light mode */
  background: var(--color-brand-100);
  color: var(--color-brand-700);
  border: 1px solid var(--color-brand-200);
}
```

### Input Field

```css
.input {
  height: 44px;
  padding: 0 16px;
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  
  /* Light mode */
  background: var(--color-bg-base);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  
  transition: border-color var(--duration-fast) var(--ease-out);
}

.input:focus {
  outline: none;
  border-color: var(--color-border-focus);
  box-shadow: 0 0 0 3px rgba(0, 212, 170, 0.1);
}
```

---

## 📚 參考資源

- **配色靈感:** [Coolors.co](https://coolors.co/)
- **字體:** [Geist by Vercel](https://vercel.com/font)
- **圖示:** [Heroicons](https://heroicons.com/) / [Lucide](https://lucide.dev/)
- **可及性檢查:** [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

---

## ✅ 設計檢查清單

實作前請確認:

- [ ] 色彩對比度符合 WCAG AA 標準 (4.5:1 for text)
- [ ] 所有互動元素有明確的 hover/focus/active 狀態
- [ ] Dark mode 下所有元素可見且可讀
- [ ] 移動裝置觸控目標至少 44x44px
- [ ] 動畫效果流暢 (60fps)
- [ ] 支援 `prefers-reduced-motion` 媒體查詢

---

**維護者:** OOTD Frontend Team  
**最後更新:** 2026-04-27
