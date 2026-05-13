"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSession, SessionState } from "@/lib/session";
import { ThemeToggle } from "./theme-toggle";

type AppNavProps = {
  session: SessionState | null;
};

const LINKS = [
  { href: "/outfits", label: "穿搭" },
  { href: "/recommendations", label: "推薦" },
  { href: "/wardrobe", label: "衣櫃" }
] as const;

export function MvpNav({ session }: AppNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    clearSession();
    router.replace("/login");
  }

  const initials = session?.user.displayName?.charAt(0)?.toUpperCase() ?? "U";

  function getAuthHref(target: string) {
    return `/login?returnUrl=${encodeURIComponent(target)}`;
  }

  return (
    <nav
      className="fixed top-0 inset-x-0 z-50 px-6 md:px-10 border-b"
      style={{
        backgroundColor: 'var(--bg-elevated)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderColor: 'var(--border-subtle)',
        opacity: 0.95
      }}
    >
      <div className="max-w-screen-xl mx-auto flex items-center justify-between h-14">
        {/* Logo */}
        <Link
          href="/"
          className="font-sans text-xl font-semibold tracking-tight hover:text-brand-500 transition-colors duration-200"
          style={{ color: 'var(--text-primary)' }}
        >
          OOTD
        </Link>

        {/* Links */}
        <div className="flex items-center gap-8">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={session ? link.href : getAuthHref(link.href)}
              className={`nav-link${pathname === link.href || pathname.startsWith(link.href + "/") ? " active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Theme Toggle & Avatar */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {session ? (
            <button
              type="button"
              onClick={handleLogout}
              title={`${session.user.displayName} — 登出`}
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs bg-brand-100 text-brand-700 hover:bg-brand-200 transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 focus-visible:outline-offset-2 dark:bg-brand-500/20 dark:text-brand-400 dark:hover:bg-brand-500/30"
            >
              {initials}
            </button>
          ) : (
            <Link
              href={getAuthHref(pathname || "/")}
              className="btn-primary h-9 px-5 rounded-lg text-xs tracking-widest uppercase"
            >
              登入
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
