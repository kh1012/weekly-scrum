import { LogoLoadingSpinner } from "@/components/weekly-scrum/common/LoadingSpinner";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LogoLoadingSpinner />
    </div>
  );
}

