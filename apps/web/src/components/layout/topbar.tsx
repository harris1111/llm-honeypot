import { useNavigate } from '@tanstack/react-router';

import { useAuth } from '../../hooks/use-auth';

export function Topbar() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  return (
    <header className="flex flex-col gap-4 rounded-[2rem] border border-stone-800 bg-stone-900/85 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Phase 2</p>
        <h2 className="mt-2 text-2xl font-semibold text-stone-50">Dashboard Foundation</h2>
      </div>
      <div className="flex items-center gap-3">
        <div className="rounded-2xl border border-stone-800 bg-stone-950/70 px-4 py-2 text-right">
          <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Operator</p>
          <p className="text-sm font-medium text-stone-100">{user?.email ?? 'Not loaded'}</p>
        </div>
        <button
          className="rounded-2xl border border-stone-700 px-4 py-2 text-sm text-stone-200 transition hover:border-stone-500 hover:bg-stone-800"
          onClick={async () => {
            await logout.mutateAsync();
            navigate({ to: '/login' });
          }}
          type="button"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}