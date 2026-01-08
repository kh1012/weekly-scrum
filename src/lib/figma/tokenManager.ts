/**
 * Figma OAuth Token 관리 유틸리티
 * - Access Token 갱신
 * - 유효한 Access Token 가져오기
 */

import { createClient } from "@/lib/supabase/server";
import { decryptTokens, encryptTokens } from "@/lib/crypto/figmaTokens";

/**
 * Refresh Token으로 새로운 Access Token 발급
 */
async function refreshToken(refreshToken: string) {
  const res = await fetch("https://api.figma.com/v1/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.FIGMA_CLIENT_ID,
      client_secret: process.env.FIGMA_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  return res.json();
}

/**
 * 사용자의 유효한 Figma Access Token 가져오기
 * - 만료 5분 전이면 자동 갱신
 */
export async function getValidAccessToken(userId: string): Promise<string> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("figma_encrypted_tokens")
    .eq("user_id", userId)
    .single();

  if (!profile?.figma_encrypted_tokens) {
    throw new Error("Figma not connected");
  }

  const tokens = decryptTokens(profile.figma_encrypted_tokens);

  // 만료 5분 전이면 갱신
  if (new Date(tokens.expires_at) < new Date(Date.now() + 5 * 60 * 1000)) {
    const newTokens = await refreshToken(tokens.refresh_token);
    const expiresAt = new Date(Date.now() + newTokens.expires_in * 1000);

    const encryptedTokens = encryptTokens({
      access_token: newTokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt.toISOString(),
    });

    await supabase
      .from("profiles")
      .update({ figma_encrypted_tokens: encryptedTokens })
      .eq("user_id", userId);

    return newTokens.access_token;
  }

  return tokens.access_token;
}
