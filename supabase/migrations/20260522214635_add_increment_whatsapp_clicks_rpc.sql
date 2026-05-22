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
