import Link from 'next/link';
import { createCustomCollection } from '../actions';

export const dynamic = 'force-dynamic';

export default function NewCustomCollectionPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  return <Form searchParams={searchParams} />;
}

async function Form({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const backHref = params.next ?? '/collections';

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24">
      <Link
        href={backHref}
        className="inline-flex items-center text-sm text-muted hover:text-ink"
      >
        ← Back
      </Link>

      <div>
        <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-ink leading-tight">
          Name your custom collection
        </h1>
        <p className="text-muted text-sm mt-2">
          Pick a name and (optionally) a cover image. You can change both
          later from the collection page.
        </p>
      </div>

      <form
        action={createCustomCollection}
        encType="multipart/form-data"
        className="space-y-6"
      >
        <Field label="Collection name" required>
          <input
            type="text"
            name="name"
            required
            placeholder="e.g. Grandma's Hat Pins"
            className={input()}
          />
        </Field>

        <Field
          label="Cover image"
          hint="Optional. JPG or PNG, up to about 5 MB. Square works best."
        >
          <input
            type="file"
            name="image"
            accept="image/jpeg,image/png,image/webp"
            className="text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-forest file:text-cream file:text-sm file:cursor-pointer hover:file:bg-forest-deep"
          />
        </Field>

        <div className="flex items-center justify-between gap-3 pt-2">
          <Link
            href={backHref}
            className="text-sm text-muted hover:text-ink underline"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="inline-flex items-center px-5 h-11 rounded-lg bg-forest text-cream text-sm font-medium hover:bg-forest-deep transition-colors"
          >
            Create collection
          </button>
        </div>
      </form>
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
