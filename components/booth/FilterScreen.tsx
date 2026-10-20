"use client";

import { useState } from "react";
import type { FrameManifest } from "@/lib/frames/types";
import type { SlotPhoto } from "@/lib/capture/types";
import type { FilterConfig } from "@/lib/filters/types";
import {
  canvasFilterSupported,
  compositeStrip,
} from "@/lib/composite/compositeStrip";
import { StripPreview } from "./StripPreview";
import { StickerButton } from "@/components/ui/StickerButton";

/** Layar Pilih filter.
 *
 *  Kepadatan: SEDANG (handoff §4) — strip tetap fokus, dekorasi maksimal 1
 *  sticky + 1 washi.
 *
 *  Filter dipilih SEKALI setelah semua slot beres, lalu dibakar saat komposit
 *  (diagram sistem §3). Foto mentah tidak pernah disentuh, jadi mengganti
 *  filter tidak pernah butuh foto ulang — itu sebabnya chip bisa diganti-ganti
 *  tanpa batas dan strip langsung ikut berubah. */
export function FilterScreen({
  frame,
  overlayUrl,
  photos,
  filters,
  selected,
  onSelect,
  onBack,
}: {
  frame: FrameManifest;
  overlayUrl: string;
  photos: Readonly<Record<number, SlotPhoto>>;
  filters: readonly FilterConfig[];
  selected: FilterConfig;
  onSelect: (filterId: string) => void;
  onBack: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Contoh untuk chip: foto pertama yang ada, supaya user melihat wajahnya
  // sendiri di tiap filter, bukan kotak warna.
  const sample = frame.slots.map((s) => photos[s.id]).find(Boolean) ?? null;

  const bakeable = canvasFilterSupported();

  async function download() {
    setBusy(true);
    setError(null);
    let url: string | null = null;
    try {
      const result = await compositeStrip({
        frame,
        photos,
        overlayUrl,
        filterCss: selected.css,
      });
      url = URL.createObjectURL(result.blob);
      const ext = result.blob.type === "image/png" ? "png" : "jpg";
      const a = document.createElement("a");
      a.href = url;
      a.download = `aliby-${frame.id}-${selected.id}-${Date.now()}.${ext}`;
      a.click();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat strip.");
    } finally {
      if (url) URL.revokeObjectURL(url);
      setBusy(false);
    }
  }

  return (
    <main className="board flex min-h-dvh flex-col items-center px-[var(--pad-screen)] py-6">
      <div className="flex w-full max-w-md items-center gap-2.5">
        <StickerButton
          variant="ghost"
          tilt={0}
          onClick={onBack}
          aria-label="Kembali ke tinjau strip"
          className="text-cream border-cream/60 h-[38px]! px-3!"
        >
          ‹
        </StickerButton>
        <h1
          className="disp text-cream text-display-s"
          style={{ ["--disp-stroke" as string]: "1.3px" }}
        >
          Pilih filter
        </h1>
      </div>

      <div className="flex w-full flex-1 items-center justify-center py-5">
        <StripPreview
          frame={frame}
          overlayUrl={overlayUrl}
          photos={photos}
          filterCss={selected.css}
          className="w-[170px] rotate-[-3deg]"
        />
      </div>

      <div className="flex w-full max-w-md flex-col items-center gap-3">
        <div
          role="radiogroup"
          aria-label="Filter warna"
          className="flex w-full gap-3 overflow-x-auto pb-1"
        >
          {filters.map((filter) => (
            <FilterChip
              key={filter.id}
              filter={filter}
              sample={sample}
              selected={filter.id === selected.id}
              onSelect={() => onSelect(filter.id)}
            />
          ))}
        </div>

        {!bakeable && (
          /* Sticky note: satu-satunya dekorasi berat di layar ini, dan ia
             membawa informasi — bukan hiasan. */
          <p className="bg-accent-yellow text-ink shadow-sticky font-sans text-caption max-w-xs rotate-[-2deg] px-3 py-2 text-center">
            Browser ini belum bisa membakar filter ke file. Pratinjau tetap
            berfilter, tapi hasil unduhannya polos.
          </p>
        )}

        {error && (
          <p className="font-sans text-caption text-accent-yellow max-w-xs text-center">
            {error}
          </p>
        )}

        <StickerButton
          variant="secondary"
          tilt={0.5}
          onClick={download}
          disabled={busy}
          className="w-full"
        >
          {busy ? "Menyiapkan…" : "↓ Unduh"}
        </StickerButton>
      </div>
    </main>
  );
}

function FilterChip({
  filter,
  sample,
  selected,
  onSelect,
}: {
  filter: FilterConfig;
  sample: SlotPhoto | null;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className="flex shrink-0 cursor-pointer flex-col items-center gap-1.5"
    >
      <span
        className={
          "rounded-chip block size-14 overflow-hidden " +
          (selected
            ? "border-brand-pink shadow-btn border-[3px]"
            : "border-cream/40 border-2")
        }
      >
        {sample ? (
          /* eslint-disable-next-line @next/next/no-img-element -- object URL dari Blob, bukan aset statis */
          <img
            src={sample.objectUrl}
            alt=""
            aria-hidden
            className="size-full object-cover"
            style={{ filter: filter.css }}
          />
        ) : (
          <span className="bg-photo-a block size-full" />
        )}
      </span>
      <span
        className={
          "font-sans text-caption whitespace-nowrap " +
          (selected ? "text-cream font-bold" : "text-cream/70")
        }
      >
        {filter.name}
      </span>
    </button>
  );
}
