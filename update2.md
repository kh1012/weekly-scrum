[목표]
“Plans(/app/plans)”와 “All Plans(/app/admin/plans)”에
첨부 캡쳐처럼 **트리 + 간트(월 타임라인)** 형태의 View 모드를 1차로 만든다.

- 좌측: 프로젝트/모듈/기능 단위 트리(그룹)
- 우측: 월이 진행되는 타임라인 + 각 항목의 기간 막대(bar) + 간단 요약
- Plans(일반 멤버): Read-only
- All Plans(관리자: admin/leader): CRUD + 간트에서 바로 생성/기간 조절(드래그 리사이즈)

이번 작업은 “컨셉 구현(MVP)”이 목표다.
시각적으로 완성도 있는 간트까지는 아니어도,
‘동작이 되는 구조’를 먼저 만든다.

구조 완성 후 내 확인한 후에 2차를 개발해줘.

────────────────────────────────────────
[이미지 컨셉 요약(반드시 반영)]

1. 좌측 트리

- 프로젝트 > 모듈 > 기능(Feature) 계층
- 각 노드는 접기/펴기 가능
- 각 기능 row가 우측 타임라인의 한 줄(row)과 1:1 매칭

2. 우측 타임라인(월 단위)

- 상단에 월/주/일(최소: 일 단위 tick + 월 헤더)
- 각 plan은 막대(bar)로 표시(start_date~end_date)
- 막대에는 title 요약(짧게) + stage 뱃지(선택)
- stage별로 색상이 다르게 보이도록(하드코딩 매핑 가능)

3. View 모드 공통

- GNB(기간 범위 선택)와 연동되어 범위가 바뀌면 타임라인이 바뀜
- 상단 Summary Bar로 “현재 범위/필터/검색”이 명확히 보이게

────────────────────────────────────────
[DB 스키마(이미 존재, 변경 금지)]
public.plans

- id uuid PK
- workspace_id uuid
- type public.plan_type default 'feature'
- domain/project/module/feature (feature type이면 모두 필수; CHECK constraint 존재)
- title text not null
- stage text not null
- status text not null default '진행중'
- start_date date null
- end_date date null
- created_by uuid (auth.users FK)
- updated_by uuid (auth.users FK)
- created_at/updated_at + updated_at trigger
  indexes:
- idx_plans_workspace_dates (workspace_id, start_date, end_date)
- idx_plans_define (workspace_id, domain, project, module)

public.plan_assignees

- plan_id uuid (FK plans on delete cascade)
- workspace_id uuid
- user_id uuid (FK auth.users)
- role public.assignee_role
- PK(plan_id, user_id, role)

중요:

- 담당자 연결은 auth.users를 직접 join하지 말고,
  workspace_members JOIN profiles 로 멤버 목록을 가져오고,
  plan_assignees.user_id를 기준으로 display_name을 매핑한다.
  (auth.users 직접 list/join은 피한다)

────────────────────────────────────────
[라우트/권한]

1. /app/plans

- read-only (멤버 포함 전원)
- 간트 View 모드 제공
- 생성/수정/삭제/드래그 리사이즈/간트 클릭 생성 기능 없음

2. /app/admin/plans (All Plans)

- admin/leader만 접근
- 간트 View 모드 제공 + 간트 상호작용 CRUD 제공:
  A) hover → 셀(칸)이 하이라이트
  B) 클릭 → “임시 계획 생성(draft)” (바로 DB insert)
  C) 막대 좌/우 핸들 드래그 → 기간 늘리기/줄이기 (DB update)
  D) 막대 클릭 → 상세 편집 패널(폼) 열기 (기존 폼 재사용/확장)

────────────────────────────────────────
[간트 범위/스케일(필수 결정: MVP)]

- 기본은 “월 단위 + 일 스케일”로 구현한다.
- 범위는 GNB에서 전달되는 start~end를 사용한다.
- 최소 범위: 1개월(예: 12/01~12/31)
- 렌더링:
  - 타임라인 폭 = daysCount \* DAY_WIDTH(px)
  - row 높이 = 32~40px
  - 가로 스크롤 가능
  - 좌측 트리는 sticky

DAY_WIDTH/ROW_HEIGHT는 상수로 시작:

- const DAY_WIDTH = 24
- const ROW_HEIGHT = 36

