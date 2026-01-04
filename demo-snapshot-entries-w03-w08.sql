-- ============================================
-- 데모 스냅샷 엔트리 추가 데이터 (W03~W08)
-- ============================================
-- demo-snapshot-entries2.sql 실행 후 이 파일을 실행하세요
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
-- W03 (2026-01-13) - 판매 파이프라인 시작
-- ============================================

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_planning_user_id, 2026, 'W03', '2026-01-13', '2026-01-19', 'burden', '다중 기능 기획')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_planning_user_id, 'Customer', 'CRM 시스템 고도화', '고객 관리 모듈', '고객 세그먼트 관리', '지민',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '세그먼트 조건 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', 'UI 플로우 정리', 'progress', 100), jsonb_build_object('title', '자동화 규칙 문서', 'progress', 90))),
  jsonb_build_array(), 0, jsonb_build_array());

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_planning_user_id, 'Sales', 'CRM 시스템 고도화', '영업 모듈', '판매 파이프라인 관리', '지민',
  jsonb_build_object('tasks', jsonb_build_array()),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '영업 단계 정의', 'progress', 70), jsonb_build_object('title', '전환율 추적', 'progress', 60))),
  jsonb_build_array(), 0, jsonb_build_array(jsonb_build_object('name', '하림', 'relation', 'post')));

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_design_user_id, 2026, 'W03', '2026-01-13', '2026-01-19', 'burden', '세그먼트 UI 디자인')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_design_user_id, 'Customer', 'CRM 시스템 고도화', '고객 관리 모듈', '고객 세그먼트 관리', '하림',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '이메일 템플릿 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '조건 빌더 UI', 'progress', 80), jsonb_build_object('title', '세그먼트 카드', 'progress', 70), jsonb_build_object('title', '태그 시스템', 'progress', 75))),
  jsonb_build_array(), 0, jsonb_build_array(jsonb_build_object('name', '서준', 'relation', 'post')));

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_design_user_id, 'Sales', 'CRM 시스템 고도화', '영업 모듈', '판매 파이프라인 관리', '하림',
  jsonb_build_object('tasks', jsonb_build_array()),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', 'Kanban 보드 디자인', 'progress', 50), jsonb_build_object('title', '딜 카드', 'progress', 40))),
  jsonb_build_array(), 0, jsonb_build_array());

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_fe_user_id, 2026, 'W03', '2026-01-13', '2026-01-19', 'normal', '이메일 에디터')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_fe_user_id, 'Notification', 'CRM 시스템 고도화', '알림 모듈', '이메일 알림 시스템', '서준',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '검색 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '에디터 통합', 'progress', 85), jsonb_build_object('title', '변수 UI', 'progress', 80), jsonb_build_object('title', '템플릿 관리', 'progress', 70))),
  jsonb_build_array(), 0, jsonb_build_array(jsonb_build_object('name', '김현', 'relation', 'pair')));

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_be_user_id, 2026, 'W03', '2026-01-13', '2026-01-19', 'burden', '다중 API 구현')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_be_user_id, 'Notification', 'CRM 시스템 고도화', '알림 모듈', '이메일 알림 시스템', '민재',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '이메일 큐 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '발송 로그', 'progress', 90), jsonb_build_object('title', '재시도 로직', 'progress', 95), jsonb_build_object('title', '템플릿 API', 'progress', 85))),
  jsonb_build_array(), 0, jsonb_build_array());

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_be_user_id, 'Customer', 'CRM 시스템 고도화', '고객 관리 모듈', '고객 세그먼트 관리', '민재',
  jsonb_build_object('tasks', jsonb_build_array()),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '조건 파서', 'progress', 70), jsonb_build_object('title', '자동 태깅 로직', 'progress', 60))),
  jsonb_build_array(), 0, jsonb_build_array());

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_qa_user_id, 2026, 'W03', '2026-01-13', '2026-01-19', 'normal', '이메일 테스트')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_qa_user_id, 'Notification', 'CRM 시스템 고도화', '알림 모듈', '이메일 알림 시스템', '수아',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '검색 QA 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '템플릿 렌더링 테스트', 'progress', 70), jsonb_build_object('title', '발송 시나리오', 'progress', 60), jsonb_build_object('title', '에러 처리 검증', 'progress', 65))),
  jsonb_build_array(), 0, jsonb_build_array());

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_admin_user_id, 2026, 'W03', '2026-01-13', '2026-01-19', 'burden', '세그먼트 개발')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_admin_user_id, 'Customer', 'CRM 시스템 고도화', '고객 관리 모듈', '고객 세그먼트 관리', '김현',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '템플릿 에디터 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '드래그 앤 드롭 빌더', 'progress', 80), jsonb_build_object('title', '조건 검증', 'progress', 85), jsonb_build_object('title', '미리보기', 'progress', 75))),
  jsonb_build_array(jsonb_build_object('note', '복잡한 조건 처리', 'level', 'medium')), 2,
  jsonb_build_array(jsonb_build_object('name', '민재', 'relation', 'pair')));

