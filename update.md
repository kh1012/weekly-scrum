당신은 Next.js 15 + TypeScript 기반으로 이미 구축된 "Weekly Scrum 대시보드"에 새로운 Calendar View를 추가하는 시니어 프론트엔드 엔지니어입니다.

목표는 **주 단위 스냅샷 데이터를 달력(Calendar) 형태로 재구성해서, 관리자/개인이 한 달 동안 어디에 집중했는지 한눈에 보이게 하는 것**입니다.  
이 기능은 "위클리 스크럼" 사이트의 상위 메뉴 중 하나로 동작하며, **관리자 관점(프로젝트 중심)** 과 **개인 관점(멤버 중심)** 을 모두 지원해야 합니다.

아래 요구사항을 꼼꼼히 읽고, 반드시 다음 순서로 작업하세요:

1. 개념 정리
2. 데이터 모델 정리
3. UI 구조 설계
4. 컴포넌트/훅/유틸 분리 계획
5. 실제 코드 작성

각 단계에서 **텍스트로 설계 → 내가 수용 가능한지 확인 가능한 요약 → 그 다음 코드** 순서로 진행합니다.  
단계별 산출물은 모두 마크다운 텍스트로 먼저 보여준 뒤, 이어서 파일 단위 코드 제안을 하세요.

---

## 0. 전제: 기존 Weekly Scrum / Snapshot 데이터

이미 시스템에는 "주 단위 스냅샷" 데이터가 존재한다고 가정합니다. 스키마는 대략 다음과 같은 개념을 포함합니다. (정확한 필드명은 추후 매핑)

- 주 단위 스냅샷 개념:
  - year (예: 2025)
  - weekIndex (ISO week number 또는 내부 주차 인덱스)
  - weekStart, weekEnd (YYYY-MM-DD)
- 업무 메타:
  - domain (예: Planning, Frontend, Backend, Design, Content 등)
  - project (예: MOTIIV, M-Connector, Desk, Profile 등)
  - module (예: Spreadsheet, Workspace, Engagement System, Navigation 등)
  - feature (보다 세부 기능 단위)
  - name (스냅샷 작성자 이름, 즉 멤버명)
- 작업 내용:
  - pastWeek.tasks / thisWeek.tasks (텍스트 배열, 내부에는 "설명 + %", 혹은 status 키워드(DONE/HALF/TODO) 등이 섞일 수 있음)
- 주차 식별자:
  - year + weekIndex 조합, 또는 별도의 weekId

당신은 이 데이터를 **Calendar View용 집계 데이터**로 변환하는 유틸 계층부터 설계·구현해야 합니다.

---

## 1. 상위 메뉴·모드 설계 (관리자 / 개인 관점)

### 1-1. 관리자가 실제로 보고 싶은 질문

관리자(리더)는 이 화면에서 주로 다음 질문에 답을 얻고자 합니다.

1. "이번 달 동안 우리 팀이 어떤 프로젝트(또는 워크스트림)에 가장 집중했는가?"
2. "주별로 보면, 어떤 주에 어떤 프로젝트에 힘을 실었는가?"
3. "특정 멤버는 한 달 동안 어디에 시간을 썼고, 무엇을 얼마나 완료했는가?"

이를 위해 Calendar View 상단에 두 가지 모드를 둡니다.

- 모드 1: "프로젝트별" (Project Focus)
- 모드 2: "멤버별" (Member Focus)

내부 상태 타입(참고용 개념):

- CalendarMode = 'project' | 'member'

UI 상단 탭 레이블은 다음과 같이 고정합니다.

- 탭 1: "프로젝트별"
- 탭 2: "멤버별"

---

### 1-2. "프로젝트" / "개인" 네이밍 전략

관리자/팀원 모두에게 이질감이 적으면서 추후 확장이 가능한 네이밍을 사용합니다.

- 프로젝트/업무 단위 축(Work 단위) 후보:
  - 프로젝트 (Project)
  - 이니셔티브 (Initiative)
  - 워크스트림 (Workstream)
- 사람 축(개인) 후보:
  - 멤버 (Member)
  - 기여자 (Contributor)
  - 플레이어 (Player)

**구현 가이드 (중요)**

- 내부(타입/유틸/로직)에서는:
  - initiative (프로젝트 이상의 개념까지 포괄)
  - member (멤버)
- 화면(UI 텍스트)에서는:
  - "프로젝트", "멤버" 라벨 사용
  - 모드 탭 라벨은 "프로젝트별", "멤버별"

