# Goal

When a user clicks a Custom Flag in the Flag tree panel, show an auto-generated "Release Doc" view.
Spec Ready and Design Ready are NOT manually entered.
They are automatically derived from existing feature plans based on stage completion.

# Core Rule Change (IMPORTANT)

We DO NOT use a separate milestone table for Spec Ready / Design Ready.

Instead:

- Spec Ready = completion date of the feature plan whose stage is '상세 기획'
- Design Ready = completion date of the feature plan whose stage is 'UI 디자인'

These are treated as the single source of truth.

# Definitions

- Plan Type: 'feature'
- Stage:
  - '상세 기획' → Spec Ready source
  - 'UI 디자인' → Design Ready source
- Completion Date:
  - Use plan.end_date (or equivalent finished_at if exists)
  - Only consider plans with progress = 100% OR status = '완료' (depending on schema)

# Existing Context

Route: /admin/plans/gantt
Custom Flags already exist and define a release window via:

- flag.startDate
- flag.endDate

Clicking a flag should open a document-like Release Doc view.

# DB Assumptions

- plans table includes:
  - id
  - workspace_id
  - type ('feature')
  - title
  - project / module / feature (or similar hierarchy)
  - stage (string)
  - start_date
  - end_date
  - progress or status
- plan_assignees exists for planner lookup (optional)

NO additional tables are required.

# Types (types.ts)

[CODE]
export interface ReleaseDocRow {
planId: string;
epic: string; // "프로젝트 > 모듈 > 기능" or fallback title
planner: string; // 기획자 or '-'
specReady: string | 'READY' | '-'; // date preferred, READY if completed but date missing
designReady: string | 'READY' | '-';
}
[/CODE]

# Data Generation Logic (STRICT)

Given a flag with [startDate, endDate]:

## Step 1: Fetch candidate plans

Fetch all feature plans overlapping the release window:

- plan.type = 'feature'
- plan.start_date <= flag.endDate
- plan.end_date >= flag.startDate
- workspace_id matches

## Step 2: Group plans by Epic

Epic key:

- Prefer: project + module + feature
- Else fallback: plan.title

All plans sharing the same epic key belong to one ReleaseDocRow.

## Step 3: Determine Planner

- From plan_assignees:
  - pick assignee with role in ('기획', 'planning', 'pm')
- If multiple, pick earliest assigned or first
- If none, '-'

## Step 4: Compute Spec Ready

For each epic group:

- Find the plan where:
  - stage === '상세 기획'
  - progress === 100 OR status === '완료'
- If found:
  - specReady = plan.end_date (YYYY-MM-DD)
- If stage exists but not completed:
  - specReady = '-'
- If no such stage plan exists:
  - specReady = '-'

## Step 5: Compute Design Ready

For each epic group:

- Find the plan where:
  - stage === 'UI 디자인'
  - progress === 100 OR status === '완료'
- If found:
  - designReady = plan.end_date
- If stage exists but not completed:
  - designReady = '-'
- If no such stage plan exists:
  - designReady = '-'

IMPORTANT:

- Do NOT infer Design Ready from development stages.
- Do NOT invent dates.
- Only completed stage plans produce dates.

# flagDocService.ts (NEW)

Responsible for building the Release Doc rows.

[CODE]
export async function buildReleaseDoc(args: {
workspaceId: string;
flagStart: string; // YYYY-MM-DD
flagEnd: string; // YYYY-MM-DD
}): Promise<{
rows: ReleaseDocRow[];
}>
[/CODE]

Implementation outline:

1. Fetch overlapping feature plans
2. Group by epic key
3. For each group:
   - derive planner
   - derive specReady from '상세 기획' stage completion
   - derive designReady from 'UI 디자인' stage completion
4. Sort rows by epic name ASC

# UI: Release Doc View (FlagDocPanel)

Layout:

- Title: 📍 {flag.title}
- Meta:
  - 디자인 공유: {flag.designShareDate ?? '-'}
  - Start Date: {flag.startDate}
  - End Date: {flag.endDate}

Table columns:

- Epic
- 기획자
- Spec Ready
- Design Ready

Cell rendering rules:

- YYYY-MM-DD → gray date chip
- 'READY' → green READY pill (only if end_date missing but completed; optional)
- '-' → muted dash

# DraftTreePanel Interaction

- Clicking a Flag:
  - selectFlag(flagId)
  - open FlagDocPanel immediately

# DraftGanttView Integration

- FlagDocPanel opens as:
  - right-side drawer OR
  - modal (reuse existing overlay pattern)
- Must not interfere with existing editing/lock logic

# Acceptance Criteria

- No manual input required for Spec Ready / Design Ready
- Values are stable and reproducible from plan data
- Updating plan completion immediately reflects in Release Doc
- Missing stages show '-' without error
- Build passes

# Delivery Plan

1. Implement flagDocService with stage-based computation
2. Build FlagDocPanel UI
3. Wire Flag tree click → doc open
4. Polish rendering (chips, alignment)
