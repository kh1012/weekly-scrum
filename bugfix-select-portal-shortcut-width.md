# Bugfix: Select Portal + Shortcut OS + Editor Width

## 변경 요약

이 PR은 Snapshot Manage 페이지(Create/Edit)의 UI 버그를 수정합니다.

## 변경 사항

### 1. 모든 Select/Dropdown - Portal + 검색 기능 + 초기 위치 수정

**파일**: `src/components/weekly-scrum/manage/SnapshotEditForm.tsx`

- **초기 위치 문제 수정**: 드롭다운이 처음 열릴 때 `useEffect` 대신 클릭 핸들러에서 즉시 위치 계산
- MetaField 컴포넌트 (Domain, Project, Module, Feature)의 드롭다운 위치 계산 로직 개선
- 협업자 선택 드롭다운을 `createPortal`을 통해 `document.body`에 렌더링
- 드롭다운이 부모 컨테이너의 overflow에 영향받지 않도록 수정
- 협업자 목록 검색 기능 추가 (case-insensitive)
- "여러 명 추가" 드롭다운에도 동일하게 Portal + 검색 기능 적용
- 스크롤/리사이즈 시 드롭다운 위치 자동 재계산

### 2. OS 기반 단축키 힌트 표시

**파일**: 
- `src/lib/ui/getOS.ts` (신규)
- `src/components/weekly-scrum/manage/ShortcutHint.tsx` (신규)

**변경 내용**:
- OS 감지 유틸리티 함수 `getOS()` 구현
  - `navigator.userAgentData.platform` 우선 사용
  - Fallback: `navigator.platform`, `navigator.userAgent`
- `ShortcutHint` 컴포넌트 생성
  - Mac: `⌥ + ⌘ + ↓`
  - Windows: `Ctrl + Alt + ↓`
- 기존 하드코딩된 단축키 힌트를 `ShortcutHint` 컴포넌트로 교체
  - TaskEditor (Past Week)
  - ThisWeekTaskEditor
  - RiskEditor

### 3. 편집 영역 기본 너비를 최소(0.25)로 변경

**파일**:
- `src/app/(scrum)/manage/snapshots/[year]/[week]/new/_components/NewSnapshotView.tsx`
- `src/app/(scrum)/manage/snapshots/[year]/[week]/edit/_components/EditSnapshotsView.tsx`
- `src/app/(scrum)/admin/snapshots/[snapshotId]/edit/_components/AdminSnapshotEditView.tsx`

**변경 내용**:
- `editPanelRatio` 초기값: `0.5` → `0.25`
- 편집 영역이 최소 너비로 시작하여 미리보기 영역이 더 넓게 표시됨
- 사용자가 리사이즈 핸들로 조절 가능 (기존 동작 유지)

## 테스트 방법

### Create 페이지 테스트
1. `/manage/snapshots/{year}/{week}/new` 페이지 접속
2. "새로 작성하기" 선택 후 편집 화면 진입
3. 확인 사항:
   - [ ] 편집 영역이 좁게(25%) 시작하는지 확인
   - [ ] Collaborators 선택 드롭다운 클릭 시 정상 위치에 표시
   - [ ] Collaborators 검색 기능 동작
   - [ ] "여러 명" 버튼 클릭 시 드롭다운 정상 위치 + 검색 기능
   - [ ] 단축키 힌트가 OS에 맞게 표시 (Mac: ⌥+⌘+↓, Windows: Ctrl+Alt+↓)

### Edit 페이지 테스트
1. `/manage/snapshots/{year}/{week}/edit` 페이지 접속
2. 동일 항목 확인

### Admin 페이지 테스트
1. `/admin/snapshots/{snapshotId}/edit` 페이지 접속
2. 동일 항목 확인

## 영향받는 컴포넌트

- `SnapshotEditForm` - Collaborators 드롭다운 Portal/검색
- `TaskEditor` - 단축키 힌트
- `ThisWeekTaskEditor` - 단축키 힌트
- `RiskEditor` - 단축키 힌트
- `NewSnapshotView` - 편집 영역 초기 너비
- `EditSnapshotsView` - 편집 영역 초기 너비
- `AdminSnapshotEditView` - 편집 영역 초기 너비

## 회귀 테스트 체크리스트

- [ ] 콘솔 에러 없음
- [ ] Hydration mismatch 없음 (단축키 힌트는 클라이언트에서만 OS 감지)
- [ ] 키보드 단축키(⌥+⌘+↓ 또는 Ctrl+Alt+↓) 정상 동작
- [ ] 스크롤 후에도 드롭다운 위치 정확

