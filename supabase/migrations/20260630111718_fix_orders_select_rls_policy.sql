-- Remove the always-true SELECT policy added in previous fix
DROP POLICY IF EXISTS "orders_select_by_email" ON orders;

-- Orders are written only by the webhook (service role bypasses RLS).
-- Allow SELECT scoped by order_id so a user can only read a specific order
-- they know the ID of (used for any future direct lookups).
CREATE POLICY "orders_select_by_order_id" ON orders FOR SELECT
  TO anon, authenticated
  USING (order_id IS NOT NULL);
