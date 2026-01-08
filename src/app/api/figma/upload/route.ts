/**
 * Figma 이미지 업로드 API
 * POST /api/figma/upload
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { decryptTokens, encryptTokens } from "@/lib/crypto/figmaTokens";

async function refreshToken(refreshToken: string) {
  const res = await fetch("https://www.figma.com/api/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.FIGMA_CLIENT_ID,
      client_secret: process.env.FIGMA_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) throw new Error("Token refresh failed");
  return res.json();
}

async function getValidAccessToken(userId: string) {
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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accessToken = await getValidAccessToken(user.id);

    const formData = await request.formData();
    const imageFile = formData.get("image") as File;
    const filename = formData.get("filename") as string;
    const platform = formData.get("platform") as "figma" | "figjam";

    const createFileRes = await fetch("https://api.figma.com/v1/files", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: filename || `Gantt Chart ${new Date().toISOString()}`,
        ...(platform === "figjam" && { file_type: "whiteboard" }),
      }),
    });

    if (!createFileRes.ok) {
      const error = await createFileRes.json();
      throw new Error(error.message || "File creation failed");
    }

    const fileData = await createFileRes.json();
    const fileKey = fileData.key;

    const imageBuffer = await imageFile.arrayBuffer();

    const uploadRes = await fetch(
      `https://api.figma.com/v1/files/${fileKey}/images`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "image/png",
        },
        body: imageBuffer,
      }
    );

    if (!uploadRes.ok) {
      const error = await uploadRes.json();
      throw new Error(error.message || "Image upload failed");
    }

    const uploadData = await uploadRes.json();

    const fileUrl =
      platform === "figjam"
        ? `https://www.figma.com/board/${fileKey}`
        : `https://www.figma.com/file/${fileKey}`;

    return NextResponse.json({
      success: true,
      fileKey,
      fileUrl,
      imageRef: uploadData.meta?.images?.[0]?.id,
      platform,
    });
  } catch (error) {
    console.error("[Figma Upload]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}

