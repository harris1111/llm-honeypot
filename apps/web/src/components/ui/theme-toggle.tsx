import { useCallback, useEffect, useRef, useState } from 'react';

import { useThemeStore, type Theme } from '../../lib/theme-store';

const themes: Array<{ icon: string; label: string; value: Theme }> = [
  { icon: '☀', label: 'Light', value: 'light' },
  { icon: '◑', label: 'Dark', value: 'dark' },
  { icon: '⌘', label: 'Hacker', value: 'hacker' },
];

export function ThemeToggle() {
  const { theme, setTheme } = useThemeStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = themes.find((t) => t.value === theme) ?? themes[1];

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

  return (
    <div className="relative" ref={ref}>
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Theme selector"
        className="flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-raised)] px-2.5 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]"
        onClick={() => setOpen((prev) => !prev)}
        type="button"
      >
        <span>{current.icon}</span>
        <span className="hidden sm:inline">{current.label}</span>
        <svg className="h-3 w-3 text-[var(--color-text-tertiary)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-1 w-36 rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-bg-raised)] py-1 shadow-[var(--shadow-md)] animate-in fade-in" role="listbox">
          {themes.map((item) => (
            <button
              aria-selected={theme === item.value}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition hover:bg-[var(--color-bg-surface)] ${
                theme === item.value
                  ? 'font-medium text-[var(--color-accent)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
              key={item.value}
              onClick={() => {
                setTheme(item.value);
                setOpen(false);
              }}
              role="option"
              type="button"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
              {theme === item.value ? (
                <svg className="ml-auto h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
