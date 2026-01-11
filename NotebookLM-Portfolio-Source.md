# Weekly Scrum / Snapshot 시스템 - 포트폴리오 소스 패키지

## 1. 프로젝트 개요

### 1.1 시스템의 목적

Weekly Scrum은 팀 단위로 주간 업무 현황을 체계적으로 관리하고 시각화하는 웹 애플리케이션입니다.
각 팀원이 작성한 주간 스냅샷을 통해 업무 진행 상황, 협업 관계, 리스크를 한눈에 파악할 수 있습니다.

### 1.2 해결하고자 한 핵심 문제

1. **구조화된 업무 추적**

   - 개인의 주관적 기록이 아니라 Domain → Project → Module → Feature 계층으로 분류된 구조화된 스냅샷
   - 흩어진 작업의 맥락을 계층 구조로 명확히 연결

2. **협업 관계의 명시화**

   - pair(동시 협업), pre(선행 의존), post(후행 전달) 관계를 명시적으로 기록
   - 팀 병목과 블로킹 요소를 조기 탐지하여 프로젝트 리스크 관리

3. **주차 기반 타임라인**

   - ISO Week 표준을 채택하여 연도/월 경계 문제 해결
   - 주차별 스냅샷 작성 단위와 세부 작업(Entry) 단위를 2단계로 분리

4. **역할 기반 접근 제어**
   - Admin/Manager/Member 역할로 데이터 무결성과 권한 분리 보장
   - Supabase Row Level Security로 workspace 단위 멀티테넌시 구현

### 1.3 스냅샷 데이터의 활용

스냅샷에 기록된 정보는 다음과 같이 활용됩니다.

- Domain: 역할/역량 분포 분석 (Planning, Design, Frontend, Backend, Operation 등)
- Project: 프로젝트별 업무 흐름 파악
- Module: 기능 단위 집중도 및 병목 분석
- Feature: 세부 기능 추적, 진행률/리스크 집계
- Past Week Tasks: 개별 작업 진행률 (0-100%), Feature 단위 평균 계산
- Collaborators: 협업 패턴 분석, 블로킹 요소 탐지

### 1.4 기술 스택

- Frontend: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- Backend & Database: Supabase (PostgreSQL, RLS, 인증/권한 관리, 실시간 동기화)
- 시각화: d3-force (네트워크 그래프), recharts (차트), reactflow (다이어그램)
- 상태 관리: zustand

### 1.5 시스템 진화 방향

- v1 → v2 → v3 스키마 진화 과정을 코드에서 호환성 유지
- Personal Dashboard: 개인 메트릭 집계 (스냅샷 작성 현황, 할당된 계획, 도메인 분포)
- Alignment 간트 차트: Plans와 Snapshot Entries 타임라인 통합 시각화
- ISO Week 일관성: 전체 앱에서 일관된 주차 계산 로직 적용

---

## 2. 핵심 도메인 구조

### 2.1 주요 타입 정의

#### 2.1.1 리스크와 협업 관계 (src/types/scrum.ts)

```typescript
/**
 * 리스크 레벨 타입
 * 0 = 없음
 * 1 = 경미 (업무 외적 부담, 일정 영향 없음)
 * 2 = 중간 (병목 가능성 있음, 일정 영향 가능)
 * 3 = 심각 (즉각적인 논의 필요, 일정 지연 확정)
 */
export type RiskLevel = 0 | 1 | 2 | 3;

/**
 * 협업 관계 타입
 * pair: 실시간 공동 협업 (pair partner)
 * pre: 앞단 협업자 - 내 작업에 필요한 선행 입력 제공 (pre partner)
 * post: 후단 협업자 - 내 결과물을 받아 다음 단계 수행 (post partner)
 */
export type Relation = "pair" | "pre" | "post";

/**
 * 협업자 타입
 * - relations: 배열 (복수 관계 선택 지원)
 */
export interface Collaborator {
  name: string;
  relations?: Relation[];
}

/**
 * Past Week Task 타입
 * - DB 및 대부분의 코드에서 사용
 */
export interface PastWeekTask {
  title: string;
  progress: number; // 0-100
}

/**
 * Past Week 블록 타입
 */
export interface PastWeek {
  tasks: PastWeekTask[];
  risk: string[] | null;
  riskLevel: RiskLevel | null;
  collaborators: Collaborator[];
}

/**
 * This Week 블록 타입
 */
export interface ThisWeek {
  tasks: string[];
}

/**
 * v2 스크럼 항목 타입
 * Domain → Project → Module → Feature 계층 구조
 */
export interface ScrumItemV2 {
  name: string;
  domain: string; // 업무 관점 (Planning, Design, Frontend, Backend 등)
  project: string; // 프로젝트명
  module: string; // 프로젝트 내 모듈
  feature: string; // 모듈 내 구체적 기능
  pastWeek: PastWeek;
  thisWeek: ThisWeek;
}
```

