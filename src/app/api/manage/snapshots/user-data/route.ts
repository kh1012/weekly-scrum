import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMemberNames } from "@/lib/data/members";
import { getAllMetaOptions } from "@/lib/data/snapshots";

/**
 * GET /api/manage/snapshots/user-data
 * 
 * 사용자 정보 및 메타 옵션 조회
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const workspaceId = searchParams.get("workspaceId");
  const userId = searchParams.get("userId");

  if (!workspaceId || !userId) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // 사용자 프로필에서 display_name 조회
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("user_id", userId)
    .single();

  const displayName = profile?.display_name?.trim() || "";

  // 워크스페이스 멤버 이름 목록 조회
  const memberNames = await getMemberNames();

  // 메타 옵션 조회
  const metaOptions = await getAllMetaOptions(workspaceId);

  return NextResponse.json({
    displayName,
    memberNames,
    domainOptions: metaOptions.domain,
    projectOptions: metaOptions.project,
    moduleOptions: metaOptions.module,
    featureOptions: metaOptions.feature,
  });
}