-- ============================================
-- W04 (2026-01-20) - 판매 파이프라인 개발
-- ============================================

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_planning_user_id, 2026, 'W04', '2026-01-20', '2026-01-26', 'normal', '파이프라인 기획 완료')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_planning_user_id, 'Sales', 'CRM 시스템 고도화', '영업 모듈', '판매 파이프라인 관리', '지민',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '영업 단계 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '자동화 규칙', 'progress', 80), jsonb_build_object('title', '알림 트리거', 'progress', 75), jsonb_build_object('title', '리포팅 요구사항', 'progress', 70))),
  jsonb_build_array(), 0, jsonb_build_array(jsonb_build_object('name', '하림', 'relation', 'post')));

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_design_user_id, 2026, 'W04', '2026-01-20', '2026-01-26', 'burden', '파이프라인 UI 완성')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_design_user_id, 'Sales', 'CRM 시스템 고도화', '영업 모듈', '판매 파이프라인 관리', '하림',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', 'Kanban 보드 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '딜 상세 페이지', 'progress', 85), jsonb_build_object('title', '드래그 애니메이션', 'progress', 80), jsonb_build_object('title', '필터/정렬 UI', 'progress', 75))),
  jsonb_build_array(), 0, jsonb_build_array(jsonb_build_object('name', '서준', 'relation', 'post')));

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_fe_user_id, 2026, 'W04', '2026-01-20', '2026-01-26', 'burden', '세그먼트 UI 개발')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_fe_user_id, 'Customer', 'CRM 시스템 고도화', '고객 관리 모듈', '고객 세그먼트 관리', '서준',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '이메일 에디터 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '조건 빌더 컴포넌트', 'progress', 85), jsonb_build_object('title', '세그먼트 리스트', 'progress', 80), jsonb_build_object('title', '태그 관리', 'progress', 90))),
  jsonb_build_array(), 0, jsonb_build_array(jsonb_build_object('name', '김현', 'relation', 'post')));

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_be_user_id, 2026, 'W04', '2026-01-20', '2026-01-26', 'burden', '판매 파이프라인 API')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_be_user_id, 'Customer', 'CRM 시스템 고도화', '고객 관리 모듈', '고객 세그먼트 관리', '민재',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '조건 파서 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '실시간 계산', 'progress', 90), jsonb_build_object('title', '세그먼트 캐싱', 'progress', 85))),
  jsonb_build_array(), 0, jsonb_build_array());

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_be_user_id, 'Sales', 'CRM 시스템 고도화', '영업 모듈', '판매 파이프라인 관리', '민재',
  jsonb_build_object('tasks', jsonb_build_array()),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '딜 CRUD API', 'progress', 80), jsonb_build_object('title', '단계 전환 로직', 'progress', 75), jsonb_build_object('title', '활동 로그', 'progress', 70))),
  jsonb_build_array(), 0, jsonb_build_array());

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_qa_user_id, 2026, 'W04', '2026-01-20', '2026-01-26', 'normal', '세그먼트 QA')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_qa_user_id, 'Customer', 'CRM 시스템 고도화', '고객 관리 모듈', '고객 세그먼트 관리', '수아',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '이메일 QA 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '조건 빌더 테스트', 'progress', 75), jsonb_build_object('title', '태그 시나리오', 'progress', 70), jsonb_build_object('title', '성능 테스트', 'progress', 60))),
  jsonb_build_array(), 0, jsonb_build_array());

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_admin_user_id, 2026, 'W04', '2026-01-20', '2026-01-26', 'burden', '파이프라인 Kanban 개발')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_admin_user_id, 'Sales', 'CRM 시스템 고도화', '영업 모듈', '판매 파이프라인 관리', '김현',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '세그먼트 빌더 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', 'DnD 라이브러리 통합', 'progress', 90), jsonb_build_object('title', '딜 카드 컴포넌트', 'progress', 85), jsonb_build_object('title', '낙관적 업데이트', 'progress', 80))),
  jsonb_build_array(), 0, jsonb_build_array(jsonb_build_object('name', '민재', 'relation', 'pair')));

