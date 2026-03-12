CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  logo_url TEXT,
  mpesa_shortcode TEXT,
  mpesa_nominated_number TEXT,
  mpesa_pull_registered BOOLEAN NOT NULL DEFAULT false,
  mpesa_env TEXT NOT NULL DEFAULT 'sandbox',
  subscription_plan TEXT NOT NULL DEFAULT 'free',
  settings JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  national_id TEXT,
  role user_role NOT NULL DEFAULT 'tenant',
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  property_type property_type NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Nairobi',
  county TEXT NOT NULL DEFAULT 'Nairobi',
  total_units INTEGER NOT NULL DEFAULT 0,
  occupied_units INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  amenities JSONB NOT NULL DEFAULT '[]'::jsonb,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT properties_unit_counts_chk CHECK (total_units >= 0 AND occupied_units >= 0 AND occupied_units <= total_units)
);

CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  unit_number TEXT NOT NULL,
  floor_number INTEGER,
  unit_type TEXT,
  status unit_status NOT NULL DEFAULT 'vacant',
  rent_amount DECIMAL(12,2) NOT NULL,
  deposit_amount DECIMAL(12,2) NOT NULL,
  size_sqft DECIMAL(10,2),
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  UNIQUE(property_id, unit_number),
  CONSTRAINT units_amounts_chk CHECK (rent_amount >= 0 AND deposit_amount >= 0)
);

CREATE TABLE leases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  monthly_rent DECIMAL(12,2) NOT NULL,
  deposit_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
  status lease_status NOT NULL DEFAULT 'pending',
  terms TEXT,
  signed_at TIMESTAMPTZ,
  terminated_at TIMESTAMPTZ,
  termination_reason TEXT,
  CONSTRAINT leases_amounts_chk CHECK (monthly_rent >= 0 AND deposit_paid >= 0),
  CONSTRAINT leases_dates_chk CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  amount_due DECIMAL(12,2) NOT NULL,
  amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
  balance DECIMAL(12,2) GENERATED ALWAYS AS (amount_due - amount_paid) STORED,
  due_date DATE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status invoice_status NOT NULL DEFAULT 'draft',
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  pdf_url TEXT,
  CONSTRAINT invoices_amounts_chk CHECK (amount_due >= 0 AND amount_paid >= 0),
  CONSTRAINT invoices_period_chk CHECK (period_end >= period_start)
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  lease_id UUID REFERENCES leases(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_method payment_method NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  mpesa_transaction_id TEXT UNIQUE,
  mpesa_phone TEXT,
  mpesa_reference TEXT,
  mpesa_organization_name TEXT,
  mpesa_trx_date TIMESTAMPTZ,
  recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  receipt_url TEXT,
  reconciled_at TIMESTAMPTZ,
  CONSTRAINT payments_amount_chk CHECK (amount >= 0)
);

CREATE TABLE maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  priority maintenance_priority NOT NULL DEFAULT 'medium',
  status maintenance_status NOT NULL DEFAULT 'open',
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ
);

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT,
  is_group BOOLEAN NOT NULL DEFAULT false,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE TABLE conversation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, profile_id)
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(12,2) NOT NULL,
  expense_date DATE NOT NULL,
  receipt_url TEXT,
  recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  CONSTRAINT expenses_amount_chk CHECK (amount >= 0)
);

CREATE TABLE mpesa_pull_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  query_start_date TIMESTAMPTZ NOT NULL,
  query_end_date TIMESTAMPTZ NOT NULL,
  offset_value INTEGER NOT NULL DEFAULT 0,
  response_ref_id TEXT,
  response_code TEXT,
  transactions_count INTEGER NOT NULL DEFAULT 0,
  raw_response JSONB
);
