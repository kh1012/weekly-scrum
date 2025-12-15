[미션]
“개인공간 > 스냅샷 관리(Manage)” UI를
Supabase 기반의 개인 데이터 뷰/편집/신규작성 플로우로 완성한다.

이번 단계의 핵심은:

- 내가 지금까지 작성한 스냅샷을 “주차(ISO year/week)별로 조회”할 수 있어야 하고,
- 특정 주를 선택하면 해당 주의 스냅샷 목록 + 메타데이터 요약이 보이며,
- 우측 상단 버튼으로 “주차별 편집하기(업데이트)” / “새로 작성하기(신규 등록)” 흐름이 분리되어야 한다.

────────────────────────────────────────
[전제/현재 상태]

- Next.js App Router
- Supabase Auth 로그인 동작
- DB 테이블 존재:
  - snapshots (workspace_id, author_id, week_start_date, title, …)
  - snapshot_entries (snapshot_id, workspace_id, author_id, domain/project/module/feature, progress 등 …)
  - snapshot_meta_options (옵션 데이터 존재)
  - profiles, workspace_members 존재
- 기존 작성 UI(카드목록/편집폼/미리보기/데이터 불러오기 등)가 이미 구현되어 있고, 정적 data/ 기반이었음
- 이번 작업에서 기존 UI를 최대한 재사용하고, persistence를 Supabase로 전환한다.

────────────────────────────────────────
[요구사항 1: 주차(ISO) 기반 메인 화면]
A) 라우트

- /app/manage/snapshots (메인: 주차별 조회 + 주 선택 + 스냅샷 목록)
- /app/manage/snapshots/[year]/[week]/edit (주차별 편집하기 = 업데이트 플로우)
- /app/manage/snapshots/[year]/[week]/new (새로 작성하기 = 신규 등록 플로우)

B) 메인 화면 레이아웃(/app/manage/snapshots)

1. 좌측(또는 상단) “연도 + ISO 주차 선택 UI”

- year select (기본 올해)
- week select (1~53)
- 선택 UI 우측에 기간 표시(예: “12.01 ~ 12.07”)
- ISO week 기준: 월요일 시작, 일요일 종료
- 파일: src/lib/date/isoWeek.ts 유틸로 날짜 범위 계산

2. 중앙(또는 메인) “스냅샷 목록”

- 선택한 주차(year/week)의 “내 스냅샷”을 목록화
- 뷰 토글:
  - Pinterest 스타일 카드 그리드(기본)
  - 리스트 뷰(토글로 전환)
- 각 스냅샷 카드/행에는 최소:
  - title(없으면 기본 타이틀 생성)
  - created_at
  - entries 개수
  - (옵션) 프로젝트/모듈/기능 요약 배지

3. 우측 사이드 패널 “주차 메타데이터 요약”

- 기본은 접힘(collapsed) 상태
- “더보기” 클릭 시 확장(expanded)
- 표시 메타데이터(선택 주차의 전체 snapshot_entries 집계):
  - 프로젝트 갯수(고유 project count)
  - 모듈 갯수(고유 module count)
  - 기능 갯수(고유 feature count)
  - 평균 진행률(진행률 필드가 존재할 경우 평균; 없으면 계산 불가 안내)
  - (옵션) domain 분포
- 구현 포인트:
  - Week 선택 시 서버에서 해당 주차의 entries를 가져와 집계
  - 집계 유틸: src/lib/stats/snapshotWeekStats.ts

4. 우측 상단 버튼 2개(메인 화면 공통)

- “주차별 편집하기” 버튼
- “새로 작성하기” 버튼
- 동작:
  - 주차가 선택되어 있어야 활성화됨
  - 클릭 시 각각 아래로 이동:
    - /app/manage/snapshots/[year]/[week]/edit
    - /app/manage/snapshots/[year]/[week]/new

