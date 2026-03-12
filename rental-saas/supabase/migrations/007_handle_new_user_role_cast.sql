CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  raw_role TEXT;
  resolved_role user_role := 'tenant';
BEGIN
  raw_role := NEW.raw_user_meta_data->>'role';

  IF raw_role IS NOT NULL AND btrim(raw_role) <> '' THEN
    BEGIN
      resolved_role := raw_role::user_role;
    EXCEPTION
      WHEN invalid_text_representation THEN
        resolved_role := 'tenant';
    END;
  END IF;

  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(btrim(NEW.raw_user_meta_data->>'full_name'), ''), 'New User'),
    resolved_role
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
