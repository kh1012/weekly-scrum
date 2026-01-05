/**
 * Alignment Data API
 * 
 * GET /api/alignment?workspaceId=...&userId=...&year=...&week=...
 */

import { NextRequest, NextResponse } from "next/server";
import { getAlignmentData } from "@/lib/data/alignmentData";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const workspaceId = searchParams.get("workspaceId");
  const userId = searchParams.get("userId");
  const yearStr = searchParams.get("year");
  const week = searchParams.get("week");

  if (!workspaceId || !userId || !yearStr || !week) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  const year = parseInt(yearStr, 10);
  if (isNaN(year)) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  try {
    const data = await getAlignmentData({
      workspaceId,
      userId,
      year,
      week,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in alignment API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

