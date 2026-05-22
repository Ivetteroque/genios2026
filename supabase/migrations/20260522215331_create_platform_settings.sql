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
