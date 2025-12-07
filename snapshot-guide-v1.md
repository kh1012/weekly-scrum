# Weekly Snapshot v1 포맷 가이드

본 문서는 위클리 스크럼 시스템에서 사용하는 공식 스냅샷 입력 포맷(v1)을 정의한다.  
팀원은 이 문서에 따라 매주 Snapshot을 작성하며, 이 데이터는 팀/개인의 대시보드, 협업 분석, 리스크 탐지 등에 활용된다.

아래는 실제 작성되는 스냅샷의 예시다.

[Frontend / MOTIIV / Spreadsheet / 셀 렌더링 개선]
- Name: 김서연
- Plan: 셀 최적화 100% 완료
- Progress: 셀 렌더링 구조화 및 개선 작업 100% 완료
- Next: 렌더링 최적화 마무리 및 저장 테스트 추가
- Risk: 저장 플로우에서 race condition 재발 가능성 확인
- RiskLevel: 1
- Collaborators: 김정빈(pair), 조해용(pre)

# 1. 스냅샷 헤더 구조 v1

스냅샷의 첫 줄은 다음 구조로 이루어진다.

[domain / project / module / topic]

## 1.1 domain
이번 일을 어떤 관점에서 수행했는지를 나타내는 최상위 분류.

- Planning  
- Design  
- Frontend  
- Backend  
- Operation  
- Collaboration  
- Content  
- Research  

## 1.2 project
업무가 속한 프로젝트 이름.

- MOTIIV  
- M-Connector  
- M-Desk  
- Idea-forge  
- 기타 확장 가능

## 1.3 module
프로젝트 내부의 기능 단위 또는 하위 업무 범위.

예시(MOTIIV):
- 워크스페이스  
- 팀프로젝트  
- 스프레드시트  
- 홈  
- 프로필  
- 뱃지  
- 알림  

## 1.4 topic
스냅샷의 주제를 표현하는 구체적인 제목.

예:
- 셀 렌더링 개선  
- Import 구조 개선  
- 권한 모델 정비  
- 온보딩 문서 개편  

# 2. 전체 스냅샷 예시 포맷

[Frontend / MOTIIV / Spreadsheet / 셀 렌더링 개선]
- Name: 김서연
- Plan: 셀 최적화 100% 완료
- Progress: 셀 렌더링 구조화 및 개선 작업 100% 완료
- Next: 렌더링 최적화 마무리 및 저장 테스트 추가
- Risk: 저장 플로우에서 race condition 재발 가능성 확인
- RiskLevel: 1
- Collaborators: 김정빈(pair), 조해용(pre)

# 3. 본문 필드 정의

## 3.1 Name
작업을 수행한 팀원의 이름.

## 3.2 Plan
이번 주 설정 목표. 반드시 Percent(%) 포함.

## 3.3 Progress
이번 주 실제 수행 결과. 반드시 Percent(%) 포함.

Plan과 Progress의 차이를 기반으로 달성률·병목·리스크를 분석한다.

## 3.4 Next
다음 주 혹은 다음 단계에서 이어서 수행할 작업.

## 3.5 Risk
업무에서 발생한 리스크 또는 잠재적 문제. 없으면 생략 가능.

## 3.6 RiskLevel
리스크 강도를 나타내는 0–3 값.

| Level | 의미 |
| ----- | ----- |
| 0 | 없음 / 영향 낮음 |
| 1 | 경미 |
| 2 | 주의 필요 |
| 3 | 심각, 리소스 조정 필요 |

# 4. Collaborators 필드

Collaborators는 다음과 같은 형식으로 기록한다.

이름(relation), 이름(relation)

relation은 **이번 주 실제로 발생한 협업 흐름**만 기록하는 항목이며  
평가나 책임이 아니라 **흐름 관찰 데이터**다.

지원하는 relation 타입은 아래 세 가지다.

## pair (pair partner)
두 역할이 **동시에 공동 작업을 수행한 협업 관계**.

### 기준
- 실시간 상호 조율이 핵심  
- 함께 풀어야만 작업이 성립  
- 결과물에 두 사람의 공동 기여가 명확  

## pre (pre partner)
내 작업의 **앞단에서 선행 정보·맥락·결정 등을 제공하여 이번 주 작업에 영향**을 준 협업 관계.

### 기준
- 내 작업을 위해 선행 작업·확정·스펙·시안 등이 필요  
- 이번 주 흐름에서 실제로 영향을 제공한 경우  
- 선행 영향이 분명하면 기록  

## post (post partner)
내 작업 결과를 **다음 단계에서 이어받아 작업을 진행하는 협업 관계**.

### 기준
- 내 산출물 기반으로 다음 작업이 구성됨  
- 다음 단계에서 영향이 실제로 발생한 경우  

# 5. relation 기록 규칙

## 이번 주 실제 협업만 기록
- pair → 이번 주 실시간 공동 협업  
- pre → 이번 주 내 작업에 실제 영향을 제공  
- post → 이번 주 내 결과를 기반으로 다음 단계 수행  

## 다음 주에 필요할 협업은 기록하지 않음
다음 주 예상 협업은 relation이 아니라 Next에 기술한다.

## 과제가 연속될 경우
이번 주 흐름에서 pre 또는 post 관계가 실제로 존재했다면 반드시 기록한다.

# 6. Collaborators relation 요약

| relation | 의미 | 기준 |
|---------|------|------|
| pair | 실시간 공동 협업 | 둘이 동시에 작업해 흐름이 전진 |
| pre | 앞단 협업자 | 내 작업에 필요한 입력·맥락·결정 제공 |
| post | 후단 협업자 | 내 작업 결과를 기반으로 다음 단계 진행 |

# 7. 스냅샷 데이터 활용

| 요소 | 활용 |
|------|------|
| domain | 역할/역량 분포 분석 |
| project | 프로젝트별 업무 흐름 파악 |
| module | 기능 단위 집중도 및 병목 탐지 |
| topic | 업무 단위 추적 |
| collaborators | 협업 패턴 분석, 블로킹 탐지, 역할 간 흐름 이해 |

# 8. 요약

스냅샷 v1 포맷은 다음 구조를 따른다.

1. domain → project → module → topic  
2. Plan → Progress → Next → Risk → RiskLevel  
3. Collaborators: 이름(pair / pre / post)  
4. relation 설명은 문서 내에서만 (pair partner), (pre partner), (post partner)로 표기  
5. 실제 협업 흐름 기반의 데이터 기록을 목표로 한다

본 가이드는 파서, 대시보드, AI 분석 기준에서 동일하게 사용된다.