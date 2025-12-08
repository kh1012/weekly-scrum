# === Snapshot 멀티라인 Progress/Next & Risk "?" 대응 전체 작업 ===

# 목적: submitted-scrum.txt 실제 데이터를 기준으로

# - Progress / Next 의 멀티라인(여러 줄) 케이스를 배열로 파싱

# - Risk / RiskLevel 의 "?" 값을 명시적인 미정 상태로 처리

# - 이 구조가 parse:scrum → JSON → UI → rule_all.md 까지 일관되게 반영되도록 전면 수정한다.

---

## 0. 전제: 기존 변경 사항 유지

이미 아래 변경이 진행 중/완료되었다고 가정하고, **이를 깨지 않고 확장**하는 방향으로 작업한다.

1. 스냅샷 위계

- 이전: `domain -> project -> topic`
- 현재: `domain -> project -> module -> topic`

2. Collaborators

- 이전: `waiting-on`
- 현재: `pre`, `post` 관계

이번 작업은 **위 스키마에 덧붙여서** Progress/Next/Risk/RiskLevel 의 표현을 강화하는 개념이다.

---

## 1. 실제 입력 포맷 분석 (submitted-scrum.txt)

다음 예시들은 모두 `data/submitted-scrum.txt` 에서 나오는 실제 케이스다.

### 예시 1: Progress 멀티라인, Next 단일 라인, Risk/RiskLevel = "?"

[Frontend / Desk / 오류, 공지 처리]

- Name: 손영민
- Plan: 데스크 Notice, Popup 기능 추가 (100%)
- Progress
  - 데스크 Notice, Popup 기능 추가 완료 (100%)
  - 데스크 고객 지원(로그인 실패 문제) 검토 및 1차 대응 완료 (100%)
- Next: 데스크 어카운트 혼합 적용 추가
- Risk: ?
- RiskLevel: ?

### 예시 2: Progress 멀티라인, Next 단일 라인

[Frontend / Motiiv / 아티클 정리 및 기타 업무들]

- Name: 손영민
- Plan: 아티클 정리 및 문서 작업 (100%)
- Progress
  - 신입 온보딩 및 프론트 규칙 협의를 위한 문서 정리 완료 (100%)
  - Article 관련 일부 개선 사항 진행 완료 (100%)
- Next: 다음 스프린트 정리 및 기획 회의 때 나왔던 일부 항목 개선
- Risk: ?
- RiskLevel: ?

### 예시 3: Progress 단일 라인, Next 멀티라인

[Planning / 워크스페이스 / My project 기획]

- Name: 조해용
- Plan: Workspace 중 My project 전체 컨셉 기획(100%)
- Progress: Workspace 중 My project 전체 컨셉 기획(100%)
- Next
  - 워크스페이스 진입 흐름 기획 제안서 (2가지, 비핸스, 피그마?)
  - 폴더 구조 및 디테일 기획
- Risk: 컨셉 확장
- RiskLevel: 1

이 세 케이스를 기준으로 **파서와 스키마, UI를 전부 재정의**한다.

---

## 2. Snapshot 타입/스키마 재정의

### 2-1) Progress / Next 를 배열로 통일

1. Snapshot 데이터 구조(타입/인터페이스/Zod 스키마 등)를 다음 개념으로 맞춘다.

- `plan`: 문자열 (단일 라인, 기존 유지)
- `progress`: 문자열 배열
  - 기존에 문자열 하나만 들어오던 케이스도 `[단일문장]` 형태의 배열로 변환
- `next`: 문자열 배열
  - 단일 라인이던 것도 `[단일문장]` 배열로 변환
- `risk`: 문자열 또는 null
- `riskLevel`: number 또는 null (또는 문자열/enum이 이미 있다면 그 구조 유지)

2. 실제 타입 예시 (참고용 – 실제 타입 이름/파일 위치는 레포 기준으로 맞춰라):

- 변경 전 (예상)

  - `plan: string`
  - `progress: string`
  - `next: string`
  - `risk?: string`
  - `riskLevel?: number | string`

- 변경 후 (의도)

  - `plan: string`
  - `progress: string[]`
  - `next: string[]`
  - `risk: string | null`
  - `riskLevel: number | null`
    - 혹은 enum/string 기반이면 `"1" | "2" | ... | null` 형태

