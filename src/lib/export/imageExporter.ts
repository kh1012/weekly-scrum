/**
 * PNG 이미지 Export 기능 (html2canvas 사용)
 */

import type { ExportOptions, ExportProgress } from "./types";
import {
  downloadFile,
  generateDefaultFilename,
  sanitizeFilename,
} from "./utils";
import { GanttCanvasDrawer } from "./canvasDrawer";
import type {
  DraftRow,
  DraftBar,
  DraftFlag,
} from "@/components/plans/gantt-draft/types";

/**
 * Timeline 내부의 실제 콘텐츠 width를 찾기 (Phase 1)
 * style.width가 px 단위로 명시된 요소 중 최대값을 반환
 */
function findTimelineContentWidth(element: HTMLElement): number | null {
  const queue: HTMLElement[] = [element];
  let maxWidth = 0;

  while (queue.length > 0) {
    const el = queue.shift()!;

    // style.width가 px 단위로 명시된 요소 찾기
    const styleWidth = el.style.width;
    if (styleWidth && styleWidth.endsWith("px")) {
      const width = parseFloat(styleWidth);
      if (width > maxWidth) {
        maxWidth = width;
      }
    }

    // 자식들 큐에 추가
    for (const child of Array.from(el.children)) {
      if (child instanceof HTMLElement) {
        queue.push(child);
      }
    }
  }

  return maxWidth > 0 ? maxWidth : null;
}

/**
 * Timeline width를 전체 컨테이너에 적용 (Phase 2)
 * Tree Panel은 건드리지 않고, Timeline 영역의 최상위만 확장
 * 깊이 있는 자식들은 fixOverflowForExport가 자동으로 처리
 */
function applyTimelineWidth(element: HTMLElement, timelineWidth: number): void {
  let treePanelWidth = 0;
  let timelineContainer: HTMLElement | null = null;

  // 1단계: 직계 자식 중 Tree Panel과 Timeline 컨테이너 찾기
  for (const child of Array.from(element.children)) {
    if (child instanceof HTMLElement) {
      const computed = window.getComputedStyle(child);

      if (computed.flexShrink === "0") {
        // Tree Panel (flex-shrink-0)
        treePanelWidth = child.offsetWidth;
      } else if (computed.flex && computed.flex.includes("1")) {
        // Timeline 컨테이너 (flex-1)
        timelineContainer = child;
      }
    }
  }

  if (!timelineContainer) {
    return;
  }

  // 2단계: 최상위 컨테이너는 Tree + Timeline width만 설정 (height는 원래대로)
  const totalWidth = treePanelWidth + timelineWidth;
  element.style.setProperty("width", `${totalWidth}px`, "important");
  element.style.setProperty("min-width", `${totalWidth}px`, "important");

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
}

/**
 * 타임라인 블록과 텍스트 요소의 스타일 디버깅 (deprecated)
 */
function debugTimelineBlocks(element: HTMLElement): void {
  // 디버깅 함수 - 현재는 사용하지 않음
}

/**
 * Export를 위해 모든 overflow를 visible로 변경
 * 텍스트가 잘리지 않고 전체 표시되도록 함
 */
