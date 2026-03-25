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

  INSERT INTO public.profiles (id, full_name, role, organization_id)
  VALUES (NEW.id, resolved_name, resolved_role, resolved_org_id)
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      organization_id = COALESCE(profiles.organization_id, EXCLUDED.organization_id),
      updated_at = now();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
