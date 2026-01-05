import { LogoLoadingSpinner } from "@/components/weekly-scrum/common/LoadingSpinner";

export default function WorksAlignmentLoading() {
  return (
    <div className="h-full flex items-center justify-center">
      <LogoLoadingSpinner
        title="Alignment를 불러오는 중입니다"
        description="잠시만 기다려주세요."
      />
    </div>
  );
}

