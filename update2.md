# Cursor V2 Prompt — Snapshot Manage: Select/Collaborators Popover Portal + Shortcut OS + Editor Width (Bugfix Only)

## Goal

Fix UI bugs on **Snapshot Manage** pages:

- **New (Create)** page edit form
- **Edit** page edit form

Scope is **bugfix + small UX correctness only** (no redesign yet).

## Problems to fix

1. **All Select components**: when clicked, the dropdown/popup list initially appears in the wrong position and/or gets clipped.

   - Root cause likely: popover rendered inside scroll/overflow/transform container (no portal), causing positioning issues.

2. **Collaborators Select**:

   - Dropdown list is clipped by parent 영역 (overflow)
   - Needs **search** within options
   - Must be rendered via **Portal** as well.

3. Shortcut hint text:

   - Current hint uses: `Command + Option + ↓`
   - If OS is **Windows**, display: `Ctrl + Alt + ↓`
   - Verify whether OS-based branching already exists. If not, implement it.
   - This is **display text** change (and ensure any keyboard handler hint matches if implemented).

4. Editor area width:
   - Initialize edit area horizontal width to **minimum** by default (min-width state).
   - Keep user resizing ability if it already exists, but default initial state must be the minimum.

## Constraints

- Do NOT do UI redesign, typography refactor, or section layout changes. (We will discuss later.)
- Keep existing behavior and API contracts.
- Fix must apply to both Create and Edit pages, and any shared components.

## Tasks (Step-by-step)

### Step 0 — Identify components & usage

- Search the codebase for all Select/Popover usage in Snapshot Manage Create/Edit forms:
  - components like `Select`, `Popover`, `Dropdown`, `Combobox`, `Command`, `Portal`
  - libraries: Radix UI / shadcn/ui / custom popover
- List the exact component(s) used for:
  - standard Select fields
  - collaborators field

### Step 1 — Make ALL Select dropdowns render through Portal

- If using Radix/shadcn:
  - Ensure `SelectContent` uses portal (`<SelectPrimitive.Portal>` or `Select.Portal`) and that content positioning uses Popper correctly.
  - Ensure `sideOffset`, `collisionPadding`, `avoidCollisions`, `sticky` options are set appropriately for scroll containers.
- If using a custom popover:
  - Move dropdown content rendering to a Portal attached to `document.body`.
  - Ensure anchor reference/trigger ref is used for positioning.
  - Ensure first-open positioning is correct (no “jump” on first render).
- Validate with:
  - initial click opens dropdown aligned to trigger
  - works after scrolling
  - does not clip within overflow containers

### Step 2 — Collaborators Select: searchable + portal + no clipping

- Implement a searchable combobox UX for Collaborators:
  - Input to filter options (case-insensitive)
  - Keyboard navigation up/down + enter
  - If existing component is already `Command`-based, wire filtering and ensure it still portals.
- Ensure collaborators dropdown/popup list:
  - renders in Portal
  - has max height + internal scroll
  - positions correctly near trigger
  - never gets cut off by parent container overflow

### Step 3 — OS-based shortcut label (Mac vs Windows)

- Implement a small utility:
  - `getOS()` returning `mac | windows | other`
  - Prefer `navigator.userAgentData?.platform` if available, fallback to `navigator.platform` or userAgent parsing.
- Replace the shortcut label text in the UI:
  - Mac: `⌘ + ⌥ + ↓` (or keep `Command + Option + ↓` if the UI is text-only; but must be consistent)
  - Windows: `Ctrl + Alt + ↓`
- If there is an actual keybinding handler associated with this hint:
  - Verify it matches the displayed shortcut on Windows and Mac.

### Step 4 — Initialize edit area width to minimum

- Locate the edit area resizable layout state (likely a splitter or CSS width state).
- Change the default initial width to the minimum:
  - If there is persisted width in localStorage: consider fallback priority
    - Use persisted value if exists, else use minimum
  - If there is no persistence: default = minimum
- Ensure this applies in both Create and Edit pages.

### Step 5 — QA checklist (must pass)

- Create page:
  - open every Select: first open position correct, not clipped
  - Collaborators: searchable, portal, not clipped
  - shortcut hint shows correct based on OS
  - edit area starts at minimum width
- Edit page: same checks
- Regression:
  - no console errors
  - no hydration mismatch (if Next.js)
  - keyboard navigation still works

## Deliverables

1. Code changes implementing the fixes above.
2. A short markdown summary at repo root: `bugfix-select-portal-shortcut-width.md` including:
   - what was changed
   - which components were affected
   - how to test (manual steps)

## Definition of Done

- Popovers never appear in the wrong place on first open
- No dropdown clipping in any form section
- Collaborators search works and is stable
- Shortcut hint label matches OS
- Edit area default width is minimum
- Build passes + basic manual QA 완료
