import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getInheritor,
  getPersonRoles,
  listPeoplePicker,
} from '@/lib/api';
import { updateInheritor } from '../../actions';
import InheritorForm from '../../InheritorForm';
import StatusDefinitions from '../../StatusDefinitions';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditInheritorPage({ params }: PageProps) {
  const { id } = await params;
  const [inheritor, people] = await Promise.all([
    getInheritor(id),
    listPeoplePicker(),
  ]);
  if (!inheritor) notFound();

  const photoUrl = inheritor.primaryPhotoUrl;
  const linkedRoles = inheritor.person_id
    ? await getPersonRoles(inheritor.person_id)
    : null;

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-24">
      <Link
        href={`/inheritors/${inheritor.id}`}
        className="inline-flex items-center text-sm text-muted hover:text-ink"
      >
        ← {inheritor.display_name}
      </Link>

      <div>
        <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-ink leading-tight">
          Edit inheritor
        </h1>
      </div>

      <InheritorForm
        mode="edit"
        action={updateInheritor}
        submitLabel="Save changes"
        initial={{
          id: inheritor.id,
          display_name: inheritor.display_name,
          email: inheritor.email,
          relationship: inheritor.relationship,
          status: inheritor.status,
          notes: inheritor.notes,
          person_id: inheritor.person_id,
        }}
        initialPhotoUrl={photoUrl}
        people={people}
        linkedConservator={linkedRoles?.conservator ?? null}
      />

      <StatusDefinitions collapsedByDefault />
    </div>
  );
}
