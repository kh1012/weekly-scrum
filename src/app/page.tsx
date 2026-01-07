import { redirect } from "next/navigation";

/**
 * 루트 페이지 - 즉시 기본 페이지로 리다이렉트
 */
export default function Home() {
  redirect("/works/work-map");
}
