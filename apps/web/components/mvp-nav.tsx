"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSession, SessionState } from "@/lib/session";

type MvpNavProps = {
  session: SessionState;
};

const LINKS = [
  { href: "/wardrobe", label: "Wardrobe" },
  { href: "/outfits", label: "Outfits" },
  { href: "/outfits/new", label: "New Outfit" },
  { href: "/recommendations", label: "Recommendations" }
] as const;

export function MvpNav({ session }: MvpNavProps) {
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
          <h1>OOTD Web MVP</h1>
          <p>
            {session.user.displayName} ({session.user.role})
          </p>
        </div>
        <button type="button" className="subtle" onClick={handleLogout}>
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
