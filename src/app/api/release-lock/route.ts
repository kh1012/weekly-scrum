/**
 * Lock Release API
 * - beforeunload에서 동기적으로 호출
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  console.log("[release-lock] API 호출됨");
  
  try {
    const { workspaceId } = await request.json();
    console.log("[release-lock] workspaceId:", workspaceId);

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    const supabase = await createClient();
    
    // 현재 사용자 확인
    const { data: { user } } = await supabase.auth.getUser();
    console.log("[release-lock] 현재 사용자:", user?.id);

    const { error } = await supabase.rpc("release_workspace_lock", {
      p_workspace_id: workspaceId,
    });

    if (error) {
      console.error("[release-lock] RPC error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("[release-lock] 락 해제 성공");
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[release-lock] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