#### 2.1.2 데이터베이스 스키마 (src/lib/supabase/types.ts)

```typescript
export interface Database {
  public: {
    Tables: {
      // 사용자 프로필
      profiles: {
        Row: {
          user_id: string;
          display_name: string;
          email: string;
          basic_role?: string | null; // 기본 역할 (PM, Designer, Developer 등)
          created_at: string;
          updated_at: string;
        };
      };

      // 워크스페이스 (멀티테넌시 단위)
      workspaces: {
        Row: {
          id: string;
          name: string;
          is_demo?: boolean | null;
          created_at: string;
        };
      };

      // 워크스페이스 멤버 (권한 관리)
      workspace_members: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          role: "owner" | "admin" | "member"; // 역할 기반 접근 제어
          created_at: string;
        };
      };

      // 스냅샷 (주차별 작성 단위)
      snapshots: {
        Row: {
          id: string;
          workspace_id: string;
          author_id: string | null;
          author_display_name: string | null;
          week_start_date: string; // ISO Week 시작일
          week_end_date: string | null; // ISO Week 종료일
          year: number | null; // ISO 연도
          week: string | null; // ISO 주차 (W01 ~ W53)
          workload_level: WorkloadLevel | null; // 업무 부담 수준
          workload_note: string | null;
          created_at: string;
          updated_at: string;
        };
      };

      // 스냅샷 엔트리 (세부 작업 단위)
      snapshot_entries: {
        Row: {
          id: string;
          snapshot_id: string; // 상위 스냅샷 참조
          workspace_id: string;
          author_id: string;
          name: string;
          domain: string; // 업무 관점 분류
          project: string; // 프로젝트
          module: string; // 모듈
          feature: string; // 기능
          past_week: PastWeekData; // 지난 주 작업 (tasks + progress)
          this_week: ThisWeekData; // 이번 주 계획
          risk: RiskData; // 리스크 상세
          risks: string[]; // 리스크 목록
          risk_level: number; // 리스크 레벨 (0-3)
          collaborators: Collaborator[]; // 협업자 목록 (name + relations)
          created_at: string;
          updated_at: string;
        };
      };

      // 계획 (간트 차트 데이터)
      plans: {
        Row: {
          id: string;
          workspace_id: string;
          project: string;
          module: string;
          feature: string;
          stage: "planning" | "design" | "fe" | "be" | "qa"; // 작업 단계
          start_date: string;
          end_date: string;
          assignees: Array<{
            // 담당자 목록
            user_id: string;
            display_name: string;
            basic_role: string;
          }>;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
}
```

### 2.2 데이터 관계

```
워크스페이스 기반 멀티테넌시
┌─────────────────────────────────────────────────┐
│ workspaces                                       │
│ - id (workspace_id)                              │
│ - name                                           │
└────────────┬────────────────────────────────────┘
             │
             ├─────────────────────────────────────┐
             │                                     │
             ▼                                     ▼
┌────────────────────────┐          ┌─────────────────────────┐
│ workspace_members      │          │ snapshots               │
│ - workspace_id (FK)    │          │ - workspace_id (FK)     │
│ - user_id (FK)         │          │ - author_id (FK)        │
│ - role                 │          │ - week_start_date       │
│   (owner/admin/member) │          │ - year, week (ISO Week) │
└────────┬───────────────┘          └──────────┬──────────────┘
         │                                     │
         ▼                                     ▼
┌────────────────────────┐          ┌─────────────────────────┐
│ profiles               │          │ snapshot_entries        │
│ - user_id (PK)         │          │ - snapshot_id (FK)      │
│ - display_name         │          │ - workspace_id (FK)     │
│ - basic_role           │          │ - domain/project/       │
└────────────────────────┘          │   module/feature        │
                                    │ - past_week, this_week  │
                                    │ - risks, collaborators  │
                                    └─────────────────────────┘

계획 관리 (간트 차트)
┌─────────────────────────┐
│ plans                   │
│ - workspace_id (FK)     │
│ - project/module/       │
│   feature               │
│ - stage (planning/      │
│   design/fe/be/qa)      │
│ - assignees[]           │
└─────────────────────────┘
```

