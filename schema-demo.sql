


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


CREATE TYPE "public"."basic_role" AS ENUM (
    'PLANNING',
    'FE',
    'BE',
    'DESIGN',
    'QA'
);


ALTER TYPE "public"."basic_role" OWNER TO "postgres";


CREATE TYPE "public"."feedback_status" AS ENUM (
    'open',
    'in_progress',
    'resolved'
);


ALTER TYPE "public"."feedback_status" OWNER TO "postgres";


CREATE TYPE "public"."menu_event_type" AS ENUM (
    'PAGE_VIEW',
    'MENU_CLICK'
);


ALTER TYPE "public"."menu_event_type" OWNER TO "postgres";


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
    'manager',
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
  IF NEW.status = 'resolved' THEN
    IF NEW.resolution_note IS NULL OR NEW.resolution_note = '' THEN
      RAISE EXCEPTION 'resolution_note is required when status is resolved';
    END IF;

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
  if new.week_start_date is null then
    raise exception 'week_start_date is required';
  end if;

  if new.week_end_date is null then
    new.week_end_date := new.week_start_date;
  end if;

  if new.year is null then
    new.year := extract(isoyear from new.week_start_date)::int;
  end if;

  if new.week is null then
    new.week := 'W' || lpad(extract(week from new.week_start_date)::int::text, 2, '0');
  end if;

  insert into public.snapshot_weeks (workspace_id, year, week, week_start_date, week_end_date)
  values (new.workspace_id, new.year, new.week, new.week_start_date, new.week_end_date)
  on conflict (workspace_id, week_start_date)
  do update set
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


CREATE OR REPLACE FUNCTION "public"."handle_new_user_join_default_workspace"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
declare
  v_workspace_id uuid;
  v_display_name text;
begin
  -- 1) display_name 결정 (meta > email prefix)
  v_display_name :=
    nullif(coalesce(new.raw_user_meta_data->>'display_name', ''), '');

  if v_display_name is null then
    v_display_name := split_part(coalesce(new.email, 'user'), '@', 1);
  end if;

  -- 2) profiles upsert
  insert into public.profiles (user_id, display_name, email)
  values (new.id, v_display_name, coalesce(new.email, ''))
  on conflict (user_id) do update
    set display_name = excluded.display_name,
        email = excluded.email,
        updated_at = now();

  -- 3) 기본 워크스페이스 선택 (Demo Workspace)
  select w.id
    into v_workspace_id
  from public.workspaces w
  where w.name = 'Demo Workspace'
  order by w.created_at asc
  limit 1;

  -- fallback: 가장 오래된 workspace
  if v_workspace_id is null then
    select w.id
      into v_workspace_id
    from public.workspaces w
    order by w.created_at asc
    limit 1;
  end if;

  -- workspace 자체가 없으면 profiles만 생성
  if v_workspace_id is null then
    return new;
  end if;

  -- 4) workspace_members → 기본 role = admin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (v_workspace_id, new.id, 'admin')
  on conflict (workspace_id, user_id) do nothing;

  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user_join_default_workspace"() OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."is_workspace_admin"("p_workspace_id" "uuid", "p_user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = p_user_id
      and wm.role::text = 'admin'
  );
$$;


ALTER FUNCTION "public"."is_workspace_admin"("p_workspace_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_workspace_admin_or_leader"("p_workspace_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  return exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = auth.uid()
      and wm.role::text in ('admin','manager')
  );
end;
$$;


ALTER FUNCTION "public"."is_workspace_admin_or_leader"("p_workspace_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_workspace_admin_or_leader"("p_workspace_id" "uuid", "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  return exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = p_user_id
      and wm.role::text in ('admin', 'manager')
  );
end;
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
  update public.snapshot_entries se
  set
    author_id = new.user_id,
    author_display_name = null
  where se.author_id is null
    and se.author_display_name = new.display_name;

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


CREATE OR REPLACE FUNCTION "public"."update_menu_settings_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_menu_settings_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";

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
    "links" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "description" "text",
    CONSTRAINT "gantt_flags_valid_range" CHECK (("start_date" <= "end_date"))
);


ALTER TABLE "public"."gantt_flags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."menu_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "event_type" "public"."menu_event_type" NOT NULL,
    "menu_group" "text",
    "menu_key" "text",
    "page_path" "text" NOT NULL,
    "page_key" "text",
    "referrer" "text",
    "device" "text",
    "user_agent" "text",
    "session_id" "text",
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "menu_events_menu_group_check" CHECK ((("menu_group" IS NULL) OR ("char_length"("menu_group") <= 64))),
    CONSTRAINT "menu_events_menu_key_check" CHECK ((("menu_key" IS NULL) OR ("char_length"("menu_key") <= 64))),
    CONSTRAINT "menu_events_page_path_check" CHECK (("char_length"("page_path") <= 512))
);


