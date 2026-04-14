import { useState } from 'react';

import { useAuth } from '../hooks/use-auth';
import { ThemeToggle } from '../components/ui/theme-toggle';

export function SettingsRouteView() {
  const { enableTotp, setupTotp, user } = useAuth();
  const [verificationCode, setVerificationCode] = useState('');

  const setupError = setupTotp.error instanceof Error ? setupTotp.error.message : null;
  const enableError = enableTotp.error instanceof Error ? enableTotp.error.message : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Settings</h1>

      <article className="border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-bg-base)] p-4">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Appearance</h2>
        <div className="mt-4">
          <ThemeToggle />
        </div>
      </article>

      <article className="border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-bg-base)] p-4">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Two-factor auth</h2>
          <span className={`border rounded-[var(--radius-full)] px-2 py-1 text-xs font-bold tracking-widest ${user?.totpEnabled ? 'border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success)]' : 'border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning)]'}`}>
            {user?.totpEnabled ? 'ENABLED' : 'DISABLED'}
          </span>
        </div>

        <div className="mt-4 space-y-3">
          <button
            className="border border-[var(--color-border-strong)] rounded-[var(--radius-md)] bg-[var(--color-accent-subtle)] px-4 py-2.5 text-sm font-medium text-[var(--color-accent)] transition hover:bg-[var(--color-accent-muted)] disabled:cursor-not-allowed disabled:border-[var(--color-border-default)] disabled:text-[var(--color-text-tertiary)]"
            disabled={setupTotp.isPending || Boolean(user?.totpEnabled)}
            onClick={() => void setupTotp.mutateAsync()}
            type="button"
          >
            {setupTotp.isPending ? 'Generating...' : user?.totpEnabled ? 'Already enabled' : 'Generate secret'}
          </button>

          {setupError ? <p className="text-xs text-[var(--color-error)]">{setupError}</p> : null}

          {setupTotp.data ? (
            <div className="border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] p-3 text-xs text-[var(--color-text-secondary)]">
              <p className="font-medium text-[var(--color-text-primary)]">Manual entry key</p>
              <p className="mt-1 break-all text-[var(--color-accent)]">{setupTotp.data.manualEntryKey}</p>
              <p className="mt-3 font-medium text-[var(--color-text-primary)]">OTPAuth URL</p>
              <p className="mt-1 break-all text-xs text-[var(--color-text-tertiary)]">{setupTotp.data.otpauthUrl}</p>

              <div className="mt-3 space-y-2">
                <label className="block space-y-1.5">
                  <span className="text-xs text-[var(--color-text-tertiary)]">Verify code</span>
                  <input
                    className="w-full border border-[var(--color-border-default)] rounded-[var(--radius-md)] bg-[var(--color-bg-base)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-input-border-focus)]"
                    inputMode="numeric"
                    maxLength={6}
                    onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    type="text"
                    value={verificationCode}
                  />
                </label>

                {enableError ? <p className="text-xs text-[var(--color-error)]">{enableError}</p> : null}

                <button
                  className="border border-[var(--color-border-strong)] rounded-[var(--radius-md)] px-4 py-2.5 text-sm font-medium text-[var(--color-accent)] transition hover:bg-[var(--color-accent-muted)] disabled:cursor-not-allowed disabled:border-[var(--color-border-default)] disabled:text-[var(--color-text-tertiary)]"
                  disabled={enableTotp.isPending || verificationCode.length !== 6 || Boolean(user?.totpEnabled)}
                  onClick={() => void enableTotp.mutateAsync(verificationCode)}
                  type="button"
                >
                  {enableTotp.isPending ? 'Verifying...' : 'Enable'}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </article>
    </div>
  );
}
