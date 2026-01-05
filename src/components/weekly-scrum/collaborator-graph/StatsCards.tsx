"use client";

import { useState } from "react";
import type { GraphStats, GraphNode, GraphEdge } from "./buildCollabGraph";

interface StatsCardsProps {
  stats: GraphStats;
  selectedNode: GraphNode | null;
  selectedEdge: GraphEdge | null;
  allNodes: GraphNode[];
}

export function StatsCards({
  stats,
  selectedNode,
  selectedEdge,
  allNodes,
}: StatsCardsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <>
      <div className="w-full space-y-4">
        {/* Overview Card */}
        <div className="w-full bg-white rounded-md border border-[#d0d7de] p-3">
          <h2 className="text-xs font-semibold text-[#24292f] mb-2.5">
            Overview
          </h2>
          <div className="space-y-2.5">
            <div>
              <div className="text-[11px] text-[#57606a] mb-0.5">
                선택된 기간
              </div>
              <div className="text-xs font-medium text-[#24292f]">
                {stats.selectedWeekRangeLabel}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <div className="text-[11px] text-[#57606a] mb-0.5">
                  총 협업 횟수
                </div>
                <div className="text-sm font-semibold text-[#0969da]">
                  {stats.totalCollabWeight}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[#57606a] mb-0.5">
                  참여자 수
                </div>
                <div className="text-sm font-semibold text-[#0969da]">
                  {stats.participantCount}
                </div>
              </div>
            </div>
            {stats.topCollaborator && (
              <div className="pt-2.5 border-t border-[#d0d7de]">
                <div className="text-[11px] text-[#57606a] mb-0.5">
                  🏆 최다 협업자
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium text-[#24292f]">
                    {stats.topCollaborator.label}
                  </div>
                  <div className="text-xs font-semibold text-[#0969da]">
                    {stats.topCollaborator.totalCollabs}회
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top 3 Collaborators Card */}
        <div className="w-full bg-white rounded-md border border-[#d0d7de] p-3">
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-xs font-semibold text-[#24292f]">
              Top 3 Collaborators
            </h2>
            {stats.top3Collaborators.length > 0 && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-[11px] text-[#0969da] hover:underline font-normal"
              >
                더보기
              </button>
            )}
          </div>
          {stats.top3Collaborators.length === 0 ? (
            <div className="text-center text-[11px] text-[#57606a] py-3">
              데이터 없음
            </div>
          ) : (
            <div className="space-y-2.5">
              {stats.top3Collaborators.map((collab, index) => {
                const percentage =
                  stats.totalCollabWeight > 0
                    ? (collab.totalCollabs / stats.totalCollabWeight) * 100
                    : 0;

                return (
                  <div key={collab.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[11px] font-semibold ${
                            index === 0
                              ? "text-[#0969da]"
                              : index === 1
                              ? "text-[#57606a]"
                              : "text-[#8c959f]"
                          }`}
                        >
                          #{index + 1}
                        </span>
                        <span className="text-xs font-normal text-[#24292f]">
                          {collab.label}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#57606a]">
                        {collab.totalCollabs}회 ({percentage.toFixed(1)}%)
                      </div>
                    </div>
                    <div className="w-full bg-[#f6f8fa] rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${
                          index === 0
                            ? "bg-[#0969da]"
                            : index === 1
                            ? "bg-[#57606a]"
                            : "bg-[#8c959f]"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Distribution Card */}
        <div className="w-full bg-white rounded-md border border-[#d0d7de] p-3">
          <h2 className="text-xs font-semibold text-[#24292f] mb-2.5">
            Distribution
          </h2>
          {stats.totalCollabWeight === 0 ? (
            <div className="text-center text-[11px] text-[#57606a] py-3">
              데이터 없음
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Donut Chart (Simple SVG) */}
              <div className="flex justify-center">
                <svg width="100" height="100" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#f6f8fa"
                    strokeWidth="16"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#0969da"
                    strokeWidth="16"
                    strokeDasharray={`${
                      (stats.distributionData.top1Share / 100) * 251.2
                    } 251.2`}
                    strokeDashoffset="0"
                    transform="rotate(-90 50 50)"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#57606a"
                    strokeWidth="16"
                    strokeDasharray={`${
                      (stats.distributionData.top3Share / 100) * 251.2
                    } 251.2`}
                    strokeDashoffset={`${
                      -(stats.distributionData.top1Share / 100) * 251.2
                    }`}
                    transform="rotate(-90 50 50)"
                  />
                  <text
                    x="50"
                    y="48"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="11"
                    fontWeight="600"
                    fill="#24292f"
                  >
                    Top 3
                  </text>
                  <text
                    x="50"
                    y="60"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="10"
                    fill="#57606a"
                  >
                    {stats.distributionData.top3Share.toFixed(1)}%
                  </text>
                </svg>
              </div>

              {/* Legend */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#0969da]" />
                    <span className="text-[#57606a]">Top 1</span>
                  </div>
                  <span className="font-medium text-[#24292f]">
                    {stats.distributionData.top1Share.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#57606a]" />
                    <span className="text-[#57606a]">Top 2-3</span>
                  </div>
                  <span className="font-medium text-[#24292f]">
                    {(
                      stats.distributionData.top3Share -
                      stats.distributionData.top1Share
                    ).toFixed(1)}
                    %
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#f6f8fa] border border-[#d0d7de]" />
                    <span className="text-[#57606a]">나머지</span>
                  </div>
                  <span className="font-medium text-[#24292f]">
                    {stats.distributionData.restShare.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* All Collaborators Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#d0d7de]">
              <h2 className="text-sm font-semibold text-[#24292f]">
                전체 협업자 순위
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#57606a] hover:text-[#24292f] transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto max-h-[calc(80vh-64px)] p-4">
              {allNodes.length === 0 ? (
                <div className="text-center text-xs text-[#57606a] py-6">
                  협업 데이터가 없습니다
                </div>
              ) : (
                <div className="space-y-2.5">
                  {allNodes
                    .sort((a, b) => b.totalCollabs - a.totalCollabs)
                    .map((node, index) => {
                      const percentage =
                        stats.totalCollabWeight > 0
                          ? (node.totalCollabs / stats.totalCollabWeight) * 100
                          : 0;

                      return (
                        <div
                          key={node.id}
                          className={`p-3 rounded-md border transition-colors ${
                            index < 3
                              ? "border-[#0969da] bg-[#ddf4ff]"
                              : "border-[#d0d7de] bg-white hover:bg-[#f6f8fa]"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`text-xs font-semibold min-w-[1.75rem] ${
                                  index === 0
                                    ? "text-[#0969da]"
                                    : index === 1
                                    ? "text-[#57606a]"
                                    : index === 2
                                    ? "text-[#8c959f]"
                                    : "text-[#8c959f]"
                                }`}
                              >
                                #{index + 1}
                              </span>
                              <div>
                                <div className="text-xs font-medium text-[#24292f]">
                                  {node.label}
                                </div>
                                <div className="text-[11px] text-[#57606a] mt-0.5">
                                  {node.uniquePartners}명과 협업
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-semibold text-[#0969da]">
                                {node.totalCollabs}회
                              </div>
                              <div className="text-[11px] text-[#57606a]">
                                {percentage.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                          <div className="w-full bg-[#f6f8fa] rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                index === 0
                                  ? "bg-[#0969da]"
                                  : index === 1
                                  ? "bg-[#57606a]"
                                  : index === 2
                                  ? "bg-[#8c959f]"
                                  : "bg-[#d0d7de]"
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
