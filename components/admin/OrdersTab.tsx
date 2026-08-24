'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Order {
  id: string;
  order_id: string;
  customer_phone?: string;
  customer_email?: string;
  payment_type?: string;
  total_amount?: number;
  status: string;
  created_at: string;
}

export default function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setOrders(data);
        setLoading(false);
      });
  }, []);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  if (loading) {
    return <div style={{ padding: 40, color: '#6b5c54', textAlign: 'center' }}>Loading orders...</div>;
  }

  if (orders.length === 0) {
    return <div style={{ padding: 60, color: '#9a8578', textAlign: 'center' }}>No orders yet.</div>;
  }

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5ddd8', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ background: '#f9f5f2', borderBottom: '1px solid #e5ddd8' }}>
            <th style={thStyle}>Date</th>
            <th style={thStyle}>Order ID</th>
            <th style={thStyle}>Phone</th>
            <th style={thStyle}>Email</th>
            <th style={thStyle}>Payment</th>
            <th style={thStyle}>Amount</th>
            <th style={thStyle}>Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} style={{ borderBottom: '1px solid #f0e9e4' }}>
              <td style={tdStyle}>{formatDate(order.created_at)}</td>
              <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 13 }}>{order.order_id}</td>
              <td style={tdStyle}>{order.customer_phone || '—'}</td>
              <td style={tdStyle}>
                {order.customer_email ? (
                  <a href={`mailto:${order.customer_email}`} style={{ color: '#C8522A', textDecoration: 'none' }}>
                    {order.customer_email}
                  </a>
                ) : '—'}
              </td>
              <td style={tdStyle}>{order.payment_type || '—'}</td>
              <td style={tdStyle}>{order.total_amount != null ? `₹${order.total_amount}` : '—'}</td>
              <td style={tdStyle}>
                <span style={{
                  padding: '3px 10px',
                  borderRadius: 99,
                  fontSize: 12,
                  fontWeight: 600,
                  background: order.status === 'Confirmed' ? '#f0fdf4' : '#fef3ee',
                  color: order.status === 'Confirmed' ? '#16a34a' : '#C8522A',
                }}>
                  {order.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

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
