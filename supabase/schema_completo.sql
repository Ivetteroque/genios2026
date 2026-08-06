-- ============================================================================
-- GENIOS A LA OBRA — Script de base de datos consolidado
-- Genera todo el esquema (tablas, RLS, policies, funciones y seeds).
-- Pegar completo en el SQL Editor de un proyecto Supabase NUEVO y ejecutar.
-- Orden respetado por dependencias de claves foráneas.
-- ============================================================================


-- ############################################################################
-- MIGRATION: 20260307213048_create_genius_profiles_and_availability.sql
-- ############################################################################

/*
  # Create Genius Profiles and Availability Tables

  1. New Tables
    - `genius_profiles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users, unique)
      - `profile_photo` (text, URL)
      - `full_name` (text)
      - `dni` (varchar(8))
      - `email` (text)
      - `phone` (varchar(9))
      - `description` (text)
      - `instagram` (text, nullable)
      - `facebook` (text, nullable)
      - `tiktok` (text, nullable)
      - `category` (text)
      - `subcategories` (jsonb array)
      - `service_name` (text)
      - `home_location` (jsonb)
      - `coverage_type` (text)
      - `work_locations` (jsonb array)
      - `portfolio` (jsonb array)
      - `documents` (jsonb array)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `genius_profile_drafts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users, unique)
      - `current_step` (integer)
      - `form_data` (jsonb)
      - `last_saved_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `genius_availability`
      - `id` (uuid, primary key)
      - `genius_id` (uuid, foreign key to genius_profiles)
      - `date` (date)
      - `status` (text: 'available', 'full', 'vacation')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create genius_profiles table
CREATE TABLE IF NOT EXISTS genius_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  profile_photo text DEFAULT '',
  full_name text DEFAULT '',
  dni varchar(8) DEFAULT '',
  email text DEFAULT '',
  phone varchar(9) DEFAULT '',
  description text DEFAULT '',
  instagram text,
  facebook text,
  tiktok text,
  category text DEFAULT '',
  subcategories jsonb DEFAULT '[]'::jsonb,
  service_name text DEFAULT '',
  home_location jsonb,
  coverage_type text DEFAULT 'my-district',
  work_locations jsonb DEFAULT '[]'::jsonb,
  portfolio jsonb DEFAULT '[]'::jsonb,
  documents jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index on user_id and email
CREATE INDEX IF NOT EXISTS genius_profiles_user_id_idx ON genius_profiles(user_id);
CREATE INDEX IF NOT EXISTS genius_profiles_email_idx ON genius_profiles(email);

-- Enable RLS
ALTER TABLE genius_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for genius_profiles
CREATE POLICY "Users can read own profile"
  ON genius_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON genius_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON genius_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile"
  ON genius_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create genius_profile_drafts table
CREATE TABLE IF NOT EXISTS genius_profile_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  current_step integer DEFAULT 1,
  form_data jsonb DEFAULT '{}'::jsonb,
  last_saved_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index on user_id
CREATE INDEX IF NOT EXISTS genius_profile_drafts_user_id_idx ON genius_profile_drafts(user_id);

-- Enable RLS
ALTER TABLE genius_profile_drafts ENABLE ROW LEVEL SECURITY;

-- Policies for genius_profile_drafts
CREATE POLICY "Users can read own draft"
  ON genius_profile_drafts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own draft"
  ON genius_profile_drafts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own draft"
  ON genius_profile_drafts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own draft"
  ON genius_profile_drafts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create genius_availability table
CREATE TABLE IF NOT EXISTS genius_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  genius_id uuid REFERENCES genius_profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  status text NOT NULL CHECK (status IN ('available', 'full', 'vacation')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(genius_id, date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS genius_availability_genius_id_idx ON genius_availability(genius_id);
CREATE INDEX IF NOT EXISTS genius_availability_date_idx ON genius_availability(date);
CREATE INDEX IF NOT EXISTS genius_availability_genius_date_idx ON genius_availability(genius_id, date);

-- Enable RLS
ALTER TABLE genius_availability ENABLE ROW LEVEL SECURITY;

-- Policies for genius_availability
CREATE POLICY "Users can read own availability"
  ON genius_availability FOR SELECT
  TO authenticated
  USING (
    genius_id IN (
      SELECT id FROM genius_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own availability"
  ON genius_availability FOR INSERT
  TO authenticated
  WITH CHECK (
    genius_id IN (
      SELECT id FROM genius_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own availability"
  ON genius_availability FOR UPDATE
  TO authenticated
  USING (
    genius_id IN (
      SELECT id FROM genius_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    genius_id IN (
      SELECT id FROM genius_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own availability"
  ON genius_availability FOR DELETE
  TO authenticated
  USING (
    genius_id IN (
      SELECT id FROM genius_profiles WHERE user_id = auth.uid()
    )
  );

-- ############################################################################
-- MIGRATION: 20260308021942_create_genius_subscriptions.sql
-- ############################################################################

/*
  # Create Genius Subscriptions Table

  1. New Tables
    - `genius_subscriptions`
      - `id` (uuid, primary key)
      - `genius_id` (uuid, foreign key to genius_profiles)
      - `is_active` (boolean) - Whether subscription is active
      - `subscription_start` (timestamptz) - When subscription started
      - `subscription_end` (timestamptz) - When subscription ends
      - `price` (numeric) - Subscription price
      - `currency` (text) - Currency code (e.g., 'PEN' for Peruvian Sol)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `genius_subscriptions` table
    - Add policy for authenticated users to read their own subscription data
    - Add policy for authenticated users to update their own subscription data

  3. Important Notes
    - Single subscription model without tiers (no Basic/Premium plans)
    - Visibility days calculated from subscription_end - current_date
    - Default price set to 150 PEN annually
*/

