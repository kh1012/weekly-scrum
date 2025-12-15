[문제]
사용자가 가입/로그인하면 Supabase Authentication의 auth.users에는 생성되지만,
public.workspace_members에는 row가 자동으로 생성되지 않는다.
그 결과 RLS 기반 권한(멤버 여부)이 성립하지 않아 앱 기능이 막힌다.

[목표]
로그인 성공 직후(세션 확보 직후) 1회 실행으로

1. public.profiles upsert
2. public.workspace_members upsert(role='member')
   를 자동으로 수행한다.
   DEFAULT_WORKSPACE_ID(=00000000-0000-0000-0000-000000000001)에 가입 즉시 멤버로 등록되게 한다.

[전제]

- Next.js App Router 사용
- @supabase/ssr 기반 server client 사용
- .env.local에 DEFAULT_WORKSPACE_ID가 존재
- public.workspace_members 테이블 컬럼: workspace_id, user_id, role
- role 타입은 workspace_role(enum)로 보이며 member/admin/leader 중 하나를 사용
- profiles 테이블은 user_id, display_name, email 보유

[필수 요구사항]

1. 로그인 직후 실행 위치를 확정하라.
   - 후보: /auth/callback route handler, 또는 /app layout(server) 진입 시
   - 중복 실행되어도 안전해야 함 (upsert, on conflict)
2. workspace_members upsert는 반드시 “현재 로그인한 user_id(auth.users.id)”로 수행한다.
3. profiles row가 없으면 생성한다.
   - display_name이 아직 없으면 onboarding으로 보내는 기존 플로우 유지
4. 실패 시 원인을 콘솔/로그로 남긴다.
   - RLS 거부(403)
   - FK 실패(DEFAULT_WORKSPACE_ID 없음)
   - 세션 없음(user null)
5. 코드 변경 후, 가입/로그인 시 Table Editor에서 workspace_members row가 생성되는지 검증한다.

[구현 가이드]

- src/lib/auth/ensureMembership.ts 같은 유틸로 분리
- 내부에서:
  - const { data: { user } } = await supabase.auth.getUser()
  - if (!user) return
  - upsert workspace_members:
    workspace_id = process.env.DEFAULT_WORKSPACE_ID
    user_id = user.id
    role = 'member'
- upsert conflict key는 (workspace_id, user_id) 유니크 제약이 있어야 함.
  - 없다면 마이그레이션으로 unique(workspace_id, user_id) 추가 제안/적용

[출력 요구]

- 변경/생성 파일 목록
- 전체 코드(중간 생략 금지)
- 테스트 시나리오:
  1. 새 이메일로 로그인 → users 생성 → workspace_members row 자동 생성 확인
  2. 재로그인 → row 중복 생성 없음
  3. onboarding 전/후에도 멤버십 생성은 항상 보장
