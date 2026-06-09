'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { findCategory } from '@/lib/categories';
import type { Item } from '@/lib/types';
import type { AvailableCollection } from '@/lib/api';
import { saveItem, deleteItem } from './actions';
import PhotoManager from '@/components/PhotoManager';

type InitialItem = Partial<Item> & {
  inventory_id: string;
  name: string;
  category: string | null;
};

interface Props {
  mode: 'new' | 'edit';
  initial: InitialItem;
  collections: AvailableCollection[];
}

interface FormState {
  name: string;
  category: string;
  description: string;
  condition: string;
  location: string;
  value_amount: string;
  value_currency: string;
  acquired_date: string;
  provenance: string;
  notes: string;
  intended_recipient_name: string;
  intended_recipient_contact: string;
  bequest_notes: string;
  tagged_for_sale: boolean;
  custom_fields: Record<string, string>;
}

type Setter = <K extends keyof FormState>(k: K, v: FormState[K]) => void;

type StepKey = 'basics' | 'photos' | 'details' | 'provenance' | 'recipient' | 'review';

const STEPS: { key: StepKey; number: number; title: string; subtitle: string }[] = [
  { key: 'basics', number: 1, title: 'Basics', subtitle: 'Essential details' },
  { key: 'photos', number: 2, title: 'Photos', subtitle: 'Add images' },
  { key: 'details', number: 3, title: 'Details', subtitle: 'Physical & monetary' },
  { key: 'provenance', number: 4, title: 'Provenance', subtitle: 'History & origin' },
  { key: 'recipient', number: 5, title: 'Recipient', subtitle: "Who it's for" },
  { key: 'review', number: 6, title: 'Review', subtitle: 'Review & save' },
];

const DESCRIPTION_MAX = 1000;
const NOTES_MAX = 1000;

