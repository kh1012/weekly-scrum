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
 * 타임라인 블록과 텍스트 요소의 스타일 디버깅
 */
function debugTimelineBlocks(element: HTMLElement): void {
  const timelineBlockSamples: any[] = [];
  const textSamples: any[] = [];

  // #region agent log
  // 타임라인 블록 찾기 (가설 F, G)
  const queue: HTMLElement[] = [element];

  while (queue.length > 0) {
    const el = queue.shift()!;
    const computed = window.getComputedStyle(el);

    // 1. absolute positioned 블록 찾기 (타임라인 블록, 높이 > 15px만)
    if (
      computed.position === "absolute" &&
      el.offsetHeight > 15 &&
      timelineBlockSamples.length < 5
    ) {
      const parent = el.parentElement;
      const parentComputed = parent ? window.getComputedStyle(parent) : null;

      timelineBlockSamples.push({
        tag: el.tagName,
        className: el.className.split(" ").slice(0, 3).join(" "),
        position: computed.position,
        top: computed.top,
        left: computed.left,
        width: computed.width,
        height: computed.height,
        transform: computed.transform,
        offsetTop: el.offsetTop,
        offsetLeft: el.offsetLeft,
        offsetWidth: el.offsetWidth,
        offsetHeight: el.offsetHeight,
        paddingTop: computed.paddingTop,
        paddingBottom: computed.paddingBottom,
        paddingLeft: computed.paddingLeft,
        paddingRight: computed.paddingRight,
        marginTop: computed.marginTop,
        marginBottom: computed.marginBottom,
        display: computed.display,
        alignItems: computed.alignItems,
        justifyContent: computed.justifyContent,
        flexDirection: computed.flexDirection,
        gap: computed.gap,
        parentPosition: parentComputed?.position,
        parentDisplay: parentComputed?.display,
      });
    }

    // 2. 텍스트 요소 찾기 (SPAN with text)
    if (
      el.tagName === "SPAN" &&
      el.textContent &&
      el.textContent.trim() &&
      textSamples.length < 8
    ) {
      const parent = el.parentElement;
      const parentComputed = parent ? window.getComputedStyle(parent) : null;
      const grandparent = parent?.parentElement;
      const grandparentComputed = grandparent
        ? window.getComputedStyle(grandparent)
        : null;

      textSamples.push({
        tag: el.tagName,
        className: el.className.split(" ").slice(0, 3).join(" "),
        text: el.textContent.substring(0, 30),
        fontSize: computed.fontSize,
        lineHeight: computed.lineHeight,
        lineHeightNumeric: parseFloat(computed.lineHeight),
        fontSizeNumeric: parseFloat(computed.fontSize),
        lineHeightDiff:
          parseFloat(computed.lineHeight) - parseFloat(computed.fontSize),
        verticalAlign: computed.verticalAlign,
        paddingTop: computed.paddingTop,
        paddingBottom: computed.paddingBottom,
        marginTop: computed.marginTop,
        marginBottom: computed.marginBottom,
        offsetHeight: el.offsetHeight,
        clientHeight: el.clientHeight,
        scrollHeight: el.scrollHeight,
        parentTag: parent?.tagName,
        parentClassName: parent?.className.split(" ").slice(0, 2).join(" "),
        parentDisplay: parentComputed?.display,
        parentAlignItems: parentComputed?.alignItems,
        parentJustifyContent: parentComputed?.justifyContent,
        parentHeight: parent?.offsetHeight,
        parentPaddingTop: parentComputed?.paddingTop,
        parentPaddingBottom: parentComputed?.paddingBottom,
        grandparentPosition: grandparentComputed?.position,
        grandparentHeight: grandparent?.offsetHeight,
      });
    }

    // 자식 추가
    for (const child of Array.from(el.children)) {
      if (child instanceof HTMLElement) {
        queue.push(child);
      }
    }
  }

  const summary = {
    timelineBlocksCount: timelineBlockSamples.length,
    textElementsCount: textSamples.length,
    avgLineHeightDiff:
      textSamples.reduce((sum, s) => sum + (s.lineHeightDiff || 0), 0) /
      Math.max(textSamples.length, 1),
    flexParentCount: textSamples.filter((s) => s.parentDisplay === "flex")
      .length,
    centerAlignCount: textSamples.filter((s) => s.parentAlignItems === "center")
      .length,
  };

  fetch("http://127.0.0.1:7242/ingest/647b972b-6e46-450e-a5cb-b78c984f30b1", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "imageExporter.ts:debugTimelineBlocks",
      message: "Timeline blocks and text elements analysis (v2)",
      data: {
        summary,
        timelineBlocks: timelineBlockSamples,
        textElements: textSamples,
      },
      timestamp: Date.now(),
      sessionId: "debug-session",
      runId: "padding-debug-v2",
      hypothesisId: "F,G,H",
    }),
  }).catch(() => {});
  // #endregion
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

    // #region agent log
    // LOG 3: overflow 변경 전 상태 (가설 C, D)
    const beforeOverflowChange = {
      tag: element.tagName,
      className: element.className.split(" ")[0],
      depth,
      before: {
        offsetHeight: element.offsetHeight,
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight,
        computedHeight: computedStyle.height,
        computedMaxHeight: computedStyle.maxHeight,
        computedFlex: computedStyle.flex,
        overflow: computedStyle.overflow,
      },
    };
    // #endregion

    element.style.setProperty("overflow", "visible", "important");
    element.style.setProperty("overflow-x", "visible", "important");
    element.style.setProperty("overflow-y", "visible", "important");

    // #region agent log
    // LOG 4: overflow 변경 후 상태 (가설 C)
    const afterComputedStyle = window.getComputedStyle(element);
    const afterOverflowChange = {
      tag: element.tagName,
      className: element.className.split(" ")[0],
      depth,
      after: {
        offsetHeight: element.offsetHeight,
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight,
        computedHeight: afterComputedStyle.height,
        overflow: afterComputedStyle.overflow,
      },
      heightChanged:
        element.offsetHeight !== beforeOverflowChange.before.offsetHeight,
    };
    if (depth <= 1 || afterOverflowChange.heightChanged) {
      fetch(
        "http://127.0.0.1:7242/ingest/647b972b-6e46-450e-a5cb-b78c984f30b1",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "imageExporter.ts:fixOverflow",
            message: "Overflow change",
            data: { before: beforeOverflowChange, after: afterOverflowChange },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "post-fix",
            hypothesisId: "C,D",
          }),
        }
      ).catch(() => {});
    }
    // #endregion

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
          // Phase 0: 텍스트 여백 보정 (영역별 미세 조정 + 부모 padding-top 추가)
          console.log("[PNG Export] 텍스트 여백 보정 시작");
          const allElements = clonedEl.querySelectorAll("*");
          const adjustments = {
            timelineBlock: 0,
            treePanel: 0,
            header: 0,
            other: 0,
          };
          const parentsPadded = new Set<HTMLElement>();

          allElements.forEach((el) => {
            if (el instanceof HTMLElement) {
              const computed = window.getComputedStyle(el);
              const hasText =
                el.textContent && el.textContent.trim().length > 0;

              // SPAN 텍스트 요소만 타겟팅하여 위로 이동
              if (el.tagName === "SPAN" && hasText) {
                // 영역 구분 및 offset 결정 (기존보다 50% 감소)
                let offset = 5; // 기본값 (14px → 5px)
                let area = "other";

                // 부모 요소 탐색
                let parent = el.parentElement;
                let depth = 0;
                while (parent && depth < 5) {
                  const parentComputed = window.getComputedStyle(parent);

                  // 1. 타임라인 블록 (absolute positioned parent)
                  if (parentComputed.position === "absolute") {
                    offset = 4; // 타임라인 블록 (12px → 4px)
                    area = "timelineBlock";
                    
                    // 부모에 padding-top 추가 (텍스트가 잘리지 않도록)
                    if (!parentsPadded.has(parent)) {
                      const currentPadding = parseFloat(parentComputed.paddingTop) || 0;
                      parent.style.setProperty(
                        "padding-top",
                        `${currentPadding + 4}px`,
                        "important"
                      );
                      parentsPadded.add(parent);
                    }
                    break;
                  }

                  // 2. 트리 패널 (flex-shrink-0 또는 특정 클래스)
                  if (
                    parentComputed.flexShrink === "0" ||
                    parent.className.includes("tree") ||
                    parent.className.includes("panel")
                  ) {
                    offset = 3; // 트리 패널 (10px → 3px)
                    area = "treePanel";
                    
                    if (!parentsPadded.has(parent)) {
                      const currentPadding = parseFloat(parentComputed.paddingTop) || 0;
                      parent.style.setProperty(
                        "padding-top",
                        `${currentPadding + 3}px`,
                        "important"
                      );
                      parentsPadded.add(parent);
                    }
                    break;
                  }

                  // 3. 헤더 영역
                  if (
                    parent.tagName === "HEADER" ||
                    parent.className.includes("header") ||
                    parent.className.includes("title")
                  ) {
                    offset = 2; // 헤더 (8px → 2px)
                    area = "header";
                    
                    if (!parentsPadded.has(parent)) {
                      const currentPadding = parseFloat(parentComputed.paddingTop) || 0;
                      parent.style.setProperty(
                        "padding-top",
                        `${currentPadding + 2}px`,
                        "important"
                      );
                      parentsPadded.add(parent);
                    }
                    break;
                  }

                  parent = parent.parentElement;
                  depth++;
                }

                // position: relative가 아닌 경우에만 설정
                if (computed.position === "static") {
                  el.style.setProperty("position", "relative", "important");
                }
                el.style.setProperty("top", `-${offset}px`, "important");

                // 통계
                adjustments[area as keyof typeof adjustments]++;
              }
            }
          });

          console.log(
            `[PNG Export] 텍스트 여백 보정 완료:`,
            adjustments,
            `(timeline: 4px, tree: 3px, header: 2px, other: 5px), 부모 padding: ${parentsPadded.size}개`
          );

          // #region agent log
          // LOG 1: 초기 상태 측정 (가설 A, B)
          const initialState = {
            topContainer: {
              offsetHeight: clonedEl.offsetHeight,
              scrollHeight: clonedEl.scrollHeight,
              clientHeight: clonedEl.clientHeight,
              computedHeight: window.getComputedStyle(clonedEl).height,
            },
            children: Array.from(clonedEl.children)
              .map((child, idx) => {
                if (child instanceof HTMLElement) {
                  const computed = window.getComputedStyle(child);
                  return {
                    idx,
                    tag: child.tagName,
                    className: child.className.split(" ")[0],
                    offsetHeight: child.offsetHeight,
                    scrollHeight: child.scrollHeight,
                    clientHeight: child.clientHeight,
                    computedHeight: computed.height,
                    computedMaxHeight: computed.maxHeight,
                    computedFlex: computed.flex,
                  };
                }
                return null;
              })
              .filter(Boolean),
          };
          fetch(
            "http://127.0.0.1:7242/ingest/647b972b-6e46-450e-a5cb-b78c984f30b1",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                location: "imageExporter.ts:onclone-initial",
                message: "Initial state before fixOverflow",
                data: initialState,
                timestamp: Date.now(),
                sessionId: "debug-session",
                runId: "post-fix",
                hypothesisId: "A,B",
              }),
            }
          ).catch(() => {});
          // #endregion

          // Phase 0: 타임라인 블록과 텍스트 요소의 스타일 디버깅
          debugTimelineBlocks(clonedEl);

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
          console.log("[PNG Export] fixOverflowForExport 완료");

          // Phase 4: 높이 확장 - 자식들의 scrollHeight를 기반으로 부모 확장
          let maxScrollHeight = 0;
          const childrenToExpand: Array<{
            element: HTMLElement;
            scrollHeight: number;
          }> = [];

          for (const child of Array.from(clonedEl.children)) {
            if (child instanceof HTMLElement) {
              const scrollHeight = child.scrollHeight;
              maxScrollHeight = Math.max(maxScrollHeight, scrollHeight);

              if (scrollHeight > child.offsetHeight) {
                childrenToExpand.push({ element: child, scrollHeight });
              }
            }
          }

          // 직계 자식들의 높이 확장
          for (const { element, scrollHeight } of childrenToExpand) {
            element.style.setProperty(
              "height",
              `${scrollHeight}px`,
              "important"
            );
            element.style.setProperty(
              "min-height",
              `${scrollHeight}px`,
              "important"
            );
            element.style.setProperty("max-height", "none", "important");
            console.log(
              `[PNG Export] 자식 높이 확장: ${
                element.className.split(" ")[0]
              } ${element.offsetHeight}px → ${scrollHeight}px`
            );
          }

          // 최상위 컨테이너 높이 확장
          if (maxScrollHeight > clonedEl.offsetHeight) {
            clonedEl.style.setProperty(
              "height",
              `${maxScrollHeight}px`,
              "important"
            );
            clonedEl.style.setProperty(
              "min-height",
              `${maxScrollHeight}px`,
              "important"
            );
            clonedEl.style.setProperty("max-height", "none", "important");
            console.log(
              `[PNG Export] 최상위 컨테이너 높이 확장: ${clonedEl.offsetHeight}px → ${maxScrollHeight}px`
            );
          }

          // #region agent log
          // LOG 2: fixOverflow 후 상태 측정 (가설 A, C)
          const postFixState = {
            topContainer: {
              offsetHeight: clonedEl.offsetHeight,
              scrollHeight: clonedEl.scrollHeight,
              clientHeight: clonedEl.clientHeight,
              computedHeight: window.getComputedStyle(clonedEl).height,
              computedOverflow: window.getComputedStyle(clonedEl).overflow,
            },
            children: Array.from(clonedEl.children)
              .map((child, idx) => {
                if (child instanceof HTMLElement) {
                  const computed = window.getComputedStyle(child);
                  return {
                    idx,
                    offsetHeight: child.offsetHeight,
                    scrollHeight: child.scrollHeight,
                    clientHeight: child.clientHeight,
                    computedHeight: computed.height,
                    computedOverflow: computed.overflow,
                  };
                }
                return null;
              })
              .filter(Boolean),
          };
          fetch(
            "http://127.0.0.1:7242/ingest/647b972b-6e46-450e-a5cb-b78c984f30b1",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                location: "imageExporter.ts:onclone-postfix",
                message: "State after fixOverflow and height expansion",
                data: postFixState,
                timestamp: Date.now(),
                sessionId: "debug-session",
                runId: "post-fix",
                hypothesisId: "A,C",
              }),
            }
          ).catch(() => {});
          // #endregion

          // #region agent log
          // LOG 6: html2canvas 직전 최종 상태 (모든 가설 종합)
          const finalState = {
            topContainer: {
              tagName: clonedEl.tagName,
              offsetWidth: clonedEl.offsetWidth,
              offsetHeight: clonedEl.offsetHeight,
              scrollWidth: clonedEl.scrollWidth,
              scrollHeight: clonedEl.scrollHeight,
              clientWidth: clonedEl.clientWidth,
              clientHeight: clonedEl.clientHeight,
              boundingRect: {
                width: clonedEl.getBoundingClientRect().width,
                height: clonedEl.getBoundingClientRect().height,
              },
              computedStyle: {
                width: window.getComputedStyle(clonedEl).width,
                height: window.getComputedStyle(clonedEl).height,
                maxHeight: window.getComputedStyle(clonedEl).maxHeight,
                overflow: window.getComputedStyle(clonedEl).overflow,
              },
            },
            expectedCanvasHeight: Math.max(
              clonedEl.offsetHeight,
              clonedEl.scrollHeight,
              Array.from(clonedEl.children).reduce((max, child) => {
                if (child instanceof HTMLElement) {
                  return Math.max(max, child.offsetHeight, child.scrollHeight);
                }
                return max;
              }, 0)
            ),
          };
          fetch(
            "http://127.0.0.1:7242/ingest/647b972b-6e46-450e-a5cb-b78c984f30b1",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                location: "imageExporter.ts:before-html2canvas",
                message:
                  "Final state before html2canvas (after height expansion)",
                data: finalState,
                timestamp: Date.now(),
                sessionId: "debug-session",
                runId: "post-fix",
                hypothesisId: "A,B,C,D,E",
              }),
            }
          ).catch(() => {});
          // #endregion
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
