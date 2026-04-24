"use client";

import { createContext, ReactNode, useContext, useState, useCallback, useEffect, useRef } from "react";

type ToastType = "success" | "error" | "warning" | "info";

type Toast = {
  id: string;
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isClient, setIsClient] = useState(false);
  const toastCounterRef = useRef(0);

  // 確保只在客戶端渲染 Toast
  useEffect(() => {
    setIsClient(true);
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = `toast-${++toastCounterRef.current}`;
    const newToast: Toast = { id, message, type };

    setToasts((prev) => {
      // 最多同時顯示 3 個 toast
      const updated = [...prev, newToast];
      return updated.slice(-3);
    });

    // 3 秒後自動移除
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      {isClient && <ToastContainer toasts={toasts} onRemove={removeToast} />}
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none"
      style={{ maxWidth: "420px" }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const borderColors = {
    success: "#2f7a56",
    error: "#e07b77",
    warning: "#d4a574",
    info: "#7bbfa0"
  };

  const icons = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ"
  };

  return (
    <div
      className="toast pointer-events-auto animate-slide-in-right"
      style={{
        background: "rgba(22,22,19,0.95)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(245,240,235,0.12)",
        borderLeft: `3px solid ${borderColors[toast.type]}`,
        borderRadius: "12px",
        padding: "1rem 1.25rem",
        boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem"
      }}
    >
      <span
        className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
        style={{
          background: `${borderColors[toast.type]}20`,
          color: borderColors[toast.type]
        }}
      >
        {icons[toast.type]}
      </span>
      <p className="flex-1 text-sm text-cream leading-relaxed">{toast.message}</p>
      <button
        type="button"
        onClick={() => onRemove(toast.id)}
        className="shrink-0 w-5 h-5 rounded flex items-center justify-center text-cream opacity-30 hover:opacity-60 transition-opacity"
        aria-label="關閉"
      >
        ✕
      </button>
    </div>
  );
}
