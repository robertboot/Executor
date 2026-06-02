import { redirect } from 'next/navigation';
import Logo from '@/components/Logo';
import { getCurrentUser } from '@/lib/supabase/server';
import { APP_VERSION } from '@/lib/version';
import { dismissWelcome } from './actions';

export const metadata = { title: 'Welcome — Heirloom' };
export const dynamic = 'force-dynamic';

export default async function WelcomePage() {
  // The splash is only useful for signed-in users — if you're not
  // signed in yet, sending you to the splash before you can do anything
  // with it is just friction.
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <main className="flex-1 flex flex-col items-center px-4 py-10 sm:py-14">
        <div className="w-full max-w-md flex flex-col items-center">
          <Logo className="self-center mb-6" />

          <h1 className="font-serif text-3xl sm:text-4xl text-ink leading-tight text-center">
            Welcome to Heirloom
          </h1>
          <p className="text-muted text-sm sm:text-base mt-3 text-center max-w-sm">
            Your family&rsquo;s archive — built to be opened the way a
            keepsake box is. Add Heirloom to your home screen to use it
            like a native app.
          </p>

          {/* Install instructions */}
          <section className="w-full mt-8 bg-paper border border-hairline rounded-2xl p-5 shadow-card space-y-5">
            <h2 className="font-serif text-lg text-ink">
              Add Heirloom to your Home Screen
            </h2>

            <InstallStep
              platform="On iPhone or iPad (Safari)"
              steps={[
                <>
                  Tap the <strong>Share</strong> button{' '}
                  <ShareIcon /> at the bottom of the browser.
                </>,
                <>
                  Scroll down and choose{' '}
                  <strong>Add to Home Screen</strong>.
                </>,
                <>
                  Tap <strong>Add</strong> in the top right — the
                  Heirloom icon appears with your other apps.
                </>,
              ]}
            />

            <InstallStep
              platform="On Android (Chrome)"
              steps={[
                <>
                  Tap the <strong>three-dot menu</strong> in the top
                  right of Chrome.
                </>,
                <>
                  Choose <strong>Install app</strong> (or{' '}
                  <strong>Add to Home screen</strong> on older Chrome).
                </>,
                <>
                  Tap <strong>Install</strong> to confirm.
                </>,
              ]}
            />

            <p className="text-xs text-muted leading-relaxed">
              On desktop browsers, look for the install icon in the
              address bar.
            </p>
          </section>

          {/* CTAs */}
          <div className="w-full mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <form action={dismissWelcome}>
              <input type="hidden" name="dest" value="/items/new" />
              <button
                type="submit"
                className="w-full h-12 rounded-lg bg-forest text-cream text-sm font-medium hover:bg-forest-deep transition-colors"
              >
                Add an item
              </button>
            </form>
            <form action={dismissWelcome}>
              <input type="hidden" name="dest" value="/home" />
              <button
                type="submit"
                className="w-full h-12 rounded-lg border border-ink/20 text-ink text-sm font-medium hover:border-ink/40 transition-colors"
              >
                Go to main page
              </button>
            </form>
          </div>
        </div>
      </main>

      <footer className="text-center text-[10px] uppercase tracking-widest text-muted py-6">
        Heirloom · v{APP_VERSION} · {new Date().getFullYear()}
      </footer>
    </div>
  );
}

function InstallStep({
  platform,
  steps,
}: {
  platform: string;
  steps: React.ReactNode[];
}) {
  return (
    <div className="space-y-2">
      <div className="text-[11px] uppercase tracking-widest text-gold-deep">
        {platform}
      </div>
      <ol className="space-y-1.5 list-decimal list-inside text-sm text-ink-soft">
        {steps.map((s, i) => (
          <li key={i} className="leading-relaxed">
            {s}
          </li>
        ))}
      </ol>
    </div>
  );
}

function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={14}
      height={14}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="inline-block align-text-bottom text-gold-deep"
      aria-hidden="true"
    >
      <path d="M12 3v12M8 7l4-4 4 4" />
      <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
    </svg>
  );
}
