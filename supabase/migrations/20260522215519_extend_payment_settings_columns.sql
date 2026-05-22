/*
  # Extend payment_settings with additional columns

  ## Summary
  Adds three columns needed by the new ConfigSettings admin module:
  - `annual_price`          — configurable membership price in PEN soles
  - `payment_instructions`  — free-text instructions shown to the genio
  - `payments_enabled`      — master toggle to enable/disable manual payments

  ## Notes
  Uses IF NOT EXISTS guards to be safe on re-runs.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_settings' AND column_name = 'annual_price'
  ) THEN
    ALTER TABLE payment_settings ADD COLUMN annual_price numeric(10,2) NOT NULL DEFAULT 150;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_settings' AND column_name = 'payment_instructions'
  ) THEN
    ALTER TABLE payment_settings ADD COLUMN payment_instructions text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_settings' AND column_name = 'payments_enabled'
  ) THEN
    ALTER TABLE payment_settings ADD COLUMN payments_enabled boolean NOT NULL DEFAULT true;
  END IF;
END $$;
