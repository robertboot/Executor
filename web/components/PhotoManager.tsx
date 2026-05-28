'use client';

import { useEffect, useState, useTransition } from 'react';
import { Button } from './ui/Button';
import {
  deleteItemPhoto,
  listItemPhotosForEditor,
  uploadItemPhoto,
} from '@/app/(app)/items/[id]/edit/photo-actions';

interface PhotoRow {
  id: string;
  storage_path: string;
  caption: string | null;
  publicUrl: string;
}

export default function PhotoManager({
  itemId,
  inventoryId,
}: {
  itemId: string;
  inventoryId: string;
}) {
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [busy, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listItemPhotosForEditor(itemId).then(setPhotos).catch((e) =>
      setError(e instanceof Error ? e.message : 'Failed to load photos'),
    );
  }, [itemId]);

  function handleFiles(files: FileList) {
    setError(null);
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        startTransition(async () => {
          try {
            await uploadItemPhoto({
              itemId,
              inventoryId,
              imageBase64: base64,
              contentType: file.type,
            });
            const refreshed = await listItemPhotosForEditor(itemId);
            setPhotos(refreshed);
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Upload failed');
          }
        });
      };
      reader.readAsDataURL(file);
    });
  }

  async function remove(id: string) {
    if (!confirm('Remove this photo?')) return;
    startTransition(async () => {
      try {
        await deleteItemPhoto(id);
        setPhotos((p) => p.filter((x) => x.id !== id));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Delete failed');
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {photos.map((p) => (
          <div key={p.id} className="relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.publicUrl}
              alt=""
              className="w-full aspect-square object-cover rounded-lg border border-hairline"
            />
            <button
              type="button"
              onClick={() => remove(p.id)}
              className="absolute top-1 right-1 h-7 w-7 rounded-full bg-paper/90 border border-hairline text-ink text-xs hover:bg-red-50 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Remove photo"
            >
              ✕
            </button>
          </div>
        ))}
        <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-hairline rounded-lg cursor-pointer hover:border-forest hover:bg-cream-soft transition-colors">
          <input
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) handleFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <div className="text-2xl">+</div>
          <div className="text-xs text-muted mt-1">Add photo</div>
        </label>
      </div>
      {busy && <p className="text-xs text-muted">Uploading…</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}

// Re-export for symmetry — keeps the import surface small for callers.
export { Button };
