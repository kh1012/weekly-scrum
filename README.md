# Weekly Scrum Dashboard

팀원이 매주 제출하는 위클리 스크럼 텍스트를 자동으로 파싱하여 JSON으로 변환하고, Next.js + Tailwind 기반의 대시보드에서 시각화하는 시스템입니다. Notion 스타일의 UI/UX를 적용하여 깔끔하고 직관적인 사용자 경험을 제공합니다.

**주요 기능:**

- 스크럼 데이터 파싱 및 시각화
- 개인 대시보드 (개인별 업무 현황, 주차별 트렌드, 도메인/프로젝트별 분석)
- Shares 대시보드 (리더 공유 사항 마크다운 프리뷰)
- 다양한 뷰 모드 (요약, 카드, 프로젝트, 매트릭스, 사분면, 리스크)
- 주차별/범위별 데이터 조회
- 반응형 디자인 (모바일/태블릿/데스크탑)
- 전역 검색 (단축키: `Ctrl+K` / `⌘K`)
- 방문자 수 카운터 (Upstash Redis 연동)

---

## 시스템 개요

### 스크럼 데이터 흐름

1. `data/submitted-scrum.txt` 파일에 팀원들의 주간 스크럼 내용을 작성
2. `yarn scrum:parse` 스크립트를 실행하여 JSON 파일 생성
3. Next.js 대시보드에서 JSON 데이터를 시각화

### 인사이트 데이터 흐름

1. 스크럼 데이터를 기반으로 AI 에이전트가 인사이트 분석 결과 생성
2. `data/submitted-insight.txt` 파일에 분석 결과 저장
3. `yarn insight:parse` 스크립트를 실행하여 JSON 파일 생성
4. 인사이트 대시보드에서 리더용 분석 결과 시각화

### Shares 데이터 흐름

1. `yarn shares:create` 스크립트로 빈 마크다운 템플릿 생성
2. 리더들이 마크다운 파일에 공유 사항 작성
3. Shares 대시보드에서 마크다운 프리뷰 표시

---

## 스크럼 데이터 입력 포맷

각 스크럼 항목은 다음 형식으로 작성합니다:

```
[도메인 / 프로젝트 / 토픽]
- Name: 담당자 이름
- Plan: 이번 주 계획 (XX% 형식 권장)
- Progress: 진행 상황 (XX% 형식 권장)
- Next: 다음 주 계획
- Risk: 리스크 사항 (선택)
- RiskLevel: 리스크 레벨 0-3 (선택)
- Reason: 계획 대비 실행 미비 시 부연 설명 (선택)
```

### 예시

```
[Frontend / 스프레드시트 / 셀 렌더링 개선]
- Name: 김현
- Plan: 셀 최적화 100% 완료
- Progress: 셀 렌더링 구조화 및 개선작업 100% 완료
- Next: 렌더링 최적화 마무리 및 Publish 테스트 추가
- Risk: Publish 플로우에서 race condition 재발 가능성 확인
- RiskLevel: 1

[Backend / 권한 시스템 / 접근 제어 UX]
- Name: 김정빈
- Plan: AI Agent 기반 개발 100% 완료
- Progress: AI Agent 기반 개발 70% 완료
- Next: 완료하지 못했던 AI Agent 기반 개발 100% 달성
- Risk: 사내 행사 발표 준비
- RiskLevel: 2
- Reason: 중간 점검 과정에서 요구사항 변경으로 일부 기능이 재구현 필요해 일정이 지연되었습니다.
```

- 블록 간에는 빈 줄로 구분합니다.
- `Plan`/`Progress` 필드에 `XX%` 형식이 포함되면 자동으로 `planPercent`/`progressPercent`로 추출됩니다.

### 필드 설명

