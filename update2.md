/\*
CORE PHASE-1 PACK (Safe / Dependency-friendly)

포함:

1. workspace_role enum value 'leader' -> 'manager' (DROP 없이 RENAME VALUE)
2. is_workspace_admin_or_leader() 함수 로직 업데이트 (admin|manager)
3. is_workspace_admin() 함수 추가
4. RLS 정책: 기존 admin/leader 정책들을 admin/manager 기준으로 재생성
5. Admin-only 관리 정책(추가): snapshots + snapshot_entries
6. gantt_flags.links jsonb 컬럼 추가
7. Views: v_flag_plan_summary, v_resource_distribution, v_collab_edges

주의:

- 'leader' 라벨이 사라지므로, RLS/함수/코드에서 'leader' 문자열은 반드시 제거되어야 함.
- v_collab_edges는 snapshot_entries.collaborators가 jsonb 배열이고 item에 userId 키가 있다고 가정.
  \*/

begin;

-- =========================================================
-- 0) 사전 체크 (존재 여부에 따라 안전하게 진행)
-- =========================================================
-- workspace_role enum 존재 확인
do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'workspace_role'
  ) then
    raise exception 'public.workspace_role type not found. Stop.';
  end if;
end $$;

-- =========================================================
-- 1) Enum value rename: leader -> manager (DROP 없이)
-- =========================================================
do $$
begin
-- leader 라벨이 있으면 manager로 rename
if exists (
select 1
from pg_enum e
join pg_type t on t.oid = e.enumtypid
join pg_namespace n on n.oid = t.typnamespace
where n.nspname = 'public'
and t.typname = 'workspace_role'
and e.enumlabel = 'leader'
) then
-- manager가 이미 있으면 충돌. 이 경우는 수동 정리가 필요하니 바로 중단.
if exists (
select 1
from pg_enum e
join pg_type t on t.oid = e.enumtypid
join pg_namespace n on n.oid = t.typnamespace
where n.nspname = 'public'
and t.typname = 'workspace_role'
and e.enumlabel = 'manager'
) then
raise exception 'workspace_role already has both leader and manager. Manual cleanup required.';
end if;

    execute 'alter type public.workspace_role rename value ''leader'' to ''manager''';

end if;

-- manager가 없다면? (기존이 member/admin만 있는 경우 등) => 여기서는 추가하지 않음.
-- 핵심 1차 범위는 "leader -> manager 치환"이므로, manager가 없어서 필요하면 add value를 선택적으로 수행.
if not exists (
select 1
from pg_enum e
join pg_type t on t.oid = e.enumtypid
join pg_namespace n on n.oid = t.typnamespace
where n.nspname = 'public'
and t.typname = 'workspace_role'
and e.enumlabel = 'manager'
) then
-- manager 라벨이 없으면 추가 (leader가 없던 스키마여도 manager 역할은 필요하니까)
execute 'alter type public.workspace_role add value if not exists ''manager''';
end if;
end $$;

-- =========================================================
-- 2) Helper functions 업데이트/추가
-- =========================================================
-- 기존 이름 유지(코드 영향 최소화): is_workspace_admin_or_leader = admin|manager
create or replace function public.is_workspace_admin_or_leader(p_workspace_id uuid)
returns boolean
language plpgsql
security definer
as $$
begin
return exists (
select 1
from public.workspace_members wm
where wm.workspace_id = p_workspace_id
and wm.user_id = auth.uid()
and wm.role::text in ('admin', 'manager')
);
end;

$$
;

create or replace function public.is_workspace_admin_or_leader(p_workspace_id uuid, p_user_id uuid)
returns boolean
language plpgsql
security definer
as
$$

begin
return exists (
select 1
from public.workspace_members wm
where wm.workspace_id = p_workspace_id
and wm.user_id = p_user_id
and wm.role::text in ('admin', 'manager')
);
end;

$$
;

-- admin-only helper
create or replace function public.is_workspace_admin(
  p_workspace_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
security definer
as
$$

select exists (
select 1
from public.workspace_members wm
where wm.workspace_id = p_workspace_id
and wm.user_id = p_user_id
and wm.role::text = 'admin'
);

$$
;

-- =========================================================
-- 3) RLS 정책: leader 문자열이 들어간 정책은 반드시 교체
--    (이름이 다를 수 있어서, 핵심 정책 3종은 drop-if-exists로 처리)
-- =========================================================
drop policy if exists feedbacks_write_admin_or_leader on public.feedbacks;
drop policy if exists workspace_members_write_admin_or_leader on public.workspace_members;
drop policy if exists gantt_flags_write_admin_or_leader on public.gantt_flags;

-- feedbacks (테이블이 있으면 생성)
do
$$

begin
if exists (
select 1 from pg_class c
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname='feedbacks'
) then
create policy feedbacks_write_admin_or_leader
on public.feedbacks
as permissive
for all
to authenticated
using (
exists (
select 1
from public.workspace_members wm
where wm.user_id = auth.uid()
and wm.workspace_id = feedbacks.workspace_id
and wm.role::text in ('manager', 'admin')
)
)
with check (
exists (
select 1
from public.workspace_members wm
where wm.user_id = auth.uid()
and wm.workspace_id = feedbacks.workspace_id
and wm.role::text in ('manager', 'admin')
)
);
end if;
end $$;

-- workspace_members write (관리/수정 권한)
create policy workspace_members_write_admin_or_leader
on public.workspace_members
as permissive
for all
to authenticated
using (
exists (
select 1
from public.workspace_members wm
where wm.user_id = auth.uid()
and wm.role::text in ('manager', 'admin')
)
)
with check (
exists (
select 1
from public.workspace_members wm
where wm.user_id = auth.uid()
and wm.role::text in ('manager', 'admin')
)
);

