import { renderHook, act } from '@testing-library/react';
import { useRAFThrottle } from '../useRAFThrottle';
import { setFeatureFlag, resetFeatureFlags } from '../../featureFlags';

describe('useRAFThrottle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }
    resetFeatureFlags();
    
    // requestAnimationFrame mock
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });
    
    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should call function immediately when flag is OFF', () => {
    setFeatureFlag('enableRAFThrottle', false);
    
    const mockFn = jest.fn();
    const { result } = renderHook(() => useRAFThrottle(mockFn));
    
    act(() => {
      result.current(1, 2, 3);
    });
    
    expect(mockFn).toHaveBeenCalledWith(1, 2, 3);
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
  });

  it('should throttle with RAF when flag is ON', () => {
    setFeatureFlag('enableRAFThrottle', true);
    
    const mockFn = jest.fn();
    const { result } = renderHook(() => useRAFThrottle(mockFn));
    
    act(() => {
      result.current(1, 2, 3);
    });
    
    expect(window.requestAnimationFrame).toHaveBeenCalled();
    expect(mockFn).toHaveBeenCalledWith(1, 2, 3);
  });

  it('should use latest arguments when called multiple times', () => {
    setFeatureFlag('enableRAFThrottle', true);
    
    const mockFn = jest.fn();
    const { result } = renderHook(() => useRAFThrottle(mockFn));
    
    act(() => {
      result.current(1);
      result.current(2);
      result.current(3); // 마지막 호출만 사용되어야 함
    });
    
    // RAF가 실행되면 마지막 인자로 호출
    expect(mockFn).toHaveBeenCalledWith(3);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should cancel RAF on unmount', () => {
    setFeatureFlag('enableRAFThrottle', true);
    
    // RAF가 즉시 실행되지 않도록 mock 변경
    (window.requestAnimationFrame as jest.Mock).mockImplementation((cb: FrameRequestCallback) => {
      return 123; // RAF ID 반환
    });
    
    const mockFn = jest.fn();
    const { result, unmount } = renderHook(() => useRAFThrottle(mockFn));
    
    act(() => {
      result.current(1, 2, 3);
    });
    
    // unmount 시 cancelAnimationFrame 호출되어야 함
    unmount();
    
    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(123);
  });

  it('should update callback ref when callback changes', () => {
    setFeatureFlag('enableRAFThrottle', false);
    
    const mockFn1 = jest.fn();
    const mockFn2 = jest.fn();
    
    const { result, rerender } = renderHook(
      ({ callback }) => useRAFThrottle(callback),
      { initialProps: { callback: mockFn1 } }
    );
    
    act(() => {
      result.current(1);
    });
    
    expect(mockFn1).toHaveBeenCalledWith(1);
    expect(mockFn2).not.toHaveBeenCalled();
    
    // callback 변경
    rerender({ callback: mockFn2 });
    
    act(() => {
      result.current(2);
    });
    
    expect(mockFn2).toHaveBeenCalledWith(2);
  });

  it('should not queue multiple RAF when called rapidly', () => {
    setFeatureFlag('enableRAFThrottle', true);
    
    // RAF가 즉시 실행되지 않도록 mock 변경
    let rafCallback: FrameRequestCallback | null = null;
    (window.requestAnimationFrame as jest.Mock).mockImplementation((cb: FrameRequestCallback) => {
      rafCallback = cb;
      return 123;
    });
    
    const mockFn = jest.fn();
    const { result } = renderHook(() => useRAFThrottle(mockFn));
    
    act(() => {
      result.current(1);
      result.current(2);
      result.current(3);
    });
    
    // RAF는 한 번만 호출되어야 함
    expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);
    
    // RAF 콜백 실행
    act(() => {
      if (rafCallback) rafCallback(0);
    });
    
    // 마지막 인자로 한 번만 실행
    expect(mockFn).toHaveBeenCalledWith(3);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should work with different argument types', () => {
    setFeatureFlag('enableRAFThrottle', false);
    
    const mockFn = jest.fn();
    const { result } = renderHook(() => useRAFThrottle(mockFn));
    
    const obj = { x: 1, y: 2 };
    const arr = [1, 2, 3];
    
    act(() => {
      result.current(obj, arr, 'string', 123, true);
    });
    
    expect(mockFn).toHaveBeenCalledWith(obj, arr, 'string', 123, true);
  });
});

