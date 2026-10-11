import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, supabaseService } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

const DISCOUNT_PERCENT = 10;
const GIFT_GOAL = 5;

/** "Vijay Kumar" -> "VIJAY10". Letters and digits only, from the first word. */
function suggestCode(name: string, discount: number): string {
  const word = name.trim().split(/\s+/)[0] || '';
  const base = word.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
  return base ? `${base}${discount}` : '';
}

function cleanCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);
}

/** Counts distinct orders whose webhook payload mentions each code. */
async function countOrdersByCode(codes: string[]): Promise<Record<string, number>> {
  const counts: Record<string, number> = Object.fromEntries(codes.map((c) => [c, 0]));
  if (codes.length === 0) return counts;

  const { data, error } = await supabaseService()
    .from('order_events')
    .select('order_id, payload')
    .order('received_at', { ascending: false })
    .limit(10000);
  if (error || !data) return counts;

  const seen: Record<string, Set<string>> = Object.fromEntries(codes.map((c) => [c, new Set<string>()]));
  for (const event of data) {
    const text = JSON.stringify(event.payload ?? '').toUpperCase();
    for (const code of codes) {
      // Quoted match so VIJAY10 doesn't also count VIJAY100.
      if (text.includes(`"${code}"`)) seen[code].add(event.order_id);
    }
  }
  for (const code of codes) counts[code] = seen[code].size;
  return counts;
}

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { data, error } = await supabaseService()
    .from('partner_codes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[admin/partner-codes] list failed', error);
    return NextResponse.json({ error: 'Could not load partner codes' }, { status: 500 });
  }

  const counts = await countOrdersByCode((data || []).map((row) => row.code));
  const codes = (data || []).map((row) => ({
    ...row,
    tracked_orders: counts[row.code] || 0,
    total_orders: (counts[row.code] || 0) + (row.manual_orders || 0),
  }));
  return NextResponse.json({ codes });
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));
  const name = String(body.name || '').trim().slice(0, 80);
  const kind = body.kind === 'family' ? 'family' : 'influencer';
  if (!name) return NextResponse.json({ error: 'Enter a name' }, { status: 400 });

  const code = body.code ? cleanCode(String(body.code)) : suggestCode(name, DISCOUNT_PERCENT);
  if (code.length < 3) {
    return NextResponse.json({ error: 'Code must have at least 3 letters or numbers' }, { status: 400 });
  }

  const { data, error } = await supabaseService()
    .from('partner_codes')
    .insert({ code, name, kind, discount_percent: DISCOUNT_PERCENT, gift_goal: GIFT_GOAL })
    .select()
    .single();
  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: `${code} is already taken. Type a different code, e.g. ${code.replace(/\d+$/, '')}K${DISCOUNT_PERCENT}.` },
        { status: 409 }
      );
    }
    console.error('[admin/partner-codes] create failed', error);
    return NextResponse.json({ error: 'Could not create the code' }, { status: 500 });
  }
  return NextResponse.json({ code: data });
}

export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));
  const id = String(body.id || '');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (typeof body.gift_sent === 'boolean') update.gift_sent = body.gift_sent;
  if (Number.isInteger(body.manual_orders)) update.manual_orders = Math.max(0, Math.min(10000, body.manual_orders));
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const { error } = await supabaseService().from('partner_codes').update(update).eq('id', id);
  if (error) {
    console.error('[admin/partner-codes] update failed', error);
    return NextResponse.json({ error: 'Could not update the code' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const id = req.nextUrl.searchParams.get('id') || '';
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { error } = await supabaseService().from('partner_codes').delete().eq('id', id);
  if (error) {
    console.error('[admin/partner-codes] delete failed', error);
    return NextResponse.json({ error: 'Could not delete the code' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