ALTER TABLE "public"."menu_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."menu_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "menu_key" "text" NOT NULL,
    "is_enabled" boolean DEFAULT true NOT NULL,
    "tag_label" "text",
    "tag_color" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "menu_settings_tag_color_check" CHECK (("tag_color" = ANY (ARRAY['blue'::"text", 'green'::"text", 'orange'::"text", 'pink'::"text", 'purple'::"text", 'gray'::"text"])))
);


ALTER TABLE "public"."menu_settings" OWNER TO "postgres";


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
    "lane_hint" integer,
    CONSTRAINT "plans_date_range_check" CHECK ((("start_date" IS NULL) OR ("end_date" IS NULL) OR ("start_date" <= "end_date"))),
    CONSTRAINT "plans_feature_keys_required" CHECK ((("type" <> 'feature'::"public"."plan_type") OR (("project" IS NOT NULL) AND ("module" IS NOT NULL) AND ("feature" IS NOT NULL)))),
    CONSTRAINT "plans_stage_required_for_feature" CHECK ((("type" <> 'feature'::"public"."plan_type") OR (("stage" IS NOT NULL) AND ("stage" <> ''::"text"))))
);


ALTER TABLE "public"."plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "user_id" "uuid" NOT NULL,
    "display_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "basic_role" "public"."basic_role"
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


CREATE OR REPLACE VIEW "public"."v_collab_edges" AS
 SELECT "se"."workspace_id",
    "se"."author_id" AS "from_user_id",
    (("c"."value" ->> 'userId'::"text"))::"uuid" AS "to_user_id",
    "count"(*) AS "collaboration_count"
   FROM ("public"."snapshot_entries" "se"
     CROSS JOIN LATERAL "jsonb_array_elements"("se"."collaborators") "c"("value"))
  WHERE (("se"."author_id" IS NOT NULL) AND ("se"."collaborators" IS NOT NULL) AND ("jsonb_typeof"("se"."collaborators") = 'array'::"text") AND (("c"."value" ->> 'userId'::"text") IS NOT NULL))
  GROUP BY "se"."workspace_id", "se"."author_id", (("c"."value" ->> 'userId'::"text"))::"uuid";


ALTER VIEW "public"."v_collab_edges" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_flag_plan_summary" AS
SELECT
    NULL::"uuid" AS "workspace_id",
    NULL::"uuid" AS "flag_id",
    NULL::"text" AS "flag_title",
    NULL::"date" AS "flag_start_date",
    NULL::"date" AS "flag_end_date",
    NULL::integer AS "flag_days",
    NULL::bigint AS "plan_count",
    NULL::"date" AS "min_plan_start",
    NULL::"date" AS "max_plan_end";


ALTER VIEW "public"."v_flag_plan_summary" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_menu_usage_weekly" AS
 SELECT "workspace_id",
    "date_trunc"('week'::"text", ("occurred_at" AT TIME ZONE 'Asia/Seoul'::"text")) AS "week_start_seoul",
    COALESCE("menu_group", 'unknown'::"text") AS "menu_group",
    COALESCE("menu_key", 'unknown'::"text") AS "menu_key",
    "event_type",
    "count"(*) AS "event_count",
    "count"(DISTINCT "user_id") AS "unique_users"
   FROM "public"."menu_events"
  GROUP BY "workspace_id", ("date_trunc"('week'::"text", ("occurred_at" AT TIME ZONE 'Asia/Seoul'::"text"))), COALESCE("menu_group", 'unknown'::"text"), COALESCE("menu_key", 'unknown'::"text"), "event_type";


