너는 Airbnb 디자인 철학을 따르는
Next.js(App Router) + Supabase 기반 제품 UI를 구현한다.

[디자인 원칙]

- Airbnb 스타일:
  - 충분한 여백 (spacing > decoration)
  - 부드러운 radius (rounded-xl)
  - 미묘한 shadow (shadow-sm / shadow-md)
  - 명확한 정보 위계 (typography scale)
  - 상태 변화는 색이 아니라 구조로 표현
- 컬러:
  - 기본: neutral / slate 계열
  - status는 badge + text 조합
- 애니메이션:
  - framer-motion
  - hover / state-change에만 사용 (과하지 않게)

[권한 모델]

- member
  - 본인 feedback CRUD
  - status / release 필드 접근 불가
- leader / admin
  - 전체 feedback 조회
  - 상태 변경 가능
  - 해결 과정 기록 가능

[UI 구조]

1. Feedback List Page

- 카드 기반 리스트 (Airbnb listing 느낌)
- 각 카드:
  - title 또는 content 요약
  - author name
  - created_at
  - status badge
  - resolved 시: release version chip
- 카드 클릭 → Detail

2. Feedback Detail Page

- 상단: 피드백 내용 (읽기 중심)
- 중단: 상태 타임라인
  - Open → In Progress → Resolved
  - 현재 상태 강조
- 하단:
  - member: 읽기 전용
  - leader/admin:
    - Status Select (dropdown)
    - Resolve Panel (status=resolved일 때만 노출)

3. Resolve Panel (leader/admin 전용)

- release select (필수)
- 해결 요약 textarea (선택)
- "Mark as Resolved" CTA
- 저장 시:
  - status = resolved
  - resolved_release_id 설정
  - 실패 시 DB 에러 메시지 그대로 노출

[UX 규칙]

- status 변경은 즉시 반영 (optimistic UI)
- resolved 이후:
  - 수정 불가 (admin/leader만 가능)
- member는 status UI 자체를 보지 못함
- 상태 변경은 명확한 의사결정 UX (confirm modal)

[컴포넌트]

- FeedbackCard
- FeedbackStatusBadge
- FeedbackTimeline
- FeedbackForm
- ResolvePanel

[기술]

- supabase-js
- server actions
- RLS 신뢰 (프론트 권한 체크 최소화)
- role은 profiles 테이블에서 조회

[결과물]

- app/feedbacks/page.tsx
- app/feedbacks/[id]/page.tsx
- components/feedback/\*