-- ============================================
-- W05 (2026-01-27) - 계약 관리 시작
-- ============================================

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_planning_user_id, 2026, 'W05', '2026-01-27', '2026-02-02', 'normal', '계약 관리 기획')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_planning_user_id, 'Contract', 'CRM 시스템 고도화', '계약 모듈', '계약 문서 관리', '지민',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '파이프라인 기획 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '계약 생명주기', 'progress', 80), jsonb_build_object('title', '전자서명 요구사항', 'progress', 70), jsonb_build_object('title', '문서 템플릿', 'progress', 75))),
  jsonb_build_array(), 0, jsonb_build_array(jsonb_build_object('name', '하림', 'relation', 'post')));

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_design_user_id, 2026, 'W05', '2026-01-27', '2026-02-02', 'normal', '계약 UI 디자인')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_design_user_id, 'Contract', 'CRM 시스템 고도화', '계약 모듈', '계약 문서 관리', '하림',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '파이프라인 UI 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '계약 리스트 디자인', 'progress', 70), jsonb_build_object('title', 'PDF 뷰어 UI', 'progress', 60), jsonb_build_object('title', '서명 플로우', 'progress', 65))),
  jsonb_build_array(), 0, jsonb_build_array());

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_fe_user_id, 2026, 'W05', '2026-01-27', '2026-02-02', 'burden', '파이프라인 완성')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_fe_user_id, 'Sales', 'CRM 시스템 고도화', '영업 모듈', '판매 파이프라인 관리', '서준',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '세그먼트 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '필터/정렬 구현', 'progress', 90), jsonb_build_object('title', '딜 상세 페이지', 'progress', 85), jsonb_build_object('title', '알림 통합', 'progress', 80))),
  jsonb_build_array(), 0, jsonb_build_array());

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_be_user_id, 2026, 'W05', '2026-01-27', '2026-02-02', 'burden', '계약 API 개발')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_be_user_id, 'Sales', 'CRM 시스템 고도화', '영업 모듈', '판매 파이프라인 관리', '민재',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '파이프라인 API 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '통계 API', 'progress', 90), jsonb_build_object('title', '전환율 분석', 'progress', 85))),
  jsonb_build_array(), 0, jsonb_build_array());

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_be_user_id, 'Contract', 'CRM 시스템 고도화', '계약 모듈', '계약 문서 관리', '민재',
  jsonb_build_object('tasks', jsonb_build_array()),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '계약 CRUD', 'progress', 70), jsonb_build_object('title', 'S3 파일 업로드', 'progress', 80), jsonb_build_object('title', '버전 관리', 'progress', 60))),
  jsonb_build_array(jsonb_build_object('note', '대용량 파일 처리', 'level', 'medium')), 2,
  jsonb_build_array());

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_qa_user_id, 2026, 'W05', '2026-01-27', '2026-02-02', 'normal', '파이프라인 QA')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_qa_user_id, 'Sales', 'CRM 시스템 고도화', '영업 모듈', '판매 파이프라인 관리', '수아',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '세그먼트 QA 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', 'DnD 시나리오', 'progress', 80), jsonb_build_object('title', '딜 전환 테스트', 'progress', 75), jsonb_build_object('title', '알림 검증', 'progress', 70))),
  jsonb_build_array(), 0, jsonb_build_array());

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_admin_user_id, 2026, 'W05', '2026-01-27', '2026-02-02', 'burden', '파이프라인 최적화')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_admin_user_id, 'Sales', 'CRM 시스템 고도화', '영업 모듈', '판매 파이프라인 관리', '김현',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', 'Kanban 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '가상 스크롤', 'progress', 85), jsonb_build_object('title', '데이터 페이지네이션', 'progress', 90), jsonb_build_object('title', '캐싱 전략', 'progress', 80))),
  jsonb_build_array(), 0, jsonb_build_array());

