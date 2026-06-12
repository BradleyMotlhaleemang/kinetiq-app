'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import api, { ApiError } from '@/lib/api/client';
import AdminShell from '@/components/admin/AdminShell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, hydrated, role, setRole } = useAuthStore();
  const [roleLoaded, setRoleLoaded] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }
    if (role) {
      setRoleLoaded(true);
      return;
    }
    api
      .get('/api/v1/users/me')
      .then((res) => {
        setRole(res.data?.role === 'ADMIN' ? 'ADMIN' : 'USER');
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          router.push('/auth/login');
        }
      })
      .finally(() => setRoleLoaded(true));
  }, [hydrated, isAuthenticated, role, router, setRole]);

  useEffect(() => {
    if (roleLoaded && role !== 'ADMIN') {
      router.replace('/more');
    }
  }, [roleLoaded, role, router]);

  if (!roleLoaded || role !== 'ADMIN') {
    return (
      <div style={{ minHeight: '100dvh', backgroundColor: '#111318', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#8e909c', fontFamily: 'Manrope, sans-serif' }}>Loading…</p>
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
