import { PublicHeader } from '../components/public/public-header';
import { LoginForm } from '../components/auth/login-form';

export function LoginRouteView() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-primary)]">
      <PublicHeader />
      <div className="mx-auto max-w-sm px-6 pt-16">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Sign in</h1>
        <p className="mt-2 text-sm text-[var(--color-text-tertiary)]">Access the operator dashboard.</p>
        <div className="mt-8">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
