-- ============================================
-- 데모 스냅샷 엔트리 전체 데이터 (W49~W08, 12주)
-- ============================================
-- 2025년 12월 ~ 2026년 2월
-- 6명 × 12주 × 평균 2개 = 약 144개 엔트리
-- ============================================

DO $$
DECLARE
  v_workspace_id UUID := '00000000-0000-0000-0000-000000000002';
  v_planning_user_id UUID := '3db23874-c656-4eaa-9c2d-e50f759e5598'; -- 지민 (PLANNING)
  v_design_user_id UUID := 'f9b49318-5582-40d0-b394-e0291f515728';   -- 하림 (DESIGN)
  v_fe_user_id UUID := '0ceaccdc-dcd5-41e6-8ff1-78b05a60b9c2';       -- 서준 (FE)
  v_be_user_id UUID := '453fcc58-ff44-45b3-9ae9-b427c9df7ca4';       -- 민재 (BE)
  v_qa_user_id UUID := '36df5290-ff00-419b-8cc1-04ca4b1f82f1';       -- 수아 (QA)
  v_admin_user_id UUID := 'baa0e45c-3758-48e7-80bc-d14fca98e562';    -- 김현 (Admin/FE)
  v_snapshot_id UUID;
BEGIN

-- ============================================
-- W49 (2025-12-02) - 프로젝트 킥오프
-- ============================================

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_planning_user_id, 2025, 'W49', '2025-12-02', '2025-12-08', 'light', '프로젝트 킥오프 주간')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_planning_user_id, 'Authentication', 'CRM 시스템 고도화', '인증 모듈', '소셜 로그인 통합', '지민',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '경쟁사 벤치마킹', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', 'OAuth 플로우 설계', 'progress', 70), jsonb_build_object('title', '사용자 동의 화면 와이어프레임', 'progress', 40))),
  jsonb_build_array(jsonb_build_object('note', 'Provider별 정책 차이', 'level', 'medium')), 2,
  jsonb_build_array(jsonb_build_object('name', '하림', 'relation', 'pair')));

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_design_user_id, 2025, 'W49', '2025-12-02', '2025-12-08', 'normal', '디자인 시스템 정리')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_design_user_id, 'Authentication', 'CRM 시스템 고도화', '인증 모듈', '소셜 로그인 통합', '하림',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '사용성 분석', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '버튼 디자인 가이드', 'progress', 60), jsonb_build_object('title', 'Figma 라이브러리 업데이트', 'progress', 30))),
  jsonb_build_array(), 0, jsonb_build_array(jsonb_build_object('name', '지민', 'relation', 'pair')));

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_design_user_id, 'Dashboard', 'CRM 시스템 고도화', '대시보드 모듈', '실시간 매출 대시보드', '하림',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '레퍼런스 수집', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '차트 타입 정의', 'progress', 50))),
  jsonb_build_array(), 0, jsonb_build_array());

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_fe_user_id, 2025, 'W49', '2025-12-02', '2025-12-08', 'light', '환경 설정')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_fe_user_id, 'Infrastructure', 'CRM 시스템 고도화', '개발 환경', '프론트엔드 보일러플레이트', '서준',
  jsonb_build_object('tasks', jsonb_build_array()),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', 'Next.js 15 설정', 'progress', 80), jsonb_build_object('title', 'Tailwind 설정', 'progress', 60), jsonb_build_object('title', 'Supabase 연동', 'progress', 90))),
  jsonb_build_array(), 0, jsonb_build_array(jsonb_build_object('name', '김현', 'relation', 'pair')));

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_be_user_id, 2025, 'W49', '2025-12-02', '2025-12-08', 'normal', 'API 서버 구축')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_be_user_id, 'Infrastructure', 'CRM 시스템 고도화', 'API 서버', 'NestJS 프로젝트', '민재',
  jsonb_build_object('tasks', jsonb_build_array()),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', 'NestJS 구조 설정', 'progress', 100), jsonb_build_object('title', 'Docker Compose', 'progress', 80), jsonb_build_object('title', 'Supabase Auth 연동', 'progress', 70))),
  jsonb_build_array(), 0, jsonb_build_array());

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_be_user_id, 'Database', 'CRM 시스템 고도화', '데이터베이스', 'DB 스키마', '민재',
  jsonb_build_object('tasks', jsonb_build_array()),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '테이블 ERD 작성', 'progress', 90), jsonb_build_object('title', 'Prisma 스키마', 'progress', 60))),
  jsonb_build_array(jsonb_build_object('note', '레거시 DB 마이그레이션', 'level', 'high')), 3,
  jsonb_build_array(jsonb_build_object('name', '지민', 'relation', 'pre')));

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_qa_user_id, 2025, 'W49', '2025-12-02', '2025-12-08', 'light', 'QA 전략 수립')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_qa_user_id, 'QA', 'CRM 시스템 고도화', 'QA 프로세스', '테스트 자동화', '수아',
  jsonb_build_object('tasks', jsonb_build_array()),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', 'E2E 도구 비교', 'progress', 100), jsonb_build_object('title', '테스트 케이스 템플릿', 'progress', 50), jsonb_build_object('title', 'QA 서버 설정', 'progress', 40))),
  jsonb_build_array(), 0, jsonb_build_array());

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_admin_user_id, 2025, 'W49', '2025-12-02', '2025-12-08', 'burden', '아키텍처 설계')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_admin_user_id, 'Infrastructure', 'CRM 시스템 고도화', 'Frontend Architecture', '아키텍처', '김현',
  jsonb_build_object('tasks', jsonb_build_array()),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', 'App Router 폴더 구조', 'progress', 100), jsonb_build_object('title', '공통 컴포넌트 설계', 'progress', 80), jsonb_build_object('title', '상태 관리 전략', 'progress', 70))),
  jsonb_build_array(), 0, jsonb_build_array(jsonb_build_object('name', '서준', 'relation', 'pair')));

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_admin_user_id, 'Dashboard', 'CRM 시스템 고도화', '대시보드 모듈', '실시간 매출 대시보드', '김현',
  jsonb_build_object('tasks', jsonb_build_array()),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', 'Recharts 성능 비교', 'progress', 100), jsonb_build_object('title', 'WebSocket POC', 'progress', 60))),
  jsonb_build_array(jsonb_build_object('note', '대량 데이터 렌더링 성능', 'level', 'medium')), 2,
  jsonb_build_array(jsonb_build_object('name', '민재', 'relation', 'post')));

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_admin_user_id, 'DevOps', 'CRM 시스템 고도화', 'CI/CD', '배포 파이프라인', '김현',
  jsonb_build_object('tasks', jsonb_build_array()),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', 'GitHub Actions', 'progress', 80), jsonb_build_object('title', 'Vercel 연동', 'progress', 90))),
  jsonb_build_array(), 0, jsonb_build_array());

