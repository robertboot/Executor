import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-paper rounded-2xl border border-hairline p-6 text-center space-y-3">
        <h1 className="font-serif text-2xl text-ink">We can&rsquo;t find that.</h1>
        <p className="text-sm text-muted">
          The page or item you&rsquo;re looking for doesn&rsquo;t exist, or
          you don&rsquo;t have access to it.
        </p>
        <div className="pt-2">
          <Link href="/home">
            <Button>Back to home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
