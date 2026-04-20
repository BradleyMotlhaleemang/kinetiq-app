'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api/client';
import { LogOut, ChevronRight, User, Target, Activity } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const res = await api.get('/api/v1/users/me');
      setUser(res.data);
    } catch {
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    logout();
    router.push('/auth/login');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-zinc-400 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-4 pt-12 pb-24">
      <div className="max-w-sm mx-auto space-y-6">

        <AppHeader title="Profile" />

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-zinc-700 flex items-center justify-center">
            <User size={24} className="text-zinc-300" />
          </div>
          <div>
            <p className="text-white font-semibold text-lg">
              {user?.displayName}
            </p>
            <p className="text-zinc-400 text-sm">{user?.email}</p>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800">
            <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider">
              Training Profile
            </p>
          </div>

          <div className="divide-y divide-zinc-800">
            <div className="px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target size={16} className="text-zinc-400" />
                <p className="text-white text-sm">Goal</p>
              </div>
              <p className="text-zinc-300 text-sm">
                {user?.goalModeLabel ?? user?.goalMode ?? 'Not set'}
              </p>
            </div>

            <div className="px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity size={16} className="text-zinc-400" />
                <p className="text-white text-sm">Experience</p>
              </div>
              <p className="text-zinc-300 text-sm">
                {user?.experienceLevelLabel ?? user?.experienceLevel ?? 'Not set'}
              </p>
            </div>

            <div className="px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity size={16} className="text-zinc-400" />
                <p className="text-white text-sm">Bodyweight</p>
              </div>
              <p className="text-zinc-300 text-sm">
                {user?.bodyweightKg ? `${user.bodyweightKg} kg` : 'Not set'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800">
            <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider">
              Account
            </p>
          </div>

          <div className="divide-y divide-zinc-800">
            <button
              onClick={() => router.push('/onboarding')}
              className="w-full px-4 py-4 flex items-center justify-between hover:bg-zinc-800 transition"
            >
              <p className="text-white text-sm">Edit Profile</p>
              <ChevronRight size={16} className="text-zinc-400" />
            </button>


          <button
            onClick={() => router.push('/weekly-feedback')}
            className="w-full px-4 py-4 flex items-center justify-between hover:bg-zinc-800 transition"
            style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer', width: '100%' }}
            >
             <p style={{ fontFamily: 'Manrope', fontSize: '0.875rem', color: '#e2e2e8' }}>
           Weekly Check-in
           </p>
          <ChevronRight size={16} color="#444650" />
          </button>  

            <button
              onClick={handleLogout}
              className="w-full px-4 py-4 flex items-center gap-3 hover:bg-zinc-800 transition"
            >
              <LogOut size={16} className="text-red-400" />
              <p className="text-red-400 text-sm">Sign Out</p>
            </button>
          </div>
        </div>

        {!user?.onboardingCompletedAt && (
          <div
            className="bg-amber-950 border border-amber-800 rounded-xl p-4 cursor-pointer"
            onClick={() => router.push('/onboarding')}
          >
            <p className="text-amber-200 text-sm font-medium">
              Complete your profile
            </p>
            <p className="text-amber-300 text-xs mt-0.5">
              Set your goal and experience level to get accurate prescriptions
            </p>
          </div>
        )}
      </div>
    </div>
  );
}