**핵심 설계 포인트**

1. **2단계 구조**: Snapshot (주차별 작성 단위) → Entry (세부 작업 단위)
2. **ISO Week 기준**: year, week, week_start_date, week_end_date로 일관된 타임라인
3. **계층적 분류**: domain → project → module → feature (4단계 계층)
4. **협업 관계**: Collaborator에 name + relations[] (pair/pre/post)
5. **리스크 추적**: risks[] (목록) + risk_level (0-3 레벨)
6. **멀티테넌시**: workspace_id 기반, RLS로 접근 제어

---

## 3. 사용자 흐름

### 3.1 Personal Dashboard

#### 3.1.1 페이지 구조 (src/app/(scrum)/my/page.tsx)

```typescript
/**
 * Personal Space > Dashboard
 *
 * 데이터 전용 개인 분석 뷰
 * - 개인 메트릭만 표시
 */
export default async function MyPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 프로필 조회와 메트릭 조회를 병렬로 실행
  const [profileResult, metrics] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .single(),
    getPersonalDashboardMetrics({
      workspaceId: DEFAULT_WORKSPACE_ID,
      userId: user.id,
    }),
  ]);

  const userName = profileResult.data?.display_name;

  return <DataOnlyDashboard userName={userName} metrics={metrics} />;
}
```

#### 3.1.2 데이터 흐름

**getPersonalDashboardMetrics() 집계 항목**

```typescript
interface PersonalDashboardMetrics {
  snapshots: {
    total_weeks: number; // 작성한 주차 수
    total_entries: number; // 전체 엔트리 수
    this_week_entries: number; // 이번 주 작성 수
    last_week_entries: number; // 지난 주 작성 수
  };

  plans: {
    total_plans: number; // 할당된 전체 계획 수
    active_plans: number; // 현재 활성 계획 수
  };

  usage: {
    total_visits: number; // 메뉴 방문 총 횟수
    last_7_days_visits: number; // 최근 7일 방문 수
    last_14_days_visits: number; // 최근 14일 방문 수
    top_routes: Array<{
      route: string;
      count: number;
    }>;
  };

  recentEntries: Array<{
    // 최근 작성 엔트리 (최대 5개)
    id: string;
    domain: string;
    project: string;
    feature: string;
    created_at: string;
  }>;

  domainDistribution: Array<{
    // 도메인별 활동 분포 (Top 10)
    domain: string;
    count: number;
  }>;

  weeklyTrend: Array<{
    // 주차별 엔트리 수 추이 (최근 8주)
    week: string;
    count: number;
  }>;
}
```

**UI 표시 구조** (src/components/weekly-scrum/my/DataOnlyDashboard.tsx)

1. 전체 메트릭 테이블 (한눈에 보기)
   - 스냅샷 작성 현황, 할당된 계획, 메뉴 사용 통계
2. 최근 작성한 스냅샷 엔트리 (카드 형식, 최근 5개)
3. 도메인/프로젝트 활동 분포 (그라디언트 바 차트, Top 10)
4. 주차별 엔트리 수 추이 (세로 바 차트, 최근 8주)

### 3.2 Snapshot Management

#### 3.2.1 페이지 구조 (src/app/(scrum)/manage/snapshots/page.tsx)

```typescript
export default async function ManageSnapshotsPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return (
    <SnapshotsMainView userId={user.id} workspaceId={DEFAULT_WORKSPACE_ID} />
  );
}
```

#### 3.2.2 UI 상태 구조 (src/app/(scrum)/manage/snapshots/\_components/SnapshotsMainView.tsx)

