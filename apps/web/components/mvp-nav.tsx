"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSession, SessionState } from "@/lib/session";

type AppNavProps = {
  session: SessionState;
};

const LINKS = [
  { href: "/wardrobe", label: "衣櫃" },
  { href: "/outfits", label: "穿搭" },
  { href: "/recommendations", label: "推薦" }
] as const;

export function MvpNav({ session }: AppNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    clearSession();
    router.replace("/login");
  }

  const initials = session.user.displayName?.charAt(0)?.toUpperCase() ?? "U";

  return (
    <nav
      className="fixed top-0 inset-x-0 z-50 px-6 md:px-10"
      style={{
        background: "rgba(13,13,11,0.9)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(245,240,235,0.06)"
      }}
    >
      <div className="max-w-screen-xl mx-auto flex items-center justify-between h-14">
        {/* Logo */}
        <Link
          href="/wardrobe"
          className="font-display text-xl font-light tracking-tightest text-cream hover:text-brand-400 transition-colors duration-200"
          style={{ letterSpacing: "-0.04em" }}
        >
          OOTD
        </Link>

        {/* Links */}
        <div className="flex items-center gap-8">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link${pathname === link.href || pathname.startsWith(link.href + "/") ? " active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Avatar / logout */}
        <button
          type="button"
          onClick={handleLogout}
          title={`${session.user.displayName} — 登出`}
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs hover:bg-brand-600 transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 focus-visible:outline-offset-2"
          style={{ background: "#1e4e36", color: "#7bbfa0" }}
        >
          {initials}
        </button>
      </div>
    </nav>
  );
}
