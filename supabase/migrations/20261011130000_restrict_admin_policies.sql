/*
  # Restrict admin-only data to listed admin emails

  Anyone can create an account on /login, and the earlier policies let ANY
  signed-in user read contact messages and change site content, collections
  and uploaded site assets. This replaces "auth.uid() IS NOT NULL" with
  is_admin(), which only passes for emails listed in admin_users.

  BEFORE RUNNING: replace REPLACE_WITH_YOUR_ADMIN_EMAIL below with the email
  you use on /admin/login. The script refuses to run until you do, so you
  can't lock yourself out by accident.

  1. New
    - `admin_users` table (RLS on, no policies: not readable from the browser)
    - `is_admin()` function
  2. Changed policies (now admin-only)
    - contact_messages: select, update, delete   (public insert unchanged)
    - site_content: insert, update, delete      (public select unchanged)
    - collections, product_collections: insert, update, delete (public select unchanged)
    - storage site-assets: insert, update, delete
  3. Added
    - orders: admins can read all orders (customers still see only their own)
*/

BEGIN;

CREATE TABLE IF NOT EXISTS admin_users (
  email text PRIMARY KEY CHECK (email = lower(trim(email)))
);
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

INSERT INTO admin_users (email)
VALUES (lower(trim('REPLACE_WITH_YOUR_ADMIN_EMAIL')))
ON CONFLICT (email) DO NOTHING;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM admin_users WHERE email = 'replace_with_your_admin_email') THEN
    RAISE EXCEPTION 'Replace REPLACE_WITH_YOUR_ADMIN_EMAIL with your admin email, then run again.';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
REVOKE ALL ON FUNCTION is_admin() FROM public;
GRANT EXECUTE ON FUNCTION is_admin() TO anon, authenticated;

-- contact_messages
DROP POLICY IF EXISTS "auth_select_contact_messages" ON contact_messages;
CREATE POLICY "auth_select_contact_messages" ON contact_messages FOR SELECT
TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "auth_update_contact_messages" ON contact_messages;
CREATE POLICY "auth_update_contact_messages" ON contact_messages FOR UPDATE
TO authenticated USING (is_admin())
WITH CHECK (is_admin() AND status IN ('New', 'Read'));

DROP POLICY IF EXISTS "auth_delete_contact_messages" ON contact_messages;
CREATE POLICY "auth_delete_contact_messages" ON contact_messages FOR DELETE
TO authenticated USING (is_admin());

-- site_content
DROP POLICY IF EXISTS "auth_insert_site_content" ON site_content;
CREATE POLICY "auth_insert_site_content" ON site_content FOR INSERT
TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "auth_update_site_content" ON site_content;
CREATE POLICY "auth_update_site_content" ON site_content FOR UPDATE
TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "auth_delete_site_content" ON site_content;
CREATE POLICY "auth_delete_site_content" ON site_content FOR DELETE
TO authenticated USING (is_admin());

-- collections / product_collections
DROP POLICY IF EXISTS "collections_insert_auth" ON collections;
CREATE POLICY "collections_insert_auth" ON collections
  FOR INSERT TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "collections_update_auth" ON collections;
CREATE POLICY "collections_update_auth" ON collections
  FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "collections_delete_auth" ON collections;
CREATE POLICY "collections_delete_auth" ON collections
  FOR DELETE TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "product_collections_insert_auth" ON product_collections;
CREATE POLICY "product_collections_insert_auth" ON product_collections
  FOR INSERT TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "product_collections_delete_auth" ON product_collections;
CREATE POLICY "product_collections_delete_auth" ON product_collections
  FOR DELETE TO authenticated USING (is_admin());

-- storage: site-assets uploads
DROP POLICY IF EXISTS "auth_upload_site_assets" ON storage.objects;
CREATE POLICY "auth_upload_site_assets" ON storage.objects FOR INSERT
TO authenticated WITH CHECK (bucket_id = 'site-assets' AND is_admin());

DROP POLICY IF EXISTS "auth_update_site_assets" ON storage.objects;
CREATE POLICY "auth_update_site_assets" ON storage.objects FOR UPDATE
TO authenticated USING (bucket_id = 'site-assets' AND is_admin());

DROP POLICY IF EXISTS "auth_delete_site_assets" ON storage.objects;
CREATE POLICY "auth_delete_site_assets" ON storage.objects FOR DELETE
TO authenticated USING (bucket_id = 'site-assets' AND is_admin());

-- orders: let admins see every order in the dashboard
DROP POLICY IF EXISTS "orders_select_admin" ON orders;
CREATE POLICY "orders_select_admin" ON orders FOR SELECT
TO authenticated USING (is_admin());

COMMIT;
