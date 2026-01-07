/**
 * PNG 이미지 Export 기능 (html2canvas 사용)
 */

import type { ExportOptions, ExportProgress } from "./types";
import { downloadFile, generateDefaultFilename, sanitizeFilename } from "./utils";

/**
 * Export를 위해 overflow를 강제로 visible로 변경
 * 전체 콘텐츠가 표시되도록 강력하게 처리
 */
function fixOverflowForExport(element: HTMLElement): void {
  const computedStyle = window.getComputedStyle(element);
  
  // 모든 overflow 속성을 visible로 강제 변경
  if (
    computedStyle.overflow !== 'visible' ||
    computedStyle.overflowX !== 'visible' ||
    computedStyle.overflowY !== 'visible'
  ) {
    element.style.setProperty('overflow', 'visible', 'important');
    element.style.setProperty('overflow-x', 'visible', 'important');
    element.style.setProperty('overflow-y', 'visible', 'important');
    
    // 스크롤 콘텐츠가 잘리지 않도록 크기 확장
    if (element.scrollWidth > element.clientWidth) {
      element.style.setProperty('width', `${element.scrollWidth}px`, 'important');
    }
    if (element.scrollHeight > element.clientHeight) {
      element.style.setProperty('height', `${element.scrollHeight}px`, 'important');
    }
  }
  
  // flex-1 요소는 고정 크기로 변경
  if (computedStyle.flex && computedStyle.flex.includes('1')) {
    const currentHeight = element.offsetHeight;
    const currentWidth = element.offsetWidth;
    element.style.setProperty('flex', 'none', 'important');
    element.style.setProperty('width', `${Math.max(currentWidth, element.scrollWidth)}px`, 'important');
    element.style.setProperty('height', `${Math.max(currentHeight, element.scrollHeight)}px`, 'important');
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
        progress: 20,
        completed: false,
      });
      await document.fonts.ready;
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 4. 캡처 준비
    onProgress?.({
      step: "이미지 생성 중...",
      progress: 40,
      completed: false,
    });

    // 5. 원본 요소를 직접 캡처 (이중 복제 방지)
    console.log("[PNG Export] 캡처 시작:", {
      element: element.tagName,
      width: element.scrollWidth,
      height: element.scrollHeight,
      scale
    });

    const canvas = await html2canvas(element, {
      scale,
      backgroundColor,
      useCORS: true,
      allowTaint: false,
      foreignObjectRendering: false,
      logging: true,  // 디버깅을 위해 로깅 활성화
      onclone: (clonedDoc, clonedEl) => {
        console.log("[PNG Export] onclone 호출됨");
        // html2canvas가 복제한 요소에서만 overflow 조정
        // CSS/스타일은 그대로 유지 (computed style 활용)
        if (clonedEl instanceof HTMLElement) {
          fixOverflowForExport(clonedEl);
        }
      }
    });

    console.log("[PNG Export] Canvas 생성 완료:", {
      width: canvas.width,
      height: canvas.height,
      type: canvas.constructor.name
    });

    onProgress?.({
      step: "파일 생성 중...",
      progress: 70,
      completed: false,
    });

    // 6. Canvas를 Blob으로 변환
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) {
            console.log("[PNG Export] Blob 생성 성공:", {
              size: b.size,
              type: b.type
            });
            resolve(b);
          } else {
            console.error("[PNG Export] Blob 생성 실패");
            reject(new Error("Blob 생성 실패"));
          }
        },
        "image/png",
        1  // 최고 품질
      );
    });

    console.log("[PNG Export] 최종 Blob:", {
      size: blob.size,
      type: blob.type,
      sizeMB: (blob.size / (1024 * 1024)).toFixed(2) + "MB"
    });

    onProgress?.({
      step: "다운로드 중...",
      progress: 90,
      completed: false,
    });

    // 7. 파일명 결정
    const filename = options?.filename
      ? sanitizeFilename(options.filename)
      : generateDefaultFilename("screenshot", "png");

    // 8. 다운로드
    downloadFile(blob, filename, "image/png");

    onProgress?.({
      step: "완료",
      progress: 100,
      completed: true,
    });
  } catch (error) {
    console.error("PNG Export 실패:", error);
    throw new Error(`PNG Export 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
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

