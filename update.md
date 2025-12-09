당신은 WorkMap UI와 상태 지속성(persistence) 로직을 개선하는 엔지니어입니다.

## 🎯 목표

1. progress 100%인 항목을 숨기는 기능을 체크박스로 추가한다.
2. 체크박스 텍스트는 기존 UX와 용어 체계에 맞게 자연스럽게 변경한다.
   - 예: “완료 항목 숨기기”, “100% 달성 숨기기” 등
3. 아래 사용자의 필터 상태를 새로고침 후에도 유지되도록 한다.
   - 트리 펼침/접힘 상태
   - 담당자(person) 필터 선택 값
   - ‘100% 숨기기’ 토글 상태
4. LocalStorage에 저장하고, 필요 시 querystring으로 반영할 수 있도록 확장한다.

---

## 🔧 구현 요구사항

### 1. 100% 완료 항목 숨기기 체크박스

- WorkMap 필터 UI에 체크박스 컴포넌트를 추가한다.
- 체크 시:
  - progress === 100 인 task는 렌더링하지 않는다.
  - 트리 구조가 강제로 닫히거나 재정렬되지 않도록 한다.
- 체크 상태는 다음 상황에서도 유지된다:
  - 페이지 새로고침
  - 동일 기능 내 다른 화면 전환

### 2. 필터 상태 저장

LocalStorage에 아래 형태로 저장한다:

{
hideCompleted: boolean,
expandedNodes: string[], // 노드 ID 배열
selectedPerson: string | null
}

동작 규칙:

- 초기 로드 시:
  - LocalStorage 값을 먼저 읽고 즉시 UI에 반영한다.
  - querystring에 값이 있다면 LocalStorage보다 우선 적용한다.
- 필터/트리/토글 변경 시:
  - 변경된 상태를 즉시 LocalStorage에 저장한다.
- 담당자 선택 시:
  - 선택된 값을 저장하고 새로고침 후에도 동일하게 반영한다.

### 3. Querystring 연동 (선택적 확장)

- URL 쿼리 파라미터가 존재하면:
  - 해당 세션 동안 LocalStorage보다 우선 적용한다.
- 쿼리가 없으면:
  - LocalStorage 값만으로 UI 상태를 복원한다.

### 4. 코드 작업 항목 체크리스트

- [ ] 필터 상태 관리 전담 모듈 생성
- [ ] `useHideCompleted`, `useExpandedNodes`, `usePersonFilter` Hook 구현
- [ ] 초기 렌더 시 LocalStorage 값 → UI 반영
- [ ] UI 상태 변경 시 LocalStorage 즉시 sync
- [ ] 렌더링 시 progress 100% 조건 필터링 로직 추가
- [ ] 아래 항목에 대한 테스트 작성:
  - 새로고침 후 상태 복원
  - 트리 인터랙션 복원
  - 담당자 필터 복원
  - 100% 항목 숨기기 행동 정상 동작

---

## 📌 완료 조건(Acceptance Criteria)

- 새로고침해도 트리/필터/토글 상태가 변하지 않는다.
- “100% 완료 숨기기” 체크 즉시 UI에서 완료 항목이 사라진다.
- 체크박스 토글 시, 트리 구조는 유지된다.
- 기존 프로젝트의 네이밍 규칙을 따른다.
- WorkMap 트리 렌더링 성능에 악영향이 없어야 한다.

---

## 📄 산출물 요청

아래 항목을 생성하라:

1. 수정된 UI 컴포넌트 코드
2. Hooks 구현 코드
3. LocalStorage 핸들러 코드
4. Querystring 싱크 로직
5. 최소한의 테스트 코드
6. 필요 시 파일 구조 개선 제안

각 단계별 완료 후 build 테스트 및 커밋
