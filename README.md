# Weekly Scrum

팀의 주간 업무를 한눈에 관리하는 Next.js 기반 스크럼 대시보드입니다.

## 기능

- 📊 **Work Map**: 팀원별 업무 현황 시각화
- 📅 **Calendar**: 연간 캘린더 + 히트맵 뷰
- 📝 **Snapshots**: 주간 스냅샷 상세 보기
- ✍️ **Manage**: 스냅샷 생성/수정/삭제
- 📈 **다양한 분석 뷰**: 요약, 리포트, 리스크, 협업 등

## 기술 스택

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Postgres + Auth + RLS)
- **배포**: Vercel (권장)

## 환경 설정

### 1. 환경변수 설정

`.env.local` 파일을 생성하고 다음 환경변수를 설정합니다:

```bash
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# 기본 워크스페이스 ID
DEFAULT_WORKSPACE_ID=00000000-0000-0000-0000-000000000001

# 데이터 소스 (true: Supabase, false: 정적 파일)
USE_SUPABASE_DATA=true
```

### 2. Supabase 설정

1. [Supabase Console](https://supabase.com)에서 프로젝트 생성
2. 다음 테이블 생성:
   - `workspaces`
   - `workspace_members`
   - `snapshots`
   - `snapshot_entries`
   - `plans`
   - `plan_assignees`
3. RLS 정책 적용
4. Auth > Email Provider 활성화

### 3. 의존성 설치 및 실행

```bash
# 의존성 설치
yarn install

# 개발 서버 실행
yarn dev

# 빌드
yarn build
```

### 4. 정적 데이터 마이그레이션 (선택사항)

기존 `data/` 디렉토리의 정적 데이터를 Supabase로 마이그레이션:

```bash
yarn db:migrate
```

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `yarn dev` | 개발 서버 실행 (Turbopack) |
| `yarn build` | 프로덕션 빌드 |
| `yarn start` | 프로덕션 서버 실행 |
| `yarn lint` | 린트 검사 |
| `yarn scrum:parse` | submitted-scrum.txt 파싱 |
| `yarn db:migrate` | 정적 데이터 → Supabase 마이그레이션 |

## 데이터 스키마

### 스냅샷 (v3 - ISO 주차 기준)

```json
{
  "year": 2025,
  "week": "W49",
  "weekStart": "2025-12-01",
  "weekEnd": "2025-12-07",
  "schemaVersion": 3,
  "items": [
    {
      "name": "홍길동",
      "domain": "Frontend",
      "project": "프로젝트명",
      "module": "모듈명",
      "feature": "기능명",
      "pastWeek": {
        "tasks": [
          { "title": "작업1 완료", "progress": 100 }
        ],
        "risk": null,
        "riskLevel": null,
        "collaborators": []
      },
      "thisWeek": {
        "tasks": ["다음 주 계획"]
      }
    }
  ]
}
```

## 인증 흐름

1. `/login` → Email OTP 입력
2. 이메일로 로그인 링크 발송
3. 링크 클릭 → `/auth/callback` → 세션 생성
4. 첫 로그인 시 `workspace_members`에 자동 등록

## 문제 해결

### 체크리스트

- [ ] `.env.local` 환경변수가 올바르게 설정되었는지 확인
- [ ] Supabase Auth > URL Configuration에 Redirect URL 추가
  - `http://localhost:3000/auth/callback` (개발)
  - `https://your-domain.com/auth/callback` (프로덕션)
- [ ] `workspace_members`에 사용자가 등록되었는지 확인 (RLS 차단 원인)
- [ ] RLS 정책이 올바르게 적용되었는지 확인

### 일반적인 오류

| 오류 | 원인 | 해결 |
|------|------|------|
| `401 Unauthorized` | 미로그인 | 로그인 필요 |
| `403 Forbidden` | RLS 차단 | workspace_members 등록 확인 |
| `PGRST116` | 데이터 없음 | 마이그레이션 실행 |

## 라이선스

MIT
