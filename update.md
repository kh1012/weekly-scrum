# Cursor V2 단계별 프롬프팅 (스냅샷 관리 개선 / 빌드 검증 / 커밋 포함)

## 역할

너는 “기존 코드베이스를 최대한 존중하면서” 스냅샷 관리(카드 리스트 + 편집 화면) UX를 개선하는 프론트엔드 엔지니어다.

- 임의로 구조를 갈아엎지 말고, 기존 컴포넌트/상태관리/스타일 방식에 맞춰 최소 변경으로 구현한다.
- 모든 변경은 “작은 단위 커밋”으로 쪼갠다.
- 각 단계마다 로컬 빌드/테스트(가능한 범위)를 통과시킨다.
- 모호한 부분이 있으면 “코드에서 이미 존재하는 개념/데이터 스키마”를 우선으로 삼아 일관되게 구현한다(새 스키마 도입 금지).

---

## 0) 사전 점검 (리포 구조 파악)

아래를 먼저 수행하고 결과를 요약해서 보고해.

1. 스냅샷 “카드 리스트/관리 화면” 라우트/페이지 위치 찾기
2. “편집 페이지(폼 + 미리보기)” 라우트/페이지 위치 찾기
3. 스냅샷 데이터 모델(필드: tasks, risk, riskLevel, collaborators/relation 등) 정의 위치 찾기 (types/schema)
4. 카드 렌더링 단위 컴포넌트와 편집 폼 컴포넌트 목록 정리
5. 상태관리 방식 파악 (React state / Zustand / Redux / React Query / Supabase 등)

실행 힌트(너가 알아서 맞춰):

- ripgrep로 키워드 검색: "snapshot", "scrum", "card", "risk", "collaborator", "pastWeek", "thisWeek", "preview"
- Next.js라면 app router/pages router 확인

산출물:

- 관련 파일 경로 리스트
- 어떤 컴포넌트가 어디서 사용되는지 간단한 다이어그램(텍스트)

---

## 1) 카드별 옵션 메뉴로 변경 ("..." + 삭제/복제) [Commit 1]

요구사항:

- 기존 “컨텍스트(페이지 단위)”에서 제공되던 삭제를 “카드별 옵션(…)"로 이동
- 카드 선택 후 삭제가 아니라: 카드 안에서 "..." 클릭 -> 메뉴 -> 삭제
- 카드 복제 기능 추가: "복제" 클릭 시 해당 카드 데이터를 기반으로 새 카드 생성
  - id/createdAt 등은 새로 발급(혹은 기존 생성 로직 재사용)
  - 복제 후: 리스트 상단/바로 아래 등 “기존 규칙”이 있으면 동일하게 따른다

구현 지침:

- 접근성: 버튼은 <button aria-label="옵션"> 형태
- 메뉴는 기존 프로젝트에서 쓰는 Dropdown/Popover가 있으면 그걸 사용. 없으면 간단 구현(외부 라이브러리 추가 금지).
- 삭제는 기존 삭제 로직/confirm 모달/토스트가 있으면 그대로 재사용.
- 복제는 “새 스냅샷 생성 로직”을 재사용해서 입력값만 복사.

검증:

- 카드 1개/여러개에서 옵션 메뉴가 정상 동작
- 삭제/복제가 DB/상태에 반영되고 UI 갱신 확인

커밋:

- feat(snapshot): add per-card overflow menu with delete/duplicate

---

## 2) tasks 진행률 슬라이더 추가 (25% 단위) [Commit 2]

요구사항:

- tasks 입력 필드 “아래”에 진행률 슬라이더 추가
- 25% 단위 선택(0, 25, 50, 75, 100)
- UI는 슬라이더 + 현재 값 표시(예: 50%)
- 기존에 진행률 필드가 이미 있다면(예: percent/progress) 그 필드와 동기화. 없다면 “최소 변경”으로 저장 가능한 필드에 매핑(기존 스키마를 최우선으로 확인)

구현 지침:

- input[type="range"] 사용 가능(단위 25 step)
- 모바일/키보드 조작 고려(좌우키로 step 이동 가능)
- 편집 폼 저장 시 진행률이 정상 반영

검증:

- 값 변경 -> 저장 -> 재진입 시 값 유지
- 25% 단위로만 이동되는지 확인

커밋:

- feat(snapshot): add 25% progress slider under tasks input

---

## 3) Risk: "없음" 초기값 + None 처리 + 작성 비활성화 [Commit 3]

요구사항:

- 리스크는 “없음(초기값)” 버튼/토글을 제공
- “없음”을 누르면 risk 값이 None(또는 null/빈값)로 저장되도록 대체
- 리스크 작성 자체 비활성화(즉, 텍스트 입력은 막고, 상태는 ‘없음’만 유지되는 UX로 보임)
  - 만약 현재 risk를 실제로 입력하고 쓰던 기능이 있다면: UI에는 비활성화 처리하되, 기존 데이터 표시/유지/마이그레이션은 깨지지 않게 한다.

구현 지침:

- risk 필드 렌더링 영역은 남기되 disabled + 안내 문구(간단하게)
- 저장 시 risk는 None(프로젝트에서 쓰는 표준: null/undefined/"NONE" 등 확인 후 통일)

검증:

- 신규 생성: 기본값이 “없음”
- 기존 데이터가 있을 때: 표시되지만 편집 불가, “없음” 클릭 시 None으로 변경 및 저장

커밋:

- feat(snapshot): default risk to none and disable risk editing

---

## 4) Collaborators relation 체크박스 + 아이콘화(pair/pre/post) + tooltip [Commit 4]

요구사항:

