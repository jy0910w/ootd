"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getSession, saveSession } from "@/lib/session";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("user@example.com");
  const [password, setPassword] = useState("P@ssw0rd123");
  const [displayName, setDisplayName] = useState("Ariel");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (session?.accessToken) {
      router.replace("/wardrobe");
    }
  }, [router]);

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

      router.push("/wardrobe");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "登入失敗");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      <section className="hero">
        <div>
          <h1>OOTD Web MVP</h1>
          <p>先登入，再開始管理衣櫥、建立穿搭與查詢推薦。</p>
        </div>
        <span className="pill">API Base: {process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5050/api/v1"}</span>
      </section>

      <section className="card login-card">
        <h2>{mode === "login" ? "登入" : "註冊"}</h2>
        <p>Auth 使用 `/auth/login` 與 `/auth/register`。</p>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} required type="email" />
          </label>

          <label>
            Password
            <input value={password} onChange={(event) => setPassword(event.target.value)} required type="password" />
          </label>

          {mode === "register" ? (
            <label>
              Display Name
              <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
            </label>
          ) : null}

          <button type="submit" disabled={submitting}>
            {submitting ? "送出中..." : mode === "login" ? "Login" : "Register"}
          </button>
        </form>

        <div className="row" style={{ marginTop: 10 }}>
          <button className="subtle" onClick={() => setMode(mode === "login" ? "register" : "login")} type="button">
            切換到 {mode === "login" ? "註冊" : "登入"}
          </button>
        </div>

        {errorMessage ? <div className="message error">{errorMessage}</div> : null}
      </section>
    </main>
  );
}