ALTER VIEW "public"."v_menu_usage_weekly" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_page_usage_weekly" AS
 SELECT "workspace_id",
    "date_trunc"('week'::"text", ("occurred_at" AT TIME ZONE 'Asia/Seoul'::"text")) AS "week_start_seoul",
    "page_path",
    "count"(*) AS "event_count",
    "count"(DISTINCT "user_id") AS "unique_users"
   FROM "public"."menu_events"
  GROUP BY "workspace_id", ("date_trunc"('week'::"text", ("occurred_at" AT TIME ZONE 'Asia/Seoul'::"text"))), "page_path";


ALTER VIEW "public"."v_page_usage_weekly" OWNER TO "postgres";


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


CREATE OR REPLACE VIEW "public"."v_resource_distribution" AS
 SELECT "pa"."workspace_id",
    "pa"."user_id",
    "pr"."display_name",
    "count"(DISTINCT "pa"."plan_id") AS "assigned_plan_count"
   FROM ("public"."plan_assignees" "pa"
     JOIN "public"."profiles" "pr" ON (("pr"."user_id" = "pa"."user_id")))
  GROUP BY "pa"."workspace_id", "pa"."user_id", "pr"."display_name";


ALTER VIEW "public"."v_resource_distribution" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_user_menu_usage_weekly" AS
 SELECT "me"."workspace_id",
    "date_trunc"('week'::"text", ("me"."occurred_at" AT TIME ZONE 'Asia/Seoul'::"text")) AS "week_start_seoul",
    "me"."user_id",
    "p"."display_name",
    COALESCE("me"."menu_group", 'unknown'::"text") AS "menu_group",
    COALESCE("me"."menu_key", 'unknown'::"text") AS "menu_key",
    "count"(*) AS "event_count"
   FROM ("public"."menu_events" "me"
     LEFT JOIN "public"."profiles" "p" ON (("p"."user_id" = "me"."user_id")))
  WHERE ("me"."user_id" IS NOT NULL)
  GROUP BY "me"."workspace_id", ("date_trunc"('week'::"text", ("me"."occurred_at" AT TIME ZONE 'Asia/Seoul'::"text"))), "me"."user_id", "p"."display_name", COALESCE("me"."menu_group", 'unknown'::"text"), COALESCE("me"."menu_key", 'unknown'::"text");


