import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f6f8fa]">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-[#1f2328] mb-3">
          Weekly Scrum Dashboard
        </h1>
        <p className="text-[#656d76] mb-6">
          팀 위클리 스크럼 현황을 한눈에 확인하세요
        </p>
        <Link
          href="/weekly-scrum"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#1f883d] text-white text-sm font-medium rounded-md hover:bg-[#1a7f37] transition-colors shadow-sm"
        >
          대시보드 바로가기
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </Link>
      </div>
    </main>
  );
}
