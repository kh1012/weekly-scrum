/**
 * useWorkMapResize Hook
 * 
 * WorkMapView 리사이즈 로직
 * - 트리 너비 조절
 * - 네트워크 영역 높이 조절
 */

import { useState, useRef, useCallback } from "react";

export function useWorkMapResize() {
  // 트리 너비 조절 상태 (기본 450px)
  const [treeWidth, setTreeWidth] = useState(450);
  const isResizing = useRef(false);

  // 네트워크 영역 높이 조절 상태 (기본 672px, 최대 960px)
  const [networkHeight, setNetworkHeight] = useState(672);
  const isNetworkResizing = useRef(false);

  // 트리 리사이즈 핸들러
  const handleTreeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isResizing.current = true;
      e.preventDefault();

      const startX = e.clientX;
      const startWidth = treeWidth;

      const handleMouseMove = (e: MouseEvent) => {
        if (!isResizing.current) return;
        const delta = e.clientX - startX;
        // 최소 280px, 최대 700px
        const newWidth = Math.max(280, Math.min(700, startWidth + delta));
        setTreeWidth(newWidth);
      };

      const handleMouseUp = () => {
        isResizing.current = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [treeWidth]
  );

  // 네트워크 리사이즈 핸들러
  const handleNetworkMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isNetworkResizing.current = true;
      e.preventDefault();

      const startY = e.clientY;
      const startHeight = networkHeight;

      const handleMouseMove = (moveE: MouseEvent) => {
        if (!isNetworkResizing.current) return;
        const delta = moveE.clientY - startY;
        const newHeight = Math.max(
          400,
          Math.min(960, startHeight + delta)
        );
        setNetworkHeight(newHeight);
      };

      const handleMouseUp = () => {
        isNetworkResizing.current = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [networkHeight]
  );

  return {
    treeWidth,
    setTreeWidth,
    networkHeight,
    setNetworkHeight,
    handleTreeMouseDown,
    handleNetworkMouseDown,
  };
}
