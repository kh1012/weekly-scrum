import { LogoLoadingSpinner } from "@/components/weekly-scrum/common/LoadingSpinner";

export default function AlignmentLoading() {
  return (
    <div className="flex items-center justify-center h-screen">
      <LogoLoadingSpinner
        title="Alignment를 불러오는 중"
        description="잠시만 기다려주세요"
      />
    </div>
  );
}

