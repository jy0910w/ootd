"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { getSession, SessionState } from "@/lib/session";

type RequireAuthProps = {
  children: (session: SessionState) => ReactNode;
};

export function RequireAuth({ children }: RequireAuthProps) {
  const router = useRouter();
  const [session, setSession] = useState<SessionState | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const current = getSession();
    if (!current?.accessToken) {
      router.replace("/login");
      return;
    }

    setSession(current);
    setChecking(false);
  }, [router]);

  if (checking || !session) {
    return (
      <main>
        <section className="card">
          <h2>載入中</h2>
          <p>正在確認登入狀態...</p>
        </section>
      </main>
    );
  }

  return <>{children(session)}</>;
}
