import type { FormEvent } from 'react';
import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';

import { useAuth } from '../../hooks/use-auth';

type AuthMode = 'login' | 'register';

export function LoginForm() {
  const navigate = useNavigate();
  const { login, register, tempToken, verifyTotp } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('admin@llmtrap.local');
  const [password, setPassword] = useState('ChangeMe123456!');
  const [totpCode, setTotpCode] = useState('');

  const mutation = mode === 'login' ? login : register;
  const activeMutation = tempToken ? verifyTotp : mutation;
  const errorMessage = activeMutation.error instanceof Error ? activeMutation.error.message : null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (tempToken) {
      await verifyTotp.mutateAsync(totpCode);
      navigate({ to: '/overview' });
      return;
    }

    if (mode === 'login') {
      const response = await login.mutateAsync({ email, password });
      if (!response.requiresTotp) {
        navigate({ to: '/overview' });
      }
      return;
    }

    const response = await register.mutateAsync({ email, password });
    if (!response.requiresTotp) {
      navigate({ to: '/overview' });
    }
  }

  return (
    <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
      {/* Mode toggle */}
      <div className="flex gap-1 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-raised)] p-1 text-xs">
        {(['login', 'register'] as const).map((value) => (
          <button
            key={value}
            className={`flex-1 rounded-[var(--radius-sm)] px-3 py-2 transition ${
              mode === value
                ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent)]'
                : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
            }`}
            onClick={() => setMode(value)}
            type="button"
          >
            {value === 'login' ? 'Sign in' : 'Bootstrap admin'}
          </button>
        ))}
      </div>

      <label className="block space-y-1.5">
        <span className="text-xs text-[var(--color-text-secondary)]">Email</span>
        <input
          className="w-full rounded-[var(--radius-md)] border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-input-border-focus)] focus:ring-2 focus:ring-[var(--color-focus-ring)]"
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          value={email}
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-xs text-[var(--color-text-secondary)]">Password</span>
        <input
          className="w-full rounded-[var(--radius-md)] border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-input-border-focus)] focus:ring-2 focus:ring-[var(--color-focus-ring)] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={Boolean(tempToken)}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          value={password}
        />
      </label>

      {tempToken ? (
        <label className="block space-y-1.5 rounded-[var(--radius-md)] border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] p-3">
          <span className="text-xs text-[var(--color-warning)]">Authenticator code</span>
          <input
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-warning-border)] bg-[var(--color-input-bg)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-warning)] focus:ring-2 focus:ring-[var(--color-warning-border)]"
            inputMode="numeric"
            maxLength={6}
            onChange={(event) => setTotpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            type="text"
            value={totpCode}
          />
          <p className="text-[10px] text-[var(--color-warning)]">Enter the 6-digit code from your authenticator app.</p>
        </label>
      ) : null}

      {errorMessage ? <p className="text-xs text-[var(--color-error)]">{errorMessage}</p> : null}

      <button
        className="w-full rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-inverse)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        disabled={activeMutation.isPending}
        type="submit"
      >
        {activeMutation.isPending
          ? 'Processing…'
          : tempToken
            ? 'Verify code'
            : mode === 'login'
              ? 'Sign in'
              : 'Bootstrap'}
      </button>
    </form>
  );
}
