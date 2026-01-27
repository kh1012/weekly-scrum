/**
 * Short Links API
 * 
 * - POST: 축약된 URL 생성
 * - GET: short_id로 원본 쿼리 스트링 조회
 */

import { NextRequest, NextResponse } from "next/server";
import { createShortLink, getShortLink } from "@/lib/utils/shortLink";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspaceId, originalUrl, queryString, expiresAt } = body;

    if (!originalUrl || !queryString) {
      return NextResponse.json(
        { error: "originalUrl and queryString are required" },
        { status: 400 }
      );
    }

    const result = await createShortLink({
      workspaceId,
      originalUrl,
      queryString,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      shortId: result.shortId,
      shortUrl: result.shortUrl,
    });
  } catch (error) {
    console.error("[ShortLink API] POST 에러:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const shortId = searchParams.get("shortId");

    if (!shortId) {
      return NextResponse.json(
        { error: "shortId is required" },
        { status: 400 }
      );
    }

    const result = await getShortLink(shortId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      queryString: result.queryString,
      originalUrl: result.originalUrl,
    });
  } catch (error) {
    console.error("[ShortLink API] GET 에러:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
