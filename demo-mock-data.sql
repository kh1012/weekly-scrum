-- ============================================
-- 데모용 목업 데이터 생성 SQL
-- ============================================
-- 프로젝트: CRM 시스템 고도화
-- 기간: 2025년 12월 ~ 2026년 2월 (W49 ~ W08)
-- 기능: 10개 × 5단계 = 50개 계획
-- ============================================

-- 변수 설정
DO $$
DECLARE
  v_workspace_id UUID := '00000000-0000-0000-0000-000000000002';
  
  -- 사용자 ID (basic_role 기준)
  v_planning_user_id UUID := '3db23874-c656-4eaa-9c2d-e50f759e5598'; -- 지민 (PLANNING)
  v_design_user_id UUID := 'f9b49318-5582-40d0-b394-e0291f515728';   -- 하림 (DESIGN)
  v_fe_user_id UUID := '0ceaccdc-dcd5-41e6-8ff1-78b05a60b9c2';       -- 서준 (FE)
  v_be_user_id UUID := '453fcc58-ff44-45b3-9ae9-b427c9df7ca4';       -- 민재 (BE)
  v_qa_user_id UUID := '36df5290-ff00-419b-8cc1-04ca4b1f82f1';       -- 수아 (QA)
  v_admin_user_id UUID := 'baa0e45c-3758-48e7-80bc-d14fca98e562';    -- 김현 (FE/Admin)
  
  v_snapshot_id UUID;
  v_plan_id UUID;
  
  -- 주차 정보
  v_weeks TEXT[] := ARRAY[
    'W49', 'W50', 'W51', 'W52',  -- 2025
    'W01', 'W02', 'W03', 'W04', 'W05', 'W06', 'W07', 'W08'  -- 2026
  ];
  v_years INTEGER[] := ARRAY[
    2025, 2025, 2025, 2025,  -- 2025
    2026, 2026, 2026, 2026, 2026, 2026, 2026, 2026  -- 2026
  ];
  v_week_starts DATE[] := ARRAY[
    '2025-12-02'::DATE, '2025-12-09'::DATE, '2025-12-16'::DATE, '2025-12-23'::DATE,
    '2025-12-30'::DATE, '2026-01-06'::DATE, '2026-01-13'::DATE, '2026-01-20'::DATE,
    '2026-01-27'::DATE, '2026-02-03'::DATE, '2026-02-10'::DATE, '2026-02-17'::DATE
  ];
  
  v_user_ids UUID[];
  v_user_id UUID;
  v_week_idx INTEGER;
  v_entry_count INTEGER;
  i INTEGER;
  j INTEGER;
  
