begin;

-- Clear storage objects and buckets created by migrations - ONLY AVAILABLE API

-- delete from storage.objects
-- where bucket_id in ('property-images', 'maintenance-photos', 'documents', 'avatars');

-- delete from storage.buckets
-- where id in ('property-images', 'maintenance-photos', 'documents', 'avatars');

-- Drop all tables in public schema
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN (select tablename from pg_tables where schemaname = 'public') LOOP
    EXECUTE format('drop table if exists public.%I cascade', r.tablename);
  END LOOP;

  FOR r IN (select sequencename from pg_sequences where schemaname = 'public') LOOP
    EXECUTE format('drop sequence if exists public.%I cascade', r.sequencename);
  END LOOP;

  FOR r IN (select table_name from information_schema.views where table_schema = 'public') LOOP
    EXECUTE format('drop view if exists public.%I cascade', r.table_name);
  END LOOP;

  FOR r IN (
    select p.proname, pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    join pg_namespace n on p.pronamespace = n.oid
    where n.nspname = 'public'
  ) LOOP
    EXECUTE format('drop function if exists public.%I(%s) cascade', r.proname, r.args);
  END LOOP;

  FOR r IN (
    select t.typname
    from pg_type t
    join pg_namespace n on t.typnamespace = n.oid
    where n.nspname = 'public'
      and t.typtype = 'e'
  ) LOOP
    EXECUTE format('drop type if exists public.%I cascade', r.typname);
  END LOOP;
END $$;

truncate table supabase_migrations.schema_migrations;

commit;