```typescript
/**
 * 스냅샷 관리 메인 뷰
 *
 * - 좌측/상단: 연도 + ISO 주차 선택 UI
 * - 중앙: 스냅샷 목록 (Pinterest/리스트 토글)
 * - 우측: 주차 메타데이터 요약 (접힘/더보기)
 * - 우측 상단: 편집하기 / 새로 작성하기 버튼
 */

interface SnapshotsMainViewProps {
  userId: string;
  workspaceId: string;
}

export interface SnapshotSummary {
  id: string;
  created_at: string;
  updated_at: string;
  workload_level?: WorkloadLevel | null;
  workload_note?: string | null;
  entriesCount: number;
  entries: {
    id: string;
    domain: string;
    project: string;
    module: string | null;
    feature: string | null;
    past_week?: PastWeekData;
    this_week?: ThisWeekData;
    risks?: string[];
    risk_level?: number;
    collaborators?: Collaborator[];
  }[];
}

export interface WeekStatsData {
  projectCount: number; // 프로젝트 수
  moduleCount: number; // 모듈 수
  featureCount: number; // 기능 수
  avgProgress: number | null; // 평균 진행률
  domainDistribution: Record<string, number>; // 도메인별 분포
  totalEntries: number; // 전체 엔트리 수
}
```

#### 3.2.3 상태 관리 및 조건 분기

**핵심 상태** (useSnapshotsState hook)

```typescript
const {
  selectedYear, // ISO 연도
  selectedWeek, // ISO 주차 (1-53)
  viewMode, // 'grid' | 'list'
  allExpanded, // 전체 카드 확장/축소
  isSelectMode, // 선택 모드 활성화
} = useSnapshotsState();
```

**필터링 로직** (useSnapshotsFilters hook)

```typescript
const {
  projectFilters, // Set<string> (활성화된 프로젝트)
  moduleFilters, // Set<string> (활성화된 모듈)
  featureFilters, // Set<string> (활성화된 기능)
  filteredSnapshots, // 필터링된 스냅샷 목록
  hasActiveFilters, // 필터 활성 여부
  clearFilters, // 필터 초기화
} = useSnapshotsFilters(snapshots);
```

**조건 분기**

1. **주차 선택**

   - `selectedYear`, `selectedWeek` 변경 시 해당 주차 스냅샷 조회
   - ISO Week 기준으로 week_start_date 계산

2. **뷰 모드**

   - `viewMode === 'grid'`: Pinterest 레이아웃 (가변 높이 카드)
   - `viewMode === 'list'`: 리스트 레이아웃 (고정 높이 행)

3. **필터링**

   - 프로젝트/모듈/기능 필터가 활성화된 경우
   - 각 엔트리가 하나 이상의 활성 필터와 일치하는지 확인
   - 일치하는 엔트리만 표시

4. **메타데이터 패널**
   - `isMetaPanelExpanded`: 우측 패널 확장/축소
   - 주차별 통계 (프로젝트 수, 평균 진행률, 도메인 분포) 표시

---

## 4. 권한과 역할 분기

### 4.1 역할 정의 (src/lib/auth/getWorkspaceRole.ts)

```typescript
/**
 * Workspace Role 타입
 * - admin: 관리자 (전체 데이터 관리 권한)
 * - manager: 매니저 (관리자와 동일 권한)
 * - member: 일반 멤버
 */
export type WorkspaceRole = "admin" | "manager" | "member" | null;

/**
 * 현재 로그인 유저의 workspace role을 조회 (Server Only)
 *
 * @param workspaceId - 워크스페이스 ID
 * @returns role 또는 null (멤버가 아니거나 조회 실패 시)
 */
export async function getWorkspaceRole(
  workspaceId?: string
): Promise<WorkspaceRole> {
  const targetWorkspaceId = workspaceId || process.env.DEFAULT_WORKSPACE_ID;

  if (!targetWorkspaceId) {
    return null;
  }

  try {
    const supabase = await createClient();

    // 현재 로그인 유저 확인
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return null;
    }

    // workspace_members에서 role 조회
    const { data: member, error: memberError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", targetWorkspaceId)
      .eq("user_id", user.id)
      .single();

    if (memberError || !member) {
      return null;
    }

    return member.role as WorkspaceRole;
  } catch {
    return null;
  }
}

/**
 * 현재 유저가 관리자(admin 또는 manager)인지 확인
 */
export async function isAdminOrManager(workspaceId?: string): Promise<boolean> {
  const role = await getWorkspaceRole(workspaceId);
  return role === "admin" || role === "manager";
}
```

### 4.2 접근 제어 패턴

#### 4.2.1 Server Component에서 역할 조회 (src/app/(scrum)/layout.tsx)