ALTER VIEW "public"."v_user_menu_usage_weekly" OWNER TO "postgres";


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
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."workspace_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workspaces" (
    "id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_demo" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."workspaces" OWNER TO "postgres";


ALTER TABLE ONLY "public"."feedbacks"
    ADD CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gantt_flags"
    ADD CONSTRAINT "gantt_flags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."menu_events"
    ADD CONSTRAINT "menu_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."menu_settings"
    ADD CONSTRAINT "menu_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."menu_settings"
    ADD CONSTRAINT "menu_settings_workspace_id_menu_key_key" UNIQUE ("workspace_id", "menu_key");



ALTER TABLE ONLY "public"."plan_assignees"
    ADD CONSTRAINT "plan_assignees_pkey" PRIMARY KEY ("plan_id", "user_id", "role");



ALTER TABLE ONLY "public"."plans"
    ADD CONSTRAINT "plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."plans"
    ADD CONSTRAINT "plans_workspace_client_uid_key" UNIQUE ("workspace_id", "client_uid");



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



ALTER TABLE ONLY "public"."plan_assignees"
    ADD CONSTRAINT "ux_plan_assignees_one_per_plan" UNIQUE ("plan_id");



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



CREATE INDEX "idx_menu_events_ws_menu" ON "public"."menu_events" USING "btree" ("workspace_id", "menu_group", "menu_key", "occurred_at" DESC);



CREATE INDEX "idx_menu_events_ws_path" ON "public"."menu_events" USING "btree" ("workspace_id", "page_path");



CREATE INDEX "idx_menu_events_ws_time" ON "public"."menu_events" USING "btree" ("workspace_id", "occurred_at" DESC);



CREATE INDEX "idx_menu_events_ws_type_time" ON "public"."menu_events" USING "btree" ("workspace_id", "event_type", "occurred_at" DESC);



CREATE INDEX "idx_menu_events_ws_user_time" ON "public"."menu_events" USING "btree" ("workspace_id", "user_id", "occurred_at" DESC);



CREATE INDEX "idx_menu_settings_enabled" ON "public"."menu_settings" USING "btree" ("workspace_id", "is_enabled");



CREATE INDEX "idx_menu_settings_workspace" ON "public"."menu_settings" USING "btree" ("workspace_id");



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



CREATE INDEX "idx_profiles_basic_role" ON "public"."profiles" USING "btree" ("basic_role");



CREATE INDEX "idx_profiles_display_name" ON "public"."profiles" USING "btree" ("display_name");



CREATE INDEX "idx_profiles_email" ON "public"."profiles" USING "btree" ("email");



CREATE INDEX "idx_snapshot_entries_ws_author" ON "public"."snapshot_entries" USING "btree" ("workspace_id", "author_id");



CREATE INDEX "idx_snapshot_entries_ws_created_at" ON "public"."snapshot_entries" USING "btree" ("workspace_id", "created_at" DESC);



CREATE INDEX "idx_snapshot_weeks_workspace_start" ON "public"."snapshot_weeks" USING "btree" ("workspace_id", "week_start_date" DESC);



CREATE INDEX "idx_snapshot_weeks_year_week" ON "public"."snapshot_weeks" USING "btree" ("year", "week");



CREATE INDEX "idx_snapshots_week_id" ON "public"."snapshots" USING "btree" ("week_id");



CREATE INDEX "idx_snapshots_week_start_date" ON "public"."snapshots" USING "btree" ("week_start_date");



CREATE INDEX "idx_snapshots_workspace_week" ON "public"."snapshots" USING "btree" ("workspace_id", "week_start_date");



CREATE INDEX "idx_snapshots_ws_updated_at" ON "public"."snapshots" USING "btree" ("workspace_id", "updated_at" DESC);



CREATE INDEX "idx_snapshots_year_week" ON "public"."snapshots" USING "btree" ("year", "week");



CREATE INDEX "idx_workspace_edit_locks_expires" ON "public"."workspace_edit_locks" USING "btree" ("expires_at");



CREATE INDEX "idx_workspace_members_user" ON "public"."workspace_members" USING "btree" ("user_id");



CREATE INDEX "idx_workspace_members_workspace_role" ON "public"."workspace_members" USING "btree" ("workspace_id", "role");



CREATE UNIQUE INDEX "ux_plans_workspace_client_uid" ON "public"."plans" USING "btree" ("workspace_id", "client_uid") WHERE ("client_uid" IS NOT NULL);



CREATE OR REPLACE VIEW "public"."v_flag_plan_summary" AS
 SELECT "gf"."workspace_id",
    "gf"."id" AS "flag_id",
    "gf"."title" AS "flag_title",
    "gf"."start_date" AS "flag_start_date",
    "gf"."end_date" AS "flag_end_date",
    (("gf"."end_date" - "gf"."start_date") + 1) AS "flag_days",
    "count"("p"."id") AS "plan_count",
    "min"("p"."start_date") AS "min_plan_start",
    "max"("p"."end_date") AS "max_plan_end"
   FROM ("public"."gantt_flags" "gf"
     LEFT JOIN "public"."plans" "p" ON ((("p"."workspace_id" = "gf"."workspace_id") AND ("p"."start_date" IS NOT NULL) AND ("p"."end_date" IS NOT NULL) AND ("p"."start_date" <= "gf"."end_date") AND ("p"."end_date" >= "gf"."start_date"))))
  GROUP BY "gf"."workspace_id", "gf"."id";



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



CREATE OR REPLACE TRIGGER "menu_settings_updated_at_trigger" BEFORE UPDATE ON "public"."menu_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_menu_settings_updated_at"();



CREATE OR REPLACE TRIGGER "trg_ensure_snapshot_week" BEFORE INSERT ON "public"."snapshots" FOR EACH ROW EXECUTE FUNCTION "public"."ensure_snapshot_week"();



CREATE OR REPLACE TRIGGER "trg_entries_updated_at" BEFORE UPDATE ON "public"."snapshot_entries" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



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



ALTER TABLE ONLY "public"."menu_events"
    ADD CONSTRAINT "menu_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."menu_events"
    ADD CONSTRAINT "menu_events_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."menu_settings"
    ADD CONSTRAINT "menu_settings_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



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



CREATE POLICY "entries_admin_manage" ON "public"."snapshot_entries" TO "authenticated" USING ("public"."is_workspace_admin"("workspace_id", "auth"."uid"())) WITH CHECK ("public"."is_workspace_admin"("workspace_id", "auth"."uid"()));



CREATE POLICY "entries_delete_author_or_leader" ON "public"."snapshot_entries" FOR DELETE TO "authenticated" USING (("public"."is_workspace_member"("workspace_id", "auth"."uid"()) AND (("author_id" = "auth"."uid"()) OR "public"."is_workspace_admin_or_leader"("workspace_id", "auth"."uid"()))));



CREATE POLICY "entries_insert_member" ON "public"."snapshot_entries" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_workspace_member"("workspace_id", "auth"."uid"()) AND ("author_id" = "auth"."uid"())));



CREATE POLICY "entries_select_member" ON "public"."snapshot_entries" FOR SELECT TO "authenticated" USING ("public"."is_workspace_member"("workspace_id", "auth"."uid"()));



CREATE POLICY "entries_update_author_or_leader" ON "public"."snapshot_entries" FOR UPDATE TO "authenticated" USING (("public"."is_workspace_member"("workspace_id", "auth"."uid"()) AND (("author_id" = "auth"."uid"()) OR "public"."is_workspace_admin_or_leader"("workspace_id", "auth"."uid"())))) WITH CHECK (("public"."is_workspace_member"("workspace_id", "auth"."uid"()) AND (("author_id" = "auth"."uid"()) OR "public"."is_workspace_admin_or_leader"("workspace_id", "auth"."uid"()))));



ALTER TABLE "public"."feedbacks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "feedbacks_write_admin_or_leader" ON "public"."feedbacks" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."workspace_members" "wm"
  WHERE (("wm"."user_id" = "auth"."uid"()) AND ("wm"."workspace_id" = "feedbacks"."workspace_id") AND (("wm"."role")::"text" = ANY (ARRAY['manager'::"text", 'admin'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."workspace_members" "wm"
  WHERE (("wm"."user_id" = "auth"."uid"()) AND ("wm"."workspace_id" = "feedbacks"."workspace_id") AND (("wm"."role")::"text" = ANY (ARRAY['manager'::"text", 'admin'::"text"]))))));



ALTER TABLE "public"."gantt_flags" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "gantt_flags_select_demo_anon" ON "public"."gantt_flags" FOR SELECT TO "anon" USING (("workspace_id" = '00000000-0000-0000-0000-000000000002'::"uuid"));



CREATE POLICY "gantt_flags_write_admin_or_leader" ON "public"."gantt_flags" TO "authenticated" USING (("workspace_id" IN ( SELECT "wm"."workspace_id"
   FROM "public"."workspace_members" "wm"
  WHERE (("wm"."user_id" = "auth"."uid"()) AND (("wm"."role")::"text" = ANY (ARRAY['admin'::"text", 'manager'::"text"])))))) WITH CHECK (("workspace_id" IN ( SELECT "wm"."workspace_id"
   FROM "public"."workspace_members" "wm"
  WHERE (("wm"."user_id" = "auth"."uid"()) AND (("wm"."role")::"text" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "member_delete_own_feedback" ON "public"."feedbacks" FOR DELETE USING (("auth"."uid"() = "author_user_id"));



CREATE POLICY "member_insert_feedback" ON "public"."feedbacks" FOR INSERT WITH CHECK (("auth"."uid"() = "author_user_id"));



CREATE POLICY "member_select_all_feedback" ON "public"."feedbacks" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."workspace_members" "wm"
  WHERE (("wm"."user_id" = "auth"."uid"()) AND ("wm"."workspace_id" = "feedbacks"."workspace_id")))));



CREATE POLICY "member_update_own_feedback" ON "public"."feedbacks" FOR UPDATE USING (("auth"."uid"() = "author_user_id")) WITH CHECK (("auth"."uid"() = "author_user_id"));



CREATE POLICY "members_select_member" ON "public"."workspace_members" FOR SELECT TO "authenticated" USING ("public"."is_workspace_member"("workspace_id", "auth"."uid"()));



ALTER TABLE "public"."menu_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "menu_events_insert_workspace_members" ON "public"."menu_events" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."workspace_members" "wm"
  WHERE (("wm"."workspace_id" = "menu_events"."workspace_id") AND ("wm"."user_id" = "auth"."uid"())))));



CREATE POLICY "menu_events_no_delete" ON "public"."menu_events" FOR DELETE TO "authenticated" USING (false);



CREATE POLICY "menu_events_no_update" ON "public"."menu_events" FOR UPDATE TO "authenticated" USING (false);



CREATE POLICY "menu_events_read_workspace_members" ON "public"."menu_events" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."workspace_members" "wm"
  WHERE (("wm"."workspace_id" = "menu_events"."workspace_id") AND ("wm"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."menu_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "menu_settings_delete_policy" ON "public"."menu_settings" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."workspace_members" "wm"
  WHERE (("wm"."workspace_id" = "menu_settings"."workspace_id") AND ("wm"."user_id" = "auth"."uid"()) AND ("wm"."role" = ANY (ARRAY['admin'::"public"."workspace_role", 'manager'::"public"."workspace_role"]))))));



