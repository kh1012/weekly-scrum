# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.7.2] - 2025-12-23

### Added
- **레인 컨텍스트 메뉴**: 레인 우클릭 시 컨텍스트 메뉴 추가
  - 레인 추가 (아래에): 현재 레인 아래에 새로운 레인 생성
  - 레인 삭제: 현재 레인 제거 (계획이 있으면 Airbnb 스타일 확인 모달 표시)
  - Airbnb 스타일 디자인 적용 (그라데이션 호버, 아이콘 배경, 2줄 레이블)
- **필터 영역 개선**: 프로젝트, 모듈, 기능을 하나의 리스트로 통합하여 표시
  - 검색 기능 추가 (디바운스 300ms 적용)
  - 검색 중 로딩 스피너 표시
  - Cmd+A, Ctrl+A 전체 선택 허용
  - 필터 팝오버 위치를 필터 버튼 바로 아래로 조정

### Fixed
- **레인 추가 로직**: 모든 bars의 preferredLane을 올바르게 설정
  - newLaneIndex 이상의 bars는 1 증가
  - newLaneIndex 미만의 bars는 현재 위치 고정
  - 확장된 레인의 모든 계획 블록이 정확히 함께 이동
- **레인 컨텍스트 메뉴**: 버튼 클릭 이벤트 전파 방지로 정상 동작 보장
- **CreatePlanModal**: 담당자 드롭다운을 Portal로 렌더링하여 모달 overflow 제약 해결
- **작업 종료**: 페이지 강제 새로고침으로 서버 최신 데이터 확실히 불러오기

### Changed
- 레인 추가 시 빈 bar 자동 생성 제거 (불필요한 미지정 블록 생성 방지)
- '레인 추가 (위에)' 옵션 제거 (아래에만 추가 가능)
- 레인 삭제 확인 모달을 Airbnb 스타일 커스텀 모달로 변경 (window.confirm 제거)

### Improved
- **레인 컨텍스트 메뉴 디자인**: Airbnb 스타일 적용
  - 둥근 모서리 (rounded-xl)
  - 아이콘 배경 원형 컨테이너
  - 그라데이션 호버 효과
  - 부드러운 그림자 효과
- **레인 삭제 확인 모달**: 빨간색 그라데이션 헤더, 계획 개수 강조 표시, 부드러운 애니메이션

---

## [2.7.1] - 2025-12-22

### Added
- 도움말 모달에 타임라인 휠 클릭 스크롤링 기능 설명 추가

### Improved
- DraftTreePanel과 DraftTimeline의 세로 스크롤 동기화
  - 좌측 트리 패널과 우측 타임라인이 항상 같은 행을 표시하도록 개선
  - 공통 scrollTop 상태 관리로 스크롤 이벤트 동기화
  - 무한 루프 방지를 위한 현재값 비교 로직 추가

### Changed
- DraftTreePanel의 스크롤바를 숨김 처리
  - 스크롤 기능은 유지하되 UI만 숨김
  - Chrome, Firefox, Edge 등 주요 브라우저 지원
  - `scrollbar-hide` 클래스를 globals.css에 추가

### Technical Details
- `scrollbar-hide` 유틸리티 클래스 추가 (Webkit, Firefox, IE/Edge 지원)
- DraftGanttView에서 scrollTop 상태 관리 및 onScroll 콜백 구현
- useEffect 기반 외부 scrollTop 동기화 로직 추가

---

## [Earlier Versions]

이전 버전의 변경 사항은 추후 추가될 예정입니다.