-- ============================================
-- W50 (2025-12-09) - 본격 개발 시작
-- ============================================

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_planning_user_id, 2025, 'W50', '2025-12-09', '2025-12-15', 'normal', '상세 요구사항 작성')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_planning_user_id, 'Authentication', 'CRM 시스템 고도화', '인증 모듈', '소셜 로그인 통합', '지민',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', 'OAuth 플로우 완료', 'progress', 100), jsonb_build_object('title', '동의 화면 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '에러 시나리오', 'progress', 80), jsonb_build_object('title', '보안 체크리스트', 'progress', 100))),
  jsonb_build_array(), 0, jsonb_build_array(jsonb_build_object('name', '하림', 'relation', 'post')));

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_planning_user_id, 'Dashboard', 'CRM 시스템 고도화', '대시보드 모듈', '실시간 매출 대시보드', '지민',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '차트 타입 선정', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', 'KPI 정의 완료', 'progress', 100), jsonb_build_object('title', '실시간 업데이트 요구사항', 'progress', 90), jsonb_build_object('title', '위젯 레이아웃 기획', 'progress', 70))),
  jsonb_build_array(), 0, jsonb_build_array(jsonb_build_object('name', '하림', 'relation', 'post'), jsonb_build_object('name', '김현', 'relation', 'post')));

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_design_user_id, 2025, 'W50', '2025-12-09', '2025-12-15', 'normal', '소셜 로그인 디자인')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_design_user_id, 'Authentication', 'CRM 시스템 고도화', '인증 모듈', '소셜 로그인 통합', '하림',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '버튼 디자인 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '로딩 상태 애니메이션', 'progress', 90), jsonb_build_object('title', '에러 메시지 디자인', 'progress', 70), jsonb_build_object('title', '모바일 반응형', 'progress', 60))),
  jsonb_build_array(), 0, jsonb_build_array(jsonb_build_object('name', '서준', 'relation', 'post')));

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_design_user_id, 'Dashboard', 'CRM 시스템 고도화', '대시보드 모듈', '실시간 매출 대시보드', '하림',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '차트 팔레트 정의', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '위젯 카드 디자인', 'progress', 80), jsonb_build_object('title', '반응형 그리드 레이아웃', 'progress', 60))),
  jsonb_build_array(), 0, jsonb_build_array(jsonb_build_object('name', '김현', 'relation', 'post')));

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_fe_user_id, 2025, 'W50', '2025-12-09', '2025-12-15', 'light', '공통 컴포넌트 개발')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_fe_user_id, 'Infrastructure', 'CRM 시스템 고도화', 'UI Components', '공통 컴포넌트', '서준',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '환경 구축 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', 'Button 컴포넌트', 'progress', 100), jsonb_build_object('title', 'Input 컴포넌트', 'progress', 90), jsonb_build_object('title', 'Modal 컴포넌트', 'progress', 70))),
  jsonb_build_array(), 0, jsonb_build_array(jsonb_build_object('name', '김현', 'relation', 'pair')));

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_be_user_id, 2025, 'W50', '2025-12-09', '2025-12-15', 'normal', 'Auth API 구현')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_be_user_id, 'Authentication', 'CRM 시스템 고도화', '인증 모듈', '소셜 로그인 통합', '민재',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', 'DB 스키마 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', 'Google OAuth 연동', 'progress', 80), jsonb_build_object('title', 'Kakao OAuth 연동', 'progress', 70), jsonb_build_object('title', 'JWT 토큰 발급', 'progress', 90))),
  jsonb_build_array(), 0, jsonb_build_array(jsonb_build_object('name', '서준', 'relation', 'pair')));

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_be_user_id, 'Dashboard', 'CRM 시스템 고도화', '대시보드 모듈', '실시간 매출 대시보드', '민재',
  jsonb_build_object('tasks', jsonb_build_array()),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '매출 집계 쿼리 최적화', 'progress', 60), jsonb_build_object('title', 'Redis 캐싱 설정', 'progress', 50))),
  jsonb_build_array(jsonb_build_object('note', '실시간 집계 부하', 'level', 'medium')), 2, jsonb_build_array());

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_qa_user_id, 2025, 'W50', '2025-12-09', '2025-12-15', 'light', 'Playwright 환경 구축')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_qa_user_id, 'QA', 'CRM 시스템 고도화', 'QA 프로세스', '테스트 자동화', '수아',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', 'QA 전략 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', 'Playwright 설치 및 설정', 'progress', 100), jsonb_build_object('title', '첫 E2E 테스트 작성', 'progress', 70), jsonb_build_object('title', 'CI 연동', 'progress', 40))),
  jsonb_build_array(), 0, jsonb_build_array());

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_admin_user_id, 2025, 'W50', '2025-12-09', '2025-12-15', 'burden', '핵심 기능 리드')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_admin_user_id, 'Authentication', 'CRM 시스템 고도화', '인증 모듈', '소셜 로그인 통합', '김현',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '아키텍처 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', 'OAuth 콜백 처리', 'progress', 80), jsonb_build_object('title', '토큰 관리 로직', 'progress', 70), jsonb_build_object('title', '에러 핸들링', 'progress', 60))),
  jsonb_build_array(), 0, jsonb_build_array(jsonb_build_object('name', '민재', 'relation', 'pair')));

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_admin_user_id, 'Dashboard', 'CRM 시스템 고도화', '대시보드 모듈', '실시간 매출 대시보드', '김현',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', 'WebSocket POC 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', 'Recharts 매출 차트', 'progress', 70), jsonb_build_object('title', '실시간 업데이트 훅', 'progress', 50))),
  jsonb_build_array(), 0, jsonb_build_array(jsonb_build_object('name', '민재', 'relation', 'post')));

