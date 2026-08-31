CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text UNIQUE NOT NULL,
  customer_phone text,
  customer_email text,
  payment_type text,
  total_amount numeric,
  status text NOT NULL DEFAULT 'Confirmed',
  cart_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_insert_orders" ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE POLICY "service_select_orders" ON orders FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "service_update_orders" ON orders FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "service_delete_orders" ON orders FOR DELETE
  TO anon, authenticated USING (true);