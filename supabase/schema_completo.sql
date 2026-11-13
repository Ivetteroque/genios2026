-- ============================================================================
-- GENIOS A LA OBRA — Script de base de datos consolidado
-- Genera todo el esquema (tablas, RLS, policies, funciones y seeds).
-- Pegar completo en el SQL Editor de un proyecto Supabase NUEVO y ejecutar.
-- Orden respetado por dependencias de claves foráneas.
--
-- ARCHIVO GENERADO: no editar a mano. Se regenera con `pnpm db:schema`
-- a partir de supabase/migrations (20 migraciones).
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


-- ############################################################################
-- MIGRATION: 20260806120000_create_public_genius_directory.sql
-- ############################################################################

/*
  # Directorio público de genios

  Hasta ahora la búsqueda pública (`/categories`) mostraba 8 personas inventadas
  escritas a mano en `src/pages/Categories.tsx`. Un genio que completaba el
  wizard quedaba guardado en `genius_profiles` pero no aparecía nunca.

  El motivo de fondo: `genius_profiles` solo tiene política de lectura para el
  propio dueño (`auth.uid() = user_id`), así que un visitante anónimo no lee
  ninguna fila. Y no se puede simplemente abrir la tabla al público, porque
  guarda `dni`, `email` y `documents` (documentos de identidad).

  ## Qué crea esta migración

  1. Vista `public_genius_profiles`
     - Expone SOLO las columnas que la tarjeta de resultados necesita.
     - Excluye deliberadamente: user_id, dni, email, documents,
       completion_percentage, last_wizard_step, profile_views, whatsapp_clicks.
     - De `documents` solo deriva un booleano `has_documents` (para el filtro
       "verificado"), nunca el contenido.
     - Solo lista perfiles publicables: con nombre, categoría y teléfono.

  2. Lectura pública de `genius_availability`
     - Sin esto el badge de disponibilidad de cada tarjeta devuelve vacío para
       visitantes anónimos. Solo lectura; escribir sigue restringido al dueño.

  ## Decisiones tomadas

  - **Sin filtro por suscripción.** Durante el periodo de prueba (2 meses desde
    el registro) aparece todo genio con el perfil completo, haya pagado o no.
    Cuando toque cerrar la puerta, el filtro va en el WHERE de la vista usando
    `genius_subscriptions` y/o `created_at` (que la vista ya expone).
  - **El teléfono viaja en la vista.** Es lo que hace funcionar el botón de
    WhatsApp sin pasos extra. Contrapartida asumida: cualquiera puede leer todos
    los teléfonos listados en una sola petición.
  - **`security_invoker = false` (definer).** Es intencional: la vista corre con
    los permisos de su dueño para poder saltarse la RLS de la tabla base. El
    control de qué se expone lo hace la lista de columnas del SELECT, no la RLS.
*/

-- Vista pública: solo columnas seguras, solo perfiles publicables
CREATE OR REPLACE VIEW public_genius_profiles AS
SELECT
  gp.id,
  gp.full_name,
  gp.profile_photo,
  gp.description,
  gp.category,
  gp.subcategories,
  gp.service_name,
  gp.phone,
  gp.instagram,
  gp.facebook,
  gp.tiktok,
  gp.home_location,
  gp.coverage_type,
  gp.work_locations,
  gp.portfolio,
  -- Booleano derivado para el filtro "verificado": nunca el contenido de los documentos
  (jsonb_array_length(COALESCE(gp.documents, '[]'::jsonb)) > 0) AS has_documents,
  gp.created_at
FROM genius_profiles gp
WHERE COALESCE(gp.full_name, '') <> ''
  AND COALESCE(gp.category, '') <> ''
  AND COALESCE(gp.phone, '') <> '';

-- La vista debe correr como definer para atravesar la RLS de genius_profiles.
-- Lo que se expone está acotado por el SELECT de arriba, no por la RLS.
ALTER VIEW public_genius_profiles SET (security_invoker = false);

GRANT SELECT ON public_genius_profiles TO anon, authenticated;

-- Lectura pública de disponibilidad (fechas y estado; nada sensible).
-- Las políticas de escritura existentes siguen intactas.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'genius_availability'
      AND policyname = 'Anyone can read genius availability'
  ) THEN
    CREATE POLICY "Anyone can read genius availability"
      ON genius_availability FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;

