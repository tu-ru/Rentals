CREATE TABLE payment_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  allocated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  CONSTRAINT payment_allocations_amount_chk CHECK (amount > 0)
);

CREATE TABLE tenant_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source_payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  amount_remaining DECIMAL(12,2) NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  CONSTRAINT tenant_credits_amount_chk CHECK (amount_remaining >= 0)
);

CREATE TABLE credit_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  credit_id UUID NOT NULL REFERENCES tenant_credits(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  applied_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  CONSTRAINT credit_applications_amount_chk CHECK (amount > 0)
);

CREATE INDEX idx_payment_allocations_org ON payment_allocations(organization_id);
CREATE INDEX idx_payment_allocations_payment ON payment_allocations(payment_id);
CREATE INDEX idx_payment_allocations_invoice ON payment_allocations(invoice_id);
CREATE INDEX idx_tenant_credits_org_tenant ON tenant_credits(organization_id, tenant_id);
CREATE INDEX idx_tenant_credits_source_payment ON tenant_credits(source_payment_id);
CREATE INDEX idx_credit_applications_invoice ON credit_applications(invoice_id);
CREATE INDEX idx_credit_applications_credit ON credit_applications(credit_id);

ALTER TABLE payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY payment_allocations_staff_select ON payment_allocations
FOR SELECT USING (
  organization_id = get_my_org_id()
  AND get_my_role() IN ('admin', 'landlord')
);

CREATE POLICY payment_allocations_tenant_select ON payment_allocations
FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM invoices i
    WHERE i.id = payment_allocations.invoice_id
      AND i.tenant_id = auth.uid()
  )
);

CREATE POLICY tenant_credits_staff_select ON tenant_credits
FOR SELECT USING (
  organization_id = get_my_org_id()
  AND get_my_role() IN ('admin', 'landlord')
);

CREATE POLICY tenant_credits_tenant_select ON tenant_credits
FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY credit_applications_staff_select ON credit_applications
FOR SELECT USING (
  organization_id = get_my_org_id()
  AND get_my_role() IN ('admin', 'landlord')
);

CREATE POLICY credit_applications_tenant_select ON credit_applications
FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM invoices i
    WHERE i.id = credit_applications.invoice_id
      AND i.tenant_id = auth.uid()
  )
);

CREATE TRIGGER trg_tenant_credits_updated BEFORE UPDATE ON tenant_credits
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE OR REPLACE FUNCTION get_invoice_financial_status(
  p_amount_due DECIMAL,
  p_amount_paid DECIMAL,
  p_due_date DATE,
  p_current_status invoice_status
) RETURNS invoice_status
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  IF p_current_status = 'cancelled' THEN
    RETURN 'cancelled';
  END IF;

  IF COALESCE(p_amount_paid, 0) >= COALESCE(p_amount_due, 0) AND COALESCE(p_amount_due, 0) > 0 THEN
    RETURN 'paid';
  END IF;

  IF p_current_status = 'draft' THEN
    RETURN 'draft';
  END IF;

  IF p_due_date < CURRENT_DATE AND COALESCE(p_amount_paid, 0) < COALESCE(p_amount_due, 0) THEN
    RETURN 'overdue';
  END IF;

  RETURN 'sent';
END;
$$;

