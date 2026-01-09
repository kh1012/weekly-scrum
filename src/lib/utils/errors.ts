/**
 * 에러 처리 유틸리티
 * 
 * 프로젝트 전반에 걸쳐 사용되는 에러 처리 로직을 통합합니다.
 * - 커스텀 에러 클래스
 * - 에러 타입 가드
 * - API 응답 에러 처리
 * - 에러 메시지 포맷팅
 */

import { logger } from "./logger";

// ========================================
// 커스텀 에러 클래스
// ========================================

/**
 * 기본 애플리케이션 에러
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  
  constructor(
    message: string,
    code: string = "APP_ERROR",
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * API 요청 에러
 */
export class APIError extends AppError {
  public readonly endpoint?: string;
  public readonly method?: string;
  
  constructor(
    message: string,
    statusCode: number = 500,
    endpoint?: string,
    method?: string
  ) {
    super(message, "API_ERROR", statusCode);
    this.name = "APIError";
    this.endpoint = endpoint;
    this.method = method;
  }
}

/**
 * 유효성 검사 에러
 */
export class ValidationError extends AppError {
  public readonly fields?: Record<string, string[]>;
  
  constructor(message: string, fields?: Record<string, string[]>) {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "ValidationError";
    this.fields = fields;
  }
}

/**
 * 인증 에러
 */
export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, "AUTH_ERROR", 401);
    this.name = "AuthenticationError";
  }
}

/**
 * 권한 에러
 */
export class AuthorizationError extends AppError {
  constructor(message: string = "Permission denied") {
    super(message, "AUTHORIZATION_ERROR", 403);
    this.name = "AuthorizationError";
  }
}

/**
 * 리소스를 찾을 수 없음
 */
export class NotFoundError extends AppError {
  public readonly resource?: string;
  
  constructor(message: string = "Resource not found", resource?: string) {
    super(message, "NOT_FOUND", 404);
    this.name = "NotFoundError";
    this.resource = resource;
  }
}

/**
 * 데이터베이스 에러
 */
export class DatabaseError extends AppError {
  public readonly query?: string;
  
  constructor(message: string, query?: string) {
    super(message, "DATABASE_ERROR", 500);
    this.name = "DatabaseError";
    this.query = query;
  }
}

/**
 * 네트워크 에러
 */
export class NetworkError extends AppError {
  constructor(message: string = "Network error occurred") {
    super(message, "NETWORK_ERROR", 503);
    this.name = "NetworkError";
  }
}

// ========================================
// 타입 가드
// ========================================

/**
 * AppError인지 확인
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * APIError인지 확인
 */
export function isAPIError(error: unknown): error is APIError {
  return error instanceof APIError;
}

/**
 * ValidationError인지 확인
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * AuthenticationError인지 확인
 */
export function isAuthenticationError(error: unknown): error is AuthenticationError {
  return error instanceof AuthenticationError;
}

/**
 * AuthorizationError인지 확인
 */
export function isAuthorizationError(error: unknown): error is AuthorizationError {
  return error instanceof AuthorizationError;
}

/**
 * NotFoundError인지 확인
 */
export function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError;
}

/**
 * DatabaseError인지 확인
 */
export function isDatabaseError(error: unknown): error is DatabaseError {
  return error instanceof DatabaseError;
}

/**
 * NetworkError인지 확인
 */
export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

// ========================================
// 에러 메시지 처리
// ========================================

/**
 * 에러 메시지 추출
 * 다양한 에러 타입에서 사용자에게 보여줄 메시지를 추출
 */
export function getErrorMessage(error: unknown, fallback: string = "An error occurred"): string {
  if (error instanceof AppError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === "string") {
    return error;
  }
  
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  
  return fallback;
}

/**
 * 사용자 친화적 에러 메시지로 변환
 */
