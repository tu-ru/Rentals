INSERT INTO organizations (
  id,
  name,
  slug,
  owner_id,
  mpesa_shortcode,
  mpesa_nominated_number,
  mpesa_pull_registered,
  mpesa_env,
  subscription_plan
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Kilimani Properties Ltd',
  'kilimani-props',
  NULL,
  '174379',
  '+254700123456',
  false,
  'sandbox',
  'free'
);

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
  description
) VALUES
(
  '22222222-2222-2222-2222-222222222221',
  '11111111-1111-1111-1111-111111111111',
  'Kilimani Heights',
  'apartment',
  'Ole Dume Road, Kilimani',
  'Nairobi',
  'Nairobi',
  12,
  3,
  'Modern apartment block near Yaya Centre.'
),
(
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Westlands Court',
  'apartment',
  'Muthithi Road, Westlands',
  'Nairobi',
  'Nairobi',
  8,
  1,
  'Quiet residential compound in Westlands.'
);

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
  features
) VALUES
(
  '33333333-3333-3333-3333-333333333331',
  '22222222-2222-2222-2222-222222222221',
  '11111111-1111-1111-1111-111111111111',
  'A101',
  1,
  'Bedsitter',
  'vacant',
  15000.00,
  15000.00,
  320,
  '["wifi-ready", "water-included"]'::jsonb
),
(
  '33333333-3333-3333-3333-333333333332',
  '22222222-2222-2222-2222-222222222221',
  '11111111-1111-1111-1111-111111111111',
  'B204',
  2,
  '1 Bedroom',
  'occupied',
  38000.00,
  76000.00,
  560,
  '["balcony", "parking"]'::jsonb
),
(
  '33333333-3333-3333-3333-333333333333',
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'C301',
  3,
  '2 Bedroom',
  'vacant',
  65000.00,
  130000.00,
  850,
  '["backup-generator", "ensuite"]'::jsonb
),
(
  '33333333-3333-3333-3333-333333333334',
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'P1',
  0,
  'Penthouse',
  'reserved',
  85000.00,
  170000.00,
  1200,
  '["rooftop", "city-view", "two-parking-slots"]'::jsonb
);