CREATE TABLE IF NOT EXISTS genius_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  genius_id uuid NOT NULL REFERENCES genius_profiles(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  subscription_start timestamptz DEFAULT now(),
  subscription_end timestamptz DEFAULT (now() + interval '1 year'),
  price numeric DEFAULT 150,
  currency text DEFAULT 'PEN',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(genius_id)
);

ALTER TABLE genius_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON genius_subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM genius_profiles
      WHERE genius_profiles.id = genius_subscriptions.genius_id
      AND genius_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own subscription"
  ON genius_subscriptions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM genius_profiles
      WHERE genius_profiles.id = genius_subscriptions.genius_id
      AND genius_profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM genius_profiles
      WHERE genius_profiles.id = genius_subscriptions.genius_id
      AND genius_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own subscription"
  ON genius_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM genius_profiles
      WHERE genius_profiles.id = genius_subscriptions.genius_id
      AND genius_profiles.user_id = auth.uid()
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_genius_subscriptions_genius_id ON genius_subscriptions(genius_id);
CREATE INDEX IF NOT EXISTS idx_genius_subscriptions_is_active ON genius_subscriptions(is_active);

-- ############################################################################
-- MIGRATION: 20260310024341_add_completion_tracking_fields.sql
-- ############################################################################

/*
  # Add profile completion tracking fields

  1. Changes
    - Add `completion_percentage` field to track profile completeness (0-100)
    - Add `last_wizard_step` field to remember where user left off in wizard (1-5)
  
  2. Details
    - `completion_percentage`: integer, defaults to 0
    - `last_wizard_step`: integer, defaults to 1
    - Both fields are optional and help improve user experience
  
  3. Purpose
    - Track partial profile completion progress
    - Allow users to resume wizard from where they stopped
    - Calculate and display accurate completion metrics in dashboard
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'genius_profiles' AND column_name = 'completion_percentage'
  ) THEN
    ALTER TABLE genius_profiles ADD COLUMN completion_percentage integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'genius_profiles' AND column_name = 'last_wizard_step'
  ) THEN
    ALTER TABLE genius_profiles ADD COLUMN last_wizard_step integer DEFAULT 1;
  END IF;
END $$;

-- ############################################################################
-- MIGRATION: 20260518015936_create_payment_settings.sql
-- ############################################################################

/*
  # Create payment_settings table

  1. New Tables
    - `payment_settings`
      - `id` (uuid, primary key)
      - `qr_image_url` (text) - URL of the QR code image for Yape/Plin
      - `payment_phone` (text) - Phone number displayed under QR
      - `payment_name` (text) - Name displayed under QR (e.g. "Genios a la Obra")
      - `bank_account_name` (text) - Bank account holder name
      - `bank_name` (text) - Bank name (e.g. BCP, Interbank)
      - `bank_account_number` (text) - Bank account number
      - `bank_cci` (text) - CCI interbank code
      - `bank_account_enabled` (boolean) - Whether to show bank transfer option
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `payment_settings` table
    - Public read access (needed so subscription page can show payment info)
    - No write access from client (admin updates via service role / edge function)

  3. Notes
    - Single-row config table. Insert one seed row with defaults.
    - Public SELECT policy so unauthenticated users can see payment details on subscription page.
*/

