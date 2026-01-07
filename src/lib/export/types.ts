/**
 * Export 관련 공통 타입 정의
 */

export interface ExportMetadata {
  /** Export 생성 시각 (ISO 8601) */
  exportDate: string;
  /** Export한 사용자 */
  exportedBy?: string;
  /** Export 타입 */
  exportType: "json" | "png" | "svg";
  /** 페이지 정보 */
  pageInfo: {
    title: string;
    url: string;
  };
  /** 필터 상태 */
  filters?: {
    stages?: string[];
    assignees?: string[];
    viewMode?: "detailed" | "summarized";
  };
  /** 기간 정보 */
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface JSONExportData {
  metadata: ExportMetadata;
  data: unknown; // 실제 데이터는 페이지마다 다름
}

export interface ExportOptions {
  /** 파일명 (확장자 제외) */
  filename?: string;
  /** PNG 옵션 */
  pngOptions?: {
    /** 이미지 품질 (0-1, default: 1) */
    quality?: number;
    /** 배경색 (default: white) */
    backgroundColor?: string;
    /** 스케일 (default: 2 for Retina) */
    scale?: number;
  };
  /** SVG 옵션 */
  svgOptions?: {
    /** 폰트 임베드 여부 */
    embedFonts?: boolean;
    /** 스타일 인라인 여부 */
    inlineStyles?: boolean;
  };
}

export interface ExportProgress {
  /** 현재 단계 */
  step: string;
  /** 진행률 (0-100) */
  progress: number;
  /** 완료 여부 */
  completed: boolean;
}

