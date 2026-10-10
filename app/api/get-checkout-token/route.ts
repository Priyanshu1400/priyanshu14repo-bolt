import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { supabaseCatalog } from '@/lib/catalog';

function toUnitPrice(value: unknown): number | null {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100) / 100;
}

function toImageUrl(image: unknown): string | undefined {
  const src = String(image ?? '').trim();
  if (!src) return undefined;
  if (/^https?:\/\//i.test(src)) return src;
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://300mltea.in';
  return `${origin.replace(/\/$/, '')}${src.startsWith('/') ? src : `/${src}`}`;
}

export async function POST(req: NextRequest) {
  try {
    const { quantity: rawQuantity } = await req.json();
    const quantity = Math.max(1, Math.min(100, parseInt(rawQuantity) || 1));

    const { data: product, error } = await supabaseCatalog()
      .from('products')
      .select('numeric_id, name, price, image')
      .eq('is_active', true)
      .order('numeric_id', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[get-checkout-token] product lookup failed', error);
      return NextResponse.json({ error: 'Unable to load current product price' }, { status: 500 });
    }

    const unitPrice = toUnitPrice(product?.price);
    if (!unitPrice) {
      return NextResponse.json({ error: 'Current product price is unavailable' }, { status: 500 });
    }

    const variantId = String(product?.numeric_id ?? '1');
    const imageUrl = toImageUrl(product?.image);
    const item: Record<string, unknown> = {
      variant_id: variantId,
      quantity,
      price: unitPrice,
      catalog_data: {
        name: product?.name || '300ml Tea',
        price: unitPrice,
        ...(imageUrl ? { image_url: imageUrl } : {}),
      },
    };

    const body = JSON.stringify({
      cart_data: {
        items: [item],
      },
      redirect_url: 'https://300mltea.com/order-success',
      timestamp: new Date().toISOString(),
    });

    const hmacSignature = createHmac('sha256', process.env.SHIPROCKET_SECRET_KEY!)
      .update(body)
      .digest('base64');

    const response = await fetch(
      'https://checkout-api.shiprocket.com/api/v1/access-token/checkout',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': process.env.SHIPROCKET_API_KEY!,
          'X-Api-HMAC-SHA256': hmacSignature,
        },
        body,
      }
    );

    const data = await response.json();
    console.log('[get-checkout-token] Shiprocket response:', JSON.stringify(data));

    if (!response.ok || !data?.result?.token) {
      const msg = data.message || data.error || `Shiprocket error ${response.status}`;
      return NextResponse.json({ error: msg }, { status: response.status || 500 });
    }

    return NextResponse.json({ token: data.result.token });
  } catch (err) {
    console.error('[get-checkout-token]', err);
    return NextResponse.json({ error: 'Failed to generate checkout token' }, { status: 500 });
  }
}
