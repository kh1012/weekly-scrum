# GitHub Pages 배포 가이드

## 사전 준비

### 1. GitHub 레포지토리 설정

1. GitHub에 레포지토리 생성 (예: `weekly-scrum`)
2. `next.config.ts`에서 `repoName`을 실제 레포지토리 이름으로 변경:

```typescript
const repoName = "weekly-scrum"; // ← 실제 레포지토리 이름
```

3. `package.json`의 `homepage`를 실제 GitHub 사용자명으로 변경:

```json
"homepage": "https://<username>.github.io/weekly-scrum"
```

### 2. GitHub Pages 활성화

1. GitHub 레포지토리 → Settings → Pages
2. Source: `Deploy from a branch`
3. Branch: `gh-pages` / `/ (root)` 선택
4. Save

---

## CLI 배포 방법

### 첫 배포

```bash
# 1. 빌드 및 배포
yarn deploy
```

### 이후 배포

```bash
# 데이터 업데이트 후 배포
yarn scrum:parse    # 스크럼 데이터 파싱 (필요시)
yarn deploy         # GitHub Pages 배포
```

---

## 배포 스크립트 설명

| 스크립트 | 설명 |
|----------|------|
| `yarn build` | Next.js 정적 빌드 (`out/` 폴더 생성) |
| `yarn predeploy` | 빌드 + `.nojekyll` 파일 생성 |
| `yarn deploy` | `gh-pages` 브랜치에 `out/` 폴더 배포 |

---

## 주의사항

### 1. 정적 내보내기 제한

`output: "export"` 설정으로 인해 다음 기능이 제한됩니다:
- 서버 사이드 렌더링 (SSR)
- API 라우트
- 동적 라우트 (미리 생성된 경로만 지원)

### 2. 데이터 파일

스크럼 데이터(`data/scrum/`)는 빌드 시점에 포함됩니다.
새 데이터를 반영하려면 다시 배포해야 합니다.

### 3. 경로 설정

GitHub Pages는 `https://<username>.github.io/<repo-name>/` 형태로 제공되므로,
`basePath`와 `assetPrefix`가 자동 설정됩니다.

---

## 문제 해결

### 404 에러 발생 시

1. `gh-pages` 브랜치가 생성되었는지 확인
2. GitHub Pages 설정에서 올바른 브랜치 선택 확인
3. `.nojekyll` 파일 존재 확인 (없으면 `_next` 폴더 무시됨)

### CSS/JS 로드 실패 시

`next.config.ts`의 `basePath`와 `assetPrefix`가 올바르게 설정되었는지 확인

---

## 배포 URL

배포 완료 후 접속:
```
https://<username>.github.io/weekly-scrum/
```

