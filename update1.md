# Cursor V2 Prompt — Legacy JSON → Supabase Migration (Snapshots / Snapshot Entries)

## 목표

레거시 주간 스냅샷 JSON(예: year/week/weekStart/weekEnd/items[])을 Supabase(Postgres) 테이블로 **실제 마이그레이션**한다.

### 마이그레이션 대상 테이블

- `public.snapshots`
- `public.snapshot_entries`

### 핵심 연결 규칙(이미 적용됨)

- `snapshot_entries.author_display_name` 컬럼이 존재한다.
- `profiles` insert 트리거가 있어 `profiles.display_name == author_display_name`일 때, `author_id`가 자동으로 채워진다.
- 따라서 마이그레이션 단계에서는 `author_id`를 몰라도 되고, **반드시 `author_display_name`을 넣는다.**

---

## 주의사항(필수)

1. 레거시 JSON의 `pastWeek.risk` 키는 Supabase의 `snapshot_entries.risks`(jsonb)와 매칭한다.

   - 레거시 `pastWeek.risk`는 `null | string[]` 형태이므로,
     - null → `[]`
     - string[] → 그대로 `risks`로 저장
   - (기존에 `risk` 컬럼은 사용하지 않는다)

2. 레거시 JSON의 `pastWeek.collaborators[].relation`은 단일 string이지만,
   Supabase에서는 `relations` 키에 **배열**로 저장한다.

   - 예) `{ name: "한내경", relation: "pre" }`
   - → `{ name: "한내경", relations: ["pre"] }`
   - relation이 null/빈값이면 → `relations: []`

3. 마이그레이션은 **idempotent**(재실행 안전)해야 한다.

   - 동일 weekStart/weekEnd/week 값이 이미 있으면 snapshots 중복 생성 금지
   - 동일 snapshot_id + author_display_name + domain/project/module/feature 조합이 이미 있으면 snapshot_entries 중복 생성 금지(또는 upsert)

4. 모든 INSERT/UPSERT는 트랜잭션으로 처리하고, 실패 시 롤백한다.

---

## 레거시 데이터 형식(참고)

- 최상위:
  - year: number
  - week: "W49" (string)
  - weekStart: "YYYY-MM-DD"
  - weekEnd: "YYYY-MM-DD"
  - schemaVersion: number
  - items: Entry[]
- Entry:
  - name, domain, project, module, feature: string
  - pastWeek:
    - tasks: { title: string, progress: number }[]
    - risk: string[] | null
    - riskLevel: number | null
    - collaborators: { name: string, relation: string }[]
  - thisWeek:
    - tasks: string[] (또는 빈 배열)

---

## 해야 할 일(구현 작업)

### 0) 코드 위치/형태

- 이 repo에 이미 Supabase client 설정이 있다면 그걸 사용하고, 없다면 최소한으로 추가한다.
- 실행 방식은 2개 중 하나로 만든다.
  1. Node 스크립트: `scripts/migrate-legacy-snapshots.ts`
  2. Next.js에서 실행 가능한 스크립트(단, 서버 전용 env 사용)

※ 로컬 실행 기준으로 작성하고, `.env.local`의 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`를 사용한다.

- **서비스 롤 키**를 사용해야 RLS에 막히지 않고 마이그레이션 가능(단, 외부 노출 금지)

### 1) 입력 데이터

- 레거시 JSON 파일을 `./data/legacy/W49-2025.json` 같은 형태로 저장하고 읽어온다.
- 파일 경로는 스크립트 인자로 받을 수 있게 해라.
  - 예: `pnpm migrate:legacy -- ./data/legacy/W49-2025.json`

### 2) snapshots upsert

- `public.snapshots`에 다음 정보를 생성/업서트한다.
  - year, week, week_start, week_end, schema_version
- unique 키(가정):
  - `(year, week)` 또는 `(week_start, week_end)` 중 프로젝트에서 쓰는 기준에 맞춰 upsert
- 반환된 snapshot.id를 entries에 연결한다.

### 3) snapshot_entries upsert

레거시 items를 순회하며 `public.snapshot_entries`에 넣는다.

필드 매핑(가정/원칙):

- snapshot_id: snapshots.id
- author_display_name: legacy item.name
- author_id: NULL (트리거가 나중에 채움)
- domain/project/module/feature: legacy 그대로
- past_week: jsonb 로 저장(필요 시)
- this_week: jsonb 로 저장(필요 시)
- tasks:
  - 과거(tasks objects) / 이번주(tasks strings)는 현재 스키마에 맞춰 저장
- risks: jsonb array
  - `risks = pastWeek.risk ?? []`
- risk_level:
  - `riskLevel = pastWeek.riskLevel ?? null`
- collaborators: jsonb array
  - `collaborators = (pastWeek.collaborators ?? []).map(c => ({ name: c.name, relations: c.relation ? [c.relation] : [] }))`

중복 방지 키(권장):

- `(snapshot_id, author_display_name, domain, project, module, feature)` 조합으로 upsert

### 4) 로깅/검증

- 실행 결과로:
  - 생성/업데이트된 snapshots 수
  - 생성/업데이트된 entries 수
  - 누락/형식이상 데이터(예: name 없음, domain 없음 등) 목록을 출력
- dry-run 옵션 추가(선택):
  - `--dry-run`이면 DB write 없이 변환 결과만 콘솔 출력

### 5) 실행 커맨드 추가

- package.json에 실행 스크립트 추가:
  - `"migrate:legacy": "tsx scripts/migrate-legacy-snapshots.ts"` (tsx 사용 가능하면)
  - 또는 ts-node/esm 구성에 맞게

---

## 구현 디테일 요구사항(중요)

- `relations`는 반드시 **배열**로 저장할 것
- `risks`는 반드시 **배열(jsonb)** 로 저장할 것
- null/undefined는 DB에 일관되게:
  - arrays → `[]`
  - scalar nullable → `null`
- 실패 시 중간에 일부만 들어가는 상황이 없도록 트랜잭션 또는 단계적 안전장치(최소 upsert+에러 즉시 종료)

---

## 최종 산출물

1. `scripts/migrate-legacy-snapshots.ts` (실행 가능)
2. `data/legacy/` 샘플 파일(또는 README에 경로 안내)
3. `docs/migration-legacy-snapshots.md`
   - 실행 방법
   - 필드 매핑표
   - 주의사항(risks/relations 변환, author_display_name 트리거 연결)
   - 롤백 전략(필요 시 delete 조건)

---

## 시작 지점

- 이미 있는 DB 스키마/테이블 컬럼명을 우선 확인하고(현재 프로젝트 실제 컬럼 기준),
  위 가정과 다른 부분은 **프로젝트 스키마에 맞춰 조정**해라.
- 조정한 내용은 `docs/migration-legacy-snapshots.md`에 명확히 기록해라.
