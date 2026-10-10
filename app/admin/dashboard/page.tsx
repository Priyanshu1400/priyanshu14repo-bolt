'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, ShoppingBag, Edit3, LogOut, Menu, X, Bell } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import MessagesTab from '@/components/admin/MessagesTab';
import OrdersTab from '@/components/admin/OrdersTab';
import ContentEditorTab from '@/components/admin/ContentEditorTab';

type Tab = 'messages' | 'orders' | 'content';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('messages');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/admin/login');
  };

  const navItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'messages', label: 'Messages', icon: <MessageSquare size={18} /> },
    { id: 'orders', label: 'Orders', icon: <ShoppingBag size={18} /> },
    { id: 'content', label: 'Content Editor', icon: <Edit3 size={18} /> },
  ];

  const tabTitles: Record<Tab, string> = {
    messages: 'Messages',
    orders: 'Orders',
    content: 'Content Editor',
  };

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: '#FAF6F1' }}>
          300ml TEA
        </div>
        <div style={{ fontSize: 11, color: '#9a8578', marginTop: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Admin Panel
        </div>
      </div>

      <nav style={{ padding: '16px 0', flex: 1 }}>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => { setTab(item.id); setSidebarOpen(false); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              width: '100%',
              padding: '12px 24px',
              background: tab === item.id ? 'rgba(200,82,42,0.2)' : 'transparent',
              border: 'none',
              borderLeft: tab === item.id ? '3px solid #C8522A' : '3px solid transparent',
              color: tab === item.id ? '#FAF6F1' : '#c4b4aa',
              fontSize: 14,
              fontWeight: tab === item.id ? 600 : 400,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s',
            }}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.id === 'messages' && unreadCount > 0 && (
              <span style={{
                marginLeft: 'auto',
                background: '#C8522A',
                color: '#fff',
                borderRadius: 99,
                fontSize: 11,
                fontWeight: 700,
                padding: '2px 8px',
                minWidth: 20,
                textAlign: 'center',
              }}>
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            padding: '10px 0',
            background: 'transparent',
            border: 'none',
            color: '#9a8578',
            fontSize: 14,
            cursor: 'pointer',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#FAF6F1')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#9a8578')}
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'var(--font-body, Inter, sans-serif)' }}>
      {/* Desktop Sidebar */}
      <aside style={{
        width: 240,
        background: '#1C0F0A',
        flexShrink: 0,
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        overflowY: 'auto',
        zIndex: 50,
        display: 'none',
      }}
        className="admin-sidebar"
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 60 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside style={{
        width: 260,
        background: '#1C0F0A',
        flexShrink: 0,
        position: 'fixed',
        top: 0,
        left: sidebarOpen ? 0 : '-260px',
        height: '100vh',
        overflowY: 'auto',
        zIndex: 70,
        transition: 'left 0.25s ease',
      }}
        className="admin-sidebar-mobile"
      >
        <div style={{ position: 'absolute', top: 16, right: 16 }}>
          <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', color: '#FAF6F1', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, background: '#FAF6F1', minHeight: '100vh' }} className="admin-main">
        {/* Top bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '16px 28px',
          background: '#fff',
          borderBottom: '1px solid #e5ddd8',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="admin-hamburger"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1C0F0A', display: 'none', padding: 4 }}
          >
            <Menu size={22} />
          </button>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1C0F0A', margin: 0 }}>
            {tabTitles[tab]}
          </h1>
          {tab === 'messages' && unreadCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
              <Bell size={16} color="#C8522A" />
              <span style={{ fontSize: 13, color: '#C8522A', fontWeight: 600 }}>{unreadCount} unread</span>
            </div>
          )}
        </div>

        <div style={{ padding: '32px 28px' }}>
          {tab === 'messages' && <MessagesTab onUnreadCountChange={setUnreadCount} />}
          {tab === 'orders' && <OrdersTab />}
          {tab === 'content' && <ContentEditorTab />}
        </div>
      </main>

      <style>{`
        @media (min-width: 769px) {
          .admin-sidebar { display: block !important; }
          .admin-main { margin-left: 240px; }
          .admin-hamburger { display: none !important; }
        }
        @media (max-width: 768px) {
          .admin-hamburger { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
