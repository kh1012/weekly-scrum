WEEKLY SCRUM — COLLABORATION VISUALIZATION UPGRADE
Cursor v2 Multi-Step Implementation Guide (Stable Markdown-Safe Version)

You are an AI developer working on a Next.js + TypeScript + React + Tailwind project.
Your job is to extend the Weekly Scrum visualization system with new collaboration-based
analytics and visualizations.

Follow these rules:

- Never skip steps
- Each step = PLAN → IMPLEMENT → yarn lint → yarn build → COMMIT
- One commit per step
- Use existing UI components when possible
- Lightweight visualization libraries preferable

---

## STEP 0 — Repository Scan & Planning

Scan the entire repo and identify:

1. Snapshot parser (text → JSON)
2. Snapshot-related types:
   - Snapshot
   - Member
   - Work
   - Detail
   - Collaborator
3. Team visualization pages:
   - /team
   - /overview
   - /stats
   - /snapshots
4. Personal dashboard components:
   - MyDashboardView
   - pages under /my
5. Shared chart components
6. Tailwind config
7. Any loaders, selectors, or helpers for snapshot aggregation

Then write a PLAN comment such as:

// PLAN:
// 1. Add collaboration metric utilities
// 2. Add team visualizations (network graph, bottleneck map, heatmap, matrix)
// 3. Enhance personal dashboard (radar, timeline, orbit)
// 4. Add auto-insight generation
// 5. Update README accordingly

Wait for approval before modifying code.

---

## STEP 1 — Add Collaboration Metric Utilities

Create utils under /lib/collaboration/:

- getPairCountPerMember()
- getWaitingOnOutbound()
- getWaitingOnInbound()
- getCrossDomainCollaboration()
- getCrossModuleCollaboration()
- getCollaborationEdges() // for network graph
- getCollaborationMatrix() // for domain-domain heatmap
- getMemberSummary() // for personal dashboard

Run:

- yarn lint
- yarn build

Commit:
feat: add collaboration metric utilities

---

## STEP 2 — TEAM VIEW: Collaboration Network Graph

Component: /components/visualizations/CollaborationNetworkGraph.tsx

Requirements:

- Nodes = members
- Links = collaborator relations
- pair = blue link
- waiting-on = red link
- Node size = degree (collab count)
- Link width = relation frequency
- Use a lightweight force graph library

Add to team or overview page.

Commit:
feat: add collaboration network graph to team view

---

## STEP 3 — TEAM VIEW: Waiting-On Bottleneck Map

Component: BottleneckMap.tsx

Specs:

- Directed graph A → B (A waits on B)
- Edge weight = count
- Node heat = bottleneck intensity
- Highlight nodes with high inbound waiting-on

Add to team analytics.

Commit:
feat: add waiting-on bottleneck visualization

---

## STEP 4 — TEAM VIEW: Collaboration Load Heatmap

Component: CollaborationLoadHeatmap.tsx

Specs:

- Rows = members
- Columns = relation types (pair, waiting-on)
- Cell value = count
- Tailwind-based color scale
- Sort by total collaboration load

Add to team analytics.

Commit:
feat: add collaboration load heatmap

---

## STEP 5 — TEAM VIEW: Cross-Domain Collaboration Matrix

Component: CrossDomainMatrix.tsx

Specs:

- Rows/Columns = domains
- Cell value = number of relations
- Optional toggle: pair / waiting-on / both

Commit:
feat: add cross-domain collaboration matrix

---

## STEP 6 — PERSONAL VIEW: Collaboration Radar Chart

Component: MyCollaborationRadar.tsx

Axes:

- pair count
- waiting-on outbound
- waiting-on inbound
- cross-domain score
- cross-module score

Add to MyDashboardView.

Commit:
feat: add collaboration radar chart to personal dashboard

---

## STEP 7 — PERSONAL VIEW: Bottleneck Timeline

Component: MyBottleneckTimeline.tsx

Specs:

- Weekly bars showing:
  - outbound waiting-on (I am waiting)
  - inbound waiting-on (others wait for me)
- Show trends and highlight anomalies

Commit:
feat: add personal bottleneck timeline

---

## STEP 8 — PERSONAL VIEW: Collaboration Orbit Map

Component: MyCollaborationOrbit.tsx

Specs:

- Center = logged-in user
- Inner orbit = frequent pair collaborators
- Middle orbit = occasional collaborators
- Outer orbit = waiting-on relations
- Node size = frequency

Commit:
feat: add collaboration orbit visualization

---

## STEP 9 — Personal Auto-Insight Generation

Create /lib/collaboration/insights.ts

Generate insights such as:

- "You are blocking X people this week"
- "Your cross-domain collaboration increased by Y%"
- "You worked closely with A and B"
- "Repeated bottlenecks detected with user C"

Render insights inside MyDashboardView.

Commit:
feat: add auto-generated collaboration insights

---

## STEP 10 — README Update

Document:

- Snapshot v1 format (domain, project, module, topic)
- Collaborators syntax: Name(relation)
- Allowed relation: pair, waiting-on
- How metrics are computed
- List of new visualizations and their purpose

Commit:
docs: update README with collaboration model and visualizations

---

## FINAL ENFORCED RULES

- For every step: PLAN → IMPLEMENT → LINT → BUILD → COMMIT
- Never merge multiple features in a single commit
- Maintain existing UI/UX design patterns
- Keep modules decoupled and typed strictly
- Module/domain list is open-ended; never hardcode fixed lists
- Relation values are limited to: pair | waiting-on

Begin execution at STEP 0.
