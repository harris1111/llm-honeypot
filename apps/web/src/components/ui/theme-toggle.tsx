import { useThemeStore, type Theme } from '../../lib/theme-store';

const themes: Array<{ icon: string; label: string; value: Theme }> = [
  { icon: '☀', label: 'Light', value: 'light' },
  { icon: '◑', label: 'Dark', value: 'dark' },
  { icon: '⌘', label: 'Hacker', value: 'hacker' },
];

export function ThemeToggle() {
  const { theme, setTheme } = useThemeStore();

  return (
    <div
      aria-label="Theme selector"
      className="inline-flex rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-raised)] p-0.5"
      role="radiogroup"
    >
      {themes.map((item) => (
        <button
          aria-checked={theme === item.value}
          aria-label={item.label}
          className={`rounded-[var(--radius-sm)] px-2.5 py-1 text-xs font-medium transition-all ${
            theme === item.value
              ? 'bg-[var(--color-accent)] text-[var(--color-text-inverse)] shadow-[var(--shadow-xs)]'
              : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
          }`}
          key={item.value}
          onClick={() => setTheme(item.value)}
          role="radio"
          type="button"
        >
          <span className="mr-1">{item.icon}</span>
          <span className="hidden sm:inline">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
