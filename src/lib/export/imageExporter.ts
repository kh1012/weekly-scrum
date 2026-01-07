/**
 * PNG 이미지 Export 기능 (html2canvas 사용)
 */

import type { ExportOptions, ExportProgress } from "./types";
import { downloadFile, generateDefaultFilename, sanitizeFilename } from "./utils";

/**
 * Export를 위해 overflow만 최소 침습적으로 변경
 * 레이아웃(width, height, flex)은 건드리지 않음
 */
function fixOverflowForExport(element: HTMLElement): void {
  // 실제 스크롤이 발생하는 요소만 처리
  const hasVerticalScroll = element.scrollHeight > element.clientHeight;
  const hasHorizontalScroll = element.scrollWidth > element.clientWidth;
  
  if (hasVerticalScroll || hasHorizontalScroll) {
    // overflow만 변경 (레이아웃은 보존)
    element.style.overflow = 'visible';
    element.style.overflowX = 'visible';
    element.style.overflowY = 'visible';
    
    // 내부 콘텐츠가 잘리지 않도록 min 크기만 설정
    // (width/height는 건드리지 않아 flex 레이아웃 보존)
    if (hasHorizontalScroll) {
      element.style.minWidth = `${element.scrollWidth}px`;
    }
    if (hasVerticalScroll) {
      element.style.minHeight = `${element.scrollHeight}px`;
    }
  }
  
  // 자식 요소 재귀 처리
  Array.from(element.children).forEach((child) => {
    if (child instanceof HTMLElement) {
      fixOverflowForExport(child);
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

    // overflow 스타일만 최소 침습적으로 조정 (레이아웃 보존)
    fixOverflowForExport(clonedElement);

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

