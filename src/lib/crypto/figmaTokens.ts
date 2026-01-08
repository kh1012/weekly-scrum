/**
 * Figma OAuth 토큰 암호화/복호화 유틸리티
 * AES-256-GCM 알고리즘 사용
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_ENV = process.env.FIGMA_TOKEN_ENCRYPTION_KEY;

if (!KEY_ENV && process.env.NODE_ENV !== "test") {
  console.warn(
    "[Figma Crypto] FIGMA_TOKEN_ENCRYPTION_KEY 환경 변수가 설정되지 않았습니다."
  );
}

const KEY = KEY_ENV ? Buffer.from(KEY_ENV, "hex") : Buffer.alloc(32);

export interface FigmaTokens {
  access_token: string;
  refresh_token: string;
  expires_at: string;
}

export interface EncryptedData {
  iv: string;
  encrypted: string;
  authTag: string;
}

/**
 * Figma 토큰을 암호화합니다.
 */
export function encryptTokens(tokens: FigmaTokens): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(JSON.stringify(tokens), "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  const data: EncryptedData = {
    iv: iv.toString("hex"),
    encrypted,
    authTag: authTag.toString("hex"),
  };

  return JSON.stringify(data);
}

/**
 * 암호화된 Figma 토큰을 복호화합니다.
 */
export function decryptTokens(encryptedData: string): FigmaTokens {
  const { iv, encrypted, authTag } = JSON.parse(encryptedData) as EncryptedData;

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    KEY,
    Buffer.from(iv, "hex")
  );
  decipher.setAuthTag(Buffer.from(authTag, "hex"));

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return JSON.parse(decrypted) as FigmaTokens;
}

