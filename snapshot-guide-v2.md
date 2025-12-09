# Weekly Snapshot v2 포맷 가이드

본 문서는 위클리 스크럼 시스템에서 사용하는 공식 스냅샷 입력 포맷(v2)을 정의한다.  
팀원은 이 문서에 따라 매주 Snapshot을 작성하며, 이 데이터는 팀/개인의 대시보드, 협업 분석, 리스크 탐지 등에 활용된다.

---

# 1. 스냅샷 전체 구조 개요

v2 스냅샷은 다음 6가지 구조로 이루어진다.

1. **헤더**: `[Domain / Project / Module / Feature]` 형식
2. **Name**: 작성자 이름
3. **Past Week**: 지난 주 수행 내용 (Tasks, Risk, RiskLevel, Collaborators)
4. **This Week**: 이번 주 계획 (Tasks)
5. **Optional 필드**: Risk, RiskLevel, Collaborators는 값이 없으면 `None`으로 명시

---

# 2. 헤더 구조

스냅샷의 첫 줄은 아래와 같은 4단계 구조로 이루어진다.

```
[Domain / Project / Module / Feature]
```

예시:
```
[Frontend / MOTIIV / Spreadsheet / Rich-note]
```

---

## 2.1 Domain (업무 관점의 최상위 분류)

domain은 "이번 일을 어떤 **관점**에서 수행했는가"를 나타내며,  
직무(job title)가 아니라 **작업의 성격**을 반영한다.  
같은 사람이 주차별로 다양한 domain에서 작업할 수 있다.

| Domain | 설명 | 대표 사례 |
|--------|------|----------|
| Planning | 기획·정보 구조·요구 정의·정책 설계 | IA 개편, 기능 요구사항 작성 |
| Design | UX/UI·화면 구조·사용자 경험 설계 | UI 시안, UX 플로우 정리 |
| Frontend | 클라이언트 로직·UI 개발·상태 관리 | 컴포넌트 개발, API 연동 |
| Backend | 서버 로직·데이터 모델링·API 개발 | API 개발, DB 스키마 정의 |
| Operation | 팀 운영·프로세스 정비·문서화 | 온보딩 문서, 운영 정책 정비 |
| Collaboration | 유관부서 공동 작업·조율·협업 | 영업/마케팅 협업, 외부 파트너 대응 |
| Content | 문서·시트·튜토리얼 등 콘텐츠 제작 | 실습 시트 제작, 가이드 문서 |
| Research | 실험·파일럿 검증·기술 탐색 | 신규 라이브러리 테스트 |

## 2.2 Project (업무가 속한 실질적 프로젝트)

- MOTIIV
- M-Connector
- M-Desk
- Idea-forge
- (확장 가능)

## 2.3 Module (프로젝트 내부 하위 영역)

예: MOTIIV 기준
- Workspace
- TeamProject
- Spreadsheet
- Home
- Profile
- Badge
- Notification

각 프로젝트별로 자유롭게 정의한다.

## 2.4 Feature (모듈 내 구체적인 기능 단위)

스냅샷을 대표하는 핵심 기능/작업 단위.

예:
- Rich-note
- Import-Engine
- Login-Flow
- Cell-Rendering

---

# 3. Name 필드

작업을 수행한 팀원의 이름.

```
* Name: 김서연
```

---

# 4. Past Week 블록

지난 주 실제 수행 내용을 기록하는 블록.

## 4.1 Tasks (필수)

한 줄당 하나의 task를 기록하며, **반드시 괄호 안에 진행률 %를 포함**한다.

```
* Past Week
    * Tasks
        * Rich-note 편집 패널 구조 리팩토링 (50%)
        * toolbar 단축키 매핑 개선 (100%)
        * Rich-note ↔ Formula Tracer 공통 UI 컴포넌트 분리 (75%)
```

**규칙:**
- 진행률은 0~100% 범위
- 100%는 완료된 작업을 의미
- 진행률을 기반으로 Feature/Module/Project 단위 집계가 이루어진다.

## 4.2 Risk (Optional)

작업 과정에서 발생한 리스크 또는 잠재적 문제 요소.

```
    * Risk
        * toolbar 단축키 충돌 가능성 존재 (사용자 정의 단축키 기능과 충돌 우려)
```

**없는 경우:**
```
    * Risk: None
```

## 4.3 RiskLevel (Optional)

리스크의 심각도 레벨 (숫자).

| Level | 의미 |
|-------|------|
| 0 | 없음 / 영향 낮음 |
| 1 | 경미, 인지 필요 |
| 2 | 주의 필요, 후속 조치 요구 |
| 3 | 심각, 리소스·우선순위 조정 필요 |

```
    * RiskLevel: 1
```

**없는 경우:**
```
    * RiskLevel: None
```

## 4.4 Collaborators (Optional)

이번 주 실제 협업 흐름을 기록.

```
    * Collaborators
        * 박민수 (pair)
        * 조해용 (pre)
        * 하성열 (post)
```

**형식:** `이름 (관계)`

**관계 타입:**

| relation | 설명 | 기준 |
|---------|------|-------|
| pair | 실시간 공동 협업 (pair partner) | 둘의 동시 상호작용이 핵심 |
| pre | 앞단 협업자 (pre partner) | 내 작업에 필요한 선행 입력 제공 |
| post | 후단 협업자 (post partner) | 내 결과물을 받아 다음 단계 수행 |

**없는 경우:**
```
    * Collaborators: None
```

---

# 5. This Week 블록

이번 주 계획을 기록하는 블록.

## 5.1 Tasks (필수)

