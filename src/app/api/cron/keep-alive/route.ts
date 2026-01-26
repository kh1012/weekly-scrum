/**
 * Supabase Keep-Alive Cron Job
 * 
 * Vercel Cron Jobs를 통해 주기적으로 호출되어
 * Supabase 프로젝트가 1주일간 활동이 없어 중지되는 것을 방지합니다.
 * 
 * - 매주 월요일과 목요일 00:00 UTC에 실행
 * - Service Role Key를 사용하여 RLS를 우회하고 실제 쿼리 수행
 * - CRON_SECRET으로 요청 검증
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

export async function GET(request: NextRequest) {
  try {
    // 1. CRON_SECRET 검증
    const authHeader = request.headers.get("authorization");
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret) {
      console.error("[Keep-Alive] CRON_SECRET 환경 변수가 설정되지 않았습니다.");
      return NextResponse.json(
        { error: "CRON_SECRET not configured" },
        { status: 500 }
      );
    }

    if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
      console.error("[Keep-Alive] 인증 실패: 유효하지 않은 Authorization 헤더");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Supabase Service Role Client 생성
    let supabase;
    try {
      supabase = createServiceRoleClient();
    } catch (error) {
      console.error("[Keep-Alive] Supabase 클라이언트 생성 실패:", error);
      return NextResponse.json(
        { error: "Failed to create Supabase client", details: String(error) },
        { status: 500 }
      );
    }

    // 3. 실제 쿼리 수행 (profiles 테이블에서 1개 레코드 조회)
    const { data, error: queryError } = await supabase
      .from("profiles")
      .select("user_id")
      .limit(1)
      .single();

    if (queryError) {
      // 단일 레코드가 없을 수 있으므로, limit(1)로 변경하여 재시도
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("profiles")
        .select("user_id")
        .limit(1);

      if (fallbackError) {
        console.error("[Keep-Alive] 쿼리 실패:", fallbackError);
        return NextResponse.json(
          {
            error: "Database query failed",
            details: fallbackError.message,
            code: fallbackError.code,
          },
          { status: 500 }
        );
      }

      // fallback 쿼리 성공
      console.log("[Keep-Alive] 성공 (fallback):", {
        timestamp: new Date().toISOString(),
        recordCount: fallbackData?.length || 0,
      });

      return NextResponse.json({
        success: true,
        message: "Keep-alive check completed",
        timestamp: new Date().toISOString(),
        method: "fallback",
        recordCount: fallbackData?.length || 0,
      });
    }

    // 4. 성공 응답
    console.log("[Keep-Alive] 성공:", {
      timestamp: new Date().toISOString(),
      userId: data?.user_id || null,
    });

    return NextResponse.json({
      success: true,
      message: "Keep-alive check completed",
      timestamp: new Date().toISOString(),
      method: "single",
      userId: data?.user_id || null,
    });
  } catch (error) {
    // 예상치 못한 에러 처리
    console.error("[Keep-Alive] 예상치 못한 에러:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