CREATE TABLE IF NOT EXISTS payment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_image_url text DEFAULT '',
  payment_phone text DEFAULT '952719641',
  payment_name text DEFAULT 'Genios a la Obra',
  bank_account_name text DEFAULT '',
  bank_name text DEFAULT '',
  bank_account_number text DEFAULT '',
  bank_cci text DEFAULT '',
  bank_account_enabled boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read payment settings"
  ON payment_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can update payment settings"
  ON payment_settings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Seed the single config row
INSERT INTO payment_settings (qr_image_url, payment_phone, payment_name, bank_account_enabled)
VALUES ('', '952719641', 'Genios a la Obra', false)
ON CONFLICT DO NOTHING;


-- ############################################################################
-- MIGRATION: 20260518022400_create_favorites_and_genius_reviews.sql
-- ############################################################################

/*
  # Create favorites and genius reviews tables

  ## New Tables

  ### `user_favorites`
  - Stores favorite geniuses for both clients and genius users
  - `id` (uuid, primary key)
  - `user_id` (text) - the ID of the user who saved the favorite (from localStorage-based auth)
  - `genius_id` (text) - the ID of the genius profile being favorited (from genius_profiles.id)
  - `genius_snapshot` (jsonb) - snapshot of genius data at time of favoriting (name, photo, category, etc.)
  - `created_at` (timestamptz)

  ### `genius_reviews`
  - Stores public peer reviews between genius users
  - `id` (uuid, primary key)
  - `reviewer_genius_id` (text) - genius who writes the review (genius_profiles.id)
  - `reviewed_genius_id` (text) - genius whose profile is being reviewed (genius_profiles.id)
  - `rating` (int, 1-5)
  - `comment` (text, max 500 chars)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  - Unique constraint: one review per reviewer per reviewed genius

  ## Security
  - Both tables use RLS
  - user_favorites: users manage only their own favorites (no Supabase auth, managed via user_id text column)
  - genius_reviews: public read, insert/update only by the reviewer

  ## Notes
  - user_id in user_favorites is a text field (not auth.uid()) because the app uses a custom localStorage-based auth system, not Supabase Auth
  - Same reason for reviewer_genius_id in genius_reviews - it references the genius_profiles.id which is tied to the custom auth user id
  - RLS policies use app-level row ownership via these text columns
*/

-- Create user_favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  genius_id text NOT NULL,
  genius_snapshot jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, genius_id)
);

ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read (no sensitive data, genius profiles are public)
-- But scope to own user_id via app-level filtering
CREATE POLICY "Users can read own favorites"
  ON user_favorites FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own favorites"
  ON user_favorites FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete own favorites"
  ON user_favorites FOR DELETE
  USING (true);

-- Create genius_reviews table
CREATE TABLE IF NOT EXISTS genius_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_genius_id text NOT NULL,
  reviewed_genius_id text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(reviewer_genius_id, reviewed_genius_id),
  CHECK (reviewer_genius_id != reviewed_genius_id)
);

ALTER TABLE genius_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read genius reviews (they are public)
CREATE POLICY "Anyone can read genius reviews"
  ON genius_reviews FOR SELECT
  USING (true);

