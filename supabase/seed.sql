-- Cloud-safe application seed data.
-- This file intentionally avoids direct writes to auth.users.
-- Bootstrap the first super admin separately using npm run bootstrap:super-admin

-- Deterministic IDs for repeatable development fixtures
-- Organization: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
-- Property: bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb
-- Units: cccccccc-cccc-cccc-cccc-ccccccccccc1..3
-- Expenses: dddddddd-dddd-dddd-dddd-ddddddddddd1..2
-- Invitations are safe to seed without auth rows

WITH seeded_super_admin AS (
  SELECT id
  FROM profiles
  WHERE role = 'super_admin'
  ORDER BY created_at ASC
  LIMIT 1
)
INSERT INTO organizations (
  id,
  name,
  slug,
  owner_id,
  mpesa_shortcode,
  mpesa_nominated_number,
  mpesa_env,
  subscription_plan,
  settings,
  is_active
) VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Acme Property Group',
  'acme-property-group',
  (SELECT id FROM seeded_super_admin),
  '174379',
  '0712345678',
  'sandbox',
  'pro',
  '{
    "currency":"KES",
    "timezone":"Africa/Nairobi",
    "date_format":"DD/MM/YYYY",
    "onboarding_state":"complete",
    "mpesa_consumer_key":"sandbox-consumer-key",
    "mpesa_consumer_secret":"sandbox-consumer-secret",
    "sms_shortcode":"ACME",
    "sms_automation":{
      "welcome":true,
      "rent_reminder":true,
      "overdue_notice":true,
      "payment_confirmed":true,
      "maintenance_update":true,
      "lease_expiry":true
    },
    "notification_preferences":{
      "rent_reminder":true,
      "payment_confirmed":true,
      "maintenance_update":true,
      "lease_expiry":true,
      "general":true
    }
  }'::jsonb,
  true
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  mpesa_shortcode = EXCLUDED.mpesa_shortcode,
  mpesa_nominated_number = EXCLUDED.mpesa_nominated_number,
  mpesa_env = EXCLUDED.mpesa_env,
  subscription_plan = EXCLUDED.subscription_plan,
  settings = EXCLUDED.settings,
  is_active = EXCLUDED.is_active;

INSERT INTO properties (
  id,
  organization_id,
  name,
  property_type,
  address,
  city,
  county,
  total_units,
  occupied_units,
  description,
  amenities,
  images,
  is_active
) VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Acme Heights',
  'apartment',
  'Kiambu Road, Ridgeways',
  'Nairobi',
  'Nairobi',
  3,
  0,
  'A seeded mixed-use rental block for local development and platform testing.',
  '["Borehole","CCTV","Perimeter Wall","Parking","Fibre Internet"]'::jsonb,
  '[]'::jsonb,
  true
)
ON CONFLICT (id) DO UPDATE
SET
  organization_id = EXCLUDED.organization_id,
  name = EXCLUDED.name,
  property_type = EXCLUDED.property_type,
  address = EXCLUDED.address,
  city = EXCLUDED.city,
  county = EXCLUDED.county,
  total_units = EXCLUDED.total_units,
  occupied_units = EXCLUDED.occupied_units,
  description = EXCLUDED.description,
  amenities = EXCLUDED.amenities,
  images = EXCLUDED.images,
  is_active = EXCLUDED.is_active;

INSERT INTO units (
  id,
  property_id,
  organization_id,
  unit_number,
  floor_number,
  unit_type,
  status,
  rent_amount,
  deposit_amount,
  size_sqft,
  features,
  images
) VALUES
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc1',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'A1',
    1,
    '2 Bedroom',
    'vacant',
    35000.00,
    35000.00,
    850,
    '["Balcony","Master Ensuite"]'::jsonb,
    '[]'::jsonb
  ),
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc2',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'B1',
    2,
    'Bedsitter',
    'vacant',
    18000.00,
    18000.00,
    320,
    '["Fitted Wardrobe"]'::jsonb,
    '[]'::jsonb
  ),
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc3',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'C2',
    3,
    'Studio',
    'maintenance',
    22000.00,
    22000.00,
    410,
    '["Open Kitchen","Water Heater"]'::jsonb,
    '[]'::jsonb
  )
ON CONFLICT (id) DO UPDATE
SET
  property_id = EXCLUDED.property_id,
  organization_id = EXCLUDED.organization_id,
  unit_number = EXCLUDED.unit_number,
  floor_number = EXCLUDED.floor_number,
  unit_type = EXCLUDED.unit_type,
  status = EXCLUDED.status,
  rent_amount = EXCLUDED.rent_amount,
  deposit_amount = EXCLUDED.deposit_amount,
  size_sqft = EXCLUDED.size_sqft,
  features = EXCLUDED.features,
  images = EXCLUDED.images;

WITH seeded_super_admin AS (
  SELECT id
  FROM profiles
  WHERE role = 'super_admin'
  ORDER BY created_at ASC
  LIMIT 1
)
INSERT INTO expenses (
  id,
  organization_id,
  property_id,
  category,
  description,
  amount,
  expense_date,
  recorded_by
) VALUES
  (
    'dddddddd-dddd-dddd-dddd-ddddddddddd1',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'security',
    'Guard services retainer for March',
    18000.00,
    CURRENT_DATE - INTERVAL '15 days',
    (SELECT id FROM seeded_super_admin)
  ),
  (
    'dddddddd-dddd-dddd-dddd-ddddddddddd2',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'utilities',
    'Common area electricity and water top-up',
    9600.00,
    CURRENT_DATE - INTERVAL '5 days',
    (SELECT id FROM seeded_super_admin)
  )
ON CONFLICT (id) DO UPDATE
SET
  organization_id = EXCLUDED.organization_id,
  property_id = EXCLUDED.property_id,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  amount = EXCLUDED.amount,
  expense_date = EXCLUDED.expense_date,
  recorded_by = EXCLUDED.recorded_by;

INSERT INTO user_invitations (
  id,
  email,
  role,
  organization_id,
  invited_by,
  status,
  metadata
) VALUES
  (
    '66666666-6666-6666-6666-666666666666',
    'landlord@acme.rentms.local',
    'landlord',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    null,
    'pending',
    '{"seeded":true,"note":"Use a real email when testing invites on cloud."}'::jsonb
  ),
  (
    '77777777-7777-7777-7777-777777777777',
    'admin@acme.rentms.local',
    'admin',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    null,
    'pending',
    '{"seeded":true,"note":"Use a real email when testing invites on cloud."}'::jsonb
  ),
  (
    '88888888-8888-8888-8888-888888888888',
    'tenant@acme.rentms.local',
    'tenant',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    null,
    'pending',
    '{"seeded":true,"note":"Use invite-tenant flow with a real email when testing on cloud."}'::jsonb
  )
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  organization_id = EXCLUDED.organization_id,
  status = EXCLUDED.status,
  metadata = EXCLUDED.metadata;
