'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Trash2, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Message {
  id: string;
  name: string;
  email: string;
  message: string;
  status: string;
  created_at: string;
}

interface Props {
  onUnreadCountChange?: (count: number) => void;
}

export default function MessagesTab({ onUnreadCountChange }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) {
      setMessages(data);
      const unread = data.filter((m) => m.status === 'New').length;
      onUnreadCountChange?.(unread);
    }
    setLoading(false);
  }, [onUnreadCountChange]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const toggleStatus = async (msg: Message) => {
    const newStatus = msg.status === 'New' ? 'Read' : 'New';
    await supabase.from('contact_messages').update({ status: newStatus }).eq('id', msg.id);
    setMessages((prev) =>
      prev.map((m) => m.id === msg.id ? { ...m, status: newStatus } : m)
    );
    const updated = messages.map((m) => m.id === msg.id ? { ...m, status: newStatus } : m);
    onUnreadCountChange?.(updated.filter((m) => m.status === 'New').length);
  };

  const deleteMessage = async (id: string) => {
    if (!confirm('Delete this message permanently?')) return;
    setDeleting(id);
    await supabase.from('contact_messages').delete().eq('id', id);
    setMessages((prev) => prev.filter((m) => m.id !== id));
    setDeleting(null);
  };

  const filtered = messages.filter((m) => {
    const q = search.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
  });

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  if (loading) {
    return (
      <div style={{ padding: 40, color: '#6b5c54', textAlign: 'center' }}>Loading messages...</div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9a8578' }} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 38px',
              borderRadius: 8,
              border: '1.5px solid #e5ddd8',
              fontSize: 14,
              background: '#fff',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <button
          onClick={fetchMessages}
          style={{ padding: '10px 18px', background: '#C8522A', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          Refresh
        </button>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9a8578' }}>
          {search ? 'No messages match your search.' : 'No messages yet.'}
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5ddd8', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f9f5f2', borderBottom: '1px solid #e5ddd8' }}>
                <th style={thStyle}>Date / Time</th>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Message</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((msg) => (
                <>
                  <tr
                    key={msg.id}
                    style={{ borderBottom: '1px solid #f0e9e4', background: msg.status === 'New' ? '#fffaf7' : '#fff', cursor: 'pointer' }}
                    onClick={() => setExpanded(expanded === msg.id ? null : msg.id)}
                  >
                    <td style={tdStyle}>{formatDate(msg.created_at)}</td>
                    <td style={{ ...tdStyle, fontWeight: msg.status === 'New' ? 600 : 400 }}>{msg.name}</td>
                    <td style={tdStyle}>
                      <a href={`mailto:${msg.email}`} style={{ color: '#C8522A', textDecoration: 'none' }} onClick={(e) => e.stopPropagation()}>
                        {msg.email}
                      </a>
                    </td>
                    <td style={{ ...tdStyle, maxWidth: 240, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                          {msg.message}
                        </span>
                        {expanded === msg.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: 99,
                        fontSize: 12,
                        fontWeight: 600,
                        background: msg.status === 'New' ? '#fef3ee' : '#f0fdf4',
                        color: msg.status === 'New' ? '#C8522A' : '#16a34a',
                      }}>
                        {msg.status}
                      </span>
                    </td>
                    <td style={{ ...tdStyle }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button
                          onClick={() => toggleStatus(msg)}
                          title={msg.status === 'New' ? 'Mark as Read' : 'Mark as New'}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b5c54', padding: 4 }}
                        >
                          <CheckCircle size={16} color={msg.status === 'Read' ? '#16a34a' : '#9a8578'} />
                        </button>
                        <button
                          onClick={() => deleteMessage(msg.id)}
                          disabled={deleting === msg.id}
                          title="Delete"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                        >
                          <Trash2 size={16} color="#ef4444" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expanded === msg.id && (
                    <tr key={`${msg.id}-expanded`} style={{ background: '#fdf8f5', borderBottom: '1px solid #f0e9e4' }}>
                      <td colSpan={6} style={{ padding: '16px 20px' }}>
                        <div style={{ fontSize: 14, color: '#3d2b1f', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                          {msg.message}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
