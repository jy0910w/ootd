"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSession, AdminSessionState } from "@/lib/session";

type AdminNavProps = {
  session: AdminSessionState;
};

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/moderation", label: "Moderation" },
  { href: "/users", label: "Users" }
] as const;

export function AdminNav({ session }: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    clearSession();
    router.replace("/login");
  }

  return (
    <header className="app-header">
      <div className="app-header-top">
        <div>
          <h1>OOTD Admin</h1>
          <p>
            {session.user.displayName} ({session.user.role})
          </p>
        </div>
        <button className="subtle" type="button" onClick={handleLogout}>
          登出
        </button>
      </div>
      <nav className="app-nav">
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link key={link.href} href={link.href} className={active ? "nav-link active" : "nav-link"}>
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