CREATE POLICY "menu_settings_insert_policy" ON "public"."menu_settings" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."workspace_members" "wm"
  WHERE (("wm"."workspace_id" = "menu_settings"."workspace_id") AND ("wm"."user_id" = "auth"."uid"()) AND ("wm"."role" = ANY (ARRAY['admin'::"public"."workspace_role", 'manager'::"public"."workspace_role"]))))));



CREATE POLICY "menu_settings_select_demo_anon" ON "public"."menu_settings" FOR SELECT TO "anon" USING (("workspace_id" = '00000000-0000-0000-0000-000000000002'::"uuid"));



CREATE POLICY "menu_settings_select_policy" ON "public"."menu_settings" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."workspace_members" "wm"
  WHERE (("wm"."workspace_id" = "menu_settings"."workspace_id") AND ("wm"."user_id" = "auth"."uid"())))));



CREATE POLICY "menu_settings_update_policy" ON "public"."menu_settings" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."workspace_members" "wm"
  WHERE (("wm"."workspace_id" = "menu_settings"."workspace_id") AND ("wm"."user_id" = "auth"."uid"()) AND ("wm"."role" = ANY (ARRAY['admin'::"public"."workspace_role", 'manager'::"public"."workspace_role"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."workspace_members" "wm"
  WHERE (("wm"."workspace_id" = "menu_settings"."workspace_id") AND ("wm"."user_id" = "auth"."uid"()) AND ("wm"."role" = ANY (ARRAY['admin'::"public"."workspace_role", 'manager'::"public"."workspace_role"]))))));



ALTER TABLE "public"."plan_assignees" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "plan_assignees_select_demo_anon" ON "public"."plan_assignees" FOR SELECT TO "anon" USING (("workspace_id" = '00000000-0000-0000-0000-000000000002'::"uuid"));



CREATE POLICY "plan_assignees_select_member" ON "public"."plan_assignees" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."workspace_members" "wm"
  WHERE (("wm"."workspace_id" = "plan_assignees"."workspace_id") AND ("wm"."user_id" = "auth"."uid"())))));



