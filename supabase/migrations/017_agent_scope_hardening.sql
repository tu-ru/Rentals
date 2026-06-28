CREATE TABLE IF NOT EXISTS agent_property_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  UNIQUE(agent_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_agent_property_assignments_agent ON agent_property_assignments(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_property_assignments_org ON agent_property_assignments(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_property_assignments_property ON agent_property_assignments(property_id);

ALTER TABLE agent_property_assignments ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_assigned_agent_for_property(property_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM agent_property_assignments apa
    JOIN profiles p ON p.id = apa.agent_id
    JOIN organizations o ON o.id = apa.organization_id
    WHERE apa.agent_id = auth.uid()
      AND apa.property_id = property_uuid
      AND p.role = 'agent'
      AND p.is_active = true
      AND o.is_active = true
      AND o.archived_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION is_assigned_agent_for_unit(unit_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM units u
    WHERE u.id = unit_uuid
      AND is_assigned_agent_for_property(u.property_id)
  );
$$;

CREATE OR REPLACE FUNCTION is_assigned_agent_for_tenant(tenant_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM leases l
    JOIN units u ON u.id = l.unit_id
    WHERE l.tenant_id = tenant_uuid
      AND is_assigned_agent_for_property(u.property_id)
  );
$$;

CREATE OR REPLACE FUNCTION can_agent_manage_maintenance_row(target_assigned_to UUID, target_unit_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT (
    get_my_role() = 'agent'
    AND is_assigned_agent_for_unit(target_unit_id)
    AND (
      target_assigned_to IS NULL
      OR target_assigned_to = auth.uid()
    )
  );
$$;

CREATE OR REPLACE FUNCTION enforce_agent_maintenance_update_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF get_my_role() = 'agent' THEN
    IF NEW.organization_id <> OLD.organization_id
      OR NEW.unit_id <> OLD.unit_id
      OR NEW.tenant_id <> OLD.tenant_id
      OR NEW.title <> OLD.title
      OR NEW.description <> OLD.description
      OR NEW.category <> OLD.category
      OR NEW.priority <> OLD.priority
      OR NEW.images IS DISTINCT FROM OLD.images
    THEN
      RAISE EXCEPTION 'Agents can only update maintenance workflow fields.';
    END IF;

    IF NEW.assigned_to IS NOT NULL AND NEW.assigned_to <> auth.uid() THEN
      RAISE EXCEPTION 'Agents can only assign maintenance requests to themselves.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_agent_maintenance_update_fields ON maintenance_requests;

CREATE TRIGGER trg_enforce_agent_maintenance_update_fields
BEFORE UPDATE ON maintenance_requests
FOR EACH ROW
EXECUTE FUNCTION enforce_agent_maintenance_update_fields();

DROP POLICY IF EXISTS profiles_select_same_org ON profiles;
DROP POLICY IF EXISTS profiles_insert_staff ON profiles;
DROP POLICY IF EXISTS profiles_update_self_or_staff ON profiles;
DROP POLICY IF EXISTS profiles_delete_staff ON profiles;

CREATE POLICY profiles_select_self ON profiles
FOR SELECT USING (id = auth.uid());

CREATE POLICY profiles_select_same_org_staff ON profiles
FOR SELECT USING (
  organization_id = get_my_org_id()
  AND get_my_role() IN ('admin', 'landlord')
);

CREATE POLICY profiles_select_agent_staff_context ON profiles
FOR SELECT USING (
  get_my_role() = 'agent'
  AND organization_id = get_my_org_id()
  AND role IN ('admin', 'landlord', 'agent')
);

CREATE POLICY profiles_select_agent_assigned_tenants ON profiles
FOR SELECT USING (
  get_my_role() = 'agent'
  AND role = 'tenant'
  AND is_assigned_agent_for_tenant(id)
);

CREATE POLICY profiles_insert_staff ON profiles
FOR INSERT WITH CHECK (
  organization_id = get_my_org_id()
  AND get_my_role() IN ('admin', 'landlord')
);

CREATE POLICY profiles_update_self_or_staff ON profiles
FOR UPDATE USING (
  id = auth.uid()
  OR (organization_id = get_my_org_id() AND get_my_role() IN ('admin', 'landlord'))
)
WITH CHECK (
  id = auth.uid()
  OR (organization_id = get_my_org_id() AND get_my_role() IN ('admin', 'landlord'))
);

CREATE POLICY profiles_delete_staff ON profiles
FOR DELETE USING (
  organization_id = get_my_org_id()
  AND get_my_role() IN ('admin', 'landlord')
);

DROP POLICY IF EXISTS organizations_update_owner ON organizations;
CREATE POLICY organizations_update_landlord_admin ON organizations
FOR UPDATE USING (
  EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid()
      AND p.organization_id = organizations.id
      AND p.role IN ('admin', 'landlord')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid()
      AND p.organization_id = organizations.id
      AND p.role IN ('admin', 'landlord')
  )
);

DROP POLICY IF EXISTS properties_staff_all ON properties;
CREATE POLICY properties_landlord_admin_all ON properties
FOR ALL USING (
  organization_id = get_my_org_id()
  AND get_my_role() IN ('admin', 'landlord')
)
WITH CHECK (
  organization_id = get_my_org_id()
  AND get_my_role() IN ('admin', 'landlord')
);

CREATE POLICY properties_agent_select_assigned ON properties
FOR SELECT USING (
  get_my_role() = 'agent'
  AND is_assigned_agent_for_property(id)
);

DROP POLICY IF EXISTS units_staff_all ON units;
CREATE POLICY units_landlord_admin_all ON units
FOR ALL USING (
  organization_id = get_my_org_id()
  AND get_my_role() IN ('admin', 'landlord')
)
WITH CHECK (
  organization_id = get_my_org_id()
  AND get_my_role() IN ('admin', 'landlord')
);

CREATE POLICY units_agent_select_assigned ON units
FOR SELECT USING (
  get_my_role() = 'agent'
  AND is_assigned_agent_for_property(property_id)
);

DROP POLICY IF EXISTS leases_staff_all ON leases;
CREATE POLICY leases_landlord_admin_all ON leases
FOR ALL USING (
  organization_id = get_my_org_id()
  AND get_my_role() IN ('admin', 'landlord')
)
WITH CHECK (
  organization_id = get_my_org_id()
  AND get_my_role() IN ('admin', 'landlord')
);

CREATE POLICY leases_agent_select_assigned ON leases
FOR SELECT USING (
  get_my_role() = 'agent'
  AND is_assigned_agent_for_unit(unit_id)
);

DROP POLICY IF EXISTS invoices_staff_all ON invoices;
CREATE POLICY invoices_landlord_admin_all ON invoices
FOR ALL USING (
  organization_id = get_my_org_id()
  AND get_my_role() IN ('admin', 'landlord')
)
WITH CHECK (
  organization_id = get_my_org_id()
  AND get_my_role() IN ('admin', 'landlord')
);

DROP POLICY IF EXISTS payments_staff_all ON payments;
CREATE POLICY payments_landlord_admin_all ON payments
FOR ALL USING (
  organization_id = get_my_org_id()
  AND get_my_role() IN ('admin', 'landlord')
)
WITH CHECK (
  organization_id = get_my_org_id()
  AND get_my_role() IN ('admin', 'landlord')
);

DROP POLICY IF EXISTS expenses_staff_all ON expenses;
CREATE POLICY expenses_landlord_admin_all ON expenses
FOR ALL USING (
  organization_id = get_my_org_id()
  AND get_my_role() IN ('admin', 'landlord')
)
WITH CHECK (
  organization_id = get_my_org_id()
  AND get_my_role() IN ('admin', 'landlord')
);

DROP POLICY IF EXISTS mpesa_pull_logs_staff_all ON mpesa_pull_logs;
CREATE POLICY mpesa_pull_logs_landlord_admin_all ON mpesa_pull_logs
FOR ALL USING (
  organization_id = get_my_org_id()
  AND get_my_role() IN ('admin', 'landlord')
)
WITH CHECK (
  organization_id = get_my_org_id()
  AND get_my_role() IN ('admin', 'landlord')
);

DROP POLICY IF EXISTS notifications_staff_all ON notifications;
CREATE POLICY notifications_landlord_admin_all ON notifications
FOR ALL USING (
  organization_id = get_my_org_id()
  AND get_my_role() IN ('admin', 'landlord')
)
WITH CHECK (
  organization_id = get_my_org_id()
  AND get_my_role() IN ('admin', 'landlord')
);

DROP POLICY IF EXISTS maintenance_staff_all ON maintenance_requests;
CREATE POLICY maintenance_landlord_admin_all ON maintenance_requests
FOR ALL USING (
  organization_id = get_my_org_id()
  AND get_my_role() IN ('admin', 'landlord')
)
WITH CHECK (
  organization_id = get_my_org_id()
  AND get_my_role() IN ('admin', 'landlord')
);

CREATE POLICY maintenance_agent_select_assigned ON maintenance_requests
FOR SELECT USING (
  get_my_role() = 'agent'
  AND is_assigned_agent_for_unit(unit_id)
);

CREATE POLICY maintenance_agent_update_assigned ON maintenance_requests
FOR UPDATE USING (
  can_agent_manage_maintenance_row(assigned_to, unit_id)
)
WITH CHECK (
  can_agent_manage_maintenance_row(assigned_to, unit_id)
);

DROP POLICY IF EXISTS conversations_staff_all ON conversations;
CREATE POLICY conversations_landlord_admin_all ON conversations
FOR ALL USING (
  organization_id = get_my_org_id()
  AND get_my_role() IN ('admin', 'landlord')
)
WITH CHECK (
  organization_id = get_my_org_id()
  AND get_my_role() IN ('admin', 'landlord')
);

CREATE POLICY conversations_agent_select_assigned ON conversations
FOR SELECT USING (
  get_my_role() = 'agent'
  AND property_id IS NOT NULL
  AND is_assigned_agent_for_property(property_id)
  AND EXISTS (
    SELECT 1
    FROM conversation_members cm
    WHERE cm.conversation_id = conversations.id
      AND cm.profile_id = auth.uid()
  )
);

CREATE POLICY conversations_agent_insert_assigned ON conversations
FOR INSERT WITH CHECK (
  get_my_role() = 'agent'
  AND created_by = auth.uid()
  AND organization_id = get_my_org_id()
  AND property_id IS NOT NULL
  AND is_assigned_agent_for_property(property_id)
);

DROP POLICY IF EXISTS conversation_members_staff_all ON conversation_members;
DROP POLICY IF EXISTS conversation_members_select_self ON conversation_members;

CREATE POLICY conversation_members_landlord_admin_all ON conversation_members
FOR ALL USING (
  EXISTS (
    SELECT 1
    FROM conversations c
    WHERE c.id = conversation_members.conversation_id
      AND c.organization_id = get_my_org_id()
      AND get_my_role() IN ('admin', 'landlord')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM conversations c
    WHERE c.id = conversation_members.conversation_id
      AND c.organization_id = get_my_org_id()
      AND get_my_role() IN ('admin', 'landlord')
  )
);

CREATE POLICY conversation_members_select_self ON conversation_members
FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY conversation_members_agent_select_conversation ON conversation_members
FOR SELECT USING (
  get_my_role() = 'agent'
  AND EXISTS (
    SELECT 1
    FROM conversations c
    JOIN conversation_members self_cm ON self_cm.conversation_id = c.id
    WHERE c.id = conversation_members.conversation_id
      AND c.property_id IS NOT NULL
      AND is_assigned_agent_for_property(c.property_id)
      AND self_cm.profile_id = auth.uid()
  )
);

CREATE POLICY conversation_members_agent_insert_assigned ON conversation_members
FOR INSERT WITH CHECK (
  get_my_role() = 'agent'
  AND EXISTS (
    SELECT 1
    FROM conversations c
    WHERE c.id = conversation_members.conversation_id
      AND c.created_by = auth.uid()
      AND c.property_id IS NOT NULL
      AND is_assigned_agent_for_property(c.property_id)
  )
  AND (
    profile_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM leases l
      JOIN units u ON u.id = l.unit_id
      JOIN conversations c ON c.id = conversation_members.conversation_id
      WHERE l.tenant_id = conversation_members.profile_id
        AND c.property_id = u.property_id
        AND is_assigned_agent_for_property(c.property_id)
    )
  )
);

DROP POLICY IF EXISTS messages_staff_all ON messages;
CREATE POLICY messages_landlord_admin_all ON messages
FOR ALL USING (
  EXISTS (
    SELECT 1
    FROM conversations c
    WHERE c.id = messages.conversation_id
      AND c.organization_id = get_my_org_id()
      AND get_my_role() IN ('admin', 'landlord')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM conversations c
    WHERE c.id = messages.conversation_id
      AND c.organization_id = get_my_org_id()
      AND get_my_role() IN ('admin', 'landlord')
  )
);

CREATE POLICY agent_property_assignments_manage_org ON agent_property_assignments
FOR ALL USING (
  organization_id = get_my_org_id()
  AND get_my_role() IN ('admin', 'landlord')
)
WITH CHECK (
  organization_id = get_my_org_id()
  AND get_my_role() IN ('admin', 'landlord')
);

CREATE POLICY agent_property_assignments_select_self ON agent_property_assignments
FOR SELECT USING (
  agent_id = auth.uid()
);
