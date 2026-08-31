/*
# Create newsletter subscribers table

1. New Tables
- `newsletter_subscribers` stores email addresses submitted through the public newsletter signup.
- `id` is a generated UUID primary key.
- `email` is a normalized, unique email address.
- `created_at` records when the subscription was created.

2. Security
- Row level security is enabled.
- Anonymous and authenticated visitors may insert an email address.
- Subscriber records cannot be read, changed, or deleted through the browser client.

3. Important Notes
- The table is intentionally write-only from the public site so subscriber emails are not exposed.
- Duplicate email submissions are rejected by the unique constraint and handled as a friendly success in the form.
*/

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE CHECK (char_length(email) <= 254),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "newsletter_select_denied" ON public.newsletter_subscribers;
CREATE POLICY "newsletter_select_denied" ON public.newsletter_subscribers
  FOR SELECT TO anon, authenticated USING (false);

DROP POLICY IF EXISTS "newsletter_insert_public" ON public.newsletter_subscribers;
CREATE POLICY "newsletter_insert_public" ON public.newsletter_subscribers
  FOR INSERT TO anon, authenticated
  WITH CHECK (email = lower(trim(email)) AND email ~ '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$');

DROP POLICY IF EXISTS "newsletter_update_denied" ON public.newsletter_subscribers;
CREATE POLICY "newsletter_update_denied" ON public.newsletter_subscribers
  FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "newsletter_delete_denied" ON public.newsletter_subscribers;
CREATE POLICY "newsletter_delete_denied" ON public.newsletter_subscribers
  FOR DELETE TO anon, authenticated USING (false);
