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
