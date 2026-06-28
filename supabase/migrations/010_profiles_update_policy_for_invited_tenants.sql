-- Allow staff roles to attach unassigned tenant profiles to their organization
-- while still preventing cross-organization profile reassignment.
DROP POLICY IF EXISTS profiles_update_self_or_staff ON profiles;

CREATE POLICY profiles_update_self_or_staff ON profiles
FOR UPDATE USING (
  id = auth.uid()
  OR (
    get_my_role() IN ('admin', 'landlord', 'agent')
    AND (
      organization_id = get_my_org_id()
      OR organization_id IS NULL
    )
  )
)
WITH CHECK (
  id = auth.uid()
  OR (
    get_my_role() IN ('admin', 'landlord', 'agent')
    AND organization_id = get_my_org_id()
  )
);
