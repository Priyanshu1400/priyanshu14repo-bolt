import { NextRequest } from 'next/server';
import { supabaseCatalog, mapProduct, parsePagination, verifyCatalogApiKey } from '@/lib/catalog';

export async function GET(req: NextRequest) {
  const denied = verifyCatalogApiKey(req);
  if (denied) return denied;

  const { limit, from, to } = parsePagination(req);

  const { data, error, count } = await supabaseCatalog()
    .from('products')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .order('numeric_id', { ascending: true })
    .range(from, to);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const payload = {
    data: {
      total: count ?? 0,
      products: (data ?? []).map(mapProduct),
    },
  };

  return new Response(
    JSON.stringify(payload)
      .replace(/\\u003C/g, '<')
      .replace(/\\u003E/g, '>')
      .replace(/\\u0026/g, '&'),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}