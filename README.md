# Weekly Scrum

팀의 주간 업무를 한눈에 관리하는 Next.js 기반 스크럼 대시보드입니다.

## 🎯 서비스 목적

Weekly Scrum은 **팀의 주간 업무 현황을 체계적으로 관리하고 시각화**하기 위해 개발된 웹 애플리케이션입니다.

### 핵심 가치

1. **투명성 (Transparency)**

   - 팀원들의 주간 작업 내용을 한 곳에서 확인
   - 프로젝트, 모듈, 기능별로 체계적으로 분류된 업무 현황
   - 과거 주차와 현재 주차의 작업 진행 상황 비교

2. **협업 효율성 (Collaboration Efficiency)**

   - 협업자 정보를 통한 팀 내 협업 관계 파악
   - 리스크 공유 및 조기 대응
   - 역할 기반 업무 할당 및 추적

3. **데이터 기반 의사결정 (Data-Driven Decision Making)**

   - 주간 스냅샷 데이터를 통한 업무량 분석
   - 캘린더 히트맵을 통한 장기 트렌드 파악
   - 협업 네트워크 분석을 통한 팀 구조 이해

4. **계획 및 추적 (Planning & Tracking)**
   - 간트 차트를 통한 프로젝트 일정 관리
   - 역할별(Planning, Design, FE, BE, QA) 업무 할당 및 진행 상황 추적
   - 스프린트, 릴리즈, 배포 등 주요 이벤트 플래그 관리

### 해결하는 문제

- **정보 산재**: 팀원들의 업무 현황이 여러 채널에 분산되어 파악이 어려움
- **추적 어려움**: 주간 업무의 진행 상황과 이슈를 체계적으로 추적하기 어려움
- **협업 가시성 부족**: 누가 무엇을 하고 있는지, 누구와 협업하고 있는지 파악이 어려움
- **계획과 실제의 괴리**: 계획된 업무와 실제 진행 상황을 비교하기 어려움

---

## 🌐 데모 환경

**데모를 바로 체험해보세요:**