이렇게 하면,

- 지금은 "프로젝트"로 보이지만,
- 나중에 캠페인·제품군 등 더 큰 단위로 확장할 때도 `initiative`라는 내부 개념을 유지할 수 있습니다.

---

## 2. Calendar View가 풀어야 할 문제 정의

### 2-1. 현재 스냅샷만으로는 어려운 점

1. 주 단위 스냅샷이 쌓이기만 하면, **시간의 흐름과 집중 포인트가 직관적으로 보이지 않는다.**
2. 관리자 입장에서는,
   - "이번 달에 가장 오래/깊게 가져간 프로젝트가 무엇인지"
   - "어떤 주에 어떤 프로젝트에 특히 힘을 실었는지"
     를 빠르게 보기 어렵다.
3. 개인 입장에서는,
   - "내가 한 달 동안 어디에 시간을 썼는지"
   - "어떤 프로젝트/모듈/피처에 얼만큼 기여했는지"
     를 한눈에 돌아보기 어렵다.

### 2-2. Calendar View가 제공해야 할 답

Calendar View는 다음을 직관적으로 보여줘야 합니다.

1. 월 단위 / 선택 기간 전체에서:
   - 프로젝트 단위로:
     - 몇 주 동안 등장했는지 (집중 지속 기간)
     - 해당 기간 동안 완료한 task 수 / 계획된 task 수
     - 관여한 멤버, 모듈, 피처의 다양성
   - 멤버 단위로:
     - 몇 주 동안 등장했는지
     - 참여한 프로젝트/모듈/피처의 개수와 목록
     - 완료 task 수 / 계획 task 수
2. 주 단위(캘린더 셀)로:
   - 프로젝트 모드일 때:
     - 한 주에 **어떤 프로젝트에 얼마나 집중했는지** (상위 몇 개 막대 그래프)
   - 멤버 모드일 때:
     - 한 주에 **어떤 멤버가 얼마나 기여했는지** (상위 몇 명 막대 그래프)
3. 우측 패널 메타데이터:
   - 선택된 기간 및 선택된 주/프로젝트/멤버 기준으로:
     - 참여 프로젝트 개수·목록
     - 참여 모듈 개수·목록
     - 참여 피처 개수·목록
     - 완료 task 수, 계획 task 수, 평균 달성률
     - (옵션) 집중도 점수 (예: 완료 task 수를 기반으로 한 스코어)

---

## 3. 데이터 모델 설계 (개념 수준)

여기서는 개념적인 타입 이름만 정의합니다. 실제 TypeScript 타입은 구현 단계에서 제안하도록 합니다.

### 3-1. 입력: Raw Snapshot (최소 스키마)

개념적으로 최소한 다음 필드를 갖는다고 가정합니다.

- id: 고유 ID
- year: 연도 (예: 2025)
- weekIndex: 주차 인덱스 (ISO week number 또는 내부 기준)
- weekStart: 문자열 (YYYY-MM-DD)
- weekEnd: 문자열 (YYYY-MM-DD)
- domain: 문자열
- project: 문자열 (initiative로 매핑)
- module: 문자열
- feature: 문자열
- memberName: 문자열 (스냅샷 작성자, 혹은 담당자)
- pastWeekTasks: 문자열 배열
- thisWeekTasks: 문자열 배열

task 문자열 안에는 `%` 또는 `(DONE)/(HALF)/(TODO)` 같은 키워드 기반으로 달성률을 추정할 수 있다고 가정합니다.

### 3-2. 주 단위 캘린더 집계 모델 (Week Aggregation)

캘린더에서 한 칸(주)을 표현하기 위해 "주 단위 집계 객체"를 설계합니다.

- WeekKey:

  - year
  - weekIndex

- InitiativeAggregation (해당 주 기준 프로젝트 집계):

  - initiativeName: 문자열 (기존 project)
  - domains: Set<string>
  - modules: Set<string>
  - features: Set<string>
  - members: Set<string>
  - plannedTaskCount: number
  - doneTaskCount: number
  - avgCompletionRate: number (0~1 사이)
  - focusScore: number  
    (기본값: doneTaskCount, 또는 doneTaskCount \* avgCompletionRate)

- MemberAggregation (해당 주 기준 멤버 집계):

  - memberName: 문자열
  - initiatives: Set<string>
  - domains: Set<string>
  - modules: Set<string>
  - features: Set<string>
  - plannedTaskCount: number
  - doneTaskCount: number
  - avgCompletionRate: number
  - focusScore: number

