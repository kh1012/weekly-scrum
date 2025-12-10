# Snapshot Validation v2 지침

본 문서는 AI 또는 스크립트가 스냅샷 데이터를 검증할 때 참고하는 룰북이다.

---

## 1. Purpose

이 문서는 다음을 목적으로 한다:

1. 스냅샷 데이터가 v2 스키마를 준수하는지 자동 검증
2. AI 기반 검증 시 일관된 규칙 적용
3. 데이터 품질 보장 및 오류 조기 발견

---

## 2. Input Format

### 2.1 JSON 배열 형식 (권장)

```json
[
  {
    "name": "김서연",
    "domain": "Frontend",
    "project": "MOTIIV",
    "module": "Spreadsheet",
    "feature": "Rich-note",
    "pastWeek": { ... },
    "thisWeek": { ... }
  },
  { ... }
]
```

### 2.2 Plain Text 형식

```
[Frontend / MOTIIV / Spreadsheet / Rich-note]

* Name: 김서연
* Past Week
    * Tasks
        ...
```

> **참고**: Define 블록은 v2에서 삭제됨. 헤더에서 계층 정보를 추출.

여러 스냅샷은 `---` 또는 빈 줄 두 개로 구분한다.

---

## 3. Schema Rules

### 3.1 필수 필드

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| name | string | O | 작성자 이름, 빈 문자열 불가 |
| domain | string | O | 업무 관점 분류, 빈 문자열 불가 |
| project | string | O | 프로젝트명, 빈 문자열 불가 |
| module | string | O | 모듈명 (빈 문자열 허용) |
| feature | string | O | 기능명, 빈 문자열 불가 |
| pastWeek | object | O | 지난 주 블록 |
| pastWeek.tasks | array | O | 작업 목록 (최소 1개 이상 권장) |
| thisWeek | object | O | 이번 주 블록 |
| thisWeek.tasks | array | O | 계획 목록 |

### 3.2 선택 필드

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| pastWeek.risks | string[] \| null | null | 리스크 목록 |
| pastWeek.riskLevel | 0 \| 1 \| 2 \| 3 \| null | null | 리스크 레벨 |
| pastWeek.collaborators | array | [] | 협업자 목록 |

### 3.3 Task 구조

**Past Week Task:**
```typescript
{
  title: string;    // 필수, 빈 문자열 불가
  progress: number; // 필수, 0-100 범위
}
```

**This Week Task:**
```typescript
string // 빈 문자열 불가
```

### 3.4 Collaborator 구조

```typescript
{
  name: string;                        // 필수, 빈 문자열 불가
  relations: ("pair" | "pre" | "post")[] // v2: 배열 형태
}
```

또는 (하위 호환):

```typescript
{
  name: string;
  relation: "pair" | "pre" | "post"    // v1: 단일 값
}
```

### 3.5 유효한 Module 값 (MOTIIV 기준)

| Module | 설명 |
|--------|------|
| Home | 홈 화면 |
| Discovery | Article, Projects, Portfolio 등 |
| Spreadsheet | 스프레드시트 기능 |
| Workspace | Team Project 등 |
| Account | 프로필, 계정, 설정 |
| Engagement System | 인기 컨텐츠, 뱃지, 알림, 이메일 등 |
| Navigation | IA, 메뉴 설계 변경, 페이지 구조 개편 등 |
| Tracking | HubSpot, GA 등 활동 기반 데이터 추적 |

> 기타 프로젝트(M-Connector, M-Desk, Idea-forge)의 Module은 확정 시 추가 예정

---

## 4. Content Rules

### 4.1 진행률 규칙

| 규칙 | 설명 | 심각도 |
|------|------|--------|
| 범위 제한 | progress는 0-100 사이 | error |
| 정수 권장 | 소수점은 경고만 발생 | warning |
| 음수 불가 | 음수 값은 오류 | error |

### 4.2 리스크 규칙

| 규칙 | 설명 | 심각도 |
|------|------|--------|
| 레벨 범위 | riskLevel은 0, 1, 2, 3, null 중 하나 | error |
| 일관성 | risks가 있으면 riskLevel도 있어야 함 | warning |
| 빈 배열 처리 | risks: [] → null로 정규화 | info |

### 4.3 협업자 규칙

| 규칙 | 설명 | 심각도 |
|------|------|--------|
| 관계 유효성 | relations는 "pair", "pre", "post"만 허용 | error |
| 중복 제거 | 같은 이름의 협업자 중복 시 경고 | warning |
| 빈 relations | relations가 빈 배열이면 오류 | error |

### 4.4 텍스트 규칙

