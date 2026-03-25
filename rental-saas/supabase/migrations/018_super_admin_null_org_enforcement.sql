UPDATE profiles
SET organization_id = NULL,
    updated_at = now()
WHERE role = 'super_admin'
  AND organization_id IS NOT NULL;

ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_super_admin_org_null_chk;

ALTER TABLE profiles
ADD CONSTRAINT profiles_super_admin_org_null_chk
CHECK (role <> 'super_admin' OR organization_id IS NULL);

CREATE OR REPLACE FUNCTION enforce_super_admin_org_null()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.role = 'super_admin' AND NEW.organization_id IS NOT NULL THEN
    RAISE EXCEPTION 'super_admin profiles cannot have an organization_id';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_enforce_super_admin_org_null ON profiles;

CREATE TRIGGER trg_profiles_enforce_super_admin_org_null
BEFORE INSERT OR UPDATE OF role, organization_id ON profiles
FOR EACH ROW
EXECUTE FUNCTION enforce_super_admin_org_null();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  raw_role TEXT;
  resolved_role user_role := 'tenant';
  resolved_name TEXT;
  resolved_org_id UUID;
BEGIN
  raw_role := NEW.raw_user_meta_data->>'role';
  resolved_name := COALESCE(NULLIF(btrim(NEW.raw_user_meta_data->>'full_name'), ''), 'New User');

  IF raw_role IS NOT NULL
    AND btrim(raw_role) <> ''
    AND raw_role = ANY (ARRAY(SELECT unnest(enum_range(NULL::user_role))::text)) THEN
    resolved_role := raw_role::user_role;
  END IF;

  BEGIN
    resolved_org_id := NULLIF(NEW.raw_user_meta_data->>'organization_id', '')::uuid;
  EXCEPTION
    WHEN invalid_text_representation THEN
      resolved_org_id := NULL;
  END;

  IF resolved_role = 'super_admin' THEN
    resolved_org_id := NULL;
  END IF;

  INSERT INTO public.profiles (id, full_name, role, organization_id)
  VALUES (NEW.id, resolved_name, resolved_role, resolved_org_id)
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      organization_id = CASE
        WHEN EXCLUDED.role = 'super_admin' THEN NULL
        ELSE COALESCE(profiles.organization_id, EXCLUDED.organization_id)
      END,
      updated_at = now();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;
