


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."assignee_role" AS ENUM (
    'planner',
    'fe',
    'be',
    'designer',
    'qa'
);


ALTER TYPE "public"."assignee_role" OWNER TO "postgres";


CREATE TYPE "public"."feedback_status" AS ENUM (
    'open',
    'in_progress',
    'resolved'
);


ALTER TYPE "public"."feedback_status" OWNER TO "postgres";


CREATE TYPE "public"."plan_type" AS ENUM (
    'feature',
    'sprint',
    'release'
);


ALTER TYPE "public"."plan_type" OWNER TO "postgres";


CREATE TYPE "public"."snapshot_workload_level" AS ENUM (
    'light',
    'normal',
    'burden'
);


ALTER TYPE "public"."snapshot_workload_level" OWNER TO "postgres";


CREATE TYPE "public"."workspace_role" AS ENUM (
    'member',
    'leader',
    'admin'
);


ALTER TYPE "public"."workspace_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."dev_acquire_workspace_lock_as"("p_workspace_id" "uuid", "p_user_id" "uuid", "p_display_name" "text" DEFAULT NULL::"text", "p_ttl_seconds" integer DEFAULT 60) RETURNS TABLE("ok" boolean, "holder_user_id" "uuid", "holder_display_name" "text", "expires_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_now timestamptz := now();
  v_ttl int := greatest(p_ttl_seconds, 15);
begin
  delete from public.workspace_edit_locks l
  where l.workspace_id = p_workspace_id
    and l.expires_at <= v_now;

  if exists (select 1 from public.workspace_edit_locks l where l.workspace_id = p_workspace_id) then
    return query
    select false, l.holder_user_id, l.holder_display_name, l.expires_at
    from public.workspace_edit_locks l
    where l.workspace_id = p_workspace_id;
    return;
  end if;

  insert into public.workspace_edit_locks(
    workspace_id, holder_user_id, holder_display_name, acquired_at, heartbeat_at, expires_at
  )
  values (
    p_workspace_id, p_user_id, p_display_name, v_now, v_now, v_now + make_interval(secs => v_ttl)
  );

  return query
  select true, p_user_id, p_display_name, (v_now + make_interval(secs => v_ttl));
end;
$$;


