import Logo from '@/components/Logo';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import ResetPasswordForm from './ResetPasswordForm';

export const metadata = { title: 'Set a new password — Heirloom' };
export const dynamic = 'force-dynamic';

export default async function ResetPasswordPage() {
  // The user reaches this page after clicking the email link, which
  // exchanges the code in /auth/callback and establishes a session.
  // Anyone without a session lands here without permission to update
  // the password — bounce them to /forgot-password to start over.
  const user = await getCurrentUser();
  if (!user) redirect('/forgot-password');

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md flex flex-col items-center gap-8">
        <Logo className="self-center" />

        <div className="w-full bg-paper rounded-2xl shadow-card border border-hairline p-6">
          <h1 className="font-serif text-2xl text-ink mb-1">
            Set a new password
          </h1>
          <p className="text-sm text-muted mb-5">
            Choose a password for{' '}
            <span className="text-ink">{user.email}</span>. We&rsquo;ll
            sign you in once it&rsquo;s saved.
          </p>

          <ResetPasswordForm />
        </div>
      </div>
    </div>
  );
}
