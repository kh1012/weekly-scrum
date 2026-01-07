/**
 * PNG 이미지 Export 기능 (html2canvas 사용)
 */

import type { ExportOptions, ExportProgress } from "./types";
import { downloadFile, generateDefaultFilename, sanitizeFilename } from "./utils";

/**
 * 요소의 모든 자식을 순회하며 overflow 스타일을 visible로 변경
 */
function expandAllOverflowContainers(element: HTMLElement): void {
  // 현재 요소의 computed style 확인
  const computedStyle = window.getComputedStyle(element);
  const overflow = computedStyle.overflow;
  const overflowX = computedStyle.overflowX;
  const overflowY = computedStyle.overflowY;

  // overflow가 auto, scroll, hidden인 경우 visible로 변경
  if (
    overflow !== 'visible' ||
    overflowX !== 'visible' ||
    overflowY !== 'visible'
  ) {
    element.style.overflow = 'visible';
    element.style.overflowX = 'visible';
    element.style.overflowY = 'visible';
    element.style.height = 'auto';
    element.style.maxHeight = 'none';
    element.style.width = 'auto';
    element.style.maxWidth = 'none';
  }

  // flex-1 같은 클래스가 있는 경우도 처리
  if (element.style.flex || computedStyle.flex) {
    element.style.flex = 'none';
  }

  // 모든 자식 요소에 대해 재귀적으로 처리
  Array.from(element.children).forEach((child) => {
    if (child instanceof HTMLElement) {
      expandAllOverflowContainers(child);
    }
  });
}

/**
 * HTML 요소를 PNG 이미지로 캡처
 * 
 * @param element - 캡처할 HTML 요소
 * @param options - Export 옵션
 * @param onProgress - 진행률 콜백
 */
export async function exportPNG(
  element: HTMLElement,
  options?: ExportOptions,
  onProgress?: (progress: ExportProgress) => void
): Promise<void> {
  let clonedElement: HTMLElement | null = null;

  try {
    // 1. html2canvas 동적 import
    onProgress?.({
      step: "라이브러리 로딩 중...",
      progress: 10,
      completed: false,
    });

    const html2canvas = (await import("html2canvas")).default;

    // 2. 품질 설정 매핑
    const qualityPresets = {
      low: { scale: 1, textRendering: false },
      normal: { scale: 2, textRendering: true },
      high: { scale: 3, textRendering: true }
    };
    
    const quality = options?.quality || 'normal';
    const preset = qualityPresets[quality];
    const scale = options?.pngOptions?.scale || preset.scale;
    const backgroundColor = options?.pngOptions?.backgroundColor || "#ffffff";

    // 3. 폰트 로딩 대기 (기본/고품질에서만)
    if (preset.textRendering) {
      onProgress?.({
        step: "폰트 로딩 중...",
        progress: 15,
        completed: false,
      });
      await document.fonts.ready;
      // 추가 대기 시간 (폰트 렌더링 안정화)
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 4. Export 전용 DOM 생성
    onProgress?.({
      step: "캡처 영역 준비 중...",
      progress: 25,
      completed: false,
    });

    // 원본 요소 복제
    clonedElement = element.cloneNode(true) as HTMLElement;
    
    // 복제된 요소를 화면 밖에 배치
    clonedElement.style.position = 'fixed';
    clonedElement.style.left = '-9999px';
    clonedElement.style.top = '0';
    clonedElement.style.zIndex = '-1';
    clonedElement.style.pointerEvents = 'none';
    
    // body에 추가
    document.body.appendChild(clonedElement);

    // 모든 overflow 컨테이너 확장
    expandAllOverflowContainers(clonedElement);

    // 폰트 재로딩 대기 (복제된 DOM에 대해)
    if (preset.textRendering) {
      await document.fonts.ready;
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 5. 캡처 옵션 설정 및 실행
    onProgress?.({
      step: "이미지 생성 중...",
      progress: 40,
      completed: false,
    });

    // 전체 콘텐츠 크기 계산 (복제된 요소 기준)
    const actualWidth = clonedElement.scrollWidth;
    const actualHeight = clonedElement.scrollHeight;

    // 6. 캡처 실행
    const canvas = await html2canvas(clonedElement, {
      scale,
      backgroundColor,
      useCORS: true,
      allowTaint: false,
      foreignObjectRendering: false,
      logging: false,
      width: actualWidth,
      height: actualHeight,
      scrollX: 0,
      scrollY: 0,
      windowWidth: actualWidth,
      windowHeight: actualHeight,
      x: 0,
      y: 0,
    });

    onProgress?.({
      step: "파일 생성 중...",
      progress: 70,
      completed: false,
    });

    // 7. Canvas를 Blob으로 변환
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error("Blob 생성 실패"));
        },
        "image/png",
        options?.pngOptions?.quality || 1
      );
    });

    onProgress?.({
      step: "다운로드 중...",
      progress: 90,
      completed: false,
    });

    // 8. 파일명 결정
    const filename = options?.filename
      ? sanitizeFilename(options.filename)
      : generateDefaultFilename("screenshot", "png");

    // 9. 다운로드
    downloadFile(blob, filename, "image/png");

    onProgress?.({
      step: "완료",
      progress: 100,
      completed: true,
    });
  } catch (error) {
    console.error("PNG Export 실패:", error);
    throw new Error(`PNG Export 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
  } finally {
    // 10. 임시 DOM 정리
    if (clonedElement && clonedElement.parentNode) {
      document.body.removeChild(clonedElement);
    }
  }
}

/**
 * 전체 페이지 (스크롤 포함) PNG 캡처
 */
export async function exportFullPagePNG(
  options?: ExportOptions,
  onProgress?: (progress: ExportProgress) => void
): Promise<void> {
  const element = document.documentElement;
  return exportPNG(element, options, onProgress);
}

/**
 * 특정 영역 PNG 캡처 (셀렉터 기반)
 */
export async function exportElementPNG(
  selector: string,
  options?: ExportOptions,
  onProgress?: (progress: ExportProgress) => void
): Promise<void> {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) {
    throw new Error(`요소를 찾을 수 없습니다: ${selector}`);
  }
  return exportPNG(element, options, onProgress);
}

