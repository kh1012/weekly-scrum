[목표]
기존 “외부에서 스크럼 텍스트/데이터를 생성하면 자동 파싱하여(주차 개념 없이) 스냅샷에 채워넣는 보조 도구”에서,
Supabase 기반 “개인화된 스냅샷 관리(Manage)”로 전환한다.

단, 기존 작성 편의 기능(임시저장/카드편집/복제/삭제/미리보기/옵션/리스크/진행률/덮어쓰기 등)은 100% 유지한다.
새로 달라지는 점은, 이제 사용자가 Manage(스냅샷 관리)에서 “연도 + ISO 주차”를 먼저 선택한 다음,
해당 주차 컨텍스트에서 여러 개의 스냅샷(카드/항목)을 작성/편집/발행(CRUD)할 수 있어야 한다.

[배경/기존 동작]

- 기존에는 주차(ISO) 개념을 UI에서 선택하지 않아도 됐음
- 외부에서 생성한 데이터(예: 2025-W49, 2025-W50)를 스크립트로 JSON으로 만들고,
  이를 앱이 자동 파싱하여 입력값으로 채워 넣는 형태였음
- 파일명/키: 2025-W49, 2025-W50
- 주차 범위 예:
  - 2025-W49 = 12-01 ~ 12-07
  - 2025-W50 = 12-08 ~ 12-14
- 이제는 개인화된 공간이므로, “주차 컨텍스트”가 앱 내부에서 먼저 확정되어야 함

[새 요구사항 1: Manage(스냅샷 관리)에서 ‘주차 컨텍스트’를 먼저 선택]
(기존 내용 그대로 유지)

[새 요구사항 2: 주차 데이터 모델링(ISO 기반)]
(기존 내용 그대로 유지)

[새 요구사항 3: 기존 작성 편의 기능 100% 유지 + “주차 컨텍스트”에 종속]
(기존 내용 그대로 유지)

[새 요구사항 4: 기존 “외부 데이터 파싱” 경험을 대체하는 ‘Import’ 옵션]
(기존 내용 그대로 유지)

────────────────────────────────────────
[새 요구사항 5: SNB(사이드 네비게이션) 구조 전면 정리]
────────────────────────────────────────

목표:
기존 “보조 도구/실험용” 성격의 메뉴들을 제거하고,
현재 서비스의 역할에 맞게 **개인화된 업무 공간 중심의 SNB 구조**로 재편한다.

1. SNB에서 아래 메뉴만 유지하고, 나머지는 전부 제거한다.

- Work Map
- Calendar
- Snapshots
- Manage
- Release Notes

2. SNB를 “섹션(카테고리)” 단위로 명확히 구분한다.

- 섹션 구분은 시각적으로 명확해야 하며(헤더/구분선/타이포 등),
  단순 정렬이 아니라 의미 있는 정보 구조여야 한다.

3. 섹션 구조는 아래를 기본으로 한다.

- 업무

  - Work Map
  - Calendar
  - Snapshots

- 개인공간

  - Manage ← (중요) 반드시 이 섹션으로 분리

- 기타
  - Release Notes

4. Manage 메뉴의 의미 재정의

- Manage는 더 이상 “설정/실험/보조” 메뉴가 아니다.
- “내 스냅샷을 관리하는 개인화된 공간”의 진입점이다.
- Manage 하위에서 스냅샷 관리(연도/주차 선택, 작성, 편집, Import 등)가 이루어진다.
- 기존 Snapshots 메뉴는 “조회/회고/히스토리 중심”으로 유지하거나,
  필요 시 Manage와 역할을 구분한다.

5. 구현 가이드

- SNB 정의가 상수/배열/설정 파일로 관리되고 있다면,
  해당 정의를 직접 수정하여 불필요한 메뉴를 제거한다.
- 조건부 렌더링(if feature flag 등)으로 숨기는 것이 아니라,
  실제 메뉴 정의에서 삭제한다.
- 라우트 자체가 더 이상 필요 없는 경우,
  dead route 및 관련 컴포넌트도 함께 정리한다.

6. 접근 제어

