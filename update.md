너는 Next.js + TypeScript + React + Tailwind 기반의 “위클리 스크럼” 사이트를 개선하는 작업을 수행하는 AI 개발 파트너다.
이 레포는 주간 스냅샷 텍스트를 파싱해서, 팀/개인 대시보드를 시각화하는 용도로 사용된다.

이번 작업의 목표는 다음과 같다:

1. 데이터 스키마 확장

   - module 개념 추가 (프로젝트 종류와 상관없이 제한 없음)
   - collaborators 개념 추가 (이름(relation) 형식으로 단순화)

2. 기존 시각화 페이지에 module / collaborators 정보를 1차 반영

3. README.md 문서에 module / collaborators 개념, 제약, 예시 문서화

4. 협업/모듈 기반의 팀·개인 대시보드 개선

5. 모든 작업은 단계별로 진행하며, 각 단계 종료 시:
   - yarn lint
   - yarn test (있다면)
   - yarn build
   - 커밋(commit)
     을 반드시 수행한다.

# 1. 현재 구조 파악

레포 전체를 스캔하여 다음을 찾는다:

- 스냅샷 텍스트 → JSON 변환 파서 (parseSnapshot 등)
- Snapshot 타입 정의 (Snapshot, Work, Detail 등)
- 팀 시각화 페이지 (/stats, /overview, /team, /snapshots 등)
- 개인 대시보드 페이지 (MyDashboardView, MyPage, my/ 등)
- README.md 내 스냅샷 문서

모든 코드를 읽고 아래 형태의 PLAN 주석을 생성한다:
/ PLAN:
// 1) snapshot parser 수정
// 2) 타입 확장
// 3) 팀 페이지 반영
// 4) 개인 대시보드 반영
// 5) README 업데이트
// 단계별 yarn lint → yarn test → yarn build → commit

# 2. 데이터 형식 및 스키마 요구사항

## 2-1. 팀원이 입력하는 스냅샷 포맷

기존 포맷 예시는 다음과 같다:

[Frontend / MOTIIV / 셀 렌더링 개선]

- Name: 김서연
- Plan: ...
- Progress: ...
- Next: ...
- Risk: ...
- RiskLevel: 1

확장 포맷은 다음과 같다:

[Frontend / MOTIIV / Spreadsheet / 셀 렌더링 개선]

- Name: 김서연
- Plan: 셀 최적화 100% 완료
- Progress: 셀 렌더링 구조화 및 개선 작업 100% 완료
- Next: 렌더링 최적화 마무리 및 저장 테스트 추가
- Risk: 저장 플로우에서 race condition 재발 가능성 확인
- RiskLevel: 1

- Collaborators: 김정빈(pair), 조해용(waiting-on)

변경된 요구사항:

- 헤더는 자유롭게 확장 가능 (domain / project / module / topic 구조). module은 특정 project에 한정되지 않는다.
- collaborators의 포맷은 이름(relation)만 포함하며 role은 입력하지 않는다.

## 2-2. 내부 JSON 스키마 (목표 구조)

스냅샷 텍스트는 아래 JSON 형태로 변환된다:

{
"member": {
"name": "김서연",
"role": "FE"
},
"work": {
"domain": "Frontend",
"project": "MOTIIV",
"module": "Spreadsheet",
"topic": "셀 렌더링 개선"
},
"detail": {
"plan": "셀 최적화 100% 완료",
"progress": "셀 렌더링 구조화 및 개선 작업 100% 완료",
"next": "렌더링 최적화 마무리 및 저장 테스트 추가",
"risk": "저장 플로우에서 race condition 재발 가능성 확인",
"riskLevel": 1
},
"collaborators": [
{ "name": "김정빈", "relation": "pair" },
{ "name": "조해용", "relation": "waiting-on" }
],
"meta": {
"week": "2025-W49",
"tags": ["성능", "스프레드시트"],
"status": "in-progress"
}
}

요구사항:

- module은 optional이며 아무 project에서나 사용할 수 있다.
- collaborators는 없으면 빈 배열로 처리한다.
- relation 타입은 아래 중 하나이다:
  'waiting-on' | 'pair' | 'review' | 'handoff'
- role 정보는 JSON에 포함하지 않는다.

# 3. 단계별 작업 지시

## 단계 1: 타입 & 파서 수정 (module + collaborators 반영)

1. Snapshot 타입 정의 수정

   - work.module?: string | null
   - collaborators?: { name: string; relation: Relation }[]
   - Relation = 'waiting-on' | 'pair' | 'review' | 'handoff'

2. 파서 변경

   - 헤더는 "/" 기준 split
     - 3개 → domain, project, topic
     - 4개 이상 → domain, project, module, topic
   - Collaborators 파싱
     - "이름(relation)" 형태
     - 여러 명은 "," 로 구분
   - Week, Tags, Status는 optional meta 값으로 파싱

3. yarn build 실행  
   오류 없도록 개선

4. 커밋 메시지:

feat: extend snapshot schema with module and collaborators

## 단계 2: 팀/전체 시각화에 1차 반영

1. module 반영

   - 모듈 목록을 자동 수집하여 필터/카드/비율 차트 추가
   - module은 특정 프로젝트에 제한되지 않으므로 유연하게 처리할 것

2. collaborators 반영

   - 협업 많은 사람 Top N
   - pair 협업 Top N
   - waiting-on 발생 Top N

3. UI 구성은 기존 컴포넌트 스타일을 유지하되 확장

4. yarn build → commit:

feat: add module and collaborator insights to team dashboards

## 단계 3: 개인 대시보드 개선

최소 기능:

1. "내 협업 상태"

   - 내가 기다리는 사람(waiting-on)
   - 나를 기다리는 사람(waiting-on but reversed)

2. "모듈별 작업 분포"

   - 개인이 어느 module에 시간을 썼는지 시각화

3. "협업 강도 요약"
   - 최근 N주 pair/review/waiting-on 빈도 표시

yarn build → commit:

feat: enhance personal dashboard with module and collaboration analysis

## 단계 4: README.md 업데이트

README에 반드시 다음 포함:

### module 개념

- 프로젝트 종류에 상관없이 module 사용 가능
- 스냅샷 헤더 규칙 예시:
  [Domain / Project / Module / Topic]

### collaborators 개념

- 입력 형식: 이름(relation)
- relation 종류: waiting-on / pair / review / handoff
- optional 필드

### 예시 스냅샷

- module 포함 버전
- module 없이도 가능한 버전
- collaborators 없이도 가능한 버전

### 시각화에서 module/collaborators 활용 방법 요약

커밋:

docs: update README with module & collaborator schema

# 4. 공통 규칙

- 기존 데이터와 100% 호환되어야 함
- 타입 any 사용 금지
- Tailwind/컴포넌트 구조의 기존 패턴 준수
- 새 기능은 확장 가능성 고려
- 모든 단계는 반드시 아래 순서 준수:
  yarn lint → yarn test → yarn build → commit

위 지침을 기반으로 작업을 수행하고, 각 단계를 안전하게 진행하며 필요한 리팩토링도 함께 수행한다.
