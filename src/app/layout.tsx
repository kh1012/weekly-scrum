import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { PageLoadingOverlay } from "@/components/common/PageLoadingOverlay";
import { LogoLoadingSpinner } from "@/components/weekly-scrum/common/LoadingSpinner";

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
      <body className="antialiased">
        <PageLoadingOverlay />
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center bg-white">
              <LogoLoadingSpinner
                title="페이지를 불러오는 중입니다"
                description="잠시만 기다려주세요."
                className="h-auto"
              />
            </div>
          }
        >
          {children}
        </Suspense>
      </body>
    </html>
  );
}
