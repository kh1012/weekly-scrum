/**
 * OS 감지 유틸리티
 * 
 * 사용자의 운영체제를 감지하여 반환합니다.
 * SSR 환경에서는 기본값 'other'를 반환합니다.
 */

export type OSType = "mac" | "windows" | "other";

/**
 * 현재 사용자의 OS를 감지합니다.
 * @returns "mac" | "windows" | "other"
 */
export function getOS(): OSType {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return "other";
  }

  // navigator.userAgentData가 있으면 우선 사용 (최신 API)
  const userAgentData = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData;
  if (userAgentData?.platform) {
    const platform = userAgentData.platform.toLowerCase();
    if (platform.includes("mac")) return "mac";
    if (platform.includes("win")) return "windows";
    return "other";
  }

  // Fallback: navigator.platform
  const platform = navigator.platform?.toLowerCase() || "";
  if (platform.includes("mac")) return "mac";
  if (platform.includes("win")) return "windows";

  // Fallback: navigator.userAgent
  const userAgent = navigator.userAgent?.toLowerCase() || "";
  if (userAgent.includes("macintosh") || userAgent.includes("mac os")) return "mac";
  if (userAgent.includes("windows")) return "windows";

  return "other";
}

/**
 * OS가 Mac인지 확인합니다.
 */
export function isMac(): boolean {
  return getOS() === "mac";
}

/**
 * OS가 Windows인지 확인합니다.
 */
export function isWindows(): boolean {
  return getOS() === "windows";
}