-- ============================================
-- W06 (2026-02-03) - 모바일 앱 기획
-- ============================================

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_planning_user_id, 2026, 'W06', '2026-02-03', '2026-02-09', 'burden', '모바일 앱 기획')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_planning_user_id, 'Contract', 'CRM 시스템 고도화', '계약 모듈', '계약 문서 관리', '지민',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '계약 생명주기 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '워크플로우 정리', 'progress', 90), jsonb_build_object('title', '승인 프로세스', 'progress', 85))),
  jsonb_build_array(), 0, jsonb_build_array());

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_planning_user_id, 'Mobile', 'CRM 시스템 고도화', '모바일 앱', '모바일 앱 연동', '지민',
  jsonb_build_object('tasks', jsonb_build_array()),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '핵심 기능 선정', 'progress', 70), jsonb_build_object('title', '네이티브 vs 웹뷰', 'progress', 80), jsonb_build_object('title', '푸시 알림 설계', 'progress', 60))),
  jsonb_build_array(), 0, jsonb_build_array(jsonb_build_object('name', '하림', 'relation', 'post')));

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_design_user_id, 2026, 'W06', '2026-02-03', '2026-02-09', 'burden', '모바일 디자인 시스템')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_design_user_id, 'Contract', 'CRM 시스템 고도화', '계약 모듈', '계약 문서 관리', '하림',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '계약 리스트 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '전자서명 UI', 'progress', 90), jsonb_build_object('title', '템플릿 에디터', 'progress', 80))),
  jsonb_build_array(), 0, jsonb_build_array());

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_design_user_id, 'Mobile', 'CRM 시스템 고도화', '모바일 앱', '모바일 앱 연동', '하림',
  jsonb_build_object('tasks', jsonb_build_array()),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '모바일 컴포넌트 시스템', 'progress', 60), jsonb_build_object('title', '네비게이션 패턴', 'progress', 70), jsonb_build_object('title', '아이콘 세트', 'progress', 80))),
  jsonb_build_array(), 0, jsonb_build_array());

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_fe_user_id, 2026, 'W06', '2026-02-03', '2026-02-09', 'normal', '계약 UI 개발')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_fe_user_id, 'Contract', 'CRM 시스템 고도화', '계약 모듈', '계약 문서 관리', '서준',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', 'Kanban 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', 'PDF 뷰어 통합', 'progress', 80), jsonb_build_object('title', '계약 리스트', 'progress', 85), jsonb_build_object('title', '파일 업로드', 'progress', 90))),
  jsonb_build_array(), 0, jsonb_build_array());

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_be_user_id, 2026, 'W06', '2026-02-03', '2026-02-09', 'burden', '계약 및 모바일 API')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_be_user_id, 'Contract', 'CRM 시스템 고도화', '계약 모듈', '계약 문서 관리', '민재',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', 'S3 업로드 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '전자서명 API', 'progress', 85), jsonb_build_object('title', 'PDF 생성', 'progress', 90), jsonb_build_object('title', '감사 로그', 'progress', 80))),
  jsonb_build_array(), 0, jsonb_build_array());

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_be_user_id, 'Mobile', 'CRM 시스템 고도화', '모바일 앱', '모바일 앱 연동', '민재',
  jsonb_build_object('tasks', jsonb_build_array()),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '모바일 전용 엔드포인트', 'progress', 60), jsonb_build_object('title', 'FCM 푸시', 'progress', 50))),
  jsonb_build_array(jsonb_build_object('note', '모바일 최적화', 'level', 'medium')), 2,
  jsonb_build_array());

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_qa_user_id, 2026, 'W06', '2026-02-03', '2026-02-09', 'normal', '계약 QA')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_qa_user_id, 'Contract', 'CRM 시스템 고도화', '계약 모듈', '계약 문서 관리', '수아',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '파이프라인 QA 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '계약 생명주기 테스트', 'progress', 70), jsonb_build_object('title', '파일 업로드 검증', 'progress', 75), jsonb_build_object('title', '전자서명 시나리오', 'progress', 60))),
  jsonb_build_array(), 0, jsonb_build_array());

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_admin_user_id, 2026, 'W06', '2026-02-03', '2026-02-09', 'burden', '전자서명 통합')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_admin_user_id, 'Contract', 'CRM 시스템 고도화', '계약 모듈', '계약 문서 관리', '김현',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '파이프라인 최적화 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', 'DocuSign 통합', 'progress', 80), jsonb_build_object('title', '서명 플로우', 'progress', 85), jsonb_build_object('title', '상태 추적', 'progress', 90))),
  jsonb_build_array(), 0, jsonb_build_array(jsonb_build_object('name', '민재', 'relation', 'pair')));

