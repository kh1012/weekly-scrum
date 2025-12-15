"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

/**
 * 고양이 마스코트 아이콘 컴포넌트
 */
function ScrumCatIcon({ className = "w-16 h-16" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background */}
      <rect width="64" height="64" rx="16" fill="url(#catGradient)" />

      {/* Cat Face */}
      <ellipse cx="32" cy="34" rx="18" ry="16" fill="white" />

      {/* Left Ear */}
      <path d="M14 24L18 12L26 22Z" fill="white" />
      <path d="M16 21L19 14L23 20Z" fill="#FF6B9D" />

      {/* Right Ear */}
      <path d="M50 24L46 12L38 22Z" fill="white" />
      <path d="M48 21L45 14L41 20Z" fill="#FF6B9D" />

      {/* Eyes */}
      <ellipse cx="24" cy="30" rx="4" ry="5" fill="#1a1a2e" />
      <ellipse cx="40" cy="30" rx="4" ry="5" fill="#1a1a2e" />
      <circle cx="25" cy="29" r="1.5" fill="white" />
      <circle cx="41" cy="29" r="1.5" fill="white" />

      {/* Nose */}
      <ellipse cx="32" cy="38" rx="2.5" ry="2" fill="#FF6B9D" />

      {/* Mouth */}
      <path
        d="M32 40C32 40 28 44 26 43"
        stroke="#1a1a2e"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M32 40C32 40 36 44 38 43"
        stroke="#1a1a2e"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Whiskers */}
      <line
        x1="12"
        y1="34"
        x2="20"
        y2="36"
        stroke="#1a1a2e"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <line
        x1="12"
        y1="38"
        x2="20"
        y2="38"
        stroke="#1a1a2e"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <line
        x1="44"
        y1="36"
        x2="52"
        y2="34"
        stroke="#1a1a2e"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <line
        x1="44"
        y1="38"
        x2="52"
        y2="38"
        stroke="#1a1a2e"
        strokeWidth="1"
        strokeLinecap="round"
      />

      <defs>
        <linearGradient
          id="catGradient"
          x1="0"
          y1="0"
          x2="64"
          y2="64"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * 배경 장식 요소
 */
function BackgroundDecoration() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gradient Orbs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br from-violet-400/30 to-fuchsia-400/30 blur-3xl animate-pulse" />
      <div className="absolute top-1/4 -left-32 w-80 h-80 rounded-full bg-gradient-to-br from-indigo-400/25 to-cyan-400/25 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      <div className="absolute -bottom-32 right-1/4 w-72 h-72 rounded-full bg-gradient-to-br from-pink-400/20 to-orange-400/20 blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,1) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Floating Shapes */}
      <div className="absolute top-20 left-[15%] w-4 h-4 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 opacity-60 animate-float" />
      <div className="absolute top-40 right-[20%] w-3 h-3 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 opacity-50 animate-float" style={{ animationDelay: "0.5s" }} />
      <div className="absolute bottom-32 left-[25%] w-5 h-5 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 opacity-40 animate-float" style={{ animationDelay: "1s" }} />
      <div className="absolute top-1/2 right-[10%] w-6 h-6 rounded-lg rotate-45 bg-gradient-to-r from-cyan-500 to-teal-500 opacity-30 animate-float" style={{ animationDelay: "1.5s" }} />
      <div className="absolute bottom-48 right-[30%] w-4 h-4 rounded-lg rotate-12 bg-gradient-to-r from-amber-500 to-orange-500 opacity-40 animate-float" style={{ animationDelay: "2s" }} />

      {/* Decorative Lines */}
      <svg className="absolute top-0 left-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="diagonal-lines" patternUnits="userSpaceOnUse" width="40" height="40" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="40" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#diagonal-lines)" />
      </svg>
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
      },
    });

    setIsLoading(false);

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({
        type: "success",
        text: "이메일을 확인해주세요. 로그인 링크가 발송되었습니다.",
      });
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-violet-50/30">
      <BackgroundDecoration />

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md px-6 py-12">
        {/* Card */}
        <div
          className="relative backdrop-blur-xl rounded-3xl p-8 md:p-10 border border-white/60"
          style={{
            background: "rgba(255, 255, 255, 0.8)",
            boxShadow: `
              0 0 0 1px rgba(255,255,255,0.5),
              0 25px 50px -12px rgba(0, 0, 0, 0.08),
              0 12px 24px -8px rgba(99, 102, 241, 0.08)
            `,
          }}
        >
          {/* Logo & Title */}
          <div className="text-center mb-10">
            <div className="relative inline-block">
              <ScrumCatIcon className="w-20 h-20 mx-auto drop-shadow-xl" />
              {/* Glow effect */}
              <div className="absolute inset-0 w-20 h-20 mx-auto rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 opacity-20 blur-xl -z-10" />
            </div>
            <h1 className="mt-6 text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent tracking-tight">
              Weekly Scrum
            </h1>
            <p className="mt-2 text-gray-500 text-sm font-medium">
              팀의 주간 업무를 한눈에 관리하세요
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                이메일 주소
              </label>
              <div
                className={`relative rounded-2xl transition-all duration-300 ${
                  isFocused
                    ? "ring-2 ring-indigo-500/50 ring-offset-2 ring-offset-white"
                    : ""
                }`}
              >
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg
                    className={`w-5 h-5 transition-colors duration-200 ${
                      isFocused ? "text-indigo-500" : "text-gray-400"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="you@company.com"
                  required
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-100 bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-200 focus:bg-white transition-all duration-200 text-base"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="group relative w-full py-4 px-6 rounded-2xl text-white font-semibold text-base overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-500/25 active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)",
              }}
            >
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              
              <span className="relative flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>전송 중...</span>
                  </>
                ) : (
                  <>
                    <span>매직 링크 받기</span>
                    <svg
                      className="w-5 h-5 transition-transform group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Message */}
          {message && (
            <div
              className={`mt-6 p-4 rounded-2xl text-sm font-medium flex items-start gap-3 animate-fade-in ${
                message.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {message.type === "success" ? (
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Divider */}
          <div className="mt-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
            <span className="text-xs text-gray-400 font-medium">비밀번호 없이 로그인</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-gray-400 leading-relaxed">
            이메일로 발송된 링크를 클릭하면
            <br />
            자동으로 로그인됩니다
          </p>
        </div>

        {/* Bottom decoration */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-400">
          <ScrumCatIcon className="w-4 h-4" />
          <span>Powered by Weekly Scrum</span>
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-violet-50/30">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse" />
            <div className="text-gray-400 text-sm font-medium">로딩 중...</div>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
