/**
 * 인증 관련 헬퍼 함수 (클라이언트 전용)
 * - Magic Link 방식 (Production 모드)
 * - Email + Password 방식 (Demo 모드)
 * - 브라우저 환경에서만 사용
 */

import { createClient as createBrowserClient } from "@/lib/supabase/browser";

export interface AuthResult {
  success: boolean;
  error?: string;
  userId?: string;
  message?: string;
}

/**
 * 이메일 Magic Link로 로그인 (Production 모드)
 * @param email 사용자 이메일
 * @param redirectTo 로그인 후 리다이렉트할 경로
 */
export async function signInWithMagicLink(
  email: string,
  redirectTo?: string
): Promise<AuthResult> {
  try {
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback${
          redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ""
        }`,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      message: "이메일을 확인해주세요. 로그인 링크가 발송되었습니다.",
    };
  } catch (error) {
    console.error("signInWithMagicLink error:", error);
    return {
      success: false,
      error: "로그인 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 이메일 + 비밀번호로 로그인 (Demo 모드)
 * @param email 사용자 이메일
 * @param password 비밀번호
 */
export async function signInWithPassword(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    const supabase = createBrowserClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: "로그인에 실패했습니다." };
    }

    return { success: true, userId: data.user.id };
  } catch (error) {
    console.error("signInWithPassword error:", error);
    return {
      success: false,
      error: "로그인 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 이메일 + 비밀번호로 회원가입 (Demo 모드)
 * @param email 사용자 이메일
 * @param password 비밀번호
 * @param displayName 표시 이름 (선택)
 */
export async function signUpWithPassword(
  email: string,
  password: string,
  displayName?: string
): Promise<AuthResult> {
  try {
    const supabase = createBrowserClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || email.split("@")[0],
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: "회원가입에 실패했습니다." };
    }

    return { 
      success: true, 
      userId: data.user.id,
      message: "회원가입이 완료되었습니다. 로그인해주세요."
    };
  } catch (error) {
    console.error("signUpWithPassword error:", error);
    return {
      success: false,
      error: "회원가입 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 로그아웃
 */
export async function signOut(): Promise<AuthResult> {
  try {
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("signOut error:", error);
    return {
      success: false,
      error: "로그아웃 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 클라이언트 사이드에서 현재 사용자 가져오기
 */
export async function getCurrentUserClient() {
  const supabase = createBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
