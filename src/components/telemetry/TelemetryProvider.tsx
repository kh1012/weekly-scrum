"use client";

/**
 * Telemetry Provider
 * 
 * Detects route changes and logs PAGE_VIEW events
 * - Uses usePathname() to track pathname changes
 * - Dedupes identical events within 10s window
 * - Only logs after route change is complete
 */

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { logPageView } from "@/lib/telemetry/menuEvents";

interface TelemetryProviderProps {
  workspaceId: string;
  children?: React.ReactNode;
}

export function TelemetryProvider({
  workspaceId,
  children,
}: TelemetryProviderProps) {
  const pathname = usePathname();
  const lastPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    // Skip if workspace_id is not available
    if (!workspaceId) return;

    // Skip if pathname hasn't changed
    if (pathname === lastPathnameRef.current) return;

    // Log page view
    logPageView(workspaceId, pathname);

    // Update ref
    lastPathnameRef.current = pathname;
  }, [pathname, workspaceId]);

  return <>{children}</>;
}

