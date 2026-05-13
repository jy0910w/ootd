"use client";

import { useEffect, useRef, useState } from "react";
import { api, AuthResult } from "@/lib/api";
import { clearSession, getSession, saveSession, SessionState } from "@/lib/session";
import { X, LogIn } from "lucide-react";
import { MvpNav } from "@/components/mvp-nav";
import { CreateOutfitTab } from "./components/CreateOutfitTab";
import { RecommendFromItemTab } from "./components/RecommendFromItemTab";

type Tab = "create" | "recommend";
type LoginReason = "create-outfit" | "recommend-item";

// ─── Login Modal ──────────────────────────────────────────────────────────────

function LoginModal({
  reason,
  onClose,
  onSuccess
}: {
  reason: LoginReason;
  onClose: () => void;
  onSuccess: (result: AuthResult) => void;
}) {
  const [email, setEmail] = useState("jyunyu@example.com");
  const [password, setPassword] = useState("ghjk1591");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await api.login(email, password);
      onSuccess(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "登入失敗，請確認帳號密碼");
    } finally {
      setLoading(false);
    }
  }

  const reasonText = reason === "create-outfit" ? "需要帳號才能上傳" : "需要帳號繼續使用";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-lg">
      <div className="relative w-full max-w-sm rounded-2xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl">
        {/* Top accent */}
        <div className="h-0.5 bg-gradient-to-r from-transparent via-brand-500 to-transparent" />

        <div className="p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-xs tracking-widest text-gray-500 dark:text-gray-400 uppercase mb-1">
                {reasonText}
              </p>
              <h2 className="font-sans text-2xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
                登入繼續
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
            <div>
              <label className="block text-xs tracking-widest text-gray-500 dark:text-gray-400 uppercase mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoFocus
                required
                className="field h-11 px-4 rounded-lg text-sm w-full"
              />
            </div>
            <div>
              <label className="block text-xs tracking-widest text-gray-500 dark:text-gray-400 uppercase mb-1.5">
                密碼
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="field h-11 px-4 rounded-lg text-sm w-full"
              />
            </div>

            {error && (
              <p className="text-xs px-3 py-2 rounded bg-error-bg text-error border border-error/30">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full h-11 rounded-lg text-xs tracking-widest uppercase flex items-center justify-center gap-2 mt-2"
            >
              <LogIn size={13} />
              {loading ? "登入中..." : "登入"}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              還沒有帳號？
              <button
                type="button"
                onClick={() => {
                  window.location.href = "/login?mode=register";
                }}
                className="ml-1 underline text-brand-500 hover:text-brand-600 transition-colors"
              >
                免費註冊
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function GetStartedPage() {
  const [activeTab, setActiveTab] = useState<Tab>("create");
  const [loginModal, setLoginModal] = useState<LoginReason | null>(null);
  const [session, setSession] = useState<SessionState | null>(null);
  const loginReasonRef = useRef<LoginReason | null>(null);

  useEffect(() => {
    setSession(getSession());
  }, []);

  function openLogin(reason: LoginReason) {
    loginReasonRef.current = reason;
    setLoginModal(reason);
  }

  function handleLoginSuccess(result: AuthResult) {
    const s: SessionState = {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: {
        id: result.user.id,
        email: result.user.email,
        displayName: result.user.displayName,
        role: result.user.role
      }
    };
    saveSession(s);
    setSession(s);
    loginReasonRef.current = null;
    setLoginModal(null);
  }

  function handleLogout() {
    clearSession();
    setSession(null);
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <MvpNav session={session} />

      {/* Content */}
      <div className="pt-14">
        <div className="max-w-screen-xl mx-auto px-4 md:px-8 lg:px-10">
          {/* Hero headline */}
          <div className="pt-12 pb-8 text-center">
            <p className="text-xs tracking-widest text-gray-400 dark:text-gray-500 uppercase mb-4">
              AI Outfit Assistant
            </p>
            <h1
              className="font-sans font-light text-gray-900 dark:text-gray-100"
              style={{
                fontSize: "clamp(2.5rem,6vw,4.5rem)",
                lineHeight: 0.95,
                letterSpacing: "-0.04em"
              }}
            >
              開始你的
              <br />
              <span className="italic text-brand-400">穿搭之旅</span>
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto mt-5 leading-relaxed">
              上傳穿搭照建立個人衣櫃，或上傳單品照取得 AI 穿搭推薦。
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex justify-center mb-8">
            <div className="flex rounded-full p-1 bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              {[
                { id: "create" as Tab, label: "建立穿搭" },
                { id: "recommend" as Tab, label: "穿搭推薦" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`h-9 px-6 rounded-full text-xs tracking-widest uppercase transition-all ${
                    activeTab === tab.id
                      ? "bg-brand-500 text-white shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="pb-20">
            {activeTab === "create" ? (
              <CreateOutfitTab session={session} onNeedLogin={(r) => openLogin(r)} />
            ) : (
              <RecommendFromItemTab session={session} onNeedLogin={(r) => openLogin(r)} />
            )}
          </div>
        </div>
      </div>

      {/* Login Modal */}
      {loginModal && (
        <LoginModal
          reason={loginModal}
          onClose={() => setLoginModal(null)}
          onSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
}
