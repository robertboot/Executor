import Logo from '@/components/Logo';
import ForgotPasswordForm from './ForgotPasswordForm';

export const metadata = { title: 'Reset password — Heirloom' };

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; sent?: string; error?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md flex flex-col items-center gap-8">
        <Logo className="self-center" />

        <div className="w-full bg-paper rounded-2xl shadow-card border border-hairline p-6">
          <h1 className="font-serif text-2xl text-ink mb-1">
            Reset your password
          </h1>
          <p className="text-sm text-muted mb-5">
            Enter the email address on your account and we&rsquo;ll send
            you a link to set a new password.
          </p>

          <ForgotPasswordForm initialEmail={params.email} />

          {params.sent === '1' && (
            <p className="mt-4 text-sm text-forest">
              Check your inbox — the reset link should arrive in under a
              minute.
            </p>
          )}
          {params.error && (
            <p className="mt-4 text-sm text-red-700">{params.error}</p>
          )}
        </div>

        <p className="text-xs text-muted text-center max-w-xs">
          <a href="/login" className="text-forest hover:underline">
            Back to sign in
          </a>
        </p>
      </div>
    </div>
  );
}
