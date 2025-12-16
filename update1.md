# Cursor V2 Prompt — Snapshot Edit Form UX: Document-style Editing (No Feature Changes)

## Goal

Improve the **editing experience** of the Snapshot Create/Edit form by making it feel like a **document editor**, not a dashboard or card-based form.

⚠️ Important:

- **Do NOT remove or change any existing functionality**
- **Do NOT remove shortcuts, quick actions, or keyboard UX**
- **This task is visual structure + hierarchy + readability only**

## Scope

Applies to:

- Snapshot Create page
- Snapshot Edit page
- Shared edit form components

---

## Design Principles (Must Follow)

### 1. Editing experience = Document, not Dashboard

Users should feel like they are **writing a weekly document**, not filling out a management form.

Avoid:

- Excessive cards
- Box-in-box layouts
- Strong borders or shadows for structure

Prefer:

- Section flow
- Headings (h2 / h3)
- Typography + spacing for hierarchy

---

### 2. Cards are NOT layout structure

Cards should:

- Be used only for **information units** (e.g. task item groups)
- NOT be used to define major sections or chapters

Cards should NOT:

- Wrap entire sections (Past Week / This Week)
- Be nested multiple levels deep

---

## Layout Refactor Tasks

### Step 1 — Global Layout

- Keep the current overall page layout and routing
- Keep editor width behavior as-is (min-width already handled in bugfix)
- No sidebar or navigation changes

---

### Step 2 — Meta Information (Domain / Project / Module / Feature)

#### Current issue

- Meta Information feels like a heavy form
- Same visual weight as writing sections

#### Changes

- Remove card-style container around Meta Information
- Render Meta Information as a **document header section**

Structure:

- Use a section title: `Meta Information` (h2)
- Place a subtle divider below the title
- Arrange selects in a compact grid:
  - 2 columns per row
  - Domain | Project
  - Module | Feature

Style rules:

- Labels should be small and quiet
- Inputs should use compact spacing
- No background box or shadow

Meta Information should feel like **context**, not content.

---

### Step 3 — Past Week / This Week as Document Sections

#### Current issue

- Section titles exist, but cards dominate hierarchy

#### Changes

- Treat `PAST WEEK` and `THIS WEEK` as **chapter titles (h2)**
- Remove card containers that wrap entire sections
- Add generous vertical spacing between sections

---

### Step 4 — Tasks / Risks / Collaborators as Subsections

- Convert `Tasks`, `Risks`, `Collaborators` into **subsection headings (h3)**
- Keep icons if already present
- Each subsection:
  - Title (h3)
  - Content directly below
  - Minimal or no outer container

Cards may still be used:

- Inside task lists
- Inside risk lists
- For item grouping only

---

### Step 5 — Focus Handling (Readability First)

#### Goal

Help users focus without visual noise.

Rules:

- When a section/subsection is focused:
  - Emphasize the heading (slightly stronger color or weight)
  - Show a very subtle left accent line (1–2px)
- Non-focused sections:
  - Reduce opacity slightly (e.g. 0.65)
  - DO NOT disable interaction
  - DO NOT blur

Avoid:

- Strong borders
- Background color blocks
- Drop shadows

Focus should guide the eye, not shout.

---

### Step 6 — Spacing & Density

- Reduce vertical padding between inputs within the same subsection
- Increase spacing **between sections**, not inside them
- Labels should not compete visually with content
- Reading flow should be top → bottom without visual interruption

---

## What Must Stay Exactly the Same

- All existing shortcuts and helper UI
- Task add / quick add / keyboard UX
- Progress slider behavior
- Risk handling
- Collaborators logic
- Data schema and API calls

This is a **presentation-layer refactor only**.

---

## QA Checklist

- Editing feels closer to writing a document than filling a form
- Eye fatigue reduced during long editing sessions
- Users can instantly identify:
  - Where they are (Past / This)
  - What they are editing (Tasks / Risks / Collaborators)
- No feature regression
- No behavior changes

---

## Deliverable

1. Code changes implementing the document-style layout
2. A short markdown summary:
   - `snapshot-edit-document-ux.md`
   - Before vs After (conceptual description)
   - What was intentionally NOT changed
