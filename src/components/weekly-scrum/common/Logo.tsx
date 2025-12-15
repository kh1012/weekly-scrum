import Image from "next/image";

interface LogoProps {
  /** 로고 크기 (width = height) */
  size?: number;
  /** 추가 클래스명 */
  className?: string;
}

/**
 * Weekly Scrum 공통 로고 컴포넌트
 * - public/assets/logo.svg 사용
 */
export function Logo({ size = 32, className = "" }: LogoProps) {
  return (
    <Image
      src="/assets/logo.svg"
      alt="Weekly Scrum"
      width={size}
      height={size}
      className={className}
      priority
    />
  );
}

