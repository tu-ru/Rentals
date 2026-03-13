-- Allow organization creators (owners) to read their own organization rows immediately
-- after insert, even before their profile.organization_id is linked.
CREATE POLICY organizations_select_owner ON organizations
FOR SELECT USING (owner_id = auth.uid());
