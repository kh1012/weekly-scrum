We are DIETING the plan creation/edit UX and aligning DB constraints.

TARGET UX (Admin All Plans CUD)

- type=feature:

  - Basic: title (required), stage (required)
  - Hierarchy: project/module/feature (required), domain removed from UI (DB keeps it but not used)
  - Schedule: start_date, end_date
  - Assignees: show roles as Korean labels:
    - planner=기획, fe=FE, be=BE, designer=디자인, qa=검증

- type=sprint:

  - Basic: title (required)
  - Schedule: start_date, end_date
  - No stage/hierarchy/assignees required (assignees optional if already supported, but do not force)

- type=release:
  - Basic: title (required)
  - Schedule: start_date, end_date
  - No stage/hierarchy/assignees required (optional)

DB/RLS RULES (do not change)

- READ only from view: public.v_plans_with_assignees
- WRITE to tables via existing server actions
- Always set updated_by = auth.uid() on update, created_by/updated_by on insert

TASKS

1. Update PlanForm to be type-driven:
   - When type changes, show/hide fields accordingly.
   - For feature: enforce project/module/feature + stage required in UI validation.
   - Remove domain input entirely (do not send domain on create/update).
2. Update assignee role labels and options:
   - Use enum values: planner, fe, be, designer, qa
   - Display labels: 기획, FE, BE, 디자인, 검증
3. Update filters/options to reflect removed domain from UI:
   - Keep server-side filters intact but remove domain filter from UI for creation/edit.
   - If a domain filter exists in list view, keep it only if still useful; otherwise remove consistently.
4. Ensure timeline/quick create (if exists) uses minimal fields:
   - For feature quick create: create with title + stage (default stage) + inferred hierarchy from current filters, schedule inferred from slot.
   - For sprint/release quick create: title + schedule inferred from slot.

OUTPUT

- List changed files
- Key code excerpts for: type-driven validation, assignee role mapping, payload changes
- Ensure build/typecheck passes

COMMIT
"refactor(plans): diet plan form by type and update assignee roles"
