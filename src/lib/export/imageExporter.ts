/**
 * PNG 이미지 Export 기능 (html2canvas 사용)
 */

import type { ExportOptions, ExportProgress } from "./types";
import {
  downloadFile,
  generateDefaultFilename,
  sanitizeFilename,
} from "./utils";

/**
 * Timeline 내부의 실제 콘텐츠 width를 찾기 (Phase 1)
 * style.width가 px 단위로 명시된 요소 중 최대값을 반환
 */
function findTimelineContentWidth(element: HTMLElement): number | null {
  const queue: HTMLElement[] = [element];
  let maxWidth = 0;
  
  console.log("[findTimelineContentWidth] 탐색 시작");
  
  while (queue.length > 0) {
    const el = queue.shift()!;
    
    // style.width가 px 단위로 명시된 요소 찾기
    const styleWidth = el.style.width;
    if (styleWidth && styleWidth.endsWith("px")) {
      const width = parseFloat(styleWidth);
      if (width > maxWidth) {
        maxWidth = width;
        console.log(`[findTimelineContentWidth] 발견: ${width}px (${el.className})`);
      }
    }
    
    // 자식들 큐에 추가
    for (const child of Array.from(el.children)) {
      if (child instanceof HTMLElement) {
        queue.push(child);
      }
    }
  }
  
  console.log(`[findTimelineContentWidth] 최종 결과: ${maxWidth || null}`);
  return maxWidth > 0 ? maxWidth : null;
}

/**
 * Timeline width를 전체 컨테이너에 적용 (Phase 2)
 * Tree Panel은 건드리지 않고, Timeline 영역만 확장
 */
function applyTimelineWidth(element: HTMLElement, timelineWidth: number): void {
  console.log(`[applyTimelineWidth] 적용 시작: ${timelineWidth}px`);
  
  let treePanelWidth = 0;
  let appliedCount = 0;
  
  // 1단계: Tree Panel의 width 찾기 (flex-shrink-0인 첫 번째 자식)
  for (const child of Array.from(element.children)) {
    if (child instanceof HTMLElement) {
      const computed = window.getComputedStyle(child);
      if (computed.flexShrink === "0") {
        treePanelWidth = child.offsetWidth;
        console.log(`[applyTimelineWidth] Tree Panel 발견: ${treePanelWidth}px`);
        break;
      }
    }
  }
  
  // 2단계: 최상위 컨테이너는 Tree + Timeline width로 설정
  const totalWidth = treePanelWidth + timelineWidth;
  element.style.setProperty("width", `${totalWidth}px`, "important");
  element.style.setProperty("min-width", `${totalWidth}px`, "important");
  console.log(`[applyTimelineWidth] 최상위 컨테이너: ${totalWidth}px (Tree ${treePanelWidth}px + Timeline ${timelineWidth}px)`);
  
  // 3단계: Timeline 영역만 확장 (Tree Panel은 스킵)
  const traverse = (el: HTMLElement, skipFirst: boolean = false) => {
    const computed = window.getComputedStyle(el);
    
    // Tree Panel (flex-shrink-0)은 건드리지 않기
    if (skipFirst && computed.flexShrink === "0") {
      console.log(`[applyTimelineWidth] Tree Panel 스킵: ${el.className}`);
      return; // 자식도 처리하지 않음
    }
    
    // flex-1 또는 overflow가 있는 Timeline 관련 요소만 처리
    const isFlexGrow = computed.flex && computed.flex.includes("1");
    const hasOverflow = computed.overflow !== "visible" || 
                       computed.overflowX !== "visible";
    
    if (isFlexGrow || hasOverflow) {
      // flex-1 요소는 고정 width로 변경
      if (isFlexGrow) {
        el.style.setProperty("flex", "none", "important");
        el.style.setProperty("width", `${timelineWidth}px`, "important");
        appliedCount++;
      }
      
      // overflow 컨테이너는 visible로 변경
      if (hasOverflow) {
        el.style.setProperty("overflow", "visible", "important");
        el.style.setProperty("overflow-x", "visible", "important");
        el.style.setProperty("overflow-y", "visible", "important");
        appliedCount++;
      }
    }
    
    // 자식 순회
    for (const child of Array.from(el.children)) {
      if (child instanceof HTMLElement) {
        traverse(child, false);
      }
    }
  };
  
  // 최상위의 자식부터 순회 (Tree Panel 체크를 위해 skipFirst=true)
  for (const child of Array.from(element.children)) {
    if (child instanceof HTMLElement) {
      traverse(child, true);
    }
  }
  
  console.log(`[applyTimelineWidth] 적용 완료: ${appliedCount}개 요소 수정됨`);
}

/**
 * Export를 위해 overflow를 강제로 visible로 변경
 * 전체 콘텐츠가 표시되도록 강력하게 처리
 */