CREATE POLICY "plan_assignees_write_admin_leader" ON "public"."plan_assignees" TO "authenticated" USING ("public"."is_workspace_admin_or_leader"("workspace_id")) WITH CHECK ("public"."is_workspace_admin_or_leader"("workspace_id"));



ALTER TABLE "public"."plans" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "plans_select_demo_anon" ON "public"."plans" FOR SELECT TO "anon" USING (("workspace_id" = '00000000-0000-0000-0000-000000000002'::"uuid"));



CREATE POLICY "plans_select_member" ON "public"."plans" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."workspace_members" "wm"
  WHERE (("wm"."workspace_id" = "plans"."workspace_id") AND ("wm"."user_id" = "auth"."uid"())))));



CREATE POLICY "plans_write_admin_leader" ON "public"."plans" TO "authenticated" USING ("public"."is_workspace_admin_or_leader"("workspace_id")) WITH CHECK (("public"."is_workspace_admin_or_leader"("workspace_id") AND ("created_by" = "auth"."uid"()) AND ("updated_by" = "auth"."uid"())));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_modify_own" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "profiles_select_anon_demo" ON "public"."profiles" FOR SELECT TO "anon" USING (true);



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


CREATE POLICY "snapshot_entries_select_demo_anon" ON "public"."snapshot_entries" FOR SELECT TO "anon" USING (("workspace_id" = '00000000-0000-0000-0000-000000000002'::"uuid"));



