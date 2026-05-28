import ScanClient from './ScanClient';

export const metadata = { title: 'Scan to recognize — Heirloom' };

export default function ScanPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-ink">Scan to recognize</h1>
        <p className="text-muted text-sm mt-1">
          Take a photo of an object to check whether it&rsquo;s already in the
          inventory. We&rsquo;ll match it against existing item photos and
          show the closest results.
        </p>
      </div>
      <ScanClient />
    </div>
  );
}
