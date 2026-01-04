# 빠른 테스트 가이드

## 🚀 로컬에서 5분 안에 테스트하기

### Production 모드 테스트

1. **`.env.local` 편집:**

   ```env
   NEXT_PUBLIC_APP_MODE=prod
   NEXT_PUBLIC_SUPABASE_URL=your-prod-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-key
   ```

2. **실행:**

   ```bash
   yarn dev
   ```

3. **브라우저에서 확인:**
   - http://localhost:3000/login 접속
   - ✅ 이메일 입력 폼이 보이면 성공!
   - 이메일 입력 → Magic Link 수신 → 로그인

---

### Demo 모드 테스트

1. **`.env.local` 편집:**

   ```env
   NEXT_PUBLIC_APP_MODE=demo
   NEXT_PUBLIC_SUPABASE_URL=your-demo-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-demo-key
   NEXT_PUBLIC_DEMO_WORKSPACE_ID=00000000-0000-0000-0000-000000000002
   ```

2. **실행:**

   ```bash
   yarn dev
   ```

3. **브라우저에서 확인:**
   - http://localhost:3000/login 접속
   - ✅ "게스트로 계속하기" 버튼이 보이면 성공!
   - 클릭 → 메인 페이지로 바로 이동

---

## 🔄 빠른 전환 (선택사항)

### `.env.demo` 파일 생성

로컬에서 자주 모드를 전환한다면:

```bash
# 1. .env.demo 파일 생성
cat > .env.demo << EOF
NEXT_PUBLIC_APP_MODE=demo
NEXT_PUBLIC_SUPABASE_URL=your-demo-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-demo-key
NEXT_PUBLIC_DEMO_WORKSPACE_ID=00000000-0000-0000-0000-000000000002
EOF

# 2. Demo 모드로 실행 (3001 포트)
yarn dev:demo

# 3. Production 모드는 여전히
yarn dev
```

---

## 🌐 Vercel에서 테스트

### 환경변수만 설정하면 끝!

**Vercel Dashboard → Settings → Environment Variables**

#### Production 설정

```
Name: NEXT_PUBLIC_APP_MODE
Value: prod
Environment: ✅ Production
```

```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://your-prod.supabase.co
Environment: ✅ Production
```

#### Preview (Demo) 설정

```
Name: NEXT_PUBLIC_APP_MODE
Value: demo
Environment: ✅ Preview
```

```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://your-demo.supabase.co
Environment: ✅ Preview
```

### 배포 및 확인

```bash
# main 브랜치 push
git push origin main
# → https://your-app.vercel.app (Production 모드)

# demo 브랜치 push
git push origin demo
# → https://your-app-git-demo.vercel.app (Demo 모드)
```

---

## ✅ 체크리스트

### Supabase 준비

**Production 프로젝트:**

- [ ] 워크스페이스 생성
- [ ] 사용자를 workspace_members에 추가
- [ ] Email 인증 활성화 (Confirm Email OFF)

**Demo 프로젝트:**

- [ ] Demo 워크스페이스 생성 (ID: `00000000-0000-0000-0000-000000000002`)
- [ ] 샘플 데이터 추가
- [ ] 익명 읽기 허용 RLS 정책:
  ```sql
  CREATE POLICY "Demo data is readable by everyone"
  ON snapshots FOR SELECT
  USING (workspace_id = '00000000-0000-0000-0000-000000000002');
  ```

### 로컬 테스트

- [ ] `.env.local` 파일 생성
- [ ] Production 모드 실행 → 로그인 폼 확인
- [ ] Demo 모드 전환 → 게스트 버튼 확인
- [ ] 두 모드 모두 데이터 표시 확인

### Vercel 배포

- [ ] 환경변수 설정 (Production + Preview)
- [ ] main 브랜치 배포 → Production URL 확인
- [ ] demo 브랜치 배포 → Preview URL 확인
- [ ] 두 환경 모두 정상 동작 확인

---

## 🐛 문제 해결

### 로그인 후 "워크스페이스가 없습니다" 오류

```sql
-- 사용자를 워크스페이스에 추가
INSERT INTO workspace_members (workspace_id, user_id, role)
VALUES (
  'your-workspace-id',
  'auth-user-id',
  'owner'
);
```

### Demo 모드에서 데이터가 안 보임

1. RLS 정책 확인
2. Demo workspace ID가 정확한지 확인
3. Supabase Anon Key가 올바른지 확인

### "게스트로 계속하기" 버튼이 안 보임

`.env.local`에서 확인:

```env
NEXT_PUBLIC_APP_MODE=demo  # 'prod'가 아닌 'demo'
```

---

## 💡 팁

1. **로컬에서는** `.env.local` 하나로 충분

   - 모드 전환: `NEXT_PUBLIC_APP_MODE` 값만 변경

2. **Vercel에서는** 파일 없이 Dashboard에서 설정

   - Production/Preview 환경별로 자동 적용

3. **자주 전환한다면** `.env.demo` 파일 + `yarn dev:demo` 사용

4. **Git에는** `.env.*` 파일을 절대 커밋하지 마세요!