-- ============================================
-- W07 (2026-02-10) - 모바일 앱 개발
-- ============================================

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_planning_user_id, 2026, 'W07', '2026-02-10', '2026-02-16', 'normal', '리포트 자동화 기획')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_planning_user_id, 'Analytics', 'CRM 시스템 고도화', '분석 모듈', '리포트 자동화', '지민',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '모바일 기획 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '리포트 템플릿 정의', 'progress', 70), jsonb_build_object('title', '발송 스케줄', 'progress', 80), jsonb_build_object('title', '구독 관리', 'progress', 60))),
  jsonb_build_array(), 0, jsonb_build_array(jsonb_build_object('name', '하림', 'relation', 'post')));

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_design_user_id, 2026, 'W07', '2026-02-10', '2026-02-16', 'burden', '모바일 화면 디자인')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_design_user_id, 'Mobile', 'CRM 시스템 고도화', '모바일 앱', '모바일 앱 연동', '하림',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '모바일 디자인 시스템 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '대시보드 화면', 'progress', 85), jsonb_build_object('title', '고객 상세', 'progress', 80), jsonb_build_object('title', '딜 관리 화면', 'progress', 75), jsonb_build_object('title', '알림 센터', 'progress', 70))),
  jsonb_build_array(), 0, jsonb_build_array(jsonb_build_object('name', '서준', 'relation', 'post')));

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_fe_user_id, 2026, 'W07', '2026-02-10', '2026-02-16', 'burden', '계약 완성 및 모바일')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_fe_user_id, 'Contract', 'CRM 시스템 고도화', '계약 모듈', '계약 문서 관리', '서준',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', 'PDF 뷰어 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '전자서명 UI', 'progress', 95), jsonb_build_object('title', '템플릿 관리', 'progress', 90))),
  jsonb_build_array(), 0, jsonb_build_array());

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_fe_user_id, 'Mobile', 'CRM 시스템 고도화', '모바일 앱', '모바일 앱 연동', '서준',
  jsonb_build_object('tasks', jsonb_build_array()),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', 'RN 프로젝트 설정', 'progress', 80), jsonb_build_object('title', '네비게이션', 'progress', 70), jsonb_build_object('title', '공통 컴포넌트', 'progress', 65))),
  jsonb_build_array(), 0, jsonb_build_array(jsonb_build_object('name', '김현', 'relation', 'pair')));

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_be_user_id, 2026, 'W07', '2026-02-10', '2026-02-16', 'burden', '모바일 API 완성')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_be_user_id, 'Mobile', 'CRM 시스템 고도화', '모바일 앱', '모바일 앱 연동', '민재',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '모바일 엔드포인트 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', 'FCM 푸시 완료', 'progress', 95), jsonb_build_object('title', '오프라인 동기화', 'progress', 85), jsonb_build_object('title', 'API 문서', 'progress', 90))),
  jsonb_build_array(), 0, jsonb_build_array(jsonb_build_object('name', '서준', 'relation', 'pair')));

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_qa_user_id, 2026, 'W07', '2026-02-10', '2026-02-16', 'normal', '계약 QA 완료')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_qa_user_id, 'Contract', 'CRM 시스템 고도화', '계약 모듈', '계약 문서 관리', '수아',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '계약 시나리오 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '전체 회귀 테스트', 'progress', 95), jsonb_build_object('title', '성능 테스트', 'progress', 90))),
  jsonb_build_array(), 0, jsonb_build_array());

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_admin_user_id, 2026, 'W07', '2026-02-10', '2026-02-16', 'burden', '모바일 화면 개발')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_admin_user_id, 'Mobile', 'CRM 시스템 고도화', '모바일 앱', '모바일 앱 연동', '김현',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '전자서명 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '대시보드 화면', 'progress', 85), jsonb_build_object('title', '딜 관리', 'progress', 80), jsonb_build_object('title', '푸시 알림', 'progress', 90))),
  jsonb_build_array(), 0, jsonb_build_array(jsonb_build_object('name', '민재', 'relation', 'pair')));

