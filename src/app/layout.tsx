import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Weekly Scrum Dashboard",
  description: "팀 위클리 스크럼 현황 대시보드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}