| 필드        | 필수 | 설명                             |
| ----------- | ---- | -------------------------------- |
| `Name`      | O    | 담당자 이름                      |
| `Plan`      | O    | 이번 주 계획                     |
| `Progress`  | O    | 실제 진행 상황                   |
| `Next`      | O    | 다음 주 계획                     |
| `Risk`      | X    | 리스크 사항                      |
| `RiskLevel` | X    | 0=없음, 1=경미, 2=중간, 3=심각   |
| `Reason`    | X    | 계획 대비 실행 미비 시 부연 설명 |

### 도메인 목록

도메인은 팀원들이 자유롭게 작성하며, 점진적으로 통일해 나갑니다.

| 도메인     | 설명                   |
| ---------- | ---------------------- |
| `Planning` | 기획                   |
| `Frontend` | 프론트엔드 (FE도 가능) |
| `Backend`  | 백엔드 (BE도 가능)     |
| `Design`   | 디자인                 |
| `Analysis` | 분석                   |
| `Writing`  | 문서화                 |
| `QA`       | 품질 검증              |
| `DevOps`   | DevOps / 인프라        |
| _(기타)_   | 자유롭게 추가 가능     |

- 등록된 도메인은 지정된 색상으로 표시됩니다.
- 미등록 도메인은 해시 기반으로 자동 색상이 할당됩니다.
- 도메인 색상 설정: `src/lib/colorDefines.ts` 참조

---

## 인사이트 데이터 입력 포맷

AI 에이전트가 생성한 인사이트 분석 결과를 다음 마크다운 형식으로 작성합니다:

```markdown
## Weekly Executive Summary

- 요약 문장 1
- 요약 문장 2

## Decision Points

- 의사결정 필요 항목 1
- 의사결정 필요 항목 2

## Risks & Required Actions

| Risk / Reason | Level | Required Action |
| ------------- | ----- | --------------- |
| 리스크 내용   | 2     | 조치 내용       |

## Execution Gap Analysis

- name: 이름 | project: 프로젝트 | gap: -30 | reason: 사유

## Quadrant Summary

q1: 6, q2: 3, q3: 2, q4: 1

- 사분면 해석 문장 1
- 사분면 해석 문장 2
```

> 자세한 AI 프롬프트 지침은 `leader_insight_instruction.md` 참조

---

## Shares 데이터 입력 포맷

리더 공유 사항은 마크다운 파일로 직접 작성합니다.

### 파일 경로

```
data/shares/YYYY-MM-WXX.md
```

**예시:** `data/shares/2025-12-W01.md`

### 기본 템플릿

`yarn shares:create` 스크립트를 실행하면 다음 템플릿이 생성됩니다:

```markdown
# YYYY년 M월 XX주차 리더 공유 사항

## 이번 주 핵심 성과

-

## 주요 논의 사항

### 1.

### 2.

## 다음 주 중점 과제

1.
2.
3.

## 기타 공유 사항

-
```

### 지원 마크다운 문법

- 헤딩 (`#`, `##`, `###` 등)
- 리스트 (`-`, `*`, `1.`)
- 테이블 (`|---|---|`)
- 볼드 (`**텍스트**`)
- 이탤릭 (`*텍스트*`)
- 인라인 코드 (`` `코드` ``)
- 링크 (`[텍스트](URL)`)
- 수평선 (`---`)

---

## 변환 스크립트 사용법

### 설치

```bash
yarn install
```

### 스크럼 데이터 파싱

```bash
yarn scrum:parse <year> <month> <week> "<range>"
```

**예시:**

```bash
yarn scrum:parse 2025 12 W01 "2025-12-02 ~ 2025-12-08"
```

**입력/출력:**

- **입력**: `data/submitted-scrum.txt`
- **출력**: `data/scrum/{year}/{month}/{year}-{month}-{week}.json`

### 인사이트 데이터 파싱

```bash
yarn insight:parse <year> <month> <week> "<range>" [input_file]
```

**예시:**

```bash
# 기본 입력 파일 사용
yarn insight:parse 2025 12 W01 "2025-12-02 ~ 2025-12-08"

# 커스텀 입력 파일 사용
yarn insight:parse 2025 12 W01 "2025-12-02 ~ 2025-12-08" insight-input.json
```