────────────────────────────────────────
[UI 구성(두 메뉴 공통: View 모드)]

- PlansBoardGanttView (공통 컴포넌트)
  - props:
    - mode: 'readonly' | 'admin'
    - rangeStart: Date
    - rangeEnd: Date
    - plans: PlanWithAssignees[]
    - tree: TreeNode[] (project/module/feature group)
    - onCreateDraftAtCell? (admin only)
    - onResizePlan? (admin only)
    - onOpenPlan? (admin only)
- 좌측: TreePanel (project/module/feature)
- 우측: TimelineGrid
  - Header: Month labels + day ticks
  - Body: rows by feature node
    - bars for plans belonging to that feature node
- 상단: SummaryBar(범위/검색/필터)

────────────────────────────────────────
[데이터 로딩/쿼리 설계(필수)]

1. plans 조회: “범위와 겹치는 plan”을 가져온다(월/범위 공통)

- where:
  - workspace_id = DEFAULT_WORKSPACE_ID
  - start_date <= rangeEnd
  - (end_date is null OR end_date >= rangeStart)
- start_date/end_date null은 “일정 미지정”으로 별도 섹션 처리(또는 간트에 미표시)

2. plan_assignees 조회

- plan_ids 배열로 in 조회
- 이후 members(profiles) 데이터와 매핑하여 display_name을 붙인다.

3. members 목록 조회(표시용)

- workspace_members JOIN profiles 로 가져온다:
  - user_id, display_name, email, role
- 이걸 plan_assignees.user_id → display_name 매핑에 사용한다.

4. 좌측 트리 생성 로직

- plans 중 type='feature'인 것만 기준으로 트리 노드를 만든다.
- 트리 계층:
  - project
    - module
      - feature
- 각 feature leaf node에는 해당 feature의 plans 배열이 매핑된다.
- type != 'feature'인 plan(릴리즈/스프린트 등)은:
  - 상단 “Milestones/Events” 레인(별도 row 그룹)으로 표시하거나
  - 트리 최상단 “Events” 아래로 넣는다(선택)
  - 이번 MVP에서는 “Events 그룹”을 하나 두고 그 안에 title 기준 row로 나열해도 됨.

────────────────────────────────────────
[stage 색상 매핑(필수)]

- stage 텍스트를 기반으로 색상을 매핑하는 유틸을 만든다.
- 예: src/lib/ui/stageColor.ts
- MVP는 하드코딩 맵으로 충분:
  - '컨셉 기획' / '상세 기획' / '디자인' / 'BE 개발' / 'FE 개발' / 'QA' / '릴리즈'
- Unknown stage는 default 색

주의:

- “색상 지정”은 UI 레벨에서만. DB에 색 저장은 이번 단계에서 하지 않는다.

────────────────────────────────────────
[All Plans(관리자) 상호작용 상세]

1. hover 하이라이트

- 타임라인 grid의 특정 row(feature) 위에 마우스를 올리면,
  날짜 칸(cell)이 hover 표시(네모박스)
- hover cell 표시 시 툴팁: “클릭하여 계획 생성”

2. 클릭하여 임시 계획 생성(필수)

- 클릭 시 즉시 DB insert(plans) 한다.
- 생성 규칙(MVP):
  - type='feature'
  - domain/project/module/feature는 해당 row(feature leaf)의 값으로 자동 채움
  - title: '새 계획' (또는 빈값 불가이므로 기본값)
  - stage: 기본 stage (예: '컨셉 기획')
  - status: '진행중'
  - start_date = 클릭한 날짜
  - end_date = start_date + 1~2일 (기본 2일) 또는 start_date와 동일(하루짜리)
  - created_by/updated_by = actor user id (서버에서 강제)
- 생성 직후:
  - 막대(bar) 표시
  - 선택 상태로 만들고, 우측 편집 패널(폼)을 열어 title/stage/status/assignees 수정 가능하게

3. 막대 리사이즈(필수)

- 막대 좌/우 끝에 resize handle
- drag로 날짜 변경:
  - 좌측 handle → start_date 변경
  - 우측 handle → end_date 변경
- 드래그 중 툴팁 표시:
  - “12.08 ~ 12.14 (7d)”
- 드래그 종료 시 server action으로 update
- 제약:
  - end_date < start_date 금지
  - null dates인 plan은 리사이즈 불가(일정 미지정 섹션에서 폼으로만 입력)