👉 **[https://weekly-scrum-demo.vercel.app](https://weekly-scrum-demo.vercel.app)**

데모 환경에서는:

- **Continue as Guest** 버튼을 통해 로그인 없이 즉시 접속 가능
- 회원가입을 통해 새 계정을 생성하고 환경을 둘러볼 수 있음
- 2025년 12월 ~ 2026년 2월 기간의 샘플 데이터 제공
- 모든 주요 기능을 제한 없이 체험 가능

---

## ✨ 주요 기능

### 📊 Works (업무 관리)

- **Team Feed**: 팀원들의 최근 스냅샷 엔트리를 시간순으로 확인

  - 작성자, 날짜 범위, 협업자 필터링
  - 프로젝트/모듈/기능별 검색
  - 전체 스냅샷 엔트리 통계 표시

- **Plans (간트 차트)**: 프로젝트 일정을 시각적으로 관리

  - 트리 구조로 프로젝트/모듈/기능 계층 표시
  - 역할별(Planning, Design, FE, BE, QA) 담당자 할당
  - 스프린트, 릴리즈, 배포 플래그 표시
  - 드래그 앤 드롭으로 일정 조정
  - 레인 추가/삭제 및 컨텍스트 메뉴

- **Snapshots**: 주차별 스냅샷 상세 보기

  - 주차별 업무 현황 카드 뷰
  - 과거 주차 작업 완료 내역
  - 현재 주차 계획 및 진행 상황
  - 리스크 및 협업자 정보

- **Work Map**: 팀원별 업무 현황 시각화

  - 도메인별 업무 분포
  - 프로젝트 참여 현황
  - 업무량 레벨 표시

- **Collaborator Graph**: 협업 네트워크 시각화
  - 팀원 간 협업 관계 그래프
  - 협업 빈도 및 강도 분석

### 📅 Personal Space (개인 공간)

- **Dashboard**: 개인 대시보드

  - 최근 스냅샷 요약
  - 업무량 트렌드
  - 협업 현황

- **Snapshot Management**: 스냅샷 생성/수정/삭제
  - 주간 스냅샷 작성
  - 과거 주차 작업 기록
  - 현재 주차 계획 입력
  - 리스크 및 협업자 등록

### 📈 분석 및 리포트

- **Calendar**: 연간 캘린더 + 히트맵 뷰

  - 주차별 업무량 히트맵
  - 날짜별 스냅샷 확인

- **Summary**: 주간 요약 대시보드

  - 전체 팀 업무 현황 요약
  - 프로젝트별 진행 상황

- **Report**: 상세 리포트

  - 개인/팀 리포트 생성
  - 기간별 통계

- **Risks**: 리스크 관리

  - 팀 전체 리스크 현황
  - 리스크 레벨별 분류

- **Matrix**: 우선순위 매트릭스

  - 중요도/긴급도 매트릭스

- **Quadrant**: 사분면 분석

  - 업무 분류 및 분석

- **Releases**: 릴리즈 관리
  - 릴리즈 일정 및 현황

### 👥 Community

- **Feedbacks**: 피드백 관리
  - 스냅샷에 대한 피드백 작성
  - 피드백 해결 상태 관리

### ⚙️ Admin Space (관리자 전용)

- **Admin Dashboard**: 전체 통계 및 관리

  - 전체 스냅샷/엔트리 통계
  - 주차별 스냅샷 현황
  - 워크스페이스 멤버 관리

- **Plans Management**: 계획 관리

  - 계획 생성/수정/삭제
  - 담당자 할당
  - 일정 조정

- **Meta Options**: 메타 옵션 관리
  - 프로젝트/모듈/기능 옵션 관리
  - 도메인 옵션 관리

---

## 🛠 기술 스택

### Frontend

- **Next.js 15** (App Router) - React 프레임워크
- **React 19** - UI 라이브러리
- **TypeScript** - 타입 안전성
- **Tailwind CSS** - 유틸리티 기반 스타일링

### Backend & Database

- **Supabase** - 백엔드 플랫폼
  - PostgreSQL 데이터베이스
  - Row Level Security (RLS) 정책
  - 인증 및 권한 관리
  - 실시간 데이터 동기화

### 배포

- **Vercel** - 프론트엔드 배포 (권장)
- **Supabase Cloud** - 데이터베이스 호스팅

### 주요 라이브러리

- **d3-force** - 네트워크 그래프 시각화
- **recharts** - 차트 라이브러리
- **reactflow** - 플로우 차트
- **sonner** - 토스트 알림
- **zustand** - 상태 관리
- **date-fns** - 날짜 처리

---

## 🚀 빠른 시작

### 1. 저장소 클론

```bash
git clone <repository-url>
cd weekly-scrum
```

### 2. 의존성 설치

```bash
yarn install
```

### 3. 환경변수 설정

`.env.local` 파일을 생성하고 다음 환경변수를 설정합니다:

```bash
# App Mode: 'prod' 또는 'demo'
NEXT_PUBLIC_APP_MODE=prod

# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Production 워크스페이스 ID (선택사항)
NEXT_PUBLIC_PROD_WORKSPACE_ID=your-workspace-id

# Demo 워크스페이스 ID (선택사항)
NEXT_PUBLIC_DEMO_WORKSPACE_ID=00000000-0000-0000-0000-000000000002
```

> 💡 **Tip**: Demo 모드로 테스트하려면 `NEXT_PUBLIC_APP_MODE=demo`로 설정하세요.

### 4. Supabase 설정

1. [Supabase Console](https://supabase.com)에서 프로젝트 생성
2. SQL Editor에서 `schema.sql` 실행하여 데이터베이스 스키마 생성
3. Auth 설정:
   - **Email Provider** 활성화
   - **Confirm Email** OFF (Magic Link 사용 시)
4. 워크스페이스 생성 및 사용자 추가
5. (선택) 데모 데이터 생성: `complete-demo-data.sql` 실행

### 5. 개발 서버 실행

```bash
# 프로덕션 모드로 실행
yarn dev

# 데모 모드로 실행 (포트 3001)
yarn dev:demo
```

브라우저에서 [http://localhost:3000](http://localhost:3000) (또는 데모 모드의 경우 [http://localhost:3001](http://localhost:3001))을 열어 확인하세요.

---

## 📖 사용 방법

### Production 모드

1. **로그인**

   - `/login` 페이지에서 이메일 입력
   - 이메일로 발송된 Magic Link 클릭
   - 자동으로 로그인되어 메인 페이지로 이동

2. **프로필 설정** (최초 로그인 시)

   - 온보딩 페이지에서 `display_name` 입력
   - `basic_role` 선택 (Planning, Design, FE, BE, QA)

3. **스냅샷 작성**

   - 좌측 메뉴에서 "Snapshot Management" 클릭
   - 주차 선택 후 "새 스냅샷 작성" 클릭
   - 과거 주차 작업 및 현재 주차 계획 입력
   - 리스크 및 협업자 정보 추가

4. **계획 관리** (관리자)
   - "Plans" 메뉴에서 간트 차트 확인
   - 계획 생성/수정/삭제
   - 담당자 할당 및 일정 조정

### Demo 모드

1. **게스트 접속**

   - `/login` 페이지에서 "Continue as Guest" 버튼 클릭
   - 즉시 데모 워크스페이스로 접속

2. **회원가입** (선택)
   - `/login` 페이지에서 "회원가입" 탭 선택
   - 이름, 이메일, 비밀번호 입력
   - 가입 후 데모 환경에서 활동 가능

---

## 🎭 Demo vs Production 모드

이 프로젝트는 두 가지 모드를 지원합니다:

### Production 모드 (`NEXT_PUBLIC_APP_MODE=prod`)

- ✅ Magic Link 이메일 로그인
- ✅ RLS 정책으로 데이터 보호
- ✅ 워크스페이스 자동 할당
- ✅ 모든 기능 사용 가능
- 🎯 실제 서비스 운영용

### Demo 모드 (`NEXT_PUBLIC_APP_MODE=demo`)

- 🎪 Continue as Guest 버튼으로 즉시 접속
- 🎪 고정 Demo 워크스페이스 사용
- 🎪 샘플 데이터 제공 (2025-12 ~ 2026-02)
- 🎪 회원가입을 통한 새 계정 생성 가능
- 🎯 데모/테스트용

---

## 📝 스크립트

| 명령어             | 설명                                |
| ------------------ | ----------------------------------- |
| `yarn dev`         | 개발 서버 실행 (Turbopack)          |
| `yarn dev:demo`    | Demo 모드로 실행 (포트 3001)        |
| `yarn build`       | 프로덕션 빌드                       |
| `yarn build:demo`  | Demo 모드 빌드                      |
| `yarn start`       | 프로덕션 서버 실행                  |
| `yarn lint`        | 린트 검사                           |
| `yarn scrum:parse` | submitted-scrum.txt 파싱            |
| `yarn db:migrate`  | 정적 데이터 → Supabase 마이그레이션 |

---

## 🗄 데이터 스키마

### 스냅샷 엔트리 구조

```typescript
interface SnapshotEntry {
  snapshot_id: string;
  workspace_id: string;
  author_id: string;
  name: string; // profiles.display_name
  domain: string;
  project: string;
  module: string;
  feature: string;
  past_week: {
    tasks: Array<{
      title: string;
      progress: number;
    }>;
  };
  this_week: {
    tasks: Array<
      | string
      | {
          title: string;
          progress?: number;
        }
    >;
  };
  risks: Array<
    | string
    | {
        title: string;
        level: number;
      }
  >;
  risk_level: number;
  collaborators: string[];
}
```

### 계획 구조

```typescript
interface Plan {
  id: string;
  workspace_id: string;
  project: string;
  module: string;
  feature: string;
  stage: "planning" | "design" | "fe" | "be" | "qa";
  start_date: string;
  end_date: string;
  assignees: Array<{
    user_id: string;
    display_name: string;
    basic_role: string;
  }>;
}
```

---

## 🔐 인증 흐름

### Production 모드

1. `/login` → 이메일 입력
2. 이메일로 Magic Link 발송
3. 링크 클릭 → 자동 로그인
4. 메인 페이지로 이동

### Demo 모드

1. `/login` → "Continue as Guest" 버튼 클릭
2. 메인 페이지로 바로 이동 (고정 Demo 워크스페이스 사용)

또는

1. `/login` → "회원가입" 탭 선택
2. 이름, 이메일, 비밀번호 입력
3. 가입 완료 후 로그인

---

## 🐛 문제 해결

### 체크리스트

- [ ] `.env.local` 환경변수가 올바르게 설정되었는지 확인
- [ ] Supabase Auth > URL Configuration에 Redirect URL 추가
  - `http://localhost:3000/auth/callback` (개발)
  - `https://your-domain.com/auth/callback` (프로덕션)
- [ ] `workspace_members`에 사용자가 등록되었는지 확인 (RLS 차단 원인)
- [ ] RLS 정책이 올바르게 적용되었는지 확인
- [ ] `profiles` 테이블에 사용자 프로필이 생성되었는지 확인

### 일반적인 오류

| 오류               | 원인        | 해결                        |
| ------------------ | ----------- | --------------------------- |
| `401 Unauthorized` | 미로그인    | 로그인 필요                 |
| `403 Forbidden`    | RLS 차단    | workspace_members 등록 확인 |
| `PGRST116`         | 데이터 없음 | 마이그레이션 실행           |

---

## 📚 추가 문서

- [CHANGELOG.md](./CHANGELOG.md) - 버전별 변경 사항
- [DEPLOY.md](./DEPLOY.md) - 배포 가이드
- [docs/](./docs/) - 상세 문서

---

## 📄 라이선스

MIT

---

## 🙏 기여

이슈 및 풀 리퀘스트를 환영합니다! 프로젝트를 개선하는 데 도움을 주시면 감사하겠습니다.
