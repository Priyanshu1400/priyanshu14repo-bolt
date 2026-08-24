/*
# Create products and orders tables

1. New Tables
- `products`: Stores product catalog for 300ml Tea
  - `id` (uuid, primary key)
  - `name` (text, not null)
  - `slug` (text, unique, not null)
  - `description` (text)
  - `price` (integer, not null)
  - `original_price` (integer)
  - `image` (text)
  - `variant` (text)
  - `is_active` (boolean, default true)
  - `created_at` (timestamp)
- `orders`: Stores customer orders
  - `id` (uuid, primary key)
  - `order_id` (text, unique, not null)
  - `user_id` (uuid, references auth.users)
  - `email` (text)
  - `full_name` (text)
  - `phone` (text)
  - `address` (text)
  - `city` (text)
  - `state` (text)
  - `pincode` (text)
  - `payment_method` (text)
  - `total` (integer, not null)
  - `status` (text, default 'pending')
  - `created_at` (timestamp)
2. Security
- Enable RLS on both tables.
- Orders are scoped to authenticated users via user_id.
- Products are publicly readable for all visitors.
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  price integer NOT NULL,
  original_price integer,
  image text,
  variant text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text,
  full_name text,
  phone text,
  address text,
  city text,
  state text,
  pincode text,
  payment_method text,
  total integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Products: public read for all visitors
DROP POLICY IF EXISTS "products_public_select" ON products;
CREATE POLICY "products_public_select"
  ON products FOR SELECT
  TO anon, authenticated USING (true);

-- Orders: authenticated users can only see their own orders
DROP POLICY IF EXISTS "orders_select_own" ON orders;
CREATE POLICY "orders_select_own"
  ON orders FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "orders_insert_own" ON orders;
CREATE POLICY "orders_insert_own"
  ON orders FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "orders_update_own" ON orders;
CREATE POLICY "orders_update_own"
  ON orders FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Insert default product
INSERT INTO products (name, slug, description, price, original_price, variant, is_active)
VALUES (
  '300ml Tea — Adrak & Elaichi',
  '300ml-tea-adrak-elaichi',
  'Pre-measured raw chai blend with tea powder, sugar, and Adrak & Elaichi masala. Not instant. Just add milk and water.',
  250,
  500,
  'Adrak & Elaichi',
  true
)
ON CONFLICT (slug) DO NOTHING;
