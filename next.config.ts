import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 15에서는 serverExternalPackages가 최상위로 이동
  serverExternalPackages: [],

  // Supabase 연동을 위해 정적 export 비활성화
  // 서버 사이드 렌더링 및 Route Handler 사용
  // output: "export", // GitHub Pages용 - Vercel/자체 서버 배포 시 비활성화

  // 이미지 최적화
  images: {
    unoptimized: false,
  },
};

export default nextConfig;
