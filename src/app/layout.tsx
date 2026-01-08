import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { PageLoadingOverlay } from "@/components/common/PageLoadingOverlay";
import { LogoLoadingSpinner } from "@/components/weekly-scrum/common/LoadingSpinner";

const getMetadataBase = (): string => {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.NODE_ENV === "production") {
    return "https://kh1012.github.io/weekly-scrum";
  }
  return "http://localhost:3000";
};

export const metadata: Metadata = {
  metadataBase: new URL(getMetadataBase()),
  title: "Weekly Scrum Dashboard",
  description: "팀 위클리 스크럼 현황 대시보드",
  openGraph: {
    title: "Weekly Scrum Dashboard",
    description: "팀 위클리 스크럼 현황 대시보드",
    type: "website",
    images: [
      {
        url: "/assets/logo.svg",
        width: 512,
        height: 512,
        alt: "Weekly Scrum Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Weekly Scrum Dashboard",
    description: "팀 위클리 스크럼 현황 대시보드",
    images: ["/assets/logo.svg"],
  },
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
