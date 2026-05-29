import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getConservator, conservatorPhotoUrl } from '@/lib/api';
import { updateConservator } from '../../actions';
import ConservatorForm from '../../ConservatorForm';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditConservatorPage({ params }: PageProps) {
  const { id } = await params;
  const conservator = await getConservator(id);
  if (!conservator) notFound();

  const photoUrl = conservator.profile_photo_path
    ? conservatorPhotoUrl(conservator.profile_photo_path)
    : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24">
      <Link
        href={`/conservators/${conservator.id}`}
        className="inline-flex items-center text-sm text-muted hover:text-ink"
      >
        ← {conservator.name}
      </Link>

      <div>
        <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-ink leading-tight">
          Edit access
        </h1>
        <p className="text-muted text-sm mt-2">
          Update their info or change what they can do.
        </p>
      </div>

      <ConservatorForm
        mode="edit"
        action={updateConservator}
        submitLabel="Save changes"
        initial={{
          id: conservator.id,
          name: conservator.name,
          email: conservator.email,
          phone: conservator.phone,
          relationship: conservator.relationship,
          notes: conservator.notes,
          permission_level: conservator.permission_level,
        }}
        initialPhotoUrl={photoUrl}
      />
    </div>
  );
}