CREATE POLICY "snapshot_meta_modify_leader" ON "public"."snapshot_meta_options" TO "authenticated" USING ("public"."is_workspace_admin_or_leader"("workspace_id", "auth"."uid"())) WITH CHECK ("public"."is_workspace_admin_or_leader"("workspace_id", "auth"."uid"()));



ALTER TABLE "public"."snapshot_meta_options" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "snapshot_meta_options_select_demo_anon" ON "public"."snapshot_meta_options" FOR SELECT TO "anon" USING (("workspace_id" = '00000000-0000-0000-0000-000000000002'::"uuid"));



CREATE POLICY "snapshot_meta_select_member" ON "public"."snapshot_meta_options" FOR SELECT TO "authenticated" USING ("public"."is_workspace_member"("workspace_id", "auth"."uid"()));



ALTER TABLE "public"."snapshot_weeks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "snapshot_weeks_select" ON "public"."snapshot_weeks" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "snapshot_weeks_select_demo_anon" ON "public"."snapshot_weeks" FOR SELECT TO "anon" USING (("workspace_id" = '00000000-0000-0000-0000-000000000002'::"uuid"));



ALTER TABLE "public"."snapshots" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "snapshots_admin_manage" ON "public"."snapshots" TO "authenticated" USING ("public"."is_workspace_admin"("workspace_id", "auth"."uid"())) WITH CHECK ("public"."is_workspace_admin"("workspace_id", "auth"."uid"()));



CREATE POLICY "snapshots_delete_leader" ON "public"."snapshots" FOR DELETE TO "authenticated" USING (("public"."is_workspace_member"("workspace_id", "auth"."uid"()) AND "public"."is_workspace_admin_or_leader"("workspace_id", "auth"."uid"())));



CREATE POLICY "snapshots_insert_member" ON "public"."snapshots" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_workspace_member"("workspace_id", "auth"."uid"()) AND ("author_id" = "auth"."uid"())));



CREATE POLICY "snapshots_select_demo_anon" ON "public"."snapshots" FOR SELECT TO "anon" USING (("workspace_id" = '00000000-0000-0000-0000-000000000002'::"uuid"));



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



