'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async () => {
    setError('');
    setInfo('');
    if (!email.trim()) {
      setError('Enter your admin email above, then click "Forgot password?" again.');
      return;
    }
    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });
    setLoading(false);
    if (resetError) {
      setError('Could not send the reset email. Please try again in a few minutes.');
      return;
    }
    // Same message whether or not the account exists, so emails can't be probed.
    setInfo('If that email has an account, a reset link is on its way. Check your inbox and spam folder.');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setLoading(false);
      setError('Invalid email or password. Please try again.');
      return;
    }

    // Customer accounts can sign in too, so check the admin list. If is_admin()
    // doesn't exist yet (migration not run), fall back to the old behaviour.
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
    setLoading(false);
    if (!adminError && isAdmin === false) {
      await supabase.auth.signOut();
      setError('This account does not have admin access.');
      return;
    }
    router.replace('/admin/dashboard');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#1C0F0A',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        background: '#FAF6F1',
        borderRadius: 16,
        padding: '48px 40px',
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 700, color: '#1C0F0A', marginBottom: 8 }}>
            300ml TEA
          </div>
          <div style={{ fontSize: 14, color: '#6b5c54' }}>Admin Panel</div>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1C0F0A', marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 8,
                border: '1.5px solid #d4c8c0',
                fontSize: 14,
                background: '#fff',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1C0F0A', marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 8,
                border: '1.5px solid #d4c8c0',
                fontSize: 14,
                background: '#fff',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 13,
              color: '#dc2626',
              marginBottom: 20,
            }}>
              {error}
            </div>
          )}

          {info && (
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 13,
              color: '#15803d',
              marginBottom: 20,
            }}>
              {info}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#b35a2a' : '#C8522A',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {loading ? 'Please wait...' : 'Login'}
          </button>

          <button
            type="button"
            onClick={handleForgotPassword}
            disabled={loading}
            style={{
              display: 'block',
              margin: '16px auto 0',
              background: 'none',
              border: 'none',
              color: '#C8522A',
              fontSize: 13,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            Forgot password?
          </button>
        </form>
      </div>
    </div>
  );
}
