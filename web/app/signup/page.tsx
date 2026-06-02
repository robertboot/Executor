import Logo from '@/components/Logo';
import SignupForm from './SignupForm';

export const metadata = { title: 'Create account — Heirloom' };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; sent?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md flex flex-col items-center gap-8">
        <Logo className="self-center" />

        <div className="w-full bg-paper rounded-2xl shadow-card border border-hairline p-6">
          <h1 className="font-serif text-2xl text-ink mb-1">
            Create your archive
          </h1>
          <p className="text-sm text-muted mb-5">
            Pick an email and password. We&rsquo;ll send a confirmation
            link before your account goes live.
          </p>

          <SignupForm next={params.next} />

          {params.sent === '1' && (
            <p className="mt-4 text-sm text-forest">
              Check your inbox — confirm your email to finish setting
              up the account.
            </p>
          )}
          {params.error && (
            <p className="mt-4 text-sm text-red-700">{params.error}</p>
          )}
        </div>

        <p className="text-xs text-muted text-center max-w-xs">
          Already have an account?{' '}
          <a href="/login" className="text-forest hover:underline">
            Sign in
          </a>
          .
        </p>
      </div>
    </div>
  );
}
