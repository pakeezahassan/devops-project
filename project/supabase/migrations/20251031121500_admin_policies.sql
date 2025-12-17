-- Admin policies to allow platform admins to manage data via RLS

-- Helper note: We detect admin via profiles.role = 'admin'

-- Orders: allow admins to view all orders
CREATE POLICY IF NOT EXISTS "Admins can view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Order items: allow admins to view all order items
CREATE POLICY IF NOT EXISTS "Admins can view all order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Vendor profiles: allow admins to update/approve any vendor profile
CREATE POLICY IF NOT EXISTS "Admins can update vendor profiles"
  ON vendor_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );


