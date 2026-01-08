/**
 * Advanced Canvas Drawer for Gantt Chart
 * 
 * GanttCanvasDrawer를 확장하여 고급 기능 제공:
 * - 테이블 컬럼 (담당자/상태/진행률)
 * - 진행률 gradient
 * - 메타데이터 섹션
 * - 범례 및 통계 섹션
 */

import { GanttCanvasDrawer } from "./canvasDrawer";
import type { GanttExportData } from "./imageExporter";
import type { ExportOptions, CanvasOptions } from "./types";

// 레이아웃 상수
const HEADER_HEIGHT = 76;
const FLAG_LANE_HEIGHT = 60;
const ROW_HEIGHT = 40;
const DAY_WIDTH = 24;
const METADATA_HEIGHT = 50;
const LEGEND_HEIGHT = 60;

// 테이블 컬럼 너비
const ASSIGNEE_COLUMN_WIDTH = 80;
const STATUS_COLUMN_WIDTH = 60;
const PROGRESS_COLUMN_WIDTH = 60;

/**
 * Advanced Gantt Canvas Drawer 클래스
 */
export class AdvancedGanttCanvasDrawer extends GanttCanvasDrawer {
  protected options: ExportOptions;
  protected canvasOptions: CanvasOptions;

  constructor(
    canvas: HTMLCanvasElement,
    data: GanttExportData,
    scale: number = 2,
    options: ExportOptions = {}
  ) {
    super(canvas, data, scale);
    this.options = options;
    this.canvasOptions = options.canvasOptions || {};
  }

  /**
   * 전체 레이아웃 계산
   * 메타데이터/범례 섹션을 고려한 높이 계산
   */
  protected getTotalHeight(): number {
    let height = 0;
    
    if (this.canvasOptions.showMetadata) {
      height += METADATA_HEIGHT;
    }
    
    height += HEADER_HEIGHT + FLAG_LANE_HEIGHT;
    height += this.data.treeNodes.length * ROW_HEIGHT;
    
    if (this.canvasOptions.showLegend || this.canvasOptions.showStatistics) {
      height += LEGEND_HEIGHT;
    }
    
    return height;
  }

  /**
   * Tree Panel 너비 계산
   * 테이블 컬럼을 고려한 너비
   */
  protected getTreePanelWidth(): number {
    let width = this.data.layout.treePanelWidth;
    
    if (this.canvasOptions.showTableColumns) {
      const columnConfig = this.canvasOptions.columnConfig || {};
      
      if (columnConfig.showAssignees !== false) {
        width += ASSIGNEE_COLUMN_WIDTH;
      }
      if (columnConfig.showStatus !== false) {
        width += STATUS_COLUMN_WIDTH;
      }
      if (columnConfig.showProgress) {
        width += PROGRESS_COLUMN_WIDTH;
      }
    }
    
    return width;
  }

  /**
   * 메인 렌더링 (오버라이드)
   */
  public async render(): Promise<void> {
    await document.fonts.ready;

    let offsetY = 0;

    // 1. 전체 배경
    this.drawAdvancedBackground();

    // 2. 메타데이터 섹션
    if (this.canvasOptions.showMetadata && this.data.metadata) {
      this.drawMetadataSection(offsetY);
      offsetY += METADATA_HEIGHT;
    }

    // 3. Timeline Header
    this.drawTimelineHeader(offsetY);

    // 4. Flag Lane
    this.drawFlagLane(offsetY + HEADER_HEIGHT);

    // 5. Tree Panel
    this.drawTreePanel(offsetY + HEADER_HEIGHT + FLAG_LANE_HEIGHT);

    // 6. 테이블 컬럼
    if (this.canvasOptions.showTableColumns) {
      this.drawTableColumns(offsetY + HEADER_HEIGHT + FLAG_LANE_HEIGHT);
    }

    // 7. Grid Lines
    this.drawGridLines(offsetY + HEADER_HEIGHT + FLAG_LANE_HEIGHT);

    // 8. Bars (진행률 gradient 포함)
    if (this.canvasOptions.showProgressGradient) {
      this.drawBarsWithProgress(offsetY + HEADER_HEIGHT + FLAG_LANE_HEIGHT);
    } else {
      this.drawBars();
    }

    // 9. 범례 및 통계
    if (this.canvasOptions.showLegend || this.canvasOptions.showStatistics) {
      const legendOffsetY = offsetY + HEADER_HEIGHT + FLAG_LANE_HEIGHT + (this.data.treeNodes.length * ROW_HEIGHT);
      this.drawLegendAndStatistics(legendOffsetY);
    }
  }