-- ============================================
-- W51 (2025-12-16) - 주요 기능 개발 중
-- ============================================

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_planning_user_id, 2025, 'W51', '2025-12-16', '2025-12-22', 'normal', '고객 관리 기획')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_planning_user_id, 'Customer', 'CRM 시스템 고도화', '고객 관리 모듈', '고객 검색 및 필터링', '지민',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '대시보드 기획 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '검색 필터 요구사항', 'progress', 80), jsonb_build_object('title', '저장된 필터 기능', 'progress', 60), jsonb_build_object('title', '빠른 검색 명세', 'progress', 70))),
  jsonb_build_array(), 0, jsonb_build_array(jsonb_build_object('name', '하림', 'relation', 'post')));

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_design_user_id, 2025, 'W51', '2025-12-16', '2025-12-22', 'burden', '다중 기능 디자인')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_design_user_id, 'Authentication', 'CRM 시스템 고도화', '인증 모듈', '소셜 로그인 통합', '하림',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '모든 상태 디자인', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '디자인 QA', 'progress', 100), jsonb_build_object('title', '디자인 시스템 문서화', 'progress', 80))),
  jsonb_build_array(), 0, jsonb_build_array());

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_design_user_id, 'Dashboard', 'CRM 시스템 고도화', '대시보드 모듈', '실시간 매출 대시보드', '하림',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '반응형 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '다크모드 대응', 'progress', 70), jsonb_build_object('title', '위젯 커스터마이징', 'progress', 60))),
  jsonb_build_array(), 0, jsonb_build_array());

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_design_user_id, 'Customer', 'CRM 시스템 고도화', '고객 관리 모듈', '고객 검색 및 필터링', '하림',
  jsonb_build_object('tasks', jsonb_build_array()),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '검색바 디자인', 'progress', 50), jsonb_build_object('title', '필터 패널', 'progress', 40))),
  jsonb_build_array(), 0, jsonb_build_array());

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_fe_user_id, 2025, 'W51', '2025-12-16', '2025-12-22', 'burden', '소셜 로그인 구현')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_fe_user_id, 'Authentication', 'CRM 시스템 고도화', '인증 모듈', '소셜 로그인 통합', '서준',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '공통 컴포넌트 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', 'OAuth 버튼 통합', 'progress', 90), jsonb_build_object('title', '로그인 플로우 테스트', 'progress', 80), jsonb_build_object('title', '에러 처리', 'progress', 85))),
  jsonb_build_array(), 0, jsonb_build_array(jsonb_build_object('name', '민재', 'relation', 'pair')));

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_be_user_id, 2025, 'W51', '2025-12-16', '2025-12-22', 'burden', '다중 API 개발')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_be_user_id, 'Authentication', 'CRM 시스템 고도화', '인증 모듈', '소셜 로그인 통합', '민재',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', 'OAuth 연동 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', 'Naver OAuth 추가', 'progress', 70), jsonb_build_object('title', '프로필 동기화', 'progress', 80), jsonb_build_object('title', 'API 문서화', 'progress', 60))),
  jsonb_build_array(), 0, jsonb_build_array());

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_be_user_id, 'Dashboard', 'CRM 시스템 고도화', '대시보드 모듈', '실시간 매출 대시보드', '민재',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', 'Redis 캐싱 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', 'WebSocket 서버', 'progress', 80), jsonb_build_object('title', '실시간 스트리밍', 'progress', 70))),
  jsonb_build_array(), 0, jsonb_build_array(jsonb_build_object('name', '김현', 'relation', 'post')));

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_qa_user_id, 2025, 'W51', '2025-12-16', '2025-12-22', 'normal', '테스트 케이스 작성')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_qa_user_id, 'Authentication', 'CRM 시스템 고도화', '인증 모듈', '소셜 로그인 통합', '수아',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', 'E2E 환경 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', 'Google 로그인 시나리오', 'progress', 70), jsonb_build_object('title', 'Kakao 로그인 시나리오', 'progress', 60), jsonb_build_object('title', '에러 케이스 테스트', 'progress', 50))),
  jsonb_build_array(), 0, jsonb_build_array());

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_admin_user_id, 2025, 'W51', '2025-12-16', '2025-12-22', 'burden', '대시보드 개발')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_admin_user_id, 'Dashboard', 'CRM 시스템 고도화', '대시보드 모듈', '실시간 매출 대시보드', '김현',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '차트 컴포넌트 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '위젯 레이아웃', 'progress', 85), jsonb_build_object('title', 'WebSocket 연동', 'progress', 90), jsonb_build_object('title', '성능 최적화', 'progress', 70))),
  jsonb_build_array(jsonb_build_object('note', '차트 리렌더링 최적화 필요', 'level', 'medium')), 2,
  jsonb_build_array(jsonb_build_object('name', '민재', 'relation', 'pair')));

