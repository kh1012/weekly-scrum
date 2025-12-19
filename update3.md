각 결과 공유해줄게

(1)
Error: Failed to run sql query: ERROR: 42803: column "t.typname" must appear in the GROUP BY clause or be used in an aggregate function LINE 1: SELECT typname, array_agg(enumlabel) ^

Note: A limit of 100 was applied to your query. If this was the cause of a syntax error, try selecting "No limit" instead and re-run the query.

(2)
[
{
"table_name": "feedbacks"
},
{
"table_name": "releases"
}
]

(3)
feedbacks 테이블 정의
create table public.feedbacks (
id uuid not null default gen_random_uuid (),
workspace_id uuid not null,
author_user_id uuid not null,
title text null,
content text not null,
status public.feedback_status not null default 'open'::feedback_status,
resolved_release_id uuid null,
created_at timestamp with time zone not null default now(),
updated_at timestamp with time zone not null default now(),
resolved_at timestamp with time zone null,
constraint feedbacks_pkey primary key (id),
constraint feedbacks_author_user_id_fkey foreign KEY (author_user_id) references auth.users (id) on delete CASCADE,
constraint feedbacks_resolved_release_id_fkey foreign KEY (resolved_release_id) references releases (id) on delete set null,
constraint feedbacks_workspace_id_fkey foreign KEY (workspace_id) references workspaces (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_feedbacks_workspace on public.feedbacks using btree (workspace_id) TABLESPACE pg_default;

create index IF not exists idx_feedbacks_author on public.feedbacks using btree (author_user_id) TABLESPACE pg_default;

create trigger trg_feedbacks_resolve_rules BEFORE
update on feedbacks for EACH row
execute FUNCTION enforce_feedback_resolve_rules ();

create trigger trg_feedbacks_updated_at BEFORE
update on feedbacks for EACH row
execute FUNCTION update_updated_at ();

releases 테이블 정의
create table public.releases (
id uuid not null default gen_random_uuid (),
version text not null,
title text not null,
note text null,
released_at timestamp with time zone not null default now(),
created_at timestamp with time zone not null default now(),
constraint releases_pkey primary key (id)
) TABLESPACE pg_default;

(4)
[
{
"trigger_name": "trg_feedbacks_resolve_rules",
"event_object_table": "feedbacks"
},
{
"trigger_name": "trg_feedbacks_updated_at",
"event_object_table": "feedbacks"
}
]

(5)
[
{
"tablename": "feedbacks",
"rowsecurity": true
},
{
"tablename": "releases",
"rowsecurity": false
}
]

(6)
[
{
"tablename": "feedbacks",
"policyname": "member_crud_own_feedback",
"cmd": "ALL"
},
{
"tablename": "feedbacks",
"policyname": "leader_admin_full_access",
"cmd": "ALL"
}
]

(7)
[
{
"indexname": "idx_feedbacks_workspace"
},
{
"indexname": "idx_feedbacks_author"
}
]
