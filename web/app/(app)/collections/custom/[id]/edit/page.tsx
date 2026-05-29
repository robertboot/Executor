import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getCustomCollection, customCollectionImageUrl } from '@/lib/api';
import { updateCustomCollection, deleteCustomCollection } from '../../actions';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCustomCollectionPage({ params }: PageProps) {
  const { id } = await params;
  const collection = await getCustomCollection(id);
  if (!collection) notFound();

  const imageUrl = collection.image_path
    ? customCollectionImageUrl(collection.image_path)
    : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24">
      <Link
        href={`/collections/${collection.id}?custom=1`}
        className="inline-flex items-center text-sm text-muted hover:text-ink"
      >
        ← {collection.name}
      </Link>

      <div>
        <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-ink leading-tight">
          Edit collection
        </h1>
      </div>

      <form
        action={updateCustomCollection}
        encType="multipart/form-data"
        className="space-y-6"
      >
        <input type="hidden" name="id" value={collection.id} />

        <Field label="Collection name" required>
          <input
            type="text"
            name="name"
            defaultValue={collection.name}
            required
            className={input()}
          />
        </Field>

        <Field
          label="Cover image"
          hint="Optional. Upload a new file to replace the current one."
        >
          <div className="space-y-3">
            {imageUrl ? (
              <div className="flex items-center gap-3">
                <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-cream-soft border border-hairline">
                  <Image
                    src={imageUrl}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
                <div className="text-xs text-muted">Current cover</div>
              </div>
            ) : (
              <div className="text-xs text-muted italic">No cover yet</div>
            )}
            <input
              type="file"
              name="image"
              accept="image/jpeg,image/png,image/webp"
              className="text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-forest file:text-cream file:text-sm file:cursor-pointer hover:file:bg-forest-deep"
            />
          </div>
        </Field>

        <div className="flex items-center justify-between gap-3 pt-2">
          <Link
            href={`/collections/${collection.id}?custom=1`}
            className="text-sm text-muted hover:text-ink underline"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="inline-flex items-center px-5 h-11 rounded-lg bg-forest text-cream text-sm font-medium hover:bg-forest-deep transition-colors"
          >
            Save changes
          </button>
        </div>
      </form>

      <section className="pt-6 border-t border-hairline">
        <form action={deleteCustomCollection}>
          <input type="hidden" name="id" value={collection.id} />
          <button
            type="submit"
            className="text-xs text-red-700 hover:text-red-900 underline"
          >
            Delete this collection
          </button>
        </form>
        <p className="text-[10px] text-muted mt-1">
          Items keep their data but lose their collection assignment.
        </p>
      </section>
    </div>
  );
}

function input() {
  return 'w-full bg-paper border border-hairline rounded-lg px-3 h-11 text-sm text-ink focus:outline-none focus:border-forest';
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-xs uppercase tracking-wider text-muted">
        {label}
        {required && <span className="text-red-700 ml-1">*</span>}
      </span>
      {children}
      {hint && <span className="block text-xs text-muted">{hint}</span>}
    </label>
  );
}