- WeekAggregation:
  - key: WeekKey
  - weekStart: 문자열
  - weekEnd: 문자열
  - initiatives: InitiativeAggregation[]
  - members: MemberAggregation[]
  - totalInitiativeFocus: number (모든 initiative의 focusScore 합)
  - totalMemberFocus: number (모든 member의 focusScore 합)

**focusScore 규칙(초기 버전)**

- 단순하게 `focusScore = doneTaskCount` 로 시작합니다.
- 나중에 필요하면 `doneTaskCount + plannedTaskCount * 0.3` 등으로 조정할 수 있도록 별도 유틸 함수로 분리합니다.

---

### 3-3. 기간(월/범위) 단위 집계 모델 (Range Summary)

우측 메타 패널에서 사용할, 선택된 기간(예: 한 달)에 대한 집계 모델을 설계합니다.

- RangeSummaryBase:

  - rangeStart: 문자열 (YYYY-MM-DD)
  - rangeEnd: 문자열 (YYYY-MM-DD)
  - weekCount: number

- ProjectFocusRangeSummary (mode: project):

  - mode: 'project'
  - initiatives: 배열 (각 원소는 다음 정보 포함)
    - initiativeName
    - weekCount (해당 프로젝트가 등장한 주 수)
    - doneTaskCount
    - plannedTaskCount
    - modules: Set<string>
    - features: Set<string>
    - members: Set<string>
    - focusScore: number
  - totalInitiativeCount
  - totalModuleCount
  - totalFeatureCount
  - totalMemberCount

- MemberFocusRangeSummary (mode: member):
  - mode: 'member'
  - members: 배열 (각 원소는 다음 정보 포함)
    - memberName
    - weekCount (해당 멤버가 등장한 주 수)
    - initiatives: Set<string>
    - modules: Set<string>
    - features: Set<string>
    - doneTaskCount
    - plannedTaskCount
    - focusScore
  - totalMemberCount
  - totalInitiativeCount
  - totalModuleCount
  - totalFeatureCount

---

## 4. UI 구조 설계

### 4-1. 전체 레이아웃 (좌: 캘린더, 우: 메타 패널)

상위 페이지(예: CalendarViewPage)는 대략 다음 구조를 가집니다.

- 상단 바:
  - 좌측:
    - 월 선택 또는 기간 선택 (예: `<` 2025년 3월 `>`)
  - 우측:
    - 탭: "프로젝트별" / "멤버별"
- 본문:
  - 좌측: CalendarGrid
  - 우측: CalendarMetaPanel

**상태(개념)**

- mode: 'project' | 'member'
- selectedMonth: "YYYY-MM" (예: "2025-03")
- selectedWeek: (year, weekIndex) 또는 null
- selectedInitiative: 문자열 또는 null
- selectedMember: 문자열 또는 null

### 4-2. CalendarGrid 설계

- 입력:

  - weeks: WeekAggregation[] (선택된 월/범위에 해당하는 주 목록)
  - mode: 'project' | 'member'
  - selectedWeek
  - onSelectWeek
  - onSelectInitiative
  - onSelectMember

- 렌더링:
  - 표면적으로는 "달력"처럼 보이지만, **실제 핵심은 week 단위 row**입니다.
  - 각 주에 대해 WeekCell을 렌더링합니다.
  - UI는 실제 요일 그리드까지 구현할지, week 리스트 형태로 보여줄지는 구현 시에 선택할 수 있습니다.  
    (초기 버전은 "주 리스트 + 각 주에 막대 그래프" 방식으로 단순하게 시작하는 것을 권장)

### 4-3. WeekCell 설계

- 주차 label:
  - 예: "W12 · 03.17 ~ 03.23"
- 프로젝트 모드일 때:
  - 해당 주의 InitiativeAggregation 배열을 focusScore 기준으로 정렬
  - 상위 N개(예: 3개) 프로젝트만 막대로 표시
  - 각 막대:
    - 길이: focusScore 비율
    - 색: 프로젝트별 일관된 색 (간단한 색상 팔레트)
    - 텍스트: 프로젝트명 + 완료 task 수
  - 막대 클릭 시:
    - selectedWeek + selectedInitiative를 갱신
- 멤버 모드일 때:
  - MemberAggregation 배열을 focusScore 기준으로 정렬
  - 상위 N명(예: 3명) 멤버 막대 표시
  - 막대 클릭 시:
    - selectedWeek + selectedMember 갱신

---

### 4-4. 우측 CalendarMetaPanel 설계

