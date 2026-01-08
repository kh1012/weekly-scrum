/**
 * RequestAnimationFrame 기반 스로틀링 Hook
 * 
 * 연속된 함수 호출을 RAF로 스로틀링하여 프레임당 1회만 실행
 * Feature Flag가 OFF면 원본 함수를 그대로 실행하여 사이드 이펙트 없음
 * 
 * @example
 * const throttledHandler = useRAFThrottle((e: MouseEvent) => {
 *   console.log('Mouse position:', e.clientX, e.clientY);
 * });
 */

import { useRef, useCallback, useEffect } from 'react';
import { getFeatureFlags } from '../featureFlags';
import { performanceMonitor } from '../performanceMonitor';

export function useRAFThrottle<T extends (...args: any[]) => void>(
  callback: T
): T {
  // RAF ID를 저장하는 ref
  const rafIdRef = useRef<number | null>(null);
  
  // 가장 최근 호출 인자를 저장 (여러 번 호출되면 마지막 인자만 사용)
  const latestArgsRef = useRef<any[]>([]);
  
  // callback을 ref에 저장 (closure 문제 방지)
  const callbackRef = useRef(callback);

  // callback이 변경되면 ref 업데이트
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // 스로틀링된 함수
  const throttledCallback = useCallback((...args: any[]) => {
    const flags = getFeatureFlags();
    
    // Feature Flag가 꺼져있으면 원본 함수 즉시 실행
    if (!flags.enableRAFThrottle) {
      callbackRef.current(...args);
      return;
    }

    // 디버그 모드일 때만 호출 횟수 로깅 (1초에 1회만)
    if (flags.enableDebugMode) {
      const now = performance.now();
      const lastLogKey = '__lastRAFLog';
      const lastLog = (globalThis as any)[lastLogKey] || 0;
      
      if (now - lastLog > 1000) { // 1초마다만 로깅
        console.log('[RAF] Function call queued');
        (globalThis as any)[lastLogKey] = now;
      }
    }

    // 최신 인자 저장
    latestArgsRef.current = args;

    // 이미 RAF가 예약되어 있으면 스킵 (중복 방지)
    if (rafIdRef.current !== null) {
      return;
    }

    // RAF 예약
    rafIdRef.current = requestAnimationFrame(() => {
      const flags = getFeatureFlags();
      
      if (flags.enablePerformanceLogging) {
        // 성능 로깅이 켜져있으면 측정
        performanceMonitor.measureScroll('RAF Throttled Call', () => {
          callbackRef.current(...latestArgsRef.current);
        });
      } else {
        // 성능 로깅이 꺼져있으면 직접 실행 (오버헤드 제거)
        callbackRef.current(...latestArgsRef.current);
      }
      
      // RAF ID 초기화 (다음 호출 허용)
      rafIdRef.current = null;
    });
  }, []);

  // Cleanup: 컴포넌트 언마운트 시 pending RAF 취소
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, []);

  return throttledCallback as T;
}

