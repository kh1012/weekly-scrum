/**
 * DraftTimeline 스냅샷 연결 SVG 화살표
 */

"use client";

import type { DraftBar as DraftBarType } from "../../types";

interface SnapshotConnectionsProps {
  connections: Array<{
    fromBar: DraftBarType;
    toBar: DraftBarType;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
  }>;
  totalWidth: number;
  totalHeight: number;
}

export function SnapshotConnections({
  connections,
  totalWidth,
  totalHeight,
}: SnapshotConnectionsProps) {
  if (connections.length === 0) return null;

  return (
    <svg
      className="absolute top-0 left-0 pointer-events-none"
      style={{
        width: totalWidth,
        height: totalHeight,
        zIndex: 2,
      }}
    >
      {connections.map((conn, idx) => {
        // 화살표 경로 계산 (베지어 곡선)
        const dx = conn.toX - conn.fromX;
        const dy = conn.toY - conn.fromY;
        const midX = conn.fromX + dx / 2;

        // 화살표 끝 부분의 각도 계산 (베지어 곡선의 끝 부분 접선)
        const arrowSize = 8;
        const angle = Math.atan2(dy, dx);

        // V자형 화살표의 두 끝점
        const arrowAngle = Math.PI / 6; // 30도
        const arrowX1 = conn.toX - arrowSize * Math.cos(angle - arrowAngle);
        const arrowY1 = conn.toY - arrowSize * Math.sin(angle - arrowAngle);
        const arrowX2 = conn.toX - arrowSize * Math.cos(angle + arrowAngle);
        const arrowY2 = conn.toY - arrowSize * Math.sin(angle + arrowAngle);

        return (
          <g key={idx}>
            {/* 메인 연결선 */}
            <path
              d={`M ${conn.fromX} ${conn.fromY} C ${midX} ${conn.fromY}, ${midX} ${conn.toY}, ${conn.toX} ${conn.toY}`}
              stroke="#9ca3af"
              strokeWidth="1.5"
              fill="none"
              opacity="0.5"
            />
            {/* V자형 화살표 */}
            <path
              d={`M ${arrowX1} ${arrowY1} L ${conn.toX} ${conn.toY} L ${arrowX2} ${arrowY2}`}
              stroke="#9ca3af"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.5"
            />
          </g>
        );
      })}
    </svg>
  );
}

