/*
# Add numeric_id to products and collections

## Purpose
Shiprocket's catalog API requires integer (numeric) IDs for products, variants, and collections.
The existing `id` columns are UUIDs and cannot be changed without breaking database relations.
This migration adds a separate auto-incrementing `numeric_id` column to both tables.

## Changes
### products table
- New column: `numeric_id` (bigint, auto-increment via sequence, unique, not null)
  - Automatically assigned in insertion order; never changes after creation.
  - Used as the external-facing ID in Shiprocket catalog API responses.
  - The UUID `id` remains the internal primary key for all foreign key relations.

### collections table
- New column: `numeric_id` (bigint, auto-increment via sequence, unique, not null)
  - Same semantics as above.

## Security
- No RLS changes. Existing policies cover SELECT on both tables for anon + authenticated roles.

## Notes
1. Existing rows will be back-filled with sequential numeric_ids immediately after the columns are added.
2. New rows get the next value automatically via the sequence default.
3. `numeric_id` is exposed in the API; `id` (UUID) remains internal only.
*/

-- products: add sequence-backed numeric_id
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS numeric_id bigint;

CREATE SEQUENCE IF NOT EXISTS products_numeric_id_seq;

UPDATE products SET numeric_id = nextval('products_numeric_id_seq') WHERE numeric_id IS NULL;

ALTER TABLE products
  ALTER COLUMN numeric_id SET DEFAULT nextval('products_numeric_id_seq'),
  ALTER COLUMN numeric_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS products_numeric_id_key ON products (numeric_id);

-- collections: add sequence-backed numeric_id
ALTER TABLE collections
  ADD COLUMN IF NOT EXISTS numeric_id bigint;

CREATE SEQUENCE IF NOT EXISTS collections_numeric_id_seq;

UPDATE collections SET numeric_id = nextval('collections_numeric_id_seq') WHERE numeric_id IS NULL;

ALTER TABLE collections
  ALTER COLUMN numeric_id SET DEFAULT nextval('collections_numeric_id_seq'),
  ALTER COLUMN numeric_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS collections_numeric_id_key ON collections (numeric_id);
