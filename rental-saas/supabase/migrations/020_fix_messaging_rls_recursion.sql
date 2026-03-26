CREATE OR REPLACE FUNCTION is_conversation_member(conversation_uuid UUID, profile_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM conversation_members cm
    WHERE cm.conversation_id = conversation_uuid
      AND cm.profile_id = profile_uuid
  );
$$;

CREATE OR REPLACE FUNCTION can_agent_access_conversation(conversation_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM conversations c
    WHERE c.id = conversation_uuid
      AND c.property_id IS NOT NULL
      AND is_assigned_agent_for_property(c.property_id)
      AND is_conversation_member(c.id, auth.uid())
  );
$$;

DROP POLICY IF EXISTS conversations_agent_select_assigned ON conversations;
CREATE POLICY conversations_agent_select_assigned ON conversations
FOR SELECT USING (
  get_my_role() = 'agent'
  AND can_agent_access_conversation(id)
);

DROP POLICY IF EXISTS conversation_members_agent_select_conversation ON conversation_members;
CREATE POLICY conversation_members_agent_select_conversation ON conversation_members
FOR SELECT USING (
  get_my_role() = 'agent'
  AND can_agent_access_conversation(conversation_id)
);
