import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ORDER_ID_RE = /^[a-zA-Z0-9_-]{1,100}$/;

export async function GET(
  _req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const orderId = decodeURIComponent(params.orderId || '').trim();
    if (!orderId || !ORDER_ID_RE.test(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      return NextResponse.json({ error: 'Order lookup is not configured' }, { status: 500 });
    }

    const supabase = createClient(url, key);
    const { data, error } = await supabase
      .from('orders')
      .select('order_id, customer_phone, customer_email, payment_type, total_amount, status, cart_data, created_at')
      .eq('order_id', orderId)
      .maybeSingle();

    if (error) {
      console.error('[order]', error.message);
      return NextResponse.json({ error: 'Failed to load order' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('[order]', err);
    return NextResponse.json({ error: 'Failed to load order' }, { status: 500 });
  }
}
