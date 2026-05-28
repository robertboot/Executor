import Logo from '@/components/Logo';
import LoginForm from './LoginForm';

export const metadata = { title: 'Sign in — Heirloom' };

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; sent?: string }>;
}) {
  return <LoginScreen searchParamsPromise={searchParams} />;
}

async function LoginScreen({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ next?: string; error?: string; sent?: string }>;
}) {
  const params = await searchParamsPromise;
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md flex flex-col items-center gap-8">
        <Logo className="self-center" />

        <div className="w-full bg-paper rounded-2xl shadow-card border border-hairline p-6">
          <h1 className="font-serif text-2xl text-ink mb-1">Welcome back</h1>
          <p className="text-sm text-muted mb-5">
            Sign in with a one-time magic link. We&rsquo;ll email it to you.
          </p>

          <LoginForm next={params.next} />

          {params.sent === '1' && (
            <p className="mt-4 text-sm text-forest">
              Check your inbox — the magic link should arrive in under a minute.
            </p>
          )}
          {params.error && (
            <p className="mt-4 text-sm text-red-700">{params.error}</p>
          )}
        </div>

        <p className="text-xs text-muted text-center max-w-xs">
          Heirloom is invite-only while we build. Signing in with an
          unrecognized email creates an account automatically.
        </p>
      </div>
    </div>
  );
}
