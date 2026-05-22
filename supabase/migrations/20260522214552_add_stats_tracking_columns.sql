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
