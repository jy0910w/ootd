"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminNav } from "@/components/admin-nav";
import { RequireAdmin } from "@/components/require-admin";
import { api, AdminUser } from "@/lib/api";
import { AdminSessionState } from "@/lib/session";

export default function UsersPage() {
  return (
    <RequireAdmin allowModerator={false}>
      {(session) => <UsersContent session={session} />}
    </RequireAdmin>
  );
}

function UsersContent({ session }: { session: AdminSessionState }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const result = await api.getUsers(session.accessToken);
      setUsers(result.items);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "載入使用者失敗");
    } finally {
      setLoading(false);
    }
  }, [session.accessToken]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) {
      return users;
    }

    return users.filter(
      (user) =>
        user.email.toLowerCase().includes(normalized) ||
        user.displayName.toLowerCase().includes(normalized) ||
        user.role.toLowerCase().includes(normalized)
    );
  }, [keyword, users]);

  async function handleToggleBan(user: AdminUser) {
    setErrorMessage("");
    setSuccessMessage("");
    try {
      if (user.status === "banned") {
        await api.unbanUser(session.accessToken, user.id);
        setSuccessMessage(`已解封 ${user.displayName}`);
      } else {
        await api.banUser(session.accessToken, user.id);
        setSuccessMessage(`已封禁 ${user.displayName}`);
      }
      await loadUsers();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "更新使用者狀態失敗");
    }
  }

  return (
    <main>
      <AdminNav session={session} />

      <section className="card">
        <h2>使用者管理</h2>
        <p>僅 admin 可進行封禁與解封操作。</p>

        <div className="row" style={{ marginBottom: 12 }}>
          <input
            placeholder="搜尋 email / displayName / role"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <button className="subtle" type="button" onClick={() => void loadUsers()}>
            重新載入
          </button>
        </div>

        <ul className="list">
          {filteredUsers.map((user) => (
            <li className="item" key={user.id}>
              <strong>{user.displayName}</strong>
              <div className="muted">email: {user.email}</div>
              <div className="muted">role: {user.role} / status: {user.status}</div>
              <div className="muted">createdAt: {new Date(user.createdAt).toLocaleString()}</div>
              <div className="row" style={{ marginTop: 8 }}>
                <button
                  className={user.status === "banned" ? "subtle" : "danger"}
                  type="button"
                  onClick={() => void handleToggleBan(user)}
                >
                  {user.status === "banned" ? "Unban" : "Ban"}
                </button>
              </div>
            </li>
          ))}
          {!loading && filteredUsers.length === 0 ? <li className="item muted">查無符合條件的使用者。</li> : null}
        </ul>
      </section>

      {successMessage ? <div className="message">{successMessage}</div> : null}
      {errorMessage ? <div className="message error">{errorMessage}</div> : null}
    </main>
  );
}
