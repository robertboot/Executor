import Link from 'next/link';
import { createPerson } from '../actions';

export const dynamic = 'force-dynamic';

export default function NewPersonPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24">
      <Link
        href="/people"
        className="inline-flex items-center text-sm text-muted hover:text-ink"
      >
        ← All people
      </Link>

      <div>
        <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-ink leading-tight">
          Add a person
        </h1>
        <p className="text-muted text-sm mt-2">
          Their basic story. You can always edit or add more later.
        </p>
      </div>

      <form
        action={createPerson}
        encType="multipart/form-data"
        className="space-y-6"
      >
        <Field label="First name" required>
          <input
            type="text"
            name="first_name"
            required
            className={input()}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Middle name">
            <input type="text" name="middle_name" className={input()} />
          </Field>
          <Field label="Last name">
            <input type="text" name="last_name" className={input()} />
          </Field>
        </div>

        <Field
          label="Relationship to you"
          hint="e.g. Grandfather, Mother, Family Friend"
        >
          <input
            type="text"
            name="relationship"
            placeholder="Grandfather"
            className={input()}
          />
        </Field>

        <Field label="Email" hint="Optional. For reaching them about an item.">
          <input
            type="email"
            name="email"
            placeholder="name@example.com"
            className={input()}
          />
        </Field>

        <Field label="Side of family">
          <select name="side_of_family" className={input()}>
            <option value="">—</option>
            <option value="paternal">Paternal</option>
            <option value="maternal">Maternal</option>
            <option value="other">Other</option>
          </select>
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Birth date">
            <input type="date" name="birth_date" className={input()} />
          </Field>
          <Field label="Death date">
            <input type="date" name="death_date" className={input()} />
          </Field>
        </div>

        <Field
          label="Biography"
          hint="A few lines about their life — service, work, family, anything worth remembering."
        >
          <textarea
            name="biography"
            rows={6}
            className={input() + ' resize-y'}
          />
        </Field>

        <Field label="Profile photo" hint="Optional. JPG or PNG, < 5 MB.">
          <input
            type="file"
            name="profile_photo"
            accept="image/jpeg,image/png,image/webp"
            className="text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-forest file:text-cream file:text-sm file:cursor-pointer hover:file:bg-forest-deep"
          />
        </Field>

        <div className="flex items-center justify-between gap-3 pt-2">
          <Link
            href="/people"
            className="text-sm text-muted hover:text-ink underline"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="inline-flex items-center px-5 h-11 rounded-lg bg-forest text-cream text-sm font-medium hover:bg-forest-deep transition-colors"
          >
            Save person
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