**프로젝트 모드 (Project Focus)**

- 상단 요약 카드:
  - "이 달/기간의 프로젝트별 요약"
  - 참여 프로젝트 수
  - 참여 멤버 수
  - 진행 모듈 수
  - 진행 피처 수
- 중단 리스트:
  - 프로젝트 랭킹 (focusScore 순)
  - 각 행에:
    - 프로젝트명
    - 등장 주차 수 (weekCount)
    - 완료 task 수 / 계획 task 수
    - 평균 completion rate
    - 모듈 수 / 피처 수 / 멤버 수
- 하단 상세:
  - 선택된 주 + 프로젝트 기준 상세:
    - 참여 멤버 목록
    - 모듈/피처 목록
    - 완료한 task 리스트 (해당 주)

**멤버 모드 (Member Focus)**

- 상단 요약 카드:
  - 참여 멤버 수
  - 멤버당 평균 프로젝트 수
  - 멤버당 평균 모듈/피처 수
- 중단 리스트:
  - 멤버 랭킹 (focusScore 순)
  - 각 행에:
    - 멤버명
    - 등장 주차 수
    - 참여 프로젝트 수
    - 완료 task 수
- 하단 상세:
  - 선택된 주 + 멤버 기준 상세:
    - 해당 주에 어떤 프로젝트/모듈/피처에 기여했는지
    - 완료 task 리스트

---

## 5. 캘린더 내 주 단위 표시 규칙

### 5-1. 주차 계산 규칙

- 주차는 현재 Weekly Scrum 시스템에서 사용 중인 기준(ISO week 등)을 그대로 따른다.
- 월 View에서:
  - selectedMonth (예: "2025-03")에 포함되는 모든 주차를 가져온다.
  - weekStart 또는 weekEnd가 해당 월에 포함되면 그 주를 렌더링 대상에 포함한다.
- Week label 표기:
  - "W{weekIndex} · MM.DD ~ MM.DD" 형태 사용

### 5-2. 선택/상호작용 규칙

- 기본 선택:
  - 현재 월의 마지막 주를 기본 선택 주로 지정 (selectedWeek 기본값)
- 상호작용:
  - WeekCell 클릭:
    - 해당 week를 selectedWeek로 설정
  - WeekCell 내부 막대(프로젝트/멤버) 클릭:
    - selectedInitiative 또는 selectedMember 설정
    - 우측 패널 상세 영역을 해당 조합 기준으로 갱신

---

## 6. 컴포넌트/훅/유틸 분리 전략

### 6-1. 주요 컴포넌트 (파일 단위 설계)

1. CalendarViewPage

   - 역할:
     - 상단 모드 탭 / 월 선택
     - raw snapshot 데이터를 주입받고, 집계 훅 호출
     - 좌측 CalendarGrid / 우측 CalendarMetaPanel 렌더
   - 상태:
     - mode ('project' | 'member')
     - selectedMonth ("YYYY-MM")
     - selectedWeek (year + weekIndex or null)
     - selectedInitiative (string or null)
     - selectedMember (string or null)

2. CalendarGrid

   - props:
     - weeks (WeekAggregation[])
     - mode
     - selectedWeek
     - onSelectWeek
     - onSelectInitiative
     - onSelectMember
   - 역할:
     - 주 리스트/그리드 렌더
     - WeekCell 구성

3. WeekCell

   - props:
     - week (WeekAggregation)
     - mode
     - selected (boolean)
     - onSelectWeek
     - onSelectInitiative
     - onSelectMember
   - 역할:
     - 주차 라벨 표시
     - 상위 프로젝트/멤버 막대 그래프 표시

4. CalendarMetaPanel
   - props:
     - mode
     - projectRangeSummary (ProjectFocusRangeSummary)
     - memberRangeSummary (MemberFocusRangeSummary)
     - selectedWeek
     - selectedInitiative
     - selectedMember
   - 역할:
     - 현재 모드에 따라:
       - 상단 요약 카드
       - 랭킹 리스트
       - 선택 상세

### 6-2. 훅 / 유틸

1. useCalendarAggregation(rawSnapshots, selectedMonth)

   - 반환:
     - weeks: WeekAggregation[]
     - projectRangeSummary: ProjectFocusRangeSummary
     - memberRangeSummary: MemberFocusRangeSummary
   - 내부 처리 순서:
     - (1) selectedMonth / 기간에 포함되는 스냅샷 필터링
     - (2) 주 단위 그룹핑 (year + weekIndex)
     - (3) 각 주 내에서 initiative, member 별 집계
     - (4) 전체 기간 기준 range summary 생성

