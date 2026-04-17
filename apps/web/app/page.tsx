"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, VisualRecommendationResponse, AuthResult } from "@/lib/api";
import { clearSession, getSession, saveSession, SessionState } from "@/lib/session";
import { Upload, Sparkles, X, ChevronRight, LogIn, LogOut, User } from "lucide-react";

const FREE_USAGE_KEY = "ootd_visual_uses";
const FREE_USAGE_LIMIT = 3;

function getUsageCount(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(FREE_USAGE_KEY) ?? "0", 10);
}
function incrementUsage(): number {
  const next = getUsageCount() + 1;
  localStorage.setItem(FREE_USAGE_KEY, String(next));
  return next;
}

type Tab = "recommend" | "upload";
type LoginReason = "recommend" | "upload";

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background: "#141412",
          border: "1px solid rgba(245,240,235,0.1)",
          boxShadow: "0 40px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(47,122,86,0.15)"
        }}
      >
        {/* Top accent */}
        <div style={{ height: 2, background: "linear-gradient(90deg, transparent, #2f7a56, transparent)" }} />

        <div className="p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-xs tracking-widest text-cream opacity-30 uppercase mb-1">
                {reason === "upload" ? "需要帳號才能上傳" : "免費次數已用完"}
              </p>
              <h2 className="font-display text-2xl font-light text-cream" style={{ letterSpacing: "-0.03em" }}>
                登入繼續
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-cream opacity-20 hover:opacity-50 transition-opacity"
            >
              <X size={14} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
            <div>
              <label className="block text-xs tracking-widest text-cream opacity-30 uppercase mb-1.5">Email</label>
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
              <label className="block text-xs tracking-widest text-cream opacity-30 uppercase mb-1.5">密碼</label>
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
              <p className="text-xs px-3 py-2 rounded" style={{ color: "#e07b77", background: "rgba(182,59,54,0.12)", border: "1px solid rgba(182,59,54,0.25)" }}>
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

          <div className="mt-5 pt-5 border-t hairline text-center">
            <p className="text-xs text-cream opacity-30">
              還沒有帳號？
              <button
                type="button"
                onClick={() => { window.location.href = "/login?mode=register"; }}
                className="ml-1 underline opacity-60 hover:opacity-90 transition-opacity"
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

// ─── Recommend Tab ────────────────────────────────────────────────────────────

