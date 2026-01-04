-- ============================================
-- 데모 데이터 완전 재생성 스크립트
-- ============================================
-- 1. 기존 데이터 삭제
-- 2. Plan 데이터 생성 (담당자 1명씩)
-- 3. Snapshot 엔트리 생성 (name = 작성자 이름)
-- ============================================

\echo '=== 기존 데이터 삭제 시작 ==='
DELETE FROM snapshot_entries WHERE workspace_id = '00000000-0000-0000-0000-000000000002';
DELETE FROM snapshots WHERE workspace_id = '00000000-0000-0000-0000-000000000002';
DELETE FROM plan_assignees WHERE workspace_id = '00000000-0000-0000-0000-000000000002';
DELETE FROM plans WHERE workspace_id = '00000000-0000-0000-0000-000000000002';
\echo '=== 기존 데이터 삭제 완료 ==='

\echo ''
\echo '=== Plan 데이터 생성 시작 (50개) ==='
\i demo-mock-data.sql

\echo ''
\echo '=== Snapshot 엔트리 생성 시작 (W49~W02) ==='
\i demo-snapshot-entries2.sql

\echo ''
\echo '=== Snapshot 엔트리 추가 생성 (W03~W08) ==='
\i demo-snapshot-entries-w03-w08.sql

\echo ''
\echo '=== 데모 데이터 생성 완료 ==='
\echo '- Plans: 50개'
\echo '- Snapshots: 약 70개'
\echo '- Snapshot Entries: 약 120개'
\echo '- 기간: 2025년 12월 ~ 2026년 2월 (W49~W08, 12주)'
\echo ''
\echo '생성된 사용자:'
\echo '  - 지민 (PLANNING)'
\echo '  - 하림 (DESIGN)'
\echo '  - 서준 (FE)'
\echo '  - 민재 (BE)'
\echo '  - 수아 (QA)'
\echo '  - 김현 (Admin/FE)'
