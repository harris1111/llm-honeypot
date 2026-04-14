import { Outlet, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

import { useAuthStore } from '../../lib/auth-store';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

export function DashboardFrame() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const navigate = useNavigate();

  useEffect(() => {
    if (!accessToken) {
      void navigate({ replace: true, to: '/login' });
    }
  }, [accessToken, navigate]);

  if (!accessToken) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-primary)]">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <Topbar />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
