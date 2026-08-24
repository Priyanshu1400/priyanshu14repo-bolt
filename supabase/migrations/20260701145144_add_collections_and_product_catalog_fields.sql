
-- Add catalog fields to products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS updated_at   timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS vendor       text        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS product_type text        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS sku          text        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS weight       numeric     NOT NULL DEFAULT 0;

-- Auto-update updated_at on products
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_set_updated_at ON products;
CREATE TRIGGER products_set_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Collections table
CREATE TABLE IF NOT EXISTS collections (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text        NOT NULL,
  handle      text        UNIQUE NOT NULL,
  description text        NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS collections_set_updated_at ON collections;
CREATE TRIGGER collections_set_updated_at
  BEFORE UPDATE ON collections
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Join table: products <-> collections
CREATE TABLE IF NOT EXISTS product_collections (
  product_id    uuid NOT NULL REFERENCES products(id)    ON DELETE CASCADE,
  collection_id uuid NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, collection_id)
);

-- RLS
ALTER TABLE collections         ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_collections ENABLE ROW LEVEL SECURITY;

-- Public read (catalog sync is public GET)
CREATE POLICY "collections_select_anon" ON collections
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "product_collections_select_anon" ON product_collections
  FOR SELECT TO anon, authenticated USING (true);

-- Authenticated write for collections
CREATE POLICY "collections_insert_auth" ON collections
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "collections_update_auth" ON collections
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "collections_delete_auth" ON collections
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "product_collections_insert_auth" ON product_collections
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "product_collections_delete_auth" ON product_collections
  FOR DELETE TO authenticated USING (true);
