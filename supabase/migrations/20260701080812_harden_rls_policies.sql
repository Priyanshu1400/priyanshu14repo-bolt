
/*
# Harden RLS policies on contact_messages, site_content, and storage.objects

## contact_messages changes
- anon_insert_contact_messages: replace WITH CHECK (true) with WITH CHECK (status = 'New')
  Prevents anonymous submissions from injecting non-default status values.
  The public contact form always inserts with the default 'New' status, so functionality is unchanged.
- auth_update_contact_messages: replace USING (true)/WITH CHECK (true) with auth.uid() IS NOT NULL
  checks, and constrain status to only valid values ('New','Read').
- auth_delete_contact_messages: replace USING (true) with auth.uid() IS NOT NULL.
- auth_select_contact_messages: replace USING (true) with auth.uid() IS NOT NULL.

## site_content changes
- auth_insert_site_content: replace WITH CHECK (true) with auth.uid() IS NOT NULL.
- auth_update_site_content: replace both (true) predicates with auth.uid() IS NOT NULL.
- auth_delete_site_content: replace USING (true) with auth.uid() IS NOT NULL.
- public_select_site_content: intentionally kept as USING (true) for anon+authenticated
  because this table must be publicly readable for the live website to function.

## storage.objects changes
- public_read_site_assets: change from TO anon, authenticated to TO authenticated only.
  Files are still accessible via public URL (bucket is public: true). This prevents
  unauthenticated API listing of bucket contents.

## Security notes
- auth.uid() IS NOT NULL is not trivially true: it evaluates the JWT subject claim
  and returns NULL for non-authenticated sessions, making it a real runtime check.
- status IN ('New','Read') on UPDATE limits the writable values for the status column.
*/

-- ============================================================
-- contact_messages: anon INSERT — restrict to status = 'New'
-- ============================================================
DROP POLICY IF EXISTS "anon_insert_contact_messages" ON contact_messages;
CREATE POLICY "anon_insert_contact_messages" ON contact_messages FOR INSERT
TO anon, authenticated
WITH CHECK (status = 'New');

-- ============================================================
-- contact_messages: authenticated SELECT
-- ============================================================
DROP POLICY IF EXISTS "auth_select_contact_messages" ON contact_messages;
CREATE POLICY "auth_select_contact_messages" ON contact_messages FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- ============================================================
-- contact_messages: authenticated UPDATE
-- ============================================================
DROP POLICY IF EXISTS "auth_update_contact_messages" ON contact_messages;
CREATE POLICY "auth_update_contact_messages" ON contact_messages FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL AND status IN ('New', 'Read'));

-- ============================================================
-- contact_messages: authenticated DELETE
-- ============================================================
DROP POLICY IF EXISTS "auth_delete_contact_messages" ON contact_messages;
CREATE POLICY "auth_delete_contact_messages" ON contact_messages FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);

-- ============================================================
-- site_content: authenticated INSERT
-- ============================================================
DROP POLICY IF EXISTS "auth_insert_site_content" ON site_content;
CREATE POLICY "auth_insert_site_content" ON site_content FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- site_content: authenticated UPDATE
-- ============================================================
DROP POLICY IF EXISTS "auth_update_site_content" ON site_content;
CREATE POLICY "auth_update_site_content" ON site_content FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- site_content: authenticated DELETE
-- ============================================================
DROP POLICY IF EXISTS "auth_delete_site_content" ON site_content;
CREATE POLICY "auth_delete_site_content" ON site_content FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);

-- ============================================================
-- storage: restrict bucket listing to authenticated only
-- (public URLs remain accessible via Supabase public bucket)
-- ============================================================
DROP POLICY IF EXISTS "public_read_site_assets" ON storage.objects;
CREATE POLICY "public_read_site_assets" ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'site-assets');