function RecommendTab({
  onNeedLogin
}: {
  onNeedLogin: (reason: LoginReason) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VisualRecommendationResponse | null>(null);
  const [error, setError] = useState("");
  const [usageCount, setUsageCount] = useState(getUsageCount);

  function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const count = getUsageCount();
    if (count >= FREE_USAGE_LIMIT) {
      onNeedLogin("recommend");
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
    setResult(null);
    setError("");
  }

  function clearFile() {
    setPreviewUrl(null);
    setSelectedFile(null);
    setResult(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleAnalyze() {
    if (!selectedFile) return;
    const count = getUsageCount();
    if (count >= FREE_USAGE_LIMIT) {
      onNeedLogin("recommend");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await api.visualRecommend(selectedFile);
      setResult(data);
      const next = incrementUsage();
      setUsageCount(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "分析失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  }

  const remaining = Math.max(0, FREE_USAGE_LIMIT - usageCount);

  return (
    <div className="max-w-2xl mx-auto">
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "rgba(22,22,19,0.9)", border: "1px solid rgba(245,240,235,0.07)" }}
      >
        <div className="p-6 md:p-8">

          {/* Usage indicator */}
          <div className="flex items-center justify-between mb-5">
            <p className="text-xs tracking-widest text-cream opacity-30 uppercase">上傳穿搭照</p>
            <div className="flex items-center gap-2">
              {Array.from({ length: FREE_USAGE_LIMIT }).map((_, i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full transition-colors"
                  style={{ background: i < usageCount ? "rgba(245,240,235,0.12)" : "#2f7a56" }}
                />
              ))}
              <span className="text-xs text-cream opacity-25 ml-1">剩餘 {remaining} 次</span>
            </div>
          </div>

          {/* Drop zone */}
          <label
            className={`block rounded-xl cursor-pointer transition-all ${previewUrl ? "" : "p-14 text-center"}`}
            style={previewUrl ? {} : {
              border: "1px dashed rgba(245,240,235,0.12)",
              background: "rgba(245,240,235,0.015)"
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            {previewUrl ? (
              <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "4/5", maxHeight: 380 }}>
                <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(13,13,11,0.5) 0%, transparent 55%)" }} />
                <button
                  type="button"
                  className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(13,13,11,0.6)", border: "1px solid rgba(245,240,235,0.12)" }}
                  onClick={(e) => { e.preventDefault(); clearFile(); }}
                >
                  <X size={13} className="text-cream" />
                </button>
              </div>
            ) : (
              <>
                <Upload size={30} className="mx-auto mb-4 text-cream opacity-15" />
                <p className="text-sm text-cream opacity-35 mb-1">拖曳或點擊上傳穿搭照</p>
                <p className="text-xs text-cream opacity-20">JPG · PNG · WEBP · 最大 10 MB</p>
              </>
            )}
          </label>

          {/* Error */}
          {error && (
            <div className="mt-3 p-3 rounded-lg text-xs" style={{ background: "rgba(182,59,54,0.1)", border: "1px solid rgba(182,59,54,0.25)", color: "#e07b77" }}>
              {error}
            </div>
          )}

          {/* CTA */}
          <button
            type="button"
            disabled={!selectedFile || loading}
            onClick={() => void handleAnalyze()}
            className="btn-primary w-full h-12 rounded-xl mt-4 text-sm tracking-widest uppercase flex items-center justify-center gap-2 disabled:opacity-25 disabled:cursor-not-allowed transition-opacity"
          >
            <Sparkles size={14} />
            {loading ? "AI 分析中..." : "立即分析"}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="border-t hairline p-6 md:p-8">
            {/* Analysis summary */}
            <div
              className="mb-6 p-4 rounded-xl"
              style={{ background: "rgba(47,122,86,0.07)", border: "1px solid rgba(47,122,86,0.15)" }}
            >
              <p className="text-xs tracking-widest uppercase mb-3" style={{ color: "#7bbfa0" }}>AI 分析結果</p>
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="tag-pill px-3 py-1 rounded-full text-xs">{result.analysis.occasion}</span>
                <span className="tag-pill px-3 py-1 rounded-full text-xs">{result.analysis.season}</span>
                {result.analysis.styleHints.map((h) => (
                  <span key={h} className="tag-pill px-3 py-1 rounded-full text-xs">{h}</span>
                ))}
              </div>
              <p className="text-xs text-cream opacity-25">{result.analysis.colorPalette}</p>
            </div>

            {/* Recommendation list */}
            <p className="text-xs tracking-widest text-cream opacity-25 uppercase mb-4">
              推薦穿搭（{result.results.length} 套）
            </p>

            {result.results.length === 0 ? (
              <div className="text-center py-10">
                <p className="font-display text-2xl font-light text-cream opacity-15 mb-2" style={{ fontStyle: "italic" }}>尚無推薦</p>
                <p className="text-xs text-cream opacity-20">資料庫暫無符合的穿搭，歡迎上傳你的穿搭！</p>
              </div>
            ) : (
              <div className="space-y-2">
                {result.results.map((r, i) => (
                  <div
                    key={r.outfitId}
                    className="flex items-center gap-4 p-3 rounded-xl"
                    style={{ background: "rgba(245,240,235,0.025)", border: "1px solid rgba(245,240,235,0.05)" }}
                  >
                    <span
                      className="font-display font-light text-cream shrink-0"
                      style={{ fontSize: 28, lineHeight: 1, opacity: 0.1, width: 40, textAlign: "right" }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-cream opacity-45 leading-relaxed truncate">
                        {r.reasons.join("、") || "AI 智慧推薦"}
                      </p>
                      <p className="text-xs text-cream opacity-20 mt-0.5">相符度 {Math.round(r.score * 100)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Upload Tab (需登入) ───────────────────────────────────────────────────────

function UploadTab({ onNeedLogin }: { onNeedLogin: (reason: LoginReason) => void }) {
  return (
    <div className="max-w-2xl mx-auto">
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "rgba(22,22,19,0.9)", border: "1px solid rgba(245,240,235,0.07)" }}
      >
        <div className="p-6 md:p-8">
          <p className="text-xs tracking-widest text-cream opacity-30 uppercase mb-5">上傳你的穿搭</p>

          {/* Drop zone — clicking triggers login */}
          <div
            className="p-14 text-center rounded-xl cursor-pointer transition-all hover:border-opacity-30"
            style={{
              border: "1px dashed rgba(245,240,235,0.12)",
              background: "rgba(245,240,235,0.015)"
            }}
            onClick={() => onNeedLogin("upload")}
          >
            <Upload size={30} className="mx-auto mb-4 text-cream opacity-15" />
            <p className="text-sm text-cream opacity-35 mb-1">上傳穿搭照，AI 自動識別單品</p>
            <p className="text-xs text-cream opacity-20">需要登入才能使用</p>
          </div>

          <button
            type="button"
            onClick={() => onNeedLogin("upload")}
            className="btn-primary w-full h-12 rounded-xl mt-4 text-sm tracking-widest uppercase flex items-center justify-center gap-2"
          >
            <LogIn size={14} />
            登入以開始上傳
          </button>
        </div>

        {/* Feature preview */}
        <div className="border-t hairline p-6 md:p-8">
          <p className="text-xs tracking-widest text-cream opacity-25 uppercase mb-4">登入後可以</p>
          <div className="space-y-3">
            {[
              { n: "01", t: "AI 識別單品", d: "上傳穿搭照，Gemini AI 自動識別所有服裝單品" },
              { n: "02", t: "確認並編輯", d: "檢查 AI 識別結果，可修改名稱、類別、顏色" },
              { n: "03", t: "建立穿搭記錄", d: "儲存到個人衣櫃，累積穿搭資料庫" }
            ].map((f) => (
              <div
                key={f.n}
                className="flex items-start gap-4 p-3 rounded-xl"
                style={{ background: "rgba(245,240,235,0.02)" }}
              >
                <span className="font-display font-light text-cream shrink-0 mt-0.5" style={{ fontSize: 20, opacity: 0.1, lineHeight: 1 }}>{f.n}</span>
                <div>
                  <p className="text-xs text-cream font-medium mb-0.5">{f.t}</p>
                  <p className="text-xs text-cream opacity-30 leading-relaxed">{f.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("recommend");
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
    const reason = loginReasonRef.current;
    loginReasonRef.current = null;
    setLoginModal(null);

    if (reason === "upload") {
      router.push("/outfits/new");
    }
    // For "recommend" — just close, they can now use unlimited
  }

  function handleLogout() {
    clearSession();
    setSession(null);
  }

  return (
    <div className="min-h-screen" style={{ background: "#0d0d0b" }}>

      {/* Nav */}
      <nav
        className="fixed top-0 left-0 right-0 z-40 border-b hairline"
        style={{ background: "rgba(13,13,11,0.88)", backdropFilter: "blur(16px)" }}
      >
        <div className="max-w-screen-xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
          <span
            className="font-display text-xl font-light text-cream"
            style={{ letterSpacing: "-0.02em" }}
          >
            OOTD
          </span>
          {session ? (
            <div className="flex items-center gap-3">
              <span className="hidden sm:flex items-center gap-1.5 text-xs text-cream opacity-40">
                <User size={11} />
                {session.user.displayName || session.user.email}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="btn-ghost h-8 px-4 rounded text-xs tracking-widest uppercase flex items-center gap-1.5"
              >
                <LogOut size={12} />
                登出
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="btn-ghost h-8 px-4 rounded text-xs tracking-widest uppercase flex items-center gap-1.5"
            >
              <LogIn size={12} />
              登入
            </button>
          )}
        </div>
      </nav>

      {/* Content */}
      <div className="pt-14">
        <div className="max-w-screen-xl mx-auto px-4 md:px-8 lg:px-10">

          {/* Hero headline */}
          <div className="pt-12 pb-8 text-center">
            <p className="text-xs tracking-widest text-cream opacity-25 uppercase mb-4">AI Outfit Stylist</p>
            <h1
              className="font-display font-light text-cream"
              style={{ fontSize: "clamp(3rem,8vw,6rem)", lineHeight: 0.92, letterSpacing: "-0.045em" }}
            >
              穿搭智慧<br />
              <span style={{ fontStyle: "italic", color: "#7bbfa0" }}>由 AI 驅動</span>
            </h1>
            <p className="text-sm text-cream opacity-35 max-w-sm mx-auto mt-5 leading-relaxed">
              上傳你的穿搭照，AI 立即分析風格並推薦最適合的穿搭。
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex justify-center mb-8">
            <div
              className="flex rounded-full p-1"
              style={{ background: "rgba(245,240,235,0.05)", border: "1px solid rgba(245,240,235,0.08)" }}
            >
              {([ 
                { id: "recommend" as Tab, label: "穿搭推薦" },
                { id: "upload" as Tab, label: "穿搭上傳" }
              ]).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className="h-9 px-6 rounded-full text-xs tracking-widest uppercase transition-all"
                  style={activeTab === tab.id ? {
                    background: "#2f7a56",
                    color: "#f5f0eb"
                  } : {
                    color: "rgba(245,240,235,0.35)"
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="pb-20">
            {activeTab === "recommend" ? (
              <RecommendTab onNeedLogin={(r) => openLogin(r)} />
            ) : (
              <UploadTab onNeedLogin={(r) => openLogin(r)} />
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
