# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

