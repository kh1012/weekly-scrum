demo, 프로덕션 순으로 비교

1. simple.sql

[
{
"workspace_id": "00000000-0000-0000-0000-000000000002",
"year": 2026,
"week": "W08",
"entry_count": 6,
"author_count": 6
},
{
"workspace_id": "00000000-0000-0000-0000-000000000002",
"year": 2026,
"week": "W07",
"entry_count": 0,
"author_count": 0
},
{
"workspace_id": "00000000-0000-0000-0000-000000000002",
"year": 2026,
"week": "W06",
"entry_count": 6,
"author_count": 6
},
{
"workspace_id": "00000000-0000-0000-0000-000000000002",
"year": 2026,
"week": "W05",
"entry_count": 0,
"author_count": 0
},
{
"workspace_id": "00000000-0000-0000-0000-000000000002",
"year": 2026,
"week": "W04",
"entry_count": 6,
"author_count": 6
},
{
"workspace_id": "00000000-0000-0000-0000-000000000002",
"year": 2026,
"week": "W03",
"entry_count": 0,
"author_count": 0
},
{
"workspace_id": "00000000-0000-0000-0000-000000000002",
"year": 2026,
"week": "W02",
"entry_count": 6,
"author_count": 6
},
{
"workspace_id": "00000000-0000-0000-0000-000000000002",
"year": 2026,
"week": "W01",
"entry_count": 0,
"author_count": 0
},
{
"workspace_id": "00000000-0000-0000-0000-000000000002",
"year": 2025,
"week": "W52",
"entry_count": 6,
"author_count": 6
},
{
"workspace_id": "00000000-0000-0000-0000-000000000002",
"year": 2025,
"week": "W51",
"entry_count": 0,
"author_count": 0
}
]

[
{
"workspace_id": "00000000-0000-0000-0000-000000000001",
"year": 2026,
"week": "W02",
"entry_count": 3,
"author_count": 1
},
{
"workspace_id": "00000000-0000-0000-0000-000000000001",
"year": 2026,
"week": "W01",
"entry_count": 12,
"author_count": 6
},
{
"workspace_id": "00000000-0000-0000-0000-000000000001",
"year": 2025,
"week": "W52",
"entry_count": 32,
"author_count": 13
},
{
"workspace_id": "00000000-0000-0000-0000-000000000001",
"year": 2025,
"week": "W51",
"entry_count": 26,
"author_count": 15
},
{
"workspace_id": "00000000-0000-0000-0000-000000000001",
"year": 2025,
"week": "W50",
"entry_count": 21,
"author_count": 14
},
{
"workspace_id": "00000000-0000-0000-0000-000000000001",
"year": 2025,
"week": "W49",
"entry_count": 26,
"author_count": 13
}
]

2. debug-snapshot-entries.sql
   [
   {
   "workspace_id": "00000000-0000-0000-0000-000000000002",
   "past_week_status": "has_past_week",
   "this_week_status": "has_this_week",
   "count": 42
   }
   ]

[
{
"category": "NULL 및 빈 값 통계",
"workspace_id": "00000000-0000-0000-0000-000000000001",
"total_entries": 120,
"past_week_null": 0,
"this_week_null": 0,
"risks_null": 0,
"collaborators_null": 0,
"past_week_tasks_null": 0,
"this_week_tasks_null": 0
}
]

3. debug-field-names.sql
   Error: Failed to run sql query: ERROR: 42601: syntax error at or near "k" LINE 1: k ^

[
{
"workspace_id": "00000000-0000-0000-0000-000000000001",
"past_week_status": "has_past_week",
"this_week_status": "has_this_week",
"count": 120
}
]
