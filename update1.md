[미션]
관리자 카테고리의 “All Snapshots / All Plans / Dashboard” UI를 완성한다.
특히 All Snapshots에서 발생 중인 PGRST200 에러를 1순위로 해결하고,
관리자 관점에서 “전체 스냅샷을 검색/필터/주차·범위(GNB) 연동”하여 목록/편집/삭제까지 가능하게 만든다.

────────────────────────────────────────
[현재 문제(1순위 버그)]
All Snapshots 진입 시 아래 에러로 데이터 로드 실패:
[AdminSnapshots] Failed to fetch snapshots: {
code: 'PGRST200',
details: "Searched for a foreign key relationship between 'snapshots' and 'created_by' in the schema 'public', but no matches were found.",
message: "Could not find a relationship between 'snapshots' and 'created_by' in the schema cache"
}

[원인 가정(필수로 확인 후 수정)]

- Supabase select에서 created_by에 대해 관계 조인(select 확장)을 시도하고 있는데,
  public.snapshots에 created_by 컬럼 FK 관계가 없거나, 컬럼명이 created_by가 아니라 author_id일 가능성이 높다.
- PostgREST는 FK 관계가 없으면 join 문법(created_by(...))을 지원하지 않아 PGRST200이 발생한다.

[수정 요구(즉시)]

1. All Snapshots 쿼리에서 ‘created_by 관계 조인’을 제거하여 목록 로딩이 무조건 되도록 수정한다.
2. 작성자 표시가 필요하다면 auth.users join이 아니라 profiles를 통해 해결한다.
   - snapshots.author_id(또는 created_by) ↔ profiles.user_id 관계를 사용
   - FK가 없다면 일단 작성자 표시는 2차로 미룬다(목록 로딩 우선)
3. PGRST200이 재발하지 않도록 쿼리/타입을 정리한다.

────────────────────────────────────────
[관리자 권한/접근]

- /app/admin/\*\* 는 workspace_members.role in ('admin','leader')만 접근 가능
- server guard(getWorkspaceRole) 필수
- member 접근 시 /app로 redirect 또는 403

────────────────────────────────────────
[요구사항 A: Admin Dashboard의 GNB 제한]

- 관리자 카테고리의 “Dashboard”에서는 GNB가 아래만 남아야 한다:
  - 뒤로가기(Back)
  - 프로필 정보(사용자)
- 그 외 GNB 요소(주차 선택, 범위 선택, 검색, 필터 등)는 모두 숨김
- 구현 방식:
  - GNB 컴포넌트가 feature flags / page context prop을 받게 하여,
    admin dashboard에서는 최소 모드(minimal)로 렌더링되도록 한다.

────────────────────────────────────────
[요구사항 B: All Snapshots / All Plans는 GNB 연동(전체 기능 ON)]
All Snapshots(/app/admin/snapshots)와 All Plans(/app/admin/plans)는
GNB의 기능이 모두 연동되어 데이터가 바뀌어야 한다.

GNB 연동 요소(반드시 동작):

1. 주차 선택(ISO year/week) + 기간(range) 표시
2. 범위 선택(기간 범위; 예: last 4 weeks / custom range 등 현재 프로젝트 GNB가 제공하는 범위)
3. 검색(search query)
4. 필터(filters)

동작 원칙:

- GNB의 상태는 URL search params로 동기화한다.
  - 예: ?year=2025&week=50&range=month&query=...&status=...&project=...
- 페이지는 search params를 기반으로 server-side fetch를 수행한다(RSC 권장).
- 최상단에 현재 상태(검색/필터/주차/범위)를 “한눈에” 식별할 수 있는 Summary Bar를 반드시 표시한다.

────────────────────────────────────────
[요구사항 C: All Snapshots 기능 상세]
라우트: /app/admin/snapshots

1. 리스트 형태로 전체 스냅샷 조회

- 기본 뷰는 리스트(테이블 또는 리스트 카드)
- 컬럼/항목 최소:
  - week_start_date(또는 year/week 계산값)
  - title
  - author(가능하면 display_name; 안되면 author_id)
  - status(draft/published)
  - updated_at
  - entries count(가능하면)
- 정렬: 최신 주차/최근 업데이트 우선

2. 검색/필터/주차/범위(GNB) 연동

- 검색: title/content(가능하면), 최소는 title
- 필터: status, author, project/module/feature(가능한 범위)
- 주차: 선택 주차(year/week)에 해당하는 스냅샷만
- 범위: 선택 범위(start~end)에 해당하는 스냅샷만

3. 최상단 Summary Bar(필수)

- 현재 적용 중인 조건을 텍스트로 명확히 표시:
  - “주차: 2025-W50 (12.08~12.14)”
  - “범위: 2025.12.01 ~ 2025.12.31”
  - “검색: 'formula tracer'”
  - “필터: status=published, project=MOTIIV …”
- “필터 초기화” 버튼 제공(옵션)

4. 선택 삭제(Bulk Delete)

- 리스트에 체크박스 제공(다중 선택)
- “선택 삭제” 버튼
- 삭제 전 confirm
- 삭제 실행은 server action으로만
- RLS 정책상 불가하면:
  - 버튼 비활성/숨김 + “권한 정책상 삭제 불가” 안내

5. 개별 선택 후 수정(Edit)

