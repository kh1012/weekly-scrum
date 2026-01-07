import Link from "next/link";
import { Logo } from "@/components/weekly-scrum/common/Logo";

/**
 * 404 Not Found 페이지
 * - GitHub 스타일 디자인
 * - 라우팅 개편 안내
 */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f6f8fa] flex flex-col items-center justify-center px-4">
      <div className="max-w-xl w-full">
        {/* 로고 & 브랜드 */}
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <Logo className="w-8 h-8" />
          <span className="text-xl font-semibold text-[#24292f]">
            Weekly Scrum
          </span>
        </div>

        {/* 메인 카드 */}
        <div className="bg-white rounded-lg shadow-sm border border-[#d0d7de] p-6">
          {/* 404 아이콘 */}
          <div className="flex justify-center mb-4">
            <svg
              className="w-16 h-16 text-[#57606a]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          {/* 타이틀 */}
          <h1 className="text-2xl font-bold text-[#24292f] text-center mb-2">
            404 - 페이지를 찾을 수 없습니다
          </h1>

          {/* 설명 */}
          <p className="text-sm text-[#57606a] text-center mb-6">
            요청하신 페이지가 존재하지 않거나 이동되었습니다.
          </p>

          {/* 라우팅 개편 안내 */}
          <div className="bg-[#ddf4ff] border border-[#54aeff] rounded-md p-3 mb-6">
            <div className="flex gap-2">
              <svg
                className="w-4 h-4 text-[#0969da] shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75zM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
              </svg>
              <div>
                <h3 className="text-xs font-semibold text-[#0969da] mb-0.5">
                  라우팅 구조가 개편되었습니다
                </h3>
                <p className="text-xs text-[#0969da]">
                  더 나은 사용자 경험을 위해 메뉴 구조를 정리했습니다. 모든
                  Works 관련 페이지는 이제 <code className="px-1 py-0.5 bg-white rounded text-[10px] font-mono">/works</code> 경로 하위로
                  이동되었습니다.
                </p>
              </div>
            </div>
          </div>

          {/* 홈 버튼 */}
          <div className="flex justify-center mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#24292f] text-white text-sm font-medium rounded-md hover:bg-[#32383f] transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              홈으로 돌아가기
            </Link>
          </div>

          {/* 구분선 */}
          <div className="border-t border-[#d0d7de] pt-6 mt-6">
            <h3 className="text-xs font-semibold text-[#24292f] mb-3 text-center">
              주요 메뉴 바로가기
            </h3>

            {/* Works 메뉴 그리드 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Link
                href="/works/team-feed"
                className="flex items-center gap-2 p-2.5 rounded-md border border-[#d0d7de] hover:bg-[#f6f8fa] hover:border-[#57606a] transition-all group"
              >
                <svg
                  className="w-4 h-4 text-[#57606a] group-hover:text-[#24292f] shrink-0"
                  fill="currentColor"
                  viewBox="0 0 640 512"
                >
                  <path d="M144 0a80 80 0 1 1 0 160A80 80 0 1 1 144 0zM512 0a80 80 0 1 1 0 160A80 80 0 1 1 512 0zM0 298.7C0 239.8 47.8 192 106.7 192l42.7 0c15.9 0 31 3.5 44.6 9.7c-1.3 7.2-1.9 14.7-1.9 22.3c0 38.2 16.8 72.5 43.3 96c-.2 0-.4 0-.7 0L21.3 320C9.6 320 0 310.4 0 298.7zM405.3 320c-.2 0-.4 0-.7 0c26.6-23.5 43.3-57.8 43.3-96c0-7.6-.7-15-1.9-22.3c13.6-6.3 28.7-9.7 44.6-9.7l42.7 0C592.2 192 640 239.8 640 298.7c0 11.8-9.6 21.3-21.3 21.3l-213.3 0zM224 224a96 96 0 1 1 192 0 96 96 0 1 1 -192 0zM128 485.3C128 411.7 187.7 352 261.3 352l117.3 0C452.3 352 512 411.7 512 485.3c0 14.7-11.9 26.7-26.7 26.7l-330.7 0c-14.7 0-26.7-11.9-26.7-26.7z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-[#24292f] group-hover:text-[#0969da]">
                    Team Feed
                  </div>
                  <div className="text-[11px] text-[#57606a]">팀 활동 피드</div>
                </div>
              </Link>

              <Link
                href="/works/plans/gantt"
                className="flex items-center gap-2 p-2.5 rounded-md border border-[#d0d7de] hover:bg-[#f6f8fa] hover:border-[#57606a] transition-all group"
              >
                <svg
                  className="w-4 h-4 text-[#57606a] group-hover:text-[#24292f] shrink-0"
                  fill="currentColor"
                  viewBox="0 0 448 512"
                >
                  <path d="M128 0c17.7 0 32 14.3 32 32l0 32 128 0 0-32c0-17.7 14.3-32 32-32s32 14.3 32 32l0 32 48 0c26.5 0 48 21.5 48 48l0 48L0 160l0-48C0 85.5 21.5 64 48 64l48 0 0-32c0-17.7 14.3-32 32-32zM0 192l448 0 0 272c0 26.5-21.5 48-48 48L48 512c-26.5 0-48-21.5-48-48L0 192zm64 80l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0c-8.8 0-16 7.2-16 16zm128 0l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0c-8.8 0-16 7.2-16 16zm144-16c-8.8 0-16 7.2-16 16l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0zM64 400l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0c-8.8 0-16 7.2-16 16zm144-16c-8.8 0-16 7.2-16 16l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0zm112 16l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0c-8.8 0-16 7.2-16 16z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-[#24292f] group-hover:text-[#0969da]">
                    Plans
                  </div>
                  <div className="text-[11px] text-[#57606a]">계획 간트 차트</div>
                </div>
              </Link>

              <Link
                href="/works/snapshots"
                className="flex items-center gap-2 p-2.5 rounded-md border border-[#d0d7de] hover:bg-[#f6f8fa] hover:border-[#57606a] transition-all group"
              >
                <svg
                  className="w-4 h-4 text-[#57606a] group-hover:text-[#24292f] shrink-0"
                  fill="currentColor"
                  viewBox="0 0 512 512"
                >
                  <path d="M220.6 121.2L271.1 96 448 96l0 96-114.8 0c-21.9-15.1-48.5-24-77.2-24s-55.2 8.9-77.2 24L64 192l0-64 128 0c9.9 0 19.7-2.3 28.6-6.8zM0 128L0 416c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-320c0-35.3-28.7-64-64-64L271.1 32c-9.9 0-19.7 2.3-28.6 6.8L192 64l-32 0 0-16c0-8.8-7.2-16-16-16L80 32c-8.8 0-16 7.2-16 16l0 16-64 0zm256 208a64 64 0 1 0 0-128 64 64 0 1 0 0 128z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-[#24292f] group-hover:text-[#0969da]">
                    Snapshots
                  </div>
                  <div className="text-[11px] text-[#57606a]">스냅샷 뷰어</div>
                </div>
              </Link>

              <Link
                href="/works/work-map"
                className="flex items-center gap-2 p-2.5 rounded-md border border-[#d0d7de] hover:bg-[#f6f8fa] hover:border-[#57606a] transition-all group"
              >
                <svg
                  className="w-4 h-4 text-[#57606a] group-hover:text-[#24292f] shrink-0"
                  fill="currentColor"
                  viewBox="0 0 576 512"
                >
                  <path d="M408 120c0 54.6-73.1 151.9-105.2 192c-7.7 9.6-22 9.6-29.6 0C241.1 271.9 168 174.6 168 120C168 53.7 221.7 0 288 0s120 53.7 120 120zm8 80.4c3.5-6.9 6.7-13.8 9.6-20.6c.5-1.2 1-2.5 1.5-3.7l116-46.4C558.9 123.4 576 135 576 152l0 270.8c0 9.8-6 18.6-15.1 22.3L416 503l0-302.6zM137.6 138.3c2.4 14.1 7.2 28.3 12.8 41.5c2.9 6.8 6.1 13.7 9.6 20.6l0 251.4L32.9 502.7C17.1 509 0 497.4 0 480.4L0 209.6c0-9.8 6-18.6 15.1-22.3l122.6-49zM327.8 332c13.9-17.4 35.7-45.7 56.2-77l0 249.3-192 54.9 0-248.4c20.5 31.3 42.3 59.6 56.2 77c20.5 25.6 59.1 25.6 79.6 0zM288 152a40 40 0 1 0 0-80 40 40 0 1 0 0 80z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-[#24292f] group-hover:text-[#0969da]">
                    Work Map
                  </div>
                  <div className="text-[11px] text-[#57606a]">업무 맵</div>
                </div>
              </Link>
            </div>

            {/* Personal Space 링크 */}
            <div className="mt-3 pt-3 border-t border-[#d0d7de]">
              <div className="flex flex-wrap gap-1.5 justify-center text-[11px]">
                <Link
                  href="/my"
                  className="text-[#0969da] hover:underline"
                >
                  내 대시보드
                </Link>
                <span className="text-[#d0d7de]">•</span>
                <Link
                  href="/manage/snapshots"
                  className="text-[#0969da] hover:underline"
                >
                  스냅샷 관리
                </Link>
                <span className="text-[#d0d7de]">•</span>
                <Link
                  href="/feedbacks"
                  className="text-[#0969da] hover:underline"
                >
                  피드백
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-[#57606a]">
            문제가 지속되면{" "}
            <a
              href="mailto:zrelor@gmail.com"
              className="text-[#0969da] hover:underline"
            >
              문의하기
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

