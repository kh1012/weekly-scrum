/**
 * Canvas Drawer for Gantt Chart
 * 
 * HTML DOM이 아닌 Canvas API를 직접 사용하여 Gantt 차트를 렌더링합니다.
 * html2canvas의 폰트 렌더링 문제를 근본적으로 해결하고 텍스트 위치를 정밀하게 제어합니다.
 */

import type { GanttExportData } from "./imageExporter";

/**
 * Gantt Canvas Drawer 클래스
 * 
 * Canvas API를 사용하여 Gantt 차트의 모든 요소를 직접 그립니다:
 * - Tree Panel (프로젝트 계층 구조)
 * - Timeline Grid (날짜 헤더, 그리드 라인)
 * - Plan Bars (작업 막대)
 * - Flags (마일스톤 마커)
 */
export class GanttCanvasDrawer {
  private ctx: CanvasRenderingContext2D;
  private data: GanttExportData;
  private scale: number;

  constructor(canvas: HTMLCanvasElement, data: GanttExportData, scale: number = 2) {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas context를 가져올 수 없습니다.");
    }
    this.ctx = ctx;
    this.data = data;
    this.scale = scale;

    // Canvas 크기는 이미 imageExporter.ts에서 설정됨
    // scale만 적용
    this.ctx.scale(scale, scale);
  }

  /**
   * 메인 렌더링 함수
   * 
   * 모든 Gantt 차트 요소를 순서대로 그립니다.
   */
  public async render(): Promise<void> {
    console.log("[GanttCanvasDrawer] 렌더링 시작");

    // 폰트 로딩 대기
    await document.fonts.ready;
    console.log("[GanttCanvasDrawer] 폰트 로딩 완료");

    // 배경
    this.drawBackground();

    // Timeline (그리드, 날짜 헤더)
    this.drawTimeline();

    // Tree Panel (프로젝트 계층)
    this.drawTreePanel();

    // Plan Bars (작업 막대)
    this.drawBars();

    // Flags (마일스톤)
    this.drawFlags();

    console.log("[GanttCanvasDrawer] 렌더링 완료");
  }

  /**
   * 배경 그리기
   */
  private drawBackground(): void {
    this.ctx.fillStyle = "#ffffff";
    this.ctx.fillRect(
      0,
      0,
      this.data.layout.treePanelWidth + this.data.timeline.width,
      this.data.timeline.height
    );
  }

  /**
   * Timeline 그리드 그리기
   * - 날짜 헤더
   * - 세로 그리드 라인
   * - 주말 강조
   */
  private drawTimeline(): void {
    console.log("[GanttCanvasDrawer] Timeline 그리기 시작");

    const { treePanelWidth, dayWidth } = this.data.layout;
    const { rangeStart, rangeEnd } = this.data.timeline;

    // TODO: 실제 날짜 파싱 및 그리드 렌더링
    // 현재는 기본 그리드만 표시

    // 그리드 라인 (세로)
    this.ctx.strokeStyle = "#e0e0e0";
    this.ctx.lineWidth = 1;

    for (let i = 0; i < 100; i++) {
      const x = treePanelWidth + i * dayWidth;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.data.timeline.height);
      this.ctx.stroke();
    }

    console.log("[GanttCanvasDrawer] Timeline 그리기 완료");
  }

  /**
   * Tree Panel 그리기
   * - 프로젝트/모듈/기능 계층 구조
   * - 확장/축소 아이콘
   * - 텍스트 레이블
   */
  private drawTreePanel(): void {
    console.log("[GanttCanvasDrawer] Tree Panel 그리기 시작");

    this.data.treeNodes.forEach((node) => {
      this.drawTreeNode(node);
    });

    console.log("[GanttCanvasDrawer] Tree Panel 그리기 완료");
  }

  /**
   * Tree Node 하나 그리기
   */
  private drawTreeNode(node: GanttExportData["treeNodes"][0]): void {
    const indent = node.depth * 20; // 들여쓰기
    const x = 10 + indent;
    const y = node.top + node.height / 2;

    // 텍스트 그리기
    this.drawText(node.label, x, y, {
      font: "14px Pretendard, sans-serif",
      color: "#37352f",
      align: "left",
      baseline: "middle",
    });
  }

  /**
   * Plan Bars 그리기
   * - 작업 막대
   * - 상태별 색상
   * - 텍스트 레이블
   */
  private drawBars(): void {
    console.log("[GanttCanvasDrawer] Bars 그리기 시작");

    this.data.bars.forEach((bar) => {
      this.drawBar(bar);
    });

    console.log("[GanttCanvasDrawer] Bars 그리기 완료");
  }

  /**
   * Plan Bar 하나 그리기
   */
  private drawBar(bar: GanttExportData["bars"][0]): void {
    // TODO: 실제 Bar 렌더링 로직 구현
    // - 날짜 → X 좌표 변환
    // - Lane → Y 좌표 변환
    // - 색상, 테두리, 텍스트
    console.log(`[GanttCanvasDrawer] Bar 그리기: ${bar.title}`);
  }

  /**
   * Flags 그리기
   * - 마일스톤 마커
   * - Flag 레이블
   */
  private drawFlags(): void {
    console.log("[GanttCanvasDrawer] Flags 그리기 시작");

    this.data.flags.forEach((flag) => {
      this.drawFlag(flag);
    });

    console.log("[GanttCanvasDrawer] Flags 그리기 완료");
  }

  /**
   * Flag 하나 그리기
   */
  private drawFlag(flag: GanttExportData["flags"][0]): void {
    // TODO: 실제 Flag 렌더링 로직 구현
    console.log(`[GanttCanvasDrawer] Flag 그리기: ${flag.title}`);
  }

  /**
   * 텍스트 그리기 (핵심 유틸리티)
   * 
   * Canvas의 fillText를 사용하여 정밀한 위치에 텍스트를 렌더링합니다.
   * html2canvas의 폰트 렌더링 문제를 근본적으로 해결합니다.
   * 
   * @param text - 그릴 텍스트
   * @param x - X 좌표
   * @param y - Y 좌표
   * @param options - 스타일 옵션
   */
  private drawText(
    text: string,
    x: number,
    y: number,
    options: {
      font?: string;
      color?: string;
      align?: CanvasTextAlign;
      baseline?: CanvasTextBaseline;
      maxWidth?: number;
    } = {}
  ): void {
    const {
      font = "14px Pretendard, sans-serif",
      color = "#37352f",
      align = "left",
      baseline = "top",
      maxWidth,
    } = options;

    this.ctx.font = font;
    this.ctx.fillStyle = color;
    this.ctx.textAlign = align;
    this.ctx.textBaseline = baseline;

    // 말줄임표 처리
    let finalText = text;
    if (maxWidth) {
      const metrics = this.ctx.measureText(text);
      if (metrics.width > maxWidth) {
        finalText = this.truncateText(text, maxWidth);
      }
    }

    // ⭐ 텍스트 렌더링 (정밀한 위치 제어)
    this.ctx.fillText(finalText, x, y);
  }

  /**
   * 텍스트 말줄임표 처리
   * 
   * @param text - 원본 텍스트
   * @param maxWidth - 최대 너비
   * @returns 말줄임표가 적용된 텍스트
   */
  private truncateText(text: string, maxWidth: number): string {
    const ellipsis = "...";
    const ellipsisWidth = this.ctx.measureText(ellipsis).width;

    if (this.ctx.measureText(text).width <= maxWidth) {
      return text;
    }

    let truncated = text;
    while (truncated.length > 0) {
      truncated = truncated.slice(0, -1);
      const width =
        this.ctx.measureText(truncated).width + ellipsisWidth;
      if (width <= maxWidth) {
        return truncated + ellipsis;
      }
    }

    return ellipsis;
  }

  /**
   * Canvas를 PNG Blob으로 변환
   * 
   * @param quality - 이미지 품질 (0.0 ~ 1.0)
   * @returns PNG Blob
   */
  public toBlob(quality: number = 1): Promise<Blob> {
    return new Promise((resolve, reject) => {
      this.ctx.canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Blob 생성 실패"));
          }
        },
        "image/png",
        quality
      );
    });
  }
}

