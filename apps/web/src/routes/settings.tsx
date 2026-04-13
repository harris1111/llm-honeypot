import { useState } from 'react';

import { useAuth } from '../hooks/use-auth';

export function SettingsRouteView() {
  const { enableTotp, setupTotp, user } = useAuth();
  const [verificationCode, setVerificationCode] = useState('');

  const setupError = setupTotp.error instanceof Error ? setupTotp.error.message : null;
  const enableError = enableTotp.error instanceof Error ? enableTotp.error.message : null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Settings</p>
        <h2 className="mt-2 text-3xl font-semibold text-stone-50">Foundation settings</h2>
      </div>
      <article className="rounded-[1.75rem] border border-stone-800 bg-stone-950/70 p-5">
        <h3 className="text-lg font-semibold text-stone-50">What is wired now</h3>
        <ul className="mt-4 space-y-2 text-sm text-stone-300">
          <li>JWT login and refresh-backed API access</li>
          <li>Node provisioning, approval, and config edits</li>
          <li>Shared envelope, capture ingestion, and registration contracts</li>
        </ul>
      </article>

      <article className="rounded-[1.75rem] border border-stone-800 bg-stone-950/70 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-stone-50">Two-factor authentication</h3>
            <p className="mt-2 text-sm text-stone-400">
              Lock operator access behind an authenticator app before broader team rollout.
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${user?.totpEnabled ? 'bg-emerald-500/15 text-emerald-200' : 'bg-amber-500/15 text-amber-200'}`}>
            {user?.totpEnabled ? 'Enabled' : 'Not enabled'}
          </span>
        </div>

        <div className="mt-5 space-y-4">
          <button
            className="rounded-2xl bg-emerald-400 px-4 py-3 font-medium text-stone-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-stone-700 disabled:text-stone-400"
            disabled={setupTotp.isPending || Boolean(user?.totpEnabled)}
            onClick={() => void setupTotp.mutateAsync()}
            type="button"
          >
            {setupTotp.isPending ? 'Generating secret…' : user?.totpEnabled ? 'TOTP already enabled' : 'Generate authenticator secret'}
          </button>

          {setupError ? <p className="text-sm text-rose-300">{setupError}</p> : null}

          {setupTotp.data ? (
            <div className="rounded-2xl border border-stone-800 bg-stone-900/80 p-4 text-sm text-stone-300">
              <p className="font-medium text-stone-100">Manual entry key</p>
              <p className="mt-2 break-all font-mono text-emerald-200">{setupTotp.data.manualEntryKey}</p>
              <p className="mt-4 font-medium text-stone-100">otpauth URL</p>
              <p className="mt-2 break-all font-mono text-xs text-stone-400">{setupTotp.data.otpauthUrl}</p>

              <div className="mt-4 space-y-3">
                <label className="block space-y-2">
                  <span className="text-sm text-stone-200">Verify code to enable TOTP</span>
                  <input
                    className="w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 py-3 text-stone-100 outline-none transition focus:border-emerald-400"
                    inputMode="numeric"
                    maxLength={6}
                    onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    type="text"
                    value={verificationCode}
                  />
                </label>

                {enableError ? <p className="text-sm text-rose-300">{enableError}</p> : null}

                <button
                  className="rounded-2xl border border-emerald-400/30 px-4 py-3 font-medium text-emerald-200 transition hover:border-emerald-300 hover:text-emerald-100 disabled:cursor-not-allowed disabled:border-stone-700 disabled:text-stone-500"
                  disabled={enableTotp.isPending || verificationCode.length !== 6 || Boolean(user?.totpEnabled)}
                  onClick={() => void enableTotp.mutateAsync(verificationCode)}
                  type="button"
                >
                  {enableTotp.isPending ? 'Verifying…' : 'Enable TOTP'}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </article>
    </div>
  );
}