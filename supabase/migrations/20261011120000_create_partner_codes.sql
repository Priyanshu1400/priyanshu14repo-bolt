/*
  # Partner referral codes

  1. New tables
    - `partner_codes`: one row per influencer / family member code (e.g. VIJAY10).
      The discount itself is applied by Shiprocket Checkout; this table only
      tracks who owns each code and their progress toward the surprise gift.
    - `order_events`: raw copy of every order webhook payload, so orders can be
      matched to partner codes whatever field Shiprocket puts the coupon in.

  2. Security
    - RLS enabled with no policies: only the server (service role) can read or
      write these tables. The admin dashboard goes through /api/admin/partner-codes,
      which checks the signed-in email against ADMIN_EMAILS.
*/

CREATE TABLE IF NOT EXISTS partner_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'influencer' CHECK (kind IN ('influencer', 'family')),
  discount_percent integer NOT NULL DEFAULT 10,
  gift_goal integer NOT NULL DEFAULT 5,
  manual_orders integer NOT NULL DEFAULT 0,
  gift_sent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE partner_codes ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS order_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL,
  payload jsonb NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_events_order_id_idx ON order_events (order_id);

ALTER TABLE order_events ENABLE ROW LEVEL SECURITY;
