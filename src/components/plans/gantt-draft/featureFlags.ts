/**
 * Timeline 성능 최적화 Feature Flags
 *
 * 각 최적화를 개별적으로 활성화/비활성화할 수 있습니다.
 * localStorage에 저장되며, 개발자 도구에서 쉽게 토글 가능합니다.
 *
 * @example
 * // 브라우저 콘솔에서:
 * __toggleTimelineFlag('enableVirtualization', true);  // 가상화 켜기
 * __getTimelineFlags(); // 현재 설정 확인
 */

export interface TimelineFeatureFlags {
  /** 가상 스크롤링 활성화 (Phase 2) */
  enableVirtualization: boolean;

  /** RAF 스로틀링 활성화 (Phase 1) */
  enableRAFThrottle: boolean;

  /** 고급 메모이제이션 활성화 (Phase 3) */
  enableAdvancedMemo: boolean;

  /** 성능 측정 로깅 활성화 (디버깅용) */
  enablePerformanceLogging: boolean;

  /** 추가 디버그 정보 출력 */
  enableDebugMode: boolean;
}

// 기본값: 모든 최적화 비활성화 (안전)
const DEFAULT_FLAGS: TimelineFeatureFlags = {
  enableVirtualization: false,
  enableRAFThrottle: false,
  enableAdvancedMemo: false,
  enablePerformanceLogging: false,
  enableDebugMode: false,
};

const STORAGE_KEY = "timeline-feature-flags-v1";
const BACKUP_STORAGE_KEY = "timeline-feature-flags-backup";

// 옵션 이름 매핑 (사용자 친화적)
const FLAG_DISPLAY_NAMES: Record<keyof TimelineFeatureFlags, string> = {
  enableRAFThrottle: "RAF 스로틀링",
  enableVirtualization: "가상화",
  enableAdvancedMemo: "고급 메모이제이션",
  enablePerformanceLogging: "성능 로깅",
  enableDebugMode: "디버그 모드",
};

/**
 * 현재 설정된 Feature Flags 조회
 */
export function getFeatureFlags(): TimelineFeatureFlags {
  // 서버 사이드에서는 기본값 반환
  if (typeof window === "undefined") {
    return DEFAULT_FLAGS;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // 기본값과 병합 (새로운 flag가 추가되어도 안전)
      return { ...DEFAULT_FLAGS, ...parsed };
    }
  } catch (error) {
    console.warn("[FeatureFlags] Failed to load:", error);
    // 에러 발생 시 안전하게 기본값 반환
    return DEFAULT_FLAGS;
  }

  return DEFAULT_FLAGS;
}

/**
 * 특정 Feature Flag 설정
 */
export function setFeatureFlag<K extends keyof TimelineFeatureFlags>(
  key: K,
  value: TimelineFeatureFlags[K]
): void {
  if (typeof window === "undefined") {
    console.warn("[FeatureFlags] Cannot set flags on server side");
    return;
  }

  const flags = getFeatureFlags();
  flags[key] = value;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));

    // 콘솔에 명확한 피드백
    console.log(`✅ [FeatureFlag] ${key} = ${value}`);
    console.log("현재 설정:", flags);
    console.log("💡 페이지를 새로고침하면 적용됩니다.");
  } catch (error) {
    console.error("[FeatureFlags] Failed to save:", error);
  }
}

/**
 * 모든 Feature Flags 초기화
 */
export function resetFeatureFlags(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log("✅ [FeatureFlags] 모든 설정이 초기화되었습니다.");
    console.log("💡 페이지를 새로고침하세요.");
  } catch (error) {
    console.error("[FeatureFlags] Failed to reset:", error);
  }
}

/**
 * 현재 활성화된 옵션을 백업하고 모든 옵션을 비활성화
 * 작업 시작 시 편집 성능 향상을 위해 사용
 * 
 * @returns 비활성화된 옵션의 사용자 친화적 이름 배열
 */
export function backupAndDisableFlags(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const currentFlags = getFeatureFlags();
    
    // 활성화된 옵션 확인
    const enabledFlags = Object.entries(currentFlags)
      .filter(([_, value]) => value === true)
      .map(([key]) => key as keyof TimelineFeatureFlags);

    // 활성화된 옵션이 없으면 백업하지 않음
    if (enabledFlags.length === 0) {
      return [];
    }

    // 백업 저장
    localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(currentFlags));

    // 모든 옵션 비활성화
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_FLAGS));

    // 비활성화된 옵션의 사용자 친화적 이름 반환
    return enabledFlags.map(key => FLAG_DISPLAY_NAMES[key]);
  } catch (error) {
    console.error("[FeatureFlags] Failed to backup and disable:", error);
    return [];
  }
}

/**
 * 백업된 옵션 상태를 복원하고 백업 삭제
 * 작업 종료 시 사용
 * 
 * @returns 복원된 옵션의 사용자 친화적 이름 배열
 */
export function restoreBackupFlags(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const backup = localStorage.getItem(BACKUP_STORAGE_KEY);
    
    // 백업이 없으면 복원하지 않음
    if (!backup) {
      return [];
    }

    const backupFlags = JSON.parse(backup) as TimelineFeatureFlags;
    
    // 복원된 옵션 중 활성화된 것 확인
    const restoredFlags = Object.entries(backupFlags)
      .filter(([_, value]) => value === true)
      .map(([key]) => key as keyof TimelineFeatureFlags);

    // 백업 상태 복원
    localStorage.setItem(STORAGE_KEY, backup);

    // 백업 삭제
    localStorage.removeItem(BACKUP_STORAGE_KEY);

    // 복원된 옵션의 사용자 친화적 이름 반환
    return restoredFlags.map(key => FLAG_DISPLAY_NAMES[key]);
  } catch (error) {
    console.error("[FeatureFlags] Failed to restore backup:", error);
    return [];
  }
}

// 개발자 콘솔에서 쉽게 사용할 수 있도록 전역 함수로 노출
if (typeof window !== "undefined") {
  (window as any).__toggleTimelineFlag = setFeatureFlag;
  (window as any).__getTimelineFlags = getFeatureFlags;
  (window as any).__resetTimelineFlags = resetFeatureFlags;

  // 초기 로드 시 안내 메시지 (한 번만)
  const hasShownWelcome = sessionStorage.getItem("timeline-flags-welcome");
  if (!hasShownWelcome) {
    console.log(
      "%c🎯 Timeline Performance Flags",
      "font-size: 16px; font-weight: bold; color: #3b82f6;"
    );
    console.log("사용 가능한 명령어:");
    console.log("  __toggleTimelineFlag(key, value) - Flag 토글");
    console.log("  __getTimelineFlags() - 현재 설정 확인");
    console.log("  __resetTimelineFlags() - 초기화");
    console.log("\n예시:");
    console.log("  __toggleTimelineFlag('enableRAFThrottle', true)");
    sessionStorage.setItem("timeline-flags-welcome", "true");
  }
}
