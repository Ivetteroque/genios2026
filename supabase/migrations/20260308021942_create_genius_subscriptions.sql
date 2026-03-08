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