**입력/출력:**

- **입력**: `data/submitted-insight.txt` 또는 `data/submitted-insight.json`
- **출력**: `data/insights/{year}/{month}/{year}-{month}-{week}.json`

### Shares 마크다운 생성

```bash
# 현재 주차 기준으로 생성
yarn shares:create

# 특정 주차 지정
yarn shares:create <year> <month> <week>
```

**예시:**

```bash
# 현재 주차 기준
yarn shares:create

# 특정 주차 지정
yarn shares:create 2025 12 W02
```

**출력:** `data/shares/{year}-{month}-{week}.md`

> 이미 존재하는 파일은 덮어쓰지 않습니다.

---

## JSON 구조 설명

### 스크럼 데이터 구조

```json
{
  "year": 2025,
  "month": 12,
  "week": "W01",
  "range": "2025-12-02 ~ 2025-12-08",
  "items": [
    {
      "name": "김현",
      "domain": "Frontend",
      "project": "스프레드시트",
      "topic": "셀 렌더링 개선",
      "plan": "셀 최적화 100% 완료",
      "planPercent": 100,
      "progress": "셀 렌더링 구조화 및 개선작업 100% 완료",
      "progressPercent": 100,
      "reason": "",
      "next": "렌더링 최적화 마무리 및 Publish 테스트 추가",
      "risk": "Publish 플로우에서 race condition 재발 가능성",
      "riskLevel": 1
    }
  ]
}
```

#### 필드 설명

| 필드                      | 타입   | 설명                          |
| ------------------------- | ------ | ----------------------------- |
| `year`                    | number | 연도                          |
| `month`                   | number | 월                            |
| `week`                    | string | 주차 (예: W01)                |
| `range`                   | string | 날짜 범위                     |
| `items`                   | array  | 스크럼 항목 배열              |
| `items[].name`            | string | 담당자 이름                   |
| `items[].domain`          | string | 도메인 (Frontend, Backend 등) |
| `items[].project`         | string | 프로젝트명                    |
| `items[].topic`           | string | 작업 토픽                     |
| `items[].plan`            | string | 이번 주 계획                  |
| `items[].planPercent`     | number | 계획 진행률 (0-100)           |
| `items[].progress`        | string | 실제 진행 상황                |
| `items[].progressPercent` | number | 실제 진행률 (0-100)           |
| `items[].reason`          | string | 계획 대비 미달 사유           |
| `items[].next`            | string | 다음 주 계획                  |
| `items[].risk`            | string | 리스크 사항                   |
| `items[].riskLevel`       | number | 리스크 레벨 (0-3)             |

### 인사이트 데이터 구조

```json
{
  "year": 2025,
  "month": 12,
  "week": "W01",
  "range": "2025-12-02 ~ 2025-12-08",
  "insight": {
    "executiveSummary": ["요약 문장 1", "요약 문장 2"],
    "decisionPoints": ["의사결정 필요 항목 1"],
    "risks": [
      {
        "item": "리스크 내용",
        "level": 2,
        "action": "조치 내용"
      }
    ],
    "executionGap": [
      {
        "name": "담당자",
        "project": "프로젝트명",
        "gap": -30,
        "reason": "사유"
      }
    ],
    "quadrantSummary": {
      "q1": 6,
      "q2": 3,
      "q3": 2,
      "q4": 1,
      "explanation": ["사분면 해석 1", "사분면 해석 2"]
    }
  }
}
```

---

## Next.js UI 설명

### 개발 서버 실행

```bash
yarn dev
```

브라우저에서 `http://localhost:3000` 접속 (자동으로 `/summary`로 리다이렉트)

### 주요 페이지

