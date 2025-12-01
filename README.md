# Weekly Scrum Dashboard

팀원이 매주 제출하는 위클리 스크럼 텍스트를 자동으로 파싱하여 JSON으로 변환하고, Next.js + Tailwind 기반의 대시보드에서 시각화하는 시스템입니다.

---

## 시스템 개요

1. `submitted.txt` 파일에 팀원들의 주간 스크럼 내용을 작성
2. 변환 스크립트를 실행하여 JSON 파일 생성
3. Next.js 대시보드에서 JSON 데이터를 시각화

---

## submitted.txt 포맷 설명

각 스크럼 항목은 다음 형식으로 작성합니다:

```
[도메인 / 프로젝트 / 토픽]
- name: 담당자 이름
- Progress: 진행 상황 (XX% 형식 권장)
- Risk: 리스크 사항
- Next: 다음 주 계획
```

### 예시

```
[FE / 스프레드시트 / 팀프로젝트 기반 개발]
- name: 김현
- Progress: 셀 렌더링 구조 개선 60% 완료
- Risk: Publish 단계에서 race condition 재발 가능성
- Next: 렌더링 최적화 마무리, Publish flow 테스트 2건 추가

[BE / 인증서비스 / OAuth 연동]
- name: 이준호
- Progress: Google OAuth 연동 80% 완료
- Risk: 토큰 갱신 로직에서 edge case 미처리
- Next: Apple OAuth 연동 시작
```

- 블록 간에는 빈 줄로 구분합니다.
- Progress 필드에 `XX%` 형식이 포함되면 자동으로 `progressPercent`로 추출됩니다.

### 도메인 목록

도메인은 팀원들이 자유롭게 작성하며, 점진적으로 통일해 나갑니다.

| 도메인     | 설명                   |
| ---------- | ---------------------- |
| `planning` | 기획                   |
| `frontend` | 프론트엔드 (FE도 가능) |
| `backend`  | 백엔드 (BE도 가능)     |
| `design`   | 디자인                 |
| `analysis` | 분석                   |
| `writing`  | 문서화                 |
| `QA`       | 품질 검증              |
| `devops`   | DevOps / 인프라        |
| _(기타)_   | 자유롭게 추가 가능     |

- 등록된 도메인은 지정된 색상으로 표시됩니다.
- 미등록 도메인은 해시 기반으로 자동 색상이 할당됩니다.
- 도메인 색상 설정: `src/components/weekly-scrum/ScrumCard.tsx`의 `DOMAIN_COLORS` 참조

### 프로젝트 / 토픽

프로젝트와 토픽은 자유롭게 작성합니다. 별도의 등록 없이 바로 사용 가능합니다.

- **프로젝트**: 작업이 속한 제품/서비스 단위 (예: 스프레드시트, 워크스페이스, 인증서비스)
- **토픽**: 해당 주에 진행 중인 구체적인 작업 (예: 셀 렌더링 최적화, OAuth 연동, IA 개선)

프로젝트별 필터링이 UI에서 지원되므로, 프로젝트명은 일관되게 작성하는 것을 권장합니다.

---

## 변환 스크립트 사용법

### 설치

```bash
yarn install
```

### 실행

```bash
yarn scrum:parse -- <year> <month> <week> "<range>"
```

### 예시

```bash
yarn scrum:parse -- 2025 01 W01 "2025-01-06 ~ 2025-01-12"
```

### 입력/출력

- **입력**: `data/submitted.txt`
- **출력**: `data/scrum/{year}/{month}/{year}-{month}-{week}.json`
  - 예: `data/scrum/2025/01/2025-01-W01.json`

---

## JSON 구조 설명

```json
{
  "year": 2025,
  "month": 1,
  "week": "W01",
  "range": "2025-01-06 ~ 2025-01-12",
  "items": [
    {
      "name": "김현",
      "domain": "FE",
      "project": "스프레드시트",
      "topic": "팀프로젝트 기반 개발",
      "progress": "셀 렌더링 구조 개선 60% 완료",
      "risk": "Publish 단계에서 race condition 재발 가능성",
      "next": "렌더링 최적화 마무리, Publish flow 테스트 2건 추가",
      "progressPercent": 60
    }
  ]
}
```

### 필드 설명

| 필드                      | 타입   | 설명               |
| ------------------------- | ------ | ------------------ |
| `year`                    | number | 연도               |
| `month`                   | number | 월                 |
| `week`                    | string | 주차 (예: W01)     |
| `range`                   | string | 날짜 범위          |
| `items`                   | array  | 스크럼 항목 배열   |
| `items[].name`            | string | 담당자 이름        |
| `items[].domain`          | string | 도메인 (FE, BE 등) |
| `items[].project`         | string | 프로젝트명         |
| `items[].topic`           | string | 작업 토픽          |
| `items[].progress`        | string | 진행 상황          |
| `items[].risk`            | string | 리스크 사항        |
| `items[].next`            | string | 다음 주 계획       |
| `items[].progressPercent` | number | 진행률 (0-100)     |

---

## Next.js UI 설명

### 개발 서버 실행

```bash
yarn dev
```

브라우저에서 `http://localhost:3000/weekly-scrum` 접속

### 주요 기능

- **필터링**: 도메인, 프로젝트별 필터링
- **검색**: 이름, 토픽, 내용 검색
- **통계**: 전체 항목 수, 평균 진행률, 리스크 항목 수 표시
- **반응형**: 모바일 1열, 태블릿 2열, 데스크탑 3열 그리드

### 컴포넌트 구조

```
src/
├── app/
│   ├── layout.tsx          # 루트 레이아웃
│   ├── globals.css         # 전역 스타일
│   ├── page.tsx            # 홈 페이지
│   └── weekly-scrum/
│       └── page.tsx        # 스크럼 대시보드 페이지
├── components/
│   └── weekly-scrum/
│       ├── WeeklyScrumBoard.tsx  # 보드 컴포넌트 (필터, 그리드)
│       └── ScrumCard.tsx         # 카드 컴포넌트
└── types/
    └── scrum.ts            # 타입 정의
```

---

## 프로젝트 구조

```
weekly-scrum/
├── data/
│   ├── submitted.txt       # 입력 파일
│   └── scrum/              # 출력 JSON 저장 디렉토리
│       └── {year}/{month}/{year}-{month}-{week}.json
├── scripts/
│   └── parse-submitted.ts  # 변환 스크립트
├── src/
│   ├── app/                # Next.js App Router
│   ├── components/         # React 컴포넌트
│   └── types/              # TypeScript 타입
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

---

## 추가 작성 예정

<!-- 사용자가 추가 내용을 작성할 영역 -->