3. 타입/스키마 변경 범위:

- Snapshot 관련 모든 타입 정의
- Zod/JSON 스키마가 있으면 그 쪽도 동일하게 수정
- 이 타입을 사용하는 유틸/서비스 코드까지 함께 리팩터링

### 2-2) "?" 처리 규칙

Risk, RiskLevel 에서 `?` 는 다음과 같이 처리한다.

- 입력 값이 `?` 또는 공백/undefined 이면:
  - `risk = null`
  - `riskLevel = null`
- rule_all.md 에서도 `?` 는 “아직 정의되지 않은 리스크 / 판단 보류 상태”임을 명시하고,
  - 리포트 상에서 “리스크 없음”과 혼동되지 않도록 한다.

---

## 3. parse:scrum 스크립트 수정

### 3-1) 스크립트 위치 및 구조 확인

1. `package.json` 에서 `"parse:scrum"` 스크립트를 찾아 실제 실행되는 파일을 열어라.
2. 해당 파일에서:

- `data/submitted-scrum.txt` 를 읽는 부분
- 스냅샷 단위로 파싱하는 부분
- JSON 파일을 출력하는 부분
  을 모두 확인한다.

이 파일이 **이번 작업의 진원지**다. 여기서 Progress/Next 멀티라인과 Risk `?` 를 제대로 처리해야 한다.

### 3-2) Progress / Next 파싱 로직 수정

다음 규칙으로 파싱 로직을 바꾼다.

1. Progress 인식 규칙

- 한 줄이 `* Progress` 로만 되어 있으면:
  - 그 다음에 나오는 `* ` 또는 `- ` 로 시작하는 들여쓰기 된 라인들을 **Progress 항목 배열**로 모은다.
    - 예시:
      - `* Progress`
      - `    * A 작업 (100%)`
      - `    * B 작업 (100%)`  
        → `progress = ["A 작업 (100%)", "B 작업 (100%)"]`
- 한 줄이 `* Progress:` 로 시작하고 그 뒤에 내용이 바로 있으면:
  - 해당 한 줄 전체를 하나의 요소로 갖는 배열로 만든다.
    - 예시:
      - `* Progress: Workspace 중 My project 전체 컨셉 기획(100%)`  
        → `progress = ["Workspace 중 My project 전체 컨셉 기획(100%)"]`

2. Next 인식 규칙

- 한 줄이 `* Next` 로만 되어 있으면:
  - 그 다음에 나오는 들여쓰기 된 `*`/`-` 라인들을 **Next 항목 배열**로 모은다.
    - 예시:
      - `* Next`
      - `    * 워크스페이스 진입 흐름 기획 제안서 (2가지, 비핸스, 피그마?)`
      - `    * 폴더 구조 및 디테일 기획`  
        → `next = ["워크스페이스 진입 흐름 기획 제안서 (2가지, 비핸스, 피그마?)", "폴더 구조 및 디테일 기획"]`
- 한 줄이 `* Next:` 로 시작하면:
  - 해당 한 줄 뒤쪽 텍스트를 하나의 요소로 갖는 배열로 만든다.
    - 예시:
      - `* Next: 데스크 어카운트 혼합 적용 추가`  
        → `next = ["데스크 어카운트 혼합 적용 추가"]`

3. Plan 은 그대로 단일 문자열로 파싱한다.

- 예시:
  - `* Plan: 아티클 정리 및 문서 작업 (100%)`  
    → `plan = "아티클 정리 및 문서 작업 (100%)"`

4. Risk / RiskLevel 파싱

- `* Risk:` 뒤에 오는 텍스트가:
  - `?` 이면 → `risk = null`
  - 공백이면 → `risk = null`
  - 그 외 텍스트면 → `risk = "그 텍스트"`
- `* RiskLevel:` 도 동일 규칙
  - `?` → `riskLevel = null`
  - 숫자로 파싱 가능하면 → number 로 변환 (예: `"1"` → `1`)
  - 그 외 애매한 문자열은 일단 문자열 그대로 두되, rule_all.md 에 이 케이스에 대한 해석 기준을 추가할 수 있다.

### 3-3) 샘플 JSON 구조 (위 세 예시 기준)