────────────────────────────────────────
[요구사항 2: ‘주차별 편집하기’ 화면 (업데이트 플로우)]
A) 라우트

- /app/manage/snapshots/[year]/[week]/edit

B) 화면 구성(기존 편집 UI 그대로 재사용)

- 좌측: 카드 목록(=snapshot_entries 목록)
- 가운데: 편집 폼(카드/메타/본문 편집)
- 우측: 미리보기(plain text/2열/3열 토글 등 기존 기능 유지)

C) 데이터 로딩 규칙

- 이 화면은 “해당 주차의 내 기존 스냅샷 데이터”를 기반으로 편집한다.
- 주차에 스냅샷이 여러 개 존재할 수 있으므로:
  - 상단에 “스냅샷 선택 드롭다운” 또는 좌측 상단에 “스냅샷 목록 선택”을 제공
  - 기본 선택은 최신(updated_at desc)
- 선택된 snapshot의 entries를 로드하여 편집 UI에 바인딩

D) 저장 버튼 문구(필수)

- 최종 저장 버튼 텍스트는 반드시: “업데이트하기”
- 동작:
  - snapshots(필요 시 title/status) update
  - snapshot_entries upsert + 삭제 반영(정책 허용 시)
- 저장은 서버 액션으로만 수행

────────────────────────────────────────
[요구사항 3: ‘새로 작성하기’ 화면 (신규 등록 플로우)]
A) 라우트

- /app/manage/snapshots/[year]/[week]/new

B) 시작 옵션(필수)
화면 진입 시, 기존 UI를 활용해 시작 방식 2가지 옵션을 제공한다.

- 옵션 1) “데이터 불러오기”
  - JSON 붙여넣기(기존 파서가 있으면 재사용) 또는 기존 불러오기 UI 그대로
  - 미리보기 후 entries로 생성
- 옵션 2) “새로 작성하기”
  - 빈 상태에서 entry를 추가하며 작성

C) 편집 UI 구성

- ‘주차별 편집하기’와 동일하게 3열 구성(카드목록/편집폼/미리보기)을 재사용
- 단, 초기 데이터가 없으므로:
  - 스냅샷 컨테이너(snapshots row)를 먼저 생성하거나,
  - 화면 내에서 임시로 작성 후 “신규 등록하기” 시점에 스냅샷 + 엔트리 생성
  - MVP는 구현이 쉬운 방향으로 선택하되, 저장 실패 케이스를 안전하게 처리

D) 저장 버튼 문구(필수)

- 최종 저장 버튼 텍스트는 반드시: “신규 등록하기”
- 동작:
  - snapshots row 생성(create) + entries 생성
  - 이미 같은 주차에 기존 스냅샷이 있어도 신규로 추가 생성 가능(여러 개 허용)
- 저장은 서버 액션으로만 수행

────────────────────────────────────────
[요구사항 4: 데이터 조회/집계 (주차별 조회가 핵심)]
A) 메인 화면에서 필요한 쿼리

1. 주차별 스냅샷 목록

- 내 snapshots where author_id=auth.uid and workspace_id=DEFAULT and week_start_date=해당 주 weekStart
- 정렬: updated_at desc

2. 주차 메타데이터 집계

- 해당 주차의 snapshot_entries 전체를 가져와서
  - unique project/module/feature count
  - avg progress
- 서버에서 집계 후 내려주기(RSC) 권장

B) ISO 주차 선택 UI에서 weekStart를 계산해 쿼리에 사용

- year/week → weekStartDate(date)
- 기존 snapshots 테이블에 year/iso_week 컬럼이 없다면:
  - week_start_date 기반으로 매칭
  - (추후 마이그레이션으로 year/iso_week 추가 가능하나 이번 단계는 필수 아님)

────────────────────────────────────────
[요구사항 5: 구현 방식(서버 액션/데이터 레이어)]

1. Data layer

