CREATE OR REPLACE FUNCTION is_org_owner(org_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organizations o
    JOIN profiles p ON p.id = auth.uid()
    WHERE o.id = org_uuid
      AND o.owner_id = auth.uid()
      AND p.organization_id = o.id
      AND p.role = 'landlord'
      AND p.is_active = true
      AND COALESCE(o.is_active, true) = true
      AND o.archived_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION is_my_organization_owner()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT get_my_org_id() IS NOT NULL AND is_org_owner(get_my_org_id());
$$;

CREATE OR REPLACE FUNCTION enforce_organization_owner_controls()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  allow_owner_transfer BOOLEAN := COALESCE(current_setting('app.allow_owner_transfer', true), '') = 'true';
  actor_is_service_role BOOLEAN := auth.role() = 'service_role';
  owner_sensitive_settings_changed BOOLEAN := false;
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  IF actor_is_service_role THEN
    RETURN NEW;
  END IF;

  owner_sensitive_settings_changed :=
    COALESCE(NEW.settings->>'mpesa_consumer_key', '') IS DISTINCT FROM COALESCE(OLD.settings->>'mpesa_consumer_key', '')
    OR COALESCE(NEW.settings->>'mpesa_consumer_secret', '') IS DISTINCT FROM COALESCE(OLD.settings->>'mpesa_consumer_secret', '')
    OR COALESCE(NEW.settings->>'sms_api_key', '') IS DISTINCT FROM COALESCE(OLD.settings->>'sms_api_key', '')
    OR COALESCE(NEW.settings->>'sms_partner_id', '') IS DISTINCT FROM COALESCE(OLD.settings->>'sms_partner_id', '')
    OR COALESCE(NEW.settings->>'sms_shortcode', '') IS DISTINCT FROM COALESCE(OLD.settings->>'sms_shortcode', '')
    OR COALESCE(NEW.settings->'sms_automation', '{}'::jsonb) IS DISTINCT FROM COALESCE(OLD.settings->'sms_automation', '{}'::jsonb);

  IF NEW.owner_id IS DISTINCT FROM OLD.owner_id AND NOT allow_owner_transfer THEN
    RAISE EXCEPTION 'Organization ownership can only be changed through the ownership transfer flow.';
  END IF;

  IF NOT is_org_owner(OLD.id) THEN
    IF NEW.name IS DISTINCT FROM OLD.name
      OR NEW.slug IS DISTINCT FROM OLD.slug
      OR NEW.logo_url IS DISTINCT FROM OLD.logo_url
      OR NEW.subscription_plan IS DISTINCT FROM OLD.subscription_plan
      OR NEW.mpesa_shortcode IS DISTINCT FROM OLD.mpesa_shortcode
      OR NEW.mpesa_nominated_number IS DISTINCT FROM OLD.mpesa_nominated_number
      OR NEW.mpesa_env IS DISTINCT FROM OLD.mpesa_env
      OR owner_sensitive_settings_changed
    THEN
      RAISE EXCEPTION 'Only the landlord can update owner-sensitive organization controls.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_organization_owner_controls ON organizations;

CREATE TRIGGER trg_enforce_organization_owner_controls
BEFORE UPDATE ON organizations
FOR EACH ROW
EXECUTE FUNCTION enforce_organization_owner_controls();

CREATE OR REPLACE FUNCTION enforce_profile_owner_controls()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  allow_owner_transfer BOOLEAN := COALESCE(current_setting('app.allow_owner_transfer', true), '') = 'true';
  actor_is_service_role BOOLEAN := auth.role() = 'service_role';
  actor_is_owner BOOLEAN := is_my_organization_owner();
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  IF actor_is_service_role THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF OLD.id = auth.uid() AND OLD.role = 'landlord' AND NOT allow_owner_transfer THEN
      RAISE EXCEPTION 'Landlord role changes must use the ownership transfer flow.';
    END IF;

    IF (NEW.role = 'landlord' OR OLD.role = 'landlord') AND NOT allow_owner_transfer THEN
      RAISE EXCEPTION 'Landlord role changes must use the ownership transfer flow.';
    END IF;

    IF NOT allow_owner_transfer AND NOT actor_is_owner THEN
      RAISE EXCEPTION 'Only the landlord can change admin governance roles.';
    END IF;

    IF NOT allow_owner_transfer AND OLD.organization_id IS DISTINCT FROM get_my_org_id() THEN
      RAISE EXCEPTION 'You can only change roles within your organization.';
    END IF;
  END IF;

  IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
    IF OLD.role = 'landlord' THEN
      RAISE EXCEPTION 'The landlord account cannot be enabled or disabled from team management.';
    END IF;

    IF OLD.role = 'admin' AND NOT actor_is_owner THEN
      RAISE EXCEPTION 'Only the landlord can enable or disable admin accounts.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_profile_owner_controls ON profiles;

CREATE TRIGGER trg_enforce_profile_owner_controls
BEFORE UPDATE OF role, is_active ON profiles
FOR EACH ROW
EXECUTE FUNCTION enforce_profile_owner_controls();

DROP POLICY IF EXISTS organizations_delete_admin ON organizations;
DROP POLICY IF EXISTS organizations_delete_owner ON organizations;

CREATE POLICY organizations_delete_owner ON organizations
FOR DELETE USING (is_org_owner(id));

CREATE OR REPLACE FUNCTION transfer_organization_ownership(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_org_id UUID := get_my_org_id();
  current_owner_id UUID := auth.uid();
  target_profile profiles%ROWTYPE;
BEGIN
  IF current_org_id IS NULL OR NOT is_org_owner(current_org_id) THEN
    RAISE EXCEPTION 'Only the current landlord can transfer organization ownership.';
  END IF;

  SELECT *
  INTO target_profile
  FROM profiles
  WHERE id = target_user_id
    AND organization_id = current_org_id
    AND is_active = true
    AND role IN ('admin', 'agent');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ownership can only be transferred to an active admin or agent in the same organization.';
  END IF;

  PERFORM set_config('app.allow_owner_transfer', 'true', true);

  UPDATE profiles
  SET role = 'landlord',
      updated_at = now()
  WHERE id = target_user_id;

  UPDATE profiles
  SET role = 'admin',
      updated_at = now()
  WHERE id = current_owner_id;

  UPDATE organizations
  SET owner_id = target_user_id,
      updated_at = now()
  WHERE id = current_org_id;
END;
$$;

REVOKE ALL ON FUNCTION transfer_organization_ownership(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION transfer_organization_ownership(UUID) TO authenticated;