4. 막대 이동(Drag move)은 이번 단계 optional

- MVP에서 제외해도 됨. 대신 edit 폼으로 start/end 수정 가능하게만 제공.

5. 선택 삭제

- All Plans에서도 리스트/패널에서 delete 가능(기존 CRUD 유지)
- 간트 상에서 막대 선택 후 delete도 가능하면 좋음(옵션)

────────────────────────────────────────
[폼(입력) 모드도 유지]

- “새로 작성하기”는 기존처럼 입력폼/모달로 생성 가능해야 한다.
- All Plans에서는:
  - (A) 간트 클릭 생성(빠른 생성)
  - (B) “+ 계획 등록”(폼)
    두 경로를 모두 제공한다.
- Plans(일반)에서는 “새로 작성하기” 버튼이 보이면 안 됨(Read-only)

────────────────────────────────────────
[구현 파일 가이드(권장)]

- src/features/plans/gantt/PlansGanttView.tsx (공통 view)
- src/features/plans/gantt/TimelineHeader.tsx
- src/features/plans/gantt/TimelineRow.tsx
- src/features/plans/gantt/PlanBar.tsx
- src/features/plans/gantt/useGanttLayout.ts (date→px 계산)
- src/lib/ui/stageColor.ts
- src/lib/data/plans.ts (기존/확장)
- src/lib/data/planAssignees.ts (기존/확장)
- src/lib/data/members.ts (workspace_members+profiles)
- src/app/(app)/plans/page.tsx (readonly)
- src/app/(app)/admin/plans/page.tsx (admin)
- src/app/(app)/admin/plans/\_actions.ts (create/update/delete + quick-create/resizing)

────────────────────────────────────────
[Server Actions (admin only)]

- createDraftPlanAtCellAction({ date, treeContext })
  - treeContext = { domain, project, module, feature } (leaf row의 값)
- resizePlanAction({ planId, start_date?, end_date? })
- updatePlanAction(formData) / deletePlanAction(planId)
  모든 액션은:
- auth.getUser()로 actor 확인
- getWorkspaceRole로 admin/leader 확인
- workspace_id 강제(DEFAULT_WORKSPACE_ID)
- created_by/updated_by 강제 세팅

────────────────────────────────────────
[중요: 성능/UX MVP 기준]

- 첫 MVP는 “한 달 범위”에서 충분히 빠르게 보여야 한다.
- 렌더 최적화:
  - rows는 leaf(feature) 기준으로만 렌더
  - virtual scroll은 후순위(2차)
- 정확한 드래그 UX보다 “기간이 바뀐다”가 우선.

────────────────────────────────────────
[출력 요구]

1. 변경/생성 파일 목록
2. 각 파일 전체 코드(중간 생략 금지)
3. date→px 계산(레이아웃) 로직 설명
4. plans + plan_assignees + members(profiles) 매핑 로직 설명
5. admin 상호작용(hover/click 생성/resize) 동작 시나리오
6. 테스트 시나리오

- /app/plans: read-only 간트가 범위에 맞게 표시됨
- /app/admin/plans:
  - hover 셀 하이라이트
  - 클릭 → draft plan 생성되고 bar가 생김
  - bar 리사이즈 → 기간 tooltip + DB 반영
  - stage 변경 시 bar 색 변경
  - assignees 연결/표시가 동작(최소: display_name 뱃지)

────────────────────────────────────────
[완료 조건]

- 캡쳐 컨셉과 유사한 “좌 트리 + 우 타임라인” View 모드가 /app/plans, /app/admin/plans 모두에 존재한다.
- /app/plans는 Read-only로만 동작한다.
- /app/admin/plans는 간트 위 상호작용으로 임시 계획 생성 및 기간 리사이즈가 가능하다.
- plan_assignees와 멤버 이름(profiles)이 연결되어, bar 또는 상세 패널에 담당자 표시가 가능하다.

[2차 미션]
1차에서 만든 “트리 + 간트 View”를 기반으로,
실사용 가능한 수준으로 고도화한다.
핵심은 (1) 상호작용 완성도(드래그 이동/멀티 선택/빠른 편집), (2) Flag(마일스톤) 라인, (3) 성능/가독성, (4) 권한/로그/안전장치다.

