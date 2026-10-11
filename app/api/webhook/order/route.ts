import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHmac, timingSafeEqual } from 'crypto';

const ALLOWED_STATUSES = new Set([
  'Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered',
  'Cancelled', 'Returned', 'Failed',
]);

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  try {
    const webhookSecret = process.env.SHIPROCKET_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('[webhook/order] SHIPROCKET_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    const rawBody = await req.text();
    const signature = req.headers.get('x-shiprocket-signature') || req.headers.get('x-webhook-signature') || '';

    const expected = createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    const signaturesMatch =
      sigBuf.length === expBuf.length && timingSafeEqual(sigBuf, expBuf);

    // Shiprocket Checkout doesn't sign its webhooks; instead it sends a custom
    // header (Settings → Webhooks → Headers) carrying the shared secret as-is.
    // The dashboard is configured with it in x-shiprocket-signature.
    const secretBuf = Buffer.from(webhookSecret);
    const tokenMatches = [req.headers.get('x-webhook-token'), signature].some((value) => {
      const token = Buffer.from(value || '');
      return token.length === secretBuf.length && timingSafeEqual(token, secretBuf);
    });

    if (!signaturesMatch && !tokenMatches) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = JSON.parse(rawBody);

    const { order_id, status, phone, email, payment_type, total_amount_payable, cart_data } = body;

    if (!order_id || typeof order_id !== 'string' || order_id.length > 100) {
      return NextResponse.json({ error: 'Invalid order_id' }, { status: 400 });
    }

    const safeStatus = typeof status === 'string' && ALLOWED_STATUSES.has(status)
      ? status
      : 'Confirmed';

    const { error } = await supabase.from('orders').upsert(
      {
        order_id,
        customer_phone: typeof phone === 'string' ? phone.slice(0, 20) : null,
        customer_email: typeof email === 'string' ? email.slice(0, 254) : null,
        payment_type: typeof payment_type === 'string' ? payment_type.slice(0, 50) : null,
        total_amount: typeof total_amount_payable === 'number' ? total_amount_payable : null,
        status: safeStatus,
        cart_data: cart_data ?? null,
      },
      { onConflict: 'order_id' }
    );

    if (error) {
      console.error('[webhook/order] Supabase error:', error.message);
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }

    // Keep the raw payload so partner codes can be matched to orders. A failure
    // here must never fail the webhook: the order itself is already saved.
    const { error: eventError } = await supabase
      .from('order_events')
      .insert({ order_id, payload: body });
    if (eventError) {
      console.error('[webhook/order] order_events insert failed:', eventError.message);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error('[webhook/order]', err);
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