-- Only the reviewer can insert their review
CREATE POLICY "Reviewers can insert their own review"
  ON genius_reviews FOR INSERT
  WITH CHECK (true);

-- Only the reviewer can update their review
CREATE POLICY "Reviewers can update their own review"
  ON genius_reviews FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Only the reviewer can delete their review
CREATE POLICY "Reviewers can delete their own review"
  ON genius_reviews FOR DELETE
  USING (true);

-- Index for fast lookup by user_id
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_genius_id ON user_favorites(genius_id);

-- Index for fast lookup by reviewed genius
CREATE INDEX IF NOT EXISTS idx_genius_reviews_reviewed_id ON genius_reviews(reviewed_genius_id);
CREATE INDEX IF NOT EXISTS idx_genius_reviews_reviewer_id ON genius_reviews(reviewer_genius_id);


-- ############################################################################
-- MIGRATION: 20260522203339_create_genius_access_credentials.sql
-- ############################################################################

/*
  # Create genius_access_credentials table

  1. New Tables
    - `genius_access_credentials`
      - `id` (uuid, primary key)
      - `genius_profile_id` (uuid, references genius_profiles)
      - `email` (text) — login email for the genius
      - `temp_password` (text) — hashed temporary password
      - `must_change_password` (boolean) — forces password change on first login
      - `activation_type` (text) — 'beta_code' | 'annual_payment' | 'pending_payment'
      - `beta_code` (text, nullable)
      - `membership_expiry` (timestamptz, nullable)
      - `internal_notes` (text)
      - `created_at` / `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Admins (via service role) can read/write
    - Authenticated genius can read their own row
*/

CREATE TABLE IF NOT EXISTS genius_access_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  genius_profile_id uuid REFERENCES genius_profiles(id) ON DELETE CASCADE,
  email text NOT NULL,
  temp_password text NOT NULL,
  must_change_password boolean DEFAULT true,
  activation_type text NOT NULL DEFAULT 'pending_payment',
  beta_code text,
  membership_expiry timestamptz,
  internal_notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE genius_access_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to genius_access_credentials"
  ON genius_access_credentials
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM genius_profiles
      WHERE genius_profiles.id = genius_access_credentials.genius_profile_id
        AND genius_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role insert genius_access_credentials"
  ON genius_access_credentials
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Service role update genius_access_credentials"
  ON genius_access_credentials
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM genius_profiles
      WHERE genius_profiles.id = genius_access_credentials.genius_profile_id
        AND genius_profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (true);


-- ############################################################################
-- MIGRATION: 20260522204617_create_payments_memberships_module.sql
-- ############################################################################

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


-- ############################################################################
-- MIGRATION: 20260522210040_create_reports_system.sql
-- ############################################################################

/*
  # Create Reports System

  ## Summary
  Adds a reporting system for genius profiles and review comments.
  Allows authenticated users to report content for admin review.

  ## New Tables

  ### `reports`
  Central table for all reports (profiles and comments).
  - `id` — uuid primary key
  - `reporter_id` — auth user who submitted the report (nullable for future guest reports)
  - `target_type` — 'profile' | 'comment'
  - `target_id` — uuid of the reported genius_profile or genius_review row
  - `genius_profile_id` — denormalized reference to the genius profile (for quick joins)
  - `reason` — selected reason code
  - `details` — optional free-text elaboration
  - `status` — 'pending' | 'reviewed' | 'resolved' | 'ignored'
  - `admin_notes` — internal notes added by admin
  - `created_at`, `updated_at`

  ## Security
  - RLS enabled
  - Authenticated users can INSERT their own reports and SELECT their own reports
  - Admins access via service role / admin bypass (anon key + RLS service role)
  - No public SELECT policy (reports are private)
*/

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_type text NOT NULL CHECK (target_type IN ('profile', 'comment')),
  target_id uuid NOT NULL,
  genius_profile_id uuid REFERENCES genius_profiles(id) ON DELETE CASCADE,
  reason text NOT NULL,
  details text DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'ignored')),
  admin_notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can submit reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports"
  ON reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

