[추가 요구사항: Plans 메뉴를 역할별로 이중 노출 + 권한 분리]
기존 “Admin > Plans(관리자만)” 프롬프팅을 다음처럼 확장한다.

────────────────────────────────────────
[요구사항 A: SNB 메뉴 노출 규칙]

1. 업무(모든 로그인 사용자) 섹션에 “Plans” 메뉴를 추가한다.

- 메뉴명: Plans
- 대상: member/leader/admin 전원
- 라우트: /app/plans
- 권한: Read-only (조회만)

2. 관리자(조건부: admin/leader만) 섹션에 “All Plans” 메뉴를 추가한다.

- 메뉴명: All Plans
- 대상: leader/admin만
- 라우트: /app/admin/plans
- 권한: CRUD (생성/수정/삭제 포함)

3. 표기 규칙

- 업무 섹션: “Plans”
- 관리자 섹션: “All Plans”
- 혼동 방지:
  - 일반 Plans 화면에는 “조회 전용(Read-only)” 배지를 표시하거나,
    생성/수정/삭제 버튼을 완전히 숨긴다.
  - All Plans 화면에는 “관리자 전용(CRUD)” 배지를 표시(옵션).

────────────────────────────────────────
[요구사항 B: 라우트/권한 가드]

1. /app/plans (Read-only)

- 로그인한 workspace member라면 접근 가능
- 서버에서 role 체크는 optional(단, 로그인/온보딩 완료는 필수)
- UI에서 create/edit/delete 기능 노출 금지
- 서버 액션(create/update/delete)는 이 라우트에서 호출하지 않는다.

2. /app/admin/plans (CRUD)

- leader/admin만 접근 가능
- 서버 가드 필수(getWorkspaceRole로 체크)
- leader/admin이 아닌 경우 redirect(/app) 또는 403

────────────────────────────────────────
[요구사항 C: 데이터 조회 범위]

1. /app/plans (Read-only)

- 워크스페이스 범위의 plans를 조회한다.
- 단, “민감한 편집 정보”는 없으므로 plans는 그대로 노출 가능.
- 필터/그룹/월 범위 조회는 admin과 동일 UI 컴포넌트를 재사용해도 됨.
- 차이점은 “쓰기 기능이 제거된 UI”라는 것.

2. /app/admin/plans (CRUD)

- 동일하게 워크스페이스 범위 조회 + CRUD 가능

────────────────────────────────────────
[요구사항 D: 구현 방식(중복 최소화)]

1. 공통 Plans 뷰 컴포넌트를 만든다.

- 예: src/features/plans/PlansBoard.tsx
- props로 mode를 전달:
  - mode = 'readonly' | 'admin'
- mode='readonly'이면:
  - "+ 계획 등록", "수정", "삭제" 버튼 미노출
  - 편집 패널/폼 진입 불가
- mode='admin'이면:
  - CRUD UI 전부 활성화

2. 공통 데이터 레이어는 동일 사용

- listPlansForMonth({workspaceId, monthStart, monthEnd, filters})는
  readonly/admin 모두 사용

3. 서버 액션은 admin 라우트에서만 사용

- createPlanAction/updatePlanAction/deletePlanAction
- 내부에서 admin/leader 검증 + workspaceId 강제 + created_by/updated_by 세팅

────────────────────────────────────────
[요구사항 E: RLS 정책 고려(중요)]

- /app/plans에서 워크스페이스 전체 plans를 읽으려면,
  RLS에 “workspace member는 select 가능” 정책이 필요하다.
- /app/admin/plans에서 CRUD하려면,
  RLS에 “admin/leader는 insert/update/delete 가능” 정책이 필요하다.
- 만약 현재 RLS에서 막히면,
  Cursor는 어떤 요청이 403인지 로그로 특정하고,
  필요한 정책 SQL을 “제안 블록”으로 출력한다(실행 강요 금지).

────────────────────────────────────────
[추가 라우트 정의]

- /app/plans (Read-only)
- /app/admin/plans (CRUD, 메뉴명 All Plans)

────────────────────────────────────────
[SNB 구조 반영 예시]

- 업무
  - Work Map
  - Calendar
  - Snapshots
  - Plans ← 신규(전원 노출, read-only)
- 개인공간
  - Manage
- 관리자 (leader/admin만)
  - All Snapshots
  - All Plans ← 신규(leader/admin만, CRUD)
  - Members
  - Meta Options
- 기타
  - Release Notes

────────────────────────────────────────
[출력 요구(추가)]

- SNB 메뉴 정의 변경 코드(Plans/All Plans 분리 포함)
- /app/plans 페이지 구현(조회 전용)
- /app/admin/plans 페이지 구현(기존 CRUD)
- 공통 컴포넌트(PlansBoard mode 분기) 구현
- 권한/가드 및 RLS 이슈 대응 가이드

────────────────────────────────────────
[완료 조건(추가)]

- member는 업무 섹션의 “Plans(/app/plans)”에서 워크스페이스 plans를 조회만 할 수 있다.
- member는 생성/수정/삭제 UI가 보이지 않으며, 쓰기 동작도 불가능하다.
- leader/admin은 관리자 섹션의 “All Plans(/app/admin/plans)”에서 plans CRUD가 가능하다.
- 두 화면은 공통 UI를 재사용하되, mode에 따라 기능이 분리된다.
