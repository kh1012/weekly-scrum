/**
 * Figma OAuth 콜백 API
 * GET /api/figma/callback
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { encryptTokens } from "@/lib/crypto/figmaTokens";

export async function GET(request: NextRequest) {
  console.log("[Figma OAuth Callback] START");
  console.log("[Figma OAuth Callback] Request URL:", request.url);
  
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  console.log("[Figma OAuth Callback] Has code:", !!code);
  console.log("[Figma OAuth Callback] Has state:", !!state);
  console.log("[Figma OAuth Callback] Has error:", !!error);

  if (error) {
    console.log("[Figma OAuth Callback] Error from Figma:", error);
    return NextResponse.redirect(
      new URL(`/profile/settings?figma_error=${error}`, request.url)
    );
  }

  const storedState = request.cookies.get("figma_oauth_state")?.value;
  console.log("[Figma OAuth Callback] State match:", state === storedState);
  
  if (!state || state !== storedState) {
    console.log("[Figma OAuth Callback] State validation failed");
    return NextResponse.redirect(
      new URL("/profile/settings?figma_error=invalid_state", request.url)
    );
  }

  try {
    console.log("[Figma OAuth Callback] Exchanging code for token...");
    
    // 환경 변수 확인
    const clientId = process.env.FIGMA_CLIENT_ID;
    const clientSecret = process.env.FIGMA_CLIENT_SECRET;
    const redirectUri = process.env.FIGMA_REDIRECT_URI;
    
    console.log("[Figma OAuth Callback] Environment variables:");
    console.log("  - FIGMA_CLIENT_ID:", clientId ? `${clientId.substring(0, 8)}...` : "MISSING");
    console.log("  - FIGMA_CLIENT_SECRET:", clientSecret ? `${clientSecret.substring(0, 8)}...` : "MISSING");
    console.log("  - FIGMA_REDIRECT_URI:", redirectUri);
    console.log("  - Code length:", code?.length);
    
    const requestBody = {
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
      grant_type: "authorization_code",
    };
    
    console.log("[Figma OAuth Callback] Request body (sanitized):", {
      ...requestBody,
      client_secret: clientSecret ? `${clientSecret.substring(0, 8)}...` : "MISSING",
      code: code ? `${code.substring(0, 10)}...` : "MISSING",
    });
    
    const tokenRes = await fetch("https://api.figma.com/v1/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    console.log("[Figma OAuth Callback] Token response status:", tokenRes.status);
    console.log("[Figma OAuth Callback] Token response headers:", Object.fromEntries(tokenRes.headers.entries()));
    
    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      console.error("[Figma OAuth Callback] Token exchange failed:");
      console.error("  - Status:", tokenRes.status);
      console.error("  - Response:", errorText);
      throw new Error("Token exchange failed");
    }

    const tokens = await tokenRes.json();
    
    console.log("[Figma OAuth Callback] Token response (sanitized):", {
      access_token: tokens.access_token ? `${tokens.access_token.substring(0, 10)}...` : "MISSING",
      refresh_token: tokens.refresh_token ? `${tokens.refresh_token.substring(0, 10)}...` : "MISSING",
      expires_in: tokens.expires_in,
      user_id: tokens.user_id,
    });
    
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

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        figma_encrypted_tokens: encryptedTokens,
        figma_user_id: tokens.user_id,
        figma_connected_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("[Figma OAuth] Profile update error:", updateError);
      throw new Error(`Profile update failed: ${updateError.message}`);
    }

    console.log("[Figma OAuth Callback] Successfully saved tokens for user:", user.id);

    const redirectUrl = new URL("/profile/settings", request.url);
    redirectUrl.searchParams.set("figma_success", "true");
    
    console.log("[Figma OAuth Callback] Redirecting to:", redirectUrl.toString());
    
    const response = NextResponse.redirect(redirectUrl);
    
    // 쿠키 정리
    response.cookies.delete("figma_oauth_state");
    
    return response;
  } catch (err) {
    console.error("[Figma OAuth Callback] Error:", err);
    return NextResponse.redirect(
      new URL("/profile/settings?figma_error=server_error", request.url)
    );
  }
}