ALTER FUNCTION "public"."dev_acquire_workspace_lock_as"("p_workspace_id" "uuid", "p_user_id" "uuid", "p_display_name" "text", "p_ttl_seconds" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_feedback_resolve_rules"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- resolved 상태로 변경 시 필수 필드 검증
  IF NEW.status = 'resolved' THEN
    -- resolution_note 필수
    IF NEW.resolution_note IS NULL OR NEW.resolution_note = '' THEN
      RAISE EXCEPTION 'resolution_note is required when status is resolved';
    END IF;
    
    -- resolved_by_user_id 필수
    IF NEW.resolved_by_user_id IS NULL THEN
      RAISE EXCEPTION 'resolved_by_user_id is required when status is resolved';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."enforce_feedback_resolve_rules"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_snapshot_week"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_week_id uuid;
begin
  -- week_start_date 필수
  if new.week_start_date is null then
    raise exception 'week_start_date is required';
  end if;

  -- week_end_date 없으면 start_date로 기본
  if new.week_end_date is null then
    new.week_end_date := new.week_start_date;
  end if;

  -- year/week 없으면 start_date 기준으로 채워넣기(ISO week)
  -- 이미 UI/서버에서 넣고 있다면 그냥 유지됨
  if new.year is null then
    new.year := extract(isoyear from new.week_start_date)::int;
  end if;

  if new.week is null then
    new.week := 'W' || lpad(extract(week from new.week_start_date)::int::text, 2, '0');
  end if;

  -- snapshot_weeks upsert (중복 방지는 unique(workspace_id, week_start_date)가 보장)
  insert into public.snapshot_weeks (workspace_id, year, week, week_start_date, week_end_date)
  values (new.workspace_id, new.year, new.week, new.week_start_date, new.week_end_date)
  on conflict (workspace_id, week_start_date)
  do update set
    -- year/week/week_end_date는 "더 신뢰할 값"으로 맞추고 싶으면 여기서 정책을 정해라.
    -- 여기선 가장 최근 입력값으로 덮어씀(필요하면 LEAST/GREATEST로 보수적 병합도 가능)
    year = excluded.year,
    week = excluded.week,
    week_end_date = excluded.week_end_date
  returning id into v_week_id;

  new.week_id := v_week_id;
  return new;
end;
$$;


ALTER FUNCTION "public"."ensure_snapshot_week"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_workspace_lock"("p_workspace_id" "uuid") RETURNS TABLE("locked" boolean, "holder_user_id" "uuid", "holder_display_name" "text", "expires_at" timestamp with time zone)
    LANGUAGE "sql" STABLE
    AS $$
  select
    (l.workspace_id is not null) as locked,
    l.holder_user_id,
    l.holder_display_name,
    l.expires_at
  from public.workspace_edit_locks l
  where l.workspace_id = p_workspace_id
    and l.expires_at > now();
$$;


ALTER FUNCTION "public"."get_workspace_lock"("p_workspace_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."heartbeat_workspace_lock"("p_workspace_id" "uuid", "p_ttl_seconds" integer DEFAULT 60) RETURNS TABLE("ok" boolean, "holder_user_id" "uuid", "holder_display_name" "text", "expires_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_now timestamptz := now();
  v_uid uuid := auth.uid();
  v_ttl int := greatest(p_ttl_seconds, 15);
begin
  if v_uid is null then
    raise exception 'Not authenticated: auth.uid() is null. Call from authenticated client session.';
  end if;

  delete from public.workspace_edit_locks l
  where l.workspace_id = p_workspace_id
    and l.expires_at <= v_now;

  update public.workspace_edit_locks l
  set heartbeat_at = v_now,
      expires_at = v_now + make_interval(secs => v_ttl)
  where l.workspace_id = p_workspace_id
    and l.holder_user_id = v_uid;

  if found then
    return query
    select true, l.holder_user_id, l.holder_display_name, l.expires_at
    from public.workspace_edit_locks l
    where l.workspace_id = p_workspace_id;
    return;
  end if;

  return query
  select false, l.holder_user_id, l.holder_display_name, l.expires_at
  from public.workspace_edit_locks l
  where l.workspace_id = p_workspace_id;
end;
$$;


ALTER FUNCTION "public"."heartbeat_workspace_lock"("p_workspace_id" "uuid", "p_ttl_seconds" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_workspace_admin_or_leader"("p_workspace_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = auth.uid()
      and wm.role in ('admin','leader')
  );
$$;


ALTER FUNCTION "public"."is_workspace_admin_or_leader"("p_workspace_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_workspace_admin_or_leader"("p_workspace_id" "uuid", "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = p_user_id
      and wm.role in ('admin','leader')
  );
$$;


ALTER FUNCTION "public"."is_workspace_admin_or_leader"("p_workspace_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_workspace_member"("p_workspace_id" "uuid", "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = p_user_id
  );
$$;


ALTER FUNCTION "public"."is_workspace_member"("p_workspace_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."link_legacy_authors"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  -- snapshot_entries 연결 + 정리
  update public.snapshot_entries se
  set
    author_id = new.user_id,
    author_display_name = null
  where se.author_id is null
    and se.author_display_name = new.display_name;

  -- snapshots 연결 + 정리
  update public.snapshots s
  set
    author_id = new.user_id,
    author_display_name = null
  where s.author_id is null
    and s.author_display_name = new.display_name;

  return new;
end;
$$;


ALTER FUNCTION "public"."link_legacy_authors"() OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_plans_with_assignees" AS
SELECT
    NULL::"uuid" AS "id",
    NULL::"uuid" AS "workspace_id",
    NULL::"public"."plan_type" AS "type",
    NULL::"text" AS "domain",
    NULL::"text" AS "project",
    NULL::"text" AS "module",
    NULL::"text" AS "feature",
    NULL::"text" AS "title",
    NULL::"text" AS "stage",
    NULL::"text" AS "status",
    NULL::"date" AS "start_date",
    NULL::"date" AS "end_date",
    NULL::"uuid" AS "created_by",
    NULL::timestamp with time zone AS "created_at",
    NULL::"uuid" AS "updated_by",
    NULL::timestamp with time zone AS "updated_at",
    NULL::"text" AS "client_uid",
    NULL::"jsonb" AS "assignees";


ALTER VIEW "public"."v_plans_with_assignees" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."list_plans"("p_workspace_id" "uuid", "p_q" "text" DEFAULT NULL::"text", "p_project" "text" DEFAULT NULL::"text", "p_module" "text" DEFAULT NULL::"text", "p_feature" "text" DEFAULT NULL::"text", "p_stage" "text" DEFAULT NULL::"text", "p_status" "text" DEFAULT NULL::"text", "p_type" "public"."plan_type" DEFAULT NULL::"public"."plan_type", "p_from" "date" DEFAULT NULL::"date", "p_to" "date" DEFAULT NULL::"date", "p_assignee_user_id" "uuid" DEFAULT NULL::"uuid", "p_limit" integer DEFAULT 200, "p_offset" integer DEFAULT 0) RETURNS SETOF "public"."v_plans_with_assignees"
    LANGUAGE "sql" STABLE
    AS $$
  select v.*
  from public.v_plans_with_assignees v
  where v.workspace_id = p_workspace_id
    and (p_type is null or v.type = p_type)
    and (p_project is null or v.project = p_project)
    and (p_module is null or v.module = p_module)
    and (p_feature is null or v.feature = p_feature)
    and (p_stage is null or v.stage = p_stage)
    and (p_status is null or v.status = p_status)
    and (p_q is null or v.title ilike ('%' || p_q || '%'))
    and (
      (p_from is null and p_to is null)
      or (
        coalesce(v.end_date, v.start_date) >= coalesce(p_from, v.start_date)
        and coalesce(v.start_date, v.end_date) <= coalesce(p_to, v.end_date)
      )
    )
    and (
      p_assignee_user_id is null
      or exists (
        select 1
        from public.plan_assignees pa
        where pa.plan_id = v.id
          and pa.workspace_id = v.workspace_id
          and pa.user_id = p_assignee_user_id
      )
    )
  order by v.updated_at desc
  limit greatest(1, least(p_limit, 500))
  offset greatest(p_offset, 0);
$$;


ALTER FUNCTION "public"."list_plans"("p_workspace_id" "uuid", "p_q" "text", "p_project" "text", "p_module" "text", "p_feature" "text", "p_stage" "text", "p_status" "text", "p_type" "public"."plan_type", "p_from" "date", "p_to" "date", "p_assignee_user_id" "uuid", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."release_workspace_lock"("p_workspace_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_uid uuid := auth.uid();
begin
  delete from public.workspace_edit_locks l
  where l.workspace_id = p_workspace_id
    and l.holder_user_id = v_uid;

  return true;
end;
$$;


ALTER FUNCTION "public"."release_workspace_lock"("p_workspace_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at_plan_assignees"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at_plan_assignees"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_workload_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF (NEW.workload_level IS DISTINCT FROM OLD.workload_level)
     OR (NEW.workload_note  IS DISTINCT FROM OLD.workload_note) THEN
    NEW.workload_updated_at := now();
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_workload_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_plan_assignee_workspace_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_workspace_id uuid;
begin
  select p.workspace_id into v_workspace_id
  from public.plans p
  where p.id = new.plan_id;

  if v_workspace_id is null then
    raise exception 'Plan not found: %', new.plan_id;
  end if;

  new.workspace_id := v_workspace_id;
  return new;
end;
$$;


ALTER FUNCTION "public"."sync_plan_assignee_workspace_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."try_acquire_workspace_lock"("p_workspace_id" "uuid", "p_ttl_seconds" integer DEFAULT 60) RETURNS TABLE("ok" boolean, "holder_user_id" "uuid", "holder_display_name" "text", "expires_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_now timestamptz := now();
  v_uid uuid := auth.uid();
  v_name text;
  v_ttl int := greatest(p_ttl_seconds, 15);
begin
  if v_uid is null then
    raise exception 'Not authenticated: auth.uid() is null. Call from authenticated client session.';
  end if;

  select pr.display_name into v_name
  from public.profiles pr
  where pr.user_id = v_uid;

  delete from public.workspace_edit_locks l
  where l.workspace_id = p_workspace_id
    and l.expires_at <= v_now;

  if exists (select 1 from public.workspace_edit_locks l where l.workspace_id = p_workspace_id) then
    return query
    select false, l.holder_user_id, l.holder_display_name, l.expires_at
    from public.workspace_edit_locks l
    where l.workspace_id = p_workspace_id;
    return;
  end if;

  insert into public.workspace_edit_locks(
    workspace_id, holder_user_id, holder_display_name, acquired_at, heartbeat_at, expires_at
  )
  values (
    p_workspace_id, v_uid, v_name, v_now, v_now, v_now + make_interval(secs => v_ttl)
  );

  return query
  select true, v_uid, v_name, (v_now + make_interval(secs => v_ttl));
end;
$$;


ALTER FUNCTION "public"."try_acquire_workspace_lock"("p_workspace_id" "uuid", "p_ttl_seconds" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_feature_plans_bulk"("p_payload" "jsonb") RETURNS TABLE("id" "uuid", "client_uid" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_workspace_id uuid;
begin
  v_workspace_id := (p_payload->>'workspace_id')::uuid;

  -- 4-1) 삭제 처리 먼저 (deleted=true, clientUid 필수)
  delete from public.plans p
  using (
    select (x->>'clientUid')::text as client_uid
    from jsonb_array_elements(coalesce(p_payload->'plans','[]'::jsonb)) as x
    where coalesce((x->>'deleted')::boolean, false) = true
      and nullif(x->>'clientUid','') is not null
  ) d
  where p.workspace_id = v_workspace_id
    and p.client_uid = d.client_uid
    and p.type = 'feature'::public.plan_type;

  -- 4-2) upsert 대상(삭제 제외)
  return query
  with input as (
    select
      (x->>'clientUid')::text as client_uid,
      nullif(x->>'project','') as project,
      nullif(x->>'module','') as module,
      nullif(x->>'feature','') as feature,
      (x->>'title')::text as title,
      nullif(x->>'stage','') as stage,
      coalesce(nullif(x->>'status',''), '진행중') as status,
      nullif(x->>'start_date','')::date as start_date,
      nullif(x->>'end_date','')::date as end_date,
      coalesce(x->'assignees','[]'::jsonb) as assignees
    from jsonb_array_elements(coalesce(p_payload->'plans','[]'::jsonb)) as x
    where coalesce((x->>'deleted')::boolean, false) = false
      and nullif(x->>'clientUid','') is not null
  ),
  upserted as (
    insert into public.plans (
      workspace_id, type,
      project, module, feature,
      title, stage, status, start_date, end_date,
      client_uid,
      created_by, updated_by
    )
    select
      v_workspace_id,
      'feature'::public.plan_type,
      i.project, i.module, i.feature,
      i.title, i.stage, i.status, i.start_date, i.end_date,
      i.client_uid,
      auth.uid(), auth.uid()
    from input i
    on conflict (workspace_id, client_uid)
    do update set
      project = excluded.project,
      module = excluded.module,
      feature = excluded.feature,
      title = excluded.title,
      stage = excluded.stage,
      status = excluded.status,
      start_date = excluded.start_date,
      end_date = excluded.end_date,
      updated_by = auth.uid()
    returning id, client_uid
  )
  select u.id, u.client_uid
  from upserted u;

  -- 4-3) assignees 전체 교체 (삭제 제외된 clientUid들)
  delete from public.plan_assignees pa
  using public.plans p
  where p.workspace_id = v_workspace_id
    and p.client_uid is not null
    and pa.plan_id = p.id
    and pa.workspace_id = v_workspace_id
    and p.client_uid in (
      select (x->>'clientUid')::text
      from jsonb_array_elements(coalesce(p_payload->'plans','[]'::jsonb)) as x
      where coalesce((x->>'deleted')::boolean, false) = false
        and nullif(x->>'clientUid','') is not null
    );

  insert into public.plan_assignees (plan_id, workspace_id, user_id, role)
  select
    p.id,
    v_workspace_id,
    (a->>'userId')::uuid,
    (a->>'role')::public.assignee_role
  from (
    select
      (x->>'clientUid')::text as client_uid,
      coalesce(x->'assignees','[]'::jsonb) as assignees
    from jsonb_array_elements(coalesce(p_payload->'plans','[]'::jsonb)) as x
    where coalesce((x->>'deleted')::boolean, false) = false
      and nullif(x->>'clientUid','') is not null
  ) i
  join public.plans p
    on p.workspace_id = v_workspace_id
   and p.client_uid = i.client_uid
  cross join jsonb_array_elements(i.assignees) as a;

end;
$$;


ALTER FUNCTION "public"."upsert_feature_plans_bulk"("p_payload" "jsonb") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."feedbacks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "author_user_id" "uuid" NOT NULL,
    "title" "text",
    "content" "text" NOT NULL,
    "status" "public"."feedback_status" DEFAULT 'open'::"public"."feedback_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "resolution_note" "text",
    "resolved_by_user_id" "uuid"
);


ALTER TABLE "public"."feedbacks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gantt_flags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "color" "text",
    "order_index" integer DEFAULT 0 NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "lane_hint" integer,
    CONSTRAINT "gantt_flags_valid_range" CHECK (("start_date" <= "end_date"))
);


ALTER TABLE "public"."gantt_flags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."plan_assignees" (
    "plan_id" "uuid" NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."assignee_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."plan_assignees" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."plans" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "type" "public"."plan_type" DEFAULT 'feature'::"public"."plan_type" NOT NULL,
    "domain" "text",
    "project" "text",
    "module" "text",
    "feature" "text",
    "title" "text" NOT NULL,
    "stage" "text",
    "status" "text" DEFAULT '진행중'::"text" NOT NULL,
    "start_date" "date",
    "end_date" "date",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "uuid" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "client_uid" "text",
    "order_index" integer DEFAULT 0,
    "description" "text",
    "links" "jsonb" DEFAULT '[]'::"jsonb",
    CONSTRAINT "plans_date_range_check" CHECK ((("start_date" IS NULL) OR ("end_date" IS NULL) OR ("start_date" <= "end_date"))),
    CONSTRAINT "plans_feature_keys_required" CHECK ((("type" <> 'feature'::"public"."plan_type") OR (("project" IS NOT NULL) AND ("module" IS NOT NULL) AND ("feature" IS NOT NULL)))),
    CONSTRAINT "plans_stage_required_for_feature" CHECK ((("type" <> 'feature'::"public"."plan_type") OR (("stage" IS NOT NULL) AND ("stage" <> ''::"text"))))
);


ALTER TABLE "public"."plans" OWNER TO "postgres";


COMMENT ON COLUMN "public"."plans"."description" IS '계획에 대한 상세 설명 (선택사항)';



COMMENT ON COLUMN "public"."plans"."links" IS '관련 링크 목록 (선택사항). 형식: [{"url": "...", "label": "..."}]';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "user_id" "uuid" NOT NULL,
    "display_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."releases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "version" "text" NOT NULL,
    "title" "text" NOT NULL,
    "note" "text",
    "released_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."releases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."snapshot_entries" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "snapshot_id" "uuid" NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "author_id" "uuid",
    "domain" "text" NOT NULL,
    "project" "text" NOT NULL,
    "module" "text" NOT NULL,
    "feature" "text" NOT NULL,
    "past_week" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "this_week" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "risk_level" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" DEFAULT ''::"text" NOT NULL,
    "risks" "jsonb" DEFAULT '[]'::"jsonb",
    "collaborators" "jsonb" DEFAULT '[]'::"jsonb",
    "author_display_name" "text"
);


ALTER TABLE "public"."snapshot_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."snapshot_meta_options" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "category" "text" NOT NULL,
    "value" "text" NOT NULL,
    "label" "text",
    "description" "text",
    "order_index" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."snapshot_meta_options" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."snapshot_weeks" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "year" integer NOT NULL,
    "week" "text" NOT NULL,
    "week_start_date" "date" NOT NULL,
    "week_end_date" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "snapshot_weeks_date_check" CHECK (("week_start_date" <= "week_end_date"))
);


ALTER TABLE "public"."snapshot_weeks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."snapshots" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "author_id" "uuid",
    "week_start_date" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "year" integer,
    "week" "text",
    "week_end_date" "date",
    "author_display_name" "text",
    "week_id" "uuid",
    "workload_level" "public"."snapshot_workload_level",
    "workload_note" "text",
    "workload_updated_at" timestamp with time zone
);


