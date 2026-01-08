/**
 * Figma OAuth 인증 시작 API
 * GET /api/figma/auth
 */

import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";

export async function GET(request: NextRequest) {
  const state = nanoid(32);

  const authUrl = new URL("https://www.figma.com/oauth");
  authUrl.searchParams.set("client_id", process.env.FIGMA_CLIENT_ID!);
  authUrl.searchParams.set("redirect_uri", process.env.FIGMA_REDIRECT_URI!);
  
  // Figma REST API 공식 스코프
  // https://developers.figma.com/docs/rest-api/scopes/
  const scopes = [
    "file_content:read",       // 파일 내용 읽기 (필수)
    "file_comments:read",      // 댓글 읽기
    "file_comments:write",     // 댓글 작성
    "webhooks:write",          // 웹훅 관리 (실시간 알림)
  ];
  authUrl.searchParams.set("scope", scopes.join(" "));
  
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("response_type", "code");
  
  console.log("[Figma Auth] OAuth URL:", authUrl.toString());

  const response = NextResponse.redirect(authUrl);
  response.cookies.set("figma_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
  });

  return response;
}
