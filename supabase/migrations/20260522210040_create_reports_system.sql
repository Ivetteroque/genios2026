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
