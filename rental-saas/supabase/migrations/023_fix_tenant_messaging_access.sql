CREATE POLICY conversations_member_select_self ON conversations
FOR SELECT USING (
  is_conversation_member(id)
);

CREATE POLICY conversations_tenant_insert_self ON conversations
FOR INSERT WITH CHECK (
  get_my_role() = 'tenant'
  AND created_by = auth.uid()
  AND organization_id = get_my_org_id()
);

CREATE POLICY conversation_members_tenant_insert_own_conversation ON conversation_members
FOR INSERT WITH CHECK (
  get_my_role() = 'tenant'
  AND EXISTS (
    SELECT 1
    FROM conversations c
    WHERE c.id = conversation_members.conversation_id
      AND c.created_by = auth.uid()
      AND c.organization_id = get_my_org_id()
  )
  AND (
    profile_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = conversation_members.profile_id
        AND p.organization_id = get_my_org_id()
        AND p.role IN ('landlord', 'admin', 'agent')
        AND p.is_active = true
    )
  )
);
