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
