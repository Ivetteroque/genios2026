/*
  # Payments & Memberships Module

  ## New Tables

  ### payment_requests
  Stores payment activation requests submitted by genios (Yape/Plin screenshot via WhatsApp or manual).
  - id, genius_profile_id, genius_name, genius_email, genius_phone
  - activation_type: 'annual_payment' | 'beta_code' | 'pending_payment'
  - payment_method: 'yape' | 'plin' | 'transfer'
  - amount (numeric)
  - operation_reference (operation number or WhatsApp message reference)
  - voucher_url (screenshot URL)
  - status: 'pending' | 'approved' | 'rejected' | 'observed'
  - internal_notes
  - reviewed_by, reviewed_at
  - created_at, updated_at

  ### beta_codes
  Admin-managed beta codes for free trial access.
  - id, code (unique), description
  - duration_days, max_uses, used_count
  - scope_department, scope_province, scope_district (optional geographic restrictions)
  - expires_at (optional)
  - is_active
  - created_by, created_at, updated_at

  ### memberships
  Active membership records per genius.
  - id, genius_profile_id, genius_name (denormalized for display)
  - type: 'beta' | 'annual'
  - starts_at, ends_at
  - status: 'active' | 'expiring_soon' | 'expired' | 'suspended'
  - beta_code_id (nullable FK)
  - payment_request_id (nullable FK)
  - extended_by, extended_at (for manual extensions)
  - suspended_by, suspended_at
  - created_at, updated_at

  ### payment_history
  Immutable audit log of all payment movements.
  - id, genius_profile_id, genius_name
  - amount, payment_method, operation_reference, voucher_url
  - status, approved_by, approved_at
  - rejected_by, rejected_at, rejection_reason
  - internal_notes
  - created_at

  ## Security
  - RLS enabled on all tables
  - Authenticated users can read/write (admin-only in practice via admin auth)
*/

-- ─── payment_requests ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS payment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  genius_profile_id uuid REFERENCES genius_profiles(id) ON DELETE SET NULL,
  genius_name text NOT NULL DEFAULT '',
  genius_email text NOT NULL DEFAULT '',
  genius_phone text NOT NULL DEFAULT '',
  activation_type text NOT NULL DEFAULT 'annual_payment',
  payment_method text NOT NULL DEFAULT 'yape',
  amount numeric(10,2) DEFAULT 0,
  operation_reference text DEFAULT '',
  voucher_url text DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  internal_notes text DEFAULT '',
  reviewed_by text DEFAULT '',
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select payment_requests"
  ON payment_requests FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert payment_requests"
  ON payment_requests FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update payment_requests"
  ON payment_requests FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ─── beta_codes ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS beta_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  description text DEFAULT '',
  duration_days integer NOT NULL DEFAULT 30,
  max_uses integer NOT NULL DEFAULT 1,
  used_count integer NOT NULL DEFAULT 0,
  scope_department text DEFAULT '',
  scope_province text DEFAULT '',
  scope_district text DEFAULT '',
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_by text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE beta_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select beta_codes"
  ON beta_codes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert beta_codes"
  ON beta_codes FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update beta_codes"
  ON beta_codes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete beta_codes"
  ON beta_codes FOR DELETE TO authenticated USING (true);

-- ─── memberships ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  genius_profile_id uuid REFERENCES genius_profiles(id) ON DELETE CASCADE,
  genius_name text NOT NULL DEFAULT '',
  genius_email text DEFAULT '',
  genius_phone text DEFAULT '',
  type text NOT NULL DEFAULT 'annual',
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active',
  beta_code_id uuid REFERENCES beta_codes(id) ON DELETE SET NULL,
  payment_request_id uuid REFERENCES payment_requests(id) ON DELETE SET NULL,
  extended_by text DEFAULT '',
  extended_at timestamptz,
  suspended_by text DEFAULT '',
  suspended_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select memberships"
  ON memberships FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert memberships"
  ON memberships FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update memberships"
  ON memberships FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ─── payment_history ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS payment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  genius_profile_id uuid REFERENCES genius_profiles(id) ON DELETE SET NULL,
  genius_name text NOT NULL DEFAULT '',
  genius_email text DEFAULT '',
  amount numeric(10,2) DEFAULT 0,
  payment_method text DEFAULT '',
  operation_reference text DEFAULT '',
  voucher_url text DEFAULT '',
  status text NOT NULL DEFAULT 'approved',
  approved_by text DEFAULT '',
  approved_at timestamptz,
  rejected_by text DEFAULT '',
  rejected_at timestamptz,
  rejection_reason text DEFAULT '',
  internal_notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select payment_history"
  ON payment_history FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert payment_history"
  ON payment_history FOR INSERT TO authenticated WITH CHECK (true);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_genius ON payment_requests(genius_profile_id);
CREATE INDEX IF NOT EXISTS idx_memberships_genius ON memberships(genius_profile_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status);
CREATE INDEX IF NOT EXISTS idx_memberships_ends_at ON memberships(ends_at);
CREATE INDEX IF NOT EXISTS idx_beta_codes_code ON beta_codes(code);
CREATE INDEX IF NOT EXISTS idx_payment_history_genius ON payment_history(genius_profile_id);
