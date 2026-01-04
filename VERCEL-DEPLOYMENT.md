# Vercel 배포 가이드

## 🚀 간단 요약

Vercel에서는 **파일 없이** 환경변수만 설정하면 됩니다!

```
Production: NEXT_PUBLIC_APP_MODE=prod + Production Supabase
Preview:    NEXT_PUBLIC_APP_MODE=demo + Demo Supabase
```

---

## 📦 배포 전 준비

### 1. Supabase 프로젝트 2개 준비

#### Production 프로젝트
- 실제 사용자 데이터
- Email 인증 활성화
- RLS 정책 적용

#### Demo 프로젝트
- 샘플 데이터
- 익명 접근 허용
- Demo workspace 생성

---

## ⚙️ Vercel 환경변수 설정

### Dashboard에서 설정

1. **Vercel Dashboard** → 프로젝트 선택
2. **Settings** → **Environment Variables**
3. 아래 변수 추가:

### Production 환경 (main 브랜치)

```
NEXT_PUBLIC_APP_MODE = prod
NEXT_PUBLIC_SUPABASE_URL = https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGc...
```

**Environment 선택:** ✅ Production

### Preview 환경 (demo 브랜치)

```
NEXT_PUBLIC_APP_MODE = demo
NEXT_PUBLIC_SUPABASE_URL = https://yyy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGc...
NEXT_PUBLIC_DEMO_WORKSPACE_ID = 00000000-0000-0000-0000-000000000002
```

**Environment 선택:** ✅ Preview

---

## 🌳 브랜치 전략

### 추천 구조

```
main    → Production 배포 (prod 모드)
demo    → Preview 배포 (demo 모드)
develop → Development
```

### Git 워크플로우

```bash
# Demo 브랜치 생성
git checkout -b demo
git push origin demo

# Vercel에서 자동으로 Preview 배포
# → demo 환경변수 적용됨
```

---

## ✅ 배포 후 확인

### Production 환경 테스트

1. `https://your-app.vercel.app` 접속
2. 로그인 페이지에서 **이메일 입력 폼** 확인
3. 이메일 입력 → Magic Link 수신 → 로그인 → 메인 페이지
4. 실제 데이터가 표시되는지 확인

### Demo 환경 테스트

1. `https://your-app-git-demo.vercel.app` 접속
2. 로그인 페이지에서 **"게스트로 계속하기"** 버튼 확인
3. 클릭 → 메인 페이지로 바로 이동
4. Demo 데이터가 표시되는지 확인

---

## 🔧 로컬에서 Vercel 환경 테스트

Vercel CLI를 사용하면 로컬에서 Vercel 환경변수를 테스트할 수 있습니다:

```bash
# Vercel CLI 설치
npm i -g vercel

# 프로젝트 연결
vercel link

# Production 환경변수 다운로드
vercel env pull .env.local

# 로컬 실행
yarn dev
```

---

## 📊 환경별 동작 차이

| 항목 | Production | Preview (Demo) |
|------|-----------|----------------|
| **URL** | your-app.vercel.app | your-app-git-demo.vercel.app |
| **브랜치** | main | demo |
| **로그인** | Email + Password 필수 | 게스트 접속 |
| **데이터** | 실제 사용자 데이터 | Demo 샘플 데이터 |
| **Workspace** | 사용자가 선택 | 고정 (Demo ID) |

---

## 🐛 트러블슈팅

### "워크스페이스가 없습니다" 오류

**원인:** Production 환경에서 사용자가 어떤 워크스페이스에도 속하지 않음

**해결:**
```sql
INSERT INTO workspace_members (workspace_id, user_id, role)
VALUES ('workspace-uuid', 'user-uuid', 'owner');
```

### Demo 모드에서 데이터가 안 보임

**원인:** RLS 정책이 익명 사용자를 허용하지 않음

**해결:** Demo Supabase에 RLS 정책 추가
```sql
CREATE POLICY "Demo data is readable by everyone"
ON snapshots FOR SELECT
USING (workspace_id = '00000000-0000-0000-0000-000000000002');
```

### 환경변수가 반영 안 됨

**원인:** 배포 후 환경변수를 변경했지만 재배포하지 않음

**해결:**
1. Vercel Dashboard → Deployments
2. 최신 배포 선택 → **Redeploy**
3. 또는 Git에 push하여 자동 재배포

---

## 💡 Best Practices

### 1. 환경변수 관리

```
# ❌ 잘못된 방법
.env.local, .env.demo 파일을 Git에 커밋

# ✅ 올바른 방법
.gitignore에 추가, Vercel Dashboard에서만 관리
```

### 2. Demo 데이터 관리

- Demo workspace는 정기적으로 초기화
- 샘플 데이터는 스크립트로 자동 생성
- 민감한 정보는 절대 포함하지 않기

### 3. 브랜치 보호

```
# main 브랜치 보호 규칙 설정
- Require pull request reviews
- Require status checks to pass
- Include administrators
```

---

## 🎯 빠른 체크리스트

배포 전:
- [ ] Supabase 프로젝트 2개 준비 완료
- [ ] Demo workspace 및 샘플 데이터 생성
- [ ] RLS 정책 설정 완료
- [ ] Vercel 환경변수 설정 완료

배포 후:
- [ ] Production URL에서 로그인 테스트
- [ ] Preview URL에서 게스트 접속 테스트
- [ ] 두 환경에서 데이터 정상 표시 확인
- [ ] 모바일에서도 테스트

---

## 📚 참고 자료

- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Supabase RLS 가이드](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js 환경변수](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

