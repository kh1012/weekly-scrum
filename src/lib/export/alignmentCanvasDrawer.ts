/**
 * Alignment Canvas Drawer for Gantt Chart
 * 
 * AdvancedGanttCanvasDrawer를 확장하여 Alignment 특화 기능 제공:
 * - Plan-Snapshot 연결 화살표
 * - Alignment 상태 시각화
 * - Snapshot 스타일 차별화
 */

import { AdvancedGanttCanvasDrawer } from "./advancedCanvasDrawer";
import type { GanttExportData } from "./imageExporter";
import type { ExportOptions, CanvasArrow } from "./types";

// 레이아웃 상수
const HEADER_HEIGHT = 76;
const FLAG_LANE_HEIGHT = 60;
const ROW_HEIGHT = 40;
const DAY_WIDTH = 24;

/**
 * Alignment Canvas Drawer 클래스
 */
export class AlignmentCanvasDrawer extends AdvancedGanttCanvasDrawer {
  constructor(
    canvas: HTMLCanvasElement,
    data: GanttExportData,
    scale: number = 2,
    options: ExportOptions = {}
  ) {
    super(canvas, data, scale, options);
  }

  /**
   * 메인 렌더링 (오버라이드)
   */
  public async render(): Promise<void> {
    // 부모 클래스 렌더링 먼저 수행
    await super.render();

    // Alignment 특화 렌더링
    let offsetY = 0;
    if (this.canvasOptions.showMetadata && this.data.metadata) {
      offsetY += 50; // METADATA_HEIGHT
    }

    const barsOffsetY = offsetY + HEADER_HEIGHT + FLAG_LANE_HEIGHT;

    // Alignment 연결 화살표
    if (this.canvasOptions.showAlignmentArrows && this.data.arrows) {
      this.drawAlignmentArrows(barsOffsetY);
    }

    // Alignment 상태 아이콘 및 Coverage 정보
    this.drawAlignmentStatus(barsOffsetY);

    // Snapshot 스타일 오버레이
    this.drawSnapshotOverlay(barsOffsetY);
  }