export default function ItemEditor({ mode, initial, collections }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<StepKey>('basics');
  const [form, setForm] = useState({
    name: initial.name ?? '',
    category: initial.category ?? '',
    description: initial.description ?? '',
    condition: initial.condition ?? '',
    location: initial.location ?? '',
    value_amount: initial.value_amount?.toString() ?? '',
    value_currency: initial.value_currency ?? 'USD',
    acquired_date: (initial.acquired_date as string | undefined) ?? '',
    provenance: initial.provenance ?? '',
    notes: initial.notes ?? '',
    intended_recipient_name: initial.intended_recipient_name ?? '',
    intended_recipient_contact: initial.intended_recipient_contact ?? '',
    bequest_notes: initial.bequest_notes ?? '',
    tagged_for_sale: initial.tagged_for_sale ?? false,
    custom_fields:
      (initial.custom_fields as Record<string, string>) ?? {},
  });

  const preset = findCategory(form.category);
  const stepIndex = STEPS.findIndex((s) => s.key === step);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  function setCustom(key: string, v: string) {
    setForm((f) => ({ ...f, custom_fields: { ...f.custom_fields, [key]: v } }));
  }

  function persist() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await saveItem({
          id: mode === 'edit' ? (initial.id as string) : null,
          inventory_id: initial.inventory_id,
          name: form.name,
          category: form.category || null,
          description: form.description,
          condition: form.condition,
          location: form.location,
          value_amount:
            form.value_amount === '' ? null : Number(form.value_amount),
          value_currency: form.value_currency,
          acquired_date: form.acquired_date || null,
          provenance: form.provenance,
          notes: form.notes,
          intended_recipient_name: form.intended_recipient_name,
          intended_recipient_contact: form.intended_recipient_contact,
          bequest_notes: form.bequest_notes,
          tagged_for_sale: form.tagged_for_sale,
          custom_fields: form.custom_fields,
        });
        router.push(`/items/${result.id}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Save failed');
      }
    });
  }

  function next() {
    if (stepIndex < STEPS.length - 1) setStep(STEPS[stepIndex + 1].key);
  }
  function prev() {
    if (stepIndex > 0) setStep(STEPS[stepIndex - 1].key);
  }

  async function handleDelete() {
    if (mode !== 'edit') return;
    if (!confirm(`Delete "${form.name}"? This cannot be undone.`)) return;
    startTransition(async () => {
      try {
        await deleteItem(initial.id as string);
        router.push('/collections');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Delete failed');
      }
    });
  }

  const canSave = form.name.trim().length > 0;

  return (
    <div className="space-y-4 pb-24">
      {/* Top bar */}
      <header className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Back"
          className="shrink-0 w-10 h-10 rounded-full border border-hairline bg-paper text-ink flex items-center justify-center hover:bg-cream-soft"
        >
          ←
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-serif text-xl sm:text-2xl text-ink leading-tight">
            {mode === 'new' ? 'Add new item' : 'Edit item'}
          </h1>
          <p className="text-xs sm:text-sm text-muted leading-snug">
            {mode === 'new'
              ? 'Catalog a new item in your heirloom inventory.'
              : 'Update the record for this item.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={persist}
            disabled={!canSave || pending}
            className="inline-flex items-center px-4 h-10 rounded-lg bg-forest text-cream text-sm font-medium hover:bg-forest-deep transition-colors disabled:opacity-50"
          >
            {pending ? 'Saving…' : 'Save item'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
        <StepSidebar steps={STEPS} active={step} onSelect={setStep} />

        <div className="bg-paper border border-hairline rounded-2xl p-5 sm:p-6 space-y-6">
          {step === 'basics' && (
            <BasicsStep
              form={form}
              set={set}
              collections={collections}
            />
          )}
          {step === 'photos' && (
            <PhotosStep mode={mode} initial={initial} />
          )}
          {step === 'details' && (
            <DetailsStep
              preset={preset}
              form={form}
              setCustom={setCustom}
            />
          )}
          {step === 'provenance' && (
            <ProvenanceStep form={form} set={set} />
          )}
          {step === 'recipient' && (
            <RecipientStep form={form} set={set} />
          )}
          {step === 'review' && (
            <ReviewStep
              form={form}
              preset={preset}
              onJump={setStep}
            />
          )}

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg py-2 px-3">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-2 border-t border-hairline">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-sm text-muted hover:text-ink underline"
            >
              Cancel
            </button>
            <div className="flex items-center gap-2">
              {stepIndex > 0 && (
                <button
                  type="button"
                  onClick={prev}
                  className="inline-flex items-center px-4 h-10 rounded-lg border border-ink/15 text-ink text-sm font-medium hover:border-ink/30"
                >
                  ← Back
                </button>
              )}
              {step !== 'review' ? (
                <button
                  type="button"
                  onClick={next}
                  className="inline-flex items-center gap-1 px-5 h-10 rounded-lg bg-forest text-cream text-sm font-medium hover:bg-forest-deep transition-colors"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={persist}
                  disabled={!canSave || pending}
                  className="inline-flex items-center px-5 h-10 rounded-lg bg-forest text-cream text-sm font-medium hover:bg-forest-deep transition-colors disabled:opacity-50"
                >
                  {pending ? 'Saving…' : 'Save item'}
                </button>
              )}
            </div>
          </div>

          {mode === 'edit' && step === 'review' && (
            <div className="pt-2 border-t border-hairline">
              <button
                type="button"
                onClick={handleDelete}
                disabled={pending}
                className="text-xs text-red-700 hover:underline"
              >
                Delete this item
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================== //
//  Sidebar                                                         //
// =============================================================== //

function StepSidebar({
  steps,
  active,
  onSelect,
}: {
  steps: typeof STEPS;
  active: StepKey;
  onSelect: (k: StepKey) => void;
}) {
  return (
    <aside className="space-y-3">
      <ol className="bg-paper border border-hairline rounded-2xl p-2 space-y-1 lg:space-y-1.5">
        {steps.map((s) => {
          const isActive = s.key === active;
          return (
            <li key={s.key}>
              <button
                type="button"
                onClick={() => onSelect(s.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                  isActive
                    ? 'bg-cream-soft'
                    : 'hover:bg-cream-soft/60'
                }`}
              >
                <span
                  className={`shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium ${
                    isActive
                      ? 'bg-forest text-cream'
                      : 'bg-cream-soft text-ink-soft border border-hairline'
                  }`}
                >
                  {s.number}
                </span>
                <div className="min-w-0">
                  <div className="font-medium text-sm text-ink leading-tight">
                    {s.title}
                  </div>
                  <div className="text-[11px] text-muted leading-tight mt-0.5">
                    {s.subtitle}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="hidden lg:flex items-start gap-3 bg-cream-soft/60 border border-hairline rounded-2xl p-3">
        <span className="shrink-0 w-7 h-7 rounded-full bg-gold-soft text-gold-deep flex items-center justify-center text-sm">
          ⓘ
        </span>
        <p className="text-xs text-ink-soft leading-relaxed">
          You can always edit or add more details later.
        </p>
      </div>
    </aside>
  );
}

