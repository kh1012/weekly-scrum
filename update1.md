CURSOR PROMPT — Implement Collaborator Graph (React Flow) + menu_settings + route fix

0. HARD REQUIREMENTS (DO NOT SKIP)

- Route MUST be: /works/collaborator-graph
- SNB/menu exposure MUST be driven by menu_settings (workspace scoped) and this new menu must be inserted/recognized.
- Left panel MUST reuse an existing “week list” component (do not clone a one-off). If none exists, refactor the existing weekly UI into a shared component and reuse it here.
- Page MUST use full available content area under GNB (full-height). Graph canvas should be the main focus.
- Graph MUST allow free node dragging and repositioning.
- Right panel MUST show quantitative cards (bar/donut style) including Top3 most-collaborated and other stats.
- Most-collaborative person MUST be visually larger (node size + card emphasis).

1. SCOPE / GOAL
   Add a new Works submenu “Collaborator Graph” that visualizes collaboration relationships by week / week-range, using React Flow:

- Left: week checklist (weeks with snapshot data only) + quick selects (last 4/8, select all/none)
- Center: React Flow network graph (nodes=people, edges=collaboration, thickness=weight)
- Right: analytics cards (overview + Top3 + distribution). Top collaborator is highlighted and larger.

2. ROUTING / MENU

- New route page: /works/collaborator-graph
- Menu key: collaborator-graph
- Label: Collaborator Graph
- Category/Group: Works

  2.1) menu_settings integration (MANDATORY)
  We already have a menu_settings table (workspace_id, menu_key, is_enabled, tag_label, tag_color, ...).
  You MUST:
  A) Ensure the SNB renderer recognizes menu_key="collaborator-graph" and maps it to route "/works/collaborator-graph"
  B) Seed existing workspaces so the new menu appears by default (enabled=true) without breaking any legacy workspace.
  C) Ensure if a workspace has NO menu_settings row for collaborator-graph, the app DOES NOT CRASH and follows the existing fallback policy (either treat as enabled by default or hidden by default—match existing behavior).

  2.2) SQL migration to seed existing workspaces

- IMPORTANT: Confirm actual PK column name for workspaces (id vs workspace_id). Use the real one.
- Use NOT EXISTS to avoid duplicates.

SQL (ADAPT TO REAL PK):
insert into public.menu_settings (workspace_id, menu_key, is_enabled, tag_label, tag_color)
select w.id as workspace_id, 'collaborator-graph', true, null, null
from public.workspaces w
where not exists (
select 1
from public.menu_settings ms
where ms.workspace_id = w.id
and ms.menu_key = 'collaborator-graph'
);

If workspaces PK is workspace_id, replace w.id with w.workspace_id accordingly.

3. DATA + AGGREGATION (NO OVER-ENGINEERING)
   This is a GRAPH problem, not a normal chart.

3.1) Inputs (Snapshot based)

- Find the source of collaborators from existing schema.
  - Prefer snapshot_entries if that’s where per-day/per-entry collaborators exist.
  - Otherwise use snapshots or related tables that store collaborators.
- Each collaboration relationship is derived as:
  author_user_id (A) collaborated with collaborator_user_id (B)
- Aggregate by selected weeks (multi-select):

  - week key format: "YYYY-WW" or match existing app’s week identifier
  - Only include entries that belong to selected weeks

  3.2) Output model for graph

- Node:
  id: user_id
  label: display_name
  metrics:
  total_collabs: sum of collaboration weights for this user in selected range
  unique_partners: distinct collaborators count
  authored_count: number of authored entries (if available)
- Edge:
  id: stable edge key
  source: user_id
  target: user_id
  weight: collaboration frequency (or weighted score)
  weeks: array of week keys (for tooltip/debug)

Direction:

- Prefer undirected for readability:
  edgeKey = min(A,B) + ':' + max(A,B)
  weight = sum across both directions

  3.3) Stats for right panel
  Compute:

- selectedWeekRangeLabel (min week ~ max week; or “N weeks selected” if non-contiguous)
- totalCollabWeight = sum(edge.weight)
- participantCount = nodes.length
- topCollaborator = max by node.metrics.total_collabs
- top3Collaborators = top 3 by node.metrics.total_collabs
- optional: distribution buckets (e.g., top1 share, top3 share, rest)

Performance:

- Use memoization (useMemo) so aggregation recalculates only when selectedWeeks or raw data changes.

4. UI LAYOUT (FULL SCREEN UNDER GNB)

- Keep GNB in place.
- Content area must be full-height and maximize graph space.
- Layout recommended:
  [Left Panel (Weeks)] [Center (React Flow Canvas)] [Right Panel (Cards)]
