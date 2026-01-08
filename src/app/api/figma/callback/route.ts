/**
 * Figma OAuth 콜백 API
 * GET /api/figma/callback
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { encryptTokens } from "@/lib/crypto/figmaTokens";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/admin/plans/gantt?figma_error=${error}`, request.url)
    );
  }

  const storedState = request.cookies.get("figma_oauth_state")?.value;
  if (!state || state !== storedState) {
    return NextResponse.redirect(
      new URL("/admin/plans/gantt?figma_error=invalid_state", request.url)
    );
  }

  try {
    const tokenRes = await fetch("https://www.figma.com/api/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.FIGMA_CLIENT_ID,
        client_secret: process.env.FIGMA_CLIENT_SECRET,
        redirect_uri: process.env.FIGMA_REDIRECT_URI,
        code,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) throw new Error("Token exchange failed");

    const tokens = await tokenRes.json();
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    const encryptedTokens = encryptTokens({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt.toISOString(),
    });

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("User not authenticated");

    await supabase
      .from("profiles")
      .update({
        figma_encrypted_tokens: encryptedTokens,
        figma_user_id: tokens.user_id,
        figma_connected_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    return NextResponse.redirect(
      new URL("/admin/plans/gantt?figma_success=true", request.url)
    );
  } catch (err) {
    console.error("[Figma OAuth]", err);
    return NextResponse.redirect(
      new URL("/admin/plans/gantt?figma_error=server_error", request.url)
    );
  }
}

