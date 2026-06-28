CREATE OR REPLACE FUNCTION sync_unit_status_with_lease_lifecycle()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_unit_id UUID;
  has_active_lease BOOLEAN;
BEGIN
  target_unit_id := COALESCE(NEW.unit_id, OLD.unit_id);

  IF target_unit_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM leases l
    WHERE l.unit_id = target_unit_id
      AND l.status = 'active'
      AND l.id <> COALESCE(OLD.id, '00000000-0000-0000-0000-000000000000'::uuid)
  )
  INTO has_active_lease;

  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'active' THEN
      UPDATE units SET status = 'occupied' WHERE id = NEW.unit_id;
    ELSIF NOT has_active_lease THEN
      UPDATE units SET status = 'vacant' WHERE id = NEW.unit_id AND status = 'occupied';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'active' THEN
      UPDATE units SET status = 'occupied' WHERE id = NEW.unit_id;
    ELSIF OLD.status = 'active' AND NEW.status IN ('terminated', 'expired', 'pending') AND NOT has_active_lease THEN
      UPDATE units SET status = 'vacant' WHERE id = NEW.unit_id AND status = 'occupied';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF OLD.status = 'active' AND NOT has_active_lease THEN
      UPDATE units SET status = 'vacant' WHERE id = OLD.unit_id AND status = 'occupied';
    END IF;
    RETURN OLD;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_unit_status_with_lease_lifecycle ON leases;

CREATE TRIGGER trg_sync_unit_status_with_lease_lifecycle
AFTER INSERT OR UPDATE OR DELETE ON leases
FOR EACH ROW
EXECUTE FUNCTION sync_unit_status_with_lease_lifecycle();
