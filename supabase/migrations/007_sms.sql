-- SMS message type enum
CREATE TYPE sms_message_type AS ENUM (
  'welcome',
  'rent_reminder',
  'overdue_notice',
  'payment_confirmed',
  'invoice_generated',
  'maintenance_update',
  'lease_expiry',
  'paybill_info',
  'custom'
);

-- SMS delivery status enum
CREATE TYPE sms_status AS ENUM (
  'queued',
  'sent',
  'delivered',
  'failed',
  'scheduled'
);

-- SMS log table: every SMS sent through the system is recorded here
CREATE TABLE sms_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tenant_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Message content
  message_type      sms_message_type NOT NULL,
  message_body      TEXT NOT NULL,
  recipient_phone   TEXT NOT NULL,             -- Always stored as 254XXXXXXXXX
  shortcode         TEXT NOT NULL,             -- Sender ID used
  
  -- Celcom Africa response fields
  celcom_message_id BIGINT,                    -- messageid from Celcom response
  celcom_network_id TEXT,                      -- networkid from Celcom response
  
  -- Status tracking
  status            sms_status DEFAULT 'queued',
  response_code     TEXT,                      -- raw respose-code from Celcom (note typo)
  response_description TEXT,
  delivered_at      TIMESTAMPTZ,
  failed_reason     TEXT,
  
  -- Scheduling
  scheduled_for     TIMESTAMPTZ,              -- NULL = immediate send
  
  -- Context: what triggered this SMS
  related_invoice_id   UUID REFERENCES invoices(id) ON DELETE SET NULL,
  related_payment_id   UUID REFERENCES payments(id) ON DELETE SET NULL,
  related_lease_id     UUID REFERENCES leases(id) ON DELETE SET NULL,
  related_maintenance_id UUID REFERENCES maintenance_requests(id) ON DELETE SET NULL,
  
  -- Who triggered it
  sent_by           UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_automated      BOOLEAN DEFAULT false,    -- true if sent by scheduled function
  
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- SMS templates stored per organization
CREATE TABLE sms_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  message_type    sms_message_type NOT NULL,
  template_name   TEXT NOT NULL,
  template_body   TEXT NOT NULL,
  -- Supported variables: {{tenant_name}}, {{amount}}, {{due_date}},
  -- {{property_name}}, {{unit_number}}, {{paybill}}, {{account_number}},
  -- {{balance}}, {{org_name}}, {{lease_end_date}}
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, message_type)
);

-- Indexes
CREATE INDEX idx_sms_logs_org ON sms_logs(organization_id);
CREATE INDEX idx_sms_logs_tenant ON sms_logs(tenant_id);
CREATE INDEX idx_sms_logs_status ON sms_logs(status);
CREATE INDEX idx_sms_logs_celcom_id ON sms_logs(celcom_message_id) 
  WHERE celcom_message_id IS NOT NULL;
CREATE INDEX idx_sms_logs_created ON sms_logs(created_at DESC);
CREATE INDEX idx_sms_templates_org ON sms_templates(organization_id, message_type);

-- Triggers
CREATE TRIGGER trg_sms_logs_updated 
  BEFORE UPDATE ON sms_logs 
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_sms_templates_updated 
  BEFORE UPDATE ON sms_templates 
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- RLS
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;

-- Staff can read all SMS logs for their org
CREATE POLICY "staff_read_sms_logs" ON sms_logs
  FOR SELECT USING (
    organization_id = get_my_org_id()
    AND get_my_role() IN ('admin', 'landlord', 'agent')
  );

-- Staff can read/write templates for their org
CREATE POLICY "staff_manage_sms_templates" ON sms_templates
  FOR ALL USING (
    organization_id = get_my_org_id()
    AND get_my_role() IN ('admin', 'landlord')
  );

-- Seed default templates (these get inserted when org is created)
-- Orgs will customize these, but this gives a starting point
-- (Actual seeding happens in the onboarding Edge Function, not here)
