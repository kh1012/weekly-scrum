You are working on a Next.js (App Router) + Supabase project.

SCOPE: CORE PHASE-1 ONLY (do not implement meta domain/project/module CRUD, per-user permission system, or entries search/filters).
DB migration has been applied with:

- enum value rename: workspace_role 'leader' -> 'manager' (no DROP)
- functions:
  - is_workspace_admin_or_leader(workspace_id) => admin|manager
  - is_workspace_admin(workspace_id) => admin only
- additive admin policies:
  - snapshots_admin_manage
  - entries_admin_manage
- gantt_flags.links jsonb (default [])
- views:
  - v_flag_plan_summary
  - v_resource_distribution
  - v_collab_edges

GOALS (must implement all):

1. Replace all role references from "leader" to "manager"

   - Typescript union types, zod schemas (if any), constants/maps, UI labels, permission checks.
   - Remove any runtime comparisons to "leader".
   - Defensive fallback (recommended): if role from DB is "leader" due to stale cache, map to "manager" at parse boundary.

2. Admin-only "All Snapshots Management" page

   - Route: /admin/snapshots (or your admin namespace)
   - Enforce admin-only access:
     - UI guard (hide nav & block route)
     - AND server-side/data-call guard (never rely only on UI)
   - List across current workspace:
     - week/date identifier
     - author name (join profiles)
     - entry count
     - updated_at
   - Admin-only action: delete snapshot with confirm modal.
   - Error states: show toast or inline message.

3. CustomFlag (gantt_flags) multi-links support

   - links: Array<{ url: string; label?: string }>
   - Edit UI:
     - add/remove rows
     - validate url starts with http:// or https://
     - persist to Supabase
   - Display UI:
     - render compact inline links (chips or list)

4. Insights (read-only) using DB views
   - Place: admin dashboard section or /admin/insights
   - Show dense GitHub-like tables:
     A) v_flag_plan_summary: flag_title, date range, days, plan_count
     B) v_resource_distribution: display_name, assigned_plan_count
     C) v_collab_edges: from_user, to_user, collaboration_count (table only, no graph yet)
   - Ensure workspace scoping and proper loading/empty states.

CRITICAL CONSTRAINTS:

- Use incremental commits (DO NOT do one giant commit).
- BEFORE EACH COMMIT: perform at least 3 code-level verifications:
  1. ripgrep checks:
     - rg -n "leader" (must trend to zero in runtime code)
     - rg -n "is_workspace_admin_or_leader" usage (ensure semantics still correct)
     - rg -n "gantt_flags" and "links" usage (ensure types updated)
  2. Typecheck/build: run the project standard command (pnpm typecheck or pnpm build).
  3. Smoke check: manual navigation of changed routes/components and ensure no runtime crash.

RECOMMENDED COMMIT PLAN:

- Commit 1: Role rename sweep (types/constants/permission checks) + remove all "leader" runtime usage
- Commit 2: Admin snapshots page scaffold + admin guard (UI + data-layer)
- Commit 3: Admin snapshots list query + UI table + loading/empty
- Commit 4: Snapshot delete flow (confirm modal + mutation + error handling)
- Commit 5: gantt_flags.links types + editor UI + display UI
- Commit 6: Insights page/section with 3 tables from the views

DELIVERABLE:
After finishing, output:

- List of changed files grouped by commit.
- Manual verification checklist:
  - login as member: cannot access /admin/snapshots or insights
  - login as manager: cannot access admin-only areas
  - login as admin: can manage snapshots, edit flags links, and see insights
- Confirm "leader" string no longer exists in runtime code.