  /**
   * Advanced 배경 (메타데이터 포함)
   */
  protected drawAdvancedBackground(): void {
    const totalWidth = this.getTreePanelWidth() + this.data.timeline.width;
    let totalHeight = HEADER_HEIGHT + FLAG_LANE_HEIGHT + (this.data.treeNodes.length * ROW_HEIGHT);
    
    if (this.canvasOptions.showMetadata && this.data.metadata) {
      totalHeight += METADATA_HEIGHT;
    }
    
    if (this.canvasOptions.showLegend || this.canvasOptions.showStatistics) {
      totalHeight += LEGEND_HEIGHT;
    }
    
    this.ctx.fillStyle = "#ffffff";
    this.ctx.fillRect(0, 0, totalWidth, totalHeight);
  }

  /**
   * 메타데이터 섹션 그리기
   */
  protected drawMetadataSection(offsetY: number): void {
    const metadata = this.data.metadata;
    if (!metadata) return;

    const totalWidth = this.getTreePanelWidth() + this.data.timeline.width;

    // 배경
    const gradient = this.ctx.createLinearGradient(0, offsetY, 0, offsetY + METADATA_HEIGHT);
    gradient.addColorStop(0, "#fafbfc");
    gradient.addColorStop(1, "#f6f8fa");
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, offsetY, totalWidth, METADATA_HEIGHT);

    // 하단 테두리
    this.ctx.strokeStyle = "#e1e4e8";
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(0, offsetY + METADATA_HEIGHT);
    this.ctx.lineTo(totalWidth, offsetY + METADATA_HEIGHT);
    this.ctx.stroke();

    // 좌측: 제목
    this.drawText(metadata.pageInfo.title, 16, offsetY + 18, {
      font: "700 16px Pretendard, sans-serif",
      color: "#24292e",
      align: "left",
      baseline: "top",
    });

    // 중앙: 날짜 범위
    if (metadata.dateRange) {
      const dateRangeText = `${metadata.dateRange.start} ~ ${metadata.dateRange.end}`;
      this.drawText(dateRangeText, totalWidth / 2, offsetY + 20, {
        font: "500 13px Pretendard, sans-serif",
        color: "#586069",
        align: "center",
        baseline: "top",
      });
    }

    // 우측: Export 날짜
    const exportDate = new Date(metadata.exportDate);
    const exportDateText = `Exported: ${exportDate.toLocaleDateString()} ${exportDate.toLocaleTimeString()}`;
    this.drawText(exportDateText, totalWidth - 16, offsetY + 20, {
      font: "400 11px Pretendard, sans-serif",
      color: "#6a737d",
      align: "right",
      baseline: "top",
    });

