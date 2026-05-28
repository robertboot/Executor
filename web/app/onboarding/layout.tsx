import Logo from '@/components/Logo';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <header className="w-full bg-paper border-b border-hairline">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center">
          <Logo variant="compact" />
        </div>
      </header>
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {children}
      </main>
    </div>
  );
}
