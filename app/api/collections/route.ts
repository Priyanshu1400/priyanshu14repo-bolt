import { NextRequest } from 'next/server';
import { supabaseCatalog, parsePagination, verifyCatalogApiKey } from '@/lib/catalog';

export async function GET(req: NextRequest) {
  const denied = verifyCatalogApiKey(req);
  if (denied) return denied;

  const { limit, from, to } = parsePagination(req);

  const { data, error, count } = await supabaseCatalog()
    .from('collections')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: true })
    .order('numeric_id', { ascending: true })
    .range(from, to);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const collections = (data ?? []).map((c: Record<string, unknown>) => ({
    id: Number(c.numeric_id),
    updated_at: c.updated_at ?? c.created_at ?? '',
    body_html: c.description ?? '',
    handle: c.handle ?? '',
    image: { src: String(c.image ?? '') },
    title: c.title ?? '',
    created_at: c.created_at ?? '',
  }));

  const payload = { data: { total: count ?? 0, collections } };

  return new Response(
    JSON.stringify(payload).replace(/\\u003C/g, '<').replace(/\\u003E/g, '>').replace(/\\u0026/g, '&'),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}