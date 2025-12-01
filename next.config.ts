import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const repoName = "weekly-scrum"; // GitHub 레포지토리 이름으로 변경해주세요

const nextConfig: NextConfig = {
  // Next.js 15에서는 serverExternalPackages가 최상위로 이동
  serverExternalPackages: [],

  // GitHub Pages 배포를 위한 설정
  output: "export",

  // GitHub Pages에서 사용할 기본 경로 (레포지토리 이름)
  basePath: isProd ? `/${repoName}` : "",

  // 정적 에셋 경로
  assetPrefix: isProd ? `/${repoName}/` : "",

  // 이미지 최적화 비활성화 (정적 내보내기에서는 지원하지 않음)
  images: {
    unoptimized: true,
  },

  // trailing slash 추가 (GitHub Pages 호환성)
  trailingSlash: true,
};

export default nextConfig;
