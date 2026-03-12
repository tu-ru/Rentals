ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE mpesa_pull_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION get_my_org_id() RETURNS UUID AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_my_role() RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- organizations
CREATE POLICY organizations_select_members ON organizations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.organization_id = organizations.id
      AND p.id = auth.uid()
  )
);

CREATE POLICY organizations_insert_owner ON organizations
FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY organizations_update_owner ON organizations
FOR UPDATE USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY organizations_delete_admin ON organizations
FOR DELETE USING (owner_id = auth.uid() OR get_my_role() = 'admin');

-- profiles
CREATE POLICY profiles_select_same_org ON profiles
FOR SELECT USING (
  organization_id = get_my_org_id()
  OR id = auth.uid()
);

CREATE POLICY profiles_insert_staff ON profiles
FOR INSERT WITH CHECK (
  organization_id = get_my_org_id()
  AND get_my_role() IN ('admin', 'landlord', 'agent')
);

CREATE POLICY profiles_update_self_or_staff ON profiles
FOR UPDATE USING (
  id = auth.uid()
  OR (organization_id = get_my_org_id() AND get_my_role() IN ('admin', 'landlord', 'agent'))
)
WITH CHECK (
  id = auth.uid()
  OR (organization_id = get_my_org_id() AND get_my_role() IN ('admin', 'landlord', 'agent'))
);

CREATE POLICY profiles_delete_staff ON profiles
FOR DELETE USING (
  organization_id = get_my_org_id()
  AND get_my_role() IN ('admin', 'landlord', 'agent')
);

-- organization-scoped staff CRUD
CREATE POLICY properties_staff_all ON properties
FOR ALL USING (
  organization_id = get_my_org_id()
  AND get_my_role() IN ('admin', 'landlord', 'agent')
)
WITH CHECK (
  organization_id = get_my_org_id()
  AND get_my_role() IN ('admin', 'landlord', 'agent')
);

CREATE POLICY units_staff_all ON units
FOR ALL USING (
  organization_id = get_my_org_id()
  AND get_my_role() IN ('admin', 'landlord', 'agent')
)
WITH CHECK (
  organization_id = get_my_org_id()
  AND get_my_role() IN ('admin', 'landlord', 'agent')
);

CREATE POLICY leases_staff_all ON leases
FOR ALL USING (
  organization_id = get_my_org_id()
  AND get_my_role() IN ('admin', 'landlord', 'agent')
)
WITH CHECK (
  organization_id = get_my_org_id()
  AND get_my_role() IN ('admin', 'landlord', 'agent')
);

CREATE POLICY invoices_staff_all ON invoices
FOR ALL USING (
  organization_id = get_my_org_id()
  AND get_my_role() IN ('admin', 'landlord', 'agent')
)
WITH CHECK (
  organization_id = get_my_org_id()
  AND get_my_role() IN ('admin', 'landlord', 'agent')
);

CREATE POLICY payments_staff_all ON payments
FOR ALL USING (
  organization_id = get_my_org_id()
  AND get_my_role() IN ('admin', 'landlord', 'agent')
)
WITH CHECK (
  organization_id = get_my_org_id()
  AND get_my_role() IN ('admin', 'landlord', 'agent')
);

CREATE POLICY maintenance_staff_all ON maintenance_requests
FOR ALL USING (
  organization_id = get_my_org_id()
  AND get_my_role() IN ('admin', 'landlord', 'agent')
)
WITH CHECK (
  organization_id = get_my_org_id()
  AND get_my_role() IN ('admin', 'landlord', 'agent')
);

CREATE POLICY conversations_staff_all ON conversations
FOR ALL USING (
  organization_id = get_my_org_id()
  AND get_my_role() IN ('admin', 'landlord', 'agent')
)
WITH CHECK (
  organization_id = get_my_org_id()
  AND get_my_role() IN ('admin', 'landlord', 'agent')
);

CREATE POLICY conversation_members_staff_all ON conversation_members
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_members.conversation_id
      AND c.organization_id = get_my_org_id()
      AND get_my_role() IN ('admin', 'landlord', 'agent')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_members.conversation_id
      AND c.organization_id = get_my_org_id()
      AND get_my_role() IN ('admin', 'landlord', 'agent')
  )
);

CREATE POLICY messages_staff_all ON messages
FOR ALL USING (
  EXISTS (
    SELECT 1
    FROM conversations c
    WHERE c.id = messages.conversation_id
      AND c.organization_id = get_my_org_id()
      AND get_my_role() IN ('admin', 'landlord', 'agent')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM conversations c
    WHERE c.id = messages.conversation_id
      AND c.organization_id = get_my_org_id()
      AND get_my_role() IN ('admin', 'landlord', 'agent')
  )
);

CREATE POLICY notifications_staff_all ON notifications
FOR ALL USING (
  organization_id = get_my_org_id()
  AND get_my_role() IN ('admin', 'landlord', 'agent')
)
WITH CHECK (
  organization_id = get_my_org_id()
  AND get_my_role() IN ('admin', 'landlord', 'agent')
);

CREATE POLICY expenses_staff_all ON expenses
FOR ALL USING (
  organization_id = get_my_org_id()
  AND get_my_role() IN ('admin', 'landlord', 'agent')
)
WITH CHECK (
  organization_id = get_my_org_id()
  AND get_my_role() IN ('admin', 'landlord', 'agent')
);

CREATE POLICY mpesa_pull_logs_staff_all ON mpesa_pull_logs
FOR ALL USING (
  organization_id = get_my_org_id()
  AND get_my_role() IN ('admin', 'landlord', 'agent')
)
WITH CHECK (
  organization_id = get_my_org_id()
  AND get_my_role() IN ('admin', 'landlord', 'agent')
);

-- Tenant own-row access
CREATE POLICY leases_tenant_select ON leases
FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY invoices_tenant_select ON invoices
FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY payments_tenant_select ON payments
FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY maintenance_tenant_select ON maintenance_requests
FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY maintenance_tenant_insert ON maintenance_requests
FOR INSERT WITH CHECK (tenant_id = auth.uid() AND organization_id = get_my_org_id());

-- Messages: conversation members
CREATE POLICY messages_members_select ON messages
FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM conversation_members cm
    WHERE cm.conversation_id = messages.conversation_id
      AND cm.profile_id = auth.uid()
  )
);

CREATE POLICY messages_members_insert ON messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM conversation_members cm
    WHERE cm.conversation_id = messages.conversation_id
      AND cm.profile_id = auth.uid()
  )
);

-- Allow members to list their own conversation memberships
CREATE POLICY conversation_members_select_self ON conversation_members
FOR SELECT USING (profile_id = auth.uid());

-- Notifications: own only
CREATE POLICY notifications_own_select ON notifications
FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY notifications_own_update ON notifications
FOR UPDATE USING (recipient_id = auth.uid())
WITH CHECK (recipient_id = auth.uid());