-- Índices para el listado y el filtro por categoría
CREATE INDEX IF NOT EXISTS genius_profiles_category_idx ON genius_profiles(category);
CREATE INDEX IF NOT EXISTS genius_availability_date_idx ON genius_availability(date);


-- ############################################################################
-- MIGRATION: 20260806130000_unify_reviews_in_supabase.sql
-- ############################################################################

/*
  # Unificar las reseñas en Supabase

  Había dos sistemas de reseñas que no se conocían entre sí:

  - **Clientes → genio**: en `localStorage['reviews']` (src/utils/reviewUtils.ts).
    Invisible para el panel de admin, invisible desde otro dispositivo, y con las
    fotos guardadas como data-URLs base64 (de ahí el manejo de QuotaExceededError
    en ReviewForm).
  - **Genio → genio**: en la tabla `genius_reviews`.

  Resultado: el mismo genio mostraba una estrella en el buscador (calculada sobre
  `genius_reviews`) y otra distinta al abrir su perfil (calculada sobre
  localStorage).

  ## Qué hace esta migración

  1. Convierte `genius_reviews` en la única tabla de reseñas, con un
     discriminador `reviewer_type` ('client' | 'genius'). El nombre de la tabla
     sigue siendo correcto: son reseñas *de* un genio, venga de quien venga.
  2. Añade las columnas que solo tenían las reseñas de cliente: quién la escribió
     (`reviewer_user_id`, `reviewer_name`), la fecha del servicio y las fotos.
  3. Sustituye la restricción única por dos índices parciales, uno por tipo.
  4. Crea el bucket `review-images` para que las fotos dejen de viajar como
     base64.

  ## Sobre la moderación

  La migración 20260522211709 dice en su cabecera que "public SELECT now only
  returns reviews where moderation_status = 'visible'", pero no incluye ninguna
  sentencia de política: la política permisiva original sigue vigente y ocultar
  una reseña no la oculta en ninguna parte.

  No se puede arreglar en la base de datos todavía: el panel de admin se
  autentica por localStorage y usa la misma anon key que un visitante, así que
  una política que filtre por `moderation_status` dejaría al admin sin poder ver
  la cola de moderación. El filtro queda por ahora en las consultas públicas
  (supabaseGeniusReviewsService). Cerrarlo de verdad exige mover el admin a
  Supabase Auth.
*/

-- 1. Discriminador y columnas propias de las reseñas de cliente
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'genius_reviews' AND column_name = 'reviewer_type') THEN
    ALTER TABLE genius_reviews
      ADD COLUMN reviewer_type text NOT NULL DEFAULT 'genius'
      CHECK (reviewer_type IN ('client', 'genius'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'genius_reviews' AND column_name = 'reviewer_user_id') THEN
    ALTER TABLE genius_reviews ADD COLUMN reviewer_user_id text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'genius_reviews' AND column_name = 'reviewer_name') THEN
    ALTER TABLE genius_reviews ADD COLUMN reviewer_name text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'genius_reviews' AND column_name = 'service_date') THEN
    ALTER TABLE genius_reviews ADD COLUMN service_date date;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'genius_reviews' AND column_name = 'images') THEN
    ALTER TABLE genius_reviews ADD COLUMN images jsonb NOT NULL DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- 2. Una reseña de cliente no tiene perfil de genio como autor
ALTER TABLE genius_reviews ALTER COLUMN reviewer_genius_id DROP NOT NULL;

-- 3. Cada tipo necesita su propio autor
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'genius_reviews_reviewer_identity_check') THEN
    ALTER TABLE genius_reviews ADD CONSTRAINT genius_reviews_reviewer_identity_check CHECK (
      (reviewer_type = 'genius' AND reviewer_genius_id IS NOT NULL) OR
      (reviewer_type = 'client' AND reviewer_user_id IS NOT NULL)
    );
  END IF;
END $$;

