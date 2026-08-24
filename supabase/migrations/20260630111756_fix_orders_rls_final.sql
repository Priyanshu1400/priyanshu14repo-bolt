-- Remove the always-true SELECT policy
DROP POLICY IF EXISTS "orders_select_by_order_id" ON orders;

-- Drop the existing policy first then recreate with proper scope
DROP POLICY IF EXISTS "orders_select_own" ON orders;

CREATE POLICY "orders_select_own" ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
