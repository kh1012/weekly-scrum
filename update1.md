[프로젝트 작업 지시: Admin > Plans (일정표) UI + CRUD + 필터/그룹 + 권한]
아래 Supabase 스키마(실제 테이블 정의)를 기준으로,
관리자(admin/leader)만 접근 가능한 “일정표(Plans)” 기능을 Next.js(App Router)에서 구현한다.

────────────────────────────────────────
[DB 스키마 (기준, 변경 금지)]

1. public.plans

- id uuid PK
- workspace_id uuid (FK workspaces)
- type public.plan_type default 'feature' // feature 또는 이벤트성(릴리즈/배포 등) 타입 존재
- domain text null
- project text null
- module text null
- feature text null
- title text not null
- stage text not null
- status text not null default '진행중'
- start_date date null
- end_date date null
- created_by uuid not null (FK auth.users)
- updated_by uuid not null (FK auth.users)
- created_at timestamptz default now()
- updated_at timestamptz default now()
- CHECK: type='feature'이면 domain/project/module/feature 전부 NOT NULL 이어야 함
- indexes:
  - idx_plans_workspace_dates (workspace_id, start_date, end_date)
  - idx_plans_define (workspace_id, domain, project, module)
- trigger: trg_plans_updated_at

2. public.plan_assignees

- plan_id uuid (FK plans on delete cascade)
- workspace_id uuid (FK workspaces)
- user_id uuid (FK auth.users)
- role public.assignee_role not null
- PK(plan_id, user_id, role)

중요:

- plans.created_by/updated_by는 auth.users FK이므로,
  앱에서 insert/update 시 반드시 user.id를 넣어야 한다.
- feature type plan은 domain/project/module/feature가 모두 필수이며,
  이벤트성 plan(type != 'feature')은 title만 있어도 된다(others nullable).

────────────────────────────────────────
[목표]

1. 관리자(admin/leader)만 접근 가능한 “Admin > Plans” 메뉴/페이지 구현
2. 월 범위 기반 뷰(초기 MVP는 ‘리스트 + 월 필터’로 시작) + 필터/그룹
3. Plans CRUD
4. plan_assignees 관리(담당자 다중 지정)
5. 권한/보안: UI 숨김 + route guard + RLS 준수

────────────────────────────────────────
[권한/접근 제어]

- workspace_members.role in ('admin','leader')만:
  - /app/admin/plans 접근 가능
  - plans create/update/delete 가능
- member는:
  - A안(기본): plans 조회만 가능(단, admin 영역 접근은 차단)
  - 즉, 실제로는 admin/leader만 쓴다고 가정하고 구현하되, RLS가 select를 허용하면 조회 컴포넌트는 재사용 가능하도록 설계

필수 구현:

- 서버에서 role 체크(getWorkspaceRole)로 /app/admin/\*\* 가드
- role이 admin/leader가 아니면 /app로 redirect 또는 403 페이지

────────────────────────────────────────
[라우트/화면 구성]

1. /app/admin/plans

- 상단: 월 범위 선택(YYYY-MM) + 보기 모드 토글(리스트/간트는 간트는 2단계)
- 필터 패널:
  - domain / project / module / feature
  - status(진행중/완료/보류 등)
  - stage
  - assignee(담당자 user)
  - type(feature vs other)
- 그룹 토글(Group by):
  - 프로젝트별 / 모듈별 / 개인별 / 기능별
- 리스트 뷰(현 시점 포함):
  - “현재 진행중(기본)” 섹션 + “이번 달” 섹션 + “다가오는” 섹션(가능하면)
  - 최소 MVP는 “선택 월에 걸치는 plan” 목록만 보여도 됨
- “+ 계획 등록” 버튼(생성)

2. /app/admin/plans/new (또는 모달/사이드패널)

- plan 생성 폼
- 필수 입력:
  - type
  - title
  - stage
  - status
  - start_date, end_date(간트/월 뷰에 필요, 이벤트성은 null 허용)
  - feature type이면 domain/project/module/feature 필수(체크 제약 준수)
- assignees(복수 선택) + role 지정
- 저장 시:
  - plans insert + plan_assignees insert
  - created_by/updated_by = current user id

3. /app/admin/plans/[id]/edit (또는 상세 패널)

- plan 수정 폼
- 저장 시:
  - plans update(updated_by=current user id)
  - plan_assignees는 diff 방식으로 upsert/delete

4. /app/admin/plans/[id]

