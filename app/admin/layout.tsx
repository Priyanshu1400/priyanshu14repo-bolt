'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Pages reachable without a session (the reset page signs in from the email link itself).
const PUBLIC_PATHS = ['/admin/login', '/admin/reset-password'];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const isPublic = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && pathname === '/admin/login') {
        router.replace('/admin/dashboard');
      } else if (!session && !isPublic) {
        router.replace('/admin/login');
      }
      setChecking(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session && !isPublic) {
        router.replace('/admin/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router, isPublic]);

  if (checking && !isPublic) {
    return (
      <div style={{ minHeight: '100vh', background: '#1C0F0A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#FAF6F1', fontSize: 14 }}>Verifying session...</div>
      </div>
    );
  }

  return <>{children}</>;
}