-- 4. Una reseña por autor y por genio, calculada por separado para cada tipo.
--    La restricción única original solo contemplaba autores genio.
ALTER TABLE genius_reviews DROP CONSTRAINT IF EXISTS genius_reviews_reviewer_genius_id_reviewed_genius_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS genius_reviews_peer_unique_idx
  ON genius_reviews (reviewer_genius_id, reviewed_genius_id)
  WHERE reviewer_type = 'genius';

CREATE UNIQUE INDEX IF NOT EXISTS genius_reviews_client_unique_idx
  ON genius_reviews (reviewer_user_id, reviewed_genius_id)
  WHERE reviewer_type = 'client';

-- 5. Índice para el listado público de un perfil
CREATE INDEX IF NOT EXISTS genius_reviews_reviewed_visible_idx
  ON genius_reviews (reviewed_genius_id, reviewer_type, moderation_status);

-- 6. Bucket para las fotos de reseñas.
--    Hasta ahora se guardaban como data-URLs base64 dentro de localStorage, lo
--    que agotaba la cuota del navegador con dos fotos.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'review-images',
  'review-images',
  true,
  2097152, -- 2 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies
                 WHERE schemaname = 'storage' AND tablename = 'objects'
                   AND policyname = 'Public read review images') THEN
    CREATE POLICY "Public read review images"
      ON storage.objects FOR SELECT
      TO anon, authenticated
      USING (bucket_id = 'review-images');
  END IF;

  -- La escritura queda abierta a la anon key, igual que el resto de tablas de
  -- esta app (el auth de clientes es localStorage, no Supabase Auth). El límite
  -- de 2 MB y la lista de mime types del bucket son el único control real.
  IF NOT EXISTS (SELECT 1 FROM pg_policies
                 WHERE schemaname = 'storage' AND tablename = 'objects'
                   AND policyname = 'Anyone can upload review images') THEN
    CREATE POLICY "Anyone can upload review images"
      ON storage.objects FOR INSERT
      TO anon, authenticated
      WITH CHECK (bucket_id = 'review-images');
  END IF;
END $$;


-- ############################################################################
-- MIGRATION: 20260806140000_create_media_buckets.sql
-- ############################################################################

