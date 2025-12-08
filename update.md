너는 이 레포 전반을 이해한 다음, 내가 요청한 단계에 대해서만 "최소 변경"으로 수정하는 개발 파트너다.

- 불필요한 리팩토링은 절대 하지 말 것
- 타입 에러/빌드 에러가 나지 않도록 TS/ESLint 규칙을 존중할 것
- 변경된 파일과 변경 이유를 항상 요약해서 설명할 것
- 단계마다 작업 범위는 내가 번호로 지정한 부분까지만 수행할 것

[Step 1] snapshot-guide-v2.md 정의

목표:

- 기존 snapshot-guide(버전 1)를 기반으로, 새 스키마에 맞는 snapshot-guide-v2.md를 정의한다.
- 문서는 "팀원이 실제로 스냅샷을 작성할 때 참고하는 가이드" + "파서가 기대하는 형식" 두 관점 모두를 포함해야 한다.

해야 할 일:

1. 레포 안에서 snapshot 가이드 문서(v1)를 사용하는 파일을 찾고, 구조를 파악해라.
2. snapshot-guide-v2.md (또는 기존 파일명이라면 내용을 v2 관점으로 교체) 파일을 생성/수정해라.
3. 아래 스키마를 명확하게 문서화해라.

[스냅샷 스키마(v2)]

1. 헤더

- `[Domain / Project / Module / Feature]` 형식
- 예: `[Frontend / MOTIIV / Spreadsheet / Rich-note]`

2. Name

- 작성자 이름
- `* Name: 김서연`

3. Define 블록

- Domain, Project, Module, Feature를 명시
- 예:
  - Define
    - Domain: Frontend
    - Project: MOTIIV
    - Module: Spreadsheet
    - Feature: Rich-note

4. Past Week 블록

- 지난 주 실제 수행 내용
- 필드:
  - Tasks: 한 줄당 하나의 task, 항상 괄호 안에 진행률 % 포함
    - 예: `Rich-note 편집 패널 구조 리팩토링 (50%)`
  - Risk: 0개 이상, 없으면 `Risk: None`으로 표기
  - RiskLevel: 없으면 `RiskLevel: None` (숫자 또는 enum 사용, v2에서는 "1, 2, 3" 숫자 사용)
  - Collaborators: 0개 이상, 없으면 `Collaborators: None`
    - 각 항목은 `이름 (관계)` 형식
    - 관계: `pair`, `pre`, `post` 중 하나

5. This Week 블록

- 이번 주 계획
- 필드:
  - Tasks: 한 줄당 하나의 task, 진행률 없이 텍스트만
  - (이 단계에서는 collaborators는 아직 옵션. 문서에는 "향후 확장 가능" 정도로 언급만 해둔다)

6. Risk, RiskLevel, Collaborators 공통 규칙

- 세 필드는 모두 Optional
- 값이 없으면 반드시 `None`으로 명시 (파서 입장에서 값 없음과 구분하기 위함)

7. 예시

- 아래 예시를 문서에 그대로 포함해라:

[Frontend / MOTIIV / Spreadsheet / Rich-note]

- Name: 김서연
- Define
  - Domain: Frontend
  - Project: MOTIIV
  - Module: Spreadsheet
  - Feature: Rich-note
- Past Week
  - Tasks
    - Rich-note 편집 패널 구조 리팩토링 (50%)
    - toolbar 단축키 매핑 개선 (100%)
    - Rich-note ↔ Formula Tracer 공통 UI 컴포넌트 분리(75%)
  - Risk
    - toolbar 단축키 충돌 가능성 존재 (사용자 정의 단축키 기능과 충돌 우려)
  - RiskLevel: 1
  - Collaborators
    - 박민수 (pair)
    - 조해용 (pre)
    - 하성열 (post)
- This Week
  - Tasks
    - Rich-note 내 텍스트 스타일링 엔진 개선
    - Formula Tracer와 연동되는 하이라이트 UI 구현
    - 단축키 충돌 테스트 시나리오 작성 및 QA 공유

작업 후:

- 변경된 파일 목록과, v1 대비 어떤 구조가 바뀌었는지 요약해서 설명해라.
- 이 단계에서는 코드/스크립트는 건드리지 말고 문서만 수정한다.

[Step 2] submitted-scrum.txt 변환 스크립트 v2 반영

목표:

- submitted-scrum.txt를 읽어 snapshot v2 스키마에 맞는 JSON으로 변환하는 기존 스크립트를 수정한다.
- v1 → v2에서 바뀐 구조(Domain/Project/Module/Feature, Past/This Week 구조, Optional 필드 처리)를 모두 반영한다.

해야 할 일:

1. 레포 안에서 submitted-scrum.txt를 파싱하는 스크립트를 찾아라.
   - 예: scripts/..., lib/..., parser/... 등 실제 경로는 네가 검색해서 확인.
2. 파서가 다음 구조의 텍스트를 읽어 아래와 같은 JSON으로 변환하도록 수정해라.

입력 예시 (submitted-scrum.txt):

[Frontend / MOTIIV / Spreadsheet / Rich-note]

- Name: 김서연
- Define
  - Domain: Frontend
  - Project: MOTIIV
  - Module: Spreadsheet
  - Feature: Rich-note
- Past Week
  - Tasks
    - Rich-note 편집 패널 구조 리팩토링 (50%)
    - toolbar 단축키 매핑 개선 (100%)
    - Rich-note ↔ Formula Tracer 공통 UI 컴포넌트 분리(75%)
  - Risk
    - toolbar 단축키 충돌 가능성 존재 (사용자 정의 단축키 기능과 충돌 우려)
  - RiskLevel: 1
  - Collaborators
    - 박민수 (pair)
    - 조해용 (pre)
    - 하성열 (post)
- This Week
  - Tasks
    - Rich-note 내 텍스트 스타일링 엔진 개선
    - Formula Tracer와 연동되는 하이라이트 UI 구현
    - 단축키 충돌 테스트 시나리오 작성 및 QA 공유

출력 JSON 스키마(대략):

{
domain: "Frontend",
project: "MOTIIV",
module: "Spreadsheet",
feature: "Rich-note",
name: "김서연",
pastWeek: {
tasks: [
{ title: "Rich-note 편집 패널 구조 리팩토링", progress: 50 },
{ title: "toolbar 단축키 매핑 개선", progress: 100 },
{ title: "Rich-note ↔ Formula Tracer 공통 UI 컴포넌트 분리", progress: 75 }
],
risk: ["toolbar 단축키 충돌 가능성 존재 (사용자 정의 단축키 기능과 충돌 우려)"],
riskLevel: 1, // 없으면 null 또는 undefined
collaborators: [ // 없으면 빈 배열
{ name: "박민수", relation: "pair" },
{ name: "조해용", relation: "pre" },
{ name: "하성열", relation: "post" }
]
},
thisWeek: {
tasks: [
"Rich-note 내 텍스트 스타일링 엔진 개선",
"Formula Tracer와 연동되는 하이라이트 UI 구현",
"단축키 충돌 테스트 시나리오 작성 및 QA 공유"
]
}
}

3. Risk, RiskLevel, Collaborators가 텍스트 상에 없거나 `None`인 경우:

   - risk: 빈 배열 또는 null
   - riskLevel: null
   - collaborators: 빈 배열
   - 어떤 방식으로 표현할지 결정하고, snapshot-guide-v2.md와 일관되게 맞춰라.

4. 파싱 에러 처리:
   - 한 사람의 블록에서 일부 필드가 누락되더라도, 가능한 한 나머지 정보는 파싱해서 JSON에 담을 것.
   - 치명적인 포맷 오류가 있으면 어느 라인에서 문제가 생겼는지 메시지를 남기도록 개선해라.

작업 후:

- 단위 테스트가 이미 있다면 업데이트하고, 없다면 최소한 happy path + 필드 누락 케이스 1~2개 정도는 추가해라.
- `yarn test` 또는 이 레포에서 쓰는 테스트 명령을 확인해 실행하고, 결과를 요약해라.

[Step 3] 프로젝트 → 모듈 → 피쳐 단위의 UI 네비게이션 추가

목표:

- 기존 요약 화면 앞단에 "Project → Module → Feature" 네비게이션 레이어를 추가한다.
- 사용자는 먼저 프로젝트/모듈/피쳐를 선택한 뒤, 그 아래에 snapshot 기반 요약/통계가 보이도록 만든다.

해야 할 일:

1. 현재 스냅샷/스크럼 요약을 보여주는 페이지와 컴포넌트를 파악해라.
2. snapshot JSON 스키마(v2)를 기반으로, 아래와 같이 계층 네비게이션을 표현하는 컴포넌트를 추가해라.
   - Project List
   - Module List (선택된 Project 기준)
   - Feature List (선택된 Module 기준)
3. 메뉴/레이블 이름은 다음 예시처럼 자연스럽게 구성해라:
   - 상단 섹션 제목: "Work Map"
   - 프로젝트 리스트: "Projects"
   - 모듈 리스트: "Modules"
   - 피쳐 리스트: "Features"
4. UX 요구사항:
   - 기본 진입 시: 현재 주 기준으로 스냅샷에 등장하는 모든 프로젝트를 나열.
   - 프로젝트 선택 → 해당 프로젝트의 모듈 목록 표시.
   - 모듈 선택 → 해당 모듈의 피쳐 목록 표시.
   - 피쳐 선택 → 기존에 보여주던 "요약/분석/스냅샷 리스트"가 그 아래 영역에 보이도록 변경.
