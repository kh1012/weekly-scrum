import { NextRequest, NextResponse } from "next/server";
import { getLastWeekNext } from "@/lib/data/snapshots";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const workspaceId = searchParams.get("workspaceId");
    const userId = searchParams.get("userId");
    const yearStr = searchParams.get("year");
    const weekStr = searchParams.get("week");

    if (!workspaceId || !userId || !yearStr || !weekStr) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const year = parseInt(yearStr, 10);
    const week = parseInt(weekStr, 10);

    if (isNaN(year) || isNaN(week)) {
      return NextResponse.json(
        { error: "Invalid year or week" },
        { status: 400 }
      );
    }

    const items = await getLastWeekNext(workspaceId, userId, year, week);

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error in last-week-next API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
