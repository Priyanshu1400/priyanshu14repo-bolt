import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export function supabaseService(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/**
 * Any visitor can create an account on /login, so "signed in" is not enough to
 * be an admin. Only emails listed in ADMIN_EMAILS (comma-separated) get through.
 * Returns an error response to send back, or null when the caller is an admin.
 */
export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  const allowed = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length === 0) {
    return NextResponse.json({ error: 'ADMIN_EMAILS is not configured' }, { status: 500 });
  }

  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const { data, error } = await supabaseService().auth.getUser(token);
  const email = data?.user?.email?.toLowerCase();
  if (error || !email || !allowed.includes(email)) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 403 });
  }
  return null;
}
