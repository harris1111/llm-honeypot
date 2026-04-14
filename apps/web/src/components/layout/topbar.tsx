import { useNavigate } from '@tanstack/react-router';

import { useAuth } from '../../hooks/use-auth';

export function Topbar() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  return (
    <header className="flex h-14 items-center justify-between border-b border-[var(--color-border-default)] bg-[var(--color-bg-base)] px-5">
      <span className="text-sm text-[var(--color-text-tertiary)]">{user?.email ?? ''}</span>
      <button
        className="rounded-[var(--radius-md)] px-3 py-1.5 text-sm text-[var(--color-text-tertiary)] transition hover:text-[var(--color-error)]"
        onClick={async () => {
          await logout.mutateAsync();
          navigate({ to: '/login' });
        }}
        type="button"
      >
        Sign out
      </button>
    </header>
  );
}
