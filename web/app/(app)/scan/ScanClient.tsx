'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { recognizePhoto, type ScanMatch } from './actions';

export default function ScanClient() {
  const [preview, setPreview] = useState<string | null>(null);
  const [matches, setMatches] = useState<ScanMatch[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleFile(file: File) {
    setError(null);
    setMatches(null);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);
      const base64 = dataUrl.split(',')[1];
      startTransition(async () => {
        try {
          const result = await recognizePhoto({
            imageBase64: base64,
            contentType: file.type,
          });
          setMatches(result);
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Recognition failed');
        }
      });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-5">
      <label className="block border-2 border-dashed border-hairline rounded-2xl p-8 text-center cursor-pointer hover:border-forest hover:bg-cream-soft transition-colors">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        <div className="text-4xl mb-2">📸</div>
        <div className="font-medium text-ink">Take a photo or upload one</div>
        <div className="text-sm text-muted mt-1">
          We&rsquo;ll match it against the inventory in under a second.
        </div>
      </label>

      {preview && (
        <div className="bg-paper border border-hairline rounded-xl p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt=""
            className="w-full max-h-72 object-contain rounded-lg"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => {
              setPreview(null);
              setMatches(null);
              setError(null);
            }}
          >
            Clear
          </Button>
        </div>
      )}

      {pending && (
        <p className="text-sm text-muted">Searching the inventory…</p>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 text-sm whitespace-pre-wrap">
          {error}
        </div>
      )}

      {matches && matches.length === 0 && !pending && (
        <div className="bg-paper border border-hairline rounded-xl p-5 text-center">
          <p className="font-medium text-ink">No matches found.</p>
          <p className="text-sm text-muted mt-1">
            This object doesn&rsquo;t look like anything currently in the
            inventory.
          </p>
        </div>
      )}

      {matches && matches.length > 0 && (
        <div>
          <h2 className="text-xs uppercase tracking-wide text-muted font-medium mb-2">
            Likely matches
          </h2>
          <ul className="space-y-2">
            {matches.map((m) => (
              <li key={m.item_id}>
                <Link
                  href={`/items/${m.item_id}`}
                  className="flex items-center gap-4 bg-paper border border-hairline rounded-xl p-3 hover:shadow-card transition-shadow"
                >
                  {m.photo_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.photo_url}
                      alt=""
                      className="w-16 h-16 object-cover rounded-lg border border-hairline"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-ink truncate">{m.name}</div>
                    <div className="text-xs text-muted">{m.category ?? '—'}</div>
                  </div>
                  <div className="text-sm text-forest font-medium">
                    {Math.round(m.similarity * 100)}%
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
