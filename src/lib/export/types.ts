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

export type ExportQuality = 'low' | 'normal' | 'high';

export interface CanvasColumnConfig {
  /** 담당자 컬럼 표시 여부 */
  showAssignees?: boolean;
  /** 상태 컬럼 표시 여부 */
  showStatus?: boolean;
  /** 진행률 컬럼 표시 여부 */
  showProgress?: boolean;
}

export interface CanvasOptions {
  /** 테이블 컬럼 표시 여부 */
  showTableColumns?: boolean;
  /** 상단 메타데이터 섹션 표시 여부 */
  showMetadata?: boolean;
  /** 하단 범례 표시 여부 */
  showLegend?: boolean;
  /** 하단 통계 표시 여부 */
  showStatistics?: boolean;
  /** 진행률 gradient 표시 여부 */
  showProgressGradient?: boolean;
  /** 막대에 날짜 레이블 표시 여부 */
  showDateLabels?: boolean;
  /** Alignment 연결 화살표 표시 여부 (Alignment 전용) */
  showAlignmentArrows?: boolean;
  /** 컬럼 설정 */
  columnConfig?: CanvasColumnConfig;
}

export interface ExportOptions {
  /** 파일명 (확장자 제외) */
  filename?: string;
  /** Export 품질 (default: normal) */
  quality?: ExportQuality;
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
  /** Canvas Draw 옵션 */
  canvasOptions?: CanvasOptions;
}

export interface ExportProgress {
  /** 현재 단계 */
  step: string;
  /** 진행률 (0-100) */
  progress: number;
  /** 완료 여부 */
  completed: boolean;
}

/**
 * Canvas Export용 통계 정보
 */
export interface CanvasStatistics {
  /** 전체 항목 수 */
  totalCount: number;
  /** 상태별 분포 */
  byStatus: {
    진행중: number;
    완료: number;
    보류: number;
    취소: number;
  };
  /** Stage별 분포 (선택적) */
  byStage?: Record<string, number>;
}

/**
 * Canvas Export용 연결 화살표 정보 (Alignment)
 */
export interface CanvasArrow {
  /** 시작 bar ID */
  fromBarId: string;
  /** 끝 bar ID */
  toBarId: string;
  /** 화살표 색상 (Alignment 상태별) */
  color: string;
  /** Alignment 상태 */
  status: "green" | "orange" | "red";
}