// =============================================================== //
//  Step content                                                    //
// =============================================================== //

function StepHeader({ eyebrow, required }: { eyebrow: string; required?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-xs uppercase tracking-widest text-muted">
        {eyebrow}
      </span>
      {required && (
        <span className="text-xs text-red-700">
          <span aria-hidden>*</span> Required
        </span>
      )}
    </div>
  );
}

function BasicsStep({
  form,
  set,
  collections,
}: {
  form: FormState;
  set: Setter;
  collections: AvailableCollection[];
}) {
  return (
    <section className="space-y-5">
      <StepHeader eyebrow="Basics" required />

      <Field label="Name" required>
        <input
          required
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="e.g. Grandfather's walnut writing desk"
          className={inputClass()}
        />
      </Field>

      <Field
        label="Collection"
        hint="Choose an existing collection or create a new one."
      >
        <CollectionDropdown
          value={form.category}
          onChange={(v) => set('category', v)}
          collections={collections}
        />
      </Field>

      <Field label="Description">
        <textarea
          value={form.description}
          onChange={(e) =>
            set(
              'description',
              e.target.value.slice(0, DESCRIPTION_MAX),
            )
          }
          rows={4}
          placeholder="Add a brief description of the item, its significance, or any key details."
          className={inputClass()}
        />
        <CharCount value={form.description} max={DESCRIPTION_MAX} />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Condition">
          <input
            value={form.condition}
            onChange={(e) => set('condition', e.target.value)}
            placeholder="e.g. Excellent"
            className={inputClass()}
          />
        </Field>
        <Field label="Location">
          <input
            value={form.location}
            onChange={(e) => set('location', e.target.value)}
            placeholder="e.g. Living room"
            className={inputClass()}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Value">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">
              $
            </span>
            <input
              type="number"
              step="0.01"
              value={form.value_amount}
              onChange={(e) => set('value_amount', e.target.value)}
              placeholder="0.00"
              className={inputClass('pl-7')}
            />
          </div>
        </Field>
        <Field label="Currency">
          <select
            value={form.value_currency}
            onChange={(e) => set('value_currency', e.target.value)}
            className={inputClass()}
          >
            {['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Acquired date">
        <input
          type="date"
          value={form.acquired_date}
          onChange={(e) => set('acquired_date', e.target.value)}
          className={inputClass()}
        />
      </Field>

      <Field label="Notes (optional)" hint="Any additional notes about this item.">
        <textarea
          value={form.notes}
          onChange={(e) =>
            set('notes', e.target.value.slice(0, NOTES_MAX))
          }
          rows={3}
          placeholder="Add any extra notes here..."
          className={inputClass()}
        />
        <CharCount value={form.notes} max={NOTES_MAX} />
      </Field>
    </section>
  );
}

function PhotosStep({
  mode,
  initial,
}: {
  mode: 'new' | 'edit';
  initial: InitialItem;
}) {
  return (
    <section className="space-y-4">
      <StepHeader eyebrow="Photos" />
      {mode === 'edit' && initial.id ? (
        <PhotoManager itemId={initial.id} inventoryId={initial.inventory_id} />
      ) : (
        <div className="bg-cream-soft/60 border border-dashed border-hairline rounded-xl p-6 text-center">
          <p className="text-sm text-ink-soft">
            Save the item first to start adding photos. The photo
            manager opens automatically once the record exists.
          </p>
        </div>
      )}
    </section>
  );
}

function DetailsStep({
  preset,
  form,
  setCustom,
}: {
  preset: ReturnType<typeof findCategory>;
  form: { custom_fields: Record<string, string> };
  setCustom: (key: string, v: string) => void;
}) {
  if (!preset || preset.fields.length === 0) {
    return (
      <section className="space-y-4">
        <StepHeader eyebrow="Details" />
        <p className="text-sm text-ink-soft">
          No extra fields for this collection — feel free to skip.
        </p>
      </section>
    );
  }
  return (
    <section className="space-y-5">
      <StepHeader eyebrow={`${preset.label} details`} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {preset.fields.map((f) => (
          <Field key={f.key} label={f.label}>
            <input
              type={
                f.type === 'number'
                  ? 'number'
                  : f.type === 'date'
                    ? 'date'
                    : 'text'
              }
              value={(form.custom_fields[f.key] as string) ?? ''}
              onChange={(e) => setCustom(f.key, e.target.value)}
              className={inputClass()}
            />
          </Field>
        ))}
      </div>
    </section>
  );
}

function ProvenanceStep({
  form,
  set,
}: {
  form: FormState;
  set: Setter;
}) {
  return (
    <section className="space-y-5">
      <StepHeader eyebrow="Provenance" />
      <Field
        label="History & origin"
        hint="Where did this come from? Who owned it before you? What's its story?"
      >
        <textarea
          value={form.provenance}
          onChange={(e) => set('provenance', e.target.value)}
          rows={6}
          placeholder="Acquired from my grandmother in 1995..."
          className={inputClass()}
        />
      </Field>
    </section>
  );
}

function RecipientStep({
  form,
  set,
}: {
  form: FormState;
  set: Setter;
}) {
  return (
    <section className="space-y-5">
      <StepHeader eyebrow="Recipient" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Intended recipient">
          <input
            value={form.intended_recipient_name}
            onChange={(e) =>
              set('intended_recipient_name', e.target.value)
            }
            placeholder="Name"
            className={inputClass()}
          />
        </Field>
        <Field label="Contact">
          <input
            value={form.intended_recipient_contact}
            onChange={(e) =>
              set('intended_recipient_contact', e.target.value)
            }
            placeholder="Email or phone"
            className={inputClass()}
          />
        </Field>
      </div>
      <Field label="Bequest notes">
        <textarea
          value={form.bequest_notes}
          onChange={(e) => set('bequest_notes', e.target.value)}
          rows={4}
          placeholder="Any special instructions for handing this down."
          className={inputClass()}
        />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.tagged_for_sale}
          onChange={(e) => set('tagged_for_sale', e.target.checked)}
        />
        Tag this item for sale
      </label>
    </section>
  );
}

function ReviewStep({
  form,
  preset,
  onJump,
}: {
  form: FormState;
  preset: ReturnType<typeof findCategory>;
  onJump: (k: StepKey) => void;
}) {
  function Row({
    label,
    value,
    onEdit,
  }: {
    label: string;
    value: string;
    onEdit: () => void;
  }) {
    return (
      <div className="flex items-start justify-between gap-3 py-2 border-b border-hairline last:border-b-0">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wider text-muted">
            {label}
          </div>
          <div className="text-sm text-ink mt-0.5 break-words whitespace-pre-wrap">
            {value || <span className="text-muted italic">—</span>}
          </div>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="shrink-0 text-xs text-forest hover:underline"
        >
          Edit
        </button>
      </div>
    );
  }
  return (
    <section className="space-y-4">
      <StepHeader eyebrow="Review" />
      <div className="bg-cream-soft/40 border border-hairline rounded-xl p-4 space-y-0">
        <Row label="Name" value={form.name} onEdit={() => onJump('basics')} />
        <Row
          label="Collection"
          value={preset?.label ?? form.category}
          onEdit={() => onJump('basics')}
        />
        <Row
          label="Description"
          value={form.description}
          onEdit={() => onJump('basics')}
        />
        <Row
          label="Condition / Location"
          value={
            [form.condition, form.location].filter(Boolean).join(' · ') || ''
          }
          onEdit={() => onJump('basics')}
        />
        <Row
          label="Value"
          value={
            form.value_amount
              ? `${form.value_amount} ${form.value_currency}`
              : ''
          }
          onEdit={() => onJump('basics')}
        />
        <Row
          label="Acquired date"
          value={form.acquired_date}
          onEdit={() => onJump('basics')}
        />
        <Row
          label="Provenance"
          value={form.provenance}
          onEdit={() => onJump('provenance')}
        />
        <Row
          label="Recipient"
          value={
            [form.intended_recipient_name, form.intended_recipient_contact]
              .filter(Boolean)
              .join(' · ') || ''
          }
          onEdit={() => onJump('recipient')}
        />
        <Row label="Notes" value={form.notes} onEdit={() => onJump('basics')} />
      </div>
    </section>
  );
}

// =============================================================== //
//  Collection dropdown                                             //
// =============================================================== //

function CollectionDropdown({
  value,
  onChange,
  collections,
}: {
  value: string;
  onChange: (v: string) => void;
  collections: AvailableCollection[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const filtered = query
    ? collections.filter((c) =>
        c.label.toLowerCase().includes(query.toLowerCase()),
      )
    : collections;
  const selected = collections.find((c) => c.key === value) ?? null;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={inputClass('flex items-center justify-between text-left')}
        aria-expanded={open}
      >
        <span className={selected ? 'text-ink' : 'text-muted'}>
          {selected ? selected.label : 'Select a collection'}
        </span>
        <span className="text-muted text-xs">▾</span>
      </button>
      {open && (
        <div className="absolute z-10 left-0 right-0 mt-1.5 bg-paper border border-hairline rounded-xl shadow-card overflow-hidden">
          <div className="p-2 border-b border-hairline">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="🔍  Search collections"
              className={inputClass('text-sm')}
            />
          </div>
          <ul className="max-h-64 overflow-y-auto">
            {filtered.length === 0 && (
              <li className="px-3 py-4 text-center text-sm text-muted">
                No collections match.
              </li>
            )}
            {filtered.map((c) => (
              <li key={c.key}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(c.key);
                    setOpen(false);
                    setQuery('');
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-cream-soft ${
                    c.key === value ? 'bg-cream-soft/70' : ''
                  }`}
                >
                  <span className="shrink-0 w-9 h-9 rounded-md bg-cream-soft border border-hairline overflow-hidden relative">
                    {c.iconUrl ? (
                      <Image
                        src={c.iconUrl}
                        alt=""
                        fill
                        sizes="36px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-gold-deep">
                        ◇
                      </span>
                    )}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-medium text-sm text-ink truncate">
                      {c.label}
                    </span>
                    {c.isCustom && (
                      <span className="block text-[10px] uppercase tracking-widest text-gold-deep">
                        Custom
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-xs text-muted">
                    {c.itemCount} items
                  </span>
                  {c.key === value && (
                    <span className="shrink-0 text-forest text-sm">✓</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
          <a
            href="/collections/custom/new"
            className="flex items-center gap-2 px-3 py-3 border-t border-hairline text-sm text-forest hover:bg-cream-soft"
          >
            <span className="w-5 h-5 rounded-full bg-forest text-cream flex items-center justify-center text-xs">
              +
            </span>
            Create new collection
          </a>
        </div>
      )}
    </div>
  );
}

// =============================================================== //
//  Small primitives                                                //
// =============================================================== //

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block font-medium text-sm text-ink">
        {label}
        {required && <span className="text-red-700"> *</span>}
      </span>
      {hint && (
        <span className="block text-xs text-muted mt-0.5">{hint}</span>
      )}
      <div className="mt-2">{children}</div>
    </label>
  );
}

function CharCount({ value, max }: { value: string; max: number }) {
  return (
    <div className="text-right text-[11px] text-muted mt-1">
      {value.length}/{max}
    </div>
  );
}

function inputClass(extra = ''): string {
  return [
    'w-full bg-paper border border-hairline rounded-lg px-3 h-11 text-sm text-ink',
    'focus:outline-none focus:border-forest focus:ring-2 focus:ring-forest/15',
    'placeholder:text-muted',
    extra,
  ].join(' ');
}

function textareaClass(extra = ''): string {
  return [
    'w-full bg-paper border border-hairline rounded-lg px-3 py-2.5 text-sm text-ink',
    'focus:outline-none focus:border-forest focus:ring-2 focus:ring-forest/15',
    'placeholder:text-muted resize-y',
    extra,
  ].join(' ');
}