function fixOverflowForExport(element: HTMLElement, depth: number = 0): void {
  const computedStyle = window.getComputedStyle(element);
  const indent = "  ".repeat(depth);

  // 모든 overflow를 visible로 변경 (말줄임표/truncate 제한 제거)
  const hasOverflowStyle =
    computedStyle.overflow !== "visible" ||
    computedStyle.overflowX !== "visible" ||
    computedStyle.overflowY !== "visible";

  // overflow가 설정된 모든 요소를 visible로 변경 (스크롤 여부와 관계없이)
  if (hasOverflowStyle) {
    element.style.setProperty("overflow", "visible", "important");
    element.style.setProperty("overflow-x", "visible", "important");
    element.style.setProperty("overflow-y", "visible", "important");
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
    const canvas = await html2canvas(element, {
      scale,
      backgroundColor,
      useCORS: true,
      allowTaint: false,
      foreignObjectRendering: false,
      logging: false,
      onclone: (clonedDoc, clonedEl) => {
        if (clonedEl instanceof HTMLElement) {
          // Phase 0: 텍스트 여백 보정 (영역별 미세 조정 + 부모 padding-top 추가)
          const allElements = clonedEl.querySelectorAll("*");
          const adjustments = {
            search: 0,
            placeholder: 0,
            timelineBlock: 0,
            treePanel: 0,
            header: 0,
            other: 0,
          };
          const parentsPadded = new Set<HTMLElement>();

          // INPUT placeholder 처리
          const inputElements = clonedEl.querySelectorAll("input[placeholder]");
          inputElements.forEach((input) => {
            if (input instanceof HTMLInputElement) {
              // input 내부 텍스트를 위로 이동 (padding-top 조정)
              const computed = window.getComputedStyle(input);
              const currentPaddingTop = parseFloat(computed.paddingTop) || 0;
              const currentPaddingBottom =
                parseFloat(computed.paddingBottom) || 0;

              // 상단 패딩은 줄이고 하단 패딩은 늘려서 텍스트를 위로 이동
              input.style.setProperty(
                "padding-top",
                `${Math.max(0, currentPaddingTop - 7)}px`,
                "important"
              );
              input.style.setProperty(
                "padding-bottom",
                `${currentPaddingBottom + 7}px`,
                "important"
              );
              adjustments.placeholder++;
            }
          });

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

                  // 0. 검색 영역 (최우선 - 좌상단)
                  if (
                    parent.className.includes("search") ||
                    parent.className.includes("filter") ||
                    parent.querySelector('input[type="text"]') ||
                    parent.querySelector("input[placeholder]")
                  ) {
                    offset = 7; // 검색 영역은 7px 위로
                    area = "search";

                    if (!parentsPadded.has(parent)) {
                      const currentPadding =
                        parseFloat(parentComputed.paddingTop) || 0;
                      parent.style.setProperty(
                        "padding-top",
                        `${currentPadding + 7}px`,
                        "important"
                      );
                      parentsPadded.add(parent);
                    }
                    break;
                  }

                  // 1. 타임라인 블록 (absolute positioned parent)
                  if (parentComputed.position === "absolute") {
                    offset = 4; // 타임라인 블록 (12px → 4px)
                    area = "timelineBlock";

                    // 부모에 padding-top 추가 (텍스트가 잘리지 않도록)
                    if (!parentsPadded.has(parent)) {
                      const currentPadding =
                        parseFloat(parentComputed.paddingTop) || 0;
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
                      const currentPadding =
                        parseFloat(parentComputed.paddingTop) || 0;
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
                      const currentPadding =
                        parseFloat(parentComputed.paddingTop) || 0;
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
            `(placeholder: ${adjustments.placeholder}개, search: 7px, timeline: 4px, tree: 3px, header: 2px, other: 5px), 부모 padding: ${parentsPadded.size}개`
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

          // Phase 2: 발견한 width를 전체 컨테이너에 적용
          if (timelineWidth && timelineWidth > clonedEl.scrollWidth) {
            applyTimelineWidth(clonedEl, timelineWidth);
          }

          // Phase 3: 스크롤 컨테이너의 overflow만 visible로 변경
          // (truncate, ellipsis 요소는 건너뛰어서 스타일 보존)
          fixOverflowForExport(clonedEl);

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
          }
        }
      },
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
            resolve(b);
          } else {
            reject(new Error("Blob 생성 실패"));
          }
        },
        "image/png",
        1 // 최고 품질
      );
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

// ============================================================================
// Canvas Draw Export (정밀한 텍스트 렌더링)
// ============================================================================

/**
 * Gantt 차트 데이터 (JSON Export 데이터 기반)
 */
export interface GanttCanvasData {
  rows: DraftRow[];
  bars: DraftBar[];
  flags: DraftFlag[];
  timeline: {
    rangeStart: Date;
    rangeEnd: Date;
  };
  layout: {
    treePanelWidth: number;
    rowHeight: number;
    dayWidth: number;
  };
}

/**
 * Gantt 차트 데이터 인터페이스 (Canvas Drawer용)
 */
export interface GanttExportData {
  treeNodes: Array<{
    type: "project" | "module" | "feature";
    id: string;
    label: string;
    depth: number;
    top: number;
    height: number;
    isExpanded: boolean;
  }>;
  bars: Array<{
    id: string;
    rowId: string;
    title: string;
    startDate: string;
    endDate: string;
    lane: number;
    stage: string;
    status: string;
    assignees: Array<{ name: string; role: string }>;
  }>;
  flags: Array<{
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    lane: number;
    color?: string;
  }>;
  timeline: {
    rangeStart: string;
    rangeEnd: string;
    width: number;
    height: number;
  };
  layout: {
    treePanelWidth: number;
    rowHeight: number;
    dayWidth: number;
  };
}

/**
 * Canvas Draw 방식으로 PNG Export
 *
 * @param element - Export할 HTML 요소
 * @param ganttData - Gantt 차트 데이터 (JSON Export와 동일)
 * @param options - Export 옵션
 * @param onProgress - 진행률 콜백
 */
export async function exportPNGWithCanvas(
  element: HTMLElement,
  ganttData: GanttCanvasData,
  options?: ExportOptions,
  onProgress?: (progress: ExportProgress) => void
): Promise<void> {
  try {
    onProgress?.({
      step: "Canvas 데이터 변환 중...",
      progress: 20,
      completed: false,
    });

    // GanttCanvasData → GanttExportData 변환
    const exportData = convertToExportData(element, ganttData);

    // Canvas 생성
    const scale =
      options?.quality === "low" ? 1 : options?.quality === "high" ? 3 : 2;
    const canvas = document.createElement("canvas");
    const totalWidth =
      exportData.layout.treePanelWidth + exportData.timeline.width;
    const totalHeight = exportData.timeline.height;

    canvas.width = totalWidth * scale;
    canvas.height = totalHeight * scale;
    canvas.style.width = `${totalWidth}px`;
    canvas.style.height = `${totalHeight}px`;

    // Canvas 렌더링
    onProgress?.({
      step: "Canvas 렌더링 중...",
      progress: 50,
      completed: false,
    });

    const drawer = new GanttCanvasDrawer(canvas, exportData, scale);
    await drawer.render();

    // PNG Blob 생성
    onProgress?.({
      step: "PNG 생성 중...",
      progress: 80,
      completed: false,
    });

    const blob = await drawer.toBlob(1);

    // 다운로드
    onProgress?.({
      step: "다운로드 중...",
      progress: 90,
      completed: false,
    });

    const filename = options?.filename
      ? sanitizeFilename(options.filename)
      : generateDefaultFilename("gantt-draw", "png");

    downloadFile(blob, filename, "image/png");

    onProgress?.({
      step: "완료",
      progress: 100,
      completed: true,
    });
  } catch (error) {
    console.error("[PNG Canvas Draw Export] 실패:", error);
    throw new Error(
      `PNG Canvas Draw Export 실패: ${
        error instanceof Error ? error.message : "알 수 없는 오류"
      }`
    );
  }
}

/**
 * GanttCanvasData를 GanttExportData로 변환
 *
 * @param element - Gantt 컨테이너 요소 (레이아웃 정보 추출용)
 * @param data - Gantt 차트 데이터
 * @returns Canvas Drawer용 데이터
 */
function convertToExportData(
  element: HTMLElement,
  data: GanttCanvasData
): GanttExportData {
  // Canvas Drawing 상수
  const HEADER_HEIGHT = 76; // 38(월) + 38(일+요일)
  const FLAG_LANE_HEIGHT = 60;
  const DAY_WIDTH = 24; // Canvas에서 사용하는 일 단위 너비

  // Timeline 크기 계산
  const daysDiff =
    Math.ceil(
      (data.timeline.rangeEnd.getTime() - data.timeline.rangeStart.getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1;
  const timelineWidth = daysDiff * DAY_WIDTH;

  // Header + Flag Lane + Rows 높이 포함
  const rowsHeight = data.rows.length * data.layout.rowHeight;
  const timelineHeight = HEADER_HEIGHT + FLAG_LANE_HEIGHT + rowsHeight;

  // Tree nodes 변환 (top은 rows 영역 기준 상대 좌표)
  const treeNodes: GanttExportData["treeNodes"] = data.rows.map(
    (row, index) => ({
      type: row.feature ? "feature" : row.module ? "module" : "project",
      id: row.rowId,
      label: row.feature || row.module || row.project,
      depth: row.feature ? 2 : row.module ? 1 : 0,
      top: index * data.layout.rowHeight, // Rows 영역 기준
      height: data.layout.rowHeight,
      isExpanded: row.expanded ?? true,
    })
  );

  // Bars 변환 (deleted 제외)
  const bars: GanttExportData["bars"] = data.bars
    .filter((bar) => !bar.deleted)
    .map((bar) => ({
      id: bar.clientUid,
      rowId: bar.rowId,
      title: bar.title,
      startDate: bar.startDate,
      endDate: bar.endDate,
      lane: bar.preferredLane ?? 0,
      stage: bar.stage,
      status: bar.status,
      assignees: bar.assignees.map((a) => ({
        name: a.displayName || a.userId,
        role: a.role,
      })),
    }));

  // Flags 변환 (deleted 제외)
  const flags: GanttExportData["flags"] = data.flags
    .filter((flag) => !flag.deleted)
    .map((flag) => ({
      id: flag.clientId,
      title: flag.title,
      startDate: flag.startDate,
      endDate: flag.endDate,
      lane: flag.laneHint ?? 0,
      color: flag.color ?? undefined,
    }));

  return {
    treeNodes,
    bars,
    flags,
    timeline: {
      rangeStart: data.timeline.rangeStart.toISOString().split("T")[0],
      rangeEnd: data.timeline.rangeEnd.toISOString().split("T")[0],
      width: timelineWidth,
      height: timelineHeight,
    },
    layout: {
      treePanelWidth: data.layout.treePanelWidth,
      rowHeight: data.layout.rowHeight,
      dayWidth: DAY_WIDTH, // Canvas 기준 24px
    },
  };
}