export function getUserFriendlyMessage(error: unknown): string {
  if (isAuthenticationError(error)) {
    return "로그인이 필요합니다. 다시 로그인해 주세요.";
  }
  
  if (isAuthorizationError(error)) {
    return "이 작업을 수행할 권한이 없습니다.";
  }
  
  if (isNotFoundError(error)) {
    return error.resource
      ? `${error.resource}을(를) 찾을 수 없습니다.`
      : "요청하신 리소스를 찾을 수 없습니다.";
  }
  
  if (isValidationError(error)) {
    return error.message || "입력 값을 확인해 주세요.";
  }
  
  if (isNetworkError(error)) {
    return "네트워크 연결을 확인해 주세요.";
  }
  
  if (isDatabaseError(error)) {
    return "데이터 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
  }
  
  if (isAPIError(error)) {
    if (error.statusCode >= 500) {
      return "서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
    }
    if (error.statusCode === 429) {
      return "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.";
    }
    return error.message;
  }
  
  return getErrorMessage(error, "오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
}

// ========================================
// API 에러 처리
// ========================================

/**
 * Fetch Response를 에러로 변환
 */
export async function handleFetchError(response: Response, endpoint?: string): Promise<never> {
  let message = `Request failed with status ${response.status}`;
  
  try {
    const data = await response.json();
    if (data.error) {
      message = typeof data.error === "string" ? data.error : data.error.message || message;
    } else if (data.message) {
      message = data.message;
    }
  } catch {
    // JSON 파싱 실패 시 status text 사용
    message = response.statusText || message;
  }
  
  throw new APIError(message, response.status, endpoint, "GET");
}

/**
 * Fetch 요청을 래핑하여 자동으로 에러 처리
 */
export async function fetchWithErrorHandling<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      await handleFetchError(response, url);
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    
    // 네트워크 에러 등
    logger.error("Fetch error", error, { url, options });
    throw new NetworkError(getErrorMessage(error));
  }
}

// ========================================
// Next.js API Route 에러 처리
// ========================================

/**
 * API Route 에러 응답 생성
 */
export function createErrorResponse(error: unknown) {
  if (isAppError(error)) {
    return Response.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error instanceof ValidationError && error.fields && { fields: error.fields }),
          ...(error instanceof APIError && error.endpoint && { endpoint: error.endpoint }),
        },
      },
      { status: error.statusCode }
    );
  }
  
  // Unknown error
  logger.error("Unhandled error in API route", error);
  
  return Response.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: process.env.NODE_ENV === "production"
          ? "An internal error occurred"
          : getErrorMessage(error),
      },
    },
    { status: 500 }
  );
}

/**
 * API Route Handler 래퍼
 * 자동으로 에러를 catch하고 적절한 응답 생성
 */
export function withErrorHandling<T extends unknown[]>(
  handler: (...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      return createErrorResponse(error);
    }
  };
}

// ========================================
// 에러 로깅
// ========================================

/**
 * 에러를 로그하고 사용자 친화적 메시지 반환
 */
export function logAndGetMessage(
  error: unknown,
  context: string = "App"
): string {
  logger.error(`Error in ${context}`, error);
  return getUserFriendlyMessage(error);
}

/**
 * 에러를 로그하고 throw
 */
export function logAndThrow(
  error: unknown,
  context: string = "App"
): never {
  logger.error(`Error in ${context}`, error);
  throw error;
}

// ========================================
// 유틸리티 함수
// ========================================

/**
 * 에러를 조용히 처리 (로그만 남기고 throw하지 않음)
 */
export function suppressError(error: unknown, context: string = "App"): void {
  logger.warn(`Suppressed error in ${context}`, { error });
}

/**
 * 에러 재시도 래퍼
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delay?: number;
    onRetry?: (attempt: number, error: unknown) => void;
  } = {}
): Promise<T> {
  const { maxAttempts = 3, delay = 1000, onRetry } = options;
  
  let lastError: unknown;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxAttempts) {
        logger.warn(`Attempt ${attempt} failed, retrying...`, { error });
        if (onRetry) {
          onRetry(attempt, error);
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * 비동기 함수를 안전하게 실행 (에러 발생 시 기본값 반환)
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  fallback: T,
  context?: string
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (context) {
      logger.error(`Error in ${context}, using fallback`, error);
    }
    return fallback;
  }
}

/**
 * 동기 함수를 안전하게 실행 (에러 발생 시 기본값 반환)
 */
export function tryCatchSync<T>(
  fn: () => T,
  fallback: T,
  context?: string
): T {
  try {
    return fn();
  } catch (error) {
    if (context) {
      logger.error(`Error in ${context}, using fallback`, error);
    }
    return fallback;
  }
}
