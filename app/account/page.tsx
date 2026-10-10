'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User, LogOut, Package, MapPin, Edit3 } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'addresses'>('orders');
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUser({
        id: session.user.id,
        email: session.user.email || '',
        full_name: session.user.user_metadata?.full_name || '',
        phone: session.user.user_metadata?.phone || '',
      });
      setLoading(false);
    };
    checkUser();
  }, [router]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setOrders(data || []));
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="account-page">
        <div className="section-inner">
          <div style={{ textAlign: 'center', padding: 120 }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="account-page">
      <div className="section-inner">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <h1 className="account-page__title">My Account</h1>
          <button onClick={handleSignOut} className="btn btn-outline-dark btn-small" style={{ display: 'inline-flex' }}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>

        <div className="account-tabs reveal">
          <button className={`account-tab ${activeTab === 'orders' ? 'account-tab--active' : ''}`} onClick={() => setActiveTab('orders')}>
            <Package size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} /> Orders
          </button>
          <button className={`account-tab ${activeTab === 'profile' ? 'account-tab--active' : ''}`} onClick={() => setActiveTab('profile')}>
            <User size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} /> Profile
          </button>
          <button className={`account-tab ${activeTab === 'addresses' ? 'account-tab--active' : ''}`} onClick={() => setActiveTab('addresses')}>
            <MapPin size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} /> Addresses
          </button>
        </div>

        <div className="account-card reveal">
          {activeTab === 'orders' && (
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, marginBottom: 20 }}>My Orders</h3>
              {orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <p style={{ color: 'var(--text-m)', marginBottom: 16 }}>No orders yet.</p>
                  <Link href="/product" className="btn btn-primary">Start Shopping</Link>
                </div>
              ) : (
                <div className="order-list">
                  {orders.map((order) => (
                    <div className="order-item" key={order.id}>
                      <div>
                        <div className="order-item__id">{order.order_id}</div>
                        <div className="order-item__date">{new Date(order.created_at).toLocaleDateString('en-IN')}</div>
                      </div>
                      <span className={`order-item__status order-item__status--${order.status}`}>{order.status}</span>
                      <div className="order-item__total">₹{order.total}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, marginBottom: 20 }}>Profile Information</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-m)', marginBottom: 4, display: 'block' }}>Email</label>
                  <div style={{ fontSize: 15 }}>{user.email}</div>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-m)', marginBottom: 4, display: 'block' }}>Full Name</label>
                  <div style={{ fontSize: 15 }}>{user.full_name || 'Not set'}</div>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-m)', marginBottom: 4, display: 'block' }}>Phone</label>
                  <div style={{ fontSize: 15 }}>{user.phone || 'Not set'}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'addresses' && (
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, marginBottom: 20 }}>Saved Addresses</h3>
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-m)' }}>
                <p>Manage your delivery addresses here.</p>
                <p style={{ fontSize: 13, marginTop: 8 }}>Addresses are saved during checkout.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