    // 필터 정보 (있는 경우)
    if (metadata.filters) {
      const filters: string[] = [];
      if (metadata.filters.viewMode) {
        filters.push(`View: ${metadata.filters.viewMode}`);
      }
      if (metadata.filters.stages && metadata.filters.stages.length > 0) {
        filters.push(`Stages: ${metadata.filters.stages.join(", ")}`);
      }
      if (metadata.filters.assignees && metadata.filters.assignees.length > 0) {
        filters.push(`Assignees: ${metadata.filters.assignees.length} selected`);
      }

      if (filters.length > 0) {
        this.drawText(filters.join(" | "), 16, offsetY + 36, {
          font: "400 10px Pretendard, sans-serif",
          color: "#959da5",
          align: "left",
          baseline: "top",
        });
      }
    }
  }

  /**
   * 테이블 컬럼 그리기
   */
  protected drawTableColumns(offsetY: number): void {
    const columnConfig = this.canvasOptions.columnConfig || {};
    const baseTreeWidth = this.data.layout.treePanelWidth;
    let columnX = baseTreeWidth;

    // 컬럼 배경
    const totalColumnWidth = this.getTreePanelWidth() - baseTreeWidth;
    this.ctx.fillStyle = "#fafbfc";
    this.ctx.fillRect(
      baseTreeWidth,
      offsetY,
      totalColumnWidth,
      this.data.treeNodes.length * ROW_HEIGHT
    );

    // 각 row에 대해 컬럼 데이터 그리기
    this.data.treeNodes.forEach((node, index) => {
      const rowY = offsetY + index * ROW_HEIGHT;
      let currentX = baseTreeWidth;

      // Row 구분선
      this.ctx.strokeStyle = "#e1e4e8";
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(baseTreeWidth, rowY + ROW_HEIGHT);
      this.ctx.lineTo(baseTreeWidth + totalColumnWidth, rowY + ROW_HEIGHT);
      this.ctx.stroke();

      // 해당 row의 bars 찾기
      const rowBars = this.data.bars.filter((bar) => bar.rowId === node.id);

      // 담당자 컬럼
      if (columnConfig.showAssignees !== false) {
        this.drawAssigneeColumn(currentX, rowY, ASSIGNEE_COLUMN_WIDTH, ROW_HEIGHT, rowBars);
        
        // 컬럼 구분선
        this.ctx.strokeStyle = "#e1e4e8";
        this.ctx.beginPath();
        this.ctx.moveTo(currentX + ASSIGNEE_COLUMN_WIDTH, rowY);
        this.ctx.lineTo(currentX + ASSIGNEE_COLUMN_WIDTH, rowY + ROW_HEIGHT);
        this.ctx.stroke();
        
        currentX += ASSIGNEE_COLUMN_WIDTH;
      }

      // 상태 컬럼
      if (columnConfig.showStatus !== false) {
        this.drawStatusColumn(currentX, rowY, STATUS_COLUMN_WIDTH, ROW_HEIGHT, rowBars);
        
        // 컬럼 구분선
        this.ctx.strokeStyle = "#e1e4e8";
        this.ctx.beginPath();
        this.ctx.moveTo(currentX + STATUS_COLUMN_WIDTH, rowY);
        this.ctx.lineTo(currentX + STATUS_COLUMN_WIDTH, rowY + ROW_HEIGHT);
        this.ctx.stroke();
        
        currentX += STATUS_COLUMN_WIDTH;
      }

      // 진행률 컬럼
      if (columnConfig.showProgress) {
        this.drawProgressColumn(currentX, rowY, PROGRESS_COLUMN_WIDTH, ROW_HEIGHT, rowBars);
      }
    });

    // 우측 테두리
    this.ctx.strokeStyle = "#d1d5da";
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(baseTreeWidth + totalColumnWidth, offsetY);
    this.ctx.lineTo(baseTreeWidth + totalColumnWidth, offsetY + this.data.treeNodes.length * ROW_HEIGHT);
    this.ctx.stroke();
  }

  /**
   * 담당자 컬럼 그리기
   */
  protected drawAssigneeColumn(
    x: number,
    y: number,
    width: number,
    height: number,
    bars: GanttExportData["bars"]
  ): void {
    if (bars.length === 0) return;

    // 모든 담당자 수집 (중복 제거)
    const assigneeSet = new Set<string>();
    bars.forEach((bar) => {
      bar.assignees.forEach((a) => assigneeSet.add(a.name));
    });

    const assignees = Array.from(assigneeSet);
    const centerY = y + height / 2;

    if (assignees.length === 0) {
      this.drawText("-", x + width / 2, centerY, {
        font: "400 11px Pretendard, sans-serif",
        color: "#959da5",
        align: "center",
        baseline: "middle",
      });
    } else if (assignees.length === 1) {
      this.drawText(assignees[0], x + width / 2, centerY, {
        font: "500 11px Pretendard, sans-serif",
        color: "#24292e",
        align: "center",
        baseline: "middle",
        maxWidth: width - 8,
      });
    } else {
      const firstAssignee = assignees[0];
      const remaining = assignees.length - 1;
      this.drawText(`${firstAssignee} +${remaining}`, x + width / 2, centerY, {
        font: "500 11px Pretendard, sans-serif",
        color: "#24292e",
        align: "center",
        baseline: "middle",
        maxWidth: width - 8,
      });
    }
  }

  /**
   * 상태 컬럼 그리기
   */
  protected drawStatusColumn(
    x: number,
    y: number,
    width: number,
    height: number,
    bars: GanttExportData["bars"]
  ): void {
    if (bars.length === 0) return;

    // 상태 집계
    const statusCount: Record<string, number> = {};
    bars.forEach((bar) => {
      statusCount[bar.status] = (statusCount[bar.status] || 0) + 1;
    });

    const statuses = Object.keys(statusCount);
    const centerY = y + height / 2;

    if (statuses.length === 1) {
      // 단일 상태
      const status = statuses[0];
      const color = this.getStatusColor(status);
      
      // Badge 배경
      const badgeWidth = 48;
      const badgeHeight = 18;
      this.ctx.fillStyle = color + "20"; // 20% 투명도
      this.roundRect(
        x + (width - badgeWidth) / 2,
        y + (height - badgeHeight) / 2,
        badgeWidth,
        badgeHeight,
        3
      );
      this.ctx.fill();

      // Badge 텍스트
      this.drawText(status, x + width / 2, centerY, {
        font: "600 10px Pretendard, sans-serif",
        color: color,
        align: "center",
        baseline: "middle",
      });
    } else {
      // 여러 상태 (개수만 표시)
      this.drawText(`${bars.length}개`, x + width / 2, centerY, {
        font: "500 11px Pretendard, sans-serif",
        color: "#586069",
        align: "center",
        baseline: "middle",
      });
    }
  }

  /**
   * 진행률 컬럼 그리기
   */
  protected drawProgressColumn(
    x: number,
    y: number,
    width: number,
    height: number,
    bars: GanttExportData["bars"]
  ): void {
    if (bars.length === 0) return;

    // 평균 진행률 계산
    const progressBars = bars.filter((bar) => bar.progress !== undefined);
    if (progressBars.length === 0) {
      this.drawText("-", x + width / 2, y + height / 2, {
        font: "400 11px Pretendard, sans-serif",
        color: "#959da5",
        align: "center",
        baseline: "middle",
      });
      return;
    }

    const avgProgress =
      progressBars.reduce((sum, bar) => sum + (bar.progress || 0), 0) / progressBars.length;

    const centerY = y + height / 2;

    // 진행률 텍스트
    this.drawText(`${Math.round(avgProgress)}%`, x + width / 2, centerY - 6, {
      font: "600 11px Pretendard, sans-serif",
      color: "#24292e",
      align: "center",
      baseline: "middle",
    });

    // 작은 progress bar
    const barWidth = 40;
    const barHeight = 4;
    const barX = x + (width - barWidth) / 2;
    const barY = centerY + 4;

    // 배경
    this.ctx.fillStyle = "#e1e4e8";
    this.roundRect(barX, barY, barWidth, barHeight, 2);
    this.ctx.fill();

    // 진행률
    const progressWidth = (barWidth * avgProgress) / 100;
    const progressColor = avgProgress >= 80 ? "#28a745" : avgProgress >= 50 ? "#ffd33d" : "#d73a49";
    this.ctx.fillStyle = progressColor;
    this.roundRect(barX, barY, progressWidth, barHeight, 2);
    this.ctx.fill();
  }

  /**
   * 진행률 gradient가 포함된 막대 그리기
   */
  protected drawBarsWithProgress(offsetY: number): void {
    const treePanelWidth = this.getTreePanelWidth();

    this.data.bars.forEach((bar) => {
      const startDate = new Date(bar.startDate);
      const endDate = new Date(bar.endDate);
      const rangeStart = new Date(this.data.timeline.rangeStart);

      const daysSinceStart = Math.floor(
        (startDate.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)
      );
      const duration =
        Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      const barX = treePanelWidth + daysSinceStart * DAY_WIDTH;
      const barWidth = duration * DAY_WIDTH - 2;

      // Row 찾기
      const rowNode = this.data.treeNodes.find((node) => node.id === bar.rowId);
      if (!rowNode) return;

      const barY = offsetY + rowNode.top + 6 + bar.lane * 26;
      const barHeight = 22;

      // 상태별 색상
      const barColor = this.getStatusColor(bar.status);

      // 진행률 gradient
      if (bar.progress !== undefined && bar.progress > 0) {
        const progress = Math.min(100, Math.max(0, bar.progress));
        const progressX = barX + (barWidth * progress) / 100;

        // Gradient 생성
        const gradient = this.ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
        gradient.addColorStop(0, barColor);
        gradient.addColorStop(progress / 100, barColor);
        gradient.addColorStop(progress / 100, barColor + "30"); // 30% 투명도
        gradient.addColorStop(1, barColor + "30");

        this.ctx.fillStyle = gradient;
        this.roundRect(barX, barY, barWidth, barHeight, 3);
        this.ctx.fill();

        // 진행률 구분선
        if (progress < 100 && progress > 0) {
          this.ctx.strokeStyle = barColor + "80";
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.moveTo(progressX, barY);
          this.ctx.lineTo(progressX, barY + barHeight);
          this.ctx.stroke();
        }
      } else {
        // 진행률 없는 경우 일반 막대
        this.ctx.fillStyle = barColor;
        this.roundRect(barX, barY, barWidth, barHeight, 3);
        this.ctx.fill();
      }

      // 텍스트 영역 (기존 로직 유지)
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

      // 날짜 레이블 (옵션)
      if (this.canvasOptions.showDateLabels && barWidth > 80) {
        const dateText = `${bar.startDate} ~ ${bar.endDate}`;
        this.drawText(dateText, barX + barWidth / 2, barY + barHeight + 10, {
          font: "400 9px Pretendard, sans-serif",
          color: "#6a737d",
          align: "center",
          baseline: "top",
        });
      }
    });
  }

  /**
   * 범례 및 통계 섹션 그리기
   */
  protected drawLegendAndStatistics(offsetY: number): void {
    const totalWidth = this.getTreePanelWidth() + this.data.timeline.width;

    // 배경
    this.ctx.fillStyle = "#f6f8fa";
    this.ctx.fillRect(0, offsetY, totalWidth, LEGEND_HEIGHT);

    // 상단 테두리
    this.ctx.strokeStyle = "#e1e4e8";
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(0, offsetY);
    this.ctx.lineTo(totalWidth, offsetY);
    this.ctx.stroke();

    // 좌측: 범례
    if (this.canvasOptions.showLegend) {
      this.drawLegend(16, offsetY + 15);
    }

    // 우측: 통계
    if (this.canvasOptions.showStatistics && this.data.statistics) {
      this.drawStatistics(totalWidth - 16, offsetY + 15);
    }
  }

  /**
   * 범례 그리기
   */
  protected drawLegend(x: number, y: number): void {
    const statuses = [
      { label: "진행중", color: "#3b82f6" },
      { label: "완료", color: "#10b981" },
      { label: "보류", color: "#f59e0b" },
      { label: "취소", color: "#ef4444" },
    ];

    let currentX = x;

    statuses.forEach((status, index) => {
      // 색상 박스
      this.ctx.fillStyle = status.color;
      this.roundRect(currentX, y, 12, 12, 2);
      this.ctx.fill();

      // 레이블
      this.drawText(status.label, currentX + 18, y + 6, {
        font: "500 11px Pretendard, sans-serif",
        color: "#24292e",
        align: "left",
        baseline: "middle",
      });

      currentX += 80;
    });
  }

  /**
   * 통계 그리기
   */
  protected drawStatistics(x: number, y: number): void {
    const stats = this.data.statistics;
    if (!stats) return;

    const lines = [
      `Total: ${stats.totalCount}`,
      `진행중: ${stats.byStatus.진행중}`,
      `완료: ${stats.byStatus.완료}`,
      `보류: ${stats.byStatus.보류}`,
      `취소: ${stats.byStatus.취소}`,
    ];

    lines.forEach((line, index) => {
      this.drawText(line, x, y + index * 14, {
        font: "500 11px Pretendard, sans-serif",
        color: "#586069",
        align: "right",
        baseline: "top",
      });
    });
  }

  /**
   * 상태별 색상 반환
   */
  protected getStatusColor(status: string): string {
    const statusColors: Record<string, string> = {
      진행중: "#3b82f6",
      완료: "#10b981",
      보류: "#f59e0b",
      취소: "#ef4444",
    };
    return statusColors[status] || "#6b7280";
  }

  /**
   * 둥근 사각형 (부모 클래스에서 private이므로 재정의)
   */
  protected roundRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
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
   * 텍스트 그리기 (부모 클래스에서 private이므로 재정의)
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
   * 말줄임표 처리 (부모 클래스에서 private이므로 재정의)
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
}

