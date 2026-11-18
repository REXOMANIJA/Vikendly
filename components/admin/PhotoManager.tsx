'use client';

import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, GripVertical, ImagePlus, Loader2, UploadCloud, X } from 'lucide-react';

const ACCEPT = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

/**
 * House photos in admin:
 * - drop photos from the computer anywhere on this box (or click "Dodajte") to upload them;
 * - drag a photo to change the order (mouse: the whole photo; phone: the grip in the corner);
 *   the first one is the cover. The arrows still work too.
 */
export default function PhotoManager({
  photos,
  uploading,
  onUpload,
  onChange,
}: {
  photos: string[];
  /** Photos still being uploaded (shown as spinners) */
  uploading: number;
  onUpload: (files: File[]) => void;
  onChange: (photos: string[]) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [fileOver, setFileOver] = useState(false);
  const dragDepth = useRef(0);
  // Index of the photo being dragged (reorder), and where the drag started
  const [dragging, setDragging] = useState<number | null>(null);
  const start = useRef<{ x: number; y: number; index: number; active: boolean } | null>(null);

  // ── Files dropped from the computer ──
  const hasFiles = (e: React.DragEvent) => Array.from(e.dataTransfer.types).includes('Files');
  const onDragEnter = (e: React.DragEvent) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    dragDepth.current++;
    setFileOver(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    if (!hasFiles(e)) return;
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setFileOver(false);
  };
  const onDrop = (e: React.DragEvent) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    dragDepth.current = 0;
    setFileOver(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => ACCEPT.includes(f.type));
    if (files.length) onUpload(files);
  };

  // ── Reorder by dragging (pointer events: works with mouse and touch) ──
  const move = (from: number, to: number) => {
    if (from === to || to < 0 || to >= photos.length) return;
    const next = [...photos];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  const onPointerDown = (e: React.PointerEvent, index: number, fromHandle: boolean) => {
    // Phones scroll with the finger, so on touch only the grip starts a drag
    if (e.pointerType !== 'mouse' && !fromHandle) return;
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button:not([data-grip])')) return;
    start.current = { x: e.clientX, y: e.clientY, index, active: fromHandle && e.pointerType !== 'mouse' };
    if (start.current.active) setDragging(index);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const s = start.current;
    if (!s) return;
    // A small wobble is still a click, not a drag
    if (!s.active) {
      if (Math.hypot(e.clientX - s.x, e.clientY - s.y) < 6) return;
      s.active = true;
      setDragging(s.index);
    }
    e.preventDefault();
    const over = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-photo-index]');
    if (!over) return;
    const to = Number(over.dataset.photoIndex);
    if (to !== s.index) {
      move(s.index, to);
      s.index = to;
      setDragging(to);
    }
  };

  const endDrag = () => {
    start.current = null;
    setDragging(null);
  };

  return (
    <div
      onDragEnter={onDragEnter}
      onDragOver={(e) => hasFiles(e) && e.preventDefault()}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className="relative"
    >
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {photos.map((url, i) => (
          <li
            key={url}
            data-photo-index={i}
            onPointerDown={(e) => onPointerDown(e, i, false)}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className={`group relative aspect-[4/3] select-none overflow-hidden rounded-xl bg-background transition-[transform,box-shadow,opacity] duration-150 ${
              dragging === i
                ? 'z-10 scale-105 cursor-grabbing opacity-90 shadow-xl ring-2 ring-accent'
                : 'cursor-grab hover:ring-2 hover:ring-primary/30'
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" draggable={false} className="pointer-events-none size-full object-cover" />
            {i === 0 && (
              <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-white">Naslovna</span>
            )}
            <button
              type="button"
              data-grip
              onPointerDown={(e) => {
                e.stopPropagation();
                onPointerDown(e, i, true);
              }}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              className="absolute right-2 top-2 touch-none rounded-md bg-white/90 p-1.5 text-primary shadow-sm"
              aria-label="Prevucite da promenite redosled"
              title="Prevucite da promenite redosled"
            >
              <GripVertical className="size-4" />
            </button>
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/60 to-transparent p-2">
              <div className="flex gap-1">
                <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0}
                  className="rounded-md bg-white/90 p-1.5 disabled:opacity-30" aria-label="Pomeri levo">
                  <ArrowLeft className="size-4" />
                </button>
                <button type="button" onClick={() => move(i, i + 1)} disabled={i === photos.length - 1}
                  className="rounded-md bg-white/90 p-1.5 disabled:opacity-30" aria-label="Pomeri desno">
                  <ArrowRight className="size-4" />
                </button>
              </div>
              <button type="button" onClick={() => onChange(photos.filter((p) => p !== url))}
                className="rounded-md bg-white/90 p-1.5 text-accent-dark" aria-label="Ukloni fotografiju">
                <X className="size-4" />
              </button>
            </div>
          </li>
        ))}
        {Array.from({ length: uploading }).map((_, i) => (
          <li key={`up-${i}`} className="flex aspect-[4/3] items-center justify-center rounded-xl bg-background">
            <Loader2 className="size-6 animate-spin text-primary" aria-label="Otpremanje…" />
          </li>
        ))}
        <li>
          <button type="button" onClick={() => fileInput.current?.click()}
            className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-primary/30 px-2 text-center text-primary hover:bg-primary/5">
            <ImagePlus className="size-6" aria-hidden />
            <span className="text-sm font-medium">Dodajte fotografije</span>
            <span className="hidden text-xs text-text/55 sm:block">ili ih prevucite ovde</span>
          </button>
          <input ref={fileInput} type="file" accept={ACCEPT.join(',')} multiple className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) onUpload(Array.from(e.target.files));
              e.target.value = '';
            }} />
        </li>
      </ul>

      {/* Shown while photos from the computer are dragged over the box */}
      {fileOver && (
        <div className="pointer-events-none absolute -inset-2 z-20 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-accent bg-white/90 text-primary backdrop-blur-sm">
          <UploadCloud className="size-10 text-accent-dark" aria-hidden />
          <p className="font-serif text-xl font-bold">Pustite fotografije ovde</p>
          <p className="text-sm text-text/60">JPG, PNG, WebP ili AVIF</p>
        </div>
      )}
    </div>
  );
}
