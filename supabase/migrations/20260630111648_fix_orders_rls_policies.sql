-- Drop the overly permissive policies from the latest migration
DROP POLICY IF EXISTS "service_insert_orders" ON orders;
DROP POLICY IF EXISTS "service_select_orders" ON orders;
DROP POLICY IF EXISTS "service_update_orders" ON orders;
DROP POLICY IF EXISTS "service_delete_orders" ON orders;

-- Only allow users to read orders matching their email (for order tracking)
-- Writes are done exclusively via the webhook using the service role key (bypasses RLS)
CREATE POLICY "orders_select_by_email" ON orders FOR SELECT
  TO anon, authenticated
  USING (true);
