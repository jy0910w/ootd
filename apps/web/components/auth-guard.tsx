"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { RefreshFailedError } from "@/lib/api";
import { useToast } from "@/lib/toast-context";

/**
 * Global error boundary for 401 authentication failures.
 * Catches RefreshFailedError thrown by the API layer and redirects to login.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();

  useEffect(() => {
    // Set up global error handler for unhandled promise rejections
    const handleError = (event: PromiseRejectionEvent) => {
      if (event.reason instanceof RefreshFailedError) {
        // Prevent default error logging
        event.preventDefault();

        // Show toast notification
        showToast("登入已過期,請重新登入", "error");

        // Redirect to login with return URL
        const returnUrl = encodeURIComponent(pathname);
        router.push(`/login?reason=session_expired&returnUrl=${returnUrl}`);
      }
    };

    window.addEventListener("unhandledrejection", handleError);

    return () => {
      window.removeEventListener("unhandledrejection", handleError);
    };
  }, [pathname, router, showToast]);

  return <>{children}</>;
}