한 줄당 하나의 task를 기록하며, **진행률 없이 텍스트만 작성**한다.

```
* This Week
    * Tasks
        * Rich-note 내 텍스트 스타일링 엔진 개선
        * Formula Tracer와 연동되는 하이라이트 UI 구현
        * 단축키 충돌 테스트 시나리오 작성 및 QA 공유
```

---

# 7. Optional 필드 공통 규칙

Risk, RiskLevel, Collaborators 세 필드는 모두 **Optional**이다.

| 상황 | 표기 방법 |
|------|----------|
| 값이 있는 경우 | 해당 값을 기록 |
| 값이 없는 경우 | 반드시 `None`으로 명시 |

**이유:**
- 파서 입장에서 "값 없음"과 "필드 누락"을 구분하기 위함
- 데이터 일관성 유지

---

# 8. 전체 예시

아래는 완전한 v2 스냅샷 예시이다.

```
[Frontend / MOTIIV / Spreadsheet / Rich-note]

* Name: 김서연
* Define
    * Domain: Frontend
    * Project: MOTIIV
    * Module: Spreadsheet
    * Feature: Rich-note
* Past Week
    * Tasks
        * Rich-note 편집 패널 구조 리팩토링 (50%)
        * toolbar 단축키 매핑 개선 (100%)
        * Rich-note ↔ Formula Tracer 공통 UI 컴포넌트 분리 (75%)
    * Risk
        * toolbar 단축키 충돌 가능성 존재 (사용자 정의 단축키 기능과 충돌 우려)
    * RiskLevel: 1
    * Collaborators
        * 박민수 (pair)
        * 조해용 (pre)
        * 하성열 (post)
* This Week
    * Tasks
        * Rich-note 내 텍스트 스타일링 엔진 개선
        * Formula Tracer와 연동되는 하이라이트 UI 구현
        * 단축키 충돌 테스트 시나리오 작성 및 QA 공유
```

---

# 9. v1 대비 v2 변경 사항 요약

| 항목 | v1 | v2 |
|------|----|----|
| 헤더 | `[Domain / Project / Module / Topic]` | `[Domain / Project / Module / Feature]` |
| 작업 계층 | Topic (자유 텍스트) | Feature (기능 단위) |
| 주간 구조 | Plan → Progress → Next | Past Week → This Week |
| 진행률 | Progress 필드에 % 포함 | Past Week Tasks 각 항목에 % 포함 |
| 계획 | Plan 필드 | This Week Tasks |
| Define 블록 | 없음 | 필수 (Domain/Project/Module/Feature 명시) |
| Optional 필드 | 생략 가능 | 반드시 `None` 명시 |

---

# 10. 스냅샷 데이터 활용

| 요소 | 활용 |
|------|------|
| Domain | 역할/역량 분포 분석 |
| Project | 프로젝트별 흐름 파악 |
| Module | 기능 단위 집중도·병목 분석 |
| Feature | 세부 기능 추적, 진행률/리스크 집계 |
| Past Week Tasks | 개별 작업 진행률, Feature 단위 평균 계산 |
| Collaborators | 협업 패턴 분석, 블로킹 요소 탐지 |

---

# 11. 파서 입력 형식 요약 (개발자용)

파서가 기대하는 텍스트 구조:

```
[Domain / Project / Module / Feature]
* Name: {string}
* Past Week
    * Tasks
        * {task description} ({progress}%)
        * ...
    * Risk
        * {risk description}
        * ... (또는 "Risk: None")
    * RiskLevel: {0|1|2|3|None}
    * Collaborators
        * {name} ({pair|pre|post})
        * ... (또는 "Collaborators: None")
* This Week
    * Tasks
        * {task description}
        * ...
```

**파서 출력 JSON 스키마:**

```json
{
  "domain": "Frontend",
  "project": "MOTIIV",
  "module": "Spreadsheet",
  "feature": "Rich-note",
  "name": "김서연",
  "pastWeek": {
    "tasks": [
      { "title": "Rich-note 편집 패널 구조 리팩토링", "progress": 50 },
      { "title": "toolbar 단축키 매핑 개선", "progress": 100 },
      { "title": "Rich-note ↔ Formula Tracer 공통 UI 컴포넌트 분리", "progress": 75 }
    ],
    "risk": ["toolbar 단축키 충돌 가능성 존재 (사용자 정의 단축키 기능과 충돌 우려)"],
    "riskLevel": 1,
    "collaborators": [
      { "name": "박민수", "relation": "pair" },
      { "name": "조해용", "relation": "pre" },
      { "name": "하성열", "relation": "post" }
    ]
  },
  "thisWeek": {
    "tasks": [
      "Rich-note 내 텍스트 스타일링 엔진 개선",
      "Formula Tracer와 연동되는 하이라이트 UI 구현",
      "단축키 충돌 테스트 시나리오 작성 및 QA 공유"
    ]
  }
}
```

---

# 12. 요약

스냅샷 v2 포맷은 다음 원칙을 따른다.

1. **계층 구조**: Domain → Project → Module → Feature
2. **주간 구조**: Past Week (Tasks + Risk + RiskLevel + Collaborators) → This Week (Tasks)
3. **진행률**: Past Week Tasks 각 항목에 % 포함
4. **Optional 필드**: 값이 없으면 반드시 `None` 명시
5. **Collaborators**: 이름(pair / pre / post) 형식
6. **Define 블록**: 계층 정보를 명시적으로 정의 (파서 정확성 보장)

본 가이드는 파서, 대시보드, AI 분석 기준에서 동일하게 적용된다.

