'use client';

import { useState, useEffect, useCallback } from 'react';
import { Copy, Gift, Minus, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PartnerCode {
  id: string;
  code: string;
  name: string;
  kind: 'influencer' | 'family';
  discount_percent: number;
  gift_goal: number;
  manual_orders: number;
  gift_sent: boolean;
  tracked_orders: number;
  total_orders: number;
  created_at: string;
}

async function api(method: string, body?: unknown, query = '') {
  const { data } = await supabase.auth.getSession();
  const res = await fetch(`/api/admin/partner-codes${query}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.session?.access_token || ''}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Something went wrong');
  return json;
}

function suggestCode(name: string) {
  const word = name.trim().split(/\s+/)[0] || '';
  const base = word.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
  return base ? `${base}10` : '';
}

export default function PartnerCodesTab() {
  const [codes, setCodes] = useState<PartnerCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [kind, setKind] = useState<'influencer' | 'family'>('influencer');
  const [saving, setSaving] = useState(false);
  const [justCreated, setJustCreated] = useState('');
  const [copied, setCopied] = useState('');

  const load = useCallback(async () => {
    try {
      const json = await api('GET');
      setCodes(json.codes || []);
      setError('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const json = await api('POST', { name, kind, code: customCode || undefined });
      setJustCreated(json.code.code);
      setName('');
      setCustomCode('');
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const update = async (id: string, patch: Record<string, unknown>) => {
    try {
      await api('PATCH', { id, ...patch });
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const remove = async (row: PartnerCode) => {
    if (!window.confirm(`Delete ${row.code}? Also switch it off in Shiprocket so it stops giving a discount.`)) return;
    try {
      await api('DELETE', undefined, `?id=${encodeURIComponent(row.id)}`);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const copy = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(''), 1500);
  };

  const preview = customCode ? customCode.toUpperCase().replace(/[^A-Z0-9]/g, '') : suggestCode(name);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <form onSubmit={create} style={cardStyle}>
        <div style={{ fontWeight: 700, fontSize: 16, color: '#3d2b1f', marginBottom: 4 }}>New partner code</div>
        <div style={{ fontSize: 13, color: '#6b5c54', marginBottom: 16 }}>
          Friends who use the code get 10% off. The partner earns a surprise gift after 5 orders.
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
          <label style={labelStyle}>
            Name
            <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Vijay" required />
          </label>
          <label style={labelStyle}>
            Code (optional)
            <input style={inputStyle} value={customCode} onChange={(e) => setCustomCode(e.target.value)} placeholder={suggestCode(name) || 'VIJAY10'} />
          </label>
          <label style={labelStyle}>
            Type
            <select style={inputStyle} value={kind} onChange={(e) => setKind(e.target.value as 'influencer' | 'family')}>
              <option value="influencer">Influencer</option>
              <option value="family">Family &amp; friends</option>
            </select>
          </label>
          <button type="submit" disabled={saving || !name.trim()} style={primaryButton}>
            {saving ? 'Creating…' : preview ? `Create ${preview}` : 'Create code'}
          </button>
        </div>
        {error && <div style={{ marginTop: 12, color: '#C8522A', fontSize: 13 }}>{error}</div>}
      </form>

      {justCreated && (
        <div style={{ ...cardStyle, background: '#fef3ee', borderColor: '#f3c9b5' }}>
          <div style={{ fontWeight: 700, color: '#3d2b1f', marginBottom: 6 }}>
            One more step for {justCreated}
          </div>
          <div style={{ fontSize: 14, color: '#3d2b1f', lineHeight: 1.6 }}>
            In <b>Shiprocket Checkout → Discounts</b>, create a coupon with code <b>{justCreated}</b> for <b>10% off</b>.
            Until you do, customers will see the code as invalid at checkout.
          </div>
          <button type="button" onClick={() => setJustCreated('')} style={{ ...linkButton, marginTop: 8 }}>Got it</button>
        </div>
      )}

      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, color: '#6b5c54', textAlign: 'center' }}>Loading codes…</div>
        ) : codes.length === 0 ? (
          <div style={{ padding: 60, color: '#9a8578', textAlign: 'center' }}>No partner codes yet.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f9f5f2', borderBottom: '1px solid #e5ddd8' }}>
                  <th style={thStyle}>Code</th>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Orders</th>
                  <th style={thStyle}>Gift</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {codes.map((row) => {
                  const reached = row.total_orders >= row.gift_goal;
                  const pct = Math.min(100, Math.round((row.total_orders / row.gift_goal) * 100));
                  return (
                    <tr key={row.id} style={{ borderBottom: '1px solid #f0e9e4' }}>
                      <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 700 }}>
                        {row.code}
                        <button type="button" onClick={() => copy(row.code)} style={iconButton} title="Copy code" aria-label={`Copy ${row.code}`}>
                          <Copy size={14} />
                        </button>
                        {copied === row.code && <span style={{ fontSize: 11, color: '#16a34a', fontFamily: 'inherit' }}>Copied</span>}
                      </td>
                      <td style={tdStyle}>{row.name}</td>
                      <td style={tdStyle}>{row.kind === 'family' ? 'Family & friends' : 'Influencer'}</td>
                      <td style={{ ...tdStyle, minWidth: 190 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <b>{row.total_orders} / {row.gift_goal}</b>
                          <button type="button" style={iconButton} title="Remove a manually added order" aria-label="Remove a manually added order"
                            disabled={row.manual_orders <= 0}
                            onClick={() => update(row.id, { manual_orders: row.manual_orders - 1 })}>
                            <Minus size={14} />
                          </button>
                          <button type="button" style={iconButton} title="Add an order manually (e.g. seen in Shiprocket)" aria-label="Add an order manually"
                            onClick={() => update(row.id, { manual_orders: row.manual_orders + 1 })}>
                            <Plus size={14} />
                          </button>
                        </div>
                        <div style={{ height: 6, background: '#f0e9e4', borderRadius: 99, marginTop: 6 }}>
                          <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: reached ? '#16a34a' : '#C8522A' }} />
                        </div>
                        <div style={{ fontSize: 11, color: '#9a8578', marginTop: 4 }}>
                          {row.tracked_orders} automatic · {row.manual_orders} added by hand
                        </div>
                      </td>
                      <td style={tdStyle}>
                        {row.gift_sent ? (
                          <button type="button" style={{ ...pill, background: '#f0fdf4', color: '#16a34a' }} onClick={() => update(row.id, { gift_sent: false })}>
                            <Gift size={13} /> Sent
                          </button>
                        ) : reached ? (
                          <button type="button" style={{ ...pill, background: '#C8522A', color: '#fff' }} onClick={() => update(row.id, { gift_sent: true })}>
                            <Gift size={13} /> Earned · mark sent
                          </button>
                        ) : (
                          <span style={{ ...pill, background: '#f9f5f2', color: '#9a8578' }}>{row.gift_goal - row.total_orders} to go</span>
                        )}
                      </td>
                      <td style={tdStyle}>
                        <button type="button" style={iconButton} title="Delete code" aria-label={`Delete ${row.code}`} onClick={() => remove(row)}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  border: '1px solid #e5ddd8',
  padding: 20,
};

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  fontSize: 12,
  fontWeight: 600,
  color: '#6b5c54',
  flex: '1 1 160px',
};

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  border: '1px solid #e5ddd8',
  borderRadius: 8,
  fontSize: 14,
  color: '#3d2b1f',
  background: '#fff',
};

const primaryButton: React.CSSProperties = {
  padding: '11px 18px',
  border: 'none',
  borderRadius: 8,
  background: '#C8522A',
  color: '#fff',
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
};

const linkButton: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: 0,
  color: '#C8522A',
  fontWeight: 600,
  cursor: 'pointer',
};

const iconButton: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginLeft: 6,
  width: 26,
  height: 26,
  border: '1px solid #e5ddd8',
  borderRadius: 6,
  background: '#fff',
  color: '#6b5c54',
  cursor: 'pointer',
};

const pill: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 10px',
  borderRadius: 99,
  border: 'none',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
};

const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  fontWeight: 600,
  fontSize: 12,
  color: '#6b5c54',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const tdStyle: React.CSSProperties = {
  padding: '14px 16px',
  verticalAlign: 'middle',
  color: '#3d2b1f',
};
