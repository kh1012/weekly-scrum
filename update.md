[목표]
Next.js(App Router) 프로젝트에서 root/data/ 디렉토리에 정적으로 포함된
스냅샷(Weekly Scrum) 및 일정표(Plan) 데이터를
Supabase(Postgres + Auth + RLS) 기반의 동적 데이터로 완전히 전환한다.
최종적으로 CRUD(생성/조회/수정/삭제)까지 지원한다.
여기서 일정표(Plan) 기능은 supabase 연결 후에 UI 작업을 별도로 요청할거야.

[전제]

- App Router 사용 중
- 기존 정적 데이터는 <REPO_ROOT>/data/ 하위에 존재
- Cursor는 직접 data/ 디렉토리 구조와 파일 내용을 탐색할 수 있음
- Supabase 셋업 완료:
  - 테이블 생성 완료
  - RLS Phase 3 정책 적용 완료
  - Auth Email Provider 활성화
  - Users 생성 확인
- CRUD까지 구현

[환경변수]

- 로컬 .env.local에 아래 값이 이미 설정되어 있음:
  NEXT_PUBLIC_SUPABASE_URL=https://chosenyzucygtvjgkusq.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNob3Nlbnl6dWN5Z3R2amdrdXNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NDU2MDIsImV4cCI6MjA4MTMyMTYwMn0.GyWuzpLcTU-CZfj6ZaT0RoqRYbKinPM3uTWWZal3eh0
  DEFAULT_WORKSPACE_ID=00000000-0000-0000-0000-000000000001
- service_role key는 절대 사용하지 말 것

[필수 구현 규칙]

1. 데이터 접근 레이어 분리

   - src/lib/data/snapshots.ts
   - src/lib/data/plans.ts
     위 파일에 Supabase 쿼리를 캡슐화하고,
     UI / 서버 액션 / 라우트는 이 레이어만 사용하도록 한다.

2. Supabase 클라이언트 구성

   - @supabase/ssr 기반
   - src/lib/supabase/server.ts
   - src/lib/supabase/browser.ts

3. 인증/권한

   - /login (Email OTP) 사용
   - /auth/callback 라우트 구현 또는 기존 라우트 활용
   - middleware로 /app/\*\* 보호
   - 첫 로그인 시 DEFAULT_WORKSPACE_ID에
     workspace_members upsert(role = 'member') 자동 수행

4. CRUD 정책

   - CREATE / UPDATE / DELETE는
     Server Actions 또는 Route Handler에서만 수행
   - 클라이언트에서 직접 쓰기 금지
   - RLS 권한 에러(401/403)와 validation 에러 구분 처리

5. 정적 data/ 제거
   - 최종적으로 data/ 디렉토리는
     앱 실행에 필요 없도록 제거
   - 개발용 fallback이 필요하면 옵션으로만 유지

[작업 단계 - 순서 고정]
A. 현황 분석

1.  root/data/ 디렉토리 구조 및 파일 포맷 자동 분석
2.  data/를 참조하는 모든 코드 위치 검색
    - fs.readFile
    - import json
    - fetch('/data')
    - 기타 정적 의존
3.  스냅샷과 일정표 데이터 모델을 Supabase 테이블과 매핑 정리

B. 마이그레이션 스크립트 작성 (1회 실행)

1.  scripts/migrate-static-data-to-supabase.ts 생성
2.  data/를 읽어 아래 테이블로 upsert/insert
    - snapshots
    - snapshot_entries
    - plans
    - plan_assignees
3.  멱등성 보장
    - 동일 데이터로 여러 번 실행해도 중복 생성 금지
4.  실행 방법 제공
    - node scripts/migrate-static-data-to-supabase.ts

C. 애플리케이션 코드 전환

1.  READ
    - 기존 data/ 기반 조회를 Supabase 조회로 교체
    - 스냅샷: 주차(week_start_date) 기준, 최근 N주
    - 일정표: 기간(start_date/end_date) 기준
2.  CREATE
    - 스냅샷 생성 + entry 생성
    - plan 생성 + assignee 연결
3.  UPDATE
    - 스냅샷/entry 수정
    - plan 및 assignees 수정
4.  DELETE
    - RLS 정책을 전제로 UI 제어 포함

D. 검증 및 정리

1.  테스트 시나리오 작성
    - 로그인 → workspace_members 생성 확인
    - 마이그레이션 실행 → 테이블 row 증가 확인
    - CRUD 전부 동작 확인
    - 비로그인/권한없는 접근 차단 확인
2.  data/ 의존 코드 완전 제거
3.  README 업데이트
    - env 설정
    - 마이그레이션 방법
    - 로컬 실행 방법

[출력 요구]

- 변경/생성 파일 목록
- 각 파일 전체 코드 (중간 생략 금지)
- 마이그레이션 실행 방법 및 예상 결과
- 문제 발생 시 체크리스트
  - env 누락
  - redirect url 미설정
  - workspace_members 미생성으로 RLS 차단
  - anon key 오사용

[완료 조건]

- root/data/ 없이 앱이 정상 동작
- Supabase를 단일 데이터 소스로 CRUD 가능
- RLS 정책이 실제로 권한을 강제함
