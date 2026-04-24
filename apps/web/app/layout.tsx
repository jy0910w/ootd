import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/lib/toast-context";
import { AuthGuard } from "@/components/auth-guard";

export const metadata: Metadata = {
  title: "OOTD — Outfit of the Day",
  description: "Your wardrobe, curated."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Noto+Serif+TC:wght@200;300;400&family=Noto+Sans+TC:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ToastProvider>
          <AuthGuard>
            {children}
          </AuthGuard>
        </ToastProvider>
      </body>
    </html>
  );
}
