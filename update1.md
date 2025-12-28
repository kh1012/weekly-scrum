You are working on a Next.js (App Router) + Supabase project.

DB STATUS (already applied):

- A new table exists: public.menu_events
- RLS enabled
- Views exist:
  - public.v_menu_usage_weekly
  - public.v_page_usage_weekly
  - public.v_user_menu_usage_weekly
- DO NOT change DB schema or SQL in this task.

GOAL:
Implement menu/page usage logging and an admin dashboard to support decisions:
"upgrade / keep / deprecate" for SNB menus based on real usage.

IMPORTANT DESIGN DECISIONS:

- Logging must be reliable and not spammy:

  - Dedupe identical page_path events within a short window (e.g. 5–10 seconds)
  - Only log after route change is complete
  - Make it resilient to failures (do not break UX)

- Prefer server-side insertion with service role key (recommended) to avoid exposing insert abuse:
  - Create an API route: /api/telemetry/menu-events
  - Server uses SUPABASE_SERVICE_ROLE_KEY to insert into public.menu_events
  - Client calls the API with minimal payload
  - Server enriches: user_id, user_agent, referrer, device, session_id if needed

SNB MENU MAPPING (use this mapping in code):
community:

- feedbacks -> menu_group="community", menu_key="feedbacks"
  works:
- entries -> menu_group="works", menu_key="entries"
- plans -> menu_group="works", menu_key="plans"
- snapshots -> menu_group="works", menu_key="snapshots"
- work map -> menu_group="works", menu_key="work-map"
  personal space:
- dashboard -> menu_group="personal", menu_key="dashboard"
- snapshots management -> menu_group="personal", menu_key="snapshots-management"
  admin space:
- dashboard -> menu_group="admin", menu_key="dashboard"
- weekly log -> menu_group="admin", menu_key="weekly-log"
- plans management -> menu_group="admin", menu_key="plans-management"
- meta options -> menu_group="admin", menu_key="meta-options"
  etc:
- release notes -> menu_group="etc", menu_key="release-notes"

Implementation: derive menu_group/menu_key from the current pathname.
If a path does not match, set menu_group/menu_key to null and still log PAGE_VIEW.

EVENTS TO LOG:

1. PAGE_VIEW
   - on route change to a new pathname
2. MENU_CLICK
   - when a user clicks SNB item (before navigation or after, but dedupe)

FIELDS TO WRITE (minimum):

- workspace_id (required)
- user_id (server-side if possible)
- event_type
- menu_group, menu_key
- page_path
- referrer (optional)
- device (optional)
- session_id (optional)
- occurred_at (let DB default unless you need explicit)

WORKSPACE SCOPE:

- Use the currently selected/active workspace_id from your app state.
- If workspace_id is not known, do not log.

ADMIN DASHBOARD:

- Create /admin/menu-usage (or /admin/analytics)
- Admin-only access
- Render GitHub-like dense tables:
  A) Weekly menu usage (from v_menu_usage_weekly)

  - week_start_seoul
  - menu_group / menu_key
  - event_type
  - event_count
  - unique_users
  - Default: last 8 weeks, ordered desc
    B) Weekly page usage (from v_page_usage_weekly)
  - week_start_seoul
  - page_path
  - event_count
  - unique_users
    C) “Who uses what” (from v_user_menu_usage_weekly)
  - week_start_seoul
  - user (name if available, else uuid)
  - menu_key
  - event_count

- Add simple controls:
  - week range (last 4/8/12 weeks)
  - filter by menu_group
  - event_type filter (PAGE_VIEW / MENU_CLICK)

ENGINEERING CONSTRAINTS:

- Incremental commits.
- Before each commit, run:
  1. typecheck/build
  2. manual smoke: route changes log events, admin dashboard loads
  3. verify no sensitive keys leaked to client (service role must be server-only)

RECOMMENDED COMMIT PLAN:
Commit 1) API route /api/telemetry/menu-events using service role
Commit 2) Client logger (route change) + dedupe + session_id
Commit 3) SNB click logging
Commit 4) Admin page /admin/menu-usage reading 3 views + tables
Commit 5) Filters (weeks/menu_group/event_type) + polish

DELIVERABLE:

- Changed files per commit
- Manual verification checklist
- Confirm service role key is not exposed to client
