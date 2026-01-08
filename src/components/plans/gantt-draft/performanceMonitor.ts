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

interface FrameDrop {
  timestamp: number;
  fps: number;
  frameDuration: number; // 실제 프레임 소요 시간 (ms)
  severity: "warning" | "critical"; // warning: 30-45fps, critical: <30fps
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private fpsHistory: FPSData[] = [];
  private frameDrops: FrameDrop[] = [];
  private lastFrameTime = performance.now();
  private frameCount = 0;
  private lastLoggedFrameDrop = 0; // 마지막 프레임 드롭 경고 시각 (중복 방지)

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
          const clampedFPS = Math.min(fps, 60); // 60fps 상한선
          
          this.fpsHistory.push({
            timestamp: now,
            fps: clampedFPS,
          });

          // 프레임 드롭 감지 (중복 경고 방지: 1초에 1회만)
          const timeSinceLastLog = now - this.lastLoggedFrameDrop;
          if (timeSinceLastLog > 1000) {
            if (clampedFPS < 30) {
              // Critical: 30fps 미만
              const frameDrop: FrameDrop = {
                timestamp: now,
                fps: clampedFPS,
                frameDuration: delta,
                severity: "critical",
              };
              this.frameDrops.push(frameDrop);
              this.lastLoggedFrameDrop = now;

              console.error(
                `🔴 [Frame Drop] CRITICAL: ${clampedFPS.toFixed(1)}fps (${delta.toFixed(1)}ms/frame)`
              );
            } else if (clampedFPS < 45) {
              // Warning: 30-45fps
              const frameDrop: FrameDrop = {
                timestamp: now,
                fps: clampedFPS,
                frameDuration: delta,
                severity: "warning",
              };
              this.frameDrops.push(frameDrop);
              this.lastLoggedFrameDrop = now;

              if (flags.enableDebugMode) {
                console.warn(
                  `🟡 [Frame Drop] Warning: ${clampedFPS.toFixed(1)}fps (${delta.toFixed(1)}ms/frame)`
                );
              }
            }
          }

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
    // 성공 로그는 제거 - console.log 자체가 성능 오버헤드
    if (duration > 16) {
      console.warn(
        `⚠️ [Performance] ${label} took ${duration.toFixed(2)}ms (>16ms)`
      );
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
    const duration = end - start;

    this.metrics.push({
      label,
      duration,
      timestamp: start,
      type: "scroll",
    });

    // 8ms 초과 시 경고 (스크롤은 더 짧아야 함)
    // 성공 로그는 제거 - console.log 자체가 성능 오버헤드
    if (duration > 8) {
      console.warn(
        `⚠️ [Scroll] ${label} took ${duration.toFixed(2)}ms (>8ms)`
      );
    }

    // 최근 100개만 유지
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }
  }

  /**
   * 모든 메트릭 데이터 반환
   */
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics]; // 복사본 반환
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
   * 프레임 드롭 데이터 조회
   */
  getFrameDrops(): FrameDrop[] {
    return [...this.frameDrops]; // 복사본 반환
  }

  /**
   * 프레임 드롭 통계
   */
  getFrameDropStats() {
    const total = this.frameDrops.length;
    const critical = this.frameDrops.filter(d => d.severity === "critical").length;
    const warning = this.frameDrops.filter(d => d.severity === "warning").length;
    const worstDrop = this.frameDrops.length > 0
      ? this.frameDrops.reduce((worst, current) => 
          current.fps < worst.fps ? current : worst
        )
      : null;

    return {
      total,
      critical,
      warning,
      worstDrop,
    };
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

    // 프레임 드롭 통계
    const frameDropStats = this.getFrameDropStats();
    if (frameDropStats.total > 0) {
      console.log("\n🔴 프레임 드롭 통계:");
      console.log(`  총 발생 횟수: ${frameDropStats.total}회`);
      console.log(`  Critical (<30fps): ${frameDropStats.critical}회`);
      console.log(`  Warning (30-45fps): ${frameDropStats.warning}회`);
      
      if (frameDropStats.worstDrop) {
        const worst = frameDropStats.worstDrop;
        const date = new Date(worst.timestamp);
        console.log(`  최악의 순간: ${worst.fps.toFixed(1)}fps (${worst.frameDuration.toFixed(1)}ms) at ${date.toLocaleTimeString()}`);
      }
      
      console.log("\n프레임 드롭 상세:");
      console.table(
        this.frameDrops.slice(-10).map((drop) => ({
          Time: new Date(drop.timestamp).toLocaleTimeString(),
          FPS: drop.fps.toFixed(1),
          Duration: `${drop.frameDuration.toFixed(1)}ms`,
          Severity: drop.severity === "critical" ? "🔴 Critical" : "🟡 Warning",
        }))
      );
    } else {
      console.log("\n✅ 프레임 드롭 없음 (60fps 안정적)");
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
    this.frameDrops = [];
    this.frameCount = 0;
    this.lastFrameTime = performance.now();
    this.lastLoggedFrameDrop = 0;

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
  (window as any).timelinePerf = {
    getMetrics: () => performanceMonitor.getMetrics(),
    logSummary: () => performanceMonitor.logSummary(),
    reset: () => performanceMonitor.reset(),
    getAverageFPS: () => performanceMonitor.getAverageFPS(),
    getMinFPS: () => performanceMonitor.getMinFPS(),
    getRecentFPS: (seconds?: number) => performanceMonitor.getRecentFPS(seconds),
    // 프레임 드롭 관련
    getFrameDrops: () => performanceMonitor.getFrameDrops(),
    getFrameDropStats: () => performanceMonitor.getFrameDropStats(),
  };
  // 하위 호환성을 위한 별칭
  (window as any).__logPerformance = () => performanceMonitor.logSummary();
  (window as any).__resetPerformance = () => performanceMonitor.reset();
}
