/**
 * SVG Export 기능 (Figma 호환)
 */

import type { ExportOptions } from "./types";
import { downloadFile, generateDefaultFilename, sanitizeFilename } from "./utils";

/**
 * HTML 요소를 SVG로 변환하여 export
 * 
 * 참고: 완벽한 HTML→SVG 변환은 복잡하므로, 기본적인 구조만 지원합니다.
 * 복잡한 레이아웃의 경우 PNG export를 권장합니다.
 */
export async function exportSVG(
  element: HTMLElement,
  options?: ExportOptions
): Promise<void> {
  try {
    // 품질에 따른 스타일 인라인화 수준 조정
    const quality = options?.quality || 'normal';
    const detailedInlining = quality === 'high';
    
    // 폰트 로딩 대기
    await document.fonts.ready;

    // SVG 네임스페이스
    const svgNS = "http://www.w3.org/2000/svg";

    // 전체 크기 계산
    const width = element.scrollWidth;
    const height = element.scrollHeight;

    // SVG 요소 생성
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", width.toString());
    svg.setAttribute("height", height.toString());
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("xmlns", svgNS);

    // foreignObject를 사용하여 HTML 임베드
    // 이 방식은 Figma에서 제한적으로 지원되므로 기본 접근법으로 사용
    const foreignObject = document.createElementNS(svgNS, "foreignObject");
    foreignObject.setAttribute("width", "100%");
    foreignObject.setAttribute("height", "100%");

    // 요소 복제하여 삽입
    const clonedElement = element.cloneNode(true) as HTMLElement;
    
    // 스타일 인라인화 (품질에 따라)
    if (options?.svgOptions?.inlineStyles !== false) {
      inlineStyles(clonedElement, detailedInlining);
    }

    foreignObject.appendChild(clonedElement);
    svg.appendChild(foreignObject);

    // SVG를 문자열로 직렬화
    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(svg);

    // XML 선언 추가
    svgString = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgString;

    // 파일명 결정
    const filename = options?.filename
      ? sanitizeFilename(options.filename)
      : generateDefaultFilename("export", "svg");

    // 다운로드
    downloadFile(svgString, filename, "image/svg+xml");
  } catch (error) {
    console.error("SVG Export 실패:", error);
    throw new Error(`SVG Export 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
  }
}

/**
 * 요소의 computed styles를 인라인으로 변환
 * (외부 CSS가 적용되지 않는 환경에서도 스타일 유지)
 * 
 * @param element - 스타일을 인라인화할 요소
 * @param detailed - 상세 모드 (고품질일 때 true)
 */
function inlineStyles(element: HTMLElement, detailed: boolean = false): void {
  const computedStyle = window.getComputedStyle(element);
  
  // 필수 스타일 속성
  const essentialProps = [
    'font-family', 'font-size', 'font-weight', 'font-style',
    'color', 'background-color'
  ];
  
  // 고품질 모드에서는 추가 속성 포함
  const detailedProps = detailed ? [
    ...essentialProps,
    'border', 'border-radius', 'padding', 'margin', 'width', 'height',
    'display', 'position', 'text-align', 'line-height', 'opacity'
  ] : essentialProps;
  
  const styleString = detailedProps
    .map(key => {
      const value = computedStyle.getPropertyValue(key);
      return value ? `${key}:${value}` : '';
    })
    .filter(s => s)
    .join(';');
    
  if (styleString) {
    element.setAttribute('style', styleString);
  }

  // 자식 요소에도 재귀 적용
  Array.from(element.children).forEach((child) => {
    if (child instanceof HTMLElement) {
      inlineStyles(child, detailed);
    }
  });
}

/**
 * 간단한 Gantt 차트 SVG 생성 (네이티브 SVG)
 * 
 * 이 함수는 HTML 대신 순수 SVG 요소로 Gantt 차트를 그립니다.
 * Figma 호환성이 더 좋습니다.
 */
export interface GanttBarData {
  id: string;
  title: string;
  startX: number;
  endX: number;
  y: number;
  height: number;
  color: string;
}

export async function exportGanttSVG(
  bars: GanttBarData[],
  width: number,
  height: number,
  options?: ExportOptions
): Promise<void> {
  try {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", width.toString());
    svg.setAttribute("height", height.toString());
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("xmlns", svgNS);

    // 배경
    const bg = document.createElementNS(svgNS, "rect");
    bg.setAttribute("width", "100%");
    bg.setAttribute("height", "100%");
    bg.setAttribute("fill", "#ffffff");
    svg.appendChild(bg);

    // 각 Bar 렌더링
    bars.forEach((bar) => {
      const group = document.createElementNS(svgNS, "g");
      group.setAttribute("id", bar.id);

      // Bar 사각형
      const rect = document.createElementNS(svgNS, "rect");
      rect.setAttribute("x", bar.startX.toString());
      rect.setAttribute("y", bar.y.toString());
      rect.setAttribute("width", (bar.endX - bar.startX).toString());
      rect.setAttribute("height", bar.height.toString());
      rect.setAttribute("fill", bar.color);
      rect.setAttribute("rx", "4");
      group.appendChild(rect);

      // 텍스트
      const text = document.createElementNS(svgNS, "text");
      text.setAttribute("x", (bar.startX + 8).toString());
      text.setAttribute("y", (bar.y + bar.height / 2 + 4).toString());
      text.setAttribute("fill", "#000000");
      text.setAttribute("font-size", "12");
      text.setAttribute("font-family", "sans-serif");
      text.textContent = bar.title;
      group.appendChild(text);

      svg.appendChild(group);
    });

    // 직렬화 및 다운로드
    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(svg);
    svgString = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgString;

    const filename = options?.filename
      ? sanitizeFilename(options.filename)
      : generateDefaultFilename("gantt", "svg");

    downloadFile(svgString, filename, "image/svg+xml");
  } catch (error) {
    console.error("Gantt SVG Export 실패:", error);
    throw new Error(`Gantt SVG Export 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
  }
}