- 로그인하지 않은 사용자는 SNB 자체가 렌더링되지 않아야 한다.
- 로그인 + profiles 온보딩 완료 이후에만 SNB 노출.

────────────────────────────────────────

[UI/라우팅 요구사항]
(기존 내용 그대로 유지)

[구현 가이드]
(기존 내용 그대로 유지)

[작업 단계 - 순서 고정]

1. 기존 스냅샷 작성 편의 기능 목록화(체크리스트 문서화)
2. ISO week 유틸 구현 및 주차 컨텍스트 라우팅 추가
3. snapshots 모델에 year/iso_week/week_start/end 매핑 적용
4. Manage > Week Picker / Week Context 화면 추가
5. 기존 편집기/임시저장 기능을 Week Context에 연결
6. Import(JSON 붙여넣기) 기능 구현
7. CRUD(서버 액션) 연결 및 RLS 권한 검증
8. SNB 메뉴 정리
   - 지정된 메뉴만 유지
   - 섹션 구조 적용
   - Manage를 “개인공간”으로 분리

[출력 요구]

- 변경/생성 파일 목록
- 각 파일 전체 코드(중간 생략 금지)
- ISO week 계산 방식 설명 + 테스트 케이스
- 기존 기능 체크리스트 문서(docs/snapshot-feature-checklist.md)
- SNB 구조 변경 전/후 요약
- 테스트 시나리오
  - 2025 W49 선택 → 신규 draft 생성 → entries 편집 → 임시저장 → publish
  - 2025 W50 선택 → Import JSON 붙여넣기 → 미리보기 → 생성
  - 다른 유저로 로그인 시 타인 데이터 수정 불가

[완료 조건]

- 사용자가 Manage에서 연도+ISO 주차를 먼저 선택하고,
  해당 주차 컨텍스트에서 여러 스냅샷을 작성/편집/발행/관리할 수 있다.
- 기존 작성 편의 기능은 하나도 빠지지 않는다.
- Supabase 기반으로 데이터가 영속 저장된다.
- SNB는 지정된 메뉴만 남고, Manage는 “개인공간” 섹션으로 명확히 분리된다.

[목표]
Supabase(Auth + Postgres + RLS) 기반 “개인화된 스냅샷 관리(Manage)” 구조에 더해,
workspace_members.role이 admin 또는 leader 인 사용자에게만 “관리자 메뉴”를 SNB에 추가한다.

관리자 메뉴에서는:

1. 전체 스냅샷 관리(워크스페이스 전체 사용자 데이터 조회/관리)
2. 일정표(Plans) 기능 CRUD (워크스페이스 단위 계획 데이터)
   를 제공한다.

중요: 일반 사용자(member)는 본인 스냅샷만 CRUD 가능하고,
관리자(admin/leader)만 전체 데이터 관리와 plans CRUD가 가능해야 한다.
(기능/UX에서 숨김 + DB RLS에서 차단 둘 다 필요)

────────────────────────────────────────
[현재 상태 / 전제]

- Next.js App Router 사용
- Supabase 구성 완료
  - workspace_members 테이블 존재 (workspace_id, user_id, role)
  - role 타입 workspace_role(enum) 사용
  - snapshots / snapshot_entries / plans / plan_assignees 테이블 존재 (Table Editor에 확인됨)
  - RLS 적용 (Phase 3 기반) + is_workspace_member / is_workspace_admin_or_leader 같은 함수가 존재하거나, 존재하지 않으면 직접 정책 구현
- SNB는 “업무 / 개인공간 / 기타” 섹션으로 정리 중이며, 기본 메뉴는
  - Work Map
  - Calendar
  - Snapshots
  - Manage(개인공간)
  - Release Notes
    만 남기는 방향

────────────────────────────────────────
[새 요구사항 1: 관리자 메뉴(SNB) 조건부 추가]

1. 접속한 사용자가 아래 조건을 만족할 때만 SNB에 “관리자” 섹션을 추가한다.

- workspace_members.role in ('admin', 'leader')

2. SNB 섹션 구조는 다음을 기본으로 한다.

- 업무
  - Work Map
  - Calendar
  - Snapshots
- 개인공간
  - Manage
