"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface LayoutWrapperProps {
  children: ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  
  // 흰색 배경을 사용하는 페이지들
  const whiteBackgroundPages = [
    "/projects",
    "/quadrant",
  ];
  const useWhiteBg = whiteBackgroundPages.some((p) => pathname === p);
  
  return (
    <div className={`min-h-screen ${useWhiteBg ? "bg-white" : "bg-[#f6f8fa]"}`}>
      {children}
    </div>
  );
}
