/**
 * Canvas Drawer for Gantt Chart
 * 
 * Plans Gantt와 동일한 구조로 Canvas에 그립니다:
 * - Timeline Header (연도/월 + 일/요일)
 * - Flag Lane
 * - Tree Panel (프로젝트/모듈/기능)
 * - Plan Bars (상세 정보 포함)
 */

import type { GanttExportData } from "./imageExporter";

// Constants (Plans와 동일)
const HEADER_HEIGHT = 76; // 38 + 38
const FLAG_LANE_HEIGHT = 60;
const ROW_HEIGHT = 40;
const DAY_WIDTH = 24;

/**
 * Gantt Canvas Drawer 클래스
 */
export class GanttCanvasDrawer {
  protected ctx: CanvasRenderingContext2D;
  protected data: GanttExportData;
  protected scale: number;
  protected days: Date[] = [];
  protected months: Array<{ month: string; days: number }> = [];

  constructor(canvas: HTMLCanvasElement, data: GanttExportData, scale: number = 2) {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas context를 가져올 수 없습니다.");
    }
    this.ctx = ctx;
    this.data = data;
    this.scale = scale;

    // Canvas 크기는 이미 imageExporter.ts에서 설정됨
    this.ctx.scale(scale, scale);

    // 날짜 배열 생성
    this.generateDays();
    this.generateMonths();
  }

  /**
   * 날짜 범위에서 일 배열 생성
   */
  private generateDays(): void {
    const start = new Date(this.data.timeline.rangeStart);
    const end = new Date(this.data.timeline.rangeEnd);
    
    const current = new Date(start);
    while (current <= end) {
      this.days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
  }

  /**
   * 월 헤더 정보 생성
   */
  private generateMonths(): void {
    if (this.days.length === 0) return;

    let currentMonth = this.days[0].getMonth();
    let currentYear = this.days[0].getFullYear();
    let dayCount = 0;

    this.days.forEach((day, index) => {
      if (day.getMonth() === currentMonth && day.getFullYear() === currentYear) {
        dayCount++;
      } else {
        this.months.push({
          month: `${currentMonth + 1}월`,
          days: dayCount,
        });
        currentMonth = day.getMonth();
        currentYear = day.getFullYear();
        dayCount = 1;
      }

      if (index === this.days.length - 1) {
        this.months.push({
          month: `${currentMonth + 1}월`,
          days: dayCount,
        });
      }
    });
  }

  /**
   * 메인 렌더링
   */
  public async render(): Promise<void> {
    await document.fonts.ready;

    // 1. 배경
    this.drawBackground();

    // 2. Timeline Header (상단)
    this.drawTimelineHeader();

    // 3. Flag Lane (헤더 아래)
    this.drawFlagLane();

    // 4. Tree Panel (좌측)
    this.drawTreePanel();

    // 5. Grid Lines (세로선)
    this.drawGridLines();

    // 6. Plan Bars (타임라인 영역)
    this.drawBars();
  }

  /**
   * 배경
   */
  protected drawBackground(): void {
    this.ctx.fillStyle = "#ffffff";
    this.ctx.fillRect(0, 0, this.data.layout.treePanelWidth + this.data.timeline.width, this.data.timeline.height);
  }

  /**
   * Timeline Header (연도/월 + 일/요일)
   */
  protected drawTimelineHeader(offsetY: number = 0): void {
    const offsetX = this.data.layout.treePanelWidth;

    // 배경 그라데이션
    const gradient = this.ctx.createLinearGradient(0, offsetY, 0, offsetY + HEADER_HEIGHT);
    gradient.addColorStop(0, "#f8f9fa");
    gradient.addColorStop(1, "#f3f4f6");
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(offsetX, offsetY, this.data.timeline.width, HEADER_HEIGHT);

    // 1. 월 헤더 (상단 38px)
    let monthX = offsetX;
    this.months.forEach((m, idx) => {
      const monthWidth = m.days * DAY_WIDTH;

      // 텍스트
      this.drawText(m.month, monthX + monthWidth / 2, 19, {
        font: "600 12px Pretendard, sans-serif",
        color: "#374151",
        align: "center",
        baseline: "middle",
      });

      // 우측 테두리
      this.ctx.strokeStyle = "rgba(0, 0, 0, 0.06)";
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(monthX + monthWidth, 0);
      this.ctx.lineTo(monthX + monthWidth, 38);
      this.ctx.stroke();

      monthX += monthWidth;
    });

    // 월 헤더 하단 테두리
    this.ctx.strokeStyle = "rgba(0, 0, 0, 0.06)";
    this.ctx.beginPath();
    this.ctx.moveTo(offsetX, 38);
    this.ctx.lineTo(offsetX + this.data.timeline.width, 38);
    this.ctx.stroke();

    // 2. 일 헤더 (하단 38px)
    this.days.forEach((day, idx) => {
      const dayX = offsetX + idx * DAY_WIDTH;
      const isWeekend = day.getDay() === 0 || day.getDay() === 6;
      const isMonday = day.getDay() === 1;
      const isToday = day.toDateString() === new Date().toDateString();

      // 배경
      if (isToday) {
        const grad = this.ctx.createLinearGradient(dayX, 38, dayX, 76);
        grad.addColorStop(0, "rgba(59, 130, 246, 0.15)");
        grad.addColorStop(1, "rgba(59, 130, 246, 0.08)");
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(dayX, 38, DAY_WIDTH, 38);
      } else if (isWeekend) {
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.02)";
        this.ctx.fillRect(dayX, 38, DAY_WIDTH, 38);
      }

      // 월요일 좌측 테두리
      if (isMonday) {
        this.ctx.strokeStyle = "rgba(0, 0, 0, 0.08)";
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(dayX, 38);
        this.ctx.lineTo(dayX, 76);
        this.ctx.stroke();
      }

      // 우측 테두리
      this.ctx.strokeStyle = "rgba(0, 0, 0, 0.04)";
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(dayX + DAY_WIDTH, 38);
      this.ctx.lineTo(dayX + DAY_WIDTH, 76);
      this.ctx.stroke();

      // 일자
      const dayColor = isToday ? "#2563eb" : isWeekend ? "#9ca3af" : "#6b7280";
      this.drawText(String(day.getDate()), dayX + DAY_WIDTH / 2, 50, {
        font: `600 11px Pretendard, sans-serif`,
        color: dayColor,
        align: "center",
        baseline: "middle",
      });

      // 요일
      const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"];
      this.drawText(weekdayLabels[day.getDay()], dayX + DAY_WIDTH / 2, 64, {
        font: "500 9px Pretendard, sans-serif",
        color: dayColor,
        align: "center",
        baseline: "middle",
      });
    });

    // 헤더 하단 테두리
    this.ctx.strokeStyle = "rgba(0, 0, 0, 0.06)";
    this.ctx.beginPath();
    this.ctx.moveTo(offsetX, HEADER_HEIGHT);
    this.ctx.lineTo(offsetX + this.data.timeline.width, HEADER_HEIGHT);
    this.ctx.stroke();
  }

  /**
   * Flag Lane (헤더 아래, Bars 위)
   */
  protected drawFlagLane(offsetY: number = HEADER_HEIGHT): void {
    const offsetX = this.data.layout.treePanelWidth;

    // 배경
    this.ctx.fillStyle = "#fef3c7";
    this.ctx.fillRect(offsetX, offsetY, this.data.timeline.width, FLAG_LANE_HEIGHT);

    // Flags 그리기
    this.data.flags.forEach((flag) => {
      const startDate = new Date(flag.startDate);
      const endDate = new Date(flag.endDate);
      const rangeStart = new Date(this.data.timeline.rangeStart);

      const daysSinceStart = Math.floor(
        (startDate.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)
      );
      const flagX = offsetX + daysSinceStart * DAY_WIDTH;

      const isPoint = flag.startDate === flag.endDate;

      if (isPoint) {
        // Point flag: 수직선 + 레이블
        const flagColor = flag.color || "#ef4444";

        // 수직선
        this.ctx.strokeStyle = flagColor;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(flagX, offsetY);
        this.ctx.lineTo(flagX, offsetY + FLAG_LANE_HEIGHT);
        this.ctx.stroke();

        // 레이블 박스
        const labelWidth = Math.min(80, this.ctx.measureText(flag.title).width + 12);
        this.ctx.fillStyle = flagColor;
        this.ctx.fillRect(flagX + 4, offsetY + 10, labelWidth, 20);

        // 텍스트
        this.drawText(flag.title, flagX + 8, offsetY + 20, {
          font: "600 10px Pretendard, sans-serif",
          color: "#ffffff",
          align: "left",
          baseline: "middle",
          maxWidth: labelWidth - 8,
        });
      }
    });

    // Flag Lane 하단 테두리
    this.ctx.strokeStyle = "rgba(0, 0, 0, 0.06)";
    this.ctx.beginPath();
    this.ctx.moveTo(offsetX, offsetY + FLAG_LANE_HEIGHT);
    this.ctx.lineTo(offsetX + this.data.timeline.width, offsetY + FLAG_LANE_HEIGHT);
    this.ctx.stroke();
  }

  /**
   * Tree Panel (좌측 계층 구조)
   */
  protected drawTreePanel(offsetY: number = HEADER_HEIGHT + FLAG_LANE_HEIGHT): void {
    // 배경
    this.ctx.fillStyle = "#f9fafb";
    this.ctx.fillRect(0, offsetY, this.data.layout.treePanelWidth, this.data.timeline.height - offsetY);

    // 우측 테두리
    this.ctx.strokeStyle = "#e5e7eb";
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(this.data.layout.treePanelWidth, offsetY);
    this.ctx.lineTo(this.data.layout.treePanelWidth, this.data.timeline.height);
    this.ctx.stroke();

    // 노드 그리기
    this.data.treeNodes.forEach((node) => {
      const indent = node.depth * 20;
      const x = 12 + indent;
      const y = offsetY + node.top + ROW_HEIGHT / 2;

      // 프로젝트/모듈/기능별 스타일
      let fontSize = "12px";
      let fontWeight = "400";
      let color = "#4b5563";

      if (node.depth === 0) {
        // 프로젝트
        fontSize = "13px";
        fontWeight = "700";
        color = "#1f2937";
      } else if (node.depth === 1) {
        // 모듈
        fontSize = "12px";
        fontWeight = "600";
        color = "#374151";
      }

      this.drawText(node.label, x, y, {
        font: `${fontWeight} ${fontSize} Pretendard, sans-serif`,
        color,
        align: "left",
        baseline: "middle",
        maxWidth: this.data.layout.treePanelWidth - indent - 20,
      });

      // Row 구분선
      this.ctx.strokeStyle = "#f3f4f6";
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(0, offsetY + node.top + ROW_HEIGHT);
      this.ctx.lineTo(this.data.layout.treePanelWidth, offsetY + node.top + ROW_HEIGHT);
      this.ctx.stroke();
    });
  }

  /**
   * Grid Lines (세로선)
   */
  protected drawGridLines(offsetY: number = HEADER_HEIGHT + FLAG_LANE_HEIGHT): void {
    const offsetX = this.data.layout.treePanelWidth;

    this.days.forEach((day, idx) => {
      const x = offsetX + idx * DAY_WIDTH;
      const isWeekend = day.getDay() === 0 || day.getDay() === 6;
      const isMonday = day.getDay() === 1;

      // 주말 배경
      if (isWeekend) {
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.015)";
        this.ctx.fillRect(x, offsetY, DAY_WIDTH, this.data.timeline.height - offsetY);
      }

      // 세로선
      this.ctx.strokeStyle = isMonday ? "rgba(0, 0, 0, 0.08)" : "rgba(0, 0, 0, 0.04)";
      this.ctx.lineWidth = isMonday ? 2 : 1;
      this.ctx.beginPath();
      this.ctx.moveTo(x, offsetY);
      this.ctx.lineTo(x, this.data.timeline.height);
      this.ctx.stroke();
    });
  }

  /**
   * Plan Bars (작업 막대)
   */
  protected drawBars(offsetY: number = HEADER_HEIGHT + FLAG_LANE_HEIGHT): void {
    const offsetX = this.data.layout.treePanelWidth;

    this.data.bars.forEach((bar) => {
      const startDate = new Date(bar.startDate);
      const endDate = new Date(bar.endDate);
      const rangeStart = new Date(this.data.timeline.rangeStart);

      const daysSinceStart = Math.floor(
        (startDate.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)
      );
      const duration = Math.floor(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;

      const barX = offsetX + daysSinceStart * DAY_WIDTH;
      const barWidth = duration * DAY_WIDTH - 2; // 간격

      // Row 찾기
      const rowNode = this.data.treeNodes.find((node) => node.id === bar.rowId);
      if (!rowNode) return;

      const barY = offsetY + rowNode.top + 6 + bar.lane * 26;
      const barHeight = 22;

      // 상태별 색상
      const statusColors: Record<string, string> = {
        진행중: "#3b82f6",
        완료: "#10b981",
        보류: "#f59e0b",
        취소: "#ef4444",
      };
      const barColor = statusColors[bar.status] || "#6b7280";

      // 막대 배경
      this.ctx.fillStyle = barColor;
      this.roundRect(barX, barY, barWidth, barHeight, 3);
      this.ctx.fill();

      // 텍스트 영역 (막대가 충분히 크면)
      if (barWidth > 60) {
        // Stage 태그
        this.ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        this.roundRect(barX + 4, barY + 4, 30, 14, 2);
        this.ctx.fill();

        this.drawText(bar.stage, barX + 19, barY + 11, {
          font: "600 9px Pretendard, sans-serif",
          color: "#ffffff",
          align: "center",
          baseline: "middle",
        });

        // Title
        if (barWidth > 100) {
          this.drawText(bar.title, barX + 40, barY + 11, {
            font: "600 11px Pretendard, sans-serif",
            color: "#ffffff",
            align: "left",
            baseline: "middle",
            maxWidth: barWidth - 45,
          });
        }

        // Assignees
        if (barWidth > 150 && bar.assignees.length > 0) {
          const assigneeText = bar.assignees.map((a) => a.name).join(", ");
          this.drawText(assigneeText, barX + barWidth - 5, barY + 11, {
            font: "500 9px Pretendard, sans-serif",
            color: "rgba(255, 255, 255, 0.8)",
            align: "right",
            baseline: "middle",
            maxWidth: Math.min(barWidth / 3, 80),
          });
        }
      }
    });
  }

  /**
   * 둥근 사각형 (막대 모서리용)
   */
  protected roundRect(x: number, y: number, width: number, height: number, radius: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
  }

  /**
   * 텍스트 그리기
   */
  protected drawText(
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
      font = "12px Pretendard, sans-serif",
      color = "#37352f",
      align = "left",
      baseline = "top",
      maxWidth,
    } = options;

    this.ctx.font = font;
    this.ctx.fillStyle = color;
    this.ctx.textAlign = align;
    this.ctx.textBaseline = baseline;

    let finalText = text;
    if (maxWidth) {
      const metrics = this.ctx.measureText(text);
      if (metrics.width > maxWidth) {
        finalText = this.truncateText(text, maxWidth);
      }
    }

    this.ctx.fillText(finalText, x, y);
  }

  /**
   * 말줄임표 처리
   */
  protected truncateText(text: string, maxWidth: number): string {
    const ellipsis = "...";
    const ellipsisWidth = this.ctx.measureText(ellipsis).width;

    if (this.ctx.measureText(text).width <= maxWidth) {
      return text;
    }

    let truncated = text;
    while (truncated.length > 0) {
      truncated = truncated.slice(0, -1);
      const width = this.ctx.measureText(truncated).width + ellipsisWidth;
      if (width <= maxWidth) {
        return truncated + ellipsis;
      }
    }

    return ellipsis;
  }

  /**
   * PNG Blob 생성
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
