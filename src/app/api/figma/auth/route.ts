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
  authUrl.searchParams.set("scope", "file_content:read");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("response_type", "code");

  const response = NextResponse.redirect(authUrl);
  response.cookies.set("figma_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
  });

  return response;
}