-- gantt_flags write (관리/수정 권한)
do $$
begin
  if exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname='gantt_flags'
  ) then
    create policy gantt_flags_write_admin_or_leader
    on public.gantt_flags
    as permissive
    for all
    to authenticated
    using (
      workspace_id in (
        select wm.workspace_id
        from public.workspace_members wm
        where wm.user_id = auth.uid()
          and wm.role::text in ('admin', 'manager')
      )
    )
    with check (
      workspace_id in (
        select wm.workspace_id
        from public.workspace_members wm
        where wm.user_id = auth.uid()
          and wm.role::text in ('admin', 'manager')
      )
    );
  end if;
end $$;

-- =========================================================
-- 4) Admin-only 스냅샷 전체 관리 정책 (Additive)
-- \* 기존 정책을 "삭제"하지 않고, admin에만 추가 권한을 더 부여
-- =========================================================
do $$
begin
if exists (
select 1 from pg_class c
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname='snapshots'
) then
drop policy if exists snapshots_admin_manage on public.snapshots;

    create policy snapshots_admin_manage
    on public.snapshots
    for all
    to authenticated
    using (public.is_workspace_admin(workspace_id, auth.uid()))
    with check (public.is_workspace_admin(workspace_id, auth.uid()));

end if;
end $$;

do $$
begin
if exists (
select 1 from pg_class c
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname='snapshot_entries'
) then
drop policy if exists entries_admin_manage on public.snapshot_entries;

    create policy entries_admin_manage
    on public.snapshot_entries
    for all
    to authenticated
    using (public.is_workspace_admin(workspace_id, auth.uid()))
    with check (public.is_workspace_admin(workspace_id, auth.uid()));

end if;
end $$;

-- =========================================================
-- 5) gantt_flags.links 추가
-- =========================================================
do $$
begin
if exists (
select 1 from pg_class c
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname='gantt_flags'
) then
alter table public.gantt_flags
add column if not exists links jsonb not null default '[]'::jsonb;

    comment on column public.gantt_flags.links
    is '관련 링크 목록. 예: [{"url":"https://...","label":"Spec"}]';

end if;
end $$;

-- =========================================================
-- 6) Views: 인사이트(1차)
-- =========================================================
-- 6-1) Flag 요약
do $$
begin
  if exists (select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='gantt_flags')
     and exists (select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='plans')
  then
    create or replace view public.v_flag_plan_summary as
    select
      gf.workspace_id,
      gf.id as flag_id,
      gf.title as flag_title,
      gf.start_date as flag_start_date,
      gf.end_date as flag_end_date,
      (gf.end_date - gf.start_date + 1) as flag_days,
      count(p.id) as plan_count,
      min(p.start_date) as min_plan_start,
      max(p.end_date) as max_plan_end
    from public.gantt_flags gf
    left join public.plans p
      on p.workspace_id = gf.workspace_id
     and p.start_date is not null
     and p.end_date is not null
     and gf.start_date is not null
     and gf.end_date is not null
     and p.start_date <= gf.end_date
     and p.end_date >= gf.start_date
    group by gf.workspace_id, gf.id;
  end if;
end $$;

-- 6-2) 리소스 분배(1차: 할당 개수 기반)
do $$
begin
  if exists (select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='plan_assignees')
     and exists (select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='profiles')
  then
    create or replace view public.v_resource_distribution as
    select
      pa.workspace_id,
      pa.user_id,
      pr.display_name,
      count(distinct pa.plan_id) as assigned_plan_count
    from public.plan_assignees pa
    join public.profiles pr on pr.user_id = pa.user_id
    group by pa.workspace_id, pa.user_id, pr.display_name;
  end if;
end $$;

-- 6-3) 콜라보 엣지(1차: 테이블로 보기)
-- collaborators json 예시: [{"userId":"<uuid>","displayName":"..."}]
do $$
begin
  if exists (select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='snapshot_entries') then
    create or replace view public.v_collab_edges as
    select
      se.workspace_id,
      se.author_id as from_user_id,
      (c->>'userId')::uuid as to_user_id,
      count(*) as collaboration_count
    from public.snapshot_entries se
    cross join lateral jsonb_array_elements(se.collaborators) as c
    where se.author_id is not null
      and se.collaborators is not null
      and jsonb_typeof(se.collaborators) = 'array'
      and (c->>'userId') is not null
    group by se.workspace_id, se.author_id, (c->>'userId')::uuid;
  end if;
end $$;

commit;

-- =========================================================
-- POST CHECKS (실행 후 수동 확인 권장)
-- =========================================================
-- 1) enum 라벨 확인
-- select e.enumlabel
-- from pg_enum e
-- join pg_type t on t.oid=e.enumtypid
-- join pg_namespace n on n.oid=t.typnamespace
-- where n.nspname='public' and t.typname='workspace_role'
-- order by e.enumsortorder;

-- 2) workspace_members.role 분포 확인
-- select role::text, count(\*) from public.workspace_members group by 1 order by 1;

-- 3) gantt_flags.links 존재 확인
-- select column_name, data_type, is_nullable, column_default
-- from information_schema.columns
-- where table_schema='public' and table_name='gantt_flags' and column_name='links';

-- 4) views 생성 확인
-- select table_name from information_schema.views
-- where table_schema='public'
-- and table_name in ('v_flag_plan_summary','v_resource_distribution','v_collab_edges');
