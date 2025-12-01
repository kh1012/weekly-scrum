"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface LayoutWrapperProps {
  children: ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const isProjectsPage = pathname === "/weekly-scrum/projects";
  
  return (
    <div className={`min-h-screen ${isProjectsPage ? "bg-white" : "bg-[#f6f8fa]"}`}>
      {children}
    </div>
  );
}