2. parseTaskCompletionRate(taskText)

   - 역할:
     - 문자열에서 `%` 숫자를 추출
     - 혹은 "(DONE)/(HALF)/(TODO)" 키워드 기반으로 1.0/0.5/0.0 등으로 해석
     - 없으면 0.0 반환

3. computeFocusScore(plannedCount, doneCount, avgRate)
   - 초기 구현:
     - 단순히 doneCount 또는 doneCount \* avgRate 반환
   - 이후 필요시 가중치 조정 가능하도록 별도 함수로 유지

---

## 7. 구현 순서 (Cursor에게 반드시 지킬 것)

당신(Cursor)은 아래 순서대로 작업을 진행해야 합니다.

1. 분석/계획 단계 (텍스트만)

   - 이 프롬프트에 기반해서:
     - 실제 TypeScript 타입 정의(파일 단위 계획)
     - 컴포넌트 구조 (파일명, 컴포넌트명)
     - 상태 관리 전략 (로컬 상태 vs 전역 스토어)
   - 위 내용을 마크다운으로 먼저 출력할 것.
   - 이 단계에서는 코드 작성 금지.

2. 타입 및 유틸 구현

   - 예: `types/calendar.ts` 파일에:
     - WeekKey
     - WeekAggregation
     - ProjectFocusRangeSummary
     - MemberFocusRangeSummary
     - RawSnapshot (입력 타입)
   - 예: `lib/calendarAggregation.ts` 파일에:
     - 순수 집계 함수 (rawSnapshots → WeekAggregation[] → RangeSummary)
     - parseTaskCompletionRate
     - computeFocusScore
   - 먼저 순수 함수 기반 집계 로직을 작성하고, 이후 `useCalendarAggregation` 훅으로 감쌀 것.

3. Mock 데이터 기반 CalendarViewPage 스켈레톤

   - 실제 데이터 연동 전:
     - mockSnapshots를 상단에 선언해 end-to-end UI가 돌아가도록 구성
   - `app/calendar/page.tsx` 또는 적절한 위치에:
     - CalendarViewPage 구현
     - 모드 탭 / 월 선택 / 좌우 레이아웃 / CalendarGrid / CalendarMetaPanel 연결

4. WeekCell 시각화 구현

   - 프로젝트 모드:
     - 상위 3개 프로젝트에 대한 막대 그래프 구현 (단순 div width 비율)
   - 멤버 모드:
     - 상위 3명 멤버에 대한 막대 그래프 구현

5. CalendarMetaPanel 구현

   - 프로젝트 모드:
     - 요약 카드 + 프로젝트 랭킹 + 선택 주/프로젝트 상세
   - 멤버 모드:
     - 요약 카드 + 멤버 랭킹 + 선택 주/멤버 상세

6. 리팩터링 및 설명
   - 구현 완료 후:
     - 디렉토리 구조
     - 각 컴포넌트/훅/유틸의 책임
     - 향후 확장 포인트 (분기 뷰, 필터(도메인/프로젝트/멤버), 더 깊은 그래프 등)
   - 을 마크다운으로 정리해서 함께 제공할 것.

---

## 8. 스타일 및 기술 스택 전제

- 사용 스택:
  - Next.js 15 App Router
  - TypeScript
- 스타일:
  - 프로젝트에서 이미 사용하는 스타일 방식을 그대로 따른다.
  - Tailwind, styled-jsx, Emotion 등 기존 패턴을 존중하며, 새로운 스타일 시스템을 도입하지 않는다.
- 우선순위:
  - 첫 버전에서는 **정보 구조와 읽기 쉬운 레이아웃**에 집중
  - 미니 차트/그래프는 복잡한 라이브러리 대신, 단순한 div width 비율 기반부터 시작
  - any 사용을 피하고, 모든 주요 props에 명시적인 타입을 부여

---

### 최종 지시

1. 이 문서를 바탕으로, 먼저 **"Calendar View 전체 설계 요약"** 을 텍스트로 출력하라. (타입/파일 구조/상태 구조 포함)
2. 그 다음, 내가 한 번에 복사해서 사용할 수 있도록 **파일 단위 코드**를 순차적으로 제안하라.
3. 코드 블럭은 **각 파일당 하나의 완결된 블럭**으로 제안하며, **중간에 끊기거나 닫히지 않는 코드 블럭이 없도록** 주의하라.
