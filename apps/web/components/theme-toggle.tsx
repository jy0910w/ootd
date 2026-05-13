"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className="w-8 h-8 rounded-full flex items-center justify-center opacity-30"
        aria-label="Toggle theme"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-brand-500/10 transition-colors duration-200"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-brand-500">
          <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
          <line x1="8" y1="1" x2="8" y2="2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="8" y1="13.5" x2="8" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="15" y1="8" x2="13.5" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="2.5" y1="8" x2="1" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-brand-500">
          <path d="M14 8.5C13.5 11 11 13.5 8 13.5C4.5 13.5 2 11 2 8C2 5 4 2.5 6.5 2C6 3 5.5 4.5 6 6.5C6.5 8.5 8 10 10 10.5C11.5 11 13 10.5 14 10V8.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}
