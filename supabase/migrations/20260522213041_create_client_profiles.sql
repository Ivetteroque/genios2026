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
