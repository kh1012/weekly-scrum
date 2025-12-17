[상황]
현재 Plans UI는 API 즉시 저장 방식이며, 일부는 임시 데이터(local draft)로 바꾸다 중간에 섞여버렸다.
이 혼재 상태 때문에 새로운 Gantt 인터랙션(드래그 생성/이동/겹침 lane)이 구현이 어렵다.

[목표]
Feature(type='feature') 플랜만 대상으로, Draft-first 방식의 Gantt UI를 새로 구현한다.
모든 편집/생성/이동/삭제는 로컬 Draft에서만 일어나며, "Commit(저장)" 버튼 클릭 시에만 Supabase RPC로 벌크 업서트한다.
추가로 최소 충돌 방지를 위해, 편집 시작 시 Workspace 단위로 "Edit Lock(점유)"를 걸어서
다른 편집 권한자가 동시 편집을 못 하도록 막고, 읽기 전용으로만 보게 한다.

======================================================== 0) 반드시 지킬 원칙 (혼재 방지)
========================================================

1. UI는 Draft 상태만 렌더링한다. 서버 데이터는 (초기 로딩 -> Draft hydrate) 용도.
2. 사용자가 편집하는 동안 Supabase API 호출 금지 (예외: Lock heartbeat/lock 조회는 허용).
3. Commit 버튼에서만 벌크 업서트 RPC 호출. 성공 시 Draft clean.
4. 기존 즉시 저장 코드/훅은 신규 Gantt 페이지에서 절대 사용하지 않는다. 충돌 파일은 격리/제거한다.

========================================================

1. # DB / API (Supabase RPC)

- plans 테이블에 client_uid(text) + unique(workspace_id, client_uid) 인덱스가 있다.
- Commit RPC: public.upsert_feature_plans_bulk(jsonb)
  payload:
  {
  "workspace_id": "<uuid>",
  "plans": [
  {
  "clientUid": "local-uuid",
  "domain": "Frontend",
  "project": "MOTIIV",
  "module": "Spreadsheet",
  "feature": "Rich Note",
  "title": "드래그 선택 UX 개선",
  "stage": "FE 개발",
  "status": "진행중",
  "start_date": "2025-12-16",
  "end_date": "2025-12-20",
  "assignees": [{"userId":"..","role":"dev"}],
  "deleted": false
  }
  ]
  }
- Lock RPC:
  - try acquire: public.try_acquire_workspace_lock(workspace_id, ttlSeconds)
  - heartbeat: public.heartbeat_workspace_lock(workspace_id, ttlSeconds)
  - release: public.release_workspace_lock(workspace_id)
  - status: public.get_workspace_lock(workspace_id)

======================================================== 2) "Edit Lock(점유)" 기능 (최소 컨플릭 방지)
========================================================

- 편집 권한자(약 4명)가 동시에 편집하지 않게 workspace 단일 락을 쓴다.
- UX 요구:
  A) /plans/gantt 진입 시 기본은 읽기 전용
  - 상단에 "작업 시작" 버튼
  - 현재 락 상태 표시: "현재 작업 중: <이름> (만료까지 n초)" 또는 "편집 가능"
    B) "작업 시작" 클릭:
  - 락 획득 성공: 편집 활성화 + "현재 작업 중: 나" + heartbeat 시작
  - 락 실패: 경고 토스트/모달
    "현재 <이름>님이 작업 중입니다. 완료(저장/이탈) 전까지 편집 불가. 주의하세요!"
    C) heartbeat:
  - 10~15초마다 heartbeat 갱신
  - visibilitychange/blur 시에도 보수적으로 갱신
    D) 종료:
  - Commit 성공 시 release 호출
  - 사용자가 "작업 종료" 버튼(또는 Cmd+K 팔레트)을 누르면 release
  - 페이지 이탈(beforeunload) 시 release 시도 (실패 가능성은 TTL로 보완)
    E) 락 만료/상실:
  - 편집 중 락이 만료되거나 상실되면 즉시 읽기 전용으로 전환 + 경고 표시

======================================================== 3) 화면/레이아웃
========================================================

- 신규 경로: /plans/gantt
- 레이아웃: 좌측 Tree(위계/입력판) + 우측 Timeline(Gantt)
- 좌측 Tree: project > module > feature
  - row identity = (project,module,feature)
  - 동일 위계 입력 시 자동 merge(기존 row에 합치기)
  - 트리 Drag & Drop reorder (우측 행/바 표시 순서도 같이 이동)

======================================================== 4) 우측 Timeline 인터랙션 (사용성 필수)
========================================================

- hover 시 + 버튼 표시
- 빈 영역 mousedown-drag-mouseup => 기간 선택 후 CreatePlanModal로 보충 데이터 입력
- 동일 row에 여러 bar 허용, 겹치면 lane 늘리기 + row height 증가
- bar 선택 상태:
  - Backspace/Delete => 삭제(draft에서 deleted=true)
- bar 이동:
  - drag로 좌우 이동(길이 유지)
- bar 리사이즈:
  - 양 끝 핸들 드래그로 start/end 변경
- 겹침 lane 배치 규칙:
  - 동일 row의 bars를 (startDate asc, duration desc) 정렬
  - 가능한 가장 위 lane에 배치, 겹치면 다음 lane
  - laneCount에 따라 row height 증가

======================================================== 5) Draft 모델 (Feature 타입만)
========================================================

