import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  getItem,
  listPhotos,
  photoPublicUrl,
  listItemPeople,
  listPeople,
  personPhotoPublicUrl,
  getInheritor,
  listInheritorsLight,
} from '@/lib/api';
import { STATUS_LABEL, STATUS_BADGE_CLASS } from '@/lib/inheritors';
import { setItemInheritance } from '@/app/(app)/inheritors/actions';
import { findCategory, labelForCategory } from '@/lib/categories';
import { formatDate, formatMoney } from '@/lib/format';
import {
  displayName,
  lifeDates,
  personInitials,
  ROLE_LABEL,
} from '@/lib/people';
import { Button } from '@/components/ui/Button';
import { addPersonToItem, removePersonFromItem } from '@/app/(app)/people/actions';

export const dynamic = 'force-dynamic';

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getItem(id);
  if (!item) notFound();

  const [photos, peopleLinks, allPeople, allInheritors, designated, alternate] =
    await Promise.all([
      listPhotos(id),
      listItemPeople(id),
      listPeople(),
      listInheritorsLight(),
      item.designated_inheritor_id
        ? getInheritor(item.designated_inheritor_id)
        : Promise.resolve(null),
      item.alternate_inheritor_id
        ? getInheritor(item.alternate_inheritor_id)
        : Promise.resolve(null),
    ]);
  const preset = findCategory(item.category);

  const connectedPersonIds = new Set(peopleLinks.map((l) => l.person.id));
  const availablePeople = allPeople.filter(
    (p) => !connectedPersonIds.has(p.id),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            href={
              item.category
                ? `/collections/${encodeURIComponent(item.category)}`
                : '/collections'
            }
            className="text-xs text-muted hover:text-ink"
          >
            ← {labelForCategory(item.category)}
          </Link>
          <h1 className="font-serif text-3xl text-ink mt-1">{item.name}</h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/items/${item.id}/history`}>
            <Button variant="ghost" size="sm">History</Button>
          </Link>
          <Link href={`/items/${item.id}/edit`}>
            <Button variant="secondary">Edit</Button>
          </Link>
        </div>
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3">
          {photos.map((p) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={p.id}
              src={photoPublicUrl(p.storage_path)}
              alt={p.caption ?? ''}
              className="w-full aspect-square object-cover rounded-lg border border-hairline"
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Estimated value" value={formatMoney(item.value_amount, item.value_currency)} />
        <Field label="Condition" value={item.condition} />
        <Field label="Location" value={item.location} />
        <Field label="Acquired" value={formatDate(item.acquired_date)} />
        <Field label="Intended recipient" value={item.intended_recipient_name} />
        <Field label="Tagged for sale" value={item.tagged_for_sale ? 'Yes' : 'No'} />
      </div>

      {item.description && (
        <Section title="Description">
          <p className="text-ink-soft whitespace-pre-wrap">{item.description}</p>
        </Section>
      )}
      {item.provenance && (
        <Section title="Provenance">
          <p className="text-ink-soft whitespace-pre-wrap">{item.provenance}</p>
        </Section>
      )}
      {item.bequest_notes && (
        <Section title="Bequest notes">
          <p className="text-ink-soft whitespace-pre-wrap">{item.bequest_notes}</p>
        </Section>
      )}

      {preset && preset.fields.length > 0 && (
        <Section title={`${preset.label} details`}>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {preset.fields.map((f) => {
              const v = item.custom_fields?.[f.key];
              if (v == null || v === '') return null;
              return (
                <div key={f.key}>
                  <dt className="text-xs uppercase tracking-wide text-muted">{f.label}</dt>
                  <dd className="text-sm text-ink-soft">{String(v)}</dd>
                </div>
              );
            })}
          </dl>
        </Section>
      )}

      <Section title="Inheritance">
        <form
          action={setItemInheritance}
          className="space-y-4"
        >
          <input type="hidden" name="item_id" value={item.id} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className="block text-xs uppercase tracking-wider text-muted">
                Designated Inheritor
              </span>
              <select
                name="designated_inheritor_id"
                defaultValue={item.designated_inheritor_id ?? ''}
                className="w-full bg-paper border border-hairline rounded-lg px-3 h-10 text-sm"
              >
                <option value="">— Unassigned —</option>
                {allInheritors.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.display_name} · {STATUS_LABEL[i.status]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="block text-xs uppercase tracking-wider text-muted">
                Alternate Inheritor
              </span>
              <select
                name="alternate_inheritor_id"
                defaultValue={item.alternate_inheritor_id ?? ''}
                className="w-full bg-paper border border-hairline rounded-lg px-3 h-10 text-sm"
              >
                <option value="">— Unassigned —</option>
                {allInheritors.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.display_name} · {STATUS_LABEL[i.status]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block space-y-1.5">
            <span className="block text-xs uppercase tracking-wider text-muted">
              Assignment Confidence
            </span>
            <select
              name="assignment_confidence"
              defaultValue={item.assignment_confidence ?? ''}
              className="w-full bg-paper border border-hairline rounded-lg px-3 h-10 text-sm"
            >
              <option value="">—</option>
              <option value="confirmed">Confirmed</option>
              <option value="likely">Likely</option>
              <option value="undecided">Undecided</option>
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="block text-xs uppercase tracking-wider text-muted">
              Inheritance Notes
            </span>
            <textarea
              name="inheritance_notes"
              rows={2}
              defaultValue={item.inheritance_notes ?? ''}
              placeholder="To remain with the oldest grandchild in the family line."
              className="w-full bg-paper border border-hairline rounded-lg px-3 py-2 text-sm resize-y"
            />
          </label>
          <details className="text-sm text-ink-soft">
            <summary className="cursor-pointer text-xs uppercase tracking-wider text-muted hover:text-ink">
              Transfer instructions + legal reference
            </summary>
            <div className="mt-3 space-y-3">
              <label className="block space-y-1.5">
                <span className="block text-xs uppercase tracking-wider text-muted">
                  Transfer Instructions
                </span>
                <textarea
                  name="transfer_instructions"
                  rows={2}
                  defaultValue={item.transfer_instructions ?? ''}
                  className="w-full bg-paper border border-hairline rounded-lg px-3 py-2 text-sm resize-y"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="block text-xs uppercase tracking-wider text-muted">
                  Will / Legal Reference
                </span>
                <input
                  type="text"
                  name="legal_reference"
                  defaultValue={item.legal_reference ?? ''}
                  placeholder="Codicil A · Trust §2"
                  className="w-full bg-paper border border-hairline rounded-lg px-3 h-10 text-sm"
                />
              </label>
            </div>
          </details>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="text-xs text-muted">
              {designated && (
                <Link
                  href={`/inheritors/${designated.id}`}
                  className="inline-flex items-center gap-1.5 mr-3 hover:text-ink"
                >
                  <span
                    className={`text-[10px] uppercase tracking-widest font-medium px-1.5 py-0.5 rounded ${STATUS_BADGE_CLASS[designated.status]}`}
                  >
                    Primary
                  </span>
                  {designated.display_name}
                </Link>
              )}
              {alternate && (
                <Link
                  href={`/inheritors/${alternate.id}`}
                  className="inline-flex items-center gap-1.5 hover:text-ink"
                >
                  <span className="text-[10px] uppercase tracking-widest font-medium px-1.5 py-0.5 rounded bg-cream-soft text-ink">
                    Alternate
                  </span>
                  {alternate.display_name}
                </Link>
              )}
              {!designated && !alternate && (
                <span className="italic">No inheritor assigned.</span>
              )}
            </div>
            <button
              type="submit"
              className="inline-flex items-center px-4 h-9 rounded-lg bg-forest text-cream text-sm font-medium hover:bg-forest-deep"
            >
              Save inheritance
            </button>
          </div>
        </form>
      </Section>

      <Section title="Legacy People">
        {peopleLinks.length === 0 ? (
          <p className="text-sm text-muted italic">
            Nobody linked yet. Use the form below to add someone.
          </p>
        ) : (
          <ul className="space-y-2 mb-4">
            {peopleLinks.map(({ link, person }) => {
              const name = displayName(person);
              const dates = lifeDates(person);
              const photoUrl = person.profile_photo_path
                ? personPhotoPublicUrl(person.profile_photo_path)
                : null;
              return (
                <li
                  key={link.id}
                  className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-cream-soft transition-colors"
                >
                  <Link
                    href={`/people/${person.id}`}
                    className="shrink-0 relative w-10 h-10 rounded-full overflow-hidden bg-gold-soft/60 flex items-center justify-center"
                  >
                    {photoUrl ? (
                      <Image
                        src={photoUrl}
                        alt=""
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-sm font-semibold text-gold-deep">
                        {personInitials(person)}
                      </span>
                    )}
                  </Link>
                  <Link
                    href={`/people/${person.id}`}
                    className="flex-1 min-w-0"
                  >
                    <div className="text-sm font-medium text-ink truncate">
                      {name}
                    </div>
                    <div className="text-xs text-muted truncate">
                      {[person.relationship, dates]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                  </Link>
                  <span className="text-xs uppercase tracking-wider text-gold-deep shrink-0">
                    {ROLE_LABEL[link.role]}
                  </span>
                  <form action={removePersonFromItem}>
                    <input type="hidden" name="link_id" value={link.id} />
                    <input type="hidden" name="item_id" value={item.id} />
                    <button
                      type="submit"
                      className="text-muted hover:text-red-700 text-xs px-1"
                      aria-label="Unlink person"
                    >
                      ×
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}

        {availablePeople.length > 0 ? (
          <form
            action={addPersonToItem}
            className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-2 pt-3 border-t border-hairline"
          >
            <input type="hidden" name="item_id" value={item.id} />
            <label className="w-full sm:flex-1 sm:min-w-[160px]">
              <span className="block text-xs uppercase tracking-wider text-muted mb-1">
                Person
              </span>
              <select
                name="person_id"
                required
                className="w-full bg-paper border border-hairline rounded-lg px-3 h-10 text-sm"
              >
                {availablePeople.map((p) => (
                  <option key={p.id} value={p.id}>
                    {displayName(p)}
                  </option>
                ))}
              </select>
            </label>
            <label className="w-full sm:w-auto sm:min-w-[160px]">
              <span className="block text-xs uppercase tracking-wider text-muted mb-1">
                Role
              </span>
              <select
                name="role"
                defaultValue="owner"
                className="w-full bg-paper border border-hairline rounded-lg px-3 h-10 text-sm"
              >
                <option value="owner">Owner</option>
                <option value="inherited_from">Inherited From</option>
                <option value="current_custodian">Current Custodian</option>
                <option value="created_by">Created By</option>
                <option value="photographed">Photographed</option>
                <option value="mentioned_in">Mentioned In</option>
                <option value="related_to">Related To</option>
              </select>
            </label>
            <button
              type="submit"
              className="inline-flex items-center justify-center px-4 h-10 rounded-lg bg-forest text-cream text-sm font-medium hover:bg-forest-deep"
            >
              Link
            </button>
          </form>
        ) : (
          <p className="text-xs text-muted italic pt-3 border-t border-hairline">
            {allPeople.length === 0 ? (
              <>
                No people in your archive yet.{' '}
                <Link href="/people/new" className="text-forest underline">
                  Add a person
                </Link>{' '}
                to start linking them to items.
              </>
            ) : (
              <>All your people are already linked here.</>
            )}
          </p>
        )}
      </Section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="bg-paper border border-hairline rounded-lg p-3">
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className="text-sm text-ink-soft mt-1">{value || '—'}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted mb-2">{title}</h2>
      <div className="bg-paper border border-hairline rounded-xl p-4">{children}</div>
    </section>
  );
}
