"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { getSession, saveSession } from "@/lib/session";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("jyunyu@example.com");
  const [password, setPassword] = useState("ghjk1591");
  const [displayName, setDisplayName] = useState("Ariel");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Get returnUrl and reason from query params
  const returnUrl = searchParams.get("returnUrl");
  const reason = searchParams.get("reason");

  useEffect(() => {
    const session = getSession();
    if (session?.accessToken) {
      // If already logged in, redirect to returnUrl or default to wardrobe
      const destination = returnUrl && returnUrl.startsWith("/") ? returnUrl : "/wardrobe";
      router.replace(destination);
    }
  }, [router, returnUrl]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    try {
      const result =
        mode === "login"
          ? await api.login(email, password)
          : await api.register(email, password, displayName);

      saveSession({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: {
          id: result.user.id,
          email: result.user.email,
          displayName: result.user.displayName,
          role: result.user.role
        }
      });

      // Redirect to returnUrl (with XSS protection) or default to wardrobe
      const destination = returnUrl && returnUrl.startsWith("/") ? returnUrl : "/wardrobe";
      router.push(destination);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "登入失敗");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      {/* Left: editorial image panel */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <img
          src="https://placehold.co/900x1080/1a1a17/2f7a56?text=."
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, rgba(13,13,11,0.3) 0%, rgba(47,122,86,0.15) 100%)" }}
        />
        <div className="absolute bottom-12 left-10 right-10">
          <p
            className="font-display text-6xl font-light leading-none text-cream opacity-90"
            style={{ fontStyle: "italic", letterSpacing: "-0.04em" }}
          >
            Your wardrobe,<br />curated.
          </p>
          <p className="mt-4 text-xs tracking-widest text-cream opacity-40 uppercase">
            Outfit of the Day Platform
          </p>
        </div>
      </div>

      {/* Right: form */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem' }}>
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <p
            className="font-display text-3xl font-light text-cream mb-2 lg:hidden"
            style={{ letterSpacing: "-0.04em" }}
          >
            OOTD
          </p>
          <p className="text-xs tracking-widest text-cream opacity-30 uppercase mb-12 lg:hidden">
            Outfit of the Day
          </p>

          {/* Session expired notice */}
          {reason === "session_expired" && (
            <div
              className="mb-6 p-3 rounded text-xs"
              style={{ background: "rgba(255,184,0,0.1)", border: "1px solid rgba(255,184,0,0.25)", color: "#ffb800" }}
            >
              登入已過期,請重新登入
            </div>
          )}

          <h1
            className="font-display text-4xl font-light text-cream mb-1"
            style={{ letterSpacing: "-0.03em" }}
          >
            {mode === "login" ? "歡迎回來" : "建立帳號"}
          </h1>
          <p className="text-xs text-cream opacity-40 tracking-wide mb-10">
            {mode === "login" ? "登入你的衣櫃" : "加入 OOTD 平台"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs tracking-widest text-cream opacity-40 uppercase mb-2">
                電子信箱
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="field h-12 px-4 rounded text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs tracking-widest text-cream opacity-40 uppercase mb-2">
                密碼
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="field h-12 px-4 rounded text-sm"
                required
              />
            </div>

            {mode === "register" && (
              <div>
                <label className="block text-xs tracking-widest text-cream opacity-40 uppercase mb-2">
                  顯示名稱
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="你的名字"
                  className="field h-12 px-4 rounded text-sm"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full h-12 rounded text-xs tracking-widest uppercase mt-2"
            >
              {submitting ? "送出中..." : mode === "login" ? "登入" : "註冊"}
            </button>
          </form>

          {errorMessage && (
            <div
              className="mt-4 p-3 rounded text-xs"
              style={{ background: "rgba(182,59,54,0.12)", border: "1px solid rgba(182,59,54,0.3)", color: "#e07b77" }}
            >
              {errorMessage}
            </div>
          )}

          <div className="mt-8 pt-8 flex items-center justify-between" style={{ borderTop: "1px solid rgba(245,240,235,0.08)" }}>
            <p className="text-xs text-cream opacity-30">
              {mode === "login" ? "還沒有帳號？" : "已有帳號？"}
            </p>
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="text-xs text-brand-400 hover:text-brand-300 transition-colors duration-200 tracking-wide focus-visible:outline focus-visible:outline-1 focus-visible:outline-brand-400 rounded"
            >
              {mode === "login" ? "立即註冊" : "返回登入"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