CREATE POLICY "workspace_members_update_admin" ON "public"."workspace_members" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."workspace_members" "wm"
  WHERE (("wm"."workspace_id" = "workspace_members"."workspace_id") AND ("wm"."user_id" = "auth"."uid"()) AND ("wm"."role" = ANY (ARRAY['admin'::"public"."workspace_role", 'manager'::"public"."workspace_role"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."workspace_members" "wm"
  WHERE (("wm"."workspace_id" = "workspace_members"."workspace_id") AND ("wm"."user_id" = "auth"."uid"()) AND ("wm"."role" = ANY (ARRAY['admin'::"public"."workspace_role", 'manager'::"public"."workspace_role"]))))));



ALTER TABLE "public"."workspaces" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "workspaces_select_demo_anon" ON "public"."workspaces" FOR SELECT TO "anon" USING (("is_demo" = true));



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



GRANT ALL ON FUNCTION "public"."handle_new_user_join_default_workspace"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user_join_default_workspace"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user_join_default_workspace"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."heartbeat_workspace_lock"("p_workspace_id" "uuid", "p_ttl_seconds" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."heartbeat_workspace_lock"("p_workspace_id" "uuid", "p_ttl_seconds" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."heartbeat_workspace_lock"("p_workspace_id" "uuid", "p_ttl_seconds" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."heartbeat_workspace_lock"("p_workspace_id" "uuid", "p_ttl_seconds" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."is_workspace_admin"("p_workspace_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_workspace_admin"("p_workspace_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_workspace_admin"("p_workspace_id" "uuid", "p_user_id" "uuid") TO "service_role";



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



GRANT ALL ON FUNCTION "public"."update_menu_settings_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_menu_settings_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_menu_settings_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";



GRANT ALL ON TABLE "public"."feedbacks" TO "anon";
GRANT ALL ON TABLE "public"."feedbacks" TO "authenticated";
GRANT ALL ON TABLE "public"."feedbacks" TO "service_role";



GRANT ALL ON TABLE "public"."gantt_flags" TO "anon";
GRANT ALL ON TABLE "public"."gantt_flags" TO "authenticated";
GRANT ALL ON TABLE "public"."gantt_flags" TO "service_role";



GRANT ALL ON TABLE "public"."menu_events" TO "anon";
GRANT ALL ON TABLE "public"."menu_events" TO "authenticated";
GRANT ALL ON TABLE "public"."menu_events" TO "service_role";



GRANT ALL ON TABLE "public"."menu_settings" TO "anon";
GRANT ALL ON TABLE "public"."menu_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."menu_settings" TO "service_role";



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



GRANT ALL ON TABLE "public"."v_collab_edges" TO "anon";
GRANT ALL ON TABLE "public"."v_collab_edges" TO "authenticated";
GRANT ALL ON TABLE "public"."v_collab_edges" TO "service_role";



GRANT ALL ON TABLE "public"."v_flag_plan_summary" TO "anon";
GRANT ALL ON TABLE "public"."v_flag_plan_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."v_flag_plan_summary" TO "service_role";



GRANT ALL ON TABLE "public"."v_menu_usage_weekly" TO "anon";
GRANT ALL ON TABLE "public"."v_menu_usage_weekly" TO "authenticated";
GRANT ALL ON TABLE "public"."v_menu_usage_weekly" TO "service_role";



GRANT ALL ON TABLE "public"."v_page_usage_weekly" TO "anon";
GRANT ALL ON TABLE "public"."v_page_usage_weekly" TO "authenticated";
GRANT ALL ON TABLE "public"."v_page_usage_weekly" TO "service_role";



GRANT ALL ON TABLE "public"."v_plans_with_assignees" TO "anon";
GRANT ALL ON TABLE "public"."v_plans_with_assignees" TO "authenticated";
GRANT ALL ON TABLE "public"."v_plans_with_assignees" TO "service_role";



GRANT ALL ON TABLE "public"."v_resource_distribution" TO "anon";
GRANT ALL ON TABLE "public"."v_resource_distribution" TO "authenticated";
GRANT ALL ON TABLE "public"."v_resource_distribution" TO "service_role";



GRANT ALL ON TABLE "public"."v_user_menu_usage_weekly" TO "anon";
GRANT ALL ON TABLE "public"."v_user_menu_usage_weekly" TO "authenticated";
GRANT ALL ON TABLE "public"."v_user_menu_usage_weekly" TO "service_role";



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







