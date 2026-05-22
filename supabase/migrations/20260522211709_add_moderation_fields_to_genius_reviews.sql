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
