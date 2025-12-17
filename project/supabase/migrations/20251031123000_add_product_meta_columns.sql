-- Add SEO meta fields to products
ALTER TABLE IF EXISTS products
  ADD COLUMN IF NOT EXISTS meta_title text,
  ADD COLUMN IF NOT EXISTS meta_description text,
  ADD COLUMN IF NOT EXISTS meta_image_url text;