- Responsive:
  - On mobile: left/right panels collapse into Drawer/Accordion; center graph remains primary.

5. LEFT PANEL — WEEK CHECKLIST (REUSE EXISTING COMPONENT)

- MUST list ONLY weeks that have snapshot data.
- Provide:
  - checkbox list (multi-select)
  - quick buttons: Select All, Select None, Last 4 weeks, Last 8 weeks
- Reuse an existing week list component from current app:
  - Search for components named like: WeekList, SnapshotWeekList, WeekSidebar, WeeklyLogSidebar, etc.
  - If none exists, refactor the currently used weekly UI into a shared component (do NOT duplicate code).

Data sourcing for available weeks:

- Implement a hook/query that returns “weeks with data”.
  Example: useAvailableSnapshotWeeks(workspaceId) -> WeekItem[]
- Default selection:
  - Auto-select last 4 data-weeks on first load (if available).

6. CENTER — REACT FLOW GRAPH (INTERACTIVE)
   Requirements:

- Nodes draggable (user can reposition freely)
- Pan/zoom enabled
- Edge thickness reflects weight
- Node size reflects total_collabs
- Top collaborator’s node is significantly bigger

Interactions:

- Clicking a node updates right panel to “focus mode” for that person:
  - show that person’s totals, partner breakdown, top partners
- Clicking an edge shows A-B pair details:
  - total weight + which weeks + example entries count (if easy)

Implementation guidance:

- Use React Flow basic setup with nodes/edges from aggregation.
- Keep styling minimal but clear.
- Avoid heavy auto-layout at first. If needed later, add dagre/elk as optional improvement.

7. RIGHT PANEL — QUANT CARDS (MUST INCLUDE)
   Create cards with clearly readable numbers + small charts:

Card A: Overview

- Selected range label
- totalCollabWeight
- participantCount
- Top1 collaborator (name + total_collabs)

Card B: Top3 Collaborators

- List Top3 with bar visualization (simple bar chart is enough; reuse existing chart lib if present)
- Show values and percentages

Card C: Distribution

- Donut or stacked bar showing top1/top3/rest share
- Keep it lightweight; if no chart lib exists, implement tiny SVG bars/donut.

Visual emphasis:

- The Top1 collaborator should stand out:
  - Larger node size in graph
  - In cards: highlight row, badge, or larger typography

8. IMPLEMENTATION PLAN (MIN 6 COMMITS + 3 CHECKS EACH)
   Before each commit: (1) TS/lint (2) runtime null/empty (3) UX interaction check

Commit 1 — Route + Skeleton Layout

- Add /works/collaborator-graph page with 3-panel layout
- Empty states (no weeks, no selection)
- Full-height under GNB

Commit 2 — menu_settings + SNB integration

- Add menu mapping: collaborator-graph -> /works/collaborator-graph
- Ensure SNB reads menu_settings and does not break if row missing
- Add migration SQL (supabase migration or documented SQL in repo)

Commit 3 — Available weeks query + left checklist (reuse existing)

- Implement useAvailableSnapshotWeeks
- Implement checkbox UI using reused week component (or refactor to shared)
- Add quick-select buttons
- Default select last 4 weeks

Commit 4 — Fetch snapshot/entry data by selected weeks + aggregation

- Implement data fetch hook: useSnapshotEntriesByWeeks(workspaceId, selectedWeeks)
- Implement buildCollabGraph(entries) => {nodes, edges, stats}
- Add memoization and empty-cases handling (missing collaborators, unknown profiles, etc.)

Commit 5 — React Flow rendering + interactions

- Render nodes/edges with scalable styling (node size, edge thickness)
- Enable drag/pan/zoom
- Node/edge click selection state + focus mode hookup to right panel

Commit 6 — Right panel cards + responsive polish

- Implement Overview / Top3 / Distribution cards
- Mobile behavior (drawer/accordion)
- Loading/skeleton + error states
- QA checklist documented

9. QA CHECKLIST (MUST PASS)

- TS errors: 0
- Works with:
  - no available weeks
  - empty selection
  - entries without collaborators
  - missing user profile name
- Week toggle updates graph + cards correctly and fast (no jank)
- Node dragging works; graph remains usable after many drags
- SNB does not crash if menu_settings row missing for legacy workspace
- Top collaborator clearly larger and highlighted

10. DELIVERABLES

- New route: /works/collaborator-graph
- New menu_key: collaborator-graph integrated with menu_settings
- Seed/migration SQL added
- React Flow collaboration graph + week filter + quantitative cards
- 6 commits with pre-commit triple checks logs

Start implementation now. Do not ask for follow-ups; search the codebase to locate existing week list component and menu_settings usage, then proceed.
