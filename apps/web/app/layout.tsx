import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/lib/toast-context";
import { AuthGuard } from "@/components/auth-guard";
import { ThemeProvider } from "./providers/theme-provider";

export const metadata: Metadata = {
  title: "OOTD — Outfit of the Day",
  description: "Your wardrobe, curated."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <ToastProvider>
            <AuthGuard>
              {children}
            </AuthGuard>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