| 규칙 | 설명 | 심각도 |
|------|------|--------|
| 빈 필수 필드 | name, domain, project, feature가 빈 문자열이면 오류 | error |
| 공백 정리 | 앞뒤 공백은 자동 제거 권장 | info |
| 특수문자 | 대부분 허용, 단 파서 구분자 제외 | info |

---

## 5. Backward Compatibility Rules

### 5.1 risk → risks 변환

```typescript
// v1 형식
{ "risk": ["리스크 내용"] }

// v2 형식으로 변환
{ "risks": ["리스크 내용"] }
```

**규칙:**
- `risk` 필드가 존재하고 `risks`가 없으면 → `risks`로 복사
- 둘 다 존재하면 → `risks` 우선
- `risk`가 문자열이면 → 배열로 감싸기

### 5.2 relation → relations 변환

```typescript
// v1 형식
{ "name": "김서연", "relation": "pair" }

// v2 형식으로 변환
{ "name": "김서연", "relations": ["pair"] }
```

**규칙:**
- `relation` 필드가 존재하고 `relations`가 없으면 → 배열로 변환
- 둘 다 존재하면 → `relations` 우선

### 5.3 Topic → Feature 변환

```typescript
// v1 형식
{ "topic": "Rich-note" }

// v2 형식으로 변환
{ "feature": "Rich-note" }
```

### 5.4 Define 블록 무시

```
* Define
    * Domain: Frontend
    * Project: MOTIIV
    ...
```

**규칙:**
- Define 블록이 존재해도 무시 (헤더에서 추출)
- 헤더와 Define이 충돌하면 → 헤더 우선

---

## 6. Validation Output Format

### 6.1 기본 구조

```json
{
  "isValid": boolean,
  "totalSnapshots": number,
  "validCount": number,
  "warningCount": number,
  "errorCount": number,
  "results": [
    {
      "index": 0,
      "status": "ok" | "warning" | "error",
      "snapshot": { "name": "...", "feature": "..." },
      "messages": [
        {
          "type": "error" | "warning" | "info",
          "field": "pastWeek.tasks[0].progress",
          "message": "진행률은 0-100 범위여야 합니다",
          "value": 150
        }
      ]
    }
  ]
}
```

### 6.2 상태 정의

| 상태 | 조건 |
|------|------|
| ok | 오류 및 경고 없음 |
| warning | 경고만 있고 오류 없음 |
| error | 오류가 하나 이상 존재 |

### 6.3 메시지 유형

| 유형 | 설명 |
|------|------|
| error | 스키마 위반, 반드시 수정 필요 |
| warning | 권장사항 위반, 수정 권장 |
| info | 참고 정보, 수정 불필요 |

---

## 7. Examples

### 7.1 올바른 예제

```json
{
  "name": "김서연",
  "domain": "Frontend",
  "project": "MOTIIV",
  "module": "Spreadsheet",
  "feature": "Rich-note",
  "pastWeek": {
    "tasks": [
      { "title": "컴포넌트 개발", "progress": 80 }
    ],
    "risks": null,
    "riskLevel": null,
    "collaborators": []
  },
  "thisWeek": {
    "tasks": ["테스트 코드 작성"]
  }
}
```

**예상 결과:**
```json
{
  "index": 0,
  "status": "ok",
  "messages": []
}
```

### 7.2 경고 예제

```json
{
  "name": "김서연",
  "domain": "Frontend",
  "project": "MOTIIV",
  "module": "",
  "feature": "Rich-note",
  "pastWeek": {
    "tasks": [
      { "title": "컴포넌트 개발", "progress": 80.5 }
    ],
    "risks": ["리스크 존재"],
    "riskLevel": null,
    "collaborators": []
  },
  "thisWeek": {
    "tasks": []
  }
}
```

**예상 결과:**
```json
{
  "index": 0,
  "status": "warning",
  "messages": [
    {
      "type": "warning",
      "field": "pastWeek.tasks[0].progress",
      "message": "진행률은 정수를 권장합니다",
      "value": 80.5
    },
    {
      "type": "warning",
      "field": "pastWeek.riskLevel",
      "message": "risks가 있으면 riskLevel도 지정하는 것이 좋습니다"
    },
    {
      "type": "warning",
      "field": "thisWeek.tasks",
      "message": "이번 주 계획이 비어 있습니다"
    }
  ]
}
```

### 7.3 오류 예제

```json
{
  "name": "",
  "domain": "Frontend",
  "project": "MOTIIV",
  "module": "Spreadsheet",
  "feature": "Rich-note",
  "pastWeek": {
    "tasks": [
      { "title": "", "progress": 150 }
    ],
    "risks": null,
    "riskLevel": 5,
    "collaborators": [
      { "name": "김서연", "relations": ["invalid"] }
    ]
  },
  "thisWeek": {
    "tasks": ["계획"]
  }
}
```

