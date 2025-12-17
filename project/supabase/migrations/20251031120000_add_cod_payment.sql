-- Add payment method support to orders
ALTER TABLE IF EXISTS orders
  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'cod' CHECK (payment_method IN ('cod', 'card')),
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid'));

-- Optional: allow authenticated users to select/insert payment fields (keeps existing RLS intact)
DROP POLICY IF EXISTS "Buyers can create orders" ON orders;
CREATE POLICY "Buyers can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = auth.uid());



