-- ============================================
-- Gantt Flags 목업 데이터 (2025-12 ~ 2026-02)
-- ============================================
-- 스프린트, 릴리즈, 배포, 휴가 기간 등
-- ============================================

DO $$
DECLARE
  v_workspace_id UUID := '00000000-0000-0000-0000-000000000002';
  v_admin_user_id UUID := 'baa0e45c-3758-48e7-80bc-d14fca98e562'; -- 김현
BEGIN

-- 기존 gantt_flags 삭제
DELETE FROM gantt_flags WHERE workspace_id = v_workspace_id;

-- ============================================
-- 스프린트 기간
-- ============================================

-- Sprint 1 (W49-W50)
INSERT INTO gantt_flags (workspace_id, title, start_date, end_date, color, order_index, created_by, lane_hint, description)
VALUES (
  v_workspace_id,
  'Sprint 1 - 프로젝트 킥오프',
  '2025-12-02',
  '2025-12-15',
  '#3b82f6', -- 파란색
  1,
  v_admin_user_id,
  1,
  '소셜 로그인 및 대시보드 개발 시작'
);

-- Sprint 2 (W51-W52)
INSERT INTO gantt_flags (workspace_id, title, start_date, end_date, color, order_index, created_by, lane_hint, description)
VALUES (
  v_workspace_id,
  'Sprint 2 - 핵심 기능 개발',
  '2025-12-16',
  '2025-12-29',
  '#3b82f6',
  2,
  v_admin_user_id,
  1,
  '소셜 로그인 완료 및 고객 검색 개발'
);

-- Sprint 3 (W01-W02)
INSERT INTO gantt_flags (workspace_id, title, start_date, end_date, color, order_index, created_by, lane_hint, description)
VALUES (
  v_workspace_id,
  'Sprint 3 - 검색 및 알림',
  '2025-12-30',
  '2026-01-12',
  '#3b82f6',
  3,
  v_admin_user_id,
  1,
  '고객 검색 완성 및 이메일 알림 개발'
);

-- Sprint 4 (W03-W04)
INSERT INTO gantt_flags (workspace_id, title, start_date, end_date, color, order_index, created_by, lane_hint, description)
VALUES (
  v_workspace_id,
  'Sprint 4 - 세그먼트 및 파이프라인',
  '2026-01-13',
  '2026-01-26',
  '#3b82f6',
  4,
  v_admin_user_id,
  1,
  '고객 세그먼트 및 판매 파이프라인 개발'
);

-- Sprint 5 (W05-W06)
INSERT INTO gantt_flags (workspace_id, title, start_date, end_date, color, order_index, created_by, lane_hint, description)
VALUES (
  v_workspace_id,
  'Sprint 5 - 계약 및 모바일',
  '2026-01-27',
  '2026-02-09',
  '#3b82f6',
  5,
  v_admin_user_id,
  1,
  '계약 관리 및 모바일 앱 기획'
);

-- Sprint 6 (W07-W08)
INSERT INTO gantt_flags (workspace_id, title, start_date, end_date, color, order_index, created_by, lane_hint, description)
VALUES (
  v_workspace_id,
  'Sprint 6 - 모바일 및 마무리',
  '2026-02-10',
  '2026-02-23',
  '#3b82f6',
  6,
  v_admin_user_id,
  1,
  '모바일 앱 개발 및 최종 마무리'
);

-- ============================================
-- 릴리즈 날짜 (스프린트 끝)
-- ============================================

-- Release 0.1.0 (Sprint 1 종료)
INSERT INTO gantt_flags (workspace_id, title, start_date, end_date, color, order_index, created_by, lane_hint, description)
VALUES (
  v_workspace_id,
  'Release 0.1.0 - 기본 인프라',
  '2025-12-15',
  '2025-12-15',
  '#10b981', -- 초록색
  10,
  v_admin_user_id,
  2,
  '개발 환경 및 기본 아키텍처 구축 완료'
);

-- Release 0.2.0 (Sprint 2 종료)
INSERT INTO gantt_flags (workspace_id, title, start_date, end_date, color, order_index, created_by, lane_hint, description)
VALUES (
  v_workspace_id,
  'Release 0.2.0 - 소셜 로그인',
  '2025-12-29',
  '2025-12-29',
  '#10b981',
  11,
  v_admin_user_id,
  2,
  '소셜 로그인 및 대시보드 기능 출시'
);

-- Release 0.3.0 (Sprint 3 종료)
INSERT INTO gantt_flags (workspace_id, title, start_date, end_date, color, order_index, created_by, lane_hint, description)
VALUES (
  v_workspace_id,
  'Release 0.3.0 - 검색 및 알림',
  '2026-01-12',
  '2026-01-12',
  '#10b981',
  12,
  v_admin_user_id,
  2,
  '고객 검색 및 이메일 알림 기능 출시'
);

-- Release 0.4.0 (Sprint 4 종료)
INSERT INTO gantt_flags (workspace_id, title, start_date, end_date, color, order_index, created_by, lane_hint, description)
VALUES (
  v_workspace_id,
  'Release 0.4.0 - 세그먼트 & 파이프라인',
  '2026-01-26',
  '2026-01-26',
  '#10b981',
  13,
  v_admin_user_id,
  2,
  '고객 세그먼트 및 판매 파이프라인 출시'
);

-- Release 0.5.0 (Sprint 5 종료)
INSERT INTO gantt_flags (workspace_id, title, start_date, end_date, color, order_index, created_by, lane_hint, description)
VALUES (
  v_workspace_id,
  'Release 0.5.0 - 계약 관리',
  '2026-02-09',
  '2026-02-09',
  '#10b981',
  14,
  v_admin_user_id,
  2,
  '계약 문서 관리 및 전자서명 출시'
);

-- Release 1.0.0 (Sprint 6 종료 - 정식 버전)
INSERT INTO gantt_flags (workspace_id, title, start_date, end_date, color, order_index, created_by, lane_hint, description)
VALUES (
  v_workspace_id,
  'Release 1.0.0 - 정식 출시 🎉',
  '2026-02-23',
  '2026-02-23',
  '#f59e0b', -- 주황색
  15,
  v_admin_user_id,
  2,
  'CRM 시스템 정식 버전 출시!'
);

-- ============================================
-- 배포 기간
-- ============================================

-- 1차 배포 (Sprint 2 종료)
INSERT INTO gantt_flags (workspace_id, title, start_date, end_date, color, order_index, created_by, lane_hint, description)
VALUES (
  v_workspace_id,
  'Deployment - Staging',
  '2025-12-26',
  '2025-12-28',
  '#8b5cf6', -- 보라색
  20,
  v_admin_user_id,
  3,
  'Staging 환경 배포 및 QA'
);

-- 2차 배포 (Sprint 4 종료)
INSERT INTO gantt_flags (workspace_id, title, start_date, end_date, color, order_index, created_by, lane_hint, description)
VALUES (
  v_workspace_id,
  'Deployment - Beta',
  '2026-01-23',
  '2026-01-25',
  '#8b5cf6',
  21,
  v_admin_user_id,
  3,
  'Beta 버전 배포 및 사용자 테스트'
);

-- 최종 배포 (Sprint 6 종료)
INSERT INTO gantt_flags (workspace_id, title, start_date, end_date, color, order_index, created_by, lane_hint, description)
VALUES (
  v_workspace_id,
  'Deployment - Production',
  '2026-02-20',
  '2026-02-23',
  '#ef4444', -- 빨간색
  22,
  v_admin_user_id,
  3,
  'Production 환경 정식 배포'
);

-- ============================================
-- 특별 기간 (휴가, 회고 등)
-- ============================================

-- 연말 휴가
INSERT INTO gantt_flags (workspace_id, title, start_date, end_date, color, order_index, created_by, lane_hint, description)
VALUES (
  v_workspace_id,
  '연말 휴가 🎄',
  '2025-12-25',
  '2025-12-26',
  '#f97316', -- 주황색
  30,
  v_admin_user_id,
  4,
  '크리스마스 연휴'
);

-- 신년 휴가
INSERT INTO gantt_flags (workspace_id, title, start_date, end_date, color, order_index, created_by, lane_hint, description)
VALUES (
  v_workspace_id,
  '신년 휴가 🎆',
  '2026-01-01',
  '2026-01-02',
  '#f97316',
  31,
  v_admin_user_id,
  4,
  '새해 연휴'
);

-- 1차 스프린트 회고
INSERT INTO gantt_flags (workspace_id, title, start_date, end_date, color, order_index, created_by, lane_hint, description)
VALUES (
  v_workspace_id,
  'Sprint Retrospective #1',
  '2026-01-05',
  '2026-01-05',
  '#6366f1', -- 인디고
  40,
  v_admin_user_id,
  4,
  '1차 스프린트 회고 및 2차 스프린트 계획'
);

-- 중간 점검 미팅
INSERT INTO gantt_flags (workspace_id, title, start_date, end_date, color, order_index, created_by, lane_hint, description)
VALUES (
  v_workspace_id,
  'Mid-term Review',
  '2026-01-20',
  '2026-01-20',
  '#6366f1',
  41,
  v_admin_user_id,
  4,
  '프로젝트 중간 점검 및 일정 조정'
);

-- 최종 QA 기간
INSERT INTO gantt_flags (workspace_id, title, start_date, end_date, color, order_index, created_by, lane_hint, description)
VALUES (
  v_workspace_id,
  'Final QA Period',
  '2026-02-17',
  '2026-02-19',
  '#ec4899', -- 핑크색
  42,
  v_admin_user_id,
  4,
  '최종 QA 및 버그 수정'
);

RAISE NOTICE '=== Gantt Flags 생성 완료 ===';
RAISE NOTICE '- 스프린트: 6개';
RAISE NOTICE '- 릴리즈: 6개';
RAISE NOTICE '- 배포: 3개';
RAISE NOTICE '- 특별 기간: 5개';
RAISE NOTICE '총 20개의 플래그 생성';

END $$;