  /**
   * Alignment 연결 화살표 그리기
   */
  protected drawAlignmentArrows(offsetY: number): void {
    if (!this.data.arrows || this.data.arrows.length === 0) return;

    const treePanelWidth = this.getTreePanelWidth();

    // 화살표 충돌 방지를 위한 오프셋 계산
    const arrowOffsets = this.calculateArrowOffsets(this.data.arrows);

    this.data.arrows.forEach((arrow, index) => {
      const fromBar = this.data.bars.find((b) => b.id === arrow.fromBarId);
      const toBar = this.data.bars.find((b) => b.id === arrow.toBarId);

      if (!fromBar || !toBar) return;

      // 시작점 계산 (Plan bar 우측 중앙)
      const fromNode = this.data.treeNodes.find((n) => n.id === fromBar.rowId);
      if (!fromNode) return;

      const fromStartDate = new Date(fromBar.startDate);
      const fromEndDate = new Date(fromBar.endDate);
      const rangeStart = new Date(this.data.timeline.rangeStart);

      const fromDaysSinceStart = Math.floor(
        (fromStartDate.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)
      );
      const fromDuration =
        Math.floor((fromEndDate.getTime() - fromStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      const fromX = treePanelWidth + fromDaysSinceStart * DAY_WIDTH + fromDuration * DAY_WIDTH - 2;
      const fromY = offsetY + fromNode.top + 6 + fromBar.lane * 26 + 11; // 막대 중앙

      // 끝점 계산 (Snapshot bar 좌측 중앙)
      const toNode = this.data.treeNodes.find((n) => n.id === toBar.rowId);
      if (!toNode) return;

      const toStartDate = new Date(toBar.startDate);
      const toDaysSinceStart = Math.floor(
        (toStartDate.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)
      );

      const toX = treePanelWidth + toDaysSinceStart * DAY_WIDTH;
      const toY = offsetY + toNode.top + 6 + toBar.lane * 26 + 11; // 막대 중앙

      // 화살표 그리기
      this.drawCurvedArrow(
        fromX,
        fromY,
        toX,
        toY,
        arrow.color,
        arrowOffsets[index]
      );
    });
  }

  /**
   * 화살표 충돌 방지를 위한 오프셋 계산
   */
  protected calculateArrowOffsets(arrows: CanvasArrow[]): number[] {
    const offsets: number[] = [];
    const usedPaths = new Map<string, number>();

    arrows.forEach((arrow) => {
      const fromBar = this.data.bars.find((b) => b.id === arrow.fromBarId);
      const toBar = this.data.bars.find((b) => b.id === arrow.toBarId);

      if (!fromBar || !toBar) {
        offsets.push(0);
        return;
      }

      // 경로 키 생성 (from-to 조합)
      const pathKey = `${fromBar.rowId}-${toBar.rowId}`;

      if (usedPaths.has(pathKey)) {
        const count = usedPaths.get(pathKey)!;
        usedPaths.set(pathKey, count + 1);
        offsets.push(count * 15); // 15px씩 오프셋
      } else {
        usedPaths.set(pathKey, 1);
        offsets.push(0);
      }
    });

    return offsets;
  }

  /**
   * 곡선 화살표 그리기
   */
  protected drawCurvedArrow(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    color: string,
    verticalOffset: number = 0
  ): void {
    // 제어점 계산 (중간 지점 + 세로 오프셋)
    const midX = (fromX + toX) / 2;
    const controlY = Math.min(fromY, toY) - 30 - verticalOffset;

    // 화살표 선
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([4, 4]); // 점선
    this.ctx.beginPath();
    this.ctx.moveTo(fromX, fromY);
    this.ctx.quadraticCurveTo(midX, controlY, toX, toY);
    this.ctx.stroke();
    this.ctx.setLineDash([]); // 점선 해제

    // 화살표 머리
    const arrowSize = 6;
    const angle = Math.atan2(toY - controlY, toX - midX);

    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.moveTo(toX, toY);
    this.ctx.lineTo(
      toX - arrowSize * Math.cos(angle - Math.PI / 6),
      toY - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    this.ctx.lineTo(
      toX - arrowSize * Math.cos(angle + Math.PI / 6),
      toY - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    this.ctx.closePath();
    this.ctx.fill();
  }

  /**
   * Alignment 상태 시각화
   */
  protected drawAlignmentStatus(offsetY: number): void {
    const treePanelWidth = this.getTreePanelWidth();

    this.data.bars.forEach((bar) => {
      // Snapshot은 제외 (Plan만)
      if (bar.isSnapshot) return;
      if (!bar.alignmentStatus) return;

      const startDate = new Date(bar.startDate);
      const rangeStart = new Date(this.data.timeline.rangeStart);

      const daysSinceStart = Math.floor(
        (startDate.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)
      );

      const barX = treePanelWidth + daysSinceStart * DAY_WIDTH;

      // Row 찾기
      const rowNode = this.data.treeNodes.find((node) => node.id === bar.rowId);
      if (!rowNode) return;

      const barY = offsetY + rowNode.top + 6 + bar.lane * 26;

      // 상태 아이콘 (좌측 상단)
      const iconX = barX + 4;
      const iconY = barY + 4;
      const iconSize = 12;

      // 상태별 색상
      const statusColor = this.getAlignmentStatusColor(bar.alignmentStatus);

      // 아이콘 배경
      this.ctx.fillStyle = "#ffffff";
      this.ctx.beginPath();
      this.ctx.arc(iconX + iconSize / 2, iconY + iconSize / 2, iconSize / 2, 0, Math.PI * 2);
      this.ctx.fill();

      // 아이콘 (상태 표시)
      this.ctx.fillStyle = statusColor;
      this.ctx.beginPath();
      this.ctx.arc(iconX + iconSize / 2, iconY + iconSize / 2, iconSize / 2 - 1, 0, Math.PI * 2);
      this.ctx.fill();

      // Coverage 정보 (우측 상단)
      if (bar.alignmentActualCount !== undefined && bar.alignmentExpectedCount !== undefined) {
        const coverageText = `${bar.alignmentActualCount}/${bar.alignmentExpectedCount}`;
        const duration =
          Math.floor(
            (new Date(bar.endDate).getTime() - new Date(bar.startDate).getTime()) /
              (1000 * 60 * 60 * 24)
          ) + 1;
        const barWidth = duration * DAY_WIDTH - 2;

        // Coverage 배경
        const textWidth = this.ctx.measureText(coverageText).width + 8;
        this.ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        this.roundRect(barX + barWidth - textWidth - 4, barY + 4, textWidth, 14, 2);
        this.ctx.fill();

        // Coverage 텍스트
        this.drawText(coverageText, barX + barWidth - 8, barY + 11, {
          font: "600 9px Pretendard, sans-serif",
          color: statusColor,
          align: "right",
          baseline: "middle",
        });
      }
    });
  }

  /**
   * Snapshot 스타일 오버레이
   */
  protected drawSnapshotOverlay(offsetY: number): void {
    const treePanelWidth = this.getTreePanelWidth();

    this.data.bars.forEach((bar) => {
      if (!bar.isSnapshot) return;

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

      // 반투명 오버레이
      this.ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      this.roundRect(barX, barY, barWidth, barHeight, 3);
      this.ctx.fill();

      // 점선 테두리
      this.ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
      this.ctx.lineWidth = 1;
      this.ctx.setLineDash([3, 3]);
      this.roundRect(barX, barY, barWidth, barHeight, 3);
      this.ctx.stroke();
      this.ctx.setLineDash([]);

      // Author 이름 (하단)
      if (bar.authorName && barWidth > 60) {
        this.drawText(bar.authorName, barX + barWidth / 2, barY + barHeight + 10, {
          font: "500 9px Pretendard, sans-serif",
          color: "#6a737d",
          align: "center",
          baseline: "top",
          maxWidth: barWidth - 4,
        });
      }
    });
  }

  /**
   * Alignment 상태별 색상 반환
   */
  protected getAlignmentStatusColor(status: "green" | "orange" | "red"): string {
    const colors = {
      green: "#28a745",
      orange: "#fb8500",
      red: "#d73a49",
    };
    return colors[status];
  }
}

