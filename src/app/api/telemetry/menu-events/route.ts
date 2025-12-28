/**
 * Menu/Page usage telemetry API
 *
 * - Server-side insertion with service role key
 * - Enriches client payload with user_id, user_agent, etc.
 * - Resilient to failures (returns 200 even on error to not break UX)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Service role client (bypasses RLS)
function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Missing Supabase service role credentials");
  }

  return createServerClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

// Excluded emails (developers/test accounts)
const EXCLUDED_EMAILS = ["kh1012@midasit.com", "zrelor@gmail.com"];

// Get current user from session
async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("sb-access-token")?.value;

    if (!sessionCookie) return null;

    const supabase = createServiceRoleClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(sessionCookie);

    if (error || !user) return null;
    return { id: user.id, email: user.email };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      workspace_id,
      event_type,
      menu_group,
      menu_key,
      page_path,
      referrer,
      session_id,
    } = body;

    // Validate required fields
    if (!workspace_id || !event_type || !page_path) {
      return NextResponse.json(
        {
          error: "Missing required fields: workspace_id, event_type, page_path",
        },
        { status: 400 }
      );
    }

    // Validate event_type
    if (!["PAGE_VIEW", "MENU_CLICK"].includes(event_type)) {
      return NextResponse.json(
        { error: "Invalid event_type. Must be PAGE_VIEW or MENU_CLICK" },
        { status: 400 }
      );
    }

    // Get user from session
    const currentUser = await getCurrentUser();
    const user_id = currentUser?.id || null;
    const user_email = currentUser?.email || null;

    // Skip telemetry for excluded emails (developers/test accounts)
    if (user_email && EXCLUDED_EMAILS.includes(user_email.toLowerCase())) {
      return NextResponse.json({
        success: true,
        logged: false,
        reason: "excluded_user",
      });
    }

    // Skip telemetry for localhost referrer (development/testing)
    const actualReferrer = referrer || request.headers.get("referer") || "";
    if (actualReferrer.includes("localhost")) {
      return NextResponse.json({
        success: true,
        logged: false,
        reason: "localhost_referrer",
      });
    }

    // Extract user_agent and device
    const user_agent = request.headers.get("user-agent") || undefined;
    const device = extractDevice(user_agent);

    // Prepare event data
    const eventData = {
      workspace_id,
      user_id,
      event_type,
      menu_group: menu_group || null,
      menu_key: menu_key || null,
      page_path,
      referrer: actualReferrer || null,
      device,
      session_id: session_id || null,
      user_agent,
      occurred_at: new Date().toISOString(),
    };

    // Insert into DB using service role
    const supabase = createServiceRoleClient();
    const { error: insertError } = await supabase
      .from("menu_events")
      .insert(eventData);

    if (insertError) {
      console.error("[Telemetry] Insert error:", insertError);
      // Return 200 to not break UX, but log error
      return NextResponse.json({ success: false, logged: false });
    }

    return NextResponse.json({ success: true, logged: true });
  } catch (error) {
    console.error("[Telemetry] Unexpected error:", error);
    // Return 200 to not break UX
    return NextResponse.json({ success: false, logged: false });
  }
}

/**
 * Extract device type from user agent
 */
function extractDevice(userAgent: string | null | undefined): string | null {
  if (!userAgent) return null;

  const ua = userAgent.toLowerCase();

  if (
    ua.includes("mobile") ||
    ua.includes("android") ||
    ua.includes("iphone")
  ) {
    return "mobile";
  }
  if (ua.includes("tablet") || ua.includes("ipad")) {
    return "tablet";
  }
  return "desktop";
}