- collaborators는 relation 부분을 체크박스로 표현
- pair, pre, post 텍스트 대신 아이콘 표시
- 아이콘 hover 시 tooltip으로 설명(예: pair=페어, pre=사전 협업, post=사후 협업)
- 기존 입력/저장 포맷은 유지(예: collaborators: [{name, relation}] 같은 구조가 이미 있다면 그대로)

구현 지침:

- 기존 relation 선택 UI가 select라면: 체크박스 그룹으로 교체(단, 실제 저장은 단일/복수인지 기존 스키마 확인 후 맞춤)
- 아이콘은 프로젝트에서 이미 쓰는 아이콘 세트가 있으면 재사용. 없으면 간단한 SVG/문자 아이콘으로 구현.
- tooltip은 기존 Tooltip 컴포넌트가 있으면 재사용. 없으면 title 속성으로 최소 구현(가능하면 커스텀 tooltip).

검증:

- 체크/해제 -> 저장 -> 재진입 시 유지
- hover 시 설명이 보이는지(키보드 포커스도 고려)

커밋:

- feat(snapshot): revamp collaborator relations with icons, checkboxes, tooltips

---

## 5) Past Week에 This Week 덮어쓰기 기능 [Commit 5]

요구사항:

- pastWeek 영역에 “thisWeek 데이터로 덮어쓰기” 버튼 추가
- 클릭 시 pastWeek = thisWeek의 현재 값(필드 단위 복사)
- 덮어쓰기는 편집 폼 상태에 즉시 반영되며, 저장 전까지는 되돌릴 수 있어야 함(최소: undo 버튼 or 폼 기본 undo 흐름 활용)
  - 기존에 “dirty state / cancel”이 있으면 그 동작을 따른다.

구현 지침:

- 복사 대상 필드: thisWeek의 tasks/risks/… 등 스키마를 보고 “동일 구조 필드”만 복사
- 참조 공유 금지(깊은 복사)
- UX: 버튼 클릭 시 간단한 toast/inline 메시지

검증:

- 클릭 후 pastWeek가 즉시 바뀌는지
- 저장하면 DB에 반영되는지
- 저장 안 하고 나가면 기존 규칙대로(취소/경고) 동작하는지

커밋:

- feat(snapshot): add overwrite pastWeek from thisWeek action

---

## 6) 편집 페이지 레이아웃: 미리보기 체크 시 3열, 해제 시 2열 [Commit 6]

요구사항:

- 편집 페이지 우측 상단의 기존 “2,3열 표시 전환” 대신
- “체크 미리보기” 토글(checkbox) 제공
  - 체크됨: 3열 레이아웃(미리보기 포함)
  - 체크 해제: 2열 레이아웃(미리보기 숨김 혹은 축소)

구현 지침:

- 기존 레이아웃 토글 상태/URL query/localStorage 저장이 있으면 재사용
- 반응형 깨지지 않게(기존 grid/flex 시스템 유지)

검증:

- 토글 시 즉시 레이아웃 변경
- 새로고침 시 상태 유지(기존 정책에 맞춤)

커밋:

- feat(snapshot): replace column toggle with preview checkbox (2col/3col)

---

## 7) 편집폼 포커스와 미리보기 포커싱 연동 [Commit 7]

요구사항:

- 편집폼에서 특정 입력 필드에 포커스하면,
- 미리보기 영역에서 “현재 입력 중인 섹션”이 하이라이트/스크롤/포커싱되게 처리

구현 지침(최소 변경 우선):

- 필드별로 preview anchor id를 매핑한다
  - 예: pastWeek.tasks -> #preview-pastweek-tasks
- onFocus 이벤트에서 preview 영역으로 scrollIntoView({block:"center"}) + highlight class를 잠깐 적용(타이머로 제거)
- 접근성: 스크롤 이동이 과도하지 않도록, 이미 화면에 보이면 스킵

검증:

- 주요 입력 필드 몇 개에서 정상 작동(Tasks, Collaborators, Past/This week 등)
- 빠르게 포커스 이동해도 튐/버그 없는지

커밋:

- feat(snapshot): sync form focus to preview highlight/scroll

---

## 8) 종합 검증 + 정리 [Commit 8]

요구사항:

- 전체 기능을 한번에 점검하고, 리그레션(기존 기능 깨짐) 확인
- 빌드 검증 + 테스트(있다면) 통과
- 변경 요약(MD) 작성은 선택이 아니라 필수: 루트에 `snapshot-management-improvements.md`
  - 포함 내용: 변경사항 목록, 사용법(UX), 기술적 메모(주의할 점), 추후 개선 TODO

실행:

- lint / typecheck / test / build 순으로 가능한 범위 실행
  - 예: pnpm lint, pnpm typecheck, pnpm test, pnpm build (프로젝트 스크립트에 맞춰 조정)

커밋:

- chore(snapshot): verify build and add improvement notes

---

## 빌드/테스트 커맨드(프로젝트에 맞춰 자동으로 탐지해서 선택)

너는 package.json을 확인해서 아래 중 실제 존재하는 명령만 실행해.
우선순위:

1. lint
2. typecheck
3. test
4. build

---

## 최종 보고 형식

각 커밋 단계 완료 시 아래를 반드시 남겨:

- 변경 파일 목록
- 핵심 구현 포인트(3~6줄)
- 실행한 검증 커맨드와 결과
- 남아있는 리스크/엣지 케이스

---

## 주의

- 외부 라이브러리 추가 금지(이미 있는 것만 사용)
- 데이터 스키마 변경(마이그레이션) 금지. 필요하면 UI 레벨에서 호환 처리로 해결.
- “없음(None)” 표준 값은 코드베이스에서 이미 쓰는 패턴을 찾아서 통일.