-- ============================================
-- W52 (2025-12-23) - 연말, 소셜 로그인 QA
-- ============================================

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_planning_user_id, 2025, 'W52', '2025-12-23', '2025-12-29', 'light', '연말 휴가 전 정리')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_planning_user_id, 'Notification', 'CRM 시스템 고도화', '알림 모듈', '이메일 알림 시스템', '지민',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '고객 검색 기획 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '이메일 템플릿 기획', 'progress', 50), jsonb_build_object('title', '발송 시나리오', 'progress', 40))),
  jsonb_build_array(), 0, jsonb_build_array());

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_design_user_id, 2025, 'W52', '2025-12-23', '2025-12-29', 'normal', '고객 검색 UI 완성')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_design_user_id, 'Customer', 'CRM 시스템 고도화', '고객 관리 모듈', '고객 검색 및 필터링', '하림',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '검색바 디자인 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '필터 패널 완성', 'progress', 90), jsonb_build_object('title', '저장된 검색 UI', 'progress', 80))),
  jsonb_build_array(), 0, jsonb_build_array(jsonb_build_object('name', '서준', 'relation', 'post')));

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_fe_user_id, 2025, 'W52', '2025-12-23', '2025-12-29', 'normal', '고객 검색 개발')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_fe_user_id, 'Customer', 'CRM 시스템 고도화', '고객 관리 모듈', '고객 검색 및 필터링', '서준',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '소셜 로그인 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '검색바 컴포넌트', 'progress', 80), jsonb_build_object('title', '필터 로직', 'progress', 70), jsonb_build_object('title', 'URL 쿼리 연동', 'progress', 60))),
  jsonb_build_array(), 0, jsonb_build_array(jsonb_build_object('name', '민재', 'relation', 'pair')));

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_be_user_id, 2025, 'W52', '2025-12-23', '2025-12-29', 'normal', '검색 API 개발')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_be_user_id, 'Customer', 'CRM 시스템 고도화', '고객 관리 모듈', '고객 검색 및 필터링', '민재',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '대시보드 API 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', 'Elasticsearch 연동', 'progress', 70), jsonb_build_object('title', '필터 쿼리 빌더', 'progress', 80), jsonb_build_object('title', '검색 인덱싱', 'progress', 60))),
  jsonb_build_array(jsonb_build_object('note', 'Elasticsearch 성능 튜닝', 'level', 'medium')), 2,
  jsonb_build_array(jsonb_build_object('name', '서준', 'relation', 'pair')));

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_qa_user_id, 2025, 'W52', '2025-12-23', '2025-12-29', 'normal', '소셜 로그인 QA')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_qa_user_id, 'Authentication', 'CRM 시스템 고도화', '인증 모듈', '소셜 로그인 통합', '수아',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '로그인 시나리오 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '전체 시나리오 검증', 'progress', 100), jsonb_build_object('title', '버그 리포트 작성', 'progress', 90), jsonb_build_object('title', '회귀 테스트', 'progress', 85))),
  jsonb_build_array(), 0, jsonb_build_array());

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_admin_user_id, 2025, 'W52', '2025-12-23', '2025-12-29', 'burden', '대시보드 완성')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_admin_user_id, 'Dashboard', 'CRM 시스템 고도화', '대시보드 모듈', '실시간 매출 대시보드', '김현',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '성능 최적화 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', 'E2E 테스트', 'progress', 90), jsonb_build_object('title', '에러 핸들링', 'progress', 95), jsonb_build_object('title', '코드 리뷰', 'progress', 100))),
  jsonb_build_array(), 0, jsonb_build_array(jsonb_build_object('name', '민재', 'relation', 'post')));