/*
  # Buckets para fotos de perfil y portafolio

  Hasta ahora las imágenes se guardaban como data-URLs base64 dentro de las
  columnas de `genius_profiles`: `profile_photo` (text) y `portfolio` (jsonb).
  La UI acepta hasta 5 MB por imagen y base64 infla un ~33%, así que un genio
  con foto y portafolio lleno podía ocupar decenas de MB en una sola fila —
  descargados enteros en cada consulta que tocara esas columnas.

  ## Qué crea

  - `profile-photos`: público, 5 MB, jpeg/png/webp
  - `portfolios`: público, 5 MB, jpeg/png/webp

  Ambos son públicos a propósito: es material que la ficha del genio muestra a
  cualquier visitante.

  ## Qué NO se mueve, y por qué

  Los documentos (`genius_profiles.documents`: DNI, certificados) se quedan
  donde están. Esa columna está protegida por la RLS de solo-dueño de
  `genius_profiles` y queda fuera de la vista pública `public_genius_profiles`.
  Como el auth de clientes de esta app es localStorage y no Supabase Auth,
  cualquier bucket tendría que ser accesible con la anon key: mover los
  documentos allí los haría *menos* privados de lo que están hoy. Se quedan en
  base64 hasta que exista Supabase Auth de verdad.

  ## Sobre las políticas de escritura

  Igual que el resto de esta base (`user_favorites`, `genius_reviews`,
  `reports`, `review-images`), la subida queda abierta a la anon key porque no
  hay identidad verificable en el servidor. El límite de tamaño y la lista de
  mime types del bucket son el único control real.

  No se crea política de DELETE a propósito: con la anon key, permitir borrar
  significaría que cualquiera puede borrar los archivos de cualquiera. El coste
  es que reemplazar una foto deja huérfano el archivo anterior; limpiarlos
  requiere una tarea con service_role, no una política.
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('profile-photos', 'profile-photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('portfolios',     'portfolios',     true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE
  bucket_name text;
BEGIN
  FOREACH bucket_name IN ARRAY ARRAY['profile-photos', 'portfolios']
  LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_policies
                   WHERE schemaname = 'storage' AND tablename = 'objects'
                     AND policyname = 'Public read ' || bucket_name) THEN
      EXECUTE format(
        'CREATE POLICY %I ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = %L)',
        'Public read ' || bucket_name, bucket_name
      );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies
                   WHERE schemaname = 'storage' AND tablename = 'objects'
                     AND policyname = 'Anyone can upload ' || bucket_name) THEN
      EXECUTE format(
        'CREATE POLICY %I ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = %L)',
        'Anyone can upload ' || bucket_name, bucket_name
      );
    END IF;
  END LOOP;
END $$;


-- ############################################################################
-- MIGRATION: 20260806150000_add_reviewer_photo_to_genius_reviews.sql
-- ############################################################################

/*
  # Foto del autor en las reseñas de clientes

  La ficha de un genio muestra la inicial del nombre en un círculo donde debería
  ir el avatar de quien reseñó. No era un olvido de la UI: la foto de un cliente
  vive en `client_profiles.profile_image`, y esa tabla NO tiene política de
  SELECT a propósito (guarda email, DNI, teléfono y ubicación). El navegador,
  que solo cuenta con la anon key, no puede leerla.

  ## Qué agrega

  - `genius_reviews.reviewer_photo` (text): la foto del autor, guardada junto a
    la reseña en el momento de publicarla.

  ## Por qué una copia y no una vista pública

  La alternativa era exponer una vista con el avatar de todos los clientes. Un
  snapshot en la fila evita publicar cualquier dato de clientes y es el mismo
  patrón que ya usa `user_favorites.genius_snapshot`.

  El costo es que la foto queda congelada: si el cliente cambia su avatar, las
  reseñas que ya publicó siguen mostrando el anterior. Para un material que se
  lee como "así se veía cuando opinó", es un costo aceptable.

  ## Reseñas entre colegas

  No las toca. Ahí el autor es un genio y su foto se sigue leyendo en vivo desde
  `public_genius_profiles`, que sí es pública: la columna queda vacía y el
  servicio la completa al vuelo.

  ## Reseñas ya publicadas

  Quedan con la columna vacía y siguen mostrando la inicial. No hay forma de
  recuperar la foto retroactivamente sin leer `client_profiles` con service
  role; si hiciera falta, es una tarea aparte.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'genius_reviews' AND column_name = 'reviewer_photo') THEN
    ALTER TABLE genius_reviews ADD COLUMN reviewer_photo text NOT NULL DEFAULT '';
  END IF;
END $$;


-- ############################################################################
-- MIGRATION: 20260806160000_admin_read_access.sql
-- ############################################################################

/*
  # Lectura del panel de administración

  El panel mostraba ceros en todos sus indicadores. No era un error de la UI: el
  login de admin vivía solo en el navegador (`adminAuthUtils` comparaba contra
  dos usuarios escritos en el código con la contraseña `admin123`), así que para
  Supabase el panel era un visitante anónimo idéntico a cualquiera que abra la
  web, y RLS le devolvía cero filas.

  A partir de esta migración los admins inician sesión con Supabase Auth de
  verdad, y se los reconoce por `app_metadata.role`.

  ## Por qué app_metadata y no una tabla

  `app_metadata` solo se puede escribir con la service_role: ni el propio
  usuario puede ascenderse a admin editando su perfil. Con `user_metadata` sí
  podría, y una tabla `admin_users` obligaría a una consulta extra en cada
  política. El rol viaja dentro del JWT, así que `is_admin()` no toca disco.

  Los admins se crean con `node scripts/create-admin.mjs` (usa la service_role).

  ## Qué abre y qué no

  Se agrega lectura para admins en las tres tablas que el panel necesita y no
  podía ver: `genius_profiles`, `client_profiles` y `reports`. Son políticas
  aditivas: las de dueño-de-su-propia-fila siguen intactas, y nadie más gana
  acceso.

  `payment_requests`, `memberships` y `payment_history` no se tocan: ya tenían
  SELECT para cualquier usuario autenticado. Conviene revisarlas —hoy un cliente
  que entra con Google puede leer los pagos de toda la plataforma—, pero eso es
  un cambio aparte, con riesgo de romper el alta de solicitudes de los genios.
*/

