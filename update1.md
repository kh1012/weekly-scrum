You are working on a Next.js (App Router) + Supabase project.

DATABASE STATUS (IMPORTANT — DO NOT CHANGE):
The following database changes are ALREADY APPLIED and MUST NOT be modified:

1. workspace_role enum:

   - "leader" has been renamed to "manager"
   - Valid roles: admin / manager / member

2. Helper functions exist:

   - public.is_workspace_admin_or_leader(workspace_id) → admin | manager
   - public.is_workspace_admin(workspace_id [, user_id]) → admin only

3. RLS policies already applied:

   - Admin-only manage policies for:
     - public.snapshots
     - public.snapshot_entries
   - Manager/Admin write access for:
     - workspace_members
     - gantt_flags
     - feedbacks (if table exists)

4. gantt_flags table:

   - Column exists: links jsonb NOT NULL DEFAULT []

5. Views (column sets are FIXED — do not assume anything else):

   - public.v_flag_plan_summary:
     columns:
     workspace_id
     flag_id
     flag_title
     flag_start_date
     flag_end_date
     flag_days
     plan_count
     min_plan_start
     max_plan_end

   - public.v_resource_distribution:
     columns:
     workspace_id
     user_id
     display_name
     assigned_plan_count

   - public.v_collab_edges:
     columns:
     workspace_id
     from_user_id
     to_user_id
     collaboration_count

6. Indexes already exist:
   - snapshot_entries(workspace_id, created_at desc)
   - snapshot_entries(workspace_id, author_id)
   - snapshots(workspace_id, updated_at desc)

ABSOLUTE RULES:

- ❌ Do NOT modify DB schema, views, functions, enums, or policies.
- ❌ Do NOT add migrations or SQL.
- ❌ Do NOT assume additional columns exist.
- ✅ Use only confirmed tables/columns/views listed above.
- ✅ Incremental commits are mandatory.

---

## IMPLEMENTATION GOALS (ALL REQUIRED)

### 1) Role system cleanup (leader → manager)

- Sweep the codebase and replace all UI labels, types, and logic:
  - "leader" → "manager"
- Authorization semantics:
  - admin → full access (admin pages, delete, manage)
  - manager → elevated access (existing leader permissions)
  - member → standard access
- If legacy data is encountered:
  - Normalize at boundary ONLY ONCE:
    if (role === "leader") role = "manager"
- After this step, there should be NO permission logic relying on the string "leader".

---

### 2) Admin-only Snapshots Management Page

- Route: /admin/snapshots
- Access:
  - Admin-only (use role + DB enforcement, not UI-only guards)
- Data source:
  - public.snapshots
  - public.snapshot_entries (for counts)
- UI requirements:
  - List snapshots for current workspace:
    - created_at
    - updated_at
    - author_id (display user if available)
    - entry count (snapshot_entries grouped by snapshot)
  - Admin-only delete action:
    - Confirmation modal
    - Graceful handling of RLS errors
    - Refresh list on success

---

### 3) Custom Flag Links (DB-backed)

- Data source:
  - gantt_flags.links (jsonb array)
  - Type: Array<{ url: string; label?: string }>
- Flag create/edit modal:
  - Add/remove multiple links
  - URL validation: must start with http:// or https://
- Flag display:
  - Compact inline rendering (chips or small list)
- No schema assumptions beyond `links`.

---

### 4) Admin Insights Dashboard (Read-only)

- Route: /admin/insights
- Admin-only access
- Use ONLY existing DB views:

A) Flag summary

- Source: public.v_flag_plan_summary
- Show:
  - flag_title
  - flag_start_date ~ flag_end_date
  - flag_days
  - plan_count

B) Resource distribution

- Source: public.v_resource_distribution
- Show:
  - display_name
  - assigned_plan_count

C) Collaboration network (table view)

- Source: public.v_collab_edges
- Show:
  - from_user_id
  - to_user_id
  - collaboration_count
- Sort by collaboration_count desc
- If user display info exists elsewhere, join carefully.
  If not, render truncated UUID.

- UI style:
  - Dense, GitHub-like tables
  - Read-only (NO mutations)

---

### 5) Entries Page: Left Filter Panel + Search + Pagination

Target page:

- /works/entries (or the existing entries feed route)

IMPORTANT:

- Project/module/feature columns do NOT exist.
- Entries are backed by snapshot_entries.

Filters to implement (ONLY THESE):

- Author filter:
  - snapshot_entries.author_id
- Date range filter:
  - snapshot_entries.created_at
- Collaborator toggle:
  - collaborators IS NOT NULL
  - jsonb array length > 0
- Workspace scoping is mandatory.

Search:

- If any filter is active:
  - Search within filtered result set
- If no filter is active:
  - Search across the full dataset
- If no text fields exist:
  - Either disable search or search by author_id / id
  - Do NOT invent fields

Pagination:

- Keyset pagination preferred:
  - Order by created_at desc
- Use stable cursors
- Avoid duplicates or gaps

---

## ENGINEERING CONSTRAINTS

- Minimal refactors only.
- Reuse existing components, hooks, stores, and Supabase client.
- Follow existing project patterns.

---

## MANDATORY VERIFICATION BEFORE EACH COMMIT (>= 3)

1. Ripgrep checks:

   - rg -n "leader"
     → Must NOT appear in permission logic or UI labels.

2. Build / type safety:

   - pnpm typecheck OR pnpm build (project standard)

3. Manual smoke tests:
   - member:
     - cannot access /admin/\*
   - manager:
     - cannot access admin pages
     - can access manager-allowed features
   - admin:
     - can access /admin/snapshots
     - can delete snapshots
     - can access /admin/insights
   - /works/entries:
     - filters work
     - pagination stable
     - no crashes

---

## RECOMMENDED COMMIT PLAN

Commit 1:

- Role rename sweep (leader → manager)
- Permission logic normalization

Commit 2:

- /admin/snapshots scaffold
- Admin-only guard
- Snapshot list

Commit 3:

- Snapshot delete flow
- Entry count aggregation
- Error handling

Commit 4:

- gantt_flags.links end-to-end
- Modal UI + display

Commit 5:

- /admin/insights
- 3 tables from DB views

Commit 6:

- /works/entries
- Left filter panel
- Search behavior
- Pagination

---

## DELIVERABLE

- List of files changed per commit
- Manual verification checklist results
- Confirmation that NO DB changes were made
