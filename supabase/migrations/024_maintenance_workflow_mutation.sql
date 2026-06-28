CREATE OR REPLACE FUNCTION update_maintenance_workflow(
  p_request_id UUID,
  p_assigned_to UUID DEFAULT NULL,
  p_assignment_provided BOOLEAN DEFAULT FALSE,
  p_status maintenance_status DEFAULT NULL,
  p_resolution_notes TEXT DEFAULT NULL
)
RETURNS maintenance_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor profiles%ROWTYPE;
  v_request maintenance_requests%ROWTYPE;
  v_assignee profiles%ROWTYPE;
  v_next_assigned_to UUID;
  v_next_status maintenance_status;
  v_resolution_notes TEXT;
  v_resolved_at TIMESTAMPTZ;
  v_updated maintenance_requests%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated.';
  END IF;

  SELECT *
  INTO v_actor
  FROM profiles
  WHERE id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for current user.';
  END IF;

  SELECT *
  INTO v_request
  FROM maintenance_requests
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Maintenance request not found.';
  END IF;

  IF v_request.organization_id IS DISTINCT FROM v_actor.organization_id THEN
    RAISE EXCEPTION 'Maintenance request is outside your organization.';
  END IF;

  IF v_actor.role NOT IN ('admin', 'landlord', 'agent') THEN
    RAISE EXCEPTION 'Only staff can update maintenance workflow.';
  END IF;

  v_next_assigned_to := CASE
    WHEN p_assignment_provided THEN p_assigned_to
    ELSE v_request.assigned_to
  END;

  IF v_actor.role = 'agent' THEN
    IF NOT can_agent_manage_maintenance_row(v_request.assigned_to, v_request.unit_id) THEN
      RAISE EXCEPTION 'You do not have access to this maintenance request.';
    END IF;

    IF p_assigned_to IS NOT NULL AND p_assigned_to <> auth.uid() THEN
      RAISE EXCEPTION 'Agents can only assign maintenance requests to themselves.';
    END IF;
  END IF;

  IF v_next_assigned_to IS NOT NULL THEN
    SELECT *
    INTO v_assignee
    FROM profiles
    WHERE id = v_next_assigned_to;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Assigned staff member not found.';
    END IF;

    IF v_assignee.organization_id IS DISTINCT FROM v_request.organization_id THEN
      RAISE EXCEPTION 'Assigned staff member must belong to the same organization.';
    END IF;

    IF v_assignee.role NOT IN ('admin', 'landlord', 'agent') OR v_assignee.is_active IS DISTINCT FROM TRUE THEN
      RAISE EXCEPTION 'Assigned staff member must be an active staff account.';
    END IF;
  END IF;

  v_next_status := COALESCE(p_status, v_request.status);

  IF p_assignment_provided
    AND p_assigned_to IS DISTINCT FROM v_request.assigned_to
    AND p_status IS NULL
    AND v_request.status = 'open'
  THEN
    v_next_status := 'assigned';
  END IF;

  IF v_next_status = 'assigned' AND v_next_assigned_to IS NULL THEN
    RAISE EXCEPTION 'Assigned status requires an assignee.';
  END IF;

  v_resolution_notes := NULLIF(BTRIM(COALESCE(p_resolution_notes, '')), '');
  v_resolved_at := v_request.resolved_at;

  IF v_next_status = 'resolved' THEN
    IF v_resolution_notes IS NULL AND NULLIF(BTRIM(COALESCE(v_request.resolution_notes, '')), '') IS NULL THEN
      RAISE EXCEPTION 'Resolution notes are required when resolving a request.';
    END IF;

    v_resolution_notes := COALESCE(v_resolution_notes, v_request.resolution_notes);
    v_resolved_at := COALESCE(v_request.resolved_at, now());
  ELSIF v_next_status = 'closed' THEN
    IF v_resolution_notes IS NOT NULL THEN
      v_resolution_notes := v_resolution_notes;
    ELSE
      v_resolution_notes := v_request.resolution_notes;
    END IF;
    v_resolved_at := COALESCE(v_request.resolved_at, CASE WHEN v_resolution_notes IS NOT NULL THEN now() ELSE NULL END);
  ELSE
    v_resolution_notes := NULL;
    v_resolved_at := NULL;
  END IF;

  UPDATE maintenance_requests
  SET
    assigned_to = v_next_assigned_to,
    status = v_next_status,
    resolution_notes = v_resolution_notes,
    resolved_at = v_resolved_at
  WHERE id = v_request.id
  RETURNING *
  INTO v_updated;

  RETURN v_updated;
END;
$$;