-- Un admin es quien tiene el rol grabado en app_metadata, dentro de su JWT.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') IN ('admin', 'super_admin');
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies
                 WHERE tablename = 'genius_profiles' AND policyname = 'Admins can read all genius profiles') THEN
    CREATE POLICY "Admins can read all genius profiles"
      ON genius_profiles FOR SELECT
      TO authenticated
      USING (is_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies
                 WHERE tablename = 'client_profiles' AND policyname = 'Admins can read all client profiles') THEN
    CREATE POLICY "Admins can read all client profiles"
      ON client_profiles FOR SELECT
      TO authenticated
      USING (is_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies
                 WHERE tablename = 'reports' AND policyname = 'Admins can read all reports') THEN
    CREATE POLICY "Admins can read all reports"
      ON reports FOR SELECT
      TO authenticated
      USING (is_admin());
  END IF;

  -- Moderar un reporte es cambiarle el estado; sin esto el panel puede verlos
  -- pero no resolverlos.
  IF NOT EXISTS (SELECT 1 FROM pg_policies
                 WHERE tablename = 'reports' AND policyname = 'Admins can update reports') THEN
    CREATE POLICY "Admins can update reports"
      ON reports FOR UPDATE
      TO authenticated
      USING (is_admin())
      WITH CHECK (is_admin());
  END IF;
END $$;


-- ############################################################################
-- MIGRATION: 20261113120000_lock_down_rls.sql
-- ############################################################################

/*
  # Sprint 0 — Cerrar las reglas de acceso (RLS)

  Hasta ahora varias tablas aceptaban escrituras de cualquiera: `USING (true)`
  para `authenticated` y, en algunos casos, sin rol (o sea, también `anon`).
  Las razones históricas (el admin y los clientes se autenticaban en
  localStorage, sin identidad en el servidor) ya no aplican: los clientes y
  genios entran con Google por Supabase Auth y el admin tiene su rol en
  `app_metadata`, que lee `is_admin()`.

  ## Qué cambia

  | Tabla | Leer | Escribir |
  |---|---|---|
  | payment_settings, platform_settings | todos | solo admin |
  | payment_requests | dueño (genio) o admin | el genio crea la suya en 'pending'; el resto, admin |
  | memberships, payment_history, genius_subscriptions | dueño o admin | solo admin |
  | beta_codes | solo admin | solo admin (el canje llegará por RPC en el Sprint 1) |
  | genius_reviews | visibles: todos; propias: el autor; todas: admin | el autor la suya; moderar y borrar: admin |
  | client_profiles | el propio cliente o admin | el propio cliente; estado y notas: admin |
  | user_favorites | los propios o admin | los propios |
  | whatsapp_clicks | admin | cualquiera (analítica) |
  | reports | autor o admin | cualquiera crea en 'pending'; el resto, admin |
  | storage (fotos, portafolio, reseñas) | todos | usuario con sesión, solo en su carpeta `<auth.uid()>/…` |

  Los campos que solo debe tocar un admin (`moderation_status`, `status`,
  `internal_notes`…) se protegen con triggers: una política no puede limitar
  columnas, y el admin usa el mismo rol `authenticated` que cualquier usuario.

  ## Datos

  - Se elimina `genius_access_credentials` (guardaba contraseñas sin cifrar).
    Las altas de genios pasan a ser por invitación + Google.
  - Los perfiles de cliente creados con un id anterior a Supabase Auth se
    re-asocian por email al id real, junto con sus favoritos y reseñas, para
    que las nuevas reglas (que comparan contra `auth.uid()`) los reconozcan.

  La migración es idempotente: se puede volver a correr sin efectos extra.
*/

-- ---------------------------------------------------------------------------
-- 0. Helpers
-- ---------------------------------------------------------------------------

-- ¿Quién ejecuta? Las migraciones (postgres) y la service_role no deben
-- quedar limitadas por los triggers de "solo admin". Los triggers que la usan
-- son SECURITY INVOKER, así que `current_user` es el rol de quien escribe:
-- `anon`/`authenticated` vía la API, `service_role` con esa clave, `postgres`
-- en el SQL Editor o con psql.
CREATE OR REPLACE FUNCTION is_privileged()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT is_admin()
      OR current_user IN ('postgres', 'supabase_admin', 'service_role');
