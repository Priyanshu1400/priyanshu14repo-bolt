
/*
# Drop storage SELECT policy for site-assets bucket

## Problem
The `public_read_site_assets` SELECT policy on `storage.objects` allows authenticated
users to enumerate all files in the bucket via the Supabase Storage API
(e.g. supabase.storage.from('site-assets').list()). This exposes more than intended.

## Why this is safe to remove
- Public bucket URL access (https://.../storage/v1/object/public/site-assets/...) 
  bypasses RLS entirely — the `public: true` bucket setting handles that independently.
- Our admin UI uses `getPublicUrl()` which is synchronous and constructs the URL
  locally without making any API listing call.
- Upload (INSERT), update (UPDATE), and delete (DELETE) policies are untouched.

## Result
- Direct object URLs continue to work for everyone (bucket is public).
- API-level bucket listing is blocked for all callers (no SELECT policy).
- Admin can still upload, update, and delete objects via the authenticated policies.
*/

DROP POLICY IF EXISTS "public_read_site_assets" ON storage.objects;