- zustand store + localStorage persist
- Draft schema:
  - rows: [{ rowId, project, module, feature, domain?, orderIndex }]
  - bars(plans): [{
    clientUid, rowId,
    title, stage, status,
    startDate, endDate,
    assignees: [{userId, role}],
    dirty: boolean,
    deleted?: boolean,
    createdAtLocal, updatedAtLocal
    }]
  - ui: { selectedBarId?, selectedRowId?, zoom, filters, lockState, lastSyncAt }
- 규칙:
  - 편집 중에는 bars만 변경하고 dirty=true
  - 삭제는 deleted=true로 마킹(즉시 제거 금지: undo 위해)
  - Commit 시 dirty/deleted만 payload로 구성

======================================================== 6) 필터/검색 (좌측 Tree 기준 + 체크박스 필터)
========================================================

- 좌측 상단에 검색 input: project/module/feature 텍스트 검색으로 트리 필터
- 체크박스 필터 패널:
  - 프로젝트 목록(체크박스 멀티)
  - 모듈 목록(체크박스 멀티)
  - 기능 목록(체크박스 멀티)
- 필터는 Draft 기준으로 즉시 반영
- 필터 변경 시 우측 타임라인도 동일하게 필터링된 row만 표시

======================================================== 7) 단축키/커맨드 팔레트 (Cmd+K / Ctrl+K)
========================================================

- Cmd+K / Ctrl+K => Command Palette 열기
- 실행 가능한 액션 목록:
  1. 작업 시작(락 획득) / 작업 종료(락 해제)
  2. 저장(Commit)
  3. Undo/Redo (최소 20 step)
  4. 선택 바 삭제(Delete Selected)
  5. 오늘로 스크롤(Go to Today)
  6. 줌 변경(Week/Month/Quarter)
  7. 필터 초기화(Reset Filters)
  8. 도움말/기능 설명 모달 열기(Help)
- 팔레트 내 "단축키 도움" 섹션 포함

======================================================== 8) 보조 안전장치(권장/필수급)
========================================================

- Unsaved changes( dirty 존재 ) 상태에서 페이지 이탈 경고
- 읽기 전용 사용자용 "서버 최신 반영" 버튼(락 잡힌 동안 확인용)
- 락 없이 편집 시도하면 즉시 차단 + 안내 모달

======================================================== 9) "기능 설명(Help) 모달" 반드시 구현
========================================================
HelpModal 포함 내용:

- 편집 락(점유) 개념 설명 + 왜 필요한지
- 기본 워크플로우: 작업 시작 -> 드래그 생성 -> 수정/삭제/리사이즈 -> 저장(Commit) -> 작업 종료
- 단축키 목록(Cmd/Ctrl+K, Delete, Undo/Redo, 줌 등)
- 겹침 lane 규칙 설명
- 필터/검색 사용법
- FAQ: "편집이 안돼요" => 누가 락 잡았는지/만료까지/새로고침/작업 종료 요청 등

======================================================== 10) 구현 순서 (단계별로 진행, 매 단계 변경 파일 목록/요약 제공)
========================================================
Step 1) Draft store + persist + Undo/Redo 이벤트 스택
Step 2) Lock service(client) + UI(읽기전용/작업시작/작업중 표시) + heartbeat + release + status polling
Step 3) 좌측 Tree(생성/merge/reorder) + 필터/검색/체크박스
Step 4) 우측 Timeline(렌더) + drag create + CreatePlanModal
Step 5) bar select/delete/move/resize + lane layout
Step 6) Commit RPC 연동 + 성공/실패 처리 + lock release + 롤백(실패 시 draft 유지)
Step 7) HelpModal + Command Palette + 단축키 안내

======================================================== 11) 구현 완료 후 정리 단계(반드시 수행): 기존 페이지/컴포넌트 폐기
========================================================
Step 8) 기존 API 즉시 저장 기반 Plans 페이지/컴포넌트 폐기(Decommission)

- 기존 Plans 관련 라우트/페이지 중, Gantt 편집기로 대체 가능한 화면은 제거하거나 /plans/gantt 로 리다이렉트.
- 기존 즉시 저장 훅/컴포넌트(즉시 upsert 호출 로직 등) 중 더 이상 참조되지 않는 파일은 삭제.
- 당장 삭제가 위험하면:
  (1) 라우트 접근 차단
  (2) Deprecated 주석 + 제거 TODO
  (3) 빌드에서 미참조 확인 후 삭제
- 삭제/변경 후 보장:
  1. 타입체크/린트/빌드 오류 0
  2. 기존 경로 접근 시 새 Gantt로 자연 이동
  3. 중복 데이터 패칭/즉시 저장 호출이 남아있지 않음

[정리 산출물]

- 제거/대체된 라우트 목록
- 삭제된 파일 목록(또는 deprecated 처리 목록)
- 새 흐름 사용자 동선 요약
- 남아있는 기술부채(TODO) 5줄 이내

[완료 기준]

- 락 기반으로 동시 편집이 사실상 차단됨
- 드래그 생성/이동/리사이즈/삭제/트리 reorder/자동 merge/필터/검색/커맨드 팔레트/HelpModal 동작
- API는 Commit + lock 관련 호출 외에는 편집 중 호출되지 않음
- 새로고침해도 draft 유지, Commit 성공 시 서버 반영
- 기존 즉시 저장 기반 페이지/컴포넌트가 정리되어 혼재가 사라짐
