/**
 * Figma 파일 관련 에러 타입 정의
 */

export type FigmaErrorType =
  | "CLIENT_VALIDATION"
  | "AUTH"
  | "PERMISSION"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMIT"
  | "SERVER"
  | "NETWORK"
  | "TIMEOUT";

export type FigmaError = {
  type: FigmaErrorType;
  title: string;
  message: string;
  suggestions: string[];
  recoverable: boolean;
  retryable: boolean;
};

export type FigmaWarning = {
  type: "READ_ONLY" | "WEBHOOK_FAILED" | "THUMBNAIL_FAILED";
  title: string;
  message: string;
};

export function createError(
  type: FigmaErrorType,
  message: string,
  suggestions: string[] = [],
  options: { recoverable?: boolean; retryable?: boolean } = {}
): FigmaError {
  const titles: Record<FigmaErrorType, string> = {
    CLIENT_VALIDATION: "입력 오류",
    AUTH: "인증 필요",
    PERMISSION: "권한 없음",
    NOT_FOUND: "파일을 찾을 수 없음",
    CONFLICT: "이미 등록된 파일",
    RATE_LIMIT: "요청 한도 초과",
    SERVER: "서버 오류",
    NETWORK: "네트워크 오류",
    TIMEOUT: "요청 시간 초과",
  };

  const defaultRecoverable: Record<FigmaErrorType, boolean> = {
    CLIENT_VALIDATION: true,
    AUTH: true,
    PERMISSION: false,
    NOT_FOUND: false,
    CONFLICT: true,
    RATE_LIMIT: true,
    SERVER: false,
    NETWORK: true,
    TIMEOUT: true,
  };

  const defaultRetryable: Record<FigmaErrorType, boolean> = {
    CLIENT_VALIDATION: false,
    AUTH: false,
    PERMISSION: false,
    NOT_FOUND: false,
    CONFLICT: false,
    RATE_LIMIT: true,
    SERVER: true,
    NETWORK: true,
    TIMEOUT: true,
  };

  return {
    type,
    title: titles[type],
    message,
    suggestions,
    recoverable: options.recoverable ?? defaultRecoverable[type],
    retryable: options.retryable ?? defaultRetryable[type],
  };
}