```typescript
export default async function ScrumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id;

  // 프로필 완성 여부 확인
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile) {
      redirect("/onboarding/profile");
    }
  }

  // 독립적인 쿼리들을 병렬로 실행
  const [role, menuSettingsResult, menuStatsResult, supabaseDataResult] =
    await Promise.allSettled([
      getWorkspaceRole(), // 현재 유저의 역할 조회
      getMenuSettings(DEFAULT_WORKSPACE_ID),
      getMenuStats({
        workspaceId: DEFAULT_WORKSPACE_ID,
        userId,
      }),
      getSupabaseOnlyData(DEFAULT_WORKSPACE_ID),
    ]);

  const roleValue = role.status === "fulfilled" ? role.value : null;

  return (
    <ScrumProvider
      allData={allData}
      weeks={weeks}
      initialWeekKey={initialWeekKey}
    >
      <LayoutWrapper
        role={roleValue} // 역할을 하위 컴포넌트에 전달
        workspaceId={DEFAULT_WORKSPACE_ID}
        userId={userId}
        menuSettings={menuSettings}
        menuStats={menuStats}
      >
        <MainContent>{children}</MainContent>
      </LayoutWrapper>
    </ScrumProvider>
  );
}
```

#### 4.2.2 조건부 렌더링 패턴

**Navigation에서 역할 기반 메뉴 표시**

```typescript
function Navigation({ role, menuSettings, menuStats }: NavigationProps) {
  // Admin/Manager만 접근 가능한 메뉴
  const isAdminOrManager = role === "admin" || role === "manager";

  return (
    <nav>
      {/* 모든 멤버에게 표시 */}
      <MenuItem href="/my">Personal Space</MenuItem>
      <MenuItem href="/works">Works</MenuItem>

      {/* Admin/Manager만 표시 */}
      {isAdminOrManager && (
        <>
          <MenuItem href="/admin">Admin Space</MenuItem>
          <MenuItem href="/admin/plans">Plans Management</MenuItem>
          <MenuItem href="/admin/meta-options">Meta Options</MenuItem>
          <MenuItem href="/admin/members">Members</MenuItem>
        </>
      )}
    </nav>
  );
}
```

#### 4.2.3 RLS (Row Level Security) 패턴

**workspace_members 기반 접근 제어**

Supabase RLS 정책을 통해 workspace_id 단위로 데이터 접근을 제한합니다.

```sql
-- snapshots 테이블 RLS 정책 예시
CREATE POLICY "Users can view snapshots in their workspace"
  ON snapshots
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create snapshots in their workspace"
  ON snapshots
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Admin/Manager만 다른 사용자의 스냅샷 수정 가능
CREATE POLICY "Admins can update any snapshots"
  ON snapshots
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'manager')
    )
  );
```

**의사결정 흐름**

1. 사용자가 페이지 접근 시 `getWorkspaceRole()` 호출
2. `workspace_members` 테이블에서 현재 유저의 role 조회
3. role 값을 Layout → Navigation → MenuItem으로 전달
4. 각 컴포넌트에서 role 기반 조건부 렌더링
5. DB 쿼리는 RLS 정책으로 workspace_id 기반 자동 필터링

---

## 출처 파일 목록

### 프로젝트 문서

- README.md
- CHANGELOG.md
- docs/snapshot-guide-v2.md
- docs/performance-final-report.md

### 타입 정의

- src/types/scrum.ts
- src/lib/supabase/types.ts

### 페이지 및 컴포넌트

- src/app/(scrum)/layout.tsx
- src/app/(scrum)/my/page.tsx
- src/app/(scrum)/manage/snapshots/page.tsx
- src/app/(scrum)/manage/snapshots/\_components/SnapshotsMainView.tsx
- src/components/weekly-scrum/my/DataOnlyDashboard.tsx

### 권한 관리

- src/lib/auth/getWorkspaceRole.ts

### 데이터 레이어

- src/lib/dashboard/getPersonalDashboardMetrics.ts
- src/lib/data/snapshots/index.ts

---

## 요약

이 시스템은 주간 업무를 구조화된 스냅샷으로 관리하여 다음 문제를 해결합니다.

1. **흩어진 작업의 맥락 확보**: Domain → Project → Module → Feature 계층 구조
2. **협업 병목 조기 탐지**: pair/pre/post 관계와 리스크 명시적 기록
3. **일관된 타임라인**: ISO Week 표준 채택
4. **역할 기반 접근 제어**: Admin/Manager/Member 권한 분리, RLS 기반 멀티테넌시

기술적 특징으로는 Snapshot → Entry 2단계 구조, 스키마 버전 호환성 유지, 병렬 쿼리 최적화, 개인/팀 대시보드를 통한 데이터 시각화 등이 있습니다.
