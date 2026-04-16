"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getSession, saveSession } from "@/lib/session";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("Admin123!");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (session?.accessToken) {
      router.replace("/dashboard");
    }
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    try {
      const result = await api.login(email, password);
      if (!result.user.role || !["admin", "moderator"].includes(result.user.role)) {
        throw new Error("需要 admin 或 moderator 角色才能進入後台");
      }

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
      router.push("/dashboard");
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
          <h1>OOTD Admin</h1>
          <p>登入後台以管理審核流程、使用者狀態與營運指標。</p>
        </div>
        <span className="pill">API Base: {process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5282/api/v1"}</span>
      </section>

      <section className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
        <h2>管理者登入</h2>
        <p>僅 `admin` 與 `moderator` 角色可進入。</p>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} required type="email" />
          </label>

          <label>
            Password
            <input value={password} onChange={(event) => setPassword(event.target.value)} required type="password" />
          </label>

          <button type="submit" disabled={submitting}>
            {submitting ? "登入中..." : "Login"}
          </button>
        </form>

        {errorMessage ? <div className="message error">{errorMessage}</div> : null}
      </section>
    </main>
  );
}