function fixOverflowForExport(element: HTMLElement): void {
  const computedStyle = window.getComputedStyle(element);

  // 자식 요소들의 최대 크기 계산
  let maxChildWidth = 0;
  let maxChildHeight = 0;
  Array.from(element.children).forEach((child) => {
    if (child instanceof HTMLElement) {
      // offsetLeft/Top은 relative 부모 기준이므로 정확하지 않을 수 있음
      // style.width를 직접 읽어보기
      const styleWidth = child.style.width;
      const styleHeight = child.style.height;

      if (styleWidth && styleWidth.endsWith("px")) {
        const width = parseFloat(styleWidth);
        maxChildWidth = Math.max(maxChildWidth, width);
      } else {
        const childRight = child.offsetLeft + child.offsetWidth;
        maxChildWidth = Math.max(maxChildWidth, childRight);
      }

      if (styleHeight && styleHeight.endsWith("px")) {
        const height = parseFloat(styleHeight);
        maxChildHeight = Math.max(maxChildHeight, height);
      } else {
        const childBottom = child.offsetTop + child.offsetHeight;
        maxChildHeight = Math.max(maxChildHeight, childBottom);
      }
    }
  });

  // 실제 필요한 크기 계산 (scrollWidth, 자식 크기, style 크기 중 큰 값)
  const requiredWidth = Math.max(
    element.scrollWidth,
    maxChildWidth,
    element.clientWidth
  );
  const requiredHeight = Math.max(
    element.scrollHeight,
    maxChildHeight,
    element.clientHeight
  );

  // 디버깅 로그 (필요시에만 활성화)
  // console.log(`[fixOverflow] ${element.className}:`, {
  //   current: { width: element.offsetWidth, height: element.offsetHeight },
  //   scroll: { width: element.scrollWidth, height: element.scrollHeight },
  //   maxChild: { width: maxChildWidth, height: maxChildHeight },
  //   required: { width: requiredWidth, height: requiredHeight },
  // });

  // 모든 overflow 속성을 visible로 강제 변경
  if (
    computedStyle.overflow !== "visible" ||
    computedStyle.overflowX !== "visible" ||
    computedStyle.overflowY !== "visible"
  ) {
    element.style.setProperty("overflow", "visible", "important");
    element.style.setProperty("overflow-x", "visible", "important");
    element.style.setProperty("overflow-y", "visible", "important");

    // 스크롤 콘텐츠가 잘리지 않도록 크기 확장
    if (requiredWidth > element.clientWidth) {
      element.style.setProperty("width", `${requiredWidth}px`, "important");
      element.style.setProperty("min-width", `${requiredWidth}px`, "important");
    }
    if (requiredHeight > element.clientHeight) {
      element.style.setProperty("height", `${requiredHeight}px`, "important");
      element.style.setProperty(
        "min-height",
        `${requiredHeight}px`,
        "important"
      );
    }
  }

  // flex-1 요소는 고정 크기로 변경
  if (computedStyle.flex && computedStyle.flex.includes("1")) {
    const targetWidth = Math.max(element.offsetWidth, requiredWidth);
    const targetHeight = Math.max(element.offsetHeight, requiredHeight);

    element.style.setProperty("flex", "none", "important");
    element.style.setProperty("width", `${targetWidth}px`, "important");
    element.style.setProperty("height", `${targetHeight}px`, "important");
  }

  // 자식 요소 재귀 처리 (먼저 처리해야 부모가 올바른 크기를 계산할 수 있음)
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
      high: { scale: 3, textRendering: true },
    };

    const quality = options?.quality || "normal";
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
      await new Promise((resolve) => setTimeout(resolve, 100));
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
      scale,
    });

    const canvas = await html2canvas(element, {
      scale,
      backgroundColor,
      useCORS: true,
      allowTaint: false,
      foreignObjectRendering: false,
      logging: true, // 디버깅을 위해 로깅 활성화
      onclone: (clonedDoc, clonedEl) => {
        console.log("[PNG Export] onclone 호출됨");
        if (clonedEl instanceof HTMLElement) {
          // Phase 1: Timeline의 실제 콘텐츠 width 찾기
          const timelineWidth = findTimelineContentWidth(clonedEl);
          console.log("[PNG Export] Timeline width 발견:", timelineWidth);
          
          // Phase 2: 발견한 width를 전체 컨테이너에 적용
          if (timelineWidth && timelineWidth > clonedEl.scrollWidth) {
            console.log(`[PNG Export] Timeline width 적용: ${timelineWidth}px (기존: ${clonedEl.scrollWidth}px)`);
            applyTimelineWidth(clonedEl, timelineWidth);
            console.log("[PNG Export] Timeline width 적용 완료");
          } else {
            console.log("[PNG Export] Timeline width 적용 불필요 (현재 크기가 충분함)");
          }
          
          // 기존 fixOverflowForExport는 세부 조정(세로 스크롤 등)에 계속 사용
          fixOverflowForExport(clonedEl);
        }
      },
    });

    console.log("[PNG Export] Canvas 생성 완료:", {
      width: canvas.width,
      height: canvas.height,
      type: canvas.constructor.name,
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
              type: b.type,
            });
            resolve(b);
          } else {
            console.error("[PNG Export] Blob 생성 실패");
            reject(new Error("Blob 생성 실패"));
          }
        },
        "image/png",
        1 // 최고 품질
      );
    });

    console.log("[PNG Export] 최종 Blob:", {
      size: blob.size,
      type: blob.type,
      sizeMB: (blob.size / (1024 * 1024)).toFixed(2) + "MB",
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
    throw new Error(
      `PNG Export 실패: ${
        error instanceof Error ? error.message : "알 수 없는 오류"
      }`
    );
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
