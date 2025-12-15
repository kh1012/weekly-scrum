[추가 목표(누락 보완)]
기존 “관리자 메뉴(전체 스냅샷 관리 + Plans)” 프롬프팅에 아래 2가지를 반드시 추가한다.

1. “멤버 관리” 메뉴 추가

- 가입한 사용자 목록을 불러와서(워크스페이스 기준)
  a) profiles.display_name 수정
  b) workspace_members.role 변경(member/leader/admin)
  가 가능해야 한다.
- 단, admin/leader만 접근 가능.
- 보안상 UI 숨김만으로 끝내지 말고, 서버/DB에서 권한을 강제한다(RLS/route-guard).

2. “전체 스냅샷 관리”에서 3개 리소스를 CRUD 할 수 있어야 한다.

- 관리 대상 3개(필수):
  A) snapshots
  B) snapshot_entries
  C) snapshot_meta_options
- admin/leader는 워크스페이스 전체 범위에서 CRUD 가능.
- member는 본인 author_id 범위에서만 CRUD(기존 정책 유지).

────────────────────────────────────────
[중요 전제(반드시 반영)]

- Supabase의 auth.users 목록은 anon key로 직접 조회 불가(보안 영역).
- 따라서 “가입한 Users 목록”은 아래 중 하나로 구현해야 한다(선택 강요하지 말고 구현 가이드로 포함).

권장 구현(현실적):

- 멤버 목록은 “workspace_members JOIN profiles”로 구성한다.
  => 즉, ‘가입 + 온보딩 완료(프로필 생성)’된 사용자만 멤버 관리 대상이 된다.
- 만약 온보딩 이전 사용자까지 포함해야 한다면:
  - Edge Function 또는 Server Route에서 service_role로 auth admin list users를 조회하는 방식이 필요
  - (이번 PR에서는 복잡도 높으므로 기본은 workspace_members+profiles 기반으로 한다)

────────────────────────────────────────
[새 요구사항 6: 관리자 메뉴 - 멤버 관리(Member Management)]

1. SNB에 “관리자” 섹션이 노출되는 조건(기존 유지)

- workspace_members.role in ('admin','leader') 인 사용자에게만 “관리자” 섹션 노출

2. 관리자 섹션 하위 메뉴에 “멤버 관리”를 추가한다.

- /app/admin/members

3. 멤버 관리 화면 기능(MVP)

- 목록 조회(워크스페이스 범위)
  - join: workspace_members + profiles
  - 표시 컬럼:
    - display_name
    - email
    - role
    - user_id
    - created_at(가능하면)
- 편집 기능
  A) display_name 수정
  B) role 변경(드롭다운: member/leader/admin)
- 저장 시 서버 액션으로 update 실행(클라이언트 direct update 금지)
- UX:
  - 변경 감지(Dirty state)
  - 저장 성공/실패 토스트
  - 본인 role을 강등하는 액션은 경고(confirm) 표시(옵션)

4. 권한/보안(필수)

- /app/admin/members 접근 시 서버에서 role 체크 후 차단
- DB RLS로도 차단:
  - admin/leader만 workspace_members.role을 update 가능
  - admin/leader만 다른 사람 profiles.display_name을 update 가능

────────────────────────────────────────
[새 요구사항 7: 관리자 기능 - 전체 스냅샷 관리(3개 리소스 CRUD)]
관리자 메뉴의 “전체 스냅샷 관리”는 단순 조회가 아니라, 아래 3개를 CRUD 할 수 있어야 한다.

A) snapshots (워크스페이스 전체)

- 목록: 필터(year/week, week_start_date, author, status)
- 상세: snapshot + entries 같이 보기
- 수정: (필요 최소만) title/status/week_start_date 조정 등 (스키마에 있는 필드만)
- 삭제: 정책 허용 시 가능(아니면 버튼 비활성 + 정책 안내)

B) snapshot_entries

- snapshot 상세 화면에서 entries를 CRUD
  - entry 추가/수정/삭제/복제/정렬(기존 편의 기능을 admin 화면에서도 최소 제공)
- author_id는 원칙적으로 원본 작성자 유지(필요 시 관리자 변경 옵션은 MVP에서는 제외)

C) snapshot_meta_options

- /app/admin/meta-options (또는 /app/admin/snapshot-meta-options)
- category별 목록/정렬(order_index) + 생성/수정/삭제
- 기존 정적 옵션(snapshotMetaOptions.ts) 완전 대체를 목표로 함
- 주의:
  - member는 읽기만
  - admin/leader만 수정 가능

