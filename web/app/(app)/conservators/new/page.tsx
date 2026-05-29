import Link from 'next/link';
import { createConservator } from '../actions';

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

export function ConservatorForm({
  mode,
  action,
  submitLabel,
  initial,
  initialPhotoUrl,
}: {
  mode: 'create' | 'edit';
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  initial?: {
    id?: string;
    name?: string;
    email?: string | null;
    phone?: string | null;
    relationship?: string | null;
    notes?: string | null;
    permission_level?: string;
  };
  initialPhotoUrl?: string | null;
}) {
  return (
    <form action={action} encType="multipart/form-data" className="space-y-6">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}

      <Field label="Full name" required>
        <input
          type="text"
          name="name"
          required
          defaultValue={initial?.name ?? ''}
          placeholder="Sarah Boot"
          className={input()}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Email" hint="They'll need this to view the archive.">
          <input
            type="email"
            name="email"
            defaultValue={initial?.email ?? ''}
            placeholder="name@example.com"
            className={input()}
          />
        </Field>
        <Field label="Phone">
          <input
            type="tel"
            name="phone"
            defaultValue={initial?.phone ?? ''}
            placeholder="(555) 555-5555"
            className={input()}
          />
        </Field>
      </div>

      <Field label="Relationship to you">
        <input
          type="text"
          name="relationship"
          defaultValue={initial?.relationship ?? ''}
          placeholder="Sister · Historian · Family Friend"
          className={input()}
        />
      </Field>

      <Field
        label="Permission level"
        hint="Controls what they can see and do across your archive."
        required
      >
        <select
          name="permission_level"
          defaultValue={initial?.permission_level ?? 'viewer'}
          required
          className={input()}
        >
          <option value="viewer">Viewer — read-only access</option>
          <option value="contributor">
            Contributor — can add items + photos
          </option>
          <option value="curator">
            Curator — can manage collections + stories
          </option>
          <option value="owner">Owner — full access</option>
        </select>
      </Field>

      <Field
        label="Notes"
        hint="Optional. Anything you want to remember about this person's access."
      >
        <textarea
          name="notes"
          rows={4}
          defaultValue={initial?.notes ?? ''}
          className={input() + ' resize-y'}
        />
      </Field>

      <Field label="Profile photo" hint="Optional. JPG or PNG.">
        {initialPhotoUrl && (
          <div className="flex items-center gap-3 mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={initialPhotoUrl}
              alt=""
              className="w-14 h-14 rounded-full object-cover bg-cream-soft"
            />
            <div className="text-xs text-muted">Current photo</div>
          </div>
        )}
        <input
          type="file"
          name="profile_photo"
          accept="image/jpeg,image/png,image/webp"
          className="text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-forest file:text-cream file:text-sm file:cursor-pointer hover:file:bg-forest-deep"
        />
      </Field>

      <div className="flex items-center justify-between gap-3 pt-2">
        <Link
          href={
            mode === 'edit' && initial?.id
              ? `/conservators/${initial.id}`
              : '/conservators'
          }
          className="text-sm text-muted hover:text-ink underline"
        >
          Cancel
        </Link>
        <button
          type="submit"
          className="inline-flex items-center px-5 h-11 rounded-lg bg-forest text-cream text-sm font-medium hover:bg-forest-deep transition-colors"
        >
          {submitLabel}
        </button>
      </div>
    </form>
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
