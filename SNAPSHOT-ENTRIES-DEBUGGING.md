# Snapshot Entries 데이터 구조 디버깅 가이드

## 문제 상황

- **Team-feed**: 스냅샷 엔트리가 "데이터 없음"으로 표시됨
- **Snapshots**: 일부 데이터는 표시되지만 런타임 에러 발생 (`task.match is not a function`)

## 예상 원인

### 1. 필드명 불일치

✅ **확인 완료**: 실제 DB 컬럼명이 `past_week`로 확인됨 (코드와 일치)

| 코드 (team-feed.ts) | 실제 DB 컬럼명 (확인됨) |
| ------------------- | ----------------------- |
| `past_week`         | `past_week` ✅          |
| `this_week`         | `this_week` ✅          |

필드명은 문제가 아닙니다. **데이터 타입**을 확인해야 합니다.

### 2. 데이터 타입 불일치

#### 기대하는 구조 (코드 기준)

```typescript
{
  pastWeek: {
    tasks: [
      { title: string }  // 객체 배열
    ]
  },
  thisWeek: {
    tasks: [
      { title: string }  // 객체 배열
    ]
  },
  risks: [
    { note: string, level?: string, title?: string }  // 객체 배열
  ]
}
```

#### 실제 DB 구조 (확인 필요)

**패턴 A: 문자열 배열** (추정 - 프로덕션?)

```json
{
  "past_week": {
    "tasks": ["문자열 작업 1", "문자열 작업 2"]
  },
  "this_week": {
    "tasks": ["문자열 작업 1", "문자열 작업 2"]
  },
  "risks": ["위험 사항 1", "위험 사항 2"]
}
```

**패턴 B: 객체 배열** (추정 - 데모?)

```json
{
  "past_week": {
    "tasks": [{ "title": "작업 1", "note": "상세 내용" }, { "title": "작업 2" }]
  },
  "this_week": {
    "tasks": [{ "title": "작업 1" }]
  },
  "risks": [
    { "note": "위험 사항 1", "level": "high" },
    { "title": "위험 사항 2" }
  ]
}
```

**확인 방법:** `debug-snapshot-entries-simple.sql` 실행 (이미 수정됨)

## 디버깅 SQL 파일

### 1. `debug-snapshot-entries-simple.sql` (빠른 확인)

가장 중요한 정보만 빠르게 확인:

- 기본 통계
- 데이터 타입 (string vs object)
- 타입 혼재 여부
- Team-feed용 최근 데이터

**실행 방법:**

```sql
-- 프로덕션 DB에서 실행
psql -h prod-db -U user -d database -f debug-snapshot-entries-simple.sql > prod-result.txt

-- 데모 DB에서 실행
psql -h demo-db -U user -d database -f debug-snapshot-entries-simple.sql > demo-result.txt
```

### 2. `debug-snapshot-entries.sql` (상세 분석)

모든 측면을 상세히 분석:

- Workspace별 통계
- 각 JSONB 필드의 타입 확인
- NULL 값 통계
- 완전한 샘플 데이터
- 11가지 검증 쿼리

### 3. `debug-field-names.sql` (필드명 확인)

테이블 스키마와 실제 컬럼명 확인

## 코드에서 데이터를 기대하는 위치

### Team-feed (`src/lib/data/teamFeed.ts`)

```typescript
// 89-90줄: Supabase 쿼리에서 필드명 지정
past_week,
this_week,

// 196-197줄: 데이터 매핑
pastWeek: entry.past_week || { tasks: [] },
thisWeek: entry.this_week || { tasks: [] },

// 333줄: tasks를 객체 배열로 가정
next = entry.pastWeek.tasks[0].title;  // ← tasks[0]이 객체여야 함!
```

### Snapshot Cards (`src/components/weekly-scrum/cards/ScrumCard.tsx`)

```typescript
// 522줄: tasks를 (string | any)[] 타입으로 수정됨
tasks: (string | any)[];

// 467-470줄: 방어 코드 추가됨
const taskStr = typeof task === 'string'
  ? task
  : (task?.title || task?.note || JSON.stringify(task));
```

## 해결 방법

### 옵션 1: 데이터 타입 확인 및 통일 (권장)

✅ 필드명은 이미 일치함 (`past_week`, `this_week`)

이제 **데이터 타입**을 확인하고 통일해야 합니다:

- 프로덕션: 문자열 배열 사용?
- 데모: 객체 배열 사용?

**다음 단계**: `debug-snapshot-entries-simple.sql`을 실행하여 확인

### 옵션 2: 데이터 형식 통일

모든 환경에서 동일한 데이터 형식 사용:

**문자열 배열 사용 (현재 프로덕션?)**

```json
{
  "tasks": ["작업 1", "작업 2"]
}
```

**객체 배열 사용 (코드 기대값)**

```json
{
  "tasks": [{ "title": "작업 1" }, { "title": "작업 2" }]
}
```

### 옵션 3: 양쪽 지원 (현재 적용됨)

코드에서 두 가지 형식을 모두 지원하도록 방어 코드 추가 (이미 `ScrumCard.tsx`에 적용됨)

## 다음 단계

1. ✅ **필드명 확인 완료**: `past_week`, `this_week` (코드와 일치)
2. ⏳ **SQL 실행**: `debug-snapshot-entries-simple.sql`을 프로덕션과 데모 DB에서 실행
3. ⏳ **데이터 타입 확인**: 문자열 배열 vs 객체 배열
4. ⏳ **결과 비교**: 두 환경의 데이터 구조 차이 확인
5. ⏳ **수정 결정**: 데이터 타입 통일 또는 코드 수정
6. ⏳ **테스트**: 수정 후 Team-feed가 정상 작동하는지 확인

## 체크리스트

- [x] 필드명 확인 완료 → `past_week`, `this_week` (코드와 일치 ✅)
- [x] SQL 파일 수정 완료 (`last_week` → `past_week`)
- [ ] `debug-snapshot-entries-simple.sql` 프로덕션 실행
- [ ] `debug-snapshot-entries-simple.sql` 데모 실행
- [ ] 데이터 타입 확인 (string vs object)
- [ ] 타입 혼재 여부 확인
- [ ] 두 환경 비교 및 차이점 파악
- [ ] 수정 방법 결정
- [ ] 코드 수정 또는 데이터 마이그레이션
- [ ] Team-feed 테스트
- [ ] Snapshots 페이지 테스트
