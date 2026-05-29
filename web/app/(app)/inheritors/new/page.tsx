import Link from 'next/link';
import { createInheritor } from '../actions';
import InheritorForm from '../InheritorForm';

export const dynamic = 'force-dynamic';

export default function NewInheritorPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24">
      <Link
        href="/inheritors"
        className="inline-flex items-center text-sm text-muted hover:text-ink"
      >
        ← Inheritors
      </Link>

      <div>
        <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-ink leading-tight">
          Add an Inheritor
        </h1>
        <p className="text-muted text-sm mt-2 max-w-lg">
          Designate someone (or an institution) to receive items and
          collections. You can assign specific items from each item&rsquo;s
          edit page.
        </p>
      </div>

      <InheritorForm
        mode="create"
        action={createInheritor}
        submitLabel="Save inheritor"
      />
    </div>
  );
}