-- ============================================
-- W01 (2025-12-30 ~ 2026-01-05) - 신년 연휴
-- ============================================

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_planning_user_id, 2026, 'W01', '2025-12-30', '2026-01-05', 'light', '신년 휴가')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_planning_user_id, 'Notification', 'CRM 시스템 고도화', '알림 모듈', '이메일 알림 시스템', '지민',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '이메일 템플릿 기획', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '발송 조건 정의', 'progress', 70))),
  jsonb_build_array(), 0, jsonb_build_array());

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_admin_user_id, 2026, 'W01', '2025-12-30', '2026-01-05', 'light', '휴가 및 코드 리뷰')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_admin_user_id, 'Infrastructure', 'CRM 시스템 고도화', 'Code Quality', '코드 리뷰', '김현',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '대시보드 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '1차 스프린트 회고', 'progress', 100), jsonb_build_object('title', '2차 스프린트 계획', 'progress', 80))),
  jsonb_build_array(), 0, jsonb_build_array());

-- ============================================
-- W02 (2026-01-06) - 본격 재개
-- ============================================

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_planning_user_id, 2026, 'W02', '2026-01-06', '2026-01-12', 'normal', '고객 세그먼트 기획')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_planning_user_id, 'Customer', 'CRM 시스템 고도화', '고객 관리 모듈', '고객 세그먼트 관리', '지민',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '알림 기획 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '세그먼트 조건 정의', 'progress', 80), jsonb_build_object('title', '자동 태깅 규칙', 'progress', 60))),
  jsonb_build_array(), 0, jsonb_build_array(jsonb_build_object('name', '하림', 'relation', 'post')));

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_design_user_id, 2026, 'W02', '2026-01-06', '2026-01-12', 'normal', '이메일 템플릿 디자인')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_design_user_id, 'Notification', 'CRM 시스템 고도화', '알림 모듈', '이메일 알림 시스템', '하림',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '검색 UI 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '이메일 레이아웃', 'progress', 70), jsonb_build_object('title', '다크모드 템플릿', 'progress', 50))),
  jsonb_build_array(), 0, jsonb_build_array());

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_fe_user_id, 2026, 'W02', '2026-01-06', '2026-01-12', 'normal', '고객 검색 완성')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_fe_user_id, 'Customer', 'CRM 시스템 고도화', '고객 관리 모듈', '고객 검색 및 필터링', '서준',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '검색바 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '저장된 검색 구현', 'progress', 90), jsonb_build_object('title', '검색 히스토리', 'progress', 85), jsonb_build_object('title', '테스트 코드', 'progress', 80))),
  jsonb_build_array(), 0, jsonb_build_array());

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_be_user_id, 2026, 'W02', '2026-01-06', '2026-01-12', 'burden', '이메일 서비스 개발')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_be_user_id, 'Customer', 'CRM 시스템 고도화', '고객 관리 모듈', '고객 검색 및 필터링', '민재',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '검색 인덱싱 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '저장된 검색 API', 'progress', 95), jsonb_build_object('title', '검색 분석', 'progress', 80))),
  jsonb_build_array(), 0, jsonb_build_array());

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_be_user_id, 'Notification', 'CRM 시스템 고도화', '알림 모듈', '이메일 알림 시스템', '민재',
  jsonb_build_object('tasks', jsonb_build_array()),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', 'SendGrid 연동', 'progress', 60), jsonb_build_object('title', '이메일 큐 시스템', 'progress', 50))),
  jsonb_build_array(jsonb_build_object('note', '대량 발송 안정성', 'level', 'high')), 3,
  jsonb_build_array());

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_qa_user_id, 2026, 'W02', '2026-01-06', '2026-01-12', 'normal', '검색 QA')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_qa_user_id, 'Customer', 'CRM 시스템 고도화', '고객 관리 모듈', '고객 검색 및 필터링', '수아',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '소셜 로그인 QA 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '검색 시나리오', 'progress', 70), jsonb_build_object('title', '필터 조합 테스트', 'progress', 60))),
  jsonb_build_array(), 0, jsonb_build_array());

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_admin_user_id, 2026, 'W02', '2026-01-06', '2026-01-12', 'burden', '이메일 에디터 개발')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_admin_user_id, 'Notification', 'CRM 시스템 고도화', '알림 모듈', '이메일 알림 시스템', '김현',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '스프린트 계획 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', 'WYSIWYG 에디터 통합', 'progress', 80), jsonb_build_object('title', '변수 삽입 기능', 'progress', 70), jsonb_build_object('title', '미리보기', 'progress', 75))),
  jsonb_build_array(), 0, jsonb_build_array(jsonb_build_object('name', '민재', 'relation', 'pair')));

RAISE NOTICE '=== W49~W02 스냅샷 엔트리 생성 완료 ===';
RAISE NOTICE 'W03~W08은 추가 스크립트에서 생성';

END $$;
