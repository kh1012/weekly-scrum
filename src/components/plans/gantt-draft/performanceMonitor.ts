/**
 * Timeline 성능 측정 유틸리티
 *
 * Feature Flag가 활성화된 경우에만 측정 수행하여
 * 프로덕션 환경에서 오버헤드 없음
 */

import { getFeatureFlags } from "./featureFlags";

interface PerformanceMetrics {
  label: string;
  duration: number;
  timestamp: number;
  type: "render" | "scroll" | "interaction";
}

interface FPSData {
  timestamp: number;
  fps: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private fpsHistory: FPSData[] = [];
  private lastFrameTime = performance.now();
  private frameCount = 0;

  // RAF를 위한 ID 저장
  private rafId: number | null = null;

  constructor() {
    // 클라이언트 사이드에서만 FPS 모니터링 시작
    if (typeof window !== "undefined") {
      this.startFPSMonitoring();
    }
  }

  /**
   * FPS 모니터링 시작 (연속적으로 측정)
   * 클라이언트 사이드에서만 실행됨
   */
  private startFPSMonitoring(): void {
    // 서버 사이드에서는 실행하지 않음
    if (
      typeof window === "undefined" ||
      typeof requestAnimationFrame === "undefined"
    ) {
      return;
    }

    const measure = () => {
      const flags = getFeatureFlags();

      if (flags.enablePerformanceLogging) {
        const now = performance.now();
        const delta = now - this.lastFrameTime;

        if (delta > 0) {
          const fps = 1000 / delta;
          this.fpsHistory.push({
            timestamp: now,
            fps: Math.min(fps, 60), // 60fps 상한선
          });

          // 최근 300프레임만 유지 (약 5초)
          if (this.fpsHistory.length > 300) {
            this.fpsHistory.shift();
          }
        }

        this.lastFrameTime = now;
        this.frameCount++;
      }

      // 클라이언트 사이드에서만 RAF 호출
      if (typeof requestAnimationFrame !== "undefined") {
        this.rafId = requestAnimationFrame(measure);
      }
    };

    measure();
  }

