# Goal

Implement "Custom Flag" feature in /admin/plans/gantt (src/components/plans/gantt-draft/) to show milestone/range events on the timeline header as a separate overlay layer (NOT plan bars).
We DO NOT distinguish release/sprint types. It's just "Flag".

Flag rules:

- Point flag: startDate === endDate → render a vertical line at that date + title near the line
- Range flag: startDate < endDate → render start vertical line + end vertical line + a top block between them with title inside

Also implement lane packing so overlapping flags stack into multiple sub-lanes automatically.

# Existing Structure

src/components/plans/gantt-draft/

- DraftGanttView.tsx (layout)
- GanttHeader.tsx
- DraftTreePanel.tsx
- DraftTimeline.tsx (timeline header + grid)
- DraftBar.tsx (plan bars)
- store.ts (zustand)
- laneLayout.ts (existing plan lane calc)
- types.ts
- commitService.ts / lockService.ts / useLock.ts
- modals + UI components exist

We will add:

- FlagLane.tsx
- FlagBar.tsx
- CreateFlagModal.tsx
- EditFlagModal.tsx
- flagService.ts
- flagLayout.ts (NEW: lane packing utilities)

# DB

Assume table public.gantt_flags already exists:

- id uuid
- workspace_id uuid
- title text
- start_date date
- end_date date
- color text null
- order_index int default 0
- created_by, created_at, updated_at

IMPORTANT:

- "Title-only" flag MUST be stored as start_date = end_date
- end_date is NEVER nullable

# Types (types.ts)

[CODE]
export type ISODate = string; // YYYY-MM-DD

export interface GanttFlag {
id: string;
workspaceId: string;
title: string;
startDate: ISODate;
endDate: ISODate; // start === end => point flag
color?: string | null;
orderIndex: number;
createdAt: string;
updatedAt: string;
createdBy?: string | null;
}

export interface PackedFlagLaneItem {
flagId: string;
laneIndex: number; // 0..N-1
startDate: ISODate;
endDate: ISODate;
startX: number; // px
width: number; // px
isPoint: boolean;
}
[/CODE]

# Store (store.ts) – Flag Slice

Rules:

- Flags follow existing gantt edit/lock rule
- Create/Update/Delete ONLY when isEditing === true AND user role is admin/leader

[CODE]
interface FlagDraft {
start: Date | null;
end: Date | null;
}

interface FlagState {
flags: GanttFlag[];
pendingFlag: FlagDraft;
selectedFlagId: string | null;
isFlagsLoading: boolean;
}

interface FlagActions {
fetchFlags: (workspaceId: string) => Promise<void>;

startPendingFlag: (date: Date) => void;
endPendingFlag: (date: Date) => void;
clearPendingFlag: () => void;

selectFlag: (id: string | null) => void;

createFlag: (payload: {
workspaceId: string;
title: string;
startDate: string;
endDate: string;
}) => Promise<void>;

updateFlag: (
id: string,
updates: Partial<Pick<GanttFlag, 'title' | 'startDate' | 'endDate' | 'orderIndex' | 'color'>>
) => Promise<void>;

deleteFlag: (id: string) => Promise<void>;
}
[/CODE]

Implementation notes:

- fetchFlags: sort by startDate asc → orderIndex asc → title asc
- endPendingFlag: if end < start, swap
- after second double-click, open CreateFlagModal
- selectedFlagId used for keyboard Delete and highlight

# flagService.ts

Implement Supabase CRUD:

- listFlags(workspaceId)
- createFlag(payload)
- updateFlag(id, updates)
- deleteFlag(id)

Map snake_case → camelCase in service layer.

# Lane Packing (flagLayout.ts)

Goal:

- Stack overlapping flags vertically
- Deterministic order
- Simplicity > perfection

Definitions:

- Interval = [startIndex, endIndex] inclusive (day units)
- Overlap if intervals intersect

Algorithm (greedy):

1. Convert flag dates → dayIndex relative to rangeStart
2. Sort flags by:
   - startDate asc
   - endDate asc
   - orderIndex asc
   - id asc
3. Maintain laneEndIndex[] (last occupied endIndex per lane)
4. For each flag:
   - find first lane where laneEndIndex < flag.startIndex
   - if found → use lane
   - else → create new lane
   - update laneEndIndex[lane] = flag.endIndex

Pixel mapping:

- startX = startIndex \* dayWidth
- endX = (endIndex + 1) \* dayWidth
- width = endX - startX
- point flag: width may be 0, UI should still render a clickable hitbox

Expose helper:

[CODE]
export function packFlagsIntoLanes(args: {
flags: GanttFlag[];
rangeStart: Date;
rangeEnd: Date;
dayWidth: number;
}): {
laneCount: number;
items: PackedFlagLaneItem[];
}
[/CODE]

Clamping:

- Clamp startIndex/endIndex to visible range for rendering
- Use clamped indices for lane packing (acceptable tradeoff)

# UI Components

## FlagLane.tsx

- Uses packFlagsIntoLanes (useMemo)
- Height = laneCount \* LANE_HEIGHT (24~28px)
- Renders FlagBar per PackedFlagLaneItem
- Sync horizontal scroll with timeline grid
- Handles double-click empty area for flag creation

## FlagBar.tsx

- Point flag: vertical line + title
- Range flag: start/end lines + top block with title
- Ellipsis for long titles
- Click = select
- Double click = edit
- Selected state = outline or bg highlight

## DraftTimeline.tsx changes

Header order:

1. Month header (38px)
2. Day header (38px)
3. FlagLane

TOTAL_HEADER_HEIGHT = 38 + 38 + FlagLaneHeight

Double-click behavior:

- First double click → startPendingFlag
- Second double click → endPendingFlag + CreateFlagModal

Keyboard:

- Delete key removes selected flag (confirm optional)

## DraftTreePanel.tsx

Add "Flags" section:

- List flags sorted by startDate
- Ellipsis overflow
- Click selects flag and scrolls timeline to its startDate

# Modals

CreateFlagModal:

- Inputs: title
- Show start/end preview
- Save → createFlag(startDate/endDate formatted YYYY-MM-DD)

EditFlagModal:

- Edit title and date range
- Optional delete button

# Acceptance Criteria

- Flags render in header overlay
- Lane packing works for overlapping flags
- Point and range flags both supported
- Edit/Delete gated by role + isEditing
- Tree ↔ timeline selection sync
- No layout shift bugs
- Build passes

# Delivery Plan

1. Types + service + store + read-only FlagLane/FlagBar with packing
2. Create flow (double-click + modal)
3. Edit/Delete + keyboard + tree sync
4. Polish (hitbox, clamp, highlight)
