import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OOTD Admin",
  description: "Moderation and operations console for OOTD MVP"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
