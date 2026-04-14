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
    <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)}>
      <div className="flex gap-2 rounded-2xl border border-stone-800 bg-stone-950/70 p-1 text-sm">
        {(['login', 'register'] as const).map((value) => (
          <button
            key={value}
            className={`flex-1 rounded-xl px-3 py-2 transition ${mode === value ? 'bg-emerald-500/15 text-emerald-100' : 'text-stone-400 hover:text-stone-200'}`}
            onClick={() => setMode(value)}
            type="button"
          >
            {value === 'login' ? 'Sign in' : 'Create first admin'}
          </button>
        ))}
      </div>

      <label className="block space-y-2">
        <span className="text-sm text-stone-300">Email</span>
        <input
          className="w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 py-3 text-stone-100 outline-none transition focus:border-emerald-400"
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          value={email}
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm text-stone-300">Password</span>
        <input
          className="w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 py-3 text-stone-100 outline-none transition focus:border-emerald-400"
          disabled={Boolean(tempToken)}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          value={password}
        />
      </label>

      {tempToken ? (
        <label className="block space-y-2 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3">
          <span className="text-sm text-amber-100">Authenticator code</span>
          <input
            className="w-full rounded-2xl border border-amber-400/30 bg-stone-950 px-4 py-3 text-stone-100 outline-none transition focus:border-amber-300"
            inputMode="numeric"
            maxLength={6}
            onChange={(event) => setTotpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            type="text"
            value={totpCode}
          />
          <p className="text-xs text-amber-100/80">Enter the 6-digit code from your authenticator app to finish sign-in.</p>
        </label>
      ) : null}

      {errorMessage ? <p className="text-sm text-rose-300">{errorMessage}</p> : null}

      <button
        className="w-full rounded-2xl bg-emerald-400 px-4 py-3 font-medium text-stone-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-stone-700 disabled:text-stone-400"
        disabled={activeMutation.isPending}
        type="submit"
      >
        {activeMutation.isPending ? 'Submitting…' : tempToken ? 'Verify code' : mode === 'login' ? 'Sign in' : 'Bootstrap admin'}
      </button>
    </form>
  );
}