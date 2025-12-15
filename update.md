[목표]
Supabase Auth(Email OTP) 기반 로그인 후,
사용자가 반드시 display name을 입력하도록 강제하는 온보딩 흐름을 구현한다.
display name은 auth.users가 아니라 public.profiles 테이블에서 관리한다.

[현재 상태]

- Supabase에 public.profiles 테이블 생성 완료
  - columns: user_id(uuid, PK, auth.users FK), display_name, email, created_at, updated_at
  - RLS:
    - 본인 프로필만 select/insert/update 가능
- App Router 사용 중
- Supabase client 유틸 존재
  - src/lib/supabase/server.ts
  - src/lib/supabase/browser.ts
- 로그인(/login), auth callback(/auth/callback), middleware로 /app 보호 구조 존재

[구현 요구사항]

1. 로그인 후 공통 진입 지점에서 profile 존재 여부 검사
   - auth.getUser()로 로그인 여부 확인
   - profiles 테이블에 row가 없으면
     → /onboarding/profile 로 리다이렉트
2. /onboarding/profile 페이지 구현
   - display name 입력 필드 1개
   - submit 시 profiles insert
     - user_id = auth.users.id
     - display_name = 입력값
     - email = auth.users.email
3. profile 생성 완료 후 /app 으로 이동
4. 이미 profile이 있는 사용자는
   - /onboarding/profile 접근 불가
   - 바로 /app 사용 가능
5. UX 최소 요구
   - 빈 값 제출 불가
   - 중복 submit 방지(loading 상태)
   - 에러 발생 시 메시지 표시

[구현 위치 가이드]

- profile 체크:
  - src/app/app/layout.tsx (server component)
- 온보딩 페이지:
  - src/app/onboarding/profile/page.tsx (client component)
- redirect는 next/navigation 사용

[주의사항]

- auth.users 테이블을 직접 수정하거나 display name을 저장하지 말 것
- service_role key 사용 금지
- RLS를 우회하는 로직 금지
- profiles는 반드시 user_id = auth.uid() 조건으로만 insert/update

[출력 요구]

1. 생성/수정 파일 목록
2. 각 파일 전체 코드 (중간 생략 금지)
3. 로그인 → 온보딩 → 앱 진입 흐름 설명
4. 테스트 시나리오
   - 신규 유저: 로그인 → 이름 입력 → /app
   - 기존 유저: 로그인 → 바로 /app
   - 비로그인: /app 접근 시 /login 리다이렉트

[완료 조건]

- display name을 입력하지 않으면 앱을 사용할 수 없다
- profiles row가 생성된 이후에만 snapshots / plans 접근 가능
- RLS 에러 없이 정상 동작
