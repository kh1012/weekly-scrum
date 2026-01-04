# 기존 코드 마이그레이션 가이드

이 문서는 기존 프로젝트에서 새로운 Demo/Prod 모드 시스템을 활용하도록 코드를 마이그레이션하는 방법을 설명합니다.

## 📋 주요 변경사항

1. **인증 방식 변경**: Magic Link → Email + Password
2. **워크스페이스 관리**: 새로운 워크스페이스 선택 흐름
3. **모드 구분**: Demo 모드와 Production 모드 분리

---

## 1. 기존 데이터 페칭 코드 수정

### Before (기존 코드)

```typescript
// 하드코딩된 workspace_id 사용
const { data } = await supabase
  .from("snapshots")
  .select("*")
  .eq("workspace_id", "some-hardcoded-id");
```

### After (새로운 코드)

```typescript
import { useActiveWorkspace } from "@/hooks/useActiveWorkspace";

function MyComponent() {
  const { workspaceId } = useActiveWorkspace();

  useEffect(() => {
    if (!workspaceId) return;

    // workspaceId를 동적으로 사용
    const fetchData = async () => {
      const { data } = await supabase
        .from("snapshots")
        .select("*")
        .eq("workspace_id", workspaceId);
    };

    fetchData();
  }, [workspaceId]);
}
```

---

## 2. 서버 컴포넌트에서 워크스페이스 ID 사용

### Server Component 예시

```typescript
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspaceId } from "@/lib/supabase/mode";

export default async function MyServerComponent() {
  const workspaceId = getActiveWorkspaceId();

  if (!workspaceId) {
    return <div>워크스페이스를 선택해주세요.</div>;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("snapshots")
    .select("*")
    .eq("workspace_id", workspaceId);

  return <div>{/* 데이터 렌더링 */}</div>;
}
```

---

## 3. 인증 상태 확인

### Before (기존 코드)

```typescript
const supabase = createClient();
const {
  data: { user },
} = await supabase.auth.getUser();
```

### After (새로운 헬퍼 사용)

```typescript
// 클라이언트 컴포넌트
import { getCurrentUserClient } from "@/lib/auth/auth-helpers";
const user = await getCurrentUserClient();

// 서버 컴포넌트
import { getCurrentUser } from "@/lib/auth/server-auth-helpers";
const user = await getCurrentUser();
```

---

## 4. 로그인/로그아웃 구현

### Magic Link 로그인 (Production)

```typescript
import { signInWithMagicLink } from "@/lib/auth/auth-helpers";

const handleLogin = async () => {
  const result = await signInWithMagicLink(email, "/");

  if (result.success) {
    setMessage({
      type: "success",
      text: result.message, // "이메일을 확인해주세요..."
    });
  } else {
    console.error(result.error);
  }
};
```

### 로그아웃

```typescript
import { signOut } from "@/lib/auth/auth-helpers";
import { clearActiveWorkspaceId } from "@/lib/supabase/mode";

const handleLogout = async () => {
  await signOut();
  clearActiveWorkspaceId(); // 워크스페이스 선택 해제
  router.push("/login");
};
```

---

## 5. 조건부 렌더링 (Demo vs Prod)

```typescript
import { isDemoMode } from "@/lib/supabase/mode";

function MyComponent() {
  const isDemo = isDemoMode();

  return (
    <div>
      {isDemo ? <div>데모 모드 전용 UI</div> : <div>프로덕션 모드 UI</div>}
    </div>
  );
}
```

---

## 6. 레이아웃에서 워크스페이스 체크

### App Layout 예시

```typescript
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useActiveWorkspace } from "@/hooks/useActiveWorkspace";
import { getCurrentUserClient } from "@/lib/auth/auth-helpers";

export default function AppLayout({ children }) {
  const router = useRouter();
  const { workspaceId, isDemo } = useActiveWorkspace();

  useEffect(() => {
    const checkAuth = async () => {
      // Demo 모드는 체크 건너뛰기
      if (isDemo) return;

      const user = await getCurrentUserClient();

      // 로그인 안 됨
      if (!user) {
        router.push("/login");
        return;
      }

      // 워크스페이스 미선택
      if (!workspaceId) {
        router.push("/select-workspace");
        return;
      }
    };

    checkAuth();
  }, [workspaceId, isDemo, router]);

  return <>{children}</>;
}
```

---

## 7. API Route에서 워크스페이스 ID 가져오기

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // 쿠키에서 workspace_id 가져오기 (클라이언트에서 설정)
  const cookieStore = await cookies();
  const workspaceId = cookieStore.get("selected_workspace_id")?.value;

  if (!workspaceId) {
    return NextResponse.json(
      { error: "워크스페이스가 선택되지 않았습니다." },
      { status: 400 }
    );
  }

  const { data } = await supabase
    .from("snapshots")
    .select("*")
    .eq("workspace_id", workspaceId);

  return NextResponse.json(data);
}
```

---

## 8. 기존 Context 마이그레이션

### Before (기존 Context)

```typescript
const ScrumContext = createContext({
  workspaceId: "hardcoded-id",
});
```

### After (새로운 Context)

```typescript
import { useActiveWorkspace } from "@/hooks/useActiveWorkspace";

const ScrumContext = createContext({
  workspaceId: null as string | null,
});

export function ScrumProvider({ children }) {
  const { workspaceId } = useActiveWorkspace();

  return (
    <ScrumContext.Provider value={{ workspaceId }}>
      {children}
    </ScrumContext.Provider>
  );
}
```

---

## 9. 테스트 시나리오

### Demo 모드 테스트

1. `.env.demo` 파일 설정
2. `yarn dev:demo` 실행
3. `/login` 접속 → "게스트로 계속하기" 버튼 확인
4. 클릭 후 메인 페이지로 이동 확인
5. Demo 데이터 표시 확인

### Production 모드 테스트

1. `.env.local` 파일 설정
2. `yarn dev` 실행
3. `/login` 접속 → 이메일/비밀번호 폼 확인
4. 회원가입 → 워크스페이스 선택 페이지 이동 확인
5. 워크스페이스 선택 → 메인 페이지 이동 확인
6. 로그아웃 → 다시 로그인 페이지로 이동 확인

---

## 10. 주의사항

### ⚠️ localStorage vs Cookie

- **localStorage**: 클라이언트 전용 (브라우저)
- **Cookie**: 서버/클라이언트 모두 접근 가능

현재 구현은 localStorage를 사용하므로, 서버 컴포넌트에서는 `getActiveWorkspaceId()`가 `null`을 반환합니다.

**해결책**: 필요한 경우 쿠키로 전환하거나, 클라이언트 컴포넌트에서 워크스페이스 ID를 전달하세요.

### 🔒 RLS 정책 확인

모든 테이블에 workspace_id 기반 RLS 정책이 적용되어 있는지 확인하세요:

```sql
-- 예시: snapshots 테이블
CREATE POLICY "Users can view snapshots in their workspace"
ON snapshots
FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id
    FROM workspace_members
    WHERE user_id = auth.uid()
  )
);
```

---

## 체크리스트

- [ ] `.env.local` 파일 생성 완료
- [ ] `.env.demo` 파일 생성 완료
- [ ] Demo 워크스페이스 생성 완료
- [ ] RLS 정책 업데이트 완료
- [ ] 모든 데이터 페칭 코드에 `workspaceId` 적용
- [ ] 로그인/로그아웃 로직 테스트 완료
- [ ] Demo 모드 테스트 완료
- [ ] Production 모드 테스트 완료
- [ ] 빌드 테스트 완료
