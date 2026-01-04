# Demo/Production 모드 설정 가이드

이 프로젝트는 **Demo 모드**와 **Production 모드** 두 가지로 실행할 수 있습니다.

## 📋 목차

1. [환경변수 설정](#환경변수-설정)
2. [로컬 개발 환경](#로컬-개발-환경)
3. [Vercel 배포 환경](#vercel-배포-환경)
4. [Demo 모드 설정](#demo-모드-설정)
5. [Production 모드 설정](#production-모드-설정)
6. [주요 차이점](#주요-차이점)

---

## 환경변수 설정

### 로컬 개발용 (`.env.local`)

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# App Mode: 'prod' 또는 'demo'
NEXT_PUBLIC_APP_MODE=prod

# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Demo 모드용 (NEXT_PUBLIC_APP_MODE=demo일 때만 사용)
NEXT_PUBLIC_DEMO_WORKSPACE_ID=00000000-0000-0000-0000-000000000002
```

> 💡 **Tip**: 로컬에서 Demo 모드를 테스트하려면 `NEXT_PUBLIC_APP_MODE=demo`로 변경하고 Demo Supabase URL/KEY를 설정하세요.

---

## 로컬 개발 환경

### 방법 1: `.env.local` 직접 수정 (권장)

로컬에서 모드를 전환하려면 `.env.local` 파일의 `NEXT_PUBLIC_APP_MODE` 값만 변경하세요:

**Production 모드로 테스트:**

```env
NEXT_PUBLIC_APP_MODE=prod
NEXT_PUBLIC_SUPABASE_URL=https://your-prod.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-key
```

**Demo 모드로 테스트:**

```env
NEXT_PUBLIC_APP_MODE=demo
NEXT_PUBLIC_SUPABASE_URL=https://your-demo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-demo-key
NEXT_PUBLIC_DEMO_WORKSPACE_ID=00000000-0000-0000-0000-000000000002
```

실행:

```bash
yarn dev  # 변경된 .env.local이 자동으로 로드됨
```

### 방법 2: 별도 파일 사용 (선택사항)

빠른 전환을 위해 별도 파일을 만들 수도 있습니다:

**`.env.demo` 파일 생성:**

```env
NEXT_PUBLIC_APP_MODE=demo
NEXT_PUBLIC_SUPABASE_URL=https://your-demo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-demo-key
NEXT_PUBLIC_DEMO_WORKSPACE_ID=00000000-0000-0000-0000-000000000002
```

실행:

```bash
yarn dev:demo  # .env.demo를 로드
```

---

## Vercel 배포 환경

Vercel에서는 파일 없이 환경변수를 직접 설정합니다.

### 1. Vercel Dashboard 설정

**Project Settings → Environment Variables**

#### Production 환경

| Name                            | Value                           | Environment |
| ------------------------------- | ------------------------------- | ----------- |
| `NEXT_PUBLIC_APP_MODE`          | `prod`                          | Production  |
| `NEXT_PUBLIC_SUPABASE_URL`      | `https://your-prod.supabase.co` | Production  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your-prod-anon-key`            | Production  |
| `SUPABASE_SERVICE_ROLE_KEY`     | `your-service-role-key`         | Production  |

#### Preview/Demo 환경

| Name                            | Value                                  | Environment |
| ------------------------------- | -------------------------------------- | ----------- |
| `NEXT_PUBLIC_APP_MODE`          | `demo`                                 | Preview     |
| `NEXT_PUBLIC_SUPABASE_URL`      | `https://your-demo.supabase.co`        | Preview     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your-demo-anon-key`                   | Preview     |
| `NEXT_PUBLIC_DEMO_WORKSPACE_ID` | `00000000-0000-0000-0000-000000000002` | Preview     |

### 2. 브랜치별 배포 전략

```
main 브랜치 → Production (prod 모드)
demo 브랜치 → Preview (demo 모드)
```

Vercel이 자동으로 환경별 설정을 적용합니다.

---

## Demo 모드 설정

### 1. Supabase 프로젝트 준비

1. 별도의 Supabase 프로젝트를 생성합니다
2. 동일한 스키마를 적용합니다
3. Demo용 워크스페이스를 생성합니다:
   ```sql
   INSERT INTO workspaces (id, name, is_demo)
   VALUES ('00000000-0000-0000-0000-000000000002', 'Demo Workspace', true);
   ```

### 2. RLS 정책 설정

Demo 모드에서는 익명(anon) 사용자가 데이터를 읽을 수 있도록 RLS 정책을 설정해야 합니다:

```sql
-- Demo workspace에 대해 읽기 허용
CREATE POLICY "Demo workspace is readable by everyone"
ON workspaces
FOR SELECT
USING (is_demo = true);

-- Demo workspace의 스냅샷 읽기 허용
CREATE POLICY "Demo snapshots are readable by everyone"
ON snapshots
FOR SELECT
USING (workspace_id = '00000000-0000-0000-0000-000000000002');

-- Demo workspace의 스냅샷 엔트리 읽기 허용
CREATE POLICY "Demo snapshot_entries are readable by everyone"
ON snapshot_entries
FOR SELECT
USING (workspace_id = '00000000-0000-0000-0000-000000000002');
```

### 3. Demo 데이터 생성

Demo 워크스페이스에 샘플 데이터를 추가하세요.

---

## Production 모드 설정

### 1. Supabase 프로젝트 준비

1. Production용 Supabase 프로젝트를 생성합니다
2. 스키마를 적용합니다
3. Email + Password 인증을 활성화합니다

### 2. 인증 설정

Supabase Dashboard에서:

- **Authentication > Providers** → Email 활성화
- **Authentication > Email Templates** → Magic Link 템플릿 확인

### 3. 워크스페이스 생성

사용자가 로그인한 후 소속될 워크스페이스를 생성하세요:

```sql
-- 워크스페이스 생성
INSERT INTO workspaces (name)
VALUES ('My Company');

-- 사용자를 워크스페이스에 추가
INSERT INTO workspace_members (workspace_id, user_id, role)
VALUES ('workspace-uuid', 'user-uuid', 'owner');
```

---

## 빠른 테스트 가이드

### 로컬에서 Production 모드 테스트

1. `.env.local`에서 `NEXT_PUBLIC_APP_MODE=prod` 설정
2. `yarn dev` 실행
3. http://localhost:3000/login 접속
4. 이메일 입력 폼 확인
5. 이메일로 받은 Magic Link 클릭하여 로그인

### 로컬에서 Demo 모드 테스트

1. `.env.local`에서 `NEXT_PUBLIC_APP_MODE=demo` 설정
2. Demo Supabase URL/KEY 설정
3. `yarn dev` 실행
4. http://localhost:3000/login 접속
5. "게스트로 계속하기" 버튼 확인
6. 클릭 후 바로 메인 페이지 이동

### Vercel에서 테스트

**Production:** `https://your-app.vercel.app`

- main 브랜치 배포
- Production 환경변수 적용

**Demo:** `https://your-app-git-demo.vercel.app`

- demo 브랜치 배포
- Preview 환경변수 적용

---

## 주요 차이점

| 항목                    | Production 모드     | Demo 모드                |
| ----------------------- | ------------------- | ------------------------ |
| **인증**                | Magic Link (이메일) | 로그인 불필요            |
| **워크스페이스**        | 자동 할당           | 고정 (DEMO_WORKSPACE_ID) |
| **Supabase 클라이언트** | 인증된 사용자       | 익명(anon) 사용자        |
| **데이터 접근**         | RLS 정책 적용       | Demo 데이터만 읽기 가능  |
| **로그인 UI**           | 이메일 입력 폼      | "게스트로 계속하기" 버튼 |

---

## 트러블슈팅

### 1. "소속된 워크스페이스가 없습니다" 오류

→ `workspace_members` 테이블에 사용자를 추가하세요.

### 2. Demo 모드에서 데이터가 안 보임

→ RLS 정책을 확인하고, Demo 워크스페이스에 데이터가 있는지 확인하세요.

### 3. 빌드 오류

→ 모든 환경변수가 올바르게 설정되어 있는지 확인하세요.

---

## 개발 워크플로우

### 1. Demo 모드로 UI 테스트

```bash
yarn dev:demo
```

→ 로그인 없이 빠르게 UI를 확인하고 테스트할 수 있습니다.

### 2. Production 모드로 인증 흐름 테스트

```bash
yarn dev
```

→ 실제 로그인/회원가입 흐름을 테스트합니다.

### 3. 배포 전 빌드 테스트

```bash
yarn build
```

→ 타입 에러와 빌드 오류를 확인합니다.

---

## 참고사항

- Demo 모드는 개발/데모 목적으로만 사용하세요
- Production 환경에서는 반드시 `NEXT_PUBLIC_APP_MODE=prod`로 설정하세요
- `.env.local`과 `.env.demo` 파일은 절대 Git에 커밋하지 마세요
