import { useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from '../../hooks/use-auth';

export function UserDropdown() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (ref.current && !ref.current.contains(event.target as Node)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, handleClickOutside]);

  const initial = user?.email?.charAt(0).toUpperCase() ?? 'U';

  const menuItems = [
    { label: 'Profile', to: '/settings' },
    { label: 'Account settings', to: '/settings' },
    { label: 'Security', to: '/settings' },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-2 rounded-[var(--radius-md)] px-2 py-1.5 text-sm transition hover:bg-[var(--color-bg-surface)]"
        onClick={() => setOpen((prev) => !prev)}
        type="button"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-full)] bg-[var(--color-accent)] text-xs font-bold text-[var(--color-text-inverse)]">
          {initial}
        </span>
        <span className="hidden text-[var(--color-text-secondary)] sm:inline">{user?.email ?? ''}</span>
        <svg className="h-4 w-4 text-[var(--color-text-tertiary)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-1 w-56 rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-bg-raised)] py-1 shadow-[var(--shadow-md)]">
          {/* User info header */}
          <div className="border-b border-[var(--color-border-default)] px-3 py-2">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">{user?.email ?? ''}</p>
            <p className="text-xs text-[var(--color-text-tertiary)]">Operator</p>
          </div>

          {/* Menu items */}
          <div className="py-1">
            {menuItems.map((item) => (
              <button
                className="block w-full px-3 py-1.5 text-left text-sm text-[var(--color-text-secondary)] transition hover:bg-[var(--color-bg-surface)] hover:text-[var(--color-text-primary)]"
                key={item.label}
                onClick={() => {
                  setOpen(false);
                  navigate({ to: item.to });
                }}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Logout */}
          <div className="border-t border-[var(--color-border-default)] py-1">
            <button
              className="block w-full px-3 py-1.5 text-left text-sm text-[var(--color-error)] transition hover:bg-[var(--color-bg-surface)]"
              onClick={async () => {
                setOpen(false);
                try {
                  await logout.mutateAsync();
                } finally {
                  navigate({ to: '/login' });
                }
              }}
              type="button"
            >
              Log out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