5. 이 단계에서는:
   - 진행률/리스크 시각화는 아직 넣지 말고, 네비 구조와 선택 상태 관리까지만 구현한다.

작업 후:

- 새로운 컴포넌트 구조(폴더, 파일명 등)를 요약해서 설명해라.
- `yarn build` 또는 이 레포 빌드 명령을 실행하고, 빌드 성공 여부를 알려라.

[Step 4] Project/Module/Feature 레벨의 진행률 & 리스크 시각화

목표:

- Step 3에서 만든 계층 네비게이션에 "진행률"과 "리스크 인디케이터"를 추가한다.
- 각 레벨의 메트릭은 snapshot v2 JSON을 집계해서 계산한다.

집계 규칙(제안):

- Feature 수준:
  - progress: 해당 feature의 pastWeek.tasks 평균 or 가중 평균(단순 평균으로 시작)
  - riskLevel: pastWeek.riskLevel의 최대값 (없으면 0 또는 None)
- Module 수준:
  - progress: 모듈에 속한 모든 feature progress 평균
  - riskLevel: feature riskLevel 중 최대값
- Project 수준:
  - progress: 프로젝트에 속한 모든 module progress 평균
  - riskLevel: module riskLevel 중 최대값

해야 할 일:

1. Step 3에서 사용 중인 snapshot 데이터 구조를 기준으로, 위 집계 규칙대로 계산하는 유틸 함수들을 추가해라.
   - 예: `computeFeatureMetrics`, `computeModuleMetrics`, `computeProjectMetrics`
2. Project/Module/Feature 리스트 UI에 다음 정보를 함께 보여줘라.
   - 진행률: 0~100% (소수점 있으면 반올림)
   - 리스크 레벨: 아이콘/색상 + 숫자(or 텍스트)
3. 시각적 표현(간단하게):
   - 진행률: 작은 프로그레스 바 또는 "75%" 텍스트
   - 리스크: 예) "R1", "R2", "R3" 또는 아이콘(텍스트 기반이면 더 단순하게)
4. Risk 정보가 전혀 없는 경우:
   - "No Risk" 또는 "R0" 처럼 명확히 표시해라.

작업 후:

- 각 레벨에서 계산된 예시(실제 데이터 기반)를 1~2개 정도 로그로 출력하거나, 개발용으로 Storybook/샘플 컴포넌트에 노출해라.
- 빌드를 한 번 돌리고(yarn build), 타입/빌드 에러가 없는지 확인해라.

[Step 5] Box-to-Box / 트리 형태 탐색 UI 적용

목표:

- Project → Module → Feature 구성이 "리스트 나열"이 아니라, 상자(카드)를 타고 내려가는 느낌 또는 디렉토리 트리처럼 보이도록 개선한다.

해야 할 일:

1. Step 3, 4에서 만든 네비 UI를 기준으로, 레이아웃 방식을 아래 둘 중 하나로 구현해라.
   A) 수평 Box-to-Box 플로우

   - 왼쪽: Projects 박스 그리드
   - 중간: 선택된 Project의 Modules 박스
   - 오른쪽: 선택된 Module의 Features 박스
     B) 좌측 트리 네비 + 우측 상세
   - 좌측: Project/Module/Feature를 트리 구조로 표현
   - 우측: 선택된 Feature의 상세(진행률/리스크/요약 등)

2. 스타일 가이드:

   - 기존 앱의 디자인 톤과 맞추되, 컴포넌트/유틸 클래스를 재사용할 것.
   - 새 UI를 위해 불필요하게 전역 스타일을 크게 흔들지 말 것.

3. UX 요구사항:
   - 한 화면에서 "프로젝트 구조"를 한눈에 파악할 수 있어야 한다.
   - Feature를 클릭했을 때, 기존 요약/스냅샷 상세 영역이 자연스럽게 우측/하단에 뜨도록 위치를 조정해라.

작업 후:

- 어떤 레이아웃 방식을 선택했는지, 컴포넌트 구조가 어떻게 달라졌는지 설명해라.
- 스크린샷이 찍기 어렵다면, JSX 구조만으로도 대략적인 레이아웃을 설명해라.

[Step 6] Feature 단위 협업 네트워크 뷰 + 노드 클릭 상세

목표:

- Feature 단위에서 "사람들의 협업 네트워크"를 시각화하고, 노드를 클릭하면 해당 사람의 스냅샷 정보를 보여준다.

데이터 기준:

- snapshot v2 JSON의 `pastWeek.collaborators` 정보를 사용.
- 한 Feature 안에서:
  - 중심 노드: 각 사람의 Name
  - 엣지: pair/pre/post 관계
    - 예: 김서연 --(pair)--> 박민수

