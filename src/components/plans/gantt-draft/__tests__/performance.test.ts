/**
 * Timeline 성능 자동화 테스트
 * 
 * 각 최적화가 회귀를 발생시키지 않는지 확인
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { getFeatureFlags, setFeatureFlag, resetFeatureFlags } from '../featureFlags';

describe('Timeline Performance Tests', () => {
  beforeEach(() => {
    // localStorage 초기화
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }
    resetFeatureFlags();
  });

  describe('Feature Flag System', () => {
    it('should default to all flags OFF', () => {
      const flags = getFeatureFlags();
      expect(flags.enableVirtualization).toBe(false);
      expect(flags.enableRAFThrottle).toBe(false);
      expect(flags.enableAdvancedMemo).toBe(false);
      expect(flags.enablePerformanceLogging).toBe(false);
      expect(flags.enableDebugMode).toBe(false);
    });

    it('should persist flags to localStorage', () => {
      setFeatureFlag('enableRAFThrottle', true);
      
      // 새로운 인스턴스에서도 유지되어야 함
      const flags = getFeatureFlags();
      expect(flags.enableRAFThrottle).toBe(true);
    });

    it('should merge with default flags when loading', () => {
      // 일부 flag만 저장
      setFeatureFlag('enableRAFThrottle', true);
      
      const flags = getFeatureFlags();
      // 저장된 flag는 true
      expect(flags.enableRAFThrottle).toBe(true);
      // 저장되지 않은 flag는 기본값(false)
      expect(flags.enableVirtualization).toBe(false);
    });

    it('should reset all flags', () => {
      setFeatureFlag('enableRAFThrottle', true);
      setFeatureFlag('enableVirtualization', true);
      
      resetFeatureFlags();
      
      const flags = getFeatureFlags();
      expect(flags.enableRAFThrottle).toBe(false);
      expect(flags.enableVirtualization).toBe(false);
    });

    it('should handle localStorage errors gracefully', () => {
      // localStorage에 잘못된 JSON 저장
      if (typeof window !== 'undefined') {
        localStorage.setItem('timeline-feature-flags-v1', 'invalid json');
      }
      
      // 에러 없이 기본값 반환해야 함
      const flags = getFeatureFlags();
      expect(flags.enableRAFThrottle).toBe(false);
    });
  });

  describe('Performance Monitor', () => {
    it('should not measure when logging is disabled', () => {
      const { performanceMonitor } = require('../performanceMonitor');
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      let executed = false;
      performanceMonitor.measureRender('test', () => {
        executed = true;
      });
      
      expect(executed).toBe(true);
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should measure when logging is enabled', () => {
      setFeatureFlag('enablePerformanceLogging', true);
      
      // 모듈 재로드
      jest.resetModules();
      const { performanceMonitor } = require('../performanceMonitor');
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      let executed = false;
      performanceMonitor.measureRender('slow-operation', () => {
        executed = true;
        // 16ms 이상 걸리는 작업 시뮬레이션
        const start = Date.now();
        while (Date.now() - start < 20) {
          // busy wait
        }
      });
      
      expect(executed).toBe(true);
      
      consoleSpy.mockRestore();
    });

    it('should calculate FPS correctly', () => {
      setFeatureFlag('enablePerformanceLogging', true);
      
      jest.resetModules();
      const { performanceMonitor } = require('../performanceMonitor');
      
      // FPS는 초기에는 0
      expect(performanceMonitor.getAverageFPS()).toBe(0);
      expect(performanceMonitor.getMinFPS()).toBe(0);
    });
  });

  describe('Regression Tests', () => {
    it('should not break when flags are toggled', () => {
      // 여러 번 토글해도 에러 없어야 함
      setFeatureFlag('enableRAFThrottle', true);
      setFeatureFlag('enableRAFThrottle', false);
      setFeatureFlag('enableRAFThrottle', true);
      
      const flags = getFeatureFlags();
      expect(flags.enableRAFThrottle).toBe(true);
    });

    it('should handle server-side rendering', () => {
      // window가 없는 환경 시뮬레이션
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;
      
      jest.resetModules();
      const { getFeatureFlags } = require('../featureFlags');
      
      // 에러 없이 기본값 반환
      const flags = getFeatureFlags();
      expect(flags.enableRAFThrottle).toBe(false);
      
      // 복원
      global.window = originalWindow;
    });
  });
});

