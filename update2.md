# GitHub-style UI Refactor + Responsive Migration (Menu-by-Menu)

You are refactoring an existing Weekly Scrum web app (Next.js + React + Tailwind).
The goal is to redesign ONE menu/page to match a GitHub-like information-dense,
minimal, professional UI — and make it responsive (desktop → mobile).

This is NOT a visual experiment.
This is a systematic UI simplification + responsive migration.

---

## Target Menu

- Menu Name: [e.g., Works > Weekly Log]
- Route(s): [e.g., /works/weekly-log]
- Primary user goals on this page:
  - [read information quickly]
  - [scan status / progress]
  - [open details / write updates]

---

## Core Design Philosophy (MUST FOLLOW)

### 1. GitHub-style Principles

- Dense but readable (information > decoration)
- Neutral, low-saturation color palette
- Clear hierarchy via spacing, weight, and alignment — NOT color blocks
- Borders over shadows
- Flat UI (no card stacking unless it improves scanability)
- Minimal animation, instant feedback

Reference mentally:

- GitHub Issues / Pull Requests
- GitHub Project board (table/list view)
- Linear list view

---

## Global Visual System (DO NOT DEVIATE)

### Color Palette

- Background: white / very light gray (`#ffffff`, `#f6f8fa`)
- Text primary: near-black (`#24292f`)
- Text secondary: muted gray (`#57606a`)
- Borders/dividers: subtle gray (`#d0d7de`)
- Accent (links / primary action): GitHub blue (`#0969da`)
- Status colors (use sparingly):
  - success: muted green
  - warning: muted yellow/orange
  - danger: muted red

❗ No large colored backgrounds. Color = meaning only.

---

### Typography

- Base font size: 14px (desktop), 13–14px (mobile)
- Line height: relaxed but compact
- Use font-weight for hierarchy:
  - title: 600
  - body: 400
  - metadata: 400 + muted color
- Avoid oversized headings.

---

### Spacing & Layout

- Prefer vertical rhythm over cards
- Use separators (`border-b`) instead of boxes
- Horizontal padding:
  - desktop: 24px
  - mobile: 16px
- Avoid deep nesting

---

### Components Style Rules

- Buttons:
  - default: subtle border, no fill
  - primary: filled blue, used sparingly
- Icons:
  - small, muted, functional
- Badges:
  - outline or light fill only
- Cards:
  - avoid unless absolutely necessary
  - lists > cards

---

## Responsive Strategy (Applied Together)

### Desktop (≥1024px)

- Keep dense list/table layout
- Multi-column allowed
- Right-side metadata allowed

### Tablet (768–1023px)

- Reduce columns
- Stack secondary info below primary row

### Mobile (<768px)

- Single column
- Convert tables → stacked rows
- Inline metadata moves below title
- Filters/actions move to:
  - top toolbar
  - or drawer / bottom sheet
- No horizontal scroll unless explicitly intended

---

## Step 0 — UI & Layout Audit (MANDATORY)

Before coding:

- Identify visual noise:
  - excessive background colors
  - cards-within-cards
  - heavy shadows
  - oversized paddings
- Identify layout issues:
  - fixed widths
  - multi-scroll containers
  - mobile-unfriendly tables
    Output:
- What to REMOVE
- What to SIMPLIFY
- What to KEEP

---

## Step 1 — Visual Simplification First (NO RESPONSIVE YET)

Do the following in order:

1. Strip decorative styles (backgrounds, shadows, borders that don't convey meaning)
2. Convert card-based UI → list-based UI where possible
3. Normalize typography & spacing
4. Replace color emphasis with:
   - spacing
   - font weight
   - alignment
5. Ensure page looks clean and readable on desktop

Stop and verify before proceeding.

---

## Step 2 — Information Density Optimization

- Combine related info into a single row/block
- Move secondary info to muted inline metadata
- Ensure a user can scan:
  - status
  - owner
  - date
  - progress
    in under 2 seconds per item

---

## Step 3 — Responsive Conversion

Apply responsive rules:

- Use Tailwind breakpoints (`sm`, `md`, `lg`)
- Mobile:
  - Stack rows
  - Hide non-essential columns
  - Move filters/actions into drawer if needed
- Ensure:
  - no text overflow
  - no clipped actions
  - touch targets ≥ 44px

---

## Step 4 — Interaction Rules

- No fancy animations
- Hover only for desktop
- Active/focus states must be clear
- Click → immediate visual feedback
- Loading = subtle skeleton or opacity

---

## Step 5 — Verification Checklist

- Desktop still dense & efficient
- Mobile usable with one hand
- No horizontal scroll
- Visual noise significantly reduced
- Looks closer to GitHub than Notion

---

## Output Requirements

- Files changed list
- Before/After summary (what was simplified)
- Key UI decisions & rationale
- Manual test checklist (desktop + mobile)

Start with Step 0 audit for the target menu.
Proceed step-by-step. Do not skip steps.
