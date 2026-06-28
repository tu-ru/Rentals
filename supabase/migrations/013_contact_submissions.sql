CREATE TABLE contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  portfolio_size TEXT,
  message TEXT NOT NULL,
  source TEXT DEFAULT 'contact_page',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_contact_submissions_created ON contact_submissions(created_at DESC);

ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_insert_contact_submissions" ON contact_submissions
  FOR INSERT
  WITH CHECK (true);

