'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { findCategory } from '@/lib/categories';
import type { Item } from '@/lib/types';
import { saveItem, deleteItem } from './actions';
import PhotoManager from '@/components/PhotoManager';

type InitialItem = Partial<Item> & {
  inventory_id: string;
  name: string;
  category: string | null;
};

export default function ItemEditor({
  mode,
  initial,
}: {
  mode: 'new' | 'edit';
  initial: InitialItem;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: initial.name ?? '',
    category: initial.category ?? '',
    description: initial.description ?? '',
    condition: initial.condition ?? '',
    location: initial.location ?? '',
    value_amount: initial.value_amount?.toString() ?? '',
    value_currency: initial.value_currency ?? 'USD',
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

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function setCustom(key: string, v: string) {
    setForm((f) => ({ ...f, custom_fields: { ...f.custom_fields, [key]: v } }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const payload = {
        ...form,
        category: form.category || null,
        value_amount: form.value_amount === '' ? null : Number(form.value_amount),
      };
      try {
        const result = await saveItem({
          id: mode === 'edit' ? (initial.id as string) : null,
          inventory_id: initial.inventory_id,
          ...payload,
        });
        router.push(`/items/${result.id}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Save failed');
      }
    });
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

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-5">
      <h1 className="font-serif text-3xl text-ink">
        {mode === 'new' ? 'Add new item' : 'Edit item'}
      </h1>

      {mode === 'edit' && initial.id && (
        <section>
          <h2 className="text-xs uppercase tracking-wide text-muted font-medium mb-2">
            Photos
          </h2>
          <PhotoManager itemId={initial.id} inventoryId={initial.inventory_id} />
        </section>
      )}

      <Field label="Name" required>
        <input
          required
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          className="input"
        />
      </Field>

      <Field label="Collection">
        <input
          value={form.category}
          onChange={(e) => set('category', e.target.value)}
          placeholder="e.g. art-paintings, or type a new collection name"
          className="input"
        />
      </Field>

      <Field label="Description">
        <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          rows={3}
          className="input"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Estimated value">
          <input
            type="number"
            step="0.01"
            value={form.value_amount}
            onChange={(e) => set('value_amount', e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Currency">
          <input
            value={form.value_currency}
            onChange={(e) => set('value_currency', e.target.value.toUpperCase())}
            maxLength={3}
            className="input"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Condition">
          <input
            value={form.condition}
            onChange={(e) => set('condition', e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Location">
          <input
            value={form.location}
            onChange={(e) => set('location', e.target.value)}
            className="input"
          />
        </Field>
      </div>

      {preset && preset.fields.length > 0 && (
        <fieldset className="space-y-3 border-t border-hairline pt-4">
          <legend className="text-xs uppercase tracking-wide text-muted">
            {preset.label} details
          </legend>
          {preset.fields.map((f) => (
            <Field key={f.key} label={f.label}>
              <input
                type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                value={(form.custom_fields[f.key] as string) ?? ''}
                onChange={(e) => setCustom(f.key, e.target.value)}
                className="input"
              />
            </Field>
          ))}
        </fieldset>
      )}

      <Field label="Provenance">
        <textarea
          value={form.provenance}
          onChange={(e) => set('provenance', e.target.value)}
          rows={2}
          className="input"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Intended recipient">
          <input
            value={form.intended_recipient_name}
            onChange={(e) => set('intended_recipient_name', e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Contact">
          <input
            value={form.intended_recipient_contact}
            onChange={(e) => set('intended_recipient_contact', e.target.value)}
            className="input"
          />
        </Field>
      </div>

      <Field label="Bequest notes">
        <textarea
          value={form.bequest_notes}
          onChange={(e) => set('bequest_notes', e.target.value)}
          rows={2}
          className="input"
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

      {error && <p className="text-sm text-red-700">{error}</p>}

      <div className="flex gap-3 justify-between pt-3">
        <div className="flex gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving…' : mode === 'new' ? 'Create item' : 'Save'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
            disabled={pending}
          >
            Cancel
          </Button>
        </div>
        {mode === 'edit' && (
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={handleDelete}
            disabled={pending}
          >
            Delete
          </Button>
        )}
      </div>

      <style>{`
        .input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          background: #FFFFFF;
          border: 1px solid #E5DDD0;
          font-size: 0.875rem;
          color: #1F2937;
          outline: none;
        }
        .input:focus {
          border-color: #0F3D2E;
          box-shadow: 0 0 0 2px rgba(15, 61, 46, 0.15);
        }
      `}</style>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wide text-muted font-medium">
        {label}
        {required && <span className="text-red-700"> *</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