- src/lib/data/mySnapshots.ts
  - listMySnapshotsByWeek({ workspaceId, userId, weekStartDate })
  - getSnapshot({ snapshotId, workspaceId, userId })
- src/lib/data/mySnapshotEntries.ts
  - listEntries({ snapshotId, workspaceId, userId })
  - upsertEntries(...)
  - deleteEntriesByIds(...)
- src/lib/stats/snapshotWeekStats.ts
  - computeWeekStats(entries): { projectCount, moduleCount, featureCount, avgProgress }

2. Server actions

- src/app/(app)/manage/snapshots/\_actions.ts
  - updateSnapshotAndEntries({ snapshotId, payload }) // 업데이트하기
  - createSnapshotAndEntries({ year, week, payload }) // 신규 등록하기
  - importToNewSnapshot({ year, week, importedPayload }) // 데이터 불러오기 → 신규 생성

3. 공통: workspaceId 강제

- DEFAULT_WORKSPACE_ID=00000000-0000-0000-0000-000000000001

4. 공통: 인증 강제

- action 내부에서 supabase.auth.getUser()로 user 확인
- user null이면 throw

────────────────────────────────────────
[요구사항 6: UI 상세(기존 UI 재사용 원칙)]

- 기존 카드 편집 UI는 가능한 그대로 사용하되, 저장/로드만 Supabase로 교체
- 목록(Pinterest/리스트) 뷰는 새로 구현
- 우측 메타데이터 패널은 새로 구현
  - 기본 접힘, 더보기로 확장
- “주차별 편집하기 / 새로 작성하기” 버튼은 메인 화면 우측 상단 고정 영역에 배치

────────────────────────────────────────
[단계별 작업 순서(필수, 순서 고정)]
Step 1) isoWeek 유틸 구현(기간 표시까지)
Step 2) /app/manage/snapshots 메인 화면 생성(주차 선택 UI + 기간 표시)
Step 3) 선택 주차의 내 snapshots 목록 조회 + Pinterest/리스트 토글 구현
Step 4) 선택 주차의 entries를 가져와 우측 메타데이터 집계/표시(접힘/더보기)
Step 5) 우측 상단 버튼 2개 구현 + 라우팅 연결(edit/new)
Step 6) /edit 화면 구현: 기존 편집 UI 재사용 + “업데이트하기” 버튼으로 저장 연결
Step 7) /new 화면 구현: 시작 옵션 2개(불러오기/새로작성) + “신규 등록하기” 저장 연결
Step 8) 새로고침/재접속 시에도 데이터 유지 검증

────────────────────────────────────────
[출력 요구]

1. 변경/생성 파일 목록
2. 각 파일 전체 코드(중간 생략 금지)
3. 주차 선택 → 목록/메타 → edit/new 흐름 데이터 플로우 설명
4. 테스트 시나리오

- 주 선택 → 목록 표시 확인
- Pinterest/리스트 토글 확인
- 메타 패널 접힘/더보기 확인
- edit에서 수정 후 “업데이트하기” 저장 → 새로고침 유지 확인
- new에서 “신규 등록하기” 저장 → 목록에 추가 확인
- (옵션) 불러오기 → 미리보기 → 신규 생성 확인

[완료 조건]

- 주차(ISO year/week)를 선택하면 기간 표시와 함께 해당 주차의 “내 스냅샷”이 목록화된다.
- 목록은 Pinterest/리스트 토글이 가능하다.
- 우측 메타데이터 패널에서 프로젝트/모듈/기능/평균진행률이 접힘/확장 형태로 표시된다.
- “주차별 편집하기”는 기존 데이터 기반으로 3열 편집 화면에서 수정 후 “업데이트하기”로 저장된다.
- “새로 작성하기”는 불러오기/새로작성 2옵션으로 시작하며, “신규 등록하기”로 저장된다.
- Supabase에 영속 저장되어 새로고침/재접속에도 유지된다.