$$;

-- ¿Es `p_genius_id` (texto o uuid) un perfil de genio del usuario actual?
CREATE OR REPLACE FUNCTION owns_genius_profile(p_genius_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM genius_profiles gp
    WHERE gp.id::text = p_genius_id AND gp.user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION owns_genius_profile(text) FROM public;
GRANT EXECUTE ON FUNCTION owns_genius_profile(text) TO anon, authenticated;

-- Borra TODAS las políticas de una tabla de `public` para recrearlas limpias.
-- Así no dependemos de los nombres que tuvieran en migraciones anteriores.
CREATE OR REPLACE FUNCTION pg_temp.drop_all_policies(p_table text)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = p_table
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', pol.policyname, p_table);
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- 1. Credenciales en texto plano: fuera
-- ---------------------------------------------------------------------------

DROP TABLE IF EXISTS genius_access_credentials;

-- ---------------------------------------------------------------------------
-- 2. Re-asociar clientes con id heredado al id de Supabase Auth
-- ---------------------------------------------------------------------------

DROP TABLE IF EXISTS pg_temp.client_id_remap;
CREATE TEMP TABLE client_id_remap AS
SELECT cp.id AS old_id, u.id::text AS new_id
FROM client_profiles cp
JOIN auth.users u ON lower(u.email) = lower(cp.email)
WHERE cp.id <> u.id::text
  AND NOT EXISTS (SELECT 1 FROM client_profiles other WHERE other.id = u.id::text);

UPDATE client_profiles cp
SET id = r.new_id
FROM client_id_remap r
WHERE cp.id = r.old_id;

-- Favoritos: si el usuario ya tiene el mismo genio con el id nuevo, se descarta
-- el duplicado heredado.
DELETE FROM user_favorites f
USING client_id_remap r
WHERE f.user_id = r.old_id
  AND EXISTS (SELECT 1 FROM user_favorites n
              WHERE n.user_id = r.new_id AND n.genius_id = f.genius_id);

UPDATE user_favorites f
SET user_id = r.new_id
FROM client_id_remap r
WHERE f.user_id = r.old_id;

-- Reseñas de cliente: misma lógica (una por cliente y genio).
UPDATE genius_reviews g
SET reviewer_user_id = r.new_id
FROM client_id_remap r
WHERE g.reviewer_type = 'client'
  AND g.reviewer_user_id = r.old_id
  AND NOT EXISTS (SELECT 1 FROM genius_reviews n
                  WHERE n.reviewer_type = 'client'
                    AND n.reviewer_user_id = r.new_id
                    AND n.reviewed_genius_id = g.reviewed_genius_id);

DROP TABLE client_id_remap;

-- ---------------------------------------------------------------------------
-- 3. Configuración: lectura pública, escritura solo admin
-- ---------------------------------------------------------------------------

SELECT pg_temp.drop_all_policies('payment_settings');
SELECT pg_temp.drop_all_policies('platform_settings');

CREATE POLICY "Public read payment settings"
  ON payment_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins insert payment settings"
  ON payment_settings FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "Admins update payment settings"
  ON payment_settings FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public read platform settings"
  ON platform_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins insert platform settings"
  ON platform_settings FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "Admins update platform settings"
  ON platform_settings FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- ---------------------------------------------------------------------------
-- 4. Pagos y membresías
-- ---------------------------------------------------------------------------

SELECT pg_temp.drop_all_policies('payment_requests');
SELECT pg_temp.drop_all_policies('beta_codes');
SELECT pg_temp.drop_all_policies('memberships');
SELECT pg_temp.drop_all_policies('payment_history');
SELECT pg_temp.drop_all_policies('genius_subscriptions');

-- payment_requests: el genio ve y crea las suyas (pendientes); el admin todo.
CREATE POLICY "Owner or admin read payment requests"
  ON payment_requests FOR SELECT TO authenticated
  USING (is_admin() OR owns_genius_profile(genius_profile_id::text));
CREATE POLICY "Genius creates own pending payment request"
  ON payment_requests FOR INSERT TO authenticated
  WITH CHECK (
    is_admin()
    OR (owns_genius_profile(genius_profile_id::text) AND status = 'pending')
  );
CREATE POLICY "Admins update payment requests"
  ON payment_requests FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admins delete payment requests"
  ON payment_requests FOR DELETE TO authenticated USING (is_admin());

-- beta_codes: solo admin. El canje del genio se hará con una RPC.
CREATE POLICY "Admins manage beta codes"
  ON beta_codes FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- memberships
CREATE POLICY "Owner or admin read memberships"
  ON memberships FOR SELECT TO authenticated
  USING (is_admin() OR owns_genius_profile(genius_profile_id::text));
CREATE POLICY "Admins insert memberships"
  ON memberships FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "Admins update memberships"
  ON memberships FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admins delete memberships"
  ON memberships FOR DELETE TO authenticated USING (is_admin());

-- payment_history
CREATE POLICY "Owner or admin read payment history"
  ON payment_history FOR SELECT TO authenticated
  USING (is_admin() OR owns_genius_profile(genius_profile_id::text));
CREATE POLICY "Admins insert payment history"
  ON payment_history FOR INSERT TO authenticated WITH CHECK (is_admin());

-- genius_subscriptions (modelo antiguo; se unifica con memberships en Sprint 1)
CREATE POLICY "Owner or admin read subscription"
  ON genius_subscriptions FOR SELECT TO authenticated
  USING (is_admin() OR owns_genius_profile(genius_id::text));
CREATE POLICY "Admins manage subscriptions"
  ON genius_subscriptions FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "Admins update subscriptions"
  ON genius_subscriptions FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- ---------------------------------------------------------------------------
-- 5. Reseñas
-- ---------------------------------------------------------------------------

SELECT pg_temp.drop_all_policies('genius_reviews');

-- Autor de la fila: el cliente por su id de Auth, o el genio por su perfil.
CREATE OR REPLACE FUNCTION is_review_author(
  p_reviewer_type text,
  p_reviewer_user_id text,
  p_reviewer_genius_id text
)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT auth.uid() IS NOT NULL AND (
    (p_reviewer_type = 'client' AND p_reviewer_user_id = auth.uid()::text)
    OR (p_reviewer_type = 'genius' AND owns_genius_profile(p_reviewer_genius_id))
  );
$$;

CREATE POLICY "Read visible, own or all if admin"
  ON genius_reviews FOR SELECT TO anon, authenticated
  USING (
    moderation_status = 'visible'
    OR is_admin()
    OR is_review_author(reviewer_type, reviewer_user_id, reviewer_genius_id)
  );

-- Nadie se reseña a sí mismo como genio.
CREATE POLICY "Authors insert own review"
  ON genius_reviews FOR INSERT TO authenticated
  WITH CHECK (
    is_admin()
    OR (
      is_review_author(reviewer_type, reviewer_user_id, reviewer_genius_id)
      AND NOT owns_genius_profile(reviewed_genius_id)
    )
  );

CREATE POLICY "Authors update own review"
  ON genius_reviews FOR UPDATE TO authenticated
  USING (is_admin() OR is_review_author(reviewer_type, reviewer_user_id, reviewer_genius_id))
  WITH CHECK (is_admin() OR is_review_author(reviewer_type, reviewer_user_id, reviewer_genius_id));

CREATE POLICY "Admins delete reviews"
  ON genius_reviews FOR DELETE TO authenticated USING (is_admin());

-- Moderación e identidad: solo las cambia un admin.
CREATE OR REPLACE FUNCTION protect_review_admin_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF is_privileged() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.moderation_status := 'visible';
    NEW.moderation_note   := '';
    NEW.moderated_at      := NULL;
  ELSE
    NEW.moderation_status  := OLD.moderation_status;
    NEW.moderation_note    := OLD.moderation_note;
    NEW.moderated_at       := OLD.moderated_at;
    NEW.reviewer_type      := OLD.reviewer_type;
    NEW.reviewer_user_id   := OLD.reviewer_user_id;
    NEW.reviewer_genius_id := OLD.reviewer_genius_id;
    NEW.reviewed_genius_id := OLD.reviewed_genius_id;
    NEW.created_at         := OLD.created_at;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS genius_reviews_protect_admin_fields ON genius_reviews;
CREATE TRIGGER genius_reviews_protect_admin_fields
  BEFORE INSERT OR UPDATE ON genius_reviews
  FOR EACH ROW EXECUTE FUNCTION protect_review_admin_fields();

-- ---------------------------------------------------------------------------
-- 6. Perfiles de cliente
-- ---------------------------------------------------------------------------

SELECT pg_temp.drop_all_policies('client_profiles');

CREATE POLICY "Client or admin read profile"
  ON client_profiles FOR SELECT TO authenticated
  USING (is_admin() OR id = auth.uid()::text);

-- El id y el email deben ser los de la sesión: nadie crea el perfil de otro.
CREATE POLICY "Client inserts own profile"
  ON client_profiles FOR INSERT TO authenticated
  WITH CHECK (
    id = auth.uid()::text
    AND lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

CREATE POLICY "Client or admin update profile"
  ON client_profiles FOR UPDATE TO authenticated
  USING (is_admin() OR id = auth.uid()::text)
  WITH CHECK (is_admin() OR id = auth.uid()::text);

CREATE OR REPLACE FUNCTION protect_client_admin_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF is_privileged() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.status         := 'active';
    NEW.internal_notes := '';
  ELSE
    NEW.status         := OLD.status;
    NEW.internal_notes := OLD.internal_notes;
    NEW.id             := OLD.id;
    NEW.email          := OLD.email;
    NEW.created_at     := OLD.created_at;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS client_profiles_protect_admin_fields ON client_profiles;
CREATE TRIGGER client_profiles_protect_admin_fields
  BEFORE INSERT OR UPDATE ON client_profiles
  FOR EACH ROW EXECUTE FUNCTION protect_client_admin_fields();

-- ---------------------------------------------------------------------------
-- 7. Favoritos
-- ---------------------------------------------------------------------------

SELECT pg_temp.drop_all_policies('user_favorites');

CREATE POLICY "Owner or admin read favorites"
  ON user_favorites FOR SELECT TO authenticated
  USING (is_admin() OR user_id = auth.uid()::text);
CREATE POLICY "Owner inserts favorites"
  ON user_favorites FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "Owner deletes favorites"
  ON user_favorites FOR DELETE TO authenticated
  USING (user_id = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- 8. Analítica de WhatsApp: cualquiera registra, solo admin lee
-- ---------------------------------------------------------------------------

SELECT pg_temp.drop_all_policies('whatsapp_clicks');

CREATE POLICY "Anyone records whatsapp click"
  ON whatsapp_clicks FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins read whatsapp clicks"
  ON whatsapp_clicks FOR SELECT TO authenticated USING (is_admin());

-- Las RPC de contadores corren como definer: fijar search_path evita que un
-- esquema ajeno suplante `genius_profiles`.
ALTER FUNCTION increment_genius_whatsapp_clicks(text) SET search_path = public;
ALTER FUNCTION increment_genius_profile_views(text) SET search_path = public;

-- ---------------------------------------------------------------------------
-- 9. Reportes: también los visitantes sin sesión pueden reportar
-- ---------------------------------------------------------------------------

SELECT pg_temp.drop_all_policies('reports');

CREATE POLICY "Anyone submits pending report"
  ON reports FOR INSERT TO anon, authenticated
  WITH CHECK (
    status = 'pending'
    AND coalesce(admin_notes, '') = ''
    AND (reporter_id IS NULL OR reporter_id = auth.uid())
  );
CREATE POLICY "Reporter or admin read reports"
  ON reports FOR SELECT TO authenticated
  USING (is_admin() OR reporter_id = auth.uid());
CREATE POLICY "Admins update reports"
  ON reports FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admins delete reports"
  ON reports FOR DELETE TO authenticated USING (is_admin());

-- ---------------------------------------------------------------------------
-- 10. Storage: subir solo con sesión y dentro de la carpeta propia
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Anyone can upload profile-photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload portfolios" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload review images" ON storage.objects;
DROP POLICY IF EXISTS "Users upload to own folder" ON storage.objects;

CREATE POLICY "Users upload to own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('profile-photos', 'portfolios', 'review-images')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