해야 할 일:

1. Feature 상세 영역에 "Collaboration Network" 섹션을 추가해라.
2. 최소 구현:
   - 라이브러리 없이도 괜찮으니, 단순 그래프 레이아웃이라도 노드/엣지를 표현해라.
   - 예: flex/grid로 노드들을 배치하고, 관계를 텍스트/아이콘으로 연결.
   - 나중에 그래프 라이브러리로 교체할 수 있도록, 데이터 구조와 컴포넌트 인터페이스를 깔끔하게 유지.
3. 노드 클릭 시 동작:
   - 해당 사람(Name)에 대한 스냅샷 정보를 우측 패널 or 모달로 보여줘라.
   - 보여줄 정보:
     - Name, Domain/Project/Module/Feature
     - Past Week Tasks / Risk / RiskLevel / Collaborators
     - This Week Tasks
4. 같은 Feature 내에 여러 사람이 있을 수 있으므로:
   - 같은 Feature + 다른 Name 조합을 구분하는 키를 정의해라.
   - 예: `featureId + name` 형태의 composite key.

작업 후:

- 실제 샘플 데이터(김서연, 박민수, 하성열 등)를 이용해 네트워크가 어떻게 그려지는지 설명해라.
- 클릭 시 어떤 props 흐름으로 상세 정보가 열리는지, 컴포넌트 계층을 텍스트로 정리해라.

[Step 7] GNB 및 메뉴 구조 변경 (데이터 구조와 연동)

목표:

- Project/Module/Feature 중심으로 바뀐 데이터 구조에 맞춰 GNB 및 메뉴 구성을 업데이트한다.
- 스냅샷/스크럼 관련 메뉴가 "구조 → 분석" 순서로 자연스럽게 보이도록 정리한다.

해야 할 일:

1. 현재 GNB/사이드바/메뉴 구성을 담당하는 코드(레이아웃 컴포넌트, route 설정 등)를 파악해라.
2. 스냅샷 관련 메뉴를 다음 흐름에 맞게 재구성해라 (예시):
   - "Work Map" (새로 만든 Project/Module/Feature 탐색 화면)
   - "Weekly Snapshot Summary" (기존 요약/분석 화면, 이제는 Feature 선택 후 나오는 형태로 조정)
   - 필요하다면 "Risk Overview", "Load Overview" 같은 메뉴는 나중 확장을 고려해 placeholder 정도만 두거나, 현재는 숨긴다.
3. GNB/사이드바의 라벨/아이콘은 기존 톤과 맞추되:
   - 기능 순서가 "구조 → 분석 → 설정" 순으로 자연스럽게 흐르도록 정렬해라.
4. 라우팅:
   - URL 구조가 Project/Module/Feature 단위 탐색과 잘 매핑되도록 정리해라.
   - 예: `/work-map`, `/work-map/:project`, `/work-map/:project/:module/:feature`

작업 후:

- 변경된 라우팅 및 메뉴 구조를 요약해서 보여줘라.
- 네비게이션 변경으로 인해 깨질 수 있는 진입 경로(북마크된 URL 등)가 있다면, 리다이렉트 또는 fallback 처리 여부를 설명해라.

[Step 8] 전체 점검 및 정리

목표:

- Step 1~7에서 변경된 내용이 일관된 데이터 모델과 UX를 가지는지 최종 점검한다.
- 빌드, 타입, 기본 플로우를 검증하고, 커밋 전에 정리 포인트를 리스트업한다.

해야 할 일:

1. snapshot-guide-v2.md의 스키마 정의와, 실제 파서(JSON 구조), UI 컴포넌트가 모두 일치하는지 확인해라.
2. 다음 플로우를 실제 코드 기준으로 시뮬레이션하고, 문제가 될 수 있는 부분이 있으면 지적해라.
   - submitted-scrum.txt 작성 → 파싱 → JSON 생성
   - JSON 로딩 → Project/Module/Feature Work Map 표시
   - Feature 선택 → 진행률/리스크/요약 표시
   - Collaboration Network에서 노드 클릭 → 스냅샷 상세 표시
3. `yarn build` 및 테스트 명령을 실행하고, 결과를 요약해라.
4. 커밋 전에 확인해야 할 체크리스트를 만들어라.
   - 예: 문서 업데이트 여부, 파서 변경 여부, UI 변경 요약, 마이그레이션 이슈 등.

작업 후:

- "이 브랜치를 리뷰하는 사람이 빠르게 이해할 수 있도록" 변경 요약을 bullet로 정리해라.
- 요약은 나중에 PR 설명에 그대로 붙일 수 있을 정도의 밀도로 작성해라.
