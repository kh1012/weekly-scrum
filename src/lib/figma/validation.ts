/**
 * Figma 파일 URL 검증 유틸리티
 */

export type ValidationResult = {
  valid: boolean;
  error?: string;
  fileKey?: string;
};

/**
 * Figma 파일 URL 형식 검증 및 파일 키 추출
 */
export function validateFigmaUrl(url: string): ValidationResult {
  // 빈 값 체크
  if (!url || !url.trim()) {
    return {
      valid: false,
      error: "Figma 파일 URL을 입력해주세요.",
    };
  }

  const trimmedUrl = url.trim();

  // figma.com 포함 여부
  if (!trimmedUrl.includes("figma.com")) {
    return {
      valid: false,
      error: "올바른 Figma URL이 아닙니다. figma.com이 포함되어야 합니다.",
    };
  }

  // 파일 키 추출
  const match = trimmedUrl.match(
    /figma\.com\/(?:file|design|board)\/([a-zA-Z0-9]+)/
  );

  if (!match || !match[1]) {
    return {
      valid: false,
      error: "Figma 파일 URL 형식이 올바르지 않습니다. 파일 링크를 확인해주세요.",
    };
  }

  const fileKey = match[1];

  // 파일 키 길이 검증 (일반적으로 22자)
  if (fileKey.length < 10) {
    return {
      valid: false,
      error: "올바르지 않은 파일 키입니다.",
    };
  }

  return {
    valid: true,
    fileKey,
  };
}

/**
 * URL에서 파일 키 추출 (검증 없이)
 */
export function extractFileKey(url: string): string | null {
  const match = url.match(/figma\.com\/(?:file|design|board)\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

/**
 * 실시간 URL 입력 피드백 (debounce 사용 권장)
 */
export function getUrlFeedback(url: string): {
  type: "idle" | "valid" | "invalid";
  message?: string;
} {
  if (!url.trim()) {
    return { type: "idle" };
  }

  const result = validateFigmaUrl(url);

  if (result.valid) {
    return {
      type: "valid",
      message: "올바른 Figma URL입니다.",
    };
  }

  return {
    type: "invalid",
    message: result.error,
  };
}
