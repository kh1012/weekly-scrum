/**
 * 로깅 유틸리티
 * 
 * 프로젝트 전반에 걸쳐 사용되는 로깅을 통합 관리합니다.
 * - 로그 레벨 지원 (DEBUG, INFO, WARN, ERROR)
 * - 컨텍스트별 로거 생성
 * - 환경별 로그 레벨 제어
 * - 구조화된 로그 출력
 */

// ========================================
// 타입 정의
// ========================================

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

export type LogContext = string;

export interface LogMetadata {
  [key: string]: unknown;
}

export interface LoggerConfig {
  level: LogLevel;
  enableTimestamp: boolean;
  enableContext: boolean;
  enableColors: boolean;
}

// ========================================
// Logger 설정
// ========================================

// 환경에 따른 기본 로그 레벨
const getDefaultLogLevel = (): LogLevel => {
  if (typeof window === "undefined") {
    // Server-side
    return process.env.NODE_ENV === "production" ? LogLevel.WARN : LogLevel.DEBUG;
  } else {
    // Client-side
    return process.env.NODE_ENV === "production" ? LogLevel.WARN : LogLevel.INFO;
  }
};

// 전역 Logger 설정
let globalConfig: LoggerConfig = {
  level: getDefaultLogLevel(),
  enableTimestamp: process.env.NODE_ENV !== "production",
  enableContext: true,
  enableColors: typeof window !== "undefined", // Browser에서만 색상 활성화
};

/**
 * 전역 로그 레벨 설정
 */
export function setLogLevel(level: LogLevel): void {
  globalConfig.level = level;
}

/**
 * 전역 Logger 설정 변경
 */
export function configureLogger(config: Partial<LoggerConfig>): void {
  globalConfig = { ...globalConfig, ...config };
}

/**
 * 현재 Logger 설정 조회
 */
export function getLoggerConfig(): LoggerConfig {
  return { ...globalConfig };
}

// ========================================
// 색상 코드 (Browser console)
// ========================================

const colors = {
  DEBUG: "#6c757d", // Gray
  INFO: "#0d6efd",  // Blue
  WARN: "#ffc107",  // Yellow
  ERROR: "#dc3545", // Red
  CONTEXT: "#6f42c1", // Purple
};

// ========================================
// Logger 클래스
// ========================================

export class Logger {
  private context: LogContext;
  
  constructor(context: LogContext) {
    this.context = context;
  }
  
  /**
   * 로그 출력 여부 확인
   */
  private shouldLog(level: LogLevel): boolean {
    return level >= globalConfig.level;
  }
  
  /**
   * 타임스탬프 생성
   */
  private getTimestamp(): string {
    const now = new Date();
    return now.toISOString();
  }
  
  /**
   * 로그 메시지 포맷팅
   */
  private formatMessage(
    level: LogLevel,
    message: string,
    metadata?: LogMetadata
  ): { formatted: string; styles: string[] } {
    const parts: string[] = [];
    const styles: string[] = [];
    
    // 타임스탬프
    if (globalConfig.enableTimestamp) {
      parts.push(`[${this.getTimestamp()}]`);
      styles.push("color: gray; font-weight: normal;");
    }
    
    // 로그 레벨
    const levelName = LogLevel[level];
    parts.push(`[${levelName}]`);
    styles.push(`color: ${colors[levelName as keyof typeof colors]}; font-weight: bold;`);
    
    // 컨텍스트
    if (globalConfig.enableContext && this.context) {
      parts.push(`[${this.context}]`);
      styles.push(`color: ${colors.CONTEXT}; font-weight: normal;`);
    }
    
    // 메시지
    parts.push(message);
    styles.push("color: inherit; font-weight: normal;");
    
    const formatted = parts.map((_, i) => `%c${parts[i]}`).join(" ");
    
    return { formatted, styles };
  }
  
  /**
   * 로그 출력 (Browser/Node 모두 지원)
   */
  private log(
    level: LogLevel,
    consoleMethod: "log" | "info" | "warn" | "error",
    message: string,
    metadata?: LogMetadata
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }
    
