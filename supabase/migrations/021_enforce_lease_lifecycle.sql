CREATE OR REPLACE FUNCTION enforce_lease_lifecycle()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status NOT IN ('pending', 'active') THEN
      RAISE EXCEPTION 'New leases can only start as pending or active.';
    END IF;
  END IF;

  IF NEW.status = 'terminated' THEN
    IF NEW.termination_reason IS NULL OR btrim(NEW.termination_reason) = '' THEN
      RAISE EXCEPTION 'Terminated leases require a termination reason.';
    END IF;

    IF NEW.terminated_at IS NULL THEN
      NEW.terminated_at := now();
    END IF;
  ELSE
    NEW.termination_reason := NULL;
    NEW.terminated_at := NULL;
  END IF;

  IF NEW.status = 'expired' AND (NEW.end_date IS NULL OR NEW.end_date >= CURRENT_DATE) THEN
    RAISE EXCEPTION 'Expired leases must have an end date in the past.';
  END IF;

  IF NEW.status = 'active' AND NEW.end_date IS NOT NULL AND NEW.end_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Active leases cannot have an end date in the past.';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'terminated' AND ROW(NEW.*) IS DISTINCT FROM ROW(OLD.*) THEN
      RAISE EXCEPTION 'Terminated leases are immutable.';
    END IF;

    IF OLD.status <> NEW.status THEN
      IF NOT (
        (OLD.status = 'pending' AND NEW.status IN ('active', 'terminated')) OR
        (OLD.status = 'active' AND NEW.status IN ('expired', 'terminated')) OR
        (OLD.status = 'expired' AND NEW.status IN ('active', 'terminated'))
      ) THEN
        RAISE EXCEPTION 'Invalid lease status transition: % -> %', OLD.status, NEW.status;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_lease_lifecycle ON leases;

CREATE TRIGGER trg_enforce_lease_lifecycle
BEFORE INSERT OR UPDATE ON leases
FOR EACH ROW
EXECUTE FUNCTION enforce_lease_lifecycle();
