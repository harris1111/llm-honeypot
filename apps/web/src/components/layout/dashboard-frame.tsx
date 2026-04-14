import { Outlet, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

import { useAuthStore } from '../../lib/auth-store';
import { PageContainer } from './page-container';
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
    <main className="min-h-screen bg-stone-950 px-4 py-6 text-stone-100 lg:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row">
        <Sidebar />
        <div className="min-w-0 flex-1 space-y-4">
          <Topbar />
          <PageContainer>
            <Outlet />
          </PageContainer>
        </div>
      </div>
    </main>
  );
}