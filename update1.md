Feature: Team Activity Feed
Category: Works
Menu name: Team Feed
(Alternative acceptable names: Weekly Activity, Team Timeline)

Goal
Build a read-only team feed where users can naturally understand what each team member worked on during the latest weeks by simply scrolling.

This screen is optimized for reading, not editing or management.

Primary use case:

- Team members casually checking what others worked on
- Leaders quickly sensing weekly progress and risks without opening details

Core UX Principles (DO NOT VIOLATE)

1. Scrolling = understanding
   - Users must understand “who did what this week” without clicking anything.
2. People first
   - Content is grouped by person + week, not by project or entry.
3. Text-first, cardless reading
   - No heavy cards, no visual noise.
   - Layout should feel like reading a structured document or feed.
4. Stable, predictable rhythm
   - Every feed item follows the same structure.
5. No manual weekly summary writing
   - Users are NOT required to write a weekly summary.
   - The UI derives a highlight preview automatically from snapshot entries.

Data Model Assumptions

- snapshot_entries
  - Belongs to a person
  - Has a section/type: Progress, Next, Risk
  - Has created_at
- Entries are grouped by ISO week
- Multiple entries may exist per person per week

Feed Ordering

- Always latest first
- Sort by the most recent snapshot activity
- No filters in the GNB for now (intentionally hidden)

Feed Item Structure (Person + Week Block)
Each feed item MUST contain the following sections in this order:

1. Person Header

- Avatar
- Name (most prominent)
- Role / team (secondary)
- Week label is NOT repeated here (handled by timeline)

2. Weekly Highlight Preview (AUTO-EXTRACTED, 3 lines fixed)
   This is NOT a summary written by the user.
   It is a rule-based extraction from snapshot entries.

Extraction rules (stable & deterministic):

- If a Risk entry exists, include exactly 1 Risk line
- Include exactly 1 Next line
- Include exactly 1 Progress line
- Always show exactly 3 lines
- Order is fixed: Progress → Next → Risk
- If no Risk exists, still show: “Risk: None”
- Each line is a single sentence or bullet, truncated if needed
- No icons, no badges, no colors — text only

This section must allow users to understand the week without expanding anything.

3. Snapshot Entry Drawer (+N)

- Show entry counts, e.g.:
  “Entries · Progress 2 · Next 1 · Risk 1 +5”
- Clicking +N expands the full list of snapshot entries
- Expanded entries are displayed as continuous text sections, not cards
- Default state: collapsed

Desktop Layout (≥1024px)
Three-column layout

Left: Weekly Timeline Spine

- Vertical line representing time
- Week nodes (e.g. “2025 W52”)
- Each feed item visually connects to its week node
- The currently visible week is subtly highlighted
- Week labels appear ONLY here (not inside feed items)

Center: Main Feed

- Full-width reading column
- Dominant visual priority

Right: Activity Chart (Team-level)
Purpose: Show when the team writes snapshot entries

- Bar chart showing daily snapshot entry counts
- Default range: last 14 days
- Data unit: snapshot_entries (not snapshots)
- Timezone: Asia/Seoul
- Tooltip example:
  “Dec 27 · 18 entries · 6 authors”

Optional toggle:

- Daily (last 14 days) ↔ Weekday average (last 8 weeks)

Tablet Layout (768–1023px)

- Two columns: feed + activity chart
- Timeline spine removed
- Replace with sticky week headers inside the feed (e.g. “2025 W52”)
- Maintain the same reading rhythm

Mobile Layout (<768px)
Single-column, reading-first

Feed:

- Only the feed is visible by default
- Same feed item structure as desktop
- Weekly grouping shown via sticky week headers

Activity Chart:

- Not visible by default
- Show a single-line summary at the top:
  “Avg 8 entries/day · Peak: Dec 26 (22)”
- Tapping opens a bottom sheet with the full chart

Timeline Spine:

- Completely removed
- Replaced by sticky week headers only

Things That Must NOT Exist

- Editable fields on this screen
- Manual weekly summary input
- Likes, emojis, reactions
- Heavy card borders or backgrounds
- Default-open drawers
- Filters in the initial GNB

Success Criteria
After 10 seconds of scrolling, a user should be able to answer:

- Who worked on what this week?
- Who seems blocked or at risk?
- When does the team usually write snapshots?

If this is not true, the implementation is incorrect.

Implementation Notes

- Prefer predictable layout and typography over visual decoration
- Use spacing and hierarchy instead of boxes
- Optimize for fast vertical scanning
- This screen is foundational — keep it boring and reliable