    if (typeof window !== "undefined" && globalConfig.enableColors) {
      // Browser: 색상 지원
      const { formatted, styles } = this.formatMessage(level, message, metadata);
      console[consoleMethod](formatted, ...styles);
      
      if (metadata && Object.keys(metadata).length > 0) {
        console[consoleMethod]("Metadata:", metadata);
      }
    } else {
      // Node.js 또는 색상 비활성화: 단순 텍스트
      const levelName = LogLevel[level];
      const contextPart = globalConfig.enableContext ? `[${this.context}]` : "";
      const timestampPart = globalConfig.enableTimestamp ? `[${this.getTimestamp()}]` : "";
      
      const fullMessage = [timestampPart, `[${levelName}]`, contextPart, message]
        .filter(Boolean)
        .join(" ");
      
      console[consoleMethod](fullMessage);
      
      if (metadata && Object.keys(metadata).length > 0) {
        console[consoleMethod]("Metadata:", metadata);
      }
    }
  }
  
  /**
   * DEBUG 레벨 로그
   */
  debug(message: string, metadata?: LogMetadata): void {
    this.log(LogLevel.DEBUG, "log", message, metadata);
  }
  
  /**
   * INFO 레벨 로그
   */
  info(message: string, metadata?: LogMetadata): void {
    this.log(LogLevel.INFO, "info", message, metadata);
  }
  
  /**
   * WARN 레벨 로그
   */
  warn(message: string, metadata?: LogMetadata): void {
    this.log(LogLevel.WARN, "warn", message, metadata);
  }
  
  /**
   * ERROR 레벨 로그
   */
  error(message: string, error?: Error | unknown, metadata?: LogMetadata): void {
    const errorMetadata = {
      ...metadata,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
    };
    
    this.log(LogLevel.ERROR, "error", message, errorMetadata);
  }
  
  /**
   * 조건부 로그
   */
  debugIf(condition: boolean, message: string, metadata?: LogMetadata): void {
    if (condition) {
      this.debug(message, metadata);
    }
  }
  
  infoIf(condition: boolean, message: string, metadata?: LogMetadata): void {
    if (condition) {
      this.info(message, metadata);
    }
  }
  
  warnIf(condition: boolean, message: string, metadata?: LogMetadata): void {
    if (condition) {
      this.warn(message, metadata);
    }
  }
  
  errorIf(condition: boolean, message: string, error?: Error | unknown, metadata?: LogMetadata): void {
    if (condition) {
      this.error(message, error, metadata);
    }
  }
  
  /**
   * 성능 측정
   */
  time(label: string): void {
    if (!this.shouldLog(LogLevel.DEBUG)) {
      return;
    }
    console.time(`[${this.context}] ${label}`);
  }
  
  timeEnd(label: string): void {
    if (!this.shouldLog(LogLevel.DEBUG)) {
      return;
    }
    console.timeEnd(`[${this.context}] ${label}`);
  }
  
  /**
   * 그룹 로그
   */
  group(label: string): void {
    if (!this.shouldLog(LogLevel.DEBUG)) {
      return;
    }
    console.group(`[${this.context}] ${label}`);
  }
  
  groupCollapsed(label: string): void {
    if (!this.shouldLog(LogLevel.DEBUG)) {
      return;
    }
    console.groupCollapsed(`[${this.context}] ${label}`);
  }
  
  groupEnd(): void {
    if (!this.shouldLog(LogLevel.DEBUG)) {
      return;
    }
    console.groupEnd();
  }
  
  /**
   * 테이블 출력
   */
  table(data: unknown): void {
    if (!this.shouldLog(LogLevel.DEBUG)) {
      return;
    }
    console.log(`[${this.context}] Table:`);
    console.table(data);
  }
}

// ========================================
// Logger 팩토리
// ========================================

/**
 * 컨텍스트별 Logger 인스턴스 캐시
 */
const loggerCache = new Map<LogContext, Logger>();

/**
 * Logger 인스턴스 생성 또는 캐시에서 가져오기
 */
export function createLogger(context: LogContext): Logger {
  if (loggerCache.has(context)) {
    return loggerCache.get(context)!;
  }
  
  const logger = new Logger(context);
  loggerCache.set(context, logger);
  return logger;
}

/**
 * 모든 Logger 캐시 초기화
 */
export function clearLoggerCache(): void {
  loggerCache.clear();
}

// ========================================
// 전역 기본 Logger
// ========================================

export const logger = createLogger("App");

// ========================================
// 편의 함수 (전역 logger 사용)
// ========================================

export function debug(message: string, metadata?: LogMetadata): void {
  logger.debug(message, metadata);
}

export function info(message: string, metadata?: LogMetadata): void {
  logger.info(message, metadata);
}

export function warn(message: string, metadata?: LogMetadata): void {
  logger.warn(message, metadata);
}

export function error(message: string, errorObj?: Error | unknown, metadata?: LogMetadata): void {
  logger.error(message, errorObj, metadata);
}

// ========================================
// 도메인별 Logger 프리셋
// ========================================

export const authLogger = createLogger("Auth");
export const apiLogger = createLogger("API");
export const dataLogger = createLogger("Data");
export const uiLogger = createLogger("UI");
export const routerLogger = createLogger("Router");
export const storageLogger = createLogger("Storage");
export const filterLogger = createLogger("Filter");
export const ganttLogger = createLogger("Gantt");
export const snapshotLogger = createLogger("Snapshot");
export const feedLogger = createLogger("Feed");