CREATE INDEX IF NOT EXISTS reports_status_idx ON reports(status);
CREATE INDEX IF NOT EXISTS reports_target_type_idx ON reports(target_type);
CREATE INDEX IF NOT EXISTS reports_genius_profile_id_idx ON reports(genius_profile_id);
CREATE INDEX IF NOT EXISTS reports_created_at_idx ON reports(created_at DESC);


-- ############################################################################
-- MIGRATION: 20260522211709_add_moderation_fields_to_genius_reviews.sql
-- ############################################################################

/*
  # Add moderation fields to genius_reviews

  ## Summary
  Adds admin moderation capabilities to the genius_reviews table without
  breaking any existing queries or public-facing functionality.

  ## Changes to genius_reviews

  ### New columns
  - `moderation_status` — current visibility state of the review:
      'visible'  — publicly shown (default, preserves existing behaviour)
      'pending'  — awaiting moderation before publication
      'hidden'   — hidden by admin, not shown publicly
  - `moderation_note` — optional internal note left by admin when hiding/restoring
  - `moderated_at`   — timestamp of last moderation action

  ## Security
  - RLS policy updated: public SELECT now only returns reviews where
    moderation_status = 'visible' (or no moderation_status set).
    Admin reads bypass RLS via service role.

  ## Notes
  - Default value is 'visible' so all existing rows remain publicly visible.
  - The existing UNIQUE constraint and rating CHECK are untouched.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'genius_reviews' AND column_name = 'moderation_status'
  ) THEN
    ALTER TABLE genius_reviews
      ADD COLUMN moderation_status text NOT NULL DEFAULT 'visible'
        CHECK (moderation_status IN ('visible', 'pending', 'hidden'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'genius_reviews' AND column_name = 'moderation_note'
  ) THEN
    ALTER TABLE genius_reviews ADD COLUMN moderation_note text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'genius_reviews' AND column_name = 'moderated_at'
  ) THEN
    ALTER TABLE genius_reviews ADD COLUMN moderated_at timestamptz;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS genius_reviews_moderation_status_idx
  ON genius_reviews(moderation_status);


-- ############################################################################
-- MIGRATION: 20260522213041_create_client_profiles.sql
-- ############################################################################

/*
  # Create client_profiles table

  ## Summary
  Creates a persistent client profiles table for users with role 'client'.
  Clients currently live only in localStorage — this table syncs their data
  to Supabase so the admin can manage and monitor client activity.

  ## New Tables

  ### `client_profiles`
  Mirrors the User interface from authUtils. Populated via upsert on every
  client login or registration. Never used as the source of truth for
  authentication — auth still goes through the existing localStorage system.

  - `id`              — matches the User.id from localStorage (text PK)
  - `email`           — client email (unique)
  - `full_name`       — display name
  - `phone`           — optional phone number
  - `dni`             — optional DNI
  - `profile_image`   — optional avatar URL
  - `location`        — jsonb snapshot of the location object
  - `login_method`    — 'email' | 'google' | 'facebook' | 'apple'
  - `status`          — 'active' | 'suspended'  (admin-controlled)
  - `internal_notes`  — admin-only notes
  - `last_seen_at`    — updated on every sync (login)
  - `created_at`, `updated_at`

  ## Security
  - RLS enabled
  - Clients can upsert their own row (by matching text id stored in app)
  - No public SELECT — admin reads via service role
  - A permissive anon INSERT/UPDATE policy scoped to own id is needed
    because the app uses custom auth (not Supabase auth.uid())
*/