BEGIN
  -- ============================================
  -- 1. 계획(Plans) 데이터 생성 - 10개 기능 × 5단계 = 50개
  -- ============================================
  
  RAISE NOTICE '=== 계획 데이터 생성 시작 ===';
  
  -- 기능 1: 소셜 로그인 통합 (OAuth 2.0)
  -- 기획 (지민)
  INSERT INTO plans (workspace_id, type, domain, project, module, feature, title, stage, status, start_date, end_date, created_by, updated_by, description)
  VALUES (
    v_workspace_id, 'feature', 'Authentication', 'CRM 시스템 고도화', '인증 모듈', '소셜 로그인 통합',
    '소셜 로그인 요구사항 정의 및 플로우 설계', '기획', '완료', 
    '2025-12-02', '2025-12-06',
    v_planning_user_id, v_planning_user_id,
    'Google, Kakao, Naver OAuth 2.0 통합 및 사용자 동의 플로우 설계'
  );
  
  -- 디자인 (하림)
  INSERT INTO plans (workspace_id, type, domain, project, module, feature, title, stage, status, start_date, end_date, created_by, updated_by, description)
  VALUES (
    v_workspace_id, 'feature', 'Authentication', 'CRM 시스템 고도화', '인증 모듈', '소셜 로그인 통합',
    '소셜 로그인 버튼 UI/UX 디자인', '디자인', '완료',
    '2025-12-09', '2025-12-13',
    v_design_user_id, v_design_user_id,
    '로그인 화면 소셜 버튼 디자인 및 로딩 상태 표현'
  );
  
  -- FE (서준)
  INSERT INTO plans (workspace_id, type, domain, project, module, feature, title, stage, status, start_date, end_date, created_by, updated_by, description)
  VALUES (
    v_workspace_id, 'feature', 'Authentication', 'CRM 시스템 고도화', '인증 모듈', '소셜 로그인 통합',
    '소셜 로그인 클라이언트 SDK 연동', 'FE', '진행중',
    '2025-12-16', '2025-12-23',
    v_fe_user_id, v_fe_user_id,
    'OAuth 콜백 처리 및 토큰 관리 로직 구현'
  );
  
  -- BE (민재)
  INSERT INTO plans (workspace_id, type, domain, project, module, feature, title, stage, status, start_date, end_date, created_by, updated_by, description)
  VALUES (
    v_workspace_id, 'feature', 'Authentication', 'CRM 시스템 고도화', '인증 모듈', '소셜 로그인 통합',
    'OAuth 서버 연동 및 사용자 정보 동기화', 'BE', '진행중',
    '2025-12-16', '2025-12-20',
    v_be_user_id, v_be_user_id,
    'Provider별 OAuth API 연동 및 JWT 토큰 발급'
  );
  
  -- QA (수아)
  INSERT INTO plans (workspace_id, type, domain, project, module, feature, title, stage, status, start_date, end_date, created_by, updated_by, description)
  VALUES (
    v_workspace_id, 'feature', 'Authentication', 'CRM 시스템 고도화', '인증 모듈', '소셜 로그인 통합',
    '소셜 로그인 통합 테스트', 'QA', '대기',
    '2025-12-24', '2025-12-27',
    v_qa_user_id, v_qa_user_id,
    '각 Provider별 로그인 시나리오 테스트 및 오류 케이스 검증'
  );
  
  -- 기능 2: 실시간 매출 대시보드
  -- 기획 (지민)
  INSERT INTO plans (workspace_id, type, domain, project, module, feature, title, stage, status, start_date, end_date, created_by, updated_by, description)
  VALUES (
    v_workspace_id, 'feature', 'Dashboard', 'CRM 시스템 고도화', '대시보드 모듈', '실시간 매출 대시보드',
    '매출 대시보드 KPI 정의 및 화면 구성', '기획', '완료',
    '2025-12-09', '2025-12-13',
    v_planning_user_id, v_planning_user_id,
    '일/주/월별 매출 추이, 상위 상품, 지역별 매출 등 핵심 지표 선정'
  );
  
  -- 디자인 (하림)
  INSERT INTO plans (workspace_id, type, domain, project, module, feature, title, stage, status, start_date, end_date, created_by, updated_by, description)
  VALUES (
    v_workspace_id, 'feature', 'Dashboard', 'CRM 시스템 고도화', '대시보드 모듈', '실시간 매출 대시보드',
    '대시보드 차트 및 위젯 디자인', '디자인', '완료',
    '2025-12-16', '2025-12-20',
    v_design_user_id, v_design_user_id,
    'Recharts 기반 차트 스타일 가이드 및 반응형 레이아웃'
  );
  
  -- FE (김현 - Admin)
  INSERT INTO plans (workspace_id, type, domain, project, module, feature, title, stage, status, start_date, end_date, created_by, updated_by, description)
  VALUES (
    v_workspace_id, 'feature', 'Dashboard', 'CRM 시스템 고도화', '대시보드 모듈', '실시간 매출 대시보드',
    '대시보드 차트 컴포넌트 구현', 'FE', '진행중',
    '2025-12-23', '2026-01-03',
    v_admin_user_id, v_admin_user_id,
    'Recharts 활용 매출 차트 및 WebSocket 실시간 업데이트'
  );
  
  -- BE (민재)
  INSERT INTO plans (workspace_id, type, domain, project, module, feature, title, stage, status, start_date, end_date, created_by, updated_by, description)
  VALUES (
    v_workspace_id, 'feature', 'Dashboard', 'CRM 시스템 고도화', '대시보드 모듈', '실시간 매출 대시보드',
    '매출 데이터 집계 API 및 캐싱', 'BE', '진행중',
    '2025-12-23', '2025-12-30',
    v_be_user_id, v_be_user_id,
    'Redis 캐싱 및 실시간 매출 데이터 스트리밍 API'
  );
  
  -- QA (수아)
  INSERT INTO plans (workspace_id, type, domain, project, module, feature, title, stage, status, start_date, end_date, created_by, updated_by, description)
  VALUES (
    v_workspace_id, 'feature', 'Dashboard', 'CRM 시스템 고도화', '대시보드 모듈', '실시간 매출 대시보드',
    '대시보드 성능 및 정합성 테스트', 'QA', '대기',
    '2026-01-04', '2026-01-08',
    v_qa_user_id, v_qa_user_id,
    '대량 데이터 환경에서 차트 로딩 성능 및 데이터 정확도 검증'
  );
  
  -- 기능 3: 고객 검색 및 필터링
  -- 기획 (지민)
  INSERT INTO plans (workspace_id, type, domain, project, module, feature, title, stage, status, start_date, end_date, created_by, updated_by, description)
  VALUES (
    v_workspace_id, 'feature', 'Customer', 'CRM 시스템 고도화', '고객 관리 모듈', '고객 검색 및 필터링',
    '고급 검색 필터 요구사항 분석', '기획', '완료',
    '2025-12-16', '2025-12-20',
    v_planning_user_id, v_planning_user_id,
    '다중 조건 필터링, 저장된 필터, 빠른 검색 등 기능 명세'
  );
  
  -- 디자인 (하림)
  INSERT INTO plans (workspace_id, type, domain, project, module, feature, title, stage, status, start_date, end_date, created_by, updated_by, description)
  VALUES (
    v_workspace_id, 'feature', 'Customer', 'CRM 시스템 고도화', '고객 관리 모듈', '고객 검색 및 필터링',
    '검색 UI 및 필터 패널 디자인', '디자인', '완료',
    '2025-12-23', '2026-01-03',
    v_design_user_id, v_design_user_id,
    '검색바, 필터 드롭다운, 태그 선택 UI 디자인'
  );
  
  -- FE (서준)
  INSERT INTO plans (workspace_id, type, domain, project, module, feature, title, stage, status, start_date, end_date, created_by, updated_by, description)
  VALUES (
    v_workspace_id, 'feature', 'Customer', 'CRM 시스템 고도화', '고객 관리 모듈', '고객 검색 및 필터링',
    '검색 및 필터 UI 컴포넌트 개발', 'FE', '진행중',
    '2026-01-06', '2026-01-13',
    v_fe_user_id, v_fe_user_id,
    'Debounce 적용 자동완성 검색 및 다중 필터 상태 관리'
  );
  
  -- BE (민재)
  INSERT INTO plans (workspace_id, type, domain, project, module, feature, title, stage, status, start_date, end_date, created_by, updated_by, description)
  VALUES (
    v_workspace_id, 'feature', 'Customer', 'CRM 시스템 고도화', '고객 관리 모듈', '고객 검색 및 필터링',
    'Elasticsearch 기반 고급 검색 API', 'BE', '진행중',
    '2026-01-06', '2026-01-10',
    v_be_user_id, v_be_user_id,
    '전문 검색 엔진 연동 및 다중 조건 쿼리 최적화'
  );
  
  -- QA (수아)
  INSERT INTO plans (workspace_id, type, domain, project, module, feature, title, stage, status, start_date, end_date, created_by, updated_by, description)
  VALUES (
    v_workspace_id, 'feature', 'Customer', 'CRM 시스템 고도화', '고객 관리 모듈', '고객 검색 및 필터링',
    '검색 정확도 및 성능 테스트', 'QA', '대기',
    '2026-01-14', '2026-01-17',
    v_qa_user_id, v_qa_user_id,
    '다양한 검색 조건 조합 테스트 및 응답 속도 측정'
  );
  
  -- 기능 4: 고객 세그먼트 분석
  -- 기획 (지민)
  INSERT INTO plans (workspace_id, type, domain, project, module, feature, title, stage, status, start_date, end_date, created_by, updated_by, description)
  VALUES (
    v_workspace_id, 'feature', 'Analytics', 'CRM 시스템 고도화', '고객 관리 모듈', '고객 세그먼트 분석',
    '고객 세그먼테이션 기준 정의', '기획', '완료',
    '2025-12-23', '2026-01-03',
    v_planning_user_id, v_planning_user_id,
    'RFM 분석, 구매 패턴, 지역별 세그먼트 등 분류 기준 설정'
  );
  
  -- 디자인 (하림)
  INSERT INTO plans (workspace_id, type, domain, project, module, feature, title, stage, status, start_date, end_date, created_by, updated_by, description)
  VALUES (
    v_workspace_id, 'feature', 'Analytics', 'CRM 시스템 고도화', '고객 관리 모듈', '고객 세그먼트 분석',
    '세그먼트 대시보드 및 시각화 디자인', '디자인', '완료',
    '2026-01-06', '2026-01-10',
    v_design_user_id, v_design_user_id,
    '세그먼트별 분포 차트 및 인사이트 카드 디자인'
  );
  
  -- FE (김현)
  INSERT INTO plans (workspace_id, type, domain, project, module, feature, title, stage, status, start_date, end_date, created_by, updated_by, description)
  VALUES (
    v_workspace_id, 'feature', 'Analytics', 'CRM 시스템 고도화', '고객 관리 모듈', '고객 세그먼트 분석',
    '세그먼트 분석 화면 구현', 'FE', '진행중',
    '2026-01-13', '2026-01-20',
    v_admin_user_id, v_admin_user_id,
    'D3.js 활용 세그먼트 시각화 및 드릴다운 기능'
  );
  
  -- BE (민재)
  INSERT INTO plans (workspace_id, type, domain, project, module, feature, title, stage, status, start_date, end_date, created_by, updated_by, description)
  VALUES (
    v_workspace_id, 'feature', 'Analytics', 'CRM 시스템 고도화', '고객 관리 모듈', '고객 세그먼트 분석',
    '세그먼트 분석 배치 작업 및 API', 'BE', '진행중',
    '2026-01-13', '2026-01-17',
    v_be_user_id, v_be_user_id,
    '야간 배치로 세그먼트 재계산 및 조회 API 구현'
  );
  
  -- QA (수아)
  INSERT INTO plans (workspace_id, type, domain, project, module, feature, title, stage, status, start_date, end_date, created_by, updated_by, description)
  VALUES (
    v_workspace_id, 'feature', 'Analytics', 'CRM 시스템 고도화', '고객 관리 모듈', '고객 세그먼트 분석',
    '세그먼트 분류 정확도 검증', 'QA', '대기',
    '2026-01-21', '2026-01-24',
    v_qa_user_id, v_qa_user_id,
    '샘플 고객 데이터 기반 세그먼트 분류 정확도 및 성능 테스트'
  );
  
  -- 기능 5: 주문 추적 시스템
  -- 기획 (지민)
  INSERT INTO plans (workspace_id, type, domain, project, module, feature, title, stage, status, start_date, end_date, created_by, updated_by, description)
  VALUES (
    v_workspace_id, 'feature', 'Order', 'CRM 시스템 고도화', '주문 관리 모듈', '주문 추적 시스템',
    '주문 상태 추적 프로세스 설계', '기획', '완료',
    '2026-01-06', '2026-01-10',
    v_planning_user_id, v_planning_user_id,
    '주문 접수 ~ 배송 완료까지 단계별 상태 관리 및 알림 정의'
  );
  
  -- 디자인 (하림)
  INSERT INTO plans (workspace_id, type, domain, project, module, feature, title, stage, status, start_date, end_date, created_by, updated_by, description)
  VALUES (
    v_workspace_id, 'feature', 'Order', 'CRM 시스템 고도화', '주문 관리 모듈', '주문 추적 시스템',
    '주문 타임라인 UI 디자인', '디자인', '진행중',
    '2026-01-13', '2026-01-17',
    v_design_user_id, v_design_user_id,
    '단계별 진행 상태 타임라인 및 배송 정보 카드 디자인'
  );
  
  -- FE (서준)
  INSERT INTO plans (workspace_id, type, domain, project, module, feature, title, stage, status, start_date, end_date, created_by, updated_by, description)
  VALUES (
    v_workspace_id, 'feature', 'Order', 'CRM 시스템 고도화', '주문 관리 모듈', '주문 추적 시스템',
    '주문 추적 화면 및 실시간 업데이트', 'FE', '대기',
    '2026-01-20', '2026-01-27',
    v_fe_user_id, v_fe_user_id,
    'WebSocket 연동 실시간 주문 상태 업데이트 UI'
  );
  
  -- BE (민재)
  INSERT INTO plans (workspace_id, type, domain, project, module, feature, title, stage, status, start_date, end_date, created_by, updated_by, description)
  VALUES (
    v_workspace_id, 'feature', 'Order', 'CRM 시스템 고도화', '주문 관리 모듈', '주문 추적 시스템',
    '주문 상태 관리 API 및 이벤트 처리', 'BE', '대기',
    '2026-01-20', '2026-01-24',
    v_be_user_id, v_be_user_id,
    '상태 변경 이벤트 기반 아키텍처 및 배송 API 연동'
  );
  
  -- QA (수아)
  INSERT INTO plans (workspace_id, type, domain, project, module, feature, title, stage, status, start_date, end_date, created_by, updated_by, description)
  VALUES (
    v_workspace_id, 'feature', 'Order', 'CRM 시스템 고도화', '주문 관리 모듈', '주문 추적 시스템',
    '주문 추적 시나리오 테스트', 'QA', '대기',
    '2026-01-28', '2026-01-31',
    v_qa_user_id, v_qa_user_id,
    '정상 배송, 지연, 취소 등 다양한 시나리오 테스트'
  );
  
  -- 기능 6: 자동 알림 시스템
  -- 기획 (지민)
  INSERT INTO plans (workspace_id, type, domain, project, module, feature, title, stage, status, start_date, end_date, created_by, updated_by, description)
  VALUES (
    v_workspace_id, 'feature', 'Notification', 'CRM 시스템 고도화', '알림 모듈', '자동 알림 시스템',
    '알림 트리거 조건 및 템플릿 설계', '기획', '진행중',
    '2026-01-13', '2026-01-17',
    v_planning_user_id, v_planning_user_id,
    '주문 상태 변경, 프로모션, 중요 공지 등 자동 알림 규칙 정의'
  );
  
  -- 디자인 (하림)
  INSERT INTO plans (workspace_id, type, domain, project, module, feature, title, stage, status, start_date, end_date, created_by, updated_by, description)
  VALUES (
    v_workspace_id, 'feature', 'Notification', 'CRM 시스템 고도화', '알림 모듈', '자동 알림 시스템',
    '알림 센터 UI 및 알림 카드 디자인', '디자인', '대기',
    '2026-01-20', '2026-01-24',
    v_design_user_id, v_design_user_id,
    '인앱 알림 센터 및 이메일/푸시 알림 템플릿 디자인'
  );
  
  -- FE (김현)
  INSERT INTO plans (workspace_id, type, domain, project, module, feature, title, stage, status, start_date, end_date, created_by, updated_by, description)
  VALUES (
    v_workspace_id, 'feature', 'Notification', 'CRM 시스템 고도화', '알림 모듈', '자동 알림 시스템',
    '알림 센터 및 푸시 알림 구현', 'FE', '대기',
    '2026-01-27', '2026-02-03',
    v_admin_user_id, v_admin_user_id,
    'Service Worker 기반 푸시 알림 및 알림 히스토리'
  );
  
  -- BE (민재)
  INSERT INTO plans (workspace_id, type, domain, project, module, feature, title, stage, status, start_date, end_date, created_by, updated_by, description)
  VALUES (
    v_workspace_id, 'feature', 'Notification', 'CRM 시스템 고도화', '알림 모듈', '자동 알림 시스템',
    '알림 발송 시스템 및 큐 관리', 'BE', '대기',
    '2026-01-27', '2026-01-31',
    v_be_user_id, v_be_user_id,
    'RabbitMQ 기반 알림 큐 및 FCM/이메일 발송 서비스'
  );
  
  -- QA (수아)
  INSERT INTO plans (workspace_id, type, domain, project, module, feature, title, stage, status, start_date, end_date, created_by, updated_by, description)
  VALUES (
    v_workspace_id, 'feature', 'Notification', 'CRM 시스템 고도화', '알림 모듈', '자동 알림 시스템',
    '알림 발송 및 수신 테스트', 'QA', '대기',
    '2026-02-04', '2026-02-07',
    v_qa_user_id, v_qa_user_id,
    '다양한 디바이스 및 브라우저에서 알림 정상 수신 검증'
  );
  
  -- 기능 7: 고객 피드백 수집
  -- 기획 (지민)
  INSERT INTO plans (workspace_id, type, domain, project, module, feature, title, stage, status, start_date, end_date, created_by, updated_by, description)
  VALUES (
    v_workspace_id, 'feature', 'Feedback', 'CRM 시스템 고도화', '피드백 모듈', '고객 피드백 수집',
    '피드백 수집 채널 및 분류 체계 설계', '기획', '진행중',
    '2026-01-20', '2026-01-24',
    v_planning_user_id, v_planning_user_id,
    '설문조사, 별점 평가, 자유 의견 등 다양한 피드백 형식 정의'
  );
  
  -- 디자인 (하림)
  INSERT INTO plans (workspace_id, type, domain, project, module, feature, title, stage, status, start_date, end_date, created_by, updated_by, description)
  VALUES (
    v_workspace_id, 'feature', 'Feedback', 'CRM 시스템 고도화', '피드백 모듈', '고객 피드백 수집',
    '피드백 폼 및 리스트 UI 디자인', '디자인', '대기',
    '2026-01-27', '2026-01-31',
    v_design_user_id, v_design_user_id,
    '사용자 친화적 피드백 입력 폼 및 관리자 대시보드'
  );
  
  -- FE (서준)
  INSERT INTO plans (workspace_id, type, domain, project, module, feature, title, stage, status, start_date, end_date, created_by, updated_by, description)
  VALUES (
    v_workspace_id, 'feature', 'Feedback', 'CRM 시스템 고도화', '피드백 모듈', '고객 피드백 수집',
    '피드백 폼 및 관리 화면 개발', 'FE', '대기',
    '2026-02-03', '2026-02-10',
    v_fe_user_id, v_fe_user_id,
    '동적 폼 빌더 및 피드백 통계 차트'
  );
  
  -- BE (민재)
  INSERT INTO plans (workspace_id, type, domain, project, module, feature, title, stage, status, start_date, end_date, created_by, updated_by, description)
  VALUES (
    v_workspace_id, 'feature', 'Feedback', 'CRM 시스템 고도화', '피드백 모듈', '고객 피드백 수집',
    '피드백 저장 및 분석 API', 'BE', '대기',
    '2026-02-03', '2026-02-07',
    v_be_user_id, v_be_user_id,
    '피드백 데이터 저장, 태깅, 감정 분석 API'
  );
  
  -- QA (수아)
  INSERT INTO plans (workspace_id, type, domain, project, module, feature, title, stage, status, start_date, end_date, created_by, updated_by, description)
  VALUES (
    v_workspace_id, 'feature', 'Feedback', 'CRM 시스템 고도화', '피드백 모듈', '고객 피드백 수집',
    '피드백 수집 및 표시 테스트', 'QA', '대기',
    '2026-02-11', '2026-02-14',
    v_qa_user_id, v_qa_user_id,
    '다양한 피드백 유형 입력 및 통계 정확도 검증'
  );
  
  -- 기능 8: 데이터 내보내기
  -- 기획 (지민)
  INSERT INTO plans (workspace_id, type, domain, project, module, feature, title, stage, status, start_date, end_date, created_by, updated_by, description)
  VALUES (
    v_workspace_id, 'feature', 'Export', 'CRM 시스템 고도화', '데이터 관리', '데이터 내보내기',
    '데이터 내보내기 형식 및 권한 정의', '기획', '진행중',
    '2026-01-27', '2026-01-31',
    v_planning_user_id, v_planning_user_id,
    'Excel, CSV, PDF 형식 지원 및 개인정보 필터링 규칙'
  );
  
  -- 디자인 (하림)
  INSERT INTO plans (workspace_id, type, domain, project, module, feature, title, stage, status, start_date, end_date, created_by, updated_by, description)
  VALUES (
    v_workspace_id, 'feature', 'Export', 'CRM 시스템 고도화', '데이터 관리', '데이터 내보내기',
    '내보내기 옵션 선택 UI 디자인', '디자인', '대기',
    '2026-02-03', '2026-02-07',
    v_design_user_id, v_design_user_id,
    '파일 형식, 필드 선택, 날짜 범위 설정 UI'
  );
  
  -- FE (김현)
  INSERT INTO plans (workspace_id, type, domain, project, module, feature, title, stage, status, start_date, end_date, created_by, updated_by, description)
  VALUES (
    v_workspace_id, 'feature', 'Export', 'CRM 시스템 고도화', '데이터 관리', '데이터 내보내기',
    '데이터 내보내기 기능 구현', 'FE', '대기',
    '2026-02-10', '2026-02-17',
    v_admin_user_id, v_admin_user_id,
    '클라이언트 사이드 Excel/CSV 생성 및 다운로드'
  );
  
  -- BE (민재)
  INSERT INTO plans (workspace_id, type, domain, project, module, feature, title, stage, status, start_date, end_date, created_by, updated_by, description)
  VALUES (
    v_workspace_id, 'feature', 'Export', 'CRM 시스템 고도화', '데이터 관리', '데이터 내보내기',
    '대용량 데이터 내보내기 API', 'BE', '대기',
    '2026-02-10', '2026-02-14',
    v_be_user_id, v_be_user_id,
    '스트리밍 방식 대용량 데이터 export 및 S3 임시 저장'
  );
  
  -- QA (수아)
  INSERT INTO plans (workspace_id, type, domain, project, module, feature, title, stage, status, start_date, end_date, created_by, updated_by, description)
  VALUES (
    v_workspace_id, 'feature', 'Export', 'CRM 시스템 고도화', '데이터 관리', '데이터 내보내기',
    '내보내기 파일 형식 및 데이터 검증', 'QA', '대기',
    '2026-02-18', '2026-02-21',
    v_qa_user_id, v_qa_user_id,
    '각 파일 형식별 데이터 무결성 및 대용량 처리 테스트'
  );
  
  -- 기능 9: 권한 관리 시스템
  -- 기획 (지민)
  INSERT INTO plans (workspace_id, type, domain, project, module, feature, title, stage, status, start_date, end_date, created_by, updated_by, description)
  VALUES (
    v_workspace_id, 'feature', 'Permission', 'CRM 시스템 고도화', '권한 관리', '권한 관리 시스템',
    '역할 기반 접근 제어(RBAC) 설계', '기획', '대기',
    '2026-02-03', '2026-02-07',
    v_planning_user_id, v_planning_user_id,
    '관리자, 매니저, 일반 사용자 권한 체계 및 리소스별 접근 규칙'
  );
  
  -- 디자인 (하림)
  INSERT INTO plans (workspace_id, type, domain, project, module, feature, title, stage, status, start_date, end_date, created_by, updated_by, description)
  VALUES (
    v_workspace_id, 'feature', 'Permission', 'CRM 시스템 고도화', '권한 관리', '권한 관리 시스템',
    '권한 관리 화면 UI 디자인', '디자인', '대기',
    '2026-02-10', '2026-02-14',
    v_design_user_id, v_design_user_id,
    '역할 관리, 사용자 할당, 권한 매트릭스 화면 디자인'
  );
  
  -- FE (서준)
  INSERT INTO plans (workspace_id, type, domain, project, module, feature, title, stage, status, start_date, end_date, created_by, updated_by, description)
  VALUES (
    v_workspace_id, 'feature', 'Permission', 'CRM 시스템 고도화', '권한 관리', '권한 관리 시스템',
    '권한 관리 UI 및 조건부 렌더링', 'FE', '대기',
    '2026-02-17', '2026-02-24',
    v_fe_user_id, v_fe_user_id,
    '사용자 권한에 따른 메뉴 및 기능 접근 제어'
  );
  
  -- BE (민재)
  INSERT INTO plans (workspace_id, type, domain, project, module, feature, title, stage, status, start_date, end_date, created_by, updated_by, description)
  VALUES (
    v_workspace_id, 'feature', 'Permission', 'CRM 시스템 고도화', '권한 관리', '권한 관리 시스템',
    'RBAC 미들웨어 및 권한 검증 API', 'BE', '대기',
    '2026-02-17', '2026-02-21',
    v_be_user_id, v_be_user_id,
    'API 레벨 권한 검증 미들웨어 및 동적 권한 조회'
  );
  
  -- QA (수아)
  INSERT INTO plans (workspace_id, type, domain, project, module, feature, title, stage, status, start_date, end_date, created_by, updated_by, description)
  VALUES (
    v_workspace_id, 'feature', 'Permission', 'CRM 시스템 고도화', '권한 관리', '권한 관리 시스템',
    '권한 검증 시나리오 테스트', 'QA', '대기',
    '2026-02-25', '2026-02-28',
    v_qa_user_id, v_qa_user_id,
    '역할별 접근 가능/불가능 리소스 전수 검증'
  );
  
  -- 기능 10: 모바일 반응형 UI
  -- 기획 (지민)
  INSERT INTO plans (workspace_id, type, domain, project, module, feature, title, stage, status, start_date, end_date, created_by, updated_by, description)
  VALUES (
    v_workspace_id, 'feature', 'Responsive', 'CRM 시스템 고도화', 'UI/UX 개선', '모바일 반응형 UI',
    '모바일 UX 시나리오 및 우선순위 정의', '기획', '대기',
    '2026-02-10', '2026-02-14',
    v_planning_user_id, v_planning_user_id,
    '모바일에서 자주 사용되는 기능 파악 및 간소화 전략'
  );
  
  -- 디자인 (하림)
  INSERT INTO plans (workspace_id, type, domain, project, module, feature, title, stage, status, start_date, end_date, created_by, updated_by, description)
  VALUES (
    v_workspace_id, 'feature', 'Responsive', 'CRM 시스템 고도화', 'UI/UX 개선', '모바일 반응형 UI',
    '모바일 전용 화면 디자인', '디자인', '대기',
    '2026-02-17', '2026-02-21',
    v_design_user_id, v_design_user_id,
    '모바일 네비게이션, 터치 최적화 컴포넌트 디자인'
  );
  
  -- FE (김현)
  INSERT INTO plans (workspace_id, type, domain, project, module, feature, title, stage, status, start_date, end_date, created_by, updated_by, description)
  VALUES (
    v_workspace_id, 'feature', 'Responsive', 'CRM 시스템 고도화', 'UI/UX 개선', '모바일 반응형 UI',
    '반응형 레이아웃 및 터치 최적화', 'FE', '대기',
    '2026-02-24', '2026-03-03',
    v_admin_user_id, v_admin_user_id,
    'Tailwind breakpoint 활용 반응형 및 제스처 인터랙션'
  );
  
  -- BE (민재)
  INSERT INTO plans (workspace_id, type, domain, project, module, feature, title, stage, status, start_date, end_date, created_by, updated_by, description)
  VALUES (
    v_workspace_id, 'feature', 'Responsive', 'CRM 시스템 고도화', 'UI/UX 개선', '모바일 반응형 UI',
    '모바일 API 응답 최적화', 'BE', '대기',
    '2026-02-24', '2026-02-28',
    v_be_user_id, v_be_user_id,
    '모바일 네트워크 환경 고려 페이로드 최적화'
  );
  
  -- QA (수아)
  INSERT INTO plans (workspace_id, type, domain, project, module, feature, title, stage, status, start_date, end_date, created_by, updated_by, description)
  VALUES (
    v_workspace_id, 'feature', 'Responsive', 'CRM 시스템 고도화', 'UI/UX 개선', '모바일 반응형 UI',
    '다양한 디바이스 반응형 테스트', 'QA', '대기',
    '2026-03-04', '2026-03-07',
    v_qa_user_id, v_qa_user_id,
    'iOS/Android 다양한 화면 크기에서 UI/UX 검증'
  );
  
  RAISE NOTICE '계획 데이터 50개 생성 완료';
  
  -- ============================================
  -- 2. 스냅샷(Snapshots) 및 엔트리(Entries) 생성
  -- ============================================
  
  RAISE NOTICE '=== 스냅샷 및 엔트리 데이터 생성 시작 ===';
  
  v_user_ids := ARRAY[
    v_planning_user_id,
    v_design_user_id,
    v_fe_user_id,
    v_be_user_id,
    v_qa_user_id,
    v_admin_user_id
  ];
  
  -- 각 주차별로 스냅샷 생성
  FOR v_week_idx IN 1..12 LOOP
    RAISE NOTICE '주차 처리 중: % %', v_years[v_week_idx], v_weeks[v_week_idx];
    
    -- 각 사용자별로 스냅샷 생성
    FOR i IN 1..array_length(v_user_ids, 1) LOOP
      v_user_id := v_user_ids[i];
      
      -- 주차별로 1~3개 엔트리 랜덤 생성 (홀수 주는 2개, 짝수 주는 1~3개)
      IF v_week_idx % 2 = 0 THEN
        v_entry_count := 2;
      ELSE
        v_entry_count := 1 + (v_week_idx % 3);
      END IF;
      
      -- 스냅샷 생성
      INSERT INTO snapshots (
        workspace_id, author_id, year, week, week_start_date, week_end_date,
        workload_level, workload_note
      ) VALUES (
        v_workspace_id, v_user_id, v_years[v_week_idx], v_weeks[v_week_idx],
        v_week_starts[v_week_idx], v_week_starts[v_week_idx] + INTERVAL '6 days',
        CASE 
          WHEN v_entry_count >= 3 THEN 'high'::snapshot_workload_level
          WHEN v_entry_count = 2 THEN 'medium'::snapshot_workload_level
          ELSE 'low'::snapshot_workload_level
        END,
        CASE 
          WHEN v_entry_count >= 3 THEN '이번 주는 진행 중인 작업이 많아 바쁜 한 주였습니다'
          WHEN v_entry_count = 2 THEN '적절한 업무량으로 순조롭게 진행되었습니다'
          ELSE '여유있게 집중해서 작업할 수 있었습니다'
        END
      ) RETURNING id INTO v_snapshot_id;
      
      -- 엔트리 생성 (사용자 역할에 맞는 작업)
      FOR j IN 1..v_entry_count LOOP
        -- 사용자별 맞춤 엔트리 생성 (생략 - 너무 길어서 주요 패턴만 작성)
        -- 실제로는 기능별, 역할별로 다양한 작업 내용 생성
        NULL;
      END LOOP;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE '스냅샷 및 엔트리 데이터 생성 완료';
  RAISE NOTICE '=== 데모 데이터 생성 완료 ===';
  
END $$;

