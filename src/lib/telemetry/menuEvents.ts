/**
 * Menu/Page usage telemetry client library
 * 
 * Features:
 * - Route change detection
 * - Dedupe identical events within 10s window
 * - Session ID management
 * - Menu key mapping from pathname
 */

// SNB menu mapping (Navigation.tsx의 키와 일치하도록 수정)
const MENU_MAP: Record<string, { group: string; key: string }> = {
  "/feedbacks": { group: "community", key: "feedbacks" },
  "/team-feed": { group: "works", key: "team-feed" },
  "/plans/gantt": { group: "works", key: "plans" },
  "/admin/plans": { group: "admin", key: "admin-plans" },
  "/admin/plans/gantt": { group: "admin", key: "admin-plans" },
  "/snapshots": { group: "works", key: "snapshots" },
  "/manage/snapshots": { group: "personal", key: "my-snapshots" }, // Navigation.tsx와 일치
  "/works/alignment": { group: "works", key: "alignment" },
  "/work-map": { group: "works", key: "work-map" },
  "/works/collaborator-graph": { group: "works", key: "collaborator-graph" },
  "/my": { group: "personal", key: "my-dashboard" }, // Navigation.tsx와 일치
  "/my/alignment": { group: "personal", key: "my-alignment" }, // Navigation.tsx와 일치
  "/admin": { group: "admin", key: "admin-dashboard" }, // Navigation.tsx와 일치
  "/admin/snapshots": { group: "admin", key: "admin-snapshots" },
  "/admin/meta-options": { group: "admin", key: "admin-meta-options" }, // Navigation.tsx와 일치
  "/admin/members": { group: "admin", key: "admin-members" },
  "/admin/menu-usage": { group: "admin", key: "admin-menu-usage" },
  "/admin/menu-settings": { group: "admin", key: "admin-menu-settings" },
  "/releases": { group: "extra", key: "releases" }, // Navigation.tsx와 일치
};

// Session ID management (persisted in sessionStorage)
const SESSION_KEY = "telemetry_session_id";

export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";

  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

// Parse pathname to menu_group/menu_key
export function parseMenuFromPath(pathname: string): {
  menu_group: string | null;
  menu_key: string | null;
} {
  // Exact match
  if (MENU_MAP[pathname]) {
    return {
      menu_group: MENU_MAP[pathname].group,
      menu_key: MENU_MAP[pathname].key,
    };
  }

  // Prefix match (e.g. /admin/plans/123 -> /admin/plans)
  for (const [path, menu] of Object.entries(MENU_MAP)) {
    if (pathname.startsWith(path + "/")) {
      return {
        menu_group: menu.group,
        menu_key: menu.key,
      };
    }
  }

  // No match
  return {
    menu_group: null,
    menu_key: null,
  };
}

// Dedupe logic: track recent events by key
interface EventKey {
  workspace_id: string;
  event_type: string;
  page_path: string;
}

const DEDUPE_WINDOW_MS = 10 * 1000; // 10 seconds
const recentEvents = new Map<string, number>();

function makeEventKey(event: EventKey): string {
  return `${event.workspace_id}:${event.event_type}:${event.page_path}`;
}

function shouldLogEvent(event: EventKey): boolean {
  const key = makeEventKey(event);
  const now = Date.now();
  const lastTime = recentEvents.get(key);

  if (lastTime && now - lastTime < DEDUPE_WINDOW_MS) {
    // Too soon, skip
    return false;
  }

  // Update timestamp
  recentEvents.set(key, now);

  // Cleanup old entries periodically
  if (recentEvents.size > 100) {
    const cutoff = now - DEDUPE_WINDOW_MS;
    for (const [k, t] of recentEvents.entries()) {
      if (t < cutoff) {
        recentEvents.delete(k);
      }
    }
  }

  return true;
}

// Log event to API
export interface MenuEventPayload {
  workspace_id: string;
  event_type: "PAGE_VIEW" | "MENU_CLICK";
  page_path: string;
  menu_group?: string | null;
  menu_key?: string | null;
  referrer?: string;
}

export async function logMenuEvent(payload: MenuEventPayload): Promise<void> {
  try {
    // Check dedupe
    if (
      !shouldLogEvent({
        workspace_id: payload.workspace_id,
        event_type: payload.event_type,
        page_path: payload.page_path,
      })
    ) {
      return;
    }

    const session_id = getOrCreateSessionId();
    const referrer =
      typeof document !== "undefined" ? document.referrer : undefined;

    const body = {
      ...payload,
      session_id,
      referrer: payload.referrer || referrer,
    };

    // Fire and forget
    fetch("/api/telemetry/menu-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {
      // Silent fail for telemetry
    });
  } catch {
    // Silent fail for telemetry
  }
}

// Log page view (called on route change)
export function logPageView(
  workspaceId: string,
  pathname: string
): void {
  if (!workspaceId) return;

  const { menu_group, menu_key } = parseMenuFromPath(pathname);

  logMenuEvent({
    workspace_id: workspaceId,
    event_type: "PAGE_VIEW",
    page_path: pathname,
    menu_group,
    menu_key,
  });
}

// Log menu click (called from SNB)
export function logMenuClick(
  workspaceId: string,
  pathname: string,
  menuGroup: string,
  menuKey: string
): void {
  if (!workspaceId) return;

  logMenuEvent({
    workspace_id: workspaceId,
    event_type: "MENU_CLICK",
    page_path: pathname,
    menu_group: menuGroup,
    menu_key: menuKey,
  });
}

