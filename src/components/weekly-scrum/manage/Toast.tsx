"use client";

/**
 * Airbnb 스타일 토스트 알림 컴포넌트
 * 
 * - 부드러운 fade + slide 애니메이션
 * - 깔끔한 디자인과 섬세한 그림자
 * - 자동 사라짐 진행 바
 */

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from "react";
import { createPortal } from "react-dom";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
  createdAt: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: "success" | "error" | "info") => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION = 3000; // 3초

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

function ToastItem({ 
  toast, 
  onRemove 
}: { 
  toast: Toast; 
  onRemove: (id: string) => void;
}) {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // 진행 바 애니메이션
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / TOAST_DURATION) * 100);
      setProgress(remaining);
      
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 16);

    // 자동 제거
    const exitTimeout = setTimeout(() => {
      setIsExiting(true);
    }, TOAST_DURATION - 300);

    const removeTimeout = setTimeout(() => {
      onRemove(toast.id);
    }, TOAST_DURATION);

    return () => {
      clearInterval(interval);
      clearTimeout(exitTimeout);
      clearTimeout(removeTimeout);
    };
  }, [toast.id, onRemove]);

  const handleClick = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 200);
  };

  // 타입별 스타일
  const typeStyles = {
    success: {
      bg: "bg-gray-900",
      accent: "bg-emerald-500",
      icon: (
        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      ),
    },
    error: {
      bg: "bg-gray-900",
      accent: "bg-rose-500",
      icon: (
        <div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      ),
    },
    info: {
      bg: "bg-gray-900",
      accent: "bg-blue-500",
      icon: (
        <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      ),
    },
  };

  const styles = typeStyles[toast.type];

  return (
    <div
      onClick={handleClick}
      className={`
        relative overflow-hidden cursor-pointer
        flex items-center gap-3 px-4 py-3.5 min-w-[280px] max-w-[380px]
        ${styles.bg} text-white rounded-2xl
        shadow-[0_8px_30px_rgb(0,0,0,0.3)]
        transition-all duration-300 ease-out
        ${isExiting 
          ? "opacity-0 translate-x-4 scale-95" 
          : "opacity-100 translate-x-0 scale-100"
        }
      `}
      style={{
        animation: isExiting ? undefined : "toast-enter 0.4s cubic-bezier(0.21, 1.02, 0.73, 1) forwards",
      }}
    >
      {/* 아이콘 */}
      {styles.icon}
      
      {/* 메시지 */}
      <span className="flex-1 text-sm font-medium text-gray-100 leading-snug">
        {toast.message}
      </span>

      {/* 닫기 버튼 */}
      <button 
        className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* 진행 바 */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
        <div 
          className={`h-full ${styles.accent} transition-all ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // 커스텀 애니메이션 스타일 삽입
    const styleId = "toast-animations";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        @keyframes toast-enter {
          0% {
            opacity: 0;
            transform: translateX(100%) scale(0.9);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setToasts((prev) => [...prev, { id, message, type, createdAt: Date.now() }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {mounted &&
        createPortal(
          <div className="fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-3">
            {toasts.map((toast) => (
              <ToastItem 
                key={toast.id} 
                toast={toast} 
                onRemove={removeToast} 
              />
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}
