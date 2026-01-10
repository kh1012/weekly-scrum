/**
 * useWorkMapMobile Hook
 * 
 * WorkMapView 모바일 감지 및 뷰 상태 관리
 */

import { useState, useEffect } from "react";

type MobileView = "tree" | "detail";

export function useWorkMapMobile() {
  // 모바일 관련 상태
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState<MobileView>("tree");

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 모바일에서 트리 뷰로 돌아가기
  const handleBackToTree = () => {
    setMobileView("tree");
  };

  // 모바일에서 디테일 뷰로 전환
  const showMobileDetail = () => {
    if (isMobile) {
      setMobileView("detail");
    }
  };

  return {
    isMobile,
    mobileView,
    setMobileView,
    handleBackToTree,
    showMobileDetail,
  };
}