- 상세 보기(옵션)
- 빠른 상태 변경(status/stage) 가능하면 제공

────────────────────────────────────────
[데이터 조회 로직(월 범위)]
월(YYYY-MM)을 선택하면 그 월에 “겹치는(plan overlap)” 계획을 가져온다.

- 예: 12월 뷰면 12/01~12/31 범위와 겹치는 plan:
  - start_date <= monthEnd AND (end_date is null OR end_date >= monthStart)
- start_date/end_date가 null인 경우:
  - 리스트 하단 “일정 미지정” 섹션으로 분리 표시

주의:

- idx_plans_workspace_dates 인덱스를 활용하도록 where절을 구성

────────────────────────────────────────
[서버 액션/데이터 레이어]
반드시 Server Actions 또는 Route Handler로만 쓰기 수행(클라이언트 direct write 금지).

1. src/lib/data/plans.ts

- listPlansForMonth({ workspaceId, monthStart, monthEnd, filters })
- getPlan({ workspaceId, planId })
- createPlan({ workspaceId, payload, createdBy })
- updatePlan({ workspaceId, planId, payload, updatedBy })
- deletePlan({ workspaceId, planId })

2. src/lib/data/planAssignees.ts

- listAssignees({ workspaceId, planId })
- replaceAssignees({ workspaceId, planId, assignees[], actorUserId })
  - 기존 레코드 삭제 후 insert OR diff upsert(선호: diff)
  - PK(plan_id, user_id, role) 준수

3. src/app/(app)/admin/plans/\_actions.ts

- createPlanAction(formData)
- updatePlanAction(formData)
- deletePlanAction(planId)
- 모두 내부에서:
  - auth.getUser()로 actor 확인
  - getWorkspaceRole로 admin/leader 검증
  - workspaceId 강제(DEFAULT_WORKSPACE_ID)
  - created_by/updated_by 세팅

────────────────────────────────────────
[멤버/담당자 선택을 위한 유저 목록]
auth.users를 직접 list 하는 대신,
workspace_members JOIN profiles 로 “워크스페이스 멤버 목록”을 가져와
assignee 선택 옵션으로 사용한다.

- src/lib/data/members.ts
  - listWorkspaceMembers({ workspaceId }) -> [{ user_id, display_name, email, role }]

────────────────────────────────────────
[폼 검증(필수)]

- type === 'feature'이면 domain/project/module/feature 필수
- status/stage는 빈 값 불가
- start_date/end_date는:
  - 둘 다 입력 권장
  - end_date < start_date면 에러
- created_by/updated_by는 서버에서 강제 세팅(클라이언트 입력 무시)

────────────────────────────────────────
[UI 구현 디테일(MVP 우선순위)]
MVP 1차(이번 PR에서 반드시 끝낼 것)

- /app/admin/plans 진입 가능(가드 포함)
- 월 선택 + 월 overlap 기준 목록 조회
- 필터(최소: project/module/status/type)
- 생성/수정/삭제 CRUD
- assignees 지정/수정 가능
- “일정 미지정” 섹션 표시

MVP 2차(후속)

- 간트 뷰(막대형)
- 드래그 리사이즈
- Custom Flag(태그) 기능

────────────────────────────────────────
[출력 요구]

1. 변경/생성 파일 목록
2. 각 파일 전체 코드(중간 생략 금지)
3. 월 overlap 쿼리 로직 설명 + null date 처리 방식
4. form validation 규칙 정리
5. 테스트 시나리오

- leader/admin 계정으로 /app/admin/plans 접근 가능
- 월 선택 후 목록 조회 확인
- feature type plan 생성 시 domain/project/module/feature 없으면 저장 실패(프론트 validation + DB check)
- assignees 2명 이상 지정 가능
- 수정 시 updated_by 변경 확인
- 삭제 시 plan_assignees cascade 삭제 확인
- member 계정은 /app/admin 접근 차단

────────────────────────────────────────
[완료 조건]

- 현재 스키마(plans, plan_assignees)를 그대로 사용하여 Admin > Plans가 동작한다.
- admin/leader만 plans CRUD가 가능하다(서버 가드 + RLS 준수).
- 월 범위(YYYY-MM) 기반으로 계획을 조회하고, 필터/그룹(최소 일부)이 가능하다.
- 생성/수정/삭제 시 created_by/updated_by가 올바르게 채워진다.
- feature type check constraint를 위반하지 않는다.
