import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export function supabaseCatalog() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export function mapProduct(p: Record<string, unknown>) {
  const numericId = Number(p.numeric_id);
  const weightKg = Number(p.weight) || 0;
  return {
    id: numericId,
    title: p.name ?? '',
    body_html: p.description ?? '',
    vendor: p.vendor ?? '',
    product_type: p.product_type ?? '',
    created_at: p.created_at ?? '',
    handle: String(p.name ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    updated_at: p.updated_at ?? p.created_at ?? '',
    tags: '',
    status: p.is_active ? 'active' : 'draft',
    variants: [
      {
        id: numericId,
        title: p.variant ?? 'Default',
        price: String(p.price ?? '0'),
        sku: p.sku ?? '',
        quantity: Number(p.stock_quantity) || 0,
        created_at: p.created_at ?? '',
        updated_at: p.updated_at ?? p.created_at ?? '',
        taxable: true,
        grams: Math.round(weightKg * 1000),
        image: { src: String(p.image ?? '') },
        weight: weightKg,
        weight_unit: 'kg',
      },
    ],
    image: { src: String(p.image ?? '') },
  };
}

export function mapCollection(c: Record<string, unknown>) {
  return {
    id: Number(c.numeric_id),
    title: c.title ?? '',
    handle: c.handle ?? '',
    body_html: c.description ?? '',
    updated_at: c.updated_at ?? c.created_at ?? '',
    image: { src: 'https://i.ibb.co/r27ykgpQ/f4a714a61b5147afa12841b6dc28140d.png' },
  };
}

export function parsePagination(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit = Math.min(250, Math.max(1, parseInt(searchParams.get('limit') ?? '100')));
  return { page, limit, from: (page - 1) * limit, to: (page - 1) * limit + limit - 1 };
}

export function verifyCatalogApiKey(req: NextRequest): NextResponse | null {
  const catalogKey = process.env.CATALOG_API_KEY;
  if (!catalogKey) return null;
  const provided = req.headers.get('x-api-key') ?? req.nextUrl.searchParams.get('api_key') ?? '';
  if (provided !== catalogKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}