- 리스트 항목 클릭 → 상세/편집 화면으로 이동
- /app/admin/snapshots/[snapshotId]/edit
- 편집 화면은 “개인공간(Manage) 편집폼”을 그대로 재사용한다:
  - 좌측 카드 목록
  - 가운데 편집 폼
  - 우측 미리보기
- 단, 저장 버튼 텍스트는 admin 편집에서는 “업데이트하기”(고정)
- 저장 시 snapshots + snapshot_entries를 업데이트한다.
- 주의: 기존 개인공간 편집폼이 “내 데이터(author_id=auth.uid())” 전제로 묶여있을 수 있다.
  - admin 편집에서는 snapshotId 기반으로 데이터를 로딩하도록 추상화하여 재사용 가능하게 만든다.
  - 예: 편집폼 컴포넌트가 “mode = self/admin”을 받고,
    데이터 로딩/저장 함수가 snapshotId를 기준으로 동작하도록 분리한다.

6. All Snapshots에서 먼저 해결해야 할 것(에러)

- PGRST200 해결 우선:
  - created_by join 제거
  - (2차) profiles로 author 표시 추가

────────────────────────────────────────
[요구사항 D: All Plans 기능 상세]
라우트: /app/admin/plans

- 기존 합의대로:
  - GNB 연동(주차/범위/검색/필터)
  - 월 범위 조회(YYYY-MM) + 필터/그룹 + CRUD
- All Plans 역시 최상단 Summary Bar로 현재 조건 표시(주차/범위/검색/필터/월)
- Dashboard와 달리 GNB 기능 전체 노출

────────────────────────────────────────
[구현 가이드(중복 최소화)]

1. GNB 상태는 공통 훅/유틸로 통일

- src/lib/ui/gnbParams.ts
  - parseGnbParams(searchParams)
  - buildGnbQuery(params)
- 관리자 페이지는 이 값을 그대로 사용

2. Summary Bar 공통 컴포넌트화

- src/components/SummaryBar.tsx
- 입력: { year, week, rangeStart, rangeEnd, query, filters } → 사람이 읽기 좋은 문자열로 표시

3. 편집폼 재사용 구조화

- 기존 개인공간 편집 UI를 “스냅샷 편집기” 컴포넌트로 분리:
  - src/features/snapshots/SnapshotEditor.tsx
  - props:
    - mode: 'self' | 'admin'
    - snapshotId
    - initialWeekContext(optional)
    - onSaveLabel: '업데이트하기' | '신규 등록하기'
- self/admin에 따라:
  - 데이터 로딩 쿼리만 달라짐(권한이 다름)
  - UI 구성(3열)은 동일

4. 데이터 fetch 레이어

- src/lib/data/adminSnapshots.ts
  - listSnapshots({ workspaceId, gnbParams }) // 주차/범위/검색/필터 적용
  - getSnapshotDetail({ snapshotId, workspaceId })
  - updateSnapshot({ snapshotId, payload })
  - deleteSnapshotsBulk({ snapshotIds })
- join을 쓰려면 FK가 있어야 하므로:
  - (1차) join 없이 list
  - (2차) profiles join로 display_name 붙이기

────────────────────────────────────────
[단계별 작업 순서(필수, 순서 고정)]
Step 1) PGRST200 버그 수정

- All Snapshots 쿼리에서 created_by join 제거 → 목록 로드 성공 확인

Step 2) Admin Dashboard GNB 최소 모드 적용

- 뒤로가기/프로필만 남기도록 렌더 조건 추가

Step 3) All Snapshots: GNB search params 연동 + Summary Bar 표시

- 주차/범위/검색/필터 값이 URL로 반영되고, 화면에 “현재 조건”이 표시되어야 함

Step 4) All Snapshots: 리스트 UI + 선택 삭제 구현

- 체크박스 + bulk delete server action
- 성공 후 목록 리프레시

Step 5) All Snapshots: 편집 라우트 추가 + 편집폼 재사용

- /app/admin/snapshots/[id]/edit
- SnapshotEditor 재사용(3열)
- 저장 버튼 “업데이트하기”

Step 6) All Plans: 동일한 GNB 연동 + Summary Bar 확인

- 기존 plans CRUD는 유지하되, GNB 연동 누락된 부분 보완

────────────────────────────────────────
[출력 요구]

1. 변경/생성 파일 목록
2. 각 파일 전체 코드(중간 생략 금지)
3. PGRST200 원인/수정 전후 쿼리 비교(간단)
4. GNB 연동 방식(어떤 params를 쓰는지) 문서화
5. Summary Bar 표시 예시(주차/범위/검색/필터)
6. 테스트 시나리오

- admin/leader로 All Snapshots 접근 → 목록 로드(PGRST200 없음)
- 주차/범위/검색/필터 변경 → URL + Summary Bar 동기화
- 다중 선택 삭제 → 목록 반영
- 항목 편집 진입 → 개인공간 편집폼과 동일 UI → 업데이트 저장 성공
- Dashboard에서는 GNB 최소 모드만 노출
- member는 /app/admin 접근 차단

────────────────────────────────────────
[완료 조건]

- All Snapshots에서 PGRST200이 해결되어 데이터가 로드된다.
- All Snapshots는 리스트 + GNB(주차/범위/검색/필터) 연동 + Summary Bar + 선택 삭제 + 편집(개인공간 폼 재사용)이 동작한다.
- Admin Dashboard는 GNB 최소 모드(뒤로가기/프로필만)로 렌더된다.
- All Plans는 GNB 기능 전체 연동이 유지/보완된다.
