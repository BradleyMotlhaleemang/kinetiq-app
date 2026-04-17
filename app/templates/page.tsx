'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export default function TemplatesPage() {
  const router = useRouter();
  const { isAuthenticated, hydrated } = useAuthStore();

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-zinc-400 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-sm mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-white">Templates</h1>
        <p className="text-zinc-400 text-sm">
          Training templates will be available here soon.
        </p>
      </div>
    </div>
  );
}