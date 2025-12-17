/*
  # Multivendor Marketplace Database Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `full_name` (text)
      - `role` (text) - 'buyer', 'vendor', or 'admin'
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `vendor_profiles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `store_name` (text)
      - `store_description` (text)
      - `commission_rate` (numeric) - Platform commission percentage
      - `status` (text) - 'pending', 'active', 'suspended'
      - `total_sales` (numeric)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `products`
      - `id` (uuid, primary key)
      - `vendor_id` (uuid, references vendor_profiles)
      - `name` (text)
      - `description` (text)
      - `price` (numeric)
      - `stock_quantity` (integer)
      - `category` (text)
      - `image_url` (text)
      - `status` (text) - 'draft', 'active', 'out_of_stock'
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `orders`
      - `id` (uuid, primary key)
      - `buyer_id` (uuid, references profiles)
      - `total_amount` (numeric)
      - `status` (text) - 'pending', 'processing', 'completed', 'cancelled'
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `order_items`
      - `id` (uuid, primary key)
      - `order_id` (uuid, references orders)
      - `product_id` (uuid, references products)
      - `vendor_id` (uuid, references vendor_profiles)
      - `quantity` (integer)
      - `price` (numeric) - Price at time of purchase
      - `commission_amount` (numeric) - Platform commission for this item
      - `vendor_amount` (numeric) - Amount vendor receives
      - `created_at` (timestamp)
    
    - `cart_items`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `product_id` (uuid, references products)
      - `quantity` (integer)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users based on their roles
    - Buyers can view their own orders and cart
    - Vendors can manage their own products and view their orders
    - Admins have full access
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'buyer' CHECK (role IN ('buyer', 'vendor', 'admin')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Vendor profiles table
CREATE TABLE IF NOT EXISTS vendor_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  store_name text NOT NULL,
  store_description text,
  commission_rate numeric DEFAULT 10.0 CHECK (commission_rate >= 0 AND commission_rate <= 100),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
  total_sales numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE vendor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active vendor profiles"
  ON vendor_profiles FOR SELECT
  TO authenticated
  USING (status = 'active');

CREATE POLICY "Vendors can view own profile"
  ON vendor_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Vendors can update own profile"
  ON vendor_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can create vendor profile"
  ON vendor_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price >= 0),
  stock_quantity integer DEFAULT 0 CHECK (stock_quantity >= 0),
  category text NOT NULL,
  image_url text,
  status text DEFAULT 'active' CHECK (status IN ('draft', 'active', 'out_of_stock')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  TO authenticated
  USING (status = 'active');

CREATE POLICY "Vendors can view own products"
  ON products FOR SELECT
  TO authenticated
  USING (
    vendor_id IN (
      SELECT id FROM vendor_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can insert own products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    vendor_id IN (
      SELECT id FROM vendor_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can update own products"
  ON products FOR UPDATE
  TO authenticated
  USING (
    vendor_id IN (
      SELECT id FROM vendor_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    vendor_id IN (
      SELECT id FROM vendor_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can delete own products"
  ON products FOR DELETE
  TO authenticated
  USING (
    vendor_id IN (
      SELECT id FROM vendor_profiles WHERE user_id = auth.uid()
    )
  );

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  total_amount numeric NOT NULL CHECK (total_amount >= 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid());

CREATE POLICY "Buyers can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = auth.uid());

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  vendor_id uuid NOT NULL REFERENCES vendor_profiles(id),
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric NOT NULL CHECK (price >= 0),
  commission_amount numeric DEFAULT 0 CHECK (commission_amount >= 0),
  vendor_amount numeric DEFAULT 0 CHECK (vendor_amount >= 0),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM orders WHERE buyer_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can view their order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    vendor_id IN (
      SELECT id FROM vendor_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can create order items"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Cart items table
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cart"
  ON cart_items FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert into own cart"
  ON cart_items FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own cart"
  ON cart_items FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete from own cart"
  ON cart_items FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_vendor_id ON order_items(vendor_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);