- 관리자 (조건부: admin/leader만 노출)
  - Admin Dashboard (또는 Admin Home)
  - All Snapshots
  - Plans
- 기타
  - Release Notes

3. 구현 원칙

- UI에서 메뉴 노출을 숨기는 것만으로 끝내지 말 것.
- 실제 라우트 접근도 서버에서 권한 체크하여 차단해야 함.
  (middleware 또는 각 페이지 server component에서 role 체크 후 redirect/403)

────────────────────────────────────────
[새 요구사항 2: role 조회 방식 표준화]

1. 현재 로그인 유저의 role을 “항상 동일한 경로”로 가져오도록 공통 유틸을 만든다.

- src/lib/auth/getWorkspaceRole.ts (server)
  - 입력: workspaceId
  - 출력: 'member' | 'leader' | 'admin' | null
  - 내부에서 supabase.auth.getUser() → workspace_members 조회

2. SNB 렌더링 시 role 기반으로 메뉴 배열을 구성한다.

- role === admin/leader 인 경우에만 관리자 섹션 삽입

3. role 조회는 서버에서 수행하는 것을 기본으로 한다.

- 클라이언트에서 role을 신뢰하지 말 것(UX용 보조만 가능)

────────────────────────────────────────
[새 요구사항 3: 관리자 기능 - 전체 스냅샷 관리]

1. 관리자만 접근 가능한 라우트 추가

- /app/admin
- /app/admin/snapshots
- /app/admin/snapshots/[snapshotId]

2. 기능 범위(MVP)

- 전체 스냅샷 목록 조회(워크스페이스 단위)
  - 필터: year/week, author_name 또는 author_id, status(draft/published)
  - 정렬: 최신 주차 우선
- 스냅샷 상세 조회 + entries 조회
- (선택) 삭제/상태 변경
  - RLS가 허용하는 범위 내에서만
  - 허용하지 않는다면 UI에 “권한 정책상 불가” 안내 및 정책 수정 제안

3. 데이터 접근은 반드시 RLS를 준수한다.

- 관리자 조회/수정/삭제 권한이 필요하면 RLS 정책이 이를 허용해야 한다.
- 현재 정책이 작성자만 접근 가능한 경우, “관리자 조회”가 실패할 수 있으므로
  - 필요한 정책을 제안/추가하되, SQL은 별도 섹션으로 분리하여 제공한다.

────────────────────────────────────────
[새 요구사항 4: 관리자 기능 - Plans(일정표) CRUD]
중요: Plans는 “워크스페이스 단위” 데이터이며,
관리자(admin/leader)만 CRUD 가능하게 한다. (member는 읽기만 또는 접근 불가 중 택1)

1. DB 테이블은 현재 Supabase에 이미 존재하는 것을 그대로 사용한다.

- public.plans
- public.plan_assignees
  (테이블/컬럼은 Cursor가 프로젝트에서 supabase 타입/쿼리로 확인하여 정확히 맞출 것)

2. Plans 화면 라우팅

- /app/admin/plans
  - plans 목록 + 필터(프로젝트/모듈/피쳐/상태/담당자)
  - 새 plan 생성 버튼
- /app/admin/plans/new
  - plan 생성 폼
- /app/admin/plans/[planId]
  - plan 상세 + 편집 진입
- /app/admin/plans/[planId]/edit
  - plan 수정 폼
    (구조는 프로젝트 컨벤션에 맞게 조정 가능)

3. Plans 데이터 모델링 규칙(기존 대화 기반 핵심만 반영)

- plan의 단위는 feature까지 포함 가능
  - project/module/feature 개념을 사용
- plan에는 상태(stage)가 있고 한글로 직관적으로 표시(예: 컨셉기획/상세기획/디자인/BE/FE/QA/릴리즈 등)
- 담당자는 복수 지정 가능(옵션)이며, 기획/개발/디자인 등 역할 구분은 추후 확장 가능
  - 지금은 plan_assignees를 사용해 N:M 관계로 구성
- “배포/스프린트/릴리즈” 류의 이벤트성 항목은 title만 있어도 되지만,
  지금 MVP는 “feature 계획 CRUD”부터 안정화한다.

4. 권한

- admin/leader: plans CRUD 가능
- member: (선택지)
  - A안: 조회만 가능(워크스페이스 멤버)
  - B안: 아예 접근 불가
    Cursor는 A안을 기본으로 구현하되, B안으로 바꾸기 쉽도록 구성한다.

5. 서버 액션 기반 CRUD

- create/update/delete는 Server Actions 또는 Route Handler로만 수행
- 클라이언트 직접 insert/update/delete 금지

────────────────────────────────────────
[새 요구사항 5: 단계별 구현 계획(중요, 순서 고정)]
Step 1) role 조회 유틸 확립

- getWorkspaceRole(server) 구현
- 기본 workspaceId = DEFAULT_WORKSPACE_ID 사용
- role 조회 실패 케이스 로깅(멤버 row 없음, RLS 거부 등)

Step 2) SNB 조건부 섹션 추가

- role이 admin/leader면 “관리자” 섹션 노출
- member면 관리자 섹션 미노출
- SNB에서 기존 불필요 메뉴 제거 유지

Step 3) 관리자 라우트 가드 추가

- /app/admin/\*\* 진입 시 role 체크
- admin/leader 아니면 /app로 redirect 또는 403 화면
- 서버 컴포넌트에서 체크(권장) + 필요 시 middleware 보조

Step 4) 전체 스냅샷 관리(MVP) 구현

- 목록/상세 조회 우선
- 삭제/상태변경은 RLS 확인 후 단계적으로

Step 5) Plans CRUD(MVP) 구현

- 목록/생성/수정/삭제
- plan_assignees 연동(담당자 다중 선택)
- 필터/정렬은 최소 기능부터

Step 6) 테스트/검증

- member 계정: 관리자 메뉴 미노출 + /app/admin 직접 접근 차단
- admin/leader 계정: 관리자 메뉴 노출 + 전체 스냅샷 조회 + plans CRUD 가능

────────────────────────────────────────
[구현 가이드(파일 제안)]

- src/lib/auth/getWorkspaceRole.ts (server)
- src/lib/data/adminSnapshots.ts
  - listAllSnapshots({ workspaceId, filters })
  - getSnapshotDetailAdmin({ snapshotId, workspaceId })
- src/lib/data/plans.ts
  - listPlans({ workspaceId, filters })
  - getPlan({ planId })
  - createPlan(...)
  - updatePlan(...)
  - deletePlan(...)
  - assign/unassign assignees via plan_assignees
- src/app/(app)/admin/layout.tsx
  - role guard
- src/app/(app)/admin/snapshots/\*
- src/app/(app)/admin/plans/\*
- SNB 컴포넌트/메뉴 정의 파일(프로젝트에서 찾아 수정)

────────────────────────────────────────
[출력 요구]

1. 변경/생성 파일 목록
2. 각 파일 전체 코드(중간 생략 금지)
3. SNB 섹션 구조 변경 코드(조건부 관리자 섹션 포함)
4. admin route guard 구현 코드
5. Plans CRUD 화면/서버 액션/데이터 레이어 전체
6. 테스트 시나리오(계정별)
   - member: 관리자 메뉴 없음 + 관리자 페이지 접근 차단
   - leader/admin: 관리자 메뉴 노출 + 전체 스냅샷 조회 + plans CRUD 가능
7. RLS 정책 이슈가 발생하면:
   - 어떤 API가 어떤 에러(403 등)를 내는지
   - 필요한 정책(SQL)을 “별도 블록”으로 제안 (즉시 실행은 강요하지 말 것)

[완료 조건]

- workspace_members.role이 admin/leader인 사용자만 관리자 메뉴가 보인다.
- /app/admin/\*\* 는 admin/leader만 접근 가능하다.
- 관리자는 전체 스냅샷을 조회/관리할 수 있다(최소 조회).
- 관리자는 plans를 CRUD할 수 있다(현재 Supabase의 plans/plan_assignees 테이블 기반).
- member는 본인 스냅샷 CRUD만 가능하고, 관리자 기능은 접근/노출 모두 불가하다.
