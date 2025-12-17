-- Add shipping fields to orders for buyer details
ALTER TABLE IF EXISTS orders
  ADD COLUMN IF NOT EXISTS shipping_name text,
  ADD COLUMN IF NOT EXISTS shipping_phone text,
  ADD COLUMN IF NOT EXISTS shipping_address text,
  ADD COLUMN IF NOT EXISTS shipping_city text,
  ADD COLUMN IF NOT EXISTS shipping_postal_code text;



