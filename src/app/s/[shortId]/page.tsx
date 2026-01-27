/**
 * Short Link 리다이렉트 페이지
 * 
 * /s/[shortId] 경로로 접근 시 원본 URL로 리다이렉트
 */

import { redirect } from "next/navigation";
import { getShortLink } from "@/lib/utils/shortLink";

interface ShortLinkPageProps {
  params: Promise<{ shortId: string }>;
}

export default async function ShortLinkPage({ params }: ShortLinkPageProps) {
  const { shortId } = await params;

  const result = await getShortLink(shortId);

  if (!result.success) {
    // 에러 페이지로 리다이렉트 또는 404
    redirect("/?error=invalid_link");
  }

  // 원본 URL로 리다이렉트 (쿼리 스트링 포함)
  const redirectUrl = result.originalUrl + (result.queryString ? `?${result.queryString}` : "");
  redirect(redirectUrl);
}
