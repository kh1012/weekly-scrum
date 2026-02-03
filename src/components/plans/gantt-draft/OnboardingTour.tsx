/**
 * Onboarding Tour Component
 * - 새 기능 안내를 위한 스텝별 온보딩 가이드
 * - 백드랍 + 하이라이트 + 팝오버 형태
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { getOSKeys } from "./useOS";

interface OnboardingStep {
  id: string;
  targetSelector: string;
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right";
  // 선택적: 키보드 단축키 표시
  shortcuts?: { keys: string[]; label: string }[];
}

interface OnboardingTourProps {
  storageKey: string;
  steps: OnboardingStep[];
  onComplete: () => void;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "edit-button",
    targetSelector: '[data-onboarding="edit-button"]',
    title: "작업 시작/종료",
    description:
      "편집 모드를 시작하거나 종료할 수 있습니다. 단축키를 사용하면 더 빠르게 작업할 수 있습니다.",
    position: "bottom",
    shortcuts: [
      { keys: ["⌘", "Enter"], label: "작업 시작" },
      { keys: ["⌘", "⇧", "Enter"], label: "작업 종료" },
    ],
  },
  {
    id: "save-button",
    targetSelector: '[data-onboarding="save-button"]',
    title: "저장 & 토스트 알림",
    description:
      "저장 시 화면 하단에 토스트 메시지로 결과가 표시됩니다. 성공/실패 여부를 바로 확인할 수 있습니다.",
    position: "bottom",
    shortcuts: [{ keys: ["⌘", "S"], label: "저장" }],
  },
  {
    id: "tree-filter",
    targetSelector: '[data-onboarding="tree-filter"]',
    title: "트리 필터",
    description:
      "프로젝트, 모듈, 기능별로 필터링하고, FLAGS(기간)를 선택하면 해당 기간만 집중해서 볼 수 있습니다. 필터 설정은 URL에 저장되어 공유가 가능합니다!",
    position: "bottom",
  },
  {
    id: "tree-panel",
    targetSelector: '[data-onboarding="tree-panel"]',
    title: "트리 탐색",
    description:
      "키보드 방향키(↑↓)로 항목을 이동하고, ←→로 펼침/접힘을 조작할 수 있습니다. 항목을 선택한 뒤 Enter를 누르면 새 기능 추가 모달이 열립니다. + 버튼이나 ⌘⇧⌥N으로도 열 수 있으며, 선택한 프로젝트/모듈이 채워진 상태로 열립니다.",
    position: "right",
    shortcuts: [
      { keys: ["↑", "↓"], label: "항목 이동" },
      { keys: ["←", "→"], label: "펼침/접힘" },
      { keys: ["Enter"], label: "새 기능 추가" },
      { keys: ["⌘", "⇧", "⌥", "N"], label: "새 기능 추가 (단축키)" },
    ],
  },
];

export function OnboardingTour({
  storageKey,
  steps = ONBOARDING_STEPS,
  onComplete,
}: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const popoverRef = useRef<HTMLDivElement>(null);

  const step = steps[currentStep];

  // 대상 요소 위치 업데이트
  const updateTargetRect = useCallback(() => {
    if (!step) return;
    const target = document.querySelector(step.targetSelector);
    if (target) {
      setTargetRect(target.getBoundingClientRect());
    }
  }, [step]);

  useEffect(() => {
    updateTargetRect();

    // 리사이즈/스크롤 시 위치 재계산
    const handleUpdate = () => updateTargetRect();
    window.addEventListener("resize", handleUpdate);
    window.addEventListener("scroll", handleUpdate, true);

    return () => {
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("scroll", handleUpdate, true);
    };
  }, [updateTargetRect, currentStep]);

  // 다음 스텝
  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // 완료
      setIsVisible(false);
      onComplete();
    }
  }, [currentStep, steps.length, onComplete]);

  // 이전 스텝
  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  // 건너뛰기
  const handleSkip = useCallback(() => {
    setIsVisible(false);
    onComplete();
  }, [onComplete]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleSkip();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSkip]);

  if (!isVisible || !step || !targetRect) return null;

  const isLastStep = currentStep === steps.length - 1;
  const padding = 8;

  // 팝오버 위치 계산
  const getPopoverStyle = (): React.CSSProperties => {
    const popoverWidth = 360;
    const popoverMargin = 16;

    switch (step.position) {
      case "bottom":
        return {
          top: targetRect.bottom + popoverMargin,
          left: Math.max(
            popoverMargin,
            Math.min(
              targetRect.left + targetRect.width / 2 - popoverWidth / 2,
              window.innerWidth - popoverWidth - popoverMargin
            )
          ),
          width: popoverWidth,
        };
      case "top":
        return {
          bottom: window.innerHeight - targetRect.top + popoverMargin,
          left: Math.max(
            popoverMargin,
            Math.min(
              targetRect.left + targetRect.width / 2 - popoverWidth / 2,
              window.innerWidth - popoverWidth - popoverMargin
            )
          ),
          width: popoverWidth,
        };
      case "left":
        return {
          top: targetRect.top + targetRect.height / 2 - 100,
          right: window.innerWidth - targetRect.left + popoverMargin,
          width: popoverWidth,
        };
      case "right":
        return {
          top: targetRect.top,
          left: targetRect.right + popoverMargin,
          width: popoverWidth,
        };
      default:
        return {};
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      {/* SVG 마스크 백드랍 - 대상만 하이라이트 */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <mask id="spotlight-mask">
            {/* 전체 흰색 (보이는 영역) */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* 하이라이트 영역만 검정 (투명 영역) */}
            <rect
              x={targetRect.left - padding}
              y={targetRect.top - padding}
              width={targetRect.width + padding * 2}
              height={targetRect.height + padding * 2}
              rx="8"
              fill="black"
            />
          </mask>
        </defs>
        {/* 백드랍 */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.6)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* 하이라이트 테두리 */}
      <div
        className="absolute pointer-events-none transition-all duration-300"
        style={{
          top: targetRect.top - padding,
          left: targetRect.left - padding,
          width: targetRect.width + padding * 2,
          height: targetRect.height + padding * 2,
          borderRadius: 8,
          border: "2px solid #3b82f6",
          boxShadow: "0 0 0 4px rgba(59, 130, 246, 0.3)",
        }}
      />

      {/* 팝오버 */}
      <div
        ref={popoverRef}
        className="absolute bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
        style={getPopoverStyle()}
      >
        {/* 헤더 */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-semibold text-gray-900">
              {step.title}
            </h3>
            <span className="text-xs text-gray-400">
              {currentStep + 1} / {steps.length}
            </span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            {step.description}
          </p>
        </div>

        {/* 단축키 표시 */}
        {step.shortcuts && step.shortcuts.length > 0 && (
          <div className="px-5 pb-3">
            <div className="flex flex-wrap gap-3">
              {step.shortcuts.map((shortcut, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <div className="flex gap-0.5">
                    {getOSKeys(shortcut.keys).map((key, keyIdx) => (
                      <kbd
                        key={keyIdx}
                        className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-700 rounded font-mono"
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">
                    {shortcut.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 버튼 영역 */}
        <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-t border-gray-100">
          <button
            onClick={handleSkip}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            건너뛰기
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                이전
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-4 py-1.5 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
            >
              {isLastStep ? "완료" : "다음"}
            </button>
          </div>
        </div>

        {/* 진행 바 */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{
              width: `${((currentStep + 1) / steps.length) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}

// 온보딩 표시 여부 확인 훅
export function useOnboardingTour(storageKey: string) {
  const [shouldShow, setShouldShow] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 클라이언트에서만 실행
    if (typeof window === "undefined") return;

    const hasCompleted = localStorage.getItem(storageKey);
    if (!hasCompleted) {
      // 약간의 딜레이 후 표시 (DOM 렌더링 대기)
      const timer = setTimeout(() => {
        setShouldShow(true);
        setIsReady(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
    setIsReady(true);
  }, [storageKey]);

  const completeOnboarding = useCallback(() => {
    localStorage.setItem(storageKey, new Date().toISOString());
    setShouldShow(false);
  }, [storageKey]);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(storageKey);
    setShouldShow(true);
  }, [storageKey]);

  return {
    shouldShow,
    isReady,
    completeOnboarding,
    resetOnboarding,
  };
}
