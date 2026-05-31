'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';

export default function AvatarPicker({
  name,
  initialUrl,
}: {
  name: string;
  initialUrl?: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [originalFilename, setOriginalFilename] = useState<string>('avatar.jpg');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialUrl ?? null,
  );
  const [isSaving, setIsSaving] = useState(false);

  // Clean up object URLs on unmount.
  useEffect(() => {
    return () => {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
      if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setOriginalFilename(file.name);
    // Revoke any prior source URL so we don't leak.
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    setSourceUrl(URL.createObjectURL(file));
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  }

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function handleSave() {
    if (!sourceUrl || !croppedAreaPixels || !inputRef.current) return;
    setIsSaving(true);
    try {
      const blob = await cropToBlob(sourceUrl, croppedAreaPixels);
      // The output is always a JPEG, force the name's extension to match.
      const filename = swapExtension(originalFilename, 'jpg');
      const file = new File([blob], filename, { type: 'image/jpeg' });

      // Stash the cropped file into the hidden form input so the
      // existing server action picks it up under the same name.
      const dt = new DataTransfer();
      dt.items.add(file);
      inputRef.current.files = dt.files;

      // Update the visible preview.
      if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));

      // Exit the editor.
      URL.revokeObjectURL(sourceUrl);
      setSourceUrl(null);
      setCroppedAreaPixels(null);
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancel() {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    setSourceUrl(null);
    setCroppedAreaPixels(null);
    // Clear the hidden input so we don't accidentally submit a stale
    // file the user explicitly cancelled.
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="space-y-3">
      {/* Preview row + pick-photo button (hidden while editing) */}
      {!sourceUrl && (
        <div className="flex items-center gap-3">
          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-cream-soft border border-hairline">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-muted text-[10px] uppercase tracking-wider">
                No photo
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-sm px-3 h-10 rounded-lg bg-cream-soft text-ink border border-hairline hover:border-ink/40 transition-colors"
          >
            {previewUrl ? 'Change Photo' : 'Choose Photo'}
          </button>
        </div>
      )}

      {/* Cropper */}
      {sourceUrl && (
        <div className="space-y-3 bg-paper border border-hairline rounded-2xl p-3 sm:p-4">
          <div className="relative w-full aspect-square bg-black/80 rounded-xl overflow-hidden">
            <Cropper
              image={sourceUrl}
              crop={crop}
              zoom={zoom}
              minZoom={1}
              maxZoom={5}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] uppercase tracking-wider text-muted shrink-0">
              Zoom
            </span>
            <input
              type="range"
              min={1}
              max={5}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-forest"
            />
          </div>

          <p className="text-xs text-muted leading-relaxed">
            Pinch or scroll to zoom, drag to re-center on the right
            person. Press Save Crop when it looks right.
          </p>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="text-sm px-4 h-10 rounded-lg border border-ink/20 text-ink hover:border-ink/40 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!croppedAreaPixels || isSaving}
              className="text-sm px-4 h-10 rounded-lg bg-forest text-cream font-medium hover:bg-forest-deep disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? 'Saving…' : 'Save Crop'}
            </button>
          </div>
        </div>
      )}

      {/* The hidden input that the form action reads. */}
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}

async function cropToBlob(sourceUrl: string, area: Area): Promise<Blob> {
  const image = await loadImage(sourceUrl);
  // Cap the output at 1024 on the long side so we don't ship a
  // 12 MP avatar over the wire when a phone uploads a huge JPEG.
  const size = Math.min(1024, Math.round(area.width));
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    size,
    size,
  );
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error('canvas.toBlob returned null')),
      'image/jpeg',
      0.9,
    );
  });
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = url;
  });
}

function swapExtension(filename: string, ext: string): string {
  const dot = filename.lastIndexOf('.');
  if (dot < 0) return `${filename}.${ext}`;
  return `${filename.slice(0, dot)}.${ext}`;
}
