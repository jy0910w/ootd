"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, AdminSessionState, clearSession } from "@/lib/session";

type RequireAdminProps = {
  children: (session: AdminSessionState) => ReactNode;
  allowModerator?: boolean;
};

export function RequireAdmin({ children, allowModerator = true }: RequireAdminProps) {
  const router = useRouter();
  const [session, setSession] = useState<AdminSessionState | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const current = getSession();
    if (!current?.accessToken) {
      router.replace("/login");
      return;
    }

    const allowedRoles = allowModerator ? ["admin", "moderator"] : ["admin"];
    if (!allowedRoles.includes(current.user.role)) {
      clearSession();
      router.replace("/login");
      return;
    }

    setSession(current);
    setChecking(false);
  }, [allowModerator, router]);

  if (checking || !session) {
    return (
      <main>
        <section className="card">
          <h2>載入中</h2>
          <p>正在確認管理權限...</p>
        </section>
      </main>
    );
  }

  return <>{children(session)}</>;
}