-- ============================================
-- W08 (2026-02-17) - 최종 마무리
-- ============================================

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_planning_user_id, 2026, 'W08', '2026-02-17', '2026-02-23', 'normal', '고급 권한 기획')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_planning_user_id, 'Analytics', 'CRM 시스템 고도화', '분석 모듈', '리포트 자동화', '지민',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '리포트 템플릿 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '최종 리뷰', 'progress', 90), jsonb_build_object('title', '문서화', 'progress', 85))),
  jsonb_build_array(), 0, jsonb_build_array());

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_planning_user_id, 'Security', 'CRM 시스템 고도화', '보안 모듈', '고급 권한 관리', '지민',
  jsonb_build_object('tasks', jsonb_build_array()),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', 'RBAC 설계', 'progress', 70), jsonb_build_object('title', '데이터 접근 제어', 'progress', 60))),
  jsonb_build_array(), 0, jsonb_build_array(jsonb_build_object('name', '하림', 'relation', 'post')));

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_design_user_id, 2026, 'W08', '2026-02-17', '2026-02-23', 'normal', '리포트 디자인')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_design_user_id, 'Analytics', 'CRM 시스템 고도화', '분석 모듈', '리포트 자동화', '하림',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '모바일 화면 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '리포트 템플릿 디자인', 'progress', 80), jsonb_build_object('title', '차트 커스터마이징', 'progress', 75), jsonb_build_object('title', 'PDF 레이아웃', 'progress', 85))),
  jsonb_build_array(), 0, jsonb_build_array());

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_fe_user_id, 2026, 'W08', '2026-02-17', '2026-02-23', 'burden', '모바일 앱 완성')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_fe_user_id, 'Mobile', 'CRM 시스템 고도화', '모바일 앱', '모바일 앱 연동', '서준',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', 'RN 화면 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '고객 상세 화면', 'progress', 95), jsonb_build_object('title', '오프라인 모드', 'progress', 90), jsonb_build_object('title', '테스트 코드', 'progress', 85))),
  jsonb_build_array(), 0, jsonb_build_array());

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_be_user_id, 2026, 'W08', '2026-02-17', '2026-02-23', 'burden', '리포트 및 권한 API')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_be_user_id, 'Analytics', 'CRM 시스템 고도화', '분석 모듈', '리포트 자동화', '민재',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '모바일 API 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '리포트 생성 엔진', 'progress', 85), jsonb_build_object('title', '스케줄러', 'progress', 90), jsonb_build_object('title', 'PDF 생성', 'progress', 80))),
  jsonb_build_array(), 0, jsonb_build_array());

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_be_user_id, 'Security', 'CRM 시스템 고도화', '보안 모듈', '고급 권한 관리', '민재',
  jsonb_build_object('tasks', jsonb_build_array()),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', 'RBAC 미들웨어', 'progress', 70), jsonb_build_object('title', '권한 체크', 'progress', 75))),
  jsonb_build_array(jsonb_build_object('note', '성능 영향 최소화', 'level', 'medium')), 2,
  jsonb_build_array());

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_qa_user_id, 2026, 'W08', '2026-02-17', '2026-02-23', 'burden', '모바일 QA')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_qa_user_id, 'Mobile', 'CRM 시스템 고도화', '모바일 앱', '모바일 앱 연동', '수아',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '계약 QA 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', 'iOS 테스트', 'progress', 85), jsonb_build_object('title', 'Android 테스트', 'progress', 80), jsonb_build_object('title', '오프라인 시나리오', 'progress', 75), jsonb_build_object('title', '푸시 알림 검증', 'progress', 90))),
  jsonb_build_array(), 0, jsonb_build_array());

INSERT INTO snapshots (workspace_id, author_id, year, week, week_start_date, week_end_date, workload_level, workload_note)
VALUES (v_workspace_id, v_admin_user_id, 2026, 'W08', '2026-02-17', '2026-02-23', 'burden', '리포트 자동화 개발')
RETURNING id INTO v_snapshot_id;

INSERT INTO snapshot_entries (snapshot_id, workspace_id, author_id, domain, project, module, feature, name, past_week, this_week, risks, risk_level, collaborators)
VALUES (v_snapshot_id, v_workspace_id, v_admin_user_id, 'Analytics', 'CRM 시스템 고도화', '분석 모듈', '리포트 자동화', '김현',
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '모바일 화면 완료', 'progress', 100))),
  jsonb_build_object('tasks', jsonb_build_array(jsonb_build_object('title', '리포트 빌더', 'progress', 90), jsonb_build_object('title', '차트 통합', 'progress', 95), jsonb_build_object('title', '구독 관리', 'progress', 85), jsonb_build_object('title', '이메일 발송', 'progress', 90))),
  jsonb_build_array(), 0, jsonb_build_array(jsonb_build_object('name', '민재', 'relation', 'pair')));

RAISE NOTICE '=== W03~W08 스냅샷 엔트리 생성 완료 ===';
RAISE NOTICE '전체 W49~W08 (12주) 데이터 생성 완료';

END $$;


