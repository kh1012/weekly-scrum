# Supabase Foreign Key 설정 가이드

## 문제 상황

현재 코드는 `workspace_members`와 `profiles` 테이블을 별도로 조회한 후 애플리케이션에서 병합하고 있습니다.

```typescript
// 현재 방식 (2-3개 쿼리)
const members = await supabase
  .from("workspace_members")
  .select("user_id, role");
const profiles = await supabase
  .from("profiles")
  .select("*")
  .in("user_id", userIds);
// 애플리케이션에서 병합
```

## 성능 개선 방안

Foreign Key를 추가하면 JOIN 방식으로 변경 가능합니다.

```typescript
// FK 추가 후 가능한 방식 (1개 쿼리)
const members = await supabase.from("workspace_members").select(`
    user_id,
    role,
    profiles!user_id(
      display_name,
      email,
      basic_role
    )
  `);
```

## FK 추가 방법

### 1. Supabase Studio 사용

1. Supabase Dashboard → Table Editor 열기
2. `workspace_members` 테이블 선택
3. "Foreign Keys" 탭 클릭
4. "Add foreign key" 클릭:
   - Column: `user_id`
   - Referenced table: `profiles`
   - Referenced column: `user_id`
   - On delete: `CASCADE`

같은 방법으로 `snapshots.author_id`와 `plan_assignees.user_id`에도 FK 추가

### 2. SQL Editor 사용

```sql
-- workspace_members -> profiles
ALTER TABLE workspace_members
ADD CONSTRAINT fk_workspace_members_user_id
FOREIGN KEY (user_id)
REFERENCES profiles(user_id)
ON DELETE CASCADE;

-- snapshots -> profiles
ALTER TABLE snapshots
ADD CONSTRAINT fk_snapshots_author_id
FOREIGN KEY (author_id)
REFERENCES profiles(user_id)
ON DELETE SET NULL;

-- plan_assignees -> profiles
ALTER TABLE plan_assignees
ADD CONSTRAINT fk_plan_assignees_user_id
FOREIGN KEY (user_id)
REFERENCES profiles(user_id)
ON DELETE CASCADE;
```

### 3. Schema Cache 새로고침

FK 추가 후 PostgREST 캐시를 새로고침해야 JOIN이 작동합니다.

#### Supabase Studio

Settings → API → "Reload schema cache" 버튼 클릭

#### REST API

```bash
curl -X POST 'https://<project-ref>.supabase.co/rest/v1/rpc/reload_schema_cache' \
  -H "apikey: <anon-key>" \
  -H "Authorization: Bearer <anon-key>"
```

## FK 추가 후 코드 변경

### 파일 1: `src/lib/data/members/index.ts`

```typescript
// FK 추가 전 (현재)
const { data: members } = await supabase
  .from("workspace_members")
  .select("user_id, role")
  .eq("workspace_id", workspaceId);

const userIds = members.map((m) => m.user_id);
const { data: profiles } = await supabase
  .from("profiles")
  .select("user_id, display_name, email, basic_role")
  .in("user_id", userIds);

const profileMap = new Map(profiles.map((p) => [p.user_id, p]));
// 병합 로직...

// FK 추가 후
const { data: members } = await supabase
  .from("workspace_members")
  .select(
    `
    user_id,
    role,
    profiles!user_id(
      display_name,
      email,
      basic_role
    )
  `
  )
  .eq("workspace_id", workspaceId)
  .order("role", { ascending: true });

const result = members.map((m) => ({
  user_id: m.user_id,
  role: m.role,
  display_name: m.profiles?.display_name || null,
  email: m.profiles?.email || null,
  basic_role: m.profiles?.basic_role || null,
}));
```

### 파일 2: `src/lib/data/snapshots/supabaseSnapshots.ts`

```typescript
// FK 추가 전 (현재)
const { data: snapshots } = await supabase
  .from("snapshots")
  .select(`*, entries:snapshot_entries(*)`)
  .eq("workspace_id", workspaceId);

const authorIds = [
  ...new Set(snapshots.map((s) => s.author_id).filter(Boolean)),
];
const { data: profiles } = await supabase
  .from("profiles")
  .select("user_id, display_name")
  .in("user_id", authorIds);
// 병합 로직...

// FK 추가 후
const { data: snapshots } = await supabase
  .from("snapshots")
  .select(
    `
    *,
    entries:snapshot_entries(*),
    author:profiles!author_id(
      user_id,
      display_name
    )
  `
  )
  .eq("workspace_id", workspaceId);

// author 정보가 이미 JOIN되어 있음
snapshots.forEach((s) => {
  const authorName = s.author?.display_name || "Unknown";
  // 바로 사용 가능
});
```

## 성능 비교

### 현재 방식 (FK 없음)

- 쿼리 수: 2-3개
- 네트워크 왕복: 2-3번
- 데이터 전송량: 중복 데이터 포함
- 병합 오버헤드: 애플리케이션에서 Map 생성 및 조인

### FK 추가 후

- 쿼리 수: 1개
- 네트워크 왕복: 1번
- 데이터 전송량: 최적화됨
- 병합 오버헤드: 없음 (DB에서 JOIN)

## 예상 성능 개선

- `/works/plans/gantt`: 3개 쿼리 → 1개 쿼리 (약 40-60% 응답 시간 단축)
- `/works/team-feed`: 2개 쿼리 → 1개 쿼리 (약 30-50% 응답 시간 단축)
- `/my/alignment`: 4-5개 쿼리 → 2-3개 쿼리 (약 30-40% 응답 시간 단축)

## 주의사항

1. FK 추가 시 기존 데이터 검증 필요

   - `workspace_members.user_id`가 `profiles.user_id`에 모두 존재해야 함
   - 고아 레코드가 있으면 FK 생성 실패

2. ON DELETE 정책 선택

   - `CASCADE`: profiles 삭제 시 관련 레코드도 삭제
   - `SET NULL`: profiles 삭제 시 FK 필드를 NULL로 설정
   - `RESTRICT`: profiles 삭제 시 에러 발생

3. 인덱스 자동 생성
   - FK 생성 시 자동으로 인덱스가 생성됨
   - 쿼리 성능 향상

## 롤백 방법

FK가 문제를 일으키면 제거 가능합니다.

```sql
ALTER TABLE workspace_members DROP CONSTRAINT fk_workspace_members_user_id;
ALTER TABLE snapshots DROP CONSTRAINT fk_snapshots_author_id;
ALTER TABLE plan_assignees DROP CONSTRAINT fk_plan_assignees_user_id;
```

## 추천 사항

1. 개발/스테이징 환경에서 먼저 테스트
2. FK 추가 전 데이터 정합성 확인
3. FK 추가 후 Schema Cache 새로고침
4. 코드 변경 및 테스트
5. 프로덕션 배포

이렇게 하면 N+1 쿼리 문제를 해결하고 원래 의도했던 성능 최적화를 달성할 수 있습니다.
