"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminNav } from "@/components/admin-nav";
import { RequireAdmin } from "@/components/require-admin";
import { api } from "@/lib/api";
import { AdminSessionState } from "@/lib/session";

export default function DashboardPage() {
  return <RequireAdmin>{(session) => <DashboardContent session={session} />}</RequireAdmin>;
}

function DashboardContent({ session }: { session: AdminSessionState }) {
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [bannedUsers, setBannedUsers] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const loadSnapshot = useCallback(async () => {
    setErrorMessage("");
    try {
      const pending = await api.getModerationOutfits(session.accessToken, "pending");
      setPendingCount(pending.total);

      if (session.user.role === "admin") {
        const users = await api.getUsers(session.accessToken);
        setTotalUsers(users.total);
        setBannedUsers(users.items.filter((user) => user.status === "banned").length);
      } else {
        setTotalUsers(null);
        setBannedUsers(null);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "載入儀表板失敗");
    }
  }, [session.accessToken, session.user.role]);

  useEffect(() => {
    void loadSnapshot();
  }, [loadSnapshot]);

  return (
    <main>
      <AdminNav session={session} />

      <section className="card">
        <h2>營運儀表板</h2>
        <p>目前為 MVP 版本，先顯示審核與使用者管理關鍵數字。</p>
        <div className="kpi-grid">
          <div className="kpi">
            <div className="kpi-label">待審核穿搭</div>
            <div className="kpi-value">{pendingCount ?? "-"}</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">使用者總數</div>
            <div className="kpi-value">{totalUsers ?? (session.user.role === "admin" ? "-" : "N/A")}</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">封禁使用者</div>
            <div className="kpi-value">{bannedUsers ?? (session.user.role === "admin" ? "-" : "N/A")}</div>
          </div>
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <button className="subtle" type="button" onClick={() => void loadSnapshot()}>
            重新載入
          </button>
        </div>
      </section>

      {errorMessage ? <div className="message error">{errorMessage}</div> : null}
    </main>
  );
}