| 페이지                      | 경로        | 설명                                           |
| --------------------------- | ----------- | ---------------------------------------------- |
| **요약** (Summary)          | `/summary`  | 전체 통계 및 요약 정보                         |
| **카드** (Cards)            | `/cards`    | 개별 스크럼 항목을 카드 형태로 표시            |
| **프로젝트** (Projects)     | `/projects` | 프로젝트별 그룹화된 뷰                         |
| **매트릭스** (Matrix)       | `/matrix`   | 멤버 × 프로젝트 매트릭스 뷰                    |
| **사분면** (Quadrant)       | `/quadrant` | 진행률-리스크 사분면 차트                      |
| **리스크** (Risks)          | `/risks`    | 리스크 항목 집중 뷰                            |
| **개인 대시보드** (My)      | `/my`       | 개인별 업무 현황, 트렌드 차트, 도메인/프로젝트 분석 |
| **Shares**                  | `/shares`   | 리더 공유 사항 마크다운 프리뷰                 |

### 주요 기능

- **필터링**: 도메인, 프로젝트, 멤버별 필터링
- **검색**: 이름, 토픽, 내용 검색 (`Ctrl+K` / `⌘K` 단축키 지원)
- **통계**: 전체 항목 수, 평균 진행률, 평균 계획률, 달성률, 리스크 항목 수 표시
- **주차 선택**: 단일 주차 또는 범위 선택 모드 지원
- **반응형**: 모바일/태블릿/데스크탑 반응형 레이아웃
- **Notion 스타일 UI**: 깔끔한 Notion 테마 기반 디자인
- **사이드바**: 접이식 사이드 네비게이션 (데스크탑), 팝오버 메뉴 (모바일)

### 사분면 차트 해석

| 사분면 | 진행률 | 리스크 | 의미                           |
| ------ | ------ | ------ | ------------------------------ |
| Q1     | 높음   | 낮음   | 순항 중 (안정적)               |
| Q2     | 낮음   | 낮음   | 진척 필요 (리스크 낮음)        |
| Q3     | 낮음   | 높음   | 주의 필요 (리스크 & 진척 문제) |
| Q4     | 높음   | 높음   | 관리 필요 (리스크 있지만 진행) |

---

## 컴포넌트 구조