세 예시를 실제로 파싱했을 때의 결과가 대략 아래와 같이 나오도록 스크립트를 맞춘다.
(도메인/프로젝트/모듈/토픽/기타 필드는 실제 로직에 맞게 추가되므로 여기서는 핵심 필드만 예시)

1. [Frontend / Desk / 오류, 공지 처리]

- progress:
  - `["데스크 Notice, Popup 기능 추가 완료 (100%)", "데스크 고객 지원(로그인 실패 문제) 검토 및 1차 대응 완료 (100%)"]`
- next:
  - `["데스크 어카운트 혼합 적용 추가"]`
- risk: `null`
- riskLevel: `null`

2. [Frontend / Motiiv / 아티클 정리 및 기타 업무들]

- progress:
  - `["신입 온보딩 및 프론트 규칙 협의를 위한 문서 정리 완료 (100%)", "Article 관련 일부 개선 사항 진행 완료 (100%)"]`
- next:
  - `["다음 스프린트 정리 및 기획 회의 때 나왔던 일부 항목 개선"]`
- risk: `null`
- riskLevel: `null`

3. [Planning / 워크스페이스 / My project 기획]

- progress:
  - `["Workspace 중 My project 전체 컨셉 기획(100%)"]`
- next:
  - `["워크스페이스 진입 흐름 기획 제안서 (2가지, 비핸스, 피그마?)", "폴더 구조 및 디테일 기획"]`
- risk: `"컨셉 확장"`
- riskLevel: `1`

이 형태가 실제 파서 결과와 **완전히 일치**하도록 코드를 조정한다.

---

## 4. UI/사이트에 멀티라인 Progress/Next 반영

### 4-1) 타입 변경 대응

1. 스냅샷 데이터를 사용하는 모든 컴포넌트/페이지에서,

- `progress`, `next` 를 더 이상 string 으로 가정하지 말고 `string[]` 로 처리한다.
- 과거 코드가 단일 string 을 기대하고 있다면 다음 두 가지 중 하나를 선택:
  - 통일해서 `string[]`으로만 쓰도록 바꾸고 필요 시 `join("\n")` / `join(" • ")` 등으로 표현
  - 타입을 `string | string[]` 로 두고, 렌더링 시 배열 여부에 따라 분기 → 추천하지 않음 (혼란 가중)

이번 작업에서는 **가능하면 전부 배열로 통일**하고, 과거 데이터는 파서 단계에서 배열로 감싸는 방식으로 맞춘다.

### 4-2) 렌더링 규칙

1. Progress / Next 렌더링

- `progress`:
  - 요소가 1개일 때:
    - 기존처럼 한 줄 텍스트로 렌더링해도 되고,
    - 혹은 `<ul><li>` 형태를 일관되게 써도 된다. (디자인 시스템에 맞춰 결정)
  - 요소가 여러 개일 때:
    - `<ul><li>` 리스트, 또는 카드 목록 등으로 시각적으로 분리해서 보여준다.
- `next`:
  - 동일하게 배열 기준으로 리스트 렌더링.
  - Next 에 여러 줄이 들어가면 “다음 주 해야 할 일 목록”이 명확하게 보이도록 스타일을 조정한다.

2. Risk / RiskLevel 렌더링

- `risk === null` && `riskLevel === null` 인 경우:
  - “리스크 없음”으로 오해되지 않도록:
    - “미정”, “입력 없음”, “? 로 제출됨” 등 명시적인 라벨을 사용
- 리스크가 문자열이고, 리스크 레벨이 숫자일 때:
  - 기존 rule_all.md 의 레벨 정의(1,2,3…)대로 색상/뱃지/아이콘을 유지한다.

3. 멀티라인 데이터가 그래프/집계에 쓰이는 경우:

- Progress/Next 의 개별 항목은 “세부 설명”으로 보고,
  - 통계/집계는 기존과 동일하게 plan/progress 퍼센트 추출 로직을 그대로 사용하되,
  - 배열 각 요소에서 `%` 값을 파싱해서 적절히 처리한다.  
    (기존에 한 줄에서만 `%`를 뽑았다면, 이제는 모든 요소를 순회하면서 `%`를 추출하거나 첫 요소만 기준으로 삼는 등 정책을 코드에 명시한다.)

---

## 5. rule_all.md 업데이트

