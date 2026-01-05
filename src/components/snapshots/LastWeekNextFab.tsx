"use client";

import { useState, useEffect } from "react";
import { LastWeekNextPanel } from "./LastWeekNextPanel";
import type { LastWeekNextItem } from "@/lib/data/lastWeekNext";

interface LastWeekNextFabProps {
  workspaceId: string;
  userId: string;
  year: number;
  week: number;
}

export function LastWeekNextFab({
  workspaceId,
  userId,
  year,
  week,
}: LastWeekNextFabProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<LastWeekNextItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 패널 열 때 데이터 fetch
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/snapshots/last-week-next?workspaceId=${encodeURIComponent(
            workspaceId
          )}&userId=${encodeURIComponent(userId)}&year=${year}&week=${week}`
        );

        if (response.ok) {
          const data = await response.json();
          setItems(data.items || []);
        } else {
          console.error("Failed to fetch last week next");
          setItems([]);
        }
      } catch (error) {
        console.error("Error fetching last week next:", error);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isOpen, workspaceId, userId, year, week]);

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-5 bottom-5 z-[9997] flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 font-medium text-sm"
        title="지난 주 Next 항목 참고하기"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <span className="hidden sm:inline">지난 주 Next 참고</span>
      </button>

      {/* Panel */}
      <LastWeekNextPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        items={items}
        isLoading={isLoading}
      />
    </>
  );
}