```
src/
├── app/
│   ├── layout.tsx                # 루트 레이아웃
│   ├── globals.css               # 전역 스타일 (Notion 테마 CSS 변수)
│   ├── page.tsx                  # 홈 → /summary 리다이렉트
│   ├── (scrum)/                  # Route Group (URL에 미포함)
│   │   ├── layout.tsx            # 스크럼 공통 레이아웃 (Header, Sidebar, ScrumProvider)
│   │   ├── summary/page.tsx      # 요약 뷰
│   │   ├── cards/page.tsx        # 카드 뷰
│   │   ├── projects/page.tsx     # 프로젝트 뷰
│   │   ├── matrix/page.tsx       # 매트릭스 뷰
│   │   ├── quadrant/page.tsx     # 사분면 뷰
│   │   ├── risks/page.tsx        # 리스크 뷰
│   │   └── my/page.tsx           # 개인 대시보드
│   └── shares/                   # Shares (독립 레이아웃)
│       ├── layout.tsx
│       └── page.tsx
├── components/
│   ├── shares/                   # Shares 컴포넌트
│   │   ├── MarkdownRenderer.tsx  # 마크다운 렌더러
│   │   ├── SharesHeader.tsx
│   │   ├── SharesView.tsx
│   │   └── SharesWeekSelector.tsx
│   └── weekly-scrum/
│       ├── cards/                # 카드 뷰 컴포넌트
│       │   ├── CardsView.tsx
│       │   └── ScrumCard.tsx
│       ├── common/               # 공통 컴포넌트
│       │   ├── CircularProgress.tsx
│       │   ├── DomainBadge.tsx
│       │   ├── EmptyState.tsx
│       │   ├── Filters.tsx       # 도메인/프로젝트/멤버 필터
│       │   ├── Header.tsx        # GNB 헤더
│       │   ├── LayoutWrapper.tsx # 레이아웃 래퍼 (동적 max-width)
│       │   ├── Navigation.tsx    # 사이드바 네비게이션
│       │   ├── RiskLevelBadge.tsx
│       │   ├── SearchInput.tsx   # 검색창 (단축키 지원)
│       │   ├── StatsBar.tsx
│       │   └── WeekSelector.tsx  # 주차/범위 선택기
│       ├── matrix/               # 매트릭스 뷰 컴포넌트
│       │   ├── MatrixCell.tsx
│       │   ├── MatrixHeader.tsx
│       │   └── MatrixView.tsx
│       ├── my/                   # 개인 대시보드 컴포넌트
│       │   ├── MyDashboardView.tsx
│       │   ├── components/       # 서브 컴포넌트
│       │   │   ├── DashboardFilters.tsx
│       │   │   ├── DomainPieChartCard.tsx
│       │   │   ├── ItemRow.tsx
│       │   │   ├── ProgressOverview.tsx
│       │   │   ├── ProjectBarChart.tsx
│       │   │   ├── RiskSummary.tsx
│       │   │   ├── StatCard.tsx
│       │   │   └── TrendChart.tsx
│       │   ├── hooks/            # 커스텀 훅
│       │   │   └── useMyDashboard.ts
│       │   └── utils/            # 유틸리티
│       │       └── dashboardUtils.ts
│       ├── projects/             # 프로젝트 뷰 컴포넌트
│       │   └── ProjectGroupView.tsx
│       ├── quadrant/             # 사분면 뷰 컴포넌트
│       │   ├── QuadrantChart.tsx
│       │   └── QuadrantView.tsx
│       ├── risks/                # 리스크 뷰 컴포넌트
│       │   └── RiskFocusView.tsx
│       └── summary/              # 요약 뷰 컴포넌트
│           ├── DomainStats.tsx
│           ├── MemberStats.tsx
│           ├── ReasonItemsList.tsx
│           ├── RiskItemsList.tsx
│           ├── SummaryCards.tsx
│           └── SummaryView.tsx
├── context/
│   ├── SharesContext.tsx         # Shares 전역 상태
│   └── ScrumContext.tsx          # 스크럼 전역 상태
├── hooks/
│   └── useVisitorCount.ts        # 방문자 수 카운터 훅
├── lib/
│   ├── colorDefines.ts           # 색상 정의 및 유틸리티
│   ├── scrumData.ts              # 스크럼 데이터 로더
│   ├── sharesData.ts             # Shares 데이터 로더
│   ├── utils.ts                  # 필터링, 통계 유틸리티
│   └── weekUtils.ts              # 주차 관련 유틸리티
└── types/
    ├── scrum.ts                  # 스크럼 타입 정의
    └── shares.ts                 # Shares 타입 정의
```

---

## 프로젝트 구조

```
weekly-scrum/
├── data/
│   ├── submitted-scrum.txt       # 스크럼 입력 파일
│   ├── submitted-insight.txt     # 인사이트 입력 파일
│   ├── scrum/                    # 스크럼 JSON 저장 디렉토리
│   │   └── {year}/{month}/{year}-{month}-{week}.json
│   ├── insights/                 # 인사이트 JSON 저장 디렉토리
│   │   └── {year}/{month}/{year}-{month}-{week}.json
│   └── shares/                   # Shares 마크다운 저장 디렉토리
│       └── {year}-{month}-{week}.md
├── scripts/
│   ├── parse-submitted.ts        # 스크럼 변환 스크립트
│   ├── parse-insight.ts          # 인사이트 변환 스크립트
│   └── create-shares.ts          # Shares 마크다운 생성 스크립트
├── src/
│   ├── app/                      # Next.js App Router
│   ├── components/               # React 컴포넌트
│   ├── context/                  # React Context (전역 상태)
│   ├── lib/                      # 유틸리티 함수
│   └── types/                    # TypeScript 타입
├── out/                          # 정적 빌드 출력 (배포용)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
├── DEPLOY.md                     # 배포 가이드
├── leader_insight_instruction.md # AI 인사이트 생성 프롬프트
└── README.md
```

---

## 기술 스택

