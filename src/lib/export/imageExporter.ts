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
        console.log(
          `[findTimelineContentWidth] 발견: ${width}px (${el.className})`
        );
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
 * Tree Panel은 건드리지 않고, Timeline 영역의 최상위만 확장
 * 깊이 있는 자식들은 fixOverflowForExport가 자동으로 처리
 */
function applyTimelineWidth(element: HTMLElement, timelineWidth: number): void {
  console.log(`[applyTimelineWidth] 적용 시작: ${timelineWidth}px`);

  let treePanelWidth = 0;
  let timelineContainer: HTMLElement | null = null;

  // 1단계: 직계 자식 중 Tree Panel과 Timeline 컨테이너 찾기
  for (const child of Array.from(element.children)) {
    if (child instanceof HTMLElement) {
      const computed = window.getComputedStyle(child);

      if (computed.flexShrink === "0") {
        // Tree Panel (flex-shrink-0)
        treePanelWidth = child.offsetWidth;
        console.log(
          `[applyTimelineWidth] Tree Panel 발견: ${treePanelWidth}px`
        );
      } else if (computed.flex && computed.flex.includes("1")) {
        // Timeline 컨테이너 (flex-1)
        timelineContainer = child;
        console.log(
          `[applyTimelineWidth] Timeline 컨테이너 발견: ${child.className}`
        );
      }
    }
  }

  if (!timelineContainer) {
    console.warn(`[applyTimelineWidth] Timeline 컨테이너를 찾을 수 없음`);
    return;
  }

  // 2단계: 최상위 컨테이너는 Tree + Timeline width만 설정 (height는 원래대로)
  const totalWidth = treePanelWidth + timelineWidth;
  element.style.setProperty("width", `${totalWidth}px`, "important");
  element.style.setProperty("min-width", `${totalWidth}px`, "important");
  console.log(
    `[applyTimelineWidth] 최상위 컨테이너: ${totalWidth}px (Tree ${treePanelWidth}px + Timeline ${timelineWidth}px)`
  );

  // 3단계: Timeline 컨테이너만 고정 width로 변경 (height는 건드리지 않음)
  timelineContainer.style.setProperty("flex", "none", "important");
  timelineContainer.style.setProperty(
    "width",
    `${timelineWidth}px`,
    "important"
  );
  timelineContainer.style.setProperty(
    "min-width",
    `${timelineWidth}px`,
    "important"
  );

  console.log(
    `[applyTimelineWidth] 적용 완료: Timeline 컨테이너 width만 설정 (overflow는 fixOverflowForExport가 처리)`
  );
}

/**
 * 텍스트 요소의 여백 스타일 디버깅 (최대 5개만 출력)
 */
function debugTextPadding(element: HTMLElement, maxSamples: number = 5): void {
  let count = 0;
  const queue: HTMLElement[] = [element];

  console.log("[debugTextPadding] 텍스트 요소 여백 분석:");

  while (queue.length > 0 && count < maxSamples) {
    const el = queue.shift()!;

    // 텍스트가 있는 요소만 체크 (SPAN, DIV with text)
    if (
      el.textContent &&
      el.textContent.trim() &&
      (el.tagName === "SPAN" || el.tagName === "DIV")
    ) {
      const computed = window.getComputedStyle(el);
      console.log(
        `  ${el.tagName}.${el.className.split(" ")[0] || "(no-class)"}:`,
        {
          text: el.textContent.substring(0, 20) + "...",
          lineHeight: computed.lineHeight,
          padding: `${computed.paddingTop} ${computed.paddingRight} ${computed.paddingBottom} ${computed.paddingLeft}`,
          margin: `${computed.marginTop} ${computed.marginRight} ${computed.marginBottom} ${computed.marginLeft}`,
          fontSize: computed.fontSize,
        }
      );
      count++;
    }

    // 자식 추가
    for (const child of Array.from(el.children)) {
      if (child instanceof HTMLElement) {
        queue.push(child);
      }
    }
  }
}

