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