| 기술         | 버전 | 용도                          |
| ------------ | ---- | ----------------------------- |
| Next.js      | 15.x | React 프레임워크              |
| React        | 19.x | UI 라이브러리                 |
| TypeScript   | 5.x  | 타입 시스템                   |
| Tailwind CSS | 3.x  | 유틸리티 CSS + Notion 테마    |
| Recharts     | 3.x  | 차트 라이브러리               |
| Upstash Redis| -    | 방문자 수 카운터 (serverless) |
| tsx          | 4.x  | TypeScript 스크립트 실행      |
| gh-pages     | 6.x  | GitHub Pages 배포             |

---

## 배포

GitHub Pages를 통해 정적 사이트로 배포합니다.

```bash
# 빌드 및 배포
yarn deploy
```

### 환경 변수 설정 (선택)

방문자 수 카운터를 사용하려면 Upstash Redis 환경 변수가 필요합니다:

```bash
# .env.local
NEXT_PUBLIC_UPSTASH_REDIS_REST_URL="your-upstash-url"
NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN="your-upstash-token"
```

GitHub Actions 배포 시 Repository Secrets에 동일한 환경 변수를 설정합니다.

> 자세한 배포 가이드는 `DEPLOY.md` 참조

---

## 대시보드 운영 가이드

매주 스크럼 데이터를 수집하고 대시보드를 갱신하는 운영 절차입니다.

### 1단계: 스크럼 데이터 취합

팀원들의 주간 스크럼 내용을 `data/submitted-scrum.txt` 파일에 취합합니다.

```bash
# 파일 열기
open data/submitted-scrum.txt
```

각 항목은 다음 형식을 따릅니다:

```
[도메인 / 프로젝트 / 토픽]
- Name: 담당자
- Plan: 이번 주 계획
- Progress: 진행 상황
- Next: 다음 주 계획
- Risk: 리스크 (선택)
- RiskLevel: 0-3 (선택)
- Reason: 사유 (선택)
```

### 2단계: 스크럼 데이터 파싱

취합이 완료되면 파싱 스크립트를 실행하여 JSON 파일을 생성합니다.

```bash
yarn scrum:parse <year> <month> <week> "<range>"
```

**예시:**

```bash
yarn scrum:parse 2025 12 W02 "2025-12-09 ~ 2025-12-15"
```

### 3단계: 공유 리포트 생성

`rule_shares.md` 지침을 참고하여 리더 공유 사항을 작성합니다.

```bash
# 빈 템플릿 생성 (선택)
yarn shares:create

# 또는 특정 주차 지정
yarn shares:create 2025 12 W02
```

생성된 마크다운 파일(`data/shares/YYYY-MM-WXX.md`)에 공유 사항을 작성합니다.

> **Tip:** `rule_shares.md`에 정의된 구조를 따르면 일관된 리포트 작성이 가능합니다.

### 4단계: 정적 페이지 배포

모든 데이터 준비가 완료되면 변경 사항을 푸시하여 GitHub Pages를 갱신합니다.

```bash
git add -A
git commit -m "chore: update weekly scrum data (YYYY-MM-WXX)"
git push origin main
```

푸시 후 GitHub Actions가 자동으로 빌드 및 배포를 수행합니다.

- **Actions 확인:** https://github.com/kh1012/weekly-scrum/actions
- **배포 사이트:** https://kh1012.github.io/weekly-scrum

### 운영 체크리스트

```
□ submitted-scrum.txt에 팀원 스크럼 내용 취합
□ yarn scrum:parse 실행하여 JSON 생성
□ (선택) yarn shares:create로 공유 리포트 템플릿 생성
□ (선택) rule_shares.md 참고하여 리포트 작성
□ git push하여 정적 페이지 갱신
□ 배포 완료 확인
```

---

## 단축키

| 단축키              | 기능         |
| ------------------- | ------------ |
| `Ctrl+K` / `⌘K`     | 검색창 포커스 |

---

## 라이선스

MIT