ALTER TABLE "public"."snapshots" OWNER TO "postgres";


COMMENT ON COLUMN "public"."snapshots"."workload_level" IS '이번 주 작업 부담 수준 (light: 여유, normal: 적정, burden: 부담)';



COMMENT ON COLUMN "public"."snapshots"."workload_note" IS '작업 부담 관련 한 줄 메모 (선택 입력)';



COMMENT ON COLUMN "public"."snapshots"."workload_updated_at" IS 'workload 값 변경 시점';



CREATE TABLE IF NOT EXISTS "public"."workspace_edit_locks" (
    "workspace_id" "uuid" NOT NULL,
    "holder_user_id" "uuid" NOT NULL,
    "holder_display_name" "text",
    "acquired_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "heartbeat_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone NOT NULL
);


ALTER TABLE "public"."workspace_edit_locks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workspace_members" (
    "workspace_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."workspace_role" DEFAULT 'member'::"public"."workspace_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."workspace_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workspaces" (
    "id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."workspaces" OWNER TO "postgres";


ALTER TABLE ONLY "public"."feedbacks"
    ADD CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gantt_flags"
    ADD CONSTRAINT "gantt_flags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."plan_assignees"
    ADD CONSTRAINT "plan_assignees_pkey" PRIMARY KEY ("plan_id", "user_id", "role");



ALTER TABLE ONLY "public"."plans"
    ADD CONSTRAINT "plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."releases"
    ADD CONSTRAINT "releases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."snapshot_entries"
    ADD CONSTRAINT "snapshot_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."snapshot_meta_options"
    ADD CONSTRAINT "snapshot_meta_options_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."snapshot_meta_options"
    ADD CONSTRAINT "snapshot_meta_unique" UNIQUE ("workspace_id", "category", "value");



ALTER TABLE ONLY "public"."snapshot_weeks"
    ADD CONSTRAINT "snapshot_weeks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."snapshot_weeks"
    ADD CONSTRAINT "snapshot_weeks_unique" UNIQUE ("workspace_id", "week_start_date");



ALTER TABLE ONLY "public"."snapshots"
    ADD CONSTRAINT "snapshots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workspace_edit_locks"
    ADD CONSTRAINT "workspace_edit_locks_pkey" PRIMARY KEY ("workspace_id");



ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("workspace_id", "user_id");



ALTER TABLE ONLY "public"."workspaces"
    ADD CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_entries_snapshot" ON "public"."snapshot_entries" USING "btree" ("snapshot_id");



CREATE INDEX "idx_feedbacks_author" ON "public"."feedbacks" USING "btree" ("author_user_id");



CREATE INDEX "idx_feedbacks_created_at" ON "public"."feedbacks" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_feedbacks_status" ON "public"."feedbacks" USING "btree" ("status");



CREATE INDEX "idx_feedbacks_workspace" ON "public"."feedbacks" USING "btree" ("workspace_id");



CREATE INDEX "idx_gantt_flags_workspace" ON "public"."gantt_flags" USING "btree" ("workspace_id");



CREATE INDEX "idx_gantt_flags_workspace_dates" ON "public"."gantt_flags" USING "btree" ("workspace_id", "start_date", "end_date");



CREATE INDEX "idx_gantt_flags_workspace_order" ON "public"."gantt_flags" USING "btree" ("workspace_id", "order_index");



CREATE INDEX "idx_plan_assignees_plan" ON "public"."plan_assignees" USING "btree" ("plan_id");



CREATE INDEX "idx_plan_assignees_role" ON "public"."plan_assignees" USING "btree" ("role");



CREATE INDEX "idx_plan_assignees_user" ON "public"."plan_assignees" USING "btree" ("user_id");



CREATE INDEX "idx_plan_assignees_workspace" ON "public"."plan_assignees" USING "btree" ("workspace_id");



CREATE INDEX "idx_plans_define" ON "public"."plans" USING "btree" ("workspace_id", "domain", "project", "module");



CREATE INDEX "idx_plans_order_index" ON "public"."plans" USING "btree" ("workspace_id", "order_index");



CREATE INDEX "idx_plans_title_trgm" ON "public"."plans" USING "gin" ("title" "public"."gin_trgm_ops");



CREATE INDEX "idx_plans_workspace_dates" ON "public"."plans" USING "btree" ("workspace_id", "start_date", "end_date");



CREATE INDEX "idx_plans_workspace_stage_status" ON "public"."plans" USING "btree" ("workspace_id", "stage", "status");



CREATE INDEX "idx_plans_workspace_updated" ON "public"."plans" USING "btree" ("workspace_id", "updated_at" DESC);



CREATE INDEX "idx_profiles_display_name" ON "public"."profiles" USING "btree" ("display_name");



CREATE INDEX "idx_profiles_email" ON "public"."profiles" USING "btree" ("email");



CREATE INDEX "idx_snapshot_weeks_workspace_start" ON "public"."snapshot_weeks" USING "btree" ("workspace_id", "week_start_date" DESC);



CREATE INDEX "idx_snapshot_weeks_year_week" ON "public"."snapshot_weeks" USING "btree" ("year", "week");



CREATE INDEX "idx_snapshots_week_id" ON "public"."snapshots" USING "btree" ("week_id");



CREATE INDEX "idx_snapshots_week_start_date" ON "public"."snapshots" USING "btree" ("week_start_date");



CREATE INDEX "idx_snapshots_workspace_week" ON "public"."snapshots" USING "btree" ("workspace_id", "week_start_date");



CREATE INDEX "idx_snapshots_year_week" ON "public"."snapshots" USING "btree" ("year", "week");



CREATE INDEX "idx_workspace_edit_locks_expires" ON "public"."workspace_edit_locks" USING "btree" ("expires_at");



CREATE INDEX "idx_workspace_members_user" ON "public"."workspace_members" USING "btree" ("user_id");



CREATE INDEX "idx_workspace_members_workspace_role" ON "public"."workspace_members" USING "btree" ("workspace_id", "role");



CREATE UNIQUE INDEX "ux_plans_workspace_client_uid" ON "public"."plans" USING "btree" ("workspace_id", "client_uid") WHERE ("client_uid" IS NOT NULL);



CREATE OR REPLACE VIEW "public"."v_plans_with_assignees" AS
 SELECT "p"."id",
    "p"."workspace_id",
    "p"."type",
    "p"."domain",
    "p"."project",
    "p"."module",
    "p"."feature",
    "p"."title",
    "p"."stage",
    "p"."status",
    "p"."start_date",
    "p"."end_date",
    "p"."created_by",
    "p"."created_at",
    "p"."updated_by",
    "p"."updated_at",
    "p"."client_uid",
    COALESCE("jsonb_agg"(DISTINCT "jsonb_build_object"('user_id', "pa"."user_id", 'role', "pa"."role", 'display_name', "pr"."display_name", 'email', "pr"."email", 'created_at', "pa"."created_at", 'updated_at', "pa"."updated_at")) FILTER (WHERE ("pa"."user_id" IS NOT NULL)), '[]'::"jsonb") AS "assignees"
   FROM (("public"."plans" "p"
     LEFT JOIN "public"."plan_assignees" "pa" ON ((("pa"."plan_id" = "p"."id") AND ("pa"."workspace_id" = "p"."workspace_id"))))
     LEFT JOIN "public"."profiles" "pr" ON (("pr"."user_id" = "pa"."user_id")))
  GROUP BY "p"."id";



CREATE OR REPLACE TRIGGER "feedbacks_resolve_rules" BEFORE UPDATE ON "public"."feedbacks" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_feedback_resolve_rules"();



CREATE OR REPLACE TRIGGER "feedbacks_updated_at" BEFORE UPDATE ON "public"."feedbacks" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_ensure_snapshot_week" BEFORE INSERT ON "public"."snapshots" FOR EACH ROW EXECUTE FUNCTION "public"."ensure_snapshot_week"();



CREATE OR REPLACE TRIGGER "trg_entries_updated_at" BEFORE UPDATE ON "public"."snapshot_entries" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_feedbacks_updated_at" BEFORE UPDATE ON "public"."feedbacks" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_gantt_flags_set_updated_at" BEFORE UPDATE ON "public"."gantt_flags" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_link_legacy_authors" AFTER INSERT ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."link_legacy_authors"();



CREATE OR REPLACE TRIGGER "trg_plan_assignees_updated_at" BEFORE UPDATE ON "public"."plan_assignees" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at_plan_assignees"();



CREATE OR REPLACE TRIGGER "trg_plans_updated_at" BEFORE UPDATE ON "public"."plans" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_snapshot_meta_updated_at" BEFORE UPDATE ON "public"."snapshot_meta_options" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_snapshots_updated_at" BEFORE UPDATE ON "public"."snapshots" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_snapshots_workload_updated_at" BEFORE UPDATE ON "public"."snapshots" FOR EACH ROW EXECUTE FUNCTION "public"."set_workload_updated_at"();



CREATE OR REPLACE TRIGGER "trg_sync_plan_assignee_workspace_id" BEFORE INSERT OR UPDATE ON "public"."plan_assignees" FOR EACH ROW EXECUTE FUNCTION "public"."sync_plan_assignee_workspace_id"();



ALTER TABLE ONLY "public"."feedbacks"
    ADD CONSTRAINT "feedbacks_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "public"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feedbacks"
    ADD CONSTRAINT "feedbacks_resolved_by_user_id_fkey" FOREIGN KEY ("resolved_by_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."feedbacks"
    ADD CONSTRAINT "feedbacks_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gantt_flags"
    ADD CONSTRAINT "gantt_flags_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."gantt_flags"
    ADD CONSTRAINT "gantt_flags_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."plan_assignees"
    ADD CONSTRAINT "plan_assignees_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."plan_assignees"
    ADD CONSTRAINT "plan_assignees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."plan_assignees"
    ADD CONSTRAINT "plan_assignees_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."plans"
    ADD CONSTRAINT "plans_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."plans"
    ADD CONSTRAINT "plans_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."plans"
    ADD CONSTRAINT "plans_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."snapshot_entries"
    ADD CONSTRAINT "snapshot_entries_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."snapshot_entries"
    ADD CONSTRAINT "snapshot_entries_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "public"."snapshots"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."snapshot_entries"
    ADD CONSTRAINT "snapshot_entries_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."snapshot_meta_options"
    ADD CONSTRAINT "snapshot_meta_options_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."snapshot_weeks"
    ADD CONSTRAINT "snapshot_weeks_workspace_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."snapshots"
    ADD CONSTRAINT "snapshots_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."snapshots"
    ADD CONSTRAINT "snapshots_week_id_fkey" FOREIGN KEY ("week_id") REFERENCES "public"."snapshot_weeks"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."snapshots"
    ADD CONSTRAINT "snapshots_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspace_edit_locks"
    ADD CONSTRAINT "workspace_edit_locks_holder_user_id_fkey" FOREIGN KEY ("holder_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspace_edit_locks"
    ADD CONSTRAINT "workspace_edit_locks_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



CREATE POLICY "entries_delete_leader" ON "public"."snapshot_entries" FOR DELETE TO "authenticated" USING (("public"."is_workspace_member"("workspace_id", "auth"."uid"()) AND "public"."is_workspace_admin_or_leader"("workspace_id", "auth"."uid"())));



CREATE POLICY "entries_insert_member" ON "public"."snapshot_entries" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_workspace_member"("workspace_id", "auth"."uid"()) AND ("author_id" = "auth"."uid"())));



CREATE POLICY "entries_select_member" ON "public"."snapshot_entries" FOR SELECT TO "authenticated" USING ("public"."is_workspace_member"("workspace_id", "auth"."uid"()));



CREATE POLICY "entries_update_author_or_leader" ON "public"."snapshot_entries" FOR UPDATE TO "authenticated" USING (("public"."is_workspace_member"("workspace_id", "auth"."uid"()) AND (("author_id" = "auth"."uid"()) OR "public"."is_workspace_admin_or_leader"("workspace_id", "auth"."uid"())))) WITH CHECK (("public"."is_workspace_member"("workspace_id", "auth"."uid"()) AND (("author_id" = "auth"."uid"()) OR "public"."is_workspace_admin_or_leader"("workspace_id", "auth"."uid"()))));



ALTER TABLE "public"."feedbacks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gantt_flags" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "leader_admin_full_access" ON "public"."feedbacks" USING ((EXISTS ( SELECT 1
   FROM "public"."workspace_members" "wm"
  WHERE (("wm"."user_id" = "auth"."uid"()) AND ("wm"."workspace_id" = "feedbacks"."workspace_id") AND ("wm"."role" = ANY (ARRAY['leader'::"public"."workspace_role", 'admin'::"public"."workspace_role"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."workspace_members" "wm"
  WHERE (("wm"."user_id" = "auth"."uid"()) AND ("wm"."workspace_id" = "feedbacks"."workspace_id") AND ("wm"."role" = ANY (ARRAY['leader'::"public"."workspace_role", 'admin'::"public"."workspace_role"]))))));



CREATE POLICY "leader_admin_full_access_feedback" ON "public"."feedbacks" USING ((EXISTS ( SELECT 1
   FROM "public"."workspace_members"
  WHERE (("workspace_members"."user_id" = "auth"."uid"()) AND ("workspace_members"."role" = ANY (ARRAY['leader'::"public"."workspace_role", 'admin'::"public"."workspace_role"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."workspace_members"
  WHERE (("workspace_members"."user_id" = "auth"."uid"()) AND ("workspace_members"."role" = ANY (ARRAY['leader'::"public"."workspace_role", 'admin'::"public"."workspace_role"]))))));



CREATE POLICY "leaders_delete_gantt_flags" ON "public"."gantt_flags" FOR DELETE USING (("workspace_id" IN ( SELECT "wm"."workspace_id"
   FROM "public"."workspace_members" "wm"
  WHERE (("wm"."user_id" = "auth"."uid"()) AND ("wm"."role" = ANY (ARRAY['admin'::"public"."workspace_role", 'leader'::"public"."workspace_role"]))))));



CREATE POLICY "leaders_insert_gantt_flags" ON "public"."gantt_flags" FOR INSERT WITH CHECK (("workspace_id" IN ( SELECT "wm"."workspace_id"
   FROM "public"."workspace_members" "wm"
  WHERE (("wm"."user_id" = "auth"."uid"()) AND ("wm"."role" = ANY (ARRAY['admin'::"public"."workspace_role", 'leader'::"public"."workspace_role"]))))));



CREATE POLICY "leaders_update_gantt_flags" ON "public"."gantt_flags" FOR UPDATE USING (("workspace_id" IN ( SELECT "wm"."workspace_id"
   FROM "public"."workspace_members" "wm"
  WHERE (("wm"."user_id" = "auth"."uid"()) AND ("wm"."role" = ANY (ARRAY['admin'::"public"."workspace_role", 'leader'::"public"."workspace_role"])))))) WITH CHECK (("workspace_id" IN ( SELECT "wm"."workspace_id"
   FROM "public"."workspace_members" "wm"
  WHERE (("wm"."user_id" = "auth"."uid"()) AND ("wm"."role" = ANY (ARRAY['admin'::"public"."workspace_role", 'leader'::"public"."workspace_role"]))))));



CREATE POLICY "member_crud_own_feedback" ON "public"."feedbacks" USING ((("auth"."uid"() = "author_user_id") AND (EXISTS ( SELECT 1
   FROM "public"."workspace_members" "wm"
  WHERE (("wm"."user_id" = "auth"."uid"()) AND ("wm"."workspace_id" = "feedbacks"."workspace_id")))))) WITH CHECK ((("auth"."uid"() = "author_user_id") AND (EXISTS ( SELECT 1
   FROM "public"."workspace_members" "wm"
  WHERE (("wm"."user_id" = "auth"."uid"()) AND ("wm"."workspace_id" = "feedbacks"."workspace_id"))))));



CREATE POLICY "member_delete_own_feedback" ON "public"."feedbacks" FOR DELETE USING (("auth"."uid"() = "author_user_id"));



CREATE POLICY "member_insert_feedback" ON "public"."feedbacks" FOR INSERT WITH CHECK (("auth"."uid"() = "author_user_id"));



CREATE POLICY "member_select_own_feedback" ON "public"."feedbacks" FOR SELECT USING (("auth"."uid"() = "author_user_id"));



CREATE POLICY "member_update_own_feedback" ON "public"."feedbacks" FOR UPDATE USING (("auth"."uid"() = "author_user_id")) WITH CHECK (("auth"."uid"() = "author_user_id"));



CREATE POLICY "members_select_member" ON "public"."workspace_members" FOR SELECT TO "authenticated" USING ("public"."is_workspace_member"("workspace_id", "auth"."uid"()));



ALTER TABLE "public"."plan_assignees" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "plan_assignees_select_member" ON "public"."plan_assignees" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."workspace_members" "wm"
  WHERE (("wm"."workspace_id" = "plan_assignees"."workspace_id") AND ("wm"."user_id" = "auth"."uid"())))));



CREATE POLICY "plan_assignees_write_admin_leader" ON "public"."plan_assignees" TO "authenticated" USING ("public"."is_workspace_admin_or_leader"("workspace_id")) WITH CHECK ("public"."is_workspace_admin_or_leader"("workspace_id"));



ALTER TABLE "public"."plans" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "plans_select_member" ON "public"."plans" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."workspace_members" "wm"
  WHERE (("wm"."workspace_id" = "plans"."workspace_id") AND ("wm"."user_id" = "auth"."uid"())))));



CREATE POLICY "plans_write_admin_leader" ON "public"."plans" TO "authenticated" USING ("public"."is_workspace_admin_or_leader"("workspace_id")) WITH CHECK (("public"."is_workspace_admin_or_leader"("workspace_id") AND ("created_by" = "auth"."uid"()) AND ("updated_by" = "auth"."uid"())));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_modify_own" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "profiles_select_own" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "profiles_select_workspace_members" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."workspace_members" "wm_me"
     JOIN "public"."workspace_members" "wm_target" ON (("wm_target"."workspace_id" = "wm_me"."workspace_id")))
  WHERE (("wm_me"."user_id" = "auth"."uid"()) AND ("wm_target"."user_id" = "profiles"."user_id")))));



CREATE POLICY "profiles_update_own" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."releases" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "releases_admin_full_access" ON "public"."releases" USING ((EXISTS ( SELECT 1
   FROM "public"."workspace_members"
  WHERE (("workspace_members"."user_id" = "auth"."uid"()) AND ("workspace_members"."role" = 'admin'::"public"."workspace_role"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."workspace_members"
  WHERE (("workspace_members"."user_id" = "auth"."uid"()) AND ("workspace_members"."role" = 'admin'::"public"."workspace_role")))));



CREATE POLICY "releases_select_all" ON "public"."releases" FOR SELECT USING (true);



ALTER TABLE "public"."snapshot_entries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "snapshot_meta_modify_leader" ON "public"."snapshot_meta_options" TO "authenticated" USING ("public"."is_workspace_admin_or_leader"("workspace_id", "auth"."uid"())) WITH CHECK ("public"."is_workspace_admin_or_leader"("workspace_id", "auth"."uid"()));



ALTER TABLE "public"."snapshot_meta_options" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "snapshot_meta_select_member" ON "public"."snapshot_meta_options" FOR SELECT TO "authenticated" USING ("public"."is_workspace_member"("workspace_id", "auth"."uid"()));



ALTER TABLE "public"."snapshot_weeks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "snapshot_weeks_select" ON "public"."snapshot_weeks" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."snapshots" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "snapshots_delete_leader" ON "public"."snapshots" FOR DELETE TO "authenticated" USING (("public"."is_workspace_member"("workspace_id", "auth"."uid"()) AND "public"."is_workspace_admin_or_leader"("workspace_id", "auth"."uid"())));



CREATE POLICY "snapshots_insert_member" ON "public"."snapshots" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_workspace_member"("workspace_id", "auth"."uid"()) AND ("author_id" = "auth"."uid"())));



CREATE POLICY "snapshots_select_member" ON "public"."snapshots" FOR SELECT TO "authenticated" USING ("public"."is_workspace_member"("workspace_id", "auth"."uid"()));



CREATE POLICY "snapshots_update_author_or_leader" ON "public"."snapshots" FOR UPDATE TO "authenticated" USING (("public"."is_workspace_member"("workspace_id", "auth"."uid"()) AND (("author_id" = "auth"."uid"()) OR "public"."is_workspace_admin_or_leader"("workspace_id", "auth"."uid"())))) WITH CHECK (("public"."is_workspace_member"("workspace_id", "auth"."uid"()) AND (("author_id" = "auth"."uid"()) OR "public"."is_workspace_admin_or_leader"("workspace_id", "auth"."uid"()))));



ALTER TABLE "public"."workspace_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "workspace_members_delete" ON "public"."workspace_members" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "workspace_members_insert" ON "public"."workspace_members" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = "auth"."uid"()) AND ("role" = 'member'::"public"."workspace_role")));



CREATE POLICY "workspace_members_read_gantt_flags" ON "public"."gantt_flags" FOR SELECT USING (("workspace_id" IN ( SELECT "wm"."workspace_id"
   FROM "public"."workspace_members" "wm"
  WHERE ("wm"."user_id" = "auth"."uid"()))));



CREATE POLICY "workspace_members_select" ON "public"."workspace_members" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "workspace_members_update" ON "public"."workspace_members" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."workspaces" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "workspaces_select_member" ON "public"."workspaces" FOR SELECT TO "authenticated" USING ("public"."is_workspace_member"("id", "auth"."uid"()));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



REVOKE ALL ON FUNCTION "public"."dev_acquire_workspace_lock_as"("p_workspace_id" "uuid", "p_user_id" "uuid", "p_display_name" "text", "p_ttl_seconds" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."dev_acquire_workspace_lock_as"("p_workspace_id" "uuid", "p_user_id" "uuid", "p_display_name" "text", "p_ttl_seconds" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."dev_acquire_workspace_lock_as"("p_workspace_id" "uuid", "p_user_id" "uuid", "p_display_name" "text", "p_ttl_seconds" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."dev_acquire_workspace_lock_as"("p_workspace_id" "uuid", "p_user_id" "uuid", "p_display_name" "text", "p_ttl_seconds" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_feedback_resolve_rules"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_feedback_resolve_rules"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_feedback_resolve_rules"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_snapshot_week"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_snapshot_week"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_snapshot_week"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_workspace_lock"("p_workspace_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_workspace_lock"("p_workspace_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_workspace_lock"("p_workspace_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_workspace_lock"("p_workspace_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."heartbeat_workspace_lock"("p_workspace_id" "uuid", "p_ttl_seconds" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."heartbeat_workspace_lock"("p_workspace_id" "uuid", "p_ttl_seconds" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."heartbeat_workspace_lock"("p_workspace_id" "uuid", "p_ttl_seconds" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."heartbeat_workspace_lock"("p_workspace_id" "uuid", "p_ttl_seconds" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."is_workspace_admin_or_leader"("p_workspace_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_workspace_admin_or_leader"("p_workspace_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_workspace_admin_or_leader"("p_workspace_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_workspace_admin_or_leader"("p_workspace_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_workspace_admin_or_leader"("p_workspace_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_workspace_admin_or_leader"("p_workspace_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_workspace_member"("p_workspace_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_workspace_member"("p_workspace_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_workspace_member"("p_workspace_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."link_legacy_authors"() TO "anon";
GRANT ALL ON FUNCTION "public"."link_legacy_authors"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."link_legacy_authors"() TO "service_role";



GRANT ALL ON TABLE "public"."v_plans_with_assignees" TO "anon";
GRANT ALL ON TABLE "public"."v_plans_with_assignees" TO "authenticated";
GRANT ALL ON TABLE "public"."v_plans_with_assignees" TO "service_role";



REVOKE ALL ON FUNCTION "public"."list_plans"("p_workspace_id" "uuid", "p_q" "text", "p_project" "text", "p_module" "text", "p_feature" "text", "p_stage" "text", "p_status" "text", "p_type" "public"."plan_type", "p_from" "date", "p_to" "date", "p_assignee_user_id" "uuid", "p_limit" integer, "p_offset" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."list_plans"("p_workspace_id" "uuid", "p_q" "text", "p_project" "text", "p_module" "text", "p_feature" "text", "p_stage" "text", "p_status" "text", "p_type" "public"."plan_type", "p_from" "date", "p_to" "date", "p_assignee_user_id" "uuid", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."list_plans"("p_workspace_id" "uuid", "p_q" "text", "p_project" "text", "p_module" "text", "p_feature" "text", "p_stage" "text", "p_status" "text", "p_type" "public"."plan_type", "p_from" "date", "p_to" "date", "p_assignee_user_id" "uuid", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."list_plans"("p_workspace_id" "uuid", "p_q" "text", "p_project" "text", "p_module" "text", "p_feature" "text", "p_stage" "text", "p_status" "text", "p_type" "public"."plan_type", "p_from" "date", "p_to" "date", "p_assignee_user_id" "uuid", "p_limit" integer, "p_offset" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."release_workspace_lock"("p_workspace_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."release_workspace_lock"("p_workspace_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."release_workspace_lock"("p_workspace_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."release_workspace_lock"("p_workspace_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at_plan_assignees"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at_plan_assignees"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at_plan_assignees"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_workload_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_workload_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_workload_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_plan_assignee_workspace_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_plan_assignee_workspace_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_plan_assignee_workspace_id"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."try_acquire_workspace_lock"("p_workspace_id" "uuid", "p_ttl_seconds" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."try_acquire_workspace_lock"("p_workspace_id" "uuid", "p_ttl_seconds" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."try_acquire_workspace_lock"("p_workspace_id" "uuid", "p_ttl_seconds" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."try_acquire_workspace_lock"("p_workspace_id" "uuid", "p_ttl_seconds" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."upsert_feature_plans_bulk"("p_payload" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."upsert_feature_plans_bulk"("p_payload" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."upsert_feature_plans_bulk"("p_payload" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_feature_plans_bulk"("p_payload" "jsonb") TO "service_role";



GRANT ALL ON TABLE "public"."feedbacks" TO "anon";
GRANT ALL ON TABLE "public"."feedbacks" TO "authenticated";
GRANT ALL ON TABLE "public"."feedbacks" TO "service_role";



GRANT ALL ON TABLE "public"."gantt_flags" TO "anon";
GRANT ALL ON TABLE "public"."gantt_flags" TO "authenticated";
GRANT ALL ON TABLE "public"."gantt_flags" TO "service_role";



GRANT ALL ON TABLE "public"."plan_assignees" TO "anon";
GRANT ALL ON TABLE "public"."plan_assignees" TO "authenticated";
GRANT ALL ON TABLE "public"."plan_assignees" TO "service_role";



GRANT ALL ON TABLE "public"."plans" TO "anon";
GRANT ALL ON TABLE "public"."plans" TO "authenticated";
GRANT ALL ON TABLE "public"."plans" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."releases" TO "anon";
GRANT ALL ON TABLE "public"."releases" TO "authenticated";
GRANT ALL ON TABLE "public"."releases" TO "service_role";



GRANT ALL ON TABLE "public"."snapshot_entries" TO "anon";
GRANT ALL ON TABLE "public"."snapshot_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."snapshot_entries" TO "service_role";



GRANT ALL ON TABLE "public"."snapshot_meta_options" TO "anon";
GRANT ALL ON TABLE "public"."snapshot_meta_options" TO "authenticated";
GRANT ALL ON TABLE "public"."snapshot_meta_options" TO "service_role";



GRANT ALL ON TABLE "public"."snapshot_weeks" TO "anon";
GRANT ALL ON TABLE "public"."snapshot_weeks" TO "authenticated";
GRANT ALL ON TABLE "public"."snapshot_weeks" TO "service_role";



GRANT ALL ON TABLE "public"."snapshots" TO "anon";
GRANT ALL ON TABLE "public"."snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."snapshots" TO "service_role";



GRANT ALL ON TABLE "public"."workspace_edit_locks" TO "anon";
GRANT ALL ON TABLE "public"."workspace_edit_locks" TO "authenticated";
GRANT ALL ON TABLE "public"."workspace_edit_locks" TO "service_role";



GRANT ALL ON TABLE "public"."workspace_members" TO "anon";
GRANT ALL ON TABLE "public"."workspace_members" TO "authenticated";
GRANT ALL ON TABLE "public"."workspace_members" TO "service_role";



GRANT ALL ON TABLE "public"."workspaces" TO "anon";
GRANT ALL ON TABLE "public"."workspaces" TO "authenticated";
GRANT ALL ON TABLE "public"."workspaces" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







