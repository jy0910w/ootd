/**
 * OOTD Theme Switcher
 * 支援 Light/Dark 模式切換,並保存使用者偏好到 localStorage
 */

(function() {
  'use strict';

  const STORAGE_KEY = 'ootd-theme';
  const CLASS_LIGHT = 'light';
  const CLASS_DARK = 'dark';

  /**
   * 取得系統偏好的主題
   */
  function getSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return CLASS_DARK;
    }
    return CLASS_LIGHT;
  }

  /**
   * 取得儲存的主題偏好
   * 優先順序: localStorage > 系統偏好 > light (預設)
   */
  function getSavedTheme() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === CLASS_LIGHT || saved === CLASS_DARK) {
        return saved;
      }
    } catch (e) {
      console.warn('無法讀取 localStorage:', e);
    }
    return getSystemTheme();
  }

  /**
   * 設定主題
   */
  function setTheme(theme) {
    const html = document.documentElement;
    const isDark = theme === CLASS_DARK;

    // 移除現有 class
    html.classList.remove(CLASS_LIGHT, CLASS_DARK);
    
    // 加上新 class
    html.classList.add(theme);

    // 儲存到 localStorage
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      console.warn('無法寫入 localStorage:', e);
    }

    // 更新 toggle button 狀態
    updateToggleButton(isDark);

    // 觸發自訂事件,讓其他元件可以監聽主題變更
    window.dispatchEvent(new CustomEvent('themechange', { 
      detail: { theme } 
    }));
  }

  /**
   * 切換主題
   */
  function toggleTheme() {
    const current = document.documentElement.classList.contains(CLASS_DARK) 
      ? CLASS_DARK 
      : CLASS_LIGHT;
    const next = current === CLASS_LIGHT ? CLASS_DARK : CLASS_LIGHT;
    setTheme(next);
  }

  /**
   * 更新 toggle button 的視覺狀態
   */
  function updateToggleButton(isDark) {
    const button = document.getElementById('theme-toggle');
    if (!button) return;

    const lightIcon = button.querySelector('.light-icon');
    const darkIcon = button.querySelector('.dark-icon');

    if (lightIcon && darkIcon) {
      lightIcon.style.display = isDark ? 'none' : 'inline-block';
      darkIcon.style.display = isDark ? 'inline-block' : 'none';
    }

    // 更新 aria-label
    button.setAttribute('aria-label', isDark ? '切換到淺色模式' : '切換到深色模式');
  }

  /**
   * 初始化
   */
  function init() {
    // 1. 立即套用儲存的主題 (避免閃爍)
    const theme = getSavedTheme();
    document.documentElement.classList.add(theme);
    
    // 2. 當 DOM 載入完成後,綁定事件
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bindEvents);
    } else {
      bindEvents();
    }

    // 3. 監聽系統主題變更
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      // 現代瀏覽器
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', (e) => {
          // 只在沒有手動設定過主題時才自動切換
          const hasManualPreference = localStorage.getItem(STORAGE_KEY);
          if (!hasManualPreference) {
            setTheme(e.matches ? CLASS_DARK : CLASS_LIGHT);
          }
        });
      }
      // 舊版瀏覽器
      else if (mediaQuery.addListener) {
        mediaQuery.addListener((e) => {
          const hasManualPreference = localStorage.getItem(STORAGE_KEY);
          if (!hasManualPreference) {
            setTheme(e.matches ? CLASS_DARK : CLASS_LIGHT);
          }
        });
      }
    }
  }

  /**
   * 綁定事件監聽器
   */
  function bindEvents() {
    const button = document.getElementById('theme-toggle');
    if (button) {
      button.addEventListener('click', toggleTheme);
      
      // 鍵盤支援
      button.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleTheme();
        }
      });

      // 初始化 button 狀態
      const isDark = document.documentElement.classList.contains(CLASS_DARK);
      updateToggleButton(isDark);
    }
  }

  /**
   * 公開 API
   */
  window.ThemeSwitcher = {
    get current() {
      return document.documentElement.classList.contains(CLASS_DARK) ? CLASS_DARK : CLASS_LIGHT;
    },
    setTheme,
    toggleTheme,
    isDark() {
      return this.current === CLASS_DARK;
    },
    isLight() {
      return this.current === CLASS_LIGHT;
    }
  };

  // 立即執行初始化
  init();
})();
