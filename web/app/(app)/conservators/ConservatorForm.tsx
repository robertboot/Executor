import Link from 'next/link';
import AvatarPicker from '@/components/AvatarPicker';
import PersonPicker from '@/components/PersonPicker';
import type { PersonPickerEntry } from '@/lib/api';

export interface ConservatorFormInitial {
  id?: string;
  name?: string;
  email?: string | null;
  phone?: string | null;
  relationship?: string | null;
  notes?: string | null;
  permission_level?: string;
  person_id?: string | null;
}

export default function ConservatorForm({
  mode,
  action,
  submitLabel,
  initial,
  initialPhotoUrl,
  people,
}: {
  mode: 'create' | 'edit';
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  initial?: ConservatorFormInitial;
  initialPhotoUrl?: string | null;
  people: PersonPickerEntry[];
}) {
  return (
    <form action={action} encType="multipart/form-data" className="space-y-6">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}

      <Field
        label="Link to a Legacy Person"
        hint="Optional — sources the name and photo from a Legacy Person record so updates stay in sync across the archive."
      >
        <PersonPicker
          people={people}
          initialPersonId={initial?.person_id ?? null}
          initialPhotoUrl={initialPhotoUrl ?? null}
        />
      </Field>

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

      <Field
        label="Profile photo"
        hint="Optional. Pinch, scroll, or drag to focus on the right person."
      >
        <AvatarPicker name="profile_photo" initialUrl={initialPhotoUrl} />
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