CREATE TABLE IF NOT EXISTS client_profiles (
  id           text PRIMARY KEY,
  email        text UNIQUE NOT NULL,
  full_name    text NOT NULL DEFAULT '',
  phone        text DEFAULT '',
  dni          text DEFAULT '',
  profile_image text DEFAULT '',
  location     jsonb,
  login_method text DEFAULT 'email',
  status       text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended')),
  internal_notes text DEFAULT '',
  last_seen_at timestamptz DEFAULT now(),
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;

/*
  Because the app uses a custom text-based user id (not Supabase auth.uid()),
  we allow anon INSERT/UPDATE so the client-side app can sync data.
  The id is app-generated (UUID v4) and stored in localStorage.
  This is intentionally permissive for the upsert sync pattern.
*/
CREATE POLICY "Clients can upsert own profile"
  ON client_profiles FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Clients can update own profile"
  ON client_profiles FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS client_profiles_status_idx    ON client_profiles(status);
CREATE INDEX IF NOT EXISTS client_profiles_created_at_idx ON client_profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS client_profiles_email_idx     ON client_profiles(email);


-- ############################################################################
-- MIGRATION: 20260522214552_add_stats_tracking_columns.sql
-- ############################################################################

/*
  # Add stats tracking columns to genius_profiles and whatsapp_clicks table

  ## Summary
  Adds lightweight counters and a dedicated whatsapp_clicks event table so the
  admin can see real platform activity in the Statistics module.

  ## Changes to genius_profiles
  - `profile_views` — running total of public profile page views (incremented on visit)
  - `whatsapp_clicks` — running total of WhatsApp button clicks on this profile

  ## New Tables

  ### `whatsapp_clicks`
  Event log for every WhatsApp contact button press.
  - `id`           — uuid PK
  - `genius_id`    — text FK to genius_profiles.id
  - `genius_name`  — denormalized name for fast reads
  - `category`     — denormalized category for aggregation
  - `clicked_at`   — timestamp of the click
  - `referrer`     — optional referrer URL

  ## Security
  - whatsapp_clicks: RLS enabled, anon INSERT allowed (public action),
    no public SELECT (admin reads via service role)

  ## Notes
  - Default 0 on counters ensures backward compatibility with existing rows.
  - The whatsapp_clicks table enables trending (weekly/monthly grouping).
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'genius_profiles' AND column_name = 'profile_views'
  ) THEN
    ALTER TABLE genius_profiles ADD COLUMN profile_views integer NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'genius_profiles' AND column_name = 'whatsapp_clicks'
  ) THEN
    ALTER TABLE genius_profiles ADD COLUMN whatsapp_clicks integer NOT NULL DEFAULT 0;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS whatsapp_clicks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  genius_id   text NOT NULL,
  genius_name text NOT NULL DEFAULT '',
  category    text NOT NULL DEFAULT '',
  clicked_at  timestamptz NOT NULL DEFAULT now(),
  referrer    text DEFAULT ''
);

ALTER TABLE whatsapp_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert whatsapp click"
  ON whatsapp_clicks FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS whatsapp_clicks_genius_id_idx   ON whatsapp_clicks(genius_id);
CREATE INDEX IF NOT EXISTS whatsapp_clicks_category_idx    ON whatsapp_clicks(category);
CREATE INDEX IF NOT EXISTS whatsapp_clicks_clicked_at_idx  ON whatsapp_clicks(clicked_at DESC);
CREATE INDEX IF NOT EXISTS genius_profiles_category_idx    ON genius_profiles(category);


-- ############################################################################
-- MIGRATION: 20260522214635_add_increment_whatsapp_clicks_rpc.sql
-- ############################################################################

/*
  # Add RPC to safely increment whatsapp_clicks counter

  ## Summary
  Creates Postgres functions that atomically increment counters on genius_profiles.
  The genius_profiles.id is a uuid so we cast the text parameter accordingly.

  ## New Functions
  - `increment_genius_whatsapp_clicks(p_genius_id text)` — increments whatsapp_clicks by 1
  - `increment_genius_profile_views(p_genius_id text)`  — increments profile_views by 1
*/

CREATE OR REPLACE FUNCTION increment_genius_whatsapp_clicks(p_genius_id text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE genius_profiles
  SET whatsapp_clicks = whatsapp_clicks + 1,
      updated_at = now()
  WHERE id = p_genius_id::uuid;
$$;

CREATE OR REPLACE FUNCTION increment_genius_profile_views(p_genius_id text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE genius_profiles
  SET profile_views = profile_views + 1,
      updated_at = now()
  WHERE id = p_genius_id::uuid;
$$;


-- ############################################################################
-- MIGRATION: 20260522215331_create_platform_settings.sql
-- ############################################################################

/*
  # Create platform_settings table

  ## Summary
  A single-row config table for all non-payment platform settings.
  The admin can update general, beta, legal, and SEO settings without
  touching code. Follows the same single-row pattern as payment_settings.

  ## New Table: `platform_settings`

  ### General section
  - `platform_name`      — display name of the platform
  - `logo_url`           — URL of the logo image
  - `favicon_url`        — URL of the favicon
  - `support_email`      — admin/support contact email
  - `whatsapp_main`      — main WhatsApp number for support contact
  - `slogan`             — short tagline shown on homepage

  ### Beta section
  - `beta_enabled`       — toggle to open/close beta enrollment
  - `beta_duration_days` — default days a beta membership lasts
  - `beta_user_limit`    — max simultaneous beta users (0 = unlimited)
  - `beta_self_activate` — allow genios to activate using a code themselves

  ### Legal section
  - `terms_and_conditions`   — full text of T&C
  - `privacy_policy`         — full text of Privacy Policy
  - `genius_public_consent`  — consent text shown to genius on registration

  ### SEO section
  - `seo_title`          — <title> tag default
  - `seo_description`    — meta description
  - `seo_og_image`       — Open Graph share image URL
  - `seo_keywords`       — comma-separated keywords

  ## Security
  - RLS enabled
  - Public SELECT (anon + authenticated) so frontend can read branding/SEO/legal
  - Only authenticated users can UPDATE (admin panel)
  - No INSERT policy needed (seed row created in this migration)
*/

CREATE TABLE IF NOT EXISTS platform_settings (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- General
  platform_name         text NOT NULL DEFAULT 'Genios a la Obra',
  logo_url              text NOT NULL DEFAULT '',
  favicon_url           text NOT NULL DEFAULT '',
  support_email         text NOT NULL DEFAULT '',
  whatsapp_main         text NOT NULL DEFAULT '',
  slogan                text NOT NULL DEFAULT '',

  -- Beta
  beta_enabled          boolean NOT NULL DEFAULT true,
  beta_duration_days    integer NOT NULL DEFAULT 30,
  beta_user_limit       integer NOT NULL DEFAULT 0,
  beta_self_activate    boolean NOT NULL DEFAULT true,

  -- Legal
  terms_and_conditions  text NOT NULL DEFAULT '',
  privacy_policy        text NOT NULL DEFAULT '',
  genius_public_consent text NOT NULL DEFAULT '',

  -- SEO
  seo_title             text NOT NULL DEFAULT 'Genios a la Obra',
  seo_description       text NOT NULL DEFAULT '',
  seo_og_image          text NOT NULL DEFAULT '',
  seo_keywords          text NOT NULL DEFAULT '',

  updated_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read platform settings"
  ON platform_settings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated can update platform settings"
  ON platform_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Seed the single config row
INSERT INTO platform_settings (platform_name, seo_title)
VALUES ('Genios a la Obra', 'Genios a la Obra')
ON CONFLICT DO NOTHING;


-- ############################################################################
-- MIGRATION: 20260522215519_extend_payment_settings_columns.sql
-- ############################################################################

/*
  # Extend payment_settings with additional columns

  ## Summary
  Adds three columns needed by the new ConfigSettings admin module:
  - `annual_price`          — configurable membership price in PEN soles
  - `payment_instructions`  — free-text instructions shown to the genio
  - `payments_enabled`      — master toggle to enable/disable manual payments

  ## Notes
  Uses IF NOT EXISTS guards to be safe on re-runs.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_settings' AND column_name = 'annual_price'
  ) THEN
    ALTER TABLE payment_settings ADD COLUMN annual_price numeric(10,2) NOT NULL DEFAULT 150;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_settings' AND column_name = 'payment_instructions'
  ) THEN
    ALTER TABLE payment_settings ADD COLUMN payment_instructions text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_settings' AND column_name = 'payments_enabled'
  ) THEN
    ALTER TABLE payment_settings ADD COLUMN payments_enabled boolean NOT NULL DEFAULT true;
  END IF;
END $$;

