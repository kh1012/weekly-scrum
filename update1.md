You are in UX-ACCELERATION MODE for Admin CUD (Create/Update/Delete) of Plans.
Your goal is to design and implement an extremely high-usability Admin UI inspired by Airbnb-style design and interaction patterns.

This is NOT about adding features.
This is about making plan creation, update, and deletion feel effortless, fast, and delightful.

============================================================
DESIGN SYSTEM BASELINE — AIRBNB STYLE
============================================================

Design principles to follow strictly:

1. Calm, soft, human UI (Airbnb-like)

   - Rounded corners (12px+)
   - Subtle shadows (not heavy elevation)
   - Neutral background with light surface contrast
   - Generous spacing, but compact input density

2. Interaction-first design

   - Everything feels “alive” on hover
   - Micro-animations guide the user
   - No hard edges, no abrupt state changes

3. Progressive disclosure

   - Show only what is needed at the moment
   - Advanced options appear only on intent (hover, focus, command)

4. Mouse + Keyboard parity
   - All actions usable with mouse
   - Power users can complete everything with keyboard

Animation & motion rules:

- Use short, smooth transitions (120–180ms)
- Use ease-out curves
- Avoid bouncy or playful motion (professional calm)

============================================================
NON-NEGOTIABLE CUD PRINCIPLES
============================================================

P1) Create requires only ONE field: title.
P2) Create happens IN CONTEXT (where the user is looking).
P3) Update is direct manipulation first (drag, resize, inline).
P4) Delete is fast (keyboard + Undo, no confirm modal).
P5) Repetition solved by duplicate (Cmd/Ctrl + D).
P6) Power users use Command Palette (Cmd/Ctrl + K).
P7) Optimistic UI with graceful rollback on failure.

============================================================
DATA & SECURITY CONTRACT (DO NOT VIOLATE)
============================================================

READ:

- ALWAYS read from `public.v_plans_with_assignees`

WRITE:

- Use existing server actions only
- created_by / updated_by must always be set
- Respect RLS strictly (admin/leader only)

============================================================
SCOPE
============================================================

Only Admin Space / All Plans is affected.
Work Space / Plans (read-only) must not change.

============================================================
UX IMPLEMENTATION — STEP BY STEP
============================================================

STEP A — AIRBNB-STYLE QUICK CREATE (HOVER SLOT)

Surface:

- Implement a clean timeline surface (weekly grid).
- Each week/day cell has:
  - soft background
  - subtle border
  - generous padding

Hover behavior:

- On hover:
  - cell background slightly brightens
  - a soft "+" button fades in (opacity + scale)
  - cursor changes to indicate action

Click behavior:

- Clicking "+" opens a small floating popover near cursor.
- Popover style:
  - White surface
  - Rounded corners
  - Soft shadow
  - No hard borders

Popover contents (minimal):

- Title input (auto-focus)
- Optional hint text: “Enter to create”
- No submit button (Enter submits)

Auto-fill behavior:

- start_date / end_date inferred from hovered slot
- Default duration: 1 week if ambiguous
- type, stage, status default to last-used values
- domain/project/module/feature inferred from active filters

Interaction:

- Enter → create plan
- Esc → cancel
- Creation is optimistic:
  - Plan appears immediately with fade-in animation
  - If server fails, fade-out + error toast

Acceptance:

- Create plan with: hover → click → type → Enter
- No page navigation
- No modal

============================================================

STEP B — DIRECT MANIPULATION UPDATE (AIRBNB FEEL)

Plan rendering:

- Plans rendered as soft bars/chips
- Rounded ends
- Light background color by status
- Subtle shadow on hover

Hover interactions:

- On hover:
  - Bar slightly lifts (translateY -1px)
  - Resize handles fade in on left/right
  - Cursor changes appropriately

Drag behavior:

- Drag bar body → shift date range
- Resize edges → adjust start/end
- Smooth motion with snapping to grid
- While dragging:
  - Ghost preview follows cursor
  - Dates preview inline

Inline edit:

- Double-click title:
  - Turns into inline input
  - No modal, no side panel
- Enter → save
- Esc → cancel

All updates:

- Optimistic UI first
- Server update
- Rollback + toast on failure

============================================================

STEP C — FAST DELETE + UNDO (NO MODALS)

Delete interaction:

- Select plan (click or keyboard focus)
- Press Delete / Backspace

Behavior:

- Plan fades out immediately
- Snackbar appears bottom-center:
  - “삭제됨”
  - Undo button (5 seconds)

Undo:

- Restores plan with fade-in
- Cancels delete if possible or re-creates

No confirmation modal allowed.

============================================================

STEP D — DUPLICATE (CMD/CTRL + D)

Shortcut:

- Cmd/Ctrl + D duplicates selected plan

Behavior:

- New plan appears immediately
- Shifted to next logical time slot
- Title suffix “(copy)”
- Optimistic insert

============================================================

STEP E — COMMAND PALETTE (CMD/CTRL + K)

Command palette design:

- Airbnb-like floating command box
- Centered, rounded, soft shadow
- Input auto-focused

Commands:

- Create plan
- Change status
- Change stage
- Assign users
- Duplicate selected
- Delete selected

Interaction:

- Fully keyboard-driven
- Arrow navigation
- Enter to execute
- Esc to close

============================================================
IMPLEMENTATION CONSTRAINTS
============================================================

- No heavy Gantt library in this phase
- Use existing TanStack Query
- Use Framer Motion or CSS transitions for animation
- Keep components small and composable

Suggested structure:

- components/admin-plans/TimelineSurface.tsx
- components/admin-plans/PlanBar.tsx
- components/admin-plans/QuickCreatePopover.tsx
- components/admin-plans/UndoSnackbar.tsx
- components/admin-plans/CommandPalette.tsx
- lib/admin-plans/optimistic.ts
- lib/admin-plans/keyboard.ts

============================================================
DELIVERY & COMMITS
============================================================

Proceed incrementally.

START WITH STEP A ONLY.

Commit format:
feat(admin-plans): airbnb-style quick create on timeline

For each step:

- list changed files
- show key code excerpts
- confirm build/typecheck passes
- STOP before moving to next step
