import Link from 'next/link';
import { createConservator } from '../actions';
import ConservatorForm from '../ConservatorForm';

export const dynamic = 'force-dynamic';

export default function NewConservatorPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24">
      <Link
        href="/conservators"
        className="inline-flex items-center text-sm text-muted hover:text-ink"
      >
        ← Conservators
      </Link>

      <div>
        <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-ink leading-tight">
          Invite a Conservator
        </h1>
        <p className="text-muted text-sm mt-2 max-w-lg">
          A conservator is a trusted family member, historian, or
          caretaker. Every change they make to the archive is logged
          permanently.
        </p>
      </div>

      <ConservatorForm
        mode="create"
        action={createConservator}
        submitLabel="Send invitation"
      />
    </div>
  );
}
