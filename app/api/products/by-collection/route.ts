import { NextRequest, NextResponse } from 'next/server';
import {
  supabaseCatalog,
  mapProduct,
  parsePagination,
  verifyCatalogApiKey,
} from '@/lib/catalog';

export async function GET(req: NextRequest) {
  const denied = verifyCatalogApiKey(req);
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const collection_id = searchParams.get('collection_id') ?? '';
  const { page, limit, from, to } = parsePagination(req);

  if (!collection_id) {
    return NextResponse.json(
      { error: 'Missing collection_id' },
      { status: 400 }
    );
  }

  const numericId = Number(collection_id);

  if (Number.isNaN(numericId)) {
    return NextResponse.json(
      { error: 'Invalid collection_id' },
      { status: 400 }
    );
  }

  const supabase = supabaseCatalog();

  // Get the UUID of the collection using numeric_id
  const { data: collection, error: collectionError } = await supabase
    .from('collections')
    .select('id')
    .eq('numeric_id', numericId)
    .single();

  if (collectionError) {
    return NextResponse.json(
      { error: collectionError.message },
      { status: 500 }
    );
  }

  if (!collection) {
    return NextResponse.json({
      products: [],
      pagination: {
        page,
        limit,
        total: 0,
        total_pages: 0,
      },
    });
  }

  const { data: joins, error: joinError } = await supabase
    .from('product_collections')
    .select('product_id')
    .eq('collection_id', collection.id);

  if (joinError) {
    return NextResponse.json(
      { error: joinError.message },
      { status: 500 }
    );
  }

  const productIds = (joins ?? []).map(
    (r: { product_id: string }) => r.product_id
  );

  if (productIds.length === 0) {
    return NextResponse.json({
      products: [],
      pagination: {
        page,
        limit,
        total: 0,
        total_pages: 0,
      },
    });
  }

  const { data, error, count } = await supabase
    .from('products')
    .select('*', { count: 'exact' })
    .in('id', productIds)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .range(from, to);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    products: (data ?? []).map(mapProduct),
    pagination: {
      page,
      limit,
      total: count ?? 0,
      total_pages: Math.ceil((count ?? 0) / limit),
    },
  });
}