이번 2차는 “All Plans(관리자)”에서 먼저 완성하고,
“Plans(일반)”은 Read-only로 동일 뷰를 재사용한다.

────────────────────────────────────────
[2차 목표]
A) 간트 상호작용 고도화

- 막대 이동(Drag move)
- 멀티 선택 + 일괄 편집/삭제
- 키보드 단축키(삭제/복제/이동 등, 최소 일부)
- 스냅(일 단위, 옵션으로 주 단위)

B) Custom Flag(마일스톤) 라인(세로선) 완전 통합

- “Sprint 종료/Release 시작/GA” 같은 Flag를 CRUD
- 간트에 세로 기준선 표시 + 라벨/툴팁
- 범위 밖 Flag 처리 + Today 라인

C) 보기/가독성

- 그룹 접기/펼치기 상태 유지(URL or localStorage)
- Stage/Status/Assignee 표시 옵션 토글
- “이벤트성 plan(type != feature)”을 별도 레인으로 정리

D) 성능/안정성

- 가로 타임라인 가상화(또는 최소 렌더 범위 최적화)
- row 가상 스크롤(react-virtual 등) 또는 수동 windowing
- 드래그 중 optimistic UI + 실패 롤백
- 서버 액션 호출 디바운스/배치 업데이트

────────────────────────────────────────
[기능 상세 요구사항]

[요구사항 1] Drag Move(막대 이동)

- 막대를 드래그하면 start/end가 함께 이동한다.
- 이동 중 툴팁:
  - “12.08 ~ 12.14 (7d)”
- 스냅:
  - 기본: 1일 단위 스냅
  - 옵션: Shift 누르면 주 단위 스냅(월요일 기준)
- 드래그 종료 시 update 실행
- 제약:
  - end_date < start_date 금지
  - 범위 밖 이동은 허용하되, 화면은 자동 스크롤(가능하면)
- 구현 포인트:
  - PlanBar에 drag 핸들(전체 바)
  - resize 핸들(좌/우)은 기존 유지
  - drag state: dragging, resizing-left, resizing-right 구분

[요구사항 2] 멀티 선택 + Bulk Actions

- 체크박스가 아니라 “Shift 클릭”으로 범위 선택 가능하면 좋음(옵션)
- 기본은:
  - Cmd/Ctrl 클릭으로 다중 선택
  - Shift 클릭으로 연속 선택(같은 row 내 또는 전체)
- 상단 또는 우측에 Bulk Action Bar:
  - 선택 N개 표시
  - Bulk stage 변경
  - Bulk status 변경
  - Bulk delete
  - Bulk assign(담당자 추가/제거)
- Bulk delete는 confirm 필수

[요구사항 3] Quick Edit(인라인 편집)

- 막대 더블클릭 또는 Enter로 인라인 편집:
  - title
  - stage
  - status
- 상세 패널(기존 폼)은 유지하되,
  “빠른 변경”은 간트에서 처리 가능하게

[요구사항 4] Custom Flag(마일스톤) 완전 통합

- 1. plan_flags 테이블 기반 CRUD UI
- 2. 간트 overlay에 세로선 표시
- 3. Flag 라벨 겹침 처리:
  - 겹치면 라벨 숨기고 hover tooltip만
- 4. Today 라인 표시(옵션)
- 5. Flag 클릭 시 편집 패널 오픈

[요구사항 5] 뷰 옵션/가독성 개선

- 상단 View 옵션 토글:
  - “담당자 표시 on/off”
  - “stage 뱃지 on/off”
  - “status 뱃지 on/off”
  - “밀도(density)”: compact/comfortable
- 트리 접기/펼치기 상태 유지:
  - URL 파라미터 또는 localStorage
- “일정 미지정” 항목:
  - 별도 섹션으로 분리 + 바로 날짜 입력 폼

[요구사항 6] 성능(큰 데이터 대비)

- 18명 팀에서도 plan이 쌓이면 커진다.
- 최소 목표:
  - 1개월(30~31일) 기준 300~500 plan에서도 버벅임 최소화
- 방법(가능한 것부터):
  1. rows(leaf)만 렌더 + memo 최적화
  2. 타임라인 헤더/그리드 분리 렌더
  3. row virtualization(react-virtual) 도입(권장)
  4. 가로 스크롤 시 “보이는 날짜 구간만” 렌더링(고급, 후순위)