  /**
   * 함수 실행 시간 측정
   */
  measureRender(label: string, fn: () => void): void {
    const flags = getFeatureFlags();

    if (!flags.enablePerformanceLogging) {
      fn();
      return;
    }

    const start = performance.now();
    fn();
    const end = performance.now();
    const duration = end - start;

    this.metrics.push({
      label,
      duration,
      timestamp: start,
      type: "render",
    });

    // 16ms 초과 시 경고 (60fps 기준)
    if (duration > 16) {
      console.warn(
        `⚠️ [Performance] ${label} took ${duration.toFixed(2)}ms (>16ms)`
      );
    } else if (flags.enableDebugMode) {
      console.log(`✅ [Performance] ${label}: ${duration.toFixed(2)}ms`);
    }

    // 최근 100개만 유지
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }
  }

  /**
   * 스크롤 이벤트 측정
   */
  measureScroll(label: string, fn: () => void): void {
    const flags = getFeatureFlags();

    if (!flags.enablePerformanceLogging) {
      fn();
      return;
    }

    const start = performance.now();
    fn();
    const end = performance.now();

    this.metrics.push({
      label,
      duration: end - start,
      timestamp: start,
      type: "scroll",
    });
  }

  /**
   * 평균 FPS 계산
   */
  getAverageFPS(): number {
    if (this.fpsHistory.length === 0) return 0;

    const sum = this.fpsHistory.reduce((acc, data) => acc + data.fps, 0);
    return sum / this.fpsHistory.length;
  }

  /**
   * 최소 FPS 계산
   */
  getMinFPS(): number {
    if (this.fpsHistory.length === 0) return 0;

    return Math.min(...this.fpsHistory.map((data) => data.fps));
  }

  /**
   * 최근 N초간의 FPS 평균 계산
   */
  getRecentFPS(seconds: number = 1): number {
    const now = performance.now();
    const cutoff = now - seconds * 1000;

    const recentFrames = this.fpsHistory.filter(
      (data) => data.timestamp >= cutoff
    );

    if (recentFrames.length === 0) return 0;

    const sum = recentFrames.reduce((acc, data) => acc + data.fps, 0);
    return sum / recentFrames.length;
  }

  /**
   * 성능 요약 출력
   */
  logSummary(): void {
    const flags = getFeatureFlags();
    if (!flags.enablePerformanceLogging) {
      console.log("💡 성능 로깅이 비활성화되어 있습니다.");
      console.log("   __toggleTimelineFlag('enablePerformanceLogging', true)");
      return;
    }

    console.group("📊 Performance Summary");

    // FPS 통계
    console.log("FPS 통계:");
    console.log(`  평균: ${this.getAverageFPS().toFixed(1)} fps`);
    console.log(`  최소: ${this.getMinFPS().toFixed(1)} fps`);
    console.log(`  최근 1초: ${this.getRecentFPS(1).toFixed(1)} fps`);
    console.log(`  총 프레임: ${this.frameCount}`);

    // 렌더링 통계
    const renderMetrics = this.metrics.filter((m) => m.type === "render");
    if (renderMetrics.length > 0) {
      const avgRender =
        renderMetrics.reduce((sum, m) => sum + m.duration, 0) /
        renderMetrics.length;
      const maxRender = Math.max(...renderMetrics.map((m) => m.duration));

      console.log("\n렌더링 통계:");
      console.log(`  평균: ${avgRender.toFixed(2)}ms`);
      console.log(`  최대: ${maxRender.toFixed(2)}ms`);
      console.log(
        `  16ms 초과: ${renderMetrics.filter((m) => m.duration > 16).length}회`
      );
    }

    // 최근 10개 이벤트
    const recentMetrics = this.metrics.slice(-10);
    if (recentMetrics.length > 0) {
      console.log("\n최근 이벤트:");
      console.table(
        recentMetrics.map((m) => ({
          Label: m.label,
          Duration: `${m.duration.toFixed(2)}ms`,
          Type: m.type,
        }))
      );
    }

    console.groupEnd();
  }

  /**
   * 통계 초기화
   */
  reset(): void {
    this.metrics = [];
    this.fpsHistory = [];
    this.frameCount = 0;
    this.lastFrameTime = performance.now();

    console.log("✅ [Performance] 통계가 초기화되었습니다.");
  }

  /**
   * 모니터링 중지
   */
  stop(): void {
    if (
      typeof window === "undefined" ||
      typeof cancelAnimationFrame === "undefined"
    ) {
      return;
    }

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}

// 싱글톤 인스턴스
export const performanceMonitor = new PerformanceMonitor();

// React DevTools Profiler 콜백 생성기
export function createProfilerCallback(componentName: string) {
  return (
    id: string,
    phase: "mount" | "update",
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number
  ) => {
    const flags = getFeatureFlags();
    if (!flags.enablePerformanceLogging) return;

    // 16ms 초과 시 경고
    if (actualDuration > 16) {
      console.warn(
        `⚠️ [Profiler] ${componentName} (${phase}) took ${actualDuration.toFixed(
          2
        )}ms`
      );
    } else if (flags.enableDebugMode) {
      console.log(
        `[Profiler] ${componentName} (${phase}): ${actualDuration.toFixed(2)}ms`
      );
    }
  };
}

// 개발자 콘솔에서 사용 가능하도록 노출
if (typeof window !== "undefined") {
  (window as any).__performanceMonitor = performanceMonitor;
  (window as any).__logPerformance = () => performanceMonitor.logSummary();
  (window as any).__logScrollPerformance = () =>
    performanceMonitor.logScrollPerformance();
  (window as any).__checkPerformanceWarnings = () =>
    performanceMonitor.checkPerformanceWarnings();
  (window as any).__resetPerformance = () => performanceMonitor.reset();
}
