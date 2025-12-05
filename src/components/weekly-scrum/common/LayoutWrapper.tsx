"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface LayoutWrapperProps {
  children: ReactNode;
}

// max-w-full을 적용할 페이지 경로
const FULL_WIDTH_PAGES = [
  "/matrix",
  "/quadrant",
];

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  return (
    <div 
      className="min-h-screen"
      style={{ background: 'var(--notion-bg)' }}
    >
      {children}
    </div>
  );
}

// Main 컨텐츠 래퍼 (경로에 따라 max-width 변경)
export function MainContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  // 전체 너비를 사용하는 페이지 확인
  const useFullWidth = FULL_WIDTH_PAGES.some((p) => pathname === p || pathname === p + "/");
  
  return (
    <main 
      className={`mx-auto px-4 py-6 sm:px-6 lg:px-8 ${useFullWidth ? "max-w-full" : "max-w-6xl"}`}
    >
      {children}
    </main>
  );
}
