'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Stage = 'checking' | 'ready' | 'invalid' | 'done';

export default function AdminResetPasswordPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>('checking');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // An expired or already-used link comes back with the error in the URL hash.
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    if (hash.get('error')) {
      setStage('invalid');
      return;
    }

    let settled = false;
    const markReady = () => {
      settled = true;
      setStage('ready');
    };

    // supabase-js reads the recovery token from the URL and signs the user in.
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (session && event === 'SIGNED_IN')) markReady();
    });

    (async () => {
      const code = new URLSearchParams(window.location.search).get('code');
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (!exchangeError) markReady();
      }
      const { data } = await supabase.auth.getSession();
      if (data.session) markReady();
    })();

    const timeout = setTimeout(() => {
      if (!settled) setStage('invalid');
    }, 6000);

    return () => {
      listener.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }
    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (updateError) {
      setError(updateError.message || 'Could not update the password. Request a new reset link and try again.');
      return;
    }
    setStage('done');
    setTimeout(() => router.replace('/admin/dashboard'), 1500);
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 700, color: '#1C0F0A', marginBottom: 8 }}>
            300ml TEA
          </div>
          <div style={{ fontSize: 14, color: '#6b5c54' }}>Set a new admin password</div>
        </div>

        {stage === 'checking' && (
          <p style={{ textAlign: 'center', color: '#6b5c54', fontSize: 14 }}>Checking your reset link…</p>
        )}

        {stage === 'invalid' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#dc2626', fontSize: 14, marginBottom: 20 }}>
              This reset link is invalid or has expired. Links work once and only for a short time.
            </p>
            <Link href="/admin/login" style={{ color: '#C8522A', fontWeight: 600, fontSize: 14 }}>
              Back to login to request a new link
            </Link>
          </div>
        )}

        {stage === 'done' && (
          <p style={{ textAlign: 'center', color: '#15803d', fontSize: 14 }}>
            Password updated. Taking you to the dashboard…
          </p>
        )}

        {stage === 'ready' && (
          <form onSubmit={handleSubmit}>
            <label style={labelStyle}>
              New password
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password" required minLength={8} style={inputStyle} />
            </label>
            <label style={labelStyle}>
              Confirm new password
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password" required minLength={8} style={inputStyle} />
            </label>

            {error && <div style={errorStyle}>{error}</div>}

            <button type="submit" disabled={saving} style={{ ...buttonStyle, background: saving ? '#b35a2a' : '#C8522A' }}>
              {saving ? 'Saving...' : 'Save new password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: '#1C0F0A',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
};

const cardStyle: React.CSSProperties = {
  background: '#FAF6F1',
  borderRadius: 16,
  padding: '48px 40px',
  width: '100%',
  maxWidth: 420,
  boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#1C0F0A',
  marginBottom: 20,
};

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  marginTop: 6,
  padding: '12px 14px',
  borderRadius: 8,
  border: '1.5px solid #d4c8c0',
  fontSize: 14,
  background: '#fff',
  outline: 'none',
  boxSizing: 'border-box',
};

const errorStyle: React.CSSProperties = {
  background: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: 8,
  padding: '10px 14px',
  fontSize: 13,
  color: '#dc2626',
  marginBottom: 20,
};

const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
};