/**
 * Export를 위해 스크롤 컨테이너의 overflow만 visible로 변경
 * 텍스트 요소(truncate, ellipsis)는 건너뛰어서 스타일 보존
 */
function fixOverflowForExport(element: HTMLElement, depth: number = 0): void {
  const computedStyle = window.getComputedStyle(element);
  const indent = "  ".repeat(depth);

  // 1. text-overflow: ellipsis가 있는 요소는 건너뛰기 (말줄임표 보존)
  if (computedStyle.textOverflow === "ellipsis") {
    console.log(
      `${indent}[fixOverflow] SKIP (ellipsis): ${element.tagName}.${
        element.className.split(" ")[0] || "(no-class)"
      }`
    );
    // 자식은 처리
    Array.from(element.children).forEach((child) => {
      if (child instanceof HTMLElement) {
        fixOverflowForExport(child, depth + 1);
      }
    });
    return;
  }

  // 2. truncate 클래스가 있는 요소는 건너뛰기
  if (element.classList.contains("truncate")) {
    console.log(
      `${indent}[fixOverflow] SKIP (truncate class): ${element.tagName}.${
        element.className.split(" ")[0] || "(no-class)"
      }`
    );
    // 자식은 처리
    Array.from(element.children).forEach((child) => {
      if (child instanceof HTMLElement) {
        fixOverflowForExport(child, depth + 1);
      }
    });
    return;
  }

  // 3. 실제로 스크롤이 필요한 요소만 visible로 변경
  const hasOverflowX = element.scrollWidth > element.clientWidth;
  const hasOverflowY = element.scrollHeight > element.clientHeight;
  const hasOverflowStyle =
    computedStyle.overflow !== "visible" ||
    computedStyle.overflowX !== "visible" ||
    computedStyle.overflowY !== "visible";

  if (hasOverflowStyle && (hasOverflowX || hasOverflowY)) {
    const before = {
      overflow: computedStyle.overflow,
      scroll: `${element.scrollWidth}×${element.scrollHeight}`,
      client: `${element.clientWidth}×${element.clientHeight}`,
    };

    element.style.setProperty("overflow", "visible", "important");
    element.style.setProperty("overflow-x", "visible", "important");
    element.style.setProperty("overflow-y", "visible", "important");

    console.log(
      `${indent}[fixOverflow] ${element.tagName}.${
        element.className.split(" ")[0] || "(no-class)"
      }:`,
      {
        overflow: `${before.overflow} → visible`,
        scroll: before.scroll,
        client: before.client,
      }
    );
  }

  // 자식 요소 재귀 처리
  Array.from(element.children).forEach((child) => {
    if (child instanceof HTMLElement) {
      fixOverflowForExport(child, depth + 1);
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
          // Phase 0: 텍스트 요소의 여백 디버깅 (수정 전 상태)
          debugTextPadding(clonedEl, 3);

          // Phase 1: Timeline의 실제 콘텐츠 width 찾기
          const timelineWidth = findTimelineContentWidth(clonedEl);
          console.log("[PNG Export] Timeline width 발견:", timelineWidth);

          // Phase 2: 발견한 width를 전체 컨테이너에 적용
          if (timelineWidth && timelineWidth > clonedEl.scrollWidth) {
            console.log(
              `[PNG Export] Timeline width 적용: ${timelineWidth}px (기존: ${clonedEl.scrollWidth}px)`
            );
            applyTimelineWidth(clonedEl, timelineWidth);
            console.log("[PNG Export] Timeline width 적용 완료");
          } else {
            console.log(
              "[PNG Export] Timeline width 적용 불필요 (현재 크기가 충분함)"
            );
          }

          // Phase 3: 스크롤 컨테이너의 overflow만 visible로 변경
          // (truncate, ellipsis 요소는 건너뛰어서 스타일 보존)
          fixOverflowForExport(clonedEl);
          console.log(
            "[PNG Export] fixOverflowForExport 완료 (높이는 원래대로 유지)"
          );
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
