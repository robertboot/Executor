import Link from 'next/link';
import { STATUS_LABEL, STATUS_OPTIONS } from '@/lib/inheritors';
import AvatarPicker from '@/components/AvatarPicker';

export interface InheritorFormInitial {
  id?: string;
  display_name?: string;
  email?: string | null;
  relationship?: string | null;
  status?: string;
  notes?: string | null;
}

export default function InheritorForm({
  mode,
  action,
  submitLabel,
  initial,
  initialPhotoUrl,
}: {
  mode: 'create' | 'edit';
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  initial?: InheritorFormInitial;
  initialPhotoUrl?: string | null;
}) {
  return (
    <form action={action} encType="multipart/form-data" className="space-y-6">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}

      <Field label="Full name" required>
        <input
          type="text"
          name="display_name"
          required
          defaultValue={initial?.display_name ?? ''}
          placeholder="Sarah Boot"
          className={input()}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Relationship">
          <input
            type="text"
            name="relationship"
            defaultValue={initial?.relationship ?? ''}
            placeholder="Daughter · Niece · Charity"
            className={input()}
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            name="email"
            defaultValue={initial?.email ?? ''}
            placeholder="name@example.com"
            className={input()}
          />
        </Field>
      </div>

      <Field label="Status" required>
        <select
          name="status"
          required
          defaultValue={initial?.status ?? 'designated_heir'}
          className={input()}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Notes"
        hint="Optional. Special instructions, intent, or context."
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
              ? `/inheritors/${initial.id}`
              : '/inheritors'
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
