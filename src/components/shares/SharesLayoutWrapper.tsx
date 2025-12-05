"use client";

import { useState, ReactNode } from "react";
import { SharesHeader, SharesSidebar } from "./SharesHeader";

interface SharesLayoutWrapperProps {
  children: ReactNode;
}

export function SharesLayoutWrapper({ children }: SharesLayoutWrapperProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen" style={{ background: 'var(--notion-bg)' }}>
      {/* PC 사이드바 */}
      <SharesSidebar isOpen={isSidebarOpen} />

      {/* 메인 영역 */}
      <div className={`transition-all duration-200 ${isSidebarOpen ? 'md:ml-60' : 'md:ml-0'}`}>
        <SharesHeader 
          isSidebarOpen={isSidebarOpen} 
          onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
        />
        <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