────────────────────────────────────────
[누락 보완: 반드시 필요한 RLS 정책/제약(Cursor가 체크 후 반영)]
아래 중 빠진 것이 있으면 추가/수정한다. (SQL은 “제안 블록”으로 출력)

1. workspace_members 유니크 제약

- unique(workspace_id, user_id) 없으면 upsert 불가
- 있으면 그대로 사용

2. profiles 업데이트 정책

- 현재는 본인만 update 가능할 가능성이 높음
- admin/leader가 타인의 display_name을 수정하려면 정책 추가 필요

3. workspace_members 업데이트 정책

- admin/leader만 role 변경 가능해야 함
- member는 update 불가

4. snapshot_meta_options 업데이트 정책

- admin/leader만 insert/update/delete 가능
- member는 select만

5. snapshots / snapshot_entries 관리자 CRUD 정책

- admin/leader는 workspace 범위 CRUD 가능하도록 policy가 필요
- 기존 “작성자만 수정/삭제” 정책이 있다면,
  admin/leader 예외를 추가해야 관리자 CRUD가 동작함
- 정책이 없으면 UI에서 403 발생 → Cursor가 그 에러를 근거로 정책 제안

────────────────────────────────────────
[단계별 구현 계획(순서 고정)]
Step 1) role 조회 유틸 확정(기존 요구 유지)

- getWorkspaceRole(workspaceId) 서버 유틸
- admin/leader 여부 boolean helper 추가: isAdminOrLeader(role)

Step 2) 관리자 섹션 + “멤버 관리” 메뉴 SNB 추가

- 조건부 렌더링 + 메뉴 정의에서 실제 추가

Step 3) /app/admin/\*\* route guard 강화

- admin/leader 아니면 redirect(/app) 또는 403 페이지

Step 4) 멤버 관리 화면 구현

- 데이터 소스: workspace_members JOIN profiles
- 서버 액션:
  - updateDisplayName(userId, displayName)
  - updateMemberRole(userId, role)
- 변경 사항 저장/롤백 UX

Step 5) 전체 스냅샷 관리 CRUD 확장

- 기존 admin snapshots 화면이 있으면 확장, 없으면 신규 생성
- snapshots 상세에서 entries CRUD 제공
- snapshot_meta_options 관리 페이지 추가 + CRUD

Step 6) RLS 이슈 해결

- 구현 중 403이 발생하면:
  - 어떤 요청이 막혔는지 로그로 특정
  - 필요한 policy SQL을 “별도 블록”으로 제안
  - (사용자에게 실행을 강요하지 말고 선택지로 제공)

Step 7) 테스트 시나리오 수행

- member:
  - 관리자 섹션 미노출
  - /app/admin/\* 접근 차단
  - 본인 snapshot CRUD만 가능
- leader/admin:
  - 관리자 섹션 노출
  - 멤버 관리에서 display_name/role 수정 가능
  - 전체 스냅샷 관리에서 snapshots/entries/meta_options CRUD 가능(정책 허용 범위)

────────────────────────────────────────
[구현 파일 가이드(예시)]

- src/lib/auth/getWorkspaceRole.ts
- src/lib/data/members.ts
  - listMembers(workspaceId)
  - updateMemberRole(workspaceId, userId, role)
  - updateDisplayName(userId, displayName)
- src/app/(app)/admin/members/page.tsx (+ actions)
- src/app/(app)/admin/meta-options/page.tsx (+ actions)
- src/app/(app)/admin/snapshots/\*\* (기존이 있으면 확장)
- SNB 메뉴 정의 파일(프로젝트에서 탐색 후 수정)

────────────────────────────────────────
[출력 요구]

1. 변경/생성 파일 목록
2. 각 파일 전체 코드(중간 생략 금지)
3. 관리자 메뉴(SNB) 변경 코드(섹션 구조 포함)
4. 멤버 관리 화면(목록/수정/저장) 전체
5. 전체 스냅샷 관리: snapshots / snapshot_entries / snapshot_meta_options CRUD UI + 서버 액션
6. RLS 정책 누락 시:

- 어떤 동작이 막혔는지(에러 메시지/코드)
- 필요한 SQL 정책을 별도 블록으로 제안

7. 테스트 시나리오 및 결과 체크리스트

[완료 조건]

- admin/leader만 “관리자” 섹션 + “멤버 관리” 메뉴가 보인다.
- 멤버 관리에서 profiles.display_name 수정 및 workspace_members.role 변경이 가능하다(서버 액션 기반).
- 전체 스냅샷 관리에서 snapshots / snapshot_entries / snapshot_meta_options 3개 리소스를 워크스페이스 범위로 CRUD 가능하다(RLS 정책 일치).
- member는 관리자 기능에 접근/수정이 불가능하다(UI/DB 모두).