rule_all.md 는 **“어떻게 써야 하는지 + 어떻게 읽어야 하는지”**를 모두 담는 문서다. 이번 변경에 맞춰 다음 내용을 반드시 반영한다.

### 5-1) Progress / Next 작성 가이드

1. Progress

- 단일 업무라면:
  - 한 줄로 작성해도 되고, 파서가 `[한 줄]` 배열로 변환한다.
- 여러 개의 결과를 남기고 싶다면:
  - `* Progress` 다음에 들여쓰기 된 `*` 리스트 형태로 여러 줄 작성하는 패턴을 문서에 명시한다.
- 예시:
  - `* Progress`
    - `    * Notice, Popup 기능 추가 완료 (100%)`
    - `    * 로그인 실패 관련 고객 지원 1차 대응 완료 (100%)`

2. Next

- 단일 항목:
  - `* Next: 데스크 어카운트 혼합 적용 추가`
- 여러 항목:
  - `* Next`
    - `    * 워크스페이스 진입 흐름 기획 제안서 (2가지, 비핸스, 피그마?)`
    - `    * 폴더 구조 및 디테일 기획`

3. rule_all.md 에 “Progress/Next 는 **배열로 저장되며, UI 에서 리스트로 표현된다**”는 점을 명시해라.

### 5-2) Risk / RiskLevel "?" 정책 명시

1. `Risk: ?`, `RiskLevel: ?` 로 제출하는 것은:

- “리스크를 아직 정의하지 못했음” 또는 “리스크 평가를 보류함”을 의미하는 상태로 정의한다.
- parse:scrum 에서 이것을 `null` 로 변환하는 이유를 문서에 적어둔다.

2. 리포트/인사이트 도출 시:

- `risk == null && riskLevel == null` 인 항목은
  - “리스크 없음(no risk)”으로 집계하는 것이 아니라
  - “리스크 미정(unknown)”으로 별도로 분류해야 한다는 해석 기준을 기술해라.

3. 예시 섹션에 위 세 개의 실제 케이스(멀티라인 Progress/Next, `?` Risk)를 그대로 가져와서,

- “이렇게 작성하면 JSON 에서는 이렇게 들어가고, UI 에서는 이렇게 보인다”까지 1:1 매핑 설명을 추가해라.

---

## 6. 최종 체크리스트

아래 항목이 모두 충족되는지 마지막에 점검한다.

1. parse:scrum

- submitted-scrum.txt 의 세 예시가 **Progress/Next 배열, Risk/RiskLevel null 처리**로 정확히 변환되는지
- 기존 단일 라인 케이스도 배열로 래핑되어 타입이 일관적인지

2. 타입/스키마

- Snapshot 관련 타입에서 `progress`, `next` 가 모두 `string[]` 로 통일되었는지
- `risk`, `riskLevel` 의 null 처리가 명확한지

3. UI

- Progress/Next 가 여러 줄일 때도 레이아웃 깨짐 없이 리스트/카드 형태로 잘 보이는지
- 단일 항목일 때도 기존 사용 경험을 크게 해치지 않는지
- Risk 미정 상태가 “리스크 없음”과 혼동되지 않는지

4. rule_all.md

- Progress/Next 멀티라인 작성 방법이 예제로 포함됐는지
- `?` 사용 시 의미와 변환 규칙이 명시됐는지
- 문서 내용이 실제 파서/타입/UI 동작과 **모순 없이** 일치하는지

5. 회귀

- 이전에 적용했던
  - domain → project → module → topic 계층 구조
  - collaborators 의 pre/post 관계
    와 이번 변경이 충돌하지 않는지 다시 한 번 확인한다.

---

## 7. 수행 방식

위 내용을 기준으로 다음 순서로 실제 코드를 수정해라.

1. Snapshot 타입/스키마 먼저 수정
2. parse:scrum 에서 Progress/Next/Risk/RiskLevel 파싱 개선
3. 생성된 JSON 을 기준으로 UI 컴포넌트 리팩터링
4. rule_all.md 문서 업데이트
5. 세 예시를 기준으로 실제 렌더링 결과 검증
6. 당연히 각 단계가 끝날때 마다, yarn build한 후 검증 작업과 git commit을 수행해.

이 순서로 진행하면서, 각 단계가 끝날 때마다 간단한 diff 요약을 남겨라.