CREATE OR REPLACE FUNCTION sync_invoice_financials(p_invoice_id UUID)
RETURNS TABLE (
  amount_paid DECIMAL,
  balance DECIMAL,
  status invoice_status,
  cash_paid DECIMAL,
  credit_applied DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice invoices%ROWTYPE;
  v_cash_paid DECIMAL(12,2);
  v_credit_applied DECIMAL(12,2);
  v_amount_paid DECIMAL(12,2);
  v_status invoice_status;
BEGIN
  SELECT *
  INTO v_invoice
  FROM invoices
  WHERE id = p_invoice_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;

  SELECT COALESCE(SUM(amount), 0)
  INTO v_cash_paid
  FROM payment_allocations
  WHERE invoice_id = p_invoice_id;

  SELECT COALESCE(SUM(amount), 0)
  INTO v_credit_applied
  FROM credit_applications
  WHERE invoice_id = p_invoice_id;

  v_amount_paid := COALESCE(v_cash_paid, 0) + COALESCE(v_credit_applied, 0);
  v_status := get_invoice_financial_status(v_invoice.amount_due, v_amount_paid, v_invoice.due_date, v_invoice.status);

  UPDATE invoices
  SET amount_paid = v_amount_paid, status = v_status
  WHERE id = p_invoice_id;

  RETURN QUERY
  SELECT
    v_amount_paid,
    GREATEST(v_invoice.amount_due - v_amount_paid, 0),
    v_status,
    COALESCE(v_cash_paid, 0),
    COALESCE(v_credit_applied, 0);
END;
$$;

CREATE OR REPLACE FUNCTION record_invoice_payment(
  p_invoice_id UUID,
  p_amount DECIMAL,
  p_payment_method payment_method,
  p_mpesa_transaction_id TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
) RETURNS TABLE (
  payment_id UUID,
  invoice_id UUID,
  tenant_id UUID,
  allocated_amount DECIMAL,
  credit_amount DECIMAL,
  invoice_balance DECIMAL,
  invoice_status invoice_status
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice invoices%ROWTYPE;
  v_role user_role;
  v_payment_id UUID;
  v_allocated DECIMAL(12,2);
  v_credit DECIMAL(12,2);
  v_financial RECORD;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero.';
  END IF;

  v_role := get_my_role();
  IF v_role NOT IN ('admin', 'landlord') THEN
    RAISE EXCEPTION 'Not authorized to record payments.';
  END IF;

  SELECT *
  INTO v_invoice
  FROM invoices
  WHERE id = p_invoice_id
    AND organization_id = get_my_org_id()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found.';
  END IF;

  IF v_invoice.status = 'cancelled' THEN
    RAISE EXCEPTION 'Cancelled invoices cannot accept payments.';
  END IF;

  INSERT INTO payments (
    organization_id,
    invoice_id,
    lease_id,
    tenant_id,
    amount,
    payment_method,
    status,
    mpesa_transaction_id,
    recorded_by,
    notes
  )
  VALUES (
    v_invoice.organization_id,
    v_invoice.id,
    v_invoice.lease_id,
    v_invoice.tenant_id,
    p_amount,
    p_payment_method,
    'confirmed',
    p_mpesa_transaction_id,
    auth.uid(),
    p_notes
  )
  RETURNING id INTO v_payment_id;

  v_allocated := LEAST(
    p_amount,
    GREATEST(v_invoice.amount_due - COALESCE(v_invoice.amount_paid, 0), 0)
  );
  v_credit := GREATEST(p_amount - v_allocated, 0);

  IF v_allocated > 0 THEN
    INSERT INTO payment_allocations (
      organization_id,
      payment_id,
      invoice_id,
      amount,
      allocated_by
    )
    VALUES (
      v_invoice.organization_id,
      v_payment_id,
      v_invoice.id,
      v_allocated,
      auth.uid()
    );
  END IF;

  IF v_credit > 0 THEN
    INSERT INTO tenant_credits (
      organization_id,
      tenant_id,
      source_payment_id,
      amount_remaining,
      notes,
      created_by
    )
    VALUES (
      v_invoice.organization_id,
      v_invoice.tenant_id,
      v_payment_id,
      v_credit,
      COALESCE(p_notes, 'Overpayment credit from invoice payment'),
      auth.uid()
    );
  END IF;

  SELECT *
  INTO v_financial
  FROM sync_invoice_financials(v_invoice.id);

  RETURN QUERY
  SELECT
    v_payment_id,
    v_invoice.id,
    v_invoice.tenant_id,
    COALESCE(v_allocated, 0),
    COALESCE(v_credit, 0),
    COALESCE(v_financial.balance, GREATEST(v_invoice.amount_due - v_invoice.amount_paid, 0)),
    COALESCE(v_financial.status, v_invoice.status);
END;
$$;

CREATE OR REPLACE FUNCTION apply_available_credit_to_invoice(p_invoice_id UUID)
RETURNS TABLE (
  applied_amount DECIMAL,
  invoice_balance DECIMAL,
  invoice_status invoice_status,
  remaining_credit DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice invoices%ROWTYPE;
  v_role user_role;
  v_credit RECORD;
  v_remaining_balance DECIMAL(12,2);
  v_apply_amount DECIMAL(12,2);
  v_applied_total DECIMAL(12,2) := 0;
  v_financial RECORD;
  v_remaining_credit DECIMAL(12,2) := 0;
BEGIN
  v_role := get_my_role();
  IF v_role NOT IN ('admin', 'landlord') THEN
    RAISE EXCEPTION 'Not authorized to apply credit.';
  END IF;

  SELECT *
  INTO v_invoice
  FROM invoices
  WHERE id = p_invoice_id
    AND organization_id = get_my_org_id()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found.';
  END IF;

  IF v_invoice.status = 'cancelled' THEN
    RAISE EXCEPTION 'Cancelled invoices cannot accept credit.';
  END IF;

  v_remaining_balance := GREATEST(v_invoice.amount_due - COALESCE(v_invoice.amount_paid, 0), 0);

  IF v_remaining_balance <= 0 THEN
    RETURN QUERY
    SELECT
      0::DECIMAL,
      0::DECIMAL,
      get_invoice_financial_status(v_invoice.amount_due, v_invoice.amount_paid, v_invoice.due_date, v_invoice.status),
      COALESCE((
        SELECT SUM(amount_remaining)
        FROM tenant_credits
        WHERE tenant_id = v_invoice.tenant_id
          AND organization_id = v_invoice.organization_id
      ), 0);
    RETURN;
  END IF;

  FOR v_credit IN
    SELECT *
    FROM tenant_credits
    WHERE tenant_id = v_invoice.tenant_id
      AND organization_id = v_invoice.organization_id
      AND amount_remaining > 0
    ORDER BY created_at ASC
    FOR UPDATE
  LOOP
    EXIT WHEN v_remaining_balance <= 0;

    v_apply_amount := LEAST(v_credit.amount_remaining, v_remaining_balance);
    IF v_apply_amount <= 0 THEN
      CONTINUE;
    END IF;

    INSERT INTO credit_applications (
      organization_id,
      credit_id,
      invoice_id,
      amount,
      applied_by
    )
    VALUES (
      v_invoice.organization_id,
      v_credit.id,
      v_invoice.id,
      v_apply_amount,
      auth.uid()
    );

    UPDATE tenant_credits
    SET amount_remaining = amount_remaining - v_apply_amount
    WHERE id = v_credit.id;

    v_applied_total := v_applied_total + v_apply_amount;
    v_remaining_balance := v_remaining_balance - v_apply_amount;
  END LOOP;

  SELECT *
  INTO v_financial
  FROM sync_invoice_financials(v_invoice.id);

  SELECT COALESCE(SUM(amount_remaining), 0)
  INTO v_remaining_credit
  FROM tenant_credits
  WHERE tenant_id = v_invoice.tenant_id
    AND organization_id = v_invoice.organization_id;

  RETURN QUERY
  SELECT
    COALESCE(v_applied_total, 0),
    COALESCE(v_financial.balance, GREATEST(v_invoice.amount_due - v_invoice.amount_paid, 0)),
    COALESCE(v_financial.status, v_invoice.status),
    COALESCE(v_remaining_credit, 0);
END;
$$;