**예상 결과:**
```json
{
  "index": 0,
  "status": "error",
  "messages": [
    {
      "type": "error",
      "field": "name",
      "message": "이름은 필수입니다",
      "value": ""
    },
    {
      "type": "error",
      "field": "pastWeek.tasks[0].title",
      "message": "작업 제목은 필수입니다",
      "value": ""
    },
    {
      "type": "error",
      "field": "pastWeek.tasks[0].progress",
      "message": "진행률은 0-100 범위여야 합니다",
      "value": 150
    },
    {
      "type": "error",
      "field": "pastWeek.riskLevel",
      "message": "riskLevel은 0, 1, 2, 3, null 중 하나여야 합니다",
      "value": 5
    },
    {
      "type": "error",
      "field": "pastWeek.collaborators[0].relations[0]",
      "message": "relation은 'pair', 'pre', 'post' 중 하나여야 합니다",
      "value": "invalid"
    }
  ]
}
```

---

## 8. AI Prompt Template

### 8.1 검증 요청 프롬프트

```
아래 JSON 배열이 snapshot-validation-v2.md에 정의된 규칙을 모두 만족하는지 검사하세요.

규칙 요약:
1. 필수 필드: name, domain, project, feature, pastWeek, thisWeek
2. pastWeek.tasks: 각 항목에 title(필수)과 progress(0-100) 필요
3. thisWeek.tasks: 빈 문자열 불가
4. collaborators.relations: "pair", "pre", "post"만 허용
5. riskLevel: 0, 1, 2, 3, null만 허용
6. 빈 필수 필드는 오류로 처리
7. Define 블록은 무시 (헤더 우선)

검증할 데이터:
```json
[입력 데이터]
```

응답 형식:
```json
{
  "isValid": boolean,
  "results": [
    {
      "index": number,
      "status": "ok" | "warning" | "error",
      "messages": [{ "type": "...", "field": "...", "message": "..." }]
    }
  ]
}
```
```

### 8.2 수정 요청 프롬프트

```
아래 스냅샷 데이터에서 발견된 오류를 수정해주세요.

발견된 오류:
- [오류 목록]

원본 데이터:
```json
[원본 데이터]
```

수정 후 v2 스키마를 준수하는 JSON을 반환해주세요.
```

### 8.3 변환 요청 프롬프트 (v1 → v2)

```
아래 v1 형식의 스냅샷 데이터를 v2 형식으로 변환해주세요.

변환 규칙:
1. topic → feature
2. risk (문자열 또는 배열) → risks (배열)
3. collaborator.relation → collaborator.relations (배열)
4. plan/progress/next → pastWeek/thisWeek 구조
5. Define 블록 삭제 (헤더로 대체)

원본 v1 데이터:
```json
[v1 데이터]
```

v2 형식으로 변환된 JSON을 반환해주세요.
```

---

## 9. 검증 체크리스트

스냅샷 검증 시 다음 항목을 순서대로 확인:

### 필수 검증
- [ ] name이 존재하고 빈 문자열이 아닌가?
- [ ] domain이 존재하고 빈 문자열이 아닌가?
- [ ] project가 존재하고 빈 문자열이 아닌가?
- [ ] feature가 존재하고 빈 문자열이 아닌가?
- [ ] pastWeek 객체가 존재하는가?
- [ ] pastWeek.tasks 배열이 존재하는가?
- [ ] thisWeek 객체가 존재하는가?
- [ ] thisWeek.tasks 배열이 존재하는가?

### Task 검증
- [ ] 각 pastWeek.task에 title이 있는가?
- [ ] 각 pastWeek.task의 progress가 0-100 범위인가?
- [ ] 각 thisWeek.task가 빈 문자열이 아닌가?

### 선택 필드 검증
- [ ] riskLevel이 0, 1, 2, 3, null 중 하나인가?
- [ ] collaborator.relations가 유효한 값들인가?

### 하위 호환성 검증
- [ ] v1 필드가 있으면 v2로 변환되었는가? (risk → risks, relation → relations)
- [ ] Define 블록이 있으면 무시되었는가?

---

## 10. 요약

| 항목 | 설명 |
|------|------|
| 목적 | v2 스냅샷 데이터 자동 검증 |
| 입력 | JSON 배열 또는 Plain Text |
| 출력 | 검증 결과 (status, messages) |
| 심각도 | error > warning > info |
| 하위 호환 | v1 필드 자동 변환 지원 |
| Define 블록 | 무시 (헤더 우선) |
