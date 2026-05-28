import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getItem, listPhotos, photoPublicUrl } from '@/lib/api';
import { findCategory, labelForCategory } from '@/lib/categories';
import { formatDate, formatMoney } from '@/lib/format';
import { Button } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getItem(id);
  if (!item) notFound();

  const photos = await listPhotos(id);
  const preset = findCategory(item.category);

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
        <Link href={`/items/${item.id}/edit`}>
          <Button variant="secondary">Edit</Button>
        </Link>
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
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
