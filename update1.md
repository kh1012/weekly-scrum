-- =========================
-- 1. ENUM 정의
-- =========================
create type if not exists feedback_status as enum (
'open',
'in_progress',
'resolved'
);

-- =========================
-- 2. releases 테이블
-- =========================
create table if not exists releases (
id uuid primary key default gen_random_uuid(),
version text not null,
title text not null,
note text,
released_at timestamptz not null default now(),
created_at timestamptz not null default now()
);

-- =========================
-- 3. feedbacks 테이블
-- =========================
create table if not exists feedbacks (
id uuid primary key default gen_random_uuid(),

author_user_id uuid not null
references auth.users(id) on delete cascade,

title text,
content text not null,

status feedback_status not null default 'open',

resolved_release_id uuid
references releases(id) on delete set null,

created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
resolved_at timestamptz
);

-- =========================
-- 4. updated_at 자동 갱신
-- =========================
create or replace function update_updated_at()
returns trigger as $$
begin
new.updated_at = now();
return new;
end;

$$
language plpgsql;

drop trigger if exists feedbacks_updated_at on feedbacks;

create trigger feedbacks_updated_at
before update on feedbacks
for each row execute function update_updated_at();

-- =========================
-- 5. resolved 상태 규칙 강제
-- =========================
create or replace function enforce_feedback_resolve_rules()
returns trigger as
$$

begin
if new.status = 'resolved' then
if new.resolved_release_id is null then
raise exception 'resolved 상태에서는 resolved_release_id가 필수입니다';
end if;

    if old.status <> 'resolved' then
      new.resolved_at = now();
    end if;

end if;

return new;
end;

$$
language plpgsql;

drop trigger if exists feedbacks_resolve_rules on feedbacks;

create trigger feedbacks_resolve_rules
before update on feedbacks
for each row execute function enforce_feedback_resolve_rules();

-- =========================
-- 6. RLS 활성화
-- =========================
alter table feedbacks enable row level security;

-- =========================
-- 7. member 정책 (본인 글만)
-- =========================
create policy "member_select_own_feedback"
on feedbacks
for select
using (auth.uid() = author_user_id);

create policy "member_insert_feedback"
on feedbacks
for insert
with check (auth.uid() = author_user_id);

create policy "member_update_own_feedback"
on feedbacks
for update
using (auth.uid() = author_user_id)
with check (auth.uid() = author_user_id);

create policy "member_delete_own_feedback"
on feedbacks
for delete
using (auth.uid() = author_user_id);

-- =========================
-- 8. leader / admin 전체 권한
-- =========================
create policy "leader_admin_full_access"
on feedbacks
for all
using (
  exists (
    select 1
    from profiles
    where profiles.id = auth.uid()
      and profiles.role in ('leader', 'admin')
  )
)
with check (
  exists (
    select 1
    from profiles
    where profiles.id = auth.uid()
      and profiles.role in ('leader', 'admin')
  )
);
$$
