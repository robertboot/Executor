import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPerson, getPersonRoles, personPhotoPublicUrl } from '@/lib/api';
import { displayName } from '@/lib/people';
import { updatePerson } from '../../actions';
import AvatarPicker from '@/components/AvatarPicker';
import RoleToggles from '../../RoleToggles';
import DeletePersonButton from '../DeletePersonButton';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPersonPage({ params }: PageProps) {
  const { id } = await params;
  const [person, roles] = await Promise.all([
    getPerson(id),
    getPersonRoles(id),
  ]);
  if (!person) notFound();

  const photoUrl = person.profile_photo_path
    ? personPhotoPublicUrl(person.profile_photo_path)
    : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24">
      <Link
        href={`/people/${person.id}`}
        className="inline-flex items-center text-sm text-muted hover:text-ink"
      >
        ← {displayName(person)}
      </Link>

      <div>
        <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-ink leading-tight">
          Edit person
        </h1>
        <p className="text-muted text-sm mt-2">
          Update what you know. Empty fields stay empty.
        </p>
      </div>

      <form
        action={updatePerson}
        encType="multipart/form-data"
        className="space-y-6"
      >
        <input type="hidden" name="id" value={person.id} />

        <Field label="First name" required>
          <input
            type="text"
            name="first_name"
            defaultValue={person.first_name}
            required
            className={input()}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Middle name">
            <input
              type="text"
              name="middle_name"
              defaultValue={person.middle_name ?? ''}
              className={input()}
            />
          </Field>
          <Field label="Last name">
            <input
              type="text"
              name="last_name"
              defaultValue={person.last_name ?? ''}
              className={input()}
            />
          </Field>
        </div>

        <Field
          label="Relationship to you"
          hint="e.g. Grandfather, Mother, Family Friend"
        >
          <input
            type="text"
            name="relationship"
            defaultValue={person.relationship ?? ''}
            placeholder="Grandfather"
            className={input()}
          />
        </Field>

        <Field label="Email" hint="Optional. For reaching them about an item.">
          <input
            type="email"
            name="email"
            defaultValue={person.email ?? ''}
            placeholder="name@example.com"
            className={input()}
          />
        </Field>

        <Field label="Side of family">
          <select
            name="side_of_family"
            defaultValue={person.side_of_family ?? ''}
            className={input()}
          >
            <option value="">—</option>
            <option value="paternal">Paternal</option>
            <option value="maternal">Maternal</option>
            <option value="other">Other</option>
          </select>
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Birth date">
            <input
              type="date"
              name="birth_date"
              defaultValue={person.birth_date ?? ''}
              className={input()}
            />
          </Field>
          <Field label="Death date">
            <input
              type="date"
              name="death_date"
              defaultValue={person.death_date ?? ''}
              className={input()}
            />
          </Field>
        </div>

        <Field
          label="Biography"
          hint="A few lines about their life — service, work, family, anything worth remembering."
        >
          <textarea
            name="biography"
            rows={6}
            defaultValue={person.biography ?? ''}
            className={input() + ' resize-y'}
          />
        </Field>

        <Field
          label="Profile photo"
          hint="Optional. Pinch, scroll, or drag to focus on the right person."
        >
          <AvatarPicker name="profile_photo" initialUrl={photoUrl} />
        </Field>

        <RoleToggles
          originator={person.is_originator}
          inheritor={roles.inheritor}
          conservator={roles.conservator}
        />

        <div className="flex items-center justify-between gap-3 pt-2">
          <Link
            href={`/people/${person.id}`}
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

      <section className="pt-6 mt-2 border-t border-hairline">
        <DeletePersonButton id={person.id} name={displayName(person)} />
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
