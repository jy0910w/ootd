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
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left: editorial image panel */}
      <div className="relative overflow-hidden hidden lg:block">
        <img
          src="https://placehold.co/900x1080/1a1a1a/00D4AA?text=."
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/30 via-brand-500/10 to-brand-500/5" />
        <div className="absolute bottom-12 left-10 right-10">
          <p className="text-6xl font-light leading-none text-white/90 italic tracking-tight">
            Your wardrobe,<br />curated.
          </p>
          <p className="mt-4 text-xs tracking-widest text-white/40 uppercase">
            Outfit of the Day Platform
          </p>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center p-8 lg:p-16 bg-white dark:bg-gray-950">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <p className="text-3xl font-light text-gray-900 dark:text-white mb-2 lg:hidden tracking-tight">
            OOTD
          </p>
          <p className="text-xs tracking-widest text-gray-500 dark:text-gray-400 uppercase mb-12 lg:hidden">
            Outfit of the Day
          </p>

          {/* Session expired notice */}
          {reason === "session_expired" && (
            <div className="mb-6 p-3 rounded-lg text-xs bg-accent-400/10 border border-accent-400/25 text-accent-500 dark:text-accent-300">
              登入已過期,請重新登入
            </div>
          )}

          <h1 className="text-4xl font-light text-gray-900 dark:text-white mb-1 tracking-tight">
            {mode === "login" ? "歡迎回來" : "建立帳號"}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 tracking-wide mb-10">
            {mode === "login" ? "登入你的衣櫃" : "加入 OOTD 平台"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs tracking-widest text-gray-500 dark:text-gray-400 uppercase mb-2">
                電子信箱
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="field h-12 px-4 rounded-lg text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs tracking-widest text-gray-500 dark:text-gray-400 uppercase mb-2">
                密碼
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="field h-12 px-4 rounded-lg text-sm"
                required
              />
            </div>

            {mode === "register" && (
              <div>
                <label className="block text-xs tracking-widest text-gray-500 dark:text-gray-400 uppercase mb-2">
                  顯示名稱
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="你的名字"
                  className="field h-12 px-4 rounded-lg text-sm"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full h-12 rounded-lg text-xs tracking-widest uppercase mt-2"
            >
              {submitting ? "送出中..." : mode === "login" ? "登入" : "註冊"}
            </button>
          </form>

          {errorMessage && (
            <div className="mt-4 p-3 rounded-lg text-xs bg-red-500/10 border border-red-500/30 text-red-500 dark:text-red-400">
              {errorMessage}
            </div>
          )}

          <div className="mt-8 pt-8 flex items-center justify-between border-t border-gray-200 dark:border-gray-800">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {mode === "login" ? "還沒有帳號？" : "已有帳號？"}
            </p>
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="text-xs text-brand-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors duration-200 tracking-wide focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 rounded px-1"
            >
              {mode === "login" ? "立即註冊" : "返回登入"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
