# Weekly Scrum

팀의 주간 업무를 한눈에 관리하는 Next.js 기반 협업 도구입니다.

## 소개

Weekly Scrum은 팀 단위로 주간 업무 현황을 체계적으로 관리하고 시각화하는 웹 애플리케이션입니다.
각 팀원이 작성한 주간 스냅샷을 통해 업무 진행 상황, 협업 관계, 리스크를 한눈에 파악할 수 있습니다.

## 주요 기능

### Community

#### Feedbacks

- 스냅샷과 업무에 대한 피드백 작성 및 관리
- 피드백 해결 상태 추적

### Works

#### Team Feed

- 팀원들의 최근 스냅샷 엔트리를 시간순으로 확인
- 작성자, 날짜 범위, 협업자별 필터링
- 프로젝트/모듈/기능별 검색

#### Plans (간트 차트)

- 프로젝트 일정을 트리 구조로 시각화
- 역할별(Planning, Design, FE, BE, QA) 담당자 할당
- 드래그 앤 드롭으로 일정 조정
- 스프린트, 릴리즈, 배포 플래그 표시

#### Snapshots

- 주차별 스냅샷 상세 보기
- 과거 주차 작업 완료 내역
- 현재 주차 계획 및 진행 상황
- 리스크 및 협업자 정보

#### Work Map

- 팀원별 업무 현황 시각화
- 도메인별 업무 분포
- 프로젝트 참여 현황

#### Collaborator Graph

- 팀원 간 협업 네트워크 시각화
- 협업 빈도 및 강도 분석

### Personal Space

#### Dashboard

- 개인 대시보드
- 최근 스냅샷 요약
- 업무량 트렌드

#### Snapshot Management

- 주간 스냅샷 작성/수정/삭제
- 과거 주차 작업 기록
- 현재 주차 계획 입력
- 리스크 및 협업자 등록

### Admin Space (관리자 전용)

#### Dashboard

- 전체 스냅샷/엔트리 통계
- 주차별 현황
- 워크스페이스 멤버 관리

#### Plans Management

- 계획 생성/수정/삭제
- 담당자 할당
- 일정 조정

#### Meta Options

- 프로젝트/모듈/기능 옵션 관리
- 도메인 옵션 관리

#### Members

- 워크스페이스 멤버 관리
- 권한 설정

#### Menu Usage

- 메뉴별 사용 통계
- 페이지뷰 분석

#### Menu Settings

- 메뉴 표시/숨김 설정
- 메뉴 뱃지 커스터마이징

### Extras

#### Release Notes

- 버전별 릴리즈 노트
- 신규 기능 및 개선 사항

## 기술 스택

### Frontend

- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS**

### Backend & Database

- **Supabase**
  - PostgreSQL 데이터베이스
  - Row Level Security (RLS)
  - 인증 및 권한 관리
  - 실시간 데이터 동기화

### 주요 라이브러리

- **d3-force** - 네트워크 그래프
- **recharts** - 차트 시각화
- **reactflow** - 플로우 다이어그램
- **sonner** - 토스트 알림
- **zustand** - 상태 관리
- **date-fns** - 날짜 처리

## 빠른 시작

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
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Production 워크스페이스 ID
NEXT_PUBLIC_PROD_WORKSPACE_ID=your-workspace-id
```

### 4. Supabase 설정

1. [Supabase Console](https://supabase.com)에서 프로젝트 생성
2. SQL Editor에서 데이터베이스 스키마 생성
3. Auth 설정:
   - Email Provider 활성화
   - Redirect URLs 등록
4. 워크스페이스 생성 및 사용자 추가

### 5. 개발 서버 실행

```bash
yarn dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 사용 방법

### 로그인

1. 이메일로 Magic Link 로그인
2. 최초 로그인 시 프로필 설정 (이름, 역할)

### 스냅샷 작성

1. Personal Space > Snapshot Management 메뉴 선택
2. 주차 선택 후 "새 스냅샷 작성" 클릭
3. 과거 주차 작업 및 현재 주차 계획 입력
4. 리스크 및 협업자 정보 추가

### 계획 관리 (관리자)

1. Works > Plans 메뉴 선택
2. 간트 차트에서 계획 생성/수정
3. 담당자 할당 및 일정 조정

## 데이터 구조

### 스냅샷 엔트리

```typescript
interface SnapshotEntry {
  snapshot_id: string;
  workspace_id: string;
  author_id: string;
  name: string;
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

### 계획

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

## 스크립트

| 명령어       | 설명               |
| ------------ | ------------------ |
| `yarn dev`   | 개발 서버 실행     |
| `yarn build` | 프로덕션 빌드      |
| `yarn start` | 프로덕션 서버 실행 |
| `yarn lint`  | 린트 검사          |

## 문제 해결

### 일반적인 오류

- **401 Unauthorized**: 로그인 필요
- **403 Forbidden**: RLS 정책 확인, workspace_members 등록 확인
- **PGRST116**: 데이터 없음, 마이그레이션 실행 필요

### 체크리스트

- [ ] `.env.local` 환경변수 확인
- [ ] Supabase Redirect URL 등록
- [ ] `workspace_members` 테이블에 사용자 등록
- [ ] RLS 정책 적용 확인
- [ ] `profiles` 테이블에 프로필 생성 확인

## 라이선스

MIT
