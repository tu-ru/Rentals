CREATE OR REPLACE FUNCTION get_my_org_id() RETURNS UUID AS $$
  SELECT p.organization_id
  FROM profiles p
  JOIN organizations o ON o.id = p.organization_id
  WHERE p.id = auth.uid()
    AND o.is_active = true
    AND o.archived_at IS NULL
$$ LANGUAGE sql SECURITY DEFINER STABLE;

DROP POLICY IF EXISTS leases_tenant_select ON leases;
CREATE POLICY leases_tenant_select ON leases
FOR SELECT USING (
  tenant_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM organizations o
    JOIN profiles p ON p.organization_id = o.id
    WHERE p.id = auth.uid()
      AND o.id = leases.organization_id
      AND o.is_active = true
      AND o.archived_at IS NULL
  )
);

DROP POLICY IF EXISTS invoices_tenant_select ON invoices;
CREATE POLICY invoices_tenant_select ON invoices
FOR SELECT USING (
  tenant_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM organizations o
    JOIN profiles p ON p.organization_id = o.id
    WHERE p.id = auth.uid()
      AND o.id = invoices.organization_id
      AND o.is_active = true
      AND o.archived_at IS NULL
  )
);

DROP POLICY IF EXISTS payments_tenant_select ON payments;
CREATE POLICY payments_tenant_select ON payments
FOR SELECT USING (
  tenant_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM organizations o
    JOIN profiles p ON p.organization_id = o.id
    WHERE p.id = auth.uid()
      AND o.id = payments.organization_id
      AND o.is_active = true
      AND o.archived_at IS NULL
  )
);

DROP POLICY IF EXISTS maintenance_tenant_select ON maintenance_requests;
CREATE POLICY maintenance_tenant_select ON maintenance_requests
FOR SELECT USING (
  tenant_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM organizations o
    JOIN profiles p ON p.organization_id = o.id
    WHERE p.id = auth.uid()
      AND o.id = maintenance_requests.organization_id
      AND o.is_active = true
      AND o.archived_at IS NULL
  )
);
